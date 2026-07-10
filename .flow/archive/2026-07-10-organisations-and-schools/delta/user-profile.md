---
capability: user-profile
change: organisations-and-schools
synced: 2026-07-10
---

# Delta — user-profile

## ADDED

_None._

## MODIFIED

### Complete profile after first authentication

_Was: After profile completion, a user with no club was taken to create their first club._

- Given a newly authenticated person with no profile, when they reach the app for the first time, then they are asked to complete their profile with name, phone number, and an optional country.
- Given the complete-profile step, when they submit with a name and a phone number, then their profile is saved and, having no organisation or school yet, they are taken to create their first organisation and school rather than the home dashboard.
- Given the complete-profile step, when they submit without a name or without a phone number, then they are told "Name and phone number are required" and the profile is not saved.
- Given the complete-profile step, when they submit without a country, then the profile saves successfully.

### Incomplete profile gates the dashboard

_Was: A profile-complete user with no club was routed to create a club; a user with an active club landed on the dashboard._

- Given a person who authenticated but has not provided a name and phone number, when they sign in again, then they are routed back to the complete-profile step instead of the home dashboard.
- Given a person whose profile has a name and phone number but who has no organisation or school, when they sign in, then they are taken to create an organisation and school rather than the home dashboard.
- Given a person whose profile has a name and phone number and who has an active organisation and active school, when they sign in, then they land on the home dashboard without a profile step.

## REMOVED

_None._
