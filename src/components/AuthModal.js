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
  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false
  });

  // Validation patterns
  const patterns = {
    username: /^[a-zA-Z0-9_-]{3,20}$/, // 3-20 characters, letters, numbers, underscore, hyphen
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    phone: /^[0-9]{10}$/, // 10 digits
    password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
  };

  const validateUsername = (username) => {
    if (!patterns.username.test(username)) {
      return 'Username must be 3-20 characters long and can only contain letters, numbers, underscore, and hyphen';
    }
    if (username.includes('@')) {
      return 'Username cannot contain @ symbol';
    }
    // Check for SQL injection patterns
    const sqlInjectionPattern = /(\b(select|insert|update|delete|drop|union|exec|declare)\b)|(['"\\;])/i;
    if (sqlInjectionPattern.test(username)) {
      return 'Invalid username format';
    }
    return '';
  };

  const validatePhoneNumber = (phone) => {
    if (!patterns.phone.test(phone)) {
      return 'Phone number must be 10 digits';
    }
    return '';
  };

  const validatePassword = (password) => {
    const strength = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[@$!%*?&]/.test(password)
    };
    setPasswordStrength(strength);

    if (!patterns.password.test(password)) {
      return 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)';
    }
    return '';
  };

  const validateEmail = (email) => {
    if (!patterns.email.test(email)) {
      return 'Please enter a valid email address';
    }
    return '';
  };

  const sanitizeInput = (input) => {
    // Basic XSS prevention
    return input.replace(/[<>]/g, '');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const sanitizedValue = sanitizeInput(value);
    
    setFormData(prevData => ({
      ...prevData,
      [name]: sanitizedValue,
    }));

    // Clear previous errors
    setError('');

    // Validate input based on field type
    switch (name) {
      case 'username':
        const usernameError = validateUsername(sanitizedValue);
        if (usernameError) setError(usernameError);
        break;
      case 'email':
        const emailError = validateEmail(sanitizedValue);
        if (emailError) setError(emailError);
        break;
      case 'password':
        const passwordError = validatePassword(sanitizedValue);
        if (passwordError) setError(passwordError);
        break;
      case 'phoneNumber':
        const phoneError = validatePhoneNumber(sanitizedValue);
        if (phoneError) setError(phoneError);
        break;
      default:
        break;
    }
  };

  const handlePhoneInput = (e) => {
    const value = e.target.value;
    // Only allow digits
    const numbersOnly = value.replace(/[^0-9]/g, '');
    
    // Update form with numbers only
    setFormData(prev => ({
      ...prev,
      phoneNumber: numbersOnly
    }));

    // Validate length
    if (numbersOnly.length > 0 && numbersOnly.length !== 10) {
      setError('Phone number must be exactly 10 digits');
    } else {
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all fields before submission
    const usernameError = isSignup ? validateUsername(formData.username) : '';
    const emailError = validateEmail(formData.email);
    const passwordError = validatePassword(formData.password);
    const phoneError = isSignup ? validatePhoneNumber(formData.phoneNumber) : '';

    if (usernameError || emailError || passwordError || phoneError) {
      setError(usernameError || emailError || passwordError || phoneError);
      return;
    }

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

  const toggleAuthMode = () => {
    setIsSignup(!isSignup);
    setError('');
    setAcceptTerms(false);
  };

  const handleCheckboxChange = (e) => {
    setAcceptTerms(e.target.checked);
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
        <button 
          className="close-button" 
          onClick={onClose}
          aria-label="Close modal"
        >
          <i className="fas fa-times"></i>
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
                  type="tel"
                  id="phoneNumber"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handlePhoneInput}
                  maxLength="10"
                  pattern="[0-9]{10}"
                  placeholder="Enter 10 digit number"
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
        {isSignup && formData.password && (
          <div className="password-strength">
            <p>Password Requirements:</p>
            <ul>
              <li className={passwordStrength.length ? 'valid' : 'invalid'}>
                At least 8 characters
              </li>
              <li className={passwordStrength.uppercase ? 'valid' : 'invalid'}>
                One uppercase letter
              </li>
              <li className={passwordStrength.lowercase ? 'valid' : 'invalid'}>
                One lowercase letter
              </li>
              <li className={passwordStrength.number ? 'valid' : 'invalid'}>
                One number
              </li>
              <li className={passwordStrength.special ? 'valid' : 'invalid'}>
                One special character (@$!%*?&)
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthModal;