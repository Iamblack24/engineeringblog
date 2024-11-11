// src/pages/HydraulicCalculator.js
import React, { useState } from 'react';
import './HydraulicCalculator.css'; // Import the CSS file for styling

const HydraulicCalculator = () => {
  const [velocity, setVelocity] = useState('');
  const [diameter, setDiameter] = useState('');
  const [length, setLength] = useState('');
  const [density, setDensity] = useState('');
  const [frictionFactor, setFrictionFactor] = useState('');
  const [results, setResults] = useState(null);

  const resetForm = () => {
    setVelocity('');
    setDiameter('');
    setLength('');
    setDensity('');
    setFrictionFactor('');
    setResults(null);
  };

  const calculateHydraulics = (e) => {
    e.preventDefault();

    // Convert inputs to numbers
    const velocityNum = parseFloat(velocity);
    const diameterNum = parseFloat(diameter);
    const lengthNum = parseFloat(length);
    const densityNum = parseFloat(density);
    const frictionFactorNum = parseFloat(frictionFactor);

    // Validate inputs
    if (isNaN(velocityNum)) {
      alert('Please enter a valid number for velocity.');
      return;
    }
    if (isNaN(diameterNum)) {
      alert('Please enter a valid number for diameter.');
      return;
    }
    if (isNaN(lengthNum)) {
      alert('Please enter a valid number for length.');
      return;
    }
    if (isNaN(densityNum)) {
      alert('Please enter a valid number for density.');
      return;
    }
    if (isNaN(frictionFactorNum)) {
      alert('Please enter a valid number for friction factor.');
      return;
    }

    // Calculate cross-sectional area (A) in m²
    const area = Math.PI * Math.pow(diameterNum / 2, 2);

    // Calculate Flow Rate (Q) in m³/s
    const flowRate = area * velocityNum;

    // Calculate Pressure Drop (ΔP) using Darcy-Weisbach equation in Pascals
    const pressureDrop =
      frictionFactorNum * (lengthNum / diameterNum) * (densityNum * Math.pow(velocityNum, 2)) / 2;

    setResults({
      flowRate: flowRate.toFixed(2),
      pressureDrop: pressureDrop.toFixed(2),
    });
  };

  return (
    <div className="hydraulic-calculator">
      <h1>Hydraulic Calculator</h1>
      <form onSubmit={calculateHydraulics}>
        <div className="form-group">
          <label>Velocity (m/s):</label>
          <input
            type="number"
            step="0.01"
            value={velocity}
            onChange={(e) => setVelocity(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Diameter (m):</label>
          <input
            type="number"
            step="0.01"
            value={diameter}
            onChange={(e) => setDiameter(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Pipe Length (m):</label>
          <input
            type="number"
            step="0.01"
            value={length}
            onChange={(e) => setLength(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Fluid Density (kg/m³):</label>
          <input
            type="number"
            step="0.1"
            value={density}
            onChange={(e) => setDensity(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Darcy Friction Factor (f):</label>
          <input
            type="number"
            step="0.0001"
            value={frictionFactor}
            onChange={(e) => setFrictionFactor(e.target.value)}
            required
          />
        </div>
        <button type="submit">Calculate</button>
        <button type="button" onClick={resetForm}>Reset</button>
      </form>
      {results && (
        <div className="results">
          <h2>Calculation Results</h2>
          <p><strong>Flow Rate (Q):</strong> {results.flowRate} m³/s</p>
          <p><strong>Pressure Drop (ΔP):</strong> {results.pressureDrop} Pa</p>
        </div>
      )}
    </div>
  );
};

export default HydraulicCalculator;