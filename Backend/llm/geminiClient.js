const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const GEMINI_ENDPOINT =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

/**
 * Ask Gemini using STRICTLY provided context.
 * Gemini must decide whether the answer exists in context.
 */
async function askGeminiFromContext({ query, context }) {
  if (!GEMINI_API_KEY) {
    throw new Error("Gemini API key not configured");
  }

  const prompt = `
You are a strict question-answering assistant.

TASK:
- Decide whether the QUESTION can be answered using ONLY the CONTEXT.

RULES:
- If the answer IS present in the context:
  - Answer the question clearly and concisely.
- If the answer is NOT present in the context:
  - Respond with EXACTLY this string:
    NOT_FOUND_IN_CONTEXT

IMPORTANT:
- Do NOT use any external knowledge.
- Do NOT infer or guess.
- Do NOT rephrase the context unless answering.

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

  const text = data.candidates[0].content.parts[0].text.trim();

  if (text === "NOT_FOUND_IN_CONTEXT") {
    return {
      found: false,
      answer: null
    };
  }

  return {
    found: true,
    answer: text
  };
}

module.exports = {
  askGeminiFromContext
};
