import React, { useState, useEffect } from 'react';
import './FrameCalculator.css';

const FrameCalculator = () => {
  const [showIframe, setShowIframe] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  const handleIframeLoad = () => {
    setLoading(false);
  };

  return (
    <div className="frame-calculator-wrapper">
      <div className="disclaimer-banner">
        <div className="disclaimer-content">
          <span className="disclaimer-icon">ℹ️</span>
          <p>For the best experience, please use a desktop computer or laptop to access this calculator.</p>
        </div>
      </div>

      <div className="calculator-controls">
        <button 
          onClick={() => setShowIframe(!showIframe)}
          className="toggle-calculator-btn"
        >
          {showIframe ? '✕ Hide Calculator' : '🔧 Open Calculator'}
        </button>
      </div>

      {isMobile && (
        <div className="mobile-warning">
          <p>⚠️ This calculator is optimized for larger screens. Some features may not work correctly on mobile devices.</p>
        </div>
      )}

      {showIframe && (
        <div className="calculator-container">
          {loading && (
            <div className="loading-overlay">
              <div className="loading-spinner"></div>
              <p>Loading calculator...</p>
            </div>
          )}
          <iframe
            src="https://beautiful-gumption-1eebc1.netlify.app/"
            title="Frame Calculator"
            onLoad={handleIframeLoad}
            className={loading ? 'loading' : ''}
            sandbox="allow-same-origin allow-scripts allow-forms"
          />
        </div>
      )}
    </div>
  );
};

export default FrameCalculator;