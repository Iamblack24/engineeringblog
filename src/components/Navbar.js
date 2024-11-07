import React, { useState } from 'react';
import './Navbar.css'; // Import the CSS file for navbar styling

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleMenuToggle = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleCloseMenu = () => {
    setIsMenuOpen(false);
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
        <li><a href="/" onClick={handleCloseMenu}>Home</a></li>
        <li><a href="/articles" onClick={handleCloseMenu}>Articles</a></li>
        <li><a href="/design-materials" onClick={handleCloseMenu}>Design Materials</a></li>
        <li><a href="/case-studies" onClick={handleCloseMenu}>Case Studies</a></li>
        <li><a href="/tools" onClick={handleCloseMenu}>Tools</a></li>
        <li><a href="/revision-materials" onClick={handleCloseMenu}>Revision Materials</a></li>
        <li><a href="/career-guides" onClick={handleCloseMenu}>Career Guides</a></li>
        <li><a href="/contact" onClick={handleCloseMenu}>Contact</a></li>
      </ul>
      {isMenuOpen && <div className="backdrop" onClick={handleCloseMenu}></div>}
      <div className="in-development-label">
        🚧 In Development 🚧
      </div>
    </nav>
  );
};

export default Navbar;