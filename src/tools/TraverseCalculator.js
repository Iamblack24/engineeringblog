import React, { useState } from 'react';
import './TraverseCalculator.css';

const TraverseCalculator = () => {
  const [traverseData, setTraverseData] = useState({
    stations: [
      {
        id: 1,
        stationName: 'A',
        northing: 1000.000,
        easting: 1000.000,
        angle: 0,         // degrees
        distance: 0,      // meters
        bearing: 0        // degrees
      }
    ],
    closingPoint: {
      northing: 0,
      easting: 0
    },
    traverseType: 'closed', // closed or open
    angleUnit: 'degrees',   // degrees or radians
    distanceUnit: 'meters', // meters or feet
    bearingFormat: 'decimal' // decimal or dms
  });

  const [results, setResults] = useState(null);
  const [errors, setErrors] = useState({});

  // Constants for calculations
  const CONSTANTS = {
    radiansToGrades: 63.662,
    gradesToRadians: 0.015708,
    degreesToRadians: 0.017453,
    radiansToDegrees: 57.296
  };

  const validateInputs = () => {
    const newErrors = {};
    
    // Validate station data
    traverseData.stations.forEach((station, index) => {
      if (station.distance < 0) {
        newErrors[`distance_${index}`] = `Distance at station ${station.stationName} must be positive`;
      }
      if (station.angle < 0 || station.angle >= 360) {
        newErrors[`angle_${index}`] = `Angle at station ${station.stationName} must be between 0 and 360 degrees`;
      }
    });

    // Validate closing point for closed traverse
    if (traverseData.traverseType === 'closed') {
      if (!traverseData.closingPoint.northing || !traverseData.closingPoint.easting) {
        newErrors.closingPoint = 'Closing point coordinates required for closed traverse';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateTraverse = () => {
    if (!validateInputs()) return;

    try {
      // Calculate bearings and coordinates
      const coordinates = calculateCoordinates();
      
      // Calculate traverse closure
      const closure = calculateClosure(coordinates);
      
      // Calculate angular error
      const angularError = calculateAngularError();
      
      // Adjust coordinates if necessary
      const adjustedCoordinates = adjustCoordinates(coordinates, closure);
      
      // Calculate area if closed traverse
      const area = traverseData.traverseType === 'closed' ? 
        calculateArea(adjustedCoordinates) : null;

      setResults({
        stations: adjustedCoordinates,
        closure: {
          linear: closure.linear,
          relative: closure.relative,
          angular: angularError
        },
        area: area,
        precision: calculatePrecision(closure.linear, coordinates),
        adjustments: closure.adjustments
      });

    } catch (error) {
      setErrors({ calculation: 'Error calculating traverse' });
    }
  };

  const calculateCoordinates = () => {
    const coordinates = [];
    let currentNorthing = traverseData.stations[0].northing;
    let currentEasting = traverseData.stations[0].easting;
    
    traverseData.stations.forEach((station, index) => {
      if (index === 0) {
        coordinates.push({
          ...station,
          adjustedNorthing: currentNorthing,
          adjustedEasting: currentEasting
        });
        return;
      }

      const bearing = calculateBearing(station.angle);
      const departure = station.distance * Math.sin(bearing * CONSTANTS.degreesToRadians);
      const latitude = station.distance * Math.cos(bearing * CONSTANTS.degreesToRadians);
      
      currentNorthing += latitude;
      currentEasting += departure;
      
      coordinates.push({
        ...station,
        bearing,
        departure,
        latitude,
        adjustedNorthing: currentNorthing,
        adjustedEasting: currentEasting
      });
    });

    return coordinates;
  };

  const calculateClosure = (coordinates) => {
    if (traverseData.traverseType !== 'closed') {
      return { linear: 0, relative: 0, adjustments: [] };
    }

    const lastPoint = coordinates[coordinates.length - 1];
    const closingPoint = traverseData.closingPoint;
    
    const northingError = closingPoint.northing - lastPoint.adjustedNorthing;
    const eastingError = closingPoint.easting - lastPoint.adjustedEasting;
    
    const linearClosure = Math.sqrt(
      Math.pow(northingError, 2) + Math.pow(eastingError, 2)
    );
    
    const totalDistance = coordinates.reduce(
      (sum, station) => sum + station.distance, 0
    );
    
    const relativeClosure = 1 / (totalDistance / linearClosure);

    return {
      linear: linearClosure,
      relative: relativeClosure,
      adjustments: calculateAdjustments(coordinates, northingError, eastingError)
    };
  };

  const calculateAngularError = () => {
    if (traverseData.traverseType !== 'closed') return 0;
    
    const totalAngles = traverseData.stations.reduce(
      (sum, station) => sum + station.angle, 0
    );
    
    const expectedSum = (traverseData.stations.length - 2) * 180;
    return totalAngles - expectedSum;
  };

  const adjustCoordinates = (coordinates, closure) => {
    const totalDistance = coordinates.reduce((sum, station) => sum + (station.distance || 0), 0);
    
    return coordinates.map(station => {
      if (!station.distance) return station;
      
      const proportion = station.distance / totalDistance;
      return {
        ...station,
        adjustedNorthing: station.adjustedNorthing + (closure.northingError * proportion),
        adjustedEasting: station.adjustedEasting + (closure.eastingError * proportion)
      };
    });
  };

  const calculateArea = (coordinates) => {
    let area = 0;
    
    for (let i = 0; i < coordinates.length; i++) {
      const j = (i + 1) % coordinates.length;
      area += coordinates[i].adjustedNorthing * coordinates[j].adjustedEasting - 
              coordinates[j].adjustedNorthing * coordinates[i].adjustedEasting;
    }
    
    return Math.abs(area) / 2;
  };

  const calculatePrecision = (linearClosure, coordinates) => {
    const totalDistance = coordinates.reduce(
      (sum, station) => sum + (station.distance || 0), 0
    );
    return totalDistance / linearClosure;
  };

  const calculateBearing = (angle) => {
    // Convert internal angle to bearing
    let bearing = angle;
    while (bearing >= 360) bearing -= 360;
    while (bearing < 0) bearing += 360;
    return bearing;
  };

  const calculateAdjustments = (coordinates, northingError, eastingError) => {
    const totalDistance = coordinates.reduce(
      (sum, station) => sum + (station.distance || 0), 0
    );
    
    return coordinates.map(station => {
      if (!station.distance) return { northing: 0, easting: 0 };
      
      const proportion = station.distance / totalDistance;
      return {
        northing: northingError * proportion,
        easting: eastingError * proportion
      };
    });
  };

  const addStation = () => {
    const newStation = {
      id: Date.now(),
      stationName: `S${traverseData.stations.length + 1}`,
      northing: 0,
      easting: 0,
      angle: 0,
      distance: 0,
      bearing: 0
    };
    
    setTraverseData({
      ...traverseData,
      stations: [...traverseData.stations, newStation]
    });
  };

  const removeStation = (index) => {
    const newStations = [...traverseData.stations];
    newStations.splice(index, 1);
    
    setTraverseData({
      ...traverseData,
      stations: newStations
    });
  };

  const formatBearing = (bearing) => {
    if (!bearing && bearing !== 0) return '-';
    
    // Format as degrees, minutes, seconds if using DMS format
    if (traverseData.bearingFormat === 'dms') {
      const degrees = Math.floor(bearing);
      const minutes = Math.floor((bearing - degrees) * 60);
      const seconds = Math.round(((bearing - degrees) * 60 - minutes) * 60);
      return `${degrees}° ${minutes}' ${seconds}"`;
    }
    
    // Format as decimal degrees
    return `${bearing.toFixed(4)}°`;
  };

  const getPrecisionClass = (precision) => {
    if (precision >= 10000) return 'excellent';
    if (precision >= 5000) return 'good';
    if (precision >= 1000) return 'fair';
    return 'poor';
  };

  const getPrecisionPercentage = (precision) => {
    // Convert precision ratio to percentage for gauge display
    const maxPrecision = 10000; // 1:10000 is considered excellent
    const percentage = (precision / maxPrecision) * 100;
    return Math.min(percentage, 100); // Cap at 100%
  };

  const formatPrecision = (precision) => {
    if (!precision) return 'N/A';
    
    // Format as ratio (e.g., "1:5000")
    const ratio = Math.round(precision);
    return `1:${ratio}`;
  };

  return (
    <div className="traverse-calculator">
      <h2>Traverse Calculator</h2>
      
      <div className="calculator-controls">
        <div className="input-sections">
          {/* Traverse Settings */}
          <div className="input-section">
            <h3>Traverse Settings</h3>
            <div className="input-group">
              <label>Traverse Type:</label>
              <select
                value={traverseData.traverseType}
                onChange={(e) => setTraverseData({
                  ...traverseData,
                  traverseType: e.target.value
                })}
              >
                <option value="closed">Closed Traverse</option>
                <option value="open">Open Traverse</option>
              </select>
            </div>
            {/* Additional settings inputs */}
          </div>

          {/* Station Data */}
          <div className="input-section stations-section">
            <h3>Station Data</h3>
            <div className="stations-grid">
              {traverseData.stations.map((station, index) => (
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

          {/* Closing Point (for closed traverse) */}
          {traverseData.traverseType === 'closed' && (
            <div className="input-section">
              <h3>Closing Point</h3>
              {/* Closing point inputs */}
            </div>
          )}
        </div>

        <button 
          className="calculate-button"
          onClick={calculateTraverse}
        >
          Calculate Traverse
        </button>

        {/* Results Display */}
        {results && (
          <div className="results-section">
            <h3>Traverse Results</h3>
            
            <div className="results-grid">
              {/* Traverse Diagram */}
              <div className="result-item">
                <h4>Traverse Diagram</h4>
                <div className="traverse-diagram">
                  {/* SVG visualization of traverse */}
                </div>
              </div>

              {/* Coordinate Table */}
              <div className="result-item">
                <h4>Adjusted Coordinates</h4>
                <div className="coordinate-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Station</th>
                        <th>Northing</th>
                        <th>Easting</th>
                        <th>Bearing</th>
                        <th>Distance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.stations.map((station) => (
                        <tr key={station.id}>
                          <td>{station.stationName}</td>
                          <td>{station.adjustedNorthing.toFixed(3)}</td>
                          <td>{station.adjustedEasting.toFixed(3)}</td>
                          <td>{formatBearing(station.bearing)}</td>
                          <td>{station.distance.toFixed(3)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Closure Information */}
              <div className="result-item">
                <h4>Closure Information</h4>
                <div className="closure-metrics">
                  <div className="metric">
                    <span className="metric-label">Linear Closure:</span>
                    <span className="metric-value">
                      {results.closure.linear.toFixed(3)} m
                    </span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Relative Closure:</span>
                    <span className="metric-value">
                      1:{Math.abs(results.closure.relative).toFixed(0)}
                    </span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Angular Error:</span>
                    <span className="metric-value">
                      {results.closure.angular.toFixed(2)}°
                    </span>
                  </div>
                </div>
              </div>

              {/* Area Calculation (for closed traverse) */}
              {results.area && (
                <div className="result-item">
                  <h4>Area Calculation</h4>
                  <div className="area-metric">
                    <span className="area-value">
                      {results.area.toFixed(2)} m²
                    </span>
                    <span className="area-hectares">
                      ({(results.area / 10000).toFixed(4)} hectares)
                    </span>
                  </div>
                </div>
              )}

              {/* Precision Analysis */}
              <div className="result-item">
                <h4>Precision Analysis</h4>
                <div className="precision-gauge">
                  <div 
                    className={`gauge-fill ${getPrecisionClass(results.precision)}`}
                    style={{ width: `${getPrecisionPercentage(results.precision)}%` }}
                  />
                  <span className="precision-label">
                    {formatPrecision(results.precision)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {Object.keys(errors).length > 0 && (
          <div className="errors-section">
            {Object.values(errors).map((error, index) => (
              <div key={index} className="error-message">
                {error}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TraverseCalculator;