console.log("[CONTENT] Content script starting");

let port = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

function connectPort() {
    try {
        port = chrome.runtime.connect({ name: "verifide" });
        setupPortListeners();
        reconnectAttempts = 0;
        return true;
    } catch (error) {
        console.error("[CONTENT] Port connection failed:", error);
        return false;
    }
}

function setupPortListeners() {
    if (!port) return;

    port.onDisconnect.addListener(() => {
        console.log("[CONTENT] Port disconnected, attempting reconnect...");
        port = null;
        if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
            reconnectAttempts++;
            setTimeout(connectPort, 1000 * reconnectAttempts);
        } else {
            console.error("[CONTENT] Max reconnection attempts reached");
        }
    });

    port.onMessage.addListener((msg) => {
        console.log("[CONTENT] Received port message:", msg);
        
        if (msg.type === 'correction' && msg.correction) {
            showNotification(msg.correction);
        } else if (msg.type === 'error') {
            showNotification(`Error: ${msg.message}`, true);
        } else {
            showNotification('Received invalid response from analysis', true);
        }
    });
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

// Initial connection
connectPort();
console.log("[CONTENT] Content script loaded");