import React, { useState } from 'react';
import './ContactUs.css';
import Contact from '../assets/customerSupport.png';
import avatar from '../assets/avatar.jpg';
import Phone from '../assets/ContactUS.png'

const ContactUs = ({ onNavigate }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    email: '',
    address: '',
    message: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Contact form submitted:', formData);
    // Here you would typically send the data to your backend
    alert('Message sent successfully!');
    // Reset form
    setFormData({
      fullName: '',
      phoneNumber: '',
      email: '',
      address: '',
      message: ''
    });
  };

  return (
    <div className="contact-page">
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
              onNavigate('home');
            }}
          >
            Home
          </a>
          <a 
             href="#" 
            className="nav-link"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('mybooks');
            }}
          >
            My Books
          </a>
          <a  
            href="#" 
            className="nav-link"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('feedback');
            }}
          >
            Feedback
          </a>
          <a href="#" className="nav-link active">Contact US</a>
        </nav>
        <div className="header-right">
          <div className="user-avatar">
            <img src={avatar} alt="User Avatar" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="contact-main">
        <div className="contact-container">
          {/* Contact Header */}
          <div className="contact-header">
            <h1 className="contact-title">contact us</h1>
          </div>

          <div className="contact-content">
            {/* Left Side - Information */}
            <div className="contact-info">
              <div className="contact-image">
                <img src={Contact} alt="Customer Support" className="customer-support-img" />
              </div>
              <div className="contact-description">
                <p>NOT SURE WHAT YOU NEED? OUR TEAM OF EXPERTS WILL BE HAPPY TO HEAR ALL YOUR THOUGHTS AND SUGGESTIONS. REACH OUT TODAY!</p>
              </div>
              
              <div className="contact-details">
                <div className="contact-item">
                  <div className="contact-icon">✉️</div>
                  <span>hamzaseidu.arts@gmail.com</span>
                </div>
                <div className="contact-item">
                  <div className="contact-icon">📞</div>
                  <span>+233 XX XXX XXXX</span>
                </div>
              </div>
            </div>

            {/* Right Side - Contact Form */}
            <div className="contact-form-section">
              <div className="form-card">
                <div className="form-header">
                  <h2>WE'D LOVE TO HEAR FROM YOU</h2>
                  <p>LET'S GET IN TOUCH</p>
                </div>
                
                <form onSubmit={handleSubmit} className="contact-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="fullName">Full Name</label>
                      <input
                        type="text"
                        id="fullName"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        placeholder="Enter Name"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="phoneNumber">Phone Number</label>
                      <input
                        type="tel"
                        id="phoneNumber"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleInputChange}
                        placeholder="Enter Number"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="email">Email</label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="Enter Email"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="address">Address</label>
                      <select
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">Select Address</option>
                        <option value="accra">Accra</option>
                        <option value="kumasi">Kumasi</option>
                        <option value="tamale">Tamale</option>
                        <option value="cape-coast">Cape Coast</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="form-group full-width">
                    <label htmlFor="message">Message</label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      placeholder="type your message here"
                      rows="5"
                      required
                    ></textarea>
                  </div>
                  
                  <div className="form-actions">
                    <button type="submit" className="send-message-btn">
                      SEND MESSAGE
                    </button>
                  </div>
                </form>
              </div>
              
              {/* Contact Us Illustration */}
              <div className="contact-us-illustration">
               <img src={Phone} alt="" className="contact-phone" /> 
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ContactUs;
                                                    