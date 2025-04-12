import React from 'react';
import { motion } from 'framer-motion';
import FormField from '../FormField';

const StressAnalysisForm = ({ parameters, setParameters }) => {
  // Initialize stress analysis-specific parameters if they don't exist
  React.useEffect(() => {
    if (!parameters.materialProperties) {
      setParameters({
        ...parameters,
        material: parameters.material || 'steel',
        materialProperties: {
          youngsModulus: 200e9, // Steel by default (Pa)
          poissonsRatio: 0.3,  // Steel by default
          yieldStrength: 250e6 // Steel by default (Pa)
        },
        geometry: {
          ...(parameters.geometry || {}),
          radius: parameters.geometry?.radius || 0.05,
          length: parameters.geometry?.length || 1,
          thickness: 0.01 // For hollow sections
        },
        load: {
          ...(parameters.load || {}),
          value: parameters.load?.value || 10000,
          type: 'axial', // axial, bending, torsion
          direction: [0, 0, -1] // Unit vector
        },
        constraintType: 'fixed-free' // fixed-free, fixed-fixed, etc.
      });
    }
  }, [parameters, setParameters]);

  const handleMaterialPropertyChange = (property, value) => {
    setParameters({
      ...parameters,
      materialProperties: {
        ...(parameters.materialProperties || {}),
        [property]: value
      }
    });
  };

  const handleLoadChange = (property, value) => {
    setParameters({
      ...parameters,
      load: {
        ...(parameters.load || {}),
        [property]: value
      }
    });
  };

  // Preset material types
  const materialTypes = [
    { name: 'Steel', youngsModulus: 200e9, poissonsRatio: 0.3, yieldStrength: 250e6 },
    { name: 'Aluminum', youngsModulus: 69e9, poissonsRatio: 0.33, yieldStrength: 95e6 },
    { name: 'Concrete', youngsModulus: 30e9, poissonsRatio: 0.2, yieldStrength: 40e6 },
    { name: 'Titanium', youngsModulus: 110e9, poissonsRatio: 0.34, yieldStrength: 140e6 },
    { name: 'Custom', youngsModulus: parameters.materialProperties?.youngsModulus || 200e9, poissonsRatio: parameters.materialProperties?.poissonsRatio || 0.3, yieldStrength: parameters.materialProperties?.yieldStrength || 250e6 }
  ];

  return (
    <div className="space-y-4">
      {/* Material Type Selector */}
      <div className="mb-6">
        <label className="text-sm font-medium mb-2 block">Material Type</label>
        <div className="grid grid-cols-5 gap-2">
          {materialTypes.map((material) => (
            <motion.button
              key={material.name}
              type="button"
              className={`py-2 px-3 rounded-md text-sm font-medium transition-colors text-center ${
                (material.name === 'Custom' ? 
                 (parameters.materialProperties?.youngsModulus !== materialTypes[0].youngsModulus || 
                  parameters.materialProperties?.poissonsRatio !== materialTypes[0].poissonsRatio) &&
                 (parameters.materialProperties?.youngsModulus !== materialTypes[1].youngsModulus || 
                  parameters.materialProperties?.poissonsRatio !== materialTypes[1].poissonsRatio) &&
                 (parameters.materialProperties?.youngsModulus !== materialTypes[2].youngsModulus || 
                  parameters.materialProperties?.poissonsRatio !== materialTypes[2].poissonsRatio) &&
                 (parameters.materialProperties?.youngsModulus !== materialTypes[3].youngsModulus || 
                  parameters.materialProperties?.poissonsRatio !== materialTypes[3].poissonsRatio) :
                 (parameters.materialProperties?.youngsModulus === material.youngsModulus && 
                  parameters.materialProperties?.poissonsRatio === material.poissonsRatio))
                  ? 'bg-blue-100 text-blue-800 border-blue-300 border' 
                  : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
              }`}
              onClick={() => {
                if (material.name !== 'Custom') {
                  setParameters({
                    ...parameters,
                    material: material.name.toLowerCase(),
                    materialProperties: {
                      youngsModulus: material.youngsModulus,
                      poissonsRatio: material.poissonsRatio,
                      yieldStrength: material.yieldStrength
                    }
                  });
                }
              }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              {material.name}
            </motion.button>
          ))}
        </div>
      </div>

      <h3 className="font-medium text-gray-700 border-b pb-2 mb-3">Material Properties</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <FormField
          label="Young's Modulus (GPa)"
          type="number"
          value={(parameters.materialProperties?.youngsModulus || 200e9) / 1e9}
          onChange={(value) => handleMaterialPropertyChange('youngsModulus', value * 1e9)}
          placeholder="200"
          tooltip="Enter Young's modulus in gigapascals (GPa)"
          min={0.1}
          max={1000}
          step={0.1}
        />
        
        <FormField
          label="Poisson's Ratio"
          type="number"
          value={parameters.materialProperties?.poissonsRatio || 0.3}
          onChange={(value) => handleMaterialPropertyChange('poissonsRatio', value)}
          placeholder="0.3"
          tooltip="Enter Poisson's ratio (dimensionless, typically between 0 and 0.5)"
          min={0}
          max={0.5}
          step={0.01}
        />
        
        <FormField
          label="Yield Strength (MPa)"
          type="number"
          value={(parameters.materialProperties?.yieldStrength || 250e6) / 1e6}
          onChange={(value) => handleMaterialPropertyChange('yieldStrength', value * 1e6)}
          placeholder="250"
          tooltip="Enter the yield strength in megapascals (MPa)"
          min={1}
          max={5000}
          step={1}
        />
        
        <FormField
          label="Density (kg/m³)"
          type="number"
          value={parameters.materialProperties?.density || 7850}
          onChange={(value) => handleMaterialPropertyChange('density', value)}
          placeholder="7850"
          tooltip="Enter the material density in kg/m³"
          min={100}
          max={20000}
          step={10}
        />
      </div>

      <h3 className="font-medium text-gray-700 border-b pb-2 mb-3 mt-6">Geometry</h3>
      
      <FormField
        label="Cross-Section Type"
        type="text"
        value={parameters.geometry?.crossSectionType || 'circular'}
        onChange={(value) => setParameters({
          ...parameters,
          geometry: { ...parameters.geometry, crossSectionType: value }
        })}
        placeholder="circular"
        tooltip="Enter the cross-section type (circular, rectangular, I-beam, etc.)"
      />
      
      <div className="grid grid-cols-2 gap-4 mt-3">
        <FormField
          label="Radius/Width (m)"
          type="number"
          value={parameters.geometry?.radius || 0.05}
          onChange={(value) => setParameters({
            ...parameters,
            geometry: { ...parameters.geometry, radius: value }
          })}
          placeholder="0.05"
          tooltip="Enter the radius (for circular) or width (for rectangular) in meters"
          min={0.001}
          max={10}
          step={0.001}
        />
        
        <FormField
          label="Length (m)"
          type="number"
          value={parameters.geometry?.length || 1}
          onChange={(value) => setParameters({
            ...parameters,
            geometry: { ...parameters.geometry, length: value }
          })}
          placeholder="1"
          tooltip="Enter the length in meters"
          min={0.01}
          max={100}
          step={0.01}
        />
        
        <FormField
          label="Thickness (m)"
          type="number"
          value={parameters.geometry?.thickness || 0.01}
          onChange={(value) => setParameters({
            ...parameters,
            geometry: { ...parameters.geometry, thickness: value }
          })}
          placeholder="0.01"
          tooltip="Enter the wall thickness in meters (for hollow sections)"
          min={0.0001}
          max={1}
          step={0.001}
        />
        
        <FormField
          label="Height (m)"
          type="number"
          value={parameters.geometry?.height || 0.05}
          onChange={(value) => setParameters({
            ...parameters,
            geometry: { ...parameters.geometry, height: value }
          })}
          placeholder="0.05"
          tooltip="Enter the height in meters (for non-circular sections)"
          min={0.001}
          max={10}
          step={0.001}
        />
      </div>

      <h3 className="font-medium text-gray-700 border-b pb-2 mb-3 mt-6">Loading Conditions</h3>
      
      <div className="grid grid-cols-1 gap-4 mb-4">
        <label className="text-sm font-medium">Load Type</label>
        <div className="grid grid-cols-3 gap-2">
          {['Axial', 'Bending', 'Torsion'].map((type) => (
            <motion.button
              key={type}
              type="button"
              className={`py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                parameters.load?.type === type.toLowerCase()
                  ? 'bg-blue-100 text-blue-800 border-blue-300 border' 
                  : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
              }`}
              onClick={() => handleLoadChange('type', type.toLowerCase())}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              {type}
            </motion.button>
          ))}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          label="Load Value (N or N·m)"
          type="number"
          value={parameters.load?.value || 10000}
          onChange={(value) => handleLoadChange('value', value)}
          placeholder="10000"
          tooltip={`Enter the load value in ${parameters.load?.type === 'torsion' ? 'Newton-meters (N·m)' : 'Newtons (N)'}`}
          min={1}
          max={1e8}
          step={100}
        />
        
        <div className="space-y-1">
          <label className="text-sm font-medium">Constraint Type</label>
          <select
            value={parameters.constraintType || 'fixed-free'}
            onChange={(e) => setParameters({...parameters, constraintType: e.target.value})}
            className="w-full p-2 border rounded focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
          >
            <option value="fixed-free">Fixed-Free (Cantilever)</option>
            <option value="fixed-fixed">Fixed-Fixed</option>
            <option value="pinned-pinned">Pinned-Pinned</option>
            <option value="fixed-pinned">Fixed-Pinned</option>
            <option value="fixed-roller">Fixed-Roller</option>
          </select>
        </div>
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
            This simulation analyzes stress distributions in mechanical components. It computes 
            stresses, strains, displacements, and safety factors for structural elements.
          </span>
        </div>
      </motion.div>
    </div>
  );
};

export default StressAnalysisForm;