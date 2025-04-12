import React, { useState } from 'react';
import axios from 'axios';
import './AIFlashcardGenerator.css';

const API_BASE_URL = 'https://flashcards-2iat.onrender.com/flashcards';

const AIFlashcardGenerator = ({ onClose }) => {
  const [unit, setUnit] = useState('');
  const [flashcards, setFlashcards] = useState([]);
  const [currentCard, setCurrentCard] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [error, setError] = useState(null);

  const generateFlashcards = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // First, check if flashcards already exist for this unit
      console.log('Checking for existing flashcards...');
      const existingResponse = await axios.get(`${API_BASE_URL}/flashcards/${unit}`);
      console.log('Existing flashcards response:', existingResponse.data);
      
      if (existingResponse.data.flashcards && existingResponse.data.flashcards.length > 0) {
        console.log('Found existing flashcards');
        setFlashcards(existingResponse.data.flashcards);
      } else {
        console.log('Generating new flashcards...');
        // Generate new flashcards using AI
        const response = await axios.post(`${API_BASE_URL}/generate-flashcards`, {
          unit: unit,
          count: 40
        });
        console.log('Generated flashcards response:', response.data);
        
        if (response.data.flashcards) {
          setFlashcards(response.data.flashcards);
        } else {
          throw new Error('No flashcards received from the server');
        }
      }
    } catch (error) {
      console.error('Detailed error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        stack: error.stack
      });
      
      const errorMessage = error.response?.data?.error || error.message || 'An unknown error occurred';
      setError(`Failed to generate flashcards: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = () => {
    if (currentCard < flashcards.length - 1) {
      setCurrentCard(currentCard + 1);
      setShowAnswer(false);
    }
  };

  const handlePrevious = () => {
    if (currentCard > 0) {
      setCurrentCard(currentCard - 1);
      setShowAnswer(false);
    }
  };

  return (
    <div className="flashcard-generator-modal">
      <div className="flashcard-generator-content">
        <button className="close-btn" onClick={onClose}>×</button>
        
        {error && (
          <div className="error-message">
            {error}
            <button 
              className="retry-btn" 
              onClick={() => {
                setError(null);
                generateFlashcards();
              }}
            >
              Retry
            </button>
          </div>
        )}
        
        {!flashcards.length ? (
          <div className="unit-input-section">
            <h2>Generate AI Flashcards</h2>
            <input
              type="text"
              placeholder="Enter the unit you want to study (e.g., Structural Analysis)"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
            />
            <button 
              onClick={generateFlashcards}
              disabled={isLoading || !unit}
            >
              {isLoading ? 'Generating please wait...' : 'Generate Flashcards'}
            </button>
          </div>
        ) : (
          <div className="flashcard-display">
            <div 
              className={`flashcard ${showAnswer ? 'flipped' : ''}`}
              onClick={() => setShowAnswer(!showAnswer)}
            >
              <div className="flashcard-inner">
                <div className="flashcard-front">
                  <h3>Question {currentCard + 1}</h3>
                  <p>{flashcards[currentCard].question}</p>
                </div>
                <div className="flashcard-back">
                  <h3>Answer</h3>
                  <p>{flashcards[currentCard].answer}</p>
                </div>
              </div>
            </div>
            
            <div className="flashcard-controls">
              <button onClick={handlePrevious} disabled={currentCard === 0}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 18l-6-6 6-6"/>
                </svg>
                Previous
              </button>
              <span>{currentCard + 1} / {flashcards.length}</span>
              <button onClick={handleNext} disabled={currentCard === flashcards.length - 1}>
                Next
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </button>
            </div>
          </div>
        )}
        
        {isLoading && (
          <div className="loading-overlay">
            <div className="pulse-spinner">
              <div className="spinner-inner"></div>
            </div>
            <p className="loading-text">Generating flashcards</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIFlashcardGenerator;