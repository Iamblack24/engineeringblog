import React, { useState, useEffect } from 'react';
import './SteelSectionDatabase.css';
import { Chart } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, LineElement, PointElement } from 'chart.js';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, LineElement, PointElement);

const SteelSectionDatabase = () => {
  const [sectionType, setSectionType] = useState('universal_beams');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSection, setSelectedSection] = useState(null);
  const [sortField, setSortField] = useState('designation');
  const [sortOrder, setSortOrder] = useState('asc');
  const [loading, setLoading] = useState(false);
  const [calculationResults, setCalculationResults] = useState(null);
  const [calculationInputs, setCalculationInputs] = useState({
    span: 6, // meters
    load: 20, // kN/m
    grade: 'S355',
    supportType: 'simply_supported',
    deflectionLimit: 'L/360',
    fireResistance: 30, // minutes
    corrosionProtection: 'galvanized'
  });

  // Enhanced steel section types with more properties and grades
  const sectionTypes = {
    universal_beams: {
      name: 'Universal Beams (UB)',
      sections: [
        {
          designation: 'UB 127x76x13',
          mass_per_metre: 13,
          depth: 127.0,
          width: 76.0,
          web_thickness: 4.0,
          flange_thickness: 7.6,
          root_radius: 7.6,
          depth_between_fillets: 98.2,
          area: 16.5,
          moment_of_inertia_y: 4.72e6,
          moment_of_inertia_z: 0.308e6,
          radius_of_gyration_y: 53.6,
          radius_of_gyration_z: 13.7,
          elastic_modulus_y: 74.3e3,
          elastic_modulus_z: 8.11e3,
          plastic_modulus_y: 85.4e3,
          plastic_modulus_z: 12.6e3,
          available_grades: ['S275', 'S355', 'S450'],
          fire_ratings: {
            '30': { reduction_factor: 0.85 },
            '60': { reduction_factor: 0.7 },
            '90': { reduction_factor: 0.5 }
          },
          corrosion_rates: {
            'unprotected': 0.1,
            'painted': 0.05,
            'galvanized': 0.02
          }
        },
        // Add more UB sections with enhanced properties
      ]
    },
    universal_columns: {
      name: 'Universal Columns (UC)',
      sections: [
        {
          designation: 'UC 152x152x23',
          mass_per_metre: 23,
          depth: 152.4,
          width: 152.4,
          web_thickness: 6.1,
          flange_thickness: 6.8,
          root_radius: 7.6,
          depth_between_fillets: 124.8,
          area: 29.8,
          moment_of_inertia_y: 1.12e6,
          moment_of_inertia_z: 0.375e6,
          radius_of_gyration_y: 61.2,
          radius_of_gyration_z: 35.3,
          elastic_modulus_y: 14.7e3,
          elastic_modulus_z: 4.92e3,
          plastic_modulus_y: 16.6e3,
          plastic_modulus_z: 7.54e3,
          available_grades: ['S275', 'S355', 'S450'],
          fire_ratings: {
            '30': { reduction_factor: 0.85 },
            '60': { reduction_factor: 0.7 },
            '90': { reduction_factor: 0.5 }
          },
          corrosion_rates: {
            'unprotected': 0.1,
            'painted': 0.05,
            'galvanized': 0.02
          }
        },
        // Add more UC sections with enhanced properties
      ]
    },
    channels: {
      name: 'Channels (PFC)',
      sections: [
        {
          designation: 'PFC 100x50x10',
          mass_per_metre: 10,
          depth: 100,
          width: 50,
          web_thickness: 5,
          flange_thickness: 8.5,
          root_radius: 8,
          depth_between_fillets: 83,
          area: 13.2,
          moment_of_inertia_y: 0.206e6,
          moment_of_inertia_z: 0.0248e6,
          radius_of_gyration_y: 39.5,
          radius_of_gyration_z: 13.7,
          elastic_modulus_y: 4.12e3,
          elastic_modulus_z: 0.992e3,
          plastic_modulus_y: 4.89e3,
          plastic_modulus_z: 1.75e3
        },
        {
          designation: 'PFC 180x75x20',
          mass_per_metre: 20,
          depth: 180,
          width: 75,
          web_thickness: 5.5,
          flange_thickness: 10.5,
          root_radius: 9.5,
          depth_between_fillets: 159,
          area: 25.5,
          moment_of_inertia_y: 1.27e6,
          moment_of_inertia_z: 0.0897e6,
          radius_of_gyration_y: 70.6,
          radius_of_gyration_z: 18.8,
          elastic_modulus_y: 14.1e3,
          elastic_modulus_z: 2.39e3,
          plastic_modulus_y: 16.8e3,
          plastic_modulus_z: 4.11e3
        }
      ]
    },
    equal_angles: {
      name: 'Equal Angles',
      sections: [
        {
          designation: 'L 50x50x5',
          mass_per_metre: 3.77,
          depth: 50,
          width: 50,
          thickness: 5,
          root_radius: 5.5,
          area: 4.8,
          moment_of_inertia_y: 11.3e3,
          moment_of_inertia_z: 11.3e3,
          radius_of_gyration_y: 15.4,
          radius_of_gyration_z: 15.4,
          elastic_modulus_y: 3.12e3,
          elastic_modulus_z: 3.12e3
        },
        {
          designation: 'L 75x75x8',
          mass_per_metre: 9.1,
          depth: 75,
          width: 75,
          thickness: 8,
          root_radius: 8.5,
          area: 11.6,
          moment_of_inertia_y: 61.5e3,
          moment_of_inertia_z: 61.5e3,
          radius_of_gyration_y: 23.0,
          radius_of_gyration_z: 23.0,
          elastic_modulus_y: 11.4e3,
          elastic_modulus_z: 11.4e3
        }
      ]
    },
    i_sections: {
      name: 'I Sections (IPE)',
      sections: [
        {
          designation: 'IPE 200',
          mass_per_metre: 22.4,
          depth: 200,
          width: 100,
          web_thickness: 5.6,
          flange_thickness: 8.5,
          root_radius: 12,
          depth_between_fillets: 159,
          area: 28.5,
          moment_of_inertia_y: 1943e4,
          moment_of_inertia_z: 142e4,
          radius_of_gyration_y: 82.6,
          radius_of_gyration_z: 22.4,
          elastic_modulus_y: 194e3,
          elastic_modulus_z: 28.5e3,
          plastic_modulus_y: 221e3,
          plastic_modulus_z: 44.6e3
        }
      ]
    },
    hollow_sections: {
      name: 'Rectangular Hollow Sections (RHS)',
      sections: [
        {
          designation: 'RHS 100x50x3',
          mass_per_metre: 6.71,
          depth: 100,
          width: 50,
          thickness: 3,
          outer_radius: 4.5,
          area: 8.55,
          moment_of_inertia_y: 127e4,
          moment_of_inertia_z: 41.3e4,
          radius_of_gyration_y: 38.5,
          radius_of_gyration_z: 22.0,
          elastic_modulus_y: 25.4e3,
          elastic_modulus_z: 16.5e3,
          plastic_modulus_y: 31.0e3,
          plastic_modulus_z: 19.3e3
        }
      ]
    }
  };

  // Material properties for different grades
  const materialProperties = {
    S275: {
      yield_strength: 275,
      ultimate_strength: 430,
      youngs_modulus: 210000,
      poissons_ratio: 0.3,
      density: 7850
    },
    S355: {
      yield_strength: 355,
      ultimate_strength: 510,
      youngs_modulus: 210000,
      poissons_ratio: 0.3,
      density: 7850
    },
    S450: {
      yield_strength: 450,
      ultimate_strength: 550,
      youngs_modulus: 210000,
      poissons_ratio: 0.3,
      density: 7850
    }
  };

  // Calculate section capacity
  const calculateSectionCapacity = (section, inputs) => {
    const material = materialProperties[inputs.grade];
    const span = inputs.span * 1000; // convert to mm
    const load = inputs.load * 1000; // convert to N/mm

    // Calculate bending moment
    let maxMoment;
    if (inputs.supportType === 'simply_supported') {
      maxMoment = (load * Math.pow(span, 2)) / 8;
    } else if (inputs.supportType === 'cantilever') {
      maxMoment = (load * Math.pow(span, 2)) / 2;
    }

    // Calculate section capacity
    const plasticMoment = section.plastic_modulus_y * material.yield_strength;
    const elasticMoment = section.elastic_modulus_y * material.yield_strength;

    // Calculate deflection
    const deflection = (5 * load * Math.pow(span, 4)) / (384 * material.youngs_modulus * section.moment_of_inertia_y);
    const deflectionLimit = span / 360; // L/360

    // Calculate shear capacity
    const shearArea = section.depth * section.web_thickness;
    const shearCapacity = (shearArea * material.yield_strength) / Math.sqrt(3);

    // Calculate fire resistance
    const fireReduction = section.fire_ratings[inputs.fireResistance]?.reduction_factor || 1;
    const fireMomentCapacity = plasticMoment * fireReduction;

    // Calculate corrosion allowance
    const corrosionRate = section.corrosion_rates[inputs.corrosionProtection] || 0.1;
    const designLife = 50; // years
    const corrosionAllowance = corrosionRate * designLife;

    return {
      maxMoment,
      plasticMoment,
      elasticMoment,
      deflection,
      deflectionLimit,
      shearCapacity,
      fireMomentCapacity,
      corrosionAllowance,
      utilization: {
        bending: maxMoment / plasticMoment,
        shear: (load * span / 2) / shearCapacity,
        deflection: deflection / deflectionLimit,
        fire: maxMoment / fireMomentCapacity
      }
    };
  };

  // Handle calculation inputs change
  const handleCalculationInputChange = (field, value) => {
    setCalculationInputs(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Perform calculations
  const performCalculations = () => {
    if (!selectedSection) return;

    setLoading(true);
    try {
      const results = calculateSectionCapacity(selectedSection, calculationInputs);
      setCalculationResults(results);
    } catch (error) {
      console.error('Calculation error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Format property values
  const formatProperty = (value, property) => {
    if (typeof value === 'number') {
      if (property.includes('moment_of_inertia')) {
        return `${value.toExponential(2)} mm⁴`;
      } else if (property.includes('modulus')) {
        return `${value.toExponential(2)} mm³`;
      } else if (property.includes('area')) {
        return `${value.toFixed(1)} cm²`;
      } else if (property.includes('mass')) {
        return `${value.toFixed(1)} kg/m`;
      } else if (property.includes('radius')) {
        return `${value.toFixed(1)} mm`;
      } else if (property.includes('thickness')) {
        return `${value.toFixed(1)} mm`;
      } else if (property.includes('depth') || property.includes('width')) {
        return `${value.toFixed(1)} mm`;
      }
      return `${value.toFixed(1)}`;
    }
    return value;
  };

  // Handle section selection
  const handleSectionSelect = (section) => {
    setSelectedSection(section);
    setCalculationResults(null);
  };

  // Handle sort
  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Get sorted sections
  const getSortedSections = () => {
    const sections = [...sectionTypes[sectionType].sections];
    return sections.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      if (typeof aValue === 'number') {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }
      return sortOrder === 'asc' 
        ? aValue.localeCompare(bValue) 
        : bValue.localeCompare(aValue);
    });
  };

  // Filter sections
  const filteredSections = getSortedSections().filter(section =>
    section.designation.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="steel-section-database">
      <h2>Enhanced Steel Section Database</h2>
      
      <div className="controls">
        <div className="section-type-select">
          <label>Section Type:</label>
          <select 
            value={sectionType}
            onChange={(e) => {
              setSectionType(e.target.value);
              setSelectedSection(null);
            }}
          >
            {Object.entries(sectionTypes).map(([key, value]) => (
              <option key={key} value={key}>{value.name}</option>
            ))}
          </select>
        </div>

        <div className="search-box">
          <label>Search:</label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by designation..."
          />
        </div>
      </div>

      <div className="sections-table-container">
        <table className="sections-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('designation')}>
                Designation
                {sortField === 'designation' && (
                  <span className="sort-indicator">
                    {sortOrder === 'asc' ? ' ↑' : ' ↓'}
                  </span>
                )}
              </th>
              <th onClick={() => handleSort('mass_per_metre')}>
                Mass/m (kg)
                {sortField === 'mass_per_metre' && (
                  <span className="sort-indicator">
                    {sortOrder === 'asc' ? ' ↑' : ' ↓'}
                  </span>
                )}
              </th>
              <th onClick={() => handleSort('depth')}>
                Depth (mm)
                {sortField === 'depth' && (
                  <span className="sort-indicator">
                    {sortOrder === 'asc' ? ' ↑' : ' ↓'}
                  </span>
                )}
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSections.map((section) => (
              <tr 
                key={section.designation}
                className={selectedSection?.designation === section.designation ? 'selected' : ''}
              >
                <td>{section.designation}</td>
                <td>{formatProperty(section.mass_per_metre, 'mass_per_metre')}</td>
                <td>{formatProperty(section.depth, 'depth')}</td>
                <td>
                  <button 
                    className="view-details-btn"
                    onClick={() => handleSectionSelect(section)}
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedSection && (
        <div className="section-details">
          <h3>Section Properties: {selectedSection.designation}</h3>
          
          <div className="properties-grid">
            {Object.entries(selectedSection).map(([key, value]) => {
              if (key !== 'designation' && !key.includes('_ratings') && !key.includes('_rates')) {
                return (
                  <div key={key} className="property-item">
                    <span className="property-label">
                      {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:
                    </span>
                    <span className="property-value">
                      {formatProperty(value, key)}
                    </span>
                  </div>
                );
              }
              return null;
            })}
          </div>

          <div className="calculation-section">
            <h4>Section Capacity Calculator</h4>
            <div className="calculation-inputs">
              <div className="input-group">
                <label>Span (m):</label>
                <input
                  type="number"
                  value={calculationInputs.span}
                  onChange={(e) => handleCalculationInputChange('span', parseFloat(e.target.value))}
                  min="1"
                  step="0.1"
                />
              </div>
              <div className="input-group">
                <label>Load (kN/m):</label>
                <input
                  type="number"
                  value={calculationInputs.load}
                  onChange={(e) => handleCalculationInputChange('load', parseFloat(e.target.value))}
                  min="1"
                  step="1"
                />
              </div>
              <div className="input-group">
                <label>Grade:</label>
                <select
                  value={calculationInputs.grade}
                  onChange={(e) => handleCalculationInputChange('grade', e.target.value)}
                >
                  {selectedSection.available_grades.map(grade => (
                    <option key={grade} value={grade}>{grade}</option>
                  ))}
                </select>
              </div>
              <div className="input-group">
                <label>Support Type:</label>
                <select
                  value={calculationInputs.supportType}
                  onChange={(e) => handleCalculationInputChange('supportType', e.target.value)}
                >
                  <option value="simply_supported">Simply Supported</option>
                  <option value="cantilever">Cantilever</option>
                </select>
              </div>
              <div className="input-group">
                <label>Fire Resistance (min):</label>
                <select
                  value={calculationInputs.fireResistance}
                  onChange={(e) => handleCalculationInputChange('fireResistance', e.target.value)}
                >
                  <option value="30">30 minutes</option>
                  <option value="60">60 minutes</option>
                  <option value="90">90 minutes</option>
                </select>
              </div>
              <div className="input-group">
                <label>Corrosion Protection:</label>
                <select
                  value={calculationInputs.corrosionProtection}
                  onChange={(e) => handleCalculationInputChange('corrosionProtection', e.target.value)}
                >
                  <option value="unprotected">Unprotected</option>
                  <option value="painted">Painted</option>
                  <option value="galvanized">Galvanized</option>
                </select>
              </div>
            </div>

            <button 
              className="calculate-btn"
              onClick={performCalculations}
              disabled={loading}
            >
              {loading ? 'Calculating...' : 'Calculate Capacity'}
            </button>

            {calculationResults && (
              <div className="calculation-results">
                <h5>Results</h5>
                <div className="results-grid">
                  <div className="result-item">
                    <span className="result-label">Maximum Moment:</span>
                    <span className="result-value">
                      {calculationResults.maxMoment.toFixed(2)} N·mm
                    </span>
                  </div>
                  <div className="result-item">
                    <span className="result-label">Plastic Moment Capacity:</span>
                    <span className="result-value">
                      {calculationResults.plasticMoment.toFixed(2)} N·mm
                    </span>
                  </div>
                  <div className="result-item">
                    <span className="result-label">Deflection:</span>
                    <span className="result-value">
                      {calculationResults.deflection.toFixed(2)} mm
                    </span>
                  </div>
                  <div className="result-item">
                    <span className="result-label">Deflection Limit:</span>
                    <span className="result-value">
                      {calculationResults.deflectionLimit.toFixed(2)} mm
                    </span>
                  </div>
                  <div className="result-item">
                    <span className="result-label">Shear Capacity:</span>
                    <span className="result-value">
                      {calculationResults.shearCapacity.toFixed(2)} N
                    </span>
                  </div>
                  <div className="result-item">
                    <span className="result-label">Fire Moment Capacity:</span>
                    <span className="result-value">
                      {calculationResults.fireMomentCapacity.toFixed(2)} N·mm
                    </span>
                  </div>
                  <div className="result-item">
                    <span className="result-label">Corrosion Allowance:</span>
                    <span className="result-value">
                      {calculationResults.corrosionAllowance.toFixed(2)} mm
                    </span>
                  </div>
                </div>

                <div className="utilization-chart">
                  <Chart
                    type="bar"
                    data={{
                      labels: ['Bending', 'Shear', 'Deflection', 'Fire'],
                      datasets: [{
                        label: 'Utilization Ratio',
                        data: [
                          calculationResults.utilization.bending,
                          calculationResults.utilization.shear,
                          calculationResults.utilization.deflection,
                          calculationResults.utilization.fire
                        ],
                        backgroundColor: [
                          calculationResults.utilization.bending > 1 ? '#ff6b6b' : '#64ffda',
                          calculationResults.utilization.shear > 1 ? '#ff6b6b' : '#64ffda',
                          calculationResults.utilization.deflection > 1 ? '#ff6b6b' : '#64ffda',
                          calculationResults.utilization.fire > 1 ? '#ff6b6b' : '#64ffda'
                        ]
                      }]
                    }}
                    options={{
                      responsive: true,
                      scales: {
                        y: {
                          beginAtZero: true,
                          max: 1.2,
                          title: {
                            display: true,
                            text: 'Utilization Ratio'
                          }
                        }
                      }
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SteelSectionDatabase;