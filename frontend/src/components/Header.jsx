import React from 'react';
import './Header.css';
import avater from '../assets/avatar.jpg';

const Header = ({ currentView, onNavigate }) => {
  return (
    <header className="library-header sticky-header">
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
        <a 
          href="#" 
          className={`nav-link ${currentView === 'home' ? 'active' : ''}`} 
          onClick={(e) => { e.preventDefault(); onNavigate('home'); }}
        >
          Home
        </a>
        <a 
          href="#" 
          className={`nav-link ${currentView === 'mybooks' ? 'active' : ''}`} 
          onClick={(e) => { e.preventDefault(); onNavigate('mybooks'); }}
        >
          My Books
        </a>
        <a 
          href="#" 
          className={`nav-link ${currentView === 'feedback' ? 'active' : ''}`} 
          onClick={(e) => { e.preventDefault(); onNavigate('feedback'); }}
        >
          Feedback
        </a>
        <a 
          href="#" 
          className={`nav-link ${currentView === 'contact' ? 'active' : ''}`} 
          onClick={(e) => { e.preventDefault(); onNavigate('contact'); }}
        >
          Contact US
        </a>
      </nav>
      <div className="header-right">
        <div className="user-avatar" onClick={() => onNavigate('profile')} title="Profile">
          <img src={avater} alt="User" />
        </div>
      </div>
    </header>
  );
};

export default Header;