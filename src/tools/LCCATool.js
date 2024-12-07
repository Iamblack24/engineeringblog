import React, { useState } from 'react';
import { Bar } from 'react-chartjs-2';
import './LCCATool.css';

const LCCATool = () => {
  const [alternatives, setAlternatives] = useState([]);
  const [newAlternative, setNewAlternative] = useState({
    name: '',
    initialCost: 0,
    maintenanceCost: 0,
    lifespan: 1,
    energyCost: 0,
    salvageValue: 0,
    discountRate: 0,
  });
  const [results, setResults] = useState(null);

  const addAlternative = () => {
    setAlternatives([...alternatives, { ...newAlternative }]);
    setNewAlternative({
      name: '',
      initialCost: 0,
      maintenanceCost: 0,
      lifespan: 1,
      energyCost: 0,
      salvageValue: 0,
      discountRate: 0,
    });
  };

  const calculateLCCA = () => {
    const calculatedResults = alternatives.map((alt) => {
      const { initialCost, maintenanceCost, energyCost, salvageValue, lifespan, discountRate } = alt;

      let totalCost = 0;
      for (let t = 1; t <= lifespan; t++) {
        const discountedMaintenance = maintenanceCost / Math.pow(1 + discountRate / 100, t);
        const discountedEnergy = energyCost / Math.pow(1 + discountRate / 100, t);
        totalCost += discountedMaintenance + discountedEnergy;
      }

      totalCost += initialCost - salvageValue / Math.pow(1 + discountRate / 100, lifespan);

      return { ...alt, totalCost: totalCost.toFixed(2) };
    });

    setResults(calculatedResults);
  };

  const data = {
    labels: results ? results.map((res) => res.name) : [],
    datasets: [
      {
        label: 'Total Life Cycle Cost (USD)',
        data: results ? results.map((res) => parseFloat(res.totalCost)) : [],
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="lcca-tool">
      <h1>Life Cycle Cost Analysis (LCCA)</h1>
      <div className="input-section">
        <h2>Add Alternative</h2>
        {Object.keys(newAlternative).map((key) => (
          <label key={key}>
            {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}:
            <input
              type="number"
              value={newAlternative[key]}
              onChange={(e) => setNewAlternative({ ...newAlternative, [key]: parseFloat(e.target.value) || 0 })}
            />
          </label>
        ))}
        <button onClick={addAlternative}>Add Alternative</button>
      </div>
      <div className="alternatives-section">
        <h2>Alternatives</h2>
        <ul>
          {alternatives.map((alt, index) => (
            <li key={index}>
              {alt.name} - Initial Cost: ${alt.initialCost}, Maintenance: ${alt.maintenanceCost}/year, Energy Cost: ${alt.energyCost}/year, Lifespan: {alt.lifespan} years
            </li>
          ))}
        </ul>
        {alternatives.length > 0 && <button onClick={calculateLCCA}>Calculate LCCA</button>}
      </div>
      <div className="results-section">
        <h2>Results</h2>
        {results ? (
          <>
            <ul>
              {results.map((res, index) => (
                <li key={index}>
                  {res.name}: Total Life Cycle Cost = ${res.totalCost}
                </li>
              ))}
            </ul>
            <div className="chart-container">
              <Bar data={data} options={{ responsive: true, maintainAspectRatio: false }} />
            </div>
          </>
        ) : (
          <p>No results yet. Add alternatives and calculate.</p>
        )}
      </div>
    </div>
  );
};

export default LCCATool;
