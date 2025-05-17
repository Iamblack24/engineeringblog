import React, { useState } from 'react';
import './NewsletterSignup.css'; // Import the CSS file for styling

const NewsletterSignup = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // 'idle', 'loading', 'success', 'error'
  const [message, setMessage] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus('loading');
    setMessage('');

    const formData = new FormData(event.target);

    try {
      const response = await fetch(event.target.action, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        // const data = await response.json(); // formsubmit.co/ajax might not return JSON consistently for success
        setStatus('success');
        setMessage('Thanks for subscribing! Now let us bore you with our content.');
        setEmail(''); // Clear the input field on success
      } else {
        // const errorData = await response.json(); // Attempt to get error message if any
        setStatus('error');
        // setMessage(errorData.message || 'Oops! Something went wrong. Please try again.');
        setMessage('Oops! Something went wrong. Please try again.');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Network error. Please try again.');
    }
  };

  return (
    <div className="newsletter-signup">
      <h2>Subscribe to Our Newsletter</h2>
      <p>Stay updated with the latest articles, case studies, and tools by subscribing to our newsletter.</p>
      <form
        action="https://formsubmit.co/ajax/engineeringhub24@gmail.com" // Replace with your actual FormSubmit.co email
        method="POST"
        className="newsletter-form"
        onSubmit={handleSubmit}
      >
        {/* Honeypot Anti-Spam Field */}
        <input type="hidden" name="_captcha" value="false" />
        <input type="text" name="_honey" style={{ display: 'none' }} />
        
        {/* Optional: Subject for the email you receive */}
        {/* <input type="hidden" name="_subject" value="New Newsletter Subscription!" /> */}
        
        {/* Optional: Auto-response email to the subscriber */}
        {/* <input type="hidden" name="_autoresponse" value="Thanks for subscribing to our newsletter!" /> */}

        <input
          type="email"
          name="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={status === 'loading'}
        />
        <button type="submit" disabled={status === 'loading'}>
          {status === 'loading' ? 'Subscribing...' : 'Subscribe'}
        </button>
      </form>
      {message && (
        <p className={`form-message ${status === 'success' ? 'success' : status === 'error' ? 'error' : ''}`}>
          {message}
        </p>
      )}
      <p className="form-note">* We respect your privacy. Unsubscribe at any time.</p>
    </div>
  );
};

export default NewsletterSignup;