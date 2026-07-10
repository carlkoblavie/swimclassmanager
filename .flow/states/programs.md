---
capability: programs
---

# Programs — State

## Requirements

### Creating a program

- Given an Administrator or Head Coach, when they create a program with a name and a description, then the program is added to the shared catalog and becomes available to every school.
- Given a program name that already exists, when they try to create a program with that name, then it is rejected with "A program with this name already exists" and nothing is created.
- Given a missing name or missing description, when they submit, then the program is rejected and nothing is created.

### Defining a program's levels

- Given an Administrator or Head Coach defining a program, when they add one or more levels, each with a name, an age group, a description, a default fee, and a capacity, then the levels are saved as part of the shared program and seen by every school.
- Given a program with no level, when they try to save it, then it is rejected with "A program must have at least one level" and it is not saved.
- Given a level with a missing required field (name, age group, description, fee, or capacity), when they submit, then it is rejected and the level is not saved.
- Given a level with a negative fee or a capacity that is not a positive whole number, when they submit, then it is rejected and the level is not saved.

### Editing and removing programs and levels

- Given an Administrator or Head Coach, when they edit a program's name or description or a level's details, then the change applies to the shared catalog and is seen by every school.
- Given an Administrator or Head Coach renaming a program to a name that already exists, when they submit, then it is rejected because program names are unique across the platform.
- Given an Administrator or Head Coach, when they remove a level from a program that has more than one level, then the level is removed for every school.
- Given a program with a single level, when they try to remove its only level, then it is rejected because a program must keep at least one level.
- Given an Administrator or Head Coach, when they remove a program, then the program and its levels are removed for every school.

### Viewing the school's programs

- Given a school member, when they open the school's programs area, then they see the platform's programs, each with its levels showing age group, description, their school's fee, capacity, and whether the level is available at their school.
- Given a school with no programs in the catalog, when a member opens the programs area, then they are shown that there are no programs yet.

### Tailoring a level's fee and availability per school

- Given an Administrator or Head Coach, when they set their school's fee for a level, then that fee overrides the platform default for that level at their school only.
- Given an Administrator or Head Coach, when they turn a level's availability off or on for their school, then the level becomes unavailable or available at their school only; levels are available by default.

### Restricting management to Administrators and Head Coaches of the school

- Given a school member who is neither an Administrator nor a Head Coach, when they open the programs area, then they can view the programs but cannot create, edit, or remove programs or levels, set fees, or change availability.
