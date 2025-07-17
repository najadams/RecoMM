import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import MyBooks from './MyBooks';
import Feedback from './Feedback';
import ContactUs from './ContactUs';
import BookDetails from './BookDetails';
import apiService from '../services/api';
import './Dashboard.css';
import avater from '../assets/avatar.jpg';
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
  }, []);

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

  const handleNavigation = (view, book = null) => {
    setCurrentView(view);
    if (book) {
      setSelectedBook(book);
    }
  };

  const handleBookClick = (book) => {
    setSelectedBook(book);
    setCurrentView('book-details');
  };

  // If user is viewing Book Details, render the BookDetails component
  if (currentView === 'book-details' && selectedBook) {
    return <BookDetails book={selectedBook} onNavigate={handleNavigation} />;
  }

  // If user is viewing My Books, render the MyBooks component
  if (currentView === 'mybooks') {
    return <MyBooks onNavigate={setCurrentView} />;
  }

  // If user is viewing Feedback, render the Feedback component
  if (currentView === 'feedback') {
    return <Feedback onNavigate={setCurrentView} />;
  }

  // If user is viewing Contact Us, render the ContactUs component
  if (currentView === 'contact') {
    return <ContactUs onNavigate={setCurrentView} />;
  }

  return (
    <div className="library-dashboard">
      {/* Header */}
      <header className="library-header">
        <div className="header-left">
          <div className="logo">
            <div className="book-club-logo">
              <span className="book-text">BOOK</span>
              <span className="club-text">CLUB</span>
            </div>
            <span className="logo-name">LOGO NAME</span>
          </div>
        </div>
        <nav className="main-nav">
           <a href="#" className={`nav-link ${currentView === 'home' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setCurrentView('home'); }}>Home</a>
           <a href="#" className={`nav-link ${currentView === 'mybooks' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setCurrentView('mybooks'); }}>My Books</a>
           <a href="#" className={`nav-link ${currentView === 'feedback' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setCurrentView('feedback'); }}>Feedback</a>
           <a href="#" className={`nav-link ${currentView === 'contact' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setCurrentView('contact'); }}>Contact US</a>
         </nav>
        <div className="header-right">
          <div className="user-avatar" onClick={handleLogout} title="Logout">
            <img src={avater} alt="User" />
          </div>
        </div>
      </header>

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
              <button className="filter-btn">⚙️</button>
            </div>
          </div>
        </section>

        <div className="dashboard-content">
          {/* Sidebar */}
          <aside className="sidebar">
            <div className="book-shelf">
              <h3 className="shelf-title">BOOK SHELF</h3>
              <div className="shelf-items">
                <div className="shelf-item">
                  <span>ALL</span>
                  <span className="count">(0)</span>
                </div>
                <div className="shelf-item">
                  <span>READ</span>
                  <span className="count">(0)</span>
                </div>
                <div className="shelf-item">
                  <span>READING</span>
                  <span className="count">(0)</span>
                </div>
                <div className="shelf-item">
                  <span>SAVED</span>
                  <span className="count">(0)</span>
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

      {/* Footer */}
      <footer className="library-footer">
        <div className="footer-content">
          <div className="footer-section">
            <h4>COMPANY</h4>
            <ul>
              <li>About us</li>
              <li>Careers</li>
              <li>Terms</li>
              <li>Privacy</li>
              <li>Interest Based Ads</li>
              <li>Ad Preferences</li>
              <li>Help</li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h4>WORK WITH US</h4>
            <ul>
              <li>Authors</li>
              <li>Advertise</li>
              <li>Author & Ads blog</li>
              <li>API</li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h4>CONTACT</h4>
            <div className="social-links">
              <span>📘</span>
              <span>✖️</span>
              <span>📷</span>
              <span>💼</span>
            </div>
            <div className="support-section">
              <h5>SUPPORT</h5>
              <ul>
                <li>FAQ</li>
                <li>Search Guide</li>
              </ul>
            </div>
          </div>
          
          <div className="footer-section">
            <h4 className="footer-logo">Logo Name</h4>
            <div className="app-downloads">
              <button className="download-btn apple">📱 App Store</button>
              <button className="download-btn google">📱 Google Play</button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;