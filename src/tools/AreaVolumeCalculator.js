import React, { useState } from 'react';
import './AreaVolumeCalculator.css';

const AreaVolumeCalculator = () => {
  const [surveyData, setSurveyData] = useState({
    points: [
      {
        id: 1,
        name: 'P1',
        northing: 1000.000,
        easting: 1000.000,
        elevation: 100.000,
        description: 'Boundary Point'
      }
    ],
    calculationType: 'both', // area, volume, or both
    method: 'grid',          // grid, contour, cross-section, or prismoidal
    gridSpacing: 10,         // meters
    referenceLevel: 0,       // for volume calculation
    units: 'metric',         // metric or imperial
    boundaryType: 'closed'   // closed or open
  });

  const [results, setResults] = useState(null);
  const [errors, setErrors] = useState({});

  const validateInputs = () => {
    const newErrors = {};
    
    // Validate minimum points
    if (surveyData.points.length < 3) {
      newErrors.points = 'At least 3 points are required for area calculation';
    }

    // Validate grid spacing
    if (surveyData.method === 'grid' && surveyData.gridSpacing <= 0) {
      newErrors.gridSpacing = 'Grid spacing must be positive';
    }

    // Validate coordinates
    surveyData.points.forEach((point, index) => {
      if (isNaN(point.northing) || isNaN(point.easting) || isNaN(point.elevation)) {
        newErrors[`point_${index}`] = `Invalid coordinates for point ${point.name}`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateAreaAndVolume = () => {
    if (!validateInputs()) return;

    try {
      // Calculate area
      const areaResult = calculateArea();
      
      // Calculate volume if requested
      const volumeResult = surveyData.calculationType !== 'area' ? 
        calculateVolume() : null;
      
      // Calculate statistics and quality metrics
      const stats = calculateStatistics(areaResult, volumeResult);

      setResults({
        area: areaResult,
        volume: volumeResult,
        statistics: stats,
        quality: assessQuality(stats)
      });

    } catch (error) {
      setErrors({ calculation: 'Error in calculation' });
    }
  };

  const calculateArea = () => {
    const points = surveyData.points;
    let area = 0;
    let perimeter = 0;

    // Calculate area using coordinate method
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      area += points[i].northing * points[j].easting - 
              points[j].northing * points[i].easting;
      
      // Calculate perimeter
      if (i < points.length - 1) {
        perimeter += calculateDistance(points[i], points[j]);
      }
    }

    area = Math.abs(area) / 2;

    return {
      totalArea: area,
      perimeter: perimeter,
      centroid: calculateCentroid(points)
    };
  };

  const calculateVolume = () => {
    let volume = 0;
    const method = surveyData.method;

    switch (method) {
      case 'grid':
        volume = calculateGridVolume();
        break;
      case 'contour':
        volume = calculateContourVolume();
        break;
      case 'cross-section':
        volume = calculateCrossSectionVolume();
        break;
      case 'prismoidal':
        volume = calculatePrismoidalVolume();
        break;
      default:
        throw new Error('Invalid volume calculation method');
    }

    return {
      totalVolume: volume,
      cutVolume: calculateCutVolume(),
      fillVolume: calculateFillVolume(),
      method: method
    };
  };

  const calculateGridVolume = () => {
    const grid = generateGrid();
    let volume = 0;

    grid.forEach(cell => {
      const avgHeight = cell.corners.reduce((sum, point) => 
        sum + (point.elevation - surveyData.referenceLevel), 0) / 4;
      volume += avgHeight * Math.pow(surveyData.gridSpacing, 2);
    });

    return volume;
  };

  const generateGrid = () => {
    // Generate grid cells based on boundary points
    const bounds = calculateBounds();
    const cells = [];
    const spacing = surveyData.gridSpacing;

    for (let n = bounds.minNorthing; n < bounds.maxNorthing; n += spacing) {
      for (let e = bounds.minEasting; e < bounds.maxEasting; e += spacing) {
        if (isPointInBoundary({ northing: n, easting: e })) {
          cells.push({
            corners: [
              interpolateElevation(n, e),
              interpolateElevation(n + spacing, e),
              interpolateElevation(n + spacing, e + spacing),
              interpolateElevation(n, e + spacing)
            ]
          });
        }
      }
    }

    return cells;
  };

  const calculateStatistics = (points) => {
    const distances = points.map((point, index) => 
      index < points.length - 1 ? calculateDistance(point, points[index + 1]) : 0
    );
    
    return {
      'Number of Points': points.length,
      'Total Distance': formatDistance(distances.reduce((a, b) => a + b, 0)),
      'Average Point Spacing': formatDistance(
        distances.reduce((a, b) => a + b, 0) / (points.length - 1)
      )
    };
  };

  const assessQuality = (stats) => {
    let score = 100;
    let description = 'Excellent';
    
    const avgSpacing = parseFloat(stats['Average Point Spacing']);
    if (avgSpacing > 50) {
      score -= 30;
      description = 'Poor Point Density';
    } else if (avgSpacing > 25) {
      score -= 15;
      description = 'Fair Point Density';
    }
    
    return { score, description, class: score > 80 ? 'excellent' : score > 60 ? 'good' : 'poor' };
  };

  const calculateDistance = (point1, point2) => {
    return Math.sqrt(
      Math.pow(point2.northing - point1.northing, 2) +
      Math.pow(point2.easting - point1.easting, 2)
    );
  };

  const calculateCentroid = (points) => {
    const area = calculateArea(points).totalArea;
    let xSum = 0;
    let ySum = 0;
    
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      const factor = points[i].northing * points[j].easting - points[j].northing * points[i].easting;
      xSum += (points[i].northing + points[j].northing) * factor;
      ySum += (points[i].easting + points[j].easting) * factor;
    }
    
    return {
      northing: xSum / (6 * area),
      easting: ySum / (6 * area)
    };
  };

  const calculateContourVolume = () => {
    const contours = surveyData.contours;
    let volume = 0;
    
    for (let i = 0; i < contours.length - 1; i++) {
      const area1 = calculateArea(contours[i].points).totalArea;
      const area2 = calculateArea(contours[i + 1].points).totalArea;
      const height = contours[i + 1].elevation - contours[i].elevation;
      volume += (height / 3) * (area1 + area2 + Math.sqrt(area1 * area2));
    }
    
    return volume;
  };

  const calculateCrossSectionVolume = () => {
    const sections = surveyData.sections;
    let volume = 0;
    
    for (let i = 0; i < sections.length - 1; i++) {
      const area1 = sections[i].area;
      const area2 = sections[i + 1].area;
      const distance = calculateDistance(sections[i].center, sections[i + 1].center);
      volume += (distance / 2) * (area1 + area2);
    }
    
    return volume;
  };

  const calculatePrismoidalVolume = () => {
    const sections = surveyData.sections;
    let volume = 0;
    
    for (let i = 0; i < sections.length - 1; i++) {
      const area1 = sections[i].area;
      const area2 = sections[i + 1].area;
      const middleArea = calculateMiddleSectionArea(sections[i], sections[i + 1]);
      const distance = calculateDistance(sections[i].center, sections[i + 1].center);
      volume += (distance / 6) * (area1 + 4 * middleArea + area2);
    }
    
    return volume;
  };

  const calculateCutVolume = () => {
    return surveyData.points.reduce((total, point) => 
      total + Math.max(0, point.elevation - surveyData.referenceLevel), 0
    ) * Math.pow(surveyData.gridSpacing, 2);
  };

  const calculateFillVolume = () => {
    return surveyData.points.reduce((total, point) => 
      total + Math.max(0, surveyData.referenceLevel - point.elevation), 0
    ) * Math.pow(surveyData.gridSpacing, 2);
  };

  const calculateBounds = () => {
    const points = surveyData.points;
    return {
      minNorthing: Math.min(...points.map(p => p.northing)),
      maxNorthing: Math.max(...points.map(p => p.northing)),
      minEasting: Math.min(...points.map(p => p.easting)),
      maxEasting: Math.max(...points.map(p => p.easting))
    };
  };

  const isPointInBoundary = (point) => {
    const bounds = calculateBounds();
    return point.northing >= bounds.minNorthing &&
           point.northing <= bounds.maxNorthing &&
           point.easting >= bounds.minEasting &&
           point.easting <= bounds.maxEasting;
  };

  const interpolateElevation = (northing, easting) => {
    // Inverse distance weighted interpolation
    const points = surveyData.points;
    let weightedSum = 0;
    let weightSum = 0;
    
    points.forEach(point => {
      const distance = calculateDistance(point, { northing, easting });
      if (distance === 0) return point.elevation;
      const weight = 1 / Math.pow(distance, 2);
      weightedSum += point.elevation * weight;
      weightSum += weight;
    });
    
    return weightedSum / weightSum;
  };

  const addPoint = () => {
    const newPoint = {
      id: Date.now(),
      name: `P${surveyData.points.length + 1}`,
      northing: 0,
      easting: 0,
      elevation: 0
    };
    
    setSurveyData({
      ...surveyData,
      points: [...surveyData.points, newPoint]
    });
  };

  const removePoint = (index) => {
    const newPoints = [...surveyData.points];
    newPoints.splice(index, 1);
    setSurveyData({
      ...surveyData,
      points: newPoints
    });
  };

  // Formatting functions
  const formatArea = (area) => `${area.toFixed(2)} m²`;
  const formatDistance = (distance) => `${distance.toFixed(3)} m`;
  const formatVolume = (volume) => `${volume.toFixed(2)} m³`;

  const calculateMiddleSectionArea = (section1, section2) => {
    // Calculate the area of a middle section between two cross sections
    // using linear interpolation of elevations
    
    // Get the combined set of x-coordinates (distances from baseline)
    const allX = [...new Set([
      ...section1.points.map(p => p.distance),
      ...section2.points.map(p => p.distance)
    ])].sort((a, b) => a - b);
    
    // Interpolate elevations for both sections at each x-coordinate
    const middlePoints = allX.map(x => {
      const elevation1 = interpolateElevationAtSection(section1.points, x);
      const elevation2 = interpolateElevationAtSection(section2.points, x);
      
      return {
        distance: x,
        elevation: (elevation1 + elevation2) / 2 // Average elevation
      };
    });
    
    // Calculate area using trapezoidal rule
    let area = 0;
    for (let i = 0; i < middlePoints.length - 1; i++) {
      const height1 = Math.max(0, middlePoints[i].elevation - surveyData.referenceLevel);
      const height2 = Math.max(0, middlePoints[i + 1].elevation - surveyData.referenceLevel);
      const width = middlePoints[i + 1].distance - middlePoints[i].distance;
      area += (height1 + height2) * width / 2;
    }
    
    return area;
  };

  const interpolateElevationAtSection = (points, distance) => {
    // Find the two points that bracket the desired distance
    const leftPoint = points.reduce((prev, curr) => 
      curr.distance <= distance && curr.distance > prev.distance ? curr : prev
    , { distance: -Infinity });
    
    const rightPoint = points.reduce((prev, curr) => 
      curr.distance >= distance && curr.distance < prev.distance ? curr : prev
    , { distance: Infinity });
    
    // If distance is exactly at a point, return that elevation
    if (leftPoint.distance === distance) return leftPoint.elevation;
    if (rightPoint.distance === distance) return rightPoint.elevation;
    
    // Linear interpolation between the two points
    const ratio = (distance - leftPoint.distance) / (rightPoint.distance - leftPoint.distance);
    return leftPoint.elevation + ratio * (rightPoint.elevation - leftPoint.elevation);
  };

  return (
    <div className="area-volume-calculator">
      <h2>Area & Volume Calculator</h2>
      
      <div className="calculator-controls">
        <div className="input-sections">
          {/* Calculation Settings */}
          <div className="input-section">
            <h3>Calculation Settings</h3>
            <div className="input-group">
              <label>Calculation Type:</label>
              <select
                value={surveyData.calculationType}
                onChange={(e) => setSurveyData({
                  ...surveyData,
                  calculationType: e.target.value
                })}
              >
                <option value="both">Area & Volume</option>
                <option value="area">Area Only</option>
                <option value="volume">Volume Only</option>
              </select>
            </div>
            {surveyData.calculationType !== 'area' && (
              <div className="input-group">
                <label>Volume Method:</label>
                <select
                  value={surveyData.method}
                  onChange={(e) => setSurveyData({
                    ...surveyData,
                    method: e.target.value
                  })}
                >
                  <option value="grid">Grid Method</option>
                  <option value="contour">Contour Method</option>
                  <option value="cross-section">Cross Section</option>
                  <option value="prismoidal">Prismoidal Method</option>
                </select>
              </div>
            )}
            {/* Additional settings inputs */}
          </div>

          {/* Survey Points */}
          <div className="input-section points-section">
            <h3>Survey Points</h3>
            <div className="points-grid">
              {surveyData.points.map((point, index) => (
                <div key={point.id} className="point-inputs">
                  <div className="point-header">
                    <span>Point {point.name}</span>
                    {index > 0 && (
                      <button 
                        className="remove-point"
                        onClick={() => removePoint(index)}
                      >
                        ×
                      </button>
                    )}
                  </div>
                  {/* Point input fields */}
                </div>
              ))}
            </div>
            <button 
              className="add-point"
              onClick={addPoint}
            >
              Add Point
            </button>
          </div>
        </div>

        {Object.keys(errors).length > 0 && (
          <div className="errors-section">
            {Object.values(errors).map((error, index) => (
              <div key={index} className="error-message">
                {error}
              </div>
            ))}
          </div>
        )}

        <button 
          className="calculate-button"
          onClick={calculateAreaAndVolume}
        >
          Calculate
        </button>

        {/* Results Display */}
        {results && (
          <div className="results-section">
            <h3>Calculation Results</h3>
            
            <div className="results-grid">
              {/* Area Results */}
              {results.area && (
                <div className="result-item">
                  <h4>Area Calculation</h4>
                  <div className="area-metrics">
                    <div className="metric">
                      <span className="metric-label">Total Area:</span>
                      <span className="metric-value">
                        {formatArea(results.area.totalArea)}
                      </span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">Perimeter:</span>
                      <span className="metric-value">
                        {formatDistance(results.area.perimeter)}
                      </span>
                    </div>
                    <div className="centroid-coordinates">
                      <span className="metric-label">Centroid:</span>
                      <span className="coordinate">
                        N: {results.area.centroid.northing.toFixed(3)}
                      </span>
                      <span className="coordinate">
                        E: {results.area.centroid.easting.toFixed(3)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Volume Results */}
              {results.volume && (
                <div className="result-item">
                  <h4>Volume Calculation</h4>
                  <div className="volume-metrics">
                    <div className="metric">
                      <span className="metric-label">Total Volume:</span>
                      <span className="metric-value">
                        {formatVolume(results.volume.totalVolume)}
                      </span>
                    </div>
                    <div className="cut-fill-volumes">
                      <div className="metric cut">
                        <span className="metric-label">Cut Volume:</span>
                        <span className="metric-value">
                          {formatVolume(results.volume.cutVolume)}
                        </span>
                      </div>
                      <div className="metric fill">
                        <span className="metric-label">Fill Volume:</span>
                        <span className="metric-value">
                          {formatVolume(results.volume.fillVolume)}
                        </span>
                      </div>
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

              {/* Visualization */}
              <div className="result-item visualization">
                <h4>Visual Representation</h4>
                <div className="visualization-container">
                  {/* SVG or Canvas visualization */}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AreaVolumeCalculator;