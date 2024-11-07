import React from 'react';
import './RevisionMaterialCard.css'; // Import the CSS file for styling

const RevisionMaterialCard = ({ title, description }) => {
  return (
    <div className="revision-material-card">
      <h2>{title}</h2> {/* Ensure the title is rendered here */}
      <p>{description}</p>
    </div>
  );
};

export default RevisionMaterialCard;