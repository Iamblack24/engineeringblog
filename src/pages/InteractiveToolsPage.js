import React from 'react';
import InteractiveToolCard from '../components/InteractiveToolCard';
import './InteractiveToolsPage.css'; // Import the CSS file for styling

const tools = [
  {
    title: 'Beam Calculator',
    description: 'Calculate the bending moment, shear force, and deflection of beams under various loading conditions.',
    link: '/tools/beam-calculator', // Replace with the actual link to the tool
  },
  {
    title: 'Concrete Mix Design Calculator',
    description: 'Determine the proportions of cement, sand, aggregate, and water for a given concrete mix.',
    link: '/tools/concrete-mix-design', // Replace with the actual link to the tool
  },
  {
    title: 'Unit Converter',
    description: 'Convert between different units of measurement commonly used in engineering.',
    link: '/tools/unit-converter', // Replace with the actual link to the tool
  },
  {
    title: 'Slope Stability Calculator',
    description: 'Analyze the stability of slopes and embankments.',
    link: '/tools/slope-stability', // Replace with the actual link to the tool
  },
  {
    title: 'Hydraulic Calculator',
    description: 'Calculate flow rates, velocities, and pressures in pipes and open channels.',
    link: '/tools/hydraulic-calculator', // Replace with the actual link to the tool
  },
  {
    title: 'Structural Load Calculator',
    description: 'Calculate the loads on structural elements such as columns, beams, and slabs.',
    link: '/tools/structural-load', // Replace with the actual link to the tool
  },
  {
    title: 'Soil Bearing Capacity Calculator',
    description: 'Determine the bearing capacity of soil for foundation design.',
    link: '/tools/soil-bearing-capacity', // Replace with the actual link to the tool
  },
  // Add more tools here
];

const InteractiveToolsPage = () => {
  return (
    <div className="interactive-tools-page">
      <h1>Interactive Tools</h1>
      <div className="tools-list">
        {tools.map((tool, index) => (
          <InteractiveToolCard
            key={index}
            title={tool.title}
            description={tool.description}
            link={tool.link}
          />
        ))}
      </div>
    </div>
  );
};

export default InteractiveToolsPage;