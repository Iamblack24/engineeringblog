import React from 'react';
import './CareerGuideCard.css'; // Import the CSS file for styling

const CareerGuideCard = ({ title, description, link }) => {
  return (
    <div className="career-guide-card">
      <h2>{title}</h2>
      <p>{description}</p>
      <a href={link} className="guide-link">Read More</a>
    </div>
  );
};

export default CareerGuideCard;