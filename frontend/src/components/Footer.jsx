import './Dashboard.css'

import React from 'react'

const Footer = () => {
  return (
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
          <h4 className="footer-logo">SmartReads</h4>
          <div className="app-downloads">
            <button className="download-btn apple">📱 App Store</button>
            <button className="download-btn google">📱 Google Play</button>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer
