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
      question: "দয়া করে Birth Registration বা SSC Marksheet এর ছবি আপলোড করুন 📄",
      type: "file",
      next: "nid_short_form"
    },
    nid_short_form: {
      question: "দয়া করে আপনার মোবাইল নাম্বার লিখুন:",
      type: "text",
      next: "review"
    },
    nid_long_form: {
      question: "দয়া করে একটি পরিচয়পত্র বা আপনার ছবি আপলোড করুন 📸",
      type: "file",
      next: "nid_long_name"
    },
    nid_long_name: {
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

// 🔹 গ্লোবাল স্টেট
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
export function handleFormFlow(userMessage, uploadedFile = null) {
  if (!activeFlow || !currentStep) return;

  const step = activeFlow[currentStep];
  console.log(`[STEP] ${currentStep} (${step.type}) | msg: ${userMessage}`);

  // 🔹 হ্যাঁ/না, টেক্সট ইনপুট
  if (step.type === "text" || step.type === "yesno") {
    userData[currentStep] = userMessage;
  }

  // 🔹 ইমেজ ফাইল ইনপুট
  if (step.type === "file" && uploadedFile) {
    console.log("📸 File received:", uploadedFile.name);

    const reader = new FileReader();
    reader.onload = function (e) {
      const imageUrl = e.target.result;
      userData[currentStep] = imageUrl;

      displayMessage("✅ ফাইল আপলোড সম্পন্ন হয়েছে!", "bot", "left");

      // ⏭️ পরবর্তী স্টেপে যাওয়া
      currentStep = step.next;
      console.log(`🔁 Moving to next step: ${currentStep}`);

      setTimeout(() => {
        moveToNextStep();
      }, 300);
    };

    reader.onerror = function () {
      console.error("❌ File read error");
      displayMessage("ফাইল আপলোডে সমস্যা হয়েছে, আবার চেষ্টা করুন।", "bot", "left");
    };

    reader.readAsDataURL(uploadedFile);
    return; // এখানে return থাকা খুব জরুরি
  }

  // 🔹 yes/no logic
  if (step.type === "yesno") {
    if (userMessage.includes("হ্যাঁ") || userMessage.toLowerCase().includes("yes")) {
      currentStep = step.yes;
    } else {
      currentStep = step.no;
    }
  } else if (step.type === "text") {
    currentStep = step.next;
  }

  moveToNextStep();
}

// ✅ পরবর্তী স্টেপে যাওয়ার ফাংশন
function moveToNextStep() {
  const step = activeFlow[currentStep];
  if (!step) return;

  if (step.type === "review" && !isReviewMode) {
    console.log("🟩 Review Phase Starting...");
    isReviewMode = true;
    showNidReview(userData);
    return;
  }

  if (step.question && !isReviewMode) {
    console.log(`🟢 Next question: ${step.question}`);
    displayMessage(step.question, 'bot', 'left');
  }
}

// ✅ রিভিউ সেকশন (পুরনো reviewUtils ব্যবহার)
function showNidReview(formData) {
  console.log("📋 Showing NID Review using reviewUtils.js");
  console.log("🧾 FormData:", formData);

  const reviewData = {
    নাম: formData.nid_long_name || '',
    পিতা: formData.father_name || '',
    মাতা: formData.mother_name || '',
    জন্ম_তারিখ: formData.dob || '',
    ঠিকানা: formData.address || '',
    মোবাইল: formData.nid_short_form || '',
    ডকুমেন্ট: formData.upload_docs || '',
    ছবি: formData.nid_long_form || '',
    form_type: "NID Apply"
  };

  displayMessage("নিচে আপনার দেওয়া তথ্যগুলো যাচাই করুন 👇", "bot", "left");
  displayReview(reviewData, "left");
  saveChatHistory("রিভিউ প্রদর্শন করা হয়েছে", "bot", "left");
}
