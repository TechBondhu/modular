import { initializeFirebase } from './firebaseConfig.js';
import { appState } from './constants.js';
import { loadChatHistory } from './chatHistory.js';
import { startNewChat } from './chatHistory.js';
import { showErrorMessage } from './uiUtils.js';
import { elements } from './constants.js';

export function initializeApp() {
    const { db, auth } = initializeFirebase();
    auth.onAuthStateChanged(user => {
        if (user) {
            appState.currentUserUid = user.uid;
            if (elements.messagesDiv && elements.historyList && elements.messagesDiv) {
                loadChatHistory();
                if (appState.leftChatId) loadChatMessages(appState.leftChatId, 'left');
                else startNewChat('left');
                if (appState.rightChatId) loadChatMessages(appState.rightChatId, 'right');
                else startNewChat('right');
            } else {
                showErrorMessage('DOM elements not found. Please check your HTML.', 'left');
            }
        } else {
            appState.currentUserUid = null;
            window.location.href = 'login.html';
        }
    });
}
