// src/pages/PileDesignTool.js
import React, { useState, useRef } from 'react';
import './PileDesignTool.css';
import { Bar, Line } from 'react-chartjs-2';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  Chart as ChartJS,
  BarElement,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  BarController,
  Title
} from 'chart.js';

ChartJS.register(
  BarElement,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  BarController,
  Title
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
  const [momentShearChartData, setMomentShearChartData] = useState(null);
  const [showGuide, setShowGuide] = useState(false);
  const [showAdvancedParams, setShowAdvancedParams] = useState(false);
  const resultsRef = useRef(null); // Add this ref
  const [isExporting, setIsExporting] = useState(false); // Optional loading state

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
    const { pileDiameter, pileLength, soilLayers, skinFrictionMethod, groundwaterLevel } = input;
    const diameter = parseFloat(pileDiameter);
    const perimeter = Math.PI * diameter; 
    const gwl = parseFloat(groundwaterLevel) || parseFloat(pileLength) + 1; // Assume GWL is below pile tip if not specified
  
    soilLayers.forEach((layer, index) => {
      const layerTop = parseFloat(layer.depth);
      const layerThickness = parseFloat(layer.thickness);
      const layerBottom = layerTop + layerThickness;
      
      if (layerBottom <= 0 || layerTop >= parseFloat(pileLength)) return;
      
      const effectiveTop = Math.max(layerTop, 0);
      const effectiveBottom = Math.min(layerBottom, parseFloat(pileLength));
      const effectiveThickness = effectiveBottom - effectiveTop;
      const midpointDepth = (effectiveTop + effectiveBottom) / 2;
  
      let unitSkinFriction = 0; // kPa
      const unitWeight = parseFloat(layer.unitWeight);
      const waterUnitWeight = 9.81; // kN/m³
  
      // Calculate effective vertical stress at midpoint of pile segment in this layer
      let sigma_v_effective = 0;
      if (midpointDepth <= gwl) {
        // Above groundwater table
        sigma_v_effective = unitWeight * midpointDepth;
      } else {
        // Below groundwater table
        const saturatedUnitWeight = unitWeight; // Assuming input is saturated unit weight if below GWL
        const buoyantUnitWeight = saturatedUnitWeight - waterUnitWeight;
        sigma_v_effective = (unitWeight * gwl) + (buoyantUnitWeight * (midpointDepth - gwl));
      }
      sigma_v_effective = Math.max(0, sigma_v_effective); // Ensure non-negative
  
      if (skinFrictionMethod === 'alpha-method' && layer.soilType === 'clay') {
        const Su = parseFloat(layer.undrained_shear_strength);
        // Basic Alpha correlation (Ref: Tomlinson) - Needs refinement based on Su/sigma'_v
        let alpha = 0.5; 
        if (Su <= 25) alpha = 1.0;
        else if (Su <= 50) alpha = 0.9;
        else if (Su <= 100) alpha = 0.75;
        else if (Su <= 150) alpha = 0.6;
        else alpha = 0.5;
        unitSkinFriction = alpha * Su;
      } else if (skinFrictionMethod === 'beta-method') {
        // Beta method: fs = β * σ'_v = K * tan(δ) * σ'_v
        const K = 0.8; // Lateral earth pressure coefficient (Simplified - could relate to OCR or pile type)
        const frictionAngle = parseFloat(layer.frictionAngle) || 30; // Soil internal friction angle
        const delta = frictionAngle * (2/3); // Interface friction angle (Simplified)
        
        unitSkinFriction = K * Math.tan(delta * Math.PI / 180) * sigma_v_effective;
      } else if (skinFrictionMethod === 'lambda-method') {
        // Lambda method (typically for clays)
        const lambda = 0.3; // Simplified lambda value (Could depend on pile length)
        const Su = parseFloat(layer.undrained_shear_strength) || (parseFloat(layer.cohesion) || 0); // Use Su or cohesion
        unitSkinFriction = lambda * (sigma_v_effective + 2 * Su);
      }
      
      // Limit skin friction (common practice, e.g., 100 kPa, but varies)
      unitSkinFriction = Math.min(unitSkinFriction, 120); 
  
      const layerSkinFriction = unitSkinFriction * perimeter * effectiveThickness;
      Q_skin += layerSkinFriction;
    });
    
    return Q_skin;
  };
  
  // Calculate End Bearing Capacity
  const calculateEndBearing = () => {
    const { pileDiameter, pileLength, soilLayers, endBearingMethod, groundwaterLevel } = input;
    const pileLen = parseFloat(pileLength); // Rename here as well
    
    let tipLayer = null;
    let depthToTip = 0;
    let accumulatedDepth = 0;
    for (const layer of soilLayers) {
      const thickness = parseFloat(layer.thickness);
      if (accumulatedDepth + thickness >= pileLen) {
        tipLayer = layer;
        depthToTip = pileLen; // Depth to pile tip
        break;
      }
      accumulatedDepth += thickness;
    }
    
    if (!tipLayer) return 0;
    
    const diameter = parseFloat(pileDiameter);
    const area = Math.PI * Math.pow(diameter / 2, 2); 
    const gwl = parseFloat(groundwaterLevel) || pileLen + 1;
    const waterUnitWeight = 9.81;
  
    // Calculate effective vertical stress at pile tip
    let sigma_v_effective_tip = 0;
    let currentDepth = 0;
    for (const layer of soilLayers) {
        const layerTop = parseFloat(layer.depth);
        const layerThickness = parseFloat(layer.thickness);
        const layerBottom = layerTop + layerThickness;
        const unitWeight = parseFloat(layer.unitWeight);
  
        const segmentTop = Math.max(layerTop, currentDepth);
        const segmentBottom = Math.min(layerBottom, depthToTip);
        
        if (segmentBottom > segmentTop) {
            const segmentMidpoint = (segmentTop + segmentBottom) / 2; // Use midpoint for average stress calculation within segment
            const thicknessInSegment = segmentBottom - segmentTop;
  
            if (segmentBottom <= gwl) { // Entire segment above GWL
                sigma_v_effective_tip += unitWeight * thicknessInSegment;
            } else if (segmentTop >= gwl) { // Entire segment below GWL
                const buoyantUnitWeight = unitWeight - waterUnitWeight;
                sigma_v_effective_tip += Math.max(0, buoyantUnitWeight) * thicknessInSegment;
            } else { // Segment crosses GWL
                const thicknessAboveGWL = gwl - segmentTop;
                const thicknessBelowGWL = segmentBottom - gwl;
                const buoyantUnitWeight = unitWeight - waterUnitWeight;
                sigma_v_effective_tip += (unitWeight * thicknessAboveGWL) + (Math.max(0, buoyantUnitWeight) * thicknessBelowGWL);
            }
        }
        currentDepth = layerBottom;
        if (currentDepth >= depthToTip) break;
    }
    sigma_v_effective_tip = Math.max(0, sigma_v_effective_tip);
  
    let unitEndBearing = 0; // kPa
    const frictionAngle = parseFloat(tipLayer.frictionAngle);
    const Su = parseFloat(tipLayer.undrained_shear_strength);
  
    if (endBearingMethod === 'meyerhof') {
      if (tipLayer.soilType === 'clay') {
        const Nc = 9; 
        unitEndBearing = Nc * Su;
      } else { // Sand/Silt
        // Meyerhof Nq (approximation based on friction angle)
        const Nq = Math.exp(Math.PI * Math.tan(frictionAngle * Math.PI / 180)) * 
                  Math.pow(Math.tan((45 + frictionAngle / 2) * Math.PI / 180), 2);
        // Add Ngamma term (simplified)
        const Ngamma = (Nq - 1) * Math.tan(1.4 * frictionAngle * Math.PI / 180);
        const B = diameter; // Pile diameter/width
        const gamma_eff = parseFloat(tipLayer.unitWeight) - (depthToTip > gwl ? waterUnitWeight : 0); // Effective unit weight at tip
        
        unitEndBearing = (sigma_v_effective_tip * Nq) + (0.5 * Math.max(0, gamma_eff) * B * Ngamma);
        // Limit bearing capacity in sands (e.g., Meyerhof limit)
        unitEndBearing = Math.min(unitEndBearing, 50 * Nq * Math.tan(frictionAngle * Math.PI / 180) * 1000); // Convert MPa limit to kPa
      }
    } else if (endBearingMethod === 'vesic') {
       if (tipLayer.soilType === 'clay') {
          // Use the renamed variable 'pileLen' here
          const Nc = (2 + Math.PI) * (1 + 0.2 * (diameter / pileLen)); // Simplified Vesic Nc
          unitEndBearing = Nc * Su;
        } else { // Sand/Silt
          const Nq = Math.exp(Math.PI * Math.tan(frictionAngle * Math.PI / 180)) * 
                    Math.pow(Math.tan((45 + frictionAngle / 2) * Math.PI / 180), 2);
          // Vesic Ngamma
          const Ngamma = 2 * (Nq + 1) * Math.tan(frictionAngle * Math.PI / 180);
          const B = diameter;
          const gamma_eff = parseFloat(tipLayer.unitWeight) - (depthToTip > gwl ? waterUnitWeight : 0);
          
          unitEndBearing = (sigma_v_effective_tip * Nq) + (0.5 * Math.max(0, gamma_eff) * B * Ngamma);
          // Apply rigidity index factor (complex, simplified here)
          unitEndBearing *= 0.8; 
        }
    }
    
    // Limit end bearing (e.g., 15 MPa)
    unitEndBearing = Math.min(unitEndBearing, 15000); 
  
    const Q_end = unitEndBearing * area;
    return Q_end;
  };

  // Calculate Group Efficiency
  const calculateGroupEfficiency = () => {
    const { numberOfPiles, pileSpacing, pileDiameter, pileArrangement } = input;
    const numPiles = parseInt(numberOfPiles);
    const spacing = parseFloat(pileSpacing);
    const diameter = parseFloat(pileDiameter);
  
    // Return 1.0 if single pile or inputs are invalid for group calculation
    if (numPiles <= 1 || !spacing || spacing <= 0 || !diameter || diameter <= 0 || !pileArrangement) {
      return 1.0; 
    }
    
    // Parse the pile arrangement (e.g., "2x3") - Add error handling
    const arrangementMatch = pileArrangement.match(/^(\d+)x(\d+)$/);
    if (!arrangementMatch) {
        console.warn("Invalid pile arrangement format. Expected 'rows x cols' (e.g., '2x3'). Defaulting group efficiency to 1.0.");
        setCalculationMessages(prev => [...prev, { type: 'warning', message: "Invalid pile arrangement format. Group efficiency calculation skipped." }]);
        return 1.0; // Invalid format
    }
    const [, rowsStr, colsStr] = arrangementMatch;
    const rows = parseInt(rowsStr);
    const cols = parseInt(colsStr);
  
    // Check if parsed rows/cols match number of piles
    if (rows * cols !== numPiles) {
        console.warn(`Pile arrangement (${rows}x${cols}=${rows*cols}) does not match number of piles (${numPiles}). Check inputs. Calculating efficiency based on arrangement.`);
         setCalculationMessages(prev => [...prev, { type: 'warning', message: `Pile arrangement (${rows}x${cols}) doesn't match number of piles (${numPiles}). Efficiency calculated based on arrangement.` }]);
    }
    
    // Using the Converse-Labarre equation for group efficiency
    // Ensure spacing is greater than diameter to avoid atan(undefined) or negative efficiency
    if (spacing <= diameter) {
        console.warn("Pile spacing must be greater than pile diameter for group efficiency calculation. Defaulting to 1.0.");
        setCalculationMessages(prev => [...prev, { type: 'warning', message: "Pile spacing must be > diameter. Group efficiency calculation skipped." }]);
        return 1.0;
    }
    const theta_rad = Math.atan(diameter / spacing); // Result in radians
    const theta_deg = theta_rad * (180 / Math.PI); // Convert to degrees
    
    // Ensure rows*cols is not zero
    if (rows === 0 || cols === 0) return 1.0; 
  
    const efficiency = 1 - ((theta_deg * (rows + cols - 2)) / (90 * rows * cols));
    
    // Ensure efficiency is within reasonable bounds (e.g., 0.3 to 1.0)
    return Math.max(0.3, Math.min(1.0, efficiency)); 
  };

  // Calculate Settlement
  const calculateSettlement = () => {
    const { pileDiameter, pileLength, axialCompression, soilLayers, pileType, concreteFck, steelFy } = input;
    
    const diameter = parseFloat(pileDiameter);
    const area = Math.PI * Math.pow(diameter / 2, 2);
    const load = parseFloat(axialCompression); // Load per pile
    const pileLen = parseFloat(pileLength); // Renamed from 'length'
  
    // --- 1. Elastic Shortening of Pile ---
    let E_pile = 30e6; // Default Young's Modulus (kPa) - ~30 GPa for concrete
    if (pileType.includes('concrete') && concreteFck) {
        // Estimate E for concrete based on fck (e.g., ACI or Eurocode)
        E_pile = 5000 * Math.sqrt(parseFloat(concreteFck)) * 1000; // MPa to kPa
    } else if (pileType.includes('steel') || pileType === 'H-pile') {
        E_pile = 200e6; // kPa (200 GPa for steel)
    }
    
    // Use the renamed variable 'pileLen' here
    const elasticSettlement = (load * pileLen) / (area * E_pile) * 1000; // Convert m to mm
  
    // --- 2. Soil Settlement (Simplified Vesic Method for single pile) ---
    // Requires soil modulus (Es). Estimate from SPT or Su if not provided.
    let avgEs = 0;
    let totalThickness = 0;
    soilLayers.forEach(layer => {
        let Es_layer = 10000; // Default Es (kPa)
        if (layer.SPT_N) {
            // Correlation for Es from SPT (e.g., Es ≈ 1000 * N kPa for sand, 500 * N for clay)
            Es_layer = (layer.soilType === 'sand' ? 1000 : 500) * parseFloat(layer.SPT_N);
        } else if (layer.undrained_shear_strength) {
            // Correlation for Es from Su (e.g., Es ≈ 500-1500 * Su for clay)
            Es_layer = 750 * parseFloat(layer.undrained_shear_strength);
        }
        avgEs += Es_layer * parseFloat(layer.thickness);
        totalThickness += parseFloat(layer.thickness);
    });
    avgEs = totalThickness > 0 ? avgEs / totalThickness : 10000; // Weighted average Es
  
    const poissonRatio = 0.3; // Typical soil Poisson's ratio
    const influenceFactor = 0.85; // Influence factor (depends on L/D, simplified)
  
    // Settlement of soil beneath the pile tip (simplified Vesic)
    const settlement_tip = (load / (diameter * avgEs)) * (1 - Math.pow(poissonRatio, 2)) * influenceFactor * 1000; // Convert m to mm
  
    // Settlement due to shaft friction (more complex, simplified here)
    // Assume shaft load contributes less significantly to surface settlement
    const settlement_shaft = 0; // Placeholder - requires more complex integration
  
    const totalSoilSettlement = settlement_tip + settlement_shaft;
    
    return elasticSettlement + totalSoilSettlement;
  };

  // Calculate Lateral Capacity
  const calculateLateralCapacity = () => {
    const { pileDiameter, pileLength, soilLayers } = input;
    
    const diameter = parseFloat(pileDiameter);
    const pileLen = parseFloat(pileLength); // Rename here as well
    
    // Find average soil properties
    let avgCohesion = 0;
    let avgFrictionAngle = 0;
    let count = 0;
    
    soilLayers.forEach(layer => {
      // Use the renamed variable 'pileLen' here
      if (parseFloat(layer.depth) + parseFloat(layer.thickness) <= pileLen) {
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
      // Use the renamed variable 'pileLen' here
      lateralCapacity = 9 * avgCohesion * diameter * pileLen;
    } else {
      // Cohesionless soils (sand)
      const Kp = Math.pow(Math.tan(45 + avgFrictionAngle / 2 * Math.PI / 180), 2); // Passive earth pressure coefficient
      // Use the renamed variable 'pileLen' here
      lateralCapacity = 0.5 * Kp * diameter * Math.pow(pileLen, 2);
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

    // --- Structural Integrity Check (Simplified Axial Stress) ---
    let structuralCheckResult = 'N/A - Missing Material Properties'; // Default message
    const pileArea = Math.PI * Math.pow(parseFloat(input.pileDiameter) / 2, 2);
    const axialStress = parseFloat(input.axialCompression) / pileArea; // Stress in kPa

    // Only perform check if relevant material property is provided
    if (input.pileType.includes('concrete') && input.concreteFck) {
        const fck = parseFloat(input.concreteFck); // MPa
        // Check if fck is a valid number
        if (!isNaN(fck) && fck > 0) {
            const allowableConcreteStress = 0.45 * fck * 1000; // Simplified allowable stress (kPa)
            structuralCheckResult = axialStress <= allowableConcreteStress ? 'Pass' : 'Fail (Concrete Stress)';
            if (structuralCheckResult === 'Fail (Concrete Stress)') {
                setCalculationMessages(prev => [...prev, {
                    type: 'error',
                    message: `STRUCTURAL CHECK FAILED: Axial stress (${(axialStress/1000).toFixed(2)} MPa) exceeds allowable concrete stress (${(allowableConcreteStress/1000).toFixed(2)} MPa).`
                }]);
            } else {
                 setCalculationMessages(prev => [...prev, {
                    type: 'info',
                    message: `Structural Check (Concrete): Axial stress (${(axialStress/1000).toFixed(2)} MPa) vs Allowable (${(allowableConcreteStress/1000).toFixed(2)} MPa) - OK.`
                }]);
            }
        } else {
            structuralCheckResult = 'N/A - Invalid Concrete fck';
        }
    } else if (input.pileType.includes('steel') && input.steelFy) {
        const fy = parseFloat(input.steelFy); // MPa
        // Check if fy is a valid number
         if (!isNaN(fy) && fy > 0) {
            const allowableSteelStress = 0.6 * fy * 1000; // Simplified allowable stress (kPa)
            structuralCheckResult = axialStress <= allowableSteelStress ? 'Pass' : 'Fail (Steel Stress)';
             if (structuralCheckResult === 'Fail (Steel Stress)') {
                setCalculationMessages(prev => [...prev, {
                    type: 'error',
                    message: `STRUCTURAL CHECK FAILED: Axial stress (${(axialStress/1000).toFixed(2)} MPa) exceeds allowable steel stress (${(allowableSteelStress/1000).toFixed(2)} MPa).`
                }]);
            } else {
                 setCalculationMessages(prev => [...prev, {
                    type: 'info',
                    message: `Structural Check (Steel): Axial stress (${(axialStress/1000).toFixed(2)} MPa) vs Allowable (${(allowableSteelStress/1000).toFixed(2)} MPa) - OK.`
                }]);
            }
         } else {
             structuralCheckResult = 'N/A - Invalid Steel Fy';
         }
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
      structuralIntegrity: structuralCheckResult,
    });

    // Prepare data for Moment/Shear Chart
    const momentData = momentAndShear.map(item => item.moment);
    const shearData = momentAndShear.map(item => item.shear);
    const chartLabels = depthPoints.map(d => d.toFixed(1));

    setMomentShearChartData({
      labels: chartLabels,
      datasets: [
        {
          label: 'Moment (kN·m)',
          data: momentData,
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
          yAxisID: 'y-moment',
          type: 'line', // Display moment as line
          tension: 0.1
        },
        {
          label: 'Shear (kN)',
          data: shearData,
          borderColor: 'rgb(54, 162, 235)',
          backgroundColor: 'rgba(54, 162, 235, 0.5)',
          yAxisID: 'y-shear',
          type: 'bar', // Display shear as bar
        }
      ]
    });
    
    // Switch to results tab
    setActiveTab('results');
  };

  // Validate inputs
  const validateInputs = () => {
    let isValid = true;
    const messages = [];
  
    // Essential Fields
    const requiredFields = {
      axialCompression: 'Axial Compression',
      pileDiameter: 'Pile Diameter/Width',
      pileLength: 'Pile Length',
    };
  
    for (const [field, label] of Object.entries(requiredFields)) {
      if (!input[field] || parseFloat(input[field]) <= 0) {
        messages.push(`${label} is required and must be positive.`);
        isValid = false;
      }
    }
  
    // Soil Layers Basic Validation
    if (input.soilLayers.length === 0) {
      messages.push('At least one soil layer is required.');
      isValid = false;
    } else {
      input.soilLayers.forEach((layer, index) => {
        if (!layer.thickness || parseFloat(layer.thickness) <= 0) {
          messages.push(`Layer ${index + 1}: Thickness is required and must be positive.`);
          isValid = false;
        }
        if (!layer.unitWeight || parseFloat(layer.unitWeight) <= 0) {
          messages.push(`Layer ${index + 1}: Unit Weight is required and must be positive.`);
          isValid = false;
        }
        // Check for required strength parameter based on soil type
        if (layer.soilType === 'clay' && (!layer.undrained_shear_strength || parseFloat(layer.undrained_shear_strength) <= 0)) {
          messages.push(`Layer ${index + 1} (Clay): Undrained Shear Strength is required and must be positive.`);
          isValid = false;
        }
        if (layer.soilType === 'sand' && (!layer.frictionAngle || parseFloat(layer.frictionAngle) < 0)) {
           messages.push(`Layer ${index + 1} (Sand): Friction Angle is required and must be non-negative.`);
           isValid = false;
        }
         if (layer.soilType === 'silt') {
           // Silt might need either Su or Friction Angle depending on behavior
           if ((!layer.undrained_shear_strength || parseFloat(layer.undrained_shear_strength) <= 0) && 
               (!layer.frictionAngle || parseFloat(layer.frictionAngle) < 0)) {
              messages.push(`Layer ${index + 1} (Silt): Either Undrained Shear Strength or Friction Angle is required.`);
              isValid = false;
           }
         }
      });
    }
  
    // Group Pile Validation (if more than one pile)
    if (parseInt(input.numberOfPiles) > 1) {
        if (!input.pileArrangement || !input.pileArrangement.match(/^(\d+)x(\d+)$/)) {
            messages.push("Pile Arrangement (e.g., '2x3') is required for pile groups.");
            isValid = false;
        }
        if (!input.pileSpacing || parseFloat(input.pileSpacing) <= 0) {
            messages.push("Pile Spacing is required and must be positive for pile groups.");
            isValid = false;
        } else if (parseFloat(input.pileSpacing) <= parseFloat(input.pileDiameter)) {
            messages.push("Pile Spacing should generally be greater than Pile Diameter.");
            // Keep isValid = true, but it's a warning
        }
    }
  
    if (!isValid) {
      alert("Input Validation Errors:\n- " + messages.join("\n- "));
    }
    
    return isValid;
  };

  const handleExportPDF = async () => {
    if (!resultsRef.current || isExporting) return; // Don't export if no results or already exporting

    setIsExporting(true);
    setCalculationMessages(prev => [...prev, { type: 'info', message: 'Generating PDF report...' }]);

    const inputElement = resultsRef.current;
    // Ensure charts are fully rendered before capture
    await new Promise(resolve => setTimeout(resolve, 500)); 

    try {
      const canvas = await html2canvas(inputElement, {
        scale: 1.5, // Increase scale for better resolution
        useCORS: true, // If you have external images/styles
        logging: false, // Disable html2canvas console logging
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.8); // Use JPEG with 80% quality

      const pdf = new jsPDF({
        orientation: 'p', // portrait
        unit: 'mm', // millimeters
        format: 'a4', // A4 size paper
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      
      // Calculate dimensions to fit A4, maintaining aspect ratio
      const canvasWidthMM = imgWidth * ratio * 0.95; // Use 95% of width for margins
      const canvasHeightMM = imgHeight * ratio * 0.95;
      
      // Center the image on the page
      const marginX = (pdfWidth - canvasWidthMM) / 2;
      const marginY = 10; // Top margin

      // Add Project Info Text (Optional, but better than image text)
      pdf.setFontSize(16);
      pdf.text(input.projectName || 'Pile Design Report-Engineering Hub', pdfWidth / 2, marginY, { align: 'center' });
      pdf.setFontSize(10);
      pdf.text(`Location: ${input.location || 'N/A'}`, marginX, marginY + 10);
      pdf.text(`Date: ${new Date().toLocaleDateString()}`, marginX, marginY + 15);

      // Add the captured content as an image
      // Handle multi-page if content is too tall
      let position = marginY + 25; // Start position below text
      const pageHeight = pdfHeight - 20; // Usable page height with margins
      let remainingHeight = canvasHeightMM;

      while (remainingHeight > 0) {
        pdf.addImage(imgData, 'JPEG', marginX, position === marginY + 25 ? position : marginY, canvasWidthMM, canvasHeightMM, undefined, 'FAST'); 
        remainingHeight -= pageHeight;
        if (remainingHeight > 0) {
          pdf.addPage();
          position = marginY; // Reset position for new page
        }
      }

      pdf.save(`${input.projectName || 'pile-design'}-report.pdf`);

      setCalculationMessages(prev => prev.filter(msg => msg.message !== 'Generating PDF report...'));

    } catch (error) {
      console.error("Error generating PDF:", error);
      setCalculationMessages(prev => [...prev, { type: 'error', message: 'Failed to generate PDF.' }]);
    } finally {
      setIsExporting(false);
    }
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

  const momentShearChartOptions = {
    responsive: true,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    stacked: false,
    plugins: {
      title: {
        display: true,
        text: 'Moment and Shear Distribution (Simplified Cantilever)',
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Depth (m)',
        },
      },
      'y-moment': {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Moment (kN·m)',
        },
      },
      'y-shear': {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'Shear (kN)',
        },
        grid: {
          drawOnChartArea: false, // only draw grid lines for moment axis
        },
      },
    },
  };

  return (
    <div className="pile-design-tool">
      <h1>Pile Design Tool</h1>

      <div className="guide-toggle">
        <button 
          onClick={() => setShowGuide(!showGuide)}
          className="guide-button"
        >
          {showGuide ? 'Hide Guide' : 'Show Guide'}
        </button>
      </div>
      
      {showGuide && (
        <div className="calculator-guide"> {/* Reuse CSS from Hydraulic Calculator */}
          <h3>How to Use This Pile Design Tool</h3>
          <p>This tool provides preliminary calculations for single pile and group capacity, settlement, and lateral resistance based on common geotechnical methods.</p>
          
          <h4>Essential Inputs (Required for Basic Calculation)</h4>
          <ul>
            <li><strong>Loads:</strong> Axial Compression (kN).</li>
            <li><strong>Pile Properties:</strong> Type, Cross Section, Diameter/Width (m), Pile Length (m).</li>
            <li><strong>Soil Layers:</strong> At least one layer with Thickness (m), Soil Type, Unit Weight (kN/m³), and relevant strength parameter (Undrained Shear Strength for Clay/Silt, Friction Angle for Sand/Silt).</li>
          </ul>

          <h4>Additional Parameters (Optional - Enhance Accuracy)</h4>
          <p>Click "Show Additional Parameters" to input:</p>
          <ul>
            <li>Project Information, Lateral/Moment Loads, Groundwater Level.</li>
            <li>Pile Group details (Number, Arrangement, Spacing).</li>
            <li>Specific Design Methods and Safety Factors.</li>
            <li>Material Properties (Concrete f'c, Steel Fy) for structural checks.</li>
            <li>SPT N-Values for better soil modulus estimation.</li>
          </ul>
          
          <h4>Calculation Steps</h4>
          <ol>
            <li>Fill in the Essential Inputs.</li>
            <li>Optionally, reveal and fill in Additional Parameters.</li>
            <li>Click "Calculate Pile Design".</li>
            <li>Review results in the "Results" tab, including capacities, settlement, checks, and charts.</li>
          </ol>

          <h4>Important Notes</h4>
          <ul>
            <li>Calculations use simplified methods and assumptions. Results are for preliminary design and comparison only.</li>
            <li>Always consult relevant design codes and perform detailed analysis for final design.</li>
            <li>Ensure consistent units (kN, m, kPa, MPa, degrees).</li>
            <li>GWL affects effective stress calculations.</li>
          </ul>
        </div>
      )}

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
          {/* --- Essential Inputs --- */}
          <h2>Loads</h2>
          <div className="form-row">
            <div className="form-group required"> {/* Add 'required' class */}
              <label>Axial Compression (kN): *</label>
              <input 
                type="number" 
                name="axialCompression" 
                value={input.axialCompression} 
                onChange={handleChange} 
                required 
              />
            </div>
            {/* Keep Lateral/Moment visible or move to advanced */}
            <div className="form-group">
              <label>Lateral Load (kN):</label> 
              <input type="number" name="lateralLoad" value={input.lateralLoad} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Moment Load (kN·m):</label>
              <input type="number" name="momentLoad" value={input.momentLoad} onChange={handleChange} />
            </div>
          </div>

          <h2>Pile Properties</h2>
          <div className="form-row">
            <div className="form-group required">
              <label>Pile Type: *</label>
              <select name="pileType" value={input.pileType} onChange={handleChange} required>
                <option value="driven-concrete">Driven Concrete Pile</option>
                <option value="driven-steel">Driven Steel Pile</option>
                <option value="bored">Bored Cast-in-place Pile</option>
                <option value="CFA">Continuous Flight Auger (CFA) Pile</option>
                <option value="H-pile">H-Pile</option>
              </select>
            </div>
            <div className="form-group required">
              <label>Cross Section: *</label>
              <select name="pileCrossSectionType" value={input.pileCrossSectionType} onChange={handleChange} required>
                 <option value="circular">Circular</option>
                 <option value="square">Square</option>
                 <option value="H-section">H-Section</option>
              </select>
            </div>
          </div>
          <div className="form-row">
             <div className="form-group required">
              <label>Diameter/Width (m): *</label>
              <input type="number" name="pileDiameter" value={input.pileDiameter} onChange={handleChange} required />
            </div>
            <div className="form-group required">
              <label>Pile Length (m): *</label>
              <input type="number" name="pileLength" value={input.pileLength} onChange={handleChange} required />
            </div>
          </div>

          <h2>Soil Layers *</h2>
          <p>Enter essential soil layer data (Thickness, Type, Unit Weight, Strength):</p>
          {/* ... Soil Layers mapping - mark required fields within the map ... */}
          <div className="soil-layers">
            {input.soilLayers.map((layer, index) => (
              <div key={index} className="soil-layer">
                <h4>Layer {index + 1}</h4>
                <div className="form-row">
                  {/* Depth is auto-calculated */}
                  <div className="form-group required">
                    <label>Layer Thickness (m): *</label>
                    <input type="number" name="thickness" value={layer.thickness} onChange={(e) => handleSoilLayerChange(index, e)} required />
                  </div>
                  <div className="form-group required">
                    <label>Soil Type: *</label>
                    <select name="soilType" value={layer.soilType} onChange={(e) => handleSoilLayerChange(index, e)} required>
                       <option value="clay">Clay</option>
                       <option value="sand">Sand</option>
                       <option value="silt">Silt</option>
                       <option value="rock">Rock</option>
                    </select>
                  </div>
                   <div className="form-group required">
                    <label>Unit Weight (kN/m³): *</label>
                    <input type="number" name="unitWeight" value={layer.unitWeight} onChange={(e) => handleSoilLayerChange(index, e)} required />
                  </div>
                </div>
                <div className="form-row">
                   {/* Conditionally required strength parameters */}
                   {(layer.soilType === 'clay' || layer.soilType === 'silt') && (
                    <div className="form-group required">
                      <label>Undrained Shear Strength (kPa): *</label>
                      <input type="number" name="undrained_shear_strength" value={layer.undrained_shear_strength} onChange={(e) => handleSoilLayerChange(index, e)} required={layer.soilType === 'clay'} />
                    </div>
                  )}
                  {(layer.soilType === 'sand' || layer.soilType === 'silt') && (
                    <div className="form-group required">
                      <label>Friction Angle (°): *</label>
                      <input type="number" name="frictionAngle" value={layer.frictionAngle} onChange={(e) => handleSoilLayerChange(index, e)} required={layer.soilType === 'sand'} />
                    </div>
                  )}
                  {/* Optional SPT */}
                  <div className="form-group">
                    <label>SPT N-Value:</label>
                    <input type="number" name="SPT_N" value={layer.SPT_N} onChange={(e) => handleSoilLayerChange(index, e)} />
                  </div>
                </div>
                 {/* Optional Description */}
                 <div className="form-group">
                    <label>Description:</label>
                    <input type="text" name="description" value={layer.description} onChange={(e) => handleSoilLayerChange(index, e)} />
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

          {/* --- Toggle Button for Advanced Parameters --- */}
          <div className="form-actions">
             <button 
                type="button" 
                className="toggle-advanced-btn"
                onClick={() => setShowAdvancedParams(!showAdvancedParams)}
              >
                {showAdvancedParams ? 'Hide Additional Parameters' : 'Show Additional Parameters'}
              </button>
          </div>

          {/* --- Advanced/Optional Parameters --- */}
          {showAdvancedParams && (
            <div className="advanced-parameters">
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

              <h2>Geotechnical Data (Advanced)</h2>
              <div className="form-group">
                <label>Groundwater Level (m below surface):</label>
                <input 
                  type="number" 
                  name="groundwaterLevel" 
                  value={input.groundwaterLevel} 
                  onChange={handleChange} 
                  placeholder="e.g., 2.5"
                />
              </div>

              <h2>Pile Properties (Advanced)</h2>
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
               <div className="form-row">
                  {/* Material Properties */}
                  <div className="form-group">
                      <label>Concrete Strength f'c (MPa):</label>
                      <input type="number" name="concreteFck" value={input.concreteFck} onChange={handleChange} />
                  </div>
                   <div className="form-group">
                      <label>Steel Yield Strength Fy (MPa):</label>
                      <input type="number" name="steelFy" value={input.steelFy} onChange={handleChange} />
                  </div>
               </div>

              <h2>Design Methods & Factors</h2>
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
            </div>
          )}

          {/* --- Calculate Button --- */}
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
        // Add the ref here
        <div className="results-section" ref={resultsRef}> 
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

            <div className="result-group">
              <h3>Structural Check</h3>
              <div className="result-item">
                <span className="label">Axial Stress Check:</span>
                <span className={`value ${results.structuralIntegrity?.includes('Fail') ? 'fail' : results.structuralIntegrity === 'Pass' ? 'pass' : ''}`}>
                  {results.structuralIntegrity}
                </span>
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

          <h3>Moment and Shear Distribution</h3>
          <div className="chart-container">
            {momentShearChartData && (
              <Line // Use Line chart component, it can handle mixed types
                data={momentShearChartData}
                options={momentShearChartOptions}
                height={300}
              />
            )}
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
              onClick={handleExportPDF} // Use the new function
              disabled={isExporting} // Disable while exporting
            >
              {isExporting ? 'Exporting...' : 'Export as PDF'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PileDesignTool;