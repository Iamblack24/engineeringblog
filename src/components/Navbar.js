import React, { useState } from 'react';
import './Navbar.css'; // Import the CSS file for navbar styling

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleMenuToggle = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="navbar dark-navbar">
      <div className="navbar-logo">
        <h2>Engineering Hub</h2>
      </div>
      <div className="menu-icon" onClick={handleMenuToggle}>
        ☰
      </div>
      <ul className={`navbar-links ${isMenuOpen ? 'open' : ''}`}>
        <li><a href="/">Home</a></li>
        <li><a href="/articles">Articles</a></li>
        <li><a href="/design-materials">Design Materials</a></li>
        <li><a href="/case-studies">Case Studies</a></li>
        <li><a href="/tools">Tools</a></li>
        <li><a href="/revision-materials">Revision Materials</a></li>
        <li><a href="/career-guides">Career Guides</a></li>
        <li><a href="/contact">Contact</a></li>
      </ul>
      <div className="in-development-label">
        🚧 In Development 🚧
      </div>
    </nav>
  );
};

export default Navbar;