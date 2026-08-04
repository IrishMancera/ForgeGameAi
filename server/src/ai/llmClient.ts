import axios from 'axios';
import { config } from '../config.js';

export async function chatCompletion(
  systemPrompt: string,
  userMessage: string,
  contextJSON: string
): Promise<string | null> {
  const apiKey = config.gemini?.apiKey || process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '') {
    return null;
  }

  try {
    const modelName = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    const response = await axios.post(
      url,
      {
        systemInstruction: {
          parts: [{ text: systemPrompt }],
        },
        contents: [
          {
            parts: [
              {
                text: `CONTEXT:\n${contextJSON}\n\nUSER PROMPT:\n${userMessage}`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 2048,
        },
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return text ?? null;
  } catch (error) {
    console.warn(
      '[AI LLM] Gemini API call failed, falling back to rule engine:',
      error instanceof Error ? error.message : error
    );
    return null;
  }
}