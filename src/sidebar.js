import { elements } from './constants.js';
import { toggleSidebar } from './sidebar.js'; // Self-import
import { loadChatHistory } from './chatHistory.js';
import { startNewChat } from './chatHistory.js';
import { deleteChat, renameChat } from './chatHistory.js';
import { elements } from './constants.js'; // For modals

export function toggleSidebar() {
    elements.sidebar.classList.toggle('open');
    document.querySelector('.chat-container').classList.toggle('sidebar-open');
}

export function closeSidebarHandler() {
    elements.sidebar.classList.remove('open');
    document.querySelector('.chat-container').classList.remove('sidebar-open');
}

// Modal handlers (export for main.js)
export function setupSidebarModals() {
    elements.cancelDelete?.addEventListener('click', () => elements.deleteModal.style.display = 'none');
    elements.confirmDelete?.addEventListener('click', deleteChat);
    elements.cancelRename?.addEventListener('click', () => elements.renameModal.style.display = 'none');
    elements.saveRename?.addEventListener('click', renameChat);
    elements.searchInput?.addEventListener('input', () => loadChatHistory(elements.searchInput.value.trim()));
    elements.newChatIcon?.addEventListener('click', () => {
        startNewChat('left');
        startNewChat('right');
    });
}
