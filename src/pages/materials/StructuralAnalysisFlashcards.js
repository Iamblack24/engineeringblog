import React from 'react';
import './StructuralAnalysisFlashcards.css';


const quizzes = [
  { question: "What is the formula for bending stress?", answer: "σ = My/I" },
  { question: "Define Young's Modulus.", answer: "Young's Modulus is the ratio of tensile stress to tensile strain." },
  { question: "What is the unit of force?", answer: "Newton (N)" },
  { question: "Explain the concept of shear force.", answer: "Shear force is a force that acts on a material in a direction perpendicular to the extension of the material." },
  { question: "What is the formula for calculating the moment of inertia for a rectangle?", answer: "I = (b*h^3)/12" },
  { question: "Define Poisson's Ratio.", answer: "Poisson's Ratio is the ratio of lateral strain to axial strain." },
  { question: "What is the principle of superposition?", answer: "The principle of superposition states that the total deformation is the sum of the individual deformations." },
  { question: "What is the unit of stress?", answer: "Pascal (Pa)" },
  { question: "Explain the concept of a neutral axis.", answer: "The neutral axis is the line in a beam under bending where the fibers are neither compressed nor stretched." },
  { question: "What is the formula for calculating shear stress?", answer: "τ = VQ/It" },
  { question: "Define the term 'modulus of rigidity'.", answer: "Modulus of rigidity is the ratio of shear stress to shear strain." },
  { question: "What is the unit of modulus of elasticity?", answer: "Pascal (Pa)" },
  { question: "Explain the concept of a fixed support.", answer: "A fixed support prevents all translational and rotational movements of a structure." },
  { question: "What is the formula for calculating deflection in a simply supported beam?", answer: "δ = (PL^3)/(48EI)" },
  { question: "Define the term 'buckling'.", answer: "Buckling is the sudden change in shape of a structural component under load." },
  { question: "What is the unit of moment of inertia?", answer: "m^4" },
  { question: "Explain the concept of a cantilever beam.", answer: "A cantilever beam is a beam fixed at one end and free at the other." },
  { question: "What is the formula for calculating the centroid of a triangle?", answer: "Centroid (x, y) = (x1 + x2 + x3)/3, (y1 + y2 + y3)/3" },
  { question: "Define the term 'torsion'.", answer: "Torsion is the twisting of an object due to an applied torque." },
  { question: "What is the unit of torque?", answer: "Newton-meter (Nm)" },
  { question: "Explain the concept of a simply supported beam.", answer: "A simply supported beam is supported at both ends and is free to rotate." },
  { question: "What is the formula for calculating the area of a circle?", answer: "A = πr^2" },
  { question: "Define the term 'strain energy'.", answer: "Strain energy is the energy stored in a body due to deformation." },
  { question: "What is the unit of strain?", answer: "Dimensionless" },
  { question: "Explain the concept of a roller support.", answer: "A roller support allows for rotation and horizontal movement but prevents vertical movement." },
  { question: "What is the formula for calculating the volume of a cylinder?", answer: "V = πr^2h" },
  { question: "Define the term 'elastic limit'.", answer: "The elastic limit is the maximum stress that a material can withstand without permanent deformation." },
  { question: "What is the unit of bending moment?", answer: "Newton-meter (Nm)" },
  { question: "Explain the concept of a hinge support.", answer: "A hinge support allows for rotation but prevents translation in any direction." },
  { question: "What is the formula for calculating the perimeter of a rectangle?", answer: "P = 2(l + w)" }
];

const StructuralAnalysisFlashcards = () => {
  return (
    <div>
      <h1>Structural Analysis Flashcards</h1>
      <p>Review key concepts and formulas with these flashcards.</p>
      <ul>
        {quizzes.map((quiz, index) => (
          <li key={index}>
            <strong>Q:</strong> {quiz.question} <br />
            <strong>A:</strong> {quiz.answer}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default StructuralAnalysisFlashcards;