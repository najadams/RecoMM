import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './Feedback.css';
import Find from '../assets/find.png';
import Avater from '../assets/avatar.jpg';

const Feedback = ({ onNavigate }) => {
  const { user, logout } = useAuth();
  const [reviewText, setReviewText] = useState('');
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleSubmitReview = (e) => {
    e.preventDefault();
    if (reviewText.trim() && rating > 0) {
      // Here you would typically send the review to your backend
      console.log('Review submitted:', {
        text: reviewText,
        rating: rating,
        book: 'Things Fall Apart',
        author: 'Chinua Achebe'
      });
      
      // Reset form
      setReviewText('');
      setRating(0);
      
      // Show success message (you could add a toast notification here)
      alert('Review submitted successfully!');
    } else {
      alert('Please provide both a rating and review text.');
    }
  };

  const renderStars = () => {
    return [1, 2, 3, 4, 5].map((star) => (
      <span
        key={star}
        className={`star ${
          star <= (hoveredRating || rating) ? 'filled' : 'empty'
        }`}
        onClick={() => setRating(star)}
        onMouseEnter={() => setHoveredRating(star)}
        onMouseLeave={() => setHoveredRating(0)}
      >
        ⭐
      </span>
    ));
  };

  return (
    <div className="feedback-page">
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
          <a
            href="#"
            className="nav-link"
            onClick={(e) => {
              e.preventDefault();
              onNavigate("home");
            }}>
            Home
          </a>
          <a
            href="#"
            className="nav-link"
            onClick={(e) => {
              e.preventDefault();
              onNavigate("mybooks");
            }}>
            My Books
          </a>
          <a href="#" className="nav-link active">
            Feedback
          </a>
          <a
            href="#"
            className="nav-link"
            onClick={(e) => {
              e.preventDefault();
              onNavigate("contact");
            }}>
            Contact US
          </a>
        </nav>
        <div className="header-right">
          <div className="user-avatar" onClick={handleLogout} title="Logout">
            <img src={Avater} alt="User" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="feedback-main">
        <div className="feedback-container">
          {/* Feedback Header */}
          <div className="feedback-header">
            <h1 className="feedback-title">feedback</h1>
            <div className="feedback-icon">
              <div>
                <img src={Find} alt="" className="feedback-illustration" />
              </div>
            </div>
          </div>

          {/* Review Form */}
          <div className="review-form-container">
            <div className="review-form-card">
              <h2 className="form-title">Write a Review</h2>

              {/* Book Display */}
              <div className="book-display">
                <div className="book-cover-review">
                  <img src="/api/placeholder/120/180" alt="Things Fall Apart" />
                </div>
                <div className="book-info-review">
                  <h3 className="book-name">Book Name</h3>
                  <p className="author-name">Author Name</p>
                </div>
              </div>

              {/* Rating Section */}
              <div className="rating-section">
                <div className="stars-container">{renderStars()}</div>
              </div>

              {/* Review Form */}
              <form onSubmit={handleSubmitReview} className="review-form">
                <div className="inline">
                  <div className="form-group">
                    <label htmlFor="review" className="form-label">
                      Reviews
                    </label>
                    <textarea
                      id="review"
                      className="review-textarea"
                      placeholder="Write your review about this book"
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      rows={6}
                      required
                    />
                  </div>
                  <div className="form-actions">
                    <button type="submit" className="send-btn">
                      SEND
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Feedback;