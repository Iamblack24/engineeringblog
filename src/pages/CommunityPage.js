import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

const CommunityPage = () => {
  const { categoryId } = useParams();
  const [threads, setThreads] = useState([]);

  useEffect(() => {
    if (categoryId) {
      const threadsRef = collection(db, 'categories', categoryId, 'threads');
      const q = query(threadsRef, orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const threadsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setThreads(threadsData);
      });

      return () => unsubscribe();
    }
  }, [categoryId]);

  if (!categoryId) {
    return <div className="container community-page">Category not found.</div>;
  }

  return (
    <div className="container community-page">
      {/* Header Section */}
      <div className="header">
        <h1>Threads</h1>
      </div>

      {/* Threads List Section */}
      <div className="posts-list">
        {threads.length > 0 ? (
          threads.map((thread) => (
            <div key={thread.id} className="post-card">
              <Link
                to={`/community/${encodeURIComponent(categoryId)}/threads/${thread.id}`}
                className="post-card-link"
              >
                <h3>{thread.title}</h3>
              </Link>
              <p className="post-card-meta">
                <strong>Started by:</strong> {thread.user}
              </p>
            </div>
          ))
        ) : (
          <p className="no-threads">No threads found in this category.</p>
        )}
      </div>

      {/* Create New Thread Button */}
      <Link
        to={`/community/${encodeURIComponent(categoryId)}/new-thread`}
        className="create-thread"
      >
        Create New Thread
      </Link>
    </div>
  );
};

export default CommunityPage;
