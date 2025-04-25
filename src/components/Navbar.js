// src/components/Navbar.js
import React, { useState, useContext, useEffect, useRef } from 'react';
import './Navbar.css'; // Import the CSS file for navbar styling
import { AuthContext } from '../contexts/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import AuthModal from './AuthModal';
import { Link, NavLink } from 'react-router-dom'; // Use NavLink for active link styling
import { FaBars, FaTimes, FaCaretDown, FaMale, FaFemale } from 'react-icons/fa'; // Import icons from react-icons library

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { currentUser } = useContext(AuthContext);
  const dropdownRef = useRef(null);

  const handleMenuToggle = () => {
    setIsMenuOpen(!isMenuOpen);
    // Add body overflow toggle to prevent background scrolling when menu is open
    // document.body.style.overflow = isMenuOpen ? 'auto' : 'hidden';
  };

  const handleCloseMenu = () => {
    setIsMenuOpen(false);
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

  const openAuthModal = () => {
    setShowAuthModal(true);
  };

  const closeAuthModal = () => {
    setShowAuthModal(false);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  useEffect(() => {
    // Only show the modal automatically on first load if user is not logged in
    // and there's no stored preference to hide it
    const hasSeenModal = localStorage.getItem('hasSeenAuthModal');
    if (!currentUser && !hasSeenModal) {
      setShowAuthModal(true);
      // Set flag to prevent showing on every page load
      localStorage.setItem('hasSeenAuthModal', 'true');
    }
  }, [currentUser]); 

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownRef]);

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
            // Check the login/signup span element
            <span className="nav-links login-signup" onClick={openAuthModal}>
              Login / Signup
            </span>
          )}
        </div>

        {/* Navigation Links */}
        <ul className={`nav-menu ${isMenuOpen ? 'active' : ''}`}>
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

          {/* Design Materials Link */}
          <li className="nav-item">
            <NavLink
              to="/design-materials"
              className={({ isActive }) =>
                isActive ? 'nav-links active' : 'nav-links'
              }
              onClick={handleCloseMenu}
            >
              Design Materials
            </NavLink>
          </li>

          {/* Articles Link */}
          <li className="nav-item">
            <NavLink
              to="/articles"
              className={({ isActive }) =>
                isActive ? 'nav-links active' : 'nav-links'
              }
              onClick={handleCloseMenu}
            >
              Articles
            </NavLink>
          </li>

          {/* Case Studies Link */}
          <li className="nav-item">
            <NavLink
              to="/case-studies"
              className={({ isActive }) =>
                isActive ? 'nav-links active' : 'nav-links'
              }
              onClick={handleCloseMenu}
            >
              Case Studies
            </NavLink>
          </li>

          {/* Interactive Tools Link */}
          <li className="nav-item">
            <NavLink
              to="/tools"
              className={({ isActive }) =>
                isActive ? 'nav-links active' : 'nav-links'
              }
              onClick={handleCloseMenu}
            >
              Engineering Tools
            </NavLink>
          </li>

          {/* Revision Materials Link */}
          <li className="nav-item">
            <NavLink
              to="/revision-materials"
              className={({ isActive }) =>
                isActive ? 'nav-links active' : 'nav-links'
              }
              onClick={handleCloseMenu}
            >
              Revision Materials
            </NavLink>
          </li>

          {/* Career Guides Link */}
          <li className="nav-item">
            <NavLink
              to="/career-guides"
              className={({ isActive }) =>
                isActive ? 'nav-links active' : 'nav-links'
              }
              onClick={handleCloseMenu}
            >
              Career Guides
            </NavLink>
          </li>

          {/* Contact Link */}
          <li className="nav-item">
            <NavLink
              to="/contact"
              className={({ isActive }) =>
                isActive ? 'nav-links active' : 'nav-links'
              }
              onClick={handleCloseMenu}
            >
              Contact
            </NavLink>
          </li>
          {/* about us page */}
          <li className="nav-item">
            <NavLink
              to="/about-us"
              className={({ isActive }) =>
                isActive ? 'nav-links active' : 'nav-links'
              }
              onClick={handleCloseMenu}
            >
              About Us
            </NavLink>
          </li>
        </ul>
      </div>
      {showAuthModal && <AuthModal onClose={closeAuthModal} />}
      <AuthModal isOpen={showAuthModal} onClose={closeAuthModal} />
    </nav>
  );
};

export default Navbar;