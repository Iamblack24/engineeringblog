// src/components/AuthModal.js
import React, { useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
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
  const [error, setError] = useState('');

  const toggleAuthMode = () => {
    setIsSignup(!isSignup);
    setFormData({
      username: '',
      email: '',
      password: '',
      phoneNumber: '',
      gender: '',
      schoolOrWorkplace: '',
    });
    setError('');
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    const { username, email, password, phoneNumber, gender, schoolOrWorkplace } = formData;

    if (!username || !email || !password || !phoneNumber || !gender || !schoolOrWorkplace) {
      setError('Please fill in all fields.');
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Save additional user info to Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        username,
        email,
        phoneNumber,
        gender,
        schoolOrWorkplace,
      });

      alert('Signup successful! Closing the overlay...');
      setTimeout(onClose, 2000); // Close the overlay after 2 seconds
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    const { email, password } = formData;

    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      onClose();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleForgotPassword = async () => {
    const { email } = formData;
    if (!email) {
      setError('Please enter your email address to reset your password.');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      alert('Password reset email sent! Please check your inbox.');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-modal">
      <div className="modal-scroll">
        <div className="modal-content">
          <button className="close-button" onClick={onClose}>
            &times;
          </button>
          {isSignup ? (
            <form onSubmit={handleSignup}>
              <h2>Sign Up</h2>
              {error && <p className="error">{error}</p>}
              <input
                type="text"
                name="username"
                placeholder="Username"
                value={formData.username}
                onChange={handleChange}
              />
              <input
                type="email"
                name="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={handleChange}
              />
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
              />
              <input
                type="tel"
                name="phoneNumber"
                placeholder="Phone Number"
                value={formData.phoneNumber}
                onChange={handleChange}
              />
              <select name="gender" value={formData.gender} onChange={handleChange}>
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
              <input
                type="text"
                name="schoolOrWorkplace"
                placeholder="School or Workplace"
                value={formData.schoolOrWorkplace}
                onChange={handleChange}
              />
              <button type="submit">Sign Up</button>
              <p>
                Already have an account?{' '}
                <span className="toggle-link" onClick={toggleAuthMode}>
                  Login
                </span>
              </p>
            </form>
          ) : (
            <form onSubmit={handleLogin}>
              <h2>Login</h2>
              {error && <p className="error">{error}</p>}
              <input
                type="email"
                name="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={handleChange}
              />
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
              />
              <button type="submit">Login</button>
              <p>
                <span className="forgot-password-link" onClick={handleForgotPassword}>
                  Forgot Password?
                </span>
              </p>
              <p>
                Don't have an account?{' '}
                <span className="toggle-link" onClick={toggleAuthMode}>
                  Sign Up
                </span>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;