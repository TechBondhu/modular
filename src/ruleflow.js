// src/ruleflow.js
import { displayMessage } from './uiUtils.js';
import { displayReview, saveSubmission } from './reviewUtils.js'; // saveSubmission যোগ করা হয়েছে
import { elements } from './constants.js'; // DOM elements-এর জন্য

// সব ফ্লো এখানে ডিফাইন করা হবে
export const flows = {
  nid_apply: {
    start: {
      question: "আপনার কাছে কি Birth Registration এবং SSC Marksheet আছে?",
      type: "yesno",
      yes: "upload_docs",
      no: "nid_long_form"
    },
    upload_docs: {
      question: "দয়া করে Birth Registration এবং SSC Marksheet আপলোড করুন।",
      type: "file",
      next: "nid_short_form"
    },
    nid_short_form: {
      question: "দয়া করে আপনার মোবাইল নাম্বার লিখুন:",
      type: "text",
      next: "review"
    },
    nid_long_form: {
      question: "আপনার পূর্ণ নাম লিখুন:",
      type: "text",
      next: "father_name"
    },
    father_name: {
      question: "আপনার বাবার নাম লিখুন:",
      type: "text",
      next: "mother_name"
    },
    mother_name: {
      question: "আপনার মায়ের নাম লিখুন:",
      type: "text",
      next: "dob"
    },
    dob: {
      question: "আপনার জন্ম তারিখ লিখুন (DD-MM-YYYY):",
      type: "text",
      next: "address"
    },
    address: {
      question: "আপনার বর্তমান ঠিকানা লিখুন:",
      type: "text",
      next: "review"
    },
    review: { type: "review" }
  }
};

// স্টেট ট্র্যাকিং
let activeFlow = null;
let currentStep = null;
let userData = {};
let isReviewMode = false;

// ফ্লো শুরু
export function startFlow(flowName) {
  activeFlow = flows[flowName];
  currentStep = "start";
  userData = {};
  isReviewMode = false;
  displayMessage(activeFlow[currentStep].question, 'bot', 'left');
}

// ইউজারের উত্তর প্রসেস করা
export function handleFormFlow(userMessage) {
  if (!activeFlow || !currentStep) return;

  const step = activeFlow[currentStep];

  // ইনপুট সেভ করা
  if (step.type === "text" || step.type === "yesno") {
    userData[currentStep] = userMessage;
  } else if (step.type === "file") {
    userData[currentStep] = "[Uploaded File]"; // ফাইল আপলোডের সময় পরিবর্তন করা যাবে
  }

  // কন্ট্রোল লজিক
  if (step.type === "yesno") {
    if (userMessage.includes("হ্যাঁ") || userMessage.toLowerCase().includes("yes")) {
      currentStep = step.yes;
    } else {
      currentStep = step.no;
    }
  } else if (step.type === "file" || step.type === "text") {
    currentStep = step.next;
  } else if (step.type === "review" && !isReviewMode) {
    // Review মোড চালু
    isReviewMode = true;
    showReviewInterface();
    return;
  }

  // পরবর্তী প্রশ্ন
  const nextStep = activeFlow[currentStep];
  if (nextStep && nextStep.question && !isReviewMode) {
    displayMessage(nextStep.question, 'bot', 'left');
  }
}

// Review ইন্টারফেস দেখানো
function showReviewInterface() {
  if (!elements.messagesDiv) return;
  elements.messagesDiv.innerHTML += `
    <div class="review-container" id="reviewContainer">
      <h3>আবেদন পর্যালোচনা</h3>
      ${Object.entries(userData).map(([key, value]) => `
        <div class="review-item">
          <label>${key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}:</label>
          <input type="text" class="review-input" value="${value}" data-key="${key}">
        </div>
      `).join('')}
      <button class="confirm-btn" id="confirmBtn">কনফার্ম</button>
      <button class="edit-btn" id="editBtn">এডিট</button>
    </div>
  `;

  // Edit বাটনের ইভেন্ট
  document.getElementById('editBtn')?.addEventListener('click', () => {
    document.querySelectorAll('.review-input').forEach(input => input.disabled = false);
    displayMessage('ডাটা এডিট করুন এবং কনফার্ম করুন।', 'bot', 'left');
  });

  // Confirm বাটনের ইভেন্ট
  document.getElementById('confirmBtn')?.addEventListener('click', () => {
    document.querySelectorAll('.review-input').forEach(input => {
      userData[input.getAttribute('data-key')] = input.value;
      input.disabled = true;
    });
    generatePDF(userData); // PDF তৈরি
    displayMessage('আবেদন কনফার্ম করা হয়েছে এবং PDF তৈরি হয়েছে!', 'bot', 'left');
    saveSubmission(userData, 'left'); // সাবমিশন সেভ
    isReviewMode = false; // ফ্লো শেষ
  });

  displayReview(userData, 'left'); // প্রাথমিক রিভিউ দেখানো
}

// সরল PDF তৈরি (jsPDF ব্যবহার করে)
function generatePDF(data) {
  // jsPDF লাইব্রেরি লোড করতে হবে (HTML-এ <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>)
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text("NID Application Form", 10, 10);
  let y = 20;
  Object.entries(data).forEach(([key, value], index) => {
    doc.text(`${key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${value}`, 10, y + (index * 10));
  });
  doc.save('nid_application.pdf');
}
