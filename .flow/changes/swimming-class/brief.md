---
affects: [classes, skills, invitations, memberships, billing]
briefed: 2026-07-10
---

# Swimming Class — Brief

## Entry point, user goal, status

A club Administrator or Head Coach opens the club's Programs area, chooses an available program level, and creates or manages a recurring swimming class series for that club. The goal is to schedule classes under existing program levels, assign an instructor, define the ordered stages and skills the class develops, and publish the resulting schedule for club members to view. Status: **new**.

## Prerequisites

- **A club and club roles** — class management happens inside one club, and only an Administrator or Head Coach may manage classes.
- **Programs and levels** — every class belongs to one program level, and the level must be available at the club before a class can be scheduled for it.
- **Invitations and memberships** — if the needed Teacher does not already exist, the class creator can invite one while creating the class.
- **Club premium status** — premium clubs can use platform default skills; non-premium clubs use their own club-specific skills.

## The journey, step by step

1. **Starting from a program level.** An Administrator or Head Coach opens the club's Programs area, chooses a program level that is available at the club, and starts a class series for that level. If the level is not available at the club, a new class cannot be scheduled for it.

2. **Creating the class series.** The Administrator or Head Coach provides a class name, the selected program level, a start date, an end date, the weekdays the class meets, a start time, an end time, a capacity, a location, an instructor, and at least one stage. The capacity must be a positive whole number and cannot exceed the selected program level's capacity. _Failure:_ missing required class information is rejected and the class is not created. _Failure:_ capacity above the program level capacity is rejected with "Class capacity cannot exceed the level capacity."

3. **Choosing or inviting the instructor.** The creator can choose an existing club member who is a Teacher or Head Coach as the instructor. If the needed Teacher does not exist yet, the creator can add a Teacher while creating the class by providing the person's email, name, and phone number. The class can still be saved while that Teacher's invitation is pending, and members see the instructor as pending until the Teacher accepts.

4. **Defining stages and skills.** Every class series has an ordered list of stages. Each stage has a name, its place in the order, and one or more skills to develop. Skills are chosen from the skills available to that club: club-specific skills for every club, plus platform default skills for premium clubs. If a needed club-specific skill does not exist, the Administrator or Head Coach can add it while defining the stages. _Failure:_ saving a class with no stages, or with a stage that has no skills, is rejected. _Failure:_ a skill unavailable to the club cannot be attached to a stage.

5. **Creating the schedule.** When the class is created, scheduled sessions are produced from the date range, selected weekdays, and meeting time. Members see the class series and its scheduled sessions.

6. **Viewing classes.** Any club member can view the club's classes. They see the class's program level, instructor, location, capacity, stages, skills, scheduled sessions, and whether the class or any session is cancelled. Members cannot create, edit, cancel, or manage classes.

7. **Editing a class series.** An Administrator or Head Coach can edit class details, the schedule, and the stages. If the schedule changes after sessions already exist, future sessions are regenerated and past sessions stay unchanged. Stage names, order, and skill lists can change, but the class cannot be left with zero stages and a stage cannot be left with zero skills.

8. **Cancelling.** An Administrator or Head Coach can cancel the whole class series or cancel a single scheduled session. A cancelled class remains visible and marked cancelled. A cancelled session remains visible in the schedule and marked cancelled.

9. **Confirmation.** Successful actions show these confirmations: "Class created.", "Class updated.", "Class cancelled.", "Session cancelled.", and "Teacher invited."

10. **Deferred progression.** Stages and skills describe the progression path for the class now. Assessing students, tracking developed skills, enrolling learners, waitlists, and moving students from one stage to another are deferred to later journeys.

## Decisions made

| Decision                                                                      | Alternatives                                    | Why                                                                                                |
| ----------------------------------------------------------------------------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| A class is a recurring class series                                           | One-off session / open-ended group              | Clubs need a group that meets repeatedly under a program level.                                    |
| Schedule is date range + selected weekdays + start/end time                   | Number of sessions / manually add every date    | This captures a recurring class without making users enter every session one by one.               |
| Managers are Administrator and Head Coach only                                | Include Teacher / Administrator only            | Class setup changes the club offering; leadership owns it.                                         |
| Members can view classes but not manage them                                  | Hidden unless enrolled / public visibility      | Club members should know what their club offers while management stays restricted.                 |
| Instructor is an existing Teacher or Head Coach, or a newly invited Teacher   | Free-text instructor / optional instructor      | Classes should connect to real club people; a pending invitation supports setup before acceptance. |
| New Teacher during class creation needs email, name, and phone                | Email only / email and name                     | The club wants enough contact information to identify and follow up with the pending instructor.   |
| Class can save with a pending Teacher                                         | Require acceptance first / save unassigned      | Scheduling should not be blocked while the invited Teacher accepts.                                |
| Class capacity cannot exceed the program level capacity                       | Allow with warning / auto-cap                   | The level capacity is the upper bound for safe class sizing.                                       |
| Waitlist is deferred to enrollment                                            | Mark over-capacity classes as waitlisted        | Waitlists depend on learner enrollment, which is a separate journey.                               |
| Generated sessions can be cancelled individually                              | Only cancel whole class / hide cancelled dates  | Clubs need to cancel a specific date while keeping the rest of the series intact.                  |
| Schedule edits regenerate future sessions and preserve past sessions          | Regenerate all sessions / lock schedule         | Past sessions are history; future sessions should reflect the updated schedule.                    |
| Each class has ordered stages with skills                                     | Stages from the program level / optional labels | Stages describe the class's progression path without changing the shared program level.            |
| Every class needs at least one stage and every stage needs at least one skill | Stages optional / skills later                  | The class should be meaningful as a progression path from the moment it is created.                |
| Skills come from club-specific skills plus premium platform defaults          | Platform-wide only / club-specific only         | Clubs can define their own skills; premium clubs also benefit from shared defaults.                |
| Platform default skills are read-only                                         | Everyone can edit defaults / copy defaults      | Defaults should remain stable across the platform; clubs can create their own skills when needed.  |
| Student transitions between stages are deferred                               | Include assessment and transitions now          | Transitioning students depends on enrollment and skill assessment, which are separate journeys.    |

## Constraints the journey places on implementation

- A class series must belong to an available program level at the club where it is created.
- A class series requires a name, program level, date range, selected weekdays, start time, end time, capacity, location, instructor, and at least one stage.
- Capacity must be a positive whole number and cannot exceed the selected program level's capacity; exceeding it is rejected with "Class capacity cannot exceed the level capacity."
- The instructor must be an existing club member with Teacher or Head Coach role, or a Teacher invited while creating the class.
- A newly invited Teacher requires email, name, and phone. The class may save while the invitation is pending, and the instructor appears as pending until accepted.
- Each class stage requires a name, an order, and at least one skill.
- The skills attached to a stage must be available to the club: club-specific skills for every club, and platform default skills only when the club is premium.
- Administrators and Head Coaches may add club-specific skills while defining stages. Platform default skills are read-only.
- Scheduled sessions are produced from the class date range, selected weekdays, and meeting time.
- Editing a class schedule regenerates future sessions and leaves past sessions unchanged.
- Cancelling a class or scheduled session marks it cancelled rather than removing it from members' view.
- Only a club's Administrator or Head Coach may create, edit, or cancel class series or scheduled sessions. All club members may view classes and scheduled sessions.
- Successful actions use these confirmations: "Class created.", "Class updated.", "Class cancelled.", "Session cancelled.", and "Teacher invited."
- Student enrollment, waitlists, skill assessment, and moving students between stages are not part of this change.
