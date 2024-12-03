import React, { useState } from 'react';
import './SoilMechanicsFlashcards.css';

const SoilMechanicsFlashcards = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const flashcards = [
    { question: "What is the definition of soil mechanics?", answer: "Soil mechanics is the study of the physical properties and utilization of soils, especially used in planning foundations for structures and subgrades for highways." },
    { question: "What is the Atterberg limit?", answer: "The Atterberg limits are a basic measure of the critical water contents of a fine-grained soil: its shrinkage limit, plastic limit, and liquid limit." },
    { question: "What is soil compaction?", answer: "Soil compaction is the process of increasing the density of soil by mechanical means, reducing the air voids and increasing the soil's load-bearing capacity." },
    { question: "What is the difference between cohesionless and cohesive soils?", answer: "Cohesionless soils, such as sand and gravel, do not stick together and rely on friction for stability, while cohesive soils, such as clay, stick together due to electrostatic forces." },
    { question: "What is the purpose of a soil shear test?", answer: "A soil shear test measures the shear strength of soil, which is its resistance to shearing forces. This is important for determining the stability of slopes and the bearing capacity of foundations." },
    { question: "What is permeability in soil?", answer: "Permeability is the ability of soil to transmit water or other fluids. It is an important property for drainage and the design of foundations and earth structures." },
    { question: "What is the difference between consolidation and compaction?", answer: "Consolidation is the process by which soils decrease in volume over time under the action of sustained load, while compaction is the process of increasing soil density by mechanical means." },
    { question: "What is a soil's liquid limit?", answer: "The liquid limit is the water content at which soil changes from a plastic state to a liquid state. It is one of the Atterberg limits used to classify fine-grained soils." },
    { question: "What is a soil's plastic limit?", answer: "The plastic limit is the water content at which soil begins to exhibit plastic behavior. It is one of the Atterberg limits used to classify fine-grained soils." },
    { question: "What is the shrinkage limit of soil?", answer: "The shrinkage limit is the water content at which further loss of moisture does not result in a decrease in the volume of the soil. It is one of the Atterberg limits." },
    { question: "What is the purpose of a Proctor test?", answer: "The Proctor test is used to determine the optimal moisture content at which a soil will achieve its maximum dry density. It is commonly used in the construction of earthworks." },
    { question: "What is soil liquefaction?", answer: "Soil liquefaction is a phenomenon where saturated soil temporarily loses its strength and behaves like a liquid due to the application of stress, such as during an earthquake." },
    { question: "What is the angle of repose?", answer: "The angle of repose is the steepest angle at which a pile of unconsolidated material remains stable. It is an important property in the study of slope stability." },
    { question: "What is the difference between active and passive earth pressure?", answer: "Active earth pressure is the pressure exerted by soil when it is allowed to expand, while passive earth pressure is the pressure exerted by soil when it is compressed." },
    { question: "What is a geotechnical investigation?", answer: "A geotechnical investigation is the process of evaluating the subsurface conditions at a site to determine the properties of the soil and rock for engineering purposes." },
    { question: "What is the purpose of a soil boring?", answer: "Soil boring is a method used to collect soil samples from below the ground surface for analysis. It is commonly used in geotechnical investigations." },
    { question: "What is the difference between undrained and drained shear strength?", answer: "Undrained shear strength is the shear strength of soil when it is not allowed to drain, while drained shear strength is the shear strength of soil when it is allowed to drain." },
    { question: "What is the purpose of a triaxial test?", answer: "A triaxial test is used to measure the mechanical properties of soil, such as its shear strength, under controlled conditions of stress and strain." },
    { question: "What is the coefficient of consolidation?", answer: "The coefficient of consolidation is a measure of the rate at which a soil consolidates under load. It is an important parameter in the analysis of settlement." },
    { question: "What is the difference between primary and secondary consolidation?", answer: "Primary consolidation is the initial settlement of soil due to the expulsion of water from the pores, while secondary consolidation is the long-term settlement due to the rearrangement of soil particles." },
    // Add more flashcards as needed
  ];

  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % flashcards.length);
    setIsFlipped(false);
  };

  const handlePrev = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + flashcards.length) % flashcards.length);
    setIsFlipped(false);
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  return (
    <div className="flashcards-container">
      <h1>Soil Mechanics Flashcards</h1>
      <p>Review key concepts and formulas with these flashcards.</p>
      <div className="flashcard">
        {isFlipped ? (
          <p>{flashcards[currentIndex].answer}</p>
        ) : (
          <h3>{flashcards[currentIndex].question}</h3>
        )}
      </div>
      <div className="navigation-buttons">
        <button onClick={handlePrev}>Previous</button>
        <button onClick={handleFlip}>Flip</button>
        <button onClick={handleNext}>Next</button>
      </div>
    </div>
  );
};

export default SoilMechanicsFlashcards;