const OpenAI = require('openai');
const natural = require('natural');
const axios = require('axios');

class AIRecommendationService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    this.stemmer = natural.PorterStemmer;
    this.tokenizer = new natural.WordTokenizer();
  }

  /**
   * Analyze user's natural language input to extract book preferences
   * @param {string} userInput - Natural language description of book preferences
   * @returns {Object} Structured preferences object
   */
  async analyzeUserPreferences(userInput) {
    try {
      const prompt = `
        Analyze the following user input about book preferences and extract structured information:
        
        User Input: "${userInput}"
        
        Please return a JSON object with the following structure:
        {
          "genres": ["genre1", "genre2"],
          "themes": ["theme1", "theme2"],
          "mood": "mood_description",
          "characterTypes": ["character_type1"],
          "settings": ["setting1"],
          "authors": ["author1"],
          "keywords": ["keyword1", "keyword2"],
          "excludeGenres": ["genre_to_avoid"],
          "readingLevel": "beginner|intermediate|advanced",
          "bookLength": "short|medium|long",
          "publicationPeriod": "classic|modern|contemporary"
        }
        
        Only include fields that can be inferred from the user input. Return valid JSON only.
      `;

      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 500
      });

      const content = response.choices[0].message.content.trim();
      return JSON.parse(content);
    } catch (error) {
      console.error('Error analyzing user preferences:', error);
      // Fallback to basic keyword extraction
      return this.extractBasicPreferences(userInput);
    }
  }

  /**
   * Fallback method for basic preference extraction using NLP
   * @param {string} userInput 
   * @returns {Object} Basic preferences object
   */
  extractBasicPreferences(userInput) {
    const tokens = this.tokenizer.tokenize(userInput.toLowerCase());
    const stemmedTokens = tokens.map(token => this.stemmer.stem(token));
    
    const genreKeywords = {
      'mystery': ['mystery', 'detective', 'crime', 'thriller', 'suspense'],
      'romance': ['romance', 'love', 'romantic', 'relationship'],
      'fantasy': ['fantasy', 'magic', 'wizard', 'dragon', 'medieval'],
      'science_fiction': ['sci-fi', 'science', 'fiction', 'space', 'future', 'robot'],
      'horror': ['horror', 'scary', 'ghost', 'vampire', 'zombie'],
      'biography': ['biography', 'memoir', 'life', 'story', 'autobiography'],
      'history': ['history', 'historical', 'past', 'war', 'ancient'],
      'self_help': ['self-help', 'motivation', 'improvement', 'success']
    };

    const detectedGenres = [];
    for (const [genre, keywords] of Object.entries(genreKeywords)) {
      if (keywords.some(keyword => tokens.includes(keyword))) {
        detectedGenres.push(genre);
      }
    }

    return {
      genres: detectedGenres,
      keywords: tokens.filter(token => token.length > 3),
      themes: [],
      mood: 'neutral'
    };
  }

  /**
   * Generate book recommendations based on user preferences and reading history
   * @param {Object} preferences - User preferences object
   * @param {Array} readingHistory - User's reading history
   * @param {Array} availableBooks - Available books to recommend from
   * @returns {Array} Recommended books with explanations
   */
  async generateRecommendations(preferences, readingHistory = [], availableBooks = []) {
    try {
      // Create user profile based on reading history
      const userProfile = this.createUserProfile(readingHistory);
      
      // Combine explicit preferences with learned preferences
      const combinedPreferences = this.combinePreferences(preferences, userProfile);
      
      // Score and rank books
      const scoredBooks = this.scoreBooks(availableBooks, combinedPreferences);
      
      // Generate explanations for top recommendations
      const topRecommendations = scoredBooks.slice(0, 10);
      const recommendationsWithExplanations = await this.generateExplanations(
        topRecommendations, 
        combinedPreferences
      );
      
      return recommendationsWithExplanations;
    } catch (error) {
      console.error('Error generating recommendations:', error);
      return [];
    }
  }

  /**
   * Create user profile from reading history
   * @param {Array} readingHistory 
   * @returns {Object} User profile with learned preferences
   */
  createUserProfile(readingHistory) {
    const profile = {
      favoriteGenres: {},
      favoriteAuthors: {},
      averageRating: 0,
      readingPatterns: {},
      themes: {}
    };

    if (readingHistory.length === 0) return profile;

    // Analyze genre preferences
    readingHistory.forEach(book => {
      if (book.genres) {
        book.genres.forEach(genre => {
          profile.favoriteGenres[genre] = (profile.favoriteGenres[genre] || 0) + (book.rating || 3);
        });
      }
      
      if (book.authors) {
        book.authors.forEach(author => {
          profile.favoriteAuthors[author] = (profile.favoriteAuthors[author] || 0) + (book.rating || 3);
        });
      }
    });

    // Calculate average rating
    const totalRating = readingHistory.reduce((sum, book) => sum + (book.rating || 3), 0);
    profile.averageRating = totalRating / readingHistory.length;

    return profile;
  }

  /**
   * Combine explicit preferences with learned preferences
   * @param {Object} explicit - Explicit user preferences
   * @param {Object} learned - Learned preferences from history
   * @returns {Object} Combined preferences
   */
  combinePreferences(explicit, learned) {
    return {
      genres: [...(explicit.genres || []), ...Object.keys(learned.favoriteGenres || {})],
      authors: [...(explicit.authors || []), ...Object.keys(learned.favoriteAuthors || {})],
      themes: explicit.themes || [],
      mood: explicit.mood || 'neutral',
      keywords: explicit.keywords || [],
      excludeGenres: explicit.excludeGenres || [],
      userProfile: learned
    };
  }

  /**
   * Score books based on user preferences
   * @param {Array} books - Available books
   * @param {Object} preferences - Combined user preferences
   * @returns {Array} Books sorted by relevance score
   */
  scoreBooks(books, preferences) {
    return books.map(book => {
      let score = 0;
      const reasons = [];

      // Genre matching
      if (book.categories && preferences.genres) {
        const genreMatches = book.categories.filter(category => 
          preferences.genres.some(genre => 
            category.toLowerCase().includes(genre.toLowerCase())
          )
        );
        if (genreMatches.length > 0) {
          score += genreMatches.length * 10;
          reasons.push(`Matches your interest in ${genreMatches.join(', ')}`);
        }
      }

      // Author matching
      if (book.authors && preferences.authors) {
        const authorMatches = book.authors.filter(author => 
          preferences.authors.some(prefAuthor => 
            author.toLowerCase().includes(prefAuthor.toLowerCase())
          )
        );
        if (authorMatches.length > 0) {
          score += authorMatches.length * 15;
          reasons.push(`By ${authorMatches.join(', ')}, an author you've enjoyed`);
        }
      }

      // Keyword matching in title and description
      if (preferences.keywords && preferences.keywords.length > 0) {
        const text = `${book.title} ${book.description}`.toLowerCase();
        const keywordMatches = preferences.keywords.filter(keyword => 
          text.includes(keyword.toLowerCase())
        );
        if (keywordMatches.length > 0) {
          score += keywordMatches.length * 5;
          reasons.push(`Contains themes you're interested in`);
        }
      }

      // Rating boost for highly rated books
      if (book.rating && book.rating > 4) {
        score += 5;
        reasons.push(`Highly rated (${book.rating}/5)`);
      }

      // Exclude genres penalty
      if (book.categories && preferences.excludeGenres) {
        const hasExcludedGenre = book.categories.some(category => 
          preferences.excludeGenres.some(excluded => 
            category.toLowerCase().includes(excluded.toLowerCase())
          )
        );
        if (hasExcludedGenre) {
          score -= 20;
        }
      }

      return {
        ...book,
        recommendationScore: score,
        recommendationReasons: reasons
      };
    }).sort((a, b) => b.recommendationScore - a.recommendationScore);
  }

  /**
   * Generate AI explanations for recommendations
   * @param {Array} recommendations - Top scored books
   * @param {Object} preferences - User preferences
   * @returns {Array} Recommendations with AI-generated explanations
   */
  async generateExplanations(recommendations, preferences) {
    try {
      const booksWithExplanations = await Promise.all(
        recommendations.map(async (book) => {
          if (book.recommendationReasons.length === 0) {
            return {
              ...book,
              explanation: "This book might interest you based on current trends."
            };
          }

          const prompt = `
            Generate a brief, personalized explanation (max 50 words) for why this book is recommended:
            
            Book: "${book.title}" by ${book.authors?.join(', ')}
            Genres: ${book.categories?.join(', ')}
            User interests: ${preferences.genres?.join(', ')}
            Matching reasons: ${book.recommendationReasons.join(', ')}
            
            Write a friendly, personal recommendation explanation.
          `;

          try {
            const response = await this.openai.chat.completions.create({
              model: "gpt-3.5-turbo",
              messages: [{ role: "user", content: prompt }],
              temperature: 0.7,
              max_tokens: 100
            });

            return {
              ...book,
              explanation: response.choices[0].message.content.trim()
            };
          } catch (error) {
            return {
              ...book,
              explanation: book.recommendationReasons.join('. ') || "Recommended based on your preferences."
            };
          }
        })
      );

      return booksWithExplanations;
    } catch (error) {
      console.error('Error generating explanations:', error);
      return recommendations.map(book => ({
        ...book,
        explanation: book.recommendationReasons.join('. ') || "Recommended for you."
      }));
    }
  }

  /**
   * Learn from user feedback to improve future recommendations
   * @param {string} userId - User ID
   * @param {string} bookId - Book ID
   * @param {string} feedback - 'like', 'dislike', 'not_interested'
   * @param {Object} bookData - Book information
   */
  async learnFromFeedback(userId, bookId, feedback, bookData) {
    try {
      // In a real implementation, this would update user preferences in the database
      // For now, we'll log the feedback for analysis
      console.log('Learning from feedback:', {
        userId,
        bookId,
        feedback,
        bookGenres: bookData.categories,
        bookAuthors: bookData.authors
      });

      // TODO: Implement database storage and preference updating logic
      // This could involve:
      // 1. Storing feedback in a user_feedback table
      // 2. Updating user preference weights
      // 3. Training recommendation models
      
      return { success: true, message: 'Feedback recorded successfully' };
    } catch (error) {
      console.error('Error learning from feedback:', error);
      return { success: false, message: 'Failed to record feedback' };
    }
  }

  /**
   * Get trending books based on current popular searches and ratings
   * @returns {Array} Trending book recommendations
   */
  async getTrendingRecommendations() {
    try {
      // This could integrate with external APIs or analyze internal data
      const trendingTopics = [
        'bestseller 2024',
        'award winning books',
        'popular fiction',
        'new releases'
      ];

      const randomTopic = trendingTopics[Math.floor(Math.random() * trendingTopics.length)];
      
      // In a real implementation, this would fetch from Google Books API or internal database
      return {
        topic: randomTopic,
        books: [] // Would be populated with actual trending books
      };
    } catch (error) {
      console.error('Error getting trending recommendations:', error);
      return { topic: 'popular books', books: [] };
    }
  }
}

module.exports = new AIRecommendationService();