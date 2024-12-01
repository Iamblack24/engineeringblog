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
        "To provide additional support at joints",
        "To increase the load-bearing capacity",
        "To reduce the weight of the structure"
      ],
      correctAnswer: "To provide additional support at joints"
    },
    {
      question: "What is the typical modulus of elasticity for structural steel?",
      type: "text",
      options: ["200 GPa", "250 GPa", "300 GPa", "350 GPa"],
      correctAnswer: "200 GPa"
    },
    {
      question: "What is the main advantage of using high-strength bolts in steel connections?",
      type: "text",
      options: [
        "Increased load-bearing capacity",
        "Reduced cost",
        "Ease of installation",
        "Corrosion resistance"
      ],
      correctAnswer: "Increased load-bearing capacity"
    },
    {
      question: "What is the purpose of a base plate in a steel column?",
      type: "text",
      options: [
        "To distribute the load from the column to the foundation",
        "To connect the column to the beam",
        "To provide lateral stability",
        "To reduce the weight of the column"
      ],
      correctAnswer: "To distribute the load from the column to the foundation"
    },
    {
      question: "What is the difference between a moment connection and a shear connection?",
      type: "text",
      options: [
        "Moment connection resists bending moments, shear connection resists shear forces",
        "Moment connection resists shear forces, shear connection resists bending moments",
        "Moment connection is used for columns, shear connection is used for beams",
        "Moment connection is used for beams, shear connection is used for columns"
      ],
      correctAnswer: "Moment connection resists bending moments, shear connection resists shear forces"
    },
    {
      question: "What is the purpose of using stiffeners in steel beams?",
      type: "text",
      options: [
        "To increase the load-bearing capacity",
        "To reduce the weight of the beam",
        "To prevent local buckling",
        "To connect beams and columns"
      ],
      correctAnswer: "To prevent local buckling"
    },
    {
      question: "What is the typical unit weight of structural steel?",
      type: "text",
      options: ["77 kN/m³", "78.5 kN/m³", "79 kN/m³", "80 kN/m³"],
      correctAnswer: "78.5 kN/m³"
    },
    {
      question: "What is the purpose of using a splice plate in steel construction?",
      type: "text",
      options: [
        "To connect two sections of a steel member",
        "To provide additional support at joints",
        "To increase the load-bearing capacity",
        "To reduce the weight of the structure"
      ],
      correctAnswer: "To connect two sections of a steel member"
    },
    {
      question: "What is the significance of the slenderness ratio in steel design?",
      type: "text",
      options: [
        "It determines the buckling strength of a member",
        "It determines the tensile strength of a member",
        "It determines the shear strength of a member",
        "It determines the bending strength of a member"
      ],
      correctAnswer: "It determines the buckling strength of a member"
    },
    {
      question: "What is the purpose of using a moment-resisting frame in steel structures?",
      type: "text",
      options: [
        "To resist lateral loads",
        "To resist vertical loads",
        "To reduce the weight of the structure",
        "To increase the load-bearing capacity"
      ],
      correctAnswer: "To resist lateral loads"
    },
    {
      question: "What is the typical yield strength of high-strength structural steel?",
      type: "text",
      options: ["350 MPa", "450 MPa", "550 MPa", "650 MPa"],
      correctAnswer: "350 MPa"
    },
    {
      question: "What is the purpose of using a braced frame in steel structures?",
      type: "text",
      options: [
        "To resist lateral loads",
        "To resist vertical loads",
        "To reduce the weight of the structure",
        "To increase the load-bearing capacity"
      ],
      correctAnswer: "To resist lateral loads"
    },
    {
      question: "What is the purpose of using a composite beam in steel construction?",
      type: "text",
      options: [
        "To combine the strength of steel and concrete",
        "To reduce the weight of the beam",
        "To increase the load-bearing capacity",
        "To provide additional support at joints"
      ],
      correctAnswer: "To combine the strength of steel and concrete"
    },
    {
      question: "What is the purpose of using a shear stud in composite construction?",
      type: "text",
      options: [
        "To transfer shear forces between the steel beam and concrete slab",
        "To increase the load-bearing capacity",
        "To reduce the weight of the structure",
        "To provide additional support at joints"
      ],
      correctAnswer: "To transfer shear forces between the steel beam and concrete slab"
    },
    {
      question: "What is the purpose of using a castellated beam in steel construction?",
      type: "text",
      options: [
        "To increase the depth of the beam without increasing its weight",
        "To reduce the weight of the beam",
        "To provide additional support at joints",
        "To increase the load-bearing capacity"
      ],
      correctAnswer: "To increase the depth of the beam without increasing its weight"
    },
    {
      question: "What is the purpose of using a haunched beam in steel construction?",
      type: "text",
      options: [
        "To increase the moment capacity at the supports",
        "To reduce the weight of the beam",
        "To provide additional support at joints",
        "To increase the load-bearing capacity"
      ],
      correctAnswer: "To increase the moment capacity at the supports"
    },
    {
      question: "What is the purpose of using a steel truss in construction?",
      type: "text",
      options: [
        "To span large distances with minimal material",
        "To reduce the weight of the structure",
        "To provide additional support at joints",
        "To increase the load-bearing capacity"
      ],
      correctAnswer: "To span large distances with minimal material"
    },
    {
      question: "What is the purpose of using a steel diaphragm in construction?",
      type: "text",
      options: [
        "To transfer lateral loads to the vertical resisting elements",
        "To reduce the weight of the structure",
        "To provide additional support at joints",
        "To increase the load-bearing capacity"
      ],
      correctAnswer: "To transfer lateral loads to the vertical resisting elements"
    }
  ];

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showScore, setShowScore] = useState(false);

  const handleAnswerOptionClick = (isCorrect) => {
    if (isCorrect) {
      setScore(score + 1);
    }

    const nextQuestion = currentQuestionIndex + 1;
    if (nextQuestion < questions.length) {
      setCurrentQuestionIndex(nextQuestion);
    } else {
      setShowScore(true);
    }
  };

  return (
    <div className="steel-structures-quiz">
      {showScore ? (
        <div className="score-section">
          You scored {score} out of {questions.length}
        </div>
      ) : (
        <>
          <div className="question-section">
            <div className="question-count">
              <span>Question {currentQuestionIndex + 1}</span>/{questions.length}
            </div>
            <div className="question-text">{questions[currentQuestionIndex].question}</div>
          </div>
          <div className="answer-section">
            {questions[currentQuestionIndex].options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswerOptionClick(option === questions[currentQuestionIndex].correctAnswer)}
              >
                {option}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default SteelStructuresQuiz;