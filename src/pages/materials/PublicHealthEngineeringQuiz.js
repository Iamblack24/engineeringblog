import React, { useState } from 'react';
import './PublicHealthEngineeringQuiz.css';

const questions = [
  {
    question: "Explain the process of treating water for public consumption.",
    answer: "The process involves: Coagulation (adding alum to settle impurities), Sedimentation (removal of heavy particles), Filtration (removing finer particles using sand or membranes), and Disinfection (using chlorine or UV light to kill pathogens)."
  },
  {
    question: "What is the significance of pH in water treatment?",
    answer: "pH affects water quality: Low pH causes corrosion; high pH leads to scaling. Ideal range is 6.5–8.5."
  },
  {
    question: "Design a rapid sand filter for a community with 20,000 people, with per capita demand of 150 L/day.",
    answer: "Daily demand: 20,000×150=3,000,000 L/day=3,000 m³/day. At a filtration rate of 5 m³/m²/h: A=3,000/(5×24)=25 m². Use filter dimensions 5 m × 5 m."
  },
  {
    question: "Explain the difference between hard and soft water.",
    answer: "Hard water contains calcium and magnesium ions, causing scaling. Soft water lacks these ions and doesn’t form scales."
  },
  {
    question: "Define safe drinking water and list key quality parameters.",
    answer: "Safe water is free from harmful chemicals and microorganisms. Key parameters: pH, turbidity, hardness, microbial count, dissolved solids, and chlorides."
  },
  {
    question: "Differentiate between septic tanks and sewerage systems.",
    answer: "Septic tanks are used for individual households; sewerage systems serve larger areas and need treatment plants."
  },
  {
    question: "Design criteria for a waste stabilization pond.",
    answer: "Consider detention time (5–10 days), depth (1–2 m), and inflow rate. Ponds should allow natural processes for pathogen removal."
  },
  {
    question: "What are primary and secondary wastewater treatments?",
    answer: "Primary treatment removes solids and grease through sedimentation. Secondary treatment uses biological methods (e.g., activated sludge) to reduce organic matter."
  },
  {
    question: "Explain solid waste management methods.",
    answer: "Composting: Converts organic waste into fertilizer. Landfilling: Controlled burial of waste. Incineration: Burning waste to reduce volume and generate energy."
  },
  {
    question: "What are the health hazards of open defecation?",
    answer: "It causes diseases like cholera, typhoid, and diarrhea. Strategies: Toilets, sanitation campaigns, and community participation."
  },
  {
    question: "Primary air pollutants and their effects?",
    answer: "Examples: CO, SO₂, NOx, PM, VOCs. Effects include respiratory issues, acid rain, and climate change."
  },
  {
    question: "Working principle of a cyclone separator?",
    answer: "Air with particles enters a cone, spirals down, and particles are separated by centrifugal force."
  },
  {
    question: "Impact of noise pollution on health?",
    answer: "Causes hearing loss, stress, and sleep disturbance. Recommended limits: 45 dB (residential), 70 dB (industrial)."
  },
  {
    question: "How is air quality monitored?",
    answer: "Using sensors to measure pollutants like PM2.5, PM10, and gases (e.g., CO, NO₂). The Air Quality Index (AQI) simplifies reporting."
  },
  {
    question: "Measures to reduce indoor air pollution?",
    answer: "Improve ventilation, use smokeless stoves, and reduce burning of biomass indoors."
  },
  {
    question: "Define epidemiology and its role in waterborne diseases.",
    answer: "Epidemiology studies disease patterns. It helps identify waterborne disease outbreaks like cholera and enables control measures."
  },
  {
    question: "List five waterborne diseases and their control.",
    answer: "Examples: Cholera, typhoid, dysentery, hepatitis A, giardiasis. Control: Clean water, sanitation, and vaccination."
  },
  {
    question: "Importance of vaccination in public health.",
    answer: "Vaccines prevent diseases like measles, polio, and cholera, reducing mortality and improving immunity."
  },
  {
    question: "How does sanitation reduce infant mortality?",
    answer: "Proper sanitation prevents diarrhea and infections, which are major causes of infant deaths."
  },
  {
    question: "Role of engineers in disease outbreaks.",
    answer: "Ensure clean water supply, sanitation facilities, and educate communities on hygiene."
  },
  {
    question: "Sustainable development in water resources management?",
    answer: "Ensures water availability for future generations by using methods like rainwater harvesting and efficient irrigation."
  },
  {
    question: "Effects of improper industrial waste disposal?",
    answer: "Causes water and soil contamination, harming humans and ecosystems. Control: Effluent treatment plants."
  },
  {
    question: "What is eutrophication and its prevention?",
    answer: "Eutrophication is nutrient overloading in water, causing algal blooms. Prevent by reducing fertilizer runoff and waste discharge."
  },
  {
    question: "Role of rainwater harvesting in water scarcity.",
    answer: "Collects and stores rainwater, reducing reliance on depleting groundwater."
  },
  {
    question: "Impacts of deforestation and mitigation.",
    answer: "Leads to soil erosion, loss of biodiversity, and climate change. Mitigation: Afforestation and soil conservation techniques."
  },
  {
    question: "Water treatment plant capacity for 50,000 people, 150 L/person/day.",
    answer: "Q=50,000×150=7,500,000 L/day=7,500 m³/day."
  },
  {
    question: "Design a septic tank for 10 people.",
    answer: "Daily flow: 10×120=1,200 L/day. Assume 3 days of retention time: V=1,200×3=3,600 L=3.6 m³. Dimensions: 1.8 m×1.2 m×1.5 m."
  },
  {
    question: "Sedimentation tank for 2,500 m³/day, 4-hour detention time.",
    answer: "Q=2,500/24=104.17 m³/h. Volume: V=104.17×4=416.68 m³. Dimensions: Assume L=25 m, B=5 m, H=3.34 m."
  },
  {
    question: "Head loss in pipe (velocity = 2 m/s, f=0.02, D=0.3 m, L=200 m):",
    answer: "hf=fL/D v²/2g=0.02⋅200/0.3⋅2²/2×9.81=2.72 m."
  },
  {
    question: "BOD removal efficiency in trickling filter:",
    answer: "Initial BOD = 200 mg/L, Effluent BOD = 40 mg/L. Efficiency: η=200−40/200×100=80%."
  }
];

const Flashcard = ({ question, answer }) => {
  const [flipped, setFlipped] = useState(false);

  return (
    <div className="flashcard-container">
      <div className={`flashcard ${flipped ? 'flipped' : ''}`}>
        <div className="flashcard-content front">
          {question}
        </div>
        <div className="flashcard-content back">
          {answer}
        </div>
      </div>
      <button className="flip-button" onClick={() => setFlipped(!flipped)}>
        {flipped ? 'Show Question' : 'Show Answer'}
      </button>
    </div>
  );
};

const PublicHealthEngineeringQuiz = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % questions.length);
  };

  const handlePrevious = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + questions.length) % questions.length);
  };

  return (
    <div className="public-health-engineering-quiz">
      <h1>Public Health Engineering Quiz</h1>
      <p>Test your knowledge with this quiz on public health engineering.</p>
      <div className="flashcards-container">
        <Flashcard question={questions[currentIndex].question} answer={questions[currentIndex].answer} />
      </div>
      <div className="navigation-buttons">
        <button onClick={handlePrevious}>Previous</button>
        <button onClick={handleNext}>Next</button>
      </div>
    </div>
  );
};

export default PublicHealthEngineeringQuiz;