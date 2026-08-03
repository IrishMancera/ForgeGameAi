import { config } from '../config.js';

export async function chatCompletion(
  systemPrompt: string,
  userMessage: string,
  contextJSON: string
): Promise<string | null> {
  const apiKey = config.gemini.apiKey || process.env.GEMINI_API_KEY;
  console.log('[DEBUG] gemini apiKey present:', !!apiKey, 'length:', apiKey?.length, 'preview:', apiKey?.slice(0, 6));
  if (!apiKey || apiKey.trim() === '' || apiKey.includes('')) {
    console.log('[DEBUG] Hit the early-return guard — this is why you get fallback text');
    // Return null to signal that fallback/rule-based execution should be used
    return null;
  }

  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey);

    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
      systemInstruction: systemPrompt,
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 2048,
      },
    });

    const result = await model.generateContent(
      `CONTEXT:\n${contextJSON}\n\nUSER PROMPT:\n${userMessage}`
    );

    return result.response.text() ?? null;
  } catch (error) {
    console.warn('[AI LLM] Gemini API call failed, falling back to rule engine:', error instanceof Error ? error.message : error);
    return null;
  }
}