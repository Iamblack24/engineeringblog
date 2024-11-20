// src/pages/WebinarsPage.js
import React from 'react';
import './WebinarsPage.css';

const WebinarsPage = () => {
  return (
    <div className="webinars-page">
      <h1>Upcoming Webinars</h1>
      <div className="webinar-list">
        <div className="webinar-item">
            <img
                src="https://via.placeholder.com/150"
                alt="Sustainable Engineering Practices"
                className="webinar-page-image"
            />
          <h2>Sustainable Engineering Practices</h2>
          <p><strong>Date:</strong> May 20, 2024</p>
          <p><strong>Time:</strong> 2:00 PM - 4:00 PM</p>
          <p>Learn about sustainable solutions in modern engineering.</p>
        </div>
        {/* Add more webinar items as needed */}
      </div>
    </div>
  );
};

export default WebinarsPage;