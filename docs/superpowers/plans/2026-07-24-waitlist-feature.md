# Waitlist Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace institution signup with a pre-launch waitlist, allowing prospective swim schools to express interest before full onboarding.

**Architecture:** Create a lightweight Waitlist model that stores signup submissions via a JSON API endpoint (`POST /api/waitlist`). Remove the existing signup route and page. The landing page already has the form and will POST directly to the API.

**Tech Stack:** AdonisJS 7, Lucid 22, SQLite, Inertia React

## Global Constraints

- Node.js ≥ 24.0.0
- All API responses must follow AdonisJS conventions
- Email field must be unique (no duplicate signups)
- CSRF exemption via `/api` prefix already configured in `config/shield.ts`

---

## File Structure

**Create:**
- `database/migrations/<timestamp>_create_waitlists_table.ts` — SQLite schema
- `app/models/waitlist.ts` — Lucid model
- `app/validators/waitlist_signup_validator.ts` — Input validation rules
- `app/controllers/waitlist_signups_controller.ts` — API endpoint handler

**Modify:**
- `start/routes.ts` — Add waitlist route, remove signup routes
- `app/controllers/account_registrations_controller.ts` — Remove `create` method (it won't be called)

**Delete:**
- `inertia/pages/auth/signup.tsx` — No longer used

---

### Task 1: Create Waitlist Migration

**Files:**
- Create: `database/migrations/<YYYYMMDDHHMMSS>_create_waitlists_table.ts`

**Interfaces:**
- Produces: `waitlists` table with columns: `id`, `first_name`, `last_name`, `email` (unique), `phone`, `school`, `created_at`, `updated_at`

- [ ] **Step 1: Generate migration file**

Run: `node ace make:migration create_waitlists_table`

This creates a new migration file in `database/migrations/`. Note the timestamp prefix.

- [ ] **Step 2: Write the migration schema**

Open the generated file and replace the `up()` method:

```typescript
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'waitlists'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()
      table.string('first_name').notNullable()
      table.string('last_name').notNullable()
      table.string('email').notNullable().unique()
      table.string('phone').notNullable()
      table.string('school').notNullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
```

- [ ] **Step 3: Run migration to verify it works**

Run: `node ace migration:run`

Expected: Migration completes without error, table is created in SQLite.

- [ ] **Step 4: Commit**

```bash
git add database/migrations/
git commit -m "feat: add waitlists table migration"
```

---

### Task 2: Create Waitlist Model

**Files:**
- Create: `app/models/waitlist.ts`

**Interfaces:**
- Produces: `Waitlist` model with properties: `id`, `firstName`, `lastName`, `email`, `phone`, `school`, `createdAt`, `updatedAt`

- [ ] **Step 1: Generate model file**

Run: `node ace make:model Waitlist`

This creates `app/models/waitlist.ts`.

- [ ] **Step 2: Define model schema and timestamps**

Replace the generated file with:

```typescript
import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class Waitlist extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare firstName: string

  @column()
  declare lastName: string

  @column()
  declare email: string

  @column()
  declare phone: string

  @column()
  declare school: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
```

- [ ] **Step 3: Run a quick test to ensure the model loads**

Run: `node ace tinker` then type `import Waitlist from '#models/waitlist'` and press Enter. If no error, exit with `.exit`.

- [ ] **Step 4: Commit**

```bash
git add app/models/waitlist.ts
git commit -m "feat: add Waitlist model"
```

---

### Task 3: Create Waitlist Signup Validator

**Files:**
- Create: `app/validators/waitlist_signup_validator.ts`

**Interfaces:**
- Produces: `waitlistSignupValidator` that validates: `first_name` (required, string), `last_name` (required, string), `email` (required, email format), `phone` (required, string), `school` (required, string)

- [ ] **Step 1: Generate validator file**

Run: `node ace make:validator waitlist_signup`

This creates `app/validators/waitlist_signup_validator.ts`.

- [ ] **Step 2: Write validation schema**

Replace the generated file with:

```typescript
import vine from '@vinejs/vine'

export const waitlistSignupValidator = vine.compile(
  vine.object({
    first_name: vine.string().trim().minLength(1),
    last_name: vine.string().trim().minLength(1),
    email: vine.string().trim().toLowerCase().email(),
    phone: vine.string().trim().minLength(1),
    school: vine.string().trim().minLength(1),
  })
)
```

- [ ] **Step 3: Test the validator manually in tinker**

Run: `node ace tinker` then:

```javascript
const { waitlistSignupValidator } = await import('#validators/waitlist_signup_validator')
await waitlistSignupValidator.validate({
  first_name: 'John',
  last_name: 'Doe',
  email: 'john@example.com',
  phone: '233123456789',
  school: 'Aqua Swim School'
})
```

Expected: No error thrown.

Exit with `.exit`.

- [ ] **Step 4: Commit**

```bash
git add app/validators/waitlist_signup_validator.ts
git commit -m "feat: add waitlist signup validator"
```

---

### Task 4: Create WaitlistSignups Controller

**Files:**
- Create: `app/controllers/waitlist_signups_controller.ts`

**Interfaces:**
- Consumes: `Waitlist` model, `waitlistSignupValidator`
- Produces: `WaitlistSignupsController.storeApi()` action that POSTs to `/api/waitlist`

- [ ] **Step 1: Generate controller**

Run: `node ace make:controller WaitlistSignups`

This creates `app/controllers/waitlist_signups_controller.ts`.

- [ ] **Step 2: Write the storeApi action**

Replace the generated file with:

```typescript
import type { HttpContext } from '@adonisjs/core/http'
import Waitlist from '#models/waitlist'
import { waitlistSignupValidator } from '#validators/waitlist_signup_validator'

export default class WaitlistSignupsController {
  async storeApi({ request, response }: HttpContext) {
    const data = await request.validateUsing(waitlistSignupValidator)

    try {
      await Waitlist.create({
        firstName: data.first_name,
        lastName: data.last_name,
        email: data.email,
        phone: data.phone,
        school: data.school,
      })

      return response.created({
        message: "You're on the waitlist",
      })
    } catch (error) {
      if (error.code === 'SQLITE_CONSTRAINT' && error.message.includes('UNIQUE')) {
        return response.unprocessableEntity({
          errors: {
            email: 'This email is already on the waitlist',
          },
        })
      }

      throw error
    }
  }
}
```

- [ ] **Step 3: Test the controller action (dry run)**

For now, just verify it compiles by running: `npm run typecheck`

Expected: No TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add app/controllers/waitlist_signups_controller.ts
git commit -m "feat: add WaitlistSignups controller with storeApi action"
```

---

### Task 5: Add Waitlist Route and Remove Signup Routes

**Files:**
- Modify: `start/routes.ts`

**Interfaces:**
- Consumes: `WaitlistSignupsController.storeApi()`
- Produces: Route `POST /api/waitlist` → `WaitlistSignupsController.storeApi()`

- [ ] **Step 1: Open routes.ts**

Open `start/routes.ts` and locate the signup routes (lines 38-39):

```typescript
router.get('signup', [controllers.AccountRegistrations, 'create'])
router.post('signup', [controllers.AccountRegistrations, 'store'])
```

- [ ] **Step 2: Delete the signup routes**

Delete those two lines entirely. The guest-middleware group they're in will remain and be used only for the login/magic-link routes.

- [ ] **Step 3: Add the waitlist route**

After the signup routes deletion, add this anywhere before the closing of the guest group (i.e., before line 41 where `.use(middleware.guest())` is):

No, actually, the waitlist route should NOT be in the guest group because it's an API endpoint. Add it after the guest group, as a separate public route:

Find the line `router.post('api/accounts', [controllers.AccountRegistrations, 'storeApi']).as('api.accounts.store')` (around line 113).

Add this line right after it:

```typescript
router.post('api/waitlist', [controllers.WaitlistSignups, 'storeApi']).as('api.waitlist.store')
```

- [ ] **Step 4: Verify routes compile**

Run: `node ace list:routes | grep -E "(signup|waitlist)"`

Expected output should show:
```
POST   /api/waitlist    WaitlistSignupsController.storeApi
```

And NO signup routes.

- [ ] **Step 5: Commit**

```bash
git add start/routes.ts
git commit -m "feat: add waitlist API route; remove signup routes"
```

---

### Task 6: Remove Signup Page and Clean Controller

**Files:**
- Delete: `inertia/pages/auth/signup.tsx`
- Modify: `app/controllers/account_registrations_controller.ts` (remove `create` method)

**Interfaces:**
- Produces: Signup page is deleted; `create` action no longer exists

- [ ] **Step 1: Delete the signup page**

Run: `rm inertia/pages/auth/signup.tsx`

- [ ] **Step 2: Open AccountRegistrations controller**

Open `app/controllers/account_registrations_controller.ts`.

- [ ] **Step 3: Remove the create method**

Find and delete the `create()` method. It should look similar to:

```typescript
async create({ inertia }: HttpContext) {
  return inertia.render('auth/signup', {})
}
```

Keep the `store()` and `storeApi()` methods (even if unused for now—they may still be called programmatically).

- [ ] **Step 4: Verify the file still parses**

Run: `npm run typecheck`

Expected: No TypeScript errors.

- [ ] **Step 5: Commit**

```bash
git add inertia/pages/auth/signup.tsx app/controllers/account_registrations_controller.ts
git commit -m "feat: remove signup page and create route"
```

---

### Task 7: Test the Waitlist Endpoint End-to-End

**Files:**
- Test: (manual testing only; no automated test suite at this stage)

**Interfaces:**
- Consumes: `POST /api/waitlist` endpoint with all tasks above complete

- [ ] **Step 1: Start the dev server**

Run: `npm run dev`

Expected: Server starts on the default port (likely `http://localhost:3333`).

- [ ] **Step 2: Test a successful signup via curl**

In a new terminal, run:

```bash
curl -X POST http://localhost:3333/api/waitlist \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Jane",
    "last_name": "Doe",
    "email": "jane@example.com",
    "phone": "233541234567",
    "school": "Splash Swim Academy"
  }'
```

Expected response (201 Created):
```json
{
  "message": "You're on the waitlist"
}
```

- [ ] **Step 3: Test duplicate email rejection**

Run the same curl command again with the same email.

Expected response (422 Unprocessable Entity):
```json
{
  "errors": {
    "email": "This email is already on the waitlist"
  }
}
```

- [ ] **Step 4: Test validation errors**

Run:

```bash
curl -X POST http://localhost:3333/api/waitlist \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Jane",
    "last_name": "Doe",
    "email": "invalid-email",
    "phone": "233541234567",
    "school": "Splash Swim Academy"
  }'
```

Expected response (422 Unprocessable Entity) with email validation error.

- [ ] **Step 5: Verify data persisted in database**

In tinker, run:

```javascript
const Waitlist = await import('#models/waitlist')
const entries = await Waitlist.default.all()
console.log(entries)
```

Expected: Shows the Jane Doe entry created in Step 2.

- [ ] **Step 6: Test that old signup routes return 404**

Run:

```bash
curl -X GET http://localhost:3333/signup
curl -X POST http://localhost:3333/signup
```

Expected: Both return `404 Not Found`.

- [ ] **Step 7: Commit (no code changes, just mark tests passing)**

No files changed; you can skip this if all tests above passed. If you made any debugging changes, clean them up and commit:

```bash
git status
```

If clean, no commit needed. If dirty, stash or commit.

---

## Self-Review Checklist

**Spec Coverage:**
- ✓ Remove signup route — Task 5 (delete routes)
- ✓ Remove signup page — Task 6 (delete file)
- ✓ Create Waitlist model — Task 2
- ✓ Create waitlist table — Task 1
- ✓ Create waitlist validator — Task 3
- ✓ Create API endpoint — Task 4
- ✓ Add route to POST /api/waitlist — Task 5
- ✓ Test all functionality — Task 7

**Placeholder Scan:**
- ✓ No TBD, TODO, or vague steps
- ✓ All code blocks are complete and runnable
- ✓ All commands have expected output

**Type Consistency:**
- ✓ Validator field names match camelCase property names (e.g., `first_name` input → `firstName` model)
- ✓ Controller uses model correctly
- ✓ Email unique constraint in migration matches validator + controller logic

---

Plan complete and saved to `docs/superpowers/plans/2026-07-24-waitlist-feature.md`.

**Two execution options:**

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?