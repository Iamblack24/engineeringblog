import React, { useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import './AutoTutor.css';

const AutoTutor = () => {
  const [formData, setFormData] = useState({
    software: '',
    task: '',
    skillLevel: 'beginner',
  });
  const [tutorial, setTutorial] = useState({
    steps: [],
    currentStep: 0,
    completed: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError(null);
  };

  const generateTutorial = async (e) => {
    e.preventDefault();
    if (!formData.software || !formData.task) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('https://flashcards-2iat.onrender.com/autotutor/generate-tutorial', formData);
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to generate tutorial');
      }
      setTutorial({
        steps: response.data.steps || [],
        currentStep: 0,
        completed: false,
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate tutorial');
    } finally {
      setLoading(false);
    }
  };

  const navigateStep = (direction) => {
    setTutorial((prev) => ({
      ...prev,
      currentStep: Math.max(0, Math.min(prev.currentStep + direction, prev.steps.length - 1)),
    }));
  };

  const markStepComplete = () => {
    const isLastStep = tutorial.currentStep === tutorial.steps.length - 1;
    setTutorial((prev) => ({
      ...prev,
      completed: isLastStep,
      currentStep: isLastStep ? prev.currentStep : prev.currentStep + 1,
    }));
  };

  return (
    <motion.div
      className="auto-tutor"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <h1>AI-Powered Software Tutorial Generator</h1>

      <form onSubmit={generateTutorial} className="tutorial-form">
        <div className="form-group">
          <label htmlFor="software">Software</label>
          <input
            type="text"
            id="software"
            name="software"
            value={formData.software}
            onChange={handleInputChange}
            placeholder="e.g., Photoshop, AutoCAD"
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="task">Task to Learn</label>
          <input
            type="text"
            id="task"
            name="task"
            value={formData.task}
            onChange={handleInputChange}
            placeholder="e.g., Create a logo, Design a floor plan"
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="skillLevel">Skill Level</label>
          <select
            id="skillLevel"
            name="skillLevel"
            value={formData.skillLevel}
            onChange={handleInputChange}
            disabled={loading}
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>

        <motion.button
          type="submit"
          disabled={loading}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {loading ? 'Generating Tutorial...' : 'Generate Tutorial'}
        </motion.button>
      </form>

      {error && (
        <motion.div
          className="error-message"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {error}
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {tutorial.steps.length > 0 && (
          <motion.div
            className="tutorial-content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="tutorial-progress">
              Step {tutorial.currentStep + 1} of {tutorial.steps.length}
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${((tutorial.currentStep + 1) / tutorial.steps.length) * 100}%` }}
                />
              </div>
            </div>

            <div className="tutorial-step">
              <h3>{tutorial.steps[tutorial.currentStep].title}</h3>
              <p>{tutorial.steps[tutorial.currentStep].description}</p>
              {tutorial.steps[tutorial.currentStep].image && (
                <img
                  src={tutorial.steps[tutorial.currentStep].image}
                  alt={tutorial.steps[tutorial.currentStep].title}
                />
              )}
            </div>

            <div className="tutorial-navigation">
              <button
                onClick={() => navigateStep(-1)}
                disabled={tutorial.currentStep === 0}
              >
                Previous
              </button>
              <button onClick={markStepComplete}>
                {tutorial.currentStep === tutorial.steps.length - 1 ? 'Complete' : 'Next'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {tutorial.completed && (
        <motion.div
          className="completion-message"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <h2>🎉 Tutorial Completed!</h2>
          <p>Great job! You've completed all the steps.</p>
        </motion.div>
      )}
    </motion.div>
  );
};

export default AutoTutor;