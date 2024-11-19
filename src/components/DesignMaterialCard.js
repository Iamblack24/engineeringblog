// src/components/DesignMaterialCard.js
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import StripeSetup from '../StripeSetup';
import CheckoutForm from './CheckoutForm';
import './DesignMaterialCard.css';

const DesignMaterialCard = ({ material, onInteraction }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showCheckout, setShowCheckout] = useState(false);

  const prevSlide = useCallback(() => {
    setCurrentImageIndex((prevIndex) => (prevIndex === 0 ? material.images.length - 1 : prevIndex - 1));
  }, [material.images.length]);

  const nextSlide = useCallback(() => {
    setCurrentImageIndex((prevIndex) => (prevIndex === material.images.length - 1 ? 0 : prevIndex + 1));
  }, [material.images.length]);

  useEffect(() => {
    const interval = setInterval(nextSlide, 3000); // Change slide every 3 seconds
    return () => clearInterval(interval); // Cleanup interval on component unmount
  }, [nextSlide]);

  const handlePurchaseClick = () => {
    onInteraction();
    setShowCheckout(true);
  };

  return (
    <div className="material-card">
      <div className="carousel">
        <button className="prev-button" onClick={prevSlide}>
          &#10094;
        </button>
        <div
          className="carousel-image"
          style={{ backgroundImage: `url(${material.images[currentImageIndex]})` }}
        ></div>
        <button className="next-button" onClick={nextSlide}>
          &#10095;
        </button>
      </div>
      <div className="material-info">
        <h2>{material.title}</h2>
        <p><strong>Author:</strong> {material.author}</p>
        <p><strong>Specialists:</strong> {material.specialists.join(', ')}</p>
        <p><strong>Price:</strong> {material.price}</p>
        <p>{material.description}</p>
        <div className="material-actions">
        <button className="purchase-button" onClick={handlePurchaseClick}>Purchase</button>
          <Link to={material.contactLink} className="contact-button" onClick={onInteraction}>Contact Us</Link>
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