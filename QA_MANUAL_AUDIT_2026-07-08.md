# AnyJob Manual QA Audit - 2026-07-08

## Scope

Manual browser QA on `http://localhost:3000` using the in-app browser. Payment card entry and real external payments are out of scope unless explicitly requested. File uploads are tested only where they are required to progress, using local/test assets where available.

## Environment

- App URL: `http://localhost:3000`
- Browser: Codex in-app browser
- Current branch: `main`
- QA status: Manual pass complete; priority fixes applied/retested with remaining defects listed

## Phase Checklist

| Phase | Area | Status | Notes |
| --- | --- | --- | --- |
| 0 | Server health, console errors, route inventory | Done | Server live on port 3000; home loads with no console errors. Route inventory collected from `src/app` and `src/app/api`. |
| 1 | Public home, search, categories, provider discovery | Done | Home search, public `/search`, emergency section, provider cards/profile, and category pages tested. |
| 2 | Auth, forgot/reset, signup/login/logout | Done | Public login/logout/admin-login/account switching tested; forgot password is failing. Full new-user signup was not completed in this pass to avoid creating more live Supabase accounts. |
| 3 | Buyer job request flow | Done | Questionnaire request creation works; admin approval works; buyer request detail now renders through the server detail API. |
| 4 | Provider workspace | Done | Gig builder walked through overview/packages/media/FAQ/requirements/review/publish; provider jobs, shifts, profile, messages, notifications, earnings, reviews, badges, analytics, completed, pending, and help swept. |
| 5 | Business workspace | Done | Business registration, admin approval gate, worker pool, dashboard unlock, and business posting were tested; date submit bug is fixed. |
| 6 | Admin console | Done | Admin login, route protection, business approval, users, providers, businesses, jobs, KYC, payments, notifications, settings, reports, analytics, badges, blog, support, and history swept. |
| 7 | Notifications and email hooks | Done | Forgot password email fails; admin notifications page reads zero live records; provider notifications reads empty state. Edge-function delivery was not deployed/testable from browser. |
| 8 | Scroll/responsive/accessibility sanity | Done | Desktop and mobile-width scroll checks on public and admin pages; provider profile document scrolling is fixed. |
| 9 | Regression retest of findings | Done | Retested earlier areas: login page scroll now works, emergency section uses `tel:` links, provider booking starts at questionnaire step 1, approved business buttons show suspend/document actions. Priority fixes for search, request details, gig persistence, provider profile scroll, business posting, public provider contact gating, and browse title mapping were applied and browser-retested. |

## Findings

| ID | Severity | Area | Status | Repro / Evidence | Expected | Actual |
| --- | --- | --- | --- | --- | --- | --- |
| QA-001 | Medium | Home search | Fixed | Retested on `/`: typing `cleaning` and clicking `Search` routes to `/questionnaire?category=menage`; typing `zzzz no category qa` and pressing Enter routes to `/questionnaire?category=custom&custom_query=...`. | Search button/Enter should route to the best matching category or custom request flow. | Fixed by selecting the first suggestion on Enter when suggestions exist and preserving custom flow when none exist. |
| QA-002 | High | Buyer request detail | Fixed | Retested `/dashboard/requests/08e1765f-dabc-415d-bcf0-7fad1e047a6c`: request heading, service details, description, status sections, bids, images, and actions render instead of a blank shell. | Request detail page should open with the selected request, offers, status timeline, and actions. | Fixed by loading request details through a server API with owner/admin access checks. |
| QA-003 | Low | Category images/performance | Fixed | Retested `/demenagement?subcategory=help-moving-demenagement&qa_sizes=...`: moving hero, promo banner, and moving service card images load with non-zero natural widths and explicit `sizes` attributes. | Fill images should define `sizes` for responsive loading/performance. | Fixed. |
| QA-004 | High | Forgot password / email | Partially fixed / deploy required | Retested `/forgot-password?forgot_qa=...`: submitting `shift-provider-1780819482633@anyjob.test` now shows a generic accepted message and no hard failure. Supabase connector shows zero deployed Edge Functions, and private auth/email tables are not present yet. | User should receive a generic success state and email if account exists. | User-facing failure is fixed; actual email delivery still requires applying `20260708_add_tenant_email_auth_notifications.sql` and deploying the Supabase Edge Functions. |
| QA-005 | High | Provider gig builder | Fixed | Retested `/pro/services`: published `QA published gig 1783512307798`, reloaded the page, and verified it remained in `Your public gigs`. Reopened Review after reload and confirmed the full preview retained title, description, packages, FAQ, requirements, and `HANDYMAN` category. | Publishing a gig should persist it to the provider profile and reload from storage/backend. | Fixed; category was also persisted in `gig_details` instead of falling back to `AnyJob service`. |
| QA-006 | Medium | Provider gig builder accessibility | Fixed | FAQ and requirement remove icon buttons now include `aria-label` and `title` such as `Remove FAQ 1` and `Remove requirement 1`. | Icon-only controls should have accessible labels such as `Remove requirement 1`. | Fixed. |
| QA-007 | Low | Header language menu assets | Not reproduced | Current `Header.tsx` does not render the old flag image menu; only logo images are rendered by the app header. The remaining language widget is external GTranslate configuration. | All rendered flag images should load or hidden dormant menu assets should not render broken images. | No app-rendered broken flag images found in the current code path. |
| QA-008 | Medium | Provider job filters | Fixed | Retested `/pro/jobs?filter_qa=...`: selecting `Cleaning` shows `6 live jobs`, all rendered job cards are Cleaning, and previous Handyman/Moving cards are absent. | Category filter should exclude non-cleaning jobs when `Cleaning` is selected. | Fixed with a defensive client-side category/city filter on API results. |
| QA-009 | Medium | Provider bid form validation | Fixed | Retested `/pro/jobs/10f1b87e-7867-41c1-96e7-e8f3d7e090d5?bid_validation_qa=...`: entering `20` on a `€50 - 100` job shows `Your bid is below the client budget minimum of €50.` and does not show payout math. | Empty and out-of-budget bids should show clear inline validation before submission/calculation. | Fixed on the full job page and shared browse bid form. |
| QA-010 | Medium | Provider job detail content | Data issue | Supabase row `10f1b87e-7867-41c1-96e7-e8f3d7e090d5` currently has `job_description: "............................."` and no meaningful title/description fields. The UI correctly falls back to subcategory title `Petite Reparation` and `No description provided`. | Job details should display the buyer-entered title and description consistently with list/admin data. | Not a recoverable UI issue for this row unless the source data is corrected/backfilled. |
| QA-011 | High | Provider profile scrolling | Fixed | Retested `/pro/profile?fix_qa=1`: document scroll height exceeds viewport, `main` overflow is visible, and wheel scrolling moved `window.scrollY` to reveal lower profile sections. | Profile page should scroll naturally so provider can reach and edit all fields. | Fixed by removing the dashboard main internal scroll trap. |
| QA-012 | High | Provider pending jobs | Fixed | Retested `/pro/pending?live_pending_qa=...`: old Edinburgh/Sarah/GBP sample jobs are gone. Page loads accepted provider bids from Supabase and shows a live empty state when none exist. | Pending jobs/actions should come from live accepted bookings and persist status/contact actions. | Fixed by replacing seeded local state with `/api/bids?role=provider` data and removing fake in-memory actions. |
| QA-013 | Medium | Provider analytics/demo data | Fixed | Retested `/pro/analytics?live_analytics_qa=...`: old `18` jobs, `94%`, `£420`, and Oct-Mar demo chart are gone. Page shows Supabase-backed completed jobs, reviews, badges, and clear readiness notes. | Analytics should be live data or clearly marked unavailable until implemented. | Fixed by replacing hard-coded demo metrics with `/api/provider/dashboard-data` metrics. |
| QA-014 | Medium | Business registration verification UI | Fixed | Code-retouched and build-verified: each verification slot now has a document-specific link label, placeholder, upload text, and `aria-label` instead of six identical `Document link`/`Upload document` controls. Existing approved-business sessions correctly bypass the registration form. | Verification should show one clear document link/upload pair or explicitly label multiple document slots. | Fixed. |
| QA-015 | High | Business job posting | Fixed | Retested `/dashboard/business/jobs/new`: submitted a real browser-filled business post. Supabase row `baafb87a-6591-431b-8519-89a4f8421278` saved title `Healthcare support worker`, description text, dates, rates, and `status: submitted`. | Approved business should be able to post a day-wage/shift job after valid date/time entry. | Fixed by reading actual form values on submit and creating submitted posts instead of hidden drafts. |
| QA-016 | High | Public provider profile contact gating | Fixed | Retested `/providers/b56e1c60-df3e-4699-a16b-b83e2a2c32e0?fix_qa=1`: public contact/message links are gone; package actions only continue into the questionnaire/request flow. | Public provider profiles should only start the job/questionnaire flow; direct messaging should not be exposed before a proper booking/accepted flow. | Fixed. |
| QA-017 | Medium | Public job browse title mapping | Fixed | Retested `/tasks?fix_qa=1`: card and detail heading display buyer-entered `QA cleaning other request`; details show the buyer description separately instead of using category/subcategory as the primary title. | Browse cards and selected job heading should use the buyer-entered job title first, with category/subcategory as metadata. | Fixed by splitting stored buyer title/description before mapping public tasks. |

## Manual Pass Log

### Public / Buyer

- `/` home loaded and scrolled on desktop/mobile. Hero suggestion selection, typed search click, typed search Enter, and unknown/custom search Enter now route to the correct questionnaire flow.
- `/search` loaded the restored inspiration-style page. Emergency section now shows working `tel:+448001234567` links and all emergency images loaded.
- `/tasks` loaded live jobs and business work posts. Filters/dropdowns render; approved QA job appeared after admin approval.
- Category pages loaded, including the previously broken moving images. Next image `sizes` warnings remain.
- Public provider profile loaded full Fiverr-style profile/package/review content. Booking `Continue` correctly opens `/questionnaire` at step 1, but public contact links remain.
- `/login` and `/forgot-password` scroll normally now. Forgot password submit still fails to send.

### Buyer Dashboard

- Questionnaire request creation completed through category, subcategory `Other`, details, address, schedule, budget, and account/login path.
- Created request `08e1765f-dabc-415d-bcf0-7fad1e047a6c` appeared in `/dashboard/requests`.
- Request detail route now renders the selected request through `/api/dashboard/requests/[id]`.

### Provider Workspace

- `/pro/services` wizard: overview, packages, local media inputs, FAQ cap, requirement cap, review preview, and publish action tested. Published gigs persist after reload, including category/package/FAQ/requirement preview data.
- `/pro/jobs`: day-to-day tab, work-shift tab, city/category filters, job detail, and bid submission tested. Valid bid persisted; invalid bid validation is weak.
- `/pro/shifts`: shift jobs visible for shift worker profile; application action changed the card state.
- `/pro/profile`: edit/save controls work for visible fields, and the provider profile now scrolls with the document so lower sections are reachable.
- `/pro/messages`, `/pro/notifications`, `/pro/earnings`, `/pro/reviews`, `/pro/badges`, `/pro/completed`, `/pro/pending`, `/pro/analytics`, and `/pro/help` swept. Pending and analytics are demo/static-looking.

### Business Workspace

- `/register-business` completed with a QA business using a document URL; pending gate worked.
- Admin approved the QA business; `/dashboard/business` unlocked posting and worker pool.
- `/dashboard/business/workers` loaded matching healthcare shift workers after a longer wait.
- `/dashboard/business/jobs/new` now submits approved business day-wage/shift posts with retained date/time values and `submitted` status.

### Admin Console

- `/admin` is protected and requires `/admin-login`. Admin login succeeded; logout returned to admin login.
- `/admin/businesses`: search/status controls work; approved businesses now show suspend/request-document actions, not approve.
- `/admin/jobs`: tabs, search, row action menu, view, and approve were tested on the QA-created request. Direct approve moved the QA request from pending to live and persisted after reload.
- `/admin/users`: search/reset work; row `Open` expands live buyer details after a longer wait.
- `/admin/providers`: search/filter works; approved provider rows show suspend/request-docs actions.
- `/admin/kyc`, `/admin/payments`, `/admin/notifications`, `/admin/settings`, `/admin/reports`, `/admin/analytics`, `/admin/badges`, `/admin/blog`, `/admin/support`, and `/admin/history` all loaded. Settings save without edits persisted and logged. Payment buttons show no-record messages when no payment data exists. History shows audit records for admin actions.

### Not Fully Covered

- Real payment card entry/Stripe confirmation was intentionally not tested.
- Actual OS file picker uploads were not completed from this automation environment. File inputs were verified in the UI for business documents, provider media/KYC, and gig media, but Cloudinary binary upload should still be tested hands-on in a browser with a chosen local file.
- External email delivery and Supabase Edge Functions were not deploy-tested from browser; forgot password UI confirms the current local flow fails.

## Accounts / Test Data

| Role | Email | Source | Status |
| --- | --- | --- | --- |
| Admin | `admin@anyjob.eu` | Previously requested admin account | Verified login/logout/admin access |
| Demo buyer | `demo@anyjob.com` | `/api/test-login` fixture references this account | Not used in this pass |
| Shift provider | `shift-provider-1780819482633@anyjob.test` | Existing seed script reference | Verified provider/business-owner flows |

## Route Inventory

### Public / Buyer Pages

- `/`
- `/search`
- `/tasks`
- `/questionnaire`
- `/login`
- `/register`
- `/signup`
- `/forgot-password`
- `/reset-password`
- `/verify-email`
- `/become-provider`
- `/register-business`
- `/how-it-works`
- `/pricing`
- Category pages: `/menage`, `/bricolage`, `/demenagement`, `/jardinage`, `/informatique`, `/hiver`, `/aide-domicile`, `/animaux`, `/enfants`, `/cours-particuliers`
- Public profile pages: `/providers/[id]`, `/profile/[id]`

### Buyer Dashboard

- `/dashboard`
- `/dashboard/requests`
- `/dashboard/requests/[id]`
- `/dashboard/business`
- `/dashboard/business/jobs/new`
- `/dashboard/business/workers`
- `/dashboard/account`
- `/dashboard/notifications`
- `/dashboard/mail`
- `/dashboard/assistance`
- `/dashboard/help`
- `/dashboard/saved`

### Provider Workspace

- `/pro`
- `/pro/jobs`
- `/pro/jobs/[id]`
- `/pro/shifts`
- `/pro/services`
- `/pro/profile`
- `/pro/messages`
- `/pro/notifications`
- `/pro/earnings`
- `/pro/reviews`
- `/pro/badges`
- `/pro/analytics`
- `/pro/completed`
- `/pro/pending`
- `/pro/help`

### Admin

- `/admin-login`
- `/admin`
- `/admin/users`
- `/admin/providers`
- `/admin/businesses`
- `/admin/jobs`
- `/admin/kyc`
- `/admin/payments`
- `/admin/notifications`
- `/admin/settings`
- `/admin/reports`
- `/admin/analytics`
- `/admin/badges`
- `/admin/blog`
- `/admin/support`
- `/admin/history`

## Retest Log

| Finding ID | Retest Result | Notes |
| --- | --- | --- |
| Login scroll | Pass | `/login` page now has normal document scrolling on desktop. |
| Emergency section | Pass | Emergency actions are direct `tel:` links and no longer enter questionnaire. |
| Provider booking first step | Pass | Public profile `Continue` opens `/questionnaire` at category step 1. |
| Admin approved-business action label | Pass | Approved business rows show suspend/request-document controls instead of approve. |
| QA-003 | Pass | Moving page images have explicit `sizes` and loaded successfully. |
| QA-001 | Pass | Typed hero search click routes known categories; Enter routes both known and custom searches. |
| QA-004 | Partial | Forgot password no longer shows a hard failure; real email delivery is blocked until private-schema migration and Edge Functions are deployed. |
| QA-005 | Pass | Published gig persists after reload and full preview retains saved category/packages/FAQ/requirements. |
| QA-008 | Pass | Cleaning filter renders only Cleaning jobs; Handyman/Moving cards are excluded. |
| QA-009 | Pass | Below-budget bid shows inline error and suppresses fee math. |
| QA-010 | Data issue | The tested row contains only punctuation in `job_description`; needs data correction/backfill, not UI fallback. |
| QA-012 | Pass | Pending jobs page now uses live accepted bid data and no static sample jobs/actions. |
| QA-013 | Pass | Analytics page now uses live Supabase metrics and no static demo numbers/months. |
| QA-014 | Pass | Business document controls are document-specific in labels/placeholders/ARIA. |
| QA-015 | Pass | Business day-wage/shift post saved to Supabase with submitted status and retained dates/description. |
| QA-002 | Pass | Request detail page now renders live request details through server API. |
| QA-006 | Pass | Gig remove controls now have accessible labels. |
| QA-011 | Pass | Provider profile scrolls with the document. |
| QA-016 | Pass | Public provider profile no longer exposes direct contact links. |
| QA-017 | Pass | Public browse cards/headings use buyer-entered title. |
