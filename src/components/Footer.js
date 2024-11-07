import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css'; // Import the CSS file for styling

const Footer = () => {
  return (
    <footer>
      <div className="footer-top">
        <div className="footer-section">
          <h3>About Us</h3>
          <p>
            We are a leading civil engineering blog providing resources, tools, and articles
            for professionals and students.
          </p>
        </div>
        <div className="footer-section">
          <h3>Contact Information</h3>
          <p>
            Technical University of Kenya<br />
            Nairobi, Kenya<br />
            Phone: +123 456 7890<br />
            Email: info@civilengineeringblog.com
          </p>
        </div>
        <div className="footer-section">
          <h3>Follow Us</h3>
          <div className="social-links">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">
              <img src="/icons/facebook-icon.png" alt="Facebook" />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
              <img src="/icons/twitter-icon.png" alt="Twitter" />
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">
              <img src="/icons/linkedin-icon.png" alt="LinkedIn" />
            </a>
            {/* Add more social media links as needed */}
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <p>© 2023 Civil Engineering Blog. All rights reserved.</p>
        <ul className="footer-links">
          <li>
            <Link to="/privacy-policy">Privacy Policy</Link>
          </li>
          <li>
            <Link to="/terms-of-service">Terms of Service</Link>
          </li>
          <li>
            <Link to="/contact">Contact Us</Link>
          </li>
        </ul>
      </div>
    </footer>
  );
};

export default Footer;