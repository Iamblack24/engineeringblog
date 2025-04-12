// src/pages/SoilBearingCapacityCalculator.js
import React, { useState, useEffect } from 'react'; // Import useEffect
import './SoilBearingCapacityCalculator.css'; // Import the CSS file for styling

// Define typical soil parameters (approximate ranges/defaults)
const typicalSoilParams = {
  clay: { c: { min: 15, max: 100, default: '30' }, phi: { min: 0, max: 20, default: '5' }, gamma: { min: 16, max: 20, default: '18' } },
  silt: { c: { min: 5, max: 30, default: '10' }, phi: { min: 20, max: 30, default: '25' }, gamma: { min: 17, max: 21, default: '19' } },
  sand: { c: { min: 0, max: 5, default: '0' }, phi: { min: 28, max: 40, default: '32' }, gamma: { min: 18, max: 22, default: '20' } },
  gravel: { c: { min: 0, max: 2, default: '0' }, phi: { min: 35, max: 45, default: '38' }, gamma: { min: 19, max: 23, default: '21' } },
  rock: { c: { min: 500, max: 5000, default: '1000' }, phi: { min: 30, max: 60, default: '45' }, gamma: { min: 24, max: 28, default: '26' } }, // Highly variable
};


const SoilBearingCapacityCalculator = () => {
  // Consolidate State Variables
  const [input, setInput] = useState({
    soilType: '',
    c: '', // Start empty, will be filled by selection
    phi: '', // Start empty
    gamma: '', // Start empty
    D: '1',
    B: '2',
    L: '3',
    Dw: '10',
    FS: '3',
  });
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [warnings, setWarnings] = useState([]); // State for parameter warnings

  // Handle Input Change - Updated
  const handleChange = (e) => {
    const { name, value } = e.target;

    setInput(prevInput => {
        const newInput = { ...prevInput, [name]: value };

        // If soilType changed, update defaults for c, phi, gamma
        if (name === 'soilType' && value && typicalSoilParams[value]) {
            const defaults = typicalSoilParams[value];
            newInput.c = defaults.c.default;
            newInput.phi = defaults.phi.default;
            newInput.gamma = defaults.gamma.default;
        }
        return newInput;
    });
  };

  // Calculation Function - Updated
  const calculateBearingCapacity = (e) => {
    e.preventDefault();
    setError(''); // Clear previous errors
    setWarnings([]); // Clear previous warnings
    setResults(null);

    // Convert inputs to numbers
    const cNum = parseFloat(input.c);
    const phiNum = parseFloat(input.phi);
    const gammaNum = parseFloat(input.gamma);
    const DNum = parseFloat(input.D);
    const BNum = parseFloat(input.B);
    const LNum = parseFloat(input.L);
    const DwNum = parseFloat(input.Dw);
    const FSNum = parseFloat(input.FS);

    // --- Input Validation (remains the same) ---
    if (
      !input.soilType ||
      isNaN(cNum) || isNaN(phiNum) || isNaN(gammaNum) ||
      isNaN(DNum) || isNaN(BNum) || isNaN(LNum) ||
      isNaN(DwNum) || isNaN(FSNum) ||
      phiNum < 0 || phiNum >= 90 || // phi range
      cNum < 0 || gammaNum <= 0 || DNum < 0 || BNum <= 0 || LNum <= 0 || DwNum < 0 || // Non-negative/positive checks
      FSNum <= 1
    ) {
      setError('Please enter valid inputs. Ensure γ, B, L > 0; c, D, Dw >= 0; 0 <= φ < 90; FS > 1.');
      return;
    }
     if (LNum < BNum) {
        setError('Foundation Length (L) must be greater than or equal to Width (B).');
        return;
    }

    // --- Parameter Range Warnings ---
    const currentWarnings = [];
    const params = typicalSoilParams[input.soilType];
    if (params) {
        if (cNum < params.c.min || cNum > params.c.max) {
            currentWarnings.push(`Warning: Cohesion (c'=${cNum}) is outside typical range [${params.c.min}-${params.c.max}] for ${input.soilType}.`);
        }
        if (phiNum < params.phi.min || phiNum > params.phi.max) {
            currentWarnings.push(`Warning: Friction Angle (φ'=${phiNum}) is outside typical range [${params.phi.min}-${params.phi.max}] for ${input.soilType}.`);
        }
        if (gammaNum < params.gamma.min || gammaNum > params.gamma.max) {
            currentWarnings.push(`Warning: Unit Weight (γ=${gammaNum}) is outside typical range [${params.gamma.min}-${params.gamma.max}] for ${input.soilType}.`);
        }
    }
    setWarnings(currentWarnings); // Set warnings even if calculation proceeds


    // --- Bearing Capacity Factors (Nc, Nq, Ngamma) ---
    // ... (calculation remains the same) ...
    let Nc, Nq, Ngamma;
    const phiRad = (phiNum * Math.PI) / 180;

    if (phiNum === 0) {
      Nc = 5.14;
      Nq = 1.0;
      Ngamma = 0.0;
    } else {
      const tanPhi = Math.tan(phiRad);
      const tan45PhiOver2Sq = Math.tan(Math.PI / 4 + phiRad / 2) ** 2; // tan^2(45 + phi/2)

      Nq = Math.exp(Math.PI * tanPhi) * tan45PhiOver2Sq;
      Nc = (Nq - 1) / tanPhi;
      Ngamma = (Nq - 1) * Math.tan(1.4 * phiRad);
    }

    // --- Shape Factors (Meyerhof, 1963) ---
    // ... (calculation remains the same) ...
    const B_over_L = BNum / LNum;
    const Kp = Math.tan(Math.PI / 4 + phiRad / 2) ** 2; // tan^2(45 + phi/2)

    let sc, sq, sgamma;
    if (phiNum === 0) {
        sc = 1 + 0.2 * B_over_L;
        sq = 1.0;
        sgamma = 1.0;
    } else {
        sq = 1 + B_over_L * Math.tan(phiRad);
        sc = 1 + 0.2 * Kp * B_over_L; // Corrected Meyerhof Sc for phi>0
        sgamma = sq; // Meyerhof: s_gamma = s_q for phi > 0
    }

    // --- Depth Factors (Meyerhof, 1963) ---
    // ... (calculation remains the same) ...
    let dc, dq, dgamma;
    const D_over_B = DNum / BNum;

    if (phiNum === 0) {
        dc = 1 + 0.2 * Math.sqrt(Kp) * D_over_B; // Corrected Meyerhof Dc for phi=0
        dq = 1.0;
        dgamma = 1.0;
    } else {
        dq = 1 + 0.1 * Math.sqrt(Kp) * D_over_B;
        dc = dq; // Meyerhof: d_c = d_q for phi > 0
        dgamma = dq; // Meyerhof: d_gamma = d_q for phi > 0
    }

    // --- Water Table Correction ---
    // ... (calculation remains the same) ...
    const gamma_w = 9.81; // Unit weight of water (kN/m³)
    let gamma_eff_q = gammaNum; // Effective unit weight for the Nq term (surcharge)
    let gamma_eff_gamma = gammaNum; // Effective unit weight for the Ngamma term (below base)

    // Correction for Nq term (gamma * D)
    if (DwNum < DNum) {
        const gamma_sub = Math.max(0, gammaNum - gamma_w);
        if (DwNum <= 0) {
             gamma_eff_q = gamma_sub;
        } else {
             gamma_eff_q = (gammaNum * DwNum + gamma_sub * (DNum - DwNum)) / DNum;
        }
    }

    // Correction for Ngamma term (0.5 * gamma * B)
    const depthBelowBase = DwNum - DNum;
    if (depthBelowBase < BNum) {
        const gamma_sub = Math.max(0, gammaNum - gamma_w);
        if (depthBelowBase <= 0) {
            gamma_eff_gamma = gamma_sub;
        } else {
            gamma_eff_gamma = gamma_sub + (depthBelowBase / BNum) * (gammaNum - gamma_sub);
        }
    }

    // --- Calculate Ultimate Bearing Capacity (q_ult) with factors ---
    // ... (calculation remains the same) ...
    const q_ult = (cNum * Nc * sc * dc) +
                  (gamma_eff_q * DNum * Nq * sq * dq) +
                  (0.5 * gamma_eff_gamma * BNum * Ngamma * sgamma * dgamma);

    // Calculate Allowable Bearing Capacity (q_allow)
    // ... (calculation remains the same) ...
    const q_allow = q_ult / FSNum;

    // --- Set Results ---
    // ... (remains the same) ...
    setResults({
      q_ult: q_ult.toFixed(2),
      q_allow: q_allow.toFixed(2),
      Nc: Nc.toFixed(2),
      Nq: Nq.toFixed(2),
      Ngamma: Ngamma.toFixed(2),
      sc: sc.toFixed(3),
      sq: sq.toFixed(3),
      sgamma: sgamma.toFixed(3),
      dc: dc.toFixed(3),
      dq: dq.toFixed(3),
      dgamma: dgamma.toFixed(3),
      gamma_eff_q: gamma_eff_q.toFixed(2),
      gamma_eff_gamma: gamma_eff_gamma.toFixed(2),
    });
  };

  return (
    <div className="soil-bearing-capacity-calculator">
      <h1>Soil Bearing Capacity Calculator (General Formula)</h1>
      <form onSubmit={calculateBearingCapacity}>
        {/* Group Inputs */}
        <fieldset>
            <legend>Soil Properties</legend>
            <div className="form-group">
              <label htmlFor="soilType">Soil Type (Select to set typical defaults):</label>
              <select
                id="soilType" name="soilType"
                value={input.soilType}
                onChange={handleChange}
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
              <label htmlFor="c">Cohesion (c') [kPa]:</label>
              <input type="number" step="0.1" id="c" name="c" value={input.c} onChange={handleChange} required placeholder="Enter value or select soil type"/>
            </div>
            <div className="form-group">
              <label htmlFor="phi">Effective Friction Angle (φ') [degrees]:</label>
              <input type="number" step="0.1" id="phi" name="phi" value={input.phi} onChange={handleChange} required placeholder="Enter value or select soil type"/>
            </div>
            <div className="form-group">
              <label htmlFor="gamma">Total Unit Weight (γ) [kN/m³]:</label>
              <input type="number" step="0.1" id="gamma" name="gamma" value={input.gamma} onChange={handleChange} required placeholder="Enter value or select soil type"/>
            </div>
        </fieldset>

        {/* ... other fieldsets (Foundation Geometry, Safety Factor) remain the same ... */}
        <fieldset>
            <legend>Foundation Geometry & Water Table</legend>
            <div className="form-group">
              <label htmlFor="D">Foundation Depth (D) [m]:</label>
              <input type="number" step="0.01" id="D" name="D" value={input.D} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="B">Foundation Width (B) [m]:</label>
              <input type="number" step="0.01" id="B" name="B" value={input.B} onChange={handleChange} required />
            </div>
             <div className="form-group">
              <label htmlFor="L">Foundation Length (L) [m]:</label>
              <input type="number" step="0.01" id="L" name="L" value={input.L} onChange={handleChange} required />
            </div>
             <div className="form-group">
              <label htmlFor="Dw">Water Table Depth (Dw) [m]:</label>
              <input type="number" step="0.1" id="Dw" name="Dw" value={input.Dw} onChange={handleChange} required placeholder="Depth from ground surface"/>
               <small>(Enter large value if very deep)</small>
            </div>
        </fieldset>

         <fieldset>
            <legend>Safety Factor</legend>
            <div className="form-group">
              <label htmlFor="FS">Factor of Safety (FS):</label>
              <input type="number" step="0.1" id="FS" name="FS" value={input.FS} onChange={handleChange} required />
            </div>
        </fieldset>

        {/* Error Display */}
        {error && <p className="error-message">{error}</p>}

        {/* Warning Display */}
        {warnings.length > 0 && (
            <div className="warning-message">
                <h4>Parameter Warnings:</h4>
                <ul>
                    {warnings.map((warning, index) => (
                        <li key={index}>{warning}</li>
                    ))}
                </ul>
            </div>
        )}

        <button type="submit">Calculate</button>
      </form>

      {/* Results Display (remains the same) */}
      {/* ... */}
       {results && !error && (
        <div className="results">
          <h2>Calculation Results</h2>
          <div className="results-summary">
              <p>Ultimate Bearing Capacity (q<sub>ult</sub>): <strong>{results.q_ult} kPa</strong></p>
              <p>Allowable Bearing Capacity (q<sub>allow</sub>): <strong>{results.q_allow} kPa</strong></p>
          </div>
          <div className="results-details">
              <h3>Intermediate Values:</h3>
              <p>Bearing Capacity Factors: N<sub>c</sub>={results.Nc}, N<sub>q</sub>={results.Nq}, N<sub>γ</sub>={results.Ngamma}</p>
              <p>Shape Factors: s<sub>c</sub>={results.sc}, s<sub>q</sub>={results.sq}, s<sub>γ</sub>={results.sgamma}</p>
              <p>Depth Factors: d<sub>c</sub>={results.dc}, d<sub>q</sub>={results.dq}, d<sub>γ</sub>={results.dgamma}</p>
              <p>Effective Unit Weights: γ<sub>eff (q term)</sub>={results.gamma_eff_q} kN/m³, γ<sub>eff (γ term)</sub>={results.gamma_eff_gamma} kN/m³</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SoilBearingCapacityCalculator;