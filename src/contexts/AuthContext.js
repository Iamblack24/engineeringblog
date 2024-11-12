import React, { createContext, useState, useEffect } from 'react';
import { auth } from '../firebase';
import {
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
} from 'firebase/auth';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set the authentication state persistence
    setPersistence(auth, browserLocalPersistence)
      .then(() => {
        // Start the auth state listener
        const unsubscribe = onAuthStateChanged(auth, (user) => {
          setCurrentUser(user);
          setLoading(false);
        });

        return () => unsubscribe();
      })
      .catch((error) => {
        console.error('Failed to set auth persistence:', error);
      });
  }, []);

  if (loading) {
    // Optionally render a loading indicator
    return null; // or a loading spinner
  }

  return (
    <AuthContext.Provider value={{ currentUser }}>
      {children}
    </AuthContext.Provider>
  );
};