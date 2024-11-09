// popup.js

document.getElementById("writeText").addEventListener("click", async () => {
    const text = document.getElementById("textInput").value;
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      const activeTab = tabs[0];
      const url = activeTab.url;

      // Extract the document ID from the Google Docs URL
      const docIdMatch = url.match(/\/document\/d\/([a-zA-Z0-9-_]+)/);
      if (!docIdMatch || docIdMatch.length < 2) {
          alert("Please open a Google Doc to use this extension.");
          return;
      }

      const docId = docIdMatch[1]; // Document ID from the URL

      // Send the writeText message to background script with doc ID and text
      await chrome.runtime.sendMessage({ action: "writeText", docId, text });
  });
  });
  
  document.getElementById("highlightText").addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { action: "highlight" });
    });
  });