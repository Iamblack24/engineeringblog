import React, { useState } from 'react';
import './CarbonFootprintCalculator.css';

const CarbonFootprintCalculator = () => {
  const [footprintData, setFootprintData] = useState({
    // Transportation
    transportation: {
      carKmPerYear: 0,
      carType: 'petrol', // petrol, diesel, hybrid, electric
      publicTransportKmPerYear: 0,
      flightsShortHaul: 0,
      flightsMediumHaul: 0,
      flightsLongHaul: 0
    },
    
    // Energy
    energy: {
      electricityKwhPerMonth: 0,
      gasKwhPerMonth: 0,
      renewablePercentage: 0,
      homeSize: 'medium', // small, medium, large
      occupants: 1
    },
    
    // Waste & Recycling
    waste: {
      wastePerWeek: 0, // kg
      recyclingPercentage: 0,
      compostingPercentage: 0
    },
    
    // Food & Diet
    diet: {
      dietType: 'mixed', // vegan, vegetarian, mixed, high-meat
      localFoodPercentage: 0,
      foodWastePercentage: 0
    },
    
    // Consumption
    consumption: {
      monthlySpending: {
        clothing: 0,
        electronics: 0,
        furniture: 0
      },
      shoppingHabits: 'new', // new, mixed, secondhand
    }
  });

  const [results, setResults] = useState(null);
  const [errors, setErrors] = useState({});

  // Emission factors (kg CO2e)
  const EMISSION_FACTORS = {
    transportation: {
      car: {
        petrol: 0.192,    // per km
        diesel: 0.171,
        hybrid: 0.111,
        electric: 0.053
      },
      publicTransport: 0.04,
      flights: {
        shortHaul: 180,   // per flight
        mediumHaul: 670,
        longHaul: 1800
      }
    },
    energy: {
      electricity: 0.233, // per kWh
      gas: 0.184,
      renewableDiscount: 0.9
    },
    waste: {
      general: 0.587,     // per kg
      recyclingDiscount: 0.7,
      compostingDiscount: 0.8
    },
    diet: {
      vegan: 1.5,         // daily base
      vegetarian: 1.7,
      mixed: 2.5,
      highMeat: 3.3
    },
    consumption: {
      clothingFactor: 0.01,
      electronicsFactor: 0.015,
      furnitureFactor: 0.012
    }
  };

  const validateInputs = () => {
    const newErrors = {};
    
    // Validate transportation inputs
    if (footprintData.transportation.carKmPerYear < 0) {
      newErrors.carKm = 'Car kilometers must be non-negative';
    }
    if (footprintData.transportation.publicTransportKmPerYear < 0) {
      newErrors.publicTransport = 'Public transport kilometers must be non-negative';
    }
    
    // Validate energy inputs
    if (footprintData.energy.electricityKwhPerMonth < 0) {
      newErrors.electricity = 'Electricity usage must be non-negative';
    }
    if (footprintData.energy.gasKwhPerMonth < 0) {
      newErrors.gas = 'Gas usage must be non-negative';
    }
    if (footprintData.energy.renewablePercentage < 0 || 
        footprintData.energy.renewablePercentage > 100) {
      newErrors.renewable = 'Renewable percentage must be between 0 and 100';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateFootprint = () => {
    if (!validateInputs()) return;

    try {
      // Calculate transportation emissions
      const transportationEmissions = calculateTransportationEmissions();
      
      // Calculate energy emissions
      const energyEmissions = calculateEnergyEmissions();
      
      // Calculate waste emissions
      const wasteEmissions = calculateWasteEmissions();
      
      // Calculate food emissions
      const foodEmissions = calculateFoodEmissions();
      
      // Calculate consumption emissions
      const consumptionEmissions = calculateConsumptionEmissions();
      
      // Total annual emissions
      const totalEmissions = transportationEmissions +
                           energyEmissions +
                           wasteEmissions +
                           foodEmissions +
                           consumptionEmissions;
      
      // Calculate comparisons and recommendations
      const comparisons = generateComparisons(totalEmissions);
      const recommendations = generateRecommendations({
        transportation: transportationEmissions,
        energy: energyEmissions,
        waste: wasteEmissions,
        food: foodEmissions,
        consumption: consumptionEmissions
      });

      setResults({
        emissions: {
          transportation: transportationEmissions,
          energy: energyEmissions,
          waste: wasteEmissions,
          food: foodEmissions,
          consumption: consumptionEmissions,
          total: totalEmissions
        },
        comparisons,
        recommendations,
        breakdown: {
          transportation: (transportationEmissions / totalEmissions) * 100,
          energy: (energyEmissions / totalEmissions) * 100,
          waste: (wasteEmissions / totalEmissions) * 100,
          food: (foodEmissions / totalEmissions) * 100,
          consumption: (consumptionEmissions / totalEmissions) * 100
        }
      });

    } catch (error) {
      setErrors({ calculation: 'Error calculating carbon footprint' });
    }
  };

  // Individual calculation functions
  const calculateTransportationEmissions = () => {
    const { transportation } = footprintData;
    const factors = EMISSION_FACTORS.transportation;
    
    return (
      transportation.carKmPerYear * factors.car[transportation.carType] +
      transportation.publicTransportKmPerYear * factors.publicTransport +
      transportation.flightsShortHaul * factors.flights.shortHaul +
      transportation.flightsMediumHaul * factors.flights.mediumHaul +
      transportation.flightsLongHaul * factors.flights.longHaul
    );
  };

  const calculateEnergyEmissions = () => {
    const { energy } = footprintData;
    const factors = EMISSION_FACTORS.energy;
    
    const electricityEmissions = energy.electricityKwhPerMonth * 12 * factors.electricity;
    const gasEmissions = energy.gasKwhPerMonth * 12 * factors.gas;
    
    const renewableDiscount = energy.renewablePercentage / 100 * factors.renewableDiscount;
    
    return (electricityEmissions * (1 - renewableDiscount)) + gasEmissions;
  };

  const calculateWasteEmissions = () => {
    const { waste } = footprintData;
    const factors = EMISSION_FACTORS.waste;
    
    const generalWasteEmissions = waste.wastePerWeek * 52 * factors.general;
    const recyclingReduction = generalWasteEmissions * (waste.recyclingPercentage / 100) * factors.recyclingDiscount;
    const compostingReduction = generalWasteEmissions * (waste.compostingPercentage / 100) * factors.compostingDiscount;
    
    return generalWasteEmissions - recyclingReduction - compostingReduction;
  };

  const calculateFoodEmissions = () => {
    const { diet } = footprintData;
    const factors = EMISSION_FACTORS.diet;
    
    const baseEmissions = factors[diet.dietType] * 365; // Annual emissions
    const localFoodReduction = baseEmissions * (diet.localFoodPercentage / 100) * 0.1; // 10% reduction for local food
    const foodWasteIncrease = baseEmissions * (diet.foodWastePercentage / 100);
    
    return baseEmissions - localFoodReduction + foodWasteIncrease;
  };

  const calculateConsumptionEmissions = () => {
    const { consumption } = footprintData;
    const factors = EMISSION_FACTORS.consumption;
    
    const clothingEmissions = consumption.monthlySpending.clothing * 12 * factors.clothingFactor;
    const electronicsEmissions = consumption.monthlySpending.electronics * 12 * factors.electronicsFactor;
    const furnitureEmissions = consumption.monthlySpending.furniture * 12 * factors.furnitureFactor;
    
    return clothingEmissions + electronicsEmissions + furnitureEmissions;
  };

  const generateComparisons = (totalEmissions) => {
    return {
      treesNeeded: Math.ceil(totalEmissions / 21), // One tree absorbs ~21kg CO2 per year
      globalAverage: totalEmissions / 4700, // Global average is ~4.7 tonnes
      countryAverage: totalEmissions / 5800, // Example for UK (~5.8 tonnes)
      carMiles: Math.ceil(totalEmissions / EMISSION_FACTORS.transportation.car.petrol)
    };
  };

  const generateRecommendations = (emissions) => {
    const recommendations = [];
    
    // Transportation recommendations
    if (emissions.transportation > 2000) {
      recommendations.push({
        category: 'transportation',
        text: 'Consider using public transport or switching to an electric vehicle',
        potentialSaving: 1500
      });
    }
    
    // Energy recommendations
    if (emissions.energy > 3000) {
      recommendations.push({
        category: 'energy',
        text: 'Switch to renewable energy sources and improve home insulation',
        potentialSaving: 2000
      });
    }
    
    // Add more category-specific recommendations...
    
    return recommendations;
  };

  return (
    <div className="carbon-footprint-calculator">
      <h2>Carbon Footprint Calculator</h2>
      
      <div className="calculator-controls">
        {/* Transportation Section */}
        <div className="input-sections">
          <div className="input-section">
            <h3>Transportation</h3>
            <div className="input-group">
              <label>Annual Car Travel (km):</label>
              <input
                type="number"
                value={footprintData.transportation.carKmPerYear}
                onChange={(e) => setFootprintData({
                  ...footprintData,
                  transportation: {
                    ...footprintData.transportation,
                    carKmPerYear: parseFloat(e.target.value) || 0
                  }
                })}
              />
            </div>
            <div className="input-group">
              <label>Car Type:</label>
              <select
                value={footprintData.transportation.carType}
                onChange={(e) => setFootprintData({
                  ...footprintData,
                  transportation: {
                    ...footprintData.transportation,
                    carType: e.target.value
                  }
                })}
              >
                <option value="petrol">Petrol</option>
                <option value="diesel">Diesel</option>
                <option value="hybrid">Hybrid</option>
                <option value="electric">Electric</option>
              </select>
            </div>
            <div className="input-group">
              <label>Public Transport (km/year):</label>
              <input
                type="number"
                value={footprintData.transportation.publicTransportKmPerYear}
                onChange={(e) => setFootprintData({
                  ...footprintData,
                  transportation: {
                    ...footprintData.transportation,
                    publicTransportKmPerYear: parseFloat(e.target.value) || 0
                  }
                })}
              />
            </div>
            {/* Additional transportation inputs */}
          </div>

          {/* Energy Section */}
          <div className="input-section">
            <h3>Home Energy</h3>
            <div className="input-group">
              <label>Electricity Usage (kWh/month):</label>
              <input
                type="number"
                value={footprintData.energy.electricityKwhPerMonth}
                onChange={(e) => setFootprintData({
                  ...footprintData,
                  energy: {
                    ...footprintData.energy,
                    electricityKwhPerMonth: parseFloat(e.target.value) || 0
                  }
                })}
              />
            </div>
            <div className="input-group">
              <label>Gas Usage (kWh/month):</label>
              <input
                type="number"
                value={footprintData.energy.gasKwhPerMonth}
                onChange={(e) => setFootprintData({
                  ...footprintData,
                  energy: {
                    ...footprintData.energy,
                    gasKwhPerMonth: parseFloat(e.target.value) || 0
                  }
                })}
              />
            </div>
            <div className="input-group">
              <label>Renewable Energy (%):</label>
              <input
                type="number"
                value={footprintData.energy.renewablePercentage}
                onChange={(e) => setFootprintData({
                  ...footprintData,
                  energy: {
                    ...footprintData.energy,
                    renewablePercentage: parseFloat(e.target.value) || 0
                  }
                })}
              />
            </div>
            <div className="input-group">
              <label>Home Size:</label>
              <select
                value={footprintData.energy.homeSize}
                onChange={(e) => setFootprintData({
                  ...footprintData,
                  energy: {
                    ...footprintData.energy,
                    homeSize: e.target.value
                  }
                })}
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </div>
            <div className="input-group">
              <label>Number of Occupants:</label>
              <input
                type="number"
                value={footprintData.energy.occupants}
                onChange={(e) => setFootprintData({
                  ...footprintData,
                  energy: {
                    ...footprintData.energy,
                    occupants: parseInt(e.target.value) || 1
                  }
                })}
              />
            </div>
          </div>

          {/* Waste Section */}
          <div className="input-section">
            <h3>Waste & Recycling</h3>
            <div className="input-group">
              <label>Waste per Week (kg):</label>
              <input
                type="number"
                value={footprintData.waste.wastePerWeek}
                onChange={(e) => setFootprintData({
                  ...footprintData,
                  waste: {
                    ...footprintData.waste,
                    wastePerWeek: parseFloat(e.target.value) || 0
                  }
                })}
              />
            </div>
            <div className="input-group">
              <label>Recycling (%):</label>
              <input
                type="number"
                value={footprintData.waste.recyclingPercentage}
                onChange={(e) => setFootprintData({
                  ...footprintData,
                  waste: {
                    ...footprintData.waste,
                    recyclingPercentage: parseFloat(e.target.value) || 0
                  }
                })}
              />
            </div>
            <div className="input-group">
              <label>Composting (%):</label>
              <input
                type="number"
                value={footprintData.waste.compostingPercentage}
                onChange={(e) => setFootprintData({
                  ...footprintData,
                  waste: {
                    ...footprintData.waste,
                    compostingPercentage: parseFloat(e.target.value) || 0
                  }
                })}
              />
            </div>
          </div>

          {/* Food Section */}
          <div className="input-section">
            <h3>Food & Diet</h3>
            <div className="input-group">
              <label>Diet Type:</label>
              <select
                value={footprintData.diet.dietType}
                onChange={(e) => setFootprintData({
                  ...footprintData,
                  diet: {
                    ...footprintData.diet,
                    dietType: e.target.value
                  }
                })}
              >
                <option value="vegan">Vegan</option>
                <option value="vegetarian">Vegetarian</option>
                <option value="mixed">Mixed</option>
                <option value="high-meat">High Meat</option>
              </select>
            </div>
            <div className="input-group">
              <label>Local Food (%):</label>
              <input
                type="number"
                value={footprintData.diet.localFoodPercentage}
                onChange={(e) => setFootprintData({
                  ...footprintData,
                  diet: {
                    ...footprintData.diet,
                    localFoodPercentage: parseFloat(e.target.value) || 0
                  }
                })}
              />
            </div>
            <div className="input-group">
              <label>Food Waste (%):</label>
              <input
                type="number"
                value={footprintData.diet.foodWastePercentage}
                onChange={(e) => setFootprintData({
                  ...footprintData,
                  diet: {
                    ...footprintData.diet,
                    foodWastePercentage: parseFloat(e.target.value) || 0
                  }
                })}
              />
            </div>
          </div>

          {/* Consumption Section */}
          <div className="input-section">
            <h3>Consumption</h3>
            <div className="input-group">
              <label>Clothing Spending (per month):</label>
              <input
                type="number"
                value={footprintData.consumption.monthlySpending.clothing}
                onChange={(e) => setFootprintData({
                  ...footprintData,
                  consumption: {
                    ...footprintData.consumption,
                    monthlySpending: {
                      ...footprintData.consumption.monthlySpending,
                      clothing: parseFloat(e.target.value) || 0
                    }
                  }
                })}
              />
            </div>
            <div className="input-group">
              <label>Electronics Spending (per month):</label>
              <input
                type="number"
                value={footprintData.consumption.monthlySpending.electronics}
                onChange={(e) => setFootprintData({
                  ...footprintData,
                  consumption: {
                    ...footprintData.consumption,
                    monthlySpending: {
                      ...footprintData.consumption.monthlySpending,
                      electronics: parseFloat(e.target.value) || 0
                    }
                  }
                })}
              />
            </div>
            <div className="input-group">
              <label>Furniture Spending (per month):</label>
              <input
                type="number"
                value={footprintData.consumption.monthlySpending.furniture}
                onChange={(e) => setFootprintData({
                  ...footprintData,
                  consumption: {
                    ...footprintData.consumption,
                    monthlySpending: {
                      ...footprintData.consumption.monthlySpending,
                      furniture: parseFloat(e.target.value) || 0
                    }
                  }
                })}
              />
            </div>
            <div className="input-group">
              <label>Shopping Habits:</label>
              <select
                value={footprintData.consumption.shoppingHabits}
                onChange={(e) => setFootprintData({
                  ...footprintData,
                  consumption: {
                    ...footprintData.consumption,
                    shoppingHabits: e.target.value
                  }
                })}
              >
                <option value="new">New</option>
                <option value="mixed">Mixed</option>
                <option value="secondhand">Secondhand</option>
              </select>
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
          onClick={calculateFootprint}
        >
          Calculate Footprint
        </button>

        {/* Results Display */}
        {results && (
          <div className="results-section">
            <h3>Your Carbon Footprint</h3>
            
            <div className="results-grid">
              {/* Total Emissions */}
              <div className="result-item total-emissions">
                <h4>Total Annual Emissions</h4>
                <div className="emissions-value">
                  {results.emissions.total.toFixed(1)}
                  <span className="unit">tonnes CO₂e</span>
                </div>
              </div>

              {/* Emissions Breakdown */}
              <div className="result-item breakdown">
                <h4>Emissions Breakdown</h4>
                <div className="breakdown-chart">
                  {Object.entries(results.breakdown).map(([category, percentage]) => (
                    <div key={category} className="breakdown-bar">
                      <div 
                        className={`bar-fill ${category}`}
                        style={{ width: `${percentage}%` }}
                      />
                      <span className="category-label">{category}</span>
                      <span className="percentage">{percentage.toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Comparisons */}
              <div className="result-item comparisons">
                <h4>How You Compare</h4>
                <div className="comparison-grid">
                  <div className="comparison-item">
                    <span className="comparison-label">Trees needed:</span>
                    <span className="comparison-value">
                      {results.comparisons.treesNeeded}
                    </span>
                  </div>
                  {/* Additional comparisons */}
                </div>
              </div>

              {/* Recommendations */}
              <div className="result-item recommendations">
                <h4>Recommendations</h4>
                <div className="recommendations-list">
                  {results.recommendations.map((rec, index) => (
                    <div key={index} className="recommendation">
                      <div className="recommendation-header">
                        <span className="category-tag">{rec.category}</span>
                        <span className="potential-saving">
                          Save up to {rec.potentialSaving} kg CO₂e/year
                        </span>
                      </div>
                      <p>{rec.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CarbonFootprintCalculator;