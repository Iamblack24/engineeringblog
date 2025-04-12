import React, { useContext, useEffect, useState, useRef } from 'react';
import InteractiveToolCard from '../components/InteractiveToolCard';
import AuthModal from '../components/AuthModal';
import './InteractiveToolsPage.css';
import { AuthContext } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const tools = [
  {
    title: 'Built Environment AI Assistant',
    description: 'Get instant, accurate answers to your technical questions.',
    link: '/interactive-ai', // Replace with the actual link to the tool
  },
  {
    title: 'Project Management Tool',
    description: 'Manage your engineering projects with ease and efficiency.',
    link: '/project-collaboration-ai', // Replace with the actual link to the tool
  },
  {
    title: 'Engineering software Tutor',
    description: 'Get step-by-step tutorials for engineering software tools.',
    link: '/auto-tutor',
  },
  {
    title: 'Summarize Technical Documents',
    description: 'Extract key information from technical documents using AI.',
    link: '/knowledge-extraction',
  },
  {
    title: 'CAD Analysis',
    description: 'Analyze CAD models for design constraints and requirements.',
    link: '/cad-validator',
  },
  {
    title: 'Green Building Design',
    description: 'Get sustainable design suggestions for green buildings.',
    link: '/green-building-design',
  },
  {
    title: 'Load, fluid simulation and analysis',
    description: 'Analyze loads and fluid flow in engineering systems.',
    link: '/simulation-generator',
  },
  {
    title: 'Beam Analysis',
    description: 'Calculate the bending moment, shear force, and deflection of beams under various loading conditions.',
    link: '/tools/beam-calculator', 
  },
  {
    title: 'Concrete Mix Design',
    description: 'Determine the proportions of cement, sand, aggregate, and water for a given concrete mix.',
    link: '/tools/concrete-mix-design', 
  },
  {
    title: 'Slope Stability Analysis',
    description: 'Analyze the stability of slopes and embankments.',
    link: '/tools/slope-stability', 
  },
  {
    title: 'Hydraulic Calculator',
    description: 'Calculate flow rates, velocities, and pressures in pipes and open channels.',
    link: '/tools/hydraulic-calculator', // Replace with the actual link to the tool
  },
  {
    title: 'Structural Load Calculator',
    description: 'Calculate the loads on structural elements such as columns, beams, and slabs.',
    link: '/tools/structural-load', // Replace with the actual link to the tool
  },
  {
    title: 'Bill of Quantities (BoQ) Generator',
    description: 'Generate a Bill of Quantities for construction projects based on input data.',
    link: '/tools/bill-of-quantities-generator', // Replace with the actual link to the tool
  },
  {
    title: 'Soil Bearing Capacity Calculator',
    description: 'Determine the bearing capacity of soil for foundation design.',
    link: '/tools/soil-bearing-capacity', // Replace with the actual link to the tool
  },
  {
    title: 'Pile Design Tool',
    description: 'Design and analyze pile foundations for various soil conditions.',
    link: '/tools/pile-design', // Replace with the actual link to the tool
  },
  {
    title: 'Retaining Wall Design Tool',
    description: 'Design and analyze different types of retaining walls for stability and safety.',
    link: '/tools/retaining-wall-design', // Replace with the actual link to the tool
  },
  {
    title: 'Steel Connection Design Tool',
    description: 'Design bolted and welded steel connections for structural steel members.',
    link: '/tools/steel-connection-design', // Replace with the actual link to the tool
  },
  {
    title: 'Reinforced Concrete Design Tool',
    description: 'Design reinforced concrete beams, columns, and slabs for strength and durability.',
    link: '/tools/reinforced-concrete-design', // Replace with the actual link to the tool
  },
  {
    title: 'Frame Calculator' ,
    description: 'Design and analyze structural frames under various loads.' ,
    link: '/tools/frame-calculator' , // Replace with the actual link to the tool
  },
  {
    title: 'Material Selection Tool',
    description: 'Select construction materials based on strength, cost, and sustainability criteria.',
    link: '/tools/material-selection-tool', // Replace with the actual link to the tool
  },
  {
    title: 'Matrix Calculator',
    description: 'Perform matrix operations, including addition, subtraction, multiplication, and inversion.',
    link: '/tools/matrix-calculator', // Replace with the actual link to the tool
  },
  {
    title: 'Stress-Strain Generator',
    description: 'Generate stress-strain diagrams for different materials or custom data sets.',
    link: '/tools/stress-strain-generator', // Replace with the actual link to the tool
  },
  {
    title: 'Life Cycle Cost Analysis Tool',
    description: 'Analyze the life cycle costs of different alternatives for engineering projects.',
    link: '/tools/lcca-tool', // Replace with the actual link to the tool
  },
  {
    title: 'Unit Conversion Tool',
    description: 'Convert units of measurement for various physical quantities.',
    link: '/tools/unit-conversion', // Replace with the actual link to the tool
  },
  {
    title: 'Steel section Database',
    description: 'Comprehensive database of steel sections including Universal Beams, Universal Columns, Channels, and Angles with detailed section properties.',
    link: '/tools/steel-sections', // Replace with the actual link to the tool
  },
  {
    title: 'Column Design Tool',
    description: 'Design and analyze columns for axial loads, moments and buckling',
    link: '/tools/column-design', // Replace with the actual link to the tool
  },
  {
    title: 'Truss Analysis Calculator',
    description: 'Analyze 2D trusses for member forces, reactions, and deflections.',
    link: '/tools/truss-analysis',
  },
  {
    title: 'Soil Classification Tool',
    description: 'Classify soils based on grain size distribution and Atterberg limits.',
    link: '/tools/soil-classification-tool',
  },
  {
    title: 'Settlement Calculator',
    description: 'Calculate immediate and consolidation settlements under various loads.',
    link: '/tools/settlement-calculator',
  },
  {
    title: 'Earth Pressure Calculator',
    description: 'Calculate active and passive earth pressures for retaining structures.',
    link: '/tools/earth-pressure',
  },
  {
    title: 'Construction Cost Estimator',
    description: 'Estimate construction costs based on material quantities and labor.',
    link: '/tools/construction-cost',
  },
  {
    title: 'Project Timeline Generator',
    description: 'Create and manage construction project schedules and timelines.',
    link: '/tools/project-timeline-generator',
  },
  {
    title: 'Material Quantity Calculator',
    description: 'Calculate material quantities for various construction elements.',
    link: '/tools/material-quantity',
  },
  {
    title: 'Rainfall-Runoff Calculator',
    description: 'Calculate surface runoff from rainfall data using various methods.',
    link: '/tools/rainfall-runoff',
  },
  {
    title: 'Water Network Analysis',
    description: 'Analyze water distribution networks for flow and pressure.',
    link: '/tools/water-network-analysis',
  },
  {
    title: 'Carbon Footprint Calculator',
    description: 'Calculate the carbon footprint of construction projects.',
    link: '/tools/carbon-footprint-calculator',
  },
  {
    title: 'Traffic Analysis Tool',
    description: 'Analyze traffic flow and level of service for roads and intersections.',
    link: '/tools/traffic-analysis',
  },
  {
    title: 'Pavement Design Calculator',
    description: 'Design flexible and rigid pavements based on traffic and soil conditions.',
    link: '/tools/pavement-design',
  },
  {
    title: 'Highway Geometric Design',
    description: 'Calculate horizontal and vertical curve elements for highway design.',
    link: '/tools/highway-geometric',
  },
  {
    title: 'Traverse Calculator',
    description: 'Calculate and adjust traverse computations with error analysis.',
    link: '/tools/traverse-calculator',
  },
  {
    title: 'Leveling Calculator',
    description: 'Compute elevations and adjust level networks.',
    link: '/tools/leveling-calculator',
  },
  {
    title: 'Area & Volume Calculator',
    description: 'Calculate areas and volumes from survey data.',
    link: '/tools/area-volume-calculator',
  }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { 
    opacity: 0, 
    y: 20 
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut"
    }
  }
};

const fadeInVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { 
      duration: 0.6,
      ease: "easeOut" 
    }
  }
};

const tabVariants = {
  inactive: { 
    scale: 1,
    boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)"
  },
  active: { 
    scale: 1.05,
    boxShadow: "0px 8px 15px rgba(0, 0, 0, 0.2)",
    transition: { type: "spring", stiffness: 300, damping: 20 }
  }
};

const InteractiveToolsPage = () => {
  const { currentUser } = useContext(AuthContext);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const featuresRef = useRef(null);
  
  const categorizedTools = React.useMemo(() => {
    const aiKeywords = ['ai', 'assistant', 'intelligent', 'tutor', 'summarize', 'analysis', 'simulate', 'extract', 'design', 'green'];
    
    return tools.map(tool => {
      const textToCheck = (tool.title + ' ' + tool.description).toLowerCase();
      const isAiTool = aiKeywords.some(keyword => textToCheck.includes(keyword));
      
      return {
        ...tool,
        category: isAiTool ? 'ai' : 'standard'
      };
    });
  }, []);
  
  const filteredTools = React.useMemo(() => {
    return categorizedTools.filter(tool => {
      const matchesSearch = searchTerm === '' || 
        tool.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        tool.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = activeCategory === 'all' || tool.category === activeCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [categorizedTools, searchTerm, activeCategory]);
  
  const handleToolClick = (tool) => {
    if (!currentUser) {
      setShowAuthModal(true);
    } else {
      window.location.href = tool.link;
    }
  };

  useEffect(() => {
    if (currentUser) {
      setShowAuthModal(false);
    }
  }, [currentUser]);

  const handleFeaturesScroll = (event) => {
    if (window.innerWidth <= 768) {
      const container = event.target;
      const scrollPosition = container.scrollLeft;
      const itemWidth = container.offsetWidth * 0.85;
      const newActive = Math.round(scrollPosition / itemWidth);
      setActiveFeature(newActive);
    }
  };

  const handleCategoryChange = (category) => {
    setActiveCategory(category);
  };

  return (
    <div className="interactive-tools-page">
      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}
      
      <div className="ai-environment-section">
        <h2>Built Environment AI Assistant</h2>
        <p>
          Your intelligent companion for engineering queries and problem-solving.
          Get instant, accurate answers to your technical questions.
        </p>
        
        <div 
          ref={featuresRef}
          className="ai-features"
          onScroll={handleFeaturesScroll}
        >
          <div className="feature-item">
            <i className="fas fa-robot"></i>
            <h3>Smart Responses</h3>
            <p>Get detailed answers to complex engineering questions</p>
          </div>
          
          <div className="feature-item">
            <i className="fas fa-building"></i>
            <h3>Built Environment Focus</h3>
            <p>Specialized in construction and engineering domains</p>
          </div>
          
          <div className="feature-item">
            <i className="fas fa-clock"></i>
            <h3>24/7 Availability</h3>
            <p>Access expert knowledge whenever you need it</p>
          </div>
        </div>

        {window.innerWidth <= 768 && (
          <div className="scroll-indicator">
            {[0, 1, 2].map((index) => (
              <div 
                key={index}
                className={`scroll-dot ${index === activeFeature ? 'active' : ''}`}
              />
            ))}
          </div>
        )}

        <motion.button 
          className="try-ai-btn"
          onClick={() => handleToolClick(tools[0])}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Try Built Environment AI
        </motion.button>
      </div>

      <motion.h1 
        variants={fadeInVariants}
        initial="hidden"
        animate="visible"
      >
        Interactive Tools
      </motion.h1>
      
      <motion.p
        variants={fadeInVariants}
        initial="hidden"
        animate="visible"
      >
        Use our interactive tools to aid your engineering projects. Note: Verify results and report inaccuracies.
      </motion.p>
      
      <motion.div 
        className="search-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <i className="fas fa-search search-icon"></i>
        <input
          type="text"
          placeholder="Search for tools..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        {searchTerm && (
          <motion.button 
            className="clear-search"
            onClick={() => setSearchTerm('')}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <i className="fas fa-times"></i>
          </motion.button>
        )}
      </motion.div>
      
      <motion.div 
        className="category-tabs"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <motion.button
          className={`category-tab ${activeCategory === 'all' ? 'active' : ''}`}
          onClick={() => handleCategoryChange('all')}
          variants={tabVariants}
          initial="inactive"
          animate={activeCategory === 'all' ? 'active' : 'inactive'}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <i className="fas fa-th-large"></i>
          <span>All Tools</span>
          <motion.span 
            className="tool-count"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.3 }}
          >
            {categorizedTools.length}
          </motion.span>
        </motion.button>
        
        <motion.button
          className={`category-tab ${activeCategory === 'ai' ? 'active' : ''}`}
          onClick={() => handleCategoryChange('ai')}
          variants={tabVariants}
          initial="inactive"
          animate={activeCategory === 'ai' ? 'active' : 'inactive'}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <i className="fas fa-robot"></i>
          <span>AI-Powered</span>
          <motion.span 
            className="tool-count"
            animate={{ scale: activeCategory === 'ai' ? [1, 1.2, 1] : 1 }}
            transition={{ duration: 0.3 }}
          >
            {categorizedTools.filter(tool => tool.category === 'ai').length}
          </motion.span>
        </motion.button>
        
        <motion.button
          className={`category-tab ${activeCategory === 'standard' ? 'active' : ''}`}
          onClick={() => handleCategoryChange('standard')}
          variants={tabVariants}
          initial="inactive"
          animate={activeCategory === 'standard' ? 'active' : 'inactive'}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <i className="fas fa-calculator"></i>
          <span>Standard Tools</span>
          <motion.span 
            className="tool-count"
            animate={{ scale: activeCategory === 'standard' ? [1, 1.2, 1] : 1 }}
            transition={{ duration: 0.3 }}
          >
            {categorizedTools.filter(tool => tool.category === 'standard').length}
          </motion.span>
        </motion.button>
      </motion.div>
      
      <AnimatePresence>
        {searchTerm && (
          <motion.div 
            className="search-results-info"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            Found {filteredTools.length} tools matching "{searchTerm}"
          </motion.div>
        )}
      </AnimatePresence>
      
      <AnimatePresence mode="wait">
        <motion.div 
          className="tools-grid"
          key={activeCategory + searchTerm}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit={{ opacity: 0 }}
        >
          {filteredTools.length > 0 ? (
            filteredTools.map((tool, index) => (
              <motion.div
                key={tool.title}
                className={`tool-card-wrapper ${tool.category}`}
                variants={itemVariants}
                whileHover={{ 
                  scale: 1.03,
                  transition: { duration: 0.2 }
                }}
                whileTap={{ scale: 0.98 }}
              >
                <InteractiveToolCard
                  title={tool.title}
                  description={tool.description}
                  link={tool.link}
                  onClick={() => handleToolClick(tool)}
                />
                {tool.category === 'ai' && (
                  <motion.div 
                    className="ai-badge"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <i className="fas fa-robot"></i>
                  </motion.div>
                )}
              </motion.div>
            ))
          ) : (
            <motion.div 
              className="no-results"
              variants={fadeInVariants}
            >
              <i className="fas fa-search"></i>
              <h3>No matching tools found</h3>
              <p>Try adjusting your search or selecting a different category</p>
              <motion.button 
                className="reset-search-btn"
                onClick={() => {
                  setSearchTerm('');
                  setActiveCategory('all');
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Reset Filters
              </motion.button>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default InteractiveToolsPage;