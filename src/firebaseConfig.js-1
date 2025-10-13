import { firebaseConfig } from './constants.js';

// Firebase SDK Check
if (typeof firebase === 'undefined') throw new Error("Firebase SDK not loaded. Add Firebase CDN in index.html");

export const db = null;
export const auth = null;

export function initializeFirebase() {
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    return {
        db: firebase.firestore(),
        auth: firebase.auth()
    };
}
