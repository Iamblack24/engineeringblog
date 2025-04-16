/**
 * More comprehensive (but still interpretive) functions for Concrete Mix Design
 * based on Eurocode (EN 206, EN 1992).
 * NOTE: Requires verification against the full standards, National Annexes (NA), and trial batches.
 * Uses indicative values from base EN 206 where NA is required. KENYAN NA VALUES MAY DIFFER.
 */

// Helper for linear interpolation
const interpolate = (x, x0, x1, y0, y1) => {
  if (x <= x0) return y0;
  if (x >= x1) return y1;
  return y0 + (y1 - y0) * (x - x0) / (x1 - x0);
};

/**
 * Calculates Required Mean Strength (f_cm) per EN 1992 / EN 206.
 * f_cm = f_ck + k * s (k = 1.645 for 5% defective rate)
 * Uses f_cm = f_ck + 8 MPa if std dev is unknown/unreliable (common simplification).
 * @param {number} fck Characteristic Strength (MPa)
 * @param {number|string} stdDev Standard Deviation (MPa) or 'unknown'
 * @returns {number} Required Mean Strength (f_cm) in MPa
 */
export const getRequiredMeanStrength_EN = (fck, stdDev) => {
  const k = 1.645; // Factor for 5% defective rate
  let fcm;

  // EN 206 suggests minimum std dev (e.g., 2 MPa for internal, 3 MPa external)
  // Or use established relationship. If none, fck+8 is common fallback.
  if (stdDev !== 'unknown' && !isNaN(stdDev) && stdDev >= 2.0) {
    fcm = fck + k * stdDev;
    // Check against fck+8 as a practical minimum margin in some cases? Optional.
    // fcm = Math.max(fcm, fck + 8.0);
  } else {
    // Common simplification from EN 1992-1-1 Cl 3.1.6(1)P Note 2 (if s unknown)
    fcm = fck + 8.0;
    console.warn("Using f_cm = f_ck + 8 MPa as standard deviation is unknown or low.");
  }
  return fcm;
};

/**
 * Estimates Water Content based on EN principles (Consistency Classes).
 * EN 206 is not prescriptive with tables. Relies on experience/trials.
 * This provides a slightly more refined estimate based on Consistency Class & Dmax.
 * @param {number} slump Slump (mm)
 * @param {number} maxAggSize Max Aggregate Size (D_max, mm)
 * @param {boolean} useSuperplasticizer If SP is used (reduces water)
 * @returns {number} Estimated Water Content (kg/m³)
 */
export const getWaterContent_EN = (slump, maxAggSize, useSuperplasticizer = false) => {
  console.warn("EN water content estimation is indicative; trial mixes are essential.");
  // Map slump to consistency class roughly
  let consistencyClass = 'S3';
  if (slump <= 40) consistencyClass = 'S1';
  else if (slump <= 90) consistencyClass = 'S2';
  else if (slump <= 150) consistencyClass = 'S3';
  else if (slump <= 210) consistencyClass = 'S4';
  else consistencyClass = 'S5'; // Very high slump/flow

  // Base water content (kg/m³) for S3 consistency, Dmax 32mm (common starting point)
  const baseWaterTable = {
    // Dmax (mm) : Water (kg/m³) for S3
    8: 215, // Extrapolated
    16: 200,
    32: 185,
    63: 170, // Extrapolated
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
   if (maxAggSize > sizeUpper) { // Extrapolate cautiously
       sizeLower = sizes[sizes.length - 2];
       sizeUpper = sizes[sizes.length - 1];
   }
    if (maxAggSize < sizeLower) { // Extrapolate cautiously
       sizeLower = sizes[0];
       sizeUpper = sizes[1];
   }

  let baseWater = interpolate(maxAggSize, sizeLower, sizeUpper, baseWaterTable[sizeLower], baseWaterTable[sizeUpper]);

  // Adjust for Consistency Class (relative to S3) - Approximate values
  const consistencyAdjust = {
    'S1': -25,
    'S2': -10,
    'S3': 0,
    'S4': +15,
    'S5': +30, // May require SP anyway
  };
  baseWater += consistencyAdjust[consistencyClass];

  // Adjust for superplasticizer (common reduction range 10-30%)
  if (useSuperplasticizer || ['S4', 'S5'].includes(consistencyClass)) {
      if (!useSuperplasticizer) {
          console.warn("High consistency class likely requires superplasticizer; applying estimated water reduction.");
      }
      baseWater *= 0.85; // Apply a typical 15% reduction - HIGHLY VARIABLE
      console.warn("Applied estimated 15% water reduction for superplasticizer/high consistency.");
  }

  return Math.round(baseWater);
};

/**
 * Estimates Max Water/Cement Ratio based on EN 206 Table F.1 (Indicative values).
 * CHECK NATIONAL ANNEX (NA) for specific limits in Kenya/target region.
 * @param {string} exposureClass EN Exposure Class (e.g., 'XC1', 'XD3')
 * @param {number} fck Characteristic Strength (MPa) - Used indirectly via cement content check
 * @param {string} cementType E.g., 'CEM1', 'CEM2A', 'CEM2B', 'CEM3A' (Simplified categories)
 * @returns {number} Estimated Max W/C Ratio
 */
export const getWCRatio_EN = (exposureClass, fck, cementType = 'CEM1') => {
  console.warn("EN WCR limits are indicative from EN 206 Table F.1. CHECK NATIONAL ANNEX.");
  const ec = String(exposureClass).toUpperCase();
  let wcrLimit = 0.70; // Default fallback (higher than X0 usually)

  // Indicative values from EN 206:2013 Table F.1 (for CEM I, CEM II/A)
  // X0 (No risk): No limit specified, use high value
  if (ec === 'X0') wcrLimit = 0.70; // Or higher, practically limited by handling

  // XC - Carbonation
  if (ec === 'XC1') wcrLimit = 0.65;
  if (ec === 'XC2') wcrLimit = 0.60;
  if (ec === 'XC3') wcrLimit = 0.55;
  if (ec === 'XC4') wcrLimit = 0.50;

  // XD - Chlorides (non-marine)
  if (ec === 'XD1') wcrLimit = 0.55;
  if (ec === 'XD2') wcrLimit = 0.50;
  if (ec === 'XD3') wcrLimit = 0.45;

  // XS - Chlorides (marine)
  if (ec === 'XS1') wcrLimit = 0.50;
  if (ec === 'XS2') wcrLimit = 0.45;
  if (ec === 'XS3') wcrLimit = 0.45;

  // XF - Freeze/Thaw
  if (ec === 'XF1') wcrLimit = 0.55;
  if (ec === 'XF2') wcrLimit = 0.50;
  if (ec === 'XF3') wcrLimit = 0.50;
  if (ec === 'XF4') wcrLimit = 0.45;

  // XA - Chemical Attack (Highly dependent on chemical agent - SRPC might be needed)
  if (ec.startsWith('XA')) {
    // Indicative limits, NA and specific assessment are crucial
    if (ec.endsWith('1')) wcrLimit = 0.55; // Low
    if (ec.endsWith('2')) wcrLimit = 0.50; // Medium
    if (ec.endsWith('3')) wcrLimit = 0.45; // High
    console.warn("XA exposure WCR is highly dependent on chemical environment. Check NA & EN 206 Annex B.");
  }

  // Note: EN 206 Table F.1 allows adjustments for other cement types (e.g., CEM III/A might allow +0.05 WCR in some XC/XD/XS).
  // This is complex and NA-dependent. Not implemented here for simplicity.

  return wcrLimit;
};

/**
 * Estimates Minimum Cement Content based on EN 206 Table F.1 (Indicative values).
 * CHECK NATIONAL ANNEX (NA) for specific limits in Kenya/target region.
 * @param {string} exposureClass EN Exposure Class (e.g., 'XC1')
 * @param {number} maxAggSize Max Aggregate Size (D_max, mm)
 * @param {string} cementType E.g., 'CEM1', 'CEM2A', 'CEM2B', 'CEM3A'
 * @returns {number} Minimum Cement Content (kg/m³)
 */
export const getMinCementContent_EN = (exposureClass, maxAggSize, cementType = 'CEM1') => {
    console.warn("EN Min Cement Content limits are indicative from EN 206 Table F.1. CHECK NATIONAL ANNEX.");
    const ec = String(exposureClass).toUpperCase();
    // Indicative values from EN 206:2013 Table F.1 (for Dmax 32mm base)
    let minCementBase = 240; // Base for X0

    // XC - Carbonation
    if (ec === 'XC1') minCementBase = 260;
    if (ec === 'XC2') minCementBase = 280;
    if (ec === 'XC3') minCementBase = 280;
    if (ec === 'XC4') minCementBase = 300;

    // XD - Chlorides (non-marine)
    if (ec === 'XD1') minCementBase = 300;
    if (ec === 'XD2') minCementBase = 320;
    if (ec === 'XD3') minCementBase = 340;

    // XS - Chlorides (marine)
    if (ec === 'XS1') minCementBase = 300;
    if (ec === 'XS2') minCementBase = 320;
    if (ec === 'XS3') minCementBase = 340;

    // XF - Freeze/Thaw
    if (ec === 'XF1') minCementBase = 300; // Air usually required
    if (ec === 'XF2') minCementBase = 320; // Air usually required
    if (ec === 'XF3') minCementBase = 320; // Air usually required
    if (ec === 'XF4') minCementBase = 340; // Air usually required

    // XA - Chemical Attack
    if (ec.startsWith('XA')) {
        // Indicative limits, NA and specific assessment are crucial
        if (ec.endsWith('1')) minCementBase = 300; // Low
        if (ec.endsWith('2')) minCementBase = 320; // Medium
        if (ec.endsWith('3')) minCementBase = 360; // High (SRPC often needed)
        console.warn("XA exposure min cement is highly dependent on chemical environment. Check NA & EN 206 Annex B.");
    }

    // Adjust for Dmax (Table F.1 Note allows reduction for Dmax > 32mm, increase for < 16mm - simplified)
    let cementAdjust = 0;
    if (maxAggSize <= 16) cementAdjust = 20; // Increase for smaller Dmax
    else if (maxAggSize >= 40) cementAdjust = -20; // Decrease for larger Dmax (Check NA limits)
    let minCement = minCementBase + cementAdjust;

    // Note: EN 206 Table F.1 allows adjustments for other cement types. Not implemented here.

    return Math.max(240, minCement); // Absolute minimum often considered 240-260
};

/**
 * Estimates Aggregate Proportion based on EN principles (Combined Grading focus).
 * Provides a starting point based on Dmax, FM, WCR, similar to BS placeholder.
 * Emphasizes that achieving a good grading curve is the primary goal in EN.
 * @param {number} maxAggSize Max Aggregate Size (D_max, mm)
 * @param {number} fineAggFM Fineness Modulus (proxy for fine agg grading)
 * @param {number} wcr Water/Cement Ratio
 * @returns {number} Estimated Coarse Aggregate Proportion (as fraction of total aggregate volume) - ROUGH STARTING POINT
 */
export const getCoarseAggregateProportion_EN = (maxAggSize, fineAggFM, wcr) => {
    console.warn("EN aggregate proportioning focuses on combined grading. This is a rough starting point based on Dmax/FM/WCR.");
    // Similar logic to BS placeholder, adjusted slightly
    let baseFinePct = 38; // Default starting point for Dmax ~20-32mm

    if (maxAggSize <= 16) baseFinePct = 45;
    else if (maxAggSize <= 32) baseFinePct = 38;
    else if (maxAggSize <= 63) baseFinePct = 32;

    // Adjust for Grading (FM proxy)
    if (fineAggFM < 2.6) baseFinePct += 3; // Increase fine % for finer sand
    else if (fineAggFM > 3.0) baseFinePct -= 3; // Decrease fine % for coarser sand

    // Adjust for WCR
    baseFinePct -= (wcr - 0.50) * (1.5 / 0.05);

    // Clamp percentage
    const fineAggPct = Math.max(25, Math.min(50, baseFinePct));

    // Return COARSE aggregate proportion (by volume)
    const coarseAggProportion = 1.0 - (fineAggPct / 100);

    return parseFloat(coarseAggProportion.toFixed(3));
};

/**
 * Estimates Target Air Content based on EN 206.
 * @param {number} maxAggSize Max Aggregate Size (D_max, mm)
 * @param {string} exposureClass EN Exposure Class
 * @param {boolean} isAirEntrainmentSpecified User explicitly requires air entrainment
 * @returns {number} Target total air content (%)
 */
export const getAirContent_EN = (maxAggSize, exposureClass, isAirEntrainmentSpecified) => {
    const ec = String(exposureClass).toUpperCase();
    let targetAir = 1.5; // Default for non-air-entrained

    // Air entrainment typically required for XF classes (Check NA)
    const requiresAir = ec.startsWith('XF');

    if (requiresAir || isAirEntrainmentSpecified) {
        // Indicative values for air-entrained concrete (EN 206 Table F.2 - CHECK NA)
        if (maxAggSize <= 8) targetAir = 7.0; // Extrapolated/Smallest size
        else if (maxAggSize <= 16) targetAir = 6.0;
        else if (maxAggSize <= 32) targetAir = 5.0;
        else if (maxAggSize <= 63) targetAir = 4.5;
        else targetAir = 4.0; // Larger sizes
        console.warn(`Targeting air content of ${targetAir}% based on exposure/specification. Check NA.`);
    } else {
        // Non-air-entrained limits (often 1-2.5%) - EN 206 Table F.2 Note 1 suggests max values
        if (maxAggSize <= 8) targetAir = 3.0; // Higher for smaller agg
        else if (maxAggSize <= 16) targetAir = 2.5;
        else if (maxAggSize <= 32) targetAir = 2.0;
        else targetAir = 1.5;
    }
    return targetAir;
};