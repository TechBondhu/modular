// src/ruleflow.js
import { displayMessage } from './uiUtils.js';
import { displayReview } from './reviewUtils.js';
import { saveChatHistory } from './chatHistory.js';

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

// ✅ ফ্লো শুরু
export function startFlow(flowName) {
  console.log(`[FLOW START] ${flowName}`);
  activeFlow = flows[flowName];
  currentStep = "start";
  userData = {};
  isReviewMode = false;
  displayMessage(activeFlow[currentStep].question, 'bot', 'left');
}

// ✅ ইউজারের ইনপুট হ্যান্ডল করা
export function handleFormFlow(userMessage) {
  if (!activeFlow || !currentStep) return;

  const step = activeFlow[currentStep];
  console.log(`[STEP] ${currentStep} (${step.type}) | msg: ${userMessage}`);

  // ডেটা সংরক্ষণ
  if (step.type === "text" || step.type === "yesno") {
    userData[currentStep] = userMessage;
  } else if (step.type === "file") {
    userData[currentStep] = "[Uploaded File]";
  }

  // নেক্সট স্টেপ লজিক
  if (step.type === "yesno") {
    if (userMessage.includes("হ্যাঁ") || userMessage.toLowerCase().includes("yes")) {
      currentStep = step.yes;
    } else {
      currentStep = step.no;
    }
  } else if (step.type === "file" || step.type === "text") {
    currentStep = step.next;
  } else if (step.type === "review" && !isReviewMode) {
    console.log("🟩 Review Phase Starting...");
    isReviewMode = true;
    showNidReview(userData); // <-- এখানেই তোমার পুরনো reviewUtils সিস্টেম কল হচ্ছে
    return;
  }

  // পরবর্তী প্রশ্ন দেখানো
  const nextStep = activeFlow[currentStep];
  if (nextStep && nextStep.question && !isReviewMode) {
    displayMessage(nextStep.question, 'bot', 'left');
  }
}

// ✅ তোমার পুরনো reviewUtils সিস্টেম ব্যবহার করে রিভিউ দেখানো
function showNidReview(formData) {
  console.log("📋 Showing NID Review using reviewUtils.js");
  console.log("🧾 FormData:", formData);

  const reviewData = {
    নাম: formData.nid_long_form || '',
    পিতা: formData.father_name || '',
    মাতা: formData.mother_name || '',
    জন্ম_তারিখ: formData.dob || '',
    ঠিকানা: formData.address || '',
    মোবাইল: formData.nid_short_form || '',
    ডকুমেন্ট: formData.upload_docs || '',
    form_type: "NID Apply"
  };

  displayMessage("নিচে আপনার দেওয়া তথ্যগুলো যাচাই করুন 👇", "bot", "left");
  displayReview(reviewData, "left");
  saveChatHistory("রিভিউ প্রদর্শন করা হয়েছে", "bot", "left");
}
