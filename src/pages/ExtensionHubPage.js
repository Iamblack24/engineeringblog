import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import './ExtensionHubPage.css';

// Map of extension IDs to their external URLs
const EXTENSION_URLS = {
  'study-boost': 'https://study-helper-boost.vercel.app/',
  'concrete-design': 'https://concreteaiengineeringhub.netlify.app/', // Placeholder for future integration
  'material-explorer': '#', // Placeholder for future integration
};

const ExtensionHubPage = () => {
  const { extensionId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    // Check if user is authenticated
    if (!currentUser) {
      navigate('/login', { state: { from: `/hub/${extensionId}` } });
      return;
    }
    
    // Check if extension exists
    if (!EXTENSION_URLS[extensionId]) {
      setError('Extension not found');
      setLoading(false);
      return;
    }
    
    // If extension exists and user is authenticated, it's ready to load
    setLoading(false);
  }, [extensionId, currentUser, navigate]);

  // Handle going back to main page
  const handleBack = () => {
    navigate('/design-materials');
  };

  if (loading) {
    return (
      <div className="extension-hub-page loading">
        <div className="loader"></div>
        <p>Loading extension...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="extension-hub-page error">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={handleBack} className="back-button">
          <i className="fas fa-arrow-left"></i> Back to Engineering Hub
        </button>
      </div>
    );
  }

  return (
    <div className="extension-hub-page">
      <div className="extension-header">
        <button onClick={handleBack} className="back-button">
          <i className="fas fa-arrow-left"></i> Back to Engineering Hub
        </button>
        <div className="extension-title">
          {extensionId === 'study-boost' && <h1>Study Boost</h1>}
          {extensionId === 'concrete-design' && <h1>Concrete Design</h1>}
          {extensionId === 'material-explorer' && <h1>Material Explorer</h1>}
        </div>
      </div>
      
      <div className="extension-iframe-container">
        <iframe
          src={EXTENSION_URLS[extensionId]}
          title={`Engineering Hub - ${extensionId}`}
          className="extension-iframe"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
          allow="camera; microphone; fullscreen; geolocation"
        ></iframe>
      </div>
    </div>
  );
};

export default ExtensionHubPage;