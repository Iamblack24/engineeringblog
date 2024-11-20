// src/components/InstallPrompt.js
import React, { useEffect, useState } from 'react';
import './InstallPrompt.css';

const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
    };
    
    window.addEventListener('beforeinstallprompt', handler);
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      setDeferredPrompt(null);
      setIsVisible(false);
    });
  };

  if (!isVisible) return null;

  return (
    <div className="install-prompt">
      <p>Install The Engineering Hub for a better experience.</p>
      <button onClick={handleInstallClick}>Install</button>
      <button onClick={() => setIsVisible(false)}>Cancel</button>
    </div>
  );
};

export default InstallPrompt;