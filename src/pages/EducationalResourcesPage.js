// EducationalResourcesPage.js
import React, { useState } from 'react';
import './EducationalResourcesPage.css';

const EducationalResourcesPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const youtubeLinks = [
    {
      id: 1,
      title: 'Introduction to Structural CAD',
      embedId: 'qu-_NJcIN78', // Replace with actual YouTube embed IDs
    },
    {
      id: 2,
      title: 'Advanced Building Design Techniques',
      embedId: 'uxceGQaJFzI',
    },
    {
      id: 3,
      title: 'Introduction into Construction Project Management, Site Supervision, and Management',
      embedId: 'QihUF_jFz5I',
    },
    {
        id: 4,
        title: 'Effective Communication in the Construction Industry',
        embedId: 'uJ-zsFLqT1k',
    },
    {
        id: 5,
        title: 'How to improve communication in construction',
        embedId: '2p6pFhQd_xo',
    },
    {
      id: 6,
      title: 'Sustainable Building Practices',
      embedId: 'oFMV3e4yYL8', // Replace with actual relevant YouTube embed IDs
    },
    {
      id: 7,
      title: 'Emerging Construction Technologies',
      embedId: 'IIkKkDVQhhw',
    },
    {
      id: 8,
      title: 'Effective Cost Management in Projects',
      embedId: '7bXcc7AYajo',
    },
    {
      id: 9,
      title: 'Legal Issues in Construction',
      embedId: '_mo_cGa0lkY',
    },
    {
      id: 10,
      title: 'Green Certification Processes',
      embedId: 'u3Cx9GRbdYQ',
    },
    {
      id: 11,
      title: 'Health and Safety in Construction',
      embedId: 'z_gisl4vXQM',
    },
    
    // Add more educational YouTube links as needed
  ];

  const filteredVideos = youtubeLinks.filter(video =>
    video.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="educational-resources-page">
      <h1>Engineering Concepts in Motion</h1>
      <input
        type="text"
        placeholder="Search videos..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="search-input"
      />
      <div className="videos-container">
        {filteredVideos.map((video) => (
          <div key={video.id} className="video-card">
            <h2>{video.title}</h2>
            <div className="video-responsive">
              <iframe
                width="560"
                height="315"
                src={`https://www.youtube.com/embed/${video.embedId}`}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={video.title}
              ></iframe>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EducationalResourcesPage;