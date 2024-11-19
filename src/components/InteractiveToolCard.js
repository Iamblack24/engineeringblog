import React from 'react';
import './InteractiveToolCard.css';

const InteractiveToolCard = ({ title, description, link, onClick }) => {
  return (
    <div className="interactive-tool-card" onClick={onClick}>
      <h2>{title}</h2>
      <p>{description}</p>
      <a href={link} onClick={(e) => e.preventDefault()}>Use Tool</a>
    </div>
  );
};

export default InteractiveToolCard;