import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  fetchFeed,
  createPost,
  toggleLike,
  addLivePost,
  removeLivePost,
  updateLivePost,
  incrementCommentCount,
} from '../store/slices/communitySlice';
import communityService from '../services/communityService';
import io from 'socket.io-client';
import toast from 'react-hot-toast';

const CommunityPage = () => {
  const dispatch = useDispatch();
  const { posts, loading } = useSelector((state) => state.community);
  const { user } = useSelector((state) => state.auth);

  const [newPost, setNewPost] = useState('');
  const [tags, setTags] = useState('');
  const [postLoading, setPostLoading] = useState(false);

  const [commentingOn, setCommentingOn] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState({});
  const [commentLoading, setCommentLoading] = useState({});

  // Initialize feed
  useEffect(() => {
    dispatch(fetchFeed());
  }, [dispatch]);

  // Socket connection - properly scoped in useEffect
  useEffect(() => {
    const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
      transports: ['websocket', 'polling'],
    });

    socket.on('new_post', (post) => dispatch(addLivePost(post)));
    socket.on('delete_post', (postId) => dispatch(removeLivePost(postId)));
    socket.on('post_updated', (data) => dispatch(updateLivePost(data)));

    socket.on('new_comment', ({ postId, comment }) => {
      dispatch(incrementCommentCount(postId));
      setComments((prev) => {
        if (!prev[postId]) return prev;
        // Prevent duplicates
        if (prev[postId].some((c) => c._id === comment._id)) return prev;
        return { ...prev, [postId]: [...prev[postId], comment] };
      });
    });

    return () => {
      socket.off('new_post');
      socket.off('delete_post');
      socket.off('post_updated');
      socket.off('new_comment');
      socket.disconnect();
    };
  }, [dispatch]);

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!newPost.trim()) return;
    setPostLoading(true);

    const tagArray = tags.split(',').map((t) => t.trim().toUpperCase()).filter((t) => t);

    const result = await dispatch(createPost({ content: newPost, tags: tagArray }));
    if (createPost.fulfilled.match(result)) {
      setNewPost('');
      setTags('');
      toast.success('Post published! 🎉');
    } else {
      toast.error(result.payload || 'Failed to post');
    }
    setPostLoading(false);
  };

  const handleLike = (postId) => {
    dispatch(toggleLike(postId));
  };

  const loadComments = async (postId) => {
    if (commentingOn === postId) {
      setCommentingOn(null);
      return;
    }
    setCommentingOn(postId);
    if (!comments[postId]) {
      try {
        const res = await communityService.getComments(postId);
        setComments((prev) => ({ ...prev, [postId]: res.comments }));
      } catch (err) {
        toast.error('Failed to load comments');
      }
    }
  };

  const handleCommentSubmit = async (e, postId) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setCommentLoading((prev) => ({ ...prev, [postId]: true }));

    try {
      await communityService.addComment(postId, commentText);
      setCommentText('');
      toast.success('Comment added!');
    } catch (err) {
      toast.error('Failed to post comment');
    } finally {
      setCommentLoading((prev) => ({ ...prev, [postId]: false }));
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Delete this post?')) return;
    try {
      await communityService.deletePost(postId);
      toast.success('Post deleted');
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const isLiked = (post) => post.likes.includes(user?._id);
  const charLeft = 1000 - newPost.length;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="font-display font-bold text-3xl text-white">Community Feed</h1>
        <p className="text-gray-400 mt-1">Share insights, analysis, and trading ideas</p>
      </div>

      {/* Create Post */}
      <div className="card p-5">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-accent-purple flex items-center justify-center text-white font-bold font-display flex-shrink-0">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <form onSubmit={handlePostSubmit} className="space-y-3">
              <textarea
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                placeholder="Share your trading thoughts, analysis, or questions..."
                className="input-field min-h-[100px] resize-none"
                maxLength={1000}
              />
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <input
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="Tags: AAPL, TSLA, MSFT..."
                    className="input-field py-2 text-sm flex-1 min-w-0"
                  />
                  <span className={`text-xs font-mono flex-shrink-0 ${charLeft < 50 ? 'text-accent-red' : 'text-gray-600'}`}>
                    {charLeft}
                  </span>
                </div>
                <button
                  type="submit"
                  disabled={postLoading || !newPost.trim()}
                  className="btn-primary py-2 px-6 w-full sm:w-auto flex-shrink-0"
                >
                  {postLoading ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-dark-900/30 border-t-dark-900 rounded-full animate-spin" />
                      Posting...
                    </span>
                  ) : 'Post'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Feed */}
      {loading && posts.length === 0 ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="skeleton w-10 h-10 rounded-full" />
                <div className="space-y-1 flex-1">
                  <div className="skeleton h-4 w-32 rounded" />
                  <div className="skeleton h-3 w-20 rounded" />
                </div>
              </div>
              <div className="skeleton h-16 rounded" />
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 bg-dark-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="font-display font-bold text-xl text-white mb-2">No posts yet</h3>
          <p className="text-gray-400">Be the first to share your insights!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <div key={post._id} className="card p-5 hover:border-gray-600 transition-colors">
              {/* Post header */}
              <div className="flex justify-between items-start mb-4">
                <Link to={`/profile/${post.user._id}`} className="flex items-center gap-3 group">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-purple to-accent-blue flex items-center justify-center text-white font-bold font-display flex-shrink-0">
                    {post.user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <span className="font-bold text-white group-hover:text-accent-green transition-colors block">
                      {post.user.name}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(post.createdAt).toLocaleString()}
                    </span>
                  </div>
                </Link>
                {post.user._id === user?._id && (
                  <button
                    onClick={() => handleDeletePost(post._id)}
                    className="text-gray-600 hover:text-accent-red transition-colors p-1.5 rounded-lg hover:bg-accent-red-dim"
                    title="Delete post"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Post content */}
              <p className="text-gray-200 whitespace-pre-wrap leading-relaxed">{post.content}</p>

              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {post.tags.map((tag) => (
                    <Link
                      key={tag}
                      to={`/stock/${tag}`}
                      className="text-xs font-mono text-accent-blue hover:text-accent-green bg-accent-blue-dim hover:bg-accent-green-dim px-2 py-1 rounded-lg transition-colors"
                    >
                      ${tag}
                    </Link>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-6 mt-4 pt-4 border-t border-surface-border">
                <button
                  onClick={() => handleLike(post._id)}
                  className={`flex items-center gap-2 text-sm font-medium transition-all ${
                    isLiked(post)
                      ? 'text-accent-red scale-100'
                      : 'text-gray-400 hover:text-accent-red'
                  }`}
                >
                  <svg
                    className="w-5 h-5 transition-transform hover:scale-110"
                    fill={isLiked(post) ? 'currentColor' : 'none'}
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <span>{post.likes.length}</span>
                </button>

                <button
                  onClick={() => loadComments(post._id)}
                  className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                    commentingOn === post._id ? 'text-accent-green' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span>{post.commentCount} {post.commentCount === 1 ? 'Comment' : 'Comments'}</span>
                </button>
              </div>

              {/* Comments Section */}
              {commentingOn === post._id && (
                <div className="mt-4 space-y-3 animate-fade-in">
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {!comments[post._id] ? (
                      <div className="flex justify-center py-4">
                        <div className="w-5 h-5 border-2 border-surface-border border-t-accent-green rounded-full animate-spin" />
                      </div>
                    ) : comments[post._id].length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">No comments yet. Be the first!</p>
                    ) : (
                      comments[post._id].map((c) => (
                        <div key={c._id} className="flex gap-3 bg-dark-800 p-3 rounded-xl">
                          <div className="w-8 h-8 rounded-full bg-accent-purple flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {c.user.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-sm text-white">{c.user.name}</span>
                              <span className="text-[10px] text-gray-500">{new Date(c.createdAt).toLocaleString()}</span>
                            </div>
                            <p className="text-sm text-gray-300 mt-0.5 break-words">{c.content}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <form onSubmit={(e) => handleCommentSubmit(e, post._id)} className="flex gap-2">
                    <input
                      type="text"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Write a comment..."
                      className="input-field py-2 text-sm flex-1"
                      maxLength={500}
                    />
                    <button
                      type="submit"
                      disabled={!commentText.trim() || commentLoading[post._id]}
                      className="btn-primary py-2 px-4 text-sm disabled:opacity-50 flex-shrink-0"
                    >
                      {commentLoading[post._id] ? '...' : 'Send'}
                    </button>
                  </form>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CommunityPage;
