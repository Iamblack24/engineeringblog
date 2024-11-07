import React, { useState } from 'react';
import './ReinforcedConcreteDesignTool.css'; // Import the CSS file for styling

const ReinforcedConcreteDesignTool = () => {
  const [inputValues, setInputValues] = useState({
    concreteStrength: '',
    steelStrength: '',
    beamWidth: '',
    beamDepth: '',
    effectiveDepth: '',
    appliedLoad: '',
    loadType: '',
  });

  const [result, setResult] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setInputValues({
      ...inputValues,
      [name]: value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const {
      concreteStrength,
      steelStrength,
      beamWidth,
      beamDepth,
      effectiveDepth,
      appliedLoad,
      loadType,
    } = inputValues;

    // Input Validation
    if (
      !concreteStrength ||
      !steelStrength ||
      !beamWidth ||
      !beamDepth ||
      !effectiveDepth ||
      !appliedLoad ||
      !loadType
    ) {
      alert('Please fill in all fields.');
      return;
    }

    // Convert inputs to numbers
    const fck = parseFloat(concreteStrength); // Concrete Compressive Strength (MPa)
    const b = parseFloat(beamWidth); // Beam Width (mm)
    const d = parseFloat(effectiveDepth); // Effective Depth (mm)
    const D = parseFloat(beamDepth); // Beam Depth (mm)
    const P = parseFloat(appliedLoad); // Applied Load (kN)

    // Moment Capacity (simplified calculation)
    const Mu = 0.138 * fck * b * d * d;

    // Shear Capacity (simplified calculation)
    const Vu = 0.27 * fck * b * d;

    // Deflection (simplified calculation)
    const E = 5000 * Math.sqrt(fck); // Modulus of Elasticity (MPa)
    const I = (b * Math.pow(D, 3)) / 12; // Moment of Inertia (mm^4)
    const L = 6000; // Span Length (mm) - assumed value
    const deflection = (5 * P * Math.pow(L, 4)) / (384 * E * I);

    setResult({
      Mu: Mu.toFixed(2),
      Vu: Vu.toFixed(2),
      deflection: deflection.toFixed(2),
    });
  };

  return (
    <div className="reinforced-concrete-design-tool">
      <h1>Reinforced Concrete Design Tool</h1>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="concreteStrength">Concrete Compressive Strength (MPa):</label>
          <input
            type="number"
            id="concreteStrength"
            name="concreteStrength"
            value={inputValues.concreteStrength}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="steelStrength">Steel Yield Strength (MPa):</label>
          <input
            type="number"
            id="steelStrength"
            name="steelStrength"
            value={inputValues.steelStrength}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="beamWidth">Beam Width (mm):</label>
          <input
            type="number"
            id="beamWidth"
            name="beamWidth"
            value={inputValues.beamWidth}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="beamDepth">Beam Depth (mm):</label>
          <input
            type="number"
            id="beamDepth"
            name="beamDepth"
            value={inputValues.beamDepth}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="effectiveDepth">Effective Depth (mm):</label>
          <input
            type="number"
            id="effectiveDepth"
            name="effectiveDepth"
            value={inputValues.effectiveDepth}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="appliedLoad">Applied Load (kN):</label>
          <input
            type="number"
            id="appliedLoad"
            name="appliedLoad"
            value={inputValues.appliedLoad}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="loadType">Load Type:</label>
          <select
            id="loadType"
            name="loadType"
            value={inputValues.loadType}
            onChange={handleChange}
            required
          >
            <option value="">Select Load Type</option>
            <option value="uniform">Uniformly Distributed Load</option>
            <option value="point">Point Load</option>
          </select>
        </div>
        <button type="submit">Calculate</button>
      </form>

      {result && (
        <div className="result">
          <h2>Calculation Results</h2>
          <p>
            <strong>Moment Capacity (Mu):</strong> {result.Mu} kN·m
          </p>
          <p>
            <strong>Shear Capacity (Vu):</strong> {result.Vu} kN
          </p>
          <p>
            <strong>Deflection:</strong> {result.deflection} mm
          </p>
        </div>
      )}
    </div>
  );
};

export default ReinforcedConcreteDesignTool;