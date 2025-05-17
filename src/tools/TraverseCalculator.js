import React, { useState, useEffect } from 'react';
import './TraverseCalculator.css';

const TraverseCalculator = () => {
  const [traverseData, setTraverseData] = useState({
    startPoint: { stationName: 'A', northing: 1000.000, easting: 1000.000 },
    initialBearing: 0.000,
    courses: [
      { id: 1, fromStationName: 'A', toStationName: 'B', angle: 90.0, distance: 100.000 },
      { id: 2, fromStationName: 'B', toStationName: 'C', angle: 270.0, distance: 150.000 },
      { id: 3, fromStationName: 'C', toStationName: 'A', angle: 270.0, distance: 120.000 },
    ],
    closingPoint: { stationName: 'A', northing: 1000.000, easting: 1000.000 },
    traverseType: 'closedLoop',
    angleConvention: 'anglesRight', // 'anglesRight' or 'interiorAngles'
    angleUnit: 'degrees',
    distanceUnit: 'meters',
    bearingFormat: 'decimal',
    adjustmentRule: 'bowditch',
  });

  const [results, setResults] = useState(null);
  const [errors, setErrors] = useState({});

  const CONSTANTS = {
    degreesToRadians: Math.PI / 180,
    radiansToDegrees: 180 / Math.PI,
  };

  useEffect(() => {
    if (traverseData.traverseType === 'closedLoop') {
      setTraverseData(prev => ({
        ...prev,
        closingPoint: {
          stationName: prev.startPoint.stationName,
          northing: prev.startPoint.northing,
          easting: prev.startPoint.easting,
        }
      }));
    }
  }, [traverseData.startPoint, traverseData.traverseType]);

  const handleInputChange = (e, path, index, field) => {
    const { value, type } = e.target;
    const parsedValue = type === 'number' && value !== '' ? parseFloat(value) : value;

    setTraverseData(prev => {
      const newData = JSON.parse(JSON.stringify(prev));
      if (path === 'startPoint') {
        newData.startPoint[field] = parsedValue;
      } else if (path === 'courses' && index !== undefined) {
        newData.courses[index][field] = parsedValue;
      } else if (path === 'closingPoint') {
        newData.closingPoint[field] = parsedValue;
      } else {
        newData[field] = parsedValue;
      }
      return newData;
    });
  };

  const validateInputs = () => {
    const newErrors = {};
    if (traverseData.courses.length === 0) {
      newErrors.courses = "At least one course is required.";
    }
    traverseData.courses.forEach((course, index) => {
      if (isNaN(course.angle) || course.angle < 0 || course.angle >= 360) {
        newErrors[`course_angle_${index}`] = `Angle for course ${index + 1} must be 0-360.`;
      }
      if (isNaN(course.distance) || course.distance <= 0) {
        newErrors[`course_distance_${index}`] = `Distance for course ${index + 1} must be positive.`;
      }
    });
    if (isNaN(traverseData.initialBearing) || traverseData.initialBearing < 0 || traverseData.initialBearing >= 360) {
      newErrors.initialBearing = "Initial bearing must be 0-360.";
    }
    if (isNaN(traverseData.startPoint.northing) || isNaN(traverseData.startPoint.easting)) {
      newErrors.startPoint = "Start point coordinates must be numbers.";
    }
    if (traverseData.traverseType !== 'open' && (isNaN(traverseData.closingPoint.northing) || isNaN(traverseData.closingPoint.easting))) {
      newErrors.closingPoint = "Closing point coordinates must be numbers for closed traverses.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const normalizeAngle = (angle) => {
    let normalized = angle % 360;
    if (normalized < 0) normalized += 360;
    return normalized;
  };

  const calculateTraverse = () => {
    if (!validateInputs()) {
      setResults(null);
      return;
    }
    setErrors({});

    const N = traverseData.courses.length;
    if (N === 0) return;

    let currentBearing = traverseData.initialBearing;
    let workingAngles = traverseData.courses.map(c => c.angle);
    let angularMisclosure = 0;
    let angleCorrectionPerStation = 0;

    if ((traverseData.traverseType === 'closedLoop' || traverseData.traverseType === 'closedLink') && N > 1) {
      const sumObservedAngles = traverseData.courses.reduce((sum, course) => sum + course.angle, 0);
      let expectedSumAngles;

      if (traverseData.angleConvention === 'anglesRight') {
        // For angles to the right in a closed loop, sum should be (N±2)*180
        // Determine if (N-2)*180 or (N+2)*180 is closer to sumObservedAngles
        const targetSumNMinus2 = (N - 2) * 180;
        const targetSumNPlus2 = (N + 2) * 180;
        if (Math.abs(sumObservedAngles - targetSumNMinus2) < Math.abs(sumObservedAngles - targetSumNPlus2)) {
          expectedSumAngles = targetSumNMinus2;
        } else {
          expectedSumAngles = targetSumNPlus2;
        }
      } else if (traverseData.angleConvention === 'interiorAngles') {
         expectedSumAngles = (N - 2) * 180; // Standard for interior angles of a polygon
      } else {
        expectedSumAngles = sumObservedAngles; // No adjustment if convention is unknown/not applicable
      }
      
      // This angular adjustment is primarily for closedLoop. ClosedLink might need known closing bearing.
      if (traverseData.traverseType === 'closedLoop' && traverseData.angleConvention !== 'none') {
        angularMisclosure = sumObservedAngles - expectedSumAngles;
        angleCorrectionPerStation = (N > 0) ? -angularMisclosure / N : 0;
        workingAngles = traverseData.courses.map(course => normalizeAngle(course.angle + angleCorrectionPerStation));
      }
    }

    let totalDistance = 0;
    let sumLatitudes = 0;
    let sumDepartures = 0;
    
    let legData = traverseData.courses.map((course, index) => {
      const bearingRad = currentBearing * CONSTANTS.degreesToRadians;
      const latitude = course.distance * Math.cos(bearingRad);
      const departure = course.distance * Math.sin(bearingRad);

      sumLatitudes += latitude;
      sumDepartures += departure;
      totalDistance += course.distance;

      const leg = {
        ...course,
        originalAngle: course.angle, // Store original angle
        adjustedAngle: workingAngles[index], // Use adjusted or original
        bearing: currentBearing,
        latitude,
        departure,
      };

      if (index < N - 1) {
        currentBearing = normalizeAngle(currentBearing + 180 + workingAngles[index + 1]);
      } else if (N > 0 && traverseData.traverseType === 'closedLoop' && N > 1) {
        // For the last leg in a closed loop, the next angle to "turn" would be at the start point
        // using the first angle in the `workingAngles` array to check closure.
        // currentBearing is bearing of last leg. Next bearing would be back to start.
        // This is implicitly handled by linear misclosure check.
      }
      return leg;
    });

    let misclosureN = 0;
    let misclosureE = 0;
    let linearMisclosure = 0;
    let relativePrecision = Infinity;

    if (traverseData.traverseType === 'closedLoop' || traverseData.traverseType === 'closedLink') {
      const finalCalcNorthing = traverseData.startPoint.northing + sumLatitudes;
      const finalCalcEasting = traverseData.startPoint.easting + sumDepartures;
      misclosureN = traverseData.closingPoint.northing - finalCalcNorthing;
      misclosureE = traverseData.closingPoint.easting - finalCalcEasting;
      linearMisclosure = Math.sqrt(misclosureN ** 2 + misclosureE ** 2);
      if (totalDistance > 0 && linearMisclosure > 1e-9) { // Avoid division by zero or near-zero
        relativePrecision = totalDistance / linearMisclosure;
      } else if (linearMisclosure <= 1e-9) {
        relativePrecision = Infinity; // Consider perfect closure
      }
    }

    let adjustedLegData = legData.map(leg => {
      let latCorrection = 0;
      let depCorrection = 0;
      if ((traverseData.traverseType === 'closedLoop' || traverseData.traverseType === 'closedLink') && totalDistance > 0 && linearMisclosure > 1e-9) {
        if (traverseData.adjustmentRule === 'bowditch') {
          latCorrection = misclosureN * (leg.distance / totalDistance);
          depCorrection = misclosureE * (leg.distance / totalDistance);
        } else if (traverseData.adjustmentRule === 'transit') {
          const sumAbsLat = legData.reduce((sum, l) => sum + Math.abs(l.latitude), 0);
          const sumAbsDep = legData.reduce((sum, l) => sum + Math.abs(l.departure), 0);
          if (sumAbsLat > 1e-9) latCorrection = misclosureN * (Math.abs(leg.latitude) / sumAbsLat);
          if (sumAbsDep > 1e-9) depCorrection = misclosureE * (Math.abs(leg.departure) / sumAbsDep);
        }
      }
      return {
        ...leg,
        latCorrection,
        depCorrection,
        adjustedLatitude: leg.latitude + latCorrection,
        adjustedDeparture: leg.departure + depCorrection,
      };
    });

    let finalStations = [];
    let currentNorthing = traverseData.startPoint.northing;
    let currentEasting = traverseData.startPoint.easting;

    finalStations.push({
      stationName: traverseData.startPoint.stationName,
      angle: '-',
      distance: '-',
      bearing: '-',
      latitude: '-', departure: '-',
      adjNorthing: currentNorthing.toFixed(3),
      adjEasting: currentEasting.toFixed(3),
    });

    adjustedLegData.forEach((leg) => {
      currentNorthing += leg.adjustedLatitude;
      currentEasting += leg.adjustedDeparture;
      finalStations.push({
        stationName: leg.toStationName,
        angle: leg.originalAngle.toFixed(2), // Show original observed angle
        adjustedAngleDisplay: leg.adjustedAngle.toFixed(4), // Show adjusted angle used
        distance: leg.distance.toFixed(3),
        bearing: leg.bearing.toFixed(4),
        latitude: leg.latitude.toFixed(3),
        departure: leg.departure.toFixed(3),
        latCorrection: leg.latCorrection.toFixed(3),
        depCorrection: leg.depCorrection.toFixed(3),
        adjLatitude: leg.adjustedLatitude.toFixed(3),
        adjDeparture: leg.adjustedDeparture.toFixed(3),
        adjNorthing: currentNorthing.toFixed(3),
        adjEasting: currentEasting.toFixed(3),
      });
    });
    
    let area = 0;
    if ((traverseData.traverseType === 'closedLoop' || traverseData.traverseType === 'closedLink') && finalStations.length > 2) {
        let polygonPoints = finalStations.map(s => ({easting: parseFloat(s.adjEasting), northing: parseFloat(s.adjNorthing)}));
        for (let i = 0; i < polygonPoints.length; i++) {
            const p1 = polygonPoints[i];
            const p2 = polygonPoints[(i + 1) % polygonPoints.length];
            area += (p1.easting * p2.northing - p2.easting * p1.northing);
        }
        area = Math.abs(area) / 2;
    }

    setResults({
      stations: finalStations,
      legs: adjustedLegData,
      closure: {
        misclosureN: misclosureN.toFixed(4),
        misclosureE: misclosureE.toFixed(4),
        linear: linearMisclosure.toFixed(4),
        relative: relativePrecision === Infinity ? 'Perfect' : Math.round(relativePrecision).toString(),
        angular: angularMisclosure.toFixed(4),
        angleCorrectionPerStation: angleCorrectionPerStation.toFixed(5),
        totalDistance: totalDistance.toFixed(3),
      },
      area: area.toFixed(3),
    });
  };

  const addCourse = () => {
    const lastCourse = traverseData.courses[traverseData.courses.length - 1];
    const newFromStation = lastCourse ? lastCourse.toStationName : traverseData.startPoint.stationName;
    // Generate a somewhat unique default name for the next station
    const existingToNames = new Set(traverseData.courses.map(c => c.toStationName));
    let nextCharSuffix = traverseData.courses.length + 1;
    let newToStationName = String.fromCharCode(65 + (traverseData.courses.length % 26)) + (nextCharSuffix > 26 ? Math.floor(nextCharSuffix/26) : '');
    while(existingToNames.has(newToStationName) || newToStationName === newFromStation) {
        nextCharSuffix++;
        newToStationName = String.fromCharCode(65 + (nextCharSuffix % 26)) + (nextCharSuffix > 26 ? Math.floor(nextCharSuffix/26) : '');
    }


    setTraverseData(prev => ({
      ...prev,
      courses: [
        ...prev.courses,
        { id: Date.now(), fromStationName: newFromStation, toStationName: newToStationName, angle: 0, distance: 0 }
      ]
    }));
  };

  const removeCourse = (index) => {
    setTraverseData(prev => ({
      ...prev,
      courses: prev.courses.filter((_, i) => i !== index)
    }));
  };

  const formatBearing = (bearing) => {
    if (bearing === '-' || isNaN(parseFloat(bearing))) return '-';
    const b = parseFloat(bearing);
    if (traverseData.bearingFormat === 'dms') {
      const degrees = Math.floor(b);
      const minutesDecimal = (b - degrees) * 60;
      const minutes = Math.floor(minutesDecimal);
      const seconds = ((minutesDecimal - minutes) * 60).toFixed(1);
      return `${degrees}° ${minutes}' ${seconds}"`;
    }
    return `${b.toFixed(4)}°`;
  };
  
  const getPrecisionClass = (precisionRatioString) => {
    if (precisionRatioString === 'Perfect') return 'excellent';
    const precisionRatio = parseFloat(precisionRatioString);
    if (isNaN(precisionRatio)) return 'poor';
    if (precisionRatio >= 10000) return 'excellent';
    if (precisionRatio >= 5000) return 'good';
    if (precisionRatio >= 1000) return 'fair';
    return 'poor';
  };

  const getPrecisionPercentage = (precisionRatioString) => {
    if (precisionRatioString === 'Perfect') return 100;
    const precisionRatio = parseFloat(precisionRatioString);
    if (isNaN(precisionRatio)) return 0;
    const maxPrecisionForGauge = 15000;
    const percentage = (precisionRatio / maxPrecisionForGauge) * 100;
    return Math.min(Math.max(percentage,0), 100); 
  };

  const formatPrecision = (precisionRatioString) => {
    if (precisionRatioString === 'Perfect' || isNaN(parseFloat(precisionRatioString)) || parseFloat(precisionRatioString) === 0) return 'Perfect or N/A';
    return `1:${Math.round(parseFloat(precisionRatioString))}`;
  };

  return (
    <div className="traverse-calculator">
      <h2>Traverse Calculator</h2>
      
      <div className="calculator-controls">
        <div className="input-sections">
          <div className="input-section">
            <h3>Traverse Settings</h3>
            <div className="input-group">
              <label>Traverse Type:</label>
              <select name="traverseType" value={traverseData.traverseType} onChange={(e) => handleInputChange(e, null, null, 'traverseType')}>
                <option value="closedLoop">Closed Loop (ends on start point)</option>
                <option value="closedLink">Closed Link (ends on known point)</option>
                <option value="open">Open Traverse</option>
              </select>
            </div>
            <div className="input-group">
              <label>Angle Convention:</label>
              <select name="angleConvention" value={traverseData.angleConvention} onChange={(e) => handleInputChange(e, null, null, 'angleConvention')}>
                <option value="anglesRight">Angles to the Right (Field Angles)</option>
                <option value="interiorAngles">Interior Angles (Calculated)</option>
                {/* <option value="none">No Angular Adjustment</option> */}
              </select>
            </div>
            <div className="input-group">
              <label>Adjustment Rule:</label>
              <select name="adjustmentRule" value={traverseData.adjustmentRule} onChange={(e) => handleInputChange(e, null, null, 'adjustmentRule')}
                disabled={traverseData.traverseType === 'open'}>
                <option value="bowditch">Bowditch (Compass)</option>
                <option value="transit">Transit</option>
              </select>
            </div>
             <div className="input-group">
                <label>Bearing Format:</label>
                <select name="bearingFormat" value={traverseData.bearingFormat} onChange={(e) => handleInputChange(e, null, null, 'bearingFormat')}>
                    <option value="decimal">Decimal Degrees</option>
                    <option value="dms">DD° MM' SS.s"</option>
                </select>
            </div>
          </div>

          <div className="input-section">
            <h3>Start Point & Initial Bearing</h3>
            <div className="input-group">
              <label>Start Station Name:</label>
              <input type="text" value={traverseData.startPoint.stationName} onChange={(e) => handleInputChange(e, 'startPoint', null, 'stationName')} />
            </div>
            <div className="input-group">
              <label>Start Northing (N):</label>
              <input type="number" step="any" value={traverseData.startPoint.northing} onChange={(e) => handleInputChange(e, 'startPoint', null, 'northing')} />
            </div>
            <div className="input-group">
              <label>Start Easting (E):</label>
              <input type="number" step="any" value={traverseData.startPoint.easting} onChange={(e) => handleInputChange(e, 'startPoint', null, 'easting')} />
            </div>
            <div className="input-group">
              <label>Initial Bearing of First Leg (°):</label>
              <input type="number" step="any" value={traverseData.initialBearing} onChange={(e) => handleInputChange(e, null, null, 'initialBearing')} />
              {errors.initialBearing && <small className="error-text">{errors.initialBearing}</small>}
            </div>
          </div>

          {(traverseData.traverseType === 'closedLink') && (
            <div className="input-section">
              <h3>Closing Point (Known Coordinates)</h3>
               <div className="input-group">
                <label>Closing Station Name:</label>
                <input type="text" value={traverseData.closingPoint.stationName} onChange={(e) => handleInputChange(e, 'closingPoint', null, 'stationName')} />
              </div>
              <div className="input-group">
                <label>Closing Northing (N):</label>
                <input type="number" step="any" value={traverseData.closingPoint.northing} onChange={(e) => handleInputChange(e, 'closingPoint', null, 'northing')} />
              </div>
              <div className="input-group">
                <label>Closing Easting (E):</label>
                <input type="number" step="any" value={traverseData.closingPoint.easting} onChange={(e) => handleInputChange(e, 'closingPoint', null, 'easting')} />
              </div>
              {errors.closingPoint && <small className="error-text">{errors.closingPoint}</small>}
            </div>
          )}
        </div>

        <div className="input-section stations-section">
          <h3>Courses / Legs</h3>
          <p className="input-hint">Angle is clockwise from backsight to foresight (as per selected convention). Distance is for the leg to 'To Station'.</p>
          {errors.courses && <p className="error-text">{errors.courses}</p>}
          <div className="stations-grid">
            {traverseData.courses.map((course, index) => (
              <div key={course.id} className="station-inputs">
                <div className="station-header">
                  <span>Course {index + 1} (From: {course.fromStationName} To: {course.toStationName})</span>
                  <button type="button" className="remove-station" onClick={() => removeCourse(index)}>×</button>
                </div>
                <div className="input-group">
                  <label>From Station:</label>
                  <input type="text" value={course.fromStationName} onChange={e => handleInputChange(e, 'courses', index, 'fromStationName')} placeholder="e.g., A"/>
                </div>
                <div className="input-group">
                  <label>To Station:</label>
                  <input type="text" value={course.toStationName} onChange={e => handleInputChange(e, 'courses', index, 'toStationName')} placeholder="e.g., B"/>
                </div>
                <div className="input-group">
                  <label>Angle at '{course.fromStationName}' (°):</label>
                  <input type="number" step="any" value={course.angle} onChange={e => handleInputChange(e, 'courses', index, 'angle')} />
                  {errors[`course_angle_${index}`] && <small className="error-text">{errors[`course_angle_${index}`]}</small>}
                </div>
                <div className="input-group">
                  <label>Distance to '{course.toStationName}':</label>
                  <input type="number" step="any" value={course.distance} onChange={e => handleInputChange(e, 'courses', index, 'distance')} />
                  {errors[`course_distance_${index}`] && <small className="error-text">{errors[`course_distance_${index}`]}</small>}
                </div>
              </div>
            ))}
          </div>
          <button type="button" className="add-station" onClick={addCourse}>Add Course</button>
        </div>

        <button type="button" className="calculate-button" onClick={calculateTraverse}>Calculate Traverse</button>

        {results && (
          <div className="results-section">
            <h3>Traverse Results</h3>
            <div className="results-grid">
              <div className="result-item coordinate-table-item">
                <h4>Adjusted Station Coordinates & Leg Data</h4>
                <div className="coordinate-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Station</th>
                        <th>Obs Angle</th>
                        <th>Adj Angle</th>
                        <th>Distance</th>
                        <th>Bearing</th>
                        <th>Latitude</th>
                        <th>Departure</th>
                        <th>N Corr</th>
                        <th>E Corr</th>
                        <th>Adj Lat</th>
                        <th>Adj Dep</th>
                        <th>Adj Northing</th>
                        <th>Adj Easting</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.stations.map((station, index) => (
                        <tr key={station.stationName + "-" + index}>
                          <td>{station.stationName}</td>
                          <td>{station.angle !== '-' ? parseFloat(station.angle).toFixed(2) + '°' : '-'}</td>
                          <td>{station.adjustedAngleDisplay ? parseFloat(station.adjustedAngleDisplay).toFixed(4) + '°' : '-'}</td>
                          <td>{station.distance !== '-' ? parseFloat(station.distance).toFixed(3) : '-'}</td>
                          <td>{formatBearing(station.bearing)}</td>
                          <td>{station.latitude !== '-' ? parseFloat(station.latitude).toFixed(3) : '-'}</td>
                          <td>{station.departure !== '-' ? parseFloat(station.departure).toFixed(3) : '-'}</td>
                          <td>{station.latCorrection !== undefined ? parseFloat(station.latCorrection).toFixed(3) : '-'}</td>
                          <td>{station.depCorrection !== undefined ? parseFloat(station.depCorrection).toFixed(3) : '-'}</td>
                          <td>{station.adjLatitude !== undefined ? parseFloat(station.adjLatitude).toFixed(3) : '-'}</td>
                          <td>{station.adjDeparture !== undefined ? parseFloat(station.adjDeparture).toFixed(3) : '-'}</td>
                          <td>{station.adjNorthing}</td>
                          <td>{station.adjEasting}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {(traverseData.traverseType === 'closedLoop' || traverseData.traverseType === 'closedLink') && (
                <div className="result-item">
                  <h4>Closure Information</h4>
                  <div className="closure-metrics">
                    <div className="metric"><span className="metric-label">Total Distance:</span><span className="metric-value">{results.closure.totalDistance}</span></div>
                    <div className="metric"><span className="metric-label">Angular Misclosure:</span><span className="metric-value">{results.closure.angular}°</span></div>
                    <div className="metric"><span className="metric-label">Angle Correction/Station:</span><span className="metric-value">{results.closure.angleCorrectionPerStation}°</span></div>
                    <div className="metric"><span className="metric-label">Northing Misclosure (dN):</span><span className="metric-value">{results.closure.misclosureN}</span></div>
                    <div className="metric"><span className="metric-label">Easting Misclosure (dE):</span><span className="metric-value">{results.closure.misclosureE}</span></div>
                    <div className="metric"><span className="metric-label">Linear Misclosure:</span><span className="metric-value">{results.closure.linear}</span></div>
                    <div className="metric"><span className="metric-label">Relative Precision:</span><span className="metric-value">{formatPrecision(results.closure.relative)}</span></div>
                  </div>
                </div>
              )}
              
              {(traverseData.traverseType === 'closedLoop' || traverseData.traverseType === 'closedLink') && results.area > 0 && (
                <div className="result-item">
                  <h4>Area Calculation</h4>
                  <div className="area-metric">
                    <span className="area-value">{results.area} {traverseData.distanceUnit}²</span>
                    <span className="area-hectares">({(parseFloat(results.area) / 10000).toFixed(4)} hectares, if meters)</span>
                  </div>
                </div>
              )}

               {(traverseData.traverseType === 'closedLoop' || traverseData.traverseType === 'closedLink') && (
                <div className="result-item">
                  <h4>Precision Analysis</h4>
                  <div className="precision-gauge">
                    <div 
                      className={`gauge-fill ${getPrecisionClass(results.closure.relative)}`}
                      style={{ width: `${getPrecisionPercentage(results.closure.relative)}%` }}
                    />
                    <span className="precision-label">
                      {formatPrecision(results.closure.relative)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        {Object.keys(errors).length > 0 && !results && (
          <div className="errors-section">
            <h4>Input Errors:</h4>
            {Object.entries(errors).map(([key, errorMsg]) => (
              <div key={key} className="error-message">{key.startsWith('course_') ? `Course ${parseInt(key.split('_')[2])+1}` : key}: {errorMsg}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TraverseCalculator;
