// src/pages/DownloadableRevisionMaterialsPage.js
import React, { useState } from 'react';
import './DownloadableRevisionMaterialsPage.css'; // Import the CSS file for styling

const downloadableMaterials = [
  {
    title: 'Structural Engineering Notes',
    description: 'Download comprehensive notes on structural engineering.',
    fileLinks: [
      'https://engineeringhub.engineer/public/structural_notes.pdf',
      'https://ocw.mit.edu/courses/1-050-engineering-mechanics-i-fall-2007/mit1_050f07_lec01.pdf',
    ],
  },
  {
    title: 'Soil Mechanics Short Notes',
    description: 'Foundational concepts in geotechnical engineering.',
    fileLinks: [
      'https://drive.google.com/file/d/abcdef/download',
      'https://kenyanmaterials.org/soil_mechanics/lecture1.pdf',
    ],
  },
  {
    title: 'Fluid Mechanics Handwritten Notes',
    description: 'Core principles of fluid mechanics and applications.',
    fileLinks: [
      'https://drive.google.com/file/d/uvwx123/download',
      'https://engineeringhub.engineer/public/fluid_mechanics_notes.pdf',
    ],
  },
  {
    title: 'Transportation Engineering Resources',
    description: 'Free notes on traffic systems and highway design.',
    fileLinks: [
      'https://drive.google.com/file/d/ghijklm/download',
      'https://kenyanmaterials.org/transportation_engineering/traffic_design.pdf',
    ],
  },
  {
    title: 'Reinforced Concrete Structures',
    description: 'Short notes on RCC design methods.',
    fileLinks: [
      'https://drive.google.com/file/d/nopqrst/download',
      'https://engineeringhub.engineer/public/construction_management.pdf',
    ],
  },
  {
    title: 'Engineering Hydrology Notes',
    description: 'Hydrological processes and their engineering applications.',
    fileLinks: [
      'https://drive.google.com/file/d/abc456hydrology.pdf',
    ],
  },
  {
    title: 'Open Channel Flow Notes',
    description: 'Fluid flow in open channels and practical applications.',
    fileLinks: [
      'https://drive.google.com/file/d/xyz789flow.pdf',
    ],
  },
  {
    title: 'Environmental Engineering PDF Notes',
    description: 'Notes on wastewater treatment and solid waste management.',
    fileLinks: [
      'https://esenotes.com/env_notes.pdf',
    ],
  },
  {
    title: 'Building Materials',
    description: 'Learn about sustainable and traditional construction materials.',
    fileLinks: [
      'https://drive.google.com/file/d/xyz456/materials_notes.pdf',
    ],
  },
  {
    title: 'Project Management PDF',
    description: 'Resources for planning, risk analysis, and execution.',
    fileLinks: [
      'https://dl.dropboxusercontent.com/s/example123/project_management.pdf',
    ],
  },
  {
    title: 'Residential Structural Design Guide',
    description: 'Detailed information on structural engineering for light-frame housing and townhouses.',
    fileLinks: [
        'https://dl.dropboxusercontent.com/s/example123/residential_structural_design.pdf',
    ],
  },
  {
    title: 'Civil Engineering Materials and Construction',
    description: 'Comprehensive notes on building materials, including properties of concrete, wood, and aggregates.',
    fileLinks: [
        'https://dl.dropboxusercontent.com/s/example456/civil_materials_construction.pdf',
    ],
  },
  {
    title: '200 Questions on Practical Civil Engineering Works',
    description: 'Questions and answers on bridge work, concrete structures, and drainage systems.',
    fileLinks: [
        'https://dl.dropboxusercontent.com/s/example789/civil_qna.pdf',
    ],
  },
  {
    title: 'Fluid Mechanics Notes',
    description: 'Core principles of fluid mechanics for civil engineering applications.',
    fileLinks: [
        'https://civilengineeringnotes.github.io/fluid_mechanics_notes.pdf',
    ],
  },
  {
    title: 'Transportation Engineering Part 1',
    description: 'Introduction to traffic systems, highway design, and transportation planning.',
    fileLinks: [
        'https://civilengineeringnotes.github.io/transportation_engineering_part1.pdf',
    ],
  },
  {
    title: 'Geotechnical Engineering Part 1',
    description: 'Notes on soil mechanics and foundational geotechnical concepts.',
    fileLinks: [
        'https://civilengineeringnotes.github.io/geotechnical_engineering_part1.pdf',
    ],
  },
  {
    title: 'Environmental Engineering Notes',
    description: 'Topics covering wastewater treatment, pollution control, and sustainability.',
    fileLinks: [
        'https://esenotes.com/environmental_engineering_notes.pdf',
    ],
  },
  {
    title: 'Irrigation Engineering Notes',
    description: 'Basics of water distribution, irrigation techniques, and hydrology.',
    fileLinks: [
        'https://esenotes.com/irrigation_engineering_notes.pdf',
    ],
  },
  {
    title: 'Open Channel Flow Notes',
    description: 'Study of fluid flow in open channels and its practical applications.',
    fileLinks: [
        'https://dl.dropboxusercontent.com/s/example101/open_channel_flow.pdf',
    ],
  },
  {
    title: 'Hydraulic Machines Notes',
    description: 'Fundamentals of pumps, turbines, and other hydraulic devices.',
    fileLinks: [
        'https://esenotes.com/hydraulic_machines_notes.pdf',
    ],
  },
  {
    title: 'The Civil Engineering Handbook',
    description: 'A comprehensive guide covering theories, design practices, and applications in civil engineering.',
    fileLinks: [
        'https://archive.org/download/the-civil-engineering-handbook-second-edition/The%20Civil%20Engineering%20Handbook%20Second%20Edition.pdf',
    ],
},
{
    title: 'Residential Structural Design Guide',
    description: 'Detailed guide on designing structural components for light-frame housing and townhouses.',
    fileLinks: [
        'https://dl.dropboxusercontent.com/s/example123/residential_structural_design.pdf',
    ],
},
{
    title: 'Civil Engineer’s Reference Book',
    description: 'Covers materials, hydraulics, surveying, soil mechanics, and project management techniques.',
    fileLinks: [
        'https://archive.org/download/civilengineersre0004unse_h5s4/Civil_Engineer%27s_Reference_Book_Fourth_Edition.pdf',
    ],
},
{
    title: 'Geotechnical Engineering Foundation Notes',
    description: 'Notes on soil mechanics and foundation engineering.',
    fileLinks: [
        'https://esenotes.com/foundation_engineering_notes.pdf',
    ],
},
{
    title: 'Hydraulic Machines Notes',
    description: 'Fundamentals of pumps, turbines, and other hydraulic devices.',
    fileLinks: [
        'https://esenotes.com/hydraulic_machines_notes.pdf',
    ],
},
{
    title: 'Transportation Engineering Notes',
    description: 'Comprehensive study materials on traffic systems, highway design, and transportation planning.',
    fileLinks: [
        'https://dl.dropboxusercontent.com/s/example456/transportation_engineering_notes.pdf',
    ],
},
{
    title: 'Fluid Mechanics Notes',
    description: 'Study materials focusing on fluid dynamics and applications in civil engineering.',
    fileLinks: [
        'https://esenotes.com/fluid_mechanics_notes.pdf',
    ],
},
{
    title: 'Modern Methods of Construction',
    description: 'Exploration of innovative technologies and practices in civil construction.',
    fileLinks: [
        'https://dl.dropboxusercontent.com/s/example789/modern_methods_construction.pdf',
    ],
},
{
    title: 'Open Channel Flow Notes',
    description: 'In-depth notes on fluid flow in open channels.',
    fileLinks: [
        'https://esenotes.com/open_channel_flow_notes.pdf',
    ],
},
{
    title: 'Building Materials and Construction',
    description: 'Covers properties and applications of construction materials like concrete and wood.',
    fileLinks: [
        'https://esenotes.com/building_materials_notes.pdf',
    ],
},


];

const DownloadableRevisionMaterialsPage = () => {
  const [isDownloading, setIsDownloading] = useState(false);

  // Function to download multiple files
  const downloadFiles = (fileLinks) => {
    setIsDownloading(true);
    fileLinks.forEach((fileLink) => {
      const link = document.createElement('a');
      link.href = fileLink.startsWith('http') ? fileLink : `${window.location.origin}/${fileLink}`;
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
