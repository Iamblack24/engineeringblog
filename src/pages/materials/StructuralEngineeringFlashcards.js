import React, { useState } from 'react';
import './StructuralEngineeringFlashcards.css'; // Import the CSS file for styling

const StructuralEngineeringFlashcards = () => {
  const flashcards = [
    {
      question: 'What is the primary purpose of a beam in structural engineering?',
      answer: 'To support loads and transfer them to columns or supports.',
    },
    {
      question: 'Define Young\'s Modulus.',
      answer: 'A measure of the stiffness of a material, defined as the ratio of stress to strain.',
    },
    {
      question: 'What is the difference between tension and compression?',
      answer: 'Tension pulls materials apart, while compression pushes materials together.',
    },
    {
      question: 'Explain the concept of shear force.',
      answer: 'Shear force is the internal force parallel to the cross-section of a structural element.',
    },
    {
      question: 'What is a moment in structural engineering?',
      answer: 'A measure of the rotational effect produced by a force applied at a distance from a pivot point.',
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
    <div className="structural-engineering-flashcards">
      <h1>Structural Engineering Flashcards</h1>
      <p>Review key concepts and formulas with these flashcards.</p>

      <div className="flashcard-container">
        <div className={`flashcard ${isFlipped ? 'flipped' : ''}`} onClick={handleFlip}>
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

export default StructuralEngineeringFlashcards;