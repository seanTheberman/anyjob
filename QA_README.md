# AnyJob QA Findings

Date: 2026-06-05
Environment: local Next.js dev server on `http://127.0.0.1:3000`, Supabase project `egtpwmzzjvyptmswddip`.

Scope: manual in-app browser QA of provider registration from `/become-provider`, provider KYC/admin approval, provider job browsing/bidding, client bid acceptance, and chat connection. Payments were not tested beyond the in-app accept action. Deep image upload was excluded; URL-backed document fields were used for KYC.

## Manual Flow Tested

- Started at `/become-provider`.
- Tested area/category earning calculator, FAQ expansion, top and bottom `Get started` CTAs, and app-download controls.
- Registered a new provider through `/seller-register` with real UI form steps:
  - Personal info.
  - Address/services.
  - Professional docs using ID, selfie video, and insurance document URLs.
  - Terms acceptance and submit.
- Verified Supabase rows:
  - `sellers`: provider created with ID, selfie, insurance, `status=pending`, `kyc_submitted_at`.
  - `eloo_profiles`: matching provider profile created.
- Opened `/pro` as the new provider and verified KYC gate before admin approval.
- Opened `/admin/providers`, filtered provider records, approved the provider through the admin UI, and verified Supabase approval flags.
- Returned to `/pro`, verified KYC gate disappeared, tested provider job filters, opened a job, and submitted a bid.
- Logged in through `/login` as the client account `johntest@gmail.com`, opened the request detail, accepted the provider bid, opened chat, sent a message, and verified the provider could see it in `/pro/messages`.

## Issues Found And Fixed

- Provider registration birth date validation rejected a valid `1990-01-01` value because the regex looked for literal `\d`; fixed the regex.
- Seller registration collected only one identity document while admin required ID, selfie/video, and insurance evidence; added URL-backed selfie and insurance document fields and persisted them to `sellers`.
- Seller registration created `sellers` data but did not fully align provider profile/KYC state; fixed `register-seller` API to create/update `eloo_profiles`.
- Admin approval marked seller status approved but did not set `email_verified`, `phone_verified`, or profile `kyc_status=approved`, leaving approved providers blocked from bidding; fixed admin KYC mutation.
- Provider job search/filter UI changed inputs but rendered the full job list; implemented actual keyword, category, budget, city, state, and urgency filtering plus an empty state.
- Provider job cards showed dangling commas/bullets for missing state/distance; fixed location rendering.
- Bottom `/become-provider` `Get started` CTA was a dead button; wired it to `/seller-register`.
- Provider page App Store/Google Play buttons were silent dead buttons; changed them to explicit disabled unavailable-in-test-build controls.
- Bid acceptance created a second active conversation even though bid submission already created one; fixed accept logic to reuse the existing bid conversation and avoid duplicate auto-messages.

## Retest Results

- PASS: `/become-provider` top `Get started` routes to `/seller-register`.
- PASS: `/become-provider` bottom `Get started` routes to `/seller-register`.
- PASS: app-download buttons are intentionally disabled instead of silently doing nothing.
- PASS: seller registration submits from the UI and redirects to `/pro`.
- PASS: seller/provider Supabase records are created with KYC document URLs.
- PASS: admin providers page shows the registered provider as `Needs review` with docs `Submitted`.
- PASS: admin `Approve` updates provider to `Approved` / `Active`.
- PASS: approved provider no longer sees the KYC blocking banner.
- PASS: approved provider can submit a bid.
- PASS: client request detail shows the bid and accepts it without leaving for external payment.
- PASS: accepted bid updates request status to `Bid Accepted`, bid status to `Accepted`, and exposes chat.
- PASS: client chat message appears in provider `/pro/messages`.
- PASS: provider keyword filter narrows the job list.
- PASS: provider city + keyword filter can show `No jobs match the current filters`.
- PASS: provider `Clear Filters` restores the list.
- PASS: automated checks: `npm run lint` exits 0 with 121 warnings, `npm run build` passes, `npm run test:e2e` passes 6/6, and `npm audit --audit-level=moderate` reports 0 vulnerabilities.

## Remaining Issues

- `/become-provider` earning calculator category dropdown can show `Home Cleaning` while the displayed rate stays at the default `€45` in the in-app browser test path. This still needs a product/UI fix before release.
- Admin provider search does not match by provider email because the table row does not render email. Searching by provider name works.
- Chat duplicates from old QA data were cleaned for the tested bid, and the endpoint is patched, but existing duplicate rows from older data may still appear until cleaned.
- Supabase magic-link email behavior remains dependent on Supabase Auth template/configuration.
- Payment flow and direct image upload flow remain intentionally untested.

## Test Data

- Provider: `qa-seller-real-1780645202495@example.com`.
- Client: `johntest@gmail.com`.
- Request: `be16d5e8-eb31-4c5e-b8e3-79c168f98350`.
- Bid: `e49ae7fc-7fb1-40ad-bc9d-fead9280096b`.
