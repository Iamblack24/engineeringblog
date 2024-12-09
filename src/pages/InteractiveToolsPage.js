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
  {
    title: 'Frame Calculator' ,
    description: 'Design and analyze structural frames under various loads.' ,
    link: '/tools/frame-calculator' , // Replace with the actual link to the tool
  },
  {
    title: 'Material Selection Tool',
    description: 'Select construction materials based on strength, cost, and sustainability criteria.',
    link: '/tools/material-selection-tool', // Replace with the actual link to the tool
  },
  {
    title: 'Matrix Calculator',
    description: 'Perform matrix operations, including addition, subtraction, multiplication, and inversion.',
    link: '/tools/matrix-calculator', // Replace with the actual link to the tool
  },
  {
    title: 'Stress-Strain Generator',
    description: 'Generate stress-strain diagrams for different materials or custom data sets.',
    link: '/tools/stress-strain-generator', // Replace with the actual link to the tool
  },
  {
    title: 'Life Cycle Cost Analysis Tool',
    description: 'Analyze the life cycle costs of different alternatives for engineering projects.',
    link: '/tools/lcca-tool', // Replace with the actual link to the tool
  },
  {
    title: 'Unit Conversion Tool',
    description: 'Convert units of measurement for various physical quantities.',
    link: '/tools/unit-conversion', // Replace with the actual link to the tool
  },
  {
    title: 'Steel section Database',
    description: 'Comprehensive database of steel sections including Universal Beams, Universal Columns, Channels, and Angles with detailed section properties.',
    link: '/tools/steel-sections', // Replace with the actual link to the tool
  },
  {
    title: 'Column Design Tool',
    description: 'Design and analyze columns for axial loads, moments and buckling',
    link: '/tools/column-design', // Replace with the actual link to the tool
  },
  {
    title: 'Truss Analysis Calculator',
    description: 'Analyze 2D trusses for member forces, reactions, and deflections.',
    link: '/tools/truss-analysis',
  },
  {
    title: 'Soil Classification Tool',
    description: 'Classify soils based on grain size distribution and Atterberg limits.',
    link: '/tools/soil-classification-tool',
  },
  {
    title: 'Settlement Calculator',
    description: 'Calculate immediate and consolidation settlements under various loads.',
    link: '/tools/settlement-calculator',
  },
  {
    title: 'Earth Pressure Calculator',
    description: 'Calculate active and passive earth pressures for retaining structures.',
    link: '/tools/earth-pressure',
  },
  {
    title: 'Construction Cost Estimator',
    description: 'Estimate construction costs based on material quantities and labor.',
    link: '/tools/construction-cost',
  },
  {
    title: 'Project Timeline Generator',
    description: 'Create and manage construction project schedules and timelines.',
    link: '/tools/project-timeline-generator',
  },
  {
    title: 'Material Quantity Calculator',
    description: 'Calculate material quantities for various construction elements.',
    link: '/tools/material-quantity',
  },
  {
    title: 'Rainfall-Runoff Calculator',
    description: 'Calculate surface runoff from rainfall data using various methods.',
    link: '/tools/rainfall-runoff',
  },
  {
    title: 'Water Network Analysis',
    description: 'Analyze water distribution networks for flow and pressure.',
    link: '/tools/water-network-analysis',
  },
  {
    title: 'Carbon Footprint Calculator',
    description: 'Calculate the carbon footprint of construction projects.',
    link: '/tools/carbon-footprint-calculator',
  },
  {
    title: 'Traffic Analysis Tool',
    description: 'Analyze traffic flow and level of service for roads and intersections.',
    link: '/tools/traffic-analysis',
  },
  {
    title: 'Pavement Design Calculator',
    description: 'Design flexible and rigid pavements based on traffic and soil conditions.',
    link: '/tools/pavement-design',
  },
  {
    title: 'Highway Geometric Design',
    description: 'Calculate horizontal and vertical curve elements for highway design.',
    link: '/tools/highway-geometric',
  },
  {
    title: 'Traverse Calculator',
    description: 'Calculate and adjust traverse computations with error analysis.',
    link: '/tools/traverse-calculator',
  },
  {
    title: 'Leveling Calculator',
    description: 'Compute elevations and adjust level networks.',
    link: '/tools/leveling-calculator',
  },
  {
    title: 'Area & Volume Calculator',
    description: 'Calculate areas and volumes from survey data.',
    link: '/tools/area-volume-calculator',
  }


  

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