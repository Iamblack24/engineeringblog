import React from 'react';
import { Link } from 'react-router-dom';
import './ArticleCard.css'; // Import the CSS file for styling

const ArticleCard = ({ id, title, author, date, likes, dislikes, photo }) => {
  return (
    <div className="article-card">
      <img src={photo} alt={title} className="article-photo" />
      <h2>
        <Link to={`/articles/${id}`}>{title}</Link>
      </h2>
      <p className="article-meta">
        <span>By {author}</span> | <span>{date}</span>
      </p>
      <div className="article-stats">
        <span role="img" aria-label="likes" onClick={() => alert('Liked!')}>👍</span> {likes} | 
        <span role="img" aria-label="dislikes" onClick={() => alert('Disliked!')}>👎</span> {dislikes}
      </div>
    </div>
  );
};

export default ArticleCard;