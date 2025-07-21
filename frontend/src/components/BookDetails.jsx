import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';
import Header from './Header';
import './BookDetails.css';
import avatar from '../assets/avatar.jpg';

const BookDetails = ({ book, onNavigate }) => {
  const { user, logout } = useAuth();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRating, setUserRating] = useState(0);
  const [userReview, setUserReview] = useState('');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [bookStatus, setBookStatus] = useState('want-to-read');
  const [readingProgress, setReadingProgress] = useState(0);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  useEffect(() => {
    loadRecommendations();
    loadUserBookStatus();
  }, [book]);

  const loadUserBookStatus = async () => {
    try {
      // Check if user has this book in their reading history
      const response = await apiService.getReadingHistory();
      // Handle both bookId (from reading history) and id (from AI recommendations)
      const userBook = response.readingHistory?.find(b => 
        b.bookId === book.id || b.id === book.id || b.bookId === book.bookId
      );
      
      if (userBook) {
        setBookStatus(userBook.status);
        setReadingProgress(userBook.readingProgress || userBook.progress || 0);
        setUserRating(userBook.rating || 0);
      }
    } catch (error) {
      console.error('Error loading user book status:', error);
    }
  };

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      // Get recommendations based on book categories or author
      const query = book.categories?.[0] || book.authors?.[0] || 'popular books';
      const recs = await apiService.searchBooks(query, 6);
      // Filter out the current book from recommendations
      setRecommendations(recs.filter(rec => rec.id !== book.id));
    } catch (error) {
      console.error('Error loading recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating, interactive = false, onStarClick = null) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span
          key={i}
          className={`star ${i <= rating ? 'filled' : ''} ${interactive ? 'interactive' : ''}`}
          onClick={() => interactive && onStarClick && onStarClick(i)}
        >
          ⭐
        </span>
      );
    }
    return stars;
  };

  const handleRatingSubmit = async () => {
    try {
      await apiService.updateBookStatus(book.id, bookStatus, {
        title: book.title,
        authors: book.authors,
        genres: book.categories,
        rating: userRating,
        review: userReview,
        progress: readingProgress
      });
      
      setShowReviewForm(false);
      setUserReview('');
    } catch (error) {
      console.error('Error submitting rating:', error);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (isUpdatingStatus) return;
    
    try {
      setIsUpdatingStatus(true);
      
      await apiService.updateBookStatus(book.id, newStatus, {
        title: book.title,
        authors: book.authors,
        genres: book.categories,
        rating: userRating,
        progress: newStatus === 'reading' ? readingProgress : 0
      });
      
      setBookStatus(newStatus);
      
      // Reset progress if changing from reading to want-to-read
      if (newStatus === 'want-to-read') {
        setReadingProgress(0);
      }
    } catch (error) {
      console.error('Error updating book status:', error);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleProgressChange = async (newProgress) => {
    setReadingProgress(newProgress);
    
    try {
      await apiService.updateReadingProgress(book.id, newProgress);
    } catch (error) {
      console.error('Error updating reading progress:', error);
    }
  };

  const mockReviews = [
    {
      id: 1,
      userName: 'User Name',
      userAvatar: avatar,
      rating: 5,
      date: 'Month DD, YYYY',
      review: 'Ut commodo elit adipiscing hendrerit non non elementum id id cursus non odio vel tincidunt quam at, ac sit Nam at, malesuada non placerat Nunc urna ex, eget.',
      likes: 54,
      reviews: 5000,
      followers: 102
    },
    {
      id: 2,
      userName: 'User Name',
      userAvatar: avatar,
      rating: 4,
      date: 'Month DD, YYYY',
      review: 'Ipsum ex sapien Lorem varius libero, placerat Cras nec dui Donec In ex felis, volutpat sit amet, varius tincidunt non tortor, elit. Morbi turpis venenatis dui.',
      likes: 54,
      reviews: 5000,
      followers: 102
    },
    {
      id: 3,
      userName: 'User Name',
      userAvatar: avatar,
      rating: 5,
      date: 'Month DD, YYYY',
      review: 'Nullam tincidunt lorem, ipsum Donec fringilla Vestibulum sit consectetur Nam dui, hendrerit vitae turpis lorem. Quisque placerat ex, Cras massa ex ex nisl, ex',
      likes: 54,
      reviews: 5000,
      followers: 102
    }
  ];

  return (
    <div className="book-details-page">
      {/* Header */}
      <Header currentView="bookdetails" onNavigate={onNavigate} />

      {/* Main Content */}
      <main className="book-details-main">
        {/* Book Information Section */}
        <section className="book-info-section">
          <div className="book-info-container">
            <div className="book-cover-large">
              <img src={book.thumbnail} alt={book.title} onError={(e) => {
                e.target.src = '/api/placeholder/300/450';
              }} />
            </div>
            
            <div className="book-details-info">
              <h1 className="book-title">{book.title}</h1>
              <p className="book-author">{book.authors?.join(', ')}</p>
              
              <div className="book-rating-section">
                <div className="rating-display">
                  {renderStars(Math.floor(book.rating))}
                  <span className="rating-number">{book.rating}</span>
                  <span className="rating-count">({book.ratingsCount} Ratings · 766 Reviews)</span>
                </div>
              </div>

              <div className="book-description">
                <p>{book.description}</p>
              </div>

              <div className="book-actions">
                <div className="action-buttons">
                  {bookStatus === 'reading' ? (
                    <button 
                      className="btn-primary"
                      onClick={() => handleStatusChange('want-to-read')}
                      disabled={isUpdatingStatus}
                    >
                      {isUpdatingStatus ? 'Updating...' : 'Currently Reading'}
                    </button>
                  ) : (
                    <button 
                      className="btn-secondary"
                      onClick={() => handleStatusChange('reading')}
                      disabled={isUpdatingStatus}
                    >
                      {isUpdatingStatus ? 'Updating...' : 'Want to Read'}
                    </button>
                  )}
                </div>
                
                {(bookStatus === 'reading' || (readingProgress > 0 && bookStatus !== 'want-to-read')) && (
                  <div className="reading-progress">
                    <div className="progress-header">
                      <span>{bookStatus === 'read' ? 'Completed' : 'Reading Progress'}</span>
                      <span>{Math.round(readingProgress)}%</span>
                    </div>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{width: `${readingProgress}%`}}
                      ></div>
                    </div>
                    {bookStatus === 'reading' && (
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={readingProgress}
                        onChange={(e) => handleProgressChange(parseInt(e.target.value))}
                        className="progress-slider"
                      />
                    )}
                    {bookStatus === 'read' && readingProgress === 100 && (
                      <div className="completion-badge">
                        ✅ Book Completed!
                      </div>
                    )}
                    {bookStatus === 'did-not-finish' && (
                      <div className="dnf-badge">
                        📚 Did not finish at {Math.round(readingProgress)}%
                      </div>
                    )}
                  </div>
                )}
                
                <div className="user-rating">
                  <span>Rate this book</span>
                  <div className="rating-stars">
                    {renderStars(userRating, true, setUserRating)}
                  </div>
                </div>
              </div>

              <div className="book-metadata">
                <div className="metadata-row">
                  <span className="label">Genres:</span>
                  <div className="genres">
                    {book.categories?.map((category, index) => (
                      <span key={index} className="genre-tag">{category}</span>
                    )) || <span className="genre-tag">Fiction</span>}
                  </div>
                </div>
                
                <div className="metadata-item">
                  <span className="label">No of Pages:</span>
                  <span>{book.pageCount || 'Unknown'}</span>
                </div>
                
                <div className="metadata-item">
                  <span className="label">Publication:</span>
                  <span>{book.publishedDate}</span>
                </div>
              </div>

              <div className="book-editions">
                <h3>This Edition</h3>
                <div className="edition-info">
                  <div className="edition-item">
                    <span className="label">Format:</span>
                    <span>Hardcover</span>
                  </div>
                  <div className="edition-item">
                    <span className="label">Expected Publication:</span>
                    <span>{book.publishedDate} by {book.authors?.[0]}</span>
                  </div>
                  <div className="edition-item">
                    <span className="label">ISBN:</span>
                    <span>1234567890 (ISBN10: 1234567890)</span>
                  </div>
                  <div className="edition-item">
                    <span className="label">Language:</span>
                    <span>{book.language === 'en' ? 'English' : book.language}</span>
                  </div>
                </div>
              </div>

              <div className="more-editions">
                <h3>More Editions</h3>
                <div className="editions-grid">
                  {[1, 2, 3, 4].map((_, index) => (
                    <div key={index} className="edition-card">
                      <img src={book.thumbnail} alt={`${book.title} edition`} />
                      <div className="edition-details">
                        <p className="edition-type">{['eBook', 'Hardcover', 'Paperback', 'Kindle'][index]}</p>
                        <p className="edition-name">Edition Name</p>
                        <p className="edition-year">Year</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Community Stats */}
        <section className="community-stats">
          <div className="stats-container">
            <div className="stat-item">
              <img src={avatar} alt="Readers" className="stat-icon" />
              <span>411 people are currently reading</span>
            </div>
            <div className="stat-item">
              <img src={avatar} alt="Want to read" className="stat-icon" />
              <span>1118 people want to Read</span>
            </div>
          </div>
        </section>

        {/* Author Section */}
        <section className="author-section">
          <h2>About the Author</h2>
          <div className="author-info">
            <div className="author-avatar">
              <img src={avatar} alt={book.authors?.[0]} />
            </div>
            <div className="author-details">
              <h3>{book.authors?.[0] || 'Author Name'}</h3>
              <div className="author-stats">
                <span>No of Books: 5</span>
                <span>No of Followers: 1,234</span>
              </div>
              <p className="author-bio">
                {book.description ? book.description.substring(0, 200) + '...' : 
                'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'}
              </p>
              <button className="btn-follow">Follow</button>
            </div>
          </div>
        </section>

        {/* Reviews Section */}
        <section className="reviews-section">
          <div className="reviews-header">
            <div className="rating-overview">
              <h2>Rating & Reviews</h2>
              <div className="overall-rating">
                <div className="rating-stars-large">
                  {renderStars(Math.floor(book.rating))}
                </div>
                <span className="rating-number-large">{book.rating}</span>
                <span className="rating-text">({book.ratingsCount} Ratings · 766 Reviews)</span>
              </div>
            </div>
            
            <div className="rating-breakdown">
              <h3>Community Reviews</h3>
              <div className="rating-bars">
                {[5, 4, 3, 2, 1].map(stars => (
                  <div key={stars} className="rating-bar-row">
                    <span>{stars} stars</span>
                    <div className="rating-bar">
                      <div className="rating-fill" style={{width: `${Math.random() * 80 + 10}%`}}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="user-review-section">
            <div className="review-prompt">
              <img src={avatar} alt="User" className="user-avatar-small" />
              <div className="review-form">
                <h3>What Do You Think?</h3>
                <div className="rating-input">
                  {renderStars(userRating, true, setUserRating)}
                </div>
                <button 
                  className="btn-write-review"
                  onClick={() => setShowReviewForm(!showReviewForm)}
                >
                  Write a review
                </button>
              </div>
            </div>

            {showReviewForm && (
              <div className="review-form-expanded">
                <textarea
                  value={userReview}
                  onChange={(e) => setUserReview(e.target.value)}
                  placeholder="Write your review here..."
                  className="review-textarea"
                />
                <div className="review-actions">
                  <button className="btn-submit" onClick={handleRatingSubmit}>Submit Review</button>
                  <button className="btn-cancel" onClick={() => setShowReviewForm(false)}>Cancel</button>
                </div>
              </div>
            )}
          </div>

          <div className="reviews-list">
            <h3>Readers Reviews</h3>
            <p className="reviews-count">Displaying 1 - 10 of 68 reviews</p>
            
            {mockReviews.map(review => (
              <div key={review.id} className="review-item">
                <div className="review-header">
                  <img src={review.userAvatar} alt={review.userName} className="reviewer-avatar" />
                  <div className="reviewer-info">
                    <h4>{review.userName}</h4>
                    <p className="reviewer-stats">{review.reviews} Reviews · {review.followers} Followers</p>
                  </div>
                  <div className="review-date">{review.date}</div>
                </div>
                
                <div className="review-content">
                  <div className="review-rating">
                    {renderStars(review.rating)}
                  </div>
                  <p className="review-text">{review.review}</p>
                  
                  <div className="review-actions">
                    <button className="review-action">
                      <span className="like-icon">👍</span>
                      <span>{review.likes} Likes</span>
                    </button>
                    <button className="review-action">
                      <span className="comment-icon">💬</span>
                      <span>Comment</span>
                    </button>
                    <button className="review-action">
                      <span className="more-icon">⋯</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
            
            <button className="btn-load-more">Load More Reviews</button>
          </div>
        </section>

        {/* Recommendations Section */}
        <section className="recommendations-section">
          <h2>Readers also Enjoyed</h2>
          {loading ? (
            <div className="loading-recommendations">
              <p>Loading recommendations...</p>
            </div>
          ) : (
            <div className="recommendations-grid">
              {recommendations.slice(0, 6).map((recBook) => (
                <div key={recBook.id} className="recommendation-card" onClick={() => onNavigate('book-details', recBook)}>
                  <div className="rec-book-cover">
                    <img src={recBook.thumbnail} alt={recBook.title} onError={(e) => {
                      e.target.src = '/api/placeholder/120/180';
                    }} />
                  </div>
                  <div className="rec-book-info">
                    <h4>{recBook.title.length > 20 ? recBook.title.substring(0, 20) + '...' : recBook.title}</h4>
                    <p>{recBook.authors?.join(', ')}</p>
                    {recBook.rating > 0 && (
                      <div className="rec-rating">
                        <span className="rating-number">{recBook.rating}</span>
                        <span className="rating-stars">{renderStars(Math.floor(recBook.rating))}</span>
                        <span className="rating-count">{recBook.ratingsCount}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <button className="btn-all-similar">All Similar Books</button>
        </section>
      </main>
    </div>
  );
};

export default BookDetails;