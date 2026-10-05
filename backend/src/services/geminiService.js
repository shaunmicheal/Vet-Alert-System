// The ONLY file that talks to Google Gemini.
//
// The API key is read from the server environment and is NEVER sent to the
// frontend and NEVER included in an error message. Every failure is turned into
// a private AiServiceError so callers can fall back safely.
const { env } = require('../config/env');

// A private error type: lets callers tell "AI unavailable" apart from a real bug.
class AiServiceError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AiServiceError';
  }
}

// ---- Test hook -------------------------------------------------------------
// Automated tests replace the real network call with a stub so the suite stays
// fast, deterministic and works with no API key. It is never set in production.
let mockGenerate = null;
const setMockGenerate = (fn) => {
  mockGenerate = fn;
};
const resetMockGenerate = () => {
  mockGenerate = null;
};

const isConfigured = () => Boolean(env.GEMINI_API_KEY);

// The SDK is an ES module, so we load it with a dynamic import() and cache the client.
let clientPromise = null;
const getClient = () => {
  if (!clientPromise) {
    clientPromise = import('@google/genai').then(
      (mod) => new mod.GoogleGenAI({ apiKey: env.GEMINI_API_KEY }),
    );
  }
  return clientPromise;
};

// Stops a request from hanging forever if Gemini is slow or unreachable.
const withTimeout = (promise, ms) => {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new AiServiceError('AI request timed out.')), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
};

// Sends the prompt and returns the model's raw text reply.
// Throws AiServiceError for EVERY problem: no key, timeout, blocked, network, empty.
const generate = async (prompt) => {
  if (mockGenerate) {
    return mockGenerate(prompt); // tests only
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
    // Never pass on the raw SDK error - it can contain request details.
    if (err instanceof AiServiceError) throw err;
    throw new AiServiceError('The AI service could not be reached.');
  }
};

module.exports = { generate, isConfigured, AiServiceError, setMockGenerate, resetMockGenerate };
