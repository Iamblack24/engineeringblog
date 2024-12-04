import React, { useState } from 'react';
import './BeamCalculator.css'; // Import the CSS file for styling

const BeamCalculator = () => {
  const [length, setLength] = useState('');
  const [loads, setLoads] = useState([{ type: 'point', position: 0, magnitude: 0, startPosition: 0, endPosition: 0 }]);
  const [supportType, setSupportType] = useState('simply-supported'); // Simply Supported by default
  const [E, setE] = useState(210); // Default E = 210 GPa
  const [I, setI] = useState(10000); // Default I = 10000 cm^4
  const [moment, setMoment] = useState(null);
  const [shear, setShear] = useState(null);
  const [deflection, setDeflection] = useState(null);

  const handleLoadChange = (index, field, value) => {
    const newLoads = [...loads];
    newLoads[index][field] = value;
    setLoads(newLoads);
  };

  const addLoad = () => {
    setLoads([...loads, { type: 'point', position: 0, magnitude: 0, startPosition: 0, endPosition: 0 }]);
  };

  const removeLoad = (index) => {
    const newLoads = loads.filter((_, i) => i !== index);
    setLoads(newLoads);
  };

  const validateInputs = () => {
    if (isNaN(parseFloat(length)) || parseFloat(length) <= 0) {
      alert('Please enter a valid positive number for Length of Beam.');
      return false;
    }
    if (isNaN(parseFloat(E)) || parseFloat(E) <= 0) {
      alert('Please enter a valid positive number for Elastic Modulus (E).');
      return false;
    }
    if (isNaN(parseFloat(I)) || parseFloat(I) <= 0) {
      alert('Please enter a valid positive number for Moment of Inertia (I).');
      return false;
    }
    for (let i = 0; i < loads.length; i++) {
      const load = loads[i];
      if (isNaN(parseFloat(load.magnitude)) || parseFloat(load.magnitude) <= 0) {
        alert(`Please enter a valid positive number for Load Magnitude at Load ${i + 1}.`);
        return false;
      }
      if (load.type === 'point' && (isNaN(parseFloat(load.position)) || parseFloat(load.position) < 0 || parseFloat(load.position) > parseFloat(length))) {
        alert(`Please enter a valid position for Point Load at Load ${i + 1}.`);
        return false;
      }
      if (load.type === 'udl' && (isNaN(parseFloat(load.startPosition)) || parseFloat(load.startPosition) < 0 || parseFloat(load.startPosition) > parseFloat(length) || isNaN(parseFloat(load.endPosition)) || parseFloat(load.endPosition) < 0 || parseFloat(load.endPosition) > parseFloat(length) || parseFloat(load.startPosition) >= parseFloat(load.endPosition))) {
        alert(`Please enter valid start and end positions for UDL at Load ${i + 1}.`);
        return false;
      }
    }
    return true;
  };

  const calculateResults = () => {
    if (!validateInputs()) {
      return;
    }

    const shearForces = [];
    const bendingMoments = [];
    const deflections = [];

    // Enhanced formulas for shear, moment, and deflection based on support types and loads
    loads.forEach(load => {
      if (supportType === 'simply-supported') {
        if (load.type === 'point') {
          const R1 = (load.magnitude * (length - load.position)) / length;
          const R2 = (load.magnitude * load.position) / length;

          shearForces.push({ position: 0, value: R1 });
          shearForces.push({ position: load.position, value: -load.magnitude });
          shearForces.push({ position: length, value: R2 });

          bendingMoments.push({ position: load.position, value: R1 * load.position });

          const delta = (load.magnitude * Math.pow(load.position, 3)) / (3 * E * I);
          deflections.push({ position: load.position, value: delta });
        } else if (load.type === 'udl') {
          const w = load.magnitude;
          const a = load.startPosition;
          const b = load.endPosition;
          const L = parseFloat(length);

          const totalLoad = w * (b - a);
          const R1 = (totalLoad * (L - (a + b) / 2)) / L;
          const R2 = (totalLoad * (a + b) / 2) / L;

          shearForces.push({ position: a, value: R1 });
          shearForces.push({ position: b, value: -totalLoad });
          shearForces.push({ position: length, value: R2 });

          bendingMoments.push({ position: (a + b) / 2, value: R1 * ((a + b) / 2) - (w * Math.pow(b - a, 2)) / 8 });

          const delta = (5 * w * Math.pow(b - a, 4)) / (384 * E * I);
          deflections.push({ position: (a + b) / 2, value: delta });
        }
      } else if (supportType === 'cantilever') {
        if (load.type === 'point') {
          const R = load.magnitude;
          const M = load.magnitude * load.position;

          shearForces.push({ position: 0, value: R });
          shearForces.push({ position: load.position, value: -R });

          bendingMoments.push({ position: load.position, value: M });

          const delta = (load.magnitude * Math.pow(load.position, 3)) / (3 * E * I);
          deflections.push({ position: load.position, value: delta });
        } else if (load.type === 'udl') {
          const w = load.magnitude;
          const a = load.startPosition;
          const b = load.endPosition;

          const totalLoad = w * (b - a);
          const R = totalLoad;
          const M = (totalLoad * (b - a)) / 2;

          shearForces.push({ position: a, value: R });
          shearForces.push({ position: b, value: -totalLoad });

          bendingMoments.push({ position: (a + b) / 2, value: M });

          const delta = (w * Math.pow(b - a, 4)) / (8 * E * I);
          deflections.push({ position: (a + b) / 2, value: delta });
        }
      } else if (supportType === 'fixed') {
        if (load.type === 'point') {
          const R1 = (load.magnitude * (length - load.position)) / length;
          const R2 = (load.magnitude * load.position) / length;
          const M1 = R2 * load.position;
          const M2 = R1 * (length - load.position);

          shearForces.push({ position: 0, value: R1 });
          shearForces.push({ position: load.position, value: -load.magnitude });
          shearForces.push({ position: length, value: R2 });

          bendingMoments.push({ position: 0, value: M1 });
          bendingMoments.push({ position: length, value: M2 });

          const delta = (load.magnitude * Math.pow(load.position, 3)) / (3 * E * I);
          deflections.push({ position: load.position, value: delta });
        } else if (load.type === 'udl') {
          const w = load.magnitude;
          const a = load.startPosition;
          const b = load.endPosition;
          const L = parseFloat(length);

          const totalLoad = w * (b - a);
          const R1 = (totalLoad * (L - (a + b) / 2)) / L;
          const R2 = (totalLoad * (a + b) / 2) / L;
          const M1 = R2 * (a + b) / 2;
          const M2 = R1 * (L - (a + b) / 2);

          shearForces.push({ position: a, value: R1 });
          shearForces.push({ position: b, value: -totalLoad });
          shearForces.push({ position: length, value: R2 });

          bendingMoments.push({ position: 0, value: M1 });
          bendingMoments.push({ position: length, value: M2 });

          const delta = (5 * w * Math.pow(b - a, 4)) / (384 * E * I);
          deflections.push({ position: (a + b) / 2, value: delta });
        }
      }
    });

    setShear(shearForces);
    setMoment(bendingMoments);
    setDeflection(deflections);
  };

  return (
    <div className="beam-calculator">
      <h1>Beam Calculator</h1>
      <div className="form-group">
        <label>Beam Length (m):</label>
        <input
          type="number"
          step="0.01"
          value={length}
          onChange={(e) => setLength(e.target.value)}
          required
        />
      </div>
      <div className="form-group">
        <label>Support Type:</label>
        <select value={supportType} onChange={(e) => setSupportType(e.target.value)}>
          <option value="simply-supported">Simply Supported</option>
          <option value="cantilever">Cantilever</option>
          <option value="fixed">Fixed</option>
        </select>
      </div>
      <div className="form-group">
        <label>Young's Modulus (GPa):</label>
        <input
          type="number"
          step="0.01"
          value={E}
          onChange={(e) => setE(e.target.value)}
          required
        />
      </div>
      <div className="form-group">
        <label>Moment of Inertia (cm^4):</label>
        <input
          type="number"
          step="0.01"
          value={I}
          onChange={(e) => setI(e.target.value)}
          required
        />
      </div>
      {loads.map((load, index) => (
        <div key={index} className="load-form">
          <div className="form-group">
            <label>Load Type:</label>
            <select
              value={load.type}
              onChange={(e) => handleLoadChange(index, 'type', e.target.value)}
            >
              <option value="point">Point Load</option>
              <option value="udl">Uniformly Distributed Load (UDL)</option>
            </select>
          </div>
          <div className="form-group">
            <label>Magnitude (kN):</label>
            <input
              type="number"
              step="0.01"
              value={load.magnitude}
              onChange={(e) => handleLoadChange(index, 'magnitude', e.target.value)}
              required
            />
          </div>
          {load.type === 'point' && (
            <div className="form-group">
              <label>Load Position (m):</label>
              <input
                type="number"
                step="0.01"
                value={load.position}
                onChange={(e) => handleLoadChange(index, 'position', e.target.value)}
                required
              />
            </div>
          )}
          {load.type === 'udl' && (
            <>
              <div className="form-group">
                <label>Start Position (m):</label>
                <input
                  type="number"
                  step="0.01"
                  value={load.startPosition}
                  onChange={(e) => handleLoadChange(index, 'startPosition', e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>End Position (m):</label>
                <input
                  type="number"
                  step="0.01"
                  value={load.endPosition}
                  onChange={(e) => handleLoadChange(index, 'endPosition', e.target.value)}
                  required
                />
              </div>
            </>
          )}
          <button onClick={() => removeLoad(index)}>Remove Load</button>
        </div>
      ))}
      <button onClick={addLoad}>Add Load</button>
      <button onClick={calculateResults}>Calculate</button>
      {shear && <div className="results"><h2>Shear Forces:</h2> <p>{JSON.stringify(shear)}</p></div>}
      {moment && <div className="results"><h2>Bending Moments:</h2> <p>{JSON.stringify(moment)}</p></div>}
      {deflection && <div className="results"><h2>Deflections:</h2> <p>{JSON.stringify(deflection)}</p></div>}
    </div>
  );
};

export default BeamCalculator;
