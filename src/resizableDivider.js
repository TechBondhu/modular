const mainDivider = document.getElementById('mainDivider');
const leftColumn = document.querySelector('.left-column');
const rightColumn = document.querySelector('.right-column');
const splitChatContainer = document.querySelector('.split-chat');

let isDragging = false;
let isMobileLayout = window.innerWidth <= 768;

function isVerticalLayout() {
    return window.innerWidth <= 768 || getComputedStyle(splitChatContainer).flexDirection === 'column';
}

export function startDrag(e) {
    isDragging = true;
    if (mainDivider) {
        mainDivider.classList.add('dragging');
    }
    if (leftColumn && rightColumn) {
        leftColumn.style.transition = 'none';
        rightColumn.style.transition = 'none';
        mainDivider.style.transition = 'none';
    }
    document.body.style.userSelect = 'none';
    e.preventDefault();
    e.stopPropagation();
}

export function stopDrag() {
    isDragging = false;
    if (mainDivider) {
        mainDivider.classList.remove('dragging');
    }
    if (leftColumn && rightColumn) {
        leftColumn.style.transition = 'flex 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        rightColumn.style.transition = 'flex 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        mainDivider.style.transition = isVerticalLayout() ? 'top 0.1s ease, background 0.3s ease' : 'left 0.1s ease, background 0.3s ease';
    }
    document.body.style.userSelect = '';
}

function handleDrag(e) {
    if (!isDragging) return;
    
    const clientPos = isVerticalLayout() ? (e.clientY || (e.touches && e.touches[0].clientY)) : (e.clientX || (e.touches && e.touches[0].clientX));
    const containerRect = splitChatContainer.getBoundingClientRect();
    const containerSize = isVerticalLayout() ? containerRect.height : containerRect.width;
    const containerStart = isVerticalLayout() ? containerRect.top : containerRect.left;
    
    let newTopLeftSize = ((clientPos - containerStart) / containerSize) * 100;
    
    newTopLeftSize = Math.max(20, Math.min(80, newTopLeftSize));
    const newBottomRightSize = 100 - newTopLeftSize;
    
    if (leftColumn && rightColumn) {
        leftColumn.style.flex = `0 0 ${newTopLeftSize}%`;
        rightColumn.style.flex = `0 0 ${newBottomRightSize}%`;
    }
    
    if (mainDivider) {
        if (isVerticalLayout()) {
            const newTop = containerStart + (newTopLeftSize / 100) * containerSize;
            mainDivider.style.top = `${newTop}px`;
            mainDivider.style.left = '0';
            mainDivider.style.transform = 'none';
        } else {
            const newLeft = containerStart + (newTopLeftSize / 100) * containerSize;
            mainDivider.style.left = `${newLeft}px`;
            mainDivider.style.top = '0';
            mainDivider.style.transform = 'none';
        }
    }
    
    e.preventDefault();
    e.stopPropagation();
}

function rafHandleDrag(e) {
    if (isDragging) {
        requestAnimationFrame(() => handleDrag(e));
    }
}

function handleLayoutChange() {
    isMobileLayout = window.innerWidth <= 768;
    if (!isDragging && mainDivider && splitChatContainer) {
        if (isMobileLayout) {
            mainDivider.style.top = '50%';
            mainDivider.style.transform = 'translateY(-50%)';
            mainDivider.style.left = '0';
        } else {
            mainDivider.style.left = '50%';
            mainDivider.style.transform = 'translateX(-50%)';
            mainDivider.style.top = '0';
        }
        if (leftColumn && rightColumn) {
            leftColumn.style.flex = '1';
            rightColumn.style.flex = '1';
        }
    }
}

// Setup events (export for main.js)
export function setupResizableDivider() {
    if (mainDivider) {
        mainDivider.addEventListener('mousedown', startDrag);
        mainDivider.addEventListener('touchstart', startDrag, { passive: false });
    }
    document.addEventListener('mouseup', stopDrag);
    document.addEventListener('touchend', stopDrag);
    document.addEventListener('mousemove', rafHandleDrag);
    document.addEventListener('touchmove', rafHandleDrag, { passive: false });
    window.addEventListener('resize', handleLayoutChange);
    window.addEventListener('orientationchange', handleLayoutChange);
    handleLayoutChange();
}
