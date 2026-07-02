---
capability: clubs
---

# Clubs — State

## Requirements

### Creating the first club

- Given a signed-in person with no clubs, when they reach the app, then they are guided into creating a club before a usable dashboard.
- Given a signed-in person supplies a name and a location, when they create the club, then the club is created and they land on its dashboard with it set as the active club.
- Given a name or a location is missing, when they try to create the club, then they are told "Name and location are required." and no club is created.

### Creating additional clubs

- Given a person who already has one or more clubs, when they create another club with a name and location, then the new club is created and becomes the active club they are placed in.

### Preventing duplicate clubs

- Given a person already has a club with a given name and location, when they try to create another club with the same name and the same location, then they are told "You already have a club with this name and location." and no club is created.
- Given a person already has a club with a given name, when they create another club with that same name but a different location, then the new club is created.
