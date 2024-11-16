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
    const startTime = Date.now();

    // Check if the languageModel API is available
    if (!ai || !ai.languageModel) {
        throw new Error('AI Language Model API is not available.');
    }

    // Initialize the language model with more specific instructions
    const languageModel = await ai.languageModel.create({
        systemPrompt: `You are a fact-checking assistant. Your task is to analyze the given text and provide a clear, concise response in English. 
        Focus on verifying claims and identifying potential misinformation. 
        Respond in a professional, straightforward manner.`
    });
    
    // Use the initialized model instance with explicit language preference
    const responseText = await languageModel.prompt(prompt, {
        temperature: 0.7,
        maxOutputTokens: 800
    });

    const endTime = Date.now();
    const responseTime = endTime - startTime;
    console.log(`Response Time: ${responseTime}ms`);

    return { 
        success: true, 
        text: responseText,
        responseTime: responseTime 
    };
}