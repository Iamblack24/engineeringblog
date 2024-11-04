import React from 'react';
import CaseStudyCard from '../components/CaseStudyCard';
import './CaseStudiesPage.css'; // Import the CSS file for styling

const caseStudies = [
  {
    id: 1,
    title: 'The Burj Khalifa: Engineering Marvel',
    description: 'An in-depth look at the engineering challenges and solutions behind the world\'s tallest building.',
    image: '/path/to/burj-khalifa.jpg', // Replace with the actual path to the image
  },
  {
    id: 2,
    title: 'The Panama Canal Expansion',
    description: 'Exploring the engineering feats and innovations involved in the expansion of the Panama Canal.',
    image: '/path/to/panama-canal.jpg', // Replace with the actual path to the image
  },
  // Add more case studies here
];

const CaseStudiesPage = () => {
  return (
    <div className="case-studies-page">
      <h1>Case Studies</h1>
      <div className="case-studies-list">
        {caseStudies.map((caseStudy) => (
          <CaseStudyCard
            key={caseStudy.id}
            id={caseStudy.id}
            title={caseStudy.title}
            description={caseStudy.description}
            image={caseStudy.image}
          />
        ))}
      </div>
    </div>
  );
};

export default CaseStudiesPage;