// src/components/Reply.js

import React, { useState, useEffect } from 'react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  getDocs,
  where,
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import './Reply.css';

const Reply = ({ reply, threadId, categoryId, parentPath, level }) => {
  const [replies, setReplies] = useState([]);
  const [replyContent, setReplyContent] = useState('');
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // Prevent double submissions

  const postId = parentPath[parentPath.length - 1]; // Assuming parentPath ends with postId or replyId

  useEffect(() => {
    if (!reply.id) return;

    console.log('Fetching nested replies for reply:', reply.id, 'Level:', level);

    const q = query(
      collection(
        db,
        'categories',
        categoryId,
        'threads',
        threadId,
        'posts',
        postId,
        'replies'
      ),
      where('parentReplyId', '==', reply.id),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const repliesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setReplies(repliesData);
    });

    return () => unsubscribe();
  }, [threadId, categoryId, postId, reply.id, level]);

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!auth.currentUser) {
      alert('Please sign in to reply');
      return;
    }

    if (replyContent.trim() && !isSubmitting) {
      setIsSubmitting(true);
      try {
        const userEmail = auth.currentUser.email;
        const truncatedEmail = userEmail.split('@')[0];

        const replyData = {
          content: replyContent.trim(),
          user: truncatedEmail,
          userId: auth.currentUser.uid,
          createdAt: serverTimestamp(),
          parentReplyId: reply.id,
          level: level + 1,
        };

        await addDoc(
          collection(
            db,
            'categories',
            categoryId,
            'threads',
            threadId,
            'posts',
            postId,
            'replies'
          ),
          replyData
        );

        setReplyContent('');
        setShowReplyForm(false);
      } catch (error) {
        console.error('Error adding reply:', error);
        alert('Failed to add reply. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleDeleteReply = async () => {
    if (auth.currentUser && auth.currentUser.uid === reply.userId) {
      if (window.confirm('Are you sure you want to delete this reply and all its nested replies?')) {
        try {
          await deleteReplyAndNestedReplies(categoryId, threadId, postId, reply.id);
          await deleteDoc(doc(db, 'categories', categoryId, 'threads', threadId, 'posts', postId, 'replies', reply.id));
          console.log('Reply and its nested replies deleted successfully.');
        } catch (error) {
          console.error('Error deleting reply:', error);
          alert('Failed to delete reply. Please try again.');
        }
      }
    } else {
      alert('You are not authorized to delete this reply.');
    }
  };

  const deleteReplyAndNestedReplies = async (categoryId, threadId, postId, replyId) => {
    const nestedRepliesRef = collection(
      db,
      'categories',
      categoryId,
      'threads',
      threadId,
      'posts',
      postId,
      'replies',
      replyId,
      'replies'
    );
    const nestedRepliesSnapshot = await getDocs(nestedRepliesRef);
    for (const nestedReplyDoc of nestedRepliesSnapshot.docs) {
      await deleteReplyAndNestedReplies(categoryId, threadId, postId, nestedReplyDoc.id);
      await deleteDoc(nestedReplyDoc.ref);
    }
  };

  return (
    <div className={`reply level-${level}`}>
      <p>{reply.content}</p>
      <p>
        <strong>Replied by:</strong> {reply.user}
      </p>

      {/* Delete Reply Button */}
      {auth.currentUser && auth.currentUser.uid === reply.userId && (
        <button onClick={handleDeleteReply} className="delete-button">
          Delete Reply
        </button>
      )}

      {/* Reply Form */}
      {level < 3 && (
        <>
          <button onClick={() => setShowReplyForm(!showReplyForm)}>
            {showReplyForm ? 'Cancel' : 'Reply'}
          </button>

          {showReplyForm && (
            <form onSubmit={handleReplySubmit} className="reply-form">
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Write a reply..."
                rows="2"
                required
              />
              <button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Reply'}
              </button>
            </form>
          )}
        </>
      )}

      {/* Nested Replies */}
      <div className="replies-list">
        {replies.length > 0 && (
          <div className="nested-replies">
            {replies.map((childReply) => (
              <Reply
                key={childReply.id}
                reply={childReply}
                threadId={threadId}
                categoryId={categoryId}
                parentPath={[...parentPath, reply.id]}
                level={level + 1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Reply;