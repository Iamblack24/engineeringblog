import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm'; // For GitHub Flavored Markdown (tables, etc.)
import { FaFileDownload } from 'react-icons/fa';

const CaseStudyDisplay = ({ caseStudy, formatSectionName, onExportPDF }) => {
    if (!caseStudy) {
        return null; // Or a placeholder
    }

    return (
        <div className="csg-display-container">
            <div className="display-header">
                <h2>{caseStudy.title}</h2>
                <div className="display-meta">
                    <span>Industry: {caseStudy.industry}</span>
                    <span>Audience: {caseStudy.audience}</span>
                    <span>Detail: {caseStudy.detailLevel}</span>
                </div>
                 <button onClick={onExportPDF} className="export-button-v2" title="Export as PDF">
                    <FaFileDownload /> Export PDF
                </button>
            </div>
            <div className="display-content">
                {Object.entries(caseStudy.sections).map(([key, content]) => (
                    <section key={key} className="content-section-v2">
                        <h3>{formatSectionName(key)}</h3>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {content || "*No content generated for this section.*"}
                        </ReactMarkdown>
                    </section>
                ))}
            </div>
        </div>
    );
};

export default CaseStudyDisplay;