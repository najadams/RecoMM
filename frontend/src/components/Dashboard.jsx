import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Header from './Header';
import MyBooks from './MyBooks';
import Feedback from './Feedback';
import ContactUs from './ContactUs';
import BookDetails from './BookDetails';
import Profile from './Profile';
import Footer from './Footer';

import apiService, { getSmartRecommendations, getPersonalizedRecommendations, getUserPreferences, submitRecommendationFeedback, startReading, completeReading, addToWantToRead, getBookStatus, getReadingHistory } from '../services/api';
import './Dashboard.css';
import auto from '../assets/auto.png'

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentView, setCurrentView] = useState('home');
  const [selectedBook, setSelectedBook] = useState(null);
  const [bookSuggestions, setBookSuggestions] = useState([]);
  const [trendingBooks, setTrendingBooks] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState('');
  
  // AI Recommendations Modal State
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiQuery, setAiQuery] = useState('');
  const [aiRecommendations, setAiRecommendations] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [userPreferences, setUserPreferences] = useState(null);
  const [selectedMood, setSelectedMood] = useState('');
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [showPersonalized, setShowPersonalized] = useState(false);
  const [bookStatuses, setBookStatuses] = useState({});
  const [actionLoading, setActionLoading] = useState({});
  const [selectedBookFilter, setSelectedBookFilter] = useState('all');
  const [userBooks, setUserBooks] = useState([]);

  // AI Recommendations Constants
  const moods = [
    { value: 'adventurous', label: '🗺️ Adventurous', color: '#FF6B6B' },
    { value: 'contemplative', label: '🤔 Contemplative', color: '#4ECDC4' },
    { value: 'romantic', label: '💕 Romantic', color: '#FF8A95' },
    { value: 'thrilling', label: '⚡ Thrilling', color: '#FFD93D' },
    { value: 'peaceful', label: '🕊️ Peaceful', color: '#6BCF7F' },
    { value: 'inspiring', label: '✨ Inspiring', color: '#A8E6CF' },
    { value: 'mysterious', label: '🔍 Mysterious', color: '#B19CD9' },
    { value: 'humorous', label: '😄 Humorous', color: '#FFB347' }
  ];

  const genres = [
    'Fiction', 'Non-Fiction', 'Mystery', 'Romance', 'Science Fiction', 
    'Fantasy', 'Biography', 'History', 'Self-Help', 'Business',
    'Psychology', 'Philosophy', 'Art', 'Travel', 'Cooking'
  ];

  const exampleQueries = [
    "I want a mystery novel with a strong female detective",
    "Looking for inspiring biographies of entrepreneurs",
    "Need a light romantic comedy for vacation reading",
    "Want to learn about artificial intelligence and machine learning",
    "Searching for fantasy books similar to Lord of the Rings",
    "Looking for books about mindfulness and meditation"
  ];

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Load initial data when component mounts
  useEffect(() => {
    loadInitialData();
    loadUserBooks();
  }, []);

  // Map status for filtering (same as MyBooks)
  const mapStatus = (status) => {
    const statusMap = {
      'want-to-read': 'saved',
      'reading': 'reading',
      'read': 'completed',
      'completed': 'completed',
      'did-not-finish': 'dnf'
    };
    return statusMap[status] || status;
  };

  // Get count of books by status (same as MyBooks)
  const getStatusCount = (status) => {
    if (status === 'all') return userBooks.length;
    return userBooks.filter(book => mapStatus(book.status) === status).length;
  };

  // Load user's reading history for bookshelf counts
  const loadUserBooks = async () => {
    try {
      const historyResponse = await getReadingHistory();
      if (historyResponse.success) {
        setUserBooks(historyResponse.readingHistory || []);
      }
    } catch (error) {
      console.error('Error fetching user books for shelf counts:', error);
    }
  };

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Load suggestions and trending books in parallel
      const [suggestions, trending] = await Promise.all([
        apiService.getBookSuggestions(),
        apiService.getTrendingBooks()
      ]);
      
      setBookSuggestions(suggestions);
      setTrendingBooks(trending);
    } catch (err) {
      console.error('Error loading initial data:', err);
      setError('Failed to load books. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Handle search functionality
  const handleSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setSearchLoading(true);
      const results = await apiService.searchBooks(query, 12);
      setSearchResults(results);
    } catch (err) {
      console.error('Search error:', err);
      setError('Search failed. Please try again.');
    } finally {
      setSearchLoading(false);
    }
  };

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      handleSearch(searchQuery);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push('⭐');
    }
    if (hasHalfStar) {
      stars.push('⭐');
    }
    
    return stars.join('');
  };

  const handleNavigation = (view, book = null, filter = null) => {
    setCurrentView(view);
    if (book) {
      setSelectedBook(book);
    }
    if (filter) {
      setSelectedBookFilter(filter);
    }
  };

  const handleShelfItemClick = (filter) => {
    setSelectedBookFilter(filter);
    setCurrentView('mybooks');
  };

  const handleBookClick = (book) => {
    setSelectedBook(book);
    setCurrentView('book-details');
  };

  // AI Recommendations Functions
  const loadUserPreferences = async () => {
    try {
      const response = await getUserPreferences();
      if (response.success) {
        setUserPreferences(response.preferences);
        setSelectedMood(response.preferences.mood || '');
      }
    } catch (error) {
      console.error('Failed to load user preferences:', error);
    }
  };

  const handleAIModalOpen = () => {
    setShowAIModal(true);
    loadUserPreferences();
  };

  const handleSmartSearch = async () => {
    if (!aiQuery.trim()) {
      setAiError('Please enter a description of what you\'re looking for');
      return;
    }

    setAiLoading(true);
    setAiError('');
    
    try {
      const response = await getSmartRecommendations(aiQuery.trim(), 12);
      
      if (response.success) {
        setAiRecommendations(response.recommendations);
        setShowPersonalized(false);
        
        // Fetch book statuses for all recommendations
        await fetchAllBookStatuses(response.recommendations);
      } else {
        setAiError(response.error || 'Failed to get recommendations');
      }
    } catch (error) {
      setAiError(error.message || 'Failed to get smart recommendations');
    } finally {
      setAiLoading(false);
    }
  };

  const handlePersonalizedRecommendations = async () => {
    setAiLoading(true);
    setAiError('');
    
    try {
      const params = {
        limit: 12,
        ...(selectedMood && { mood: selectedMood }),
        ...(selectedGenres.length > 0 && { genres: selectedGenres })
      };
      
      const response = await getPersonalizedRecommendations(params);
      
      if (response.success) {
        setAiRecommendations(response.recommendations);
        setShowPersonalized(true);
        setAiQuery('');
        
        // Fetch book statuses for all recommendations
        await fetchAllBookStatuses(response.recommendations);
      } else {
        setAiError(response.error || 'Failed to get personalized recommendations');
      }
    } catch (error) {
      setAiError(error.message || 'Failed to get personalized recommendations');
    } finally {
      setAiLoading(false);
    }
  };

  const handleFeedback = async (bookId, feedback, bookData) => {
    try {
      const result = await submitRecommendationFeedback({
        bookId,
        feedback,
        bookData: {
          title: bookData.title,
          authors: bookData.authors || [],
          genres: bookData.categories || [],
          description: bookData.description,
          publishedDate: bookData.publishedDate,
          pageCount: bookData.pageCount
        }
      });
      
      // Update the recommendation to show feedback was submitted
      setAiRecommendations(prev => 
        prev.map(rec => 
          rec.id === bookId 
            ? { ...rec, userFeedback: feedback }
            : rec
        )
      );
      
      // Update book status if it was automatically changed
      if (result.readingStatusUpdated) {
        await fetchBookStatus(bookId);
      // Refresh user books to update shelf counts
      await loadUserBooks();
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      setAiError('Failed to submit feedback. Please try again.');
    }
  };

  const fetchBookStatus = async (bookId) => {
    try {
      const result = await getBookStatus(bookId);
      setBookStatuses(prev => ({
        ...prev,
        [bookId]: result.bookStatus
      }));
    } catch (error) {
      console.error('Error fetching book status:', error);
    }
  };

  const fetchAllBookStatuses = async (books) => {
    const statusPromises = books.map(book => fetchBookStatus(book.id));
    await Promise.all(statusPromises);
  };

  const handleStartReading = async (bookId, bookData) => {
    setActionLoading(prev => ({ ...prev, [bookId]: 'starting' }));
    try {
      await startReading(bookId, {
        title: bookData.title,
        authors: bookData.authors || [],
        genres: bookData.categories || []
      });
      await fetchBookStatus(bookId);
      // Refresh user books to update shelf counts
      await loadUserBooks();
    } catch (error) {
      console.error('Error starting reading:', error);
      setAiError('Failed to start reading. Please try again.');
    } finally {
      setActionLoading(prev => ({ ...prev, [bookId]: null }));
    }
  };

  const handleCompleteReading = async (bookId, rating = null) => {
    setActionLoading(prev => ({ ...prev, [bookId]: 'completing' }));
    try {
      const additionalData = {};
      if (rating) additionalData.rating = rating;
      
      await completeReading(bookId, additionalData);
      await fetchBookStatus(bookId);
      // Refresh user books to update shelf counts
      await loadUserBooks();
    } catch (error) {
      console.error('Error completing reading:', error);
      setAiError('Failed to mark as completed. Please try again.');
    } finally {
      setActionLoading(prev => ({ ...prev, [bookId]: null }));
    }
  };

  const handleAddToWantToRead = async (bookId, bookData) => {
    setActionLoading(prev => ({ ...prev, [bookId]: 'adding' }));
    try {
      await addToWantToRead(bookId, {
        title: bookData.title,
        authors: bookData.authors || [],
        genres: bookData.categories || []
      });
      await fetchBookStatus(bookId);
      // Refresh user books to update shelf counts
      await loadUserBooks();
    } catch (error) {
      console.error('Error adding to want-to-read:', error);
      setAiError('Failed to add to want-to-read list. Please try again.');
    } finally {
      setActionLoading(prev => ({ ...prev, [bookId]: null }));
    }
  };

  const handleGenreToggle = (genre) => {
    setSelectedGenres(prev => 
      prev.includes(genre)
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    );
  };

  const handleExampleQuery = (exampleQuery) => {
    setAiQuery(exampleQuery);
  };

  const formatBookData = (book) => ({
    title: book.title,
    authors: book.authors || [],
    genres: book.categories || book.genres || [],
    description: book.description,
    publishedDate: book.publishedDate,
    pageCount: book.pageCount
  });

  // If user is viewing Book Details, render the BookDetails component
  if (currentView === 'book-details' && selectedBook) {
    return <BookDetails book={selectedBook} onNavigate={handleNavigation} />;
  }

  // If user is viewing My Books, render the MyBooks component
  if (currentView === 'mybooks') {
    return <MyBooks onNavigate={handleNavigation} initialFilter={selectedBookFilter} />;
  }

  // If user is viewing Feedback, render the Feedback component
  if (currentView === 'feedback') {
    return <Feedback onNavigate={setCurrentView} />;
  }

  // If user is viewing Contact Us, render the ContactUs component
  if (currentView === 'contact') {
    return <ContactUs onNavigate={setCurrentView} />;
  }

  // If user is viewing Profile, render the Profile component
  if (currentView === 'profile') {
    return <Profile onNavigate={setCurrentView} />;
  }



  return (
    <div className="library-dashboard">
      {/* Header */}
      <Header currentView={currentView} onNavigate={setCurrentView} />

      {/* Main Content */}
      <main className="library-main">
        {/* Library Section */}
        <section className="library-section">
          <div className="library-header-content">
            <h1 className="library-title">the library</h1>
            <p className="library-subtitle">home for all books</p>
          </div>
          
          <div className="search-container">
            <div className="search-wrapper">
              <span className="search-icon">🔍</span>
              <input 
                type="text" 
                placeholder="Search Your Books" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              <button className="filter-btn" onClick={handleAIModalOpen}>⚙️</button>
            </div>
          </div>
        </section>

        <div className="dashboard-content">
          {/* Sidebar */}
          <aside className="sidebar">
            <div className="book-shelf">
              <h3 className="shelf-title">BOOK SHELF</h3>
              <div className="shelf-items">
                <div className="shelf-item" onClick={() => handleShelfItemClick('all')}>
                  <span>ALL</span>
                  <span className="count">({getStatusCount('all')})</span>
                </div>
                <div className="shelf-item" onClick={() => handleShelfItemClick('completed')}>
                  <span>COMPLETED</span>
                  <span className="count">({getStatusCount('completed')})</span>
                </div>
                <div className="shelf-item" onClick={() => handleShelfItemClick('reading')}>
                  <span>READING</span>
                  <span className="count">({getStatusCount('reading')})</span>
                </div>
                <div className="shelf-item" onClick={() => handleShelfItemClick('saved')}>
                  <span>SAVED</span>
                  <span className="count">({getStatusCount('saved')})</span>
                </div>
              </div>
              
              <div className="shelf-sections">
                <div className="shelf-section">DRAFTS</div>
                <div className="shelf-section">HIGHLIGHTS</div>
                <div className="shelf-section">NOTES</div>
                <div className="shelf-section">READING CHALLENGE</div>
                <div className="shelf-section">MY READING STATS</div>
              </div>
              
              <div className="shelf-actions">
                <div className="shelf-action">IMPORT</div>
                <div className="shelf-action">EXPORT</div>
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <div className="main-content">
            {/* Error Message */}
            {error && (
              <div className="error-message">
                <p>{error}</p>
                <button onClick={loadInitialData} className="retry-btn">Retry</button>
              </div>
            )}

            {/* Search Results */}
            {searchQuery && (
              <section className="search-results-section">
                <div className="section-header">
                  <h2>Search Results for "{searchQuery}"</h2>
                  {searchLoading && <span className="loading-spinner">🔄</span>}
                </div>
                {searchResults.length > 0 ? (
                  <div className="books-grid">
                    {searchResults.map((book) => (
                      <div key={book.id} className="book-card" onClick={() => handleBookClick(book)}>
                        <div className="book-cover">
                          <img src={book.thumbnail} alt={book.title} onError={(e) => {
                            e.target.src = '/api/placeholder/120/180';
                          }} />
                        </div>
                        <div className="book-info">
                          <h4 title={book.title}>{book.title.length > 30 ? book.title.substring(0, 30) + '...' : book.title}</h4>
                          <p title={book.authors.join(', ')}>{book.authors.join(', ')}</p>
                          {book.rating > 0 && (
                            <div className="book-rating">
                              {renderStars(book.rating)} ({book.rating})
                            </div>
                          )}
                          {book.description && (
                            <p className="book-description" title={book.description}>
                              {book.description.length > 100 ? book.description.substring(0, 100) + '...' : book.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : !searchLoading && (
                  <p className="no-results">No books found for "{searchQuery}"</p>
                )}
              </section>
            )}

            {/* Suggestions Section */}
            {!searchQuery && (
              <section className="suggestions-section">
                <div className="section-header">
                  <h2>Suggestions</h2>
                  <button className="auto-btn" onClick={loadInitialData} disabled={loading}>
                    <img src={auto} alt="" style={{ height: '15px', marginRight: '5px'}} />
                    Auto
                  </button>
                </div>
                {loading ? (
                  <div className="loading-state">
                    <p>Loading suggestions...</p>
                  </div>
                ) : (
                  <div className="books-grid">
                    {bookSuggestions.map((book) => (
                      <div key={book.id} className="book-card" onClick={() => handleBookClick(book)}>
                        <div className="book-cover">
                          <img src={book.thumbnail} alt={book.title} onError={(e) => {
                            e.target.src = '/api/placeholder/120/180';
                          }} />
                        </div>
                        <div className="book-info">
                          <h4 title={book.title}>{book.title.length > 30 ? book.title.substring(0, 30) + '...' : book.title}</h4>
                          <p title={book.authors.join(', ')}>{book.authors.join(', ')}</p>
                          {book.rating > 0 && (
                            <div className="book-rating">
                              {renderStars(book.rating)} ({book.rating})
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* Trending Books */}
            {!searchQuery && (
              <section className="trending-section">
                <h2>Trending Books</h2>
                {loading ? (
                  <div className="loading-state">
                    <p>Loading trending books...</p>
                  </div>
                ) : (
                  <div className="trending-grid">
                    {trendingBooks.map((book) => (
                      <div key={book.id} className="trending-book" onClick={() => handleBookClick(book)}>
                        <div className="book-cover">
                          <img src={book.thumbnail} alt={book.title} onError={(e) => {
                            e.target.src = '/api/placeholder/120/180';
                          }} />
                        </div>
                        <div className="book-info">
                          <h4 title={book.title}>{book.title.length > 25 ? book.title.substring(0, 25) + '...' : book.title}</h4>
                          <p title={book.authors.join(', ')}>{book.authors.join(', ')}</p>
                        </div>
                        {book.rating > 0 && (
                          <div className="book-rating">
                            {renderStars(book.rating)} ({book.rating})
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}
          </div>

          {/* Reading Challenge Sidebar */}
          <aside className="challenge-sidebar">
            <div className="reading-challenge">
              <h3>READING CHALLENGE</h3>
              <p>Challenge your self to Read More Books</p>
              
              <div className="challenge-badge">
                <div className="badge-icon">🏆</div>
                <span>Reading Challenge</span>
              </div>
              
              <div className="daily-challenges">
                <h4>DAILY CHALLENGES</h4>
                <div className="challenge-item">
                  <span>#1 Read For 1 Hour</span>
                  <input type="checkbox" />
                </div>
                <div className="challenge-item">
                  <span>#2 Read A Book From Comedy</span>
                  <input type="checkbox" />
                </div>
                <div className="challenge-item">
                  <span>#3 Write A Review</span>
                  <input type="checkbox" />
                </div>
              </div>
              
              <div className="streak-counter">
                <div className="fire-icon">🔥</div>
                <p>Share your streak via</p>
                <div className="social-icons">
                  <span>G</span>
                  <span>🍎</span>
                  <span>📘</span>
                  <span>📱</span>
                  <span>✖️</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <Footer />

      {/* AI Recommendations Modal */}
      {showAIModal && (
        <div className="ai-modal-overlay" onClick={() => setShowAIModal(false)}>
          <div className="ai-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="ai-modal-header">
              <h2>AI-Powered Book Recommendations</h2>
              <button className="close-modal" onClick={() => setShowAIModal(false)}>×</button>
            </div>
            
            <div className="ai-modal-body">
              <div className="recommendation-controls">
                <div className="search-section">
                  <div className="query-input-container">
                    <textarea
                      value={aiQuery}
                      onChange={(e) => setAiQuery(e.target.value)}
                      placeholder="Describe the type of book you're looking for... (e.g., 'I want a thrilling mystery set in Victorian London with a clever detective')"
                      className="query-input"
                      rows={3}
                      maxLength={500}
                    />
                    <div className="character-count">
                      {aiQuery.length}/500
                    </div>
                  </div>
                  
                  <button 
                    onClick={handleSmartSearch}
                    disabled={aiLoading || !aiQuery.trim()}
                    className="search-button primary"
                  >
                    {aiLoading ? '🔍 Searching...' : '🔍 Find Books'}
                  </button>
                </div>

                <div className="divider">
                  <span>OR</span>
                </div>

                <div className="personalized-section">
                  <h3>Get Personalized Recommendations</h3>
                  
                  <div className="mood-selector">
                    <label>Current Mood:</label>
                    <div className="mood-options">
                      {moods.map(mood => (
                        <button
                          key={mood.value}
                          onClick={() => setSelectedMood(mood.value === selectedMood ? '' : mood.value)}
                          className={`mood-option ${selectedMood === mood.value ? 'selected' : ''}`}
                          style={{ '--mood-color': mood.color }}
                        >
                          {mood.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="genre-selector">
                    <label>Preferred Genres (optional):</label>
                    <div className="genre-options">
                      {genres.map(genre => (
                        <button
                          key={genre}
                          onClick={() => handleGenreToggle(genre)}
                          className={`genre-option ${selectedGenres.includes(genre) ? 'selected' : ''}`}
                        >
                          {genre}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button 
                    onClick={handlePersonalizedRecommendations}
                    disabled={aiLoading}
                    className="search-button secondary"
                  >
                    {aiLoading ? '✨ Generating...' : '✨ Get My Recommendations'}
                  </button>
                </div>
              </div>

              {!aiLoading && !aiRecommendations.length && (
                <div className="example-queries">
                  <h3>Need inspiration? Try these examples:</h3>
                  <div className="example-list">
                    {exampleQueries.map((example, index) => (
                      <button
                        key={index}
                        onClick={() => handleExampleQuery(example)}
                        className="example-query"
                      >
                        "{example}"
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {aiError && (
                <div className="error-message">
                  <span className="error-icon">⚠️</span>
                  {aiError}
                </div>
              )}

              {aiLoading && (
                <div className="loading-container">
                  <div className="loading-spinner"></div>
                  <p>Our AI is analyzing your request and finding the perfect books...</p>
                </div>
              )}

              {aiRecommendations.length > 0 && (
                <div className="recommendations-results">
                  <div className="results-header">
                    <h3>
                      {showPersonalized ? '✨ Your Personalized Recommendations' : '🎯 Smart Search Results'}
                    </h3>
                    <p>{aiRecommendations.length} books found</p>
                  </div>

                  <div className="recommendations-grid">
                    {aiRecommendations.map((book) => (
                      <div key={book.id} className="recommendation-card">
                        <div className="book-cover">
                          <img 
                            src={book.thumbnail || book.imageUrl || '/api/placeholder/120/180'} 
                            alt={book.title}
                            onError={(e) => {
                              e.target.src = '/api/placeholder/120/180';
                            }}
                          />
                          {book.aiScore && (
                            <div className="ai-score">
                              {Math.round(book.aiScore * 100)}% match
                            </div>
                          )}
                        </div>
                        
                        <div className="book-info">
                          <h4 className="book-title">{book.title}</h4>
                          <p className="book-authors">
                            {Array.isArray(book.authors) ? book.authors.join(', ') : book.authors}
                          </p>
                          
                          {book.aiExplanation && (
                            <div className="ai-explanation">
                              <strong>Why this book:</strong>
                              <p>{book.aiExplanation}</p>
                            </div>
                          )}
                          
                          <div className="book-meta">
                            {book.rating > 0 && (
                              <span className="rating">
                                ⭐ {book.rating.toFixed(1)}
                              </span>
                            )}
                            {book.publishedDate && (
                              <span className="year">{book.publishedDate.split('-')[0]}</span>
                            )}
                            {book.pageCount && (
                              <span className="pages">{book.pageCount} pages</span>
                            )}
                          </div>

                          {book.categories && book.categories.length > 0 && (
                            <div className="book-genres">
                              {book.categories.slice(0, 3).map((genre, index) => (
                                <span key={index} className="genre-tag">{genre}</span>
                              ))}
                            </div>
                          )}
                          
                          <div className="book-actions">
                            {bookStatuses[book.id] ? (
                               <div className="status-display">
                                 <span className="current-status">
                                   {bookStatuses[book.id] === 'want-to-read' && '📚 Want to Read'}
                                   {bookStatuses[book.id] === 'reading' && '📖 Currently Reading'}
                                   {bookStatuses[book.id] === 'read' && '✅ Completed'}
                                   {bookStatuses[book.id] === 'did-not-finish' && '⏸️ Did Not Finish'}
                                 </span>
                                 {bookStatuses[book.id] === 'want-to-read' && (
                                   <button
                                     onClick={() => handleStartReading(book.id, formatBookData(book))}
                                     disabled={actionLoading[book.id] === 'starting'}
                                     className="action-btn start-reading"
                                   >
                                     {actionLoading[book.id] === 'starting' ? 'Starting...' : 'Start Reading'}
                                   </button>
                                 )}
                                 {bookStatuses[book.id] === 'reading' && (
                                   <button
                                     onClick={() => handleCompleteReading(book.id)}
                                     disabled={actionLoading[book.id] === 'completing'}
                                     className="action-btn complete-reading"
                                   >
                                     {actionLoading[book.id] === 'completing' ? 'Completing...' : 'Mark Complete'}
                                   </button>
                                 )}
                               </div>
                            ) : (
                              <div className="quick-actions">
                                <button
                                  onClick={() => handleAddToWantToRead(book.id, formatBookData(book))}
                                  disabled={actionLoading[book.id] === 'adding'}
                                  className="action-btn add-to-list"
                                >
                                  {actionLoading[book.id] === 'adding' ? 'Adding...' : '📚 Want to Read'}
                                </button>
                                <button
                                  onClick={() => handleStartReading(book.id, formatBookData(book))}
                                  disabled={actionLoading[book.id] === 'starting'}
                                  className="action-btn start-reading"
                                >
                                  {actionLoading[book.id] === 'starting' ? 'Starting...' : '📖 Start Reading'}
                                </button>
                              </div>
                            )}
                          </div>
                          
                          <div className="feedback-buttons">
                            <button
                              onClick={() => handleFeedback(book.id, 'like', formatBookData(book))}
                              className={`feedback-btn like ${book.userFeedback === 'like' ? 'active' : ''}`}
                              title="I like this recommendation"
                            >
                              👍
                            </button>
                            <button
                              onClick={() => handleFeedback(book.id, 'dislike', formatBookData(book))}
                              className={`feedback-btn dislike ${book.userFeedback === 'dislike' ? 'active' : ''}`}
                              title="Not interested"
                            >
                              👎
                            </button>
                            <button
                              onClick={() => handleFeedback(book.id, 'already_read', formatBookData(book))}
                              className={`feedback-btn already-read ${book.userFeedback === 'already_read' ? 'active' : ''}`}
                              title="Already read this"
                            >
                              ✅
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;