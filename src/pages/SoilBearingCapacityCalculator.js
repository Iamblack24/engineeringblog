// src/pages/SoilBearingCapacityCalculator.js
import React, { useState } from 'react';
import './SoilBearingCapacityCalculator.css'; // Import the CSS file for styling

const SoilBearingCapacityCalculator = () => {
  // State Variables
  const [soilType, setSoilType] = useState('');
  const [c, setC] = useState(''); // Cohesion
  const [phi, setPhi] = useState(''); // Angle of Internal Friction
  const [gamma, setGamma] = useState(''); // Unit Weight of Soil
  const [D, setD] = useState(''); // Foundation Depth
  const [B, setB] = useState(''); // Foundation Width
  const [FS, setFS] = useState(''); // Factor of Safety
  const [results, setResults] = useState(null);

  // Calculation Function
  const calculateBearingCapacity = (e) => {
    e.preventDefault();

    // Convert inputs to numbers
    const cNum = parseFloat(c);
    const phiNum = parseFloat(phi);
    const gammaNum = parseFloat(gamma);
    const DNum = parseFloat(D);
    const BNum = parseFloat(B);
    const FSNum = parseFloat(FS);

    // Validate inputs
    if (
      !soilType ||
      isNaN(cNum) ||
      isNaN(phiNum) ||
      isNaN(gammaNum) ||
      isNaN(DNum) ||
      isNaN(BNum) ||
      isNaN(FSNum) ||
      phiNum <= 0 ||
      FSNum <= 1
    ) {
      alert('Please enter valid inputs. Ensure that φ > 0 and FS > 1.');
      return;
    }

    // Calculate Bearing Capacity Factors based on phi
    const bearingCapacityFactors = calculateBearingCapacityFactors(phiNum);
    const { Nc, Nq, Ngamma } = bearingCapacityFactors;

    // Calculate Ultimate Bearing Capacity (q_ult)
    const q_ult = (cNum * Nc) + (gammaNum * DNum * Nq) + (0.5 * gammaNum * BNum * Ngamma);

    // Calculate Allowable Bearing Capacity (q_allow)
    const q_allow = q_ult / FSNum;

    setResults({
      q_ult: q_ult.toFixed(2),
      q_allow: q_allow.toFixed(2),
      Nc: Nc.toFixed(2),
      Nq: Nq.toFixed(2),
      Ngamma: Ngamma.toFixed(2),
    });
  };

  // Function to calculate bearing capacity factors based on phi
  const calculateBearingCapacityFactors = (phi) => {
    // Convert phi to radians for trigonometric functions
    const phiRad = (phi * Math.PI) / 180;

    // Calculate Nq and Nc using standard formulas
    const Nq = Math.exp(Math.PI * Math.tan(phiRad)) * (Math.tan(45 + phi / 2)) ** 2;
    const Nc = (Nq - 1) / Math.tan(phiRad);
    const Ngamma = 2 * (Nq + 1) * Math.tan(phiRad);

    return { Nc, Nq, Ngamma };
  };

  return (
    <div className="soil-bearing-capacity-calculator">
      <h1>Soil Bearing Capacity Calculator</h1>
      <form onSubmit={calculateBearingCapacity}>
        <div className="form-group">
          <label>Soil Type:</label>
          <select
            value={soilType}
            onChange={(e) => setSoilType(e.target.value)}
            required
          >
            <option value="">Select Soil Type</option>
            <option value="clay">Clay</option>
            <option value="silt">Silt</option>
            <option value="sand">Sand</option>
            <option value="gravel">Gravel</option>
            <option value="rock">Rock</option>
          </select>
        </div>
        <div className="form-group">
          <label>Cohesion (c) [kN/m²]:</label>
          <input
            type="number"
            step="0.01"
            value={c}
            onChange={(e) => setC(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Angle of Internal Friction (φ) [degrees]:</label>
          <input
            type="number"
            step="0.1"
            value={phi}
            onChange={(e) => setPhi(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Unit Weight of Soil (γ) [kN/m³]:</label>
          <input
            type="number"
            step="0.1"
            value={gamma}
            onChange={(e) => setGamma(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Foundation Depth (D) [m]:</label>
          <input
            type="number"
            step="0.01"
            value={D}
            onChange={(e) => setD(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Foundation Width (B) [m]:</label>
          <input
            type="number"
            step="0.01"
            value={B}
            onChange={(e) => setB(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Factor of Safety (FS):</label>
          <input
            type="number"
            step="0.1"
            value={FS}
            onChange={(e) => setFS(e.target.value)}
            required
          />
        </div>
        <button type="submit">Calculate</button>
      </form>
      {results && (
        <div className="results">
          <h2>Calculation Results</h2>
          <p>
            <strong>Soil Type:</strong> {soilType.charAt(0).toUpperCase() + soilType.slice(1)}
          </p>
          <p>
            <strong>Ultimate Bearing Capacity (q<sub>ult</sub>):</strong> {results.q_ult} kN/m²
          </p>
          <p>
            <strong>Allowable Bearing Capacity (q<sub>allow</sub>):</strong> {results.q_allow} kN/m²
          </p>
          <p>
            <strong>Bearing Capacity Factors:</strong>
          </p>
          <ul>
            <li>
              <strong>N<sub>c</sub>:</strong> {results.Nc}
            </li>
            <li>
              <strong>N<sub>q</sub>:</strong> {results.Nq}
            </li>
            <li>
              <strong>N<sub>γ</sub>:</strong> {results.Ngamma}
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default SoilBearingCapacityCalculator;