import React, { useState } from 'react';
import './BeamCalculator.css'; // Import the CSS file for styling

const BeamCalculator = () => {
  const [length, setLength] = useState('');
  const [loads, setLoads] = useState([{ type: 'udl', value: '', location: '' }]);
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
    setLoads([...loads, { type: 'udl', value: '', location: '' }]);
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
      if (isNaN(parseFloat(load.value)) || parseFloat(load.value) <= 0) {
        alert(`Please enter a valid positive number for Load ${i + 1} Value.`);
        return false;
      }
      if (load.type === 'point-load') {
        if (isNaN(parseFloat(load.location)) || parseFloat(load.location) <= 0 || parseFloat(load.location) > parseFloat(length)) {
          alert(`Please enter a valid Load Location for Load ${i + 1} (must be between 0 and Length of Beam).`);
          return false;
        }
      }
    }
    return true;
  };

  const calculate = (e) => {
    e.preventDefault();

    if (!validateInputs()) {
      return;
    }

    const lengthNum = parseFloat(length); // in meters
    const ENum = parseFloat(E) * 1e6; // Convert GPa to kN/m²
    const INum = parseFloat(I) * 1e-8; // Convert cm^4 to m^4

    let totalMoment = 0;
    let totalShear = 0;
    let totalDeflection = 0;

    loads.forEach((load) => {
      const loadValue = parseFloat(load.value);
      const loadLocation = parseFloat(load.location);

      if (load.type === 'udl') {
        // UDL
        if (supportType === 'simply-supported') {
          totalMoment += (loadValue * Math.pow(lengthNum, 2)) / 8;
          totalShear += (loadValue * lengthNum) / 2;
          totalDeflection += (5 * loadValue * Math.pow(lengthNum, 4)) / (384 * ENum * INum);
        } else if (supportType === 'cantilever') {
          totalMoment += (loadValue * Math.pow(lengthNum, 2)) / 2;
          totalShear += loadValue * lengthNum;
          totalDeflection += (loadValue * Math.pow(lengthNum, 4)) / (8 * ENum * INum);
        } else if (supportType === 'fixed') {
          totalMoment += (loadValue * Math.pow(lengthNum, 2)) / 12;
          totalShear += (loadValue * lengthNum) / 2;
          totalDeflection += (loadValue * Math.pow(lengthNum, 4)) / (384 * ENum * INum);
        }
      } else if (load.type === 'point-load') {
        // Point Load
        if (supportType === 'simply-supported') {
          totalMoment += (loadValue * loadLocation * (lengthNum - loadLocation)) / lengthNum;
          totalShear += loadValue / 2;
          totalDeflection += (loadValue * loadLocation * Math.pow(lengthNum - loadLocation, 2)) / (48 * ENum * INum);
        } else if (supportType === 'cantilever') {
          totalMoment += loadValue * loadLocation;
          totalShear += loadValue;
          totalDeflection += (loadValue * Math.pow(loadLocation, 2) * (3 * lengthNum - loadLocation)) / (6 * ENum * INum);
        } else if (supportType === 'fixed') {
          totalMoment += (loadValue * loadLocation) / 8;
          totalShear += loadValue / 2;
          totalDeflection += (loadValue * Math.pow(lengthNum, 3)) / (192 * ENum * INum);
        }
      }
      // Additional load types like VDL and Triangular Load can be added here
    });

    setMoment(totalMoment);
    setShear(totalShear);
    setDeflection(totalDeflection * 1e3); // Convert meters to millimeters
  };

  return (
    <div className="beam-calculator">
      <h1>Beam Calculator</h1>
      <form onSubmit={calculate}>
        <div className="form-group">
          <label>Length of Beam (m):</label>
          <input
            type="number"
            step="0.01"
            value={length}
            onChange={(e) => setLength(e.target.value)}
            required
          />
        </div>
        {loads.map((load, index) => (
          <div key={index} className="load-group">
            <h3>Load {index + 1}</h3>
            <div className="form-group">
              <label>Load Type:</label>
              <select
                value={load.type}
                onChange={(e) => handleLoadChange(index, 'type', e.target.value)}
              >
                <option value="udl">Uniformly Distributed Load (UDL)</option>
                <option value="point-load">Point Load</option>
                {/* Add more load types if needed */}
              </select>
            </div>
            <div className="form-group">
              <label>Load Value (kN or kN/m):</label>
              <input
                type="number"
                step="0.01"
                value={load.value}
                onChange={(e) => handleLoadChange(index, 'value', e.target.value)}
                required
              />
            </div>
            {load.type === 'point-load' && (
              <div className="form-group">
                <label>Load Location (m):</label>
                <input
                  type="number"
                  step="0.01"
                  value={load.location}
                  onChange={(e) => handleLoadChange(index, 'location', e.target.value)}
                  required
                />
              </div>
            )}
            <button type="button" onClick={() => removeLoad(index)}>
              Remove Load
            </button>
          </div>
        ))}
        <button type="button" onClick={addLoad}>
          Add Load
        </button>
        <div className="form-group">
          <label>Support Type:</label>
          <select value={supportType} onChange={(e) => setSupportType(e.target.value)}>
            <option value="simply-supported">Simply Supported</option>
            <option value="cantilever">Cantilever</option>
            <option value="fixed">Fixed</option>
          </select>
        </div>
        <div className="form-group">
          <label>Elastic Modulus (E) in GPa:</label>
          <input
            type="number"
            step="0.1"
            value={E}
            onChange={(e) => setE(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Moment of Inertia (I) in cm⁴:</label>
          <input
            type="number"
            step="1"
            value={I}
            onChange={(e) => setI(e.target.value)}
            required
          />
        </div>
        <button type="submit">Calculate</button>
      </form>
      {moment !== null && (
        <div className="results">
          <h2>Results</h2>
          <p>Bending Moment: {moment.toFixed(2)} kNm</p>
          <p>Shear Force: {shear.toFixed(2)} kN</p>
          <p>Deflection: {deflection.toFixed(2)} mm</p>
        </div>
      )}
    </div>
  );
};

export default BeamCalculator;