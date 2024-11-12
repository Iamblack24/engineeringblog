import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

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
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
