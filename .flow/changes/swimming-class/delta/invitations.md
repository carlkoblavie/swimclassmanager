---
capability: invitations
change: swimming-class
---

# Delta — invitations

## ADDED

### Inviting a Teacher while creating a class

- Given an Administrator or Head Coach is creating a class and the needed Teacher does not exist yet, when they provide the Teacher's email, name, and phone, then a Teacher invitation is created and sent.
- Given the Teacher invitation is pending, when the class is saved, then the invited Teacher can remain assigned as the pending class instructor.
- Given required Teacher invitation information is missing, when an Administrator or Head Coach tries to invite the Teacher while creating a class, then the invitation is rejected and the Teacher is not assigned as the pending instructor.

## MODIFIED

_None._

## REMOVED

_None._
