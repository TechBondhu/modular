// src/submissionUtils.js
import { initializeFirebase } from './firebaseConfig.js';
import { appState } from './constants.js';
import { showErrorMessage } from './uiUtils.js';

export async function saveSubmission(data, side) {
    const { db } = initializeFirebase();
    try {
        if (!appState.currentUserUid) {
            throw new Error('ইউজার লগইন করেননি।');
        }
        const submissionRef = await db.collection('submissions').add({
            uid: appState.currentUserUid,
            data: data,
            side: side,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            chat_id: side === 'left' ? appState.leftChatId : appState.rightChatId || null
        });
        console.log(`Submission সেভ হয়েছে, ID: ${submissionRef.id}`);
        return submissionRef.id;
    } catch (error) {
        showErrorMessage('Submission সেভে সমস্যা: ' + error.message, side);
        return null;
    }
}
