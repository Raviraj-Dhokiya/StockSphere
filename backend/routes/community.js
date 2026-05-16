const express = require('express');
const { protect } = require('../middleware/auth');
const { getFeed, createPost, deletePost, toggleLike, addComment, getComments, getUserProfile } = require('../controllers/communityController');

const router = express.Router();

router.use(protect);

router.get('/feed', getFeed);
router.post('/posts', createPost);
router.delete('/posts/:id', deletePost);
router.post('/posts/:id/like', toggleLike);
router.post('/posts/:id/comments', addComment);
router.get('/posts/:id/comments', getComments);
router.get('/profile/:id', getUserProfile);

module.exports = router;
