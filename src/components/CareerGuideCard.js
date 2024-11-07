// src/components/CaseStudyCard.js
import React from 'react';
import { Link } from 'react-router-dom';
import './CareerGuideCard.css'; // Import the CSS file for styling

const CareerGuideCard = ({ title, description, link }) => {
  return (
    <div className="career-guide-card">
      <h2>{title}</h2>
      <p>{description}</p>
      <Link to={link} className="guide-link">
        Read More
      </Link>
    </div>
  );
};

export default CareerGuideCard;