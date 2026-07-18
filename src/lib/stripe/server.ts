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
  if (!/^sk_(test|live)_/.test(secretKey)) {
    throw new Error("Invalid Stripe secret key. Use a Stripe secret key that starts with sk_test_ or sk_live_, not a publishable or merchant key.");
  }

  stripeClient ??= new Stripe(secretKey);
  return stripeClient;
}
