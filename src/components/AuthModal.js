// src/components/AuthModal.js
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import './AuthModal.css';
import FocusTrap from 'focus-trap-react';

// Animation variants
const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.3 }
  },
  exit: { 
    opacity: 0,
    transition: { duration: 0.2 }
  }
};

const modalVariants = {
  hidden: { 
    opacity: 0,
    y: 50,
    scale: 0.95
  },
  visible: { 
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { 
      type: "spring",
      duration: 0.5,
      bounce: 0.3,
      delay: 0.1
    }
  },
  exit: { 
    opacity: 0,
    y: 20,
    scale: 0.95,
    transition: { duration: 0.2 }
  }
};

const formItemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (custom) => ({
    opacity: 1,
    y: 0,
    transition: { 
      delay: 0.2 + (custom * 0.1),
      duration: 0.4
    }
  })
};

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
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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

    setIsLoading(true); // Set loading to true before API call
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
    } finally {
      setIsLoading(false); // Reset loading state
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
    <AnimatePresence>
      <motion.div 
        className="auth-modal"
        variants={overlayVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        <FocusTrap>
          <motion.div 
            className="auth-modal-content"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <motion.button 
              className="close-button" 
              onClick={onClose}
              aria-label="Close modal"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <i className="fas fa-times"></i>
            </motion.button>
            
            <motion.h2
              variants={formItemVariants}
              custom={0}
              initial="hidden"
              animate="visible"
            >
              {isSignup ? 'Sign Up' : 'Log In'}
            </motion.h2>
            
            {error && (
              <motion.p 
                className="error-message"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {error}
              </motion.p>
            )}
            
            <form onSubmit={handleSubmit}>
              {isSignup && (
                <>
                  <motion.div 
                    className="form-group"
                    variants={formItemVariants}
                    custom={1}
                    initial="hidden"
                    animate="visible"
                  >
                    <label htmlFor="username">Username</label>
                    <input
                      type="text"
                      id="username"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      required
                      autoComplete="username"
                    />
                  </motion.div>
                  
                  <motion.div 
                    className="form-group"
                    variants={formItemVariants}
                    custom={2}
                    initial="hidden"
                    animate="visible"
                  >
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
                      autoComplete="tel"
                    />
                  </motion.div>
                  
                  <motion.div 
                    className="form-group"
                    variants={formItemVariants}
                    custom={3}
                    initial="hidden"
                    animate="visible"
                  >
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
                  </motion.div>
                  
                  <motion.div 
                    className="form-group"
                    variants={formItemVariants}
                    custom={4}
                    initial="hidden"
                    animate="visible"
                  >
                    <label htmlFor="schoolOrWorkplace">School or Workplace</label>
                    <input
                      type="text"
                      id="schoolOrWorkplace"
                      name="schoolOrWorkplace"
                      value={formData.schoolOrWorkplace}
                      onChange={handleInputChange}
                      required
                    />
                  </motion.div>
                </>
              )}
              
              <motion.div 
                className="form-group"
                variants={formItemVariants}
                custom={isSignup ? 5 : 1}
                initial="hidden"
                animate="visible"
              >
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  autoComplete="email"
                />
              </motion.div>
              
              <motion.div 
                className="form-group password-field"
                variants={formItemVariants}
                custom={isSignup ? 6 : 2}
                initial="hidden"
                animate="visible"
              >
                <label htmlFor="password">Password</label>
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    autoComplete={isSignup ? "new-password" : "current-password"}
                  />
                  <motion.button
                    type="button"
                    className="toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    <i className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
                  </motion.button>
                </div>
              </motion.div>
              
              {isSignup && (
                <motion.div 
                  className="form-group terms-group"
                  variants={formItemVariants}
                  custom={7}
                  initial="hidden"
                  animate="visible"
                >
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
                </motion.div>
              )}
              
              <motion.button 
                type="submit" 
                className={`submit-button ${isLoading ? 'shimmer-button' : ''}`}
                variants={formItemVariants}
                custom={isSignup ? 8 : 3}
                initial="hidden"
                animate="visible"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                disabled={isLoading}
              >
                <span className={isLoading ? 'text' : ''}>
                  {isSignup ? 'Sign Up' : 'Login'}
                </span>
                
                {isLoading && (
                  <motion.div 
                    className="shimmer"
                    animate={{ 
                      x: ["-100%", "200%"],
                    }}
                    transition={{ 
                      duration: 1.5, 
                      repeat: Infinity, 
                      ease: "easeInOut"
                    }}
                  />
                )}
              </motion.button>
              
              {!isSignup && (
                <motion.p
                  variants={formItemVariants}
                  custom={4}
                  initial="hidden"
                  animate="visible"
                >
                  <span 
                    className="forgot-password-link" 
                    onClick={handleForgotPassword}
                  >
                    Forgot Password?
                  </span>
                </motion.p>
              )}
              
              <motion.p
                variants={formItemVariants}
                custom={isSignup ? 9 : 5}
                initial="hidden"
                animate="visible"
              >
                {isSignup ? 'Already have an account? ' : "Don't have an account? "}
                <span 
                  className="toggle-link" 
                  onClick={toggleAuthMode}
                >
                  {isSignup ? 'Log In' : 'Sign Up'}
                </span>
              </motion.p>
            </form>
            
            {isSignup && formData.password && (
              <motion.div 
                className="password-strength"
                initial={{ opacity: 0, height: 0 }}
                animate={{ 
                  opacity: 1, 
                  height: 'auto',
                  transition: { duration: 0.3 }
                }}
              >
                <p>Password Requirements:</p>
                <ul>
                  <motion.li 
                    className={passwordStrength.length ? 'valid' : 'invalid'}
                    animate={{ 
                      color: passwordStrength.length ? '#4ade80' : '#f87171',
                    }}
                  >
                    At least 8 characters
                  </motion.li>
                  <motion.li 
                    className={passwordStrength.uppercase ? 'valid' : 'invalid'}
                    animate={{ 
                      color: passwordStrength.uppercase ? '#4ade80' : '#f87171',
                    }}
                  >
                    One uppercase letter
                  </motion.li>
                  <motion.li 
                    className={passwordStrength.lowercase ? 'valid' : 'invalid'}
                    animate={{ 
                      color: passwordStrength.lowercase ? '#4ade80' : '#f87171',
                    }}
                  >
                    One lowercase letter
                  </motion.li>
                  <motion.li 
                    className={passwordStrength.number ? 'valid' : 'invalid'}
                    animate={{ 
                      color: passwordStrength.number ? '#4ade80' : '#f87171',
                    }}
                  >
                    One number
                  </motion.li>
                  <motion.li 
                    className={passwordStrength.special ? 'valid' : 'invalid'}
                    animate={{ 
                      color: passwordStrength.special ? '#4ade80' : '#f87171',
                    }}
                  >
                    One special character (@$!%*?&)
                  </motion.li>
                </ul>
              </motion.div>
            )}
          </motion.div>
        </FocusTrap>
      </motion.div>
    </AnimatePresence>
  );
};

export default AuthModal;