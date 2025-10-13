import { initializeApp } from './auth.js';
import { elements, appState } from './constants.js';
import { callRasaAPI, callFastAPI } from './apiCalls.js';
import { displayMessage, hideWelcomeMessage } from './uiUtils.js';
import { saveChatHistory } from './chatHistory.js';
import { openGenresModal, openGenres2Modal, closeGenresModal, closeGenres2Modal, setupWelcomeButtons } from './genresModals.js';
import { setupSidebarModals, toggleSidebar } from './sidebar.js';
import { setupVideoModal } from './videoModal.js';
import { setupResizableDivider } from './resizableDivider.js';
import { handleFileInputChange, handlePreviewClick, handlePreviewDblClick, handleEditControl, applyEdit } from './imageUtils.js';
import { clearPreview, openImageModal } from './imageUtils.js';

// Send Message Function (centralized)
async function sendMessage(side) {
    const userInput = side === 'left' ? elements.userInput : elements.userInputRight;
    const message = userInput.value.trim();
    
    // ইমেজ চেক করো (editedImage অগ্রাধিকার দাও, না থাকলে selectedFile)
    let imageData = appState.editedImage; // Base64 if edited
    if (!imageData && appState.selectedFile) {
        // যদি edited না হয়, selectedFile থেকে Base64 তৈরি করো
        const reader = new FileReader();
        reader.readAsDataURL(appState.selectedFile);
        await new Promise(resolve => {
            reader.onload = () => {
                imageData = reader.result;
                resolve();
            };
        });
    }
    
    // যদি মেসেজ বা ইমেজ না থাকে, তাহলে ফেরত যাও
    if (!message && !imageData) return;
    
    // ইউজার মেসেজ ডিসপ্লে (টেক্সট)
    if (message) {
        displayMessage(message, 'user', side);
        saveChatHistory(message, 'user', side);
    }
    
    // ইমেজ ডিসপ্লে এবং সেভ
    if (imageData) {
        displayMessage(imageData, 'user', side); // displayMessage ইমেজ হ্যান্ডেল করবে
        saveChatHistory(imageData, 'user', side); // ইমেজ হিস্ট্রিতে সেভ
    }
    
    // ইনপুট এবং প্রিভিউ ক্লিয়ার
    userInput.value = '';
    clearPreview(side);
    hideWelcomeMessage(side);
    
    // API কল (শুধু টেক্সটের জন্য, ইমেজ এখনো পাঠানো হবে না)
    if (message) {
        if (side === 'left') {
            callRasaAPI(message, {}, side);
        } else {
            callFastAPI(message, side);
        }
    }
}

// DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    if (!elements.messagesDiv || !elements.historyList || !elements.messagesRight) {
        console.error('Critical DOM elements not found. Please check your HTML.');
        return;
    }
    initializeApp();
    elements.historyIcon?.addEventListener('click', toggleSidebar);
    elements.closeSidebar?.addEventListener('click', () => toggleSidebar()); // Close toggle

    // Send buttons and inputs
    elements.sendBtn?.addEventListener('click', () => sendMessage('left'));
    elements.userInput?.addEventListener('keypress', e => {
        if (e.key === 'Enter' && !e.repeat) sendMessage('left');
    });
    elements.sendBtnRight?.addEventListener('click', () => sendMessage('right'));
    elements.userInputRight?.addEventListener('keypress', e => {
        if (e.key === 'Enter' && !e.repeat) sendMessage('right');
    });

    // Upload handlers
    elements.uploadBtn?.addEventListener('click', () => elements.fileInput?.click());
    elements.fileInput?.addEventListener('change', () => handleFileInputChange('left', elements.fileInput, elements.previewImage, elements.previewContainer));
    elements.uploadBtnRight?.addEventListener('click', () => elements.fileInputRight?.click());
    elements.fileInputRight?.addEventListener('change', () => handleFileInputChange('right', elements.fileInputRight, elements.previewImageRight, elements.previewContainerRight));

    // Preview handlers
    elements.previewImage?.addEventListener('click', () => handlePreviewClick(elements.previewImage, 'left'));
    elements.previewImageRight?.addEventListener('click', () => handlePreviewClick(elements.previewImageRight, 'right'));
    elements.previewImage?.addEventListener('dblclick', () => handlePreviewDblClick(elements.previewImage, 'left'));
    elements.previewImageRight?.addEventListener('dblclick', () => handlePreviewDblClick(elements.previewImageRight, 'right'));

    // Edit controls
    elements.cropX?.addEventListener('input', e => handleEditControl(e.target, 'cropX'));
    elements.cropY?.addEventListener('input', e => handleEditControl(e.target, 'cropY'));
    elements.cropWidth?.addEventListener('input', e => handleEditControl(e.target, 'cropWidth'));
    elements.cropHeight?.addEventListener('input', e => handleEditControl(e.target, 'cropHeight'));
    elements.brightness?.addEventListener('input', e => handleEditControl(e.target, 'brightness'));
    elements.contrast?.addEventListener('input', e => handleEditControl(e.target, 'contrast'));
    elements.backgroundColor?.addEventListener('change', e => handleEditControl(e.target, 'bgColor'));
    elements.editApplyBtn?.addEventListener('click', applyEdit);
    elements.editCancelBtn?.addEventListener('click', () => {
        if (elements.editModal) elements.editModal.style.display = 'none';
    });

    // Image review modal
    elements.imageReviewModal?.addEventListener('click', e => {
        if (e.target === elements.imageReviewModal || e.target === elements.deleteImageBtn) {
            if (elements.imageReviewModal) elements.imageReviewModal.style.display = 'none';
        }
    });
    elements.deleteImageBtn?.addEventListener('click', () => {
        clearPreview('left');
        clearPreview('right');
        if (elements.imageReviewModal) elements.imageReviewModal.style.display = 'none';
    });

    // More options
    elements.moreOptionsBtn?.addEventListener('click', openGenresModal);
    elements.moreOptionsBtnRight?.addEventListener('click', openGenres2Modal);
    elements.closeGenresModal?.addEventListener('click', closeGenresModal);
    elements.closeGenres2Modal?.addEventListener('click', closeGenres2Modal);

    // Setup other modules
    setupWelcomeButtons();
    setupSidebarModals();
    setupVideoModal();
    setupResizableDivider();
});
