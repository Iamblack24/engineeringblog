// RetainingWallDesignTool.js

import React, { useState, useCallback } from 'react'; // Add useCallback
import './RetainingWallDesignTool.css';
// Remove unused Line import
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  BarElement,
  LineElement, // Keep LineElement as it's used by type: 'line'
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
} from 'chart.js';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

ChartJS.register(
  BarElement,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend
);

const RetainingWallDesignTool = () => {
  const [input, setInput] = useState({
    // Input Parameters
    wallType: 'cantilever', // Default to cantilever
    soilDensity: 18,        // kN/m³ - Added default
    cohesion: 0,            // kPa - Added default
    frictionAngle: 30,      // degrees - Added default
    baseFrictionAngle: 25,  // degrees - Friction between base and soil (can differ from soil phi)
    baseAdhesion: 0,        // kPa - Adhesion between base and soil
    bearingCapacity: 200,   // kPa - Added default
    waterTable: 0,          // m (Depth from surface, 0 = at surface, > wallHeight = below base) - Added default
    wallHeight: 4,          // m - Added default
    baseWidth: 2.5,         // m - Added default
    baseThickness: 0.4,     // m - NEW
    stemThicknessTop: 0.3,  // m - NEW (For tapered stems)
    stemThicknessBase: 0.4, // m - Renamed from stemThickness
    heel: 1.2,              // m - Added default
    toe: 0.9,               // m - Added default (baseWidth = heel + stemThicknessBase + toe)
    surchargeLoad: 10,      // kN/m² - Added default
    concreteDensity: 24,    // kN/m³ - NEW
    concreteStrength: 30,   // MPa (fck) - NEW
    steelStrength: 500,     // MPa (fy) - NEW
    concreteCover: 50,      // mm - NEW
    // seismicForce: '', // Keep seismic simple for now
    designCode: 'Eurocode',
  });

  const [results, setResults] = useState({
    // Stability
    fsOverturning: null,
    fsSliding: null,
    fsBearing: null,
    momentOverturning: null,
    momentResisting: null,
    horizontalForce: null,
    resistingForce: null,
    verticalLoad: null,
    eccentricity: null,
    basePressureMax: null,
    basePressureMin: null,
    // Earth Pressures
    ka: null,
    activeForceSoil: null,
    activeForceSurcharge: null,
    hydrostaticForce: null,
    // Structural (Stem Base for Cantilever)
    stemBendingMoment: null,
    stemShearForce: null,
    stemRequiredSteel: null,
    // Settlement (Placeholder)
    settlement: null,
    error: null, // For displaying calculation errors
  });

  const [chartsData, setChartsData] = useState({
    earthPressureChart: null,
    stabilityResultsChart: null,
    structuralDesignChart: null,
    basePressureChart: null, // Add new chart data
  });

  // Handle Input Changes (Ensure baseWidth consistency)
  const handleChange = (e) => {
    const { name, value } = e.target;
    let updatedValue = value === '' ? '' : parseFloat(value); // Keep empty string or parse float
    if (isNaN(updatedValue) && value !== '') updatedValue = input[name]; // Revert if parsing fails but not empty

    let updatedInput = {
      ...input,
      [name]: updatedValue,
    };

    // Auto-calculate baseWidth if heel, toe, or stemThicknessBase changes
    if (['heel', 'toe', 'stemThicknessBase'].includes(name) && updatedInput.wallType === 'cantilever') {
        const newBaseWidth = (updatedInput.heel || 0) + (updatedInput.stemThicknessBase || 0) + (updatedInput.toe || 0);
        if (!isNaN(newBaseWidth)) {
            updatedInput.baseWidth = parseFloat(newBaseWidth.toFixed(3)); // Keep consistent
        }
    }
    // Auto-calculate heel/toe if baseWidth changes (adjust heel)
    else if (name === 'baseWidth' && updatedInput.wallType === 'cantilever') {
        const currentHeel = updatedInput.heel || 0;
        const currentToe = updatedInput.toe || 0;
        const currentStem = updatedInput.stemThicknessBase || 0;
        const newHeel = updatedValue - currentToe - currentStem;
        if (!isNaN(newHeel) && newHeel >= 0) {
             updatedInput.heel = parseFloat(newHeel.toFixed(3));
        } else {
            // If adjusting heel makes it negative, adjust toe instead (or handle error)
            const newToe = updatedValue - currentHeel - currentStem;
             if (!isNaN(newToe) && newToe >= 0) {
                 updatedInput.toe = parseFloat(newToe.toFixed(3));
             } else {
                 // Cannot maintain consistency, maybe revert baseWidth or show error
                 updatedInput.baseWidth = input.baseWidth; // Revert for now
             }
        }
    }


    setInput(updatedInput);
  };

  // --- Calculation Functions ---

  // Calculate Stability (Refined)
  const calculateStability = () => {
    // Destructure all needed inputs
    // Remove unused 'cohesion'
    const {
      wallType, soilDensity, frictionAngle, baseFrictionAngle, baseAdhesion,
      bearingCapacity, waterTable, wallHeight, baseWidth, baseThickness,
      stemThicknessTop, stemThicknessBase, heel, toe, surchargeLoad, concreteDensity,
      // seismicForce, designCode // Add later
    } = input;

    // --- Input Validation ---
    if (!wallHeight || !baseWidth || !baseThickness || !soilDensity || !frictionAngle || !bearingCapacity || !concreteDensity) {
        return { error: "Missing critical input parameters (Height, Width, Thickness, Densities, Strength)." };
    }
    if (wallType === 'cantilever' && (!stemThicknessBase || !heel || !toe)) {
         return { error: "Missing cantilever geometry (Stem Base, Heel, Toe)." };
    }
     // Check consistency for cantilever
    if (wallType === 'cantilever' && Math.abs(baseWidth - (heel + stemThicknessBase + toe)) > 0.01) {
        return { error: "Base Width does not equal Heel + Stem Base Thickness + Toe." };
    }


    // --- Basic Properties ---
    const phi = frictionAngle * (Math.PI / 180);
    const basePhi = (baseFrictionAngle || frictionAngle) * (Math.PI / 180); // Use soil phi if base friction not given
    const ka = (1 - Math.sin(phi)) / (1 + Math.sin(phi));
    const gamma_w = 9.81; // kN/m³ (Water density)
    const gamma_sub = soilDensity - gamma_w; // Submerged density

    // --- Forces and Moments (About Toe) ---
    let momentOverturning = 0;
    let momentResisting = 0;
    let horizontalForce = 0;
    let verticalLoad = 0;
    let activeForceSoil = 0;
    let activeForceSurcharge = 0;
    let hydrostaticForce = 0;

    // 1. Active Earth Pressure + Surcharge (Effective Stress)
    const H = wallHeight;
    const q = surchargeLoad || 0;
    const H_water = Math.max(0, H - waterTable); // Height of water above base

    // Remove unused 'p_active_base_eff'
    // let p_active_base_eff = 0; // Effective stress component
    if (H_water <= 0) { // Water table below base
        // p_active_base_eff = ka * (soilDensity * H + q); // Removed assignment
        activeForceSoil = 0.5 * ka * soilDensity * H * H;
        activeForceSurcharge = ka * q * H;
        hydrostaticForce = 0;
        momentOverturning += activeForceSoil * (H / 3) + activeForceSurcharge * (H / 2);
    } else { // Water table above base
        const H_dry = H - H_water; // Height of dry/moist soil
        // Effective pressure components
        const p_eff_at_wt = ka * (soilDensity * H_dry + q); // Effective pressure at water table level
        const p_eff_increase_sub = ka * gamma_sub * H_water; // Increase in effective pressure due to submerged soil
        // p_active_base_eff = p_eff_at_wt + p_eff_increase_sub; // Removed assignment

        // Force calculation (split into parts)
        const force_dry_triangle = 0.5 * ka * soilDensity * H_dry * H_dry;
        const force_dry_surcharge = ka * q * H_dry;
        const force_sub_rectangle = p_eff_at_wt * H_water; // From pressure at WT acting over submerged height
        const force_sub_triangle = 0.5 * p_eff_increase_sub * H_water; // From increase in submerged pressure

        activeForceSoil = force_dry_triangle + force_sub_rectangle + force_sub_triangle;
        activeForceSurcharge = force_dry_surcharge; // Surcharge only acts on dry part effectively here

        // Hydrostatic force
        hydrostaticForce = 0.5 * gamma_w * H_water * H_water;

        // Moments (about toe)
        momentOverturning += force_dry_triangle * (H_water + H_dry / 3);
        momentOverturning += force_dry_surcharge * (H_water + H_dry / 2);
        momentOverturning += force_sub_rectangle * (H_water / 2);
        momentOverturning += force_sub_triangle * (H_water / 3);
        momentOverturning += hydrostaticForce * (H_water / 3);
    }
    horizontalForce = activeForceSoil + activeForceSurcharge + hydrostaticForce; // Add seismic later

    // 2. Resisting Weights and Moments (Varies by Wall Type)
    let weight_stem = 0, weight_base = 0, weight_soil_heel = 0;
    let leverArm_stem = 0, leverArm_base = 0, leverArm_soil_heel = 0;

    if (wallType === 'gravity') {
        // Assuming trapezoidal gravity wall (simplified)
        const topWidth = stemThicknessTop || stemThicknessBase; // Use base if top not given
        weight_base = baseWidth * baseThickness * concreteDensity; // Base block
        weight_stem = 0.5 * (topWidth + stemThicknessBase) * (H - baseThickness) * concreteDensity; // Stem trapezoid
        leverArm_base = baseWidth / 2;
        // Centroid of trapezoid stem (complex, approximate as rectangle for simplicity here)
        leverArm_stem = toe + (stemThicknessBase / 2); // Approximation
        momentResisting = weight_base * leverArm_base + weight_stem * leverArm_stem;
        verticalLoad = weight_base + weight_stem;

    } else if (wallType === 'cantilever') {
        const stemHeight = H - baseThickness;
        const tBase = stemThicknessBase;
        const tTop = stemThicknessTop || tBase; // Use base thickness if top is zero or undefined
        const avgStemThickness = (tTop + tBase) / 2;
        weight_stem = avgStemThickness * stemHeight * concreteDensity;

        // Calculate stem centroid X distance from the *back face* of the stem at its base
        let stemCentroidX_fromBackFace = 0;
        if (Math.abs(tBase - tTop) < 1e-6) { // Rectangular stem
            stemCentroidX_fromBackFace = tBase / 2;
        } else { // Trapezoidal stem
            stemCentroidX_fromBackFace = (stemHeight / 3) * (tBase + 2 * tTop) / (tBase + tTop) * (tBase - tTop) / stemHeight; // This formula is for vertical centroid, need horizontal
            // Horizontal centroid of trapezoid (vertical faces) from the wider base face (back face):
             stemCentroidX_fromBackFace = (tBase * tBase + tBase * tTop + tTop * tTop) / (3 * (tBase + tTop)); // Centroid distance from the vertical line passing through the wider base edge
             // Correction: The above is for a trapezoid area. For the stem block, treat as rectangle + triangle
             const rectArea = tTop * stemHeight;
             const triArea = 0.5 * (tBase - tTop) * stemHeight;
             const rectCentroidX = tTop / 2; // From back face
             const triCentroidX = tTop + (tBase - tTop) / 3; // From back face
             if (Math.abs(rectArea + triArea) > 1e-6) { // Avoid division by zero if thickness is zero
                 stemCentroidX_fromBackFace = (rectArea * rectCentroidX + triArea * triCentroidX) / (rectArea + triArea);
             } else {
                 stemCentroidX_fromBackFace = tBase / 2; // Fallback for zero thickness
             }
        }

        // Lever arm from the toe
        leverArm_stem = toe + stemCentroidX_fromBackFace; // Distance from toe to centroid

        // Base weight
        weight_base = baseWidth * baseThickness * concreteDensity;
        leverArm_base = baseWidth / 2;

        // Soil on Heel weight
        // Ensure soil density is adjusted if water table is above heel soil
        // Remove unused 'soilDensityOnHeel'
        // let soilDensityOnHeel = soilDensity;
        const heelSoilHeight = stemHeight;
        const waterDepthOnHeel = Math.max(0, waterTable - baseThickness); // Depth of water from top of base
        if (waterDepthOnHeel > 0 && waterDepthOnHeel < heelSoilHeight) {
             const dryHeelSoilHeight = heelSoilHeight - waterDepthOnHeel;
             weight_soil_heel = heel * (dryHeelSoilHeight * soilDensity + waterDepthOnHeel * gamma_sub);
        } else if (waterDepthOnHeel >= heelSoilHeight) { // Fully submerged
             weight_soil_heel = heel * heelSoilHeight * gamma_sub;
        } else { // Water below base
             weight_soil_heel = heel * heelSoilHeight * soilDensity;
        }
        leverArm_soil_heel = baseWidth - heel / 2;

        momentResisting = weight_stem * leverArm_stem + weight_base * leverArm_base + weight_soil_heel * leverArm_soil_heel;
        verticalLoad = weight_stem + weight_base + weight_soil_heel;
        // Add surcharge on heel to vertical load if applicable
        verticalLoad += (surchargeLoad || 0) * heel;
        momentResisting += (surchargeLoad || 0) * heel * (baseWidth - heel / 2); // Moment from surcharge on heel
    }
    // Add other wall types (Counterfort, SheetPile) later

    // --- Stability Checks ---
    const fsOverturning = momentResisting / (momentOverturning || 1e-6); // Avoid division by zero

    // Sliding Resistance
    const frictionCoefficient = Math.tan(basePhi);
    const adhesion = baseAdhesion || 0; // Use input base adhesion
    const resistingForce = (verticalLoad * frictionCoefficient) + (adhesion * baseWidth); // Add passive pressure later if needed
    const fsSliding = resistingForce / (horizontalForce || 1e-6);

    // Bearing Capacity
    const netMoment = momentResisting - momentOverturning;
    const resultantLocationX = netMoment / (verticalLoad || 1e-6);
    const eccentricity = (baseWidth / 2) - resultantLocationX;

    let q_max = 0, q_min = 0;
    if (Math.abs(eccentricity) <= baseWidth / 6) {
        q_max = (verticalLoad / baseWidth) * (1 + (6 * Math.abs(eccentricity) / baseWidth));
        q_min = (verticalLoad / baseWidth) * (1 - (6 * Math.abs(eccentricity) / baseWidth));
    } else {
        q_max = (2 * verticalLoad) / (3 * (baseWidth / 2 - Math.abs(eccentricity)));
        q_min = 0; // Tension implied
    }
    const fsBearing = bearingCapacity / (q_max || 1e-6);

    return {
      fsOverturning, fsSliding, fsBearing,
      momentOverturning, momentResisting, horizontalForce, resistingForce, verticalLoad,
      eccentricity, basePressureMax: q_max, basePressureMin: q_min,
      ka, activeForceSoil, activeForceSurcharge, hydrostaticForce,
      error: null // No error if calculation completes
    };
  };


  // Calculate Stem Moment & Shear (Cantilever) - Refined
  const calculateStemForces = (stabilityResults) => {
      const { input } = stabilityResults; // Need input values passed through
      // Remove unused 'stemThicknessBase', 'stemThicknessTop' from destructuring
      const { wallHeight, baseThickness, soilDensity, frictionAngle, surchargeLoad, waterTable } = input;

      const stemHeight = wallHeight - baseThickness;
      if (stemHeight <= 0) return { moment: 0, shear: 0 };

      const phi = frictionAngle * (Math.PI / 180);
      const ka = (1 - Math.sin(phi)) / (1 + Math.sin(phi));
      const gamma_w = 9.81;
      const gamma_sub = soilDensity - gamma_w;
      const q = surchargeLoad || 0;

      let momentAtStemBase = 0;
      let shearAtStemBase = 0;

      // Water table relative to stem base
      const waterTableDepthFromTop = waterTable - baseThickness; // Depth below top of stem
      const H_water_stem = Math.max(0, stemHeight - waterTableDepthFromTop); // Height of water on stem

      if (H_water_stem <= 0) { // Water below stem base
          const force_soil = 0.5 * ka * soilDensity * stemHeight * stemHeight;
          const force_surcharge = ka * q * stemHeight;
          momentAtStemBase = force_soil * (stemHeight / 3) + force_surcharge * (stemHeight / 2);
          shearAtStemBase = force_soil + force_surcharge;
      } else { // Water on stem
          const H_dry_stem = stemHeight - H_water_stem;
          const p_eff_at_wt_stem = ka * (soilDensity * H_dry_stem + q);
          const p_eff_increase_sub_stem = ka * gamma_sub * H_water_stem;

          const force_dry_triangle = 0.5 * ka * soilDensity * H_dry_stem * H_dry_stem;
          const force_dry_surcharge = ka * q * H_dry_stem;
          const force_sub_rectangle = p_eff_at_wt_stem * H_water_stem;
          const force_sub_triangle = 0.5 * p_eff_increase_sub_stem * H_water_stem;
          const hydrostaticForce_stem = 0.5 * gamma_w * H_water_stem * H_water_stem;

          momentAtStemBase += force_dry_triangle * (H_water_stem + H_dry_stem / 3);
          momentAtStemBase += force_dry_surcharge * (H_water_stem + H_dry_stem / 2);
          momentAtStemBase += force_sub_rectangle * (H_water_stem / 2);
          momentAtStemBase += force_sub_triangle * (H_water_stem / 3);
          momentAtStemBase += hydrostaticForce_stem * (H_water_stem / 3);

          shearAtStemBase = force_dry_triangle + force_dry_surcharge + force_sub_rectangle + force_sub_triangle + hydrostaticForce_stem;
      }

      return { moment: momentAtStemBase, shear: shearAtStemBase };
  };

  // Calculate Required Reinforcement (Basic - Cantilever Stem Base)
  const calculateReinforcement = (bendingMoment, stemThicknessBase, concreteStrength, steelStrength, concreteCover) => {
      if (!bendingMoment || bendingMoment <= 0 || !stemThicknessBase || !concreteStrength || !steelStrength) return 0;

      const fck = concreteStrength;
      const fy = steelStrength;
      const cover = concreteCover;
      const b = 1000; // Design per meter width (mm)
      const h = stemThicknessBase * 1000; // Stem thickness at base (mm)
      const d = h - cover - (16 / 2); // Effective depth (assume 16mm bar initially) (mm)
      const M_Ed = bendingMoment * 1e6; // Design Moment (Nmm/m) - Apply load factors if using design codes

      // EC2 Simplified Rectangular Section Design
      const fcd = 0.85 * fck / 1.5; // Design concrete strength
      const fyd = fy / 1.15; // Design steel strength

      const K = M_Ed / (b * d * d * fcd);
      const K_bal = 0.167; // Or 0.196 depending on redistribution

      if (K > K_bal * 1.5) { // Significantly over K_bal, likely needs compression steel or thicker section
          console.warn("K > 1.5 * K_bal, section may be insufficient or require compression steel.");
          // Return indicative value based on K_bal limit for now
          const M_lim = K_bal * b * d * d * fcd;
          const z_lim = d * (0.5 + Math.sqrt(0.25 - K_bal / (2 * 0.85 / 0.8))); // Lever arm at limit
          return (M_lim / (fyd * z_lim)); // Required steel for limiting moment
      }

      const z = d * (0.5 + Math.sqrt(0.25 - K / (2 * 0.85 / 0.8))); // Lever arm (EC2 approx)
      const leverArm = Math.min(z, 0.95 * d);
      const As_req = M_Ed / (fyd * leverArm); // Required steel area (mm²/m)

      // Minimum reinforcement (EC2 Eq 9.1N)
      const fctm = 0.3 * Math.pow(fck, 2/3); // Mean tensile strength
      const As_min1 = 0.26 * (fctm / fy) * b * d;
      const As_min2 = 0.0013 * b * d;
      const As_min = Math.max(As_min1, As_min2);

      return Math.max(As_req, As_min); // Return required area, ensuring minimums
  };


  // Calculate Settlement (Placeholder - Needs Soil Modulus Input)
  const calculateSettlement = (verticalLoad, baseWidth, basePressureMax) => {
    // Basic Elastic Settlement: S = q_avg * B * I / Es
    // Requires Soil Modulus (Es) input and Influence Factor (I)
    // const Es = input.soilModulus; // Need this input
    // const influenceFactor = 1.0; // Simplified
    // const q_avg = verticalLoad / baseWidth; // Average pressure
    // const settlement_m = q_avg * baseWidth * influenceFactor / (Es * 1000); // Es in MPa -> kPa
    // return settlement_m * 1000; // mm
    return 0; // Placeholder
  };

  // Handle Form Submission (Updated)
  const handleSubmit = (e) => {
    e.preventDefault();
    setResults({ error: null }); // Clear previous errors

    const stabilityResults = calculateStability();

    // Check for errors from stability calculation
    if (stabilityResults.error) {
        setResults({ error: stabilityResults.error });
        setChartsData({ earthPressureChart: null, stabilityResultsChart: null, structuralDesignChart: null }); // Clear charts
        return;
    }

    // Pass stability results and original input to stem force calculation
    const stemForces = calculateStemForces({ ...stabilityResults, input: input });
    const stemReinforcement = calculateReinforcement(
        stemForces.moment,
        input.stemThicknessBase,
        input.concreteStrength,
        input.steelStrength,
        input.concreteCover
    );
    const settlement = calculateSettlement(stabilityResults.verticalLoad, input.baseWidth, stabilityResults.basePressureMax);

    setResults({
      // Stability
      fsOverturning: stabilityResults.fsOverturning?.toFixed(2),
      fsSliding: stabilityResults.fsSliding?.toFixed(2),
      fsBearing: stabilityResults.fsBearing?.toFixed(2),
      momentOverturning: stabilityResults.momentOverturning?.toFixed(2),
      momentResisting: stabilityResults.momentResisting?.toFixed(2),
      horizontalForce: stabilityResults.horizontalForce?.toFixed(2),
      resistingForce: stabilityResults.resistingForce?.toFixed(2),
      verticalLoad: stabilityResults.verticalLoad?.toFixed(2),
      eccentricity: stabilityResults.eccentricity?.toFixed(3),
      basePressureMax: stabilityResults.basePressureMax?.toFixed(2),
      basePressureMin: stabilityResults.basePressureMin?.toFixed(2),
      // Earth Pressures
      ka: stabilityResults.ka?.toFixed(3),
      activeForceSoil: stabilityResults.activeForceSoil?.toFixed(2),
      activeForceSurcharge: stabilityResults.activeForceSurcharge?.toFixed(2),
      hydrostaticForce: stabilityResults.hydrostaticForce?.toFixed(2),
      // Structural (Stem Base)
      stemBendingMoment: stemForces.moment?.toFixed(2),
      stemShearForce: stemForces.shear?.toFixed(2),
      stemRequiredSteel: stemReinforcement?.toFixed(0), // mm²/m
      // Settlement
      settlement: settlement?.toFixed(1),
      error: null, // Clear error if successful
    });

    // Prepare Charts Data (Pass updated results)
    prepareCharts(stabilityResults, stemForces);
  };


  // Prepare Charts Data (Updated)
  const prepareCharts = (stability, stemForces) => {
    // Earth Pressure Chart (Distribution - More complex, show forces for now)
    const earthPressureData = {
      labels: ['Soil Active', 'Surcharge Active', 'Hydrostatic'],
      datasets: [
        {
          label: 'Horizontal Forces (kN/m)',
          data: [
            stability.activeForceSoil,
            stability.activeForceSurcharge,
            stability.hydrostaticForce,
          ],
          backgroundColor: ['#8B4513', '#FFA500', '#00BFFF'],
          borderWidth: 1,
        },
      ],
    };

    // Stability Results Chart
    const stabilityData = {
      labels: ['Overturning', 'Sliding', 'Bearing Capacity'],
      datasets: [
        {
          label: 'Factor of Safety',
          data: [
            stability.fsOverturning,
            stability.fsSliding,
            stability.fsBearing,
          ],
           backgroundColor: [
            stability.fsOverturning >= 1.5 ? 'rgba(75, 192, 75, 0.6)' : 'rgba(255, 99, 132, 0.6)', // Green if >= 1.5, else Red
            stability.fsSliding >= 1.5 ? 'rgba(75, 192, 75, 0.6)' : 'rgba(255, 99, 132, 0.6)',
            stability.fsBearing >= 2.0 ? 'rgba(75, 192, 75, 0.6)' : 'rgba(255, 99, 132, 0.6)', // Often higher FOS for bearing
          ],
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1,
        },
         {
          label: 'Required FOS', // Add a line/bar showing required FOS
          data: [1.5, 1.5, 2.0], // Example required values
          type: 'line', // Display as a line
          borderColor: 'rgba(255, 0, 0, 0.8)',
          backgroundColor: 'transparent',
          borderWidth: 2,
          pointRadius: 0,
          fill: false,
        }
      ],
    };

     // Base Pressure Chart
    const basePressureData = {
        labels: ['Toe', 'Heel'], // Representing pressure distribution
        datasets: [
            {
                label: 'Base Pressure (kPa)',
                data: [stability.basePressureMax, stability.basePressureMin],
                backgroundColor: ['rgba(54, 162, 235, 0.6)', 'rgba(54, 162, 235, 0.4)'],
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1,
            },
             {
                label: 'Bearing Capacity (kPa)',
                data: [input.bearingCapacity, input.bearingCapacity], // Show bearing capacity limit
                type: 'line',
                borderColor: 'rgba(255, 0, 0, 0.8)',
                backgroundColor: 'transparent',
                borderWidth: 2,
                pointRadius: 0,
                fill: false,
                stepped: true, // Make it a horizontal line
            }
        ],
    };


    // Structural Design Chart (Stem Base Values)
    const structuralData = {
      labels: ['Stem Moment (kNm/m)', 'Stem Shear (kN/m)'],
      datasets: [
        {
          label: 'Stem Base Design Actions',
          data: [
            stemForces.moment,
            stemForces.shear,
          ],
          backgroundColor: [
            'rgba(153, 102, 255, 0.6)',
            'rgba(255, 159, 64, 0.6)',
          ],
          borderWidth: 1,
        },
      ],
    };

    setChartsData({
      earthPressureChart: earthPressureData,
      stabilityResultsChart: stabilityData,
      structuralDesignChart: structuralData,
      basePressureChart: basePressureData, // Add new chart data
    });
  };

  // --- PDF Export Handler ---
  // Remove unnecessary dependencies 'results', 'chartsData'
  const handleExportPDF = useCallback(async () => {
    const resultsElement = document.querySelector('.results'); // Target the main results div
    const chartsGridElement = document.querySelector('.charts-grid'); // Target the grid containing charts

    if (!resultsElement) {
      console.error("Results section not found for PDF export.");
      alert("Cannot export PDF: Results section not found.");
      return;
    }

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;
    const contentWidth = pdfWidth - 2 * margin;
    let currentY = margin; // Track Y position

    pdf.setFontSize(16);
    pdf.text("Retaining Wall Design Results", pdfWidth / 2, currentY, { align: 'center' });
    currentY += 15;

    // --- 1. Capture and Add Main Results ---
    try {
      const mainCanvas = await html2canvas(resultsElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff', // Ensure background
        windowWidth: resultsElement.scrollWidth,
        windowHeight: resultsElement.scrollHeight
      });

      // Remove unused 'mainImgData'
      // const mainImgData = mainCanvas.toDataURL('image/jpeg', 0.8);
      const mainImgWidth = mainCanvas.width;
      const mainImgHeight = mainCanvas.height;
      const mainRatio = mainImgWidth / mainImgHeight;
      let mainImgHeightInPDF = contentWidth / mainRatio;
      let mainImgRenderedHeight = 0;
      let mainImgStartY = 0;

      // Add main results image, handling page breaks
      while (mainImgRenderedHeight < mainImgHeightInPDF) {
        let pageRemainingHeight = pdfHeight - currentY - margin;
        if (pageRemainingHeight <= 10) { // Check if space is too small
          pdf.addPage();
          currentY = margin;
          pageRemainingHeight = pdfHeight - margin - margin;
        }

        const sliceHeightInPDF = Math.min(pageRemainingHeight, mainImgHeightInPDF - mainImgRenderedHeight);
        const sliceHeightInCanvas = sliceHeightInPDF * (mainImgHeight / mainImgHeightInPDF);

        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = mainImgWidth;
        tempCanvas.height = sliceHeightInCanvas;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.drawImage(mainCanvas, 0, mainImgStartY, mainImgWidth, sliceHeightInCanvas, 0, 0, mainImgWidth, sliceHeightInCanvas);
        const sliceImgData = tempCanvas.toDataURL('image/jpeg', 0.8);

        pdf.addImage(sliceImgData, 'JPEG', margin, currentY, contentWidth, sliceHeightInPDF);

        mainImgStartY += sliceHeightInCanvas;
        mainImgRenderedHeight += sliceHeightInPDF;
        currentY += sliceHeightInPDF + 2; // Add small gap

        // Check if we need a new page for the *next* slice
        if (mainImgRenderedHeight < mainImgHeightInPDF && (pdfHeight - currentY - margin <= 10)) {
          pdf.addPage();
          currentY = margin;
        }
      }
       // Ensure currentY is at the end of the added content
       currentY = margin + mainImgRenderedHeight + (mainImgRenderedHeight > 0 ? 5 : 0); // Add gap if content was added


    } catch (err) {
      console.error("Error capturing main results for PDF:", err);
      alert("Failed to capture main results for PDF.");
      return; // Stop if main results fail
    }

    // --- 2. Capture and Add Charts ---
    if (chartsGridElement) {
      const chartContainers = chartsGridElement.querySelectorAll('.chart-container');

      for (const chartContainer of chartContainers) {
         // Check if chart is actually visible (rendered based on conditions)
         if (chartContainer.offsetParent === null) continue; // Skip hidden charts

        try {
          const chartCanvasEl = chartContainer.querySelector('canvas');
          if (!chartCanvasEl) continue; // Skip if no canvas found

          // Use the existing canvas element directly if possible (might be higher quality)
          // Or capture the container div
          const chartCanvas = await html2canvas(chartContainer, { // Capture the container for title etc.
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
          });

          const chartImgData = chartCanvas.toDataURL('image/png');
          const chartImgWidth = chartCanvas.width;
          const chartImgHeight = chartCanvas.height;
          const chartRatio = chartImgWidth / chartImgHeight;
          const chartImgHeightInPDF = contentWidth / chartRatio;

          // Check if the chart fits on the current page
          if (currentY + chartImgHeightInPDF > pdfHeight - margin) {
            pdf.addPage();
            currentY = margin; // Reset Y to top margin of new page
          } else {
            currentY += 5; // Add some space before the chart if on same page
          }

          // Add the chart image
          pdf.addImage(chartImgData, 'PNG', margin, currentY, contentWidth, chartImgHeightInPDF);
          currentY += chartImgHeightInPDF; // Update currentY

        } catch (err) {
          console.error("Error capturing chart for PDF:", err, chartContainer);
          // Continue PDF generation without this chart if it fails
        }
      }
    }

    // --- 3. Save PDF ---
    pdf.save(`retaining-wall-design-${input.wallType}.pdf`);

  }, [input]); // Keep only 'input' as dependency


  // --- JSX Structure ---
  return (
    <div className="retaining-wall-design-tool">
      <h1>Retaining Wall Design Tool</h1>
      <form onSubmit={handleSubmit}>
        {/* Input Parameters */}
        <fieldset>
            <legend>Wall & Soil Properties</legend>
             <div className="form-row">
                <div className="form-group">
                    <label htmlFor="wallType">Wall Type:</label>
                    <select id="wallType" name="wallType" value={input.wallType} onChange={handleChange} required>
                        <option value="gravity">Gravity Wall</option>
                        <option value="cantilever">Cantilever Wall</option>
                        {/* <option value="counterfort">Counterfort Wall</option> */}
                        {/* <option value="sheetPile">Sheet Pile Wall</option> */}
                    </select>
                </div>
                <div className="form-group">
                    <label htmlFor="wallHeight">Wall Height (H) (m):</label>
                    <input type="number" step="0.1" id="wallHeight" name="wallHeight" value={input.wallHeight} onChange={handleChange} required />
                </div>
                 <div className="form-group">
                    <label htmlFor="surchargeLoad">Surcharge Load (q) (kN/m²):</label>
                    <input type="number" step="1" id="surchargeLoad" name="surchargeLoad" value={input.surchargeLoad} onChange={handleChange} placeholder="Uniform surcharge" />
                </div>
            </div>
             <div className="form-row">
                <div className="form-group">
                    <label htmlFor="soilDensity">Soil Density (γ) (kN/m³):</label>
                    <input type="number" step="0.5" id="soilDensity" name="soilDensity" value={input.soilDensity} onChange={handleChange} required />
                </div>
                <div className="form-group">
                    <label htmlFor="frictionAngle">Soil Friction Angle (φ) (°):</label>
                    <input type="number" step="1" id="frictionAngle" name="frictionAngle" value={input.frictionAngle} onChange={handleChange} required />
                </div>
                 <div className="form-group">
                    <label htmlFor="cohesion">Soil Cohesion (c) (kPa):</label>
                    <input type="number" step="1" id="cohesion" name="cohesion" value={input.cohesion} onChange={handleChange} />
                </div>
            </div>
             <div className="form-row">
                 <div className="form-group">
                    <label htmlFor="waterTable">Water Table Depth (m):</label>
                    <input type="number" step="0.1" id="waterTable" name="waterTable" value={input.waterTable} onChange={handleChange} placeholder="Depth from surface" />
                     <small>(0=surface, &gt;H=below base)</small>
                </div>
                <div className="form-group">
                    <label htmlFor="bearingCapacity">Bearing Capacity (q<sub>allow</sub>) (kPa):</label>
                    <input type="number" step="10" id="bearingCapacity" name="bearingCapacity" value={input.bearingCapacity} onChange={handleChange} required />
                </div>
            </div>
             <div className="form-row">
                 <div className="form-group">
                    <label htmlFor="baseFrictionAngle">Base Friction Angle (δ<sub>b</sub>) (°):</label>
                    <input type="number" step="1" id="baseFrictionAngle" name="baseFrictionAngle" value={input.baseFrictionAngle} onChange={handleChange} placeholder="Defaults to φ"/>
                </div>
                 <div className="form-group">
                    <label htmlFor="baseAdhesion">Base Adhesion (c<sub>a</sub>) (kPa):</label>
                    <input type="number" step="1" id="baseAdhesion" name="baseAdhesion" value={input.baseAdhesion} onChange={handleChange} placeholder="Adhesion under base"/>
                </div>
            </div>
        </fieldset>

        <fieldset>
            <legend>Wall Geometry</legend>
             <div className="form-row">
                 <div className="form-group">
                    <label htmlFor="baseWidth">Base Width (B) (m):</label>
                    <input type="number" step="0.1" id="baseWidth" name="baseWidth" value={input.baseWidth} onChange={handleChange} required disabled={input.wallType === 'cantilever'}/>
                     {input.wallType === 'cantilever' && <small>(Auto: Heel+Stem+Toe)</small>}
                </div>
                 <div className="form-group">
                    <label htmlFor="baseThickness">Base Thickness (h<sub>b</sub>) (m):</label>
                    <input type="number" step="0.05" id="baseThickness" name="baseThickness" value={input.baseThickness} onChange={handleChange} required />
                </div>
            </div>
            {/* Show Stem/Heel/Toe only for Cantilever */}
            {input.wallType === 'cantilever' && (
                 <div className="form-row">
                     <div className="form-group">
                        <label htmlFor="stemThicknessBase">Stem Thickness @ Base (m):</label>
                        <input type="number" step="0.05" id="stemThicknessBase" name="stemThicknessBase" value={input.stemThicknessBase} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="stemThicknessTop">Stem Thickness @ Top (m):</label>
                        <input type="number" step="0.05" id="stemThicknessTop" name="stemThicknessTop" value={input.stemThicknessTop} onChange={handleChange} placeholder="Defaults to Base Thick"/>
                    </div>
                </div>
            )}
             {input.wallType === 'cantilever' && (
                 <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="heel">Heel Dimension (m):</label>
                        <input type="number" step="0.1" id="heel" name="heel" value={input.heel} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="toe">Toe Dimension (m):</label>
                        <input type="number" step="0.1" id="toe" name="toe" value={input.toe} onChange={handleChange} required />
                    </div>
                </div>
             )}
        </fieldset>

         <fieldset>
            <legend>Materials & Design</legend>
             <div className="form-row">
                <div className="form-group">
                    <label htmlFor="concreteDensity">Concrete Density (γ<sub>c</sub>) (kN/m³):</label>
                    <input type="number" step="0.5" id="concreteDensity" name="concreteDensity" value={input.concreteDensity} onChange={handleChange} required />
                </div>
                <div className="form-group">
                    <label htmlFor="concreteStrength">Concrete Strength (f<sub>ck</sub>) (MPa):</label>
                    <input type="number" step="5" id="concreteStrength" name="concreteStrength" value={input.concreteStrength} onChange={handleChange} required />
                </div>
            </div>
             <div className="form-row">
                 <div className="form-group">
                    <label htmlFor="steelStrength">Steel Yield (f<sub>y</sub>) (MPa):</label>
                    <input type="number" step="10" id="steelStrength" name="steelStrength" value={input.steelStrength} onChange={handleChange} required />
                </div>
                 <div className="form-group">
                    <label htmlFor="concreteCover">Concrete Cover (mm):</label>
                    <input type="number" step="5" id="concreteCover" name="concreteCover" value={input.concreteCover} onChange={handleChange} required />
                </div>
                {/* <div className="form-group">
                    <label htmlFor="designCode">Design Code:</label>
                    <select id="designCode" name="designCode" value={input.designCode} onChange={handleChange} required>
                        <option value="Eurocode">Eurocode (Simplified)</option>
                        {/* <option value="AASHTO">AASHTO</option> */}
                        {/* <option value="IS456">IS 456</option> */}
                    {/* </select>
                </div> */}
            </div>
        </fieldset>

        {/* Submit Button */}
        <button type="submit">Calculate</button>
      </form>

      {/* --- Results Display (Updated) --- */}
      {results.error && <p className="error-message"><strong>Error:</strong> {results.error}</p>}

      {results.fsOverturning && !results.error && (
        <div className="results">
          <h2>Stability Analysis</h2>
          <p>Factor of Safety - Overturning: <strong>{results.fsOverturning}</strong> {results.fsOverturning >= 1.5 ? '(OK >= 1.5)' : '(FAIL < 1.5)'}</p>
          <p>Factor of Safety - Sliding: <strong>{results.fsSliding}</strong> {results.fsSliding >= 1.5 ? '(OK >= 1.5)' : '(FAIL < 1.5)'}</p>
          <p>Factor of Safety - Bearing: <strong>{results.fsBearing}</strong> {results.fsBearing >= 2.0 ? '(OK >= 2.0)' : '(FAIL < 2.0)'}</p>
          <p>Base Eccentricity (e): {results.eccentricity} m {Math.abs(results.eccentricity) <= input.baseWidth / 6 ? '(OK <= B/6)' : '(WARN > B/6)'}</p>
          <p>Max Base Pressure (q<sub>max</sub>): {results.basePressureMax} kPa (Allowable: {input.bearingCapacity} kPa)</p>
          <p>Min Base Pressure (q<sub>min</sub>): {results.basePressureMin} kPa {results.basePressureMin < 0 ? '(WARN - Tension Implied)' : ''}</p>
          <hr/>
          <p>Moment Overturning: {results.momentOverturning} kNm/m</p>
          <p>Moment Resisting: {results.momentResisting} kNm/m</p>
          <p>Total Horizontal Force: {results.horizontalForce} kN/m</p>
          <p>Total Resisting Force (Sliding): {results.resistingForce} kN/m</p>
          <p>Total Vertical Load: {results.verticalLoad} kN/m</p>

          <h2>Earth & Water Pressure Forces (per m)</h2>
          <p>Active Pressure Coeff. (K<sub>a</sub>): {results.ka}</p>
          <p>Active Force (Soil): {results.activeForceSoil} kN/m</p>
          <p>Active Force (Surcharge): {results.activeForceSurcharge} kN/m</p>
          <p>Hydrostatic Force: {results.hydrostaticForce} kN/m</p>

          {input.wallType === 'cantilever' && (
              <>
                <h2>Structural Design (Stem Base - per m)</h2>
                <p>Design Bending Moment (M<sub>Ed</sub>): {results.stemBendingMoment} kNm/m</p>
                <p>Design Shear Force (V<sub>Ed</sub>): {results.stemShearForce} kN/m</p>
                <p>Required Steel Area (A<sub>s,req</sub>): {results.stemRequiredSteel} mm²/m <small>(Vertical bars, tension face)</small></p>
              </>
          )}

          {/* <p>Settlement (mm): {results.settlement}</p> */}
        </div>
      )}

      {/* --- Charts (Updated) --- */}
       <div className="charts-grid"> {/* Use a grid container */}
          {chartsData.stabilityResultsChart && !results.error && (
            <div className="chart-container">
              <h2>Stability Factors of Safety</h2>
              <Bar data={chartsData.stabilityResultsChart} options={chartOptions.stability} height={300}/>
            </div>
          )}

           {chartsData.basePressureChart && !results.error && (
            <div className="chart-container">
              <h2>Base Pressure Distribution</h2>
              <Bar data={chartsData.basePressureChart} options={chartOptions.basePressure} height={300}/>
            </div>
          )}

          {chartsData.earthPressureChart && !results.error && (
            <div className="chart-container">
              <h2>Horizontal Forces</h2>
              <Bar data={chartsData.earthPressureChart} options={chartOptions.earthPressure} height={300}/>
            </div>
          )}

          {chartsData.structuralDesignChart && input.wallType === 'cantilever' && !results.error && (
            <div className="chart-container">
              <h2>Stem Base Actions</h2>
              <Bar data={chartsData.structuralDesignChart} options={chartOptions.structural} height={300}/>
            </div>
          )}
       </div>

       {/* --- Export Button --- */}
       {results.fsOverturning && !results.error && (
         <button type="button" onClick={handleExportPDF} style={{ marginTop: '20px', padding: '10px 15px' }}>
           Export Results to PDF
         </button>
       )}
    </div>
  );
};

// Define common chart options outside the component for clarity
const chartOptions = {
    common: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'top' } },
    },
    stability: {
        responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' }, title: { display: true, text: 'Stability Factors of Safety' } },
        scales: { y: { beginAtZero: true, suggestedMax: 3 } } // Suggest max for better visualization
    },
    basePressure: {
         responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' }, title: { display: true, text: 'Base Pressure (kPa)' } },
         scales: { y: { beginAtZero: true } }
    },
    earthPressure: {
         responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' }, title: { display: true, text: 'Horizontal Forces (kN/m)' } },
         scales: { y: { beginAtZero: true } }
    },
    structural: {
         responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' }, title: { display: true, text: 'Stem Base Actions (per m)' } },
         scales: { y: { beginAtZero: true } }
    }
};


export default RetainingWallDesignTool;