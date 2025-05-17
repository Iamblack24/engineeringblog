import React, { useState } from 'react';
import './ShortCircuitCurrentCalculator.css';

const ShortCircuitCurrentCalculator = () => {
  // State variables with realistic default values
  const [sBase, setSBase] = useState(100); // Base power in MVA
  const [vHigh, setVHigh] = useState(132); // Source voltage in kV
  const [vLow, setVLow] = useState(11); // Load side voltage in kV
  const [sSc, setSSc] = useState(1000); // Source short circuit MVA
  const [sTrans, setSTrans] = useState(50); // Transformer rated power in MVA
  const [rTransPu, setRTransPu] = useState(0.01); // Transformer resistance in pu (on S_trans)
  const [xTransPu, setXTransPu] = useState(0.1); // Transformer reactance in pu (on S_trans)
  const [length, setLength] = useState(10); // Line length in km
  const [rPerKm, setRPerKm] = useState(0.1); // Line resistance per km in ohms/km
  const [xPerKm, setXPerKm] = useState(0.3); // Line reactance per km in ohms/km
  const [faultCurrent, setFaultCurrent] = useState(null);
  const [calculationDetails, setCalculationDetails] = useState(null);

  // Complex number class for impedance calculations
  class Complex {
    constructor(real, imag) {
      this.real = real;
      this.imag = imag;
    }

    // Add two complex numbers
    add(other) {
      return new Complex(this.real + other.real, this.imag + other.imag);
    }

    // Multiply by a scalar
    multiply(scalar) {
      return new Complex(this.real * scalar, this.imag * scalar);
    }

    // Compute magnitude
    magnitude() {
      return Math.sqrt(this.real ** 2 + this.imag ** 2);
    }

    // Return string representation
    toString(decimals = 4) {
      const realStr = this.real.toFixed(decimals);
      const imagStr = Math.abs(this.imag).toFixed(decimals);
      return `${realStr} ${this.imag < 0 ? '-' : '+'} j${imagStr}`;
    }
  }

  // Calculate the fault current
  const calculateFaultCurrent = () => {
    // Source impedance (assumed purely reactive): Z_source_pu = j * (S_base / S_sc)
    const zSourcePu = new Complex(0, sBase / sSc);

    // Transformer impedance on system base: Z_trans_pu = (R_trans_pu + j * X_trans_pu) * (S_base / S_trans)
    const zTransPuSystem = new Complex(rTransPu * (sBase / sTrans), xTransPu * (sBase / sTrans));

    // Line impedance in ohms: Z_line = (R_per_km + j * X_per_km) * length
    const zLineOhms = new Complex(rPerKm * length, xPerKm * length);

    // Base impedance at load voltage: Z_base_load = V_low^2 / S_base
    const zBaseLoad = (vLow ** 2) / sBase;

    // Line impedance in pu: Z_line_pu = Z_line_ohms / Z_base_load
    const zLinePu = new Complex(zLineOhms.real / zBaseLoad, zLineOhms.imag / zBaseLoad);


    // Total impedance: Z_total_pu = Z_source_pu + Z_trans_pu + Z_line_pu
    const zTotalPu = zSourcePu.add(zTransPuSystem).add(zLinePu);
    const zTotalPuMag = zTotalPu.magnitude();

    // Fault current in pu: I_fault_pu = 1 / |Z_total_pu| (assuming V_pu = 1)
    const iFaultPu = 1 / zTotalPuMag;

    // Base current at fault location: I_base = S_base / (√3 * V_low) in kA
    const iBaseKa = sBase / (Math.sqrt(3) * vLow);

    // Fault current in kA: I_fault = I_fault_pu * I_base
    const iFaultKa = iFaultPu * iBaseKa;
    setFaultCurrent(iFaultKa.toFixed(2));

    // Fault MVA: S_fault = I_fault_pu * S_base (or √3 * V_low * I_fault_kA)
    const sFaultMva = iFaultPu * sBase;

    // X/R Ratio at fault point
    const xOverR = (zTotalPu.imag === 0 && zTotalPu.real === 0) ? Infinity : // Avoid division by zero if R is 0
                   (zTotalPu.real === 0) ? Infinity : // Purely reactive
                   Math.abs(zTotalPu.imag / zTotalPu.real);


    setCalculationDetails({
      zSourcePu: zSourcePu.toString(),
      zTransPuSystem: zTransPuSystem.toString(),
      zLinePu: zLinePu.toString(),
      zTotalPu: zTotalPu.toString(),
      zTotalPuMag: zTotalPuMag.toFixed(4),
      iBaseKa: iBaseKa.toFixed(2),
      iFaultPu: iFaultPu.toFixed(4),
      sFaultMva: sFaultMva.toFixed(2),
      xOverR: xOverR === Infinity ? "Infinity" : xOverR.toFixed(2),
    });
  };

  // JSX rendering
  return (
    <div className="short-circuit-calculator">
      <h2>Short Circuit Current Calculator (Radial Systems)</h2>
      <p>Calculate three-phase fault current for a radial system: Source → Transformer → Line.</p>

      <div className="input-section">
        <div className="input-group">
          <label>Base Power (MVA):</label>
          <input
            type="number"
            value={sBase}
            onChange={e => setSBase(parseFloat(e.target.value))}
            min="0"
            step="1"
          />
        </div>
        <div className="input-group">
          <label>Source Voltage (kV):</label>
          <input
            type="number"
            value={vHigh}
            onChange={e => setVHigh(parseFloat(e.target.value))}
            min="0"
            step="1"
          />
        </div>
        <div className="input-group">
          <label>Load Voltage (kV):</label>
          <input
            type="number"
            value={vLow}
            onChange={e => setVLow(parseFloat(e.target.value))}
            min="0"
            step="1"
          />
        </div>
        <div className="input-group">
          <label>Source Short Circuit MVA:</label>
          <input
            type="number"
            value={sSc}
            onChange={e => setSSc(parseFloat(e.target.value))}
            min="0"
            step="1"
          />
        </div>
        <div className="input-group">
          <label>Transformer Rated Power (MVA):</label>
          <input
            type="number"
            value={sTrans}
            onChange={e => setSTrans(parseFloat(e.target.value))}
            min="0"
            step="1"
          />
        </div>
        <div className="input-group">
          <label>Transformer Resistance (pu):</label>
          <input
            type="number"
            value={rTransPu}
            onChange={e => setRTransPu(parseFloat(e.target.value))}
            min="0"
            step="0.001"
          />
        </div>
        <div className="input-group">
          <label>Transformer Reactance (pu):</label>
          <input
            type="number"
            value={xTransPu}
            onChange={e => setXTransPu(parseFloat(e.target.value))}
            min="0"
            step="0.001"
          />
        </div>
        <div className="input-group">
          <label>Line Length (km):</label>
          <input
            type="number"
            value={length}
            onChange={e => setLength(parseFloat(e.target.value))}
            min="0"
            step="0.1"
          />
        </div>
        <div className="input-group">
          <label>Line Resistance (ohms/km):</label>
          <input
            type="number"
            value={rPerKm}
            onChange={e => setRPerKm(parseFloat(e.target.value))}
            min="0"
            step="0.01"
          />
        </div>
        <div className="input-group">
          <label>Line Reactance (ohms/km):</label>
          <input
            type="number"
            value={xPerKm}
            onChange={e => setXPerKm(parseFloat(e.target.value))}
            min="0"
            step="0.01"
          />
        </div>
      </div>

      <button className="calculate-btn" onClick={calculateFaultCurrent}>
        Calculate Fault Current
      </button>

      {faultCurrent && calculationDetails && (
        <div className="result-section">
          <h3>Calculation Results</h3>
          <div className="results-grid">
            <div className="result-item"><strong>Fault Current (I<sub>f</sub>):</strong> {faultCurrent} kA</div>
            <div className="result-item"><strong>Fault MVA (S<sub>f</sub>):</strong> {calculationDetails.sFaultMva} MVA</div>
            <div className="result-item"><strong>X/R Ratio:</strong> {calculationDetails.xOverR}</div>
            <div className="result-item"><strong>Base Current (I<sub>base</sub> @ {vLow} kV):</strong> {calculationDetails.iBaseKa} kA</div>
            <div className="result-item"><strong>Fault Current (I<sub>f,pu</sub>):</strong> {calculationDetails.iFaultPu} p.u.</div>
            <div className="result-item"><strong>Source Z<sub>pu</sub>:</strong> {calculationDetails.zSourcePu} p.u.</div>
            <div className="result-item"><strong>Transformer Z<sub>pu</sub> (on S<sub>base</sub>):</strong> {calculationDetails.zTransPuSystem} p.u.</div>
            <div className="result-item"><strong>Line Z<sub>pu</sub>:</strong> {calculationDetails.zLinePu} p.u.</div>
            <div className="result-item"><strong>Total Z<sub>pu</sub>:</strong> {calculationDetails.zTotalPu} p.u.</div>
            <div className="result-item"><strong>|Total Z<sub>pu</sub>|:</strong> {calculationDetails.zTotalPuMag} p.u.</div>
          </div>

          <div className="system-diagram">
            <h4>System Single-Line Diagram</h4>
            <svg width="450" height="120" viewBox="0 0 450 120">
              {/* Source */}
              <circle cx="50" cy="50" r="20" stroke="#ccd6f6" strokeWidth="2" fill="#233554" />
              <text x="50" y="55" fill="#ccd6f6" fontSize="10" textAnchor="middle">G</text>
              <text x="50" y="85" fill="#ccd6f6" fontSize="10" textAnchor="middle">Source</text>
              <text x="50" y="100" fill="#aaa" fontSize="8" textAnchor="middle">Zsrc: {calculationDetails.zSourcePu}</text>
              
              {/* Line to Transformer */}
              <line x1="70" y1="50" x2="120" y2="50" stroke="#ccd6f6" strokeWidth="2" />

              {/* Transformer */}
              <circle cx="140" cy="40" r="15" stroke="#ccd6f6" strokeWidth="2" fill="none" />
              <circle cx="160" cy="60" r="15" stroke="#ccd6f6" strokeWidth="2" fill="none" />
              <text x="150" y="85" fill="#ccd6f6" fontSize="10" textAnchor="middle">Transformer</text>
              <text x="150" y="100" fill="#aaa" fontSize="8" textAnchor="middle">Ztr: {calculationDetails.zTransPuSystem}</text>

              {/* Line to Line */}
              <line x1="175" y1="50" x2="225" y2="50" stroke="#ccd6f6" strokeWidth="2" />

              {/* Line */}
              <rect x="225" y="45" width="50" height="10" stroke="#ccd6f6" strokeWidth="1" fill="#233554" />
              <text x="250" y="85" fill="#ccd6f6" fontSize="10" textAnchor="middle">Line</text>
              <text x="250" y="100" fill="#aaa" fontSize="8" textAnchor="middle">Zline: {calculationDetails.zLinePu}</text>

              {/* Line to Fault */}
              <line x1="275" y1="50" x2="325" y2="50" stroke="#ccd6f6" strokeWidth="2" />
              
              {/* Fault Location */}
              <line x1="325" y1="50" x2="325" y2="70" stroke="red" strokeWidth="2" />
              <line x1="325" y1="70" x2="315" y2="60" stroke="red" strokeWidth="2" />
              <line x1="325" y1="70" x2="335" y2="60" stroke="red" strokeWidth="2" />
              <text x="325" y="85" fill="#ccd6f6" fontSize="10" textAnchor="middle">Fault</text>
              
              <text x="375" y="40" className="fault-current-text" fontSize="14" textAnchor="middle">
                I fault = {faultCurrent} kA
              </text>
              <text x="375" y="60" className="fault-current-text" fontSize="12" textAnchor="middle">
                S fault = {calculationDetails.sFaultMva} MVA
              </text>
            </svg>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShortCircuitCurrentCalculator;