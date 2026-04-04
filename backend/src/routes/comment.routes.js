const express = require('express');
const router = express.Router({ mergeParams: true });
const { authenticate } = require('../middleware/auth');
const { addComment, getComments, deleteComment } = require('../controllers/commentController');

router.use(authenticate);
router.post('/', addComment);
router.get('/', getComments);
router.delete('/:commentId', deleteComment);

module.exports = router;
