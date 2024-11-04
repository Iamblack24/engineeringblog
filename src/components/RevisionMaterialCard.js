import React from 'react';
import './RevisionMaterialCard.css'; // Import the CSS file for styling

const RevisionMaterialCard = ({ title, description, link }) => {
  return (
    <div className="revision-material-card">
      <h2>{title}</h2>
      <p>{description}</p>
      <a href={link} className="material-link">Access Material</a>
    </div>
  );
};

export default RevisionMaterialCard;