// src/components/ArticleCard.js
import React from 'react';
import { Link } from 'react-router-dom';
import { FaThumbsDown, FaThumbsUp } from 'react-icons/fa';
import './ArticleCard.css';

const ArticleCard = ({ article, onLike, onDislike }) => {
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
        <button className="like-button" onClick={() => onLike(id, 'like')}>
          <FaThumbsUp className='icon' /> {likes || 0}
        </button>
        <button className="dislike-button" onClick={onDislike}>
          <FaThumbsDown className="icon" /> {dislikes || 0}
        </button>
      </div>
    </div>
  );
};

export default ArticleCard;