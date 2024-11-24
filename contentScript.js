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
            top: 150px;
            right: -350px; /* Start off-screen */
            padding: 16px 24px;
            background: ${isError ? '#fdecea' : '#e8f0fe'};
            border-left: 4px solid ${isError ? '#d93025' : '#1a73e8'};
            border-radius: 4px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            z-index: 9999;
            color: ${isError ? '#d93025' : '#1a73e8'};
            font-family: 'Google Sans', Roboto, Arial, sans-serif;
            font-size: 14px;
            line-height: 20px;
            width: 300px;
            transition: right 0.3s ease-in-out;
            display: none;
        `;
        document.body.appendChild(notification);
    }
    
    notification.textContent = isError ? `Error: ${message}` : `Correction: ${message}`;
    notification.style.display = 'block';
    
    // Trigger slide-in
    setTimeout(() => {
        notification.style.right = '24px';
    }, 100);
    
    // Slide-out and hide
    setTimeout(() => {
        notification.style.right = '-350px';
        setTimeout(() => {
            notification.style.display = 'none';
        }, 300);
    }, 4700);
}

// Initialize
setTimeout(insertButton, 1000);
console.log("[CONTENT] Content script loaded");