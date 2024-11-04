import React from 'react';
import CareerGuideCard from '../components/CareerGuideCard';
import './CareerGuidesPage.css'; // Import the CSS file for styling

const careerGuides = [
  {
    title: 'Career Paths in Civil Engineering',
    description: 'Explore various career paths available in the field of civil engineering.',
    link: '/guides/career-paths', // Replace with the actual link to the guide
  },
  {
    title: 'Interview Preparation for Civil Engineers',
    description: 'Get tips and strategies for acing your civil engineering job interviews.',
    link: '/guides/interview-preparation', // Replace with the actual link to the guide
  },
  {
    title: 'Essential Skills for Civil Engineers',
    description: 'Learn about the essential skills required to succeed as a civil engineer.',
    link: '/guides/essential-skills', // Replace with the actual link to the guide
  },
  {
    title: 'Networking Tips for Civil Engineers',
    description: 'Discover effective networking strategies to advance your civil engineering career.',
    link: '/guides/networking-tips', // Replace with the actual link to the guide
  },
  {
    title: 'Continuing Education for Civil Engineers',
    description: 'Find out about continuing education opportunities and certifications for civil engineers.',
    link: '/guides/continuing-education', // Replace with the actual link to the guide
  },
  // Add more career guides here
];

const CareerGuidesPage = () => {
  return (
    <div className="career-guides-page">
      <h1>Career Guides</h1>
      <div className="guides-list">
        {careerGuides.map((guide, index) => (
          <CareerGuideCard
            key={index}
            title={guide.title}
            description={guide.description}
            link={guide.link}
          />
        ))}
      </div>
    </div>
  );
};

export default CareerGuidesPage;