---
capability: signups
---

# Signups — State

## Requirements

### Sharing the public sign-up link

- Given an Administrator or Head Coach on their club dashboard, when they look for the sign-up form, then they can access a shareable, always-available public link to their club's learn-to-swim sign-up form.

### Submitting a sign-up

- Given a prospective client with no account opening a club's public sign-up link, when they provide their contact details (name, email, phone) and at least one learner (name, date of birth, gender, nationality, residential location, medical information) and submit, then the sign-up is captured for that club and they are shown a confirmation that it was received.
- Given the public sign-up form, when they submit with a required contact or learner field missing, then the sign-up is rejected, they are told what is missing, and nothing is submitted.
- Given the public sign-up form, when they submit with no learner added, then they are told to add at least one learner and nothing is submitted.
- Given a person who has already submitted, when they submit the form again, then each submission is captured as a separate sign-up.

### Receiving sign-ups

- Given a sign-up is captured, when it is recorded, then the club's Administrator and Head Coach are notified by email with the sign-up's details.
- Given an Administrator or Head Coach of the club, when they open their sign-ups list, then they see each sign-up's contact details and its learners.
- Given a person who is neither the Administrator nor a Head Coach of the club, when they attempt to view the club's sign-ups, then they are not permitted to.
