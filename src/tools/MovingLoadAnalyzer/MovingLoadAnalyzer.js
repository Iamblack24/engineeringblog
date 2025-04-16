import React, { useState, useEffect, useRef, useMemo } from 'react';
import './MovingLoadAnalyzer.css';
import { calculateBeamResponse } from './BeamCalculations';
import DiagramRenderer from './DiagramRenderer';
import { calculateInfluenceLine } from './InfluenceLineCalculator';

const MovingLoadAnalyzer = () => {
  // Beam configuration
  const [beamConfig, setBeamConfig] = useState({
    length: 10, // meters
    supportType: 'simply-supported', // simply-supported, cantilever, multi-span
    segments: 1, // For multi-span beams
    elasticModulus: 200, // GPa (steel default)
    momentOfInertia: 100000, // cm⁴
    additionalSupports: [], // For multi-span beams, position as fraction of length
  });

  // Load configuration
  const [loadConfig, setLoadConfig] = useState({
    magnitude: 100, // kN
    type: 'point', // point, distributed, train
    width: 0, // For distributed loads (meters)
    trainLoads: [], // For train of loads [{position (relative), magnitude}]
    position: 0, // Current position (0 to 1 representing fraction of beam length)
  });

  // Analysis options
  const [analysisOptions, setAnalysisOptions] = useState({
    showBendingMoment: true,
    showShearForce: true,
    showInfluenceLine: true,
    influenceLinePosition: 0.5, // Position for influence line calculation (0 to 1)
    showDeflection: false,
    showEnvelope: false,
    animationSpeed: 5, // seconds for full span traversal
  });

  // Animation state
  const [isAnimating, setIsAnimating] = useState(false);
  const animationRef = useRef(null);
  const [animationProgress, setAnimationProgress] = useState(0);
  
  // Results
  const [results, setResults] = useState({
    bendingMoment: [],
    shearForce: [],
    influenceLine: [],
    deflection: [],
    envelope: {
      maxBendingMoment: [],
      maxShearForce: [],
    }
  });

  // Calculate response when configuration changes or load position updates
  useEffect(() => {
    // Update load position based on animation if active
    if (isAnimating) {
      const newPosition = loadConfig.position;
      setLoadConfig(prev => ({ ...prev, position: newPosition }));
    }
    
    // Calculate beam response
    const response = calculateBeamResponse(beamConfig, loadConfig);
    
    // Calculate influence line if needed
    let influenceLine = [];
    if (analysisOptions.showInfluenceLine) {
      influenceLine = calculateInfluenceLine(
        beamConfig, 
        analysisOptions.influenceLinePosition
      );
    }
    
    // Update results
    setResults(prev => ({
      ...prev,
      bendingMoment: response.bendingMoment,
      shearForce: response.shearForce,
      deflection: response.deflection,
      influenceLine: influenceLine
    }));
  }, [beamConfig, loadConfig, analysisOptions.influenceLinePosition, isAnimating]);

  // Calculate envelope of maximum effects if enabled
  useEffect(() => {
    if (!analysisOptions.showEnvelope) return;
    
    // This would calculate max values at each point by stepping the load across the beam
    // Implementation would be too detailed to show here, but would involve:
    // 1. Iterating through multiple load positions (e.g., 100 steps)
    // 2. Tracking maximum values at each node
    // 3. Updating the envelope data
    
    // Placeholder for demonstration
    const calculateEnvelope = () => {
      const steps = 50;
      let maxMoment = Array(steps).fill(0);
      let maxShear = Array(steps).fill(0);
      
      // For each position
      for (let i = 0; i <= steps; i++) {
        const position = i / steps;
        const tempLoadConfig = { ...loadConfig, position };
        const response = calculateBeamResponse(beamConfig, tempLoadConfig);
        
        // Track maximum values
        response.bendingMoment.forEach((value, index) => {
          maxMoment[index] = Math.max(maxMoment[index] || 0, Math.abs(value));
        });
        
        response.shearForce.forEach((value, index) => {
          maxShear[index] = Math.max(maxShear[index] || 0, Math.abs(value));
        });
      }
      
      return {
        maxBendingMoment: maxMoment,
        maxShearForce: maxShear
      };
    };
    
    // Only calculate envelope when explicitly requested to avoid performance issues
    const envelope = calculateEnvelope();
    setResults(prev => ({ ...prev, envelope }));
  }, [analysisOptions.showEnvelope, beamConfig, loadConfig.magnitude, loadConfig.type, loadConfig.width]);

  // Animation logic
  useEffect(() => {
    let startTime;
    const duration = analysisOptions.animationSpeed * 1000; // Convert to ms
    
    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      setAnimationProgress(progress);
      setLoadConfig(prev => ({ ...prev, position: progress }));
      
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
      }
    };
    
    if (isAnimating) {
      animationRef.current = requestAnimationFrame(animate);
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isAnimating, analysisOptions.animationSpeed]);

  // Handle animation controls
  const startAnimation = () => {
    setLoadConfig(prev => ({ ...prev, position: 0 }));
    setIsAnimating(true);
  };
  
  const stopAnimation = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    setIsAnimating(false);
  };
  
  const handlePositionChange = (e) => {
    const position = parseFloat(e.target.value);
    setLoadConfig(prev => ({ ...prev, position }));
  };

  // Handle beam config changes
  const handleBeamConfigChange = (e) => {
    const { name, value } = e.target;
    setBeamConfig(prev => ({ ...prev, [name]: name === 'segments' ? parseInt(value) : parseFloat(value) }));
  };
  
  const handleSupportTypeChange = (e) => {
    setBeamConfig(prev => ({ ...prev, supportType: e.target.value }));
  };

  // Handle load config changes
  const handleLoadConfigChange = (e) => {
    const { name, value } = e.target;
    setLoadConfig(prev => ({ ...prev, [name]: parseFloat(value) }));
  };
  
  const handleLoadTypeChange = (e) => {
    setLoadConfig(prev => ({ ...prev, type: e.target.value }));
  };

  // Handle analysis options changes
  const handleAnalysisOptionChange = (e) => {
    const { name, checked, value, type } = e.target;
    setAnalysisOptions(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : parseFloat(value) 
    }));
  };

  // Calculate beam discretization for display
  const beamNodes = useMemo(() => {
    const numPoints = 100;
    return Array.from({ length: numPoints + 1 }, (_, i) => i / numPoints);
  }, []);

  // Convert beam configuration to readable format for display
  const beamConfigDisplay = useMemo(() => {
    return {
      length: `${beamConfig.length} m`,
      EI: `${(beamConfig.elasticModulus * 1e9 * beamConfig.momentOfInertia * 1e-8).toExponential(2)} N·m²`,
      supportType: beamConfig.supportType.replace(/-/g, ' ')
    };
  }, [beamConfig]);

  return (
    <div className="moving-load-analyzer">
      <h2>Moving Load Analysis Tool</h2>
      <p className="tool-description">
        Analyze the effects of moving loads on beams, visualize bending moment diagrams, 
        shear force diagrams, and influence lines as loads traverse the structure.
      </p>
      
      <div className="analyzer-container">
        <div className="configuration-panel">
          <div className="config-section">
            <h3>Beam Configuration</h3>
            <div className="input-group">
              <label htmlFor="length">Span Length (m):</label>
              <input 
                type="number" 
                id="length" 
                name="length" 
                min="1" 
                max="100" 
                step="0.5" 
                value={beamConfig.length} 
                onChange={handleBeamConfigChange} 
              />
            </div>
            
            <div className="input-group">
              <label htmlFor="supportType">Support Type:</label>
              <select 
                id="supportType" 
                value={beamConfig.supportType} 
                onChange={handleSupportTypeChange}
              >
                <option value="simply-supported">Simply Supported</option>
                <option value="cantilever">Cantilever</option>
                <option value="fixed-fixed">Fixed-Fixed</option>
                <option value="fixed-pinned">Fixed-Pinned</option>
                <option value="multi-span">Multi-Span</option>
              </select>
            </div>
            
            {beamConfig.supportType === 'multi-span' && (
              <div className="input-group">
                <label htmlFor="segments">Number of Spans:</label>
                <input 
                  type="number" 
                  id="segments" 
                  name="segments" 
                  min="2" 
                  max="5" 
                  value={beamConfig.segments} 
                  onChange={handleBeamConfigChange} 
                />
              </div>
            )}
            
            {beamConfig.supportType === 'multi-span' && (
              <p style={{fontSize: '0.8em', color: 'orange', marginTop: '-10px'}}>
                Note: Multi-span analysis uses simplified approximations and may be inaccurate.
              </p>
            )}
            
            <div className="input-group">
              <label htmlFor="elasticModulus">Elastic Modulus (GPa):</label>
              <input 
                type="number" 
                id="elasticModulus" 
                name="elasticModulus" 
                min="1" 
                max="1000" 
                value={beamConfig.elasticModulus} 
                onChange={handleBeamConfigChange} 
              />
            </div>
            
            <div className="input-group">
              <label htmlFor="momentOfInertia">Moment of Inertia (cm⁴):</label>
              <input 
                type="number" 
                id="momentOfInertia" 
                name="momentOfInertia" 
                min="1" 
                max="10000000" 
                value={beamConfig.momentOfInertia} 
                onChange={handleBeamConfigChange} 
              />
            </div>
          </div>
          
          <div className="config-section">
            <h3>Load Configuration</h3>
            <div className="input-group">
              <label htmlFor="magnitude">Load Magnitude (kN):</label>
              <input 
                type="number" 
                id="magnitude" 
                name="magnitude" 
                min="0.1" 
                max="10000" 
                value={loadConfig.magnitude} 
                onChange={handleLoadConfigChange} 
              />
            </div>
            
            <div className="input-group">
              <label htmlFor="loadType">Load Type:</label>
              <select 
                id="loadType" 
                value={loadConfig.type} 
                onChange={handleLoadTypeChange}
              >
                <option value="point">Point Load</option>
                <option value="distributed">Distributed Load</option>
                <option value="train">Train of Loads</option>
              </select>
            </div>
            
            {loadConfig.type === 'distributed' && (
              <div className="input-group">
                <label htmlFor="width">Load Width (m):</label>
                <input 
                  type="number" 
                  id="width" 
                  name="width" 
                  min="0.1" 
                  max={beamConfig.length} 
                  step="0.1" 
                  value={loadConfig.width} 
                  onChange={handleLoadConfigChange} 
                />
              </div>
            )}
            
            {loadConfig.type === 'train' && (
              <div className="train-loads-config">
                <p>Train load configuration</p>
                {/* Train load editor would go here - simplified for brevity */}
                <button className="secondary-button">Edit Train Loads</button>
                <p style={{fontSize: '0.8em', color: '#666'}}>
                  Define axle loads (kN) and relative positions (m) from the front.
                </p>
                {/* Example Inputs (replace with dynamic list) */}
                <div>Axle 1: Mag <input type="number" defaultValue="50"/> Pos <input type="number" defaultValue="0"/></div>
                <div>Axle 2: Mag <input type="number" defaultValue="50"/> Pos <input type="number" defaultValue="3"/></div>
              </div>
            )}
            
            <div className="input-group">
              <label htmlFor="position">Load Position:</label>
              <input 
                type="range" 
                id="position" 
                name="position" 
                min="0" 
                max="1" 
                step="0.01" 
                value={loadConfig.position} 
                onChange={handlePositionChange} 
                disabled={isAnimating}
              />
              <span>{(loadConfig.position * beamConfig.length).toFixed(2)} m</span>
            </div>
            
            <div className="animation-controls">
              <button 
                className="primary-button"
                onClick={isAnimating ? stopAnimation : startAnimation}
              >
                {isAnimating ? "Stop Animation" : "Start Animation"}
              </button>
              
              <div className="input-group">
                <label htmlFor="animationSpeed">Animation Speed (sec):</label>
                <input 
                  type="number" 
                  id="animationSpeed" 
                  name="animationSpeed" 
                  min="1" 
                  max="30" 
                  value={analysisOptions.animationSpeed} 
                  onChange={handleAnalysisOptionChange} 
                />
              </div>
            </div>
          </div>
          
          <div className="config-section">
            <h3>Analysis Options</h3>
            <div className="checkbox-group">
              <input 
                type="checkbox" 
                id="showBendingMoment" 
                name="showBendingMoment" 
                checked={analysisOptions.showBendingMoment} 
                onChange={handleAnalysisOptionChange} 
              />
              <label htmlFor="showBendingMoment">Show Bending Moment</label>
            </div>
            
            <div className="checkbox-group">
              <input 
                type="checkbox" 
                id="showShearForce" 
                name="showShearForce" 
                checked={analysisOptions.showShearForce} 
                onChange={handleAnalysisOptionChange} 
              />
              <label htmlFor="showShearForce">Show Shear Force</label>
            </div>
            
            <div className="checkbox-group">
              <input 
                type="checkbox" 
                id="showInfluenceLine" 
                name="showInfluenceLine" 
                checked={analysisOptions.showInfluenceLine} 
                onChange={handleAnalysisOptionChange} 
              />
              <label htmlFor="showInfluenceLine">Show Influence Line</label>
            </div>
            
            {analysisOptions.showInfluenceLine && (
              <div className="input-group">
                <label htmlFor="influenceLinePosition">Influence Line Position:</label>
                <input 
                  type="range" 
                  id="influenceLinePosition" 
                  name="influenceLinePosition" 
                  min="0" 
                  max="1" 
                  step="0.01" 
                  value={analysisOptions.influenceLinePosition} 
                  onChange={handleAnalysisOptionChange} 
                />
                <span>{(analysisOptions.influenceLinePosition * beamConfig.length).toFixed(2)} m</span>
              </div>
            )}
            
            {analysisOptions.showInfluenceLine &&
             (beamConfig.supportType === 'fixed-fixed' || beamConfig.supportType === 'fixed-pinned' || beamConfig.supportType === 'multi-span') && (
              <p style={{fontSize: '0.8em', color: 'orange', marginTop: '-10px'}}>
                Note: Influence Lines for this support type are approximate.
              </p>
            )}
            
            <div className="checkbox-group">
              <input 
                type="checkbox" 
                id="showDeflection" 
                name="showDeflection" 
                checked={analysisOptions.showDeflection} 
                onChange={handleAnalysisOptionChange} 
              />
              <label htmlFor="showDeflection">Show Deflection</label>
            </div>
            
            {analysisOptions.showDeflection && (
              <p style={{fontSize: '0.8em', color: 'orange', marginTop: '-10px'}}>
                Note: Deflection calculations may be approximate or placeholders for some load/support types.
              </p>
            )}
            
            <div className="checkbox-group">
              <input 
                type="checkbox" 
                id="showEnvelope" 
                name="showEnvelope" 
                checked={analysisOptions.showEnvelope} 
                onChange={handleAnalysisOptionChange} 
              />
              <label htmlFor="showEnvelope">Show Max Effect Envelope</label>
            </div>
          </div>
        </div>
        
        <div className="visualization-panel">
          <div className="beam-display">
            <h3>Beam Configuration: {beamConfigDisplay.length}, {beamConfigDisplay.supportType}</h3>
            
            <DiagramRenderer
              beamConfig={beamConfig}
              loadConfig={loadConfig}
              analysisOptions={analysisOptions}
              results={results}
              beamNodes={beamNodes}
            />
          </div>
          
          <div className="results-display">
            <h3>Analysis Results</h3>
            <div className="result-values">
              <div className="result-item">
                <span className="result-label">Moment at Load Position:</span>
                <span className="result-value">
                  {results.bendingMoment.length > 0 
                    ? (results.bendingMoment[Math.floor(loadConfig.position * 100)] || 0).toFixed(2) 
                    : 0} kN·m
                </span>
              </div>
              
              <div className="result-item">
                <span className="result-label">Shear at Load Position:</span>
                <span className="result-value">
                  {results.shearForce.length > 0 
                    ? (results.shearForce[Math.floor(loadConfig.position * 100)] || 0).toFixed(2) 
                    : 0} kN
                </span>
              </div>
              
              <div className="result-item">
                <span className="result-label">Maximum Bending Moment:</span>
                <span className="result-value">
                  {results.bendingMoment.length > 0 
                    ? Math.max(...results.bendingMoment.map(Math.abs)).toFixed(2) 
                    : 0} kN·m
                </span>
              </div>
              
              <div className="result-item">
                <span className="result-label">Maximum Shear Force:</span>
                <span className="result-value">
                  {results.shearForce.length > 0 
                    ? Math.max(...results.shearForce.map(Math.abs)).toFixed(2) 
                    : 0} kN
                </span>
              </div>
              
              {analysisOptions.showInfluenceLine && (
                <div className="result-item">
                  <span className="result-label">Influence Value at Load:</span>
                  <span className="result-value">
                    {results.influenceLine.length > 0 
                      ? (results.influenceLine[Math.floor(loadConfig.position * 100)] || 0).toFixed(4) 
                      : 0}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovingLoadAnalyzer;