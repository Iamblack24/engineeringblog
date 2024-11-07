import React from 'react';
import CareerGuideCard from '../components/CareerGuideCard';
import './CareerGuidesPage.css'; // Import the CSS file for styling

const careerGuides = [
  {
    title: 'Career Paths in Civil Engineering',
    description: 'Explore various career paths available in the field of civil engineering.',
    link: '/career-guides/career-paths', // Ensure this matches the key in careerGuideDetails
  },
  {
    title: 'Interview Preparation for Civil Engineers',
    description: 'Get tips and strategies for acing your civil engineering job interviews.',
    link: '/career-guides/interview-preparation', // Ensure this matches the key in careerGuideDetails
  },
  {
    title: 'Essential Skills for Civil Engineers',
    description: 'Learn about the essential skills required to succeed as a civil engineer.',
    link: '/career-guides/essential-skills', // Ensure this matches the key in careerGuideDetails
  },
  {
    title: 'Networking Tips for Civil Engineers',
    description: 'Discover effective networking strategies to advance your civil engineering career.',
    link: '/career-guides/networking-tips', // Ensure this matches the key in careerGuideDetails
  },
  {
    title: 'Continuing Education for Civil Engineers',
    description: 'Find out about continuing education opportunities and certifications for civil engineers.',
    link: '/career-guides/continuing-education', // Ensure this matches the key in careerGuideDetails
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