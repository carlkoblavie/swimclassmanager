# Release Summary

Release date: 2026-08-17

Release scope: curriculum and billing foundation through the current teaching-operations release (`994c4f1` through `beac33c`).

## Highlights

This release expands Swim Class Manager from basic class setup into a broader school operations workflow covering curriculum, lesson planning, instructor assignment, learner enrolment, and term-based billing.

## Curriculum And Banks

- Added curriculum programs, levels, stages, stage-specific skills, and class options.
- Added skills bank management, skill families, activity bank management, categories, age groups, and bank packs.
- Added school-scoped curriculum and activity data.
- Added support for class names scoped to a stage, allowing the same class name at different stages or levels.
- Improved program, level, stage, class, skill, and activity authoring screens.
- Added customer-facing level selection and purchase preparation.

## Classes And Lessons

- Added class creation and editing within curriculum stages.
- Added scheduled class series with weekday, start time, duration, location, capacity, term, level, and stage information.
- Added lesson generation for a date range.
- Lessons are numbered sequentially across the full generated series rather than restarting at each month.
- Added lesson list and calendar views with class, date, stage, status, and other filters.
- Added activity counts and empty-activity indicators on the lessons list.
- Added activity copying between empty lessons in the same stage.
- Added lesson duplication, editing, rescheduling, and deletion flows.
- Added lesson detail and edit screens with objectives, stage skills, activities, session plans, and duration tracking.
- Added sequential lesson numbers and duration display in lesson details.
- Removed the redundant Classes navigation path from lesson workflows; lesson detail back links return to Lessons.
- Added handling for cancelled classes and prevented cancelled lessons from being generated or retained as active teaching sessions.

## Instructors And Staffing

- Renamed teacher-facing language to instructor.
- Added instructor invitations and instructor/member management.
- Added lead instructor assignment to lessons.
- Added supporting instructor assignment to lessons.
- Added instructor display on lesson lists and lesson details.
- Added bulk instructor assignment support.
- Added permission checks for instructor and lesson-management actions.

## Learner Enrolment

- Added an enrolment workspace for placing registered learners into classes.
- Added learner tabs for unplaced, enrolled, and all learners.
- Added learner search and level filtering.
- Added single-learner and bulk enrolment workflows.
- Added class selection followed by lesson selection during enrolment.
- Added enrolment start/join dates and term association.
- Added class moves, withdrawal from class, make-up lesson support, and lesson selection changes.
- Added enrolment display using Level before Stage/class context where applicable.
- Added class capacity and remaining-place handling during placement.
- Removed unnecessary selection controls from the enrolment list after placement workflow changes.
- Added protection against placing learners into cancelled classes.

## Billing And Payments

- Added signup billing status handling for:
  - Pending invoice
  - Invoice sent
  - Part paid
  - Paid
  - Closed enquiries
- Added manual invoice-sent and mark-as-paid actions.
- Added term-scoped payment records tied to learner enrolments.
- Added manual part-payment recording with learner, term, amount, outstanding balance, and payment status.
- Part-paid learners can proceed through enrolment placement.
- Existing learner enrolments without a purchase-item row can still expose their associated term payment where appropriate.
- Added backfill support for missing term-payment rows on existing enrolments.
- Normalized legacy term-payment timestamps for Lucid/SQLite compatibility.
- Fixed SQLite mark-as-paid updates so term payments are updated without circular query-reference serialization errors.
- Fixed mark-as-paid handling for enrolments that do not have purchase-item rows.
- Added billing details and payment actions to signup drawers.

## Permissions And Safety

- Added permission keys for enrolment withdrawal, lesson generation, instructor assignment, and related operations.
- Restricted sensitive actions such as lesson generation and withdrawal to authorized administrators.
- Restored lesson-generation permissions after permission-registry changes.
- Added authorization checks to lesson, enrolment, invitation, and staffing workflows.

## Navigation And UI

- Updated the main navigation to focus on Dashboard, Programs, Skills bank, Activity bank, Lessons, Sign-ups, Members, and account settings.
- Removed duplicate organization branding from the top navigation/sidebar presentation.
- Removed initials avatars from the enrolment/signup rows where they added noise.
- Added drawer-based workflows for editing lessons, instructors, activities, enrolments, and payments.
- Added scrollable long-form drawers for learner and enrolment workflows.
- Refined skills display into numbered skill tiles with pass criteria.
- Improved lesson and class cards, filters, statuses, empty states, and action placement.

## Data And Infrastructure

- Added schema migrations for lesson duration, instructor assignments, enrolment lesson selections, class placement, term payments, payment amounts, permissions, and related relationships.
- Added Lucid models and relationships for lesson instructors, enrolments, term payments, purchase items, payments, and curriculum entities.
- Refreshed generated Adonis client/server metadata after route and page changes.
- Preserved migration history while updating the nullable class schedule migration.

## Verification

- TypeScript checks pass for both the server and Inertia client:
  - `npm run typecheck`
- Targeted ESLint checks pass for the release areas.
- Database migrations were run successfully through the term-payment timestamp normalization migration.
- The mark-as-paid term-payment update was verified with a rollback-only SQLite transaction check.

## Deferred Follow-ups

The following were discussed but are intentionally outside this release:

- Immutable payment transaction ledger and full payment-history UI.
- Automated guardian notifications and event-driven status messages.
- Pausing lesson progression due to payment status.
- Attendance-based forfeiture and absence policy automation.
- Broader payment-provider and reconciliation tooling.

## Release Notes

The repository does not currently carry a semantic package version or release tag; `package.json` remains at `0.0.0`. This document describes the current release snapshot represented by the commits above.
