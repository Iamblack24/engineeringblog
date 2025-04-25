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
  query,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import './SingleArticle.css';
import { Document, Page, pdfjs } from 'react-pdf/dist/esm/entry.webpack';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css'; // Import TextLayer CSS
import { 
  FacebookShareButton, TwitterShareButton, WhatsappShareButton,
  FacebookIcon, TwitterIcon, WhatsappIcon
} from 'react-share';
import { MdContentCopy } from 'react-icons/md'; // Add copy icon

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

// Helper function to format date safely
const formatDate = (timestamp) => {
  if (!timestamp || !timestamp.seconds) {
    return 'Date not available';
  }
  return new Date(timestamp.seconds * 1000).toLocaleDateString();
};

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
  const [pdfPreviewText, setPdfPreviewText] = useState('');
  const [copySuccess, setCopySuccess] = useState('');

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

  const onDocumentLoadSuccess = async ({ numPages }) => {
    setNumPages(numPages);
    
    if (isPDF) {
      try {
        // Load PDF document
        const pdf = await pdfjs.getDocument(article.content).promise;
        
        // Get first page
        const page = await pdf.getPage(1);
        
        // Extract text content
        const textContent = await page.getTextContent();
        
        // Combine text items
        const text = textContent.items.map(item => item.str).join(' ');
        
        // Take first 120 words as preview
        const words = text.split(' ').slice(0, 120);
        const preview = words.join(' ') + '...';
        
        setPdfPreviewText(preview);
      } catch (error) {
        console.error('Error extracting PDF text:', error);
        setPdfPreviewText('Preview not available');
      }
    }
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

  const getArticlePreview = () => {
    if (!article) return '';
    
    const siteName = "Engineering Hub";
    const callToAction = `\n\n🔍 Discover more insights in our complete article on ${siteName}!`;
    
    if (isPDF) {
      return `📄 ${article.title}\n\n${pdfPreviewText}${callToAction}`;
    }
    
    const content = article.content;
    const words = content.split(' ');
    const previewLength = Math.floor(words.length * 0.1);
    return `📝 ${article.title}\n\n${words.slice(0, previewLength).join(' ')}...${callToAction}`;
  };

  // Add copy to clipboard function
  const copyToClipboard = () => {
    const articleUrl = window.location.href;
    const previewText = getArticlePreview();
    const textToCopy = `${previewText}\n\n🔗 Read more: ${articleUrl}`;
    
    navigator.clipboard.writeText(textToCopy)
      .then(() => {
        setCopySuccess('Copied!');
        setTimeout(() => setCopySuccess(''), 2000);
      })
      .catch(err => {
        console.error('Failed to copy:', err);
        setCopySuccess('Failed to copy');
      });
  };

  if (loading) {
    return <p>retrieving article...</p>;
  }

  if (!article) {
    return <p>Oops! Article not found.</p>;
  }

  const isPDF = article.content.toLowerCase().endsWith('.pdf');

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (newComment.trim() === '') {
      setError('Comment cannot be empty.');
      return;
    }

    if (!currentUser) {
      setError('You need to be logged in to comment.');
      return;
    }
    
    //Extract username from email
    const email = currentUser.email || '';
    const username = getUsernameFromEmail(email);

    try {
      const commentsRef = collection(db, 'articles', id, 'comments');
      await addDoc(commentsRef, {
        text: newComment,
        userId: currentUser.uid,
        username: username,
        date: serverTimestamp(),
        parentCommentId: null,
        level: 1
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

    try {
      const email = currentUser.email || '';
      const username = getUsernameFromEmail(email);
      
      const repliesRef = collection(db, 'articles', id, 'comments', parentId, 'replies');
      await addDoc(repliesRef, {
        text: replyText,
        userId: currentUser.uid,
        username: username,
        date: serverTimestamp(),
        parentCommentId: parentId,
        level: 2
      });
      
      setReplyText('');
      setReplyingTo(null);
      setError('');
    } catch (error) {
      console.error('Error adding reply:', error);
      setError('Failed to add reply. Please try again.');
    }
  };

  return (
    <div className="single-article">
      <h1>{article.title}</h1>
      <p className="article-meta">
        By {article.author} on {new Date(article.date).toLocaleDateString()}
      </p>
      
      <div className="social-share-buttons">
        <TwitterShareButton
          url={window.location.href}
          title={getArticlePreview()}
          via="Eng_ineeringHub"
          className="share-button"
          hashtags={["engineering", "education"]} // Optional: Add relevant hashtags
          beforeOnClick={() => {
            if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
              const tweetText = encodeURIComponent(getArticlePreview() + "\n" + window.location.href);
              window.location.href = `twitter://post?text=${tweetText}`;
              return false;
            }
            return true;
        }}
        >
          <TwitterIcon size={32} round />
        </TwitterShareButton>

        <FacebookShareButton
          url={window.location.href}
          quote={getArticlePreview()}
          className="share-button"
          beforeOnClick={() => {
            if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
              window.location.href = `fb://share?text=${encodeURIComponent(getArticlePreview())}`;
              return false;
            }
            return true;
          }}
        >
          <FacebookIcon size={32} round />
        </FacebookShareButton>

        <WhatsappShareButton
          url={window.location.href}
          title={getArticlePreview()}
          className="share-button"
          beforeOnClick={() => {
            if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
              window.location.href = `whatsapp://send?text=${encodeURIComponent(getArticlePreview())}`;
              return false;
            }
            return true;
          }}
        >
          <WhatsappIcon size={32} round />
        </WhatsappShareButton>

        <button 
          onClick={copyToClipboard}
          className="copy-button"
          title="Copy article link"
        >
          <MdContentCopy size={32} />
          {copySuccess && <span className="copy-success">{copySuccess}</span>}
        </button>
      </div>
      
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
                  <span className="comment-date">{formatDate(comment.date)}</span>
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
                          <span className="comment-date">{formatDate(reply.date)}</span>
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