console.log('Background script loaded and ready');

// Define consistent AI parameters
const AI_PARAMS = {
    temperature: 0.1,
    topK: 1,
    topP: 0.9,
    maxOutputTokens: 50
};

let shouldTriggerButton = false;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Background received message:', message);
    
    if (message.type === 'menuButtonClicked') {
        console.log('Menu button clicked, getting document content...');
        // Get the current tab
        chrome.tabs.query({ active: true, currentWindow: true }, async ([tab]) => {
            if (!tab?.url?.includes('docs.google.com/document')) {
                console.error('Not a Google Doc');
                return;
            }

            try {
                // Get auth token
                const token = await new Promise((resolve, reject) => {
                    chrome.identity.getAuthToken({ interactive: true }, (token) => {
                        if (chrome.runtime.lastError) {
                            reject(chrome.runtime.lastError);
                        } else {
                            resolve(token);
                        }
                    });
                });

                // Extract document ID from URL
                const docId = tab.url.match(/\/document\/d\/([a-zA-Z0-9-_]+)/)?.[1];
                if (!docId) {
                    throw new Error('Could not find document ID');
                }

                // Fetch document content
                const response = await fetch(`https://docs.googleapis.com/v1/documents/${docId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    throw new Error(`Failed to fetch document: ${response.status}`);
                }

                const data = await response.json();
                
                // Extract text content
                let documentContent = '';
                if (data.body?.content) {
                    documentContent = data.body.content
                        .filter(item => item.paragraph)
                        .map(item => {
                            return item.paragraph.elements
                                .map(element => element.textRun?.content || '')
                                .join('')
                                .trim();
                        })
                        .filter(text => text)
                        .join('\n')
                        .trim();
                }

                if (!documentContent) {
                    throw new Error('No document content found');
                }

                // Process with AI (your existing AI code)
                const result = await processWithAI(documentContent);

                // Send result back to content script
                if (result) {
                    chrome.tabs.sendMessage(tab.id, {
                        type: 'factCheck',
                        correction: result
                    });
                }

            } catch (error) {
                console.error('Error:', error);
                chrome.tabs.sendMessage(tab.id, {
                    type: 'factCheck',
                    correction: `Error: ${error.message}`
                });
            }
        });
    }
});

// Helper function to process with AI
async function processWithAI(content) {
    // First, check if statement is subjective
    const subjectiveCheck = await ai.languageModel.create({
        systemPrompt: `You determine if a statement contains ONLY opinions (subjective) or makes factual claims (objective).

RULES:
1. Reply ONLY with "SUBJECTIVE" or "OBJECTIVE"
2. Subjective = PURE opinions, preferences, feelings
3. Objective = ANY factual claims (even if incorrect)
4. If statement contains ANY factual claims, respond "OBJECTIVE"`,
        ...AI_PARAMS
    });

    const isSubjective = await subjectiveCheck.prompt(content);
    console.log('Subjective check:', isSubjective);

    if (isSubjective.trim().toUpperCase() === 'SUBJECTIVE') {
        return null; // Return null for subjective statements
    }

    // If objective, proceed with fact checking
    const session = await ai.languageModel.create({
        systemPrompt: `You are a minimal fact checker. Your task is to verify statements with minimal changes.

RULES:
1. If statement is correct: Return "CORRECT"
2. If incorrect: Return ONLY the corrected statement
3. Keep all correct words identical
4. Change ONLY the incorrect words/numbers
5. NO explanations or additional text
6. NO prefixes like "INCORRECT" or "Correction:"
7. Just return the corrected statement itself`,
        ...AI_PARAMS,
        maxOutputTokens: Math.ceil(content.length / 4) * 2
    });

    const result = await session.prompt(content);
    
    // If the statement is correct or unchanged, return null
    if (result === 'CORRECT' || result === content) {
        return null;
    }
    
    // Only return corrections for incorrect objective statements
    return result || null;
}

// Add a new listener for when the popup connects
chrome.runtime.onConnect.addListener((port) => {
    if (port.name === 'popup') {
        console.log('Popup connected, checking trigger flag');
        if (shouldTriggerButton) {
            console.log('Triggering button');
            port.postMessage({ type: 'triggerPopupButton' });
            shouldTriggerButton = false;
        }
    }
});