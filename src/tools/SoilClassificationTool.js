import React, { useState } from 'react';
import './SoilClassificationTool.css';

const SoilClassificationTool = () => {
  const [soilData, setSoilData] = useState({
    // Grain size distribution
    gravel: 0,    // % retained on No.4 sieve
    sand: 0,      // % passing No.4 and retained on No.200
    fines: 0,     // % passing No.200 sieve
    
    // Atterberg limits
    liquidLimit: 0,
    plasticLimit: 0,
    
    // Optional data
    d60: 0,       // mm
    d30: 0,       // mm
    d10: 0,       // mm
    organicContent: false
  });

  const [results, setResults] = useState(null);
  const [errors, setErrors] = useState({});

  const validateInputs = () => {
    const newErrors = {};
    const { gravel, sand, fines, liquidLimit, plasticLimit } = soilData;
    
    // Check percentages sum to 100%
    const total = gravel + sand + fines;
    if (Math.abs(total - 100) > 0.1) {
      newErrors.percentages = 'Gravel, sand, and fines must sum to 100%';
    }

    // Validate Atterberg limits
    if (fines > 5) {  // Only check if significant fines present
      if (liquidLimit < plasticLimit) {
        newErrors.atterberg = 'Liquid limit must be greater than plastic limit';
      }
      if (liquidLimit < 0 || liquidLimit > 120) {
        newErrors.liquidLimit = 'Liquid limit must be between 0 and 120';
      }
      if (plasticLimit < 0 || plasticLimit > 100) {
        newErrors.plasticLimit = 'Plastic limit must be between 0 and 100';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateSoilClassification = () => {
    if (!validateInputs()) {
      return;
    }

    const { gravel, sand, fines, liquidLimit, plasticLimit, d60, d30, d10, organicContent } = soilData;
    
    // Calculate derived values
    const plasticityIndex = liquidLimit - plasticLimit;
    let cu = 0;
    let cc = 0;
    
    if (d60 > 0 && d10 > 0) {
      cu = d60 / d10;  // Coefficient of uniformity
      if (d30 > 0) {
        cc = (d30 * d30) / (d60 * d10);  // Coefficient of curvature
      }
    }

    let groupSymbol = '';
    let description = '';

    // Classification logic following USCS
    if (fines < 50) {  // Coarse-grained soil
      if (gravel > sand) {  // Gravel
        if (fines < 5) {  // Clean gravel
          if (cu >= 4 && cc >= 1 && cc <= 3) {
            groupSymbol = 'GW';
            description = 'Well-graded gravel';
          } else {
            groupSymbol = 'GP';
            description = 'Poorly graded gravel';
          }
        } else if (fines <= 12) {  // Gravel with fines
          if (plasticityIndex > 7 && plotAboveALine()) {
            groupSymbol = 'GC';
            description = 'Clayey gravel';
          } else {
            groupSymbol = 'GM';
            description = 'Silty gravel';
          }
        }
      } else {  // Sand
        if (fines < 5) {  // Clean sand
          if (cu >= 6 && cc >= 1 && cc <= 3) {
            groupSymbol = 'SW';
            description = 'Well-graded sand';
          } else {
            groupSymbol = 'SP';
            description = 'Poorly graded sand';
          }
        } else if (fines <= 12) {  // Sand with fines
          if (plasticityIndex > 7 && plotAboveALine()) {
            groupSymbol = 'SC';
            description = 'Clayey sand';
          } else {
            groupSymbol = 'SM';
            description = 'Silty sand';
          }
        }
      }
    } else {  // Fine-grained soil
      if (liquidLimit >= 50) {  // High plasticity
        if (organicContent) {
          groupSymbol = 'OH';
          description = 'Organic clay of high plasticity';
        } else if (plasticityIndex > 0.73 * (liquidLimit - 20)) {
          groupSymbol = 'CH';
          description = 'Fat clay';
        } else {
          groupSymbol = 'MH';
          description = 'Elastic silt';
        }
      } else {  // Low plasticity
        if (organicContent) {
          groupSymbol = 'OL';
          description = 'Organic clay of low plasticity';
        } else if (plasticityIndex > 0.73 * (liquidLimit - 20)) {
          groupSymbol = 'CL';
          description = 'Lean clay';
        } else {
          groupSymbol = 'ML';
          description = 'Silt';
        }
      }
    }

    setResults({
      groupSymbol,
      description,
      plasticityIndex,
      coefficientUniformity: cu,
      coefficientCurvature: cc,
      additionalNotes: generateAdditionalNotes(groupSymbol)
    });
  };

  const plotAboveALine = () => {
    const { liquidLimit, plasticLimit } = soilData;
    const pi = liquidLimit - plasticLimit;
    return pi > 0.73 * (liquidLimit - 20);
  };

  const generateAdditionalNotes = (groupSymbol) => {
    // Add relevant engineering properties based on soil classification
    const notes = {
      'GW': 'Excellent subgrade material. Good drainage characteristics.',
      'GP': 'Good subgrade material. Good drainage characteristics.',
      'GM': 'Good to fair subgrade material. Poor drainage when compacted.',
      'GC': 'Good to fair subgrade material. Very poor drainage.',
      'SW': 'Good subgrade material. Good drainage characteristics.',
      'SP': 'Fair subgrade material. Good drainage characteristics.',
      'SM': 'Fair to poor subgrade material. Poor drainage when compacted.',
      'SC': 'Poor subgrade material. Very poor drainage.',
      'ML': 'Poor subgrade material. Fair to poor drainage.',
      'CL': 'Poor subgrade material. Very poor drainage.',
      'OL': 'Poor subgrade material. Poor drainage.',
      'MH': 'Poor subgrade material. Poor drainage.',
      'CH': 'Poor subgrade material. Very poor drainage.',
      'OH': 'Poor subgrade material. Poor drainage.'
    };
    
    return notes[groupSymbol] || '';
  };

  return (
    <div className="soil-classification-tool">
      <h2>Soil Classification Tool (USCS)</h2>
      
      <div className="input-sections">
        <div className="input-section">
          <h3>Grain Size Distribution</h3>
          <div className="input-group">
            <label>Gravel (%):</label>
            <input
              type="number"
              min="0"
              max="100"
              value={soilData.gravel}
              onChange={(e) => setSoilData({
                ...soilData,
                gravel: parseFloat(e.target.value) || 0
              })}
            />
          </div>
          <div className="input-group">
            <label>Sand (%):</label>
            <input
              type="number"
              min="0"
              max="100"
              value={soilData.sand}
              onChange={(e) => setSoilData({
                ...soilData,
                sand: parseFloat(e.target.value) || 0
              })}
            />
          </div>
          <div className="input-group">
            <label>Fines (%):</label>
            <input
              type="number"
              min="0"
              max="100"
              value={soilData.fines}
              onChange={(e) => setSoilData({
                ...soilData,
                fines: parseFloat(e.target.value) || 0
              })}
            />
          </div>
        </div>

        <div className="input-section">
          <h3>Atterberg Limits</h3>
          <div className="input-group">
            <label>Liquid Limit:</label>
            <input
              type="number"
              min="0"
              max="120"
              value={soilData.liquidLimit}
              onChange={(e) => setSoilData({
                ...soilData,
                liquidLimit: parseFloat(e.target.value) || 0
              })}
            />
          </div>
          <div className="input-group">
            <label>Plastic Limit:</label>
            <input
              type="number"
              min="0"
              max="100"
              value={soilData.plasticLimit}
              onChange={(e) => setSoilData({
                ...soilData,
                plasticLimit: parseFloat(e.target.value) || 0
              })}
            />
          </div>
        </div>

        <div className="input-section">
          <h3>Optional Parameters</h3>
          <div className="input-group">
            <label>D60 (mm):</label>
            <input
              type="number"
              min="0"
              value={soilData.d60}
              onChange={(e) => setSoilData({
                ...soilData,
                d60: parseFloat(e.target.value) || 0
              })}
            />
          </div>
          <div className="input-group">
            <label>D30 (mm):</label>
            <input
              type="number"
              min="0"
              value={soilData.d30}
              onChange={(e) => setSoilData({
                ...soilData,
                d30: parseFloat(e.target.value) || 0
              })}
            />
          </div>
          <div className="input-group">
            <label>D10 (mm):</label>
            <input
              type="number"
              min="0"
              value={soilData.d10}
              onChange={(e) => setSoilData({
                ...soilData,
                d10: parseFloat(e.target.value) || 0
              })}
            />
          </div>
          <div className="input-group checkbox">
            <label>
              <input
                type="checkbox"
                checked={soilData.organicContent}
                onChange={(e) => setSoilData({
                  ...soilData,
                  organicContent: e.target.checked
                })}
              />
              Contains Organic Material
            </label>
          </div>
        </div>
      </div>

      {Object.keys(errors).length > 0 && (
        <div className="errors">
          {Object.values(errors).map((error, index) => (
            <p key={index} className="error">{error}</p>
          ))}
        </div>
      )}

      <button 
        className="classify-button"
        onClick={calculateSoilClassification}
      >
        Classify Soil
      </button>

      {results && (
        <div className="results-section">
          <h3>Classification Results</h3>
          <div className="results-grid">
            <div className="result-item">
              <span className="result-label">USCS Symbol:</span>
              <span className="result-value">{results.groupSymbol}</span>
            </div>
            <div className="result-item">
              <span className="result-label">Soil Description:</span>
              <span className="result-value">{results.description}</span>
            </div>
            <div className="result-item">
              <span className="result-label">Plasticity Index:</span>
              <span className="result-value">{results.plasticityIndex}</span>
            </div>
            {results.coefficientUniformity > 0 && (
              <div className="result-item">
                <span className="result-label">Coefficient of Uniformity (Cu):</span>
                <span className="result-value">{results.coefficientUniformity.toFixed(2)}</span>
              </div>
            )}
            {results.coefficientCurvature > 0 && (
              <div className="result-item">
                <span className="result-label">Coefficient of Curvature (Cc):</span>
                <span className="result-value">{results.coefficientCurvature.toFixed(2)}</span>
              </div>
            )}
            <div className="result-item notes">
              <span className="result-label">Engineering Properties:</span>
              <span className="result-value">{results.additionalNotes}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SoilClassificationTool;