import { genres, genres2, elements } from './constants.js';
import { displayMessage, hideWelcomeMessage, sanitizeMessage, showErrorMessage } from './uiUtils.js';
import { saveChatHistory } from './chatHistory.js';
import { callRasaAPI } from './apiCalls.js';
import { callFastAPI } from './apiCalls.js';

export function renderGenres() {
    if (!elements.genresList) return;
    elements.genresList.innerHTML = '';
    genres.forEach(genre => {
        const item = document.createElement('div');
        item.className = 'genre-item ripple-btn';
        item.innerHTML = `<i class="${genre.icon}"></i><span>${sanitizeMessage(genre.name)}</span>`;
        item.addEventListener('click', () => {
            elements.genresModal?.classList.add('slide-out');
            setTimeout(() => {
                elements.genresModal.style.display = 'none';
                elements.genresModal.classList.remove('slide-out');
            }, 300);
            if (genre.message) {
                displayMessage(sanitizeMessage(genre.message), 'user', 'left');
                saveChatHistory(sanitizeMessage(genre.message), 'user', 'left');
                callRasaAPI(genre.message, {}, 'left');
                hideWelcomeMessage('left');
            } else {
                showErrorMessage('এই সেবা উপলব্ধ নয়।', 'left');
            }
        });
        elements.genresList.appendChild(item);
    });
}

export function openGenresModal() {
    renderGenres();
    if (elements.genresModal) {
        elements.genresModal.classList.add('slide-in');
        elements.genresModal.style.display = 'block';
        setTimeout(() => elements.genresModal.classList.remove('slide-in'), 300);
    }
}

export function closeGenresModal() {
    if (elements.genresModal) {
        elements.genresModal.classList.add('slide-out');
        setTimeout(() => {
            elements.genresModal.style.display = 'none';
            elements.genresModal.classList.remove('slide-out');
        }, 300);
    }
}

export function renderGenres2() {
    if (!elements.genres2List) return;
    elements.genres2List.innerHTML = '';
    genres2.forEach(category => {
        const categoryItem = document.createElement('div');
        categoryItem.className = 'category-item ripple-btn';
        categoryItem.innerHTML = `<i class="${category.icon}"></i><span>${sanitizeMessage(category.name)}</span>`;
        categoryItem.addEventListener('click', (e) => {
            e.stopPropagation();
            const subQuestionsDiv = categoryItem.nextSibling;
            if (subQuestionsDiv.style.display === 'block') {
                subQuestionsDiv.style.display = 'none';
            } else {
                subQuestionsDiv.style.display = 'block';
            }
        });

        const subQuestionsDiv = document.createElement('div');
        subQuestionsDiv.className = 'sub-questions';
        subQuestionsDiv.style.display = 'none';
        category.subQuestions.forEach(subQ => {
            const subItem = document.createElement('div');
            subItem.className = 'sub-question-item ripple-btn';
            subItem.innerHTML = `<span>${sanitizeMessage(subQ.question)}</span>`;
            subItem.addEventListener('click', () => {
                elements.genres2Modal?.classList.add('slide-out');
                setTimeout(() => {
                    elements.genres2Modal.style.display = 'none';
                    elements.genres2Modal.classList.remove('slide-out');
                }, 300);
                if (subQ.message) {
                    displayMessage(sanitizeMessage(subQ.message), 'user', 'right');
                    saveChatHistory(sanitizeMessage(subQ.message), 'user', 'right');
                    callFastAPI(subQ.message, 'right');
                    hideWelcomeMessage('right');
                } else {
                    showErrorMessage('এই প্রশ্ন উপলব্ধ নয়।', 'right');
                }
            });
            subQuestionsDiv.appendChild(subItem);
        });

        elements.genres2List.appendChild(categoryItem);
        elements.genres2List.appendChild(subQuestionsDiv);
    });
}

export function openGenres2Modal() {
    renderGenres2();
    if (elements.genres2Modal) {
        elements.genres2Modal.classList.add('slide-in');
        elements.genres2Modal.style.display = 'block';
        setTimeout(() => elements.genres2Modal.classList.remove('slide-in'), 300);
    }
}

export function closeGenres2Modal() {
    if (elements.genres2Modal) {
        elements.genres2Modal.classList.add('slide-out');
        setTimeout(() => {
            elements.genres2Modal.style.display = 'none';
            elements.genres2Modal.classList.remove('slide-out');
        }, 300);
    }
}

// Welcome buttons handlers (export for main.js)
export function setupWelcomeButtons() {
    document.querySelectorAll('.welcome-buttons button[data-genre]').forEach(button => {
        button.classList.add('ripple-btn');
        button.addEventListener('click', () => {
            const genreName = button.getAttribute('data-genre');
            const genre = genres.find(g => g.name === genreName);
            if (genre?.message) {
                const side = button.closest('#welcomeMessage') ? 'left' : 'right';
                displayMessage(sanitizeMessage(genre.message), 'user', side);
                saveChatHistory(genre.message, 'user', side);
                callRasaAPI(genre.message, {}, side);
                hideWelcomeMessage(side);
            } else {
                showErrorMessage('এই সেবা উপলব্ধ নয়।', button.closest('#welcomeMessage') ? 'left' : 'right');
            }
        });
    });
    document.querySelectorAll('.welcome-buttons button[data-category]').forEach(button => {
        button.classList.add('ripple-btn');
        button.addEventListener('click', () => {
            const categoryName = button.getAttribute('data-category');
            const category = genres2.find(g => g.name === categoryName);
            if (category) {
                openGenres2Modal();
            } else {
                showErrorMessage('এই সেবা উপলব্ধ নয়।', 'right');
            }
        });
    });
}
