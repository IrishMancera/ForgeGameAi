import { Router } from 'express';
import { z } from 'zod';
import { v4 as uuid } from 'uuid';
import { getDatabase } from '../models/schema.js';
import { authMiddleware } from '../middleware/auth.js';
import { sendEmail } from '../services/emailService.js';
import { config } from '../config.js';

const router = Router();

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(['Admin', 'Editor', 'Viewer']),
  name: z.string().min(1),
});

// POST /api/invite/projects/:projectId/invite (auth required)
router.post('/projects/:projectId/invite', authMiddleware, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { email, role, name } = inviteSchema.parse(req.body);
    const db = getDatabase();

    // Verify requesting user owns the project or is a member
    const project = await db.get('SELECT * FROM projects WHERE id = ? AND userId = ?', [projectId, req.user!.userId]);
    if (!project) {
      return res.status(403).json({ error: 'Unauthorized to invite members to this project' });
    }

    const token = uuid();
    const inviteId = uuid();

    // Save invitation to db
    await db.run(
      `INSERT INTO workspace_invitations (id, projectId, email, role, token, status)
       VALUES (?, ?, ?, ?, ?, 'pending')`,
      [inviteId, projectId, email.trim().toLowerCase(), role, token]
    );

    // Generate invite URL link
    const inviteUrl = `${config.cors.origin}/auth?inviteToken=${token}&email=${encodeURIComponent(email)}`;

    const subject = `Join ${project.name} on GameForgeAI`;
    const text = `Hi ${name}, you have been invited to join the project "${project.name}" as an ${role} on GameForgeAI. Click this link to accept the invitation and sign in with Google or your credentials: ${inviteUrl}`;
    const html = `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #DED9EA; border-radius: 12px;">
        <h2 style="color: #6C3BFF;">GameForgeAI Project Invitation</h2>
        <p>Hi <strong>${name}</strong>,</p>
        <p>You have been invited to join the project workspace <strong>"${project.name}"</strong> as an <strong>${role}</strong>.</p>
        <div style="margin: 25px 0;">
          <a href="${inviteUrl}" style="background-color: #6C3BFF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Accept Invitation &amp; Sign In</a>
        </div>
        <p style="color: #6C6880; font-size: 12px;">If the button doesn't work, copy and paste this link in your browser:<br/><a href="${inviteUrl}">${inviteUrl}</a></p>
      </div>
    `;

    // Dispatch email
    await sendEmail(email, subject, html, text);

    res.json({ success: true, token, inviteUrl });
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to create invitation' });
  }
});

// POST /api/invite/accept
router.post('/accept', async (req, res) => {
  try {
    const { token, userId } = req.body;
    if (!token || !userId) {
      return res.status(400).json({ error: 'Token and userId are required' });
    }

    const db = getDatabase();

    // 1. Find the invite
    const invite = await db.get('SELECT * FROM workspace_invitations WHERE token = ? AND status = ?', [token, 'pending']);
    if (!invite) {
      return res.status(404).json({ error: 'Invalid or expired invitation token.' });
    }

    // 2. Fetch the project
    const project = await db.get('SELECT * FROM projects WHERE id = ?', [invite.projectId]);
    if (!project) {
      return res.status(404).json({ error: 'Project workspace no longer exists.' });
    }

    // Parse settings JSON
    let settings: any = {};
    if (project.settings) {
      try {
        settings = typeof project.settings === 'string' ? JSON.parse(project.settings) : project.settings;
      } catch (err) {
        settings = {};
      }
    }

    if (!settings.team) {
      settings.team = [];
    }

    // 3. Find the user profile to get their name
    const user = await db.get('SELECT * FROM users WHERE id = ?', [userId]);
    if (!user) {
      return res.status(404).json({ error: 'User account not found.' });
    }

    // Check if the user is already in the team list
    const isMember = settings.team.some((m: any) => m.email.toLowerCase() === user.email.toLowerCase());
    if (!isMember) {
      settings.team.push({
        id: `TM-${Date.now()}`,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
        email: user.email,
        role: invite.role,
        status: 'Active',
      });
    }

    // Save settings back
    await db.run('UPDATE projects SET settings = ? WHERE id = ?', [JSON.stringify(settings), invite.projectId]);

    // 4. Update relational project_members table
    const memberExists = await db.get('SELECT * FROM project_members WHERE projectId = ? AND userId = ?', [invite.projectId, userId]);
    if (!memberExists) {
      await db.run(
        `INSERT INTO project_members (id, projectId, userId, role)
         VALUES (?, ?, ?, ?)`,
        [uuid(), invite.projectId, userId, invite.role.toLowerCase()]
      );
    }

    // Update invite status to accepted
    await db.run('UPDATE workspace_invitations SET status = ? WHERE id = ?', ['accepted', invite.id]);

    res.json({ success: true, projectId: invite.projectId });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Accept invitation failed' });
  }
});

export default router;
