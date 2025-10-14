import { elements, appState } from './constants.js';
import { showErrorMessage, displayMessage, sanitizeMessage } from './uiUtils.js';
import { saveChatHistory } from './chatHistory.js';
import { initializeFirebase } from './firebaseConfig.js';

export function displayReview(reviewData, side) {
    const messagesContainer = side === 'left' ? elements.messagesDiv : elements.messagesRight;
    if (!messagesContainer) return;
    const reviewCard = document.createElement('div');
    reviewCard.classList.add('review-card', 'slide-in');
    reviewCard.setAttribute('data-editable', 'true');
    reviewCard.setAttribute('data-id', Date.now());
    reviewCard.setAttribute('data-confirmed', 'false');
    reviewCard.innerHTML = '<h3>আপনার তথ্য রিভিউ</h3>';
    const reviewContent = document.createElement('div');
    reviewContent.classList.add('review-content');
    for (const [key, value] of Object.entries(reviewData)) {
        const reviewItem = document.createElement('div');
        reviewItem.classList.add('review-item');
        reviewItem.setAttribute('data-key', key);
        const label = document.createElement('label');
        label.textContent = key.charAt(0).toUpperCase() + key.slice(1).replace('_', ' ') + ':';
        reviewItem.appendChild(label);
        if (typeof value === 'string' && (value.startsWith('http') || value.startsWith('data:image'))) {
            const img = document.createElement('img');
            img.src = value;
            reviewItem.appendChild(img);
        } else {
            const p = document.createElement('p');
            p.textContent = value;
            reviewItem.appendChild(p);
        }
        reviewContent.appendChild(reviewItem);
    }
    const buttonContainer = document.createElement('div');
    buttonContainer.classList.add('review-buttons');
    const editBtn = document.createElement('button');
    editBtn.classList.add('edit-btn', 'ripple-btn');
    editBtn.textContent = 'Edit';
    const confirmBtn = document.createElement('button');
    confirmBtn.classList.add('confirm-btn', 'ripple-btn');
    confirmBtn.textContent = 'Confirm';
    let isProcessing = false;
    editBtn.addEventListener('click', () => toggleEdit(reviewCard, editBtn, reviewContent, confirmBtn, reviewData, side));
    confirmBtn.addEventListener('click', async () => {
        if (isProcessing) return;
        isProcessing = true;
        confirmBtn.disabled = true;
        try {
            const chatId = side === 'left' ? appState.leftChatId : appState.rightChatId;
            if (!chatId) throw new Error('চ্যাট আইডি পাওয়া যায়নি।');
            if (!appState.currentUserUid) throw new Error('ইউজার লগইন করেননি।');
            const updatedData = {};
            reviewContent.querySelectorAll('.review-item').forEach(item => {
                const key = item.getAttribute('data-key');
                const value = item.querySelector('p')?.textContent || item.querySelector('img')?.src;
                if (value) updatedData[key] = value;
            });
            const { db } = initializeFirebase();
            await db.collection('submissions').add({
                review_data: updatedData,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                chat_id: chatId,
                uid: appState.currentUserUid
            });
            displayMessage('তথ্য সফলভাবে সংরক্ষিত!', 'bot', side);
            generatePDF(updatedData, reviewCard, side);
            reviewCard.setAttribute('data-confirmed', 'true');
            reviewCard.setAttribute('data-editable', 'false');
            editBtn.disabled = true;
            editBtn.style.display = 'none';
            confirmBtn.style.display = 'none';
            buttonContainer.innerHTML = '';
            const downloadBtn = document.createElement('button');
            downloadBtn.classList.add('download-btn', 'ripple-btn');
            downloadBtn.textContent = 'পিডিএফ ডাউনলোড করুন';
            downloadBtn.addEventListener('click', () => {
                const pdfUrl = reviewCard.getAttribute('data-pdf-url');
                if (pdfUrl) {
                    const link = document.createElement('a');
                    link.href = pdfUrl;
                    link.download = decodeURIComponent(pdfUrl.split('/').pop());
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                } else {
                    showErrorMessage('পিডিএফ ডাউনলোডের জন্য URL পাওয়া যায়নি।', side);
                }
            });
            buttonContainer.appendChild(downloadBtn);
        } catch (error) {
            showErrorMessage('তথ্য সংরক্ষণে সমস্যা: ' + error.message, side);
            confirmBtn.disabled = false;
        } finally {
            isProcessing = false;
        }
    });
    buttonContainer.appendChild(editBtn);
    buttonContainer.appendChild(confirmBtn);
    reviewCard.appendChild(reviewContent);
    reviewCard.appendChild(buttonContainer);
    messagesContainer.appendChild(reviewCard);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

export function toggleEdit(reviewCard, editBtn, reviewContent, confirmBtn, reviewData, side) {
    if (reviewCard.getAttribute('data-confirmed') === 'true') {
        showErrorMessage('ডেটা কনফার্ম হয়ে গেছে। এডিট করা যাবে না।', side);
        return;
    }
    const isEditable = reviewCard.getAttribute('data-editable') === 'true';
    if (!isEditable) {
        reviewCard.setAttribute('data-editable', 'true');
        editBtn.textContent = 'Save';
        confirmBtn.style.display = 'none';
        reviewContent.querySelectorAll('.review-item').forEach(item => {
            const key = item.getAttribute('data-key');
            const value = item.querySelector('p')?.textContent || item.querySelector('img')?.src;
            item.innerHTML = `<label>${sanitizeMessage(key.charAt(0).toUpperCase() + key.slice(1).replace('_', ' '))}:</label>`;
            if (typeof value === 'string' && (value.startsWith('http') || value.startsWith('data:image'))) {
                const img = document.createElement('img');
                img.src = value;
                item.appendChild(img);
                const replaceInput = document.createElement('input');
                replaceInput.type = 'file';
                replaceInput.classList.add('replace-image-input');
                replaceInput.accept = 'image/png, image/jpeg';
                replaceInput.style.display = 'none';
                item.appendChild(replaceInput);
                const replaceIcon = document.createElement('i');
                replaceIcon.classList.add('fas', 'fa-camera', 'replace-image-icon');
                item.appendChild(replaceIcon);
                replaceIcon.addEventListener('click', () => replaceInput.click());
                replaceInput.addEventListener('change', () => {
                    const file = replaceInput.files[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = e => img.src = e.target.result;
                        reader.onerror = () => showErrorMessage('ইমেজ লোডে সমস্যা।', side);
                        reader.readAsDataURL(file);
                    }
                });
            } else {
                const input = document.createElement('input');
                input.type = 'text';
                input.value = value || '';
                input.classList.add('edit-input');
                item.appendChild(input);
            }
        });
    } else {
        const updatedData = { ...reviewData };
        reviewContent.querySelectorAll('.review-item').forEach(item => {
            const key = item.getAttribute('data-key');
            const input = item.querySelector('input.edit-input');
            const img = item.querySelector('img');
            if (input) {
                const newValue = input.value.trim();
                updatedData[key] = newValue;
                item.innerHTML = `<label>${sanitizeMessage(key.charAt(0).toUpperCase() + key.slice(1).replace('_', ' '))}:</label><p>${sanitizeMessage(newValue)}</p>`;
            } else if (img) {
                updatedData[key] = img.src;
                item.innerHTML = `<label>${sanitizeMessage(key.charAt(0).toUpperCase() + key.slice(1).replace('_', ' '))}:</label><img src="${img.src}" />`;
            }
        });
        reviewCard.setAttribute('data-editable', 'false');
        editBtn.textContent = 'Edit';
        confirmBtn.style.display = 'inline-block';
    }
}

export function generatePDF(reviewData, reviewCard, side) {
    const formType = reviewData.form_type || 'generic';
    const payload = {
        reviewData: Object.fromEntries(
            Object.entries(reviewData).map(([key, value]) => [
                key,
                typeof value === 'string' && (value.startsWith('http') || value.startsWith('data:image')) ? '[Image]' : value
            ])
        ),
        formType
    };
    fetch('http://localhost:5000/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
        .then(response => response.json())
        .then(data => {
            if (data.pdf_url) {
                reviewCard.setAttribute('data-pdf-url', data.pdf_url);
                displayMessage('PDF তৈরি ও আপলোড সফল!', 'bot', side);
                saveChatHistory('PDF তৈরি সফল।', 'bot', side);
            } else {
                throw new Error(data.error || 'PDF generation failed');
            }
        })
        .catch(error => {
            showErrorMessage('PDF তৈরিতে সমস্যা: ' + error.message, side);
            saveChatHistory('PDF error: ' + error.message, 'bot', side);
        });
}
