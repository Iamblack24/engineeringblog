import React, { useState, useContext, useEffect, useRef } from 'react'; // Added useRef
import { AuthContext } from '../contexts/AuthContext';
// No longer need GoogleGenerativeAI or pdfjsLib here
import ReactMarkdown from 'react-markdown';
import './ArticleUpload.css';

// No PDF worker needed

const ArticleUpload = () => {
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [file, setFile] = useState(null);
  const [photo, setPhoto] = useState(''); // State for optional photo URL
  const [feedback, setFeedback] = useState('');
  const [status, setStatus] = useState('idle'); // idle, processing, analyzing, sending, success, error
  const [authorName, setAuthorName] = useState('');
  const [authorEmail, setAuthorEmail] = useState('');
  const [steps, setSteps] = useState([ // Simplified steps
    { id: 'fileProcessing', status: 'idle', message: 'Waiting for submission...' },
    { id: 'aiAnalysis', status: 'idle', message: '' },
    { id: 'submission', status: 'idle', message: '' }
  ]);
  const [isSubmitSuccessful, setIsSubmitSuccessful] = useState(false); // Track success state

  const { currentUser } = useContext(AuthContext);
  const abortControllerRef = useRef(null); // For fetch timeout/cancellation

  useEffect(() => {
    if (currentUser) {
      setAuthorEmail(currentUser.email || '');
      setAuthorName(currentUser.displayName || currentUser.email?.split('@')[0] || '');
    }
  }, [currentUser]);

  // Function to reset the form state
  const resetForm = () => {
      setTitle('');
      setFile(null);
      setPhoto('');
      setFeedback('');
      setStatus('idle');
      setSteps([
          { id: 'fileProcessing', status: 'idle', message: 'Waiting for submission...' },
          { id: 'aiAnalysis', status: 'idle', message: '' },
          { id: 'submission', status: 'idle', message: '' }
      ]);
      setIsSubmitSuccessful(false);
      // Reset file input visually
      const fileInput = document.getElementById('article-file-input');
      if (fileInput) fileInput.value = '';
  };

  const updateStep = (stepId, newStatus, message) => {
    setSteps(prevSteps =>
      prevSteps.map(step =>
        step.id === stepId ? { ...step, status: newStatus, message } : step
      )
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Clear previous feedback immediately on new attempt, except success message
    if (!isSubmitSuccessful) {
        setFeedback('');
    }
    setSteps([ // Reset steps visually on new submit
        { id: 'fileProcessing', status: 'idle', message: 'Waiting for submission...' },
        { id: 'aiAnalysis', status: 'idle', message: '' },
        { id: 'submission', status: 'idle', message: '' }
    ]);


    if (!file || !title || !authorName || !authorEmail) {
      setFeedback('Please fill in all required fields (title, file, name, and email).');
      setStatus('error'); // Set status to error for styling
      return;
    }

    if (!authorEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setFeedback('Please enter a valid email address.');
       setStatus('error');
      return;
    }

    setStatus('processing'); // New status for file upload/initial processing
    updateStep('fileProcessing', 'pending', 'Uploading and processing file...');
    setIsSubmitSuccessful(false); // Reset success flag

    // Abort previous request if any
    if (abortControllerRef.current) {
        abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    formData.append('authorName', authorName);
    formData.append('authorEmail', authorEmail);
    if (photo) formData.append('photo', photo);

    try {
      // Use the new server endpoint
      const response = await fetch(
        process.env.NODE_ENV === 'production'
          ? '/api/analyze-article'
          : 'http://localhost:3001/api/analyze-article',
        {
          method: 'POST',
          body: formData,
          signal: signal // Add signal for timeout/abort
        }
      );

      // --- Improved Error Handling ---
      if (!response.ok) {
        let errorData;
        try {
            errorData = await response.json();
        } catch (jsonError) {
            // Handle cases where the response is not JSON (e.g., server crash, network error)
            throw new Error(`Server responded with status ${response.status}. Could not parse error details.`);
        }
         // Use specific error from server if available
        throw new Error(errorData?.error || `Server error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Server Response:', result);

      // --- Update Steps and Feedback Based on Server Response ---
      updateStep('fileProcessing', 'success', 'File processed.');

      if (result.status === 'success' || result.status === 'success_email_failed') {
        updateStep('aiAnalysis', 'success', 'AI analysis passed.');
        updateStep('submission', 'success', 'Submitted for review.');
        setStatus('success');
        setIsSubmitSuccessful(true); // Set success flag
        setFeedback(`# Congratulations!

Your article has successfully passed our initial AI analysis and has been submitted for review.

**AI Feedback:**
*   **Decision:** ${result.analysis.decision}
*   **Explanation:** ${result.analysis.explanation}
*   **Suggestion:** ${result.analysis.suggestion}

## What's Next?
1.  Our team will review your article (usually within 24-48 hours).
2.  You should receive an email confirmation at **${authorEmail}**. ${result.status === 'success_email_failed' ? '(Confirmation email might be delayed or failed - but we received your submission!)' : ''}
3.  The final review decision will be sent to your email.

Thank you for contributing!`);
        // No automatic close/reset - let user see the message

      } else if (result.status === 'rejected') {
        updateStep('aiAnalysis', 'error', 'AI analysis requires improvement.');
        updateStep('submission', 'idle', ''); // Submission didn't happen
        setStatus('error');
        setFeedback(`# Article Needs Improvement

Our AI reviewer identified areas needing attention:

**AI Feedback:**
*   **Decision:** ${result.analysis.decision}
*   **Explanation:** ${result.analysis.explanation}
*   **Suggestion:** ${result.analysis.suggestion}

Please revise your article based on this feedback and try submitting again.`);
      } else {
         // Handle unexpected server response structure
         throw new Error('Received an unexpected response format from the server.');
      }

    } catch (error) {
      console.error('Submission Error:', error);
      setStatus('error');
      updateStep('fileProcessing', 'error', 'Processing failed.'); // Mark relevant step as error
      updateStep('aiAnalysis', 'idle', '');
      updateStep('submission', 'idle', '');

      if (error.name === 'AbortError') {
         setFeedback('The request timed out or was cancelled. Please try again.');
      } else {
         // Display specific error message from server or fetch error
         setFeedback(`An error occurred: ${error.message}. Please check the file or try again later.`);
      }
    } finally {
        // Clear the abort controller
        abortControllerRef.current = null;
    }
  };

  const handleModalClose = () => {
    // Only reset if not currently processing and not just successfully submitted
    if (status !== 'processing' && status !== 'analyzing' && status !== 'sending' && !isSubmitSuccessful) {
      resetForm();
    }
    // If it was successful, keep the success message when closing
    setShowModal(false);
  };

  const handleOpenModal = () => {
    // Reset form state when opening modal *unless* a submission was just successful
    if (!isSubmitSuccessful) {
        resetForm();
    }
    setShowModal(true);
  };

  return (
    <>
      <button onClick={handleOpenModal} className="upload-article-button">
        <i className="fas fa-upload"></i> Submit Article
      </button>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content article-upload-modal">
            <button onClick={handleModalClose} className="modal-close-button">&times;</button>
            <h2>Submit Your Article</h2>
            <p>Share your engineering knowledge with the community!</p>

            <div className="upload-form-container">
              <form onSubmit={handleSubmit} className="upload-form">
                <div className="form-group">
                  <label htmlFor="article-title">Article Title:</label>
                  <input
                    type="text"
                    id="article-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required={!isSubmitSuccessful}
                    disabled={isSubmitSuccessful}
                    placeholder="e.g., Advanced Beam Analysis Techniques"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="author-name">Author Name:</label>
                  <input
                    type="text"
                    id="author-name"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    required={!isSubmitSuccessful}
                    disabled={isSubmitSuccessful}
                    placeholder="Your Name"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="author-email">Author Email:</label>
                  <input
                    type="email"
                    id="author-email"
                    value={authorEmail}
                    onChange={(e) => setAuthorEmail(e.target.value)}
                    required={!isSubmitSuccessful}
                    disabled={isSubmitSuccessful || !!currentUser?.email} // Disable if logged in user email is prefilled
                    placeholder="your.email@example.com"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="article-file-input">Article File:</label>
                  <input
                    id="article-file-input"
                    type="file"
                    onChange={(e) => setFile(e.target.files[0])}
                    accept=".pdf,.txt,.md,.docx"
                    required={!isSubmitSuccessful}
                    disabled={isSubmitSuccessful}
                  />
                  <small>Accepted formats: PDF, DOCX, TXT, MD (Max 25MB)</small>
                </div>

                <div className="form-group">
                  <label htmlFor="article-photo">Cover Photo URL (Optional):</label>
                  <input
                    type="url"
                    id="article-photo"
                    value={photo}
                    onChange={(e) => setPhoto(e.target.value)}
                    disabled={isSubmitSuccessful}
                    placeholder="https://example.com/your-image.jpg"
                  />
                   <small>Link to an image related to your article.</small>
                </div>

                {/* Show Submit button OR Reset button after success */}
                {!isSubmitSuccessful ? (
                    <button
                      type="submit"
                      disabled={status === 'processing' || status === 'analyzing' || status === 'sending'}
                      className="submit-btn"
                    >
                      {status === 'processing' ? 'Processing...' :
                       status === 'analyzing' ? 'Analyzing...' : // Kept for potential future client-side steps
                       status === 'sending' ? 'Submitting...' : // Kept for potential future client-side steps
                       'Submit for Review'}
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={() => {
                            resetForm();
                            // Optionally keep modal open or close it:
                            // setShowModal(false);
                        }}
                        className="reset-btn" // Add styling for this button
                    >
                        Submit Another Article
                    </button>
                )}

                {/* Feedback Area */}
                {feedback && (
                  <div className={`feedback ${status === 'success' ? 'success' : status === 'error' ? 'error' : 'info'}`}>
                    <ReactMarkdown>{feedback}</ReactMarkdown>
                  </div>
                )}

                {/* Steps Container - Show during processing */}
                {(status === 'processing' || status === 'analyzing' || status === 'sending') && !isSubmitSuccessful && (
                    <div className="steps-container">
                      {steps.map(step => (
                        <div key={step.id} className={`step ${step.status}`}>
                          <span className="step-icon">
                              {step.status === 'pending' && <i className="fas fa-spinner fa-spin"></i>}
                              {step.status === 'success' && <i className="fas fa-check-circle"></i>}
                              {step.status === 'error' && <i className="fas fa-times-circle"></i>}
                              {step.status === 'idle' && <i className="far fa-circle"></i>}
                          </span>
                          <span className="step-message">{step.message}</span>
                        </div>
                      ))}
                    </div>
                )}
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ArticleUpload;
