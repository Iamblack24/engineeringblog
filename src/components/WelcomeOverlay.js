// src/components/WelcomeOverlay.js
import React, { useEffect, useState } from 'react';
import { CSSTransition } from 'react-transition-group';
import './WelcomeOverlay.css';

const WelcomeOverlay = ({ name, onClose }) => {
  const [showOverlay, setShowOverlay] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowOverlay(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setShowOverlay(false);
  };

  return (
    <CSSTransition
      in={showOverlay}
      timeout={300}
      classNames="overlay"
      unmountOnExit
      onExited={onClose}
    >
      <div className="welcome-overlay" onClick={handleClose}>
        <div className="welcome-message">
          <h2>Welcome, {name}!</h2>
          <p>We're glad to have you here.</p>
          <button onClick={handleClose}>Close</button>
        </div>
      </div>
    </CSSTransition>
  );
};

export default WelcomeOverlay;