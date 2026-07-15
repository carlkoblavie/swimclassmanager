---
capability: classes
change: swimming-class
synced: 2026-07-15
---

# Delta — classes

## ADDED

### Creating a class series

- Given an Administrator or Head Coach and an available program level at their club, when they create a class series with a name, date range, selected weekdays, meeting time, capacity, location, instructor, and at least one stage, then the class is created for that club under that program level.
- Given a program level that is unavailable at the club, when an Administrator or Head Coach tries to create a class for it, then the class is rejected and not created.
- Given missing required class information, when an Administrator or Head Coach tries to create a class series, then it is rejected and not created.
- Given a class capacity greater than the selected program level's capacity, when an Administrator or Head Coach tries to create the class, then it is rejected with "Class capacity cannot exceed the level capacity."

### Choosing or inviting an instructor

- Given an existing club member with Teacher or Head Coach role, when an Administrator or Head Coach creates or edits a class, then that member can be selected as the class instructor.
- Given the needed Teacher does not exist yet, when an Administrator or Head Coach adds the Teacher while creating the class with email, name, and phone, then the class can be saved with that instructor pending.
- Given a class has a pending invited Teacher as instructor, when club members view the class, then they see that the instructor is pending until the Teacher accepts.

### Defining class stages and stage skills

- Given an Administrator or Head Coach creating a class series, when they define one or more ordered stages and each stage has one or more available skills, then the class stages are saved as the class's progression path.
- Given a class with no stages, when an Administrator or Head Coach tries to save it, then it is rejected and not saved.
- Given a stage with no skills, when an Administrator or Head Coach tries to save the class, then it is rejected and not saved.
- Given a skill that is not available to the club, when an Administrator or Head Coach tries to attach it to a stage, then it is rejected and not attached.

### Generating scheduled sessions

- Given a class series with a date range, selected weekdays, and meeting time, when the class is created, then scheduled sessions are created for the matching dates and times.
- Given a class schedule is edited after sessions already exist, when the edit is saved, then future sessions are regenerated and past sessions stay unchanged.

### Viewing class schedules

- Given a club member, when they view the club's classes, then they see the class's program level, instructor, location, capacity, stages, skills, scheduled sessions, and whether the class or any session is cancelled.
- Given a class instructor is still pending, when a club member views the class, then they see the instructor as pending.

### Editing a class series

- Given an Administrator or Head Coach, when they edit a class's details, schedule, stages, or stage skills, then the class is updated.
- Given an edit would leave the class with zero stages, when an Administrator or Head Coach tries to save it, then it is rejected and not saved.
- Given an edit would leave a stage with zero skills, when an Administrator or Head Coach tries to save it, then it is rejected and not saved.

### Cancelling a class series or scheduled session

- Given an Administrator or Head Coach, when they cancel a class series, then the class remains visible to members and is marked cancelled.
- Given an Administrator or Head Coach, when they cancel a single scheduled session, then the session remains visible in the schedule and is marked cancelled.

### Restricting class management to Administrators and Head Coaches

- Given a club member who is neither an Administrator nor a Head Coach, when they view the club's classes, then they can see classes and scheduled sessions but cannot create, edit, or cancel them.
- Given a club member who is neither an Administrator nor a Head Coach, when they try to manage a class or scheduled session, then they are not permitted to.

## MODIFIED

_None._

## REMOVED

_None._
