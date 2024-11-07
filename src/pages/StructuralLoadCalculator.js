// src/pages/StructuralLoadCalculator.js
import React, { useState } from 'react';
import './StructuralLoadCalculator.css';
import CanvasJSReact from '../assets/canvasjs.react'; // Ensure the path is correct

const CanvasJSChart = CanvasJSReact.CanvasJSChart;

const StructuralLoadCalculator = () => {
  // State variables for beam configuration, loads, and results
  const [beamLength, setBeamLength] = useState('');
  const [supportType, setSupportType] = useState('simply-supported');
  const [overhangLength, setOverhangLength] = useState('');
  const [loads, setLoads] = useState([]);
  const [loadType, setLoadType] = useState('point');
  const [loadValue, setLoadValue] = useState('');
  const [loadStart, setLoadStart] = useState('');
  const [loadEnd, setLoadEnd] = useState('');
  const [results, setResults] = useState(null);
  const [reactions, setReactions] = useState(null);

  // Adds a load to the loads array with validation
  const addLoad = () => {
    const value = parseFloat(loadValue);
    const start = parseFloat(loadStart);
    const end = loadType === 'udl' ? parseFloat(loadEnd) : null;
    const L = parseFloat(beamLength);
    const OH = supportType === 'overhanging' ? parseFloat(overhangLength) : 0;
    const totalBeamLength = L + OH;

    // Input Validation
    if (isNaN(value) || isNaN(start) || (loadType === 'udl' && isNaN(end))) {
      alert('Please enter valid load values and positions.');
      return;
    }

    if (loadType === 'udl' && end <= start) {
      alert('End position must be greater than start position for UDL.');
      return;
    }

    // Determine maximum allowable position based on support type
    const maxPosition = supportType === 'overhanging' ? totalBeamLength : L;

    if (start > maxPosition || (loadType === 'udl' && end > maxPosition)) {
      alert(`Load position must be within beam length (${maxPosition} m).`);
      return;
    }

    // Create new load object
    const newLoad = {
      type: loadType,
      value: value,
      start: start,
      end: end,
    };

    // Add new load to the loads array
    setLoads([...loads, newLoad]);

    // Reset load input fields
    setLoadValue('');
    setLoadStart('');
    setLoadEnd('');
  };

  // Removes a load from the loads array
  const removeLoad = (index) => {
    const updatedLoads = [...loads];
    updatedLoads.splice(index, 1);
    setLoads(updatedLoads);
  };

  // Calculates reactions and internal forces
  const calculateResults = (e) => {
    e.preventDefault();

    const L = parseFloat(beamLength);
    if (isNaN(L) || L <= 0) {
      alert('Please enter a valid beam length.');
      return;
    }

    const OH = supportType === 'overhanging' ? parseFloat(overhangLength) : 0;
    const totalBeamLength = L + OH;

    if (supportType === 'overhanging' && isNaN(OH)) {
      alert('Please enter a valid overhang length.');
      return;
    }

    if (supportType === 'overhanging' && OH < 0) {
      alert('Overhang length must be a positive number.');
      return;
    }

    // Initialize a local array to hold all loads (added + pending)
    let allLoads = [...loads];

    // Check if there are pending load inputs
    if (
      loadValue !== '' &&
      loadStart !== '' &&
      (loadType === 'point' || (loadType === 'udl' && loadEnd !== ''))
    ) {
      const value = parseFloat(loadValue);
      const start = parseFloat(loadStart);
      const end = loadType === 'udl' ? parseFloat(loadEnd) : null;

      // Validate the entered load
      if (isNaN(value) || isNaN(start) || (loadType === 'udl' && isNaN(end))) {
        alert('Please enter valid load values and positions.');
        return;
      }

      if (loadType === 'udl' && end <= start) {
        alert('End position must be greater than start position for UDL.');
        return;
      }

      // Determine maximum allowable position based on support type
      const maxPosition = supportType === 'overhanging' ? totalBeamLength : L;

      if (start > maxPosition || (loadType === 'udl' && end > maxPosition)) {
        alert(`Load position must be within beam length (${maxPosition} m).`);
        return;
      }

      // Add the pending load to the local allLoads array
      allLoads.push({
        type: loadType,
        value: value,
        start: start,
        end: end,
      });

      // Reset load input fields
      setLoadValue('');
      setLoadStart('');
      setLoadEnd('');
    }

    if (allLoads.length === 0) {
      alert('Please add at least one load before calculating.');
      return;
    }

    // Calculate total load and moment about Support A
    let totalLoad = 0;
    let totalMomentA = 0;

    allLoads.forEach((load) => {
      if (load.type === 'point') {
        totalLoad += load.value;
        totalMomentA += load.value * load.start;
      } else if (load.type === 'udl') {
        const w = load.value;
        const a = load.start;
        const b = load.end;
        const udlTotal = w * (b - a);
        const udlCentroid = (a + b) / 2;
        totalLoad += udlTotal;
        totalMomentA += udlTotal * udlCentroid;
      }
    });

    // Calculate reactions based on support type
    let RA = 0;
    let RB = 0;

    if (supportType === 'simply-supported') {
      RB = totalMomentA / L;
      RA = totalLoad - RB;
    } else if (supportType === 'overhanging') {
      RB = totalMomentA / L;
      RA = totalLoad - RB;
    } else if (supportType === 'cantilever') {
      RA = totalLoad;
      RB = 0;
    }

    setReactions({
      RA: RA.toFixed(2),
      RB: supportType !== 'cantilever' ? RB.toFixed(2) : '0.00',
    });

    // Calculate Shear Force and Bending Moment
    const shearForce = [];
    const bendingMoment = [];
    const numPoints = 200; // Increased for better resolution
    const dx = totalBeamLength / (numPoints - 1);

    for (let i = 0; i < numPoints; i++) {
      const x = parseFloat((i * dx).toFixed(4));
      let V = RA;
      let M = RA * x;

      // Apply loads
      allLoads.forEach((load) => {
        if (load.type === 'point' && x >= load.start) {
          V -= load.value;
          M -= load.value * (x - load.start);
        } else if (load.type === 'udl') {
          const w = load.value;
          const a = load.start;
          const b = load.end;

          if (x >= a && x <= b) {
            const span = x - a;
            V -= w * span;
            M -= (w * Math.pow(span, 2)) / 2;
          } else if (x > b) {
            const span = b - a;
            V -= w * span;
            M -= w * span * (x - (a + b) / 2);
          }
        }
      });

      shearForce.push({ x: x, y: parseFloat(V.toFixed(2)) });
      bendingMoment.push({ x: x, y: parseFloat(M.toFixed(2)) });
    }

    setResults({
      shearForce,
      bendingMoment,
    });
  };

  // Resets all input fields and results
  const resetCalculator = () => {
    setBeamLength('');
    setSupportType('simply-supported');
    setOverhangLength('');
    setLoads([]);
    setLoadType('point');
    setLoadValue('');
    setLoadStart('');
    setLoadEnd('');
    setResults(null);
    setReactions(null);
  };

  return (
    <div className="structural-load-calculator">
      <h1>Structural Load Calculator</h1>
      <form onSubmit={calculateResults}>
        {/* Beam Length Input */}
        <div className="form-group">
          <label title="Beam length in meters. Must be a positive number.">Beam Length (m):</label>
          <input
            type="number"
            step="0.01"
            value={beamLength}
            onChange={(e) => setBeamLength(e.target.value)}
            required
          />
        </div>

        {/* Support Type Selection */}
        <div className="form-group">
          <label title="Select the type of support for the beam.">Support Type:</label>
          <select value={supportType} onChange={(e) => setSupportType(e.target.value)}>
            <option value="simply-supported">Simply Supported</option>
            <option value="cantilever">Cantilever</option>
            <option value="overhanging">Overhanging</option>
          </select>
        </div>

        {/* Overhang Length Input (Conditional) */}
        {supportType === 'overhanging' && (
          <div className="form-group">
            <label title="Length of the overhang in meters. Must be a positive number.">Overhang Length (m):</label>
            <input
              type="number"
              step="0.01"
              value={overhangLength}
              onChange={(e) => setOverhangLength(e.target.value)}
              required
            />
          </div>
        )}

        {/* Load Addition Section */}
        <h3>Add Loads</h3>
        <div className="form-group">
          <label title="Select the type of load to add.">Load Type:</label>
          <select value={loadType} onChange={(e) => setLoadType(e.target.value)}>
            <option value="point">Point Load</option>
            <option value="udl">UDL (Uniformly Distributed Load)</option>
          </select>
        </div>

        {/* Load Value Input */}
        <div className="form-group">
          <label title={loadType === 'point' ? "Load value in kN." : "Load intensity in kN/m."}>
            {loadType === 'point' ? 'Load Value (kN):' : 'Load Intensity (kN/m):'}
          </label>
          <input
            type="number"
            step="0.01"
            value={loadValue}
            onChange={(e) => setLoadValue(e.target.value)}
            required
          />
        </div>

        {/* Load Position Inputs */}
        <div className="form-group">
          <label title={loadType === 'point' ? "Position of the point load in meters." : "Start position of the UDL in meters."}>
            {loadType === 'point' ? 'Position (m):' : 'Start Position (m):'}
          </label>
          <input
            type="number"
            step="0.01"
            value={loadStart}
            onChange={(e) => setLoadStart(e.target.value)}
            required
          />
        </div>

        {loadType === 'udl' && (
          <div className="form-group">
            <label title="End position of the UDL in meters. Must be greater than start position.">End Position (m):</label>
            <input
              type="number"
              step="0.01"
              value={loadEnd}
              onChange={(e) => setLoadEnd(e.target.value)}
              required
            />
          </div>
        )}

        {/* Add Load Button */}
        <button type="button" onClick={addLoad}>
          Add Load
        </button>

        {/* Display Added Loads */}
        <h3>Loads Added:</h3>
        {loads.length === 0 ? (
          <p>No loads added yet.</p>
        ) : (
          <ul>
            {loads.map((load, index) => (
              <li key={index}>
                {load.type === 'point'
                  ? `Point Load: ${load.value} kN at ${load.start} m`
                  : `UDL: ${load.value} kN/m from ${load.start} m to ${load.end} m`}
                <button type="button" onClick={() => removeLoad(index)}>
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Calculate and Reset Buttons */}
        <button type="submit">Calculate</button>
        <button type="button" onClick={resetCalculator}>
          Reset
        </button>
      </form>

      {/* Display Reactions */}
      {reactions && (
        <div className="results">
          <h2>Reactions at Supports</h2>
          <p>
            <strong>Reaction at A (RA):</strong> {reactions.RA} kN
          </p>
          {supportType !== 'cantilever' && (
            <p>
              <strong>Reaction at B (RB):</strong> {reactions.RB} kN
            </p>
          )}
        </div>
      )}

      {/* Display Shear Force and Bending Moment Diagrams */}
      {results && (
        <div className="results">
          <h2>Shear Force Diagram</h2>
          <CanvasJSChart
            options={{
              title: { text: 'Shear Force Diagram' },
              axisX: { title: 'Position (m)', includeZero: true },
              axisY: { title: 'Shear Force (kN)', includeZero: true },
              data: [
                {
                  type: 'line',
                  markerSize: 0,
                  dataPoints: results.shearForce,
                },
              ],
            }}
          />
          <h2>Bending Moment Diagram</h2>
          <CanvasJSChart
            options={{
              title: { text: 'Bending Moment Diagram' },
              axisX: { title: 'Position (m)', includeZero: true },
              axisY: { title: 'Bending Moment (kN·m)', includeZero: true },
              data: [
                {
                  type: 'line',
                  markerSize: 0,
                  dataPoints: results.bendingMoment,
                },
              ],
            }}
          />
        </div>
      )}
    </div>
  );
};

export default StructuralLoadCalculator;