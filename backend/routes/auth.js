const express = require('express');
const {
  register,
  login,
  getMe,
  logout,
  updateProfile,
  changePassword
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { validate, validateRegister, validateLogin, validateProfileUpdate, validatePasswordChange } = require('../utils/validation');

const router = express.Router();

// Public routes
router.post('/register', validate(validateRegister), register);
router.post('/login', validate(validateLogin), login);

// Protected routes
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);
router.put('/profile', protect, validate(validateProfileUpdate), updateProfile);
router.put('/password', protect, validate(validatePasswordChange), changePassword);

module.exports = router;