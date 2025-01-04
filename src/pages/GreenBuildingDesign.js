import React, { useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import './GreenBuildingDesign.css';

const GreenBuildingDesign = () => {
  const [buildingType, setBuildingType] = useState('');
  const [location, setLocation] = useState('');
  const [materials, setMaterials] = useState('');
  const [budget, setBudget] = useState('');
  const [buildingArea, setBuildingArea] = useState('');
  const [occupancyType, setOccupancyType] = useState('');
  const [targetLeed, setTargetLeed] = useState('');
  const [sustainabilityGoals, setSustainabilityGoals] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState(''); // New state for additional information
  const [suggestions, setSuggestions] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (
      !buildingType ||
      !location ||
      !materials ||
      !budget ||
      !buildingArea ||
      !occupancyType ||
      !targetLeed ||
      !sustainabilityGoals
    ) {
      alert('Please fill in all required fields!');
      return;
    }

    setLoading(true);
    setError(null);
    const userInput = {
      buildingType,
      location,
      materials,
      budget,
      buildingArea,
      occupancyType,
      targetLeed,
      sustainabilityGoals,
      additionalInfo, // Include additional info in the request
    };

    try {
      const response = await axios.post(
        'https://flashcards-2iat.onrender.com/greenbuildingdesign/green-building',
        userInput
      );
      setSuggestions(response.data.data.suggestions);
    } catch (error) {
      console.error('Error:', error);
      setError('Failed to generate green building suggestions.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="green-building-design"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h1>Green Building Design AI</h1>
      <p>Get LEED-compliant and energy-efficient building techniques tailored to your needs.</p>
      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label htmlFor="buildingType">Building Type</label>
          <input
            id="buildingType"
            type="text"
            placeholder="e.g., Residential, Commercial"
            value={buildingType}
            onChange={(e) => setBuildingType(e.target.value)}
            required
          />
        </div>

        <div className="input-group">
          <label htmlFor="location">Location</label>
          <input
            id="location"
            type="text"
            placeholder="e.g., New York, USA"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
          />
        </div>

        <div className="input-group">
          <label htmlFor="materials">Preferred Materials</label>
          <input
            id="materials"
            type="text"
            placeholder="e.g., Bamboo, Recycled Steel"
            value={materials}
            onChange={(e) => setMaterials(e.target.value)}
            required
          />
        </div>

        <div className="input-group">
          <label htmlFor="budget">Budget</label>
          <input
            id="budget"
            type="text"
            placeholder="e.g., $500,000"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            required
          />
        </div>

        <div className="input-group">
          <label htmlFor="buildingArea">Building Area</label>
          <input
            id="buildingArea"
            type="text"
            placeholder="e.g., 2000 sqft"
            value={buildingArea}
            onChange={(e) => setBuildingArea(e.target.value)}
            required
          />
        </div>

        <div className="input-group">
          <label htmlFor="occupancyType">Occupancy Type</label>
          <select
            id="occupancyType"
            value={occupancyType}
            onChange={(e) => setOccupancyType(e.target.value)}
            required
          >
            <option value="">Select</option>
            <option value="residential">Residential</option>
            <option value="commercial">Commercial</option>
            <option value="industrial">Industrial</option>
          </select>
        </div>

        <div className="input-group">
          <label htmlFor="targetLeed">Target LEED Rating</label>
          <select
            id="targetLeed"
            value={targetLeed}
            onChange={(e) => setTargetLeed(e.target.value)}
            required
          >
            <option value="">Select</option>
            <option value="platinum">Platinum</option>
            <option value="gold">Gold</option>
            <option value="silver">Silver</option>
            <option value="certified">Certified</option>
          </select>
        </div>

        <div className="input-group">
          <label htmlFor="sustainabilityGoals">Sustainability Goals</label>
          <input
            id="sustainabilityGoals"
            type="text"
            placeholder="e.g., Energy efficiency, water conservation"
            value={sustainabilityGoals}
            onChange={(e) => setSustainabilityGoals(e.target.value)}
            required
          />
        </div>

        {/* Additional Information Field */}
        <div className="input-group">
          <label htmlFor="additionalInfo">Additional Information</label>
          <textarea
            id="additionalInfo"
            placeholder="e.g., Specific design preferences, site constraints, or other notes"
            value={additionalInfo}
            onChange={(e) => setAdditionalInfo(e.target.value)}
          />
        </div>

        <motion.button
          type="submit"
          disabled={loading}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {loading ? 'Generating...' : 'Get Suggestions'}
        </motion.button>
      </form>

      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}

      {suggestions && (
        <motion.div
          className="suggestions"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2>Suggestions</h2>
          <ReactMarkdown>{suggestions}</ReactMarkdown>
        </motion.div>
      )}
    </motion.div>
  );
};

export default GreenBuildingDesign;