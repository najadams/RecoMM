import  { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './Header.css';
import avatar from '../assets/avatar.jpg';

const Header = ({ currentView, onNavigate }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  useEffect(() => {
    const controlHeader = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY < 10) {
        // Always show header at the top
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down - hide header
        setIsVisible(false);
      } else if (currentScrollY < lastScrollY) {
        // Scrolling up - show header
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', controlHeader);
    return () => window.removeEventListener('scroll', controlHeader);
  }, [lastScrollY]);

  return (
    <header className={`library-header sticky-header ${isVisible ? 'header-visible' : 'header-hidden'}`}>
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
          className={`nav-link ${currentView === 'contactus' ? 'active' : ''}`} 
          onClick={(e) => { e.preventDefault(); onNavigate('contact'); }}
        >
          Contact US
        </a>
      </nav>
      <div className="header-right">
        <div className="user-avatar" onClick={() => onNavigate('profile')} title="Profile">
          <img src={avatar} alt="User" />
        </div>
      </div>
    </header>
  );
};

export default Header;