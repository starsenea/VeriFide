console.log('Background script loaded and ready');

// Define consistent AI parameters
const AI_PARAMS = {
    temperature: 0.1,
    topK: 40,
    topP: 0.95
};

const AI_PARAMS_2 = {
    temperature: 0,
    topK: 0,
    topP: 100
};

let shouldTriggerButton = false;

async function getAuthToken() {
    try {
        return new Promise((resolve, reject) => {
            chrome.identity.getAuthToken({ 
                interactive: true,
                scopes: [
                    'https://www.googleapis.com/auth/documents.readonly',
                    'https://www.googleapis.com/auth/cloud-language'
                ]
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
        chrome.tabs.query({ active: true, currentWindow: true }, async ([tab]) => {
            if (!tab?.url?.includes('docs.google.com/document')) {
                console.error('Not a Google Doc');
                return;
            }

            try {
                const token = await getAuthToken();
                const docId = tab.url.match(/\/document\/d\/([a-zA-Z0-9-_]+)/)?.[1];
                
                if (!docId) {
                    throw new Error('Could not find document ID');
                }

                const response = await fetch(`https://docs.googleapis.com/v1/documents/${docId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    throw new Error(`Failed to fetch document: ${response.status}`);
                }

                const data = await response.json();
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

                const result = await processWithAI(documentContent);
                
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

async function processWithAI(content) {
    const sentences = content
        .split(/[.!?]\s+|\n/)
        .map(s => s.trim())
        .filter(s => s.length > 0);

    console.log('Processing sentences:', sentences);

    for (const sentence of sentences) {
        try {
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
            
            const session = await ai.languageModel.create({
                systemPrompt: `You determine if a statement is factually correct or is incorrect.

RULES:
1. If the statement is 100% correct, reply ONLY with: "CORRECT"
2. If the statement is incorrect, provide the corrected statement without any explanation or additional text.
3. You MUST wrap any corrected and replacedwords in <b> tags. Example: "The sky is <b>blue</b>"
4. Keep all other words exactly the same - only wrap the corrections in <b> tags
5. Provide ONLY the corrected statement without any explanation
MOST IMPORTANTLY: DO NOT ADD ANY EXPLANATIONS
REMEMBER ALL CRITERIA ABOVE`,
                ...AI_PARAMS_2,
                maxOutputTokens: Math.ceil(sentence.length / 4) * 1.2
            });

            const result = await session.prompt(sentence);
            console.log('Raw fact check result:', result);

            if (result && result !== 'CORRECT' && result !== sentence) {
                // Clean up the response and ensure proper HTML formatting
                const cleanedResult = result
                    .replace(/^INCORRECT\s*/i, '')
                    .replace(/\*\*([^\*]+)\*\*/g, '<b>$1</b>')  // Convert any remaining ** to <b> tags
                    .trim();
                
                console.log('Cleaned correction:', cleanedResult);
                
                chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
                    if (tab) {
                        chrome.tabs.sendMessage(tab.id, {
                            type: 'factCheck',
                            correction: cleanedResult,
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