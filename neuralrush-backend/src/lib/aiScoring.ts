/**
 * AI Scoring for Creativity Exercises
 *
 * Uses Google Gemini (free) instead of Anthropic Claude (paid).
 * Same prompt structure, same JSON output format, same fallback behavior.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../config/env.js';

interface AIScoreResult {
  score: number;
  feedback: string;
}

let genAI: GoogleGenerativeAI | null = null;

if (env.GOOGLE_AI_API_KEY) {
  genAI = new GoogleGenerativeAI(env.GOOGLE_AI_API_KEY);
  console.log('✅ Google Gemini AI initialized for creativity scoring');
} else {
  console.log('ℹ️  No GOOGLE_AI_API_KEY — creativity exercises will use fallback scoring');
}

/**
 * Score a creativity exercise using Gemini AI.
 * Falls back to simple word-count scoring if API is unavailable.
 */
export async function scoreCreativityExercise(
  exerciseType: string,
  prompt: string,
  userAnswer: string
): Promise<AIScoreResult> {
  // If no API key, use fallback immediately
  if (!genAI) {
    return fallbackScore(userAnswer);
  }

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: {
        maxOutputTokens: 100,
        temperature: 0.3,
      },
    });

    const rubric = getRubric(exerciseType);

    const systemPrompt = `You are scoring a brain training exercise. You are an expert evaluator.

Exercise Type: ${exerciseType}
Exercise Prompt: ${prompt}

Scoring Rubric: ${rubric}

User's Answer: "${userAnswer}"

Respond ONLY with valid JSON in this exact format: {"score": <number 0-100>, "feedback": "<one sentence>"}
Do NOT include any other text, explanation, or markdown. Just the JSON object.`;

    const result = await model.generateContent(systemPrompt);
    const responseText = result.response.text().trim();

    // Parse JSON from response — handle potential markdown code blocks
    const jsonStr = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(jsonStr) as AIScoreResult;

    // Validate the response
    if (typeof parsed.score !== 'number' || parsed.score < 0 || parsed.score > 100) {
      return fallbackScore(userAnswer);
    }

    return {
      score: Math.round(parsed.score),
      feedback: parsed.feedback || 'Scored by AI.',
    };
  } catch (err) {
    console.warn('⚠️  Gemini AI scoring failed, using fallback:', (err as Error).message);
    return fallbackScore(userAnswer);
  }
}

function getRubric(exerciseType: string): string {
  switch (exerciseType) {
    case 'ALTERNATIVE_USES':
      return 'Score based on: quantity of unique uses (40%) and originality/creativity of each use (60%). More unique and unexpected uses score higher.';
    case 'WORD_CHAIN':
      return 'Score based on: valid word connections (50%), creativity of path (30%), and efficiency/brevity (20%).';
    case 'STORY_SEED':
      return 'Score based on: creative use of all given words (40%), coherence of story (30%), and originality (30%).';
    default:
      return 'Score based on creativity (50%), relevance (30%), and effort/detail (20%).';
  }
}

function fallbackScore(userAnswer: string): AIScoreResult {
  const wordCount = userAnswer.trim().split(/\s+/).filter(Boolean).length;
  const score = Math.min(wordCount * 5, 100);
  return {
    score,
    feedback: 'Scored automatically.',
  };
}
