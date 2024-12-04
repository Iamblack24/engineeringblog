import React, { useContext, useEffect, useState } from 'react';
import InteractiveToolCard from '../components/InteractiveToolCard';
import InteractiveAI from '../components/InteractiveAI';
import AuthModal from '../components/AuthModal';
import './InteractiveToolsPage.css'; // Import the CSS file for styling
import { AuthContext } from '../contexts/AuthContext';

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
  {
    title: 'Pile Design Tool',
    description: 'Design and analyze pile foundations for various soil conditions.',
    link: '/tools/pile-design', // Replace with the actual link to the tool
  },
  {
    title: 'Retaining Wall Design Tool',
    description: 'Design and analyze different types of retaining walls for stability and safety.',
    link: '/tools/retaining-wall-design', // Replace with the actual link to the tool
  },
  {
    title: 'Steel Connection Design Tool',
    description: 'Design bolted and welded steel connections for structural steel members.',
    link: '/tools/steel-connection-design', // Replace with the actual link to the tool
  },
  {
    title: 'Reinforced Concrete Design Tool',
    description: 'Design reinforced concrete beams, columns, and slabs for strength and durability.',
    link: '/tools/reinforced-concrete-design', // Replace with the actual link to the tool
  },
  
  

  // Add more tools here
];

const InteractiveToolsPage = () => {
  const { currentUser } = useContext(AuthContext); // Get authentication status from context
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  const handleToolClick = (tool) => {
    if (!currentUser) {
      setShowAuthModal(true);
    } else {
      window.location.href = tool.link;
    }
  };

  useEffect(() => {
    if (currentUser) {
      setShowAuthModal(false);
    }
  }, [currentUser]);

  return (
    <div className="interactive-tools-page">
      <InteractiveAI />
      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}
      <h1>Interactive Tools</h1>
      <p>Explore our interactive tools to assist you in your engineering projects and calculations.REMEMBER CALCULATIONS MAY NOT BE ACCURATE! HAVE SOME IDEA BEFORE INTERACTING.REMEMBER TO REPORT INACCURACY</p>
      <div className="tools-list">
        {tools.map((tool, index) => (
          <InteractiveToolCard
            key={index}
            title={tool.title}
            description={tool.description}
            link={tool.link}
            onClick={() => handleToolClick(tool)}
          />
        ))}
      </div>
    </div>
  );
};

export default InteractiveToolsPage;