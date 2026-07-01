---
capability: user-profile
change: user-registration
---

# Delta — user-profile

## ADDED

### Complete profile after first authentication

- Given a newly authenticated person with no profile, when they reach the app for the first time, then they are asked to complete their profile with name, phone number, and an optional country.
- Given the complete-profile step, when they submit with a name and a phone number, then their profile is saved and they land on the home dashboard.
- Given the complete-profile step, when they submit without a name or without a phone number, then they are told "Name and phone number are required" and the profile is not saved.
- Given the complete-profile step, when they submit without a country, then the profile saves successfully.

### Incomplete profile gates the dashboard

- Given a person who authenticated but has not provided a name and phone number, when they sign in again, then they are routed back to the complete-profile step instead of the home dashboard.
- Given a person whose profile already has a name and phone number, when they sign in, then they land on the home dashboard without a profile step.

## MODIFIED

_None._

## REMOVED

_None._
