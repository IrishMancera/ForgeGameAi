import { Router } from 'express';
import { z } from 'zod';
import { v4 as uuid } from 'uuid';
import { getDatabase } from '../models/schema.js';
import { authMiddleware } from '../middleware/auth.js';
import { getProject } from '../services/projectService.js';

const router = Router();

// ─── Telemetry event schema (validated server-side) ──────────────────────────
const telemetryEventSchema = z.object({
  event_id: z.string().optional(),
  event_name: z.enum([
    'session_started', 'tutorial_step_completed', 'level_started', 'level_failed',
    'level_completed', 'currency_earned', 'currency_spent', 'item_acquired',
    'item_upgraded', 'quest_completed', 'purchase_started', 'purchase_completed',
    'purchase_refunded', 'ad_viewed', 'player_churn_signal', 'error_encountered',
  ]),
  player_id: z.string().min(1).max(64), // anonymous ID only
  session_id: z.string().min(1),
  timestamp: z.string().datetime(),
  game_version: z.string(),
  platform: z.enum(['android', 'ios', 'windows', 'web', 'console']),
  region: z.string().max(10),
  player_level: z.number().int().min(0).max(9999),
  segment: z.string().max(50),
  properties: z.record(z.unknown()).optional().default({}),
});

const batchSchema = z.object({
  projectId: z.string().min(1),
  events: z.array(telemetryEventSchema).min(1).max(500),
});

// POST /api/telemetry/events — Ingest telemetry batch (auth optional for game clients)
router.post('/events', async (req, res) => {
  try {
    const { projectId, events } = batchSchema.parse(req.body);
    const db = getDatabase();

    let inserted = 0;
    let duplicates = 0;

    for (const event of events) {
      const eventId = event.event_id || uuid();

      // Check for duplicate event_id
      const exists = await db.get('SELECT id FROM telemetry_events WHERE id = ?', [eventId]);
      if (exists) {
        duplicates++;
        continue;
      }

      // Validate: never store player PII — ensure player_id is anonymous format
      if (event.player_id.includes('@') || event.player_id.length > 64) {
        continue; // Silently drop — PII protection per Protocol 13
      }

      await db.run(
        `INSERT INTO telemetry_events
         (id, projectId, eventName, playerId, sessionId, timestamp, gameVersion,
          platform, region, playerLevel, segment, properties)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          eventId, projectId, event.event_name,
          event.player_id, event.session_id, event.timestamp,
          event.game_version, event.platform, event.region,
          event.player_level, event.segment,
          JSON.stringify(event.properties ?? {}),
        ]
      );
      inserted++;
    }

    res.json({
      success: true,
      inserted,
      duplicates,
      total: events.length,
      message: `${inserted} events ingested. ${duplicates} duplicates skipped.`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(422).json({ error: 'Invalid event format', details: error.errors });
    }
    res.status(500).json({ error: error instanceof Error ? error.message : 'Telemetry ingestion failed' });
  }
});

// GET /api/telemetry/summary/:projectId — Aggregated (non-PII) event summary
router.get('/summary/:projectId', authMiddleware, async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await getProject(projectId, req.user!.userId);
    if (!project) return res.status(403).json({ error: 'Unauthorized project access' });

    const db = getDatabase();

    // Aggregated counts per event type — no individual player data exposed
    const eventCounts = await db.all(
      `SELECT eventName, COUNT(*) as count, platform, region,
              MIN(timestamp) as earliest, MAX(timestamp) as latest
       FROM telemetry_events WHERE projectId = ?
       GROUP BY eventName, platform, region
       ORDER BY count DESC`,
      [projectId]
    );

    const totalEvents = await db.get(
      'SELECT COUNT(*) as total FROM telemetry_events WHERE projectId = ?',
      [projectId]
    );

    const segmentBreakdown = await db.all(
      `SELECT segment, COUNT(DISTINCT playerId) as uniquePlayers
       FROM telemetry_events WHERE projectId = ?
       GROUP BY segment ORDER BY uniquePlayers DESC`,
      [projectId]
    );

    // Only return groups with ≥ 50 players (privacy floor)
    const safeSegments = segmentBreakdown.filter((s) => s.uniquePlayers >= 50);

    res.json({
      projectId,
      totalEvents: totalEvents?.total ?? 0,
      eventBreakdown: eventCounts,
      segmentBreakdown: safeSegments,
      privacyNote: 'Player segments with fewer than 50 players are suppressed.',
    });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to load telemetry summary' });
  }
});

export default router;
