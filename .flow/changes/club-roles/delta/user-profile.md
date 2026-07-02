---
capability: user-profile
change: club-roles
synced: 2026-07-01
---

# Delta — user-profile

## ADDED

_None._

## MODIFIED

### Complete profile after first authentication

_Was: on submitting a name and phone number the profile saved and the person landed on the home dashboard._

- Given a newly authenticated person with no profile, when they reach the app for the first time, then they are asked to complete their profile with name, phone number, and an optional country.
- Given the complete-profile step, when they submit with a name and a phone number, then their profile is saved and, having no club yet, they are taken to create their first club rather than the home dashboard.
- Given the complete-profile step, when they submit without a name or without a phone number, then they are told "Name and phone number are required" and the profile is not saved.
- Given the complete-profile step, when they submit without a country, then the profile saves successfully.

### Incomplete profile gates the dashboard

_Was: a person whose profile had a name and phone number landed on the home dashboard on sign-in, with no profile step._

- Given a person who authenticated but has not provided a name and phone number, when they sign in again, then they are routed back to the complete-profile step instead of the home dashboard.
- Given a person whose profile has a name and phone number but who has no club, when they sign in, then they are taken to create a club rather than the home dashboard.
- Given a person whose profile has a name and phone number and who has an active club, when they sign in, then they land on the home dashboard without a profile step.

## REMOVED

_None._
