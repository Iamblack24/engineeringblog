// src/pages/materials/DownloadableMaterialsPage.js
import React from 'react';
import './DownloadableMaterialsPage.css';

const DownloadableMaterialsPage = () => {
  const downloadableMaterials = [
    {
      id: 1,
      title: 'Construction Materials Handbook',
      description: 'Free handbook from FHWA covering construction materials.',
      link: 'https://www.fhwa.dot.gov/construction/pubs/hif13019.pdf',
    },
    {
      id: 2,
      title: 'Structural Analysis Guide',
      description: 'MIT OpenCourseWare structural analysis materials.',
      link: 'https://ocw.mit.edu/courses/1-050-engineering-mechanics-i-fall-2007/resources/lecture_1.pdf',
    },
    {
      id: 3,
      title: 'Building Services Guide',
      description: 'CIBSE Guide for building services engineering.',
      link: 'https://www.cibse.org/getmedia/03c25773-8c3c-454d-937d-aaf8f1070cbe/ECG19-Energy-Efficiency-in-Buildings.pdf.aspx',
    },
    {
      id: 4,
      title: 'Sustainable Construction Guide',
      description: 'Sustainable construction guidelines by WRAP.',
      link: 'http://www.wrap.org.uk/sites/files/wrap/Design_Construction_Guide.pdf',
    }
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