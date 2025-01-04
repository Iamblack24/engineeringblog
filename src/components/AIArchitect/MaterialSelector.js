import React from 'react';
import PropTypes from 'prop-types';
import { materialPresets} from './utils/materialPresets';
import './styles/controls.css';

const MaterialSelector = ({ materials, onSelect, disabled = false }) => {
  const materialTypes = ['walls', 'floors', 'ceiling'];

  return (
    <div className="material-selector">
      <h3>Materials</h3>
      {materialTypes.map(type => (
        <div key={type} className="material-group">
          <label>{type.charAt(0).toUpperCase() + type.slice(1)}</label>
          <select 
            value={materials[type]}
            onChange={(e) => onSelect(type, e.target.value)}
            disabled={disabled}
          >
            {materialPresets[type]?.map(material => (
              <option key={material.id} value={material.id}>
                {material.name}
              </option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
};

MaterialSelector.propTypes = {
  materials: PropTypes.shape({
    walls: PropTypes.string.isRequired,
    floor: PropTypes.string.isRequired,
    ceiling: PropTypes.string.isRequired
  }).isRequired,
  onSelect: PropTypes.func.isRequired,
  disabled: PropTypes.bool
};

export default MaterialSelector;