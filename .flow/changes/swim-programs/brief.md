---
affects: [programs]
briefed: 2026-07-03
---

# Swim Programs — Brief

## Entry point, user goal, status

A club member opens their club's **Programs** area. Every member can view what the club offers; a club's **Administrator or Head Coach** manages the programs from here. The goal is a **shared, platform-wide catalog** of swim programs — each a broad offering (e.g. "Learn to Swim") holding one or more **levels** targeting different age or skill groups — that every club can offer, while each club tailors **pricing** and **availability** to what it can actually staff. Status: **new**.

## Prerequisites

- **A club** (the club-roles change) — programs are viewed and managed from within a club.
- **Administrator and Head Coach roles** (club-roles / member-invitation) — the people who create and manage programs; all other members can view only.

## The journey, step by step

1. **Viewing the programs.** Any club member opens the club's Programs area and sees the programs, each with its levels. For each level they see its age group, description, the **fee for their club**, its capacity, and whether it is **available** at their club. If no programs exist yet, they see that the catalog is empty.

2. **Creating a program.** An Administrator or Head Coach adds a program by giving it a **name** and a **description** (both required). The program joins the shared catalog and becomes available to every club on the platform. _Failure:_ a missing name or description is rejected and nothing is created. _Failure:_ a name that already exists is rejected with "A program with this name already exists" — program names are unique across the platform.

3. **Defining its levels.** A program must have **at least one level**. For each level the Administrator or Head Coach provides a **name**, an **age group**, a **description**, a **default fee**, and a **capacity** (all required). Levels are part of the shared program — every club sees the same set. _Failure:_ trying to leave a program with no level is rejected ("A program must have at least one level"). _Failure:_ a missing required level field, a negative fee, or a capacity that is not a positive whole number is rejected and the level is not saved.

4. **Tailoring fee and availability per club.** For any level, an Administrator or Head Coach can set **their club's own fee**, which overrides the platform default for that club only, and can **turn the level's availability on or off** for their club — for instance, turning a level off when the club has no personnel to offer it yet. Levels are **available by default**. These choices affect only the club that makes them.

5. **Editing and removing.** An Administrator or Head Coach can edit a program's name or description and any level's details, remove a level, or remove an entire program. Because the catalog is shared, these edits apply to **every club**. Renaming a program to a name that already exists is rejected (names stay unique). A program can never be left with **zero levels** — removing the last level is rejected.

6. **Confirmation.** Each successful create, edit, removal, fee change, or availability change shows a confirmation.

7. **Permission boundary.** A club member who is neither an Administrator nor a Head Coach can view the programs but cannot create, edit, remove, set fees, or change availability.

## Decisions made

| Decision | Alternatives | Why |
| --- | --- | --- |
| Platform-wide shared program catalog | Per-club independent programs | The same programs recur across clubs; defining each once means every club benefits and no one re-authors duplicates. |
| Two levels: a program with one or more levels | Flat, single-level offerings | A broad program spans several targeted levels (age / skill); the two-level shape matches how clubs describe their offerings. |
| Level definition shared; **fee and availability per club** | Everything shared / everything per-club | The offering is standard across clubs, but price and staffing vary by club location. |
| Availability toggled **per level** | Per whole program | A club may be able to staff some levels but not others; per-level control matches "no personnel yet" precisely. |
| **Any** Administrator or Head Coach may edit or remove a shared program | Only the club that created it | The catalog is communal — no single club owns a shared program. |
| **Unique** program names across the platform | Allow duplicates / silently reuse by name | One shared catalog needs exactly one entry per program; duplicates would fragment it. |
| **All members view**, Administrator/Head Coach manage | Administrator/Head Coach only / public | Members should see what their club offers; managing stays with the club's leaders. |
| Sub-item is a **"level"** | "variation" / "class" / "session" | Clubs think in age / skill levels; "class" and "session" are reserved for a later scheduling layer. |
| **Skills deferred** to a future class/session layer beneath a level | Skills on the program or level now | Skills describe what a specific class or session develops; they belong one layer deeper, in a later change. |
| Single-level programs are **not** collapsed into one item | Collapse a one-level program into a single item | Dropped for simplicity — a program is always shown as a program with its levels, even when there is one. |

## Constraints the journey places on implementation

- A program has a **name** (required) and a **description** (required). Program names are **unique across the whole platform**; a duplicate on create or rename is rejected with "A program with this name already exists."
- A program has **at least one level at all times**; removing the last level is rejected with "A program must have at least one level."
- Each level requires a **name**, an **age group**, a **description**, a **default fee**, and a **capacity**. The fee must not be negative; the capacity must be a positive whole number.
- A program and its levels are a **single shared definition** seen by every club; creating, editing, or removing them affects every club.
- Each club may set its **own fee** for a level, overriding the platform default for that club only.
- Each club may set each level's **availability** (on or off) for that club only; levels are **available by default**.
- **Only** a club's Administrator or Head Coach may create, edit, or remove programs and levels, set per-club fees, or change availability. **All** club members may view the programs and their levels, showing their club's fee and availability.
- **Capacity** is captured now for use by a future class/session scheduling capability; this change only records it.
