import React, { useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import './KnowledgeExtraction.css';

const KnowledgeExtraction = () => {
  const [file, setFile] = useState(null);
  const [summary, setSummary] = useState('');
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

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!file) {
      alert('Please select a file first!');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('document', file);

    try {
      const response = await axios.post('https://flashcards-2iat.onrender.com/automatedknowledgeextractor/extract-knowledge', formData);
      setSummary(response.data.data.summary);
    } catch (error) {
      console.error('Error:', error);
      setSummary('Failed to extract knowledge from the document.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="knowledge-extraction"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h1>Summarize Technical documents</h1>
      <p>Upload a technical document, research paper, or case study to extract key insights and recommendations.</p>
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
            accept=".pdf"
            hidden
          />
        </label>

        <motion.button
          type="submit"
          disabled={loading || !file}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {loading ? 'Extracting...' : 'Analyze'}
        </motion.button>
      </form>

      {summary && (
        <motion.div
          className="summary"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2>Summary</h2>
          <ReactMarkdown>{summary}</ReactMarkdown>
        </motion.div>
      )}
    </motion.div>
  );
};

export default KnowledgeExtraction;