import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import './AIDesignOptimizerPage.css';
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
import DesignVisualizer from '../components/DesignVisualizer';

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
  const [currentSection, setCurrentSection] = useState('project');
  const [originalDesign, setOriginalDesign] = useState(null);
  //const [formSections, setFormSections] = useState([]);

  // Design type definitions
  const designTypes = [
    {
      id: 'beam',
      title: 'Beam Design',
      icon: '🏗️',
      description: 'Optimize reinforced concrete or steel beam designs',
      inputs: [
        // Project Information
        {
          id: 'projectName',
          label: 'Project Name',
          type: 'text',
          required: true,
          section: 'project'
        },
        {
          id: 'designCode',
          label: 'Design Code',
          type: 'select',
          options: ['ACI 318-19', 'Eurocode 2', 'IS 456:2000'],
          required: true,
          section: 'project'
        },
        // Geometry
        {
          id: 'span',
          label: 'Span Length (m)',
          type: 'number',
          min: 0,
          required: true,
          section: 'geometry'
        },
        {
          id: 'supportType',
          label: 'Support Conditions',
          type: 'select',
          options: ['Simply Supported', 'Fixed-Fixed', 'Cantilever'],
          required: true,
          section: 'geometry'
        },
        // Loading
        {
          id: 'deadLoad',
          label: 'Dead Load (kN/m)',
          type: 'number',
          min: 0,
          required: true,
          section: 'loads'
        },
        {
          id: 'liveLoad',
          label: 'Live Load (kN/m)',
          type: 'number',
          min: 0,
          required: true,
          section: 'loads'
        },
        {
          id: 'loadPattern',
          label: 'Load Pattern',
          type: 'select',
          options: ['Uniform', 'Point Load', 'Combined'],
          required: true,
          section: 'loads'
        },
        // Materials
        {
          id: 'material',
          label: 'Material Type',
          type: 'select',
          options: ['Reinforced Concrete', 'Steel'],
          required: true,
          section: 'materials'
        },
        {
          id: 'concreteGrade',
          label: 'Concrete Grade',
          type: 'select',
          options: ['M20', 'M25', 'M30', 'M35', 'M40'],
          required: true,
          section: 'materials',
          showIf: (formData) => formData.material === 'Reinforced Concrete'
        },
        {
          id: 'steelGrade',
          label: 'Steel Grade',
          type: 'select',
          options: ['Fe415', 'Fe500', 'Fe550'],
          required: true,
          section: 'materials',
          showIf: (formData) => formData.material === 'Reinforced Concrete'
        },
        // Requirements
        {
          id: 'deflectionLimit',
          label: 'Deflection Limit',
          type: 'select',
          options: ['L/360', 'L/240', 'L/180'],
          required: true,
          section: 'requirements'
        },
        {
          id: 'exposureClass',
          label: 'Exposure Class',
          type: 'select',
          options: ['Mild', 'Moderate', 'Severe', 'Very Severe'],
          required: true,
          section: 'requirements'
        },
        {
          id: 'fireRating',
          label: 'Fire Rating (hours)',
          type: 'select',
          options: ['1', '2', '3', '4'],
          required: true,
          section: 'requirements'
        },
        // Costs
        {
          id: 'concreteCost',
          label: 'Concrete Cost (per m³)',
          type: 'number',
          min: 0,
          required: true,
          section: 'costs',
          showIf: (formData) => formData.material === 'Reinforced Concrete'
        },
        {
          id: 'steelCost',
          label: 'Steel Cost (per kg)',
          type: 'number',
          min: 0,
          required: true,
          section: 'costs'
        },
        {
          id: 'formworkCost',
          label: 'Formwork Cost (per m²)',
          type: 'number',
          min: 0,
          required: true,
          section: 'costs',
          showIf: (formData) => formData.material === 'Reinforced Concrete'
        },
        {
          id: 'laborCost',
          label: 'Labor Cost (per day)',
          type: 'number',
          min: 0,
          required: true,
          section: 'costs'
        }
        // ... continue with more inputs
      ]
    },
    {
      id: 'truss',
      title: 'Truss Design',
      icon: '🔧',
      description: 'Optimize steel truss designs',
      inputs: [
        // Project Information
        {
          id: 'projectName',
          label: 'Project Name',
          type: 'text',
          required: true,
          section: 'project'
        },
        {
          id: 'designCode',
          label: 'Design Code',
          type: 'select',
          options: ['AISC 360', 'Eurocode 3', 'IS 800:2007'],
          required: true,
          section: 'project'
        },
        // Geometry
        {
          id: 'span',
          label: 'Span (m)',
          type: 'number',
          min: 6,
          max: 100,
          required: true,
          section: 'geometry'
        },
        {
          id: 'height',
          label: 'Height (m)',
          type: 'number',
          min: 1,
          max: 15,
          required: true,
          section: 'geometry'
        },
        {
          id: 'roofArea',
          label: 'Roof Area (m²)',
          type: 'number',
          min: 0,
          required: true,
          section: 'geometry'
        },
        {
          id: 'trussSpacing',
          label: 'Truss Spacing (m)',
          type: 'number',
          min: 0,
          required: true,
          section: 'geometry'
        },
        // Loading
        {
          id: 'deadLoad',
          label: 'Dead Load (kN/m²)',
          type: 'number',
          min: 0,
          required: true,
          section: 'loads'
        },
        {
          id: 'liveLoad',
          label: 'Live Load (kN/m²)',
          type: 'number',
          min: 0,
          required: true,
          section: 'loads'
        },
        {
          id: 'windLoad',
          label: 'Wind Load (kN/m²)',
          type: 'number',
          min: 0,
          required: true,
          section: 'loads'
        },
        // Materials
        {
          id: 'material',
          label: 'Material',
          type: 'select',
          options: ['Steel', 'Aluminum', 'Timber'],
          required: true,
          section: 'materials'
        },
        {
          id: 'connectionType',
          label: 'Connection Type',
          type: 'select',
          options: ['Welded', 'Bolted'],
          required: true,
          section: 'materials'
        },
        // Connections
        {
          id: 'jointType',
          label: 'Joint Type',
          type: 'select',
          options: ['Gusset Plate', 'Direct Welding', 'Bolted Splice'],
          required: true,
          section: 'connections'
        },
        {
          id: 'boltGrade',
          label: 'Bolt Grade',
          type: 'select',
          options: ['4.6', '8.8', '10.9'],
          required: true,
          section: 'connections',
          showIf: (formData) => formData.connectionType === 'Bolted'
        },
        {
          id: 'weldType',
          label: 'Weld Type',
          type: 'select',
          options: ['Fillet', 'Butt', 'Plug'],
          required: true,
          section: 'connections',
          showIf: (formData) => formData.connectionType === 'Welded'
        },
        // Costs
        {
          id: 'materialCost',
          label: 'Material Cost (per kg)',
          type: 'number',
          min: 0,
          required: true,
          section: 'costs'
        },
        {
          id: 'fabricationCost',
          label: 'Fabrication Cost (per joint)',
          type: 'number',
          min: 0,
          required: true,
          section: 'costs'
        },
        {
          id: 'transportationCost',
          label: 'Transportation Cost',
          type: 'number',
          min: 0,
          required: true,
          section: 'costs'
        }
      ]
    },
    {
      id: 'foundation',
      title: 'Foundation Design',
      icon: '🏛️',
      description: 'Optimize foundation designs based on soil conditions and loads',
      inputs: [
        // Project Information
        {
          id: 'projectName',
          label: 'Project Name',
          type: 'text',
          required: true,
          section: 'project'
        },
        {
          id: 'designCode',
          label: 'Design Code',
          type: 'select',
          options: ['ACI 318-19', 'Eurocode 7', 'IS 456:2000'],
          required: true,
          section: 'project'
        },
        // Soil Parameters
        {
          id: 'soilType',
          label: 'Soil Type',
          type: 'select',
          options: [
            'Soft Clay',
            'Stiff Clay',
            'Loose Sand',
            'Dense Sand',
            'Rock'
          ],
          required: true,
          section: 'soil'
        },
        {
          id: 'bearingCapacity',
          label: 'Safe Bearing Capacity (kN/m²)',
          type: 'number',
          min: 0,
          required: true,
          section: 'soil'
        },
        {
          id: 'waterTableDepth',
          label: 'Water Table Depth (m)',
          type: 'number',
          min: 0,
          required: true,
          section: 'soil'
        },
        {
          id: 'soilLayering',
          label: 'Soil Layering',
          type: 'select',
          options: ['Uniform', 'Layered', 'Variable'],
          required: true,
          section: 'soil'
        },
        // Loading Conditions
        {
          id: 'axialLoad',
          label: 'Axial Load (kN)',
          type: 'number',
          min: 0,
          required: true,
          section: 'loads'
        },
        {
          id: 'momentX',
          label: 'Moment about X-axis (kN-m)',
          type: 'number',
          required: true,
          section: 'loads'
        },
        {
          id: 'momentY',
          label: 'Moment about Y-axis (kN-m)',
          type: 'number',
          required: true,
          section: 'loads'
        },
        {
          id: 'horizontalForceX',
          label: 'Horizontal Force X (kN)',
          type: 'number',
          required: true,
          section: 'loads'
        },
        {
          id: 'horizontalForceY',
          label: 'Horizontal Force Y (kN)',
          type: 'number',
          required: true,
          section: 'loads'
        },
        // Foundation Geometry
        {
          id: 'foundationType',
          label: 'Foundation Type',
          type: 'select',
          options: [
            'Isolated Footing',
            'Strip Footing',
            'Raft Foundation',
            'Pile Foundation'
          ],
          required: true,
          section: 'geometry'
        },
        {
          id: 'embedmentDepth',
          label: 'Embedment Depth (m)',
          type: 'number',
          min: 0,
          required: true,
          section: 'geometry'
        },
        // Material Properties
        {
          id: 'concreteGrade',
          label: 'Concrete Grade',
          type: 'select',
          options: ['M20', 'M25', 'M30', 'M35', 'M40'],
          required: true,
          section: 'materials'
        },
        {
          id: 'steelGrade',
          label: 'Steel Grade',
          type: 'select',
          options: ['Fe415', 'Fe500', 'Fe550'],
          required: true,
          section: 'materials'
        },
        // Site Conditions
        {
          id: 'adjacentStructures',
          label: 'Adjacent Structures',
          type: 'select',
          options: ['None', 'Light', 'Heavy'],
          required: true,
          section: 'site'
        },
        {
          id: 'siteAccessibility',
          label: 'Site Accessibility',
          type: 'select',
          options: ['Easy', 'Moderate', 'Difficult'],
          required: true,
          section: 'site'
        },
        // Environmental Conditions
        {
          id: 'exposureClass',
          label: 'Environmental Exposure Class',
          type: 'select',
          options: ['Mild', 'Moderate', 'Severe', 'Very Severe'],
          required: true,
          section: 'environment'
        },
        {
          id: 'seismicZone',
          label: 'Seismic Zone',
          type: 'select',
          options: ['Zone I', 'Zone II', 'Zone III', 'Zone IV', 'Zone V'],
          required: true,
          section: 'environment'
        },
        // Cost Parameters
        {
          id: 'excavationCost',
          label: 'Excavation Cost (per m³)',
          type: 'number',
          min: 0,
          required: true,
          section: 'costs'
        },
        {
          id: 'concreteCost',
          label: 'Concrete Cost (per m³)',
          type: 'number',
          min: 0,
          required: true,
          section: 'costs'
        },
        {
          id: 'steelCost',
          label: 'Steel Cost (per kg)',
          type: 'number',
          min: 0,
          required: true,
          section: 'costs'
        }
      ]
    }
    // ... Foundation type definition
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

    // Initialize with default dimensions and costs
   const initialDimensions = calculateInitialDimensions();
   const initialCosts = calculateInitialCosts();
  
   setOriginalDesign({
    dimensions: initialDimensions,
    costs: initialCosts
   });
  };

  // Form validation
  const validateForm = () => {
    if (!selectedDesignType) {
      setError('Please select a design type');
      return false;
    }

    const missingInputs = selectedDesignType.inputs.filter(input => {
      // Only validate if the input is required AND
      // either has no showIf condition OR its showIf condition is met
      return input.required && 
             (!input.showIf || input.showIf(formInputs)) && 
             !formInputs[input.id];
    });

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

    // Calculate initial values before optimization
    const initialDimensions = calculateInitialDimensions();
    const initialCosts = calculateInitialCosts();

    try {
      const response = await fetch('https://flashcards-2iat.onrender.com/designoptimizer/optimize-design', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          designType: selectedDesignType.id,
          parameters: formInputs,
          initialDesign: {
            dimensions: initialDimensions,
            costs: initialCosts
          }
        })
      });

      const data = await response.json();
      console.log('API Response:', data);
      
      if (response.ok) {
        setOptimizationResult(data);
        setOriginalDesign({
          dimensions: initialDimensions,
          costs: initialCosts,
          analysis: {
            strength: data.originalStrength || 0
          },
          materials: {
            usage: data.originalMaterialUsage || 0
          },
          safety: {
            factor: data.originalSafetyFactor || 0
          }
        });
      } else {
        setError(data.message || 'Optimization failed');
      }
    } catch (err) {
      console.error('Optimization error:', err);
      setError('Failed to communicate with the server');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper functions for initial calculations
  const calculateInitialDimensions = () => {
    if (!formInputs || !selectedDesignType) return {};

    switch(selectedDesignType.id) {
      case 'beam':
        return {
          span: formInputs.span || 0,
          depth: (formInputs.span || 0) / 12,
          width: (formInputs.span || 0) / 24
        };
      case 'truss':
        return {
          span: formInputs.span || 0,
          height: formInputs.height || 0
        };
      case 'foundation':
        return {
          length: Math.sqrt((formInputs.axialLoad || 0) / 100),
          width: Math.sqrt((formInputs.axialLoad || 0) / 100),
          depth: formInputs.embedmentDepth || 0
        };
      default:
        return {};
    }
  };

  const calculateInitialCosts = () => {
    if (!formInputs || !selectedDesignType) return {};

    const materialCost = formInputs.materialCost || 0;
    const fabricationCost = formInputs.fabricationCost || 0;
    const transportationCost = formInputs.transportationCost || 0;

    // Basic initial cost calculation
    const dimensions = calculateInitialDimensions();
    const volume = Object.values(dimensions).reduce((a, b) => a * b, 1);
    const estimatedWeight = volume * 7850; // Assuming steel density in kg/m³

    return {
      total: (materialCost * estimatedWeight) + fabricationCost + transportationCost,
      materials: materialCost * estimatedWeight,
      fabrication: fabricationCost,
      transportation: transportationCost
    };
  };

  const ResultsChart = ({ data }) => {
    // Implementation of chart component
    return (
      <div className="results-chart">
        {/* Chart implementation */}
      </div>
    );
  };

  const ResultsDisplay = ({ result }) => {
    if (!result?.data) return null;

    const { dimensions, analysis, materials, costs, safety } = result.data;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="results-container"
      >
        <div className="results-grid">
          {/* Dimensions Section */}
          <div className="result-section">
            <h4>Dimensions</h4>
            <div className="result-items">
              {dimensions?.map((dim, index) => (
                <div key={`dim-${index}`} className="result-item">
                  {dim}
                </div>
              ))}
            </div>
          </div>

          {/* Analysis Section */}
          <div className="result-section">
            <h4>Analysis Results</h4>
            <div className="result-items">
              {analysis?.map((item, index) => (
                <div key={`analysis-${index}`} className="result-item">
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* Materials Section */}
          <div className="result-section">
            <h4>Materials</h4>
            <div className="result-items">
              {materials?.map((material, index) => (
                <div key={`material-${index}`} className="result-item">
                  {material}
                </div>
              ))}
            </div>
          </div>

          {/* Costs Section */}
          <div className="result-section">
            <h4>Cost Breakdown</h4>
            <div className="result-items">
              {costs?.map((cost, index) => (
                <div key={`cost-${index}`} className="result-item">
                  {cost}
                </div>
              ))}
            </div>
          </div>

          {/* Safety Section */}
          <div className="result-section">
            <h4>Safety Factors</h4>
            <div className="result-items">
              {safety?.map((factor, index) => (
                <div key={`safety-${index}`} className="result-item">
                  {factor}
                </div>
              ))}
            </div>
          </div>
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

  // Add section definitions
  const sectionOrder = {
    beam: ['project', 'geometry', 'loads', 'materials', 'requirements', 'costs'],
    truss: ['project', 'geometry', 'loads', 'materials', 'connections', 'costs'],
    foundation: ['project', 'soil', 'loads', 'geometry', 'materials', 'site', 'environment', 'costs']
  };

  // Modify form rendering to handle sections
  const renderFormSection = (section) => {
    const sectionInputs = selectedDesignType.inputs.filter(
      input => input.section === section && 
      (!input.showIf || input.showIf(formInputs))
    );

    return (
      <div className="form-section">
        <h4>{section.charAt(0).toUpperCase() + section.slice(1)}</h4>
        {sectionInputs.map(input => (
          <div key={input.id} className="form-group">
            <label htmlFor={input.id}>
              {input.label}
              {input.required && <span className="required">*</span>}
            </label>
            {renderInput(input)}
            {input.description && (
              <small className="input-description">{input.description}</small>
            )}
          </div>
        ))}
      </div>
    );
  };

  // Enhanced input rendering
  const renderInput = (input) => {
    switch (input.type) {
      case 'select':
        return (
          <select
            id={input.id}
            name={input.id}
            value={formInputs[input.id] || ''}
            onChange={handleInputChange}
            required={input.required}
            className="form-select"
          >
            <option value="">Select {input.label}</option>
            {input.options.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );

      case 'number':
        return (
          <div className="number-input-group">
            <input
              type="number"
              id={input.id}
              name={input.id}
              min={input.min}
              max={input.max}
              step={input.step || 'any'}
              value={formInputs[input.id] || ''}
              onChange={handleInputChange}
              required={input.required}
              className="form-input"
            />
            {input.unit && <span className="unit">{input.unit}</span>}
          </div>
        );

      case 'checkbox':
        return (
          <input
            type="checkbox"
            id={input.id}
            name={input.id}
            checked={formInputs[input.id] || false}
            onChange={(e) => handleInputChange({
              target: {
                name: input.id,
                value: e.target.checked,
                type: 'checkbox'
              }
            })}
            className="form-checkbox"
          />
        );

      default:
        return (
          <input
            type={input.type}
            id={input.id}
            name={input.id}
            value={formInputs[input.id] || ''}
            onChange={handleInputChange}
            required={input.required}
            className="form-input"
          />
        );
    }
  };

  // Update form container
  const renderForm = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="design-form-container"
    >
      <h3>Enter Design Parameters</h3>
      <div className="section-navigation">
        {sectionOrder[selectedDesignType.id].map(section => (
          <button
            key={section}
            className={`section-tab ${currentSection === section ? 'active' : ''}`}
            onClick={() => setCurrentSection(section)}
          >
            {section.charAt(0).toUpperCase() + section.slice(1)}
          </button>
        ))}
      </div>
      <form onSubmit={handleOptimize}>
        {renderFormSection(currentSection)}
        <div className="form-navigation">
          {currentSection !== sectionOrder[selectedDesignType.id][0] && (
            <button
              type="button"
              onClick={() => handleSectionChange('prev')}
              className="nav-button"
            >
              Previous
            </button>
          )}
          {currentSection !== sectionOrder[selectedDesignType.id].slice(-1)[0] ? (
            <button
              type="button"
              onClick={() => handleSectionChange('next')}
              className="nav-button"
            >
              Next
            </button>
          ) : (
            <button
              type="submit"
              disabled={isLoading}
              className="submit-button"
            >
              {isLoading ? 'Optimizing...' : 'Optimize Design'}
            </button>
          )}
        </div>
      </form>
    </motion.div>
  );

  // Add section navigation handler
  const handleSectionChange = (direction) => {
    const sections = sectionOrder[selectedDesignType.id];
    const currentIndex = sections.indexOf(currentSection);
    
    if (direction === 'next' && currentIndex < sections.length - 1) {
      setCurrentSection(sections[currentIndex + 1]);
    } else if (direction === 'prev' && currentIndex > 0) {
      setCurrentSection(sections[currentIndex - 1]);
    }
  };

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
          {renderForm()}
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
        <>
          <ResultsDisplay result={optimizationResult} />
          <ResultsChart data={optimizationResult} />
          <DesignVisualizer
            designType={selectedDesignType?.id}
            parameters={formInputs}
            optimizationResult={optimizationResult}
            originalDesign={originalDesign}
          />
        </>
      )}
    </div>
  );
};

export default AIDesignOptimizerPage;