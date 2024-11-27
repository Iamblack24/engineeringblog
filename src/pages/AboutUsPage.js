// src/pages/AboutUsPage.js
import React from 'react';
import './AboutUsPage.css';

const AboutUsPage = () => {
  return (
    <div className="about-us-page">
      <h1>About Us</h1>
      <div className="about-content">
        <section className="mission">
          <h2>Our Mission</h2>
          <p>
            We strive to provide top-quality educational resources and tools to empower engineers and construction professionals worldwide.
          </p>
          <p>
            Our mission is to bridge the gap between theoretical knowledge and practical application, ensuring that our users are well-equipped to tackle real-world challenges.
          </p>
        </section>
        <section className="team">
          <h2>Our Team</h2>
          <p>
            Our dedicated team of experts is committed to delivering innovative solutions and comprehensive materials to support your engineering endeavors.
          </p>
          <p>
            With years of experience in the industry, our team members bring a wealth of knowledge and expertise to help you succeed.
          </p>
        </section>
        <section className="contact">
          <h2>Contact Us</h2>
          <p>
            Have questions or feedback? Reach out to us at <a href="mailto:otienojohnmicheal2@gmail.com">info@engineeringblog.com</a>.
          </p>
          <p>
            We value your input and are always here to assist you with any inquiries or support you may need.
          </p>
        </section>
      </div>
    </div>
  );
};

export default AboutUsPage;