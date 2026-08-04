# GameForgeAI: System Specification & Integration Guide

This specification defines the 13 core modules of GameForgeAI, mapping their purpose, agent sequences, multi-tenant permissions, required data formats, and balancing sheets.

---

## 1. Multi-Tenant Permissions & Access Gate

To protect workspace isolation, database queries are parameterized by both `userId` and `projectId`.

### Database Schema (SQLite / Postgres)
```sql
-- 1. Project Registries
CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    name TEXT NOT NULL,
    blueprint JSONB DEFAULT '{}',
    systems JSONB DEFAULT '{}',
    economy JSONB DEFAULT '{}',
    progression JSONB DEFAULT '{}',
    psychology JSONB DEFAULT '{}',
    simulation JSONB DEFAULT '{}',
    analytics JSONB DEFAULT '{}',
    auditResults JSONB DEFAULT '{}',
    workbook JSONB DEFAULT '{}',
    knowledgeBase JSONB DEFAULT '{}',
    settings JSONB DEFAULT '{}',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Project Members (RBAC for Invited Users)
CREATE TABLE IF NOT EXISTS project_members (
    id TEXT PRIMARY KEY,
    projectId TEXT NOT NULL,
    userId TEXT NOT NULL,
    role TEXT DEFAULT 'editor', -- 'owner', 'editor', 'viewer'
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(projectId, userId)
);

-- 3. Version History & Diffs
CREATE TABLE IF NOT EXISTS version_history (
    id TEXT PRIMARY KEY,
    projectId TEXT NOT NULL,
    versionNumber INTEGER NOT NULL,
    summary TEXT NOT NULL,
    snapshot JSONB NOT NULL,
    proposalId TEXT,
    createdBy TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE
);
```

### Access Verification Gate
Every backend service route checks access via `getProject(projectId, userId)`, which asserts project ownership or team membership:
```typescript
export async function getProject(projectId: string, userId: string): Promise<Project | null> {
  const db = getDatabase();
  const project = await db.get(
    `SELECT p.* FROM projects p
     LEFT JOIN project_members pm ON p.id = pm.projectId
     WHERE p.id = ? AND (p.userId = ? OR pm.userId = ?)
     LIMIT 1`,
    [projectId, userId, userId]
  );
  return project;
}
```

---

## 2. The AI Operating Agent Orchestrator

The system divides capabilities into specialized sub-agents managed by a central **Game Director Agent** coordinator.

| Agent | Responsibility | Typical Output |
| :--- | :--- | :--- |
| **Game Director** | Coordinating all modules | Coordinated plan & audit check |
| **Economy Analyst** | Currencies, rewards, prices | Faucet/sink reports, balance suggestions |
| **Progression Analyst**| Curve pacing, unlocks, grind gates | XP scaling graphs, difficulty audits |
| **Simulation Agent** | Synthetic runs & probability models | Monte Carlo probability intervals |
| **Telemetry Analyst** | Real player sessions & telemetry | Retention & conversion funnel reports |
| **Systems Designer** | Connected loops & dependency graph | Dependency impact logs |
| **Player Experience**| Bartle motivation dials, monetization ethics | Cognitive friction analysis |
| **QA Agent** | Proposed changes verification | Edge-case verification |
| **Audit Agent** | Data privacy and compliance | Compliance risk logs |
| **Documentation Agent**| Updates GDDs, decisions, and patch notes| Updated documentation with source references |

---

## 3. Data Schema Standards

### A. Telemetry Event Format
Every client game telemetry event sent to `/api/analytics/events` follows this structure:
```json
{
  "event_id": "uuid",
  "event_name": "level_completed",
  "player_id": "anonymous-player-id",
  "session_id": "session-id",
  "timestamp": "2026-08-03T12:00:00Z",
  "game_version": "1.4.0",
  "platform": "android",
  "region": "PH",
  "player_level": 17,
  "segment": "core_free",
  "properties": {
    "level_id": "dungeon_14",
    "duration_seconds": 842,
    "attempt_number": 3,
    "reward_gold": 1200
  }
}
```

### B. Economy Structure Tables
* **Currency:** tracks `currency_id`, `name`, `currency_type` (soft/premium), `starting_balance`, `maximum_balance`, `real_money_value`.
* **Faucet Table:** tracks where currencies enter (Login rewards, Battles, Quests, Ads).
* **Sink Table:** tracks where currencies leave (Upgrades, Crafting, marketplace fees, energy).

---

## 4. Automatic Balancing Sheet Diagnostics

The central agent compares design variables, simulation projections, and live telemetry against these metrics:

| Metric | Calculation | Warning Condition |
| :--- | :--- | :--- |
| **Currency Net Flow** | Total Faucets − Total Sinks | Positive growth without savings |
| **Faucet-to-Sink Ratio** | Currency Earned ÷ Currency Spent | Out of bounds of project targets |
| **Inflation Rate** | Change in median player wealth | Wealth grows too fast |
| **Purchase Affordability**| Player Balance ÷ Item Price | Important items become inaccessible or trivial |
| **Time to Acquire** | Item Price ÷ Expected Earnings/Hr | Pacing grind exceeds intended threshold |
| **Difficulty Spike** | Failure-rate change between levels | Sudden unexplained difficulty |
| **Item Dominance** | Usage rate relative to peers | One weapon/item becomes mandatory |
| **Content Exhaustion** | Completed levels ÷ playtime | Players consume content too quickly |
| **Sink Coverage** | Total Sinks ÷ Total Faucets | Insufficient currency sinks |

---

## 5. AI Actions & Safety Constraints

### Safety Hierarchy permissions
1. **Observe:** Read data and explain findings.
2. **Recommend:** Create suggested changes and impact analysis.
3. **Simulate:** Test proposed variables without modifying active db variables.
4. **Draft:** Compile configuration updates and code diff structures.
5. **Apply to Sandbox:** Push changes to developer sandbox.
6. **Apply to Staging:** Requires designated team lead approval.
7. **Apply to Production:** Requires human verification, testing, and rollback snapshots.

### Prohibited Autonomous Actions
* Modifying production prices or real-money exchange variables.
* Altering premium currency grants.
* Publishing live client/server builds.
* Deleting persistent player telemetry or user account details.
* Modifying security credentials or user permission logs.
* Bypassing local regulatory rules (PEGI, GDPR).

---

## 6. Implementation Roadmap

### Priority 0 (P0) — Immediate Backend Integration
- `[x]` **Replace Simulated Results:** Fully connect all API components to Postgres/SQLite.
- `[x]` **Agent Permissions:** Assert multi-tenant project security gates on all route endpoints.
- `[x]` **Knowledge Retrieval:** Integrate document parsing and semantic RAG search checks.
- `[x]` **Audit Trails:** Save history logs and version commits on project modifications.
- `[x]` **Production Authentication:** Replace mocks with live Google/LinkedIn OAuth redirects.

### Priority 1 (P1) — Scaling Services
- `[ ]` **Server-side Simulation:** Enable background Monte Carlo job triggers.
- `[ ]` **Telemetry Ingestion:** Create `/api/analytics/events` listener pipeline.
- `[ ]` **Automatic Balancing Engine:** Scheduled checks scanning sinks and difficulty rates.
- `[ ]` **Agent Memory:** Decoupled storage for project decisions.

### Priority 2 (P2) — Collaborative Features
- `[ ]` **A/B Experiment Management:** Sandbox vs control A/B test logs.
- `[ ]` **Google Sheets Sync:** Two-way spreadsheet API mappings.
