import React, { useState } from 'react';
import './TrafficAnalysisCalculator.css';

const TrafficAnalysisCalculator = () => {
  const [trafficData, setTrafficData] = useState({
    // Road characteristics
    roadCharacteristics: {
      roadType: 'arterial',          // arterial, collector, local
      numberOfLanes: 2,
      laneWidth: 3.5,                // meters
      shoulderWidth: 1.5,            // meters
      medianPresent: false,
      medianWidth: 0,                // meters
      grade: 0,                      // percentage
      horizontalCurvature: 0,        // degrees
      pavementCondition: 'good',     // good, fair, poor
      terrainType: 'level',          // level, rolling, mountainous
      functionalClass: 'urban',      // urban, suburban, rural
      speedLimit: 60,                // km/h
      parkingPresent: false,
      bikelanesPresent: false,
      sidewalksPresent: false
    },

    // Traffic volumes
    trafficVolumes: {
      peakHourVolume: 0,            // vehicles per hour
      dailyTraffic: 0,              // AADT
      vehicleComposition: {
        passengerCars: 80,          // percentage
        lightTrucks: 10,
        heavyTrucks: 5,
        buses: 3,
        motorcycles: 2
      },
      directionalSplit: 60,         // percentage in peak direction
      peakHourFactor: 0.92,
      growthRate: 2,                // annual growth percentage
      designYear: 20,               // years
      seasonalFactor: 1.0
    },

    // Traffic conditions
    trafficConditions: {
      signalizedIntersections: {
        count: 2,
        averageCycleLength: 90,     // seconds
        greenRatio: 0.45,
        coordination: 'moderate'     // poor, moderate, good
      },
      unsignalizedIntersections: {
        count: 4,
        averageDelay: 15            // seconds
      },
      accessPoints: {
        driveways: 6,
        minorStreets: 3,
        spacing: 200                // meters
      },
      busStops: {
        count: 2,
        averageDwellTime: 30        // seconds
      },
      pedetrianActivity: 'medium',  // low, medium, high
      parkingTurnover: 'low'        // low, medium, high
    },

    // Environmental conditions
    environmentalConditions: {
      weatherCondition: 'dry',      // dry, wet, snow, ice
      lightCondition: 'day',        // day, night, dawn/dusk
      visibility: 'good',           // good, fair, poor
      pavementCondition: 'dry',     // dry, wet, snow, ice
      temperature: 20,              // celsius
      windSpeed: 0,                 // km/h
      precipitation: 0              // mm/h
    },

    // Safety factors
    safetyFactors: {
      accidentHistory: {
        total: 0,
        fatal: 0,
        injury: 0,
        propertyDamage: 0
      },
      sightDistance: 'adequate',    // adequate, restricted
      lightingPresent: true,
      speedEnforcement: 'regular',  // none, occasional, regular
      schoolZone: false,
      constructionZone: false
    },

    // Analysis parameters
    analysisParameters: {
      method: 'hcm2010',           // HCM2010, HCM2016, Custom
      peakPeriod: 60,              // minutes
      timeInterval: 15,            // minutes
      confidenceLevel: 95,         // percentage
      serviceLevel: 'C',           // A through F
      analysisYear: new Date().getFullYear(),
      includePeakSpreadingFactor: true,
      includeSeasonalAdjustment: true,
      includeGrowthFactor: true
    }
  });

  const [results, setResults] = useState(null);
  const [errors, setErrors] = useState({});
  const [isCalculating, setIsCalculating] = useState(false);

  // Constants for calculations
  const CONSTANTS = {
    passengerCarEquivalent: {
      lightTrucks: 1.5,
      heavyTrucks: 2.5,
      buses: 2.0,
      motorcycles: 0.5
    },
    capacityBase: {
      arterial: 1900,    // vehicles per hour per lane
      collector: 1700,
      local: 1500
    },
    adjustmentFactors: {
      laneWidth: {
        '2.5': 0.85,
        '3.0': 0.93,
        '3.3': 0.95,
        '3.5': 1.00,
        '3.7': 1.00,
        '4.0': 1.00
      },
      weather: {
        dry: 1.00,
        wet: 0.95,
        snow: 0.80,
        ice: 0.70
      },
      light: {
        day: 1.00,
        night: 0.90,
        'dawn/dusk': 0.95
      },
      grade: {
        level: 1.00,      // 0-2%
        rolling: 0.95,    // 2-4%
        mountainous: 0.90  // >4%
      }
    }
  };

  const validateInputs = () => {
    const newErrors = {};
    
    // Validate required fields
    if (!trafficData.roadCharacteristics.roadType) {
      newErrors.roadType = 'Road type is required';
    }
    
    // Validate numeric ranges
    if (trafficData.roadCharacteristics.numberOfLanes <= 0) {
      newErrors.lanes = 'Number of lanes must be positive';
    }
    
    // Validate vehicle composition total
    const totalComposition = Object.values(trafficData.trafficVolumes.vehicleComposition)
      .reduce((sum, value) => sum + value, 0);
    if (Math.abs(totalComposition - 100) > 0.1) {
      newErrors.composition = 'Vehicle composition must total 100%';
    }
    
    // Validate peak hour volume
    if (trafficData.trafficVolumes.peakHourVolume < 0) {
      newErrors.peakHourVolume = 'Peak hour volume cannot be negative';
    }
    
    // Validate directional split
    if (trafficData.trafficVolumes.directionalSplit < 0 || 
        trafficData.trafficVolumes.directionalSplit > 100) {
      newErrors.directionalSplit = 'Directional split must be between 0 and 100';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateTrafficAnalysis = async () => {
    if (!validateInputs()) return;

    try {
      setIsCalculating(true);
      setErrors({});

      // Ensure required nested objects exist
      const defaultTrafficData = {
        ...trafficData,
        trafficConditions: {
          signalizedIntersections: {
            count: 0,
            averageCycleLength: 90,
            greenRatio: 0.45,
            coordination: 'moderate'
          },
          unsignalizedIntersections: {
            count: 0,
            averageDelay: 15
          },
          accessPoints: {
            driveways: 0,
            minorStreets: 0,
            spacing: 200
          },
          busStops: {
            count: 0,
            averageDwellTime: 30
          },
          ...trafficData.trafficConditions
        }
      };

      // Use defaultTrafficData for calculations
      const peakDemand = calculatePeakHourDemand(defaultTrafficData);
      if (peakDemand <= 0) {
        throw new Error('Invalid peak hour demand calculated');
      }
      
      const flowRate = calculateAdjustedFlowRate(peakDemand, defaultTrafficData);
      if (flowRate <= 0) {
        throw new Error('Invalid flow rate calculated');
      }
      
      const capacity = calculateCapacity(defaultTrafficData);
      if (capacity <= 0) {
        throw new Error('Invalid capacity calculated');
      }
      
      const volumeToCapacityRatio = flowRate / capacity;
      const los = determineLevelOfService(volumeToCapacityRatio);
      const speed = calculateAverageTravelSpeed(volumeToCapacityRatio);
      const delay = calculateIntersectionDelay(volumeToCapacityRatio);
      const density = calculateDensityFactor(flowRate, speed);
      const queueLength = calculateQueueLength(volumeToCapacityRatio, peakDemand);
      const travelTime = calculateTravelTime(speed, delay);

      // Format results
      const formattedResults = {
        flowRate: parseFloat(flowRate.toFixed(2)),
        capacity: parseFloat(capacity.toFixed(2)),
        volumeToCapacityRatio: parseFloat(volumeToCapacityRatio.toFixed(3)),
        los,
        speed: parseFloat(speed.toFixed(1)),
        delay: parseFloat(delay.toFixed(1)),
        density: parseFloat(density.toFixed(2)),
        queueLength: parseFloat(queueLength.toFixed(1)),
        travelTime: parseFloat(travelTime.toFixed(1))
      };

      // Generate recommendations
      const recommendations = generateRecommendations(formattedResults);

      setResults({
        ...formattedResults,
        recommendations,
        calculatedAt: new Date().toISOString()
      });

    } catch (error) {
      console.error('Calculation error:', error);
      setErrors({ 
        calculation: `Error calculating traffic analysis: ${error.message}` 
      });
    } finally {
      setIsCalculating(false);
    }
  };

  const calculatePeakHourDemand = (trafficData) => {
    const { trafficVolumes } = trafficData;
    let demand = trafficVolumes.peakHourVolume;

    // Apply directional split
    demand *= (trafficVolumes.directionalSplit / 100);

    // Apply peak hour factor
    demand /= trafficVolumes.peakHourFactor;

    return demand;
  };

  const calculateAdjustedFlowRate = (peakDemand, trafficData) => {
    const { trafficVolumes } = trafficData;
    
    // Calculate PCE weighted flow
    let pceTotal = 0;
    Object.entries(trafficVolumes.vehicleComposition).forEach(([vehicle, percentage]) => {
      const pce = CONSTANTS.passengerCarEquivalent[vehicle] || 1.0;
      pceTotal += (percentage / 100) * pce;
    });

    // Adjust flow rate for vehicle composition
    const adjustedFlow = peakDemand * pceTotal;
    
    // Convert to per lane flow rate
    return adjustedFlow / trafficData.roadCharacteristics.numberOfLanes;
  };

  const calculateCapacity = (trafficData) => {
    const { roadCharacteristics, environmentalConditions } = trafficData;
    
    // Get base capacity
    const baseCapacity = CONSTANTS.capacityBase[roadCharacteristics.roadType];
    if (!baseCapacity) {
      throw new Error('Invalid road type');
    }

    // Get adjustment factors
    const laneWidthFactor = CONSTANTS.adjustmentFactors.laneWidth[roadCharacteristics.laneWidth.toString()] || 1.0;
    const weatherFactor = CONSTANTS.adjustmentFactors.weather[environmentalConditions.weatherCondition];
    const lightFactor = CONSTANTS.adjustmentFactors.light[environmentalConditions.lightCondition];
    
    // Calculate grade factor
    let gradeFactor = 1.0;
    if (Math.abs(roadCharacteristics.grade) <= 2) {
      gradeFactor = CONSTANTS.adjustmentFactors.grade.level;
    } else if (Math.abs(roadCharacteristics.grade) <= 4) {
      gradeFactor = CONSTANTS.adjustmentFactors.grade.rolling;
    } else {
      gradeFactor = CONSTANTS.adjustmentFactors.grade.mountainous;
    }

    // Apply all adjustment factors
    return baseCapacity * laneWidthFactor * weatherFactor * lightFactor * gradeFactor;
  };

  const determineLevelOfService = (vc) => {
    if (vc <= 0.60) return 'A';
    if (vc <= 0.70) return 'B';
    if (vc <= 0.80) return 'C';
    if (vc <= 0.90) return 'D';
    if (vc <= 1.00) return 'E';
    return 'F';
  };

  const calculateAverageTravelSpeed = (volumeToCapacityRatio) => {
    const { trafficConditions, roadCharacteristics } = trafficData;
    
    // Safely access nested properties with default values
    const signalizedCount = trafficConditions?.signalizedIntersections?.count || 0;
    const accessSpacing = trafficConditions?.accessPoints?.spacing || 0;
    
    // Basic speed reduction factors
    const intersectionDelay = signalizedCount * 15; // seconds per km
    const accessDelay = accessSpacing / 1000; // seconds per km
    
    // Convert delays to speed reduction
    const totalDelay = intersectionDelay + accessDelay;
    const effectiveSpeed = roadCharacteristics.speedLimit * (1 - (totalDelay / 3600));
    
    return Math.max(effectiveSpeed, 10); // Minimum 10 km/h
  };

  const calculateIntersectionDelay = (volumeToCapacityRatio) => {
    const { trafficConditions, trafficVolumes, roadCharacteristics } = trafficData;
    
    // Safely access nested properties with default values
    const signalizedCount = trafficConditions?.signalizedIntersections?.count || 0;
    const accessSpacing = trafficConditions?.accessPoints?.spacing || 0;
    const numberOfLanes = roadCharacteristics?.numberOfLanes || 1;
    
    // Base delay per intersection (seconds)
    const baseDelay = 35;
    
    // Volume factor
    const volumeFactor = Math.min(1.5, trafficVolumes.peakHourVolume / (numberOfLanes * 600));
    
    // Calculate total delay
    const signalDelay = signalizedCount * baseDelay * volumeFactor;
    const accessDelay = accessSpacing * 10 * volumeFactor; // 10 seconds base delay for unsignalized
    
    return signalDelay + accessDelay;
  };

  const generateRecommendations = (metrics) => {
    const recommendations = [];
    
    // V/C ratio recommendations
    if (metrics.volumeToCapacityRatio > 0.9) {
      recommendations.push({
        text: "Consider capacity improvements - volume approaching capacity",
        priority: "high"
      });
    } else if (metrics.volumeToCapacityRatio > 0.8) {
      recommendations.push({
        text: "Monitor traffic closely - nearing capacity limits",
        priority: "medium"
      });
    }

    // Speed recommendations
    if (metrics.speed < 0.7 * trafficData.roadCharacteristics.speedLimit) {
      recommendations.push({
        text: "Operating speed significantly below design speed - evaluate geometric conditions",
        priority: "medium"
      });
    } else if (metrics.speed < 0.85 * trafficData.roadCharacteristics.speedLimit) {
      recommendations.push({
        text: "Speed slightly below design speed - consider minor adjustments",
        priority: "low"
      });
    }

    // Delay recommendations
    if (metrics.delay > 80) {
      recommendations.push({
        text: "High intersection delays - consider signal timing optimization",
        priority: "high"
      });
    } else if (metrics.delay > 60) {
      recommendations.push({
        text: "Moderate delays - evaluate intersection performance",
        priority: "medium"
      });
    }

    // Density recommendations
    if (metrics.density > 35) {
      recommendations.push({
        text: "High traffic density - evaluate lane configuration",
        priority: "medium"
      });
    } else if (metrics.density > 25) {
      recommendations.push({
        text: "Moderate density - consider future expansion",
        priority: "low"
      });
    }

    // Queue length recommendations
    if (metrics.queueLength > 20) {
      recommendations.push({
        text: "Long queues detected - assess queue management strategies",
        priority: "high"
      });
    } else if (metrics.queueLength > 10) {
      recommendations.push({
        text: "Moderate queues - monitor for potential issues",
        priority: "medium"
      });
    }

    // Travel time recommendations
    if (metrics.travelTime > 1.5 * (3600 / trafficData.roadCharacteristics.speedLimit)) {
      recommendations.push({
        text: "Travel time significantly higher than expected - investigate causes",
        priority: "high"
      });
    } else if (metrics.travelTime > 1.2 * (3600 / trafficData.roadCharacteristics.speedLimit)) {
      recommendations.push({
        text: "Slightly elevated travel time - consider minor improvements",
        priority: "low"
      });
    }

    return recommendations;
  };

  const calculateDensityFactor = (flowRate, speed) => {
    // Density = flow rate / speed (vehicles per kilometer)
    return flowRate / Math.max(speed, 10); // Minimum speed of 10 km/h to avoid division by zero
  };

  const calculateQueueLength = (volumeToCapacityRatio, peakHourVolume) => {
    // Basic queue estimation using v/c ratio
    const baseQueueLength = (volumeToCapacityRatio * peakHourVolume) / 4; // vehicles per hour / 4 for 15-min peak
    
    // Apply multiplier based on v/c ratio
    const queueMultiplier = volumeToCapacityRatio > 1 ? 
      Math.pow(volumeToCapacityRatio, 2) : volumeToCapacityRatio;
    
    return baseQueueLength * queueMultiplier;
  };

  const calculateTravelTime = (speed, delay) => {
    // Base travel time per kilometer
    const baseTime = 3600 / speed; // seconds per kilometer
    
    // Add intersection delay
    const totalTime = baseTime + (delay / 1000); // Convert delay to per-kilometer basis
    
    return totalTime;
  };

  const getLOSDescription = (los) => {
    const descriptions = {
      'A': 'Free flow conditions with excellent maneuverability',
      'B': 'Reasonably free flow with slightly restricted maneuverability',
      'C': 'Stable flow with somewhat restricted maneuverability',
      'D': 'Approaching unstable flow with limited maneuverability',
      'E': 'Unstable flow with severely restricted maneuverability',
      'F': 'Forced or breakdown flow with extreme congestion'
    };
    
    return descriptions[los] || 'Unknown level of service';
  };

  // Define the handler functions

  const handleInputChange = (section, field, value) => {
    setTrafficData(prevData => ({
      ...prevData,
      [section]: {
        ...prevData[section],
        [field]: value
      }
    }));
  };

  const handleVehicleComposition = (vehicle, value) => {
    setTrafficData(prevData => ({
      ...prevData,
      trafficVolumes: {
        ...prevData.trafficVolumes,
        vehicleComposition: {
          ...prevData.trafficVolumes.vehicleComposition,
          [vehicle]: value
        }
      }
    }));
  };

  const handleNestedInputChange = (section, subsection, field, value) => {
    setTrafficData(prevData => ({
      ...prevData,
      [section]: {
        ...prevData[section],
        [subsection]: {
          ...prevData[section][subsection],
          [field]: value
        }
      }
    }));
  };

  const handleAccidentHistory = (type, value) => {
    setTrafficData(prevData => ({
      ...prevData,
      safetyFactors: {
        ...prevData.safetyFactors,
        accidentHistory: {
          ...prevData.safetyFactors.accidentHistory,
          [type]: value
        }
      }
    }));
  };

  return (
    <div className="traffic-analysis-calculator">
      <h2>Traffic Analysis Calculator</h2>
      
      <div className="calculator-controls">
        <div className="input-sections">
          {/* Road Characteristics Section */}
          <div className="input-section">
            <h3>Road Characteristics</h3>
            <div className="input-group">
              <label>Road Type:</label>
              <select
                value={trafficData.roadCharacteristics.roadType}
                onChange={(e) => handleInputChange('roadCharacteristics', 'roadType', e.target.value)}
              >
                <option value="arterial">Arterial</option>
                <option value="collector">Collector</option>
                <option value="local">Local</option>
              </select>
            </div>

            <div className="input-group">
              <label>Number of Lanes:</label>
              <input
                type="number"
                min="1"
                value={trafficData.roadCharacteristics.numberOfLanes}
                onChange={(e) => handleInputChange('roadCharacteristics', 'numberOfLanes', parseInt(e.target.value))}
              />
            </div>

            <div className="input-group">
              <label>Lane Width (m):</label>
              <input
                type="number"
                step="0.1"
                value={trafficData.roadCharacteristics.laneWidth}
                onChange={(e) => handleInputChange('roadCharacteristics', 'laneWidth', parseFloat(e.target.value))}
              />
            </div>

            <div className="input-group">
              <label>Median Present:</label>
              <input
                type="checkbox"
                checked={trafficData.roadCharacteristics.medianPresent}
                onChange={(e) => handleInputChange('roadCharacteristics', 'medianPresent', e.target.checked)}
              />
            </div>

            {trafficData.roadCharacteristics.medianPresent && (
              <div className="input-group">
                <label>Median Width (m):</label>
                <input
                  type="number"
                  step="0.1"
                  value={trafficData.roadCharacteristics.medianWidth}
                  onChange={(e) => handleInputChange('roadCharacteristics', 'medianWidth', parseFloat(e.target.value))}
                />
              </div>
            )}

            <div className="input-group">
              <label>Grade (%):</label>
              <input
                type="number"
                step="0.1"
                value={trafficData.roadCharacteristics.grade}
                onChange={(e) => handleInputChange('roadCharacteristics', 'grade', parseFloat(e.target.value))}
              />
            </div>

            {/* Additional road characteristics inputs */}
          </div>

          {/* Traffic Volumes Section */}
          <div className="input-section">
            <h3>Traffic Volumes</h3>
            <div className="input-group">
              <label>Peak Hour Volume (veh/h):</label>
              <input
                type="number"
                value={trafficData.trafficVolumes.peakHourVolume}
                onChange={(e) => handleInputChange('trafficVolumes', 'peakHourVolume', parseInt(e.target.value))}
              />
            </div>

            <div className="input-group">
              <label>Daily Traffic (AADT):</label>
              <input
                type="number"
                value={trafficData.trafficVolumes.dailyTraffic}
                onChange={(e) => handleInputChange('trafficVolumes', 'dailyTraffic', parseInt(e.target.value))}
              />
            </div>

            <h4>Vehicle Composition (%)</h4>
            <div className="composition-inputs">
              {Object.entries(trafficData.trafficVolumes.vehicleComposition).map(([vehicle, percentage]) => (
                <div key={vehicle} className="input-group">
                  <label>{vehicle.replace(/([A-Z])/g, ' $1').toLowerCase()}:</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={percentage}
                    onChange={(e) => handleVehicleComposition(vehicle, parseFloat(e.target.value))}
                  />
                </div>
              ))}
            </div>

            {/* Additional traffic volume inputs */}
          </div>

          {/* Traffic Conditions Section */}
          <div className="input-section">
            <h3>Traffic Conditions</h3>
            <div className="subsection">
              <h4>Signalized Intersections</h4>
              <div className="input-group">
                <label>Count:</label>
                <input
                  type="number"
                  value={trafficData.trafficConditions.signalizedIntersections.count}
                  onChange={(e) => handleNestedInputChange('trafficConditions', 'signalizedIntersections', 'count', parseInt(e.target.value))}
                />
              </div>
              {/* Additional signalized intersection inputs */}
            </div>

            {/* Additional traffic condition inputs */}
          </div>

          {/* Environmental Conditions Section */}
          <div className="input-section">
            <h3>Environmental Conditions</h3>
            <div className="input-group">
              <label>Weather Condition:</label>
              <select
                value={trafficData.environmentalConditions.weatherCondition}
                onChange={(e) => handleInputChange('environmentalConditions', 'weatherCondition', e.target.value)}
              >
                <option value="dry">Dry</option>
                <option value="wet">Wet</option>
                <option value="snow">Snow</option>
                <option value="ice">Ice</option>
              </select>
            </div>
            {/* Additional environmental condition inputs */}
          </div>

          {/* Safety Factors Section */}
          <div className="input-section">
            <h3>Safety Factors</h3>
            <div className="subsection">
              <h4>Accident History</h4>
              {Object.entries(trafficData.safetyFactors.accidentHistory).map(([type, count]) => (
                <div key={type} className="input-group">
                  <label>{type.replace(/([A-Z])/g, ' $1').toLowerCase()}:</label>
                  <input
                    type="number"
                    min="0"
                    value={count}
                    onChange={(e) => handleAccidentHistory(type, parseInt(e.target.value))}
                  />
                </div>
              ))}
            </div>
            {/* Additional safety factor inputs */}
          </div>

          {/* Analysis Parameters Section */}
          <div className="input-section">
            <h3>Analysis Parameters</h3>
            <div className="input-group">
              <label>Analysis Method:</label>
              <select
                value={trafficData.analysisParameters.method}
                onChange={(e) => handleInputChange('analysisParameters', 'method', e.target.value)}
              >
                <option value="hcm2010">HCM 2010</option>
                <option value="hcm2016">HCM 2016</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            {/* Additional analysis parameter inputs */}
          </div>
        </div>

        {/* Error Display */}
        {Object.keys(errors).length > 0 && (
          <div className="error-messages">
            {Object.values(errors).map((error, index) => (
              <div key={index} className="error-message">{error}</div>
            ))}
          </div>
        )}

        <button 
          className="analyze-button"
          onClick={calculateTrafficAnalysis}
          disabled={isCalculating}
        >
          {isCalculating ? 'Calculating...' : 'Analyze Traffic'}
        </button>

        {/* Results Display */}
        {results && (
          <div className="results-section">
            <h3>Traffic Analysis Results</h3>
            
            <div className="results-grid">
              {/* Level of Service */}
              <div className="result-item los-display">
                <h4>Level of Service (LOS)</h4>
                <div className={`los-badge los-${results.los.toLowerCase()}`}>
                  {results.los}
                </div>
                <div className="los-description">
                  {getLOSDescription(results.los)}
                </div>
              </div>

              {/* Key Metrics */}
              <div className="result-item">
                <h4>Key Metrics</h4>
                <div className="metric-grid">
                  <div className="metric">
                    <span className="metric-label">V/C Ratio:</span>
                    <span className="metric-value">
                      {results.volumeToCapacityRatio.toFixed(2)}
                    </span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Average Speed:</span>
                    <span className="metric-value">
                      {results.speed.toFixed(1)} km/h
                    </span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Total Delay:</span>
                    <span className="metric-value">
                      {results.delay.toFixed(1)} sec/veh
                    </span>
                  </div>
                </div>
              </div>

              {/* Capacity Analysis */}
              <div className="result-item">
                <h4>Capacity Analysis</h4>
                <div className="capacity-chart">
                  <div className="capacity-bar">
                    <div 
                      className="usage-fill"
                      style={{ width: `${(results.flowRate / results.capacity) * 100}%` }}
                    />
                  </div>
                  <div className="capacity-labels">
                    <span>Flow Rate: {results.flowRate.toFixed(0)} veh/h</span>
                    <span>Capacity: {results.capacity.toFixed(0)} veh/h</span>
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              <div className="result-item recommendations">
                <h4>Recommendations</h4>
                <ul className="recommendations-list">
                  {results.recommendations.map((rec, index) => (
                    <li key={index} className={`priority-${rec.priority}`}>
                      {rec.text}
                    </li>
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

export default TrafficAnalysisCalculator;