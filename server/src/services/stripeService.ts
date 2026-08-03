import Stripe from 'stripe';
import { config } from '../config.js';
import { v4 as uuid } from 'uuid';

// Initialize Stripe without a strict typed apiVersion to avoid TS literal mismatch
const stripe = new Stripe(config.stripe.secretKey as string, { apiVersion: undefined as any });

export async function createStripeCustomer(email: string): Promise<Stripe.Customer> {
  return stripe.customers.create({ email });
}

export async function createCheckoutSession(customerId: string, planId: 'solo' | 'studio' | 'enterprise'): Promise<Stripe.Checkout.Session> {
  const prices: Record<'solo' | 'studio' | 'enterprise', string> = {
    solo: 'price_1K0XSQJNpaTj2TZhM9NvZQ4W',
    studio: 'price_1K0XSQJNpaTj2TZh47oW2lVj',
    enterprise: 'price_1K0XSQJNpaTj2TZhO0ZXw3iK',
  };

  const priceId = prices[planId] || prices.studio;

  return stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${config.cors.origin}/account?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${config.cors.origin}/pricing`,
  });
}

export async function retrieveSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
  return stripe.subscriptions.retrieve(subscriptionId);
}

export async function createPortalSession(customerId: string): Promise<Stripe.BillingPortal.Session> {
  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: config.cors.origin,
  });
}

export async function createInvoicePayment(record: { userId: string; plan: string; amount: number; currency: string; invoiceId: string; status: string; description?: string; }) {
  return {
    id: uuid(),
    ...record,
    createdAt: new Date().toISOString(),
  };
}
