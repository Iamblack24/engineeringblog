import React, { useState } from 'react';
import './GeotechnicalEngineeringFlashcards.css';

const GeotechnicalEngineeringFlashcards = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  
  const flashcards = [
    {
        question: 'What is the effective stress in a soil layer with a total stress of 160 kN/m² and a pore water pressure of 40 kN/m²?',
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
        question: 'What is the Atterberg limit?',
        answer: 'The Atterberg limits are a basic measure of the critical water contents of a fine-grained soil: its shrinkage limit, plastic limit, and liquid limit.',
    },
    {
        question: 'What is the difference between cohesionless and cohesive soils?',
        answer: 'Cohesionless soils, like sand and gravel, have no true cohesion and rely on friction for stability. Cohesive soils, like clay, have significant cohesion due to electrostatic forces between particles.',
    },
    {
        question: 'What is the purpose of a soil compaction test?',
        answer: 'A soil compaction test determines the optimal moisture content at which a given soil type will become most dense and achieve its maximum dry density.',
    },
    {
        question: 'Explain the term "consolidation" in soil mechanics.',
        answer: 'Consolidation is the process by which soils decrease in volume over time under the action of a sustained load, primarily due to the expulsion of water from the soil pores.',
    },
    {
        question: 'What is the difference between primary and secondary consolidation?',
        answer: 'Primary consolidation is the volume change due to the expulsion of water under a sustained load, while secondary consolidation is the volume change due to the rearrangement of soil particles after primary consolidation is complete.',
    },
    {
        question: 'What is the purpose of a triaxial shear test?',
        answer: 'A triaxial shear test is used to measure the mechanical properties of soils, including shear strength, cohesion, and internal friction angle, under controlled drainage conditions.',
    },
    {
        question: 'What is the significance of the Mohr-Coulomb failure criterion?',
        answer: 'The Mohr-Coulomb failure criterion describes the relationship between shear strength, normal stress, cohesion, and internal friction angle of a soil, and is used to predict failure conditions.',
    },
    {
        question: 'What is the difference between drained and undrained shear strength?',
        answer: 'Drained shear strength is measured under conditions where pore water pressure is allowed to dissipate, while undrained shear strength is measured under conditions where pore water pressure is not allowed to dissipate.',
    },
    {
        question: 'What is the purpose of a Standard Penetration Test (SPT)?',
        answer: 'The Standard Penetration Test (SPT) is used to determine the relative density and strength of granular soils and the consistency of cohesive soils by measuring the resistance to penetration of a standard sampler driven into the soil.',
    },
    {
        question: 'What is the purpose of a Cone Penetration Test (CPT)?',
        answer: 'The Cone Penetration Test (CPT) is used to determine the geotechnical properties of soils by measuring the resistance to penetration of a cone pushed into the soil at a constant rate.',
    },
    {
        question: 'What is the difference between active and passive earth pressure?',
        answer: 'Active earth pressure is the pressure exerted by soil when it is allowed to expand or move away from a retaining structure, while passive earth pressure is the pressure exerted by soil when it is compressed or pushed against a retaining structure.',
    },
    {
        question: 'What is the purpose of a geotextile in geotechnical engineering?',
        answer: 'Geotextiles are permeable fabrics used in geotechnical engineering to improve soil stability, provide erosion control, and aid in drainage.',
    },
    {
        question: 'What is the significance of the coefficient of permeability in soil mechanics?',
        answer: 'The coefficient of permeability is a measure of the ability of soil to transmit water, and it is crucial for analyzing seepage, drainage, and the stability of slopes and foundations.',
    },
    {
        question: 'What is the purpose of a retaining wall?',
        answer: 'A retaining wall is a structure designed to hold back soil or rock from a building, structure, or area to prevent erosion and provide support for vertical or near-vertical grade changes.',
    },
    {
        question: 'What is the difference between shallow and deep foundations?',
        answer: 'Shallow foundations transfer building loads to the earth near the surface, while deep foundations transfer loads to deeper, more stable soil or rock layers.',
    },
    {
        question: 'What is the purpose of a pile foundation?',
        answer: 'Pile foundations are deep foundations used to transfer heavy loads from structures to deeper, more stable soil or rock layers, bypassing weaker surface soils.',
    },
    {
        question: 'What is the significance of the factor of safety in geotechnical engineering?',
        answer: 'The factor of safety is a measure of the reliability of a geotechnical design, representing the ratio of the actual strength to the required strength to ensure stability and prevent failure.',
    },
    {
        question: 'What is the purpose of a slope stability analysis?',
        answer: 'Slope stability analysis is used to evaluate the potential for slope failure and to design appropriate stabilization measures to ensure the safety and stability of slopes.',
    },
    {
        question: 'What is the difference between total and effective stress?',
        answer: 'Total stress is the total force per unit area exerted on a soil mass, while effective stress is the portion of the total stress that is carried by the soil skeleton, excluding pore water pressure.',
    },
    {
        question: 'What is the purpose of a soil classification system?',
        answer: 'Soil classification systems, such as the Unified Soil Classification System (USCS) and the AASHTO system, are used to categorize soils based on their physical properties and behavior for engineering purposes.',
    },
    {
        question: 'What is the significance of the liquid limit and plastic limit in soil mechanics?',
        answer: 'The liquid limit and plastic limit are Atterberg limits that define the boundaries between different states of consistency for fine-grained soils, indicating their plasticity and workability.',
    },
    {
        question: 'What is the purpose of a geotechnical site investigation?',
        answer: 'A geotechnical site investigation is conducted to gather information about the subsurface conditions, including soil properties, groundwater levels, and potential geotechnical hazards, to inform the design and construction of foundations and other structures.',
    }
];

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

      <div className="card-scene">
        <div 
          className={`card ${isFlipped ? 'is-flipped' : ''}`} 
          onClick={handleFlip}
        >
          <div className="card__face card__face--front">
            {flashcards[currentIndex].question}
          </div>
          <div className="card__face card__face--back">
            {flashcards[currentIndex].answer}
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
