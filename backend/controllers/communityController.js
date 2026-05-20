const Post = require('../models/Post');
const Comment = require('../models/Comment');
const { createNotification } = require('./notificationController');

// Helper to emit feed updates
const emitFeedUpdate = (req, event, data) => {
  if (req.io) req.io.emit(event, data);
};

// @desc    Get social feed
exports.getFeed = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean(); // Faster

    // ✅ FIX: Single aggregation instead of N+1 loop queries
    // Old code ran 1 DB query PER post (50 posts = 50 queries!)
    if (posts.length > 0) {
      const postIds = posts.map((p) => p._id);
      const commentCounts = await Comment.aggregate([
        { $match: { post: { $in: postIds } } },
        { $group: { _id: '$post', count: { $sum: 1 } } },
      ]);

      // Build a lookup map: postId -> count
      const countMap = {};
      commentCounts.forEach((c) => {
        countMap[c._id.toString()] = c.count;
      });

      // Attach count to each post
      posts.forEach((post) => {
        post.commentCount = countMap[post._id.toString()] || 0;
      });
    }

    res.json({ success: true, posts });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to get feed.' });
  }
};

// @desc    Create post
exports.createPost = async (req, res) => {
  const { content, tags } = req.body;
  if (!content) return res.status(400).json({ success: false, message: 'Content is required.' });

  try {
    const post = await Post.create({
      user: req.user._id,
      content,
      tags: tags || [],
    });

    const populatedPost = await post.populate('user', 'name avatar');
    const postObj = populatedPost.toObject();
    postObj.commentCount = 0;

    emitFeedUpdate(req, 'new_post', postObj);
    res.json({ success: true, post: postObj });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create post.' });
  }
};

// @desc    Delete post
exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found.' });

    if (post.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized.' });
    }

    await Post.deleteOne({ _id: req.params.id });
    await Comment.deleteMany({ post: req.params.id });

    emitFeedUpdate(req, 'delete_post', req.params.id);
    res.json({ success: true, message: 'Post deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete post.' });
  }
};

// @desc    Like/Unlike post
exports.toggleLike = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found.' });

    const index = post.likes.indexOf(req.user._id);
    if (index === -1) {
      post.likes.push(req.user._id);
      // Notify post owner (await added — was missing, causing unhandled rejections)
      await createNotification(req, post.user, req.user._id, 'like', `${req.user.name} liked your post.`, `/post/${post._id}`);
    } else {
      post.likes.splice(index, 1);
    }

    await post.save();
    emitFeedUpdate(req, 'post_updated', { id: post._id, likes: post.likes });
    res.json({ success: true, likes: post.likes });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to toggle like.' });
  }
};

// @desc    Add comment
exports.addComment = async (req, res) => {
  const { content } = req.body;
  if (!content) return res.status(400).json({ success: false, message: 'Content is required.' });

  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found.' });

    const comment = await Comment.create({
      post: req.params.id,
      user: req.user._id,
      content,
    });

    const populated = await comment.populate('user', 'name avatar');
    
    // Notify (await added — was missing, causing unhandled rejections)
    await createNotification(req, post.user, req.user._id, 'comment', `${req.user.name} commented on your post.`, `/post/${post._id}`);

    if (req.io) req.io.emit('new_comment', { postId: post._id, comment: populated });
    
    res.json({ success: true, comment: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to add comment.' });
  }
};

// @desc    Get comments
exports.getComments = async (req, res) => {
  try {
    const comments = await Comment.find({ post: req.params.id })
      .populate('user', 'name avatar')
      .sort({ createdAt: 1 });
    res.json({ success: true, comments });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get comments.' });
  }
};

// @desc    Get user profile
exports.getUserProfile = async (req, res) => {
  try {
    const User = require('../models/User');
    const Portfolio = require('../models/Portfolio');
    
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    const posts = await Post.find({ user: req.params.id })
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 });
      
    // Count comments for user posts
    const postsWithCounts = await Promise.all(posts.map(async (post) => {
      const p = post.toObject();
      p.commentCount = await Comment.countDocuments({ post: post._id });
      return p;
    }));

    // Optionally get a public version of their portfolio (e.g. just symbols and pnl)
    const portfolio = await Portfolio.findOne({ user: req.params.id });
    let publicPortfolio = null;
    
    if (portfolio) {
       publicPortfolio = {
         totalPnL: portfolio.totalPnL,
         pnlPercent: portfolio.pnlPercent,
         topHoldings: portfolio.holdings.slice(0, 3).map(h => ({ symbol: h.symbol, pnlPercent: h.pnlPercent }))
       };
    }

    res.json({ success: true, user, posts: postsWithCounts, portfolio: publicPortfolio });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to get user profile.' });
  }
};
