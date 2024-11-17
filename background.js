// Remove DOM-related code and handle message passing
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("Message received in background:", request); // Debug log 1
    
    if (request.type === "processPrompt") {
        console.log("Processing prompt:", request.prompt); // Debug log 2
        
        handlePrompt(request.prompt)
            .then(response => {
                console.log("Sending response:", response); // Debug log 3
                sendResponse(response);
            })
            .catch(error => {
                console.error("Error:", error); // Debug log 4
                sendResponse({ 
                    success: false, 
                    text: error.message 
                });
            });
        return true;
    }
});

// Add this to check if script loads
console.log("Background script loaded");

/**
 * Handles the prompt processing and returns a Promise
 */
async function handlePrompt(prompt) {
    if (!prompt || prompt.trim().length === 0) {
        throw new Error('Empty document content received');
    }
    const startTime = Date.now();

    if (!ai || !ai.languageModel) {
        throw new Error('AI Language Model API is not available.');
    }

    // First model: Just get the correct facts
    const factModel = await ai.languageModel.create({
        systemPrompt: `You are a fact database. When given a statement, output ONLY the correct version of any incorrect facts. Output ONLY the corrected word or phrase, nothing else.`
    });
    
    // Get just the correction
    const correction = await factModel.prompt(`What is the correct version of this fact: ${prompt}`, {
        temperature: 0.0,
        maxOutputTokens: 10,  // Very limited to force brief response
        topP: 0.5,
        topK: 50
    });

    // Second model: Replace the incorrect fact with the correction
    const replacementModel = await ai.languageModel.create({
        systemPrompt: `You are a text editor. Replace any incorrect facts in the input with the provided correction. Return the complete corrected text only.`
    });
    
    const finalText = await replacementModel.prompt(`Original text: "${prompt}"
Correction: "${correction}"
Return the text with the correction applied:`, {
        temperature: 0.0,
        maxOutputTokens: prompt.length,
        topP: 0.6,
        topK: 70
    });

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    return { 
        success: true, 
        text: finalText.trim(),
        responseTime: responseTime 
    };
}