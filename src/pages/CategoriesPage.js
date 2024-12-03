// src/pages/CategoriesPage.js

import React, { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Link } from 'react-router-dom';
import './CategoriesPage.css';
import Loader from '../components/Loader';

const CategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const categoriesRef = collection(db, 'categories');
    const unsubscribe = onSnapshot(categoriesRef, (snapshot) => {
      const categoriesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setCategories(categoriesData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="container">
      {loading ? (
        <Loader />
      ) : (
        <>
          <div className="header">
            <h1>Discussions</h1>
          </div>
          <div className="categories">
            {categories.map((category) => (
              <div key={category.id} className="category-card">
                <h2>{category.name}</h2>
                <p>{category.description}</p>
                <Link to={`/community/${encodeURIComponent(category.id)}`}>
                  View Discussions
                </Link>
              </div>
            ))}
          </div>
          <Link to="/community/create-category" className="create-category">
            Create New Discussion forum
          </Link>
        </>
      )}
    </div>
  );
};

export default CategoriesPage;