import React, { useState } from 'react';
import { motion } from 'framer-motion';
import './EventsPage.css';

const EventsPage = () => {
  const [selectedEvent, setSelectedEvent] = useState(null);

  const events = [
    {
      id: 1,
      title: "Annual Engineering Conference 2024",
      date: "2024-05-20T09:00:00",
      type: "Conference",
      image: "/interior4.jpg",
      attendees: 500,
      location: "Virtual Event",
      duration: "2 days",
      description: "Join industry leaders and experts to discuss the future of engineering. Topics include sustainable design, AI in engineering, and more.",
      price: "Free",
      speaker: "Multiple Speakers"
    },
    {
      id: 2,
      title: "BIM Workshop Series",
      date: "2024-04-28T15:00:00",
      type: "Workshop",
      image: "/build.jpg",
      attendees: 150,
      speaker: "John Smith",
      duration: "2 hours",
      description: "Learn advanced BIM techniques and best practices for modern construction projects.",
      price: "Ksh 5000",
      location: "Online"
    }
    // Add more events as needed
  ];

  const handleRegister = async (e, event) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    try {
      const response = await fetch('https://formsubmit.co/otienojohnmicheal2@gmail.com', {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        alert('Registration successful! We will contact you with more details.');
        setSelectedEvent(null);
      }
    } catch (error) {
      alert('Registration failed. Please try again later.');
    }
  };

  return (
    <motion.div 
      className="events-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="page-header">
        <h1>Engineering Events</h1>
        <p>Join our community events and enhance your engineering knowledge</p>
      </div>

      <div className="events-grid">
        {events.map((event) => {
          const eventDate = new Date(event.date);
          const isUpcoming = eventDate > new Date();
          
          return (
            <motion.div 
              key={event.id}
              className="event-card"
              whileHover={{ y: -5 }}
              transition={{ duration: 0.2 }}
            >
              <div className="event-image-container">
                <img
                  src={event.image}
                  alt={event.title}
                  className="event-image"
                  loading="lazy"
                />
                <div className="event-type-badge">
                  {event.type}
                </div>
                {isUpcoming && (
                  <div className="live-badge">
                    <span className="pulse"></span>
                    Upcoming
                  </div>
                )}
              </div>
              
              <div className="event-content">
                <div className="event-meta">
                  <span className="event-date">
                    {eventDate.toLocaleDateString('en-US', { 
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                  <span className="event-time">
                    {eventDate.toLocaleTimeString('en-US', { 
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                  <span className="event-duration">{event.duration}</span>
                </div>

                <h3>{event.title}</h3>
                <p>{event.description}</p>
                
                <div className="event-details">
                  {event.speaker && (
                    <div className="event-speaker">
                      <i className="fas fa-user"></i>
                      {event.speaker}
                    </div>
                  )}
                  {event.location && (
                    <div className="event-location">
                      <i className="fas fa-map-marker-alt"></i>
                      {event.location}
                    </div>
                  )}
                  <div className="event-attendees">
                    <i className="fas fa-users"></i>
                    {event.attendees} attending
                  </div>
                  <div className="event-price">
                    <i className="fas fa-ticket-alt"></i>
                    {event.price}
                  </div>
                </div>

                <button 
                  className="register-button"
                  onClick={() => setSelectedEvent(event)}
                >
                  Register Now
                  <i className="fas fa-arrow-right"></i>
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {selectedEvent && (
        <div className="registration-modal">
          <div className="modal-content">
            <button 
              className="close-button"
              onClick={() => setSelectedEvent(null)}
            >
              ×
            </button>
            <h2>Register for {selectedEvent.title}</h2>
            <form onSubmit={(e) => handleRegister(e, selectedEvent)}>
              <input type="hidden" name="_subject" value={`New Event Registration: ${selectedEvent.title}`} />
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

export default EventsPage;