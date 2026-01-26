/**
 * Authentication Service
 * 
 * Provides secure authentication methods using Firebase Auth with Google OAuth.
 * Handles sign-in, sign-out, and auth state management.
 */

import {
    signInWithPopup,
    signOut as firebaseSignOut,
    GoogleAuthProvider,
    onAuthStateChanged,
    User,
    Auth,
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { AppUser, UserRole } from '../types/auth';

/**
 * Google OAuth Provider with custom parameters
 */
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
    prompt: 'select_account', // Always show account selection
});

/**
 * Convert Firebase User to AppUser
 */
export const convertFirebaseUser = (firebaseUser: User): AppUser => {
    return {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        role: 'student' as UserRole, // Default role, can be updated via backend/Firestore
        lastLogin: new Date().toISOString(),
    };
};

/**
 * Sign in with Google using popup
 * @returns Promise<AppUser>
 * @throws AuthError if sign-in fails
 */
export const signInWithGoogle = async (): Promise<AppUser> => {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        const user = convertFirebaseUser(result.user);

        // Log successful authentication (remove in production if needed)
        console.log('✅ User authenticated:', user.email);

        return user;
    } catch (error: any) {
        // Handle specific error codes
        if (error.code === 'auth/popup-blocked') {
            throw new Error('Popup was blocked. Please allow popups for this site.');
        } else if (error.code === 'auth/popup-closed-by-user') {
            throw new Error('Sign-in cancelled. Please try again.');
        } else if (error.code === 'auth/network-request-failed') {
            throw new Error('Network error. Please check your connection.');
        }

        console.error('Authentication error:', error);
        throw new Error(error.message || 'Failed to sign in with Google');
    }
};

/**
 * Sign out the current user
 */
export const signOut = async (): Promise<void> => {
    try {
        await firebaseSignOut(auth);
        console.log('✅ User signed out');
    } catch (error: any) {
        console.error('Sign out error:', error);
        throw new Error('Failed to sign out');
    }
};

/**
 * Subscribe to authentication state changes
 * @param callback Function to call when auth state changes
 * @returns Unsubscribe function
 */
export const subscribeToAuthState = (
    callback: (user: AppUser | null) => void
): (() => void) => {
    return onAuthStateChanged(auth, (firebaseUser) => {
        if (firebaseUser) {
            callback(convertFirebaseUser(firebaseUser));
        } else {
            callback(null);
        }
    });
};

/**
 * Get current ID token for API authentication
 * @param forceRefresh Force token refresh
 * @returns Promise<string | null>
 */
export const getCurrentToken = async (forceRefresh = false): Promise<string | null> => {
    try {
        const currentUser = auth.currentUser;
        if (!currentUser) return null;

        return await currentUser.getIdToken(forceRefresh);
    } catch (error) {
        console.error('Token retrieval error:', error);
        return null;
    }
};
