document.getElementById('submitButton').addEventListener('click', () => {
    const prompt = document.getElementById('promptInput').value;

    chrome.runtime.sendMessage(
        { type: 'SEND_PROMPT', prompt },
        (response) => {
            document.getElementById('response').textContent = response.result;
        }
    );
});