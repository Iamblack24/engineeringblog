// RetainingWallDesignTool.js

import React, { useState } from 'react';
import './RetainingWallDesignTool.css';

const RetainingWallDesignTool = () => {
  const [inputValues, setInputValues] = useState({
    height: '',
    baseWidth: '',
    soilType: '',
    surchargeLoad: '',
    wallMaterial: '',
  });

  const [result, setResult] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setInputValues((prevValues) => ({
      ...prevValues,
      [name]: value,
    }));
  };

  const handleCalculate = () => {
    const {
      height,
      baseWidth,
      soilType,
      surchargeLoad,
      wallMaterial,
    } = inputValues;

    // Debugging: Log input values
    console.log('Input Values:', inputValues);

    // Input Validation
    if (
      !height ||
      !baseWidth ||
      !soilType ||
      !surchargeLoad ||
      !wallMaterial
    ) {
      alert('Please fill in all fields.');
      return;
    }

    // Convert inputs to numbers
    const H = parseFloat(height);
    const B = parseFloat(baseWidth);
    const q = parseFloat(surchargeLoad);

    // Soil properties based on soil type
    let soilProperties;
    switch (soilType.toLowerCase()) {
      case 'clay':
        soilProperties = { cohesion: 25, phi: 20, unitWeight: 18 };
        break;
      case 'sand':
        soilProperties = { cohesion: 0, phi: 30, unitWeight: 16 };
        break;
      case 'gravel':
        soilProperties = { cohesion: 0, phi: 35, unitWeight: 20 };
        break;
      default:
        alert('Please select a valid soil type.');
        return;
    }

    // Wall properties based on wall material
    let wallProperties;
    switch (wallMaterial.toLowerCase()) {
      case 'concrete':
        wallProperties = { unitWeight: 24 };
        break;
      default:
        alert('Please select a valid wall material.');
        return;
    }

    const γ = soilProperties.unitWeight;
    const φ = soilProperties.phi;
    const c = soilProperties.cohesion;
    const γc = wallProperties.unitWeight;

    // Calculate active earth pressure coefficient (Ka) using Rankine's theory
    const φRadians = (φ * Math.PI) / 180;
    const Ka = (1 - Math.sin(φRadians)) / (1 + Math.sin(φRadians));

    // Calculate total active earth pressure (Pa)
    const Pa = 0.5 * Ka * γ * H * H + q * Ka * H;

    // Calculate resisting forces
    const weightOfWall = γc * B * H;
    const resistingForce = c * B + weightOfWall * Math.tan(φRadians);

    // Calculate safety factors
    const slidingSafetyFactor = resistingForce / Pa;

    const overturningMoment = Pa * H / 3;
    const resistingMoment = weightOfWall * (B / 2);

    const overturningSafetyFactor = resistingMoment / overturningMoment;

    const bearingCapacity = 200; // Assumed soil bearing capacity (kN/m²)
    const basePressure = weightOfWall / B;
    const bearingCapacitySafetyFactor = bearingCapacity / basePressure;

    setResult({
      Pa: Pa.toFixed(2),
      Fs: slidingSafetyFactor.toFixed(2),
      Fo: overturningSafetyFactor.toFixed(2),
      Fb: bearingCapacitySafetyFactor.toFixed(2),
    });
  };

  return (
    <div className="retaining-wall-design-tool">
      <h1>Retaining Wall Design Tool</h1>
      <div className="form-group">
        <label htmlFor="height">Height of Wall (m):</label>
        <input
          type="number"
          id="height"
          name="height"
          value={inputValues.height}
          onChange={handleChange}
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="baseWidth">Base Width (m):</label>
        <input
          type="number"
          id="baseWidth"
          name="baseWidth"
          value={inputValues.baseWidth}
          onChange={handleChange}
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="soilType">Soil Type:</label>
        <select
          id="soilType"
          name="soilType"
          value={inputValues.soilType}
          onChange={handleChange}
          required
        >
          <option value="">Select Soil Type</option>
          <option value="clay">Clay</option>
          <option value="sand">Sand</option>
          <option value="gravel">Gravel</option>
        </select>
      </div>
      <div className="form-group">
        <label htmlFor="surchargeLoad">Surcharge Load (kN/m²):</label>
        <input
          type="number"
          id="surchargeLoad"
          name="surchargeLoad"
          value={inputValues.surchargeLoad}
          onChange={handleChange}
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="wallMaterial">Wall Material:</label>
        <select
          id="wallMaterial"
          name="wallMaterial"
          value={inputValues.wallMaterial}
          onChange={handleChange}
          required
        >
          <option value="">Select Wall Material</option>
          <option value="concrete">Concrete</option>
        </select>
      </div>
      <button onClick={handleCalculate}>Calculate</button>

      {result && (
        <div className="result">
          <h2>Calculation Results</h2>
          <p>
            <strong>Active Earth Pressure (Pa):</strong> {result.Pa} kN/m²
          </p>
          <p>
            <strong>Sliding Safety Factor (Fs):</strong> {result.Fs}
          </p>
          <p>
            <strong>Overturning Safety Factor (Fo):</strong> {result.Fo}
          </p>
          <p>
            <strong>Bearing Capacity Safety Factor (Fb):</strong> {result.Fb}
          </p>
        </div>
      )}
    </div>
  );
};

export default RetainingWallDesignTool;