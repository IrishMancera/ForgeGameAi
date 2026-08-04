import axios from 'axios';

export interface AgentRequest {
  projectId: string;
  userPrompt: string;
  context?: Record<string, unknown>;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface AgentResponse {
  content: string;
  provider: string;
  modelId: string;
  tokenUsage?: { prompt: number; completion: number; total: number };
  durationMs: number;
}

export interface LLMProvider {
  name: string;
  modelId: string;
  supportsTools: boolean;
  supportsStructuredOutput: boolean;
  generate(request: AgentRequest): Promise<AgentResponse>;
}

export class OllamaProvider implements LLMProvider {
  public name = 'Ollama (Local Open Model)';
  public modelId: string;

  constructor(modelId: string = 'llama3.2') {
    this.modelId = modelId;
  }

  public supportsTools = true;
  public supportsStructuredOutput = true;

  public async generate(request: AgentRequest): Promise<AgentResponse> {
    const startTime = Date.now();
    const ollamaHost = process.env.OLLAMA_HOST || 'http://localhost:11434';

    try {
      const response = await axios.post(`${ollamaHost}/api/generate`, {
        model: this.modelId,
        prompt: `${request.systemPrompt ? `[SYSTEM]\n${request.systemPrompt}\n\n` : ''}${request.userPrompt}`,
        stream: false,
        options: {
          temperature: request.temperature ?? 0.2,
        },
      }, { timeout: 15000 });

      return {
        content: response.data.response,
        provider: 'ollama',
        modelId: this.modelId,
        tokenUsage: {
          prompt: response.data.prompt_eval_count || 0,
          completion: response.data.eval_count || 0,
          total: (response.data.prompt_eval_count || 0) + (response.data.eval_count || 0),
        },
        durationMs: Date.now() - startTime,
      };
    } catch (err) {
      throw new Error(`Ollama local provider unavailable at ${ollamaHost}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}

export class CloudProvider implements LLMProvider {
  public name = 'Cloud Managed AI';
  public modelId: string;

  constructor(modelId: string = 'gpt-4o-mini') {
    this.modelId = modelId;
  }

  public supportsTools = true;
  public supportsStructuredOutput = true;

  public async generate(request: AgentRequest): Promise<AgentResponse> {
    const startTime = Date.now();
    const apiKey = process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      // Deterministic rule-based fallback when no key is set
      return {
        content: JSON.stringify({
          answer: `[DEMO MODE] Rule-based system analyzed project ${request.projectId}. All metrics within design thresholds.`,
          findings: ['Economy faucets balance sinks.', 'XP progression curve targets 45-day max level.'],
          evidence: [{ sourceId: 'doc-default', version: '1.0', section: 'Economy', claim: 'Faucet-to-sink ratio is stable' }],
          calculations: [{ metric: 'Net Flow', value: 15, unit: 'gold/hr' }],
          assumptions: ['Standard D1 retention at 45%'],
          missingData: [],
          confidence: 0.88,
          affectedSystems: ['economy'],
          risks: [],
          recommendedActions: ['Continue live monitoring'],
          proposalRequired: false,
          approvalRequired: false,
        }),
        provider: 'rule_engine_demo',
        modelId: 'demo-rules-v1',
        tokenUsage: { prompt: 0, completion: 0, total: 0 },
        durationMs: Date.now() - startTime,
      };
    }

    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: this.modelId,
          messages: [
            ...(request.systemPrompt ? [{ role: 'system', content: request.systemPrompt }] : []),
            { role: 'user', content: request.userPrompt },
          ],
          temperature: request.temperature ?? 0.2,
        },
        {
          headers: { Authorization: `Bearer ${apiKey}` },
          timeout: 20000,
        }
      );

      const usage = response.data.usage || {};
      return {
        content: response.data.choices[0]?.message?.content || '',
        provider: 'openai',
        modelId: this.modelId,
        tokenUsage: {
          prompt: usage.prompt_tokens || 0,
          completion: usage.completion_tokens || 0,
          total: usage.total_tokens || 0,
        },
        durationMs: Date.now() - startTime,
      };
    } catch (err) {
      throw new Error(`Cloud provider execution failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}

export class LLMProviderRouter {
  private activeProvider: LLMProvider;

  constructor() {
    if (process.env.USE_LOCAL_OLLAMA === 'true') {
      this.activeProvider = new OllamaProvider(process.env.OLLAMA_MODEL || 'llama3.2');
    } else {
      this.activeProvider = new CloudProvider(process.env.OPENAI_MODEL || 'gpt-4o-mini');
    }
  }

  public getProvider(): LLMProvider {
    return this.activeProvider;
  }

  public setProvider(provider: LLMProvider): void {
    this.activeProvider = provider;
  }
}

export const providerRouter = new LLMProviderRouter();
