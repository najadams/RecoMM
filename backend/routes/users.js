const express = require('express');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

// @desc    Get all users (admin only)
// @route   GET /api/users
// @access  Private/Admin
router.get('/', protect, adminOnly, async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Get all users - Coming soon'
  });
});

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Get user by ID - Coming soon'
  });
});

module.exports = router;