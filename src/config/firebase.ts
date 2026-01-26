/**
 * Firebase Configuration
 * 
 * Initializes Firebase app with credentials from environment variables.
 * All API keys are stored securely in .env.local (not committed to git).
 */

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';

// Firebase configuration from environment variables
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Validate configuration
const validateConfig = () => {
    const requiredKeys = ['apiKey', 'authDomain', 'projectId'];
    const missing = requiredKeys.filter(key => !firebaseConfig[key as keyof typeof firebaseConfig]);

    if (missing.length > 0) {
        console.warn(
            '⚠️  Firebase configuration incomplete. Missing:',
            missing.join(', '),
            '\nPlease update .env.local with your Firebase credentials.'
        );
    }
};

validateConfig();

// Initialize Firebase (singleton pattern)
let app: FirebaseApp;
let auth: Auth;

if (!getApps().length) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
} else {
    app = getApps()[0];
    auth = getAuth(app);
}

export { app, auth };
