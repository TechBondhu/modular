// src/ruleflow.js
import { displayMessage } from './uiUtils.js';
import { displayReview } from './reviewUtils.js';
import { saveSubmission } from './submissionUtils.js';
import { elements } from './constants.js';
import { saveChatHistory } from './chatHistory.js';

// সব ফ্লো
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

// গ্লোবাল স্টেট
let activeFlow = null;
let currentStep = null;
let userData = {};
let isReviewMode = false;

// ✅ ফ্লো শুরু
export function startFlow(flowName) {
  console.log(`[FLOW START] Flow name: ${flowName}`);
  activeFlow = flows[flowName];
  if (!activeFlow) {
    console.error(`❌ Flow not found: ${flowName}`);
    return;
  }
  currentStep = "start";
  userData = {};
  isReviewMode = false;

  const firstQ = activeFlow[currentStep]?.question;
  if (!firstQ) {
    console.error("❌ Starting question missing in flow!");
    return;
  }

  console.log(`[QUESTION] ${firstQ}`);
  displayMessage(firstQ, 'bot', 'left');
}

// ✅ ইউজারের উত্তর হ্যান্ডেল
export function handleFormFlow(userMessage) {
  if (!activeFlow || !currentStep) {
    console.warn("⚠️ No active flow running!");
    return;
  }

  const step = activeFlow[currentStep];
  console.log(`\n[STEP] ${currentStep} | Type: ${step.type} | User said: ${userMessage}`);

  // ইনপুট সেভ
  if (step.type === "text" || step.type === "yesno") {
    userData[currentStep] = userMessage;
    console.log(`[SAVE] ${currentStep}: ${userMessage}`);
  } else if (step.type === "file") {
    userData[currentStep] = "[Uploaded File]";
    console.log(`[SAVE] File uploaded placeholder`);
  }

  // ✅ কন্ট্রোল লজিক
  if (step.type === "yesno") {
    if (userMessage.includes("হ্যাঁ") || userMessage.toLowerCase().includes("yes")) {
      currentStep = step.yes;
      console.log(`[BRANCH] YES → ${currentStep}`);
    } else {
      currentStep = step.no;
      console.log(`[BRANCH] NO → ${currentStep}`);
    }
  } else if (step.type === "file" || step.type === "text") {
    currentStep = step.next;
    console.log(`[NEXT] → ${currentStep}`);
  } else if (step.type === "review" && !isReviewMode) {
    console.log("🟩 Review stage reached!");
    isReviewMode = true;
    showReviewInterface();
    return;
  }

  // ✅ পরবর্তী প্রশ্ন দেখাও
  const nextStep = activeFlow[currentStep];
  if (nextStep && nextStep.question && !isReviewMode) {
    console.log(`[ASK] ${nextStep.question}`);
    displayMessage(nextStep.question, 'bot', 'left');
  } else if (!nextStep) {
    console.warn("⚠️ Next step not found!");
  }
}

// ✅ Review ইন্টারফেস
function showReviewInterface() {
  console.log("📋 Showing Review Interface...");
  console.log("🧾 Current User Data:", userData);

  if (!elements.messagesDiv) {
    console.error("❌ messagesDiv not found!");
    return;
  }

  displayMessage("নিচে আপনার দেওয়া তথ্যগুলো যাচাই করুন 👇", "bot", "left");

  // বেসিক রিভিউ UI
  elements.messagesDiv.innerHTML += `
    <div class="review-container" id="reviewContainer">
      <h3>আবেদন পর্যালোচনা</h3>
      ${Object.entries(userData)
        .map(
          ([key, value]) => `
        <div class="review-item">
          <label>${key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}:</label>
          <input type="text" class="review-input" value="${value}" data-key="${key}">
        </div>`
        )
        .join('')}
      <button class="confirm-btn" id="confirmBtn">কনফার্ম</button>
      <button class="edit-btn" id="editBtn">এডিট</button>
    </div>
  `;

  document.getElementById('editBtn')?.addEventListener('click', () => {
    console.log("✏️ Edit mode activated");
    document.querySelectorAll('.review-input').forEach(input => (input.disabled = false));
    displayMessage('ডাটা এডিট করুন এবং কনফার্ম করুন।', 'bot', 'left');
  });

  document.getElementById('confirmBtn')?.addEventListener('click', () => {
    console.log("✅ Confirm button clicked");
    document.querySelectorAll('.review-input').forEach(input => {
      userData[input.getAttribute('data-key')] = input.value;
      input.disabled = true;
    });
    console.log("📤 Final Data Submitted:", userData);
    displayMessage('আবেদন কনফার্ম করা হয়েছে ✅', 'bot', 'left');
    saveSubmission(userData, 'left');
    displayReview(userData, 'left');
    isReviewMode = false;
  });

  // আলাদা রিভিউ কার্ডও দেখানো
  displayReview(userData, 'left');
}
