import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const FormField = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  min,
  max,
  step,
  options,
  required = false,
  error = null,
  helper = null,
  disabled = false
}) => {
  // This handler is crucial - it ensures the parent onChange receives the field name
  const handleChange = (e) => {
    // Call parent's onChange with both name and value
    onChange(name, e.target.value);
  };
  
  // Simplified rendering...
  
  return (
    <div className="form-group">
      <label htmlFor={name}>{label}{required && <span className="required">*</span>}</label>
      
      {type === 'select' ? (
        <select
          id={name}
          value={value || ''}
          onChange={handleChange}
          disabled={disabled}
          className={`form-input ${error ? 'error' : ''}`}
        >
          {options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          id={name}
          value={value || ''}
          onChange={handleChange}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          className={`form-input ${error ? 'error' : ''}`}
        />
      )}
      
      {error && <div className="form-error">{error}</div>}
      {!error && helper && <div className="form-helper">{helper}</div>}
    </div>
  );
};

export default FormField;