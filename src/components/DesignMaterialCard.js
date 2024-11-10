// src/components/DesignMaterialCard.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import StripeSetup from '../StripeSetup';
import CheckoutForm from './CheckoutForm';
import './DesignMaterialCard.css';

const DesignMaterialCard = ({ material }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showCheckout, setShowCheckout] = useState(false);

  const prevSlide = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex === 0 ? material.images.length - 1 : prevIndex - 1));
  };

  const nextSlide = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex === material.images.length - 1 ? 0 : prevIndex + 1));
  };

  return (
    <div className="material-card">
      <div className="carousel">
        <div
          className="carousel-image"
          style={{ backgroundImage: `url(${material.images[currentImageIndex]})` }}
        ></div>
        <button className="prev-button" onClick={prevSlide}>
          &#10094;
        </button>
        <button className="next-button" onClick={nextSlide}>
          &#10095;
        </button>
      </div>
      <div className="material-info">
        <h2>{material.title}</h2>
        <p><strong>Author:</strong> {material.author}</p>
        <p><strong>Specialists:</strong> {material.specialists.join(', ')}</p>
        <p><strong>Price:</strong> ${material.price}</p>
        <p>{material.description}</p>
        <div className="material-actions">
          <button className="purchase-button" onClick={() => setShowCheckout(true)}>Purchase</button>
          <Link to={material.contactLink} className="contact-button">Contact Us</Link>
        </div>
        {showCheckout && (
          <StripeSetup>
            <CheckoutForm material={material} />
          </StripeSetup>
        )}
      </div>
    </div>
  );
};

export default DesignMaterialCard;