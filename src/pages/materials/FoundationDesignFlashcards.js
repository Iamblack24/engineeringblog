import React, { useState } from 'react';
import './FoundationDesignFlashcards.css';

const flashcardsData = [
  {
    question: "What is the primary purpose of a foundation?",
    answer: "To transfer loads from the structure to the underlying soil/rock while ensuring stability and preventing excessive settlement."
  },
  {
    question: "What are the two main categories of foundations?",
    answer: "Shallow foundations (spread footings, raft foundations) and deep foundations (piles, caissons, drilled shafts)."
  },
  {
    question: "What is the general rule for minimum foundation depth in frost-susceptible soils?",
    answer: "Foundations should extend below the frost line (frost depth) to prevent frost heave damage."
  },
  {
    question: "What is bearing capacity?",
    answer: "The maximum pressure that soil can support without shear failure or excessive settlement."
  },
  {
    question: "What factors affect the choice of foundation type?",
    answer: "Soil conditions, structural loads, groundwater conditions, site constraints, cost, and construction feasibility."
  },
  {
    question: "Calculate the ultimate bearing capacity using Terzaghi's equation for a 2m square footing with c=30 kPa, γ=18 kN/m³, φ=30°, Df=1.5m",
    answer: "qu = cNc + qNq + 0.5γBNγ = (30×30.14) + (18×1.5×18.4) + (0.5×18×2×15.1) = 904.2 + 496.8 + 271.8 = 1672.8 kPa"
  },
  {
    question: "What is the difference between general and local shear failure in foundations?",
    answer: "General shear failure shows clear failure surfaces and sudden collapse; local shear shows gradual compression and no clear failure surfaces. Occurs in dense vs loose soils respectively."
  },
  {
    question: "Explain the concept of negative skin friction in pile foundations",
    answer: "Downward drag force on piles due to settling soil around the pile, increases axial load. Common in consolidating clays or fill materials. Must be considered in pile capacity calculations."
  },
  {
    question: "How do you calculate the settlement of a foundation using the elastic method?",
    answer: "S = qB(1-μ²)Is/Es, where q=applied pressure, B=foundation width, μ=Poisson's ratio, Is=influence factor, Es=soil elastic modulus."
  },
  {
    question: "What is group efficiency in pile foundations and how is it calculated?",
    answer: "Ratio of actual group capacity to sum of individual pile capacities. Eg = (1-θ/90°)(2-1/n), where θ=arctan(d/s), d=pile diameter, s=spacing, n=number of piles."
  },
  {
    question: "Explain the concept of critical depth in deep foundations",
    answer: "Depth beyond which vertical stress increase doesn't significantly increase shaft resistance. Typically 15-20 pile diameters in sands, varies in clays based on soil properties."
  },
  {
    question: "Calculate the uplift capacity of a 15m deep pile with diameter 0.6m in clay (cu=50 kPa, α=0.5)",
    answer: "Uplift capacity = πDLαcu = π×0.6×15×0.5×50 = 707 kN (neglecting pile weight and assuming no end bearing in uplift)"
  },
  {
    question: "What is the difference between α, β, and λ methods for pile capacity analysis?",
    answer: "α method uses undrained strength (cu) for total stress analysis in clays. β method uses effective stress (σ'v) in any soil. λ method combines both approaches for mixed soil conditions."
  },
  {
    question: "How do you analyze combined footing for differential settlement?",
    answer: "Check soil pressure distribution, ensure uniform pressure or acceptable variation. Calculate settlements at multiple points. Design for moment and shear due to pressure differences."
  },
  {
    question: "What is liquefaction potential and how is it assessed?",
    answer: "Assessed using SPT N-values, grain size, relative density, and earthquake magnitude. Calculate cyclic stress ratio (CSR) and compare to cyclic resistance ratio (CRR)."
  },
  {
    question: "Explain the concept of pile setup and relaxation",
    answer: "Setup: Increase in capacity over time (common in clays). Relaxation: Decrease in capacity (occurs in dense sands). Due to changes in soil stress state and pore pressure dissipation."
  },
  {
    question: "Calculate the required reinforcement for a square spread footing under punching shear",
    answer: "Vu ≤ φVc = φ(4√f'c)bod, where bo=perimeter of critical section, d=effective depth. Check two-way and one-way shear, design reinforcement accordingly."
  },
  {
    question: "What is the effect of water table on bearing capacity?",
    answer: "Reduces effective unit weight of soil, modifies bearing capacity factors. For water at depth D below footing: γ' used below water table, γ above. Typically reduces capacity by 40-60%."
  },
  {
    question: "How do you design foundations for expansive soils?",
    answer: "Use deep foundations, moisture barriers, void spaces beneath grade beams. Design for swell pressure, consider pre-wetting. Minimum depth typically 2-3 times active zone depth."
  },
  {
    question: "What is dynamic pile analysis and when is it used?",
    answer: "Uses wave equation analysis (WEAP) to predict pile capacity and driving stresses. Required for high-capacity piles, variable soil conditions, or when static analysis is uncertain."
  },
  {
    question: "Calculate the required embedment depth for an anchored sheet pile wall",
    answer: "Use moment equilibrium about anchor point. Consider active and passive pressures, water pressures. Add 20-40% to theoretical depth for safety."
  },
  {
    question: "What factors affect pile driveability?",
    answer: "Hammer energy, soil resistance, pile impedance, cushion properties, driving system efficiency. Analyzed using wave equation analysis (WEAP)."
  },
  {
    question: "How do you design foundations for machine vibration?",
    answer: "Consider natural frequency, dynamic loads, soil-structure interaction. Design for amplitude limits, resonance avoidance. Use mass-spring-dashpot model for analysis."
  },
  {
    question: "Explain the concept of base isolation in foundation design",
    answer: "Separates structure from ground motion using flexible bearings. Increases natural period, reduces seismic forces. Common types: elastomeric bearings, friction pendulum systems."
  },
  {
    question: "What is foundation scour and how is it analyzed?",
    answer: "Erosion of soil around foundation due to water flow. Analyzed using HEC-18 methods, considers flow velocity, soil properties, foundation geometry."
  },
  {
    question: "Calculate the required pile cap thickness for moment transfer",
    answer: "Based on punching shear and development length requirements. Minimum thickness = max(pile embedment + development length, shear requirements)."
  },
  {
    question: "How do you design foundations for lateral spreading?",
    answer: "Consider additional lateral forces from moving soil mass. Design piles for bending, include p-y analysis. May need ground improvement or structural solutions."
  },
  {
    question: "What is the effect of adjacent excavation on existing foundations?",
    answer: "Causes stress relief, potential settlement or lateral movement. Analyze using influence zones, stress distribution methods. May need underpinning or protection measures."
  },
  {
    question: "Explain the concept of pile buckling in soft soils",
    answer: "Critical when soil provides insufficient lateral support. Analyzed using modified Euler formula with soil spring stiffness. Common in liquefiable or very soft soils."
  },
  {
    question: "How do you design foundations for uplift forces?",
    answer: "Consider dead weight, skin friction, anchor systems. Design for tension in reinforcement, check pullout capacity. Common in tall structures or high wind areas."
  },
  {
    question: "What is the difference between immediate and consolidation settlement?",
    answer: "Immediate: Elastic deformation, occurs during loading. Consolidation: Time-dependent, involves pore pressure dissipation. Calculate using different methods for each."
  },
  {
    question: "Calculate the required anchor length for a tieback wall",
    answer: "La = T/(πdτa), where T=anchor force, d=diameter, τa=allowable bond stress. Must extend beyond potential failure surface."
  },
  {
    question: "How do you analyze foundation heave in excavations?",
    answer: "Consider elastic rebound, stress relief, groundwater effects. Calculate using elastic theory or numerical methods. Important for deep excavations in clay."
  },
  {
    question: "What is foundation retrofitting and when is it needed?",
    answer: "Strengthening existing foundations for increased loads or repair. Methods: underpinning, grouting, additional piles. Required for building modifications or structural damage."
  },
  {
    question: "Explain the concept of pile downdrag and how to mitigate it",
    answer: "Negative skin friction from settling soil. Mitigate using bitumen coating, slip layers, or designing for additional load. Calculate using β method with negative friction."
  },
  {
    question: "How do you design foundations for karst terrain?",
    answer: "Consider void potential, irregular bedrock, sinkhole risk. May need ground improvement, deep foundations, or structural bridging. Extensive site investigation required."
  },
  {
    question: "What is the effect of cyclic loading on foundation capacity?",
    answer: "Can cause strength degradation, pore pressure buildup, settlement accumulation. Analyze using cyclic stress ratios, number of cycles, drainage conditions."
  },
  {
    question: "Calculate the required reinforcement for a pile cap under biaxial bending",
    answer: "Use interaction diagrams, consider punching shear. Design for maximum moment including pile reactions and superstructure loads."
  },
  {
    question: "How do you design foundations for permafrost conditions?",
    answer: "Consider thermal effects, active layer, ground ice. May need thermal piles, insulation, or elevated structures. Design for freeze-thaw cycles."
  },
  {
    question: "What is the effect of soil spatial variability on foundation design?",
    answer: "Causes differential settlement, load redistribution. Account using probabilistic methods, sensitivity analysis. May need more conservative design."
  },
  {
    question: "Explain the concept of foundation damping",
    answer: "Energy dissipation through soil-structure interaction. Affects dynamic response, important for seismic design. Includes radiation and material damping."
  },
  {
    question: "How do you design foundations for offshore structures?",
    answer: "Consider wave loads, scour, cyclic loading. Design for fatigue, use specialized analysis methods. Important for wind turbines, platforms."
  },
  {
    question: "What is foundation instrumentation and when is it needed?",
    answer: "Monitoring settlement, pore pressure, load distribution. Used for verification, risk management. Common in complex projects or difficult conditions."
  },
  {
    question: "Calculate the required clear spacing between piles",
    answer: "Minimum 2.5D for friction piles, 2D for end-bearing. Consider group effects, constructability, pile cap size. May need larger spacing for special conditions."
  },
  {
    question: "How do you design foundations for contaminated sites?",
    answer: "Consider material compatibility, groundwater protection, gas migration. May need special materials, barriers, or monitoring systems."
  },
  {
    question: "What is the effect of foundation shape on bearing capacity?",
    answer: "Affects shape factors in bearing capacity equation. Rectangular footings have lower capacity than square. Consider L/B ratio effects."
  },
  {
    question: "Explain the concept of foundation stiffness degradation",
    answer: "Reduction in stiffness due to cyclic loading, aging, or environmental factors. Affects long-term performance, may need monitoring or maintenance."
  },
  {
    question: "How do you design foundations for high-rise buildings?",
    answer: "Consider settlement, wind loads, differential movement. Often use raft-pile systems, may need ground improvement. Important for tall building performance."
  },
  {
    question: "What is the effect of pile installation method on capacity?",
    answer: "Driven piles: Soil displacement, setup effects. Drilled: Possible loosening, concrete quality important. Affects capacity factors, design assumptions."
  },
  {
    question: "Calculate the required development length for pile reinforcement",
    answer: "Ld = (fy × db)/(4√f'c), modify for bar location, coating, spacing. Consider tension splice requirements."
  },
  {
    question: "How do you design foundations for seismic loads?",
    answer: "Consider inertial forces, kinematic effects, liquefaction potential. Design for moment transfer, ductility requirements. Important for seismic regions."
  },
  {
    question: "What is foundation waterproofing and when is it needed?",
    answer: "Protection against water infiltration. Methods: membranes, coatings, drainage systems. Required below grade or high water table."
  },
  {
    question: "Explain the concept of pile group settlement",
    answer: "Greater than individual pile settlement due to overlap of stress zones. Calculate using empirical methods or numerical analysis. Consider block behavior."
  }
];

const FoundationDesignFlashcards = () => {
  const [currentCard, setCurrentCard] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const handleNext = () => {
    setCurrentCard((prev) => (prev + 1) % flashcardsData.length);
    setIsFlipped(false);
  };

  const handlePrevious = () => {
    setCurrentCard((prev) => (prev - 1 + flashcardsData.length) % flashcardsData.length);
    setIsFlipped(false);
  };

  return (
    <div className="flashcards-container">
      <h1>Foundation Design Flashcards</h1>
      <div className={`flashcard ${isFlipped ? 'flipped' : ''}`} onClick={() => setIsFlipped(!isFlipped)}>
        <div className="flashcard-inner">
          <div className="flashcard-front">
            <p>{flashcardsData[currentCard].question}</p>
          </div>
          <div className="flashcard-back">
            <p>{flashcardsData[currentCard].answer}</p>
          </div>
        </div>
      </div>
      <div className="flashcard-controls">
        <button onClick={handlePrevious}>Previous</button>
        <span>{currentCard + 1} / {flashcardsData.length}</span>
        <button onClick={handleNext}>Next</button>
      </div>
    </div>
  );
};

export default FoundationDesignFlashcards;
