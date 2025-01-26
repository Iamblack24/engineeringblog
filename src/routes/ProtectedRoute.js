import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { currentUser, isLoading } = useContext(AuthContext);
  const location = useLocation();

  // Handle the loading state
  if (isLoading) {
    return null; // or a loading spinner
  }

  // Check if we're on the server side
  if (typeof window === 'undefined') {
    return null;
  }

  if (!currentUser) {
    // Save the attempted URL for redirecting after login
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;