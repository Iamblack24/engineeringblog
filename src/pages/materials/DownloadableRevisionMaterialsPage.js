// src/pages/DownloadableRevisionMaterialsPage.js
import React, { useState } from 'react';
import './DownloadableRevisionMaterialsPage.css'; // Import the CSS file for styling

const downloadableMaterials = [
  {
    title: 'Structural Engineering Notes',
    description: 'Download comprehensive notes on structural engineering.',
    fileLinks: [
      'https://ocw.mit.edu/courses/1-050-engineering-mechanics-i-fall-2007/mit1_050f07_lec01.pdf',
      'https://ocw.mit.edu/courses/1-050-engineering-mechanics-i-fall-2007/mit1_050f07_lec02.pdf',
      'https://ocw.mit.edu/courses/1-050-engineering-mechanics-i-fall-2007/mit1_050f07_lec03.pdf',
    ],
  },
  {
    title: 'Soil Mechanics 1A',
    description: 'Download notes on soil mechanics for third year civil students.',
    fileLinks: [
      'https://nptel.ac.in/content/storage2/courses/105101001/downloads/Lecture1.pdf',
      'https://nptel.ac.in/content/storage2/courses/105101001/downloads/Lecture2.pdf',
    ],
  },
  {
    title: 'Engineering Graphics B',
    description: 'Download notes on engineering graphics for second year civil students.',
    fileLinks: [
      'https://nptel.ac.in/content/storage2/courses/112103019/pdf/mod1.pdf',
      'https://nptel.ac.in/content/storage2/courses/112103019/pdf/mod2.pdf',
      'https://nptel.ac.in/content/storage2/courses/112103019/pdf/mod3.pdf',
    ],
  },
  {
    title: 'Fluid Mechanics Fundamentals',
    description: 'Comprehensive study materials for fluid mechanics principles and applications.',
    fileLinks: [
      'https://ocw.mit.edu/courses/2-25-advanced-fluid-mechanics-fall-2013/resources/mit2_25f13_shear_stress/',
      'https://ocw.mit.edu/courses/2-25-advanced-fluid-mechanics-fall-2013/resources/mit2_25f13_viscosity/',
      'https://ocw.mit.edu/courses/2-25-advanced-fluid-mechanics-fall-2013/resources/mit2_25f13_fundamental/'
    ],
  },
  {
    title: 'Steel Structures Design',
    description: 'Advanced materials on steel structure analysis and design principles.',
    fileLinks: [
      'https://ocw.mit.edu/courses/1-051-structural-engineering-design-fall-2003/resources/design_steel/',
      'https://ocw.mit.edu/courses/1-051-structural-engineering-design-fall-2003/resources/connections/',
      'https://ocw.mit.edu/courses/1-051-structural-engineering-design-fall-2003/resources/beam_design/'
    ],
  },
  {
    title: 'Environmental Engineering',
    description: 'Study materials covering water treatment and environmental systems.',
    fileLinks: [
      'https://ocw.mit.edu/courses/1-83-environmental-organic-chemistry-fall-2002/resources/environmental_processes/',
      'https://ocw.mit.edu/courses/1-83-environmental-organic-chemistry-fall-2002/resources/water_chemistry/'
    ],
  },
  {
    title: 'Transportation Engineering',
    description: 'Notes on highway design, traffic engineering, and transportation systems.',
    fileLinks: [
      'https://nptel.ac.in/content/storage2/courses/105101008/downloads/Lec-1.pdf',
      'https://nptel.ac.in/content/storage2/courses/105101008/downloads/Lec-2.pdf'
    ],
  },
  {
    title: 'Construction Management',
    description: 'Materials covering project planning, scheduling, and construction techniques.',
    fileLinks: [
      'https://ocw.mit.edu/courses/1-040-project-management-spring-2009/resources/project_planning/',
      'https://ocw.mit.edu/courses/1-040-project-management-spring-2009/resources/risk_analysis/',
      'https://ocw.mit.edu/courses/1-040-project-management-spring-2009/resources/scheduling/'
    ],
  }
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