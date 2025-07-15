const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Please provide a username'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username cannot exceed 30 characters']
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    match: [
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      'Please provide a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't include password in queries by default
  },
  avatar: {
    type: String,
    default: null
  },
  preferences: {
    favoriteGenres: [{
      type: String,
      enum: ['fiction', 'non-fiction', 'mystery', 'romance', 'sci-fi', 'fantasy', 'biography', 'history', 'self-help', 'business', 'other']
    }],
    readingGoal: {
      type: Number,
      default: 12 // books per year
    },
    preferredLanguage: {
      type: String,
      default: 'en'
    }
  },
  readingHistory: [{
    bookId: {
      type: String,
      required: true
    },
    title: String,
    author: String,
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    status: {
      type: String,
      enum: ['want-to-read', 'currently-reading', 'read'],
      default: 'want-to-read'
    },
    dateAdded: {
      type: Date,
      default: Date.now
    },
    dateCompleted: Date,
    review: String
  }],
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for better query performance
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate JWT token
userSchema.methods.generateAuthToken = function() {
  return jwt.sign(
    { 
      id: this._id,
      username: this.username,
      email: this.email,
      role: this.role
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};

// Get user profile (without sensitive data)
userSchema.methods.getPublicProfile = function() {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.__v;
  return userObject;
};

// Add book to reading history
userSchema.methods.addToReadingHistory = function(bookData) {
  const existingBook = this.readingHistory.find(
    book => book.bookId === bookData.bookId
  );
  
  if (existingBook) {
    // Update existing entry
    Object.assign(existingBook, bookData);
  } else {
    // Add new entry
    this.readingHistory.push(bookData);
  }
  
  return this.save();
};

// Update reading preferences
userSchema.methods.updatePreferences = function(newPreferences) {
  this.preferences = { ...this.preferences, ...newPreferences };
  return this.save();
};

module.exports = mongoose.model('User', userSchema);