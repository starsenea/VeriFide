console.log('Background script loaded and ready');

// Define consistent AI parameters
const AI_PARAMS = {
    temperature: 0.25,
    topK: 1,
    topP: 0.9
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

async function decomposeSentence(sentence, token) {
    console.log('Attempting to decompose:', sentence);
    try {
        const response = await fetch('https://language.googleapis.com/v1/documents:analyzeSyntax', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                document: {
                    content: sentence,
                    type: 'PLAIN_TEXT',
                },
                encodingType: 'UTF8'
            })
        });

        if (!response.ok) {
            console.error('Language API error:', response.status);
            return [sentence];
        }

        const data = await response.json();
        console.log('Language API response received');
        
        // More detailed token logging
        console.log('Tokens detail:', data.tokens.map(t => ({
            text: t.text.content,
            tag: t.partOfSpeech.tag,
            label: t.dependencyEdge.label,
            head: t.dependencyEdge.headTokenIndex
        })));

        const claims = [];
        let currentClaim = '';
        let lastSubject = '';
        let hasAddedRemainingTokens = false;
        
        // Find first subject
        for (let i = 0; i < data.tokens.length; i++) {
            if (data.tokens[i].dependencyEdge.label === 'NSUBJ') {
                lastSubject = data.tokens[i].text.content;
                break;
            }
        }

        data.tokens.forEach((token, index) => {
            if (hasAddedRemainingTokens) return;
            
            // Add current token
            currentClaim += token.text.content;
            
            // Add space if needed
            if (token.partOfSpeech.tag !== 'PUNCT' && 
                index < data.tokens.length - 1 && 
                !['PUNCT'].includes(data.tokens[index + 1].partOfSpeech.tag)) {
                currentClaim += ' ';
            }
            
            // If we hit a conjunction, split the sentence
            if (token.text.content.toLowerCase() === 'and') {
                // Store the first claim
                claims.push(currentClaim.replace(/\s+and\s*$/, '').trim());
                
                // Start new claim with the last known subject
                currentClaim = lastSubject + ' ';
                
                // Add remaining tokens
                const remainingTokens = data.tokens.slice(index + 1);
                remainingTokens.forEach((t, i) => {
                    currentClaim += t.text.content;
                    if (i < remainingTokens.length - 1 && 
                        !['PUNCT'].includes(remainingTokens[i + 1].partOfSpeech.tag)) {
                        currentClaim += ' ';
                    }
                });
                hasAddedRemainingTokens = true;
            }
        });
        
        // Add final claim if not already added
        if (currentClaim.trim() && !claims.includes(currentClaim.trim())) {
            claims.push(currentClaim.trim());
        }

        // Clean and validate claims
        const validClaims = claims
            .filter(c => c.length > 0)
            .map(claim => claim.replace(/\s+/g, ' ').trim())
            .filter(claim => {
                const words = claim.split(' ');
                return words.length >= 3 && claim.includes(' ');
            });

        console.log('Decomposed into claims:', validClaims);
        return validClaims.length > 0 ? validClaims : [sentence];

    } catch (error) {
        console.error('Decomposition error:', error);
        return [sentence];
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
                systemPrompt: `You are a fact checker. Your task is to verify whether a statement is scientifically and factually accurate.

RULES:
1. If the statement is 100% correct, reply ONLY with: "CORRECT".
2. If ANY part of the statement is incorrect or misleading, rewrite the statement to be 100% accurate.
3. Highlight changes to incorrect words using <b> tags, keeping all other words unchanged.
4. Provide ONLY the corrected statement. Do NOT explain or add additional text.`,
                ...AI_PARAMS
            });

            const isSubjective = await subjectiveCheck.prompt(sentence);
            console.log('Subjective check for:', sentence, ':', isSubjective);

            if (isSubjective.trim().toUpperCase() === 'SUBJECTIVE') {
                console.log('Skipping subjective statement:', sentence);
                continue;
            }

            console.log('Processing objective statement:', sentence);
            
            const token = await getAuthToken();
            const claims = await decomposeSentence(sentence, token);
            console.log('Decomposed claims:', claims);

            for (const claim of claims) {
                console.log('Processing claim:', claim);
                const session = await ai.languageModel.create({
                    systemPrompt: `You are a fact checker. Your task is to verify whether a statement is scientifically and factually accurate.

RULES:
1. If the statement is 100% correct, reply ONLY with: "CORRECT".
2. If ANY part of the statement is incorrect or misleading, rewrite the statement to be 100% accurate.
3. Highlight changes to incorrect words using <b> tags, keeping all other words unchanged.
4. Provide ONLY the corrected statement. Do NOT explain or add additional text.

Examples:
1. "Water is dry." -> "Water is <b>wet</b>."
2. "The Moon is made of cheese." -> "The Moon is made of <b>rock</b>."
3. "The Earth revolves around the Sun." -> "CORRECT."`,
                    ...AI_PARAMS,
                    maxOutputTokens: Math.ceil(claim.length / 4) * 2
                });

                const result = await session.prompt(claim);
                console.log('Raw fact check result:', result);

                if (result && result !== 'CORRECT' && result !== claim) {
                    console.log('Sending correction:', {
                        type: 'factCheck',
                        correction: result,
                        originalText: claim
                    });
                    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
                        if (tab) {
                            chrome.tabs.sendMessage(tab.id, {
                                type: 'factCheck',
                                correction: result,
                                originalText: claim
                            });
                        }
                    });
                    
                    await new Promise(resolve => setTimeout(resolve, 300));
                } else {
                    console.log('No correction needed for:', claim);
                }
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