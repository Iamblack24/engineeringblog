import React, { useState } from 'react';
import './HighwayGeometricCalculator.css';

const HighwayGeometricCalculator = () => {
  const [designData, setDesignData] = useState({
    // Design speed and traffic
    designSpeed: 80,        // km/h
    aadt: 15000,           // Annual Average Daily Traffic
    terrainType: 'rolling', // flat, rolling, mountainous
    
    // Horizontal alignment
    curve: {
      radius: 300,         // meters
      superelevation: 6,   // percentage
      length: 200,         // meters
      deflectionAngle: 30  // degrees
    },
    
    // Vertical alignment
    grade: {
      gradient: 4,         // percentage
      length: 300,         // meters
      k: 45                // K value for vertical curves
    },
    
    // Cross section elements
    crossSection: {
      laneWidth: 3.6,      // meters
      numberOfLanes: 2,     // per direction
      shoulderWidth: 2.5,   // meters
      medianWidth: 3.0,    // meters
      crossSlope: 2.0      // percentage
    },
    
    // Sight distance
    sightDistance: {
      stoppingDistance: 0,  // calculated
      passingDistance: 0,   // calculated
      decisionDistance: 0   // calculated
    }
  });

  const [results, setResults] = useState(null);
  const [errors, setErrors] = useState({});

  // Design constants
  const DESIGN_STANDARDS = {
    minRadius: {
      60: 125,
      80: 230,
      100: 395,
      120: 670
    },
    maxGrade: {
      flat: 3,
      rolling: 4,
      mountainous: 6
    },
    minK: {
      crest: {
        60: 11,
        80: 26,
        100: 52,
        120: 92
      },
      sag: {
        60: 18,
        80: 32,
        100: 52,
        120: 74
      }
    }
  };

  const validateInputs = () => {
    const newErrors = {};
    
    // Validate design speed
    if (designData.designSpeed < 60 || designData.designSpeed > 120) {
      newErrors.speed = 'Design speed must be between 60 and 120 km/h';
    }

    // Validate curve radius
    const minRadius = DESIGN_STANDARDS.minRadius[designData.designSpeed] || 0;
    if (designData.curve.radius < minRadius) {
      newErrors.radius = `Curve radius must be at least ${minRadius}m for ${designData.designSpeed}km/h`;
    }

    // Validate grade
    const maxGrade = DESIGN_STANDARDS.maxGrade[designData.terrainType];
    if (designData.grade.gradient > maxGrade) {
      newErrors.grade = `Maximum grade for ${designData.terrainType} terrain is ${maxGrade}%`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateDesign = () => {
    if (!validateInputs()) return;

    try {
      // Calculate horizontal curve elements
      const horizontalElements = calculateHorizontalCurve();
      
      // Calculate vertical curve elements
      const verticalElements = calculateVerticalCurve();
      
      // Calculate sight distances
      const sightDistances = calculateSightDistances();
      
      // Calculate cross section elements
      const crossSectionElements = calculateCrossSection();
      
      // Generate design recommendations
      const recommendations = generateRecommendations({
        horizontalElements,
        verticalElements,
        sightDistances,
        crossSectionElements
      });

      setResults({
        horizontalAlignment: horizontalElements,
        verticalAlignment: verticalElements,
        sightDistances,
        crossSection: crossSectionElements,
        recommendations,
        safetyAnalysis: performSafetyAnalysis()
      });

    } catch (error) {
      setErrors({ calculation: 'Error calculating geometric design' });
    }
  };

  const calculateHorizontalCurve = () => {
    const { radius, superelevation, deflectionAngle } = designData.curve;
    const { designSpeed } = designData;
    
    // Calculate side friction factor
    const f = 0.192 - (designSpeed / 1000);
    
    // Calculate minimum radius
    const minR = (designSpeed ** 2) / (127 * (superelevation/100 + f));
    
    // Calculate tangent length
    const T = radius * Math.tan(deflectionAngle * Math.PI / 360);
    
    // Calculate length of curve
    const L = (2 * Math.PI * radius * deflectionAngle) / 360;
    
    // Calculate external distance
    const E = radius * (1 / Math.cos(deflectionAngle * Math.PI / 360) - 1);
    
    return {
      minRadius: minR,
      actualRadius: radius,
      tangentLength: T,
      curveLength: L,
      externalDistance: E,
      sideFriction: f
    };
  };

  const calculateVerticalCurve = () => {
    const { gradient, length, k } = designData.grade;
    const { designSpeed } = designData;
    
    // Calculate minimum K value
    const minK = DESIGN_STANDARDS.minK.crest[designSpeed];
    
    // Calculate curve length
    const A = Math.abs(gradient);
    const L = k * A;
    
    // Calculate high point
    const highPoint = (length * gradient) / (2 * 100);
    
    return {
      minK,
      actualK: k,
      curveLength: L,
      algebraicDifference: A,
      highPoint
    };
  };

  const calculateSightDistances = () => {
    const { designSpeed } = designData;
    
    // Calculate stopping sight distance
    const t = 2.5; // reaction time in seconds
    const a = 3.4; // deceleration rate m/s²
    const gradientFactor = designData.grade.gradient / 100;
    
    const v = designSpeed / 3.6; // convert to m/s
    const ssd = (0.278 * v * t) + (v ** 2 / (254 * (a/9.81 + gradientFactor)));
    
    // Calculate passing sight distance
    const psd = 4.5 * designSpeed;
    
    // Calculate decision sight distance
    const dsd = 6.0 * designSpeed;
    
    return {
      stopping: Math.ceil(ssd),
      passing: Math.ceil(psd),
      decision: Math.ceil(dsd)
    };
  };

  const calculateCrossSection = () => {
    const { laneWidth, numberOfLanes, shoulderWidth, medianWidth, crossSlope } = designData.crossSection;
    
    return {
      totalWidth: (laneWidth * numberOfLanes * 2) + (shoulderWidth * 2) + medianWidth,
      pavementWidth: laneWidth * numberOfLanes * 2,
      drainageWidth: shoulderWidth * 2,
      crossSlopeFactor: crossSlope / 100
    };
  };

  const generateRecommendations = (data) => {
    const recommendations = [];
    
    if (data.horizontalElements.actualRadius < data.horizontalElements.minRadius) {
      recommendations.push({
        text: "Increase curve radius to meet minimum requirements",
        priority: "high"
      });
    }
    
    if (data.sightDistances.stopping < 1.5 * designData.designSpeed) {
      recommendations.push({
        text: "Consider increasing stopping sight distance",
        priority: "medium"
      });
    }
    
    return recommendations;
  };

  const performSafetyAnalysis = () => {
    return {
      'Sight Distance': designData.curve.radius > 300 ? 'Good' : 'Poor',
      'Curve Radius': designData.curve.radius > DESIGN_STANDARDS.minRadius[designData.designSpeed] ? 'Good' : 'Poor',
      'Grade': designData.grade.gradient < DESIGN_STANDARDS.maxGrade[designData.terrainType] ? 'Good' : 'Poor'
    };
  };

  return (
    <div className="highway-geometric-calculator">
      <h2>Highway Geometric Design Calculator</h2>
      
      {Object.keys(errors).length > 0 && (
        <div className="errors-section">
          {Object.values(errors).map((error, index) => (
            <div key={index} className="error-message">
              {error}
            </div>
          ))}
        </div>
      )}
      
      <div className="calculator-controls">
        <div className="input-sections">
          {/* Design Speed and Traffic Section */}
          <div className="input-section">
            <h3>Design Parameters</h3>
            <div className="input-group">
              <label>Design Speed (km/h):</label>
              <input
                type="number"
                value={designData.designSpeed}
                onChange={(e) => setDesignData({
                  ...designData,
                  designSpeed: parseFloat(e.target.value)
                })}
              />
            </div>
            {/* Additional design parameter inputs */}
          </div>

          {/* Horizontal Alignment Section */}
          <div className="input-section">
            <h3>Horizontal Alignment</h3>
            {/* Horizontal alignment inputs */}
          </div>

          {/* Vertical Alignment Section */}
          <div className="input-section">
            <h3>Vertical Alignment</h3>
            {/* Vertical alignment inputs */}
          </div>

          {/* Cross Section Section */}
          <div className="input-section">
            <h3>Cross Section</h3>
            {/* Cross section inputs */}
          </div>
        </div>

        <button 
          className="calculate-button"
          onClick={calculateDesign}
        >
          Calculate Design
        </button>

        {/* Results Display */}
        {results && (
          <div className="results-section">
            <h3>Geometric Design Results</h3>
            
            <div className="results-grid">
              {/* Horizontal Alignment Results */}
              <div className="result-item">
                <h4>Horizontal Alignment</h4>
                <div className="horizontal-diagram">
                  {/* SVG visualization of horizontal curve */}
                </div>
                <div className="metrics-grid">
                  {Object.entries(results.horizontalAlignment).map(([key, value]) => (
                    <div key={key} className="metric">
                      <span className="metric-label">{key}:</span>
                      <span className="metric-value">
                        {typeof value === 'number' ? value.toFixed(2) : value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Vertical Alignment Results */}
              <div className="result-item">
                <h4>Vertical Alignment</h4>
                <div className="vertical-diagram">
                  {/* SVG visualization of vertical curve */}
                </div>
                <div className="metrics-grid">
                  {Object.entries(results.verticalAlignment).map(([key, value]) => (
                    <div key={key} className="metric">
                      <span className="metric-label">{key}:</span>
                      <span className="metric-value">
                        {typeof value === 'number' ? value.toFixed(2) : value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sight Distances */}
              <div className="result-item">
                <h4>Sight Distances</h4>
                <div className="sight-distances">
                  {Object.entries(results.sightDistances).map(([type, distance]) => (
                    <div key={type} className="distance-item">
                      <span className="distance-type">{type}:</span>
                      <span className="distance-value">{distance}m</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cross Section */}
              <div className="result-item">
                <h4>Cross Section</h4>
                <div className="cross-section-diagram">
                  {/* SVG visualization of cross section */}
                </div>
                <div className="metrics-grid">
                  {Object.entries(results.crossSection).map(([key, value]) => (
                    <div key={key} className="metric">
                      <span className="metric-label">{key}:</span>
                      <span className="metric-value">
                        {typeof value === 'number' ? value.toFixed(2) : value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Safety Analysis */}
              <div className="result-item">
                <h4>Safety Analysis</h4>
                <div className="safety-metrics">
                  {Object.entries(results.safetyAnalysis).map(([factor, rating]) => (
                    <div key={factor} className="safety-factor">
                      <span className="factor-name">{factor}</span>
                      <div className={`safety-rating ${rating.toLowerCase()}`}>
                        {rating}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              <div className="result-item recommendations">
                <h4>Design Recommendations</h4>
                <ul className="recommendations-list">
                  {results.recommendations.map((rec, index) => (
                    <li key={index} className={`priority-${rec.priority}`}>
                      {rec.text}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HighwayGeometricCalculator;