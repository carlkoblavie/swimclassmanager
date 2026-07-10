# Swimming Class — Test Plan

> Stack: AdonisJS + Inertia React
> Source: `.flow/changes/swimming-class/blueprint.md`
> Date: 2026-07-10

## Summary

This plan locks the test contract for school-scoped swimming classes: class viewing, manager-only authoring, schedules, stages, skills, pending instructors, cancellation, and program-entry integration. Browser tests cover user-observable routes and UI; unit service tests cover invalid domain states that the UI should not let a user select.

## Pre-implementation requirements

- `database/factories/organisation_factory.ts` — create premium/non-premium organisations for skill-scope and active-context tests.
- `database/factories/skill_factory.ts` — create school-specific and platform default skills.
- `database/factories/swimming_class_factory.ts` — seed class series for read/update/cancel tests without depending on create flow.
- `database/factories/swimming_class_weekday_factory.ts` — seed selected weekdays for edit-form and schedule-state setup.
- `database/factories/swimming_class_session_factory.ts` — seed generated, cancelled, past, and future sessions.
- `database/factories/class_stage_factory.ts` — seed ordered class progression stages.
- `database/factories/class_stage_skill_factory.ts` — seed stage-skill pivot rows.
- Update `tests/helpers.ts` `joinSchool()` to set the joined school's organisation as active when present, so active-school tests also satisfy active-organisation context.

## Coverage decisions

Reads: testing.md

> This is the scope inventory for this change — every behavior the change makes observable, with a coverage decision per row. It is not the test list.

| Observable behavior | Decision | Notes |
| ------------------- | -------- | ----- |
| Role catalog still contains the six defined school roles | keep | `tests/unit/roles/seed.spec.ts`:contains the six defined roles |
| `class.view` permission exists for every school role | add | — |
| `class.manage` permission exists for Administrator and Head Coach/Head Teacher only | add | — |
| `/classes` unauthenticated visit redirects to sign-in | add | — |
| `/classes` incomplete-profile visit redirects to complete-profile | add | — |
| `/classes` completed user without active school redirects to school creation | add | — |
| Parent/student/teacher school member can reach the classes index | add | — |
| Non-manager school member cannot reach the class creation page | add | — |
| Classes index empty state text `"No classes yet."` | add | — |
| Classes index lists only active-school classes | add | — |
| Classes index hides another school's classes | add | — |
| Classes index class card includes class code, name, level/program, instructor, location, capacity, and next session | add | — |
| Classes index cancelled class marker remains visible | add | — |
| Classes index “Create class” control visible to `class.manage` member | add | — |
| Classes index “Create class” control hidden from non-manager member | add | — |
| Class detail page loads only an active-school class | add | — |
| Cross-school class detail id resolves as not found | add | — |
| Class detail renders level/program, instructor, location, capacity, stages, skills, and sessions | add | — |
| Class detail pending instructor badge text `"Pending"` | add | — |
| Class detail cancelled class remains visible | add | — |
| Class detail cancelled session remains visible | add | — |
| Class detail edit/cancel controls visible to `class.manage` member | add | — |
| Class detail edit/cancel controls hidden from non-manager member | add | — |
| Class create form excludes unavailable levels | add | — |
| Class create form preselects an available `levelId` query parameter | add | — |
| Class create form instructor options contain active-school Teacher and Head Coach/Head Teacher memberships only | add | — |
| Class create form skill options contain active-school school-specific skills | add | — |
| Class create form skill options contain platform default skills for premium organisations | add | — |
| Class create form skill options exclude platform default skills for non-premium organisations | add | — |
| Manual class code saved trimmed and uppercased | add | — |
| Blank class code generates a unique school-scoped code | add | — |
| Duplicate class code rejected with `"A class with this code already exists."` | add | — |
| Valid class creation redirects to class detail with `"Class created."` | add | — |
| Valid class creation stores selected weekdays | add | — |
| Valid class creation generates scheduled sessions from date range, weekdays, and meeting time | add | — |
| Valid class creation stores ordered stages | add | — |
| Valid class creation stores stage skill attachments | add | — |
| Valid class creation stores inline new school-specific skills | add | — |
| Existing instructor creation links `instructor_membership_id` | add | — |
| Invited Teacher creation links `pending_instructor_invitation_id` | add | — |
| Invited Teacher creation stores invitation `invitee_name` and `invitee_phone` | add | — |
| Invited Teacher creation queues `InvitationMail` | add | — |
| Invited Teacher creation flashes `"Teacher invited."` | add | — |
| Failed class creation queues no Teacher invitation mail | add | — |
| Capacity above selected level capacity rejected with `"Class capacity cannot exceed the level capacity."` | add | — |
| Unavailable selected level rejected | add | — |
| Existing instructor without Teacher or Head Coach/Head Teacher role rejected | add | — |
| Cross-school instructor membership rejected | add | — |
| Stage list with no stages rejected | add | — |
| Stage with no skills rejected | add | — |
| Skill unavailable to the active school rejected | add | — |
| Date range and weekdays producing no sessions rejected | add | — |
| Start time not earlier than end time rejected | add | — |
| Class edit form renders existing class values, stages, skills, schedule, and instructor state | add | — |
| Valid class update redirects to detail with `"Class updated."` | add | — |
| Class update preserves past sessions when schedule changes | add | — |
| Class update regenerates future sessions when schedule changes | add | — |
| Class update can replace stages and skills without leaving an empty stage | add | — |
| Class update can invite a pending Teacher and flash `"Teacher invited."` | add | — |
| Class cancellation redirects to detail with `"Class cancelled."` | add | — |
| Class cancellation sets `cancelled_at` without deleting class rows | add | — |
| Session cancellation redirects to class detail with `"Session cancelled."` | add | — |
| Session cancellation sets `cancelled_at` without deleting the session row | add | — |
| Cross-school session cancellation resolves as not found | add | — |
| Invalid cancellation intent through visible UI | skip | unreachable — forms submit fixed hidden `intent=cancel` |
| Platform default skill editing | skip | no edit route/UI in this change; defaults are read-only choices |
| Premium purchase or billing-status UI | skip | no billing workflow/UI in this change; premium is existing organisation state used by skills |
| Program index still lists programs with levels and fees | keep | `tests/browser/programs/index.spec.ts`:lists programs with their levels and each level fee |
| Program index empty catalog message still appears | keep | `tests/browser/programs/index.spec.ts`:shows an empty-catalog message |
| Program index still scopes level fee and availability to viewing school | keep | `tests/browser/programs/index.spec.ts`:a level fee and availability reflect the viewing school, not another school |
| Available program level shows “Create class” link for `class.manage` member | add | — |
| Unavailable program level has no “Create class” link | add | — |
| Non-manager program viewer has no “Create class” link | change | `tests/browser/programs/authorization.spec.ts`:a non-manager member does not see the manage controls |
| Program create/edit authorization remains unchanged | keep | `tests/browser/programs/authorization.spec.ts`:a non-manager is denied a manage route ({heading}) |
| School level fee override still updates displayed fee | keep | `tests/browser/level_settings/update.spec.ts`:setting a school's fee override updates the school displayed fee |
| School level availability toggle still updates school display | keep | `tests/browser/level_settings/update.spec.ts`:turning a level availability off updates the school display |
| Clearing a school fee override still restores default fee | keep | `tests/browser/level_settings/update.spec.ts`:clearing a fee override restores the default |
| Standalone invitation creation still queues email and creates pending invitation | keep | `tests/browser/invitations/store.spec.ts`:an inviter sends an invitation, queuing the email and creating a pending invitation ({inviterRole}) |
| Standalone invitation form remains denied to member without invite permission | keep | `tests/browser/invitations/store.spec.ts`:a member without invite permission cannot reach the invite form |
| Standalone invitation invalid email still queues no mail | keep | `tests/browser/invitations/store.spec.ts`:rejects an invalid email and queues no mail |
| Standalone invitation to existing member still rejected | keep | `tests/browser/invitations/store.spec.ts`:rejects inviting an existing member and queues no mail |
| Standalone re-invite still refreshes one pending invitation | keep | `tests/browser/invitations/store.spec.ts`:re-inviting a pending email refreshes the single invitation and queues mail |
| Class-created Teacher invitation acceptance creates Teacher membership | add | — |
| Class-created Teacher invitation acceptance resolves pending instructor to active instructor | add | — |
| Existing invitation token for new email still creates account and joins school | keep | `tests/browser/memberships/store.spec.ts`:a valid token for a new email creates the account, joins with the role, and lands on complete-profile |
| Existing invitation token for completed user still signs in, joins, and lands on dashboard | keep | `tests/browser/memberships/store.spec.ts`:a valid token for an existing completed user signs in, joins, and lands on the school dashboard |
| Expired invitation link still shows expired message and does not join | keep | `tests/browser/memberships/store.spec.ts`:an expired invitation link shows the expired message and does not join |
| Already-accepted invitation token still creates no duplicate membership | keep | `tests/browser/memberships/store.spec.ts`:an already-accepted token re-opened signs in and creates no duplicate membership |
| Superseded invitation token still no longer accepts | keep | `tests/browser/memberships/store.spec.ts`:a superseded (old) token after a re-send no longer accepts |

## Test list (ordered)

Reads: testing.md

1. T1 [browser] — unauthenticated visitors cannot open the classes index
2. T2 [browser] — incomplete-profile users cannot open the classes index
3. T3 [browser] — users without an active school cannot open the classes index
4. T4 [browser] — every school role can view the classes index
5. T5 [browser] — only class managers can open the class creation page
6. T6 [browser] — members see the empty classes state
7. T7 [browser] — members see only classes from their active school
8. T8 [browser] — cancelled classes remain listed as cancelled
9. T9 [browser] — class managers see the create-class entry point on the index
10. T10 [browser] — non-managers do not see the create-class entry point on the index
11. T11 [browser] — members can view a class detail with its progression and schedule
12. T12 [browser] — members cannot view another school's class detail
13. T13 [browser] — pending instructors are shown as pending on class detail
14. T14 [browser] — cancelled classes and sessions remain visible on class detail
15. T15 [browser] — class managers see edit and cancel controls on class detail
16. T16 [browser] — non-managers do not see edit or cancel controls on class detail
17. T17 [browser] — managers create a class from an available program level
18. T18 [browser] — unavailable program levels cannot be selected for class creation
19. T19 [browser] — instructor choices are limited to active-school Teachers and Head Coaches
20. T20 [browser] — skill choices follow school and organisation premium scope
21. T21 [browser] — managers create a class with a manual code and existing instructor
22. T22 [browser] — blank class codes are generated per school
23. T23 [browser] — class creation generates scheduled sessions
24. T24 [browser] — class creation stores ordered stages and skills
25. T25 [browser] — managers invite a pending Teacher while creating a class
26. T26 [browser] — duplicate class codes are rejected
27. T27 [browser] — capacity above the level capacity is rejected
28. T28 [browser] — schedules that produce no sessions are rejected
29. T29 [browser] — failed pending-Teacher class creation queues no mail
30. T30 [unit] — unavailable levels cannot be used for class creation
31. T31 [unit] — existing instructors must be eligible active-school members
32. T32 [unit] — every class must keep at least one stage with at least one skill
33. T33 [unit] — submitted skill ids must be available to the active school
34. T34 [unit] — class meeting times must end after they start
35. T35 [browser] — managers edit an existing class from its current values
36. T36 [browser] — managers update class details and progression
37. T37 [browser] — schedule edits preserve past sessions and regenerate future sessions
38. T38 [browser] — managers invite a pending Teacher while editing a class
39. T39 [browser] — managers cancel a class without deleting it
40. T40 [browser] — managers cancel one generated session without deleting it
41. T41 [browser] — managers cannot cancel another school's session
42. T42 [browser] — class managers can start a class from an available program level
43. T43 [browser] — unavailable levels and non-managers have no program-level create-class link
44. T44 [browser] — accepting a pending instructor invitation makes the Teacher the active class instructor

## Per-test contracts

Reads: testing.md

### Test 1 — unauthenticated visitors cannot open the classes index

- **Surface:** `SwimmingClassesController.index` route middleware
- **Suite:** browser
- **Setup:**
  - Factories: none
  - Fakes: none
  - Auth: none
  - Other: roles not required
- **Action:** Visit `swimming_classes.index`.
- **Outcome contract:**
  - Post-action URL: sign-in page, `sign_in_links.create`
  - Rendered DOM: class index content is not rendered
  - DB / fake / exception assertions: none
- **Does NOT assert:** exact middleware internals or permission JSON.
- **Why:** Locks that class routes use the standard authenticated route chain.

### Test 2 — incomplete-profile users cannot open the classes index

- **Surface:** `SwimmingClassesController.index` route middleware
- **Suite:** browser
- **Setup:**
  - Factories: `UserFactory`
  - Fakes: none
  - Auth: signed-in user without completed profile
  - Other: no school required
- **Action:** Visit `swimming_classes.index`.
- **Outcome contract:**
  - Post-action URL: `accounts.edit`
  - Rendered DOM: class index content is not rendered
  - DB / fake / exception assertions: none
- **Does NOT assert:** account form details beyond the redirect target.
- **Why:** Locks that class routes respect the completed-profile gate.

### Test 3 — users without an active school cannot open the classes index

- **Surface:** `SwimmingClassesController.index` route middleware
- **Suite:** browser
- **Setup:**
  - Factories: `UserFactory`
  - Fakes: none
  - Auth: signed-in completed user with no active school
  - Other: roles not required
- **Action:** Visit `swimming_classes.index`.
- **Outcome contract:**
  - Post-action URL: `schools.create`
  - Rendered DOM: class index content is not rendered
  - DB / fake / exception assertions: none
- **Does NOT assert:** school creation form fields.
- **Why:** Locks that class routes require active school context.

### Test 4 — every school role can view the classes index

- **Surface:** `SwimmingClassesController.index` authorization
- **Suite:** browser
- **Setup:**
  - Factories: `UserFactory`, `OrganisationFactory`, `SchoolFactory`
  - Fakes: none
  - Auth: signed-in completed user
  - Other: `seedRoles()`; parameterized `joinSchool()` for Administrator, Head Coach/Head Teacher, Teacher, Deck Supervisor, Parent, Student
- **Action:** Visit `swimming_classes.index`.
- **Outcome contract:**
  - Post-action URL: `swimming_classes.index`
  - Rendered DOM: classes page is visible; empty state `"No classes yet."` appears
  - DB / fake / exception assertions: none
- **Does NOT assert:** create/edit/cancel controls; those are locked by manager-specific tests.
- **Why:** Locks that `class.view` is granted to every school role.

### Test 5 — only class managers can open the class creation page

- **Surface:** `SwimmingClassesController.create` authorization
- **Suite:** browser
- **Setup:**
  - Factories: `UserFactory`, `OrganisationFactory`, `SchoolFactory`, `ProgramFactory`, `LevelFactory`
  - Fakes: none
  - Auth: signed-in completed school member
  - Other: `seedRoles()`; parameterized by school role
- **Action:** Visit `swimming_classes.create`.
- **Outcome contract:**
  - Post-action URL: managers remain on the create route; non-managers do not see the create form
  - Rendered DOM: Administrator and Head Coach/Head Teacher see the create-class heading/form; Teacher, Deck Supervisor, Parent, and Student do not
  - DB / fake / exception assertions: none
- **Does NOT assert:** form option filtering; separate create-form tests cover that.
- **Why:** Locks that `class.manage` is limited to Administrator and Head Coach/Head Teacher.

### Test 6 — members see the empty classes state

- **Surface:** `SwimmingClassesController.index`
- **Suite:** browser
- **Setup:**
  - Factories: `UserFactory`, `OrganisationFactory`, `SchoolFactory`
  - Fakes: none
  - Auth: signed-in active-school member
  - Other: `seedRoles()`; any role with `class.view`
- **Action:** Visit `swimming_classes.index`.
- **Outcome contract:**
  - Post-action URL: `swimming_classes.index`
  - Rendered DOM: `"No classes yet."`
  - DB / fake / exception assertions: none
- **Does NOT assert:** create button visibility.
- **Why:** Locks the member-facing empty state for a school with no classes.

### Test 7 — members see only classes from their active school

- **Surface:** `SwimmingClassesController.index`
- **Suite:** browser
- **Setup:**
  - Factories: `UserFactory`, `OrganisationFactory`, `SchoolFactory`, `ProgramFactory`, `LevelFactory`, `SwimmingClassFactory`, `SwimmingClassSessionFactory`
  - Fakes: none
  - Auth: signed-in member of school A
  - Other: create one class for school A and one class for school B
- **Action:** Visit `swimming_classes.index`.
- **Outcome contract:**
  - Post-action URL: `swimming_classes.index`
  - Rendered DOM: school A class card shows code, name, level/program, instructor label, location, capacity, and next session; school B class code/name is absent
  - DB / fake / exception assertions: none
- **Does NOT assert:** full stage/session detail; class detail tests cover that.
- **Why:** Locks active-school query segregation on the classes index.

### Test 8 — cancelled classes remain listed as cancelled

- **Surface:** `SwimmingClassesController.index`
- **Suite:** browser
- **Setup:**
  - Factories: `UserFactory`, `OrganisationFactory`, `SchoolFactory`, `ProgramFactory`, `LevelFactory`, `SwimmingClassFactory`, `SwimmingClassSessionFactory`
  - Fakes: none
  - Auth: signed-in active-school member
  - Other: class has `cancelled_at` set
- **Action:** Visit `swimming_classes.index`.
- **Outcome contract:**
  - Post-action URL: `swimming_classes.index`
  - Rendered DOM: cancelled class code/name remains visible with cancelled marker
  - DB / fake / exception assertions: none
- **Does NOT assert:** cancellation action; cancellation tests cover mutation.
- **Why:** Locks the “cancelled means visible and marked, not hidden” rule.

### Test 9 — class managers see the create-class entry point on the index

- **Surface:** `SwimmingClassesController.index` response/UI gate
- **Suite:** browser
- **Setup:**
  - Factories: `UserFactory`, `OrganisationFactory`, `SchoolFactory`
  - Fakes: none
  - Auth: signed-in Administrator or Head Coach/Head Teacher
  - Other: `seedRoles()`
- **Action:** Visit `swimming_classes.index`.
- **Outcome contract:**
  - Post-action URL: `swimming_classes.index`
  - Rendered DOM: “Create class” control is visible
  - DB / fake / exception assertions: none
- **Does NOT assert:** create form contents.
- **Why:** Locks the frontend `class.manage` affordance on the index.

### Test 10 — non-managers do not see the create-class entry point on the index

- **Surface:** `SwimmingClassesController.index` response/UI gate
- **Suite:** browser
- **Setup:**
  - Factories: `UserFactory`, `OrganisationFactory`, `SchoolFactory`
  - Fakes: none
  - Auth: signed-in Teacher, Deck Supervisor, Parent, or Student
  - Other: `seedRoles()`; parameterized by non-manager role
- **Action:** Visit `swimming_classes.index`.
- **Outcome contract:**
  - Post-action URL: `swimming_classes.index`
  - Rendered DOM: classes page is visible; “Create class” control is absent
  - DB / fake / exception assertions: none
- **Does NOT assert:** route-level denial; T5 covers denied create-route access.
- **Why:** Locks that view-only members cannot start class management from the index.

### Test 11 — members can view a class detail with its progression and schedule

- **Surface:** `SwimmingClassesController.show`
- **Suite:** browser
- **Setup:**
  - Factories: `UserFactory`, `OrganisationFactory`, `SchoolFactory`, `ProgramFactory`, `LevelFactory`, `SkillFactory`, `SwimmingClassFactory`, `SwimmingClassSessionFactory`, `ClassStageFactory`, `ClassStageSkillFactory`
  - Fakes: none
  - Auth: signed-in active-school member
  - Other: class has active instructor membership, ordered stages, skills, and sessions
- **Action:** Visit `swimming_classes.show`.
- **Outcome contract:**
  - Post-action URL: `swimming_classes.show`
  - Rendered DOM: class name/code, level/program, instructor label, location, capacity, ordered stages, skill labels, and generated session times are visible
  - DB / fake / exception assertions: none
- **Does NOT assert:** edit/cancel controls.
- **Why:** Locks the full member-visible class detail response.

### Test 12 — members cannot view another school's class detail

- **Surface:** `SwimmingClassesController.show`
- **Suite:** browser
- **Setup:**
  - Factories: `UserFactory`, `OrganisationFactory`, `SchoolFactory`, `ProgramFactory`, `LevelFactory`, `SwimmingClassFactory`
  - Fakes: none
  - Auth: signed-in member of school A
  - Other: target class belongs to school B
- **Action:** Visit `swimming_classes.show` for the school B class id.
- **Outcome contract:**
  - Post-action URL: not the visible school B detail page
  - Rendered DOM: school B class code/name/detail content is not rendered
  - DB / fake / exception assertions: none
- **Does NOT assert:** exact 404 template copy.
- **Why:** Locks active-school ownership lookup for class detail.

### Test 13 — pending instructors are shown as pending on class detail

- **Surface:** `SwimmingClassesController.show`
- **Suite:** browser
- **Setup:**
  - Factories: `UserFactory`, `OrganisationFactory`, `SchoolFactory`, `ProgramFactory`, `LevelFactory`, `InvitationFactory`, `SwimmingClassFactory`
  - Fakes: none
  - Auth: signed-in active-school member
  - Other: class has `pending_instructor_invitation_id` and no `instructor_membership_id`
- **Action:** Visit `swimming_classes.show`.
- **Outcome contract:**
  - Post-action URL: `swimming_classes.show`
  - Rendered DOM: pending invitee label/email is visible; `"Pending"` badge is visible
  - DB / fake / exception assertions: none
- **Does NOT assert:** invitation acceptance.
- **Why:** Locks the pending-instructor display state.

### Test 14 — cancelled classes and sessions remain visible on class detail

- **Surface:** `SwimmingClassesController.show`
- **Suite:** browser
- **Setup:**
  - Factories: `UserFactory`, `OrganisationFactory`, `SchoolFactory`, `ProgramFactory`, `LevelFactory`, `SkillFactory`, `SwimmingClassFactory`, `SwimmingClassSessionFactory`, `ClassStageFactory`, `ClassStageSkillFactory`
  - Fakes: none
  - Auth: signed-in active-school member
  - Other: class has `cancelled_at`; one session also has `cancelled_at`
- **Action:** Visit `swimming_classes.show`.
- **Outcome contract:**
  - Post-action URL: `swimming_classes.show`
  - Rendered DOM: cancelled class remains visible with cancelled marker; cancelled session remains visible with cancelled marker
  - DB / fake / exception assertions: none
- **Does NOT assert:** mutation timestamps.
- **Why:** Locks cancellation visibility for both series and sessions.

### Test 15 — class managers see edit and cancel controls on class detail

- **Surface:** `SwimmingClassesController.show` response/UI gate
- **Suite:** browser
- **Setup:**
  - Factories: `UserFactory`, `OrganisationFactory`, `SchoolFactory`, `ProgramFactory`, `LevelFactory`, `SwimmingClassFactory`, `SwimmingClassSessionFactory`
  - Fakes: none
  - Auth: signed-in Administrator or Head Coach/Head Teacher
  - Other: `seedRoles()`
- **Action:** Visit `swimming_classes.show`.
- **Outcome contract:**
  - Post-action URL: `swimming_classes.show`
  - Rendered DOM: edit link, class cancel control, and session cancel control are visible
  - DB / fake / exception assertions: none
- **Does NOT assert:** confirmation modal behavior.
- **Why:** Locks manager affordances on detail.

### Test 16 — non-managers do not see edit or cancel controls on class detail

- **Surface:** `SwimmingClassesController.show` response/UI gate
- **Suite:** browser
- **Setup:**
  - Factories: `UserFactory`, `OrganisationFactory`, `SchoolFactory`, `ProgramFactory`, `LevelFactory`, `SwimmingClassFactory`, `SwimmingClassSessionFactory`
  - Fakes: none
  - Auth: signed-in Teacher, Deck Supervisor, Parent, or Student
  - Other: `seedRoles()`; parameterized by non-manager role
- **Action:** Visit `swimming_classes.show`.
- **Outcome contract:**
  - Post-action URL: `swimming_classes.show`
  - Rendered DOM: class detail content is visible; edit link, class cancel control, and session cancel control are absent
  - DB / fake / exception assertions: none
- **Does NOT assert:** direct write-route denial.
- **Why:** Locks view-only detail access.

### Test 17 — managers create a class from an available program level

- **Surface:** `SwimmingClassesController.create`
- **Suite:** browser
- **Setup:**
  - Factories: `UserFactory`, `OrganisationFactory`, `SchoolFactory`, `ProgramFactory`, `LevelFactory`
  - Fakes: none
  - Auth: signed-in class manager
  - Other: selected level is available for active school
- **Action:** Visit `swimming_classes.create` with `levelId` query string.
- **Outcome contract:**
  - Post-action URL: `swimming_classes.create`
  - Rendered DOM: create form is visible; selected level option is preselected
  - DB / fake / exception assertions: none
- **Does NOT assert:** final creation submit.
- **Why:** Locks the program-level entry point into class creation.

### Test 18 — unavailable program levels cannot be selected for class creation

- **Surface:** `SwimmingClassesController.create`
- **Suite:** browser
- **Setup:**
  - Factories: `UserFactory`, `OrganisationFactory`, `SchoolFactory`, `ProgramFactory`, `LevelFactory`, `SchoolLevelSettingFactory`
  - Fakes: none
  - Auth: signed-in class manager
  - Other: one level available; one level unavailable for active school
- **Action:** Visit `swimming_classes.create`.
- **Outcome contract:**
  - Post-action URL: `swimming_classes.create`
  - Rendered DOM: available level appears in the level picker; unavailable level does not appear
  - DB / fake / exception assertions: none
- **Does NOT assert:** service-level rejection of forged unavailable level; T30 covers it.
- **Why:** Locks create-form level picker segregation.

### Test 19 — instructor choices are limited to active-school Teachers and Head Coaches

- **Surface:** `SwimmingClassesController.create`
- **Suite:** browser
- **Setup:**
  - Factories: `UserFactory`, `OrganisationFactory`, `SchoolFactory`
  - Fakes: none
  - Auth: signed-in class manager
  - Other: active-school Teacher, active-school Head Coach/Head Teacher, active-school Parent/Student, and another-school Teacher memberships
- **Action:** Visit `swimming_classes.create`.
- **Outcome contract:**
  - Post-action URL: `swimming_classes.create`
  - Rendered DOM: Teacher and Head Coach/Head Teacher instructor labels are visible; Parent/Student and another-school Teacher labels are absent
  - DB / fake / exception assertions: none
- **Does NOT assert:** forged instructor id submission; T31 covers it.
- **Why:** Locks instructor picker eligibility and school scope.

### Test 20 — skill choices follow school and organisation premium scope

- **Surface:** `SwimmingClassesController.create`
- **Suite:** browser
- **Setup:**
  - Factories: `UserFactory`, `OrganisationFactory`, `SchoolFactory`, `SkillFactory`
  - Fakes: none
  - Auth: signed-in class manager
  - Other: parameterized premium and non-premium organisation; active-school skill, another-school skill, and platform default skill exist
- **Action:** Visit `swimming_classes.create`.
- **Outcome contract:**
  - Post-action URL: `swimming_classes.create`
  - Rendered DOM: active-school skill is visible; another-school skill is absent; platform default skill is visible only for premium organisations
  - DB / fake / exception assertions: none
- **Does NOT assert:** editing platform defaults.
- **Why:** Locks premium organisation skill availability in the class form.

### Test 21 — managers create a class with a manual code and existing instructor

- **Surface:** `SwimmingClassesController.store`
- **Suite:** browser
- **Setup:**
  - Factories: `UserFactory`, `OrganisationFactory`, `SchoolFactory`, `ProgramFactory`, `LevelFactory`, `SkillFactory`
  - Fakes: none
  - Auth: signed-in class manager
  - Other: eligible instructor membership and at least one available skill
- **Action:** Submit the create-class form with a manual code containing lowercase/extra whitespace and existing-instructor mode.
- **Outcome contract:**
  - Post-action URL: `swimming_classes.show` for the created class
  - Rendered DOM: `"Class created."` flash is visible; class code is rendered trimmed and uppercased; instructor label is rendered as active
  - DB / fake / exception assertions: `swimming_classes` row exists for active school with normalized code and `instructor_membership_id`
- **Does NOT assert:** session count or stage-skill persistence; those have dedicated tests.
- **Why:** Locks the thinnest successful class creation workflow.

### Test 22 — blank class codes are generated per school

- **Surface:** `SwimmingClassesController.store`
- **Suite:** browser
- **Setup:**
  - Factories: `UserFactory`, `OrganisationFactory`, `SchoolFactory`, `ProgramFactory`, `LevelFactory`, `SkillFactory`
  - Fakes: none
  - Auth: signed-in class manager
  - Other: eligible instructor membership and at least one available skill
- **Action:** Submit the create-class form with an empty code.
- **Outcome contract:**
  - Post-action URL: `swimming_classes.show` for the created class
  - Rendered DOM: generated class code is visible on detail
  - DB / fake / exception assertions: created class has non-empty code unique within its school
- **Does NOT assert:** exact code-generation algorithm.
- **Why:** Locks blank-code auto-generation without coupling tests to the generator format.

### Test 23 — class creation generates scheduled sessions

- **Surface:** `SwimmingClassesController.store`
- **Suite:** browser
- **Setup:**
  - Factories: `UserFactory`, `OrganisationFactory`, `SchoolFactory`, `ProgramFactory`, `LevelFactory`, `SkillFactory`
  - Fakes: none
  - Auth: signed-in class manager
  - Other: eligible instructor and one available skill
- **Action:** Submit the create-class form with date range, selected weekdays, start time, and end time.
- **Outcome contract:**
  - Post-action URL: `swimming_classes.show`
  - Rendered DOM: generated session dates/times for matching weekdays are visible
  - DB / fake / exception assertions: expected `swimming_class_sessions` rows exist; selected `swimming_class_weekdays` rows exist
- **Does NOT assert:** visual calendar layout.
- **Why:** Locks recurring schedule generation from date range and weekdays.

### Test 24 — class creation stores ordered stages and skills

- **Surface:** `SwimmingClassesController.store`
- **Suite:** browser
- **Setup:**
  - Factories: `UserFactory`, `OrganisationFactory`, `SchoolFactory`, `ProgramFactory`, `LevelFactory`, `SkillFactory`
  - Fakes: none
  - Auth: signed-in class manager
  - Other: eligible instructor; existing available skill
- **Action:** Submit the create-class form with multiple ordered stages, existing skills, and one inline new skill.
- **Outcome contract:**
  - Post-action URL: `swimming_classes.show`
  - Rendered DOM: stages render in submitted order; existing and new skill labels appear under the correct stages
  - DB / fake / exception assertions: `class_stages`, `class_stage_skills`, and school-specific `skills` rows exist
- **Does NOT assert:** skill picker UI internals.
- **Why:** Locks class progression authoring.

### Test 25 — managers invite a pending Teacher while creating a class

- **Surface:** `SwimmingClassesController.store`
- **Suite:** browser
- **Setup:**
  - Factories: `UserFactory`, `OrganisationFactory`, `SchoolFactory`, `ProgramFactory`, `LevelFactory`, `SkillFactory`
  - Fakes: `mail.fake()`
  - Auth: signed-in class manager
  - Other: Teacher role exists; form uses invite-instructor mode with email, name, and phone
- **Action:** Submit the create-class form with pending Teacher invite details.
- **Outcome contract:**
  - Post-action URL: `swimming_classes.show`
  - Rendered DOM: `"Class created."`, `"Teacher invited."`, pending instructor label, and `"Pending"` badge are visible
  - DB / fake / exception assertions: class has `pending_instructor_invitation_id` and no `instructor_membership_id`; invitation row has Teacher role, `invitee_name`, and `invitee_phone`; `InvitationMail` is queued to the invitee email
- **Does NOT assert:** email template body.
- **Why:** Locks the class-created pending instructor workflow.

### Test 26 — duplicate class codes are rejected

- **Surface:** `SwimmingClassesController.store` validation
- **Suite:** browser
- **Setup:**
  - Factories: `UserFactory`, `OrganisationFactory`, `SchoolFactory`, `ProgramFactory`, `LevelFactory`, `SkillFactory`, `SwimmingClassFactory`
  - Fakes: none
  - Auth: signed-in class manager
  - Other: active school already has a class with the submitted code
- **Action:** Submit the create-class form with the duplicate code.
- **Outcome contract:**
  - Post-action URL: create flow remains active
  - Rendered DOM: `"A class with this code already exists."`
  - DB / fake / exception assertions: no additional class row is created
- **Does NOT assert:** duplicate handling across different schools.
- **Why:** Locks school-scoped class code uniqueness.

### Test 27 — capacity above the level capacity is rejected

- **Surface:** `SwimmingClassesController.store` / `ClassSeriesAuthoringService.create`
- **Suite:** browser
- **Setup:**
  - Factories: `UserFactory`, `OrganisationFactory`, `SchoolFactory`, `ProgramFactory`, `LevelFactory`, `SkillFactory`
  - Fakes: none
  - Auth: signed-in class manager
  - Other: selected level has lower capacity than submitted class capacity
- **Action:** Submit the create-class form with capacity above the level capacity.
- **Outcome contract:**
  - Post-action URL: create flow remains active
  - Rendered DOM: exact error text `"Class capacity cannot exceed the level capacity."`
  - DB / fake / exception assertions: no class row is created
- **Does NOT assert:** other business-rule messages.
- **Why:** Locks the retained exact capacity failure message.

### Test 28 — schedules that produce no sessions are rejected

- **Surface:** `SwimmingClassesController.store` / `ClassScheduleGenerationService.generate`
- **Suite:** browser
- **Setup:**
  - Factories: `UserFactory`, `OrganisationFactory`, `SchoolFactory`, `ProgramFactory`, `LevelFactory`, `SkillFactory`
  - Fakes: none
  - Auth: signed-in class manager
  - Other: valid instructor and skill; date range and selected weekday do not overlap
- **Action:** Submit the create-class form with a schedule that has no matching dates.
- **Outcome contract:**
  - Post-action URL: create flow remains active
  - Rendered DOM: recoverable schedule error explaining that no sessions can be generated
  - DB / fake / exception assertions: no class or session rows are created
- **Does NOT assert:** exact copy for this non-specified business error.
- **Why:** Locks the at-least-one-generated-session invariant.

### Test 29 — failed pending-Teacher class creation queues no mail

- **Surface:** `SwimmingClassesController.store` transaction / mail side effect
- **Suite:** browser
- **Setup:**
  - Factories: `UserFactory`, `OrganisationFactory`, `SchoolFactory`, `ProgramFactory`, `LevelFactory`, `SkillFactory`
  - Fakes: `mail.fake()`
  - Auth: signed-in class manager
  - Other: invite-instructor mode plus invalid class payload
- **Action:** Submit pending Teacher invite details with a class payload that fails validation or business rules.
- **Outcome contract:**
  - Post-action URL: create flow remains active
  - Rendered DOM: relevant validation/business error is visible
  - DB / fake / exception assertions: no class row is created; no invitation row is created; no `InvitationMail` is queued
- **Does NOT assert:** every validation branch.
- **Why:** Locks that Teacher invitation mail is not sent for rolled-back class creation.

### Test 30 — unavailable levels cannot be used for class creation

- **Surface:** `ClassSeriesAuthoringService.create`
- **Suite:** unit
- **Setup:**
  - Factories: `UserFactory`, `OrganisationFactory`, `SchoolFactory`, `ProgramFactory`, `LevelFactory`, `SchoolLevelSettingFactory`, `SkillFactory`
  - Fakes: none
  - Auth: none; pass real manager user and school model to service
  - Other: level is unavailable for school
- **Action:** Call the authoring workflow with the unavailable level id.
- **Outcome contract:**
  - Post-action URL: none
  - Rendered DOM: none
  - DB / fake / exception assertions: rejects with `ClassAuthoringException` for unavailable level; no class row is created
- **Does NOT assert:** controller redirects or flash.
- **Why:** Locks a domain invariant that the UI should normally prevent selecting.

### Test 31 — existing instructors must be eligible active-school members

- **Surface:** `ClassSeriesAuthoringService.create`
- **Suite:** unit
- **Setup:**
  - Factories: `UserFactory`, `OrganisationFactory`, `SchoolFactory`, `ProgramFactory`, `LevelFactory`, `SkillFactory`
  - Fakes: none
  - Auth: none; pass real manager user and school model to service
  - Other: parameterized invalid instructor memberships: wrong role and another-school Teacher
- **Action:** Call the authoring workflow with invalid `instructorMembershipId`.
- **Outcome contract:**
  - Post-action URL: none
  - Rendered DOM: none
  - DB / fake / exception assertions: rejects with `ClassAuthoringException` for invalid instructor; no class row is created
- **Does NOT assert:** instructor picker filtering.
- **Why:** Locks instructor eligibility at the domain boundary.

### Test 32 — every class must keep at least one stage with at least one skill

- **Surface:** `ClassSeriesAuthoringService.create`
- **Suite:** unit
- **Setup:**
  - Factories: `UserFactory`, `OrganisationFactory`, `SchoolFactory`, `ProgramFactory`, `LevelFactory`
  - Fakes: none
  - Auth: none; pass real manager user and school model to service
  - Other: parameterized invalid stage payload: no stages, stage without `skillIds` or `newSkills`
- **Action:** Call the authoring workflow with invalid stage data.
- **Outcome contract:**
  - Post-action URL: none
  - Rendered DOM: none
  - DB / fake / exception assertions: rejects with `ClassAuthoringException` for invalid stages; no class row is created
- **Does NOT assert:** client-side stage modal checks.
- **Why:** Locks progression completeness when payloads bypass UI affordances.

### Test 33 — submitted skill ids must be available to the active school

- **Surface:** `ClassSeriesAuthoringService.create`
- **Suite:** unit
- **Setup:**
  - Factories: `UserFactory`, `OrganisationFactory`, `SchoolFactory`, `ProgramFactory`, `LevelFactory`, `SkillFactory`
  - Fakes: none
  - Auth: none; pass real manager user and school model to service
  - Other: parameterized unavailable skills: another-school skill and platform default skill for non-premium organisation
- **Action:** Call the authoring workflow with an unavailable skill id.
- **Outcome contract:**
  - Post-action URL: none
  - Rendered DOM: none
  - DB / fake / exception assertions: rejects with `ClassAuthoringException` for unavailable skill; no class row, stage row, or pivot row is created
- **Does NOT assert:** premium-visible picker behavior; T20 covers picker scope.
- **Why:** Locks skill availability on the server side.

### Test 34 — class meeting times must end after they start

- **Surface:** `ClassSeriesAuthoringService.create`
- **Suite:** unit
- **Setup:**
  - Factories: `UserFactory`, `OrganisationFactory`, `SchoolFactory`, `ProgramFactory`, `LevelFactory`, `SkillFactory`
  - Fakes: none
  - Auth: none; pass real manager user and school model to service
  - Other: otherwise valid payload with `endTime` not after `startTime`
- **Action:** Call the authoring workflow with invalid meeting times.
- **Outcome contract:**
  - Post-action URL: none
  - Rendered DOM: none
  - DB / fake / exception assertions: rejects with `ClassAuthoringException` for invalid time order; no class or session rows are created
- **Does NOT assert:** time regex validation.
- **Why:** Locks the business rule that regex shape alone cannot express.

### Test 35 — managers edit an existing class from its current values

- **Surface:** `SwimmingClassesController.edit`
- **Suite:** browser
- **Setup:**
  - Factories: `UserFactory`, `OrganisationFactory`, `SchoolFactory`, `ProgramFactory`, `LevelFactory`, `InvitationFactory`, `SkillFactory`, `SwimmingClassFactory`, `SwimmingClassWeekdayFactory`, `SwimmingClassSessionFactory`, `ClassStageFactory`, `ClassStageSkillFactory`
  - Fakes: none
  - Auth: signed-in class manager
  - Other: class has schedule, stages, skills, and instructor state
- **Action:** Visit `swimming_classes.edit`.
- **Outcome contract:**
  - Post-action URL: `swimming_classes.edit`
  - Rendered DOM: existing code/name/location/capacity/date/time/weekdays/instructor/stages/skills are present in the edit form
  - DB / fake / exception assertions: none
- **Does NOT assert:** submit behavior.
- **Why:** Locks edit-form hydration.

### Test 36 — managers update class details and progression

- **Surface:** `SwimmingClassesController.update`
- **Suite:** browser
- **Setup:**
  - Factories: `UserFactory`, `OrganisationFactory`, `SchoolFactory`, `ProgramFactory`, `LevelFactory`, `SkillFactory`, `SwimmingClassFactory`, `SwimmingClassWeekdayFactory`, `SwimmingClassSessionFactory`, `ClassStageFactory`, `ClassStageSkillFactory`
  - Fakes: none
  - Auth: signed-in class manager
  - Other: existing class with stages and skills
- **Action:** Submit the edit form with changed class details, stages, and skills.
- **Outcome contract:**
  - Post-action URL: `swimming_classes.show`
  - Rendered DOM: `"Class updated."`; updated code/name/location/capacity/stages/skills are visible
  - DB / fake / exception assertions: class row updates; stage rows and stage-skill pivots reflect the submitted replacement set
- **Does NOT assert:** schedule regeneration; T37 covers it.
- **Why:** Locks class-series detail and progression updates.

### Test 37 — schedule edits preserve past sessions and regenerate future sessions

- **Surface:** `SwimmingClassesController.update` / `ClassScheduleGenerationService.regenerateFuture`
- **Suite:** browser
- **Setup:**
  - Factories: `UserFactory`, `OrganisationFactory`, `SchoolFactory`, `ProgramFactory`, `LevelFactory`, `SkillFactory`, `SwimmingClassFactory`, `SwimmingClassWeekdayFactory`, `SwimmingClassSessionFactory`, `ClassStageFactory`, `ClassStageSkillFactory`
  - Fakes: none
  - Auth: signed-in class manager
  - Other: one past session and one or more future sessions exist
- **Action:** Submit the edit form with changed schedule fields.
- **Outcome contract:**
  - Post-action URL: `swimming_classes.show`
  - Rendered DOM: `"Class updated."`; new future session dates/times are visible; past session remains visible
  - DB / fake / exception assertions: past session row remains unchanged; old future session rows are replaced by regenerated future session rows
- **Does NOT assert:** class detail field updates unrelated to schedule.
- **Why:** Locks schedule-regeneration semantics.

### Test 38 — managers invite a pending Teacher while editing a class

- **Surface:** `SwimmingClassesController.update`
- **Suite:** browser
- **Setup:**
  - Factories: `UserFactory`, `OrganisationFactory`, `SchoolFactory`, `ProgramFactory`, `LevelFactory`, `InvitationFactory`, `SkillFactory`, `SwimmingClassFactory`, `SwimmingClassWeekdayFactory`, `SwimmingClassSessionFactory`, `ClassStageFactory`, `ClassStageSkillFactory`
  - Fakes: `mail.fake()`
  - Auth: signed-in class manager
  - Other: existing class with active instructor
- **Action:** Submit the edit form changing instructor mode to invite Teacher.
- **Outcome contract:**
  - Post-action URL: `swimming_classes.show`
  - Rendered DOM: `"Class updated."`, `"Teacher invited."`, pending instructor label, and `"Pending"` badge are visible
  - DB / fake / exception assertions: class now has `pending_instructor_invitation_id` and no active instructor membership; invitation snapshot fields are stored; `InvitationMail` is queued
- **Does NOT assert:** invitation acceptance.
- **Why:** Locks pending-instructor reassignment on update.

### Test 39 — managers cancel a class without deleting it

- **Surface:** `SwimmingClassesController.update` cancel intent
- **Suite:** browser
- **Setup:**
  - Factories: `UserFactory`, `OrganisationFactory`, `SchoolFactory`, `ProgramFactory`, `LevelFactory`, `SkillFactory`, `SwimmingClassFactory`, `SwimmingClassSessionFactory`, `ClassStageFactory`, `ClassStageSkillFactory`
  - Fakes: none
  - Auth: signed-in class manager
  - Other: active-school class exists
- **Action:** Confirm class cancellation from class detail.
- **Outcome contract:**
  - Post-action URL: `swimming_classes.show`
  - Rendered DOM: `"Class cancelled."`; cancelled class marker is visible; class detail remains visible
  - DB / fake / exception assertions: class row still exists with `cancelled_at` set
- **Does NOT assert:** exact modal styling.
- **Why:** Locks soft cancellation of class series.

### Test 40 — managers cancel one generated session without deleting it

- **Surface:** `SwimmingClassSessionsController.update`
- **Suite:** browser
- **Setup:**
  - Factories: `UserFactory`, `OrganisationFactory`, `SchoolFactory`, `ProgramFactory`, `LevelFactory`, `SkillFactory`, `SwimmingClassFactory`, `SwimmingClassSessionFactory`, `ClassStageFactory`, `ClassStageSkillFactory`
  - Fakes: none
  - Auth: signed-in class manager
  - Other: active-school class with generated session
- **Action:** Confirm session cancellation from class detail.
- **Outcome contract:**
  - Post-action URL: `swimming_classes.show`
  - Rendered DOM: `"Session cancelled."`; cancelled marker for that session is visible; session remains in the schedule
  - DB / fake / exception assertions: session row still exists with `cancelled_at` set
- **Does NOT assert:** cancelling other sessions.
- **Why:** Locks soft cancellation of individual sessions.

### Test 41 — managers cannot cancel another school's session

- **Surface:** `SwimmingClassSessionsController.update`
- **Suite:** browser
- **Setup:**
  - Factories: `UserFactory`, `OrganisationFactory`, `SchoolFactory`, `ProgramFactory`, `LevelFactory`, `SkillFactory`, `SwimmingClassFactory`, `SwimmingClassSessionFactory`, `ClassStageFactory`, `ClassStageSkillFactory`
  - Fakes: none
  - Auth: signed-in manager of school A
  - Other: target session belongs to school B
- **Action:** Submit session cancellation for the school B session id.
- **Outcome contract:**
  - Post-action URL: not school B class detail
  - Rendered DOM: school B class/session content is not rendered
  - DB / fake / exception assertions: school B session row remains uncancelled
- **Does NOT assert:** exact 404 page text.
- **Why:** Locks active-school ownership on the shallow session update route.

### Test 42 — class managers can start a class from an available program level

- **Surface:** `ProgramsController.index` class entry point
- **Suite:** browser
- **Setup:**
  - Factories: `UserFactory`, `OrganisationFactory`, `SchoolFactory`, `ProgramFactory`, `LevelFactory`
  - Fakes: none
  - Auth: signed-in class manager
  - Other: level is available for active school
- **Action:** Visit programs index and follow the level's “Create class” link.
- **Outcome contract:**
  - Post-action URL: `swimming_classes.create` with selected `levelId`
  - Rendered DOM: “Create class” link is visible on the available level; create form opens with that level preselected
  - DB / fake / exception assertions: none
- **Does NOT assert:** class submission.
- **Why:** Locks the program-level class creation entry point.

### Test 43 — unavailable levels and non-managers have no program-level create-class link

- **Surface:** `ProgramsController.index` class entry point
- **Suite:** browser
- **Setup:**
  - Factories: `UserFactory`, `OrganisationFactory`, `SchoolFactory`, `ProgramFactory`, `LevelFactory`, `SchoolLevelSettingFactory`
  - Fakes: none
  - Auth: signed-in school member
  - Other: parameterized cases: manager viewing unavailable level; non-manager viewing available level
- **Action:** Visit programs index.
- **Outcome contract:**
  - Post-action URL: `programs.index`
  - Rendered DOM: “Create class” link is absent for unavailable level and absent for non-manager viewer
  - DB / fake / exception assertions: none
- **Does NOT assert:** existing program manage controls except the changed class entry point.
- **Why:** Locks availability and permission gates for starting a class from programs.

### Test 44 — accepting a pending instructor invitation makes the Teacher the active class instructor

- **Surface:** `MembershipsController.store` / invitation acceptance workflow
- **Suite:** browser
- **Setup:**
  - Factories: `UserFactory`, `OrganisationFactory`, `SchoolFactory`, `ProgramFactory`, `LevelFactory`, `InvitationFactory`, `SwimmingClassFactory`
  - Fakes: none
  - Auth: none initially; invitation token signs in the invitee through the existing flow
  - Other: pending Teacher invitation is linked to a class as `pending_instructor_invitation_id`; invitee is an existing completed user
- **Action:** Visit the class-created Teacher invitation token.
- **Outcome contract:**
  - Post-action URL: accepted invitee lands on the normal post-acceptance destination
  - Rendered DOM: user is authenticated after acceptance
  - DB / fake / exception assertions: Teacher membership exists for the school; invitation has `accepted_at`; class has `instructor_membership_id` set to the accepted membership and `pending_instructor_invitation_id` cleared
- **Does NOT assert:** generic invitation acceptance branches already covered by existing membership tests; detail-page rendering is covered by T11/T13.
- **Why:** Locks the class-specific pending-instructor resolution when a Teacher accepts.

## Factories audit

Reads: testing.md

| Factory | Existing / New | Tests |
| ------- | -------------- | ----- |
| `UserFactory` | existing | T2–T44 except T1 |
| `SchoolFactory` | existing | T4–T44 |
| `ProgramFactory` | existing | T5, T7–T8, T11–T18, T20–T44 |
| `LevelFactory` | existing | T5, T7–T8, T11–T18, T20–T44 |
| `SchoolLevelSettingFactory` | existing | T18, T30, T43 |
| `InvitationFactory` | existing | T13, T35, T38, T44 |
| `OrganisationFactory` | new | T4–T44 |
| `SkillFactory` | new | T11, T14, T20–T31, T33–T41 |
| `SwimmingClassFactory` | new | T7–T8, T11–T16, T26, T35–T44 |
| `SwimmingClassWeekdayFactory` | new | T35–T38 |
| `SwimmingClassSessionFactory` | new | T7–T8, T11, T14–T16, T35–T41 |
| `ClassStageFactory` | new | T11, T14, T35–T41 |
| `ClassStageSkillFactory` | new | T11, T14, T35–T41 |

## Fakes audit

Reads: testing.md

| Fake / swap | Built-in / swap | Tests | Boundary justification |
| ----------- | --------------- | ----- | ---------------------- |
| `mail.fake()` | built-in | T25, T29, T38 | Built-in harness fake for queued mail side effects; asserts `InvitationMail` queued or not queued. |
| Container swaps | none | — | No own application services, controllers, or models are mocked. |

## Order rationale

Index/detail tests come before create/update because factories can seed class data directly, so read surfaces do not need the create flow to exist first.
Creation-form tests precede creation-submit tests because they lock picker scope before the submit workflow depends on it.
Service business-rule tests follow browser creation tests because browser tests lock the main user workflow first; service tests only cover invalid domain states not economically reachable through the UI.
Program index entry-point tests come after class create-route tests because following the program-level link depends on the class creation page contract.
Pending invitation acceptance comes last because it depends on class-created pending-instructor data and the existing membership acceptance flow.

## Runner-model risks

Reads: testing.md

- DB state leakage across 44 tests — mitigate with `group.each.setup(async () => { const truncate = await testUtils.db().truncate(); await seedRoles(); return truncate })` for groups needing roles/permissions.
- Active organisation context missing in helpers — mitigate by updating `joinSchool()` or setup helpers so joined schools with organisations also set the user's active organisation.
- Date-sensitive schedule tests, especially T37 past/future regeneration — mitigate by freezing time or using deterministic dates relative to the test's chosen “now”; no fixed sleeps.
- Mail fake leakage in T25/T29/T38 — mitigate by declaring `using fake = mail.fake()` inside each test body only.
- Cross-test dependency risk — none of the planned tests depend on records created by another test; each uses factories for its own setup.

---
