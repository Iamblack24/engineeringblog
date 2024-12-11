// src/pages/AboutUsPage.js
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import AuthModal from '../components/AuthModal';
import './AboutUsPage.css';

const AboutUsPage = () => {
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleJoinClick = () => {
    setShowAuthModal(true);
  };

  const handleCloseModal = () => {
    setShowAuthModal(false);
  };

  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.8 }
  };

  const staggerChildren = {
    initial: { opacity: 0 },
    whileInView: { opacity: 1 },
    viewport: { once: true },
    transition: { staggerChildren: 0.2 }
  };

  return (
    <div className="about-us-page">
      <motion.section 
        className="hero-section narrow"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
      >
        <h1>Empowering Engineers Through Innovation</h1>
        <p>Building the Future of Engineering Education</p>
      </motion.section>

      <motion.section 
        className="vision-section"
        {...fadeInUp}
      >
        <h2>Our Vision</h2>
        <p>Engineering Hub was created with a straightforward mission: to make engineering knowledge widely accessible and ensure high-quality technical education reaches everyone. We are committed to fostering a collaborative learning environment, supported by innovative AI technology, to simplify and enhance the learning experience.</p>
      </motion.section>

      <motion.section 
        className="ai-innovation"
        variants={staggerChildren}
        initial="initial"
        whileInView="whileInView"
        viewport={{ once: true }}
      >
        <h2>AI-Powered Engineering Solutions</h2>
        <div className="ai-features">
          <motion.div className="feature" variants={fadeInUp}>
            <h3>Smart Learning Paths</h3>
            <p>Our AI algorithms analyze your learning patterns and create personalized study paths, ensuring efficient knowledge acquisition tailored to your needs.</p>
          </motion.div>
          <motion.div className="feature" variants={fadeInUp}>
            <h3>Automated Problem Solving</h3>
            <p>Complex engineering problems broken down into step-by-step solutions, with AI guidance to help you understand each concept thoroughly.</p>
          </motion.div>
          <motion.div className="feature" variants={fadeInUp}>
            <h3>Real-time Assistance</h3>
            <p>24/7 AI-powered chat support to answer your engineering queries instantly, complemented by community expert reviews.</p>
          </motion.div>
        </div>
      </motion.section>

      <motion.section 
        className="resources-section"
        variants={staggerChildren}
        initial="initial"
        whileInView="whileInView"
        viewport={{ once: true }}
      >
        <h2>Learning Resources</h2>
        <div className="resources-grid">
          <motion.div className="resource" variants={fadeInUp}>
            <h3>Technical Articles</h3>
            <p>Peer-reviewed articles covering structural analysis, sustainable design, and cutting-edge engineering practices.</p>
          </motion.div>
          <motion.div className="resource" variants={fadeInUp}>
            <h3>Case Studies</h3>
            <p>Real-world engineering projects analyzed in detail, from initial challenge to final implementation, with lessons learned.</p>
          </motion.div>
          <motion.div className="resource" variants={fadeInUp}>
            <h3>Interactive Tools</h3>
            <p>Suite of engineering calculators and design tools integrated with AI for enhanced accuracy and learning.</p>
          </motion.div>
        </div>
      </motion.section>

      <motion.section 
        className="community-section"
        {...fadeInUp}
      >
        <h2>Growing Community</h2>
        <p>Join a thriving community of engineering professionals, students, and educators.</p>
        <div className="community-stats">
          <motion.div 
            className="stat"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <h3>500+</h3>
            <p>Active Members</p>
          </motion.div>
          <motion.div 
            className="stat"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <h3>50+</h3>
            <p>Engineering Tools</p>
          </motion.div>
          <motion.div 
            className="stat"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <h3>50+</h3>
            <p>Case Studies</p>
          </motion.div>
        </div>
      </motion.section>

      <motion.section 
        className="team-section"
        variants={staggerChildren}
        initial="initial"
        whileInView="whileInView"
        viewport={{ once: true }}
      >
        <h2>Our Team</h2>
        <div className="team-grid">
          <motion.div className="team-member" variants={fadeInUp}>
            <div className="member-content">
              <h3>John Micheal</h3>
              <p className="role">Founder and Lead Developer</p>
              <p className="bio">Michael, an engineering Student with a background in Civil engineering and software development, is dedicated to enhancing engineering education. Through Engineering Hub, he focuses on integrating AI to simplify complex concepts, making technical knowledge more approachable and practical for learners.</p>
              <div className="social-links">
                <motion.a 
                  href="https://www.linkedin.com/in/john-micheal-736bb71b4"
                  target="_blank"
                  rel="noreferrer"
                  whileHover={{ y: -3 }}
                  transition={{ duration: 0.2 }}
                >
                  <i className="fab fa-linkedin"></i>
                </motion.a>
                <motion.a 
                  href="https://x.com/gacharua?t=QQ2R-UjV2VmgHnkVfBD8OQ&s=08"
                  target="_blank"
                  rel="noreferrer"
                  whileHover={{ y: -3 }}
                  transition={{ duration: 0.2 }}
                >
                  <i className="fab fa-twitter"></i>
                </motion.a>
                <motion.a 
                  href="https://www.instagram.com/john.michael4228?igsh=YzljYTk1ODg3Zg=="
                  target="_blank"
                  rel="noreferrer"
                  whileHover={{ y: -3 }}
                  transition={{ duration: 0.2 }}
                >
                  <i className="fab fa-instagram"></i>
                </motion.a>
              </div>
            </div>
          </motion.div>
          <motion.div className="team-member" variants={fadeInUp}>
            <div className="member-content">
              <h3>Owen Richard</h3>
              <p className="role">Co-founder and Content Director</p>
              <p className="bio">With a background in engineering education and technical content development, Owen leads our content strategy and community engagement initiatives. His expertise in creating comprehensive learning resources has been crucial in building our extensive knowledge base.</p>
              <div className="social-links">
                <motion.a 
                  href="https://www.linkedin.com/in/owen-richard-93737433a"
                  target="_blank"
                  rel="noreferrer"
                  whileHover={{ y: -3 }}
                  transition={{ duration: 0.2 }}
                >
                  <i className="fab fa-linkedin"></i>
                </motion.a>
                <motion.a 
                  href="https://x.com/richar94366?t=Btpo4QaAI6j_zGtEGw73PA&s=09"
                  target="_blank"
                  rel="noreferrer"
                  whileHover={{ y: -3 }}
                  transition={{ duration: 0.2 }}
                >
                  <i className="fab fa-twitter"></i>
                </motion.a>
                <motion.a 
                  href="https://www.instagram.com/_si.lento/profilecard/?igsh=d2ZlMm55ZG9xdHVy"
                  target="_blank"
                  rel="noreferrer"
                  whileHover={{ y: -3 }}
                  transition={{ duration: 0.2 }}
                >
                  <i className="fab fa-instagram"></i>
                </motion.a>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      <motion.section 
        className="contact-section"
        {...fadeInUp}
      >
        <h2>Join Our Community</h2>
        <p>Be part of the engineering revolution. Connect, learn, and grow with us.</p>
        <div className="contact-links">
          <motion.button 
            onClick={handleJoinClick}
            className="cta-button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Join Now
          </motion.button>
          <motion.a 
            href="mailto:otienojohnmicheal2@gmail.com" 
            className="contact-button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Contact Us
          </motion.a>
        </div>
      </motion.section>

      {showAuthModal && <AuthModal onClose={handleCloseModal} />}
    </div>
  );
};

export default AboutUsPage;