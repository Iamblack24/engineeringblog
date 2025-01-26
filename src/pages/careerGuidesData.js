// Additional career guide details for the built environment

export const additionalCareerGuides = {
  'construction-management': {
    title: 'Construction Project Management',
    content: `
      <h1>Career Guide: Construction Project Management</h1>

      <h2>Role Overview</h2>
      <p>Construction Project Managers coordinate and oversee construction projects from inception to completion, ensuring successful delivery within time, budget, and quality constraints.</p>

      <h2>Key Responsibilities</h2>
      <ul>
        <li>Project planning and scheduling</li>
        <li>Budget management and cost control</li>
        <li>Team coordination and leadership</li>
        <li>Contract administration</li>
        <li>Quality assurance</li>
        <li>Risk management</li>
        <li>Stakeholder communication</li>
      </ul>

      <h2>Required Skills</h2>
      <ul>
        <li>Leadership and team management</li>
        <li>Project management methodologies</li>
        <li>Construction methods knowledge</li>
        <li>Financial management</li>
        <li>Contract law understanding</li>
        <li>Problem-solving abilities</li>
      </ul>

      <h2>Career Path/Growth</h2>
      <ol>
        <li>Assistant Project Manager (0-3 years)</li>
        <li>Project Manager (3-8 years)</li>
        <li>Senior Project Manager (8-15 years)</li>
        <li>Program Director (15+ years)</li>
      </ol>

      <h2>Professional Certifications</h2>
      <ul>
        <li>Project Management Professional (PMP)</li>
        <li>Certified Construction Manager (CCM)</li>
        <li>PRINCE2 Practitioner</li>
        <li>CMAA Certification</li>
      </ul>

      <h2>Industry Tools/Software</h2>
      <ul>
        <li>Microsoft Project</li>
        <li>Primavera P6</li>
        <li>Procore</li>
        <li>BuilderTrend</li>
        <li>BIM 360</li>
        <li>Bluebeam Revu</li>
      </ul>
    `
  },

  'quantity-surveying': {
    title: 'Quantity Surveying and Cost Engineering',
    content: `
      <h1>Career Guide: Quantity Surveying and Cost Engineering</h1>

      <h2>Role Overview</h2>
      <p>Quantity Surveyors manage financial aspects of construction projects, from cost estimation to final accounts, ensuring project cost effectiveness and contract compliance.</p>

      <h2>Key Responsibilities</h2>
      <ul>
        <li>Cost estimation and budgeting</li>
        <li>Preparing bills of quantities</li>
        <li>Contract documentation</li>
        <li>Procurement management</li>
        <li>Cost analysis and reporting</li>
        <li>Value engineering</li>
        <li>Change order management</li>
      </ul>

      <h2>Required Skills</h2>
      <ul>
        <li>Analytical and mathematical ability</li>
        <li>Construction technology knowledge</li>
        <li>Contract law understanding</li>
        <li>Negotiation skills</li>
        <li>Attention to detail</li>
        <li>Cost planning expertise</li>
      </ul>

      <h2>Career Path/Growth</h2>
      <ol>
        <li>Graduate QS (0-2 years)</li>
        <li>Quantity Surveyor (2-5 years)</li>
        <li>Senior QS (5-10 years)</li>
        <li>Commercial Manager (10+ years)</li>
      </ol>

      <h2>Professional Certifications</h2>
      <ul>
        <li>RICS Chartered Quantity Surveyor</li>
        <li>Certified Cost Professional (AACE)</li>
        <li>Certified Quantity Surveyor (CIQS)</li>
        <li>Professional Quantity Surveyor (IQSK)</li>
      </ul>

      <h2>Industry Tools/Software</h2>
      <ul>
        <li>CostX</li>
        <li>Causeway</li>
        <li>WinQS</li>
        <li>BuildSmart</li>
        <li>Microsoft Excel (Advanced)</li>
        <li>Autodesk QTO</li>
      </ul>
    `
  },

  'environmental-assessment': {
    title: 'Environmental Impact Assessment Specialist',
    content: `
      <h1>Career Guide: Environmental Impact Assessment Specialist</h1>

      <h2>Role Overview</h2>
      <p>Environmental Impact Assessment Specialists evaluate the potential environmental effects of construction projects and develop mitigation strategies to ensure sustainable development.</p>

      <h2>Key Responsibilities</h2>
      <ul>
        <li>Conducting environmental impact studies</li>
        <li>Preparing assessment reports</li>
        <li>Stakeholder consultation</li>
        <li>Developing mitigation measures</li>
        <li>Monitoring compliance</li>
        <li>Environmental data analysis</li>
      </ul>

      <h2>Required Skills</h2>
      <ul>
        <li>Environmental science knowledge</li>
        <li>Analytical and research skills</li>
        <li>Report writing abilities</li>
        <li>Understanding of regulations</li>
        <li>GIS proficiency</li>
        <li>Communication skills</li>
      </ul>

      <h2>Career Path/Growth</h2>
      <ol>
        <li>Environmental Analyst (0-3 years)</li>
        <li>EIA Specialist (3-7 years)</li>
        <li>Senior Environmental Consultant (7-12 years)</li>
        <li>Environmental Director (12+ years)</li>
      </ol>

      <h2>Professional Certifications</h2>
      <ul>
        <li>Certified Environmental Professional (CEP)</li>
        <li>NEMA Environmental Lead Expert</li>
        <li>ISO 14001 Lead Auditor</li>
        <li>Environmental Impact Assessment Practitioner</li>
      </ul>

      <h2>Industry Tools/Software</h2>
      <ul>
        <li>GIS Software (ArcGIS, QGIS)</li>
        <li>Environmental Modeling Tools</li>
        <li>Air Quality Modeling Software</li>
        <li>Noise Modeling Tools</li>
        <li>Environmental Compliance Software</li>
      </ul>
    `
  }
};

// Export function to merge with existing career guides
export const mergeCareerGuides = (existingGuides) => {
  return { ...existingGuides, ...additionalCareerGuides };
};
