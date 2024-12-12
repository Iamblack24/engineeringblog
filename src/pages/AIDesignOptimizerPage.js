import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import './AIDesignOptimizerPage.css';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const AIDesignOptimizerPage = () => {
  // State management
  const [selectedDesignType, setSelectedDesignType] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState(null);
  const [formInputs, setFormInputs] = useState({});
  const [error, setError] = useState(null);

  // Design type definitions
  const designTypes = [
    {
      id: 'beam',
      title: 'Beam Design',
      icon: '🏗️',
      description: 'Optimize beam designs for maximum efficiency and cost-effectiveness',
      inputs: [
        { id: 'span', label: 'Span Length (m)', type: 'number', min: 1, max: 30, required: true },
        { id: 'load', label: 'Design Load (kN/m)', type: 'number', min: 0.5, max: 50, required: true },
        { id: 'material', label: 'Material Type', type: 'select', required: true,
          options: ['Reinforced Concrete', 'Steel', 'Timber'] },
        { id: 'support', label: 'Support Conditions', type: 'select', required: true,
          options: ['Simply Supported', 'Fixed-Fixed', 'Cantilever'] }
      ]
    },
    {
      id: 'truss',
      title: 'Truss Design',
      icon: '🌉',
      description: 'Generate optimized truss configurations for your structural needs',
      inputs: [
        { id: 'span', label: 'Total Span (m)', type: 'number', min: 6, max: 100, required: true },
        { id: 'height', label: 'Truss Height (m)', type: 'number', min: 1, max: 15, required: true },
        { id: 'loadType', label: 'Load Type', type: 'select', required: true,
          options: ['Roof Load', 'Bridge Load', 'Solar Panel Support'] },
        { id: 'material', label: 'Material', type: 'select', required: true,
          options: ['Steel', 'Aluminum', 'Timber'] }
      ]
    },
    {
      id: 'foundation',
      title: 'Foundation Design',
      icon: '🏗️',
      description: 'Optimize foundation designs based on soil conditions and loads',
      inputs: [
        { id: 'load', label: 'Column Load (kN)', type: 'number', min: 100, max: 5000, required: true },
        { id: 'soilCapacity', label: 'Soil Bearing Capacity (kN/m²)', type: 'number', min: 50, max: 1000, required: true },
        { id: 'soilType', label: 'Soil Type', type: 'select', required: true,
          options: ['Clay', 'Sand', 'Rock', 'Mixed'] },
        { id: 'depth', label: 'Required Depth (m)', type: 'number', min: 0.5, max: 5, required: true }
      ]
    }
  ];

  // Input handlers
  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormInputs(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value
    }));
  };

  const handleDesignTypeSelect = (type) => {
    setSelectedDesignType(type);
    setFormInputs({});
    setOptimizationResult(null);
    setError(null);
  };

  // Form validation
  const validateForm = () => {
    if (!selectedDesignType) {
      setError('Please select a design type');
      return false;
    }

    const missingInputs = selectedDesignType.inputs.filter(
      input => !formInputs[input.id] && input.required
    );

    if (missingInputs.length > 0) {
      setError(`Please fill in all required fields: ${missingInputs.map(i => i.label).join(', ')}`);
      return false;
    }

    return true;
  };
  // Optimization handler
  const handleOptimize = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('https://flashcards-2iat.onrender.com/api/optimize-design', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          designType: selectedDesignType.id,
          parameters: formInputs
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Optimization failed');
      }

      const result = await response.json();
      setOptimizationResult(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 2D Visualization Components
  const BeamVisualization = ({ designData }) => {
    if (!designData?.numericalData?.dimensions) {
      return <div>No visualization data available</div>;
    }

    const { span, depth = 0.6 } = designData.numericalData.dimensions;
    
    return (
      <div className="beam-visualization">
        <svg width="100%" height="200" viewBox={`0 0 ${span * 50} 200`}>
          {/* Beam body */}
          <rect
            x="0"
            y="80"
            width={span * 50}
            height={depth * 50}
            fill="#ccc"
            stroke="#666"
          />
          
          {/* Supports */}
          {formInputs.support === 'Simply Supported' && (
            <>
              <polygon points="0,160 20,140 -20,140" fill="#666"/>
              <polygon points={`${span * 50},160 ${span * 50 + 20},140 ${span * 50 - 20},140`} fill="#666"/>
            </>
          )}
          
          {formInputs.support === 'Fixed-Fixed' && (
            <>
              <rect x="-10" y="60" width="10" height="100" fill="#666"/>
              <rect x={span * 50} y="60" width="10" height="100" fill="#666"/>
            </>
          )}
          
          {formInputs.support === 'Cantilever' && (
            <rect x="-10" y="60" width="10" height="100" fill="#666"/>
          )}

          {/* Load arrows */}
          {Array.from({ length: Math.floor(span) }).map((_, i) => (
            <path
              key={i}
              d={`M${(i + 0.5) * 50},40 L${(i + 0.5) * 50},80`}
              stroke="#f00"
              markerEnd="url(#arrowhead)"
            />
          ))}
          
          {/* Arrow marker definition */}
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="#f00"/>
            </marker>
          </defs>
        </svg>
      </div>
    );
  };

  const TrussVisualization = ({ designData }) => {
    if (!designData?.numericalData?.dimensions) {
      return <div>No visualization data available</div>;
    }

    const { span } = designData.numericalData.dimensions;
    const numPanels = Math.floor(span / 3); // Assuming 3m panel length
    const panelWidth = (span * 50) / numPanels;

    const generateTrussPoints = () => {
      const points = {
        top: [],
        bottom: [],
        web: []
      };

      // Generate top and bottom chord points
      for (let i = 0; i <= numPanels; i++) {
        points.top.push({ x: i * panelWidth, y: 50 });
        points.bottom.push({ x: i * panelWidth, y: 150 });
      }

      // Generate web members
      for (let i = 0; i < numPanels; i++) {
        points.web.push({
          start: points.bottom[i],
          end: points.top[i + 1]
        });
        points.web.push({
          start: points.bottom[i],
          end: points.top[i]
        });
      }

      return points;
    };

    const trussPoints = generateTrussPoints();

    return (
      <div className="truss-visualization">
        <svg width="100%" height="200" viewBox={`0 0 ${span * 50} 200`}>
          {/* Draw top chord */}
          {trussPoints.top.map((point, i, arr) => {
            if (i === arr.length - 1) return null;
            return (
              <line
                key={`top-${i}`}
                x1={point.x}
                y1={point.y}
                x2={arr[i + 1].x}
                y2={arr[i + 1].y}
                stroke="#666"
                strokeWidth="2"
              />
            );
          })}

          {/* Draw bottom chord */}
          {trussPoints.bottom.map((point, i, arr) => {
            if (i === arr.length - 1) return null;
            return (
              <line
                key={`bottom-${i}`}
                x1={point.x}
                y1={point.y}
                x2={arr[i + 1].x}
                y2={arr[i + 1].y}
                stroke="#666"
                strokeWidth="2"
              />
            );
          })}

          {/* Draw web members */}
          {trussPoints.web.map((member, i) => (
            <line
              key={`web-${i}`}
              x1={member.start.x}
              y1={member.start.y}
              x2={member.end.x}
              y2={member.end.y}
              stroke="#666"
              strokeWidth="2"
            />
          ))}

          {/* Support triangles */}
          <polygon points="0,170 20,150 -20,150" fill="#666"/>
          <polygon points={`${span * 50},170 ${span * 50 + 20},150 ${span * 50 - 20},150`} fill="#666"/>
        </svg>
      </div>
    );
  };
  const FoundationVisualization = ({ designData }) => {
    if (!designData?.numericalData?.dimensions) {
      return <div>No visualization data available</div>;
    }

    const { length = 3, width = 3, depth = 0.6 } = designData.numericalData.dimensions;
    const scale = 50; // pixels per meter

    return (
      <div className="foundation-visualization">
        <svg width="100%" height="300" viewBox={`0 0 ${width * scale * 1.5} ${depth * scale * 2}`}>
          {/* Plan view */}
          <g transform={`translate(${width * scale * 0.25}, 0)`}>
            <rect
              x="0"
              y="0"
              width={width * scale}
              height={length * scale}
              fill="#ddd"
              stroke="#666"
              strokeWidth="2"
            />
            {/* Column indication */}
            <rect
              x={width * scale * 0.4}
              y={length * scale * 0.4}
              width={width * scale * 0.2}
              height={length * scale * 0.2}
              fill="#999"
              stroke="#666"
            />
          </g>

          {/* Section view */}
          <g transform={`translate(${width * scale * 0.25}, ${length * scale * 1.2})`}>
            <rect
              x="0"
              y="0"
              width={width * scale}
              height={depth * scale}
              fill="#ddd"
              stroke="#666"
              strokeWidth="2"
            />
            {/* Soil layers */}
            <path
              d={`M0,${depth * scale} h${width * scale}`}
              stroke="#8b4513"
              strokeWidth="2"
              strokeDasharray="5,5"
            />
            {/* Load arrow */}
            <path
              d={`M${width * scale * 0.5},-20 v40`}
              stroke="#f00"
              strokeWidth="2"
              markerEnd="url(#arrowhead)"
            />
          </g>
        </svg>
      </div>
    );
  };

  const ResultsChart = ({ data, title }) => {
    if (!data?.labels?.length || !data?.datasets?.length) {
      return null;
    }

    const options = {
      responsive: true,
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: true,
          text: title
        }
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    };

    return <Line options={options} data={data} />;
  };

  const ResultsDisplay = ({ result }) => {
    if (!result?.data) return null;

    const { dimensions, analysis, materials, costs, safety } = result.data;

    // Add chart data if available
    const chartData = result.data.numericalData?.chartData;
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="results-container"
      >
        {chartData && (
          <ResultsChart 
            data={chartData} 
            title="Analysis Results"
          />
        )}
        <div className="results-section">
          <h3>Dimensions</h3>
          <ul>
            {dimensions?.map((dim, index) => (
              <li key={`dim-${index}`}>{dim}</li>
            ))}
          </ul>
        </div>

        <div className="results-section">
          <h3>Analysis Results</h3>
          <ul>
            {analysis?.map((item, index) => (
              <li key={`analysis-${index}`}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="results-section">
          <h3>Materials</h3>
          <ul>
            {materials?.map((material, index) => (
              <li key={`material-${index}`}>{material}</li>
            ))}
          </ul>
        </div>

        <div className="results-section">
          <h3>Cost Breakdown</h3>
          <ul>
            {costs?.map((cost, index) => (
              <li key={`cost-${index}`}>{cost}</li>
            ))}
          </ul>
        </div>

        <div className="results-section">
          <h3>Safety Factors</h3>
          <ul>
            {safety?.map((factor, index) => (
              <li key={`safety-${index}`}>{factor}</li>
            ))}
          </ul>
        </div>
      </motion.div>
    );
  };

  useEffect(() => {
    const cards = document.querySelectorAll('.design-type-card');
    
    const handleMouseMove = (e) => {
      const card = e.currentTarget;
      const rect = card.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      
      card.style.setProperty('--mouse-x', `${x}%`);
      card.style.setProperty('--mouse-y', `${y}%`);
    };

    cards.forEach(card => {
      card.addEventListener('mousemove', handleMouseMove);
    });

    return () => {
      cards.forEach(card => {
        card.removeEventListener('mousemove', handleMouseMove);
      });
    };
  }, [selectedDesignType]); // Re-run when selectedDesignType changes

  // Main render method
  return (
    <div className="design-optimizer-container">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="design-type-selection"
      >
        <h2>Select Design Type</h2>
        <div className="design-type-grid">
          {designTypes.map(type => (
            <motion.div
              key={type.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`design-type-card ${selectedDesignType?.id === type.id ? 'selected' : ''}`}
              onClick={() => handleDesignTypeSelect(type)}
            >
              <span className="icon">{type.icon}</span>
              <h3>{type.title}</h3>
              <p>{type.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {selectedDesignType && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="design-form-container"
        >
          <h3>Enter Design Parameters</h3>
          <form onSubmit={handleOptimize}>
            {selectedDesignType.inputs.map(input => (
              <div key={input.id} className="form-group">
                <label htmlFor={input.id}>{input.label}</label>
                {input.type === 'select' ? (
                  <select
                    id={input.id}
                    name={input.id}
                    value={formInputs[input.id] || ''}
                    onChange={handleInputChange}
                    required={input.required}
                  >
                    <option value="">Select {input.label}</option>
                    {input.options.map(option => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={input.type}
                    id={input.id}
                    name={input.id}
                    min={input.min}
                    max={input.max}
                    value={formInputs[input.id] || ''}
                    onChange={handleInputChange}
                    required={input.required}
                  />
                )}
              </div>
            ))}
            <button type="submit" disabled={isLoading}>
              {isLoading ? 'Optimizing...' : 'Optimize Design'}
            </button>
          </form>
        </motion.div>
      )}

      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="error-message"
        >
          {error}
        </motion.div>
      )}

      {optimizationResult && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="results-visualization"
        >
          <h3>Design Visualization</h3>
          {selectedDesignType?.id === 'beam' && (
            <BeamVisualization designData={optimizationResult.data} />
          )}
          {selectedDesignType?.id === 'truss' && (
            <TrussVisualization designData={optimizationResult.data} />
          )}
          {selectedDesignType?.id === 'foundation' && (
            <FoundationVisualization designData={optimizationResult.data} />
          )}
          <ResultsDisplay result={optimizationResult} />
        </motion.div>
      )}
    </div>
  );
};

export default AIDesignOptimizerPage;