import React, { useState } from 'react';
import { motion } from 'framer-motion';
import './WebinarsPage.css';

const WebinarsPage = () => {
  const [selectedWebinar, setSelectedWebinar] = useState(null);

  const webinars = [
    {
      id: 1,
      title: "Sustainable Engineering Practices Webinar",
      date: "2024-04-15T14:00:00",
      image: "/front.jpeg",
      attendees: 234,
      speaker: "Dr. Sarah Chen",
      duration: "1.5 hours",
      description: "Learn about sustainable engineering practices and their implementation in modern projects.",
      price: "Free",
      topics: [
        "Green Building Design",
        "Renewable Energy Integration",
        "Sustainable Materials"
      ]
    },
    // Add more webinars as needed
  ];

  const handleRegister = async (e, webinar) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    try {
      const response = await fetch('https://formsubmit.co/otienojohnmicheal2@gmail.com', {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        alert('Registration successful! You will receive the webinar link via email.');
        setSelectedWebinar(null);
      }
    } catch (error) {
      alert('Registration failed. Please try again later.');
    }
  };

  return (
    <motion.div 
      className="webinars-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="page-header">
        <h1>Engineering Webinars</h1>
        <p>Learn from industry experts through our interactive webinars</p>
      </div>

      <div className="webinars-grid">
        {webinars.map((webinar) => {
          const webinarDate = new Date(webinar.date);
          const isUpcoming = webinarDate > new Date();
          
          return (
            <motion.div 
              key={webinar.id}
              className="webinar-card"
              whileHover={{ y: -5 }}
              transition={{ duration: 0.2 }}
            >
              <div className="webinar-image-container">
                <img
                  src={webinar.image}
                  alt={webinar.title}
                  className="webinar-image"
                  loading="lazy"
                />
                {isUpcoming && (
                  <div className="live-badge">
                    <span className="pulse"></span>
                    Upcoming
                  </div>
                )}
              </div>
              
              <div className="webinar-content">
                <div className="webinar-meta">
                  <span className="webinar-date">
                    {webinarDate.toLocaleDateString('en-US', { 
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                  <span className="webinar-time">
                    {webinarDate.toLocaleTimeString('en-US', { 
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                  <span className="webinar-duration">{webinar.duration}</span>
                </div>

                <h3>{webinar.title}</h3>
                <p>{webinar.description}</p>
                
                <div className="topics-list">
                  <h4>Topics Covered:</h4>
                  <ul>
                    {webinar.topics.map((topic, index) => (
                      <li key={index}>{topic}</li>
                    ))}
                  </ul>
                </div>

                <div className="webinar-details">
                  <div className="webinar-speaker">
                    <i className="fas fa-user"></i>
                    {webinar.speaker}
                  </div>
                  <div className="webinar-attendees">
                    <i className="fas fa-users"></i>
                    {webinar.attendees} registered
                  </div>
                  <div className="webinar-price">
                    <i className="fas fa-ticket-alt"></i>
                    {webinar.price}
                  </div>
                </div>

                <button 
                  className="register-button"
                  onClick={() => setSelectedWebinar(webinar)}
                >
                  Register Now
                  <i className="fas fa-arrow-right"></i>
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {selectedWebinar && (
        <div className="registration-modal">
          <div className="modal-content">
            <button 
              className="close-button"
              onClick={() => setSelectedWebinar(null)}
            >
              ×
            </button>
            <h2>Register for {selectedWebinar.title}</h2>
            <form onSubmit={(e) => handleRegister(e, selectedWebinar)}>
              <input type="hidden" name="_subject" value={`New Registration: ${selectedWebinar.title}`} />
              <input type="hidden" name="_template" value="table" />
              <input type="hidden" name="_captcha" value="true" />
              
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input 
                  type="text" 
                  id="name" 
                  name="Full Name" 
                  required 
                  placeholder="Enter your full name"
                />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input 
                  type="email" 
                  id="email" 
                  name="Email Address" 
                  required 
                  placeholder="Enter your email address"
                />
              </div>
              <div className="form-group">
                <label htmlFor="phone">Phone Number</label>
                <input 
                  type="tel" 
                  id="phone" 
                  name="Phone Number" 
                  required 
                  placeholder="Enter your phone number"
                />
              </div>
              <div className="form-group">
                <label htmlFor="organization">Organization</label>
                <input 
                  type="text" 
                  id="organization" 
                  name="Organization" 
                  placeholder="Enter your organization name (optional)"
                />
              </div>
              <div className="form-group">
                <label htmlFor="profession">Profession</label>
                <select id="profession" name="Profession" required>
                  <option value="">Select your profession</option>
                  <option value="Student">Engineering Student</option>
                  <option value="Professional">Professional Engineer</option>
                  <option value="Academic">Academic/Researcher</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <button type="submit" className="submit-button">
                Complete Registration
                <i className="fas fa-arrow-right"></i>
              </button>
            </form>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default WebinarsPage;