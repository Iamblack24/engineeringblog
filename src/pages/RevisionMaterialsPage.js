import React from 'react';
import RevisionMaterialCard from '../components/RevisionMaterialCard';
import './RevisionMaterialsPage.css'; // Import the CSS file for styling

const revisionMaterials = [
  {
    title: 'Structural Engineering Flashcards',
    description: 'Review key concepts and formulas with these flashcards.',
    link: '/materials/structural-engineering-flashcards', // Replace with the actual link to the material
  },
  {
    title: 'Hydraulics Summary Notes',
    description: 'Summarized notes covering the essential topics in hydraulics.',
    link: '/materials/hydraulics-summary-notes', // Replace with the actual link to the material
  },
  {
    title: 'Concrete Technology Quiz',
    description: 'Test your knowledge with this quiz on concrete technology.',
    link: '/materials/concrete-technology-quiz', // Replace with the actual link to the material
  },
  {
    title: 'Geotechnical Engineering Flashcards',
    description: 'Review key concepts and formulas with these flashcards.',
    link: '/materials/geotechnical-engineering-flashcards', // Replace with the actual link to the material
  },
  {
    title: 'Environmental Engineering Summary Notes',
    description: 'Summarized notes covering the essential topics in environmental engineering.',
    link: '/materials/environmental-engineering-summary-notes', // Replace with the actual link to the material
  },
  {
    title: 'Transportation Engineering Quiz',
    description: 'Test your knowledge with this quiz on transportation engineering.',
    link: '/materials/transportation-engineering-quiz', // Replace with the actual link to the material
  },
  // Add more revision materials here
];

const RevisionMaterialsPage = () => {
  return (
    <div className="revision-materials-page">
      <h1>Revision Materials</h1>
      <div className="materials-list">
        {revisionMaterials.map((material, index) => (
          <RevisionMaterialCard
            key={index}
            title={material.title}
            description={material.description}
            link={material.link}
          />
        ))}
      </div>
    </div>
  );
};

export default RevisionMaterialsPage;