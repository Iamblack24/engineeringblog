// src/pages/DownloadableRevisionMaterialsPage.js
import React, { useState } from 'react';
import './DownloadableRevisionMaterialsPage.css'; // Import the CSS file for styling

const downloadableMaterials = [
  {
    title: 'Structural Engineering Notes',
    description: 'Download comprehensive notes on structural engineering.',
    fileLinks: [
      '/utils/DCE 073_THEORY OF STRUCTURES I.pdf',
      '/downloads/structural-engineering-notes-part2.pdf',
      '/downloads/structural-engineering-notes-part3.pdf',
    ],
  },
  {
    title: 'Soil Mechanics 1A',
    description: 'Download notes on soil mechanics for third year civil students.',
    fileLinks: [
      '/utils/EECQ 3171-Soil Mechanics IA-Slides 1-49.pdf',
      '/utils/EECQ 3171-Soil Mechanics IA - slides 50-76.pdf',
    ],
  },
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