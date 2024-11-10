// RetainingWallDesignTool.js

import React, { useState } from 'react';
import './RetainingWallDesignTool.css';
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

const RetainingWallDesignTool = () => {
  const [input, setInput] = useState({
    // Input Parameters
    wallType: 'gravity', // Options: gravity, cantilever, counterfort, sheetPile
    soilDensity: '',
    cohesion: '',
    frictionAngle: '',
    bearingCapacity: '',
    waterTable: '',
    wallHeight: '',
    baseWidth: '',
    stemThickness: '',
    heel: '',
    toe: '',
    surchargeLoad: '',
    seismicForce: '',
    designCode: 'Eurocode', // Options: Eurocode, AASHTO, IS456
  });

  const [results, setResults] = useState({
    safetyFactorOverturning: null,
    safetyFactorSliding: null,
    safetyFactorBearing: null,
    earthPressure: null,
    bendingMoment: null,
    shearForce: null,
    settlement: null,
  });

  const [chartsData, setChartsData] = useState({
    earthPressureChart: null,
    stabilityResultsChart: null,
    structuralDesignChart: null,
  });

  // Handle Input Changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setInput({
      ...input,
      [name]: parseFloat(value) || value,
    });
  };

  // Calculate Stability Factors
  const calculateStability = () => {
    const {
      // wallType, // Removed unused variable
      soilDensity,
      cohesion,
      frictionAngle,
      bearingCapacity,
      wallHeight,
      baseWidth,
      stemThickness,
      heel,
      toe,
      surchargeLoad,
      seismicForce,
      designCode,
    } = input;

    // Convert degrees to radians for frictionAngle
    const phi = frictionAngle * (Math.PI / 180);

    // Design Code Safety Factors (example values)
    // let safetyFactorRequired; // Removed unused variable
    switch (designCode) {
      case 'Eurocode':
        // safetyFactorRequired = 1.5; // Removed unused variable
        break;
      case 'AASHTO':
        // safetyFactorRequired = 1.7; // Removed unused variable
        break;
      case 'IS456':
        // safetyFactorRequired = 1.6; // Removed unused variable
        break;
      default:
        // safetyFactorRequired = 1.5; // Removed unused variable
    }

    // Active Earth Pressure (Rankine)
    const ka = (1 - Math.sin(phi)) / (1 + Math.sin(phi));
    const earthPressureTotal = 0.5 * soilDensity * ka * Math.pow(wallHeight, 2);

    // Hydrostatic Pressure due to Water Table
    let hydrostaticPressure = 0;
    if (input.waterTable > 0 && input.waterTable < wallHeight) {
      const submergedHeight = wallHeight - input.waterTable;
      hydrostaticPressure = soilDensity * submergedHeight * submergedHeight / 2;
    }

    const totalEarthPressure = earthPressureTotal + hydrostaticPressure;

    // Moments
    const momentOverturning = earthPressureTotal * (wallHeight / 3) + surchargeLoad * wallHeight;
    const momentResisting = baseWidth * wallHeight + heel * wallHeight + stemThickness * wallHeight;

    // Factor of Safety against Overturning
    const fsOverturning = momentResisting / momentOverturning;

    // Sliding Factors
    const horizontalForce = totalEarthPressure + surchargeLoad + seismicForce;
    const resistingForce = cohesion * baseWidth + (toe * Math.tan(phi));
    const fsSliding = resistingForce / horizontalForce;

    // Bearing Capacity Factors
    const verticalLoad = soilDensity * wallHeight * baseWidth + stakingLoad();
    const fsBearing = bearingCapacity / verticalLoad;

    return {
      fsOverturning: fsOverturning,
      fsSliding: fsSliding,
      fsBearing: fsBearing,
      earthPressureTotal: totalEarthPressure,
      momentOverturning: momentOverturning,
      momentResisting: momentResisting,
      horizontalForce: horizontalForce,
      resistingForce: resistingForce,
      verticalLoad: verticalLoad,
    };
  };

  // Placeholder function for Staking Load (if any additional vertical loads are present)
  const stakingLoad = () => {
    // Implement if there are additional vertical loads such as surcharge on the heel
    return 0;
  };

  // Calculate Earth Pressure
  const calculateEarthPressure = () => {
    const { soilDensity, frictionAngle, wallHeight, /* wallType, */ waterTable } = input; // Removed unused variable
    const phi = frictionAngle * (Math.PI / 180);

    // Active Earth Pressure (Rankine)
    const ka = (1 - Math.sin(phi)) / (1 + Math.sin(phi));
    const earthPressure = 0.5 * soilDensity * ka * Math.pow(wallHeight, 2);

    // Hydrostatic Pressure due to Water Table
    let hydrostaticPressure = 0;
    if (waterTable > 0 && waterTable < wallHeight) {
      const submergedHeight = wallHeight - waterTable;
      hydrostaticPressure = soilDensity * submergedHeight * submergedHeight / 2;
    }

    const totalEarthPressure = earthPressure + hydrostaticPressure;

    return totalEarthPressure.toFixed(2);
  };

  // Handle Form Submission
  const handleSubmit = (e) => {
    e.preventDefault();
    const stability = calculateStability();
    const earthPressure = calculateEarthPressure();

    // Structural Design Calculations
    const bendingMoment = calculateBendingMoment(earthPressure);
    const shearForce = calculateShearForce(earthPressure);
    const settlement = calculateSettlement();

    setResults({
      safetyFactorOverturning: stability.fsOverturning.toFixed(2),
      safetyFactorSliding: stability.fsSliding.toFixed(2),
      safetyFactorBearing: stability.fsBearing.toFixed(2),
      earthPressure: earthPressure,
      bendingMoment: bendingMoment.toFixed(2),
      shearForce: shearForce.toFixed(2),
      settlement: settlement.toFixed(2),
      momentOverturning: stability.momentOverturning.toFixed(2),
      momentResisting: stability.momentResisting.toFixed(2),
      horizontalForce: stability.horizontalForce.toFixed(2),
      resistingForce: stability.resistingForce.toFixed(2),
      verticalLoad: stability.verticalLoad.toFixed(2),
    });

    // Prepare Charts Data
    prepareCharts(earthPressure, stability, bendingMoment, shearForce);
  };

  // Calculate Bending Moment (Simplified)
  const calculateBendingMoment = (earthPressure) => {
    // Assuming bending moment is proportional to earth pressure
    return earthPressure * (input.wallHeight / 2);
  };

  // Calculate Shear Force (Simplified)
  const calculateShearForce = (earthPressure) => {
    return earthPressure / 2;
  };

  // Calculate Settlement (Placeholder)
  const calculateSettlement = () => {
    // Implement settlement calculations based on soil properties and wall geometry
    return 0; // Placeholder
  };

  // Prepare Charts Data
  const prepareCharts = (earthPressure, stability, bendingMoment, shearForce) => {
    // Earth Pressure Chart
    const earthPressureData = {
      labels: ['Total Earth Pressure'],
      datasets: [
        {
          label: 'Earth Pressure (kN)',
          data: [earthPressure],
          backgroundColor: ['rgba(75, 192, 192, 0.6)'],
          borderColor: ['rgba(75, 192, 192, 1)'],
          borderWidth: 1,
        },
      ],
    };

    // Stability Results Chart
    const stabilityData = {
      labels: ['Overturning', 'Sliding', 'Bearing Capacity'],
      datasets: [
        {
          label: 'Factor of Safety',
          data: [
            parseFloat(stability.fsOverturning),
            parseFloat(stability.fsSliding),
            parseFloat(stability.fsBearing),
          ],
          backgroundColor: [
            'rgba(255, 99, 132, 0.6)',
            'rgba(54, 162, 235, 0.6)',
            'rgba(255, 206, 86, 0.6)',
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
          ],
          borderWidth: 1,
        },
      ],
    };

    // Structural Design Chart
    const structuralData = {
      labels: ['Bending Moment', 'Shear Force'],
      datasets: [
        {
          label: 'Structural Design',
          data: [
            parseFloat(bendingMoment),
            parseFloat(shearForce),
          ],
          backgroundColor: [
            'rgba(153, 102, 255, 0.6)',
            'rgba(255, 159, 64, 0.6)',
          ],
          borderColor: [
            'rgba(153, 102, 255, 1)',
            'rgba(255, 159, 64, 1)',
          ],
          borderWidth: 1,
        },
      ],
    };

    setChartsData({
      earthPressureChart: earthPressureData,
      stabilityResultsChart: stabilityData,
      structuralDesignChart: structuralData,
    });
  };

  return (
    <div className="retaining-wall-design-tool">
      <h1>Retaining Wall Design Tool</h1>
      <form onSubmit={handleSubmit}>
        {/* Input Parameters */}
        <div className="form-group">
          <h2>Input Parameters</h2>
          <label htmlFor="wallType">Wall Type:</label>
          <select
            id="wallType"
            name="wallType"
            value={input.wallType}
            onChange={handleChange}
            required
          >
            <option value="">Select Wall Type</option>
            <option value="gravity">Gravity Wall</option>
            <option value="cantilever">Cantilever Wall</option>
            <option value="counterfort">Counterfort Wall</option>
            <option value="sheetPile">Sheet Pile Wall</option>
          </select>

          <label htmlFor="soilDensity">Soil Density (kN/m³):</label>
          <input
            type="number"
            id="soilDensity"
            name="soilDensity"
            value={input.soilDensity}
            onChange={handleChange}
            placeholder="Enter Soil Density"
            required
          />

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

          <label htmlFor="bearingCapacity">Bearing Capacity (kPa):</label>
          <input
            type="number"
            id="bearingCapacity"
            name="bearingCapacity"
            value={input.bearingCapacity}
            onChange={handleChange}
            placeholder="Enter Bearing Capacity"
            required
          />

          <label htmlFor="waterTable">Water Table Elevation (m):</label>
          <input
            type="number"
            id="waterTable"
            name="waterTable"
            value={input.waterTable}
            onChange={handleChange}
            placeholder="Enter Water Table Elevation"
            required
          />

          <label htmlFor="wallHeight">Wall Height (m):</label>
          <input
            type="number"
            id="wallHeight"
            name="wallHeight"
            value={input.wallHeight}
            onChange={handleChange}
            placeholder="Enter Wall Height"
            required
          />

          <label htmlFor="baseWidth">Base Width (m):</label>
          <input
            type="number"
            id="baseWidth"
            name="baseWidth"
            value={input.baseWidth}
            onChange={handleChange}
            placeholder="Enter Base Width"
            required
          />

          <label htmlFor="stemThickness">Stem Thickness (m):</label>
          <input
            type="number"
            id="stemThickness"
            name="stemThickness"
            value={input.stemThickness}
            onChange={handleChange}
            placeholder="Enter Stem Thickness"
            required
          />

          <label htmlFor="heel">Heel Dimension (m):</label>
          <input
            type="number"
            id="heel"
            name="heel"
            value={input.heel}
            onChange={handleChange}
            placeholder="Enter Heel Dimension"
            required
          />

          <label htmlFor="toe">Toe Dimension (m):</label>
          <input
            type="number"
            id="toe"
            name="toe"
            value={input.toe}
            onChange={handleChange}
            placeholder="Enter Toe Dimension"
            required
          />

          <label htmlFor="surchargeLoad">Surcharge Load (kN/m²):</label>
          <input
            type="number"
            id="surchargeLoad"
            name="surchargeLoad"
            value={input.surchargeLoad}
            onChange={handleChange}
            placeholder="Enter Surcharge Load"
          />

          <label htmlFor="seismicForce">Seismic Force (kN):</label>
          <input
            type="number"
            id="seismicForce"
            name="seismicForce"
            value={input.seismicForce}
            onChange={handleChange}
            placeholder="Enter Seismic Force"
          />

          <label htmlFor="designCode">Design Code:</label>
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
            <option value="IS456">IS 456</option>
          </select>
        </div>

        {/* Submit Button */}
        <button type="submit">Calculate</button>
      </form>

      {/* Results Display */}
      {results.fsOverturning && (
        <div className="results">
          <h2>Stability Analysis</h2>
          <p>
            <strong>Factor of Safety against Overturning:</strong> {results.safetyFactorOverturning} (Should be &gt;= 1.5)
          </p>
          <p>
            <strong>Moment Overturning (kN·m):</strong> {results.momentOverturning}
          </p>
          <p>
            <strong>Moment Resisting (kN·m):</strong> {results.momentResisting}
          </p>
          <p>
            <strong>Factor of Safety against Sliding:</strong> {results.safetyFactorSliding} (Should be &gt;= 1.5)
          </p>
          <p>
            <strong>Horizontal Force (kN):</strong> {results.horizontalForce}
          </p>
          <p>
            <strong>Resisting Force (kN):</strong> {results.resistingForce}
          </p>
          <p>
            <strong>Factor of Safety against Bearing Capacity:</strong> {results.safetyFactorBearing} (Should be &gt;= 1.5)
          </p>
          <p>
            <strong>Vertical Load (kN):</strong> {results.verticalLoad}
          </p>

          <h2>Earth Pressure</h2>
          <p>
            <strong>Total Earth Pressure (kN):</strong> {results.earthPressure}
          </p>

          <h2>Structural Design</h2>
          <p>
            <strong>Bending Moment (kN·m):</strong> {results.bendingMoment}
          </p>
          <p>
            <strong>Shear Force (kN):</strong> {results.shearForce}
          </p>
          <p>
            <strong>Settlement (mm):</strong> {results.settlement}
          </p>
        </div>
      )}

      {/* Charts */}
      {chartsData.earthPressureChart && (
        <div className="chart-container">
          <h2>Earth Pressure Diagram</h2>
          <Bar
            data={chartsData.earthPressureChart}
            options={{
              responsive: true,
              plugins: {
                legend: { position: 'top' },
                title: { display: true, text: 'Earth Pressure Distribution' },
              },
              scales: {
                y: { beginAtZero: true },
              },
            }}
          />
        </div>
      )}

      {chartsData.stabilityResultsChart && (
        <div className="chart-container">
          <h2>Stability Results</h2>
          <Bar
            data={chartsData.stabilityResultsChart}
            options={{
              responsive: true,
              plugins: {
                legend: { position: 'top' },
                title: { display: true, text: 'Stability Factors of Safety' },
              },
              scales: {
                y: { beginAtZero: true },
              },
            }}
          />
        </div>
      )}

      {chartsData.structuralDesignChart && (
        <div className="chart-container">
          <h2>Structural Design</h2>
          <Line
            data={chartsData.structuralDesignChart}
            options={{
              responsive: true,
              plugins: {
                legend: { position: 'top' },
                title: { display: true, text: 'Bending Moment and Shear Force' },
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

export default RetainingWallDesignTool;