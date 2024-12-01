// src/pages/NewThreadPage.js

import React, { useState } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useNavigate, useParams } from 'react-router-dom';
import './NewThreadPage.css';

const NewThreadPage = () => {
  const { categoryId } = useParams();
  const [title, setTitle] = useState('');
  const navigate = useNavigate();

  const handleCreateThread = async (e) => {
    e.preventDefault();
    if (title.trim()) {
      try {
        const userEmail = auth.currentUser.email;
        const truncatedEmail = userEmail.split('@')[0];
        const threadsRef = collection(db, 'categories', categoryId, 'threads');
        const threadRef = await addDoc(threadsRef, {
          title,
          user: truncatedEmail || 'Anonymous',
          userId: auth.currentUser.uid,
          categoryId, // Store categoryId for easy reference
          createdAt: serverTimestamp(), // Use serverTimestamp for consistency
        });
        navigate(`/community/${encodeURIComponent(categoryId)}/threads/${threadRef.id}`);
      } catch (error) {
        console.error('Error creating thread:', error);
        alert('Failed to create thread. Please try again.');
      }
    }
  };

  // Optional: Fetch category name if needed for display
  // For simplicity, we're using categoryId as the name.

  if (!categoryId) {
    return <div>Category not found.</div>;
  }

  return (
    <div className="new-thread-page">
      <h1>Create New Thread</h1>
      <form onSubmit={handleCreateThread}>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Thread Title"
          required
        />
        <button type="submit">Create Thread</button>
      </form>
    </div>
  );
};

export default NewThreadPage;