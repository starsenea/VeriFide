document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded");
    
    const submitButton = document.getElementById("submitButton");
    const userInput = document.getElementById("userInput");
    const responseDiv = document.getElementById("response");
    
    // Verify elements are found
    console.log("Elements found:", {
        submitButton: !!submitButton,
        userInput: !!userInput,
        responseDiv: !!responseDiv
    });

    submitButton.addEventListener("click", async () => {
        console.log("Button clicked");
        
        const prompt = userInput.value;
        console.log("Input value:", prompt);
        
        responseDiv.textContent = "Loading...";
        
        try {
            console.log("Sending message to background...");
            chrome.runtime.sendMessage({ type: "processPrompt", prompt: prompt }, (response) => {
                if (chrome.runtime.lastError) {
                    console.error("Runtime error:", chrome.runtime.lastError);
                    responseDiv.textContent = "Error: Could not connect to background script";
                    return;
                }
                
                console.log("Received response:", response);
                if (response && response.text) {
                    responseDiv.textContent = response.text;
                    document.getElementById("response-time").textContent = 
                        `Response time: ${response.responseTime}ms`;
                } else {
                    responseDiv.textContent = "Error retrieving response.";
                }
            });
        } catch (error) {
            console.error("Error sending message:", error);
            responseDiv.textContent = "Error: " + error.message;
        }
    });
});