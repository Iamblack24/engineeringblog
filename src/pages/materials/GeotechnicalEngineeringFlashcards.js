import React, { useState } from 'react';
import './GeotechnicalEngineeringFlashcards.css'; // Import the CSS file for styling

const GeotechnicalEngineeringFlashcards = () => {
  const flashcards = [
    {
      question: 'What is the primary purpose of a retaining wall?',
      answer: 'To retain soil and prevent erosion or collapse of slopes.',
    },
    {
      question: 'Define the term "Shear Strength" in soil mechanics.',
      answer: 'Shear strength is the resistance of soil to shear stress, preventing it from failing.',
    },
    {
      question: 'What is the significance of the Atterberg Limits?',
      answer: 'They define the critical water contents of fine-grained soils, indicating their plasticity.',
    },
    {
      question: 'Explain the concept of "Effective Stress".',
      answer: 'Effective stress is the stress carried by the soil skeleton, excluding pore water pressure.',
    },
    {
      question: 'What is the difference between consolidation and compression in soils?',
      answer: 'Consolidation is the process by which soils decrease in volume under sustained load, while compression refers to the immediate reduction in soil volume.',
    },
    {
      question: 'What is the purpose of a soil compaction test?',
      answer: 'To determine the optimal moisture content at which soil will reach its maximum dry density.',
    },
    {
      question: 'Define "Permeability" in the context of soil mechanics.',
      answer: 'Permeability is the ability of soil to transmit water or other fluids through its pores.',
    },
    {
      question: 'What is a "Bearing Capacity" of soil?',
      answer: 'Bearing capacity is the maximum load per unit area that the ground can support without failure.',
    },
    {
      question: 'Explain the term "Liquefaction" in geotechnical engineering.',
      answer: 'Liquefaction is the process by which saturated, unconsolidated soil temporarily loses strength and behaves like a liquid due to applied stress, often during an earthquake.',
    },
    {
      question: 'What is the role of geotextiles in soil reinforcement?',
      answer: 'Geotextiles are used to improve soil stability, provide erosion control, and aid in drainage.',
    },
    {
      question: 'Calculate the factor of safety (FoS) if the shear strength of soil is 150 kPa and the shear stress is 100 kPa.',
      answer: 'FoS = Shear Strength / Shear Stress = 150 kPa / 100 kPa = 1.5',
    },
    {
      question: 'Determine the bearing capacity using Terzaghi\'s equation for a strip footing with a width of 2m, depth of 1m, and soil properties: c = 25 kPa, γ = 18 kN/m³, and φ = 30°.',
      answer: 'q_ult = c*Nc + γ*Df*Nq + 0.5*γ*B*Nγ\nNc = 30.14, Nq = 18.4, Nγ = 22.4\nq_ult = 25*30.14 + 18*1*18.4 + 0.5*18*2*22.4 = 753.5 kPa',
    },
    {
      question: 'What is the settlement of a clay layer with a thickness of 5m, initial void ratio of 0.8, and final void ratio of 0.6?',
      answer: 'Settlement (S) = H * (e0 - ef) / (1 + e0)\nS = 5m * (0.8 - 0.6) / (1 + 0.8) = 0.56m',
    },
    {
      question: 'Calculate the hydraulic gradient if the head loss is 3m over a distance of 15m.',
      answer: 'Hydraulic Gradient (i) = Head Loss / Distance = 3m / 15m = 0.2',
    },
    {
      question: 'Determine the consolidation settlement for a soil layer with a thickness of 4m, initial void ratio of 1.0, and final void ratio of 0.7.',
      answer: 'Settlement (S) = H * (e0 - ef) / (1 + e0)\nS = 4m * (1.0 - 0.7) / (1 + 1.0) = 0.6m',
    },
    {
      question: 'Calculate the total stress at a depth of 10m in a soil with a unit weight of 20 kN/m³.',
      answer: 'Total Stress (σ) = Unit Weight * Depth = 20 kN/m³ * 10m = 200 kN/m²',
    },
    {
      question: 'Determine the pore water pressure at a depth of 5m below the water table.',
      answer: 'Pore Water Pressure (u) = γ_w * h = 9.81 kN/m³ * 5m = 49.05 kN/m²',
    },
    {
      question: 'Calculate the effective stress at a depth of 8m in a soil with a total stress of 160 kN/m² and a pore water pressure of 40 kN/m².',
      answer: 'Effective Stress (σ\') = Total Stress - Pore Water Pressure = 160 kN/m² - 40 kN/m² = 120 kN/m²',
    },
    {
      question: 'Determine the settlement of a sand layer with a thickness of 3m, initial void ratio of 0.6, and final void ratio of 0.4.',
      answer: 'Settlement (S) = H * (e0 - ef) / (1 + e0)\nS = 3m * (0.6 - 0.4) / (1 + 0.6) = 0.375m',
    },
    {
      question: 'Calculate the seepage velocity if the hydraulic conductivity is 0.01 m/day and the hydraulic gradient is 0.05.',
      answer: 'Seepage Velocity (v) = Hydraulic Conductivity * Hydraulic Gradient = 0.01 m/day * 0.05 = 0.0005 m/day',
    },
    {
      question: 'Determine the lateral earth pressure at rest for a soil with a unit weight of 18 kN/m³ and a depth of 6m. Assume Ko = 0.5.',
      answer: 'Lateral Earth Pressure (σh) = Ko * γ * h = 0.5 * 18 kN/m³ * 6m = 54 kN/m²',
    },
    {
      question: 'Calculate the bearing capacity of a circular footing with a diameter of 1.5m, depth of 1m, and soil properties: c = 20 kPa, γ = 19 kN/m³, and φ = 25°.',
      answer: 'q_ult = c*Nc + γ*Df*Nq + 0.5*γ*B*Nγ\nNc = 25.13, Nq = 12.72, Nγ = 9.7\nq_ult = 20*25.13 + 19*1*12.72 + 0.5*19*1.5*9.7 = 634.9 kPa',
    },
    {
      question: 'Determine the factor of safety against sliding for a retaining wall with a base friction angle of 30° and a horizontal force of 50 kN. The vertical force is 100 kN.',
      answer: 'FoS = (Vertical Force * tan(φ)) / Horizontal Force\nFoS = (100 kN * tan(30°)) / 50 kN = 1.15',
    },
    {
      question: 'Calculate the consolidation time for a clay layer with a coefficient of consolidation (Cv) of 0.002 cm²/sec and a drainage path length of 2m. Assume 90% consolidation.',
      answer: 'T90 = 0.848 * (Hdr² / Cv)\nHdr = 2m\nT90 = 0.848 * (2m)² / 0.002 cm²/sec = 169600 sec ≈ 47.1 hours',
    },
    {
      question: 'Determine the active earth pressure for a retaining wall with a height of 4m, soil unit weight of 17 kN/m³, and an internal friction angle of 35°. Assume Ka = 0.27.',
      answer: 'Active Earth Pressure (Pa) = 0.5 * Ka * γ * H²\nPa = 0.5 * 0.27 * 17 kN/m³ * (4m)² = 36.72 kN/m',
    },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentIndex((prevIndex) =>
      prevIndex === flashcards.length - 1 ? 0 : prevIndex + 1
    );
  };

  const handlePrevious = () => {
    setIsFlipped(false);
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? flashcards.length - 1 : prevIndex - 1
    );
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  return (
    <div className="geotechnical-engineering-flashcards">
      <h1>Geotechnical Engineering Flashcards</h1>
      <p>Review key concepts and formulas with these flashcards.</p>

      <div className="flashcard-container">
        <div
          className={`flashcard ${isFlipped ? 'flipped' : ''}`}
          onClick={handleFlip}
        >
          <div className="front">
            <p>{flashcards[currentIndex].question}</p>
          </div>
          <div className="back">
            <p>{flashcards[currentIndex].answer}</p>
          </div>
        </div>
      </div>

      <div className="navigation-buttons">
        <button onClick={handlePrevious}>Previous</button>
        <button onClick={handleFlip}>Flip</button>
        <button onClick={handleNext}>Next</button>
      </div>

      <div className="progress">
        {currentIndex + 1} / {flashcards.length}
      </div>
    </div>
  );
};

export default GeotechnicalEngineeringFlashcards;
