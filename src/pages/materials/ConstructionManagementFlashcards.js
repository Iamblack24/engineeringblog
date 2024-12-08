import React, { useState } from 'react';
import './ConstructionManagementFlashcards.css';

const flashcardsData = [
  // Technical/Mathematical Questions
  {
    question: "What is the Critical Path Method (CPM)? How does it differ from PERT?",
    answer: "CPM is a project scheduling algorithm that calculates the longest path of planned activities to determine the minimum project completion time. Unlike PERT, CPM uses fixed time estimates, while PERT uses three time estimates (optimistic, most likely, pessimistic) to account for uncertainty."
  },
  {
    question: "Calculate the total float for an activity with ES=2, EF=5, LS=4, LF=7",
    answer: "Total Float = LS - ES or LF - EF = 4 - 2 = 7 - 5 = 2 days. This activity can be delayed by 2 days without affecting the project completion date."
  },
  {
    question: "What is the earned value formula for Schedule Performance Index (SPI)?",
    answer: "SPI = EV/PV (Earned Value / Planned Value). If SPI > 1, project is ahead of schedule; if SPI < 1, project is behind schedule."
  },
  {
    question: "How do you calculate equipment productivity rate?",
    answer: "Productivity Rate = Output Quantity / Time Period (e.g., cubic yards per hour). Factors include equipment capacity, cycle time, efficiency factor, and job conditions."
  },
  // Project Management Concepts
  {
    question: "What are the five phases of project management according to PMI?",
    answer: "1. Initiating 2. Planning 3. Executing 4. Monitoring and Controlling 5. Closing"
  },
  {
    question: "Define Work Breakdown Structure (WBS) and its importance",
    answer: "WBS is a hierarchical decomposition of project deliverables into smaller, manageable components. It helps in scope definition, resource allocation, cost estimation, and project control."
  },
  {
    question: "What is the difference between direct and indirect costs in construction?",
    answer: "Direct costs are directly attributable to specific work items (labor, materials, equipment). Indirect costs are overhead expenses that cannot be attributed to specific work items (supervision, insurance, temporary facilities)."
  },
  // Safety and Regulations
  {
    question: "What is OSHA's Fatal Four in construction?",
    answer: "1. Falls 2. Struck by Object 3. Electrocution 4. Caught-in/between. These account for majority of construction worker fatalities."
  },
  {
    question: "What are the minimum requirements for a Fall Protection System according to OSHA?",
    answer: "Required when working at heights of 6 feet or more. Must include guardrails, safety nets, or personal fall arrest systems (PFAS)."
  },
  // Construction Technology
  {
    question: "What is BIM (Building Information Modeling) and its key benefits?",
    answer: "BIM is a 3D model-based process for creating and managing project information. Benefits: clash detection, improved coordination, better visualization, cost estimation, and facility management."
  },
  {
    question: "Explain the concept of Lean Construction",
    answer: "A project delivery approach focused on minimizing waste, maximizing value, and continuous improvement. Key principles: pull planning, last planner system, just-in-time delivery."
  },
  // Materials and Methods
  {
    question: "What factors affect concrete strength development?",
    answer: "Water-cement ratio, curing conditions, temperature, cement type, aggregates, admixtures, and age of concrete."
  },
  {
    question: "Calculate the volume of concrete needed for a column 12' high with 18\"x18\" cross-section",
    answer: "Volume = 1.5' × 1.5' × 12' = 27 cubic feet = 1 cubic yard"
  },
  // Contract Administration
  {
    question: "What are the main types of construction contracts?",
    answer: "1. Lump Sum 2. Unit Price 3. Cost Plus 4. Guaranteed Maximum Price (GMP) 5. Design-Build"
  },
  {
    question: "Explain liquidated damages in construction contracts",
    answer: "Predetermined monetary damages specified in contract for delay in completion. Must be a reasonable estimate of actual damages owner might suffer."
  },
  // Quality Control
  {
    question: "What is the difference between Quality Assurance and Quality Control?",
    answer: "QA focuses on preventing defects through planned processes (proactive). QC involves inspecting completed work to verify quality standards (reactive)."
  },
  // Resource Management
  {
    question: "How do you calculate labor productivity rate?",
    answer: "Productivity Rate = Work Quantity / Labor Hours. Example: 100 SF of wall / 8 labor hours = 12.5 SF/hour"
  },
  // Risk Management
  {
    question: "What are the four main strategies for risk response?",
    answer: "1. Avoid 2. Transfer 3. Mitigate 4. Accept"
  },
  // Sustainability
  {
    question: "What are the main categories in LEED certification?",
    answer: "1. Sustainable Sites 2. Water Efficiency 3. Energy & Atmosphere 4. Materials & Resources 5. Indoor Environmental Quality 6. Innovation"
  },
  // Professional Practice
  {
    question: "What is the difference between design-bid-build and design-build delivery methods?",
    answer: "Design-bid-build: Linear process with separate design and construction contracts. Design-build: Single entity responsible for both design and construction."
  },
  // Advanced Technical Concepts
  {
    question: "Calculate the critical buckling load (Pcr) using Euler's formula: E=29000ksi, I=100in⁴, L=12ft",
    answer: "Pcr = (π²EI)/(KL)² = (π² × 29000 × 100)/(1 × 144)² = 1,150 kips (K=1 for pinned ends)"
  },
  {
    question: "What is the significance of the Reynolds number in fluid mechanics?",
    answer: "Reynolds number (Re) determines flow characteristics (laminar vs turbulent). Re = (velocity × diameter × density)/viscosity"
  },
  // Project Controls
  {
    question: "How do you calculate Cost Performance Index (CPI)?",
    answer: "CPI = EV/AC (Earned Value / Actual Cost). CPI > 1 indicates under budget, CPI < 1 indicates over budget."
  },
  {
    question: "What is the difference between resource leveling and resource smoothing?",
    answer: "Resource leveling adjusts schedule to address resource constraints, may delay project. Resource smoothing uses only free and total float, doesn't extend project duration."
  },
  // Construction Economics
  {
    question: "How do you calculate Return on Investment (ROI) for a construction project?",
    answer: "ROI = (Net Profit / Total Investment) × 100%. Example: ($100,000 profit / $1,000,000 investment) × 100% = 10% ROI"
  },
  // Advanced Planning
  {
    question: "What is the difference between AOA and AON network diagrams?",
    answer: "Activity-on-Arrow (AOA) shows activities as arrows. Activity-on-Node (AON) shows activities as nodes. AON is more commonly used in modern scheduling."
  },
  // Site Logistics
  {
    question: "What factors should be considered in construction site layout planning?",
    answer: "Site access, material storage, equipment positioning, temporary facilities, safety zones, utilities, traffic flow, and environmental protection."
  },
  // Professional Ethics
  {
    question: "What are the key elements of constructive acceleration?",
    answer: "1. Excusable delay 2. Owner's denial of time extension 3. Owner's demand to complete on time 4. Contractor's ability to accelerate 5. Additional costs incurred"
  },
  // Advanced Materials
  {
    question: "What is the relationship between concrete strength and water-cement ratio?",
    answer: "Inverse relationship: lower w/c ratio generally results in higher strength. Optimal w/c ratio typically between 0.35-0.45 for structural concrete."
  },
  // Cost Estimation
  {
    question: "Calculate the markup percentage needed to achieve a 10% profit margin if overhead is 15%",
    answer: "Markup = (OH% + Profit%)/(1 - OH% - Profit%) = (15% + 10%)/(1 - 0.15 - 0.10) = 33.33%"
  }
];

const ConstructionManagementFlashcards = () => {
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
      <h1>Construction Management Flashcards</h1>
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

export default ConstructionManagementFlashcards;