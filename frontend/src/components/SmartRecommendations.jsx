import React, { useState, useEffect } from 'react';
import { getSmartRecommendations, getPersonalizedRecommendations, getUserPreferences, submitRecommendationFeedback, startReading, completeReading, addToWantToRead, getBookStatus } from '../services/api';
import './SmartRecommendations.css';

const SmartRecommendations = () => {
  const [query, setQuery] = useState('');
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userPreferences, setUserPreferences] = useState(null);
  const [selectedMood, setSelectedMood] = useState('');
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [showPersonalized, setShowPersonalized] = useState(false);
  const [bookStatuses, setBookStatuses] = useState({});
  const [actionLoading, setActionLoading] = useState({});

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

  useEffect(() => {
    loadUserPreferences();
  }, []);

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

  const handleSmartSearch = async () => {
    if (!query.trim()) {
      setError('Please enter a description of what you\'re looking for');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await getSmartRecommendations(query.trim(), 12);
      
      if (response.success) {
        setRecommendations(response.recommendations);
        setShowPersonalized(false);
        
        // Fetch book statuses for all recommendations
        await fetchAllBookStatuses(response.recommendations);
      } else {
        setError(response.error || 'Failed to get recommendations');
      }
    } catch (error) {
      setError(error.message || 'Failed to get smart recommendations');
    } finally {
      setLoading(false);
    }
  };

  const handlePersonalizedRecommendations = async () => {
    setLoading(true);
    setError('');
    
    try {
      const params = {
        limit: 12,
        ...(selectedMood && { mood: selectedMood }),
        ...(selectedGenres.length > 0 && { genres: selectedGenres })
      };
      
      const response = await getPersonalizedRecommendations(params);
      
      if (response.success) {
        setRecommendations(response.recommendations);
        setShowPersonalized(true);
        setQuery('');
        
        // Fetch book statuses for all recommendations
        await fetchAllBookStatuses(response.recommendations);
      } else {
        setError(response.error || 'Failed to get personalized recommendations');
      }
    } catch (error) {
      setError(error.message || 'Failed to get personalized recommendations');
    } finally {
      setLoading(false);
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
      setRecommendations(prev => 
        prev.map(rec => 
          rec.id === bookId 
            ? { ...rec, userFeedback: feedback }
            : rec
        )
      );
      
      // Update book status if it was automatically changed
      if (result.readingStatusUpdated) {
        await fetchBookStatus(bookId);
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      setError('Failed to submit feedback. Please try again.');
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
    } catch (error) {
      console.error('Error starting reading:', error);
      setError('Failed to start reading. Please try again.');
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
    } catch (error) {
      console.error('Error completing reading:', error);
      setError('Failed to mark as completed. Please try again.');
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
    } catch (error) {
      console.error('Error adding to want-to-read:', error);
      setError('Failed to add to want-to-read list. Please try again.');
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
    setQuery(exampleQuery);
  };

  const formatBookData = (book) => ({
    title: book.title,
    authors: book.authors || [],
    genres: book.categories || book.genres || [],
    description: book.description,
    publishedDate: book.publishedDate,
    pageCount: book.pageCount
  });

  return (
    <div className="smart-recommendations">
      <div className="smart-recommendations-header">
        <h2>🤖 AI-Powered Book Recommendations</h2>
        <p>Describe what you're looking for, and our AI will find the perfect books for you!</p>
      </div>

      <div className="recommendation-controls">
        <div className="search-section">
          <div className="query-input-container">
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Describe the type of book you're looking for... (e.g., 'I want a thrilling mystery set in Victorian London with a clever detective')"
              className="query-input"
              rows={3}
              maxLength={500}
            />
            <div className="character-count">
              {query.length}/500
            </div>
          </div>
          
          <button 
            onClick={handleSmartSearch}
            disabled={loading || !query.trim()}
            className="search-button primary"
          >
            {loading ? '🔍 Searching...' : '🔍 Find Books'}
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
            disabled={loading}
            className="search-button secondary"
          >
            {loading ? '✨ Generating...' : '✨ Get My Recommendations'}
          </button>
        </div>
      </div>

      {!loading && !recommendations.length && (
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

      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      {loading && (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Our AI is analyzing your request and finding the perfect books...</p>
        </div>
      )}

      {recommendations.length > 0 && (
        <div className="recommendations-results">
          <div className="results-header">
            <h3>
              {showPersonalized ? '✨ Your Personalized Recommendations' : '🎯 Smart Search Results'}
            </h3>
            <p>{recommendations.length} books found</p>
          </div>

          <div className="recommendations-grid">
            {recommendations.map((book) => (
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
  );
};

export default SmartRecommendations;