---
affects: [invitations, memberships]
briefed: 2026-07-02
---

# Member Invitation — Brief

## Entry point, user goal, status

A club's Administrator or Head Coach wants to bring a specific person into their club with a defined role. From within their club they enter the person's email and pick a role; the person receives an emailed link and, on opening it, joins the club with that role in one action. Status: **new** — it extends the club-roles foundation from a solo founder into a multi-person club.

## Prerequisites

- **A club with an Administrator** (the club-roles change) — invitations are sent from within a club, by its Administrator or Head Coach.
- **Passwordless identity** (the registration change) — the invitation link authenticates the invited person the same way the sign-in link does.
- **The club role set** (club-roles) — invitations assign one of the club's defined roles.

## The journey, step by step

1. **Initiating an invite.** From within a club, an Administrator or Head Coach/Head Teacher chooses to invite someone. Only these two roles may invite; anyone else has no way to. _Failure:_ a person who is neither is not permitted to send invitations.

2. **Choosing who and what.** The inviter provides the invitee's **email** and selects a **role** — Head Coach/Head Teacher, Teacher, Deck Supervisor, or Parent. Administrator and Student are not offered: full authority is not handed out through an ordinary invite, and children are parent-managed records without their own email. _Failure:_ a malformed email is rejected and no invitation is sent.

3. **Guarding against duplicates.** If the email already belongs to an **active member** of this club, the invite is refused and no invitation is sent. If the email already has a **pending (un-accepted) invitation** to this club, sending again **re-sends** a fresh invitation (see the re-send rule below).

4. **Sending.** On success the invitation is created and emailed to the invitee, and the inviter is told the invitation was sent.

5. **Receiving and opening.** The invitee receives an email containing a link. Opening a **valid, unexpired** link signs them in — creating their account if the email is new, exactly as the sign-in link does — and joins them to the club with the assigned role, in one action.

6. **First-time profile.** A brand-new invitee who has not yet provided a name and phone number is sent through the existing complete-your-profile step before reaching the club. A person whose profile is already complete skips it.

7. **Landing in the club.** Once in, the invitee lands on the club's dashboard, and that club becomes their **active club** — even if they already belong to other clubs.

8. **Accept failures.** An **expired** link (older than the invitation window) tells the invitee the invitation has expired and to ask the inviter for a new one, and they do not join. Opening a link for an invitation that was **already accepted** simply signs the person in and lands them on the club (they are already a member). A **superseded** link — an earlier link after the invitation was re-sent — is no longer valid and is treated the same as an expired one.

## Decisions made

| Decision                                                                       | Alternatives                                                               | Why                                                                                                                                                              |
| ------------------------------------------------------------------------------ | -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Administrator and Head Coach may invite                                        | Administrator only / anyone                                                | The role doc has the Head Coach managing and communicating with staff, so they can bring staff in too; broader than admin-only, still gated to two roles.        |
| Invitable roles: Head Coach/Head Teacher, Teacher, Deck Supervisor, Parent     | Include Administrator / include Student                                    | Full Administrator authority is not handed out through an ordinary invite; children are parent-managed records without email, so Students are not email-invited. |
| Re-inviting a pending email re-sends — latest role wins, prior link superseded | Reject the duplicate / keep the original role / leave multiple links valid | A repeat invite is treated as "refresh with my latest intent"; one live invitation per email per club keeps acceptance unambiguous.                              |
| The link signs the invitee in and joins in one action                          | Require a separate sign-in first                                           | Frictionless and consistent with the passwordless sign-in link — one click brings them in.                                                                       |
| Joining sets the joined club as the active club                                | Keep the invitee's prior active club                                       | They just joined it, so the app shows it; consistent with creating a club making it active.                                                                      |
| Invitations valid for 7 days                                                   | 48 hours / 30 days                                                         | A week fits most recipients without letting stale invites linger; a re-send refreshes it if it lapses.                                                           |
| Accept failures mirror the sign-in link                                        | Distinct invitation-specific handling                                      | Reuses a model people already understand; an already-accepted link helps rather than blocks.                                                                     |

## Constraints the journey places on implementation

- Only a club's **Administrator or Head Coach/Head Teacher** may send invitations for that club; no other role can.
- An invitation names an invitee **email** and exactly one **role** from: Head Coach/Head Teacher, Teacher, Deck Supervisor, Parent. Administrator and Student are never invitable.
- The email must be valid; an invalid email is rejected and no invitation is sent. The user-facing message is **"Enter a valid email address."**
- An email that is already an **active member** of the club cannot be invited again. The user-facing message is **"This person is already a member."**
- At most **one live (pending) invitation** exists per email per club. Inviting an email that already has a pending invitation **re-sends**: the newly chosen role replaces the pending role, and only the newest link is valid — earlier links stop working.
- Invitations are scoped to a single club (the inviter's active club). Member, duplicate, and pending checks are **per-club**; the same person may hold different roles across different clubs.
- Opening a valid, unexpired invitation link authenticates the invited email — creating the account if new — and joins the club with the assigned role in one action. A brand-new invitee completes their profile (name + phone) before reaching the club.
- On joining, the invited person's **active club** becomes the club they joined, and they land on its dashboard.
- Invitations **expire 7 days** after they are sent or re-sent. An expired link tells the invitee **"This invitation has expired. Ask the person who invited you for a new one."** and they do not join.
- Opening a link for an **already-accepted** invitation signs the person in and lands them on the club, creating no duplicate membership. A **superseded** link (an earlier link after a re-send) is treated as expired.
