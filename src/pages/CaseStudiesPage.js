// src/pages/CaseStudiesPage.js
import React from 'react';
import CaseStudyCard from '../components/CaseStudyCard';
import AICaseStudyGenerator from '../components/AICaseStudyGenerator';
import './CaseStudiesPage.css';

const caseStudies = [
  {
    id: 1,
    title: "The Burj Khalifa: Engineering Marvel",
    description: "An in-depth look at the engineering challenges and solutions behind the world's tallest building.",
    image: "/burj.jpg",
    content: "### Overview\n\nThe **Burj Khalifa** in Dubai stands at an astounding 828 meters, making it the tallest building in the world. This case study explores the innovative engineering techniques used to overcome challenges related to height, wind forces, and construction logistics."
  },
  {
    id: 2,
    title: "The Panama Canal Expansion",
    description: "Exploring the engineering feats and innovations involved in the expansion of the Panama Canal.",
    image: "/panama.jpg",
    content: "### Overview\n\nThe **Panama Canal Expansion** project aimed to double the canal's capacity by adding a new lane for bigger ships. This involved constructing new locks, excavating new channels, and deepening existing ones."
  },
  {
    id: 3,
    title: "The Channel Tunnel: Connecting Nations",
    description: "A comprehensive study of the engineering behind the Channel Tunnel, connecting the UK and France.",
    image: "/channel.jpeg",
    content: "### Overview\n\nThe **Channel Tunnel**, also known as the Chunnel, is a 50.45-kilometer rail tunnel linking Folkestone, UK, with Coquelles, France. It is one of the longest underwater tunnels in the world."
  },
  {
    id: 4,
    title: "The Three Gorges Dam: Hydroelectric Powerhouse",
    description: "An analysis of the engineering and environmental impact of the Three Gorges Dam in China.",
    image: "/gorges.jpeg",
    content: "### Overview\n\nThe **Three Gorges Dam** on the Yangtze River in China is the world's largest hydroelectric power station by total capacity."
  },
  {
    id: 5,
    title: "The Millau Viaduct: A Sky-High Bridge",
    description: "Exploring the engineering behind the world's tallest bridge, the Millau Viaduct in France.",
    image: "/millau.jpeg",
    content: "### Overview\n\nThe **Millau Viaduct** in France is the tallest bridge in the world, with a height of 343 meters."
  }
];

const CaseStudiesPage = () => {
  return (
    <div className="case-studies-page">
      <h1>Case Studies</h1>
      
      {/* AI Case Study Generator Section */}
      <div className="ai-generator-section">
        <AICaseStudyGenerator />
      </div>

      {/* Existing Case Studies Section */}
      <h2>Featured Case Studies</h2>
      <div className="case-studies-container">
        {caseStudies.map((caseStudy) => (
          <CaseStudyCard key={caseStudy.id} caseStudy={caseStudy} />
        ))}
      </div>
    </div>
  );
};

export default CaseStudiesPage;

// Exporting caseStudies for use in other components
export { caseStudies };
