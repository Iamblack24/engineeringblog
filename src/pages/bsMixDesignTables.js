/**
 * More comprehensive (but still interpretive) functions for Concrete Mix Design
 * based on British Standards (BS 8500, BS EN 206).
 * NOTE: Requires verification against the full standards and trial batches.
 * Assumes common practices where standards offer options or require local calibration.
 */

// Helper for linear interpolation
const interpolate = (x, x0, x1, y0, y1) => {
  if (x <= x0) return y0;
  if (x >= x1) return y1;
  return y0 + (y1 - y0) * (x - x0) / (x1 - x0);
};

/**
 * Calculates Required Mean Strength (f_m) per BS EN 206 / BS 8500.
 * f_m = f_ck + k * s (k = 1.64 for 5% defective rate is common)
 * Uses margin based on strength if std dev is unknown or insufficient.
 * @param {number} fck Characteristic Strength (MPa)
 * @param {number|string} stdDev Standard Deviation (MPa) or 'unknown'
 * @returns {number} Required Mean Strength (f_m) in MPa
 */
export const getRequiredMeanStrength_BS = (fck, stdDev) => {
  const k = 1.64; // Factor for 5% defective rate
  let margin;

  if (stdDev !== 'unknown' && !isNaN(stdDev) && stdDev >= 2.0) { // Minimum std dev often considered
    margin = k * stdDev;
  } else {
    // Margin based on fck if std dev is unknown/low (Values approx from BS 8500 Table A.11 / similar concepts)
    if (fck <= 12) margin = 5; // C8/10, C12/15
    else if (fck <= 20) margin = 6; // C16/20, C20/25
    else if (fck <= 30) margin = 7; // C25/30, C28/35
    else if (fck <= 40) margin = 8; // C32/40, C35/45
    else margin = 9; // >= C40/50
    console.warn("Using estimated margin for f_m as standard deviation is unknown or low.");
  }
  // Ensure minimum margin (can vary, using common values)
  const minMargin = fck < 20 ? 4 : (fck < 40 ? 6 : 8);
  return fck + Math.max(margin, minMargin);
};

/**
 * Estimates Water Content based on BS principles (more detailed table).
 * Based loosely on older BS tables / common data, as EN 206 is less prescriptive.
 * Includes interpolation.
 * @param {number} slump Slump (mm)
 * @param {number} maxAggSize Max Aggregate Size (mm)
 * @param {string} aggType 'crushed' or 'uncrushed'
 * @param {boolean} useSuperplasticizer If SP is used (reduces water)
 * @returns {number} Estimated Water Content (kg/m³)
 */
export const getWaterContent_BS = (slump, maxAggSize, aggType = 'crushed', useSuperplasticizer = false) => {
  // Base water content (kg/m³) for 30-60mm slump, crushed aggregate
  const baseWaterTable = {
    10: 205,
    14: 195, // Interpolate between 10 and 20
    20: 185,
    40: 165,
  };

  // Find relevant sizes for interpolation
  const sizes = Object.keys(baseWaterTable).map(Number).sort((a, b) => a - b);
  let sizeLower = sizes[0];
  let sizeUpper = sizes[sizes.length - 1];
  for (let i = 0; i < sizes.length - 1; i++) {
    if (maxAggSize >= sizes[i] && maxAggSize <= sizes[i + 1]) {
      sizeLower = sizes[i];
      sizeUpper = sizes[i + 1];
      break;
    }
  }
   if (maxAggSize > sizeUpper) { // Extrapolate cautiously for larger sizes
       sizeLower = sizes[sizes.length - 2];
       sizeUpper = sizes[sizes.length - 1];
   }
   if (maxAggSize < sizeLower) { // Extrapolate cautiously for smaller sizes
       sizeLower = sizes[0];
       sizeUpper = sizes[1];
   }


  let baseWater = interpolate(maxAggSize, sizeLower, sizeUpper, baseWaterTable[sizeLower], baseWaterTable[sizeUpper]);

  // Adjust for aggregate type
  if (aggType === 'uncrushed') {
    baseWater -= (maxAggSize === 10 ? 15 : (maxAggSize === 20 ? 25 : 30)); // Approx reduction for gravel
  }

  // Adjust for slump (Approximate adjustments per 30mm change from 30-60 range)
  const slumpMidpoint = 45; // Midpoint of base slump range (30-60)
  const slumpAdjustmentFactor = 0.08; // Approx 8% change per 30mm (highly variable) -> ~0.27% per mm
  // baseWater *= (1 + (slump - slumpMidpoint) * (slumpAdjustmentFactor / 30));
  // Simpler linear adjustment (e.g. +3-5 kg per 25mm increase - let's use ~+10kg per 50mm)
  baseWater += (slump - slumpMidpoint) * (10 / 50);


  // Adjust for superplasticizer (common reduction range 10-30%)
  if (useSuperplasticizer) {
    baseWater *= 0.85; // Apply a typical 15% reduction - THIS IS HIGHLY VARIABLE
    console.warn("Applied estimated 15% water reduction for superplasticizer.");
  }

  return Math.round(baseWater); // Return whole number
};

/**
 * Estimates Max Water/Cement Ratio based on BS 8500 / EN 206.
 * Considers strength and exposure class.
 * @param {string} type 'strength' or 'exposure'
 * @param {number|string} value Strength (f_m in MPa) or Exposure Class (e.g., 'XC1')
 * @param {string} cementType E.g., 'CEM1', 'CEM2A', 'CEM2B', 'CEM3A' (Simplified categories)
 * @param {string} aggType 'crushed' or 'uncrushed' (Minor effect, often ignored for WCR limits)
 * @returns {number} Estimated Max W/C Ratio
 */
export const getWCRatio_BS = (type, value, cementType = 'CEM1', aggType = 'crushed') => {
  if (type === 'strength') {
    const fm = value;
    // Approximation based on Abrams' Law concept / typical curves for CEM1
    // WCR = A / (B + fm) or similar. Using simplified points.
    // These values are indicative for CEM1, other cements will differ.
    let wcr;
    if (fm <= 20) wcr = 0.75; // Below C16/20 target
    else if (fm <= 28) wcr = interpolate(fm, 20, 28, 0.75, 0.65); // C16/20 to C20/25 target
    else if (fm <= 38) wcr = interpolate(fm, 28, 38, 0.65, 0.55); // C20/25 to C28/35 target
    else if (fm <= 48) wcr = interpolate(fm, 38, 48, 0.55, 0.48); // C28/35 to C35/45 target
    else if (fm <= 58) wcr = interpolate(fm, 48, 58, 0.48, 0.40); // C35/45 to C45/55 target
    else wcr = 0.38; // High strength

    // Adjust slightly for other cement types (very rough)
    if (cementType.startsWith('CEM2')) wcr *= 0.98; // Slightly lower WCR needed
    if (cementType.startsWith('CEM3')) wcr *= 0.95; // Lower WCR needed

    return parseFloat(wcr.toFixed(2));

  } else if (type === 'exposure') {
    const ec = String(value).toUpperCase();
    // Based on BS 8500:2015+A2:2019 Table A.4/A.5 (Indicative for CEM1/Portland Cements)
    // Assumes concrete exposed to rain / not permanently submerged unless specified by XS/XF
    let wcrLimit = 0.70; // Default fallback

    // Carbonation Induced Corrosion (XC)
    if (ec === 'XC1') wcrLimit = 0.65;
    if (ec === 'XC2') wcrLimit = 0.60;
    if (ec === 'XC3') wcrLimit = 0.55;
    if (ec === 'XC4') wcrLimit = 0.50; // More severe cyclic

    // Chloride Induced Corrosion (XD - non-marine)
    if (ec === 'XD1') wcrLimit = 0.55;
    if (ec === 'XD2') wcrLimit = 0.50;
    if (ec === 'XD3') wcrLimit = 0.45;

    // Chloride Induced Corrosion (XS - marine)
    if (ec === 'XS1') wcrLimit = 0.50; // Airborne salt
    if (ec === 'XS2') wcrLimit = 0.45; // Submerged
    if (ec === 'XS3') wcrLimit = 0.45; // Tidal/Splash

    // Freeze/Thaw Attack (XF)
    if (ec === 'XF1') wcrLimit = 0.55; // Moderate saturation, no de-icer
    if (ec === 'XF2') wcrLimit = 0.50; // Moderate saturation, with de-icer
    if (ec === 'XF3') wcrLimit = 0.50; // High saturation, no de-icer
    if (ec === 'XF4') wcrLimit = 0.45; // High saturation, with de-icer

    // Chemical Attack (XA) - Highly dependent on specific chemical agent & concentration - Using indicative values
    if (ec.startsWith('XA')) {
        // BS 8500 Table A.7 requires specific assessment based on ACEC class
        // Using simplified limits based on general severity
        if (ec.endsWith('1')) wcrLimit = 0.55; // Low aggressiveness
        if (ec.endsWith('2')) wcrLimit = 0.50; // Medium aggressiveness
        if (ec.endsWith('3')) wcrLimit = 0.45; // High aggressiveness
        console.warn("XA exposure WCR is highly dependent on chemical environment. Check BS 8500 Table A.7.");
    }

    // Adjustments for other cement types (BS 8500 Table A.5 allows higher WCR for some CEM2/3 in certain exposures)
    // This is complex, applying a slight general relaxation for CEM2/3 except for XF4/XD3/XS3
     if (!['XF4', 'XD3', 'XS3'].includes(ec)) {
         if (cementType.startsWith('CEM2B') || cementType.startsWith('CEM3A')) wcrLimit = Math.min(0.70, wcrLimit + 0.05);
         else if (cementType.startsWith('CEM2A')) wcrLimit = Math.min(0.70, wcrLimit + 0.03);
     }

    return wcrLimit;
  }
  return 0.70; // Fallback
};

/**
 * Estimates Minimum Cement Content based on BS 8500 / EN 206.
 * @param {string} exposureClass BS Exposure Class (e.g., 'XC1')
 * @param {number} maxAggSize Max Aggregate Size (mm)
 * @param {string} cementType E.g., 'CEM1', 'CEM2A', 'CEM2B', 'CEM3A'
 * @returns {number} Minimum Cement Content (kg/m³)
 */
export const getMinCementContent_BS = (exposureClass, maxAggSize, cementType = 'CEM1') => {
    const ec = String(exposureClass).toUpperCase();
    // Based on BS 8500:2015+A2:2019 Table A.4/A.5 (Indicative for CEM1/Portland Cements)
    // Assumes Dmax = 20mm as base, adjust later
    let minCementBase = 240; // Base for X0

    // Carbonation Induced Corrosion (XC)
    if (ec === 'XC1') minCementBase = 260;
    if (ec === 'XC2') minCementBase = 280;
    if (ec === 'XC3') minCementBase = 300;
    if (ec === 'XC4') minCementBase = 320;

    // Chloride Induced Corrosion (XD - non-marine)
    if (ec === 'XD1') minCementBase = 300;
    if (ec === 'XD2') minCementBase = 320;
    if (ec === 'XD3') minCementBase = 340;

    // Chloride Induced Corrosion (XS - marine)
    if (ec === 'XS1') minCementBase = 320;
    if (ec === 'XS2') minCementBase = 340;
    if (ec === 'XS3') minCementBase = 360;

    // Freeze/Thaw Attack (XF)
    if (ec === 'XF1') minCementBase = 300; // Air entrainment usually required
    if (ec === 'XF2') minCementBase = 320; // Air entrainment usually required
    if (ec === 'XF3') minCementBase = 320; // Air entrainment usually required
    if (ec === 'XF4') minCementBase = 340; // Air entrainment usually required

    // Chemical Attack (XA) - Highly dependent
    if (ec.startsWith('XA')) {
        // BS 8500 Table A.7 requires specific assessment based on ACEC class
        // Using simplified limits based on general severity
        if (ec.endsWith('1')) minCementBase = 300;
        if (ec.endsWith('2')) minCementBase = 320;
        if (ec.endsWith('3')) minCementBase = 340; // Often requires specific cement types
        console.warn("XA exposure min cement is highly dependent on chemical environment. Check BS 8500 Table A.7.");
    }

    // Adjustments for Dmax (Approx based on common practice, e.g., +/- 20kg for 10mm vs 40mm)
    let cementAdjust = 0;
    if (maxAggSize <= 14) cementAdjust = 20; // Higher for smaller aggregate
    else if (maxAggSize >= 32) cementAdjust = -20; // Lower for larger aggregate
    let minCement = minCementBase + cementAdjust;


    // Adjustments for other cement types (BS 8500 Table A.5 allows lower min cement for some CEM2/3 in certain exposures)
    // This is complex, applying a slight general reduction for CEM2/3 except for XF/XA
     if (!ec.startsWith('XF') && !ec.startsWith('XA')) {
         if (cementType.startsWith('CEM2B') || cementType.startsWith('CEM3A')) minCement = Math.max(240, minCement - 20);
         else if (cementType.startsWith('CEM2A')) minCement = Math.max(240, minCement - 10);
     }

    return Math.max(240, minCement); // Absolute minimum often considered 240-260
};


/**
 * Estimates Fine Aggregate Proportion based on BS method principles.
 * Targets a percentage of fine aggregate based on Dmax, grading (FM proxy), and WCR.
 * @param {number} maxAggSize Max Aggregate Size (mm)
 * @param {number} fineAggFM Fineness Modulus (used as proxy for grading zone M, C, F)
 * @param {number} wcr Water/Cement Ratio
 * @returns {number} Estimated Fine Aggregate Proportion (as fraction of total aggregate volume)
 */
export const getCoarseAggregateProportion_BS = (maxAggSize, fineAggFM, wcr) => {
    // Target Fine Aggregate Percentage based on TRL/DOE method principles
    // Base % Fine Agg for Zone M (FM ~2.6-3.0), WCR 0.50
    let baseFinePct = 35; // Default starting point

    if (maxAggSize <= 10) baseFinePct = 45;
    else if (maxAggSize <= 14) baseFinePct = 40;
    else if (maxAggSize <= 20) baseFinePct = 35;
    else if (maxAggSize <= 40) baseFinePct = 30;

    // Adjust for Grading Zone (FM proxy)
    // Zone C (Coarser): FM > 3.0; Zone F (Finer): FM < 2.6
    if (fineAggFM < 2.6) baseFinePct += 3; // Increase fine % for finer sand
    else if (fineAggFM > 3.0) baseFinePct -= 3; // Decrease fine % for coarser sand

    // Adjust for WCR (Lower WCR requires less fines for workability)
    // Approx +/- 1.5% change per 0.05 WCR change from 0.50
    baseFinePct -= (wcr - 0.50) * (1.5 / 0.05);

    // Clamp percentage
    const fineAggPct = Math.max(20, Math.min(55, baseFinePct));

    // Return COARSE aggregate proportion (by volume)
    const coarseAggProportion = 1.0 - (fineAggPct / 100);

    console.warn("BS Coarse Agg Proportion estimated based on target fine agg percentage method.");
    return parseFloat(coarseAggProportion.toFixed(3));
};

/**
 * Estimates Target Air Content based on BS 8500 / EN 206.
 * @param {number} maxAggSize Max Aggregate Size (mm)
 * @param {string} exposureClass BS Exposure Class
 * @param {boolean} isAirEntrainmentSpecified User explicitly requires air entrainment
 * @returns {number} Target total air content (%)
 */
export const getAirContent_BS = (maxAggSize, exposureClass, isAirEntrainmentSpecified) => {
    const ec = String(exposureClass).toUpperCase();
    let targetAir = 1.5; // Default for non-air-entrained

    // Air entrainment typically required for XF classes
    const requiresAir = ec.startsWith('XF');

    if (requiresAir || isAirEntrainmentSpecified) {
        // Indicative values for air-entrained concrete (BS EN 206 Table F.2)
        if (maxAggSize <= 10) targetAir = 6.0;
        else if (maxAggSize <= 16) targetAir = 5.5; // Interpolate? Use 20mm value?
        else if (maxAggSize <= 20) targetAir = 5.0;
        else if (maxAggSize <= 32) targetAir = 4.5; // Interpolate? Use 40mm value?
        else if (maxAggSize <= 40) targetAir = 4.0;
        else targetAir = 3.5; // Larger sizes
        console.warn(`Targeting air content of ${targetAir}% based on exposure/specification.`);
    } else {
        // Non-air-entrained limits (often 1-2.5%)
        if (maxAggSize <= 10) targetAir = 2.5;
        else if (maxAggSize <= 20) targetAir = 2.0;
        else targetAir = 1.5;
    }
    return targetAir;
};