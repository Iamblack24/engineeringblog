/**
 * Core calculation engine for beam analysis under moving loads.
 * Uses standard formulas for common cases.
 * NOTE: Multi-span calculations are highly simplified approximations.
 * NOTE: Deflection calculations use standard formulas where available, otherwise placeholders.
 */

// Constants for numerical stability
const SMALL_NUM = 1e-9;

/**
 * Calculate beam response (bending moment, shear force, deflection) for given configuration
 * @param {Object} beamConfig - Beam configuration
 * @param {Object} loadConfig - Load configuration including position
 * @returns {Object} - Results with bendingMoment, shearForce, and deflection arrays
 */
export const calculateBeamResponse = (beamConfig, loadConfig) => {
  const numPoints = 100; // Discretization points
  const dx = beamConfig.length / numPoints;
  const L = beamConfig.length;

  // Initialize result arrays
  const bendingMoment = new Array(numPoints + 1).fill(0);
  const shearForce = new Array(numPoints + 1).fill(0);
  const deflection = new Array(numPoints + 1).fill(0);

  // Material Properties (ensure correct units: N, m)
  const E = beamConfig.elasticModulus * 1e9; // GPa to Pa (N/m²)
  const I = beamConfig.momentOfInertia * 1e-8; // cm⁴ to m⁴
  const EI = E * I; // N·m²

  // --- Handle Train Loads via Superposition ---
  if (loadConfig.type === 'train' && loadConfig.trainLoads && loadConfig.trainLoads.length > 0) {
    const trainPositionOffset = loadConfig.position * L; // Position of the first axle

    loadConfig.trainLoads.forEach(axle => {
      const axleMagnitude = axle.magnitude;
      // Calculate absolute position of this axle
      const axleAbsolutePos = trainPositionOffset + (axle.position || 0); // axle.position is relative to train start

      // Create a temporary point load config for this axle
      const singleLoadConfig = {
        type: 'point',
        magnitude: axleMagnitude,
        position: axleAbsolutePos / L, // Position as fraction
        width: 0,
      };

      // Calculate response for this single axle load
      const singleResponse = calculateSingleLoadResponse(beamConfig, singleLoadConfig, EI, numPoints, dx);

      // Superimpose results
      for (let i = 0; i <= numPoints; i++) {
        bendingMoment[i] += singleResponse.bendingMoment[i];
        shearForce[i] += singleResponse.shearForce[i];
        deflection[i] += singleResponse.deflection[i];
      }
    });
  } else {
    // --- Handle Single Point or Distributed Load ---
    const singleResponse = calculateSingleLoadResponse(beamConfig, loadConfig, EI, numPoints, dx);
    for (let i = 0; i <= numPoints; i++) {
        bendingMoment[i] = singleResponse.bendingMoment[i];
        shearForce[i] = singleResponse.shearForce[i];
        deflection[i] = singleResponse.deflection[i];
    }
  }

  return {
    bendingMoment,
    shearForce,
    deflection
  };
};

/**
 * Calculates response for a single load (Point or UDL)
 */
const calculateSingleLoadResponse = (beamConfig, loadConfig, EI, numPoints, dx) => {
  const L = beamConfig.length;
  const bendingMoment = new Array(numPoints + 1).fill(0);
  const shearForce = new Array(numPoints + 1).fill(0);
  const deflection = new Array(numPoints + 1).fill(0);

  // Get absolute position of load in meters
  // For point load, 'a' is the load position.
  // For UDL, 'a' is the start, 'b' is the end.
  let a = 0, b = 0, loadMagnitude = loadConfig.magnitude;
  const loadPositionFraction = loadConfig.position; // Position as fraction (0 to 1)

  if (loadConfig.type === 'point') {
      a = loadPositionFraction * L;
      b = L - a; // Distance from right support
  } else if (loadConfig.type === 'distributed') {
      const width = loadConfig.width || SMALL_NUM; // Ensure width > 0
      const centerPosition = loadPositionFraction * L;
      a = Math.max(0, centerPosition - width / 2); // Start of UDL
      b = Math.min(L, centerPosition + width / 2); // End of UDL
      loadMagnitude = loadConfig.magnitude; // kN/m or force/length
  } else {
      return { bendingMoment, shearForce, deflection }; // No load or unsupported type
  }


  // Calculate based on support type
  switch(beamConfig.supportType) {
    case 'simply-supported':
      calculateSimplySupported(L, a, b, loadMagnitude, loadConfig.type, EI, bendingMoment, shearForce, deflection, numPoints, dx);
      break;
    case 'cantilever': // Fixed at left (x=0)
      calculateCantilever(L, a, b, loadMagnitude, loadConfig.type, EI, bendingMoment, shearForce, deflection, numPoints, dx);
      break;
    case 'fixed-fixed':
      calculateFixedFixed(L, a, b, loadMagnitude, loadConfig.type, EI, bendingMoment, shearForce, deflection, numPoints, dx);
      break;
    case 'fixed-pinned': // Fixed at left (x=0), Pinned at right (x=L)
      calculateFixedPinned(L, a, b, loadMagnitude, loadConfig.type, EI, bendingMoment, shearForce, deflection, numPoints, dx);
      break;
    case 'multi-span':
      // WARNING: Highly simplified approximation. Results are not accurate.
      calculateMultiSpanApprox(beamConfig, loadConfig, EI, bendingMoment, shearForce, deflection, numPoints, dx);
      break;
    default:
      calculateSimplySupported(L, a, b, loadMagnitude, loadConfig.type, EI, bendingMoment, shearForce, deflection, numPoints, dx);
  }

  return { bendingMoment, shearForce, deflection };
}


// --- Calculation Functions for Specific Support Types ---

const calculateSimplySupported = (L, a, b_pos, P_or_w, type, EI, bendingMoment, shearForce, deflection, numPoints, dx) => {
  let R1 = 0, R2 = 0;

  if (type === 'point') {
    const P = P_or_w;
    const b = L - a; // Distance from right support for point load
    R1 = P * b / L;
    R2 = P * a / L;
  } else if (type === 'distributed') {
    const w = P_or_w;
    const start = a;
    const end = b_pos;
    const loadLength = end - start;
    const totalLoad = w * loadLength;
    const loadCenter = start + loadLength / 2;
    R1 = totalLoad * (L - loadCenter) / L;
    R2 = totalLoad * loadCenter / L;
  }

  for (let i = 0; i <= numPoints; i++) {
    const x = i * dx;
    if (type === 'point') {
      const b = L - a; // Recalculate b for point load context
      // Shear
      shearForce[i] = (x < a) ? R1 : -R2;
      // Moment
      bendingMoment[i] = (x < a) ? R1 * x : R2 * (L - x);
      // Deflection (Point Load Formula)
      if (EI > SMALL_NUM) {
          if (x <= a) {
              deflection[i] = (P_or_w * b * x / (6 * EI * L)) * (L*L - b*b - x*x);
          } else {
              deflection[i] = (P_or_w * a * (L - x) / (6 * EI * L)) * (L*L - a*a - (L-x)*(L-x));
          }
      }
    } else if (type === 'distributed') {
        const w = P_or_w;
        const start = a;
        const end = b_pos;
        // Shear
        if (x < start) shearForce[i] = R1;
        else if (x > end) shearForce[i] = -R2;
        else shearForce[i] = R1 - w * (x - start);
        // Moment
        if (x < start) bendingMoment[i] = R1 * x;
        else if (x > end) bendingMoment[i] = R2 * (L - x);
        else bendingMoment[i] = R1 * x - w * (x - start) * (x - start) / 2;
        // Deflection (UDL Formula - Complex, using superposition approx or placeholder)
        // Placeholder - Accurate formula is complex. Could use numerical integration or superposition.
        deflection[i] = 0; // Placeholder
    }
  }
};

const calculateCantilever = (L, a, b_pos, P_or_w, type, EI, bendingMoment, shearForce, deflection, numPoints, dx) => {
  // Fixed at x=0
  let R_fixed = 0, M_fixed = 0;

  if (type === 'point') {
    const P = P_or_w;
    R_fixed = P;
    M_fixed = -P * a; // Moment reaction at fixed end
  } else if (type === 'distributed') {
    const w = P_or_w;
    const start = a;
    const end = b_pos;
    const loadLength = end - start;
    const totalLoad = w * loadLength;
    const loadCenter = start + loadLength / 2;
    R_fixed = totalLoad;
    M_fixed = -totalLoad * loadCenter;
  }

  for (let i = 0; i <= numPoints; i++) {
    const x = i * dx;
    if (type === 'point') {
      const P = P_or_w;
      // Shear
      shearForce[i] = (x < a) ? R_fixed : 0;
      // Moment
      bendingMoment[i] = (x < a) ? M_fixed + R_fixed * x : 0;
      // Deflection (Point Load Formula)
      if (EI > SMALL_NUM) {
          if (x <= a) {
              deflection[i] = (P * x*x / (6 * EI)) * (3*a - x);
          } else {
              deflection[i] = (P * a*a / (6 * EI)) * (3*x - a);
          }
      }
    } else if (type === 'distributed') {
        const w = P_or_w;
        const start = a;
        const end = b_pos;
        // Shear
        if (x < start) shearForce[i] = R_fixed;
        else if (x > end) shearForce[i] = 0;
        else shearForce[i] = R_fixed - w * (x - start);
        // Moment
        if (x < start) bendingMoment[i] = M_fixed + R_fixed * x;
        else if (x > end) bendingMoment[i] = 0;
        else bendingMoment[i] = M_fixed + R_fixed * x - w * (x - start) * (x - start) / 2;
        // Deflection (UDL Formula - Complex)
        deflection[i] = 0; // Placeholder
    }
  }
};

const calculateFixedFixed = (L, a, b_pos, P_or_w, type, EI, bendingMoment, shearForce, deflection, numPoints, dx) => {
  let R1 = 0, R2 = 0, M1 = 0, M2 = 0; // Reactions at x=0 (1) and x=L (2)

  if (type === 'point') {
    const P = P_or_w;
    const b = L - a;
    R1 = P * b*b * (L + 2*a) / (L*L*L);
    R2 = P * a*a * (L + 2*b) / (L*L*L);
    M1 = -P * a * b*b / (L*L);
    M2 = P * b * a*a / (L*L);
  } else if (type === 'distributed') {
    // Formulas for UDL on fixed-fixed are more complex, especially if not full span
    // Approximation for full span UDL:
    const w = P_or_w;
    if (Math.abs(a - 0) < SMALL_NUM && Math.abs(b_pos - L) < SMALL_NUM) { // Full span UDL
        R1 = R2 = w * L / 2;
        M1 = -w * L*L / 12;
        M2 = w * L*L / 12;
    } else {
        // Partial UDL - Use superposition or approximate as point load for simplicity here
        // Fallback to point load approximation at center of UDL
        const width = b_pos - a;
        const P_eq = w * width;
        const center = a + width / 2;
        const b_eq = L - center;
        R1 = P_eq * b_eq*b_eq * (L + 2*center) / (L*L*L);
        R2 = P_eq * center*center * (L + 2*b_eq) / (L*L*L);
        M1 = -P_eq * center * b_eq*b_eq / (L*L);
        M2 = P_eq * b_eq * center*center / (L*L);
    }
  }

  for (let i = 0; i <= numPoints; i++) {
    const x = i * dx;
    if (type === 'point') {
      const P = P_or_w;
      const b = L - a;
      // Shear
      shearForce[i] = (x < a) ? R1 : -R2;
      // Moment
      bendingMoment[i] = (x < a) ? M1 + R1 * x : M2 - R2 * (L - x);
      // Deflection (Point Load Formula)
      if (EI > SMALL_NUM) {
          if (x <= a) {
              deflection[i] = (P * b*b * x*x / (6 * EI * L*L*L)) * (3*a*L - 3*a*x - b*x);
          } else {
              const x_prime = L - x; // Distance from right end
              deflection[i] = (P * a*a * x_prime*x_prime / (6 * EI * L*L*L)) * (3*b*L - 3*b*x_prime - a*x_prime);
          }
      }
    } else if (type === 'distributed') {
        // Using full span UDL formulas for shear/moment as approximation if partial
        const w = P_or_w;
        if (Math.abs(a - 0) < SMALL_NUM && Math.abs(b_pos - L) < SMALL_NUM) { // Full span UDL
            shearForce[i] = R1 - w * x;
            bendingMoment[i] = M1 + R1 * x - w * x*x / 2;
            // Deflection (Full UDL Formula)
            if (EI > SMALL_NUM) {
                deflection[i] = (w * x*x / (24 * EI)) * (L - x)*(L - x);
            }
        } else {
             // Partial UDL - Using the point load approximation reactions
             const width = b_pos - a;
             const center = a + width / 2;
             shearForce[i] = (x < center) ? R1 : -R2; // Approx
             bendingMoment[i] = (x < center) ? M1 + R1 * x : M2 - R2 * (L - x); // Approx
             deflection[i] = 0; // Placeholder for partial UDL deflection
        }
    }
  }
};

const calculateFixedPinned = (L, a, b_pos, P_or_w, type, EI, bendingMoment, shearForce, deflection, numPoints, dx) => {
  // Fixed at x=0, Pinned at x=L
  let R1 = 0, R2 = 0, M1 = 0; // Reactions at x=0 (1, Fixed) and x=L (2, Pinned)

  if (type === 'point') {
    const P = P_or_w;
    const b = L - a;
    M1 = - (P * a * b / (2 * L*L)) * (L + b);
    R1 = (P * b / (2 * L*L*L)) * (3*L*L - b*b); // Corrected formula
    R2 = P - R1;
  } else if (type === 'distributed') {
    // Formulas for UDL on fixed-pinned
    const w = P_or_w;
    if (Math.abs(a - 0) < SMALL_NUM && Math.abs(b_pos - L) < SMALL_NUM) { // Full span UDL
        M1 = -w * L*L / 8;
        R1 = 5 * w * L / 8;
        R2 = 3 * w * L / 8;
    } else {
        // Partial UDL - Complex, use approximation
        // Fallback to point load approximation at center of UDL
        const width = b_pos - a;
        const P_eq = w * width;
        const center = a + width / 2;
        const b_eq = L - center;
        M1 = - (P_eq * center * b_eq / (2 * L*L)) * (L + b_eq);
        R1 = (P_eq * b_eq / (2 * L*L*L)) * (3*L*L - b_eq*b_eq);
        R2 = P_eq - R1;
    }
  }

  for (let i = 0; i <= numPoints; i++) {
    const x = i * dx;
    if (type === 'point') {
      // Shear
      shearForce[i] = (x < a) ? R1 : -R2;
      // Moment
      bendingMoment[i] = (x < a) ? M1 + R1 * x : -R2 * (L - x); // Moment at pinned end is 0
      // Deflection (Point Load Formula - Complex)
      deflection[i] = 0; // Placeholder
    } else if (type === 'distributed') {
        const w = P_or_w;
        if (Math.abs(a - 0) < SMALL_NUM && Math.abs(b_pos - L) < SMALL_NUM) { // Full span UDL
            shearForce[i] = R1 - w * x;
            bendingMoment[i] = M1 + R1 * x - w * x*x / 2;
            // Deflection (Full UDL Formula - Complex)
            deflection[i] = 0; // Placeholder
        } else {
             // Partial UDL - Using the point load approximation reactions
             const width = b_pos - a;
             const center = a + width / 2;
             shearForce[i] = (x < center) ? R1 : -R2; // Approx
             bendingMoment[i] = (x < center) ? M1 + R1 * x : -R2 * (L - x); // Approx
             deflection[i] = 0; // Placeholder for partial UDL deflection
        }
    }
  }
};

const calculateMultiSpanApprox = (beamConfig, loadConfig, EI, bendingMoment, shearForce, deflection, numPoints, dx) => {
  // WARNING: This treats the loaded span as simply supported and ignores continuity.
  // Results are inaccurate for multi-span beams.
  const L = beamConfig.length;
  const numSegments = beamConfig.segments || 1;
  const spanLength = L / numSegments;
  const loadPositionAbsolute = loadConfig.position * L;

  // Determine which span the load is primarily in
  const loadedSpanIndex = Math.min(numSegments - 1, Math.floor(loadPositionAbsolute / spanLength));
  const loadPositionInSpan = loadPositionAbsolute - loadedSpanIndex * spanLength;

  // Calculate response for the isolated simply supported span
  const spanBM = new Array(numPoints + 1).fill(0);
  const spanSF = new Array(numPoints + 1).fill(0);
  const spanDef = new Array(numPoints + 1).fill(0);

  let a_span = 0, b_span = 0;
  if (loadConfig.type === 'point') {
      a_span = loadPositionInSpan;
      b_span = spanLength - a_span;
  } else if (loadConfig.type === 'distributed') {
      const width = loadConfig.width || SMALL_NUM;
      const centerInSpan = loadPositionInSpan;
      a_span = Math.max(0, centerInSpan - width / 2);
      b_span = Math.min(spanLength, centerInSpan + width / 2);
  }

  calculateSimplySupported(spanLength, a_span, b_span, loadConfig.magnitude, loadConfig.type, EI, spanBM, spanSF, spanDef, numPoints, spanLength / numPoints);

  // Map the results of the isolated span onto the full beam array
  const pointsPerSpan = Math.floor(numPoints / numSegments);
  const startPointIndex = loadedSpanIndex * pointsPerSpan;
  const endPointIndex = Math.min(numPoints, startPointIndex + pointsPerSpan);

  for (let i = 0; i <= numPoints; i++) {
      if (i >= startPointIndex && i <= endPointIndex) {
          // Map global index 'i' to local index within the span calculation
          const localFraction = (i - startPointIndex) / pointsPerSpan;
          const localIndex = Math.min(numPoints, Math.round(localFraction * numPoints));

          bendingMoment[i] = spanBM[localIndex];
          shearForce[i] = spanSF[localIndex];
          deflection[i] = spanDef[localIndex];
      } else {
          bendingMoment[i] = 0;
          shearForce[i] = 0;
          deflection[i] = 0;
      }
  }
};