// background.js

// Function to initiate OAuth flow and return the user's access token
async function authenticateUser() {
    return new Promise((resolve, reject) => {
      chrome.identity.launchWebAuthFlow({
        url: `https://accounts.google.com/o/oauth2/auth?client_id=61489958383-4c0ms10b4ajri5icod5m74j96v10c4vv.apps.googleusercontent.com&response_type=token&redirect_uri=https://dngnocadpdnnokdimanajoiilccjlfkh.chromiumapp.org&scope=https://www.googleapis.com/auth/documents`,
        interactive: true
      }, (redirectUrl) => {
        if (chrome.runtime.lastError) {
          console.error("OAuth Error:", chrome.runtime.lastError.message);
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        // Extract access token from redirect URL
        const url = new URL(redirectUrl);
        const token = url.hash.match(/access_token=([^&]*)/)[1];
        resolve(token);
      });
    });
  }
  
  // Function to get the document content for a specific document ID
  async function getDocumentContent(documentId) {
    try {
      const token = await authenticateUser();
      const response = await fetch(`https://docs.googleapis.com/v1/documents/${documentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error("Error fetching document content");
      return response.json();
    } catch (error) {
      console.error("Error retrieving document:", error);
    }
  }
  
  // Function to insert text into a Google Doc at a specific location
  async function writeTextToDoc(documentId, text) {
    try {
      const token = await authenticateUser();
      const response = await fetch(`https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          requests: [
            {
              insertText: {
                text: text,
                location: { index: 1 } // Adjust index based on insertion point
              }
            }
          ]
        })
      });
      if (!response.ok) throw new Error("Error writing text to document");
      return response.json();
    } catch (error) {
      console.error("Error writing to document:", error);
    }
  }
  
  // Listen for messages from the popup or content script
  chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
    if (request.action === "getDocumentContent") {
      const documentContent = await getDocumentContent(request.docId);
      sendResponse(documentContent);
    } else if (request.action === "writeText") {
      const result = await writeTextToDoc(request.docId, request.text);
      sendResponse(result);
    }
    return true; // Keep the message channel open for async responses
  });