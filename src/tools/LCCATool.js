import React, { useState, useRef } from 'react'; // Added useRef
import { Bar } from 'react-chartjs-2';
// Import Chart.js components if not already globally registered
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import './LCCATool.css';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);


const LCCATool = () => {
  const [projectInfo, setProjectInfo] = useState({
    analysisStartYear: new Date().getFullYear(),
    studyPeriod: 30,
    inflationRate: 2.0, // General inflation rate (%)
    discountRate: 5.0,
    // Optional Specific Inflation Rates
    energyInflationRate: '', // Defaults to general if blank
    maintenanceInflationRate: '', // Defaults to general if blank
  });

  const [alternatives, setAlternatives] = useState([]);
  const [newAlternative, setNewAlternative] = useState({
    name: '',
    // Initial Costs (Year 0) - Provide EITHER combined OR detailed
    initialCost: 0, // Combined initial cost (fallback)
    initialDesignCost: '', // Optional Detail
    initialConstructionCost: '', // Optional Detail
    initialLandCost: '', // Optional Detail

    // Annual Costs (Base Year Values) - Provide EITHER combined OR detailed
    annualOperatingCost: 0, // Combined annual cost (fallback)
    annualEnergyCost: '', // Optional Detail
    annualWaterCost: '', // Optional Detail
    annualMaintenanceCost: '', // Optional Detail

    // Periodic Costs (Base Year Values)
    periodicReplacements: [],
    periodicRepairs: [],

    // End of Life / Study Period
    salvageValue: 0, // Base Year Value
    disposalCost: '', // Optional: Base Year Value (cost to dispose)

    // Sustainability Metrics (Optional)
    annualCarbonEmissions: 0,

    // Risk Factors (Optional)
    riskFactor: 1.0,
  });

  // State for managing periodic cost inputs
  const [currentReplacement, setCurrentReplacement] = useState({ year: '', cost: '', interval: '' });
  const [currentRepair, setCurrentRepair] = useState({ year: '', cost: '', interval: '' });


  const [results, setResults] = useState(null);
  const resultsRef = useRef(null); // Ref for scrolling

  // Corrected NPV calculation (index starts at 0 for year 1)
  // Assumes cashflows array starts with year 1 cashflow at index 0
  const calculateNPV = (cashflows, rate) => {
    const discountFactor = 1 + rate / 100;
    return cashflows.reduce((npv, cf, index) => {
      // Year for discounting is index + 1
      return npv + cf / Math.pow(discountFactor, index + 1);
    }, 0);
  };

  // Function to calculate Present Value of a single future cost, considering inflation
  const calculatePVFutureCost = (baseCost, year, discountRate, inflationRate) => {
    if (year <= 0) return 0; // No PV for past or current year costs in this context
    const inflatedCost = baseCost * Math.pow(1 + inflationRate / 100, year);
    const pv = inflatedCost / Math.pow(1 + discountRate / 100, year);
    return pv;
  };

  // Helper to get specific inflation rate or default
  const getInflationRate = (type) => {
    const { inflationRate, energyInflationRate, maintenanceInflationRate } = projectInfo;
    if (type === 'energy' && energyInflationRate !== '') return parseFloat(energyInflationRate);
    if (type === 'maintenance' && maintenanceInflationRate !== '') return parseFloat(maintenanceInflationRate);
    // Add other types if needed (e.g., water)
    return parseFloat(inflationRate) || 0; // Default to general
  };

  // Updated PV Future Cost to accept specific inflation rate
  const calculatePVFutureCostSpecific = (baseCost, year, discountRate, specificInflationRate) => {
    if (year <= 0 || baseCost === '' || isNaN(baseCost)) return 0;
    const cost = parseFloat(baseCost);
    const inflatedCost = cost * Math.pow(1 + specificInflationRate / 100, year);
    const pv = inflatedCost / Math.pow(1 + discountRate / 100, year);
    return pv;
  };

  // Updated NPV to accept specific inflation rate for annual costs
   const calculateNPVAnnual = (baseAnnualCost, studyPeriod, discountRate, specificInflationRate) => {
      if (baseAnnualCost === '' || isNaN(baseAnnualCost)) return 0;
      const cost = parseFloat(baseAnnualCost);
      const discountFactor = 1 + discountRate / 100;
      const inflationFactor = 1 + specificInflationRate / 100;
      let npv = 0;
      for (let t = 1; t <= studyPeriod; t++) {
          const inflatedCost = cost * Math.pow(inflationFactor, t);
          npv += inflatedCost / Math.pow(discountFactor, t);
      }
      return npv;
   };


  const calculateLCCA = () => {
    const { studyPeriod, discountRate } = projectInfo; // General inflation handled by getInflationRate

    const calculatedResults = alternatives.map((alt) => {
      const {
        // Use provided values, ensuring they are numbers or fallback
        initialCost, initialDesignCost, initialConstructionCost, initialLandCost,
        annualOperatingCost, annualEnergyCost, annualWaterCost, annualMaintenanceCost,
        periodicReplacements, periodicRepairs,
        salvageValue, disposalCost, riskFactor, annualCarbonEmissions
      } = alt;

      // --- Determine Effective Initial Cost ---
      let effectiveInitialCost = parseFloat(initialCost) || 0;
      const detailInitialProvided = (initialDesignCost !== '' || initialConstructionCost !== '' || initialLandCost !== '');
      if (detailInitialProvided) {
          effectiveInitialCost = (parseFloat(initialDesignCost) || 0) +
                                 (parseFloat(initialConstructionCost) || 0) +
                                 (parseFloat(initialLandCost) || 0);
      }

      // --- Calculate PV of Costs ---
      let totalPvCosts = effectiveInitialCost;
      let pvEnergy = 0, pvWater = 0, pvMaintenance = 0, pvOtherAnnual = 0;

      // --- PV of Annual Costs ---
      const detailAnnualProvided = (annualEnergyCost !== '' || annualWaterCost !== '' || annualMaintenanceCost !== '');
      if (detailAnnualProvided) {
          pvEnergy = calculateNPVAnnual(annualEnergyCost, studyPeriod, discountRate, getInflationRate('energy'));
          pvWater = calculateNPVAnnual(annualWaterCost, studyPeriod, discountRate, getInflationRate('water')); // Assuming general inflation for water
          pvMaintenance = calculateNPVAnnual(annualMaintenanceCost, studyPeriod, discountRate, getInflationRate('maintenance'));
          totalPvCosts += pvEnergy + pvWater + pvMaintenance;
      } else {
          // Fallback to combined annual operating cost with general inflation
          pvOtherAnnual = calculateNPVAnnual(annualOperatingCost, studyPeriod, discountRate, getInflationRate('general'));
          totalPvCosts += pvOtherAnnual;
      }
      const totalPvAnnual = pvEnergy + pvWater + pvMaintenance + pvOtherAnnual;


      // --- PV of Periodic Costs (Using General Inflation) ---
      let totalPvPeriodic = 0;
      const generalInflation = getInflationRate('general');

      periodicReplacements.forEach(rep => {
        let currentYear = rep.year;
        while (currentYear <= studyPeriod) {
          totalPvPeriodic += calculatePVFutureCostSpecific(rep.cost, currentYear, discountRate, generalInflation);
          if (rep.interval > 0) { currentYear += rep.interval; } else { break; }
        }
      });
      periodicRepairs.forEach(rep => {
         let currentYear = rep.year;
         while (currentYear <= studyPeriod) {
           totalPvPeriodic += calculatePVFutureCostSpecific(rep.cost, currentYear, discountRate, generalInflation);
           if (rep.interval > 0) { currentYear += rep.interval; } else { break; }
         }
      });
      totalPvCosts += totalPvPeriodic;


      // --- PV of End-of-Life Values (Using General Inflation) ---
      const pvSalvage = calculatePVFutureCostSpecific(salvageValue, studyPeriod, discountRate, generalInflation);
      const pvDisposal = calculatePVFutureCostSpecific(disposalCost, studyPeriod, discountRate, generalInflation);
      totalPvCosts -= pvSalvage;
      totalPvCosts += pvDisposal; // Disposal is a cost

      // --- Risk and Carbon ---
      const riskAdjustedLCC = totalPvCosts * (parseFloat(riskFactor) || 1.0);
      const totalCarbonEmissions = (parseFloat(annualCarbonEmissions) || 0) * studyPeriod;
      const carbonCost = (totalCarbonEmissions / 1000) * 50; // Example carbon price

      return {
        name: alt.name,
        initialCost: effectiveInitialCost.toFixed(2),
        pvAnnualCosts: totalPvAnnual.toFixed(2), // Combined PV of all annual costs
        pvEnergyCosts: pvEnergy.toFixed(2), // Specific breakdown
        pvMaintenanceCosts: pvMaintenance.toFixed(2), // Specific breakdown
        pvPeriodicCosts: totalPvPeriodic.toFixed(2),
        pvDisposalCost: pvDisposal.toFixed(2),
        pvSalvageValue: pvSalvage.toFixed(2),
        totalPvCostsRaw: totalPvCosts.toFixed(2),
        riskFactor: (parseFloat(riskFactor) || 1.0).toFixed(2),
        lifeCycleCost: riskAdjustedLCC.toFixed(2),
        totalCarbonEmissions: totalCarbonEmissions.toFixed(2),
        estimatedCarbonCost: carbonCost.toFixed(2),
      };
    });

    setResults(calculatedResults);
    // Scroll to results after calculation
    setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // --- Handlers for Periodic Costs ---
  const handleAddReplacement = () => {
    if (currentReplacement.year > 0 && currentReplacement.cost > 0) {
      setNewAlternative(prev => ({
        ...prev,
        periodicReplacements: [...prev.periodicReplacements, { ...currentReplacement, year: parseInt(currentReplacement.year), cost: parseFloat(currentReplacement.cost), interval: parseInt(currentReplacement.interval) || 0 }]
      }));
      setCurrentReplacement({ year: '', cost: '', interval: '' }); // Reset form
    }
  };

  const handleRemoveReplacement = (index) => {
    setNewAlternative(prev => ({
      ...prev,
      periodicReplacements: prev.periodicReplacements.filter((_, i) => i !== index)
    }));
  };

   const handleAddRepair = () => {
    if (currentRepair.year > 0 && currentRepair.cost > 0) {
      setNewAlternative(prev => ({
        ...prev,
        periodicRepairs: [...prev.periodicRepairs, { ...currentRepair, year: parseInt(currentRepair.year), cost: parseFloat(currentRepair.cost), interval: parseInt(currentRepair.interval) || 0 }]
      }));
      setCurrentRepair({ year: '', cost: '', interval: '' }); // Reset form
    }
  };

  const handleRemoveRepair = (index) => {
    setNewAlternative(prev => ({
      ...prev,
      periodicRepairs: prev.periodicRepairs.filter((_, i) => i !== index)
    }));
  };
  // --- End Handlers ---


  const addAlternative = () => {
    if (!newAlternative.name) {
        alert("Please provide a name for the alternative.");
        return;
    }
    setAlternatives([...alternatives, { ...newAlternative }]);
    // Reset for next alternative
    setNewAlternative({
      name: '',
      initialCost: 0,
      initialDesignCost: '', 
      initialConstructionCost: '', 
      initialLandCost: '',
      annualOperatingCost: 0,
      annualEnergyCost: '', 
      annualWaterCost: '', 
      annualMaintenanceCost: '',
      periodicReplacements: [],
      periodicRepairs: [],
      salvageValue: 0,
      disposalCost: '',
      annualCarbonEmissions: 0,
      riskFactor: 1.0,
    });
     setCurrentReplacement({ year: '', cost: '', interval: '' });
     setCurrentRepair({ year: '', cost: '', interval: '' });
  };

  // --- Export Functionality ---
  const exportResultsToCSV = () => {
    if (!results || results.length === 0) return;

    const headers = [
        "Alternative Name",
        "Initial Cost ($)",
        "PV Annual Costs ($)",
        "PV Energy Costs ($)",
        "PV Maintenance Costs ($)",
        "PV Periodic Costs ($)",
        "PV Disposal Cost ($)",
        "PV Salvage Value ($)",
        "Total PV Costs (Raw) ($)",
        "Risk Factor",
        "LCC (Risk Adjusted) ($)",
        `Total CO2 (${projectInfo.studyPeriod} yrs) (kg)`,
        "Est. Carbon Cost ($)"
    ];
    const rows = results.map(res => [
        res.name,
        res.initialCost,
        res.pvAnnualCosts,
        res.pvEnergyCosts,
        res.pvMaintenanceCosts,
        res.pvPeriodicCosts,
        res.pvDisposalCost,
        res.pvSalvageValue,
        res.totalPvCostsRaw,
        res.riskFactor,
        res.lifeCycleCost,
        res.totalCarbonEmissions,
        res.estimatedCarbonCost
    ].join(','));

    const csvContent = "data:text/csv;charset=utf-8,"
        + headers.join(',') + "\n"
        + rows.join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `LCCA_Results_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  // --- End Export ---


  // Chart Data
  const data = {
    labels: results ? results.map((res) => res.name) : [],
    datasets: [
      // Keep the main LCC bar
      {
        label: 'Risk-Adjusted LCC ($)',
        data: results ? results.map((res) => parseFloat(res.lifeCycleCost)) : [],
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
        order: 1 // Ensure this is drawn first or last if stacking
      },
      // Update stacked bars for more detail if desired
       {
        label: 'Initial Cost ($)',
        data: results ? results.map(res => parseFloat(res.initialCost)) : [],
        backgroundColor: 'rgba(255, 99, 132, 0.6)', // Red
        stack: 'Stack 0', order: 2
      },
      { // Replace PV Operating Costs with more specific breakdowns if available
        label: 'PV Annual Costs ($)', // Or PV Energy, PV Maintenance etc.
        data: results ? results.map(res => parseFloat(res.pvAnnualCosts)) : [],
        backgroundColor: 'rgba(54, 162, 235, 0.6)', // Blue
        stack: 'Stack 0', order: 2
      },
       {
        label: 'PV Periodic Costs ($)',
        data: results ? results.map(res => parseFloat(res.pvPeriodicCosts)) : [],
        backgroundColor: 'rgba(255, 206, 86, 0.6)', // Yellow
        stack: 'Stack 0', order: 2
      },
       {
        label: 'PV Disposal Cost ($)',
        data: results ? results.map(res => parseFloat(res.pvDisposalCost)) : [],
        backgroundColor: 'rgba(255, 159, 64, 0.6)', // Orange
        stack: 'Stack 0', order: 2
      },
       {
        label: 'PV Salvage Value (-$)',
        data: results ? results.map(res => -parseFloat(res.pvSalvageValue)) : [],
        backgroundColor: 'rgba(153, 102, 255, 0.6)', // Purple
        stack: 'Stack 0', order: 2
      },
    ],
  };

  const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: { display: true, text: 'Comparison of Life Cycle Costs' },
        tooltip: { mode: 'index', intersect: false },
      },
      scales: {
        x: { stacked: true }, // Enable stacking on X-axis for component breakdown
        y: { stacked: true, beginAtZero: true, title: { display: true, text: 'Present Value Cost ($)' } },
      },
  };


  return (
    <div className="lcca-tool">
      <h1>Life Cycle Cost Analysis (LCCA) Tool</h1>

      {/* Analysis Parameters Section */}
      <div className="project-info-section">
        <h2>Analysis Parameters</h2>
        <div className="info-grid">
            {/* Existing: Start Year, Study Period, Discount Rate, General Inflation */}
            <label> Analysis Start Year: <input type="number" value={projectInfo.analysisStartYear} onChange={(e) => setProjectInfo({ ...projectInfo, analysisStartYear: parseInt(e.target.value) || new Date().getFullYear() })} /> </label>
            <label> Study Period (Years): <input type="number" value={projectInfo.studyPeriod} onChange={(e) => setProjectInfo({ ...projectInfo, studyPeriod: parseInt(e.target.value) || 1 })} /> </label>
            <label> Discount Rate (%): <input type="number" step="0.1" value={projectInfo.discountRate} onChange={(e) => setProjectInfo({ ...projectInfo, discountRate: parseFloat(e.target.value) || 0 })} /> </label>
            <label> General Inflation (%): <input type="number" step="0.1" value={projectInfo.inflationRate} onChange={(e) => setProjectInfo({ ...projectInfo, inflationRate: parseFloat(e.target.value) || 0 })} /> </label>
            {/* Optional Specific Inflation Rates */}
            <label className="optional-label"> Energy Inflation (%): <input type="number" step="0.1" placeholder={`Default: ${projectInfo.inflationRate}%`} value={projectInfo.energyInflationRate} onChange={(e) => setProjectInfo({ ...projectInfo, energyInflationRate: e.target.value })} /> </label>
            <label className="optional-label"> Maintenance Inflation (%): <input type="number" step="0.1" placeholder={`Default: ${projectInfo.inflationRate}%`} value={projectInfo.maintenanceInflationRate} onChange={(e) => setProjectInfo({ ...projectInfo, maintenanceInflationRate: e.target.value })} /> </label>
        </div>
      </div>

      {/* Add Alternative Section */}
      <div className="input-section">
        <h2>Add New Alternative</h2>
        <div className="input-grid">
          {/* --- Basic Info --- */}
          <div className="input-group">
            <h3>Basic Info</h3>
            <label> Alternative Name: <input type="text" value={newAlternative.name} onChange={(e) => setNewAlternative({ ...newAlternative, name: e.target.value })} /> </label>
          </div>

          {/* --- Initial Costs --- */}
          <div className="input-group">
             <h3>Initial Costs (Year 0)</h3>
             <p className="input-note">Provide EITHER Combined OR Detailed Costs</p>
             <label> Combined Initial Cost ($): <input type="number" value={newAlternative.initialCost} onChange={(e) => setNewAlternative({ ...newAlternative, initialCost: parseFloat(e.target.value) || 0 })} /> </label>
             <hr className="optional-hr"/>
             <label className="optional-label"> Design Cost ($): <input type="number" value={newAlternative.initialDesignCost} onChange={(e) => setNewAlternative({ ...newAlternative, initialDesignCost: e.target.value })} /> </label>
             <label className="optional-label"> Construction Cost ($): <input type="number" value={newAlternative.initialConstructionCost} onChange={(e) => setNewAlternative({ ...newAlternative, initialConstructionCost: e.target.value })} /> </label>
             <label className="optional-label"> Land/Other Cost ($): <input type="number" value={newAlternative.initialLandCost} onChange={(e) => setNewAlternative({ ...newAlternative, initialLandCost: e.target.value })} /> </label>
          </div>

          {/* --- Annual Costs --- */}
          <div className="input-group">
             <h3>Annual Costs (Base Year)</h3>
             <p className="input-note">Provide EITHER Combined OR Detailed Costs</p>
             <label> Combined Operating Cost ($): <input type="number" value={newAlternative.annualOperatingCost} onChange={(e) => setNewAlternative({ ...newAlternative, annualOperatingCost: parseFloat(e.target.value) || 0 })} /> </label>
             <hr className="optional-hr"/>
             <label className="optional-label"> Energy Cost ($): <input type="number" value={newAlternative.annualEnergyCost} onChange={(e) => setNewAlternative({ ...newAlternative, annualEnergyCost: e.target.value })} /> </label>
             <label className="optional-label"> Water Cost ($): <input type="number" value={newAlternative.annualWaterCost} onChange={(e) => setNewAlternative({ ...newAlternative, annualWaterCost: e.target.value })} /> </label>
             <label className="optional-label"> Maintenance Cost ($): <input type="number" value={newAlternative.annualMaintenanceCost} onChange={(e) => setNewAlternative({ ...newAlternative, annualMaintenanceCost: e.target.value })} /> </label>
          </div>

          {/* --- Periodic Costs (Replacements/Repairs) --- */}
          {/* Existing Periodic Replacements Input Group */}
          <div className="input-group periodic-cost-group">
            <h3>Periodic Replacements</h3>
            {/* ... periodic input form and list ... */}
             <div className="periodic-input-form"> <input type="number" placeholder="Year" value={currentReplacement.year} onChange={(e) => setCurrentReplacement({...currentReplacement, year: e.target.value})} /> <input type="number" placeholder="Cost (Base Year $)" value={currentReplacement.cost} onChange={(e) => setCurrentReplacement({...currentReplacement, cost: e.target.value})} /> <input type="number" placeholder="Interval (Years, 0=once)" value={currentReplacement.interval} onChange={(e) => setCurrentReplacement({...currentReplacement, interval: e.target.value})} /> <button onClick={handleAddReplacement} className="add-periodic-btn">+</button> </div> <ul className="periodic-list"> {newAlternative.periodicReplacements.map((rep, index) => ( <li key={index}> Year {rep.year}, ${rep.cost} {rep.interval > 0 ? `(every ${rep.interval} yrs)` : '(once)'} <button onClick={() => handleRemoveReplacement(index)} className="remove-periodic-btn">x</button> </li> ))} </ul>
          </div>
          {/* Existing Periodic Repairs Input Group */}
           <div className="input-group periodic-cost-group">
            <h3>Periodic Major Repairs</h3>
            {/* ... periodic input form and list ... */}
             <div className="periodic-input-form"> <input type="number" placeholder="Year" value={currentRepair.year} onChange={(e) => setCurrentRepair({...currentRepair, year: e.target.value})} /> <input type="number" placeholder="Cost (Base Year $)" value={currentRepair.cost} onChange={(e) => setCurrentRepair({...currentRepair, cost: e.target.value})} /> <input type="number" placeholder="Interval (Years, 0=once)" value={currentRepair.interval} onChange={(e) => setCurrentRepair({...currentRepair, interval: e.target.value})} /> <button onClick={handleAddRepair} className="add-periodic-btn">+</button> </div> <ul className="periodic-list"> {newAlternative.periodicRepairs.map((rep, index) => ( <li key={index}> Year {rep.year}, ${rep.cost} {rep.interval > 0 ? `(every ${rep.interval} yrs)` : '(once)'} <button onClick={() => handleRemoveRepair(index)} className="remove-periodic-btn">x</button> </li> ))} </ul>
          </div>


          {/* --- End of Life & Optional Metrics --- */}
          <div className="input-group">
            <h3>End of Life & Optional Metrics</h3>
             <label> Salvage Value ($) (Base Year, at end): <input type="number" value={newAlternative.salvageValue} onChange={(e) => setNewAlternative({ ...newAlternative, salvageValue: parseFloat(e.target.value) || 0 })} /> </label>
             <label className="optional-label"> Disposal Cost ($) (Base Year, at end): <input type="number" value={newAlternative.disposalCost} onChange={(e) => setNewAlternative({ ...newAlternative, disposalCost: e.target.value })} /> </label>
             <hr className="optional-hr"/>
             <label className="optional-label"> Annual Carbon Emissions (kg CO2e/year): <input type="number" value={newAlternative.annualCarbonEmissions} onChange={(e) => setNewAlternative({ ...newAlternative, annualCarbonEmissions: parseFloat(e.target.value) || 0 })} /> </label>
             <label className="optional-label"> Risk Factor (Multiplier): <input type="number" step="0.01" min="0" value={newAlternative.riskFactor} onChange={(e) => setNewAlternative({ ...newAlternative, riskFactor: parseFloat(e.target.value) || 1.0 })} /> </label>
          </div>

        </div>
        <button onClick={addAlternative} className="add-alternative-btn">Add Alternative to Analysis</button>
      </div>

      {/* Alternatives Summary Section */}
      {/* ... existing JSX ... */}
       <div className="alternatives-section"> <h2>Alternatives Added</h2> {alternatives.length === 0 ? ( <p>No alternatives added yet.</p> ) : ( <> <ul> {alternatives.map((alt, index) => ( <li key={index} className="alternative-item"> <h3>{alt.name}</h3> </li> ))} </ul> <button onClick={calculateLCCA} className="calculate-lcca-btn">Calculate LCCA</button> </> )} </div>

      {/* Results Section */}
      <div className="results-section" ref={resultsRef}>
        <h2>Analysis Results</h2>
        {results ? (
          <>
            <div className="results-grid">
              {results.map((res, index) => (
                <div key={index} className="result-card">
                  <h3>{res.name}</h3>
                  <p><strong>LCC (Risk Adj.): ${res.lifeCycleCost}</strong></p>
                  <p>Initial Cost: ${res.initialCost}</p>
                  <p>PV Annual Costs: ${res.pvAnnualCosts}</p>
                  <p>PV Periodic Costs: ${res.pvPeriodicCosts}</p>
                  <p>PV Disposal Cost: ${res.pvDisposalCost}</p>
                  <p>PV Salvage Value: ${res.pvSalvageValue}</p>
                  <p>Risk Factor: {res.riskFactor}</p>
                  <p>Est. Carbon Cost: ${res.estimatedCarbonCost}</p>
                  {/* Optionally show detailed PV costs */}
                  {/* <p>PV Energy: ${res.pvEnergyCosts}</p> */}
                  {/* <p>PV Maintenance: ${res.pvMaintenanceCosts}</p> */}
                </div>
              ))}
            </div>
            <div className="chart-container">
              <Bar data={data} options={chartOptions} />
            </div>
            <button onClick={exportResultsToCSV} className="export-button">Export Results to CSV</button>
          </>
        ) : (
          <p>No results yet. Add alternatives and click "Calculate LCCA".</p>
        )}
      </div>
    </div>
  );
};

export default LCCATool;
