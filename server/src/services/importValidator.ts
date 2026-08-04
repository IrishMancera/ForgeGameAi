/**
 * Import Validator Service
 *
 * Validates the 12 recommended data import categories in order.
 * After importing all categories, this service:
 *   1. Validates required fields exist
 *   2. Reports contradictions between categories
 *   3. Reports missing fields
 *   4. Establishes a baseline readiness score
 *   5. Blocks automatic analysis until critical categories are complete
 */

import { v4 as uuid } from 'uuid';
import { getDatabase } from '../models/schema.js';

export interface ImportCategory {
  key: string;
  label: string;
  required: boolean;
  requiredFields: string[];
}

export interface ImportValidationResult {
  sessionId: string;
  projectId: string;
  timestamp: string;
  categories: CategoryValidation[];
  contradictions: Contradiction[];
  missingRequired: string[];
  baselineReadiness: number; // 0-100
  readyForAnalysis: boolean;
  blockers: string[];
}

export interface CategoryValidation {
  key: string;
  label: string;
  status: 'complete' | 'partial' | 'missing' | 'not_provided';
  required: boolean;
  providedFields: string[];
  missingFields: string[];
  warnings: string[];
}

export interface Contradiction {
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  categoryA: string;
  categoryB: string;
  field: string;
  valueA: unknown;
  valueB: unknown;
  description: string;
}

// ─── 12 Import Categories with their required fields ─────────────────────────
export const IMPORT_SCHEMA: ImportCategory[] = [
  {
    key: 'project_profile',
    label: 'Project Profile & Design Pillars',
    required: true,
    requiredFields: ['game_title', 'genre', 'platforms', 'target_audience', 'design_pillars', 'primary_loop'],
  },
  {
    key: 'gdd',
    label: 'Game Design Document & Design Decisions',
    required: true,
    requiredFields: ['core_loop', 'meta_loop', 'game_rules', 'ethical_constraints', 'business_objectives'],
  },
  {
    key: 'economy',
    label: 'Economy: Currencies, Faucets, Sinks & Prices',
    required: true,
    requiredFields: ['currencies', 'faucets', 'sinks', 'prices'],
  },
  {
    key: 'items',
    label: 'Items, Drops, Crafting & Upgrade Tables',
    required: true,
    requiredFields: ['items', 'drop_tables', 'rarity_tiers', 'upgrade_costs'],
  },
  {
    key: 'progression',
    label: 'XP, Levels, Difficulty & Unlock Configuration',
    required: true,
    requiredFields: ['xp_table', 'level_count', 'unlock_schedule', 'difficulty_curve', 'failure_rate_targets'],
  },
  {
    key: 'player_cohorts',
    label: 'Player Cohort Definitions',
    required: true,
    requiredFields: ['cohorts', 'segment_behavior'],
  },
  {
    key: 'analytics_dictionary',
    label: 'Analytics Event Dictionary',
    required: true,
    requiredFields: ['events', 'properties_schema'],
  },
  {
    key: 'telemetry',
    label: '30–90 Days Anonymized Telemetry',
    required: false,
    requiredFields: [],
  },
  {
    key: 'patch_history',
    label: 'Patch & Configuration History',
    required: false,
    requiredFields: [],
  },
  {
    key: 'monetization_policy',
    label: 'Monetization, Privacy & Ethical-Design Policies',
    required: true,
    requiredFields: ['purchase_types', 'prohibited_mechanics', 'privacy_policy', 'ethical_constraints'],
  },
  {
    key: 'architecture_docs',
    label: 'Architecture, API & Database Documentation',
    required: false,
    requiredFields: [],
  },
  {
    key: 'known_issues',
    label: 'Known Problems, Targets & Upcoming Milestones',
    required: false,
    requiredFields: [],
  },
];

export class ImportValidator {

  public async validate(
    projectId: string,
    importPayload: Record<string, unknown>
  ): Promise<ImportValidationResult> {
    const sessionId = uuid();
    const categoryResults: CategoryValidation[] = [];
    const contradictions: Contradiction[] = [];

    // ── Validate each category ───────────────────────────────────────────────
    for (const schema of IMPORT_SCHEMA) {
      const data = importPayload[schema.key];

      if (!data) {
        categoryResults.push({
          key: schema.key,
          label: schema.label,
          status: 'not_provided',
          required: schema.required,
          providedFields: [],
          missingFields: schema.requiredFields,
          warnings: schema.required ? [`REQUIRED category "${schema.label}" was not provided.`] : [],
        });
        continue;
      }

      const dataObj = (typeof data === 'object' && data !== null) ? data as Record<string, unknown> : {};
      const providedFields = Object.keys(dataObj);
      const missingFields = schema.requiredFields.filter((f) => !providedFields.includes(f));
      const warnings: string[] = [];

      // Check for empty arrays/objects in required fields
      for (const field of schema.requiredFields) {
        const val = dataObj[field];
        if (val !== undefined && Array.isArray(val) && val.length === 0) {
          warnings.push(`Field "${field}" is present but empty.`);
        }
      }

      categoryResults.push({
        key: schema.key,
        label: schema.label,
        status: missingFields.length === 0 ? 'complete' : missingFields.length < schema.requiredFields.length ? 'partial' : 'missing',
        required: schema.required,
        providedFields,
        missingFields,
        warnings,
      });
    }

    // ── Cross-category contradiction checks ──────────────────────────────────
    this.checkContradictions(importPayload, contradictions);

    // ── Compute baseline readiness ───────────────────────────────────────────
    const requiredCategories = IMPORT_SCHEMA.filter((s) => s.required);
    const completeRequired = categoryResults.filter(
      (c) => c.required && (c.status === 'complete' || c.status === 'partial')
    ).length;
    const baselineReadiness = Math.round((completeRequired / requiredCategories.length) * 100);

    const missingRequired = categoryResults
      .filter((c) => c.required && c.status === 'not_provided')
      .map((c) => c.label);

    const criticalContradictions = contradictions.filter((c) => c.severity === 'CRITICAL');

    const blockers: string[] = [
      ...missingRequired.map((l) => `Missing required category: ${l}`),
      ...criticalContradictions.map((c) => `CRITICAL contradiction: ${c.description}`),
    ];

    const readyForAnalysis = blockers.length === 0 && baselineReadiness >= 80;

    // ── Persist to import_sessions table ────────────────────────────────────
    try {
      const db = getDatabase();
      const result: ImportValidationResult = {
        sessionId, projectId, timestamp: new Date().toISOString(),
        categories: categoryResults, contradictions, missingRequired,
        baselineReadiness, readyForAnalysis, blockers,
      };
      await db.run(
        `INSERT INTO import_sessions (id, projectId, status, summary, details)
         VALUES (?, ?, ?, ?, ?)`,
        [
          sessionId, projectId,
          readyForAnalysis ? 'ready' : 'incomplete',
          `Baseline readiness: ${baselineReadiness}%. Blockers: ${blockers.length}.`,
          JSON.stringify(result),
        ]
      );
      return result;
    } catch (err) {
      // Return result even if DB insert fails
      return {
        sessionId, projectId, timestamp: new Date().toISOString(),
        categories: categoryResults, contradictions, missingRequired,
        baselineReadiness, readyForAnalysis, blockers,
      };
    }
  }

  private checkContradictions(data: Record<string, unknown>, out: Contradiction[]): void {
    const economy = data.economy as Record<string, unknown> | undefined;
    const gdd = data.gdd as Record<string, unknown> | undefined;
    const monetization = data.monetization_policy as Record<string, unknown> | undefined;
    const profile = data.project_profile as Record<string, unknown> | undefined;

    // Check: GDD prohibits P2W but economy has premium item power
    if (gdd?.ethical_constraints && economy?.items) {
      const constraints = String(gdd.ethical_constraints).toLowerCase();
      const items = String(economy.items).toLowerCase();
      if (constraints.includes('no pay-to-win') && items.includes('power_boost')) {
        out.push({
          severity: 'CRITICAL',
          categoryA: 'gdd',
          categoryB: 'economy',
          field: 'ethical_constraints vs items',
          valueA: 'no pay-to-win',
          valueB: 'power_boost items detected',
          description: 'GDD prohibits pay-to-win mechanics but economy items contain power_boost entries.',
        });
      }
    }

    // Check: Monetization policy contradicts GDD prohibited mechanics
    if (monetization?.prohibited_mechanics && gdd?.ethical_constraints) {
      const prohibited = String(monetization.prohibited_mechanics).toLowerCase();
      const ethical = String(gdd.ethical_constraints).toLowerCase();
      if (prohibited.includes('loot box') && ethical.includes('gacha')) {
        out.push({
          severity: 'HIGH',
          categoryA: 'monetization_policy',
          categoryB: 'gdd',
          field: 'prohibited_mechanics vs gacha',
          valueA: 'loot boxes prohibited',
          valueB: 'gacha mechanics in GDD',
          description: 'Monetization policy prohibits loot boxes but GDD references gacha systems.',
        });
      }
    }

    // Check: Profile audience age vs monetization type
    if (profile?.target_audience && monetization?.purchase_types) {
      const audience = String(profile.target_audience).toLowerCase();
      const purchases = String(monetization.purchase_types).toLowerCase();
      if ((audience.includes('under 13') || audience.includes('children')) &&
          purchases.includes('real money')) {
        out.push({
          severity: 'CRITICAL',
          categoryA: 'project_profile',
          categoryB: 'monetization_policy',
          field: 'target_audience vs purchase_types',
          valueA: 'audience under 13',
          valueB: 'real money purchases',
          description: 'Target audience includes minors but monetization includes real money purchases — COPPA/regulatory risk.',
        });
      }
    }
  }
}

export const importValidator = new ImportValidator();
