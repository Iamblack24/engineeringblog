import React, { useState, useContext, useEffect } from 'react';
//import { collection, addDoc, getDocs, query, orderBy } from 'firebase/firestore';
//import { db } from '../firebase';
import { AuthContext } from '../contexts/AuthContext';
import { GoogleGenerativeAI } from "@google/generative-ai";
import ReactMarkdown from 'react-markdown';
import * as pdfjsLib from 'pdfjs-dist';
import './ArticleUpload.css';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const ArticleUpload = () => {
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [file, setFile] = useState(null);
  const [photo, setPhoto] = useState('');
  const [feedback, setFeedback] = useState('');
  const [status, setStatus] = useState('idle');
  const [authorName, setAuthorName] = useState('');
  const [authorEmail, setAuthorEmail] = useState('');
  const [steps, setSteps] = useState([
    { id: 'analysis', status: 'idle', message: '' },
    { id: 'upload', status: 'idle', message: '' }
  ]);
  
  const { currentUser } = useContext(AuthContext);
  const genAI = new GoogleGenerativeAI(process.env.REACT_APP_GEMINI_API_KEY);

  // Pre-fill user information when available
  useEffect(() => {
    if (currentUser) {
      setAuthorEmail(currentUser.email || '');
      setAuthorName(currentUser.displayName || currentUser.email.split('@')[0] || '');
    }
  }, [currentUser]);

  const updateStep = (stepId, newStatus, message) => {
    setSteps(prevSteps =>
      prevSteps.map(step =>
        step.id === stepId ? { ...step, status: newStatus, message } : step
      )
    );
  };

  const extractTextFromPDF = async (file) => {
    try {
      console.log('Starting PDF extraction for file:', file.name);
      
      const arrayBuffer = await file.arrayBuffer();
      console.log('File loaded as ArrayBuffer');
      
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      console.log('PDF loading task created');
      
      const pdf = await loadingTask.promise;
      console.log('PDF loaded successfully. Number of pages:', pdf.numPages);
      
      let text = '';
      
      for (let i = 1; i <= pdf.numPages; i++) {
        console.log(`Processing page ${i}/${pdf.numPages}`);
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        
        const pageText = content.items
          .map(item => {
            const needsExtraSpace = item.hasEOL || item.transform[4] > 10; 
            return item.str + (needsExtraSpace ? ' ' : '');
          })
          .join('')
          .replace(/\s+/g, ' ') 
          .trim();
        
        text += pageText + '\n\n'; 
        console.log(`Page ${i} processed successfully`);
      }
      
      const finalText = text.trim();
      console.log('PDF extraction completed. Text length:', finalText.length);
      
      if (!finalText || finalText.length < 10) { 
        throw new Error('Extracted text appears to be too short or empty');
      }
      
      return finalText;
    } catch (error) {
      console.error('PDF extraction error:', error);
      throw new Error(`Failed to extract text from PDF: ${error.message}. Please ensure the file is not corrupted and try again.`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !title || !authorName || !authorEmail) {
      setFeedback('Please fill in all required fields (title, file, name, and email).');
      return;
    }

    if (!authorEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setFeedback('Please enter a valid email address.');
      return;
    }

    setStatus('analyzing');
    updateStep('analysis', 'pending', 'Analyzing article...');
    setFeedback('');

    try {
      let fileContent;
      updateStep('analysis', 'pending', 'Processing file...');

      try {
        console.log('Processing file:', file.name, 'Type:', file.type);
        
        if (file.type === 'application/pdf') {
          console.log('Starting PDF processing');
          fileContent = await extractTextFromPDF(file);
          console.log('PDF processing completed');
        } else {
          console.log('Processing as text file');
          fileContent = await file.text();
          console.log('Text file processing completed');
        }

        console.log('Extracted content length:', fileContent.length);
        console.log('First 100 characters:', fileContent.substring(0, 100));

        if (!fileContent || fileContent.trim().length === 0) {
          throw new Error('No readable text found in the file.');
        }

        const maxChars = 30000;
        if (fileContent.length > maxChars) {
          console.log('Content truncated from', fileContent.length, 'to', maxChars, 'characters');
          fileContent = fileContent.substring(0, maxChars) + '\n\n[Content truncated for analysis]';
        }
      } catch (error) {
        console.error('File processing error:', error);
        updateStep('analysis', 'error', 'Failed to process file');
        setStatus('error');
        setFeedback(`Error processing file: ${error.message}`);
        return;
      }

      updateStep('analysis', 'pending', 'AI analyzing content...');
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const prompt = `
        You are a technical article reviewer for a professional engineering site called Engineering Hub.
        Review the following article and determine if it meets our standards:
        
        Title: ${title}
        Content: ${fileContent}
        
        Evaluate based on:
        1. Technical accuracy- verify correctness of engineering concepts and formulae. Cross check references.
        2. Code quality (if code is present)
        3. Relevance to engineering- Filter out overly general or unrelated topics
        4. Originality- Check for plagiarism
        5. Educational value
        6. Engagement potential- analyze how well it appeals to target audience
        7. Readability and clarity- Repetition may be allowed as long as it's not overwhelming.
        
        Respond with:
        - ACCEPT or REJECT
        - Brief explanation (max 3 sentences)
        - One key improvement suggestion
      `;

      const result = await model.generateContent(prompt);
      const review = result.response.text();
      const isApproved = review.includes('ACCEPT');

      if (isApproved) {
        updateStep('analysis', 'success', 'Article approved by AI review! Your submission will be reviewed by our team.');
        updateStep('upload', 'pending', 'Sending notification...');

        try {
          // Create FormData to send file
          const formData = new FormData();
          formData.append('file', file);
          formData.append('authorName', authorName);
          formData.append('authorEmail', authorEmail);
          formData.append('documentTitle', title);
          formData.append('documentContent', fileContent);
          if (photo) formData.append('coverPhotoUrl', photo);
          formData.append('aiAnalysis', review);

          console.log('Sending form data:', {
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
            authorName,
            authorEmail,
            documentTitle: title,
            hasContent: !!fileContent,
            hasPhoto: !!photo,
            hasAnalysis: !!review
          });

          const emailResponse = await fetch(
            process.env.NODE_ENV === 'production' 
              ? '/api/send-article'  // In production, use relative URL (same domain)
              : 'http://localhost:3001/api/send-article', // In development, use localhost with port
            {
              method: 'POST',
              body: formData
            }
          );

          if (!emailResponse.ok) {
            const errorData = await emailResponse.json();
            throw new Error(errorData.error || 'Failed to send email notification');
          }

          updateStep('upload', 'success', 'Article submitted successfully!');
          setStatus('success');
          setFeedback(`# Congratulations! 

Your article has successfully passed our initial AI analysis and has been submitted for review.

## What's Next?
1. Our team of industry professionals will review your article within the next 24 hours
2. You will receive an email confirmation at ${authorEmail}
3. The final review decision will be sent to your email

Thank you for contributing to Engineering Hub! We'll be in touch soon.`);
          
          setTimeout(() => {
            setShowModal(false);
            setTitle('');
            setFile(null);
            setPhoto('');
            setFeedback('');
            setSteps([
              { id: 'analysis', status: 'idle', message: '' },
              { id: 'upload', status: 'idle', message: '' }
            ]);
          }, 30000);
        } catch (error) {
          console.error('Notification Error:', error);
          setFeedback('Error sending notification: ' + error.message);
          updateStep('upload', 'error', 'Failed to send notification');
        }
      } else {
        updateStep('analysis', 'error', 'Article needs improvement');
        updateStep('upload', 'idle', '');
        setStatus('error');
        setFeedback(`# Article Review Results

${review}

Please revise your article based on the feedback above and try submitting again.`);
      }
    } catch (error) {
      console.error('Analysis Error:', error);
      updateStep('analysis', 'error', 'Analysis failed');
      setStatus('error');
      setFeedback('Error analyzing article: ' + error.message);
    }
  };

  const handleModalClose = (e) => {
    if (e.target === e.currentTarget) {
      setShowModal(false);
      setFeedback('');
      setSteps([
        { id: 'analysis', status: 'idle', message: '' },
        { id: 'upload', status: 'idle', message: '' }
      ]);
    }
  };

  if (!currentUser) {
    return (
      <div className="article-upload-container">
        <button 
          className="toggle-upload-btn" 
          onClick={() => setFeedback('Please sign in to upload articles.')}
          title="Upload Article"
        />
      </div>
    );
  }

  return (
    <>
      <div className="article-upload-container">
        <button 
          className={`toggle-upload-btn ${showModal ? 'active' : ''}`}
          onClick={() => setShowModal(!showModal)}
          title="Upload Article"
        />
      </div>

      <div 
        className={`upload-modal-overlay ${showModal ? 'active' : ''}`}
        onClick={handleModalClose}
      >
        <div className="upload-form-container">
          <form onSubmit={handleSubmit} className="upload-form">
            <div className="form-group">
              <label>Title:</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Your Name:</label>
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Your Email:</label>
              <input
                type="email"
                value={authorEmail}
                onChange={(e) => setAuthorEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Article File:</label>
              <input
                type="file"
                onChange={(e) => setFile(e.target.files[0])}
                accept=".pdf,.txt,.md,.doc,.docx"
                required
              />
            </div>

            <div className="form-group">
              <label>Cover Photo URL (optional):</label>
              <input
                type="url"
                value={photo}
                onChange={(e) => setPhoto(e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <button 
              type="submit" 
              disabled={status === 'analyzing' || status === 'uploading'}
              className="submit-btn"
            >
              {status === 'analyzing' ? 'Analyzing...' : 
               status === 'uploading' ? 'Sending...' : 
               'Submit Article'}
            </button>

            {feedback && (
              <div className={`feedback ${status}`}>
                <ReactMarkdown>{feedback}</ReactMarkdown>
              </div>
            )}

            <div className="steps-container">
              {steps.map(step => (
                <div key={step.id} className={`step ${step.status}`}>
                  <span className="step-label">{step.id}:</span>
                  <span className="step-message">{step.message}</span>
                </div>
              ))}
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default ArticleUpload;
