// src/pages/PileDesignTool.js
import React, { useState } from 'react';
import './PileDesignTool.css';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const PileDesignTool = () => {
  const [input, setInput] = useState({
    load: '',
    soilBearingCapacity: '',
    pileDiameter: '',
    pileLength: '',
    soilUnitWeight: '',
    cohesion: '',
    adhesionFactor: '0.5',
    factorOfSafety: '3',
  });

  const [result, setResult] = useState(null);

  const handleChange = (e) => {
    setInput({
      ...input,
      [e.target.name]: e.target.value,
    });
  };

  const calculatePileCapacity = (e) => {
    e.preventDefault();

    const {
      load,
      soilBearingCapacity,
      pileDiameter,
      pileLength,
      cohesion,
      adhesionFactor,
      factorOfSafety,
    } = input;

    // Input Validation
    if (
      !load ||
      !soilBearingCapacity ||
      !pileDiameter ||
      !pileLength ||
      !cohesion
    ) {
      alert('Please fill in all fields.');
      return;
    }

    // Convert inputs to numbers
    const P = parseFloat(load); // Applied Load (kN)
    const q_allow = parseFloat(soilBearingCapacity); // Allowable Soil Bearing Capacity (kN/m²)
    const D = parseFloat(pileDiameter); // Pile Diameter (m)
    const L = parseFloat(pileLength); // Pile Length (m)
    const c = parseFloat(cohesion); // Cohesion (kN/m²)
    const α = parseFloat(adhesionFactor); // Adhesion Factor
    const FS = parseFloat(factorOfSafety); // Factor of Safety

    // Calculations

    // Area of Pile Base (A_end = π * (D/2)^2)
    const A_end = Math.PI * Math.pow(D / 2, 2);

    // Area of Pile Surface (A_surface = π * D * L)
    const A_surface = Math.PI * D * L;

    // End Bearing Capacity (Q_end = q_allow * A_end)
    const Q_end = q_allow * A_end;

    // Skin Friction Capacity (Q_skin = α * c * A_surface)
    const Q_skin = α * c * A_surface;

    // Total Pile Capacity (Q_total = Q_end + Q_skin)
    const Q_total = Q_end + Q_skin;

    // Adjusted Total Capacity with Factor of Safety (Q_total_FS = Q_total * FS)
    const Q_total_FS = Q_total * FS;

    // Capacity Sufficiency
    const isSufficient = Q_total_FS >= P;

    setResult({
      A_end: A_end.toFixed(2),
      A_surface: A_surface.toFixed(2),
      Q_end: Q_end.toFixed(2),
      Q_skin: Q_skin.toFixed(2),
      Q_total: Q_total.toFixed(2),
      Q_total_FS: Q_total_FS.toFixed(2),
      isSufficient: isSufficient ? 'Yes ✅' : 'No ❌',
    });
  };

  // Prepare Chart Data
  const chartData = result
    ? {
        labels: [
          'End Bearing Capacity (Q_end)',
          'Skin Friction Capacity (Q_skin)',
          'Total Capacity (Q_total)',
          'Applied Load (P)',
        ],
        datasets: [
          {
            label: 'Capacity (kN)',
            data: [
              parseFloat(result.Q_end),
              parseFloat(result.Q_skin),
              parseFloat(result.Q_total),
              parseFloat(input.load),
            ],
            backgroundColor: ['#64FFDA', '#FF6F61', '#6B5B95', '#FFA500'],
          },
        ],
      }
    : null;

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        enabled: true,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="pile-design-tool">
      <h1>Pile Design Tool</h1>
      <form onSubmit={calculatePileCapacity} className="pile-form">
        <div className="form-group">
          <label htmlFor="load">Applied Load (kN):</label>
          <input
            type="number"
            id="load"
            name="load"
            value={input.load}
            onChange={handleChange}
            required
            min="0"
            step="any"
            placeholder="e.g., 500"
          />
        </div>
        <div className="form-group">
          <label htmlFor="soilBearingCapacity">Allowable Soil Bearing Capacity (kN/m²):</label>
          <input
            type="number"
            id="soilBearingCapacity"
            name="soilBearingCapacity"
            value={input.soilBearingCapacity}
            onChange={handleChange}
            required
            min="0"
            step="any"
            placeholder="e.g., 150"
          />
        </div>
        <div className="form-group">
          <label htmlFor="pileDiameter">Pile Diameter (m):</label>
          <input
            type="number"
            id="pileDiameter"
            name="pileDiameter"
            value={input.pileDiameter}
            onChange={handleChange}
            required
            min="0"
            step="any"
            placeholder="e.g., 0.4"
          />
        </div>
        <div className="form-group">
          <label htmlFor="pileLength">Pile Length (m):</label>
          <input
            type="number"
            id="pileLength"
            name="pileLength"
            value={input.pileLength}
            onChange={handleChange}
            required
            min="0"
            step="any"
            placeholder="e.g., 10"
          />
        </div>
        <div className="form-group">
          <label htmlFor="soilUnitWeight">Soil Unit Weight (kN/m³):</label>
          <input
            type="number"
            id="soilUnitWeight"
            name="soilUnitWeight"
            value={input.soilUnitWeight}
            onChange={handleChange}
            required
            min="0"
            step="any"
            placeholder="e.g., 18"
          />
        </div>
        <div className="form-group">
          <label htmlFor="cohesion">Cohesion (c) (kN/m²):</label>
          <input
            type="number"
            id="cohesion"
            name="cohesion"
            value={input.cohesion}
            onChange={handleChange}
            required
            min="0"
            step="any"
            placeholder="e.g., 20"
          />
        </div>
        <div className="form-group">
          <label htmlFor="adhesionFactor">Adhesion Factor (α):</label>
          <select
            id="adhesionFactor"
            name="adhesionFactor"
            value={input.adhesionFactor}
            onChange={handleChange}
          >
            <option value="0.3">0.3</option>
            <option value="0.5">0.5</option>
            <option value="0.7">0.7</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="factorOfSafety">Factor of Safety:</label>
          <select
            id="factorOfSafety"
            name="factorOfSafety"
            value={input.factorOfSafety}
            onChange={handleChange}
          >
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
          </select>
        </div>
        <button type="submit" className="calculate-button">
          Calculate
        </button>
      </form>

      {result && (
        <div className="result">
          <h2>Calculation Results</h2>
          <p>
            <strong>Area of Pile Base (A_end) (m²):</strong> {result.A_end}
          </p>
          <p>
            <strong>Area of Pile Surface (A_surface) (m²):</strong> {result.A_surface}
          </p>
          <p>
            <strong>End Bearing Capacity (Q_end) (kN):</strong> {result.Q_end}
          </p>
          <p>
            <strong>Skin Friction Capacity (Q_skin) (kN):</strong> {result.Q_skin}
          </p>
          <p>
            <strong>Total Pile Capacity (Q_total) (kN):</strong> {result.Q_total}
          </p>
          <p>
            <strong>Adjusted Total Capacity with Factor of Safety (Q_total_FS) (kN):</strong> {result.Q_total_FS}
          </p>
          <p>
            <strong>Is the Pile Capacity Sufficient for the Applied Load?</strong> {result.isSufficient}
          </p>

          {/* Chart Section */}
          <div className="chart-container">
            <Bar data={chartData} options={chartOptions} />
          </div>
        </div>
      )}
    </div>
  );
};

export default PileDesignTool;