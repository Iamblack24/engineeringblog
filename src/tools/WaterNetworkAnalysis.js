import React, { useState } from 'react';
import './WaterNetworkAnalysis.css';

const WaterNetworkAnalysis = () => {
  // Initial state with complete parameters
  const [networkData, setNetworkData] = useState({
    // Analysis parameters
    analysisMethod: 'hazen-williams',
    maxIterations: 100,
    accuracy: 0.001,
    minPressure: 20,
    maxPressure: 70,
    maxVelocity: 2.0,
    minVelocity: 0.6,

    // Network elements
    pipes: [{
      id: 1,
      startNode: 'A',
      endNode: 'B',
      length: 100,
      diameter: 100,
      roughness: 130,
      flowRate: 0,
      headloss: 0
    }],

    nodes: [{
      id: 'A',
      elevation: 100,
      demand: 0,
      pressure: 0,
      isReservoir: true,  // First node is reservoir by default
    }, {
      id: 'B',
      elevation: 90,
      demand: 10,
      pressure: 0,
      isReservoir: false,
    }],

    // Default values
    pipeDefaults: {
      roughness: {
        'hazen-williams': 130,
        'darcy-weisbach': 0.0015
      },
      minDiameter: 50,
      maxDiameter: 600,
    },

    nodeDefaults: {
      minElevation: 0,
      maxElevation: 1000,
    }
  });

  const [results, setResults] = useState(null);
  const [errors, setErrors] = useState({});

  // Validation function
  const validateInputs = () => {
    const newErrors = {};

    // Check for at least one reservoir
    const hasReservoir = networkData.nodes.some(node => node.isReservoir);
    if (!hasReservoir) {
      newErrors.network = 'Network must have at least one reservoir';
    }

    // Validate nodes
    networkData.nodes.forEach((node, index) => {
      if (node.elevation === undefined || node.elevation < networkData.nodeDefaults.minElevation) {
        newErrors[`node${index}elevation`] = 'Invalid elevation';
      }
      if (!node.isReservoir && (node.demand === undefined || isNaN(node.demand))) {
        newErrors[`node${index}demand`] = 'Invalid demand';
      }
    });

    // Validate pipes
    networkData.pipes.forEach((pipe, index) => {
      if (!pipe.startNode || !pipe.endNode) {
        newErrors[`pipe${index}nodes`] = 'Start and end nodes required';
      }
      if (pipe.length <= 0) {
        newErrors[`pipe${index}length`] = 'Length must be positive';
      }
      if (pipe.diameter < networkData.pipeDefaults.minDiameter || 
          pipe.diameter > networkData.pipeDefaults.maxDiameter) {
        newErrors[`pipe${index}diameter`] = 'Invalid diameter';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Node input handler
  const handleNodeChange = (index, field, value) => {
    const updatedNodes = [...networkData.nodes];
    if (field === 'isReservoir') {
      value = value === 'true'; // Convert string to boolean
      if (value) {
        updatedNodes[index].demand = 0; // Reset demand for reservoir
      }
    }
    updatedNodes[index][field] = value;
    setNetworkData({
      ...networkData,
      nodes: updatedNodes
    });
  };

  // Pipe input handler
  const handlePipeChange = (index, field, value) => {
    const updatedPipes = [...networkData.pipes];
    updatedPipes[index][field] = value;
    setNetworkData({
      ...networkData,
      pipes: updatedPipes
    });
  };

  // Pipe calculations
  const calculateHazenWilliams = (pipe) => {
    const roughness = networkData.pipeDefaults.roughness['hazen-williams'];
    const area = Math.PI * Math.pow(pipe.diameter / 1000, 2) / 4; // m²
    const velocity = Math.abs(pipe.flowRate) / area;
    const headloss = 10.67 * Math.pow(pipe.length / (roughness * Math.pow(pipe.diameter / 1000, 4.87)), 1.852) 
                    * Math.pow(Math.abs(pipe.flowRate), 1.852);
    
    return { headloss: headloss * Math.sign(pipe.flowRate), velocity };
  };

  const calculateDarcyWeisbach = (pipe) => {
    const roughness = networkData.pipeDefaults.roughness['darcy-weisbach'];
    const area = Math.PI * Math.pow(pipe.diameter / 1000, 2) / 4; // m²
    const velocity = Math.abs(pipe.flowRate) / area;
    const reynolds = (velocity * (pipe.diameter / 1000)) / 1.307e-6; // at 10°C
    
    // Swamee-Jain approximation for friction factor
    const frictionFactor = 0.25 / Math.pow(
      Math.log10(roughness / (3.7 * pipe.diameter / 1000) + 5.74 / Math.pow(reynolds, 0.9)), 2
    );
    
    const headloss = frictionFactor * (pipe.length / (pipe.diameter / 1000)) 
                    * Math.pow(velocity, 2) / (2 * 9.81);
    
    return { headloss: headloss * Math.sign(pipe.flowRate), velocity, frictionFactor };
  };

  // Network analysis function
  const analyzeNetwork = () => {
    if (!validateInputs()) return;

    try {
      let workingNetwork = JSON.parse(JSON.stringify(networkData));
      let maxChange = Infinity;
      let iteration = 0;
      const warnings = [];

      while (maxChange > networkData.accuracy && iteration < networkData.maxIterations) {
        const iterationChanges = []; // Collect changes for this iteration
        
        // Calculate pipe headlosses and velocities
        workingNetwork.pipes = workingNetwork.pipes.map(pipe => {
          const calc = networkData.analysisMethod === 'hazen-williams' ?
            calculateHazenWilliams(pipe) :
            calculateDarcyWeisbach(pipe);
          
          // Check velocity constraints
          if (calc.velocity > networkData.maxVelocity) {
            warnings.push(`High velocity in Pipe ${pipe.id}: ${calc.velocity.toFixed(2)} m/s`);
          }
          if (calc.velocity < networkData.minVelocity) {
            warnings.push(`Low velocity in Pipe ${pipe.id}: ${calc.velocity.toFixed(2)} m/s`);
          }

          return {
            ...pipe,
            headloss: calc.headloss,
            velocity: calc.velocity
          };
        });

        // Calculate node pressures and adjust flows
        workingNetwork.nodes = workingNetwork.nodes.map(node => {
          if (node.isReservoir) return node;

          // Get connected pipes
          const incomingPipes = workingNetwork.pipes.filter(p => p.endNode === node.id);
          const outgoingPipes = workingNetwork.pipes.filter(p => p.startNode === node.id);

          // Calculate flow balance
          const netFlow = incomingPipes.reduce((sum, p) => sum + p.flowRate, 0) -
                         outgoingPipes.reduce((sum, p) => sum + p.flowRate, 0);
          
          // Calculate flow correction
          const correction = (node.demand - netFlow) / 
                           (incomingPipes.length + outgoingPipes.length);

          // Update pipe flows and collect changes
          incomingPipes.forEach(p => {
            const pipe = workingNetwork.pipes.find(wp => wp.id === p.id);
            const oldFlow = pipe.flowRate;
            pipe.flowRate += correction;
            iterationChanges.push(Math.abs(pipe.flowRate - oldFlow));
          });

          outgoingPipes.forEach(p => {
            const pipe = workingNetwork.pipes.find(wp => wp.id === p.id);
            const oldFlow = pipe.flowRate;
            pipe.flowRate -= correction;
            iterationChanges.push(Math.abs(pipe.flowRate - oldFlow));
          });

          return node;
        });

        // Update maxChange outside of the loops
        maxChange = iterationChanges.length > 0 ? Math.max(...iterationChanges) : 0;
        iteration++;
      }

      // Calculate final pressures
      const nodePressures = {};
      const pipeFlows = {};
      const pipeVelocities = {};
      const pipeHeadlosses = {};

      workingNetwork.pipes.forEach(pipe => {
        pipeFlows[pipe.id] = pipe.flowRate;
        pipeVelocities[pipe.id] = pipe.velocity;
        pipeHeadlosses[pipe.id] = pipe.headloss;
      });

      workingNetwork.nodes.forEach(node => {
        if (!node.isReservoir) {
          const pressure = calculateNodePressure(node, workingNetwork);
          nodePressures[node.id] = pressure;

          // Check pressure constraints
          if (pressure < networkData.minPressure) {
            warnings.push(`Low pressure at Node ${node.id}: ${pressure.toFixed(2)} m`);
          }
          if (pressure > networkData.maxPressure) {
            warnings.push(`High pressure at Node ${node.id}: ${pressure.toFixed(2)} m`);
          }
        }
      });

      setResults({
        nodePressures,
        pipeFlows,
        pipeVelocities,
        pipeHeadlosses,
        iterations: iteration,
        maxFlowChange: maxChange,
        converged: maxChange <= networkData.accuracy,
        warnings
      });

    } catch (error) {
      setErrors({ calculation: error.message });
    }
  };

  // Helper function to calculate node pressure
  const calculateNodePressure = (node, network) => {
    // Find path to nearest reservoir
    const reservoir = network.nodes.find(n => n.isReservoir);
    if (!reservoir) return 0;

    // Simple pressure calculation (can be enhanced for more complex networks)
    const elevationDiff = reservoir.elevation - node.elevation;
    const connectedPipe = network.pipes.find(
      p => p.startNode === reservoir.id && p.endNode === node.id
    );

    return elevationDiff - (connectedPipe ? connectedPipe.headloss : 0);
  };

  return (
    <div className="water-network-analysis">
      <h2>Water Network Analysis</h2>
      
      <div className="network-controls">
        {/* Nodes Section */}
        <div className="input-section">
          <h3>Nodes</h3>
          {networkData.nodes.map((node, index) => (
            <div key={node.id} className="node-input">
              <h4>Node {node.id}</h4>
              
              <div className="input-group">
                <label>Type:</label>
                <select
                  value={node.isReservoir.toString()}
                  onChange={(e) => handleNodeChange(index, 'isReservoir', e.target.value)}
                >
                  <option value="false">Junction</option>
                  <option value="true">Reservoir</option>
                </select>
              </div>

              <div className="input-group">
                <label>Elevation (m):</label>
                <input
                  type="number"
                  value={node.elevation}
                  onChange={(e) => handleNodeChange(index, 'elevation', Number(e.target.value))}
                />
              </div>

              {!node.isReservoir && (
                <div className="input-group">
                  <label>Demand (L/s):</label>
                  <input
                    type="number"
                    value={node.demand}
                    onChange={(e) => handleNodeChange(index, 'demand', Number(e.target.value))}
                  />
                </div>
              )}
            </div>
          ))}
          <button 
            className="add-button"
            onClick={() => {
              const newId = String.fromCharCode(65 + networkData.nodes.length);
              setNetworkData({
                ...networkData,
                nodes: [...networkData.nodes, {
                  id: newId,
                  elevation: 0,
                  demand: 0,
                  pressure: 0,
                  isReservoir: false
                }]
              });
            }}
          >
            Add Node
          </button>
        </div>

        {/* Pipes Section */}
        <div className="input-section">
          <h3>Pipes</h3>
          {networkData.pipes.map((pipe, index) => (
            <div key={pipe.id} className="pipe-input">
              <h4>Pipe {pipe.id}</h4>
              
              <div className="input-group">
                <label>Start Node:</label>
                <select
                  value={pipe.startNode}
                  onChange={(e) => handlePipeChange(index, 'startNode', e.target.value)}
                >
                  <option value="">Select Node</option>
                  {networkData.nodes.map(node => (
                    <option key={node.id} value={node.id}>Node {node.id}</option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <label>End Node:</label>
                <select
                  value={pipe.endNode}
                  onChange={(e) => handlePipeChange(index, 'endNode', e.target.value)}
                >
                  <option value="">Select Node</option>
                  {networkData.nodes.map(node => (
                    <option key={node.id} value={node.id}>Node {node.id}</option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <label>Length (m):</label>
                <input
                  type="number"
                  value={pipe.length}
                  onChange={(e) => handlePipeChange(index, 'length', Number(e.target.value))}
                />
              </div>

              <div className="input-group">
                <label>Diameter (mm):</label>
                <input
                  type="number"
                  value={pipe.diameter}
                  onChange={(e) => handlePipeChange(index, 'diameter', Number(e.target.value))}
                />
              </div>

              <div className="input-group">
                <label>Roughness:</label>
                <input
                  type="number"
                  value={pipe.roughness}
                  onChange={(e) => handlePipeChange(index, 'roughness', Number(e.target.value))}
                />
              </div>
            </div>
          ))}
          <button 
            className="add-button"
            onClick={() => {
              setNetworkData({
                ...networkData,
                pipes: [...networkData.pipes, {
                  id: networkData.pipes.length + 1,
                  startNode: '',
                  endNode: '',
                  length: 100,
                  diameter: networkData.pipeDefaults.minDiameter,
                  roughness: networkData.pipeDefaults.roughness[networkData.analysisMethod],
                  flowRate: 0,
                  headloss: 0
                }]
              });
            }}
          >
            Add Pipe
          </button>
        </div>

        <div className="analysis-controls">
          <button 
            className="analyze-button"
            onClick={analyzeNetwork}
            disabled={Object.keys(errors).length > 0}
          >
            Analyze Network
          </button>
          
          {Object.keys(errors).length > 0 && (
            <div className="error-messages">
              {Object.values(errors).map((error, index) => (
                <div key={index} className="error-message">{error}</div>
              ))}
            </div>
          )}
        </div>

        {/* Analysis Results Section */}
        {results && (
          <div className="results-section">
            <h3>Analysis Results</h3>
            
            <div className="results-grid">
              <div className="result-item">
                <h4>Node Results</h4>
                {networkData.nodes.map(node => (
                  <div key={node.id} className="result-detail">
                    <span>Node {node.id}:</span>
                    <span>
                      {node.isReservoir ? 'Reservoir' : `Pressure: ${results.nodePressures[node.id]?.toFixed(2) || 0} m`}
                    </span>
                  </div>
                ))}
              </div>

              <div className="result-item">
                <h4>Pipe Results</h4>
                {networkData.pipes.map(pipe => (
                  <div key={pipe.id} className="result-detail">
                    <span>Pipe {pipe.id}:</span>
                    <div className="pipe-results">
                      <div>Flow: {results.pipeFlows[pipe.id]?.toFixed(2) || 0} L/s</div>
                      <div>Velocity: {results.pipeVelocities[pipe.id]?.toFixed(2) || 0} m/s</div>
                      <div>Headloss: {results.pipeHeadlosses[pipe.id]?.toFixed(2) || 0} m</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="result-item">
                <h4>Analysis Summary</h4>
                <div className="result-detail">
                  <span>Iterations:</span>
                  <span>{results.iterations || 0}</span>
                </div>
                <div className="result-detail">
                  <span>Max Flow Change:</span>
                  <span>{results.maxFlowChange?.toFixed(4) || 0} L/s</span>
                </div>
                <div className="result-detail">
                  <span>Status:</span>
                  <span className={results.converged ? 'success' : 'warning'}>
                    {results.converged ? 'Converged' : 'Not Converged'}
                  </span>
                </div>
              </div>

              {/* Warnings Section */}
              {results.warnings && results.warnings.length > 0 && (
                <div className="result-item warnings">
                  <h4>Warnings</h4>
                  <ul>
                    {results.warnings.map((warning, index) => (
                      <li key={index}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WaterNetworkAnalysis;