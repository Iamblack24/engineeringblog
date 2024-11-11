// src/pages/ContactPage.js
import React, { useState } from 'react';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import './ContactPage.css';

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phonenumber: '',
    subject: '',
    message: '',
  });
  const [statusMessage, setStatusMessage] = useState('');
  const [recaptchaToken, setRecaptchaToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleRecaptchaChange = (token) => {
    setRecaptchaToken(token);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!recaptchaToken) {
      setStatusMessage('Please complete the reCAPTCHA.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('https://formsubmit.co/ajax/johnicarus2020@gmail.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ ...formData, 'g-recaptcha-response': recaptchaToken }),
      });

      const result = await response.json();
      if (result.success) {
        setStatusMessage('Your message has been sent successfully!');
        setFormData({
          name: '',
          email: '',
          phonenumber: '',
          subject: '',
          message: '',
        });
      } else {
        setStatusMessage('There was an issue submitting the form. Please try again.');
      }
    } catch (error) {
      console.error('Error:', error);
      setStatusMessage('There was an issue submitting the form. Please try again.');
    }

    setIsLoading(false);
  };

  return (
    <div className="contact-page">
      <h1>Contact Us</h1>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Name<span>*</span>:</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="phonenumber">Phone Number:</label>
          <input
            type="tel"
            id="phonenumber"
            name="phonenumber"
            value={formData.phonenumber}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="email">Email<span>*</span>:</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="subject">Subject:</label>
          <input
            type="text"
            id="subject"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="message">Message<span>*</span>:</label>
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            required
          ></textarea>
        </div>
        <HCaptcha
          sitekey="8fe8093c-a358-4f64-aecc-be30a1da8298" // Replace with your hCaptcha site key
          onVerify={handleRecaptchaChange}
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Sending...' : 'Send'}
        </button>
      </form>
      {statusMessage && <p className="status-message">{statusMessage}</p>}
    </div>
  );
};

export default ContactPage;