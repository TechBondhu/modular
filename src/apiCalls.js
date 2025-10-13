import { showTypingIndicator, displayMessage, showErrorMessage } from './uiUtils.js';
import { saveChatHistory } from './chatHistory.js';
import { displayReview } from './reviewUtils.js';
import { elements } from './constants.js';

export async function callFastAPI(message, side) {
    if (side !== 'right') return; // শুধু right side-এর জন্য

    const typingDiv = showTypingIndicator(side);
    try {
        const response = await fetch('http://localhost:8000/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ question: message })
        });

        if (!response.ok) {
            throw new Error('FastAPI error: ' + response.statusText);
        }

        const data = await response.json();
        const botResponse = data.answer;
        displayMessage(botResponse, 'bot', side);
        saveChatHistory(botResponse, 'bot', side);
    } catch (error) {
        showErrorMessage('FastAPI কল করতে সমস্যা: ' + error.message, side);
    } finally {
        typingDiv?.remove();
    }
}

export async function callRasaAPI(message, reviewData = {}, side) {
    if (side !== 'left') return; // শুধু left side-এর জন্য

    const typingDiv = showTypingIndicator(side);
    try {
        const response = await fetch('http://localhost:5005/webhooks/rest/webhook', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sender: 'user', message })
        });

        if (!response.ok) {
            throw new Error('Rasa API error: ' + response.statusText);
        }

        const data = await response.json();
        if (data.length > 0) {
            data.forEach(res => {
                if (res.text) {
                    const botResponse = res.text;
                    displayMessage(botResponse, 'bot', side);
                    saveChatHistory(botResponse, 'bot', side);
                }
                if (res.custom?.review_data) {
                    displayReview(res.custom.review_data, side);
                }
            });
        } else {
            showErrorMessage('Rasa থেকে কোনো রেসপন্স পাওয়া যায়নি।', side);
        }
    } catch (error) {
        showErrorMessage('Rasa API কল করতে সমস্যা: ' + error.message, side);
    } finally {
        typingDiv?.remove();
    }
}
