/**
 * RBAC Middleware — requireProjectRole
 *
 * Enforces project-level role hierarchy on every protected route.
 * Role hierarchy: owner > admin > editor > viewer
 *
 * Viewer accounts are strictly read-only at the API level.
 * No write, update, delete, or AI mutation is permitted for viewers.
 */
import { Request, Response, NextFunction } from 'express';
import { getDatabase } from '../models/schema.js';

export type ProjectRole = 'owner' | 'admin' | 'editor' | 'viewer';

const ROLE_LEVELS: Record<ProjectRole, number> = {
  owner: 4,
  admin: 3,
  editor: 2,
  viewer: 1,
};

/**
 * Resolves the calling user's effective role for the given project.
 * Returns null if the user is not a member and not the owner.
 */
export async function resolveProjectRole(
  projectId: string,
  userId: string
): Promise<ProjectRole | null> {
  const db = getDatabase();

  // Check ownership first (owners always have full access)
  const project = await db.get(
    'SELECT userId FROM projects WHERE id = ?',
    [projectId]
  );

  if (!project) return null;
  if (project.userId === userId) return 'owner';

  // Check project_members membership
  const membership = await db.get<{ role: ProjectRole }>(
    'SELECT role FROM project_members WHERE projectId = ? AND userId = ?',
    [projectId, userId]
  );

  return membership?.role ?? null;
}

/**
 * Factory: Creates a middleware that requires the user to have at least
 * the specified minimum role on the project referenced in `req.params.projectId`
 * or `req.body.projectId` (in that order of precedence).
 *
 * Usage:
 *   router.put('/:projectId/modules/:name', requireProjectRole('editor'), handler)
 *   router.delete('/:projectId', requireProjectRole('owner'), handler)
 */
export function requireProjectRole(minimumRole: ProjectRole) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const projectId =
      req.params.projectId ||
      req.body?.projectId ||
      req.query?.projectId as string;

    if (!projectId) {
      return res.status(400).json({ error: 'projectId is required' });
    }

    try {
      const role = await resolveProjectRole(projectId, req.user.userId);

      if (!role) {
        return res.status(403).json({
          error: 'Access denied',
          detail: 'You are not a member of this project.',
        });
      }

      const userLevel = ROLE_LEVELS[role] ?? 0;
      const requiredLevel = ROLE_LEVELS[minimumRole] ?? 0;

      if (userLevel < requiredLevel) {
        return res.status(403).json({
          error: 'Insufficient permissions',
          detail: `This action requires '${minimumRole}' role. Your role: '${role}'.`,
          requiredRole: minimumRole,
          yourRole: role,
        });
      }

      // Attach resolved role to request for downstream use
      (req as any).projectRole = role;
      next();
    } catch (err) {
      console.error('[RBAC] Role resolution error:', err);
      res.status(500).json({ error: 'Authorization check failed' });
    }
  };
}

/**
 * Middleware: blocks viewer-role users from any write operation.
 * Use on all module PUT/PATCH/POST routes.
 */
export const requireNonViewer = requireProjectRole('editor');

/**
 * Middleware: requires admin or owner.
 */
export const requireAdmin = requireProjectRole('admin');

/**
 * Middleware: requires owner only.
 */
export const requireOwner = requireProjectRole('owner');
