// src/pages/CaseStudiesPage.js
import React from 'react';
import CaseStudyCard from '../components/CaseStudyCard';
import './CaseStudiesPage.css';

const caseStudies = [
  {
    id: 1,
    title: 'The Burj Khalifa: Engineering Marvel',
    description: "An in-depth look at the engineering challenges and solutions behind the world's tallest building.",
    image: '/burj.jpg', // Replace with the actual path to the image
    content: `
### Overview

The **Burj Khalifa** in Dubai stands at an astounding 828 meters, making it the tallest building in the world. This case study explores the innovative engineering techniques used to overcome challenges related to height, wind forces, and construction logistics.

### Engineering Challenges

- **Structural Stability:** Designing a structure that can withstand high wind speeds and seismic activities.
- **Foundation Construction:** Dealing with the weak and porous soil conditions in Dubai.
- **Material Transportation:** Pumping concrete to unprecedented heights.

### Solutions

- **Buttressed Core Structural System:** A unique design that provides stability and reduces wind forces.
- **Deep Pile Foundations:** Using reinforced concrete piles extending 50 meters into the ground.
- **High-Strength Concrete:** Developing a special concrete mix that retains workability during pumping to great heights.

### Conclusion

The Burj Khalifa represents a pinnacle of modern engineering, demonstrating how innovative solutions can overcome significant structural challenges.
    `,
  },
  {
    id: 2,
    title: 'The Panama Canal Expansion',
    description: 'Exploring the engineering feats and innovations involved in the expansion of the Panama Canal.',
    image: '/panama.jpg', // Replace with the actual path to the image
    content: `
### Overview

The **Panama Canal Expansion** project aimed to double the canal's capacity by adding a new lane for bigger ships. This involved constructing new locks, excavating new channels, and deepening existing ones.

### Engineering Challenges

- **Designing New Locks:** Accommodating larger vessels known as "New Panamax" ships.
- **Water Management:** Ensuring efficient water usage to prevent depletion.
- **Seismic Considerations:** Building structures to withstand potential earthquakes.

### Solutions

- **Innovative Lock Design:** Implementing water-saving basins that recycle 60% of the water used per transit.
- **Advanced Materials:** Utilizing high-performance concrete for durability.
- **Seismic Reinforcement:** Incorporating features to enhance earthquake resistance.

### Conclusion

The expansion project significantly enhanced global trade capabilities, showcasing engineering excellence in large-scale infrastructure development.
    `,
  },
  // Add more case studies with detailed content here
];

const CaseStudiesPage = () => {
  return (
    <div className="case-studies-page">
      <h1>Case Studies</h1>
      <div className="case-studies-container">
        {caseStudies.map((caseStudy) => (
          <CaseStudyCard key={caseStudy.id} caseStudy={caseStudy} />
        ))}
      </div>
    </div>
  );
};

export default CaseStudiesPage;

// Exporting caseStudies for use in other components
export { caseStudies };