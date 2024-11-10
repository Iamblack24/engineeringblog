// src/pages/PileDesignTool.js
import React, { useState } from 'react';
import './PileDesignTool.css';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  BarElement,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  BarElement,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend
);

const PileDesignTool = () => {
  // State Definitions
  const [input, setInput] = useState({
    // Structural Loads
    deadLoad: '',
    liveLoad: '',
    windLoad: '',
    seismicLoad: '',

    // Geotechnical Data
    cohesion: '',
    frictionAngle: '',
    shearStrength: '',
    waterTableLevel: '',
    soilLayers: [
      // Example: { depth: 5, cohesion: 25, frictionAngle: 30, unitWeight: 18 }
    ],

    // Pile Properties
    pileType: 'driven', // Options: driven, bored, screw, micropiles
    pileDiameter: '',
    pileLength: '',
    pileSpacing: '',
    numberOfPiles: 1,

    // Design Codes
    designCode: 'Eurocode', // Options: Eurocode, AASHTO, IS Codes

    // Safety Factors
    factorOfSafety: '3',
  });

  const [results, setResults] = useState({
    Q_skin: null,
    Q_end: null,
    Q_ult: null,
    Q_design: null,
    settlement: null,
    groupEfficiency: null,
    axialLoad: null,
    shearForce: null,
    bendingMoment: null,
  });

  const [chartsData, setChartsData] = useState({
    loadDistribution: null,
    settlementCurve: null,
  });

  // Handle Input Changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setInput({
      ...input,
      [name]: value,
    });
  };

  // Handle Soil Layers Change
  const handleSoilLayerChange = (index, e) => {
    const { name, value } = e.target;
    const updatedSoilLayers = input.soilLayers.map((layer, idx) => {
      if (idx === index) {
        return { ...layer, [name]: value };
      }
      return layer;
    });
    setInput({ ...input, soilLayers: updatedSoilLayers });
  };

  // Add Soil Layer
  const addSoilLayer = () => {
    setInput({
      ...input,
      soilLayers: [
        ...input.soilLayers,
        { depth: '', cohesion: '', frictionAngle: '', unitWeight: '' },
      ],
    });
  };

  // Remove Soil Layer
  const removeSoilLayer = (index) => {
    const updatedSoilLayers = input.soilLayers.filter((_, idx) => idx !== index);
    setInput({ ...input, soilLayers: updatedSoilLayers });
  };

  // Calculate Ultimate Pile Capacity
  const calculateUltimateCapacity = (params) => {
    const { pileType, soilProperties, pileDimensions, safetyFactors } = params;

    let alpha;
    switch (pileType) {
      case 'driven':
        alpha = 1.0;
        break;
      case 'bored':
        alpha = 0.8;
        break;
      // Add other cases
      default:
        alpha = 1.0;
    }

    const Q_skin = alpha * soilProperties.shearStrength * Math.PI * pileDimensions.length;
    const Q_end = soilProperties.shearStrength * Math.PI * Math.pow(pileDimensions.diameter / 2, 2);
    const Q_ult = Q_skin + Q_end;
    const Q_design = Q_ult / safetyFactors.factorOfSafety;

    return {
      Q_skin,
      Q_end,
      Q_ult,
      Q_design,
    };
  };

  // Calculate Settlement
  const calculateSettlement = () => {
    const { pileLength, pileDiameter, soilLayers } = input;
    const D = parseFloat(pileDiameter);
    const L = parseFloat(pileLength);

    // Example: Using first soil layer's elastic modulus E
    const soil = soilLayers[0];
    const E = soil ? parseFloat(soil.unitWeight) * 100 : 20000; // Placeholder for Elastic Modulus

    const appliedLoad = parseFloat(input.deadLoad) + parseFloat(input.liveLoad);
    const settlement = (appliedLoad * L) / (E * Math.PI * Math.pow(D, 2) / 4);

    return settlement;
  };

  // Calculate Group Pile Efficiency
  const calculateGroupEfficiency = () => {
    const { pileSpacing, pileDiameter, numberOfPiles } = input;
    const S = parseFloat(pileSpacing);
    const D = parseFloat(pileDiameter);
    const N = parseInt(numberOfPiles, 10);

    // Example formula for group efficiency
    const efficiency = 1 - (S / (3 * D)) * N;
    const groupEfficiency = efficiency > 0 ? efficiency : 0;

    return groupEfficiency;
  };

  // Handle Form Submission
  const handleSubmit = (e) => {
    e.preventDefault();

    // Capacity Analysis
    const capacity = calculateUltimateCapacity();

    // Settlement Analysis
    const settlement = calculateSettlement();

    // Group Pile Efficiency
    const groupEfficiency = calculateGroupEfficiency();

    // Structural Design (Placeholder for actual calculations)
    const axialLoad = capacity.Q_design * groupEfficiency;
    const shearForce = axialLoad * 0.3; // Example
    const bendingMoment = axialLoad * 0.2; // Example

    setResults({
      Q_skin: capacity.Q_skin.toFixed(2),
      Q_end: capacity.Q_end.toFixed(2),
      Q_ult: capacity.Q_ult.toFixed(2),
      Q_design: capacity.Q_design.toFixed(2),
      settlement: settlement.toFixed(2),
      groupEfficiency: (groupEfficiency * 100).toFixed(2),
      axialLoad: axialLoad.toFixed(2),
      shearForce: shearForce.toFixed(2),
      bendingMoment: bendingMoment.toFixed(2),
    });

    // Prepare Charts Data
    prepareCharts(capacity, settlement);
  };

  // Prepare Charts Data
  const prepareCharts = (capacity, settlement) => {
    // Load Distribution Chart
    const loadDistributionData = {
      labels: ['Skin Friction (Q_skin)', 'End Bearing (Q_end)', 'Ultimate Capacity (Q_ult)', 'Design Capacity (Q_design)'],
      datasets: [
        {
          label: 'Load Distribution (kN)',
          data: [capacity.Q_skin, capacity.Q_end, capacity.Q_ult, capacity.Q_design],
          backgroundColor: [
            'rgba(75, 192, 192, 0.6)',
            'rgba(153, 102, 255, 0.6)',
            'rgba(255, 206, 86, 0.6)',
            'rgba(255, 99, 132, 0.6)',
          ],
          borderColor: [
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(255, 99, 132, 1)',
          ],
          borderWidth: 1,
        },
      ],
    };

    // Settlement Curve Chart (Simple Representation)
    const settlementCurveData = {
      labels: ['Initial Settlement', 'Final Settlement'],
      datasets: [
        {
          label: 'Settlement (mm)',
          data: [0, parseFloat(results.settlement || settlement.toFixed(2))],
          fill: false,
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(54, 162, 235, 1)',
        },
      ],
    };

    setChartsData({
      loadDistribution: loadDistributionData,
      settlementCurve: settlementCurveData,
    });
  };

  return (
    <div className="pile-design-tool">
      <h1>Pile Design Tool</h1>
      <form onSubmit={handleSubmit}>
        {/* Structural Loads */}
        <div className="form-group">
          <h2>Structural Loads (kN)</h2>
          <label htmlFor="deadLoad">Dead Load:</label>
          <input
            type="number"
            id="deadLoad"
            name="deadLoad"
            value={input.deadLoad}
            onChange={handleChange}
            placeholder="Enter Dead Load"
            required
          />

          <label htmlFor="liveLoad">Live Load:</label>
          <input
            type="number"
            id="liveLoad"
            name="liveLoad"
            value={input.liveLoad}
            onChange={handleChange}
            placeholder="Enter Live Load"
            required
          />

          <label htmlFor="windLoad">Wind Load:</label>
          <input
            type="number"
            id="windLoad"
            name="windLoad"
            value={input.windLoad}
            onChange={handleChange}
            placeholder="Enter Wind Load"
          />

          <label htmlFor="seismicLoad">Seismic Load:</label>
          <input
            type="number"
            id="seismicLoad"
            name="seismicLoad"
            value={input.seismicLoad}
            onChange={handleChange}
            placeholder="Enter Seismic Load"
          />
        </div>

        {/* Geotechnical Data */}
        <div className="form-group">
          <h2>Geotechnical Data</h2>
          <label htmlFor="soilType">Soil Type:</label>
          <select
            id="soilType"
            name="soilType"
            value={input.soilType}
            onChange={handleChange}
            required
          >
            <option value="">Select Soil Type</option>
            <option value="cohesive">Cohesive</option>
            <option value="cohesionless">Cohesionless</option>
          </select>

          {/* Cohesive Soils */}
          {input.soilType === 'cohesive' && (
            <>
              <label htmlFor="cohesion">Cohesion (kPa):</label>
              <input
                type="number"
                id="cohesion"
                name="cohesion"
                value={input.cohesion}
                onChange={handleChange}
                placeholder="Enter Cohesion"
                required
              />
            </>
          )}

          {/* Cohesionless Soils */}
          {input.soilType === 'cohesionless' && (
            <>
              <label htmlFor="shearStrength">Shear Strength (kPa):</label>
              <input
                type="number"
                id="shearStrength"
                name="shearStrength"
                value={input.shearStrength}
                onChange={handleChange}
                placeholder="Enter Shear Strength"
                required
              />

              <label htmlFor="frictionAngle">Friction Angle (degrees):</label>
              <input
                type="number"
                id="frictionAngle"
                name="frictionAngle"
                value={input.frictionAngle}
                onChange={handleChange}
                placeholder="Enter Friction Angle"
                required
              />
            </>
          )}

          <label htmlFor="waterTableLevel">Water Table Level (m):</label>
          <input
            type="number"
            id="waterTableLevel"
            name="waterTableLevel"
            value={input.waterTableLevel}
            onChange={handleChange}
            placeholder="Enter Water Table Level"
            required
          />

          {/* Soil Layers */}
          <h3>Layered Soil Profiles</h3>
          {input.soilLayers.map((layer, index) => (
            <div key={index} className="soil-layer">
              <h4>Layer {index + 1}</h4>
              <label htmlFor={`depth_${index}`}>Depth (m):</label>
              <input
                type="number"
                id={`depth_${index}`}
                name="depth"
                value={layer.depth}
                onChange={(e) => handleSoilLayerChange(index, e)}
                placeholder="Enter Depth"
                required
              />

              <label htmlFor={`cohesion_${index}`}>Cohesion (kPa):</label>
              <input
                type="number"
                id={`cohesion_${index}`}
                name="cohesion"
                value={layer.cohesion}
                onChange={(e) => handleSoilLayerChange(index, e)}
                placeholder="Enter Cohesion"
              />

              <label htmlFor={`frictionAngle_${index}`}>Friction Angle (degrees):</label>
              <input
                type="number"
                id={`frictionAngle_${index}`}
                name="frictionAngle"
                value={layer.frictionAngle}
                onChange={(e) => handleSoilLayerChange(index, e)}
                placeholder="Enter Friction Angle"
              />

              <label htmlFor={`unitWeight_${index}`}>Unit Weight (kN/m³):</label>
              <input
                type="number"
                id={`unitWeight_${index}`}
                name="unitWeight"
                value={layer.unitWeight}
                onChange={(e) => handleSoilLayerChange(index, e)}
                placeholder="Enter Unit Weight"
              />

              <button type="button" onClick={() => removeSoilLayer(index)}>
                Remove Layer
              </button>
            </div>
          ))}
          <button type="button" onClick={addSoilLayer}>
            Add Soil Layer
          </button>
        </div>

        {/* Pile Properties */}
        <div className="form-group">
          <h2>Pile Properties</h2>
          <label htmlFor="pileType">Pile Type:</label>
          <select
            id="pileType"
            name="pileType"
            value={input.pileType}
            onChange={handleChange}
            required
          >
            <option value="">Select Pile Type</option>
            <option value="driven">Driven</option>
            <option value="bored">Bored</option>
            <option value="screw">Screw</option>
            <option value="micropiles">Micropiles</option>
          </select>

          <label htmlFor="pileDiameter">Pile Diameter (m):</label>
          <input
            type="number"
            id="pileDiameter"
            name="pileDiameter"
            value={input.pileDiameter}
            onChange={handleChange}
            placeholder="Enter Pile Diameter"
            required
          />

          <label htmlFor="pileLength">Pile Length (m):</label>
          <input
            type="number"
            id="pileLength"
            name="pileLength"
            value={input.pileLength}
            onChange={handleChange}
            placeholder="Enter Pile Length"
            required
          />

          <label htmlFor="pileSpacing">Pile Spacing (m):</label>
          <input
            type="number"
            id="pileSpacing"
            name="pileSpacing"
            value={input.pileSpacing}
            onChange={handleChange}
            placeholder="Enter Pile Spacing"
          />

          <label htmlFor="numberOfPiles">Number of Piles:</label>
          <input
            type="number"
            id="numberOfPiles"
            name="numberOfPiles"
            value={input.numberOfPiles}
            onChange={handleChange}
            placeholder="Enter Number of Piles"
            min="1"
            required
          />
        </div>

        {/* Design Codes */}
        <div className="form-group">
          <h2>Design Codes</h2>
          <label htmlFor="designCode">Select Design Code:</label>
          <select
            id="designCode"
            name="designCode"
            value={input.designCode}
            onChange={handleChange}
            required
          >
            <option value="">Select Design Code</option>
            <option value="Eurocode">Eurocode</option>
            <option value="AASHTO">AASHTO</option>
            <option value="ISCodes">IS Codes</option>
          </select>
        </div>

        {/* Safety Factors */}
        <div className="form-group">
          <h2>Safety Factors</h2>
          <label htmlFor="factorOfSafety">Factor of Safety:</label>
          <input
            type="number"
            id="factorOfSafety"
            name="factorOfSafety"
            value={input.factorOfSafety}
            onChange={handleChange}
            placeholder="Enter Factor of Safety"
            required
            min="1"
            step="0.1"
          />
        </div>

        {/* Submit Button */}
        <button type="submit">Calculate</button>
      </form>

      {/* Results Display */}
      {results.Q_design && (
        <div className="results">
          <h2>Capacity Analysis</h2>
          <p><strong>Skin Friction (Q_skin):</strong> {results.Q_skin} kN</p>
          <p><strong>End Bearing (Q_end):</strong> {results.Q_end} kN</p>
          <p><strong>Ultimate Capacity (Q_ult):</strong> {results.Q_ult} kN</p>
          <p><strong>Design Capacity (Q_design):</strong> {results.Q_design} kN</p>

          <h2>Settlement Analysis</h2>
          <p><strong>Settlement:</strong> {results.settlement} mm</p>

          <h2>Group Pile Efficiency</h2>
          <p><strong>Efficiency:</strong> {results.groupEfficiency}%</p>

          <h2>Structural Design</h2>
          <p><strong>Axial Load:</strong> {results.axialLoad} kN</p>
          <p><strong>Shear Force:</strong> {results.shearForce} kN</p>
          <p><strong>Bending Moment:</strong> {results.bendingMoment} kN·m</p>
        </div>
      )}

      {/* Charts */}
      {chartsData.loadDistribution && (
        <div className="chart-container">
          <h2>Load Distribution</h2>
          <Bar
            data={chartsData.loadDistribution}
            options={{
              responsive: true,
              plugins: {
                legend: { position: 'top' },
                title: { display: true, text: 'Load Distribution' },
              },
              scales: {
                y: { beginAtZero: true },
              },
            }}
          />
        </div>
      )}

      {chartsData.settlementCurve && (
        <div className="chart-container">
          <h2>Settlement Curve</h2>
          <Line
            data={chartsData.settlementCurve}
            options={{
              responsive: true,
              plugins: {
                legend: { position: 'top' },
                title: { display: true, text: 'Settlement Curve' },
              },
              scales: {
                y: { beginAtZero: true },
              },
            }}
          />
        </div>
      )}
    </div>
  );
};

export default PileDesignTool;