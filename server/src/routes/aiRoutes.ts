import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { generateAIRecommendation, callOpenAI, buildAIMessage } from '../services/aiService.js';
import { getDatabase } from '../models/schema.js';
import { v4 as uuid } from 'uuid';
import { z } from 'zod';

const router = Router();

const promptSchema = z.object({
  projectId: z.string().uuid(),
  prompt: z.string().min(5),
});

const feedbackSchema = z.object({
  projectId: z.string().uuid(),
  recommendationId: z.string().uuid(),
  action: z.enum(['apply', 'reject', 'edit']),
});

router.use(authMiddleware);

router.post('/recommendation', async (req, res) => {
  try {
    const data = promptSchema.parse(req.body);
    const recommendation = await generateAIRecommendation(data.projectId, data.prompt);

    const db = getDatabase();
    await db.run(
      `INSERT INTO recommendations (id, projectId, agent, type, title, description, affectedSystems, confidence, status)
       VALUES (?, ?, ?, 'recommendation', ?, ?, ?, ?, 'pending')`,
      [recommendation.id, data.projectId, recommendation.agent, recommendation.title, recommendation.description, JSON.stringify(recommendation.affectedSystems), recommendation.confidence]
    );

    res.status(201).json({ recommendation });
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Invalid request' });
  }
});

router.post('/chat', async (req, res) => {
  try {
    const data = promptSchema.parse(req.body);
    const userMessage = buildAIMessage(data.prompt, 'user');
    const aiText = await callOpenAI(data.prompt);
    const assistantMessage = buildAIMessage(aiText, 'assistant');

    const db = getDatabase();
    await db.run(
      `INSERT INTO aiConversations (id, projectId, userId, messages)
       VALUES (?, ?, ?, ?)`,
      [uuid(), data.projectId, req.user!.userId, JSON.stringify([userMessage, assistantMessage])]
    );

    res.json({ message: aiText });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'AI request failed' });
  }
});

router.post('/feedback', async (req, res) => {
  try {
    const data = feedbackSchema.parse(req.body);
    const db = getDatabase();

    const recommendation = await db.get('SELECT * FROM recommendations WHERE id = ? AND projectId = ?', [data.recommendationId, data.projectId]);
    if (!recommendation) return res.status(404).json({ error: 'Recommendation not found' });

    await db.run('UPDATE recommendations SET status = ? WHERE id = ?', [data.action === 'apply' ? 'applied' : data.action === 'reject' ? 'rejected' : 'edited', data.recommendationId]);

    res.json({ success: true, recommendationId: data.recommendationId, status: data.action });
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Invalid feedback request' });
  }
});

export default router;
