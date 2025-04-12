import React, { useState } from 'react';
import './SteelConnectionDesignTool.css'; // Import the CSS file for styling

const SteelConnectionDesignTool = () => {
  const [inputValues, setInputValues] = useState({
    connectionType: '',
    // Bolted
    boltDiameter: '20',
    boltGrade: '8.8',
    numBolts: '4',
    numShearPlanes: '1', // New: Single shear default
    plateThickness: '10', // New: Plate thickness (mm)
    plateFu: '410', // New: Plate ultimate strength (MPa)
    // Welded
    weldSize: '6',
    weldLength: '100',
    weldFu: '485', // New: Weld electrode strength (MPa, e.g., E70xx)
    // General
    appliedLoad: '100',
  });

  const [result, setResult] = useState(null);
  const [error, setError] = useState(''); // New: Error state

  const handleChange = (e) => {
    const { name, value } = e.target;
    setInputValues((prevValues) => ({
      ...prevValues,
      [name]: value,
    }));
  };

  const handleCalculate = () => {
    setResult(null); // Clear previous results
    setError(''); // Clear previous errors

    const {
      connectionType,
      // Bolted
      boltDiameter, boltGrade, numBolts, numShearPlanes,
      plateThickness, plateFu,
      // Welded
      weldSize, weldLength, weldFu,
      // General
      appliedLoad, // This is local to handleCalculate
    } = inputValues;

    // --- Input validation ---
    const load = parseFloat(appliedLoad); // Use the local variable here
    if (!connectionType || isNaN(load) || load <= 0) {
      setError('Please select a connection type and enter a valid positive Applied Load.');
      return;
    }

    let capacity = 0;
    let boltShearCapacity = null;
    let boltBearingCapacity = null;
    let weldShearCapacity = null;

    if (connectionType === 'bolted') {
      const d = parseFloat(boltDiameter);
      const grade = parseFloat(boltGrade);
      const n = parseInt(numBolts);
      const m = parseInt(numShearPlanes); // Number of shear planes
      const tp = parseFloat(plateThickness); // Plate thickness
      const fu_plate = parseFloat(plateFu); // Plate Fu

      if (isNaN(d) || d <= 0 || isNaN(grade) || grade <= 0 || isNaN(n) || n <= 0 || isNaN(m) || m <= 0 || isNaN(tp) || tp <= 0 || isNaN(fu_plate) || fu_plate <= 0) {
        setError('Please fill in all bolt and plate details with valid positive numbers.');
        return;
      }

      // --- Bolt Shear Capacity (Simplified) ---
      // Note: Assumes threads are NOT excluded from shear plane (conservative use of gross area A)
      // Note: Does not include code-specific safety/resistance factors (phi/gamma_M)
      const A = (Math.PI * d * d) / 4; // Bolt gross area in mm²
      const fub = grade * 100; // Bolt ultimate tensile strength in MPa
      // Capacity per bolt per shear plane
      const singleBoltShearCapacityPlane = 0.6 * fub * A / 1000; // kN
      // Total shear capacity
      boltShearCapacity = singleBoltShearCapacityPlane * n * m; // kN

      // --- Bolt Bearing Capacity (Simplified - per bolt) ---
      // Note: Assumes standard holes and sufficient edge/end distances.
      // Using a simplified factor (e.g., 2.4 from AISC for sufficient edge distance, could be 1.2*Le/d etc.)
      // This factor can vary significantly based on code and geometry. Using 2.0 as a generic simplification.
      // Note: Does not include code-specific safety/resistance factors (phi/gamma_M)
      const bearingFactor = 2.0; // Simplified factor
      const singleBoltBearingCapacity = bearingFactor * d * tp * fu_plate / 1000; // kN per bolt
      // Total bearing capacity (governed by the total thickness of plates bearing in one direction)
      // Simplification: Assume total bearing is limited by the capacity of 'n' bolts on the given thickness 'tp'.
      boltBearingCapacity = singleBoltBearingCapacity * n; // kN

      // Governing capacity is the minimum of shear and bearing
      capacity = Math.min(boltShearCapacity, boltBearingCapacity);

    } else if (connectionType === 'welded') {
      const a = parseFloat(weldSize); // mm
      const l = parseFloat(weldLength); // mm
      const fu_weld = parseFloat(weldFu); // Weld electrode Fu (MPa)

      if (isNaN(a) || a <= 0 || isNaN(l) || l <= 0 || isNaN(fu_weld) || fu_weld <= 0) {
        setError('Please fill in all weld details with valid positive numbers.');
        return;
      }

      // --- Weld Shear Capacity (Simplified) ---
      // Note: Based on weld strength. Assumes base metal strength is sufficient.
      // Note: Does not include code-specific safety/resistance factors (phi/gamma_M) or correlation factors (beta_w).
      const throatArea = 0.707 * a * l; // mm² (per weld line)
      // Using a simplified shear strength = 0.6 * fu_weld (similar to AISC approach with phi=1)
      weldShearCapacity = 0.6 * fu_weld * throatArea / 1000; // kN (assuming one line of weld of length l)
      // If the input 'l' represents the TOTAL length of weld, use this directly.
      // If 'l' is per line and there are multiple lines, adjust accordingly. Assuming 'l' is total effective length here.

      capacity = weldShearCapacity;
    } else {
      setError('Invalid connection type selected.');
      return;
    }

    // --- Safety Factor ---
    const safetyFactor = capacity / load; // Use the local 'load' variable

    setResult({
      capacity: capacity.toFixed(2),
      safetyFactor: safetyFactor.toFixed(2),
      boltShearCapacity: boltShearCapacity?.toFixed(2), // Store intermediate results
      boltBearingCapacity: boltBearingCapacity?.toFixed(2), // Store intermediate results
      weldShearCapacity: weldShearCapacity?.toFixed(2), // Store intermediate results
      connectionType: connectionType, // Pass type to results for display logic
    });
  };

  return (
    <div className="steel-connection-design-tool">
      <h1>Steel Connection Design Tool</h1>
      <p className="disclaimer">
        Note: Calculations are simplified for illustrative purposes and do not replace detailed design according to specific codes (e.g., AISC, Eurocode). Safety/resistance factors are not included. Bearing capacity assumes sufficient edge/end distances. Consult relevant standards.
      </p>
      <div className="form-group">
        <label htmlFor="connectionType">Connection Type:</label>
        <select
          id="connectionType" name="connectionType"
          value={inputValues.connectionType} onChange={handleChange} required
        >
          <option value="">Select Type</option>
          <option value="bolted">Bolted Connection</option>
          <option value="welded">Welded Connection</option>
        </select>
      </div>

      {/* Bolted Inputs */}
      {inputValues.connectionType === 'bolted' && (
        <fieldset>
          <legend>Bolted Connection Details</legend>
          <div className="form-group">
            <label htmlFor="boltDiameter">Bolt Diameter (d) [mm]:</label>
            <input type="number" id="boltDiameter" name="boltDiameter" value={inputValues.boltDiameter} onChange={handleChange} required placeholder="e.g., 20"/>
          </div>
          <div className="form-group">
            <label htmlFor="boltGrade">Bolt Grade (e.g., 8.8):</label>
            <input type="number" step="0.1" id="boltGrade" name="boltGrade" value={inputValues.boltGrade} onChange={handleChange} required placeholder="e.g., 8.8"/>
          </div>
          <div className="form-group">
            <label htmlFor="numBolts">Number of Bolts (n):</label>
            <input type="number" id="numBolts" name="numBolts" value={inputValues.numBolts} onChange={handleChange} required placeholder="e.g., 4"/>
          </div>
           <div className="form-group">
            <label htmlFor="numShearPlanes">Number of Shear Planes (m):</label>
            <input type="number" id="numShearPlanes" name="numShearPlanes" value={inputValues.numShearPlanes} onChange={handleChange} required placeholder="1 for single, 2 for double"/>
          </div>
           <div className="form-group">
            <label htmlFor="plateThickness">Plate Thickness (tp) [mm]:</label>
            <input type="number" id="plateThickness" name="plateThickness" value={inputValues.plateThickness} onChange={handleChange} required placeholder="Thickness of plate in bearing"/>
          </div>
           <div className="form-group">
            <label htmlFor="plateFu">Plate Ultimate Strength (Fu,plate) [MPa]:</label>
            <input type="number" id="plateFu" name="plateFu" value={inputValues.plateFu} onChange={handleChange} required placeholder="e.g., 410 for S275"/>
          </div>
        </fieldset>
      )}

      {/* Welded Inputs */}
      {inputValues.connectionType === 'welded' && (
        <fieldset>
           <legend>Welded Connection Details</legend>
          <div className="form-group">
            <label htmlFor="weldSize">Weld Leg Size (a) [mm]:</label>
            <input type="number" id="weldSize" name="weldSize" value={inputValues.weldSize} onChange={handleChange} required placeholder="Fillet weld leg size"/>
          </div>
          <div className="form-group">
            <label htmlFor="weldLength">Total Effective Weld Length (l) [mm]:</label>
            <input type="number" id="weldLength" name="weldLength" value={inputValues.weldLength} onChange={handleChange} required placeholder="Total length contributing"/>
          </div>
           <div className="form-group">
            <label htmlFor="weldFu">Weld Electrode Strength (Fu,weld) [MPa]:</label>
            <input type="number" id="weldFu" name="weldFu" value={inputValues.weldFu} onChange={handleChange} required placeholder="e.g., 485 for E70xx"/>
          </div>
        </fieldset>
      )}

      {/* General Inputs */}
       <fieldset>
           <legend>Loading</legend>
          <div className="form-group">
            <label htmlFor="appliedLoad">Applied Load (P) [kN]:</label>
            <input type="number" id="appliedLoad" name="appliedLoad" value={inputValues.appliedLoad} onChange={handleChange} required placeholder="Factored load"/>
          </div>
       </fieldset>

      {/* Error Display */}
      {error && <p className="error-message">{error}</p>}

      <button onClick={handleCalculate}>Calculate</button>

      {/* Results Display */}
      {result && !error && (
        <div className="result">
          <h2>Calculation Results</h2>
          {result.connectionType === 'bolted' && (
            <>
              <p>Bolt Shear Capacity (Total): {result.boltShearCapacity} kN</p>
              <p>Bolt Bearing Capacity (Total): {result.boltBearingCapacity} kN</p>
              <hr/>
            </>
          )}
           {result.connectionType === 'welded' && (
            <>
              <p>Weld Shear Capacity (Total): {result.weldShearCapacity} kN</p>
               <hr/>
            </>
          )}
          <p><strong>Governing Connection Capacity: {result.capacity} kN</strong></p>
          <p>Applied Load: {parseFloat(inputValues.appliedLoad).toFixed(2)} kN</p>
          <p><strong>Utilisation Ratio (Load / Capacity): {(parseFloat(inputValues.appliedLoad) / result.capacity).toFixed(2)}</strong></p>
          <p className={result.safetyFactor >= 1.0 ? 'safe' : 'unsafe'}>
            Status: {result.safetyFactor >= 1.0 ? 'OK' : 'FAIL'} (Capacity {result.safetyFactor >= 1.0 ? '≥' : '<'} Applied Load)
          </p>
          {/* <p>Safety Factor (Capacity / Load): {result.safetyFactor}</p> */}
        </div>
      )}
    </div>
  );
};

export default SteelConnectionDesignTool;