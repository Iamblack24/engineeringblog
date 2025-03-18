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
import imageCompression from 'browser-image-compression';
import 'katex/dist/katex.min.css';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';
import { InlineMath, BlockMath } from 'react-katex';

const CATEGORIES = [
  'Structural Analysis',
  'Construction Management',
  'Building Services',
  'Architecture',
  'Environmental Engineering',
  'Cost Estimation',
  'Geotechnical Engineering',
  'Transportation Engineering',
  'Water Resources Engineering',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Computer Science for Engineers',
];

const messageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, x: -10 }
};

// Formula Explorer Component
const FormulaExplorer = ({ formula, variables }) => {
  const [expandedView, setExpandedView] = useState(false);
  
  return (
    <div className="formula-explorer">
      <div className="formula-display" onClick={() => setExpandedView(!expandedView)}>
        <BlockMath math={formula} />
        {expandedView ? <span className="collapse-icon">▼</span> : <span className="expand-icon">▶</span>}
      </div>
      
      {expandedView && (
        <div className="formula-details">
          <h4>Variables:</h4>
          <ul>
            {variables.map(v => (
              <li key={v.symbol}>
                <span className="variable-symbol"><InlineMath math={v.symbol} /></span>: {v.description}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

// Copy Formula Button Component
const CopyFormulaButton = ({ formula }) => {
  const [copied, setCopied] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  
  const copyFormats = [
    { label: "LaTeX", getValue: () => formula },
    { label: "Plain Text", getValue: () => formula.replace(/[\\{}$]/g, '') }
  ];

  const copyToClipboard = (format) => {
    navigator.clipboard.writeText(format.getValue());
    setCopied(true);
    setShowDropdown(false);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="copy-formula-dropdown">
      <button 
        className="copy-formula-btn"
        onClick={() => setShowDropdown(!showDropdown)}
      >
        {copied ? "Copied!" : "Copy Formula"}
      </button>
      {showDropdown && (
        <div className="copy-formats">
          {copyFormats.map(format => (
            <button key={format.label} onClick={() => copyToClipboard(format)}>
              {format.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const InteractiveAI = () => {
  const { currentUser } = useContext(AuthContext);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [category, setCategory] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const messagesEndRef = useRef(null);

  // Add auto resize functionality for textarea
  const textareaRef = useRef(null);

  const autoResizeTextarea = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const newHeight = Math.min(textareaRef.current.scrollHeight, 120); // Cap at 120px
      textareaRef.current.style.height = `${newHeight}px`;
    }
  };

  // Add effect to resize textarea when question changes
  useEffect(() => {
    autoResizeTextarea();
  }, [question]);

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Add this function to convert image to base64
  const convertImageToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  // Add this compression function
  const compressImage = async (file) => {
    const options = {
      maxSizeMB: 1,            // Maximum size in MB
      maxWidthOrHeight: 1200,  // Limit dimensions while keeping aspect ratio
      useWebWorker: true       // Better UI performance
    };
    
    try {
      const compressedFile = await imageCompression(file, options);
      console.log('Image compressed:', {
        originalSize: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
        compressedSize: `${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`,
      });
      return compressedFile;
    } catch (error) {
      console.error('Error compressing image:', error);
      throw error;
    }
  };

  const renderMessage = (message, index) => {
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

    return (
      <motion.div 
        className="message-group"
        variants={messageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.3, delay: index * 0.1 }}
      >
        {/* User Message */}
        <div className="user-message">
          <div className="message-content">
            <div className="message-header">
              <span className="category-tag">{message.category}</span>
              <span className="message-time">{new Date(message.timestamp).toLocaleTimeString()}</span>
            </div>
            <div className="message-text">{message.question}</div>
            
            {/* Add this to display image if present */}
            {message.imageUrl && (
              <div className="message-image-container">
                <img 
                  src={message.imageUrl} 
                  alt="User uploaded" 
                  className="message-image" 
                />
              </div>
            )}
          </div>
        </div>
        
        {/* Assistant Message */}
        <div className="assistant-message">
          <div className="message-content">
            <ReactMarkdown 
              className="message-markdown"
              remarkPlugins={[remarkMath]}
              rehypePlugins={[rehypeKatex]}
              components={{
                // Custom component for math blocks
                math: ({node, ...props}) => {
                  const formula = node.value;
                  // Check if this formula has an explorer (with variables)
                  if (message.formulas && message.formulas[formula]) {
                    return (
                      <div className="formula-with-tools">
                        <BlockMath math={formula} />
                        <FormulaExplorer 
                          formula={formula} 
                          variables={message.formulas[formula].variables} 
                        />
                        <CopyFormulaButton formula={formula} />
                      </div>
                    );
                  }
                  return <BlockMath math={formula} />;
                },
                // Inline math rendering
                inlineMath: ({node}) => <InlineMath math={node.value} />
              }}
            >
              {message.answer}
            </ReactMarkdown>

            {/* Graph Data */}
            {message.graphData && (
              <div className="graph-container">
                <Line data={message.graphData} options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'top',
                    }
                  }
                }} />
              </div>
            )}

            {/* Practical Applications */}
            {message.practicalApplications && (
              <div className="practical-applications">
                <h3>📋 Practical Applications</h3>
                <ReactMarkdown>{message.practicalApplications}</ReactMarkdown>
              </div>
            )}

            {/* Quiz Section */}
            {message.quiz && (
              <div className="quiz-section">
                <h3>📝 Practice Quiz</h3>
                <ReactMarkdown>{message.quiz}</ReactMarkdown>
              </div>
            )}

            {/* Media Section */}
            {message.media && Array.isArray(message.media) && (
              <div className="media-section">
                <h3>📚 Additional Resources</h3>
                <div className="media-links">
                  {message.media
                    .filter(item => !item.startsWith('Source:'))
                    .map((item, i) => {
                      const content = renderMediaContent(item);
                      return content ? (
                        <div key={i} className="media-item">
                          {content}
                        </div>
                      ) : null;
                    })}
                </div>
              </div>
            )}
          </div>
        </div>
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

  // Update the saveToHistory function signature and implementation
const saveToHistory = async (
  question, 
  answer, 
  category, 
  imageUrl,
  responseData = {}
) => {
  if (!currentUser) return;
  
  try {
    // Save chat history
    const timestamp = new Date().toISOString();
    const historyRef = doc(db, 'users', currentUser.uid, 'history', timestamp);
    
    // Create base history item
    const historyItem = {
      question,
      answer,
      category,
      timestamp,
      userId: currentUser.uid
    };
    
    // Add image URL if provided
    if (imageUrl) {
      historyItem.imageUrl = imageUrl;
    }
    
    // Add all additional fields from the API response that exist
    const possibleFields = [
      'graphData', 
      'practicalApplications',
      'quiz', 
      'media',
      'researchSummary',
      'learningPath',
      'solvedExample',
      'imageAnalysis',
      'codeExecution',
      'interactiveTutorial',
      'professionalGuidance',
      'formulas'
    ];
    
    for (const field of possibleFields) {
      if (responseData[field] !== undefined) {
        historyItem[field] = responseData[field];
      }
    }

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

  // Replace the existing handleSubmit function
const handleSubmit = async (e) => {
  e.preventDefault();
  if (!validateInput(question)) return;
  
  try {
    setLoading(true);
    setError('');

    // Prepare request data
    const requestData = {
      question,
      category,
    };

    // If we have an image, compress it before converting to base64
    if (imageFile) {
      try {
        // Compress the image first
        const compressedFile = await compressImage(imageFile);
        
        // Convert compressed image to base64
        const imageData = await convertImageToBase64(compressedFile);
        requestData.imageData = imageData;
      } catch (compressError) {
        setError('Failed to process image. Please try a smaller image.');
        setLoading(false);
        return;
      }
    }

    const response = await axios.post('https://enginehub.onrender.com/api/ask', requestData)
      .catch(err => {
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
    
    // Extract answer field (guaranteed to be present)
    const { answer } = response.data;
    
    // Save ALL content to history by passing the entire response data object
    await saveToHistory(
      question, 
      answer, 
      category,
      imageFile ? imagePreview : undefined,
      response.data
    );
    
    // Clear form
    setQuestion('');
    setImageFile(null);
    setImagePreview(null);
  } catch (err) {
    console.error('Error:', err);
    if (err.message?.includes('entity too large')) {
      setError('Image is too large. Please use a smaller image or compress it before uploading.');
    } else {
      setError(err.message || 'Failed to get response from AI');
    }
  } finally {
    setLoading(false);
  }
};

  // Add this function inside the InteractiveAI component
const renderFormulasWithExplorer = (text) => {
  if (!text) return text;
  
  // Pattern to match formulas with variable definitions in custom format
  // Example: $$E = mc^2$$ {m: mass, c: speed of light, E: energy}
  const formulaPattern = /\$\$(.*?)\$\$\s*\{(.*?)\}/g;
  
  return text.replace(formulaPattern, (match, formula, variablesText) => {
    // Parse variable definitions
    const vars = variablesText.split(',').map(v => {
      const [symbol, description] = v.trim().split(':');
      return { symbol: symbol.trim(), description: description.trim() };
    });
    
    // Generate a unique key for the component
    const key = formula.substring(0, 20) + Math.random().toString(36).substring(2, 7);
    
    // Return a stringified representation that we'll parse in the renderer
    return `<FormulaExplorer key="${key}" formula="${formula}" variables={${JSON.stringify(vars)}} />`;
  });
};

// Add a useEffect to process formulas after rendering
useEffect(() => {
  // Find all elements with formula markers
  const formulaElements = document.querySelectorAll('[data-formula]');
  
  formulaElements.forEach(el => {
    const formula = el.getAttribute('data-formula');
    const variables = JSON.parse(el.getAttribute('data-variables') || '[]');
    
    // Create a FormulaExplorer instance
    const formulaExplorer = <FormulaExplorer formula={formula} variables={variables} />;
    
    // Render it into the element
    ReactDOM.render(formulaExplorer, el);
  });
}, [chatHistory]);

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

              <motion.textarea
                ref={textareaRef}
                whileFocus={{ scale: 1.01 }}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                placeholder="Ask an engineering question..."
                disabled={loading}
                rows={1}
              />

              {/* Add Image Upload Button */}
              <motion.div
                className="file-upload-container"
                whileHover={{ scale: 1.05 }}
              >
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      // Check if file is too large (more than 10MB)
                      if (file.size > 10 * 1024 * 1024) {
                        setError('Image is too large. Please select an image under 10MB.');
                        return;
                      }
                      
                      setImageFile(file);
                      // Create preview URL
                      const previewUrl = URL.createObjectURL(file);
                      setImagePreview(previewUrl);
                    }
                  }}
                  style={{ display: 'none' }}
                />
                <motion.label
                  htmlFor="image-upload"
                  className="image-upload-button"
                  whileTap={{ scale: 0.95 }}
                >
                  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" fill="currentColor" />
                    <path d="M14.14 11.86l-3 3.87L9 13.14 6 17h12l-3.86-5.14z" fill="currentColor" />
                  </svg>
                </motion.label>
              </motion.div>

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

          {/* Image Preview */}
          {imagePreview && (
            <div className="image-preview-container">
              <img 
                src={imagePreview} 
                alt="Upload preview" 
                className="image-preview" 
              />
              <button 
                className="remove-image-button" 
                onClick={() => {
                  setImageFile(null);
                  setImagePreview(null);
                }}
              >
                ✕
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InteractiveAI;