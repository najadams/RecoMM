import React, { useState } from 'react';
import './Auth.css';
import { useAuth } from '../contexts/AuthContext';
import ladyReading from '../assets/ladyReading.png';
import manReading from '../assets/kidBehindBook.png';
import flyingWithBook from '../assets/flyingWithBook.png';

const Login = ({ onSwitchToSignup }) => {
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(formData);
      // User will be automatically redirected to dashboard via AuthContext
    } catch (error) {
      setError(error.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {/* Background decorative elements */}
      <div className="decorative-elements">
        <img src={ladyReading} alt="Lady reading" className="lady-reading" />
        <img src={manReading} alt="Man reading" className="man-reading" />
        <img src={flyingWithBook} alt="Flying with book" className="flying-book" />
      </div>

      {/* Header */}
      <header className="auth-header">
        <div className="logo">
          <div className="book-club-logo">
            <span className="book-text">BOOK</span>
            <span className="club-text">CLUB</span>
          </div>
          <span className="logo-name">LOGO NAME</span>
        </div>
      </header>

      {/* Main login form */}
      <div className="auth-form-container">
        <div className="welcome-section">
          <h1>welcome back</h1>
          <p className="login-subtitle">LOGIN TO CONTINUE</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="error-message">{error}</div>}

          <div className="input-group">
            <div className="input-wrapper">
              <span className="input-icon">👤</span>
              <input
                type="email"
                name="email"
                placeholder="Enter Email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <div className="input-wrapper">
              <span className="input-icon">🔒</span>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Enter Password"
                value={formData.password}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <button type="submit" className="auth-button login-button" disabled={loading}>
            {loading ? 'LOGGING IN...' : 'LOGIN'}
          </button>

          <a href="#" className="forgot-password">Forgot Password</a>

          <div className="social-login">
            <p className="login-with">LOGIN WITH</p>
            <div className="social-buttons">
              <button type="button" className="social-btn google">G</button>
              <button type="button" className="social-btn apple">🍎</button>
              <button type="button" className="social-btn facebook">f</button>
              <button type="button" className="social-btn twitter">X</button>
            </div>
          </div>
        </form>

        <p className="switch-auth">
          new user? please{' '}
          <button type="button" onClick={onSwitchToSignup} className="switch-link">
            sign up
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;