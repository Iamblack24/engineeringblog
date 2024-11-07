import React from 'react';
import DesignMaterialCard from '../components/DesignMaterialCard';
import './DesignMaterialsPage.css';

const designMaterials = [
  {
    id: 1,
    title: 'Structural CAD Design for Multi-Storey Building',
    author: 'Eng Phil Mbogandi',
    specialists: ['Owen Richard', 'Scott Evans'],
    price: 'Ksh 100,000',
    description: 'Cad design for a commercial building rising 6 floors.',
    images: [
      '/cad1.jpg',
      '/cad2.jpg',
      '/cad3.jpg',
    ],
    purchaseLink: '/purchase/1',
    contactLink: '/contact',
  },
  {
    id: 2,
    title: 'Interior Design for Residential Apartment',
    author: 'Architect Jane Kariuki',
    specialists: ['Alice Wangui', 'David Mwangi'],
    price: 'Ksh 50,000',
    description: 'Interior design for a modern apartment with contemporary finishes.',
    images: [
      '/interior1.jpg',
      '/interior2.jpg',
      '/interior3.jpg',
    ],
    purchaseLink: '/purchase/2',
    contactLink: '/contact',
  }
  // Add more design materials as needed
];

const DesignMaterialsPage = () => {
  return (
    <div className="design-materials-page">
      <h1>Design Materials for Purchase</h1>
      <div className="materials-list">
        {designMaterials.map((material) => (
          <DesignMaterialCard key={material.id} material={material} />
        ))}
      </div>
    </div>
  );
};

export default DesignMaterialsPage;