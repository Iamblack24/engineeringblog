import React, { useState, useEffect } from 'react';
import './HomePage.css'; // Import the CSS file for styling
import NewsletterSignup from '../components/NewsletterSignup'; // Import the NewsletterSignup component
//import Navbar from '../components/Navbar'; // Import the Navbar component if not already imported

const HomePage = () => {
  const [randomFact, setRandomFact] = useState('');

  useEffect(() => {
    const facts = [
      "The Eiffel Tower can be 15 cm taller during the summer.",
      "The Great Wall of China is not visible from space.",
      "The Burj Khalifa is the tallest building in the world.",
      "The Panama Canal uses a system of locks to raise and lower ships.",
      "The Hoover Dam was built during the Great Depression."
    ];
    const randomIndex = Math.floor(Math.random() * facts.length);
    setRandomFact(facts[randomIndex]);
  }, []); // Removed 'facts' from dependency array

  return (
    <>
      <div className="home-page">
        <section className="hero-section">
          <div className="hero-overlay">
            <h1>Welcome to the Engineering Hub</h1>
            <p>Empowering Future Civil Engineers, Architects, Structural Engineers</p>
          </div>
        </section>
        <section className="random-fact-section">
          <h2>Did You Know?</h2>
          <p>{randomFact}</p>
        </section>
        <section className="content-section">
          <div className="content-card">
            <img src="/cad1.jpg" alt="Articles" className="content-image small-image" />
            <div className="content-text">
              <h2>Articles</h2>
              <p>Explore a wide range of articles on various civil engineering topics, including construction, sustainability, and project management.</p>
              <a href="/articles" className="content-link">Read More</a>
            </div>
          </div>
          <div className="content-card">
            <img src="/cad2.jpg" alt="Case Studies" className="content-image small-image" />
            <div className="content-text">
              <h2>Case Studies</h2>
              <p>Dive into detailed case studies of famous engineering projects, showcasing innovative solutions and best practices.</p>
              <a href="/case-studies" className="content-link">Explore</a>
            </div>
          </div>
          <div className="content-card">
            <img src="/cad3.jpg" alt="Engineering Tools" className="content-image small-image" />
            <div className="content-text">
              <h2>Engineering Tools</h2>
              <p>Utilize our interactive tools, including calculators and visualizers, to enhance your learning and project planning.</p>
              <a href="/tools" className="content-link">Use Features</a>
            </div>
          </div>
          <div className="content-card">
            <img src="/build.jpg" alt="Revision Materials" className="content-image small-image" />
            <div className="content-text">
              <h2>Revision Materials</h2>
              <p>Access a variety of revision materials, including flashcards, summaries, and quizzes, to help you prepare for exams.</p>
              <a href="/revision-materials" className="content-link">Access Materials</a>
            </div>
          </div>
          <div className="content-card">
            <img src="/last.jpg" alt="Career Guides" className="content-image small-image" />
            <div className="content-text">
              <h2>Career Guides</h2>
              <p>Get insights into different career paths, interview preparation tips, and skill development resources for civil engineers.</p>
              <a href="/career-guides" className="content-link">Learn More</a>
            </div>
          </div>
          <div className="content-card">
            <div className="content-text">
              <h2>Newsletter</h2>
              <p>Stay updated with the latest news and articles by signing up for our newsletter.</p>
              <NewsletterSignup />
            </div>
          </div>
        </section>
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
        <section className="featured-articles-section">
          <h2>Featured Articles</h2>
          <div className="featured-article">
            <h3>Innovative Construction Techniques</h3>
            <p>Discover the latest advancements in construction technology and how they are revolutionizing the industry.</p>
            <a href="/featured-article-1" className="content-link">Read More</a>
          </div>
          <div className="featured-article">
            <h3>Sustainable Engineering Practices</h3>
            <p>Learn about sustainable engineering practices that are helping to create a greener future.</p>
            <a href="/featured-article-2" className="content-link">Read More</a>
          </div>
        </section>
      </div>
    </>
  );
};

export default HomePage;