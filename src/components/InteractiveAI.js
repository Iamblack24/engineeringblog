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
  'Structural Analysis',
  'Construction Management',
  'Building Services',
  'Architecture',
  'Environmental Engineering',
  'Cost Estimation',
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

  const renderMessage = (message, index) => {
    return (
      <motion.div
        key={index}
        variants={messageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="message-group"
      >
        <div className="message-text">
          <ReactMarkdown>{message.answer || ''}</ReactMarkdown>
        </div>
        {message.practicalApplications && (
          <div className="practical-applications">
            <h3>Practical Applications</h3>
            <ReactMarkdown>{message.practicalApplications}</ReactMarkdown>
          </div>
        )}
        {message.quiz && (
          <div className="quiz">
            <h3>Quiz</h3>
            <ReactMarkdown>{message.quiz}</ReactMarkdown>
          </div>
        )}
        {message.research && (
          <div className="research">
            <h3>Research</h3>
            <ReactMarkdown>{message.research}</ReactMarkdown>
          </div>
        )}
        {message.academicSources && Array.isArray(message.academicSources) && (
          <div className="academic-sources">
            <h3>Academic Sources</h3>
            {message.academicSources.map((source, i) => (
              <div key={i} className="academic-source">
                <a href={source.link} target="_blank" rel="noopener noreferrer">
                  {source.title}
                </a>
                <p>{source.snippet}</p>
              </div>
            ))}
          </div>
        )}
        {message.media && Array.isArray(message.media) && message.media.length > 0 && (
          <div className="media">
            <h3>Media</h3>
            {message.media.map((item, i) => {
              // item may be an object or string; handle accordingly
              if (typeof item === 'object' && item.link) {
                return (
                  <div key={i} className="media-item">
                    <a href={item.link} target="_blank" rel="noopener noreferrer">
                      {item.title}
                    </a>
                    <p>{item.snippet}</p>
                  </div>
                );
              } else if (typeof item === 'string') {
                return (
                  <div key={i} className="media-item">
                    <a href={item} target="_blank" rel="noopener noreferrer">
                      {item}
                    </a>
                  </div>
                );
              }
              return null;
            })}
          </div>
        )}
        {message.graphData && (
          <div className="graph">
            {/* Render your graph here if applicable */}
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

  const saveToHistory = async (question, answer, category, graphData, practicalApplications, quiz, media, research, academicSources) => {
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
        practicalApplications,
        quiz,
        media,
        research,
        academicSources,
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

      const response = await axios.post('https://enginehub.onrender.com/api/ask', {
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
      const { answer, graphData, practicalApplications, quiz, media, research, academicSources } = response.data;
      
      const mediaLinks = (media || []).filter(item => typeof item === 'string' && item.startsWith('http'));
      
      await saveToHistory(question, answer, category, graphData, practicalApplications, quiz, mediaLinks, research, academicSources);
      
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
      <div className="chat-main">
        <div className="chat-messages" ref={messagesEndRef}>
          <AnimatePresence>
            {chatHistory.map((item, index) => (
              <motion.div key={index}>
                {renderMessage(item, index)}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="chat-input-container">
          <form onSubmit={handleSubmit}>
            <div className="input-row">
              <motion.select
                whileHover={{ scale: 1.02 }}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={!category ? 'placeholder' : ''}
              >
                <option value="" disabled>Select Topic</option>
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </motion.select>

              <motion.input
                whileFocus={{ scale: 1.01 }}
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask an engineering question..."
                disabled={loading}
              />

              <motion.button 
                type="submit" 
                disabled={loading}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="send-button"
              >
                {loading ? (
                  <div className="loading-dots">
                    <span>.</span><span>.</span><span>.</span>
                  </div>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" fill="currentColor"/>
                  </svg>
                )}
              </motion.button>
            </div>
            {error && (
              <motion.div 
                className="error-message"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                {error}
              </motion.div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default InteractiveAI;