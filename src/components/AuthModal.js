// src/components/AuthModal.js
import React, { useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth, db } from '../firebase'; // Import auth and db
import { doc, setDoc } from 'firebase/firestore';
import './AuthModal.css';

const AuthModal = ({ onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setFormData({ name: '', email: '', password: '' });
    setError('');
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (isLogin) {
      // **Login**
      try {
        await signInWithEmailAndPassword(auth, formData.email, formData.password);
        onClose();
      } catch (err) {
        setError(err.message);
      }
    } else {
      // **Signup**
      try {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          formData.email,
          formData.password
        );
        const user = userCredential.user;
        await setDoc(doc(db, 'users', user.uid), {
          name: formData.name,
          email: formData.email,
        });
        onClose();
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handlePasswordReset = async () => {
    if (!formData.email) {
      setError('Please enter your email to reset the password.');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, formData.email);
      setError('Password reset email sent.');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-modal">
      <div className="auth-modal-content">
        <button className="close-button" onClick={onClose}>
          ×
        </button>
        <div className="tabs">
          <button onClick={toggleMode} className={isLogin ? 'active' : ''}>
            Login
          </button>
          <button onClick={toggleMode} className={!isLogin ? 'active' : ''}>
            Signup
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <input
              type="text"
              name="name"
              placeholder="Name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          )}
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password (6+ characters)"
            value={formData.password}
            onChange={handleChange}
            required
          />
          {error && <p className="error-message">{error}</p>}
          <button type="submit">{isLogin ? 'Login' : 'Signup'}</button>
          {isLogin && (
            <p className="forgot-password" onClick={handlePasswordReset}>
              Forgot Password?
            </p>
          )}
        </form>
      </div>
    </div>
  );
};

export default AuthModal;