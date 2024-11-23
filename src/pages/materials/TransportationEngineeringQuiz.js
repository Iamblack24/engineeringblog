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
    {
      question: 'What is the primary purpose of a geotextile in road construction?',
      options: ['To provide drainage', 'To reinforce the soil', 'To prevent erosion', 'All of the above'],
      answer: 'All of the above',
    },
    {
      question: 'Which method is commonly used for traffic flow analysis?',
      options: ['Hydraulic modeling', 'Microscopic simulation', 'Finite element analysis', 'Geospatial analysis'],
      answer: 'Microscopic simulation',
    },
    {
      question: 'What is the significance of the AASHTO Green Book in transportation engineering?',
      options: ['It provides guidelines for highway design', 'It sets standards for traffic signals', 'It outlines procedures for environmental impact assessments', 'It defines regulations for public transportation systems'],
      answer: 'It provides guidelines for highway design',
    },
    {
      question: 'In pavement design, what does the term "subgrade" refer to?',
      options: ['The top layer of the pavement', 'The underlying soil layer', 'The layer of asphalt', 'The concrete base'],
      answer: 'The underlying soil layer',
    },
    {
      question: 'What is the primary function of a traffic signal controller?',
      options: ['To control the speed of vehicles', 'To manage the timing of traffic signals', 'To monitor traffic flow', 'To enforce traffic laws'],
      answer: 'To manage the timing of traffic signals',
    },
    {
      question: 'Which of the following is a key factor in determining the level of service (LOS) for a roadway?',
      options: ['Roadway width', 'Traffic volume', 'Pavement material', 'Weather conditions'],
      answer: 'Traffic volume',
    },
    {
      question: 'What is the purpose of a roundabout in traffic management?',
      options: ['To reduce traffic speed', 'To eliminate the need for traffic signals', 'To improve traffic flow and reduce accidents', 'All of the above'],
      answer: 'All of the above',
    },
    {
      question: 'If a car travels at a speed of 60 km/h, how long will it take to cover a distance of 150 km?',
      options: ['2 hours', '2.5 hours', '3 hours', '3.5 hours'],
      answer: '2.5 hours',
    },
    {
      question: 'A traffic signal cycle length is 120 seconds. If the green light is on for 45 seconds, what is the ratio of green time to the total cycle time?',
      options: ['3:8', '3:5', '3:4', '3:2'],
      answer: '3:8',
    },
    {
      question: 'Calculate the stopping sight distance for a vehicle traveling at 80 km/h with a reaction time of 2.5 seconds and a deceleration rate of 3.5 m/s².',
      options: ['150 meters', '200 meters', '250 meters', '300 meters'],
      answer: '250 meters',
    },
    {
      question: 'If the flow rate on a highway is 1800 vehicles per hour and the density is 30 vehicles per kilometer, what is the average speed of the vehicles?',
      options: ['50 km/h', '60 km/h', '70 km/h', '80 km/h'],
      answer: '60 km/h',
    },
    {
      question: 'A roundabout has an entry flow rate of 900 vehicles per hour and an exit flow rate of 700 vehicles per hour. What is the circulating flow rate?',
      options: ['200 vehicles per hour', '400 vehicles per hour', '600 vehicles per hour', '800 vehicles per hour'],
      answer: '200 vehicles per hour',
    },
    {
      question: 'What is the primary purpose of a culvert in road construction?',
      options: ['To provide a passage for vehicles', 'To allow water to flow under the road', 'To support the road structure', 'To serve as a pedestrian walkway'],
      answer: 'To allow water to flow under the road',
    },
    {
      question: 'If a vehicle accelerates from 0 to 100 km/h in 10 seconds, what is its average acceleration?',
      options: ['5 m/s²', '10 m/s²', '2.78 m/s²', '27.8 m/s²'],
      answer: '2.78 m/s²',
    },
    {
      question: 'What is the main purpose of a guardrail on highways?',
      options: ['To reduce vehicle speed', 'To prevent vehicles from leaving the roadway', 'To enhance road aesthetics', 'To provide lighting'],
      answer: 'To prevent vehicles from leaving the roadway',
    },
    {
      question: 'In transportation planning, what does the term "mode choice" refer to?',
      options: ['Selecting the type of vehicle', 'Choosing the route to travel', 'Deciding the time of travel', 'Selecting the means of transportation (e.g., car, bus, bike)'],
      answer: 'Selecting the means of transportation (e.g., car, bus, bike)',
    },
    {
      question: 'What is the primary function of a weigh station on highways?',
      options: ['To check vehicle speed', 'To monitor traffic flow', 'To weigh commercial vehicles', 'To collect tolls'],
      answer: 'To weigh commercial vehicles',
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
          <h3>correct Answer For What You Got Wrong</h3>
          <ul>
            {questions.map((question, index) => (
              userAnswers[index] !== question.answer && (
              <li key={index}>
                <strong>Q: {question.question}</strong>
                <br />
                <span>Your Answer: {userAnswers[index]}</span>
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

export default TransportationEngineeringQuiz;