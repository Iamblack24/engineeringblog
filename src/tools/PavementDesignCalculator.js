import React, { useState } from 'react';
import './PavementDesignCalculator.css';

const PavementDesignCalculator = () => {
  const [pavementData, setPavementData] = useState({
    // Project basics
    projectInfo: {
      projectName: '',
      location: '',
      designLife: 20,          // years
      constructionYear: new Date().getFullYear(),
      roadClassification: 'arterial', // arterial, collector, local
      designReliability: 90,   // percentage (85-99.9)
      overallStandardDeviation: 0.45, // (0.3-0.5)
    },

    // Traffic data (ESAL calculation inputs)
    trafficData: {
      initialADT: 0,           // Average Daily Traffic
      growthRate: 2,           // percentage
      designPeriod: 20,        // years
      truckPercentage: 0,      // percentage
      truckTypes: {
        class4: 0,  // Single unit - 2 axle
        class5: 0,  // Single unit - 2 axle, 6 tire
        class6: 0,  // Single unit - 3 axle
        class7: 0,  // Single unit - 4+ axle
        class8: 0,  // Single trailer - 3-4 axle
        class9: 0,  // Single trailer - 5 axle
        class10: 0, // Single trailer - 6+ axle
        class11: 0, // Multi trailer - 5- axle
        class12: 0, // Multi trailer - 6 axle
        class13: 0  // Multi trailer - 7+ axle
      },
      axleLoadDistribution: {
        singleAxle: {
          under18k: 50,        // percentage
          '18k-36k': 35,
          above36k: 15
        },
        tandemAxle: {
          under35k: 45,
          '35k-70k': 40,
          above70k: 15
        },
        tridemAxle: {
          under52k: 45,
          '52k-104k': 40,
          above104k: 15
        }
      },
      laneDistribution: 0.9,   // factor
      directionalSplit: 0.5,   // factor
      designLane: 1,           // number
      hourlyDistribution: 0.15 // peak hour factor
    },

    // Environmental conditions
    environmentalData: {
      region: 'urban',         // urban, rural, interstate
      climate: 'temperate',    // temperate, hot, cold
      drainageQuality: 'good', // good, fair, poor
      freezeThawCycles: 0,     // annual cycles
      annualRainfall: 0,       // mm
      waterTable: 'deep',      // deep, shallow
      moistureCondition: 'wet', // dry, wet, saturated
      freezeIndex: 0,          // degree-days
      temperatureRange: {
        average: 20,           // °C
        maximum: 35,           // °C
        minimum: 5             // °C
      },
      thermalConductivity: 1.5, // W/m·K
      thermalResistivity: 0.67  // m·K/W
    },

    // Soil characteristics
    soilData: {
      soilType: 'granular',    // granular, fine
      soilClassification: 'A-1-a', // AASHTO classification
      soilCBR: 0,             // California Bearing Ratio
      resilientModulus: 0,    // psi (Mr)
      liquidLimit: 0,          // percentage
      plasticityIndex: 0,      // percentage
      swellingPotential: 'low', // low, medium, high
      moistureSensitivity: 'low', // low, medium, high
      frostSusceptibility: 'low', // low, medium, high
      permeability: 0,         // cm/sec
      maximumDryDensity: 0,    // pcf
      optimumMoisture: 0,      // percentage
      particleDistribution: {
        gravel: 0,            // percentage
        sand: 0,
        silt: 0,
        clay: 0
      }
    },

    // Material properties
    materials: {
      asphalt: {
        grade: 'PG64-22',
        modulus: 400000,      // psi (dynamic modulus)
        stability: 1800,      // lbs (Marshall)
        flow: 12,            // 0.01 inch
        airVoids: 4,         // percentage
        vma: 14,            // Voids in Mineral Aggregate
        vfa: 70,            // Voids Filled with Asphalt
        bitumenContent: 5.2, // percentage
        aggregateGradation: {
          passing19mm: 100,  // percentage
          passing12_5mm: 95,
          passing9_5mm: 85,
          passing4_75mm: 65,
          passing2_36mm: 48,
          passing0_075mm: 5
        },
        thermalProperties: {
          thermalConductivity: 1.2, // W/m·K
          specificHeat: 920,       // J/kg·K
          thermalDiffusivity: 5.6e-7 // m²/s
        },
        quality: 1.0         // factor
      },
      base: {
        type: 'crushed_stone',
        cbr: 80,             // percentage
        resilientModulus: 30000, // psi
        maxDensity: 145,     // pcf
        optimumMoisture: 6,  // percentage
        gradation: {
          passing50mm: 100,  // percentage
          passing37_5mm: 95,
          passing19mm: 70,
          passing4_75mm: 35,
          passing0_075mm: 8
        },
        angularity: 90,     // percentage
        quality: 1.0        // factor
      },
      subbase: {
        type: 'gravel',
        cbr: 30,             // percentage
        resilientModulus: 15000, // psi
        maxDensity: 135,     // pcf
        optimumMoisture: 8,  // percentage
        gradation: {
          passing50mm: 100,  // percentage
          passing37_5mm: 100,
          passing19mm: 85,
          passing4_75mm: 45,
          passing0_075mm: 12
        },
        quality: 1.0         // factor
      }
    },

    // Performance criteria
    performanceCriteria: {
      initialServiceability: 4.5,  // p0
      terminalServiceability: 2.5, // pt
      reliabilityLevel: 90,       // percentage
      standardDeviation: 0.45,    // S0
      designConfidence: 95,       // percentage
      allowableRutDepth: 12.5,    // mm
      allowableCracking: 10,      // percentage
      minimumThickness: {
        surface: 75,              // mm
        base: 100,
        subbase: 150
      }
    }
  });

  const [results, setResults] = useState(null);
  const [errors, setErrors] = useState({});
  const [isCalculating, setIsCalculating] = useState(false);

  // Helper function for safe number conversion
  const safeNumber = (value, defaultValue = 0) => {
    const num = Number(value);
    return isNaN(num) ? defaultValue : num;
  };

  // Input validation
  const validateInputs = () => {
    const newErrors = {};
    
    if (!pavementData.trafficData.initialADT) {
      newErrors.initialADT = 'Initial ADT is required';
    }
    if (!pavementData.trafficData.truckPercentage) {
      newErrors.truckPercentage = 'Truck percentage is required';
    }
    if (!pavementData.soilData.soilCBR) {
      newErrors.soilCBR = 'Soil CBR is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ESAL Calculation Methods
  const calculateESAL = () => {
    const {
      initialADT,
      growthRate,
      designPeriod,
      truckTypes,
      laneDistribution,
      directionalSplit
    } = pavementData.trafficData;

    // Growth factor calculation
    const growthFactor = (Math.pow(1 + growthRate/100, designPeriod) - 1) / (growthRate/100);

    // Truck factor calculations based on AASHTO vehicle class equivalency factors
    const truckFactors = {
      class4: 0.08,  // Single unit - 2 axle
      class5: 0.12,  // Single unit - 2 axle, 6 tire
      class6: 0.50,  // Single unit - 3 axle
      class7: 1.00,  // Single unit - 4+ axle
      class8: 0.95,  // Single trailer - 3-4 axle
      class9: 1.15,  // Single trailer - 5 axle
      class10: 1.25, // Single trailer - 6+ axle
      class11: 1.35, // Multi trailer - 5- axle
      class12: 1.45, // Multi trailer - 6 axle
      class13: 1.55  // Multi trailer - 7+ axle
    };

    // Calculate weighted truck factor
    let weightedTruckFactor = 0;
    Object.keys(truckTypes).forEach(truckClass => {
      weightedTruckFactor += (truckTypes[truckClass] / 100) * truckFactors[truckClass];
    });

    // Calculate total ESAL
    const esal = initialADT * 365 * growthFactor * weightedTruckFactor * 
                laneDistribution * directionalSplit;

    return esal;
  };

  // Structural Number Calculation
  const calculateStructuralNumber = () => {
    const {
      designReliability,
      overallStandardDeviation
    } = pavementData.projectInfo;

    const {
      initialServiceability,
      terminalServiceability
    } = pavementData.performanceCriteria;

    const esal = calculateESAL();
    const mr = calculateResilientModulus();

    // Reliability factor (ZR) based on design reliability
    const reliabilityFactors = {
      50: 0.000, 60: -0.253, 70: -0.524, 75: -0.674,
      80: -0.841, 85: -1.037, 90: -1.282, 91: -1.340,
      92: -1.405, 93: -1.476, 94: -1.555, 95: -1.645,
      96: -1.751, 97: -1.881, 98: -2.054, 99: -2.327,
      99.9: -3.090
    };
    
    const zr = reliabilityFactors[designReliability] || -1.282; // default to 90%

    // AASHTO 93 flexible pavement design equation
    const w18 = Math.log10(esal);
    const delPSI = initialServiceability - terminalServiceability;
    
    // Calculate required structural number (SN)
    const sn = (-0.17 + Math.sqrt(
      Math.pow(0.17, 2) - (4 * 0.04 * 
        (-2.208 + w18 * 0.542 + Math.log10(delPSI) * 0.15 + 
         zr * overallStandardDeviation + Math.log10(mr) * -0.32)
      ))) / (2 * 0.04);

    return Math.max(sn, 1);
  };

  // Calculate Resilient Modulus
  const calculateResilientModulus = () => {
    const { soilCBR } = pavementData.soilData;
    // Mr = 1500 * CBR (psi) - empirical relationship
    return 1500 * soilCBR;
  };

  // Layer Thickness Design
  const calculateLayerThicknesses = (sn) => {
    // Get material properties
    const { asphalt, base, subbase } = pavementData.materials;

    // Layer coefficients based on material properties
    const a1 = 0.44 * asphalt.quality; // Asphalt concrete adjusted by quality
    const a2 = 0.14 * base.quality;    // Crushed stone base adjusted by quality
    const a3 = 0.11 * subbase.quality; // Gravel subbase adjusted by quality

    // Drainage coefficients based on environmental conditions
    const drainageQuality = pavementData.environmentalData.drainageQuality;
    const m2 = drainageQuality === 'good' ? 1.0 : 
               drainageQuality === 'fair' ? 0.8 : 0.6;
    const m3 = m2; // Same drainage conditions for base and subbase

    // Use safeNumber for minimum thickness values
    const minSurface = safeNumber(pavementData.performanceCriteria.minimumThickness.surface, 75);
    const minBase = safeNumber(pavementData.performanceCriteria.minimumThickness.base, 100);
    const minSubbase = safeNumber(pavementData.performanceCriteria.minimumThickness.subbase, 150);

    // Calculate minimum required thicknesses
    const d1 = Math.max(minSurface, Math.min(200, sn / (a1 * 0.394))); // Convert to mm

    const remainingSN = sn - (a1 * d1 * 0.0394);
    const d2 = Math.max(minBase, Math.min(300, remainingSN / (a2 * m2 * 0.394)));

    const finalRemainingSN = remainingSN - (a2 * m2 * d2 * 0.0394);
    const d3 = Math.max(minSubbase, Math.min(450, finalRemainingSN / (a3 * m3 * 0.394)));

    return {
      surfaceCourse: Math.ceil(d1),
      baseCourse: Math.ceil(d2),
      subBase: Math.ceil(d3)
    };
  };

  // Performance calculation functions
  const calculateFatigueLife = (layerThicknesses) => {
    const surfaceThickness = layerThicknesses.surfaceCourse;
    const baseThickness = layerThicknesses.baseCourse;
    const totalThickness = surfaceThickness + baseThickness;
    
    // Normalized fatigue life based on layer thicknesses and material properties
    const fatigueFactor = (surfaceThickness / totalThickness) * 
                         pavementData.materials.asphalt.quality +
                         (baseThickness / totalThickness) * 
                         pavementData.materials.base.quality;
    
    return Math.min(Math.max(fatigueFactor, 0), 1);
  };

  const calculateRuttingResistance = (layerThicknesses) => {
    const totalThickness = Object.values(layerThicknesses).reduce((sum, thickness) => sum + thickness, 0);
    const minRequiredThickness = Object.values(pavementData.performanceCriteria.minimumThickness)
      .reduce((sum, thickness) => sum + thickness, 0);
    
    return Math.min(Math.max(totalThickness / (minRequiredThickness * 2), 0), 1);
  };

  const calculateDrainageQuality = (layerThicknesses) => {
    const subBaseThickness = layerThicknesses.subBase;
    const minSubBaseThickness = pavementData.performanceCriteria.minimumThickness.subbase;
    const drainageQualityFactor = {
      'good': 1.0,
      'fair': 0.8,
      'poor': 0.6
    }[pavementData.environmentalData.drainageQuality];
    
    return Math.min(Math.max(
      (subBaseThickness / minSubBaseThickness) * drainageQualityFactor,
      0
    ), 1);
  };

  const calculateFrostProtection = (layerThicknesses) => {
    const totalThickness = Object.values(layerThicknesses).reduce((sum, thickness) => sum + thickness, 0);
    const freezeThawFactor = Math.min(pavementData.environmentalData.freezeThawCycles / 50, 1);
    const frostIndex = 1 - freezeThawFactor;
    
    return Math.min(Math.max(
      (totalThickness / 1000) * frostIndex,
      0
    ), 1);
  };

  const calculateReliability = (layerThicknesses) => {
    const designReliability = pavementData.projectInfo.designReliability / 100;
    const thicknessRatio = Object.entries(layerThicknesses).every(([layer, thickness]) => 
      thickness >= pavementData.performanceCriteria.minimumThickness[layer.toLowerCase()]
    );
    
    return Math.min(designReliability * (thicknessRatio ? 1 : 0.8), 1);
  };

  const calculateCosts = (layerThicknesses) => {
    // Unit costs ($ per cubic meter)
    const unitCosts = {
      surfaceCourse: 150,  // Asphalt
      baseCourse: 45,      // Crushed stone
      subBase: 30          // Gravel
    };
    
    // Calculate volumes (thickness in mm converted to m³ per m²)
    const volumes = {
      surfaceCourse: layerThicknesses.surfaceCourse / 1000,
      baseCourse: layerThicknesses.baseCourse / 1000,
      subBase: layerThicknesses.subBase / 1000
    };
    
    // Calculate individual and total costs
    const costs = {
      surfaceCourse: volumes.surfaceCourse * unitCosts.surfaceCourse,
      baseCourse: volumes.baseCourse * unitCosts.baseCourse,
      subBase: volumes.subBase * unitCosts.subBase
    };
    
    costs.total = Object.values(costs).reduce((sum, cost) => sum + cost, 0);
    
    return costs;
  };

  const generateRecommendations = (performance, costs) => {
    const recommendations = [];
    
    // Performance-based recommendations
    if (performance.fatigueLife < 0.7) {
      recommendations.push({
        text: "Increase surface course thickness to improve fatigue resistance",
        priority: "high"
      });
    }
    
    if (performance.ruttingResistance < 0.7) {
      recommendations.push({
        text: "Consider higher quality base materials to improve rutting resistance",
        priority: "high"
      });
    }
    
    if (performance.drainageQuality < 0.7) {
      recommendations.push({
        text: "Improve drainage system or increase sub-base thickness",
        priority: "medium"
      });
    }
    
    if (performance.frostProtection < 0.8) {
      recommendations.push({
        text: "Increase total pavement thickness for better frost protection",
        priority: "high"
      });
    }
    
    // Cost optimization recommendations
    if (costs.total > 100) {
      recommendations.push({
        text: "Consider alternative materials to optimize cost",
        priority: "medium"
      });
    }
    
    return recommendations;
  };

  // Performance Predictions
  const calculatePerformanceMetrics = (layerThicknesses) => {
    return {
      fatigueLife: calculateFatigueLife(layerThicknesses),
      ruttingResistance: calculateRuttingResistance(layerThicknesses),
      drainageQuality: calculateDrainageQuality(layerThicknesses),
      frostProtection: calculateFrostProtection(layerThicknesses),
      reliabilityLevel: calculateReliability(layerThicknesses)
    };
  };

  // Main calculation function
  const calculateDesign = () => {
    try {
      setIsCalculating(true);
      setErrors({});

      if (!validateInputs()) {
        return;
      }

      // Calculate design parameters
      const esal = calculateESAL();
      const sn = calculateStructuralNumber();
      const layerThicknesses = calculateLayerThicknesses(sn);
      const performance = calculatePerformanceMetrics(layerThicknesses);
      const costs = calculateCosts(layerThicknesses);

      setResults({
        designESAL: parseInt(esal).toLocaleString(),
        structuralNumber: parseFloat(sn.toFixed(2)),
        layerThicknesses,
        performance,
        costs,
        recommendations: generateRecommendations(performance, costs)
      });

    } catch (error) {
      console.error('Design calculation error:', error);
      setErrors({ calculation: 'Error in pavement design calculations' });
    } finally {
      setIsCalculating(false);
    }
  };

  // Handle input changes
  const handleInputChange = (section, field, value) => {
    setPavementData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  return (
    <div className="pavement-design-calculator">
      <h2>Pavement Design Calculator</h2>
      
      {/* Error messages */}
      {Object.keys(errors).length > 0 && (
        <div className="error-messages">
          {Object.values(errors).map((error, index) => (
            <div key={index} className="error-message">{error}</div>
          ))}
        </div>
      )}

      <div className="input-sections">
        {/* Project Information */}
        <div className="input-section">
          <h3>Project Information</h3>
          <div className="input-group">
            <label>Project Name:</label>
            <input
              type="text"
              value={pavementData.projectInfo.projectName}
              onChange={(e) => handleInputChange('projectInfo', 'projectName', e.target.value)}
            />
          </div>
          <div className="input-group">
            <label>Road Classification:</label>
            <select
              value={pavementData.projectInfo.roadClassification}
              onChange={(e) => handleInputChange('projectInfo', 'roadClassification', e.target.value)}
            >
              <option value="arterial">Arterial</option>
              <option value="collector">Collector</option>
              <option value="local">Local</option>
            </select>
          </div>
          <div className="input-group">
            <label>Design Reliability (%):</label>
            <input
              type="number"
              min="85"
              max="99.9"
              step="0.1"
              value={pavementData.projectInfo.designReliability}
              onChange={(e) => handleInputChange('projectInfo', 'designReliability', e.target.value)}
            />
          </div>
        </div>

        {/* Traffic Data */}
        <div className="input-section">
          <h3>Traffic Data</h3>
          <div className="input-group">
            <label>Initial ADT:</label>
            <input
              type="number"
              value={pavementData.trafficData.initialADT}
              onChange={(e) => handleInputChange('trafficData', 'initialADT', e.target.value)}
            />
          </div>
          <div className="input-group">
            <label>Growth Rate (%):</label>
            <input
              type="number"
              step="0.1"
              value={pavementData.trafficData.growthRate}
              onChange={(e) => handleInputChange('trafficData', 'growthRate', e.target.value)}
            />
          </div>
          <div className="truck-distribution">
            <h4>Truck Type Distribution (%)</h4>
            {Object.entries(pavementData.trafficData.truckTypes).map(([truckClass, value]) => (
              <div key={truckClass} className="input-group">
                <label>Class {truckClass.replace('class', '')}:</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={value}
                  onChange={(e) => handleInputChange('trafficData', `truckTypes.${truckClass}`, e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Environmental Conditions */}
        <div className="input-section">
          <h3>Environmental Conditions</h3>
          <div className="input-group">
            <label>Climate:</label>
            <select
              value={pavementData.environmentalData.climate}
              onChange={(e) => handleInputChange('environmentalData', 'climate', e.target.value)}
            >
              <option value="temperate">Temperate</option>
              <option value="hot">Hot</option>
              <option value="cold">Cold</option>
            </select>
          </div>
          <div className="input-group">
            <label>Freeze-Thaw Cycles:</label>
            <input
              type="number"
              value={pavementData.environmentalData.freezeThawCycles}
              onChange={(e) => handleInputChange('environmentalData', 'freezeThawCycles', e.target.value)}
            />
          </div>
          <div className="input-group">
            <label>Annual Rainfall (mm):</label>
            <input
              type="number"
              value={pavementData.environmentalData.annualRainfall}
              onChange={(e) => handleInputChange('environmentalData', 'annualRainfall', e.target.value)}
            />
          </div>
          <div className="temperature-range">
            <h4>Temperature Range (°C)</h4>
            <div className="input-group">
              <label>Average:</label>
              <input
                type="number"
                value={pavementData.environmentalData.temperatureRange.average}
                onChange={(e) => handleInputChange('environmentalData', 'temperatureRange.average', e.target.value)}
              />
            </div>
            <div className="input-group">
              <label>Maximum:</label>
              <input
                type="number"
                value={pavementData.environmentalData.temperatureRange.maximum}
                onChange={(e) => handleInputChange('environmentalData', 'temperatureRange.maximum', e.target.value)}
              />
            </div>
            <div className="input-group">
              <label>Minimum:</label>
              <input
                type="number"
                value={pavementData.environmentalData.temperatureRange.minimum}
                onChange={(e) => handleInputChange('environmentalData', 'temperatureRange.minimum', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Soil Characteristics */}
        <div className="input-section">
          <h3>Soil Characteristics</h3>
          <div className="input-group">
            <label>Soil Classification:</label>
            <select
              value={pavementData.soilData.soilClassification}
              onChange={(e) => handleInputChange('soilData', 'soilClassification', e.target.value)}
            >
              <option value="A-1-a">A-1-a</option>
              <option value="A-1-b">A-1-b</option>
              <option value="A-2-4">A-2-4</option>
              <option value="A-2-6">A-2-6</option>
              <option value="A-3">A-3</option>
              <option value="A-4">A-4</option>
              <option value="A-6">A-6</option>
              <option value="A-7-5">A-7-5</option>
              <option value="A-7-6">A-7-6</option>
            </select>
          </div>
          <div className="input-group">
            <label>CBR (%):</label>
            <input
              type="number"
              step="0.1"
              value={pavementData.soilData.soilCBR}
              onChange={(e) => handleInputChange('soilData', 'soilCBR', e.target.value)}
            />
          </div>
          <div className="particle-distribution">
            <h4>Particle Distribution (%)</h4>
            {Object.entries(pavementData.soilData.particleDistribution).map(([particle, value]) => (
              <div key={particle} className="input-group">
                <label>{particle.charAt(0).toUpperCase() + particle.slice(1)}:</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={value}
                  onChange={(e) => handleInputChange('soilData', `particleDistribution.${particle}`, e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Material Properties */}
        <div className="input-section">
          <h3>Material Properties</h3>
          {/* Asphalt Properties */}
          <div className="material-group">
            <h4>Asphalt Properties</h4>
            <div className="input-group">
              <label>Grade:</label>
              <select
                value={pavementData.materials.asphalt.grade}
                onChange={(e) => handleInputChange('materials', 'asphalt.grade', e.target.value)}
              >
                <option value="PG64-22">PG64-22</option>
                <option value="PG70-22">PG70-22</option>
                <option value="PG76-22">PG76-22</option>
              </select>
            </div>
            <div className="input-group">
              <label>Air Voids (%):</label>
              <input
                type="number"
                step="0.1"
                value={pavementData.materials.asphalt.airVoids}
                onChange={(e) => handleInputChange('materials', 'asphalt.airVoids', e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Calculate button */}
      <button 
        className="calculate-button"
        onClick={calculateDesign}
        disabled={isCalculating}
      >
        {isCalculating ? 'Calculating...' : 'Calculate Design'}
      </button>

      {/* Results section */}
      {results && (
        <div className="results-section">
          <h3>Design Results</h3>
          
          <div className="result-item">
            <h4>Traffic Analysis</h4>
            <p>Design ESAL: {results.designESAL}</p>
            <p>Structural Number: {results.structuralNumber}</p>
          </div>

          <div className="result-item">
            <h4>Layer Thicknesses</h4>
            <div className="layer-diagram">
              {Object.entries(results.layerThicknesses).map(([layer, thickness], index) => (
                <div 
                  key={layer}
                  className={`layer ${layer}`}
                  style={{ height: `${thickness/5}px` }}
                >
                  <span className="layer-label">{layer}</span>
                  <span className="layer-thickness">{thickness} mm</span>
                </div>
              ))}
            </div>
          </div>

          <div className="result-item">
            <h4>Performance Analysis</h4>
            {Object.entries(results.performance).map(([metric, value]) => (
              <div key={metric} className="metric">
                <span className="metric-label">{metric.replace(/([A-Z])/g, ' $1').trim()}:</span>
                <span className="metric-value">{(value * 100).toFixed(1)}%</span>
              </div>
            ))}
          </div>

          <div className="result-item">
            <h4>Recommendations</h4>
            <ul className="recommendations-list">
              {results.recommendations.map((rec, index) => (
                <li key={index} className={`priority-${rec.priority}`}>
                  {rec.text}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default PavementDesignCalculator;