import React from 'react';
import PropTypes from 'prop-types';
import './styles/controls.css';

/**
 * @typedef {Object} ViewControlsProps
 * @property {Object} camera - Camera position object with x, y, z
 * @property {(position: Object|string) => void} onViewChange - View change handler
 */

const ViewControls = ({ camera, onViewChange }) => {
  const viewPresets = {
    top: { x: 0, y: 10, z: 0 },
    front: { x: 0, y: 0, z: 10 },
    side: { x: 10, y: 0, z: 0 },
    isometric: { x: 10, y: 10, z: 10 }
  };

  const handlePresetClick = (preset) => {
    if (typeof preset === 'string') {
      onViewChange(preset);
    }
  };

  const handleCustomView = () => {
    // Example: Set a custom position
    onViewChange({ x: 5, y: 5, z: 5 });
  };

  return (
    <div className="view-controls">
      <button onClick={() => handlePresetClick('top')}>Top</button>
      <button onClick={() => handlePresetClick('front')}>Front</button>
      <button onClick={() => handlePresetClick('side')}>Side</button>
      <button onClick={() => handlePresetClick('isometric')}>Isometric</button>
      <button onClick={handleCustomView}>Custom</button>
    </div>
  );
};

ViewControls.propTypes = {
  camera: PropTypes.shape({
    x: PropTypes.number,
    y: PropTypes.number,
    z: PropTypes.number,
  }).isRequired,
  onViewChange: PropTypes.func.isRequired,
};

export default ViewControls;