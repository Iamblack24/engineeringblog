// src/pages/materials/DownloadableMaterialsPage.js
import React from 'react';
import './DownloadableMaterialsPage.css';

const DownloadableMaterialsPage = () => {
  const downloadableMaterials = [
    // Example data
    {
      id: 1,
      title: 'Concrete Technology Quiz',
      description: 'Test your knowledge on Concrete Technology.',
      link: '/downloads/concrete-technology-quiz.pdf',
    },
    {
      id: 2,
      title: 'Geotechnical Engineering Flashcards',
      description: 'Quick reference flashcards for Geotechnical Engineering.',
      link: '/downloads/geotechnical-engineering-flashcards.pdf',
    },
    // Add more materials as needed
  ];

  return (
    <div className="downloadable-materials-page">
      <h1>Downloadable Revision Materials</h1>
      <div className="materials-container">
        {downloadableMaterials.map((material) => (
          <a
            href={material.link}
            key={material.id}
            className="material-link"
            download
            target="_blank" // Optional: Open in a new tab
            rel="noopener noreferrer" // Security reasons when using target="_blank"
          >
            <div className="material-card">
              <h2>{material.title}</h2>
              <p>{material.description}</p>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};

export default DownloadableMaterialsPage;