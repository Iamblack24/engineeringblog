import React from 'react';
import './InteractiveToolCard.css'; // Import the CSS file for styling

const InteractiveToolCard = ({ title, description, link }) => {
  return (
    <div className="interactive-tool-card">
      <h2>{title}</h2>
      <p>{description}</p>
      <a href={link} className="tool-link">Use Tool</a>
    </div>
  );
};

export default InteractiveToolCard;