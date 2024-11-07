// popup.js

document.getElementById("writeText").addEventListener("click", async () => {
    const text = document.getElementById("textInput").value;
    const docId = "YOUR_DOC_ID"; // Replace with actual doc ID or retrieve dynamically
    await chrome.runtime.sendMessage({ action: "writeText", docId, text });
  });
  
  document.getElementById("highlightText").addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { action: "highlight" });
    });
  });