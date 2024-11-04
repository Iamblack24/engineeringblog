import React from 'react';
import { Link } from 'react-router-dom';
import './CaseStudyCard.css'; // Import the CSS file for styling

const CaseStudyCard = ({ id, title, description, image }) => {
  return (
    <div className="case-study-card">
      <img src={image} alt={title} className="case-study-image" />
      <h2>
        <Link to={`/case-studies/${id}`}>{title}</Link>
      </h2>
      <p>{description}</p>
    </div>
  );
};

export default CaseStudyCard;