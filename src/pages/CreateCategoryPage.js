// src/pages/CreateCategoryPage.js

import React, { useState } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import './CreateCategoryPage.css';

const CreateCategoryPage = () => {
  const [categoryName, setCategoryName] = useState('');
  const navigate = useNavigate();

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (categoryName.trim()) {
      try {
        const userEmail = auth.currentUser.email;
        const truncatedEmail = userEmail.split('@')[0];
        const categoryRef = await addDoc(collection(db, 'categories'), {
          name: categoryName,
          user: truncatedEmail || 'Anonymous',
          userId: auth.currentUser.uid,
          createdAt: serverTimestamp(), // Use serverTimestamp for consistency
        });
        navigate(`/community/${encodeURIComponent(categoryRef.id)}`);
      } catch (error) {
        console.error('Error creating category:', error);
        alert('Failed to create category. Please try again.');
      }
    }
  };

  return (
    <div className="create-category-page">
      <h1>Create New Category</h1>
      <form onSubmit={handleCreateCategory}>
        <input
          type="text"
          value={categoryName}
          onChange={(e) => setCategoryName(e.target.value)}
          placeholder="Category Name"
          required
        />
        <button type="submit">Create Category</button>
      </form>
    </div>
  );
};

export default CreateCategoryPage;