import React, { useState, useEffect, useRef, useContext, useCallback } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import { AuthContext } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  doc, 
  setDoc, 
  collection, 
  query, 
  orderBy, 
  getDocs, 
  limit 
} from 'firebase/firestore';
import { db } from '../firebase';
import ReactMarkdown from 'react-markdown';
import './InteractiveAI.css';

const CATEGORIES = [
  'Civil Engineering',
  'Mechanical Engineering',
  'Electrical Engineering',
  'Plumbing and Drainage',
  'Fire Protection Systems',
  'Building Automation',
  'Architecture',
  'Environmental Engineering',
];

const messageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, x: -10 }
};

const InteractiveAI = () => {
  const { currentUser } = useContext(AuthContext);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [category, setCategory] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const messagesEndRef = useRef(null);

  const renderMediaContent = (mediaItem) => {
    // Skip descriptive text items
    if (mediaItem.startsWith('Images:') || 
        mediaItem.startsWith('Source:') || 
        mediaItem === 'YouTube Links:') {
      return null;
    }

    // Extract image URL from markdown format
    const imageMatch = mediaItem.match(/!\[.*?\]\((.*?)\)/);
    if (imageMatch) {
      return (
        <img 
          src={imageMatch[1]}
          alt="Resource visualization"
          style={{ maxWidth: '100%', height: 'auto', borderRadius: '8px' }}
          loading="lazy"
        />
      );
    }

    // Handle YouTube links
    if (mediaItem.toLowerCase().includes('youtube.com') || 
        mediaItem.toLowerCase().includes('youtu.be')) {
      const urlMatch = mediaItem.match(/\[(.*?)\]\((.*?)\)/);
      if (urlMatch) {
        return (
          <a 
            href={urlMatch[2]}
            target="_blank" 
            rel="noopener noreferrer"
            className="video-link"
          >
            📺 {urlMatch[1]}
          </a>
        );
      }
    }

    // Handle regular links
    const linkMatch = mediaItem.match(/\[(.*?)\]\((.*?)\)/);
    if (linkMatch) {
      return (
        <a 
          href={linkMatch[2]}
          target="_blank" 
          rel="noopener noreferrer"
          className="resource-link"
        >
          📄 {linkMatch[1]}
        </a>
      );
    }

    // Return null for unmatched items
    return null;
  };

  const renderMessage = (message, index) => {
    return (
      <motion.div 
        className={`message ${message.isUser ? 'user-message' : 'assistant-message'}`}
        variants={messageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.3, delay: index * 0.1 }}
      >
        {message.isUser ? (
          <>
            <div className="message-header">
              <span className="category-tag">{message.category}</span>
              <span className="message-time">{new Date(message.timestamp).toLocaleTimeString()}</span>
            </div>
            <div className="message-content">{message.content}</div>
          </>
        ) : (
          <div className="message-content">
            <ReactMarkdown className="message-markdown">
              {message.content}
            </ReactMarkdown>

            {message.graphData && (
              <div className="graph-container">
                <Line 
                  data={message.graphData} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top',
                        labels: {
                          color: '#ffffff'
                        }
                      }
                    },
                    scales: {
                      x: {
                        grid: {
                          color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                          color: '#ffffff'
                        }
                      },
                      y: {
                        grid: {
                          color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                          color: '#ffffff'
                        }
                      }
                    }
                  }} 
                />
              </div>
            )}

            {message.media && (
              <div className="media-section">
                <div className="media-links">
                  {message.media.map((item, i) => (
                    <div key={i} className="media-item">
                      {renderMediaContent(item)}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </motion.div>
    );
  };

  const fetchChatHistory = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      const historyRef = collection(db, 'users', currentUser.uid, 'history');
      const q = query(
        historyRef,
        orderBy('timestamp', 'desc'),
        limit(50)
      );

      const querySnapshot = await getDocs(q);
      const history = [];
      querySnapshot.forEach((doc) => {
        history.push({ id: doc.id, ...doc.data() });
      });

      setChatHistory(history.reverse());
    } catch (err) {
      console.error('Error fetching chat history:', err);
      setError('Failed to load chat history');
    }
  }, [currentUser]);

  const saveToHistory = async (question, answer, category, graphData) => {
    if (!currentUser) return;
    
    try {
      // Save chat history
      const timestamp = new Date().toISOString();
      const historyRef = doc(db, 'users', currentUser.uid, 'history', timestamp);
      const historyItem = {
        question,
        answer,
        category,
        graphData,
        timestamp,
        userId: currentUser.uid
      };

      await setDoc(historyRef, historyItem);
      setChatHistory(prev => [...prev, historyItem]);
    } catch (err) {
      console.error('Error saving to history:', err);
      setError('Failed to save chat history');
    }
  };

  const validateInput = (question) => {
    if (question.trim().length < 10) {
      setError('Question must be at least 10 characters long');
      return false;
    }
    if (!category) {
      setError('Please select a category');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateInput(question)) return;
    
    try {
      setLoading(true);
      setError('');

      const response = await axios.post('http://localhost:5000/api/ask', {
        question,
        category,
      }).catch(err => {
        console.log('Detailed error:', {
          message: err.message,
          code: err.code,
          response: err.response,
          config: err.config
        });
        
        if (err.code === 'ERR_NETWORK') {
          throw new Error('Cannot connect to server. Please check if the server is running.');
        }
        if (err.response?.status === 404) {
          throw new Error('API endpoint not found. Please check the server configuration.');
        }
        if (err.response?.status === 500) {
          throw new Error('Server error. Please try again later.');
        }
        throw new Error(`Request failed: ${err.message}`);
      });

      console.log('Full API Response:', JSON.stringify(response.data, null, 2));
      const { answer, graphData } = response.data;
      
      await saveToHistory(question, answer, category, graphData);
      
      setQuestion('');
    } catch (err) {
      console.error('Error:', err);
      setError(err.message || 'Failed to get response from AI');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchChatHistory();
    }
  }, [currentUser, fetchChatHistory]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  return (
    <div className="chat-container">
      <div className="chat-messages" ref={messagesEndRef}>
        <AnimatePresence>
          {chatHistory.map((msg, index) => (
            <motion.div key={index}>
              {renderMessage({
                content: msg.isUser ? msg.question : msg.answer,
                isUser: msg.isUser,
                category: msg.category,
                timestamp: msg.timestamp,
                graphData: msg.graphData,
                media: msg.media
              }, index)}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      
      <div className="chat-input-container">
        <form onSubmit={handleSubmit} className="chat-input">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="category-select"
          >
            <option value="" disabled>Select Topic</option>
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Type your question here..."
            rows={1}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <button 
            type="submit" 
            disabled={loading || !question.trim() || !category}
            title="Send message"
          >
            {loading ? (
              <span>...</span>
            ) : (
              <span>Send</span>
            )}
          </button>
        </form>
        {error && <div className="error-message">{error}</div>}
      </div>
    </div>
  );
};

export default InteractiveAI;