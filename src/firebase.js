import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAJRQD-lwgNOxlAI-8t-6kuPa9Z8Dxa4v8",
  authDomain: "engineering-hub-3045c.firebaseapp.com",
  projectId: "engineering-hub-3045c",
  storageBucket: "engineering-hub-3045c.firebasestorage.app",
  messagingSenderId: "926550146915",
  appId: "1:926550146915:web:eea3796edf2cab4bc29d56",
  measurementId: "G-SHW0R2QQSP"
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

const sendTokenToServer = async (token) => {
  try {
    const response = await fetch('/api/save-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to send token to server: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error sending token to server:', error);
    throw error;
  }
};

export const requestForToken = async () => {
  try {
    const registration = await navigator.serviceWorker.ready;
    const currentToken = await getToken(messaging, { vapidKey: 'BO2fl16htLdJ2LyqPxa95yGk9EE421OfUBu2-6CX_hyuyVh6h9xY2Pnc6ICoE-R0Wf69_WudHVVB6xc4c26RXbw', serviceWorkerRegistration: registration });
    if (currentToken) {
      console.log('current token for client: ', currentToken);
      await sendTokenToServer(currentToken);
    } else {
      console.log('No registration token available. Request permission to generate one.');
    }
  } catch (error) {
    console.error('An error occurred while retrieving token. ', error);
  }
};

export const onMessageListener = () =>
  new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;