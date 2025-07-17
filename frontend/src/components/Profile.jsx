import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './Profile.css';
import avatar from '../assets/avatar.jpg';
import bookCover1 from '../assets/find.png'; // Using existing assets as placeholders
import bookCover2 from '../assets/ContactUS.png';

const Profile = ({ onNavigate }) => {
  const { user, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleEditProfile = () => {
    setIsEditing(!isEditing);
  };

  // Mock reading data - in a real app this would come from the backend
  const readingData = {
    dailyStreak: 0,
    weeklyReading: [2, 0, 4, 1, 3, 0, 1], // Hours read each day
    currentBooks: [
      {
        id: 1,
        title: 'THE AFRICAN MIND',
        author: 'AUTHOR NAME',
        progress: 83,
        rating: 4,
        genre: 'GENRE',
        cover: bookCover1
      },
      {
        id: 2,
        title: 'THE AFRICAN MIND',
        author: 'AUTHOR NAME', 
        progress: 51,
        rating: 4,
        genre: 'GENRE',
        cover: bookCover2
      }
    ]
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, index) => (
      <span key={index} className={index < rating ? 'star filled' : 'star'}>
        ★
      </span>
    ));
  };

  const renderWeeklyChart = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const maxHours = Math.max(...readingData.weeklyReading);
    
    return (
      <div className="weekly-chart">
        <div className="chart-bars">
          {readingData.weeklyReading.map((hours, index) => (
            <div key={index} className="chart-day">
              <div 
                className="chart-bar" 
                style={{ height: `${(hours / (maxHours || 1)) * 100}%` }}
              ></div>
              <span className="chart-label">{days[index]}</span>
            </div>
          ))}
        </div>
        <div className="chart-y-axis">
          <span>5h</span>
          <span>4h</span>
          <span>3h</span>
          <span>2h</span>
          <span>1h</span>
          <span>0h</span>
        </div>
      </div>
    );
  };

  return (
    <div className="profile-page">
      {/* Header */}
      <header className="profile-header">
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
          <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigate('home'); }}>Home</a>
          <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigate('mybooks'); }}>My Books</a>
          <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigate('feedback'); }}>Feedback</a>
          <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigate('contact'); }}>Contact US</a>
        </nav>
        <div className="header-right">
          <div className="user-avatar active">
            <img src={avatar} alt="User" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="profile-main">
        <div className="profile-container">
          <h1 className="profile-title">profile</h1>
          
          {/* Profile Card */}
          <div className="profile-card">
            <button className="edit-profile-btn" onClick={handleEditProfile}>
              EDIT PROFILE
            </button>
            
            <div className="profile-content">
              <div className="profile-left">
                <div className="profile-avatar">
                  <img src={avatar} alt="User Avatar" />
                </div>
                <div className="profile-details">
                  <h3>DETAILS</h3>
                  <p><strong>USER NAME</strong></p>
                  <p>{user?.username || 'Username'}</p>
                  <p><strong>DETAILS</strong></p>
                  <p>MALE, CITY, COUNTRY</p>
                  <p><strong>BIRTHDAY:</strong> MM/DD/YYYY</p>
                  <p><strong>FAV GENRE</strong></p>
                  <p>ACTION, HORROR, COMEDY</p>
                  <p><strong>JOINED IN MM/DD/YYYY</strong></p>
                </div>
              </div>
              
              <div className="profile-right">
                <div className="favorite-books">
                  <div className="book-cover-display">
                    <img src={bookCover1} alt="Favorite Book 1" />
                  </div>
                  <div className="book-cover-display">
                    <img src={bookCover2} alt="Favorite Book 2" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Reading Section */}
          <div className="reading-section">
            <h2 className="section-title">READING</h2>
            
            {/* Current Reading Books */}
            {readingData.currentBooks.map((book) => (
              <div key={book.id} className="reading-book-card">
                <div className="book-info-left">
                  <img src={book.cover} alt={book.title} className="book-cover-small" />
                  <div className="book-details">
                    <h4>BOOK NAME</h4>
                    <p>{book.title}</p>
                    <p><strong>AUTHOR NAME</strong></p>
                    <p>{book.author}</p>
                    <div className="book-rating">
                      {renderStars(book.rating)}
                    </div>
                    <p><strong>GENRE</strong></p>
                    <p>{book.genre}</p>
                  </div>
                </div>
                <div className="book-progress">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${book.progress}%` }}
                    ></div>
                  </div>
                  <span className="progress-text">{book.progress}%</span>
                  <button className="continue-btn">CONTINUE</button>
                </div>
              </div>
            ))}
          </div>

          {/* Reading Stats */}
          <div className="reading-stats">
            <h3>HOW MUCH DID I READ</h3>
            <div className="stats-container">
              <div className="weekly-stats">
                {renderWeeklyChart()}
              </div>
              <div className="streak-stats">
                <div className="streak-icon">🔥</div>
                <div className="streak-info">
                  <span className="streak-number">{readingData.dailyStreak}</span>
                  <span className="streak-label">day(s) streak</span>
                  <p className="streak-subtitle">no streak started yet</p>
                </div>
              </div>
            </div>
          </div>

          {/* Logout Button */}
          <div className="logout-section">
            <button className="logout-btn" onClick={handleLogout}>
              LOGOUT
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;