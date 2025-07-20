const API_BASE_URL = 'http://localhost:5001/api';

// API utility functions
class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Get auth token from localStorage
  getAuthToken() {
    return localStorage.getItem('token');
  }

  // Set auth token in localStorage
  setAuthToken(token) {
    localStorage.setItem('token', token);
  }

  // Remove auth token from localStorage
  removeAuthToken() {
    localStorage.removeItem('token');
  }

  // Generic request method
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = this.getAuthToken();

    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      
      // Check if response is ok before trying to parse JSON
      if (!response.ok) {
        let errorMessage = 'Something went wrong';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (jsonError) {
          // If JSON parsing fails, use status text
          errorMessage = response.statusText || `HTTP ${response.status}`;
        }
        throw new Error(errorMessage);
      }

      // Parse JSON response
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API Request Error:', error);
      
      // Handle network errors
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to server. Please check your connection.');
      }
      
      throw error;
    }
  }

  // Authentication methods
  async register(userData) {
    const response = await this.request('/auth/register', {
      method: 'POST',
      body: userData,
    });

    if (response.token) {
      this.setAuthToken(response.token);
    }

    return response;
  }

  async login(credentials) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: credentials,
    });

    if (response.token) {
      this.setAuthToken(response.token);
    }

    return response;
  }

  async logout() {
    try {
      await this.request('/auth/logout', {
        method: 'POST',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.removeAuthToken();
    }
  }

  async getCurrentUser() {
    return await this.request('/auth/me');
  }

  async updateProfile(profileData) {
    return await this.request('/auth/profile', {
      method: 'PUT',
      body: profileData,
    });
  }

  async changePassword(passwordData) {
    return await this.request('/auth/password', {
      method: 'PUT',
      body: passwordData,
    });
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.getAuthToken();
  }

  // Google Books API methods
  async searchBooks(query, maxResults = 12) {
    const GOOGLE_BOOKS_API = 'https://www.googleapis.com/books/v1/volumes';
    const url = `${GOOGLE_BOOKS_API}?q=${encodeURIComponent(query)}&maxResults=${maxResults}&printType=books`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch books from Google Books API');
      }
      const data = await response.json();
      
      return data.items?.map(item => ({
        id: item.id,
        title: item.volumeInfo.title || 'Unknown Title',
        authors: item.volumeInfo.authors || ['Unknown Author'],
        description: item.volumeInfo.description || 'No description available',
        thumbnail: item.volumeInfo.imageLinks?.thumbnail?.replace('http:', 'https:') || '/api/placeholder/120/180',
        rating: item.volumeInfo.averageRating || 0,
        ratingsCount: item.volumeInfo.ratingsCount || 0,
        publishedDate: item.volumeInfo.publishedDate || 'Unknown',
        pageCount: item.volumeInfo.pageCount || 0,
        categories: item.volumeInfo.categories || [],
        language: item.volumeInfo.language || 'en',
        previewLink: item.volumeInfo.previewLink || '',
        infoLink: item.volumeInfo.infoLink || ''
      })) || [];
    } catch (error) {
      console.error('Google Books API Error:', error);
      throw error;
    }
  }

  async getTrendingBooks() {
    // Get trending books by searching for popular categories
    const trendingQueries = ['bestseller', 'popular fiction', 'new releases'];
    const randomQuery = trendingQueries[Math.floor(Math.random() * trendingQueries.length)];
    return await this.searchBooks(randomQuery, 6);
  }

  async getBookSuggestions() {
    // Get book suggestions from various popular categories
    const suggestionQueries = ['classic literature', 'science fiction', 'mystery', 'romance', 'biography', 'self help'];
    const randomQuery = suggestionQueries[Math.floor(Math.random() * suggestionQueries.length)];
    return await this.searchBooks(randomQuery, 6);
  }

  // Get book details by ID from Google Books API
  async getBookDetails(bookId) {
    const GOOGLE_BOOKS_API = 'https://www.googleapis.com/books/v1/volumes';
    const url = `${GOOGLE_BOOKS_API}/${bookId}`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch book details from Google Books API');
      }
      const item = await response.json();
      
      return {
        id: item.id,
        title: item.volumeInfo.title || 'Unknown Title',
        authors: item.volumeInfo.authors || ['Unknown Author'],
        description: item.volumeInfo.description || 'No description available',
        thumbnail: item.volumeInfo.imageLinks?.thumbnail?.replace('http:', 'https:') || '/api/placeholder/120/180',
        rating: item.volumeInfo.averageRating || 0,
        ratingsCount: item.volumeInfo.ratingsCount || 0,
        publishedDate: item.volumeInfo.publishedDate || 'Unknown',
        pageCount: item.volumeInfo.pageCount || 0,
        categories: item.volumeInfo.categories || [],
        language: item.volumeInfo.language || 'en',
        previewLink: item.volumeInfo.previewLink || '',
        infoLink: item.volumeInfo.infoLink || ''
      };
    } catch (error) {
      console.error('Google Books API Error for book ID', bookId, ':', error);
      // Return minimal data if API call fails
      return {
        id: bookId,
        title: 'Unknown Title',
        authors: ['Unknown Author'],
        description: 'No description available',
        thumbnail: '/api/placeholder/120/180',
        rating: 0,
        ratingsCount: 0,
        publishedDate: 'Unknown',
        pageCount: 0,
        categories: [],
        language: 'en',
        previewLink: '',
        infoLink: ''
      };
    }
  }

  // AI-Powered Recommendation methods
  async getPersonalizedRecommendations(params = {}) {
    const queryParams = new URLSearchParams();
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.mood) queryParams.append('mood', params.mood);
    if (params.genres) queryParams.append('genres', Array.isArray(params.genres) ? params.genres.join(',') : params.genres);
    if (params.excludeGenres) queryParams.append('excludeGenres', Array.isArray(params.excludeGenres) ? params.excludeGenres.join(',') : params.excludeGenres);
    
    const endpoint = `/recommendations${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return await this.request(endpoint);
  }

  async getSmartRecommendations(naturalLanguageInput, limit = 10) {
    return await this.request('/recommendations/smart', {
      method: 'POST',
      body: {
        naturalLanguageInput,
        limit
      }
    });
  }

  async getTrendingRecommendations(params = {}) {
    const queryParams = new URLSearchParams();
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.genre) queryParams.append('genre', params.genre);
    if (params.timeframe) queryParams.append('timeframe', params.timeframe);
    
    const endpoint = `/recommendations/trending${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return await this.request(endpoint);
  }

  // User Preferences methods
  async getUserPreferences() {
    return await this.request('/recommendations/preferences');
  }

  async updateUserPreferences(preferences, naturalLanguageInput = null) {
    const body = { preferences };
    if (naturalLanguageInput) {
      body.naturalLanguageInput = naturalLanguageInput;
    }
    
    return await this.request('/recommendations/preferences', {
      method: 'PUT',
      body
    });
  }

  // Reading History methods
  async addToReadingHistory(bookData) {
    return await this.request('/recommendations/reading-history', {
      method: 'POST',
      body: bookData
    });
  }

  async updateBookStatus(bookId, status, additionalData = {}) {
    return await this.request(`/recommendations/reading-history/${bookId}`, {
      method: 'PUT',
      body: {
        status,
        ...additionalData
      }
    });
  }

  async getReadingHistory(page = 1, limit = 20) {
    return await this.request(`/recommendations/history?page=${page}&limit=${limit}`);
  }

  // Recommendation Feedback methods
  async submitRecommendationFeedback(bookId, feedback, bookData = {}) {
    return await this.request('/recommendations/feedback', {
      method: 'POST',
      body: {
        bookId,
        feedback,
        bookData
      }
    });
  }

  // Start reading a book (automatically updates status to 'reading')
  async startReading(bookId, bookData) {
    return await this.request(`/recommendations/start-reading/${bookId}`, {
      method: 'POST',
      body: { bookData }
    });
  }

  // Complete reading a book (automatically updates status to 'read')
  async completeReading(bookId, additionalData = {}) {
    return await this.request(`/recommendations/complete-reading/${bookId}`, {
      method: 'POST',
      body: additionalData
    });
  }

  // Add book to want-to-read list
  async addToWantToRead(bookId, bookData) {
    return await this.request(`/recommendations/want-to-read/${bookId}`, {
      method: 'POST',
      body: { bookData }
    });
  }

  // Update reading progress for a book
  async updateReadingProgress(bookId, progress, timeSpent = 0) {
    return await this.request(`/recommendations/reading-progress/${bookId}`, {
      method: 'PUT',
      body: { progress, timeSpent }
    });
  }

  // Get book status for current user
  async getBookStatus(bookId) {
    return await this.request(`/recommendations/book-status/${bookId}`);
  }

  // Enhanced book search with AI context
  async searchBooksWithContext(query, userContext = {}, maxResults = 12) {
    try {
      // First try to get AI-enhanced recommendations if user has context
      if (userContext.hasPreferences) {
        const aiRecommendations = await this.getSmartRecommendations(
          `Find books similar to: ${query}`,
          Math.min(maxResults, 10)
        );
        
        if (aiRecommendations.success && aiRecommendations.recommendations.length > 0) {
          return aiRecommendations.recommendations;
        }
      }
    } catch (error) {
      console.warn('AI-enhanced search failed, falling back to regular search:', error);
    }
    
    // Fallback to regular Google Books search
    return await this.searchBooks(query, maxResults);
  }

  // Utility method to check if AI recommendations are available
  async checkAIAvailability() {
    try {
      const response = await this.request('/recommendations/trending?limit=1');
      return response.success;
    } catch (error) {
      return false;
    }
  }

  // Get reading statistics
  async getReadingStats() {
    try {
      const preferences = await this.getUserPreferences();
      return preferences.readingStats || {};
    } catch (error) {
      console.error('Failed to get reading stats:', error);
      return {};
    }
  }

  // Batch operations for better performance
  async batchUpdateReadingHistory(updates) {
    const promises = updates.map(update => 
      this.updateBookStatus(update.bookId, update.status, update.additionalData)
    );
    
    try {
      const results = await Promise.allSettled(promises);
      return {
        successful: results.filter(r => r.status === 'fulfilled').length,
        failed: results.filter(r => r.status === 'rejected').length,
        results
      };
    } catch (error) {
      console.error('Batch update failed:', error);
      throw error;
    }
  }

  async batchSubmitFeedback(feedbackList) {
    const promises = feedbackList.map(feedback => 
      this.submitRecommendationFeedback(feedback.bookId, feedback.feedback, feedback.bookData)
    );
    
    try {
      const results = await Promise.allSettled(promises);
      return {
        successful: results.filter(r => r.status === 'fulfilled').length,
        failed: results.filter(r => r.status === 'rejected').length,
        results
      };
    } catch (error) {
      console.error('Batch feedback submission failed:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
const apiService = new ApiService();
export default apiService;

// Export individual methods for convenience with proper binding
export const register = (...args) => apiService.register(...args);
export const login = (...args) => apiService.login(...args);
export const logout = (...args) => apiService.logout(...args);
export const getCurrentUser = (...args) => apiService.getCurrentUser(...args);
export const updateProfile = (...args) => apiService.updateProfile(...args);
export const changePassword = (...args) => apiService.changePassword(...args);
export const isAuthenticated = (...args) => apiService.isAuthenticated(...args);
export const searchBooks = (...args) => apiService.searchBooks(...args);
export const getTrendingBooks = (...args) => apiService.getTrendingBooks(...args);
export const getBookSuggestions = (...args) => apiService.getBookSuggestions(...args);
export const getPersonalizedRecommendations = (...args) => apiService.getPersonalizedRecommendations(...args);
export const getSmartRecommendations = (...args) => apiService.getSmartRecommendations(...args);
export const getTrendingRecommendations = (...args) => apiService.getTrendingRecommendations(...args);
export const getUserPreferences = (...args) => apiService.getUserPreferences(...args);
export const updateUserPreferences = (...args) => apiService.updateUserPreferences(...args);
export const addToReadingHistory = (...args) => apiService.addToReadingHistory(...args);
export const updateBookStatus = (...args) => apiService.updateBookStatus(...args);
export const getReadingHistory = (...args) => apiService.getReadingHistory(...args);
export const submitRecommendationFeedback = (...args) => apiService.submitRecommendationFeedback(...args);
export const startReading = (...args) => apiService.startReading(...args);
export const completeReading = (...args) => apiService.completeReading(...args);
export const addToWantToRead = (...args) => apiService.addToWantToRead(...args);
export const updateReadingProgress = (...args) => apiService.updateReadingProgress(...args);
export const getBookStatus = (...args) => apiService.getBookStatus(...args);
export const searchBooksWithContext = (...args) => apiService.searchBooksWithContext(...args);
export const checkAIAvailability = (...args) => apiService.checkAIAvailability(...args);
export const getReadingStats = (...args) => apiService.getReadingStats(...args);
export const batchUpdateReadingHistory = (...args) => apiService.batchUpdateReadingHistory(...args);
export const batchSubmitFeedback = (...args) => apiService.batchSubmitFeedback(...args);
export const getBookDetails = (...args) => apiService.getBookDetails(...args);