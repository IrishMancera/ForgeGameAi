import { v4 as uuid } from 'uuid';
import { getDatabase } from '../models/schema.js';

export interface Project {
  id: string;
  userId: string;
  name: string;
  description?: string;
  genre?: string;
  targetPlatform?: string;
  blueprint?: any;
  economy?: any;
  progression?: any;
  psychology?: any;
  simulation?: any;
  auditResults?: any;
  systems?: any;
  analytics?: any;
  workbook?: any;
  knowledgeBase?: any;
  settings?: any;
  systemHealth: number;
  blueprintComplete: number;
  criticalRisks: number;
  openDecisions: number;
  createdAt: string;
  updatedAt: string;
}

export async function createProject(
  userId: string,
  name: string,
  genre?: string,
  targetPlatform?: string
): Promise<Project> {
  const db = getDatabase();
  const projectId = uuid();

  await db.run(
    `INSERT INTO projects (id, userId, name, genre, targetPlatform, systemHealth, blueprintComplete, criticalRisks, openDecisions)
     VALUES (?, ?, ?, ?, ?, 85, 50, 2, 7)`,
    [projectId, userId, name, genre || null, targetPlatform || null]
  );

  const project = await db.get('SELECT * FROM projects WHERE id = ?', [projectId]);
  return project as Project;
}

export async function getProject(projectId: string, userId: string): Promise<Project | null> {
  const db = getDatabase();

  const project = await db.get(
    'SELECT * FROM projects WHERE id = ? AND userId = ?',
    [projectId, userId]
  );

  if (!project) return null;

  // Parse JSON fields safely
  const jsonCols = ['blueprint', 'economy', 'progression', 'psychology', 'simulation', 'auditResults', 'systems', 'analytics', 'workbook', 'knowledgeBase', 'settings'];
  for (const col of jsonCols) {
    if (typeof project[col] === 'string') {
      try {
        project[col] = JSON.parse(project[col]);
      } catch {
        // Keep raw value if not valid JSON
      }
    }
  }

  return project as Project;
}

export async function getUserProjects(userId: string): Promise<Project[]> {
  const db = getDatabase();

  const projects = await db.all(
    'SELECT * FROM projects WHERE userId = ? ORDER BY updatedAt DESC',
    [userId]
  );

  return projects.map((p) => {
    const jsonCols = ['blueprint', 'economy', 'progression', 'psychology', 'simulation', 'auditResults', 'systems', 'analytics', 'workbook', 'knowledgeBase', 'settings'];
    for (const col of jsonCols) {
      if (typeof p[col] === 'string') {
        try {
          p[col] = JSON.parse(p[col]);
        } catch {
          // Keep raw value
        }
      }
    }
    return p as Project;
  });
}

export async function updateProject(
  projectId: string,
  userId: string,
  updates: Partial<Project>
): Promise<Project> {
  const db = getDatabase();

  const existing = await getProject(projectId, userId);
  if (!existing) throw new Error('Project not found');

  const updateFields = Object.keys(updates)
    .filter((k) => k !== 'id' && k !== 'userId' && k !== 'createdAt')
    .map((k) => `${k} = ?`);

  const updateValues = Object.values(updates).filter((_, i) => {
    const key = Object.keys(updates)[i];
    return key !== 'id' && key !== 'userId' && key !== 'createdAt';
  }).map(val => (typeof val === 'object' && val !== null ? JSON.stringify(val) : val));

  if (updateFields.length > 0) {
    updateFields.push('updatedAt = CURRENT_TIMESTAMP');
    await db.run(
      `UPDATE projects SET ${updateFields.join(', ')} WHERE id = ?`,
      [...updateValues, projectId]
    );
  }

  const updated = await getProject(projectId, userId);
  if (!updated) throw new Error('Failed to update project');

  return updated;
}

export async function updateProjectModule(
  projectId: string,
  userId: string,
  moduleName: string,
  moduleData: any
): Promise<Project> {
  const allowedModules = [
    'blueprint', 'economy', 'progression', 'psychology',
    'simulation', 'auditResults', 'systems', 'analytics',
    'workbook', 'knowledgeBase', 'settings'
  ];

  if (!allowedModules.includes(moduleName)) {
    throw new Error(`Invalid module name: ${moduleName}`);
  }

  return updateProject(projectId, userId, {
    [moduleName]: moduleData,
  });
}

export async function deleteProject(projectId: string, userId: string): Promise<void> {
  const db = getDatabase();

  const project = await getProject(projectId, userId);
  if (!project) throw new Error('Project not found');

  await db.run('DELETE FROM projects WHERE id = ?', [projectId]);
}
