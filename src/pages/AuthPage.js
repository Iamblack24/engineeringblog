import React, { useState, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import './AuthPage.css';

const provider = new GoogleAuthProvider();

const initialForm = {
  username: '',
  email: '',
  password: '',
  phoneNumber: '',
  gender: '',
  schoolOrWorkplace: '',
};

const patterns = {
  username: /^[a-zA-Z0-9_-]{3,20}$/,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^[0-9]{10}$/,
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
};

const AuthPage = () => {
  const [isSignup, setIsSignup] = useState(false);
  const [formData, setFormData] = useState(initialForm);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const savedEmail = localStorage.getItem('authEmail');
    if (savedEmail) {
      setFormData((prev) => ({ ...prev, email: savedEmail }));
      setRememberMe(true);
    }
  }, []);

  const validate = () => {
    if (isSignup) {
      if (!patterns.username.test(formData.username)) return 'Username must be 3-20 characters, letters/numbers/_/-.';
      if (!patterns.email.test(formData.email)) return 'Invalid email.';
      if (!patterns.password.test(formData.password)) return 'Password must be 8+ chars, upper/lower/number/special.';
      if (!patterns.phone.test(formData.phoneNumber)) return 'Phone must be 10 digits.';
      if (!formData.gender) return 'Select gender.';
      if (!formData.schoolOrWorkplace) return 'Enter school or workplace.';
      if (!acceptTerms) return 'You must accept the terms.';
    } else {
      if (!patterns.email.test(formData.email)) return 'Invalid email.';
      if (!formData.password) return 'Password required.';
    }
    return '';
  };

  const handleInputChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    setError('');
  };

  const handleRememberMeChange = (e) => {
    setRememberMe(e.target.checked);
    if (!e.target.checked) {
      localStorage.removeItem('authEmail');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setIsLoading(true);
    try {
      if (isSignup) {
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        const user = userCredential.user;
        // Save extra info to Firestore
        await setDoc(doc(db, 'users', user.uid), {
          username: formData.username,
          email: formData.email,
          phoneNumber: formData.phoneNumber,
          gender: formData.gender,
          schoolOrWorkplace: formData.schoolOrWorkplace,
        });
        setSuccessMessage('Account created! You can now sign in.');
        setIsSignup(false);
        setFormData(initialForm);
      } else {
        await signInWithEmailAndPassword(auth, formData.email, formData.password);
        if (rememberMe) {
          localStorage.setItem('authEmail', formData.email);
        }
        navigate('/');
      }
    } catch (err) {
      setError(err.message.replace('Firebase:', '').trim());
    }
    setIsLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setIsLoading(true);
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const isNewUser = result.additionalUserInfo?.isNewUser;
      if (isNewUser) {
        await setDoc(doc(db, 'users', user.uid), {
          username: user.displayName || '',
          email: user.email || '',
          phoneNumber: user.phoneNumber || '',
          gender: '',
          schoolOrWorkplace: '',
        });
      }
      navigate('/');
    } catch (err) {
      setError('Google sign-in failed.');
    }
    setIsLoading(false);
  };

  const handleForgotPassword = async () => {
    if (!patterns.email.test(formData.email)) {
      setError('Enter a valid email to reset password.');
      return;
    }
    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, formData.email);
      setSuccessMessage('Password reset email sent.');
    } catch (err) {
      setError('Failed to send reset email.');
    }
    setIsLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>{isSignup ? 'Create Account' : 'Sign In'}</h2>
        {error && <div className="error-message">{error}</div>}
        {successMessage && <div className="success-message">{successMessage}</div>}
        <div className="social-login">
          <button className="google-signin-button" onClick={handleGoogleSignIn} disabled={isLoading}>
            <i className="fab fa-google"></i> Sign in with Google
          </button>
        </div>
        <div className="divider"><span>or</span></div>
        <form onSubmit={handleSubmit} autoComplete="off">
          {isSignup && (
            <>
              <div className="form-group">
                <label htmlFor="username">Username</label>
                <input name="username" value={formData.username} onChange={handleInputChange} required />
              </div>
              <div className="form-group">
                <label htmlFor="phoneNumber">Phone Number</label>
                <input name="phoneNumber" value={formData.phoneNumber} onChange={handleInputChange} required />
              </div>
              <div className="form-group">
                <label htmlFor="gender">Gender</label>
                <select name="gender" value={formData.gender} onChange={handleInputChange} required>
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer-not-to-say">Prefer not to say</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="schoolOrWorkplace">School/Workplace</label>
                <input name="schoolOrWorkplace" value={formData.schoolOrWorkplace} onChange={handleInputChange} required />
              </div>
            </>
          )}
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              autoFocus // Add this for better UX
              placeholder="you@email.com"
            />
          </div>
          <div className="form-group password-group">
            <label htmlFor="password">Password</label>
            <input
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleInputChange}
              required
              autoComplete="new-password"
            />
            <button
              type="button"
              className="toggle-password"
              onClick={() => setShowPassword((v) => !v)}
              tabIndex={-1}
              aria-label="Toggle password visibility"
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>
          {isSignup && (
            <div className="checkbox-group">
              <input
                type="checkbox"
                id="acceptTerms"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                required
              />
              <label htmlFor="acceptTerms">
                I accept the <a href="/terms-of-service" target="_blank" rel="noopener noreferrer">terms</a>
              </label>
            </div>
          )}
          {!isSignup && (
            <div className="form-options">
              <div className="checkbox-group">
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={handleRememberMeChange}
                />
                <label htmlFor="rememberMe">Remember me</label>
              </div>
              <button type="button" className="forgot-password-link" onClick={handleForgotPassword}>
                Forgot password?
              </button>
            </div>
          )}
          <button className="submit-button" type="submit" disabled={isLoading}>
            {isLoading ? 'Loading...' : isSignup ? 'Create Account' : 'Sign In'}
          </button>
        </form>
        <div className="toggle-link">
          {isSignup ? (
            <>
              Already have an account?{' '}
              <button type="button" onClick={() => setIsSignup(false)}>
                Sign In
              </button>
            </>
          ) : (
            <>
              New here?{' '}
              <button type="button" onClick={() => setIsSignup(true)}>
                Create Account
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;