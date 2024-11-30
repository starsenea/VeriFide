console.log('Background script loaded and ready');

// Define consistent AI parameters
const AI_PARAMS = {
    temperature: 0.1,
    topK: 1,
    topP: 0.9,
    maxOutputTokens: 50
};

let shouldTriggerButton = false;

async function getAuthToken() {
    try {
        return new Promise((resolve, reject) => {
            chrome.identity.getAuthToken({ 
                interactive: true,
                scopes: ['https://www.googleapis.com/auth/documents.readonly']
            }, (token) => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    resolve(token);
                }
            });
        });
    } catch (error) {
        console.error('Auth error:', error);
        throw error;
    }
}

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
                const token = await getAuthToken();

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
    // Split content into sentences/lines
    const sentences = content
        .split(/[.!?]\s+|\n/)
        .map(s => s.trim())
        .filter(s => s.length > 0);

    console.log('Processing sentences:', sentences);

    for (const sentence of sentences) {
        try {
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

            const isSubjective = await subjectiveCheck.prompt(sentence);
            console.log('Subjective check for:', sentence, ':', isSubjective);

            if (isSubjective.trim().toUpperCase() === 'SUBJECTIVE') {
                console.log('Skipping subjective statement:', sentence);
                continue;
            }

            console.log('Processing objective statement:', sentence);
            
            // Updated fact-checking prompt
            const session = await ai.languageModel.create({
                systemPrompt: `You are a fact checker. Verify if statements are scientifically and factually accurate.

RULES:
1. If the statement is 100% accurate: Return "CORRECT"
2. If ANY part is incorrect: Return the corrected version with differences wrapped in <b> tags
3. Change ONLY the incorrect parts
4. Keep all other words identical
5. NO explanations or additional text
6. Examples:
   Input: "Water is dry"
   Output: "Water is <b>wet</b>"
   
   Input: "The Earth is flat"
   Output: "The Earth is <b>spherical</b>"
   
   Input: "The sun rises in the east"
   Output: "CORRECT"`,
                ...AI_PARAMS,
                maxOutputTokens: Math.ceil(sentence.length / 4) * 2
            });

            const result = await session.prompt(sentence);
            console.log('Raw fact check result:', result);

            if (result && result !== 'CORRECT' && result !== sentence) {
                console.log('Sending correction:', {
                    type: 'factCheck',
                    correction: result,
                    originalText: sentence
                });
                chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
                    if (tab) {
                        chrome.tabs.sendMessage(tab.id, {
                            type: 'factCheck',
                            correction: result,
                            originalText: sentence
                        });
                    }
                });
                
                await new Promise(resolve => setTimeout(resolve, 300));
            } else {
                console.log('No correction needed for:', sentence);
            }

        } catch (error) {
            console.error('Error processing sentence:', sentence, error);
        }
    }
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