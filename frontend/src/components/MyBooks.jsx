import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getReadingHistory, getReadingStats, updateBookStatus } from '../services/api';
import Header from './Header';
import './MyBooks.css';
import Footer from './Footer';

// Enhanced styles for the new features
const styles = `
  .user-books-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 24px;
    padding: 20px 0;
  }

  .user-book-card {
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .user-book-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  }

  .book-cover-large {
    position: relative;
    height: 300px;
    overflow: hidden;
  }

  .book-cover-large img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .book-status-badge {
    position: absolute;
    top: 10px;
    right: 10px;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    color: white;
  }

  .book-status-badge.reading {
    background: #3b82f6;
  }

  .book-status-badge.read {
    background: #10b981;
  }

  .book-status-badge.saved {
    background: #f59e0b;
  }

  .book-status-badge.dnf {
    background: #ef4444;
  }

  .reading-progress {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: rgba(0, 0, 0, 0.8);
    padding: 8px;
    color: white;
  }

  .progress-bar {
    width: 100%;
    height: 4px;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 2px;
    overflow: hidden;
    margin-bottom: 4px;
  }

  .progress-fill {
    height: 100%;
    background: #10b981;
    transition: width 0.3s ease;
  }

  .progress-text {
    font-size: 0.75rem;
    font-weight: 600;
  }

  .book-details {
    padding: 16px;
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .book-title {
    font-size: 1.1rem;
    font-weight: 600;
    margin: 0 0 8px 0;
    color: #1f2937;
    line-height: 1.4;
  }

  .book-authors {
    color: #6b7280;
    margin: 0 0 12px 0;
    font-size: 0.9rem;
  }

  .star-rating {
    display: flex;
    gap: 2px;
    margin-bottom: 12px;
  }

  .star {
    font-size: 1rem;
  }

  .star.filled {
    color: #fbbf24;
  }

  .book-meta {
    margin-bottom: 16px;
  }

  .book-genres {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-bottom: 8px;
  }

  .genre-tag {
    background: #f3f4f6;
    color: #374151;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 500;
  }

  .book-dates {
    margin-bottom: 8px;
  }

  .date-info {
    display: block;
    font-size: 0.8rem;
    color: #6b7280;
    margin-bottom: 2px;
  }

  .book-review {
    margin-bottom: 8px;
  }

  .book-review p {
    font-size: 0.85rem;
    color: #4b5563;
    font-style: italic;
    margin: 0;
    line-height: 1.4;
  }

  .reading-time {
    font-size: 0.8rem;
    color: #059669;
    font-weight: 500;
  }

  .book-actions {
    margin-top: auto;
    display: flex;
    gap: 8px;
  }

  .action-btn {
    flex: 1;
    padding: 8px 12px;
    border: none;
    border-radius: 6px;
    font-size: 0.85rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .action-btn.primary {
    background: #3b82f6;
    color: white;
  }

  .action-btn.primary:hover {
    background: #2563eb;
  }

  .status-select {
    flex: 1;
    padding: 8px 12px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 0.85rem;
    background: white;
    cursor: pointer;
  }

  .status-select:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    color: #6b7280;
  }

  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid #f3f4f6;
    border-top: 3px solid #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 16px;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .error-message {
    background: #fef2f2;
    border: 1px solid #fecaca;
    color: #dc2626;
    padding: 16px;
    border-radius: 8px;
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .error-icon {
    font-size: 1.2rem;
  }

  .retry-btn {
    background: #dc2626;
    color: white;
    border: none;
    padding: 6px 12px;
    border-radius: 4px;
    font-size: 0.85rem;
    cursor: pointer;
    margin-left: auto;
  }

  .retry-btn:hover {
    background: #b91c1c;
  }

  .empty-state {
    text-align: center;
    padding: 60px 20px;
    color: #6b7280;
  }

  .empty-icon {
    font-size: 4rem;
    margin-bottom: 16px;
  }

  .empty-state h3 {
    font-size: 1.5rem;
    margin-bottom: 8px;
    color: #374151;
  }

  .empty-state p {
    margin-bottom: 24px;
    font-size: 1rem;
  }

  .add-book-btn {
    background: #3b82f6;
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s ease;
  }

  .add-book-btn:hover {
    background: #2563eb;
  }
`;

const MyBooks = ({ onNavigate, initialFilter = 'all' }) => {
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [userBooks, setUserBooks] = useState([]);
  const [readingStats, setReadingStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState(initialFilter);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Fetch user's reading history and stats
  useEffect(() => {
    const fetchUserBooks = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const [historyResponse, statsResponse] = await Promise.all([
          getReadingHistory(),
          getReadingStats()
        ]);
        
        if (historyResponse.success) {
          setUserBooks(historyResponse.readingHistory || []);
        }
        
        if (statsResponse.success) {
          setReadingStats(statsResponse.stats);
        }
      } catch (error) {
        console.error('Error fetching user books:', error);
        setError('Failed to load your books. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserBooks();
  }, [user]);

  // Map status for filtering
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

  // Filter books based on search and selected filter
  const filteredBooks = userBooks.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (book.authors && book.authors.some(author => 
        author.toLowerCase().includes(searchQuery.toLowerCase())
      ));
    
    if (selectedFilter === 'all') return matchesSearch;
    
    const mappedStatus = mapStatus(book.status);
    return matchesSearch && mappedStatus === selectedFilter;
  });

  const getBooksByStatus = (status) => {
    return filteredBooks.filter(book => mapStatus(book.status) === status);
  };

  const getStatusCount = (status) => {
    if (status === 'all') return userBooks.length;
    return userBooks.filter(book => mapStatus(book.status) === status).length;
  };

  // Handle status update
  const handleStatusUpdate = async (bookId, newStatus) => {
    try {
      const response = await updateBookStatus(bookId, newStatus);
      if (response.success) {
        // Refresh the books list
        const historyResponse = await getReadingHistory();
        if (historyResponse.success) {
          setUserBooks(historyResponse.readingHistory || []);
        }
      }
    } catch (error) {
      console.error('Error updating book status:', error);
      setError('Failed to update book status. Please try again.');
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString();
  };

  // Render star rating
  const renderStarRating = (rating) => {
    if (!rating) return null;
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} className={`star ${i <= rating ? 'filled' : ''}`}>
          ⭐
        </span>
      );
    }
    return <div className="star-rating">{stars}</div>;
  };

  return (
    <div className="my-books-page">
      <style>{styles}</style>
      {/* Header */}
      <Header currentView="mybooks" onNavigate={onNavigate} />

      {/* Main Content */}
      <main className="my-books-main">
        {/* Page Title Section */}
        <section className="page-title-section">
          <div className="page-title-content">
            <h1 className="page-title">my books</h1>
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
              <button className="filter-btn">⚙️</button>
            </div>
          </div>
        </section>

        <div className="my-books-content">
          {/* Sidebar */}
          <aside className="sidebar">
            <div className="book-shelf">
              <h3 className="shelf-title">BOOK SHELF</h3>
              <div className="shelf-items">
                <div 
                  className={`shelf-item ${selectedFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setSelectedFilter('all')}
                >
                  <span>ALL</span>
                  <span className="count">({getStatusCount('all')})</span>
                </div>
                <div 
                  className={`shelf-item ${selectedFilter === 'completed' ? 'active' : ''}`}
                  onClick={() => setSelectedFilter('completed')}
                >
                  <span>COMPLETED</span>
                  <span className="count">({getStatusCount('completed')})</span>
                </div>
                <div 
                  className={`shelf-item ${selectedFilter === 'reading' ? 'active' : ''}`}
                  onClick={() => setSelectedFilter('reading')}
                >
                  <span>READING</span>
                  <span className="count">({getStatusCount('reading')})</span>
                </div>
                <div 
                  className={`shelf-item ${selectedFilter === 'saved' ? 'active' : ''}`}
                  onClick={() => setSelectedFilter('saved')}
                >
                  <span>SAVED</span>
                  <span className="count">({getStatusCount('saved')})</span>
                </div>
                <div 
                  className={`shelf-item ${selectedFilter === 'dnf' ? 'active' : ''}`}
                  onClick={() => setSelectedFilter('dnf')}
                >
                  <span>DID NOT FINISH</span>
                  <span className="count">({getStatusCount('dnf')})</span>
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

          {/* Main Books Display */}
          <div className="books-main-content">
            {error && (
              <div className="error-message">
                <span className="error-icon">⚠️</span>
                {error}
                <button onClick={() => window.location.reload()} className="retry-btn">
                  Retry
                </button>
              </div>
            )}
            
            {loading ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading your books...</p>
              </div>
            ) : (
              <div className="books-grid-container">
                {filteredBooks.length > 0 ? (
                  <div className="user-books-grid">
                    {filteredBooks.map((book) => (
                      <div key={book.bookId || book._id} className="user-book-card">
                        <div className="book-cover-large">
                          <img 
                            src={book.thumbnail || book.cover || '/api/placeholder/200/300'} 
                            alt={book.title}
                            onError={(e) => {
                              e.target.src = '/api/placeholder/200/300';
                            }}
                          />
                          <div className={`book-status-badge ${mapStatus(book.status)}`}>
                            {mapStatus(book.status).toUpperCase()}
                          </div>
                          {book.readingProgress > 0 && book.status === 'reading' && (
                            <div className="reading-progress">
                              <div className="progress-bar">
                                <div 
                                  className="progress-fill" 
                                  style={{ width: `${book.readingProgress}%` }}
                                ></div>
                              </div>
                              <span className="progress-text">{book.readingProgress}%</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="book-details">
                          <h4 className="book-title">{book.title}</h4>
                          <p className="book-authors">
                            {Array.isArray(book.authors) ? book.authors.join(', ') : book.authors || 'Unknown Author'}
                          </p>
                          
                          {book.rating && renderStarRating(book.rating)}
                          
                          <div className="book-meta">
                            {book.genres && book.genres.length > 0 && (
                              <div className="book-genres">
                                {book.genres.slice(0, 2).map((genre, index) => (
                                  <span key={index} className="genre-tag">{genre}</span>
                                ))}
                                {book.genres.length > 2 && (
                                  <span className="genre-tag">+{book.genres.length - 2}</span>
                                )}
                              </div>
                            )}
                            
                            <div className="book-dates">
                              {book.dateAdded && (
                                <span className="date-info">
                                  Added: {formatDate(book.dateAdded)}
                                </span>
                              )}
                              {book.dateStarted && (
                                <span className="date-info">
                                  Started: {formatDate(book.dateStarted)}
                                </span>
                              )}
                              {book.dateFinished && (
                                <span className="date-info">
                                  Finished: {formatDate(book.dateFinished)}
                                </span>
                              )}
                            </div>
                            
                            {book.review && (
                              <div className="book-review">
                                <p>"{book.review.substring(0, 100)}{book.review.length > 100 ? '...' : ''}"</p>
                              </div>
                            )}
                            
                            {book.timeSpentReading > 0 && (
                              <div className="reading-time">
                                📖 {Math.round(book.timeSpentReading / 60)}h {book.timeSpentReading % 60}m read
                              </div>
                            )}
                          </div>
                          
                          <div className="book-actions">
                            <button className="action-btn primary">View Details</button>
                            <select 
                              className="status-select"
                              value={book.status}
                              onChange={(e) => handleStatusUpdate(book.bookId, e.target.value)}
                            >
                              <option value="want-to-read">Want to Read</option>
                              <option value="reading">Reading</option>
                              <option value="read">Read</option>
                              <option value="did-not-finish">Did Not Finish</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <div className="empty-icon">📚</div>
                    <h3>No books found</h3>
                    <p>
                      {selectedFilter === 'all' 
                        ? "You haven't added any books to your collection yet." 
                        : `No books found in the '${selectedFilter}' category.`
                      }
                    </p>
                    <button 
                      className="add-book-btn"
                      onClick={() => onNavigate && onNavigate('home')}
                    >
                      {selectedFilter === 'all' ? 'Discover Books' : 'Browse All Books'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default MyBooks;