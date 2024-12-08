import React, { useState } from 'react';
import './BuildingServicesFlashcards.css';

const flashcardsData = [
  // Advanced HVAC
  {
    question: "Calculate the cooling load for a 2000 sq.ft office space with 20 occupants, 2000W of equipment, and U-value of 0.35 W/m²K for walls at ΔT of 15°C",
    answer: "Heat gain = Conduction + People + Equipment. (0.35 × 186m² × 15°C) + (20 × 100W) + 2000W = 976W + 2000W + 2000W = 4976W or ~5kW"
  },
  {
    question: "Explain the psychrometric relationship between wet bulb depression and relative humidity at constant enthalpy",
    answer: "As wet bulb depression increases, RH decreases along constant enthalpy line. This follows adiabatic saturation process where dry bulb temperature rises while moisture content decreases."
  },
  {
    question: "What is the Mollier diagram and how is it used in refrigeration cycle analysis?",
    answer: "Mollier (p-h) diagram plots pressure vs enthalpy for refrigerants. Used to analyze refrigeration cycle efficiency, determine compressor work input, and calculate coefficient of performance (COP = cooling effect/work input)."
  },
  // Complex Electrical Systems
  {
    question: "Calculate voltage drop in a 3-phase circuit: 400V supply, 100m cable length, 50A load, conductor resistivity 0.017 Ω⋅mm²/m, 16mm² CSA",
    answer: "Vdrop = (√3 × I × L × ρ)/(CSA) = (1.732 × 50 × 100 × 0.017)/16 = 9.2V (2.3% drop)"
  },
  {
    question: "Explain how harmonic currents affect neutral conductors in a 3-phase 4-wire system",
    answer: "Triple-n harmonics (3rd, 9th, etc.) add in neutral rather than cancel. Can cause neutral current to exceed phase currents. Neutral conductor may need to be sized at 173% of phase conductors."
  },
  {
    question: "What is the relationship between power factor correction and harmonic distortion in modern building services?",
    answer: "PF correction capacitors can form resonant circuits with system inductance at harmonic frequencies. May need detuned reactors (typically 7% impedance) to prevent harmonic amplification."
  },
  // Advanced Plumbing
  {
    question: "Calculate the pressure loss in a 100m pipe with flow rate 2 L/s, pipe diameter 50mm, using Darcy-Weisbach equation. Assume f=0.02",
    answer: "hf = f(L/D)(v²/2g) where v=Q/A. v=(2×10⁻³)/(π×0.025²)=1.02m/s. hf=0.02(100/0.05)(1.02²/19.62)=4.2m head loss"
  },
  {
    question: "Explain cavitation in pumping systems and calculate NPSH required",
    answer: "Cavitation occurs when local pressure drops below vapor pressure. NPSHr = ha + hv + hf + hs where ha=atmospheric head, hv=vapor pressure head, hf=friction loss, hs=safety margin (typically 0.5m)"
  },
  // Fire Protection Engineering
  {
    question: "Calculate sprinkler system flow rate needed for 200m² Extra Hazard area using density/area method",
    answer: "Extra Hazard requires 12.2mm/min density. Q = density × area = 0.0122m/min × 200m² = 2.44m³/min = 2,440 L/min required"
  },
  {
    question: "What is the McCaffrey plume correlation and how is it used in smoke control design?",
    answer: "Correlates fire plume characteristics: velocity=k₁Q^n₁z^m₁, temperature=k₂Q^n₂z^m₂. Used to determine smoke extraction rates and temperature profiles in atria."
  },
  // Building Automation
  {
    question: "Explain cascade control strategy for AHU supply temperature with examples of both outer and inner control loops",
    answer: "Outer loop: Room temp controls supply temp setpoint. Inner loop: Supply temp controls valve position. Prevents windup, improves stability. Time constant ratio typically 3:1 minimum."
  },
  {
    question: "What is the difference between BACnet/IP and BACnet MS/TP in terms of network architecture and performance?",
    answer: "BACnet/IP uses CSMA/CD, supports 100Mbps+, allows peer-to-peer. MS/TP uses token passing, limited to 1Mbps max, master-slave only. IP better for high-speed data, MS/TP for simple field devices."
  },
  // Energy Analysis
  {
    question: "Calculate building Energy Use Intensity (EUI) given: Annual consumption 500,000 kWh electricity, 20,000 therm gas, floor area 10,000m²",
    answer: "Convert to same units: 500,000 kWh + (20,000 × 29.3 kWh) = 1,086,000 kWh. EUI = 1,086,000/10,000 = 108.6 kWh/m²/year"
  },
  {
    question: "Explain exergy analysis in building systems and its advantage over energy analysis",
    answer: "Exergy measures energy quality and availability for work. Considers 2nd law efficiency. Example: Using 180°C steam (high exergy) for 20°C heating (low exergy) is inefficient despite good energy efficiency."
  },
  // Acoustics
  {
    question: "Calculate the Sound Transmission Class (STC) rating needed if source room is 90dB, receiving room needs 35dB, and room effect is 5dB",
    answer: "Required reduction = Source - Receiver + Room Effect = 90 - 35 + 5 = 60 STC rating needed"
  },
  // Vertical Transportation
  {
    question: "Calculate handling capacity for an elevator bank: 1000 people building population, 12% handling capacity, 30s cycle time",
    answer: "People per 5min = (Population × Handling%)/100 = (1000 × 12)/100 = 120 people. Cars needed = (120 × 30)/(300 × 0.8) = 1.5 cars (round up to 2)"
  },
  // Lighting Design
  {
    question: "Calculate required number of luminaires for office space: 500 lux target, 400m², luminaire output 4000lm, LLF 0.8, CU 0.7",
    answer: "N = (E × A)/(n × Φ × LLF × CU) where E=500, A=400, Φ=4000, n=1. N = (500 × 400)/(1 × 4000 × 0.8 × 0.7) = 89 luminaires"
  },
  // Renewable Systems
  {
    question: "Size a ground source heat pump system for 100kW peak load. Given ground temperature 10°C, required output 45°C, COP 4",
    answer: "Heat extracted from ground = Load × (COP-1)/COP = 100 × (4-1)/4 = 75kW. For 50W/m extraction, length = 75000/50 = 1500m borehole needed"
  },
  // Advanced Controls
  {
    question: "Explain adaptive tuning in PID controls for VAV systems and its advantages",
    answer: "Adaptive tuning automatically adjusts P, I, D parameters based on system response. Accounts for varying loads, duct pressure changes. Uses pattern recognition or model-based algorithms."
  },
  // Practical Application
  {
    question: "A tenant complains about indoor air quality. List diagnostic approach and relevant building systems to investigate",
    answer: "1. Check CO₂, temp, RH trends 2. Verify outdoor air rates 3. Inspect AHU filters/coils 4. Check exhaust systems 5. Review pressure relationships 6. Analyze BMS trends 7. Consider air quality testing"
  },
  {
    question: "How does stack effect impact tall building design? Include calculation method",
    answer: "Pressure difference = 0.04 × h × (1/To - 1/Ti) where h=height(m), To,Ti=absolute temps. Affects: elevator doors, stairwell pressurization, lobby design, shaft sizing."
  }
];

const BuildingServicesFlashcards = () => {
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
      <h1>Building Services Flashcards</h1>
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

export default BuildingServicesFlashcards;
