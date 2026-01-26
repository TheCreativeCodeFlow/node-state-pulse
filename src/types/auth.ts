/**
 * User Authentication Types
 */

export type UserRole = 'student' | 'teacher' | 'admin';

export interface AppUser {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    role: UserRole;
    createdAt?: string;
    lastLogin?: string;
}

export interface AuthState {
    user: AppUser | null;
    loading: boolean;
    error: string | null;
    initialized: boolean;
}

export interface AuthError {
    code: string;
    message: string;
}
