import React from 'react';
import DesignMaterialCard from '../components/DesignMaterialCard';
import AffiliateMarketingCard from '../components/AffiliateMarketingcard';
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

const affiliatemarketing = [
  {
    id: '1',
    title: 'archicad 24-27',
    description: 'Archicad is a desktop software that can go a long way helping you in your design projects',
    price: 'free',
    images: [
      '/cad1.jpg',
      '/cad2.jpg',
      '/build.jpg'
    ],
    link: 'an affiliate link'
  }
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
      <h1>Affiliate Marketing</h1>
      <div className="affiliate-marketing-list">
        {affiliatemarketing.map((marketing) => (
          <AffiliateMarketingCard key={marketing.id} marketing={marketing} />
        ))}
      </div>
    </div>
  );
};

export default DesignMaterialsPage;