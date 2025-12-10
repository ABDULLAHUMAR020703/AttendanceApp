// Firebase Configuration
import { initializeApp } from 'firebase/app';
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

// This file is deprecated - use core/config/firebase.js instead
// Re-exporting from core to maintain backward compatibility
export { auth, db, app } from '../core/config/firebase';
