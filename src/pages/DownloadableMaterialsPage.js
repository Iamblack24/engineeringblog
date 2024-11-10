
import React from 'react';
import { Link } from 'react-router-dom';
import './DownloadableMaterialsPage.css'; // Import the CSS file for styling

const downloadableMaterials = [
  {
    title: 'Past Paper 1',
    description: 'Download past paper 1 for practice.',
    link: '/downloads/past-paper-1.pdf', // Replace with the actual link to the material
  },
  {
    title: 'Past Paper 2',
    description: 'Download past paper 2 for practice.',
    link: '/downloads/past-paper-2.pdf', // Replace with the actual link to the material
  },
  // Add more downloadable materials here
];

const DownloadableMaterialsPage = () => {
  return (
    <div className="downloadable-materials-page">
      <h1>Downloadable Revision Materials</h1>
      <div className="materials-list">
        {downloadableMaterials.map((material, index) => (
          <a href={material.link} key={index} className="material-link" download>
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