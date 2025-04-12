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
        const totalHeight = sectionDimensions.webHeight + 2 * sectionDimensions.flangeThickness;
        
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

    const shearForces = [];
    const bendingMoments = [];
    const deflections = [];

    // Enhanced formulas for shear, moment, and deflection based on support types and loads
    loads.forEach(load => {
      if (supportType === 'simply-supported') {
        if (load.type === 'point') {
          const P = load.magnitude;
          const a = load.position;
          const L = parseFloat(length);
          const b = L - a;
          
          const R1 = (P * b) / L;
          const R2 = (P * a) / L;
          
          // Calculate shear at multiple points
          for (let i = 0; i <= 100; i++) {
            const x = (i / 100) * L;
            let shearValue = 0;
            
            if (x < a) {
              shearValue = R1;
            } else {
              shearValue = -R2;
            }
            
            shearForces.push({ position: x, value: shearValue });
          }
          
          // Calculate moment at multiple points
          for (let i = 0; i <= 100; i++) {
            const x = (i / 100) * L;
            let momentValue = 0;
            
            if (x < a) {
              momentValue = R1 * x;
            } else {
              momentValue = R2 * (L - x);
            }
            
            bendingMoments.push({ position: x, value: momentValue });
          }
          
          // Calculate deflection at multiple points
          for (let i = 0; i <= 100; i++) {
            const x = (i / 100) * L;
            let deflectionValue = 0;
            
            if (x < a) {
              deflectionValue = (P * b * x / (6 * E * I * L)) * (L**2 - b**2 - x**2);
            } else {
              deflectionValue = (P * a * (L - x) / (6 * E * I * L)) * (L**2 - a**2 - (L - x)**2);
            }
            
            deflections.push({ position: x, value: deflectionValue });
          }
        } else if (load.type === 'udl') {
          const w = load.magnitude;
          const a = load.startPosition;
          const b = load.endPosition;
          const L = parseFloat(length);

          const totalLoad = w * (b - a);
          const R1 = (totalLoad * (L - (a + b) / 2)) / L;
          const R2 = (totalLoad * (a + b) / 2) / L;

          // Calculate shear, moment and deflection at multiple points
          for (let i = 0; i <= 100; i++) {
            const x = (i / 100) * L;
            let shearValue, momentValue, deflectionValue;
            
            // Shear force calculation with proper discontinuity
            if (x < a) {
              shearValue = R1;
            } else if (x >= a && x <= b) {
              shearValue = R1 - w * (x - a);
            } else {
              shearValue = -R2;
            }
            
            // Moment calculation with proper curve
            if (x < a) {
              momentValue = R1 * x;
            } else if (x >= a && x <= b) {
              momentValue = R1 * x - w * (x - a) * (x - a) / 2;
            } else {
              momentValue = R2 * (L - x);
            }
            
            // Add correct deflection formula for UDL on simply supported beam
            // EI value in N·m²
            const EInNm2 = parseFloat(E) * 1e9 * parseFloat(I) * 1e-8;

            if (x < a) {
              // Region before the UDL
              deflectionValue = (R1 * x * (L*L - x*x)) / (6 * EInNm2);
            } 
            else if (x >= a && x <= b) {
              // Region under the UDL
              deflectionValue = (1/(24*EInNm2)) * (
                R1 * x * (L*L - x*x) - 
                w * (x - a) * (x - a) * (x - a) * (3*L - x)
              );
            } 
            else {
              // Region after the UDL
              deflectionValue = (1/(6*EInNm2)) * (
                R1 * x * (L*L - x*x) - 
                w * (b - a) * (3*L*x - 3*x*x - Math.pow(b+a, 2)/2 + a*b)
              );
            }

            shearForces.push({ position: x, value: shearValue });
            bendingMoments.push({ position: x, value: momentValue });
            deflections.push({ position: x, value: deflectionValue });
          }
        }
      } else if (supportType === 'cantilever') {
        if (load.type === 'point') {
          const P = parseFloat(load.magnitude);
          const a = parseFloat(load.position);
          const L = parseFloat(length);
          
          // For cantilever beam, fixed at x=0, free at x=L
          // Calculate values at multiple points
          for (let i = 0; i <= 100; i++) {
            const x = (i / 100) * L;
            let shearValue = 0;
            let momentValue = 0;
            let deflectionValue = 0;
            
            // Shear force calculation
            if (x <= a) {
              shearValue = P;
            } else {
              shearValue = 0;
            }
            
            // Bending moment calculation
            if (x <= a) {
              momentValue = P * (a - x);
            } else {
              momentValue = 0;
            }
            
            // Deflection calculation - convert E from GPa to Pa
            const EInNm2 = parseFloat(E) * 1e9 * parseFloat(I) * 1e-8;
            if (x <= a) {
              deflectionValue = (P * Math.pow(x, 2) * (3*a - x)) / (6 * EInNm2);
            } else {
              deflectionValue = (P * Math.pow(a, 2) * (3*x - a)) / (6 * EInNm2);
            }
            
            shearForces.push({ position: x, value: shearValue });
            bendingMoments.push({ position: x, value: momentValue });
            deflections.push({ position: x, value: deflectionValue });
          }
        } 
        else if (load.type === 'udl') {
          const w = parseFloat(load.magnitude);
          const a = parseFloat(load.startPosition);
          const b = parseFloat(load.endPosition);
          const L = parseFloat(length);
          
          // For cantilever with UDL
          for (let i = 0; i <= 100; i++) {
            const x = (i / 100) * L;
            let shearValue = 0;
            let momentValue = 0;
            let deflectionValue = 0;
            
            // Shear force calculation
            if (x < a) {
              shearValue = w * (b - a);
            } else if (x >= a && x <= b) {
              shearValue = w * (b - x);
            } else {
              shearValue = 0;
            }
            
            // Bending moment calculation
            if (x < a) {
              momentValue = w * (b - a) * ((a + b)/2 - x);
            } else if (x >= a && x <= b) {
              momentValue = (w * Math.pow(b - x, 2)) / 2;
            } else {
              momentValue = 0;
            }
            
            // Deflection calculation
            const EInNm2 = parseFloat(E) * 1e9 * parseFloat(I) * 1e-8;
            if (x < a) {
              deflectionValue = (w/(24*EInNm2)) * (
                4*Math.pow(b-a,3)*x - Math.pow(x,4) + 
                6*Math.pow(b-a,2)*Math.pow(x,2) - 4*(b-a)*Math.pow(x,3)
              );
            } else if (x >= a && x <= b) {
              deflectionValue = (w/(24*EInNm2)) * (
                4*Math.pow(b-x,3)*x - Math.pow(b-x,4)
              );
            } else {
              deflectionValue = (w/(24*EInNm2)) * (
                Math.pow(b-a,2) * (4*b*x - 2*a*x - Math.pow(b-a,2) - 2*Math.pow(x,2))
              );
            }
            
            shearForces.push({ position: x, value: shearValue });
            bendingMoments.push({ position: x, value: momentValue });
            deflections.push({ position: x, value: deflectionValue });
          }
        }
      } else if (supportType === 'fixed') {
        if (load.type === 'point') {
          const P = parseFloat(load.magnitude);
          const a = parseFloat(load.position);
          const L = parseFloat(length);
          const b = L - a;
          
          // Fixed-end moments
          const M1 = -P * a * b * b / (L * L);
          const M2 = P * a * a * b / (L * L);
          
          // Reactions including moment effects
          const R1 = P * b / L - (M1 + M2) / L;
          const R2 = P * a / L + (M1 + M2) / L;
          
          // Generate continuous curves for shear, moment and deflection
          for (let i = 0; i <= 100; i++) {
            const x = (i / 100) * L;
            let shearValue = 0;
            let momentValue = 0;
            let deflectionValue = 0;
            
            // Shear force calculation
            if (x < a) {
              shearValue = R1;
            } else {
              shearValue = -R2;
            }
            
            // Bending moment calculation
            if (x < a) {
              momentValue = M1 + R1 * x;
            } else {
              momentValue = M1 + R1 * x - P * (x - a);
            }
            
            // Deflection calculation
            const EInNm2 = parseFloat(E) * 1e9 * parseFloat(I) * 1e-8;
            if (x < a) {
              deflectionValue = (1/(6*EInNm2)) * (
                M1 * Math.pow(x, 2) + (R1*Math.pow(x, 3))/3 - (P*a*b*b*x*x)/(L*L)
              );
            } else {
              deflectionValue = (1/(6*EInNm2)) * (
                M1 * Math.pow(x, 2) + (R1*Math.pow(x, 3))/3 - P*Math.pow(x-a, 3)/3 - (P*a*a*b*x*x)/(L*L)
              );
            }
            
            shearForces.push({ position: x, value: shearValue });
            bendingMoments.push({ position: x, value: momentValue });
            deflections.push({ position: x, value: deflectionValue });
          }
        } 
        else if (load.type === 'udl') {
          const w = parseFloat(load.magnitude);
          const a = parseFloat(load.startPosition);
          const b = parseFloat(load.endPosition);
          const L = parseFloat(length);
          
          const q = b - a; // Length of UDL
          const c = (a + b) / 2; // Center of UDL
          const totalLoad = w * q;
          
          // Fixed-end moments for UDL
          const M1 = -w * q * q / 12;
          const M2 = w * q * q / 12;
          
          // Reactions
          const R1 = totalLoad * (L - c) / L - (M1 - M2) / L;
          const R2 = totalLoad * c / L + (M1 - M2) / L;
          
          for (let i = 0; i <= 100; i++) {
            const x = (i / 100) * L;
            let shearValue = 0;
            let momentValue = 0;
            let deflectionValue = 0;
            
            // Shear force
            if (x < a) {
              shearValue = R1;
            } else if (x >= a && x <= b) {
              shearValue = R1 - w * (x - a);
            } else {
              shearValue = -R2;
            }
            
            // Bending moment
            if (x < a) {
              momentValue = M1 + R1 * x;
            } else if (x >= a && x <= b) {
              momentValue = M1 + R1 * x - w * Math.pow(x - a, 2) / 2;
            } else {
              momentValue = M2 + R2 * (L - x);
            }
            
            // Deflection - simplified approximation
            const EInNm2 = parseFloat(E) * 1e9 * parseFloat(I) * 1e-8;
            // Complex formula - simplified approximation used
            deflectionValue = w * Math.pow(q, 4) / (384 * EInNm2) * Math.sin(Math.PI * x / L);
            
            shearForces.push({ position: x, value: shearValue });
            bendingMoments.push({ position: x, value: momentValue });
            deflections.push({ position: x, value: deflectionValue });
          }
        }
      }
    });

    setShear(shearForces);
    setMoment(bendingMoments);
    setDeflection(deflections);
    calculateStress();
  };

  // Add this state
  const [maxStress, setMaxStress] = useState(null);
  const [safetyFactor, setSafetyFactor] = useState(null);
  const [allowableStress, setAllowableStress] = useState(250); // MPa

  // Add this in your calculateResults function, after setting moment, shear and deflection
  const calculateStress = () => {
    if (!moment || moment.length === 0) return;
    
    let maxMoment = 0;
    moment.forEach(m => {
      if (Math.abs(m.value) > Math.abs(maxMoment)) {
        maxMoment = m.value;
      }
    });
    
    // Calculate section modulus based on shape
    let sectionModulus = 0;
    if (crossSection === 'rectangle') {
      sectionModulus = (sectionDimensions.width * Math.pow(sectionDimensions.height, 2)) / 6; // m³
    } else if (crossSection === 'circle') {
      sectionModulus = (Math.PI * Math.pow(sectionDimensions.diameter / 2, 3)) / 4; // m³
    } else if (crossSection === 'i-beam') {
      const totalHeight = sectionDimensions.webHeight + 2 * sectionDimensions.flangeThickness;
      sectionModulus = calculateMomentOfInertia() / (totalHeight / 2); // m³
    } else {
      // For custom, use approximation
      const momentOfInertia = parseFloat(I) * 1e-8; // cm⁴ to m⁴
      sectionModulus = momentOfInertia / 0.15; // Approximate using half of typical height
    }
    
    // Add edge case handling to prevent division by zero
    if (Math.abs(maxMoment) < 0.00001 || Math.abs(sectionModulus) < 0.00001) {
      // Handle the case where moment or section modulus is extremely small
      setMaxStress(0);
      setSafetyFactor(99); // Effectively infinite safety factor
      return;
    }
    
    // Calculate maximum stress in MPa
    const stress = (maxMoment * 1000) / sectionModulus; // N/m² (Pa)
    const stressInMPa = stress / 1e6;
    setMaxStress(stressInMPa);
    
    // Calculate safety factor
    const safety = allowableStress / stressInMPa; // Both in MPa
    setSafetyFactor(safety);
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
