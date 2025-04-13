import React, { useState, useMemo, Fragment } from 'react'; // Added Fragment
import './TrafficAnalysisCalculator.css';

// Helper function for linear interpolation
const interpolate = (x, x0, x1, y0, y1) => {
  if (x <= x0) return y0;
  if (x >= x1) return y1;
  return y0 + (x - x0) * (y1 - y0) / (x1 - x0);
};

// --- Collapsible Section Component ---
const CollapsibleSection = ({ title, children, initiallyOpen = false }) => {
  const [isOpen, setIsOpen] = useState(initiallyOpen);

  return (
    <div className={`input-section collapsible ${isOpen ? 'open' : 'closed'}`}>
      <h3 onClick={() => setIsOpen(!isOpen)} style={{ cursor: 'pointer' }}>
        {title}
        <span className="toggle-icon">{isOpen ? '−' : '+'}</span>
      </h3>
      {isOpen && <div className="collapsible-content">{children}</div>}
    </div>
  );
};


const TrafficAnalysisCalculator = () => {
  const [trafficData, setTrafficData] = useState({
    // Road characteristics
    roadCharacteristics: {
      roadType: 'arterial',          // arterial, collector, local
      functionalClass: 'urban',      // urban, suburban, rural
      segmentLength: 1.0,            // km - ADDED
      numberOfLanes: 2,              // per direction
      laneWidth: 3.5,                // meters
      shoulderWidth: 1.5,            // meters (right side)
      medianPresent: false,
      medianType: 'none',            // none, raised, flush, twltl (Two-Way Left-Turn Lane)
      medianWidth: 0,                // meters (total width for flush/raised)
      grade: 0,                      // percentage
      accessPointDensity: 10,        // points per km (driveways + minor streets) - ADDED
      speedLimit: 60,                // km/h
      parkingPresent: false,
      terrainType: 'level',          // level, rolling, mountainous
    },
    // Traffic volumes
    trafficVolumes: {
      peakHourVolume: 1500,          // vehicles per hour (total for the direction)
      vehicleComposition: {
        passengerCars: 85,
        heavyTrucks: 15,             // Combined trucks/buses for simplicity here
      },
      directionalSplit: 60,
      peakHourFactor: 0.92,          // Should be > 0 and <= 1
    },
    // Traffic conditions
    trafficConditions: {
      signalizedIntersections: {
        count: 2,
        averageCycleLength: 90,     // seconds
        greenRatio: 0.45,           // Effective green time / Cycle length (g/C)
        arrivalType: 3,             // HCM Arrival Type (1-6, 3 is random)
        coordinationFactor: 1.0,    // Progression Factor (PF) - derived from arrival type/coordination
      },
      unsignalizedIntersections: {
        count: 4,
        averageControlDelay: 10     // seconds/veh (Input directly for simplicity) - RENAMED
      },
      accessPoints: {               // Kept for potential future detailed analysis
        driveways: 6,
        minorStreets: 3,
      },
    },
    // Environmental conditions
    environmentalConditions: {
      weatherCondition: 'dry',
      lightCondition: 'day',
    },
    // Analysis parameters
    analysisParameters: {
      method: 'hcm2010',           // HCM2010, HCM2016 (Currently only affects constants slightly)
      analysisPeriod: 15,          // minutes (for queue calculation)
    }
  });

  const [results, setResults] = useState(null);
  const [errors, setErrors] = useState({});
  const [isCalculating, setIsCalculating] = useState(false);

  // --- HCM Constants and Factors (Example values, adjust based on specific HCM version/local standards) ---
  const CONSTANTS = useMemo(() => {
    const method = trafficData.analysisParameters.method; // Allow constants to vary slightly by method if needed

    // Base Free Flow Speeds (BFFS) - km/h (Example values)
    const baseFFS = {
      urban: { arterial: 70, collector: 60, local: 50 },
      suburban: { arterial: 80, collector: 70, local: 60 },
      rural: { arterial: 90, collector: 80, local: 70 },
    };

    // Passenger Car Equivalents (E_T) for Heavy Vehicles (Trucks/Buses)
    const pce_HV = {
      level: 1.5,
      rolling: 2.5,
      mountainous: 4.5,
    };

    // Capacity Base (pc/h/ln) - Ideal conditions
    const capacityBase = {
      freeway: 2400, // Example
      arterial: 1900,
      collector: 1700,
      local: 1500,
    };

    // FFS Adjustment Factors (Speed reduction in km/h)
    const ffsAdjustments = {
      // Lane Width (f_LW)
      laneWidth: [
        { width: 3.6, reduction: 0.0 },
        { width: 3.3, reduction: 3.1 },
        { width: 3.0, reduction: 10.6 },
        { width: 2.7, reduction: 15.0 }, // Extrapolated
      ],
      // Lateral Clearance (f_LC) - Sum of right-side and median-side reductions
      lateralClearanceRight: [ // Based on right shoulder width
        { clearance: 1.8, reduction: 0.0 },
        { clearance: 1.2, reduction: 1.0 },
        { clearance: 0.6, reduction: 2.6 },
        { clearance: 0.0, reduction: 5.0 },
      ],
      lateralClearanceMedian: [ // Based on median type/width
         // For undivided or TWLTL, reduction is based on opposing traffic clearance (use right-side table)
         // For divided (raised/flush median), based on median lateral clearance
        { clearance: 1.8, reduction: 0.0 },
        { clearance: 1.2, reduction: 0.5 },
        { clearance: 0.6, reduction: 1.3 },
        { clearance: 0.0, reduction: 2.5 },
      ],
      // Access Point Density (f_A) - Reduction based on points/km
      accessPoints: method === 'hcm2016' ? [ // Example: Use different table for 2016
        { density: 0, reduction: 0.0 },
        { density: 5, reduction: 3.5 },
        { density: 10, reduction: 7.0 },
        { density: 15, reduction: 10.5 },
        { density: 20, reduction: 14.0 },
      ] : [ // Default to 2010 values
        { density: 0, reduction: 0.0 },
        { density: 6, reduction: 4.0 },
        { density: 12, reduction: 8.0 },
        { density: 18, reduction: 12.0 },
        { density: 24, reduction: 16.0 },
      ],
    };

    // Capacity Adjustment Factors (Multiplicative)
    const capacityAdjustments = {
      // Heavy Vehicle Factor (f_HV) - Calculated based on PCE and proportion
      // Lane Width Factor (f_LW_cap) - Different from FFS adjustment
      laneWidth: [
        { width: 3.6, factor: 1.00 },
        { width: 3.3, factor: 0.97 },
        { width: 3.0, factor: 0.90 },
        { width: 2.7, factor: 0.80 },
      ],
      // Others (Simplified for this example)
      weather: { dry: 1.00, wet: 0.95, snow: 0.80, ice: 0.70 },
      light: { day: 1.00, night: 0.95, 'dawn/dusk': 0.97 },
    };

    // HCM Arrival Type to Progression Factor (PF) mapping (Example)
    const progressionFactors = {
      1: 0.60, // Very Poor
      2: 0.85, // Unfavorable
      3: 1.00, // Random
      4: 1.15, // Favorable
      5: 1.30, // Highly Favorable
      6: 1.50, // Exceptional
    };

    // --- LOS Thresholds (Example: ATS as % of FFS for Urban Streets) ---
    // These can vary significantly by Arterial Class in HCM
    const losThresholdsUrbanATS = {
        A: 0.85, B: 0.67, C: 0.50, D: 0.40, E: 0.33 // Ratio ATS/FFS > Threshold
    };

    return {
      baseFFS,
      pce_HV,
      capacityBase,
      ffsAdjustments,
      capacityAdjustments,
      progressionFactors,
      losThresholdsUrbanATS, // Added LOS thresholds
      // Add method-specific flags if needed for calculation logic
      useHcm2016DelayFormula: method === 'hcm2016',
    };
  }, [trafficData.analysisParameters.method]); // Recalculate if method changes

  // --- Robust Lane Width Factor Lookup ---
  const getInterpolatedFactor = (value, factorTable) => {
    // Sort table by the dimension (width, clearance, density)
    const sortedTable = [...factorTable].sort((a, b) => a[Object.keys(a)[0]] - b[Object.keys(b)[0]]);
    const key = Object.keys(sortedTable[0])[0]; // e.g., 'width'
    const factorKey = Object.keys(sortedTable[0])[1]; // e.g., 'reduction' or 'factor'

    for (let i = 0; i < sortedTable.length - 1; i++) {
      if (value >= sortedTable[i][key] && value <= sortedTable[i + 1][key]) {
        return interpolate(value, sortedTable[i][key], sortedTable[i + 1][key], sortedTable[i][factorKey], sortedTable[i + 1][factorKey]);
      }
    }
    // Handle values outside the table range (return edge values)
    if (value < sortedTable[0][key]) return sortedTable[0][factorKey];
    return sortedTable[sortedTable.length - 1][factorKey];
  };


  // --- Enhanced Validation ---
  const validateInputs = () => {
    const { roadCharacteristics, trafficVolumes, trafficConditions } = trafficData;
    const newErrors = {};

    // Required fields
    if (!roadCharacteristics.roadType) newErrors.roadType = 'Road type is required';
    if (!roadCharacteristics.functionalClass) newErrors.functionalClass = 'Functional class is required';
    if (!roadCharacteristics.terrainType) newErrors.terrainType = 'Terrain type is required';

    // Numeric Ranges & Positive Values
    if (roadCharacteristics.segmentLength <= 0) newErrors.segmentLength = 'Segment length must be positive';
    if (roadCharacteristics.numberOfLanes <= 0) newErrors.lanes = 'Number of lanes must be positive';
    if (roadCharacteristics.laneWidth <= 0) newErrors.laneWidth = 'Lane width must be positive';
    if (roadCharacteristics.shoulderWidth < 0) newErrors.shoulderWidth = 'Shoulder width cannot be negative';
    if (roadCharacteristics.medianPresent && roadCharacteristics.medianWidth < 0) newErrors.medianWidth = 'Median width cannot be negative';
    if (roadCharacteristics.accessPointDensity < 0) newErrors.accessPointDensity = 'Access point density cannot be negative';
    if (roadCharacteristics.speedLimit <= 0) newErrors.speedLimit = 'Speed limit must be positive';

    if (trafficVolumes.peakHourVolume < 0) newErrors.peakHourVolume = 'Peak hour volume cannot be negative';
    if (trafficVolumes.peakHourFactor <= 0 || trafficVolumes.peakHourFactor > 1) newErrors.peakHourFactor = 'Peak Hour Factor must be between 0 (exclusive) and 1 (inclusive)';
    if (trafficVolumes.directionalSplit < 0 || trafficVolumes.directionalSplit > 100) newErrors.directionalSplit = 'Directional split must be between 0 and 100';

    // Vehicle Composition
    const totalComposition = Object.values(trafficVolumes.vehicleComposition).reduce((sum, value) => sum + (value || 0), 0);
    if (Math.abs(totalComposition - 100) > 0.1) newErrors.composition = 'Vehicle composition must total 100%';
    if (trafficVolumes.vehicleComposition.heavyTrucks < 0) newErrors.heavyTrucks = 'Heavy truck percentage cannot be negative';

    // Traffic Conditions
    if (trafficConditions.signalizedIntersections.count < 0) newErrors.signalCount = 'Signalized intersection count cannot be negative';
    if (trafficConditions.signalizedIntersections.count > 0) {
        if (trafficConditions.signalizedIntersections.averageCycleLength <= 0) newErrors.cycleLength = 'Average cycle length must be positive';
        if (trafficConditions.signalizedIntersections.greenRatio <= 0 || trafficConditions.signalizedIntersections.greenRatio > 1) newErrors.greenRatio = 'Green ratio must be between 0 (exclusive) and 1 (inclusive)';
        if (trafficConditions.signalizedIntersections.arrivalType < 1 || trafficConditions.signalizedIntersections.arrivalType > 6) newErrors.arrivalType = 'Arrival type must be between 1 and 6';
    }
    if (trafficConditions.unsignalizedIntersections.count < 0) newErrors.unsignalCount = 'Unsignalized intersection count cannot be negative';
    if (trafficConditions.unsignalizedIntersections.count > 0 && trafficConditions.unsignalizedIntersections.averageControlDelay < 0) newErrors.unsignalDelay = 'Unsignalized delay cannot be negative';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // --- Revised Calculation Logic ---

  const calculateTrafficAnalysis = async () => {
    if (!validateInputs()) return;

    setIsCalculating(true);
    setErrors({});
    setResults(null); // Clear previous results

    try {
      // --- 1. Calculate Demand Flow Rate (v_p) ---
      const demandFlowRate = calculateDemandFlowRate(trafficData, CONSTANTS); // pc/h/ln

      // --- 2. Calculate Free Flow Speed (FFS) ---
      const freeFlowSpeed = calculateFreeFlowSpeed(trafficData, CONSTANTS, getInterpolatedFactor); // km/h

      // --- 3. Calculate Capacity (c) ---
      const capacity = calculateCapacity(trafficData, CONSTANTS, getInterpolatedFactor); // pc/h/ln

      // --- 4. Calculate Volume-to-Capacity Ratio (X or v/c) ---
      const volumeToCapacityRatio = demandFlowRate / capacity;

      // --- 5. Calculate Average Travel Speed (ATS) ---
      const averageTravelSpeed = calculateAverageTravelSpeed(freeFlowSpeed, volumeToCapacityRatio, trafficData.roadCharacteristics.roadType, CONSTANTS); // km/h

      // --- 6. Calculate Density (D) ---
      const density = calculateDensity(demandFlowRate, averageTravelSpeed); // pc/km/ln

      // --- 7. Calculate Control Delay (d) ---
      // Note: This calculates delay *per intersection* and then sums for the segment
      const { totalSignalizedDelay, totalUnsignalizedDelay, segmentControlDelay } = calculateControlDelay(trafficData, volumeToCapacityRatio, capacity, CONSTANTS); // seconds/veh

      // --- 8. Calculate Travel Time (TT) ---
      // Travel time per kilometer based on average speed, including effect of segment delay
      const travelTimePerKm = calculateTravelTimePerKm(averageTravelSpeed); // seconds/km

      // --- 9. Determine Level of Service (LOS) ---
      // LOS for urban streets is often based on ATS relative to FFS, or directly on ATS ranges.
      // Using ATS relative to FFS here for an example.
      const los = determineLevelOfService(averageTravelSpeed, freeFlowSpeed, trafficData.roadCharacteristics.roadType, CONSTANTS);

      // --- 10. Estimate Queue Length (Q) ---
      // Simplified queue estimation per signalized intersection
      const averageQueuePerSignal = estimateQueueLength(trafficData, volumeToCapacityRatio, capacity); // vehicles

      // --- Format Results ---
      const formattedResults = {
        demandFlowRate: parseFloat(demandFlowRate.toFixed(1)),
        freeFlowSpeed: parseFloat(freeFlowSpeed.toFixed(1)),
        capacity: parseFloat(capacity.toFixed(0)),
        volumeToCapacityRatio: parseFloat(volumeToCapacityRatio.toFixed(3)),
        averageTravelSpeed: parseFloat(averageTravelSpeed.toFixed(1)),
        density: parseFloat(density.toFixed(2)),
        segmentControlDelay: parseFloat(segmentControlDelay.toFixed(1)), // Total delay added by intersections over the segment
        travelTimePerKm: parseFloat(travelTimePerKm.toFixed(1)),
        los,
        averageQueuePerSignal: parseFloat(averageQueuePerSignal.toFixed(1)),
      };

      // --- Generate Recommendations ---
      const recommendations = generateRecommendations(formattedResults, trafficData); // Pass original data for context

      setResults({
        ...formattedResults,
        recommendations,
        calculatedAt: new Date().toISOString()
      });

    } catch (error) {
      console.error('Calculation error:', error);
      setErrors({ calculation: `Calculation Error: ${error.message}` });
    } finally {
      setIsCalculating(false);
    }
  };

  // --- Sub-Calculation Functions ---

  const calculateDemandFlowRate = (data, consts) => {
    const { trafficVolumes, roadCharacteristics } = data;
    const { terrainType } = roadCharacteristics;
    const { peakHourVolume, peakHourFactor, directionalSplit, vehicleComposition } = trafficVolumes;

    if (peakHourFactor <= 0) throw new Error("Peak Hour Factor must be greater than 0.");

    // 1. Calculate Peak Hour Demand (vehicles/hour in peak direction)
    const peakDirectionalVolume = peakHourVolume * (directionalSplit / 100);

    // 2. Calculate Peak 15-min equivalent flow rate (vehicles/hour in peak direction)
    const peakRateOfFlow = peakDirectionalVolume / peakHourFactor;

    // 3. Calculate Heavy Vehicle Adjustment Factor (f_HV)
    const P_HV = (vehicleComposition.heavyTrucks || 0) / 100; // Proportion of heavy vehicles
    const E_T = consts.pce_HV[terrainType] || 1.5; // PCE for heavy vehicles
    const f_HV = 1 / (1 + P_HV * (E_T - 1));
    if (f_HV <= 0) throw new Error("Invalid Heavy Vehicle factor calculated.");


    // 4. Calculate Demand Flow Rate in pc/h (peak direction)
    const demandFlow_pcph = peakRateOfFlow / f_HV;

    // 5. Convert to pc/h/ln
    const demandFlow_pcphpl = demandFlow_pcph / roadCharacteristics.numberOfLanes;

    return demandFlow_pcphpl;
  };

  const calculateFreeFlowSpeed = (data, consts, interpolateFunc) => {
    const { roadCharacteristics } = data;
    const { roadType, functionalClass, speedLimit, laneWidth, shoulderWidth, medianPresent, medianType, medianWidth, accessPointDensity } = roadCharacteristics;

    // 1. Determine Base Free Flow Speed (BFFS)
    let bffs = consts.baseFFS[functionalClass]?.[roadType] || 70; // Default
    // Optional: Adjust BFFS based on speed limit if needed (e.g., BFFS = Speed Limit + 10 km/h, capped)
    bffs = Math.min(bffs, speedLimit + 10);

    // 2. Calculate Adjustments
    // f_LW (Lane Width)
    const f_LW = interpolateFunc(laneWidth, consts.ffsAdjustments.laneWidth);

    // f_LC (Lateral Clearance) - Sum of right and median side adjustments
    const rightClearance = shoulderWidth;
    const f_LC_R = interpolateFunc(rightClearance, consts.ffsAdjustments.lateralClearanceRight);

    let medianClearance = 0;
    if (medianPresent && (medianType === 'raised' || medianType === 'flush')) {
        medianClearance = medianWidth / 2; // Clearance to median barrier/edge
    } else {
        // Undivided or TWLTL - clearance is effectively to opposing lanes, treat similar to right side?
        // HCM has specific rules, simplifying here: assume similar effect as shoulder if no median barrier
         medianClearance = 1.8; // Assume large effective clearance if no barrier/median
    }
    const f_LC_M = interpolateFunc(medianClearance, consts.ffsAdjustments.lateralClearanceMedian);
    const f_LC = f_LC_R + f_LC_M;

    // f_A (Access Points)
    const f_A = interpolateFunc(accessPointDensity, consts.ffsAdjustments.accessPoints);

    // 3. Calculate Final FFS
    const FFS = bffs - f_LW - f_LC - f_A;

    return Math.max(FFS, speedLimit * 0.5, 30); // Ensure FFS is reasonable, not below half speed limit or 30km/h
  };

  const calculateCapacity = (data, consts, interpolateFunc) => {
    const { roadCharacteristics, environmentalConditions, trafficVolumes } = data;
    const { roadType, laneWidth, terrainType } = roadCharacteristics;
    const { weatherCondition, lightCondition } = environmentalConditions;
    const { vehicleComposition } = trafficVolumes;

    // 1. Get Base Capacity
    const baseCapacity = consts.capacityBase[roadType] || 1900; // pc/h/ln

    // 2. Calculate Adjustment Factors
    // f_LW (Lane Width) - Use capacity adjustment table
    const f_LW_cap = interpolateFunc(laneWidth, consts.capacityAdjustments.laneWidth);

    // f_HV (Heavy Vehicles) - Already accounted for in demandFlowRate calculation (converting veh -> pc)
    const f_HV = 1.0; // Set to 1 as demand is already in pc/h/ln

    // f_W (Weather/Environment) - Simplified combination
    const f_W = (consts.capacityAdjustments.weather[weatherCondition] || 1.0) *
                (consts.capacityAdjustments.light[lightCondition] || 1.0);

    // Other factors (f_g for grade, f_p for driver pop - not included here)
    const f_g = 1.0;
    const f_p = 1.0;

    // 3. Calculate Final Capacity
    const capacity = baseCapacity * f_LW_cap * f_HV * f_g * f_p * f_W;

    return Math.max(capacity, 100); // Ensure capacity is positive
  };

  const calculateAverageTravelSpeed = (ffs, vcRatio, roadType, consts) => {
    // Use HCM speed-flow relationships (simplified example for urban streets)
    // ATS = FFS / (1 + a * (v/c)^b) or similar forms
    // For Urban Streets (HCM 2010 Eq 16-4 conceptually): Speed drops as v/c increases
    let speed;
    const x = Math.min(vcRatio, 1.0); // Use v/c capped at 1.0 for speed calc before breakdown

    // Example coefficients (vary significantly by facility type/class)
    // These are illustrative ONLY and should be replaced with proper HCM values
    let a = 0.15;
    let b = 4.0;
    if (roadType === 'collector') { a = 0.20; b = 4.5; }
    if (roadType === 'local') { a = 0.25; b = 5.0; }

    // Apply method-specific adjustments if needed (e.g., different coefficients)
    // if (consts.useHcm2016SpeedCurve) { a = ...; b = ...; }

    speed = ffs * (1 - a * Math.pow(x, b)); // Simplified form

    // Handle over-capacity conditions (v/c > 1.0) - speed drops significantly
    if (vcRatio > 1.0) {
      // Speed at capacity (when vc=1.0)
      const speedAtCapacity = ffs * (1 - a);
      // Assume speed drops further, e.g., linearly or exponentially down to a crawl speed
      const crawlSpeed = 15; // km/h
      speed = Math.max(crawlSpeed, speedAtCapacity - (vcRatio - 1.0) * (speedAtCapacity - crawlSpeed) * 0.5); // Linear drop example
    }

    return Math.max(speed, 10); // Minimum speed 10 km/h
  };

  const calculateDensity = (flowRate, speed) => {
    if (speed <= 0) return Infinity; // Avoid division by zero
    // Density (pc/km/ln) = Flow Rate (pc/h/ln) / Speed (km/h)
    return flowRate / speed;
  };

  const calculateControlDelay = (data, vcRatio, capacity, consts) => {
    const { trafficConditions, roadCharacteristics, analysisParameters } = data;
    const { signalizedIntersections, unsignalizedIntersections } = trafficConditions;
    const { segmentLength } = roadCharacteristics;
    const T = analysisParameters.analysisPeriod / 60; // Analysis period in hours

    let totalSignalizedDelay = 0;
    if (signalizedIntersections.count > 0) {
      const C = signalizedIntersections.averageCycleLength; // Cycle Length (s)
      const gC = signalizedIntersections.greenRatio;       // Green Ratio (g/C)
      const X = Math.min(vcRatio, 1.2); // Cap v/c for delay stability in simple models
      const PF = consts.progressionFactors[signalizedIntersections.arrivalType] || 1.0; // Progression Factor

      if (C <= 0 || gC <= 0 || gC > 1) throw new Error("Invalid signal parameters.");

      // HCM Uniform Delay (d1)
      const term1 = 0.5 * C * Math.pow(1 - gC, 2);
      const term2 = 1 - Math.min(1.0, X) * gC; // Use X capped at 1.0 for d1 denominator
      if (term2 <= 0) throw new Error("Invalid term in uniform delay calculation (check g/C and X).");
      const d1 = term1 / term2;

      // HCM Incremental Delay (d2) - Overflow Delay (Simplified Akcelik formula component)
      // k = capacity factor (0.5 for pretimed, 1.0 for actuated - simplified)
      // I = upstream filtering factor (1.0 for isolated - simplified)
      let d2 = 0;
      if (X > 0.8) { // Simplified threshold for overflow
         // More complex formulas exist, using a basic placeholder:
         // d2 = 900 * T * [ (X-1) + sqrt( (X-1)^2 + (8 * k * I * X) / (capacity * T) ) ];
         // Very simplified version proportional to (X-1)^2 for X>1
         if (consts.useHcm2016DelayFormula) {
             // Placeholder for a potentially different HCM 2016 formula
             d2 = 10 * C * Math.max(0, X - 0.8); // Different simplified placeholder
         } else {
             // HCM 2010 simplified placeholder
             // d2 = 900 * T * [ (X-1) + sqrt( (X-1)^2 + (8 * k * I * X) / (capacity * T) ) ]; // More complex form
             d2 = 5 * C * Math.max(0, X - 0.8); // Original simplified placeholder
         }
      }


      // Initial Queue Delay (d3) - Ignored for planning analysis usually
      const d3 = 0;

      // Total Delay per signalized intersection (seconds/vehicle)
      const delayPerSignal = (d1 + d2 + d3) * PF;
      totalSignalizedDelay = signalizedIntersections.count * delayPerSignal;
    }

    // Unsignalized Delay (using direct input for simplicity)
    const totalUnsignalizedDelay = unsignalizedIntersections.count * unsignalizedIntersections.averageControlDelay;

    // Total Segment Control Delay (seconds per vehicle for the whole segment)
    const segmentControlDelay = totalSignalizedDelay + totalUnsignalizedDelay;

    return { totalSignalizedDelay, totalUnsignalizedDelay, segmentControlDelay };
  };

   const calculateTravelTimePerKm = (averageTravelSpeed) => {
    if (averageTravelSpeed <= 0) return Infinity;
    // Travel Time (seconds per km) = 3600 / Speed (km/h)
    return 3600 / averageTravelSpeed;
  };

  const determineLevelOfService = (ats, ffs, roadType, consts) => {
    // LOS based on ATS for Urban Streets (Example thresholds from HCM - Adjust as needed)
    // These thresholds often depend on the Arterial Class (I, II, III, IV) which isn't an input here.
    // Using a generic example based on % of FFS.
    if (ffs <= 0) return 'F'; // Cannot determine LOS if FFS is zero or negative
    const speedRatio = ats / ffs;
    const thresholds = consts.losThresholdsUrbanATS;

    if (roadType === 'arterial' || roadType === 'collector') { // Example for arterials/collectors
        if (speedRatio > thresholds.A) return 'A';
        if (speedRatio > thresholds.B) return 'B';
        if (speedRatio > thresholds.C) return 'C';
        if (speedRatio > thresholds.D) return 'D';
        if (speedRatio > thresholds.E) return 'E'; // Or based on ATS absolute value
        return 'F';
    } else { // Example for local roads (less sensitive to speed)
        if (ats > 50) return 'A';
        if (ats > 40) return 'B';
        if (ats > 30) return 'C';
        if (ats > 25) return 'D';
        if (ats > 20) return 'E';
        return 'F';
    }
  };

  const estimateQueueLength = (data, vcRatio, capacity) => {
     // Simplified Queue Estimation per signalized intersection
     // Q_avg ≈ (v * C * (1 - g/C)) / (2 * (1 - v/s)) where s is saturation flow
     // Very simplified version based on v/c ratio
     const { trafficConditions, trafficVolumes } = data;
     const { signalizedIntersections } = trafficConditions;
     const { peakHourVolume } = trafficVolumes; // Using total directional volume here

     if (signalizedIntersections.count === 0) return 0;

     const C = signalizedIntersections.averageCycleLength;
     const gC = signalizedIntersections.greenRatio;
     const X = vcRatio;

     // Simplified formula - Average vehicles arriving during red + overflow estimate
     const arrivalRatePerCycle = (peakHourVolume / 3600) * C; // Avg arrivals per cycle
     const avgQueueUniform = arrivalRatePerCycle * (1 - gC); // Simplified uniform queue

     let overflowQueue = 0;
     if (X > 0.9) { // Simplified overflow trigger
         overflowQueue = 5 * Math.pow(Math.max(0, X - 0.9), 2); // Very basic overflow term
     }

     const avgQueue = avgQueueUniform + overflowQueue;

     return Math.max(0, avgQueue); // Vehicles
  };


  // --- Generate Recommendations (Updated Context) ---
  const generateRecommendations = (metrics, data) => {
    const recommendations = [];
    const { roadCharacteristics } = data;

    // V/C Ratio
    if (metrics.volumeToCapacityRatio >= 1.0) {
      recommendations.push({ text: "Facility is over capacity (V/C >= 1.0). Significant congestion expected. Consider major capacity enhancements (lanes, intersection improvements).", priority: "critical" });
    } else if (metrics.volumeToCapacityRatio > 0.90) {
      recommendations.push({ text: `High V/C ratio (${metrics.volumeToCapacityRatio.toFixed(2)}). Approaching capacity limits. Consider signal timing optimization, access management, or minor capacity improvements.`, priority: "high" });
    } else if (metrics.volumeToCapacityRatio > 0.80) {
      recommendations.push({ text: `Moderate V/C ratio (${metrics.volumeToCapacityRatio.toFixed(2)}). Monitor traffic closely, especially during peak periods. Plan for future improvements.`, priority: "medium" });
    }

    // Level of Service
    if (metrics.los === 'F') {
      recommendations.push({ text: "LOS F indicates breakdown flow and severe congestion. Requires immediate attention and significant improvements.", priority: "critical" });
    } else if (metrics.los === 'E') {
      recommendations.push({ text: "LOS E indicates unstable flow at capacity. Consider operational improvements and capacity enhancements.", priority: "high" });
    } else if (metrics.los === 'D') {
      recommendations.push({ text: "LOS D indicates approaching unstable flow. Evaluate causes of delay and consider operational improvements.", priority: "medium" });
    }

    // Speed vs. FFS
    const speedRatio = metrics.averageTravelSpeed / metrics.freeFlowSpeed;
    if (speedRatio < 0.5 && metrics.freeFlowSpeed > 0) {
         recommendations.push({ text: `Average speed (${metrics.averageTravelSpeed.toFixed(1)} km/h) is less than 50% of Free Flow Speed (${metrics.freeFlowSpeed.toFixed(1)} km/h). Investigate major bottlenecks or incidents.`, priority: "high" });
    } else if (speedRatio < 0.7 && metrics.freeFlowSpeed > 0) {
         recommendations.push({ text: `Average speed (${metrics.averageTravelSpeed.toFixed(1)} km/h) is significantly below Free Flow Speed (${metrics.freeFlowSpeed.toFixed(1)} km/h). Evaluate intersection delays and segment conditions.`, priority: "medium" });
    }

    // Delay
    if (metrics.segmentControlDelay > 90) {
         recommendations.push({ text: `Very high average control delay (${metrics.segmentControlDelay.toFixed(1)} s/veh). Focus on intersection improvements (signal timing, geometry, coordination).`, priority: "high" });
    } else if (metrics.segmentControlDelay > 60) {
         recommendations.push({ text: `High average control delay (${metrics.segmentControlDelay.toFixed(1)} s/veh). Evaluate signal coordination and intersection capacity.`, priority: "medium" });
    }

     // Density
    if (metrics.density > 27) { // Threshold for LOS E/F boundary on freeways, adapt for arterials
      recommendations.push({ text: `High density (${metrics.density.toFixed(1)} pc/km/ln) suggests congested conditions. Evaluate potential for breakdown flow.`, priority: "medium" });
    }

    // Queue Length
    if (metrics.averageQueuePerSignal > 15) {
         recommendations.push({ text: `Significant average queue length (${metrics.averageQueuePerSignal.toFixed(1)} veh) per signal. Assess signal timing, phase length, and storage bay adequacy.`, priority: "medium" });
    }

    if (recommendations.length === 0) {
        recommendations.push({ text: "Traffic conditions appear acceptable based on current inputs and LOS C/D thresholds.", priority: "low" });
    }

    return recommendations;
  };


  // --- Input Handlers (Mostly unchanged, ensure they match state structure) ---
  const handleInputChange = (section, field, value) => {
    // Convert to number if the original value was a number
    const originalValue = trafficData[section]?.[field];
    const numericValue = typeof originalValue === 'number' ? parseFloat(value) : value;

    setTrafficData(prevData => ({
      ...prevData,
      [section]: {
        ...prevData[section],
        [field]: isNaN(numericValue) && typeof originalValue === 'number' ? 0 : numericValue // Handle NaN on number conversion
      }
    }));
     // Clear errors when input changes
     setErrors(prevErrors => {
        const newErrors = {...prevErrors};
        delete newErrors[field]; // Clear specific field error
        delete newErrors.calculation; // Clear general calculation error
        return newErrors;
     });
     setResults(null); // Clear results on input change
  };

  const handleVehicleComposition = (vehicle, value) => {
    const numericValue = parseFloat(value);
    setTrafficData(prevData => ({
      ...prevData,
      trafficVolumes: {
        ...prevData.trafficVolumes,
        vehicleComposition: {
          ...prevData.trafficVolumes.vehicleComposition,
          [vehicle]: isNaN(numericValue) ? 0 : numericValue
        }
      }
    }));
     setErrors(prevErrors => {
        const newErrors = {...prevErrors};
        delete newErrors.composition;
        delete newErrors.calculation;
        return newErrors;
     });
     setResults(null);
  };

  const handleNestedInputChange = (section, subsection, field, value) => {
     const originalValue = trafficData[section]?.[subsection]?.[field];
     const numericValue = typeof originalValue === 'number' ? parseFloat(value) : value;

    setTrafficData(prevData => ({
      ...prevData,
      [section]: {
        ...prevData[section],
        [subsection]: {
          ...prevData[section][subsection],
          [field]: isNaN(numericValue) && typeof originalValue === 'number' ? 0 : numericValue
        }
      }
    }));
     setErrors(prevErrors => {
        const newErrors = {...prevErrors};
        // Clear potential related errors
        delete newErrors[field];
        if (subsection === 'signalizedIntersections') {
            delete newErrors.cycleLength;
            delete newErrors.greenRatio;
            delete newErrors.arrivalType;
        }
        delete newErrors.calculation;
        return newErrors;
     });
     setResults(null);
  };

  // --- JSX (Add new inputs, adjust existing ones) ---
  return (
    <div className="traffic-analysis-calculator">
      <h2>Traffic Analysis Calculator (HCM-Based)</h2>
      {/* Enhanced Disclaimer */}
      <p style={{ textAlign: 'center', marginBottom: '20px', fontStyle: 'italic', color: '#aaa', fontSize: '0.9em', border: '1px dashed #555', padding: '10px', borderRadius: '5px' }}>
        <strong>Disclaimer:</strong> This tool provides estimates based on simplified Highway Capacity Manual (HCM) principles.
        Calculations for speed, delay (especially overflow delay d2), and queue length are illustrative placeholders and do not fully replicate the complexity of official HCM methodologies.
        Results should be used for preliminary planning and educational purposes only. Always consult the official HCM and professional engineering judgment for detailed design and analysis. Unit consistency (km, m, s, h, pc, veh) is critical.
      </p>

      <div className="calculator-controls">
        <div className="input-sections">
          {/* Use CollapsibleSection for each input group */}
          <CollapsibleSection title="Road Characteristics" initiallyOpen={true}>
             {/* Road Type */}
             <div className="input-group">
              <label>Road Type:</label>
              <select value={trafficData.roadCharacteristics.roadType} onChange={(e) => handleInputChange('roadCharacteristics', 'roadType', e.target.value)}>
                <option value="arterial">Arterial</option>
                <option value="collector">Collector</option>
                <option value="local">Local</option>
              </select>
              {errors.roadType && <span className="error-text">{errors.roadType}</span>}
            </div>
            {/* Functional Class */}
             <div className="input-group">
              <label>Functional Class:</label>
              <select value={trafficData.roadCharacteristics.functionalClass} onChange={(e) => handleInputChange('roadCharacteristics', 'functionalClass', e.target.value)}>
                <option value="urban">Urban</option>
                <option value="suburban">Suburban</option>
                <option value="rural">Rural</option>
              </select>
               {errors.functionalClass && <span className="error-text">{errors.functionalClass}</span>}
            </div>
            {/* Terrain Type */}
             <div className="input-group">
              <label>Terrain Type:</label>
              <select value={trafficData.roadCharacteristics.terrainType} onChange={(e) => handleInputChange('roadCharacteristics', 'terrainType', e.target.value)}>
                <option value="level">Level (≤2% Grade)</option>
                <option value="rolling">Rolling (&gt;2% to ≤4% Grade)</option> {/* Corrected symbol */}
                <option value="mountainous">Mountainous (&gt;4% Grade)</option> {/* Corrected symbol */}
              </select>
               {errors.terrainType && <span className="error-text">{errors.terrainType}</span>}
            </div>
            {/* Segment Length */}
             <div className="input-group">
              <label>Segment Length (km):</label>
              <input type="number" min="0.1" step="0.1" value={trafficData.roadCharacteristics.segmentLength} onChange={(e) => handleInputChange('roadCharacteristics', 'segmentLength', e.target.value)} />
               {errors.segmentLength && <span className="error-text">{errors.segmentLength}</span>}
            </div>
            {/* Lanes per Direction */}
            <div className="input-group">
              <label>Lanes per Direction:</label>
              <input type="number" min="1" step="1" value={trafficData.roadCharacteristics.numberOfLanes} onChange={(e) => handleInputChange('roadCharacteristics', 'numberOfLanes', e.target.value)} />
               {errors.lanes && <span className="error-text">{errors.lanes}</span>}
            </div>
            {/* Lane Width */}
            <div className="input-group">
              <label>Lane Width (m):</label>
              <input type="number" min="2.5" max="4.0" step="0.1" value={trafficData.roadCharacteristics.laneWidth} onChange={(e) => handleInputChange('roadCharacteristics', 'laneWidth', e.target.value)} />
               {errors.laneWidth && <span className="error-text">{errors.laneWidth}</span>}
            </div>
            {/* Shoulder Width */}
             <div className="input-group">
              <label>Shoulder Width (m, right side):</label>
              <input type="number" min="0" step="0.1" value={trafficData.roadCharacteristics.shoulderWidth} onChange={(e) => handleInputChange('roadCharacteristics', 'shoulderWidth', e.target.value)} />
               {errors.shoulderWidth && <span className="error-text">{errors.shoulderWidth}</span>}
            </div>
            {/* Median */}
             <div className="input-group">
              <label>Median Present:</label>
              <input type="checkbox" checked={trafficData.roadCharacteristics.medianPresent} onChange={(e) => handleInputChange('roadCharacteristics', 'medianPresent', e.target.checked)} />
            </div>
            {trafficData.roadCharacteristics.medianPresent && (
              <Fragment> {/* Use Fragment to group conditional inputs */}
                <div className="input-group">
                  <label>Median Type:</label>
                  <select value={trafficData.roadCharacteristics.medianType} onChange={(e) => handleInputChange('roadCharacteristics', 'medianType', e.target.value)}>
                    <option value="raised">Raised</option>
                    <option value="flush">Flush</option>
                    <option value="twltl">TWLTL</option>
                    <option value="none">None (Barrier)</option>
                  </select>
                </div>
                <div className="input-group">
                  <label>Median Width (m, total):</label>
                  <input type="number" min="0" step="0.1" value={trafficData.roadCharacteristics.medianWidth} onChange={(e) => handleInputChange('roadCharacteristics', 'medianWidth', e.target.value)} />
                   {errors.medianWidth && <span className="error-text">{errors.medianWidth}</span>}
                </div>
              </Fragment>
            )}
            {/* Access Point Density */}
             <div className="input-group">
              <label>Access Point Density (pts/km):</label>
              <input type="number" min="0" step="1" value={trafficData.roadCharacteristics.accessPointDensity} onChange={(e) => handleInputChange('roadCharacteristics', 'accessPointDensity', e.target.value)} />
               {errors.accessPointDensity && <span className="error-text">{errors.accessPointDensity}</span>}
            </div>
            {/* Speed Limit */}
             <div className="input-group">
              <label>Speed Limit (km/h):</label>
              <input type="number" min="30" step="5" value={trafficData.roadCharacteristics.speedLimit} onChange={(e) => handleInputChange('roadCharacteristics', 'speedLimit', e.target.value)} />
               {errors.speedLimit && <span className="error-text">{errors.speedLimit}</span>}
            </div>
            {/* Grade */}
             <div className="input-group">
                <label>Grade (%):</label>
                <input type="number" step="0.1" value={trafficData.roadCharacteristics.grade} onChange={(e) => handleInputChange('roadCharacteristics', 'grade', e.target.value)} />
                {errors.grade && <span className="error-text">{errors.grade}</span>}
             </div>
          </CollapsibleSection>

          <CollapsibleSection title="Traffic Volumes">
            {/* Peak Hour Volume */}
            <div className="input-group">
              <label>Peak Hour Volume (veh/h, direction):</label>
              <input type="number" min="0" value={trafficData.trafficVolumes.peakHourVolume} onChange={(e) => handleInputChange('trafficVolumes', 'peakHourVolume', e.target.value)} />
               {errors.peakHourVolume && <span className="error-text">{errors.peakHourVolume}</span>}
            </div>
            {/* PHF */}
             <div className="input-group">
              <label>Peak Hour Factor (PHF):</label>
              <input type="number" min="0.1" max="1.0" step="0.01" value={trafficData.trafficVolumes.peakHourFactor} onChange={(e) => handleInputChange('trafficVolumes', 'peakHourFactor', e.target.value)} />
               {errors.peakHourFactor && <span className="error-text">{errors.peakHourFactor}</span>}
            </div>
            {/* Directional Split */}
             <div className="input-group">
              <label>Directional Split (%):</label>
              <input type="number" min="0" max="100" step="1" value={trafficData.trafficVolumes.directionalSplit} onChange={(e) => handleInputChange('trafficVolumes', 'directionalSplit', e.target.value)} />
               {errors.directionalSplit && <span className="error-text">{errors.directionalSplit}</span>}
            </div>
            {/* Vehicle Composition */}
            <h4>Vehicle Composition (%)</h4>
             <div className="input-group">
               <label>Passenger Cars:</label>
               <input type="number" min="0" max="100" value={trafficData.trafficVolumes.vehicleComposition.passengerCars} onChange={(e) => handleVehicleComposition('passengerCars', e.target.value)} />
             </div>
             <div className="input-group">
               <label>Heavy Vehicles (Trucks/Buses):</label>
               <input type="number" min="0" max="100" value={trafficData.trafficVolumes.vehicleComposition.heavyTrucks} onChange={(e) => handleVehicleComposition('heavyTrucks', e.target.value)} />
                {errors.heavyTrucks && <span className="error-text">{errors.heavyTrucks}</span>}
             </div>
             {errors.composition && <span className="error-text">{errors.composition}</span>}
          </CollapsibleSection>

          <CollapsibleSection title="Traffic Conditions">
             {/* Signalized Intersections */}
            <div className="subsection">
              <h4>Signalized Intersections (per segment)</h4>
              <div className="input-group">
                <label>Count:</label>
                <input type="number" min="0" value={trafficData.trafficConditions.signalizedIntersections.count} onChange={(e) => handleNestedInputChange('trafficConditions', 'signalizedIntersections', 'count', e.target.value)} />
                 {errors.signalCount && <span className="error-text">{errors.signalCount}</span>}
              </div>
              {trafficData.trafficConditions.signalizedIntersections.count > 0 && (
                <Fragment>
                  <div className="input-group">
                    <label>Avg. Cycle Length (s):</label>
                    <input type="number" min="30" value={trafficData.trafficConditions.signalizedIntersections.averageCycleLength} onChange={(e) => handleNestedInputChange('trafficConditions', 'signalizedIntersections', 'averageCycleLength', e.target.value)} />
                     {errors.cycleLength && <span className="error-text">{errors.cycleLength}</span>}
                  </div>
                  <div className="input-group">
                    <label>Avg. Green Ratio (g/C):</label>
                    <input type="number" min="0.1" max="0.9" step="0.01" value={trafficData.trafficConditions.signalizedIntersections.greenRatio} onChange={(e) => handleNestedInputChange('trafficConditions', 'signalizedIntersections', 'greenRatio', e.target.value)} />
                     {errors.greenRatio && <span className="error-text">{errors.greenRatio}</span>}
                  </div>
                   <div className="input-group">
                    <label>Arrival Type (1-6):</label>
                    <input type="number" min="1" max="6" step="1" value={trafficData.trafficConditions.signalizedIntersections.arrivalType} onChange={(e) => handleNestedInputChange('trafficConditions', 'signalizedIntersections', 'arrivalType', e.target.value)} />
                     {errors.arrivalType && <span className="error-text">{errors.arrivalType}</span>}
                     <small> (1=Worst, 3=Random, 6=Best Progression)</small>
                  </div>
                </Fragment>
              )}
            </div>
            {/* Unsignalized Intersections */}
             <div className="subsection">
              <h4>Unsignalized Intersections (per segment)</h4>
               <div className="input-group">
                <label>Count:</label>
                <input type="number" min="0" value={trafficData.trafficConditions.unsignalizedIntersections.count} onChange={(e) => handleNestedInputChange('trafficConditions', 'unsignalizedIntersections', 'count', e.target.value)} />
                 {errors.unsignalCount && <span className="error-text">{errors.unsignalCount}</span>}
              </div>
               {trafficData.trafficConditions.unsignalizedIntersections.count > 0 && (
                 <div className="input-group">
                  <label>Avg. Control Delay (s/veh):</label>
                  <input type="number" min="0" value={trafficData.trafficConditions.unsignalizedIntersections.averageControlDelay} onChange={(e) => handleNestedInputChange('trafficConditions', 'unsignalizedIntersections', 'averageControlDelay', e.target.value)} />
                   {errors.unsignalDelay && <span className="error-text">{errors.unsignalDelay}</span>}
                   {/* Unsignalized Delay Note */}
                   <small style={{ color: '#aaa', display: 'block', marginTop: '5px' }}>
                     (Simplified input. Accurate HCM calculation requires conflicting volumes, critical gap, etc.)
                   </small>
                </div>
               )}
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="Environmental & Analysis">
            {/* Environmental Conditions */}
             <div className="input-group">
              <label>Weather Condition:</label>
              <select value={trafficData.environmentalConditions.weatherCondition} onChange={(e) => handleInputChange('environmentalConditions', 'weatherCondition', e.target.value)}>
                <option value="dry">Dry</option>
                <option value="wet">Wet</option>
                <option value="snow">Snow</option>
                <option value="ice">Ice</option>
              </select>
            </div>
             <div className="input-group">
              <label>Light Condition:</label>
              <select value={trafficData.environmentalConditions.lightCondition} onChange={(e) => handleInputChange('environmentalConditions', 'lightCondition', e.target.value)}>
                <option value="day">Day</option>
                <option value="night">Night</option>
                <option value="dawn/dusk">Dawn/Dusk</option>
              </select>
            </div>
            {/* Analysis Parameters */}
             <div className="input-group">
               <label>HCM Method Basis:</label>
               <select value={trafficData.analysisParameters.method} onChange={(e) => handleInputChange('analysisParameters', 'method', e.target.value)}>
                 <option value="hcm2010">HCM 2010 (Principles)</option>
                 <option value="hcm2016">HCM 2016 (Principles)</option>
               </select>
               <small>(Affects some internal factors/formulas)</small>
             </div>
              <div className="input-group">
               <label>Analysis Period (min):</label>
               <input type="number" min="5" max="60" step="5" value={trafficData.analysisParameters.analysisPeriod} onChange={(e) => handleInputChange('analysisParameters', 'analysisPeriod', e.target.value)} />
                <small>(Used for queue/overflow estimation)</small>
             </div>
          </CollapsibleSection>

        </div> {/* End input-sections */}

        {/* Error Display */}
        {Object.keys(errors).length > 0 && (
          <div className="error-summary">
            <h4>Please correct the following errors:</h4>
            <ul>
              {Object.entries(errors).map(([key, errorMsg]) => (
                <li key={key}>{errorMsg}</li>
              ))}
            </ul>
          </div>
        )}

        <button className="analyze-button" onClick={calculateTrafficAnalysis} disabled={isCalculating}>
          {isCalculating ? 'Calculating...' : 'Analyze Traffic'}
        </button>

        {/* Results Display (Simplified structure) */}
        {results && (
          <div className="results-section">
            <h3>Analysis Results (Segment)</h3>
            <div className="results-grid">
              {/* LOS */}
              <div className="result-item los-display">
                <h4>Level of Service (LOS)</h4>
                 <div className={`los-badge los-${results.los.toLowerCase()}`}>{results.los}</div>
                 {/* <div className="los-description">{getLOSDescription(results.los)}</div> */}
                 <p>Based on Avg. Speed vs FFS</p>
              </div>
              {/* Key Metrics */}
              <div className="result-item">
                 <h4>Key Performance Metrics</h4>
                 <p>Demand Flow Rate: <strong>{results.demandFlowRate}</strong> pc/h/ln</p>
                 <p>Free Flow Speed (FFS): <strong>{results.freeFlowSpeed}</strong> km/h</p>
                 <p>Capacity: <strong>{results.capacity}</strong> pc/h/ln</p>
                 <p>Volume/Capacity (V/C): <strong>{results.volumeToCapacityRatio}</strong></p>
                 <p>Avg. Travel Speed: <strong>{results.averageTravelSpeed}</strong> km/h</p>
                 <p>Density: <strong>{results.density}</strong> pc/km/ln</p>
                 <p>Avg. Segment Control Delay: <strong>{results.segmentControlDelay}</strong> s/veh</p>
                 <p>Travel Time: <strong>{results.travelTimePerKm}</strong> s/km</p>
                 <p>Avg. Queue per Signal: <strong>{results.averageQueuePerSignal}</strong> veh</p>
              </div>
               {/* Recommendations */}
              <div className="result-item recommendations">
                <h4>Recommendations</h4>
                {results.recommendations?.length > 0 ? (
                    <ul className="recommendations-list">
                    {results.recommendations.map((rec, index) => (
                        <li key={index} className={`priority-${rec.priority}`}>
                        {rec.text}
                        </li>
                    ))}
                    </ul>
                ) : (
                    <p>No specific recommendations generated based on thresholds.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div> {/* End calculator-controls */}
    </div> // End traffic-analysis-calculator
  );
};

export default TrafficAnalysisCalculator;