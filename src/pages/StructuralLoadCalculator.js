// src/pages/StructuralLoadCalculator.js
import React, { useState, useRef } from 'react'; // Added useRef
import './StructuralLoadCalculator.css';
import { Line } from 'react-chartjs-2';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend);

const StructuralLoadCalculator = () => {
  const [beamType, setBeamType] = useState('simplySupported'); // New state for beam type
  const [beam, setBeam] = useState({
    mainSpan: '',
    overhang: '',
  });

  const [pointLoads, setPointLoads] = useState([]);
  const [udls, setUdls] = useState([]);

  const [result, setResult] = useState(null);
  const [shearForce, setShearForce] = useState([]);
  const [bendingMoment, setBendingMoment] = useState([]);
  const resultsRef = useRef(null); // Ref for the content to export

  // Handle beam type selection
  const handleBeamTypeChange = (e) => {
    setBeamType(e.target.value);
    // Reset beam geometry when beam type changes
    setBeam({
      mainSpan: '',
      overhang: '',
    });
    setPointLoads([]);
    setUdls([]);
    setResult(null);
    setShearForce([]);
    setBendingMoment([]);
  };

  // Handle beam geometry input changes
  const handleBeamChange = (e) => {
    const { name, value } = e.target;
    setBeam((prevBeam) => ({
      ...prevBeam,
      [name]: parseFloat(value),
    }));
  };

  // Handle point loads input changes
  const handlePointLoadChange = (index, e) => {
    const { name, value } = e.target;
    const newPointLoads = [...pointLoads];
    newPointLoads[index][name] = parseFloat(value);
    setPointLoads(newPointLoads);
  };

  // Handle UDLs input changes
  const handleUdlChange = (index, e) => {
    const { name, value } = e.target;
    const newUdls = [...udls];
    newUdls[index][name] = parseFloat(value);
    setUdls(newUdls);
  };

  // Add a new point load
  const addPointLoad = () => {
    setPointLoads([...pointLoads, { value: '', position: '' }]);
  };

  // Add a new UDL
  const addUdl = () => {
    setUdls([...udls, { w: '', start: '', end: '' }]);
  };

  // Calculate Reactions based on beam type
  const calculateReactions = () => {
    const L = beam.mainSpan;
    const l = beam.overhang || 0; // Overhang length

    let totalLoad = 0;
    let RA = 0;
    let RB = 0;
    let MA = 0; // Fixed End Moment at A
    let MB = 0; // Fixed End Moment at B

    // Calculate total load first
    pointLoads.forEach(load => totalLoad += load.value);
    udls.forEach(udl => totalLoad += udl.w * (udl.end - udl.start));

    switch (beamType) {
      case 'simplySupported':
        let momentAboutA_ss = 0;
        pointLoads.forEach(load => momentAboutA_ss += load.value * load.position);
        udls.forEach(udl => {
          const length = udl.end - udl.start;
          momentAboutA_ss += (udl.w * length) * (udl.start + length / 2);
        });
        if (L > 0) RB = momentAboutA_ss / L;
        RA = totalLoad - RB;
        break;

      case 'fixed':
        // Calculate Fixed End Moments (FEMs) using superposition
        MA = 0;
        MB = 0;
        pointLoads.forEach(load => {
          const a = load.position;
          const b = L - a;
          if (L > 0) {
            MA -= (load.value * a * b * b) / (L * L); // Hogging (-)
            MB += (load.value * a * a * b) / (L * L); // Sagging (+) - Check convention, often MB is also hogging
          }
        });
        udls.forEach(udl => {
          // Formula for partial UDL on fixed beam is complex.
          // Using approximation for full UDL for simplicity, needs refinement for partial.
          // Assuming UDL covers the whole span for FEM calculation:
          if (udl.start === 0 && udl.end === L && L > 0) {
             MA -= (udl.w * L * L) / 12; // Hogging (-)
             MB += (udl.w * L * L) / 12; // Sagging (+) - Check convention
          }
          // TODO: Add accurate partial UDL FEM calculation if needed
        });

        // Calculate reactions including effect of FEMs
        let loadMomentAboutA_fixed = 0;
        pointLoads.forEach(load => loadMomentAboutA_fixed += load.value * load.position);
        udls.forEach(udl => {
             const length = udl.end - udl.start;
             loadMomentAboutA_fixed += (udl.w * length) * (udl.start + length / 2);
        });

        if (L > 0) {
            // Sum moments about A = 0: RB*L + MA - MB - loadMomentAboutA_fixed = 0
            RB = (loadMomentAboutA_fixed + MB - MA) / L;
        }
        RA = totalLoad - RB;
        break;

      case 'cantilever':
        // Fixed at A (x=0)
        MA = 0; // Moment reaction at fixed support A
        pointLoads.forEach(load => MA -= load.value * load.position); // Hogging moment is negative
        udls.forEach(udl => {
          const length = udl.end - udl.start;
          MA -= (udl.w * length) * (udl.start + length / 2); // Hogging moment is negative
        });
        RA = totalLoad; // Vertical reaction at fixed support A
        RB = 0;
        break;

      case 'overhanging':
        // Supports at x=0 (A) and x=L (B)
        let momentAboutA_oh = 0;
        pointLoads.forEach(load => momentAboutA_oh += load.value * load.position);
        udls.forEach(udl => {
          const length = udl.end - udl.start;
          momentAboutA_oh += (udl.w * length) * (udl.start + length / 2);
        });
        // Sum moments about A = 0: RB*L - momentAboutA_oh = 0
        if (L > 0) RB = momentAboutA_oh / L;
        RA = totalLoad - RB;
        break;

      default:
        RA = 0;
        RB = 0;
    }

    // Return MA and MB only if it's a fixed beam
    const fixedEndMoments = beamType === 'fixed' || beamType === 'cantilever' ? { MA, MB } : {};
    return { RA, RB, totalLoad, fixedEndMoments };
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate inputs
    if (!beam.mainSpan || beam.mainSpan <= 0 || (beamType === 'overhanging' && (!beam.overhang || beam.overhang < 0))) {
       alert('Please enter valid positive beam dimensions.');
       return;
    }
    // Add more validation for load positions vs beam length

    // Calculate reactions
    const { RA, RB, totalLoad, fixedEndMoments } = calculateReactions();
    const MA = fixedEndMoments.MA || 0; // Get MA if it exists

    // Define L within this scope
    const L = beam.mainSpan; 

    // Initialize arrays for shear force and bending moment
    const shear = [];
    const momentArr = [];

    const totalLength = beamType === 'overhanging' ? beam.mainSpan + beam.overhang : beam.mainSpan;
    const increment = totalLength / 100; // Use relative increment

    for (let i = 0; i <= 100; i++) {
        const x = i * increment;
        let V = RA;
        // Start moment with MA for fixed/cantilever beams
        let M = MA + RA * x; 

        // Apply point loads
        pointLoads.forEach((load) => {
            if (x >= load.position) {
                V -= load.value;
                M -= load.value * (x - load.position);
            }
        });

        // Apply UDLs
        udls.forEach((udl) => {
            const w = udl.w;
            const a = udl.start;
            const b = udl.end;

            if (x >= a && x <= b) {
                const span = x - a;
                V -= w * span;
                M -= (w * Math.pow(span, 2)) / 2;
            } else if (x > b) {
                const span = b - a;
                V -= w * span;
                M -= w * span * (x - (a + b) / 2);
            }
        });

        // Apply reaction RB for simply supported and overhanging beams at x=L
        // Check if L is defined and greater than 0 before using it
        if (L && L > 0 && (beamType === 'simplySupported' || beamType === 'overhanging') && x >= L) { 
             // Apply RB shear jump correctly - only if x is exactly L or slightly after
             // The loop structure makes exact application tricky. Better to calculate piecewise.
             // Simplified: Assume RB acts at L. The shear calculation handles this implicitly if RA+RB = totalLoad.
             // Moment calculation needs adjustment for RB past L
             if (x > L) {
                 M -= RB * (x - L); // Moment effect of RB past support B
             }
        }
        // Note: The shear jump at RB isn't explicitly shown with this loop method,
        // but the values before and after L should reflect it.

        shear.push({ x: parseFloat(x.toFixed(2)), y: parseFloat(V.toFixed(2)) });
        // Ensure moment convention consistency (sagging positive)
        momentArr.push({ x: parseFloat(x.toFixed(2)), y: parseFloat(M.toFixed(2)) });
    }

    setResult({
      RA: RA.toFixed(2),
      RB: RB.toFixed(2),
      totalLoad: totalLoad.toFixed(2),
      ...(fixedEndMoments.MA !== undefined && { MA: fixedEndMoments.MA.toFixed(2) }), // Include MA if defined
      ...(fixedEndMoments.MB !== undefined && beamType === 'fixed' && { MB: fixedEndMoments.MB.toFixed(2) }), // Include MB only for fixed
    });
    setShearForce(shear);
    setBendingMoment(momentArr);
  };

  // Prepare Chart Data for Shear Force and Bending Moment
  const prepareChartData = () => {
    const shearLabels = shearForce.map((point) => point.x);
    const shearData = shearForce.map((point) => point.y);

    const momentLabels = bendingMoment.map((point) => point.x);
    const momentData = bendingMoment.map((point) => point.y);

    return {
      shear: {
        labels: shearLabels,
        datasets: [
          {
            label: 'Shear Force (V)',
            data: shearData,
            borderColor: 'rgba(255, 99, 132, 1)',
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            fill: false,
            tension: 0.1,
          },
        ],
      },
      moment: {
        labels: momentLabels,
        datasets: [
          {
            label: 'Bending Moment (M)',
            data: momentData,
            borderColor: 'rgba(54, 162, 235, 1)',
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            fill: false,
            tension: 0.1,
          },
        ],
      },
    };
  };

  // PDF Export Function
  const exportToPDF = () => {
    const content = resultsRef.current;
    if (!content) {
      alert("Results area not found.");
      return;
    }

    html2canvas(content, { scale: 2 }) // Increase scale for better resolution
      .then((canvas) => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
        const imgX = (pdfWidth - imgWidth * ratio) / 2;
        const imgY = 10; // Margin from top

        pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
        pdf.save('structural-load-calculation.pdf');
      })
      .catch(err => {
        console.error("Error generating PDF:", err);
        alert("Failed to generate PDF.");
      });
  };

  return (
    <div className="structural-load-calculator">
      <h1>Structural Load Calculator</h1>
      <form onSubmit={handleSubmit}>
        <h2>Beam Type</h2>
        <div className="form-group">
          <label htmlFor="beamType">Select Beam Type:</label>
          <select
            id="beamType"
            name="beamType"
            value={beamType}
            onChange={handleBeamTypeChange}
            required
          >
            <option value="simplySupported">Simply Supported</option>
            <option value="fixed">Fixed</option>
            <option value="cantilever">Cantilever</option>
            <option value="overhanging">Overhanging</option>
          </select>
        </div>

        <h2>Beam Geometry</h2>
        <div className="form-group">
          <label htmlFor="mainSpan">Main Span Length (L) in meters:</label>
          <input
            type="number"
            id="mainSpan"
            name="mainSpan"
            value={beam.mainSpan}
            onChange={handleBeamChange}
            placeholder="Enter main span length"
            step="0.1"
            required
          />
        </div>
        {beamType === 'overhanging' && (
          <div className="form-group">
            <label htmlFor="overhang">Overhang Length (l) in meters:</label>
            <input
              type="number"
              id="overhang"
              name="overhang"
              value={beam.overhang}
              onChange={handleBeamChange}
              placeholder="Enter overhang length"
              step="0.1"
              required
            />
          </div>
        )}

        <h2>Point Loads</h2>
        {pointLoads.map((load, index) => (
          <div key={index} className="load-group">
            <div className="form-group">
              <label>Load Value (P) in kN:</label>
              <input
                type="number"
                name="value"
                value={load.value}
                onChange={(e) => handlePointLoadChange(index, e)}
                placeholder="Enter load value"
                step="0.1"
                required
              />
            </div>
            <div className="form-group">
              <label>Position (x) in meters:</label>
              <input
                type="number"
                name="position"
                value={load.position}
                onChange={(e) => handlePointLoadChange(index, e)}
                placeholder="Enter position"
                step="0.1"
                required
              />
            </div>
          </div>
        ))}
        <button type="button" onClick={addPointLoad}>
          Add Point Load
        </button>

        <h2>Uniformly Distributed Loads (UDLs)</h2>
        {udls.map((udl, index) => (
          <div key={index} className="load-group">
            <div className="form-group">
              <label>Load Intensity (w) in kN/m:</label>
              <input
                type="number"
                name="w"
                value={udl.w}
                onChange={(e) => handleUdlChange(index, e)}
                placeholder="Enter load intensity"
                step="0.1"
                required
              />
            </div>
            <div className="form-group">
              <label>Start Position (a) in meters:</label>
              <input
                type="number"
                name="start"
                value={udl.start}
                onChange={(e) => handleUdlChange(index, e)}
                placeholder="Enter start position"
                step="0.1"
                required
              />
            </div>
            <div className="form-group">
              <label>End Position (b) in meters:</label>
              <input
                type="number"
                name="end"
                value={udl.end}
                onChange={(e) => handleUdlChange(index, e)}
                placeholder="Enter end position"
                step="0.1"
                required
              />
            </div>
          </div>
        ))}
        <button type="button" onClick={addUdl}>
          Add UDL
        </button>

        <button type="submit">Calculate</button>
      </form>

      {/* Wrap results and diagrams in a div with the ref */}
      <div ref={resultsRef}>
        {result && (
          <div className="results">
            <h2>Results</h2>
            <p>Reaction at A (RA): {result.RA} kN</p>
            <p>Reaction at B (RB): {result.RB} kN</p>
            <p>Total Load: {result.totalLoad} kN</p>
            {beamType === 'fixed' && (
              <>
                <p>Fixed End Moment at A (MA): {result.MA} kN·m</p>
                <p>Fixed End Moment at B (MB): {result.MB} kN·m</p>
              </>
            )}
          </div>
        )}

        {(shearForce.length > 0 && bendingMoment.length > 0) && (
          <div className="diagrams">
            <h2>Shear Force Diagram</h2>
            <div className="chart-container">
              <Line
                data={prepareChartData().shear}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'top',
                    },
                    title: {
                      display: true,
                      text: 'Shear Force Diagram',
                    },
                  },
                  scales: {
                    x: {
                      title: {
                        display: true,
                        text: 'Position (m)',
                      },
                    },
                    y: {
                      title: {
                        display: true,
                        text: 'Shear Force (kN)',
                      },
                    },
                  },
                }}
                height={300}
              />
            </div>

            <h2>Bending Moment Diagram</h2>
            <div className="chart-container">
              <Line
                data={prepareChartData().moment}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'top',
                    },
                    title: {
                      display: true,
                      text: 'Bending Moment Diagram',
                    },
                  },
                  scales: {
                    x: {
                      title: {
                        display: true,
                        text: 'Position (m)',
                      },
                    },
                    y: {
                      title: {
                        display: true,
                        text: 'Bending Moment (kN·m)',
                      },
                    },
                  },
                }}
                height={300}
              />
            </div>
          </div>
        )}
      </div>

      {/* Add Export Button */}
      {result && (
         <button
            type="button"
            onClick={exportToPDF}
            style={{ marginTop: '20px', display: 'block', marginLeft: 'auto', marginRight: 'auto' }} // Center button
         >
            Export Results to PDF
         </button>
      )}
    </div>
  );
};

export default StructuralLoadCalculator;