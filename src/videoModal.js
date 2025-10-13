import { elements } from './constants.js';

// Video modal handlers (export for main.js)
export function setupVideoModal() {
    document.getElementById('videoIcon').addEventListener('click', function() {
        document.getElementById('videoModal').style.display = 'flex';
        const video = document.getElementById('tutorialVideo');
        if (video) {
            video.currentTime = 0;
            video.load();
        }
    });

    document.getElementById('closeVideoModal').addEventListener('click', function() {
        document.getElementById('videoModal').style.display = 'none';
        const video = document.getElementById('tutorialVideo');
        if (video) {
            video.pause();
        }
    });
}
