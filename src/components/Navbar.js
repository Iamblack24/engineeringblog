// src/components/Navbar.js
import React, { useState, useContext, useEffect, useRef } from 'react';
import './Navbar.css'; // Import the CSS file for navbar styling
import { AuthContext } from '../contexts/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { Link, NavLink, useNavigate } from 'react-router-dom'; // Add useNavigate
import { FaBars, FaTimes, FaCaretDown, FaMale, FaFemale, FaTools, FaBook, FaGraduationCap, FaBriefcase, FaUsers, FaInfo } from 'react-icons/fa'; // Import icons from react-icons library

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const { currentUser } = useContext(AuthContext);
  const dropdownRef = useRef(null);
  const mobileNavRef = useRef(null);
  const navigate = useNavigate(); // Add this

  const handleMenuToggle = () => {
    setIsMenuOpen(!isMenuOpen);
    // Reset open dropdowns when toggling menu
    setOpenDropdown(null);
  };

  const handleCloseMenu = () => {
    setIsMenuOpen(false);
    setOpenDropdown(null);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsDropdownOpen(false);
      handleCloseMenu();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  // Update the toggleMobileDropdown function to ensure only one dropdown is open at a time
  const toggleMobileDropdown = (name) => {
    if (openDropdown === name) {
      setOpenDropdown(null);
      // Announce to screen readers that menu is closed
      const announcement = document.getElementById('dropdown-announcement');
      if (announcement) announcement.textContent = `${name} menu closed`;
    } else {
      setOpenDropdown(name);
      // Announce to screen readers that menu is open
      const announcement = document.getElementById('dropdown-announcement');
      if (announcement) announcement.textContent = `${name} menu opened`;
    }
  };

  // Close navbar when clicking outside on mobile
  const handleClickOutside = (event) => {
    if (
      isMenuOpen &&
      mobileNavRef.current &&
      !mobileNavRef.current.contains(event.target) &&
      !event.target.closest(".menu-icon")
    ) {
      setIsMenuOpen(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleUserDropdownOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleUserDropdownOutside);
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleUserDropdownOutside);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen, dropdownRef, mobileNavRef]);

  // Close menu on route change
  useEffect(() => {
    return () => {
      setIsMenuOpen(false);
    };
  }, []);

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Hamburger Menu Icon */}
        <div className="menu-icon" onClick={handleMenuToggle}>
          {isMenuOpen ? <FaTimes /> : <FaBars />}
        </div>

        {/* Logo */}
        <Link to="/" className="navbar-logo" onClick={handleCloseMenu}>
          Engineering Hub
        </Link>

        {/* Navigation Links */}
        <ul 
          className={`nav-menu ${isMenuOpen ? 'active' : ''}`}
          ref={mobileNavRef}
        >
          {/* Home Link */}
          <li className="nav-item">
            <NavLink
              to="/"
              className={({ isActive }) =>
                isActive ? 'nav-links active' : 'nav-links'
              }
              onClick={handleCloseMenu}
            >
              Home
            </NavLink>
          </li>

          {/* Learning Materials Group */}
          <li className={`nav-item nav-item-dropdown ${openDropdown === 'learning' ? 'open' : ''}`}>
            <div 
              className="nav-links"
              onClick={() => toggleMobileDropdown('learning')}
            >
              <FaBook /> Learning <span className="dropdown-indicator"><FaCaretDown /></span>
            </div>
            <div className="dropdown-content">
              <NavLink
                to="/design-materials"
                className="dropdown-link"
                onClick={handleCloseMenu}
              >
                Design Materials
              </NavLink>
              <NavLink
                to="/articles"
                className="dropdown-link"
                onClick={handleCloseMenu}
              >
                Articles
              </NavLink>
              <NavLink
                to="/case-studies"
                className="dropdown-link"
                onClick={handleCloseMenu}
              >
                Case Studies
              </NavLink>
              <NavLink
                to="/revision-materials"
                className="dropdown-link"
                onClick={handleCloseMenu}
              >
                Revision Materials
              </NavLink>
              <NavLink
                to="/educational-resources"
                className="dropdown-link"
                onClick={handleCloseMenu}
              >
                Educational Resources
              </NavLink>
            </div>
          </li>

          {/* Tools Group */}
          <li className={`nav-item nav-item-dropdown ${openDropdown === 'tools' ? 'open' : ''}`}>
            <div 
              className="nav-links"
              onClick={() => toggleMobileDropdown('tools')}
            >
              <FaTools /> Tools <span className="dropdown-indicator"><FaCaretDown /></span>
            </div>
            <div className="dropdown-content">
              <NavLink
                to="/tools"
                className="dropdown-link"
                onClick={handleCloseMenu}
              >
                Engineering Tools
              </NavLink>
              <NavLink
                to="/interactive-ai"
                className="dropdown-link"
                onClick={handleCloseMenu}
              >
                AI Assistant
              </NavLink>
              <NavLink
                to="/ai-design-optimizer"
                className="dropdown-link"
                onClick={handleCloseMenu}
              >
                AI Design Optimizer
              </NavLink>
              <NavLink
                to="/moving-load-analyzer"
                className="dropdown-link"
                onClick={handleCloseMenu}
              >
                Moving Load Analysis
              </NavLink>
            </div>
          </li>

          {/* Career Group */}
          <li className={`nav-item nav-item-dropdown ${openDropdown === 'career' ? 'open' : ''}`}>
            <div 
              className="nav-links"
              onClick={() => toggleMobileDropdown('career')}
            >
              <FaBriefcase /> Career <span className="dropdown-indicator"><FaCaretDown /></span>
            </div>
            <div className="dropdown-content">
              <NavLink
                to="/career-guides"
                className="dropdown-link"
                onClick={handleCloseMenu}
              >
                Career Guides
              </NavLink>
              <NavLink
                to="/events"
                className="dropdown-link"
                onClick={handleCloseMenu}
              >
                Events
              </NavLink>
              <NavLink
                to="/webinars"
                className="dropdown-link"
                onClick={handleCloseMenu}
              >
                Webinars
              </NavLink>
              <NavLink
                to="/workshops"
                className="dropdown-link"
                onClick={handleCloseMenu}
              >
                Workshops
              </NavLink>
            </div>
          </li>

          {/* About Link - Moved up in the order and made more compact */}
          <li className={`nav-item nav-item-dropdown ${openDropdown === 'about' ? 'open' : ''}`}>
            <div 
              className="nav-links"
              onClick={() => toggleMobileDropdown('about')}
            >
              <FaInfo /> About <span className="dropdown-indicator"><FaCaretDown /></span>
            </div>
            <div className="dropdown-content">
              <NavLink
                to="/about-us"
                className="dropdown-link"
                onClick={handleCloseMenu}
              >
                About Us
              </NavLink>
              <NavLink
                to="/contact"
                className="dropdown-link"
                onClick={handleCloseMenu}
              >
                Contact
              </NavLink>
            </div>
          </li>
        </ul>

        {/* User Authentication */}
        <div className="user-auth">
          {currentUser ? (
            <div className="user-info" onClick={toggleDropdown} ref={dropdownRef}>
              {currentUser.gender === 'female' ? (
                <FaFemale className="user-icon" />
              ) : (
                <FaMale className="user-icon" />
              )}
              <span className="username">
                {currentUser.displayName || currentUser.email}
              </span>
              <FaCaretDown />
              {isDropdownOpen && (
                <ul className={`dropdown-menu ${isDropdownOpen ? 'show' : ''}`}>
                  <li className="dropdown-item" onClick={handleLogout}>
                    Logout
                  </li>
                </ul>
              )}
            </div>
          ) : (
            <span
              className="nav-links login-signup"
              onClick={() => navigate('/auth')}
            >
              Login / Signup
            </span>
          )}
        </div>
      </div>

      {/* Mobile menu overlay */}
      <div className={`mobile-menu-overlay ${isMenuOpen ? 'active' : ''}`} onClick={handleCloseMenu}></div>
      <div aria-live="polite" id="dropdown-announcement" className="sr-only"></div>
    </nav>
  );
};

export default Navbar;