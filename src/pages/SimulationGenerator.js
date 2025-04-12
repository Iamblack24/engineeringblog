import React, { useState, useCallback } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import SimulationForm from '../components/simulation/SimulationForm';
import ThreeJsVisualization from '../components/simulation/ThreeJsVisualization'; 
import SimulationResults from '../components/simulation/SimulationResults';
import SimulationPresets from '../components/simulation/SimulationPresets';
import './SimulationGenerator.css';

// Animation variants
const fadeInOut = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.3 }
};

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
  const [visualizationData, setVisualizationData] = useState(null);
  const [showPresets, setShowPresets] = useState(false);

  // Handle simulation submission
  const handleSimulate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setAiInsights('');
    setVisualizationData(null); // Clear previous visualization

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

      // Use optional chaining and provide defaults
      setVisualizationData(data.data?.visualizationData || null);
      setAiInsights(data.data?.simulationResults || '');

    } catch (err) {
      console.error('Simulation error:', err);
      setError(`Simulation failed: ${err.message || 'Please check your inputs and try again.'}`);
      setVisualizationData(null); // Ensure visualization is cleared on error
      setAiInsights(''); // Ensure insights are cleared on error
    } finally {
      setLoading(false);
    }
  };

  // Handle preset selection
  const handlePresetSelect = useCallback((preset) => {
    // ✅ Make sure preset.parameters exists before setting state
    if (preset && typeof preset === 'object') {
      // Use a function to update state to ensure we have the latest state
      setParameters(prevParams => ({
        ...prevParams,
        ...(preset.parameters || {})
      }));
      
      if (preset.simulationType) {
        setSimulationType(preset.simulationType);
      }
      
      setShowPresets(false);
      setVisualizationData(null);
      setAiInsights('');
      setError('');
    }
  }, []);

  // Add this function to handle form field changes
  const handleParameterChange = useCallback((name, value) => {
    setParameters(prev => {
      // Handle nested parameters (e.g., "geometry.radius")
      if (name.includes('.')) {
        const [section, field] = name.split('.');
        return {
          ...prev,
          [section]: {
            ...prev[section],
            [field]: value
          }
        };
      }
      
      // Handle top-level parameters
      return {
        ...prev,
        [name]: value
      };
    });
  }, []);

  return (
    <div className="simulation-container">
      <div className="simulation-header">
        <h1>Engineering Simulation Tool</h1>
        <p>
          Design, analyze, and visualize engineering simulations. Configure parameters 
          and get AI-powered insights for your engineering projects.
        </p>
        
        <motion.button
          className="simulation-button"
          onClick={() => setShowPresets(!showPresets)}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          {/* Add icon here if needed */}
          {showPresets ? 'Hide Presets' : 'Load Preset'}
        </motion.button>
      </div>

      <AnimatePresence>
        {showPresets && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <SimulationPresets onSelect={handlePresetSelect} />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="simulation-grid">
        <SimulationForm
          simulationType={simulationType}
          setSimulationType={setSimulationType}
          parameters={parameters}
          // ✅ Pass the parameter change function instead of the setter
          onParameterChange={handleParameterChange}
          onSubmit={handleSimulate}
          loading={loading}
        />
        
        <div className="visualization-area">
          <AnimatePresence>
            {loading && (
              <motion.div 
                className="loading-overlay"
                {...fadeInOut}
              >
                <div className="loading-spinner"></div>
              </motion.div>
            )}
          </AnimatePresence>
          
          <ThreeJsVisualization 
            visualizationData={visualizationData} 
            isLoading={loading}
          />
          
          {!loading && !visualizationData && (
            <div style={{ color: '#9ca3af', textAlign: 'center' }}>
              Simulation visualization will appear here.
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div 
            className="error-message"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {aiInsights && !loading && (
          <motion.div
            className="ai-insights"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2>AI-Generated Insights</h2>
            <div className="prose">
              <SimulationResults results={aiInsights} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SimulationGenerator;