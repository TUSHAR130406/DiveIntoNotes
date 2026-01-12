
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const GEMINI_ENDPOINT =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";


/**
 * Ask Gemini using STRICTLY provided context.
 * No external knowledge allowed.
 */
async function askGeminiFromContext({ query, context }) {
  if (!GEMINI_API_KEY) {
    throw new Error("Gemini API key not configured");
  }

  const prompt = `
You are a strict question-answering assistant.

RULES:
- Answer ONLY using the provided context
- If the answer is not in the context, say: "Not found in the provided notes."
- Do NOT use external knowledge
- Do NOT hallucinate

CONTEXT:
${context}

QUESTION:
${query}
`;

  const response = await fetch(
    `${GEMINI_ENDPOINT}?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt }
            ]
          }
        ]
      })
    }
  );

  const data = await response.json();

  if (!data.candidates || data.candidates.length === 0) {
    throw new Error("No response from Gemini");
  }

  return data.candidates[0].content.parts[0].text.trim();
}

module.exports = {
  askGeminiFromContext
};
