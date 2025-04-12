import React, { useState, useEffect, useRef, useCallback } from 'react'; // Added useCallback
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler // Added Filler
} from 'chart.js';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import './ReinforcedConcreteDesignTool.css';
import {
    calculateEffectiveI, calculateMcr, calculateDeflection, calculateCrackWidth,
    calculateEffectiveFlangeWidth, calculateTBeamMomentCapacity,
    calculatePunchingShearCapacity, getTwoWaySlabCoefficients,
    calculateMomentMagnification
} from './rcDesignCalculations'; // Assuming it's in the same folder

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler); // Added Filler

// --- Constants and Setup ---
const standardRebars = [
  { dia: 8, area: 50 },
  { dia: 10, area: 79 },
  { dia: 12, area: 113 },
  { dia: 16, area: 201 },
  { dia: 20, area: 314 },
  { dia: 25, area: 491 },
  { dia: 32, area: 804 },
  { dia: 40, area: 1257 }
];

const selectRebar = (requiredArea) => {
  for (let bar of standardRebars) {
    if (bar.area >= requiredArea) {
      return bar;
    }
  }
  return standardRebars[standardRebars.length - 1]; // Return largest if needed
};

const selectStirrupBar = (targetDia) => {
    let closestBar = standardRebars[0];
    let minDiff = Math.abs(targetDia - closestBar.dia);
    for(let i = 1; i < standardRebars.length; i++) {
        let diff = Math.abs(targetDia - standardRebars[i].dia);
        if (diff < minDiff) {
            minDiff = diff;
            closestBar = standardRebars[i];
        }
    }
    // Ensure minimum stirrup size (e.g., 8mm or 10mm)
    return standardRebars.find(b => b.dia === Math.max(8, closestBar.dia)) || standardRebars[0];
}

const GAMMA_C = 1.5;
const GAMMA_S = 1.15;
const ALPHA_CC = 0.85;
const ES_MODULUS = 200000; // MPa

const industryRules = {
  beam: {
    minReinforcementRatio: (fck, fy) => Math.max(0.26 * (Math.pow(fck, 0.5) / fy), 0.0013), // EC2 formula for min As
    maxReinforcementRatio: 0.04, // Max 4% of gross area (Ac)
    minStirrupRatio: (fck, fy) => 0.08 * Math.sqrt(fck) / fy,
    maxStirrupSpacingFactor: 0.75, // Max spacing = 0.75 * d
    maxStirrupSpacingAbsolute: 300, // mm
    deflectionLimitSpanRatio: 250, // L/250
  },
  column: {
    minCover: (exposureClass = 'XC1') => (exposureClass === 'XC1' ? 25 : 40), // Example based on exposure
    minReinforcementRatio: 0.01, // 1% of Ac
    maxReinforcementRatio: 0.04, // 4% of Ac (can be higher at laps)
    minBarDiameter: 12, // mm
    maxClearSpacingFactor: 1.5, // 1.5 * aggregate size (assume 20mm agg) -> 30mm, or bar dia
    maxClearSpacingAbsolute: 300, // mm
    minTieDiameterFactor: 0.25, // 0.25 * main bar dia
    minTieDiameterAbsolute: 8, // mm
    maxTieSpacingFactor: 12, // 12 * main bar dia
    maxTieSpacingDimFactor: 0.6, // 0.6 * smaller column dim
    maxTieSpacingAbsolute: 300, // mm
  },
  slab: {
    minMainReinforcementRatio: (fck, fy) => Math.max(0.26 * (Math.pow(fck, 0.5) / fy), 0.0013),
    maxMainReinforcementRatio: 0.04,
    minDistributionReinforcementRatio: 0.002, // Simplified - often 20% of main steel
    minBarSpacing: 75, // mm
    maxBarSpacingMainFactor: 1.5, // 1.5 * h (slab thickness)
    maxBarSpacingMainAbsolute: 300, // mm
    maxBarSpacingDistFactor: 2.0, // 2.0 * h
    maxBarSpacingDistAbsolute: 350, // mm
    deflectionLimitSpanRatio: 250, // L/250
  }
};

const ReinforcedConcreteDesignTool = () => {
  const [inputValues, setInputValues] = useState({
    // --- General ---
    designCode: 'EC2', // Added
    elementType: 'beam',
    concreteStrength: '30',
    steelStrength: '500',
    exposureClass: 'XC1',
    aggregateSize: '20',
    // --- Beam ---
    beamType: 'rectangular', // Added: rectangular, T, L
    beamWidth: '300', // bw
    beamDepth: '500', // D
    beamFlangeWidth: '1000', // bf (for T/L) - effective width calculated later
    beamFlangeThickness: '150', // hf (for T/L)
    beamSpacing: '3000', // Center-to-center spacing (for T/L beff calc)
    beamSpan: '6000',
    beamSupportType: 'simplySupported',
    beamLoadType: 'uniform',
    beamDeadLoad: '10', // gk (kN/m or kN/m²)
    beamLiveLoad: '15', // qk (kN/m or kN/m²)
    // --- Column ---
    columnWidth: '400',
    columnHeight: '400',
    columnLength: '3000', // Effective length L0
    columnAxialLoad: '1000', // NEd
    columnMomentMx: '50', // M0Ed,x (1st order)
    columnMomentMy: '30', // M0Ed,y (1st order)
    // --- Slab ---
    slabType: 'oneWay', // Added: oneWay, twoWay
    slabThickness: '200',
    slabSpanX: '5000', // Lx (Primary span for one-way)
    slabSpanY: '7000', // Ly (for two-way)
    slabSupportType: 'simplySupported', // Simplified: Add options for edge conditions
    slabDeadLoad: '2', // gk (kN/m²)
    slabLiveLoad: '3', // qk (kN/m²)
    // --- Punching Shear (Optional Inputs for Slab) ---
    punchingColumnWidth: '400',
    punchingColumnHeight: '400',
    punchingColumnLoad: '1000', // NEd from column causing punching
  });

  const [result, setResult] = useState(null);
  const [calculatedInputs, setCalculatedInputs] = useState({});
  const [chartData, setChartData] = useState(null); // State for chart data

  // --- Derived Input Calculations ---
  useEffect(() => {
    const {
      elementType, beamWidth, beamDepth, beamFlangeThickness, beamType,
      columnWidth, columnHeight, slabThickness,
      exposureClass, steelStrength, concreteStrength
    } = inputValues;

    const fck = parseFloat(concreteStrength) || 0;
    const fy = parseFloat(steelStrength) || 0;
    const cover = industryRules.column.minCover(exposureClass); // Use column rule as generally conservative

    let d = 0, d_comp = 0; // Effective depth tension & compression (d')
    let selfWeight = 0;
    const concreteUnitWeight = 24; // kN/m³
    let fctm = 0; // Mean concrete tensile strength
    let Ecm = 0; // Mean concrete modulus

    if (fck > 0) {
        // EC2 formulas (approx)
        fctm = (fck <= 50) ? 0.3 * Math.pow(fck, 2/3) : 2.12 * Math.log(1 + (fck + 8) / 10);
        Ecm = 22 * Math.pow((fck + 8) / 10, 0.3) * 1000; // MPa
    }

    // Estimate d and self-weight based on element type
    if (elementType === 'beam') {
        const D = parseFloat(beamDepth) || 0;
        const bw = parseFloat(beamWidth) || 0;
        const hf = parseFloat(beamFlangeThickness) || 0;
        const bf = parseFloat(inputValues.beamFlangeWidth) || 0; // Use input bf for SW calc

        // Estimate d: D - cover - stirrup_dia - main_bar_dia/2 (more conservative)
        d = D - cover - 10 - (20 / 2); // Assume T10 stirrup, T20 main bar
        d_comp = cover + 10 + (12 / 2); // d' for compression steel (assume T12)

        let areaForSW = (bw / 1000) * (D / 1000);
        if (beamType === 'T' || beamType === 'L') {
            // Add flange area for self-weight (approx)
            areaForSW = (bw / 1000) * ((D - hf) / 1000) + (bf / 1000) * (hf / 1000);
        }
        selfWeight = areaForSW * concreteUnitWeight; // kN/m

    } else if (elementType === 'column') {
        const W = parseFloat(columnWidth) || 0;
        const H = parseFloat(columnHeight) || 0;
        d = H - cover - 10 - (20 / 2); // d in H direction
        d_comp = cover + 10 + (12/2);
        selfWeight = 0; // Included in NEd input

    } else if (elementType === 'slab') {
        const h = parseFloat(slabThickness) || 0;
        d = h - cover - (16 / 2); // Assume T16 main bar
        d_comp = cover + (10/2); // Assume T10 top bar
        selfWeight = (h / 1000) * concreteUnitWeight; // kN/m²
    }

    setCalculatedInputs({
      effectiveDepth: Math.max(0, d).toFixed(0),
      compSteelDepth: Math.max(0, d_comp).toFixed(0),
      selfWeight: selfWeight.toFixed(2),
      concreteCover: cover,
      fcd: (ALPHA_CC * fck / GAMMA_C).toFixed(2),
      fyd: (fy / GAMMA_S).toFixed(2),
      fctm: fctm.toFixed(2), // Mean tensile strength
      Ecm: Ecm.toFixed(0), // Mean concrete modulus
    });

  }, [inputValues]); // Recalculate when inputs change

  // --- Handle Input Change ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setInputValues(prev => ({ ...prev, [name]: value }));
    setResult(null);
  };

  // --- Calculation Functions (Modified to use helpers) ---

  const calculateBeamDesign = () => {
    const {
      beamWidth, beamDepth, beamSpan, beamLoadType, beamSupportType,
      beamDeadLoad, beamLiveLoad, concreteStrength, steelStrength,
      beamType, beamFlangeThickness, beamFlangeWidth, beamSpacing
    } = inputValues;
    const { effectiveDepth, selfWeight, fcd, fyd, concreteCover, fctm, Ecm } = calculatedInputs;

    // Parse inputs
    const bw = parseFloat(beamWidth) || 0; // mm (web width)
    const D = parseFloat(beamDepth) || 0; // mm
    const d = parseFloat(effectiveDepth) || 0; // mm
    const L = parseFloat(beamSpan) / 1000 || 0; // m
    const fck = parseFloat(concreteStrength) || 0;
    const fy = parseFloat(steelStrength) || 0;
    const sw = parseFloat(selfWeight) || 0; // kN/m
    const gk = parseFloat(beamDeadLoad) || 0; // kN/m
    const qk = parseFloat(beamLiveLoad) || 0; // kN/m
    const hf = parseFloat(beamFlangeThickness) || 0; // mm
    // Note: Input beamFlangeWidth is nominal/max, effective width bf is calculated
    const spacing = parseFloat(beamSpacing) || 0; // mm

    if (bw <= 0 || D <= 0 || d <= 0 || L <= 0 || fck <= 0 || fy <= 0) {
      return { error: "Invalid beam dimensions, span, or material strengths." };
    }
    if ((beamType === 'T' || beamType === 'L') && (hf <= 0)) {
        return { error: "Flange thickness (hf) required for T/L beams." };
    }

    // --- 1. Applied Loads, Moments, Shears ---
    const w_gk = gk + sw; // Total characteristic dead load
    const w_qk = qk;     // Total characteristic live load
    const w_d = 1.35 * w_gk + 1.5 * w_qk; // Factored UDL (kN/m) - EC0 ULS
    const w_ser = w_gk + w_qk; // Characteristic Service Load (kN/m) - SLS (simplified)

    let M_Ed = 0, V_Ed = 0, M_ser = 0; // ULS Moment, ULS Shear, SLS Moment

    // Simplified moment/shear calculation (as before)
    if (beamLoadType === 'uniform') {
      if (beamSupportType === 'simplySupported') {
        M_Ed = w_d * L * L / 8;
        V_Ed = w_d * L / 2;
        M_ser = w_ser * L * L / 8;
      } else { // Continuous (approximate coefficients)
        M_Ed = w_d * L * L / 10; // Max hogging/sagging moment
        V_Ed = 0.6 * w_d * L; // Max shear at support
        M_ser = w_ser * L * L / 10; // Approx service moment
      }
    } // Add point load logic if needed

    // --- Generate Data for Charts ---
    let generatedChartData = null;
    try {
        const points = 21; // More points for smoother curves
        const labels = Array.from({ length: points }, (_, i) => (i * L / (points - 1)).toFixed(2)); // X-axis labels (position in m)
        const momentData = [];
        const shearData = [];

        for (let i = 0; i < points; i++) {
            const x = i * L / (points - 1); // Position along the beam (m)
            let M_x = 0;
            let V_x = 0;
            // Calculate Moment and Shear at position x based on load and support
            if (beamLoadType === 'uniform') {
                if (beamSupportType === 'simplySupported') {
                    M_x = (w_d * x / 2) * (L - x);
                    V_x = w_d * (L / 2 - x);
                } else { // Continuous (Approximate - parabolic moment, linear shear)
                    const M_support = -w_d * L * L / 10; // Approx support moment
                    const M_span = w_d * L * L / 14; // Approx span moment (adjust factor as needed)
                    // Parabolic approximation for moment
                    M_x = M_support + 4 * (M_span - M_support) * (x / L) * (1 - x / L);
                    // Linear approximation for shear (adjust V at support if needed)
                    V_x = (0.6 * w_d * L) * (1 - 2 * x / L);
                }
            }
            momentData.push(M_x.toFixed(2));
            shearData.push(V_x.toFixed(2));
        }

        // Deflection calculation requires Ieff, which depends on M_ser(x) - complex for chart
        // For now, only plot Moment and Shear

        generatedChartData = {
          labels,
          datasets: [
            {
              label: 'Bending Moment M_Ed (kNm)',
              data: momentData,
              borderColor: 'rgb(255, 99, 132)',
              backgroundColor: 'rgba(255, 99, 132, 0.1)',
              yAxisID: 'yMoment',
              fill: true,
              tension: 0.1, // Slightly curve the line
            },
            {
              label: 'Shear Force V_Ed (kN)',
              data: shearData,
              borderColor: 'rgb(54, 162, 235)',
              backgroundColor: 'rgba(54, 162, 235, 0.1)',
              yAxisID: 'yShear',
              fill: true,
              tension: 0.1,
            },
          ],
        };
    } catch (chartError) {
        console.error("Error generating chart data:", chartError);
    }

    // --- 2. Effective Flange Width (T/L Beams) ---
    let bf = bw; // Effective flange width defaults to web width
    let beff_results = null;
    if (beamType === 'T' || beamType === 'L') {
        const L0 = (beamSupportType === 'simplySupported' ? 0.85 : 0.7) * L * 1000; // Distance between points of zero moment (mm)
        beff_results = calculateEffectiveFlangeWidth(bw, hf, L0, spacing);
        bf = (beamType === 'T') ? beff_results.beff_T : beff_results.beff_L;
        bf = Math.min(bf, parseFloat(beamFlangeWidth) || bf); // Cannot exceed physical width
    }
    bf = Math.max(bf, bw); // Ensure bf is at least bw

    // --- 3. Flexural Design (Bending Reinforcement) ---
    let As_req = 0, z = 0, x = 0, K = 0, M_Rd = 0;
    const K_bal = 0.167; // Limit for singly reinforced assumption / redistribution

    if (beamType === 'rectangular' || bf === bw) {
        // Rectangular section calculation
        K = (M_Ed * 1e6) / (bw * d * d * fck);
        if (K > K_bal) {
            // Compression steel might be needed - return error for now
            return { error: `Section potentially requires compression steel (K = ${K.toFixed(3)} > K_bal = ${K_bal}). Increase dimensions or fck.` };
        } else {
            z = d * (0.5 + Math.sqrt(0.25 - K / (2 * ALPHA_CC / 0.8))); // Approximation
            z = Math.min(z, 0.95 * d);
            x = (d - z) / 0.4;
            As_req = (M_Ed * 1e6) / (parseFloat(fyd) * z);
            M_Rd = As_req * parseFloat(fyd) * z * 1e-6; // Moment capacity based on As_req
        }
    } else {
        // T/L Beam calculation
        // First, check capacity assuming NA in flange (treat as rect bf wide)
        K = (M_Ed * 1e6) / (bf * d * d * fck);
        if (K <= K_bal) {
             z = d * (0.5 + Math.sqrt(0.25 - K / (2 * ALPHA_CC / 0.8)));
             z = Math.min(z, 0.95 * d);
             x = (d - z) / 0.4;
             if (x <= hf) { // NA is in flange
                 As_req = (M_Ed * 1e6) / (parseFloat(fyd) * z);
                 M_Rd = As_req * parseFloat(fyd) * z * 1e-6;
             } else { // NA is in web - need T-beam specific calc
                 // Recalculate As_req based on T-beam stress block
                 // Approximate: Use rectangular calc with bf, then check T-beam capacity
                 As_req = (M_Ed * 1e6) / (parseFloat(fyd) * z); // Initial estimate
                 const tBeamCapacityResult = calculateTBeamMomentCapacity(bf, bw, hf, d, parseFloat(fcd), parseFloat(fyd), As_req);
                 M_Rd = tBeamCapacityResult.M_Rd;
                 x = tBeamCapacityResult.x; // Update x based on T-beam calc
                 // Adjust As_req slightly if M_Rd doesn't quite match M_Ed (iterative process needed for precision)
                 if (M_Rd < M_Ed * 0.98) { // If capacity is significantly lower
                     // Increase As_req proportionally (simplified)
                     As_req *= (M_Ed / M_Rd);
                     console.warn("Adjusting As_req for T-beam web compression case.");
                 }
             }
        } else {
             return { error: `T/L Beam section potentially requires compression steel (K = ${K.toFixed(3)} > K_bal = ${K_bal}). Increase dimensions or fck.` };
        }
    }


    // --- 4. Reinforcement Checks ---
    const Ac_gross = bw * D + (bf > bw ? (bf - bw) * hf : 0); // Gross area including flange
    const As_min = industryRules.beam.minReinforcementRatio(fck, fy) * bw * d; // Min based on web width
    const As_max = industryRules.beam.maxReinforcementRatio * Ac_gross;

    let As_final = Math.max(As_req, As_min);
    let minGovNote = "";
    if (As_final === As_min && As_req < As_min) {
        minGovNote = " (Minimum reinforcement governs)";
        // Recalculate M_Rd based on As_min if needed
        if (beamType === 'rectangular' || bf === bw || x <= hf) {
             z = d * (0.5 + Math.sqrt(0.25 - (As_min * parseFloat(fyd)) / (bf * d * parseFloat(fcd) * ALPHA_CC / 0.8))); // Re-calc z approx
             z = Math.min(z, 0.95*d);
             M_Rd = As_min * parseFloat(fyd) * z * 1e-6;
        } else {
             M_Rd = calculateTBeamMomentCapacity(bf, bw, hf, d, parseFloat(fcd), parseFloat(fyd), As_min).M_Rd;
        }
    }

    if (As_final > As_max) {
       return { error: `Required reinforcement (${As_final.toFixed(0)} mm²) exceeds maximum limit (${As_max.toFixed(0)} mm²). Increase section size.` };
    }

    // --- 5. Rebar Selection ---
    let chosenBars = "N/A";
    // Use bw for spacing check
    for (let numBars = 2; numBars <= 8; numBars++) { // Allow more bars
        const areaPerBar = As_final / numBars;
        const selectedBar = selectRebar(areaPerBar);
        const clearSpacing = (bw - 2 * concreteCover - numBars * selectedBar.dia) / (numBars - 1);
        const minSpacing = Math.max(20, selectedBar.dia, parseFloat(inputValues.aggregateSize) + 5);
        if (numBars === 1 || clearSpacing >= minSpacing) {
            chosenBars = `${numBars} x T${selectedBar.dia}`;
            break;
        }
    }
     if (chosenBars === "N/A") {
         return { error: `Could not fit required reinforcement (${As_final.toFixed(0)} mm²) within beam web width ${bw}mm. Check spacing.` };
     }

    // --- 6. Shear Design (Stirrups) ---
    // Use bw (web width) for shear calculations
    const k_shear = Math.min(1 + Math.sqrt(200 / d), 2.0);
    const rho_l = Math.min(As_final / (bw * d), 0.02);
    const V_Rd_c = (0.18 / GAMMA_C) * k_shear * Math.pow(100 * rho_l * fck, 1/3) * bw * d * 1e-3; // kN
    const v1 = 0.6 * (1 - fck / 250);
    const cotTheta = 1.0; // Assume 45 deg
    // Use z from flexural calc, ensure it's reasonable
    const z_shear = Math.max(0.8*d, Math.min(z, 0.9*d)); // Use calculated z, bounded
    const V_Rd_max = (ALPHA_CC * bw * z_shear * v1 * fck / (cotTheta + 1/cotTheta)) * 1e-3; // kN

    let stirrupInfo = "No shear reinforcement required (V_Ed <= V_Rd,c)";
    let stirrupSpacing = "N/A", stirrupBarDia = "N/A";

    if (V_Ed > V_Rd_max) {
      return { error: `Shear demand (${V_Ed.toFixed(1)} kN) exceeds maximum capacity (${V_Rd_max.toFixed(1)} kN). Increase section size or fck.` };
    }
    if (V_Ed > V_Rd_c) {
      const Asw_s_req = (V_Ed * 1e3) / (parseFloat(fyd) * z_shear * cotTheta);
      const Asw_s_min = industryRules.beam.minStirrupRatio(fck, fy) * bw; // sin(90)=1
      const Asw_s_design = Math.max(Asw_s_req, Asw_s_min);
      const stirrupTargetDia = Math.max(6, parseFloat(chosenBars.split('T')[1]) / 4);
      const stirrupBar = selectStirrupBar(stirrupTargetDia);
      const Asw_provided_per_stirrup = 2 * stirrupBar.area; // Assume 2 legs
      const s_calc = Asw_provided_per_stirrup / Asw_s_design;
      const s_max_1 = industryRules.beam.maxStirrupSpacingFactor * d;
      const s_max_2 = industryRules.beam.maxStirrupSpacingAbsolute;
      const s_max = Math.min(s_max_1, s_max_2);
      stirrupSpacing = Math.floor(Math.min(s_calc, s_max) / 10) * 10;
      stirrupBarDia = stirrupBar.dia;
      stirrupInfo = `T${stirrupBarDia} @ ${stirrupSpacing} mm`;
    }

    // --- 7. Deflection Check (Detailed - Branson's) ---
    let deflection_total = 0, deflectionLimit = 0, deflectionCheck = "N/A";
    try {
        const Ig_rect = bw * Math.pow(D, 3) / 12; // Approx Ig for rect part
        // Add flange contribution to Ig (Steiner's theorem) - simplified
        const Ig_flange = (bf > bw) ? (bf - bw) * Math.pow(hf, 3) / 12 + (bf - bw) * hf * Math.pow(D/2 - hf/2, 2) : 0;
        const Ig = Ig_rect + Ig_flange; // Gross Moment of Inertia (mm^4)

        // Cracked Moment of Inertia (Icr) - Simplified for singly reinforced rect section
        const n = ES_MODULUS / Ecm; // Modular ratio
        const kd = (-n * As_final + Math.sqrt(Math.pow(n * As_final, 2) + 2 * bw * n * As_final * d)) / bw; // Cracked NA depth
        const Icr = (bw * Math.pow(kd, 3) / 3) + n * As_final * Math.pow(d - kd, 2); // mm^4

        const y_t = D / 2; // Approx distance to tension fiber
        const Mcr = calculateMcr(parseFloat(fctm), Ig, y_t); // kNm
        const Ieff = calculateEffectiveI(Ig, Icr, Mcr, M_ser); // mm^4

        deflection_total = calculateDeflection(w_ser, L, Ecm, Ieff); // mm
        deflectionLimit = (L * 1000) / industryRules.beam.deflectionLimitSpanRatio; // mm
        deflectionCheck = deflection_total <= deflectionLimit ? `Pass (${deflection_total.toFixed(1)} mm <= ${deflectionLimit.toFixed(1)} mm)` : `Fail (${deflection_total.toFixed(1)} mm > ${deflectionLimit.toFixed(1)} mm)`;
    } catch (deflectionError) {
        console.error("Deflection calculation failed:", deflectionError);
        deflectionCheck = "Calculation Error";
    }

    // --- 8. Crack Width Check (Simplified) ---
    let crackWidth = 0, crackWidthLimit = 0.3, crackWidthCheck = "N/A"; // Limit 0.3mm for XC3/XC4
    try {
        // Estimate steel stress under service load (SLS)
        // Simplified: Assume linear elastic, use Ieff or Icr
        const M_ser_Nmm = M_ser * 1e6;
        const n = ES_MODULUS / Ecm;
        // Re-calc cracked NA depth kd if needed (or use from deflection)
        const kd = (-n * As_final + Math.sqrt(Math.pow(n * As_final, 2) + 2 * bw * n * As_final * d)) / bw;
        const steelStress_ser = (M_ser_Nmm * (d - kd) * n) / ((bw * Math.pow(kd, 3) / 3) + n * As_final * Math.pow(d - kd, 2)); // Stress in MPa using cracked section analysis

        const barDia = parseFloat(chosenBars.split('T')[1]);
        const numBars = parseInt(chosenBars.split(' ')[0]);
        const barSpacing = (bw - 2 * concreteCover - barDia) / (numBars > 1 ? numBars - 1 : 1); // Approx center-to-center

        // Effective tension area (Ac,eff) - EC2 7.3.4(2) - Simplified: Rectangular area around bars
        const h_c_eff = Math.min(2.5 * (D - d), (D - x) / 3, D / 2); // x from ULS calc
        const Ac_eff = bw * h_c_eff;

        crackWidth = calculateCrackWidth(steelStress_ser, barDia, barSpacing, concreteCover, parseFloat(fctm), Ecm, As_final, Ac_eff);
        crackWidthCheck = crackWidth <= crackWidthLimit ? `Pass (${crackWidth.toFixed(2)} mm <= ${crackWidthLimit} mm)` : `Fail (${crackWidth.toFixed(2)} mm > ${crackWidthLimit} mm)`;

    } catch (crackError) {
        console.error("Crack width calculation failed:", crackError);
        crackWidthCheck = "Calculation Error";
    }


    const designResult = {
      elementType: `Beam (${beamType})`,
      effectiveFlangeWidth_bf: (beamType !== 'rectangular' ? bf.toFixed(0) + ' mm' : 'N/A'),
      appliedMoment_M_Ed: M_Ed.toFixed(2) + ' kNm',
      appliedShear_V_Ed: V_Ed.toFixed(2) + ' kN',
      momentCapacity_M_Rd: M_Rd.toFixed(2) + ' kNm',
      requiredSteelArea_As_req: As_req.toFixed(0) + ' mm²',
      minSteelArea_As_min: As_min.toFixed(0) + ' mm²',
      maxSteelArea_As_max: As_max.toFixed(0) + ' mm²',
      providedSteelArea_As_prov: As_final.toFixed(0) + ' mm²' + minGovNote,
      chosenFlexuralBars: chosenBars,
      neutralAxisDepth_x: x.toFixed(1) + ' mm',
      leverArm_z: z.toFixed(1) + ' mm',
      concreteShearCapacity_V_Rd_c: V_Rd_c.toFixed(2) + ' kN',
      maxShearCapacity_V_Rd_max: V_Rd_max.toFixed(2) + ' kN',
      requiredStirrups: stirrupInfo,
      estimatedDeflection: deflection_total.toFixed(1) + ' mm',
      deflectionCheck: deflectionCheck,
      estimatedCrackWidth: crackWidth.toFixed(2) + ' mm',
      crackWidthCheck: crackWidthCheck,
      notes: "Simplified EC2 checks. T-Beam/Column/Slab checks approximate. Deflection/Crack checks at max moment location. Review code details.", // Updated notes
    };

    // Return both results and chart data
    return { designResult, chartData: generatedChartData };
  };

  const calculateColumnDesign = () => {
      const {
          columnWidth, columnHeight, columnLength, columnAxialLoad,
          columnMomentMx, columnMomentMy, // Use 1st order moments
          concreteStrength, steelStrength
      } = inputValues;
      // Destructure calculatedInputs *after* parsing basic values
      const { fcd, fyd, Ecm, concreteCover, compSteelDepth } = calculatedInputs;

      // --- Parse inputs and define core variables ---
      const W = parseFloat(columnWidth) || 0; // mm (Width)
      const H = parseFloat(columnHeight) || 0; // mm (Height)
      const L0 = parseFloat(columnLength) || 0; // mm (Effective Length)
      const N_Ed = parseFloat(columnAxialLoad) || 0; // kN (Design Axial Load, compression positive)
      const M0Ed_x = parseFloat(columnMomentMx) || 0; // kNm (1st order moment about X)
      const M0Ed_y = parseFloat(columnMomentMy) || 0; // kNm (1st order moment about Y)
      const fck = parseFloat(concreteStrength) || 0;
      const fy = parseFloat(steelStrength) || 0;

      if (W <= 0 || H <= 0 || L0 <= 0 || fck <= 0 || fy <= 0) {
          return { error: "Invalid column dimensions, length, or material strengths." };
      }

      const Ac = W * H; // mm² (Gross concrete area)

      // --- Estimate As_req first (needed for NRd_refined in magnification) ---
      const M_Ed_dom_est = Math.max(M0Ed_x, M0Ed_y); // Use 1st order for initial As_req estimate
      const h_dom_est = (M_Ed_dom_est === M0Ed_x) ? H : W;
      const d_dom_est = h_dom_est - (concreteCover || 25) - 10 - (20/2); // Assume 20mm main bar for estimate
      const approx_lever_arm_est = d_dom_est - (compSteelDepth || 40);
      const safe_lever_arm_est = Math.max(approx_lever_arm_est, 0.1 * d_dom_est);
      const As_req_moment_est = (M_Ed_dom_est * 1e6) / (parseFloat(fyd) * safe_lever_arm_est);
      const As_req_axial_est = Math.max(0, (N_Ed * 1000 - ALPHA_CC * Ac * parseFloat(fcd)) / parseFloat(fyd));
      let As_req_est = Math.max(As_req_axial_est + As_req_moment_est, 0.5 * As_req_axial_est + 1.5 * As_req_moment_est);
      const As_min_est = industryRules.column.minReinforcementRatio * Ac;
      As_req_est = Math.max(As_req_est, As_min_est);

      // --- 1. Slenderness Check & Moment Magnification ---
      const i_y = Math.sqrt((W * Math.pow(H, 3) / 12) / Ac); // Radius of gyration about y-axis (bending about x)
      const i_x = Math.sqrt((H * Math.pow(W, 3) / 12) / Ac); // Radius of gyration about x-axis (bending about y)
      const lambda_y = L0 / i_y; // Slenderness ratio for bending about x
      const lambda_x = L0 / i_x; // Slenderness ratio for bending about y

      // Simplified lambda_lim calculation (EC2 Eq 5.13N)
      const A = 1 / (1 + 0.2 * 1.0); // phi_ef = 1.0 (simplified creep)
      const B = 1.1; // rm = M01/M02 = 1.0 (simplified moment ratio)
      const C = 0.7; // n = NEd / (Ac*fcd) - simplified C=0.7
      const lambda_lim = (20 * A * B * C) / Math.sqrt(N_Ed / (Ac * parseFloat(fcd) || 1e-6));

      let M_Ed_x = M0Ed_x; // Start with 1st order moments
      let M_Ed_y = M0Ed_y;
      let slendernessInfo = "";

      // Calculate NRd approximation using the estimated steel
      const NRd_approx_for_mag = (ALPHA_CC * Ac * parseFloat(fcd) + As_req_est * parseFloat(fyd)) * 1e-3;

      if (lambda_y > lambda_lim) { // Slender about y-axis (bending about x)
          const magResultX = calculateMomentMagnification(L0, H, N_Ed, NRd_approx_for_mag, M0Ed_x, Ecm, Ac, As_req_est);
          M_Ed_x = magResultX.MEd;
          slendernessInfo += `Slender about y-axis (${lambda_y.toFixed(1)} > ${lambda_lim.toFixed(1)}). M_Ed,x magnified by ${magResultX.delta.toFixed(2)}. `;
      }
      if (lambda_x > lambda_lim) { // Slender about x-axis (bending about y)
          const magResultY = calculateMomentMagnification(L0, W, N_Ed, NRd_approx_for_mag, M0Ed_y, Ecm, Ac, As_req_est);
          M_Ed_y = magResultY.MEd;
          slendernessInfo += `Slender about x-axis (${lambda_x.toFixed(1)} > ${lambda_lim.toFixed(1)}). M_Ed,y magnified by ${magResultY.delta.toFixed(2)}. `;
      }
      if (slendernessInfo === "") {
          slendernessInfo = `Column is not slender (lambda_y=${lambda_y.toFixed(1)}, lambda_x=${lambda_x.toFixed(1)} <= lambda_lim=${lambda_lim.toFixed(1)}).`;
      }


      // --- 2. Interaction Check (Simplified - Bresler Load Contour Method Approx) ---
      // Recalculate As_req based on final (potentially magnified) moments
      const M_Ed_dom_final = Math.max(M_Ed_x, M_Ed_y);
      const h_dom_final = (M_Ed_dom_final === M_Ed_x) ? H : W;
      const d_dom_final = h_dom_final - (concreteCover || 25) - 10 - (20/2); // Assume 20mm bar again
      const approx_lever_arm_final = d_dom_final - (compSteelDepth || 40);
      const safe_lever_arm_final = Math.max(approx_lever_arm_final, 0.1 * d_dom_final);

      // Define final axial and moment steel requirements here
      const As_req_moment_final = (M_Ed_dom_final * 1e6) / (parseFloat(fyd) * safe_lever_arm_final);
      const As_req_axial_final = Math.max(0, (N_Ed * 1000 - ALPHA_CC * Ac * parseFloat(fcd)) / parseFloat(fyd));
      // Final As_req calculation using the same heuristic
      let As_req = Math.max(As_req_axial_final + As_req_moment_final, 0.5 * As_req_axial_final + 1.5 * As_req_moment_final);


      // --- 3. Reinforcement Checks ---
      const As_min = industryRules.column.minReinforcementRatio * Ac;
      const As_max = industryRules.column.maxReinforcementRatio * Ac;
      let note = ""; // Initialize note here

      As_req = Math.max(As_req, As_min);
      // Use final axial/moment components for the check
      if (As_req === As_min && (As_req_axial_final + As_req_moment_final) < As_min) {
          note += " Minimum reinforcement governs.";
      }

      if (As_req > As_max) {
          return { error: `Required reinforcement (${As_req.toFixed(0)} mm²) exceeds maximum limit (${As_max.toFixed(0)} mm²). Increase section size.` };
      }

      // --- 4. Rebar Selection (Assume symmetrical, min 4 bars) ---
      let chosenBars = "N/A";
       for (let numBars = 4; numBars <= 16; numBars += (numBars < 8 ? 2 : 4)) {
          if (numBars % 2 !== 0 && numBars !== 4) continue;
          const areaPerBar = As_req / numBars;
          const selectedBar = selectRebar(areaPerBar);
          if (selectedBar.dia < industryRules.column.minBarDiameter) continue;

          const perimeter = 2 * (W + H);
          const spacePerBar = perimeter / numBars;
          const clearSpacingApprox = spacePerBar - selectedBar.dia;
          const minSpacing = Math.max(20, selectedBar.dia, parseFloat(inputValues.aggregateSize) + 5);

          if (clearSpacingApprox >= minSpacing) {
              chosenBars = `${numBars} x T${selectedBar.dia}`;
              break;
          }
      }
       if (chosenBars === "N/A") {
           return { error: `Could not fit required reinforcement (${As_req.toFixed(0)} mm²) within column perimeter. Check spacing/layout.` };
       }


      // --- 5. Tie/Link Design ---
      const mainBarDia = parseFloat(chosenBars.split('T')[1]);
      const tieDiaMin = Math.max(industryRules.column.minTieDiameterAbsolute, industryRules.column.minTieDiameterFactor * mainBarDia);
      const tieBar = selectStirrupBar(tieDiaMin);
      const s_tie_max1 = industryRules.column.maxTieSpacingFactor * mainBarDia;
      const s_tie_max2 = industryRules.column.maxTieSpacingDimFactor * Math.min(W, H);
      const s_tie_max3 = industryRules.column.maxTieSpacingAbsolute;
      const tieSpacing = Math.floor(Math.min(s_tie_max1, s_tie_max2, s_tie_max3) / 10) * 10;


      // --- 6. Simplified Interaction Check ---
      const M_Rdx_approx = (As_req / 2) * parseFloat(fyd) * safe_lever_arm_final * 1e-6;
      const approx_lever_arm_y_final = (W - (concreteCover || 25) - (compSteelDepth || 40)) - ((concreteCover || 25) + 10 + mainBarDia/2);
      const safe_lever_arm_y_final = Math.max(approx_lever_arm_y_final, 0.1 * (W - (concreteCover || 25) - 10 - mainBarDia/2));
      const M_Rdy_approx = (As_req / 2) * parseFloat(fyd) * safe_lever_arm_y_final * 1e-6;

      const interactionRatio = Math.pow(Math.abs(M_Ed_x) / (M_Rdx_approx || 1e-6), 1.2) + Math.pow(Math.abs(M_Ed_y) / (M_Rdy_approx || 1e-6), 1.2);
      const interactionCheck = interactionRatio <= 1.0 ? `Pass (${interactionRatio.toFixed(2)} <= 1.0)` : `Fail (${interactionRatio.toFixed(2)} > 1.0)`;
      // Append to existing note
      note += ` Interaction check uses simplified formula (Eq 5.39 approx. with a=1.2). Capacities M_Rdx/y are approximate.`;

      return {
          elementType: 'Column',
          appliedAxialLoad_N_Ed: N_Ed.toFixed(1) + ' kN',
          appliedMoment_M0Ed_x: M0Ed_x.toFixed(1) + ' kNm', // Show 1st order
          appliedMoment_M0Ed_y: M0Ed_y.toFixed(1) + ' kNm', // Show 1st order
          slendernessCheck: slendernessInfo,
          designMoment_M_Ed_x: M_Ed_x.toFixed(1) + ' kNm', // Show final design moment
          designMoment_M_Ed_y: M_Ed_y.toFixed(1) + ' kNm', // Show final design moment
          requiredSteelArea_As_req: As_req.toFixed(0) + ' mm²',
          minSteelArea_As_min: As_min.toFixed(0) + ' mm²',
          maxSteelArea_As_max: As_max.toFixed(0) + ' mm²',
          chosenMainBars: chosenBars,
          chosenTies: `T${tieBar.dia} @ ${tieSpacing} mm`,
          interactionCheck: interactionCheck,
          notes: note, // Use the note variable
      };
  };

  const calculateSlabDesign = () => {
      const {
          slabThickness, slabSpanX, slabSpanY, slabSupportType, slabDeadLoad, slabLiveLoad,
          concreteStrength, steelStrength, slabType,
          punchingColumnWidth, punchingColumnHeight, punchingColumnLoad // Punching inputs
      } = inputValues;
      const { effectiveDepth, selfWeight, fcd, fyd, fctm, Ecm } = calculatedInputs;

      const h = parseFloat(slabThickness) || 0; // mm
      const d = parseFloat(effectiveDepth) || 0; // mm
      const Lx = parseFloat(slabSpanX) / 1000 || 0; // m
      const Ly = parseFloat(slabSpanY) / 1000 || 0; // m
      const fck = parseFloat(concreteStrength) || 0;
      const fy = parseFloat(steelStrength) || 0;
      const sw = parseFloat(selfWeight) || 0; // kN/m²
      const gk = parseFloat(slabDeadLoad) || 0; // kN/m²
      const qk = parseFloat(slabLiveLoad) || 0; // kN/m²
      const b = 1000; // Design per 1m width

      if (h <= 0 || d <= 0 || Lx <= 0 || fck <= 0 || fy <= 0) {
          return { error: "Invalid slab dimensions, span, or material strengths." };
      }
      if (slabType === 'twoWay' && Ly <= 0) {
          return { error: "Long span (Ly) required for two-way slab design." };
      }

      // --- 1. Applied Loads & Moments (per meter width) ---
      const w_gk = gk + sw;
      const w_qk = qk;
      const w_d = 1.35 * w_gk + 1.5 * w_qk; // kN/m²
      const w_ser = w_gk + w_qk; // kN/m²

      let M_Ed_x = 0, M_Ed_y = 0; // kNm/m (Design moments in X and Y directions)
      let M_ser_x = 0, M_ser_y = 0; // kNm/m (Service moments)

      if (slabType === 'oneWay') {
          const L_eff = Lx; // Span in the primary direction
          if (slabSupportType === 'simplySupported') {
              M_Ed_x = w_d * L_eff * L_eff / 8;
              M_ser_x = w_ser * L_eff * L_eff / 8;
          } else { // Continuous (approximate)
              M_Ed_x = w_d * L_eff * L_eff / 10;
              M_ser_x = w_ser * L_eff * L_eff / 10;
          }
          M_Ed_y = 0; // No moment in secondary direction for pure one-way
          M_ser_y = 0;
      } else { // twoWay
          if (Ly < Lx) { return { error: "Ly must be greater than or equal to Lx for coefficient calculation."}; }
          const coeffs = getTwoWaySlabCoefficients(Lx, Ly, slabSupportType);
          // Note: These coefficients are placeholders and need proper table lookup
          M_Ed_x = coeffs.alpha_sx * w_d * Lx * Lx;
          M_Ed_y = coeffs.alpha_sy * w_d * Lx * Lx; // Based on Lx^2
          M_ser_x = coeffs.alpha_sx * w_ser * Lx * Lx;
          M_ser_y = coeffs.alpha_sy * w_ser * Lx * Lx;
      }

      // --- 2. Flexural Design (X and Y directions) ---
      const designDirection = (M_Ed, M_ser, L_span, dir) => { // Removed As_req_m
          const K = (M_Ed * 1e6) / (b * d * d * fck);
          const K_bal = 0.167;
          let As_req = 0, z = 0, x = 0;

          if (K > K_bal) {
              return { error: `Slab thickness likely insufficient for moment in ${dir}-dir (K=${K.toFixed(3)}).` };
          } else if (K > 0) {
              z = d * (0.5 + Math.sqrt(0.25 - K / (2 * ALPHA_CC / 0.8)));
              z = Math.min(z, 0.95 * d);
              x = (d - z) / 0.4;
              As_req = (M_Ed * 1e6) / (parseFloat(fyd) * z); // mm²/m
          } else {
              As_req = 0; // No moment, no steel required theoretically
          }

          // Reinforcement Checks
          const As_min_m = industryRules.slab.minMainReinforcementRatio(fck, fy) * b * d;
          const As_max_m = industryRules.slab.maxMainReinforcementRatio * b * h;
          const As_final = Math.max(As_req, As_min_m);
          if (As_final > As_max_m) {
              return { error: `Required reinforcement/m in ${dir}-dir (${As_final.toFixed(0)}) exceeds maximum (${As_max_m.toFixed(0)}).` };
          }

          // Rebar Selection & Spacing
          let barInfo = "N/A";
          // ... (Rebar selection logic as before, using As_final) ...
           for (let bar of standardRebars) {
               if (bar.dia < 8) continue;
               const s_calc = (bar.area / As_final) * 1000;
               const s_max_1 = industryRules.slab.maxBarSpacingMainFactor * h;
               const s_max_2 = industryRules.slab.maxBarSpacingMainAbsolute;
               const s_max = Math.min(s_max_1, s_max_2);
               const s_min = industryRules.slab.minBarSpacing;
               if (s_calc <= s_max && s_calc >= s_min) {
                   const final_spacing = Math.floor(s_calc / 5) * 5;
                   if (final_spacing >= s_min) {
                      barInfo = `T${bar.dia} @ ${final_spacing} mm`;
                      break;
                   }
               }
           }
           if (barInfo === "N/A") barInfo = "Spacing Error"; // Indicate error if no bar fits

          // Deflection & Crack Width (Simplified)
          let deflection = 0, deflectionCheck = "N/A";
          let crackWidth = 0, crackWidthCheck = "N/A";
          if (M_ser > 0 && As_final > 0) {
              try {
                  const Ig = b * Math.pow(h, 3) / 12;
                  const n = ES_MODULUS / Ecm;
                  const kd = (-n * As_final + Math.sqrt(Math.pow(n * As_final, 2) + 2 * b * n * As_final * d)) / b;
                  const Icr = (b * Math.pow(kd, 3) / 3) + n * As_final * Math.pow(d - kd, 2);
                  const y_t = h / 2;
                  const Mcr = calculateMcr(parseFloat(fctm), Ig, y_t);
                  const Ieff = calculateEffectiveI(Ig, Icr, Mcr, M_ser);
                  deflection = calculateDeflection(w_ser, L_span, Ecm, Ieff); // Use span for this direction
                  const deflectionLimit = (L_span * 1000) / industryRules.slab.deflectionLimitSpanRatio;
                  deflectionCheck = deflection <= deflectionLimit ? `Pass (${deflection.toFixed(1)} <= ${deflectionLimit.toFixed(1)})` : `Fail (${deflection.toFixed(1)} > ${deflectionLimit.toFixed(1)})`;

                  // Crack width
                  const M_ser_Nmm = M_ser * 1e6;
                  const steelStress_ser = (M_ser_Nmm * (d - kd) * n) / Icr; // Approx stress
                  const barDia = parseFloat(barInfo.split('T')[1].split('@')[0]);
                  const barSpacing = parseFloat(barInfo.split('@')[1]);
                  const h_c_eff = Math.min(2.5 * (h - d), (h - x) / 3, h / 2); // x from ULS
                  const Ac_eff = b * h_c_eff; // Per meter width
                  crackWidth = calculateCrackWidth(steelStress_ser, barDia, barSpacing, calculatedInputs.concreteCover, parseFloat(fctm), Ecm, As_final, Ac_eff);
                  const crackWidthLimit = 0.3;
                  crackWidthCheck = crackWidth <= crackWidthLimit ? `Pass (${crackWidth.toFixed(2)} <= ${crackWidthLimit})` : `Fail (${crackWidth.toFixed(2)} > ${crackWidthLimit})`;

              } catch (err) {
                  console.error(`Error in SLS checks (${dir}):`, err);
                  deflectionCheck = "Error";
                  crackWidthCheck = "Error";
              }
          }


          return { As_req, As_final, barInfo, deflectionCheck, crackWidthCheck };
      };

      const resultX = designDirection(M_Ed_x, M_ser_x, Lx, 'X'); // Removed As_req_m
      const resultY = designDirection(M_Ed_y, M_ser_y, Ly, 'Y'); // Removed As_req_m

      if (resultX.error) return resultX;
      if (resultY.error) return resultY;

      // --- 3. Shear Check (Simplified V_Rd,c) ---
      // Check shear based on the higher load distribution (approx)
      const V_Ed_m = w_d * Math.max(Lx, Ly) / 2; // Max shear per meter width (approx)
      const Asl_avg = (resultX.As_final + resultY.As_final) / 2 / b; // Avg reinforcement /m
      const rho_l = Math.min(Asl_avg / d, 0.02);
      const k_shear = Math.min(1 + Math.sqrt(200 / d), 2.0);
      const V_Rd_c_m = (0.18 / GAMMA_C) * k_shear * Math.pow(100 * rho_l * fck, 1/3) * b * d * 1e-3; // kN/m
      const shearCheck = V_Ed_m <= V_Rd_c_m ? "Pass (V_Ed <= V_Rd,c)" : "Fail (V_Ed > V_Rd,c)";

      // --- 4. Punching Shear Check ---
      let punchingCheck = "N/A";
      const colW = parseFloat(punchingColumnWidth) || 0;
      const colH = parseFloat(punchingColumnHeight) || 0;
      const colNEd = parseFloat(punchingColumnLoad) || 0; // kN causing punching
      if (colW > 0 && colH > 0 && colNEd > 0) {
          try {
              const u1 = 2 * (colW + colH) + 2 * Math.PI * (2 * d); // Control perimeter at 2d
              const V_Ed_punch = colNEd; // Applied shear force

              // Calculate Asl for punching check (average reinforcement ratio around column)
              // Use the average of X and Y reinforcement calculated earlier
              const Asl_punch = (resultX.As_final + resultY.As_final) / (2 * b * d); // Avg ratio /m width

              const punchResult = calculatePunchingShearCapacity(d, u1, Asl_punch, fck, colNEd, colW*colH);

              const v_Ed = V_Ed_punch * 1000 / (u1 * d); // Applied shear stress (MPa) - simplified beta=1.0

              if (v_Ed > punchResult.v_Rd_max) {
                  punchingCheck = `Fail (v_Ed=${v_Ed.toFixed(2)} > v_Rd,max=${punchResult.v_Rd_max.toFixed(2)} MPa)`;
              } else if (v_Ed > punchResult.v_Rd_c) {
                  // Punching shear reinforcement required - complex design
                  punchingCheck = `Fail (v_Ed=${v_Ed.toFixed(2)} > v_Rd,c=${punchResult.v_Rd_c.toFixed(2)} MPa) - Reinforcement Needed`;
              } else {
                  punchingCheck = `Pass (v_Ed=${v_Ed.toFixed(2)} <= v_Rd,c=${punchResult.v_Rd_c.toFixed(2)} MPa)`;
              }
          } catch (punchErr) {
              console.error("Punching shear check failed:", punchErr);
              punchingCheck = "Calculation Error";
          }
      }


      let twoWayNote = '';
      if (slabType === 'twoWay') {
           // ... getTwoWaySlabCoefficients call ...
           twoWayNote = 'Uses highly simplified coefficients assuming 4 edges simply supported or basic continuity. Proper EC2 tables required for accurate design. ';
      }

      return {
          elementType: `Slab (${slabType})`,
          appliedMoment_M_Ed_x: M_Ed_x.toFixed(2) + ' kNm/m',
          appliedMoment_M_Ed_y: M_Ed_y.toFixed(2) + ' kNm/m',
          requiredSteel_X_As_req: resultX.As_req.toFixed(0) + ' mm²/m',
          providedSteel_X: resultX.barInfo + ` (${resultX.As_final.toFixed(0)} mm²/m)`,
          requiredSteel_Y_As_req: resultY.As_req.toFixed(0) + ' mm²/m',
          providedSteel_Y: resultY.barInfo + ` (${resultY.As_final.toFixed(0)} mm²/m)`,
          shearCheck: shearCheck + ` (V_Ed=${V_Ed_m.toFixed(1)}, V_Rd,c=${V_Rd_c_m.toFixed(1)} kN/m)`,
          punchingShearCheck: punchingCheck,
          deflectionCheck_X: resultX.deflectionCheck,
          deflectionCheck_Y: resultY.deflectionCheck,
          crackWidthCheck_X: resultX.crackWidthCheck,
          crackWidthCheck_Y: resultY.crackWidthCheck,
          notes: `Simplified ${slabType} slab design. ${twoWayNote}Shear/Deflection/Crack checks basic. Punching shear simplified.`, // Updated note
      };
  };


  // --- Handle Submit ---
  const handleSubmit = (e) => {
    e.preventDefault();
    setResult(null);
    setChartData(null); // Clear previous chart data

    let calculationOutput = {}; // Use a different name to avoid conflict
    try {
      if (inputValues.elementType === 'beam') {
        calculationOutput = calculateBeamDesign();
      } else if (inputValues.elementType === 'column') {
        // Columns don't have the same chart data structure
        calculationOutput = { designResult: calculateColumnDesign(), chartData: null };
      } else if (inputValues.elementType === 'slab') {
         // Slabs might have different visualization needs (e.g., contour plot - too complex here)
        calculationOutput = { designResult: calculateSlabDesign(), chartData: null };
      } else {
         calculationOutput = { designResult: { error: "Invalid element type selected." } };
      }

      if (calculationOutput.designResult.error) {
        alert(`Error: ${calculationOutput.designResult.error}`);
        setResult(calculationOutput.designResult);
      } else {
        setResult(calculationOutput.designResult);
        setChartData(calculationOutput.chartData); // Set chart data (will be null for column/slab)
      }
    } catch (err) {
        console.error("Calculation Error:", err);
        alert("An unexpected error occurred during calculation. Check console for details.");
        setResult({ error: "Calculation failed. Check inputs and console." });
    }
  };

  // --- PDF Export Handler (Improved to avoid chart splitting) ---
  const handleExportPDF = useCallback(async () => { // Make async to use await
    const resultsElement = document.getElementById('results-section');
    // Find the main results div *within* results-section (excluding the chart)
    const mainResultsDiv = resultsElement?.querySelector('.result');
    const chartContainer = resultsElement?.querySelector('.chart-container');

    if (!resultsElement || !mainResultsDiv) {
      console.error("Results section or main results div not found for PDF export.");
      return;
    }

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;
    const contentWidth = pdfWidth - 2 * margin;
    let currentY = margin; // Track Y position

    pdf.setFontSize(16);
    pdf.text("Reinforced Concrete Design Results-EngHub", pdfWidth / 2, currentY, { align: 'center' });
    currentY += 15; // Increase space after title

    // --- 1. Capture and Add Main Results (excluding chart) ---
    try {
        const mainCanvas = await html2canvas(mainResultsDiv, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: null, // Ensure background for main results
            windowWidth: mainResultsDiv.scrollWidth,
            windowHeight: mainResultsDiv.scrollHeight
        });

        const mainImgData = mainCanvas.toDataURL('image/jpeg', 0.8);
        const mainImgWidth = mainCanvas.width;
        const mainImgHeight = mainCanvas.height;
        const mainRatio = mainImgWidth / mainImgHeight;
        let mainImgHeightInPDF = contentWidth / mainRatio;
        let mainImgRenderedHeight = 0;
        let mainImgStartY = 0;

        // Add main results image, handling page breaks if needed
        while (mainImgRenderedHeight < mainImgHeightInPDF) {
            let pageRemainingHeight = pdfHeight - currentY - margin;
            if (pageRemainingHeight <= 10) { // Add buffer, check if space is too small
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

            // Check if we need a new page for the *next* slice of main results
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


    // --- 2. Capture and Add Chart (if it exists) ---
    if (chartContainer && chartData && result && !result.error && inputValues.elementType === 'beam') {
        try {
            // Optional: Briefly disable chart animation before capture
            // ChartJS.defaults.animation = false; // Might need more specific targeting

            const chartCanvas = await html2canvas(chartContainer, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff', // Ensure chart background is white
                // windowWidth/Height might not be needed if chart fits its container
            });

            // Optional: Re-enable chart animation
            // ChartJS.defaults.animation = {}; // Or restore previous settings

            const chartImgData = chartCanvas.toDataURL('image/png'); // Use PNG for potentially better chart quality
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

        } catch(err) {
            console.error("Error capturing chart for PDF:", err);
            // Continue PDF generation without chart if it fails
        }
    }

    // --- 3. Save PDF ---
    pdf.save(`rc-design-results-${inputValues.elementType}.pdf`);

  }, [inputValues.elementType, chartData, result]); // Add dependencies


  // --- Chart Options ---
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
        mode: 'index',
        intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Beam Analysis Diagrams (Approximate)',
      },
      tooltip: {
        callbacks: {
            label: function(context) {
                let label = context.dataset.label || '';
                if (label) {
                    label += ': ';
                }
                if (context.parsed.y !== null) {
                    label += context.parsed.y + (context.dataset.yAxisID === 'yMoment' ? ' kNm' : ' kN');
                }
                return label;
            }
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Position along beam (m)',
        },
      },
      yMoment: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Moment (kNm)',
        },
      },
      yShear: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'Shear (kN)',
        },
        grid: {
          drawOnChartArea: false, // only want the grid lines for one axis to show up
        },
      },
    },
  };


  // --- JSX Structure ---
  return (
    <div className="reinforced-concrete-design-tool">
      <h1>Reinforced Concrete Design Tool (EC2 Focus)</h1>
      <form onSubmit={handleSubmit}>
        {/* --- General Settings --- */}
         <fieldset>
            <legend>General Settings</legend>
             <div className="form-row">
                <div className="form-group">
                  <label>Design Code:</label>
                  <select name="designCode" value={inputValues.designCode} onChange={handleChange} required>
                    <option value="EC2">Eurocode 2 (EC2)</option>
                    {/* <option value="ACI">ACI 318 (Placeholder)</option> */}
                  </select>
                </div>
                <div className="form-group">
                  <label>Select Element:</label>
                  <select name="elementType" value={inputValues.elementType} onChange={handleChange} required>
                    <option value="beam">Beam</option>
                    <option value="column">Column</option>
                    <option value="slab">Slab</option>
                  </select>
                </div>
            </div>
        </fieldset>

        {/* --- Materials & Durability --- */}
        <fieldset>
            <legend>Materials & Durability</legend>
            {/* ... fck, fy, exposure, aggregate inputs as before ... */}
             <div className="form-row">
                <div className="form-group">
                    <label>Concrete Strength f<sub>ck</sub> (MPa):</label>
                    <input type="number" name="concreteStrength" value={inputValues.concreteStrength} onChange={handleChange} required min="20" step="5"/>
                </div>
                <div className="form-group">
                    <label>Steel Yield f<sub>y</sub> (MPa):</label>
                    <input type="number" name="steelStrength" value={inputValues.steelStrength} onChange={handleChange} required min="400" step="10"/>
                </div>
            </div>
             <div className="form-row">
                <div className="form-group">
                    <label>Exposure Class:</label>
                     <select name="exposureClass" value={inputValues.exposureClass} onChange={handleChange}>
                        <option value="XC1">XC1 (Dry)</option>
                        <option value="XC3">XC3/XC4 (Moderate/Cyclic)</option>
                        <option value="XD1">XD1 (Corrosion - Chloride)</option>
                    </select>
                </div>
                 <div className="form-group">
                    <label>Max Aggregate Size (mm):</label>
                    <input type="number" name="aggregateSize" value={inputValues.aggregateSize} onChange={handleChange} required min="10" step="5"/>
                </div>
            </div>
            <div className="form-group derived-inputs">
                <span>Cover: {calculatedInputs.concreteCover} mm</span> |
                <span> f<sub>cd</sub>: {calculatedInputs.fcd} MPa</span> |
                <span> f<sub>yd</sub>: {calculatedInputs.fyd} MPa</span> |
                <span> f<sub>ctm</sub>: {calculatedInputs.fctm} MPa</span> |
                <span> E<sub>cm</sub>: {calculatedInputs.Ecm} MPa</span>
            </div>
        </fieldset>

        {/* --- Beam Inputs --- */}
        {inputValues.elementType === 'beam' && (
          <fieldset>
            <legend>Beam Geometry & Loading</legend>
             <div className="form-row">
                 <div className="form-group">
                    <label>Beam Type:</label>
                     <select name="beamType" value={inputValues.beamType} onChange={handleChange}>
                        <option value="rectangular">Rectangular</option>
                        <option value="T">T-Beam</option>
                        <option value="L">L-Beam</option>
                    </select>
                </div>
                <div className="form-group">
                    <label>Web Width b<sub>w</sub> (mm):</label>
                    <input type="number" name="beamWidth" value={inputValues.beamWidth} onChange={handleChange} required min="100"/>
                </div>
                <div className="form-group">
                    <label>Overall Depth D (mm):</label>
                    <input type="number" name="beamDepth" value={inputValues.beamDepth} onChange={handleChange} required min="150"/>
                </div>
            </div>
            {(inputValues.beamType === 'T' || inputValues.beamType === 'L') && (
                 <div className="form-row">
                    <div className="form-group">
                        <label>Flange Thickness h<sub>f</sub> (mm):</label>
                        <input type="number" name="beamFlangeThickness" value={inputValues.beamFlangeThickness} onChange={handleChange} required min="50"/>
                    </div>
                    <div className="form-group">
                        <label>Nominal Flange Width b<sub>f,nom</sub> (mm):</label>
                        <input type="number" name="beamFlangeWidth" value={inputValues.beamFlangeWidth} onChange={handleChange} required min={inputValues.beamWidth}/>
                    </div>
                     <div className="form-group">
                        <label>Beam Spacing (c/c) (mm):</label>
                        <input type="number" name="beamSpacing" value={inputValues.beamSpacing} onChange={handleChange} required min="0"/>
                         <small>(For b<sub>eff</sub> calc)</small>
                    </div>
                </div>
            )}
             <div className="form-row">
                 <div className="form-group derived-inputs">
                    <label>Effective Depth d (mm):</label>
                    <input type="text" value={calculatedInputs.effectiveDepth || 'N/A'} readOnly disabled />
                </div>
                 <div className="form-group">
                    <label>Span L (mm):</label>
                    <input type="number" name="beamSpan" value={inputValues.beamSpan} onChange={handleChange} required min="1000"/>
                </div>
                <div className="form-group">
                    <label>Support Type:</label>
                     <select name="beamSupportType" value={inputValues.beamSupportType} onChange={handleChange}>
                        <option value="simplySupported">Simply Supported</option>
                        <option value="continuous">Continuous (Approx.)</option>
                    </select>
                </div>
            </div>
            {/* ... Load Type, Dead Load, Live Load inputs as before ... */}
             <div className="form-row">
                 <div className="form-group">
                    <label>Load Type:</label>
                     <select name="beamLoadType" value={inputValues.beamLoadType} onChange={handleChange}>
                        <option value="uniform">Uniformly Distributed</option>
                    </select>
                </div>
                 <div className="form-group">
                    <label>Char. Dead Load g<sub>k</sub> (kN/m):</label>
                    <input type="number" name="beamDeadLoad" value={inputValues.beamDeadLoad} onChange={handleChange} required min="0"/>
                     <small>(Excl. SW: {calculatedInputs.selfWeight} kN/m)</small>
                </div>
                <div className="form-group">
                    <label>Char. Live Load q<sub>k</sub> (kN/m):</label>
                    <input type="number" name="beamLiveLoad" value={inputValues.beamLiveLoad} onChange={handleChange} required min="0"/>
                </div>
            </div>
          </fieldset>
        )}

        {/* --- Column Inputs --- */}
        {inputValues.elementType === 'column' && (
          <fieldset>
            <legend>Column Geometry & Loading</legend>
            {/* ... Width, Height, Length inputs as before ... */}
             <div className="form-row">
                <div className="form-group">
                    <label>Width W (mm):</label>
                    <input type="number" name="columnWidth" value={inputValues.columnWidth} onChange={handleChange} required min="150"/>
                </div>
                <div className="form-group">
                    <label>Height H (mm):</label>
                    <input type="number" name="columnHeight" value={inputValues.columnHeight} onChange={handleChange} required min="150"/>
                </div>
                 <div className="form-group">
                    <label>Effective Length L<sub>0</sub> (mm):</label>
                    <input type="number" name="columnLength" value={inputValues.columnLength} onChange={handleChange} required min="500"/>
                </div>
            </div>
            <div className="form-row">
                <div className="form-group">
                    <label>Design Axial Load N<sub>Ed</sub> (kN):</label>
                    <input type="number" name="columnAxialLoad" value={inputValues.columnAxialLoad} onChange={handleChange} required />
                     <small>(Compression positive)</small>
                </div>
                <div className="form-group">
                    <label>1st Order Moment M<sub>0Ed,x</sub> (kNm):</label>
                    <input type="number" name="columnMomentMx" value={inputValues.columnMomentMx} onChange={handleChange} min="0"/>
                </div>
                 <div className="form-group">
                    <label>1st Order Moment M<sub>0Ed,y</sub> (kNm):</label>
                    <input type="number" name="columnMomentMy" value={inputValues.columnMomentMy} onChange={handleChange} min="0"/>
                </div>
            </div>
             <small>Note: Buckling and biaxial bending checks are simplified.</small>
          </fieldset>
        )}

        {/* --- Slab Inputs --- */}
        {inputValues.elementType === 'slab' && (
          <fieldset>
            <legend>Slab Geometry & Loading</legend>
             <div className="form-row">
                 <div className="form-group">
                    <label>Slab Type:</label>
                     <select name="slabType" value={inputValues.slabType} onChange={handleChange}>
                        <option value="oneWay">One-Way</option>
                        <option value="twoWay">Two-Way (Approx.)</option>
                    </select>
                </div>
                <div className="form-group">
                    <label>Thickness h (mm):</label>
                    <input type="number" name="slabThickness" value={inputValues.slabThickness} onChange={handleChange} required min="100"/>
                </div>
                 <div className="form-group derived-inputs">
                    <label>Effective Depth d (mm):</label>
                    <input type="text" value={calculatedInputs.effectiveDepth || 'N/A'} readOnly disabled />
                </div>
            </div>
             <div className="form-row">
                 <div className="form-group">
                    <label>Span L<sub>x</sub> (mm):</label>
                    <input type="number" name="slabSpanX" value={inputValues.slabSpanX} onChange={handleChange} required min="1000"/>
                     <small>(Shorter/Primary Span)</small>
                </div>
                {inputValues.slabType === 'twoWay' && (
                    <div className="form-group">
                        <label>Span L<sub>y</sub> (mm):</label>
                        <input type="number" name="slabSpanY" value={inputValues.slabSpanY} onChange={handleChange} required min={inputValues.slabSpanX}/>
                         <small>(Longer Span)</small>
                    </div>
                )}
                <div className="form-group">
                    <label>Support Type:</label>
                     <select name="slabSupportType" value={inputValues.slabSupportType} onChange={handleChange}>
                        <option value="simplySupported">Simply Supported (All Edges)</option>
                        <option value="continuous">Continuous (Approx.)</option>
                        {/* Add more specific edge conditions */}
                    </select>
                </div>
            </div>
            {/* ... Dead Load, Live Load inputs as before ... */}
             <div className="form-row">
                <div className="form-group">
                    <label>Char. Dead Load g<sub>k</sub> (kN/m²):</label>
                    <input type="number" name="slabDeadLoad" value={inputValues.slabDeadLoad} onChange={handleChange} required min="0"/>
                     <small>(Excl. SW: {calculatedInputs.selfWeight} kN/m²)</small>
                </div>
                <div className="form-group">
                    <label>Char. Live Load q<sub>k</sub> (kN/m²):</label>
                    <input type="number" name="slabLiveLoad" value={inputValues.slabLiveLoad} onChange={handleChange} required min="0"/>
                </div>
            </div>
            {/* Punching Shear Inputs */}
            <legend>Punching Shear Check (Optional)</legend>
             <div className="form-row">
                 <div className="form-group">
                    <label>Column Width (Punching) (mm):</label>
                    <input type="number" name="punchingColumnWidth" value={inputValues.punchingColumnWidth} onChange={handleChange} min="0"/>
                </div>
                 <div className="form-group">
                    <label>Column Height (Punching) (mm):</label>
                    <input type="number" name="punchingColumnHeight" value={inputValues.punchingColumnHeight} onChange={handleChange} min="0"/>
                </div>
                 <div className="form-group">
                    <label>Column Load V<sub>Ed</sub> (kN):</label>
                    <input type="number" name="punchingColumnLoad" value={inputValues.punchingColumnLoad} onChange={handleChange} min="0"/>
                     <small>(Shear force causing punching)</small>
                </div>
            </div>
          </fieldset>
        )}

        <button type="submit">Calculate Design</button>
      </form>

      {/* --- Results Display (Wrap in a div for PDF export) --- */}
      <div id="results-section">
          {result && (
            <div className="result">
              <h2>Design Results ({result.elementType})</h2>
              {/* Graphical Output Placeholder */}
              {/* <canvas ref={canvasRef} width="300" height="200" style={{border:'1px solid grey', marginTop:'10px'}}></canvas> */}

              {Object.entries(result).map(([key, value]) => {
                // Improved key formatting
                const formattedKey = key
                  .replace(/_/g, ' ')
                  .replace(/([A-Z])/g, ' $1')
                  .replace(/^./, str => str.toUpperCase())
                  .replace(/ M Ed /g, ' M<sub>Ed</sub> ')
                  .replace(/ V Ed /g, ' V<sub>Ed</sub> ')
                  .replace(/ N Ed /g, ' N<sub>Ed</sub> ')
                  .replace(/ M Rd /g, ' M<sub>Rd</sub> ')
                  .replace(/ V Rd /g, ' V<sub>Rd</sub> ')
                  .replace(/ N Rd /g, ' N<sub>Rd</sub> ')
                  .replace(/ req /g, '<sub>req</sub> ')
                  .replace(/ min /g, '<sub>min</sub> ')
                  .replace(/ max /g, '<sub>max</sub> ')
                  .replace(/ prov /g, '<sub>prov</sub> ')
                  .replace(/ m /g, '/m ')
                  .replace(/ X /g, ' (X-dir) ')
                  .replace(/ Y /g, ' (Y-dir) ')
                  .replace(/ bf /g, ' b<sub>eff</sub> ')
                  .replace(/ fck /g, ' f<sub>ck</sub> ')
                  .replace(/ fcd /g, ' f<sub>cd</sub> ')
                  .replace(/ fy /g, ' f<sub>y</sub> ')
                  .replace(/ fyd /g, ' f<sub>yd</sub> ')
                  .replace(/ fctm /g, ' f<sub>ctm</sub> ')
                  .replace(/ Ecm /g, ' E<sub>cm</sub> ')
                  .replace(/ As /g, ' A<sub>s</sub> ')
                  .replace(/ Ac /g, ' A<sub>c</sub> ')
                  .replace(/ Ig /g, ' I<sub>g</sub> ')
                  .replace(/ Icr /g, ' I<sub>cr</sub> ')
                  .replace(/ Ieff /g, ' I<sub>eff</sub> ')
                  .replace(/ Mcr /g, ' M<sub>cr</sub> ')
                  .replace(/ lambda /g, ' &lambda; ')
                  .replace(/ lim /g, '<sub>lim</sub> ')
                  .replace(/ Ed x /g, '<sub>Ed,x</sub> ')
                  .replace(/ Ed y /g, '<sub>Ed,y</sub> ')
                  .replace(/ Rd x /g, '<sub>Rd,x</sub> ')
                  .replace(/ Rd y /g, '<sub>Rd,y</sub> ')
                  .replace(/ R0 /g, '<sub>R0</sub> ');


                if (key === 'elementType' || key === 'error' || key === 'notes') return null;

                return (
                  <p key={key}>
                    <strong dangerouslySetInnerHTML={{ __html: formattedKey + ':' }}></strong>
                    <span> {value}</span>
                  </p>
                );
              })}
              {result.notes && <p className="notes"><strong>Notes:</strong> {result.notes}</p>}
              {result.error && <p className="error"><strong>Error:</strong> {result.error}</p>}
            </div>
          )}

          {/* --- Chart Display (Inside the exportable div) --- */}
          {chartData && result && !result.error && inputValues.elementType === 'beam' && (
            <div className="chart-container" style={{ position: 'relative', height: '40vh', width: '90%', margin: '20px auto', background: 'white', padding: '10px', borderRadius: '8px' }}>
              {/* Pass options to the chart */}
              <Line options={chartOptions} data={chartData} />
            </div>
          )}
      </div> {/* End of results-section */}


      {/* --- Export Button (Outside the exportable div) --- */}
      {result && !result.error && (
        <button type="button" onClick={handleExportPDF} style={{marginTop: '20px'}}>Export Results to PDF</button>
      )}
    </div>
  );
};

export default ReinforcedConcreteDesignTool;