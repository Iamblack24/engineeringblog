// src/pages/ThreadDetail.js

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import Thread from '../components/Thread';
import { db } from '../firebase';
import './ThreadDetail.css';

const ThreadDetail = () => {
  const { categoryId, threadId } = useParams();
  const [thread, setThread] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchThread = async () => {
      try {
        if (!categoryId || !threadId) {
          setThread(null);
          setLoading(false);
          return;
        }

        const threadDocRef = doc(db, 'categories', categoryId, 'threads', threadId);
        const threadSnap = await getDoc(threadDocRef);

        if (threadSnap.exists()) {
          setThread({ id: threadSnap.id, ...threadSnap.data() });
        } else {
          setThread(null);
        }
      } catch (error) {
        console.error('Error fetching thread:', error);
        setThread(null);
      } finally {
        setLoading(false);
      }
    };

    fetchThread();
  }, [categoryId, threadId]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!thread) {
    return <div>Thread not found.</div>;
  }

  return (
    <div className="thread-detail">
      <Thread thread={thread} />
    </div>
  );
};

export default ThreadDetail;