// src/components/CheckoutForm.js
import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import axios from 'axios';
import './CheckoutForm.css'; // Import the CSS file

const CheckoutForm = ({ material }) => {
  const stripe = useStripe();  
  const elements = useElements();
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [succeeded, setSucceeded] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setProcessing(true);

    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: elements.getElement(CardElement),
    });

    if (error) {
      setError(error.message);
      setProcessing(false);
      return;
    }

    const { id } = paymentMethod;

    try {
      console.log('Sending payment request to backend...');
      const response = await axios.post('https://enginehub.onrender.com/api/payment', {
        amount: Number(material.price.replace(/[^0-9.-]+/g,"")) * 100, // Convert price to number
        id,
      });

      console.log('Received response from backend:', response.data);

      if (response.data.success) {
        setSucceeded(true);
        setError(null);
      } else {
        setError('Payment failed');
      }
    } catch (error) {
      console.error('Error during payment request:', error);
      setError('Payment failed: ' + error.message); // Display detailed error message
    }

    setProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardElement />
      <button type="submit" disabled={!stripe || processing || succeeded}>
        {processing ? 'Processing...' : 'Pay'}
      </button>
      {error && <div className="card-error" role="alert" style={{ color: 'red', marginTop: '10px' }}>{error}</div>}
      {succeeded && <div className="card-success" role="alert" style={{ color: 'green', marginTop: '10px' }}>Payment succeeded!</div>}
    </form>
  );
};

export default CheckoutForm;