---
capability: skills
change: swimming-class
---

# Delta — skills

## ADDED

### Using available skills in class stages

- Given a club's class manager is defining a class stage, when they choose skills for that stage, then they can use club-specific skills and, if the club is premium, platform default skills.
- Given a skill is not available to the club, when a class manager tries to attach it to a stage, then the skill is rejected and not attached.

### Creating club-specific skills during class setup

- Given an Administrator or Head Coach is defining class stages and a needed skill does not exist for the club, when they add a club-specific skill, then that skill becomes available to the club and can be attached to the stage.

### Restricting platform default skills to premium clubs

- Given a premium club, when an Administrator or Head Coach defines class stages, then platform default skills are available to attach to stages.
- Given a non-premium club, when an Administrator or Head Coach defines class stages, then platform default skills are not available to attach to stages.

### Keeping platform default skills read-only

- Given a platform default skill, when an Administrator or Head Coach uses it for a class stage, then they can attach it but cannot modify the default skill.
- Given an Administrator or Head Coach needs a different skill, when they define class stages, then they can create a club-specific skill instead of modifying a platform default skill.

## MODIFIED

_None._

## REMOVED

_None._
