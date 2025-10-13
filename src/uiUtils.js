import { elements, appState } from './constants.js';

export function sanitizeMessage(message) {
    const div = document.createElement('div');
    div.textContent = message;
    return div.innerHTML;
}

export function displayMessage(message, sender, side) {
    const messagesContainer = side === 'left' ? elements.messagesDiv : elements.messagesRight;
    if (!messagesContainer) {
        console.error(`${side} messages container not found`);
        return;
    }
    const messageDiv = document.createElement('div');
    messageDiv.classList.add(sender === 'user' ? 'user-message' : 'bot-message', 'slide-in');
    if (typeof message === 'string' && (message.startsWith('http') || message.startsWith('data:image'))) {
        const img = document.createElement('img');
        img.src = message;
        img.classList.add('chat-image');
        img.alt = 'Uploaded Image';
        img.addEventListener('click', () => openImageModal(message));
        messageDiv.appendChild(img);
    } else {
        messageDiv.innerHTML = sanitizeMessage(message);
    }
    if (side === 'right') {
        messageDiv.style.margin = '10px 0';
        messageDiv.style.padding = '10px';
        messageDiv.style.borderRadius = '8px';
        messageDiv.style.backgroundColor = sender === 'user' ? '#e0f7fa' : '#f1f8e9';
    }
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

export function showErrorMessage(message, side) {
    console.error(message);
    displayMessage(sanitizeMessage(message), 'bot', side);
}

export function hideWelcomeMessage(side) {
    const welcome = side === 'left' ? elements.welcomeMessage : elements.welcomeMessageRight;
    if (welcome && welcome.style.display !== 'none') {
        welcome.classList.add('fade-out');
        setTimeout(() => {
            welcome.style.display = 'none';
            welcome.classList.remove('fade-out');
        }, 300);
    }
}

export function showWelcomeMessage(side) {
    const welcome = side === 'left' ? elements.welcomeMessage : elements.welcomeMessageRight;
    if (welcome && welcome.style.display === 'none') {
        welcome.style.display = 'block';
    }
}

export function showTypingIndicator(side) {
    const messagesContainer = side === 'left' ? elements.messagesDiv : elements.messagesRight;
    if (!messagesContainer) {
        console.error(`${side} messages container not found`);
        return null;
    }
    const typingDiv = document.createElement('div');
    typingDiv.classList.add('typing-indicator');
    typingDiv.innerHTML = '<span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span>';
    messagesContainer.appendChild(typingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    return typingDiv;
}
