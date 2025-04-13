import React, { useState } from 'react';
import './ColumnDesignTool.css';

// --- Constants (Based on Eurocode 2 principles) ---
const GAMMA_C = 1.5; // Partial factor for concrete
const GAMMA_S = 1.15; // Partial factor for steel
const ALPHA_CC = 0.85; // Factor for long-term effects and load application on concrete strength

const ColumnDesignTool = () => {
  const [columnData, setColumnData] = useState({
    // Geometry
    length: 3000, // Effective length (Le), mm
    sectionType: 'rectangular',
    width: 300, // mm (b)
    depth: 300, // mm (h)
    diameter: 300, // mm (D)
    
    // Loading (Design values - N_Ed, M_Edx, M_Edy)
    axialLoad: 1000, // kN
    momentX: 50, // kNm (Moment about axis parallel to depth 'h')
    momentY: 30, // kNm (Moment about axis parallel to width 'b')
    
    // Material Properties
    concreteGrade: 30, // fck (MPa)
    steelGrade: 500, // fyk (MPa)
    
    // Reinforcement
    mainBarDiameter: 20, // mm
    stirrupDiameter: 8, // mm
    cover: 40, // mm (Nominal cover)
    // For Rectangular
    numberOfBarsX: 3, // Bars along face parallel to Y-axis (width side)
    numberOfBarsY: 3, // Bars along face parallel to X-axis (depth side)
    // For Circular
    numberOfBarsTotal: 8 // Total number of bars for circular
  });

  const [results, setResults] = useState(null);
  const [errors, setErrors] = useState({});

  // --- Dropdown Options ---
  const concreteGrades = [20, 25, 30, 35, 40, 45, 50, 55, 60];
  const steelGrades = [415, 500, 550]; // Common grades
  const barDiameters = [12, 16, 20, 25, 32, 40];
  const stirrupDiameters = [8, 10, 12];

  // --- Input Handling ---
  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    // Convert to number if it's a number input, otherwise keep as string (for select)
    const parsedValue = type === 'number' ? parseFloat(value) : value;
    
    setColumnData(prev => {
        const newData = { ...prev, [name]: parsedValue };
        // Reset bar numbers if section type changes
        if (name === 'sectionType') {
            if (parsedValue === 'rectangular') {
                newData.numberOfBarsTotal = 8; // Reset circular
            } else {
                newData.numberOfBarsX = 3; // Reset rectangular
                newData.numberOfBarsY = 3;
            }
        }
        return newData;
    });
    // Clear results when inputs change
    setResults(null);
    setErrors({}); // Clear errors on input change
  };

  // --- Validation ---
  const validateInputs = () => {
    const newErrors = {};
    const { length, sectionType, width, depth, diameter, axialLoad, steelGrade, mainBarDiameter, cover, numberOfBarsX, numberOfBarsY, numberOfBarsTotal } = columnData;

    // Basic checks
    if (length <= 0) newErrors.length = 'Effective length must be positive';
    if (axialLoad <= 0) newErrors.axialLoad = 'Design axial load must be positive';
    if (cover < 15) newErrors.cover = 'Cover seems too small'; // Practical minimum

    // Section dimensions
    if (sectionType === 'rectangular') {
      if (width < 200) newErrors.width = 'Min width typically 200mm';
      if (depth < 200) newErrors.depth = 'Min depth typically 200mm';
      if (numberOfBarsX < 2) newErrors.numberOfBarsX = 'Min 2 bars';
      if (numberOfBarsY < 2) newErrors.numberOfBarsY = 'Min 2 bars';
      if ((numberOfBarsX * 2 + (numberOfBarsY - 2) * 2) < 4) newErrors.numberOfBars = 'Min 4 bars total for rectangular';
    } else { // Circular
      if (diameter < 250) newErrors.diameter = 'Min diameter typically 250mm';
      if (numberOfBarsTotal < 4) newErrors.numberOfBarsTotal = 'Min 4 bars for circular'; // EC2 min is 4
    }
    
    // Calculate Ac first
    const b = sectionType === 'rectangular' ? width : diameter;
    const h = sectionType === 'rectangular' ? depth : diameter;
    const Ac = sectionType === 'rectangular' ? b * h : Math.PI * diameter * diameter / 4;
    
    // Reinforcement checks
    const fyd = (steelGrade || 500) / GAMMA_S; // Design yield strength
    const N_Ed = axialLoad * 1000; // Design axial load in N

    // Correctly calculate minimum steel RATIO (rho_min)
    const minSteelRatioPartA = (0.10 * N_Ed) / (fyd * Ac); // (0.10 * N_Ed / fyd) / Ac
    const minSteelRatioPartB = 0.002;
    const minSteelRatio = Math.max(minSteelRatioPartA, minSteelRatioPartB); 
    
    const maxSteelRatio = 0.04; // EC2 9.5.2 (3) - 4% generally, 8% at laps

    let numBars, As_provided;
    if (sectionType === 'rectangular') {
        // Ensure bars aren't double counted at corners
        numBars = (numberOfBarsX >= 2 && numberOfBarsY >= 2) ? (numberOfBarsX * 2 + (numberOfBarsY - 2) * 2) : 4; // Enforce minimum 4
        if (numBars < 4) numBars = 4; 
    } else {
        numBars = numberOfBarsTotal >= 4 ? numberOfBarsTotal : 4; // Enforce minimum 4
    }
    As_provided = numBars * (Math.PI * mainBarDiameter * mainBarDiameter / 4);
    const providedSteelRatio = As_provided / Ac;

    // Now compare ratio to ratio
    if (providedSteelRatio < minSteelRatio) {
        newErrors.steelRatio = `Steel ratio ${ (providedSteelRatio * 100).toFixed(2) }% is below minimum required ${ (minSteelRatio * 100).toFixed(2) }%`;
    }
    if (providedSteelRatio > maxSteelRatio) {
        newErrors.steelRatio = `Steel ratio ${ (providedSteelRatio * 100).toFixed(2) }% is above maximum allowed ${ (maxSteelRatio * 100) }%`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // --- Calculation Functions ---

  const getSectionProperties = () => {
    const { sectionType, width, depth, diameter, mainBarDiameter, cover, stirrupDiameter, numberOfBarsX, numberOfBarsY, numberOfBarsTotal } = columnData;
    
    const b = sectionType === 'rectangular' ? width : diameter;
    const h = sectionType === 'rectangular' ? depth : diameter;
    const Ac = sectionType === 'rectangular' ? b * h : Math.PI * b * b / 4;
    
    let numBars, As_provided;
     if (sectionType === 'rectangular') {
        numBars = (numberOfBarsX >= 2 && numberOfBarsY >= 2) ? (numberOfBarsX * 2 + (numberOfBarsY - 2) * 2) : 4; // Ensure min 4 bars
    } else {
        numBars = numberOfBarsTotal >= 4 ? numberOfBarsTotal : 4; // Ensure min 4 bars
    }
    As_provided = numBars * (Math.PI * mainBarDiameter * mainBarDiameter / 4);
    const steelRatio = As_provided / Ac;

    // Effective depth (approximate - assuming symmetrical reinforcement)
    const d_eff = h - cover - stirrupDiameter - mainBarDiameter / 2; 
    
    // Radius of gyration (approximate for rectangular, exact for circular)
    const Ix = sectionType === 'rectangular' ? (b * h * h * h) / 12 : (Math.PI * b * b * b * b) / 64;
    const Iy = sectionType === 'rectangular' ? (h * b * b * b) / 12 : Ix; // Same for circular
    const i_x = Math.sqrt(Ix / Ac);
    const i_y = Math.sqrt(Iy / Ac);

    return { b, h, Ac, As_provided, steelRatio, d_eff, i_x, i_y, numBars };
  };

  const getMaterialProperties = () => {
    const { concreteGrade, steelGrade } = columnData;
    const fck = concreteGrade;
    const fyk = steelGrade;
    const fcd = ALPHA_CC * fck / GAMMA_C; // Design compressive strength of concrete
    const fyd = fyk / GAMMA_S; // Design yield strength of steel
    const Ecm = 22 * Math.pow(fck / 10 + 0.8, 0.3) * 1000; // Mean modulus of elasticity of concrete (MPa) - EC2 Table 3.1
    const Es = 200000; // Modulus of elasticity of steel (MPa)

    return { fck, fyk, fcd, fyd, Ecm, Es };
  };

  const checkSlenderness = (Le, i, fck, fyd, axialLoad, Ac, As_provided) => {
      const lambda = Le / i; // Slenderness ratio
      
      // Simplified limiting slenderness (EC2 5.8.3.1 (1)) - conservative approximation factors A=0.7, B=1.1, C=0.7
      const n_u = 1 + (axialLoad * 1000) / (Ac * (ALPHA_CC * fck / GAMMA_C)); // Approx axial load ratio factor
      const lambda_lim = (20 * 0.7 * 1.1 * 0.7) / Math.sqrt(n_u); // Simplified lambda_lim
      
      const isSlender = lambda > lambda_lim;
      
      return { lambda, lambda_lim, isSlender };
  };

  const calculateSecondOrderMoments = (isSlender, Le, Ecm, Ix, Iy, axialLoad) => {
      if (!isSlender) {
          return { M_Edx_2nd: 0, M_Edy_2nd: 0 };
      }
      // Simplified calculation using nominal curvature method (EC2 5.8.8)
      // This is a very simplified approach for a tool like this.
      const K_r = 1; // Correction factor depending on axial load ratio (simplified to 1)
      const K_phi = 1; // Factor for creep (simplified to 1)
      const epsilon_yd = (columnData.steelGrade / GAMMA_S) / 200000; // Steel yield strain
      const curvature_1_r = K_r * K_phi * epsilon_yd / (0.45 * columnData.depth); // Simplified curvature
      
      const N_B_x = (Math.PI * Math.PI * (0.3 * Ecm * Ix)) / (Le * Le); // Buckling load (approx EI)
      const N_B_y = (Math.PI * Math.PI * (0.3 * Ecm * Iy)) / (Le * Le); 
      
      // Additional moments (highly simplified)
      const M_Edx_2nd = (axialLoad * 1000) * (curvature_1_r * Le * Le / (Math.PI * Math.PI)) / (1 - (axialLoad*1000)/N_B_x) / 1000; // kNm
      const M_Edy_2nd = (axialLoad * 1000) * (curvature_1_r * Le * Le / (Math.PI * Math.PI)) / (1 - (axialLoad*1000)/N_B_y) / 1000; // kNm

      // Limit second order moments (practical consideration)
      return { 
          M_Edx_2nd: Math.max(0, M_Edx_2nd || 0), 
          M_Edy_2nd: Math.max(0, M_Edy_2nd || 0) 
      };
  };

  const checkBiaxialCapacity = (N_Ed, M_Edx_total, M_Edy_total, N_Rd, M_Rdx, M_Rdy) => {
      // Simplified interaction formula (EC2 5.8.9 (6.39))
      const a = 1.5; // Approximation, can range from 1.0 to 2.0
      const ratioX = M_Rdx > 0 ? M_Edx_total / M_Rdx : 0;
      const ratioY = M_Rdy > 0 ? M_Edy_total / M_Rdy : 0;
      
      const interactionValue = Math.pow(ratioX, a) + Math.pow(ratioY, a);
      const isCapacityAdequate = interactionValue <= 1.0 && N_Ed <= N_Rd;
      
      return { interactionValue, isCapacityAdequate };
  };

  const designStirrups = (b, h, stirrupDiameter, mainBarDiameter, fyk_stirrup, fck) => {
      // Max spacing requirements (EC2 9.5.3)
      const s_cl_t_max1 = 20 * mainBarDiameter;
      const s_cl_t_max2 = Math.min(b, h);
      const s_cl_t_max3 = 400; // mm
      const maxSpacing = Math.min(s_cl_t_max1, s_cl_t_max2, s_cl_t_max3);
      
      // Min diameter (EC2 9.5.3 (1))
      const minStirrupDia = Math.max(6, mainBarDiameter / 4);
      
      const stirrupCheck = stirrupDiameter >= minStirrupDia;

      return { maxStirrupSpacing: maxSpacing, minStirrupDia, stirrupCheck };
  };

  // --- Main Calculation Trigger ---
  const calculateDesign = () => {
    if (!validateInputs()) {
      setResults(null); // Clear previous results if validation fails
      return;
    }

    const { length, axialLoad, momentX, momentY, sectionType, stirrupDiameter, mainBarDiameter } = columnData;
    const Le = length; // Assuming input length is effective length

    // 1. Get Properties
    const sectProps = getSectionProperties();
    const matProps = getMaterialProperties();

    // 2. Slenderness Check
    const slendernessX = checkSlenderness(Le, sectProps.i_x, matProps.fck, matProps.fyd, axialLoad, sectProps.Ac, sectProps.As_provided);
    const slendernessY = checkSlenderness(Le, sectProps.i_y, matProps.fck, matProps.fyd, axialLoad, sectProps.Ac, sectProps.As_provided);
    const isSlender = slendernessX.isSlender || slendernessY.isSlender;
    const maxLambda = Math.max(slendernessX.lambda, slendernessY.lambda);

    // 3. Second-Order Effects (Simplified)
    const { M_Edx_2nd, M_Edy_2nd } = calculateSecondOrderMoments(isSlender, Le, matProps.Ecm, sectProps.i_x * sectProps.i_x * sectProps.Ac, sectProps.i_y * sectProps.i_y * sectProps.Ac, axialLoad);

    // 4. Total Design Moments
    const M_Edx_total = Math.max(momentX + M_Edx_2nd, axialLoad * (sectProps.h / 30), axialLoad * 0.02); // Include min eccentricity e0=h/30 or 20mm
    const M_Edy_total = Math.max(momentY + M_Edy_2nd, axialLoad * (sectProps.b / 30), axialLoad * 0.02);

    // 5. Capacity Calculation (Simplified - Pure Axial and Approx Moment)
    // N_Rd: Pure axial capacity (ignoring slenderness for this value)
    const N_Rd = (ALPHA_CC * matProps.fcd * (sectProps.Ac - sectProps.As_provided) + matProps.fyd * sectProps.As_provided) / 1000; // kN

    // M_Rd: Approximate moment capacity (highly simplified - needs interaction diagram for accuracy)
    // Using a very rough approximation based on steel yield
    const M_Rdx_approx = (matProps.fyd * sectProps.As_provided * 0.4 * sectProps.d_eff) / 1e6; // kNm - Very rough!
    const M_Rdy_approx = (matProps.fyd * sectProps.As_provided * 0.4 * (sectProps.b - columnData.cover - stirrupDiameter - mainBarDiameter/2)) / 1e6; // kNm - Very rough!

    // 6. Biaxial Bending Check
    const biaxialCheck = checkBiaxialCapacity(axialLoad, M_Edx_total, M_Edy_total, N_Rd, M_Rdx_approx, M_Rdy_approx);

    // 7. Stirrup Design
    const stirrupDesign = designStirrups(sectProps.b, sectProps.h, stirrupDiameter, mainBarDiameter, matProps.fyk, matProps.fck);

    // 8. Final Status
    const overallStatus = biaxialCheck.isCapacityAdequate && stirrupDesign.stirrupCheck && Object.keys(errors).length === 0 ? 'Pass' : 'Fail';
    const warnings = [];
    if (!biaxialCheck.isCapacityAdequate) warnings.push('Capacity inadequate under combined loads (biaxial check > 1.0 or N_Ed > N_Rd). Interaction diagrams needed for accuracy.');
    if (isSlender) warnings.push(`Column is slender (λ=${maxLambda.toFixed(1)} > λ_lim=${Math.min(slendernessX.lambda_lim, slendernessY.lambda_lim).toFixed(1)}). Second-order effects included (simplified).`);
    if (!stirrupDesign.stirrupCheck) warnings.push(`Stirrup diameter ${stirrupDiameter}mm may be less than minimum required ${stirrupDesign.minStirrupDia.toFixed(1)}mm.`);
    if (Object.keys(errors).length > 0) warnings.push('Input errors exist (see above fields).');


    setResults({
      // Input Echo
      section: `${sectionType === 'rectangular' ? `${sectProps.b}x${sectProps.h}` : `Dia ${sectProps.b}`} mm`,
      Ac: (sectProps.Ac / 1e6).toFixed(4), // m²
      As_provided: sectProps.As_provided.toFixed(0), // mm²
      steelRatio: (sectProps.steelRatio * 100).toFixed(2), // %
      numBars: sectProps.numBars,
      
      // Material & Design Values
      fcd: matProps.fcd.toFixed(2), // MPa
      fyd: matProps.fyd.toFixed(2), // MPa
      
      // Slenderness
      lambda: maxLambda.toFixed(1),
      lambda_lim: Math.min(slendernessX.lambda_lim, slendernessY.lambda_lim).toFixed(1),
      isSlender: isSlender ? 'Yes' : 'No',
      
      // Moments
      M_Edx_total: M_Edx_total.toFixed(2), // kNm
      M_Edy_total: M_Edy_total.toFixed(2), // kNm
      
      // Capacity & Checks
      N_Rd: N_Rd.toFixed(1), // kN (Pure Axial)
      // M_Rdx_approx: M_Rdx_approx.toFixed(1), // kNm (Approx) - Comment out as it's very rough
      // M_Rdy_approx: M_Rdy_approx.toFixed(1), // kNm (Approx) - Comment out as it's very rough
      interactionValue: biaxialCheck.interactionValue.toFixed(3),
      
      // Stirrups
      maxStirrupSpacing: stirrupDesign.maxStirrupSpacing.toFixed(0), // mm
      
      // Status
      overallStatus: overallStatus,
      warnings: warnings,
      
      // Disclaimer
      disclaimer: 'Results based on simplified Eurocode 2 principles. Interaction diagrams and detailed second-order analysis recommended for final design. Moment capacities are approximate.'
    });
  };

  // --- JSX ---
  return (
    <div className="column-design-tool">
      <h2>Column Design Tool (Based on EC2 Principles)</h2>
      
      <div className="design-form">
        {/* --- Geometry Section --- */}
        <div className="form-section">
          <h3>Geometry</h3>
          <div className="input-group">
            <label>Effective Length (Le, mm):</label>
            <input type="number" name="length" value={columnData.length} onChange={handleInputChange} />
            {errors.length && <span className="error">{errors.length}</span>}
          </div>
          <div className="input-group">
            <label>Section Type:</label>
            <select name="sectionType" value={columnData.sectionType} onChange={handleInputChange}>
              <option value="rectangular">Rectangular</option>
              <option value="circular">Circular</option>
            </select>
          </div>
          {columnData.sectionType === 'rectangular' ? (
            <>
              <div className="input-group">
                <label>Width (b, mm):</label>
                <input type="number" name="width" value={columnData.width} onChange={handleInputChange} />
                {errors.width && <span className="error">{errors.width}</span>}
              </div>
              <div className="input-group">
                <label>Depth (h, mm):</label>
                <input type="number" name="depth" value={columnData.depth} onChange={handleInputChange} />
                {errors.depth && <span className="error">{errors.depth}</span>}
              </div>
            </>
          ) : (
            <div className="input-group">
              <label>Diameter (D, mm):</label>
              <input type="number" name="diameter" value={columnData.diameter} onChange={handleInputChange} />
              {errors.diameter && <span className="error">{errors.diameter}</span>}
            </div>
          )}
        </div>

        {/* --- Loading Section --- */}
        <div className="form-section">
          <h3>Loading (Design Values)</h3>
          <div className="input-group">
            <label>Axial Load (N_Ed, kN):</label>
            <input type="number" name="axialLoad" value={columnData.axialLoad} onChange={handleInputChange} />
            {errors.axialLoad && <span className="error">{errors.axialLoad}</span>}
          </div>
          <div className="input-group">
            <label>Moment about X (M_Edx, kNm):</label>
            <input type="number" name="momentX" value={columnData.momentX} onChange={handleInputChange} />
          </div>
          <div className="input-group">
            <label>Moment about Y (M_Edy, kNm):</label>
            <input type="number" name="momentY" value={columnData.momentY} onChange={handleInputChange} />
          </div>
        </div>

        {/* --- Materials Section --- */}
        <div className="form-section">
          <h3>Materials</h3>
          <div className="input-group">
            <label>Concrete Grade (fck, MPa):</label>
            <select name="concreteGrade" value={columnData.concreteGrade} onChange={handleInputChange}>
              {concreteGrades.map(grade => (<option key={grade} value={grade}>C{grade}/{grade+5}</option>))}
            </select>
          </div>
          <div className="input-group">
            <label>Steel Grade (fyk, MPa):</label>
            <select name="steelGrade" value={columnData.steelGrade} onChange={handleInputChange}>
              {steelGrades.map(grade => (<option key={grade} value={grade}>B{grade}</option>))}
            </select>
          </div>
        </div>

        {/* --- Reinforcement Section --- */}
        <div className="form-section">
          <h3>Reinforcement Details</h3>
           <div className="input-group">
            <label>Main Bar Diameter (mm):</label>
            <select name="mainBarDiameter" value={columnData.mainBarDiameter} onChange={handleInputChange}>
              {barDiameters.map(dia => (<option key={dia} value={dia}>{dia}mm</option>))}
            </select>
          </div>
           {columnData.sectionType === 'rectangular' ? (
            <>
              <div className="input-group">
                <label>No. Bars along Width (X-dir):</label>
                <input type="number" name="numberOfBarsX" value={columnData.numberOfBarsX} onChange={handleInputChange} min="2" step="1"/>
                 {errors.numberOfBarsX && <span className="error">{errors.numberOfBarsX}</span>}
              </div>
              <div className="input-group">
                <label>No. Bars along Depth (Y-dir):</label>
                <input type="number" name="numberOfBarsY" value={columnData.numberOfBarsY} onChange={handleInputChange} min="2" step="1"/>
                 {errors.numberOfBarsY && <span className="error">{errors.numberOfBarsY}</span>}
                 {errors.numberOfBars && <span className="error">{errors.numberOfBars}</span>}
              </div>
            </>
           ) : (
             <div className="input-group">
                <label>Total Number of Bars:</label>
                <input type="number" name="numberOfBarsTotal" value={columnData.numberOfBarsTotal} onChange={handleInputChange} min="4" step="1"/>
                 {errors.numberOfBarsTotal && <span className="error">{errors.numberOfBarsTotal}</span>}
              </div>
           )}
           {errors.steelRatio && <span className="error">{errors.steelRatio}</span>}

          <div className="input-group">
            <label>Nominal Cover (mm):</label>
            <input type="number" name="cover" value={columnData.cover} onChange={handleInputChange} />
             {errors.cover && <span className="error">{errors.cover}</span>}
          </div>
          <div className="input-group">
            <label>Stirrup/Link Diameter (mm):</label>
            <select name="stirrupDiameter" value={columnData.stirrupDiameter} onChange={handleInputChange}>
              {stirrupDiameters.map(dia => (<option key={dia} value={dia}>{dia}mm</option>))}
            </select>
          </div>
        </div>

        <button className="calculate-button" onClick={calculateDesign}>
          Check Column Design
        </button>
      </div>

      {/* --- Results Section --- */}
      {results && (
        <div className={`results-section status-${results.overallStatus.toLowerCase()}`}>
          <h3>Design Check Results</h3>
          
           {/* Status Banner */}
           <div className={`status-banner ${results.overallStatus.toLowerCase()}`}>
             Overall Status: {results.overallStatus}
           </div>

           {/* Warnings */}
           {results.warnings && results.warnings.length > 0 && (
             <div className="warnings-section">
               <h4>Warnings:</h4>
               <ul>
                 {results.warnings.map((warning, index) => (
                   <li key={index}>{warning}</li>
                 ))}
               </ul>
             </div>
           )}

          <div className="results-grid">
            {/* Input Summary */}
            <div className="result-item"> <span className="result-label">Section:</span> <span className="result-value">{results.section}</span> </div>
            <div className="result-item"> <span className="result-label">Area (Ac):</span> <span className="result-value">{results.Ac} m²</span> </div>
            <div className="result-item"> <span className="result-label">Steel Area (As):</span> <span className="result-value">{results.As_provided} mm² ({results.numBars} bars)</span> </div>
            <div className="result-item"> <span className="result-label">Steel Ratio (ρ):</span> <span className="result-value">{results.steelRatio}%</span> </div>
            
            {/* Slenderness */}
            <div className="result-item"> <span className="result-label">Slenderness (λ):</span> <span className="result-value">{results.lambda}</span> </div>
            <div className="result-item"> <span className="result-label">Limit Slenderness (λ_lim):</span> <span className="result-value">{results.lambda_lim}</span> </div>
            <div className="result-item"> <span className="result-label">Is Slender?:</span> <span className="result-value">{results.isSlender}</span> </div>

            {/* Loads & Capacity */}
            <div className="result-item"> <span className="result-label">Design Axial Load (N_Ed):</span> <span className="result-value">{columnData.axialLoad.toFixed(1)} kN</span> </div>
            <div className="result-item"> <span className="result-label">Total Design Moment X (M_Edx):</span> <span className="result-value">{results.M_Edx_total} kNm</span> </div>
            <div className="result-item"> <span className="result-label">Total Design Moment Y (M_Edy):</span> <span className="result-value">{results.M_Edy_total} kNm</span> </div>
            <div className="result-item"> <span className="result-label">Pure Axial Capacity (N_Rd):</span> <span className="result-value">{results.N_Rd} kN</span> </div>
            <div className="result-item"> <span className="result-label">Biaxial Check [(MEdx/MRdx)^a + (MEdy/MRdy)^a]:</span> <span className="result-value">{results.interactionValue} (≤ 1.0 Pass)</span> </div>
            
             {/* Stirrups */}
            <div className="result-item"> <span className="result-label">Max Stirrup Spacing:</span> <span className="result-value">{results.maxStirrupSpacing} mm</span> </div>
          </div>
           <p className="disclaimer"><i>{results.disclaimer}</i></p>
        </div>
      )}
    </div>
  );
};

export default ColumnDesignTool;