// Connect to background script when popup opens
const port = chrome.runtime.connect({ name: 'popup' });

// Listen for messages from background
port.onMessage.addListener((message) => {
    console.log('Popup received message:', message);
});

document.addEventListener('DOMContentLoaded', async () => {
    const toggleSwitch = document.getElementById("toggleSwitch");
    const responseDiv = document.getElementById("response");
    responseDiv.style.display = 'none'; // Hide the response div

    try {
        // Get the current state from storage and set the toggle
        const { verifideEnabled } = await chrome.storage.local.get('verifideEnabled');
        console.log('Retrieved state:', verifideEnabled); // Debug log
        
        // Explicitly set the checkbox state
        toggleSwitch.checked = verifideEnabled === true;

    } catch (error) {
        console.error('Error retrieving state:', error);
    }

    toggleSwitch.addEventListener("change", async () => {
        const isEnabled = toggleSwitch.checked;
        console.log('Toggle changed to:', isEnabled);
        
        try {
            // Save state to storage
            await chrome.storage.local.set({ verifideEnabled: isEnabled });
            console.log('State saved:', isEnabled);

            // Get current tab
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (!tab?.url?.includes('docs.google.com/document')) {
                toggleSwitch.checked = false;
                await chrome.storage.local.set({ verifideEnabled: false });
                return;
            }

            // Send message to content script to show/hide button
            try {
                await chrome.tabs.sendMessage(tab.id, {
                    type: 'toggleVerifide',
                    enabled: isEnabled
                });
            } catch (error) {
                // If content script isn't ready, inject it
                if (error.message.includes("Could not establish connection")) {
                    await chrome.scripting.executeScript({
                        target: { tabId: tab.id },
                        files: ['contentScript.js']
                    });
                    // Retry sending the message
                    await chrome.tabs.sendMessage(tab.id, {
                        type: 'toggleVerifide',
                        enabled: isEnabled
                    });
                } else {
                    throw error;
                }
            }
        } catch (error) {
            console.error('Error:', error);
        }
    });
});

// Add this to verify the state when popup closes
window.addEventListener('unload', () => {
    chrome.storage.local.get('verifideEnabled', (result) => {
        console.log('State on popup close:', result.verifideEnabled);
    });
});