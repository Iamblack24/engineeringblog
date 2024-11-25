// src/components/ArticleCard.js
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaThumbsDown, FaThumbsUp } from 'react-icons/fa';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase'; // Adjust the import path as necessary
import './ArticleCard.css';

const ArticleCard = ({ article, onLike, onDislike, currentUser }) => {
  const { id, title, author, date, likes, dislikes, photo } = article;
  const [userLikeStatus, setUserLikeStatus] = useState(null); // 'like', 'dislike', or null

  useEffect(() => {
    const fetchUserLikeStatus = async () => {
      if (currentUser) {
        const likeDocRef = doc(db, 'articles', id, 'likes', currentUser.uid);
        const dislikeDocRef = doc(db, 'articles', id, 'dislikes', currentUser.uid);
        const likeDoc = await getDoc(likeDocRef);
        const dislikeDoc = await getDoc(dislikeDocRef);

        if (likeDoc.exists()) {
          setUserLikeStatus('like');
        } else if (dislikeDoc.exists()) {
          setUserLikeStatus('dislike');
        } else {
          setUserLikeStatus(null);
        }
      }
    };

    fetchUserLikeStatus();
  }, [currentUser, id, likes, dislikes]);

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
        <button
          className={`like-button ${userLikeStatus === 'like' ? 'active' : ''}`}
          onClick={() => onLike(id)}
        >
          <FaThumbsUp className="icon" /> {likes || 0}
        </button>
        <button
          className={`dislike-button ${userLikeStatus === 'dislike' ? 'active' : ''}`}
          onClick={() => onDislike(id)}
        >
          <FaThumbsDown className="icon" /> {dislikes || 0}
        </button>
      </div>
    </div>
  );
};

export default ArticleCard;