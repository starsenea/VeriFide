chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'triggerPopupButton') {
        const submitButton = document.getElementById('submitButton');
        if (submitButton) {
            submitButton.click();
        }
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const submitButton = document.getElementById("submitButton");
    const responseDiv = document.getElementById("response");
    
    submitButton.addEventListener("click", async () => {
        try {
            responseDiv.textContent = "Getting document content...";
            
            // Get current tab
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!tab?.url?.includes('docs.google.com/document')) {
                throw new Error('Please open a Google Doc first');
            }

            // Extract document ID from URL
            const docId = tab.url.match(/\/document\/d\/([a-zA-Z0-9-_]+)/)?.[1];
            if (!docId) {
                throw new Error('Could not find document ID');
            }

            console.log('Document ID:', docId);

            // Get auth token with proper error handling
            let token;
            try {
                token = await new Promise((resolve, reject) => {
                    chrome.identity.getAuthToken({ interactive: true }, (token) => {
                        if (chrome.runtime.lastError) {
                            reject(chrome.runtime.lastError);
                        } else {
                            resolve(token);
                        }
                    });
                });
                console.log('Got auth token');
            } catch (error) {
                console.error('Auth error:', error);
                throw new Error('Failed to authenticate: ' + error.message);
            }
            
            // Fetch document content
            const response = await fetch(`https://docs.googleapis.com/v1/documents/${docId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorData = await response.text();
                console.error('API Error:', errorData);
                throw new Error(`Failed to fetch document content: ${response.status}`);
            }

            const data = await response.json();
            console.log('Raw API response:', data);
            
            // Extract text content from document
            let documentContent = '';
            if (data.body?.content) {
                documentContent = data.body.content
                    .filter(item => item.paragraph)
                    .map(item => {
                        const paragraphText = item.paragraph.elements
                            .map(element => element.textRun?.content || '')
                            .join('')
                            .trim();
                        if (paragraphText) {
                            console.log('Found paragraph:', paragraphText);
                            return paragraphText;
                        }
                        return null;
                    })
                    .filter(text => text) // Remove empty paragraphs
                    .join('\n')
                    .trim();
            }

            console.log('Final extracted content:', documentContent);

            if (!documentContent) {
                throw new Error('No document content found');
            }

            responseDiv.textContent = "Analyzing content...";
            
            console.log('Sending to background:', documentContent);
            chrome.runtime.sendMessage({
                type: 'checkDocument',
                content: documentContent
            }, response => {
                console.log('Response from background:', response);
                if (chrome.runtime.lastError) {
                    console.error('Runtime error:', chrome.runtime.lastError);
                    responseDiv.textContent = "Error: " + chrome.runtime.lastError.message;
                    return;
                }
                
                if (response?.error) {
                    console.error('Response error:', response.error);
                    responseDiv.textContent = "Error: " + response.error;
                } else if (response?.text) {
                    console.log('Success:', response.text);
                    responseDiv.textContent = response.text;
                } else {
                    responseDiv.textContent = "Error: Invalid response format";
                }
            });

        } catch (error) {
            console.error("Error:", error);
            responseDiv.textContent = "Error: " + error.message;
        }
    });
});