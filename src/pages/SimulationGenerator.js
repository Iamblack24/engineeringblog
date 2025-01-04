import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import './SimulationGenerator.css';

const SimulationGenerator = () => {
  const [simulationType, setSimulationType] = useState('load-distribution');
  const [parameters, setParameters] = useState({
    material: 'steel',
    geometry: {
      radius: 0.5,
      length: 2,
    },
    load: {
      value: 1000,
    },
  });
  const [loading, setLoading] = useState(false);
  const [aiInsights, setAiInsights] = useState('');
  const [error, setError] = useState('');
  const mountRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const animationFrameRef = useRef(null);
  const meshRef = useRef(null);

  // Animation loop
  const animate = useCallback(() => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;

    animationFrameRef.current = requestAnimationFrame(animate);
    controlsRef.current?.update();
    rendererRef.current.render(sceneRef.current, cameraRef.current);
  }, []);

  // Initialize Three.js scene
  const initThreeJS = useCallback(() => {
    if (!mountRef.current) return;

    sceneRef.current = new THREE.Scene();
    sceneRef.current.background = new THREE.Color(0x1a1a1a); // Dark background

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;
    cameraRef.current = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    cameraRef.current.position.set(2, 2, 4);

    rendererRef.current = new THREE.WebGLRenderer({ antialias: true });
    rendererRef.current.setSize(width, height);
    rendererRef.current.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(rendererRef.current.domElement);

    controlsRef.current = new OrbitControls(cameraRef.current, rendererRef.current.domElement);
    controlsRef.current.enableDamping = true;

    // Enhanced lighting for better visibility
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8); // Increased intensity
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0); // Increased intensity
    directionalLight.position.set(5, 5, 5);
    
    // Add additional lights for better visibility
    const backLight = new THREE.DirectionalLight(0xffffff, 0.5);
    backLight.position.set(-5, 5, -5);
    
    sceneRef.current.add(ambientLight, directionalLight, backLight);

    // Update grid helper for better visibility
    const gridHelper = new THREE.GridHelper(10, 10, 0x666666, 0x444444);
    sceneRef.current.add(gridHelper);

    animate();

    return () => {
      if (mountRef.current && rendererRef.current) {
        mountRef.current.removeChild(rendererRef.current.domElement);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
      sceneRef.current = null;
      cameraRef.current = null;
      controlsRef.current = null;
    };
  }, [animate]);

  // Update visualization based on simulation results
  const updateVisualization = useCallback((visualizationData) => {
    if (!visualizationData?.data || !sceneRef.current) {
      throw new Error('Invalid visualization data structure or scene not initialized');
    }

    try {
      // Clear existing mesh
      if (meshRef.current) {
        sceneRef.current.remove(meshRef.current);
        meshRef.current.geometry.dispose();
        meshRef.current.material.dispose();
      }

      const { vertices, indices, color, opacity } = visualizationData.data;

      // Create new geometry with validated vertices
      const geometry = new THREE.BufferGeometry();
      
      // Ensure vertices are in the correct format
      const vertexArray = new Float32Array(vertices);
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertexArray, 3));
      
      // Add indices if they exist
      if (indices && indices.length > 0) {
        geometry.setIndex(new THREE.Uint16BufferAttribute(indices, 1));
      }

      // Compute vertex normals for proper lighting
      geometry.computeVertexNormals();

      // Calculate bounding box and center geometry
      geometry.computeBoundingBox();
      const boundingBox = geometry.boundingBox;
      const center = new THREE.Vector3();
      boundingBox.getCenter(center);
      
      // Create material with enhanced settings
      const material = new THREE.MeshPhongMaterial({
        color: color || 0x00ff00,
        opacity: opacity || 1.0,
        transparent: opacity !== 1.0,
        side: THREE.DoubleSide,
        flatShading: false,
        shininess: 30
      });

      // Create and add mesh
      meshRef.current = new THREE.Mesh(geometry, material);
      
      // Center the mesh
      meshRef.current.position.sub(center);
      
      // Add to scene
      sceneRef.current.add(meshRef.current);

      // Update camera to frame the mesh
      const box = new THREE.Box3().setFromObject(meshRef.current);
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      
      if (cameraRef.current) {
        cameraRef.current.position.set(maxDim * 2, maxDim * 2, maxDim * 2);
        cameraRef.current.lookAt(0, 0, 0);
        
        // Update controls target
        if (controlsRef.current) {
          controlsRef.current.target.set(0, 0, 0);
          controlsRef.current.update();
        }
      }

      // Force a render
      if (rendererRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    } catch (error) {
      console.error('Error in visualization update:', error);
      throw new Error(`Failed to update visualization: ${error.message}`);
    }
  }, []);

  // Handle simulation submission
  const handleSimulate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setAiInsights('');

    try {
      const response = await axios.post('https://flashcards-2iat.onrender.com/simulationgenerator/simulate', {
        simulationType,
        parameters,
      });

      const { data } = response;

      if (!data.success) {
        throw new Error(data.error || 'Invalid response from server');
      }

      console.log('Response Data:', data);

      if (data.data.visualizationData) {
        updateVisualization(data.data.visualizationData);
      }

      if (data.data.simulationResults) {
        setAiInsights(data.data.simulationResults);
      }
    } catch (err) {
      console.error('Simulation error:', err);
      setError(`Simulation failed: ${err.message || 'Please check your inputs and try again.'}`);
    } finally {
      setLoading(false);
    }
  };

  // Initialize Three.js on mount
  useEffect(() => {
    const cleanup = initThreeJS();
    return () => {
      if (cleanup) cleanup();
      if (meshRef.current) {
        meshRef.current.geometry.dispose();
        meshRef.current.material.dispose();
        meshRef.current = null;
      }
    };
  }, [initThreeJS]);

  // Add resize handler effect
  useEffect(() => {
    const handleResize = () => {
      if (mountRef.current && rendererRef.current && cameraRef.current) {
        const width = mountRef.current.clientWidth;
        const height = mountRef.current.clientHeight;
        
        rendererRef.current.setSize(width, height);
        cameraRef.current.aspect = width / height;
        cameraRef.current.updateProjectionMatrix();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Dynamic form inputs based on simulation type
  let formInputs;
  switch (simulationType) {
    case 'load-distribution':
      formInputs = (
        <>
          <div className="space-y-2">
            <label className="text-sm font-medium">Material</label>
            <input
              type="text"
              value={parameters.material}
              onChange={(e) => setParameters({ ...parameters, material: e.target.value })}
              placeholder="e.g., Steel"
              className="w-full p-2 border rounded"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Radius (m)</label>
              <input
                type="number"
                value={parameters.geometry.radius}
                onChange={(e) =>
                  setParameters({
                    ...parameters,
                    geometry: { ...parameters.geometry, radius: parseFloat(e.target.value) },
                  })
                }
                placeholder="0.5"
                className="w-full p-2 border rounded"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Length (m)</label>
              <input
                type="number"
                value={parameters.geometry.length}
                onChange={(e) =>
                  setParameters({
                    ...parameters,
                    geometry: { ...parameters.geometry, length: parseFloat(e.target.value) },
                  })
                }
                placeholder="2"
                className="w-full p-2 border rounded"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Load Value (N)</label>
            <input
              type="number"
              value={parameters.load.value}
              onChange={(e) =>
                setParameters({
                  ...parameters,
                  load: { value: parseFloat(e.target.value) },
                })
              }
              placeholder="1000"
              className="w-full p-2 border rounded"
            />
          </div>
        </>
      );
      break;
    case 'fluid-dynamics':
      formInputs = (
        <>
          <div className="space-y-2">
            <label className="text-sm font-medium">Fluid Properties</label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Velocity (m/s)</label>
                <input
                  type="number"
                  value={parameters.fluidProperties?.velocity || 1}
                  onChange={(e) =>
                    setParameters({
                      ...parameters,
                      fluidProperties: {
                        ...parameters.fluidProperties,
                        velocity: parseFloat(e.target.value),
                      },
                    })
                  }
                  placeholder="1"
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Density (kg/m³)</label>
                <input
                  type="number"
                  value={parameters.fluidProperties?.density || 1000}
                  onChange={(e) =>
                    setParameters({
                      ...parameters,
                      fluidProperties: {
                        ...parameters.fluidProperties,
                        density: parseFloat(e.target.value),
                      },
                    })
                  }
                  placeholder="1000"
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Viscosity (Pa·s)</label>
                <input
                  type="number"
                  value={parameters.fluidProperties?.viscosity || 0.001}
                  onChange={(e) =>
                    setParameters({
                      ...parameters,
                      fluidProperties: {
                        ...parameters.fluidProperties,
                        viscosity: parseFloat(e.target.value),
                      },
                    })
                  }
                  placeholder="0.001"
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Pipe Geometry</label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Radius (m)</label>
                <input
                  type="number"
                  value={parameters.geometry.radius || 0.5}
                  onChange={(e) =>
                    setParameters({
                      ...parameters,
                      geometry: { ...parameters.geometry, radius: parseFloat(e.target.value) },
                    })
                  }
                  placeholder="0.5"
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Length (m)</label>
                <input
                  type="number"
                  value={parameters.geometry.length || 2}
                  onChange={(e) =>
                    setParameters({
                      ...parameters,
                      geometry: { ...parameters.geometry, length: parseFloat(e.target.value) },
                    })
                  }
                  placeholder="2"
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>
          </div>
        </>
      );
      break;
    case 'stress-analysis':
      formInputs = (
        <>
          <div className="space-y-2">
            <label className="text-sm font-medium">Material</label>
            <input
              type="text"
              value={parameters.material}
              onChange={(e) => setParameters({ ...parameters, material: e.target.value })}
              placeholder="e.g., Steel"
              className="w-full p-2 border rounded"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Radius (m)</label>
              <input
                type="number"
                value={parameters.geometry.radius || 0.5}
                onChange={(e) =>
                  setParameters({
                    ...parameters,
                    geometry: { ...parameters.geometry, radius: parseFloat(e.target.value) },
                  })
                }
                placeholder="0.5"
                className="w-full p-2 border rounded"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Length (m)</label>
              <input
                type="number"
                value={parameters.geometry.length || 2}
                onChange={(e) =>
                  setParameters({
                    ...parameters,
                    geometry: { ...parameters.geometry, length: parseFloat(e.target.value) },
                  })
                }
                placeholder="2"
                className="w-full p-2 border rounded"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Load Value (N)</label>
            <input
              type="number"
              value={parameters.load.value || 1000}
              onChange={(e) =>
                setParameters({
                  ...parameters,
                  load: { value: parseFloat(e.target.value) },
                })
              }
              placeholder="1000"
              className="w-full p-2 border rounded"
            />
          </div>
        </>
      );
      break;
    default:
      formInputs = null;
  }

  return (
    <div className="flex flex-col gap-4 w-full max-w-6xl mx-auto p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-4 border-b">
            <h2 className="text-xl font-semibold">Simulation Parameters</h2>
          </div>
          <div className="p-4">
            <form onSubmit={handleSimulate} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Simulation Type</label>
                <select
                  value={simulationType}
                  onChange={(e) => setSimulationType(e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  <option value="load-distribution">Load Distribution</option>
                  <option value="fluid-dynamics">Fluid Dynamics</option>
                  <option value="stress-analysis">Stress Analysis</option>
                </select>
              </div>
              {formInputs}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:bg-blue-300"
              >
                {loading ? 'Simulating...' : 'Run Simulation'}
              </button>
            </form>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-4 border-b">
            <h2 className="text-xl font-semibold">Simulation Visualization</h2>
          </div>
          <div className="p-4">
            <div ref={mountRef} className="w-full h-64 rounded overflow-hidden" style={{minHeight: '400px'}} />
          </div>
        </div>
      </div>
      {aiInsights && (
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-4 border-b">
            <h2 className="text-xl font-semibold">Analysis Results</h2>
          </div>
          <div className="p-4">
            <ReactMarkdown>{aiInsights}</ReactMarkdown>
          </div>
        </div>
      )}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
    </div>
  );
};

export default SimulationGenerator;