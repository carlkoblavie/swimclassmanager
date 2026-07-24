# Waitlist Feature Design

**Date:** 2026-07-24  
**Status:** Approved

## Overview

Replace the institution account signup flow with a pre-launch waitlist. This allows prospective swim schools to express interest before the product is ready for full onboarding, while keeping the signup path simple and low-friction.

## What's Changing

1. **Remove** the institution signup route (`/signup` GET/POST)
2. **Remove** the signup page (`inertia/pages/auth/signup.tsx`)
3. **Create** a new Waitlist table and model
4. **Add** a waitlist signup API endpoint (`POST /api/waitlist`)

## Database Schema

**Table:** `waitlists`

```sql
CREATE TABLE waitlists (
  id uuid PRIMARY KEY,
  first_name varchar NOT NULL,
  last_name varchar NOT NULL,
  email varchar NOT NULL UNIQUE,
  phone varchar NOT NULL,
  school varchar NOT NULL,
  created_at timestamp NOT NULL,
  updated_at timestamp NOT NULL
)
```

- Email should be indexed for uniqueness to prevent duplicates
- All fields are required

## API Endpoint

**POST /api/waitlist**

**Request body:**
```json
{
  "first_name": "string (required)",
  "last_name": "string (required)",
  "email": "string (required, email format)",
  "phone": "string (required)",
  "school": "string (required, swim school name)"
}
```

**Responses:**
- `201 Created` + `{ message: "You're on the waitlist" }` on success
- `422 Unprocessable Entity` + validation errors if validation fails (e.g., duplicate email)
- `500 Internal Server Error` if database error

**CSRF:** Exempt via `/api` prefix in `config/shield.ts` (already configured for `/api/accounts`)

## Frontend

The landing page (`design/landing-page.html`) already has the waitlist form with fields matching our schema. After successful signup, the form hides and displays: "You're on the list — we'll email you at launch."

No changes needed to the login page—it currently has no signup link.

## Routes to Remove

From `start/routes.ts`:
```typescript
// REMOVE these lines (currently 38-39):
router.get('signup', [controllers.AccountRegistrations, 'create'])
router.post('signup', [controllers.AccountRegistrations, 'store'])
```

The `account_registrations.store` action in the controller can be updated to remove the route or left unused if it's called by the API endpoint.

## Files to Create/Modify

**Create:**
- `app/models/waitlist.ts` — Lucid model
- `database/migrations/<timestamp>_create_waitlists_table.ts` — Schema migration
- `app/controllers/waitlist_signups_controller.ts` — Controller with `storeApi` action
- `app/validators/waitlist_signup_validator.ts` — Validation rules

**Modify:**
- `start/routes.ts` — Remove signup routes, add waitlist endpoint
- `app/controllers/account_registrations_controller.ts` — Remove or deprecate `create`/`store` if they're no longer needed

**Delete:**
- `inertia/pages/auth/signup.tsx` — No longer used

## Success Criteria

- Waitlist form on landing page POSTs to `/api/waitlist` and succeeds
- Duplicate emails are rejected with a validation error
- All required fields are validated
- Database stores signup data correctly
- Signup routes are removed and return 404
- Sign-in flow is unaffected
