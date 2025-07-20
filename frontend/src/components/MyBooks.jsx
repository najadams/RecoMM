import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getReadingHistory, getReadingStats, updateBookStatus, getBookDetails } from '../services/api';
import Header from './Header';
import './MyBooks.css';
import './Dashboard.css'
import Footer from './Footer';

// Enhanced styles for the new features
const styles = `
  .user-books-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 1.5rem;
    margin-bottom: 3rem;
  }

  .user-book-card {
    border-radius: 15px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    text-align: center;
    cursor: pointer;
    background: #fff599;
    width: 150px;
  }

  .user-book-card:hover {
    transform: translateY(-5px);
  }

  .book-cover-large {
    position: relative;
    width: 120px;
    height: 180px;
    background: #ddd;
    border-radius: 8px;
    margin: 0 auto 0.5rem;
    overflow: hidden;
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  }

  .book-cover-large img {
    margin-bottom: 10px;
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
    text-align: center;
    margin-top: 1rem;
  }

  .book-title {
    margin: 0.5rem 0 0.25rem 0;
    font-size: 0.9rem;
    color: #2c3e50;
    font-weight: bold;
  }

  .book-authors {
    margin: 0;
    font-size: 0.8rem;
    color: #7f8c8d;
  }

  .book-rating {
    margin-top: 0.5rem;
    font-size: 0.8rem;
  }

  .star-rating {
    display: flex;
    justify-content: center;
    gap: 2px;
    margin-bottom: 8px;
  }

  .star {
    font-size: 0.8rem;
  }

  .star.filled {
    color: #fbbf24;
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

  // Handle book click to navigate to book details
  const handleBookClick = (book) => {
    if (onNavigate) {
      // Format book data to match the expected structure for BookDetails
      const formattedBook = {
        id: book.bookId,
        title: book.title || 'Unknown Title',
        authors: Array.isArray(book.authors) ? book.authors : [book.authors || 'Unknown Author'],
        thumbnail: book.thumbnail || book.cover || book.imageLinks?.thumbnail,
        description: book.description,
        rating: book.rating,
        ratingsCount: book.ratingsCount,
        publishedDate: book.publishedDate,
        pageCount: book.pageCount,
        categories: book.categories,
        language: book.language,
        status: book.status
      };
      onNavigate('book-details', formattedBook);
    }
  };

  // Function to enrich book data with external details
  const enrichBookData = async (book) => {
    try {
      // If book already has complete data, return as is
      if (book.title && book.title !== 'Unknown Title' && book.authors && book.authors.length > 0 && book.thumbnail) {
        return book;
      }
      
      // Fetch external book details using the bookId
      const externalDetails = await getBookDetails(book.bookId);
      
      // Merge external details with existing book data, prioritizing external data for missing fields
      return {
        ...book,
        title: book.title && book.title !== 'Unknown Title' ? book.title : externalDetails.title,
        authors: book.authors && book.authors.length > 0 ? book.authors : externalDetails.authors,
        thumbnail: book.thumbnail || externalDetails.thumbnail,
        description: book.description || externalDetails.description,
        rating: book.rating || externalDetails.rating,
        ratingsCount: book.ratingsCount || externalDetails.ratingsCount,
        publishedDate: book.publishedDate || externalDetails.publishedDate,
        pageCount: book.pageCount || externalDetails.pageCount,
        categories: book.categories && book.categories.length > 0 ? book.categories : externalDetails.categories,
        language: book.language || externalDetails.language,
        previewLink: book.previewLink || externalDetails.previewLink,
        infoLink: book.infoLink || externalDetails.infoLink
      };
    } catch (error) {
      console.error('Error enriching book data for book ID:', book.bookId, error);
      // Return original book data if enrichment fails
      return book;
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
        
        console.log('Reading history response:', historyResponse);
        
        if (historyResponse.success) {
          const rawBooks = historyResponse.readingHistory || [];
          console.log('Raw user books:', rawBooks);
          
          // Enrich book data with external details
          const enrichedBooks = await Promise.all(
            rawBooks.map(book => enrichBookData(book))
          );
          
          console.log('Enriched user books:', enrichedBooks);
          setUserBooks(enrichedBooks);
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
        // Refresh the books list with enriched data
        const historyResponse = await getReadingHistory();
        if (historyResponse.success) {
          const rawBooks = historyResponse.readingHistory || [];
          const enrichedBooks = await Promise.all(
            rawBooks.map(book => enrichBookData(book))
          );
          setUserBooks(enrichedBooks);
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
            <h1 className="title">my books</h1>
          </div>
          
          <div className="search-containerB">
            <div className="search-wrapper">
              <span className="search-icon">🔍</span>
              <input 
                type="text" 
                placeholder="Search Your Books" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
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
                    {filteredBooks.map((book) => {
                      console.log('Rendering book:', book);
                      return (
                        <div 
                          key={book.bookId || book._id} 
                          className="user-book-card"
                          onClick={() => handleBookClick(book)}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className="book-cover-largek">
                            <img 
                              src={book.thumbnail || book.cover || book.imageLinks?.thumbnail || 'https://via.placeholder.com/128x192/cccccc/666666?text=No+Cover'} 
                              alt={book.title || 'Unknown Title'}
                              className="book-cover"
                              onError={(e) => {
                                e.target.src = 'https://via.placeholder.com/128x192/cccccc/666666?text=No+Cover';
                              }}
                            />
                          </div>
                          
                          <div className="book-details">
                            <h4 className="book-title" title={book.title || 'Unknown Title'}>
                              {(book.title || 'Unknown Title').length > 30 ? (book.title || 'Unknown Title').substring(0, 30) + '...' : (book.title || 'Unknown Title')}
                            </h4>
                            <p className="book-authors" title={Array.isArray(book.authors) ? book.authors.join(', ') : book.authors || 'Unknown Author'}>
                              {Array.isArray(book.authors) && book.authors.length > 0 ? book.authors.join(', ') : book.authors || 'Unknown Author'}
                            </p>
                            
                            {book.rating && book.rating > 0 && (
                               <div className="book-rating">
                                 {renderStars(book.rating)} ({book.rating})
                               </div>
                             )}
                          </div>
                        </div>
                      );
                    })}
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