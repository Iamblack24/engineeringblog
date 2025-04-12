import React, { useState, useEffect } from 'react';
import './HydraulicCalculator.css';

// Common fluids and their properties at 20°C
const FLUID_PRESETS = {
  water: { density: 998, viscosity: 0.001, name: 'Water (20°C)' },
  oil: { density: 900, viscosity: 0.03, name: 'Oil (SAE 30)' },
  gasoline: { density: 750, viscosity: 0.0006, name: 'Gasoline' },
  glycerin: { density: 1260, viscosity: 1.5, name: 'Glycerin' },
  air: { density: 1.2, viscosity: 0.000018, name: 'Air (20°C)' }
};

// Pipe materials and roughness values (mm)
const PIPE_MATERIALS = {
  pvc: { roughness: 0.0015, name: 'PVC' },
  steel: { roughness: 0.045, name: 'Commercial Steel' },
  castIron: { roughness: 0.26, name: 'Cast Iron' },
  concrete: { roughness: 1.0, name: 'Concrete' },
  copper: { roughness: 0.0015, name: 'Copper' },
  hdpe: { roughness: 0.0015, name: 'HDPE Plastic' },
};

const HydraulicCalculator = () => {
  // Input states
  const [calculationMethod, setCalculationMethod] = useState('velocityBased');
  const [velocity, setVelocity] = useState('');
  const [flowRate, setFlowRate] = useState('');
  const [diameter, setDiameter] = useState('');
  const [length, setLength] = useState('');
  const [selectedFluid, setSelectedFluid] = useState('custom');
  const [density, setDensity] = useState('');
  const [viscosity, setViscosity] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState('custom');
  const [roughness, setRoughness] = useState('');
  const [frictionFactor, setFrictionFactor] = useState('');
  const [useCalculatedFriction, setUseCalculatedFriction] = useState(true);
  const [fittings, setFittings] = useState([]);
  const [results, setResults] = useState(null);
  const [errors, setErrors] = useState({});
  const [isCalculating, setIsCalculating] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [useMetricUnits, setUseMetricUnits] = useState(true);

  // Update fluid properties when a preset is selected
  useEffect(() => {
    if (selectedFluid !== 'custom') {
      setDensity(FLUID_PRESETS[selectedFluid].density);
      setViscosity(FLUID_PRESETS[selectedFluid].viscosity);
    }
  }, [selectedFluid]);

  // Update roughness when material is selected
  useEffect(() => {
    if (selectedMaterial !== 'custom') {
      setRoughness(PIPE_MATERIALS[selectedMaterial].roughness);
    }
  }, [selectedMaterial]);

  // Update velocity/flow rate useEffect hook
  useEffect(() => {
    // Always perform internal calculations in metric units
    const diameterMetric = useMetricUnits ? parseFloat(diameter) : parseFloat(diameter) * 0.0254;
    const flowRateMetric = useMetricUnits ? parseFloat(flowRate) : parseFloat(flowRate) * 0.00006309;
    const velocityMetric = parseFloat(velocity); // Assuming velocity input is always m/s for now

    if (!isNaN(diameterMetric) && diameterMetric > 0) {
      const area = Math.PI * Math.pow(diameterMetric / 2, 2);

      if (calculationMethod === 'flowBased' && !isNaN(flowRateMetric) && flowRateMetric > 0) {
        const calculatedVelocity = flowRateMetric / area;
        // Update the velocity state (always store as m/s)
        setVelocity(calculatedVelocity.toFixed(4));
      } else if (calculationMethod === 'velocityBased' && !isNaN(velocityMetric) && velocityMetric > 0) {
        const calculatedFlowRate = area * velocityMetric;
        // Update the flowRate state based on the current unit system
        setFlowRate(
          useMetricUnits 
            ? calculatedFlowRate.toFixed(8) 
            : (calculatedFlowRate / 0.00006309).toFixed(2) // Convert back to gpm
        );
      }
    }
  // Add useMetricUnits to the dependency array
  }, [calculationMethod, flowRate, velocity, diameter, useMetricUnits]);

  // Calculate friction factor
  const calculateFrictionFactor = (reynolds, relativeRoughness) => {
    // For laminar flow
    if (reynolds < 2300) {
      return 64 / reynolds;
    } 
    // For transitional flow - blend between laminar and turbulent
    else if (reynolds >= 2300 && reynolds < 4000) {
      const laminarFactor = 64 / reynolds;
      
      // Colebrook-White equation approximation (Haaland equation)
      const term1 = -1.8 * Math.log10(
        Math.pow(relativeRoughness/3.7, 1.11) + 6.9/reynolds
      );
      const turbulentFactor = Math.pow(1/term1, 2);
      
      // Blend based on position in transitional region
      const blendFactor = (reynolds - 2300) / 1700;
      return laminarFactor * (1 - blendFactor) + turbulentFactor * blendFactor;
    }
    // For turbulent flow
    else {
      // Use a more accurate implementation of the Colebrook-White equation
      // Via the Serghides equation - more accurate than Haaland for all ranges
      const A = -2 * Math.log10(relativeRoughness/3.7 + 12/reynolds);
      const B = -2 * Math.log10(relativeRoughness/3.7 + 2.51*A/reynolds);
      const C = -2 * Math.log10(relativeRoughness/3.7 + 2.51*B/reynolds);
      
      return Math.pow((A - (B-A)*(B-A)/(C-2*B+A)), -2);
    }
  };

  // Add pipe fitting
  const addFitting = () => {
    setFittings([...fittings, { type: 'elbow', k: 0.9 }]);
  };

  // Remove pipe fitting
  const removeFitting = (index) => {
    const newFittings = [...fittings];
    newFittings.splice(index, 1);
    setFittings(newFittings);
  };

  // Update fitting value
  const updateFitting = (index, field, value) => {
    const newFittings = [...fittings];
    
    if (field === 'type') {
      // Set default K values based on fitting type
      switch(value) {
        case 'elbow': newFittings[index].k = 0.9; break;
        case 'tee': newFittings[index].k = 1.8; break;
        case 'valve': newFittings[index].k = 8.0; break;
        case 'entrance': newFittings[index].k = 0.5; break;
        case 'exit': newFittings[index].k = 1.0; break;
        default: newFittings[index].k = 0.9;
      }
    } else {
      newFittings[index][field] = value;
    }
    
    setFittings(newFittings);
  };

  const validateInputs = () => {
    const newErrors = {};
    
    // Validate common inputs
    if (!diameter) newErrors.diameter = 'Diameter is required';
    else if (parseFloat(diameter) <= 0) newErrors.diameter = 'Diameter must be positive';
    
    if (!length) newErrors.length = 'Length is required';
    else if (parseFloat(length) <= 0) newErrors.length = 'Length must be positive';
    
    if (!density) newErrors.density = 'Density is required';
    else if (parseFloat(density) <= 0) newErrors.density = 'Density must be positive';
    
    if (!viscosity) newErrors.viscosity = 'Viscosity is required';
    else if (parseFloat(viscosity) <= 0) newErrors.viscosity = 'Viscosity must be positive';
    
    if (!roughness) newErrors.roughness = 'Roughness is required';
    else if (parseFloat(roughness) < 0) newErrors.roughness = 'Roughness cannot be negative';
    else if (parseFloat(roughness) > 50) newErrors.roughness = 'Roughness value seems unusually high. Check units (mm)';

    // Method-specific validation
    if (calculationMethod === 'velocityBased') {
      if (!velocity) newErrors.velocity = 'Velocity is required';
      else if (parseFloat(velocity) <= 0) newErrors.velocity = 'Velocity must be positive';
    } else {
      if (!flowRate) newErrors.flowRate = 'Flow rate is required';
      else if (parseFloat(flowRate) <= 0) newErrors.flowRate = 'Flow rate must be positive';
    }
    
    if (!useCalculatedFriction && !frictionFactor) {
      newErrors.frictionFactor = 'Friction factor is required';
    } else if (!useCalculatedFriction && parseFloat(frictionFactor) <= 0) {
      newErrors.frictionFactor = 'Friction factor must be positive';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setCalculationMethod('velocityBased');
    setVelocity('');
    setFlowRate('');
    setDiameter('');
    setLength('');
    setSelectedFluid('custom');
    setDensity('');
    setViscosity('');
    setSelectedMaterial('custom');
    setRoughness('');
    setFrictionFactor('');
    setUseCalculatedFriction(true);
    setFittings([]);
    setResults(null);
    setErrors({});
  };

  const calculateHydraulics = (e) => {
    e.preventDefault();
    
    if (!validateInputs()) {
      return;
    }
    
    setIsCalculating(true);
    
    // Convert inputs to numbers
    let diameterNum, lengthNum, velocityNum, flowRateNum;
    
    // Before converting inputs to numbers, handle unit conversion internally
    if (!useMetricUnits) {
      // If using imperial, convert to metric for calculations
      diameterNum = parseFloat(diameter) * 0.0254; // inches to m
      lengthNum = parseFloat(length) * 0.3048;     // ft to m
      
      if (calculationMethod === 'flowBased') {
        flowRateNum = parseFloat(flowRate) * 0.00006309; // gpm to m³/s
        // Recalculate velocity based on metric flow rate and diameter
        const area = Math.PI * Math.pow(diameterNum / 2, 2);
        velocityNum = flowRateNum / area;
      } else {
        velocityNum = parseFloat(velocity);
        // Calculate flow rate in metric units
        const area = Math.PI * Math.pow(diameterNum / 2, 2);
        flowRateNum = area * velocityNum;
      }
    } else {
      // If metric, use values directly
      diameterNum = parseFloat(diameter);
      lengthNum = parseFloat(length);
      velocityNum = parseFloat(velocity);
      // Calculate or use flow rate
      const area = Math.PI * Math.pow(diameterNum / 2, 2);
      flowRateNum = calculationMethod === 'flowBased' ? parseFloat(flowRate) : area * velocityNum;
    }

    const densityNum = parseFloat(density);
    const viscosityNum = parseFloat(viscosity);
    const roughnessNum = parseFloat(roughness) / 1000; // Convert mm to m

    // Calculate cross-sectional area (A) in m² ONCE
    const area = Math.PI * Math.pow(diameterNum / 2, 2); 

    // Calculate Reynolds number
    const reynolds = (densityNum * velocityNum * diameterNum) / viscosityNum;
    
    // Calculate relative roughness
    const relativeRoughness = roughnessNum / diameterNum;
    
    // Determine friction factor
    let frictionFactorNum;
    if (useCalculatedFriction) {
      frictionFactorNum = calculateFrictionFactor(reynolds, relativeRoughness);
    } else {
      frictionFactorNum = parseFloat(frictionFactor);
    }
    
    
    // Calculate pressure drop (ΔP) using Darcy-Weisbach equation in Pascals
    const pressureDrop = frictionFactorNum * (lengthNum / diameterNum) * (densityNum * Math.pow(velocityNum, 2)) / 2;
    
    // Calculate head loss in meters
    const headLoss = pressureDrop / (densityNum * 9.81);
    
    // Calculate minor losses from fittings
    let totalKValue = 0;
    fittings.forEach(fitting => {
      totalKValue += parseFloat(fitting.k);
    });
    
    const minorLoss = (totalKValue * densityNum * Math.pow(velocityNum, 2)) / 2;
    const minorHeadLoss = minorLoss / (densityNum * 9.81);
    
    // Calculate total pressure drop and head loss
    const totalPressureDrop = pressureDrop + minorLoss;
    const totalHeadLoss = headLoss + minorHeadLoss;
    
    // Calculate wall shear stress in Pa
    const wallShearStress = frictionFactorNum * densityNum * Math.pow(velocityNum, 2) / 8;
    
    // Calculate power loss in Watts
    const powerLoss = totalPressureDrop * flowRateNum;

    // Determine flow regime
    let flowRegime;
    if (reynolds < 2300) {
      flowRegime = "Laminar";
    } else if (reynolds < 4000) {
      flowRegime = "Transitional";
    } else {
      flowRegime = "Turbulent";
    }

    // Add flow regime explanation
    let flowRegimeExplanation;
    if (reynolds < 2300) {
      flowRegimeExplanation = "Smooth, orderly flow with parallel streamlines. Viscous forces dominant.";
    } else if (reynolds < 4000) {
      flowRegimeExplanation = "Mixture of laminar and turbulent characteristics. Unpredictable behavior.";
    } else if (reynolds < 10000) {
      flowRegimeExplanation = "Fully turbulent flow. Inertial forces dominant.";
    } else {
      flowRegimeExplanation = "Highly turbulent flow with significant mixing and energy dissipation.";
    }
    
    setTimeout(() => {
      setResults({
        area: area.toFixed(6),
        flowRate: flowRateNum.toFixed(6),
        reynolds: reynolds.toFixed(0),
        flowRegime,
        flowRegimeExplanation,
        frictionFactor: frictionFactorNum.toFixed(6),
        relativeRoughness: relativeRoughness.toFixed(6),
        pressureDrop: pressureDrop.toFixed(2),
        headLoss: headLoss.toFixed(3),
        minorLoss: minorLoss.toFixed(2),
        minorHeadLoss: minorHeadLoss.toFixed(3),
        totalPressureDrop: totalPressureDrop.toFixed(2),
        totalHeadLoss: totalHeadLoss.toFixed(3),
        wallShearStress: wallShearStress.toFixed(2),
        powerLoss: powerLoss.toFixed(2),
      });
      setIsCalculating(false);
    }, 500); // Small delay to show loading state
  };

  // Add conversion helper functions
  const convertLength = (value, toMetric) => {
    if (!value) return '';
    return toMetric 
      ? (parseFloat(value) * 0.3048).toFixed(4) // ft to m
      : (parseFloat(value) / 0.3048).toFixed(4); // m to ft
  };

  const convertDiameter = (value, toMetric) => {
    if (!value) return '';
    return toMetric 
      ? (parseFloat(value) * 0.0254).toFixed(4) // inches to m
      : (parseFloat(value) / 0.0254).toFixed(4); // m to inches
  };

  // Add convertFlowRate helper function
  const convertFlowRate = (value, toMetric) => {
    if (!value) return '';
    // Convert between m³/s and gpm (gallons per minute)
    return toMetric 
      ? (parseFloat(value) * 0.00006309).toFixed(8) // gpm to m³/s
      : (parseFloat(value) / 0.00006309).toFixed(2); // m³/s to gpm
  };

  return (
    <div className="hydraulic-calculator">
      <h1>Advanced Hydraulic Calculator</h1>
      
      <div className="guide-toggle">
        <button 
          onClick={() => setShowGuide(!showGuide)}
          className="guide-button"
        >
          {showGuide ? 'Hide Guide' : 'Show Guide'}
        </button>
      </div>
      
      {showGuide && (
        <div className="calculator-guide">
          <h3>How to Use This Calculator</h3>
          <p>This calculator helps you analyze flow through pipes by calculating head loss, pressure drop, and other hydraulic parameters.</p>
          
          <h4>Step 1: Choose Your Calculation Method</h4>
          <p>Select whether you want to start with velocity or flow rate:</p>
          <ul>
            <li><strong>Velocity-based:</strong> Use when you know the flow velocity</li>
            <li><strong>Flow rate-based:</strong> Use when you know the volumetric flow rate</li>
          </ul>
          
          <h4>Step 2: Enter Pipe Parameters</h4>
          <ul>
            <li><strong>Diameter:</strong> Inner diameter of the pipe in meters</li>
            <li><strong>Length:</strong> Total pipe length in meters</li>
            <li><strong>Material:</strong> Select a common pipe material or enter custom roughness</li>
            <li><strong>Roughness:</strong> Surface roughness in millimeters</li>
          </ul>
          
          <h4>Step 3: Enter Fluid Properties</h4>
          <ul>
            <li><strong>Fluid Type:</strong> Select a common fluid or enter custom properties</li>
            <li><strong>Density:</strong> Fluid density in kg/m³</li>
            <li><strong>Viscosity:</strong> Dynamic viscosity in Pa·s</li>
            <li><strong>Velocity/Flow Rate:</strong> Depending on your calculation method</li>
          </ul>
          
          <h4>Step 4: Add Pipe Fittings (Optional)</h4>
          <p>Include minor losses from fittings like elbows, tees, and valves.</p>
          
          <h4>Key Terms</h4>
          <ul>
            <li><strong>Reynolds Number:</strong> Dimensionless number indicating flow regime (laminar, transitional, turbulent)</li>
            <li><strong>Friction Factor:</strong> Darcy friction factor used in head loss calculations</li>
            <li><strong>Head Loss:</strong> Energy loss expressed as equivalent fluid height (m)</li>
            <li><strong>Pressure Drop:</strong> Pressure difference between inlet and outlet (Pa)</li>
          </ul>

          <h4>Common Unit Conversions</h4>
          <ul>
            <li><strong>Length:</strong> 1 m = 3.28084 ft</li>
            <li><strong>Diameter:</strong> 1 inch = 25.4 mm</li>
            <li><strong>Flow Rate:</strong> 1 m³/s = 15,850 gpm (US)</li>
            <li><strong>Pressure:</strong> 1 kPa ≈ 0.145 psi</li>
            <li><strong>Dynamic Viscosity:</strong> 1 Pa·s = 1000 cP (centipoise)</li>
          </ul>
        </div>
      )}

      <div className="unit-toggle">
        <span>Units:</span>
        <div className="toggle-buttons">
          <button 
            className={useMetricUnits ? 'active' : ''}
            onClick={() => {
              if (!useMetricUnits) {
                // Convert from imperial to metric
                setDiameter(convertDiameter(diameter, true));
                setLength(convertLength(length, true));
                // If calculating from velocity, convert flow rate input
                if (calculationMethod === 'velocityBased') {
                  setFlowRate(convertFlowRate(flowRate, true));
                } 
                // If calculating from flow rate, clear velocity to trigger recalculation
                else {
                  setVelocity(''); 
                }
                setUseMetricUnits(true);
              }
            }}
          >
            Metric
          </button>
          <button 
            className={!useMetricUnits ? 'active' : ''}
            onClick={() => {
              if (useMetricUnits) {
                // Convert from metric to imperial
                setDiameter(convertDiameter(diameter, false));
                setLength(convertLength(length, false));
                // If calculating from velocity, convert flow rate input
                if (calculationMethod === 'velocityBased') {
                  setFlowRate(convertFlowRate(flowRate, false));
                } 
                // If calculating from flow rate, clear velocity to trigger recalculation
                else {
                  setVelocity(''); 
                }
                setUseMetricUnits(false);
              }
            }}
          >
            Imperial
          </button>
        </div>
      </div>

      <div className="calculator-tabs">
        <button 
          className={calculationMethod === 'velocityBased' ? 'active' : ''} 
          onClick={() => setCalculationMethod('velocityBased')}
        >
          Calculate from Velocity
        </button>
        <button 
          className={calculationMethod === 'flowBased' ? 'active' : ''} 
          onClick={() => setCalculationMethod('flowBased')}
        >
          Calculate from Flow Rate
        </button>
      </div>
      
      <div className="pipe-diagram">
        <div className="diagram-title">Pipe Flow Visualization</div>
        <div className="pipe-visual">
          <div className="pipe-inlet">
            <div className="flow-arrow"></div>
            <div className="pressure-indicator">P₁</div>
          </div>
          <div 
            className="pipe-body" 
            style={{
              height: `${Math.min(Math.max(parseFloat(diameter) * 100, 10), 40)}px`,
              backgroundColor: results?.flowRegime === 'Laminar' ? '#8ed1fc' : 
                               results?.flowRegime === 'Transitional' ? '#f9a825' : 
                               results?.flowRegime === 'Turbulent' ? '#e53935' : '#90caf9'
            }}
          >
            {fittings.length > 0 && (
              <div className="fittings-indicators">
                {fittings.map((_, i) => (
                  <div key={i} className="fitting-indicator" style={{left: `${20 + (60 * i / Math.max(fittings.length, 1))}%`}}></div>
                ))}
              </div>
            )}
          </div>
          <div className="pipe-outlet">
            <div className="flow-arrow"></div>
            <div className="pressure-indicator">P₂</div>
          </div>
        </div>
        <div className="diagram-legend">
          <div className="legend-item"><span className="color-box laminar"></span> Laminar Flow</div>
          <div className="legend-item"><span className="color-box transitional"></span> Transitional Flow</div>
          <div className="legend-item"><span className="color-box turbulent"></span> Turbulent Flow</div>
        </div>
      </div>

      <form onSubmit={calculateHydraulics}>
        <div className="calculator-sections">
          <div className="calculator-section">
            <h3>Pipe Parameters</h3>
            <div className="form-group">
              <label>Diameter ({useMetricUnits ? 'm' : 'inches'}):</label>
              <div className="input-with-tooltip">
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  value={diameter}
                  onChange={(e) => setDiameter(e.target.value)}
                  className={errors.diameter ? 'error' : ''}
                />
                <div className="tooltip">
                  <span className="tooltip-icon">?</span>
                  <span className="tooltip-text">Inner diameter of the pipe in meters. Common values range from 0.01m (10mm) to 1m.</span>
                </div>
              </div>
              {errors.diameter && <div className="error-message">{errors.diameter}</div>}
            </div>
            
            <div className="form-group">
              <label>Pipe Length ({useMetricUnits ? 'm' : 'ft'}):</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={length}
                onChange={(e) => setLength(e.target.value)}
                className={errors.length ? 'error' : ''}
              />
              {errors.length && <div className="error-message">{errors.length}</div>}
            </div>
            
            <div className="form-group">
              <label>Pipe Material:</label>
              <select 
                value={selectedMaterial} 
                onChange={(e) => setSelectedMaterial(e.target.value)}
              >
                <option value="custom">Custom...</option>
                {Object.keys(PIPE_MATERIALS).map(key => (
                  <option key={key} value={key}>{PIPE_MATERIALS[key].name}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label>Roughness (mm):</label>
              <input
                type="number"
                step="0.0001"
                min="0"
                value={roughness}
                onChange={(e) => setRoughness(e.target.value)}
                className={errors.roughness ? 'error' : ''}
              />
              {errors.roughness && <div className="error-message">{errors.roughness}</div>}
              <small>Typical values: PVC/Copper: 0.0015mm, Steel: 0.045mm, Cast Iron: 0.26mm</small>
            </div>
          </div>

          <div className="calculator-section">
            <h3>Fluid Properties</h3>
            
            <div className="form-group">
              <label>Fluid Type:</label>
              <select 
                value={selectedFluid} 
                onChange={(e) => setSelectedFluid(e.target.value)}
              >
                <option value="custom">Custom...</option>
                {Object.keys(FLUID_PRESETS).map(key => (
                  <option key={key} value={key}>{FLUID_PRESETS[key].name}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label>Fluid Density (kg/m³):</label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={density}
                onChange={(e) => setDensity(e.target.value)}
                className={errors.density ? 'error' : ''}
              />
              {errors.density && <div className="error-message">{errors.density}</div>}
            </div>
            
            <div className="form-group">
              <label>Dynamic Viscosity (Pa·s):</label>
              <input
                type="number"
                step="0.000001"
                min="0"
                value={viscosity}
                onChange={(e) => setViscosity(e.target.value)}
                className={errors.viscosity ? 'error' : ''}
              />
              {errors.viscosity && <div className="error-message">{errors.viscosity}</div>}
              <small>Water at 20°C: 0.001 Pa·s</small>
            </div>
            
            {calculationMethod === 'velocityBased' ? (
              <div className="form-group">
                <label>Velocity (m/s):</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={velocity}
                  onChange={(e) => setVelocity(e.target.value)}
                  className={errors.velocity ? 'error' : ''}
                />
                {errors.velocity && <div className="error-message">{errors.velocity}</div>}
              </div>
            ) : (
              <div className="form-group">
                <label>Flow Rate {useMetricUnits ? '(m³/s)' : '(gpm)'}:</label>
                <input
                  type="number"
                  step="0.00001"
                  min="0"
                  value={flowRate}
                  onChange={(e) => setFlowRate(e.target.value)}
                  className={errors.flowRate ? 'error' : ''}
                />
                {errors.flowRate && <div className="error-message">{errors.flowRate}</div>}
              </div>
            )}
          </div>
          
          <div className="calculator-section">
            <h3>Friction & Minor Losses</h3>
            
            <div className="form-group checkbox-group">
              <input
                type="checkbox"
                id="useCalculatedFriction"
                checked={useCalculatedFriction}
                onChange={(e) => setUseCalculatedFriction(e.target.checked)}
              />
              <label htmlFor="useCalculatedFriction">
                Calculate friction factor automatically
              </label>
            </div>
            
            {!useCalculatedFriction && (
              <div className="form-group">
                <label>Darcy Friction Factor (f):</label>
                <input
                  type="number"
                  step="0.0001"
                  min="0"
                  value={frictionFactor}
                  onChange={(e) => setFrictionFactor(e.target.value)}
                  className={errors.frictionFactor ? 'error' : ''}
                />
                {errors.frictionFactor && <div className="error-message">{errors.frictionFactor}</div>}
              </div>
            )}
            
            <h4>Pipe Fittings</h4>
            <button 
              type="button" 
              className="add-fitting-button"
              onClick={addFitting}
            >
              + Add Fitting
            </button>
            
            {fittings.map((fitting, index) => (
              <div key={index} className="fitting-row">
                <select
                  value={fitting.type}
                  onChange={(e) => updateFitting(index, 'type', e.target.value)}
                >
                  <option value="elbow">90° Elbow</option>
                  <option value="tee">Tee (Branch Flow)</option>
                  <option value="valve">Gate Valve</option>
                  <option value="entrance">Entrance</option>
                  <option value="exit">Exit</option>
                </select>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={fitting.k}
                  onChange={(e) => updateFitting(index, 'k', e.target.value)}
                  placeholder="K value"
                />
                <button 
                  type="button" 
                  className="remove-fitting-button"
                  onClick={() => removeFitting(index)}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
        
        <div className="button-group">
          <button 
            type="submit" 
            className={`submit-button ${isCalculating ? 'calculating' : ''}`}
            disabled={isCalculating}
          >
            {isCalculating ? (
              <div className="shimmer-wrapper">
                <span className="shimmer-text">Calculating...</span>
                <div className="shimmer-effect"></div>
              </div>
            ) : 'Calculate'}
          </button>
          <button 
            type="button" 
            onClick={resetForm}
            className="reset-button"
          >
            Reset
          </button>
        </div>
      </form>
      
      {results && (
        <div className="results">
          <h2>Calculation Results</h2>
          
          <div className="results-section">
            <h3>Basic Parameters</h3>
            <div className="result-item">
              <span>Cross-sectional Area:</span>
              <span>{results.area} m²</span>
            </div>
            <div className="result-item">
              <span>Flow Rate:</span>
              <span>
                {useMetricUnits 
                  ? `${results.flowRate} m³/s (${(parseFloat(results.flowRate) * 1000).toFixed(2)} L/s)`
                  : `${(parseFloat(results.flowRate) / 0.00006309).toFixed(2)} gpm`
                }
              </span>
            </div>
            <div className="result-item">
              <span>Velocity:</span>
              <span>
                {useMetricUnits 
                  ? `${velocity} m/s` 
                  : `${(parseFloat(velocity) * 3.28084).toFixed(3)} ft/s` // Convert m/s to ft/s
                }
              </span>
            </div>
          </div>
          
          <div className="results-section">
            <h3>Flow Characteristics</h3>
            <div className="result-item">
              <span>Reynolds Number:</span>
              <span className={`${results.flowRegime.toLowerCase()}`}>{results.reynolds}</span>
            </div>
            <div className="result-item">
              <span>Flow Regime:</span>
              <span className={`${results.flowRegime.toLowerCase()}`}>
                {results.flowRegime}
                <span className="result-note">
                  {results.flowRegimeExplanation}
                </span>
              </span>
            </div>
            <div className="result-item">
              <span>Friction Factor (f):</span>
              <span>{results.frictionFactor}</span>
            </div>
            <div className="result-item">
              <span>Relative Roughness (ε/D):</span>
              <span>{results.relativeRoughness}</span>
            </div>
          </div>
          
          <div className="results-section">
            <h3>Pressure & Head Loss</h3>
            <div className="result-item">
              <span>Major Pressure Loss:</span>
              <span>{results.pressureDrop} Pa ({(parseFloat(results.pressureDrop)/1000).toFixed(4)} kPa)</span>
            </div>
            <div className="result-item">
              <span>Major Head Loss:</span>
              <span>
                {useMetricUnits 
                  ? `${results.headLoss} m`
                  : `${(parseFloat(results.headLoss) * 3.28084).toFixed(3)} ft`
                }
              </span>
            </div>
            <div className="result-item">
              <span>Minor Pressure Loss:</span>
              <span>{results.minorLoss} Pa ({(parseFloat(results.minorLoss)/1000).toFixed(4)} kPa)</span>
            </div>
            <div className="result-item">
              <span>Minor Head Loss:</span>
              <span>
                {useMetricUnits 
                  ? `${results.minorHeadLoss} m`
                  : `${(parseFloat(results.minorHeadLoss) * 3.28084).toFixed(3)} ft`
                }
              </span>
            </div>
            <div className="result-item highlight">
              <span>Total Pressure Loss:</span>
              <span>{results.totalPressureDrop} Pa ({(parseFloat(results.totalPressureDrop)/1000).toFixed(4)} kPa)</span>
            </div>
            <div className="result-item highlight">
              <span>Total Head Loss:</span>
              <span>
                {useMetricUnits 
                  ? `${results.totalHeadLoss} m`
                  : `${(parseFloat(results.totalHeadLoss) * 3.28084).toFixed(3)} ft`
                }
              </span>
            </div>
          </div>
          
          <div className="results-section">
            <h3>Additional Information</h3>
            <div className="result-item">
              <span>Wall Shear Stress:</span>
              <span>{results.wallShearStress} Pa</span>
            </div>
            <div className="result-item">
              <span>Power Loss:</span>
              <span>{results.powerLoss} W ({(parseFloat(results.powerLoss)/1000).toFixed(4)} kW)</span>
            </div>
          </div>

          <div className="results-section">
            <h3>Performance Assessment</h3>
            <div className="result-item">
              <span>Flow Velocity Assessment:</span>
              {/* Use the metric velocity (state value) for assessment logic */}
              <span className={parseFloat(velocity) > 3 ? 'warning' : parseFloat(velocity) < 0.5 ? 'warning' : 'good'}>
                {parseFloat(velocity) < 0.5 ? 'Low - May cause sedimentation' :
                 parseFloat(velocity) <= 3 ? 'Optimal' : 'High - May cause erosion'}
              </span>
            </div>
            <div className="result-item">
              <span>Energy Efficiency:</span>
              <span className={parseFloat(results.powerLoss) > 100 ? 'warning' : 'good'}>
                {parseFloat(results.powerLoss) < 10 ? 'Excellent' :
                 parseFloat(results.powerLoss) < 50 ? 'Good' :
                 parseFloat(results.powerLoss) < 100 ? 'Fair' : 'Poor'}
              </span>
            </div>
            <div className="result-item">
              <span>Recommended Improvements:</span>
              <ul className="recommendations">
                {parseFloat(velocity) > 3 && (
                  <li>Consider increasing pipe diameter to reduce velocity</li>
                )}
                {parseFloat(velocity) < 0.5 && (
                  <li>Consider reducing pipe diameter to increase velocity (if feasible)</li>
                )}
                {parseFloat(results.minorLoss) > parseFloat(results.pressureDrop) && (
                  <li>Minor losses exceed major losses - try to reduce number of fittings</li>
                )}
                {parseFloat(results.frictionFactor) > 0.03 && (
                  <li>High friction - consider a smoother pipe material</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HydraulicCalculator;