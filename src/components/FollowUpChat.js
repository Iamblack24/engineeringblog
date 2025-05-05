import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { FaPaperPlane, FaRobot, FaUser, FaSyncAlt, FaQuestionCircle } from 'react-icons/fa';

const FollowUpChat = ({ history, onSubmit, isLoading }) => { // isLoading now specifically for follow-up
    const [input, setInput] = useState('');
    const messagesEndRef = useRef(null);

    const handleSend = (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;
        onSubmit(input);
        setInput('');
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [history]);

    return (
        <div className="follow-up-chat-container">
            <div className="chat-header-followup">
                <h3><FaQuestionCircle /> Ask About This Case Study</h3>
            </div>
            <div className="chat-messages-followup">
                {history.length === 0 && (
                    <div className="empty-chat-message">
                        Ask a question about the generated case study above.
                    </div>
                )}
                {history.map((msg, index) => (
                    <div key={index} className={`chat-message-item ${msg.role}`}>
                        <div className="message-icon">
                            {msg.role === 'user' ? <FaUser /> : <FaRobot />}
                        </div>
                        <div className="message-text">
                            {/* Use ReactMarkdown for rendering potential markdown in responses */}
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {msg.parts[0].text}
                            </ReactMarkdown>
                        </div>
                    </div>
                ))}
                {/* Show thinking indicator only when isLoading is true for follow-up */}
                {isLoading && (
                     <div className="chat-message-item model thinking">
                        <div className="message-icon"><FaRobot /></div>
                        <div className="message-text"><i>Thinking...</i> <FaSyncAlt className="spinner-icon inline-spinner"/></div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSend} className="chat-input-form-followup">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask a follow-up question..."
                    disabled={isLoading}
                />
                <button type="submit" disabled={isLoading || !input.trim()}>
                    {isLoading ? <FaSyncAlt className="spinner-icon" /> : <FaPaperPlane />}
                </button>
            </form>
        </div>
    );
};

export default FollowUpChat;