import React, { useState, useEffect, useRef, useContext, useCallback } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import { AuthContext } from '../contexts/AuthContext';
import { 
  doc, 
  setDoc, 
  collection, 
  query, 
  orderBy, 
  getDocs, 
  limit, 
  getDoc,
  runTransaction
} from 'firebase/firestore';
import { db } from '../firebase';
import ReactMarkdown from 'react-markdown';
import './InteractiveAI.css';

const QUESTION_CATEGORIES = [
  'Structural Analysis',
  'Construction Management',
  'Building Services',
  'Architecture',
  'Environmental Engineering',
  'Cost Estimation',
];

const InteractiveAI = () => {
  const { currentUser } = useContext(AuthContext);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [aiUsage, setAiUsage] = useState(0);
  const [category, setCategory] = useState('');
  const [inputError, setInputError] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const messagesEndRef = useRef(null);

  const renderVisualization = (graphData) => {
    if (!graphData) return null;
    
    return (
      <div className="graph-container">
        <Line
          data={graphData}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: true,
                grid: {
                  color: 'rgba(0, 0, 0, 0.1)',
                },
                ticks: {
                  color: '#333333',
                  font: {
                    weight: 'bold'
                  }
                }
              },
              x: {
                grid: {
                  color: 'rgba(0, 0, 0, 0.1)',
                },
                ticks: {
                  color: '#333333',
                  font: {
                    weight: 'bold'
                  }
                }
              }
            },
            plugins: {
              legend: {
                display: true,
                position: 'top',
                labels: {
                  color: '#333333',
                  font: {
                    weight: 'bold'
                  }
                }
              },
              tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                titleColor: '#ffffff',
                bodyColor: '#ffffff',
                borderColor: 'rgba(255, 255, 255, 0.2)',
                borderWidth: 1
              }
            }
          }}
        />
      </div>
    );
  };

  const handleFeedback = async (isPositive, messageIndex) => {
    if (!currentUser) return;
    
    try {
      const message = chatHistory[messageIndex];
      const feedbackRef = doc(db, 'feedback', `${currentUser.uid}_${message.timestamp}`);
      await setDoc(feedbackRef, {
        userId: currentUser.uid,
        messageId: message.id,
        isPositive,
        timestamp: new Date().toISOString()
      });

      const updatedHistory = [...chatHistory];
      updatedHistory[messageIndex] = {
        ...message,
        feedback: isPositive ? 'positive' : 'negative'
      };
      setChatHistory(updatedHistory);
    } catch (err) {
      console.error('Error saving feedback:', err);
      setError('Failed to save feedback');
    }
  };

  // Define fetchChatHistory using useCallback
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

  // Define checkDailyUsage using useCallback
  const checkDailyUsage = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      const today = new Date().toISOString().split('T')[0];
      const usageRef = doc(db, 'usage', `${currentUser.uid}_${today}`);
      const usageSnapshot = await getDoc(usageRef);
      
      if (usageSnapshot.exists()) {
        setAiUsage(usageSnapshot.data().count || 0);
      } else {
        // Initialize usage for new day
        setAiUsage(0);
        await setDoc(usageRef, {
          userId: currentUser.uid,
          date: today,
          count: 0
        });
      }
    } catch (err) {
      console.error('Error checking usage:', err);
    }
  }, [currentUser]);

  // Fetch chat history on component mount
  useEffect(() => {
    if (currentUser) {
      fetchChatHistory();
      checkDailyUsage();
    }
  }, [currentUser, fetchChatHistory, checkDailyUsage]);

  // Scroll to bottom when chat updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  // Save chat to Firestore
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

      // Update usage count atomically
      const today = new Date().toISOString().split('T')[0];
      const usageRef = doc(db, 'usage', `${currentUser.uid}_${today}`);
      
      await runTransaction(db, async (transaction) => {
        const usageDoc = await transaction.get(usageRef);
        const newCount = (usageDoc.exists() ? usageDoc.data().count : 0) + 1;
        
        transaction.set(usageRef, {
          userId: currentUser.uid,
          date: today,
          count: newCount
        }, { merge: true });
        
        setAiUsage(newCount);
      });

    } catch (err) {
      console.error('Error saving to history:', err);
      setError('Failed to save chat history');
    }
  };

  const validateInput = (question) => {
    if (question.trim().length < 10) {
      setInputError('Question must be at least 10 characters long');
      return false;
    }
    if (!category) {
      setInputError('Please select a category');
      return false;
    }
    setInputError('');
    return true;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateInput(question)) return;
    
    try {
      setLoading(true);
      setError('');

      if (aiUsage >= 30) {
        setError('Daily usage limit reached');
        return;
      }

      // Add more detailed error handling and logging
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

  return (
    <div className="interactive-ai">
      <div className="chat-main">

        <div className="chat-messages">
          {error && <div className="error-message">{error}</div>}
          {chatHistory.map((item, index) => (
            <div key={index} className="message-group">
              <div className="user-message">
                <div className="message-content">
                  <strong>{item.category}:</strong> {item.question}
                </div>
                <div className="message-timestamp">
                  {new Date(item.timestamp).toLocaleTimeString()}
                </div>
              </div>
              
              <div className="ai-message">
                <div className="message-content">
                  <ReactMarkdown className="message-markdown">
                    {item.answer}
                  </ReactMarkdown>
                  {item.graphData && renderVisualization(item.graphData)}
                </div>
                <div className="feedback-buttons">
                  <button 
                    onClick={() => handleFeedback(true, index)}
                    className={item.feedback === 'positive' ? 'active' : ''}
                  >
                    👍
                  </button>
                  <button 
                    onClick={() => handleFeedback(false, index)}
                    className={item.feedback === 'negative' ? 'active' : ''}
                  >
                    👎
                  </button>
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="chat-input">
          <div className="category-usage-section">
            <div className="category-section">
              <select 
                value={category} 
                onChange={(e) => setCategory(e.target.value)}
                className={!category ? 'placeholder' : ''}
              >
                <option value="" disabled>Select Category</option>
                {QUESTION_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="usage-section">
              <p>Daily Usage: {aiUsage}/30</p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Type your engineering question..."
              disabled={loading}
            />
            <button type="submit" disabled={loading}>
              {loading ? '...' : '→'}
            </button>
          </form>
          {inputError && <div className="input-error">{inputError}</div>}
        </div>
      </div>
    </div>
  );
};

export default InteractiveAI;