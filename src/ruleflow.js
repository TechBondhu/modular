// ✅ src/ruleflow.js
import { displayMessage } from './uiUtils.js';
import { displayReview } from './reviewUtils.js';
import { saveChatHistory } from './chatHistory.js';

// --------------------------------------
// 🔹 সব রুল-বেইজড ফ্লো ডিফাইন
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
      question: "দয়া করে Birth Registration অথবা SSC Marksheet এর ছবি আপলোড করুন 📄",
      type: "file",
      next: "nid_short_form"
    },
    nid_short_form: {
      question: "দয়া করে আপনার মোবাইল নাম্বার লিখুন:",
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
// ✅ ইউজারের ইনপুট / ফাইল ইনপুট হ্যান্ডল
// --------------------------------------
export function handleFormFlow(userMessage, uploadedFile = null) {
  if (!activeFlow || !currentStep) return;

  const step = activeFlow[currentStep];
  console.log(`➡️ [STEP] ${currentStep} (${step.type}) | msg: ${userMessage}`);

  // 🔸 যদি ইমেজ আপলোড করা হয়
  if (step.type === "file" && uploadedFile) {
    console.log("📸 File received:", uploadedFile.name);
    const reader = new FileReader();

    reader.onload = function (e) {
      const imageUrl = e.target.result;
      userData[currentStep] = imageUrl; // base64 হিসেবে সংরক্ষণ

      displayMessage("✅ ফাইল আপলোড সম্পন্ন হয়েছে!", "bot", "left");
      console.log("🖼️ Image stored in userData:", imageUrl.slice(0, 50) + "...");

      // পরবর্তী ধাপে যাও
      currentStep = step.next;
      moveToNextStep();
    };

    reader.onerror = function () {
      console.error("❌ File read error");
      displayMessage("ফাইল আপলোডে সমস্যা হয়েছে, আবার চেষ্টা করুন।", "bot", "left");
    };

    reader.readAsDataURL(uploadedFile);
    return; // এখানে return দরকার কারণ ফাইল পড়া asynchronous
  }

  // 🔸 সাধারণ ইনপুট (টেক্সট / হ্যাঁ-না)
  if (step.type === "text" || step.type === "yesno") {
    userData[currentStep] = userMessage;
  }

  // 🔸 পরবর্তী স্টেপ নির্ধারণ
  if (step.type === "yesno") {
    if (userMessage.includes("হ্যাঁ") || userMessage.toLowerCase().includes("yes")) {
      currentStep = step.yes;
    } else {
      currentStep = step.no;
    }
  } else if (step.type === "text") {
    currentStep = step.next;
  }

  // 🔸 যদি পরবর্তী স্টেপ review হয় → অটো রিভিউ দেখাও
  if (currentStep === "review" && !isReviewMode) {
    console.log("🟩 Auto Review Phase Starting...");
    isReviewMode = true;
    showNidReview(userData);
    return;
  }

  // 🔸 যদি পরবর্তী প্রশ্ন থাকে
  moveToNextStep();
}

// --------------------------------------
// ✅ হেল্পার ফাংশন — পরবর্তী প্রশ্ন দেখানো
// --------------------------------------
function moveToNextStep() {
  const nextStep = activeFlow[currentStep];
  if (nextStep && nextStep.question && !isReviewMode) {
    console.log(`🟢 Next Question: ${nextStep.question}`);
    displayMessage(nextStep.question, "bot", "left");

    // 📂 যদি ফাইল ইনপুট হয়, UI তে ফাইল আপলোড বাটন দেখাও
    if (nextStep.type === "file") {
      addFileUploadInput();
    }
  } else {
    console.log("ℹ️ No further step or review started.");
  }
}

// --------------------------------------
// ✅ UI তে ফাইল আপলোড ইনপুট যুক্ত করা
// --------------------------------------
function addFileUploadInput() {
  const uploadContainer = document.createElement("div");
  uploadContainer.classList.add("file-upload-container", "slide-in");

  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = "image/*";
  fileInput.classList.add("upload-input");

  const uploadLabel = document.createElement("label");
  uploadLabel.textContent = "📤 এখানে আপনার ডকুমেন্ট আপলোড করুন";
  uploadLabel.classList.add("upload-label");

  uploadContainer.appendChild(uploadLabel);
  uploadContainer.appendChild(fileInput);

  document.querySelector(".messages.left")?.appendChild(uploadContainer);

  fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];
    if (file) {
      handleFormFlow("", file); // ✅ এখানে আপলোড করা ফাইল পাস করা হচ্ছে
      uploadContainer.remove(); // আপলোডের পরে ইনপুট হাইড করা
    }
  });
}

// --------------------------------------
// ✅ পুরনো reviewUtils.js ব্যবহার করে রিভিউ দেখানো
// --------------------------------------
function showNidReview(formData) {
  console.log("📋 Showing NID Review (from reviewUtils.js)");
  console.log("🧾 FormData Snapshot:", JSON.stringify(formData, null, 2));

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

  console.log("✅ Review rendered successfully.");
}
