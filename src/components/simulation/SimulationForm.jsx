import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import LoadDistributionForm from './forms/LoadDistributionForm';
import StressAnalysisForm from './forms/StressAnalysisForm';
import FluidDynamicsForm from './forms/FluidDynamicsForm';

// Change the props to use onParameterChange instead of setParameters
const SimulationForm = ({ 
  simulationType, 
  setSimulationType, 
  parameters, 
  onParameterChange, // ✅ Use this instead of setParameters
  onSubmit, 
  loading 
}) => {
  // Track form errors
  const [errors, setErrors] = useState({});
  
  // Reset errors when simulation type changes
  useEffect(() => {
    setErrors({});
  }, [simulationType]);
  
  // Form change handler
  const handleChange = (name, value) => {
    // Clear error for this field on change
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = {...prev};
        delete newErrors[name];
        return newErrors;
      });
    }
    
    // Update parameters through the parent's function
    onParameterChange(name, value);
  };
  
  // Basic validation before submission
  const validateForm = () => {
    const newErrors = {};
    const requiredFields = [];
    
    // Determine required fields based on simulation type
    if (simulationType === 'load-distribution') {
      requiredFields.push(
        'material',
        'geometry.length',
        'load.value'
      );
    } else if (simulationType === 'stress-analysis') {
      requiredFields.push(
        'material',
        'geometry.radius',
        'stress.value'
      );
    } else if (simulationType === 'fluid-dynamics') {
      requiredFields.push(
        'fluid.type',
        'geometry.diameter',
        'flow.velocity'
      );
    }
    
    // Check required fields
    requiredFields.forEach(field => {
      if (field.includes('.')) {
        const [category, subfield] = field.split('.');
        if (!parameters[category] || parameters[category][subfield] === undefined || parameters[category][subfield] === '') {
          newErrors[field] = 'This field is required';
        }
      } else if (parameters[field] === undefined || parameters[field] === '') {
        newErrors[field] = 'This field is required';
      }
    });
    
    // Validate specific fields with more reasonable ranges
    if (parameters.geometry?.length !== undefined) {
      const len = parseFloat(parameters.geometry.length);
      if (!isNaN(len) && (len <= 0 || len > 1000)) {
        newErrors['geometry.length'] = 'Length must be between 0 and 1000 m';
      }
    }
    
    if (parameters.geometry?.radius !== undefined) {
      const radius = parseFloat(parameters.geometry.radius);
      if (!isNaN(radius) && (radius <= 0 || radius > 100)) {
        newErrors['geometry.radius'] = 'Radius must be between 0 and 100 m';
      }
    }
    
    // Return validation results
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission with validation
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Only proceed if validation passes
    if (validateForm()) {
      onSubmit(e);
    }
  };
  
  // Render specific form based on simulation type
  const renderForm = () => {
    switch (simulationType) {
      case 'load-distribution':
        return (
          <LoadDistributionForm 
            parameters={parameters} 
            onChange={handleChange}
            errors={errors}
          />
        );
      case 'stress-analysis':
        return (
          <StressAnalysisForm 
            parameters={parameters} 
            onChange={handleChange}
            errors={errors}
          />
        );
      case 'fluid-dynamics':
        return (
          <FluidDynamicsForm 
            parameters={parameters} 
            onChange={handleChange}
            errors={errors}
          />
        );
      default:
        return <p>Select a simulation type</p>;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="simulation-form">
      <h2>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        Simulation Parameters
      </h2>
      
      <div className="form-group">
        <label htmlFor="simulationType">Simulation Type<span className="required">*</span></label>
        <select
          id="simulationType"
          name="simulationType"
          value={simulationType}
          onChange={(e) => setSimulationType(e.target.value)}
          className="form-input"
        >
          <option value="load-distribution">Load Distribution</option>
          <option value="stress-analysis">Stress Analysis</option>
          <option value="fluid-dynamics">Fluid Dynamics</option>
        </select>
      </div>
      
      {renderForm()}
      
      <motion.button
        type="submit"
        className="simulation-button button-submit"
        disabled={loading}
        whileHover={!loading ? { scale: 1.02 } : {}}
        whileTap={!loading ? { scale: 0.98 } : {}}
      >
        {loading ? 'Processing...' : 'Run Simulation'}
      </motion.button>
    </form>
  );
};

export default SimulationForm;