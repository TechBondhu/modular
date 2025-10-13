// ✅ src/ruleflow.js
import { displayMessage } from './uiUtils.js';
import { displayReview } from './reviewUtils.js';
import { saveChatHistory } from './chatHistory.js';

// Groq API Key (তোমার Groq অ্যাকাউন্ট থেকে নাও এবং এখানে পেস্ট করো, বা constants.js-এ রাখো)
const GROQ_API_KEY = 'your_groq_api_key_here'; // রিপ্লেস করো!

// --------------------------------------
// 🔹 ফ্লো ডিফাইন
// --------------------------------------
export const flows = {
  nid_apply: {
    start: {
      question: "আপনার কাছে কি Birth Registration বা SSC Marksheet আছে?",
      type: "yesno",
      yes: "upload_docs",
      no: "nid_long_form"
    },
    upload_docs: {
      question: "দয়া করে Birth Registration বা SSC Marksheet এর ছবি আপলোড করুন 📄",
      type: "file",
      next: "nid_short_form" // OCR সফল হলে short form-এ যাবে
    },
    nid_short_form: {
      question: "দয়া করে আপনার মোবাইল নাম্বার লিখুন:",
      type: "text",
      next: "review"
    },
    nid_long_form: {
      question: "আপনার একটি ছবি আপলোড করুন 🪪",
      type: "file",
      next: "nid_name"
    },
    nid_name: {
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
      question: "আপনার মায়ের নাম লিখুন:",
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
// ✅ ফ্লো শুরু (স্টেট রিসেট নিশ্চিত করা)
// --------------------------------------
export function startFlow(flowName) {
  console.log(`🟢 [FLOW START] ${flowName}`);
  // প্রতিবার নতুন ফ্লো শুরুতে স্টেট রিসেট করো
  activeFlow = flows[flowName];
  currentStep = "start";
  userData = {};
  isReviewMode = false;

  const firstQ = activeFlow[currentStep]?.question;
  if (firstQ) {
    displayMessage(firstQ, 'bot', 'left');
    saveChatHistory(firstQ, 'bot', 'left');
  } else {
    console.error("❌ Flow start question not found!");
  }
}

// --------------------------------------
// ✅ ইনপুট/ইমেজ হ্যান্ডল (OCR ইন্টিগ্রেশন সহ)
// --------------------------------------
export function handleFormFlow(userMessage, uploadedFile = null) {
  // যদি NID রিলেটেড মেসেজ হয় এবং ফ্লো শুরু না হয়ে থাকে, তাহলে অটো-স্টার্ট
  if (!activeFlow && userMessage.includes('এনআইডি') && userMessage.includes('তৈরি করতে চাই')) {
    startFlow('nid_apply');
    return; // ফ্লো শুরু করে ফিরে যাও, পরবর্তী মেসেজ হ্যান্ডেল করবে
  }

  if (!activeFlow || !currentStep) {
    displayMessage("দুঃখিত, ফ্লো শুরু করুন বা সঠিক মেসেজ পাঠান।", 'bot', 'left');
    return;
  }

  const step = activeFlow[currentStep];
  console.log(`➡️ [STEP] ${currentStep} (${step.type}) | msg: ${userMessage ? userMessage.slice(0, 20) + "..." : "file"}`);

  // 🔹 ইমেজ ফাইল ইনপুট হ্যান্ডল করা (OCR সহ)
  if (step.type === "file" && uploadedFile) {
    console.log("📸 File received:", uploadedFile.name);

    const reader = new FileReader();
    reader.onload = async function (e) {
      const imageUrl = e.target.result; // Base64 URL
      userData[currentStep] = imageUrl; // base64 হিসেবে সংরক্ষণ

      displayMessage("✅ ফাইল আপলোড সম্পন্ন হয়েছে! OCR প্রক্রিয়া শুরু হচ্ছে...", "bot", "left");
      saveChatHistory("✅ ফাইল আপলোড সম্পন্ন হয়েছে! OCR প্রক্রিয়া শুরু হচ্ছে...", "bot", "left");
      console.log("🖼️ Image stored in userData:", imageUrl.slice(0, 40) + "...");

      // OCR এবং তথ্য এক্সট্র্যাকশন (যদি short path হয়)
      if (currentStep === "upload_docs") { // 'হ্যাঁ' পাথে OCR করো
        try {
          // প্রথমে OCR করে টেক্সট বের করো
          const extractedText = await performOcr(imageUrl);
          // তারপর টেক্সট থেকে তথ্য এক্সট্র্যাক্ট
          const extractedData = await extractInfoFromText(extractedText);

          // অটোম্যাটিক্যালি userData-এ সেট করো
          userData.nid_name = extractedData.name || '';
          userData.father_name = extractedData.fathers_name || '';
          userData.mother_name = extractedData.mothers_name || '';
          userData.dob = extractedData.dob || '';
          userData.address = extractedData.address || '';

          displayMessage("✅ OCR সম্পন্ন! আপনার তথ্য অটোম্যাটিক্যালি পূরণ করা হয়েছে।", "bot", "left");
          saveChatHistory("✅ OCR সম্পন্ন! আপনার তথ্য অটোম্যাটিক্যালি পূরণ করা হয়েছে।", "bot", "left");
        } catch (error) {
          console.error("❌ OCR Error:", error);
          displayMessage("OCR-এ সমস্যা হয়েছে। আপনি ম্যানুয়ালি তথ্য দিতে পারেন। দয়া করে আবার চেষ্টা করুন বা long ফর্মে যেতে 'না' বলুন।", "bot", "left");
          saveChatHistory("OCR-এ সমস্যা হয়েছে। আপনি ম্যানুয়ালি তথ্য দিতে পারেন। দয়া করে আবার চেষ্টা করুন বা long ফর্মে যেতে 'না' বলুন।", "bot", "left");
          currentStep = "start"; // রি-প্রম্পট করো
          moveToNextStep();
          return;
        }
      }

      currentStep = step.next; // পরবর্তী স্টেপে যাওয়া
      moveToNextStep(); // সঠিকভাবে পরবর্তী স্টেপ ট্রিগার
    };

    reader.onerror = function () {
      console.error("❌ File read error");
      displayMessage("ফাইল আপলোডে সমস্যা হয়েছে, আবার চেষ্টা করুন।", "bot", "left");
      saveChatHistory("ফাইল আপলোডে সমস্যা হয়েছে, আবার চেষ্টা করুন।", "bot", "left");
    };

    reader.readAsDataURL(uploadedFile);
    return; // অ্যাসিনক্রোনাস প্রক্রিয়া শুরু হওয়ার পর ফাংশন থেকে বেরিয়ে যাও
  }

  // 🔹 টেক্সট ইনপুট বা হ্যাঁ-না ইনপুট
  if (step.type === "text") {
    userData[currentStep] = userMessage;
  } else if (step.type === "yesno") {
    const lowerMessage = userMessage.toLowerCase();
    if (lowerMessage.includes('হ্যাঁ') || lowerMessage.includes('হা') || lowerMessage.includes('yes') || lowerMessage.includes('আছে')) {
      currentStep = step.yes;
    } else if (lowerMessage.includes('না') || lowerMessage.includes('no') || lowerMessage.includes('নেই')) {
      currentStep = step.no;
    } else {
      // অ্যানসার না ম্যাচ করলে রি-প্রম্পট
      displayMessage("দুঃখিত, আপনার উত্তর বুঝতে পারিনি। দয়া করে 'হ্যাঁ' বা 'না' বলুন।", "bot", "left");
      saveChatHistory("দুঃখিত, আপনার উত্তর বুঝতে পারিনি। দয়া করে 'হ্যাঁ' বা 'না' বলুন।", "bot", "left");
      return; // রি-প্রম্পট করে ফিরে যাও
    }
  }

  // 🔹 নেক্সট স্টেপ নির্ধারণ (yes/no এর পর)
  if (step.type === "text" || step.type === "file") {
    currentStep = step.next;
  }

  // 🔹 রিভিউ ফেজ
  if (currentStep === "review" && !isReviewMode) {
    console.log("🟩 Auto Review Phase Starting...");
    isReviewMode = true;
    showNidReview(userData);
    return;
  }

  // 🔹 পরবর্তী প্রশ্ন
  moveToNextStep();
}

// --------------------------------------
// ✅ OCR ফাংশন (Llama-4-Scout দিয়ে টেক্সট বের করা)
// --------------------------------------
async function performOcr(imageBase64) {
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Extract all visible text from this image of a birth certificate or SSC marksheet accurately, preserving the structure and formatting as much as possible. Output only the extracted text without additional commentary.' },
              { type: 'image_url', image_url: { url: imageBase64 } }
            ]
          }
        ],
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('OCR API Error:', error);
    throw error;
  }
}

// --------------------------------------
// ✅ তথ্য এক্সট্র্যাকশন ফাংশন (Llama দিয়ে JSON-এ পার্স করা)
// --------------------------------------
async function extractInfoFromText(extractedText) {
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages: [
          {
            role: 'user',
            content: `You are an expert at parsing official documents like birth certificates or SSC marksheets. From the following extracted text, identify and extract the following fields exactly as they appear, without adding or assuming information. If a field is not found, return 'Not Found' for that field. **Output only a valid JSON object, enclosed in curly braces {}, with no additional text or markdown (e.g., no ```json or other commentary).**

Extracted Text:
${extractedText}

Output in JSON format:
{
  "name": "Full name of the individual",
  "fathers_name": "Father's full name",
  "mothers_name": "Mother's full name",
  "dob": "Date of birth",
  "address": "Address"
}`
          }
        ],
        max_tokens: 300
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content.trim();

    // JSON পার্স করার আগে চেক করো যে এটা বৈধ JSON কিনা
    try {
      return JSON.parse(content);
    } catch (error) {
      // যদি JSON পার্স ফেল করে, তাহলে টেক্সট থেকে JSON অংশ বের করার চেষ্টা করো
      const jsonMatch = content.match(/{[\s\S]*}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No valid JSON found in response');
      }
    }
  } catch (error) {
    console.error('Extraction API Error:', error);
    throw error;
  }
}

// --------------------------------------
// ✅ হেল্পার — পরবর্তী প্রশ্ন
// --------------------------------------
function moveToNextStep() {
  const nextStep = activeFlow[currentStep];
  if (nextStep && nextStep.question && !isReviewMode) {
    displayMessage(nextStep.question, "bot", "left");
    saveChatHistory(nextStep.question, "bot", "left");
    console.log(`🟢 Next question: ${nextStep.question}`);

    // যদি ফাইল ইনপুট হয় তাহলে ফাইল আপলোড UI যোগ করো
    if (nextStep.type === "file") {
      addFileUploadInput();
    }
  } else {
    console.log("ℹ️ No further question or review started.");
  }
}

// --------------------------------------
// ✅ ফাইল আপলোড ইনপুট তৈরি
// --------------------------------------
function addFileUploadInput() {
  const uploadContainer = document.createElement("div");
  uploadContainer.classList.add("file-upload-container", "slide-in");

  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = "image/*";
  fileInput.classList.add("upload-input");

  const uploadLabel = document.createElement("label");
  uploadLabel.textContent = "📤 এখানে আপনার ছবি বা ডকুমেন্ট আপলোড করুন";
  uploadLabel.classList.add("upload-label");

  uploadContainer.appendChild(uploadLabel);
  uploadContainer.appendChild(fileInput);

  document.querySelector(".messages.left")?.appendChild(uploadContainer);

  fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFormFlow("", file); // ইমেজ পাস করে পাঠানো
      uploadContainer.remove();
    }
  });
}

// --------------------------------------
// ✅ রিভিউ (তোমার reviewUtils.js সিস্টেম ব্যবহার করে)
// --------------------------------------
function showNidReview(formData) {
  console.log("📋 Showing NID Review (from reviewUtils.js)");
  console.log("🧾 FormData Snapshot:", JSON.stringify(formData, null, 2));

  const reviewData = {
    নাম: formData.nid_name || '',
    পিতা: formData.father_name || '',
    মাতা: formData.mother_name || '',
    জন্ম_তারিখ: formData.dob || '',
    ঠিকানা: formData.address || '',
    মোবাইল: formData.nid_short_form || '',
    ডকুমেন্ট: formData.upload_docs || '',
    আবেদনকারীর_ছবি: formData.nid_long_form || '', // long form image
    form_type: "NID Apply"
  };

  displayMessage("নিচে আপনার দেওয়া তথ্যগুলো যাচাই করুন 👇", "bot", "left");
  saveChatHistory("নিচে আপনার দেওয়া তথ্যগুলো যাচাই করুন 👇", "bot", "left");
  displayReview(reviewData, "left");
  saveChatHistory("রিভিউ প্রদর্শন করা হয়েছে", "bot", "left");

  console.log("✅ Review rendered successfully.");
}
