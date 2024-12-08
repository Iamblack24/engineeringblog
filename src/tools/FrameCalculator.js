import React, { useEffect, useState, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { zeros, subset, index, multiply, inv, det } from 'mathjs';
import './FrameCalculator.css';

// Move SUPPORT_TYPES outside the component to avoid recreating it on every render
const SUPPORT_TYPES = {
  NONE: 'none',
  FIXED: 'fixed',
  PINNED: 'pinned',
  ROLLER: 'roller'
};

const FrameCalculator = () => {
  // State declarations first
  const [nodes, setNodes] = useState([]);
  const [members, setMembers] = useState([]);
  const [selectedNodes, setSelectedNodes] = useState([]);
  const [nodeSupports, setNodeSupports] = useState({});
  const [loads, setLoads] = useState([]);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [newNodeInput, setNewNodeInput] = useState({ x: '', y: '' });
  const [newLoadInput, setNewLoadInput] = useState({ nodeId: '', fx: '', fy: '' });
  const [contextMenu, setContextMenu] = useState({ show: false, x: 0, y: 0, nodeId: null });

  // Refs next
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const planeRef = useRef(null);
  const nodeMeshesRef = useRef([]);
  const raycasterRef = useRef(new THREE.Raycaster());

  // Handler functions before effects
  const handleNodeSelection = useCallback((nodeId, clickedNode) => {
    if (selectedNodes.includes(nodeId)) {
      setSelectedNodes(prev => prev.filter(id => id !== nodeId));
      clickedNode.material.color.set(0x007bff); // Reset color
    } else {
      setSelectedNodes(prev => {
        const newSelection = [...prev, nodeId];
        if (newSelection.length === 2) {
          // Create member between selected nodes
          const [firstNode, secondNode] = newSelection;
          if (!members.some(m => 
            (m.startNodeId === firstNode && m.endNodeId === secondNode) ||
            (m.startNodeId === secondNode && m.endNodeId === firstNode)
          )) {
            setMembers(prev => [...prev, {
              id: prev.length,
              startNodeId: firstNode,
              endNodeId: secondNode
            }]);
          }
          // Reset selection and colors
          nodeMeshesRef.current.forEach(mesh => mesh.material.color.set(0x007bff));
          return [];
        }
        clickedNode.material.color.set(0xffff00); // Highlight selected node
        return newSelection;
      });
    }
  }, [selectedNodes, members, nodeMeshesRef]);

  const handleManualNodeAdd = (e) => {
    e.preventDefault();
    const x = parseFloat(newNodeInput.x);
    const y = parseFloat(newNodeInput.y);
    
    if (isNaN(x) || isNaN(y)) {
      setError('Please enter valid coordinates');
      return;
    }

    if (nodes.some(node => 
      Math.abs(node.x - x) < 0.1 && 
      Math.abs(node.y - y) < 0.1
    )) {
      setError('A node already exists at these coordinates');
      return;
    }

    const newNode = {
      id: nodes.length,
      x: x,
      y: y,
      z: 0
    };

    setNodes(prev => [...prev, newNode]);
    setNewNodeInput({ x: '', y: '' });
  };

  const handleManualLoadAdd = (e) => {
    e.preventDefault();
    const nodeId = parseInt(newLoadInput.nodeId);
    const fx = parseFloat(newLoadInput.fx);
    const fy = parseFloat(newLoadInput.fy);
    
    if (isNaN(nodeId) || isNaN(fx) || isNaN(fy)) {
      setError('Please enter valid load values');
      return;
    }

    if (!nodes.find(node => node.id === nodeId)) {
      setError('Node does not exist');
      return;
    }

    const newLoad = {
      nodeId,
      fx,
      fy
    };

    setLoads(prev => [...prev, newLoad]);
    setNewLoadInput({ nodeId: '', fx: '', fy: '' }); // Clear input
  };

  const handleSupportChange = (nodeId, supportType) => {
    setNodeSupports(prev => ({
      ...prev,
      [nodeId]: supportType
    }));
  };

  const handleContextMenu = useCallback((event) => {
    event.preventDefault();
    const rect = rendererRef.current.domElement.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(new THREE.Vector2(x, y), cameraRef.current);
    const intersects = raycasterRef.current.intersectObjects(nodeMeshesRef.current);

    if (intersects.length > 0) {
      setContextMenu({
        show: true,
        x: event.clientX,
        y: event.clientY,
        nodeId: intersects[0].object.userData.nodeId
      });
    }
  }, []);

  // Scene initialization effect
  useEffect(() => {
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0xf0f0f0);

    const camera = new THREE.PerspectiveCamera(
      60,
      800 / 600,
      0.1,
      1000
    );
    cameraRef.current = camera;
    camera.position.set(0, 0, 20);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    rendererRef.current = renderer;
    renderer.setSize(800, 600);
    renderer.setClearColor(0xf0f0f0);
    const canvas = canvasRef.current;
    canvas.innerHTML = '';
    canvas.appendChild(renderer.domElement);

    // Add context menu event listener to renderer's domElement
    renderer.domElement.addEventListener('contextmenu', handleContextMenu);

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(10, 10, 10);
    scene.add(directionalLight);

    // Add grid with darker colors for better visibility
    const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x888888);
    scene.add(gridHelper);
    gridHelper.rotation.x = Math.PI / 2; // Rotate to XY plane

    // Add plane for intersection
    const planeGeometry = new THREE.PlaneGeometry(20, 20);
    const planeMaterial = new THREE.MeshBasicMaterial({ 
      visible: false,
      side: THREE.DoubleSide
    });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    planeRef.current = plane;
    scene.add(plane);

    // Add axes helper
    const axesHelper = new THREE.AxesHelper(10);
    scene.add(axesHelper);

    // Animation loop
    function animate() {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    }
    animate();

    // Update cleanup to remove context menu listener
    return () => {
      renderer.domElement.removeEventListener('contextmenu', handleContextMenu);
      renderer.dispose();
      canvas.innerHTML = '';
    };
  }, [handleContextMenu]); // Add handleContextMenu to dependencies

  // Click handler effect
  useEffect(() => {
    const canvas = rendererRef.current?.domElement;
    if (!canvas) return;

    const handleClick = (event) => {
      event.preventDefault();
      setError('');
      setContextMenu({ show: false, x: 0, y: 0, nodeId: null });

      const rect = canvas.getBoundingClientRect();
      const mouseX = ((event.clientX - rect.left) / canvas.clientWidth) * 2 - 1;
      const mouseY = -((event.clientY - rect.top) / canvas.clientHeight) * 2 + 1;

      raycasterRef.current.setFromCamera(
        new THREE.Vector2(mouseX, mouseY),
        cameraRef.current
      );

      const intersectsNodes = raycasterRef.current.intersectObjects(nodeMeshesRef.current);
      
      if (intersectsNodes.length > 0) {
        const clickedNode = intersectsNodes[0].object;
        const nodeId = clickedNode.userData.nodeId;
        handleNodeSelection(nodeId, clickedNode);
      } else {
        const intersectsPlane = raycasterRef.current.intersectObject(planeRef.current);
        if (intersectsPlane.length > 0) {
          const point = intersectsPlane[0].point;
          
          const newNode = {
            id: nodes.length,
            x: Math.round(point.x * 2) / 2,
            y: Math.round(point.y * 2) / 2,
            z: 0
          };

          if (!nodes.some(node => 
            Math.abs(node.x - newNode.x) < 0.1 && 
            Math.abs(node.y - newNode.y) < 0.1
          )) {
            setNodes(prev => [...prev, newNode]);
          }
        }
      }
    };

    canvas.addEventListener('click', handleClick);
    return () => canvas.removeEventListener('click', handleClick);
  }, [nodes, members, selectedNodes, handleNodeSelection]);

  // Scene rendering effect
  useEffect(() => {
    const scene = sceneRef.current;

    while (scene.children.length > 4) {
      scene.remove(scene.children[scene.children.length - 1]);
    }

    nodeMeshesRef.current = [];

    // Draw Members
    members.forEach(member => {
      const startNode = nodes.find(node => node.id === member.startNodeId);
      const endNode = nodes.find(node => node.id === member.endNodeId);
      if (startNode && endNode) {
        const material = new THREE.LineBasicMaterial({ color: 0x000000 });
        const points = [
          new THREE.Vector3(startNode.x, startNode.y, 0),
          new THREE.Vector3(endNode.x, endNode.y, 0),
        ];
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const line = new THREE.Line(geometry, material);
        scene.add(line);
      }
    });

    // Draw Nodes
    nodes.forEach(node => {
      const geometry = new THREE.CircleGeometry(0.3, 32);
      const material = new THREE.MeshStandardMaterial({ color: 0x007bff });
      const circle = new THREE.Mesh(geometry, material);
      circle.position.set(node.x, node.y, 0);
      circle.userData.nodeId = node.id;
      scene.add(circle);
      nodeMeshesRef.current.push(circle);

      // Draw Support
      const supportType = nodeSupports[node.id];
      if (supportType) {
        let supportGeometry;
        let supportMaterial;
        
        switch (supportType) {
          case SUPPORT_TYPES.FIXED:
            supportGeometry = new THREE.BoxGeometry(0.8, 0.8, 0.2);
            supportMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
            break;
          case SUPPORT_TYPES.PINNED:
            supportGeometry = new THREE.ConeGeometry(0.4, 0.8, 3);
            supportMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
            break;
          case SUPPORT_TYPES.ROLLER:
            supportGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.4, 32);
            supportMaterial = new THREE.MeshStandardMaterial({ color: 0x0000ff });
            break;
          default:
            return;
        }

        const support = new THREE.Mesh(supportGeometry, supportMaterial);
        support.position.set(node.x, node.y - 0.5, 0);
        scene.add(support);
      }
    });

    // Draw Loads
    loads.forEach(load => {
      const node = nodes.find(n => n.id === load.nodeId);
      if (node) {
        const arrowLength = Math.sqrt(load.fx * load.fx + load.fy * load.fy) / 1000;
        const direction = new THREE.Vector3(load.fx, 0, load.fy).normalize();
        const arrowHelper = new THREE.ArrowHelper(
          direction,
          new THREE.Vector3(node.x, 0, node.y),
          arrowLength,
          0xff0000
        );
        scene.add(arrowHelper);
      }
    });

  }, [nodes, members, loads, nodeSupports, results]);

  // Calculation function
  const calculateFrame = () => {
    setError('');
    try {
      if (nodes.length < 2 || members.length === 0) {
        setError('Please add at least two nodes and one member.');
        return;
      }

      if (loads.length === 0) {
        setError('Please add at least one load.');
        return;
      }

      // Count support reactions
      let totalReactions = 0;
      nodes.forEach(node => {
        const support = nodeSupports[node.id];
        switch (support) {
          case SUPPORT_TYPES.FIXED:
            totalReactions += 2; // x and y reactions
            break;
          case SUPPORT_TYPES.PINNED:
            totalReactions += 2; // x and y reactions
            break;
          case SUPPORT_TYPES.ROLLER:
            totalReactions += 1; // only y reaction
            break;
          default:
            break;
        }
      });

      if (totalReactions < 3) {
        throw new Error(`Structure is unstable. Need at least 3 reaction components, currently have ${totalReactions}.`);
      }

      const numNodes = nodes.length;
      const dofPerNode = 2;
      const totalDOF = numNodes * dofPerNode;

      // Initialize Global Stiffness Matrix
      let K = zeros(totalDOF, totalDOF);

      // Material and Section Properties
      const E = 210e9; // Young's Modulus (Pa)
      const A = 0.01;  // Cross-sectional Area (m²)

      // Assemble Global Stiffness Matrix
      members.forEach((member, idx) => {
        const startNode = nodes.find(node => node.id === member.startNodeId);
        const endNode = nodes.find(node => node.id === member.endNodeId);

        const dx = endNode.x - startNode.x;
        const dy = endNode.y - startNode.y;
        const L = Math.sqrt(dx * dx + dy * dy);

        if (L < 1e-6) {
          throw new Error(`Member ${idx} has zero length`);
        }

        const cos = dx / L;
        const sin = dy / L;

        const k11 = [
          [ cos * cos,  cos * sin],
          [ cos * sin,  sin * sin]
        ];
        const k12 = [
          [-cos * cos, -cos * sin],
          [-cos * sin, -sin * sin]
        ];
        const k21 = [
          [-cos * cos, -cos * sin],
          [-cos * sin, -sin * sin]
        ];
        const k22 = [
          [ cos * cos,  cos * sin],
          [ cos * sin,  sin * sin]
        ];

        const EA_L = (E * A) / L;

        const i1 = member.startNodeId * dofPerNode;
        const i2 = member.endNodeId * dofPerNode;

        for (let i = 0; i < 2; i++) {
          for (let j = 0; j < 2; j++) {
            K = subset(K, index(i1 + i, i1 + j), 
              subset(K, index(i1 + i, i1 + j)) + k11[i][j] * EA_L);
            
            K = subset(K, index(i1 + i, i2 + j), 
              subset(K, index(i1 + i, i2 + j)) + k12[i][j] * EA_L);
            
            K = subset(K, index(i2 + i, i1 + j), 
              subset(K, index(i2 + i, i1 + j)) + k21[i][j] * EA_L);
            
            K = subset(K, index(i2 + i, i2 + j), 
              subset(K, index(i2 + i, i2 + j)) + k22[i][j] * EA_L);
          }
        }
      });

      // Initialize Force Vector
      let F = zeros(totalDOF);

      // Apply Loads
      loads.forEach(load => {
        const nodeIndex = load.nodeId;
        F = subset(F, index(nodeIndex * dofPerNode), load.fx || 0);
        F = subset(F, index(nodeIndex * dofPerNode + 1), load.fy || 0);
      });

      // Apply Boundary Conditions
      const constrainedDOF = [];
      nodes.forEach(node => {
        const support = nodeSupports[node.id];
        switch (support) {
          case SUPPORT_TYPES.FIXED:
          case SUPPORT_TYPES.PINNED:
            constrainedDOF.push(node.id * dofPerNode);
            constrainedDOF.push(node.id * dofPerNode + 1);
            break;
          case SUPPORT_TYPES.ROLLER:
            constrainedDOF.push(node.id * dofPerNode + 1);
            break;
          default:
            break;
        }
      });

      // Identify Free DOF
      const freeDOF = Array.from(Array(totalDOF).keys())
        .filter(i => !constrainedDOF.includes(i));

      // Extract Submatrices
      const Kff = subset(K, index(freeDOF, freeDOF));
      const Ff = subset(F, index(freeDOF));

      // Check matrix condition
      const detKff = det(Kff);
      if (Math.abs(detKff) < 1e-10) {
        throw new Error('Structure forms a mechanism. Add more members or supports to prevent rigid body motion.');
      }

      // Solve System
      const d = multiply(inv(Kff), Ff);

      // Construct Full Displacement Vector
      let fullDisplacements = zeros(totalDOF);
      freeDOF.forEach((dof, i) => {
        fullDisplacements = subset(fullDisplacements, index(dof), d[i]);
      });

      // Calculate Reactions
      const reactions = constrainedDOF.map(dof => ({
        dof,
        value: subset(multiply(K, fullDisplacements), index(dof))
      }));

      // Parse Results
      const displacements = nodes.map((_, i) => ({
        dx: subset(fullDisplacements, index(i * dofPerNode)),
        dy: subset(fullDisplacements, index(i * dofPerNode + 1))
      }));

      setResults({ displacements, reactions });
      
    } catch (err) {
      console.error('Calculation error:', err);
      setError('Calculation error: ' + err.message);
    }
  };

  return (
    <div className="frame-calculator">
      <h1>2D Frame Calculator</h1>
      {error && <div className="error-message">{error}</div>}

      <div className="manual-node-input">
        <h3>Add Node Manually</h3>
        <form onSubmit={handleManualNodeAdd}>
          <input
            type="number"
            step="0.5"
            placeholder="X coordinate"
            value={newNodeInput.x}
            onChange={(e) => setNewNodeInput(prev => ({ ...prev, x: e.target.value }))}
          />
          <input
            type="number"
            step="0.5"
            placeholder="Y coordinate"
            value={newNodeInput.y}
            onChange={(e) => setNewNodeInput(prev => ({ ...prev, y: e.target.value }))}
          />
          <button type="submit">Add Node</button>
        </form>
      </div>

      <div className="manual-load-input">
        <h3>Add Load Manually</h3>
        <form onSubmit={handleManualLoadAdd}>
          <input
            type="number"
            placeholder="Node ID"
            value={newLoadInput.nodeId}
            onChange={(e) => setNewLoadInput(prev => ({ ...prev, nodeId: e.target.value }))}
          />
          <input
            type="number"
            placeholder="Fx (N)"
            value={newLoadInput.fx}
            onChange={(e) => setNewLoadInput(prev => ({ ...prev, fx: e.target.value }))}
          />
          <input
            type="number"
            placeholder="Fy (N)"
            value={newLoadInput.fy}
            onChange={(e) => setNewLoadInput(prev => ({ ...prev, fy: e.target.value }))}
          />
          <button type="submit">Add Load</button>
        </form>
      </div>

      <div ref={canvasRef} className="canvas-container" />

      {contextMenu.show && (
        <div 
          className="context-menu"
          style={{
            position: 'fixed',
            top: contextMenu.y,
            left: contextMenu.x
          }}
        >
          <div className="support-options">
            <button onClick={() => {
              handleSupportChange(contextMenu.nodeId, SUPPORT_TYPES.FIXED);
              setContextMenu({ show: false, x: 0, y: 0, nodeId: null });
            }}>Set Fixed Support</button>
            <button onClick={() => {
              handleSupportChange(contextMenu.nodeId, SUPPORT_TYPES.PINNED);
              setContextMenu({ show: false, x: 0, y: 0, nodeId: null });
            }}>Set Pinned Support</button>
            <button onClick={() => {
              handleSupportChange(contextMenu.nodeId, SUPPORT_TYPES.ROLLER);
              setContextMenu({ show: false, x: 0, y: 0, nodeId: null });
            }}>Set Roller Support</button>
            <button onClick={() => {
              handleSupportChange(contextMenu.nodeId, SUPPORT_TYPES.NONE);
              setContextMenu({ show: false, x: 0, y: 0, nodeId: null });
            }}>Remove Support</button>
          </div>
        </div>
      )}

      {loads.length > 0 && (
        <div className="loads-display">
          <h3>Applied Loads</h3>
          <ul>
            {loads.map((load, index) => (
              <li key={index}>
                Node {load.nodeId}: Fx = {load.fx}N, Fy = {load.fy}N
                <button 
                  className="remove-load-btn"
                  onClick={() => setLoads(prev => prev.filter((_, i) => i !== index))}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="action-buttons">
        <button onClick={calculateFrame} className="calculate-button">
          Calculate
        </button>
        <button 
          onClick={() => {
            setNodes([]);
            setMembers([]);
            setSelectedNodes([]);
            setNodeSupports({});
            setLoads([]);
            setResults(null);
            setError('');
          }} 
          className="reset-button"
        >
          Reset
        </button>
      </div>

      {results && (
        <div className="results-section">
          <h2>Results</h2>
          <h3>Displacements</h3>
          <ul>
            {results.displacements.map((d, i) => (
              <li key={i}>
                Node {i}: dx = {d.dx.toFixed(6)}m, dy = {d.dy.toFixed(6)}m
              </li>
            ))}
          </ul>
          <h3>Reactions</h3>
          <ul>
            {results.reactions.map((r, i) => (
              <li key={i}>
                DOF {r.dof}: R = {r.value.toFixed(2)}N
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default FrameCalculator;