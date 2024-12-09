import React, { useState } from 'react';
import './SettlementCalculator.css';

const SettlementCalculator = () => {
  const [calculationType, setCalculationType] = useState('immediate');
  const [soilData, setSoilData] = useState({
    // Common parameters
    foundationWidth: 2,  // meters
    foundationLength: 2, // meters
    foundationDepth: 1,  // meters
    appliedPressure: 200, // kPa
    
    // Immediate settlement parameters
    elasticModulus: 20000, // kPa
    poissonRatio: 0.3,
    influenceFactor: 0.88, // Default for square foundation
    
    // Consolidation settlement parameters
    compressionIndex: 0.2,
    recompressionIndex: 0.02,
    voidRatio: 0.8,
    effectiveStress: 100, // kPa
    layerThickness: 5,    // meters
    overconsolidationRatio: 1.0,
    preconsolidationPressure: 100 // kPa
  });

  const [results, setResults] = useState(null);
  const [errors, setErrors] = useState({});

  const validateInputs = () => {
    const newErrors = {};
    
    if (soilData.foundationWidth <= 0) {
      newErrors.foundationWidth = 'Foundation width must be positive';
    }
    if (soilData.foundationLength <= 0) {
      newErrors.foundationLength = 'Foundation length must be positive';
    }
    if (soilData.foundationDepth < 0) {
      newErrors.foundationDepth = 'Foundation depth cannot be negative';
    }
    if (soilData.appliedPressure <= 0) {
      newErrors.appliedPressure = 'Applied pressure must be positive';
    }

    if (calculationType === 'immediate') {
      if (soilData.elasticModulus <= 0) {
        newErrors.elasticModulus = 'Elastic modulus must be positive';
      }
      if (soilData.poissonRatio <= 0 || soilData.poissonRatio >= 0.5) {
        newErrors.poissonRatio = 'Poisson\'s ratio must be between 0 and 0.5';
      }
    } else {
      if (soilData.compressionIndex <= 0) {
        newErrors.compressionIndex = 'Compression index must be positive';
      }
      if (soilData.voidRatio <= 0) {
        newErrors.voidRatio = 'Void ratio must be positive';
      }
      if (soilData.layerThickness <= 0) {
        newErrors.layerThickness = 'Layer thickness must be positive';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateImmediateSettlement = () => {
    const {
      foundationWidth,
      foundationLength,
      appliedPressure,
      elasticModulus,
      poissonRatio,
      influenceFactor
    } = soilData;

    // Calculate shape factor based on L/B ratio
    const shapeFactor = 1 + 0.2 * (foundationLength / foundationWidth);

    // Calculate immediate settlement using elastic theory
    const settlement = (
      appliedPressure * foundationWidth * (1 - Math.pow(poissonRatio, 2)) * 
      influenceFactor * shapeFactor / elasticModulus
    );

    return settlement * 1000; // Convert to mm
  };

  const calculateConsolidationSettlement = () => {
    const {
      compressionIndex,
      recompressionIndex,
      voidRatio,
      effectiveStress,
      layerThickness,
      appliedPressure,
      preconsolidationPressure
    } = soilData;

    const finalStress = effectiveStress + appliedPressure;
    let settlement;

    if (finalStress <= preconsolidationPressure) {
      // Recompression only
      settlement = (recompressionIndex * layerThickness / (1 + voidRatio)) *
        Math.log10(finalStress / effectiveStress);
    } else if (effectiveStress >= preconsolidationPressure) {
      // Virgin compression only
      settlement = (compressionIndex * layerThickness / (1 + voidRatio)) *
        Math.log10(finalStress / effectiveStress);
    } else {
      // Both recompression and virgin compression
      settlement = (recompressionIndex * layerThickness / (1 + voidRatio)) *
        Math.log10(preconsolidationPressure / effectiveStress) +
        (compressionIndex * layerThickness / (1 + voidRatio)) *
        Math.log10(finalStress / preconsolidationPressure);
    }

    return settlement * 1000; // Convert to mm
  };

  const calculateSettlement = () => {
    if (!validateInputs()) {
      return;
    }

    try {
      let settlement;
      let additionalInfo = {};

      if (calculationType === 'immediate') {
        settlement = calculateImmediateSettlement();
        additionalInfo = {
          type: 'Immediate (Elastic) Settlement',
          timeFrame: 'Occurs immediately upon loading',
          assumptions: [
            'Elastic behavior',
            'Homogeneous soil',
            'Semi-infinite soil mass'
          ]
        };
      } else {
        settlement = calculateConsolidationSettlement();
        additionalInfo = {
          type: 'Consolidation Settlement',
          timeFrame: 'Occurs over time as excess pore water pressure dissipates',
          assumptions: [
            'One-dimensional consolidation',
            'Saturated soil',
            'Linear stress-strain relationship'
          ]
        };
      }

      setResults({
        settlement,
        ...additionalInfo,
        allowableSettlement: settlement > 25 ? 'Exceeds typical allowable limit' : 'Within typical allowable limit',
        reliability: 'Medium to High',
        notes: generateNotes(settlement)
      });
    } catch (error) {
      setErrors({ calculation: 'Error in settlement calculation' });
    }
  };

  const generateNotes = (settlement) => {
    let notes = [];
    
    if (settlement > 25) {
      notes.push('Settlement exceeds typical allowable limit of 25mm');
      notes.push('Consider revising foundation design or soil improvement');
    } else if (settlement > 15) {
      notes.push('Settlement is approaching typical allowable limit');
      notes.push('Monitor during construction');
    } else {
      notes.push('Settlement is within acceptable range');
    }

    return notes;
  };

  return (
    <div className="settlement-calculator">
      <h2>Settlement Calculator</h2>
      
      <div className="calculator-controls">
        <div className="calculation-type">
          <label>Settlement Type:</label>
          <select
            value={calculationType}
            onChange={(e) => setCalculationType(e.target.value)}
          >
            <option value="immediate">Immediate Settlement</option>
            <option value="consolidation">Consolidation Settlement</option>
          </select>
        </div>

        <div className="input-sections">
          <div className="input-section">
            <h3>Foundation Parameters</h3>
            <div className="input-group">
              <label>Width (m):</label>
              <input
                type="number"
                value={soilData.foundationWidth}
                onChange={(e) => setSoilData({
                  ...soilData,
                  foundationWidth: parseFloat(e.target.value) || 0
                })}
              />
            </div>
            <div className="input-group">
              <label>Length (m):</label>
              <input
                type="number"
                value={soilData.foundationLength}
                onChange={(e) => setSoilData({
                  ...soilData,
                  foundationLength: parseFloat(e.target.value) || 0
                })}
              />
            </div>
            <div className="input-group">
              <label>Depth (m):</label>
              <input
                type="number"
                value={soilData.foundationDepth}
                onChange={(e) => setSoilData({
                  ...soilData,
                  foundationDepth: parseFloat(e.target.value) || 0
                })}
              />
            </div>
            <div className="input-group">
              <label>Applied Pressure (kPa):</label>
              <input
                type="number"
                value={soilData.appliedPressure}
                onChange={(e) => setSoilData({
                  ...soilData,
                  appliedPressure: parseFloat(e.target.value) || 0
                })}
              />
            </div>
          </div>

          {calculationType === 'immediate' ? (
            <div className="input-section">
              <h3>Soil Elastic Parameters</h3>
              <div className="input-group">
                <label>Elastic Modulus (kPa):</label>
                <input
                  type="number"
                  value={soilData.elasticModulus}
                  onChange={(e) => setSoilData({
                    ...soilData,
                    elasticModulus: parseFloat(e.target.value) || 0
                  })}
                />
              </div>
              <div className="input-group">
                <label>Poisson's Ratio:</label>
                <input
                  type="number"
                  step="0.01"
                  value={soilData.poissonRatio}
                  onChange={(e) => setSoilData({
                    ...soilData,
                    poissonRatio: parseFloat(e.target.value) || 0
                  })}
                />
              </div>
              <div className="input-group">
                <label>Influence Factor:</label>
                <input
                  type="number"
                  step="0.01"
                  value={soilData.influenceFactor}
                  onChange={(e) => setSoilData({
                    ...soilData,
                    influenceFactor: parseFloat(e.target.value) || 0
                  })}
                />
              </div>
            </div>
          ) : (
            <div className="input-section">
              <h3>Consolidation Parameters</h3>
              <div className="input-group">
                <label>Compression Index (Cc):</label>
                <input
                  type="number"
                  step="0.01"
                  value={soilData.compressionIndex}
                  onChange={(e) => setSoilData({
                    ...soilData,
                    compressionIndex: parseFloat(e.target.value) || 0
                  })}
                />
              </div>
              <div className="input-group">
                <label>Recompression Index (Cr):</label>
                <input
                  type="number"
                  step="0.01"
                  value={soilData.recompressionIndex}
                  onChange={(e) => setSoilData({
                    ...soilData,
                    recompressionIndex: parseFloat(e.target.value) || 0
                  })}
                />
              </div>
              <div className="input-group">
                <label>Initial Void Ratio (e₀):</label>
                <input
                  type="number"
                  step="0.01"
                  value={soilData.voidRatio}
                  onChange={(e) => setSoilData({
                    ...soilData,
                    voidRatio: parseFloat(e.target.value) || 0
                  })}
                />
              </div>
              <div className="input-group">
                <label>Layer Thickness (m):</label>
                <input
                  type="number"
                  value={soilData.layerThickness}
                  onChange={(e) => setSoilData({
                    ...soilData,
                    layerThickness: parseFloat(e.target.value) || 0
                  })}
                />
              </div>
            </div>
          )}
        </div>

        {Object.keys(errors).length > 0 && (
          <div className="errors">
            {Object.values(errors).map((error, index) => (
              <p key={index} className="error">{error}</p>
            ))}
          </div>
        )}

        <button 
          className="calculate-button"
          onClick={calculateSettlement}
        >
          Calculate Settlement
        </button>

        {results && (
          <div className="results-section">
            <h3>Settlement Results</h3>
            <div className="results-grid">
              <div className="result-item">
                <span className="result-label">Settlement Type:</span>
                <span className="result-value">{results.type}</span>
              </div>
              <div className="result-item">
                <span className="result-label">Total Settlement:</span>
                <span className="result-value">{results.settlement.toFixed(2)} mm</span>
              </div>
              <div className="result-item">
                <span className="result-label">Time Frame:</span>
                <span className="result-value">{results.timeFrame}</span>
              </div>
              <div className="result-item">
                <span className="result-label">Status:</span>
                <span className="result-value">{results.allowableSettlement}</span>
              </div>
              <div className="result-item notes">
                <span className="result-label">Notes:</span>
                <ul>
                  {results.notes.map((note, index) => (
                    <li key={index}>{note}</li>
                  ))}
                </ul>
              </div>
              <div className="result-item assumptions">
                <span className="result-label">Key Assumptions:</span>
                <ul>
                  {results.assumptions.map((assumption, index) => (
                    <li key={index}>{assumption}</li>
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

export default SettlementCalculator;