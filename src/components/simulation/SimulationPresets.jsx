import React from 'react';
import { motion } from 'framer-motion';

// Predefined simulation presets
const presets = [
  {
    id: 'steel-column',
    name: 'Steel Column Under Compression',
    description: 'Standard steel column under axial compression load',
    simulationType: 'load-distribution',
    parameters: {
      material: 'steel',
      geometry: {
        radius: 0.15,
        length: 3,
      },
      load: {
        value: 50000,
      },
    },
    icon: '🏗️',
  },
  {
    id: 'concrete-pillar',
    name: 'Concrete Bridge Pillar',
    description: 'Reinforced concrete pillar with vertical load',
    simulationType: 'load-distribution',
    parameters: {
      material: 'reinforced concrete',
      geometry: {
        radius: 0.8,
        length: 5,
      },
      load: {
        value: 150000,
      },
    },
    icon: '🌉',
  },
  {
    id: 'water-pipe',
    name: 'Water Pipe Flow',
    description: 'Standard water flow in circular pipe',
    simulationType: 'fluid-dynamics',
    parameters: {
      fluidProperties: {
        velocity: 2.5,
        density: 998,
        viscosity: 0.001,
      },
      geometry: {
        radius: 0.1,
        length: 10,
      },
    },
    icon: '🌊',
  },
  {
    id: 'aluminum-beam',
    name: 'Aluminum Beam',
    description: 'Aluminum beam under bending stress',
    simulationType: 'stress-analysis',
    parameters: {
      material: 'aluminum',
      geometry: {
        radius: 0.05,
        length: 2,
      },
      load: {
        value: 5000,
      },
    },
    icon: '🔧',
  },
];

const SimulationPresets = ({ onSelect }) => {
  return (
    <div className="presets-container bg-gray-50 rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Common Simulation Presets</h2>
      <p className="text-gray-600 mb-6">
        Select a preset to quickly configure common simulation scenarios
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {presets.map((preset) => (
          <motion.div
            key={preset.id}
            className="preset-card bg-white rounded-lg p-4 border cursor-pointer hover:shadow-md transition-shadow"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(preset)}
          >
            <div className="text-3xl mb-2">{preset.icon}</div>
            <h3 className="font-medium text-gray-900">{preset.name}</h3>
            <p className="text-gray-500 text-sm mt-1">{preset.description}</p>
            <div className="mt-3 pt-3 border-t text-xs text-gray-400">
              {preset.simulationType.replace('-', ' ')}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default SimulationPresets;