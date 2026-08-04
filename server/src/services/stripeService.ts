import Stripe from 'stripe';
import { config } from '../config.js';
import { v4 as uuid } from 'uuid';

const stripe = new Stripe(config.stripe.secretKey, { apiVersion: '2023-10-16' as any });

// ─── Price ID resolution (from env vars — never hardcoded) ────────────────────
// Set STRIPE_PRICE_SOLO, STRIPE_PRICE_STUDIO, STRIPE_PRICE_ENTERPRISE in server/.env
function getPriceId(plan: string): string {
  const prices: Record<string, string | undefined> = {
    solo:       process.env.STRIPE_PRICE_SOLO,
    studio:     process.env.STRIPE_PRICE_STUDIO,
    enterprise: process.env.STRIPE_PRICE_ENTERPRISE,
  };

  const priceId = prices[plan];
  if (!priceId) {
    throw new Error(
      `No Stripe price ID configured for plan '${plan}'. ` +
      `Set STRIPE_PRICE_${plan.toUpperCase()} in server/.env`
    );
  }
  return priceId;
}

export async function createStripeCustomer(email: string): Promise<Stripe.Customer> {
  return stripe.customers.create({ email });
}

export async function createCheckoutSession(
  customerId: string,
  planId: string
): Promise<Stripe.Checkout.Session> {
  const priceId = getPriceId(planId);

  return stripe.checkout.sessions.create({
    mode: 'subscription',
    // payment_method_types intentionally omitted — Stripe Dashboard controls this
    // per-account. Hardcoding non-standard types causes API errors.
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${config.cors.origin}/account?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${config.cors.origin}/pricing`,
  });
}

export async function retrieveSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  return stripe.subscriptions.retrieve(subscriptionId);
}

export async function createPortalSession(
  customerId: string
): Promise<Stripe.BillingPortal.Session> {
  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: config.cors.origin,
  });
}

export async function createInvoicePayment(record: {
  userId: string;
  plan: string;
  amount: number;
  currency: string;
  invoiceId: string;
  status: string;
  description?: string;
}) {
  return {
    id: uuid(),
    ...record,
    createdAt: new Date().toISOString(),
  };
}
