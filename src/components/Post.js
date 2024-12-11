// src/components/Post.js

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
  where
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import Reply from './Reply';
import './Post.css';

const Post = ({ post, threadId, categoryId }) => {
  const [replies, setReplies] = useState([]);
  const [replyContent, setReplyContent] = useState('');
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!post.id) return;
    
    console.log('Fetching replies for post:', post.id);

    // Query for top-level replies only (no parentReplyId)
    const q = query(
      collection(
        db,
        'categories',
        categoryId,
        'threads',
        threadId,
        'posts',
        post.id,
        'replies'
      ),
      where('parentReplyId', '==', null), // Only get top-level replies
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
  }, [categoryId, threadId, post.id]);

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

        // Create the reply document with exact matching fields
        const replyData = {
          content: replyContent.trim(),
          user: truncatedEmail,
          userId: auth.currentUser.uid,
          createdAt: serverTimestamp(),
          level: 1,
          parentReplyId: null
        };

        const replyRef = collection(
          db,
          'categories',
          categoryId,
          'threads',
          threadId,
          'posts',
          post.id,
          'replies'
        );

        await addDoc(replyRef, replyData);
        
        setReplyContent('');
        setShowReplyForm(false);
      } catch (error) {
        console.error('Error adding reply:', error);
        alert('Failed to add reply: ' + error.message);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleDeletePost = async () => {
    if (!auth.currentUser || auth.currentUser.uid !== post.userId) {
      alert('You can only delete your own posts');
      return;
    }

    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        // Delete all replies first
        const repliesRef = collection(
          db,
          'categories',
          categoryId,
          'threads',
          threadId,
          'posts',
          post.id,
          'replies'
        );
        const repliesSnapshot = await getDocs(repliesRef);
        
        // Delete each reply
        for (const replyDoc of repliesSnapshot.docs) {
          await deleteDoc(replyDoc.ref);
        }

        // Delete the post
        await deleteDoc(
          doc(db, 'categories', categoryId, 'threads', threadId, 'posts', post.id)
        );
      } catch (error) {
        console.error('Error deleting post:', error);
        alert('Failed to delete post: ' + error.message);
      }
    }
  };

  return (
    <div className="post">
      <p>{post.content}</p>
      
      {/* Delete Post Button */}
      {auth.currentUser && auth.currentUser.uid === post.userId && (
        <button onClick={handleDeletePost} className="delete-button">
          Delete Post
        </button>
      )}

      {/* Reply Button */}
      <button onClick={() => setShowReplyForm(!showReplyForm)}>
        {showReplyForm ? 'Cancel' : 'Reply'}
      </button>

      {/* Reply Form */}
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
            {isSubmitting ? 'Submitting...' : 'Submit Reply'}
          </button>
        </form>
      )}

      {/* Replies List */}
      <div className="replies-list">
        {replies.map((reply) => (
          <Reply
            key={reply.id}
            reply={reply}
            threadId={threadId}
            categoryId={categoryId}
            postId={post.id}
            parentPath={[post.id]}
            level={1}
          />
        ))}
      </div>
    </div>
  );
};

export default Post;