import docsService from '../services/docsService.js';

document.addEventListener('DOMContentLoaded', async () => {
    const submitButton = document.getElementById("submitButton");
    const responseDiv = document.getElementById("response");
    
    try {
        await docsService.initialize();
        console.log("Google Docs API initialized");
    } catch (error) {
        console.error("Failed to initialize Google Docs API:", error);
        responseDiv.textContent = "Error: Failed to initialize Google Docs API";
    }

    submitButton.addEventListener("click", async () => {
        responseDiv.textContent = "Loading...";
        
        try {
            // Get current tab
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            // Extract doc ID from URL
            const docId = extractDocId(tab.url);
            if (!docId) {
                responseDiv.textContent = "Please open a Google Doc to analyze";
                return;
            }

            // Get document content
            const documentContent = await docsService.getDocContent(docId);
            
            chrome.runtime.sendMessage({ 
                type: "processPrompt", 
                prompt: documentContent 
            }, (response) => {
                if (chrome.runtime.lastError) {
                    console.error("Runtime error:", chrome.runtime.lastError);
                    responseDiv.textContent = "Error: Could not connect to background script";
                    return;
                }
                
                if (response && response.text) {
                    responseDiv.textContent = response.text;
                    document.getElementById("response-time").textContent = 
                        `Response time: ${response.responseTime}ms`;
                } else {
                    responseDiv.textContent = "Error retrieving response.";
                }
            });
        } catch (error) {
            console.error("Error processing document:", error);
            responseDiv.textContent = "Error: " + error.message;
        }
    });
});

function extractDocId(url) {
    // Handle both edit and view URLs
    const regex = /\/document\/d\/([a-zA-Z0-9-_]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
}