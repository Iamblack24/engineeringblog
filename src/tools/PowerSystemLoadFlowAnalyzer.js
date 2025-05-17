import React, { useState } from 'react';
import './PowerSystemLoadFlowAnalyzer.css';
import { Chart } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend } from 'chart.js';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend);

const PowerSystemLoadFlowAnalyzer = () => {
  // State management
  const [selectedSystem, setSelectedSystem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('id');
  const [sortOrder, setSortOrder] = useState('asc');
  const [simulationInputs, setSimulationInputs] = useState({
    bus1Voltage: 1.05, // p.u. (slack bus)
    bus2Voltage: 1.0, // p.u. (PV bus setpoint)
    bus2P: 50, // MW
    bus3P: -80, // MW (load)
    bus3Q: -30, // MVAr (load)
  });
  const [simulationResults, setSimulationResults] = useState(null);
  const [loading, setLoading] = useState(false);

  // Power system configurations (3-bus system example)
  const systemData = [
    {
      id: 'SYS-001',
      name: '3-Bus System A',
      buses: [
        { id: 'Bus1', type: 'slack', V: 1.05, angle: 0, P: 0, Q: 0 }, // Slack bus
        { id: 'Bus2', type: 'PV', V: 1.0, P: 50, Q: 0 }, // Generator bus
        { id: 'Bus3', type: 'PQ', V: 1.0, P: -80, Q: -30 }, // Load bus
      ],
      lines: [
        { from: 'Bus1', to: 'Bus2', R: 0.02, X: 0.06 }, // p.u.
        { from: 'Bus2', to: 'Bus3', R: 0.08, X: 0.24 },
        { from: 'Bus1', to: 'Bus3', R: 0.06, X: 0.18 },
      ],
      baseMVA: 100,
      basekV: 138,
    },
    {
      id: 'SYS-002',
      name: '3-Bus System B',
      buses: [
        { id: 'Bus1', type: 'slack', V: 1.05, angle: 0, P: 0, Q: 0 },
        { id: 'Bus2', type: 'PV', V: 1.02, P: 60, Q: 0 },
        { id: 'Bus3', type: 'PQ', V: 1.0, P: -90, Q: -40 },
      ],
      lines: [
        { from: 'Bus1', to: 'Bus2', R: 0.03, X: 0.08 },
        { from: 'Bus2', to: 'Bus3', R: 0.07, X: 0.22 },
        { from: 'Bus1', to: 'Bus3', R: 0.05, X: 0.15 },
      ],
      baseMVA: 100,
      basekV: 138,
    },
  ];

  // Build admittance matrix (Y-bus)
  const buildYBus = (system) => {
    const n = system.buses.length;
    const Y = Array(n).fill(null).map(() => Array(n).fill(null).map(() => new Complex(0, 0))); // Initialize with Complex objects

    system.lines.forEach(line => {
      const fromBusIndex = system.buses.findIndex(b => b.id === line.from); // Renamed variable
      const toBusIndex = system.buses.findIndex(b => b.id === line.to);   // Renamed variable
      const Z = new Complex(line.R, line.X); // Impedance as Complex
      const y = new Complex(1, 0).divide(Z); // Admittance y = 1/Z

      Y[fromBusIndex][fromBusIndex] = Y[fromBusIndex][fromBusIndex].add(y);
      Y[toBusIndex][toBusIndex] = Y[toBusIndex][toBusIndex].add(y);
      Y[fromBusIndex][toBusIndex] = Y[fromBusIndex][toBusIndex].subtract(y);
      Y[toBusIndex][fromBusIndex] = Y[toBusIndex][fromBusIndex].subtract(y);
    });

    return Y;
  };

  // Calculate power injections
  const calculatePower = (V, Y, n) => {
    const P = Array(n).fill(0);
    const Q = Array(n).fill(0);

    for (let i = 0; i < n; i++) {
      let sumViYij = new Complex(0, 0); // Initialize as Complex
      for (let j = 0; j < n; j++) {
        sumViYij = sumViYij.add(Y[i][j].multiply(V[j]));
      }
      // S_i = V_i * (sum(Y_ij * V_j))^*  <- This is current injection method, P = Re(V*I^*), I = YV
      // S_i = V_i * ( (Y_ii * V_i + sum_{k!=i} Y_ik * V_k) )^*
      // The common power flow equation is S_i = V_i * I_i^* where I_i = sum (Y_ik * V_k) for k=0 to n-1
      const I_i = sumViYij; // This is I_i = Y_ii*V_i + sum(Y_ik*V_k)
      const S_i = V[i].multiply(I_i.conjugate()); // S_i = V_i * I_i^*

      P[i] = S_i.real;
      Q[i] = S_i.imag;
    }

    return { P, Q };
  };

  // Newton-Raphson load flow solver
  const solveLoadFlow = (system, inputs) => {
    const n = system.buses.length; // n=3 for this specific setup
    const V_initial = system.buses.map(b => {
      if (b.id === 'Bus1') return Complex.fromPolar(inputs.bus1Voltage, 0); // Slack
      if (b.id === 'Bus2') return Complex.fromPolar(inputs.bus2Voltage, 0); // PV
      return Complex.fromPolar(1.0, 0); // PQ initial guess
    });
    const V = [...V_initial]; // Create a mutable copy

    const Y = buildYBus(system);

    // Specified powers in p.u.
    // Bus1 (index 0) is Slack
    // Bus2 (index 1) is PV: P_spec known, V_mag known
    // Bus3 (index 2) is PQ: P_spec and Q_spec known
    const P_spec_pu = [NaN, inputs.bus2P / system.baseMVA, inputs.bus3P / system.baseMVA];
    const Q_spec_pu = [NaN, NaN, inputs.bus3Q / system.baseMVA]; // Q for PV bus is unknown

    const maxIterations = 50;
    const tolerance = 1e-6;
    let iteration = 0;

    // Identify bus indices for convenience
    const pvBusIndex = system.buses.findIndex(b => b.type === 'PV'); // Should be 1
    const pqBusIndex = system.buses.findIndex(b => b.type === 'PQ'); // Should be 2

    if (pvBusIndex !== 1 || pqBusIndex !== 2 || system.buses[0].type !== 'slack' || n !== 3) {
        throw new Error("Solver is hardcoded for a 3-bus system: Slack (Bus1), PV (Bus2), PQ (Bus3).");
    }

    while (iteration < maxIterations) {
      const { P: P_calc, Q: Q_calc } = calculatePower(V, Y, n);

      // Mismatches: ΔP1 (for PV bus), ΔP2 (for PQ bus), ΔQ2 (for PQ bus)
      // Indices for dF: 0 -> PV bus P, 1 -> PQ bus P, 2 -> PQ bus Q
      const dF = [
        P_spec_pu[pvBusIndex] - P_calc[pvBusIndex],
        P_spec_pu[pqBusIndex] - P_calc[pqBusIndex],
        Q_spec_pu[pqBusIndex] - Q_calc[pqBusIndex]
      ];

      const maxMismatch = Math.max(...dF.map(Math.abs));
      if (maxMismatch < tolerance) break;

      // Jacobian J for unknowns [dδ_PV, dδ_PQ, d|V|_PQ]
      // J dimensions: 3x3
      // J[0][0] = ∂P_PV/∂δ_PV (H11)
      // J[0][1] = ∂P_PV/∂δ_PQ (H12)
      // J[0][2] = ∂P_PV/∂|V|_PQ (N12)
      // J[1][0] = ∂P_PQ/∂δ_PV (H21)
      // J[1][1] = ∂P_PQ/∂δ_PQ (H22)
      // J[1][2] = ∂P_PQ/∂|V|_PQ (N22)
      // J[2][0] = ∂Q_PQ/∂δ_PV (M21)
      // J[2][1] = ∂Q_PQ/∂δ_PQ (M22)
      // J[2][2] = ∂Q_PQ/∂|V|_PQ (L22)

      const J = Array(3).fill(null).map(() => Array(3).fill(0));
      const G = Y.map(row => row.map(y_el => y_el.real));
      const B = Y.map(row => row.map(y_el => y_el.imag));

      const Vm = V.map(v => v.abs());
      const Va = V.map(v => v.arg());

      // PV bus index = 1, PQ bus index = 2
      const i_pv = pvBusIndex;
      const i_pq = pqBusIndex;

      // Row 0: dP_PV equations
      // J[0][0] = H_pv,pv = ∂P_pv/∂δ_pv
      J[0][0] = -Q_calc[i_pv] - B[i_pv][i_pv] * Vm[i_pv]**2;
      // J[0][1] = H_pv,pq = ∂P_pv/∂δ_pq
      J[0][1] = Vm[i_pv] * Vm[i_pq] * (G[i_pv][i_pq] * Math.sin(Va[i_pv] - Va[i_pq]) - B[i_pv][i_pq] * Math.cos(Va[i_pv] - Va[i_pq]));
      // J[0][2] = N_pv,pq = ∂P_pv/∂|V|_pq
      J[0][2] = Vm[i_pv] * (G[i_pv][i_pq] * Math.cos(Va[i_pv] - Va[i_pq]) + B[i_pv][i_pq] * Math.sin(Va[i_pv] - Va[i_pq]));
      
      // Row 1: dP_PQ equations
      // J[1][0] = H_pq,pv = ∂P_pq/∂δ_pv
      J[1][0] = Vm[i_pq] * Vm[i_pv] * (G[i_pq][i_pv] * Math.sin(Va[i_pq] - Va[i_pv]) - B[i_pq][i_pv] * Math.cos(Va[i_pq] - Va[i_pv]));
      // J[1][1] = H_pq,pq = ∂P_pq/∂δ_pq
      J[1][1] = -Q_calc[i_pq] - B[i_pq][i_pq] * Vm[i_pq]**2;
      // J[1][2] = N_pq,pq = ∂P_pq/∂|V|_pq
      J[1][2] = P_calc[i_pq] / Vm[i_pq] + G[i_pq][i_pq] * Vm[i_pq];

      // Row 2: dQ_PQ equations
      // J[2][0] = M_pq,pv = ∂Q_pq/∂δ_pv
      J[2][0] = -Vm[i_pq] * Vm[i_pv] * (G[i_pq][i_pv] * Math.cos(Va[i_pq] - Va[i_pv]) + B[i_pq][i_pv] * Math.sin(Va[i_pq] - Va[i_pv]));
      // J[2][1] = M_pq,pq = ∂Q_pq/∂δ_pq
      J[2][1] = P_calc[i_pq] - G[i_pq][i_pq] * Vm[i_pq]**2;
      // J[2][2] = L_pq,pq = ∂Q_pq/∂|V|_pq
      J[2][2] = Q_calc[i_pq] / Vm[i_pq] - B[i_pq][i_pq] * Vm[i_pq];

      const dX = solveLinearSystem(J, dF); // Solves for [dδ_pv, dδ_pq, d|V|_pq]

      // Update variables
      // V[0] (Slack) is fixed.
      // V[pvBusIndex] (PV bus): update angle. Voltage magnitude is fixed by input.
      V[pvBusIndex] = Complex.fromPolar(Vm[pvBusIndex], Va[pvBusIndex] + dX[0]);
      // V[pqBusIndex] (PQ bus): update angle and voltage magnitude.
      V[pqBusIndex] = Complex.fromPolar(Vm[pqBusIndex] + dX[2], Va[pqBusIndex] + dX[1]);

      iteration++;
    }

    if (iteration >= maxIterations) {
      throw new Error(`Load flow did not converge after ${maxIterations} iterations.`);
    }
    
    const { P: P_final, Q: Q_final } = calculatePower(V, Y, n);
    const slackBusIndex = 0;
    const slackP = P_final[slackBusIndex] * system.baseMVA;
    const slackQ = Q_final[slackBusIndex] * system.baseMVA;
    const pvBusQ = Q_final[pvBusIndex] * system.baseMVA;


    const powerFlows = system.lines.map(line => {
      const fromIdx = system.buses.findIndex(b => b.id === line.from);
      const toIdx = system.buses.findIndex(b => b.id === line.to);
      const y_line = new Complex(1,0).divide(new Complex(line.R, line.X)); // Admittance of the line itself

      const I_ij = (V[fromIdx].subtract(V[toIdx])).multiply(y_line);
      const I_ji = (V[toIdx].subtract(V[fromIdx])).multiply(y_line);

      const S_ij = V[fromIdx].multiply(I_ij.conjugate());
      const S_ji = V[toIdx].multiply(I_ji.conjugate());
      
      const loss = S_ij.add(S_ji); // S_loss = S_ij + S_ji

      return {
        from: line.from,
        to: line.to,
        P_ij: S_ij.real * system.baseMVA,
        Q_ij: S_ij.imag * system.baseMVA,
        P_ji: S_ji.real * system.baseMVA,
        Q_ji: S_ji.imag * system.baseMVA,
        lossP: loss.real * system.baseMVA,
        lossQ: loss.imag * system.baseMVA, // Should be mostly real for resistive losses
      };
    });

    return {
      voltages: V.map((v_complex, idx) => ({
        busId: system.buses[idx].id,
        magnitude: v_complex.abs(),
        angle: v_complex.arg() * 180 / Math.PI,
      })),
      powerInjections: {
          slackP,
          slackQ,
          pvBusQ,
          // P and Q for PQ bus are inputs, P for PV bus is input.
          // Calculated P and Q at each bus can also be returned if needed for verification.
          busPowers: P_final.map((p, i) => ({
              busId: system.buses[i].id,
              P: p * system.baseMVA,
              Q: Q_final[i] * system.baseMVA,
          }))
      },
      powerFlows,
      iterations: iteration,
    };
  };

  // Simplified linear system solver (Gaussian elimination for 3x3)
  const solveLinearSystem = (A, b) => {
    const n = A.length;
    const x = Array(n).fill(0);
    const aug = A.map((row, i) => [...row, b[i]]);

    // Forward elimination
    for (let i = 0; i < n; i++) {
      for (let k = i + 1; k < n; k++) {
        const factor = aug[k][i] / aug[i][i];
        for (let j = i; j <= n; j++) {
          aug[k][j] -= factor * aug[i][j];
        }
      }
    }

    // Back substitution
    for (let i = n - 1; i >= 0; i--) {
      x[i] = aug[i][n] / aug[i][i];
      for (let k = i - 1; k >= 0; k--) {
        aug[k][n] -= aug[k][i] * x[i];
      }
    }

    return x;
  };

  // Perform simulation
  const performSimulation = () => {
    if (!selectedSystem) {
        setSimulationResults({ error: "No power system selected."});
        return;
    }
    if (selectedSystem.buses.length !== 3 || 
        selectedSystem.buses[0].type !== 'slack' ||
        selectedSystem.buses[1].type !== 'PV' ||
        selectedSystem.buses[2].type !== 'PQ') {
        setSimulationResults({ error: "This solver is currently configured for a 3-bus system (Slack, PV, PQ in order)." });
        return;
    }

    setLoading(true);
    try {
      const results = solveLoadFlow(selectedSystem, simulationInputs);
      setSimulationResults(results);
    } catch (error) {
      console.error('Simulation error:', error);
      setSimulationResults({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  // Format property values
  const formatProperty = (value, property) => {
    if (typeof value === 'number') {
      if (property.includes('magnitude') || property.includes('Voltage')) { // Adjusted for bus1Voltage etc.
        return `${value.toFixed(4)} p.u.`;
      } else if (property.includes('angle')) {
        return `${value.toFixed(2)}°`;
      } else if (property.includes('P') || property.includes('power') || property.includes('lossP')) {
        return `${value.toFixed(2)} MW`;
      } else if (property.includes('Q') || property.includes('lossQ')) {
        return `${value.toFixed(2)} MVAr`;
      } else if (property.includes('R') || property.includes('X')) {
        return `${value.toFixed(4)} p.u.`;
      }
      return value.toFixed(3);
    }
    return value;
  };

  // Handle input changes
  const handleSimulationInputChange = (field, value) => {
    setSimulationInputs(prev => ({
      ...prev,
      [field]: isNaN(value) ? value : parseFloat(value),
    }));
  };

  // Handle system selection
  const handleSystemSelect = system => {
    setSelectedSystem(system);
    setSimulationResults(null);
  };

  // Handle sort
  const handleSort = field => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Get sorted systems
  const getSortedSystems = () => {
    const systems = [...systemData];
    return systems.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      if (typeof aValue === 'number') {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }
      return sortOrder === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    });
  };

  // Filter systems
  const filteredSystems = getSortedSystems().filter(
    system =>
      system.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      system.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Chart data for voltage magnitudes and angles
  const getVoltageChartData = () => {
    if (!simulationResults) return null;

    return {
      labels: selectedSystem.buses.map(b => b.id),
      datasets: [
        {
          label: 'Voltage Magnitude (p.u.)',
          data: simulationResults.voltages.map(v => v.magnitude),
          backgroundColor: '#64ffda',
        },
        {
          label: 'Voltage Angle (°)',
          data: simulationResults.voltages.map(v => v.angle),
          backgroundColor: '#ff6b6b',
          yAxisID: 'y1',
        },
      ],
    };
  };

  // Chart data for power flows
  const getPowerFlowChartData = () => {
    if (!simulationResults) return null;

    return {
      labels: simulationResults.powerFlows.map(f => `${f.from} → ${f.to}`),
      datasets: [
        {
          label: 'Active Power Flow (MW)',
          data: simulationResults.powerFlows.map(f => f.P_ij),
          borderColor: '#64ffda',
          fill: false,
          tension: 0.1,
        },
        {
          label: 'Reactive Power Flow (MVAr)',
          data: simulationResults.powerFlows.map(f => f.Q_ij),
          borderColor: '#ff6b6b',
          fill: false,
          tension: 0.1,
        },
      ],
    };
  };

  // Render network diagram (simplified SVG)
  const renderNetworkDiagram = () => {
    if (!selectedSystem) return null;

    const width = 400;
    const height = 300;
    const busPositions = [
      { id: 'Bus1', x: 200, y: 50 },
      { id: 'Bus2', x: 100, y: 250 },
      { id: 'Bus3', x: 300, y: 250 },
    ];

    return (
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* Lines */}
        {selectedSystem.lines.map((line, i) => {
          const from = busPositions.find(b => b.id === line.from);
          const to = busPositions.find(b => b.id === line.to);
          return (
            <line
              key={i}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              stroke="#ccd6f6"
              strokeWidth="2"
            />
          );
        })}
        {/* Buses */}
        {selectedSystem.buses.map((bus, i) => {
          const pos = busPositions.find(b => b.id === bus.id);
          return (
            <g key={i}>
              <circle cx={pos.x} cy={pos.y} r="10" fill={bus.type === 'slack' ? '#ff6b6b' : bus.type === 'PV' ? '#64ffda' : '#ccd6f6'} />
              <text x={pos.x} y={pos.y - 20} fill="#ccd6f6" fontSize="12" textAnchor="middle">{bus.id}</text>
            </g>
          );
        })}
      </svg>
    );
  };

  return (
    <div className="power-system-load-flow-analyzer">
      <h2>Power System Load Flow Analyzer</h2>

      <div className="controls">
        <div className="search-box">
          <label>Search:</label>
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search by ID or name..."
          />
        </div>
      </div>

      <div className="systems-table-container">
        <table className="systems-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('id')}>
                ID
                {sortField === 'id' && (
                  <span className="sort-indicator">
                    {sortOrder === 'asc' ? ' ↑' : ' ↓'}
                  </span>
                )}
              </th>
              <th onClick={() => handleSort('name')}>
                Name
                {sortField === 'name' && (
                  <span className="sort-indicator">
                    {sortOrder === 'asc' ? ' ↑' : ' ↓'}
                  </span>
                )}
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSystems.map(system => (
              <tr
                key={system.id}
                className={selectedSystem?.id === system.id ? 'selected' : ''}
              >
                <td>{system.id}</td>
                <td>{system.name}</td>
                <td>
                  <button
                    className="view-details-btn"
                    onClick={() => handleSystemSelect(system)}
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedSystem && (
        <div className="system-details">
          <h3>System Details: {selectedSystem.id}</h3>

          <div className="properties-grid">
            <div className="property-item">
              <span className="property-label">Name:</span>
              <span className="property-value">{selectedSystem.name}</span>
            </div>
            <div className="property-item">
              <span className="property-label">Base Power:</span>
              <span className="property-value">{selectedSystem.baseMVA} MVA</span>
            </div>
            <div className="property-item">
              <span className="property-label">Base Voltage:</span>
              <span className="property-value">{selectedSystem.basekV} kV</span>
            </div>
          </div>

          <h4>Bus Data</h4>
          <div className="bus-data-grid">
            {selectedSystem.buses.map(bus => (
              <div key={bus.id} className="bus-item">
                <div className="property-item">
                  <span className="property-label">Bus ID:</span>
                  <span className="property-value">{bus.id}</span>
                </div>
                <div className="property-item">
                  <span className="property-label">Type:</span>
                  <span className="property-value">{bus.type.toUpperCase()}</span>
                </div>
                <div className="property-item">
                  <span className="property-label">Voltage:</span>
                  <span className="property-value">{formatProperty(bus.V, 'V')}</span>
                </div>
                <div className="property-item">
                  <span className="property-label">Active Power:</span>
                  <span className="property-value">{formatProperty(bus.P, 'P')}</span>
                </div>
                <div className="property-item">
                  <span className="property-label">Reactive Power:</span>
                  <span className="property-value">{formatProperty(bus.Q, 'Q')}</span>
                </div>
              </div>
            ))}
          </div>

          <h4>Line Data</h4>
          <div className="line-data-grid">
            {selectedSystem.lines.map((line, i) => (
              <div key={i} className="line-item">
                <div className="property-item">
                  <span className="property-label">From:</span>
                  <span className="property-value">{line.from}</span>
                </div>
                <div className="property-item">
                  <span className="property-label">To:</span>
                  <span className="property-value">{line.to}</span>
                </div>
                <div className="property-item">
                  <span className="property-label">Resistance:</span>
                  <span className="property-value">{formatProperty(line.R, 'R')}</span>
                </div>
                <div className="property-item">
                  <span className="property-label">Reactance:</span>
                  <span className="property-value">{formatProperty(line.X, 'X')}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="simulation-section">
            <h4>Load Flow Simulation</h4>
            <div className="simulation-inputs">
              <div className="input-group">
                <label>Bus 1 Voltage (p.u.):</label>
                <input
                  type="number"
                  value={simulationInputs.bus1Voltage}
                  onChange={e => handleSimulationInputChange('bus1Voltage', e.target.value)}
                  min="0.9"
                  max="1.1"
                  step="0.01"
                />
              </div>
              <div className="input-group">
                <label>Bus 2 Voltage (p.u.):</label>
                <input
                  type="number"
                  value={simulationInputs.bus2Voltage}
                  onChange={e => handleSimulationInputChange('bus2Voltage', e.target.value)}
                  min="0.9"
                  max="1.1"
                  step="0.01"
                />
              </div>
              <div className="input-group">
                <label>Bus 2 Active Power (MW):</label>
                <input
                  type="number"
                  value={simulationInputs.bus2P}
                  onChange={e => handleSimulationInputChange('bus2P', e.target.value)}
                  step="1"
                />
              </div>
              <div className="input-group">
                <label>Bus 3 Active Power (MW):</label>
                <input
                  type="number"
                  value={simulationInputs.bus3P}
                  onChange={e => handleSimulationInputChange('bus3P', e.target.value)}
                  step="1"
                />
              </div>
              <div className="input-group">
                <label>Bus 3 Reactive Power (MVAr):</label>
                <input
                  type="number"
                  value={simulationInputs.bus3Q}
                  onChange={e => handleSimulationInputChange('bus3Q', e.target.value)}
                  step="1"
                />
              </div>
            </div>

            <button
              className="simulate-btn"
              onClick={performSimulation}
              disabled={loading}
            >
              {loading ? 'Simulating...' : 'Run Load Flow'}
            </button>

            {simulationResults && (
              <div className="simulation-results">
                <h5>Load Flow Results</h5>
                {simulationResults.error ? (
                  <div className="error-message">
                    Error: {simulationResults.error}
                  </div>
                ) : (
                  <>
                    <div className="results-grid">
                      {simulationResults.voltages.map((v, i) => (
                        <div key={i} className="result-item">
                          <span className="result-label">{v.busId} Voltage:</span>
                          <span className="result-value">
                            {formatProperty(v.magnitude, 'magnitude')} ∠ {formatProperty(v.angle, 'angle')}
                          </span>
                        </div>
                      ))}
                      <div className="result-item">
                        <span className="result-label">Slack Bus (Bus1) P:</span>
                        <span className="result-value">{formatProperty(simulationResults.powerInjections.slackP, 'P')}</span>
                      </div>
                      <div className="result-item">
                        <span className="result-label">Slack Bus (Bus1) Q:</span>
                        <span className="result-value">{formatProperty(simulationResults.powerInjections.slackQ, 'Q')}</span>
                      </div>
                      <div className="result-item">
                        <span className="result-label">PV Bus (Bus2) Q:</span>
                        <span className="result-value">{formatProperty(simulationResults.powerInjections.pvBusQ, 'Q')}</span>
                      </div>
                      {simulationResults.powerFlows.map((f, i) => (
                        <div key={`flow-${i}`} className="result-item">
                          <span className="result-label">Line {f.from} → {f.to}:</span>
                          <span className="result-value">
                            P: {formatProperty(f.P_ij, 'P')}, Q: {formatProperty(f.Q_ij, 'Q')}
                          </span>
                           <span className="result-label" style={{marginTop: '0.5rem'}}>Line Loss (P):</span>
                           <span className="result-value">{formatProperty(f.lossP, 'lossP')}</span>
                        </div>
                      ))}
                      <div className="result-item">
                        <span className="result-label">Iterations:</span>
                        <span className="result-value">{simulationResults.iterations}</span>
                      </div>
                    </div>

                    <div className="network-visualization">
                      <h5>Network Diagram</h5>
                      {renderNetworkDiagram()}
                    </div>

                    <div className="visualization-chart">
                      <h5>Voltage Profile</h5>
                      <Chart
                        type="bar"
                        data={getVoltageChartData()}
                        options={{
                          responsive: true,
                          scales: {
                            y: { title: { display: true, text: 'Voltage Magnitude (p.u.)' } },
                            y1: {
                              type: 'linear',
                              position: 'right',
                              title: { display: true, text: 'Voltage Angle (°)' },
                            },
                            x: { title: { display: true, text: 'Bus' } },
                          },
                        }}
                      />
                    </div>

                    <div className="visualization-chart">
                      <h5>Power Flows</h5>
                      <Chart
                        type="line"
                        data={getPowerFlowChartData()}
                        options={{
                          responsive: true,
                          scales: {
                            y: { title: { display: true, text: 'Power (MW/MVAr)' } },
                            x: { title: { display: true, text: 'Line' } },
                          },
                        }}
                      />
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Complex number helper (for Y-bus and power calculations)
class Complex {
  constructor(real, imag) {
    this.real = real;
    this.imag = imag;
  }

  static fromPolar(mag, arg) {
    return new Complex(mag * Math.cos(arg), mag * Math.sin(arg));
  }

  add(other) {
    return new Complex(this.real + other.real, this.imag + other.imag);
  }

  subtract(other) {
    return new Complex(this.real - other.real, this.imag - other.imag);
  }

  multiply(other) {
    return new Complex(
      this.real * other.real - this.imag * other.imag,
      this.real * other.imag + this.imag * other.real
    );
  }

  divide(other) {
    const denom = other.real ** 2 + other.imag ** 2;
    return new Complex(
      (this.real * other.real + this.imag * other.imag) / denom,
      (this.imag * other.real - this.real * other.imag) / denom
    );
  }

  conjugate() {
    return new Complex(this.real, -this.imag);
  }

  abs() {
    return Math.sqrt(this.real ** 2 + this.imag ** 2);
  }

  arg() {
    return Math.atan2(this.imag, this.real);
  }
}

export default PowerSystemLoadFlowAnalyzer;