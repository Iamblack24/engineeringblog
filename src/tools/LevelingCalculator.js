import React, { useState } from 'react';
import './LevelingCalculator.css';

const LevelingCalculator = () => {
  const [levelingData, setLevelingData] = useState({
    stations: [
      {
        id: 1,
        stationName: 'BM1',
        backsight: 0,
        intermediateSight: null,
        foresight: 0,
        knownElevation: 100.000, // Starting benchmark elevation
        remarks: 'Benchmark'
      }
    ],
    method: 'differential', // differential, reciprocal, or trigonometric
    units: 'meters',        // meters or feet
    precision: 0.001,       // desired precision in meters
    closingPoint: {
      knownElevation: null // for closed loops
    }
  });

  const [results, setResults] = useState(null);
  const [errors, setErrors] = useState({});

  const validateInputs = () => {
    const newErrors = {};
    
    // Validate station data
    levelingData.stations.forEach((station, index) => {
      if (station.backsight < 0) {
        newErrors[`bs_${index}`] = `Backsight at station ${station.stationName} cannot be negative`;
      }
      if (station.foresight < 0) {
        newErrors[`fs_${index}`] = `Foresight at station ${station.stationName} cannot be negative`;
      }
      if (station.intermediateSight && station.intermediateSight < 0) {
        newErrors[`is_${index}`] = `Intermediate sight at station ${station.stationName} cannot be negative`;
      }
    });

    // Validate closing benchmark for loops
    if (levelingData.closingPoint.knownElevation) {
      if (isNaN(levelingData.closingPoint.knownElevation)) {
        newErrors.closingPoint = 'Invalid closing benchmark elevation';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateLeveling = () => {
    if (!validateInputs()) return;

    try {
      // Calculate elevations
      const elevations = calculateElevations();
      
      // Calculate misclosure if closed loop
      const misclosure = calculateMisclosure(elevations);
      
      // Adjust elevations if necessary
      const adjustedElevations = adjustElevations(elevations, misclosure);
      
      // Calculate statistics
      const stats = calculateStatistics(adjustedElevations, misclosure);

      setResults({
        stations: adjustedElevations,
        misclosure: misclosure,
        statistics: stats,
        quality: assessQuality(stats)
      });

    } catch (error) {
      setErrors({ calculation: 'Error calculating leveling' });
    }
  };

  const calculateElevations = () => {
    const elevations = [];
    let currentElevation = levelingData.stations[0].knownElevation;
    
    levelingData.stations.forEach((station, index) => {
      if (index === 0) {
        elevations.push({
          ...station,
          elevation: currentElevation,
          heightDifference: 0
        });
        return;
      }

      const heightDifference = station.backsight - station.foresight;
      currentElevation += heightDifference;
      
      elevations.push({
        ...station,
        elevation: currentElevation,
        heightDifference
      });

      // Handle intermediate sights
      if (station.intermediateSight) {
        const intermediateElevation = currentElevation - 
          (station.intermediateSight - station.backsight);
        
        elevations.push({
          id: `${station.id}_IS`,
          stationName: `${station.stationName}_IS`,
          elevation: intermediateElevation,
          heightDifference: intermediateElevation - currentElevation,
          isIntermediate: true
        });
      }
    });

    return elevations;
  };

  const calculateMisclosure = (elevations) => {
    if (!levelingData.closingPoint.knownElevation) return null;

    const finalElevation = elevations[elevations.length - 1].elevation;
    const misclosure = finalElevation - levelingData.closingPoint.knownElevation;
    
    // Calculate length of level run
    const totalDistance = calculateTotalDistance(elevations);
    
    return {
      linear: misclosure,
      perKm: (misclosure * 1000) / totalDistance,
      allowable: calculateAllowableMisclosure(totalDistance)
    };
  };

  const calculateAllowableMisclosure = (distance) => {
    // Standard allowable misclosure (e.g., 12mm√K where K is distance in km)
    return 0.012 * Math.sqrt(distance / 1000);
  };

  const adjustElevations = (elevations, misclosure) => {
    if (!misclosure) return elevations;

    const totalStations = elevations.length - 1; // Excluding the starting benchmark
    const correction = -misclosure.linear / totalStations;
    
    return elevations.map((station, index) => {
      if (index === 0) return station; // Don't adjust the starting benchmark
      
      return {
        ...station,
        originalElevation: station.elevation,
        elevation: station.elevation + (correction * index),
        correction: correction * index
      };
    });
  };

  const calculateStatistics = (adjustedElevations, misclosure) => {
    // Calculate various statistical measures for the leveling run
    const distances = calculateDistances(adjustedElevations);
    const totalDistance = distances.reduce((sum, d) => sum + d, 0);
    
    return {
      'Total Distance': `${totalDistance.toFixed(3)} m`,
      'Number of Stations': adjustedElevations.length,
      'Average Sight Length': `${(totalDistance / (adjustedElevations.length - 1)).toFixed(3)} m`,
      'Misclosure per km': misclosure ? `${(misclosure.linear * 1000 / totalDistance).toFixed(1)} mm/km` : 'N/A',
      'Maximum Sight Length': `${Math.max(...distances).toFixed(3)} m`,
      'Minimum Sight Length': `${Math.min(...distances).toFixed(3)} m`
    };
  };

  const assessQuality = (stats) => {
    // Convert string values to numbers for comparison
    const misclosurePerKm = parseFloat(stats['Misclosure per km']);
    const avgSightLength = parseFloat(stats['Average Sight Length']);
    const maxSightLength = parseFloat(stats['Maximum Sight Length']);
    
    let score = 100;
    let description = 'Excellent';
    let qualityClass = 'excellent';
    
    // Deduct points based on various criteria
    if (misclosurePerKm > 12) {
      score -= 30;
      description = 'Poor';
      qualityClass = 'poor';
    } else if (misclosurePerKm > 8) {
      score -= 20;
      description = 'Fair';
      qualityClass = 'fair';
    } else if (misclosurePerKm > 4) {
      score -= 10;
      description = 'Good';
      qualityClass = 'good';
    }
    
    if (maxSightLength > 80) {
      score -= 15;
      description = description === 'Excellent' ? 'Good' : description;
      qualityClass = qualityClass === 'excellent' ? 'good' : qualityClass;
    }
    
    if (avgSightLength > 60) {
      score -= 10;
      description = description === 'Excellent' ? 'Good' : description;
      qualityClass = qualityClass === 'excellent' ? 'good' : qualityClass;
    }
    
    return {
      score,
      description,
      class: qualityClass
    };
  };

  const calculateTotalDistance = (elevations) => {
    let totalDistance = 0;
    
    for (let i = 1; i < elevations.length; i++) {
      const current = elevations[i];
      
      const distance = Math.sqrt(
        Math.pow(current.heightDifference, 2) + 
        Math.pow(current.backsight + current.foresight, 2)
      );
      
      totalDistance += distance;
    }
    
    return totalDistance;
  };

  const calculateDistances = (elevations) => {
    const distances = [];
    
    for (let i = 1; i < elevations.length; i++) {
      const current = elevations[i];
      
      const distance = Math.sqrt(
        Math.pow(current.heightDifference, 2) + 
        Math.pow(current.backsight + current.foresight, 2)
      );
      
      distances.push(distance);
    }
    
    return distances;
  };

  const addStation = () => {
    const newStation = {
      id: Date.now(),
      stationName: `S${levelingData.stations.length + 1}`,
      backsight: 0,
      foresight: 0,
      intermediateSight: null,
      knownElevation: levelingData.stations.length === 0 ? 100.000 : null
    };
    
    setLevelingData({
      ...levelingData,
      stations: [...levelingData.stations, newStation]
    });
  };

  const removeStation = (index) => {
    if (index === 0) {
      setErrors({ stations: 'Cannot remove the first station' });
      return;
    }
    
    const newStations = [...levelingData.stations];
    newStations.splice(index, 1);
    
    setLevelingData({
      ...levelingData,
      stations: newStations
    });
  };

  return (
    <div className="leveling-calculator">
      <h2>Leveling Calculator</h2>
      
      <div className="calculator-controls">
        {/* Display errors if any */}
        {Object.keys(errors).length > 0 && (
          <div className="error-messages">
            {Object.entries(errors).map(([key, message]) => (
              <div key={key} className="error-message">
                {message}
              </div>
            ))}
          </div>
        )}
        
        <div className="input-sections">
          {/* Method Selection */}
          <div className="input-section">
            <h3>Leveling Method</h3>
            <div className="input-group">
              <label>Method:</label>
              <select
                value={levelingData.method}
                onChange={(e) => setLevelingData({
                  ...levelingData,
                  method: e.target.value
                })}
              >
                <option value="differential">Differential Leveling</option>
                <option value="reciprocal">Reciprocal Leveling</option>
                <option value="trigonometric">Trigonometric Leveling</option>
              </select>
            </div>
            {/* Additional method settings */}
          </div>

          {/* Station Data */}
          <div className="input-section stations-section">
            <h3>Station Data</h3>
            <div className="stations-grid">
              {levelingData.stations.map((station, index) => (
                <div key={station.id} className="station-inputs">
                  <div className="station-header">
                    <span>Station {station.stationName}</span>
                    {index > 0 && (
                      <button 
                        className="remove-station"
                        onClick={() => removeStation(index)}
                      >
                        ×
                      </button>
                    )}
                  </div>
                  {/* Station input fields */}
                </div>
              ))}
            </div>
            <button 
              className="add-station"
              onClick={addStation}
            >
              Add Station
            </button>
          </div>

          {/* Closing Benchmark */}
          <div className="input-section">
            <h3>Closing Benchmark</h3>
            <div className="input-group">
              <label>Known Elevation:</label>
              <input
                type="number"
                step="0.001"
                value={levelingData.closingPoint.knownElevation || ''}
                onChange={(e) => setLevelingData({
                  ...levelingData,
                  closingPoint: {
                    knownElevation: parseFloat(e.target.value)
                  }
                })}
              />
            </div>
          </div>
        </div>

        <button 
          className="calculate-button"
          onClick={calculateLeveling}
        >
          Calculate Leveling
        </button>

        {/* Results Display */}
        {results && (
          <div className="results-section">
            <h3>Leveling Results</h3>
            
            <div className="results-grid">
              {/* Elevation Table */}
              <div className="result-item">
                <h4>Elevations</h4>
                <div className="elevation-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Station</th>
                        <th>BS</th>
                        <th>IS</th>
                        <th>FS</th>
                        <th>HI</th>
                        <th>Elevation</th>
                        {results.misclosure && <th>Correction</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {results.stations.map((station) => (
                        <tr 
                          key={station.id}
                          className={station.isIntermediate ? 'intermediate' : ''}
                        >
                          <td>{station.stationName}</td>
                          <td>{station.backsight?.toFixed(3) || '-'}</td>
                          <td>{station.intermediateSight?.toFixed(3) || '-'}</td>
                          <td>{station.foresight?.toFixed(3) || '-'}</td>
                          <td>{(station.elevation + (station.backsight || 0)).toFixed(3)}</td>
                          <td>{station.elevation.toFixed(3)}</td>
                          {results.misclosure && 
                            <td>{(station.correction || 0).toFixed(3)}</td>
                          }
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Misclosure Information */}
              {results.misclosure && (
                <div className="result-item">
                  <h4>Misclosure Analysis</h4>
                  <div className="misclosure-metrics">
                    <div className="metric">
                      <span className="metric-label">Linear Misclosure:</span>
                      <span className="metric-value">
                        {results.misclosure.linear.toFixed(3)} m
                      </span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">Misclosure per km:</span>
                      <span className="metric-value">
                        {results.misclosure.perKm.toFixed(1)} mm/km
                      </span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">Allowable Misclosure:</span>
                      <span className="metric-value">
                        ±{results.misclosure.allowable.toFixed(3)} m
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Quality Assessment */}
              <div className="result-item">
                <h4>Quality Assessment</h4>
                <div className="quality-gauge">
                  <div 
                    className={`gauge-fill ${results.quality.class}`}
                    style={{ width: `${results.quality.score}%` }}
                  />
                  <span className="quality-label">
                    {results.quality.description}
                  </span>
                </div>
                <div className="quality-metrics">
                  {Object.entries(results.statistics).map(([key, value]) => (
                    <div key={key} className="metric">
                      <span className="metric-label">{key}:</span>
                      <span className="metric-value">{value}</span>
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

export default LevelingCalculator;