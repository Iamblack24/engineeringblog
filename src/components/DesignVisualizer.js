// DesignVisualizer.js
import React, { useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { Line } from 'react-chartjs-2';
import * as THREE from 'three';
import './DesignVisualizer.css';



const DesignVisualizer = ({ 
  designType, 
  parameters, 
  optimizationResult,
  originalDesign 
}) => {
  const [viewMode, setViewMode] = useState('3d');
  const [showControls, setShowControls] = useState(true);
  // Add at the start of the DesignVisualizer component
  console.log('Design Type:', designType);
  console.log('Optimization Result:', optimizationResult);
  // Extract data directly from optimizationResult
  const {
    dimensions,
    analysis,
    materials,
    costs,
    safety,
    numericalData
  } = optimizationResult || {};

  // Render dimensions section
  const renderDimensions = () => {
    if (!dimensions) return null;
    return (
      <div className="data-section">
        <h3>Dimensions</h3>
        <div className="data-grid">
          {Object.entries(dimensions).map(([key, value]) => (
            <div key={key} className="data-item">
              <span className="label">{key.charAt(0).toUpperCase() + key.slice(1)}:</span>
              <span className="value">{value} m</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Add this helper function for truss member forces
  const renderMemberForces = (memberForces) => {
    if (!memberForces) return null;
    
    return (
      <div className="member-forces">
        <h4>Member Forces</h4>
        <div className="forces-grid">
          {Object.entries(memberForces).map(([member, forces]) => (
            <div key={member} className="force-item">
              <strong>Member {member}:</strong>
              <div className="force-details">
                <span>Compression: {forces.compression.toFixed(2)} kN</span>
                <span>Tension: {forces.tension.toFixed(2)} kN</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Update the analysis section for trusses
  const renderAnalysis = () => {
    if (!analysis) return null;
    
    return (
      <div className="data-section">
        <h3>Analysis Results</h3>
        <div className="data-grid">
          {Object.entries(analysis).map(([key, value]) => {
            // Handle object values (like member forces)
            if (typeof value === 'object' && value !== null) {
              return renderMemberForces({ [key]: value });
            }
            // Handle regular numeric values
            return (
              <div key={key} className="data-item">
                <span className="label">{key.charAt(0).toUpperCase() + key.slice(1)}:</span>
                <span className="value">
                  {typeof value === 'number' ? value.toFixed(2) : value}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Render materials section
  const renderMaterials = () => {
    if (!materials) return null;
    return (
      <div className="data-section">
        <h3>Materials</h3>
        <div className="data-grid">
          <div className="data-item">
            <span className="label">Usage:</span>
            <span className="value">{materials.usage * 100}%</span>
          </div>
          {materials.concrete && (
            <div className="data-item">
              <span className="label">Concrete Grade:</span>
              <span className="value">{materials.concrete.grade}</span>
            </div>
          )}
          {materials.steel && (
            <div className="data-item">
              <span className="label">Steel Grade:</span>
              <span className="value">{materials.steel.grade}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render costs section
  const renderCosts = () => {
    if (!costs) return null;
    return (
      <div className="data-section">
        <h3>Cost Breakdown</h3>
        <div className="data-grid">
          {Object.entries(costs).map(([key, value]) => (
            <div key={key} className="data-item">
              <span className="label">{key.charAt(0).toUpperCase() + key.slice(1)}:</span>
              <span className="value">${value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render safety factors
  const renderSafety = () => {
    if (!safety) return null;
    return (
      <div className="data-section">
        <h3>Safety Factors</h3>
        <div className="data-grid">
          {Object.entries(safety).map(([key, value]) => (
            <div key={key} className="data-item">
              <span className="label">{key.charAt(0).toUpperCase() + key.slice(1)}:</span>
              <span className="value">{value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Performance chart data
  const formatPerformanceData = (optimizationResult) => {
    return {
      labels: ['Cost Efficiency', 'Structural Safety', 'Material Usage', 'Environmental Impact'],
      datasets: [
        {
          label: 'Original Design',
          data: [70, 85, 75, 65], // Example baseline values
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 2,
          fill: true
        },
        {
          label: 'Optimized Design',
          data: [
            (1 - optimizationResult.costs.total / 100000) * 100, // Cost efficiency
            optimizationResult.safety.factor * 40, // Safety factor normalized
            optimizationResult.materials.usage * 100, // Material usage
            85 // Example environmental score
          ],
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 2,
          fill: true
        }
      ]
    };
  };

  // 3D Model Components
  const BeamModel = ({ data }) => {
    const mesh = useRef();
    if (!data?.dimensions) {
      console.log('No beam dimensions available');
      return null;
    }
    
    const { span, depth, width } = data.dimensions;
    return (
      <mesh ref={mesh} position={[0, depth/2, 0]}>
        <boxGeometry args={[span || 5, depth || 0.5, width || 0.3]} />
        <meshStandardMaterial color="#cccccc" />
      </mesh>
    );
  };

  const TrussModel = ({ dimensions }) => {
    const { span = 10, height = 3 } = dimensions;
    const depth = span * 0.1;
    const numPanels = Math.ceil(span / 2);
    const panelLength = span / numPanels;

    // Generate nodes
    const nodes = [];
    
    // Top chord nodes
    for (let i = 0; i <= numPanels; i++) {
      nodes.push({ x: i * panelLength, y: height, z: depth/2 }); // Front
      nodes.push({ x: i * panelLength, y: height, z: -depth/2 }); // Back
    }

    // Bottom chord nodes
    for (let i = 0; i <= numPanels; i++) {
      nodes.push({ x: i * panelLength, y: 0, z: depth/2 }); // Front
      nodes.push({ x: i * panelLength, y: 0, z: -depth/2 }); // Back
    }

    // Generate members
    const members = [];
    const bottomStart = (numPanels + 1) * 2;

    // Top chord members
    for (let i = 0; i < numPanels; i++) {
      members.push({
        start: nodes[i * 2],
        end: nodes[(i + 1) * 2],
        color: '#2196F3' // Blue
      });
      members.push({
        start: nodes[i * 2 + 1],
        end: nodes[(i + 1) * 2 + 1],
        color: '#2196F3'
      });
    }

    // Bottom chord members
    for (let i = 0; i < numPanels; i++) {
      members.push({
        start: nodes[bottomStart + i * 2],
        end: nodes[bottomStart + (i + 1) * 2],
        color: '#4CAF50' // Green
      });
      members.push({
        start: nodes[bottomStart + i * 2 + 1],
        end: nodes[bottomStart + (i + 1) * 2 + 1],
        color: '#4CAF50'
      });
    }

    // Web members
    for (let i = 0; i <= numPanels; i++) {
      // Verticals
      members.push({
        start: nodes[i * 2],
        end: nodes[bottomStart + i * 2],
        color: '#FFC107' // Yellow
      });
      members.push({
        start: nodes[i * 2 + 1],
        end: nodes[bottomStart + i * 2 + 1],
        color: '#FFC107'
      });

      // Diagonals (except last panel)
      if (i < numPanels) {
        members.push({
          start: nodes[i * 2],
          end: nodes[bottomStart + (i + 1) * 2],
          color: '#FF5722' // Orange
        });
        members.push({
          start: nodes[i * 2 + 1],
          end: nodes[bottomStart + (i + 1) * 2 + 1],
          color: '#FF5722'
        });
      }
    }

    return (
      <group>
        {members.map((member, index) => {
          const start = new THREE.Vector3(member.start.x, member.start.y, member.start.z);
          const end = new THREE.Vector3(member.end.x, member.end.y, member.end.z);
          const direction = end.clone().sub(start);
          const length = direction.length();
          
          // Calculate center position and rotation
          const center = start.clone().add(end).multiplyScalar(0.5);
          const quaternion = new THREE.Quaternion();
          quaternion.setFromUnitVectors(
            new THREE.Vector3(0, 1, 0),
            direction.normalize()
          );

          return (
            <group key={index} position={[center.x, center.y, center.z]} quaternion={quaternion}>
              <mesh>
                <cylinderGeometry args={[0.05, 0.05, length, 8]} />
                <meshStandardMaterial color={member.color} />
              </mesh>
            </group>
          );
        })}

        {nodes.map((node, index) => (
          <mesh key={`node-${index}`} position={[node.x, node.y, node.z]}>
            <sphereGeometry args={[0.08, 16, 16]} />
            <meshStandardMaterial color="#000000" />
          </mesh>
        ))}
      </group>
    );
  };

  const FoundationModel = ({ data }) => {
    if (!data?.dimensions) return null;
    const { length, width, depth } = data.dimensions;

    return (
      <group>
        <mesh position={[0, -depth/2, 0]}>
          <boxGeometry args={[length || 5, depth || 1, width || 5]} />
          <meshStandardMaterial color="#999999" />
        </mesh>
        <mesh position={[0, -depth-0.01, 0]} rotation={[-Math.PI/2, 0, 0]}>
          <planeGeometry args={[length*1.5 || 7.5, width*1.5 || 7.5]} />
          <meshStandardMaterial color="#8B4513" />
        </mesh>
      </group>
    );
  };

  // Main render function
  const renderDesignModel = () => {
    if (!optimizationResult?.dimensions) {
      console.log('No dimensions data available');
      return null;
    }

    switch (designType) {
      case 'beam':
        return (
          <>
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1} />
            <BeamModel data={optimizationResult} />
            <gridHelper args={[20, 20]} />
            <OrbitControls />
          </>
        );
        
      case 'truss':
        return (
          <>
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1} />
            <TrussModel dimensions={optimizationResult.dimensions} />
            <gridHelper args={[20, 20]} />
            <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
          </>
        );
        
      case 'foundation':
        return (
          <>
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1} />
            <FoundationModel data={optimizationResult} />
            <gridHelper args={[20, 20]} />
            <OrbitControls />
          </>
        );
        
      default:
        return null;
    }
  };

  // Add this after your existing render functions
  const renderNumericalData = () => {
    if (!numericalData) return null;
    
    return (
      <div className="data-section">
        <h3>Numerical Analysis</h3>
        
        {/* Soil Pressure Distribution */}
        {numericalData.soilPressure && (
          <div className="numerical-subsection">
            <h4>Soil Pressure Distribution</h4>
            <div className="pressure-chart">
              {numericalData.soilPressure.map((point, index) => (
                <div key={index} className="pressure-point">
                  <span>Position: {point.x}m</span>
                  <span>Pressure: {point.pressure} kPa</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reinforcement Details */}
        {numericalData.reinforcement && (
          <div className="numerical-subsection">
            <h4>Reinforcement Details</h4>
            <div className="reinforcement-grid">
              <div className="reinforcement-item">
                <h5>Top Mesh</h5>
                <p>Size: Φ{numericalData.reinforcement.topMesh.size}mm</p>
                <p>Spacing: {numericalData.reinforcement.topMesh.spacing}mm</p>
              </div>
              <div className="reinforcement-item">
                <h5>Bottom Mesh</h5>
                <p>Size: Φ{numericalData.reinforcement.bottomMesh.size}mm</p>
                <p>Spacing: {numericalData.reinforcement.bottomMesh.spacing}mm</p>
              </div>
              <div className="reinforcement-item">
                <h5>Edge Reinforcement</h5>
                <p>Size: Φ{numericalData.reinforcement.edges.size}mm</p>
                <p>Spacing: {numericalData.reinforcement.edges.spacing}mm</p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="design-visualizer">
      <div className="data-sections">
        {renderDimensions()}
        {renderAnalysis()}
        {renderMaterials()}
        {renderCosts()}
        {renderSafety()}
        {renderNumericalData()}
      </div>

      <div className="view-controls">
        <button onClick={() => setViewMode('3d')}>3D View</button>
        <button onClick={() => setViewMode('comparison')}>Comparison</button>
        <button onClick={() => setViewMode('performance')}>Performance</button>
      </div>

      {viewMode === '3d' && (
        <div className="visualization-container">
          <Canvas
            camera={{ 
              position: [10, 5, 10], 
              fov: 50 
            }}
            style={{ 
              background: '#f0f0f0',
              height: '500px',
              width: '100%' // Add explicit width
            }}
          >
            <color attach="background" args={['#f0f0f0']} />
            {renderDesignModel()}
          </Canvas>
        </div>
      )}

      {viewMode === 'comparison' && (
        <>
          <div className="comparison-view">
            <div className="original-design">
              <Canvas>
                <PerspectiveCamera makeDefault position={[5, 5, 5]} />
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} />
                {/* Render original design */}
                {renderDesignModel(originalDesign)}
                <OrbitControls />
              </Canvas>
            </div>
            <div className="optimized-design">
              <Canvas>
                <PerspectiveCamera makeDefault position={[5, 5, 5]} />
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} />
                {/* Render optimized design */}
                {renderDesignModel(optimizationResult)}
                <OrbitControls />
              </Canvas>
            </div>
          </div>
          
          {/* Add comparison metrics */}
          <div className="comparison-metrics">
            <h3>Design Improvements</h3>
            <div className="metric-difference">
              <span>Cost Reduction:</span>
              <span className="improvement">
                {((originalDesign?.costs?.total - optimizationResult?.costs?.total) / 
                  originalDesign?.costs?.total * 100).toFixed(1)}%
              </span>
            </div>
            <div className="metric-difference">
              <span>Material Efficiency:</span>
              <span className="improvement">
                {((optimizationResult?.materials?.usage - originalDesign?.materials?.usage) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="metric-difference">
              <span>Safety Factor:</span>
              <span className={optimizationResult?.safety?.factor > originalDesign?.safety?.factor ? 
                "improvement" : "decline"}>
                {((optimizationResult?.safety?.factor - originalDesign?.safety?.factor) * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </>
      )}

      {viewMode === 'performance' && (
        <div className="performance-charts">
          <div className="chart-container">
            <h3>Design Performance Comparison</h3>
            <div className="chart-wrapper">
              <Line 
                data={formatPerformanceData(optimizationResult)}
                options={{
                  responsive: true,
                  scales: {
                    r: {
                      min: 0,
                      max: 100,
                      beginAtZero: true,
                      ticks: {
                        stepSize: 20,
                        color: '#000000',
                        font: {
                          size: 12
                        }
                      },
                      grid: {
                        color: '#ddd'
                      },
                      pointLabels: {
                        color: '#000000',
                        font: {
                          size: 14,
                          weight: 'bold'
                        }
                      }
                    }
                  },
                  plugins: {
                    legend: {
                      position: 'top',
                      labels: {
                        color: '#000000',
                        font: {
                          size: 14
                        },
                        padding: 20
                      }
                    },
                    tooltip: {
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      titleColor: '#000000',
                      bodyColor: '#000000',
                      borderColor: '#ddd',
                      borderWidth: 1,
                      padding: 10,
                      callbacks: {
                        label: function(context) {
                          return `${context.dataset.label}: ${context.parsed.y.toFixed(1)}%`;
                        }
                      }
                    }
                  }
                }}
              />
            </div>
            <div className="performance-metrics">
              <div className="metric">
                <h4>Cost Efficiency</h4>
                <p>Measures the cost optimization achieved compared to standard designs</p>
              </div>
              <div className="metric">
                <h4>Structural Safety</h4>
                <p>Indicates the overall safety factor and structural reliability</p>
              </div>
              <div className="metric">
                <h4>Material Usage</h4>
                <p>Shows the efficiency of material utilization</p>
              </div>
              <div className="metric">
                <h4>Environmental Impact</h4>
                <p>Represents the environmental sustainability score</p>
              </div>
            </div>
          </div>

          
            
        </div>
      )}

      <div className="additional-controls">
        <button onClick={() => setShowControls(!showControls)}>
          {showControls ? 'Lock View' : 'Unlock View'}
        </button>
      </div>

      {/* Add some basic styling */}
      
    </div>
  );
};

export default DesignVisualizer;