import React from 'react';
import { useParams } from 'react-router-dom';
import './CareerGuideDetail.css';

const careerGuideDetails = {
  'career-paths': {
    title: 'Career Paths in Civil Engineering',
    content: `
      <p>Civil engineering offers a wide range of career paths, each with its own unique challenges and rewards. Some of the most common career paths include:</p>
      <h2>Structural Engineering</h2>
      <p>Structural engineers design and analyze buildings, bridges, and other structures to ensure they are safe and capable of withstanding various forces.</p>
      <h2>Geotechnical Engineering</h2>
      <p>Geotechnical engineers study soil and rock mechanics to design foundations, retaining walls, and other structures that interact with the ground.</p>
      <h2>Transportation Engineering</h2>
      <p>Transportation engineers plan, design, and maintain transportation systems, including roads, highways, airports, and railways.</p>
      <h2>Environmental Engineering</h2>
      <p>Environmental engineers work on projects related to water and air quality, waste management, and environmental sustainability.</p>
      <h2>Construction Management</h2>
      <p>Construction managers oversee construction projects, ensuring they are completed on time, within budget, and according to specifications.</p>
    `,
  },
  'interview-preparation': {
    title: 'Interview Preparation for Civil Engineers',
    content: `
      <p>Preparing for a civil engineering job interview requires a combination of technical knowledge, soft skills, and confidence. Here are some tips to help you succeed:</p>
      <h2>Research the Company</h2>
      <p>Learn about the company's projects, values, and culture to demonstrate your interest and fit for the role.</p>
      <h2>Review Technical Concepts</h2>
      <p>Brush up on key technical concepts, such as structural analysis, fluid mechanics, and soil mechanics, as you may be asked technical questions.</p>
      <h2>Practice Behavioral Questions</h2>
      <p>Prepare answers for common behavioral questions, such as "Tell me about a time you faced a challenge on a project" or "How do you handle tight deadlines?"</p>
      <h2>Prepare Questions to Ask</h2>
      <p>Have a list of questions ready to ask the interviewer about the company, team, and projects to show your enthusiasm and engagement.</p>
    `,
  },
  'essential-skills': {
    title: 'Essential Skills for Civil Engineers',
    content: `
      <p>To succeed as a civil engineer, you need a combination of technical and soft skills. Here are some of the most important skills:</p>
      <h2>Technical Skills</h2>
      <p>Proficiency in engineering software, understanding of construction materials, and knowledge of design codes and standards are crucial.</p>
      <h2>Problem-Solving Skills</h2>
      <p>Civil engineers must be able to identify problems, analyze data, and develop effective solutions.</p>
      <h2>Communication Skills</h2>
      <p>Effective communication with clients, team members, and stakeholders is essential for successful project execution.</p>
      <h2>Project Management Skills</h2>
      <p>Strong project management skills, including planning, scheduling, and budgeting, are important for overseeing projects from start to finish.</p>
    `,
  },
  'networking-tips': {
    title: 'Networking Tips for Civil Engineers',
    content: `
      <p>Networking is a valuable skill for advancing your civil engineering career. Here are some tips to help you build and maintain professional relationships:</p>
      <h2>Attend Industry Events</h2>
      <p>Participate in conferences, seminars, and workshops to meet other professionals and stay updated on industry trends.</p>
      <h2>Join Professional Organizations</h2>
      <p>Become a member of organizations like ASCE (American Society of Civil Engineers) to access networking opportunities and resources.</p>
      <h2>Use Social Media</h2>
      <p>Leverage platforms like LinkedIn to connect with colleagues, share your work, and engage with industry discussions.</p>
      <h2>Follow Up</h2>
      <p>After meeting someone new, follow up with a personalized message to reinforce the connection and explore potential collaborations.</p>
    `,
  },
  'continuing-education': {
    title: 'Continuing Education for Civil Engineers',
    content: `
      <p>Continuing education is important for staying current with industry developments and advancing your career. Here are some options for civil engineers:</p>
      <h2>Professional Development Courses</h2>
      <p>Enroll in courses offered by universities, professional organizations, and online platforms to enhance your skills and knowledge.</p>
      <h2>Certifications</h2>
      <p>Obtain certifications such as PE (Professional Engineer) or PMP (Project Management Professional) to demonstrate your expertise and commitment to the field.</p>
      <h2>Workshops and Seminars</h2>
      <p>Attend workshops and seminars to learn about new technologies, methodologies, and best practices in civil engineering.</p>
      <h2>Reading and Research</h2>
      <p>Stay informed by reading industry journals, research papers, and books on civil engineering topics.</p>
    `,
  },
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