import React from 'react';
import { motion } from 'framer-motion';
import './InteractiveToolCard.css';

const cardVariants = {
  initial: { 
    opacity: 0, 
    y: 50,
    scale: 0.9
  },
  animate: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: "easeOut"
    }
  },
  hover: {
    y: -10,
    scale: 1.05,
    boxShadow: "0px 10px 20px rgba(0,0,0,0.2)",
    transition: {
      duration: 0.3,
      ease: "easeInOut"
    }
  },
  tap: {
    scale: 0.95,
    boxShadow: "0px 5px 10px rgba(0,0,0,0.1)",
  }
};

const buttonVariants = {
  initial: { scale: 1 },
  hover: { 
    scale: 1.1,
    backgroundColor: "#0056b3",
    transition: {
      duration: 0.2,
      ease: "easeInOut"
    }
  },
  tap: { scale: 0.95 }
};

const InteractiveToolCard = ({ title, description, link, onClick }) => {
  return (
    <motion.div 
      className="interactive-tool-card"
      variants={cardVariants}
      initial="initial"
      animate="animate"
      whileHover="hover"
      whileTap="tap"
      onClick={onClick}
    >
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {title}
      </motion.h2>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {description}
      </motion.p>
      <motion.a
        href={link}
        onClick={(e) => e.preventDefault()}
        variants={buttonVariants}
        whileHover="hover"
        whileTap="tap"
        className="tool-link"
      >
        Use Tool
      </motion.a>
    </motion.div>
  );
};

export default InteractiveToolCard;