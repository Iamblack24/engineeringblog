import React, { useState } from 'react';
import './LightingDesignCalculator.css';

const LightingDesignCalculator = () => {
  // State variables with realistic default values
  const [environment, setEnvironment] = useState('indoor');
  const [L, setL] = useState(10); // Length in meters
  const [W, setW] = useState(10); // Width in meters
  const [H, setH] = useState(3); // Room height in meters (indoor only)
  const [H_w, setH_w] = useState(0.8); // Working plane height in meters (indoor only)
  const [E, setE] = useState(300); // Desired lux level
  const [Φ_f, setΦ_f] = useState(3000); // Fixture luminous flux in lumens
  const [P_f, setP_f] = useState(30); // Fixture power in Watts
  const [CU, setCU] = useState(0.7); // Coefficient of utilization (indoor only)
  const [MF, setMF] = useState(0.8); // Maintenance factor
  const [H_m_outdoor, setH_m_outdoor] = useState(10); // Mounting height in meters (outdoor only)
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  // Calculate lighting requirements
  const calculateLighting = () => {
    setError(''); // Clear previous errors
    setResult(null);

    if (L <= 0 || W <= 0 || E <= 0 || Φ_f <= 0 || P_f <= 0 || MF <= 0 || MF > 1) {
      setError('Please ensure all dimensions, lux, flux, power, and MF (0-1) are positive and valid.');
      return;
    }

    let Φ_total, N, placement, E_actual, P_total, LPD;
    let RI = null;
    const A = L * W; // Area in square meters

    if (environment === 'indoor') {
      if (H <= 0 || H_w < 0 || H_w >= H || CU <= 0 || CU > 1) {
        setError('Indoor: Ensure heights are valid (H_w < H), and CU (0-1) is valid.');
        return;
      }
      const H_m_indoor = H - H_w; // Mounting height above working plane
      if (H_m_indoor <= 0) {
        setError('Indoor: Mounting height above working plane must be positive (H > H_w).');
        return;
      }

      RI = (L * W) / (H_m_indoor * (L + W));
      Φ_total = (E * A) / (CU * MF);
      N = Math.ceil(Φ_total / Φ_f);
      E_actual = (N * Φ_f * CU * MF) / A;
      P_total = N * P_f;
      LPD = P_total / A;

      const C = Math.ceil(Math.sqrt(N * L / W));
      const R_calc = N / C;
      const R = Math.max(1, Math.ceil(R_calc)); // Ensure at least 1 row
      const S_x = C > 0 ? (L / C).toFixed(2) : L.toFixed(2);
      const S_y = R > 0 ? (W / R).toFixed(2) : W.toFixed(2);
      placement = `Arrange in a grid of approximately ${R} rows and ${C} columns.\nSpacing: ~${S_x}m (length-wise) x ~${S_y}m (width-wise).`;
    } else { // Outdoor
      if (H_m_outdoor <= 0) {
        setError('Outdoor: Mounting height must be positive.');
        return;
      }
      const CU_outdoor = 0.5; // Simplified CU for outdoor general area lighting
      Φ_total = (E * A) / (CU_outdoor * MF);
      N = Math.ceil(Φ_total / Φ_f);
      E_actual = (N * Φ_f * CU_outdoor * MF) / A;
      P_total = N * P_f;
      LPD = P_total / A;

      const C = Math.ceil(Math.sqrt(N * L / W));
      const R_calc = N / C;
      const R = Math.max(1, Math.ceil(R_calc));
      const S_x = C > 0 ? (L / C).toFixed(2) : L.toFixed(2);
      const S_y = R > 0 ? (W / R).toFixed(2) : W.toFixed(2);
      // General rule of thumb for outdoor spacing can be 2 to 4 times mounting height, highly dependent on beam angle.
      // This is a very rough guide.
      const suggestedSpacingMin = (2 * H_m_outdoor).toFixed(2);
      const suggestedSpacingMax = (4 * H_m_outdoor).toFixed(2);
      placement = `Arrange in a grid of approx. ${R} rows and ${C} columns.\nCalculated spacing: ~${S_x}m x ~${S_y}m.\nA general rule of thumb for pole spacing might be ${suggestedSpacingMin}m to ${suggestedSpacingMax}m, depending on luminaire distribution.`;
    }

    setResult({ N, Φ_total, E_actual, P_total, LPD, RI, placement });
  };

  // JSX rendering
  return (
    <div className="lighting-design-calculator">
      <h2>Lighting Design Calculator</h2>
      <p>Calculate required lux levels, number of fixtures, and basic placement for indoor and outdoor lighting.</p>

      <div className="controls">
        <div className="environment-select">
          <label>Environment:</label>
          <select value={environment} onChange={e => { setEnvironment(e.target.value); setResult(null); setError(''); }}>
            <option value="indoor">Indoor</option>
            <option value="outdoor">Outdoor</option>
          </select>
        </div>
      </div>

      <div className="input-section">
        <div className="input-group">
          <label>Length (L, m):</label>
          <input type="number" value={L} onChange={e => setL(parseFloat(e.target.value))} min="0.1" step="0.1" />
        </div>
        <div className="input-group">
          <label>Width (W, m):</label>
          <input type="number" value={W} onChange={e => setW(parseFloat(e.target.value))} min="0.1" step="0.1" />
        </div>
        {environment === 'indoor' && (
          <>
            <div className="input-group">
              <label>Room Height (H, m):</label>
              <input type="number" value={H} onChange={e => setH(parseFloat(e.target.value))} min="0.1" step="0.1" />
            </div>
            <div className="input-group">
              <label>Working Plane Height (H<sub>w</sub>, m):</label>
              <input type="number" value={H_w} onChange={e => setH_w(parseFloat(e.target.value))} min="0" step="0.1" />
            </div>
          </>
        )}
        <div className="input-group">
          <label>Desired Illuminance (E, lx):</label>
          <input type="number" value={E} onChange={e => setE(parseFloat(e.target.value))} min="1" step="1" />
        </div>
        <div className="input-group">
          <label>Fixture Luminous Flux (Φ<sub>f</sub>, lm):</label>
          <input type="number" value={Φ_f} onChange={e => setΦ_f(parseFloat(e.target.value))} min="1" step="100" />
        </div>
        <div className="input-group">
          <label>Fixture Power (P<sub>f</sub>, W):</label>
          <input type="number" value={P_f} onChange={e => setP_f(parseFloat(e.target.value))} min="1" step="1" />
        </div>
        {environment === 'indoor' && (
          <div className="input-group">
            <label>Coefficient of Utilization (CU):</label>
            <input
              type="number"
              value={CU}
              onChange={e => setCU(parseFloat(e.target.value))}
              min="0.01"
              max="1"
              step="0.01"
            />
          </div>
        )}
        <div className="input-group">
          <label>Maintenance Factor (MF):</label>
          <input
            type="number"
            value={MF}
            onChange={e => setMF(parseFloat(e.target.value))}
            min="0.01"
            max="1"
            step="0.01"
          />
        </div>
        {environment === 'outdoor' && (
          <div className="input-group">
            <label>Mounting Height (H<sub>m</sub>, m):</label>
            <input
              type="number"
              value={H_m_outdoor}
              onChange={e => setH_m_outdoor(parseFloat(e.target.value))}
              min="0.1"
              step="0.1"
            />
          </div>
        )}
      </div>

      <button className="calculate-btn" onClick={calculateLighting}>
        Calculate
      </button>

      {error && <p className="error-message">{error}</p>}

      {result && !error && (
        <div className="result-section">
          <h3>Results</h3>
          <div className="results-grid">
            <div className="result-item"><span className="label">Number of Fixtures (N):</span> <span className="value">{result.N}</span></div>
            {result.RI !== null && <div className="result-item"><span className="label">Room Index (RI):</span> <span className="value">{result.RI.toFixed(2)}</span></div>}
            <div className="result-item"><span className="label">Total Luminous Flux Required (Φ<sub>total</sub>):</span> <span className="value">{result.Φ_total.toFixed(0)} lm</span></div>
            <div className="result-item"><span className="label">Actual Average Illuminance (E<sub>actual</sub>):</span> <span className="value">{result.E_actual.toFixed(0)} lx</span></div>
            <div className="result-item"><span className="label">Total Power Consumption (P<sub>total</sub>):</span> <span className="value">{result.P_total.toFixed(1)} W</span></div>
            <div className="result-item"><span className="label">Lighting Power Density (LPD):</span> <span className="value">{result.LPD.toFixed(2)} W/m²</span></div>
          </div>
          <div className="placement-info">
            <h4>Placement Suggestion:</h4>
            <p>{result.placement}</p>
          </div>
          {environment === 'indoor' && <p className="notes">Note: CU is an estimate. Actual CU depends on room reflectances and luminaire distribution. RI can help select a more accurate CU from manufacturer data.</p>}
          {environment === 'outdoor' && <p className="notes">Note: Outdoor CU is a general estimate (0.5 used). Actual performance depends heavily on luminaire photometry and site conditions. Spacing guidelines are very approximate.</p>}
        </div>
      )}
    </div>
  );
};

export default LightingDesignCalculator;