// src/components/CaseStudyCard.js
import React from 'react';
import { Link } from 'react-router-dom';
import './CaseStudyCard.css';

const CaseStudyCard = ({ caseStudy }) => {
  return (
    <div className="case-study-card">
      <img src={caseStudy.image} alt={caseStudy.title} className="case-study-image" />
      <h2>{caseStudy.title}</h2>
      <p>{caseStudy.description}</p>
      <Link to={`/case-studies/${caseStudy.id}`} className="read-more-link">
        Read More
      </Link>
    </div>
  );
};

export default CaseStudyCard;