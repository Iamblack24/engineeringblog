import React, { useState} from 'react';
import { Link } from 'react-router-dom';
import './DesignMaterialCard.css';

const DesignMaterialCard = ({ material }) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const totalImages = material.images.length;
  
    const nextSlide = () => {
      setCurrentImageIndex((currentImageIndex + 1) % totalImages);
    };
  
    const prevSlide = () => {
      setCurrentImageIndex(
        (currentImageIndex - 1 + totalImages) % totalImages
      );
    };
  
    return (
      <div className="design-material-card">
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
        <p><strong>Price:</strong> {material.price}</p>
        <p>{material.description}</p>
        <div className="material-actions">
          <a href={material.purchaseLink} className="purchase-button">Purchase</a>
          <Link to={material.contactLink} className="contact-button">Contact Us</Link>
        </div>
      </div>
    </div>
  );
};

export default DesignMaterialCard;