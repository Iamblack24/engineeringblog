import React, { useState, useRef } from 'react';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import { MdPerson, MdEmail, MdPhone, MdSubject, MdMessage, MdSend, MdLocationOn } from 'react-icons/md';
import './ContactPage.css';

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phonenumber: '',
    subject: '',
    message: '',
  });
  const [errors, setErrors] = useState({});
  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState(''); // 'success' or 'error'
  const [recaptchaToken, setRecaptchaToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const captchaRef = useRef(null);

  const validateForm = () => {
    const newErrors = {};
    
    // Validate name
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    // Validate email with regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    // Validate phone (if entered)
    if (formData.phonenumber.trim()) {
      const phoneRegex = /^\+?[0-9\s\-]{8,20}$/;
      if (!phoneRegex.test(formData.phonenumber)) {
        newErrors.phonenumber = 'Please enter a valid phone number';
      }
    }
    
    // Validate subject
    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    }
    
    // Validate message
    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: '',
      });
    }
  };

  const handleRecaptchaChange = (token) => {
    setRecaptchaToken(token);
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    
    if (name === 'email' && value.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        setErrors({
          ...errors,
          [name]: 'Please enter a valid email address',
        });
      }
    }
    
    if (name === 'phonenumber' && value.trim()) {
      const phoneRegex = /^\+?[0-9\s\-]{8,20}$/;
      if (!phoneRegex.test(value)) {
        setErrors({
          ...errors,
          [name]: 'Please enter a valid phone number',
        });
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Reset status
    setStatusMessage('');
    
    // Validate form
    if (!validateForm()) {
      setStatusType('error');
      setStatusMessage('Please fix the errors before submitting.');
      return;
    }

    if (!recaptchaToken) {
      setStatusType('error');
      setStatusMessage('Please complete the reCAPTCHA.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('https://formsubmit.co/ajax/otienojohnmicheal2@gmail.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ ...formData, 'g-recaptcha-response': recaptchaToken }),
      });

      const result = await response.json();
      if (result.success) {
        setStatusType('success');
        setStatusMessage('Your message has been sent successfully! We\'ll get back to you soon.');
        setFormData({
          name: '',
          email: '',
          phonenumber: '',
          subject: '',
          message: '',
        });
        // Reset captcha
        if (captchaRef.current) {
          captchaRef.current.resetCaptcha();
        }
      } else {
        setStatusType('error');
        setStatusMessage('There was an issue submitting the form. Please try again.');
      }
    } catch (error) {
      console.error('Error:', error);
      setStatusType('error');
      setStatusMessage('Network error. Please check your connection and try again.');
    }

    setIsLoading(false);
  };

  return (
    <div className="contact-page">
      <div className="contact-container">
        <div className="contact-info">
          <h2>Get In Touch</h2>
          <p>Have a question or want to work together? Send us a message and we'll get back to you as soon as possible.</p>
          
          <div className="contact-methods">
            <div className="contact-method">
              <MdEmail className="contact-icon" />
              <div>
                <h3>Email</h3>
                <p><a href="mailto:engineeringhub24@gmail.com">engineeringhub24@gmail.com</a></p>
              </div>
            </div>
            
            <div className="contact-method">
              <MdPhone className="contact-icon" />
              <div>
                <h3>Phone</h3>
                <p><a href="tel:+254799129637">+254799129637</a></p>
              </div>
            </div>
            
            <div className="contact-method">
              <MdLocationOn className="contact-icon" />
              <div>
                <h3>Location</h3>
                <p>Tassia, Embakasi, Nairobi</p>
              </div>
            </div>
          </div>
          
          <div className="social-links">
            <button 
              type="button" 
              className="social-link"
              onClick={() => window.open('https://linkedin.com', '_blank')}
            >
              LinkedIn
            </button>
            <button 
              type="button" 
              className="social-link"
              onClick={() => window.open('https://twitter.com', '_blank')}
            >
              Twitter
            </button>
            <button 
              type="button" 
              className="social-link"
              onClick={() => window.open('https://github.com', '_blank')}
            >
              GitHub
            </button>
          </div>
        </div>
        
        <div className="contact-form-container">
          <h2>Send Us A Message</h2>
          {statusMessage && (
            <div className={`status-message ${statusType}`}>
              {statusMessage}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="contact-form">
            <div className={`form-group ${errors.name ? 'has-error' : ''}`}>
              <label htmlFor="name">
                <MdPerson className="input-icon" />
                <span>Name</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Your name"
              />
              {errors.name && <div className="error-message">{errors.name}</div>}
            </div>
            
            <div className={`form-group ${errors.email ? 'has-error' : ''}`}>
              <label htmlFor="email">
                <MdEmail className="input-icon" />
                <span>Email</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="your.email@example.com"
              />
              {errors.email && <div className="error-message">{errors.email}</div>}
            </div>
            
            <div className={`form-group ${errors.phonenumber ? 'has-error' : ''}`}>
              <label htmlFor="phonenumber">
                <MdPhone className="input-icon" />
                <span>Phone Number <small>(optional)</small></span>
              </label>
              <input
                type="tel"
                id="phonenumber"
                name="phonenumber"
                value={formData.phonenumber}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="+2547000000"
              />
              {errors.phonenumber && <div className="error-message">{errors.phonenumber}</div>}
            </div>
            
            <div className={`form-group ${errors.subject ? 'has-error' : ''}`}>
              <label htmlFor="subject">
                <MdSubject className="input-icon" />
                <span>Subject</span>
              </label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="What's this about?"
              />
              {errors.subject && <div className="error-message">{errors.subject}</div>}
            </div>
            
            <div className={`form-group ${errors.message ? 'has-error' : ''}`}>
              <label htmlFor="message">
                <MdMessage className="input-icon" />
                <span>Message</span>
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Your message here..."
                rows="5"
              ></textarea>
              {errors.message && <div className="error-message">{errors.message}</div>}
            </div>
            
            <div className="captcha-container">
              <HCaptcha
                sitekey="8fe8093c-a358-4f64-aecc-be30a1da8298"
                onVerify={handleRecaptchaChange}
                ref={captchaRef}
              />
            </div>
            
            <button 
              type="submit" 
              disabled={isLoading} 
              className={isLoading ? 'loading' : ''}
            >
              {isLoading ? (
                <span>Sending<span className="loading-dots"><span>.</span><span>.</span><span>.</span></span></span>
              ) : (
                <>
                  <MdSend className="button-icon" />
                  <span>Send Message</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;