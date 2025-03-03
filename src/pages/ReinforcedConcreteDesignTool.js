import React, { useState } from 'react';
import './ReinforcedConcreteDesignTool.css';

// Standard rebar sizes in mm with their approximate cross-sectional areas in mm²
const standardRebars = [
  { dia: 12, area: 113 },
  { dia: 16, area: 201 },
  { dia: 20, area: 314 },
  { dia: 25, area: 491 },
  { dia: 32, area: 804 }
];

// Utility function: choose a bar diameter for given area required per bar
const selectRebarDiameter = (requiredArea) => {
  for (let i = 0; i < standardRebars.length; i++) {
    if (standardRebars[i].area >= requiredArea) {
      return standardRebars[i].dia;
    }
  }
  return standardRebars[standardRebars.length - 1].dia; // use largest if required exceeds
};

// Industry rule definitions
const industryRules = {
  beam: {
    deflectionLimit: (L) => L / 250, // Maximum allowed deflection
    maxDepthRatio: 0.15,            // Beam depth should not exceed 15% of span
    minReinforcementRatio: 0.002     // Minimum 0.2% of beam cross-sectional area
  },
  column: {
    minCover: 40,                  // Minimum cover (mm)
    maxBarSpacing: 300,            // Maximum clear spacing (mm)
    minReinforcementRatio: 0.01    // Minimum 1% reinforcement ratio
  },
  slab: {
    deflectionLimit: (L) => L / 250, // Maximum allowed deflection
    minBarSpacing: 125,            // Minimum reinforcement spacing (mm)
    maxBarSpacing: 200,            // Maximum reinforcement spacing (mm)
    effectiveWidth: 1000           // Analysis per 1 m strip of slab
  }
};

const ReinforcedConcreteDesignTool = () => {
  const [inputValues, setInputValues] = useState({
    elementType: 'beam', // Options: beam, column, slab
    concreteStrength: '',
    steelStrength: '',
    beamWidth: '',
    beamDepth: '',
    effectiveDepth: '',
    appliedLoad: '',
    loadType: '',
    spanLength: '',              // For beams/slabs
    designCover: '',             // For durability requirements (used for columns)
    columnAxialLoad: '',         // For column design (kN)
    columnSize: '',              // e.g. width in mm if rectangular
    beamSpan: '',                // Expected beam length (mm)
    deadLoad: '',                // Self-weight (kN)
    liveLoad: '',                // Imposed load (kN)
    loadTransferType: ''         // e.g., simply supported, continuous, etc.
  });

  const [result, setResult] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setInputValues({
      ...inputValues,
      [name]: value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const {
      elementType,
      concreteStrength,
      steelStrength,
      beamWidth,
      beamDepth,
      effectiveDepth,
      appliedLoad,
      loadType,
      spanLength,
      designCover,
      columnAxialLoad,
      columnSize,
      beamSpan,
      deadLoad,
      liveLoad,
      loadTransferType
    } = inputValues;

    // Validate common fields
    if (!elementType || !concreteStrength || !steelStrength) {
      alert('Please fill in the common concrete and steel parameters.');
      return;
    }

    const fck = parseFloat(concreteStrength);
    const fy = parseFloat(steelStrength);

    let analysisResult = {};

    if (elementType === 'beam') {
      if (!beamWidth || !beamDepth || !effectiveDepth || !appliedLoad || !loadType || !spanLength || !beamSpan || !deadLoad || !liveLoad || !loadTransferType) {
        alert('For beam design, please fill in beam dimensions, applied load, span length, effective depth, beam span, dead load, live load, and load transfer type.');
        return;
      }

      const b = parseFloat(beamWidth);
      const D = parseFloat(beamDepth);
      const d = parseFloat(effectiveDepth);
      const L_m = parseFloat(beamSpan) / 1000; // beamSpan in meters
      const effectiveLoad = 1.2 * parseFloat(deadLoad) + 1.6 * parseFloat(liveLoad);

      // Industry rule: Beam depth should not exceed 15% of span
      if (d > 0.15 * L_m * 1000) {
        alert(`Beam depth is too high. It must not exceed ${(0.15 * L_m * 1000).toFixed(0)} mm.`);
        return;
      }

      // Calculate check moment capacity (Mu) and shear capacity (Vu)
      const Mu = 0.138 * fck * b * d * d;
      const Vu = 0.27 * fck * b * d;

      // Deflection - ensure it is less than the industry limit: L/250
      const E = 5000 * Math.sqrt(fck);
      const I = (b * Math.pow(D, 3)) / 12;
      const deflection = (5 * effectiveLoad * Math.pow(L_m, 4)) / (384 * E * I * 1e-6);
      const deflectionLimit = industryRules.beam.deflectionLimit(parseFloat(beamSpan));
      if (deflection > deflectionLimit) {
        alert(`Deflection exceeds limit. Expected deflection < ${deflectionLimit.toFixed(2)} mm.`);
        return;
      }

      // Required reinforcement: make sure reinforcement ratio is above min value
      const Ast = (Mu * 1e6) / (0.87 * fy * d);
      const beamArea = b * d;
      if (Ast < industryRules.beam.minReinforcementRatio * beamArea) {
        alert('Calculated reinforcement area is too low. Increase reinforcement to meet minimum ratios.');
        return;
      }

      // Continue with rebar selection and stirrup spacing as previously defined.
      const reqBarArea = Ast / 4;
      const chosenBar = selectRebarDiameter(reqBarArea);
      const stirrupSpacing = Math.min(d / 3, d / 2, 300);

      analysisResult = {
        Element: 'Beam',
        MomentCapacity: Mu.toFixed(2) + ' kN·m',
        ShearCapacity: Vu.toFixed(2) + ' kN',
        Deflection: deflection.toFixed(2) + ' mm',
        RequiredAst: Ast.toFixed(2) + ' mm²',
        'Chosen Primary Rebar Diameter': chosenBar + ' mm (4 bars)',
        StirrupSpacing: stirrupSpacing.toFixed(2) + ' mm'
      };

    } else if (elementType === 'column') {
      if (!columnAxialLoad || !columnSize || !designCover) {
        alert('For column design, please enter the axial load, column dimension, and design cover.');
        return;
      }
      const Pcol = parseFloat(columnAxialLoad);
      const colSize = parseFloat(columnSize);
      const cover = parseFloat(designCover);
      const Ag = Math.pow(colSize, 2);
      // Simplified formula for required steel area in a column:
      // 0.65 fck*(Ag - Ast) + 0.87 fy*(Ast) must be >= Pcol*1000 [N]
      const Ast_col = (Pcol * 1000 - 0.65 * fck * Ag) / (0.87 * fy - 0.65 * fck);
      const requiredAst = Ast_col > 0 ? Ast_col : 0;
      // Assume 4 bars for columns:
      const reqBarArea_col = requiredAst / 4;
      const chosenBar = selectRebarDiameter(reqBarArea_col);
      // Estimate clear bar spacing in a column; subtracting cover and bar diameters:
      const barSpacing = (colSize - 2 * cover - 2 * chosenBar) / 2;

      // Calculate the nominal axial capacity for reference
      const colCapacity = 0.65 * fck * (Ag - requiredAst) + 0.87 * fy * requiredAst;
      const utilization = (Pcol * 1000) / colCapacity * 100;

      analysisResult = {
        Element: 'Column',
        AxialCapacity: colCapacity.toFixed(2) + ' N',
        ColumnUtilization: utilization.toFixed(2) + '%',
        RequiredAst: requiredAst.toFixed(2) + ' mm²',
        'Chosen Primary Rebar Diameter': chosenBar + ' mm (4 bars)',
        BarSpacing: barSpacing > 0 ? barSpacing.toFixed(2) + ' mm' : 'Check layout'
      };

    } else if (elementType === 'slab') {
      if (!beamWidth || !effectiveDepth || !appliedLoad || !spanLength) {
        alert('For slab design, please fill in effective width, effective depth, applied load, and span length.');
        return;
      }
      // For slabs, use beamWidth as effective width of a representative strip
      const b = parseFloat(beamWidth);
      const d = parseFloat(effectiveDepth);
      const Mu = (appliedLoad * Math.pow(spanLength/1000, 2)) / 8;
      // Required reinforcement area (per meter width):
      const Ast = (Mu * 1e6) / (0.87 * fy * d);
      // Assume 8 bars per meter length:
      const reqBarArea = Ast / 8;
      const chosenBar = selectRebarDiameter(reqBarArea);
      // A typical reinforcement spacing for slabs is about 125 mm
      const reinforcementSpacing = 125;

      analysisResult = {
        Element: 'Slab',
        MomentCapacity: Mu.toFixed(2) + ' kN·m/m',
        RequiredAst: Ast.toFixed(2) + ' mm²/m',
        'Chosen Rebar Diameter': chosenBar + ' mm',
        ReinforcementSpacing: reinforcementSpacing + ' mm'
      };
    }

    setResult(analysisResult);
  };

  return (
    <div className="reinforced-concrete-design-tool">
      <h1>Reinforced Concrete Design Tool</h1>
      <form onSubmit={handleSubmit}>
        {/* Element Type Selector */}
        <div className="form-group">
          <label htmlFor="elementType">Select Structural Element:</label>
          <select
            id="elementType"
            name="elementType"
            value={inputValues.elementType}
            onChange={handleChange}
            required
          >
            <option value="beam">Beam</option>
            <option value="column">Column</option>
            <option value="slab">Slab</option>
          </select>
        </div>

        {/* Common Inputs */}
        <div className="form-group">
          <label htmlFor="concreteStrength">Concrete Compressive Strength (MPa):</label>
          <input
            type="number"
            id="concreteStrength"
            name="concreteStrength"
            value={inputValues.concreteStrength}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="steelStrength">Steel Yield Strength (MPa):</label>
          <input
            type="number"
            id="steelStrength"
            name="steelStrength"
            value={inputValues.steelStrength}
            onChange={handleChange}
            required
          />
        </div>

        {/* Durability / Cover Input (used only for column design) */}
        <div className="form-group">
          <label htmlFor="designCover">Design Cover (mm):</label>
          <input
            type="number"
            id="designCover"
            name="designCover"
            value={inputValues.designCover}
            onChange={handleChange}
            required
          />
        </div>

        {/* Conditional Inputs for Beam */}
        {inputValues.elementType === 'beam' && (
          <>
            <div className="form-group">
              <label htmlFor="beamWidth">Beam Width (mm):</label>
              <input
                type="number"
                id="beamWidth"
                name="beamWidth"
                value={inputValues.beamWidth}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="beamDepth">Beam Depth (mm):</label>
              <input
                type="number"
                id="beamDepth"
                name="beamDepth"
                value={inputValues.beamDepth}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="effectiveDepth">Effective Depth (mm):</label>
              <input
                type="number"
                id="effectiveDepth"
                name="effectiveDepth"
                value={inputValues.effectiveDepth}
                onChange={handleChange}
                required
              />
            </div>
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
            <div className="form-group">
              <label htmlFor="spanLength">Span Length (mm):</label>
              <input
                type="number"
                id="spanLength"
                name="spanLength"
                value={inputValues.spanLength}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="beamSpan">Expected Beam Length (mm):</label>
              <input
                type="number"
                id="beamSpan"
                name="beamSpan"
                value={inputValues.beamSpan}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="deadLoad">Dead Load (kN):</label>
              <input
                type="number"
                id="deadLoad"
                name="deadLoad"
                value={inputValues.deadLoad}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="liveLoad">Live Load (kN):</label>
              <input
                type="number"
                id="liveLoad"
                name="liveLoad"
                value={inputValues.liveLoad}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="loadType">Load Type:</label>
              <select
                id="loadType"
                name="loadType"
                value={inputValues.loadType}
                onChange={handleChange}
                required
              >
                <option value="">Select Load Type</option>
                <option value="uniform">Uniformly Distributed Load</option>
                <option value="point">Point Load</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="loadTransferType">Load Transfer Type:</label>
              <select
                id="loadTransferType"
                name="loadTransferType"
                value={inputValues.loadTransferType}
                onChange={handleChange}
                required
              >
                <option value="">Select Transfer Type</option>
                <option value="simplySupported">Simply Supported</option>
                <option value="continuous">Continuous</option>
              </select>
            </div>
          </>
        )}

        {/* Conditional Inputs for Column */}
        {inputValues.elementType === 'column' && (
          <>
            <div className="form-group">
              <label htmlFor="columnAxialLoad">Axial Load on Column (kN):</label>
              <input
                type="number"
                id="columnAxialLoad"
                name="columnAxialLoad"
                value={inputValues.columnAxialLoad}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="columnSize">Column Dimension (mm):</label>
              <input
                type="number"
                id="columnSize"
                name="columnSize"
                value={inputValues.columnSize}
                onChange={handleChange}
                required
              />
            </div>
          </>
        )}

        {/* Conditional Inputs for Slab */}
        {inputValues.elementType === 'slab' && (
          <>
            <div className="form-group">
              <label htmlFor="beamWidth">Effective Width (mm):</label>
              <input
                type="number"
                id="beamWidth"
                name="beamWidth"
                value={inputValues.beamWidth}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="effectiveDepth">Effective Depth (mm):</label>
              <input
                type="number"
                id="effectiveDepth"
                name="effectiveDepth"
                value={inputValues.effectiveDepth}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="appliedLoad">Applied Load (Total kN):</label>
              <input
                type="number"
                id="appliedLoad"
                name="appliedLoad"
                value={inputValues.appliedLoad}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="spanLength">Span Length (mm):</label>
              <input
                type="number"
                id="spanLength"
                name="spanLength"
                value={inputValues.spanLength}
                onChange={handleChange}
                required
              />
            </div>
          </>
        )}

        <button type="submit">Calculate Design</button>
      </form>

      {result && (
        <div className="result">
          <h2>Design Results</h2>
          {Object.keys(result).map((key) => (
            <p key={key}>
              <strong>{key}:</strong> {result[key]}
            </p>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReinforcedConcreteDesignTool;