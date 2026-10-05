// Turns a farmer's health report into an AI-assisted RISK TRIAGE.
//
// This is NOT a diagnosis service. It produces a risk level, general guidance,
// warning signs and follow-up questions. If anything about the AI is unsafe or
// unavailable, it returns a deterministic, diagnosis-free fallback instead.
const { z } = require('zod');
const geminiService = require('./geminiService');
const { env } = require('../config/env');

const RISK_LEVELS = ['LOW', 'MODERATE', 'HIGH'];

// Shown on every AI response so the farmer is never misled.
const DISCLAIMER =
  'VetAlert provides health-risk guidance and does not replace professional veterinary diagnosis.';

// If the AI ever uses wording that claims a definitive diagnosis, we refuse the
// answer and use the safe fallback. This is a defence-in-depth guard on top of
// the prompt instructions.
const FORBIDDEN_PHRASES = [
  'definitely has',
  'confirmed diagnosis',
  'diagnosis is',
  'is diagnosed with',
  'has been diagnosed',
  'animal is infected with',
  'you have been diagnosed',
  'outbreak confirmed',
  'positive for',
];

// The exact JSON shape we accept from Gemini. strictObject() means any missing
// key, wrong type OR unexpected extra key makes validation fail -> safe fallback.
const aiResponseSchema = z.strictObject({
  riskLevel: z.enum(RISK_LEVELS),
  assessment: z.string().trim().min(10).max(2000),
  recommendations: z.string().trim().min(10).max(2000),
  warningSigns: z.array(z.string().trim().min(3).max(300)).max(20),
  veterinaryAttentionRecommended: z.boolean(),
  followUpQuestions: z.array(z.string().trim().min(3).max(300)).max(10),
});

// ---- Prompt ----------------------------------------------------------------
const INSTRUCTIONS = `You are a livestock health RISK-TRIAGE assistant for smallholder farmers in Zimbabwe.
You are NOT a veterinarian and you MUST NOT diagnose disease.

Hard rules:
1. Never state or imply that an animal definitely has a specific disease.
2. Never prescribe medication or dosages.
3. Use cautious, plain language such as "the reported signs may indicate",
   "possible concerns include", or "a health concern cannot be ruled out".
4. Base your answer ONLY on the report data below. Do not invent facts.
5. If the information is limited, say so and ask follow-up questions.
6. Recommend contacting a qualified veterinary professional when signs are serious or unclear.
7. Reply with ONLY a JSON object - no markdown, no code fences, no extra text.

Return JSON with EXACTLY these keys:
{
  "riskLevel": "LOW" | "MODERATE" | "HIGH",
  "assessment": "2-4 sentences about the risk level and possible general concerns. Not a diagnosis.",
  "recommendations": "General practical guidance. No medication names and no dosages.",
  "warningSigns": ["signs that would need urgent veterinary attention"],
  "veterinaryAttentionRecommended": true or false,
  "followUpQuestions": ["questions that would help clarify the situation"]
}`;

const buildPrompt = (data) => `${INSTRUCTIONS}\n\nREPORT DATA (JSON):\n${JSON.stringify(data, null, 2)}`;

// ---- Trusted input ---------------------------------------------------------
// Built ONLY from database records. The farmer's account details (email, phone,
// password, ids) are deliberately excluded.
const buildStructuredInput = (report) => ({
  animal: report.animal
    ? {
        type: report.animal.animalType,
        name: report.animal.name,
        breed: report.animal.breed,
        ageYears: report.animal.age,
        sex: report.animal.sex,
      }
    : null,
  location: report.farm
    ? {
        province: report.farm.province,
        district: report.farm.district,
        ward: report.farm.ward,
        village: report.farm.village,
      }
    : null,
  report: {
    title: report.title,
    description: report.description,
    symptomsDuration: report.symptomsDuration,
    appetite: report.appetite,
    breathingDifficulty: report.breathingDifficulty,
    affectedAnimals: report.affectedAnimals,
    recentMovement: report.recentMovement,
    recentVaccination: report.recentVaccination,
    recentTreatment: report.recentTreatment,
    additionalNotes: report.additionalNotes,
  },
  symptoms: (report.symptoms || []).map((link) => link.symptom?.name).filter(Boolean),
});

// Gemini is asked for JSON, but we still tolerate stray markdown fences.
const extractJson = (text) => {
  if (typeof text !== 'string') {
    throw new Error('AI response was not text.');
  }
  const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('AI response did not contain a JSON object.');
  }
  return JSON.parse(cleaned.slice(start, end + 1));
};

// Returns true if the AI text contains wording that claims a diagnosis.
const containsDiagnosticClaim = (result) => {
  const combined = [result.assessment, result.recommendations, ...result.warningSigns, ...result.followUpQuestions]
    .join(' ')
    .toLowerCase();
  return FORBIDDEN_PHRASES.some((phrase) => combined.includes(phrase));
};

// ---- Deterministic fallback ------------------------------------------------
// Used whenever Gemini is unavailable or its answer cannot be trusted.
// It NEVER invents a diagnosis - it only rates risk from the report data and
// gives safe, general guidance.
const FALLBACK_WARNING_SIGNS = [
  'Laboured, noisy or rapid breathing',
  'Not eating or drinking at all',
  'Unable to stand or walk normally',
  'Sudden death of one or more animals',
  'Signs spreading quickly to other animals',
];

// A simple, explainable score. Higher = more warning signs in the report.
const scoreReport = (data) => {
  const r = data.report || {};
  const symptomCount = (data.symptoms || []).length;
  let score = 0;

  if (r.breathingDifficulty === true) score += 3;

  const affected = Number(r.affectedAnimals) || 0;
  if (affected >= 5) score += 3;
  else if (affected >= 3) score += 2;
  else if (affected >= 2) score += 1;

  const appetite = String(r.appetite || '').toLowerCase();
  if (/none|no appetite|not eating|off feed|anorexi/.test(appetite)) score += 2;
  else if (/reduced|poor|decreased|very little|less than usual/.test(appetite)) score += 1;

  if (symptomCount >= 5) score += 2;
  else if (symptomCount >= 3) score += 1;

  if (r.recentMovement === true) score += 1;

  return score;
};

const riskFromScore = (score) => {
  if (score >= 4) return 'HIGH';
  if (score >= 2) return 'MODERATE';
  return 'LOW';
};

const buildFollowUpQuestions = (data) => {
  const r = data.report || {};
  const questions = [];

  if (!r.symptomsDuration) questions.push('How many days has the animal shown these signs?');
  if ((data.symptoms || []).length === 0) {
    questions.push('Which specific signs have you noticed (for example fever, coughing, diarrhoea or wounds)?');
  }
  if (r.affectedAnimals === null || r.affectedAnimals === undefined) {
    questions.push('How many animals are affected so far?');
  }
  if (!r.appetite) questions.push('Is the animal still eating and drinking normally?');
  questions.push('Has any animal died recently?');

  return questions.slice(0, 5);
};

const buildFallback = (data) => {
  const riskLevel = riskFromScore(scoreReport(data));

  return {
    riskLevel,
    assessment:
      'The automated AI assessment is currently unavailable, so this is general guidance based only on the ' +
      `information you provided. The reported signs suggest a ${riskLevel} risk level. This is not a diagnosis ` +
      'and it does not identify a specific disease.',
    recommendations:
      'Keep the affected animal separate from the rest of the herd, make sure it has clean water and normal feed, ' +
      'and watch it closely. Contact a veterinary professional for advice, especially if the signs get worse. ' +
      'Do not give any medication without veterinary advice.',
    warningSigns: FALLBACK_WARNING_SIGNS,
    veterinaryAttentionRecommended: riskLevel !== 'LOW',
    followUpQuestions: buildFollowUpQuestions(data),
  };
};

// ---- Orchestration ---------------------------------------------------------
// Short, safe label for logging. We never log the AI text or the report contents.
const failureCategory = (err) => {
  if (err.name === 'AiServiceError') return 'ai-service-unavailable';
  if (err.name === 'ZodError') return 'invalid-ai-response';
  return 'unsafe-ai-response';
};

const triageHealthReport = async (structured) => {
  try {
    const text = await geminiService.generate(buildPrompt(structured));
    const parsed = extractJson(text);
    const result = aiResponseSchema.parse(parsed);

    if (containsDiagnosticClaim(result)) {
      throw new Error('AI response contained diagnostic wording.');
    }

    return { source: 'GEMINI', ...result };
  } catch (err) {
    // Log a short reason only (never the AI text or the report contents).
    if (env.NODE_ENV === 'development') {
      console.warn(`[triage] using safe fallback (reason: ${failureCategory(err)}).`);
    }
    return { source: 'FALLBACK', ...buildFallback(structured) };
  }
};

module.exports = {
  DISCLAIMER,
  RISK_LEVELS,
  buildStructuredInput,
  buildFallback,
  buildPrompt,
  triageHealthReport,
};
