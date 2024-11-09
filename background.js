let timeout;
const userinput = [];

document.getElementById("prompt").addEventListener("input", () => {
  clearTimeout(timeout);
  timeout = setTimeout(() => {sendprompt()}, 500);
});

function logprompt(prompt) {
  return new Promise((resolve => {
    userinput.push({prompt: prompt, resolve: resolve});
    if (userinput.length === 1) {
      processqueue();
    }
  }));
}


async function processqueue() {
  while (userinput.length > 0) {
    const {prompt, resolve} = userinput[0];
    await handlePrompt(prompt);
    resolve();
    userinput.shift();
  }
}


async function handlePrompt(prompt) {
  const responseDiv = document.getElementById('response');
  const responseTimeDiv = document.getElementById('response-time');
  
  if (prompt.trim() === '') {
      responseDiv.textContent = '';
      responseTimeDiv.textContent = '';
      return;
  }

  responseDiv.textContent = 'Waiting for response...';

  try {
      const startTime = new Date().getTime();
      const canCreate = await window.ai.canCreateTextSession();
      
      if (canCreate !== "no") {
          const session = await window.ai.createTextSession();
          responseDiv.textContent = ''; // Clear previous response
          const stream = session.promptStreaming(`${selectedMode}: ${prompt}`);

          let result = '';
          let previousLength = 0;
          for await (const chunk of stream) {
              const newContent = chunk.slice(previousLength);
              previousLength = chunk.length;
              result += newContent;
              responseDiv.textContent = result;
          }
          
          responseDiv.scrollIntoView({ behavior: 'smooth' });

          // Wait a bit to ensure the stream has finished
          await new Promise(resolve => setTimeout(resolve, 100));
          
          const endTime = new Date().getTime();
          const responseTime = endTime - startTime;
          responseTimeDiv.textContent = `${responseTime}ms`;
      } else {
          throw new Error('Cannot create text session.');
      }
  } catch (error) {
      console.error(error);
      responseDiv.textContent = 'Error: ' + error.message;
      responseTimeDiv.textContent = '';
  }
}


async function sendprompt() {
  const prompt = document.getElementById("prompt").value;
  await logprompt(prompt);
}


function updateClock() {
  const now = new Date();
  const hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = String(hours % 12 || 12).padStart(2, '0');
  const timeString = `${displayHours}:${minutes}:${seconds} ${period}`;
  document.getElementById('clock').textContent = timeString;
  
  const dateString = now.toDateString();
  document.getElementById('date').textContent = dateString;

  const userAgent = navigator.userAgent;
  const chromeVersion = userAgent.match(/Chrome\/[\d.]+/)?.[0] || 'Chrome/unknown';
  document.getElementById('browser-info').textContent = chromeVersion;
}

setInterval(updateClock, 1000);
updateClock();