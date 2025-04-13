import React, { useState, useRef } from 'react'; // Added useRef
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import './ConstructionCostEstimator.css';

const ConstructionCostEstimator = () => {
  const [projectData, setProjectData] = useState({
    // Project basics
    projectType: 'residential', // residential, commercial, institutional
    totalArea: 150,         // square meters
    numFloors: 1,
    region: 'nairobi', // nairobi, mombasa, kisumu, nakuru, eldoret, rural
    
    // Construction type
    structureType: 'stone_concrete', // stone_concrete, steel_frame, timber, prefab
    finishingLevel: 'standard', // basic, standard, high_end
    
    // Additional features
    hasBasement: false,
    hasParkingSpaces: 0, // Number of parking spaces
    hasBoundaryWall: false, // Perimeter wall
    hasLandscaping: false,
    
    // Cost factors (Percentages or specific inputs)
    professionalFeesPercentage: 10, // Architect, QS, Engineer fees (% of construction cost)
    permitCostsEstimate: 50000, // Estimated fixed cost for permits (KES) - Highly variable
    sitePrepCostEstimate: 30000, // Estimated fixed cost for basic site prep (KES) - Highly variable
    overheadPercentage: 15, // Contractor overhead
    profitPercentage: 10, // Contractor profit
    contingencyPercentage: 10 // Contingency
  });

  const [results, setResults] = useState(null);
  const [errors, setErrors] = useState({});
  const resultsRef = useRef(null); // Ref for PDF export content

  // --- Kenyan Market Estimates (KES per m²) - **ILLUSTRATIVE - UPDATED BASED ON 2024 NAIROBI DATA - NEEDS LOCAL VERIFICATION** ---
  const baseRatesKES = {
    residential: { // Approx. 2024 Nairobi Estimates (KES/m²) - Mapped from Apartment data
      stone_concrete: { basic: 30100, standard: 42250, high_end: 52900 }, // basic estimated @ ~80% of standard low-rise
      // Rates for other structure types are illustrative placeholders
      steel_frame: { basic: 40000, standard: 55000, high_end: 75000 },
      timber: { basic: 30000, standard: 40000, high_end: 55000 },
      prefab: { basic: 25000, standard: 35000, high_end: 50000 }
    },
    commercial: { // Approx. 2024 Nairobi Estimates (KES/m²) - Mapped from High-Rise Office data
      stone_concrete: { basic: 39800, standard: 49750, high_end: 68550 }, // basic estimated @ ~80% of standard
      // Rates for other structure types are illustrative placeholders
      steel_frame: { basic: 50000, standard: 65000, high_end: 90000 },
    },
     institutional: { // Approx. 2025 Estimates (KES/m²) - Kept previous estimates, needs 2024 data
      stone_concrete: { basic: 38000, standard: 50000, high_end: 70000 },
      steel_frame: { basic: 45000, standard: 60000, high_end: 85000 },
    },
    industrial: { // Approx. 2024 Nairobi Estimates (KES/m²) - Mapped from Factory/Warehouse data
       stone_concrete: { basic: 41100, standard: 44000, high_end: 81700 }, // basic=Cold Storage/Warehouse, standard=Factory, high_end=High Tech
       // Rates for other structure types are illustrative placeholders
       steel_frame: { basic: 45000, standard: 55000, high_end: 90000 }, // Placeholder
    }
  };

  // Regional cost adjustment factors (Relative to Nairobi=1.0) - **ILLUSTRATIVE - NEEDS VERIFICATION**
  // Note: 2024 Coast data provided suggests higher costs than Nairobi, contradicting these factors. Use with caution.
  const regionFactors = {
    nairobi: 1.0,
    mombasa: 0.95, // Kept previous factor despite conflicting 2024 Coast data
    kisumu: 0.90,
    nakuru: 0.88,
    eldoret: 0.85,
    rural: 0.80
  };

  // --- Additional Costs Estimates (KES) - **ILLUSTRATIVE** ---
  const additionalCostEstimates = {
      basementPerSqm: 15000, // Cost per sqm of basement area (approx)
      parkingSpaceCost: 250000, // Cost per dedicated parking space (structured/paved)
      boundaryWallPerMeter: 8000, // Cost per linear meter of standard stone wall
      landscapingPerSqm: 1500 // Basic landscaping cost per sqm of landscaped area
  };

  const validateInputs = () => {
    const newErrors = {};
    if (projectData.totalArea <= 0) newErrors.totalArea = 'Total area must be positive';
    if (projectData.numFloors <= 0) newErrors.numFloors = 'Number of floors must be positive';
    if (!baseRatesKES[projectData.projectType] || !baseRatesKES[projectData.projectType][projectData.structureType]) {
        newErrors.structureType = `Structure type '${projectData.structureType}' not valid for project type '${projectData.projectType}'.`;
    } else if (!baseRatesKES[projectData.projectType][projectData.structureType][projectData.finishingLevel]) {
         newErrors.finishingLevel = `Finishing level '${projectData.finishingLevel}' not valid for selected structure/project type.`;
    }
    // Add more specific validations as needed
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateCosts = () => {
    if (!validateInputs()) return;

    try {
      const {
        projectType, totalArea, numFloors, region, structureType, finishingLevel,
        hasBasement, hasParkingSpaces, hasBoundaryWall, hasLandscaping,
        professionalFeesPercentage, permitCostsEstimate, sitePrepCostEstimate,
        overheadPercentage, profitPercentage, contingencyPercentage
      } = projectData;

      // --- 1. Base Building Cost ---
      const baseRate = baseRatesKES[projectType]?.[structureType]?.[finishingLevel] || 0;
      const regionFactor = regionFactors[region] || 1.0;
      let baseBuildingCost = baseRate * totalArea * regionFactor;
      // Floor multiplier (adjust if needed - e.g., higher floors might cost slightly more)
      baseBuildingCost *= (1 + (numFloors - 1) * 0.03); // Example: 3% increase per additional floor

      // --- 2. Additional Features Costs ---
      // Basement: Assume basement area is roughly totalArea/numFloors for simplicity
      const basementArea = hasBasement ? (totalArea / numFloors) : 0;
      const basementCost = basementArea * additionalCostEstimates.basementPerSqm;

      // Parking
      const parkingCost = (parseInt(hasParkingSpaces) || 0) * additionalCostEstimates.parkingSpaceCost;

      // Boundary Wall: Estimate perimeter length (highly approximate) - e.g., sqrt(area)*4
      // A better input would be actual perimeter length
      const estimatedPerimeter = hasBoundaryWall ? Math.sqrt(totalArea / numFloors) * 4 : 0;
      const boundaryWallCost = estimatedPerimeter * additionalCostEstimates.boundaryWallPerMeter;

      // Landscaping: Estimate landscaped area (highly approximate) - e.g., 20% of plot area
      // A better input would be actual landscaping area
      const estimatedLandscapingArea = hasLandscaping ? (totalArea / numFloors) * 0.2 : 0;
      const landscapingCost = estimatedLandscapingArea * additionalCostEstimates.landscapingPerSqm;

      const totalAdditionalFeaturesCost = basementCost + parkingCost + boundaryWallCost + landscapingCost;

      // --- 3. Preliminaries & Site Costs ---
      const sitePrepCost = parseFloat(sitePrepCostEstimate) || 0;
      const permitCost = parseFloat(permitCostsEstimate) || 0;
      const preliminariesCost = sitePrepCost + permitCost; // Simplified

      // --- 4. Subtotal Construction Cost ---
      // (Cost before professional fees, overhead, profit, contingency related to construction)
      const subtotalConstruction = baseBuildingCost + totalAdditionalFeaturesCost + preliminariesCost;

      // --- 5. Professional Fees ---
      const professionalFees = subtotalConstruction * (professionalFeesPercentage / 100);

      // --- 6. Total Base Cost (Construction + Fees + Preliminaries) ---
      const totalBaseCost = subtotalConstruction + professionalFees;

      // --- 7. Contractor Overheads & Profit ---
      const overhead = totalBaseCost * (overheadPercentage / 100);
      const profit = totalBaseCost * (profitPercentage / 100);

      // --- 8. Subtotal Before Contingency ---
      const subtotalBeforeContingency = totalBaseCost + overhead + profit;

      // --- 9. Contingency ---
      const contingency = subtotalBeforeContingency * (contingencyPercentage / 100);

      // --- 10. Estimated Total Project Cost ---
      const totalCost = subtotalBeforeContingency + contingency;

      // --- 11. Cost per Square Meter ---
      const costPerSquareMeter = totalArea > 0 ? totalCost / totalArea : 0;

      // --- Set Results ---
      const formatKES = (value) => value ? value.toLocaleString('en-KE', { style: 'currency', currency: 'KES', minimumFractionDigits: 0, maximumFractionDigits: 0 }) : 'KES 0';

      setResults({
        // Input Summary
        projectType, totalArea, numFloors, region, structureType, finishingLevel,

        // Cost Breakdown
        baseBuildingCost: formatKES(baseBuildingCost),
        basementCost: formatKES(basementCost),
        parkingCost: formatKES(parkingCost),
        boundaryWallCost: formatKES(boundaryWallCost),
        landscapingCost: formatKES(landscapingCost),
        totalAdditionalFeaturesCost: formatKES(totalAdditionalFeaturesCost),
        preliminariesCost: formatKES(preliminariesCost), // Site Prep + Permits
        subtotalConstruction: formatKES(subtotalConstruction),
        professionalFees: formatKES(professionalFees),
        totalBaseCost: formatKES(totalBaseCost), // Construction + Fees + Prelims
        overhead: formatKES(overhead),
        profit: formatKES(profit),
        subtotalBeforeContingency: formatKES(subtotalBeforeContingency),
        contingency: formatKES(contingency),
        totalCost: formatKES(totalCost),
        costPerSquareMeter: `${formatKES(costPerSquareMeter)}/m²`,

        // Disclaimer & Notes
        pricingDisclaimer: `Based on illustrative market rates estimated for ${region} as of early 2025. Actual costs can vary significantly.`,
        notes: [
          'This is a preliminary budget estimate (+/- 20-30% accuracy typical).',
          'Excludes land acquisition costs, financing costs, and VAT (if applicable).',
          'Assumes standard site conditions and accessibility.',
          'Professional fees, permits, and site prep are estimates; obtain specific quotes.',
          'Boundary wall and landscaping costs are highly approximate based on estimated dimensions.'
        ],
        assumptions: [
          `Base Rate Used: ${formatKES(baseRate)}/m² for ${finishingLevel} ${structureType} ${projectType}.`,
          `Region Factor Applied: ${regionFactor} for ${region}.`,
          `Professional Fees: ${professionalFeesPercentage}%.`,
          `Overhead: ${overheadPercentage}%, Profit: ${profitPercentage}%, Contingency: ${contingencyPercentage}%.`
        ]
      });

    } catch (error) {
      console.error("Calculation Error:", error);
      setErrors({ calculation: 'Error during cost calculation. Check inputs and rates.' });
    }
  };

  // --- PDF Export Function ---
  const exportToPDF = () => {
    const input = resultsRef.current;
    if (!input || !results) return;

    html2canvas(input, { scale: 2 }) // Increase scale for better resolution
      .then((canvas) => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4'); // Portrait, mm, A4 size
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
        const imgX = (pdfWidth - imgWidth * ratio) / 2;
        const imgY = 10; // Add margin top

        pdf.setFontSize(16);
        pdf.text('Construction Cost Estimate Report', pdfWidth / 2, imgY, { align: 'center' });

        pdf.addImage(imgData, 'PNG', imgX, imgY + 10, imgWidth * ratio, imgHeight * ratio);

        // Add project summary text
        pdf.setFontSize(10);
        pdf.text(`Project: ${results.projectType}, ${results.totalArea}m², ${results.numFloors} floors`, 14, imgY + 15 + imgHeight * ratio);
        pdf.text(`Location: ${results.region}, Structure: ${results.structureType}, Finish: ${results.finishingLevel}`, 14, imgY + 20 + imgHeight * ratio);

        pdf.save(`Cost-Estimate-${results.projectType}-${results.region}-${new Date().toISOString().slice(0,10)}.pdf`);
      });
  };


  return (
    <div className="construction-cost-estimator">
      <h2>Construction Cost Estimator (Kenya)</h2>
      
      <div className="calculator-controls">
        <div className="input-sections">
          {/* Project Basics */}
          <div className="input-section">
            <h3>Project Basics</h3>
            <div className="input-group">
              <label>Project Type:</label>
              <select value={projectData.projectType} onChange={(e) => setProjectData({...projectData, projectType: e.target.value})}>
                <option value="residential">Residential</option>
                <option value="commercial">Commercial</option>
                <option value="institutional">Institutional</option>
                <option value="industrial">Industrial</option> {/* Added Industrial */}
              </select>
            </div>
            <div className="input-group">
              <label>Total Area (m²):</label>
              <input type="number" value={projectData.totalArea} onChange={(e) => setProjectData({...projectData, totalArea: parseFloat(e.target.value) || 0})} />
              {errors.totalArea && <span className="error-text">{errors.totalArea}</span>}
            </div>
            <div className="input-group">
              <label>Number of Floors:</label>
              <input type="number" value={projectData.numFloors} onChange={(e) => setProjectData({...projectData, numFloors: parseInt(e.target.value) || 0})} />
               {errors.numFloors && <span className="error-text">{errors.numFloors}</span>}
            </div>
            <div className="input-group">
              <label>Region:</label>
              <select value={projectData.region} onChange={(e) => setProjectData({...projectData, region: e.target.value})}>
                <option value="nairobi">Nairobi</option>
                <option value="mombasa">Mombasa</option>
                <option value="kisumu">Kisumu</option>
                <option value="nakuru">Nakuru</option>
                <option value="eldoret">Eldoret</option>
                <option value="rural">Rural/Other</option>
              </select>
            </div>
          </div>

          {/* Construction Details */}
          <div className="input-section">
            <h3>Construction Details</h3>
            <div className="input-group">
              <label>Structure Type:</label>
              <select value={projectData.structureType} onChange={(e) => setProjectData({...projectData, structureType: e.target.value})}>
                <option value="stone_concrete">Stone & Concrete Frame</option>
                <option value="steel_frame">Steel Frame</option>
                <option value="timber">Timber Frame</option>
                <option value="prefab">Prefabricated</option>
              </select>
               {errors.structureType && <span className="error-text">{errors.structureType}</span>}
            </div>
            <div className="input-group">
              <label>Finishing Level:</label>
              <select value={projectData.finishingLevel} onChange={(e) => setProjectData({...projectData, finishingLevel: e.target.value})}>
                <option value="basic">Basic</option>
                <option value="standard">Standard</option>
                <option value="high_end">High-End/Luxury</option>
              </select>
               {errors.finishingLevel && <span className="error-text">{errors.finishingLevel}</span>}
            </div>
          </div>

          {/* Additional Features */}
          <div className="input-section">
            <h3>Additional Features</h3>
            <div className="input-group checkbox">
              <input type="checkbox" checked={projectData.hasBasement} onChange={(e) => setProjectData({...projectData, hasBasement: e.target.checked})} />
              <label>Include Basement</label>
            </div>
             <div className="input-group">
              <label>Number of Parking Spaces:</label>
              <input type="number" value={projectData.hasParkingSpaces} onChange={(e) => setProjectData({...projectData, hasParkingSpaces: parseInt(e.target.value) || 0})} />
            </div>
             <div className="input-group checkbox">
              <input type="checkbox" checked={projectData.hasBoundaryWall} onChange={(e) => setProjectData({...projectData, hasBoundaryWall: e.target.checked})} />
              <label>Include Boundary Wall</label>
            </div>
            <div className="input-group checkbox">
              <input type="checkbox" checked={projectData.hasLandscaping} onChange={(e) => setProjectData({...projectData, hasLandscaping: e.target.checked})} />
              <label>Include Basic Landscaping</label>
            </div>
          </div>

          {/* Cost Factors */}
          <div className="input-section">
            <h3>Cost Factors & Allowances</h3>
             <div className="input-group">
              <label>Professional Fees (% of Const. Cost):</label>
              <input type="number" value={projectData.professionalFeesPercentage} onChange={(e) => setProjectData({...projectData, professionalFeesPercentage: parseFloat(e.target.value) || 0})} />
            </div>
             <div className="input-group">
              <label>Permit Costs Estimate (KES):</label>
              <input type="number" value={projectData.permitCostsEstimate} onChange={(e) => setProjectData({...projectData, permitCostsEstimate: parseFloat(e.target.value) || 0})} />
            </div>
             <div className="input-group">
              <label>Site Prep Estimate (KES):</label>
              <input type="number" value={projectData.sitePrepCostEstimate} onChange={(e) => setProjectData({...projectData, sitePrepCostEstimate: parseFloat(e.target.value) || 0})} />
            </div>
             <div className="input-group">
              <label>Contractor Overhead (%):</label>
              <input type="number" value={projectData.overheadPercentage} onChange={(e) => setProjectData({...projectData, overheadPercentage: parseFloat(e.target.value) || 0})} />
            </div>
             <div className="input-group">
              <label>Contractor Profit (%):</label>
              <input type="number" value={projectData.profitPercentage} onChange={(e) => setProjectData({...projectData, profitPercentage: parseFloat(e.target.value) || 0})} />
            </div>
             <div className="input-group">
              <label>Contingency (%):</label>
              <input type="number" value={projectData.contingencyPercentage} onChange={(e) => setProjectData({...projectData, contingencyPercentage: parseFloat(e.target.value) || 0})} />
            </div>
             {/* Removed direct labor inputs - now part of base rates */}
          </div>
        </div>

        {/* Error Display */}
        {Object.keys(errors).length > 0 && (
          <div className="errors">
            {Object.values(errors).map((error, index) => (
              <p key={index} className="error">{error}</p>
            ))}
          </div>
        )}

        <button className="calculate-button" onClick={calculateCosts}>
          Estimate Costs
        </button>

        {/* Results Section */}
        {results && (
          <div className="results-section-container"> {/* Added container for PDF */}
            <div className="results-section" ref={resultsRef}> {/* Added ref */}
              <h3>Cost Estimation Results</h3>
              <p className="disclaimer"><strong>Disclaimer:</strong> {results.pricingDisclaimer}</p>

              <div className="results-grid comprehensive"> {/* Added class */}
                {/* --- Cost Summary --- */}
                <div className="result-item total main-total">
                  <span className="result-label">Estimated Total Project Cost:</span>
                  <span className="result-value">{results.totalCost}</span>
                </div>
                 <div className="result-item">
                  <span className="result-label">Cost per Square Meter:</span>
                  <span className="result-value">{results.costPerSquareMeter}</span>
                </div>

                {/* --- Detailed Breakdown --- */}
                 <h4 className="results-subheader">Cost Breakdown</h4>
                 <div className="result-item">
                    <span className="result-label">1. Base Building Cost:</span>
                    <span className="result-value">{results.baseBuildingCost}</span>
                 </div>
                 <div className="result-item sub-item"> {/* Indent sub-items */}
                    <span className="result-label">2. Additional Features:</span>
                    <span className="result-value">{results.totalAdditionalFeaturesCost}</span>
                 </div>
                 {projectData.hasBasement && <div className="result-item sub-sub-item"><span className="result-label"> - Basement:</span><span className="result-value">{results.basementCost}</span></div>}
                 {projectData.hasParkingSpaces > 0 && <div className="result-item sub-sub-item"><span className="result-label"> - Parking:</span><span className="result-value">{results.parkingCost}</span></div>}
                 {projectData.hasBoundaryWall && <div className="result-item sub-sub-item"><span className="result-label"> - Boundary Wall (Est.):</span><span className="result-value">{results.boundaryWallCost}</span></div>}
                 {projectData.hasLandscaping && <div className="result-item sub-sub-item"><span className="result-label"> - Landscaping (Est.):</span><span className="result-value">{results.landscapingCost}</span></div>}

                 <div className="result-item sub-item">
                    <span className="result-label">3. Preliminaries & Site Costs:</span>
                    <span className="result-value">{results.preliminariesCost}</span>
                 </div>
                 <div className="result-item sub-item">
                    <span className="result-label">4. Professional Fees ({projectData.professionalFeesPercentage}%):</span>
                    <span className="result-value">{results.professionalFees}</span>
                 </div>
                 <div className="result-item sub-item total-line"> {/* Add line */}
                    <span className="result-label">Subtotal (Construction + Fees + Prelims):</span>
                    <span className="result-value">{results.totalBaseCost}</span>
                 </div>
                 <div className="result-item sub-item">
                    <span className="result-label">5. Contractor Overhead ({projectData.overheadPercentage}%):</span>
                    <span className="result-value">{results.overhead}</span>
                 </div>
                 <div className="result-item sub-item">
                    <span className="result-label">6. Contractor Profit ({projectData.profitPercentage}%):</span>
                    <span className="result-value">{results.profit}</span>
                 </div>
                  <div className="result-item sub-item total-line">
                    <span className="result-label">Subtotal before Contingency:</span>
                    <span className="result-value">{results.subtotalBeforeContingency}</span>
                 </div>
                 <div className="result-item sub-item">
                    <span className="result-label">7. Contingency ({projectData.contingencyPercentage}%):</span>
                    <span className="result-value">{results.contingency}</span>
                 </div>
                 <div className="result-item total final-total"> {/* Final total emphasis */}
                    <span className="result-label">Estimated Total Project Cost:</span>
                    <span className="result-value">{results.totalCost}</span>
                 </div>


                {/* --- Assumptions & Notes --- */}
                <div className="result-item notes assumptions"> {/* Combined */}
                  <span className="result-label">Key Assumptions & Notes:</span>
                  <ul>
                    {results.assumptions.map((assumption, index) => ( <li key={`ass-${index}`}><i>{assumption}</i></li> ))}
                    {results.notes.map((note, index) => ( <li key={`note-${index}`}>{note}</li> ))}
                  </ul>
                </div>
              </div>
            </div>
            <button onClick={exportToPDF} className="export-button">Export Results to PDF</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConstructionCostEstimator;