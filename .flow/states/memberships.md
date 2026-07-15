---
capability: memberships
---

# Memberships — State

## Requirements

### School creator becomes Administrator

- Given a person creates a school, when the school is created, then they hold the Administrator role in that school with full school authority.
- Given a school has just been created, when it comes into being, then no role other than Administrator is assigned to anyone.

### School role set is defined

- Given a school exists, then the roles Administrator, Head Coach/Head Teacher, Teacher, Deck Supervisor, Parent, and Student are defined for it and available for later assignment.
- Given a school exists, when roles beyond Administrator are needed, then they are granted later by the Administrator rather than at creation.

### School-scoped role membership

- Given a person holds a role in a school, then that role applies only within that school.
- Given a person holds roles in more than one school, then their standing in one school is independent of their standing in another.
- Given a person belongs to schools across multiple organisations, then their membership in one organisation's school is independent of their membership in another organisation's school.

### Joining a school by invitation

- Given a person accepts a valid invitation carrying a role, when the invitation is accepted, then they become a member of that school holding the invited role (Head Coach/Head Teacher, Teacher, Deck Supervisor, or Parent).
- Given a brand-new invitee with no completed profile, when they accept an invitation, then they complete their profile before reaching the school dashboard.
- Given a person accepts an invitation to a school, when they join, then that school and its organisation become active and they land on its dashboard, even if they already belong to other schools or organisations.
- Given a person is already a member of a school, when a link for an already-accepted invitation to that school is opened again, then no duplicate membership is created.

### Pending Teacher instructor assignment from class creation

- Given an Administrator or Head Coach invites a Teacher while creating a class, when the class is saved, then the invited person is associated with the class as a pending Teacher instructor.
- Given the invited Teacher accepts the invitation, when they join the club, then they hold the Teacher role in that club and become the class instructor.
- Given the invited Teacher has not accepted the invitation yet, when club members view the class, then the person is shown as a pending instructor rather than an active club member.
