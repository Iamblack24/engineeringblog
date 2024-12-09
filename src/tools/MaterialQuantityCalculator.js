import React, { useState } from 'react';
import './MaterialQuantityCalculator.css';

const MaterialQuantityCalculator = () => {
  const [projectData, setProjectData] = useState({
    // Building dimensions
    length: 0,        // meters
    width: 0,         // meters
    height: 0,        // meters
    numFloors: 1,
    
    // Wall specifications
    wallThickness: 0.23,  // meters (standard brick wall)
    windowArea: 0,        // square meters
    doorArea: 0,         // square meters
    
    // Foundation specifications
    foundationDepth: 1,   // meters
    foundationWidth: 0.3, // meters
    
    // Slab specifications
    slabThickness: 0.15,  // meters
    
    // Material selections
    wallMaterial: 'brick',  // brick, block, or concrete
    foundationType: 'strip', // strip or raft
    concreteGrade: 'M25',   // M20, M25, M30
    
    // Additional features
    includeFinishes: true,
    includePlaster: true,
    includePaint: true,
    includeWaterproofing: true
  });

  const [results, setResults] = useState(null);
  const [errors, setErrors] = useState({});

  // Material constants
  const CONSTANTS = {
    brick: {
      dimensions: { length: 0.23, width: 0.11, height: 0.075 }, // meters
      mortar: 0.03, // cubic meters per square meter of wall
      wastage: 1.1  // 10% wastage factor
    },
    concrete: {
      wastage: 1.15, // 15% wastage
      reinforcement: {
        foundation: 80,  // kg/m³
        slab: 90,       // kg/m³
        columns: 120    // kg/m³
      }
    },
    plaster: {
      thickness: 0.015, // meters
      wastage: 1.2     // 20% wastage
    },
    paint: {
      coverage: 0.38,   // liters per m² (two coats)
      wastage: 1.1     // 10% wastage
    }
  };

  const validateInputs = () => {
    const newErrors = {};
    
    if (projectData.length <= 0) newErrors.length = 'Length must be positive';
    if (projectData.width <= 0) newErrors.width = 'Width must be positive';
    if (projectData.height <= 0) newErrors.height = 'Height must be positive';
    if (projectData.numFloors <= 0) newErrors.numFloors = 'Number of floors must be positive';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateFoundationVolume = (length, width, foundationType) => {
    // Foundation dimensions based on type
    const dimensions = {
      strip: {
        width: 0.6,     // m
        depth: 1.0      // m
      },
      raft: {
        thickness: 0.3  // m
      }
    };

    if (foundationType === 'strip') {
      // Calculate perimeter length for strip foundation
      const perimeter = 2 * (length + width);
      return perimeter * dimensions.strip.width * dimensions.strip.depth;
    } else {
      // Raft foundation covers entire area
      return length * width * dimensions.raft.thickness;
    }
  };

  const calculateBrickQuantities = (netWallArea) => {
    const BRICK_CONSTANTS = {
      size: { length: 0.23, width: 0.11, height: 0.07 }, // m
      mortar: 0.01,                                      // m
      wastage: 1.1                                       // 10% wastage
    };

    // Calculate number of bricks per m²
    const bricksPerM2 = 1 / (
      (BRICK_CONSTANTS.size.length + BRICK_CONSTANTS.mortar) * 
      (BRICK_CONSTANTS.size.height + BRICK_CONSTANTS.mortar)
    );

    return {
      bricks: Math.ceil(netWallArea * bricksPerM2 * BRICK_CONSTANTS.wastage),
      mortar: netWallArea * 0.03  // Approximately 3cm³ mortar per m²
    };
  };

  const calculateBlockQuantities = (netWallArea) => {
    const BLOCK_CONSTANTS = {
      size: { length: 0.4, width: 0.2, height: 0.2 },  // m
      mortar: 0.01,                                    // m
      wastage: 1.05                                    // 5% wastage
    };

    // Calculate number of blocks per m²
    const blocksPerM2 = 1 / (
      (BLOCK_CONSTANTS.size.length + BLOCK_CONSTANTS.mortar) * 
      (BLOCK_CONSTANTS.size.height + BLOCK_CONSTANTS.mortar)
    );

    return {
      blocks: Math.ceil(netWallArea * blocksPerM2 * BLOCK_CONSTANTS.wastage),
      mortar: netWallArea * 0.02  // Approximately 2cm³ mortar per m²
    };
  };

  const calculateConcreteWallQuantities = (netWallArea) => {
    const WALL_CONSTANTS = {
      thickness: 0.15,  // m
      reinforcement: 80 // kg/m³
    };

    const concreteVolume = netWallArea * WALL_CONSTANTS.thickness;
    
    return {
      concrete: concreteVolume * CONSTANTS.concrete.wastage,
      reinforcement: concreteVolume * WALL_CONSTANTS.reinforcement
    };
  };

  const calculateFinishingQuantities = (netWallArea, slabArea) => {
    if (!projectData.includeFinishes) return null;

    const quantities = {};

    // Plaster calculations
    if (projectData.includePlaster) {
      quantities.plaster = {
        area: netWallArea * 2, // Both sides of walls
        volume: netWallArea * 2 * 0.015 // 15mm thickness
      };
    }

    // Paint calculations
    if (projectData.includePaint) {
      quantities.paint = {
        area: netWallArea * 2 + slabArea, // Walls and ceiling
        liters: (netWallArea * 2 + slabArea) * 0.1 // 0.1L per m²
      };
    }

    return quantities;
  };

  const calculateCostEstimate = (
    foundationVolume,
    slabVolume,
    foundationReinforcement,
    slabReinforcement,
    wallMaterials,
    finishingQuantities
  ) => {
    const UNIT_COSTS = {
      concrete: 150,      // per m³
      reinforcement: 1.2, // per kg
      brick: 0.5,        // per brick
      block: 2.0,        // per block
      mortar: 100,       // per m³
      plaster: 12,       // per m²
      paint: 5           // per m²
    };

    let totalCost = 0;
    const breakdown = {};

    // Concrete costs
    const concreteCost = (foundationVolume + slabVolume) * 
                        CONSTANTS.concrete.wastage * 
                        UNIT_COSTS.concrete;
    breakdown.concrete = concreteCost;

    // Reinforcement costs
    const reinforcementCost = (foundationReinforcement + slabReinforcement) * 
                             UNIT_COSTS.reinforcement;
    breakdown.reinforcement = reinforcementCost;

    // Wall material costs
    if (wallMaterials) {
      if (wallMaterials.bricks) {
        breakdown.walls = wallMaterials.bricks * UNIT_COSTS.brick +
                         wallMaterials.mortar * UNIT_COSTS.mortar;
      } else if (wallMaterials.blocks) {
        breakdown.walls = wallMaterials.blocks * UNIT_COSTS.block +
                         wallMaterials.mortar * UNIT_COSTS.mortar;
      } else if (wallMaterials.concrete) {
        breakdown.walls = wallMaterials.concrete * UNIT_COSTS.concrete +
                         wallMaterials.reinforcement * UNIT_COSTS.reinforcement;
      }
    }

    // Finishing costs
    if (finishingQuantities) {
      breakdown.finishing = 0;
      if (finishingQuantities.plaster) {
        breakdown.finishing += finishingQuantities.plaster.area * UNIT_COSTS.plaster;
      }
      if (finishingQuantities.paint) {
        breakdown.finishing += finishingQuantities.paint.area * UNIT_COSTS.paint;
      }
    }

    // Calculate total
    totalCost = Object.values(breakdown).reduce((sum, cost) => sum + cost, 0);
    
    return {
      ...breakdown,
      total: totalCost
    };
  };

  const calculateQuantities = () => {
    if (!validateInputs()) return;

    try {
      // Calculate basic dimensions
      const grossWallArea = 2 * (projectData.length + projectData.width) * 
                           projectData.height * projectData.numFloors;
      const netWallArea = grossWallArea - (projectData.windowArea + projectData.doorArea);
      
      // Foundation calculations
      const foundationVolume = calculateFoundationVolume();
      const foundationReinforcement = foundationVolume * CONSTANTS.concrete.reinforcement.foundation;
      
      // Slab calculations
      const slabArea = projectData.length * projectData.width * projectData.numFloors;
      const slabVolume = slabArea * projectData.slabThickness;
      const slabReinforcement = slabVolume * CONSTANTS.concrete.reinforcement.slab;
      
      // Wall material calculations
      let wallMaterials = {};
      if (projectData.wallMaterial === 'brick') {
        wallMaterials = calculateBrickQuantities(netWallArea);
      } else if (projectData.wallMaterial === 'block') {
        wallMaterials = calculateBlockQuantities(netWallArea);
      } else {
        wallMaterials = calculateConcreteWallQuantities(netWallArea);
      }
      
      // Finishing calculations
      const finishingQuantities = projectData.includeFinishes ? 
        calculateFinishingQuantities(netWallArea, slabArea) : null;

      setResults({
        dimensions: {
          grossWallArea,
          netWallArea,
          slabArea,
          foundationVolume,
          slabVolume
        },
        concrete: {
          foundation: foundationVolume * CONSTANTS.concrete.wastage,
          slab: slabVolume * CONSTANTS.concrete.wastage,
          total: (foundationVolume + slabVolume) * CONSTANTS.concrete.wastage
        },
        reinforcement: {
          foundation: foundationReinforcement,
          slab: slabReinforcement,
          total: foundationReinforcement + slabReinforcement
        },
        wallMaterials,
        finishing: finishingQuantities,
        costEstimate: calculateCostEstimate(
          foundationVolume,
          slabVolume,
          foundationReinforcement,
          slabReinforcement,
          wallMaterials,
          finishingQuantities
        )
      });

    } catch (error) {
      setErrors({ calculation: 'Error in quantity calculations' });
    }
  };

  return (
    <div className="material-quantity-calculator">
      <h2>Material Quantity Calculator</h2>
      
      <div className="calculator-controls">
        <div className="input-sections">
          {/* Building Dimensions Section */}
          <div className="input-section">
            <h3>Building Dimensions</h3>
            <div className="input-group">
              <label>Length (m):</label>
              <input
                type="number"
                value={projectData.length}
                onChange={(e) => setProjectData({
                  ...projectData,
                  length: parseFloat(e.target.value) || 0
                })}
              />
            </div>
            <div className="input-group">
              <label>Width (m):</label>
              <input
                type="number"
                value={projectData.width}
                onChange={(e) => setProjectData({
                  ...projectData,
                  width: parseFloat(e.target.value) || 0
                })}
              />
            </div>
            <div className="input-group">
              <label>Height (m):</label>
              <input
                type="number"
                value={projectData.height}
                onChange={(e) => setProjectData({
                  ...projectData,
                  height: parseFloat(e.target.value) || 0
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
          </div>

          {/* Material Specifications Section */}
          <div className="input-section">
            <h3>Material Specifications</h3>
            <div className="input-group">
              <label>Wall Material:</label>
              <select
                value={projectData.wallMaterial}
                onChange={(e) => setProjectData({
                  ...projectData,
                  wallMaterial: e.target.value
                })}
              >
                <option value="brick">Brick</option>
                <option value="block">Concrete Block</option>
                <option value="concrete">Cast Concrete</option>
              </select>
            </div>
            <div className="input-group">
              <label>Foundation Type:</label>
              <select
                value={projectData.foundationType}
                onChange={(e) => setProjectData({
                  ...projectData,
                  foundationType: e.target.value
                })}
              >
                <option value="strip">Strip Foundation</option>
                <option value="raft">Raft Foundation</option>
              </select>
            </div>
            <div className="input-group">
              <label>Concrete Grade:</label>
              <select
                value={projectData.concreteGrade}
                onChange={(e) => setProjectData({
                  ...projectData,
                  concreteGrade: e.target.value
                })}
              >
                <option value="M20">M20</option>
                <option value="M25">M25</option>
                <option value="M30">M30</option>
              </select>
            </div>
          </div>

          {/* Additional Features Section */}
          <div className="input-section">
            <h3>Additional Features</h3>
            <div className="input-group checkbox">
              <input
                type="checkbox"
                checked={projectData.includeFinishes}
                onChange={(e) => setProjectData({
                  ...projectData,
                  includeFinishes: e.target.checked
                })}
              />
              <label>Include Finishes</label>
            </div>
            <div className="input-group checkbox">
              <input
                type="checkbox"
                checked={projectData.includePlaster}
                onChange={(e) => setProjectData({
                  ...projectData,
                  includePlaster: e.target.checked
                })}
              />
              <label>Include Plaster</label>
            </div>
            <div className="input-group checkbox">
              <input
                type="checkbox"
                checked={projectData.includePaint}
                onChange={(e) => setProjectData({
                  ...projectData,
                  includePaint: e.target.checked
                })}
              />
              <label>Include Paint</label>
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
          onClick={calculateQuantities}
        >
          Calculate Quantities
        </button>

        {/* Results Display */}
        {results && (
          <div className="results-section">
            <h3>Quantity Estimation Results</h3>
            <div className="results-grid">
              {/* Dimensions Summary */}
              <div className="result-item">
                <h4>Building Dimensions</h4>
                <div className="result-detail">
                  <span>Gross Wall Area:</span>
                  <span>{results.dimensions.grossWallArea.toFixed(2)} m²</span>
                </div>
                <div className="result-detail">
                  <span>Net Wall Area:</span>
                  <span>{results.dimensions.netWallArea.toFixed(2)} m²</span>
                </div>
                <div className="result-detail">
                  <span>Total Floor Area:</span>
                  <span>{results.dimensions.slabArea.toFixed(2)} m²</span>
                </div>
              </div>

              {/* Concrete Quantities */}
              <div className="result-item">
                <h4>Concrete Requirements</h4>
                <div className="result-detail">
                  <span>Foundation:</span>
                  <span>{results.concrete.foundation.toFixed(2)} m³</span>
                </div>
                <div className="result-detail">
                  <span>Slabs:</span>
                  <span>{results.concrete.slab.toFixed(2)} m³</span>
                </div>
                <div className="result-detail total">
                  <span>Total Concrete:</span>
                  <span>{results.concrete.total.toFixed(2)} m³</span>
                </div>
              </div>

              {/* Reinforcement Quantities */}
              <div className="result-item">
                <h4>Reinforcement Steel</h4>
                <div className="result-detail">
                  <span>Foundation:</span>
                  <span>{results.reinforcement.foundation.toFixed(2)} kg</span>
                </div>
                <div className="result-detail">
                  <span>Slabs:</span>
                  <span>{results.reinforcement.slab.toFixed(2)} kg</span>
                </div>
                <div className="result-detail total">
                  <span>Total Steel:</span>
                  <span>{results.reinforcement.total.toFixed(2)} kg</span>
                </div>
              </div>

              {/* Wall Materials */}
              <div className="result-item">
                <h4>Wall Materials</h4>
                {Object.entries(results.wallMaterials).map(([key, value]) => (
                  <div key={key} className="result-detail">
                    <span>{key}:</span>
                    <span>
                      {typeof value === 'object' 
                        ? `${value.area.toFixed(2)} m² / ${value.volume.toFixed(2)} m³`
                        : typeof value === 'number' 
                          ? value.toFixed(2) 
                          : value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Finishing Materials */}
              {results.finishing && (
                <div className="result-item">
                  <h4>Finishing Materials</h4>
                  {Object.entries(results.finishing).map(([key, value]) => (
                    <div key={key} className="result-detail">
                      <span>{key}:</span>
                      <span>
                        {typeof value === 'object'
                          ? `${value.area.toFixed(2)} m²`
                          : typeof value === 'number'
                            ? value.toFixed(2)
                            : value}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Cost Estimate */}
              <div className="result-item cost-summary">
                <h4>Cost Estimate</h4>
                {Object.entries(results.costEstimate).map(([key, value]) => (
                  <div key={key} className="result-detail">
                    <span>{key}:</span>
                    <span>
                      ${typeof value === 'object'
                        ? Object.entries(value).map(([subKey, subValue]) => 
                            `${subKey}: ${subValue.toFixed(2)}`
                          ).join(' / ')
                        : typeof value === 'number'
                          ? value.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2
                            })
                          : value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MaterialQuantityCalculator;