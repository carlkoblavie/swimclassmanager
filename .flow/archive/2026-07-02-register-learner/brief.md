---
affects: [signups]
briefed: 2026-07-02
---

# Register Learner — Brief

## Entry point, user goal, status

A club wants to collect learn-to-swim sign-ups from the public. Each club has its own online sign-up form it can share as a link; prospective clients — parents signing up their children, or students signing up themselves — open the link and fill it in, with no account required. The club receives each sign-up. Status: **new**.

## Prerequisites

- **A club** (the club-roles change) — the sign-up form belongs to a specific club, and its link is shared from the club's dashboard.
- **Club roles** (club-roles / member-invitation) — the Administrator and Head Coach are the ones who share the link, receive sign-ups, and review them.

## The journey, step by step

1. **Getting the link.** From the club dashboard, an Administrator or Head Coach finds a shareable public link to their club's learn-to-swim sign-up form. The link is always live — they simply copy and share it with prospective clients.

2. **Opening the form.** A prospective client opens the link with no account. The form shows the club's name so they know who they are signing up with.

3. **Contact details.** They enter their own contact details: name, email, and phone (all required), and optionally a WhatsApp number.

4. **Learner(s).** They add at least one learner and may add more. For each learner they provide: the learner's name, date of birth, gender (Male or Female), nationality, residential location, and medical information (required — they enter "None" if there is nothing), and optionally the learner's swimming experience. _Failure:_ submitting with no learner tells them to add at least one.

5. **Message.** They may add an optional message that applies to the whole sign-up.

6. **Submitting.** On submit with everything required provided, the sign-up is captured for that club and the person sees a confirmation that it was received. _Failure:_ if any required field is missing, the sign-up is rejected and nothing is submitted.

7. **The club receives it.** Each sign-up is emailed to the club's Administrator and Head Coach with its details, and appears in a list they can view from the dashboard. The list is read-only — they can see the sign-ups but not act on them here.

## Decisions made

| Decision                                                         | Alternatives                       | Why                                                                                                       |
| ---------------------------------------------------------------- | ---------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Fixed standard sign-up form                                      | Admin-configurable form builder    | Ships a working sign-up flow fast; a per-club form builder is a much larger feature for later.            |
| Public link always live                                          | Admin toggles availability on/off  | Simplest — no on/off state and no "not accepting sign-ups" page; the admin just shares the link.          |
| No account required to submit                                    | Require sign-in                    | Prospective clients are not members and have no account; the whole point is public sign-up.               |
| One contact, one or more learners                                | One learner per sign-up            | A parent commonly signs up several children at once; repeating the whole form per child is friction.      |
| WhatsApp optional; residential location per learner              | WhatsApp required; location shared | Phone is the required contact channel, WhatsApp a nice-to-have; learners may live at different addresses. |
| Gender required (Male/Female); medical info required with "None" | Optional                           | The club wants these on every learner; "None" keeps medical info explicit rather than blank.              |
| Club receives by email **and** a dashboard list                  | Email only / list only             | Email gives an immediate receipt; the list lets the club review sign-ups in one place.                    |
| Administrator and Head Coach view/receive                        | Administrator only / anyone        | Consistent with who else manages the club and its members; both handle prospective clients.               |
| Duplicate sign-ups allowed                                       | Prevent duplicates                 | Each public submission is a separate lead; de-duplicating public enquiries would drop legitimate ones.    |

## Constraints the journey places on implementation

- Each club has its own **always-available public sign-up link**; a sign-up submitted through it belongs to that club. The public form shows the club's name.
- **No account is required** to open or submit the public form.
- **Contact details** required on every sign-up: name, email, phone. WhatsApp number is optional.
- **At least one learner** is required. For each learner these are required: name, date of birth, gender (Male or Female), nationality, residential location, and medical information (must be entered — "None" if nothing). Swimming experience is optional per learner.
- An **optional message** applies to the whole sign-up.
- If any required field is missing, or no learner is added, the sign-up is rejected and nothing is submitted; the person is told what is missing.
- On a successful submit, the person sees a confirmation that their sign-up has been received.
- Each captured sign-up **notifies the club's Administrator and Head Coach by email** with its details and **appears in a list** they can view. Only the Administrator and Head Coach of the club may view the list or receive the notification.
- The list is **read-only** in this change — sign-ups cannot be edited, given a status, converted into members/learner records, or deleted.
- **Duplicate sign-ups are allowed** — each submission is captured as a separate record.
