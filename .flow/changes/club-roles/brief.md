---
affects: [clubs, memberships, user-profile]
briefed: 2026-07-01
---

# Club Roles — Brief

## Entry point, user goal, status

A signed-in person who does not yet run anything in the system wants to establish a club — the organizational home (typically a single location or branch) that every later activity hangs off. Their goal is to create that club and become its Administrator, so they can go on to invite people, set up classes, and run the operation. Status: **new**.

This is the foundation the registration change deferred to: registration settles identity only, and the person's standing in the system (their club and role) is established here.

## Prerequisites

- **A signed-in identity.** This journey begins after a person has signed in; establishing that identity is the registration change's job, not this one.
- Member invitation, role assignment beyond the founder, class setup, and billing are all **later journeys** that depend on a club existing — they are out of scope here.

## The journey, step by step

1. **First-run entry.** A person signs in and has no clubs. They cannot do anything meaningful without one, so they are guided into creating their first club before reaching a usable dashboard. Creating a club is also available later, so a person running several locations can add more.

2. **Describe the club.** The person provides a **name** and a **location**, both required. _Failure:_ submitting without a name or without a location tells them both are required and the club is not created.

3. **Prevent an accidental duplicate.** If the person already has a club with the same name and the same location, creating another with that same pair is refused and they are told they already have a club with that name and location. (A repeated name across _different_ locations is allowed — that is how one operator runs a chain.)

4. **Become the Administrator.** On success the club is created and the person becomes its **Administrator** — and only its Administrator. The other roles the club will need (Head Coach/Head Teacher, Teacher, Deck Supervisor, Parent, Student) are defined and available, but nobody is assigned to them yet; the Administrator grants them later. If the club needs a Head Coach, the Administrator assigns one later — possibly themselves.

5. **Land in the new club.** The person lands on the newly-created club's dashboard, now acting as its Administrator, with that club set as the **active club** — the club whose context the app is currently showing. When a person who already runs several clubs creates a new one, they are likewise dropped into the new club as the active one.

## Decisions made

| Decision                                   | Alternatives                                   | Why                                                                                                                                                                                                                                                                             |
| ------------------------------------------ | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A person can run multiple clubs            | One club per person                            | Operators run more than one location; a club typically maps to a single location/branch, so several are expected.                                                                                                                                                               |
| Invitation-gated onboarding                | Open self-signup with roles assigned afterward | The role document has the Administrator _add_ clients and generate their portals; non-admins belong to a club by invitation, not self-service. Self-signup yields an unaffiliated person who can create a club and become its Administrator; everyone else joins by invitation. |
| Creator becomes Administrator only         | Creator becomes Administrator + Head Coach     | Keeps the two roles cleanly separate as the role document defines them; a Head Coach is assigned deliberately later, even if that is the founder themselves.                                                                                                                    |
| Name and location both required            | Name only / more fields at creation            | Name identifies the club and location distinguishes one club from another; nothing else is needed to bring a club into being.                                                                                                                                                   |
| Prevent same-name-same-location duplicates | Allow any duplicates                           | Two clubs identical in name and location are almost always a mistake; the same name at a different location is legitimate and stays allowed.                                                                                                                                    |
| First-run guides into club creation        | Usable dashboard with zero clubs               | With no club there is nothing to act on, so the person is guided straight to creating one rather than shown an empty dashboard.                                                                                                                                                 |

## Constraints the journey places on implementation

- A person may hold more than one club and administers each one they create.
- Creating a club requires a **name** and a **location**; both are required. When either is missing, the user-facing rule is **"Name and location are required."** and the club is not created.
- A person may not create a second club with the **same name and the same location** as one they already have. The user-facing rule is **"You already have a club with this name and location."** The same name at a different location is permitted.
- Creating a club makes the creator that club's **Administrator**, and only its Administrator. No other role is assigned to anyone at creation.
- Every club has a defined set of roles available for later assignment: **Administrator, Head Coach/Head Teacher, Teacher, Deck Supervisor, Parent, Student.**
- Role membership is scoped to a club: a person's role applies within the specific club they hold it in, and a person may hold different standings across different clubs.
- After creating a club, the creator is placed within that club as the **active club**. Creating another club later makes that newer club the active one.
- Non-administrators do not reach the system by self-service; they are brought in by invitation into a specific club with a role. (The invitation journey itself is a later change.)
