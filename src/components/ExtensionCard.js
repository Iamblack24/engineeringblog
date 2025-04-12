import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import './ExtensionCard.css';

const ExtensionCard = ({ extension, index, onInteraction }) => {
  const navigate = useNavigate();
  
  const handleExtensionClick = () => {
    const authorized = onInteraction();
    if (authorized) {
      navigate(extension.path);
    }
  };

  return (
    <motion.div 
      className="extension-card"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.5, 
        delay: 0.1 * index,
        ease: "easeOut" 
      }}
      whileHover={{ 
        y: -10,
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
      }}
      style={{
        borderTopColor: extension.color
      }}
      onClick={handleExtensionClick}
    >
      <div className="extension-icon" style={{ backgroundColor: extension.color }}>
        <i className={`fas ${extension.icon}`}></i>
      </div>
      
      <div className="extension-content">
        <h3>{extension.title}</h3>
        <p className="extension-description">{extension.description}</p>
        
        <ul className="extension-features">
          {extension.features.map((feature, idx) => (
            <motion.li 
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ 
                duration: 0.3, 
                delay: 0.2 + (0.1 * idx)
              }}
            >
              <i className="fas fa-check-circle" style={{ color: extension.color }}></i>
              <span>{feature}</span>
            </motion.li>
          ))}
        </ul>
        
        <button className="extension-button" style={{ backgroundColor: extension.color }}>
          Launch Extension
          <i className="fas fa-external-link-alt"></i>
        </button>
      </div>
    </motion.div>
  );
};

export default ExtensionCard;