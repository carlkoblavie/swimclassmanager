---
capability: invitations
change: member-invitation
synced: 2026-07-02
---

# Delta — invitations

## ADDED

### Sending an invitation

- Given an Administrator or Head Coach of a club, when they invite an email with a role of Head Coach/Head Teacher, Teacher, Deck Supervisor, or Parent, then an invitation is created, emailed to that address, and they are told it was sent.
- Given a person who is neither the Administrator nor a Head Coach of the club, when they attempt to send an invitation, then they are not permitted to.
- Given a malformed email, when they try to send an invitation, then they are told "Enter a valid email address." and no invitation is sent.
- Given an email that already belongs to an active member of the club, when they try to invite it, then they are told "This person is already a member." and no invitation is sent.

### Re-sending supersedes the pending invitation

- Given an email that already has a pending invitation to the club, when the inviter invites it again, then a fresh invitation is sent, the newly chosen role replaces the pending role, and only the newest link remains valid.
- Given a pending invitation that was re-sent, when the invitee opens the earlier link, then it is no longer valid and they are told the invitation has expired.

### Accepting an invitation link

- Given a valid, unexpired invitation link, when the invited person opens it, then they are signed in — their account created if the email is new — and the invitation is accepted.
- Given an invitation that was already accepted, when its link is opened again, then the person is simply signed in and no second acceptance occurs.

### Invitation expiry

- Given an invitation more than seven days old, when the invited person opens its link, then they are told "This invitation has expired. Ask the person who invited you for a new one." and the invitation is not accepted.

## MODIFIED

_None._

## REMOVED

_None._
