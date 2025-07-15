import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './Dashboard.css';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const bookSuggestions = [
    { title: 'THE AFRICAN MIND', author: 'Nathaniel Bassey', cover: '/api/placeholder/120/180' },
    { title: 'Just One More Chapter', author: 'Various', cover: '/api/placeholder/120/180' },
    { title: 'Americanah', author: 'Chimamanda Ngozi Adichie', cover: '/api/placeholder/120/180' },
    { title: 'A Room Without Books', author: 'Various', cover: '/api/placeholder/120/180' },
    { title: 'Things Fall Apart', author: 'Chinua Achebe', cover: '/api/placeholder/120/180' },
    { title: 'THE AFRICAN MIND', author: 'Nathaniel Bassey', cover: '/api/placeholder/120/180' }
  ];

  const trendingBooks = [
    { title: 'AFRO', author: 'Various', cover: '/api/placeholder/120/180', rating: 4.5 },
    { title: 'A LAND OF WONDERS', author: 'Various', cover: '/api/placeholder/120/180', rating: 4.2 }
  ];

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
          <a href="#" className="nav-link active">Home</a>
          <a href="#" className="nav-link">My Books</a>
          <a href="#" className="nav-link">Feedback</a>
          <a href="#" className="nav-link">Contact US</a>
        </nav>
        <div className="header-right">
          <div className="user-avatar" onClick={handleLogout} title="Logout">
            <img src="/api/placeholder/40/40" alt="User" />
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
            {/* Suggestions Section */}
            <section className="suggestions-section">
              <div className="section-header">
                <h2>Suggestions</h2>
                <button className="auto-btn">🔄 AUTO</button>
              </div>
              <div className="books-grid">
                {bookSuggestions.map((book, index) => (
                  <div key={index} className="book-card">
                    <div className="book-cover">
                      <img src={book.cover} alt={book.title} />
                    </div>
                    <div className="book-info">
                      <h4>{book.title}</h4>
                      <p>{book.author}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Trending Books */}
            <section className="trending-section">
              <h2>Trending Books</h2>
              <div className="trending-grid">
                {trendingBooks.map((book, index) => (
                  <div key={index} className="trending-book">
                    <div className="book-cover">
                      <img src={book.cover} alt={book.title} />
                    </div>
                    <div className="book-rating">
                      {'⭐'.repeat(Math.floor(book.rating))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
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