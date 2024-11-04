import React from 'react';
import './HomePage.css'; // Import the CSS file for styling
import NewsletterSignup from '../components/NewsletterSignup'; // Import the NewsletterSignup component

const HomePage = () => {
  return (
    <div className="home-page">
      <section className="hero-section">
        <div className="hero-overlay">
          <h1>Welcome to the Engineering Blog</h1>
          <p>Empowering Future Civil Engineers, Architects, Structural Engineers</p>
        </div>
      </section>
      <section className="content-section">
        <div className="content-card">
          <h2>Articles</h2>
          <p>Explore a wide range of articles on various civil engineering topics, including construction, sustainability, and project management.</p>
          <a href="/articles" className="content-link">Read More</a>
        </div>
        <div className="content-card">
          <h2>Case Studies</h2>
          <p>Dive into detailed case studies of famous engineering projects, showcasing innovative solutions and best practices.</p>
          <a href="/case-studies" className="content-link">Explore</a>
        </div>
        <div className="content-card">
          <h2>Interactive Tools</h2>
          <p>Utilize our interactive tools, including calculators and visualizers, to enhance your learning and project planning.</p>
          <a href="/tools" className="content-link">Use Tools</a>
        </div>
        <div className="content-card">
          <h2>Revision Materials</h2>
          <p>Access a variety of revision materials, including flashcards, summaries, and quizzes, to help you prepare for exams.</p>
          <a href="/revision-materials" className="content-link">Access Materials</a>
        </div>
        <div className="content-card">
          <h2>Career Guides</h2>
          <p>Get insights into different career paths, interview preparation tips, and skill development resources for civil engineers.</p>
          <a href="/career-guides" className="content-link">Learn More</a>
        </div>
      </section>
      <NewsletterSignup /> {/* Add the NewsletterSignup component here */}
      <section className="testimonials-section">
        <h2>What Our Readers Say</h2>
        <div className="testimonial">
          <p>"This blog has been an invaluable resource for my studies. The articles and tools are top-notch!"</p>
          <span>- Alex, Civil Engineering Student</span>
        </div>
        <div className="testimonial">
          <p>"The case studies provide great insights into real-world engineering challenges and solutions."</p>
          <span>- Maria, Structural Engineer</span>
        </div>
      </section>
    </div>
  );
};

export default HomePage;