// src/pages/SingleArticle.js
import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { db } from '../firebase';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  collection,
  addDoc,
  onSnapshot,
  Timestamp,
  query,
  orderBy,
  limit,
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
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [error, setError] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');

  //function to extract username from email
  const getUsernameFromEmail = (email) => {
    if (!email) return 'anonymous';
    const username = email.split('@')[0];
    return username ? username : 'anonymous';
  };

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

  useEffect(() => {
    const commentsRef = collection(db, 'articles', id, 'comments');
    const q = query(commentsRef, orderBy('date', 'desc'), limit(10));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const commentsData = [];
      snapshot.forEach((doc) => {
        commentsData.push({ id: doc.id, ...doc.data() });
      });
      setComments(commentsData);
    });

    return () => unsubscribe();
  }, [id]);

  useEffect(() => {
    const unsubscribeFunctions = comments.map((comment) => {
      const repliesRef = collection(db, 'articles', id, 'comments', comment.id, 'replies');
      const q = query(repliesRef, orderBy('date', 'asc'), limit(20));
  
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const repliesData = [];
          snapshot.forEach((doc) => {
            repliesData.push({ id: doc.id, ...doc.data() });
          });
          setComments((prevComments) =>
            prevComments.map((c) =>
              c.id === comment.id ? { ...c, replies: repliesData } : c
            )
          );
        },
        (err) => {
          console.error(`Error fetching replies for comment ${comment.id}:`, err);
        }
      );
  
      return unsubscribe;
    });
  
    // Cleanup all listeners on unmount or when comments change
    return () => {
      unsubscribeFunctions.forEach((unsubscribe) => unsubscribe());
    };
  }, [comments, id]);

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

  const handleCommentSubmit =async (e) => {
    e.preventDefault();
    if (newComment.trim() === '') {
      setError('Comment cannot be empty.');
      return;
    }

    if (!currentUser) {
      setError('You need to be logged in to comment.');
      return;
    }
    
    //Extract userame from email
    const email = currentUser.email || '';
    const username = getUsernameFromEmail(email);

    try {
      const commentsRef = collection(db, 'articles', id, 'comments');
      await addDoc(commentsRef, {
        text: newComment,
        userId: currentUser.uid,
        username: username,
        date: Timestamp.now(),
      });
      setNewComment('');
      setError('');
    } catch (error) {
      console.error('Error adding Comment:', error);
      setError('Failed to add comment. Please try again.');
    }
  };

  const handleReplySubmit = async (e, parentId) => {
    e.preventDefault();
    if (replyText.trim() === '') {
      setError('Reply cannot be empty.');
      return;
    }

    if (!currentUser) {
      setError('You need to be logged in to reply.');
      return;
    }

    // Extract username from email
    const email = currentUser.email || '';
    const username = getUsernameFromEmail(email);

    try {
      const repliesRef = collection(db, 'articles', id, 'comments', parentId, 'replies');
      await addDoc(repliesRef, {
        text: replyText,
        userId: currentUser.uid,
        username: username,
        date: Timestamp.now(),
      });
      setReplyText('');
      setReplyingTo(null);
      setError('');
    } catch (error) {
      console.error('Error adding Reply:', error);
      setError('Failed to add reply. Please try again.');
    }
  };

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
      <div className="comments-section">
        <h2>Comments</h2>
        <ul className="comments-list">
          {comments.map((comment) => (
            <li key={comment.id} className="comment-item">
              <div className="comment-content">
                <p>{comment.text}</p>
                <div className="comment-meta">
                  <span className="comment-username">{comment.username}</span>
                  <span className="comment-date">{new Date(comment.date.seconds * 1000).toLocaleString()}</span>
                </div>
                <button
                  className="reply-button"
                  onClick={() =>
                    setReplyingTo(replyingTo === comment.id ? null : comment.id)
                  }
                >
                  {replyingTo === comment.id ? 'Cancel' : 'Reply'}
                </button>
              </div>
              {replyingTo === comment.id && (
                <form
                  onSubmit={(e) => handleReplySubmit(e, comment.id)}
                  className="reply-form"
                >
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Write your reply here..."
                    required
                  ></textarea>
                  <button type="submit">Submit Reply</button>
                </form>
              )}
              {comment.replies && comment.replies.length > 0 && (
                <ul className="replies-list">
                  {comment.replies.map((reply) => (
                    <li key={reply.id} className="reply-item">
                      <div className="reply-content">
                        <p>{reply.text}</p>
                        <div className="comment-meta">
                          <span className="comment-username">{reply.username}</span>
                          <span className="comment-date">{new Date(reply.date.seconds * 1000).toLocaleString()}</span>
                        </div>
                      </div>
                    </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
          {currentUser ? (
            <form onSubmit={handleCommentSubmit} className="comment-form">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Chip in..."
              ></textarea>
              <button type="submit">Submit</button>
            </form>
          ) : (
            <p>You must be <Link to="/login">Logged in</Link> to comment. </p>
          )}
          {error && <p className="error-message">{error}</p>}
        </div>
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