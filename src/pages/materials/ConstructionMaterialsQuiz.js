import React, { useState } from 'react';
import './ConstructionMaterialsQuiz.css';

const quizData = [
  {
    question: "What is the main component of Portland cement?",
    options: [
      "Calcium silicate",
      "Aluminum oxide",
      "Iron oxide", 
      "Magnesium oxide"
    ],
    correctAnswer: 0
  },
  {
    question: "Which property of concrete is measured using a slump test?",
    options: [
      "Strength",
      "Workability",
      "Durability",
      "Density"
    ],
    correctAnswer: 1
  },
  {
    question: "What is the purpose of adding steel reinforcement to concrete?",
    options: [
      "To reduce cost",
      "To increase workability",
      "To resist tensile forces",
      "To speed up curing"
    ],
    correctAnswer: 2
  },
  {
    question: "Which type of wood is most resistant to decay?",
    options: [
      "Pine",
      "Cedar",
      "Spruce",
      "Poplar"
    ],
    correctAnswer: 1
  },
  {
    question: "What is the primary advantage of structural steel?",
    options: [
      "Low cost",
      "Fire resistance",
      "High strength-to-weight ratio",
      "Corrosion resistance"
    ],
    correctAnswer: 2
  }
];

const ConstructionMaterialsQuiz = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [showScore, setShowScore] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);

  const handleAnswerClick = (selectedIndex) => {
    setSelectedAnswer(selectedIndex);
    
    if (selectedIndex === quizData[currentQuestion].correctAnswer) {
      setScore(score + 1);
    }

    setTimeout(() => {
      if (currentQuestion + 1 < quizData.length) {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedAnswer(null);
      } else {
        setShowScore(true);
      }
    }, 1000);
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setScore(0);
    setShowScore(false);
    setSelectedAnswer(null);
  };

  return (
    <div className="quiz-container">
      <h1>Construction Materials Quiz</h1>
      
      {showScore ? (
        <div className="score-section">
          <h2>You scored {score} out of {quizData.length}</h2>
          <button onClick={resetQuiz}>Try Again</button>
        </div>
      ) : (
        <div className="question-section">
          <div className="question-count">
            <span>Question {currentQuestion + 1}</span>/{quizData.length}
          </div>
          <div className="question-text">
            {quizData[currentQuestion].question}
          </div>
          <div className="answer-options">
            {quizData[currentQuestion].options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswerClick(index)}
                className={`option-button ${
                  selectedAnswer === index 
                    ? index === quizData[currentQuestion].correctAnswer
                      ? 'correct'
                      : 'incorrect'
                    : ''
                }`}
                disabled={selectedAnswer !== null}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ConstructionMaterialsQuiz;
