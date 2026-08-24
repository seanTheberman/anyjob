# AnyJob Mobile QA Record

Last completed: 1 August 2026

This record covers the Expo SDK 57 mobile client against the shared AnyJob Supabase project and local Next.js API. Admin functionality remains web-only by product design.

## Release Gate

| Check | Result |
| --- | --- |
| Mobile TypeScript | Pass |
| Expo ESLint | Pass, zero errors |
| Expo Doctor | Pass, 20/20 |
| React Native Web production export | Pass |
| Shared Next.js TypeScript | Pass |
| Shared Next.js production build | Pass, 120 routes |
| Phone viewport, 390 x 844 | Pass, no horizontal overflow or off-screen buttons |
| Desktop viewport, 1280 x 800 | Pass, no horizontal overflow or off-screen buttons |
| Browser runtime errors | None across the tested route matrix |

The production web artifact is generated in `dist/` by `npm run build:web`.

## Manual End-to-End Timelines

### Buyer service order

1. Signed in as an approved buyer.
2. Posted a service request with schedule, location, scope, and budget.
3. Confirmed the approved request appeared in the provider marketplace.
4. Signed in as an approved provider and submitted a EUR 155 quote.
5. Signed back in as the buyer and accepted the quote.
6. Completed the fake payment without entering a card.
7. Exchanged messages in both directions and confirmed unread state cleared on open.
8. Started and completed the service request.
9. Buyer reviewed provider with five stars.
10. Provider reviewed buyer with five stars.
11. Confirmed both review identities, summaries, completed history, earnings, and milestone counts.

### Business shift order

1. Used an approved business attached to the buyer identity.
2. Posted a shift with role, niche, location, schedule, headcount, and hourly rate.
3. Signed in as a shift-enabled provider and applied.
4. Signed in as the business, accepted the application, and completed dummy escrow funding.
5. Completed the shift and confirmed the provider wallet released EUR 120.
6. Business reviewed worker with five stars.
7. Worker reviewed business with five stars.
8. Confirmed the completed shift appears in provider Completed and Earnings.

## Functional Matrix

| Area | Scenarios verified |
| --- | --- |
| Authentication | Buyer/provider registration, sign-in, sign-out, session role switching, malformed email validation, invalid credentials, recovery request validation, recovery-link guard |
| Buyer | Home, provider search, saved provider, public profile, request creation/list/detail, quote acceptance, dummy payment, start, complete, received/given reviews |
| Provider | Live jobs, quote submission, pending work, completed services/shifts, service gig create/edit/delete, profile, verification, analytics, earnings, plans |
| Business | Approved workspace, shift post, worker search, applications, accept/reject states, dummy escrow, completion, two-way review |
| Messaging | Conversation discovery, real participant names, two-way send, unread count, read transition, chronological display, automatic newest-message scrolling |
| Trust | Ratings hidden when absent, public rating counts, two-way review identities, admin-approved KYC, exact badge progress, approved-provider Verified ID |
| Notifications | Unread display, timestamps, individual/read-all payloads |
| Support | Ticket creation, reply, message history |
| Uploads | Real PNG upload to Cloudinary, Supabase image record, deletion cleanup, invalid MIME rejection, identity upload preserving approved KYC |
| Plans | Provider and buyer dummy activation without Stripe, active-plan response, Current plan UI, production Stripe branch retained |
| Security | Persistent auth, token refresh configuration, native SecureStore, optional biometric foreground lock |

## Responsive Route Matrix

Provider routes checked at phone and desktop widths:

`/`, `/explore`, `/provider/completed`, `/reviews`, `/milestones`, `/plans`, `/inbox`, `/account`

Buyer/business routes checked at phone and desktop widths:

`/`, `/requests`, `/business`, `/business/applications`, `/business/workers`, `/reviews`, `/milestones`, `/plans`, `/inbox`, `/notifications`, `/support`, `/account`

Every route reported zero document overflow, zero horizontally off-screen buttons, and no runtime errors.

## Defects Corrected During QA

- Prevented account data and role state from leaking between buyer and provider sessions.
- Prevented authenticated API responses from being reused as stale shared cache entries.
- Restored service job titles and descriptions in the provider marketplace.
- Fixed shift application payload naming.
- Fixed quote totals in buyer request cards.
- Added accessible chat send and review star controls.
- Fixed post-review navigation.
- Corrected a tenfold shift payment calculation error.
- Added completed service requests and shifts to provider history and analytics.
- Corrected review counterpart names, including business identities.
- Fixed notification read payloads and field mapping.
- Returned safe public provider data and active service gigs.
- Included service and shift reviews in provider ratings and milestones.
- Made admin approval authoritative for KYC and Verified ID.
- Prevented identity uploads from downgrading approved KYC.
- Added current-plan reporting and local dummy subscription activation.
- Added inline auth errors, registration success state, and a complete password recovery screen.
- Added the missing `react-native-svg` peer dependency required by native Lucide icons.

## Test Data Hygiene

Disposable registration identities and temporary upload records were deleted after verification. The two completed workflow records remain in the test project as auditable service and shift history. No secret or service-role credential is included in the mobile app.

## Remaining Device Release Checks

React Native Web is fully exercised. Before App Store or Play Store submission, run the same smoke matrix on physical iOS and Android devices to confirm OS permission dialogs, biometric prompts, camera/photo-library pickers, notification permissions, and recovery universal links. These behaviors cannot be fully validated in a browser export.

`npm audit --omit=dev` currently reports a moderate transitive `uuid` advisory through Expo's `xcode` build tooling. Expo Doctor passes, and npm's proposed forced fix would downgrade Expo to SDK 46, so no breaking forced resolution was applied.

## Premium UI and Location Pass

- Browser-verified the buyer home at phone width in both Light and Dark themes.
- Verified the two-row popular-service icon grid, photo hero, provider portfolio cards, persistent appearance selector, app header, and themed tab bar.
- Verified provider discovery renders real `heroImage` media when available and category-photo fallbacks otherwise.
- Verified the task form exposes an explicit **Use current area** action and clearly labels the seller-visible approximate area.
- Android fine-location permission is blocked; the app requests coarse permission only.
- Mobile coordinates are rounded on-device before submission, and the backend stores only coarse coordinates for this flow.
- Re-ran TypeScript, ESLint, Expo Doctor (20/20), root TypeScript, and a production React Native Web export.
