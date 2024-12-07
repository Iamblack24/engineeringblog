import React, { useState, useEffect } from 'react';
import './MaterialSelectionTool.css';

const MaterialSelectionTool = () => {
  const [materials, setMaterials] = useState([]);
  const [filters, setFilters] = useState({ density: [0, 10000], strength: [0, 500], cost: [0, 2000], sustainability: 1 });
  const [selectedMaterial, setSelectedMaterial] = useState(null);

  useEffect(() => {
    // Simulate fetching materials from an API
    const fetchMaterials = async () => {
        const data = [
            { name: 'Steel', density: 7850, strength: 250, cost: 500, sustainability: 3 },
            { name: 'Aluminum', density: 2700, strength: 200, cost: 1700, sustainability: 4 },
            { name: 'Concrete', density: 2400, strength: 30, cost: 100, sustainability: 2 },
            { name: 'Bamboo', density: 600, strength: 40, cost: 50, sustainability: 5 },
            { name: 'Carbon Fiber', density: 1800, strength: 500, cost: 3500, sustainability: 4 },
            { name: 'Copper', density: 8940, strength: 210, cost: 6000, sustainability: 3 },
            { name: 'Glass', density: 2500, strength: 70, cost: 150, sustainability: 4 },
            { name: 'Wood (Pine)', density: 500, strength: 40, cost: 200, sustainability: 5 },
            { name: 'Titanium', density: 4500, strength: 900, cost: 11000, sustainability: 3 },
            { name: 'Polycarbonate', density: 1200, strength: 70, cost: 3000, sustainability: 4 },
            { name: 'Fiberglass', density: 1850, strength: 450, cost: 2000, sustainability: 4 },
            { name: 'Brick', density: 2000, strength: 20, cost: 100, sustainability: 4 },
            { name: 'Clay', density: 1600, strength: 15, cost: 80, sustainability: 4 },
            { name: 'High-Density Polyethylene (HDPE)', density: 940, strength: 35, cost: 2000, sustainability: 3 },
            { name: 'Stainless Steel', density: 8000, strength: 500, cost: 1500, sustainability: 3 },
            { name: 'Epoxy Resin', density: 1100, strength: 50, cost: 4000, sustainability: 3 },
            { name: 'Asphalt', density: 2400, strength: 10, cost: 80, sustainability: 3 },
            { name: 'Rubber', density: 1520, strength: 25, cost: 1500, sustainability: 2 },
            { name: 'Lead', density: 11340, strength: 17, cost: 2100, sustainability: 2 },
            { name: 'Cast Iron', density: 7200, strength: 300, cost: 800, sustainability: 3 },
            { name: 'Magnesium', density: 1738, strength: 180, cost: 2400, sustainability: 4 },
            { name: 'Ceramic', density: 2500, strength: 60, cost: 400, sustainability: 4 },
            { name: 'Graphene', density: 2260, strength: 130000, cost: 10000, sustainability: 5 },
            { name: 'Nickel', density: 8900, strength: 300, cost: 7000, sustainability: 3 },
            { name: 'Zinc', density: 7135, strength: 110, cost: 2500, sustainability: 4 },
            { name: 'Polypropylene (PP)', density: 900, strength: 35, cost: 1500, sustainability: 3 },
            { name: 'Acrylic', density: 1180, strength: 75, cost: 2500, sustainability: 4 },
            { name: 'Teflon (PTFE)', density: 2200, strength: 30, cost: 6000, sustainability: 3 },
            { name: 'Kevlar', density: 1440, strength: 3600, cost: 4500, sustainability: 4 },
          ];
          
      setMaterials(data);
    };
    fetchMaterials();
  }, []);

  const handleFilterChange = (key, value) => {
    if (Array.isArray(filters[key])) {
      setFilters({ ...filters, [key]: value });
    } else {
      setFilters({ ...filters, [key]: parseFloat(value) || value });
    }
  };

  const filteredMaterials = materials.filter((material) =>
    material.density >= filters.density[0] &&
    material.density <= filters.density[1] &&
    material.strength >= filters.strength[0] &&
    material.strength <= filters.strength[1] &&
    material.cost >= filters.cost[0] &&
    material.cost <= filters.cost[1] &&
    material.sustainability >= filters.sustainability
  );

  return (
    <div className="material-selection-tool">
      <h1>Material Selection Tool</h1>
      <div className="filters">
        <h2>Filters</h2>
        <div>
          <label>Density (kg/m³):</label>
          <input
            type="range"
            min="0"
            max="12000"
            step="100"
            value={filters.density[0]}
            onChange={(e) => handleFilterChange('density', [parseInt(e.target.value), filters.density[1]])}
          />
          <input
            type="range"
            min="0"
            max="12000"
            step="100"
            value={filters.density[1]}
            onChange={(e) => handleFilterChange('density', [filters.density[0], parseInt(e.target.value)])}
          />
          <span>{`${filters.density[0]} - ${filters.density[1]}`}</span>
        </div>
        <div>
          <label>Strength (MPa):</label>
          <input
            type="range"
            min="0"
            max="150000"
            step="10"
            value={filters.strength[0]}
            onChange={(e) => handleFilterChange('strength', [parseInt(e.target.value), filters.strength[1]])}
          />
          <input
            type="range"
            min="0"
            max="150000"
            step="10"
            value={filters.strength[1]}
            onChange={(e) => handleFilterChange('strength', [filters.strength[0], parseInt(e.target.value)])}
          />
          <span>{`${filters.strength[0]} - ${filters.strength[1]}`}</span>
        </div>
        <div>
          <label>Cost (USD/ton):</label>
          <input
            type="range"
            min="0"
            max="12000"
            step="50"
            value={filters.cost[0]}
            onChange={(e) => handleFilterChange('cost', [parseInt(e.target.value), filters.cost[1]])}
          />
          <input
            type="range"
            min="0"
            max="12000"
            step="50"
            value={filters.cost[1]}
            onChange={(e) => handleFilterChange('cost', [filters.cost[0], parseInt(e.target.value)])}
          />
          <span>{`${filters.cost[0]} - ${filters.cost[1]}`}</span>
        </div>
        <div>
          <label>Sustainability:</label>
          <input
            type="number"
            min="1"
            max="5"
            value={filters.sustainability}
            onChange={(e) => handleFilterChange('sustainability', e.target.value)}
          />
        </div>
      </div>
      <div className="results">
        <h2>Results</h2>
        <ul>
          {filteredMaterials.map((material) => (
            <li
              key={material.name}
              onClick={() => setSelectedMaterial(material)}
              className={selectedMaterial?.name === material.name ? 'selected' : ''}
            >
              {material.name}
            </li>
          ))}
        </ul>
      </div>
      {selectedMaterial && (
        <div className="details">
          <h2>Material Details</h2>
          <p><strong>Name:</strong> {selectedMaterial.name}</p>
          <p><strong>Density:</strong> {selectedMaterial.density} kg/m³</p>
          <p><strong>Strength:</strong> {selectedMaterial.strength} MPa</p>
          <p><strong>Cost:</strong> ${selectedMaterial.cost} per ton</p>
          <p><strong>Sustainability:</strong> {selectedMaterial.sustainability} / 5</p>
        </div>
      )}
    </div>
  );
};

export default MaterialSelectionTool;
