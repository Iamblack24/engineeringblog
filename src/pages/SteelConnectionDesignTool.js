import React, { useState } from 'react';
import './SteelConnectionDesignTool.css'; // Import the CSS file for styling

const SteelConnectionDesignTool = () => {
  const [inputValues, setInputValues] = useState({
    connectionType: '',
    boltDiameter: '',
    boltGrade: '',
    numBolts: '',
    weldSize: '',
    weldLength: '',
    appliedLoad: '',
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
      connectionType,
      boltDiameter,
      boltGrade,
      numBolts,
      weldSize,
      weldLength,
      appliedLoad,
    } = inputValues;

    // Input validation
    if (!connectionType || !appliedLoad) {
      alert('Please fill in all required fields.');
      return;
    }

    let capacity = 0;

    if (connectionType === 'bolted') {
      if (!boltDiameter || !boltGrade || !numBolts) {
        alert('Please fill in all bolt details.');
        return;
      }
      // Bolted connection calculations
      const d = parseFloat(boltDiameter); // mm
      const grade = parseFloat(boltGrade); // e.g., 8.8
      const n = parseInt(numBolts);

      // Simplified bolt shear capacity
      const A = (Math.PI * d * d) / 4; // Bolt area in mm²
      const fub = grade * 100; // Ultimate tensile strength in MPa
      const boltShearCapacity = 0.6 * fub * A * n / 1000; // kN

      capacity = boltShearCapacity;
    } else if (connectionType === 'welded') {
      if (!weldSize || !weldLength) {
        alert('Please fill in all weld details.');
        return;
      }
      // Welded connection calculations
      const a = parseFloat(weldSize); // mm
      const l = parseFloat(weldLength); // mm

      // Simplified weld shear capacity
      const fu = 410; // MPa
      const throatArea = 0.707 * a * l; // mm²
      const weldShearCapacity = 0.6 * fu * throatArea / 1000; // kN

      capacity = weldShearCapacity;
    } else {
      alert('Invalid connection type.');
      return;
    }

    const load = parseFloat(appliedLoad); // kN
    const safetyFactor = capacity / load;

    setResult({
      capacity: capacity.toFixed(2),
      safetyFactor: safetyFactor.toFixed(2),
    });
  };

  return (
    <div className="steel-connection-design-tool">
      <h1>Steel Connection Design Tool</h1>
      <div className="form-group">
        <label htmlFor="connectionType">Connection Type:</label>
        <select
          id="connectionType"
          name="connectionType"
          value={inputValues.connectionType}
          onChange={handleChange}
          required
        >
          <option value="">Select Connection Type</option>
          <option value="bolted">Bolted Connection</option>
          <option value="welded">Welded Connection</option>
        </select>
      </div>

      {inputValues.connectionType === 'bolted' && (
        <>
          <div className="form-group">
            <label htmlFor="boltDiameter">Bolt Diameter (mm):</label>
            <input
              type="number"
              id="boltDiameter"
              name="boltDiameter"
              value={inputValues.boltDiameter}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="boltGrade">Bolt Grade (e.g., 8.8):</label>
            <input
              type="number"
              id="boltGrade"
              name="boltGrade"
              value={inputValues.boltGrade}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="numBolts">Number of Bolts:</label>
            <input
              type="number"
              id="numBolts"
              name="numBolts"
              value={inputValues.numBolts}
              onChange={handleChange}
              required
            />
          </div>
        </>
      )}

      {inputValues.connectionType === 'welded' && (
        <>
          <div className="form-group">
            <label htmlFor="weldSize">Weld Size (mm):</label>
            <input
              type="number"
              id="weldSize"
              name="weldSize"
              value={inputValues.weldSize}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="weldLength">Weld Length (mm):</label>
            <input
              type="number"
              id="weldLength"
              name="weldLength"
              value={inputValues.weldLength}
              onChange={handleChange}
              required
            />
          </div>
        </>
      )}

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

      <button onClick={handleCalculate}>Calculate</button>

      {result && (
        <div className="result">
          <h2>Calculation Results</h2>
          <p>
            <strong>Connection Capacity:</strong> {result.capacity} kN
          </p>
          <p>
            <strong>Safety Factor:</strong> {result.safetyFactor}
          </p>
        </div>
      )}
    </div>
  );
};

export default SteelConnectionDesignTool;