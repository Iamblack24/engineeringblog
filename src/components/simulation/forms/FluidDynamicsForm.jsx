import React from 'react';
import { motion } from 'framer-motion';
import FormField from '../FormField';

const FluidDynamicsForm = ({ parameters, setParameters }) => {
  // Initialize fluid-specific parameters if they don't exist
  React.useEffect(() => {
    if (!parameters.fluidProperties) {
      setParameters({
        ...parameters,
        fluidProperties: {
          velocity: 2.0,
          density: 1000, // Water by default (kg/m³)
          viscosity: 0.001, // Water by default (Pa·s)
          temperature: 20, // Celsius
        },
        geometry: {
          ...(parameters.geometry || {}),
          radius: parameters.geometry?.radius || 0.1,
          length: parameters.geometry?.length || 5,
        },
        boundaryConditions: {
          inletPressure: 101.325, // Atmospheric pressure (kPa)
          outletPressure: 100.0, // Slightly lower for flow (kPa)
        }
      });
    }
  }, [parameters, setParameters]);

  const handleFluidPropertyChange = (property, value) => {
    setParameters({
      ...parameters,
      fluidProperties: {
        ...(parameters.fluidProperties || {}),
        [property]: value
      }
    });
  };

  const handleBoundaryConditionChange = (condition, value) => {
    setParameters({
      ...parameters,
      boundaryConditions: {
        ...(parameters.boundaryConditions || {}),
        [condition]: value
      }
    });
  };

  // Preset fluid types
  const fluidTypes = [
    { name: 'Water', density: 1000, viscosity: 0.001 },
    { name: 'Air', density: 1.225, viscosity: 0.000018 },
    { name: 'Oil', density: 900, viscosity: 0.03 },
    { name: 'Glycerin', density: 1260, viscosity: 0.95 },
    { name: 'Custom', density: parameters.fluidProperties?.density || 1000, viscosity: parameters.fluidProperties?.viscosity || 0.001 }
  ];

  return (
    <div className="space-y-4">
      {/* Fluid Type Selector */}
      <div className="mb-6">
        <label className="text-sm font-medium mb-2 block">Fluid Type</label>
        <div className="grid grid-cols-5 gap-2">
          {fluidTypes.map((fluid, index) => (
            <motion.button
              key={fluid.name}
              type="button"
              className={`py-2 px-3 rounded-md text-sm font-medium transition-colors text-center ${
                (fluid.name === 'Custom' ? 
                 (parameters.fluidProperties?.density !== fluidTypes[0].density || 
                  parameters.fluidProperties?.viscosity !== fluidTypes[0].viscosity) &&
                 (parameters.fluidProperties?.density !== fluidTypes[1].density || 
                  parameters.fluidProperties?.viscosity !== fluidTypes[1].viscosity) &&
                 (parameters.fluidProperties?.density !== fluidTypes[2].density || 
                  parameters.fluidProperties?.viscosity !== fluidTypes[2].viscosity) &&
                 (parameters.fluidProperties?.density !== fluidTypes[3].density || 
                  parameters.fluidProperties?.viscosity !== fluidTypes[3].viscosity) :
                 (parameters.fluidProperties?.density === fluid.density && 
                  parameters.fluidProperties?.viscosity === fluid.viscosity))
                  ? 'bg-blue-100 text-blue-800 border-blue-300 border' 
                  : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
              }`}
              onClick={() => {
                if (fluid.name !== 'Custom') {
                  handleFluidPropertyChange('density', fluid.density);
                  handleFluidPropertyChange('viscosity', fluid.viscosity);
                }
              }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              {fluid.name}
            </motion.button>
          ))}
        </div>
      </div>

      <h3 className="font-medium text-gray-700 border-b pb-2 mb-3">Fluid Properties</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <FormField
          label="Velocity (m/s)"
          type="number"
          value={parameters.fluidProperties?.velocity || 0}
          onChange={(value) => handleFluidPropertyChange('velocity', value)}
          placeholder="2.0"
          tooltip="Enter the flow velocity in meters per second"
          min={0.01}
          max={100}
          step={0.1}
        />
        
        <FormField
          label="Temperature (°C)"
          type="number"
          value={parameters.fluidProperties?.temperature || 20}
          onChange={(value) => handleFluidPropertyChange('temperature', value)}
          placeholder="20"
          tooltip="Enter the fluid temperature in degrees Celsius"
          min={-50}
          max={500}
          step={1}
        />
        
        <FormField
          label="Density (kg/m³)"
          type="number"
          value={parameters.fluidProperties?.density || 1000}
          onChange={(value) => handleFluidPropertyChange('density', value)}
          placeholder="1000"
          tooltip="Enter the fluid density in kg/m³"
          min={0.1}
          max={20000}
          step={0.1}
        />
        
        <FormField
          label="Viscosity (Pa·s)"
          type="number"
          value={parameters.fluidProperties?.viscosity || 0.001}
          onChange={(value) => handleFluidPropertyChange('viscosity', value)}
          placeholder="0.001"
          tooltip="Enter the dynamic viscosity in Pascal-seconds"
          min={0.000001}
          max={100}
          step={0.0001}
        />
      </div>

      <h3 className="font-medium text-gray-700 border-b pb-2 mb-3 mt-6">Geometry</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <FormField
          label="Pipe Radius (m)"
          type="number"
          value={parameters.geometry?.radius || 0.1}
          onChange={(value) => setParameters({
            ...parameters,
            geometry: { ...parameters.geometry, radius: value }
          })}
          placeholder="0.1"
          tooltip="Enter the pipe radius in meters"
          min={0.001}
          max={10}
          step={0.01}
        />
        
        <FormField
          label="Pipe Length (m)"
          type="number"
          value={parameters.geometry?.length || 5}
          onChange={(value) => setParameters({
            ...parameters,
            geometry: { ...parameters.geometry, length: value }
          })}
          placeholder="5"
          tooltip="Enter the pipe length in meters"
          min={0.1}
          max={100}
          step={0.1}
        />
      </div>

      <h3 className="font-medium text-gray-700 border-b pb-2 mb-3 mt-6">Boundary Conditions</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <FormField
          label="Inlet Pressure (kPa)"
          type="number"
          value={parameters.boundaryConditions?.inletPressure || 101.325}
          onChange={(value) => handleBoundaryConditionChange('inletPressure', value)}
          placeholder="101.325"
          tooltip="Enter the inlet pressure in kilopascals"
          min={0}
          max={10000}
          step={0.1}
        />
        
        <FormField
          label="Outlet Pressure (kPa)"
          type="number"
          value={parameters.boundaryConditions?.outletPressure || 100}
          onChange={(value) => handleBoundaryConditionChange('outletPressure', value)}
          placeholder="100"
          tooltip="Enter the outlet pressure in kilopascals"
          min={0}
          max={10000}
          step={0.1}
        />
      </div>
      
      <motion.div 
        className="bg-blue-50 p-3 rounded-md mt-4 text-sm text-blue-800"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-start">
          <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <span>
            This simulation calculates fluid flow properties in a pipe. Applications include water 
            supply systems, HVAC, oil pipelines, and gas distribution networks.
          </span>
        </div>
      </motion.div>
    </div>
  );
};

export default FluidDynamicsForm;