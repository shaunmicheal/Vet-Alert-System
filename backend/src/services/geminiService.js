const { env } = require('../config/env');

class AiServiceError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AiServiceError';
  }
}

let mockGenerate = null;
const setMockGenerate = (fn) => {
  mockGenerate = fn;
};
const resetMockGenerate = () => {
  mockGenerate = null;
};

const isConfigured = () => Boolean(env.GEMINI_API_KEY);

let clientPromise = null;
const getClient = () => {
  if (!clientPromise) {
    clientPromise = import('@google/genai').then(
      (mod) => new mod.GoogleGenAI({ apiKey: env.GEMINI_API_KEY }),
    );
  }
  return clientPromise;
};

const withTimeout = (promise, ms) => {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new AiServiceError('AI request timed out.')), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
};

const generate = async (prompt) => {
  if (mockGenerate) {
    return mockGenerate(prompt);
  }

  if (!isConfigured()) {
    throw new AiServiceError('AI service is not configured.');
  }

  try {
    const client = await getClient();
    const response = await withTimeout(
      client.models.generateContent({
        model: env.GEMINI_MODEL,
        contents: prompt,
        config: { temperature: 0.2, responseMimeType: 'application/json' },
      }),
      env.GEMINI_TIMEOUT_MS,
    );

    const text = response?.text;
    if (!text || typeof text !== 'string') {
      throw new AiServiceError('AI returned an empty response.');
    }
    return text;
  } catch (err) {
    if (err instanceof AiServiceError) throw err;
    throw new AiServiceError('The AI service could not be reached.');
  }
};

module.exports = { generate, isConfigured, AiServiceError, setMockGenerate, resetMockGenerate };
