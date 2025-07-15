import React, { useState } from 'react';
import './Auth.css';
import { useAuth } from '../contexts/AuthContext';
import ladyReading from '../assets/ladyReading.png';
import manReading from '../assets/kidBehindBook.png';
import flyingWithBook from '../assets/flyingWithBook.png';

const Signup = ({ onSwitchToLogin }) => {
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Client-side validation
    if (password !== confirmPassword) {
      setError('Passwords do not match!');
      setLoading(false);
      return;
    }

    try {
      const formData = { email, username, password, confirmPassword };
      await register(formData);
      // User will be automatically redirected to dashboard via AuthContext
    } catch (error) {
      setError(error.message || 'Registration failed. Please try again.');
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
          <div className="logo-name-container">
            <span className="logo-name">LOGO NAME</span>
          </div>
        </div>
      </header>

      {/* Main signup form */}
      <div className="auth-form-container">
        <div className="welcome-section">
          <h1>welcome to logo name</h1>
          <p className="login-subtitle">SIGN UP TO CONTINUE</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <div className="input-wrapper">
              <span className="input-icon">📧</span>
              <input
                type="email"
                placeholder="Enter Email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError('');
                }}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <div className="input-wrapper">
              <span className="input-icon">👤</span>
              <input
                type="text"
                placeholder="Enter Username"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (error) setError('');
                }}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <div className="input-wrapper">
              <span className="input-icon">🔒</span>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Create Password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError('');
                }}
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

          <div className="input-group">
            <div className="input-wrapper">
              <span className="input-icon">🔒</span>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (error) setError('');
                }}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="auth-button signup-button" disabled={loading}>
            {loading ? 'SIGNING UP...' : 'SIGN UP'}
          </button>

          <div className="social-login">
            <p className="login-with">SIGN UP WITH</p>
            <div className="social-buttons">
              <button type="button" className="social-btn google">G</button>
              <button type="button" className="social-btn apple">🍎</button>
              <button type="button" className="social-btn facebook">f</button>
              <button type="button" className="social-btn twitter">X</button>
            </div>
          </div>
        </form>

        <p className="switch-auth">
          already have an account?{' '}
          <button type="button" onClick={onSwitchToLogin} className="switch-link">
            login
          </button>
        </p>
      </div>
    </div>
  );
};

export default Signup;