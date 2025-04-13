import React, { useState } from 'react';
import './BeamCalculator.css'; // Import the CSS file for styling
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

const BeamCalculator = () => {
  const [length, setLength] = useState('');
  const [loads, setLoads] = useState([{ type: 'point', position: 0, magnitude: 0, startPosition: 0, endPosition: 0 }]);
  const [supportType, setSupportType] = useState('simply-supported'); // Simply Supported by default
  const [E, setE] = useState(210); // Default E = 210 GPa
  const [I, setI] = useState(10000); // Default I = 10000 cm^4
  const [moment, setMoment] = useState(null);
  const [shear, setShear] = useState(null);
  const [deflection, setDeflection] = useState(null);
  const [showBeamDiagram, setShowBeamDiagram] = useState(true);
  const canvasRef = useRef(null);

  // Add this state and function for cross-section selection
  const [crossSection, setCrossSection] = useState('rectangle');
  const [sectionDimensions, setSectionDimensions] = useState({
    width: 0.2,  // m
    height: 0.3, // m
    diameter: 0.2, // m
    flangeWidth: 0.2, // m
    flangeThickness: 0.02, // m
    webHeight: 0.25, // m
    webThickness: 0.01, // m
  });

  const calculateMomentOfInertia = () => {
    // Convert to m^4
    const factor = 1e-8; // Convert cm^4 to m^4
    
    if (crossSection === 'custom') {
      return parseFloat(I) * factor;
    }
    
    switch (crossSection) {
      case 'rectangle':
        return (sectionDimensions.width * Math.pow(sectionDimensions.height, 3)) / 12; // m^4
      case 'circle':
        return (Math.PI * Math.pow(sectionDimensions.diameter / 2, 4)) / 4; // m^4
      case 'i-beam':
        // Simplified I-beam calculation
        const flangeArea = sectionDimensions.flangeWidth * sectionDimensions.flangeThickness;
        
        // Moment of inertia about neutral axis
        const flangeInertia = 2 * (sectionDimensions.flangeWidth * Math.pow(sectionDimensions.flangeThickness, 3) / 12 
          + flangeArea * Math.pow(sectionDimensions.webHeight / 2 + sectionDimensions.flangeThickness / 2, 2));
        const webInertia = sectionDimensions.webThickness * Math.pow(sectionDimensions.webHeight, 3) / 12;
        
        return flangeInertia + webInertia; // m^4
      default:
        return parseFloat(I) * factor;
    }
  };

  const handleLoadChange = (index, field, value) => {
    const newLoads = [...loads];
    newLoads[index][field] = value;
    setLoads(newLoads);
  };

  const addLoad = () => {
    setLoads([...loads, { type: 'point', position: 0, magnitude: 0, startPosition: 0, endPosition: 0 }]);
  };

  const removeLoad = (index) => {
    const newLoads = loads.filter((_, i) => i !== index);
    setLoads(newLoads);
  };

  const validateInputs = () => {
    if (isNaN(parseFloat(length)) || parseFloat(length) <= 0) {
      alert('Please enter a valid positive number for Length of Beam.');
      return false;
    }
    if (isNaN(parseFloat(E)) || parseFloat(E) <= 0) {
      alert('Please enter a valid positive number for Elastic Modulus (E).');
      return false;
    }
    if (isNaN(parseFloat(I)) || parseFloat(I) <= 0) {
      alert('Please enter a valid positive number for Moment of Inertia (I).');
      return false;
    }
    for (let i = 0; i < loads.length; i++) {
      const load = loads[i];
      if (isNaN(parseFloat(load.magnitude)) || parseFloat(load.magnitude) <= 0) {
        alert(`Please enter a valid positive number for Load Magnitude at Load ${i + 1}.`);
        return false;
      }
      if (load.type === 'point' && (isNaN(parseFloat(load.position)) || parseFloat(load.position) < 0 || parseFloat(load.position) > parseFloat(length))) {
        alert(`Please enter a valid position for Point Load at Load ${i + 1}.`);
        return false;
      }
      if (load.type === 'udl' && (isNaN(parseFloat(load.startPosition)) || parseFloat(load.startPosition) < 0 || parseFloat(load.startPosition) > parseFloat(length) || isNaN(parseFloat(load.endPosition)) || parseFloat(load.endPosition) < 0 || parseFloat(load.endPosition) > parseFloat(length) || parseFloat(load.startPosition) >= parseFloat(load.endPosition))) {
        alert(`Please enter valid start and end positions for UDL at Load ${i + 1}.`);
        return false;
      }
    }
    return true;
  };

  const calculateResults = () => {
    if (!validateInputs()) {
      return;
    }

    const L = parseFloat(length);
    const numPoints = 101; // Number of points to calculate along the beam
    const step = L / (numPoints - 1);

    // Initialize arrays for superposition
    let shearData = Array(numPoints).fill(0).map((_, i) => ({ position: i * step, value: 0 }));
    let momentData = Array(numPoints).fill(0).map((_, i) => ({ position: i * step, value: 0 }));
    let deflectionData = Array(numPoints).fill(0).map((_, i) => ({ position: i * step, value: 0 }));

    const E_Pa = parseFloat(E) * 1e9; // Convert GPa to Pa
    const I_m4 = calculateMomentOfInertia(); // Use calculated or custom I in m^4

    if (E_Pa <= 0 || I_m4 <= 0) {
        alert("Elastic Modulus (E) and Moment of Inertia (I) must be positive.");
        return;
    }
    const EI = E_Pa * I_m4; // N·m²

    // Apply superposition for each load
    loads.forEach(load => {
      const w = parseFloat(load.magnitude) * 1000; // Convert kN or kN/m to N or N/m
      const P = parseFloat(load.magnitude) * 1000; // Convert kN to N
      const a = parseFloat(load.position); // For point load
      const udl_a = parseFloat(load.startPosition); // For UDL
      const udl_b = parseFloat(load.endPosition); // For UDL

      for (let i = 0; i < numPoints; i++) {
        const x = shearData[i].position;
        let shearValue = 0;
        let momentValue = 0;
        let deflectionValue = 0;

        // --- Simply Supported ---
        if (supportType === 'simply-supported') {
          if (load.type === 'point') {
            const b = L - a;
            const R1 = (P * b) / L;
            const R2 = (P * a) / L;

            // Shear
            if (x < a) shearValue = R1;
            else if (x > a) shearValue = -R2;
            else shearValue = R1; // At the point load, take value just before

            // Moment
            if (x <= a) momentValue = R1 * x;
            else momentValue = R1 * x - P * (x - a); // Or R2 * (L - x)

            // Deflection
            if (EI > 0) {
                if (x <= a) deflectionValue = (P * b * x) / (6 * EI * L) * (L*L - b*b - x*x);
                else deflectionValue = (P * a * (L - x)) / (6 * EI * L) * (L*L - a*a - (L-x)*(L-x));
            }

          } else if (load.type === 'udl') {
            const loadLength = udl_b - udl_a;
            const totalLoad = w * loadLength;
            const R1 = (totalLoad * (L - (udl_a + udl_b) / 2)) / L;
            const R2 = totalLoad - R1;

            // Shear
            if (x < udl_a) shearValue = R1;
            else if (x >= udl_a && x <= udl_b) shearValue = R1 - w * (x - udl_a);
            else shearValue = -R2;

            // Moment
            if (x < udl_a) momentValue = R1 * x;
            else if (x >= udl_a && x <= udl_b) momentValue = R1 * x - w * (x - udl_a) * (x - udl_a) / 2;
            else momentValue = R2 * (L - x); // Simpler form for x > b

            // Deflection (Using superposition/integration - complex, simplified below)
            // Note: Exact deflection formula for partial UDL is complex. Using an approximation or specific case formula.
            // The formula below is more accurate for full UDL (a=0, b=L)
             if (EI > 0) {
                 // General formula using Macaulay's method concept (approximate for partial UDL)
                 const term1 = R1 * x * x * x / 6;
                 let term2 = 0;
                 if (x > udl_a) term2 = w * Math.pow(x - udl_a, 4) / 24;
                 let term3 = 0;
                 if (x > udl_b) term3 = -w * Math.pow(x - udl_b, 4) / 24; // Correction term if needed

                 // Constants of integration C1, C2. For simply supported, deflection(0)=0, deflection(L)=0
                 // C2 = 0 (since deflection(0)=0)
                 // C1 derived from deflection(L)=0
                 const R1_term_L = R1 * L*L*L / 6;
                 let w_term_L_a = 0; if (L > udl_a) w_term_L_a = w * Math.pow(L - udl_a, 4) / 24;
                 let w_term_L_b = 0; if (L > udl_b) w_term_L_b = -w * Math.pow(L - udl_b, 4) / 24; // Correction term if needed

                 const C1 = -(R1_term_L - w_term_L_a + w_term_L_b) / L;

                 deflectionValue = (term1 - term2 + term3 + C1 * x) / EI;
             }
          }
        }
        // --- Cantilever (Fixed at x=0) ---
        else if (supportType === 'cantilever') {
          if (load.type === 'point') {
            const R_fixed = P; // Reaction force at fixed end
            const M_fixed = -P * a; // Reaction moment at fixed end

            // Shear
            if (x < a) shearValue = P; // Positive shear convention
            else shearValue = 0;

            // Moment (Negative for hogging)
            if (x <= a) momentValue = M_fixed + R_fixed * x; // = -P*a + P*x = -P*(a-x)
            else momentValue = 0;

            // Deflection
            if (EI > 0) {
                if (x <= a) deflectionValue = (P * x*x) / (6 * EI) * (3*a - x);
                else deflectionValue = (P * a*a) / (6 * EI) * (3*x - a);
            }

          } else if (load.type === 'udl') {
            const loadLength = udl_b - udl_a;
            const R_fixed = w * loadLength;
            const M_fixed = -w * loadLength * ((udl_a + udl_b) / 2);

            // Shear
            if (x < udl_a) shearValue = R_fixed;
            else if (x >= udl_a && x <= udl_b) shearValue = R_fixed - w * (x - udl_a); // = w*(udl_b - x)
            else shearValue = 0;

            // Moment (Negative for hogging)
            if (x < udl_a) momentValue = M_fixed + R_fixed * x;
            else if (x >= udl_a && x <= udl_b) momentValue = M_fixed + R_fixed * x - w * (x - udl_a)*(x - udl_a) / 2; // = -w*(udl_b-x)^2 / 2
            else momentValue = 0;

            // Deflection
            if (EI > 0) {
                // Declare constants needed in multiple blocks
                let C1_prime, C2_prime; 
                
                // Using formulas derived from integration/superposition
                if (x < udl_a) {
                    // ... (previous code for x < udl_a) ...
                    // Match slope and deflection at x=udl_a with previous segment
                    const slope_at_a = (M_fixed * udl_a + R_fixed * udl_a*udl_a / 2) / EI;
                    const defl_at_a = (M_fixed * udl_a*udl_a / 2 + R_fixed * udl_a*udl_a*udl_a / 6) / EI; // defl_at_a is used here
                    C1_prime = slope_at_a - (w * Math.pow(udl_b - udl_a, 3) / (6 * EI)); // Assign value to C1_prime
                    C2_prime = defl_at_a - (-w * Math.pow(udl_b - udl_a, 4) / (24 * EI)) - C1_prime * udl_a; // Assign value to C2_prime
                    deflectionValue = (-w * Math.pow(udl_b - x, 4) / (24 * EI)) + C1_prime * x + C2_prime;

                } else if (x >= udl_a && x <= udl_b) {
                    // Deflection under the load
                    // Integrate M(x) = -w*(udl_b-x)^2 / 2
                    // Slope(x) = w*(udl_b-x)^3 / (6*EI) + C1'
                    // Defl(x) = -w*(udl_b-x)^4 / (24*EI) + C1'*x + C2'
                    // Match slope and deflection at x=udl_a with previous segment
                    const slope_at_a = (M_fixed * udl_a + R_fixed * udl_a*udl_a / 2) / EI;
                    const defl_at_a = (M_fixed * udl_a*udl_a / 2 + R_fixed * udl_a*udl_a*udl_a / 6) / EI; // Keep as const, used below
                    // Assign to the outer C1_prime and C2_prime declared with let
                    C1_prime = slope_at_a - (w * Math.pow(udl_b - udl_a, 3) / (6 * EI)); 
                    C2_prime = defl_at_a - (-w * Math.pow(udl_b - udl_a, 4) / (24 * EI)) - C1_prime * udl_a; 
                    deflectionValue = (-w * Math.pow(udl_b - x, 4) / (24 * EI)) + C1_prime * x + C2_prime;

                } else { // x > udl_b
                    // Deflection after the load. M(x)=0, Shear(x)=0
                    // Slope(x) = C1''
                    // Defl(x) = C1''*x + C2''
                    // Match slope and deflection at x=udl_b with previous segment
                    const slope_at_b = C1_prime; // Now C1_prime is accessible
                    const defl_at_b = C1_prime * udl_b + C2_prime; // Now C1_prime and C2_prime are accessible
                    const C1_double_prime = slope_at_b;
                    const C2_double_prime = defl_at_b - C1_double_prime * udl_b;
                    deflectionValue = C1_double_prime * x + C2_double_prime;
                }
            }
          }
        }
        // --- Fixed ---
        else if (supportType === 'fixed') {
          if (load.type === 'point') {
            const b = L - a;
            // Fixed-end moments
            const M1_fem = -P * a * b * b / (L * L);
            const M2_fem = P * a * a * b / (L * L);
            // Reactions
            const R1 = P * b / L + (M1_fem - M2_fem) / L; // Corrected reaction formula
            const R2 = P * a / L - (M1_fem - M2_fem) / L; // Corrected reaction formula

            // Shear
            if (x < a) shearValue = R1;
            else if (x > a) shearValue = -R2; // R1 - P
            else shearValue = R1; // Value just before load

            // Moment
            if (x <= a) momentValue = M1_fem + R1 * x;
            else momentValue = M1_fem + R1 * x - P * (x - a); // = M2_fem - R2*(L-x)

            // Deflection
            if (EI > 0) {
                // Using standard formulas for fixed beam point load
                if (x <= a) deflectionValue = (P * b*b * x*x) / (6 * EI * L*L*L) * (3*a*L - 3*a*x - b*x);
                else deflectionValue = (P * a*a * (L-x)*(L-x)) / (6 * EI * L*L*L) * (3*b*L - 3*b*(L-x) - a*(L-x));
                 // Alternative form check
                 if (x <= a) deflectionValue = (x*x / (6*EI)) * (M1_fem * 3 + R1 * x); // Incorrect
                 // Using integration M(x)/EI
                 // Slope(x) = (1/EI) * [M1_fem*x + R1*x*x/2] for x < a
                 // Defl(x) = (1/EI) * [M1_fem*x*x/2 + R1*x*x*x/6] for x < a (since slope(0)=0, defl(0)=0)
                 // Slope(x) = (1/EI) * [M1_fem*x + R1*x*x/2 - P*(x-a)*(x-a)/2] + C1' for x > a
                 // Defl(x) = (1/EI) * [M1_fem*x*x/2 + R1*x*x*x/6 - P*(x-a)^3/6] + C1'*x + C2' for x > a
                 // Need C1', C2' by matching slope/defl at x=a
                 const slope_at_a = (M1_fem*a + R1*a*a/2) / EI;
                 const defl_at_a = (M1_fem*a*a/2 + R1*a*a*a/6) / EI;
                 const C1_prime = slope_at_a - (M1_fem*a + R1*a*a/2) / EI; // Should be 0? Check integration
                 // Slope(x) = (1/EI) * integral(M(x)) + C1
                 // Slope(x) for x > a = (1/EI) * [M1_fem*x + R1*x*x/2 - P*(x-a)^2/2] + C1_match
                 // Slope(a) from left = (1/EI) * [M1_fem*a + R1*a*a/2]
                 // Slope(a) from right = (1/EI) * [M1_fem*a + R1*a*a/2] + C1_match
                 // => C1_match = 0
                 // Defl(x) for x > a = (1/EI) * [M1_fem*x*x/2 + R1*x*x*x/6 - P*(x-a)^3/6] + C2_match
                 // Defl(a) from left = (1/EI) * [M1_fem*a*a/2 + R1*a*a*a/6]
                 // Defl(a) from right = (1/EI) * [M1_fem*a*a/2 + R1*a*a*a/6] + C2_match
                 // => C2_match = 0
                 if (x <= a) deflectionValue = (M1_fem*x*x/2 + R1*x*x*x/6) / EI;
                 else deflectionValue = (M1_fem*x*x/2 + R1*x*x*x/6 - P*Math.pow(x-a, 3)/6) / EI;
            }

          } else if (load.type === 'udl') {
            // Correct formulas for Fixed Beam with Partial UDL (w from udl_a to udl_b)
            const a = udl_a; // Rename for formula clarity
            const b = udl_b;
            // Fixed-end moments (Using standard formulas)
            const M1_fem = -(w / (12 * L*L)) * ( Math.pow(L-a, 3) * (L+3*a) - Math.pow(L-b, 3) * (L+3*b) );
            const M2_fem = +(w / (12 * L*L)) * ( Math.pow(b, 3) * (4*L - 3*b) - Math.pow(a, 3) * (4*L - 3*a) );

            // Reactions
            const totalLoad = w * (b - a);
            const centroid = (a + b) / 2;
            const R1 = (totalLoad * (L - centroid)) / L + (M1_fem - M2_fem) / L;
            const R2 = totalLoad - R1;

            // Shear
            if (x < a) shearValue = R1;
            else if (x >= a && x <= b) shearValue = R1 - w * (x - a);
            else shearValue = -R2; // R1 - totalLoad

            // Moment
            if (x < a) momentValue = M1_fem + R1 * x;
            else if (x >= a && x <= b) momentValue = M1_fem + R1 * x - w * Math.pow(x - a, 2) / 2;
            else momentValue = M1_fem + R1 * x - totalLoad * (x - centroid); // Or M2_fem - R2*(L-x)

            // Deflection
            // The exact deflection formula for a partial UDL on a fixed beam is very complex.
            // Setting to 0 as placeholder.
            deflectionValue = 0; // Not implemented due to complexity
          }
        }

        // Add calculated values to the data arrays (Superposition)
        // Convert back N to kN and N.m to kN.m for consistency with inputs/charts
        shearData[i].value += shearValue / 1000;
        momentData[i].value += momentValue / 1000;
        deflectionData[i].value += deflectionValue; // Deflection is already in meters
      }
    });

    // Set state with final superimposed results
    setShear(shearData);
    setMoment(momentData);
    setDeflection(deflectionData);
    calculateStress(); // Calculate stress based on the final moment diagram
  };

  // Add this state
  const [maxStress, setMaxStress] = useState(null);
  const [safetyFactor, setSafetyFactor] = useState(null);
  const [allowableStress, setAllowableStress] = useState(250); // MPa

  // Add this in your calculateResults function, after setting moment, shear and deflection
  const calculateStress = () => {
    // Make sure moment state is updated before calculating stress
    // Use the momentData directly if state update is async
    const finalMomentData = moment; // Use state if available
    if (!finalMomentData || finalMomentData.length === 0) return;

    let maxAbsMoment = 0;
    finalMomentData.forEach(m => {
      if (Math.abs(m.value) > maxAbsMoment) {
        maxAbsMoment = Math.abs(m.value); // Use absolute value for max stress calculation
      }
    });

    // Calculate section modulus based on shape
    const I_m4 = calculateMomentOfInertia(); // m^4
    let sectionModulus = 0;
    let y_max = 0; // Distance from neutral axis to extreme fiber

    if (crossSection === 'rectangle') {
        y_max = sectionDimensions.height / 2;
        sectionModulus = I_m4 / y_max; // m³ (Correct calculation is I/y_max)
    } else if (crossSection === 'circle') {
        y_max = sectionDimensions.diameter / 2;
        sectionModulus = I_m4 / y_max; // m³
    } else if (crossSection === 'i-beam') {
        const totalHeight = sectionDimensions.webHeight + 2 * sectionDimensions.flangeThickness;
        y_max = totalHeight / 2;
        sectionModulus = I_m4 / y_max; // m³
    } else { // Custom I
        // Cannot determine y_max for custom I, use approximation or require input
        // Approximation: Assume symmetric section, estimate height ~ 0.3m -> y_max ~ 0.15m
        y_max = 0.15; // Approximation!
        if (I_m4 > 0) {
            sectionModulus = I_m4 / y_max; // Approximate section modulus
        } else {
            sectionModulus = 0;
        }
    }

    // Add edge case handling
    if (Math.abs(maxAbsMoment) < 1e-9 || sectionModulus <= 1e-12) {
      setMaxStress(0);
      setSafetyFactor(Infinity); // Use Infinity for clarity
      return;
    }

    // Calculate maximum stress in MPa
    // Moment is in kN.m, convert to N.m
    const maxMoment_Nm = maxAbsMoment * 1000;
    const stress_Pa = maxMoment_Nm / sectionModulus; // N/m² (Pa)
    const stress_MPa = stress_Pa / 1e6;
    setMaxStress(stress_MPa);

    // Calculate safety factor
    if (allowableStress > 0 && stress_MPa > 1e-9) { // Avoid division by zero or near-zero stress
        const safety = allowableStress / Math.abs(stress_MPa); // Use absolute stress
        setSafetyFactor(safety);
    } else if (allowableStress > 0) {
        setSafetyFactor(Infinity); // Effectively infinite safety if stress is zero
    } else {
        setSafetyFactor(0); // Safety factor is 0 if allowable stress is 0 or negative
    }
  };

  // Add this function to generate smooth chart data
  const generateChartData = (rawData) => {
    if (!rawData || rawData.length === 0) return [];
    
    // Sort points by position
    const sortedData = [...rawData].sort((a, b) => a.position - b.position);
    
    // Create a dense array of points for smoother curves
    const chartData = [];
    const numPoints = 100;
    const step = parseFloat(length) / numPoints;
    
    // Add start point if not present
    if (sortedData[0].position > 0) {
      chartData.push({ position: 0, value: sortedData[0].value });
    }
    
    // Interpolate between data points
    for (let i = 0; i < sortedData.length - 1; i++) {
      const start = sortedData[i];
      const end = sortedData[i + 1];
      
      chartData.push(start);
      
      // Add interpolated points
      const segmentPoints = Math.max(1, Math.floor((end.position - start.position) / step));
      
      for (let j = 1; j < segmentPoints; j++) {
        const fraction = j / segmentPoints;
        const pos = start.position + (end.position - start.position) * fraction;
        const val = start.value + (end.value - start.value) * fraction;
        
        chartData.push({ position: pos, value: val });
      }
    }
    
    // Add last point
    if (sortedData.length > 0) {
      chartData.push(sortedData[sortedData.length - 1]);
    }
    
    // Add end point if not present
    if (sortedData[sortedData.length - 1].position < length) {
      chartData.push({ 
        position: parseFloat(length), 
        value: sortedData[sortedData.length - 1].value 
      });
    }
    
    return chartData.map(point => ({
      position: typeof point.position === 'number' ? point.position : Number(point.position),
      value: typeof point.value === 'number' ? point.value : Number(point.value)
    }));
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !length || isNaN(parseFloat(length))) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    const margin = 30;
    const beamLength = width - 2 * margin;
    const beamY = height / 2;
    const beamHeight = 20;
    
    // Draw beam
    ctx.fillStyle = '#6c757d';
    ctx.fillRect(margin, beamY - beamHeight / 2, beamLength, beamHeight);
    
    // Draw supports
    if (supportType === 'simply-supported') {
      // Left support (triangle)
      ctx.beginPath();
      ctx.moveTo(margin, beamY + beamHeight/2);
      ctx.lineTo(margin - 15, beamY + beamHeight/2 + 25);
      ctx.lineTo(margin + 15, beamY + beamHeight/2 + 25);
      ctx.closePath();
      ctx.fillStyle = '#343a40';
      ctx.fill();
      
      // Right support (triangle with roller)
      ctx.beginPath();
      ctx.moveTo(width - margin, beamY + beamHeight/2);
      ctx.lineTo(width - margin - 15, beamY + beamHeight/2 + 25);
      ctx.lineTo(width - margin + 15, beamY + beamHeight/2 + 25);
      ctx.closePath();
      ctx.fill();
      
      // Roller
      ctx.beginPath();
      ctx.arc(width - margin, beamY + beamHeight/2 + 10, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#6c757d';
      ctx.fill();
    } else if (supportType === 'cantilever') {
      // Fixed support (left)
      ctx.fillStyle = '#343a40';
      ctx.fillRect(margin - 10, beamY - beamHeight/2 - 20, 10, beamHeight + 40);
      
      // Hatching
      ctx.strokeStyle = '#343a40';
      ctx.beginPath();
      for (let y = beamY - beamHeight/2 - 20; y <= beamY + beamHeight/2 + 20; y += 5) {
        ctx.moveTo(margin - 20, y);
        ctx.lineTo(margin, y);
      }
      ctx.stroke();
    } else if (supportType === 'fixed') {
      // Fixed support (both ends)
      ctx.fillStyle = '#343a40';
      ctx.fillRect(margin - 10, beamY - beamHeight/2 - 20, 10, beamHeight + 40);
      ctx.fillRect(width - margin, beamY - beamHeight/2 - 20, 10, beamHeight + 40);
      
      // Hatching left
      ctx.strokeStyle = '#343a40';
      ctx.beginPath();
      for (let y = beamY - beamHeight/2 - 20; y <= beamY + beamHeight/2 + 20; y += 5) {
        ctx.moveTo(margin - 20, y);
        ctx.lineTo(margin, y);
      }
      ctx.stroke();
      
      // Hatching right
      ctx.beginPath();
      for (let y = beamY - beamHeight/2 - 20; y <= beamY + beamHeight/2 + 20; y += 5) {
        ctx.moveTo(width - margin - 10, y);
        ctx.lineTo(width - margin + 10, y);
      }
      ctx.stroke();
    }
    
    // Draw loads
    loads.forEach(load => {
      if (load.type === 'point' && !isNaN(load.position) && !isNaN(load.magnitude)) {
        const x = margin + (load.position / parseFloat(length)) * beamLength;
        
        // Arrow
        ctx.beginPath();
        ctx.moveTo(x, beamY - beamHeight/2);
        ctx.lineTo(x, beamY - beamHeight/2 - 40);
        ctx.strokeStyle = '#e63946';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Arrow head
        ctx.beginPath();
        ctx.moveTo(x, beamY - beamHeight/2);
        ctx.lineTo(x - 5, beamY - beamHeight/2 - 10);
        ctx.lineTo(x + 5, beamY - beamHeight/2 - 10);
        ctx.closePath();
        ctx.fillStyle = '#e63946';
        ctx.fill();
        
        // Load value
        ctx.fillStyle = '#000';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${load.magnitude} kN`, x, beamY - beamHeight/2 - 45);
      } else if (load.type === 'udl' && !isNaN(load.startPosition) && !isNaN(load.endPosition) && !isNaN(load.magnitude)) {
        const x1 = margin + (load.startPosition / parseFloat(length)) * beamLength;
        const x2 = margin + (load.endPosition / parseFloat(length)) * beamLength;
        
        // Draw distributed load line
        ctx.beginPath();
        ctx.moveTo(x1, beamY - beamHeight/2 - 30);
        ctx.lineTo(x2, beamY - beamHeight/2 - 30);
        ctx.strokeStyle = '#e63946';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw arrows
        const arrowCount = Math.max(2, Math.floor((x2 - x1) / 20));
        const arrowSpacing = (x2 - x1) / (arrowCount - 1);
        
        for (let i = 0; i < arrowCount; i++) {
          const x = x1 + i * arrowSpacing;
          
          ctx.beginPath();
          ctx.moveTo(x, beamY - beamHeight/2 - 30);
          ctx.lineTo(x, beamY - beamHeight/2);
          ctx.strokeStyle = '#e63946';
          ctx.stroke();
          
          // Arrow head
          ctx.beginPath();
          ctx.moveTo(x, beamY - beamHeight/2);
          ctx.lineTo(x - 5, beamY - beamHeight/2 - 10);
          ctx.lineTo(x + 5, beamY - beamHeight/2 - 10);
          ctx.closePath();
          ctx.fillStyle = '#e63946';
          ctx.fill();
        }
        
        // Load value
        ctx.fillStyle = '#000';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${load.magnitude} kN/m`, (x1 + x2) / 2, beamY - beamHeight/2 - 40);
      }
    });
    
    // Draw dimensions
    ctx.fillStyle = '#333';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${length} m`, width / 2, beamY + beamHeight/2 + 40);
    
  }, [length, loads, supportType]);

  return (
    <div className="beam-calculator">
      <h1>Beam Calculator</h1>
      <motion.div 
        className="beam-visualization"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="visualization-header">
          <h2>Beam Visualization</h2>
          <button 
            className="toggle-button"
            onClick={() => setShowBeamDiagram(!showBeamDiagram)}
          >
            {showBeamDiagram ? 'Hide Diagram' : 'Show Diagram'}
          </button>
        </div>
        
        {showBeamDiagram && (
          <canvas 
            ref={canvasRef} 
            width={800} 
            height={200} 
            className="beam-canvas"
          />
        )}
      </motion.div>
      <div className="form-group">
        <label>Beam Length (m):</label>
        <input
          type="number"
          step="0.01"
          value={length}
          onChange={(e) => setLength(e.target.value)}
          required
        />
      </div>
      <div className="form-group">
        <label>Support Type:</label>
        <select value={supportType} onChange={(e) => setSupportType(e.target.value)}>
          <option value="simply-supported">Simply Supported</option>
          <option value="cantilever">Cantilever</option>
          <option value="fixed">Fixed</option>
        </select>
      </div>
      <div className="form-group">
        <label>Young's Modulus (GPa):</label>
        <input
          type="number"
          step="0.01"
          value={E}
          onChange={(e) => setE(e.target.value)}
          required
        />
      </div>
      <div className="form-group">
        <label>Moment of Inertia (cm^4):</label>
        <input
          type="number"
          step="0.01"
          value={I}
          onChange={(e) => setI(e.target.value)}
          required
        />
      </div>
      <div className="form-group">
        <label>Cross-Section Type:</label>
        <select value={crossSection} onChange={(e) => setCrossSection(e.target.value)}>
          <option value="rectangle">Rectangular</option>
          <option value="circle">Circular</option>
          <option value="i-beam">I-Beam</option>
          <option value="custom">Custom (Manual I)</option>
        </select>
      </div>

      {crossSection !== 'custom' && (
        <motion.div 
          className="section-dimensions"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h3>Section Dimensions</h3>
          
          {crossSection === 'rectangle' && (
            <div className="dimension-inputs">
              <div className="form-group">
                <label>Width (m):</label>
                <input
                  type="number"
                  step="0.01"
                  value={sectionDimensions.width}
                  onChange={(e) => setSectionDimensions({
                    ...sectionDimensions,
                    width: parseFloat(e.target.value)
                  })}
                />
              </div>
              <div className="form-group">
                <label>Height (m):</label>
                <input
                  type="number"
                  step="0.01"
                  value={sectionDimensions.height}
                  onChange={(e) => setSectionDimensions({
                    ...sectionDimensions,
                    height: parseFloat(e.target.value)
                  })}
                />
              </div>
            </div>
          )}
          
          {crossSection === 'circle' && (
            <div className="form-group">
              <label>Diameter (m):</label>
              <input
                type="number"
                step="0.01"
                value={sectionDimensions.diameter}
                onChange={(e) => setSectionDimensions({
                  ...sectionDimensions,
                  diameter: parseFloat(e.target.value)
                })}
              />
            </div>
          )}
          
          {crossSection === 'i-beam' && (
            <>
              <div className="dimension-inputs">
                <div className="form-group">
                  <label>Flange Width (m):</label>
                  <input
                    type="number"
                    step="0.01"
                    value={sectionDimensions.flangeWidth}
                    onChange={(e) => setSectionDimensions({
                      ...sectionDimensions,
                      flangeWidth: parseFloat(e.target.value)
                    })}
                  />
                </div>
                <div className="form-group">
                  <label>Flange Thickness (m):</label>
                  <input
                    type="number"
                    step="0.001"
                    value={sectionDimensions.flangeThickness}
                    onChange={(e) => setSectionDimensions({
                      ...sectionDimensions,
                      flangeThickness: parseFloat(e.target.value)
                    })}
                  />
                </div>
              </div>
              <div className="dimension-inputs">
                <div className="form-group">
                  <label>Web Height (m):</label>
                  <input
                    type="number"
                    step="0.01"
                    value={sectionDimensions.webHeight}
                    onChange={(e) => setSectionDimensions({
                      ...sectionDimensions,
                      webHeight: parseFloat(e.target.value)
                    })}
                  />
                </div>
                <div className="form-group">
                  <label>Web Thickness (m):</label>
                  <input
                    type="number"
                    step="0.001"
                    value={sectionDimensions.webThickness}
                    onChange={(e) => setSectionDimensions({
                      ...sectionDimensions,
                      webThickness: parseFloat(e.target.value)
                    })}
                  />
                </div>
              </div>
            </>
          )}
          
          <div className="calculated-inertia">
            <p>Calculated Moment of Inertia: {(calculateMomentOfInertia() * 1e8).toFixed(2)} cm<sup>4</sup></p>
          </div>
        </motion.div>
      )}
      {loads.map((load, index) => (
        <div key={index} className="load-form">
          <div className="form-group">
            <label>Load Type:</label>
            <select
              value={load.type}
              onChange={(e) => handleLoadChange(index, 'type', e.target.value)}
            >
              <option value="point">Point Load</option>
              <option value="udl">Uniformly Distributed Load (UDL)</option>
            </select>
          </div>
          <div className="form-group">
            <label>Magnitude (kN):</label>
            <input
              type="number"
              step="0.01"
              value={load.magnitude}
              onChange={(e) => handleLoadChange(index, 'magnitude', e.target.value)}
              required
            />
          </div>
          {load.type === 'point' && (
            <div className="form-group">
              <label>Load Position (m):</label>
              <input
                type="number"
                step="0.01"
                value={load.position}
                onChange={(e) => handleLoadChange(index, 'position', e.target.value)}
                required
              />
            </div>
          )}
          {load.type === 'udl' && (
            <>
              <div className="form-group">
                <label>Start Position (m):</label>
                <input
                  type="number"
                  step="0.01"
                  value={load.startPosition}
                  onChange={(e) => handleLoadChange(index, 'startPosition', e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>End Position (m):</label>
                <input
                  type="number"
                  step="0.01"
                  value={load.endPosition}
                  onChange={(e) => handleLoadChange(index, 'endPosition', e.target.value)}
                  required
                />
              </div>
            </>
          )}
          <button onClick={() => removeLoad(index)}>Remove Load</button>
        </div>
      ))}
      <button onClick={addLoad}>Add Load</button>
      <button onClick={calculateResults}>Calculate</button>
      {(shear || moment || deflection) && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="results-section-header"
        >
          <h2>Analysis Results</h2>
          <p>The diagrams below show the structural behavior under the specified loads.</p>
        </motion.div>
      )}
      {shear && (
        <motion.div 
          className="results-chart"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2>Shear Force Diagram</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={generateChartData(shear)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="position" label={{ value: 'Position (m)', position: 'insideBottomRight', offset: -5 }} />
              <YAxis label={{ value: 'Shear Force (kN)', angle: -90, position: 'insideLeft' }} />
              <Tooltip 
                formatter={(value) => {
                  // Check if value is a number or can be converted to a number
                  const numValue = typeof value === 'number' ? value : Number(value);
                  
                  // If it's a valid number, format it with toFixed
                  if (!isNaN(numValue)) {
                    return [`${numValue.toFixed(2)} kN`, 'Shear Force'];
                  }
                  
                  // Fallback for non-numeric values
                  return [`${value} kN`, 'Shear Force'];
                }} 
              />
              <ReferenceLine y={0} stroke="#000" strokeDasharray="3 3" />
              <Line type="monotone" dataKey="value" stroke="#E63946" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      )}
      {moment && (
        <motion.div 
          className="results-chart"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <h2>Bending Moment Diagram</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={generateChartData(moment)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="position" label={{ value: 'Position (m)', position: 'insideBottomRight', offset: -5 }} />
              <YAxis label={{ value: 'Bending Moment (kN·m)', angle: -90, position: 'insideLeft' }} />
              <Tooltip 
                formatter={(value) => {
                  const numValue = typeof value === 'number' ? value : Number(value);
                  if (!isNaN(numValue)) {
                    return [`${numValue.toFixed(2)} kN·m`, 'Bending Moment'];
                  }
                  return [`${value} kN·m`, 'Bending Moment'];
                }} 
              />
              <ReferenceLine y={0} stroke="#000" strokeDasharray="3 3" />
              <Line type="monotone" dataKey="value" stroke="#4F46E5" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      )}
      {deflection && (
        <motion.div 
          className="results-chart"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h2>Deflection Diagram</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={generateChartData(deflection)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="position" label={{ value: 'Position (m)', position: 'insideBottomRight', offset: -5 }} />
              <YAxis label={{ value: 'Deflection (m)', angle: -90, position: 'insideLeft' }} />
              <Tooltip 
                formatter={(value) => {
                  const numValue = typeof value === 'number' ? value : Number(value);
                  if (!isNaN(numValue)) {
                    return [`${numValue.toFixed(4)} m`, 'Deflection'];
                  }
                  return [`${value} m`, 'Deflection'];
                }} 
              />
              <ReferenceLine y={0} stroke="#000" strokeDasharray="3 3" />
              <Line type="monotone" dataKey="value" stroke="#10B981" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      )}
      {maxStress && safetyFactor && (
        <motion.div 
          className="results-summary"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h2>Results Summary</h2>
          <table className="summary-table">
            <tbody>
              <tr>
                <td>Maximum Shear Force:</td>
                <td>{Math.max(...shear.map(s => Math.abs(s.value))).toFixed(2)} kN</td>
              </tr>
              <tr>
                <td>Maximum Bending Moment:</td>
                <td>{Math.max(...moment.map(m => Math.abs(m.value))).toFixed(2)} kN·m</td>
              </tr>
              <tr>
                <td>Maximum Deflection:</td>
                <td>{Math.max(...deflection.map(d => Math.abs(d.value))).toFixed(4)} m</td>
              </tr>
              <tr>
                <td>Maximum Stress:</td>
                <td>{maxStress.toFixed(2)} MPa</td>
              </tr>
              <tr className={safetyFactor < 1.5 ? 'danger' : safetyFactor < 2 ? 'warning' : 'success'}>
                <td>Safety Factor:</td>
                <td>{safetyFactor.toFixed(2)}</td>
              </tr>
              <tr>
                <td>Beam Properties:</td>
                <td>E = {E} GPa, I = {crossSection === 'custom' ? I : (calculateMomentOfInertia() * 1e8).toFixed(2)} cm⁴</td>
              </tr>
            </tbody>
          </table>
          
          <div className="safety-indicator">
            <div className="safety-label">Safety Assessment:</div>
            <div className={`safety-value ${safetyFactor < 1.5 ? 'danger' : safetyFactor < 2 ? 'warning' : 'success'}`}>
              {safetyFactor < 1.5 ? 'Unsafe' : safetyFactor < 2 ? 'Marginal' : 'Safe'}
            </div>
          </div>
          
          <div className="safety-explanation">
            <p>
              <strong>About Safety Factor:</strong> The safety factor is the ratio of allowable stress to actual stress. 
              A value below 1.5 is considered unsafe for most structures, 1.5-2.0 is marginal and acceptable only for 
              temporary structures, while values above 2.0 provide adequate safety margin for permanent structures 
              under normal conditions. Different design codes and applications may specify different minimum safety factors.
            </p>
          </div>
        </motion.div>
      )}
      {/* Add an allowable stress input field to the UI */}
      <div className="form-group">
        <label>Allowable Stress (MPa):</label>
        <input
          type="number"
          step="1"
          value={allowableStress}
          onChange={(e) => setAllowableStress(parseFloat(e.target.value))}
          min={10}
          max={1000}
          required
        />
      </div>
    </div>
  );
};

export default BeamCalculator;
