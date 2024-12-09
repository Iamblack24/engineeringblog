import React, { useState } from 'react';
import './RainfallRunoffCalculator.css';

const RainfallRunoffCalculator = () => {
  const [projectData, setProjectData] = useState({
    // Site characteristics
    catchmentArea: 0,      // hectares
    surfaceType: 'urban',  // urban, suburban, rural
    slopePercentage: 0,    // %
    
    // Rainfall data
    rainfallIntensity: 0,  // mm/hr
    stormDuration: 1,      // hours
    returnPeriod: 10,      // years
    
    // Surface coefficients
    imperviousArea: 0,     // percentage
    soilType: 'a',         // a, b, c, d (HSG classification)
    
    // Additional factors
    antecedentMoisture: 'dry',  // dry, normal, wet
    seasonality: 'summer',      // summer, winter
    
    // Method selection
    calculationMethod: 'rational' // rational, scs-cn, time-area
  });

  const [results, setResults] = useState(null);
  const [errors, setErrors] = useState({});

  // SCS Curve Numbers for different soil types
  const CURVE_NUMBERS = {
    a: { // Type A soil (High infiltration)
      urban: 77,
      suburban: 61,
      rural: 36
    },
    b: { // Type B soil (Moderate infiltration)
      urban: 85,
      suburban: 70,
      rural: 60
    },
    c: { // Type C soil (Slow infiltration)
      urban: 90,
      suburban: 80,
      rural: 73
    },
    d: { // Type D soil (Very slow infiltration)
      urban: 92,
      suburban: 85,
      rural: 79
    }
  };

  // Enhanced constants
  const CONSTANTS = {
    INITIAL_ABSTRACTION_RATIO: 0.2,  // Standard Ia/S ratio (can be 0.05-0.2)
    MIN_SLOPE: 0.1,                  // Minimum slope percentage
    MAX_SLOPE: 50,                   // Maximum slope percentage
    AMC_ADJUSTMENTS: {               // Antecedent Moisture Condition adjustments
      DRY: { subtract: 15 },         // AMC I
      AVERAGE: { multiply: 1 },      // AMC II (no adjustment)
      WET: { add: 10 }              // AMC III
    }
  };

  const validateInputs = () => {
    const newErrors = {};
    
    if (projectData.catchmentArea <= 0) {
      newErrors.catchmentArea = 'Catchment area must be positive';
    }
    if (projectData.rainfallIntensity <= 0) {
      newErrors.rainfallIntensity = 'Rainfall intensity must be positive';
    }
    if (projectData.slopePercentage < 0 || projectData.slopePercentage > 100) {
      newErrors.slopePercentage = 'Slope must be between 0 and 100%';
    }
    if (projectData.imperviousArea < 0 || projectData.imperviousArea > 100) {
      newErrors.imperviousArea = 'Impervious area must be between 0 and 100%';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Enhanced runoff coefficient selection
  const calculateRunoffCoefficient = (surfaceType, imperviousArea, slope) => {
    const baseCoefficients = {
      urban: {
        commercial: { min: 0.70, max: 0.95 },
        residential: { min: 0.50, max: 0.70 },
        parks: { min: 0.10, max: 0.25 }
      },
      suburban: {
        commercial: { min: 0.60, max: 0.85 },
        residential: { min: 0.40, max: 0.60 },
        parks: { min: 0.05, max: 0.20 }
      },
      rural: {
        commercial: { min: 0.50, max: 0.80 },
        residential: { min: 0.30, max: 0.50 },
        parks: { min: 0.05, max: 0.15 }
      }
    };

    // Determine land use category
    const landUse = imperviousArea > 70 ? 'commercial' : 
                   imperviousArea > 40 ? 'residential' : 'parks';

    // Get coefficient range
    const range = baseCoefficients[surfaceType][landUse];
    
    // Adjust based on slope and impervious area
    const slopeAdjustment = Math.min(Math.max(slope / 100, 0), 0.2);
    const imperviousAdjustment = imperviousArea / 100;
    
    return range.min + (range.max - range.min) * 
           (0.5 * slopeAdjustment + 0.5 * imperviousAdjustment);
  };

  // Enhanced Rational Method
  const calculateRationalMethod = () => {
    // Calculate runoff coefficient with slope consideration
    const C = calculateRunoffCoefficient(
      projectData.surfaceType,
      projectData.imperviousArea,
      projectData.slopePercentage
    );
    
    const I = projectData.rainfallIntensity; // mm/hr
    const A = projectData.catchmentArea;      // hectares
    
    // Q = CIA (m³/hr)
    // Convert units: mm/hr * ha = m³/hr / 100, then * 1000 for L/s = * 10
    const peakRunoff = (C * I * A * 10);
    
    // Calculate time to peak using time of concentration
    const tc = calculateTimeOfConcentration();
    const timeToQpeak = tc * 0.67; // Typical ratio
    
    return {
      runoffCoefficient: C,
      peakRunoff,
      timeToQpeak,
      totalVolume: peakRunoff * projectData.stormDuration,
      unitHydrograph: generateUnitHydrograph(timeToQpeak, projectData.stormDuration)
    };
  };

  // Enhanced SCS-CN Method with corrected calculations
  const calculateSCSMethod = () => {
    try {
      // Get base CN and adjust for antecedent moisture condition
      let CN = CURVE_NUMBERS[projectData.soilType][projectData.surfaceType];
      if (!CN) {
        throw new Error('Invalid soil type or surface type combination');
      }

      // Adjust CN for antecedent moisture condition
      CN = adjustCNForAMC(CN, projectData.antecedentMoisture);
      
      // Calculate total rainfall (P) in mm
      const P = projectData.rainfallIntensity * projectData.stormDuration;
      
      // Calculate potential maximum retention (S) in mm
      const S = (25400 / CN) - 254;
      
      // Calculate initial abstraction (Ia) in mm
      const Ia = CONSTANTS.INITIAL_ABSTRACTION_RATIO * S;
      
      // Calculate runoff depth (Q) in mm using SCS equation
      let Q = 0;
      if (P > Ia) {
        Q = Math.pow(P - Ia, 2) / (P + S - Ia);
      }
      
      // Calculate time of concentration
      const tc = calculateTimeOfConcentration();
      
      // Calculate time to peak (tp) in hours
      const tp = 0.67 * tc;
      
      // Calculate peak discharge using SCS unit hydrograph equation
      // A = catchment area in km²
      const A = projectData.catchmentArea / 100; 
      
      // Peak discharge (Qp) in m³/s
      // SCS standard equation: Qp = (0.208 * A * Q) / tp
      const Qp = (0.208 * A * Q) / tp;
      
      // Calculate total runoff volume in m³
      // Convert mm to m³: (mm * ha * 10)
      const runoffVolume = Q * projectData.catchmentArea * 10;
      
      // Generate warnings if needed
      const warnings = [];
      if (Q < 0.1 * P) {
        warnings.push('Low runoff ratio - check input parameters');
      }
      if (CN < 40) {
        warnings.push('Very low CN value - verify surface conditions');
      }
      
      return {
        curveNumber: CN,
        retentionParameter: S,
        initialAbstraction: Ia,
        totalRainfall: P,
        runoffDepth: Q,
        peakDischarge: Qp,
        runoffVolume: runoffVolume,
        timeToQpeak: tp,
        timeOfConcentration: tc,
        runoffRatio: Q / P,
        warnings: warnings,
        tcDetails: {
          kirpich: calculateKirpichTc(projectData.slopePercentage),
          faa: calculateFAATc(projectData.slopePercentage),
          tr55: calculateTR55Tc(projectData.slopePercentage)
        }
      };
    } catch (error) {
      console.error('SCS-CN calculation error:', error);
      throw new Error('Error in SCS-CN calculations: ' + error.message);
    }
  };

  const calculateTimeArea = () => {
    // Time-area method implementation
    // This is a simplified version
    const tc = calculateTimeOfConcentration();
    const intensityAdjusted = projectData.rainfallIntensity * 
      Math.pow(tc / projectData.stormDuration, 0.25);
    
    return {
      timeOfConcentration: tc,
      adjustedIntensity: intensityAdjusted,
      // Additional time-area specific calculations
    };
  };

  // Enhanced Time of Concentration calculations
  const calculateTimeOfConcentration = () => {
    // Validate slope
    const slope = Math.max(
      CONSTANTS.MIN_SLOPE,
      Math.min(projectData.slopePercentage, CONSTANTS.MAX_SLOPE)
    );

    // Calculate using multiple methods and take weighted average
    const tc = {
      kirpich: calculateKirpichTc(slope),
      faa: calculateFAATc(slope),
      tr55: calculateTR55Tc(slope)
    };

    return (tc.kirpich + tc.faa + tc.tr55) / 3;
  };

  // Individual Tc calculation methods
  const calculateKirpichTc = (slope) => {
    const L = Math.sqrt(projectData.catchmentArea * 10000);
    const H = L * (slope / 100);
    return 0.0195 * Math.pow(Math.pow(L, 3) / H, 0.385);
  };

  const calculateFAATc = (slope) => {
    const L = Math.sqrt(projectData.catchmentArea * 10000);
    const C = projectData.imperviousArea > 50 ? 0.015 : 0.03;
    return 0.93 * Math.pow(L * C / Math.sqrt(slope), 0.385);
  };

  const calculateTR55Tc = (slope) => {
    const L = Math.sqrt(projectData.catchmentArea * 10000);
    const n = projectData.surfaceType === 'urban' ? 0.015 : 0.024;
    const P2 = projectData.rainfallIntensity * 2; // 2-year, 24-hour rainfall
    return 0.0526 * Math.pow(n * L / Math.sqrt(slope), 0.6) / Math.pow(P2, 0.3);
  };

  // Helper function to adjust CN for antecedent moisture condition
  const adjustCNForAMC = (cn, amc) => {
    // Validate input CN
    if (cn < 30 || cn > 100) {
      throw new Error('Invalid Curve Number: must be between 30 and 100');
    }

    switch(amc.toLowerCase()) {
      case 'dry':
        // AMC I adjustment
        return Math.max(
          Math.round((4.2 * cn) / (10 - 0.058 * cn)), 
          30
        );
      case 'wet':
        // AMC III adjustment
        return Math.min(
          Math.round((23 * cn) / (10 + 0.13 * cn)), 
          100
        );
      case 'normal':
        // AMC II (no adjustment)
        return cn;
      default:
        throw new Error('Invalid antecedent moisture condition');
    }
  };

  // Generate unit hydrograph ordinates
  const generateUnitHydrograph = (tp, duration) => {
    const ordinates = [];
    const timeStep = duration / 20; // 20 points on hydrograph
    
    for (let t = 0; t <= duration; t += timeStep) {
      const ratio = t / tp;
      let q;
      if (ratio <= 1) {
        q = ratio; // Rising limb
      } else {
        q = Math.exp(-4 * (ratio - 1)); // Recession limb
      }
      ordinates.push({ time: t, discharge: q });
    }
    
    return ordinates;
  };

  const calculateRunoff = () => {
    if (!validateInputs()) {
      return;
    }

    try {
      let methodResults;
      let commonResults = {
        catchmentArea: projectData.catchmentArea,
        rainfallIntensity: projectData.rainfallIntensity,
        stormDuration: projectData.stormDuration,
        totalRainfall: projectData.rainfallIntensity * projectData.stormDuration
      };

      switch (projectData.calculationMethod) {
        case 'rational':
          methodResults = calculateRationalMethod();
          break;
        case 'scs-cn':
          methodResults = calculateSCSMethod();
          break;
        case 'time-area':
          methodResults = calculateTimeArea();
          break;
        default:
          throw new Error('Invalid calculation method');
      }

      setResults({
        ...commonResults,
        ...methodResults,
        environmentalFactors: {
          soilType: projectData.soilType.toUpperCase(),
          antecedentMoisture: projectData.antecedentMoisture,
          seasonality: projectData.seasonality
        },
        recommendations: generateRecommendations(methodResults)
      });

    } catch (error) {
      setErrors({ calculation: 'Error in runoff calculations' });
    }
  };

  const generateRecommendations = (results) => {
    const recommendations = [];
    
    if (results.peakRunoff > 1000) {
      recommendations.push('Consider implementing detention basins');
    }
    if (projectData.imperviousArea > 60) {
      recommendations.push('Consider permeable pavement options');
    }
    if (results.runoffCoefficient > 0.7) {
      recommendations.push('Implement green infrastructure to reduce runoff');
    }
    
    return recommendations;
  };

  return (
    <div className="rainfall-runoff-calculator">
      <h2>Rainfall Runoff Calculator</h2>
      
      <div className="calculator-controls">
        <div className="input-sections">
          {/* Site Characteristics Section */}
          <div className="input-section">
            <h3>Site Characteristics</h3>
            <div className="input-group">
              <label>Catchment Area (hectares):</label>
              <input
                type="number"
                value={projectData.catchmentArea}
                onChange={(e) => setProjectData({
                  ...projectData,
                  catchmentArea: parseFloat(e.target.value) || 0
                })}
              />
            </div>
            <div className="input-group">
              <label>Surface Type:</label>
              <select
                value={projectData.surfaceType}
                onChange={(e) => setProjectData({
                  ...projectData,
                  surfaceType: e.target.value
                })}
              >
                <option value="urban">Urban</option>
                <option value="suburban">Suburban</option>
                <option value="rural">Rural</option>
              </select>
            </div>
            <div className="input-group">
              <label>Slope (%):</label>
              <input
                type="number"
                value={projectData.slopePercentage}
                onChange={(e) => setProjectData({
                  ...projectData,
                  slopePercentage: parseFloat(e.target.value) || 0
                })}
              />
            </div>
          </div>

          {/* Rainfall Data Section */}
          <div className="input-section">
            <h3>Rainfall Data</h3>
            <div className="input-group">
              <label>Rainfall Intensity (mm/hr):</label>
              <input
                type="number"
                value={projectData.rainfallIntensity}
                onChange={(e) => setProjectData({
                  ...projectData,
                  rainfallIntensity: parseFloat(e.target.value) || 0
                })}
              />
            </div>
            <div className="input-group">
              <label>Storm Duration (hours):</label>
              <input
                type="number"
                value={projectData.stormDuration}
                onChange={(e) => setProjectData({
                  ...projectData,
                  stormDuration: parseFloat(e.target.value) || 1
                })}
              />
            </div>
            <div className="input-group">
              <label>Return Period (years):</label>
              <select
                value={projectData.returnPeriod}
                onChange={(e) => setProjectData({
                  ...projectData,
                  returnPeriod: parseInt(e.target.value)
                })}
              >
                <option value="2">2</option>
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </div>
          </div>

          {/* Surface Coefficients Section */}
          <div className="input-section">
            <h3>Surface Characteristics</h3>
            <div className="input-group">
              <label>Impervious Area (%):</label>
              <input
                type="number"
                value={projectData.imperviousArea}
                onChange={(e) => setProjectData({
                  ...projectData,
                  imperviousArea: parseFloat(e.target.value) || 0
                })}
              />
            </div>
            <div className="input-group">
              <label>Soil Type (HSG):</label>
              <select
                value={projectData.soilType}
                onChange={(e) => setProjectData({
                  ...projectData,
                  soilType: e.target.value
                })}
              >
                <option value="a">Type A - High Infiltration</option>
                <option value="b">Type B - Moderate Infiltration</option>
                <option value="c">Type C - Slow Infiltration</option>
                <option value="d">Type D - Very Slow Infiltration</option>
              </select>
            </div>
          </div>

          {/* Method Selection Section */}
          <div className="input-section">
            <h3>Calculation Method</h3>
            <div className="input-group">
              <label>Method:</label>
              <select
                value={projectData.calculationMethod}
                onChange={(e) => setProjectData({
                  ...projectData,
                  calculationMethod: e.target.value
                })}
              >
                <option value="rational">Rational Method</option>
                <option value="scs-cn">SCS Curve Number Method</option>
                <option value="time-area">Time-Area Method</option>
              </select>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {Object.keys(errors).length > 0 && (
          <div className="errors">
            {Object.values(errors).map((error, index) => (
              <p key={index} className="error">{error}</p>
            ))}
          </div>
        )}

        <button 
          className="calculate-button"
          onClick={calculateRunoff}
        >
          Calculate Runoff
        </button>

        {/* Results Display */}
        {results && (
          <div className="results-section">
            <h3>Runoff Calculation Results</h3>
            <div className="results-grid">
              {/* Input Summary */}
              <div className="result-item">
                <h4>Input Summary</h4>
                <div className="result-detail">
                  <span>Catchment Area:</span>
                  <span>{results.catchmentArea?.toFixed(2) || 0} ha</span>
                </div>
                <div className="result-detail">
                  <span>Rainfall Intensity:</span>
                  <span>{results.rainfallIntensity?.toFixed(2) || 0} mm/hr</span>
                </div>
                <div className="result-detail">
                  <span>Storm Duration:</span>
                  <span>{results.stormDuration?.toFixed(1) || 0} hours</span>
                </div>
                <div className="result-detail">
                  <span>Time of Concentration:</span>
                  <span>{results.timeOfConcentration?.toFixed(2) || 0} hours</span>
                </div>
              </div>

              {/* Method-specific Results */}
              <div className="result-item">
                <h4>Runoff Results</h4>
                {projectData.calculationMethod === 'rational' && (
                  <>
                    <div className="result-detail">
                      <span>Runoff Coefficient:</span>
                      <span>{results.runoffCoefficient?.toFixed(3) || 0}</span>
                    </div>
                    <div className="result-detail">
                      <span>Peak Runoff:</span>
                      <span>{results.peakRunoff?.toFixed(2) || 0} m³/s</span>
                    </div>
                    <div className="result-detail">
                      <span>Time to Peak:</span>
                      <span>{results.timeToQpeak?.toFixed(2) || 0} hours</span>
                    </div>
                    <div className="result-detail">
                      <span>Total Volume:</span>
                      <span>{results.totalVolume?.toFixed(2) || 0} m³</span>
                    </div>
                  </>
                )}
                {projectData.calculationMethod === 'scs-cn' && (
                  <>
                    <div className="result-detail">
                      <span>Curve Number (CN):</span>
                      <span>{results.curveNumber || 0}</span>
                    </div>
                    <div className="result-detail">
                      <span>Initial Abstraction:</span>
                      <span>{results.initialAbstraction?.toFixed(2) || 0} mm</span>
                    </div>
                    <div className="result-detail">
                      <span>Retention Parameter (S):</span>
                      <span>{results.retentionParameter?.toFixed(2) || 0} mm</span>
                    </div>
                    <div className="result-detail">
                      <span>Runoff Depth:</span>
                      <span>{results.runoffDepth?.toFixed(2) || 0} mm</span>
                    </div>
                    <div className="result-detail">
                      <span>Peak Discharge:</span>
                      <span>{results.peakDischarge?.toFixed(2) || 0} m³/s</span>
                    </div>
                    <div className="result-detail">
                      <span>Runoff Volume:</span>
                      <span>{results.runoffVolume?.toFixed(2) || 0} m³</span>
                    </div>
                  </>
                )}
                {projectData.calculationMethod === 'time-area' && (
                  <>
                    <div className="result-detail">
                      <span>Time of Concentration:</span>
                      <span>{results.timeOfConcentration?.toFixed(2) || 0} hours</span>
                    </div>
                    <div className="result-detail">
                      <span>Adjusted Intensity:</span>
                      <span>{results.adjustedIntensity?.toFixed(2) || 0} mm/hr</span>
                    </div>
                  </>
                )}
              </div>

              {/* Time of Concentration Details */}
              <div className="result-item">
                <h4>Time of Concentration Details</h4>
                <div className="result-detail">
                  <span>Kirpich Method:</span>
                  <span>{results.tcDetails?.kirpich?.toFixed(2) || 0} hours</span>
                </div>
                <div className="result-detail">
                  <span>FAA Method:</span>
                  <span>{results.tcDetails?.faa?.toFixed(2) || 0} hours</span>
                </div>
                <div className="result-detail">
                  <span>TR-55 Method:</span>
                  <span>{results.tcDetails?.tr55?.toFixed(2) || 0} hours</span>
                </div>
              </div>

              {/* Environmental Factors */}
              <div className="result-item">
                <h4>Environmental Factors</h4>
                <div className="result-detail">
                  <span>Soil Type:</span>
                  <span>Type {results.environmentalFactors?.soilType || ''}</span>
                </div>
                <div className="result-detail">
                  <span>Moisture Condition:</span>
                  <span>{results.environmentalFactors?.antecedentMoisture || ''}</span>
                </div>
                <div className="result-detail">
                  <span>Surface Type:</span>
                  <span>{projectData.surfaceType || ''}</span>
                </div>
                <div className="result-detail">
                  <span>Impervious Area:</span>
                  <span>{projectData.imperviousArea || 0}%</span>
                </div>
              </div>

              {/* Warnings and Recommendations */}
              {results.warnings?.length > 0 && (
                <div className="result-item warnings">
                  <h4>Warnings</h4>
                  <ul>
                    {results.warnings.map((warning, index) => (
                      <li key={index}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RainfallRunoffCalculator;