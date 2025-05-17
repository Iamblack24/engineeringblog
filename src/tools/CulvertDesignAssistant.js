import React, { useState } from 'react';
import { Line } from 'react-chartjs-2';
import './CulvertDesignAssistant.css';
import { jsPDF } from 'jspdf';
import { Chart, LineElement, CategoryScale, LinearScale, PointElement, Title, Tooltip, Legend } from 'chart.js';
Chart.register(LineElement, CategoryScale, LinearScale, PointElement, Title, Tooltip, Legend);

const defaultHydraulic = {
  culvertType: 'circular',
  material: 'concrete',
  diameter: 1.0,
  width: 1.0,
  length: 10.0,
  inletElevation: 100.0,
  outletElevation: 99.5,
  rainfallIntensity: 75,
  catchmentArea: 0.5,
  runoffCoefficient: 0.7,
  tailwaterDepth: 0.6,
  entranceType: 'headwall',
  designFlow: 2.5,
  roughness: 0.013,
  inletCondition: 'unsubmerged',
};
const defaultStructural = {
  culvertType: 'circular',
  material: 'concrete',
  diameter: 1.0,
  width: 1.0,
  length: 10.0,
  fillHeight: 2.0,
  soilDensity: 1920,
  soilType: 'granular',
  beddingClass: 'B',
  pipeClass: '120',
  liveLoad: 10,
  vehicleLoad: 'LM1',
  wallThickness: 150,
  materialStrength: 28,
  gammaG: 1.35,
  gammaQ: 1.5,
  gammaM: 1.5,
};

const tabList = [
  { id: 'hydraulic', label: 'Hydraulic Design', icon: '💧' },
  { id: 'structural', label: 'Structural Design', icon: '🧱' },
  { id: 'analysis', label: 'Analysis', icon: '📊' },
];

function getSlope(inlet, outlet, length) {
  if (length > 0) return ((inlet - outlet) / length) * 100;
  return 0;
}

function hydraulicCalc(params) {
  const {
    culvertType, diameter, width, length, slope, roughness, designFlow,
    rainfallIntensity, catchmentArea, runoffCoefficient, tailwaterDepth, entranceType, inletCondition
  } = params;
  const g = 9.81;

  const Qrational = (rainfallIntensity / 3600) * runoffCoefficient * catchmentArea * 10000; // Rational method (BS EN 752)

  let area, perimeter;
  if (culvertType === 'circular') {
    area = (Math.PI * Math.pow(diameter, 2)) / 4;
    perimeter = Math.PI * diameter;
  } else {
    area = width * diameter;
    perimeter = 2 * (width + diameter);
  }
  const hydraulicRadius = area / perimeter;

  const velocityInBarrel = (1 / roughness) * Math.pow(hydraulicRadius, 2 / 3) * Math.sqrt(Math.abs(slope) / 100); // Manning's eq
  const capacity = area * velocityInBarrel;

  const entranceLossesOutletControl = { headwall: 0.5, mitered: 0.7, projecting: 0.9, wingwall: 0.2 };
  const Ke_outlet_control = entranceLossesOutletControl[entranceType] || 0.5; // CIRIA C689 Table 5.2

  let HW_inlet;
  // HDS-5 provides more accurate equations for inlet control.
  // The following is a simplified approach.
  if (inletCondition === 'unsubmerged') {
    const Ke_inlet_control_factor = 1.5; // Placeholder overall factor
    HW_inlet = Ke_inlet_control_factor * Math.pow(designFlow, 2) / (2 * g * Math.pow(area, 2)) + diameter;
  } else { // Assumed submerged inlet
    const Cd_inlet = 0.6; // Typical discharge coefficient
    HW_inlet = Math.pow(designFlow / (Cd_inlet * area), 2) / (2 * g) + diameter;
  }

  const frictionSlopeFactor = Math.pow(roughness * velocityInBarrel / Math.pow(hydraulicRadius, 2/3), 2);
  const hL_friction = length * frictionSlopeFactor;

  const K_exit = 1.0;
  const velocityHeadInBarrel = Math.pow(velocityInBarrel, 2) / (2 * g);
  const entranceLossHead = Ke_outlet_control * velocityHeadInBarrel;
  // HW_outlet = Tailwater + FrictionLoss + EntranceLoss + ExitLoss
  let HW_outlet = tailwaterDepth + hL_friction + entranceLossHead + (K_exit * velocityHeadInBarrel);

  let controlType, headwaterDepth;
  if (HW_inlet > HW_outlet) {
    controlType = "Inlet Control";
    headwaterDepth = HW_inlet;
  } else {
    controlType = "Outlet Control";
    headwaterDepth = HW_outlet;
  }

  let recommendations = [];
  recommendations.push(`Peak flow (Q) by Rational Method.`);
  recommendations.push(`Inlet Control HW calculation is simplified; refer to FHWA HDS-5 for detailed design.`);
  recommendations.push(`Outlet Control HW includes friction, entrance, and exit losses.`);
  if (capacity < designFlow) recommendations.push(`❗ Capacity Warning: Culvert capacity (${capacity.toFixed(2)} m³/s) < design flow (${designFlow} m³/s).`);
  else recommendations.push(`✅ Capacity Adequate: Culvert capacity (${capacity.toFixed(2)} m³/s) > design flow (${designFlow} m³/s).`);
  
  const velocityCheck = getVelocityStatus(velocityInBarrel, params.material);
  if (velocityCheck.status !== 'ok') {
    recommendations.push(`⚠️ ${velocityCheck.message}`);
  }
  recommendations.push(`ℹ️ Control Type: ${controlType}.`);

  return {
    Qrational, velocity: velocityInBarrel, capacity, controlType, headwaterDepth, velocityStatus: velocityCheck.status, recommendations,
  };
}

function getVelocityStatus(velocity, material) {
  const minVelocity = 0.6; // m/s, to prevent sedimentation
  const maxVelocities = { concrete: 4.5, 'corrugated-metal': 3.0, plastic: 3.5, steel: 4.0, default: 3.0 }; // m/s, to prevent erosion
  const maxAllowed = maxVelocities[material] || maxVelocities.default;
  
  if (velocity < minVelocity) return { status: 'warning', message: `Velocity (${velocity.toFixed(2)} m/s) < min (${minVelocity} m/s). Risk of sedimentation.` };
  if (velocity > maxAllowed) return { status: 'danger', message: `Velocity (${velocity.toFixed(2)} m/s) > max for ${material} (${maxAllowed} m/s). Risk of erosion.` };
  return { status: 'ok', message: `Velocity (${velocity.toFixed(2)} m/s) is acceptable.` };
}

function structuralCalc(params) {
  const {
    culvertType, material, diameter, width, /* length removed */ fillHeight, soilDensity, liveLoad,
    wallThickness, materialStrength, beddingClass, /* pipeClass removed */ soilType,
    gammaG = 1.35, gammaQ = 1.5, gammaM = 1.5, vehicleLoad
  } = params;

  const g = 9.81;
  const wallThickM = wallThickness / 1000;
  const span = culvertType === 'box' ? width : diameter;

  let Ce = 1.1; // Bedding B, granular (BS 9295)
  if (beddingClass === 'A') Ce = 0.8;
  if (beddingClass === 'C') Ce = 1.5;
  if (soilType === 'cohesive') Ce += 0.2; // Adjustment

  const We = Ce * (soilDensity * g / 1000) * fillHeight * span; // Earth load (kN/m)

  let Wl = liveLoad * span; // Live load (kN/m), from kN/m² input
  if (vehicleLoad === 'LM2') Wl *= 1.5; // Example adjustment for LM2

  const designLoad_ULS = gammaG * We + gammaQ * Wl; // ULS Design Load (kN/m)

  let sectionModulus_m3;
  if (culvertType === 'circular') {
    const D_mean = span - wallThickM;
    sectionModulus_m3 = (Math.PI * Math.pow(D_mean, 2) * wallThickM) / 4;
  } else { // Box culvert
    sectionModulus_m3 = (width * Math.pow(diameter, 2)) / 6; // 'diameter' is height
  }
  const momentCapacity_kNm = (materialStrength * 1e6 / gammaM) * sectionModulus_m3 / 1000; // kNm

  const requiredMoment_kNm = designLoad_ULS * Math.pow(span, 2) / 8; // Approx. for UDL (kN·m)
  const safetyFactor = momentCapacity_kNm / requiredMoment_kNm;

  let deltaY_mm;
  const E_material_Pa = (material === 'concrete' ? 30e9 : (material === 'steel' ? 200e9 : (material === 'plastic' ? 1e9 : 20e9))); // E in Pa

  if (material === 'concrete') { // Rigid pipe
    deltaY_mm = (0.001 * span) * 1000; // Nominal deflection (0.1% of span)
  } else { // Flexible pipe - Simplified ring deflection
    const load_N_per_m = designLoad_ULS * 1000;
    let I_pipe_section_m4;
    if (culvertType === 'circular') {
        I_pipe_section_m4 = Math.PI * (Math.pow(span, 4) - Math.pow(span - 2 * wallThickM, 4)) / 64;
    } else { // Box culvert
        I_pipe_section_m4 = (width * Math.pow(diameter, 3)) / 12;
    }
    const deflection_coeff_ring = 0.015; // Empirical coefficient
    const deltaY_m = (deflection_coeff_ring * load_N_per_m * Math.pow(span, 3)) / (E_material_Pa * I_pipe_section_m4);
    deltaY_mm = deltaY_m * 1000;
  }

  let recommendations = [];
  recommendations.push(`Earth load (We = ${We.toFixed(2)} kN/m). Live load (Wl = ${Wl.toFixed(2)} kN/m).`);
  recommendations.push(`ULS Design Load = ${designLoad_ULS.toFixed(2)} kN/m.`);
  recommendations.push(`Moment Capacity (${momentCapacity_kNm.toFixed(2)} kNm) vs Required (${requiredMoment_kNm.toFixed(2)} kNm).`);
  recommendations.push(`Deflection (${deltaY_mm.toFixed(2)} mm) calculation is simplified.`);
  if (safetyFactor < 1.5) recommendations.push(`❗ Bending Safety Factor (${safetyFactor.toFixed(2)}) < 1.5.`);
  else recommendations.push(`✅ Bending Safety Factor (${safetyFactor.toFixed(2)}) adequate.`);
  
  const allowableDeflection_mm = (span / 100) * 1000 * 0.05; // 5% of span for flexible
  if (material !== 'concrete' && deltaY_mm > allowableDeflection_mm) {
    recommendations.push(`❗ Deflection (${deltaY_mm.toFixed(2)} mm) > allowable (${allowableDeflection_mm.toFixed(2)} mm).`);
  } else if (material !== 'concrete') {
    recommendations.push(`✅ Deflection (${deltaY_mm.toFixed(2)} mm) within limits.`);
  }

  return {
    totalLoad: designLoad_ULS, momentCapacity: momentCapacity_kNm, requiredMoment: requiredMoment_kNm,
    safetyFactor, deflection: deltaY_mm, recommendations,
  };
}

function getCapacityChartData() {
  const diameters = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0];
  const { culvertType, width, roughness } = defaultHydraulic; // Using defaultHydraulic for chart consistency
  const slope = 5; // %
  return {
    labels: diameters.map(d => d.toFixed(2)),
    datasets: [
      {
        label: 'Capacity (m³/s)',
        data: diameters.map(d => {
          let area = (culvertType === 'circular') ? (Math.PI * Math.pow(d, 2)) / 4 : width * d;
          let perimeter = (culvertType === 'circular') ? Math.PI * d : 2 * (width + d);
          let hydraulicRadius = area / perimeter;
          let velocity = (1 / roughness) * Math.pow(hydraulicRadius, 2 / 3) * Math.sqrt(slope / 100);
          return +(area * velocity).toFixed(2);
        }),
        borderColor: '#2563eb', backgroundColor: 'rgba(37,99,235,0.13)', fill: true, tension: 0.2, pointRadius: 4,
      }
    ]
  };
}

function getCapacitySlopeTable() {
  const slopes = [0.5, 1, 2, 3, 5, 10]; // %
  const d = defaultHydraulic.diameter; // Using defaultHydraulic for chart consistency
  const { culvertType, width, roughness } = defaultHydraulic;
  return slopes.map(slopeVal => {
    let area = (culvertType === 'circular') ? (Math.PI * Math.pow(d, 2)) / 4 : width * d;
    let perimeter = (culvertType === 'circular') ? Math.PI * d : 2 * (width + d);
    let hydraulicRadius = area / perimeter;
    let velocity = (1 / roughness) * Math.pow(hydraulicRadius, 2 / 3) * Math.sqrt(slopeVal / 100);
    let capacity = area * velocity;
    return { slope: slopeVal, capacity: capacity.toFixed(2) };
  });
}

function getVelocityChartData() {
  const diameters = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0];
  const { culvertType, width, roughness } = defaultHydraulic; // Using defaultHydraulic for chart consistency
  const slope = 5; // %
  return {
    labels: diameters.map(d => d.toFixed(2)),
    datasets: [
      {
        label: 'Velocity (m/s)',
        data: diameters.map(d => {
          let area = (culvertType === 'circular') ? (Math.PI * Math.pow(d, 2)) / 4 : width * d;
          let perimeter = (culvertType === 'circular') ? Math.PI * d : 2 * (width + d);
          let hydraulicRadius = area / perimeter;
          let velocity = (1 / roughness) * Math.pow(hydraulicRadius, 2 / 3) * Math.sqrt(slope / 100);
          return +velocity.toFixed(2);
        }),
        borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.13)', fill: true, tension: 0.2, pointRadius: 4,
      }
    ]
  };
}

function getMaterialComparisonData() {
  const materials = ['concrete', 'corrugated-metal', 'plastic', 'steel'];
  const d = defaultHydraulic.diameter; // Using defaultHydraulic for chart consistency
  const slope = 5; // %
  const roughnessValues = { concrete: 0.013, 'corrugated-metal': 0.024, plastic: 0.011, steel: 0.012 };
  const costFactors = { concrete: 1.0, 'corrugated-metal': 0.8, plastic: 0.7, steel: 1.3 };
  
  return {
    labels: materials.map(m => m.charAt(0).toUpperCase() + m.slice(1).replace('-', ' ')),
    datasets: [
      {
        label: 'Capacity (m³/s)',
        data: materials.map(material => {
          const R_n = roughnessValues[material];
          const area = Math.PI * Math.pow(d, 2) / 4; // Assuming circular for this comparison chart
          const perimeter = Math.PI * d;
          const hydraulicRadius = area / perimeter;
          const velocity = (1 / R_n) * Math.pow(hydraulicRadius, 2 / 3) * Math.sqrt(slope / 100);
          return +(area * velocity).toFixed(2);
        }),
        borderColor: '#2563eb', backgroundColor: 'rgba(37,99,235,0.13)', yAxisID: 'y',
      },
      {
        label: 'Relative Cost',
        data: materials.map(material => costFactors[material]),
        borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.13)', yAxisID: 'y1',
      }
    ]
  };
}

// --- Main Component ---
export default function CulvertDesignAssistant() {
  const [tab, setTab] = useState('hydraulic');
  const [hydraulic, setHydraulic] = useState(defaultHydraulic);
  const [structural, setStructural] = useState(defaultStructural);
  const [hydraulicResult, setHydraulicResult] = useState(null);
  const [structuralResult, setStructuralResult] = useState(null);
  const [costParams, setCostParams] = useState({
    culvertType: defaultHydraulic.culvertType,
    material: defaultHydraulic.material,
    diameter: defaultHydraulic.diameter,
    width: defaultHydraulic.width,
    length: defaultHydraulic.length,
    wallThickness: defaultStructural.wallThickness
  });
  const [costResult, setCostResult] = useState(null);

  // Slope auto-calc
  const slope = getSlope(hydraulic.inletElevation, hydraulic.outletElevation, hydraulic.length);

  // Handlers
  const handleHydraulicChange = e => {
    const { name, value, type } = e.target;
    setHydraulic(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value,
    }));
  };
  const handleStructuralChange = e => {
    const { name, value, type } = e.target;
    setStructural(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value,
    }));
  };
  const handleCostEstimate = () => {
    setCostResult(estimateCulvertCost({
      ...costParams,
      diameter: hydraulic.diameter, // Use current hydraulic state for dimensions
      width: hydraulic.width,
      length: hydraulic.length,
      wallThickness: structural.wallThickness // Use current structural state for wall thickness
    }));
  };

  // Calculation triggers
  const handleHydraulicCalc = () => {
    setHydraulicResult(hydraulicCalc({ ...hydraulic, slope }));
  };
  const handleStructuralCalc = () => {
    setStructuralResult(structuralCalc(structural));
  };

  // Add these functions for export functionality
  function exportToCSV(hydraulicResult, structuralResult) {
    // Create CSV content
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Headers
    csvContent += "Parameter,Value,Unit\r\n";
    
    // Hydraulic data
    if (hydraulicResult) {
      csvContent += "--- HYDRAULIC RESULTS ---\r\n";
      csvContent += `Peak Flow,${hydraulicResult.Qrational?.toFixed(2) || "--"},m³/s\r\n`;
      csvContent += `Capacity,${hydraulicResult.capacity?.toFixed(2) || "--"},m³/s\r\n`;
      csvContent += `Control Type,${hydraulicResult.controlType || "--"},\r\n`;
      csvContent += `Headwater Depth,${hydraulicResult.headwaterDepth?.toFixed(2) || "--"},m\r\n`;
      csvContent += `Velocity,${hydraulicResult.velocity?.toFixed(2) || "--"},m/s\r\n`;
    }
    
    // Structural data
    if (structuralResult) {
      csvContent += "--- STRUCTURAL RESULTS ---\r\n";
      csvContent += `Total Load,${structuralResult.totalLoad?.toFixed(2) || "--"},kN/m\r\n`;
      csvContent += `Moment Capacity,${structuralResult.momentCapacity?.toFixed(2) || "--"},kN·m\r\n`;
      csvContent += `Required Moment,${structuralResult.requiredMoment?.toFixed(2) || "--"},kN·m\r\n`;
      csvContent += `Safety Factor,${structuralResult.safetyFactor?.toFixed(2) || "--"},\r\n`;
      csvContent += `Deflection,${structuralResult.deflection?.toFixed(2) || "--"},mm\r\n`;
    }
    
    // Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "culvert_design_results.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Add this function if you want to include PDF export 
  // (requires jsPDF library: import { jsPDF } from "jspdf";)
  function exportToPDF(hydraulicResult, structuralResult) {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(18);
    doc.text("Culvert Design Results", 105, 20, { align: "center" });
    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, 30, { align: "center" });
    
    // Initialize y position variable here so it's in scope for the entire function
    let y = 50;
    
    // Hydraulic results
    if (hydraulicResult) {
      doc.setFontSize(14);
      doc.text("Hydraulic Results", 20, y);
      doc.setFontSize(10);
      
      y = 60; // Position for the first hydraulic result
      doc.text(`Peak Flow: ${hydraulicResult.Qrational?.toFixed(2) || "--"} m³/s`, 30, y); y += 8;
      doc.text(`Capacity: ${hydraulicResult.capacity?.toFixed(2) || "--"} m³/s`, 30, y); y += 8;
      doc.text(`Control Type: ${hydraulicResult.controlType || "--"}`, 30, y); y += 8;
      doc.text(`Headwater Depth: ${hydraulicResult.headwaterDepth?.toFixed(2) || "--"} m`, 30, y); y += 8;
      doc.text(`Velocity: ${hydraulicResult.velocity?.toFixed(2) || "--"} m/s`, 30, y); y += 16;
      
      // Recommendations
      if (hydraulicResult.recommendations?.length) {
        doc.text("Recommendations:", 30, y); y += 8;
        hydraulicResult.recommendations.forEach(rec => {
          doc.text(`• ${rec}`, 35, y);
          y += 6;
        });
      }
    }
    
    // Structural results
    if (structuralResult) {
      doc.setFontSize(14);
      doc.text("Structural Results", 20, y + 10);
      doc.setFontSize(10);
      
      y += 20; // Move down for structural results
      doc.text(`Total Load: ${structuralResult.totalLoad?.toFixed(2) || "--"} kN/m`, 30, y); y += 8;
      doc.text(`Moment Capacity: ${structuralResult.momentCapacity?.toFixed(2) || "--"} kN·m`, 30, y); y += 8;
      doc.text(`Required Moment: ${structuralResult.requiredMoment?.toFixed(2) || "--"} kN·m`, 30, y); y += 8;
      doc.text(`Safety Factor: ${structuralResult.safetyFactor?.toFixed(2) || "--"}`, 30, y); y += 8;
      doc.text(`Deflection: ${structuralResult.deflection?.toFixed(2) || "--"} mm`, 30, y); y += 16;
      
      // Recommendations
      if (structuralResult.recommendations?.length) {
        doc.text("Recommendations:", 30, y); y += 8;
        structuralResult.recommendations.forEach(rec => {
          doc.text(`• ${rec}`, 35, y);
          y += 6;
        });
      }
    }
    
    // Save the PDF
    doc.save("culvert_design_report.pdf");
  }
  // Add this function for cost estimation
function estimateCulvertCost(params) {
  const {
    culvertType, material, diameter, width, length, wallThickness = 150
  } = params;
  
  // Base costs per unit volume of material (relative values, adjust as needed)
  const baseCosts = {
    'concrete': 150,       // $/m³
    'corrugated-metal': 240, // $/m³
    'plastic': 180,        // $/m³
    'steel': 300           // $/m³
  };
  
  // Installation factors
  const installationFactors = {
    'circular': 1.0,
    'box': 1.2,
    'arch': 1.3,
    'pipe-arch': 1.1
  };
  
  // Volume calculation
  let volume;
  if (culvertType === 'circular') {
    // Pipe volume = π * ((D/2)² - (D/2 - t)²) * L
    const outerRadius = diameter / 2;
    const innerRadius = outerRadius - (wallThickness / 1000);
    volume = Math.PI * (Math.pow(outerRadius, 2) - Math.pow(innerRadius, 2)) * length;
  } else {
    // Box/arch volume = 2(W+H)*t*L (simplified)
    volume = 2 * (width + diameter) * (wallThickness / 1000) * length;
  }
  
  // Calculate material cost
  const materialCost = baseCosts[material] * volume;
  
  // Add installation cost
  const installationCost = materialCost * installationFactors[culvertType];
  
  // Add accessories cost (headwalls, wingwalls, aprons)
  const accessoriesCost = materialCost * 0.3;
  
  // Total cost
  const totalCost = materialCost + installationCost + accessoriesCost;
  
  return {
    materialCost: Math.round(materialCost),
    installationCost: Math.round(installationCost),
    accessoriesCost: Math.round(accessoriesCost),
    totalCost: Math.round(totalCost)
  };
}

  return (
    <div className="culvert-tool">
      <header className="culvert-header">
        <h1><span role="img" aria-label="water">💧</span> Culvert Design Assistant</h1>
        <p>Hydraulic and structural design checks for culverts (BS/EN compliant)</p>
      </header>
      <nav className="culvert-tabs">
        {tabList.map(t => (
          <button
            key={t.id}
            className={`culvert-tab-btn${tab === t.id ? ' active' : ''}`}
            onClick={() => setTab(t.id)}
            data-tab={t.id}
          >
            <span style={{ marginRight: 8 }}>{t.icon}</span>{t.label}
          </button>
        ))}
      </nav>
      <div className="culvert-tab-content">
        {tab === 'hydraulic' && (
          <section>
            <h2>Hydraulic Parameters</h2>
            <div className="culvert-form-grid">
              <div>
                <label>Culvert Type</label>
                <select name="culvertType" value={hydraulic.culvertType} onChange={handleHydraulicChange}>
                  <option value="circular">Circular (Pipe)</option>
                  <option value="box">Box Culvert</option>
                  <option value="arch">Arch Culvert</option>
                  <option value="pipe-arch">Pipe Arch</option>
                </select>
              </div>
              <div>
                <label>Material</label>
                <select name="material" value={hydraulic.material} onChange={handleHydraulicChange}>
                  <option value="concrete">Concrete</option>
                  <option value="corrugated-metal">Corrugated Metal</option>
                  <option value="plastic">Plastic (HDPE)</option>
                  <option value="steel">Steel</option>
                </select>
              </div>
              <div>
                <label>Diameter/Height (m)</label>
                <input type="number" name="diameter" value={hydraulic.diameter} min="0.1" step="0.01" onChange={handleHydraulicChange} />
              </div>
              <div>
                <label>Width (m)</label>
                <input type="number" name="width" value={hydraulic.width} min="0.1" step="0.01" onChange={handleHydraulicChange} />
              </div>
              <div>
                <label>Length (m)</label>
                <input type="number" name="length" value={hydraulic.length} min="1" step="0.1" onChange={handleHydraulicChange} />
              </div>
              <div>
                <label>Inlet Elevation (m)</label>
                <input type="number" name="inletElevation" value={hydraulic.inletElevation} min="0" step="0.01" onChange={handleHydraulicChange} />
              </div>
              <div>
                <label>Outlet Elevation (m)</label>
                <input type="number" name="outletElevation" value={hydraulic.outletElevation} min="0" step="0.01" onChange={handleHydraulicChange} />
              </div>
              <div>
                <label>Slope (%)</label>
                <input type="number" value={slope.toFixed(2)} readOnly />
              </div>
              <div>
                <label>Rainfall Intensity (mm/hr)</label>
                <input type="number" name="rainfallIntensity" value={hydraulic.rainfallIntensity} min="10" step="1" onChange={handleHydraulicChange} />
              </div>
              <div>
                <label>Catchment Area (ha)</label>
                <input type="number" name="catchmentArea" value={hydraulic.catchmentArea} min="0.01" step="0.01" onChange={handleHydraulicChange} />
              </div>
              <div>
                <label>Runoff Coefficient</label>
                <input type="number" name="runoffCoefficient" value={hydraulic.runoffCoefficient} min="0.1" max="1.0" step="0.01" onChange={handleHydraulicChange} />
              </div>
              <div>
                <label>Tailwater Depth (m)</label>
                <input type="number" name="tailwaterDepth" value={hydraulic.tailwaterDepth} min="0" step="0.01" onChange={handleHydraulicChange} />
              </div>
              <div>
                <label>Entrance Type</label>
                <select name="entranceType" value={hydraulic.entranceType} onChange={handleHydraulicChange}>
                  <option value="headwall">Headwall</option>
                  <option value="mitered">Mitered</option>
                  <option value="projecting">Projecting</option>
                  <option value="wingwall">Wingwall</option>
                </select>
              </div>
              <div>
                <label>Design Flow (m³/s)</label>
                <input type="number" name="designFlow" value={hydraulic.designFlow} min="0.01" step="0.01" onChange={handleHydraulicChange} />
              </div>
              <div>
                <label>Manning's n</label>
                <input type="number" name="roughness" value={hydraulic.roughness} min="0.01" max="0.1" step="0.001" onChange={handleHydraulicChange} />
              </div>
              <div>
                <label>Inlet Conditions</label>
                <div className="culvert-radio-group">
                  <label>
                    <input type="radio" name="inletCondition" value="unsubmerged" checked={hydraulic.inletCondition === 'unsubmerged'} onChange={handleHydraulicChange} />
                    Unsubmerged
                  </label>
                  <label>
                    <input type="radio" name="inletCondition" value="submerged" checked={hydraulic.inletCondition === 'submerged'} onChange={handleHydraulicChange} />
                    Submerged
                  </label>
                </div>
              </div>
            </div>
            <button className="culvert-calc-btn" onClick={handleHydraulicCalc}>
              <span role="img" aria-label="calculator">🧮</span> Calculate Hydraulic Performance
            </button>
            {hydraulicResult && (
              <div className="culvert-results">
                <h3>Hydraulic Results</h3>
                <div className="culvert-results-grid">
                  <div className="culvert-result-card blue">
                    <div className="label">Peak Flow (Q)</div>
                    <div className="value">
                      {hydraulicResult.Qrational !== undefined && !isNaN(hydraulicResult.Qrational)
                        ? hydraulicResult.Qrational.toFixed(2) + " m³/s"
                        : "--"}
                    </div>
                  </div>
                  <div className="culvert-result-card green">
                    <div className="label">Capacity</div>
                    <div className="value">{hydraulicResult.capacity.toFixed(2)} m³/s</div>
                  </div>
                  <div className="culvert-result-card purple">
                    <div className="label">Control Type</div>
                    <div className="value">{hydraulicResult.controlType}</div>
                  </div>
                  <div className="culvert-result-card yellow">
                    <div className="label">Headwater Depth</div>
                    <div className="value">{hydraulicResult.headwaterDepth.toFixed(2)} m</div>
                  </div>
                  <div className="culvert-result-card red">
                    <div className="label">Velocity</div>
                    <div className="value">{hydraulicResult.velocity.toFixed(2)} m/s</div>
                  </div>
                </div>
                <div className="culvert-recommendations">
                  <h4>Design Recommendations & Code References</h4>
                  <ul>
                    {hydraulicResult.recommendations.map((rec, i) => <li key={i}>{rec}</li>)}
                  </ul>
                </div>
              </div>
            )}
            {/* Culvert Diagram */}
            <div className="culvert-diagram-box">
              <h3 className="culvert-diagram-title">Culvert Diagram</h3>
              <svg viewBox="0 0 200 100" width="100%" height="80" style={{ background: "#f1f5fd", borderRadius: 8 }}>
                {/* Barrel */}
                <rect x="20" y="40" width="160" height="20" fill="#cbd5e1" stroke="#4b5563" />
                {/* Inlet/Outlet lines */}
                <line x1="20" y1="40" x2="20" y2="60" stroke="#4b5563" strokeWidth="2" />
                <line x1="180" y1="40" x2="180" y2="60" stroke="#4b5563" strokeWidth="2" />
                {/* Labels */}
                <text x="100" y="35" fontFamily="Arial" fontSize="10" textAnchor="middle" fill="#4b5563">Culvert Barrel</text>
                <text x="10" y="50" fontFamily="Arial" fontSize="8" textAnchor="middle" fill="#4b5563">Inlet</text>
                <text x="190" y="50" fontFamily="Arial" fontSize="8" textAnchor="middle" fill="#4b5563">Outlet</text>
              </svg>
              <div className="culvert-diagram-caption">
                <span role="img" aria-label="info">ℹ️</span> Adjust parameters to see how they affect culvert performance.
              </div>
            </div>
          </section>
        )}
        {tab === 'structural' && (
          <section>
            <h2>Structural Parameters</h2>
            <div className="culvert-form-grid">
              <div>
                <label>Culvert Type</label>
                <select name="culvertType" value={structural.culvertType} onChange={handleStructuralChange}>
                  <option value="circular">Circular (Pipe)</option>
                  <option value="box">Box Culvert</option>
                  <option value="arch">Arch Culvert</option>
                </select>
              </div>
              <div>
                <label>Material</label>
                <select name="material" value={structural.material} onChange={handleStructuralChange}>
                  <option value="concrete">Concrete</option>
                  <option value="corrugated-metal">Corrugated Metal</option>
                  <option value="plastic">Plastic (HDPE)</option>
                  <option value="steel">Steel</option>
                </select>
              </div>
              <div>
                <label>Diameter/Height (m)</label>
                <input type="number" name="diameter" value={structural.diameter} min="0.1" step="0.01" onChange={handleStructuralChange} />
              </div>
              <div>
                <label>Width (m)</label>
                <input type="number" name="width" value={structural.width} min="0.1" step="0.01" onChange={handleStructuralChange} />
              </div>
              <div>
                <label>Length (m)</label>
                <input type="number" name="length" value={structural.length} min="1" step="0.1" onChange={handleStructuralChange} />
              </div>
              <div>
                <label>Fill Height (m)</label>
                <input type="number" name="fillHeight" value={structural.fillHeight} min="0" step="0.1" onChange={handleStructuralChange} />
              </div>
              <div>
                <label>Soil Density (kg/m³)</label>
                <input type="number" name="soilDensity" value={structural.soilDensity} min="1000" max="2500" step="1" onChange={handleStructuralChange} />
              </div>
              <div>
                <label>Soil Type</label>
                <select name="soilType" value={structural.soilType} onChange={handleStructuralChange}>
                  <option value="granular">Granular</option>
                  <option value="cohesive">Cohesive</option>
                </select>
              </div>
              <div>
                <label>Bedding Class</label>
                <select name="beddingClass" value={structural.beddingClass} onChange={handleStructuralChange}>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                </select>
              </div>
              <div>
                <label>Live Load (kN/m²)</label>
                <input type="number" name="liveLoad" value={structural.liveLoad} min="0" step="1" onChange={handleStructuralChange} />
              </div>
              <div>
                <label>Vehicle Load</label>
                <select name="vehicleLoad" value={structural.vehicleLoad} onChange={handleStructuralChange}>
                  <option value="LM1">EN 1991-2 LM1</option>
                  <option value="LM2">EN 1991-2 LM2</option>
                </select>
              </div>
              <div>
                <label>Wall Thickness (mm)</label>
                <input type="number" name="wallThickness" value={structural.wallThickness} min="50" step="1" onChange={handleStructuralChange} />
              </div>
              <div>
                <label>Material Strength (MPa)</label>
                <input type="number" name="materialStrength" value={structural.materialStrength} min="10" step="1" onChange={handleStructuralChange} />
              </div>
              <div>
                <label>γ<sub>G</sub> (Dead Load Factor)</label>
                <input type="number" name="gammaG" value={structural.gammaG} min="1.0" max="2.0" step="0.01" onChange={handleStructuralChange} />
              </div>
              <div>
                <label>γ<sub>Q</sub> (Live Load Factor)</label>
                <input type="number" name="gammaQ" value={structural.gammaQ} min="1.0" max="2.0" step="0.01" onChange={handleStructuralChange} />
              </div>
              <div>
                <label>γ<sub>M</sub> (Material Factor)</label>
                <input type="number" name="gammaM" value={structural.gammaM} min="1.0" max="2.0" step="0.01" onChange={handleStructuralChange} />
              </div>
            </div>
            <button className="culvert-calc-btn" onClick={handleStructuralCalc}>
              <span role="img" aria-label="calculator">🧮</span> Calculate Structural Performance
            </button>
            {structuralResult && (
              <div className="culvert-results">
                <h3>Structural Results</h3>
                <div className="culvert-results-grid">
                  <div className="culvert-result-card blue">
                    <div className="label">Total Load (ULS)</div>
                    <div className="value">{structuralResult.totalLoad.toFixed(2)} kN/m</div>
                  </div>
                  <div className="culvert-result-card green">
                    <div className="label">Moment Capacity</div>
                    <div className="value">{structuralResult.momentCapacity.toFixed(2)} kN·m</div>
                  </div>
                  <div className="culvert-result-card purple">
                    <div className="label">Required Moment</div>
                    <div className="value">{structuralResult.requiredMoment.toFixed(2)} kN·m</div>
                  </div>
                  <div className="culvert-result-card yellow">
                    <div className="label">Safety Factor</div>
                    <div className="value">{structuralResult.safetyFactor.toFixed(2)}</div>
                  </div>
                  <div className="culvert-result-card red">
                    <div className="label">Deflection</div>
                    <div className="value">{structuralResult.deflection.toFixed(2)} mm</div>
                  </div>
                </div>
                <div className="culvert-recommendations">
                  <h4>Design Recommendations & Code References</h4>
                  <ul>
                    {structuralResult.recommendations.map((rec, i) => <li key={i}>{rec}</li>)}
                  </ul>
                </div>
              </div>
            )}
            {/* Load Diagram */}
            <div className="culvert-diagram-box">
              <h3 className="culvert-diagram-title">Load Diagram</h3>
              <svg viewBox="0 0 200 80" width="100%" height="70" style={{ background: "#f1f5fd", borderRadius: 8 }}>
                {/* Soil fill */}
                <rect x="30" y="10" width="140" height="20" fill="#fde68a" />
                {/* Culvert */}
                <rect x="30" y="30" width="140" height="20" fill="#cbd5e1" stroke="#4b5563" />
                {/* Live load arrows */}
                <line x1="60" y1="5" x2="60" y2="10" stroke="#f59e42" strokeWidth="3" markerEnd="url(#arrow)" />
                <line x1="140" y1="5" x2="140" y2="10" stroke="#f59e42" strokeWidth="3" markerEnd="url(#arrow)" />
                <defs>
                  <marker id="arrow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                    <path d="M0,0 L6,3 L0,6 Z" fill="#f59e42" />
                  </marker>
                </defs>
                {/* Labels */}
                <text x="100" y="25" fontFamily="Arial" fontSize="10" textAnchor="middle" fill="#b45309">Soil Fill</text>
                <text x="100" y="45" fontFamily="Arial" fontSize="10" textAnchor="middle" fill="#4b5563">Culvert</text>
                <text x="60" y="15" fontFamily="Arial" fontSize="8" textAnchor="middle" fill="#f59e42">Live Load</text>
                <text x="140" y="15" fontFamily="Arial" fontSize="8" textAnchor="middle" fill="#f59e42">Live Load</text>
              </svg>
              <div className="culvert-diagram-caption">
                <span role="img" aria-label="info">ℹ️</span> Soil fill and live load on culvert.
              </div>
            </div>
          </section>
        )}
        {tab === 'analysis' && (
          <section>
            <h2>Analysis &amp; Comparison</h2>

            <div className="culvert-analysis-grid">
              <div className="culvert-analysis-chart">
                <h4>Capacity vs. Diameter (Slope: 5%, Material: {defaultHydraulic.material})</h4>
                <Line
                  data={getCapacityChartData()}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: { display: true, position: 'top' },
                      title: { display: false }
                    },
                    scales: {
                      x: { title: { display: true, text: 'Diameter/Height (m)' } },
                      y: { title: { display: true, text: 'Capacity (m³/s)' }, beginAtZero: true }
                    }
                  }}
                />
              </div>

              <div className="culvert-analysis-chart">
                <h4>Velocity vs. Diameter (Slope: 5%, Material: {defaultHydraulic.material})</h4>
                <Line
                  data={getVelocityChartData()}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: { display: true, position: 'top' },
                      title: { display: false }
                    },
                    scales: {
                      x: { title: { display: true, text: 'Diameter/Height (m)' } },
                      y: { title: { display: true, text: 'Velocity (m/s)' }, beginAtZero: true }
                    }
                  }}
                />
              </div>
            </div>

            <div className="culvert-analysis-table" style={{ marginTop: 24 }}>
              <h4>Capacity Sensitivity to Slope (D = {defaultHydraulic.diameter} m, Material: {defaultHydraulic.material})</h4>
              <table>
                <thead>
                  <tr>
                    <th>Slope (%)</th>
                    <th>Capacity (m³/s)</th>
                  </tr>
                </thead>
                <tbody>
                  {getCapacitySlopeTable().map(row => (
                    <tr key={row.slope}>
                      <td>{row.slope}</td>
                      <td>{row.capacity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="culvert-analysis-chart" style={{ marginTop: 24 }}>
              <h4>Material Comparison (D = {defaultHydraulic.diameter} m, Slope: 5%)</h4>
              <Line
                data={getMaterialComparisonData()}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { display: true, position: 'top' },
                    title: { display: false }
                  },
                  scales: {
                    y: { 
                      type: 'linear',
                      display: true,
                      position: 'left',
                      title: { display: true, text: 'Capacity (m³/s)' }
                    },
                    y1: {
                      type: 'linear',
                      display: true,
                      position: 'right',
                      title: { display: true, text: 'Relative Cost' },
                      grid: { drawOnChartArea: false }
                    }
                  }
                }}
              />
            </div>
            
            {/* Cost estimation */}
            <div className="culvert-analysis-section" style={{ marginTop: 24 }}>
              <h4>Cost Estimation</h4>
              <div className="culvert-cost-form">
                <div className="culvert-form-row">
                  <label>Culvert Type:</label>
                  <select name="costCulvertType" value={costParams?.culvertType || defaultHydraulic.culvertType} 
                          onChange={e => setCostParams(prev => ({...prev, culvertType: e.target.value}))}>
                    <option value="circular">Circular</option>
                    <option value="box">Box</option>
                    <option value="arch">Arch</option>
                    <option value="pipe-arch">Pipe Arch</option>
                  </select>
                  
                  <label>Material:</label>
                  <select name="costMaterial" value={costParams?.material || defaultHydraulic.material} 
                          onChange={e => setCostParams(prev => ({...prev, material: e.target.value}))}>
                    <option value="concrete">Concrete</option>
                    <option value="corrugated-metal">Corrugated Metal</option>
                    <option value="plastic">Plastic (HDPE)</option>
                    <option value="steel">Steel</option>
                  </select>
                  {/* Add inputs for D, W, L, T_wall for cost if they should be different from main design tabs */}
                  <button className="culvert-calc-btn" onClick={handleCostEstimate}>
                    Estimate Cost
                  </button>
                </div>
              </div>
              
              {costResult && (
                <div className="culvert-cost-results">
                  <div className="culvert-cost-card">
                    <div className="cost-label">Material Cost</div>
                    <div className="cost-value">${costResult.materialCost.toLocaleString()}</div>
                  </div>
                  <div className="culvert-cost-card">
                    <div className="cost-label">Installation</div>
                    <div className="cost-value">${costResult.installationCost.toLocaleString()}</div>
                  </div>
                  <div className="culvert-cost-card">
                    <div className="cost-label">Accessories</div>
                    <div className="cost-value">${costResult.accessoriesCost.toLocaleString()}</div>
                  </div>
                  <div className="culvert-cost-card total">
                    <div className="cost-label">Total Cost</div>
                    <div className="cost-value">${costResult.totalCost.toLocaleString()}</div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Export buttons */}
            <div className="culvert-export-section" style={{ marginTop: 24 }}>
              <h4>Export Results</h4>
              <div className="culvert-export-buttons">
                <button className="culvert-export-btn" onClick={() => exportToCSV(hydraulicResult, structuralResult)}>
                  <span role="img" aria-label="csv">📊</span> Export to CSV
                </button>
                <button className="culvert-export-btn" onClick={() => exportToPDF(hydraulicResult, structuralResult)}>
                  <span role="img" aria-label="pdf">📄</span> Export to PDF
                </button>
              </div>
            </div>
          </section>
        )}
      </div>
      <footer className="culvert-footer">
        <p>Culvert Design Assistant v1.0 - BS/EN Engineering Checks</p>
        <p>Always consult with a licensed engineer for professional designs</p>
      </footer>
    </div>
  );
}