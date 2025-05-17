import React, { useState, useEffect } from 'react'; // Added useEffect
import './CircuitSimulator.css'; // Corrected import path
import { Chart as ChartJSChart } from 'react-chartjs-2'; // Aliased to avoid conflict
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend } from 'chart.js';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend);

const CircuitSimulator = () => {
  // State management
  const [circuitType, setCircuitType] = useState('analog');
  const [selectedCircuit, setSelectedCircuit] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('id');
  const [sortOrder, setSortOrder] = useState('asc');
  const [simulationInputs, setSimulationInputs] = useState({
    voltageSource: 5.0, // V
    resistance1: 1000,  // Ω
    resistance2: 2000,  // Ω
    resistance3: 1500,  // Ω (for 3-resistor divider)
    capacitance: 10,    // μF
    inductance: 10,     // mH (for RL, LC, RLC)
    logicInputA: 1,     // 0 or 1
    logicInputB: 0,     // 0 or 1
    logicInputC: 0,     // 0 or 1 (for 3-input gates if added later, or D/T flip-flop data)
    clockInput: 0,      // 0 or 1 for flip-flops
    timeStep: 0.001,    // s
    simulationDuration: 0.05, // s (total time for transient analysis)
  });
  const [simulationResults, setSimulationResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [previousClockState, setPreviousClockState] = useState(0); // For edge detection

  // Circuit configurations
  const circuitData = {
    analog: {
      name: 'Analog Circuits',
      configurations: [
        {
          id: 'ANA-001',
          type: 'series_resistor_2', // Renamed for clarity
          name: '2 Resistors in Series',
          components: [
            { type: 'resistor', id: 'R1', value: 1000 },
            { type: 'resistor', id: 'R2', value: 2000 },
            { type: 'voltage_source', id: 'VS', value: 5.0 },
          ],
          topology: 'Series: VS -> R1 -> R2 -> GND',
          inputs: ['voltageSource', 'resistance1', 'resistance2']
        },
        {
          id: 'ANA-003',
          type: 'voltage_divider_3',
          name: '3-Resistor Voltage Divider',
          components: [
            { type: 'resistor', id: 'R1', value: 1000 },
            { type: 'resistor', id: 'R2', value: 2000 },
            { type: 'resistor', id: 'R3', value: 1500 },
            { type: 'voltage_source', id: 'VS', value: 10.0 },
          ],
          topology: 'Series: VS -> R1 -> R2 -> R3 -> GND',
          inputs: ['voltageSource', 'resistance1', 'resistance2', 'resistance3']
        },
        {
          id: 'ANA-004',
          type: 'parallel_resistor_2',
          name: '2 Resistors in Parallel',
          components: [
            { type: 'resistor', id: 'R1', value: 1000 },
            { type: 'resistor', id: 'R2', value: 2000 },
            { type: 'voltage_source', id: 'VS', value: 5.0 },
          ],
          topology: 'Parallel: VS across R1 || R2',
          inputs: ['voltageSource', 'resistance1', 'resistance2']
        },
        {
          id: 'ANA-002', // Kept ID for consistency if tests depend on it
          type: 'rc_circuit',
          name: 'RC Circuit (Series)',
          components: [
            { type: 'resistor', id: 'R1', value: 1000 },
            { type: 'capacitor', id: 'C1', value: 10 }, // μF
            { type: 'voltage_source', id: 'VS', value: 5.0 },
          ],
          topology: 'Series: VS -> R1 -> C1 -> GND',
          inputs: ['voltageSource', 'resistance1', 'capacitance', 'timeStep', 'simulationDuration']
        },
        {
          id: 'ANA-005',
          type: 'rl_circuit',
          name: 'RL Circuit (Series)',
          components: [
            { type: 'resistor', id: 'R1', value: 100 }, // Ω
            { type: 'inductor', id: 'L1', value: 10 }, // mH
            { type: 'voltage_source', id: 'VS', value: 5.0 },
          ],
          topology: 'Series: VS -> R1 -> L1 -> GND',
          inputs: ['voltageSource', 'resistance1', 'inductance', 'timeStep', 'simulationDuration']
        },
        {
          id: 'ANA-006',
          type: 'lc_circuit',
          name: 'LC Circuit (Series Ideal)',
          components: [
            { type: 'capacitor', id: 'C1', value: 10 }, // μF
            { type: 'inductor', id: 'L1', value: 10 }, // mH
            { type: 'voltage_source', id: 'VS', value: 5.0 }, // Initial voltage for capacitor or step
          ],
          topology: 'Series: VS (step) -> L1 -> C1 -> GND (Simplified step response)',
          inputs: ['voltageSource', 'capacitance', 'inductance', 'timeStep', 'simulationDuration']
        },
        {
          id: 'ANA-007',
          type: 'rlc_circuit_series',
          name: 'RLC Circuit (Series)',
          components: [
            { type: 'resistor', id: 'R1', value: 50 }, // Ω
            { type: 'inductor', id: 'L1', value: 10 }, // mH
            { type: 'capacitor', id: 'C1', value: 10 }, // μF
            { type: 'voltage_source', id: 'VS', value: 5.0 },
          ],
          topology: 'Series: VS (step) -> R1 -> L1 -> C1 -> GND',
          inputs: ['voltageSource', 'resistance1', 'inductance', 'capacitance', 'timeStep', 'simulationDuration']
        },
      ],
    },
    digital: {
      name: 'Digital Circuits',
      configurations: [
        {
          id: 'DIG-001',
          type: 'and_gate',
          name: 'AND Gate',
          components: [
            { type: 'gate', id: 'G1', gateType: 'AND', inputs: ['A', 'B'] },
            { type: 'input', id: 'A', value: 1 }, { type: 'input', id: 'B', value: 0 },
          ],
          topology: 'Inputs A, B -> AND Gate -> Output',
          inputs: ['logicInputA', 'logicInputB']
        },
        {
          id: 'DIG-003',
          type: 'or_gate',
          name: 'OR Gate',
          components: [
            { type: 'gate', id: 'G1', gateType: 'OR', inputs: ['A', 'B'] },
            { type: 'input', id: 'A', value: 0 }, { type: 'input', id: 'B', value: 0 },
          ],
          topology: 'Inputs A, B -> OR Gate -> Output',
          inputs: ['logicInputA', 'logicInputB']
        },
        {
          id: 'DIG-004',
          type: 'not_gate',
          name: 'NOT Gate (Inverter)',
          components: [
            { type: 'gate', id: 'G1', gateType: 'NOT', inputs: ['A'] },
            { type: 'input', id: 'A', value: 1 },
          ],
          topology: 'Input A -> NOT Gate -> Output',
          inputs: ['logicInputA']
        },
        {
          id: 'DIG-005',
          type: 'xor_gate',
          name: 'XOR Gate',
          components: [
            { type: 'gate', id: 'G1', gateType: 'XOR', inputs: ['A', 'B'] },
            { type: 'input', id: 'A', value: 0 }, { type: 'input', id: 'B', value: 0 },
          ],
          topology: 'Inputs A, B -> XOR Gate -> Output',
          inputs: ['logicInputA', 'logicInputB']
        },
        {
          id: 'DIG-006',
          type: 'nand_gate',
          name: 'NAND Gate',
          components: [
            { type: 'gate', id: 'G1', gateType: 'NAND', inputs: ['A', 'B'] },
            { type: 'input', id: 'A', value: 1 }, { type: 'input', id: 'B', value: 1 },
          ],
          topology: 'Inputs A, B -> NAND Gate -> Output',
          inputs: ['logicInputA', 'logicInputB']
        },
        {
          id: 'DIG-007',
          type: 'nor_gate',
          name: 'NOR Gate',
          components: [
            { type: 'gate', id: 'G1', gateType: 'NOR', inputs: ['A', 'B'] },
            { type: 'input', id: 'A', value: 0 }, { type: 'input', id: 'B', value: 0 },
          ],
          topology: 'Inputs A, B -> NOR Gate -> Output',
          inputs: ['logicInputA', 'logicInputB']
        },
        {
          id: 'DIG-002', // Kept ID
          type: 'sr_flip_flop',
          name: 'SR Flip-Flop (NOR based)',
          components: [
            { type: 'gate', id: 'G1', gateType: 'NOR', inputs: ['S', 'Qb'] },
            { type: 'gate', id: 'G2', gateType: 'NOR', inputs: ['R', 'Q'] },
            { type: 'input', id: 'S', value: 0 }, { type: 'input', id: 'R', value: 0 },
          ],
          topology: 'S, R -> NOR-based SR Flip-Flop -> Q, Qb',
          inputs: ['logicInputA', 'logicInputB'] // S maps to A, R maps to B
        },
        {
          id: 'DIG-008',
          type: 'd_flip_flop',
          name: 'D Flip-Flop (Rising Edge)',
          components: [
            { type: 'input', id: 'D', value: 0 },
            { type: 'input', id: 'CLK', value: 0 },
          ],
          topology: 'D, CLK -> D Flip-Flop -> Q, Qb',
          inputs: ['logicInputA', 'clockInput'] // D maps to logicInputA
        },
        {
          id: 'DIG-009',
          type: 't_flip_flop',
          name: 'T Flip-Flop (Rising Edge)',
          components: [
            { type: 'input', id: 'T', value: 0 },
            { type: 'input', id: 'CLK', value: 0 },
          ],
          topology: 'T, CLK -> T Flip-Flop -> Q, Qb',
          inputs: ['logicInputA', 'clockInput'] // T maps to logicInputA
        },
      ],
    },
  };
  
  // Store Q and Qb for flip-flops persistently across simulations for the same selected circuit
  const [flipFlopState, setFlipFlopState] = useState({ Q: 0, Qb: 1 });

  useEffect(() => {
    // Reset flipFlopState when selectedCircuit changes
    if (selectedCircuit) {
        if (selectedCircuit.type === 'd_flip_flop' || selectedCircuit.type === 't_flip_flop' || selectedCircuit.type === 'sr_flip_flop') {
            setFlipFlopState({ Q: 0, Qb: 1 }); // Default initial state
        }
    }
  }, [selectedCircuit]);


  // Simulate analog circuit
  const simulateAnalogCircuit = (circuit, inputs) => {
    const { voltageSource, resistance1, resistance2, resistance3, capacitance, inductance, timeStep, simulationDuration } = inputs;
    const R1 = resistance1;
    const R2 = resistance2;
    const R3 = resistance3;
    const C1_uF = capacitance;
    const L1_mH = inductance;
    const VS = voltageSource;
    
    const numSteps = Math.max(100, Math.floor(simulationDuration / timeStep)); // Ensure at least 100 steps
    const timePoints = Array.from({ length: numSteps }, (_, i) => i * timeStep);

    if (circuit.type === 'series_resistor_2') {
      const R_eq = R1 + R2;
      const current = R_eq > 0 ? VS / R_eq : Infinity;
      const V_R1 = current * R1;
      const V_R2 = current * R2;
      return { current, voltages: { R1: V_R1, R2: V_R2, Node1: V_R2 }, power: current * VS };
    } else if (circuit.type === 'voltage_divider_3') {
      const R_eq = R1 + R2 + R3;
      const current = R_eq > 0 ? VS / R_eq : Infinity;
      const V_R1 = current * R1;
      const V_R2 = current * R2;
      const V_R3 = current * R3;
      return { current, voltages: { R1: V_R1, R2: V_R2, R3: V_R3, Node1: V_R2 + V_R3, Node2: V_R3 }, power: current * VS };
    } else if (circuit.type === 'parallel_resistor_2') {
      const R_eq = (R1 * R2) / (R1 + R2);
      const totalCurrent = R_eq > 0 ? VS / R_eq : Infinity;
      const current_R1 = VS / R1;
      const current_R2 = VS / R2;
      return { totalCurrent, currents: { R1: current_R1, R2: current_R2 }, R_eq, power: totalCurrent * VS };
    } else if (circuit.type === 'rc_circuit') {
      const C = C1_uF * 1e-6; // F
      const tau = R1 * C;
      const V_C_t = timePoints.map(t => VS * (1 - Math.exp(-t / tau)));
      const I_t = timePoints.map(t => (VS / R1) * Math.exp(-t / tau));
      return { timeConstant: tau, voltages: { C1: V_C_t }, currents: { R1: I_t }, timePoints };
    } else if (circuit.type === 'rl_circuit') {
      const L = L1_mH * 1e-3; // H
      const tau = L / R1;
      const I_L_t = timePoints.map(t => (VS / R1) * (1 - Math.exp(-t / tau)));
      const V_L_t = timePoints.map(t => VS * Math.exp(-t / tau));
      return { timeConstant: tau, currents: { L1: I_L_t }, voltages: { L1: V_L_t, R1: I_L_t.map(i => i*R1) }, timePoints };
    } else if (circuit.type === 'lc_circuit') {
      const L = L1_mH * 1e-3; // H
      const C = C1_uF * 1e-6; // F
      if (L <= 0 || C <= 0) return { error: "L and C must be positive for LC circuit." };
      const omega0 = 1 / Math.sqrt(L * C); // Resonant angular frequency
      const f0 = omega0 / (2 * Math.PI);
      // Assuming step response with capacitor initially uncharged, inductor current initially zero
      // V_C(t) = VS * (1 - cos(omega0 * t))
      // I_L(t) = VS * sqrt(C/L) * sin(omega0 * t)
      const V_C_t = timePoints.map(t => VS * (1 - Math.cos(omega0 * t)));
      const I_L_t = timePoints.map(t => VS * Math.sqrt(C / L) * Math.sin(omega0 * t));
      return { resonantFrequency: f0, omega0, voltages: { C1: V_C_t }, currents: { L1: I_L_t }, timePoints };
    } else if (circuit.type === 'rlc_circuit_series') {
      const L = L1_mH * 1e-3; // H
      const C = C1_uF * 1e-6; // F
      if (L <= 0 || C <= 0) return { error: "L and C must be positive."};
      if (R1 < 0) return { error: "R must be non-negative."};

      const alpha = R1 / (2 * L); // Damping factor
      const omega0 = 1 / Math.sqrt(L * C); // Undamped resonant angular frequency
      const f0 = omega0 / (2 * Math.PI);
      const Q_factor = omega0 * L / R1;
      let dampingType = '';
      let V_C_t = [], I_L_t = [];

      if (alpha > omega0) dampingType = 'Overdamped';
      else if (alpha === omega0) dampingType = 'Critically Damped';
      else dampingType = 'Underdamped';
      
      // Simplified: For now, just return parameters. Full transient is complex.
      // For underdamped step response (most illustrative):
      if (dampingType === 'Underdamped' && R1 > 0) {
        const omega_d = Math.sqrt(omega0**2 - alpha**2); // Damped resonant frequency
        V_C_t = timePoints.map(t => VS * (1 - Math.exp(-alpha * t) * (Math.cos(omega_d * t) + (alpha/omega_d) * Math.sin(omega_d * t))));
        // I_L(t) = C * dV_C/dt. This is more involved to derive and implement quickly.
        // For simplicity, we'll omit I_L_t for RLC transient for now or use a placeholder.
         I_L_t = timePoints.map(t => (C * VS * omega0**2 / omega_d) * Math.exp(-alpha * t) * Math.sin(omega_d * t)); // Approx.
      } else if (dampingType === 'Critically Damped' && R1 > 0) {
         V_C_t = timePoints.map(t => VS * (1 - Math.exp(-alpha * t) * (1 + alpha * t)));
         I_L_t = timePoints.map(t => (C * VS * alpha**2 * t) * Math.exp(-alpha*t)); // Approx.
      } else if (dampingType === 'Overdamped' && R1 > 0) {
        const s1 = -alpha + Math.sqrt(alpha**2 - omega0**2);
        const s2 = -alpha - Math.sqrt(alpha**2 - omega0**2);
        V_C_t = timePoints.map(t => VS * (1 - (s2*Math.exp(s1*t) - s1*Math.exp(s2*t))/(s2-s1) )); // Needs checking
        // I_L_t is also complex here.
      } else { // If R1 is 0 (LC case) or other edge cases
         V_C_t = timePoints.map(t => VS * (1 - Math.cos(omega0 * t))); // Fallback to LC like behavior if R=0
         I_L_t = timePoints.map(t => VS * Math.sqrt(C / L) * Math.sin(omega0 * t));
      }

      return { resonantFrequency: f0, Q_factor, dampingFactor: alpha, dampingType, voltages: { C1: V_C_t }, currents: { L1: I_L_t }, timePoints };
    }
    throw new Error('Unknown analog circuit type for simulation');
  };

  // Simulate digital circuit
  const simulateDigitalCircuit = (circuit, inputs, prevClock, currentFlipFlopState) => {
    const { logicInputA, logicInputB, clockInput } = inputs;
    let Q = currentFlipFlopState.Q;
    let Qb = currentFlipFlopState.Qb;

    const risingEdge = prevClock === 0 && clockInput === 1;

    if (circuit.type === 'or_gate') return { inputs: { A: logicInputA, B: logicInputB }, output: (logicInputA || logicInputB ? 1 : 0) };
    if (circuit.type === 'not_gate') return { inputs: { A: logicInputA }, output: (logicInputA ? 0 : 1) };
    if (circuit.type === 'xor_gate') return { inputs: { A: logicInputA, B: logicInputB }, output: ((logicInputA !== logicInputB) ? 1 : 0) };
    if (circuit.type === 'nand_gate') return { inputs: { A: logicInputA, B: logicInputB }, output: (logicInputA && logicInputB ? 0 : 1) };
    if (circuit.type === 'nor_gate') return { inputs: { A: logicInputA, B: logicInputB }, output: (logicInputA || logicInputB ? 0 : 1) };
    if (circuit.type === 'and_gate') return { inputs: { A: logicInputA, B: logicInputB }, output: (logicInputA && logicInputB ? 1 : 0) };
    
    if (circuit.type === 'sr_flip_flop') {
      const S = logicInputA; const R = logicInputB;
      if (S === 1 && R === 0) { Q = 1; Qb = 0; }
      else if (S === 0 && R === 1) { Q = 0; Qb = 1; }
      else if (S === 1 && R === 1) { Q = 0; Qb = 0; } // Invalid state for NOR SR latch
      // else S=0, R=0: Hold state (Q, Qb remain as they were from currentFlipFlopState)
      setFlipFlopState({ Q, Qb });
      return { inputs: { S, R }, outputs: { Q, Qb }, state: (S === 1 && R === 1) ? 'INVALID' : (Q === 1) ? 'SET' : 'RESET' };
    }
    if (circuit.type === 'd_flip_flop') {
      const D = logicInputA;
      if (risingEdge) {
        Q = D;
        Qb = D ? 0 : 1;
      }
      setFlipFlopState({ Q, Qb });
      return { inputs: { D, CLK: clockInput }, outputs: { Q, Qb }, risingEdgeDetected: risingEdge };
    }
    if (circuit.type === 't_flip_flop') {
      const T = logicInputA;
      if (risingEdge && T === 1) {
        const prevQ = Q; // Q from currentFlipFlopState
        Q = prevQ ? 0 : 1;
        Qb = prevQ; // Qb becomes previous Q
      }
      setFlipFlopState({ Q, Qb });
      return { inputs: { T, CLK: clockInput }, outputs: { Q, Qb }, risingEdgeDetected: risingEdge };
    }
    throw new Error('Unknown digital circuit type for simulation');
  };

  // Perform simulation
  const performSimulation = () => {
    if (!selectedCircuit) return;
    // Basic Input Validation (can be expanded)
    if (circuitType === 'analog') {
        const { resistance1, resistance2, resistance3, capacitance, inductance, voltageSource } = simulationInputs;
        if (selectedCircuit.inputs.includes('resistance1') && resistance1 < 0) { setSimulationResults({ error: "R1 cannot be negative."}); return; }
        if (selectedCircuit.inputs.includes('resistance2') && resistance2 < 0) { setSimulationResults({ error: "R2 cannot be negative."}); return; }
        if (selectedCircuit.inputs.includes('resistance3') && resistance3 < 0) { setSimulationResults({ error: "R3 cannot be negative."}); return; }
        if (selectedCircuit.inputs.includes('capacitance') && capacitance <= 0) { setSimulationResults({ error: "Capacitance must be positive."}); return; }
        if (selectedCircuit.inputs.includes('inductance') && inductance <= 0) { setSimulationResults({ error: "Inductance must be positive."}); return; }
    }

    setLoading(true);
    setSimulationResults(null); 

    setTimeout(() => {
      try {
        const currentClock = simulationInputs.clockInput;
        const results = circuitType === 'analog'
          ? simulateAnalogCircuit(selectedCircuit, simulationInputs)
          : simulateDigitalCircuit(selectedCircuit, simulationInputs, previousClockState, flipFlopState);
        setSimulationResults(results);
        if (circuitType === 'digital') {
            setPreviousClockState(currentClock); // Update previous clock state AFTER simulation
        }
      } catch (error) {
        console.error('Simulation error:', error);
        setSimulationResults({ error: error.message });
      } finally {
        setLoading(false);
      }
    }, 500);
  };

  // Format property values
  const formatProperty = (value, property, componentId = '') => {
    if (value === undefined || value === null) return 'N/A';
    if (typeof value === 'number') {
      if (property.includes('voltage') || property.includes('Node') || componentId.startsWith('V')) return `${value.toFixed(3)} V`;
      if (property.includes('current') || componentId.startsWith('I')) return `${(value * 1000).toFixed(3)} mA`;
      if (property.includes('resistance') || componentId.startsWith('R')) return `${value.toFixed(0)} Ω`;
      if (property.includes('capacitance') || componentId.startsWith('C')) return `${value.toFixed(1)} μF`;
      if (property.includes('inductance') || componentId.startsWith('L')) return `${value.toFixed(1)} mH`;
      if (property.includes('timeConstant') || property.includes('tau')) return `${(value * 1000).toFixed(3)} ms`;
      if (property.includes('frequency') || property.includes('omega')) return `${value.toFixed(2)} ${property.includes('omega') ? 'rad/s' : 'Hz'}`;
      if (property.includes('power') || componentId.startsWith('P')) return `${value.toFixed(3)} W`;
      if (property.includes('factor') || property.includes('ratio')) return value.toFixed(3);
      if (property.includes('logic') || property.includes('output') || property.includes('Q') || property.includes('CLK') || property.includes('Input')) {
         return value === 1 ? 'HIGH' : 'LOW';
      }
      return value.toFixed(3);
    }
    if (Array.isArray(value)) return 'Time Series Data'; // Placeholder for chart display
    return String(value);
  };

  // Handle input changes
  const handleSimulationInputChange = (field, value) => {
    let parsedValue = parseFloat(value);
    if (field.toLowerCase().includes('logic') || field.toLowerCase().includes('clock')) {
        parsedValue = parseInt(value);
    }
    setSimulationInputs(prev => ({ ...prev, [field]: isNaN(parsedValue) ? value : parsedValue }));
  };
  
  const handleCircuitSelect = circuit => {
    setSelectedCircuit(circuit);
    // Reset simulation inputs to defaults for the selected circuit type or specific defaults
    const defaultInputs = {
        voltageSource: circuit.components.find(c=>c.id==='VS')?.value || 5.0,
        resistance1: circuit.components.find(c=>c.id==='R1')?.value || 1000,
        resistance2: circuit.components.find(c=>c.id==='R2')?.value || 2000,
        resistance3: circuit.components.find(c=>c.id==='R3')?.value || 1500,
        capacitance: circuit.components.find(c=>c.id==='C1')?.value || 10,
        inductance: circuit.components.find(c=>c.id==='L1')?.value || 10,
        logicInputA: circuit.components.find(c=>c.id==='A' || c.id==='S' || c.id==='D' || c.id==='T')?.value !== undefined ? circuit.components.find(c=>c.id==='A' || c.id==='S' || c.id==='D' || c.id==='T')?.value : 1,
        logicInputB: circuit.components.find(c=>c.id==='B' || c.id==='R')?.value !== undefined ? circuit.components.find(c=>c.id==='B' || c.id==='R')?.value : 0,
        clockInput: 0,
        timeStep: 0.001,
        simulationDuration: 0.05,
    };
    setSimulationInputs(prev => ({...prev, ...defaultInputs})); // Merge with existing to keep unrelated inputs
    setSimulationResults(null);
    setPreviousClockState(0); // Reset previous clock state
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

  // Get sorted circuits
  const getSortedCircuits = () => {
    const circuits = [...circuitData[circuitType].configurations];
    return circuits.sort((a, b) => {
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

  // Filter circuits
  const filteredCircuits = getSortedCircuits().filter(
    circuit =>
      circuit.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      circuit.type.toLowerCase().includes(searchTerm.toLowerCase())
  );


  const getAnalogChartData = () => {
    if (!simulationResults || circuitType !== 'analog' || !simulationResults.timePoints || simulationResults.error) return null;
    const datasets = [];
    if (simulationResults.voltages) {
        Object.entries(simulationResults.voltages).forEach(([key, valueArray]) => {
            if(Array.isArray(valueArray)) {
                datasets.push({
                    label: `Voltage ${key} (V)`,
                    data: valueArray,
                    borderColor: `#${Math.floor(Math.random()*16777215).toString(16).padStart(6,'0')}`, // Random color
                    fill: false, tension: 0.1, yAxisID: 'yV',
                });
            }
        });
    }
    if (simulationResults.currents) {
        Object.entries(simulationResults.currents).forEach(([key, valueArray]) => {
             if(Array.isArray(valueArray)) {
                datasets.push({
                    label: `Current ${key} (mA)`,
                    data: valueArray.map(i => i * 1000),
                    borderColor: `#${Math.floor(Math.random()*16777215).toString(16).padStart(6,'0')}`, // Random color
                    fill: false, tension: 0.1, yAxisID: 'yI',
                });
            }
        });
    }
    if (datasets.length === 0) return null;
    return { labels: simulationResults.timePoints.map(t => (t * 1000).toFixed(2)), datasets };
  };

  const getDigitalChartData = () => {
    if (!simulationResults || circuitType !== 'digital' || simulationResults.error) return null;
    let labels = [], data = [];
    if (selectedCircuit.type.includes('gate')) {
        labels = ['Input A', 'Output'];
        data = [simulationResults.inputs.A, simulationResults.output];
        if (simulationResults.inputs.B !== undefined) {
            labels.splice(1,0,'Input B');
            data.splice(1,0,simulationResults.inputs.B);
        }
    } else if (selectedCircuit.type.includes('flip_flop')) {
        const inputId1 = selectedCircuit.components.find(c => c.type === 'input' && (c.id === 'S' || c.id === 'D' || c.id === 'T'))?.id || 'Input1';
        labels = [inputId1, 'CLK', 'Q', 'Qb'];
        data = [simulationResults.inputs[Object.keys(simulationResults.inputs)[0]], simulationResults.inputs.CLK, simulationResults.outputs.Q, simulationResults.outputs.Qb];
        if (selectedCircuit.type === 'sr_flip_flop') {
            const inputId2 = selectedCircuit.components.find(c => c.type === 'input' && c.id === 'R')?.id || 'Input2';
            labels.splice(1,0,inputId2);
            data.splice(1,0,simulationResults.inputs[Object.keys(simulationResults.inputs)[1]]);
        }
    }
    if (data.length === 0) return null;
    return { labels, datasets: [{ label: 'Logic State (1=HIGH, 0=LOW)', data, backgroundColor: data.map(d => d===1 ? '#64ffda' : '#ff6b6b') }] };
  };
  
  const renderSchematic = () => {
    if (!selectedCircuit) return null;
    const W = 300, H = 150, SC = "#ccd6f6", CC = "#64ffda", SRC = "#ff6b6b", TC = CC; // Shorthands
    // Basic symbols (can be expanded into a library)
    const Resistor = ({x, y, label}) => <><rect x={x} y={y-10} width="40" height="20" fill="none" stroke={CC} strokeWidth="2" /><text x={x+20} y={y+15} fill={TC} fontSize="10" textAnchor="middle">{label}</text></>;
    const Capacitor = ({x, y, label}) => <><line x1={x} y1={y-15} x2={x} y2={y+15} stroke={CC} strokeWidth="3" /><line x1={x+10} y1={y-15} x2={x+10} y2={y+15} stroke={CC} strokeWidth="3" /><text x={x+5} y={y-20} fill={TC} fontSize="10" textAnchor="middle">{label}</text></>;
    const Inductor = ({x, y, label}) => <><path d={`M${x},${y} Q${x+5},${y-10} ${x+10},${y} Q${x+15},${y+10} ${x+20},${y} Q${x+25},${y-10} ${x+30},${y} Q${x+35},${y+10} ${x+40},${y}`} stroke={CC} strokeWidth="2" fill="none"/><text x={x+20} y={y+15} fill={TC} fontSize="10" textAnchor="middle">{label}</text></>;
    const VoltageSource = ({x, y, label}) => <><circle cx={x} cy={y} r="10" stroke={SRC} strokeWidth="2" fill="none" /><text x={x} y={y+3} fill={TC} fontSize="10" textAnchor="middle">{label}</text></>;
    const Gnd = ({x, y}) => <><line x1={x} y1={y} x2={x} y2={y+20} stroke={SC} strokeWidth="2" /><line x1={x-10} y1={y+20} x2={x+10} y2={y+20} stroke={SC} strokeWidth="2" /><line x1={x-5} y1={y+25} x2={x+5} y2={y+25} stroke={SC} strokeWidth="2" /></>;
    const Gate = ({x, y, type, labelA, labelB, labelOut}) => {
        let pathData = "M0,0 L0,40 L20,40 A20,20 0 0,0 20,0 Z"; // AND
        let textSymbol = "&";
        if (type === 'OR') { pathData = "M0,0 Q15,20 0,40 L20,40 A20,20 0 0,0 20,0 Z"; textSymbol = "≥1"; }
        if (type === 'XOR') { pathData = "M-5,0 Q10,20 -5,40 M0,0 Q15,20 0,40 L20,40 A20,20 0 0,0 20,0 Z"; textSymbol = "=1"; }
        let isN = type.startsWith('N'); let isXN = type.startsWith('XN');
        if (isN && !isXN) type = type.substring(1); // NAND -> AND, NOR -> OR
        
        return <g transform={`translate(${x},${y})`}>
            <path d={pathData} fill="none" stroke={CC} strokeWidth="2"/>
            {isN && <circle cx="43" cy="20" r="3" fill="none" stroke={CC} strokeWidth="1.5"/>}
            <text x="10" y="23" fill={TC} fontSize="10" textAnchor="middle">{textSymbol}</text>
            {labelA && <><line x1="-30" y1="10" x2="0" y2="10" stroke={SC} strokeWidth="2"/><text x="-20" y="5" fill={TC} fontSize="8">{labelA}</text></>}
            {labelB && <><line x1="-30" y1="30" x2="0" y2="30" stroke={SC} strokeWidth="2"/><text x="-20" y="25" fill={TC} fontSize="8">{labelB}</text></>}
            <line x1={isN ? 46 : 40} y1="20" x2={isN ? 76: 70} y2="20" stroke={SC} strokeWidth="2"/>
            {labelOut && <text x={isN ? 60 : 55} y="15" fill={TC} fontSize="8">{labelOut}</text>}
        </g>;
    };
    const NotGate = ({x,y,labelA, labelOut}) => <g transform={`translate(${x},${y})`}>
        <path d="M0,0 L0,40 L30,20 Z" fill="none" stroke={CC} strokeWidth="2"/>
        <circle cx="33" cy="20" r="3" fill="none" stroke={CC} strokeWidth="1.5"/>
        {labelA && <><line x1="-30" y1="20" x2="0" y2="20" stroke={SC} strokeWidth="2"/><text x="-20" y="15" fill={TC} fontSize="8">{labelA}</text></>}
        <line x1="36" y1="20" x2="66" y2="20" stroke={SC} strokeWidth="2"/>
        {labelOut && <text x="50" y="15" fill={TC} fontSize="8">{labelOut}</text>}
    </g>;
    // Flip Flop Box
    const FFBox = ({x,y,type, d, t, s, r, clk, q, qb}) => <g transform={`translate(${x},${y})`}>
        <rect x="0" y="0" width="60" height="80" stroke={CC} strokeWidth="2" fill="none"/>
        <text x="30" y="15" fill={TC} textAnchor="middle" fontSize="10">{type}</text>
        {d && <><line x1="-20" y1="25" x2="0" y2="25" stroke={SC}/><text x="-10" y="22" fill={TC} fontSize="8">D</text></>}
        {t && <><line x1="-20" y1="25" x2="0" y2="25" stroke={SC}/><text x="-10" y="22" fill={TC} fontSize="8">T</text></>}
        {s && <><line x1="-20" y1="25" x2="0" y2="25" stroke={SC}/><text x="-10" y="22" fill={TC} fontSize="8">S</text></>}
        {r && <><line x1="-20" y1="55" x2="0" y2="55" stroke={SC}/><text x="-10" y="52" fill={TC} fontSize="8">R</text></>}
        {clk && <><line x1="-20" y1="40" x2="0" y2="40" stroke={SC}/><path d="M0,40 l5,-5 l0,10" stroke={SC} fill="none"/><text x="-15" y="37" fill={TC} fontSize="8">CLK</text></>}
        {q && <><line x1="60" y1="25" x2="80" y2="25" stroke={SC}/><text x="70" y="22" fill={TC} fontSize="8">Q</text></>}
        {qb && <><line x1="60" y1="55" x2="80" y2="55" stroke={SC}/><text x="70" y="52" fill={TC} fontSize="8">Qb</text></>}
    </g>;


    let schematicContent = <text>Schematic N/A</text>;
    if (selectedCircuit.type === 'series_resistor_2') {
      schematicContent = <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <VoltageSource x={30} y={H/2} label="VS"/> <line x1="40" y1={H/2} x2="70" y2={H/2} stroke={SC}/>
        <Resistor x={70} y={H/2} label="R1"/> <line x1="110" y1={H/2} x2="140" y2={H/2} stroke={SC}/>
        <Resistor x={140} y={H/2} label="R2"/> <line x1="180" y1={H/2} x2="210" y2={H/2} stroke={SC}/>
        <Gnd x={210} y={H/2}/>
      </svg>;
    } else if (selectedCircuit.type === 'voltage_divider_3') {
        schematicContent = <svg width={W} height={H+20} viewBox={`0 0 ${W} ${H+20}`}>
        <VoltageSource x={30} y={H/2} label="VS"/> <line x1="40" y1={H/2} x2="70" y2={H/2} stroke={SC}/>
        <Resistor x={70} y={H/2} label="R1"/> <line x1="110" y1={H/2} x2="140" y2={H/2} stroke={SC}/>
        <Resistor x={140} y={H/2} label="R2"/> <line x1="180" y1={H/2} x2="210" y2={H/2} stroke={SC}/>
        <Resistor x={210} y={H/2} label="R3"/> <line x1="250" y1={H/2} x2="280" y2={H/2} stroke={SC}/>
        <Gnd x={280} y={H/2}/>
      </svg>;
    } else if (selectedCircuit.type === 'parallel_resistor_2') {
        schematicContent = <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
            <VoltageSource x={30} y={H/2} label="VS"/>
            <line x1="40" y1={H/2} x2="70" y2={H/2} stroke={SC}/>
            <line x1="70" y1={H/2} x2="70" y2={H/4} stroke={SC}/> <Resistor x={70} y={H/4} label="R1"/> <line x1="110" y1={H/4} x2="140" y2={H/4} stroke={SC}/> <line x1="140" y1={H/4} x2="140" y2={H/2} stroke={SC}/>
            <line x1="70" y1={H/2} x2="70" y2={H*3/4} stroke={SC}/> <Resistor x={70} y={H*3/4} label="R2"/> <line x1="110" y1={H*3/4} x2="140" y2={H*3/4} stroke={SC}/> <line x1="140" y1={H*3/4} x2="140" y2={H/2} stroke={SC}/>
            <line x1="140" y1={H/2} x2="170" y2={H/2} stroke={SC}/> <Gnd x={170} y={H/2}/>
        </svg>;
    } else if (selectedCircuit.type === 'rc_circuit') {
        schematicContent = <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
            <VoltageSource x={30} y={H/2} label="VS"/> <line x1="40" y1={H/2} x2="70" y2={H/2} stroke={SC}/>
            <Resistor x={70} y={H/2} label="R1"/> <line x1="110" y1={H/2} x2="140" y2={H/2} stroke={SC}/>
            <Capacitor x={140} y={H/2} label="C1"/> <line x1="150" y1={H/2} x2="180" y2={H/2} stroke={SC}/>
            <Gnd x={180} y={H/2}/>
        </svg>;
    } else if (selectedCircuit.type === 'rl_circuit') {
        schematicContent = <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
            <VoltageSource x={30} y={H/2} label="VS"/> <line x1="40" y1={H/2} x2="70" y2={H/2} stroke={SC}/>
            <Resistor x={70} y={H/2} label="R1"/> <line x1="110" y1={H/2} x2="140" y2={H/2} stroke={SC}/>
            <Inductor x={140} y={H/2} label="L1"/> <line x1="180" y1={H/2} x2="210" y2={H/2} stroke={SC}/>
            <Gnd x={210} y={H/2}/>
        </svg>;
    } else if (selectedCircuit.type === 'lc_circuit' || selectedCircuit.type === 'rlc_circuit_series') {
        schematicContent = <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
            <VoltageSource x={30} y={H/2} label="VS"/> <line x1="40" y1={H/2} x2="60" y2={H/2} stroke={SC}/>
            {selectedCircuit.type === 'rlc_circuit_series' && <><Resistor x={60} y={H/2} label="R1"/> <line x1="100" y1={H/2} x2="120" y2={H/2} stroke={SC}/></>}
            <Inductor x={selectedCircuit.type === 'rlc_circuit_series' ? 120 : 60} y={H/2} label="L1"/> 
            <line x1={selectedCircuit.type === 'rlc_circuit_series' ? 160 : 100} y1={H/2} x2={selectedCircuit.type === 'rlc_circuit_series' ? 180 : 120} y2={H/2} stroke={SC}/>
            <Capacitor x={selectedCircuit.type === 'rlc_circuit_series' ? 180 : 120} y={H/2} label="C1"/> 
            <line x1={selectedCircuit.type === 'rlc_circuit_series' ? 190 : 130} y1={H/2} x2={selectedCircuit.type === 'rlc_circuit_series' ? 220 : 160} y2={H/2} stroke={SC}/>
            <Gnd x={selectedCircuit.type === 'rlc_circuit_series' ? 220 : 160} y={H/2}/>
        </svg>;
    } else if (selectedCircuit.type.includes('_gate')) {
        const gateType = selectedCircuit.type.split('_')[0].toUpperCase();
        if (gateType === 'NOT') {
            schematicContent = <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}><NotGate x={W/2-30} y={H/2-20} labelA="A" labelOut="Out"/></svg>;
        } else {
            schematicContent = <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}><Gate x={W/2-20} y={H/2-20} type={gateType} labelA="A" labelB="B" labelOut="Out"/></svg>;
        }
    } else if (selectedCircuit.type === 'sr_flip_flop') { // Using FFBox for SR for simplicity now
        schematicContent = <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}><FFBox x={W/2-30} y={H/2-40} type="SR" s={true} r={true} q={true} qb={true}/></svg>;
    } else if (selectedCircuit.type === 'd_flip_flop') {
        schematicContent = <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}><FFBox x={W/2-30} y={H/2-40} type="D" d={true} clk={true} q={true} qb={true}/></svg>;
    } else if (selectedCircuit.type === 't_flip_flop') {
        schematicContent = <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}><FFBox x={W/2-30} y={H/2-40} type="T" t={true} clk={true} q={true} qb={true}/></svg>;
    }
    return schematicContent;
  };

  // JSX Rendering
  return (
    <div className="circuit-simulator">
      <h2>Circuit Simulator</h2>
      {/* Controls: Type Select and Search */}
      <div className="controls">
        <div className="circuit-type-select">
          <label htmlFor="circuitTypeSelect">Circuit Type:</label>
          <select id="circuitTypeSelect" value={circuitType} onChange={e => { setCircuitType(e.target.value); setSelectedCircuit(null); setSimulationResults(null); }}>
            {Object.entries(circuitData).map(([key, value]) => (<option key={key} value={key}>{value.name}</option>))}
          </select>
        </div>
        <div className="search-box">
          <label htmlFor="circuitSearch">Search:</label>
          <input id="circuitSearch" type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search by ID or name..." />
        </div>
      </div>

      {/* Circuits Table */}
      <div className="circuits-table-container">
        <table className="circuits-table">
          <thead><tr>
            <th onClick={() => handleSort('id')}>ID {sortField === 'id' && (sortOrder === 'asc' ? '↑' : '↓')}</th>
            <th onClick={() => handleSort('name')}>Name {sortField === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}</th>
            <th onClick={() => handleSort('topology')}>Topology {sortField === 'topology' && (sortOrder === 'asc' ? '↑' : '↓')}</th>
            <th>Actions</th>
          </tr></thead>
          <tbody>{filteredCircuits.map(circuit => (
            <tr key={circuit.id} className={selectedCircuit?.id === circuit.id ? 'selected' : ''}>
              <td>{circuit.id}</td><td>{circuit.name}</td><td>{circuit.topology}</td>
              <td><button className="view-details-btn" onClick={() => handleCircuitSelect(circuit)}>View Details</button></td>
            </tr>
          ))}</tbody>
        </table>
      </div>

      {/* Circuit Details, Simulation Parameters, Results */}
      {selectedCircuit && (
        <div className="circuit-details">
          <h3>Circuit Details: {selectedCircuit.name} ({selectedCircuit.id})</h3>
          {/* ... (Display selectedCircuit.components properties if needed) ... */}

          <div className="simulation-section">
            <h4>Simulation Parameters</h4>
            <div className="simulation-inputs">
              {selectedCircuit.inputs?.includes('voltageSource') && <div className="input-group"><label>Voltage Source (V):</label><input type="number" value={simulationInputs.voltageSource} onChange={e => handleSimulationInputChange('voltageSource', e.target.value)} min="0" step="0.1"/></div>}
              {selectedCircuit.inputs?.includes('resistance1') && <div className="input-group"><label>R1 (Ω):</label><input type="number" value={simulationInputs.resistance1} onChange={e => handleSimulationInputChange('resistance1', e.target.value)} min="0" step="10"/></div>}
              {selectedCircuit.inputs?.includes('resistance2') && <div className="input-group"><label>R2 (Ω):</label><input type="number" value={simulationInputs.resistance2} onChange={e => handleSimulationInputChange('resistance2', e.target.value)} min="0" step="10"/></div>}
              {selectedCircuit.inputs?.includes('resistance3') && <div className="input-group"><label>R3 (Ω):</label><input type="number" value={simulationInputs.resistance3} onChange={e => handleSimulationInputChange('resistance3', e.target.value)} min="0" step="10"/></div>}
              {selectedCircuit.inputs?.includes('capacitance') && <div className="input-group"><label>Capacitance (μF):</label><input type="number" value={simulationInputs.capacitance} onChange={e => handleSimulationInputChange('capacitance', e.target.value)} min="0.001" step="0.1"/></div>}
              {selectedCircuit.inputs?.includes('inductance') && <div className="input-group"><label>Inductance (mH):</label><input type="number" value={simulationInputs.inductance} onChange={e => handleSimulationInputChange('inductance', e.target.value)} min="0.001" step="0.1"/></div>}
              
              {selectedCircuit.inputs?.includes('logicInputA') && <div className="input-group"><label>{selectedCircuit.type.includes('flip_flop') ? (selectedCircuit.type === 'sr_flip_flop' ? 'S' : (selectedCircuit.type === 'd_flip_flop' ? 'D' : 'T')) : 'Input A'}:</label><select value={simulationInputs.logicInputA} onChange={e => handleSimulationInputChange('logicInputA', e.target.value)}><option value={0}>LOW</option><option value={1}>HIGH</option></select></div>}
              {selectedCircuit.inputs?.includes('logicInputB') && <div className="input-group"><label>{selectedCircuit.type === 'sr_flip_flop' ? 'R' : 'Input B'}:</label><select value={simulationInputs.logicInputB} onChange={e => handleSimulationInputChange('logicInputB', e.target.value)}><option value={0}>LOW</option><option value={1}>HIGH</option></select></div>}
              {selectedCircuit.inputs?.includes('clockInput') && <div className="input-group"><label>Clock:</label><select value={simulationInputs.clockInput} onChange={e => handleSimulationInputChange('clockInput', e.target.value)}><option value={0}>LOW</option><option value={1}>HIGH</option></select></div>}
              
              {(selectedCircuit.type.includes('rc_') || selectedCircuit.type.includes('rl_') || selectedCircuit.type.includes('lc_') || selectedCircuit.type.includes('rlc_')) && (
                <>
                  <div className="input-group"><label>Time Step (ms):</label><input type="number" value={simulationInputs.timeStep * 1000} onChange={e => handleSimulationInputChange('timeStep', e.target.value / 1000)} min="0.001" step="0.001"/></div>
                  <div className="input-group"><label>Duration (ms):</label><input type="number" value={simulationInputs.simulationDuration * 1000} onChange={e => handleSimulationInputChange('simulationDuration', e.target.value / 1000)} min="0.01" step="1"/></div>
                </>
              )}
            </div>
            <button className="simulate-btn" onClick={performSimulation} disabled={loading}>{loading ? 'Simulating...' : 'Run Simulation'}</button>

            {simulationResults && (
              <div className="simulation-results">
                <h5>Simulation Results</h5>
                {simulationResults.error ? <div className="error-message">Error: {simulationResults.error}</div> : (
                  <>
                    <div className="results-grid">
                      {Object.entries(simulationResults).map(([key, value]) => {
                        if (key === 'timePoints' || key === 'voltages' || key === 'currents' || key === 'inputs' || key === 'outputs' || key === 'error' || key === 'risingEdgeDetected') return null;
                        return (<div key={key} className="result-item">
                                  <span className="result-label">{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:</span>
                                  <span className="result-value">{formatProperty(value, key)}</span>
                                </div>);
                      })}
                      {/* Specific display for complex objects if needed */}
                      {simulationResults.voltages && !Array.isArray(simulationResults.voltages) && typeof simulationResults.voltages === 'object' && Object.entries(simulationResults.voltages).map(([node, val]) => 
                        !Array.isArray(val) && <div key={`V-${node}`} className="result-item"><span className="result-label">Voltage {node}:</span><span className="result-value">{formatProperty(val, 'voltage')}</span></div>
                      )}
                       {simulationResults.currents && !Array.isArray(simulationResults.currents) && typeof simulationResults.currents === 'object' && Object.entries(simulationResults.currents).map(([node, val]) => 
                        !Array.isArray(val) && <div key={`I-${node}`} className="result-item"><span className="result-label">Current {node}:</span><span className="result-value">{formatProperty(val, 'current')}</span></div>
                      )}
                      {simulationResults.inputs && typeof simulationResults.inputs === 'object' && Object.entries(simulationResults.inputs).map(([inputName, val]) => 
                        <div key={`IN-${inputName}`} className="result-item"><span className="result-label">{inputName} Input:</span><span className="result-value">{formatProperty(val, 'logic')}</span></div>
                      )}
                      {simulationResults.outputs && typeof simulationResults.outputs === 'object' && Object.entries(simulationResults.outputs).map(([outputName, val]) => 
                        <div key={`OUT-${outputName}`} className="result-item"><span className="result-label">{outputName} Output:</span><span className="result-value">{formatProperty(val, 'logic')}</span></div>
                      )}
                    </div>
                    <div className="schematic-visualization"><h5>Circuit Schematic</h5>{renderSchematic()}</div>
                    {getAnalogChartData() && circuitType === 'analog' && <div className="visualization-chart"><h5>Analog Waveforms</h5><ChartJSChart type="line" data={getAnalogChartData()} options={{responsive: true, scales: {x: {title:{display:true, text:'Time (ms)'}}, yV:{type:'linear',position:'left',title:{display:true,text:'Voltage (V)'}}, yI:{type:'linear',position:'right',title:{display:true,text:'Current (mA)'}, grid:{drawOnChartArea:false}}}}}/></div>}
                    {getDigitalChartData() && circuitType === 'digital' && <div className="visualization-chart"><h5>Digital Logic States</h5><ChartJSChart type="bar" data={getDigitalChartData()} options={{responsive: true, scales: {y: {beginAtZero: true, ticks:{stepSize:1, callback: value => (value === 1 ? 'HIGH' : 'LOW')}}, x: {title:{display:true, text:'Signals'}}}}}/></div>}
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

export default CircuitSimulator;