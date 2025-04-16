/**
 * Calculate influence lines for beams.
 * NOTE: Influence lines for indeterminate structures (Fixed-Fixed, Fixed-Pinned, Multi-Span)
 * are simplified approximations and may not be accurate.
 */

/**
 * Calculate influence line for Bending Moment at a specific location on the beam
 * @param {Object} beamConfig - Beam configuration
 * @param {number} position - Position (0-1) along the beam to calculate influence for
 * @returns {Array} - Array of influence values along the beam
 */
export const calculateInfluenceLine = (beamConfig, position) => {
  const numPoints = 100;
  const influenceLine = new Array(numPoints + 1).fill(0);
  const L = beamConfig.length;

  // Get absolute position in meters where influence is calculated
  const targetPosition = position * L; // 'c' in formulas

  // Calculate influence line based on support type
  switch(beamConfig.supportType) {
    case 'simply-supported':
      calculateSimplySupportedInfluence(L, targetPosition, influenceLine, numPoints);
      break;
    case 'cantilever': // Fixed at left (x=0)
      calculateCantileverInfluence(L, targetPosition, influenceLine, numPoints);
      break;
    case 'fixed-fixed':
      // WARNING: Approximation
      calculateFixedFixedInfluenceApprox(L, targetPosition, influenceLine, numPoints);
      break;
    case 'fixed-pinned': // Fixed at left (x=0)
      // WARNING: Approximation
      calculateFixedPinnedInfluenceApprox(L, targetPosition, influenceLine, numPoints);
      break;
    case 'multi-span':
      // WARNING: Approximation (Based on isolated simply supported span)
      calculateMultiSpanInfluenceApprox(beamConfig, targetPosition, influenceLine, numPoints);
      break;
    default:
      calculateSimplySupportedInfluence(L, targetPosition, influenceLine, numPoints);
  }

  return influenceLine;
};

/**
 * Calculate influence line for Bending Moment on simply supported beam (Müller-Breslau)
 */
const calculateSimplySupportedInfluence = (L, c, influenceLine, numPoints) => {
  // Influence line for moment at 'c' due to unit load at 'x'
  for (let i = 0; i <= numPoints; i++) {
    const x = (i / numPoints) * L; // Position of unit load
    if (x <= c) {
      influenceLine[i] = x * (L - c) / L;
    } else {
      influenceLine[i] = c * (L - x) / L;
    }
  }
};

/**
 * Calculate influence line for Bending Moment on cantilever beam (fixed at x=0)
 */
const calculateCantileverInfluence = (L, c, influenceLine, numPoints) => {
  // Influence line for moment at 'c' due to unit load at 'x'
  for (let i = 0; i <= numPoints; i++) {
    const x = (i / numPoints) * L; // Position of unit load
    if (x >= c) {
      influenceLine[i] = -(x - c); // Moment is negative (tension top)
    } else {
      influenceLine[i] = 0;
    }
  }
};

/**
 * Calculate influence line for fixed-fixed beam (APPROXIMATION)
 */
const calculateFixedFixedInfluenceApprox = (L, c, influenceLine, numPoints) => {
  // This is NOT the correct influence line. It's a scaled simply supported one.
  // Real IL involves cubic functions.
  console.warn("Using approximate influence line for Fixed-Fixed beam.");
  for (let i = 0; i <= numPoints; i++) {
    const x = (i / numPoints) * L;
    let simpleIL = 0;
    if (x <= c) {
      simpleIL = x * (L - c) / L;
    } else {
      simpleIL = c * (L - x) / L;
    }
    // Arbitrary scaling factor - this is incorrect but shows some effect of fixity
    influenceLine[i] = simpleIL * (1 - 2 * (c/L) * (1 - c/L)); // Very rough scaling
  }
};

/**
 * Calculate influence line for fixed-pinned beam (APPROXIMATION)
 */
const calculateFixedPinnedInfluenceApprox = (L, c, influenceLine, numPoints) => {
  // This is NOT the correct influence line. Interpolating between SS and FF approx.
  console.warn("Using approximate influence line for Fixed-Pinned beam.");
  const simplyInfluence = new Array(numPoints + 1).fill(0);
  calculateSimplySupportedInfluence(L, c, simplyInfluence, numPoints);

  const fixedInfluenceApprox = new Array(numPoints + 1).fill(0);
  calculateFixedFixedInfluenceApprox(L, c, fixedInfluenceApprox, numPoints); // Using the approx FF

  // Approximate as average (still incorrect)
  for (let i = 0; i <= numPoints; i++) {
    influenceLine[i] = (simplyInfluence[i] + fixedInfluenceApprox[i]) / 2;
  }
};

/**
 * Calculate influence line for multi-span beam (APPROXIMATION)
 */
const calculateMultiSpanInfluenceApprox = (beamConfig, targetPosition, influenceLine, numPoints) => {
  // WARNING: Treats the target span as isolated simply supported. Ignores continuity.
  console.warn("Using approximate influence line for Multi-Span beam.");
  const L = beamConfig.length;
  const numSegments = beamConfig.segments || 1;
  const spanLength = L / numSegments;

  // Determine which span the target position 'c' is on
  const targetSpanIndex = Math.min(numSegments - 1, Math.floor(targetPosition / spanLength));
  const targetPositionInSpan = targetPosition - targetSpanIndex * spanLength;

  // Calculate influence line for an isolated simply supported beam of spanLength
  const spanInfluence = new Array(numPoints + 1).fill(0);
  calculateSimplySupportedInfluence(spanLength, targetPositionInSpan, spanInfluence, numPoints);

  // Map the results of the isolated span onto the full beam array
  // const pointsPerSpan = Math.floor(numPoints / numSegments); // Removed: Unused

  for (let i = 0; i <= numPoints; i++) {
      const loadPositionGlobal = (i / numPoints) * L;
      // Determine which span the unit load 'x' is on
      const loadSpanIndex = Math.min(numSegments - 1, Math.floor(loadPositionGlobal / spanLength));

      // Only consider influence if load is in the same span as the target point (approximation)
      if (loadSpanIndex === targetSpanIndex) {
          // Map global load position 'i' to local index within the span calculation
          const loadPositionInSpan = loadPositionGlobal - loadSpanIndex * spanLength;
          const localLoadIndex = Math.min(numPoints, Math.round((loadPositionInSpan / spanLength) * numPoints));
          influenceLine[i] = spanInfluence[localLoadIndex];
      } else {
          influenceLine[i] = 0; // Ignore influence from other spans (incorrect)
      }
  }
};