/**
 * Comprehensive functions for Concrete Mix Design
 * based on Kenyan Standards (KS 02-594 and related).
 * Includes adaptations for local materials and conditions in Kenya.
 */

// Helper for linear interpolation
const interpolate = (x, x0, x1, y0, y1) => {
  if (x <= x0) return y0;
  if (x >= x1) return y1;
  return y0 + (y1 - y0) * (x - x0) / (x1 - x0);
};

/**
 * Calculates Required Mean Strength based on Kenyan standards with regional factors.
 * @param {number} fck Characteristic Strength (MPa)
 * @param {number|string} stdDev Standard Deviation (MPa) or 'unknown'
 * @param {string} region Kenyan region ('nairobi', 'coast', etc.)
 * @returns {number} Required Mean Strength (f_m) in MPa
 */
export const getRequiredMeanStrength_KS = (fck, stdDev, region = 'nairobi') => {
  const k = 1.64; // Factor for 5% defective rate
  let margin;
  
  // Regional quality control adjustment factors
  const regionalFactor = {
    'nairobi': 1.0,      // Reference region
    'coast': 1.1,        // Higher variability in coastal regions
    'western': 1.05,     // Slightly higher variability 
    'rift_valley': 1.02, // Slightly higher variability
    'northern': 1.15     // Highest variability in remote regions
  };
  
  const regionMultiplier = regionalFactor[region] || 1.0;

  // Using locally calibrated values based on typical material variability in Kenya
  if (stdDev !== 'unknown' && !isNaN(stdDev) && stdDev >= 2.0) {
    margin = k * stdDev * regionMultiplier;
  } else {
    // Margins based on characteristic strength and local material variability
    if (fck <= 15) margin = 6.0 * regionMultiplier; // Higher margin for lower grades
    else if (fck <= 25) margin = 7.0 * regionMultiplier;
    else if (fck <= 35) margin = 8.0 * regionMultiplier;
    else margin = 9.0 * regionMultiplier; // Higher margin for higher strengths
  }
  
  // Ensure minimum margin
  const minMargin = (fck < 20 ? 5 : (fck < 35 ? 7 : 8)) * regionMultiplier;
  return fck + Math.max(margin, minMargin);
};

/**
 * Estimates Water Content based on Kenyan standards with regional adjustments.
 * @param {number} slump Slump (mm)
 * @param {number} maxAggSize Max Aggregate Size (mm)
 * @param {string} aggType 'crushed' or 'uncrushed'
 * @param {boolean} useSuperplasticizer If superplasticizer is used
 * @param {string} region Kenyan region ('nairobi', 'coast', etc.)
 * @returns {number} Estimated Water Content (kg/m³)
 */
export const getWaterContent_KS = (slump, maxAggSize, aggType = 'crushed', useSuperplasticizer = false, region = 'nairobi') => {
  // Base water content (kg/m³) for 30-60mm slump, crushed aggregate
  // Calibrated for typical Kenyan aggregates which may have higher absorption
  const baseWaterTable = {
    10: 210, // Higher than BS due to local aggregate properties
    14: 200,
    20: 190,
    40: 170,
  };

  // Regional water adjustment factors based on typical aggregate characteristics
  const regionalWaterFactor = {
    'nairobi': 1.0,    // Reference region
    'coast': 0.97,     // Slightly lower water demand due to higher humidity
    'western': 1.02,   // Slightly higher water demand
    'rift_valley': 1.0, // Similar to Nairobi
    'northern': 1.05    // Higher water demand in arid areas due to aggregate properties
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

  let baseWater = interpolate(maxAggSize, sizeLower, sizeUpper, baseWaterTable[sizeLower], baseWaterTable[sizeUpper]);

  // Apply regional factor
  baseWater *= regionalWaterFactor[region] || 1.0;

  // Adjust for aggregate type
  if (aggType === 'uncrushed') {
    baseWater -= 20; // Typical reduction for river gravel in Kenya
  }

  // Adjust for slump
  const slumpMidpoint = 45;
  baseWater += (slump - slumpMidpoint) * (12 / 50); // Slightly higher adjustment for local conditions

  // Adjust for superplasticizer - using more precise adjustment for modern admixtures
  if (useSuperplasticizer) {
    // More sophisticated water reduction based on slump
    const reductionFactor = slump <= 50 ? 0.85 : (slump <= 100 ? 0.80 : 0.75);
    baseWater *= reductionFactor;
  }

  return Math.round(baseWater);
};

/**
 * Estimates Max Water/Cement Ratio based on Kenyan standards.
 * @param {string} type 'strength' or 'exposure'
 * @param {number|string} value Strength (MPa) or Exposure Class
 * @param {string} cementType E.g., 'CEM42.5N', 'CEM32.5R', 'PPC'
 * @returns {number} Estimated Max W/C Ratio
 */
export const getWCRatio_KS = (type, value, cementType = 'CEM42.5N') => {
  if (type === 'strength') {
    const fm = value;
    // W/C ratios calibrated for locally available cements
    let wcr;
    
    // Adjust based on cement type
    const cementFactor = 
      cementType === 'CEM32.5R' ? 0.98 : 
      cementType === 'PPC' ? 0.95 : 1.0;
      
    if (fm <= 20) wcr = 0.72 * cementFactor;
    else if (fm <= 30) wcr = interpolate(fm, 20, 30, 0.72, 0.60) * cementFactor;
    else if (fm <= 40) wcr = interpolate(fm, 30, 40, 0.60, 0.50) * cementFactor;
    else if (fm <= 50) wcr = interpolate(fm, 40, 50, 0.50, 0.42) * cementFactor;
    else wcr = 0.40 * cementFactor;

    return parseFloat(wcr.toFixed(2));
  } 
  else if (type === 'exposure') {
    const ec = String(value).toUpperCase();
    // Kenyan exposure classes adapted from BS with modifications for local climate
    let wcrLimit = 0.70; // Default fallback

    // Environment-based limits
    // XC - Carbonation (major cities vs rural)
    if (ec === 'XC1') wcrLimit = 0.65;
    if (ec === 'XC2') wcrLimit = 0.60;
    if (ec === 'XC3') wcrLimit = 0.55;
    if (ec === 'XC4') wcrLimit = 0.50;

    // XD - Chlorides inland (non-marine)
    if (ec === 'XD1') wcrLimit = 0.55;
    if (ec === 'XD2') wcrLimit = 0.50;
    if (ec === 'XD3') wcrLimit = 0.45;

    // XS - Coastal exposure (Mombasa, coastal regions)
    if (ec === 'XS1') wcrLimit = 0.50;
    if (ec === 'XS2') wcrLimit = 0.45;
    if (ec === 'XS3') wcrLimit = 0.45;
    
    // XA - Chemical (industrial areas, agricultural areas)
    if (ec.startsWith('XA')) {
      if (ec.endsWith('1')) wcrLimit = 0.55;
      if (ec.endsWith('2')) wcrLimit = 0.50;
      if (ec.endsWith('3')) wcrLimit = 0.45;
    }
    
    return wcrLimit;
  }
  
  return 0.65; // Default fallback
};

/**
 * Get minimum cement content based on Kenyan exposure conditions with regional considerations.
 * @param {string} exposureClass Kenyan exposure classification
 * @param {number} maxAggSize Maximum aggregate size (mm)
 * @param {string} region Kenyan region ('nairobi', 'coast', etc.)
 * @returns {number} Minimum cement content (kg/m³)
 */
export const getMinCementContent_KS = (exposureClass, maxAggSize, region = 'nairobi') => {
  const ec = String(exposureClass).toUpperCase();
  
  // Regional cement content adjustment factors
  const regionalFactor = {
    'nairobi': 1.0,    // Reference region
    'coast': 1.15,     // Higher min cement for coastal durability
    'western': 1.05,   // Slightly higher for high rainfall areas
    'rift_valley': 1.0, // Similar to Nairobi
    'northern': 0.95    // Slightly lower for arid regions (less corrosion risk)
  };
  
  // Base values adapted for Kenyan conditions
  let minCementBase = 240; // Base for X0/XC1

  // Handle special region-specific exposure cases
  if (ec === 'XS1-COAST') {
    // Specific to coastal region within 1-5km of shoreline
    minCementBase = 340;
  } else if (ec === 'XA1-SOIL') {
    // Agricultural areas with slightly aggressive soils
    minCementBase = 300;
  } else if (ec === 'XA1-IND') {
    // Light industrial areas with mild chemical exposure
    minCementBase = 320;
  } else {
    // Standard exposure classifications
    // Carbonation exposure (urban vs rural)
    if (ec === 'XC1') minCementBase = 260;
    if (ec === 'XC2') minCementBase = 280; 
    if (ec === 'XC3') minCementBase = 300;
    if (ec === 'XC4') minCementBase = 320;

    // Chloride exposure (non-coastal)
    if (ec === 'XD1') minCementBase = 300;
    if (ec === 'XD2') minCementBase = 320;
    if (ec === 'XD3') minCementBase = 340;

    // Chloride exposure (coastal regions)
    if (ec === 'XS1') minCementBase = 320;
    if (ec === 'XS2') minCementBase = 340;
    if (ec === 'XS3') minCementBase = 360;

    // Chemical attack (industrial areas)
    if (ec.startsWith('XA')) {
      if (ec.endsWith('1')) minCementBase = 300;
      if (ec.endsWith('2')) minCementBase = 320;
      if (ec.endsWith('3')) minCementBase = 340;
    }
    
    // Abrasion resistance classes
    if (ec.startsWith('XM')) {
      if (ec.endsWith('1')) minCementBase = 300;
      if (ec.endsWith('2')) minCementBase = 320;
      if (ec.endsWith('3')) minCementBase = 340;
    }
  }

  // Apply regional factor
  minCementBase *= regionalFactor[region] || 1.0;

  // Adjust for Dmax (similar to BS/EN)
  let cementAdjust = 0;
  if (maxAggSize <= 14) cementAdjust = 20;
  else if (maxAggSize >= 32) cementAdjust = -20;
  
  return Math.max(240, minCementBase + cementAdjust);
};

/**
 * Estimates aggregate proportioning appropriate for Kenyan materials with regional considerations.
 * @param {number} maxAggSize Max aggregate size (mm)
 * @param {number} fineAggFM Fineness modulus of sand
 * @param {number} wcr Water-cement ratio
 * @param {string} region Kenyan region ('nairobi', 'coast', etc.)
 * @returns {number} Coarse aggregate proportion (fraction)
 */
export const getCoarseAggregateProportion_KS = (maxAggSize, fineAggFM, wcr, region = 'nairobi') => {
  // Target fine aggregate percentage - adjusted for typical Kenyan sand properties
  let baseFinePct = 36; // Default starting point
  
  // Regional fine aggregate adjustment - accounts for typical sand characteristics
  const regionalFinePctAdjust = {
    'nairobi': 0,      // Reference region
    'coast': -2,       // Coastal sands typically coarser
    'western': +1,     // Western region sands typically finer
    'rift_valley': 0,  // Similar to Nairobi
    'northern': -3     // Northern region sands typically coarser
  };

  if (maxAggSize <= 10) baseFinePct = 46;
  else if (maxAggSize <= 14) baseFinePct = 42; 
  else if (maxAggSize <= 20) baseFinePct = 36;
  else if (maxAggSize <= 40) baseFinePct = 32;

  // Apply regional adjustment
  baseFinePct += (regionalFinePctAdjust[region] || 0);

  // Adjust for sand grading (Kenya typically has finer sand)
  if (fineAggFM < 2.5) baseFinePct += 4; // More fine agg for very fine sand
  else if (fineAggFM < 2.8) baseFinePct += 2; // More fine agg for fine sand
  else if (fineAggFM > 3.0) baseFinePct -= 3; // Less fine agg for coarse sand
  
  // Adjust for WCR
  baseFinePct -= (wcr - 0.50) * (1.5 / 0.05);

  // Clamp percentage
  const fineAggPct = Math.max(25, Math.min(55, baseFinePct));
  
  // Return coarse aggregate proportion
  return parseFloat((1.0 - (fineAggPct / 100)).toFixed(3));
};

/**
 * Estimates air content based on Kenyan practice.
 * @param {number} maxAggSize Maximum aggregate size (mm)
 * @param {string} exposureClass Exposure classification
 * @param {boolean} isAirEntrained If air entrainment is specified
 * @returns {number} Target air content (%)
 */
export const getAirContent_KS = (maxAggSize, exposureClass, isAirEntrained) => {
  // Air entrainment is less common in Kenya except for special applications
  if (!isAirEntrained) {
    // Naturally entrapped air
    if (maxAggSize <= 10) return 3.0;
    if (maxAggSize <= 20) return 2.0;
    if (maxAggSize <= 40) return 1.5;
    return 1.0;
  } else {
    // For the rare cases where air entrainment is specified
    if (maxAggSize <= 10) return 6.5;
    if (maxAggSize <= 20) return 5.0;
    if (maxAggSize <= 40) return 4.5;
    return 4.0;
  }
};