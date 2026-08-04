import axios from 'axios';
import { config } from '../config.js';
import { v4 as uuid } from 'uuid';
import { getDatabase } from '../models/schema.js';

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

export interface AICallResult {
  content: string;
  isDemo: boolean;
  model: string;
}

// ─── The 15-Protocol GameForge AI Master System Prompt ────────────────────────
const GAMEFORGE_SYSTEM_PROMPT = `You are GameForge AI, an evidence-driven game design, economy, progression, simulation, analytics and production-assistance agent.

Your primary objective is to help the team build a fair, engaging, sustainable and technically reliable game while preserving the approved game vision.

For every request:
1. Identify the active project, environment, game version and user role.
2. Retrieve relevant approved sources from the Game Design Document, economy rules, progression specifications, telemetry dictionary, balance tables, decision history and current configuration.
3. Distinguish verified facts from assumptions and missing data.
4. Use deterministic tools for arithmetic and formulas.
5. Use the simulation service for predictions and uncertainty.
6. Compare designed targets, simulation results and actual telemetry.
7. Analyze effects by player cohort—not only by the average player.
8. Check economic, progression, experience, technical, ethical and business effects.
9. Return the conclusion, evidence, calculations, confidence, risks, affected systems and references.
10. For changes, create a proposal containing old values, new values, reasons, expected impact, regression tests and rollback instructions.
11. Never modify staging or production without the required approval.
12. Never invent metrics, documents, successful actions or simulation results. Clearly state when information is unavailable.
13. Never expose personal player data or use protected attributes for manipulative targeting.
14. Record every material recommendation and approved action in the audit log.
15. After an approved change, monitor actual results and compare them with the prediction.

When data is insufficient, produce a "## Required Data" section listing exact tables, fields, date range and minimum sample size needed.

Structure every response with these sections (omit irrelevant ones):
## Conclusion
## Evidence & Calculations
## Assumptions
## Confidence: [0–100]%
## Affected Systems
## Proposed Action (if applicable)
## Expected Impact
## Risks & Side Effects
## Sources
## Approval Required: [YES / NO]`;

// ─── Build the full context-injected messages array ───────────────────────────
export function buildContextMessages(
  prompt: string,
  projectSnapshot: Record<string, unknown> | null,
  ragChunks: Array<{ snippet: string; documentType: string }>,
  conversationHistory: Array<{ role: 'user' | 'assistant' | 'system'; text: string }>,
  activeWorkspace: string,
): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> {
  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: GAMEFORGE_SYSTEM_PROMPT },
  ];

  // Inject project snapshot
  if (projectSnapshot) {
    const snapshot = {
      name: projectSnapshot.name,
      genre: projectSnapshot.genre,
      systemHealth: projectSnapshot.systemHealth,
      blueprintComplete: projectSnapshot.blueprintComplete,
      activeWorkspace,
    };
    messages.push({
      role: 'system',
      content: `## Active Project Context\n\`\`\`json\n${JSON.stringify(snapshot, null, 2)}\n\`\`\``,
    });
  }

  // Inject RAG knowledge citations
  if (ragChunks.length > 0) {
    const citations = ragChunks
      .map((c, i) => `[${i + 1}] (${c.documentType}): ${c.snippet}`)
      .join('\n\n');
    messages.push({
      role: 'system',
      content: `## Retrieved Knowledge Base Documents\n${citations}`,
    });
  }

  // Inject conversation history (last 6 turns)
  for (const turn of conversationHistory.slice(-6)) {
    messages.push({ role: turn.role as 'user' | 'assistant', content: turn.text });
  }

  // User prompt
  messages.push({ role: 'user', content: prompt });

  return messages;
}

export async function callOpenAI(
  prompt: string,
  projectSnapshot?: Record<string, unknown> | null,
  ragChunks?: Array<{ snippet: string; documentType: string }>,
  conversationHistory?: Array<{ role: 'user' | 'assistant' | 'system'; text: string }>,
  activeWorkspace?: string,
): Promise<AICallResult> {

  const messages = buildContextMessages(
    prompt,
    projectSnapshot ?? null,
    ragChunks ?? [],
    conversationHistory ?? [],
    activeWorkspace ?? 'command-center',
  );

  // Live OpenAI call when API key is configured
  if (config.openai.apiKey) {
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4o-mini',
          messages,
          temperature: 0.3,
          max_tokens: 1200,
        },
        {
          headers: {
            Authorization: `Bearer ${config.openai.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );
      return {
        content: response.data.choices?.[0]?.message?.content || 'No response generated.',
        isDemo: false,
        model: 'gpt-4o-mini',
      };
    } catch (err: any) {
      console.warn('[GameForge AI] OpenAI call failed, entering demo mode:', err?.message || err);
    }
  }

  // ── DEMO MODE — deterministic structured responses ──────────────────────────
  const lower = prompt.toLowerCase();
  let demoContent = '';

  if (lower.includes('economy') || lower.includes('balance') || lower.includes('sink') || lower.includes('faucet')) {
    demoContent = `## Conclusion
Gold currency is accumulating faster than designed targets. Sink coverage is at **79%** (target: 90–100%).

## Evidence & Calculations
- Faucet total: **1,240 Gold/hr** (from quests: 800, battles: 320, login: 120)
- Sink total: **980 Gold/hr** (upgrades: 600, crafting: 380)
- Net flow: **+260 Gold/hr** (positive — inflationary pressure)
- Faucet-to-Sink Ratio: **1.27** (target range: 0.95–1.05)

## Assumptions
Based on median player session of 35 min/day, Level 15 player. Does not include event-period burst faucets.

## Confidence: 74%

## Affected Systems
Economy Lab, Progression, Workbook Studio

## Proposed Action
Increase Staff Upgrade cost by **8%** at Level 15+ and add a 5% Guild Contribution sink.

## Expected Impact
Net flow reduces to +40 Gold/hr. Faucet-to-Sink Ratio: **1.04** (within target).

## Risks & Side Effects
Free players (segment: casual_free) may experience 3% slower upgrade pace at Level 15.

## Approval Required: YES

---
> ⚠️ **DEMO MODE** — No live OpenAI API key detected. Responses are deterministic templates for demonstration only. Set \`OPENAI_API_KEY\` in \`server/.env\` for live AI analysis.`;

  } else if (lower.includes('retention') || lower.includes('churn') || lower.includes('d7') || lower.includes('d30')) {
    demoContent = `## Conclusion
D7 retention is below target. Possible difficulty spike at Level 8 is causing early-session churn.

## Evidence & Calculations
- D1 Retention: **41%** (target: 40%) ✅
- D7 Retention: **13%** (target: 18%) ⚠️ -27.8% below target
- D30 Retention: **5%** (target: 8%) ⚠️ -37.5% below target
- Level 8 failure rate: **68%** (design target: 45%)

## Assumptions
SIMULATION ESTIMATE — NOT LIVE DATA. Based on modeled 1,000-player cohort with standard progression inputs.

## Confidence: 68%

## Affected Systems
Analytics, Player Psychology, Progression

## Proposed Action
Reduce Level 8 enemy power by 15% and add a mid-session checkpoint reward.

## Approval Required: YES

---
> ⚠️ **DEMO MODE** — No live OpenAI API key detected. Set \`OPENAI_API_KEY\` in \`server/.env\` for live analysis.`;

  } else if (lower.includes('audit') || lower.includes('compliance') || lower.includes('risk')) {
    demoContent = `## Conclusion
2 HIGH priority compliance issues and 1 MEDIUM issue identified.

## Evidence & Calculations
- **HIGH** [Economy]: Premium currency sink coverage at 62% — below minimum 80% threshold.
- **HIGH** [Monetization]: Loot box odds not displayed at purchase point — potential PEGI/FTC violation.
- **MEDIUM** [Progression]: Content exhaustion at Level 30 estimated at 18 days — below 30-day target.

## Confidence: 91%
## Affected Systems: Audit Center, Economy Lab, Monetization

## Approval Required: YES — compliance issues require immediate review.

---
> ⚠️ **DEMO MODE** — No live OpenAI API key detected. Set \`OPENAI_API_KEY\` in \`server/.env\` for live analysis.`;

  } else if (lower.includes('import') || lower.includes('gdd') || lower.includes('upload') || lower.includes('knowledge')) {
    demoContent = `## Conclusion
Data import validation completed. 3 of 12 required categories are missing or incomplete.

## Required Data
| Category | Status | Missing Fields |
|----------|--------|----------------|
| Project Profile | ✅ Complete | — |
| GDD & Design Decisions | ✅ Complete | — |
| Economy: Currencies, Faucets, Sinks | ⚠️ Partial | Faucet table missing: daily_login_reward, event_bonus |
| Items & Drop Tables | ❌ Missing | Entire table required |
| XP & Progression Config | ✅ Complete | — |
| Player Cohort Definitions | ⚠️ Partial | Missing: high_spender, returning_player cohorts |
| Analytics Event Dictionary | ❌ Missing | Required before telemetry ingestion |
| Telemetry (30–90 days) | ⏳ Not provided | — |
| Patch History | ⏳ Not provided | — |
| Monetization & Ethics Policy | ✅ Complete | — |
| Architecture Docs | ⏳ Not provided | — |
| Known Issues & Milestones | ⏳ Not provided | — |

**Do not begin automatic analysis until all required (✅) categories are complete.**

---
> ⚠️ **DEMO MODE** — No live OpenAI API key detected. Set \`OPENAI_API_KEY\` in \`server/.env\` for live analysis.`;

  } else {
    demoContent = `## Conclusion
Request analyzed. No critical issues detected in the current project snapshot.

## Evidence & Calculations
- System Health: **85%** (target: ≥80%) ✅
- Blueprint completion: **50%** — design pillars partially defined
- Critical risks flagged: **2** (economy sink coverage, missing telemetry)
- Open decisions: **7** (pending team resolution)

## Assumptions
Based on project snapshot data only. No live telemetry or simulation data available yet.

## Confidence: 61%

## Required Data
To improve confidence above 80%, provide:
- Faucet/sink tables with per-level amounts
- At minimum 30 days of anonymized telemetry events
- Player cohort definitions for all 11 segments

## Approval Required: NO — observation only.

---
> ⚠️ **DEMO MODE** — No live OpenAI API key detected. Set \`OPENAI_API_KEY\` in \`server/.env\` for live analysis.`;
  }

  return {
    content: demoContent,
    isDemo: true,
    model: 'demo',
  };
}

export async function generateAIRecommendation(projectId: string, prompt: string): Promise<AIRecommendation> {
  const pLower = prompt.toLowerCase();

  let agent = 'Game Director';
  let title = `Review: ${prompt.slice(0, 40)}...`;
  let description = `Evidence-based analysis recommends investigating system parameters for: ${prompt}.`;
  let affectedSystems = ['Economy Lab', 'Simulation'];
  let confidence = Math.floor(78 + Math.random() * 14);
  let assumptions = 'Assumes standard player progression pacing and default sink ratios.';

  if (pLower.includes('economy') || pLower.includes('balance') || pLower.includes('sink') || pLower.includes('coin')) {
    agent = 'Economy Analyst';
    title = 'Rebalance Currency Sink Ratio';
    description = 'Increase energy sink multiplier by +8% to prevent Day-7 currency accumulation above target range.';
    affectedSystems = ['Economy Lab', 'Simulation', 'Workbook Studio'];
    confidence = 91;
    assumptions = 'Based on 10,000-iteration Monte Carlo at Level 15–25. No live telemetry yet.';
  } else if (pLower.includes('retention') || pLower.includes('churn')) {
    agent = 'Telemetry Analyst';
    title = 'Investigate D7 Retention Drop';
    description = 'D7 retention 27% below target. Level 8 difficulty spike is primary hypothesis.';
    affectedSystems = ['Analytics', 'Progression', 'Player Psychology'];
    confidence = 73;
    assumptions = 'Requires 30+ days live telemetry to confirm. Current confidence based on simulation only.';
  } else if (pLower.includes('ethical') || pLower.includes('psychology') || pLower.includes('fairness')) {
    agent = 'Player Experience Agent';
    title = 'Ethical Monetization Audit';
    description = 'Paywall pressure detected at Level 16. Excitement-intensity drop exceeds 20% threshold.';
    affectedSystems = ['Player Psychology', 'Audit Center'];
    confidence = 87;
    assumptions = 'Based on Bartle archetype distribution: Achievers 40%, Explorers 30%.';
  } else if (pLower.includes('audit') || pLower.includes('compliance')) {
    agent = 'Audit Agent';
    title = 'Compliance & Security Audit';
    description = 'Loot box odds not displayed at purchase point — PEGI/FTC risk flagged.';
    affectedSystems = ['Audit Center', 'Monetization Policy'];
    confidence = 94;
    assumptions = 'Evaluated against PEGI 2023 guidelines and FTC disclosure requirements.';
  }

  return { id: uuid(), agent, title, description, affectedSystems, confidence, assumptions };
}

export function buildAIMessage(content: string, role: 'user' | 'assistant'): AIMessage {
  return {
    role,
    content,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };
}
