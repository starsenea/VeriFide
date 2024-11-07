// content.js

// Inject styles for highlighting
const style = document.createElement('style');
style.textContent = `.highlight { background-color: yellow; }`;
document.head.appendChild(style);

// Function to highlight selected text
function highlightSelection() {
  const selection = window.getSelection();
  if (!selection.rangeCount) return;
  const range = selection.getRangeAt(0);
  const span = document.createElement("span");
  span.className = "highlight";
  range.surroundContents(span);
}

// Listen for messages from the popup or background to highlight text
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "highlight") {
    highlightSelection();
  }
});