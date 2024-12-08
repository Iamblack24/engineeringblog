import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import EducationalResourcesCard from '../components/EducationalResourcesCard';
import AuthModal from '../components/AuthModal';
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
  {
    title: 'Download Revision Materials',
    description: 'Access and download various revision materials.',
    link: '/materials/downloadable-revision-materials', // Link to the new page
  },
  {
    title: 'Structural Analysis Flashcards',
    description: 'Review key concepts and formulas with these flashcards.',
    link: '/materials/structural-analysis-flashcards',
  },
  {
    title: 'Fluid Mechanics Summary Notes',
    description: 'Summarized notes covering the essential topics in fluid mechanics.',
    link: '/materials/fluid-mechanics-summary-notes',
  },
  {
    title: 'Steel Structures Quiz',
    description: 'Test your knowledge with this quiz on steel structures.',
    link: '/materials/steel-structures-quiz',
  },
  {
    title: 'Soil Mechanics Flashcards',
    description: 'Review key concepts and formulas with these flashcards.',
    link: '/materials/soil-mechanics-flashcards',
  },
  {
    title: 'Water Resources Engineering Summary Notes',
    description: 'Summarized notes covering the essential topics in water resources engineering.',
    link: '/materials/water-resources-engineering-summary-notes',
  },
  {
    title: 'Public Health Engineering Quiz',
    description: 'Test your knowledge with this quiz on public health engineering.',
    link: '/pages/materials/public-health-engineering-quiz',
  },
  {
    title: 'Engineering Graphics Flashcards',
    description: 'Review key concepts and definitions with these flashcards.',
    link: '/materials/engineering-graphics-flashcards',
  },
  {
    title: 'Construction Management Flashcards',
    description: 'Review key concepts in construction planning and management.',
    link: '/materials/construction-management-flashcards',
  },
  {
    title: 'Building Services Flashcards',
    description: 'Study MEP systems and building services integration.',
    link: '/materials/building-services-flashcards',
  },
  {
    title: 'Surveying Fundamentals Quiz',
    description: 'Test your knowledge of surveying principles and methods.',
    link: '/materials/surveying-fundamentals-quiz',
  },
  {
    title: 'Highway Engineering Flashcards',
    description: 'Review road design and traffic engineering concepts.',
    link: '/materials/highway-engineering-flashcards',
  },
  {
    title: 'Foundation Design Flashcards',
    description: 'Study different foundation types and design principles.',
    link: '/materials/foundation-design-flashcards',
  },
  {
    title: 'Construction Materials Quiz',
    description: 'Test your knowledge of construction materials and their properties.',
    link: '/materials/construction-materials-quiz',
  }
  // Add more revision materials here
];

const RevisionMaterialsPage = () => {
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleAuthRequired = () => {
    setShowAuthModal(true);
  };

  return (
    <div className="revision-materials-page">
      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}
      {/* New Educational Resources Card */}
      <EducationalResourcesCard onAuthRequired={handleAuthRequired} />
      <div className="materials-list">
        {revisionMaterials.map((material, index) => (
          <Link to={material.link} key={index} className="material-link">
            <RevisionMaterialCard
              title={material.title}
              description={material.description}
            />
          </Link>
        ))}
      </div>
    </div>
  );
};

export default RevisionMaterialsPage;