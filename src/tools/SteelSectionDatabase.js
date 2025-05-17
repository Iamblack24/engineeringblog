import React, { useState, useEffect } from 'react';
import './SteelSectionDatabase.css';
import { Chart } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, LineElement, PointElement } from 'chart.js';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, LineElement, PointElement);

const SteelSectionDatabase = () => {
  const [sectionType, setSectionType] = useState('universal_beams');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSection, setSelectedSection] = useState(null);
  const [sortField, setSortField] = useState('designation');
  const [sortOrder, setSortOrder] = useState('asc');
  const [loading, setLoading] = useState(false);
  const [calculationResults, setCalculationResults] = useState(null);
  const [calculationInputs, setCalculationInputs] = useState({
    span: 6, // meters
    load: 20, // kN/m
    grade: 'S355',
    supportType: 'simply_supported',
    deflectionLimit: 'L/360',
    fireResistance: 30, // minutes
    corrosionProtection: 'galvanized'
  });

  // Enhanced steel section types with more properties and grades
  const sectionTypes = {
    universal_beams: {
      name: 'Universal Beams (UB)',
      sections: [
        {
          designation: 'UB 127x76x13',
          mass_per_metre: 13,
          depth: 127.0,
          width: 76.0,
          web_thickness: 4.0,
          flange_thickness: 7.6,
          root_radius: 7.6,
          depth_between_fillets: 98.2,
          area: 16.5,
          moment_of_inertia_y: 4.72e6,
          moment_of_inertia_z: 0.308e6,
          radius_of_gyration_y: 53.6,
          radius_of_gyration_z: 13.7,
          elastic_modulus_y: 74.3e3,
          elastic_modulus_z: 8.11e3,
          plastic_modulus_y: 85.4e3,
          plastic_modulus_z: 12.6e3,
          available_grades: ['S275', 'S355', 'S450'],
          fire_ratings: {
            '30': { reduction_factor: 0.85 },
            '60': { reduction_factor: 0.7 },
            '90': { reduction_factor: 0.5 }
          },
          corrosion_rates: {
            'unprotected': 0.1, // mm/year
            'painted': 0.05,    // mm/year
            'galvanized': 0.02,   // mm/year
            'epoxy_coated': 0.01, // mm/year (example rate)
            'weathering_steel': 0.005 // mm/year (example rate, forms protective patina)
          }
        },
        // Add more UB sections with enhanced properties
      ]
    },
    universal_columns: {
      name: 'Universal Columns (UC)',
      sections: [
        {
          designation: 'UC 152x152x23',
          mass_per_metre: 23,
          depth: 152.4,
          width: 152.4,
          web_thickness: 6.1,
          flange_thickness: 6.8,
          root_radius: 7.6,
          depth_between_fillets: 124.8,
          area: 29.8,
          moment_of_inertia_y: 1.12e6, // Should be higher, e.g., 11.2e6 or 1120 cm^4
          moment_of_inertia_z: 0.375e6, // Should be higher, e.g., 3.75e6 or 375 cm^4
          // Note: Please double-check typical Iy and Iz values for UCs, these seem low.
          // For example, a UC 152x152x23 typically has Iy around 1160 cm^4 (11.6e6 mm^4) and Iz around 380 cm^4 (3.8e6 mm^4)
          // Assuming the provided values are correct for your dataset.
          radius_of_gyration_y: 61.2,
          radius_of_gyration_z: 35.3,
          elastic_modulus_y: 14.7e3, // Check: Iy/ (D/2) = 1.12e6 / (152.4/2) = 14.7e3. Seems consistent with low Iy.
          elastic_modulus_z: 4.92e3,
          plastic_modulus_y: 16.6e3,
          plastic_modulus_z: 7.54e3,
          available_grades: ['S275', 'S355', 'S450'],
          fire_ratings: {
            '30': { reduction_factor: 0.85 },
            '60': { reduction_factor: 0.7 },
            '90': { reduction_factor: 0.5 }
          },
          corrosion_rates: {
            'unprotected': 0.1,
            'painted': 0.05,
            'galvanized': 0.02,
            'epoxy_coated': 0.01,
            'weathering_steel': 0.005
          }
        },
        // Add more UC sections with enhanced properties
      ]
    },
    channels: {
      name: 'Channels (PFC)',
      sections: [
        {
          designation: 'PFC 100x50x10',
          mass_per_metre: 10,
          depth: 100,
          width: 50,
          web_thickness: 5,
          flange_thickness: 8.5,
          root_radius: 8,
          depth_between_fillets: 83,
          area: 13.2,
          moment_of_inertia_y: 0.206e6, // 20.6 cm^4
          moment_of_inertia_z: 0.0248e6, // 2.48 cm^4
          radius_of_gyration_y: 39.5,
          radius_of_gyration_z: 13.7,
          elastic_modulus_y: 4.12e3,
          elastic_modulus_z: 0.992e3,
          plastic_modulus_y: 4.89e3,
          plastic_modulus_z: 1.75e3,
          available_grades: ['S275', 'S355'], // ADDED
          fire_ratings: { // ADDED
            '30': { reduction_factor: 0.85 },
            '60': { reduction_factor: 0.7 },
            '90': { reduction_factor: 0.5 }
          },
          corrosion_rates: { // ADDED
            'unprotected': 0.1,
            'painted': 0.05,
            'galvanized': 0.02,
            'epoxy_coated': 0.01,
            'weathering_steel': 0.005
          }
        },
        {
          designation: 'PFC 180x75x20',
          mass_per_metre: 20,
          depth: 180,
          width: 75,
          web_thickness: 5.5,
          flange_thickness: 10.5,
          root_radius: 9.5,
          depth_between_fillets: 159,
          area: 25.5,
          moment_of_inertia_y: 1.27e6, // 127 cm^4
          moment_of_inertia_z: 0.0897e6, // 8.97 cm^4
          radius_of_gyration_y: 70.6,
          radius_of_gyration_z: 18.8,
          elastic_modulus_y: 14.1e3,
          elastic_modulus_z: 2.39e3,
          plastic_modulus_y: 16.8e3,
          plastic_modulus_z: 4.11e3,
          available_grades: ['S275', 'S355'], // ADDED
          fire_ratings: { // ADDED
            '30': { reduction_factor: 0.85 },
            '60': { reduction_factor: 0.7 },
            '90': { reduction_factor: 0.5 }
          },
          corrosion_rates: { // ADDED
            'unprotected': 0.1,
            'painted': 0.05,
            'galvanized': 0.02,
            'epoxy_coated': 0.01,
            'weathering_steel': 0.005
          }
        }
      ]
    },
    equal_angles: {
      name: 'Equal Angles',
      sections: [
        {
          designation: 'L 50x50x5',
          mass_per_metre: 3.77,
          depth: 50,
          width: 50,
          thickness: 5,
          root_radius: 5.5,
          area: 4.8,
          moment_of_inertia_y: 11.3e3, // Should be 11.3 cm^4 (11.3e4 mm^4)
          moment_of_inertia_z: 11.3e3, // Should be 11.3 cm^4 (11.3e4 mm^4)
          // Note: Please verify these I values. For a 50x50x5 L, I is typically around 11.3 cm^4.
          // Your current values are 0.113 cm^4. Assuming your data is what you intend to use.
          radius_of_gyration_y: 15.4,
          radius_of_gyration_z: 15.4,
          elastic_modulus_y: 3.12e3,
          elastic_modulus_z: 3.12e3,
          // Plastic modulus often not standardly tabulated for angles in the same way as beams/columns.
          // You might need to calculate or make assumptions if required for capacity checks.
          // For now, assuming bending checks might primarily use elastic modulus for angles.
          available_grades: ['S275', 'S355'], // ADDED
          fire_ratings: { // ADDED
            '30': { reduction_factor: 0.85 },
            '60': { reduction_factor: 0.7 },
            '90': { reduction_factor: 0.5 }
          },
          corrosion_rates: { // ADDED
            'unprotected': 0.1,
            'painted': 0.05,
            'galvanized': 0.02,
            'epoxy_coated': 0.01,
            'weathering_steel': 0.005
          }
        },
        {
          designation: 'L 75x75x8',
          mass_per_metre: 9.1,
          depth: 75,
          width: 75,
          thickness: 8,
          root_radius: 8.5,
          area: 11.6,
          moment_of_inertia_y: 61.5e3, // 0.615 cm^4. Verify. For 75x75x8 L, I is typically ~61.5 cm^4 (61.5e4 mm^4)
          moment_of_inertia_z: 61.5e3,
          radius_of_gyration_y: 23.0,
          radius_of_gyration_z: 23.0,
          elastic_modulus_y: 11.4e3,
          elastic_modulus_z: 11.4e3,
          available_grades: ['S275', 'S355'], // ADDED
          fire_ratings: { // ADDED
            '30': { reduction_factor: 0.85 },
            '60': { reduction_factor: 0.7 },
            '90': { reduction_factor: 0.5 }
          },
          corrosion_rates: { // ADDED
            'unprotected': 0.1,
            'painted': 0.05,
            'galvanized': 0.02,
            'epoxy_coated': 0.01,
            'weathering_steel': 0.005
          }
        }
      ]
    },
    i_sections: { // Typically IPE, HEA, HEB etc.
      name: 'I Sections (IPE)',
      sections: [
        {
          designation: 'IPE 200',
          mass_per_metre: 22.4,
          depth: 200,
          width: 100,
          web_thickness: 5.6,
          flange_thickness: 8.5,
          root_radius: 12,
          depth_between_fillets: 159, // d value
          area: 28.5, // cm^2
          moment_of_inertia_y: 1943e4, // mm^4 (1943 cm^4)
          moment_of_inertia_z: 142e4,  // mm^4 (142 cm^4)
          radius_of_gyration_y: 82.6, // mm
          radius_of_gyration_z: 22.4, // mm
          elastic_modulus_y: 194e3, // mm^3 (194 cm^3)
          elastic_modulus_z: 28.5e3, // mm^3 (28.5 cm^3)
          plastic_modulus_y: 221e3, // mm^3 (221 cm^3)
          plastic_modulus_z: 44.6e3, // mm^3 (44.6 cm^3)
          available_grades: ['S275', 'S355'], // ADDED
          fire_ratings: { // ADDED
            '30': { reduction_factor: 0.85 },
            '60': { reduction_factor: 0.7 },
            '90': { reduction_factor: 0.5 }
          },
          corrosion_rates: { // ADDED
            'unprotected': 0.1,
            'painted': 0.05,
            'galvanized': 0.02,
            'epoxy_coated': 0.01,
            'weathering_steel': 0.005
          }
        }
      ]
    },
    hollow_sections: { // RHS, SHS, CHS
      name: 'Rectangular Hollow Sections (RHS)',
      sections: [
        {
          designation: 'RHS 100x50x3',
          mass_per_metre: 6.71, // kg/m
          depth: 100, // mm (h)
          width: 50,  // mm (b)
          thickness: 3, // mm (t)
          outer_radius: 4.5, // typically 1.5t to 2.5t, assuming this is given
          area: 8.55, // cm^2
          moment_of_inertia_y: 127e4, // mm^4 (127 cm^4) - about h axis
          moment_of_inertia_z: 41.3e4, // mm^4 (41.3 cm^4) - about b axis
          radius_of_gyration_y: 38.5, // mm
          radius_of_gyration_z: 22.0, // mm
          elastic_modulus_y: 25.4e3, // mm^3
          elastic_modulus_z: 16.5e3, // mm^3
          plastic_modulus_y: 31.0e3, // mm^3
          plastic_modulus_z: 19.3e3, // mm^3
          available_grades: ['S275', 'S355', 'S450'], // ADDED (S450 is common for CHS/RHS)
          fire_ratings: { // ADDED
            '30': { reduction_factor: 0.85 }, // These are illustrative; actual factors depend on A/V
            '60': { reduction_factor: 0.7 },
            '90': { reduction_factor: 0.5 }
          },
          corrosion_rates: { // ADDED
            'unprotected': 0.1,
            'painted': 0.05,
            'galvanized': 0.02,
            'epoxy_coated': 0.01,
            'weathering_steel': 0.005
          }
        }
      ]
    }
  };

  // Material properties for different grades
  const materialProperties = {
    S275: {
      yield_strength: 275,
      ultimate_strength: 430,
      youngs_modulus: 210000,
      poissons_ratio: 0.3,
      density: 7850
    },
    S355: {
      yield_strength: 355,
      ultimate_strength: 510,
      youngs_modulus: 210000,
      poissons_ratio: 0.3,
      density: 7850
    },
    S450: {
      yield_strength: 450,
      ultimate_strength: 550,
      youngs_modulus: 210000,
      poissons_ratio: 0.3,
      density: 7850
    }
  };

  // Calculate section capacity
  const calculateSectionCapacity = (section, inputs) => {
    const material = materialProperties[inputs.grade];
    if (!material) {
        console.error("Material grade not found:", inputs.grade);
        return { error: `Material grade ${inputs.grade} properties not found.` };
    }
    if (!section) {
        console.error("Section data is missing for calculation.");
        return { error: "Section data is missing." };
    }

    const span_mm = inputs.span * 1000; 
    const load_N_mm = parseFloat(inputs.load); 

    let maxMoment_Nmm;
    let maxShearForce_N;
    let deflection_mm;
    let corrosionWarning = null; // Initialize corrosion warning message

    // Original properties
    let original_I_y_mm4 = section.moment_of_inertia_y;
    let original_Z_p_y_mm3 = section.plastic_modulus_y;
    let original_Z_e_y_mm3 = section.elastic_modulus_y;
    let original_section_depth_mm = section.depth;
    let original_web_thickness_mm = section.web_thickness;
    let original_flange_thickness_mm = section.flange_thickness;
    let original_thickness_mm = section.thickness; // For angles, hollow sections

    // Corrosion Allowance Calculation
    const corrosionRates = section.corrosion_rates || {};
    const corrosionProtectionRate = corrosionRates[inputs.corrosionProtection] || 0.1; // Default if type not found
    const designLife_years = 50; 
    const corrosionAllowance_mm = corrosionProtectionRate * designLife_years;

    // Effective (corroded) properties
    let eff_I_y_mm4 = original_I_y_mm4;
    let eff_Z_p_y_mm3 = original_Z_p_y_mm3;
    let eff_Z_e_y_mm3 = original_Z_e_y_mm3;
    // Initialize with original, will be updated if corrosionAllowance_mm > 0
    let eff_web_thickness_for_shear_calc_mm = original_web_thickness_mm !== undefined ? original_web_thickness_mm : (original_thickness_mm !== undefined ? original_thickness_mm : 0);


    if (corrosionAllowance_mm > 0) {
      let eff_web_t = original_web_thickness_mm !== undefined ? Math.max(0, original_web_thickness_mm - corrosionAllowance_mm) : undefined;
      let eff_flange_t = original_flange_thickness_mm !== undefined ? Math.max(0, original_flange_thickness_mm - corrosionAllowance_mm) : undefined;
      let eff_overall_t = original_thickness_mm !== undefined ? Math.max(0, original_thickness_mm - corrosionAllowance_mm) : undefined;

      let scaling_ratio = 1.0;

      if (original_web_thickness_mm !== undefined && original_flange_thickness_mm !== undefined) { // UB, UC, PFC, IPE like sections
        const ratio_w = original_web_thickness_mm > 0 ? eff_web_t / original_web_thickness_mm : 0;
        const ratio_f = original_flange_thickness_mm > 0 ? eff_flange_t / original_flange_thickness_mm : 0;
        
        if (original_web_thickness_mm > 0 && original_flange_thickness_mm > 0) {
            scaling_ratio = Math.min(ratio_w, ratio_f);
        } else if (original_web_thickness_mm > 0) {
            scaling_ratio = ratio_w;
        } else if (original_flange_thickness_mm > 0) {
            scaling_ratio = ratio_f;
        } else {
            scaling_ratio = 0; 
        }
        eff_web_thickness_for_shear_calc_mm = eff_web_t;
      } else if (original_thickness_mm !== undefined) { // Angles, Hollow Sections (using 'thickness' property)
        scaling_ratio = original_thickness_mm > 0 ? eff_overall_t / original_thickness_mm : 0;
        eff_web_thickness_for_shear_calc_mm = eff_overall_t;
      } else {
        // Fallback if no standard thickness properties are defined for scaling I, Z.
        // eff_web_thickness_for_shear_calc_mm would use its initial value or specific assignment if original_web_thickness_mm was defined.
        if (eff_web_t !== undefined) eff_web_thickness_for_shear_calc_mm = eff_web_t;
        else if (eff_overall_t !== undefined) eff_web_thickness_for_shear_calc_mm = eff_overall_t;
        // scaling_ratio remains 1.0 if no basis for scaling I, Z is found
      }
      
      if (isNaN(scaling_ratio)) scaling_ratio = 0;

      eff_I_y_mm4 = original_I_y_mm4 * Math.pow(scaling_ratio, 3);
      eff_Z_p_y_mm3 = original_Z_p_y_mm3 * Math.pow(scaling_ratio, 2);
      eff_Z_e_y_mm3 = original_Z_e_y_mm3 * Math.pow(scaling_ratio, 2);

      // Check for corrosion failure and set warning message
      const hadBendingThickness = original_web_thickness_mm !== undefined || original_flange_thickness_mm !== undefined || original_thickness_mm !== undefined;
      const hadShearThickness = original_web_thickness_mm !== undefined || original_thickness_mm !== undefined;

      if (scaling_ratio === 0 && hadBendingThickness) {
        corrosionWarning = "Section bending capacity effectively zero due to excessive corrosion.";
      }
      if (eff_web_thickness_for_shear_calc_mm === 0 && hadShearThickness) {
        if (corrosionWarning) {
            corrosionWarning += " Shear capacity also effectively zero.";
        } else {
            corrosionWarning = "Section shear capacity effectively zero due to excessive corrosion.";
        }
      }
    }
    
    if (typeof eff_I_y_mm4 !== 'number' || typeof eff_Z_p_y_mm3 !== 'number' || typeof eff_Z_e_y_mm3 !== 'number' || typeof original_section_depth_mm !== 'number' ) {
        console.error("One or more critical section properties are missing or not numbers after corrosion adjustment.", section);
        return { error: "Critical section properties missing/invalid after corrosion."};
    }
    if (typeof eff_web_thickness_for_shear_calc_mm !== 'number' || isNaN(eff_web_thickness_for_shear_calc_mm)) {
        eff_web_thickness_for_shear_calc_mm = 0; 
    }

    if (inputs.supportType === 'simply_supported') {
      maxMoment_Nmm = (load_N_mm * Math.pow(span_mm, 2)) / 8;
      maxShearForce_N = (load_N_mm * span_mm) / 2;
      deflection_mm = eff_I_y_mm4 > 0 ? (5 * load_N_mm * Math.pow(span_mm, 4)) / (384 * material.youngs_modulus * eff_I_y_mm4) : Infinity;
    } else if (inputs.supportType === 'cantilever') {
      maxMoment_Nmm = (load_N_mm * Math.pow(span_mm, 2)) / 2;
      maxShearForce_N = load_N_mm * span_mm;
      deflection_mm = eff_I_y_mm4 > 0 ? (load_N_mm * Math.pow(span_mm, 4)) / (8 * material.youngs_modulus * eff_I_y_mm4) : Infinity;
    } else if (inputs.supportType === 'fixed') {
      maxMoment_Nmm = (load_N_mm * Math.pow(span_mm, 2)) / 12;
      maxShearForce_N = (load_N_mm * span_mm) / 2;
      deflection_mm = eff_I_y_mm4 > 0 ? (load_N_mm * Math.pow(span_mm, 4)) / (384 * material.youngs_modulus * eff_I_y_mm4) : Infinity;
    } else {
      console.error("Unknown support type:", inputs.supportType);
      return { error: `Unknown support type: ${inputs.supportType}` };
    }

    const plasticMoment_Nmm = eff_Z_p_y_mm3 * material.yield_strength;
    const elasticMoment_Nmm = eff_Z_e_y_mm3 * material.yield_strength; 

    const deflectionLimit_mm = span_mm / parseFloat(inputs.deflectionLimit.split('/')[1] || 360);

    const shearArea_mm2 = original_section_depth_mm * eff_web_thickness_for_shear_calc_mm; 
    const shearCapacity_N = (shearArea_mm2 * material.yield_strength) / Math.sqrt(3);

    const fireRatings = section.fire_ratings || {}; 
    const fireResistanceData = fireRatings[inputs.fireResistance.toString()] || { reduction_factor: 1 }; 
    const fireReduction = fireResistanceData.reduction_factor;
    const fireMomentCapacity_Nmm = plasticMoment_Nmm * fireReduction;

    return {
      maxMoment: maxMoment_Nmm,
      plasticMoment: plasticMoment_Nmm,
      elasticMoment: elasticMoment_Nmm,
      deflection: deflection_mm,
      deflectionLimit: deflectionLimit_mm,
      shearCapacity: shearCapacity_N,
      maxShearForce: maxShearForce_N,
      fireMomentCapacity: fireMomentCapacity_Nmm,
      corrosionAllowance: corrosionAllowance_mm,
      corrosionWarning: corrosionWarning, // Added warning message
      utilization: {
        bending: plasticMoment_Nmm > 0 ? maxMoment_Nmm / plasticMoment_Nmm : Infinity,
        shear: shearCapacity_N > 0 ? maxShearForce_N / shearCapacity_N : Infinity,
        deflection: deflectionLimit_mm > 0 && deflection_mm !== Infinity ? deflection_mm / deflectionLimit_mm : Infinity,
        fire: fireMomentCapacity_Nmm > 0 ? maxMoment_Nmm / fireMomentCapacity_Nmm : Infinity
      }
    };
  };

  // Handle calculation inputs change
  const handleCalculationInputChange = (field, value) => {
    setCalculationInputs(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Perform calculations
  const performCalculations = () => {
    if (!selectedSection) return;

    setLoading(true);
    try {
      const results = calculateSectionCapacity(selectedSection, calculationInputs);
      setCalculationResults(results);
    } catch (error) {
      console.error('Calculation error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Format property values
  const formatProperty = (value, property) => {
    if (typeof value === 'number') {
      if (property.includes('moment_of_inertia')) {
        return `${value.toExponential(2)} mm⁴`;
      } else if (property.includes('modulus')) {
        return `${value.toExponential(2)} mm³`;
      } else if (property.includes('area')) {
        return `${value.toFixed(1)} cm²`;
      } else if (property.includes('mass')) {
        return `${value.toFixed(1)} kg/m`;
      } else if (property.includes('radius')) {
        return `${value.toFixed(1)} mm`;
      } else if (property.includes('thickness')) {
        return `${value.toFixed(1)} mm`;
      } else if (property.includes('depth') || property.includes('width')) {
        return `${value.toFixed(1)} mm`;
      }
      return `${value.toFixed(1)}`;
    }
    return value;
  };

  // Handle section selection
  const handleSectionSelect = (section) => {
    setSelectedSection(section);
    setCalculationResults(null);
  };

  // Handle sort
  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Get sorted sections
  const getSortedSections = () => {
    const sections = [...sectionTypes[sectionType].sections];
    return sections.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      if (typeof aValue === 'number') {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }
      return sortOrder === 'asc' 
        ? aValue.localeCompare(bValue) 
        : bValue.localeCompare(aValue);
    });
  };

  // Filter sections
  const filteredSections = getSortedSections().filter(section =>
    section.designation.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="steel-section-database">
      <h2>Enhanced Steel Section Database</h2>
      
      <div className="controls">
        <div className="section-type-select">
          <label>Section Type:</label>
          <select 
            value={sectionType}
            onChange={(e) => {
              setSectionType(e.target.value);
              setSelectedSection(null);
            }}
          >
            {Object.entries(sectionTypes).map(([key, value]) => (
              <option key={key} value={key}>{value.name}</option>
            ))}
          </select>
        </div>

        <div className="search-box">
          <label>Search:</label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by designation..."
          />
        </div>
      </div>

      <div className="sections-table-container">
        <table className="sections-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('designation')}>
                Designation
                {sortField === 'designation' && (
                  <span className="sort-indicator">
                    {sortOrder === 'asc' ? ' ↑' : ' ↓'}
                  </span>
                )}
              </th>
              <th onClick={() => handleSort('mass_per_metre')}>
                Mass/m (kg)
                {sortField === 'mass_per_metre' && (
                  <span className="sort-indicator">
                    {sortOrder === 'asc' ? ' ↑' : ' ↓'}
                  </span>
                )}
              </th>
              <th onClick={() => handleSort('depth')}>
                Depth (mm)
                {sortField === 'depth' && (
                  <span className="sort-indicator">
                    {sortOrder === 'asc' ? ' ↑' : ' ↓'}
                  </span>
                )}
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSections.map((section) => (
              <tr 
                key={section.designation}
                className={selectedSection?.designation === section.designation ? 'selected' : ''}
              >
                <td>{section.designation}</td>
                <td>{formatProperty(section.mass_per_metre, 'mass_per_metre')}</td>
                <td>{formatProperty(section.depth, 'depth')}</td>
                <td>
                  <button 
                    className="view-details-btn"
                    onClick={() => handleSectionSelect(section)}
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedSection && (
        <div className="section-details">
          <h3>Section Properties: {selectedSection.designation}</h3>
          
          <div className="properties-grid">
            {Object.entries(selectedSection).map(([key, value]) => {
              if (key !== 'designation' && !key.includes('_ratings') && !key.includes('_rates')) {
                return (
                  <div key={key} className="property-item">
                    <span className="property-label">
                      {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:
                    </span>
                    <span className="property-value">
                      {formatProperty(value, key)}
                    </span>
                  </div>
                );
              }
              return null;
            })}
          </div>

          <div className="calculation-section">
            <h4>Section Capacity Calculator</h4>
            <div className="calculation-inputs">
              <div className="input-group">
                <label>Span (m):</label>
                <input
                  type="number"
                  value={calculationInputs.span}
                  onChange={(e) => handleCalculationInputChange('span', parseFloat(e.target.value))}
                  min="1"
                  step="0.1"
                />
              </div>
              <div className="input-group">
                <label>Load (kN/m):</label>
                <input
                  type="number"
                  value={calculationInputs.load}
                  onChange={(e) => handleCalculationInputChange('load', parseFloat(e.target.value))}
                  min="1"
                  step="1"
                />
              </div>
              <div className="input-group">
                <label>Grade:</label>
                <select
                  value={calculationInputs.grade}
                  onChange={(e) => handleCalculationInputChange('grade', e.target.value)}
                >
                  {selectedSection.available_grades.map(grade => (
                    <option key={grade} value={grade}>{grade}</option>
                  ))}
                </select>
              </div>
              <div className="input-group">
                <label>Support Type:</label>
                <select
                  value={calculationInputs.supportType}
                  onChange={(e) => handleCalculationInputChange('supportType', e.target.value)}
                >
                  <option value="simply_supported">Simply Supported</option>
                  <option value="cantilever">Cantilever</option>
                  <option value="fixed">Fixed Ends</option>
                </select>
              </div>
              <div className="input-group">
                <label>Fire Resistance (min):</label>
                <select
                  value={calculationInputs.fireResistance}
                  onChange={(e) => handleCalculationInputChange('fireResistance', e.target.value)}
                >
                  <option value="30">30 minutes</option>
                  <option value="60">60 minutes</option>
                  <option value="90">90 minutes</option>
                </select>
              </div>
              <div className="input-group">
                <label>Corrosion Protection:</label>
                <select
                  value={calculationInputs.corrosionProtection}
                  onChange={(e) => handleCalculationInputChange('corrosionProtection', e.target.value)}
                >
                  <option value="unprotected">Unprotected</option>
                  <option value="painted">Painted</option>
                  <option value="galvanized">Galvanized</option>
                  <option value="epoxy_coated">Epoxy Coated</option>
                  <option value="weathering_steel">Weathering Steel</option>
                </select>
              </div>
            </div>

            <button 
              className="calculate-btn"
              onClick={performCalculations}
              disabled={loading}
            >
              {loading ? 'Calculating...' : 'Calculate Capacity'}
            </button>

            {calculationResults && calculationResults.error && (
              <div className="error-message">
                <p><strong>Error:</strong> {calculationResults.error}</p>
              </div>
            )}
            {calculationResults && calculationResults.corrosionWarning && !calculationResults.error && (
              <div className="corrosion-warning-message">
                <p><strong>Warning:</strong> {calculationResults.corrosionWarning}</p>
                <p>The calculated capacities below reflect this significant loss of section due to the specified corrosion allowance over 50 years.</p>
              </div>
            )}
            {calculationResults && !calculationResults.error && (
              <div className="calculation-results">
                <h5>Results</h5>
                <div className="results-grid">
                  <div className="result-item">
                    <span className="result-label">Maximum Moment (M_Ed):</span>
                    <span className="result-value">
                      {(calculationResults.maxMoment / 1e6).toFixed(2)} kN·m
                    </span>
                  </div>
                  <div className="result-item">
                    <span className="result-label">Plastic Moment Capacity (M_pl,Rd):</span>
                    <span className="result-value">
                      {(calculationResults.plasticMoment / 1e6).toFixed(2)} kN·m
                    </span>
                  </div>
                  <div className="result-item">
                    <span className="result-label">Max Shear Force (V_Ed):</span>
                    <span className="result-value">
                      {(calculationResults.maxShearForce / 1e3).toFixed(2)} kN
                    </span>
                  </div>
                  <div className="result-item">
                    <span className="result-label">Shear Capacity (V_pl,Rd):</span>
                    <span className="result-value">
                      {(calculationResults.shearCapacity / 1e3).toFixed(2)} kN
                    </span>
                  </div>
                  <div className="result-item">
                    <span className="result-label">Deflection (δ):</span>
                    <span className="result-value">
                      {calculationResults.deflection.toFixed(2)} mm
                    </span>
                  </div>
                  <div className="result-item">
                    <span className="result-label">Deflection Limit (L/{calculationInputs.deflectionLimit.split('/')[1] || '360'}):</span>
                    <span className="result-value">
                      {calculationResults.deflectionLimit.toFixed(2)} mm
                    </span>
                  </div>
                  <div className="result-item">
                    <span className="result-label">Fire Moment Capacity ({calculationInputs.fireResistance} min):</span>
                    <span className="result-value">
                      {(calculationResults.fireMomentCapacity / 1e6).toFixed(2)} kN·m
                    </span>
                  </div>
                  <div className="result-item">
                    <span className="result-label">Corrosion Allowance ({calculationInputs.corrosionProtection}, {50} yrs):</span>
                    <span className="result-value">
                      {calculationResults.corrosionAllowance.toFixed(2)} mm
                    </span>
                  </div>
                </div>

                {calculationResults.utilization && (
                  <div className="utilization-chart">
                    <Chart
                      type="bar"
                      data={{
                        labels: ['Bending', 'Shear', 'Deflection', 'Fire (Bending)'],
                        datasets: [{
                          label: 'Utilization Ratio (Actual / Capacity)',
                          data: [
                            calculationResults.utilization.bending,
                            calculationResults.utilization.shear,
                            calculationResults.utilization.deflection,
                            calculationResults.utilization.fire
                          ],
                          backgroundColor: [
                            calculationResults.utilization.bending > 1 ? 'rgba(255, 99, 132, 0.7)' : 'rgba(100, 255, 218, 0.7)',
                            calculationResults.utilization.shear > 1 ? 'rgba(255, 99, 132, 0.7)' : 'rgba(100, 255, 218, 0.7)',
                            calculationResults.utilization.deflection > 1 ? 'rgba(255, 99, 132, 0.7)' : 'rgba(100, 255, 218, 0.7)',
                            calculationResults.utilization.fire > 1 ? 'rgba(255, 99, 132, 0.7)' : 'rgba(100, 255, 218, 0.7)'
                          ],
                          borderColor: [
                            calculationResults.utilization.bending > 1 ? 'rgb(255, 99, 132)' : 'rgb(100, 255, 218)',
                            calculationResults.utilization.shear > 1 ? 'rgb(255, 99, 132)' : 'rgb(100, 255, 218)',
                            calculationResults.utilization.deflection > 1 ? 'rgb(255, 99, 132)' : 'rgb(100, 255, 218)',
                            calculationResults.utilization.fire > 1 ? 'rgb(255, 99, 132)' : 'rgb(100, 255, 218)'
                          ],
                          borderWidth: 1
                        }]
                      }}
                      options={{
                        responsive: true,
                        scales: {
                          y: {
                            beginAtZero: true,
                            max: 1.2,
                            title: {
                              display: true,
                              text: 'Utilization Ratio'
                            }
                          }
                        }
                      }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SteelSectionDatabase;