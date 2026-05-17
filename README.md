# ELOO — Product Requirements Document (PRD)
**Version:** 1.0  
**Date:** March 2026  
**Stack:** Next.js 14 + Node.js + Supabase + Vercel  
**Reference:** Yoojo.fr

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Tech Stack & Architecture](#2-tech-stack--architecture)
3. [Database Schema (Supabase/PostgreSQL)](#3-database-schema-supabasepostgresql)
4. [Service Categories & Icons](#4-service-categories--icons)
5. [Pages & Screens](#5-pages--screens)
6. [Feature Specifications](#6-feature-specifications)
7. [API & Edge Functions](#7-api--edge-functions)
8. [Authentication & Authorization](#8-authentication--authorization)
9. [Real-time Features](#9-real-time-features)
10. [Deployment (Vercel + Supabase)](#10-deployment-vercel--supabase)
11. [Project Structure](#11-project-structure)
12. [Phase Roadmap](#12-phase-roadmap)
13. [Environment Variables](#13-environment-variables)

---

## 1. Product Overview

**Eloo** is a two-sided marketplace connecting customers with local home-service providers. Inspired by Yoojo.fr, it replicates the same core UX and extends it with modern Next.js 14 App Router architecture, Supabase as the backend, and Vercel for global edge deployment.

### User Roles

| Role | Description |
|------|-------------|
| **Client** | Books services, reviews providers, manages jobs |
| **Provider (Prestataire)** | Lists services, receives job offers, manages availability |
| **Admin** | Manages platform, disputes, payouts, categories |

### Core Value Propositions

- Instantly book verified local service providers
- Smart hourly-rate estimator at booking
- Subscription pass (Pass Sérénité equivalent) for recurring jobs
- Insurance coverage for all accepted missions
- In-app messaging between client and provider
- Star ratings + verified reviews

---

## 2. Tech Stack & Architecture

```
Frontend          → Next.js 14 (App Router, RSC, SSR/SSG)
Styling           → Tailwind CSS + shadcn/ui
State             → Zustand (global) + React Query (server state)
Backend API       → Supabase Edge Functions (Deno) + Next.js API Routes (Node.js)
Database          → Supabase PostgreSQL
Auth              → Supabase Auth (email/password, Google OAuth, magic link)
Storage           → Supabase Storage (avatars, proof of work images)
Real-time         → Supabase Realtime (chat, job status)
Payments          → Stripe Connect (marketplace payments + provider payouts)
Email             → Resend (transactional emails)
SMS               → Twilio (booking confirmations, alerts)
Maps              → Mapbox GL JS (provider search radius)
Deployment        → Vercel (Next.js) + Supabase Cloud
CDN               → Vercel Edge Network
```

### Architecture Diagram

```
Browser / Mobile
       │
       ▼
  Vercel Edge (Next.js 14)
  ├── App Router (RSC + Client Components)
  ├── /api/* (Node.js API Routes)
  │         │
  │         ▼
  │   Supabase Edge Functions (Deno)
  │   ├── booking-engine
  │   ├── payment-handler
  │   ├── notification-sender
  │   └── search-ranking
  │         │
  │         ▼
  │   Supabase PostgreSQL
  │   ├── Row Level Security (RLS)
  │   ├── Realtime subscriptions
  │   └── Supabase Storage
  │
  ├── Stripe Connect API
  ├── Resend (email)
  └── Twilio (SMS)
```

---

## 3. Database Schema (Supabase/PostgreSQL)

### 3.1 Users & Profiles

```sql
-- Core auth (managed by Supabase Auth)
-- auth.users (auto-created by Supabase)

-- Extended profile for all users
CREATE TABLE profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role          TEXT NOT NULL CHECK (role IN ('client', 'provider', 'admin')),
  first_name    TEXT NOT NULL,
  last_name     TEXT NOT NULL,
  phone         TEXT,
  avatar_url    TEXT,
  bio           TEXT,
  city          TEXT,
  postal_code   TEXT,
  latitude      FLOAT,
  longitude     FLOAT,
  is_verified   BOOLEAN DEFAULT FALSE,
  stripe_customer_id   TEXT,
  stripe_account_id    TEXT,  -- for providers (Stripe Connect)
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: Users can only read/update their own profile
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Public profiles viewable" ON profiles FOR SELECT USING (TRUE); -- for provider cards
```

### 3.2 Service Categories

```sql
CREATE TABLE categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        TEXT UNIQUE NOT NULL,        -- e.g. 'bricolage', 'menage'
  name        TEXT NOT NULL,               -- e.g. 'Bricolage', 'Ménage'
  name_en     TEXT,                        -- English name
  icon        TEXT NOT NULL,               -- Lucide icon name or emoji
  color       TEXT DEFAULT '#000000',      -- brand color per category
  description TEXT,
  is_active   BOOLEAN DEFAULT TRUE,
  sort_order  INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Subcategories
CREATE TABLE subcategories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  slug        TEXT NOT NULL,
  name        TEXT NOT NULL,
  description TEXT,
  base_price_per_hour DECIMAL(10,2),       -- suggested rate
  min_hours   INT DEFAULT 1,
  is_active   BOOLEAN DEFAULT TRUE
);
```

### 3.3 Provider Listings

```sql
CREATE TABLE provider_services (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id     UUID REFERENCES profiles(id) ON DELETE CASCADE,
  category_id     UUID REFERENCES categories(id),
  subcategory_id  UUID REFERENCES subcategories(id),
  title           TEXT NOT NULL,
  description     TEXT,
  hourly_rate     DECIMAL(10,2) NOT NULL,
  min_hours       INT DEFAULT 1,
  max_radius_km   INT DEFAULT 20,           -- service radius
  is_active       BOOLEAN DEFAULT TRUE,
  tags            TEXT[],
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE provider_availability (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id   UUID REFERENCES profiles(id) ON DELETE CASCADE,
  day_of_week   INT CHECK (day_of_week BETWEEN 0 AND 6),  -- 0=Sun
  start_time    TIME NOT NULL,
  end_time      TIME NOT NULL,
  is_available  BOOLEAN DEFAULT TRUE
);

CREATE TABLE provider_blocked_dates (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id   UUID REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_date  DATE NOT NULL,
  reason        TEXT
);

-- Portfolio / proof of work images
CREATE TABLE provider_portfolio (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id   UUID REFERENCES profiles(id) ON DELETE CASCADE,
  image_url     TEXT NOT NULL,
  caption       TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.4 Bookings / Jobs

```sql
CREATE TYPE booking_status AS ENUM (
  'pending',        -- client submitted, awaiting provider
  'offered',        -- sent to matching providers
  'accepted',       -- provider accepted
  'confirmed',      -- client confirmed
  'in_progress',    -- job started
  'completed',      -- job done, pending review
  'reviewed',       -- both parties reviewed
  'cancelled',      -- cancelled by either party
  'disputed'        -- dispute raised
);

CREATE TABLE bookings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id         UUID REFERENCES profiles(id),
  provider_id       UUID REFERENCES profiles(id),
  service_id        UUID REFERENCES provider_services(id),
  category_id       UUID REFERENCES categories(id),
  
  title             TEXT NOT NULL,
  description       TEXT,
  address           TEXT NOT NULL,
  city              TEXT NOT NULL,
  postal_code       TEXT NOT NULL,
  latitude          FLOAT,
  longitude         FLOAT,
  
  scheduled_date    DATE NOT NULL,
  scheduled_time    TIME NOT NULL,
  estimated_hours   DECIMAL(4,1) NOT NULL,
  hourly_rate       DECIMAL(10,2) NOT NULL,
  
  subtotal          DECIMAL(10,2),           -- hours * rate
  platform_fee      DECIMAL(10,2),           -- Eloo commission (e.g. 15%)
  total_amount      DECIMAL(10,2),
  
  status            booking_status DEFAULT 'pending',
  
  stripe_payment_intent_id  TEXT,
  paid_at           TIMESTAMPTZ,
  completed_at      TIMESTAMPTZ,
  cancelled_at      TIMESTAMPTZ,
  cancel_reason     TEXT,
  
  client_notes      TEXT,
  provider_notes    TEXT,
  
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clients see own bookings" ON bookings FOR SELECT USING (auth.uid() = client_id);
CREATE POLICY "Providers see own bookings" ON bookings FOR SELECT USING (auth.uid() = provider_id);
```

### 3.5 Reviews & Ratings

```sql
CREATE TABLE reviews (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id    UUID REFERENCES bookings(id) ON DELETE CASCADE,
  reviewer_id   UUID REFERENCES profiles(id),
  reviewee_id   UUID REFERENCES profiles(id),
  rating        INT CHECK (rating BETWEEN 1 AND 5),
  comment       TEXT,
  is_public     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Materialized view for provider rating aggregates
CREATE MATERIALIZED VIEW provider_ratings AS
  SELECT
    reviewee_id AS provider_id,
    COUNT(*) AS review_count,
    ROUND(AVG(rating)::NUMERIC, 1) AS avg_rating
  FROM reviews
  WHERE is_public = TRUE
  GROUP BY reviewee_id;
```

### 3.6 Messaging

```sql
CREATE TABLE conversations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id    UUID REFERENCES bookings(id),
  client_id     UUID REFERENCES profiles(id),
  provider_id   UUID REFERENCES profiles(id),
  last_message  TEXT,
  last_message_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       UUID REFERENCES profiles(id),
  body            TEXT NOT NULL,
  is_read         BOOLEAN DEFAULT FALSE,
  attachment_url  TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Conversation participants only" ON messages FOR ALL
  USING (
    auth.uid() IN (
      SELECT client_id FROM conversations WHERE id = conversation_id
      UNION
      SELECT provider_id FROM conversations WHERE id = conversation_id
    )
  );
```

### 3.7 Subscriptions (Pass Sérénité equivalent)

```sql
CREATE TYPE subscription_plan AS ENUM ('monthly', 'annual');
CREATE TYPE subscription_status AS ENUM ('active', 'cancelled', 'expired', 'paused');

CREATE TABLE subscriptions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID REFERENCES profiles(id),
  plan                subscription_plan NOT NULL,
  status              subscription_status DEFAULT 'active',
  stripe_subscription_id TEXT,
  price_monthly       DECIMAL(10,2),
  started_at          TIMESTAMPTZ DEFAULT NOW(),
  renews_at           TIMESTAMPTZ,
  cancelled_at        TIMESTAMPTZ
);
```

### 3.8 Notifications

```sql
CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,   -- 'booking_accepted', 'new_message', 'payment_received', etc.
  title       TEXT NOT NULL,
  body        TEXT,
  data        JSONB,           -- extra context (booking_id, etc.)
  is_read     BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 4. Service Categories & Icons

These exactly mirror the Yoojo categories visible in the screenshots. Use Lucide React icons throughout.

| Slug | Display Name (FR) | Display Name (EN) | Lucide Icon | Emoji Fallback |
|------|------------------|-------------------|-------------|----------------|
| `hiver` | Hiver | Winter / Snow | `Snowflake` | ❄️ |
| `bricolage` | Bricolage | Handyman | `Hammer` | 🔨 |
| `jardinage` | Jardinage | Gardening | `Shovel` | 🪴 |
| `demenagement` | Déménagement | Moving | `Truck` | 🚚 |
| `menage` | Ménage | Cleaning | `Sparkles` | 🧹 |
| `enfants` | Enfants | Childcare | `Baby` | 👶 |
| `animaux` | Animaux | Pets | `PawPrint` | 🐾 |
| `informatique` | Informatique | IT Support | `Monitor` | 💻 |
| `aide-domicile` | Aide à domicile | Home Assistance | `HandHeart` | 🏠 |
| `cours-particuliers` | Cours particuliers | Tutoring | `GraduationCap` | 🎓 |

### Category Icon Component (Next.js)

```tsx
// components/CategoryIcon.tsx
import {
  Snowflake, Hammer, Shovel, Truck, Sparkles,
  Baby, PawPrint, Monitor, HandHeart, GraduationCap
} from 'lucide-react';

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  hiver: Snowflake,
  bricolage: Hammer,
  jardinage: Shovel,
  demenagement: Truck,
  menage: Sparkles,
  enfants: Baby,
  animaux: PawPrint,
  informatique: Monitor,
  'aide-domicile': HandHeart,
  'cours-particuliers': GraduationCap,
};

export function CategoryIcon({ slug, className }: { slug: string; className?: string }) {
  const Icon = CATEGORY_ICONS[slug] ?? Hammer;
  return <Icon className={className ?? 'w-6 h-6'} />;
}
```

---

## 5. Pages & Screens

### 5.1 Public (Unauthenticated)

| Route | Description |
|-------|-------------|
| `/` | Landing page (hero, category icons, provider cards, CTA) |
| `/search?cat=bricolage&city=Paris` | Provider search results |
| `/providers/[id]` | Provider public profile |
| `/how-it-works` | How Eloo works (clients + providers) |
| `/become-provider` | Provider onboarding landing |
| `/pricing` | Subscription pricing |
| `/login` | Login / Register |
| `/register` | Registration (client or provider) |

### 5.2 Client Dashboard (`/dashboard/`)

| Route | Description |
|-------|-------------|
| `/dashboard` | Overview: upcoming, past, messages |
| `/dashboard/bookings` | All bookings list with status |
| `/dashboard/bookings/new` | Multi-step booking form |
| `/dashboard/bookings/[id]` | Booking detail |
| `/dashboard/messages` | Inbox |
| `/dashboard/messages/[id]` | Conversation thread |
| `/dashboard/reviews` | My reviews given/received |
| `/dashboard/subscription` | Manage Pass Sérénité |
| `/dashboard/settings` | Profile, notifications, security |

### 5.3 Provider Dashboard (`/pro/`)

| Route | Description |
|-------|-------------|
| `/pro` | Overview: stats, upcoming jobs, revenue |
| `/pro/jobs` | All job offers + accepted jobs |
| `/pro/jobs/[id]` | Job detail, accept/decline |
| `/pro/services` | Manage listed services |
| `/pro/services/new` | Add new service |
| `/pro/availability` | Calendar availability |
| `/pro/messages` | Inbox |
| `/pro/wallet` | Earnings, payout history |
| `/pro/reviews` | Reviews received |
| `/pro/profile` | Public profile editor |
| `/pro/settings` | Account settings |
| `/pro/onboarding` | Multi-step provider onboarding |

### 5.4 Admin (`/admin/`)

| Route | Description |
|-------|-------------|
| `/admin` | Platform stats dashboard |
| `/admin/users` | User management |
| `/admin/providers` | Provider verification queue |
| `/admin/bookings` | All bookings, dispute handling |
| `/admin/categories` | Manage categories & icons |
| `/admin/payouts` | Payout processing |

---

## 6. Feature Specifications

### 6.1 Landing Page (Exact Yoojo Clone)

**Hero Section:**
- Full-width background photo (warm interior/lifestyle image)
- Centered headline: "Réservez le prestataire idéal" (or localized equivalent)
- Search bar with placeholder text cycling through service examples
- Blue search button (CTA)

**Category Icons Bar:**
- White rounded card below hero
- 10 icons in a horizontal scroll row (same order as Yoojo)
- Icon + label below (bold on hover)
- Click navigates to `/search?cat=[slug]`

**Social Proof Strip:**
- "388 000 prestataires de service à domicile évalués et qualifiés"

**Provider Cards Grid:**
- Grid of 4 provider profile cards
- Avatar, name, rating stars, category badge, hourly rate, city, "Book" CTA

**How It Works Section:**
- 3-step cards: Post job → Receive offers → Choose provider

**Trust Section:**
- Insurance badge, verified providers badge, money-back guarantee

**Footer:**
- Category links, company links, social, app store badges

### 6.2 Booking Flow (Multi-step)

```
Step 1: Choose Category
Step 2: Describe the Job (title, description, date, time, estimated hours)
Step 3: Your Location (address with Mapbox autocomplete)
Step 4: Review & Price Estimate (hours × rate + platform fee)
Step 5: Confirm & Pay (Stripe Checkout or saved card)
```

### 6.3 Provider Search & Ranking

Ranking algorithm factors:
- Proximity to client (haversine distance)
- Average rating (weight: 30%)
- Number of completed jobs (weight: 20%)
- Response rate and speed (weight: 20%)
- Profile completeness (weight: 15%)
- Subscription status of provider (weight: 15%)

### 6.4 In-App Messaging

- Supabase Realtime subscriptions on `messages` table
- Read receipts via `is_read` flag
- File/photo attachments via Supabase Storage
- Push notification via Supabase Edge Function trigger

### 6.5 Payments (Stripe Connect)

```
Client pays → Stripe holds funds (escrow)
           → Job completed
           → Platform deducts fee (e.g. 15%)
           → Remaining transferred to provider Stripe account
           → Provider can request payout (instant or standard)
```

- Providers onboard via Stripe Connect Express
- Stripe webhooks handled in `/api/webhooks/stripe`

### 6.6 Reviews System

- Both client and provider review after job completion
- Reviews are public on provider profile
- Rating = weighted average displayed as stars (1–5)
- 14-day review window after completion

### 6.7 Subscription (Pass Sérénité)

- Monthly plan: €9.90/month (example)
- Annual plan: €79/year (example)
- Benefits: No booking fees, priority matching, dedicated support
- Managed via Stripe Billing + Supabase `subscriptions` table

---

## 7. API & Edge Functions

### Next.js API Routes (`/app/api/`)

```
POST   /api/auth/register         → Create profile after Supabase signup
POST   /api/bookings              → Create new booking
PATCH  /api/bookings/[id]         → Update booking status
POST   /api/reviews               → Submit review
GET    /api/providers/search      → Search providers by category + location
POST   /api/webhooks/stripe       → Stripe event handler
POST   /api/webhooks/supabase     → Supabase DB webhook handler
```

### Supabase Edge Functions (Deno)

```
supabase/functions/
├── booking-engine/         → Match client jobs to nearby providers
│   index.ts                → Runs on booking creation, sends offers
│
├── payment-handler/        → Stripe payment intents, payouts
│   index.ts
│
├── notification-sender/    → Email (Resend) + SMS (Twilio) triggers
│   index.ts
│
├── search-ranking/         → Provider ranking algorithm
│   index.ts
│
└── cron-jobs/              → Daily: expire stale bookings, send reminders
    index.ts
```

#### Example: booking-engine Edge Function

```typescript
// supabase/functions/booking-engine/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  const { booking_id } = await req.json()
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // 1. Fetch booking details
  const { data: booking } = await supabase
    .from('bookings')
    .select('*, categories(*)')
    .eq('id', booking_id)
    .single()

  // 2. Find matching providers within radius
  const { data: providers } = await supabase.rpc('find_nearby_providers', {
    lat: booking.latitude,
    lng: booking.longitude,
    category_id: booking.category_id,
    radius_km: 25
  })

  // 3. Send job offer notifications to top 10 providers
  for (const provider of providers.slice(0, 10)) {
    await supabase.from('notifications').insert({
      user_id: provider.id,
      type: 'new_job_offer',
      title: `New job: ${booking.title}`,
      body: `${booking.estimated_hours}h in ${booking.city}`,
      data: { booking_id }
    })
  }

  // 4. Update booking status
  await supabase.from('bookings').update({ status: 'offered' }).eq('id', booking_id)

  return new Response(JSON.stringify({ matched: providers.length }), {
    headers: { 'Content-Type': 'application/json' }
  })
})
```

### PostgreSQL Helper Function (Geo Search)

```sql
-- Find providers near a location using Haversine
CREATE OR REPLACE FUNCTION find_nearby_providers(
  lat FLOAT,
  lng FLOAT,
  category_id UUID,
  radius_km INT DEFAULT 25
)
RETURNS TABLE (id UUID, distance_km FLOAT) AS $$
  SELECT
    p.id,
    (6371 * acos(
      cos(radians(lat)) * cos(radians(p.latitude)) *
      cos(radians(p.longitude) - radians(lng)) +
      sin(radians(lat)) * sin(radians(p.latitude))
    )) AS distance_km
  FROM profiles p
  JOIN provider_services ps ON ps.provider_id = p.id
  WHERE ps.category_id = $3
    AND p.role = 'provider'
    AND p.is_verified = TRUE
  HAVING distance_km <= radius_km
  ORDER BY distance_km ASC;
$$ LANGUAGE sql;
```

---

## 8. Authentication & Authorization

### Supabase Auth Configuration

```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

```typescript
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createServerSupabaseClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: (c) => c.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } }
  )
}
```

### Auth Providers to Enable
- Email + Password (primary)
- Google OAuth
- Magic Link (passwordless)

### Route Protection (Next.js Middleware)

```typescript
// middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const supabase = createServerClient(/* ... */)
  const { data: { session } } = await supabase.auth.getSession()

  const protectedRoutes = ['/dashboard', '/pro', '/admin']
  const isProtected = protectedRoutes.some(r => request.nextUrl.pathname.startsWith(r))

  if (isProtected && !session) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Role-based access
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', session?.user.id).single()
    if (profile?.role !== 'admin') return NextResponse.redirect(new URL('/', request.url))
  }

  return response
}

export const config = { matcher: ['/dashboard/:path*', '/pro/:path*', '/admin/:path*'] }
```

---

## 9. Real-time Features

### Live Chat (Supabase Realtime)

```typescript
// hooks/useMessages.ts
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export function useMessages(conversationId: string) {
  const [messages, setMessages] = useState([])

  useEffect(() => {
    // Initial fetch
    supabase.from('messages').select('*').eq('conversation_id', conversationId)
      .order('created_at').then(({ data }) => setMessages(data ?? []))

    // Realtime subscription
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      }, (payload) => {
        setMessages(prev => [...prev, payload.new])
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [conversationId])

  return messages
}
```

### Live Booking Status Updates

```typescript
// hooks/useBookingStatus.ts
export function useBookingStatus(bookingId: string) {
  const [status, setStatus] = useState(null)

  useEffect(() => {
    const channel = supabase
      .channel(`booking:${bookingId}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'bookings',
        filter: `id=eq.${bookingId}`
      }, (payload) => setStatus(payload.new.status))
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [bookingId])

  return status
}
```

---

## 10. Deployment (Vercel + Supabase)

### Vercel Setup

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Link project
vercel link

# 3. Set environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add STRIPE_SECRET_KEY
vercel env add STRIPE_WEBHOOK_SECRET
vercel env add RESEND_API_KEY
vercel env add NEXT_PUBLIC_MAPBOX_TOKEN

# 4. Deploy
vercel --prod
```

### vercel.json

```json
{
  "framework": "nextjs",
  "regions": ["cdg1", "lhr1"],
  "functions": {
    "app/api/**": { "maxDuration": 30 }
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Origin", "value": "*" }
      ]
    }
  ]
}
```

### Supabase Setup

```bash
# 1. Install Supabase CLI
npm install -g supabase

# 2. Init project
supabase init

# 3. Link to cloud project
supabase link --project-ref YOUR_PROJECT_REF

# 4. Run migrations
supabase db push

# 5. Deploy edge functions
supabase functions deploy booking-engine
supabase functions deploy payment-handler
supabase functions deploy notification-sender
supabase functions deploy search-ranking

# 6. Set function secrets
supabase secrets set STRIPE_SECRET_KEY=sk_live_xxx
supabase secrets set RESEND_API_KEY=re_xxx
supabase secrets set TWILIO_AUTH_TOKEN=xxx
```

### CI/CD with GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npm run lint
      - run: npm run build
      - run: npx vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
        env:
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
```

---

## 11. Project Structure

```
eloo/
├── app/                          # Next.js 14 App Router
│   ├── (public)/
│   │   ├── page.tsx              # Landing page
│   │   ├── search/page.tsx       # Provider search
│   │   ├── providers/[id]/       # Provider profile
│   │   ├── how-it-works/
│   │   ├── become-provider/
│   │   └── login/
│   ├── dashboard/                # Client area
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── bookings/
│   │   ├── messages/
│   │   └── settings/
│   ├── pro/                      # Provider area
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── jobs/
│   │   ├── services/
│   │   ├── wallet/
│   │   └── availability/
│   ├── admin/                    # Admin area
│   └── api/                      # API routes
│       ├── auth/
│       ├── bookings/
│       ├── providers/
│       └── webhooks/
│
├── components/
│   ├── ui/                       # shadcn/ui base components
│   ├── layout/                   # Header, Footer, Sidebar
│   ├── landing/                  # Hero, CategoryBar, ProviderCard
│   ├── booking/                  # Multi-step booking form
│   ├── messaging/                # Chat UI
│   ├── provider/                 # Provider profile, services
│   └── shared/                   # Rating stars, badges, etc.
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── types.ts              # Generated from `supabase gen types`
│   ├── stripe/
│   │   ├── client.ts
│   │   └── webhooks.ts
│   └── utils/
│       ├── geo.ts
│       ├── format.ts
│       └── validation.ts
│
├── hooks/                        # Custom React hooks
│   ├── useMessages.ts
│   ├── useBookingStatus.ts
│   ├── useProviderSearch.ts
│   └── useAuth.ts
│
├── store/                        # Zustand stores
│   ├── bookingStore.ts
│   └── authStore.ts
│
├── supabase/
│   ├── migrations/               # SQL migrations
│   │   ├── 001_profiles.sql
│   │   ├── 002_categories.sql
│   │   ├── 003_bookings.sql
│   │   ├── 004_messages.sql
│   │   └── 005_reviews.sql
│   └── functions/                # Edge functions
│       ├── booking-engine/
│       ├── payment-handler/
│       ├── notification-sender/
│       └── search-ranking/
│
├── public/
│   └── categories/               # SVG category icons (optional custom)
│
├── middleware.ts
├── next.config.ts
├── tailwind.config.ts
├── vercel.json
└── package.json
```

---

## 12. Phase Roadmap

### Phase 1 — MVP (Weeks 1–6)

- [ ] Project scaffold (Next.js 14 + Supabase + Tailwind + shadcn)
- [ ] Supabase schema: profiles, categories, provider_services, bookings
- [ ] Landing page (exact Yoojo layout: hero, category icons, provider cards)
- [ ] Auth: register/login (email + Google OAuth)
- [ ] Provider onboarding flow (multi-step)
- [ ] Client booking flow (multi-step)
- [ ] Basic provider search (category + city filter)
- [ ] Client dashboard (upcoming bookings, status)
- [ ] Provider dashboard (job offers, accept/decline)
- [ ] Stripe Connect integration (payments + payouts)
- [ ] Vercel + Supabase deployment

### Phase 2 — Core Features (Weeks 7–12)

- [ ] In-app messaging (Realtime)
- [ ] Reviews & ratings
- [ ] Availability calendar (provider side)
- [ ] Mapbox provider search map view
- [ ] Email notifications (Resend)
- [ ] SMS notifications (Twilio)
- [ ] Admin dashboard (user management, booking oversight)
- [ ] Provider portfolio + photo uploads

### Phase 3 — Growth Features (Weeks 13–20)

- [ ] Pass Sérénité subscription (Stripe Billing)
- [ ] Recurring bookings
- [ ] Mobile-first PWA
- [ ] Advanced search ranking algorithm
- [ ] Provider verification workflow (ID upload + manual review)
- [ ] Dispute resolution system
- [ ] SEO optimization (dynamic sitemap, meta, structured data)
- [ ] Analytics dashboard (admin + provider earnings charts)
- [ ] Referral program

### Phase 4 — Scale (Weeks 21+)

- [ ] React Native mobile app (Expo)
- [ ] Multi-language support (i18n)
- [ ] Insurance API integration
- [ ] Background check integration (for providers)
- [ ] Dynamic pricing engine
- [ ] Provider co-op / team accounts

---

## 13. Environment Variables

```env
# .env.local

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1...

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_CONNECT_CLIENT_ID=ca_xxx

# Email (Resend)
RESEND_API_KEY=re_xxx
RESEND_FROM_EMAIL=noreply@eloo.fr

# SMS (Twilio)
TWILIO_ACCOUNT_SID=ACxxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_PHONE_NUMBER=+33xxxxxxxxx

# Maps (Mapbox)
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1Ijoixx...

# App
NEXT_PUBLIC_APP_URL=https://eloo.fr
NEXT_PUBLIC_APP_NAME=Eloo

# Platform Fee (%)
PLATFORM_FEE_PERCENT=15
```

---

## Quick Start

```bash
# Clone and install
git clone https://github.com/your-org/eloo.git
cd eloo
npm install

# Set up environment
cp .env.example .env.local
# Fill in your Supabase + Stripe keys

# Run Supabase locally
supabase start

# Push migrations
supabase db push

# Seed categories
npx tsx scripts/seed-categories.ts

# Start development
npm run dev
```

---

## Key Decisions Summary

| Decision | Choice | Reason |
|----------|--------|--------|
| Framework | Next.js 14 App Router | RSC performance, Vercel-native |
| Database | Supabase PostgreSQL | Built-in auth, realtime, storage |
| Backend logic | Supabase Edge Functions (Deno) | Low latency, co-located with DB |
| API routes | Next.js API Routes (Node.js) | Webhooks, server actions |
| Payments | Stripe Connect | Industry standard for marketplaces |
| Auth | Supabase Auth | Seamlessly integrated with DB/RLS |
| Real-time | Supabase Realtime | Native to Supabase, no extra service |
| Maps | Mapbox | Better UX than Google Maps for France |
| Email | Resend | Simple API, high deliverability |
| Deployment | Vercel + Supabase Cloud | Zero-config, globally distributed |
| Icons | Lucide React | Matches Yoojo's icon style, tree-shakeable |
| Styling | Tailwind + shadcn/ui | Rapid development, Yoojo-style components |

---

*This PRD is the single source of truth for the Eloo platform build. Update this document as decisions evolve.*# anyjob
