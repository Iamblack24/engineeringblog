// src/components/AuthModal.js
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import FocusTrap from 'focus-trap-react';
import './AuthModal.css';

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

// eslint-disable-next-line no-unused-vars
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

const AuthModal = ({ isOpen, onClose }) => {
  // State definitions
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
  const [successMessage, setSuccessMessage] = useState('');
  // eslint-disable-next-line no-unused-vars
  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Validation patterns
  const patterns = {
    username: /^[a-zA-Z0-9_-]{3,20}$/, // 3-20 characters, letters, numbers, underscore, hyphen
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    phone: /^[0-9]{10}$/, // 10 digits
    password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
  };

  // Add the validation functions that were missing
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

  const handleRememberMeChange = (e) => {
    setRememberMe(e.target.checked);
  };

  // Load saved email if available
  useEffect(() => {
    const savedEmail = localStorage.getItem('authEmail');
    if (savedEmail) {
      setFormData(prev => ({ ...prev, email: savedEmail }));
      setRememberMe(true);
    }
  }, []);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Check if this is a new user
      const isNewUser = result.additionalUserInfo?.isNewUser;
      
      if (isNewUser) {
        // Save basic user info to Firestore
        await setDoc(doc(db, 'users', user.uid), {
          username: user.displayName || '',
          email: user.email || '',
          phoneNumber: user.phoneNumber || '',
          profilePicture: user.photoURL || '',
        });
      }
      
      setSuccessMessage('Successfully signed in!');
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
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

    setIsLoading(true);
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
        setSuccessMessage('Account created successfully!');
      } else {
        await signInWithEmailAndPassword(auth, formData.email, formData.password);
        setSuccessMessage('Successfully logged in!');
        
        // Handle remember me functionality
        if (rememberMe) {
          localStorage.setItem('authEmail', formData.email);
        } else {
          localStorage.removeItem('authEmail');
        }
      }
      
      // Add a small delay before closing for user to see success message
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAuthMode = () => {
    setIsSignup(!isSignup);
    setError('');
    setAcceptTerms(false);
  };

  // eslint-disable-next-line no-unused-vars
  const handleCheckboxChange = (e) => {
    setAcceptTerms(e.target.checked);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="auth-modal"
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <FocusTrap>
            <motion.div 
              className="auth-modal-content"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <button 
                className="close-button"
                onClick={onClose}
                aria-label="Close modal"
              >
                <i className="fas fa-times"></i>
              </button>

              <h2>{isSignup ? 'Create Account' : 'Welcome Back'}</h2>
              
              {error && <p className="error-message">{error}</p>}
              {successMessage && <p className="success-message">{successMessage}</p>}
              
              <div className="social-login">
                <button 
                  className="google-signin-button"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                >
                  <i className="fab fa-google"></i>
                  {isLoading ? 'Signing in...' : 'Continue with Google'}
                </button>
              </div>

              <div className="divider">
                <span>or</span>
              </div>

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
                        placeholder="Enter your username"
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
                        onChange={handleInputChange}
                        placeholder="Enter your phone number"
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
                        <option value="">Select your gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                        <option value="prefer-not-to-say">Prefer not to say</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="schoolOrWorkplace">Institution</label>
                      <input
                        type="text"
                        id="schoolOrWorkplace"
                        name="schoolOrWorkplace"
                        value={formData.schoolOrWorkplace}
                        onChange={handleInputChange}
                        placeholder="Enter your school or workplace"
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
                    placeholder="Enter your email"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>

                {isSignup && (
                  <div className="form-group checkbox-group">
                    <input
                      type="checkbox"
                      id="acceptTerms"
                      checked={acceptTerms}
                      onChange={(e) => setAcceptTerms(e.target.checked)}
                      required
                    />
                    <label htmlFor="acceptTerms">
                      I accept the terms and conditions
                    </label>
                  </div>
                )}

                <button type="submit" className="submit-button" disabled={isLoading}>
                  {isLoading ? "Loading..." : isSignup ? "Create Account" : "Sign In"}
                </button>
              </form>

              <button
                type="button"
                className="toggle-link"
                onClick={() => setIsSignup(!isSignup)}
              >
                {isSignup
                  ? "Already have an account? Sign in"
                  : "Need an account? Sign up"}
              </button>
            </motion.div>
          </FocusTrap>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AuthModal;