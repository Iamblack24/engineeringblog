// src/components/AuthModal.js
import React, { useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import './AuthModal.css';

const AuthModal = ({ onClose }) => {
  const [isSignup, setIsSignup] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    phoneNumber: '',
    gender: '',
    schoolOrWorkplace: '',
  });
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState('');

  const toggleAuthMode = () => {
    setIsSignup(!isSignup);
    setError('');
    setAcceptTerms(false); // Reset the checkbox when toggling
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleCheckboxChange = (e) => {
    setAcceptTerms(e.target.checked);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSignup && !acceptTerms) {
      setError('You must accept the Terms of Service and Privacy Policy.');
      return;
    }

    try {
      if (isSignup) {
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        const user = userCredential.user;
        await setDoc(doc(db, 'users', user.uid), {
          username: formData.username,
          email: formData.email,
          phoneNumber: formData.phoneNumber,
          gender: formData.gender,
          schoolOrWorkplace: formData.schoolOrWorkplace,
        });
      } else {
        await signInWithEmailAndPassword(auth, formData.email, formData.password);
      }
      onClose();
    } catch (error) {
      setError(error.message);
    }
  };

  const handleForgotPassword = async () => {
    if (!formData.email) {
      setError('Please enter your email address.');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, formData.email);
      setError('Password reset email sent.');
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="auth-modal">
      <div className="auth-modal-content">
        <button className="close-button" onClick={onClose}>
          &times;
        </button>
        <h2>{isSignup ? 'Sign Up' : 'Log In'}</h2>
        {error && <p className="error-message">{error}</p>}
        <form onSubmit={handleSubmit}>
          {isSignup && (
            <>
              <div className="form-group">
                <label htmlFor="username">Username</label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="phoneNumber">Phone Number</label>
                <input
                  type="text"
                  id="phoneNumber"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="gender">Gender</label>
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="schoolOrWorkplace">School or Workplace</label>
                <input
                  type="text"
                  id="schoolOrWorkplace"
                  name="schoolOrWorkplace"
                  value={formData.schoolOrWorkplace}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </>
          )}
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
            />
          </div>
          {isSignup && (
            <div className="form-group terms-group">
              <input
                type="checkbox"
                id="acceptTerms"
                checked={acceptTerms}
                onChange={handleCheckboxChange}
                required
              />
              <label htmlFor="acceptTerms">
                I accept the{' '}
                <Link to="/terms-of-service" target="_blank" rel="noopener noreferrer">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link to="/privacy-policy" target="_blank" rel="noopener noreferrer">
                  Privacy Policy
                </Link>.
              </label>
            </div>
          )}
          <button type="submit" className="submit-button">
            {isSignup ? 'Sign Up' : 'Login'}
          </button>
          {!isSignup && (
            <p>
              <span className="forgot-password-link" onClick={handleForgotPassword}>
                Forgot Password?
              </span>
            </p>
          )}
          <p>
            {isSignup ? 'Already have an account? ' : "Don't have an account? "}
            <span className="toggle-link" onClick={toggleAuthMode}>
              {isSignup ? 'Log In' : 'Sign Up'}
            </span>
          </p>
        </form>
      </div>
    </div>
  );
};

export default AuthModal;