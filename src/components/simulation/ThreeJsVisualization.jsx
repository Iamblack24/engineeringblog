import React, { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { motion } from 'framer-motion';

const ThreeJsVisualization = ({ visualizationData, isLoading }) => {
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

    // Clean up any existing scene
    if (rendererRef.current && mountRef.current.contains(rendererRef.current.domElement)) {
      mountRef.current.removeChild(rendererRef.current.domElement);
    }

    sceneRef.current = new THREE.Scene();
    sceneRef.current.background = new THREE.Color(0x1a1a1a);

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;
    cameraRef.current = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    cameraRef.current.position.set(2, 2, 4);

    rendererRef.current = new THREE.WebGLRenderer({ antialias: true });
    rendererRef.current.setSize(width, height);
    rendererRef.current.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(rendererRef.current.domElement);

    controlsRef.current = new OrbitControls(cameraRef.current, rendererRef.current.domElement);
    controlsRef.current.enableDamping = true;

    // Enhanced lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(5, 5, 5);
    
    const backLight = new THREE.DirectionalLight(0xffffff, 0.5);
    backLight.position.set(-5, 5, -5);
    
    sceneRef.current.add(ambientLight, directionalLight, backLight);

    // Grid helper
    const gridHelper = new THREE.GridHelper(10, 10, 0x666666, 0x444444);
    sceneRef.current.add(gridHelper);

    // Add a default placeholder mesh if no visualization data yet
    if (!visualizationData) {
      const geometry = new THREE.SphereGeometry(1, 32, 32);
      const material = new THREE.MeshPhongMaterial({ 
        color: 0x3498db,
        transparent: true,
        opacity: 0.7,
        wireframe: true
      });
      meshRef.current = new THREE.Mesh(geometry, material);
      sceneRef.current.add(meshRef.current);
    }

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (rendererRef.current && mountRef.current.contains(rendererRef.current.domElement)) {
        mountRef.current.removeChild(rendererRef.current.domElement);
      }
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
    };
  }, [animate, visualizationData]);

  // Update visualization based on new data
  const updateVisualization = useCallback(() => {
    if (!visualizationData?.data || !sceneRef.current) return;

    try {
      // Clear existing mesh
      if (meshRef.current) {
        sceneRef.current.remove(meshRef.current);
        meshRef.current.geometry.dispose();
        meshRef.current.material.dispose();
      }

      const { vertices, indices, color, opacity } = visualizationData.data;

      // Create new geometry
      const geometry = new THREE.BufferGeometry();
      
      const vertexArray = new Float32Array(vertices);
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertexArray, 3));
      
      if (indices && indices.length > 0) {
        geometry.setIndex(new THREE.Uint16BufferAttribute(indices, 1));
      }

      geometry.computeVertexNormals();
      geometry.computeBoundingBox();
      
      const boundingBox = geometry.boundingBox;
      const center = new THREE.Vector3();
      boundingBox.getCenter(center);
      
      // Create material
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
      meshRef.current.position.sub(center);
      sceneRef.current.add(meshRef.current);

      // Update camera to frame the mesh
      const box = new THREE.Box3().setFromObject(meshRef.current);
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      
      if (cameraRef.current) {
        cameraRef.current.position.set(maxDim * 2, maxDim * 2, maxDim * 2);
        cameraRef.current.lookAt(0, 0, 0);
        
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
    }
  }, [visualizationData]);

  // Initialize Three.js on mount
  useEffect(() => {
    const cleanup = initThreeJS();
    return cleanup;
  }, [initThreeJS]);

  // Update visualization when data changes
  useEffect(() => {
    if (visualizationData) {
      updateVisualization();
    }
  }, [visualizationData, updateVisualization]);

  // Add resize handler
  useEffect(() => {
    const handleResize = () => {
      if (mountRef.current && rendererRef.current && cameraRef.current) {
        const width = mountRef.current.clientWidth;
        const height = mountRef.current.clientHeight;
        
        rendererRef.current.setSize(width, height);
        cameraRef.current.aspect = width / height;
        cameraRef.current.updateProjectionMatrix();
        
        // Force a render
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="visualization-container bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="text-xl font-semibold">Simulation Visualization</h2>
        
        <div className="visualization-controls flex items-center space-x-2">
          <button 
            className="p-2 rounded-full hover:bg-gray-100 transition-colors" 
            title="Reset Camera"
            onClick={() => {
              if (cameraRef.current && controlsRef.current) {
                cameraRef.current.position.set(2, 2, 4);
                controlsRef.current.target.set(0, 0, 0);
                controlsRef.current.update();
              }
            }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <button 
            className="p-2 rounded-full hover:bg-gray-100 transition-colors" 
            title="Fullscreen"
            onClick={() => {
              const elem = mountRef.current;
              if (elem.requestFullscreen) {
                elem.requestFullscreen();
              } else if (elem.webkitRequestFullscreen) {
                elem.webkitRequestFullscreen();
              } else if (elem.msRequestFullscreen) {
                elem.msRequestFullscreen();
              }
            }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
            </svg>
          </button>
        </div>
      </div>
      <div className="relative">
        <div 
          ref={mountRef} 
          className="w-full h-96 rounded overflow-hidden bg-gray-900"
          style={{ minHeight: '400px' }}
        />
        
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-70">
            <div className="text-center">
              <svg className="inline w-12 h-12 animate-spin text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="mt-3 text-white text-sm">Generating visualization...</p>
            </div>
          </div>
        )}
        
        <motion.div 
          className="absolute bottom-4 left-4 right-4 bg-black bg-opacity-70 text-white p-3 rounded text-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
        >
          <p>
            <b>Controls:</b> Click and drag to rotate. Scroll to zoom. Right-click and drag to pan.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default ThreeJsVisualization;