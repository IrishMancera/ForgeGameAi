import axios from 'axios';
import { config } from '../config.js';

export async function chatCompletion(
  systemPrompt: string,
  userMessage: string,
  contextJSON: string
): Promise<string | null> {
  const openaiKey = config.openai?.apiKey || process.env.OPENAI_API_KEY;
  const geminiKey = config.gemini?.apiKey || process.env.GEMINI_API_KEY;

  // 1. Try OpenAI if key is present
  if (openaiKey && openaiKey.trim() !== '') {
    try {
      const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `CONTEXT:\n${contextJSON}\n\nUSER PROMPT:\n${userMessage}` },
          ],
          temperature: 0.4,
          max_tokens: 2048,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${openaiKey.trim()}`,
          },
          timeout: 20000,
        }
      );

      const text = response.data?.choices?.[0]?.message?.content;
      if (text) return text;
    } catch (error) {
      console.warn('[AI LLM] OpenAI API call failed, trying Gemini fallback:', error instanceof Error ? error.message : error);
    }
  }

  // 2. Try Gemini if key is present
  if (geminiKey && geminiKey.trim() !== '') {
    try {
      const modelName = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiKey.trim()}`;

      const response = await axios.post(
        url,
        {
          systemInstruction: {
            parts: [{ text: systemPrompt }],
          },
          contents: [
            {
              parts: [{ text: `CONTEXT:\n${contextJSON}\n\nUSER PROMPT:\n${userMessage}` }],
            },
          ],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 2048,
          },
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 20000,
        }
      );

      const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return text;
    } catch (error) {
      console.warn('[AI LLM] Gemini API call failed, falling back to rule engine:', error instanceof Error ? error.message : error);
    }
  }

  // No key configured or both calls failed — return null for deterministic heuristic fallback
  return null;
}