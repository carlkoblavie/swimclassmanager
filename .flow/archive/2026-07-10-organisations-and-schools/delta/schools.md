---
capability: schools
change: organisations-and-schools
synced: 2026-07-10
---

# Delta — schools

## ADDED

### Creating the first school

- Given a signed-in person with no schools, when they reach the app, then they are guided into creating an organisation and first school before a usable dashboard.
- Given a signed-in person supplies an organisation name, school name, and location, when they create the first school, then the organisation and school are created and they land on the school dashboard with that organisation and school active.
- Given an organisation name, school name, or location is missing, when they try to create the first school, then they are told the required information is missing and no organisation or school is created.

### Creating additional schools

- Given an Administrator or Head Coach of a school in an organisation, when they create another school with a name and location for that organisation, then the new school is created under the organisation and can become the active school.
- Given a person belongs to multiple organisations, when they create a school, then they can choose an organisation they belong to or create a new organisation with its first school.
- Given a person who is not an Administrator or Head Coach of any school in an organisation, when they try to add a school to that organisation, then they are not permitted to.

### Preventing duplicate schools

- Given an organisation already has a school with a given name and location, when a permitted person tries to create another school in that organisation with the same name and location, then they are told the school already exists and no school is created.
- Given two different organisations, when each has a school with the same name and location, then both schools may exist because school names and locations are unique within an organisation.
- Given an organisation already has a school with a given slug, when a new school would produce the same slug in that organisation, then the new school gets a unique slug within that organisation.

### Switching schools within an organisation

- Given a person belongs to multiple schools in their active organisation, when they choose another school in that organisation, then that school becomes active.
- Given a person belongs to schools in another organisation, when they switch to that organisation, then they can choose from that organisation's schools.

## MODIFIED

_None._

## REMOVED

_None._
