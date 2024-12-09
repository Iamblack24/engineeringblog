import React, { useState } from 'react';
import './SteelSectionDatabase.css';

const SteelSectionDatabase = () => {
  const [sectionType, setSectionType] = useState('universal_beams');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSection, setSelectedSection] = useState(null);
  const [sortField, setSortField] = useState('designation');
  const [sortOrder, setSortOrder] = useState('asc');

  // Steel section types and their properties
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
          plastic_modulus_z: 12.6e3
        },
        // Add more UB sections here
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
          moment_of_inertia_y: 1.12e6,
          moment_of_inertia_z: 0.375e6,
          radius_of_gyration_y: 61.2,
          radius_of_gyration_z: 35.3,
          elastic_modulus_y: 14.7e3,
          elastic_modulus_z: 4.92e3,
          plastic_modulus_y: 16.6e3,
          plastic_modulus_z: 7.54e3
        },
        // Add more UC sections here
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
          moment_of_inertia_y: 0.206e6,
          moment_of_inertia_z: 0.0248e6,
          radius_of_gyration_y: 39.5,
          radius_of_gyration_z: 13.7,
          elastic_modulus_y: 4.12e3,
          elastic_modulus_z: 0.992e3,
          plastic_modulus_y: 4.89e3,
          plastic_modulus_z: 1.75e3
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
          moment_of_inertia_y: 1.27e6,
          moment_of_inertia_z: 0.0897e6,
          radius_of_gyration_y: 70.6,
          radius_of_gyration_z: 18.8,
          elastic_modulus_y: 14.1e3,
          elastic_modulus_z: 2.39e3,
          plastic_modulus_y: 16.8e3,
          plastic_modulus_z: 4.11e3
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
          moment_of_inertia_y: 11.3e3,
          moment_of_inertia_z: 11.3e3,
          radius_of_gyration_y: 15.4,
          radius_of_gyration_z: 15.4,
          elastic_modulus_y: 3.12e3,
          elastic_modulus_z: 3.12e3
        },
        {
          designation: 'L 75x75x8',
          mass_per_metre: 9.1,
          depth: 75,
          width: 75,
          thickness: 8,
          root_radius: 8.5,
          area: 11.6,
          moment_of_inertia_y: 61.5e3,
          moment_of_inertia_z: 61.5e3,
          radius_of_gyration_y: 23.0,
          radius_of_gyration_z: 23.0,
          elastic_modulus_y: 11.4e3,
          elastic_modulus_z: 11.4e3
        }
      ]
    },
    i_sections: {
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
          depth_between_fillets: 159,
          area: 28.5,
          moment_of_inertia_y: 1943e4,
          moment_of_inertia_z: 142e4,
          radius_of_gyration_y: 82.6,
          radius_of_gyration_z: 22.4,
          elastic_modulus_y: 194e3,
          elastic_modulus_z: 28.5e3,
          plastic_modulus_y: 221e3,
          plastic_modulus_z: 44.6e3
        }
      ]
    },
    hollow_sections: {
      name: 'Rectangular Hollow Sections (RHS)',
      sections: [
        {
          designation: 'RHS 100x50x3',
          mass_per_metre: 6.71,
          depth: 100,
          width: 50,
          thickness: 3,
          outer_radius: 4.5,
          area: 8.55,
          moment_of_inertia_y: 127e4,
          moment_of_inertia_z: 41.3e4,
          radius_of_gyration_y: 38.5,
          radius_of_gyration_z: 22.0,
          elastic_modulus_y: 25.4e3,
          elastic_modulus_z: 16.5e3,
          plastic_modulus_y: 31.0e3,
          plastic_modulus_z: 19.3e3
        }
      ]
    }
  };

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

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

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

  const filteredSections = getSortedSections().filter(section =>
    section.designation.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="steel-section-database">
      <h2>Steel Section Database</h2>
      
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
                    onClick={() => setSelectedSection(section)}
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
              if (key !== 'designation') {
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
        </div>
      )}
    </div>
  );
};

export default SteelSectionDatabase;