---
capability: memberships
---

# Memberships — State

## Requirements

### Club creator becomes Administrator

- Given a person creates a club, when the club is created, then they hold the Administrator role in that club with full club authority.
- Given a club has just been created, when it comes into being, then no role other than Administrator is assigned to anyone.

### Club role set is defined

- Given a club exists, then the roles Administrator, Head Coach/Head Teacher, Teacher, Deck Supervisor, Parent, and Student are defined for it and available for later assignment.
- Given a club exists, when roles beyond Administrator are needed, then they are granted later by the Administrator rather than at creation.

### Club-scoped role membership

- Given a person holds a role in a club, then that role applies only within that club.
- Given a person holds roles in more than one club, then their standing in one club is independent of their standing in another.

### Joining a club by invitation

- Given a person accepts a valid invitation carrying a role, when the invitation is accepted, then they become a member of that club holding the invited role (Head Coach/Head Teacher, Teacher, Deck Supervisor, or Parent).
- Given a brand-new invitee with no completed profile, when they accept an invitation, then they complete their profile before reaching the club dashboard.
- Given a person accepts an invitation to a club, when they join, then that club becomes their active club and they land on its dashboard, even if they already belong to other clubs.
- Given a person is already a member of a club, when a link for an already-accepted invitation to that club is opened again, then no duplicate membership is created.
