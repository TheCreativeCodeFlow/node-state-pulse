import admin from 'firebase-admin';

let firebaseInitialized = false;

// Initialize Firebase Admin SDK
const initializeFirebase = () => {
    try {
        // Check if already initialized
        if (admin.apps.length > 0) {
            firebaseInitialized = true;
            return admin.app();
        }

        // Check for credentials
        const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

        if (!process.env.FIREBASE_PROJECT_ID || !privateKey || !process.env.FIREBASE_CLIENT_EMAIL) {
            console.warn('⚠️  Firebase credentials missing - running in limited mode');
            console.warn('   Auth features will not work without proper Firebase service account');
            return null;
        }

        // Check for placeholder key
        if (privateKey.includes('PLACEHOLDER')) {
            console.warn('⚠️  Firebase using placeholder key - auth features disabled');
            console.warn('   Get service account key from Firebase Console > Project Settings > Service Accounts');
            return null;
        }

        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                privateKey: privateKey,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            })
        });

        firebaseInitialized = true;
        console.log('✅ Firebase Admin initialized successfully');
        return admin.app();
    } catch (error) {
        console.error('❌ Firebase initialization failed:', error);
        console.warn('   Server will start but auth features will be limited');
        return null;
    }
};

// Initialize on module load
initializeFirebase();

export { admin, firebaseInitialized };
export default admin;
