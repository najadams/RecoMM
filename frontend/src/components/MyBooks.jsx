import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './MyBooks.css';
import avatar from '../assets/avatar.jpg'

const MyBooks = ({ onNavigate }) => {
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Sample user books data
  const userBooks = [
    { id: 1, title: 'BITTER', author: 'Akwaeke Emezi', cover: '/api/placeholder/200/300', status: 'read' },
    { id: 2, title: 'Things Fall Apart', author: 'Chinua Achebe', cover: '/api/placeholder/200/300', status: 'reading' },
    { id: 3, title: 'A Room Without Books', author: 'Cicero', cover: '/api/placeholder/200/300', status: 'saved' },
    { id: 4, title: "There's A Million Books I Haven't Read", author: 'Various', cover: '/api/placeholder/200/300', status: 'reading' }
  ];

  const filteredBooks = userBooks.filter(book => 
    book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    book.author.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getBooksByStatus = (status) => {
    return filteredBooks.filter(book => book.status === status);
  };

  const getStatusCount = (status) => {
    return userBooks.filter(book => book.status === status).length;
  };

  return (
    <div className="my-books-page">
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
          <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigate && onNavigate('home'); }}>Home</a>
          <a href="#" className="nav-link active" >My Books</a>
          <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigate && onNavigate('feedback'); }}>Feedback</a>
          <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigate && onNavigate('contactus'); }}>Contact US</a>
        </nav>
        <div className="header-right">
          <div className="user-avatar" onClick={handleLogout} title="Logout">
            <img src={avatar} alt="User" />
          </div>
        </div>
      </header>

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
                <div className="shelf-item">
                  <span>ALL</span>
                  <span className="count">({userBooks.length})</span>
                </div>
                <div className="shelf-item">
                  <span>READ</span>
                  <span className="count">({getStatusCount('read')})</span>
                </div>
                <div className="shelf-item">
                  <span>READING</span>
                  <span className="count">({getStatusCount('reading')})</span>
                </div>
                <div className="shelf-item">
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

          {/* Main Books Display */}
          <div className="books-main-content">
            <div className="books-grid-container">
              {filteredBooks.length > 0 ? (
                <div className="user-books-grid">
                  {filteredBooks.map((book) => (
                    <div key={book.id} className="user-book-card">
                      <div className="book-cover-large">
                        <img src={book.cover} alt={book.title} />
                        <div className={`book-status-badge ${book.status}`}>
                          {book.status.toUpperCase()}
                        </div>
                      </div>
                      <div className="book-details">
                        <h4 className="book-title">{book.title}</h4>
                        <p className="book-author">{book.author}</p>
                        <div className="book-actions">
                          <button className="action-btn primary">View Details</button>
                          <button className="action-btn secondary">Update Status</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">📚</div>
                  <h3>No books found</h3>
                  <p>Try adjusting your search or add some books to your collection.</p>
                  <button className="add-book-btn">Add Your First Book</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MyBooks;