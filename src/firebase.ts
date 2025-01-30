import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
    apiKey: "AIzaSyB4-aARw9UHrzmAD1KEnO8LFQePYoNhaQo",
    authDomain: "dashboard-4bc76.firebaseapp.com",
    projectId: "dashboard-4bc76",
    storageBucket: "dashboard-4bc76.firebasestorage.app",
    messagingSenderId: "289396172500",
    appId: "1:289396172500:web:cfd749263e90dabcc4bd41"
  };

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Add this line after initializing firebase app
export const storage = getStorage(app);