import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css'; // Import the CSS file for styling

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <Link to="/">
          <img src="/path/to/logo.png" alt="Logo" /> {/* Replace with your logo path */}
        </Link>
      </div>
      <ul className="navbar-links">
        <li><Link to="/">Home</Link></li>
        <li><Link to="/articles">Articles</Link></li>
        <li><Link to="/case-studies">Case Studies</Link></li>
        <li><Link to="/tools">Interactive Tools</Link></li>
        <li><Link to="/revision-materials">Revision Materials</Link></li>
        <li><Link to="/career-guides">Career Guides</Link></li>
      </ul>
    </nav>
  );
};

export default Navbar;