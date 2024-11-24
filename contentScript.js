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
    
    // Remove existing notification if it exists
    if (notification) {
        notification.remove();
    }
    
    // Create new notification
    notification = document.createElement('div');
    notification.id = 'verifide-notification';
    notification.style.cssText = `
        position: fixed;
        top: 150px;
        right: -350px;
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
    `;

    // Create close button
    const closeButton = document.createElement('div');
    closeButton.style.cssText = `
        position: absolute;
        top: 5px;
        right: 8px;
        width: 20px;
        height: 20px;
        cursor: pointer;
        color: ${isError ? '#d93025' : '#1a73e8'};
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        font-weight: bold;
        opacity: 0.7;
        transition: opacity 0.2s;
    `;
    closeButton.innerHTML = '×';
    closeButton.title = 'Close';
    
    // Hover effect
    closeButton.onmouseover = () => closeButton.style.opacity = '1';
    closeButton.onmouseout = () => closeButton.style.opacity = '0.7';
    
    // Click handler
    closeButton.onclick = () => {
        notification.style.right = '-350px';
        setTimeout(() => {
            notification.remove();
        }, 300);
    };

    // Create message container
    const messageContainer = document.createElement('div');
    messageContainer.style.cssText = `
        padding-right: 20px;
    `;
    messageContainer.textContent = isError ? `Error: ${message}` : `Correction: ${message}`;

    // Assemble notification
    notification.appendChild(closeButton);
    notification.appendChild(messageContainer);
    document.body.appendChild(notification);

    // Trigger slide-in
    requestAnimationFrame(() => {
        notification.style.right = '24px';
    });

    console.log('Notification created:', message); // Debug log
}

// Initialize
setTimeout(insertButton, 1000);
console.log("[CONTENT] Content script loaded");