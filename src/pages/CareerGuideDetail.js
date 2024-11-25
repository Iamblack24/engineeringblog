import React from 'react';
import { useParams } from 'react-router-dom';
import './CareerGuideDetail.css';

const careerGuideDetails = {
  'career-paths': {
    title: 'Career Paths in Civil Engineering',
    content: `
      <p>Civil engineering offers a diverse range of career paths, each with its own unique challenges and rewards. Here are some of the most prominent career paths:</p>
      <h2>Structural Engineering</h2>
      <p>Structural engineers design and analyze buildings, bridges, and other structures to ensure they are safe and capable of withstanding various forces. They use advanced software and materials science to create innovative solutions.</p>
      <h2>Geotechnical Engineering</h2>
      <p>Geotechnical engineers study soil and rock mechanics to design foundations, retaining walls, and other structures that interact with the ground. They conduct site investigations and analyze soil samples to ensure stability and safety.</p>
      <h2>Transportation Engineering</h2>
      <p>Transportation engineers plan, design, and maintain transportation systems, including roads, highways, airports, and railways. They focus on improving traffic flow, safety, and sustainability through innovative design and technology.</p>
      <h2>Environmental Engineering</h2>
      <p>Environmental engineers work on projects related to water and air quality, waste management, and environmental sustainability. They develop solutions to minimize environmental impact and promote sustainable practices.</p>
      <h2>Construction Management</h2>
      <p>Construction managers oversee construction projects, ensuring they are completed on time, within budget, and according to specifications. They coordinate with various stakeholders and manage resources to achieve project goals.</p>
    `,
  },
  'interview-preparation': {
    title: 'Interview Preparation for Civil Engineers',
    content: `
      <p>Preparing for a civil engineering job interview requires a combination of technical knowledge, soft skills, and confidence. Here are some tips to help you succeed:</p>
      <h2>Research the Company</h2>
      <p>Learn about the company's projects, values, and culture to demonstrate your interest and fit for the role. Understanding their recent projects and achievements can give you an edge during the interview.</p>
      <h2>Review Technical Concepts</h2>
      <p>Brush up on key technical concepts, such as structural analysis, fluid mechanics, and soil mechanics, as you may be asked technical questions. Reviewing your past projects and how you applied these concepts can be beneficial.</p>
      <h2>Practice Behavioral Questions</h2>
      <p>Prepare answers for common behavioral questions, such as "Tell me about a time you faced a challenge on a project" or "How do you handle tight deadlines?" Use the STAR method (Situation, Task, Action, Result) to structure your responses.</p>
      <h2>Prepare Questions to Ask</h2>
      <p>Have a list of questions ready to ask the interviewer about the company, team, and projects to show your enthusiasm and engagement. Asking insightful questions can also help you determine if the company is the right fit for you.</p>
    `,
  },
  'essential-skills': {
    title: 'Essential Skills for Civil Engineers',
    content: `
      <p>To succeed as a civil engineer, you need a combination of technical and soft skills. Here are some of the most important skills:</p>
      <h2>Technical Skills</h2>
      <p>Proficiency in engineering software, understanding of construction materials, and knowledge of design codes and standards are crucial. Staying updated with the latest technological advancements can give you a competitive edge.</p>
      <h2>Problem-Solving Skills</h2>
      <p>Civil engineers must be able to identify problems, analyze data, and develop effective solutions. Critical thinking and creativity are essential for overcoming challenges and optimizing designs.</p>
      <h2>Communication Skills</h2>
      <p>Effective communication with clients, team members, and stakeholders is essential for successful project execution. Being able to convey complex technical information in a clear and concise manner is key.</p>
      <h2>Project Management Skills</h2>
      <p>Strong project management skills, including planning, scheduling, and budgeting, are important for overseeing projects from start to finish. Effective time management and leadership abilities are also crucial.</p>
    `,
  },
  'networking-tips': {
    title: 'Networking Tips for Civil Engineers',
    content: `
      <p>Networking is a valuable skill for advancing your civil engineering career. Here are some tips to help you build and maintain professional relationships:</p>
      <h2>Attend Industry Events</h2>
      <p>Participate in conferences, seminars, and workshops to meet other professionals and stay updated on industry trends. Engaging in discussions and sharing your insights can help you build a strong professional network.</p>
      <h2>Join Professional Organizations</h2>
      <p>Become a member of organizations like ASCE (American Society of Civil Engineers) to access networking opportunities and resources. Active participation in these organizations can enhance your professional growth.</p>
      <h2>Use Social Media</h2>
      <p>Leverage platforms like LinkedIn to connect with colleagues, share your work, and engage with industry discussions. Regularly updating your profile and sharing relevant content can increase your visibility.</p>
      <h2>Follow Up</h2>
      <p>After meeting someone new, follow up with a personalized message to reinforce the connection and explore potential collaborations. Maintaining regular contact with your network can lead to new opportunities.</p>
    `,
  },
  'continuing-education': {
    title: 'Continuing Education for Civil Engineers',
    content: `
      <p>Continuing education is important for staying current with industry developments and advancing your career. Here are some options for civil engineers:</p>
      <h2>Professional Development Courses</h2>
      <p>Enroll in courses offered by universities, professional organizations, and online platforms to enhance your skills and knowledge. Continuous learning can help you stay competitive in the job market.</p>
      <h2>Certifications</h2>
      <p>Obtain certifications such as PE (Professional Engineer) or PMP (Project Management Professional) to demonstrate your expertise and commitment to the field. These credentials can open up new career opportunities.</p>
      <h2>Workshops and Seminars</h2>
      <p>Attend workshops and seminars to learn about new technologies, methodologies, and best practices in civil engineering. Networking with peers at these events can also provide valuable insights.</p>
      <h2>Reading and Research</h2>
      <p>Stay informed by reading industry journals, research papers, and books on civil engineering topics. Keeping up with the latest research can inspire innovative solutions in your projects.</p>
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