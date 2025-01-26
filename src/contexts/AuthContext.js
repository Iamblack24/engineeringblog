import React, { createContext, useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { initializeApp } from 'firebase/app';

export const AuthContext = createContext();

const firebaseConfig = {
  apiKey: "AIzaSyAJRQD-lwgNOxlAI-8t-6kuPa9Z8Dxa4v8",
  authDomain: "engineering-hub-3045c.firebaseapp.com",
  projectId: "engineering-hub-3045c",
  storageBucket: "engineering-hub-3045c.firebasestorage.app",
  messagingSenderId: "926550146915",
  appId: "1:926550146915:web:eea3796edf2cab4bc29d56",
  measurementId: "G-SHW0R2QQSP"
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only initialize Firebase Auth on the client side
    if (typeof window !== 'undefined') {
      const app = initializeApp(firebaseConfig);
      const auth = getAuth(app);

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
          setLoading(false);
        });
    } else {
      // We're on the server side
      setLoading(false);
    }
  }, []);

  const value = {
    currentUser,
    isAuthenticated: !!currentUser,
    isLoading: loading
  };

  if (loading) {
    // Optionally render a loading indicator
    return null; // or a loading spinner
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};