
import React from 'react';
import './DownloadableRevisionMaterialsPage.css'; // Import the CSS file for styling

const downloadableMaterials = [
  {
    title: 'Structural Engineering Notes',
    description: 'Download comprehensive notes on structural engineering.',
    fileLink: '/downloads/structural-engineering-notes.pdf', // Replace with the actual file link
  },
  {
    title: 'Hydraulics Cheat Sheet',
    description: 'Download a cheat sheet for hydraulics.',
    fileLink: '/downloads/hydraulics-cheat-sheet.pdf', // Replace with the actual file link
  },
  // Add more downloadable materials here
];

const DownloadableRevisionMaterialsPage = () => {
  return (
    <div className="downloadable-revision-materials-page">
      <h1>Downloadable Revision Materials</h1>
      <div className="materials-list">
        {downloadableMaterials.map((material, index) => (
          <div key={index} className="material-item">
            <h2>{material.title}</h2>
            <p>{material.description}</p>
            <a href={material.fileLink} download>
              Download
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DownloadableRevisionMaterialsPage;