import React, { useState } from 'react';
import './EarthPressureCalculator.css';

const EarthPressureCalculator = () => {
  const [soilData, setSoilData] = useState({
    // Wall properties
    wallHeight: 3.0,        // meters
    wallInclination: 90,    // degrees (vertical by default)
    
    // Soil properties
    unitWeight: 18,         // kN/m³
    frictionAngle: 30,      // degrees
    cohesion: 0,           // kPa
    soilSurfaceInclination: 0, // degrees
    
    // Groundwater conditions
    groundwaterDepth: 10,   // meters (below surface)
    
    // Additional parameters
    surcharge: 0,          // kPa
    wallFriction: 0        // degrees
  });

  const [results, setResults] = useState(null);
  const [errors, setErrors] = useState({});

  const validateInputs = () => {
    const newErrors = {};
    
    if (soilData.wallHeight <= 0) {
      newErrors.wallHeight = 'Wall height must be positive';
    }
    if (soilData.wallInclination <= 0 || soilData.wallInclination > 90) {
      newErrors.wallInclination = 'Wall inclination must be between 0° and 90°';
    }
    if (soilData.unitWeight <= 0) {
      newErrors.unitWeight = 'Unit weight must be positive';
    }
    if (soilData.frictionAngle < 0 || soilData.frictionAngle > 45) {
      newErrors.frictionAngle = 'Friction angle must be between 0° and 45°';
    }
    if (soilData.soilSurfaceInclination < -45 || soilData.soilSurfaceInclination > 45) {
      newErrors.soilSurfaceInclination = 'Surface inclination must be between -45° and 45°';
    }
    if (Math.abs(soilData.wallFriction) > (2/3) * soilData.frictionAngle) {
      newErrors.wallFriction = 'Wall friction should not exceed 2/3 of soil friction angle';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateRankineCoefficients = () => {
    const { frictionAngle, soilSurfaceInclination } = soilData;
    const phi = (frictionAngle * Math.PI) / 180;
    const beta = (soilSurfaceInclination * Math.PI) / 180;
    
    // Active pressure coefficient
    const Ka = Math.pow(Math.cos(beta), 2) * (
      1 - Math.sqrt(1 - (Math.pow(Math.sin(phi + beta), 2) / Math.pow(Math.cos(beta), 2)))
    ) / (
      1 + Math.sqrt(1 - (Math.pow(Math.sin(phi + beta), 2) / Math.pow(Math.cos(beta), 2)))
    );
    
    // Passive pressure coefficient
    const Kp = Math.pow(Math.cos(beta), 2) * (
      1 + Math.sqrt(1 - (Math.pow(Math.sin(phi - beta), 2) / Math.pow(Math.cos(beta), 2)))
    ) / (
      1 - Math.sqrt(1 - (Math.pow(Math.sin(phi - beta), 2) / Math.pow(Math.cos(beta), 2)))
    );

    return { Ka, Kp };
  };

  const calculateEarthPressures = () => {
    if (!validateInputs()) {
      return;
    }

    try {
      const {
        wallHeight,
        unitWeight,
        cohesion,
        surcharge,
        groundwaterDepth
      } = soilData;

      const { Ka, Kp } = calculateRankineCoefficients();
      
      // Calculate pressures at different depths
      const depths = [0, wallHeight/4, wallHeight/2, 3*wallHeight/4, wallHeight];
      const pressurePoints = depths.map(depth => {
        const effectiveStress = unitWeight * depth;
        const waterPressure = depth > groundwaterDepth ? 
          9.81 * (depth - groundwaterDepth) : 0;
        
        // Active pressure
        const activePressure = (Ka * effectiveStress) - (2 * cohesion * Math.sqrt(Ka)) +
          (Ka * surcharge) + waterPressure;
        
        // Passive pressure
        const passivePressure = (Kp * effectiveStress) + (2 * cohesion * Math.sqrt(Kp)) +
          (Kp * surcharge) + waterPressure;

        return {
          depth,
          active: Math.max(0, activePressure),
          passive: Math.max(0, passivePressure),
          water: waterPressure
        };
      });

      // Calculate resultant forces and points of application
      const activeForce = (Ka * unitWeight * Math.pow(wallHeight, 2)) / 2 +
        (Ka * surcharge * wallHeight);
      const passiveForce = (Kp * unitWeight * Math.pow(wallHeight, 2)) / 2 +
        (Kp * surcharge * wallHeight);
      
      setResults({
        pressureCoefficients: { Ka, Kp },
        pressurePoints,
        resultantForces: {
          active: activeForce,
          passive: passiveForce
        },
        applicationPoints: {
          active: wallHeight / 3,
          passive: wallHeight / 3
        },
        notes: [
          'Calculations based on Rankine Earth Pressure Theory',
          'Assumes homogeneous soil conditions',
          'Wall friction effects are simplified'
        ],
        assumptions: [
          'Rigid wall movement',
          'Planar failure surface',
          'No cohesion effect on failure plane angle'
        ]
      });

    } catch (error) {
      setErrors({ calculation: 'Error in pressure calculations' });
    }
  };

  return (
    <div className="earth-pressure-calculator">
      <h2>Earth Pressure Calculator</h2>
      
      <div className="calculator-controls">
        <div className="input-sections">
          <div className="input-section">
            <h3>Wall Properties</h3>
            <div className="input-group">
              <label>Wall Height (m):</label>
              <input
                type="number"
                value={soilData.wallHeight}
                onChange={(e) => setSoilData({
                  ...soilData,
                  wallHeight: parseFloat(e.target.value) || 0
                })}
              />
            </div>
            <div className="input-group">
              <label>Wall Inclination (°):</label>
              <input
                type="number"
                value={soilData.wallInclination}
                onChange={(e) => setSoilData({
                  ...soilData,
                  wallInclination: parseFloat(e.target.value) || 90
                })}
              />
            </div>
          </div>

          <div className="input-section">
            <h3>Soil Properties</h3>
            <div className="input-group">
              <label>Unit Weight (kN/m³):</label>
              <input
                type="number"
                value={soilData.unitWeight}
                onChange={(e) => setSoilData({
                  ...soilData,
                  unitWeight: parseFloat(e.target.value) || 0
                })}
              />
            </div>
            <div className="input-group">
              <label>Friction Angle (°):</label>
              <input
                type="number"
                value={soilData.frictionAngle}
                onChange={(e) => setSoilData({
                  ...soilData,
                  frictionAngle: parseFloat(e.target.value) || 0
                })}
              />
            </div>
            <div className="input-group">
              <label>Cohesion (kPa):</label>
              <input
                type="number"
                value={soilData.cohesion}
                onChange={(e) => setSoilData({
                  ...soilData,
                  cohesion: parseFloat(e.target.value) || 0
                })}
              />
            </div>
          </div>

          <div className="input-section">
            <h3>Additional Parameters</h3>
            <div className="input-group">
              <label>Surface Inclination (°):</label>
              <input
                type="number"
                value={soilData.soilSurfaceInclination}
                onChange={(e) => setSoilData({
                  ...soilData,
                  soilSurfaceInclination: parseFloat(e.target.value) || 0
                })}
              />
            </div>
            <div className="input-group">
              <label>Surcharge (kPa):</label>
              <input
                type="number"
                value={soilData.surcharge}
                onChange={(e) => setSoilData({
                  ...soilData,
                  surcharge: parseFloat(e.target.value) || 0
                })}
              />
            </div>
            <div className="input-group">
              <label>Groundwater Depth (m):</label>
              <input
                type="number"
                value={soilData.groundwaterDepth}
                onChange={(e) => setSoilData({
                  ...soilData,
                  groundwaterDepth: parseFloat(e.target.value) || 0
                })}
              />
            </div>
          </div>
        </div>

        {Object.keys(errors).length > 0 && (
          <div className="errors">
            {Object.values(errors).map((error, index) => (
              <p key={index} className="error">{error}</p>
            ))}
          </div>
        )}

        <button 
          className="calculate-button"
          onClick={calculateEarthPressures}
        >
          Calculate Earth Pressures
        </button>

        {results && (
          <div className="results-section">
            <h3>Calculation Results</h3>
            <div className="results-grid">
              <div className="result-item">
                <span className="result-label">Active Pressure Coefficient (Ka):</span>
                <span className="result-value">
                  {results.pressureCoefficients.Ka.toFixed(4)}
                </span>
              </div>
              <div className="result-item">
                <span className="result-label">Passive Pressure Coefficient (Kp):</span>
                <span className="result-value">
                  {results.pressureCoefficients.Kp.toFixed(4)}
                </span>
              </div>
              
              <div className="result-item pressure-distribution">
                <span className="result-label">Pressure Distribution:</span>
                <table>
                  <thead>
                    <tr>
                      <th>Depth (m)</th>
                      <th>Active (kPa)</th>
                      <th>Passive (kPa)</th>
                      <th>Water (kPa)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.pressurePoints.map((point, index) => (
                      <tr key={index}>
                        <td>{point.depth.toFixed(2)}</td>
                        <td>{point.active.toFixed(2)}</td>
                        <td>{point.passive.toFixed(2)}</td>
                        <td>{point.water.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="result-item">
                <span className="result-label">Total Active Force:</span>
                <span className="result-value">
                  {results.resultantForces.active.toFixed(2)} kN/m
                </span>
              </div>
              <div className="result-item">
                <span className="result-label">Total Passive Force:</span>
                <span className="result-value">
                  {results.resultantForces.passive.toFixed(2)} kN/m
                </span>
              </div>

              <div className="result-item notes">
                <span className="result-label">Notes:</span>
                <ul>
                  {results.notes.map((note, index) => (
                    <li key={index}>{note}</li>
                  ))}
                </ul>
              </div>
              
              <div className="result-item assumptions">
                <span className="result-label">Key Assumptions:</span>
                <ul>
                  {results.assumptions.map((assumption, index) => (
                    <li key={index}>{assumption}</li>
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

export default EarthPressureCalculator;