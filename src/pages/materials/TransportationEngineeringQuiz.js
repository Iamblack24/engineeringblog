import React, { useState } from 'react';
import './TransportationEngineeringQuiz.css'; // Import the CSS file for styling

const TransportationEngineeringQuiz = () => {
  const questions = [
    {
      question: 'What is the primary purpose of traffic signal systems?',
      options: ['To reduce vehicle speed', 'To control traffic flow', 'To increase road capacity', 'To enhance road aesthetics'],
      answer: 'To control traffic flow',
    },
    {
      question: 'What does AADT stand for in transportation engineering?',
      options: ['Average Annual Daily Traffic', 'Average Annual Distance Traveled', 'Average Annual Design Time', 'Average Annual Demand Traffic'],
      answer: 'Average Annual Daily Traffic',
    },
    {
      question: 'Which of the following is a common material used for road pavement?',
      options: ['Concrete', 'Glass', 'Wood', 'Brick'],
      answer: 'Concrete',
    },
    {
      question: 'What is the main function of a retaining wall in transportation projects?',
      options: ['To support overhead bridges', 'To retain soil and prevent erosion', 'To serve as a traffic barrier', 'To provide aesthetic value'],
      answer: 'To retain soil and prevent erosion',
    },
    {
      question: 'What does ITS stand for in the context of transportation engineering?',
      options: ['Integrated Traffic System', 'Intelligent Transportation Systems', 'Internal Transit Strategy', 'International Transport Standards'],
      answer: 'Intelligent Transportation Systems',
    },
  ];

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [userAnswers, setUserAnswers] = useState(Array(questions.length).fill(''));
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);

  const handleOptionChange = (e) => {
    const updatedAnswers = [...userAnswers];
    updatedAnswers[currentQuestion] = e.target.value;
    setUserAnswers(updatedAnswers);
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = () => {
    let calculatedScore = 0;
    userAnswers.forEach((answer, index) => {
      if (answer === questions[index].answer) {
        calculatedScore += 1;
      }
    });
    setScore(calculatedScore);
    setShowResults(true);
  };

  const handleRetake = () => {
    setUserAnswers(Array(questions.length).fill(''));
    setCurrentQuestion(0);
    setShowResults(false);
    setScore(0);
  };

  return (
    <div className="transportation-engineering-quiz">
      <h1>Transportation Engineering Quiz</h1>
      <p>Test your knowledge with this quiz on transportation engineering.</p>

      {!showResults ? (
        <div className="quiz-container">
          <div className="question-section">
            <h2>
              Question {currentQuestion + 1} of {questions.length}
            </h2>
            <p>{questions[currentQuestion].question}</p>
          </div>
          <div className="options-section">
            {questions[currentQuestion].options.map((option, index) => (
              <label key={index} className="option-label">
                <input
                  type="radio"
                  name={`question-${currentQuestion}`}
                  value={option}
                  checked={userAnswers[currentQuestion] === option}
                  onChange={handleOptionChange}
                />
                {option}
              </label>
            ))}
          </div>
          <div className="navigation-buttons">
            {currentQuestion > 0 && (
              <button onClick={handlePrevious}>Previous</button>
            )}
            {currentQuestion < questions.length - 1 && (
              <button onClick={handleNext} disabled={!userAnswers[currentQuestion]}>
                Next
              </button>
            )}
            {currentQuestion === questions.length - 1 && (
              <button onClick={handleSubmit} disabled={!userAnswers[currentQuestion]}>
                Submit
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="results-section">
          <h2>Your Results</h2>
          <p>
            You scored {score} out of {questions.length}
          </p>
          <button onClick={handleRetake}>Retake Quiz</button>
        </div>
      )}
    </div>
  );
};

export default TransportationEngineeringQuiz;