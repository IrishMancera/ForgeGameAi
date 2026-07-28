import { v4 as uuid } from 'uuid';
import { getDatabase } from '../models/schema.js';

export interface Project {
  id: string;
  userId: string;
  name: string;
  description?: string;
  genre?: string;
  targetPlatform?: string;
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

  return project as Project | null;
}

export async function getUserProjects(userId: string): Promise<Project[]> {
  const db = getDatabase();

  const projects = await db.all(
    'SELECT * FROM projects WHERE userId = ? ORDER BY updatedAt DESC',
    [userId]
  );

  return projects as Project[];
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
  });

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

export async function deleteProject(projectId: string, userId: string): Promise<void> {
  const db = getDatabase();

  const project = await getProject(projectId, userId);
  if (!project) throw new Error('Project not found');

  await db.run('DELETE FROM projects WHERE id = ?', [projectId]);
}
