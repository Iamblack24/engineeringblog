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
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import Reply from './Reply';
import './Post.css';

const Post = ({ post, threadId, categoryId }) => {
  const [replies, setReplies] = useState([]);
  const [replyContent, setReplyContent] = useState('');
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // Prevent double submissions

  const postId = post.id; // Extract postId

  useEffect(() => {
    if (!postId) {
      console.error('Post ID is undefined');
      return;
    }

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
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const repliesData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setReplies(repliesData);
      },
      (error) => {
        console.error('Error fetching replies:', error);
      }
    );

    return () => unsubscribe();
  }, [threadId, categoryId, postId]); // Use postId instead of post

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    console.log('handleReplySubmit called'); // Debugging log

    if (replyContent.trim() && !isSubmitting) { // Prevent multiple submissions
      setIsSubmitting(true); // Set submitting state
      try {
        const userEmail = auth.currentUser.email;
        const truncatedEmail = userEmail.split('@')[0];
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
          {
            content: replyContent,
            user: truncatedEmail || 'Anonymous',
            userId: auth.currentUser.uid,
            createdAt: serverTimestamp(), // Use serverTimestamp for consistency
          }
        );
        console.log('Reply submitted successfully.');
        setReplyContent('');
        setShowReplyForm(false);
      } catch (error) {
        console.error('Error adding reply:', error);
        alert('Failed to add reply. Please try again.');
      } finally {
        setIsSubmitting(false); // Reset submitting state
        console.log('Submission state reset.');
      }
    } else {
      console.log('Submission prevented: Either empty content or already submitting.');
    }
  };

  const handleDeletePost = async () => {
    if (auth.currentUser && auth.currentUser.uid === post.userId) {
      if (window.confirm('Are you sure you want to delete this post and all its replies?')) {
        try {
          await deletePostAndReplies(categoryId, threadId, postId);
          await deleteDoc(
            doc(db, 'categories', categoryId, 'threads', threadId, 'posts', postId)
          );
          console.log('Post and its replies deleted successfully.');
        } catch (error) {
          console.error('Error deleting post:', error);
          alert('Failed to delete post. Please try again.');
        }
      }
    } else {
      alert('You are not authorized to delete this post.');
    }
  };

  const deletePostAndReplies = async (categoryId, threadId, postId) => {
    const repliesRef = collection(
      db,
      'categories',
      categoryId,
      'threads',
      threadId,
      'posts',
      postId,
      'replies'
    );
    const repliesSnapshot = await getDocs(repliesRef);
    for (const replyDoc of repliesSnapshot.docs) {
      await deleteReplyAndNestedReplies(
        categoryId,
        threadId,
        postId,
        replyDoc.id
      );
      await deleteDoc(replyDoc.ref);
    }
  };

  const deleteReplyAndNestedReplies = async (
    categoryId,
    threadId,
    postId,
    replyId
  ) => {
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
      await deleteReplyAndNestedReplies(
        categoryId,
        threadId,
        postId,
        nestedReplyDoc.id
      );
      await deleteDoc(nestedReplyDoc.ref);
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

      {/* Toggle Reply Form */}
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
            {isSubmitting ? 'Submitting...' : 'Reply'}
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
            parentPath={['posts', postId]}
            level={1}
          />
        ))}
      </div>
    </div>
  );
};

export default Post;