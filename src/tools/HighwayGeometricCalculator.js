import React, { useState } from 'react';
import './HighwayGeometricCalculator.css';

const HighwayGeometricCalculator = () => {
  const [designData, setDesignData] = useState({
    // Design speed and traffic
    designSpeed: 80,        // km/h
    aadt: 15000,           // Annual Average Daily Traffic
    terrainType: 'rolling', // flat, rolling, mountainous
    
    // Horizontal alignment
    curve: {
      radius: 300,         // meters
      superelevation: 6,   // percentage
      length: 200,         // meters
      deflectionAngle: 30  // degrees
    },
    
    // Vertical alignment - Updated
    grade: {
      g1: -2.0,            // Incoming grade percentage (e.g., -2.0 for -2%)
      g2: 3.0,             // Outgoing grade percentage (e.g., 3.0 for +3%)
      // length: 300,      // Length is usually calculated or checked, not a primary input like K
      kValue: 45,          // K value (rate of vertical curvature)
      pvcStation: 1000,    // Optional: Station of PVC for elevation calculations
      pvcElevation: 100.0  // Optional: Elevation of PVC
    },
    
    // Cross section elements
    crossSection: {
      laneWidth: 3.6,      // meters
      numberOfLanes: 2,     // per direction
      shoulderWidth: 2.5,   // meters
      medianWidth: 3.0,    // meters
      crossSlope: 2.0      // percentage
    },
    
    // Sight distance
    sightDistance: {
      stoppingDistance: 0,  // calculated
      passingDistance: 0,   // calculated
      decisionDistance: 0   // calculated
    }
  });

  const [results, setResults] = useState(null);
  const [errors, setErrors] = useState({});

  // Design constants
  const DESIGN_STANDARDS = {
    minRadius: {
      60: 125,
      80: 230,
      100: 395,
      120: 670
    },
    maxGrade: {
      flat: 3,
      rolling: 4,
      mountainous: 6
    },
    minK: {
      crest: {
        60: 11,
        80: 26,
        100: 52,
        120: 92
      },
      sag: { // Based on AASHTO headlight criteria
        60: 15, // Example values, check AASHTO tables
        80: 28,
        100: 46,
        120: 68
      }
    },
    maxSuperelevation: 8.0, // Example max 'e' (%)
    maxSideFriction: { // Example AASHTO 'f' values
        60: 0.16,
        80: 0.14,
        100: 0.12,
        120: 0.10
    },
    // Add relative gradient for runoff calculation
    maxRelativeGradient: 0.50 // % per 30m or similar unit - check standard
  };

  // Helper function to handle nested state updates
  const handleNestedChange = (category, field, value) => {
    setDesignData(prevData => ({
      ...prevData,
      [category]: {
        ...prevData[category],
        [field]: value
      }
    }));
  };

  const validateInputs = () => {
    const newErrors = {};
    
    // Validate design speed
    if (designData.designSpeed < 60 || designData.designSpeed > 120) {
      newErrors.speed = 'Design speed must be between 60 and 120 km/h';
    }

    // Validate curve radius
    const minRadius = DESIGN_STANDARDS.minRadius[designData.designSpeed] || 0;
    if (designData.curve.radius < minRadius) {
      newErrors.radius = `Curve radius must be at least ${minRadius}m for ${designData.designSpeed}km/h`;
    }

    // Validate grade
    const maxGrade = DESIGN_STANDARDS.maxGrade[designData.terrainType];
    if (designData.grade.gradient > maxGrade) {
      newErrors.grade = `Maximum grade for ${designData.terrainType} terrain is ${maxGrade}%`;
    }

    // Validate Vertical Curve K value
    const { g1, g2, kValue } = designData.grade;
    const isCrest = (g2 - g1) < 0;
    const minKStandard = isCrest 
        ? (DESIGN_STANDARDS.minK.crest[designData.designSpeed] || 0)
        : (DESIGN_STANDARDS.minK.sag[designData.designSpeed] || 0);
        
    if (kValue < minKStandard) {
        newErrors.kValue = `K value (${kValue}) is less than minimum required (${minKStandard}) for ${designData.designSpeed} km/h ${isCrest ? 'crest' : 'sag'} curve.`;
    }

    // Validate Grade Magnitudes (optional but good practice)
    if (Math.abs(g1) > maxGrade || Math.abs(g2) > maxGrade) {
      newErrors.gradeMagnitude = `Grade magnitude exceeds maximum (${maxGrade}%) for ${designData.terrainType} terrain.`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateDesign = () => {
    if (!validateInputs()) return;

    try {
      const horizontalElements = calculateHorizontalCurve();
      const verticalElements = calculateVerticalCurve(); // Calculate vertical first
      // Pass vertical results to sight distance calculation if needed
      const sightDistances = calculateSightDistances(horizontalElements, verticalElements); 
      const crossSectionElements = calculateCrossSection();
      
      // ... rest of calculateDesign ...
      // Update recommendations based on new checks
      const recommendations = generateRecommendations({
        horizontalElements,
        verticalElements,
        sightDistances,
        crossSectionElements
      });

      setResults({
        horizontalAlignment: horizontalElements,
        verticalAlignment: verticalElements,
        sightDistances, // Update with new structure
        crossSection: crossSectionElements,
        recommendations, // Update with new recommendations
        safetyAnalysis: performSafetyAnalysis({ horizontalAlignment: horizontalElements, verticalAlignment: verticalElements, sightDistances })
      });

    } catch (error) {
      console.error("Calculation Error:", error); // Log error for debugging
      setErrors({ calculation: `Error calculating geometric design: ${error.message}` });
    }
  };

  const calculateHorizontalCurve = () => {
    const { radius, superelevation, deflectionAngle } = designData.curve;
    const { designSpeed } = designData;
    const { numberOfLanes } = designData.crossSection; // Needed for runoff

    // Validate superelevation input
    if (superelevation > DESIGN_STANDARDS.maxSuperelevation) {
        // Throw error or handle validation - maybe better in validateInputs
        console.warn(`Input superelevation ${superelevation}% exceeds max ${DESIGN_STANDARDS.maxSuperelevation}%`);
        // Could cap it at maxSuperelevation for calculation
    }
    
    // Get appropriate side friction factor
    const f_max = DESIGN_STANDARDS.maxSideFriction[designSpeed] || 0.14; // Default if speed not listed
    
    // Calculate minimum radius using max 'e' and max 'f'
    const e_max = DESIGN_STANDARDS.maxSuperelevation / 100;
    const minR_standard = (designSpeed ** 2) / (127 * (e_max + f_max));

    // Calculate side friction demand for the *actual* radius and *actual* superelevation
    const e_actual = superelevation / 100;
    const f_demand = (designSpeed**2 / (127 * radius)) - e_actual;

    // Check if friction demand exceeds max allowable
    let frictionDemandOk = f_demand <= f_max;
    
    // Calculate tangent length (T)
    const T = radius * Math.tan(deflectionAngle * Math.PI / 360);
    
    // Calculate length of curve (L_curve)
    const L_curve = (Math.PI * radius * deflectionAngle) / 180; // Correct formula using radians directly or deg*pi/180
    
    // Calculate external distance (E)
    const E = radius * (1 / Math.cos(deflectionAngle * Math.PI / 360) - 1);

    // Calculate Superelevation Runoff Length (Lr) - AASHTO Method 
    // Lr = (w * n1 * ed * bw) / delta
    // w = lane width, n1 = number of lanes rotated, ed = design superelevation rate (%)
    // bw = adjustment factor (1.0 for 2 lanes), delta = max relative gradient (%)
    const w = designData.crossSection.laneWidth;
    const n1 = numberOfLanes; // Assumes all lanes are rotated
    const ed = superelevation; // Use actual design 'e'
    const bw = 1.0; // Adjustment factor for 2 lanes rotated
    const delta = DESIGN_STANDARDS.maxRelativeGradient; // Max relative gradient (%) defined over a length (e.g., 30m)
    // Need to adjust delta based on units (e.g., % per meter if Lr is in meters)
    // Example: If delta is 0.5% per 30m, per meter it's delta/30 %/m
    const delta_per_meter = delta / 30; // Use the delta variable (Adjust '30' if standard definition differs)
    const Lr = (w * n1 * ed * bw) / delta_per_meter; 

    // Calculate Tangent Runout Length (Lt)
    const normalCrownRate = designData.crossSection.crossSlope; // %
    const Lt = (normalCrownRate / ed) * Lr;

    // Total Transition Length (Tangent Runout + Runoff)
    const totalTransitionLength = Lt + Lr;

    return {
      minRadiusStandard: minR_standard, // Min radius based on max e and f
      actualRadius: radius,
      sideFrictionDemand: f_demand,
      sideFrictionMax: f_max,
      frictionDemandOk: frictionDemandOk,
      tangentLength: T,
      curveLength: L_curve,
      externalDistance: E,
      superelevationRunoff_Lr: Lr,
      tangentRunout_Lt: Lt,
      totalTransitionLength: totalTransitionLength
    };
  };

  const calculateVerticalCurve = () => {
    const { g1, g2, kValue, pvcStation, pvcElevation } = designData.grade;
    const { designSpeed } = designData;
    
    // Algebraic difference in grades (%)
    const A = Math.abs(g2 - g1); 
    
    // Determine curve type and minimum K
    const isCrest = (g2 - g1) < 0;
    const minKStandard = isCrest 
        ? (DESIGN_STANDARDS.minK.crest[designSpeed] || 0)
        : (DESIGN_STANDARDS.minK.sag[designSpeed] || 0);

    // Calculate curve length based on provided K value
    const L = kValue * A; 
    
    // Calculate station and elevation of PVI (Point of Vertical Intersection)
    const pviStation = pvcStation + L / 2;
    const pviElevation = pvcElevation + (g1 / 100) * (L / 2);

    // Calculate station and elevation of PVT (Point of Vertical Tangency)
    const pvtStation = pvcStation + L;
    const pvtElevation = pviElevation + (g2 / 100) * (L / 2);

    // Calculate external tangent offset (E) at PVI
    const E_offset = (A * L) / 800; // Vertical distance from PVI to curve

    // Calculate location of high/low point (distance from PVC)
    let highLowPointDist = 0;
    let highLowPointElev = null;
    if (g1 * g2 < 0) { // High/low point occurs within the curve only if grades change sign
        highLowPointDist = -g1 * L / (g2 - g1);
        if (highLowPointDist >= 0 && highLowPointDist <= L) {
             // Elevation = PVC Elev + G1*x + (A/(200*L))*x^2
             highLowPointElev = pvcElevation + (g1 / 100) * highLowPointDist + ( (g2 - g1) / (200 * L) ) * Math.pow(highLowPointDist, 2);
        } else {
             highLowPointDist = (g1 > 0) ? 0 : L; // High/low point is at PVC or PVT if signs match or one is zero
             highLowPointElev = (g1 > 0) ? pvcElevation : pvtElevation;
        }
    } else {
         highLowPointDist = (g1 > 0) ? 0 : L; // High/low point is at PVC or PVT
         highLowPointElev = (g1 > 0) ? pvcElevation : pvtElevation;
    }


    return {
      type: isCrest ? 'Crest' : 'Sag',
      algebraicDifference: A,
      minKRequired: minKStandard,
      actualK: kValue,
      calculatedLength: L,
      pvcStation: pvcStation,
      pvcElevation: pvcElevation,
      pviStation: pviStation,
      pviElevation: pviElevation,
      pvtStation: pvtStation,
      pvtElevation: pvtElevation,
      tangentOffset_E: E_offset,
      highLowPointLocation: highLowPointDist, // Distance from PVC
      highLowPointElevation: highLowPointElev
    };
  };

  const calculateSightDistances = (horizontalResults, verticalResults) => {
    const { designSpeed } = designData;
    const { g1 } = designData.grade; // Only g1 is needed here
    const { radius } = designData.curve;
    
    // --- Stopping Sight Distance (SSD) ---
    const t = 2.5; // reaction time (s) - AASHTO standard
    const a = 3.4; // deceleration rate (m/s²) - AASHTO standard
    const gradePercent = g1; // Use initial grade for SSD calculation
    
    const v_mps = designSpeed / 3.6; // convert km/h to m/s
    // AASHTO Formula (Metric): SSD = 0.278*V*t + V^2 / (254 * (a/9.81 +/- G)) - Using m/s directly is simpler:
    // Adjust for grade (approximated here, more precise formula involves friction coefficient)
    // A simpler common formula: SSD = v*t + v^2 / (2*g*(f+/-G)) where f=a/g
    const frictionCoefficient = a / 9.81; 
    const ssd_adjusted = (v_mps * t) + (v_mps ** 2 / (2 * 9.81 * (frictionCoefficient + gradePercent / 100)));
    
    const requiredSSD = Math.ceil(ssd_adjusted);

    // --- Passing Sight Distance (PSD) ---
    // AASHTO PSD is complex, based on speeds, accelerations, lengths.
    // Provide reference or a note about complexity.
    // Example: Rough estimate based on older standards or simplified models.
    const psd_estimate = designSpeed * 7; // Very rough estimate - state this clearly
    const requiredPSD = `~${Math.ceil(psd_estimate)}m (Estimate - Refer to AASHTO)`; 

    // --- Decision Sight Distance (DSD) ---
    // AASHTO DSD depends on avoidance maneuver type (A-F).
    // Example for Avoidance Maneuver A (Stop on rural road): t=3.0s
    const dsd_t = 3.0; 
    const dsd_estimate = (v_mps * dsd_t) + (v_mps ** 2 / (2 * a)); // Similar to SSD but longer reaction time
    const requiredDSD = `~${Math.ceil(dsd_estimate)}m (Estimate for Stop Maneuver - Refer to AASHTO)`;

    // --- Sight Distance Checks on Curves ---
    let horizontalSightLimited = false;
    let verticalSightLimited = false;
    let limitingSSD_Horizontal = Infinity;
    let limitingSSD_Vertical = Infinity;

    // Horizontal Curve Sight Distance (Middle Ordinate - M)
    // M = R * (1 - cos(28.65 * SSD / R)) - Need to solve for SSD given R and M (lateral clearance)
    // Simplified check: Does the required SSD fit? Assume a typical lateral clearance (e.g., 5m)
    const lateralClearance_M = 5.0; // Example lateral clearance (m) from centerline to obstruction
    if (radius > 0) {
        // Calculate SSD limited by M and R: SSD = (R / 28.65) * acos(1 - M / R) * 2 
        // Note: acos input must be between -1 and 1. M must be < R.
        if (lateralClearance_M < radius) {
             limitingSSD_Horizontal = (radius / 28.65) * Math.acos(1 - lateralClearance_M / radius) * 2; // Formula uses degrees
             if (limitingSSD_Horizontal < requiredSSD) {
                 horizontalSightLimited = true;
             }
        }
    }

    // Vertical Curve Sight Distance
    const h1 = 1.08; // Driver eye height (m) - AASHTO SSD
    const h2 = 0.60; // Object height (m) - AASHTO SSD tail lights
    if (verticalResults.type === 'Crest' && verticalResults.calculatedLength > 0) {
        const A = verticalResults.algebraicDifference;
        // Check if SSD > L or SSD < L
        // If SSD < L: L = A * SSD^2 / (200 * (sqrt(h1) + sqrt(h2))^2) => SSD = sqrt(L * 200 * (sqrt(h1)+sqrt(h2))^2 / A)
        limitingSSD_Vertical = Math.sqrt(verticalResults.calculatedLength * 200 * Math.pow(Math.sqrt(h1) + Math.sqrt(h2), 2) / A);
        if (limitingSSD_Vertical < requiredSSD) { // Assumes SSD < L case is limiting
             // If SSD > L: L = 2*SSD - (200 * (sqrt(h1)+sqrt(h2))^2 / A) => SSD = (L + (200 * (sqrt(h1)+sqrt(h2))^2 / A)) / 2
             let limitingSSD_Vertical_case2 = (verticalResults.calculatedLength + (200 * Math.pow(Math.sqrt(h1) + Math.sqrt(h2), 2) / A)) / 2;
             // The smaller SSD governs if both formulas were applied blindly, but we check requiredSSD against the curve's capacity
             if (requiredSSD > verticalResults.calculatedLength) { // Check if SSD > L case applies
                 limitingSSD_Vertical = limitingSSD_Vertical_case2;
             } // else the SSD < L case calculation holds.
             
             if (limitingSSD_Vertical < requiredSSD) {
                 verticalSightLimited = true;
             }
        }
    } else if (verticalResults.type === 'Sag' && verticalResults.calculatedLength > 0) {
        // Sag curve sight distance (Headlight criteria)
        // Using AASHTO K value check is simpler: L = A*K. If K < required K for SSD, sight distance is limited.
        // Required K for SSD (Sag): K = SSD^2 / (120 + 3.5*SSD) - Approximate AASHTO formula
        const requiredK_sag_ssd = requiredSSD**2 / (120 + 3.5*requiredSSD); // Check this formula source
        if (verticalResults.actualK < requiredK_sag_ssd) {
             verticalSightLimited = true;
             // Estimate the limiting SSD based on the provided K
             // Solve K = SSD^2 / (120 + 3.5*SSD) for SSD given K (quadratic)
             // K*SSD^2 - 3.5*K*SSD - 120*K = 0 -> Use quadratic formula for SSD
             const qa = 1; // Coefficient for SSD^2 (after dividing by K)
             const qb = -3.5; // Coefficient for SSD
             const qc = -120; // Constant term
             limitingSSD_Vertical = ( -qb + Math.sqrt(qb**2 - 4*qa*qc) ) / (2*qa); // Use K=verticalResults.actualK implicitly
             // This formula seems simplified/incorrect. Let's stick to comparing K values.
             limitingSSD_Vertical = `K=${verticalResults.actualK} < Required K for SSD`; // Indicate limitation
        }
    }


    return {
      requiredStopping: requiredSSD,
      requiredPassing: requiredPSD, // Label as estimate
      requiredDecision: requiredDSD, // Label as estimate
      horizontalCurveLimited: horizontalSightLimited,
      limitingSSD_Horizontal: horizontalSightLimited ? Math.floor(limitingSSD_Horizontal) : null,
      verticalCurveLimited: verticalSightLimited,
      // Corrected ternary operator: Added ': null' for the outer condition and return original value if not number
      limitingSSD_Vertical: verticalSightLimited ? (typeof limitingSSD_Vertical === 'number' ? Math.floor(limitingSSD_Vertical) : limitingSSD_Vertical) : null, 
    };
  };

  const calculateCrossSection = () => {
    const { laneWidth, numberOfLanes, shoulderWidth, medianWidth, crossSlope } = designData.crossSection;
    
    return {
      totalWidth: (laneWidth * numberOfLanes * 2) + (shoulderWidth * 2) + medianWidth,
      pavementWidth: laneWidth * numberOfLanes * 2,
      drainageWidth: shoulderWidth * 2,
      crossSlopeFactor: crossSlope / 100
    };
  };

  const generateRecommendations = (data) => {
    const recommendations = [];
    
    // Horizontal Radius Check
    if (data.horizontalElements.actualRadius < data.horizontalElements.minRadius) {
      recommendations.push({
        text: `Increase horizontal curve radius to minimum ${data.horizontalElements.minRadius.toFixed(1)}m.`,
        priority: "high"
      });
    }

    // Vertical K Value Check
    if (data.verticalElements.actualK < data.verticalElements.minKRequired) {
         recommendations.push({
             text: `Increase vertical curve K value to minimum ${data.verticalElements.minKRequired} for ${data.verticalElements.type} curve.`,
             priority: "high"
         });
    }
    
    // Sight Distance Checks
    if (data.sightDistances.horizontalCurveLimited) {
      recommendations.push({
        text: `Stopping sight distance on horizontal curve limited to approx. ${data.sightDistances.limitingSSD_Horizontal}m. Increase radius or remove obstruction.`,
        priority: "medium"
      });
    }
     if (data.sightDistances.verticalCurveLimited) {
      recommendations.push({
        text: `Stopping sight distance on vertical curve limited (Available SSD approx. ${data.sightDistances.limitingSSD_Vertical}m or K value insufficient). Increase K value/curve length.`,
        priority: "medium"
      });
    }
    
    // Add more recommendations based on other checks (e.g., max grade)

    return recommendations;
  };
  
  const performSafetyAnalysis = (calculatedResults) => { // Pass calculated results
      // Basic checks comparing actual vs minimums/maximums
      const radiusCheck = calculatedResults.horizontalAlignment.actualRadius >= calculatedResults.horizontalAlignment.minRadius;
      const kCheck = calculatedResults.verticalAlignment.actualK >= calculatedResults.verticalAlignment.minKRequired;
      const gradeCheck = Math.abs(designData.grade.g1) <= DESIGN_STANDARDS.maxGrade[designData.terrainType] && Math.abs(designData.grade.g2) <= DESIGN_STANDARDS.maxGrade[designData.terrainType];
      const ssdHorizontalCheck = !calculatedResults.sightDistances.horizontalCurveLimited;
      const ssdVerticalCheck = !calculatedResults.sightDistances.verticalCurveLimited;

      return {
          'Horizontal Radius': radiusCheck ? 'Acceptable' : 'Below Minimum',
          'Vertical K Value': kCheck ? 'Acceptable' : 'Below Minimum',
          'Grade Magnitude': gradeCheck ? 'Acceptable' : 'Exceeds Maximum',
          'Horizontal SSD': ssdHorizontalCheck ? 'Adequate' : 'Limited',
          'Vertical SSD': ssdVerticalCheck ? 'Adequate' : 'Limited',
      };
  };

  return (
    <div className="highway-geometric-calculator">
      <h2>Highway Geometric Design Calculator</h2>
      
      {Object.keys(errors).length > 0 && (
        <div className="errors-section">
          {Object.values(errors).map((error, index) => (
            <div key={index} className="error-message">
              {error}
            </div>
          ))}
        </div>
      )}
      
      <div className="calculator-controls">
        <div className="input-sections">
          {/* Design Speed and Traffic Section */}
          <div className="input-section">
            <h3>Design Parameters</h3>
            <div className="input-group">
              <label>Design Speed (km/h):</label>
              <input
                type="number"
                value={designData.designSpeed}
                onChange={(e) => setDesignData({
                  ...designData,
                  designSpeed: parseFloat(e.target.value) || 0 // Ensure it's a number
                })}
              />
            </div>
            <div className="input-group">
              <label>AADT (Vehicles/Day):</label>
              <input
                type="number"
                value={designData.aadt}
                onChange={(e) => setDesignData({
                  ...designData,
                  aadt: parseInt(e.target.value) || 0 // Ensure it's an integer
                })}
              />
            </div>
            <div className="input-group">
              <label>Terrain Type:</label>
              <select
                value={designData.terrainType}
                onChange={(e) => setDesignData({
                  ...designData,
                  terrainType: e.target.value
                })}
              >
                <option value="flat">Flat</option>
                <option value="rolling">Rolling</option>
                <option value="mountainous">Mountainous</option>
              </select>
            </div>
          </div>

          {/* Horizontal Alignment Section */}
          <div className="input-section">
            <h3>Horizontal Alignment</h3>
            <div className="input-group">
              <label>Curve Radius (m):</label>
              <input
                type="number"
                value={designData.curve.radius}
                onChange={(e) => handleNestedChange('curve', 'radius', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="input-group">
              <label>Superelevation (%):</label>
              <input
                type="number"
                step="0.1"
                value={designData.curve.superelevation}
                onChange={(e) => handleNestedChange('curve', 'superelevation', parseFloat(e.target.value) || 0)}
              />
            </div>
             <div className="input-group">
              <label>Deflection Angle (degrees):</label>
              <input
                type="number"
                step="0.1"
                value={designData.curve.deflectionAngle}
                onChange={(e) => handleNestedChange('curve', 'deflectionAngle', parseFloat(e.target.value) || 0)}
              />
            </div>
            {/* Note: Curve length is often calculated or a result of spiral design, not a primary input here */}
          </div>

          {/* Vertical Alignment Section */}
          <div className="input-section">
            <h3>Vertical Alignment</h3>
            <div className="input-group">
              <label>Incoming Grade G1 (%):</label>
              <input
                type="number"
                step="0.1"
                value={designData.grade.g1}
                onChange={(e) => handleNestedChange('grade', 'g1', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="input-group">
              <label>Outgoing Grade G2 (%):</label>
              <input
                type="number"
                step="0.1"
                value={designData.grade.g2}
                onChange={(e) => handleNestedChange('grade', 'g2', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="input-group">
              <label>K Value:</label>
              <input
                type="number"
                value={designData.grade.kValue}
                onChange={(e) => handleNestedChange('grade', 'kValue', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="input-group optional">
              <label>PVC Station:</label>
              <input
                type="number"
                value={designData.grade.pvcStation}
                onChange={(e) => handleNestedChange('grade', 'pvcStation', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="input-group optional">
              <label>PVC Elevation (m):</label>
              <input
                type="number"
                step="0.01"
                value={designData.grade.pvcElevation}
                onChange={(e) => handleNestedChange('grade', 'pvcElevation', parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          {/* Cross Section Section */}
          <div className="input-section">
            <h3>Cross Section</h3>
            <div className="input-group">
              <label>Lane Width (m):</label>
              <input
                type="number"
                step="0.1"
                value={designData.crossSection.laneWidth}
                onChange={(e) => handleNestedChange('crossSection', 'laneWidth', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="input-group">
              <label>Number of Lanes (per direction):</label>
              <input
                type="number"
                step="1"
                value={designData.crossSection.numberOfLanes}
                onChange={(e) => handleNestedChange('crossSection', 'numberOfLanes', parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="input-group">
              <label>Shoulder Width (m):</label>
              <input
                type="number"
                step="0.1"
                value={designData.crossSection.shoulderWidth}
                onChange={(e) => handleNestedChange('crossSection', 'shoulderWidth', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="input-group">
              <label>Median Width (m):</label>
              <input
                type="number"
                step="0.1"
                value={designData.crossSection.medianWidth}
                onChange={(e) => handleNestedChange('crossSection', 'medianWidth', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="input-group">
              <label>Cross Slope (%):</label>
              <input
                type="number"
                step="0.1"
                value={designData.crossSection.crossSlope}
                onChange={(e) => handleNestedChange('crossSection', 'crossSlope', parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>
        </div>

        <button 
          className="calculate-button"
          onClick={calculateDesign}
        >
          Calculate Design
        </button>

        {/* Results Display */}
        {results && (
          <div className="results-section">
            <h3>Geometric Design Results</h3>
            
            <div className="results-grid">
              {/* Horizontal Alignment Results */}
              <div className="result-item">
                <h4>Horizontal Alignment</h4>
                <div className="horizontal-diagram">
                  {/* SVG visualization of horizontal curve */}
                </div>
                <div className="metrics-grid">
                  {Object.entries(results.horizontalAlignment).map(([key, value]) => (
                    <div key={key} className="metric">
                      <span className="metric-label">{key}:</span>
                      <span className="metric-value">
                        {typeof value === 'number' ? value.toFixed(2) : value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Vertical Alignment Results */}
              <div className="result-item">
                <h4>Vertical Alignment</h4>
                <div className="vertical-diagram">
                  {/* SVG visualization of vertical curve */}
                </div>
                <div className="metrics-grid">
                  {Object.entries(results.verticalAlignment).map(([key, value]) => (
                    <div key={key} className="metric">
                      <span className="metric-label">{key}:</span>
                      <span className="metric-value">
                        {typeof value === 'number' ? value.toFixed(2) : value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sight Distances */}
              <div className="result-item">
                <h4>Sight Distances</h4>
                <div className="sight-distances">
                  {Object.entries(results.sightDistances).map(([type, distance]) => (
                    <div key={type} className="distance-item">
                      <span className="distance-type">{type}:</span>
                      <span className="distance-value">{distance}m</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cross Section */}
              <div className="result-item">
                <h4>Cross Section</h4>
                <div className="cross-section-diagram">
                  {/* SVG visualization of cross section */}
                </div>
                <div className="metrics-grid">
                  {Object.entries(results.crossSection).map(([key, value]) => (
                    <div key={key} className="metric">
                      <span className="metric-label">{key}:</span>
                      <span className="metric-value">
                        {typeof value === 'number' ? value.toFixed(2) : value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Safety Analysis */}
              <div className="result-item">
                <h4>Safety Analysis</h4>
                <div className="safety-metrics">
                  {Object.entries(results.safetyAnalysis).map(([factor, rating]) => (
                    <div key={factor} className="safety-factor">
                      <span className="factor-name">{factor}</span>
                      <div className={`safety-rating ${rating.toLowerCase()}`}>
                        {rating}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              <div className="result-item recommendations">
                <h4>Design Recommendations</h4>
                <ul className="recommendations-list">
                  {results.recommendations.map((rec, index) => (
                    <li key={index} className={`priority-${rec.priority}`}>
                      {rec.text}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HighwayGeometricCalculator;