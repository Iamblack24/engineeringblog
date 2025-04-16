import React, { useState } from 'react';
import './ConcreteMixDesignCalculator.css';

// Import functions from all standards
import {
  getWaterContent as getWaterContent_ACI,
  getWCRatio as getWCRatio_ACI,
  getCoarseAggregateVolume as getCoarseAggregateVolume_ACI,
  getAirContent as getAirContent_ACI,
  getRequiredAverageStrength as getRequiredAverageStrength_ACI
} from './aciMixDesignTables';

import {
  getWaterContent_BS,
  getWCRatio_BS,
  getCoarseAggregateProportion_BS,
  // getAirContent_BS, // Assuming BS uses similar air content logic or it's specified differently
  getRequiredMeanStrength_BS,
  getMinCementContent_BS
} from './bsMixDesignTables';

import {
  getWaterContent_EN,
  getWCRatio_EN,
  getCoarseAggregateProportion_EN,
  // getAirContent_EN, // Assuming EN uses similar air content logic or it's specified differently
  getRequiredMeanStrength_EN,
  getMinCementContent_EN
} from './enMixDesignTables';


const ConcreteMixDesignCalculator = () => {
  // --- Standard Selection ---
  const [designStandard, setDesignStandard] = useState('aci'); // 'aci', 'bs', 'en'

  // --- Design Requirements ---
  const [compressiveStrength, setCompressiveStrength] = useState('30'); // f'c or f_ck (MPa)
  const [standardDeviation, setStandardDeviation] = useState('3.5'); // MPa (or 'unknown')
  const [slump, setSlump] = useState('100'); // mm (or target consistency class for EN)
  const [maxAggregateSize, setMaxAggregateSize] = useState('20'); // mm (D_max)
  // Exposure condition state needs to adapt based on standard
  const [exposureConditionACI, setExposureConditionACI] = useState('moderate');
  const [exposureConditionBS, setExposureConditionBS] = useState('XC3/XC4'); // Example BS class
  const [exposureConditionEN, setExposureConditionEN] = useState('XC3'); // Example EN class
  const [airEntrainment, setAirEntrainment] = useState('yes'); // Relevant for ACI/some BS/EN exposures

  // --- Material Properties (SSD Basis unless noted) ---
  const [cementSpecificGravity, setCementSpecificGravity] = useState('3.15');
  const [fineAggSpecificGravity, setFineAggSpecificGravity] = useState('2.65'); // SSD
  const [coarseAggSpecificGravity, setCoarseAggSpecificGravity] = useState('2.68'); // SSD
  const [coarseAggDryRoddedWeight, setCoarseAggDryRoddedWeight] = useState('1600'); // kg/m³ (Used in ACI, less direct in BS/EN)
  const [fineAggFinenessModulus, setFineAggFinenessModulus] = useState('2.70'); // Used as proxy in BS/EN placeholders
  const [aggregateType, setAggregateType] = useState('crushed'); // Relevant for BS ('crushed'/'uncrushed')

  // --- Aggregate Moisture ---
  const [fineAggMoistureContent, setFineAggMoistureContent] = useState('5.0'); // % (Total Moisture)
  const [coarseAggMoistureContent, setCoarseAggMoistureContent] = useState('1.5'); // % (Total Moisture)
  const [fineAggAbsorption, setFineAggAbsorption] = useState('1.0'); // %
  const [coarseAggAbsorption, setCoarseAggAbsorption] = useState('0.5'); // %

  // --- Results & Errors ---
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  // --- Dynamic Exposure Options ---
  const exposureOptions = {
    aci: [
      { value: 'mild', label: 'Mild (ACI)' },
      { value: 'moderate', label: 'Moderate (ACI - F/T)' },
      { value: 'severe', label: 'Severe (ACI - De-icing)' },
    ],
    bs: [ // Example BS 8500 classes - Needs refinement
      { value: 'XC1', label: 'XC1 (Dry)' },
      { value: 'XC2', label: 'XC2 (Wet, rarely dry)' },
      { value: 'XC3/XC4', label: 'XC3/XC4 (Moderate/Cyclic)' },
      { value: 'XD1', label: 'XD1 (Moderate humidity - chlorides)' },
      { value: 'XD2', label: 'XD2 (Wet, rarely dry - chlorides)' },
      { value: 'XD3', label: 'XD3 (Cyclic wet/dry - chlorides)' },
      { value: 'XS1', label: 'XS1 (Exposed to airborne salt)' },
      { value: 'XS2', label: 'XS2 (Submerged)' },
      { value: 'XS3', label: 'XS3 (Tidal, splash)' },
      { value: 'XF1', label: 'XF1 (Moderate saturation, no de-icer)' },
      { value: 'XF2', label: 'XF2 (Moderate saturation, with de-icer)' },
      { value: 'XF3', label: 'XF3 (High saturation, no de-icer)' },
      { value: 'XF4', label: 'XF4 (High saturation, with de-icer)' },
      // Add XA classes if needed
    ],
    en: [ // Example EN 206 classes - Needs refinement
      { value: 'X0', label: 'X0 (No risk)' },
      { value: 'XC1', label: 'XC1 (Dry)' },
      { value: 'XC2', label: 'XC2 (Wet, rarely dry)' },
      { value: 'XC3', label: 'XC3 (Moderate humidity)' },
      { value: 'XC4', label: 'XC4 (Cyclic wet/dry)' },
      { value: 'XD1', label: 'XD1 (Moderate humidity - chlorides)' },
      { value: 'XD2', label: 'XD2 (Wet, rarely dry - chlorides)' },
      { value: 'XD3', label: 'XD3 (Cyclic wet/dry - chlorides)' },
      { value: 'XS1', label: 'XS1 (Exposed to airborne salt)' },
      { value: 'XS2', label: 'XS2 (Submerged)' },
      { value: 'XS3', label: 'XS3 (Tidal, splash)' },
      { value: 'XF1', label: 'XF1 (Moderate saturation, no de-icer)' },
      { value: 'XF2', label: 'XF2 (Moderate saturation, with de-icer)' },
      { value: 'XF3', label: 'XF3 (High saturation, no de-icer)' },
      { value: 'XF4', label: 'XF4 (High saturation, with de-icer)' },
      // Add XA classes if needed
    ],
  };

  const handleExposureChange = (e) => {
    const value = e.target.value;
    if (designStandard === 'aci') setExposureConditionACI(value);
    else if (designStandard === 'bs') setExposureConditionBS(value);
    else if (designStandard === 'en') setExposureConditionEN(value);
  };

  const getCurrentExposureValue = () => {
    if (designStandard === 'aci') return exposureConditionACI;
    if (designStandard === 'bs') return exposureConditionBS;
    if (designStandard === 'en') return exposureConditionEN;
    return '';
  };


  const calculateMixDesign = (e) => {
    e.preventDefault();
    setError('');
    setResults(null);

    // --- Input Parsing and Validation (Common Inputs) ---
    const fck_or_fc = parseFloat(compressiveStrength); // Characteristic or Specified Strength
    const stdDevInput = standardDeviation.toLowerCase();
    const stdDev = stdDevInput === 'unknown' ? 'unknown' : parseFloat(stdDevInput);
    const desiredSlump = parseFloat(slump);
    const aggSize = parseInt(maxAggregateSize, 10);
    const cementSG = parseFloat(cementSpecificGravity);
    const fineAggSG_SSD = parseFloat(fineAggSpecificGravity);
    const coarseAggSG_SSD = parseFloat(coarseAggSpecificGravity);
    const coarseAggDRUW = parseFloat(coarseAggDryRoddedWeight); // Primarily ACI
    const fineAggFM = parseFloat(fineAggFinenessModulus);
    const fineAggMC = parseFloat(fineAggMoistureContent) / 100;
    const coarseAggMC = parseFloat(coarseAggMoistureContent) / 100;
    const fineAggAbs = parseFloat(fineAggAbsorption) / 100;
    const coarseAggAbs = parseFloat(coarseAggAbsorption) / 100;
    const isAirEntrained = airEntrainment === 'yes'; // Simplified air entrainment check

    // Get current exposure based on selected standard
    const currentExposure = getCurrentExposureValue();

    const allInputsValid = ![fck_or_fc, desiredSlump, aggSize, cementSG, fineAggSG_SSD, coarseAggSG_SSD, coarseAggDRUW, fineAggFM, fineAggMC, coarseAggMC, fineAggAbs, coarseAggAbs]
      .some(isNaN) && (stdDev === 'unknown' || !isNaN(stdDev));

    if (!allInputsValid) {
      setError('Please ensure all numeric input fields have valid values.');
      return;
    }

    try {
      let requiredStrength, estimatedWater, estimatedAirPercent, wcrByStrength, wcrByExposure, finalWCR, cementContent, coarseAggWeight_SSD, fineAggWeight_SSD;
      let minCementContent = 0; // Initialize minimum cement content

      // --- Standard-Specific Calculations ---
      if (designStandard === 'aci') {
        requiredStrength = getRequiredAverageStrength_ACI(fck_or_fc, stdDev);
        estimatedWater = getWaterContent_ACI(desiredSlump, aggSize, isAirEntrained);
        // ACI air content depends on exposure and size
        estimatedAirPercent = getAirContent_ACI(aggSize, exposureConditionACI, isAirEntrained);
        wcrByStrength = getWCRatio_ACI('strength', requiredStrength, isAirEntrained);
        wcrByExposure = getWCRatio_ACI('exposure', exposureConditionACI, isAirEntrained);
        finalWCR = Math.min(wcrByStrength, wcrByExposure);
        cementContent = estimatedWater / finalWCR;
        // ACI Coarse Aggregate Volume Method
        const coarseAggVolumeFraction = getCoarseAggregateVolume_ACI(aggSize, fineAggFM);
        coarseAggWeight_SSD = coarseAggVolumeFraction * coarseAggDRUW;

      } else if (designStandard === 'bs') {
        requiredStrength = getRequiredMeanStrength_BS(fck_or_fc, stdDev); // Target Mean Strength (f_m)
        estimatedWater = getWaterContent_BS(desiredSlump, aggSize, aggregateType);
        // BS Air content often specified directly based on exposure/durability needs
        estimatedAirPercent = isAirEntrained ? (aggSize <= 10 ? 6.0 : (aggSize <= 20 ? 5.0 : 4.0)) : 1.5; // Simplified placeholder
        wcrByStrength = getWCRatio_BS('strength', requiredStrength, aggregateType);
        wcrByExposure = getWCRatio_BS('exposure', exposureConditionBS, aggregateType);
        finalWCR = Math.min(wcrByStrength, wcrByExposure);
        minCementContent = getMinCementContent_BS(exposureConditionBS, aggSize);
        cementContent = Math.max(estimatedWater / finalWCR, minCementContent);
        // Adjust WCR if minimum cement content governs
        finalWCR = estimatedWater / cementContent;
        // BS Coarse Aggregate Proportion Method (Placeholder uses proportion of total agg)
        const coarseAggProportion = getCoarseAggregateProportion_BS(aggSize, fineAggFM, finalWCR);
        // This requires estimating total aggregate first, then splitting - complex.
        // Simplified approach: Estimate total agg volume, then split by proportion.
        const waterVolume = estimatedWater / 1000;
        const cementVolume = cementContent / (cementSG * 1000);
        const airVolume = estimatedAirPercent / 100;
        const totalAggVolume = 1.0 - waterVolume - cementVolume - airVolume;
        // Assuming proportion is by volume for simplicity here
        const coarseAggVolume_SSD = totalAggVolume * coarseAggProportion;
        const fineAggVolume_SSD = totalAggVolume * (1 - coarseAggProportion);
        coarseAggWeight_SSD = coarseAggVolume_SSD * (coarseAggSG_SSD * 1000);
        fineAggWeight_SSD = fineAggVolume_SSD * (fineAggSG_SSD * 1000);

      } else if (designStandard === 'en') {
        requiredStrength = getRequiredMeanStrength_EN(fck_or_fc, stdDev); // Target Mean Strength (f_cm)
        estimatedWater = getWaterContent_EN(desiredSlump, aggSize);
        // EN Air content often specified directly based on exposure/durability needs
        estimatedAirPercent = isAirEntrained ? (aggSize <= 16 ? 5.5 : (aggSize <= 32 ? 4.5 : 4.0)) : 1.5; // Simplified placeholder
        // EN WCR depends only on exposure (strength is checked via fcm)
        wcrByExposure = getWCRatio_EN(exposureConditionEN, fck_or_fc);
        finalWCR = wcrByExposure; // Strength implicitly covered by fcm calc & cement content
        minCementContent = getMinCementContent_EN(exposureConditionEN, aggSize);
        cementContent = Math.max(estimatedWater / finalWCR, minCementContent);
        // Adjust WCR if minimum cement content governs
        finalWCR = estimatedWater / cementContent;
        // EN Coarse Aggregate Proportion Method (Placeholder uses proportion of total agg)
        const coarseAggProportion = getCoarseAggregateProportion_EN(aggSize, fineAggFM, finalWCR);
        // Simplified approach: Estimate total agg volume, then split by proportion.
        const waterVolume = estimatedWater / 1000;
        const cementVolume = cementContent / (cementSG * 1000);
        const airVolume = estimatedAirPercent / 100;
        const totalAggVolume = 1.0 - waterVolume - cementVolume - airVolume;
        // Assuming proportion is by volume for simplicity here
        const coarseAggVolume_SSD = totalAggVolume * coarseAggProportion;
        const fineAggVolume_SSD = totalAggVolume * (1 - coarseAggProportion);
        coarseAggWeight_SSD = coarseAggVolume_SSD * (coarseAggSG_SSD * 1000);
        fineAggWeight_SSD = fineAggVolume_SSD * (fineAggSG_SSD * 1000);
      }

      // --- Common Calculations (Post Standard-Specific) ---

      // Estimate Fine Aggregate for ACI (if not calculated above)
      if (designStandard === 'aci') {
        const waterVolume = estimatedWater / 1000;
        const cementVolume = cementContent / (cementSG * 1000);
        const coarseAggVolume_SSD = coarseAggWeight_SSD / (coarseAggSG_SSD * 1000);
        const airVolume = estimatedAirPercent / 100;
        const fineAggVolume_SSD = 1.0 - waterVolume - cementVolume - coarseAggVolume_SSD - airVolume;
        if (fineAggVolume_SSD <= 0) {
          throw new Error("Calculation resulted in non-positive fine aggregate volume (SSD basis). Check inputs.");
        }
        fineAggWeight_SSD = fineAggVolume_SSD * (fineAggSG_SSD * 1000);
      }

      // Check for valid aggregate weights
       if (isNaN(fineAggWeight_SSD) || fineAggWeight_SSD <= 0 || isNaN(coarseAggWeight_SSD) || coarseAggWeight_SSD <= 0) {
           throw new Error("Calculation resulted in invalid aggregate weights. Review inputs and standard-specific logic.");
       }


      // Adjust for Aggregate Moisture (Common Step)
      const fineAggFreeMoisture = Math.max(0, fineAggMC - fineAggAbs);
      const coarseAggFreeMoisture = Math.max(0, coarseAggMC - coarseAggAbs);
      const waterInFineAgg = fineAggWeight_SSD * fineAggFreeMoisture;
      const waterInCoarseAgg = coarseAggWeight_SSD * coarseAggFreeMoisture;
      const batchWater = estimatedWater - waterInFineAgg - waterInCoarseAgg;
      const batchFineAggWeight = fineAggWeight_SSD * (1 + fineAggMC);
      const batchCoarseAggWeight = coarseAggWeight_SSD * (1 + coarseAggMC);

      // --- Set Results ---
      setResults({
        requiredStrength: requiredStrength.toFixed(1), // f'cr or f_m or f_cm
        waterCementRatio: finalWCR.toFixed(2),
        estimatedAirContent: estimatedAirPercent.toFixed(1),
        minCementContent: minCementContent > 0 ? minCementContent.toFixed(1) : 'N/A',
        // SSD Weights
        ssdWater: estimatedWater.toFixed(1),
        ssdCement: cementContent.toFixed(1),
        ssdFineAggregate: fineAggWeight_SSD.toFixed(1),
        ssdCoarseAggregate: coarseAggWeight_SSD.toFixed(1),
        // Batch Weights
        batchWater: batchWater.toFixed(1),
        batchCement: cementContent.toFixed(1),
        batchFineAggregate: batchFineAggWeight.toFixed(1),
        batchCoarseAggregate: batchCoarseAggWeight.toFixed(1),
        // Proportions
        totalSSDWeight: (estimatedWater + cementContent + fineAggWeight_SSD + coarseAggWeight_SSD).toFixed(1),
        proportionsSSD: `1 : ${(fineAggWeight_SSD / cementContent).toFixed(2)} : ${(coarseAggWeight_SSD / cementContent).toFixed(2)}`,
        totalBatchWeight: (batchWater + cementContent + batchFineAggWeight + batchCoarseAggWeight).toFixed(1),
      });

    } catch (err) {
      setError(`Calculation Error: ${err.message}. Placeholders used for BS/EN may be inaccurate.`);
      console.error(err);
    }
  };

  // --- Render ---
  return (
    <div className="concrete-mix-design-calculator">
      {/* Change Title based on standard? */}
      <h1>Concrete Mix Design Calculator</h1>
      <p className="tool-description">
        Estimate concrete mix proportions based on ACI, BS (Simplified), or EN (Simplified) methods.
        <br /><strong>Note:</strong> BS and EN calculations use simplified placeholders and require verification against actual standards and National Annexes.
      </p>
      <form onSubmit={calculateMixDesign}>
        {/* --- Standard Selection --- */}
        <fieldset>
            <legend>Design Standard</legend>
            <div className="form-group">
                <label htmlFor="designStandard">Select Standard:</label>
                <select id="designStandard" value={designStandard} onChange={(e) => setDesignStandard(e.target.value)}>
                    <option value="aci">ACI 211.1</option>
                    <option value="bs">BS 8500 / EN 206 (Simplified)</option>
                    <option value="en">EN 206 / EN 1992 (Simplified)</option>
                </select>
            </div>
        </fieldset>

        {/* --- Design Requirements --- */}
        <fieldset>
          <legend>Design Requirements</legend>
          <div className="form-group">
            <label>
                {designStandard === 'aci' ? "Specified Compressive Strength (f'c, MPa):" : "Characteristic Strength (f_ck, MPa):"}
            </label>
            <input type="number" step="0.1" value={compressiveStrength} onChange={(e) => setCompressiveStrength(e.target.value)} required />
          </div>
          <div className="form-group">
            <label title="Standard deviation of strength tests (MPa). Use 'unknown' if data is unavailable.">
              Standard Deviation (MPa or 'unknown'): <span className="info-icon">ℹ️</span>
            </label>
            <input type="text" value={standardDeviation} onChange={(e) => setStandardDeviation(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>
                {designStandard === 'en' ? "Target Slump (mm) / Consistency:" : "Desired Slump (mm):"}
            </label>
            <input type="number" step="5" min="10" max="220" value={slump} onChange={(e) => setSlump(e.target.value)} required />
             {/* Optionally add Consistency Class input for EN */}
          </div>
          <div className="form-group">
            <label>Maximum Aggregate Size (D_max, mm):</label>
            <select value={maxAggregateSize} onChange={(e) => setMaxAggregateSize(e.target.value)}>
              <option value="10">10 mm</option>
              <option value="14">14 mm</option>
              <option value="16">16 mm (EN)</option>
              <option value="20">20 mm</option>
              <option value="28">28 mm</option>
              <option value="32">32 mm (EN)</option>
              <option value="40">40 mm</option>
            </select>
          </div>
          <div className="form-group">
            <label>Exposure Condition ({designStandard.toUpperCase()}):</label>
            <select value={getCurrentExposureValue()} onChange={handleExposureChange}>
              {exposureOptions[designStandard].map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
             <p style={{fontSize: '0.8em', color: '#666', marginTop: '5px'}}>Exposure definitions vary by standard. Check standard for details.</p>
          </div>
           <div className="form-group">
            <label>Air Entrainment Required?</label>
            <select value={airEntrainment} onChange={(e) => setAirEntrainment(e.target.value)}>
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
             <p style={{fontSize: '0.8em', color: '#666', marginTop: '5px'}}>Required air content depends on exposure and standard.</p>
          </div>
        </fieldset>

        {/* --- Material Properties --- */}
        <fieldset>
          <legend>Material Properties</legend>
           {/* Aggregate Type for BS */}
           {designStandard === 'bs' && (
             <div className="form-group">
                <label>Coarse Aggregate Type:</label>
                <select value={aggregateType} onChange={(e) => setAggregateType(e.target.value)}>
                    <option value="crushed">Crushed</option>
                    <option value="uncrushed">Uncrushed (Gravel)</option>
                </select>
             </div>
           )}
           <div className="form-group">
            <label>Cement Specific Gravity:</label>
            <input type="number" step="0.01" value={cementSpecificGravity} onChange={(e) => setCementSpecificGravity(e.target.value)} required />
          </div>
           <div className="form-group">
            <label>Fine Aggregate Specific Gravity (SSD):</label>
            <input type="number" step="0.01" value={fineAggSpecificGravity} onChange={(e) => setFineAggSpecificGravity(e.target.value)} required />
          </div>
           <div className="form-group">
            <label>Coarse Aggregate Specific Gravity (SSD):</label>
            <input type="number" step="0.01" value={coarseAggSpecificGravity} onChange={(e) => setCoarseAggSpecificGravity(e.target.value)} required />
          </div>
           {/* DRUW primarily for ACI */}
           {designStandard === 'aci' && (
             <div className="form-group">
                <label title="Bulk density of coarse aggregate in a dry-rodded condition (ACI method).">
                    Coarse Agg. Dry-Rodded Unit Wt. (kg/m³): <span className="info-icon">ℹ️</span>
                </label>
                <input type="number" step="1" value={coarseAggDryRoddedWeight} onChange={(e) => setCoarseAggDryRoddedWeight(e.target.value)} required />
             </div>
           )}
           <div className="form-group">
            <label title="A measure of the particle-size distribution of fine aggregate. Used as proxy in BS/EN placeholders.">
                Fine Aggregate Fineness Modulus (FM): <span className="info-icon">ℹ️</span>
            </label>
            <input type="number" step="0.01" min="2.0" max="4.0" value={fineAggFinenessModulus} onChange={(e) => setFineAggFinenessModulus(e.target.value)} required />
          </div>
        </fieldset>

        {/* --- Aggregate Moisture Adjustment (Common) --- */}
        <fieldset>
            <legend>Aggregate Moisture Conditions</legend>
            {/* Inputs remain the same */}
            <div className="form-group">
                <label title="Total moisture content of fine aggregate as delivered.">
                    Fine Agg. Moisture Content (%): <span className="info-icon">ℹ️</span>
                </label>
                <input type="number" step="0.1" value={fineAggMoistureContent} onChange={(e) => setFineAggMoistureContent(e.target.value)} required />
            </div>
            <div className="form-group">
                <label title="Absorption capacity of fine aggregate (moisture content in SSD condition).">
                    Fine Agg. Absorption (%): <span className="info-icon">ℹ️</span>
                </label>
                <input type="number" step="0.1" value={fineAggAbsorption} onChange={(e) => setFineAggAbsorption(e.target.value)} required />
            </div>
            <div className="form-group">
                <label title="Total moisture content of coarse aggregate as delivered.">
                    Coarse Agg. Moisture Content (%): <span className="info-icon">ℹ️</span>
                </label>
                <input type="number" step="0.1" value={coarseAggMoistureContent} onChange={(e) => setCoarseAggMoistureContent(e.target.value)} required />
            </div>
            <div className="form-group">
                <label title="Absorption capacity of coarse aggregate (moisture content in SSD condition).">
                    Coarse Agg. Absorption (%): <span className="info-icon">ℹ️</span>
                </label>
                <input type="number" step="0.1" value={coarseAggAbsorption} onChange={(e) => setCoarseAggAbsorption(e.target.value)} required />
            </div>
        </fieldset>

        <button type="submit">Calculate Mix Design</button>
      </form>

      {error && <div className="error-message">{error}</div>}

      {results && (
        <div className="results">
          <h2>Estimated Mix Design Results ({designStandard.toUpperCase()}, per m³)</h2>

          {/* Key Design Parameters */}
          <p><strong>
             {designStandard === 'aci' ? "Required Average Strength (f'cr):" : "Target Mean Strength (f_m/f_cm):"}
          </strong> {results.requiredStrength} MPa</p>
          <p><strong>Target Water-Cement Ratio (W/C):</strong> {results.waterCementRatio}</p>
          {(designStandard === 'bs' || designStandard === 'en') && (
            <p><strong>Minimum Cement Content:</strong> {results.minCementContent} kg/m³</p>
          )}
          <p><strong>Estimated Air Content:</strong> {results.estimatedAirContent} %</p>
          <hr />

          {/* SSD Weights */}
          <h3>Theoretical SSD Weights</h3>
          <p><strong>Water:</strong> {results.ssdWater} kg</p>
          <p><strong>Cement:</strong> {results.ssdCement} kg</p>
          <p><strong>Fine Aggregate (SSD):</strong> {results.ssdFineAggregate} kg</p>
          <p><strong>Coarse Aggregate (SSD):</strong> {results.ssdCoarseAggregate} kg</p>
          <p><strong>Total SSD Weight:</strong> {results.totalSSDWeight} kg/m³</p>
          <p><strong>Proportions (SSD Wt.):</strong> {results.proportionsSSD} (C:F:Co)</p>
          <hr />

          {/* Batch Weights */}
          <h3>Batch Weights (Adjusted for Moisture)</h3>
          <p><strong>Batch Water:</strong> {results.batchWater} kg</p>
          <p><strong>Cement:</strong> {results.batchCement} kg</p>
          <p><strong>Fine Aggregate (Moist):</strong> {results.batchFineAggregate} kg</p>
          <p><strong>Coarse Aggregate (Moist):</strong> {results.batchCoarseAggregate} kg</p>
          <p><strong>Total Batch Weight:</strong> {results.totalBatchWeight} kg/m³</p>

          <p className="note"><strong>Disclaimer:</strong> These are estimated proportions. BS/EN calculations use simplified placeholders and lack full standard implementation (including National Annexes). Always verify mix designs with trial batches and consult the relevant standards.</p>
        </div>
      )}
    </div>
  );
};

export default ConcreteMixDesignCalculator;