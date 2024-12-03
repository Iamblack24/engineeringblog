// src/pages/ArticlesPage.js
import React, { useEffect, useState, useContext } from 'react';
import { collection, onSnapshot, doc, getDoc, setDoc, updateDoc, deleteDoc, increment } from 'firebase/firestore';
import { db } from '../firebase';
import { AuthContext } from '../contexts/AuthContext';
import ArticleCard from '../components/ArticleCard';
import Loader from '../components/Loader';
import './ArticlesPage.css';

const ArticlesPage = () => {
  const { currentUser } = useContext(AuthContext);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'articles'), (snapshot) => {
      const articlesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setArticles(articlesData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLike = async (articleId) => {
    if (!currentUser) {
      alert('You need to be logged in to like an article.');
      return;
    }

    const likeDocRef = doc(db, 'articles', articleId, 'likes', currentUser.uid);
    const dislikeDocRef = doc(db, 'articles', articleId, 'dislikes', currentUser.uid);
    const articleDocRef = doc(db, 'articles', articleId);

    try {
      const likeDoc = await getDoc(likeDocRef);
      const dislikeDoc = await getDoc(dislikeDocRef);

      if (likeDoc.exists()) {
        // If already liked, remove the like
        await deleteDoc(likeDocRef);
        await updateDoc(articleDocRef, { likes: increment(-1) });
      } else {
        // If not liked, add the like
        await setDoc(likeDocRef, { likedAt: new Date() });
        await updateDoc(articleDocRef, { likes: increment(1) });

        // If previously disliked, remove the dislike
        if (dislikeDoc.exists()) {
          await deleteDoc(dislikeDocRef);
          await updateDoc(articleDocRef, { dislikes: increment(-1) });
        }
      }

      // No need to update local state as onSnapshot will handle real-time updates
    } catch (error) {
      console.error('Error handling like:', error);
      alert('There was an error processing your like. Please try again.');
    }
  };

  const handleDislike = async (articleId) => {
    if (!currentUser) {
      alert('You need to be logged in to dislike an article.');
      return;
    }

    const dislikeDocRef = doc(db, 'articles', articleId, 'dislikes', currentUser.uid);
    const likeDocRef = doc(db, 'articles', articleId, 'likes', currentUser.uid);
    const articleDocRef = doc(db, 'articles', articleId);

    try {
      const dislikeDoc = await getDoc(dislikeDocRef);
      const likeDoc = await getDoc(likeDocRef);

      if (dislikeDoc.exists()) {
        // If already disliked, remove the dislike
        await deleteDoc(dislikeDocRef);
        await updateDoc(articleDocRef, { dislikes: increment(-1) });
      } else {
        // If not disliked, add the dislike
        await setDoc(dislikeDocRef, { dislikedAt: new Date() });
        await updateDoc(articleDocRef, { dislikes: increment(1) });

        // If previously liked, remove the like
        if (likeDoc.exists()) {
          await deleteDoc(likeDocRef);
          await updateDoc(articleDocRef, { likes: increment(-1) });
        }
      }

      // No need to update local state as onSnapshot will handle real-time updates
    } catch (error) {
      console.error('Error handling dislike:', error);
      alert('There was an error processing your dislike. Please try again.');
    }
  };

  return (
    <div className="articles-page">
      {loading ? (
        <Loader />
      ) : (
        <div className="articles-list">
          {articles.map(article => (
            <ArticleCard
              key={article.id}
              article={article}
              onLike={handleLike}
              onDislike={handleDislike}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ArticlesPage;