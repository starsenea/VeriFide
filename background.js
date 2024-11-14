chrome.runtime.onInstalled.addListener(() => {
    console.log('Extension Installed');
});

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
    if (request.type === 'SEND_PROMPT') {
        const prompt = request.prompt;

        try {
            // Create a prompter instance and send the prompt
            const prompter = await chrome.prompter.createPrompt();
            const stream = await prompter.streamText(prompt);

            // Read the stream response
            let result = '';
            const reader = stream.getReader();
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                result += value;
            }

            sendResponse({ result });
        } catch (error) {
            console.error("Error with Prompt API:", error);
            sendResponse({ result: `Error: ${error.message}` });
        }
    }
    return true; // Indicate async response
});
