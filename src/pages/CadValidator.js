/* 
import React, { useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import './CadValidator.css';

const CadValidator = () => {
  const [file, setFile] = useState(null);
  const [constraints, setConstraints] = useState({
    dimensions: '',
    materials: '',
    loadRequirements: '',
  });
  const [validationReport, setValidationReport] = useState('');
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleFileChange = (event) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0]);
    }
  };

  const handleDrag = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.type === 'dragenter' || event.type === 'dragover') {
      setDragActive(true);
    } else if (event.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);
    if (event.dataTransfer.files && event.dataTransfer.files[0]) {
      setFile(event.dataTransfer.files[0]);
    }
  };

  const handleConstraintsChange = (event) => {
    const { name, value } = event.target;
    setConstraints((prevConstraints) => ({
      ...prevConstraints,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!file) {
      alert('Please select a file first!');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('cadFile', file);
    formData.append('constraints', JSON.stringify(constraints));

    try {
      const response = await axios.post('https://flashcards-2iat.onrender.com/cadvalidator/validate', formData);
      setValidationReport(response.data.data.validationReport);
    } catch (error) {
      console.error('Error:', error);
      setValidationReport('Failed to validate the CAD file.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="cad-validator"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h1>CAD File Validator</h1>
      <p>Upload your CAD file for design optimization analysis.</p>
      <form onSubmit={handleSubmit} onDragEnter={handleDrag}>
        <label
          htmlFor="file-upload"
          className={`upload-area ${dragActive ? 'drag-active' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {file ? (
            <p>Selected file: <strong>{file.name}</strong></p>
          ) : (
            <p>Drag & drop a file or <span>browse</span></p>
          )}
          <input
            id="file-upload"
            type="file"
            onChange={handleFileChange}
            accept=".dxf,.dwg,.pdf"
            hidden
          />
        </label>

        <div className="constraints-input">
          <h3>Specify Constraints</h3>
          <input
            type="text"
            name="dimensions"
            placeholder="Dimensions (e.g., 10x10x10)"
            value={constraints.dimensions}
            onChange={handleConstraintsChange}
          />
          <input
            type="text"
            name="materials"
            placeholder="Materials (e.g., Steel, Aluminum)"
            value={constraints.materials}
            onChange={handleConstraintsChange}
          />
          <input
            type="text"
            name="loadRequirements"
            placeholder="Load Requirements (e.g., 500kg)"
            value={constraints.loadRequirements}
            onChange={handleConstraintsChange}
          />
        </div>

        <motion.button
          type="submit"
          disabled={loading || !file}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {loading ? 'Analysing...' : 'Analysis'}
        </motion.button>
      </form>

      {validationReport && (
        <motion.div
          className="result"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2>Validation Report</h2>
          <div dangerouslySetInnerHTML={{ __html: validationReport.replace(/\n/g, '<br>') }} />
        </motion.div>
      )}
    </motion.div>
  );
};

export default CadValidator;
*/

import React, { useState, useEffect } from 'react';
import './CadValidator.css';

const CadValidator = () => {
  const [isLoading, setIsLoading] = useState(true);
  // Use a default height if auto-adjustment isn’t possible.
  const [iframeHeight, setIframeHeight] = useState('600px');

  const handleIframeLoad = (event) => {
    setIsLoading(false);
    // Try to adjust iframe height based on content if on the same origin
    try {
      const iframeDocument = event.target.contentDocument || event.target.contentWindow.document;
      if (iframeDocument) {
        const height = iframeDocument.body.scrollHeight;
        setIframeHeight(`${height}px`);
      }
    } catch (error) {
      console.warn('Could not adjust iframe height automatically (cross-origin):', error);
    }
  };

  return (
    <div className="iframe-wrapper">
      {isLoading && (
        <div className="iframe-loading">
          Loading Cad Validator content... <br />
          Please wait while the external page loads.
        </div>
      )}
      <div className="iframe-container" style={{ height: iframeHeight }}>
        <iframe 
          src="https://cadvalid.netlify.app/" 
          onLoad={handleIframeLoad}
          title="Cad Validator"
          allowFullScreen
        />
      </div>
    </div>
  );
};

export default CadValidator;