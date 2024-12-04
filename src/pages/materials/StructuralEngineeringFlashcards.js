import React, { useState } from 'react';
import './StructuralEngineeringFlashcards.css'; // Import the CSS file for styling

const StructuralEngineeringFlashcards = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const flashcards = [
    {
      question: 'What is the primary purpose of a beam in structural engineering?',
      answer: 'To support loads and transfer them to columns or supports.',
    },
    {
      question: 'Define Young\'s Modulus.',
      answer: 'A measure of the stiffness of a material, defined as the ratio of stress to strain.',
    },
    {
      question: 'What is the difference between tension and compression?',
      answer: 'Tension pulls materials apart, while compression pushes materials together.',
    },
    {
      question: 'Explain the concept of shear force.',
      answer: 'Shear force is the internal force parallel to the cross-section of a structural element.',
    },
    {
      question: 'What is a moment in structural engineering?',
      answer: 'A measure of the rotational effect produced by a force applied at a distance from a pivot point.',
    },
    {
      question: 'What is the purpose of a column in structural engineering?',
      answer: 'To transfer the load from the structure above to the foundation below.',
    },
    {
      question: 'Define Poisson\'s Ratio.',
      answer: 'The ratio of lateral strain to axial strain in a material subjected to axial stress.',
    },
    {
      question: 'What is a cantilever beam?',
      answer: 'A beam that is fixed at one end and free at the other, used to support structures without external bracing.',
    },
    {
      question: 'Explain the concept of buckling in columns.',
      answer: 'Buckling is the sudden lateral deflection of a column under axial load, leading to structural failure.',
    },
    {
      question: 'What is the difference between a fixed and a simply supported beam?',
      answer: 'A fixed beam is restrained at both ends, preventing rotation, while a simply supported beam is free to rotate at the supports.',
    },
    {
      question: 'What is the significance of the moment of inertia in beam design?',
      answer: 'The moment of inertia is a measure of an object\'s resistance to bending and deflection, crucial for determining the beam\'s strength and stiffness.',
    },
    {
      question: 'Describe the concept of plastic hinge in structural analysis.',
      answer: 'A plastic hinge is a localized zone of plastic deformation in a structural member, allowing rotation without an increase in moment, used in limit state design.',
    },
    {
      question: 'What is the difference between elastic and plastic deformation?',
      answer: 'Elastic deformation is reversible upon removal of load, while plastic deformation is permanent and occurs when the material yields.',
    },
    {
      question: 'Explain the concept of strain energy in structural mechanics.',
      answer: 'Strain energy is the energy stored in a structural element due to deformation under load, used to analyze stability and failure.',
    },
    {
      question: 'What is the role of a shear wall in a building structure?',
      answer: 'A shear wall is a vertical element that resists lateral forces such as wind and seismic loads, providing rigidity and stability to the structure.',
    },
    {
      question: 'Calculate the bending stress in a beam with a moment of 500 Nm and a section modulus of 250 cm^3.',
      answer: 'Bending stress = Moment / Section Modulus = 500 Nm / 250 cm^3 = 2 N/cm^2.',
    },
    {
      question: 'What is the critical load for a column with a length of 3 meters, modulus of elasticity of 200 GPa, and moment of inertia of 400 cm^4?',
      answer: 'Critical load (Pcr) = (π^2 * E * I) / (L^2) = (π^2 * 200 GPa * 400 cm^4) / (3 m)^2 = 175.93 kN.',
    },
    {
      question: 'Determine the shear stress in a beam with a shear force of 1000 N and a cross-sectional area of 50 cm^2.',
      answer: 'Shear stress = Shear Force / Area = 1000 N / 50 cm^2 = 20 N/cm^2.',
    },
    {
      question: 'Calculate the deflection of a simply supported beam with a span of 4 meters, a uniform load of 500 N/m, and a flexural rigidity of 3000 Nm^2.',
      answer: 'Deflection (δ) = (5 * w * L^4) / (384 * E * I) = (5 * 500 N/m * (4 m)^4) / (384 * 3000 Nm^2) = 0.0213 m.',
    },
    {
      question: 'What is the natural frequency of a simply supported beam with a length of 2 meters, mass per unit length of 10 kg/m, and flexural rigidity of 5000 Nm^2?',
      answer: 'Natural frequency (f) = (1 / (2π)) * sqrt((π^2 * E * I) / (m * L^4)) = (1 / (2π)) * sqrt((π^2 * 5000 Nm^2) / (10 kg/m * (2 m)^4)) = 3.96 Hz.',
    },
    {
      question: 'Calculate the maximum shear force in a simply supported beam with a span of 6 meters and a uniform load of 800 N/m.',
      answer: 'Maximum shear force (Vmax) = (w * L) / 2 = (800 N/m * 6 m) / 2 = 2400 N.',
    },
    {
      question: 'Determine the maximum bending moment in a simply supported beam with a span of 5 meters and a point load of 1000 N at the center.',
      answer: 'Maximum bending moment (Mmax) = (P * L) / 4 = (1000 N * 5 m) / 4 = 1250 Nm.',
    },
    {
      question: 'Calculate the torsional stress in a circular shaft with a torque of 200 Nm and a polar moment of inertia of 500 cm^4.',
      answer: 'Torsional stress (τ) = T / J = 200 Nm / 500 cm^4 = 0.4 N/cm^2.',
    },
    {
      question: 'What is the deflection at the free end of a cantilever beam with a length of 3 meters, a point load of 600 N at the free end, and a flexural rigidity of 4000 Nm^2?',
      answer: 'Deflection (δ) = (P * L^3) / (3 * E * I) = (600 N * (3 m)^3) / (3 * 4000 Nm^2) = 0.135 m.',
    },
    {
      question: 'Determine the buckling load for a column with a length of 4 meters, modulus of elasticity of 210 GPa, and moment of inertia of 300 cm^4?',
      answer: 'Buckling load (Pcr) = (π^2 * E * I) / (L^2) = (π^2 * 210 GPa * 300 cm^4) / (4 m)^2 = 129.95 kN.',
    },
  ];

  const handleNext = () => {
    setIsFlipped(false); // Reset flip state
    setCurrentIndex((prevIndex) => (prevIndex + 1) % flashcards.length);
  };

  const handlePrevious = () => {
    setIsFlipped(false); // Reset flip state
    setCurrentIndex((prevIndex) => (prevIndex - 1 + flashcards.length) % flashcards.length);
  };

  const handleFlip = () => {
    setIsFlipped((prevState) => !prevState); // Toggle flip state
  };

  return (
    <div className="structural-engineering-flashcards">
      <h1>Structural Engineering Flashcards</h1>
      <p>Review key concepts and formulas with these flashcards.</p>

      <div className="flashcard-container">
        {/* Flashcard Front and Back */}
        <div className={`flashcard ${isFlipped ? 'flipped' : ''}`} onClick={handleFlip}>
          <div className="front">
            <p>{flashcards[currentIndex].question}</p>
          </div>
          <div className="back">
            <p>{flashcards[currentIndex].answer}</p>
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="navigation-buttons">
        <button onClick={handlePrevious} disabled={flashcards.length === 0}>
          Previous
        </button>
        <button onClick={handleFlip}>Flip</button>
        <button onClick={handleNext} disabled={flashcards.length === 0}>
          Next
        </button>
      </div>

      {/* Progress Display */}
      <div className="progress">
        {currentIndex + 1} / {flashcards.length}
      </div>
    </div>
  );
};

export default StructuralEngineeringFlashcards;