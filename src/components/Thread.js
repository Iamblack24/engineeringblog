// src/components/Thread.js

import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase';
import Post from './Post';
import { useNavigate } from 'react-router-dom';
import './Thread.css';

const Thread = ({ thread }) => {
  const [posts, setPosts] = useState([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [isFormVisible, setIsFormVisible] = useState(false); // Toggle form visibility
  const navigate = useNavigate();

  useEffect(() => {
    const postsRef = collection(db, 'categories', thread.categoryId, 'threads', thread.id, 'posts');
    const q = query(postsRef, orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPosts(postsData);
    });

    return () => unsubscribe();
  }, [thread]);

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (newPostContent.trim()) {
      try {
        const userEmail = auth.currentUser.email;
        const truncatedEmail = userEmail.split('@')[0];
        await addDoc(collection(db, 'categories', thread.categoryId, 'threads', thread.id, 'posts'), {
          content: newPostContent,
          user: truncatedEmail || 'Anonymous',
          userId: auth.currentUser.uid,
          createdAt: serverTimestamp(), // Use serverTimestamp for consistency
        });
        setNewPostContent('');
      } catch (error) {
        console.error('Error creating post:', error);
        alert('Failed to create post. Please try again.');
      }
    }
  };

  const handleDeleteThread = async () => {
    if (auth.currentUser && auth.currentUser.uid === thread.userId) {
      if (window.confirm('Are you sure you want to delete this thread and all its contents?')) {
        try {
          // Fetch all posts
          const postsRef = collection(db, 'categories', thread.categoryId, 'threads', thread.id, 'posts');
          const postsSnapshot = await getDocs(postsRef);
          // Delete each post and its nested replies
          for (const postDoc of postsSnapshot.docs) {
            await deletePostAndReplies(thread.categoryId, thread.id, postDoc.id);
            await deleteDoc(postDoc.ref);
          }
          // Delete the thread
          await deleteDoc(doc(db, 'categories', thread.categoryId, 'threads', thread.id));
          // Navigate back to community category page
          navigate(`/community/${encodeURIComponent(thread.categoryId)}`);
        } catch (error) {
          console.error('Error deleting thread:', error);
          alert('Failed to delete thread. Please try again.');
        }
      }
    } else {
      alert('You are not authorized to delete this thread.');
    }
  };

  const deletePostAndReplies = async (categoryId, threadId, postId) => {
    const repliesRef = collection(db, 'categories', categoryId, 'threads', threadId, 'posts', postId, 'replies');
    const repliesSnapshot = await getDocs(repliesRef);
    for (const replyDoc of repliesSnapshot.docs) {
      await deleteReplyAndNestedReplies(categoryId, threadId, postId, replyDoc.id);
      await deleteDoc(replyDoc.ref);
    }
  };

  const deleteReplyAndNestedReplies = async (categoryId, threadId, postId, replyId) => {
    const nestedRepliesRef = collection(db, 'categories', categoryId, 'threads', threadId, 'posts', postId, 'replies', replyId, 'replies');
    const nestedRepliesSnapshot = await getDocs(nestedRepliesRef);
    for (const nestedReplyDoc of nestedRepliesSnapshot.docs) {
      await deleteReplyAndNestedReplies(categoryId, threadId, postId, nestedReplyDoc.id);
      await deleteDoc(nestedReplyDoc.ref);
    }
  };

  const toggleFormVisibility = () => {
    setIsFormVisible(!isFormVisible);
  };

  return (
    <div className="thread">
      <div className="thread-header">
        <div className="user-info">
          <div className="user-icon">
            {thread.user[0].toUpperCase()}
          </div>
          <span className="user-email">{thread.user.split('@')[0]}...</span>
        </div>
        <h2>{thread.title}</h2>
      </div>

      {/* Only show delete button if current user is thread creator */}
      {auth.currentUser && auth.currentUser.uid === thread.userId && (
        <button onClick={handleDeleteThread} className="delete-button">
          Delete Thread
        </button>
      )}

      <div className="posts-list">
        {posts.map((post) => (
          <div key={post.id}>
            <div className="post-meta">
              <div className="user-info">
                <div className="user-icon">
                  {post.user[0].toUpperCase()} {/* First letter of the username */}
                </div>
                <span className="user-email">{post.user.split('@')[0]}...</span>
              </div>
            </div>
            <Post
              post={post}
              threadId={thread.id}
              categoryId={thread.categoryId}
            />
          </div>
        ))}
      </div>

      <button onClick={toggleFormVisibility} className="post-toggle-button">
        {isFormVisible ? 'Close' : 'Post'}
      </button>

      {isFormVisible && (
        <form onSubmit={handleCreatePost} className="post-form">
          <textarea
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
            placeholder="What's on your mind?"
            rows="3"
            required
          />
          <button type="submit">Submit Post</button>
        </form>
      )}
    </div>
  );
};

export default Thread;