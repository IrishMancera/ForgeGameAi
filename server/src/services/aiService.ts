import axios from 'axios';
import { config } from '../config.js';
import { v4 as uuid } from 'uuid';

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface AIRecommendation {
  id: string;
  agent: string;
  title: string;
  description: string;
  affectedSystems: string[];
  confidence: number;
  assumptions: string;
}

const defaultAgents = [
  'Architect',
  'Balancer',
  'Auditor',
  'Psychologist',
  'Documenter',
];

export async function generateAIRecommendation(projectId: string, prompt: string): Promise<AIRecommendation> {
  const agent = defaultAgents[Math.floor(Math.random() * defaultAgents.length)];
  const title = `Review ${prompt.slice(0, 40)}...`;
  const affectedSystems = ['Economy Lab', 'Simulation', 'Audit Center'];

  return {
    id: uuid(),
    agent,
    title,
    description: `Using project ${projectId}, the ${agent} suggests reviewing the request and validating the related data model against live balance metrics.`,
    affectedSystems,
    confidence: Math.floor(75 + Math.random() * 20),
    assumptions: 'Assumes latest project sheet reflects current monetization and progression loops.',
  };
}

export async function callOpenAI(prompt: string): Promise<string> {
  if (!config.openai.apiKey) {
    return `AI model unavailable. Please configure OPENAI_API_KEY.`;
  }

  const response = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are GameForge Systems AI, an expert game system design assistant.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 350,
    },
    {
      headers: {
        Authorization: `Bearer ${config.openai.apiKey}`,
        'Content-Type': 'application/json',
      },
    }
  );

  return response.data.choices?.[0]?.message?.content || 'No response from model';
}

export function buildAIMessage(content: string, role: 'user' | 'assistant'): AIMessage {
  return {
    role,
    content,
    timestamp: new Date().toISOString(),
  };
}
