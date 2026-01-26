// Common types used across the backend

export interface User {
    uid: string;
    email?: string;
    role: 'student' | 'teacher';
    displayName?: string;
    photoURL?: string;
}

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

export interface ErrorResponse {
    error: string;
    code?: string;
    details?: any;
}
