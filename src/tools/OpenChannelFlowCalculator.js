import React, { useState } from 'react';
import './OpenChannelFlowCalculator.css';
import { Chart } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend } from 'chart.js';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend);

const OpenChannelFlowCalculator = () => {
  // State management
  const [channelType, setChannelType] = useState('rectangular');
  const [equationType, setEquationType] = useState('manning');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [sortField, setSortField] = useState('id');
  const [sortOrder, setSortOrder] = useState('asc');
  const [calculationInputs, setCalculationInputs] = useState({
    discharge: 5.0, // m³/s
    slope: 0.01, // dimensionless (m/m)
    bottomWidth: 2.0, // m (rectangular, trapezoidal)
    sideSlope: 1.5, // m/m (horizontal:vertical for trapezoidal, triangular)
    diameter: 1.0, // m (circular)
    manningsN: 0.013, // concrete
    chezyC: 60, // m^(1/2)/s
    depth: 1.0, // m (used when not solving for depth)
    solveFor: 'depth', // 'depth', 'velocity', 'slope', 'discharge', 'critical_depth'
  });
  const [calculationResults, setCalculationResults] = useState(null);
  const [loading, setLoading] = useState(false);

  // Channel configurations
  const channelData = {
    rectangular: {
      name: 'Rectangular Channels',
      configurations: [
        {
          id: 'REC-001',
          bottomWidth: 2.0,
          manningsN: 0.013, // Smooth concrete
          chezyC: 60,
          slope: 0.01,
          material: 'Concrete',
        },
        {
          id: 'REC-002',
          bottomWidth: 3.0,
          manningsN: 0.030, // Natural earth
          chezyC: 40,
          slope: 0.005,
          material: 'Earth',
        },
      ],
    },
    trapezoidal: {
      name: 'Trapezoidal Channels',
      configurations: [
        {
          id: 'TRP-001',
          bottomWidth: 2.5,
          sideSlope: 1.5, // 1.5H:1V
          manningsN: 0.015, // Finished concrete
          chezyC: 55,
          slope: 0.008,
          material: 'Concrete',
        },
        {
          id: 'TRP-002',
          bottomWidth: 4.0,
          sideSlope: 2.0,
          manningsN: 0.025, // Grass-lined
          chezyC: 45,
          slope: 0.004,
          material: 'Grass',
        },
      ],
    },
    triangular: {
      name: 'Triangular Channels',
      configurations: [
        {
          id: 'TRI-001',
          sideSlope: 2.0, // 2H:1V
          manningsN: 0.013,
          chezyC: 60,
          slope: 0.01,
          material: 'Concrete',
        },
        {
          id: 'TRI-002',
          sideSlope: 3.0,
          manningsN: 0.035, // Vegetated
          chezyC: 35,
          slope: 0.003,
          material: 'Vegetated',
        },
      ],
    },
    circular: {
      name: 'Circular Channels (Pipes)',
      configurations: [
        {
          id: 'CIR-001',
          diameter: 1.0, // m
          manningsN: 0.013, // Concrete pipe
          chezyC: 60,
          slope: 0.005,
          material: 'Concrete Pipe',
        },
        {
          id: 'CIR-002',
          diameter: 0.5, // m
          manningsN: 0.011, // PVC pipe
          chezyC: 65, // Smoother
          slope: 0.01,
          material: 'PVC Pipe',
        },
      ],
    },
  };

  // Material properties (Manning's n and Chezy's C)
  const materialProperties = {
    Concrete: { manningsN: 0.013, chezyC: 60 },
    'Finished Concrete': { manningsN: 0.015, chezyC: 55 },
    Earth: { manningsN: 0.030, chezyC: 40 },
    Grass: { manningsN: 0.025, chezyC: 45 },
    Vegetated: { manningsN: 0.035, chezyC: 35 },
    'Concrete Pipe': { manningsN: 0.013, chezyC: 60 },
    'PVC Pipe': { manningsN: 0.011, chezyC: 65 },
    // Add more materials as needed
  };

  // Calculate channel geometry
  const calculateGeometry = (depth, inputs, currentChannelType = channelType) => {
    const { bottomWidth, sideSlope, diameter } = inputs;
    let area, wettedPerimeter, topWidth, hydraulicRadius;

    if (depth <= 0) { // Prevent issues with zero or negative depth
        return { area: 0, wettedPerimeter: 0, hydraulicRadius: 0, topWidth: 0 };
    }

    if (currentChannelType === 'rectangular') {
      area = bottomWidth * depth;
      wettedPerimeter = bottomWidth + 2 * depth;
      topWidth = bottomWidth;
    } else if (currentChannelType === 'trapezoidal') {
      area = (bottomWidth + sideSlope * depth) * depth;
      wettedPerimeter = bottomWidth + 2 * depth * Math.sqrt(1 + sideSlope ** 2);
      topWidth = bottomWidth + 2 * sideSlope * depth;
    } else if (currentChannelType === 'triangular') {
      area = sideSlope * depth ** 2;
      wettedPerimeter = 2 * depth * Math.sqrt(1 + sideSlope ** 2);
      topWidth = 2 * sideSlope * depth;
    } else if (currentChannelType === 'circular') {
      if (depth >= diameter) { // Full or overfull (treat as full for open channel approx)
        area = Math.PI * (diameter / 2) ** 2;
        wettedPerimeter = Math.PI * diameter;
        topWidth = 0; // Or diameter if considering the very top surface, but for Fr, 0 is more common for closed conduit
      } else {
        const r = diameter / 2;
        const theta = 2 * Math.acos((r - depth) / r); // Angle in radians
        area = r ** 2 * (theta - Math.sin(theta)) / 2;
        wettedPerimeter = r * theta;
        topWidth = 2 * Math.sqrt(depth * (diameter - depth)); // 2 * r * sin(theta/2)
      }
    }

    hydraulicRadius = wettedPerimeter > 0 ? area / wettedPerimeter : 0;
    return { area, wettedPerimeter, hydraulicRadius, topWidth };
  };

  // Manning's and Chezy's equations
  const calculateVelocity = (depth, inputs, currentChannelType = channelType, currentEquationType = equationType) => {
    const { manningsN, chezyC, slope } = inputs;
    const { hydraulicRadius } = calculateGeometry(depth, inputs, currentChannelType);

    if (hydraulicRadius <= 0 || slope <= 0) return 0; // Avoid division by zero or sqrt of negative

    if (currentEquationType === 'manning') {
      if (manningsN <= 0) return 0;
      return (1 / manningsN) * hydraulicRadius ** (2 / 3) * slope ** 0.5;
    } else { // Chezy
      if (chezyC <= 0) return 0;
      return chezyC * Math.sqrt(hydraulicRadius * slope);
    }
  };

  // Solve for normal depth using Newton-Raphson
  const solveNormalDepth = (inputs, maxIterations = 100, tolerance = 1e-6) => {
    const { discharge } = inputs;
    // Initial guess for depth, can be refined based on channel type
    let depth;
    if (channelType === 'circular') depth = inputs.diameter * 0.5;
    else if (channelType === 'rectangular') depth = Math.pow( (discharge * inputs.manningsN) / (inputs.bottomWidth * Math.sqrt(inputs.slope) ), 3/5 ) || 1.0; // Approx for wide rect channel
    else depth = 1.0;


    let iteration = 0;

    while (iteration < maxIterations) {
      const { area } = calculateGeometry(depth, inputs);
      const velocity = calculateVelocity(depth, inputs);
      const computedDischarge = area * velocity;

      const f = computedDischarge - discharge; // Objective function

      if (Math.abs(f) < tolerance) {
        return depth > 0 ? depth : null;
      }

      // Approximate derivative df/dy using central difference for better stability
      const delta = 0.0001 * depth + 1e-7; // Relative delta
      const { area: area_p } = calculateGeometry(depth + delta, inputs);
      const vel_p = calculateVelocity(depth + delta, inputs);
      const Q_p = area_p * vel_p;

      const { area: area_m } = calculateGeometry(depth - delta, inputs);
      const vel_m = calculateVelocity(depth - delta, inputs);
      const Q_m = area_m * vel_m;
      
      const df = (Q_p - Q_m) / (2 * delta);


      if (Math.abs(df) < 1e-9) { // Derivative too small, likely flat or no solution with current guess
          // Try a small perturbation or return null if stuck
          depth = depth + (Math.random() - 0.5) * 0.1 * depth; // Small random jump
          if (depth <=0) depth = 0.01; // Reset to small positive
          iteration++;
          if(iteration > maxIterations -10) return null; // Give up if stuck near end
          continue;
      }

      let newDepth = depth - f / df;

      // Damping factor and bounds for stability
      const damping = 0.7;
      newDepth = depth + damping * (newDepth - depth);


      if (channelType === 'circular' && newDepth > inputs.diameter) {
        newDepth = inputs.diameter - delta; // Keep within diameter for open channel
      }
      if (newDepth <= 0) {
        newDepth = depth / 2 + 1e-6; // Prevent non-positive depth, try to recover
      }
      
      if (Math.abs(newDepth - depth) < tolerance && Math.abs(f) < tolerance * 10) { // Relax f tolerance if depth change is small
        return newDepth > 0 ? newDepth : null;
      }

      depth = newDepth;
      iteration++;
    }
    console.warn("Normal depth solver did not converge within max iterations.");
    return null; // No convergence
  };

  // Solve for critical depth
  const solveCriticalDepth = (inputs, maxIterations = 100, tolerance = 1e-6) => {
    const { discharge, bottomWidth, sideSlope, diameter } = inputs;
    const gravity = 9.81;

    // Direct solutions for simpler shapes
    if (channelType === 'rectangular') {
        if (bottomWidth <= 0) return null;
        const q_crit = discharge / bottomWidth;
        return Math.pow(q_crit ** 2 / gravity, 1 / 3);
    }
    if (channelType === 'triangular') {
        if (sideSlope <= 0) return null;
        return Math.pow(2 * discharge ** 2 / (gravity * sideSlope ** 2), 1 / 5);
    }

    // Iterative solution for trapezoidal and circular
    let yc = (channelType === 'circular' ? diameter * 0.5 : 1.0); // Initial guess
    let iteration = 0;

    while (iteration < maxIterations) {
      const { area, topWidth } = calculateGeometry(yc, inputs);
      if (area <= 0 || topWidth <=0) { // Invalid geometry for critical depth calc
          yc = yc / 2 + 1e-6; // try smaller depth
          iteration++;
          continue;
      }
      
      const f = (discharge ** 2 * topWidth) / (gravity * area ** 3) - 1; // Objective function Fr^2 - 1 = 0

      if (Math.abs(f) < tolerance) {
        return yc > 0 ? yc : null;
      }

      // Approximate derivative df/dyc
      const delta = 0.0001 * yc + 1e-7;
      const { area: area_p, topWidth: topWidth_p } = calculateGeometry(yc + delta, inputs);
      const f_p = (area_p > 0 && topWidth_p > 0) ? (discharge ** 2 * topWidth_p) / (gravity * area_p ** 3) - 1 : f + 1; // Avoid division by zero

      const { area: area_m, topWidth: topWidth_m } = calculateGeometry(yc - delta, inputs);
      const f_m = (area_m > 0 && topWidth_m > 0) ? (discharge ** 2 * topWidth_m) / (gravity * area_m ** 3) - 1 : f - 1; // Avoid division by zero

      const df = (f_p - f_m) / (2 * delta);

      if (Math.abs(df) < 1e-9) {
          yc = yc + (Math.random() - 0.5) * 0.1 * yc; 
          if (yc <=0) yc = 0.01;
          iteration++;
          if(iteration > maxIterations -10) return null;
          continue;
      }
      
      let newYc = yc - f / df;
      const damping = 0.7;
      newYc = yc + damping * (newYc - yc);

      if (channelType === 'circular' && newYc > diameter) {
        newYc = diameter - delta;
      }
      if (newYc <= 0) {
        newYc = yc / 2 + 1e-6;
      }
      
      if (Math.abs(newYc - yc) < tolerance && Math.abs(f) < tolerance * 10) {
        return newYc > 0 ? newYc : null;
      }
      yc = newYc;
      iteration++;
    }
    console.warn("Critical depth solver did not converge.");
    return null;
  };


  // Main calculation function
  const calculateFlowParameters = (currentSelectedChannel, currentInputs) => {
    const { discharge: inputDischarge, slope: inputSlope, depth: inputDepth, solveFor } = currentInputs;
    const gravity = 9.81; // m/s²
    let Q = inputDischarge, S = inputSlope, y = inputDepth;
    let V, A, R, T, Fr, flowRegime, yc, E_spec;
    let calculatedNormalDepth, calculatedCriticalDepth, calculatedVelocity, calculatedDischarge, calculatedSlope;


    const geomInputs = { // Consolidate geometry inputs
        bottomWidth: currentSelectedChannel.bottomWidth || currentInputs.bottomWidth,
        sideSlope: currentSelectedChannel.sideSlope || currentInputs.sideSlope,
        diameter: currentSelectedChannel.diameter || currentInputs.diameter,
        manningsN: currentSelectedChannel.manningsN || currentInputs.manningsN,
        chezyC: currentSelectedChannel.chezyC || currentInputs.chezyC,
        slope: S, // Use current slope for velocity calc if needed
        discharge: Q, // Use current discharge for depth calc if needed
    };

    if (solveFor === 'depth') {
      y = solveNormalDepth(geomInputs);
      if (y === null) throw new Error('Failed to converge on normal depth. Check inputs or channel geometry.');
      calculatedNormalDepth = y;
    } else { // If not solving for depth, use the provided or default depth for other calculations
      y = inputDepth; // This is the 'current' depth for calculations
      calculatedNormalDepth = solveNormalDepth(geomInputs); // Still calculate normal depth for comparison
    }
    
    // Calculate geometry and velocity with the determined or given depth 'y'
    const geom = calculateGeometry(y, geomInputs);
    A = geom.area;
    R = geom.hydraulicRadius;
    T = geom.topWidth;
    V = calculateVelocity(y, geomInputs);


    if (solveFor === 'velocity') {
      if (A > 0) V = Q / A; else V = 0;
      calculatedVelocity = V;
    } else {
      calculatedVelocity = V; // Already calculated based on y
    }
    
    if (solveFor === 'discharge') {
      Q = A * V;
      calculatedDischarge = Q;
    } else {
      calculatedDischarge = A * V; // This is the discharge for the current y
    }

    if (solveFor === 'slope') {
      if (R > 0 && V > 0) {
        if (equationType === 'manning') {
          S = ((V * geomInputs.manningsN) / (R ** (2 / 3))) ** 2;
        } else { // Chezy
          S = (V / geomInputs.chezyC) ** 2 / R;
        }
      } else {
        S = 0;
      }
      calculatedSlope = S;
    } else {
      calculatedSlope = inputSlope; // Use the input slope
    }
    
    // Update Q for critical depth calculation if it was solved for
    const Q_for_crit = (solveFor === 'discharge') ? calculatedDischarge : inputDischarge;
    yc = solveCriticalDepth({...geomInputs, discharge: Q_for_crit });
    calculatedCriticalDepth = yc;

    if (A > 0 && T > 0) {
      Fr = V / Math.sqrt(gravity * A / T);
    } else {
      Fr = 0;
    }
    
    if (yc !== null && y !== null) {
        if (Math.abs(y - yc) < 1e-3) flowRegime = 'Critical';
        else if (y > yc) flowRegime = 'Subcritical';
        else flowRegime = 'Supercritical';
    } else {
        flowRegime = Fr < 1 ? 'Subcritical' : Fr > 1 ? 'Supercritical' : 'Critical'; // Fallback to Fr
    }

    E_spec = y + V ** 2 / (2 * gravity);

    return {
      normalDepth: calculatedNormalDepth, // Actual normal depth for given Q, S
      criticalDepth: calculatedCriticalDepth,
      currentDepth: y, // The depth used for the main set of calculations (either solved normal or input)
      velocity: V,
      discharge: (solveFor === 'discharge') ? calculatedDischarge : Q, // Q used for calculations
      slope: (solveFor === 'slope') ? calculatedSlope : S, // S used for calculations
      area: A,
      hydraulicRadius: R,
      topWidth: T,
      froudeNumber: Fr,
      flowRegime,
      specificEnergy: E_spec,
    };
  };

  // Handle input changes
  const handleCalculationInputChange = (field, value) => {
    let parsedValue = parseFloat(value);
    if (isNaN(parsedValue) && field !== 'solveFor') { // Allow solveFor to be string
        // Potentially keep the string if user is typing, or clear/default
        // For now, let's assume direct parsing or it's a controlled component
        // that handles intermediate states.
        // If value is empty string, it might become NaN.
        // Let's allow empty strings to clear the field, then handle NaN before calculation.
        if (value === "") {
            parsedValue = ""; // Keep empty string to allow clearing field
        } else {
            return; // Or handle invalid input more gracefully
        }
    }

    setCalculationInputs(prev => ({
      ...prev,
      [field]: field === 'solveFor' ? value : (parsedValue === "" ? "" : parsedValue),
    }));
  };

  // Perform calculations
  const performCalculations = () => {
    if (!selectedChannel) {
        setCalculationResults({ error: "No channel selected." });
        return;
    }

    setLoading(true);
    setCalculationResults(null); // Clear previous results

    // Validate inputs before attempting calculation
    const currentInputs = { ...calculationInputs };
    for (const key in currentInputs) {
        if (key !== 'solveFor' && (currentInputs[key] === "" || isNaN(parseFloat(currentInputs[key])))) {
            if ( (key === 'depth' && currentInputs.solveFor === 'depth') ||
                 (key === 'discharge' && currentInputs.solveFor === 'discharge') ||
                 (key === 'slope' && currentInputs.solveFor === 'slope') ) {
                // These are fine if they are being solved for
            } else if ( (key === 'bottomWidth' && channelType === 'triangular') ||
                        (key === 'bottomWidth' && channelType === 'circular') ||
                        (key === 'sideSlope' && channelType === 'rectangular') ||
                        (key === 'sideSlope' && channelType === 'circular') ||
                        (key === 'diameter' && channelType !== 'circular')
            ) {
                // These are fine if not applicable to channel type
            }
            else {
                 setCalculationResults({ error: `Invalid or missing input for ${key}.` });
                 setLoading(false);
                 return;
            }
        }
    }


    try {
      const effectiveInputs = {
        ...calculationInputs,
        // Ensure that n and C values are from the selected channel's material,
        // not potentially stale values in calculationInputs state if material was just changed.
        manningsN: materialProperties[selectedChannel.material]?.manningsN || calculationInputs.manningsN,
        chezyC: materialProperties[selectedChannel.material]?.chezyC || calculationInputs.chezyC,
        // Pass all relevant geometric params from selectedChannel if they exist,
        // otherwise, use what's in calculationInputs (for manual override or if not in selectedChannel)
        bottomWidth: selectedChannel.bottomWidth !== undefined ? selectedChannel.bottomWidth : calculationInputs.bottomWidth,
        sideSlope: selectedChannel.sideSlope !== undefined ? selectedChannel.sideSlope : calculationInputs.sideSlope,
        diameter: selectedChannel.diameter !== undefined ? selectedChannel.diameter : calculationInputs.diameter,
      };
      
      const results = calculateFlowParameters(selectedChannel, effectiveInputs);
      setCalculationResults(results);
    } catch (error) {
      console.error('Calculation error:', error);
      setCalculationResults({ error: error.message || "An unexpected error occurred during calculation." });
    } finally {
      setLoading(false);
    }
  };

  // Format property values
  const formatProperty = (value, property) => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'number') {
      if (['normalDepth', 'criticalDepth', 'currentDepth', 'bottomWidth', 'sideSlope', 'diameter', 'hydraulicRadius', 'topWidth'].includes(property)) {
        return `${value.toFixed(3)} m`;
      } else if (property === 'velocity') {
        return `${value.toFixed(3)} m/s`;
      } else if (property === 'discharge') {
        return `${value.toFixed(3)} m³/s`;
      } else if (property === 'slope') {
        return `${(value * 1000).toFixed(3)} mm/m (or ${value.toFixed(5)} m/m)`;
      } else if (property === 'area') {
        return `${value.toFixed(3)} m²`;
      } else if (property === 'froudeNumber' || property === 'specificEnergy') {
        return value.toFixed(3);
      } else if (property === 'manningsN') {
        return value.toFixed(4); // Manning's n usually to 3-4 decimal places
      } else if (property === 'chezyC') {
        return `${value.toFixed(1)} m^(1/2)/s`;
      }
      return value.toFixed(3); // Default numeric formatting
    }
    return value; // Return as is for strings (like flowRegime)
  };

  // Handle channel selection
  const handleChannelSelect = channel => {
    setSelectedChannel(channel);
    // Update calculationInputs with the selected channel's properties
    // to pre-fill the form, but allow user overrides.
    setCalculationInputs(prev => ({
        ...prev, // Keep existing solveFor, discharge, slope, depth if user set them
        bottomWidth: channel.bottomWidth !== undefined ? channel.bottomWidth : prev.bottomWidth,
        sideSlope: channel.sideSlope !== undefined ? channel.sideSlope : prev.sideSlope,
        diameter: channel.diameter !== undefined ? channel.diameter : prev.diameter,
        manningsN: materialProperties[channel.material]?.manningsN || prev.manningsN,
        chezyC: materialProperties[channel.material]?.chezyC || prev.chezyC,
        // Optionally reset slope from channel if not solving for it
        // slope: prev.solveFor === 'slope' ? prev.slope : channel.slope,
    }));
    setCalculationResults(null); // Clear previous results
  };

  // Handle sort
  const handleSort = field => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Get sorted channels
  const getSortedChannels = () => {
    const channels = [...channelData[channelType].configurations];
    return channels.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      if (typeof aValue === 'number') {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }
      return sortOrder === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    });
  };

  // Filter channels
  const filteredChannels = getSortedChannels().filter(
    channel =>
      channel.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      channel.material.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Chart data for velocity vs. depth
  const getVelocityDepthChartData = () => {
    if (!calculationResults || !selectedChannel) return null;

    const maxDepth = channelType === 'circular' ? (calculationInputs.diameter || 1.0) : (calculationResults.normalDepth ? calculationResults.normalDepth * 2 : 2.0);
    const numPoints = 20;
    const depths = Array.from({ length: numPoints + 1 }, (_, i) => (maxDepth / numPoints) * i).filter(d => d > 1e-3);


    const chartInputs = {
      ...calculationInputs,
      manningsN: materialProperties[selectedChannel.material]?.manningsN || calculationInputs.manningsN,
      chezyC: materialProperties[selectedChannel.material]?.chezyC || calculationInputs.chezyC,
      bottomWidth: selectedChannel.bottomWidth !== undefined ? selectedChannel.bottomWidth : calculationInputs.bottomWidth,
      sideSlope: selectedChannel.sideSlope !== undefined ? selectedChannel.sideSlope : calculationInputs.sideSlope,
      diameter: selectedChannel.diameter !== undefined ? selectedChannel.diameter : calculationInputs.diameter,
      // slope is taken from calculationInputs for this chart
    };

    const velocities = depths.map(depth => {
      // We need to calculate velocity based on the fixed slope from inputs, not solve for normal depth again.
      return calculateVelocity(depth, chartInputs, channelType, equationType);
    });

    return {
      labels: depths.map(d => d.toFixed(2)),
      datasets: [
        {
          label: 'Velocity (m/s)',
          data: velocities,
          borderColor: '#64ffda',
          backgroundColor: 'rgba(100, 255, 218, 0.1)',
          fill: false,
          tension: 0.1,
        },
      ],
    };
  };

  // Chart data for discharge vs. slope
  const getDischargeSlopeChartData = () => {
    if (!calculationResults || !selectedChannel) return null;

    const baseSlope = calculationInputs.slope || 0.01;
    const slopeMultipliers = [0.1, 0.5, 1, 2, 5, 10];
    const slopes = slopeMultipliers.map(m => Math.max(1e-6, baseSlope * m)).sort((a,b) => a-b); // Ensure positive and sorted slopes

    const chartInputsBase = {
        ...calculationInputs,
        manningsN: materialProperties[selectedChannel.material]?.manningsN || calculationInputs.manningsN,
        chezyC: materialProperties[selectedChannel.material]?.chezyC || calculationInputs.chezyC,
        bottomWidth: selectedChannel.bottomWidth !== undefined ? selectedChannel.bottomWidth : calculationInputs.bottomWidth,
        sideSlope: selectedChannel.sideSlope !== undefined ? selectedChannel.sideSlope : calculationInputs.sideSlope,
        diameter: selectedChannel.diameter !== undefined ? selectedChannel.diameter : calculationInputs.diameter,
        // Use the 'currentDepth' from results (which is normal depth if solved for, or input depth)
        // This makes the chart show Q vs S for a *fixed depth*.
        // If you want Q vs S where depth is always normal depth for that S, the calculation is different.
        depth: calculationResults.currentDepth || calculationInputs.depth || 1.0,
    };


    const discharges = slopes.map(slope => {
      const currentChartInputs = { ...chartInputsBase, slope: slope };
      // Calculate velocity for the given depth and new slope
      const velocity = calculateVelocity(currentChartInputs.depth, currentChartInputs, channelType, equationType);
      const { area } = calculateGeometry(currentChartInputs.depth, currentChartInputs, channelType);
      return area * velocity;
    });

    return {
      labels: slopes.map(s => (s * 1000).toFixed(2)), // mm/m
      datasets: [
        {
          label: `Discharge (m³/s) at Depth = ${formatProperty(chartInputsBase.depth, 'depth')}`,
          data: discharges,
          backgroundColor: '#64ffda',
        },
      ],
    };
  };

  return (
    <div className="open-channel-flow-calculator">
      <h2>Open Channel Flow Calculator</h2>

      <div className="controls">
        <div className="channel-type-select">
          <label>Channel Type:</label>
          <select
            value={channelType}
            onChange={e => {
              setChannelType(e.target.value);
              setSelectedChannel(null);
              setCalculationResults(null);
            }}
          >
            {Object.entries(channelData).map(([key, value]) => (
              <option key={key} value={key}>{value.name}</option>
            ))}
          </select>
        </div>

        <div className="equation-type-select">
          <label>Equation:</label>
          <select
            value={equationType}
            onChange={e => setEquationType(e.target.value)}
          >
            <option value="manning">Manning's Equation</option>
            <option value="chezy">Chezy's Equation</option>
          </select>
        </div>

        <div className="search-box">
          <label>Search:</label>
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search by ID or material..."
          />
        </div>
      </div>

      <div className="channels-table-container">
        <table className="channels-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('id')}>
                ID
                {sortField === 'id' && (
                  <span className="sort-indicator">
                    {sortOrder === 'asc' ? ' ↑' : ' ↓'}
                  </span>
                )}
              </th>
              <th onClick={() => handleSort('material')}>
                Material
                {sortField === 'material' && (
                  <span className="sort-indicator">
                    {sortOrder === 'asc' ? ' ↑' : ' ↓'}
                  </span>
                )}
              </th>
              <th onClick={() => handleSort('bottomWidth')}>
                {channelType === 'circular' ? 'Diameter (m)' : 'Bottom Width (m)'}
                {sortField === (channelType === 'circular' ? 'diameter' : 'bottomWidth') && (
                  <span className="sort-indicator">
                    {sortOrder === 'asc' ? ' ↑' : ' ↓'}
                  </span>
                )}
              </th>
              <th onClick={() => handleSort('slope')}>
                Slope (mm/m)
                {sortField === 'slope' && (
                  <span className="sort-indicator">
                    {sortOrder === 'asc' ? ' ↑' : ' ↓'}
                  </span>
                )}
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredChannels.map(channel => (
              <tr
                key={channel.id}
                className={selectedChannel?.id === channel.id ? 'selected' : ''}
              >
                <td>{channel.id}</td>
                <td>{channel.material}</td>
                <td>
                  {channelType === 'circular' 
                    ? formatProperty(channel.diameter, 'diameter')
                    : (channel.bottomWidth !== undefined 
                        ? formatProperty(channel.bottomWidth, 'bottomWidth') 
                        : '-')
                  }
                </td>
                <td>{formatProperty(channel.slope, 'slope')}</td>
                <td>
                  <button
                    className="view-details-btn"
                    onClick={() => handleChannelSelect(channel)}
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedChannel && (
        <div className="channel-details">
          <h3>Channel Details: {selectedChannel.id}</h3>

          <div className="properties-grid">
            {Object.entries(selectedChannel).map(([key, value]) => {
              if (key !== 'id') {
                // Customize label for display
                let label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                if (key === 'manningsN') label = "Manning's n";
                if (key === 'chezyC') label = "Chezy's C";
                if (key === 'sideSlope' && channelType !== 'rectangular' && channelType !== 'circular') label = "Side Slope (H:V)";
                else if (key === 'sideSlope') return null; // Don't show sideSlope for rect/circ
                if (key === 'bottomWidth' && (channelType === 'triangular' || channelType === 'circular')) return null; // Don't show bottomWidth for tri/circ
                if (key === 'diameter' && channelType !== 'circular') return null; // Don't show diameter for non-circ

                return (
                  <div key={key} className="property-item">
                    <span className="property-label">{label}:</span>
                    <span className="property-value">
                      {formatProperty(value, key)}
                    </span>
                  </div>
                );
              }
              return null;
            })}
          </div>

          <div className="calculation-section">
            <h4>Flow Calculator</h4>
            <div className="calculation-inputs">
              <div className="input-group">
                <label>Discharge (m³/s):</label>
                <input
                  type="number"
                  value={calculationInputs.discharge}
                  onChange={e =>
                    handleCalculationInputChange('discharge', e.target.value)
                  }
                  min="0"
                  step="0.1"
                  disabled={calculationInputs.solveFor === 'discharge'}
                />
              </div>
              <div className="input-group">
                <label>Bed Slope (mm/m):</label>
                <input
                  type="number"
                  value={calculationInputs.slope === "" ? "" : calculationInputs.slope * 1000}
                  onChange={e =>
                    handleCalculationInputChange('slope', e.target.value === "" ? "" : parseFloat(e.target.value) / 1000)
                  }
                  min="0"
                  step="0.01"
                  disabled={calculationInputs.solveFor === 'slope'}
                />
              </div>
              {channelType === 'rectangular' || channelType === 'trapezoidal' ? (
                <div className="input-group">
                  <label>Bottom Width (m):</label>
                  <input
                    type="number"
                    value={calculationInputs.bottomWidth}
                    onChange={e =>
                      handleCalculationInputChange('bottomWidth', e.target.value)
                    }
                    min="0"
                    step="0.01"
                  />
                </div>
              ) : null}
              {channelType === 'trapezoidal' || channelType === 'triangular' ? (
                <div className="input-group">
                  <label>Side Slope, z (zH:1V):</label>
                  <input
                    type="number"
                    value={calculationInputs.sideSlope}
                    onChange={e =>
                      handleCalculationInputChange('sideSlope', e.target.value)
                    }
                    min="0"
                    step="0.01"
                  />
                </div>
              ) : null}
              {channelType === 'circular' ? (
                <div className="input-group">
                  <label>Diameter (m):</label>
                  <input
                    type="number"
                    value={calculationInputs.diameter}
                    onChange={e =>
                      handleCalculationInputChange('diameter', e.target.value)
                    }
                    min="0"
                    step="0.01"
                  />
                </div>
              ) : null}
              <div className="input-group">
                <label>Solve For:</label>
                <select
                  value={calculationInputs.solveFor}
                  onChange={e => {
                      handleCalculationInputChange('solveFor', e.target.value);
                      // If switching to solve for depth, clear the depth input field
                      // or set it to a sensible default if that's preferred.
                      if (e.target.value === 'depth') {
                          handleCalculationInputChange('depth', ""); // Or a default like 1.0
                      }
                  }}
                >
                  <option value="depth">Normal Depth (yn)</option>
                  <option value="critical_depth">Critical Depth (yc)</option>
                  <option value="velocity">Velocity (V)</option>
                  <option value="discharge">Discharge (Q)</option>
                  <option value="slope">Bed Slope (So)</option>
                </select>
              </div>
              {calculationInputs.solveFor !== 'depth' && calculationInputs.solveFor !== 'critical_depth' && (
                <div className="input-group">
                  <label>Flow Depth, y (m):</label>
                  <input
                    type="number"
                    value={calculationInputs.depth}
                    onChange={e =>
                      handleCalculationInputChange('depth', e.target.value)
                    }
                    min="0"
                    step="0.01"
                  />
                </div>
              )}
              <div className="input-group">
                <label>Material:</label>
                <select
                  value={selectedChannel.material}
                  onChange={e => {
                    const material = e.target.value;
                    setSelectedChannel({
                      ...selectedChannel,
                      material,
                      manningsN: materialProperties[material].manningsN,
                      chezyC: materialProperties[material].chezyC,
                    });
                  }}
                >
                  {Object.keys(materialProperties).map(mat => (
                    <option key={mat} value={mat}>{mat}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              className="calculate-btn"
              onClick={performCalculations}
              disabled={loading}
            >
              {loading ? 'Calculating...' : 'Calculate Flow'}
            </button>

            {calculationResults && (
              <div className="calculation-results">
                <h5>Results</h5>
                {calculationResults.error ? (
                  <div className="error-message">
                    Error: {calculationResults.error}
                  </div>
                ) : (
                  <>
                    <div className="results-grid">
                      <div className="result-item">
                        <span className="result-label">Normal Depth (yn):</span>
                        <span className="result-value">
                          {formatProperty(calculationResults.normalDepth, 'normalDepth')}
                        </span>
                      </div>
                      <div className="result-item">
                        <span className="result-label">Critical Depth (yc):</span>
                        <span className="result-value">
                          {formatProperty(calculationResults.criticalDepth, 'criticalDepth')}
                        </span>
                      </div>
                       <div className="result-item">
                        <span className="result-label">Current Flow Depth (y):</span>
                        <span className="result-value">
                          {formatProperty(calculationResults.currentDepth, 'currentDepth')}
                        </span>
                      </div>
                      <div className="result-item">
                        <span className="result-label">Velocity:</span>
                        <span className="result-value">
                          {formatProperty(calculationResults.velocity, 'velocity')}
                        </span>
                      </div>
                      <div className="result-item">
                        <span className="result-label">Discharge:</span>
                        <span className="result-value">
                          {formatProperty(calculationResults.discharge, 'discharge')}
                        </span>
                      </div>
                      <div className="result-item">
                        <span className="result-label">Slope:</span>
                        <span className="result-value">
                          {formatProperty(calculationResults.slope, 'slope')}
                        </span>
                      </div>
                      <div className="result-item">
                        <span className="result-label">Cross-Sectional Area:</span>
                        <span className="result-value">
                          {formatProperty(calculationResults.area, 'area')}
                        </span>
                      </div>
                      <div className="result-item">
                        <span className="result-label">Hydraulic Radius:</span>
                        <span className="result-value">
                          {formatProperty(calculationResults.hydraulicRadius, 'hydraulicRadius')}
                        </span>
                      </div>
                      <div className="result-item">
                        <span className="result-label">Froude Number:</span>
                        <span className="result-value">
                          {formatProperty(calculationResults.froudeNumber, 'froudeNumber')}
                        </span>
                      </div>
                      <div className="result-item">
                        <span className="result-label">Specific Energy (E):</span>
                        <span className="result-value">
                          {formatProperty(calculationResults.specificEnergy, 'specificEnergy')}
                        </span>
                      </div>
                    </div>

                    {getVelocityDepthChartData() && (
                    <div className="visualization-chart">
                      <h5>Velocity vs. Depth (at S = {formatProperty(calculationInputs.slope, 'slope').split('(')[0].trim()})</h5>
                      <Chart
                        type="line"
                        data={getVelocityDepthChartData()}
                        options={{
                          responsive: true,
                          scales: {
                            x: { title: { display: true, text: 'Depth (m)' } },
                            y: { title: { display: true, text: 'Velocity (m/s)' } },
                          },
                        }}
                      />
                    </div>
                    )}

                    {getDischargeSlopeChartData() && (
                    <div className="visualization-chart">
                      {/* Title updated in getDischargeSlopeChartData dataset label */}
                      <Chart
                        type="bar"
                        data={getDischargeSlopeChartData()}
                        options={{
                          responsive: true,
                          scales: {
                            x: { title: { display: true, text: 'Slope (mm/m)' } },
                            y: { title: { display: true, text: 'Discharge (m³/s)' } },
                          },
                        }}
                      />
                    </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OpenChannelFlowCalculator;