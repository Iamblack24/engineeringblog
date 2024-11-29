import React, { useState } from 'react';
import './SteelStructuresQuiz.css';

const SteelStructuresQuiz = () => {
  const questions = [
    {
      question: "What is the yield strength of structural steel?",
      type: "text",
      options: ["250 MPa", "350 MPa", "450 MPa", "550 MPa"],
      correctAnswer: "250 MPa"
    },
    {
      question: "Calculate the moment of inertia for a given I-beam.",
      type: "math",
      options: ["200 cm⁴", "250 cm⁴", "300 cm⁴", "350 cm⁴"],
      correctAnswer: "250 cm⁴"
    },
    {
      question: "What is the purpose of using gusset plates in steel structures?",
      type: "text",
      options: [
        "To connect beams and columns",
        "To provide decorative elements",
        "To increase load capacity",
        "To reduce material usage"
      ],
      correctAnswer: "To connect beams and columns"
    },
    {
      question: "Determine the axial load capacity of a column.",
      type: "math",
      options: ["150 kN", "200 kN", "250 kN", "300 kN"],
      correctAnswer: "200 kN"
    },
    {
      question: "What is the difference between hot-rolled and cold-rolled steel?",
      type: "text",
      options: [
        "Hot-rolled is stronger than cold-rolled",
        "Cold-rolled has a smoother finish",
        "Hot-rolled is more expensive",
        "Cold-rolled cannot be welded"
      ],
      correctAnswer: "Cold-rolled has a smoother finish"
    },
    {
      question: "Calculate the shear force in a beam subjected to a point load.",
      type: "math",
      options: ["50 kN", "75 kN", "100 kN", "125 kN"],
      correctAnswer: "75 kN"
    },
    {
      question: "Explain the concept of buckling in columns.",
      type: "text",
      options: [
        "Sudden lateral deflection",
        "Increase in load capacity",
        "Reduction in length",
        "Increase in stiffness"
      ],
      correctAnswer: "Sudden lateral deflection"
    },
    {
      question: "Find the centroid of a composite section.",
      type: "math",
      options: ["10 cm", "15 cm", "20 cm", "25 cm"],
      correctAnswer: "15 cm"
    },
    {
      question: "What are the advantages of using steel in construction?",
      type: "text",
      options: [
        "High strength-to-weight ratio",
        "Corrosion resistance",
        "Low cost",
        "Ease of fabrication"
      ],
      correctAnswer: "High strength-to-weight ratio"
    },
    {
      question: "Calculate the bending stress in a beam.",
      type: "math",
      options: ["5 MPa", "10 MPa", "15 MPa", "20 MPa"],
      correctAnswer: "10 MPa"
    },
    {
      question: "Describe the process of welding in steel structures.",
      type: "text",
      options: [
        "Joining metals by melting",
        "Using adhesives",
        "Bolting components",
        "Riveting parts"
      ],
      correctAnswer: "Joining metals by melting"
    },
    {
      question: "Determine the deflection of a simply supported beam.",
      type: "math",
      options: ["2 mm", "4 mm", "6 mm", "8 mm"],
      correctAnswer: "4 mm"
    },
    {
      question: "What is the role of bracing in steel structures?",
      type: "text",
      options: [
        "To provide lateral stability",
        "To increase load capacity",
        "To reduce material usage",
        "To provide decorative elements"
      ],
      correctAnswer: "To provide lateral stability"
    },
    {
      question: "Calculate the torsional stress in a shaft.",
      type: "math",
      options: ["30 MPa", "45 MPa", "60 MPa", "75 MPa"],
      correctAnswer: "45 MPa"
    },
    {
      question: "Explain the term 'fatigue' in the context of steel structures.",
      type: "text",
      options: [
        "Failure due to repeated loading",
        "Sudden lateral deflection",
        "Increase in load capacity",
        "Reduction in length"
      ],
      correctAnswer: "Failure due to repeated loading"
    },
    {
      question: "Find the section modulus of a given cross-section.",
      type: "math",
      options: ["50 cm³", "75 cm³", "100 cm³", "125 cm³"],
      correctAnswer: "75 cm³"
    },
    {
      question: "What is the significance of the modulus of elasticity for steel?",
      type: "text",
      options: [
        "Measure of stiffness",
        "Measure of strength",
        "Measure of ductility",
        "Measure of toughness"
      ],
      correctAnswer: "Measure of stiffness"
    },
    {
      question: "Calculate the load distribution in a truss.",
      type: "math",
      options: ["20 kN", "40 kN", "60 kN", "80 kN"],
      correctAnswer: "40 kN"
    },
    {
      question: "Describe the process of galvanizing steel.",
      type: "text",
      options: [
        "Coating with zinc",
        "Painting with primer",
        "Applying adhesive",
        "Bolting components"
      ],
      correctAnswer: "Coating with zinc"
    },
    {
      question: "Determine the critical load for a column using Euler's formula.",
      type: "math",
      options: ["500 kN", "750 kN", "1000 kN", "1250 kN"],
      correctAnswer: "750 kN"
    },
    {
      question: "What are the common types of steel used in construction?",
      type: "text",
      options: [
        "Carbon steel, alloy steel, stainless steel",
        "Aluminum, copper, brass",
        "Wood, concrete, plastic",
        "Glass, ceramic, rubber"
      ],
      correctAnswer: "Carbon steel, alloy steel, stainless steel"
    },
    {
      question: "Calculate the strain in a steel member under tension.",
      type: "math",
      options: ["0.001", "0.002", "0.003", "0.004"],
      correctAnswer: "0.002"
    },
    {
      question: "Explain the concept of plastic design in steel structures.",
      type: "text",
      options: [
        "Design beyond elastic limit",
        "Design within elastic limit",
        "Design for corrosion resistance",
        "Design for aesthetic appeal"
      ],
      correctAnswer: "Design beyond elastic limit"
    },
    {
      question: "Find the radius of gyration for a given section.",
      type: "math",
      options: ["5 cm", "7 cm", "9 cm", "11 cm"],
      correctAnswer: "7 cm"
    },
    {
      question: "What is the purpose of using high-strength bolts in steel connections?",
      type: "text",
      options: [
        "To provide greater load capacity",
        "To reduce material usage",
        "To provide decorative elements",
        "To increase stiffness"
      ],
      correctAnswer: "To provide greater load capacity"
    },
    {
      question: "Calculate the buckling load for a column with fixed ends.",
      type: "math",
      options: ["600 kN", "800 kN", "1000 kN", "1200 kN"],
      correctAnswer: "800 kN"
    },
    {
      question: "Describe the term 'creep' in steel structures.",
      type: "text",
      options: [
        "Slow deformation over time",
        "Sudden lateral deflection",
        "Increase in load capacity",
        "Reduction in length"
      ],
      correctAnswer: "Slow deformation over time"
    },
    {
      question: "Determine the moment capacity of a steel beam.",
      type: "math",
      options: ["4000 Nm", "5000 Nm", "6000 Nm", "7000 Nm"],
      correctAnswer: "5000 Nm"
    },
    {
      question: "What are the different types of steel connections?",
      type: "text",
      options: [
        "Bolted, welded, riveted",
        "Adhesive, mechanical, thermal",
        "Magnetic, chemical, electrical",
        "Friction, gravity, pressure"
      ],
      correctAnswer: "Bolted, welded, riveted"
    },
    {
      question: "Calculate the lateral-torsional buckling capacity of a beam.",
      type: "math",
      options: ["1500 Nm", "2000 Nm", "2500 Nm", "3000 Nm"],
      correctAnswer: "2000 Nm"
    }
  ];

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedOption, setSelectedOption] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);

  const handleOptionChange = (e) => {
    setSelectedOption(e.target.value);
  };

  const handleNext = () => {
    if (selectedOption === questions[currentQuestion].correctAnswer) {
      setScore(score + 1);
    }
    setSelectedOption('');
    if (currentQuestion + 1 < questions.length) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setShowResult(true);
    }
  };

  return (
    <div className="quiz-container">
      <h1>Steel Structures Quiz</h1>
      <p>Test your knowledge with this quiz on steel structures.</p>
      {showResult ? (
        <div className="quiz-result">
          You scored {score} out of {questions.length}
        </div>
      ) : (
        <div className="quiz-question">
          <p>{questions[currentQuestion].question}</p>
          <ul className="quiz-options">
            {questions[currentQuestion].options.map((option, index) => (
              <li key={index} className="quiz-option">
                <label>
                  <input
                    type="radio"
                    name="option"
                    value={option}
                    checked={selectedOption === option}
                    onChange={handleOptionChange}
                  />
                  {option}
                </label>
              </li>
            ))}
          </ul>
          <button
            className="quiz-button"
            onClick={handleNext}
            disabled={!selectedOption}
          >
            {currentQuestion + 1 === questions.length ? 'Finish' : 'Next'}
          </button>
        </div>
      )}
    </div>
  );
};

export default SteelStructuresQuiz;
