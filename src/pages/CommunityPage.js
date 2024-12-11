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
        const threadsData = snapshot.docs.map((doc, index) => ({
          id: doc.id,
          ...doc.data(),
          animationOrder: index
        }));
        setThreads(threadsData);
      });

      return () => unsubscribe();
    }
  }, [categoryId]);

  if (!categoryId) {
    return <div className="community-page">Category not found.</div>;
  }

  return (
    <div className="community-page">
      <div className="header">
        <h1>Threads</h1>
      </div>

      <div className="posts-list">
        {threads.length > 0 ? (
          threads.map((thread) => (
            <div 
              key={thread.id} 
              className="post-card"
              style={{"--animation-order": thread.animationOrder}}
            >
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
