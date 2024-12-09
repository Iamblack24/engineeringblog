import React, { useState } from 'react';
import './ColumnDesignTool.css';

const ColumnDesignTool = () => {
  const [columnData, setColumnData] = useState({
    // Geometry
    length: 3000, // mm
    sectionType: 'rectangular',
    width: 300, // mm
    depth: 300, // mm
    diameter: 300, // mm (for circular sections)
    
    // Loading
    axialLoad: 1000, // kN
    momentX: 50, // kNm
    momentY: 30, // kNm
    
    // Material Properties
    concreteGrade: 30, // MPa
    steelGrade: 500, // MPa
    
    // Reinforcement
    mainBarDiameter: 20, // mm
    stirrupDiameter: 8, // mm
    cover: 40, // mm
    numberOfBarsX: 3,
    numberOfBarsY: 3
  });

  const [results, setResults] = useState(null);
  const [errors, setErrors] = useState({});

  const concreteGrades = [20, 25, 30, 35, 40, 45, 50, 55, 60];
  const steelGrades = [415, 500, 550];
  const barDiameters = [12, 16, 20, 25, 32];
  const stirrupDiameters = [8, 10, 12];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setColumnData(prev => ({
      ...prev,
      [name]: parseFloat(value) || value
    }));
  };

  const validateInputs = () => {
    const newErrors = {};
    
    // Geometry validation
    if (columnData.length < 1000 || columnData.length > 10000) {
      newErrors.length = 'Length must be between 1000mm and 10000mm';
    }

    if (columnData.sectionType === 'rectangular') {
      if (columnData.width < 200 || columnData.width > 1000) {
        newErrors.width = 'Width must be between 200mm and 1000mm';
      }
      if (columnData.depth < 200 || columnData.depth > 1000) {
        newErrors.depth = 'Depth must be between 200mm and 1000mm';
      }
    } else {
      if (columnData.diameter < 200 || columnData.diameter > 1000) {
        newErrors.diameter = 'Diameter must be between 200mm and 1000mm';
      }
    }

    // Loading validation
    if (columnData.axialLoad <= 0) {
      newErrors.axialLoad = 'Axial load must be positive';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateColumnCapacity = () => {
    if (!validateInputs()) {
      return;
    }

    // Get section properties
    const area = columnData.sectionType === 'rectangular' 
      ? columnData.width * columnData.depth 
      : Math.PI * Math.pow(columnData.diameter, 2) / 4;

    // Calculate concrete strength
    const fck = columnData.concreteGrade;
    const fcd = 0.67 * fck / 1.5; // Design concrete strength

    // Calculate steel strength
    const fy = columnData.steelGrade;
    const fyd = fy / 1.15; // Design steel strength

    // Calculate reinforcement details
    const numberOfBars = columnData.numberOfBarsX * columnData.numberOfBarsY;
    const barArea = Math.PI * Math.pow(columnData.mainBarDiameter, 2) / 4;
    const totalSteelArea = numberOfBars * barArea;
    const steelRatio = (totalSteelArea / area) * 100;

    // Calculate capacities using design strengths
    const pureAxialCapacity = (0.45 * fcd * (area - totalSteelArea) + 0.87 * fyd * totalSteelArea) / 1000; // kN
    
    // Calculate slenderness
    const inertia = columnData.sectionType === 'rectangular'
      ? (columnData.width * Math.pow(columnData.depth, 3)) / 12
      : (Math.PI * Math.pow(columnData.diameter, 4)) / 64;
    
    const radius = Math.sqrt(inertia / area);
    const slendernessRatio = columnData.length / radius;

    // Set results
    setResults({
      crossSectionalArea: area / 1e6, // m²
      steelArea: totalSteelArea / 1e6, // m²
      steelRatio: steelRatio,
      pureAxialCapacity: pureAxialCapacity,
      slendernessRatio: slendernessRatio,
      minimumEccentricity: Math.max(columnData.length / 500, 20), // mm
      designAxialCapacity: pureAxialCapacity * (1 - Math.pow(slendernessRatio/140, 2)) // Simplified capacity reduction for slenderness
    });
  };

  return (
    <div className="column-design-tool">
      <h2>Column Design Tool</h2>
      
      <div className="design-form">
        <div className="form-section">
          <h3>Geometry</h3>
          
          <div className="input-group">
            <label>Column Length (mm):</label>
            <input
              type="number"
              name="length"
              value={columnData.length}
              onChange={handleInputChange}
            />
            {errors.length && <span className="error">{errors.length}</span>}
          </div>

          <div className="input-group">
            <label>Section Type:</label>
            <select
              name="sectionType"
              value={columnData.sectionType}
              onChange={handleInputChange}
            >
              <option value="rectangular">Rectangular</option>
              <option value="circular">Circular</option>
            </select>
          </div>

          {columnData.sectionType === 'rectangular' ? (
            <>
              <div className="input-group">
                <label>Width (mm):</label>
                <input
                  type="number"
                  name="width"
                  value={columnData.width}
                  onChange={handleInputChange}
                />
                {errors.width && <span className="error">{errors.width}</span>}
              </div>

              <div className="input-group">
                <label>Depth (mm):</label>
                <input
                  type="number"
                  name="depth"
                  value={columnData.depth}
                  onChange={handleInputChange}
                />
                {errors.depth && <span className="error">{errors.depth}</span>}
              </div>
            </>
          ) : (
            <div className="input-group">
              <label>Diameter (mm):</label>
              <input
                type="number"
                name="diameter"
                value={columnData.diameter}
                onChange={handleInputChange}
              />
              {errors.diameter && <span className="error">{errors.diameter}</span>}
            </div>
          )}
        </div>

        <div className="form-section">
          <h3>Loading</h3>
          
          <div className="input-group">
            <label>Axial Load (kN):</label>
            <input
              type="number"
              name="axialLoad"
              value={columnData.axialLoad}
              onChange={handleInputChange}
            />
            {errors.axialLoad && <span className="error">{errors.axialLoad}</span>}
          </div>

          <div className="input-group">
            <label>Moment about X-axis (kNm):</label>
            <input
              type="number"
              name="momentX"
              value={columnData.momentX}
              onChange={handleInputChange}
            />
          </div>

          <div className="input-group">
            <label>Moment about Y-axis (kNm):</label>
            <input
              type="number"
              name="momentY"
              value={columnData.momentY}
              onChange={handleInputChange}
            />
          </div>
        </div>

        <div className="form-section">
          <h3>Materials</h3>
          
          <div className="input-group">
            <label>Concrete Grade (MPa):</label>
            <select
              name="concreteGrade"
              value={columnData.concreteGrade}
              onChange={handleInputChange}
            >
              {concreteGrades.map(grade => (
                <option key={grade} value={grade}>M{grade}</option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <label>Steel Grade (MPa):</label>
            <select
              name="steelGrade"
              value={columnData.steelGrade}
              onChange={handleInputChange}
            >
              {steelGrades.map(grade => (
                <option key={grade} value={grade}>Fe {grade}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-section">
          <h3>Reinforcement Details</h3>
          
          <div className="input-group">
            <label>Main Bar Diameter (mm):</label>
            <select
              name="mainBarDiameter"
              value={columnData.mainBarDiameter}
              onChange={handleInputChange}
            >
              {barDiameters.map(dia => (
                <option key={dia} value={dia}>{dia}mm</option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <label>Number of Bars (X-direction):</label>
            <input
              type="number"
              name="numberOfBarsX"
              value={columnData.numberOfBarsX}
              onChange={handleInputChange}
              min="2"
            />
          </div>

          <div className="input-group">
            <label>Number of Bars (Y-direction):</label>
            <input
              type="number"
              name="numberOfBarsY"
              value={columnData.numberOfBarsY}
              onChange={handleInputChange}
              min="2"
            />
          </div>

          <div className="input-group">
            <label>Clear Cover (mm):</label>
            <input
              type="number"
              name="cover"
              value={columnData.cover}
              onChange={handleInputChange}
            />
          </div>

          <div className="input-group">
            <label>Stirrup Diameter (mm):</label>
            <select
              name="stirrupDiameter"
              value={columnData.stirrupDiameter}
              onChange={handleInputChange}
            >
              {stirrupDiameters.map(dia => (
                <option key={dia} value={dia}>{dia}mm</option>
              ))}
            </select>
          </div>
        </div>

        <button className="calculate-button" onClick={calculateColumnCapacity}>
          Calculate Column Capacity
        </button>
      </div>

      {results && (
        <div className="results-section">
          <h3>Design Results</h3>
          <div className="results-grid">
            <div className="result-item">
              <span className="result-label">Cross-sectional Area:</span>
              <span className="result-value">{results.crossSectionalArea.toFixed(4)} m²</span>
            </div>
            <div className="result-item">
              <span className="result-label">Steel Area:</span>
              <span className="result-value">{results.steelArea.toFixed(6)} m²</span>
            </div>
            <div className="result-item">
              <span className="result-label">Steel Ratio:</span>
              <span className="result-value">{results.steelRatio.toFixed(2)}%</span>
            </div>
            <div className="result-item">
              <span className="result-label">Pure Axial Capacity:</span>
              <span className="result-value">{results.pureAxialCapacity.toFixed(2)} kN</span>
            </div>
            <div className="result-item">
              <span className="result-label">Slenderness Ratio:</span>
              <span className="result-value">{results.slendernessRatio.toFixed(2)}</span>
            </div>
            <div className="result-item">
              <span className="result-label">Minimum Eccentricity:</span>
              <span className="result-value">{results.minimumEccentricity.toFixed(2)} mm</span>
            </div>
            <div className="result-item">
              <span className="result-label">Design Axial Capacity:</span>
              <span className="result-value">{results.designAxialCapacity.toFixed(2)} kN</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ColumnDesignTool;