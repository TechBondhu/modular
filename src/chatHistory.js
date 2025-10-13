import { initializeFirebase } from './firebaseConfig.js';
import { appState, elements } from './constants.js';
import { showErrorMessage, displayMessage } from './uiUtils.js';
import { loadChatMessages } from './chatHistory.js'; // Self-import for recursion

let currentChatId = null; // Local for rename/delete

export async function startNewChat(side) {
    if (!appState.currentUserUid) return showErrorMessage('ইউজার লগইন করেননি।', side);
    const messagesContainer = side === 'left' ? elements.messagesDiv : elements.messagesRight;
    if (!messagesContainer) return showErrorMessage('Messages container not found', side);
    const { db } = initializeFirebase();
    try {
        const chatRef = await db.collection('chats').add({
            uid: appState.currentUserUid,
            name: `${side === 'left' ? 'নতুন আবেদন চ্যাট' : 'নতুন প্রশ্ন চ্যাট'}`,
            last_message: 'চ্যাট শুরু হয়েছে',
            created_at: firebase.firestore.FieldValue.serverTimestamp(),
            updated_at: firebase.firestore.FieldValue.serverTimestamp(),
            side: side
        });
        const chatId = chatRef.id;
        if (side === 'left') {
            appState.leftChatId = chatId;
            localStorage.setItem('leftChatId', appState.leftChatId);
        } else {
            appState.rightChatId = chatId;
            localStorage.setItem('rightChatId', appState.rightChatId);
        }
        await db.collection('chats').doc(chatId).collection('messages').add({
            message: 'Chat session started',
            sender: 'system',
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            uid: appState.currentUserUid
        });
        messagesContainer.innerHTML = '';
        showWelcomeMessage(side);
        await loadChatHistory();
    } catch (error) {
        showErrorMessage('নতুন চ্যাট শুরু করতে সমস্যা: ' + error.message, side);
    }
}

export async function saveChatHistory(message, sender, side) {
    if (!appState.currentUserUid) return showErrorMessage('ইউজার লগইন করেননি।', side);
    if (!message || typeof message !== 'string') return showErrorMessage('অবৈধ মেসেজ।', side);
    let chatId = side === 'left' ? appState.leftChatId : appState.rightChatId;
    if (!chatId) await startNewChat(side);
    chatId = side === 'left' ? appState.leftChatId : appState.rightChatId;
    if (!chatId) return showErrorMessage('চ্যাট তৈরি ব্যর্থ।', side);
    const { db } = initializeFirebase();
    try {
        const chatDoc = await db.collection('chats').doc(chatId).get();
        if (!chatDoc.exists) return showErrorMessage('চ্যাট ডকুমেন্ট পাওয়া যায়নি।', side);
        await db.collection('chats').doc(chatId).collection('messages').add({
            uid: appState.currentUserUid,
            message,
            sender,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        await db.collection('chats').doc(chatId).update({
            last_message: message.substring(0, 50),
            updated_at: firebase.firestore.FieldValue.serverTimestamp()
        });
    } catch (error) {
        showErrorMessage('চ্যাট হিস্ট্রি সেভ করতে সমস্যা: ' + error.message, side);
    }
}

export async function loadChatMessages(chatId, side) {
    const messagesContainer = side === 'left' ? elements.messagesDiv : elements.messagesRight;
    if (!messagesContainer) return;
    if (side === 'left') appState.leftChatId = chatId;
    else appState.rightChatId = chatId;
    localStorage.setItem(`${side}ChatId`, chatId);
    messagesContainer.innerHTML = '';
    const { db } = initializeFirebase();
    try {
        const snapshot = await db.collection('chats').doc(chatId).collection('messages')
            .orderBy('timestamp', 'asc').get();
        let hasNonSystemMessages = false;
        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.sender !== 'system') {
                displayMessage(data.message, data.sender, side);
                hasNonSystemMessages = true;
            }
        });
        if (side === 'left') {
            const submissions = await db.collection('submissions').where('chat_id', '==', chatId).get();
            submissions.forEach(doc => {
                const sub = doc.data();
                if (sub.review_data) displayReview(sub.review_data, side);
            });
        }
        if (hasNonSystemMessages) {
            hideWelcomeMessage(side);
        } else {
            showWelcomeMessage(side);
        }
    } catch (error) {
        showErrorMessage('মেসেজ লোডে সমস্যা: ' + error.message, side);
    }
}

export async function loadChatHistory(searchTerm = '') {
    if (!appState.currentUserUid || !elements.historyList) return;
    elements.historyList.innerHTML = '';
    const { db } = initializeFirebase();
    try {
        let query = db.collection('chats').where('uid', '==', appState.currentUserUid).orderBy('updated_at', 'desc');
        const snapshot = await query.get();
        snapshot.forEach(doc => {
            const data = doc.data();
            if (searchTerm && !data.name.toLowerCase().includes(searchTerm.toLowerCase())) return;
            const item = document.createElement('div');
            item.classList.add('history-item');
            item.innerHTML = `
                <span class="history-name">${sanitizeMessage(data.name)}</span>
                <span class="history-last">${sanitizeMessage(data.last_message.substring(0, 30)) + '...'}</span>
                <i class="fas fa-edit rename-icon" data-id="${doc.id}"></i>
                <i class="fas fa-trash delete-icon" data-id="${doc.id}"></i>
            `;
            item.addEventListener('click', () => loadChatMessages(doc.id, data.side));
            elements.historyList.appendChild(item);
        });
        // Event listeners for delete and rename icons
        document.querySelectorAll('.delete-icon').forEach(icon => {
            icon.addEventListener('click', e => {
                e.stopPropagation();
                currentChatId = e.target.getAttribute('data-id');
                elements.deleteModal.style.display = 'block';
            });
        });
        document.querySelectorAll('.rename-icon').forEach(icon => {
            icon.addEventListener('click', e => {
                e.stopPropagation();
                currentChatId = e.target.getAttribute('data-id');
                elements.renameInput.value = '';
                elements.renameModal.style.display = 'block';
            });
        });
    } catch (error) {
        console.error('চ্যাট হিস্ট্রি লোডে সমস্যা: ' + error.message);
    }
}

export async function deleteChat() {
    if (!currentChatId) return;
    const { db } = initializeFirebase();
    try {
        await db.collection('chats').doc(currentChatId).delete();
        await loadChatHistory();
        elements.deleteModal.style.display = 'none';
        if (currentChatId === appState.leftChatId) {
            appState.leftChatId = null;
            localStorage.removeItem('leftChatId');
            startNewChat('left');
        } else if (currentChatId === appState.rightChatId) {
            appState.rightChatId = null;
            localStorage.removeItem('rightChatId');
            startNewChat('right');
        }
    } catch (error) {
        showErrorMessage('চ্যাট ডিলিটে সমস্যা: ' + error.message);
    }
}

export async function renameChat() {
    if (!currentChatId) return;
    const newName = elements.renameInput.value.trim();
    if (!newName) return showErrorMessage('নতুন নাম দিন।');
    const { db } = initializeFirebase();
    try {
        await db.collection('chats').doc(currentChatId).update({ name: newName });
        await loadChatHistory();
        elements.renameModal.style.display = 'none';
    } catch (error) {
        showErrorMessage('চ্যাট রিনেমে সমস্যা: ' + error.message);
    }
}
