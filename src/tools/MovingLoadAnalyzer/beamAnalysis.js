/**
 * This module provides the structural analysis logic for beam analysis
 */

/**
 * Performs structural analysis of a beam with the given configuration and loading
 * @param {Object} beamConfig - Configuration of the beam
 * @param {Object} loadConfig - Configuration of the load
 * @param {number} numDivisions - Number of points to evaluate along the beam
 * @returns {Object} Analysis results including bending moments, shear forces, and deflections
 */
export const performBeamAnalysis = (beamConfig, loadConfig, numDivisions) => {
  const { length, supportType, segments, EI } = beamConfig;
  const { type, position, magnitude, width } = loadConfig;
  
  // Create an array of nodes along the beam
  const nodes = Array.from({ length: numDivisions }, (_, i) => i / (numDivisions - 1));
  
  // Initialize results arrays
  const bendingMoment = Array(numDivisions).fill(0);
  const shearForce = Array(numDivisions).fill(0);
  const deflection = Array(numDivisions).fill(0);
  
  // Calculate position in absolute coordinates
  const loadPosition = position * length;
  const loadWidth = width * length; // For distributed loads
  
  // Calculate reaction forces based on support type and load
  const reactions = calculateReactions(beamConfig, loadConfig);
  
  // Calculate internal forces at each node
  for (let i = 0; i < numDivisions; i++) {
    const x = nodes[i] * length;
    
    // Calculate effects based on support type
    switch (supportType) {
      case 'simply-supported':
        // For a simply supported beam
        calculateSimplySupported(x, loadPosition, magnitude, type, loadWidth, reactions, i, bendingMoment, shearForce, length);
        break;
        
      case 'cantilever':
        // For a cantilever beam
        calculateCantilever(x, loadPosition, magnitude, type, loadWidth, reactions, i, bendingMoment, shearForce, length);
        break;
        
      case 'fixed-fixed':
        // For a fixed-fixed beam (approximation)
        calculateFixedFixed(x, loadPosition, magnitude, type, loadWidth, reactions, i, bendingMoment, shearForce, length);
        break;
        
      case 'fixed-pinned':
        // For a fixed-pinned beam (approximation)
        calculateFixedPinned(x, loadPosition, magnitude, type, loadWidth, reactions, i, bendingMoment, shearForce, length);
        break;
        
      case 'multi-span':
        // For a multi-span beam (approximation)
        calculateMultiSpan(x, loadPosition, magnitude, type, loadWidth, reactions, i, bendingMoment, shearForce, length, segments);
        break;
        
      default:
        // Default to simply supported
        calculateSimplySupported(x, loadPosition, magnitude, type, loadWidth, reactions, i, bendingMoment, shearForce, length);
    }
  }
  
  // Calculate deflections (approximate method)
  calculateDeflections(bendingMoment, deflection, length, numDivisions, EI, supportType);
  
  return {
    bendingMoment,
    shearForce,
    deflection,
    reactionForces: reactions,
  };
};

/**
 * Calculates reaction forces for the beam
 */
const calculateReactions = (beamConfig, loadConfig) => {
  const { length, supportType, segments } = beamConfig;
  const { type, position, magnitude, width } = loadConfig;
  
  // Initialize reactions
  const reactions = {
    left: 0,
    right: 0,
    intermediate: [], // For multi-span beams
  };
  
  // Load position in absolute coordinates
  const loadPosition = position * length;
  const loadWidth = width * length; // For distributed loads
  
  // Calculate reactions based on support type
  switch (supportType) {
    case 'simply-supported':
      if (type === 'point') {
        // For point load on simply supported beam
        reactions.right = magnitude * (loadPosition / length);
        reactions.left = magnitude - reactions.right;
      } else if (type === 'distributed') {
        // For distributed load
        const totalLoad = magnitude * loadWidth;
        const loadCenter = loadPosition; // Center of the distributed load
        
        reactions.right = totalLoad * (loadCenter / length);
        reactions.left = totalLoad - reactions.right;
      } else if (type === 'train') {
        // For train load (simplified as point load for now)
        reactions.right = magnitude * (loadPosition / length);
        reactions.left = magnitude - reactions.right;
      }
      break;
      
    case 'cantilever':
      // For cantilever beam (fixed at left, free at right)
      if (type === 'point') {
        reactions.left = magnitude;
      } else if (type === 'distributed') {
        const totalLoad = magnitude * loadWidth;
        reactions.left = totalLoad;
      } else if (type === 'train') {
        reactions.left = magnitude;
      }
      break;
      
    case 'fixed-fixed':
      // Simplified approximation for fixed-fixed beam
      if (type === 'point') {
        reactions.left = reactions.right = magnitude / 2;
      } else if (type === 'distributed') {
        const totalLoad = magnitude * loadWidth;
        reactions.left = reactions.right = totalLoad / 2;
      }
      break;
      
    case 'fixed-pinned':
      // Simplified approximation for fixed-pinned beam
      if (type === 'point') {
        reactions.right = magnitude * (loadPosition / length);
        reactions.left = magnitude - reactions.right;
      } else if (type === 'distributed') {
        const totalLoad = magnitude * loadWidth;
        const loadCenter = loadPosition;
        
        reactions.right = totalLoad * (loadCenter / length);
        reactions.left = totalLoad - reactions.right;
      }
      break;
      
    case 'multi-span':
      // Highly simplified for multi-span (would need matrix methods for accuracy)
      if (type === 'point') {
        const spanLength = length / segments;
        const spanIndex = Math.floor(loadPosition / spanLength);
        const localPosition = loadPosition - spanIndex * spanLength;
        
        if (spanIndex < segments) {
          reactions.left = magnitude * (1 - localPosition / spanLength);
          reactions.right = magnitude * (localPosition / spanLength);
        }
      } else if (type === 'distributed') {
        const totalLoad = magnitude * loadWidth;
        reactions.left = reactions.right = totalLoad / 2;
      }
      break;
      
    default:
      // Default to simply supported
      if (type === 'point') {
        reactions.right = magnitude * (loadPosition / length);
        reactions.left = magnitude - reactions.right;
      } else if (type === 'distributed') {
        const totalLoad = magnitude * loadWidth;
        const loadCenter = loadPosition;
        
        reactions.right = totalLoad * (loadCenter / length);
        reactions.left = totalLoad - reactions.right;
      }
  }
  
  return reactions;
};

/**
 * Calculate internal forces for simply supported beam
 */
const calculateSimplySupported = (x, loadPosition, magnitude, type, loadWidth, reactions, i, bendingMoment, shearForce, length) => {
  // Shear force
  if (x < loadPosition && type === 'point') {
    shearForce[i] = reactions.left;
  } else if (x > loadPosition && type === 'point') {
    shearForce[i] = -reactions.right;
  } else if (type === 'distributed') {
    const startPos = loadPosition - loadWidth / 2;
    const endPos = loadPosition + loadWidth / 2;
    
    if (x < startPos) {
      shearForce[i] = reactions.left;
    } else if (x > endPos) {
      shearForce[i] = -reactions.right;
    } else {
      // Within distributed load - linear change in shear
      const distFromStart = x - startPos;
      shearForce[i] = reactions.left - magnitude * distFromStart;
    }
  }
  
  // Bending moment
  if (type === 'point') {
    if (x < loadPosition) {
      bendingMoment[i] = reactions.left * x;
    } else {
      bendingMoment[i] = reactions.right * (length - x);
    }
  } else if (type === 'distributed') {
    const startPos = loadPosition - loadWidth / 2;
    const endPos = loadPosition + loadWidth / 2;
    
    if (x < startPos) {
      bendingMoment[i] = reactions.left * x;
    } else if (x > endPos) {
      bendingMoment[i] = reactions.right * (length - x);
    } else {
      // Within distributed load
      const distFromStart = x - startPos;
      bendingMoment[i] = reactions.left * x - magnitude * distFromStart * distFromStart / 2;
    }
  }
};

/**
 * Calculate internal forces for cantilever beam
 */
const calculateCantilever = (x, loadPosition, magnitude, type, loadWidth, reactions, i, bendingMoment, shearForce, length) => {
  // For cantilever fixed at left end
  if (type === 'point') {
    if (x < loadPosition) {
      shearForce[i] = 0;
      bendingMoment[i] = 0;
    } else {
      shearForce[i] = -magnitude;
      bendingMoment[i] = -magnitude * (x - loadPosition);
    }
  } else if (type === 'distributed') {
    const startPos = loadPosition - loadWidth / 2;
    const endPos = loadPosition + loadWidth / 2;
    
    if (x < startPos) {
      shearForce[i] = 0;
      bendingMoment[i] = 0;
    } else if (x > endPos) {
      const totalLoad = magnitude * loadWidth;
      shearForce[i] = -totalLoad;
      bendingMoment[i] = -totalLoad * (x - (startPos + endPos) / 2);
    } else {
      const distFromStart = x - startPos;
      const partialLoad = magnitude * distFromStart;
      shearForce[i] = -partialLoad;
      bendingMoment[i] = -partialLoad * distFromStart / 2;
    }
  }
};

/**
 * Calculate internal forces for fixed-fixed beam (approximation)
 */
const calculateFixedFixed = (x, loadPosition, magnitude, type, loadWidth, reactions, i, bendingMoment, shearForce, length) => {
  // Simplified formula for fixed-fixed beam with point load
  if (type === 'point') {
    const a = loadPosition;
    const b = length - a;
    
    if (x < loadPosition) {
      shearForce[i] = reactions.left - magnitude * b * b * (b + 3 * a) / (length * length * length);
      bendingMoment[i] = reactions.left * x - magnitude * a * b * b * x / (length * length * length);
    } else {
      shearForce[i] = -reactions.right + magnitude * a * a * (a + 3 * b) / (length * length * length);
      bendingMoment[i] = reactions.right * (length - x) - magnitude * a * a * b * (length - x) / (length * length * length);
    }
  } else {
    // Simplified approximation for distributed load
    calculateSimplySupported(x, loadPosition, magnitude, type, loadWidth, reactions, i, bendingMoment, shearForce, length);
  }
};

/**
 * Calculate internal forces for fixed-pinned beam (approximation)
 */
const calculateFixedPinned = (x, loadPosition, magnitude, type, loadWidth, reactions, i, bendingMoment, shearForce, length) => {
  // Simplified approximation - fallback to simply supported for now
  calculateSimplySupported(x, loadPosition, magnitude, type, loadWidth, reactions, i, bendingMoment, shearForce, length);
};

/**
 * Calculate internal forces for multi-span beam (approximation)
 */
const calculateMultiSpan = (x, loadPosition, magnitude, type, loadWidth, reactions, i, bendingMoment, shearForce, length, segments) => {
  // Simplified approximation - treat as a series of simply supported spans
  const spanLength = length / segments;
  const spanIndex = Math.floor(x / spanLength);
  const localX = x - spanIndex * spanLength;
  
  // Simplified approach for multi-span
  calculateSimplySupported(localX, loadPosition % spanLength, magnitude, type, loadWidth, reactions, i, bendingMoment, shearForce, spanLength);
};

/**
 * Calculate beam deflections using approximate integration of moment diagram
 */
const calculateDeflections = (bendingMoment, deflection, length, numDivisions, EI, supportType) => {
  // This is a simplified approach using numerical integration
  // For accurate results, we should use finite element analysis
  
  const dx = length / (numDivisions - 1);
  
  // Double integration of M/EI
  const curvature = bendingMoment.map(m => m / EI);
  
  // First integration to get slope
  const slope = Array(numDivisions).fill(0);
  for (let i = 1; i < numDivisions; i++) {
    slope[i] = slope[i-1] + (curvature[i-1] + curvature[i]) / 2 * dx;
  }
  
  // Adjust slope to satisfy boundary conditions
  let slopeAdjustment = 0;
  
  if (supportType === 'simply-supported') {
    slopeAdjustment = (slope[numDivisions-1] - slope[0]) / (numDivisions - 1);
  } else if (supportType === 'cantilever') {
    slopeAdjustment = slope[0];
  } else if (supportType === 'fixed-fixed' || supportType === 'fixed-pinned') {
    slopeAdjustment = slope[0];
  }
  
  // Apply slope adjustment
  for (let i = 0; i < numDivisions; i++) {
    slope[i] -= slopeAdjustment;
  }
  
  // Second integration to get deflection
  for (let i = 1; i < numDivisions; i++) {
    deflection[i] = deflection[i-1] + (slope[i-1] + slope[i]) / 2 * dx;
  }
  
  // Adjust deflection to satisfy boundary conditions
  let deflectionAdjustment = 0;
  
  if (supportType === 'simply-supported') {
    deflectionAdjustment = (deflection[0] + deflection[numDivisions-1]) / 2;
  } else if (supportType === 'cantilever') {
    deflectionAdjustment = deflection[0];
  } else if (supportType === 'fixed-fixed') {
    deflectionAdjustment = deflection[0];
  } else if (supportType === 'fixed-pinned') {
    deflectionAdjustment = deflection[0];
  }
  
  // Apply deflection adjustment
  for (let i = 0; i < numDivisions; i++) {
    deflection[i] -= deflectionAdjustment;
  }
};

/**
 * Calculate influence line for a specific position on the beam
 */
export const calculateInfluenceLine = (beamConfig, influencePosition, numDivisions) => {
  const { length, supportType } = beamConfig;
  const influencePoint = influencePosition * length;
  
  // Initialize influence line array
  const influenceLine = Array(numDivisions).fill(0);
  
  for (let i = 0; i < numDivisions; i++) {
    const loadPosition = i / (numDivisions - 1);
    
    // Create a unit point load
    const unitLoadConfig = {
      type: 'point',
      position: loadPosition,
      magnitude: 1,
      width: 0, // Not relevant for point load
    };
    
    // Calculate beam response to this unit load
    const analysis = performBeamAnalysis(beamConfig, unitLoadConfig, numDivisions);
    
    // Find the index closest to our influence point
    const influenceIndex = Math.round(influencePosition * (numDivisions - 1));
    
    // Store the bending moment at the influence point
    // Note: You might want to add an option to choose between moment, shear, or deflection influence lines
    if (influenceIndex >= 0 && influenceIndex < numDivisions) {
      influenceLine[i] = analysis.bendingMoment[influenceIndex];
    } else {
      influenceLine[i] = 0; // Handle edge cases
    }
  }
  
  return influenceLine;
};
