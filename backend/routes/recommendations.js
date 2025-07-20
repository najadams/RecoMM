const express = require('express');
const router = express.Router();
const { protect: auth } = require('../middleware/auth');
const UserPreferences = require('../models/UserPreferences');
const AIRecommendationService = require('../services/aiRecommendationService');
const Joi = require('joi');

// Validation schemas
const preferenceUpdateSchema = Joi.object({
  preferences: Joi.object({
    genres: Joi.array().items(Joi.object({
      name: Joi.string().required(),
      weight: Joi.number().min(0.1).max(2).default(1)
    })),
    authors: Joi.array().items(Joi.object({
      name: Joi.string().required(),
      weight: Joi.number().min(0.1).max(2).default(1)
    })),
    themes: Joi.array().items(Joi.string()),
    excludeGenres: Joi.array().items(Joi.string()),
    readingLevel: Joi.string().valid('beginner', 'intermediate', 'advanced'),
    bookLength: Joi.string().valid('short', 'medium', 'long', 'any'),
    publicationPeriod: Joi.string().valid('classic', 'modern', 'contemporary', 'any'),
    mood: Joi.string()
  }),
  naturalLanguageInput: Joi.string().min(10).max(500)
});

const feedbackSchema = Joi.object({
  bookId: Joi.string().required(),
  feedback: Joi.string().valid('like', 'dislike', 'not_interested', 'already_read').required(),
  bookData: Joi.object({
    title: Joi.string(),
    authors: Joi.array().items(Joi.string()),
    genres: Joi.array().items(Joi.string()),
    description: Joi.string(),
    publishedDate: Joi.string(),
    pageCount: Joi.number()
  })
});

const readingHistorySchema = Joi.object({
  bookId: Joi.string().required(),
  title: Joi.string().required(),
  authors: Joi.array().items(Joi.string()),
  genres: Joi.array().items(Joi.string()),
  rating: Joi.number().min(1).max(5),
  status: Joi.string().valid('want-to-read', 'reading', 'read', 'did-not-finish'),
  review: Joi.string(),
  tags: Joi.array().items(Joi.string()),
  dateStarted: Joi.date(),
  dateFinished: Joi.date()
});

// Get personalized recommendations
router.get('/', auth, async (req, res) => {
  try {
    const { limit = 10, mood, genres, excludeGenres } = req.query;
    
    // Get or create user preferences
    let userPrefs = await UserPreferences.findByUserId(req.user.id);
    if (!userPrefs) {
      userPrefs = await UserPreferences.createForUser(req.user.id);
    }
    
    // Prepare recommendation request
    const recommendationRequest = {
      userPreferences: userPrefs.preferences,
      readingHistory: userPrefs.readingHistory,
      recommendationFeedback: userPrefs.recommendationFeedback,
      filters: {
        mood: mood || userPrefs.preferences.mood,
        genres: genres ? genres.split(',') : undefined,
        excludeGenres: excludeGenres ? excludeGenres.split(',') : userPrefs.preferences.excludeGenres,
        limit: Math.min(parseInt(limit), 20)
      }
    };
    
    // Get AI-powered recommendations
    const recommendations = await AIRecommendationService.getPersonalizedRecommendations(recommendationRequest);
    
    // Update last recommendation timestamp
    userPrefs.lastRecommendationUpdate = new Date();
    await userPrefs.save();
    
    res.json({
      success: true,
      recommendations,
      metadata: {
        totalRecommendations: recommendations.length,
        basedOnHistory: userPrefs.readingHistory.length > 0,
        lastUpdated: userPrefs.lastRecommendationUpdate,
        userStats: userPrefs.getReadingStats()
      }
    });
    
  } catch (error) {
    console.error('Recommendation error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to generate recommendations',
      message: error.message 
    });
  }
});

// Get smart recommendations based on natural language input
router.post('/smart', auth, async (req, res) => {
  try {
    const { naturalLanguageInput, limit = 10 } = req.body;
    
    if (!naturalLanguageInput || naturalLanguageInput.trim().length < 10) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a detailed description of what you\'re looking for (at least 10 characters)'
      });
    }
    
    // Get user preferences for context
    let userPrefs = await UserPreferences.findByUserId(req.user.id);
    if (!userPrefs) {
      userPrefs = await UserPreferences.createForUser(req.user.id);
    }
    
    // Get AI-powered smart recommendations
    const recommendations = await AIRecommendationService.getSmartRecommendations({
      naturalLanguageInput: naturalLanguageInput.trim(),
      userContext: {
        preferences: userPrefs.preferences,
        readingHistory: userPrefs.readingHistory.slice(-10), // Last 10 books for context
        stats: userPrefs.getReadingStats()
      },
      limit: Math.min(parseInt(limit), 15)
    });
    
    res.json({
      success: true,
      recommendations,
      query: naturalLanguageInput,
      metadata: {
        totalRecommendations: recommendations.length,
        aiGenerated: true,
        timestamp: new Date()
      }
    });
    
  } catch (error) {
    console.error('Smart recommendation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate smart recommendations',
      message: error.message
    });
  }
});

// Update user preferences
router.put('/preferences', auth, async (req, res) => {
  try {
    const { error, value } = preferenceUpdateSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid preference data',
        details: error.details
      });
    }
    
    let userPrefs = await UserPreferences.findByUserId(req.user.id);
    if (!userPrefs) {
      userPrefs = await UserPreferences.createForUser(req.user.id);
    }
    
    // If natural language input is provided, analyze it with AI
    if (value.naturalLanguageInput) {
      try {
        const aiPreferences = await AIRecommendationService.analyzeUserPreferences(value.naturalLanguageInput);
        
        // Merge AI-analyzed preferences with existing ones
        if (aiPreferences.genres) {
          aiPreferences.genres.forEach(genre => {
            const existing = userPrefs.preferences.genres.find(g => g.name.toLowerCase() === genre.name.toLowerCase());
            if (existing) {
              existing.weight = Math.max(existing.weight, genre.weight);
            } else {
              userPrefs.preferences.genres.push(genre);
            }
          });
        }
        
        if (aiPreferences.themes) {
          userPrefs.preferences.themes = [...new Set([...userPrefs.preferences.themes, ...aiPreferences.themes])];
        }
        
        if (aiPreferences.mood) {
          userPrefs.preferences.mood = aiPreferences.mood;
        }
        
        if (aiPreferences.readingLevel) {
          userPrefs.preferences.readingLevel = aiPreferences.readingLevel;
        }
        
      } catch (aiError) {
        console.warn('AI preference analysis failed:', aiError.message);
        // Continue with manual preferences if AI fails
      }
    }
    
    // Update with manual preferences
    if (value.preferences) {
      Object.assign(userPrefs.preferences, value.preferences);
    }
    
    userPrefs.preferences.lastUpdated = new Date();
    await userPrefs.save();
    
    res.json({
      success: true,
      preferences: userPrefs.preferences,
      message: 'Preferences updated successfully'
    });
    
  } catch (error) {
    console.error('Preference update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update preferences',
      message: error.message
    });
  }
});

// Get user preferences and reading stats
router.get('/preferences', auth, async (req, res) => {
  try {
    let userPrefs = await UserPreferences.findByUserId(req.user.id);
    if (!userPrefs) {
      userPrefs = await UserPreferences.createForUser(req.user.id);
    }
    
    const stats = userPrefs.getReadingStats();
    
    res.json({
      success: true,
      preferences: userPrefs.preferences,
      readingStats: stats,
      historyCount: userPrefs.readingHistory.length,
      feedbackCount: userPrefs.recommendationFeedback.length
    });
    
  } catch (error) {
    console.error('Get preferences error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get preferences',
      message: error.message
    });
  }
});

// Add book to reading history
router.post('/reading-history', auth, async (req, res) => {
  try {
    const { error, value } = readingHistorySchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid reading history data',
        details: error.details
      });
    }
    
    let userPrefs = await UserPreferences.findByUserId(req.user.id);
    if (!userPrefs) {
      userPrefs = await UserPreferences.createForUser(req.user.id);
    }
    
    await userPrefs.addToReadingHistory(value);
    
    res.json({
      success: true,
      message: 'Book added to reading history',
      stats: userPrefs.getReadingStats()
    });
    
  } catch (error) {
    console.error('Reading history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add to reading history',
      message: error.message
    });
  }
});

// Update book status in reading history
router.put('/reading-history/:bookId', auth, async (req, res) => {
  try {
    const { bookId } = req.params;
    const { status, rating, review, tags, dateStarted, dateFinished } = req.body;
    
    if (!['want-to-read', 'reading', 'read', 'did-not-finish'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be one of: want-to-read, reading, read, did-not-finish'
      });
    }
    
    let userPrefs = await UserPreferences.findByUserId(req.user.id);
    if (!userPrefs) {
      return res.status(404).json({
        success: false,
        error: 'User preferences not found'
      });
    }
    
    const additionalData = {};
    if (rating !== undefined) additionalData.rating = rating;
    if (review !== undefined) additionalData.review = review;
    if (tags !== undefined) additionalData.tags = tags;
    if (dateStarted !== undefined) additionalData.dateStarted = dateStarted;
    if (dateFinished !== undefined) additionalData.dateFinished = dateFinished;
    
    await userPrefs.updateBookStatus(bookId, status, additionalData);
    
    res.json({
      success: true,
      message: 'Book status updated',
      stats: userPrefs.getReadingStats()
    });
    
  } catch (error) {
    console.error('Update book status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update book status',
      message: error.message
    });
  }
});

// Get recommendation history
router.get('/history', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    let userPrefs = await UserPreferences.findByUserId(req.user.id);
    if (!userPrefs) {
      return res.json({
        success: true,
        readingHistory: [],
        feedback: [],
        pagination: { page: 1, limit: 20, total: 0, pages: 0 }
      });
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const totalHistory = userPrefs.readingHistory.length;
    const totalFeedback = userPrefs.recommendationFeedback.length;
    
    // Get paginated reading history
    const paginatedHistory = userPrefs.readingHistory
      .sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded))
      .slice(skip, skip + parseInt(limit));
    
    // Get recent feedback
    const recentFeedback = userPrefs.recommendationFeedback
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 50); // Last 50 feedback items
    
    res.json({
      success: true,
      readingHistory: paginatedHistory,
      feedback: recentFeedback,
      stats: userPrefs.getReadingStats(),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalHistory,
        pages: Math.ceil(totalHistory / parseInt(limit))
      }
    });
    
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get recommendation history',
      message: error.message
    });
  }
});

// Save recommendation feedback with automatic status tracking
router.post('/feedback', auth, async (req, res) => {
  try {
    const { error, value } = feedbackSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid feedback data',
        details: error.details
      });
    }
    
    let userPrefs = await UserPreferences.findByUserId(req.user.id);
    if (!userPrefs) {
      userPrefs = await UserPreferences.createForUser(req.user.id);
    }
    
    // Automatically update reading status based on feedback
    if (value.feedback === 'already_read') {
      // Add to reading history with 'read' status if not already there
      const existingBook = userPrefs.readingHistory.find(book => book.bookId === value.bookId);
      if (!existingBook && value.bookData) {
        await userPrefs.addToReadingHistory({
          bookId: value.bookId,
          title: value.bookData.title,
          authors: value.bookData.authors || [],
          genres: value.bookData.genres || [],
          status: 'read',
          dateFinished: new Date(),
          dateAdded: new Date(),
          source: 'feedback',
          readingProgress: 100
        });
      } else if (existingBook && existingBook.status !== 'read') {
        await userPrefs.updateBookStatus(value.bookId, 'read', {
          dateFinished: new Date(),
          readingProgress: 100
        });
      }
    } else if (value.feedback === 'like' && value.bookData) {
      // Add to reading history with 'want-to-read' status if user likes it
      const existingBook = userPrefs.readingHistory.find(book => book.bookId === value.bookId);
      if (!existingBook) {
        await userPrefs.addToReadingHistory({
          bookId: value.bookId,
          title: value.bookData.title,
          authors: value.bookData.authors || [],
          genres: value.bookData.genres || [],
          status: 'want-to-read',
          dateAdded: new Date(),
          source: 'feedback'
        });
      }
    }
    
    await userPrefs.addRecommendationFeedback(value);
    
    // Learn from feedback to improve future recommendations
    try {
      await AIRecommendationService.learnFromFeedback({
        userId: req.user.id,
        feedback: value,
        userPreferences: userPrefs.preferences,
        readingHistory: userPrefs.readingHistory
      });
    } catch (learningError) {
      console.warn('AI learning from feedback failed:', learningError.message);
      // Don't fail the request if learning fails
    }
    
    res.json({
      success: true,
      message: 'Feedback saved successfully',
      updatedPreferences: userPrefs.preferences,
      readingStatusUpdated: value.feedback === 'already_read' || value.feedback === 'like'
    });
    
  } catch (error) {
    console.error('Save feedback error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save feedback',
      message: error.message
    });
  }
});

// Start reading a book (automatically updates status to 'reading')
router.post('/start-reading/:bookId', auth, async (req, res) => {
  try {
    const { bookId } = req.params;
    const { bookData } = req.body;
    
    if (!bookData || !bookData.title) {
      return res.status(400).json({
        success: false,
        error: 'Book data with title is required'
      });
    }
    
    let userPrefs = await UserPreferences.findByUserId(req.user.id);
    if (!userPrefs) {
      userPrefs = await UserPreferences.createForUser(req.user.id);
    }
    
    // Check if book exists in reading history
    const existingBook = userPrefs.readingHistory.find(book => book.bookId === bookId);
    
    if (existingBook) {
      // Update existing book to 'reading' status
      await userPrefs.updateBookStatus(bookId, 'reading', {
        dateStarted: new Date()
      });
    } else {
      // Add new book with 'reading' status
      await userPrefs.addToReadingHistory({
        bookId,
        title: bookData.title,
        authors: bookData.authors || [],
        genres: bookData.genres || [],
        thumbnail: bookData.thumbnail || bookData.cover,
        cover: bookData.cover || bookData.thumbnail,
        description: bookData.description,
        publishedDate: bookData.publishedDate,
        pageCount: bookData.pageCount,
        rating: bookData.rating,
        status: 'reading',
        dateStarted: new Date(),
        dateAdded: new Date(),
        source: 'manual',
        readingProgress: 0
      });
    }
    
    res.json({
      success: true,
      message: 'Started reading book',
      bookStatus: 'reading',
      stats: userPrefs.getReadingStats()
    });
    
  } catch (error) {
    console.error('Start reading error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start reading book',
      message: error.message
    });
  }
});

// Complete reading a book (automatically updates status to 'read')
router.post('/complete-reading/:bookId', auth, async (req, res) => {
  try {
    const { bookId } = req.params;
    const { rating, review, tags } = req.body;
    
    let userPrefs = await UserPreferences.findByUserId(req.user.id);
    if (!userPrefs) {
      return res.status(404).json({
        success: false,
        error: 'User preferences not found'
      });
    }
    
    const existingBook = userPrefs.readingHistory.find(book => book.bookId === bookId);
    if (!existingBook) {
      return res.status(404).json({
        success: false,
        error: 'Book not found in reading history'
      });
    }
    
    const additionalData = {
      dateFinished: new Date()
    };
    
    if (rating !== undefined) additionalData.rating = rating;
    if (review !== undefined) additionalData.review = review;
    if (tags !== undefined) additionalData.tags = tags;
    
    await userPrefs.updateBookStatus(bookId, 'read', additionalData);
    
    // Auto-learn preferences from completed book
    if (rating && rating >= 4 && existingBook.genres) {
      existingBook.genres.forEach(genre => {
        const existingGenre = userPrefs.preferences.genres.find(g => g.name.toLowerCase() === genre.toLowerCase());
        if (existingGenre) {
          existingGenre.weight = Math.min(existingGenre.weight + 0.1, 2);
        } else {
          userPrefs.preferences.genres.push({ name: genre, weight: 1.1 });
        }
      });
      
      if (existingBook.authors) {
        existingBook.authors.forEach(author => {
          const existingAuthor = userPrefs.preferences.authors.find(a => a.name.toLowerCase() === author.toLowerCase());
          if (existingAuthor) {
            existingAuthor.weight = Math.min(existingAuthor.weight + 0.15, 2);
          } else {
            userPrefs.preferences.authors.push({ name: author, weight: 1.15 });
          }
        });
      }
      
      userPrefs.preferences.lastUpdated = new Date();
      await userPrefs.save();
    }
    
    res.json({
      success: true,
      message: 'Book marked as completed',
      bookStatus: 'read',
      stats: userPrefs.getReadingStats(),
      preferencesUpdated: rating && rating >= 4
    });
    
  } catch (error) {
    console.error('Complete reading error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete reading book',
      message: error.message
    });
  }
});

// Add book to want-to-read list
router.post('/want-to-read/:bookId', auth, async (req, res) => {
  try {
    const { bookId } = req.params;
    const { bookData } = req.body;
    
    if (!bookData || !bookData.title) {
      return res.status(400).json({
        success: false,
        error: 'Book data with title is required'
      });
    }
    
    let userPrefs = await UserPreferences.findByUserId(req.user.id);
    if (!userPrefs) {
      userPrefs = await UserPreferences.createForUser(req.user.id);
    }
    
    // Check if book already exists
    const existingBook = userPrefs.readingHistory.find(book => book.bookId === bookId);
    
    if (existingBook) {
      if (existingBook.status === 'want-to-read') {
        return res.json({
          success: true,
          message: 'Book already in want-to-read list',
          bookStatus: 'want-to-read'
        });
      } else {
        return res.status(400).json({
          success: false,
          error: `Book already exists with status: ${existingBook.status}`
        });
      }
    }
    
    // Add new book with 'want-to-read' status
    await userPrefs.addToReadingHistory({
      bookId,
      title: bookData.title,
      authors: bookData.authors || [],
      genres: bookData.genres || [],
      thumbnail: bookData.thumbnail || bookData.cover,
      cover: bookData.cover || bookData.thumbnail,
      description: bookData.description,
      publishedDate: bookData.publishedDate,
      pageCount: bookData.pageCount,
      rating: bookData.rating,
      status: 'want-to-read',
      dateAdded: new Date(),
      source: 'manual'
    });
    
    res.json({
      success: true,
      message: 'Book added to want-to-read list',
      bookStatus: 'want-to-read',
      stats: userPrefs.getReadingStats()
    });
    
  } catch (error) {
    console.error('Want to read error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add book to want-to-read list',
      message: error.message
    });
  }
});

// Update reading progress for a book
router.put('/reading-progress/:bookId', auth, async (req, res) => {
  try {
    const { bookId } = req.params;
    const { progress, timeSpent } = req.body;
    
    // Validate input
    if (progress === undefined || progress < 0 || progress > 100) {
      return res.status(400).json({
        success: false,
        error: 'Progress must be between 0 and 100'
      });
    }
    
    let userPrefs = await UserPreferences.findByUserId(req.user.id);
    if (!userPrefs) {
      return res.status(404).json({
        success: false,
        error: 'User preferences not found'
      });
    }
    
    const book = userPrefs.readingHistory.find(book => book.bookId === bookId);
    if (!book) {
      return res.status(404).json({
        success: false,
        error: 'Book not found in reading history'
      });
    }
    
    await userPrefs.updateReadingProgress(bookId, progress, timeSpent || 0);
    
    const updatedBook = userPrefs.readingHistory.find(book => book.bookId === bookId);
    
    res.json({
      success: true,
      message: 'Reading progress updated',
      bookData: updatedBook,
      statusChanged: updatedBook.status !== book.status
    });
    
  } catch (error) {
    console.error('Update reading progress error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update reading progress',
      message: error.message
    });
  }
});

// Get book status for a specific user
router.get('/book-status/:bookId', auth, async (req, res) => {
  try {
    const { bookId } = req.params;
    
    let userPrefs = await UserPreferences.findByUserId(req.user.id);
    if (!userPrefs) {
      return res.json({
        success: true,
        bookStatus: null,
        inReadingHistory: false
      });
    }
    
    const book = userPrefs.readingHistory.find(book => book.bookId === bookId);
    
    res.json({
      success: true,
      bookStatus: book ? book.status : null,
      inReadingHistory: !!book,
      bookData: book || null
    });
    
  } catch (error) {
    console.error('Get book status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get book status',
      message: error.message
    });
  }
});

// Get trending recommendations (no auth required)
router.get('/trending', async (req, res) => {
  try {
    const { limit = 10, genre, timeframe = 'week' } = req.query;
    
    const trendingBooks = await AIRecommendationService.getTrendingRecommendations({
      limit: Math.min(parseInt(limit), 20),
      genre,
      timeframe
    });
    
    res.json({
      success: true,
      trending: trendingBooks,
      metadata: {
        timeframe,
        genre: genre || 'all',
        generatedAt: new Date()
      }
    });
    
  } catch (error) {
    console.error('Trending recommendations error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get trending recommendations',
      message: error.message
    });
  }
});

module.exports = router;