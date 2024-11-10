// src/components/CheckoutForm.js
import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import axios from 'axios';

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
      const response = await axios.post('/api/payment', {
        amount: material.price * 100, // Stripe expects the amount in cents
        id,
      });

      if (response.data.success) {
        setSucceeded(true);
        setError(null);
      } else {
        setError('Payment failed');
      }
    } catch (error) {
      setError('Payment failed');
    }

    setProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardElement />
      <button type="submit" disabled={!stripe || processing || succeeded}>
        {processing ? 'Processing...' : 'Pay'}
      </button>
      {error && <div className="card-error" role="alert">{error}</div>}
      {succeeded && <div className="card-success" role="alert">Payment succeeded!</div>}
    </form>
  );
};

export default CheckoutForm;