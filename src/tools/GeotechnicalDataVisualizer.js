import React, { useState } from 'react';
import './GeotechnicalDataVisualizer.css';
import { Chart } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend } from 'chart.js';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend);

const calculateStdDev = (array) => {
  if (!array || array.length === 0) return 0;
  const n = array.length;
  const mean = array.reduce((a, b) => a + b, 0) / n; // Use 0 as initial value for reduce
  if (n < 2) return 0; // Standard deviation is not well-defined for n < 2
  return Math.sqrt(array.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0) / (n - 1)); // Use (n-1) for sample std dev
};

const GeotechnicalDataVisualizer = () => {
  const [dataType, setDataType] = useState('borehole_logs');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedData, setSelectedData] = useState(null);
  const [sortField, setSortField] = useState('id');
  const [sortOrder, setSortOrder] = useState('asc');
  const [analysisInputs, setAnalysisInputs] = useState({
    depthRange: [0, 20], // meters
    soilType: 'all',
  });

  // Sample geotechnical data
  const geotechnicalData = {
    borehole_logs: {
      name: 'Borehole Logs',
      data: [
        {
          id: 'BH-001',
          location: 'Site A',
          totalDepth: 15,
          layers: [
            { depth: 0, thickness: 2, soilType: 'Clay', shearStrength: 50, unitWeight: 18 },
            { depth: 2, thickness: 5, soilType: 'Sand', shearStrength: 30, frictionAngle: 30, unitWeight: 19 },
            { depth: 7, thickness: 8, soilType: 'Silt', shearStrength: 40, unitWeight: 18.5 },
          ],
        },
        {
          id: 'BH-002',
          location: 'Site B',
          totalDepth: 20,
          layers: [
            { depth: 0, thickness: 3, soilType: 'Clay', shearStrength: 60, unitWeight: 18.5 },
            { depth: 3, thickness: 7, soilType: 'Sand', shearStrength: 35, frictionAngle: 32, unitWeight: 19.5 },
            { depth: 10, thickness: 10, soilType: 'Gravel', shearStrength: 45, frictionAngle: 35, unitWeight: 20 },
          ],
        },
      ],
    },
    cpt_data: {
      name: 'Cone Penetration Test (CPT)',
      data: [
        {
          id: 'CPT-001',
          location: 'Site A',
          totalDepth: 18,
          measurements: [
            { depth: 0, qc: 2.5, fs: 0.05, u2: 0.1 },
            { depth: 5, qc: 5.0, fs: 0.10, u2: 0.2 },
            { depth: 10, qc: 7.5, fs: 0.15, u2: 0.3 },
            { depth: 15, qc: 6.0, fs: 0.12, u2: 0.25 },
          ],
        },
        {
          id: 'CPT-002',
          location: 'Site B',
          totalDepth: 22,
          measurements: [
            { depth: 0, qc: 3.0, fs: 0.06, u2: 0.12 },
            { depth: 5, qc: 6.0, fs: 0.12, u2: 0.22 },
            { depth: 10, qc: 8.0, fs: 0.16, u2: 0.32 },
            { depth: 20, qc: 5.5, fs: 0.11, u2: 0.20 },
          ],
        },
      ],
    },
    soil_profiles: {
      name: 'Soil Profiles',
      data: [
        {
          id: 'SP-001',
          location: 'Site A',
          layers: [
            { soilType: 'Clay', thickness: 3, shearStrength: 55 },
            { soilType: 'Sand', thickness: 7, shearStrength: 32 },
            { soilType: 'Silt', thickness: 5, shearStrength: 38 },
          ],
        },
        {
          id: 'SP-002',
          location: 'Site B',
          layers: [
            { soilType: 'Clay', thickness: 4, shearStrength: 65 },
            { soilType: 'Gravel', thickness: 8, shearStrength: 48 },
          ],
        },
      ],
    },
  };

  // Placeholder for SBT calculation logic
  const calculateSBT = (qc, fs, u2, effectiveOverburdenStress) => {
    // This is a highly simplified placeholder.
    // A real implementation would involve normalization (Qt, Fr, Bq)
    // and lookup in Robertson's SBTn charts.
    if (fs / qc < 0.01 && qc > 5) return 'Sand';
    if (fs / qc > 0.04 && qc < 2) return 'Clay';
    if (qc > 1 && qc < 5) return 'Silt';
    return 'Mixed/Other';
  };

  // Analyze data (e.g., average cone resistance, total thickness)
  const analyzeData = (data, inputs) => {
    if (!data) return null;

    if (dataType === 'borehole_logs') {
      const filteredLayers = data.layers.filter(
        layer =>
          layer.depth >= inputs.depthRange[0] &&
          layer.depth < inputs.depthRange[1] && // Use < for end of range to be exclusive of next layer's start
          (inputs.soilType === 'all' || layer.soilType === inputs.soilType)
      );
      const totalThickness = filteredLayers.reduce((sum, layer) => sum + layer.thickness, 0);
      
      let weightedSumShearStrength = 0;
      let sumThicknessForShearStrength = 0;
      filteredLayers.forEach(layer => {
        if (layer.shearStrength !== undefined) {
          weightedSumShearStrength += layer.shearStrength * layer.thickness;
          sumThicknessForShearStrength += layer.thickness;
        }
      });
      const avgShearStrength = sumThicknessForShearStrength > 0 ? weightedSumShearStrength / sumThicknessForShearStrength : 0;

      return { totalThickness, avgShearStrength, filteredLayers };
    } else if (dataType === 'cpt_data') {
      const filteredMeasurements = data.measurements.filter(
        m => m.depth >= inputs.depthRange[0] && m.depth <= inputs.depthRange[1]
      );
      const qcValues = filteredMeasurements.map(m => m.qc);
      const fsValues = filteredMeasurements.map(m => m.fs);

      const avgQc = qcValues.reduce((sum, val) => sum + val, 0) / (qcValues.length || 1);
      const avgFs = fsValues.reduce((sum, val) => sum + val, 0) / (fsValues.length || 1);
      
      const stdDevQc = calculateStdDev(qcValues);
      const stdDevFs = calculateStdDev(fsValues);
      const minQc = qcValues.length > 0 ? Math.min(...qcValues) : 0;
      const maxQc = qcValues.length > 0 ? Math.max(...qcValues) : 0;
      const minFs = fsValues.length > 0 ? Math.min(...fsValues) : 0;
      const maxFs = fsValues.length > 0 ? Math.max(...fsValues) : 0;

      const measurementsWithSBT = filteredMeasurements.map(m => ({
        ...m,
        sbt: calculateSBT(m.qc, m.fs, m.u2, 100) // Placeholder effective stress
      }));

      return { 
        avgQc, 
        avgFs, 
        filteredMeasurements: measurementsWithSBT,
        stdDevQc,
        stdDevFs,
        minQc,
        maxQc,
        minFs,
        maxFs
      };
    } else if (dataType === 'soil_profiles') {
      const filteredLayers = data.layers.filter(
        layer => inputs.soilType === 'all' || layer.soilType === inputs.soilType
      );
      const totalThickness = filteredLayers.reduce((sum, layer) => sum + layer.thickness, 0);
      return { totalThickness, filteredLayers };
    }
    return null;
  };

  // Handle input changes
  const handleAnalysisInputChange = (field, value) => {
    setAnalysisInputs(prev => ({ ...prev, [field]: value }));
  };

  // Handle data selection
  const handleDataSelect = data => {
    setSelectedData(data);
  };

  // Handle sort
  const handleSort = field => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Get sorted data
  const getSortedData = () => {
    const data = [...geotechnicalData[dataType].data];
    return data.sort((a, b) => {
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

  // Filter data
  const filteredData = getSortedData().filter(data =>
    data.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    data.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Format property values
  const formatProperty = (value, property) => {
    if (typeof value === 'number') {
      if (property.includes('depth') || property.includes('thickness')) {
        return `${value.toFixed(1)} m`;
      } else if (property.includes('shearStrength')) {
        return `${value.toFixed(1)} kPa`;
      } else if (property.includes('qc')) {
        return `${value.toFixed(1)} MPa`;
      } else if (property.includes('fs')) {
        return `${value.toFixed(2)} MPa`;
      }
      return `${value.toFixed(1)}`;
    }
    return value;
  };

  // Generate chart data
  const getChartData = () => {
    if (!selectedData || !analysisResults) return null;

    if (dataType === 'borehole_logs' && analysisResults.filteredLayers) {
      const layers = analysisResults.filteredLayers.filter(layer => typeof layer.shearStrength === 'number'); // Ensure shearStrength is a number
      // Create a depth profile for shear strength
      const chartDataPoints = layers.map(layer => ({
        x: layer.shearStrength, // Shear strength on X-axis
        y: layer.depth + layer.thickness / 2 // Mid-depth of layer on Y-axis
      }));

      return {
        datasets: [
          {
            label: 'Shear Strength (kPa)',
            data: chartDataPoints,
            borderColor: '#64ffda',
            backgroundColor: 'rgba(100, 255, 218, 0.5)',
            showLine: true, // Draw line connecting points
            pointRadius: 5,
            tension: 0.1,
          },
        ],
      };
    } else if (dataType === 'cpt_data' && analysisResults.filteredMeasurements) {
      const measurements = analysisResults.filteredMeasurements;
      return {
        labels: measurements.map(m => m.depth.toFixed(1)),
        datasets: [
          {
            label: 'Cone Resistance (qc, MPa)',
            data: measurements.map(m => m.qc),
            borderColor: '#64ffda',
            yAxisID: 'y-qc',
            fill: false,
            tension: 0.1,
          },
          {
            label: 'Sleeve Friction (fs, MPa)',
            data: measurements.map(m => m.fs),
            borderColor: '#ff6b6b',
            yAxisID: 'y-fs',
            fill: false,
            tension: 0.1,
          },
          // Example: Add SBT as a scatter plot or another line if it were numeric
        ],
      };
    } else if (dataType === 'soil_profiles' && analysisResults.filteredLayers) {
      const layers = analysisResults.filteredLayers;
      return {
        labels: layers.map(layer => layer.soilType),
        datasets: [
          {
            label: 'Layer Thickness (m)',
            data: layers.map(layer => layer.thickness),
            backgroundColor: ['#64ffda', '#ff6b6b'],
          },
        ],
      };
    }
    return null;
  };

  const analysisResults = selectedData ? analyzeData(selectedData, analysisInputs) : null;

  return (
    <div className="geotechnical-data-visualizer">
      <h2>Geotechnical Data Visualizer</h2>

      <div className="controls">
        <div className="data-type-select">
          <label>Data Type:</label>
          <select
            value={dataType}
            onChange={e => {
              setDataType(e.target.value);
              setSelectedData(null);
            }}
          >
            {Object.entries(geotechnicalData).map(([key, value]) => (
              <option key={key} value={key}>{value.name}</option>
            ))}
          </select>
        </div>

        <div className="search-box">
          <label>Search:</label>
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search by ID or location..."
          />
        </div>
      </div>

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('id')}>
                ID
                {sortField === 'id' && (
                  <span className="sort-indicator">
                    {sortOrder === 'asc' ? ' ↑' : ' ↓'}
                  </span>
                )}
              </th>
              <th onClick={() => handleSort('location')}>
                Location
                {sortField === 'location' && (
                  <span className="sort-indicator">
                    {sortOrder === 'asc' ? ' ↑' : ' ↓'}
                  </span>
                )}
              </th>
              <th onClick={() => handleSort('totalDepth')}>
                Total Depth (m)
                {sortField === 'totalDepth' && (
                  <span className="sort-indicator">
                    {sortOrder === 'asc' ? ' ↑' : ' ↓'}
                  </span>
                )}
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map(data => (
              <tr
                key={data.id}
                className={selectedData?.id === data.id ? 'selected' : ''}
              >
                <td>{data.id}</td>
                <td>{data.location}</td>
                <td>{formatProperty(data.totalDepth, 'totalDepth')}</td>
                <td>
                  <button
                    className="view-details-btn"
                    onClick={() => handleDataSelect(data)}
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedData && (
        <div className="data-details">
          <h3>Data Details: {selectedData.id}</h3>

          <div className="properties-grid">
            <div className="property-item">
              <span className="property-label">ID:</span>
              <span className="property-value">{selectedData.id}</span>
            </div>
            <div className="property-item">
              <span className="property-label">Location:</span>
              <span className="property-value">{selectedData.location}</span>
            </div>
            <div className="property-item">
              <span className="property-label">Total Depth:</span>
              <span className="property-value">
                {formatProperty(selectedData.totalDepth, 'totalDepth')}
              </span>
            </div>
          </div>

          <div className="analysis-section">
            <h4>Data Analysis</h4>
            <div className="analysis-inputs">
              <div className="input-group">
                <label>Depth Range (m):</label>
                <input
                  type="number"
                  value={analysisInputs.depthRange[0]}
                  onChange={e =>
                    handleAnalysisInputChange('depthRange', [
                      parseFloat(e.target.value),
                      analysisInputs.depthRange[1],
                    ])
                  }
                  min="0"
                  step="0.1"
                />
                <input
                  type="number"
                  value={analysisInputs.depthRange[1]}
                  onChange={e =>
                    handleAnalysisInputChange('depthRange', [
                      analysisInputs.depthRange[0],
                      parseFloat(e.target.value),
                    ])
                  }
                  min="0"
                  step="0.1"
                />
              </div>
              <div className="input-group">
                <label>Soil Type:</label>
                <select
                  value={analysisInputs.soilType}
                  onChange={e => handleAnalysisInputChange('soilType', e.target.value)}
                >
                  <option value="all">All</option>
                  <option value="Clay">Clay</option>
                  <option value="Sand">Sand</option>
                  <option value="Silt">Silt</option>
                  <option value="Gravel">Gravel</option>
                </select>
              </div>
            </div>

            {analysisResults && (
              <div className="analysis-results">
                <h5>Results</h5>
                <div className="results-grid">
                  {dataType === 'borehole_logs' && (
                    <>
                      <div className="result-item">
                        <span className="result-label">Total Thickness (in range):</span>
                        <span className="result-value">
                          {formatProperty(analysisResults.totalThickness, 'thickness')}
                        </span>
                      </div>
                      <div className="result-item">
                        <span className="result-label">Weighted Avg Shear Strength:</span>
                        <span className="result-value">
                          {formatProperty(analysisResults.avgShearStrength, 'shearStrength')}
                        </span>
                      </div>
                    </>
                  )}
                  {dataType === 'cpt_data' && (
                    <>
                      <div className="result-item">
                        <span className="result-label">Avg Cone Resistance (qc):</span>
                        <span className="result-value">
                          {formatProperty(analysisResults.avgQc, 'qc')}
                        </span>
                      </div>
                      <div className="result-item">
                        <span className="result-label">Min qc:</span>
                        <span className="result-value">
                          {formatProperty(analysisResults.minQc, 'qc')}
                        </span>
                      </div>
                      <div className="result-item">
                        <span className="result-label">Max qc:</span>
                        <span className="result-value">
                          {formatProperty(analysisResults.maxQc, 'qc')}
                        </span>
                      </div>
                      <div className="result-item">
                        <span className="result-label">StdDev qc:</span>
                        <span className="result-value">
                          {formatProperty(analysisResults.stdDevQc, 'qc')}
                        </span>
                      </div>
                      <div className="result-item">
                        <span className="result-label">Avg Sleeve Friction (fs):</span>
                        <span className="result-value">
                          {formatProperty(analysisResults.avgFs, 'fs')}
                        </span>
                      </div>
                      <div className="result-item">
                        <span className="result-label">Min fs:</span>
                        <span className="result-value">
                          {formatProperty(analysisResults.minFs, 'fs')}
                        </span>
                      </div>
                      <div className="result-item">
                        <span className="result-label">Max fs:</span>
                        <span className="result-value">
                          {formatProperty(analysisResults.maxFs, 'fs')}
                        </span>
                      </div>
                      <div className="result-item">
                        <span className="result-label">StdDev fs:</span>
                        <span className="result-value">
                          {formatProperty(analysisResults.stdDevFs, 'fs')}
                        </span>
                      </div>
                       {/* Display SBT for the first few points as an example */}
                       {analysisResults.filteredMeasurements && analysisResults.filteredMeasurements.slice(0, 3).map((m, idx) => (
                        <div className="result-item" key={`sbt-${idx}`}>
                          <span className="result-label">SBT @ {m.depth.toFixed(1)}m:</span>
                          <span className="result-value">{m.sbt}</span>
                        </div>
                      ))}
                    </>
                  )}
                  {dataType === 'soil_profiles' && (
                    <div className="result-item">
                      <span className="result-label">Total Thickness:</span>
                      <span className="result-value">
                        {formatProperty(analysisResults.totalThickness, 'thickness')}
                      </span>
                    </div>
                  )}
                </div>

                <div className="visualization-chart">
                  <Chart
                    type={dataType === 'borehole_logs' ? 'scatter' : (dataType === 'cpt_data' ? 'line' : 'bar')} // Use scatter for borehole profile
                    data={getChartData()}
                    options={{
                      responsive: true,
                      scales: {
                        y: { // Default Y axis for bar charts (thickness) or Depth for profile plots
                          beginAtZero: dataType !== 'borehole_logs', // Don't force beginAtZero for depth profile
                          reverse: dataType === 'borehole_logs', // Reverse Y-axis for depth
                          title: {
                            display: true,
                            text: dataType === 'borehole_logs' ? 'Depth (m)' : (dataType === 'cpt_data' ? 'Value' : 'Thickness (m)'),
                          },
                        },
                        'y-qc': { // Specific Y axis for qc in CPT
                          type: 'linear',
                          display: dataType === 'cpt_data',
                          position: 'left',
                          title: {
                            display: true,
                            text: 'Cone Resistance (qc, MPa)',
                          },
                          grid: {
                            drawOnChartArea: false, // only draw grid for the first Y axis
                          },
                        },
                        'y-fs': { // Specific Y axis for fs in CPT
                          type: 'linear',
                          display: dataType === 'cpt_data',
                          position: 'right',
                          title: {
                            display: true,
                            text: 'Sleeve Friction (fs, MPa)',
                          },
                          grid: {
                            drawOnChartArea: false,
                          },
                        },
                        x: {
                          title: {
                            display: true,
                            text: dataType === 'borehole_logs' ? 'Shear Strength (kPa)' : (dataType === 'cpt_data' ? 'Depth (m)' : 'Soil Type'),
                          },
                        },
                      },
                      plugins: {
                        tooltip: {
                          callbacks: {
                            label: function(context) {
                              let label = context.dataset.label || '';
                              if (label) {
                                label += ': ';
                              }
                              if (dataType === 'borehole_logs' && context.parsed.x !== null && context.parsed.y !== null) {
                                label += `(Shear Strength: ${context.parsed.x.toFixed(1)} kPa, Depth: ${context.parsed.y.toFixed(1)} m)`;
                              } else if (context.parsed.y !== null) {
                                if (dataType === 'cpt_data') {
                                   label += `${context.parsed.y.toFixed(2)} MPa`;
                                   const sbt = analysisResults?.filteredMeasurements?.[context.dataIndex]?.sbt;
                                   if (sbt) {
                                     label += ` (SBT: ${sbt})`;
                                   }
                                } else {
                                   label += `${context.parsed.y.toFixed(1)} m`;
                                }
                              }
                              return label;
                            }
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

export default GeotechnicalDataVisualizer;