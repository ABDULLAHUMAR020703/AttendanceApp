// Firebase Configuration
import { initializeApp, getApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Firebase configuration
// Get these values from your Firebase project settings
const firebaseConfig = {
  apiKey: "AIzaSyByLF4IV7KNfVHkFywimANGoWo_2mpdb2E",
  authDomain: "attendanceapp-8c711.firebaseapp.com",
  projectId: "attendanceapp-8c711",
  storageBucket: "attendanceapp-8c711.firebasestorage.app",
  messagingSenderId: "481410140032",
  appId: "1:481410140032:web:3667cba45c34463259e365",
  measurementId: "G-KTWFRYJSER"
};

let app;
let auth;
let db;

try {
  // Check if Firebase app is already initialized
  try {
    app = initializeApp(firebaseConfig);
  } catch (initError) {
    // If already initialized, get the existing app
    if (initError.code === 'app/already-initialized' || initError.message?.includes('already-initialized')) {
      app = getApp();
    } else {
      throw initError;
    }
  }
  
  // Initialize Firebase Auth with AsyncStorage persistence
  try {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage)
    });
  } catch (authError) {
    // If auth is already initialized, get the existing auth
    if (authError.code === 'auth/already-initialized' || authError.message?.includes('already-initialized')) {
      auth = getAuth(app);
    } else {
      throw authError;
    }
  }
  
  // Initialize Firestore
  try {
    db = initializeFirestore(app, {
      experimentalForceLongPolling: true, // For React Native compatibility
    });
  } catch (dbError) {
    // If Firestore is already initialized, get the existing instance
    if (dbError.code === 'failed-precondition' || dbError.message?.includes('already been initialized')) {
      db = getFirestore(app);
    } else {
      throw dbError;
    }
  }
  
  console.log('✓ Firebase initialized successfully');
} catch (error) {
  console.error('✗ Firebase initialization error:', error);
  
  // Fallback: try to get existing instances
  try {
    if (!app) {
      app = getApp();
    }
    if (!auth) {
      auth = getAuth(app);
    }
    if (!db) {
      db = getFirestore(app);
    }
    console.log('✓ Firebase instances retrieved successfully');
  } catch (fallbackError) {
    console.error('✗ Failed to get Firebase instances:', fallbackError);
  }
}

// Ensure app is initialized before exporting
if (!app) {
  console.error('✗ Firebase app was not initialized!');
}

export { auth, db, app };
