console.log('=== Content Script Loaded ===');

// Test function to verify script is working
// function testHighlight() { ... }

// Test message handling
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('=== Content Script Received Message ===', message);
    
    if (message.type === 'factCheck') {
        console.log('Showing notification for:', {
            correction: message.correction,
            originalText: message.originalText
        });
        showNotification(message.correction, false, message.originalText);
    }
});

function createMenuButton() {
    const button = document.createElement('div');
    button.id = 'verifide-menu-button';
    button.className = 'goog-inline-block goog-toolbar-button';
    button.setAttribute('role', 'button');
    button.setAttribute('data-tooltip', 'VeriFide Fact Check');
    button.style.cssText = `
        background-color: #f9fbfd; 
        border-radius: 4px;  
        margin: 0 2px;         
        transition: all 0.2s;
        height: 22px;
        line-height: 22px;
        padding: 0 4px;
        letter-spacing: 0.4px;
        position: relative;
        overflow: hidden;
    `;
    
    // Add gradient overlay div
    const gradientOverlay = document.createElement('div');
    gradientOverlay.className = 'gradient-overlay';
    gradientOverlay.style.cssText = `
        position: absolute;
        top: 0;
        left: -100%;
        width: 200%;
        height: 100%;
        background: linear-gradient(
            90deg, 
            transparent 0%,
            rgba(255,255,255,0.8) 25%,
            rgba(255,255,255,0.8) 50%,
            transparent 100%
        );
        opacity: 0;
        transition: opacity 0.3s ease-out;
        pointer-events: none;
        animation: gradientSlide 1.5s linear infinite;
    `;

    // Add the animation keyframes to the document
    const style = document.createElement('style');
    style.textContent = `
        @keyframes gradientSlide {
            0% { transform: translateX(0%); }
            100% { transform: translateX(100%); }
        }
    `;
    document.head.appendChild(style);
    
    // Modify click handler to show/hide gradient
    button.addEventListener('click', () => {
        console.log('[CONTENT] Menu button clicked, sending menuButtonClicked message');
        gradientOverlay.style.opacity = '1';
        chrome.runtime.sendMessage({ type: 'menuButtonClicked' });
        
        // Listen for response to hide the gradient
        chrome.runtime.onMessage.addListener(function hideGradient(msg) {
            if (msg.type === 'factCheck' || msg.type === 'error') {
                // Let the current animation cycle complete
                setTimeout(() => {
                    gradientOverlay.style.opacity = '0';
                }, 50);
                chrome.runtime.onMessage.removeListener(hideGradient);
            }
        });
    });

    // Add hover effect
    button.addEventListener('mouseover', () => {
        button.style.backgroundColor = '#e9ebee'; 
    });
    button.addEventListener('mouseout', () => {
        button.style.backgroundColor = '#f9fbfd'; 
    });
    
    const innerBox = document.createElement('div');
    innerBox.className = 'goog-toolbar-button-inner-box';
    innerBox.style.cssText = `
        height: 20.75px;
        line-height: 20.75px;
        padding: 0;
    `;
    
    const buttonContent = document.createElement('div');
    buttonContent.className = 'goog-toolbar-button-caption';
    buttonContent.textContent = 'VeriFide';
    buttonContent.style.cssText = `
        font-family: "Roboto Mono", sans-serif;
        font-size: 14px;
        font-weight: 305;
        color: #1e1e21
    `;
    
    innerBox.appendChild(buttonContent);
    button.appendChild(gradientOverlay);
    button.appendChild(innerBox);

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

const SPACING = 20;
const INITIAL_TOP = 150;
let notificationCount = 0;

function showNotification(message, isError = false, originalText = '') {
    notificationCount++;

    let notification = document.createElement('div');
    notification.id = `verifide-notification-${notificationCount}`;
    notification.style.cssText = `
        position: fixed;
        right: -350px;
        padding: 16px 24px;
        background: ${isError ? '#fdecea' : '#e8f0fe'};
        border-left: 4px solid ${isError ? '#d93025' : '#1a73e8'};
        border-radius: 4px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        z-index: ${9999 - notificationCount};
        color: ${isError ? '#d93025' : '#1a73e8'};
        font-family: 'Google Sans', Roboto, Arial, sans-serif;
        font-size: 14px;
        line-height: 20px;
        width: 518px;
        transition: right 0.3s ease-in-out;
        box-sizing: border-box;
        max-height: calc(100vh - 100px);
        overflow-y: auto;
    `;

    // Create close button
    const closeButton = document.createElement('div');
    closeButton.style.cssText = `
        position: absolute;
        top: 8px;
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
        z-index: 1;
    `;
    closeButton.innerHTML = '×';
    closeButton.title = 'Close';
    
    closeButton.onmouseover = () => closeButton.style.opacity = '1';
    closeButton.onmouseout = () => closeButton.style.opacity = '0.7';
    
    closeButton.onclick = () => {
        notification.style.right = '-350px';
        setTimeout(() => {
            notification.remove();
            repositionNotifications();
        }, 300);
    };

    // Create message container with properly rendered HTML
    const messageContainer = document.createElement('div');
    messageContainer.style.cssText = `
        padding-right: 20px;
        word-wrap: break-word;
    `;

    // Create original text div
    const originalDiv = document.createElement('div');
    originalDiv.style.cssText = 'color: #666; font-size: 12px; margin-bottom: 8px; border-bottom: 1px solid #eee; padding-bottom: 8px;';
    originalDiv.textContent = `Original: ${originalText}`;

    // Create correction div that properly renders HTML
    const correctionDiv = document.createElement('div');
    correctionDiv.style.cssText = 'color: #1a73e8;';
    correctionDiv.innerHTML = `Correction: ${message}`; // Using innerHTML to render HTML tags

    messageContainer.appendChild(originalDiv);
    messageContainer.appendChild(correctionDiv);

    notification.appendChild(closeButton);
    notification.appendChild(messageContainer);
    document.body.appendChild(notification);

    requestAnimationFrame(() => {
        positionNotifications();
        notification.style.right = '24px';
    });
}

// Add scroll event listener to reposition notifications
document.addEventListener('scroll', () => {
    requestAnimationFrame(positionNotifications);
});

function positionNotifications() {
    const notifications = document.querySelectorAll('[id^="verifide-notification-"]');
    let currentTop = INITIAL_TOP;
    const scrollTop = window.scrollY;

    notifications.forEach((notification, index) => {
        notification.style.top = `${currentTop + scrollTop}px`;
        const height = notification.offsetHeight;
        currentTop += height + SPACING;
    });
    notificationCount = notifications.length;
}

function repositionNotifications() {
    positionNotifications();
}

function highlightText(text) {
    removeHighlight();

    // Focus on the Google Docs content area
    const docContent = document.querySelector('.kix-appview-editor');
    if (!docContent) {
        console.error('Could not find Google Docs editor');
        return;
    }

    // Find all text-containing elements
    const textElements = docContent.querySelectorAll('.kix-lineview-content');
    
    textElements.forEach(element => {
        const elementText = element.textContent;
        if (elementText === text) {  // Exact match only
            try {
                const highlight = document.createElement('div');
                highlight.className = 'verifide-highlight';
                const rect = element.getBoundingClientRect();
                
                highlight.style.cssText = `
                    position: absolute;
                    left: ${rect.left + window.scrollX}px;
                    top: ${rect.top + window.scrollY}px;
                    width: ${rect.width}px;
                    height: ${rect.height}px;
                    background-color: rgba(255, 215, 0, 0.3);
                    pointer-events: none;
                    z-index: 100;
                `;
                
                document.body.appendChild(highlight);
            } catch (error) {
                console.error('Error creating highlight:', error);
            }
        }
    });
}

function removeHighlight() {
    const highlights = document.querySelectorAll('.verifide-highlight');
    highlights.forEach(h => h.remove());
}

// Add scroll handler to update highlight positions
document.addEventListener('scroll', () => {
    const activeNotification = document.querySelector('[id^="verifide-notification-"]:hover');
    if (activeNotification) {
        const originalText = activeNotification.getAttribute('data-original-text');
        if (originalText) {
            highlightText(originalText);
        }
    }
});

// Initialize
setTimeout(insertButton, 1000);
console.log("[CONTENT] Content script loaded");