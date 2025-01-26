import React from 'react';
import { useParams } from 'react-router-dom';
import './CareerGuideDetail.css';
import { additionalCareerGuides } from './careerGuidesData';
import { additionalCareerGuides2 } from './careerGuidesData2';

const careerGuideDetails = {
  ...additionalCareerGuides,
  ...additionalCareerGuides2,
  'career-paths': {
    title: 'Career Paths in Civil Engineering',
    content: `
      <h1>Comprehensive Guide to Civil Engineering Career Paths</h1>
      
      <p>Civil engineering offers diverse career opportunities across multiple specialized fields. This comprehensive guide explores various career paths, their requirements, and growth prospects.</p>

      <h2>1. Structural Engineering</h2>
      <p>Structural engineers focus on designing and analyzing load-bearing structures.</p>
      
      <h3>Key Responsibilities:</h3>
      <ul>
        <li>Analyzing structural systems using advanced software</li>
        <li>Designing buildings, bridges, and infrastructure</li>
        <li>Ensuring compliance with building codes and standards</li>
        <li>Conducting structural assessments and retrofitting</li>
      </ul>

      <h3>Required Skills:</h3>
      <ul>
        <li>Advanced knowledge of structural analysis software (SAP2000, ETABS)</li>
        <li>Understanding of building codes (IBC, ASCE 7)</li>
        <li>Proficiency in BIM software (Revit, Tekla)</li>
        <li>Strong mathematical and analytical abilities</li>
      </ul>

      <h2>2. Geotechnical Engineering</h2>
      <p>Geotechnical engineers specialize in soil mechanics and foundation design.</p>
      
      <h3>Key Responsibilities:</h3>
      <ul>
        <li>Conducting soil investigations and site assessments</li>
        <li>Designing foundations and earth retention systems</li>
        <li>Analyzing slope stability and ground improvement</li>
        <li>Managing soil contamination and remediation</li>
      </ul>

      <h3>Required Skills:</h3>
      <ul>
        <li>Proficiency in geotechnical software (PLAXIS, GeoStudio)</li>
        <li>Knowledge of soil testing procedures</li>
        <li>Understanding of geological processes</li>
        <li>Experience with foundation design methods</li>
      </ul>

      <h2>3. Transportation Engineering</h2>
      <p>Transportation engineers design and optimize transportation systems.</p>
      
      <h3>Key Responsibilities:</h3>
      <ul>
        <li>Planning highway and railway systems</li>
        <li>Conducting traffic analysis and simulation</li>
        <li>Designing intersections and interchanges</li>
        <li>Implementing intelligent transportation systems</li>
      </ul>

      <h3>Required Skills:</h3>
      <ul>
        <li>Proficiency in transportation modeling software (VISSIM, Synchro)</li>
        <li>Knowledge of transportation planning principles</li>
        <li>Understanding of traffic flow theory</li>
        <li>Experience with GIS applications</li>
      </ul>

      <h2>4. Water Resources Engineering</h2>
      <p>Water resources engineers manage water-related infrastructure and systems.</p>
      
      <h3>Key Responsibilities:</h3>
      <ul>
        <li>Designing water distribution systems</li>
        <li>Managing stormwater and flood control</li>
        <li>Planning hydraulic structures</li>
        <li>Conducting hydrologic analysis</li>
      </ul>

      <h3>Required Skills:</h3>
      <ul>
        <li>Proficiency in hydraulic modeling software (HEC-RAS, EPA-SWMM)</li>
        <li>Understanding of water resources principles</li>
        <li>Knowledge of environmental regulations</li>
        <li>Experience with watershed management</li>
      </ul>

      <h2>5. Construction Management</h2>
      <p>Construction managers oversee building projects from conception to completion.</p>
      
      <h3>Key Responsibilities:</h3>
      <ul>
        <li>Project planning and scheduling</li>
        <li>Cost estimation and budgeting</li>
        <li>Contract administration</li>
        <li>Quality control and safety management</li>
      </ul>

      <h3>Required Skills:</h3>
      <ul>
        <li>Proficiency in project management software (Primavera P6, MS Project)</li>
        <li>Knowledge of construction methods and materials</li>
        <li>Understanding of contract documents</li>
        <li>Strong leadership and communication abilities</li>
      </ul>

      <h2>Salary Ranges and Growth Prospects</h2>
      <table>
        <tr>
          <th>Specialization</th>
          <th>Entry Level</th>
          <th>Mid-Career</th>
          <th>Senior Level</th>
        </tr>
        <tr>
          <td>Structural</td>
          <td>$65,000-$75,000</td>
          <td>$85,000-$110,000</td>
          <td>$120,000-$180,000+</td>
        </tr>
        <tr>
          <td>Geotechnical</td>
          <td>$62,000-$72,000</td>
          <td>$80,000-$105,000</td>
          <td>$115,000-$170,000+</td>
        </tr>
        <tr>
          <td>Transportation</td>
          <td>$60,000-$70,000</td>
          <td>$75,000-$100,000</td>
          <td>$110,000-$160,000+</td>
        </tr>
        <tr>
          <td>Water Resources</td>
          <td>$58,000-$68,000</td>
          <td>$70,000-$95,000</td>
          <td>$100,000-$150,000+</td>
        </tr>
        <tr>
          <td>Construction Management</td>
          <td>$65,000-$80,000</td>
          <td>$90,000-$120,000</td>
          <td>$130,000-$200,000+</td>
        </tr>
      </table>
    `,
  },

  'interview-preparation': {
    title: 'Interview Preparation for Civil Engineers',
    content: `
      <h1>Comprehensive Interview Preparation Guide for Civil Engineers</h1>

      <h2>Technical Knowledge</h2>
      <h3>Core Concepts to Review:</h3>
      <ul>
        <li>Structural mechanics and analysis</li>
        <li>Material properties and behavior</li>
        <li>Foundation design principles</li>
        <li>Hydraulics and hydrology</li>
        <li>Construction methods and management</li>
        <li>Engineering codes and standards</li>
      </ul>

      <h2>Common Technical Questions</h2>
      <h3>Structural Engineering:</h3>
      <ul>
        <li>Explain the difference between ASD and LRFD design methods</li>
        <li>Describe the factors affecting beam deflection</li>
        <li>How do you determine the required reinforcement in a concrete beam?</li>
        <li>Explain the concept of pre-stressing in concrete</li>
      </ul>

      <h3>Geotechnical Engineering:</h3>
      <ul>
        <li>What factors influence foundation design?</li>
        <li>Explain the difference between total and effective stress</li>
        <li>How do you determine soil bearing capacity?</li>
        <li>Describe different types of soil stabilization methods</li>
      </ul>

      <h2>Project Experience Questions</h2>
      <p>Prepare STAR (Situation, Task, Action, Result) responses for:</p>
      <ul>
        <li>A challenging technical problem you solved</li>
        <li>A project where you demonstrated leadership</li>
        <li>A situation where you handled conflict</li>
        <li>An example of meeting tight deadlines</li>
        <li>A time when you improved a process or design</li>
      </ul>

      <h2>Software Proficiency</h2>
      <p>Be prepared to discuss experience with:</p>
      <ul>
        <li>Analysis software (SAP2000, ETABS, SAFE)</li>
        <li>CAD software (AutoCAD, Civil 3D)</li>
        <li>BIM software (Revit, Tekla)</li>
        <li>Project management tools (Primavera P6, MS Project)</li>
        <li>General software (Excel, Word, PowerPoint)</li>
      </ul>

      <h2>Professional Development</h2>
      <h3>Be Ready to Discuss:</h3>
      <ul>
        <li>Professional licenses and certifications</li>
        <li>Continuing education plans</li>
        <li>Professional organization memberships</li>
        <li>Recent industry developments and trends</li>
        <li>Career goals and aspirations</li>
      </ul>

      <h2>Questions to Ask the Interviewer</h2>
      <ul>
        <li>What types of projects does the firm typically handle?</li>
        <li>How is the team structured on typical projects?</li>
        <li>What opportunities exist for professional development?</li>
        <li>What software and tools does the company use?</li>
        <li>What are the biggest challenges facing the department/company?</li>
      </ul>
    `,
  },

  'essential-skills': {
    title: 'Essential Skills for Civil Engineers',
    content: `
      <h1>Essential Skills for Modern Civil Engineers</h1>

      <h2>Technical Skills</h2>
      
      <h3>1. Engineering Software Proficiency</h3>
      <ul>
        <li>Structural Analysis: SAP2000, ETABS, STAAD.Pro</li>
        <li>CAD Software: AutoCAD, Civil 3D, MicroStation</li>
        <li>BIM Tools: Revit, Tekla Structures, Navisworks</li>
        <li>Geotechnical Software: PLAXIS, GeoStudio</li>
        <li>Project Management: Primavera P6, MS Project</li>
      </ul>

      <h3>2. Design and Analysis</h3>
      <ul>
        <li>Structural mechanics and analysis</li>
        <li>Material behavior and properties</li>
        <li>Load calculation and distribution</li>
        <li>Foundation design</li>
        <li>Seismic analysis and design</li>
      </ul>

      <h3>3. Construction Knowledge</h3>
      <ul>
        <li>Construction methods and sequences</li>
        <li>Material specifications</li>
        <li>Quality control procedures</li>
        <li>Safety regulations and practices</li>
        <li>Cost estimation and budgeting</li>
      </ul>

      <h2>Professional Skills</h2>

      <h3>1. Project Management</h3>
      <ul>
        <li>Schedule development and tracking</li>
        <li>Resource allocation</li>
        <li>Risk management</li>
        <li>Budget control</li>
        <li>Stakeholder management</li>
      </ul>

      <h3>2. Communication</h3>
      <ul>
        <li>Technical report writing</li>
        <li>Presentation skills</li>
        <li>Client interaction</li>
        <li>Team collaboration</li>
        <li>Documentation</li>
      </ul>

      <h3>3. Leadership</h3>
      <ul>
        <li>Team management</li>
        <li>Decision-making</li>
        <li>Problem-solving</li>
        <li>Conflict resolution</li>
        <li>Mentoring</li>
      </ul>

      <h2>Regulatory Knowledge</h2>
      
      <h3>1. Codes and Standards</h3>
      <ul>
        <li>Building codes (IBC, ASCE 7)</li>
        <li>Material codes (ACI, AISC, AASHTO)</li>
        <li>Environmental regulations</li>
        <li>Safety standards (OSHA)</li>
        <li>Local zoning requirements</li>
      </ul>

      <h3>2. Documentation</h3>
      <ul>
        <li>Permit applications</li>
        <li>Construction documents</li>
        <li>Technical specifications</li>
        <li>As-built drawings</li>
        <li>Inspection reports</li>
      </ul>

      <h2>Business Acumen</h2>

      <h3>1. Financial Management</h3>
      <ul>
        <li>Cost estimation</li>
        <li>Budget management</li>
        <li>Resource allocation</li>
        <li>Contract administration</li>
        <li>Risk assessment</li>
      </ul>

      <h3>2. Client Relations</h3>
      <ul>
        <li>Proposal writing</li>
        <li>Presentation skills</li>
        <li>Negotiation</li>
        <li>Relationship building</li>
        <li>Conflict resolution</li>
      </ul>
    `,
  },

  'networking-tips': {
    title: 'Networking Tips for Civil Engineers',
    content: `
      <h1>Professional Networking Guide for Civil Engineers</h1>

      <h2>Professional Organizations</h2>
      <h3>Key Organizations:</h3>
      <ul>
        <li>American Society of Civil Engineers (ASCE)</li>
        <li>Institution of Civil Engineers (ICE)</li>
        <li>American Concrete Institute (ACI)</li>
        <li>American Institute of Steel Construction (AISC)</li>
        <li>Project Management Institute (PMI)</li>
      </ul>

      <h2>Online Networking</h2>
      <h3>LinkedIn Strategy:</h3>
      <ul>
        <li>Optimize your profile with relevant keywords</li>
        <li>Share industry insights and project experiences</li>
        <li>Join professional groups and participate in discussions</li>
        <li>Connect with industry leaders and peers</li>
        <li>Follow companies and organizations of interest</li>
      </ul>

      <h2>Industry Events</h2>
      <h3>Types of Events:</h3>
      <ul>
        <li>Technical conferences and seminars</li>
        <li>Trade shows and exhibitions</li>
        <li>Professional development workshops</li>
        <li>Industry meetups and social events</li>
        <li>Company open houses</li>
      </ul>

      <h2>Building Professional Relationships</h2>
      <h3>Best Practices:</h3>
      <ul>
        <li>Maintain regular contact with colleagues</li>
        <li>Offer help and support to others</li>
        <li>Share knowledge and resources</li>
        <li>Seek mentorship opportunities</li>
        <li>Follow up after meetings and events</li>
      </ul>
    `,
  },

  'continuing-education': {
    title: 'Continuing Education for Civil Engineers',
    content: `
      <h1>Continuing Education and Professional Development Guide</h1>

      <h2>Professional Licenses</h2>
      <h3>Key Certifications:</h3>
      <ul>
        <li>Professional Engineer (PE) License</li>
        <li>Structural Engineer (SE) License</li>
        <li>Project Management Professional (PMP)</li>
        <li>LEED Accreditation</li>
        <li>Specialized Technical Certifications</li>
      </ul>

      <h2>Advanced Degrees</h2>
      <h3>Options:</h3>
      <ul>
        <li>Master's in Civil Engineering</li>
        <li>Master's in Structural Engineering</li>
        <li>Master's in Construction Management</li>
        <li>PhD Programs</li>
        <li>MBA for Engineers</li>
      </ul>

      <h2>Online Learning</h2>
      <h3>Resources:</h3>
      <ul>
        <li>Coursera and edX Engineering Courses</li>
        <li>LinkedIn Learning Technical Courses</li>
        <li>Professional Organization Webinars</li>
        <li>Software Training Programs</li>
        <li>Industry-Specific Online Certifications</li>
      </ul>

      <h2>Professional Development</h2>
      <h3>Activities:</h3>
      <ul>
        <li>Technical Workshops and Seminars</li>
        <li>Industry Conferences</li>
        <li>Research and Publication</li>
        <li>Teaching and Mentoring</li>
        <li>Professional Committee Participation</li>
      </ul>
    `,
  },

  'bim-specialist': {
    title: 'Building Information Modeling (BIM) Specialist',
    content: `
      <h1>Career Guide: BIM Specialist in Civil Engineering</h1>

      <h2>Role Overview</h2>
      <p>Building Information Modeling (BIM) Specialists are integral to modern construction and engineering projects, bridging the gap between traditional design practices and digital innovation. They create, manage, and coordinate digital representations of physical and functional characteristics of buildings and infrastructure.</p>

      <h2>Industry Context</h2>
      <p>The global BIM market size was valued at USD 5.71 billion in 2021 and is expected to grow at a CAGR of 12.7% from 2022 to 2030. This growth is driven by:</p>
      <ul>
        <li>Government mandates for BIM usage in public projects</li>
        <li>Increasing demand for sustainable construction practices</li>
        <li>Need for improved project efficiency and cost reduction</li>
        <li>Integration with emerging technologies like AI and IoT</li>
      </ul>

      <h2>Key Responsibilities</h2>
      <h3>Project Implementation:</h3>
      <ul>
        <li>Developing and maintaining detailed 3D models throughout the project lifecycle</li>
        <li>Implementing BIM execution plans (BEP) and ensuring compliance with BIM protocols</li>
        <li>Managing model federation and performing clash detection analysis</li>
        <li>Coordinating with multiple disciplines to ensure model accuracy and completeness</li>
        <li>Generating quantity takeoffs and cost estimates from BIM models</li>
      </ul>

      <h3>Technical Leadership:</h3>
      <ul>
        <li>Establishing BIM standards and workflows for projects and organizations</li>
        <li>Training team members in BIM software and methodologies</li>
        <li>Troubleshooting technical issues and providing solutions</li>
        <li>Evaluating and implementing new BIM technologies and tools</li>
      </ul>

      <h2>Required Skills</h2>
      <h3>Technical Skills:</h3>
      <ul>
        <li>Advanced proficiency in major BIM platforms:
          <ul>
            <li>Autodesk Revit (Architecture, Structure, MEP)</li>
            <li>Navisworks for coordination and clash detection</li>
            <li>BIM 360 for cloud collaboration</li>
            <li>Tekla Structures for structural modeling</li>
          </ul>
        </li>
        <li>Knowledge of IFC standards and interoperability protocols</li>
        <li>Experience with point cloud data and laser scanning technology</li>
        <li>Understanding of construction documentation and processes</li>
        <li>Programming skills for automation (Visual Basic, Python, Dynamo)</li>
      </ul>

      <h3>Soft Skills:</h3>
      <ul>
        <li>Strong communication abilities for cross-disciplinary collaboration</li>
        <li>Problem-solving and analytical thinking</li>
        <li>Project management capabilities</li>
        <li>Leadership and team coordination</li>
        <li>Ability to adapt to new technologies and workflows</li>
      </ul>

      <h2>Career Path and Progression</h2>
      <h3>Entry Level: BIM Technician/Modeler (0-3 years)</h3>
      <ul>
        <li>Focus on model creation and basic coordination</li>
        <li>Learning BIM standards and workflows</li>
        <li>Salary range: $50,000-$65,000</li>
        <li>Required: Bachelor's degree in relevant field</li>
      </ul>

      <h3>Mid-Level: BIM Coordinator (3-7 years)</h3>
      <ul>
        <li>Managing project-level BIM implementation</li>
        <li>Coordinating between disciplines</li>
        <li>Training junior staff</li>
        <li>Salary range: $70,000-$95,000</li>
        <li>Required: Relevant certifications and project experience</li>
      </ul>

      <h3>Senior Level: BIM Manager/Director (7+ years)</h3>
      <ul>
        <li>Developing organizational BIM strategy</li>
        <li>Managing multiple project teams</li>
        <li>Technology implementation decisions</li>
        <li>Salary range: $100,000-$150,000+</li>
        <li>Required: Extensive experience and proven leadership</li>
      </ul>

      <h2>Professional Certifications</h2>
      <ul>
        <li>Autodesk Professional Certifications:
          <ul>
            <li>Revit Architecture</li>
            <li>Revit Structure</li>
            <li>Revit MEP</li>
            <li>Navisworks</li>
          </ul>
        </li>
        <li>BuildingSMART Professional Certification</li>
        <li>BIM Level 2 Certification (UK)</li>
        <li>Professional BIM Manager Certification</li>
      </ul>

      <h2>Industry Standards and Guidelines</h2>
      <ul>
        <li>ISO 19650 series for BIM management</li>
        <li>National BIM Standards (NBIMS-US)</li>
        <li>PAS 1192 series (UK standards)</li>
        <li>Local BIM mandates and requirements</li>
      </ul>

      <h2>Future Trends and Opportunities</h2>
      <h3>Emerging Technologies:</h3>
      <ul>
        <li>Integration with Digital Twins</li>
        <li>Machine Learning for automated modeling</li>
        <li>AR/VR applications in BIM</li>
        <li>Cloud-based collaboration platforms</li>
        <li>Generative design capabilities</li>
      </ul>

      <h2>Challenges and Solutions</h2>
      <ul>
        <li>Data management and storage solutions</li>
        <li>Interoperability between different platforms</li>
        <li>Training and adoption challenges</li>
        <li>Cost justification and ROI demonstration</li>
      </ul>

      <h2>Resources for Professional Development</h2>
      <ul>
        <li>Professional Organizations:
          <ul>
            <li>BuildingSMART International</li>
            <li>BIM Forum</li>
            <li>UK BIM Alliance</li>
          </ul>
        </li>
        <li>Online Learning Platforms:
          <ul>
            <li>LinkedIn Learning</li>
            <li>Autodesk University</li>
            <li>BIM Track Academy</li>
          </ul>
        </li>
        <li>Industry Publications and Blogs</li>
        <li>BIM-focused conferences and events</li>
      </ul>
    `,
  },

  'sustainable-design': {
    title: 'Sustainable Design Engineer',
    content: `
      <h1>Career Guide: Sustainable Design Engineer</h1>

      <h2>Role Overview</h2>
      <p>Sustainable Design Engineers are at the forefront of creating environmentally responsible and resource-efficient buildings and infrastructure. They integrate environmental considerations with engineering principles to develop solutions that minimize ecological impact while maximizing building performance and occupant wellbeing.</p>

      <h2>Industry Context</h2>
      <p>The sustainable building market is projected to reach USD 187.4 billion by 2027, growing at a CAGR of 8.6%. Key drivers include:</p>
      <ul>
        <li>Increasing environmental regulations and building codes</li>
        <li>Growing demand for green building certifications</li>
        <li>Rising energy costs and carbon pricing</li>
        <li>Corporate sustainability commitments</li>
        <li>Public awareness and demand for sustainable solutions</li>
      </ul>

      <h2>Key Responsibilities</h2>
      <h3>Design and Analysis:</h3>
      <ul>
        <li>Conducting energy modeling and performance simulations</li>
        <li>Developing sustainable design strategies and solutions</li>
        <li>Performing life cycle assessments (LCA)</li>
        <li>Integrating renewable energy systems</li>
        <li>Optimizing building envelope design</li>
        <li>Water conservation and management strategies</li>
        <li>Waste reduction and material selection</li>
      </ul>

      <h3>Project Management:</h3>
      <ul>
        <li>Managing green building certification processes (LEED, BREEAM, etc.)</li>
        <li>Coordinating with architects, engineers, and contractors</li>
        <li>Developing sustainability guidelines and specifications</li>
        <li>Monitoring project sustainability metrics</li>
        <li>Conducting environmental impact assessments</li>
      </ul>

      <h2>Required Skills</h2>
      <h3>Technical Expertise:</h3>
      <ul>
        <li>Energy Modeling Software:
          <ul>
            <li>eQUEST</li>
            <li>IES Virtual Environment</li>
            <li>EnergyPlus</li>
            <li>DesignBuilder</li>
          </ul>
        </li>
        <li>Building Performance Analysis:
          <ul>
            <li>Thermal modeling</li>
            <li>Daylighting analysis</li>
            <li>CFD (Computational Fluid Dynamics)</li>
            <li>Carbon footprint calculations</li>
          </ul>
        </li>
        <li>Design Software:
          <ul>
            <li>Revit</li>
            <li>AutoCAD</li>
            <li>SketchUp</li>
            <li>Rhino with environmental plugins</li>
          </ul>
        </li>
      </ul>

      <h3>Knowledge Areas:</h3>
      <ul>
        <li>Building physics and environmental science</li>
        <li>Renewable energy technologies</li>
        <li>Sustainable materials and construction methods</li>
        <li>Environmental regulations and building codes</li>
        <li>Green building rating systems</li>
        <li>Climate change mitigation and adaptation strategies</li>
      </ul>

      <h2>Career Progression</h2>
      <h3>Entry Level (0-3 years):</h3>
      <ul>
        <li>Sustainable Design Engineer</li>
        <li>Green Building Analyst</li>
        <li>Salary range: $55,000-$75,000</li>
        <li>Focus: Learning certification processes and analysis tools</li>
      </ul>

      <h3>Mid-Level (3-7 years):</h3>
      <ul>
        <li>Senior Sustainability Consultant</li>
        <li>Environmental Design Specialist</li>
        <li>Salary range: $75,000-$100,000</li>
        <li>Focus: Project management and complex system integration</li>
      </ul>

      <h3>Senior Level (7+ years):</h3>
      <ul>
        <li>Sustainability Director</li>
        <li>Head of Environmental Design</li>
        <li>Salary range: $100,000-$180,000+</li>
        <li>Focus: Strategy development and organizational leadership</li>
      </ul>

      <h2>Professional Certifications</h2>
      <h3>Essential Certifications:</h3>
      <ul>
        <li>LEED Accredited Professional (AP):
          <ul>
            <li>Building Design + Construction (BD+C)</li>
            <li>Operations + Maintenance (O+M)</li>
            <li>Neighborhood Development (ND)</li>
          </ul>
        </li>
        <li>WELL AP</li>
        <li>BREEAM Assessor</li>
        <li>Certified Energy Manager (CEM)</li>
        <li>Passive House Designer/Consultant</li>
      </ul>

      <h2>Industry Standards and Guidelines</h2>
      <ul>
        <li>International Green Construction Code (IgCC)</li>
        <li>ASHRAE 189.1 Standard for High-Performance Green Buildings</li>
        <li>ISO 14001 Environmental Management Systems</li>
        <li>Local green building codes and regulations</li>
      </ul>

      <h2>Current Trends and Future Outlook</h2>
      <h3>Emerging Areas:</h3>
      <ul>
        <li>Net-zero energy buildings</li>
        <li>Circular economy in construction</li>
        <li>Biophilic design integration</li>
        <li>Smart building technologies</li>
        <li>Climate resilient design</li>
        <li>Health and wellness in buildings</li>
      </ul>

      <h2>Professional Organizations</h2>
      <ul>
        <li>U.S. Green Building Council (USGBC)</li>
        <li>International Living Future Institute (ILFI)</li>
        <li>World Green Building Council (WorldGBC)</li>
        <li>Association of Energy Engineers (AEE)</li>
        <li>Environmental Design Research Association (EDRA)</li>
      </ul>

      <h2>Continuing Education</h2>
      <ul>
        <li>Advanced degree programs in sustainable design</li>
        <li>Professional development workshops</li>
        <li>Industry conferences and seminars</li>
        <li>Online courses and webinars</li>
        <li>Research and publication opportunities</li>
      </ul>

      <h2>Key Projects and Experience</h2>
      <p>Sustainable Design Engineers should gain experience in:</p>
      <ul>
        <li>Net-zero energy building design</li>
        <li>Green building certification projects</li>
        <li>Renewable energy system integration</li>
        <li>Sustainable master planning</li>
        <li>Building performance optimization</li>
        <li>Environmental impact assessments</li>
      </ul>
    `,
  },

  'urban-planning': {
    title: 'Urban Planning and Development',
    content: `
      <h1>Career Guide: Urban Planning for Civil Engineers</h1>

      <h2>Role Overview</h2>
      <p>Urban Planners with civil engineering backgrounds combine technical expertise with planning principles to create sustainable, resilient, and livable cities. They play a crucial role in shaping the future of urban environments through infrastructure planning, transportation systems, and sustainable development strategies.</p>

      <h2>Industry Context</h2>
      <p>The urban planning sector is experiencing significant growth due to:</p>
      <ul>
        <li>Rapid urbanization (68% of the world population projected to live in urban areas by 2050)</li>
        <li>Smart city initiatives worldwide</li>
        <li>Climate change adaptation requirements</li>
        <li>Infrastructure modernization needs</li>
        <li>Sustainable development goals</li>
      </ul>

      <h2>Key Responsibilities</h2>
      <h3>Planning and Development:</h3>
      <ul>
        <li>Master planning and land use analysis</li>
        <li>Transportation system planning</li>
        <li>Infrastructure capacity assessment</li>
        <li>Environmental impact studies</li>
        <li>Zoning regulations and policy development</li>
        <li>Urban regeneration strategies</li>
        <li>Public space design</li>
      </ul>

      <h3>Technical Tasks:</h3>
      <ul>
        <li>GIS mapping and spatial analysis</li>
        <li>Traffic impact assessments</li>
        <li>Utility system planning</li>
        <li>Development feasibility studies</li>
        <li>Environmental assessments</li>
        <li>Climate resilience planning</li>
      </ul>

      <h2>Required Skills</h2>
      <h3>Technical Skills:</h3>
      <ul>
        <li>Software Proficiency:
          <ul>
            <li>GIS software (ArcGIS, QGIS)</li>
            <li>CAD and urban design tools</li>
            <li>3D modeling software (SketchUp, Rhino)</li>
            <li>Transportation modeling tools</li>
          </ul>
        </li>
        <li>Analysis Tools:
          <ul>
            <li>Population projection models</li>
            <li>Land use analysis tools</li>
            <li>Traffic simulation software</li>
            <li>Environmental assessment tools</li>
          </ul>
        </li>
      </ul>

      <h3>Knowledge Areas:</h3>
      <ul>
        <li>Urban planning principles and theories</li>
        <li>Transportation planning</li>
        <li>Environmental regulations</li>
        <li>Public policy and governance</li>
        <li>Sustainable development practices</li>
        <li>Community engagement methods</li>
      </ul>

      <h2>Career Progression</h2>
      <h3>Entry Level (0-3 years):</h3>
      <ul>
        <li>Junior Urban Planner</li>
        <li>Planning Analyst</li>
        <li>Salary range: $50,000-$65,000</li>
        <li>Focus: Learning planning processes and regulations</li>
      </ul>

      <h3>Mid-Level (3-7 years):</h3>
      <ul>
        <li>Senior Urban Planner</li>
        <li>Project Manager</li>
        <li>Salary range: $65,000-$95,000</li>
        <li>Focus: Project management and specialized planning areas</li>
      </ul>

      <h3>Senior Level (7+ years):</h3>
      <ul>
        <li>Planning Director</li>
        <li>Urban Development Manager</li>
        <li>Salary range: $95,000-$150,000+</li>
        <li>Focus: Strategic planning and policy development</li>
      </ul>

      <h2>Professional Certifications</h2>
      <ul>
        <li>American Institute of Certified Planners (AICP)</li>
        <li>LEED AP Neighborhood Development</li>
        <li>GIS Professional (GISP)</li>
        <li>Professional Transportation Planner (PTP)</li>
        <li>Envision Sustainability Professional</li>
      </ul>

      <h2>Industry Standards and Guidelines</h2>
      <ul>
        <li>Local zoning codes and regulations</li>
        <li>Environmental protection standards</li>
        <li>Transportation planning guidelines</li>
        <li>Smart growth principles</li>
        <li>Universal design standards</li>
      </ul>

      <h2>Current Trends and Future Outlook</h2>
      <h3>Emerging Areas:</h3>
      <ul>
        <li>Smart city technologies</li>
        <li>Transit-oriented development</li>
        <li>Climate-resilient planning</li>
        <li>15-minute city concepts</li>
        <li>Digital twin cities</li>
        <li>Sustainable mobility solutions</li>
      </ul>

      <h2>Key Projects and Experience</h2>
      <p>Urban Planners should gain experience in:</p>
      <ul>
        <li>Master planning projects</li>
        <li>Transportation studies</li>
        <li>Environmental impact assessments</li>
        <li>Community engagement</li>
        <li>Policy development</li>
        <li>Sustainable development initiatives</li>
      </ul>

      <h2>Professional Organizations</h2>
      <ul>
        <li>American Planning Association (APA)</li>
        <li>Urban Land Institute (ULI)</li>
        <li>Congress for the New Urbanism (CNU)</li>
        <li>International Society of City and Regional Planners</li>
        <li>Royal Town Planning Institute (RTPI)</li>
      </ul>
    `,
  },

  'building-services': {
    title: 'Building Services Engineering',
    content: `
      <h1>Career Guide: Building Services Engineering</h1>

      <h2>Specializations</h2>
      <ul>
        <li>HVAC Systems Design</li>
        <li>Electrical Systems</li>
        <li>Plumbing and Drainage</li>
        <li>Fire Protection Systems</li>
        <li>Building Automation</li>
      </ul>

      <h2>Required Skills</h2>
      <h3>Technical Skills:</h3>
      <ul>
        <li>MEP design software (Revit MEP, AutoCAD MEP)</li>
        <li>Load calculation software</li>
        <li>Energy modeling tools</li>
        <li>Building codes and standards</li>
      </ul>

      <h2>Industry Trends</h2>
      <p>Information about smart building technologies, energy efficiency, and integrated systems.</p>
    `,
  },

  'construction-technology': {
    title: 'Construction Technology Specialist',
    content: `
      <h1>Career Guide: Construction Technology Specialist in Kenya</h1>

      <h2>Role Overview</h2>
      <p>Construction Technology Specialists in Kenya bridge the gap between traditional construction practices and modern digital solutions. They play a crucial role in improving construction efficiency, quality, and sustainability in Kenya's rapidly growing construction sector.</p>

      <h2>Industry Context</h2>
      <p>Kenya's construction technology sector is experiencing significant growth driven by:</p>
      <ul>
        <li>Vision 2030 infrastructure development goals</li>
        <li>Rising demand for affordable housing projects</li>
        <li>Growing adoption of digital construction solutions</li>
        <li>Need for cost-effective construction methods</li>
        <li>Increasing focus on sustainable building practices</li>
        <li>Regional infrastructure projects in East Africa</li>
      </ul>

      <h2>Key Responsibilities</h2>
      <h3>Technology Implementation:</h3>
      <ul>
        <li>Digital construction tools deployment and management</li>
        <li>BIM coordination for local projects</li>
        <li>Construction software training and support</li>
        <li>Quality control using digital tools</li>
        <li>Site monitoring and documentation</li>
        <li>Cost tracking and analysis systems</li>
      </ul>

      <h3>Project Support:</h3>
      <ul>
        <li>Construction methodology optimization</li>
        <li>Digital documentation management</li>
        <li>Site logistics coordination</li>
        <li>Environmental compliance monitoring</li>
        <li>Safety systems implementation</li>
      </ul>

      <h2>Required Skills</h2>
      <h3>Technical Skills:</h3>
      <ul>
        <li>Construction Software:
          <ul>
            <li>Project management software (Procore, PlanGrid)</li>
            <li>BIM tools (Revit, Navisworks)</li>
            <li>Cost estimation software</li>
            <li>Mobile construction apps</li>
          </ul>
        </li>
        <li>Digital Tools:
          <ul>
            <li>Drone operation and photogrammetry</li>
            <li>3D scanning and modeling</li>
            <li>GIS applications</li>
            <li>Mobile data collection tools</li>
          </ul>
        </li>
      </ul>

      <h2>Market-Specific Knowledge</h2>
      <ul>
        <li>Kenyan Building Code and Standards</li>
        <li>National Construction Authority (NCA) regulations</li>
        <li>Local construction practices and materials</li>
        <li>Environmental Management and Coordination Act</li>
        <li>County-specific building regulations</li>
      </ul>

      <h2>Career Progression</h2>
      <h3>Entry Level (0-3 years):</h3>
      <ul>
        <li>Construction Technology Assistant</li>
        <li>Digital Construction Coordinator</li>
        <li>Salary range: KES 60,000-120,000 monthly</li>
        <li>Focus: Learning systems and basic implementation</li>
      </ul>

      <h3>Mid-Level (3-7 years):</h3>
      <ul>
        <li>Construction Technology Manager</li>
        <li>Digital Construction Specialist</li>
        <li>Salary range: KES 120,000-250,000 monthly</li>
        <li>Focus: Project management and system optimization</li>
      </ul>

      <h3>Senior Level (7+ years):</h3>
      <ul>
        <li>Head of Construction Technology</li>
        <li>Digital Transformation Manager</li>
        <li>Salary range: KES 250,000-500,000+ monthly</li>
        <li>Focus: Strategy and innovation leadership</li>
      </ul>

      <h2>Emerging Technologies in Kenyan Construction</h2>
      <ul>
        <li>Drone Technology:
          <ul>
            <li>Site surveys and mapping</li>
            <li>Progress monitoring</li>
            <li>Safety inspections</li>
            <li>Marketing and documentation</li>
          </ul>
        </li>
        <li>Mobile Solutions:
          <ul>
            <li>Site reporting apps</li>
            <li>Quality control systems</li>
            <li>Safety management platforms</li>
            <li>Project management tools</li>
          </ul>
        </li>
        <li>Advanced Construction Methods:
          <ul>
            <li>Prefabrication technology</li>
            <li>Modular construction systems</li>
            <li>Green building technologies</li>
            <li>Smart building solutions</li>
          </ul>
        </li>
      </ul>

      <h2>Professional Development</h2>
      <h3>Local Certifications:</h3>
      <ul>
        <li>NCA Construction Site Supervisor</li>
        <li>KEBS Quality Management Systems</li>
        <li>Environmental Impact Assessment Expert</li>
        <li>Project Management Professional (PMP)</li>
      </ul>

      <h3>Training Opportunities:</h3>
      <ul>
        <li>Technical University of Kenya programs</li>
        <li>Kenya Building Research Centre workshops</li>
        <li>Construction Industry Training Programs</li>
        <li>International certification courses</li>
      </ul>

      <h2>Key Organizations and Associations</h2>
      <ul>
        <li>National Construction Authority (NCA)</li>
        <li>Institution of Engineers of Kenya (IEK)</li>
        <li>Architectural Association of Kenya (AAK)</li>
        <li>Kenya Property Developers Association (KPDA)</li>
        <li>Kenya Green Building Society (KGBS)</li>
      </ul>

      <h2>Future Outlook</h2>
      <p>The construction technology sector in Kenya is expected to grow with:</p>
      <ul>
        <li>Increased adoption of digital construction methods</li>
        <li>Growth in sustainable building practices</li>
        <li>Rising demand for affordable housing solutions</li>
        <li>Infrastructure development projects</li>
        <li>Regional construction opportunities</li>
      </ul>

      <h2>Challenges and Opportunities</h2>
      <h3>Challenges:</h3>
      <ul>
        <li>Initial technology investment costs</li>
        <li>Skills gap in digital construction</li>
        <li>Internet connectivity issues</li>
        <li>Resistance to change</li>
        <li>Limited local software support</li>
      </ul>

      <h3>Opportunities:</h3>
      <ul>
        <li>Growing demand for digital solutions</li>
        <li>Government support for technology adoption</li>
        <li>Regional market expansion</li>
        <li>Innovation in local construction methods</li>
        <li>Sustainable building initiatives</li>
      </ul>

      <h2>Success Factors</h2>
      <p>Key factors for success in Kenya's construction technology field:</p>
      <ul>
        <li>Understanding of local construction practices</li>
        <li>Ability to adapt technologies to local context</li>
        <li>Strong network within the industry</li>
        <li>Continuous learning and adaptation</li>
        <li>Problem-solving mindset</li>
        <li>Cultural awareness and sensitivity</li>
      </ul>
    `,
  }
};

const CareerGuideDetail = () => {
  const { guideId } = useParams();
  const guide = careerGuideDetails[guideId];

  if (!guide) {
    return <div>Guide not found</div>;
  }

  return (
    <div className="career-guide-detail">
      <h1>{guide.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: guide.content }} />
    </div>
  );
};

export default CareerGuideDetail;