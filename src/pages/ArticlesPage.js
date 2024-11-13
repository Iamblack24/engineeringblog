// src/pages/ArticlesPage.js
import React, { useState, useEffect, useContext } from 'react';
import ArticleCard from '../components/ArticleCard';
import { AuthContext } from '../contexts/AuthContext';
import { db } from '../firebase';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  collection,
  onSnapshot,
} from 'firebase/firestore';
import './ArticlesPage.css';

const ArticlesPage = () => {
  const { currentUser } = useContext(AuthContext);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch articles from Firestore and listen for real-time updates
    const articlesRef = collection(db, 'articles');
    const unsubscribe = onSnapshot(
      articlesRef,
      (snapshot) => {
        const articlesData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setArticles(articlesData);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching articles:', error);
        setLoading(false);
      }
    );

    // Clean up the listener on unmount
    return () => unsubscribe();
  }, []);

  const handleLike = async (articleId) => {
    if (!currentUser) {
      alert('You need to be logged in to like an article.');
      return;
    }

    try {
      const likeDocRef = doc(
        db,
        'articles',
        articleId,
        'likes',
        currentUser.uid
      );
      const likeDoc = await getDoc(likeDocRef);
      const articleDocRef = doc(db, 'articles', articleId);

      if (!likeDoc.exists()) {
        await setDoc(likeDocRef, { likedAt: new Date() });
        await updateDoc(articleDocRef, { likes: increment(1) });
        // No need to update local state as onSnapshot will update articles
      } else {
        alert('You have already liked this article.');
      }
    } catch (error) {
      console.error('Error liking article:', error);
    }
  };

  if (loading) {
    return <p>Loading articles...</p>;
  }

  return (
    <div className="articles-page">
      <h1>Articles</h1>
      <div className="articles-list">
        {articles.length > 0 ? (
          articles.map((article) => (
            <ArticleCard
              key={article.id}
              article={article}
              onLike={() => handleLike(article.id)}
            />
          ))
        ) : (
          <p>No articles available.</p>
        )}
      </div>
    </div>
  );
};

export default ArticlesPage;