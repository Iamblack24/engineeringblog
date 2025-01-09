import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { storage, db } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { GoogleGenerativeAI } from '@google/generative-ai';
import ReactMarkdown from 'react-markdown';
import { Document, Page, pdfjs } from 'react-pdf';
import { FaCheckCircle, FaTimesCircle, FaSpinner } from 'react-icons/fa';
import './ArticleUpload.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const UploadStep = ({ title, status, message }) => (
  <motion.div 
    className={`upload-step ${status}`}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
  >
    <div className="step-icon">
      {status === 'pending' && <FaSpinner className="spinner" />}
      {status === 'success' && <FaCheckCircle />}
      {status === 'error' && <FaTimesCircle />}
    </div>
    <div className="step-content">
      <h3>{title}</h3>
      {message && <p>{message}</p>}
    </div>
  </motion.div>
);

const ArticleUpload = ({ currentUser }) => {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [photo, setPhoto] = useState(''); 
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [status, setStatus] = useState('');
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadSteps, setUploadSteps] = useState({
    extraction: { status: 'idle', message: '' },
    analysis: { status: 'idle', message: '' },
    upload: { status: 'idle', message: '' }
  });

  const getNextArticleId = async () => {
    try {
      const articlesRef = collection(db, 'articles');
      const q = query(articlesRef, orderBy('id', 'desc'), limit(1));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return '1';
      }
      
      const lastArticle = querySnapshot.docs[0].data();
      return String(Number(lastArticle.id) + 1);
    } catch (error) {
      console.error('Error getting next article ID:', error);
      return String(Date.now()); 
    }
  };

  const updateStep = (step, status, message) => {
    setUploadSteps(prev => ({
      ...prev,
      [step]: { status, message }
    }));
  };

  const reviewArticle = async (content) => {
    const genAI = new GoogleGenerativeAI(process.env.REACT_APP_GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Review this engineering article and determine if it meets our criteria.

## Evaluation Criteria
1. Technical accuracy
2. Engineering principles
3. Clarity and structure
4. Relevance to engineering

## Required Response Format
Please provide your analysis in the following format:

### Decision
[ACCEPT/REJECT]

### Reason
[Brief explanation for the decision]

### Improvements Needed
[If rejected, provide specific recommendations for improvement]

Article content:
${content}`;

    try {
      const result = await model.generateContent(prompt);
      const response = result.response.text();
      return response;
    } catch (error) {
      console.error('AI Review Error:', error);
      throw error;
    }
  };

  const extractTextFromPdf = async (file) => {
    updateStep('extraction', 'pending', 'Extracting content from PDF...');
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const typedArray = new Uint8Array(event.target.result);
          const pdf = await pdfjs.getDocument(typedArray).promise;
          let fullText = '';
          
          for (let i = 1; i <= pdf.numPages; i++) {
            updateStep('extraction', 'pending', `Processing page ${i} of ${pdf.numPages}...`);
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(' ');
            fullText += pageText + ' ';
          }
          
          updateStep('extraction', 'success', 'Content extracted successfully!');
          resolve(fullText.trim());
        } catch (error) {
          updateStep('extraction', 'error', 'Error extracting PDF content');
          reject(error);
        }
      };
      reader.onerror = () => {
        updateStep('extraction', 'error', 'Error reading PDF file');
        reject(new Error('Error reading file'));
      };
      reader.readAsArrayBuffer(file);
    });
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    
    if (!file || !title) {
      setFeedback('Please provide both title and PDF file');
      return;
    }

    setLoading(true);
    try {
      const pdfContent = await extractTextFromPdf(file);
      
      updateStep('analysis', 'pending', 'AI is reviewing your article...');
      const review = await reviewArticle(pdfContent);
      const isApproved = review.includes('ACCEPT');

      if (isApproved) {
        updateStep('analysis', 'success', 'Article approved by AI review!');
        updateStep('upload', 'pending', 'Uploading to server...');
        
        const nextId = await getNextArticleId();
        
        const filename = `${nextId}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
        const storageRef = ref(storage, `articles/${filename}`);
        
        const metadata = {
          contentType: file.type,
          customMetadata: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET',
          }
        };
        
        await uploadBytes(storageRef, file, metadata);
        const downloadURL = await getDownloadURL(storageRef);

        await addDoc(collection(db, 'articles'), {
          id: nextId,
          title,
          author: currentUser.email,
          date: new Date().toISOString().split('T')[0], 
          content: downloadURL,
          likes: 0,
          dislikes: 0,
          photo: photo || null, 
        });

        updateStep('upload', 'success', 'Article published successfully!');
        setStatus('success');
        setFeedback('Article approved and published!');
        
        setTimeout(() => {
          setShowUploadForm(false);
          setTitle('');
          setFile(null);
          setPhoto('');
        }, 3000);
      } else {
        updateStep('analysis', 'error', review);
        updateStep('upload', 'idle', '');
        setStatus('rejected');
        setFeedback(review);
      }
    } catch (error) {
      console.error('Upload Error:', error);
      setFeedback('Error uploading article: ' + error.message);
      updateStep('upload', 'error', 'Upload failed');
    }
    setLoading(false);
  };

  return (
    <>
      <motion.button
        className="floating-upload-button"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          setShowUploadForm(true);
          setUploadSteps({
            extraction: { status: 'idle', message: '' },
            analysis: { status: 'idle', message: '' },
            upload: { status: 'idle', message: '' }
          });
        }}
      >
        Upload Article
      </motion.button>

      <AnimatePresence>
        {showUploadForm && (
          <motion.div
            className="upload-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !loading && setShowUploadForm(false)}
          >
            <motion.div
              className="upload-modal"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              <h2>Upload Engineering Article</h2>
              <form onSubmit={handleFileUpload}>
                <input
                  type="text"
                  placeholder="Article Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={loading}
                  required
                />
                <input
                  type="text"
                  placeholder="Cover Image URL (optional)"
                  value={photo}
                  onChange={(e) => setPhoto(e.target.value)}
                  disabled={loading}
                />
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setFile(e.target.files[0])}
                  disabled={loading}
                  required
                />
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={loading}
                  type="submit"
                >
                  {loading ? 'Processing...' : 'Upload Article'}
                </motion.button>
              </form>

              {(loading || status) && (
                <div className="upload-steps">
                  <UploadStep
                    title="Content Extraction"
                    status={uploadSteps.extraction.status}
                    message={uploadSteps.extraction.message}
                  />
                  <UploadStep
                    title="AI Analysis"
                    status={uploadSteps.analysis.status}
                    message={uploadSteps.analysis.message}
                  />
                  <UploadStep
                    title="Publishing"
                    status={uploadSteps.upload.status}
                    message={uploadSteps.upload.message}
                  />
                </div>
              )}

              {feedback && (
                <motion.div
                  className={`feedback ${status}`}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <ReactMarkdown 
                    className="markdown"
                    components={{
                      code: ({node, inline, className, children, ...props}) => {
                        return (
                          <code className={className} {...props}>
                            {children}
                          </code>
                        )
                      }
                    }}
                  >
                    {feedback}
                  </ReactMarkdown>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ArticleUpload;
