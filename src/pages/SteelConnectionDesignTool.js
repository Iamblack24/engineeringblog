import React, { useState } from 'react';
import './SteelConnectionDesignTool.css'; // Import the CSS file for styling

const SteelConnectionDesignTool = () => {
  const [inputValues, setInputValues] = useState({
    connectionType: '',
    // Bolted
    boltDiameter: '20',
    boltGrade: '8.8',
    numBolts: '4',
    numShearPlanes: '1',
    plateThickness: '10',
    plateFu: '410', // S275 steel Fu
    threadsInShearPlane: 'yes', // 'yes' or 'no'
    holeDiameter: '22', // d0 = d + 2mm typically
    edgeDistanceE1: '40', // Parallel to load
    edgeDistanceE2: '30', // Perpendicular to load (for end bolts)
    boltPitchP1: '60',    // Parallel to load
    boltPitchP2: '60',    // Perpendicular to load (for inner bolts)
    // Welded
    weldSize: '6',
    weldLength: '100',
    weldFu: '485', // E70xx electrode Fu
    // General
    appliedLoad: '100',
  });

  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [calculationDetails, setCalculationDetails] = useState(null); // For k1, alpha_b etc.

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setInputValues((prevValues) => ({
      ...prevValues,
      [name]: type === 'checkbox' ? (checked ? 'yes' : 'no') : value, // Simplified for radio/select later
    }));
  };

  const GAMMA_M2 = 1.25; // BS EN 1993-1-8, UK National Annex

  const handleCalculate = () => {
    setResult(null);
    setError('');
    setCalculationDetails(null);

    const {
      connectionType,
      boltDiameter, boltGrade, numBolts, numShearPlanes,
      plateThickness, plateFu, threadsInShearPlane, holeDiameter,
      edgeDistanceE1, edgeDistanceE2, boltPitchP1, boltPitchP2,
      weldSize, weldLength, weldFu,
      appliedLoad,
    } = inputValues;

    const load = parseFloat(appliedLoad);
    if (!connectionType || isNaN(load) || load <= 0) {
      setError('Please select a connection type and enter a valid positive Applied Load.');
      return;
    }

    let capacity = 0;
    let boltShearResistance = null;
    let boltBearingResistance = null;
    let weldShearCapacity = null;
    let details = {};

    if (connectionType === 'bolted') {
      const d = parseFloat(boltDiameter);
      const grade = parseFloat(boltGrade); // e.g., 8.8
      const n = parseInt(numBolts);
      const m = parseInt(numShearPlanes);
      const tp = parseFloat(plateThickness);
      const fu_plate = parseFloat(plateFu);
      const d0 = parseFloat(holeDiameter);
      const e1 = parseFloat(edgeDistanceE1);
      const e2 = parseFloat(edgeDistanceE2);
      const p1 = parseFloat(boltPitchP1);
      const p2 = parseFloat(boltPitchP2);

      if (isNaN(d) || d <= 0 || isNaN(grade) || grade <= 0 || isNaN(n) || n <= 0 || isNaN(m) || m <= 0 ||
          isNaN(tp) || tp <= 0 || isNaN(fu_plate) || fu_plate <= 0 || isNaN(d0) || d0 <= d ||
          isNaN(e1) || e1 <= 0 || isNaN(e2) || e2 <= 0 || isNaN(p1) || p1 <= 0 || isNaN(p2) || p2 <= 0) {
        setError('Please fill in all bolt, plate, and geometry details with valid positive numbers. Hole diameter must be > bolt diameter.');
        return;
      }

      const fub = Math.floor(grade) * 100; // Ultimate tensile strength of bolt, e.g., 800 MPa for grade 8.8
      details.fub = fub;

      // --- Bolt Shear Resistance (F_v_Rd) ---
      const A = (Math.PI * d * d) / 4; // Bolt gross area
      const A_s_approx = 0.78 * A; // Approximate tensile stress area for threads
      
      let A_shear_eff = A;
      let alpha_v = 0.6; // For grades like 8.8, 10.9 if threads NOT in shear plane (using A)
                         // or if threads ARE in shear plane (using A_s)
      
      if (threadsInShearPlane === 'yes') {
        A_shear_eff = A_s_approx;
        // For some lower grades (4.8, 5.8, 6.8), alpha_v might be 0.5 if threads in shear.
        // For 8.8, 10.9, alpha_v remains 0.6 when using A_s.
        // This simplification keeps alpha_v = 0.6 and uses A_s.
      }
      details.A_shear_eff = A_shear_eff.toFixed(2);
      details.alpha_v = alpha_v;

      boltShearResistance = (alpha_v * fub * A_shear_eff * n * m) / (GAMMA_M2 * 1000); // kN
      

      // --- Bolt Bearing Resistance (F_b_Rd) ---
      // k1 factor (BS EN 1993-1-8, Table 3.4)
      let k1_edge = Math.min(2.8 * e2 / d0 - 1.7, 2.5);
      let k1_inner = Math.min(1.4 * p2 / d0 - 1.7, 2.5);
      // User must determine if edge or inner bolts govern, or provide more specific layout.
      // For simplicity, we can show both or ask user to choose the critical k1.
      // Or, if a row has edge bolts, k1_edge applies to those. If only inner, k1_inner.
      // Let's assume the provided e2 is for the critical edge bolt, and p2 for inner.
      // A conservative approach for a generic group might be to use min(k1_edge, k1_inner) if not all bolts are inner.
      // For now, let's assume k1 is based on the most restrictive case if not all bolts are inner.
      // If the connection is to an edge, e2 is relevant. If it's an internal plate, p2 is more relevant for internal bolts.
      // We'll calculate both and let the user interpret or we take the minimum k1 if it's a mixed group.
      // For this simplified tool, let's assume the user inputs e2 for end bolts and p2 for inner bolts,
      // and the design is governed by the smaller k1 if both types exist.
      // Or, more simply, we can ask for a single k1 or calculate based on a typical "worst-case" bolt.
      // Let's calculate k1 based on e2 (end/edge bolt perpendicular to load)
      let k1 = k1_edge; 
      if (p2 < e2*2) { // Heuristic: if pitch is tighter than typical edge spacing, inner might govern
          k1 = Math.min(k1_edge, k1_inner);
      }


      details.k1_edge_calc = k1_edge.toFixed(3);
      details.k1_inner_calc = k1_inner.toFixed(3);
      details.k1_used = k1.toFixed(3);


      // alpha_b factor (BS EN 1993-1-8, Table 3.4)
      let alpha_b_e1 = e1 / (3 * d0);
      let alpha_b_p1 = p1 / (3 * d0) - 0.25;
      let alpha_b_strength_ratio = fub / fu_plate;
      let alpha_b = Math.min(alpha_b_e1, alpha_b_strength_ratio, 1.0);
      // If p1 is relevant (i.e. not a single line of bolts in load direction, or p1 is small)
      if (n > m && p1/(3*d0) < e1/(3*d0)) { // Heuristic for when p1 might govern over e1
         alpha_b = Math.min(alpha_b_e1, alpha_b_p1, alpha_b_strength_ratio, 1.0);
      }


      details.alpha_b_e1_calc = alpha_b_e1.toFixed(3);
      details.alpha_b_p1_calc = alpha_b_p1.toFixed(3);
      details.alpha_b_strength_ratio_calc = alpha_b_strength_ratio.toFixed(3);
      details.alpha_b_used = alpha_b.toFixed(3);

      boltBearingResistance = (k1 * alpha_b * fu_plate * d * tp * n) / (GAMMA_M2 * 1000); // kN

      capacity = Math.min(boltShearResistance, boltBearingResistance);
      details.gammaM2 = GAMMA_M2;

    } else if (connectionType === 'welded') {
      // ... (welded calculations remain simplified for now)
      const a = parseFloat(weldSize);
      const l = parseFloat(weldLength);
      const fu_weld = parseFloat(weldFu);

      if (isNaN(a) || a <= 0 || isNaN(l) || l <= 0 || isNaN(fu_weld) || fu_weld <= 0) {
        setError('Please fill in all weld details with valid positive numbers.');
        return;
      }
      const throatArea = 0.707 * a * l;
      weldShearCapacity = 0.6 * fu_weld * throatArea / 1000; // Simplified
      capacity = weldShearCapacity;
    } else {
      setError('Invalid connection type selected.');
      return;
    }

    const utilisationRatio = capacity > 0 ? load / capacity : Infinity;

    setResult({
      capacity: capacity.toFixed(2),
      utilisationRatio: utilisationRatio.toFixed(2),
      boltShearResistance: boltShearResistance?.toFixed(2),
      boltBearingResistance: boltBearingResistance?.toFixed(2),
      weldShearCapacity: weldShearCapacity?.toFixed(2),
      connectionType: connectionType,
    });
    setCalculationDetails(details);
  };

  return (
    <div className="steel-connection-design-tool">
      <h1>Steel Connection Design Tool (BS EN 1993-1-8 Principles)</h1>
      <p className="disclaimer">
        Note: Calculations are simplified for illustrative purposes. Bolted connections follow principles from BS EN 1993-1-8 (Eurocode 3) with γ<sub>M2</sub>={GAMMA_M2}. Welded calculations are highly simplified. This tool does not replace detailed design by a qualified engineer. Assumes appropriate material properties and bolt hole types. Bearing resistance calculation for k1 and α<sub>b</sub> involves simplifications for typical cases.
      </p>
      <div className="form-group">
        <label htmlFor="connectionType">Connection Type:</label>
        <select id="connectionType" name="connectionType" value={inputValues.connectionType} onChange={handleChange} required>
          <option value="">Select Type</option>
          <option value="bolted">Bolted Connection (BS EN 1993-1-8)</option>
          <option value="welded">Welded Connection (Simplified)</option>
        </select>
      </div>

      {inputValues.connectionType === 'bolted' && (
        <fieldset>
          <legend>Bolted Connection Details (BS EN 1993-1-8)</legend>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="boltDiameter">Bolt Diameter (d) [mm]:</label>
              <input type="number" id="boltDiameter" name="boltDiameter" value={inputValues.boltDiameter} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label htmlFor="holeDiameter">Hole Diameter (d<sub>0</sub>) [mm]:</label>
              <input type="number" id="holeDiameter" name="holeDiameter" value={inputValues.holeDiameter} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label htmlFor="boltGrade">Bolt Grade (e.g., 8.8):</label>
              <input type="number" step="0.1" id="boltGrade" name="boltGrade" value={inputValues.boltGrade} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label htmlFor="numBolts">Number of Bolts (n):</label>
              <input type="number" id="numBolts" name="numBolts" value={inputValues.numBolts} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label htmlFor="numShearPlanes">Number of Shear Planes (m):</label>
              <input type="number" id="numShearPlanes" name="numShearPlanes" value={inputValues.numShearPlanes} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Threads in Shear Plane?</label>
              <select name="threadsInShearPlane" value={inputValues.threadsInShearPlane} onChange={handleChange}>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="plateThickness">Plate Thickness (t<sub>p</sub>) [mm]:</label>
              <input type="number" id="plateThickness" name="plateThickness" value={inputValues.plateThickness} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label htmlFor="plateFu">Plate Ultimate Strength (f<sub>u,plate</sub>) [MPa]:</label>
              <input type="number" id="plateFu" name="plateFu" value={inputValues.plateFu} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label htmlFor="edgeDistanceE1">Edge Dist. e<sub>1</sub> (parallel to load) [mm]:</label>
              <input type="number" id="edgeDistanceE1" name="edgeDistanceE1" value={inputValues.edgeDistanceE1} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label htmlFor="edgeDistanceE2">Edge Dist. e<sub>2</sub> (perp. to load) [mm]:</label>
              <input type="number" id="edgeDistanceE2" name="edgeDistanceE2" value={inputValues.edgeDistanceE2} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label htmlFor="boltPitchP1">Bolt Pitch p<sub>1</sub> (parallel to load) [mm]:</label>
              <input type="number" id="boltPitchP1" name="boltPitchP1" value={inputValues.boltPitchP1} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label htmlFor="boltPitchP2">Bolt Pitch p<sub>2</sub> (perp. to load) [mm]:</label>
              <input type="number" id="boltPitchP2" name="boltPitchP2" value={inputValues.boltPitchP2} onChange={handleChange} />
            </div>
          </div>
        </fieldset>
      )}

      {/* Welded Inputs (Simplified) */}
      {inputValues.connectionType === 'welded' && (
         <fieldset>
           <legend>Welded Connection Details (Simplified)</legend>
           <div className="form-grid">
            <div className="form-group">
              <label htmlFor="weldSize">Weld Leg Size (a) [mm]:</label>
              <input type="number" id="weldSize" name="weldSize" value={inputValues.weldSize} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label htmlFor="weldLength">Total Effective Weld Length (l) [mm]:</label>
              <input type="number" id="weldLength" name="weldLength" value={inputValues.weldLength} onChange={handleChange} />
            </div>
             <div className="form-group">
              <label htmlFor="weldFu">Weld Electrode Strength (f<sub>u,weld</sub>) [MPa]:</label>
              <input type="number" id="weldFu" name="weldFu" value={inputValues.weldFu} onChange={handleChange} />
            </div>
           </div>
        </fieldset>
      )}

       <fieldset>
           <legend>Loading</legend>
          <div className="form-group">
            <label htmlFor="appliedLoad">Applied Design Load (P<sub>Ed</sub>) [kN]:</label>
            <input type="number" id="appliedLoad" name="appliedLoad" value={inputValues.appliedLoad} onChange={handleChange} />
          </div>
       </fieldset>

      {error && <p className="error-message">{error}</p>}
      <button onClick={handleCalculate}>Calculate</button>

      {result && !error && (
        <div className="result">
          <h2>Calculation Results</h2>
          {calculationDetails && result.connectionType === 'bolted' && (
            <div className="calculation-details-box">
              <h4>Intermediate Bolt Calculation Values (BS EN 1993-1-8):</h4>
              <p>γ<sub>M2</sub>: {calculationDetails.gammaM2}</p>
              <p>Bolt f<sub>ub</sub>: {calculationDetails.fub} MPa</p>
              <p>Effective Shear Area per bolt (A<sub>shear,eff</sub>): {calculationDetails.A_shear_eff} mm² (using α<sub>v</sub>={calculationDetails.alpha_v})</p>
              <p>k<sub>1,edge</sub> (calc): {calculationDetails.k1_edge_calc}</p>
              <p>k<sub>1,inner</sub> (calc): {calculationDetails.k1_inner_calc}</p>
              <p>k<sub>1</sub> (used): {calculationDetails.k1_used}</p>
              <p>α<sub>b,e1</sub> (calc): {calculationDetails.alpha_b_e1_calc}</p>
              <p>α<sub>b,p1</sub> (calc): {calculationDetails.alpha_b_p1_calc}</p>
              <p>α<sub>b,fub/fu</sub> (calc): {calculationDetails.alpha_b_strength_ratio_calc}</p>
              <p>α<sub>b</sub> (used): {calculationDetails.alpha_b_used}</p>
            </div>
          )}
          {result.connectionType === 'bolted' && (
            <>
              <p>Bolt Shear Resistance (F<sub>v,Rd</sub>): {result.boltShearResistance} kN</p>
              <p>Bolt Bearing Resistance (F<sub>b,Rd</sub>): {result.boltBearingResistance} kN</p>
              <hr/>
            </>
          )}
           {result.connectionType === 'welded' && (
            <>
              <p>Weld Shear Capacity (Simplified): {result.weldShearCapacity} kN</p>
               <hr/>
            </>
          )}
          <p><strong>Governing Connection Resistance (R<sub>d</sub>): {result.capacity} kN</strong></p>
          <p>Applied Design Load (P<sub>Ed</sub>): {parseFloat(inputValues.appliedLoad).toFixed(2)} kN</p>
          <p><strong>Utilisation Ratio (P<sub>Ed</sub> / R<sub>d</sub>): {result.utilisationRatio}</strong></p>
          <p className={result.utilisationRatio <= 1.0 ? 'safe' : 'unsafe'}>
            Status: {result.utilisationRatio <= 1.0 ? 'OK' : 'FAIL'} (Resistance {result.utilisationRatio <= 1.0 ? '≥' : '<'} Applied Load)
          </p>
        </div>
      )}
    </div>
  );
};

export default SteelConnectionDesignTool;