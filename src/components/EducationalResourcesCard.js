// EducationalResourcesCard.js
import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import './EducationalResourcesCard.css';
import { AuthContext } from '../contexts/AuthContext';

const EducationalResourcesCard = ({ onAuthRequired }) => {
  const { currentUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleClick = () => {
    if (currentUser) {
      navigate('/educational-resources');
    } else {
      onAuthRequired();
    }
  };

  return (
    <div
      className="educational-resources-card"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleClick();
        }
      }}
      aria-label="Explore Educational Resources"
    >
      <h2>Access Educational YouTube Videos</h2>
      <p>
        Access a collection of educational YouTube videos specific to the built environment recommended by an elite group of lecturers.
      </p>
      <button type="button">Explore</button>
    </div>
  );
};

export default EducationalResourcesCard;