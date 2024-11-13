// src/pages/SingleArticle.js
import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { db } from '../firebase';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
} from 'firebase/firestore';
import './SingleArticle.css';

const articlesData = [
  {
    id: '1',
    title: 'Understanding Structural Engineering',
    author: 'John Doe',
    date: '2023-01-15',
    content: `
      Structural engineering is a sub-discipline of civil engineering in which structural engineers are trained to design the 'bones and muscles' that create the form and shape of man-made structures. Structural engineers need to understand and calculate the stability, strength, rigidity, and earthquake-susceptibility of built structures for buildings and nonbuilding structures. The structural designs are integrated with those of other designers such as architects and building services engineer and often supervise the construction of projects by contractors on site.

      Structural engineering theory is based upon applied physical laws and empirical knowledge of the structural performance of different materials and geometries. Structural engineering design utilizes a number of relatively simple structural elements to build complex structural systems.
    `,
    likes: 120,
    dislikes: 5,
  },
  {
    id: '2',
    title: 'Sustainable Construction Practices',
    author: 'Jane Smith',
    date: '2023-02-10',
    content: `
      Sustainable construction is about using renewable and recyclable materials when building new structures, as well as reducing energy consumption and waste. It involves creating structures that are environmentally responsible and resource-efficient throughout a building's life-cycle.

      This requires close cooperation of the design team, the architects, the engineers, and the client at all project stages. The goal is to reduce the overall environmental impact of the building.
    `,
    likes: 98,
    dislikes: 2,
  },
  // Add more articles as needed
];

const SingleArticle = () => {
  const { id } = useParams();
  const { currentUser } = useContext(AuthContext);
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const articleDocRef = doc(db, 'articles', id);
        const articleDoc = await getDoc(articleDocRef);

        if (articleDoc.exists()) {
          setArticle({ id: articleDoc.id, ...articleDoc.data() });
        } else {
          // Find the article in the local articlesData array
          const defaultArticle = articlesData.find(
            (article) => article.id === id
          );

          if (defaultArticle) {
            // Create the article in Firestore
            await setDoc(articleDocRef, defaultArticle);
            setArticle({ id, ...defaultArticle });
          } else {
            // Article not found
            setArticle(null);
          }
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching article:', error);
        setLoading(false);
      }
    };

    fetchArticle();
  }, [id]);

  const handleLike = async () => {
    if (!currentUser) {
      alert('You need to be logged in to like an article.');
      return;
    }

    try {
      const likeDocRef = doc(
        db,
        'articles',
        id,
        'likes',
        currentUser.uid
      );
      const likeDoc = await getDoc(likeDocRef);
      const articleDocRef = doc(db, 'articles', id);

      if (!likeDoc.exists()) {
        await setDoc(likeDocRef, { likedAt: new Date() });
        await updateDoc(articleDocRef, { likes: increment(1) });
        // Update local state
        setArticle((prevArticle) => ({
          ...prevArticle,
          likes: (prevArticle.likes || 0) + 1,
        }));
      } else {
        alert('You have already liked this article.');
      }
    } catch (error) {
      console.error('Error liking article:', error);
    }
  };

  if (loading) {
    return <p>Loading article...</p>;
  }

  if (!article) {
    return <p>Article not found.</p>;
  }

  return (
    <div className="single-article">
      <h1>{article.title}</h1>
      <p className="article-meta">
        By {article.author} on{' '}
        {new Date(article.date).toLocaleDateString()}
      </p>
      <div className="article-actions">
        <button onClick={handleLike}>
          Like ({article.likes || 0})
        </button>
      </div>
      <div
        className="article-content"
        dangerouslySetInnerHTML={{ __html: article.content }}
      ></div>
    </div>
  );
};

export default SingleArticle;