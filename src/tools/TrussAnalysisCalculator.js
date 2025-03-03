import React, { useState } from 'react';
import './TrussAnalysisCalculator.css';
import TrussVisualization from './TrussVisualization';

const TrussAnalysisCalculator = () => {
  const [nodes, setNodes] = useState([
    { id: 1, x: 0, y: 0, support: 'pin', fx: 0, fy: 0 },
    { id: 2, x: 3000, y: 0, support: 'roller', fx: 0, fy: 0 },
    { id: 3, x: 1500, y: 2000, support: 'free', fx: 0, fy: -10 } // Example load of 10kN downward
  ]);

  const [members, setMembers] = useState([
    { id: 1, startNode: 1, endNode: 3, force: 0, stress: 0 },
    { id: 2, startNode: 2, endNode: 3, force: 0, stress: 0 },
    { id: 3, startNode: 1, endNode: 2, force: 0, stress: 0 }
  ]);

  const [memberProperties, setMemberProperties] = useState({
    area: 1000, // mm²
    elasticModulus: 200000 // MPa (Steel)
  });

  const [results, setResults] = useState(null);
  const [errors, setErrors] = useState({});

  const validateInputs = () => {
    const newErrors = {};
    
    // Check for minimum number of nodes and members
    if (nodes.length < 3) {
      newErrors.nodes = 'At least 3 nodes are required';
    }
    if (members.length < 3) {
      newErrors.members = 'At least 3 members are required';
    }

    // Check for valid supports
    const supports = nodes.filter(node => node.support !== 'free');
    if (supports.length < 2) {
      newErrors.supports = 'At least 2 supports are required';
    }

    // Check for valid member connections
    members.forEach(member => {
      const startNode = nodes.find(n => n.id === member.startNode);
      const endNode = nodes.find(n => n.id === member.endNode);
      if (!startNode || !endNode) {
        newErrors.connections = 'Invalid member connections';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateMemberLength = (member) => {
    const startNode = nodes.find(n => n.id === member.startNode);
    const endNode = nodes.find(n => n.id === member.endNode);
    const dx = endNode.x - startNode.x;
    const dy = endNode.y - startNode.y;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const calculateMemberAngle = (member) => {
    const startNode = nodes.find(n => n.id === member.startNode);
    const endNode = nodes.find(n => n.id === member.endNode);
    const dx = endNode.x - startNode.x;
    const dy = endNode.y - startNode.y;
    return Math.atan2(dy, dx);
  };

  const analyzeTruss = () => {
    if (!validateInputs()) {
      return;
    }

    try {
      // Create stiffness matrix
      const numNodes = nodes.length;
      const size = numNodes * 2;
      const K = Array(size).fill().map(() => Array(size).fill(0));
      const F = Array(size).fill(0);
      const U = Array(size).fill(0);

      // Assemble global stiffness matrix
      members.forEach(member => {
        const E = memberProperties.elasticModulus;
        const A = memberProperties.area;
        const L = calculateMemberLength(member);
        const angle = calculateMemberAngle(member);
        const c = Math.cos(angle);
        const s = Math.sin(angle);

        const k = (E * A) / L;
        const i1 = (member.startNode - 1) * 2;
        const i2 = i1 + 1;
        const j1 = (member.endNode - 1) * 2;
        const j2 = j1 + 1;

        // Member stiffness matrix in global coordinates
        const kc2 = k * c * c;
        const ks2 = k * s * s;
        const kcs = k * c * s;

        // Add member stiffness to global stiffness matrix
        K[i1][i1] += kc2;    K[i1][i2] += kcs;     K[i1][j1] -= kc2;    K[i1][j2] -= kcs;
        K[i2][i1] += kcs;    K[i2][i2] += ks2;     K[i2][j1] -= kcs;    K[i2][j2] -= ks2;
        K[j1][i1] -= kc2;    K[j1][i2] -= kcs;     K[j1][j1] += kc2;    K[j1][j2] += kcs;
        K[j2][i1] -= kcs;    K[j2][i2] -= ks2;     K[j2][j1] += kcs;    K[j2][j2] += ks2;
      });

      // Apply boundary conditions and loads
      nodes.forEach((node, i) => {
        const index = i * 2;
        F[index] = node.fx;
        F[index + 1] = node.fy;

        if (node.support === 'pin') {
          K[index][index] = 1e15;     // Very large number for fixed DOF
          K[index + 1][index + 1] = 1e15;
          F[index] = 0;
          F[index + 1] = 0;
        } else if (node.support === 'roller') {
          K[index + 1][index + 1] = 1e15;
          F[index + 1] = 0;
        }
      });

      // Solve system of equations (simplified for basic truss)
      // Using Gaussian elimination for small systems
      for (let i = 0; i < size; i++) {
        for (let j = i + 1; j < size; j++) {
          const factor = K[j][i] / K[i][i];
          for (let k = i; k < size; k++) {
            K[j][k] -= factor * K[i][k];
          }
          F[j] -= factor * F[i];
        }
      }

      // Back substitution
      for (let i = size - 1; i >= 0; i--) {
        let sum = F[i];
        for (let j = i + 1; j < size; j++) {
          sum -= K[i][j] * U[j];
        }
        U[i] = sum / K[i][i];
      }

      // Calculate member forces and stresses
      const memberResults = members.map(member => {
        const startNode = nodes.find(n => n.id === member.startNode);
        const endNode = nodes.find(n => n.id === member.endNode);
        const angle = calculateMemberAngle(member);
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        
        const i1 = (startNode.id - 1) * 2;
        const i2 = i1 + 1;
        const j1 = (endNode.id - 1) * 2;
        const j2 = j1 + 1;

        const du = U[j1] - U[i1];
        const dv = U[j2] - U[i2];
        const elongation = du * c + dv * s;
        const force = (memberProperties.elasticModulus * memberProperties.area * elongation) / calculateMemberLength(member);
        const stress = force / memberProperties.area;

        return {
          ...member,
          force: force / 1000, // Convert to kN
          stress: stress, // MPa
          type: force > 0 ? 'Tension' : 'Compression'
        };
      });

      setResults({
        members: memberResults,
        displacements: nodes.map((node, i) => ({
          id: node.id,
          dx: U[i * 2],
          dy: U[i * 2 + 1]
        }))
      });

    } catch (error) {
      setErrors({ calculation: 'Error in calculations. Please check input data.' });
    }
  };

  return (
    <div className="truss-calculator">
      <h2>2D Truss Analysis Calculator</h2>
      
      <div className="input-sections">
        <div className="input-section">
          <h3>Member Properties</h3>
          <div className="input-group">
            <label>Cross-sectional Area (mm²):</label>
            <input
              type="number"
              value={memberProperties.area}
              onChange={(e) => setMemberProperties({
                ...memberProperties,
                area: parseFloat(e.target.value)
              })}
            />
          </div>
          <div className="input-group">
            <label>Elastic Modulus (MPa):</label>
            <input
              type="number"
              value={memberProperties.elasticModulus}
              onChange={(e) => setMemberProperties({
                ...memberProperties,
                elasticModulus: parseFloat(e.target.value)
              })}
            />
          </div>
        </div>

        <div className="input-section">
          <h3>Nodes</h3>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Node</th>
                  <th>X (mm)</th>
                  <th>Y (mm)</th>
                  <th>Support</th>
                  <th>Fx (kN)</th>
                  <th>Fy (kN)</th>
                </tr>
              </thead>
              <tbody>
                {nodes.map((node, index) => (
                  <tr key={node.id}>
                    <td>{node.id}</td>
                    <td>
                      <input
                        type="number"
                        value={node.x}
                        onChange={(e) => {
                          const newNodes = [...nodes];
                          newNodes[index].x = parseFloat(e.target.value);
                          setNodes(newNodes);
                        }}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={node.y}
                        onChange={(e) => {
                          const newNodes = [...nodes];
                          newNodes[index].y = parseFloat(e.target.value);
                          setNodes(newNodes);
                        }}
                      />
                    </td>
                    <td>
                      <select
                        value={node.support}
                        onChange={(e) => {
                          const newNodes = [...nodes];
                          newNodes[index].support = e.target.value;
                          setNodes(newNodes);
                        }}
                      >
                        <option value="free">Free</option>
                        <option value="pin">Pin</option>
                        <option value="roller">Roller</option>
                      </select>
                    </td>
                    <td>
                      <input
                        type="number"
                        value={node.fx}
                        onChange={(e) => {
                          const newNodes = [...nodes];
                          newNodes[index].fx = parseFloat(e.target.value);
                          setNodes(newNodes);
                        }}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={node.fy}
                        onChange={(e) => {
                          const newNodes = [...nodes];
                          newNodes[index].fy = parseFloat(e.target.value);
                          setNodes(newNodes);
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="input-section">
          <h3>Members</h3>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Start Node</th>
                  <th>End Node</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member, index) => (
                  <tr key={member.id}>
                    <td>{member.id}</td>
                    <td>
                      <input
                        type="number"
                        value={member.startNode}
                        onChange={(e) => {
                          const newMembers = [...members];
                          newMembers[index].startNode = parseInt(e.target.value);
                          setMembers(newMembers);
                        }}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={member.endNode}
                        onChange={(e) => {
                          const newMembers = [...members];
                          newMembers[index].endNode = parseInt(e.target.value);
                          setMembers(newMembers);
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {Object.keys(errors).length > 0 && (
        <div className="errors">
          {Object.values(errors).map((error, index) => (
            <p key={index} className="error">{error}</p>
          ))}
        </div>
      )}

      <button className="analyze-button" onClick={analyzeTruss}>
        Analyze Truss
      </button>

      {results && (
        <div className="results-section">
          <h3>Analysis Results</h3>
          
          <div className="results-container">
            <h4>Member Forces and Stresses</h4>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Force (kN)</th>
                    <th>Stress (MPa)</th>
                    <th>Type</th>
                  </tr>
                </thead>
                <tbody>
                  {results.members.map(member => (
                    <tr key={member.id}>
                      <td>{member.id}</td>
                      <td>{Math.abs(member.force).toFixed(2)}</td>
                      <td>{Math.abs(member.stress).toFixed(2)}</td>
                      <td className={member.type.toLowerCase()}>
                        {member.type}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h4>Node Displacements</h4>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Node</th>
                    <th>X Displacement (mm)</th>
                    <th>Y Displacement (mm)</th>
                  </tr>
                </thead>
                <tbody>
                  {results.displacements.map(displacement => (
                    <tr key={displacement.id}>
                      <td>{displacement.id}</td>
                      <td>{displacement.dx.toFixed(3)}</td>
                      <td>{displacement.dy.toFixed(3)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <TrussVisualization nodes={nodes} members={members} results={results} />
    </div>
  );
};

export default TrussAnalysisCalculator;