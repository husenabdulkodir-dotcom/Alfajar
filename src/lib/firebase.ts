import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Main Applet Firebase
const app = !getApps().some(a => a.name === '[DEFAULT]') ? initializeApp(firebaseConfig) : getApp();

export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// External Ekskul Firebase Project (sistem-kesiswaan-b68a0)
export const ekskulFirebaseConfig = {
  apiKey: "AIzaSyAoV1g6IsU9MFmj9VBU8dsLHvy-_0R6W2o",
  authDomain: "sistem-kesiswaan-b68a0.firebaseapp.com",
  projectId: "sistem-kesiswaan-b68a0",
  storageBucket: "sistem-kesiswaan-b68a0.firebasestorage.app",
  messagingSenderId: "422315964590",
  appId: "1:422315964590:web:84475ebd5c300f6f74d53f",
  measurementId: "G-1HSZH7ML5E"
};

const ekskulAppName = 'ekskulApp';
const ekskulApp = !getApps().some(a => a.name === ekskulAppName)
  ? initializeApp(ekskulFirebaseConfig, ekskulAppName)
  : getApp(ekskulAppName);

export const ekskulDb = getFirestore(ekskulApp);

export default app;

