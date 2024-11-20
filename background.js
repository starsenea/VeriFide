console.log('Background script loaded and ready');

// Define consistent AI parameters
const AI_PARAMS = {
    temperature: 0.1,
    topK: 1,
    topP: 0.9,
    maxOutputTokens: 50
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Background received message:', message);
    
    if (message.type === 'checkDocument') {
        (async () => {
            try {
                // Get the current active tab instead of using sender
                const [activeTab] = await chrome.tabs.query({ 
                    active: true, 
                    currentWindow: true 
                });

                if (!activeTab?.id) {
                    throw new Error('No active tab found');
                }

                if (!message.content || typeof message.content !== 'string') {
                    throw new Error('Invalid content format');
                }

                const inputLength = message.content.length;
                const estimatedTokens = Math.ceil(inputLength / 4) * 2;
                
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

                const isSubjective = await subjectiveCheck.prompt(message.content);
                console.log('Subjective check:', isSubjective);

                if (isSubjective.trim().toUpperCase() === 'SUBJECTIVE') {
                    sendResponse({
                        success: true,
                        text: "This is a subjective statement and cannot be fact-checked."
                    });
                    return;
                }

                // If objective, proceed with fact checking
                console.log('Creating fact-check session...');
                const session = await ai.languageModel.create({
                    systemPrompt: `You are a minimal fact checker. Your task is to verify statements with minimal changes.

RULES:
1. If statement is correct: Return the EXACT original statement
2. If incorrect: Change ONLY the incorrect words/numbers, keeping all other words identical
3. NO explanations, NO extra text
4. NO "Correction:" prefix or any other additions`,
                    ...AI_PARAMS,
                    maxOutputTokens: estimatedTokens
                });

                console.log('Sending prompt to AI...');
                const result = await session.prompt(message.content);
                console.log('AI response:', result);

                if (!result) {
                    throw new Error('No response from AI');
                }

                // Try to send message to content script
                try {
                    await chrome.tabs.sendMessage(activeTab.id, {
                        type: 'factCheck',
                        correction: result
                    });
                } catch (error) {
                    console.error('Failed to send message to content script:', error);
                    // Continue execution to at least update popup
                }

                // Send response back to popup
                sendResponse({
                    success: true,
                    text: result
                });
            } catch (error) {
                console.error('Error:', error);
                sendResponse({
                    success: false,
                    error: error.message || 'An unknown error occurred'
                });
            }
        })();
        return true;
    }
});