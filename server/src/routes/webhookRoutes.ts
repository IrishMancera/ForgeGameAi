/**
 * Stripe Webhook Handler
 *
 * Security: uses stripe.webhooks.constructEvent() for signature verification.
 * Idempotency: checks for duplicate stripe_event_id before processing.
 * Handles: checkout.session.completed, subscription.updated/deleted, invoice.payment_failed
 *
 * IMPORTANT: This route must be registered BEFORE bodyParser.json() middleware
 * in server.ts so the raw body is available for Stripe signature verification.
 */
import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { config } from '../config.js';
import { getDatabase } from '../models/schema.js';
import { v4 as uuid } from 'uuid';

const router = Router();

const stripe = new Stripe(config.stripe.secretKey, { apiVersion: '2023-10-16' as any });

router.post(
  '/webhook',
  // Raw body is required for signature verification — do NOT use bodyParser.json() here
  async (req: Request & { rawBody?: Buffer }, res: Response) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = config.stripe.webhookSecret;

    if (!webhookSecret) {
      console.error('[Stripe Webhook] STRIPE_WEBHOOK_SECRET is not configured');
      return res.status(500).json({ error: 'Webhook secret not configured' });
    }

    if (!sig) {
      return res.status(400).json({ error: 'Missing stripe-signature header' });
    }

    let event: Stripe.Event;
    try {
      // Signature verification — rejects any tampered or replay requests
      event = stripe.webhooks.constructEvent(
        req.rawBody || req.body,
        sig,
        webhookSecret
      );
    } catch (err) {
      console.error('[Stripe Webhook] Signature verification failed:', err instanceof Error ? err.message : err);
      return res.status(400).json({ error: 'Invalid webhook signature' });
    }

    const db = getDatabase();

    // ── Idempotency check — reject duplicate event processing ───────────────
    const existingEvent = await db.get(
      'SELECT id FROM billingHistory WHERE stripeEventId = ?',
      [event.id]
    );
    if (existingEvent) {
      // Already processed — return 200 to prevent Stripe retries
      return res.json({ received: true, duplicate: true });
    }

    console.log(`[Stripe Webhook] Processing event: ${event.type} (${event.id})`);

    try {
      switch (event.type) {

        // ── Checkout completed → activate subscription ───────────────────────
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;
          const customerId = session.customer as string;
          const subscriptionId = session.subscription as string;

          if (!subscriptionId) break;

          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const plan = getPlanFromPriceId(subscription.items.data[0]?.price?.id || '');

          const user = await db.get('SELECT * FROM users WHERE stripeCustomerId = ?', [customerId]);
          if (!user) {
            console.warn(`[Stripe Webhook] No user found for customerId: ${customerId}`);
            break;
          }

          // Update subscription record
          await db.run(
            `INSERT INTO subscriptions
             (id, userId, stripeSubscriptionId, plan, status, currentPeriodStart, currentPeriodEnd)
             VALUES (?, ?, ?, ?, ?, ?, ?)
             ON CONFLICT (stripeSubscriptionId) DO UPDATE SET
               status = EXCLUDED.status,
               plan = EXCLUDED.plan,
               currentPeriodStart = EXCLUDED.currentPeriodStart,
               currentPeriodEnd = EXCLUDED.currentPeriodEnd,
               updatedAt = CURRENT_TIMESTAMP`,
            [
              uuid(), user.id, subscriptionId, plan,
              subscription.status,
              new Date(subscription.current_period_start * 1000).toISOString(),
              new Date(subscription.current_period_end * 1000).toISOString(),
            ]
          );

          // Update user plan
          await db.run(
            'UPDATE users SET subscriptionPlan = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
            [plan, user.id]
          );

          await logBillingEvent(db, user.id, event.id, 'checkout.session.completed', plan, subscriptionId);
          console.log(`[Stripe Webhook] Subscription activated: ${user.id} → ${plan}`);
          break;
        }

        // ── Subscription updated → sync plan ─────────────────────────────────
        case 'customer.subscription.updated': {
          const subscription = event.data.object as Stripe.Subscription;
          const customerId = subscription.customer as string;
          const plan = getPlanFromPriceId(subscription.items.data[0]?.price?.id || '');

          const user = await db.get('SELECT * FROM users WHERE stripeCustomerId = ?', [customerId]);
          if (!user) break;

          await db.run(
            `UPDATE subscriptions SET
               status = ?, plan = ?,
               currentPeriodStart = ?, currentPeriodEnd = ?,
               cancelAtPeriodEnd = ?,
               updatedAt = CURRENT_TIMESTAMP
             WHERE stripeSubscriptionId = ?`,
            [
              subscription.status, plan,
              new Date(subscription.current_period_start * 1000).toISOString(),
              new Date(subscription.current_period_end * 1000).toISOString(),
              subscription.cancel_at_period_end ? 1 : 0,
              subscription.id,
            ]
          );

          await db.run(
            'UPDATE users SET subscriptionPlan = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
            [plan, user.id]
          );

          await logBillingEvent(db, user.id, event.id, 'customer.subscription.updated', plan, subscription.id);
          break;
        }

        // ── Subscription deleted/cancelled → downgrade to free ───────────────
        case 'customer.subscription.deleted': {
          const subscription = event.data.object as Stripe.Subscription;
          const customerId = subscription.customer as string;

          const user = await db.get('SELECT * FROM users WHERE stripeCustomerId = ?', [customerId]);
          if (!user) break;

          await db.run(
            `UPDATE subscriptions SET status = 'canceled', updatedAt = CURRENT_TIMESTAMP
             WHERE stripeSubscriptionId = ?`,
            [subscription.id]
          );

          await db.run(
            "UPDATE users SET subscriptionPlan = 'free', updatedAt = CURRENT_TIMESTAMP WHERE id = ?",
            [user.id]
          );

          await logBillingEvent(db, user.id, event.id, 'customer.subscription.deleted', 'free', subscription.id);
          console.log(`[Stripe Webhook] Subscription cancelled: ${user.id} → free`);
          break;
        }

        // ── Payment failed → flag user, keep subscription in grace period ────
        case 'invoice.payment_failed': {
          const invoice = event.data.object as Stripe.Invoice;
          const customerId = invoice.customer as string;

          const user = await db.get('SELECT * FROM users WHERE stripeCustomerId = ?', [customerId]);
          if (!user) break;

          await db.run(
            `UPDATE subscriptions SET status = 'past_due', updatedAt = CURRENT_TIMESTAMP
             WHERE userId = ? AND status = 'active'`,
            [user.id]
          );

          await logBillingEvent(db, user.id, event.id, 'invoice.payment_failed', 'past_due', invoice.subscription as string);
          console.warn(`[Stripe Webhook] Payment failed for user: ${user.id}`);
          break;
        }

        default:
          console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
      }

      res.json({ received: true, type: event.type });
    } catch (err) {
      console.error(`[Stripe Webhook] Handler error for ${event.type}:`, err);
      res.status(500).json({ error: 'Webhook handler failed' });
    }
  }
);

function getPlanFromPriceId(priceId: string): string {
  const priceMap: Record<string, string> = {
    [process.env.STRIPE_PRICE_SOLO || 'price_solo']: 'solo',
    [process.env.STRIPE_PRICE_STUDIO || 'price_studio']: 'studio',
    [process.env.STRIPE_PRICE_ENTERPRISE || 'price_enterprise']: 'enterprise',
  };
  return priceMap[priceId] || 'solo';
}

async function logBillingEvent(
  db: any,
  userId: string,
  stripeEventId: string,
  action: string,
  plan: string,
  subscriptionId: string | null
) {
  await db.run(
    `INSERT INTO billingHistory
     (id, userId, subscriptionId, amount, currency, status, invoiceId, description, stripeEventId)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      uuid(), userId, subscriptionId, 0, 'usd',
      'webhook_processed', null,
      `${action} → ${plan}`,
      stripeEventId,
    ]
  );
}

export default router;
