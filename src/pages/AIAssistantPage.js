import React from 'react';
import InteractiveAI from '../components/InteractiveAI';
import './AIAssistantPage.css';

const AIAssistantPage = () => {
  return (
    <div className="ai-assistant-container">
      <div className="ai-sidebar">
        <div className="ai-brand">
          <span className="ai-logo">🛠️</span>
          <h1>Built Environment AI</h1>
          <p>Ask any built environment related question</p>
        </div>
        <div className="ai-features">
          <div className="feature-item">
            <span className="feature-icon">🤖</span>
            <div className="feature-text">
              <h3>AI Assistant</h3>
              <p>Powered by advanced AI</p>
            </div>
          </div>
          <div className="feature-item">
            <span className="feature-icon">📊</span>
            <div className="feature-text">
              <h3>Visual Data</h3>
              <p>Interactive graphs & charts</p>
            </div>
          </div>
          <div className="feature-item">
            <span className="feature-icon">💾</span>
            <div className="feature-text">
              <h3>History</h3>
              <p>All chats saved securely</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="ai-main">
        <div className="ai-header">
        </div>
        <div className="ai-chat-wrapper">
          <InteractiveAI />
        </div>
      </div>
    </div>
  );
};

export default AIAssistantPage;