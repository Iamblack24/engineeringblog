import React, { useState } from 'react';
import './GeotechnicalEngineeringFlashcards.css'; // Import the CSS file for styling

const GeotechnicalEngineeringFlashcards = () => {
  const flashcards = [
    {
      question: 'What is the primary purpose of a retaining wall?',
      answer: 'To retain soil and prevent erosion or collapse of slopes.',
    },
    {
      question: 'Define the term "Shear Strength" in soil mechanics.',
      answer: 'Shear strength is the resistance of soil to shear stress, preventing it from failing.',
    },
    {
      question: 'What is the significance of the Atterberg Limits?',
      answer: 'They define the critical water contents of fine-grained soils, indicating their plasticity.',
    },
    {
      question: 'Explain the concept of "Effective Stress".',
      answer: 'Effective stress is the stress carried by the soil skeleton, excluding pore water pressure.',
    },
    {
      question: 'What is the difference between consolidation and compression in soils?',
      answer: 'Consolidation is the process by which soils decrease in volume under sustained load, while compression refers to the immediate reduction in soil volume.',
    },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentIndex((prevIndex) =>
      prevIndex === flashcards.length - 1 ? 0 : prevIndex + 1
    );
  };

  const handlePrevious = () => {
    setIsFlipped(false);
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? flashcards.length - 1 : prevIndex - 1
    );
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  return (
    <div className="geotechnical-engineering-flashcards">
      <h1>Geotechnical Engineering Flashcards</h1>
      <p>Review key concepts and formulas with these flashcards.</p>

      <div className="flashcard-container">
        <div
          className={`flashcard ${isFlipped ? 'flipped' : ''}`}
          onClick={handleFlip}
        >
          <div className="front">
            <p>{flashcards[currentIndex].question}</p>
          </div>
          <div className="back">
            <p>{flashcards[currentIndex].answer}</p>
          </div>
        </div>
      </div>

      <div className="navigation-buttons">
        <button onClick={handlePrevious}>Previous</button>
        <button onClick={handleFlip}>Flip</button>
        <button onClick={handleNext}>Next</button>
      </div>

      <div className="progress">
        {currentIndex + 1} / {flashcards.length}
      </div>
    </div>
  );
};

export default GeotechnicalEngineeringFlashcards;
