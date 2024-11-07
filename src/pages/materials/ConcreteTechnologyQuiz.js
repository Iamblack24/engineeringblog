import React, { useState } from 'react';
import './ConcreteTechnologyQuiz.css'; // Import the CSS file for styling

const ConcreteTechnologyQuiz = () => {
  const questions = [
    {
      question: 'What is the primary binding agent in concrete?',
      options: ['Sand', 'Cement', 'Gravel', 'Water'],
      answer: 'Cement',
    },
    {
      question: 'What is the standard ratio of water to cement in concrete mix?',
      options: ['0.3', '0.5', '0.7', '1.0'],
      answer: '0.5',
    },
    {
      question: 'What process involves keeping concrete moist to gain strength?',
      options: ['Mixing', 'Curing', 'Setting', 'Finishing'],
      answer: 'Curing',
    },
    {
      question: 'Which type of concrete has fibers added for reinforcement?',
      options: ['Plain Concrete', 'Reinforced Concrete', 'Prestressed Concrete', 'Fiber-Reinforced Concrete'],
      answer: 'Fiber-Reinforced Concrete',
    },
    {
      question: 'What is the purpose of adding admixtures to concrete?',
      options: ['Increase weight', 'Delay setting time', 'Reduce cost', 'All of the above'],
      answer: 'Delay setting time',
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
    <div className="concrete-technology-quiz">
      <h1>Concrete Technology Quiz</h1>
      <p>Test your knowledge with this quiz on concrete technology.</p>

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

export default ConcreteTechnologyQuiz;