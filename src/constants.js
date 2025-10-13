// Firebase Config
export const firebaseConfig = {
    apiKey: "AIzaSyCoIdMx9Zd7kQt9MSZmowbphaQVRl8D16E",
    authDomain: "admissionformdb.firebaseapp.com",
    projectId: "admissionformdb",
    storageBucket: "admissionformdb.appspot.com",
    messagingSenderId: "398052082157",
    appId: "1:398052082157:web:0bc02d66cbdf55dd2567e4"
};

// Genres Data (for left chat)
export const genres = [
    { name: 'এনআইডি আবেদন', icon: 'fas fa-id-card', message: 'আমার জন্য একটি এনআইডি তৈরি করতে চাই' },
    // ... (সব genres এন্ট্রি তোমার কোড থেকে কপি করো, এখানে সংক্ষেপে রাখলাম। পুরো লিস্ট তোমার মূল কোডে আছে)
    { name: 'অর্গানিক ফার্মিং চাকরি', icon: 'fas fa-leaf', message: 'আমি অর্গানিক ফার্মিং চাকরির জন্য আবেদন করতে চাই' }
];

// Genres2 Data (for right chat)
export const genres2 = [
    {
        name: 'এনআইডি আবেদন',
        icon: 'fas fa-id-card',
        subQuestions: [
            { question: 'এনআইডি আবেদন করতে কত বয়স হওয়া উচিত?', message: 'এনআইডি আবেদন করতে কত বয়স হওয়া উচিত?' },
            // ... (সব subQuestions কপি করো)
        ]
    },
    // ... (সব genres2 কপি করো)
];

// DOM Elements
export const elements = {
    sidebar: document.getElementById('sidebar'),
    historyList: document.getElementById('historyList'),
    // ... (সব elements কপি করো তোমার কোড থেকে)
};

// App State (গ্লোবাল ভ্যারিয়েবলস যা চেঞ্জ হয়)
export let appState = {
    leftChatId: localStorage.getItem('leftChatId') || null,
    rightChatId: localStorage.getItem('rightChatId') || null,
    currentUserUid: null,
    selectedFile: null,
    editedImage: null,
    cropRect: { x: 0, y: 0, width: 200, height: 200 },
    brightnessValue: 0,
    contrastValue: 0,
    bgColor: 'white'
};

// Image object (global for editing)
export const image = new Image();
