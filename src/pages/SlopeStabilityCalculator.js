// src/pages/SlopeStabilityCalculator.js
import React, { useState } from 'react';
import './SlopeStabilityCalculator.css'; // Import the CSS file for styling

const SlopeStabilityCalculator = () => {
  const [slopeAngle, setSlopeAngle] = useState('');
  const [cohesion, setCohesion] = useState('');
  const [frictionAngle, setFrictionAngle] = useState('');
  const [unitWeight, setUnitWeight] = useState('');
  const [waterTable, setWaterTable] = useState(false);
  const [factorOfSafety, setFactorOfSafety] = useState(null);

  const calculateFactorOfSafety = (e) => {
    e.preventDefault();

    // Convert inputs to numbers
    const slopeAngleNum = parseFloat(slopeAngle);
    const cohesionNum = parseFloat(cohesion);
    const frictionAngleNum = parseFloat(frictionAngle);
    const unitWeightNum = parseFloat(unitWeight);

    if (isNaN(slopeAngleNum) || isNaN(cohesionNum) || isNaN(frictionAngleNum) || isNaN(unitWeightNum)) {
      alert('Please enter valid numbers for all fields.');
      return;
    }

    // Simplified calculation for factor of safety (assuming infinite slope)
    const slopeAngleRad = (slopeAngleNum * Math.PI) / 180; // Convert angle to radians
    const frictionAngleRad = (frictionAngleNum * Math.PI) / 180; // Convert angle to radians

    let factorOfSafetyCalc = (cohesionNum + (unitWeightNum * Math.cos(slopeAngleRad) * Math.tan(frictionAngleRad))) /
                             (unitWeightNum * Math.sin(slopeAngleRad));

    // Adjust for water table presence
    if (waterTable) {
      factorOfSafetyCalc *= 0.8; // Simplified adjustment for water table
    }

    setFactorOfSafety(factorOfSafetyCalc);
  };

  return (
    <div className="slope-stability-calculator">
      <h1>Slope Stability Calculator</h1>
      <form onSubmit={calculateFactorOfSafety}>
        <div className="form-group">
          <label>Slope Angle (degrees):</label>
          <input
            type="number"
            step="0.1"
            value={slopeAngle}
            onChange={(e) => setSlopeAngle(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Cohesion (kPa):</label>
          <input
            type="number"
            step="0.1"
            value={cohesion}
            onChange={(e) => setCohesion(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Friction Angle (degrees):</label>
          <input
            type="number"
            step="0.1"
            value={frictionAngle}
            onChange={(e) => setFrictionAngle(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Unit Weight (kN/m³):</label>
          <input
            type="number"
            step="0.1"
            value={unitWeight}
            onChange={(e) => setUnitWeight(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={waterTable}
              onChange={(e) => setWaterTable(e.target.checked)}
            />
            Water Table Present
          </label>
        </div>
        <button type="submit">Calculate Factor of Safety</button>
      </form>
      {factorOfSafety !== null && (
        <div className="results">
          <h2>Factor of Safety</h2>
          <p>{factorOfSafety.toFixed(2)}</p>
        </div>
      )}
    </div>
  );
};

export default SlopeStabilityCalculator;