# AnyJob Shift Work Stream

## Purpose

This document describes how AnyJob can add an integrated shift-work experience, inspired by platforms such as WrkWrk, while keeping one AnyJob account, one login, and one connected marketplace.

The goal is not to copy WrkWrk or create a second platform. The goal is to let the same AnyJob user account choose additional capabilities:

- Register as a business and request shift/day-wage workers.
- Register as a provider and choose freelance work, shift work, or both where allowed.
- Keep shift workers inside the same AnyJob trust, KYC, profile, messaging, review, and admin system.

## Research Summary

Public WrkWrk pages position the product as an on-demand staffing platform that connects businesses with temporary workers in a few clicks. Their public site includes shift search by location and skill, client registration, worker registration, and industry coverage across hospitality, retail, administration, and industrial work.

WrkWrk's worker-facing messaging emphasizes flexible work, no forced commitment, direct bank payment within 14 days after a job, and the ability for workers to search for shifts in their area. Their FAQ says businesses can list shift work for trained and vetted workers with as little as 3 hours' notice, and that shifts are shown only to staff with relevant experience. App store descriptions and reviews also mention shift search, applying for jobs, clock-in and clock-out, and reviewing managers or companies after a shift.

Sources reviewed:

- https://wrkwrk.ie/
- https://wrkwrk.ie/get-work/
- https://wrkwrk.ie/business/
- https://wrkwrk.ie/faq/
- https://apps.apple.com/ie/app/wrkwrk-wrkstar/id1523300296

## Strategic Fit For AnyJob

AnyJob currently behaves like a service marketplace: a customer posts a need, providers bid or respond, and admin can review users, jobs, reports, and KYC status. Shift work should be added as an integrated marketplace capability, not as a separate login or separate platform.

The distinction matters:

- Home services are usually task/outcome based.
- Shift work is time, role, location, attendance, and reliability based.
- Home-service clients usually choose one provider for a scoped task.
- Shift-work businesses may need multiple workers for the same role and date.
- Home-service completion is confirmed by customer/provider outcome.
- Shift completion needs check-in, check-out, no-show handling, timesheet review, and potentially payroll export.

The integrated account rule:

- A customer account can register as a business.
- A provider account can choose freelance, shift work, or both.
- A shift worker can still view and accept freelance jobs if they want.
- A freelance-only provider cannot see business shift jobs unless they opt into shift work.
- Businesses must label each post as freelance/service work, part-time day-wage work, or longer-duration shift work.

## Product Positioning

Recommended public label: **Shift Work**

Recommended tagline: **Flexible staff for businesses. Local shifts for verified workers.**

Primary navigation:

- Public header tab: `Shift Work`
- Main menu button: `Register as a Business`
- Business CTA after registration: `Post Shift / Day-Wage Work`
- Worker CTA inside provider onboarding: `I Want To Work In Shifts`
- Worker CTA for normal provider onboarding: `I Want To Work Freelance`
- Provider dashboard tab: `Shift Board`
- Customer/business dashboard tab: `Shift Staffing`
- Admin tab: `Shift Ops`

This keeps the existing `Find a Provider`, `Become a Provider`, and service-questionnaire flows clean while allowing one user account to unlock business and shift-worker features.

## Unique AnyJob Angle

AnyJob should not be a generic temp-agency clone. The strongest angle is a unified local labor marketplace with connected modes:

- **Book a service** for household or personal jobs.
- **Register as a business** to request part-time/day-wage workers or longer shift workers.
- **Work freelance** for normal AnyJob jobs.
- **Work in shifts** for business staffing jobs.

Recommended differentiators:

- **Verified local worker graph:** reuse KYC, provider profile, ratings, service history, and admin verification.
- **Shift-ready badges:** workers can earn badges such as Bar, Cleaning Crew, Event Staff, Retail Assistant, Kitchen Porter, Reception, Warehouse, Driver Helper, Childcare Support, and Elder Care Support.
- **Crew Mode:** businesses can request multiple workers for one shift and track fill status per slot.
- **Business-selected worker pool:** businesses can browse eligible shift workers in the correct niche and invite/select individuals directly.
- **Fee preference control:** shift workers see a market-average or business-preferred rate for each niche and can keep it, increase it, or decrease it.
- **Standby list:** workers can opt into urgent shifts within a radius and availability window.
- **Reliability score:** based on accepted shifts, completed shifts, late cancellations, no-shows, ratings, and admin interventions.
- **Two-way reviews:** worker reviews the business/manager, and business reviews the worker.
- **Admin trust layer:** compliance document review, incident handling, dispute notes, and manual override tools.
- **Hybrid matching:** allow both instant claim for eligible workers and business/admin approval for sensitive roles.

## User Roles

### Business

Businesses use the same AnyJob login, then choose `Register as a Business` from the menu. They need to answer business-specific questions, define the type of work they are posting, browse relevant shift-worker profiles, invite/select individuals, manage applicants, fill multiple slots, message assigned workers, and confirm attendance.

Examples:

- Restaurant needs two wait staff on Saturday.
- Event organizer needs six brand ambassadors.
- Cleaning company needs a temporary team member for a commercial site.
- Retail shop needs weekend cover.
- Warehouse needs loading support.
- Hospital needs healthcare support workers, visible only to healthcare-niche providers.

### Worker / Provider

Providers choose their work mode at the beginning of onboarding:

- `I Want To Work Freelance`
- `I Want To Work In Shifts`

Shift workers answer a different question flow focused on skills, niche, availability, preferred shift fee, market-average fee guidance, travel radius, documents, and notification preferences. A shift worker can still see freelance jobs if they want, but a freelance-only provider should not see business shift jobs until they opt into shift work.

### Admin / Operations

Admin needs tools to verify businesses and workers, approve sensitive roles, monitor fill rates, handle no-shows, resolve disputes, review timesheets, and audit marketplace quality.

## Core Web Flows

### 1. Register As A Business

Add a main menu button called `Register as a Business`. This does not create a separate auth system. It upgrades the current user account with a business capability.

Business questions:

- Legal/business name
- Contact person
- Business email and phone
- Billing/contact address
- Venue or site locations
- Industry
- Business type
- Normal hiring categories
- Whether they usually need part-time day-wage workers, long-duration shift workers, or both
- Typical roles needed
- Expected hourly/day rates by role
- Whether they want to browse workers first, post a job first, or do both
- List of required worker slots/individuals for a shift, including role, count, date, time, and requirements
- Verification status
- Optional documents such as company registration or insurance

Admin can approve, reject, suspend, or mark as trusted.

### 2. Provider Onboarding Branch

The `Become a Provider` page should start with a clear choice before normal provider questions:

- `I Want To Work Freelance`
- `I Want To Work In Shifts`

If the provider chooses freelance:

- Continue the current provider/service-category onboarding.
- They can see normal AnyJob freelance/service jobs.
- They cannot see business shift jobs unless they later opt into shift work.

If the provider chooses shift work:

- Ask shift-specific questions immediately.
- Put them into the shift worker pool after the required profile/KYC steps.
- Assign one or more niches based on answers.
- Let them set their preferred fee for each niche.
- Show a recommended market-average or business-preferred fee before they save.
- Let them keep, increase, or decrease the suggested fee.
- Allow them to also see freelance jobs if they opt in.

Shift worker questions:

- Which type of shift work do you want?
- Which industries do you have experience in?
- Which roles can you perform?
- What certificates, training, licenses, or documents do you have?
- What days and times are you available?
- What locations or travel radius can you cover?
- What is your preferred hourly/day fee?
- Are you open to urgent or same-day shifts?
- Are you open to long-duration recurring shifts?
- Do you also want to see freelance AnyJob jobs?

### 3. Post A Business Work Request

Create a dedicated business work wizard that asks the business what kind of work they are posting before showing the rest of the questions.

First question:

- `Freelance service job`
- `Part-time day-wage job`
- `Long-duration shift work`

For shift/day-wage work, the wizard should collect role and staffing requirements instead of using the existing home-service questionnaire.

Required fields:

- Work type: part-time day-wage or long-duration shift work
- Shift role/niche
- Industry
- Location/site
- Date
- Start time
- End time
- Headcount
- Business preferred hourly/day rate
- Whether the business will accept worker fee variations
- Worker requirements
- Uniform or equipment
- Break instructions
- Arrival instructions
- Contact person
- Cancellation policy
- Whether the business wants to browse/select individuals from the worker pool
- Approval mode: instant claim, business approval, or admin approval

Optional fields:

- Multiple repeated dates
- Paid/unpaid break rules
- Minimum rating
- Required badges
- Language requirement
- Experience level
- Gender restriction only when legally justified
- Check-in method: GPS, QR code, manual, or both
- Private notes visible after assignment

### 4. Business Worker Selection

Businesses should have two ways to fill shift/day-wage work:

- Browse eligible shift workers first and invite/select individuals.
- Post a shift/day-wage job and receive matching applicants.

Worker profiles shown to a business should be filtered by the job niche. For example:

- Hospital roles show healthcare-niche workers only.
- Restaurant roles show hospitality workers only.
- Cleaning-company roles show cleaning/commercial-cleaning workers only.
- Retail roles show retail workers only.

Business-facing worker profile cards should show:

- Name and profile photo
- Niche and shift-ready badges
- Availability
- Distance or service area
- Preferred hourly/day fee
- Platform market-average comparison
- Reliability score
- Ratings and completed work
- Compliance status where relevant

### 5. Shift Discovery

Worker shift board should support:

- Location/radius filter
- Date filter
- Skill/role filter
- Pay range
- Start time window
- Duration
- Instant-claim only
- Urgent shifts
- Saved searches
- Eligibility explanations when blocked

Each shift card should show:

- Role
- Business or venue name, unless hidden before assignment
- Approximate location
- Date and time
- Pay rate
- Required badges
- Slots open
- Application status
- Cancellation terms
- Business preferred fee and worker's own fee preference where relevant

### 6. Apply, Claim, Invite, And Assignment

There should be three assignment patterns:

- **Instant claim:** eligible verified workers can take the shift immediately.
- **Apply for approval:** worker applies, business chooses from candidates.
- **Business invite/select:** business chooses from eligible worker pool and invites or selects specific workers.
- **Admin dispatch:** admin assigns or approves workers for high-risk or early-stage marketplace control.

Workers should not be able to claim overlapping shifts.

### 7. Pre-Shift Operations

System actions:

- Send assignment confirmation.
- Send reminder 24 hours before and 2 hours before.
- Ask worker to reconfirm for urgent or high-value shifts.
- Warn business if a shift is under-filled.
- Notify standby workers if an assigned worker cancels.

### 8. Check-In And Check-Out

MVP can start with web check-in, then later add native mobile support.

Recommended methods:

- GPS proximity validation
- Business QR code scan
- Manual business approval fallback
- Admin override with required reason

Tracked events:

- Arrived
- Late arrival
- Started
- Break started
- Break ended
- Finished
- No-show
- Early checkout

### 9. Completion And Timesheet

At shift end:

- Worker submits check-out.
- Business confirms hours.
- System generates a timesheet row.
- Ratings open for both sides.
- Admin can resolve mismatched hours.

Payments can be deferred, but timesheet data should be structured from the start so payroll or payouts can be added later.

## Data Model Proposal

### Existing User/Profile Extensions

Add capability fields to the existing user/profile model instead of creating a separate login:

- `can_post_services`
- `can_work_freelance`
- `can_work_shifts`
- `has_business_profile`
- `business_registration_status`
- `provider_work_mode`: `freelance`, `shift`, or `both`
- `created_at`
- `updated_at`

### `shift_businesses`

- `id`
- `owner_user_id` linked to the same AnyJob auth user
- `business_name`
- `legal_name`
- `industry`
- `business_type`
- `email`
- `phone`
- `verification_status`
- `typical_work_types`
- `typical_roles_needed`
- `default_rate_preferences`
- `trusted_until`
- `created_at`
- `updated_at`

### `shift_locations`

- `id`
- `business_id`
- `name`
- `address_line1`
- `city`
- `postcode`
- `country`
- `latitude`
- `longitude`
- `arrival_instructions`
- `created_at`

### `shift_roles`

- `id`
- `slug`
- `name`
- `industry`
- `niche`
- `description`
- `required_badges`
- `default_hourly_rate`
- `market_average_hourly_rate`
- `market_average_day_rate`
- `is_active`

### `shift_market_rates`

- `id`
- `country`
- `city`
- `industry`
- `niche`
- `role_id`
- `hourly_low`
- `hourly_average`
- `hourly_high`
- `day_low`
- `day_average`
- `day_high`
- `source`
- `effective_from`
- `created_at`

### `shift_worker_profiles`

- `id`
- `user_id`
- `provider_profile_id`
- `work_mode`: `shift` or `both`
- `availability_status`
- `home_latitude`
- `home_longitude`
- `travel_radius_km`
- `niches`
- `preferred_roles`
- `hourly_minimum`
- `day_rate_minimum`
- `fee_preferences_by_role`
- `market_rate_acknowledged_at`
- `open_to_freelance_jobs`
- `open_to_urgent_shifts`
- `open_to_recurring_shifts`
- `reliability_score`
- `shift_kyc_status`
- `created_at`
- `updated_at`

### `shift_compliance_documents`

- `id`
- `worker_profile_id`
- `document_type`
- `file_url`
- `status`
- `reviewed_by`
- `reviewed_at`
- `expires_at`
- `rejection_reason`

### `shift_posts`

- `id`
- `business_id`
- `location_id`
- `role_id`
- `work_type`: `part_time_day_wage` or `long_duration_shift`
- `niche`
- `title`
- `description`
- `starts_at`
- `ends_at`
- `headcount`
- `business_preferred_hourly_rate`
- `business_preferred_day_rate`
- `accepts_worker_rate_variation`
- `currency`
- `status`
- `assignment_mode`
- `requirements`
- `uniform`
- `break_policy`
- `cancellation_policy`
- `created_by`
- `created_at`
- `updated_at`

### `shift_worker_invites`

- `id`
- `shift_post_id`
- `business_id`
- `worker_profile_id`
- `status`
- `offered_hourly_rate`
- `offered_day_rate`
- `message`
- `expires_at`
- `created_at`
- `responded_at`

### `shift_slots`

- `id`
- `shift_post_id`
- `slot_number`
- `status`
- `assigned_worker_id`
- `assigned_at`
- `cancelled_at`
- `cancel_reason`

### `shift_applications`

- `id`
- `shift_post_id`
- `worker_profile_id`
- `status`
- `message`
- `requested_hourly_rate`
- `requested_day_rate`
- `applied_at`
- `decided_by`
- `decided_at`

### `shift_assignments`

- `id`
- `shift_post_id`
- `slot_id`
- `worker_profile_id`
- `status`
- `assigned_by`
- `assigned_at`
- `worker_confirmed_at`
- `cancelled_by`
- `cancelled_at`
- `cancel_reason`

### `shift_checkins`

- `id`
- `assignment_id`
- `event_type`
- `event_at`
- `latitude`
- `longitude`
- `qr_code_id`
- `source`
- `notes`
- `created_by`

### `shift_timesheets`

- `id`
- `assignment_id`
- `scheduled_start`
- `scheduled_end`
- `actual_start`
- `actual_end`
- `break_minutes`
- `payable_minutes`
- `business_status`
- `worker_status`
- `admin_status`
- `dispute_reason`
- `approved_by`
- `approved_at`

### `shift_messages`

- `id`
- `shift_post_id`
- `sender_id`
- `recipient_id`
- `body`
- `created_at`
- `read_at`

## API And Route Plan

### Public Routes

- `/shifts` - public shift-work landing and shift search
- `/shifts/[id]` - shift detail page
- `/register-business` - integrated business registration entry point
- `/shift-board` - worker shift discovery

### Dashboard Routes

- `/dashboard/business/register` - business capability onboarding
- `/dashboard/shifts` - business shift posts and fill status
- `/dashboard/shifts/new` - post shift wizard
- `/dashboard/shifts/[id]` - manage applicants, assigned workers, messages, check-ins
- `/dashboard/shift-workers` - browse eligible workers by niche, fee, distance, and availability
- `/pro/shifts` - worker assigned shifts, applications, and history
- `/pro/shifts/[id]` - worker shift detail
- `/become-provider?mode=shift` - shift-worker onboarding branch
- `/become-provider?mode=freelance` - freelance onboarding branch
- `/admin/shifts` - operations board
- `/admin/shifts/[id]` - admin detail, overrides, audit log
- `/admin/shift-workers` - worker compliance and reliability
- `/admin/shift-businesses` - business verification

### API Routes

- `POST /api/shifts`
- `GET /api/shifts`
- `GET /api/shifts/[id]`
- `PATCH /api/shifts/[id]`
- `POST /api/business/register`
- `GET /api/business/shift-workers`
- `POST /api/shifts/[id]/apply`
- `POST /api/shifts/[id]/invite`
- `POST /api/shifts/[id]/claim`
- `POST /api/shifts/[id]/assign`
- `POST /api/shifts/[id]/cancel`
- `POST /api/shifts/[id]/check-in`
- `POST /api/shifts/[id]/check-out`
- `POST /api/shifts/[id]/timesheet/confirm`
- `GET /api/admin/shifts`
- `PATCH /api/admin/shifts/[id]/override`

## Permissions And RLS

Recommended access rules:

- Public users can view only published shifts with limited business/location detail.
- Shift workers can view full shift details only for eligible shifts in their niche or assigned shifts.
- Freelance-only providers cannot view business shift jobs.
- Shift workers can view freelance jobs when `open_to_freelance_jobs` is enabled.
- Workers can create applications only for their own profile.
- Workers cannot apply to overlapping shifts.
- Businesses can read and manage only their own business profile, shift posts, locations, applicants, invites, and assignments.
- Businesses can browse only eligible shift-worker profiles for the selected niche and work type.
- Admin can read and update all shift tables.
- Service-role writes should be limited to trusted server routes.
- Check-in/out records should be append-only except admin correction rows.

## Matching Logic

Initial scoring inputs:

- Required role badges
- Required niche
- Work type: part-time day-wage or long-duration shift
- Worker KYC/compliance status
- Distance from shift location
- Availability window
- Schedule conflicts
- Reliability score
- Past business rating
- Worker pay expectations
- Business preferred fee
- Market-average fee for that role
- Recent cancellation/no-show count
- Admin trust flags

Suggested MVP behavior:

- Filter out ineligible workers first.
- Filter by niche before showing a business post to workers.
- Do not show hospital jobs to electricians, or retail jobs to healthcare-only providers.
- Sort eligible workers by reliability, distance, and role match.
- Show fee comparison between business preferred rate, platform market average, and worker preferred rate.
- For urgent shifts, notify standby workers first.
- For multi-slot shifts, avoid assigning the same worker to conflicting slots.

## Admin Operations

Admin should get an operational shift board, not just a table.

Key widgets:

- Today/tomorrow shifts
- Under-filled shifts
- Urgent shifts within 24 hours
- Late check-ins
- No-shows
- Timesheets needing approval
- Worker compliance expiring soon
- Business verification queue
- Disputes and incident reports

Admin actions:

- Approve/reject shift posts
- Assign worker manually
- Remove worker from shift
- Mark no-show
- Approve timesheet
- Adjust payable minutes
- Suspend worker from shift stream
- Suspend business from shift posting

## Notifications

Web MVP:

- Email confirmation
- Email reminders
- In-app notifications
- Dashboard warnings

Later:

- SMS for urgent cover
- Push notifications in native app
- Calendar export
- Worker availability nudges

Notification events:

- User registered as a business
- Provider selected shift-work mode
- Shift posted
- Business invited a worker
- Worker applied
- Worker assigned
- Worker rejected
- Shift filled
- Shift under-filled
- Shift cancelled
- Worker cancelled
- Check-in reminder
- Late check-in alert
- Timesheet awaiting confirmation

## UI Guidance

Shift Work should feel more operational than the public service marketplace.

Recommended style:

- Dense, scannable tables and cards.
- Calendar and list views.
- Clear status badges.
- Filters visible above the shift board.
- Slot fill indicators such as `3/5 filled`.
- Timeline for check-in, checkout, and timesheet events.
- Role badges and compliance badges.
- Minimal marketing copy once inside dashboards.

Avoid hiding operational controls inside decorative cards. Businesses posting shifts need speed and confidence; workers browsing shifts need clarity on pay, time, distance, and requirements.

## Implementation Phases

### Phase 0 - Requirements And Policy

- Define supported countries/cities for launch.
- Define worker classification and compliance requirements.
- Define payment/payroll strategy, even if deferred.
- Define cancellation, late arrival, no-show, and dispute policies.
- Define which shift categories are safe for launch.

### Phase 1 - Web MVP Without Payments

- Add menu button `Register as a Business`.
- Add integrated business capability onboarding under the same AnyJob account.
- Add `Become a Provider` first-step choice: `I Want To Work Freelance` or `I Want To Work In Shifts`.
- Add shift-worker question flow, niche assignment, and preferred fee controls.
- Add market-average fee suggestions by role/niche.
- Add business post wizard with first question: freelance service, part-time day-wage, or long-duration shift work.
- Add business worker-pool browsing by niche.
- Add shift board with filters.
- Add invite/apply/claim/assign flow.
- Add admin shift ops board.
- Add check-in/check-out event capture.
- Add timesheet records without payment execution.

### Phase 2 - Reliability And Matching

- Add standby list.
- Add automated matching score.
- Add urgent shift notifications.
- Add reliability score.
- Add two-way reviews.
- Add admin incident queue.

### Phase 3 - Payments And Payroll

- Add payout/payment provider.
- Add invoices or business billing.
- Add worker earnings dashboard.
- Add tax/payroll exports where required.
- Add dispute-aware payout holds.

### Phase 4 - Native App Support

- Add push notifications.
- Add native GPS check-in.
- Add camera/QR scanning.
- Add offline check-in fallback.
- Add native calendar integration.

The mobile app folder should remain untouched until mobile work is explicitly started again.

## Existing AnyJob Areas Likely To Be Extended

Likely files and modules:

- `src/components/layout/Header.tsx` for `Register as a Business` and/or `Shift Work` navigation.
- `src/app/become-provider/page.tsx` for the provider work-mode choice.
- `src/app/register-business/*` or `src/app/dashboard/business/register/*` for business onboarding.
- `src/components/dashboard/DashboardLayout.tsx` for business shift navigation.
- `src/components/provider/ProviderLayout.tsx` for worker shift navigation.
- `src/app/admin/*` for shift admin operations.
- `src/lib/supabase/*` for server/client database helpers.
- `supabase/migrations/*` for shift tables and policies.
- `src/app/api/*` for shift APIs.
- `src/types/*` for shift-specific TypeScript types.

Do not overload the existing category questionnaire. Provider onboarding should branch early, and business shift/day-wage posting should have its own questions because staffing is role/time/headcount based.

## QA Plan

Minimum manual QA before release:

- Business can create a shift client profile.
- User can register as a business from the main menu without creating a second login.
- Business can add and edit venue locations.
- Business must choose work type before posting: freelance service, part-time day-wage, or long-duration shift work.
- Business can post single-slot and multi-slot shifts.
- Business cannot post invalid date/time ranges.
- Business cannot post below configured minimum pay.
- Business can browse only worker profiles that match the selected niche.
- Hospital business shift posts are shown only to healthcare-niche shift workers.
- Provider onboarding starts with freelance vs shift-work choice.
- Freelance-only provider cannot see business shift jobs.
- Shift worker can opt into normal freelance jobs.
- Shift worker can create shift profile and availability.
- Shift worker can set preferred fee after seeing platform market-average guidance.
- Worker can filter shifts by date, role, distance, and pay.
- Ineligible worker sees a clear reason they cannot apply.
- Eligible worker can apply or claim based on assignment mode.
- Worker cannot claim overlapping shifts.
- Business can approve/reject applicants.
- Assignment updates slot fill count correctly.
- Worker can cancel only within policy rules.
- Business receives under-filled warning after cancellation.
- Worker can check in and check out.
- Late check-in creates an admin-visible alert.
- Business can confirm or dispute timesheet.
- Admin can override assignment and timesheet status.
- Admin audit trail records sensitive actions.
- Public users cannot see private venue instructions.
- RLS prevents users from reading or mutating other businesses' shifts.

## Main Risks

- Worker classification and employment law vary by country.
- Right-to-work and age restrictions may apply for some shift types.
- Hourly wage, break, overtime, and holiday-pay rules must be country-specific.
- Insurance responsibilities need legal review.
- Payment timing must match local rules and user expectations.
- Overly easy instant-claim can create quality problems without strong verification.
- Strict cancellation penalties can make the worker side feel hostile.
- Weak business verification can create safety risk for workers.
- Weak worker vetting can create reputational risk for businesses.

## Recommended First Build Slice

Build a controlled web-only MVP:

1. Add `Register as a Business` to the main menu and create the integrated business onboarding.
2. Add the `Become a Provider` first-step choice for freelance vs shift work.
3. Add shift-worker profile questions, niche detection, and fee preference setup.
4. Add market-average fee suggestions by role/niche.
5. Add business post wizard with work type: freelance service, part-time day-wage, or long-duration shift work.
6. Add niche-filtered business worker-pool browsing.
7. Add shift board with date, role, location, pay, and niche filters.
8. Add invite/apply/approve assignment mode first.
9. Add admin approval and manual assignment tools.
10. Add check-in/check-out events and timesheet confirmation.
11. Add reliability scoring only after real completion data exists.

This gives AnyJob a usable staffing stream without prematurely building payroll, native mobile dependencies, or fully automated dispatch.
