// src/pages/DownloadableRevisionMaterialsPage.js
import React, { useState } from 'react';
import './DownloadableRevisionMaterialsPage.css'; // Import the CSS file for styling

const downloadableMaterials = [
  {
    title: 'Structural Engineering Notes',
    description: 'Download comprehensive notes on structural engineering.',
    fileLinks: [
      'https://drive.google.com/uc?export=download&id=1DUc2S_4zZ97OH3dVQWBFSQd2HRfx7pu7',
      'https://drive.google.com/uc?export=download&id=1pmkwKiOWrPBxoqWR0e2c-DSRqkGQKfww',
      'https://drive.google.com/uc?export=download&id=1NXh1UNHOlOh6osCMi4YOKEW9Tvw9DHRZ',
    ],
  },
  {
    title: 'Soil Mechanics 1A',
    description: 'Download notes on soil mechanics for third year civil students.',
    fileLinks: [
      '/EECQ 3171-Soil Mechanics IA-Slides 1-49.pdf',
      '/EECQ 3171-Soil Mechanics IA - slides 50-76.pdf',
    ],
  },
  {
    title: 'Engineering Graphics B',
    description: 'Download notes on engineering graphics for second year civil students.',
    fileLinks: [
      'https://drive.google.com/uc?export=download&id=1dyMbBsDNvCq5mgoOVxEcwbiosTBIaRiB',
      'https://drive.google.com/uc?export=download&id=1blA1CaCsqM8GFm2qX1iu5waL6UiUKVVc',
      'https://drive.google.com/uc?export=download&id=1bU0HhxDoPw-w9-JuUuh5MN5BfD3j91hk',
    ],
  }

  // Add more downloadable materials here with multiple fileLinks
];

const DownloadableRevisionMaterialsPage = () => {
  const [isDownloading, setIsDownloading] = useState(false);

  // Function to download multiple files
  const downloadFiles = (fileLinks) => {
    setIsDownloading(true);
    fileLinks.forEach((fileLink) => {
      const link = document.createElement('a');
      link.href = fileLink;
      link.download = fileLink.substring(fileLink.lastIndexOf('/') + 1);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
    setIsDownloading(false); // Reset the downloading state
  };

  return (
    <div className="downloadable-revision-materials-page">
      <h1>Downloadable Revision Materials</h1>
      {isDownloading && <p className="download-status">Downloading files...</p>}
      <div className="materials-list">
        {downloadableMaterials.map((material, index) => (
          <div key={index} className="material-item">
            <h2>{material.title}</h2>
            <p>{material.description}</p>
            <button
              className="download-button"
              onClick={() => downloadFiles(material.fileLinks)}
              disabled={isDownloading}
            >
              {isDownloading ? 'Downloading...' : 'Download All'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};



export default DownloadableRevisionMaterialsPage;