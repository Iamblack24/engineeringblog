import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css'; // Import the CSS file for styling
import { FaFacebook, FaTwitter, FaLinkedin } from 'react-icons/fa'; // Import icons from react-icons library

const Footer = () => {
  return (
    <footer className="footer"> {/* Updated class name from "footer" */}
      <div className="footer-content"> {/* Changed from "footer-top" to "footer-content" */}
        <div className="footer-section">
          <h3>About Us</h3>
          <p>
            We are a leading engineering hub providing resources, tools, case studies and articles
            for professionals and students.
          </p>
        </div>
        <div className="footer-section">
          <h3>Contact Information</h3>
          <p>
            Embakasi, Tassia<br />
            Nairobi, Kenya<br />
            Phone: +254 799 129 637<br />
            Email: engineeringhub24@gmail.com
          </p>
        </div>
        <div className="footer-section">
          <h3>Follow Us</h3>
          <div className="social-links">
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
            >
              <FaFacebook className="social-icon" />
            </a>
            <a
              href="https://x.com/gacharua?t=QQ2R-UjV2VmgHnkVfBD8OQ&s=08"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Twitter"
            >
              <FaTwitter className="social-icon" />
            </a>
            <a
              href="https://www.linkedin.com/in/john-micheal-736bb71b4"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
            >
              <FaLinkedin className="social-icon" />
            </a>
            {/* Add more social media links as needed */}
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <p>© 2024 Engineering hub. All rights reserved.</p>
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