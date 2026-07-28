import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { createCheckoutSession, createPortalSession } from '../services/stripeService.js';
import { createStripeCustomer } from '../services/stripeService.js';
import { getDatabase } from '../models/schema.js';
import { v4 as uuid } from 'uuid';
import { z } from 'zod';

const router = Router();

const checkoutSchema = z.object({
  plan: z.enum(['solo', 'studio', 'enterprise']),
});

router.use(authMiddleware);

router.post('/checkout', async (req, res) => {
  try {
    const data = checkoutSchema.parse(req.body);
    const db = getDatabase();
    const user = await db.get('SELECT * FROM users WHERE id = ?', [req.user!.userId]);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const customerId = user.stripeCustomerId || (await createStripeCustomer(user.email)).id;
    if (!user.stripeCustomerId) {
      await db.run('UPDATE users SET stripeCustomerId = ? WHERE id = ?', [customerId, user.id]);
    }

    const session = await createCheckoutSession(customerId, data.plan);
    res.json({ sessionUrl: session.url });
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Invalid request' });
  }
});

router.post('/portal', async (req, res) => {
  try {
    const db = getDatabase();
    const user = await db.get('SELECT * FROM users WHERE id = ?', [req.user!.userId]);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (!user.stripeCustomerId) return res.status(400).json({ error: 'No Stripe customer configured' });

    const portal = await createPortalSession(user.stripeCustomerId);
    res.json({ url: portal.url });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to create billing portal' });
  }
});

export default router;
