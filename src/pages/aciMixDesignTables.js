/**
 * Calculates Required Average Compressive Strength (f'cr) per ACI 318/211.1
 * Based on Table A1.5.3.1 (ACI 211.1) or similar in ACI 318/301.
 * @param {number} fc Specified Compressive Strength (MPa)
 * @param {number|string} stdDev Standard Deviation (MPa) or 'unknown'
 * @returns {number} Required Average Strength (f'cr) in MPa
 */
export const getRequiredAverageStrength = (fc, stdDev) => {
  if (stdDev === 'unknown' || isNaN(stdDev)) {
    // Use formulas for unknown standard deviation
    if (fc < 21) return fc + 7.0;
    if (fc <= 35) return fc + 8.5;
    return fc * 1.1 + 5.0; // Simplified from ACI 318 (check latest standard)
  } else {
    // Use formulas for known standard deviation
    const fcr1 = fc + 1.34 * stdDev;
    const fcr2 = (fc <= 35) ? (fc + 2.33 * stdDev - 3.45) : (0.90 * fc + 2.33 * stdDev);
    return Math.max(fcr1, fcr2);
  }
};

// Example: Approximate water content (kg/m³) - Needs more detail/interpolation
export const getWaterContent = (slump, maxAggSize, isAirEntrained) => {
  // Replace with accurate lookup/interpolation based on ACI Table A1.5.3.3
  // Example structure:
  const table = {
    // size: { slumpRange1: [nonAE, AE], slumpRange2: [nonAE, AE], ... }
    10: { 75: [207, 181], 150: [228, 202] }, // Simplified - add more slump ranges
    20: { 75: [190, 166], 150: [205, 184] },
    40: { 75: [170, 150], 150: [185, 165] },
  };
  // Find closest slump range and size, interpolate if necessary
  let baseWater = 190; // Fallback
  if (table[maxAggSize]) {
     // Find closest slump key (e.g., 75 or 150)
     const closestSlumpKey = Object.keys(table[maxAggSize]).reduce((prev, curr) =>
       Math.abs(curr - slump) < Math.abs(prev - slump) ? curr : prev
     );
     baseWater = isAirEntrained ? table[maxAggSize][closestSlumpKey][1] : table[maxAggSize][closestSlumpKey][0];
  }
  // Add more sophisticated interpolation logic here
  return baseWater;
};

// Example: Approximate air content (%) - Needs more detail
export const getAirContent = (maxAggSize, exposure, isAirEntrained) => {
  // Replace with accurate lookup based on ACI Table A1.5.3.3
  if (!isAirEntrained) {
      // Nominal max size vs Recommended avg total air for non-AE concrete (Table A1.5.3.3)
      if (maxAggSize <= 10) return 3.0;
      if (maxAggSize <= 20) return 2.0;
      if (maxAggSize <= 40) return 1.0;
      return 0.5; // Larger sizes
  } else {
      // Air-entrained - based on exposure level and max size (Table A1.5.3.3)
      // Exposure: mild, moderate, severe
      const exposureMap = { mild: 0, moderate: 1, severe: 2 };
      const airTable = {
          // size: [mild, moderate, severe] target air %
          10: [4.5, 6.0, 7.5],
          20: [3.5, 5.0, 6.0],
          40: [2.5, 4.5, 5.5],
      };
      const targetAir = airTable[maxAggSize] || airTable[20]; // Default to 20mm if size not found
      return targetAir[exposureMap[exposure] || 1]; // Default to moderate if exposure invalid
  }
};

// Example: W/C Ratio based on strength - Needs more detail/interpolation
export const getWCRatio = (type, value, isAirEntrained) => {
  if (type === 'strength') {
    const fcr = value; // Now using f'cr
    // Replace with accurate lookup/interpolation based on ACI Table A1.5.3.4(a)
    // Example:
    if (fcr >= 45) return isAirEntrained ? 0.35 : 0.40; // Rough values
    if (fcr >= 40) return isAirEntrained ? 0.38 : 0.43;
    if (fcr >= 35) return isAirEntrained ? 0.43 : 0.48;
    if (fcr >= 30) return isAirEntrained ? 0.48 : 0.55;
    if (fcr >= 25) return isAirEntrained ? 0.57 : 0.62;
    if (fcr >= 20) return isAirEntrained ? 0.68 : 0.74;
    return isAirEntrained ? 0.79 : 0.82;
  }
  if (type === 'exposure') {
    // Replace/verify with accurate lookup based on ACI Table A1.5.3.4(b)
    const exposure = value;
    if (exposure === 'severe') return 0.45;
    if (exposure === 'moderate') return 0.50;
    return 0.60; // Mild
  }
  return 0.6;
};

// Example: Volume of Coarse Aggregate - Needs more detail/interpolation
export const getCoarseAggregateVolume = (maxAggSize, finenessModulus) => {
  // Replace with accurate lookup/interpolation based on ACI Table A1.5.3.6
  // Structure: table[maxAggSize][finenessModulus] -> volume fraction
  const fmMap = { 2.4: 0, 2.6: 1, 2.8: 2, 3.0: 3 }; // Index mapping
  const volTable = {
    // size: [FM=2.4, FM=2.6, FM=2.8, FM=3.0]
    10: [0.50, 0.48, 0.46, 0.44],
    20: [0.66, 0.64, 0.62, 0.60],
    40: [0.75, 0.73, 0.71, 0.69],
  };
  // Find closest FM index and size, interpolate if necessary
  let baseVolume = 0.62; // Fallback
  if (volTable[maxAggSize]) {
      const closestFMIndex = Object.keys(fmMap).reduce((prev, curr) =>
          Math.abs(curr - finenessModulus) < Math.abs(prev - finenessModulus) ? curr : prev
      );
      baseVolume = volTable[maxAggSize][fmMap[closestFMIndex]];
  }
  // Add interpolation logic here
  return baseVolume;
};