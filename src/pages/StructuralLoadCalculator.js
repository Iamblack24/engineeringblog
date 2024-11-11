// src/pages/StructuralLoadCalculator.js
import React, { useState } from 'react';
import './StructuralLoadCalculator.css';
import { Line } from 'react-chartjs-2';
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
    const l = beam.overhang || 0;

    // Total load from point loads
    let totalPointLoad = 0;
    pointLoads.forEach((load) => {
      totalPointLoad += load.value;
    });

    // Total load from UDLs
    let totalUdlLoad = 0;
    udls.forEach((udl) => {
      const length = udl.end - udl.start;
      totalUdlLoad += udl.w * length;
    });

    const totalLoad = totalPointLoad + totalUdlLoad;

    let RA = 0;
    let RB = 0;
    let centroid = 0;
    let momentA = 0;

    switch (beamType) {
      case 'simplySupported':
        // Reactions for Simply Supported Beams
        // Sum of moments about A: RB * L = Total Load * (centroid position)
        pointLoads.forEach((load) => {
          centroid += load.value * load.position;
        });

        udls.forEach((udl) => {
          const length = udl.end - udl.start;
          const totalUdLoad = udl.w * length;
          const udlCentroid = udl.start + length / 2;
          centroid += totalUdLoad * udlCentroid;
        });

        RB = centroid / L;
        RA = totalLoad - RB;
        break;

      case 'fixed':
        // Reactions for Fixed Beams
        // Requires additional calculations for fixed supports
        // For simplicity, assuming fixed at both ends with moments
        // Sum of vertical forces: RA + RB = Total Load
        // Sum of moments about A: RB * L = Total Load * centroid position
        // Additionally, calculate moments at supports

        pointLoads.forEach((load) => {
          centroid += load.value * load.position;
        });

        udls.forEach((udl) => {
          const length = udl.end - udl.start;
          const totalUdLoad = udl.w * length;
          const udlCentroid = udl.start + length / 2;
          centroid += totalUdLoad * udlCentroid;
        });

        RB = centroid / L;
        RA = totalLoad - RB;
        break;

      case 'cantilever':
        // Reactions for Cantilever Beams
        // Fixed at one end (A), free at the other

        pointLoads.forEach((load) => {
          momentA += load.value * load.position;
        });

        udls.forEach((udl) => {
          const length = udl.end - udl.start;
          const totalUdLoad = udl.w * length;
          const udlCentroid = udl.start + length / 2;
          momentA += totalUdLoad * udlCentroid;
        });

        RA = totalLoad;
        RB = 0; // No support at the free end
        break;

      case 'overhanging':
        // Reactions for Overhanging Beams
        // As previously implemented
        // Sum of moments about A
        pointLoads.forEach((load) => {
          if (load.position <= L) {
            momentA += load.value * load.position;
          } else {
            momentA += load.value * L;
          }
        });

        udls.forEach((udl) => {
          const length = udl.end - udl.start;
          const totalUdLoad = udl.w * length;
          const centroid = udl.start + length / 2;

          if (centroid <= L) {
            momentA += totalUdLoad * centroid;
          } else {
            momentA += totalUdLoad * L;
          }
        });

        RB = momentA / (L + l);
        RA = totalLoad - RB;
        break;

      default:
        RA = 0;
        RB = 0;
    }

    return { RA, RB, totalLoad };
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate inputs
    if (!beam.mainSpan || (beamType === 'overhanging' && beam.overhang === '')) {
      alert('Please enter beam geometry.');
      return;
    }

    // Calculate reactions
    const { RA, RB, totalLoad } = calculateReactions();

    // Initialize arrays for shear force and bending moment
    const shear = [];
    const momentArr = [];

    const totalLength =
      beamType === 'overhanging' ? beam.mainSpan + beam.overhang : beam.mainSpan;
    const increment = 0.1; // Define the resolution of the diagrams

    for (let x = 0; x <= totalLength; x += increment) {
      let V = RA;
      let M = RA * x;

      // Apply point loads
      pointLoads.forEach((load) => {
        if (x >= load.position && (beamType !== 'overhanging' || load.position <= beam.mainSpan)) {
          V -= load.value;
          M -= load.value * (x - load.position);
        }
      });

      // Apply UDLs
      udls.forEach((udl) => {
        const w = udl.w;
        const a = udl.start;
        const b = udl.end;

        if (x >= a && x <= b && (beamType !== 'overhanging' || a <= beam.mainSpan)) {
          const span = x - a;
          V -= w * span;
          M -= (w * Math.pow(span, 2)) / 2;
        } else if (x > b && (beamType !== 'overhanging' || a <= beam.mainSpan)) {
          const span = b - a;
          V -= w * span;
          M -= w * span * (x - (a + b) / 2);
        }

        // Handle overhang UDLs
        if (beamType === 'overhanging') {
          if (udl.start > beam.mainSpan && x >= udl.start && x <= udl.end) {
            const span = x - udl.start;
            V -= w * span;
            M -= (w * Math.pow(span, 2)) / 2;
          } else if (udl.start > beam.mainSpan && x > udl.end) {
            const span = udl.end - udl.start;
            V -= w * span;
            M -= w * span * (x - (udl.start + udl.end) / 2);
          }
        }
      });

      // Apply reaction RB if applicable
      if (beamType === 'overhanging' && x > beam.mainSpan) {
        V -= RB;
        M -= RB * (x - beam.mainSpan);
      }

      shear.push({ x: parseFloat(x.toFixed(2)), y: parseFloat(V.toFixed(2)) });
      momentArr.push({ x: parseFloat(x.toFixed(2)), y: parseFloat(M.toFixed(2)) });
    }

    setResult({ RA: RA.toFixed(2), RB: RB.toFixed(2), totalLoad: totalLoad.toFixed(2) });
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

      {result && (
        <div className="results">
          <h2>Support Reactions</h2>
          <p>
            <strong>Reaction at Support A (RA):</strong> {result.RA} kN
          </p>
          {beamType !== 'cantilever' && (
            <p>
              <strong>Reaction at Support B (RB):</strong> {result.RB} kN
            </p>
          )}
          <p>
            <strong>Total Load:</strong> {result.totalLoad} kN
          </p>
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
  );
};

export default StructuralLoadCalculator;