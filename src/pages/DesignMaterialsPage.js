import React, { useState, useContext } from 'react';
import DesignMaterialCard from '../components/DesignMaterialCard';
import AffiliateMarketingCard from '../components/AffiliateMarketingcard';
import ExtensionCard from '../components/ExtensionCard'; // New component for extensions
import AuthModal from '../components/AuthModal';
import './DesignMaterialsPage.css';
import { AuthContext } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

// Engineering Hub Extensions data
const engineeringExtensions = [
  {
    id: 'study-boost',
    title: 'Study Boost',
    description: 'Upload your study materials and let our AI create personalized summaries, quizzes, and explanations to help you master any subject.',
    icon: 'fa-graduation-cap',
    features: [
      'AI-powered concept explanations',
      'Interactive practice problems',
      'Study progress tracking',
      'Personalized learning paths'
    ],
    color: '#4F46E5', // Indigo
    path: '/hub/study-boost',
    externalUrl: 'https://study-helper-boost.vercel.app/'
  },
  {
    id: 'concrete-design',
    title: 'Concrete Design AI',
    description: 'Visualize and analyze reinforced concrete systems. View reinforcement details in 3D and 2D and export detailed analysis in pdf and Dxf formats. Use a preset of rules or charge your questions to AI.',
    icon: 'fa-cubes',
    features: [
      '3D model visualization',
      'AI design assistant',
      'PDF and DXF export',
      'Interactive reinforcement detailing'
    ],
    color: '#EC4899', // Pink
    path: '/hub/concrete-design',
    externalUrl: 'https://concreteaiengineeringhub.netlify.app/' // Placeholder for future integration
  },
  /*{
    id: 'material-explorer',
    title: 'Material Explorer',
    description: 'Comprehensive database of engineering materials with detailed properties, applications, and comparison tools to help you select the perfect material for your projects.',
    icon: 'fa-flask',
    features: [
      'Material property database',
      'Visual comparison tools',
      'Application suggestions',
      'Cost and sustainability metrics'
    ],
    color: '#F59E0B', // Amber
    path: '/hub/material-explorer',
    externalUrl: '#' // Placeholder for future integration
  }*/
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
      '/etabs1.png',
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
    id: 17,
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

// SVG Illustrations Components
const StructuralDesignIllustration = () => (
  <motion.svg 
    className="card-illustration" 
    viewBox="0 0 200 120" 
    initial="hidden"
    animate="visible"
  >
    <motion.path
      d="M40 100 L40 40 L160 40 L160 100"
      stroke="var(--accent-color)"
      strokeWidth="2"
      fill="none"
      variants={{
        hidden: { pathLength: 0 },
        visible: { pathLength: 1 }
      }}
      transition={{ duration: 2, ease: "easeInOut" }}
    />
    {/* Floor lines */}
    {[60, 80].map((y, i) => (
      <motion.line
        key={i}
        x1="40"
        y1={y}
        x2="160"
        y2={y}
        stroke="var(--accent-color)"
        strokeWidth="2"
        strokeDasharray="5,5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 + (i * 0.3) }}
      />
    ))}
    {/* Windows */}
    {[1, 2, 3].map((x, i) => (
      <motion.rect
        key={i}
        x={60 + (i * 35)}
        y="50"
        width="20"
        height="20"
        fill="none"
        stroke="var(--accent-color)"
        strokeWidth="2"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.5 + (i * 0.2) }}
      />
    ))}
  </motion.svg>
);

const InteriorDesignIllustration = () => (
  <motion.svg 
    className="card-illustration" 
    viewBox="0 0 200 120"
    initial="hidden"
    animate="visible"
  >
    {/* Room outline */}
    <motion.path
      d="M40 30 L160 30 L160 100 L40 100 Z"
      stroke="var(--accent-color)"
      strokeWidth="2"
      fill="none"
      variants={{
        hidden: { pathLength: 0 },
        visible: { pathLength: 1 }
      }}
      transition={{ duration: 2 }}
    />
    {/* Furniture */}
    <motion.path
      d="M60 60 L90 60 L90 80 L60 80 Z" // Table
      stroke="var(--accent-color)"
      strokeWidth="2"
      fill="none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1 }}
    />
    <motion.path
      d="M120 50 C120 50, 140 50, 140 70 C140 90, 120 90, 120 70 Z" // Chair
      stroke="var(--accent-color)"
      strokeWidth="2"
      fill="none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1.5 }}
    />
  </motion.svg>
);

// New Component: SectionHeader
const SectionHeader = ({ title, subtitle }) => (
  <motion.div 
    className="section-header"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
  >
    <h1>{title}</h1>
    {subtitle && <p className="section-subtitle">{subtitle}</p>}
  </motion.div>
);

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
      
      {/* AI Optimizer Preview Section */}
      <section className="ai-optimizer-preview">
        <motion.div 
          className="ai-optimizer-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="card-content">
            <h2>AI Engineering Design Optimizer</h2>
            <p className="description">
              Harness the power of AI to optimize your engineering designs. 
              Generate efficient and cost-effective solutions for beams, 
              trusses, and foundations based on your specific requirements.
            </p>
            
            <div className="features-grid">
              <div className="feature">
                <i className="fas fa-bolt"></i>
                <span>Instant Design Generation</span>
              </div>
              <div className="feature">
                <i className="fas fa-shield-alt"></i>
                <span>Safety Factor Compliance</span>
              </div>
              <div className="feature">
                <i className="fas fa-coins"></i>
                <span>Cost Optimization</span>
              </div>
            </div>

            <Link 
              to="/ai-design-optimizer"
              className="try-optimizer-button"
              onClick={() => {
                if (!currentUser) {
                  handleAuthRequired();
                  return false;
                }
              }}
            >
              Try AI Design Optimizer
              <i className="fas fa-arrow-right"></i>
            </Link>
          </div>
          
          <div className="card-illustration">
            <StructuralDesignIllustration />
          </div>
        </motion.div>
      </section>

      {/* New Engineering Hub Extensions Section */}
      <section className="engineering-hub-section">
        <SectionHeader 
          title="Engineering Hub Extensions" 
          subtitle="Powerful tools to enhance your engineering workflow" 
        />
        
        <motion.div 
          className="extensions-container"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {engineeringExtensions.map((extension, index) => (
            <ExtensionCard 
              key={extension.id}
              extension={extension}
              index={index}
              onInteraction={handleInteraction}
            />
          ))}
        </motion.div>
      </section>
      
      {/* Recommended Software Section */}
      <section className="recommended-software-section">
        <SectionHeader title="Recommended Engineering Software" />
        <motion.div 
          className="affiliate-marketing-list"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {affiliatemarketing.map((marketing) => (
            <AffiliateMarketingCard key={marketing.id} marketing={marketing} />
          ))}
        </motion.div>
      </section>
    </div>
  );
};

export default DesignMaterialsPage;