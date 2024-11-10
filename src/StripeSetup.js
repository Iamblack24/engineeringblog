// src/StripeSetup.js
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe('your-publishable-key-here');

const StripeSetup = ({ children }) => {
  return <Elements stripe={stripePromise}>{children}</Elements>;
};

export default StripeSetup;