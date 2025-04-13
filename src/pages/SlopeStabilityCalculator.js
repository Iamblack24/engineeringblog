import React, { useState, useCallback } from 'react';
import './SlopeStabilityCalculator.css'; // Import the CSS file for styling
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Title, // Import Title
} from 'chart.js';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Register ChartJS components
ChartJS.register(
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Title // Register Title
);

const SlopeStabilityCalculator = () => {
  const [input, setInput] = useState({
    slopeAngle: '30',
    cohesion: '5', // Effective cohesion (c')
    frictionAngle: '25', // Effective friction angle (phi')
    unitWeight: '18', // Total unit weight (gamma)
    slopeHeight: '10', // Slope height (z)
    porePressureRatio: '0.2', // Pore pressure ratio (ru = u / gamma*z)
  });
  // Consolidate results into a single state object
  const [results, setResults] = useState({
    factorOfSafety: null,
    fosCohesionComponent: null,
    fosFrictionComponent: null,
    criticalHeight: null,
    criticalPorePressureRatio: null,
  });
  const [chartData, setChartData] = useState(null);
  const [error, setError] = useState('');

  const targetFOS = 1.5; // Define target FOS here

  const handleChange = (e) => {
    const { name, value } = e.target;
    setInput(prevInput => ({
      ...prevInput,
      [name]: value
    }));
  };

  const calculateFactorOfSafety = (e) => {
    e.preventDefault();
    setError(''); // Clear previous errors
    // Reset results
    setResults({
        factorOfSafety: null,
        fosCohesionComponent: null,
        fosFrictionComponent: null,
        criticalHeight: null,
        criticalPorePressureRatio: null,
    });
    setChartData(null);

    // Convert inputs to numbers
    const slopeAngleNum = parseFloat(input.slopeAngle);
    const cohesionNum = parseFloat(input.cohesion);
    const frictionAngleNum = parseFloat(input.frictionAngle);
    const unitWeightNum = parseFloat(input.unitWeight);
    const slopeHeightNum = parseFloat(input.slopeHeight);
    const porePressureRatioNum = parseFloat(input.porePressureRatio);

    // --- Input Validation ---
    if (isNaN(slopeAngleNum) || isNaN(cohesionNum) || isNaN(frictionAngleNum) || isNaN(unitWeightNum) || isNaN(slopeHeightNum) || isNaN(porePressureRatioNum)) {
      setError('Please enter valid numbers for all fields.');
      return;
    }
    if (slopeAngleNum <= 0 || slopeAngleNum >= 90) {
        setError('Slope angle must be between 0 and 90 degrees.');
        return;
    }
     if (unitWeightNum <= 0 || slopeHeightNum <= 0) {
        setError('Unit weight and slope height must be positive.');
        return;
    }
     if (porePressureRatioNum < 0 || porePressureRatioNum > 0.6) { // Typical range check
        setError('Pore pressure ratio should generally be between 0 and 0.6.');
        return;
    }

    // --- Calculations ---
    const betaRad = (slopeAngleNum * Math.PI) / 180; // Slope angle in radians
    const phiRad = (frictionAngleNum * Math.PI) / 180; // Friction angle in radians

    const sinBeta = Math.sin(betaRad);
    const cosBeta = Math.cos(betaRad);
    const tanBeta = Math.tan(betaRad);
    const tanPhi = Math.tan(phiRad);

    if (Math.abs(sinBeta) < 1e-9 || Math.abs(cosBeta) < 1e-9) {
        setError('Invalid slope angle causing calculation error (sin or cos is zero).');
        return;
    }

    // Calculate FOS Components
    const fosCohesionComponent = cohesionNum / (unitWeightNum * slopeHeightNum * sinBeta * cosBeta);
    const fosFrictionComponent = (1 - porePressureRatioNum) * tanPhi / tanBeta;
    const fos = fosCohesionComponent + fosFrictionComponent;

    // Calculate Critical Height (Hc for FOS = 1.0)
    let criticalHeight = null;
    const frictionComponentForHc = (1 - porePressureRatioNum) * tanPhi / tanBeta; // Friction component is independent of height
    if (1.0 > frictionComponentForHc) { // Only possible if required FOS > friction component
        criticalHeight = cohesionNum / ((1.0 - frictionComponentForHc) * unitWeightNum * sinBeta * cosBeta);
    } else {
        criticalHeight = Infinity; // Friction alone provides FOS >= 1.0
    }

    // Calculate Critical Pore Pressure Ratio (ru_crit for FOS = 1.5)
    let criticalPorePressureRatio = null;
    const cohesionComponentForRu = cohesionNum / (unitWeightNum * slopeHeightNum * sinBeta * cosBeta); // Cohesion component is independent of ru
    if (targetFOS > cohesionComponentForRu && Math.abs(tanPhi) > 1e-9) { // Only possible if target FOS > cohesion component and there's friction
        criticalPorePressureRatio = 1 - ((targetFOS - cohesionComponentForRu) * tanBeta / tanPhi);
        // Ensure ru_crit is physically meaningful (e.g., >= 0)
        criticalPorePressureRatio = Math.max(0, criticalPorePressureRatio);
    } else if (targetFOS <= cohesionComponentForRu) {
         criticalPorePressureRatio = Infinity; // Cohesion alone provides FOS >= target, stable even if saturated
    } else {
        criticalPorePressureRatio = -Infinity; // Cannot achieve target FOS even when dry (ru=0)
    }


    // --- Update State ---
    setResults({
        factorOfSafety: fos,
        fosCohesionComponent: fosCohesionComponent,
        fosFrictionComponent: fosFrictionComponent,
        criticalHeight: criticalHeight,
        criticalPorePressureRatio: criticalPorePressureRatio,
    });
    prepareChartData(fos);
  };

  const prepareChartData = (fos) => {
    // ... (chart data preparation remains the same) ...
    setChartData({
      labels: ['Factor of Safety'],
      datasets: [
        {
          label: 'Calculated FOS',
          data: [fos],
          backgroundColor: fos >= targetFOS ? 'rgba(75, 192, 75, 0.6)' : 'rgba(255, 99, 132, 0.6)', // Green if OK, Red if not
          borderColor: fos >= targetFOS ? 'rgba(75, 192, 75, 1)' : 'rgba(255, 99, 132, 1)',
          borderWidth: 1,
        },
        {
          label: 'Required FOS',
          data: [targetFOS],
          backgroundColor: 'rgba(255, 159, 64, 0.6)',
          borderColor: 'rgba(255, 159, 64, 1)',
          borderWidth: 1,
        },
      ],
    });
  };

  const chartOptions = {
    // ... (chart options remain the same) ...
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Factor of Safety Comparison',
      },
    },
    scales: {
        y: {
            beginAtZero: true,
            suggestedMax: 2.5 // Adjust scale for typical FOS values
        }
    }
  };

  // --- PDF Export Handler ---
  const handleExportPDF = useCallback(async () => {
    // ... (PDF setup remains largely the same) ...
    const formElement = document.querySelector('.slope-stability-calculator form');
    const resultsElement = document.querySelector('.results-container'); // Target the container for results + chart

    if (!formElement || !resultsElement) {
      console.error("Required elements not found for PDF export.");
      alert("Cannot export PDF: Calculation elements missing.");
      return;
    }

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const margin = 15; // Increased margin
    const contentWidth = pdfWidth - 2 * margin;
    let currentY = margin;

    pdf.setFontSize(16);
    pdf.text("Slope Stability Analysis Report", pdfWidth / 2, currentY, { align: 'center' });
    currentY += 15;

    // --- 1. Add Input Parameters ---
    pdf.setFontSize(12);
    pdf.text("Input Parameters:", margin, currentY);
    currentY += 8;
    pdf.setFontSize(10);

    const inputFields = [
        { label: "Slope Angle (β)", value: `${input.slopeAngle}°` },
        { label: "Effective Cohesion (c')", value: `${input.cohesion} kPa` },
        { label: "Effective Friction Angle (φ')", value: `${input.frictionAngle}°` },
        { label: "Unit Weight (γ)", value: `${input.unitWeight} kN/m³` },
        { label: "Slope Height (z)", value: `${input.slopeHeight} m` },
        { label: "Pore Pressure Ratio (ru)", value: input.porePressureRatio },
    ];

    inputFields.forEach(field => {
        if (currentY > pdfHeight - margin - 5) { // Check for page break
             pdf.addPage();
             currentY = margin;
        }
        pdf.text(`${field.label}: ${field.value}`, margin + 5, currentY);
        currentY += 6;
    });
    currentY += 5; // Extra space before results

    // --- 2. Capture and Add Results & Chart ---
    // Add calculated results text before the image capture
    pdf.setFontSize(12);
    pdf.text("Calculated Results:", margin, currentY);
    currentY += 8;
    pdf.setFontSize(10);

    const resultFields = [
        { label: "Overall Factor of Safety (FOS)", value: results.factorOfSafety?.toFixed(3) },
        { label: "  - Cohesion Component (FOS_c)", value: results.fosCohesionComponent?.toFixed(3) },
        { label: "  - Friction Component (FOS_phi)", value: results.fosFrictionComponent?.toFixed(3) },
        { label: "Critical Height (Hc for FOS=1.0)", value: results.criticalHeight === Infinity ? "Infinite (Stable due to friction)" : results.criticalHeight?.toFixed(2) + " m" },
        { label: `Critical Pore Pressure Ratio (ru_crit for FOS=${targetFOS})`, value: formatRuCrit(results.criticalPorePressureRatio) }
    ];

     resultFields.forEach(field => {
        if (currentY > pdfHeight - margin - 5) { // Check for page break
             pdf.addPage();
             currentY = margin;
        }
        pdf.text(`${field.label}: ${field.value ?? 'N/A'}`, margin + 5, currentY);
        currentY += 6;
    });
    currentY += 5; // Extra space before image


    // Capture the chart/visual results part
    try {
      const resultsCanvas = await html2canvas(resultsElement, { // Capture the container div
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff', // Ensure background
        windowWidth: resultsElement.scrollWidth,
        windowHeight: resultsElement.scrollHeight
      });

      const resultsImgData = resultsCanvas.toDataURL('image/png'); // Use PNG
      const resultsImgWidth = resultsCanvas.width;
      const resultsImgHeight = resultsCanvas.height;
      const resultsRatio = resultsImgWidth / resultsImgHeight;
      let resultsImgHeightInPDF = contentWidth / resultsRatio;

      if (currentY + resultsImgHeightInPDF > pdfHeight - margin) {
        pdf.addPage();
        currentY = margin;
      }

      pdf.addImage(resultsImgData, 'PNG', margin, currentY, contentWidth, resultsImgHeightInPDF);
      currentY += resultsImgHeightInPDF + 5;

    } catch (err) {
      console.error("Error capturing results/chart for PDF:", err);
      alert("Failed to capture results/chart for PDF.");
      // Continue saving PDF without results image if capture fails
    }

    // --- 3. Save PDF ---
    pdf.save(`slope-stability-report.pdf`);

  }, [input, results, targetFOS]); // Add targetFOS to dependencies

  // Helper function to format ru_crit for display/PDF
  const formatRuCrit = (ruCrit) => {
      if (ruCrit === null || ruCrit === undefined) return 'N/A';
      if (ruCrit === Infinity) return "Infinite (Stable due to cohesion)";
      if (ruCrit === -Infinity) return "N/A (Cannot achieve target FOS)";
      if (ruCrit > 0.6) return `${ruCrit.toFixed(3)} (Warning: High value)`; // Add warning for high values
      return ruCrit.toFixed(3);
  };


  return (
    <div className="slope-stability-calculator" id="slope-calculator-content">
      <h1>Slope Stability Calculator (Infinite Slope)</h1>
      <form onSubmit={calculateFactorOfSafety}>
        {/* Input Fields (remain the same) */}
        {/* ... */}
         <div className="form-group">
          <label htmlFor="slopeAngle">Slope Angle (β) (°):</label>
          <input
            type="number" step="0.1" id="slopeAngle" name="slopeAngle"
            value={input.slopeAngle} onChange={handleChange} required
          />
        </div>
        <div className="form-group">
          <label htmlFor="cohesion">Effective Cohesion (c') (kPa):</label>
          <input
            type="number" step="0.1" id="cohesion" name="cohesion"
            value={input.cohesion} onChange={handleChange} required
          />
        </div>
        <div className="form-group">
          <label htmlFor="frictionAngle">Effective Friction Angle (φ') (°):</label>
          <input
            type="number" step="0.1" id="frictionAngle" name="frictionAngle"
            value={input.frictionAngle} onChange={handleChange} required
          />
        </div>
        <div className="form-group">
          <label htmlFor="unitWeight">Unit Weight (γ) (kN/m³):</label>
          <input
            type="number" step="0.1" id="unitWeight" name="unitWeight"
            value={input.unitWeight} onChange={handleChange} required
          />
        </div>
        <div className="form-group">
          <label htmlFor="slopeHeight">Slope Height (z) (m):</label>
          <input
            type="number" step="0.1" id="slopeHeight" name="slopeHeight"
            value={input.slopeHeight} onChange={handleChange} required
          />
        </div>
        <div className="form-group">
          <label htmlFor="porePressureRatio">Pore Pressure Ratio (r<sub>u</sub>):</label>
          <input
            type="number" step="0.01" id="porePressureRatio" name="porePressureRatio"
            value={input.porePressureRatio} onChange={handleChange} required placeholder="e.g., 0.0 for dry, 0.5 for fully submerged"
          />
           <small>r<sub>u</sub> = Pore Pressure / (γ * z)</small>
        </div>

        {/* Submit Button */}
        <button type="submit">Calculate Factor of Safety</button>
      </form>

      {/* Error Display */}
      {error && <p className="error-message">{error}</p>}

      {/* Results Container */}
      {results.factorOfSafety !== null && !error && (
        <div className="results-container"> {/* Wrap results and chart */}
            <div className="results">
              <h2>Factor of Safety (FOS)</h2>
              <p className={results.factorOfSafety >= targetFOS ? 'safe' : 'unsafe'}>
                {results.factorOfSafety.toFixed(3)}
              </p>
              <p className="status-text">
                {results.factorOfSafety >= targetFOS ? `(Generally Considered Stable >= ${targetFOS})` : `(Potentially Unstable < ${targetFOS} - Review Required)`}
              </p>

              {/* Display Additional Results */}
              <div className="additional-results">
                  <p>Cohesion Component (FOS<sub>c</sub>): {results.fosCohesionComponent?.toFixed(3) ?? 'N/A'}</p>
                  <p>Friction Component (FOS<sub>φ</sub>): {results.fosFrictionComponent?.toFixed(3) ?? 'N/A'}</p>
                  <p>Critical Height (H<sub>c</sub> for FOS=1.0): {results.criticalHeight === Infinity ? "Infinite" : results.criticalHeight?.toFixed(2) + " m" ?? 'N/A'}</p>
                  <p>Critical Pore Pressure Ratio (r<sub>u,crit</sub> for FOS={targetFOS}): {formatRuCrit(results.criticalPorePressureRatio)}</p>
              </div>
            </div>

            {/* Chart Display */}
            {chartData && (
              <div className="chart-container">
                <Bar data={chartData} options={chartOptions} /> 
              </div>
            )}
        </div>
      )}

      {/* Export Button */}
      {results.factorOfSafety !== null && !error && (
         <button type="button" onClick={handleExportPDF} className="export-button">
           Export Results to PDF
         </button>
       )}
    </div>
  );
};

export default SlopeStabilityCalculator;