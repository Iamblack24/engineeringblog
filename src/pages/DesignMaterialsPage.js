import React, { useState, useContext } from 'react';
import DesignMaterialCard from '../components/DesignMaterialCard';
import AffiliateMarketingCard from '../components/AffiliateMarketingcard';
//import EducationalResourcesCard from '../components/EducationalResourcesCard';
import AuthModal from '../components/AuthModal';
import './DesignMaterialsPage.css';
import { AuthContext } from '../contexts/AuthContext';

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
    link: 'https://graphisoft.com/solutions/archicad'
  },
  {
    id: '2',
    title: 'Revit 2024',
    description: 'Revit is a powerful BIM software for architects, structural engineers, and contractors.',
    price: 'free',
    images: [
      '/revit.png',
      '/revit2.jpeg',
      '/revit3.jpeg'
    ],
    link: 'https://www.autodesk.com/products/revit/overview'
  },
  {
    id: '3',
    title: 'SketchUp Pro',
    description: 'SketchUp Pro offers 3D modeling tools for architects and designers.',
    price: 'free',
    images: [
      '/sketchup1.jpeg',
      '/sketchup2.jpeg',
      '/sketchup.jpeg'
    ],
    link: 'https://www.sketchup.com/products/sketchup-pro'
  },
  {
    id: '4',
    title: 'AutoCAD Architecture',
    description: 'AutoCAD Architecture provides architectural design and documentation tools.',
    price: 'free',
    images: [
      '/autocad1.jpeg',
      '/autocad2.jpeg',
      '/autocad.jpeg'
    ],
    link: 'https://www.autodesk.com/products/autocad/overview'
  },
  {
    id: '5',
    title: 'Vectorworks Architect',
    description: 'Vectorworks Architect offers integrated BIM tools for professional architects.',
    price: 'free',
    images: [
      '/vectorworks1.png',
      '/vectorworks2.jpeg',
      '/vectorworks.jpeg'
    ],
    link: 'https://www.vectorworks.net/architect'
  },
  {
    id: '7',
    title: 'Lumion',
    description: 'Lumion transforms your 3D models into stunning visualizations quickly.',
    price: 'free',
    images: [
      '/lumion1.jpeg',
      '/lumion2.jpeg',
      '/lumion.jpeg'
    ],
    link: 'https://lumion.com/'
  },
  {
    id: '8',
    title: 'Navisworks',
    description: 'Navisworks enables comprehensive project review and coordination for BIM projects.',
    price: 'free',
    images: [
      '/naviswork1.jpeg',
      '/naviswork2.jpeg',
      '/naviswork.jpeg'
    ],
    link: 'https://www.autodesk.com/products/navisworks/overview'
  },
  {
    id: 9,
    title: 'AutoCAD',
    description: 'Industry-leading CAD software for 2D and 3D design and drafting.',
    price: 'Ksh 25,000/year',
    images: [
      '/autocad1.jpg',
      '/autocad2.jpg',
      '/autocad3.jpg',
    ],
    link: 'https://www.autodesk.com/products/autocad/overview',
  },
  {
    id: 10,
    title: 'SolidWorks',
    description: 'Comprehensive 3D CAD software for product design and engineering.',
    price: 'Ksh 30,000/year',
    images: [
      '/solidworks1.jpg',
      '/solidworks2.jpg',
      '/solidworks3.jpg',
    ],
    link: 'https://www.solidworks.com/',
  },
  {
    id: 11,
    title: 'MATLAB',
    description: 'High-performance language for technical computing and algorithm development.',
    price: 'Ksh 20,000/year',
    images: [
      '/matlab1.jpg',
      '/matlab2.jpg',
      '/matlab3.jpg',
    ],
    link: 'https://www.mathworks.com/products/matlab.html',
  },
  {
    id: 12,
    title: 'ANSYS',
    description: 'Engineering simulation software for structural, fluid, and thermal analysis.',
    price: 'Ksh 50,000/year',
    images: [
      '/ansys1.jpg',
      '/ansys2.jpg',
      '/ansys3.jpg',
    ],
    link: 'https://www.ansys.com/',
  },
  {
    id: 13,
    title: 'SAP2000',
    description: 'Versatile structural analysis and design software for engineers.',
    price: 'Ksh 40,000/year',
    images: [
      '/sap20001.jpg',
      '/sap20002.jpg',
      '/sap20003.jpg',
    ],
    link: 'https://www.csiamerica.com/products/sap2000',
  },
  {
    id: 14,
    title: 'ETABS',
    description: 'Integrated software for building analysis and design.',
    price: 'Ksh 45,000/year',
    images: [
      '/etabs1.jpg',
      '/etabs2.jpg',
      '/etabs3.jpg',
    ],
    link: 'https://www.csiamerica.com/products/etabs',
  },
  {
    id: 15,
    title: 'Rhino 3D',
    description: 'Advanced 3D modeling software for architects and engineers.',
    price: 'Ksh 15,000/year',
    images: [
      '/rhino1.jpg',
      '/rhino2.jpg',
      '/rhino3.jpg',
    ],
    link: 'https://www.rhino3d.com/',
  },
  {
    id: 16,
    title: 'SketchUp',
    description: 'User-friendly 3D modeling tool for quick architectural designs.',
    price: 'Ksh 10,000/year',
    images: [
      '/sketchup1.jpg',
      '/sketchup2.jpg',
      '/sketchup3.jpg',
    ],
    link: 'https://www.sketchup.com/',
  },
  {
    id: 17,
    title: 'ArcGIS',
    description: 'Comprehensive GIS software for spatial analysis and mapping.',
    price: 'Ksh 35,000/year',
    images: [
      '/arcgis1.jpg',
      '/arcgis2.jpg',
      '/arcgis3.jpg',
    ],
    link: 'https://www.esri.com/en-us/arcgis/products/index',
  },
  {
    id: 18,
    title: 'Bluebeam Revu',
    description: 'PDF creation, editing, markup, and collaboration technology for design workflows.',
    price: 'Ksh 12,000/year',
    images: [
      '/bluebeam1.jpg',
      '/bluebeam2.jpg',
      '/bluebeam3.jpg',
    ],
    link: 'https://www.bluebeam.com/solutions/revu',
  },
];

const DesignMaterialsPage = () => {
  const { currentUser } = useContext(AuthContext);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleInteraction = () => {
    if (!currentUser) {
      setShowAuthModal(true);
      return false;
    }
    return true;
  };

   const handleAuthRequired = () => {
     setShowAuthModal(true);
   };



  return (
    <div className="design-materials-page">
      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}
      {}
      <h1>Design Materials for Purchase</h1>
      <div className="materials-list">
        {designMaterials.map((material) => (
          <DesignMaterialCard key={material.id} material={material} onInteraction={() => { handleInteraction(); handleAuthRequired(); }} />
        ))}
      </div> 
      {/* New Affiliate Marketing Section */}
      <h1>Recommended Engineering Software</h1>
      <div className="affiliate-marketing-list">
        {affiliatemarketing.map((marketing) => (
          <AffiliateMarketingCard key={marketing.id} marketing={marketing} />
        ))}
      </div>
    </div>
  );
};

export default DesignMaterialsPage;