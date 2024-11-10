import React from 'react';
import './NewsletterSignup.css'; // Import the CSS file for styling

const NewsletterSignup = () => {
  return (
    <div className="newsletter-signup">
      <h2>Subscribe to Our Newsletter</h2>
      <p>Stay updated with the latest articles, case studies, and tools by subscribing to our newsletter.</p>
      <form
        action="https://formsubmit.co/ajax/johnicarus2020@gmail.com"
        method="POST"
        className="newsletter-form"
      >
        {/* Honeypot Anti-Spam Field */}
        <input type="hidden" name="_captcha" value="false" />
        <input type="text" name="_honey" style={{ display: 'none' }} />
        
        <input
          type="email"
          name="email"
          placeholder="Enter your email"
          required
        />
        <button type="submit">Subscribe</button>
      </form>
      <p className="form-note">* We respect your privacy. Unsubscribe at any time.</p>
    </div>
  );
};

export default NewsletterSignup;