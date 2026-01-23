
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const GEMINI_ENDPOINT =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

/**
 * Ask Gemini WITHOUT any context.
 * This is explicitly external AI usage.
 * No notes, no restrictions.
 */
async function askGeminiGeneral({ query }) {
  if (!GEMINI_API_KEY) {
    throw new Error("Gemini API key not configured");
  }

  if (!query) {
    throw new Error("Query is required");
  }

  const prompt = `
You are a knowledgeable assistant.

Answer the following question clearly and concisely.
You may use your general knowledge.

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
            parts: [{ text: prompt }]
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
  askGeminiGeneral
};
