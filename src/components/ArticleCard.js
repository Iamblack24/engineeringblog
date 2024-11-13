// src/components/ArticleCard.js
import React from 'react';
import { Link } from 'react-router-dom';
import './ArticleCard.css';

const ArticleCard = ({ article, onLike }) => {
  const { id, title, author, date, likes, dislikes, photo } = article;

  return (
    <div className="article-card">
      {photo && <img src={photo} alt={title} className="article-photo" />}
      <h2>
        <Link to={`/articles/${id}`}>{title}</Link>
      </h2>
      <p className="article-meta">
        <span>By {author}</span> |{' '}
        <span>{new Date(date).toLocaleDateString()}</span>
      </p>
      <div className="article-stats">
        <button onClick={onLike}>
          👍 {likes || 0}
        </button>
        <span className="dislikes">
          👎 {dislikes || 0}
        </span>
      </div>
    </div>
  );
};

export default ArticleCard;