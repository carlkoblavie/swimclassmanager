---
capability: signups
change: organisations-and-schools
synced: 2026-07-10
---

# Delta — signups

## ADDED

_None._

## MODIFIED

### Sharing the public sign-up link

_Was: Administrators and Head Coaches accessed a club public sign-up link from the club dashboard._

- Given an Administrator or Head Coach on their school dashboard, when they look for the sign-up form, then they can access a shareable, always-available public link to their school's learn-to-swim sign-up form.
- Given a school belongs to an organisation, when its public sign-up link is shown, then the link identifies both the organisation and the school.

### Submitting a sign-up

_Was: Prospective clients submitted through a club's public sign-up link and the submission was captured for that club._

- Given a prospective client with no account opening a school's public sign-up link, when they provide their contact details (name, email, phone) and at least one learner (name, date of birth, gender, nationality, residential location, medical information) and submit, then the sign-up is captured for that school and they are shown a confirmation that it was received.
- Given the public sign-up form, when they submit with a required contact or learner field missing, then the sign-up is rejected, they are told what is missing, and nothing is submitted.
- Given the public sign-up form, when they submit with no learner added, then they are told to add at least one learner and nothing is submitted.
- Given a person who has already submitted, when they submit the form again, then each submission is captured as a separate sign-up.

### Receiving sign-ups

_Was: A club's Administrator and Head Coach were notified and could view that club's sign-ups._

- Given a sign-up is captured, when it is recorded, then the school's Administrator and Head Coach are notified by email with the sign-up's details.
- Given an Administrator or Head Coach of the school, when they open their sign-ups list, then they see each sign-up's contact details and its learners.
- Given a person who is neither the Administrator nor a Head Coach of the school, when they attempt to view the school's sign-ups, then they are not permitted to.

## REMOVED

_None._
