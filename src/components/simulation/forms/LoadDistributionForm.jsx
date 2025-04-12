import React from 'react';
import { motion } from 'framer-motion';
import FormField from '../FormField';

const LoadDistributionForm = ({ parameters, onChange, errors }) => {
  // Do NOT use setParameters directly
  
  const handleFieldChange = (field, value) => {
    // Call the parent's onChange function
    onChange(field, value);
  };

  // Preset material types
  const materialTypes = [
    { name: 'Steel', youngsModulus: 200e9, poissonsRatio: 0.3, density: 7850, allowableStress: 165e6 },
    { name: 'Aluminum', youngsModulus: 69e9, poissonsRatio: 0.33, density: 2700, allowableStress: 100e6 },
    { name: 'Concrete', youngsModulus: 30e9, poissonsRatio: 0.2, density: 2400, allowableStress: 15e6 },
    { name: 'Timber', youngsModulus: 11e9, poissonsRatio: 0.3, density: 600, allowableStress: 14e6 },
    { name: 'Custom', youngsModulus: parameters.materialProperties?.youngsModulus || 200e9, poissonsRatio: parameters.materialProperties?.poissonsRatio || 0.3, density: parameters.materialProperties?.density || 7850, allowableStress: parameters.materialProperties?.allowableStress || 165e6 }
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
                  parameters.materialProperties?.allowableStress !== materialTypes[0].allowableStress) &&
                 (parameters.materialProperties?.youngsModulus !== materialTypes[1].youngsModulus || 
                  parameters.materialProperties?.allowableStress !== materialTypes[1].allowableStress) &&
                 (parameters.materialProperties?.youngsModulus !== materialTypes[2].youngsModulus || 
                  parameters.materialProperties?.allowableStress !== materialTypes[2].allowableStress) &&
                 (parameters.materialProperties?.youngsModulus !== materialTypes[3].youngsModulus || 
                  parameters.materialProperties?.allowableStress !== materialTypes[3].allowableStress) :
                 (parameters.materialProperties?.youngsModulus === material.youngsModulus && 
                  parameters.materialProperties?.allowableStress === material.allowableStress))
                  ? 'bg-blue-100 text-blue-800 border-blue-300 border' 
                  : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
              }`}
              onClick={() => {
                if (material.name !== 'Custom') {
                  onChange('material', material.name.toLowerCase());
                  onChange('materialProperties', {
                    youngsModulus: material.youngsModulus,
                    poissonsRatio: material.poissonsRatio,
                    density: material.density,
                    allowableStress: material.allowableStress
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
          onChange={(value) => handleFieldChange('materialProperties.youngsModulus', value * 1e9)}
          placeholder="200"
          tooltip="Enter Young's modulus in gigapascals (GPa)"
          min={0.1}
          max={1000}
          step={0.1}
        />
        
        <FormField
          label="Density (kg/m³)"
          type="number"
          value={parameters.materialProperties?.density || 7850}
          onChange={(value) => handleFieldChange('materialProperties.density', value)}
          placeholder="7850"
          tooltip="Enter the material density in kg/m³"
          min={10}
          max={20000}
          step={10}
        />
        
        <FormField
          label="Poisson's Ratio"
          type="number"
          value={parameters.materialProperties?.poissonsRatio || 0.3}
          onChange={(value) => handleFieldChange('materialProperties.poissonsRatio', value)}
          placeholder="0.3"
          tooltip="Enter Poisson's ratio (dimensionless, typically between 0 and 0.5)"
          min={0}
          max={0.5}
          step={0.01}
        />
        
        <FormField
          label="Allowable Stress (MPa)"
          type="number"
          value={(parameters.materialProperties?.allowableStress || 165e6) / 1e6}
          onChange={(value) => handleFieldChange('materialProperties.allowableStress', value * 1e6)}
          placeholder="165"
          tooltip="Enter the allowable stress in megapascals (MPa)"
          min={1}
          max={2000}
          step={1}
        />
      </div>

      <h3 className="font-medium text-gray-700 border-b pb-2 mb-3 mt-6">Geometry</h3>
      
      <div className="grid grid-cols-1 gap-4 mb-4">
        <label className="text-sm font-medium">Cross-Section Type</label>
        <div className="grid grid-cols-3 gap-2">
          {['Circular', 'Rectangular', 'I-Beam'].map((type) => (
            <motion.button
              key={type}
              type="button"
              className={`py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                parameters.geometry?.crossSection === type.toLowerCase()
                  ? 'bg-blue-100 text-blue-800 border-blue-300 border' 
                  : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
              }`}
              onClick={() => handleFieldChange('geometry.crossSection', type.toLowerCase())}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              {type}
            </motion.button>
          ))}
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        {parameters.geometry?.crossSection === 'circular' && (
          <FormField
            label="Radius (m)"
            type="number"
            value={parameters.geometry?.radius || 0.5}
            onChange={(value) => handleFieldChange('geometry.radius', value)}
            placeholder="0.5"
            tooltip="Enter the radius in meters"
            min={0.001}
            max={10}
            step={0.001}
          />
        )}
        
        {parameters.geometry?.crossSection === 'rectangular' && (
          <>
            <FormField
              label="Width (m)"
              type="number"
              value={parameters.geometry?.width || 0.1}
              onChange={(value) => handleFieldChange('geometry.width', value)}
              placeholder="0.1"
              tooltip="Enter the width in meters"
              min={0.001}
              max={10}
              step={0.001}
            />
            
            <FormField
              label="Height (m)"
              type="number"
              value={parameters.geometry?.height || 0.2}
              onChange={(value) => handleFieldChange('geometry.height', value)}
              placeholder="0.2"
              tooltip="Enter the height in meters"
              min={0.001}
              max={10}
              step={0.001}
            />
          </>
        )}
        
        {parameters.geometry?.crossSection === 'i-beam' && (
          <>
            <FormField
              label="Flange Width (m)"
              type="number"
              value={parameters.geometry?.flangeWidth || 0.1}
              onChange={(value) => handleFieldChange('geometry.flangeWidth', value)}
              placeholder="0.1"
              tooltip="Enter the flange width in meters"
              min={0.001}
              max={1}
              step={0.001}
            />
            
            <FormField
              label="Flange Thickness (m)"
              type="number"
              value={parameters.geometry?.flangeThickness || 0.01}
              onChange={(value) => handleFieldChange('geometry.flangeThickness', value)}
              placeholder="0.01"
              tooltip="Enter the flange thickness in meters"
              min={0.001}
              max={0.1}
              step={0.001}
            />
            
            <FormField
              label="Web Height (m)"
              type="number"
              value={parameters.geometry?.webHeight || 0.2}
              onChange={(value) => handleFieldChange('geometry.webHeight', value)}
              placeholder="0.2"
              tooltip="Enter the web height in meters"
              min={0.01}
              max={2}
              step={0.01}
            />
            
            <FormField
              label="Web Thickness (m)"
              type="number"
              value={parameters.geometry?.webThickness || 0.01}
              onChange={(value) => handleFieldChange('geometry.webThickness', value)}
              placeholder="0.01"
              tooltip="Enter the web thickness in meters"
              min={0.001}
              max={0.1}
              step={0.001}
            />
          </>
        )}
        
        <FormField
          label="Length (m)"
          type="number"
          value={parameters.geometry?.length || 2}
          onChange={(value) => handleFieldChange('geometry.length', value)}
          placeholder="2"
          tooltip="Enter the member length in meters"
          min={0.1}
          max={100}
          step={0.1}
        />
      </div>

      <h3 className="font-medium text-gray-700 border-b pb-2 mb-3 mt-6">Loading Conditions</h3>
      
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 mb-4">
          <label className="text-sm font-medium">Support Type</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'cantilever', label: 'Cantilever' },
              { id: 'simply-supported', label: 'Simply Supported' },
              { id: 'fixed-fixed', label: 'Fixed-Fixed' }
            ].map((support) => (
              <motion.button
                key={support.id}
                type="button"
                className={`py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  parameters.loadDistribution?.supports === support.id
                    ? 'bg-blue-100 text-blue-800 border-blue-300 border' 
                    : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                }`}
                onClick={() => handleFieldChange('loadDistribution.supports', support.id)}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                {support.label}
              </motion.button>
            ))}
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-4 mb-4">
          <label className="text-sm font-medium">Load Type</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'point', label: 'Point Load' },
              { id: 'distributed', label: 'Distributed Load' },
              { id: 'moment', label: 'Moment' }
            ].map((loadType) => (
              <motion.button
                key={loadType.id}
                type="button"
                className={`py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  parameters.load?.type === loadType.id
                    ? 'bg-blue-100 text-blue-800 border-blue-300 border' 
                    : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                }`}
                onClick={() => handleFieldChange('load.type', loadType.id)}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                {loadType.label}
              </motion.button>
            ))}
          </div>
        </div>
        
        {parameters.load?.type === 'point' && (
          <div className="grid grid-cols-1 gap-4 mb-4">
            <label className="text-sm font-medium">Load Position</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'end', label: 'At End' },
                { id: 'middle', label: 'At Middle' },
                { id: 'custom', label: 'Custom Position' }
              ].map((position) => (
                <motion.button
                  key={position.id}
                  type="button"
                  className={`py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                    parameters.load?.position === position.id
                      ? 'bg-blue-100 text-blue-800 border-blue-300 border' 
                      : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                  }`}
                  onClick={() => handleFieldChange('load.position', position.id)}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  {position.label}
                </motion.button>
              ))}
            </div>
          </div>
        )}
        
        {parameters.load?.position === 'custom' && (
          <FormField
            label="Load Position (m from support)"
            type="number"
            value={parameters.load?.positionValue || 1}
            onChange={(value) => handleFieldChange('load.positionValue', value)}
            placeholder="1"
            tooltip="Enter the position of the load measured from the support in meters"
            min={0}
            max={parameters.geometry?.length || 2}
            step={0.1}
          />
        )}
        
        <FormField
          label={`Load Value (${parameters.load?.type === 'distributed' ? 'N/m' : parameters.load?.type === 'moment' ? 'N·m' : 'N'})`}
          type="number"
          value={parameters.load?.value || 1000}
          onChange={(value) => handleFieldChange('load.value', value)}
          placeholder="1000"
          tooltip={`Enter the ${parameters.load?.type === 'distributed' ? 'distributed load in Newtons per meter' : parameters.load?.type === 'moment' ? 'moment in Newton-meters' : 'concentrated load in Newtons'}`}
          min={1}
          max={1e7}
          step={10}
        />
        
        <FormField
          label="Analysis Segments"
          type="number"
          value={parameters.loadDistribution?.segments || 20}
          onChange={(value) => handleFieldChange('loadDistribution.segments', value)}
          placeholder="20"
          tooltip="Number of segments to divide the member for analysis (higher = more precise but slower)"
          min={10}
          max={100}
          step={5}
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
            This simulation calculates how forces distribute through structural members. Results include
            internal forces, deflections, stresses, and safety factors. Common applications include beams,
            columns, and other structural elements in building design.
          </span>
        </div>
      </motion.div>

      {/* Example fields */}
      <FormField
        label="Material"
        name="material"
        type="select"
        value={parameters.material}
        onChange={handleFieldChange}
        options={[
          { value: 'steel', label: 'Steel' },
          { value: 'aluminum', label: 'Aluminum' },
          { value: 'titanium', label: 'Titanium' }
        ]}
        required
        error={errors['material']}
      />
      
      <FormField
        label="Beam Length (m)"
        name="geometry.length"
        type="number"
        value={parameters.geometry?.length}
        onChange={handleFieldChange}
        min={0.1}
        max={1000}
        required
        error={errors['geometry.length']}
      />
      
      <FormField
        label="Load Value (N)"
        name="load.value"
        type="number"
        value={parameters.load?.value}
        onChange={handleFieldChange}
        min={1}
        required
        error={errors['load.value']}
      />
    </div>
  );
};

export default LoadDistributionForm;