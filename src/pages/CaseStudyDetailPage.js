// src/pages/CaseStudyDetailPage.js
import React from 'react';
import { useParams } from 'react-router-dom';
import { caseStudies } from './CaseStudiesPage'; // Import the caseStudies array
import ReactMarkdown from 'react-markdown';
import './CaseStudyDetailPage.css';

const CaseStudyDetailPage = () => {
  const { id } = useParams();
  const caseStudy = caseStudies.find((study) => study.id === parseInt(id));

  if (!caseStudy) {
    return <div>Case study not found.</div>;
  }

  return (
    <div className="case-study-detail-page">
      <h1>{caseStudy.title}</h1>
      <img src={caseStudy.image} alt={caseStudy.title} className="detail-image" />
      <ReactMarkdown>{caseStudy.content}</ReactMarkdown>
    </div>
  );
};

export default CaseStudyDetailPage;