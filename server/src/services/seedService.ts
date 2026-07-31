import { getDatabase } from '../models/schema.js';
import { hashPassword } from '../utils/password.js';

export async function seedInitialData(): Promise<void> {
  const db = getDatabase();

  const userCount = await db.get<{ count: number }>('SELECT COUNT(*) as count FROM users');
  let userId: string;

  if (!userCount || userCount.count === 0) {
    userId = 'demo-user-001';
    const passwordHash = await hashPassword('password123');
    await db.run(
      `INSERT INTO users (id, email, passwordHash, firstName, lastName, role, subscriptionPlan)
       VALUES (?, 'demo@gameforge.ai', ?, 'Jordan', 'K.', 'admin', 'studio')`,
      [userId, passwordHash]
    );
  } else {
    const existingUser = await db.get<{ id: string }>('SELECT id FROM users LIMIT 1');
    userId = existingUser!.id;
  }

  const projectCount = await db.get<{ count: number }>('SELECT COUNT(*) as count FROM projects');
  if (!projectCount || projectCount.count === 0) {
    const projectId = 'proj-haunted-hotel-001';

    const defaultBlueprint = {
      factsCount: 42,
      assumptionsCount: 18,
      contradictionsCount: 3,
      facts: [
        { id: 1, title: 'Energy System', category: 'Core Loop', status: 'Verified Fact', detail: 'Energy refills at 1 unit per 3 minutes up to cap of 50.' },
        { id: 2, title: 'VIP Guest Spawns', category: 'Monetization', status: 'Assumption', detail: 'VIP guests yield 3x revenue if rewarded within 45 seconds.' },
        { id: 3, title: 'Staff Room Upgrade', category: 'Progression', status: 'Contradiction', detail: 'Unlocks at Level 20 in GDD v1.2, but required for Level 15 quest line.' },
      ]
    };

    const defaultEconomy = {
      currencies: [
        { name: 'Coins', sources: 8400, sinks: 7900, net: 500, status: 'Healthy' },
        { name: 'Diamonds', sources: 1200, sinks: 1050, net: 150, status: 'Healthy' },
        { name: 'Energy', sources: 3600, sinks: 3580, net: 20, status: 'Balanced' },
        { name: 'Prestige', sources: 240, sinks: 220, net: 20, status: 'Constrained' },
      ],
      sinkRatio: 0.94,
    };

    const defaultProgression = {
      maxLevel: 50,
      baseXP: 100,
      multiplier: 1.35,
    };

    await db.run(
      `INSERT INTO projects (
        id, userId, name, description, genre, targetPlatform,
        blueprint, economy, progression, systemHealth, blueprintComplete, criticalRisks, openDecisions
      ) VALUES (?, ?, 'Haunted Hotel', 'Hybrid-Casual Tycoon game system specification', 'Hybrid-Casual Tycoon', 'Mobile', ?, ?, ?, 84, 86, 2, 7)`,
      [
        projectId,
        userId,
        JSON.stringify(defaultBlueprint),
        JSON.stringify(defaultEconomy),
        JSON.stringify(defaultProgression)
      ]
    );
  }
}
