const express = require('express');
const { protect, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// @desc    Search books
// @route   GET /api/books/search
// @access  Public
router.get('/search', optionalAuth, async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Book search - Coming soon'
  });
});

// @desc    Get book details
// @route   GET /api/books/:id
// @access  Public
router.get('/:id', optionalAuth, async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Get book details - Coming soon'
  });
});

// @desc    Rate a book
// @route   POST /api/books/:id/rate
// @access  Private
router.post('/:id/rate', protect, async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Rate book - Coming soon'
  });
});

module.exports = router;