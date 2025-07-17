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
}

// Create and export a singleton instance
const apiService = new ApiService();
export default apiService;

// Export individual methods for convenience
export const {
  register,
  login,
  logout,
  getCurrentUser,
  updateProfile,
  changePassword,
  isAuthenticated,
  searchBooks,
  getTrendingBooks,
  getBookSuggestions,
} = apiService;