import "server-only";

import Stripe from "stripe";

let stripeClient: Stripe | null = null;

export function getStripeSecretKey() {
  return process.env.stripe_secret_key || process.env.STRIPE_SECRET_KEY || "";
}

export function getStripe() {
  const secretKey = getStripeSecretKey();
  if (!secretKey) {
    throw new Error("Missing Stripe secret key. Set stripe_secret_key in the Next.js server environment.");
  }

  stripeClient ??= new Stripe(secretKey);
  return stripeClient;
}
