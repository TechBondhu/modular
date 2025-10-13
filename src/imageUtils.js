import { elements, appState, image } from './constants.js';
import { showErrorMessage } from './uiUtils.js';
import { openImageModal } from './imageUtils.js'; // Self-import
import { callRasaAPI } from './apiCalls.js';

export function clearPreview(side) {
    appState.selectedFile = null;
    appState.editedImage = null;
    const previewImage = side === 'left' ? elements.previewImage : elements.previewImageRight;
    const previewContainer = side === 'left' ? elements.previewContainer : elements.previewContainerRight;
    if (previewImage) previewImage.src = '';
    if (previewContainer) previewContainer.style.display = 'none';
}

export function openImageModal(src) {
    if (elements.reviewImage) elements.reviewImage.src = src;
    if (elements.imageReviewModal) elements.imageReviewModal.style.display = 'block';
}

export function drawImage() {
    const ctx = elements.editCanvas?.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, elements.editCanvas.width, elements.editCanvas.height);
    ctx.fillStyle = appState.bgColor === 'transparent' ? 'rgba(0,0,0,0)' : appState.bgColor;
    ctx.fillRect(0, 0, elements.editCanvas.width, elements.editCanvas.height);
    ctx.filter = `brightness(${100 + appState.brightnessValue}%) contrast(${100 + appState.contrastValue}%)`;
    ctx.drawImage(image, 0, 0);
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 2;
    ctx.strokeRect(appState.cropRect.x, appState.cropRect.y, appState.cropRect.width, appState.cropRect.height);
    ctx.filter = 'none';
}

// File input change handler (export as function for main.js)
export function handleFileInputChange(side, fileInput, previewImage, previewContainer) {
    const file = fileInput.files[0];
    if (file) {
        appState.selectedFile = file;
        const reader = new FileReader();
        reader.onload = e => {
            if (previewImage) previewImage.src = e.target.result;
            if (previewContainer) previewContainer.style.display = 'block';
        };
        reader.onerror = () => showErrorMessage('ইমেজ লোডে সমস্যা।', side);
        reader.readAsDataURL(file);
    }
    fileInput.value = '';
}

// Preview image click/dblclick handlers (export for main.js)
export function handlePreviewClick(previewImage, side) {
    if (elements.reviewImage) elements.reviewImage.src = previewImage.src;
    if (elements.imageReviewModal) elements.imageReviewModal.style.display = 'block';
}

export function handlePreviewDblClick(previewImage, side) {
    image.src = previewImage.src || '';
    image.onload = () => {
        if (elements.editCanvas) {
            elements.editCanvas.width = image.width;
            elements.editCanvas.height = image.height;
            appState.cropRect.width = Math.min(200, image.width);
            appState.cropRect.height = Math.min(200, image.height);
            drawImage();
            if (elements.editModal) elements.editModal.style.display = 'block';
        }
    };
}

// Edit controls handlers (export for main.js)
export function handleEditControl(inputElement, valueKey) {
    if (valueKey === 'cropX') appState.cropRect.x = parseInt(inputElement.value);
    else if (valueKey === 'cropY') appState.cropRect.y = parseInt(inputElement.value);
    else if (valueKey === 'cropWidth') appState.cropRect.width = parseInt(inputElement.value);
    else if (valueKey === 'cropHeight') appState.cropRect.height = parseInt(inputElement.value);
    else if (valueKey === 'brightness') appState.brightnessValue = parseInt(inputElement.value);
    else if (valueKey === 'contrast') appState.contrastValue = parseInt(inputElement.value);
    else if (valueKey === 'bgColor') appState.bgColor = inputElement.value;
    drawImage();
}

// Apply edit
export function applyEdit() {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = appState.cropRect.width;
    tempCanvas.height = appState.cropRect.height;
    const tempCtx = tempCanvas.getContext('2d');
    if (tempCtx) {
        tempCtx.fillStyle = appState.bgColor === 'transparent' ? 'rgba(0,0,0,0)' : appState.bgColor;
        tempCtx.fillRect(0, 0, appState.cropRect.width, appState.cropRect.height);
        tempCtx.filter = `brightness(${100 + appState.brightnessValue}%) contrast(${100 + appState.contrastValue}%)`;
        tempCtx.drawImage(image, appState.cropRect.x, appState.cropRect.y, appState.cropRect.width, appState.cropRect.height, 0, 0, appState.cropRect.width, appState.cropRect.height);
        appState.editedImage = tempCanvas.toDataURL('image/jpeg');
        if (elements.previewImage) elements.previewImage.src = appState.editedImage;
        if (elements.previewImageRight) elements.previewImageRight.src = appState.editedImage;
        callRasaAPI("show_review");
        if (elements.editModal) elements.editModal.style.display = 'none';
    }
}
