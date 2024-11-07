import React, { useState, useEffect } from 'react';
import './Navbar.css'; // Import the CSS file for navbar styling

const Navbar = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check local storage for theme preference
    const savedTheme = localStorage.getItem('theme');
    return savedTheme === 'dark';
  });

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark-theme');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-theme');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const handleToggle = () => {
    setIsDarkMode(!isDarkMode);
  };

  const handleMenuToggle = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="navbar">
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
      <div className="dark-mode-toggle">
        <label className="switch">
          <input type="checkbox" checked={isDarkMode} onChange={handleToggle} />
          <span className="slider round"></span>
        </label>
        <span>{isDarkMode ? 'Dark' : 'Light'} Mode</span>
      </div>
    </nav>
  );
};

export default Navbar;