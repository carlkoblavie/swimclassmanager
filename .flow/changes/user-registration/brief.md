---
affects: [registration, user-profile]
briefed: 2026-06-20
---

# User Registration — Brief

## Entry point, user goal, status

A new person arrives at the signup screen wanting to create an account in the swimming management system. The same screen also lets an existing person sign back in — one door serves both. Status: **extension**. A typed email-and-password signup exists today; this change replaces it with passwordless sign-in and adds a first-time profile-completion step.

## Prerequisites

None. (Parent accounts are created by invitation from a coach or school — a separate journey, not a dependency of this one.)

## The journey, step by step

1. **Signup screen.** The person sees two ways to continue, presented together: **Continue with Google** and **sign in with a magic link sent to their email**. There is no password. The same screen handles both new and returning people — they never have to know which they are doing.

2. **Google path.** The person continues with Google and authenticates. If their identity is new, an account is created; if it already exists, they are signed in. _Failure:_ if they cancel or deny the Google prompt, they are offered to receive a magic link instead.

3. **Magic-link path.** The person enters their email and requests a link; they are told to check their email. Opening a valid link creates their account if new, or signs them in if it already exists. _Failures:_ an **expired** link prompts them to request a fresh one; an **already-used** link simply signs them in.

4. **Complete your profile (first time only).** A brand-new account is sent to a profile-completion step before reaching the app. It collects **name** (required), **phone number** (required), and **country** (optional). Account type is _not_ asked here — that comes later, at team creation. _Failure:_ submitting without a name or without a phone number tells them both are required and does not save.

5. **Into the app.** Once name and phone are provided, the profile is saved and the person lands on the **home dashboard**.

6. **Returning sign-in.** A person whose profile already has name and phone goes straight to the home dashboard, with no profile step.

7. **Incomplete-profile gate.** A person who authenticated but left before providing name and phone is routed back to the complete-profile step on every later sign-in, until it is done — they cannot reach the dashboard first.

## Decisions made

| Decision                                           | Alternatives                               | Why                                                                                                  |
| -------------------------------------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| Passwordless sign-in (Google + magic link)         | Keep typed email + password                | Removes password handling for users; fits the invite-and-link model of the product.                  |
| Unified door — same screen signs up _and_ signs in | Separate signup and login screens          | The person needn't know whether they're new or returning; one action covers both.                    |
| Google and magic link only                         | Add Microsoft now                          | Microsoft is wanted but deferred; ship the two first.                                                |
| Account type asked at team creation, not signup    | Ask coach-vs-school during registration    | Keeps registration to identity only; the coach/school distinction belongs with the team they set up. |
| Profile requires name + phone; country optional    | Require country too / require account type | Name and phone are the minimum to be reachable; country is nice-to-have.                             |
| Already-used magic link signs the person in        | Treat it as an error needing a new link    | Clicking a still-valid link twice should help, not block; only expiry forces a new link.             |
| Parents join by invitation                         | Open self-signup for parents               | Parents belong to a coach or school, so they are invited, not self-registered.                       |

## Constraints the journey places on implementation

- Account creation and sign-in happen only through Google or a magic link; there is no password.
- One entry point must serve both new and returning people: an unknown identity creates an account, a known identity signs in.
- A new account cannot reach the home dashboard until it has a **name** and a **phone number**. The user-facing rule when either is missing: **"Name and phone number are required."**
- **Country** is accepted but never required.
- Magic links expire. An expired link must lead the person to request a new one; a valid link opened again signs them in rather than failing.
- When Google sign-in is cancelled or denied, the person is offered the magic-link path instead.
- Microsoft sign-in, account-type selection, and parent invitations are out of scope for this change.
