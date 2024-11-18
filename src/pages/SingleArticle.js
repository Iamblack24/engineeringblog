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
import { Document, Page, pdfjs } from 'react-pdf/dist/esm/entry.webpack';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css'; // Import TextLayer CSS

// Set worker source for pdfjs
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const articlesData = [
  {
    id: '1',
    title: 'Understanding Structural Engineering',
    author: 'John Doe',
    date: '2023-01-15',
    content: '/hello.pdf', // Path to PDF in the public folder
    likes: 120,
    dislikes: 5,
    photo: 'https://example.com/image1.jpg', // Optional
  },
  {
    id: '2',
    title: 'Advanced Architectural Designs',
    author: 'Jane Smith',
    date: '2023-02-10',
    content: '/hello.pdf', // Path to PDF in the public folder
    likes: 98,
    dislikes: 2,
    photo: 'https://example.com/image2.jpg', // Optional
  },
  // Add more articles as needed
];

const SingleArticle = () => {
  const { id } = useParams();
  const { currentUser } = useContext(AuthContext);
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [numPages, setNumPages] = useState(null);

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

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  const handleLike = async () => {
    if (!currentUser) {
      alert('You need to be logged in to like an article.');
      return;
    }

    try {
      const likeDocRef = doc(db, 'articles', id, 'likes', currentUser.uid);
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
        console.log(`Article ${id} liked by user ${currentUser.uid}`);
      } else {
        alert('You have already liked this article.');
        console.log(`Article ${id} already liked by user ${currentUser.uid}`);
      }
    } catch (error) {
      console.error('Error liking article:', error);
    }
  };

  const handleDislike = async () => {
    if (!currentUser) {
      alert('You need to be logged in to dislike an article.');
      return;
    }

    try {
      const dislikeDocRef = doc(db, 'articles', id, 'dislikes', currentUser.uid);
      const dislikeDoc = await getDoc(dislikeDocRef);
      const articleDocRef = doc(db, 'articles', id);

      if (!dislikeDoc.exists()) {
        await setDoc(dislikeDocRef, { dislikedAt: new Date() });
        await updateDoc(articleDocRef, { dislikes: increment(1) });
        // Update local state
        setArticle((prevArticle) => ({
          ...prevArticle,
          dislikes: (prevArticle.dislikes || 0) + 1,
        }));
        console.log(`Article ${id} disliked by user ${currentUser.uid}`);
      } else {
        alert('You have already disliked this article.');
        console.log(`Article ${id} already disliked by user ${currentUser.uid}`);
      }
    } catch (error) {
      console.error('Error disliking article:', error);
    }
  };

  if (loading) {
    return <p>retrieving article...</p>;
  }

  if (!article) {
    return <p>Oops! Article not found.</p>;
  }

  const isPDF = article.content.toLowerCase().endsWith('.pdf');

  return (
    <div className="single-article">
      <h1>{article.title}</h1>
      <p className="article-meta">
        By {article.author} on {new Date(article.date).toLocaleDateString()}
      </p>

      {isPDF ? (
        <div className="pdf-container">
          <Document
            file={article.content}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={(error) => console.error('Error loading PDF:', error)}
          >
            {Array.from({ length: numPages }, (_, index) => (
              <Page
                key={`page_${index + 1}`}
                pageNumber={index + 1}
                width={1280}
              />
            ))}
          </Document>
        </div>
      ) : (
        <div
          className="article-content"
          dangerouslySetInnerHTML={{ __html: article.content }}
        ></div>
      )}

      <div className="article-actions">
        <button onClick={handleLike} className="like-button">
          👍 {article.likes || 0}
        </button>
        <button onClick={handleDislike} className="dislike-button">
          👎 {article.dislikes || 0}
        </button>
      </div>
    </div>
  );
};

export default SingleArticle;