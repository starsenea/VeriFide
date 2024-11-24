console.log("[CONTENT] Content script starting");

// Add message listener for responses from background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'factCheck' && message.correction) {
        showNotification(message.correction);
    }
});

function createMenuButton() {
    const button = document.createElement('div');
    button.id = 'verifide-menu-button';
    button.className = 'goog-inline-block goog-toolbar-button';
    button.setAttribute('role', 'button');
    button.setAttribute('data-tooltip', 'VeriFide Fact Check');
    
    const innerBox = document.createElement('div');
    innerBox.className = 'goog-toolbar-button-inner-box';
    
    const buttonContent = document.createElement('div');
    buttonContent.className = 'goog-toolbar-button-caption';
    buttonContent.textContent = 'VeriFide';
    
    innerBox.appendChild(buttonContent);
    button.appendChild(innerBox);

    // SIMPLIFIED: Just send message to background script
    button.addEventListener('click', () => {
        console.log('[CONTENT] Menu button clicked, sending menuButtonClicked message');
        chrome.runtime.sendMessage({ type: 'menuButtonClicked' });
    });

    return button;
}

function insertButton() {
    if (document.getElementById('verifide-menu-button')) {
        return;
    }
    
    const menuBar = document.querySelector('.docs-menubar');
    if (!menuBar) {
        console.log('[CONTENT] Menu bar not found, retrying in 1s...');
        setTimeout(insertButton, 1000);
        return;
    }
    
    const button = createMenuButton();
    menuBar.appendChild(button);
    console.log('[CONTENT] Button inserted successfully');
}

function showNotification(message, isError = false) {
    let notification = document.getElementById('verifide-notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'verifide-notification';
        notification.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            padding: 15px;
            background: white;
            border: 1px solid ${isError ? '#ff4444' : '#ccc'};
            border-radius: 4px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            z-index: 9999;
            color: ${isError ? '#ff4444' : 'black'};
            display: none;
        `;
        document.body.appendChild(notification);
    }
    
    notification.textContent = isError ? `Error: ${message}` : `Correction: ${message}`;
    notification.style.display = 'block';
    
    setTimeout(() => {
        notification.style.display = 'none';
    }, 5000);
}

// Initialize
setTimeout(insertButton, 1000);
console.log("[CONTENT] Content script loaded");