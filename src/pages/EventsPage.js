// src/pages/EventsPage.js
import React from 'react';
import './EventsPage.css';

const EventsPage = () => {
  return (
    <div className="events-page">
      <h1>Upcoming Events</h1>
      <div className="event-list">
        <div className="event-item">
            <img
                src="https://via.placeholder.com/150"
                alt="Annual Engineering Conference 2024"
                className="event-page-image"
            />
          <h2>Annual Engineering Conference 2024</h2>
          <p><strong>Date:</strong> December 15, 2024</p>
          <p><strong>Location:</strong> Online / Nairobi</p>
          <p>Join industry leaders and experts to discuss the future of engineering.</p>
        </div>
        {/* Add more event items as needed */}
      </div>
    </div>
  );
};

export default EventsPage;