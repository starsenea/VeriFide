console.log('Background script loaded and ready');

// AI model parameters
const AI_PARAMS = {
    temperature: 0,
    topK: 0.1,
    topP: 0.1
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Background received message:', message);
    
    if (message.type === 'checkDocument') {
        (async () => {
            try {
                const inputLength = message.content.length;
                const estimatedTokens = Math.ceil(inputLength / 4) * 2;
                
                // First, check if statement is subjective
                const subjectiveCheck = await ai.languageModel.create({
                    systemPrompt: `You determine if a statement contains ONLY opinions (subjective) or makes factual claims (objective).

RULES:
1. Reply ONLY with "SUBJECTIVE" or "OBJECTIVE"
2. Subjective = PURE opinions, preferences, feelings
3. Objective = ANY factual claims (even if incorrect)
4. If statement contains ANY factual claims, respond "OBJECTIVE"

Examples:
"Apples are better than oranges" -> "SUBJECTIVE" (pure preference)
"The sun revolves around earth" -> "OBJECTIVE" (factual claim, even though incorrect)
"Pizza is the best food" -> "SUBJECTIVE" (pure opinion)
"Water boils at 50C" -> "OBJECTIVE" (factual claim)
"I think the Earth is flat" -> "OBJECTIVE" (contains factual claim)
"Blue is the prettiest color" -> "SUBJECTIVE" (pure preference)
"Soccer was invented in 2000" -> "OBJECTIVE" (factual claim)
"I love chocolate ice cream" -> "SUBJECTIVE" (personal feeling)`
                });

                const isSubjective = await subjectiveCheck.prompt(message.content);
                console.log('Subjective check:', isSubjective);

                if (isSubjective.trim().toUpperCase() === 'SUBJECTIVE') {
                    sendResponse({
                        success: true,
                        text: "This is a subjective statement and cannot be fact-checked."
                    });
                    return;
                }

                // If objective, proceed with fact checking
                console.log('Creating fact-check session...');
                const session = await ai.languageModel.create({
                    systemPrompt: `You are a fact checker. Your task is to correct factual errors in statements.

RULES:
1. If you find a factual error, provide ONLY the corrected statement
2. If no errors, respond with exactly "No factual errors found."
3. Do not include any markers, brackets, or explanations

Examples:

Input: "The sun revolves around earth"
Output: "The Earth revolves around the Sun"

Input: "Water boils at 50c"
Output: "Water boils at 100°C"

Input: "The Earth orbits the Sun"
Output: "No factual errors found"

REMEMBER: Return ONLY the corrected statement or "No factual errors found"`,
                    temperature: AI_PARAMS.temperature,
                    maxOutputTokens: estimatedTokens,
                    topK: AI_PARAMS.topK,
                    topP: AI_PARAMS.topP
                });

                console.log('Sending prompt to AI...');
                const result = await session.prompt(message.content);
                console.log('AI response:', result);

                sendResponse({
                    success: true,
                    text: result
                });
            } catch (error) {
                console.error('Error:', error);
                sendResponse({
                    success: false,
                    error: error.message
                });
            }
        })();
        return true;
    }
});