# AnyJob Deep Manual QA Audit - 2026-07-11

## Scope

Manual browser QA on `http://localhost:3000` covering buyer, provider, business, contractor/agency, admin, KYC, uploads, support tickets, notifications, approvals, disapprovals, document requests, job/order, quote, hire, and chat flows.

Payment card entry is out of scope unless explicitly requested. Test/dummy payment records are in scope.

## Environment

- App URL: `http://localhost:3000`
- Browser: Codex in-app browser
- Dev server: running on port `3000`
- Report status: In progress

## Phase Checklist

| Phase | Area | Status | Notes |
| --- | --- | --- | --- |
| 0 | Environment, auth/session, route health | In progress |  |
| 1 | Buyer public request/order flow | Pending |  |
| 2 | Buyer dashboard, KYC, notifications, support ticket | Pending |  |
| 3 | Provider registration/workspace, KYC/upload, quote, chat | Pending |  |
| 4 | Shift provider work-shift flow | Pending |  |
| 5 | Business hiring flow: registration, admin approval, post work, hire | Pending |  |
| 6 | Contractor/agency service-provider flow | Pending |  |
| 7 | Admin: overview, users, providers, businesses, jobs, KYC, payments, notifications, badges, settings, support, history | Pending |  |
| 8 | Cross-role notifications/email outbox and document requests | Pending |  |
| 9 | Responsive/scroll/accessibility sanity | Pending |  |
| 10 | Regression retest of high-risk findings | Pending |  |

## Findings

| ID | Severity | Area | Status | Evidence / Repro | Expected | Actual |
| --- | --- | --- | --- | --- | --- | --- |

## Manual Pass Log

### Phase 0 - Environment

- Started with existing local server on port `3000`.
- Ran `npm run test:e2e` as a baseline before manual testing.
- Baseline result: 9 passed, 3 failed, 4 skipped.
- Automated failures observed:
  - Public desktop navigation: clicking header `Find a Provider` did not navigate from `/` to `/search` in `tests/e2e/public-flows.spec.ts`.
  - Admin provider approval API returned non-OK for the temporary provider in `tests/e2e/admin-flows.spec.ts`.
  - Mobile admin e2e setup failed because the test provider seed reused a duplicate `siret` value.

## Automated Baseline Failures

| ID | Severity | Area | Status | Evidence / Repro | Expected | Actual |
| --- | --- | --- | --- | --- | --- | --- |
| QA-0711-001 | Medium | Public navigation | Open | `npm run test:e2e`, desktop public flow `search catalogue and login pages are reachable from navigation`. | Header `Find a Provider` should route to `/search`. | Test stayed on `/`; likely header click target or session/header variant regression. |
| QA-0711-002 | High | Admin provider approval | Open | `npm run test:e2e`, admin flow direct POST to `/api/admin/providers/kyc` with `{ action: "approve" }`. | Approval endpoint should return OK and set provider `status=approved`. | Endpoint returned non-OK for the seeded provider. Needs manual/API diagnosis. |
| QA-0711-003 | Low | E2E fixture | Open | `npm run test:e2e`, mobile admin setup. | E2E provider fixture should be unique per run. | Fixture reuses `siret=99999999999991`, causing duplicate key failure. |

## Fix / Retest Notes - Buyer KYC Visibility and Provider Quote Flow

- Updated buyer KYC evaluation so an admin-approved/manual override buyer is treated as fully verified even when separate front/back/selfie upload records are not present.
- Updated provider job feed `/api/jobs` so only submitted jobs from verified/approved buyers are visible to providers.
- Verified manually in the in-app browser with provider account `qa-seller-real-1780645202495@example.com`.
- Before buyer approval, provider quote submission was blocked by buyer KYC as expected.
- After setting the QA buyer profile admin override to approved, provider job feed changed from 13 visible jobs to 3 verified-buyer jobs, and the QA job showed `Verified buyer`.
- Submitted a provider quote on `/pro/jobs/cff68f50-fea3-469c-aa97-e6195786b442`.
- UI result: `Offers 1`, `Offer sent`, provider quote `€150.00`, buyer sees `€180.00`, status `pending`.
- DB result:
  - `bids.id = 8364bf90-28d2-4a9f-ad62-cc88354f6947`
  - `provider_terms_acceptances.id = 48f0d7e8-37dc-48c1-8839-5bd0bc004b89`
  - Terms saved provider email, timestamp, IP, and bid link.
  - `eloo_notifications` created `Provider terms accepted`.
  - `email_outbox.id = 04341a9c-b28d-4446-bdcc-c9052c6574f8`, `event_key = legal.provider_terms_accepted`, status `pending`.
- Added app-side fallback queueing for provider terms acceptance email because the live Supabase project returns `404 Requested function was not found` for `legal-notifications`.
- Production build verification: `npm run build` passed.

## Remaining Environment / Database Issue

| ID | Severity | Area | Status | Evidence / Repro | Expected | Actual |
| --- | --- | --- | --- | --- | --- | --- |
| QA-0711-004 | High | Live Supabase database trigger | Open | Updating `buyers.kyc_status` for `82cec8f9-ff1e-4225-a286-751da35ae86e` failed. | Admin buyer approval should update buyer KYC row cleanly. | Supabase returned `column reference "target_role" is ambiguous`. Profile-level override still works with the patched app logic, but the database function/trigger needs the existing target-role ambiguity migration applied to remote. |
| QA-0711-005 | Medium | Supabase edge functions | Mitigated in app | Direct POST to `/functions/v1/legal-notifications` returned `404 Requested function was not found`. | Provider terms acceptance should notify via deployed legal notification edge function. | The route now queues fallback `eloo_notifications` and `email_outbox` records, but the edge function should still be deployed for normal centralized notification processing. |

## Fix / Retest Notes - Provider Rating and Completed Job Counts

- Removed stale provider trust fallbacks from the job-detail offer API, bid API, provider workspace profile, and public provider marketplace/profile mappings.
- Provider rating now comes from public `eloo_reviews` rows that are linked to a real `booking_id`; orphan/seeded reviews are ignored.
- Provider job count now comes from real completed work records only: completed accepted service-inquiry bids, completed bookings, and completed shift applications.
- Provider completion rate now appears only when the provider has assigned work history.
- Regression case tested: `/pro/jobs/cff68f50-fea3-469c-aa97-e6195786b442`.
- API result for `QAReal Seller`: `rating=0`, `reviewCount=0`, `totalJobs=0`, `completionRate=0`.
- In-app browser result: offer card shows `New` and `No completed jobs yet`; it no longer shows `7 previous jobs`, seeded `5.0 (1)`, or `100% completion rate`.
- Production build verification: `npm run build` passed.
