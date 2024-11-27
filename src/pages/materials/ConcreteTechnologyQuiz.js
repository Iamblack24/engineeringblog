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
    {
      question: 'What is the typical compressive strength of standard concrete used in construction (in MPa)?',
      options: ['20 MPa', '30 MPa', '40 MPa', '50 MPa'],
      answer: '30 MPa',
    },
    {
      question: 'Calculate the water-to-cement ratio if 150 liters of water are used for 300 kg of cement.',
      options: ['0.3', '0.5', '0.7', '1.0'],
      answer: '0.5',
    },
    {
      question: 'Which aggregate size is typically used in concrete for pavement construction?',
      options: ['4 mm', '10 mm', '20 mm', '40 mm'],
      answer: '20 mm',
    },
    {
      question: 'What is the purpose of using a superplasticizer in concrete?',
      options: ['Increase setting time', 'Reduce water content', 'Enhance color', 'Improve thermal resistance'],
      answer: 'Reduce water content',
    },
    {
      question: 'How does increasing the curing time affect concrete strength?',
      options: ['Decreases strength', 'Has no effect', 'Increases strength', 'First increases then decreases strength'],
      answer: 'Increases strength',
    },
    {
      question: 'What is the slump of concrete a measure of?',
      options: ['Workability', 'Strength', 'Durability', 'Density'],
      answer: 'Workability',
    },
    {
      question: 'If a concrete mix has a water-to-cement ratio of 0.6, how much water is needed for 250 kg of cement?',
      options: ['100 liters', '150 liters', '200 liters', '250 liters'],
      answer: '150 liters',
    },
    {
      question: 'Which admixture is used to accelerate the setting time of concrete?',
      options: ['Retarder', 'Plasticizer', 'Accelerator', 'Air-entraining agent'],
      answer: 'Accelerator',
    },
    {
      question: 'What is the primary difference between plain concrete and reinforced concrete?',
      options: ['Type of cement used', 'Presence of aggregates', 'Addition of steel reinforcement', 'Curing method'],
      answer: 'Addition of steel reinforcement',
    },
    {
      question: 'Determine the volume of concrete required for a slab measuring 5m x 4m x 0.15m.',
      options: ['2.5 m³', '3.0 m³', '3.5 m³', '4.0 m³'],
      answer: '3.0 m³',
    },
    {
      question: 'Which type of cement is best suited for underwater concrete structures?',
      options: ['Type I', 'Type II', 'Type IV', 'Type V'],
      answer: 'Type V',
    },
    {
      question: 'What effect does adding silica fume have on concrete?',
      options: ['Reduces strength', 'Increases permeability', 'Enhances durability', 'Lowers cost'],
      answer: 'Enhances durability',
    },
    {
      question: 'If a concrete mix requires 400 kg of cement, how much aggregate is needed assuming a 1:2:4 (cement:sand:gravel) ratio?',
      options: ['800 kg', '1600 kg', '2000 kg', '2800 kg'],
      answer: '1600 kg',
    },
    {
      question: 'What is efflorescence in concrete?',
      options: ['Cracking due to shrinkage', 'Surface scaling', 'Salt deposits on the surface', 'Discoloration from curing'],
      answer: 'Salt deposits on the surface',
    },
    {
      question: 'Which test is used to determine the air content in concrete?',
      options: ['Slump test', 'Compression test', 'Air meter test', 'Rebound hammer test'],
      answer: 'Air meter test',
    },
    {
      question: 'How does the addition of fly ash affect the properties of concrete?',
      options: ['Increases heat of hydration', 'Improves workability', 'Reduces setting time', 'Decreases durability'],
      answer: 'Improves workability',
    },
    {
      question: 'Calculate the amount of cement required for a concrete mix with a ratio of 1:3:5 for a total volume of 1 m³.',
      options: ['100 kg', '150 kg', '200 kg', '250 kg'],
      answer: '100 kg',
    },
    {
      question: 'What is the main advantage of using high-performance concrete?',
      options: ['Lower cost', 'Higher strength and durability', 'Simpler mixing process', 'Reduced curing time'],
      answer: 'Higher strength and durability',
    },
    {
      question: 'Which property of concrete is most affected by the water-to-cement ratio?',
      options: ['Color', 'Workability', 'Compressive strength', 'Thermal conductivity'],
      answer: 'Compressive strength',
    },
    {
      question: 'What is the typical curing period for concrete to achieve adequate strength?',
      options: ['1 day', '3 days', '7 days', '28 days'],
      answer: '28 days',
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
          <h3>Correct Answers:</h3>
          <ul>
            {questions.map((question, index) => (
              userAnswers[index] !== question.answer && (
              <li key={index}>
                <strong>Q: {question.question}</strong>
                <br />
                <span>Your Answer: {userAnswers[index]} </span>
                <br />
                <span>Correct Answer: {question.answer}</span>
              </li>
              )
            ))}
          </ul>
          <button onClick={handleRetake}>Retake Quiz</button>
        </div>
      )}
    </div>
  );
};

export default ConcreteTechnologyQuiz;