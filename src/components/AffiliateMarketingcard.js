import React from 'react';
import './AffiliateMarketingCard.css';

const AffiliateMarketingCard = ({ marketing }) => {
  return (
    <div className="affiliate-marketing-card">
      <h2>{marketing.title}</h2>
      <p>{marketing.description}</p>
      <div className="images">
        {marketing.images.map((image, index) => (
          <img key={index} src={image} alt={`${marketing.title} ${index + 1}`} />
        ))}
      </div>
      <p className="price">{marketing.price}</p>
      <a href={marketing.link} className="affiliate-link">Learn More</a>
    </div>
  );
};

export default AffiliateMarketingCard;