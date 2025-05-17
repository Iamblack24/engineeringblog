import React, { useState, useEffect } from 'react';
import './WaterNetworkAnalysis.css';

const WaterNetworkAnalysis = () => {
  const initialPipeData = {
    id: 1, startNode: 'A', endNode: 'B', length: 100, diameter: 100,
    // For Hazen-Williams, this is 'C'. For Darcy-Weisbach, this is absolute roughness 'e' in mm.
    roughnessParam: 130, 
  };
  const initialNodeData = [
    { id: 'A', elevation: 100, demand: 0, isReservoir: true },
    { id: 'B', elevation: 90, demand: 10, isReservoir: false },
  ];

  const [networkData, setNetworkData] = useState({
    analysisMethod: 'hazen-williams', // 'hazen-williams' or 'darcy-weisbach'
    maxIterations: 100,
    hglAccuracy: 0.01, // Accuracy for HGL convergence (m)
    omega: 1.2, // Relaxation factor for SOR-like HGL adjustment
    minPressure: 15, // m of water column
    maxPressure: 70, // m of water column
    maxVelocity: 2.5, // m/s
    minVelocity: 0.3, // m/s
    gravity: 9.81, // m/s^2
    waterKinematicViscosity: 1.004e-6, // m^2/s at 20°C (for Darcy-Weisbach Reynolds number)

    pipes: [initialPipeData],
    nodes: initialNodeData,

    pipeDefaults: {
      hazenWilliamsC: 130,
      darcyWeisbachRoughnessE_mm: 0.15, // Default absolute roughness for DW in mm
      minDiameter: 50,
      maxDiameter: 1000,
    },
    nodeDefaults: {
      minElevation: 0,
      maxElevation: 1000,
    }
  });

  const [results, setResults] = useState(null);
  const [errors, setErrors] = useState({});
  const [analysisInProgress, setAnalysisInProgress] = useState(false);

  const getPipeResistanceAndExponent = (pipe, currentFlowForDW = 0) => {
    const D_m = pipe.diameter / 1000;
    if (networkData.analysisMethod === 'hazen-williams') {
      const C = pipe.roughnessParam; // Hazen-Williams C
      // r for hf = r * Q_Ls^1.852 (Q in L/s)
      // hf = 10.67 * L / (C^1.852 * D_m^4.87) * (Q_m3s^1.852)
      // Q_m3s = Q_Ls / 1000
      // r_Ls = (10.67 * pipe.length / (Math.pow(C, 1.852) * Math.pow(D_m, 4.87))) / Math.pow(1000, 1.852);
      // Simplified: Use Q in m3/s for internal calcs, convert at display
      const r_m3s = 10.67 * pipe.length / (Math.pow(C, 1.852) * Math.pow(D_m, 4.87));
      return { r: r_m3s, n: 1.852, isDarcy: false };
    } else { // darcy-weisbach
      const e_m = pipe.roughnessParam / 1000; // Absolute roughness e in meters
      const area_m2 = Math.PI * Math.pow(D_m, 2) / 4;
      let frictionFactor = 0.02; // Initial guess or from previous iteration

      if (area_m2 > 1e-9 && Math.abs(currentFlowForDW) > 1e-9) { // currentFlowForDW in m3/s
        const velocity_m_s = Math.abs(currentFlowForDW) / area_m2;
        if (D_m > 1e-9 && velocity_m_s > 1e-9) {
            const reynolds = (velocity_m_s * D_m) / networkData.waterKinematicViscosity;
            if (reynolds > 2300) { // Turbulent flow for Swamee-Jain
                 // Swamee-Jain
                frictionFactor = 0.25 / Math.pow(Math.log10(e_m / (3.7 * D_m) + 5.74 / Math.pow(reynolds, 0.9)), 2);
            } else if (reynolds > 0) { // Laminar
                frictionFactor = 64 / reynolds;
            }
        }
      }
      // r for hf = r * Q_m3s^2
      const r_m3s = frictionFactor * pipe.length / (D_m * 2 * networkData.gravity * Math.pow(area_m2, 2));
      return { r: r_m3s, n: 2.0, isDarcy: true, currentFrictionFactor: frictionFactor };
    }
  };
  
  const calculateFlow = (dH, r, n) => {
    if (r < 1e-9 || Math.abs(dH) < 1e-9) return 0;
    return Math.sign(dH) * Math.pow(Math.abs(dH) / r, 1 / n);
  };

  const analyzeNetwork = () => {
    if (!validateInputs()) return;
    setAnalysisInProgress(true);
    setResults(null); // Clear previous results

    // Use setTimeout to allow UI to update before blocking with calculations
    setTimeout(() => {
        try {
            let iteration = 0;
            let maxHeadChangeOverall = Infinity;
            const warnings = [];
            const recommendations = [];

            // Initialize working data
            // Refactored for clarity and to potentially avoid parser issues with complex inline objects
            const nodesMap = new Map(networkData.nodes.map(n => {
                const reservoirNode = networkData.nodes.find(nr => nr.isReservoir);
                // Use nullish coalescing (??) in case 0 is a valid elevation from reservoirNode
                const initialHgl = n.isReservoir 
                    ? n.elevation 
                    : (reservoirNode?.elevation ?? n.elevation); 
                return [n.id, { ...n, hgl: initialHgl }];
            }));
            let pipes = networkData.pipes.map(p => ({ ...p, flow_m3s: 0, headloss_m: 0, velocity_m_s: 0 }));

            // Pre-calculate pipe resistances if Hazen-Williams
            if (networkData.analysisMethod === 'hazen-williams') {
                pipes = pipes.map(p => {
                    const { r, n } = getPipeResistanceAndExponent(p);
                    return { ...p, r, n };
                });
            }
            
            // Iterative HGL Adjustment (SOR-like Nodal Method)
            while (maxHeadChangeOverall > networkData.hglAccuracy && iteration < networkData.maxIterations) {
                maxHeadChangeOverall = 0;

                if (networkData.analysisMethod === 'darcy-weisbach') {
                    pipes = pipes.map(p => { // Recalculate DW resistance based on current flow
                        const { r, n, currentFrictionFactor } = getPipeResistanceAndExponent(p, p.flow_m3s);
                        return { ...p, r, n, currentFrictionFactor };
                    });
                }

                nodesMap.forEach(node => {
                    if (node.isReservoir) return; // Skip reservoirs, HGL is fixed

                    const oldHGL = node.hgl;
                    let flowSum_m3s = 0; // Sum of Q_kj (flow from k into j)
                    let dSumQ_dHj_coeff = 0; // CORRECTED: Variable name cannot contain spaces

                    pipes.forEach(pipe => {
                        let otherNodeId = null;
                        let isFlowTowardsNodeJ = false;

                        if (pipe.startNode === node.id) {
                            otherNodeId = pipe.endNode;
                            isFlowTowardsNodeJ = false; // Q_jk (flow from j to k)
                        } else if (pipe.endNode === node.id) {
                            otherNodeId = pipe.startNode;
                            isFlowTowardsNodeJ = true; // Q_kj (flow from k to j)
                        } else {
                            return; // Pipe not connected to current node j
                        }
                        
                        const otherNode = nodesMap.get(otherNodeId);
                        if (!otherNode) {
                            warnings.push(`Node ${otherNodeId} defined in pipe ${pipe.id} but not found.`);
                            return;
                        }

                        const H_k = otherNode.hgl;
                        const H_j_current = node.hgl; // Current HGL of node j
                        const dH_pipe = H_k - H_j_current;
                        
                        const Q_pipe_m3s = calculateFlow(dH_pipe, pipe.r, pipe.n);

                        if (isFlowTowardsNodeJ) {
                            flowSum_m3s += Q_pipe_m3s;
                        } else {
                            flowSum_m3s -= Q_pipe_m3s; // Flow is Q_jk, so subtract for sum into j
                        }
                        
                        // Derivative term: Sum ( |Q_pipe| / (n_pipe * (|dH_pipe| + epsilon_H)) )
                        if (Math.abs(dH_pipe) > 1e-6 && pipe.r > 1e-9) { // Avoid division by zero
                            dSumQ_dHj_coeff += Math.abs(Q_pipe_m3s) / (pipe.n * Math.abs(dH_pipe)); // CORRECTED: Use valid variable name
                        } else if (pipe.r > 1e-9) { // If dH is tiny, use a linearized conductance
                            dSumQ_dHj_coeff += Math.pow(1 / pipe.r, 1 / pipe.n) * (1 / pipe.n) * Math.pow(1e-6, (1/pipe.n) - 1); // CORRECTED: Use valid variable name
                        }
                    });

                    const demand_m3s = node.demand / 1000; // Convert L/s to m^3/s
                    const flowImbalance_m3s = flowSum_m3s - demand_m3s;

                    if (dSumQ_dHj_coeff > 1e-9) { // CORRECTED: Use valid variable name
                        const hglCorrection = flowImbalance_m3s / dSumQ_dHj_coeff; // CORRECTED: Use valid variable name
                        node.hgl -= networkData.omega * hglCorrection; // Update HGL
                    }
                    
                    maxHeadChangeOverall = Math.max(maxHeadChangeOverall, Math.abs(node.hgl - oldHGL));
                });
                iteration++;
            }

            // Final pass to calculate flows, headlosses, velocities, and pressures
            pipes = pipes.map(pipe => {
                const nodeStart = nodesMap.get(pipe.startNode);
                const nodeEnd = nodesMap.get(pipe.endNode);
                if (!nodeStart || !nodeEnd) return {...pipe, error: "Invalid node connection"};

                const dH = nodeStart.hgl - nodeEnd.hgl;
                let Q_m3s = calculateFlow(dH, pipe.r, pipe.n);
                
                // If Darcy, recalculate r and Q one last time with final HGLs for better accuracy
                if (pipe.isDarcy) {
                    const { r: final_r, n: final_n, currentFrictionFactor: final_f } = getPipeResistanceAndExponent(pipe, Q_m3s);
                    pipe.r = final_r; pipe.n = final_n; pipe.currentFrictionFactor = final_f;
                    Q_m3s = calculateFlow(dH, pipe.r, pipe.n);
                }

                const headloss_m = Math.abs(dH); // Actual headloss magnitude
                const area_m2 = Math.PI * Math.pow(pipe.diameter / 1000, 2) / 4;
                const velocity_m_s = area_m2 > 1e-9 ? Math.abs(Q_m3s) / area_m2 : 0;

                if (velocity_m_s > networkData.maxVelocity && Math.abs(Q_m3s) > 1e-6) {
                    warnings.push(`High velocity in Pipe ${pipe.id} (${pipe.startNode}-${pipe.endNode}): ${velocity_m_s.toFixed(2)} m/s.`);
                    recommendations.push(`Consider increasing diameter for Pipe ${pipe.id} to reduce velocity.`);
                }
                if (velocity_m_s < networkData.minVelocity && Math.abs(Q_m3s) > 1e-6) {
                    warnings.push(`Low velocity in Pipe ${pipe.id} (${pipe.startNode}-${pipe.endNode}): ${velocity_m_s.toFixed(2)} m/s.`);
                }
                return { ...pipe, flow_m3s: Q_m3s, headloss_m, velocity_m_s };
            });

            const finalNodeResults = {};
            nodesMap.forEach(node => {
                const pressure_m = node.hgl - node.elevation;
                finalNodeResults[node.id] = {
                    id: node.id,
                    elevation: node.elevation,
                    demand_Ls: node.demand,
                    isReservoir: node.isReservoir,
                    hgl_m: node.hgl,
                    pressure_m: node.isReservoir ? 0 : pressure_m,
                };
                if (!node.isReservoir) {
                    if (pressure_m < networkData.minPressure) {
                        warnings.push(`Low pressure at Node ${node.id}: ${pressure_m.toFixed(2)} m.`);
                        recommendations.push(`Node ${node.id} has low pressure. Check upstream pipe sizes or source HGL.`);
                    }
                    if (pressure_m > networkData.maxPressure) {
                        warnings.push(`High pressure at Node ${node.id}: ${pressure_m.toFixed(2)} m.`);
                        recommendations.push(`Node ${node.id} has high pressure. Consider pressure reducing valves or system adjustments.`);
                    }
                    if (pressure_m < 0) {
                        warnings.push(`CRITICAL: Negative pressure at Node ${node.id}: ${pressure_m.toFixed(2)} m. Network may be unfeasible or data error.`);
                    }
                }
            });
            
            const finalPipeResults = pipes.map(p => ({
                id: p.id,
                startNode: p.startNode,
                endNode: p.endNode,
                length: p.length,
                diameter: p.diameter,
                roughnessParam: p.roughnessParam,
                flow_Ls: p.flow_m3s * 1000, // Convert to L/s for display
                velocity_m_s: p.velocity_m_s,
                headloss_m: p.headloss_m,
                resistance: p.r,
                exponent_n: p.n,
                frictionFactor: p.currentFrictionFactor // For DW
            }));

            setResults({
                nodes: Object.values(finalNodeResults),
                pipes: finalPipeResults,
                iterations: iteration,
                maxHeadChange: maxHeadChangeOverall,
                converged: maxHeadChangeOverall <= networkData.hglAccuracy,
                warnings: [...new Set(warnings)], // Remove duplicate warnings
                recommendations: [...new Set(recommendations)],
            });

        } catch (calcError) {
            console.error("Calculation Error:", calcError);
            setErrors({ calculation: `Calculation error: ${calcError.message}` });
        } finally {
            setAnalysisInProgress(false);
        }
    }, 10); // setTimeout
  };
  
  const validateInputs = () => {
    const newErrors = {};
    if (!networkData.nodes.some(n => n.isReservoir)) {
      newErrors.network = "Network must have at least one reservoir.";
    }
    networkData.nodes.forEach((node, i) => {
      if (node.id.trim() === "") newErrors[`node_id_${i}`] = `Node ${i+1} ID cannot be empty.`;
      if (isNaN(parseFloat(node.elevation))) newErrors[`node_elev_${i}`] = `Node ${node.id || i+1} elevation is invalid.`;
      if (!node.isReservoir && isNaN(parseFloat(node.demand))) newErrors[`node_demand_${i}`] = `Node ${node.id || i+1} demand is invalid.`;
    });
    const nodeIds = new Set(networkData.nodes.map(n => n.id));
    if (nodeIds.size !== networkData.nodes.length) newErrors.nodes_duplicate_ids = "Node IDs must be unique.";

    networkData.pipes.forEach((pipe, i) => {
      if (isNaN(parseInt(pipe.id))) newErrors[`pipe_id_${i}`] = `Pipe ${i+1} ID is invalid.`;
      if (!pipe.startNode || !nodeIds.has(pipe.startNode)) newErrors[`pipe_start_${i}`] = `Pipe ${pipe.id || i+1} has invalid start node.`;
      if (!pipe.endNode || !nodeIds.has(pipe.endNode)) newErrors[`pipe_end_${i}`] = `Pipe ${pipe.id || i+1} has invalid end node.`;
      if (pipe.startNode === pipe.endNode && pipe.startNode !== "") newErrors[`pipe_loop_${i}`] = `Pipe ${pipe.id || i+1} cannot start and end at the same node.`;
      if (isNaN(parseFloat(pipe.length)) || parseFloat(pipe.length) <= 0) newErrors[`pipe_len_${i}`] = `Pipe ${pipe.id || i+1} length must be positive.`;
      if (isNaN(parseFloat(pipe.diameter)) || parseFloat(pipe.diameter) < networkData.pipeDefaults.minDiameter) newErrors[`pipe_dia_${i}`] = `Pipe ${pipe.id || i+1} diameter is too small.`;
      if (isNaN(parseFloat(pipe.roughnessParam))) newErrors[`pipe_rough_${i}`] = `Pipe ${pipe.id || i+1} roughness is invalid.`;
    });
    const pipeIds = new Set(networkData.pipes.map(p => p.id));
    if (pipeIds.size !== networkData.pipes.length) newErrors.pipes_duplicate_ids = "Pipe IDs must be unique.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNetworkParamChange = (field, value) => {
    setNetworkData(prev => ({ ...prev, [field]: parseFloat(value) || value }));
  };

  const handleNodeChange = (index, field, value) => {
    const updatedNodes = [...networkData.nodes];
    const targetNode = { ...updatedNodes[index] };
    
    if (field === 'isReservoir') {
      targetNode.isReservoir = value === 'true';
      if (targetNode.isReservoir) targetNode.demand = 0;
    } else if (field === 'id') {
        targetNode.id = value.trim().toUpperCase();
    } 
    else {
      targetNode[field] = parseFloat(value);
    }
    updatedNodes[index] = targetNode;
    setNetworkData({ ...networkData, nodes: updatedNodes });
  };

  const handlePipeChange = (index, field, value) => {
    const updatedPipes = [...networkData.pipes];
    const targetPipe = { ...updatedPipes[index] };
    if (field === 'startNode' || field === 'endNode') {
        targetPipe[field] = value;
    } else if (field === 'id') {
        targetPipe.id = parseInt(value) || updatedPipes.length + 1;
    }
    else {
        targetPipe[field] = parseFloat(value);
    }
    updatedPipes[index] = targetPipe;
    setNetworkData({ ...networkData, pipes: updatedPipes });
  };

  const addNode = () => {
    const existingIds = networkData.nodes.map(n => n.id);
    let newIdChar = 65 + networkData.nodes.length; // Start with 'A' + count
    let newId = String.fromCharCode(newIdChar);
    while(existingIds.includes(newId) && newIdChar < 91) { // Ensure unique ID up to 'Z'
        newIdChar++;
        newId = String.fromCharCode(newIdChar);
    }
    if (newIdChar >= 91) { // If 'Z' is taken, append numbers
        let num = 1;
        newId = `N${num}`;
        while(existingIds.includes(newId)) {
            num++;
            newId = `N${num}`;
        }
    }
    setNetworkData(prev => ({
      ...prev,
      nodes: [...prev.nodes, { id: newId, elevation: 0, demand: 0, isReservoir: false }]
    }));
  };

  const removeNode = (indexToRemove) => {
    const nodeIdToRemove = networkData.nodes[indexToRemove].id;
    setNetworkData(prev => ({
      ...prev,
      nodes: prev.nodes.filter((_, index) => index !== indexToRemove),
      pipes: prev.pipes.filter(p => p.startNode !== nodeIdToRemove && p.endNode !== nodeIdToRemove) // Also remove connected pipes
    }));
  };
  
  const addPipe = () => {
    const newPipeId = networkData.pipes.length > 0 ? Math.max(...networkData.pipes.map(p => parseInt(p.id) || 0)) + 1 : 1;
    const defaultRoughness = networkData.analysisMethod === 'hazen-williams' ? networkData.pipeDefaults.hazenWilliamsC : networkData.pipeDefaults.darcyWeisbachRoughnessE_mm;
    setNetworkData(prev => ({
      ...prev,
      pipes: [...prev.pipes, {
        id: newPipeId, startNode: '', endNode: '', length: 100, diameter: 100,
        roughnessParam: defaultRoughness
      }]
    }));
  };

  const removePipe = (indexToRemove) => {
    setNetworkData(prev => ({
      ...prev,
      pipes: prev.pipes.filter((_, index) => index !== indexToRemove)
    }));
  };

  // Effect to update default pipe roughness when analysis method changes
  useEffect(() => {
    const defaultRoughness = networkData.analysisMethod === 'hazen-williams' 
        ? networkData.pipeDefaults.hazenWilliamsC 
        : networkData.pipeDefaults.darcyWeisbachRoughnessE_mm;
    
    setNetworkData(prev => ({
        ...prev,
        pipes: prev.pipes.map(p => ({...p, roughnessParam: defaultRoughness}))
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [networkData.analysisMethod]);


  return (
    <div className="water-network-analysis">
      <h2>Water Network Analysis (Enhanced Solver)</h2>
      
      <div className="network-config-panel">
        <h3>Global Configuration</h3>
        <div className="config-grid">
            <div className="input-group">
                <label>Analysis Method:</label>
                <select value={networkData.analysisMethod} onChange={(e) => handleNetworkParamChange('analysisMethod', e.target.value)}>
                    <option value="hazen-williams">Hazen-Williams</option>
                    <option value="darcy-weisbach">Darcy-Weisbach</option>
                </select>
            </div>
            <div className="input-group"><label>Max Iterations:</label><input type="number" value={networkData.maxIterations} onChange={(e) => handleNetworkParamChange('maxIterations', e.target.value)} /></div>
            <div className="input-group"><label>HGL Accuracy (m):</label><input type="number" step="0.001" value={networkData.hglAccuracy} onChange={(e) => handleNetworkParamChange('hglAccuracy', e.target.value)} /></div>
            <div className="input-group"><label>Relaxation (Omega):</label><input type="number" step="0.1" value={networkData.omega} onChange={(e) => handleNetworkParamChange('omega', e.target.value)} /></div>
            <div className="input-group"><label>Min Pressure (m):</label><input type="number" value={networkData.minPressure} onChange={(e) => handleNetworkParamChange('minPressure', e.target.value)} /></div>
            <div className="input-group"><label>Max Pressure (m):</label><input type="number" value={networkData.maxPressure} onChange={(e) => handleNetworkParamChange('maxPressure', e.target.value)} /></div>
            <div className="input-group"><label>Min Velocity (m/s):</label><input type="number" step="0.1" value={networkData.minVelocity} onChange={(e) => handleNetworkParamChange('minVelocity', e.target.value)} /></div>
            <div className="input-group"><label>Max Velocity (m/s):</label><input type="number" step="0.1" value={networkData.maxVelocity} onChange={(e) => handleNetworkParamChange('maxVelocity', e.target.value)} /></div>
        </div>
      </div>

      <div className="network-elements-editor">
        <div className="input-section nodes-section">
          <div className="section-header"><h3>Nodes</h3> <button className="add-button" onClick={addNode}>+ Add Node</button></div>
          {networkData.nodes.map((node, index) => (
            <div key={`node-${index}`} className="element-input node-input">
              <div className="element-title">
                <span>Node ID:</span> <input type="text" className="id-input" value={node.id} onChange={(e) => handleNodeChange(index, 'id', e.target.value)} />
                <button className="remove-button" onClick={() => removeNode(index)}>×</button>
              </div>
              <div className="input-group"><label>Type:</label><select value={node.isReservoir.toString()} onChange={(e) => handleNodeChange(index, 'isReservoir', e.target.value)}><option value="false">Junction</option><option value="true">Reservoir</option></select></div>
              <div className="input-group"><label>Elevation (m):</label><input type="number" value={node.elevation} onChange={(e) => handleNodeChange(index, 'elevation', e.target.value)} /></div>
              {!node.isReservoir && (<div className="input-group"><label>Demand (L/s):</label><input type="number" value={node.demand} onChange={(e) => handleNodeChange(index, 'demand', e.target.value)} /></div>)}
            </div>
          ))}
        </div>

        <div className="input-section pipes-section">
          <div className="section-header"><h3>Pipes</h3> <button className="add-button" onClick={addPipe}>+ Add Pipe</button></div>
          {networkData.pipes.map((pipe, index) => (
            <div key={`pipe-${index}`} className="element-input pipe-input">
              <div className="element-title">
                 <span>Pipe ID:</span> <input type="number" className="id-input" value={pipe.id} onChange={(e) => handlePipeChange(index, 'id', e.target.value)} />
                <button className="remove-button" onClick={() => removePipe(index)}>×</button>
              </div>
              <div className="input-group"><label>Start Node:</label><select value={pipe.startNode} onChange={(e) => handlePipeChange(index, 'startNode', e.target.value)}><option value="">Select</option>{networkData.nodes.map(n => <option key={`s-${n.id}`} value={n.id}>{n.id}</option>)}</select></div>
              <div className="input-group"><label>End Node:</label><select value={pipe.endNode} onChange={(e) => handlePipeChange(index, 'endNode', e.target.value)}><option value="">Select</option>{networkData.nodes.map(n => <option key={`e-${n.id}`} value={n.id}>{n.id}</option>)}</select></div>
              <div className="input-group"><label>Length (m):</label><input type="number" value={pipe.length} onChange={(e) => handlePipeChange(index, 'length', e.target.value)} /></div>
              <div className="input-group"><label>Diameter (mm):</label><input type="number" value={pipe.diameter} onChange={(e) => handlePipeChange(index, 'diameter', e.target.value)} /></div>
              <div className="input-group"><label>Roughness ({networkData.analysisMethod === 'hazen-williams' ? 'C' : 'e, mm'}):</label><input type="number" value={pipe.roughnessParam} onChange={(e) => handlePipeChange(index, 'roughnessParam', e.target.value)} /></div>
            </div>
          ))}
        </div>
      </div>

      <div className="analysis-controls">
        <button className="analyze-button" onClick={analyzeNetwork} disabled={analysisInProgress || Object.keys(errors).length > 0}>
          {analysisInProgress ? 'Analyzing...' : 'Analyze Network'}
        </button>
        {Object.keys(errors).length > 0 && (
          <div className="error-messages-summary">
            <h4>Input Errors:</h4>
            <ul>{Object.entries(errors).map(([key, errorMsg]) => <li key={key}>{errorMsg}</li>)}</ul>
          </div>
        )}
      </div>

      {results && (
        <div className="results-section">
          <h3>Analysis Results</h3>
          <div className="result-item summary-card">
            <h4>Analysis Summary</h4>
            <div className="summary-details">
                <span>Iterations: {results.iterations}</span>
                <span>Max HGL Change: {results.maxHeadChange?.toFixed(4)} m</span>
                <span className={results.converged ? 'status-success' : 'status-warning'}>
                    Status: {results.converged ? 'Converged' : (results.iterations >= networkData.maxIterations ? 'Max Iterations Reached' : 'Not Converged')}
                </span>
            </div>
          </div>

          <div className="results-tables-container">
            <div className="result-item node-results-table">
              <h4>Node Results</h4>
              <div className="table-container">
                <table>
                  <thead><tr><th>ID</th><th>Type</th><th>Elevation (m)</th><th>Demand (L/s)</th><th>HGL (m)</th><th>Pressure (m)</th></tr></thead>
                  <tbody>
                    {results.nodes.map(node => (
                      <tr key={`res-node-${node.id}`}>
                        <td>{node.id}</td>
                        <td>{node.isReservoir ? 'Reservoir' : 'Junction'}</td>
                        <td>{node.elevation.toFixed(2)}</td>
                        <td>{node.isReservoir ? '-' : node.demand_Ls.toFixed(2)}</td>
                        <td>{node.hgl_m.toFixed(2)}</td>
                        <td>{node.isReservoir ? '-' : node.pressure_m.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="result-item pipe-results-table">
              <h4>Pipe Results</h4>
              <div className="table-container">
                <table>
                  <thead><tr><th>ID</th><th>From</th><th>To</th><th>Flow (L/s)</th><th>Velocity (m/s)</th><th>Headloss (m)</th>{networkData.analysisMethod === 'darcy-weisbach' && <th>Friction Factor</th>}</tr></thead>
                  <tbody>
                    {results.pipes.map(pipe => (
                      <tr key={`res-pipe-${pipe.id}`}>
                        <td>{pipe.id}</td>
                        <td>{pipe.startNode}</td>
                        <td>{pipe.endNode}</td>
                        <td className={pipe.flow_Ls < 0 ? "flow-negative" : ""}>{pipe.flow_Ls.toFixed(2)}</td>
                        <td>{pipe.velocity_m_s.toFixed(2)}</td>
                        <td>{pipe.headloss_m.toFixed(2)}</td>
                        {networkData.analysisMethod === 'darcy-Weisbach' && <td>{pipe.frictionFactor?.toFixed(4) || '-'}</td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {results.warnings && results.warnings.length > 0 && (
            <div className="result-item warnings"><h4>Warnings</h4><ul>{results.warnings.map((w, i) => <li key={`warn-${i}`}>{w}</li>)}</ul></div>
          )}
          {results.recommendations && results.recommendations.length > 0 && (
            <div className="result-item recommendations"><h4>Recommendations</h4><ul>{results.recommendations.map((r, i) => <li key={`rec-${i}`}>{r}</li>)}</ul></div>
          )}
        </div>
      )}
    </div>
  );
};

export default WaterNetworkAnalysis;