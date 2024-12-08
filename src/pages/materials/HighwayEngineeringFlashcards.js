import React, { useState } from 'react';
import './HighwayEngineeringFlashcards.css';

const flashcardsData = [
  {
    question: "What is superelevation in highway design?",
    answer: "The tilting or banking of the roadway on a horizontal curve to help counteract centrifugal force and reduce the tendency of vehicles to skid outward."
  },
  {
    question: "What is sight distance?", 
    answer: "The length of roadway visible to a driver, including stopping sight distance (SSD) and passing sight distance (PSD)."
  },
  {
    question: "What is the purpose of a transition curve in highway design?",
    answer: "To provide a gradual change between straight sections and circular curves, allowing vehicles to navigate the curve safely and comfortably."
  },
  {
    question: "What is CBR in pavement design?",
    answer: "California Bearing Ratio - a penetration test for evaluation of mechanical strength of road subgrades and base courses."
  },
  {
    question: "What are the different types of pavement?",
    answer: "Flexible pavement (asphalt), rigid pavement (concrete), and composite pavement (combination of both)."
  },
  {
    question: "What is the purpose of a crown in road design?",
    answer: "To facilitate drainage of surface water from the roadway to prevent hydroplaning and pavement deterioration."
  },
  {
    question: "What is AADT?",
    answer: "Annual Average Daily Traffic - the total volume of vehicle traffic on a highway for a year divided by 365 days."
  },
  {
    question: "What is the purpose of a grade separator?",
    answer: "To separate traffic moving in different directions or at different speeds using bridges or underpasses, reducing conflicts and improving safety."
  },
  {
    question: "What is rutting in pavements?",
    answer: "Longitudinal surface depressions in the wheel paths caused by permanent deformation in any of the pavement layers or subgrade."
  },
  {
    question: "What is a design vehicle?",
    answer: "A vehicle with representative weight, dimensions, and operating characteristics used to establish highway design controls."
  },
  {
    question: "What is the purpose of a median strip?",
    answer: "To separate opposing traffic flows, provide recovery area for out-of-control vehicles, and accommodate left-turn lanes."
  },
  {
    question: "What is the function of a subbase in pavement design?",
    answer: "To provide structural support, drainage, and frost protection between the subgrade and base course."
  },
  {
    question: "What is the K-value in vertical curve design?",
    answer: "The horizontal distance needed to produce a 1% change in gradient, used to determine the length of vertical curves."
  },
  {
    question: "What are channelizing islands?",
    answer: "Raised or painted areas used to control and direct traffic movements into definite paths of travel."
  },
  {
    question: "What is the purpose of a climbing lane?",
    answer: "An additional lane provided on steep grades to allow slower vehicles (typically trucks) to climb without impeding faster traffic."
  },
  {
    question: "What is the design speed?",
    answer: "A selected speed used to determine various geometric design features of the roadway, typically higher than the posted speed limit."
  },
  {
    question: "What is fatigue cracking in pavements?",
    answer: "A series of interconnected cracks caused by repeated traffic loading, typically appearing as alligator cracking in wheel paths."
  },
  {
    question: "What is a gore area?",
    answer: "The triangular area between a through roadway and an exit ramp or between an entrance ramp and the through roadway."
  },
  {
    question: "What is the purpose of rumble strips?",
    answer: "Grooved patterns in pavement that create noise and vibration to alert drivers when they drift from their lane or approach hazardous areas."
  },
  {
    question: "What is the stopping sight distance (SSD)?",
    answer: "The minimum distance required for a driver to perceive, react, and brake to a complete stop before reaching an obstacle."
  },
  {
    question: "Calculate the minimum radius of a horizontal curve with design speed 100 km/h, max superelevation 6%, and side friction 0.15",
    answer: "R = V²/[127(e + f)] = 100²/[127(0.06 + 0.15)] = 373m, where V=design speed, e=superelevation, f=side friction factor"
  },
  {
    question: "How do you determine the length of a vertical curve using comfort criteria?",
    answer: "L = AV²/395, where L=length in meters, A=algebraic difference in grades (%), V=design speed in km/h. Based on centrifugal acceleration limit of 0.3m/s²"
  },
  {
    question: "Calculate ESAL (Equivalent Single Axle Load) for a 26,000 lb single axle using fourth power law",
    answer: "ESAL = (26,000/18,000)⁴ = 4.17 ESALs, showing how heavier axles exponentially increase pavement damage"
  },
  {
    question: "What is the relationship between IRI (International Roughness Index) and PSI (Present Serviceability Index)?",
    answer: "PSI = 5 × e^(-0.0041 × IRI), where IRI is in inches/mile. Used for pavement condition assessment and maintenance planning"
  },
  {
    question: "Calculate the capacity of a basic freeway segment with free flow speed 70 mph, lane width 11 ft, and 10% heavy vehicles",
    answer: "Capacity = 2400 × fw × fhv × fp, where fw=0.96 (lane width), fhv=1/(1+0.1(1.5-1)), fp=1. Base capacity adjusted for conditions"
  },
  {
    question: "Explain Marshall Mix design criteria and their significance",
    answer: "Stability (>8kN), Flow (2-4mm), VMA (>13%), Air Voids (3-5%), VFB (65-75%). Ensures mix durability, rutting resistance, and workability"
  },
  {
    question: "How do you calculate the signal timing for a four-phase intersection?",
    answer: "Cycle length = (1.5L + 5)/(1-ΣY), where L=total lost time, Y=flow ratio (v/s) for critical movements in each phase. Then proportionally distribute green time"
  },
  {
    question: "What is the effect of gradation on asphalt mix performance?",
    answer: "Controls VMA, permeability, stability. Dense gradation: better strength, less permeability. Gap gradation: better skid resistance, drainage. Affects rutting and fatigue resistance"
  },
  {
    question: "Calculate the weaving section length needed for 1000 vph weaving volume at 60 mph",
    answer: "L = (V×W)/(3.22×N×S), where V=speed, W=weaving volume, N=number of lanes, S=speed differential. Minimum length for acceptable operation"
  },
  {
    question: "Explain mechanistic-empirical pavement design principles",
    answer: "Combines material mechanics (stress/strain) with field performance data. Analyzes critical responses (εt, εc, σd) to predict distress development over design life"
  },
  {
    question: "How do you determine the optimal binder content using Superpave mix design?",
    answer: "Based on 4% air voids at Ndesign, minimum VMA requirements, VFA range, and dust proportion. Must meet strength and volumetric criteria at all compaction levels"
  },
  {
    question: "Calculate the required lane width adjustment for a 5% grade, 2 miles long, with 15% trucks",
    answer: "Use equivalent grade length and truck factor tables. Grade adjustment = base capacity × grade factor × heavy vehicle factor"
  },
  {
    question: "What factors affect resilient modulus of subgrade soils?",
    answer: "Stress state (σd, σ3), moisture content, density, soil type. Mr = k1θ^k2 × σd^k3, where θ=bulk stress, σd=deviator stress, k=material parameters"
  },
  {
    question: "How do you analyze intersection sight distance for left turns?",
    answer: "ISD = 0.278Vmt(J + ta), where Vm=design speed, t=time gap, J=perception time, ta=acceleration time. Must consider opposing traffic speed and gaps"
  },
  {
    question: "Calculate the storage length needed for a left turn lane with arrival rate 200 vph",
    answer: "L = 2×Q×N×P×f, where Q=arrival rate, N=cycles/hour, P=probability of overflow, f=factor for random arrivals. Add deceleration length"
  },
  {
    question: "Explain the concept of perpetual pavement design",
    answer: "Designed to resist structural fatigue by limiting strain at critical locations. Uses thick asphalt layers, rich bottom layer, appropriate material selection"
  },
  {
    question: "How do you determine the critical length of grade for truck climbing lanes?",
    answer: "Based on speed reduction of design truck (typically 10-15 mph). Use power/weight ratio, grade resistance, rolling resistance in truck performance equations"
  },
  {
    question: "Calculate the required cross slope for drainage on a 6-lane highway",
    answer: "Tx = (0.009SxL^1.67)/(n×D^2.67), where Sx=cross slope, L=flow path, n=Manning's n, D=depth. Must meet hydroplaning criteria"
  },
  {
    question: "What is the effect of RAP on asphalt mix properties?",
    answer: "Affects binder grade selection, mix stiffness, cracking resistance. Need to consider RAP binder ratio, blending charts, and mixture workability"
  },
  {
    question: "How do you analyze roundabout capacity using HCM methods?",
    answer: "Capacity = A×e^(-B×Vc), where Vc=conflicting flow, A,B=coefficients based on geometry. Consider entry width, circulatory width, and angle"
  },
  {
    question: "Calculate the required pavement thickness using AASHTO 93 method",
    answer: "log(W18) = ZrS0 + 9.36log(SN+1) - 0.20 + log[(ΔPSI)/(4.2-1.5)]/(0.40+1094/(SN+1)^5.19) + 2.32log(Mr)-8.07"
  },
  {
    question: "Explain the concept of superpave gyratory compaction parameters",
    answer: "Nini (initial density), Ndes (design density), Nmax (maximum density). Related to traffic level and climate. Controls mix compactability and performance"
  },
  {
    question: "How do you determine the capacity of a diverge influence area?",
    answer: "Based on basic freeway segment capacity, ramp demand flow rate, and adjustment factors for geometry and traffic composition"
  },
  {
    question: "Calculate the required shoulder width for a rural arterial with design speed 60 mph",
    answer: "Based on design vehicle, recovery area needs, and emergency stopping. Consider traffic volume, composition, and roadway classification"
  },
  {
    question: "What factors affect thermal cracking in asphalt pavements?",
    answer: "Binder properties (PG grade), cooling rate, coefficient of thermal contraction, mix stiffness, aging. Use thermal stress restrained specimen test"
  },
  {
    question: "How do you analyze intersection delay using HCM methods?",
    answer: "d = d1(PF) + d2 + d3, where d1=uniform delay, PF=progression factor, d2=incremental delay, d3=initial queue delay"
  },
  {
    question: "Calculate the required length of acceleration lane for freeway entrance",
    answer: "Based on speed differential, grade adjustment, and design vehicle acceleration characteristics. Consider merging maneuver requirements"
  }
];

const HighwayEngineeringFlashcards = () => {
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
      <h1>Highway Engineering Flashcards</h1>
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

export default HighwayEngineeringFlashcards;
