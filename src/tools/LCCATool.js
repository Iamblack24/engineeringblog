import React, { useState } from 'react';
import { Bar } from 'react-chartjs-2';
import './LCCATool.css';

const LCCATool = () => {
  const [projectInfo, setProjectInfo] = useState({
    projectName: '',
    location: '',
    projectType: '',
    analysisStartYear: new Date().getFullYear(),
    studyPeriod: 30,
    inflationRate: 2,
  });

  const [alternatives, setAlternatives] = useState([]);
  const [newAlternative, setNewAlternative] = useState({
    name: '',
    // Initial Costs
    initialCost: 0,
    designCost: 0,
    constructionCost: 0,
    equipmentCost: 0,
    
    // Operating Costs
    maintenanceCost: 0,
    energyCost: 0,
    waterCost: 0,
    staffingCost: 0,
    
    // Periodic Costs
    replacementSchedule: [], // Array of {year, cost} objects
    majorRepairSchedule: [], // Array of {year, cost} objects
    
    // End of Life
    lifespan: 1,
    salvageValue: 0,
    disposalCost: 0,
    
    // Financial Parameters
    discountRate: 0,
    
    // Sustainability Metrics
    carbonEmissions: 0, // kg CO2e/year
    waterUsage: 0, // m3/year
    energyEfficiencyRating: '',
    
    // Risk Factors (1-5 scale)
    constructionRisk: 1,
    operationalRisk: 1,
    marketRisk: 1,
    regulatoryRisk: 1,
  });

  const [results, setResults] = useState(null);

  const calculateNPV = (cashflows, rate, years) => {
    return cashflows.reduce((npv, cf, year) => {
      return npv + cf / Math.pow(1 + rate / 100, year);
    }, 0);
  };

  const calculateRiskAdjustedCost = (cost, risks) => {
    const riskFactor = Object.values(risks).reduce((sum, risk) => sum + risk, 0) / (Object.keys(risks).length * 5);
    return cost * (1 + riskFactor * 0.1); // 10% maximum risk adjustment
  };

  const calculateLCCA = () => {
    const calculatedResults = alternatives.map((alt) => {
      const {
        initialCost, designCost, constructionCost, equipmentCost,
        maintenanceCost, energyCost, waterCost, staffingCost,
        replacementSchedule, majorRepairSchedule,
        lifespan, salvageValue, disposalCost, discountRate,
        constructionRisk, operationalRisk, marketRisk, regulatoryRisk
      } = alt;

      // Initial costs
      let totalInitialCost = initialCost + designCost + constructionCost + equipmentCost;
      
      // Calculate annual operating costs
      const annualCosts = [];
      for (let t = 1; t <= lifespan; t++) {
        let yearCost = maintenanceCost + energyCost + waterCost + staffingCost;
        
        // Add replacement costs
        replacementSchedule.forEach(rep => {
          if (t === rep.year) yearCost += rep.cost;
        });
        
        // Add major repair costs
        majorRepairSchedule.forEach(rep => {
          if (t === rep.year) yearCost += rep.cost;
        });
        
        annualCosts.push(yearCost);
      }

      // Calculate NPV of all costs
      const npvOperatingCosts = calculateNPV(annualCosts, discountRate, lifespan);
      const npvSalvage = salvageValue / Math.pow(1 + discountRate / 100, lifespan);
      const npvDisposal = disposalCost / Math.pow(1 + discountRate / 100, lifespan);

      // Risk-adjusted total cost
      const risks = { constructionRisk, operationalRisk, marketRisk, regulatoryRisk };
      const riskAdjustedTotal = calculateRiskAdjustedCost(
        totalInitialCost + npvOperatingCosts + npvDisposal - npvSalvage,
        risks
      );

      return {
        ...alt,
        totalInitialCost: totalInitialCost.toFixed(2),
        npvOperatingCosts: npvOperatingCosts.toFixed(2),
        riskAdjustedTotal: riskAdjustedTotal.toFixed(2),
        annualCarbonCost: (alt.carbonEmissions * 50).toFixed(2), // Assuming $50/ton CO2
      };
    });

    setResults(calculatedResults);
  };

  const addAlternative = () => {
    setAlternatives([...alternatives, { ...newAlternative }]);
    setNewAlternative({
      ...newAlternative,
      name: '',
      initialCost: 0,
    });
  };

  const data = {
    labels: results ? results.map((res) => res.name) : [],
    datasets: [
      {
        label: 'Risk-Adjusted Life Cycle Cost (USD)',
        data: results ? results.map((res) => parseFloat(res.riskAdjustedTotal)) : [],
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="lcca-tool">
      <h1>Advanced Life Cycle Cost Analysis (LCCA)</h1>
      
      <div className="project-info-section">
        <h2>Project Information</h2>
        {Object.keys(projectInfo).map((key) => (
          <label key={key}>
            {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}:
            <input
              type={key.includes('Year') ? 'number' : 'text'}
              value={projectInfo[key]}
              onChange={(e) => setProjectInfo({ 
                ...projectInfo, 
                [key]: key.includes('Year') || key.includes('Rate') ? 
                  parseFloat(e.target.value) || 0 : e.target.value 
              })}
            />
          </label>
        ))}
      </div>

      <div className="input-section">
        <h2>Add Alternative</h2>
        <div className="input-grid">
          <div className="input-group">
            <h3>Basic Information</h3>
            <label>
              Name:
              <input
                type="text"
                value={newAlternative.name}
                onChange={(e) => setNewAlternative({ ...newAlternative, name: e.target.value })}
              />
            </label>
          </div>

          <div className="input-group">
            <h3>Initial Costs</h3>
            {['initialCost', 'designCost', 'constructionCost', 'equipmentCost'].map((key) => (
              <label key={key}>
                {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}:
                <input
                  type="number"
                  value={newAlternative[key]}
                  onChange={(e) => setNewAlternative({ ...newAlternative, [key]: parseFloat(e.target.value) || 0 })}
                />
              </label>
            ))}
          </div>

          <div className="input-group">
            <h3>Operating Costs (Annual)</h3>
            {['maintenanceCost', 'energyCost', 'waterCost', 'staffingCost'].map((key) => (
              <label key={key}>
                {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}:
                <input
                  type="number"
                  value={newAlternative[key]}
                  onChange={(e) => setNewAlternative({ ...newAlternative, [key]: parseFloat(e.target.value) || 0 })}
                />
              </label>
            ))}
          </div>

          <div className="input-group">
            <h3>End of Life</h3>
            {['lifespan', 'salvageValue', 'disposalCost'].map((key) => (
              <label key={key}>
                {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}:
                <input
                  type="number"
                  value={newAlternative[key]}
                  onChange={(e) => setNewAlternative({ ...newAlternative, [key]: parseFloat(e.target.value) || 0 })}
                />
              </label>
            ))}
          </div>

          <div className="input-group">
            <h3>Sustainability Metrics</h3>
            {['carbonEmissions', 'waterUsage'].map((key) => (
              <label key={key}>
                {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}:
                <input
                  type="number"
                  value={newAlternative[key]}
                  onChange={(e) => setNewAlternative({ ...newAlternative, [key]: parseFloat(e.target.value) || 0 })}
                />
              </label>
            ))}
          </div>

          <div className="input-group">
            <h3>Risk Assessment</h3>
            {['constructionRisk', 'operationalRisk', 'marketRisk', 'regulatoryRisk'].map((key) => (
              <label key={key}>
                {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')} (1-5):
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={newAlternative[key]}
                  onChange={(e) => setNewAlternative({ 
                    ...newAlternative, 
                    [key]: Math.min(5, Math.max(1, parseInt(e.target.value) || 1))
                  })}
                />
              </label>
            ))}
          </div>
        </div>
        <button onClick={addAlternative}>Add Alternative</button>
      </div>

      <div className="alternatives-section">
        <h2>Alternatives Summary</h2>
        <ul>
          {alternatives.map((alt, index) => (
            <li key={index} className="alternative-item">
              <h3>{alt.name}</h3>
              <div className="alternative-details">
                <p>Initial Costs: ${alt.initialCost + alt.designCost + alt.constructionCost + alt.equipmentCost}</p>
                <p>Annual Operating Costs: ${alt.maintenanceCost + alt.energyCost + alt.waterCost + alt.staffingCost}/year</p>
                <p>Lifespan: {alt.lifespan} years</p>
                <p>Carbon Emissions: {alt.carbonEmissions} kg CO2e/year</p>
              </div>
            </li>
          ))}
        </ul>
        {alternatives.length > 0 && <button onClick={calculateLCCA}>Calculate LCCA</button>}
      </div>

      <div className="results-section">
        <h2>Analysis Results</h2>
        {results ? (
          <>
            <div className="results-grid">
              {results.map((res, index) => (
                <div key={index} className="result-card">
                  <h3>{res.name}</h3>
                  <p>Initial Costs: ${res.totalInitialCost}</p>
                  <p>NPV of Operating Costs: ${res.npvOperatingCosts}</p>
                  <p>Risk-Adjusted Total: ${res.riskAdjustedTotal}</p>
                  <p>Annual Carbon Cost: ${res.annualCarbonCost}</p>
                </div>
              ))}
            </div>
            <div className="chart-container">
              <Bar data={data} options={{ 
                responsive: true, 
                maintainAspectRatio: false,
                plugins: {
                  title: {
                    display: true,
                    text: 'Comparison of Life Cycle Costs'
                  }
                }
              }} />
            </div>
          </>
        ) : (
          <p>No results yet. Add alternatives and calculate to see the analysis.</p>
        )}
      </div>
    </div>
  );
};

export default LCCATool;
