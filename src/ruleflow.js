// ✅ src/ruleflow.js
import { displayMessage } from './uiUtils.js';
import { displayReview } from './reviewUtils.js';
import { saveChatHistory } from './chatHistory.js';

// --------------------------------------
// 🔹 সব রুল-বেইজড ফ্লো ডিফাইন করা
// --------------------------------------
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

// --------------------------------------
// 🔹 স্টেট ট্র্যাকিং
// --------------------------------------
let activeFlow = null;
let currentStep = null;
let userData = {};
let isReviewMode = false;

// --------------------------------------
// ✅ ফ্লো শুরু
// --------------------------------------
export function startFlow(flowName) {
  console.log(`🟢 [FLOW START] ${flowName}`);
  activeFlow = flows[flowName];
  currentStep = "start";
  userData = {};
  isReviewMode = false;

  const firstQ = activeFlow[currentStep]?.question;
  if (firstQ) displayMessage(firstQ, 'bot', 'left');
  else console.error("❌ Flow start question not found!");
}

// --------------------------------------
// ✅ ইউজারের ইনপুট হ্যান্ডল করা
// --------------------------------------
export function handleFormFlow(userMessage) {
  if (!activeFlow || !currentStep) return;

  const step = activeFlow[currentStep];
  console.log(`➡️ [STEP] ${currentStep} (${step.type}) | msg: ${userMessage}`);

  // 🔸 ডেটা সংরক্ষণ
  if (step.type === "text" || step.type === "yesno") {
    userData[currentStep] = userMessage;
  } else if (step.type === "file") {
    userData[currentStep] = "[Uploaded File]";
  }

  // 🔸 নেক্সট স্টেপ নির্ধারণ
  if (step.type === "yesno") {
    if (userMessage.includes("হ্যাঁ") || userMessage.toLowerCase().includes("yes")) {
      currentStep = step.yes;
    } else {
      currentStep = step.no;
    }
  } else if (step.type === "file" || step.type === "text") {
    currentStep = step.next;
  }

  // 🔸 যদি পরবর্তী স্টেপ review হয় → অটোমেটিক রিভিউ চালু করো
  if (currentStep === "review" && !isReviewMode) {
    console.log("🟩 Auto Review Phase Starting...");
    isReviewMode = true;
    showNidReview(userData);
    return; // ⚡ আর পরবর্তী প্রশ্ন না দেখানো
  }

  // 🔸 পরবর্তী প্রশ্ন দেখানো (যদি থাকে)
  const nextStep = activeFlow[currentStep];
  if (nextStep && nextStep.question && !isReviewMode) {
    displayMessage(nextStep.question, 'bot', 'left');
  } else {
    console.log("ℹ️ No further question found or review started.");
  }
}

// --------------------------------------
// ✅ পুরনো reviewUtils.js সিস্টেম ব্যবহার করে রিভিউ দেখানো
// --------------------------------------
function showNidReview(formData) {
  console.log("📋 Showing NID Review (from reviewUtils.js)");
  console.log("🧾 FormData Snapshot:", JSON.stringify(formData, null, 2));

  // 🔹 ফর্ম ডেটা সাজানো
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

  // 🔹 UI তে মেসেজ ও রিভিউ প্রদর্শন
  displayMessage("নিচে আপনার দেওয়া তথ্যগুলো যাচাই করুন 👇", "bot", "left");
  displayReview(reviewData, "left");
  saveChatHistory("রিভিউ প্রদর্শন করা হয়েছে", "bot", "left");

  console.log("✅ Review rendered successfully using existing UI system.");
}
