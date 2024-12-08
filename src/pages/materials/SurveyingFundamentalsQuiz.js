import React, { useState } from 'react';
import './SurveyingFundamentalsQuiz.css';

const quizData = [
  {
    question: "What is the primary purpose of surveying?",
    options: [
      "To determine property boundaries only",
      "To determine relative positions of points on Earth's surface",
      "To measure distances between buildings",
      "To calculate areas of land parcels only"
    ],
    correctAnswer: 1
  },
  {
    question: "Calculate the correction for a 30m steel tape at 25°C if the tape was standardized at 20°C (α = 11.2 × 10⁻⁶/°C)",
    options: [
      "0.00168m",
      "0.00186m",
      "0.00192m",
      "0.00201m"
    ],
    correctAnswer: 0
  },
  {
    question: "What is the principle of electromagnetic distance measurement?",
    options: [
      "Using sound waves to measure distance",
      "Measuring phase difference between transmitted and received waves",
      "Using mechanical means to measure distance",
      "Using gravitational principles"
    ],
    correctAnswer: 1
  },
  {
    question: "In a closed traverse, what should be the sum of interior angles?",
    options: [
      "(n-2) × 180°",
      "(n+2) × 180°",
      "(2n-4) × 90°",
      "(n+4) × 90°"
    ],
    correctAnswer: 0
  },
  {
    question: "What is the Bowditch adjustment used for?",
    options: [
      "Correcting angular errors",
      "Adjusting distance measurements",
      "Distributing linear closing error in traverse",
      "Calculating areas"
    ],
    correctAnswer: 2
  },
  {
    question: "Calculate the radius of a curve with a deflection angle of 30° and tangent length of 100m",
    options: [
      "327.03m",
      "333.33m",
      "346.41m",
      "352.06m"
    ],
    correctAnswer: 1
  },
  {
    question: "What is the purpose of a planimeter?",
    options: [
      "Measuring horizontal angles",
      "Calculating areas of irregular figures",
      "Determining elevations",
      "Measuring distances"
    ],
    correctAnswer: 1
  },
  {
    question: "In total station surveying, what is PPM correction?",
    options: [
      "Pressure and Prism Modification",
      "Parts Per Million atmospheric correction",
      "Perpendicular Point Measurement",
      "Parallel Path Movement"
    ],
    correctAnswer: 1
  },
  {
    question: "What is the principle of three-wire leveling?",
    options: [
      "Taking three separate backsights",
      "Using three horizontal crosshairs for more precise readings",
      "Measuring three different heights",
      "Taking readings at three different times"
    ],
    correctAnswer: 1
  },
  {
    question: "Calculate the combined scale factor for a survey at 1000m elevation with grid scale factor 0.9996",
    options: [
      "0.9995",
      "0.9994",
      "0.9993",
      "0.9992"
    ],
    correctAnswer: 2
  },
  {
    question: "What is the purpose of reciprocal leveling?",
    options: [
      "To eliminate curvature and refraction errors",
      "To measure horizontal angles",
      "To determine distance",
      "To calculate areas"
    ],
    correctAnswer: 0
  },
  {
    question: "In GPS surveying, what is PDOP?",
    options: [
      "Position Dilution of Precision",
      "Precise Direction of Points",
      "Parallel Distribution of Positions",
      "Point Direction Operation Process"
    ],
    correctAnswer: 0
  },
  {
    question: "What is the principle of stadia tacheometry?",
    options: [
      "Measuring angles only",
      "Using fixed horizontal distances",
      "Using constant-ratio principle with stadia hairs",
      "Measuring only vertical distances"
    ],
    correctAnswer: 2
  },
  {
    question: "Calculate the azimuth of a line if its bearing is S45°E",
    options: [
      "45°",
      "135°",
      "225°",
      "315°"
    ],
    correctAnswer: 1
  },
  {
    question: "What is the purpose of a transitional curve in route surveying?",
    options: [
      "To connect straight and circular curves gradually",
      "To measure elevation differences",
      "To calculate areas",
      "To determine distances"
    ],
    correctAnswer: 0
  },
  {
    question: "In remote sensing, what does NDVI measure?",
    options: [
      "Soil moisture",
      "Vegetation health",
      "Building height",
      "Water depth"
    ],
    correctAnswer: 1
  },
  {
    question: "What is the principle of EDM phase measurement?",
    options: [
      "Measuring time of signal travel",
      "Comparing phases of transmitted and received signals",
      "Calculating direct distances",
      "Measuring angles"
    ],
    correctAnswer: 1
  },
  {
    question: "Calculate the horizontal distance if slope distance is 100m and vertical angle is 30°",
    options: [
      "86.60m",
      "87.50m",
      "88.60m",
      "89.50m"
    ],
    correctAnswer: 0
  },
  {
    question: "What is the purpose of triangulation in surveying?",
    options: [
      "To measure small distances",
      "To establish control points over large areas",
      "To determine elevation only",
      "To measure angles only"
    ],
    correctAnswer: 1
  },
  {
    question: "In LiDAR surveying, what does point cloud density indicate?",
    options: [
      "Battery life of equipment",
      "Number of points per unit area",
      "Signal strength",
      "Survey duration"
    ],
    correctAnswer: 1
  }
];

const SurveyingFundamentalsQuiz = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [showScore, setShowScore] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [incorrectAnswers, setIncorrectAnswers] = useState([]);

  const handleAnswerClick = (selectedOption) => {
    setSelectedAnswer(selectedOption);
    
    if (selectedOption === quizData[currentQuestion].correctAnswer) {
      setScore(score + 1);
    } else {
      setIncorrectAnswers(prev => [...prev, {
        question: quizData[currentQuestion].question,
        userAnswer: quizData[currentQuestion].options[selectedOption],
        correctAnswer: quizData[currentQuestion].options[quizData[currentQuestion].correctAnswer]
      }]);
    }

    const nextQuestion = currentQuestion + 1;
    if (nextQuestion < quizData.length) {
      setTimeout(() => {
        setCurrentQuestion(nextQuestion);
        setSelectedAnswer(null);
      }, 1000);
    } else {
      setTimeout(() => {
        setShowScore(true);
      }, 1000);
    }
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setScore(0);
    setShowScore(false);
    setSelectedAnswer(null);
    setIncorrectAnswers([]);
  };

  return (
    <div className="quiz-container">
      <h1>Surveying Fundamentals Quiz</h1>
      
      {showScore ? (
        <div className="score-section">
          <h2>You scored {score} out of {quizData.length}</h2>
          
          {incorrectAnswers.length > 0 && (
            <div className="incorrect-answers">
              <h3>Review Incorrect Answers:</h3>
              {incorrectAnswers.map((item, index) => (
                <div key={index} className="incorrect-answer-item">
                  <p><strong>Question:</strong> {item.question}</p>
                  <p><strong>Your Answer:</strong> <span className="wrong">{item.userAnswer}</span></p>
                  <p><strong>Correct Answer:</strong> <span className="correct">{item.correctAnswer}</span></p>
                </div>
              ))}
            </div>
          )}
          
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

export default SurveyingFundamentalsQuiz;
