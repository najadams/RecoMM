const mongoose = require('mongoose');

const readingHistorySchema = new mongoose.Schema({
  bookId: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  authors: [String],
  genres: [String],
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  status: {
    type: String,
    enum: ['want-to-read', 'reading', 'read', 'did-not-finish'],
    default: 'want-to-read'
  },
  dateAdded: {
    type: Date,
    default: Date.now
  },
  dateStarted: Date,
  dateFinished: Date,
  review: String,
  tags: [String],
  readingProgress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  timeSpentReading: {
    type: Number, // in minutes
    default: 0
  },
  source: {
    type: String,
    enum: ['recommendation', 'search', 'manual', 'feedback'],
    default: 'manual'
  },
  lastInteraction: {
    type: Date,
    default: Date.now
  }
});

const preferenceSchema = new mongoose.Schema({
  genres: [{
    name: String,
    weight: {
      type: Number,
      default: 1
    }
  }],
  authors: [{
    name: String,
    weight: {
      type: Number,
      default: 1
    }
  }],
  themes: [String],
  excludeGenres: [String],
  readingLevel: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'intermediate'
  },
  bookLength: {
    type: String,
    enum: ['short', 'medium', 'long', 'any'],
    default: 'any'
  },
  publicationPeriod: {
    type: String,
    enum: ['classic', 'modern', 'contemporary', 'any'],
    default: 'any'
  },
  mood: {
    type: String,
    default: 'neutral'
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

const recommendationFeedbackSchema = new mongoose.Schema({
  bookId: {
    type: String,
    required: true
  },
  feedback: {
    type: String,
    enum: ['like', 'dislike', 'not_interested', 'already_read'],
    required: true
  },
  bookData: {
    title: String,
    authors: [String],
    genres: [String]
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const userPreferencesSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  preferences: preferenceSchema,
  readingHistory: [readingHistorySchema],
  recommendationFeedback: [recommendationFeedbackSchema],
  lastRecommendationUpdate: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
userPreferencesSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Instance methods
userPreferencesSchema.methods.addToReadingHistory = function(bookData) {
  // Check if book already exists in history
  const existingIndex = this.readingHistory.findIndex(
    book => book.bookId === bookData.bookId
  );
  
  if (existingIndex !== -1) {
    // Update existing entry
    const updatedData = { 
      ...this.readingHistory[existingIndex].toObject(), 
      ...bookData,
      lastInteraction: new Date()
    };
    this.readingHistory[existingIndex] = updatedData;
  } else {
    // Add new entry with interaction tracking
    const newEntry = {
      ...bookData,
      lastInteraction: new Date(),
      source: bookData.source || 'manual'
    };
    this.readingHistory.push(newEntry);
  }
  
  return this.save();
};

userPreferencesSchema.methods.updateBookStatus = function(bookId, status, additionalData = {}) {
  const book = this.readingHistory.find(book => book.bookId === bookId);
  
  if (book) {
    book.status = status;
    book.lastInteraction = new Date();
    
    // Update dates based on status
    if (status === 'reading' && !book.dateStarted) {
      book.dateStarted = new Date();
      book.readingProgress = 0; // Reset progress when starting
    } else if (status === 'read' && !book.dateFinished) {
      book.dateFinished = new Date();
      book.readingProgress = 100; // Mark as 100% complete
    } else if (status === 'did-not-finish') {
      // Keep current progress, don't set dateFinished
      book.dateFinished = null;
    }
    
    // Add additional data with validation
    if (additionalData.rating !== undefined) {
      // Only set rating if it's a valid value (1-5) or remove it if 0
      if (additionalData.rating >= 1 && additionalData.rating <= 5) {
        book.rating = additionalData.rating;
      } else if (additionalData.rating === 0) {
        book.rating = undefined; // Remove rating if set to 0
      }
    }
    
    // Add other fields safely
    if (additionalData.review !== undefined) book.review = additionalData.review;
    if (additionalData.tags !== undefined) book.tags = additionalData.tags;
    if (additionalData.progress !== undefined) book.readingProgress = additionalData.progress;
    if (additionalData.title !== undefined) book.title = additionalData.title;
    if (additionalData.authors !== undefined) book.authors = additionalData.authors;
    if (additionalData.genres !== undefined) book.genres = additionalData.genres;
  } else {
    // Book doesn't exist in reading history, create a new entry
    const newBookEntry = {
      bookId,
      title: additionalData.title || 'Unknown Title',
      authors: additionalData.authors || [],
      genres: additionalData.genres || [],
      status,
      lastInteraction: new Date(),
      source: 'manual',
      readingProgress: 0,
      timeSpentReading: 0
    };
    
    // Only add rating if it's a valid value (1-5)
    if (additionalData.rating && additionalData.rating >= 1 && additionalData.rating <= 5) {
      newBookEntry.rating = additionalData.rating;
    }
    
    // Add other optional fields
    if (additionalData.review) newBookEntry.review = additionalData.review;
    if (additionalData.tags) newBookEntry.tags = additionalData.tags;
    if (additionalData.progress !== undefined) newBookEntry.readingProgress = additionalData.progress;
    
    // Set appropriate dates based on status
    if (status === 'reading') {
      newBookEntry.dateStarted = new Date();
    } else if (status === 'read') {
      newBookEntry.dateFinished = new Date();
      newBookEntry.readingProgress = 100;
    }
    
    this.readingHistory.push(newBookEntry);
  }
  
  return this.save();
};

userPreferencesSchema.methods.addRecommendationFeedback = function(feedbackData) {
  this.recommendationFeedback.push(feedbackData);
  
  // Update preferences based on feedback
  this.updatePreferencesFromFeedback(feedbackData);
  
  return this.save();
};

userPreferencesSchema.methods.updatePreferencesFromFeedback = function(feedbackData) {
  const { feedback, bookData } = feedbackData;
  
  if (!bookData.genres) return;
  
  // Adjust genre preferences based on feedback
  bookData.genres.forEach(genre => {
    const existingGenre = this.preferences.genres.find(g => g.name === genre);
    
    if (existingGenre) {
      // Adjust weight based on feedback
      if (feedback === 'like') {
        existingGenre.weight = Math.min(existingGenre.weight + 0.1, 2);
      } else if (feedback === 'dislike') {
        existingGenre.weight = Math.max(existingGenre.weight - 0.2, 0.1);
      }
    } else if (feedback === 'like') {
      // Add new preferred genre
      this.preferences.genres.push({ name: genre, weight: 1.1 });
    }
  });
  
  // Similar logic for authors
  if (bookData.authors) {
    bookData.authors.forEach(author => {
      const existingAuthor = this.preferences.authors.find(a => a.name === author);
      
      if (existingAuthor) {
        if (feedback === 'like') {
          existingAuthor.weight = Math.min(existingAuthor.weight + 0.15, 2);
        } else if (feedback === 'dislike') {
          existingAuthor.weight = Math.max(existingAuthor.weight - 0.25, 0.1);
        }
      } else if (feedback === 'like') {
        this.preferences.authors.push({ name: author, weight: 1.15 });
      }
    });
  }
  
  this.preferences.lastUpdated = new Date();
};

userPreferencesSchema.methods.getReadingStats = function() {
  const stats = {
    totalBooks: this.readingHistory.length,
    booksRead: this.readingHistory.filter(book => book.status === 'read').length,
    booksReading: this.readingHistory.filter(book => book.status === 'reading').length,
    booksWantToRead: this.readingHistory.filter(book => book.status === 'want-to-read').length,
    booksDidNotFinish: this.readingHistory.filter(book => book.status === 'did-not-finish').length,
    averageRating: 0,
    favoriteGenres: [],
    favoriteAuthors: [],
    readingStreak: 0,
    totalTimeSpentReading: 0,
    averageReadingProgress: 0,
    recentActivity: []
  };
  
  // Calculate average rating
  const ratedBooks = this.readingHistory.filter(book => book.rating);
  if (ratedBooks.length > 0) {
    stats.averageRating = ratedBooks.reduce((sum, book) => sum + book.rating, 0) / ratedBooks.length;
  }
  
  // Calculate total time spent reading
  stats.totalTimeSpentReading = this.readingHistory.reduce((total, book) => total + (book.timeSpentReading || 0), 0);
  
  // Calculate average reading progress
  if (this.readingHistory.length > 0) {
    stats.averageReadingProgress = this.readingHistory.reduce((total, book) => total + (book.readingProgress || 0), 0) / this.readingHistory.length;
  }
  
  // Get recent activity (last 10 interactions)
  stats.recentActivity = this.readingHistory
    .sort((a, b) => new Date(b.lastInteraction) - new Date(a.lastInteraction))
    .slice(0, 10)
    .map(book => ({
      bookId: book.bookId,
      title: book.title,
      status: book.status,
      lastInteraction: book.lastInteraction,
      source: book.source
    }));
  
  // Get favorite genres from preferences
  stats.favoriteGenres = this.preferences.genres
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 5)
    .map(genre => ({ name: genre.name, weight: genre.weight }));
  
  // Get favorite authors from preferences
  stats.favoriteAuthors = this.preferences.authors
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 5)
    .map(author => ({ name: author.name, weight: author.weight }));
  
  return stats;
};

// Method to update reading progress
userPreferencesSchema.methods.updateReadingProgress = function(bookId, progress, timeSpent = 0) {
  const book = this.readingHistory.find(book => book.bookId === bookId);
  
  if (book) {
    book.readingProgress = Math.max(0, Math.min(100, progress));
    book.timeSpentReading = (book.timeSpentReading || 0) + timeSpent;
    book.lastInteraction = new Date();
    
    // Auto-update status based on progress
    if (progress >= 100 && book.status !== 'read') {
      book.status = 'read';
      book.dateFinished = new Date();
    } else if (progress > 0 && book.status === 'want-to-read') {
      book.status = 'reading';
      book.dateStarted = new Date();
    }
  }
  
  return this.save();
};

// Static methods
userPreferencesSchema.statics.findByUserId = function(userId) {
  return this.findOne({ userId });
};

userPreferencesSchema.statics.createForUser = function(userId, initialPreferences = {}) {
  return this.create({
    userId,
    preferences: {
      genres: [],
      authors: [],
      themes: [],
      excludeGenres: [],
      ...initialPreferences
    },
    readingHistory: [],
    recommendationFeedback: []
  });
};

module.exports = mongoose.model('UserPreferences', userPreferencesSchema);