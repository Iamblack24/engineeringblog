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
} from 'chart.js';
import './StressStrainGenerator.css';

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Title);

const materials = {
  Steel: [
    { strain: 0, stress: 0 },
    { strain: 0.002, stress: 250 },
    { strain: 0.01, stress: 400 },
    { strain: 0.05, stress: 450 },
  ],
  Aluminum: [
    { strain: 0, stress: 0 },
    { strain: 0.005, stress: 150 },
    { strain: 0.02, stress: 300 },
    { strain: 0.06, stress: 350 },
  ],
  Concrete: [
    { strain: 0, stress: 0 },
    { strain: 0.001, stress: 30 },
    { strain: 0.003, stress: 40 },
    { strain: 0.005, stress: 35 },
  ],
  Wood: [
    { strain: 0, stress: 0 },
    { strain: 0.002, stress: 10 },
    { strain: 0.006, stress: 20 },
    { strain: 0.01, stress: 25 },
  ],
  HDPE: [
    { strain: 0, stress: 0 },
    { strain: 0.01, stress: 10 },
    { strain: 0.04, stress: 30 },
    { strain: 0.1, stress: 40 },
  ],
};

const StressStrainGenerator = () => {
  const [selectedMaterial, setSelectedMaterial] = useState('Steel');
  const [customData, setCustomData] = useState([]);
  const [isCustom, setIsCustom] = useState(false);
  const [editIndex, setEditIndex] = useState(null);

  const handleMaterialChange = (e) => {
    setSelectedMaterial(e.target.value);
    setIsCustom(false);
  };

  const handleAddData = (strain, stress) => {
    if (strain === '' || stress === '') return;
    const newData = [...customData, { strain: parseFloat(strain), stress: parseFloat(stress) }];
    newData.sort((a, b) => a.strain - b.strain); // Sort by strain
    setCustomData(newData);
    setIsCustom(true);
    setEditIndex(null);
  };

  const handleEditData = (index) => {
    const dataPoint = customData[index];
    document.getElementById('strainInput').value = dataPoint.strain;
    document.getElementById('stressInput').value = dataPoint.stress;
    setEditIndex(index);
  };

  const handleSaveEdit = (strain, stress) => {
    if (strain === '' || stress === '' || editIndex === null) return;
    const updatedData = [...customData];
    updatedData[editIndex] = { strain: parseFloat(strain), stress: parseFloat(stress) };
    updatedData.sort((a, b) => a.strain - b.strain); // Sort by strain
    setCustomData(updatedData);
    setEditIndex(null);
  };

  const handleDeleteData = (index) => {
    const updatedData = customData.filter((_, i) => i !== index);
    setCustomData(updatedData);
  };

  const handleExportData = () => {
    const exportData = isCustom ? customData : materials[selectedMaterial];
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
  };

  const data = {
    labels: (isCustom ? customData : materials[selectedMaterial]).map((d) => d.strain),
    datasets: [
      {
        label: `${isCustom ? 'Custom Data' : selectedMaterial} Stress-Strain Curve`,
        data: (isCustom ? customData : materials[selectedMaterial]).map((d) => d.stress),
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderWidth: 2,
        pointRadius: 4,
      },
    ],
  };

  return (
    <div className="stress-strain-generator">
      <h1>Stress-Strain Diagram Generator</h1>
      <div className="controls">
        <h2>Select Material</h2>
        <select onChange={handleMaterialChange} value={selectedMaterial}>
          {Object.keys(materials).map((material) => (
            <option key={material} value={material}>
              {material}
            </option>
          ))}
        </select>
        <h2>Add or Edit Custom Data</h2>
        <div className="custom-input">
          <label>
            Strain:
            <input type="number" step="0.001" id="strainInput" placeholder="e.g., 0.005" />
          </label>
          <label>
            Stress:
            <input type="number" step="1" id="stressInput" placeholder="e.g., 300" />
          </label>
          {editIndex === null ? (
            <button
              onClick={() =>
                handleAddData(
                  document.getElementById('strainInput').value,
                  document.getElementById('stressInput').value
                )
              }
            >
              Add Data Point
            </button>
          ) : (
            <button
              onClick={() =>
                handleSaveEdit(
                  document.getElementById('strainInput').value,
                  document.getElementById('stressInput').value
                )
              }
            >
              Save Edit
            </button>
          )}
        </div>
        <button onClick={handleExportData}>Export Data</button>
      </div>
      {isCustom && (
        <div className="custom-data-table">
          <h3>Custom Data Points</h3>
          <table>
            <thead>
              <tr>
                <th>Strain</th>
                <th>Stress</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customData.map((point, index) => (
                <tr key={index}>
                  <td>{point.strain}</td>
                  <td>{point.stress}</td>
                  <td>
                    <button onClick={() => handleEditData(index)}>Edit</button>
                    <button onClick={() => handleDeleteData(index)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="chart">
        <Line data={data} options={{ responsive: true, maintainAspectRatio: false }} />
      </div>
    </div>
  );
};

export default StressStrainGenerator;
