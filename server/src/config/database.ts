import { Firestore } from '@google-cloud/firestore';
import { admin } from './firebase';

let db: Firestore | null = null;

/**
 * Initialize and get Firestore instance
 */
export const getFirestore = (): Firestore => {
    if (!db) {
        db = admin.firestore();

        // Configure Firestore settings
        db.settings({
            ignoreUndefinedProperties: true,
        });

        console.log('✅ Firestore initialized');
    }

    return db;
};

/**
 * Collection references with type safety
 */
export const collections = {
    users: () => getFirestore().collection('users'),
    sessions: () => getFirestore().collection('sessions'),
    topologies: () => getFirestore().collection('topologies'),
};

export default getFirestore;
