document.getElementById("submitButton").addEventListener("click", async () => {
    const prompt = document.getElementById("prompt").value;
    const responseDiv = document.getElementById("response");

    responseDiv.textContent = "Loading...";

    // Send the prompt to the background script
    chrome.runtime.sendMessage({ type: "processPrompt", prompt: prompt }, (response) => {
        if (response && response.text) {
            responseDiv.textContent = response.text;
        } else {
            responseDiv.textContent = "Error retrieving response.";
        }
    });
});