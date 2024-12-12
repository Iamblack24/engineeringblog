// src/components/InstallPrompt.js
import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, updateDoc, increment } from 'firebase/firestore';
import './InstallPrompt.css';

const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  
  // Set a fixed number instead of fetching from database
  const INSTALL_COUNT = 1074; // You can change this number as needed

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
    };
    
    window.addEventListener('beforeinstallprompt', handler);
    
    // Track successful installations
    const installHandler = async () => {
      try {
        // Still update the database count in the background
        const statsRef = doc(db, 'statistics', 'installations');
        await updateDoc(statsRef, {
          count: increment(1)
        });

        // Request notification permission
        if ('Notification' in window) {
          const permission = await Notification.requestPermission();
          if (permission === 'granted') {
            console.log('Notification permission granted');
          }
        }
      } catch (error) {
        console.error('Error updating install count:', error);
      }
    };

    window.addEventListener('appinstalled', installHandler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installHandler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      
      setDeferredPrompt(null);
      setIsVisible(false);
    } catch (error) {
      console.error('Error during installation:', error);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="install-prompt">
      <p>Install The Engineering Hub for quick access and a better experience.</p>
      <p className="install-count">{INSTALL_COUNT} engineers already installed</p>
      <div className="button-container">
        <button 
          onClick={handleInstallClick}
          className="install-button"
        >
          Install
        </button>
        <button 
          onClick={() => setIsVisible(false)}
          className="cancel-button"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default InstallPrompt;