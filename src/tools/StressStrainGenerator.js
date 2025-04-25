import React, { useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Title,
  Legend,
  Filler
} from 'chart.js';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import './StressStrainGenerator.css';

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Title, Legend, Filler);

const materials = {
  'Structural Steel (S275)': {
    data: [
      { strain: 0, stress: 0 },
      { strain: 0.0013, stress: 275 },
      { strain: 0.002, stress: 275 },
      { strain: 0.01, stress: 400 },
      { strain: 0.05, stress: 450 },
    ],
    properties: {
      'Yield Strength': '275 MPa',
      'Ultimate Strength': '450 MPa',
      'Young\'s Modulus': '210 GPa',
      'Poisson\'s Ratio': '0.3',
      'Density': '7850 kg/m³'
    }
  },
  'Structural Steel (S355)': {
    data: [
      { strain: 0, stress: 0 },
      { strain: 0.0017, stress: 355 },
      { strain: 0.002, stress: 355 },
      { strain: 0.01, stress: 450 },
      { strain: 0.05, stress: 510 },
    ],
    properties: {
      'Yield Strength': '355 MPa',
      'Ultimate Strength': '510 MPa',
      'Young\'s Modulus': '210 GPa',
      'Poisson\'s Ratio': '0.3',
      'Density': '7850 kg/m³'
    }
  },
  'Aluminum 6061-T6': {
    data: [
      { strain: 0, stress: 0 },
      { strain: 0.002, stress: 240 },
      { strain: 0.01, stress: 300 },
      { strain: 0.05, stress: 350 },
    ],
    properties: {
      'Yield Strength': '240 MPa',
      'Ultimate Strength': '350 MPa',
      'Young\'s Modulus': '69 GPa',
      'Poisson\'s Ratio': '0.33',
      'Density': '2700 kg/m³'
    }
  },
  'Concrete (C30)': {
    data: [
      { strain: 0, stress: 0 },
      { strain: 0.001, stress: 20 },
      { strain: 0.002, stress: 30 },
      { strain: 0.0035, stress: 30 },
      { strain: 0.005, stress: 25 },
    ],
    properties: {
      'Compressive Strength': '30 MPa',
      'Tensile Strength': '2.9 MPa',
      'Young\'s Modulus': '30 GPa',
      'Poisson\'s Ratio': '0.2',
      'Density': '2400 kg/m³'
    }
  },
  'Timber (C24)': {
    data: [
      { strain: 0, stress: 0 },
      { strain: 0.002, stress: 24 },
      { strain: 0.01, stress: 30 },
      { strain: 0.02, stress: 35 },
    ],
    properties: {
      'Bending Strength': '24 MPa',
      'Tensile Strength': '14 MPa',
      'Compressive Strength': '21 MPa',
      'Young\'s Modulus': '11 GPa',
      'Density': '500 kg/m³'
    }
  }
};

const StressStrainGenerator = () => {
  const [selectedMaterial, setSelectedMaterial] = useState('Structural Steel (S355)');
  const [customData, setCustomData] = useState([]);
  const [isCustom, setIsCustom] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const [showProperties, setShowProperties] = useState(true);
  const [strainInput, setStrainInput] = useState('');
  const [stressInput, setStressInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: {
            size: 14
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `Stress: ${context.parsed.y.toFixed(2)} MPa, Strain: ${context.parsed.x.toFixed(4)}`;
          }
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Strain (mm/mm)',
          font: {
            size: 14,
            weight: 'bold'
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        }
      },
      y: {
        title: {
          display: true,
          text: 'Stress (MPa)',
          font: {
            size: 14,
            weight: 'bold'
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        }
      }
    }
  };

  const handleMaterialChange = (e) => {
    setSelectedMaterial(e.target.value);
    setIsCustom(false);
    setCustomData([]);
    setEditIndex(null);
  };

  const handleAddData = () => {
    if (!strainInput || !stressInput) return;
    const newData = [...customData, { strain: parseFloat(strainInput), stress: parseFloat(stressInput) }];
    newData.sort((a, b) => a.strain - b.strain);
    setCustomData(newData);
    setIsCustom(true);
    setEditIndex(null);
    setStrainInput('');
    setStressInput('');
  };

  const handleEditData = (index) => {
    const dataPoint = customData[index];
    setStrainInput(dataPoint.strain.toString());
    setStressInput(dataPoint.stress.toString());
    setEditIndex(index);
  };

  const handleSaveEdit = () => {
    if (!strainInput || !stressInput || editIndex === null) return;
    const updatedData = [...customData];
    updatedData[editIndex] = { strain: parseFloat(strainInput), stress: parseFloat(stressInput) };
    updatedData.sort((a, b) => a.strain - b.strain);
    setCustomData(updatedData);
    setEditIndex(null);
    setStrainInput('');
    setStressInput('');
  };

  const handleDeleteData = (index) => {
    const updatedData = customData.filter((_, i) => i !== index);
    setCustomData(updatedData);
    if (updatedData.length === 0) {
      setIsCustom(false);
    }
  };

  const handleExportData = async (format) => {
    setIsLoading(true);
    const exportData = isCustom ? customData : materials[selectedMaterial].data;
    
    if (format === 'csv') {
      const csvContent = [
        ['Strain', 'Stress'],
        ...exportData.map((point) => [point.strain, point.stress]),
      ]
        .map((e) => e.join(','))
        .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${isCustom ? 'custom_data' : selectedMaterial}_data.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (format === 'pdf') {
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(16);
      doc.text('Stress-Strain Data Report', 14, 15);
      
      // Add material information
      doc.setFontSize(12);
      doc.text(`Material: ${selectedMaterial}`, 14, 25);
      doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 32);
      
      // Add properties if available
      let yPos = 40;
      if (!isCustom) {
        doc.setFontSize(10);
        Object.entries(materials[selectedMaterial].properties).forEach(([key, value]) => {
          doc.text(`${key}: ${value}`, 14, yPos);
          yPos += 7;
        });
      }
      
      // Add data table
      const tableData = exportData.map(point => [
        point.strain.toFixed(4),
        point.stress.toFixed(2)
      ]);
      
      autoTable(doc, {
        startY: yPos + 10,
        head: [['Strain (mm/mm)', 'Stress (MPa)']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185] },
        styles: { fontSize: 10 }
      });
      
      // Add chart image
      const chartCanvas = document.querySelector('canvas');
      if (chartCanvas) {
        const chartImage = chartCanvas.toDataURL('image/png');
        const imgWidth = 180;
        const imgHeight = (chartCanvas.height * imgWidth) / chartCanvas.width;
        doc.addImage(chartImage, 'PNG', 14, doc.lastAutoTable.finalY + 10, imgWidth, imgHeight);
      }
      
      // Save the PDF
      doc.save(`${isCustom ? 'custom_data' : selectedMaterial}_report.pdf`);
    }
    setIsLoading(false);
  };

  const data = {
    labels: (isCustom ? customData : materials[selectedMaterial].data).map((d) => d.strain),
    datasets: [
      {
        label: `${isCustom ? 'Custom Data' : selectedMaterial} Stress-Strain Curve`,
        data: (isCustom ? customData : materials[selectedMaterial].data).map((d) => d.stress),
        borderColor: 'rgba(59, 130, 246, 1)',
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderWidth: 2,
        pointRadius: 4,
        fill: true,
        tension: 0.4
      },
    ],
  };

  return (
    <div className="stress-strain-generator">
      <div className="header">
        <h1>Engineering Stress-Strain Diagram Generator</h1>
        <p className="subtitle">Generate and analyze stress-strain curves for common construction materials</p>
      </div>

      <div className="main-content">
        <div className="controls-section">
          <div className="material-selector">
            <h2>Material Properties</h2>
            <select onChange={handleMaterialChange} value={selectedMaterial}>
              {Object.keys(materials).map((material) => (
                <option key={material} value={material}>
                  {material}
                </option>
              ))}
            </select>
            
            {showProperties && (
              <div className="material-properties">
                <h3>Material Properties</h3>
                <div className="properties-grid">
                  {Object.entries(materials[selectedMaterial].properties).map(([key, value]) => (
                    <div key={key} className="property-item">
                      <span className="property-label">{key}:</span>
                      <span className="property-value">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="custom-data-section">
            <h2>Custom Data Points</h2>
            <div className="custom-input">
              <div className="input-group">
                <label>
                  Strain (mm/mm):
                  <input 
                    type="number" 
                    step="0.0001" 
                    value={strainInput}
                    onChange={(e) => setStrainInput(e.target.value)}
                    placeholder="e.g., 0.002"
                  />
                </label>
              </div>
              <div className="input-group">
                <label>
                  Stress (MPa):
                  <input 
                    type="number" 
                    step="1" 
                    value={stressInput}
                    onChange={(e) => setStressInput(e.target.value)}
                    placeholder="e.g., 300"
                  />
                </label>
              </div>
              <div className="button-group">
                {editIndex === null ? (
                  <button 
                    className="primary" 
                    onClick={handleAddData}
                    disabled={!strainInput || !stressInput}
                  >
                    Add Data Point
                  </button>
                ) : (
                  <button 
                    className="primary" 
                    onClick={handleSaveEdit}
                    disabled={!strainInput || !stressInput}
                  >
                    Save Edit
                  </button>
                )}
                {editIndex !== null && (
                  <button 
                    className="secondary" 
                    onClick={() => {
                      setStrainInput('');
                      setStressInput('');
                      setEditIndex(null);
                    }}
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
            </div>

            {customData.length > 0 && (
              <div className="data-table">
                <table>
                  <thead>
                    <tr>
                      <th>Strain (mm/mm)</th>
                      <th>Stress (MPa)</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customData.map((point, index) => (
                      <tr key={index}>
                        <td>{point.strain.toFixed(4)}</td>
                        <td>{point.stress.toFixed(2)}</td>
                        <td>
                          <div className="button-group">
                            <button 
                              className="secondary" 
                              onClick={() => handleEditData(index)}
                              disabled={editIndex !== null}
                            >
                              Edit
                            </button>
                            <button 
                              className="danger" 
                              onClick={() => handleDeleteData(index)}
                              disabled={editIndex !== null}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="chart-section">
          <div className="chart-container">
            <Line data={data} options={chartOptions} />
          </div>
          <div className="chart-actions">
            <div className="button-group">
              <button 
                className="primary" 
                onClick={() => handleExportData('pdf')}
                disabled={isLoading}
              >
                {isLoading ? 'Exporting...' : 'Export PDF'}
              </button>
              <button 
                className="secondary" 
                onClick={() => handleExportData('csv')}
                disabled={isLoading}
              >
                Export CSV
              </button>
            </div>
            <button 
              className="secondary" 
              onClick={() => setShowProperties(!showProperties)}
            >
              {showProperties ? 'Hide Properties' : 'Show Properties'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StressStrainGenerator;
