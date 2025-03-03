// src/pages/PileDesignTool.js
import React, { useState } from 'react';
import './PileDesignTool.css';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  BarElement,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  BarElement,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend
);

const PileDesignTool = () => {
  // State Definitions
  const [input, setInput] = useState({
    // Project Information
    projectName: '',
    location: '',
    
    // Structural Loads
    axialCompression: '',  // kN (renamed from deadLoad for clarity)
    lateralLoad: '',       // kN (renamed from liveLoad)
    momentLoad: '',        // kN-m (added for moment consideration)
    
    // Geotechnical Data
    groundwaterLevel: '',  // m below ground surface
    soilLayers: [
      { 
        depth: 0,          // top depth of layer (m)
        thickness: '',     // thickness of layer (m)
        soilType: 'clay',  // clay, sand, silt, or rock
        description: '',   // text description
        unitWeight: '',    // kN/m³
        cohesion: '',      // kPa (for cohesive soils)
        frictionAngle: '', // degrees (for granular soils)
        SPT_N: '',         // Standard Penetration Test N-value
        undrained_shear_strength: '' // kPa (for clay)
      }
    ],

    // Pile Properties
    pileType: 'driven-concrete', // Options: driven-concrete, driven-steel, bored, CFA, etc.
    pileCrossSectionType: 'circular', // circular, square, H-section
    pileDiameter: '',      // m (or width for square piles)
    pileLength: '',        // m
    embedmentLength: '',   // m (actual length in contact with soil)
    pileSpacing: '',       // m
    numberOfPiles: 1,
    pileArrangement: '1x1', // e.g., "2x2", "3x3" etc.
    
    // Material Properties
    concreteFck: '',       // MPa (for concrete piles)
    steelFy: '',           // MPa (for steel piles)
    
    // Design Codes
    designCode: 'Eurocode7', // Options: Eurocode7, AASHTO, IS-2911, etc.
    
    // Analysis Method
    skinFrictionMethod: 'beta-method', // Options: alpha-method, beta-method, lambda-method
    endBearingMethod: 'meyerhof',      // Options: meyerhof, vesic, coyle-castello
    
    // Safety Factors
    partialFactorSkin: 1.3,
    partialFactorBase: 1.5,
    partialFactorMaterial: 1.15,
  });

  const [results, setResults] = useState({
    Q_skin: null,          // kN (skin friction capacity)
    Q_end: null,           // kN (end bearing capacity)
    Q_ult: null,           // kN (ultimate capacity)
    Q_allow: null,         // kN (allowable capacity after applying factors)
    settlement: null,      // mm
    groupEfficiency: null, // ratio
    lateralCapacity: null, // kN
    structuralIntegrity: null, // Pass/Fail
    loadDistribution: [],  // Array of values for load distribution along pile
    momentAndShear: [],    // Array for moment and shear distribution
    depthPoints: [],       // Array of depth points for charts
  });

  const [activeTab, setActiveTab] = useState('input');
  const [calculationMessages, setCalculationMessages] = useState([]);

  // Handle Input Changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setInput({
      ...input,
      [name]: value,
    });
  };

  // Handle Soil Layers Change
  const handleSoilLayerChange = (index, e) => {
    const { name, value } = e.target;
    const updatedSoilLayers = input.soilLayers.map((layer, idx) => {
      if (idx === index) {
        return { ...layer, [name]: value };
      }
      return layer;
    });
    setInput({ ...input, soilLayers: updatedSoilLayers });
  };

  // Add Soil Layer
  const addSoilLayer = () => {
    // Use the bottom depth of the last layer as the top depth of the new layer
    const lastLayerBottom = input.soilLayers.length > 0 
      ? parseFloat(input.soilLayers[input.soilLayers.length - 1].depth) + 
        parseFloat(input.soilLayers[input.soilLayers.length - 1].thickness || 0)
      : 0;

    const newLayer = {
      depth: lastLayerBottom,
      thickness: '',
      soilType: 'clay',
      description: '',
      unitWeight: '',
      cohesion: '',
      frictionAngle: '',
      SPT_N: '',
      undrained_shear_strength: ''
    };
    
    setInput({
      ...input,
      soilLayers: [...input.soilLayers, newLayer]
    });
  };

  // Remove Soil Layer
  const removeSoilLayer = (index) => {
    if (input.soilLayers.length > 1) {
      const updatedLayers = input.soilLayers.filter((_, idx) => idx !== index);
      setInput({ ...input, soilLayers: updatedLayers });
    } else {
      alert("At least one soil layer is required.");
    }
  };

  // Calculate Skin Friction Capacity
  const calculateSkinFriction = () => {
    let Q_skin = 0;
    const { pileType, pileDiameter, pileLength, soilLayers, skinFrictionMethod } = input;
    
    // Convert diameter from m to mm for calculations
    const diameter = parseFloat(pileDiameter);
    const perimeter = Math.PI * diameter; // for circular piles
    
    // Calculate skin friction for each soil layer that the pile passes through
    soilLayers.forEach((layer, index) => {
      // Calculate the thickness of soil in contact with the pile
      const layerTop = parseFloat(layer.depth);
      const layerThickness = parseFloat(layer.thickness);
      const layerBottom = layerTop + layerThickness;
      
      // Skip if layer is above the pile or pile doesn't reach this layer
      if (layerBottom <= 0 || layerTop >= parseFloat(pileLength)) return;
      
      // Calculate effective layer thickness in contact with pile
      const effectiveTop = Math.max(layerTop, 0);
      const effectiveBottom = Math.min(layerBottom, parseFloat(pileLength));
      const effectiveThickness = effectiveBottom - effectiveTop;
      
      let unitSkinFriction = 0; // kPa
      
      // Different methods for calculating unit skin friction
      if (skinFrictionMethod === 'alpha-method' && layer.soilType === 'clay') {
        // Alpha method for cohesive soils
        const alpha = 0.55; // Simplified, should depend on undrained shear strength
        unitSkinFriction = alpha * parseFloat(layer.undrained_shear_strength);
      } else if (skinFrictionMethod === 'beta-method') {
        // Beta method for all soil types
        const K = 0.8; // Earth pressure coefficient (simplified)
        const frictionAngle = parseFloat(layer.frictionAngle) || 30;
        const sigma_v = parseFloat(layer.unitWeight) * ((effectiveTop + effectiveBottom) / 2); // Average vertical stress
        
        // Beta method formula: fs = K * sigma_v * tan(φ)
        unitSkinFriction = K * sigma_v * Math.tan(frictionAngle * Math.PI / 180);
      } else if (skinFrictionMethod === 'lambda-method') {
        // Lambda method for mixed soils
        const lambda = 0.3; // Simplified lambda value
        const sigma_v = parseFloat(layer.unitWeight) * ((effectiveTop + effectiveBottom) / 2);
        const cohesion = parseFloat(layer.cohesion) || 0;
        unitSkinFriction = lambda * (sigma_v + 2 * cohesion);
      }
      
      // Skin friction contribution from this layer
      const layerSkinFriction = unitSkinFriction * perimeter * effectiveThickness;
      Q_skin += layerSkinFriction;
    });
    
    return Q_skin;
  };

  // Calculate End Bearing Capacity
  const calculateEndBearing = () => {
    const { pileType, pileDiameter, pileLength, soilLayers, endBearingMethod } = input;
    
    // Find the soil layer at the pile tip
    let tipLayer = null;
    let accumulatedDepth = 0;
    
    for (const layer of soilLayers) {
      accumulatedDepth += parseFloat(layer.thickness);
      if (accumulatedDepth >= parseFloat(pileLength)) {
        tipLayer = layer;
        break;
      }
    }
    
    if (!tipLayer) return 0;
    
    const diameter = parseFloat(pileDiameter);
    const area = Math.PI * Math.pow(diameter / 2, 2); // End area of pile (m²)
    
    let unitEndBearing = 0; // kPa
    
    // Different methods for end bearing calculation
    if (endBearingMethod === 'meyerhof') {
      if (tipLayer.soilType === 'clay') {
        // For cohesive soils (clays)
        const Nc = 9; // Bearing capacity factor
        unitEndBearing = Nc * parseFloat(tipLayer.undrained_shear_strength);
      } else {
        // For cohesionless soils (sands)
        const Nq = Math.pow(Math.E, Math.PI * Math.tan(parseFloat(tipLayer.frictionAngle) * Math.PI / 180)) * 
                  Math.pow(Math.tan(45 + parseFloat(tipLayer.frictionAngle) / 2 * Math.PI / 180), 2);
        const sigma_v = parseFloat(tipLayer.unitWeight) * parseFloat(pileLength);
        unitEndBearing = sigma_v * Nq;
      }
    } else if (endBearingMethod === 'vesic') {
      // Vesic method
      // (Simplified implementation)
      if (tipLayer.soilType === 'clay') {
        unitEndBearing = 9 * parseFloat(tipLayer.undrained_shear_strength);
      } else {
        const Nq = Math.exp(Math.PI * Math.tan(parseFloat(tipLayer.frictionAngle) * Math.PI / 180)) * 
                  Math.pow(Math.tan(45 + parseFloat(tipLayer.frictionAngle) / 2 * Math.PI / 180), 2);
        const sigma_v = parseFloat(tipLayer.unitWeight) * parseFloat(pileLength);
        unitEndBearing = sigma_v * Nq;
      }
    }
    
    const Q_end = unitEndBearing * area;
    return Q_end;
  };

  // Calculate Group Efficiency
  const calculateGroupEfficiency = () => {
    const { numberOfPiles, pileSpacing, pileDiameter, pileArrangement } = input;
    
    if (parseInt(numberOfPiles) <= 1) return 1.0;
    
    // Parse the pile arrangement (e.g., "2x3")
    const [rows, cols] = pileArrangement.split('x').map(Number);
    
    // Using the Converse-Labarre equation for group efficiency
    const theta = Math.atan(parseFloat(pileDiameter) / parseFloat(pileSpacing)) * (180 / Math.PI);
    const efficiency = 1 - ((theta * (rows + cols - 2)) / (90 * rows * cols));
    
    return Math.max(0.7, Math.min(1.0, efficiency)); // Typically between 0.7 and 1.0
  };

  // Calculate Settlement
  const calculateSettlement = () => {
    const { pileDiameter, pileLength, axialCompression, soilLayers } = input;
    
    // Elastic shortening of pile
    const diameter = parseFloat(pileDiameter);
    const area = Math.PI * Math.pow(diameter / 2, 2);
    const E_pile = 30000000; // Simplified Young's modulus for concrete pile (kPa)
    const load = parseFloat(axialCompression);
    const length = parseFloat(pileLength);
    
    const elasticSettlement = (load * length) / (area * E_pile) * 1000; // Convert to mm
    
    // Soil settlement (simplified)
    // This is a very simplified approach - in practice, more complex methods are used
    const avgSPT_N = soilLayers.reduce((sum, layer) => sum + parseFloat(layer.SPT_N || 10), 0) / soilLayers.length;
    const soilSettlement = load / (avgSPT_N * area * 10) * 1000; // Simplified relation, convert to mm
    
    return elasticSettlement + soilSettlement;
  };

  // Calculate Lateral Capacity
  const calculateLateralCapacity = () => {
    const { pileDiameter, pileLength, soilLayers } = input;
    
    const diameter = parseFloat(pileDiameter);
    const length = parseFloat(pileLength);
    
    // Find average soil properties
    let avgCohesion = 0;
    let avgFrictionAngle = 0;
    let count = 0;
    
    soilLayers.forEach(layer => {
      if (parseFloat(layer.depth) + parseFloat(layer.thickness) <= length) {
        avgCohesion += parseFloat(layer.cohesion || 0);
        avgFrictionAngle += parseFloat(layer.frictionAngle || 0);
        count++;
      }
    });
    
    avgCohesion /= count || 1;
    avgFrictionAngle /= count || 1;
    
    // Simplified Broms method for lateral capacity
    let lateralCapacity = 0;
    
    if (avgCohesion > 0) {
      // Cohesive soils (clay)
      lateralCapacity = 9 * avgCohesion * diameter * length;
    } else {
      // Cohesionless soils (sand)
      const Kp = Math.pow(Math.tan(45 + avgFrictionAngle / 2 * Math.PI / 180), 2); // Passive earth pressure coefficient
      lateralCapacity = 0.5 * Kp * diameter * Math.pow(length, 2);
    }
    
    return lateralCapacity;
  };

  // Main calculation function
  const calculatePileDesign = () => {
    // Validate inputs first
    if (!validateInputs()) return;
    
    // Clear previous messages
    setCalculationMessages([]);
    
    // Calculate capacities
    const Q_skin = calculateSkinFriction();
    const Q_end = calculateEndBearing();
    const Q_ult = Q_skin + Q_end;
    
    // Apply safety factors
    const Q_allow = Q_skin / parseFloat(input.partialFactorSkin) + Q_end / parseFloat(input.partialFactorBase);
    
    // Calculate group efficiency
    const groupEfficiency = calculateGroupEfficiency();
    const Q_group = Q_allow * parseInt(input.numberOfPiles) * groupEfficiency;
    
    // Calculate settlement
    const settlement = calculateSettlement();
    
    // Calculate lateral capacity
    const lateralCapacity = calculateLateralCapacity();
    
    // Generate load distribution along pile for chart
    const depthPoints = [];
    const loadDistribution = [];
    
    const pileLength = parseFloat(input.pileLength);
    const steps = 20;
    
    for (let i = 0; i <= steps; i++) {
      const depth = (i / steps) * pileLength;
      depthPoints.push(depth);
      
      // Calculate cumulative skin friction to this depth (simplified)
      let cumulativeSkinFriction = (Q_skin * depth) / pileLength;
      
      // Add end bearing only at the bottom
      if (i === steps) {
        cumulativeSkinFriction += Q_end;
      }
      
      loadDistribution.push(cumulativeSkinFriction);
    }
    
    // Generate moment and shear data for lateral load case
    const momentAndShear = [];
    const lateralLoad = parseFloat(input.lateralLoad) || 0;
    
    for (let i = 0; i <= steps; i++) {
      const depth = (i / steps) * pileLength;
      const moment = lateralLoad * (pileLength - depth);
      const shear = lateralLoad;
      
      momentAndShear.push({ depth, moment, shear });
    }
    
    // Check if design load is satisfied
    const designLoad = parseFloat(input.axialCompression);
    
    if (Q_allow < designLoad) {
      setCalculationMessages(prev => [...prev, {
        type: 'warning',
        message: `WARNING: Pile capacity (${Q_allow.toFixed(2)} kN) is less than design load (${designLoad.toFixed(2)} kN).`
      }]);
    }
    
    // Check settlement criteria
    if (settlement > 25) { // Assuming 25mm as maximum allowable settlement
      setCalculationMessages(prev => [...prev, {
        type: 'warning',
        message: `WARNING: Calculated settlement (${settlement.toFixed(2)} mm) exceeds typical limit of 25 mm.`
      }]);
    }
    
    // Set results
    setResults({
      Q_skin: Q_skin,
      Q_end: Q_end,
      Q_ult: Q_ult,
      Q_allow: Q_allow,
      Q_group: Q_group,
      settlement: settlement,
      groupEfficiency: groupEfficiency,
      lateralCapacity: lateralCapacity,
      loadDistribution: loadDistribution,
      momentAndShear: momentAndShear,
      depthPoints: depthPoints,
    });
    
    // Switch to results tab
    setActiveTab('results');
  };

  // Validate inputs
  const validateInputs = () => {
    const requiredFields = [
      'pileDiameter', 
      'pileLength', 
      'axialCompression'
    ];
    
    for (const field of requiredFields) {
      if (!input[field]) {
        alert(`Please enter a value for ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
        return false;
      }
    }
    
    if (input.soilLayers.length === 0) {
      alert('Please add at least one soil layer');
      return false;
    }
    
    for (const layer of input.soilLayers) {
      if (!layer.thickness || !layer.unitWeight) {
        alert('Each soil layer must have a thickness and unit weight');
        return false;
      }
      
      if (layer.soilType === 'clay' && !layer.undrained_shear_strength) {
        alert('Clay layers must have undrained shear strength');
        return false;
      }
      
      if (layer.soilType === 'sand' && !layer.frictionAngle) {
        alert('Sand layers must have friction angle');
        return false;
      }
    }
    
    return true;
  };

  // Chart configurations
  const loadDistributionChartData = {
    labels: results.depthPoints?.map(d => d.toFixed(1)),
    datasets: [
      {
        label: 'Load Distribution (kN)',
        data: results.loadDistribution,
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.1
      }
    ]
  };

  const loadDistributionChartOptions = {
    scales: {
      x: {
        title: {
          display: true,
          text: 'Depth (m)'
        }
      },
      y: {
        title: {
          display: true,
          text: 'Capacity (kN)'
        }
      }
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: function(context) {
            return `Capacity: ${context.raw.toFixed(2)} kN at depth ${context.label} m`;
          }
        }
      }
    }
  };

  return (
    <div className="pile-design-tool">
      <h1>Pile Design Tool</h1>
      
      <div className="tab-navigation">
        <button 
          className={activeTab === 'input' ? 'active' : ''} 
          onClick={() => setActiveTab('input')}>
          Input Data
        </button>
        <button 
          className={activeTab === 'results' ? 'active' : ''} 
          onClick={() => setActiveTab('results')}>
          Results
        </button>
      </div>
      
      {activeTab === 'input' && (
        <div className="input-section">
          <h2>Project Information</h2>
          <div className="form-group">
            <label>Project Name:</label>
            <input 
              type="text" 
              name="projectName" 
              value={input.projectName} 
              onChange={handleChange} 
            />
          </div>
          
          <div className="form-group">
            <label>Location:</label>
            <input 
              type="text" 
              name="location" 
              value={input.location} 
              onChange={handleChange} 
            />
          </div>
          
          <h2>Loads</h2>
          <div className="form-row">
            <div className="form-group">
              <label>Axial Compression (kN):</label>
              <input 
                type="number" 
                name="axialCompression" 
                value={input.axialCompression} 
                onChange={handleChange} 
                required
              />
            </div>
            <div className="form-group">
              <label>Lateral Load (kN):</label>
              <input 
                type="number" 
                name="lateralLoad" 
                value={input.lateralLoad} 
                onChange={handleChange} 
              />
            </div>
            <div className="form-group">
              <label>Moment Load (kN·m):</label>
              <input 
                type="number" 
                name="momentLoad" 
                value={input.momentLoad} 
                onChange={handleChange} 
              />
            </div>
          </div>
          
          <h2>Pile Properties</h2>
          <div className="form-row">
            <div className="form-group">
              <label>Pile Type:</label>
              <select name="pileType" value={input.pileType} onChange={handleChange} required>
                <option value="driven-concrete">Driven Concrete Pile</option>
                <option value="driven-steel">Driven Steel Pile</option>
                <option value="bored">Bored Cast-in-place Pile</option>
                <option value="CFA">Continuous Flight Auger (CFA) Pile</option>
                <option value="H-pile">H-Pile</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Cross Section:</label>
              <select name="pileCrossSectionType" value={input.pileCrossSectionType} onChange={handleChange} required>
                <option value="circular">Circular</option>
                <option value="square">Square</option>
                <option value="H-section">H-Section</option>
              </select>
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Diameter/Width (m):</label>
              <input 
                type="number" 
                name="pileDiameter" 
                value={input.pileDiameter} 
                onChange={handleChange} 
                required
              />
            </div>
            
            <div className="form-group">
              <label>Pile Length (m):</label>
              <input 
                type="number" 
                name="pileLength" 
                value={input.pileLength} 
                onChange={handleChange} 
                required
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Number of Piles:</label>
              <input 
                type="number" 
                name="numberOfPiles" 
                value={input.numberOfPiles} 
                onChange={handleChange} 
                min="1"
              />
            </div>
            
            <div className="form-group">
              <label>Pile Arrangement (e.g., "2x3"):</label>
              <input 
                type="text" 
                name="pileArrangement" 
                value={input.pileArrangement} 
                onChange={handleChange} 
                placeholder="e.g., 2x2"
              />
            </div>
            
            <div className="form-group">
              <label>Pile Spacing (m):</label>
              <input 
                type="number" 
                name="pileSpacing" 
                value={input.pileSpacing} 
                onChange={handleChange} 
              />
            </div>
          </div>
          
          <h2>Design Methods</h2>
          <div className="form-row">
            <div className="form-group">
              <label>Design Code:</label>
              <select name="designCode" value={input.designCode} onChange={handleChange}>
                <option value="Eurocode7">Eurocode 7</option>
                <option value="AASHTO">AASHTO</option>
                <option value="IS-2911">IS 2911</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Skin Friction Method:</label>
              <select name="skinFrictionMethod" value={input.skinFrictionMethod} onChange={handleChange}>
                <option value="alpha-method">α-method (Clays)</option>
                <option value="beta-method">β-method (All Soils)</option>
                <option value="lambda-method">λ-method (Mixed Soils)</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>End Bearing Method:</label>
              <select name="endBearingMethod" value={input.endBearingMethod} onChange={handleChange}>
                <option value="meyerhof">Meyerhof</option>
                <option value="vesic">Vesic</option>
                <option value="coyle-castello">Coyle and Castello</option>
              </select>
            </div>
          </div>
          
          <h2>Soil Layers</h2>
          <p>Enter soil layers from top to bottom:</p>
          
          <div className="soil-layers">
            {input.soilLayers.map((layer, index) => (
              <div key={index} className="soil-layer">
                <h4>Layer {index + 1}</h4>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Depth from Surface (m):</label>
                    <input 
                      type="number" 
                      name="depth" 
                      value={layer.depth} 
                      onChange={(e) => handleSoilLayerChange(index, e)} 
                      readOnly
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Layer Thickness (m):</label>
                    <input 
                      type="number" 
                      name="thickness" 
                      value={layer.thickness} 
                      onChange={(e) => handleSoilLayerChange(index, e)} 
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Soil Type:</label>
                    <select 
                      name="soilType" 
                      value={layer.soilType} 
                      onChange={(e) => handleSoilLayerChange(index, e)}
                    >
                      <option value="clay">Clay</option>
                      <option value="sand">Sand</option>
                      <option value="silt">Silt</option>
                      <option value="rock">Rock</option>
                    </select>
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Unit Weight (kN/m³):</label>
                    <input 
                      type="number" 
                      name="unitWeight" 
                      value={layer.unitWeight} 
                      onChange={(e) => handleSoilLayerChange(index, e)} 
                      required
                    />
                  </div>
                  
                  {(layer.soilType === 'clay' || layer.soilType === 'silt') && (
                    <div className="form-group">
                      <label>Undrained Shear Strength (kPa):</label>
                      <input 
                        type="number" 
                        name="undrained_shear_strength" 
                        value={layer.undrained_shear_strength} 
                        onChange={(e) => handleSoilLayerChange(index, e)} 
                      />
                    </div>
                  )}
                  
                  {(layer.soilType === 'sand' || layer.soilType === 'silt') && (
                    <div className="form-group">
                      <label>Friction Angle (°):</label>
                      <input 
                        type="number" 
                        name="frictionAngle" 
                        value={layer.frictionAngle} 
                        onChange={(e) => handleSoilLayerChange(index, e)} 
                      />
                    </div>
                  )}

                  <div className="form-group">
                    <label>SPT N-Value:</label>
                    <input 
                      type="number" 
                      name="SPT_N" 
                      value={layer.SPT_N} 
                      onChange={(e) => handleSoilLayerChange(index, e)} 
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label>Description:</label>
                  <input 
                    type="text" 
                    name="description" 
                    value={layer.description} 
                    onChange={(e) => handleSoilLayerChange(index, e)} 
                  />
                </div>

                {index > 0 && (
                  <button 
                    type="button" 
                    className="remove-layer-btn"
                    onClick={() => removeSoilLayer(index)}
                  >
                    Remove Layer
                  </button>
                )}
              </div>
            ))}
            
            <button 
              type="button" 
              className="add-layer-btn"
              onClick={addSoilLayer}
            >
              Add Soil Layer
            </button>
          </div>

          <h2>Safety Factors</h2>
          <div className="form-row">
            <div className="form-group">
              <label>Partial Factor for Skin Friction:</label>
              <input 
                type="number" 
                name="partialFactorSkin" 
                value={input.partialFactorSkin} 
                onChange={handleChange} 
                step="0.05"
              />
            </div>
            <div className="form-group">
              <label>Partial Factor for End Bearing:</label>
              <input 
                type="number" 
                name="partialFactorBase" 
                value={input.partialFactorBase} 
                onChange={handleChange} 
                step="0.05"
              />
            </div>
            <div className="form-group">
              <label>Partial Factor for Material:</label>
              <input 
                type="number" 
                name="partialFactorMaterial" 
                value={input.partialFactorMaterial} 
                onChange={handleChange} 
                step="0.05"
              />
            </div>
          </div>

          <div className="form-actions">
            <button 
              type="button" 
              className="calculate-btn"
              onClick={calculatePileDesign}
            >
              Calculate Pile Design
            </button>
          </div>
        </div>
      )}
      
      {activeTab === 'results' && (
        <div className="results-section">
          {/* Display any warning messages */}
          {calculationMessages.length > 0 && (
            <div className="calculation-messages">
              {calculationMessages.map((msg, index) => (
                <div 
                  key={index} 
                  className={`message ${msg.type}`}
                >
                  {msg.message}
                </div>
              ))}
            </div>
          )}
          
          <h2>Calculation Results</h2>
          
          <div className="results-grid">
            <div className="result-group">
              <h3>Pile Capacity</h3>
              <div className="result-item">
                <span className="label">Skin Friction Capacity:</span>
                <span className="value">{results.Q_skin?.toFixed(2)} kN</span>
              </div>
              <div className="result-item">
                <span className="label">End Bearing Capacity:</span>
                <span className="value">{results.Q_end?.toFixed(2)} kN</span>
              </div>
              <div className="result-item">
                <span className="label">Ultimate Capacity:</span>
                <span className="value">{results.Q_ult?.toFixed(2)} kN</span>
              </div>
              <div className="result-item highlight">
                <span className="label">Allowable Capacity:</span>
                <span className="value">{results.Q_allow?.toFixed(2)} kN</span>
              </div>
            </div>
            
            <div className="result-group">
              <h3>Group Effects</h3>
              <div className="result-item">
                <span className="label">Group Efficiency:</span>
                <span className="value">{(results.groupEfficiency * 100)?.toFixed(1)}%</span>
              </div>
              <div className="result-item">
                <span className="label">Group Capacity:</span>
                <span className="value">{results.Q_group?.toFixed(2)} kN</span>
              </div>
            </div>
            
            <div className="result-group">
              <h3>Settlement & Lateral Analysis</h3>
              <div className="result-item">
                <span className="label">Estimated Settlement:</span>
                <span className="value">{results.settlement?.toFixed(2)} mm</span>
              </div>
              <div className="result-item">
                <span className="label">Lateral Capacity:</span>
                <span className="value">{results.lateralCapacity?.toFixed(2)} kN</span>
              </div>
            </div>
          </div>
          
          <h3>Load Distribution Along Pile Length</h3>
          <div className="chart-container">
            <Line 
              data={loadDistributionChartData}
              options={loadDistributionChartOptions}
              height={300}
            />
          </div>

          <div className="report-actions">
            <button 
              type="button" 
              className="modify-btn"
              onClick={() => setActiveTab('input')}
            >
              Modify Input Parameters
            </button>
            <button 
              type="button" 
              className="export-btn"
              onClick={() => window.print()}
            >
              Export as PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PileDesignTool;