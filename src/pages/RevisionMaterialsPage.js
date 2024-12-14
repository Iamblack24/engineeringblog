import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import EducationalResourcesCard from '../components/EducationalResourcesCard';
import AuthModal from '../components/AuthModal';
import RevisionMaterialCard from '../components/RevisionMaterialCard';
import AIFlashcardGenerator from '../components/AIFlashcardGenerator';
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
  const [showFlashcardGenerator, setShowFlashcardGenerator] = useState(false);

  const handleAuthRequired = () => {
    setShowAuthModal(true);
  };

  return (
    <div className="revision-materials-page">
      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}
      
      {/* AI Flashcard Generator Button */}
      <div className="ai-flashcard-section">
        <h2>AI-Powered Flashcard Generator</h2>
        <p>
          Create customized flashcards for any engineering topic using advanced AI technology.
          Perfect for exam preparation and concept review.
        </p>
        
        <div className="ai-flashcard-features">
          <div className="feature-item">
            <i className="fas fa-brain"></i>
            <h3>Smart Generation</h3>
            <p>AI creates relevant questions and detailed answers tailored to your topic</p>
          </div>
          
          <div className="feature-item">
            <i className="fas fa-bolt"></i>
            <h3>Instant Creation</h3>
            <p>Generate comprehensive flashcard sets in seconds</p>
          </div>
          
          <div className="feature-item">
            <i className="fas fa-graduation-cap"></i>
            <h3>Learn Effectively</h3>
            <p>Review concepts with professionally crafted Q&A pairs</p>
          </div>
        </div>

        <button 
          className="generate-flashcards-btn"
          onClick={() => setShowFlashcardGenerator(true)}
        >
          Generate AI Flashcards
        </button>
      </div>

      {showFlashcardGenerator && (
        <AIFlashcardGenerator 
          onClose={() => setShowFlashcardGenerator(false)}
        />
      )}

      {/* AI Assignment Helper Section */}
      <div className="ai-assignment-section">
        <h2>AI Assignment Assistant</h2>
        <p>
          Get intelligent assistance with your engineering assignments. Our AI helps you understand concepts,
          solve problems, and learn effectively.
        </p>
        
        <div className="ai-assignment-features">
          <div className="feature-item">
            <i className="fas fa-robot"></i>
            <h3>Smart Analysis</h3>
            <p>AI analyzes your assignment requirements and provides detailed solutions</p>
          </div>
          
          <div className="feature-item">
            <i className="fas fa-file-pdf"></i>
            <h3>PDF Export</h3>
            <p>Download complete solutions as professional PDF documents</p>
          </div>
          
          <div className="feature-item">
            <i className="fas fa-lightbulb"></i>
            <h3>Learning Focus</h3>
            <p>Understand the solution process with step-by-step explanations</p>
          </div>
        </div>

        <Link 
          to="/ai-assignment-helper"
          className="try-assignment-helper-btn"
        >
          Try Assignment Helper
        </Link>
      </div>

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