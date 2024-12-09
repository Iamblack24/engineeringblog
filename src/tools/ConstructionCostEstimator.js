import React, { useState } from 'react';
import './ConstructionCostEstimator.css';

const ConstructionCostEstimator = () => {
  const [projectData, setProjectData] = useState({
    // Project basics
    projectType: 'residential',
    totalArea: 0,         // square meters
    numFloors: 1,
    location: 'urban',
    
    // Construction type
    structureType: 'concrete',
    finishingLevel: 'standard',
    
    // Additional features
    hasBasement: false,
    hasParkingArea: false,
    hasLandscaping: false,
    
    // Cost factors
    laborCostPerDay: 0,   // per worker
    numWorkers: 0,
    estimatedDuration: 0, // days
    materialsCostFactor: 1.0,
    overheadPercentage: 15,
    profitPercentage: 10,
    contingencyPercentage: 5
  });

  const [results, setResults] = useState(null);
  const [errors, setErrors] = useState({});

  // Base rates per square meter (can be adjusted based on location/market)
  const baseRates = {
    residential: {
      concrete: { basic: 800, standard: 1000, luxury: 1500 },
      steel: { basic: 900, standard: 1200, luxury: 1800 },
      wood: { basic: 600, standard: 800, luxury: 1200 }
    },
    commercial: {
      concrete: { basic: 1000, standard: 1300, luxury: 2000 },
      steel: { basic: 1200, standard: 1500, luxury: 2200 },
      wood: { basic: 800, standard: 1000, luxury: 1500 }
    }
  };

  // Location factors
  const locationFactors = {
    urban: 1.2,
    suburban: 1.0,
    rural: 0.8
  };

  const validateInputs = () => {
    const newErrors = {};
    
    if (projectData.totalArea <= 0) {
      newErrors.totalArea = 'Total area must be positive';
    }
    if (projectData.numFloors <= 0) {
      newErrors.numFloors = 'Number of floors must be positive';
    }
    if (projectData.laborCostPerDay <= 0) {
      newErrors.laborCostPerDay = 'Labor cost must be positive';
    }
    if (projectData.numWorkers <= 0) {
      newErrors.numWorkers = 'Number of workers must be positive';
    }
    if (projectData.estimatedDuration <= 0) {
      newErrors.estimatedDuration = 'Project duration must be positive';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateCosts = () => {
    if (!validateInputs()) {
      return;
    }

    try {
      const {
        projectType,
        totalArea,
        numFloors,
        location,
        structureType,
        finishingLevel,
        hasBasement,
        hasParkingArea,
        hasLandscaping,
        laborCostPerDay,
        numWorkers,
        estimatedDuration,
        materialsCostFactor,
        overheadPercentage,
        profitPercentage,
        contingencyPercentage
      } = projectData;

      // Calculate base construction cost
      const baseRate = baseRates[projectType][structureType][finishingLevel];
      const locationFactor = locationFactors[location];
      
      let baseCost = baseRate * totalArea * locationFactor * materialsCostFactor;
      baseCost *= (1 + (numFloors - 1) * 0.05); // 5% increase per additional floor

      // Additional features costs
      const basementCost = hasBasement ? baseCost * 0.15 : 0;
      const parkingCost = hasParkingArea ? totalArea * 100 : 0;
      const landscapingCost = hasLandscaping ? totalArea * 50 : 0;

      // Labor costs
      const laborCost = laborCostPerDay * numWorkers * estimatedDuration;

      // Calculate subtotal
      const subtotal = baseCost + basementCost + parkingCost + landscapingCost + laborCost;

      // Calculate additional costs
      const overhead = subtotal * (overheadPercentage / 100);
      const profit = subtotal * (profitPercentage / 100);
      const contingency = subtotal * (contingencyPercentage / 100);

      // Calculate total
      const totalCost = subtotal + overhead + profit + contingency;

      // Calculate cost per square meter
      const costPerSquareMeter = totalCost / totalArea;

      setResults({
        baseCost,
        additionalCosts: {
          basement: basementCost,
          parking: parkingCost,
          landscaping: landscapingCost
        },
        laborCost,
        subtotal,
        overhead,
        profit,
        contingency,
        totalCost,
        costPerSquareMeter,
        estimatedTimeframe: `${estimatedDuration} days`,
        notes: [
          'Estimates are based on current market rates',
          'Actual costs may vary based on specific requirements',
          'Excludes land acquisition costs',
          'Excludes permit and approval costs'
        ],
        assumptions: [
          'Standard soil conditions',
          'No special foundation requirements',
          'Regular working hours',
          'Standard material specifications'
        ]
      });

    } catch (error) {
      setErrors({ calculation: 'Error in cost calculations' });
    }
  };

  return (
    <div className="construction-cost-estimator">
      <h2>Construction Cost Estimator</h2>
      
      <div className="calculator-controls">
        <div className="input-sections">
          {/* Project Basics Section */}
          <div className="input-section">
            <h3>Project Basics</h3>
            <div className="input-group">
              <label>Project Type:</label>
              <select
                value={projectData.projectType}
                onChange={(e) => setProjectData({
                  ...projectData,
                  projectType: e.target.value
                })}
              >
                <option value="residential">Residential</option>
                <option value="commercial">Commercial</option>
              </select>
            </div>
            <div className="input-group">
              <label>Total Area (m²):</label>
              <input
                type="number"
                value={projectData.totalArea}
                onChange={(e) => setProjectData({
                  ...projectData,
                  totalArea: parseFloat(e.target.value) || 0
                })}
              />
            </div>
            <div className="input-group">
              <label>Number of Floors:</label>
              <input
                type="number"
                value={projectData.numFloors}
                onChange={(e) => setProjectData({
                  ...projectData,
                  numFloors: parseInt(e.target.value) || 0
                })}
              />
            </div>
            <div className="input-group">
              <label>Location:</label>
              <select
                value={projectData.location}
                onChange={(e) => setProjectData({
                  ...projectData,
                  location: e.target.value
                })}
              >
                <option value="urban">Urban</option>
                <option value="suburban">Suburban</option>
                <option value="rural">Rural</option>
              </select>
            </div>
          </div>

          {/* Construction Type Section */}
          <div className="input-section">
            <h3>Construction Details</h3>
            <div className="input-group">
              <label>Structure Type:</label>
              <select
                value={projectData.structureType}
                onChange={(e) => setProjectData({
                  ...projectData,
                  structureType: e.target.value
                })}
              >
                <option value="concrete">Concrete</option>
                <option value="steel">Steel</option>
                <option value="wood">Wood</option>
              </select>
            </div>
            <div className="input-group">
              <label>Finishing Level:</label>
              <select
                value={projectData.finishingLevel}
                onChange={(e) => setProjectData({
                  ...projectData,
                  finishingLevel: e.target.value
                })}
              >
                <option value="basic">Basic</option>
                <option value="standard">Standard</option>
                <option value="luxury">Luxury</option>
              </select>
            </div>
          </div>

          {/* Additional Features Section */}
          <div className="input-section">
            <h3>Additional Features</h3>
            <div className="input-group checkbox">
              <input
                type="checkbox"
                checked={projectData.hasBasement}
                onChange={(e) => setProjectData({
                  ...projectData,
                  hasBasement: e.target.checked
                })}
              />
              <label>Include Basement</label>
            </div>
            <div className="input-group checkbox">
              <input
                type="checkbox"
                checked={projectData.hasParkingArea}
                onChange={(e) => setProjectData({
                  ...projectData,
                  hasParkingArea: e.target.checked
                })}
              />
              <label>Include Parking Area</label>
            </div>
            <div className="input-group checkbox">
              <input
                type="checkbox"
                checked={projectData.hasLandscaping}
                onChange={(e) => setProjectData({
                  ...projectData,
                  hasLandscaping: e.target.checked
                })}
              />
              <label>Include Landscaping</label>
            </div>
          </div>

          {/* Cost Factors Section */}
          <div className="input-section">
            <h3>Cost Factors</h3>
            <div className="input-group">
              <label>Labor Cost per Day ($):</label>
              <input
                type="number"
                value={projectData.laborCostPerDay}
                onChange={(e) => setProjectData({
                  ...projectData,
                  laborCostPerDay: parseFloat(e.target.value) || 0
                })}
              />
            </div>
            <div className="input-group">
              <label>Number of Workers:</label>
              <input
                type="number"
                value={projectData.numWorkers}
                onChange={(e) => setProjectData({
                  ...projectData,
                  numWorkers: parseInt(e.target.value) || 0
                })}
              />
            </div>
            <div className="input-group">
              <label>Estimated Duration (days):</label>
              <input
                type="number"
                value={projectData.estimatedDuration}
                onChange={(e) => setProjectData({
                  ...projectData,
                  estimatedDuration: parseInt(e.target.value) || 0
                })}
              />
            </div>
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

        <button 
          className="calculate-button"
          onClick={calculateCosts}
        >
          Calculate Costs
        </button>

        {/* Results Section */}
        {results && (
          <div className="results-section">
            <h3>Cost Estimation Results</h3>
            <div className="results-grid">
              <div className="result-item">
                <span className="result-label">Base Construction Cost:</span>
                <span className="result-value">${results.baseCost.toLocaleString()}</span>
              </div>
              <div className="result-item">
                <span className="result-label">Additional Features:</span>
                <div className="sub-results">
                  <div>Basement: ${results.additionalCosts.basement.toLocaleString()}</div>
                  <div>Parking: ${results.additionalCosts.parking.toLocaleString()}</div>
                  <div>Landscaping: ${results.additionalCosts.landscaping.toLocaleString()}</div>
                </div>
              </div>
              <div className="result-item">
                <span className="result-label">Labor Cost:</span>
                <span className="result-value">${results.laborCost.toLocaleString()}</span>
              </div>
              <div className="result-item">
                <span className="result-label">Subtotal:</span>
                <span className="result-value">${results.subtotal.toLocaleString()}</span>
              </div>
              <div className="result-item">
                <span className="result-label">Overhead:</span>
                <span className="result-value">${results.overhead.toLocaleString()}</span>
              </div>
              <div className="result-item">
                <span className="result-label">Profit:</span>
                <span className="result-value">${results.profit.toLocaleString()}</span>
              </div>
              <div className="result-item">
                <span className="result-label">Contingency:</span>
                <span className="result-value">${results.contingency.toLocaleString()}</span>
              </div>
              <div className="result-item total">
                <span className="result-label">Total Cost:</span>
                <span className="result-value">${results.totalCost.toLocaleString()}</span>
              </div>
              <div className="result-item">
                <span className="result-label">Cost per Square Meter:</span>
                <span className="result-value">${results.costPerSquareMeter.toLocaleString()}/m²</span>
              </div>
              <div className="result-item">
                <span className="result-label">Estimated Timeframe:</span>
                <span className="result-value">{results.estimatedTimeframe}</span>
              </div>
              <div className="result-item notes">
                <span className="result-label">Important Notes:</span>
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

export default ConstructionCostEstimator;