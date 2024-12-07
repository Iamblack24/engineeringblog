import React, { useState } from 'react';
import './SoilMechanicsFlashcards.css';

const SoilMechanicsFlashcards = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const flashcards = [
    { question: "Calculate the dry unit weight for a soil with a void ratio of 0.65 and specific gravity of 2.7.", answer: "γ_d = (G_s × γ_w) / (1 + e) = (2.7 × 9.81) / (1 + 0.65) ≈ 16.07 kN/m³." },
    { question: "Derive the formula for the relationship between void ratio (e) and porosity (n).", answer: "From e = Vv / Vs and n = Vv / V, use V = Vv + Vs to derive e = n / (1 - n)." },
    { question: "Given a soil with G_s = 2.6, e = 0.8, and Sr = 70%, calculate the water content.", answer: "w = (Sr × e) / G_s = (0.7 × 0.8) / 2.6 ≈ 0.2154 or 21.54%." },
    { question: "What is the hydraulic gradient (i) if the head loss is 2 m over a 4 m flow path?", answer: "i = Head loss / Length = 2 / 4 = 0.5." },
    { question: "Calculate the bulk unit weight for a soil with γ_d = 17 kN/m³ and water content w = 10%.", answer: "γ = γ_d × (1 + w) = 17 × (1 + 0.1) = 18.7 kN/m³." },
    { question: "Derive Darcy’s Law for 1D water flow through soil.", answer: "Start with q = -kA(dh/dl), where q is discharge, k is permeability, A is cross-sectional area, and dh/dl is the hydraulic gradient." },
    { question: "For a soil with D10 = 0.2 mm and D60 = 0.8 mm, calculate the coefficient of uniformity (Cu).", answer: "Cu = D60 / D10 = 0.8 / 0.2 = 4.0." },
    { question: "A constant head permeability test yields Q = 0.03 m³/s, L = 0.1 m, A = 0.02 m², and h = 1 m. Calculate permeability (k).", answer: "k = QL / (Ah) = (0.03 × 0.1) / (0.02 × 1) = 0.15 m/s." },
    { question: "A soil's liquid limit is 40%, and its plastic limit is 20%. Calculate its plasticity index (PI).", answer: "PI = LL - PL = 40% - 20% = 20%." },
    { question: "Determine the settlement of a clay layer under a 50 kPa load with H = 5 m, Cv = 0.01 m²/day, and drainage at one end after 1 year.", answer: "Settlement S = Cv × t × load. Substitute given values for detailed calculation." },
    { question: "What is the effective stress in soil if total stress is 100 kPa and pore pressure is 40 kPa?", answer: "Effective stress σ' = Total stress σ - Pore pressure u = 100 - 40 = 60 kPa." },
    { question: "Calculate the flow rate through soil with k = 0.02 m/s, i = 0.5, and A = 2 m².", answer: "q = k × i × A = 0.02 × 0.5 × 2 = 0.02 m³/s." },
    { question: "What is the factor of safety for a slope with resisting forces = 120 kN and driving forces = 80 kN?", answer: "Factor of Safety = Resisting forces / Driving forces = 120 / 80 = 1.5." },
    { question: "Calculate the critical hydraulic gradient for soil with G_s = 2.65 and e = 0.75.", answer: "i_c = (G_s - 1) / (1 + e) = (2.65 - 1) / (1 + 0.75) ≈ 0.943." },
    { question: "Determine the Proctor optimum moisture content for maximum dry density of 18 kN/m³.", answer: "This is experimentally determined. Relate w and γ_d from Proctor curves." },
    { question: "For a saturated soil, Sr = 100%, G_s = 2.7, e = 0.85, calculate bulk unit weight (γ_sat).", answer: "γ_sat = γ_w × (G_s + e) / (1 + e) = 9.81 × (2.7 + 0.85) / (1 + 0.85) ≈ 19.66 kN/m³." },
    { question: "What is the consolidation time for clay with H = 5 m, Cv = 0.01 m²/day, and degree of consolidation = 50%?", answer: "Use Tv = (Cv × t) / H², where Tv for 50% is 0.197 from Terzaghi’s table." },
    { question: "A soil layer has 2-way drainage, thickness H = 4 m, and Cv = 0.02 m²/day. Find time for 90% consolidation.", answer: "Use t = Tv × H² / Cv, with Tv = 0.848 for 90% consolidation." },
    { question: "Determine the factor of safety for a retaining wall with active pressure = 50 kPa and passive pressure = 150 kPa.", answer: "Factor of Safety = Passive pressure / Active pressure = 150 / 50 = 3.0." },
    { question: "For a soil sample with γ = 18 kN/m³, γ_w = 9.81 kN/m³, calculate the submerged unit weight (γ').", answer: "γ' = γ - γ_w = 18 - 9.81 = 8.19 kN/m³." },
    { question: "Find the volume of soil voids for a sample with total volume = 1 m³ and porosity = 30%.", answer: "Volume of voids = n × V = 0.3 × 1 = 0.3 m³." },
    { question: "What is the unit weight of water in SI units?", answer: "γ_w = 9.81 kN/m³ or 1000 kg/m³." },
    { question: "For a sieve analysis, 20% of soil passes through a 0.075 mm sieve. What does this indicate?", answer: "The soil contains 20% fines (silt and clay)." },
    { question: "A slope has a height of 10 m and a friction angle of 30°. What is the angle of repose?", answer: "The angle of repose for dry granular soil is approximately equal to its internal friction angle: 30°." },
    { question: "What is the effective stress at 5 m depth in saturated soil with γ_sat = 18 kN/m³?", answer: "σ' = γ_sat × depth = 18 × 5 = 90 kPa." },
    { question: "Determine the relative density of sand with e_max = 0.9, e_min = 0.5, and e = 0.7.", answer: "Dr = (e_max - e) / (e_max - e_min) × 100 = (0.9 - 0.7) / (0.9 - 0.5) × 100 = 50%." },
    { question: "What is the pressure exerted by a 5 m column of water?", answer: "Pressure = γ_w × height = 9.81 × 5 = 49.05 kPa." },
    { question: "Calculate the settlement of a clay layer with H = 3 m, e = 0.9, and load = 50 kPa.", answer: "Use Δe = Δσ / (1 + e), and S = Δe × H." },
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
    <div className="flashcards-container">
      <h1>Soil Mechanics Flashcards</h1>
      <p>Review key concepts with these interactive flashcards.</p>

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

export default SoilMechanicsFlashcards;
