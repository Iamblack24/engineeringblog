import React, { useState } from 'react';
import './ConcreteMixDesignCalculator.css'; // Import the CSS file for styling

const ConcreteMixDesignCalculator = () => {
  // State variables for inputs
  const [compressiveStrength, setCompressiveStrength] = useState('');
  const [slump, setSlump] = useState('');
  const [maxAggregateSize, setMaxAggregateSize] = useState('20');
  const [exposureCondition, setExposureCondition] = useState('mild');
  const [waterCementRatio, setWaterCementRatio] = useState(null);
  const [cementContent, setCementContent] = useState(null);
  const [waterContent, setWaterContent] = useState(null);
  const [fineAggregate, setFineAggregate] = useState(null);
  const [coarseAggregate, setCoarseAggregate] = useState(null);

  const calculateMixDesign = (e) => {
    e.preventDefault();

    // Validations
    if (
      compressiveStrength === '' ||
      slump === '' ||
      isNaN(compressiveStrength) ||
      isNaN(slump)
    ) {
      alert('Please enter valid numeric values for compressive strength and slump.');
      return;
    }

    const fc = parseFloat(compressiveStrength); // in MPa
    const desiredSlump = parseFloat(slump); // in mm

    // Simplified ACI method
    // Step 1: Water-Cement Ratio
    let wcr = 0.5; // Default value
    if (exposureCondition === 'mild') {
      wcr = 0.6;
    } else if (exposureCondition === 'moderate') {
      wcr = 0.5;
    } else if (exposureCondition === 'severe') {
      wcr = 0.4;
    }

    // Adjust w/c ratio based on compressive strength
    if (fc > 35) {
      wcr = Math.min(wcr, 0.4);
    } else if (fc > 25) {
      wcr = Math.min(wcr, 0.45);
    } else if (fc > 15) {
      wcr = Math.min(wcr, 0.5);
    }

    // Step 2: Water Content (Approximate values based on slump and aggregate size)
    let water = 180; // Default water content in kg/m³
    if (desiredSlump > 75) {
      water += 10;
    }
    if (maxAggregateSize === '10') {
      water += 20;
    } else if (maxAggregateSize === '40') {
      water -= 10;
    }

    // Step 3: Cement Content
    const cement = water / wcr;

    // Step 4: Aggregates (Assuming standard proportions)
    const totalAggregate = 2400 - (cement + water); // Approximate concrete density is 2400 kg/m³
    const fineAgg = totalAggregate * 0.35; // 35% Fine Aggregate
    const coarseAgg = totalAggregate * 0.65; // 65% Coarse Aggregate

    // Set the state variables to display results
    setWaterCementRatio(wcr);
    setWaterContent(water.toFixed(2));
    setCementContent(cement.toFixed(2));
    setFineAggregate(fineAgg.toFixed(2));
    setCoarseAggregate(coarseAgg.toFixed(2));
  };

  return (
    <div className="concrete-mix-design-calculator">
      <h1>Concrete Mix Design Calculator</h1>
      <form onSubmit={calculateMixDesign}>
        <div className="form-group">
          <label>Desired Compressive Strength (MPa):</label>
          <input
            type="number"
            value={compressiveStrength}
            onChange={(e) => setCompressiveStrength(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Slump (mm):</label>
          <input
            type="number"
            value={slump}
            onChange={(e) => setSlump(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Maximum Aggregate Size (mm):</label>
          <select
            value={maxAggregateSize}
            onChange={(e) => setMaxAggregateSize(e.target.value)}
          >
            <option value="10">10 mm</option>
            <option value="20">20 mm</option>
            <option value="40">40 mm</option>
          </select>
        </div>
        <div className="form-group">
          <label>Exposure Condition:</label>
          <select
            value={exposureCondition}
            onChange={(e) => setExposureCondition(e.target.value)}
          >
            <option value="mild">Mild</option>
            <option value="moderate">Moderate</option>
            <option value="severe">Severe</option>
          </select>
        </div>
        <button type="submit">Calculate Mix Design</button>
      </form>
      {cementContent && (
        <div className="results">
          <h2>Mix Design Results</h2>
          <p>
            <strong>Water-Cement Ratio:</strong> {waterCementRatio.toFixed(2)}
          </p>
          <p>
            <strong>Cement Content:</strong> {cementContent} kg/m³
          </p>
          <p>
            <strong>Water Content:</strong> {waterContent} kg/m³
          </p>
          <p>
            <strong>Fine Aggregate:</strong> {fineAggregate} kg/m³
          </p>
          <p>
            <strong>Coarse Aggregate:</strong> {coarseAggregate} kg/m³
          </p>
        </div>
      )}
    </div>
  );
};

export default ConcreteMixDesignCalculator;