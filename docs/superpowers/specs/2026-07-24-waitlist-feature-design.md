# Waitlist Feature Design

**Date:** 2026-07-24  
**Status:** Approved

## Overview

Convert the existing institution signup flow into a pre-launch waitlist by hiding password fields and auto-generating a default password server-side. This reuses the existing signup form and route, creating real accounts immediately while keeping the signup friction-free during waitlist phase.

## What's Changing

1. **Hide** password input fields from the signup form
2. **Make** password optional in the signup validator
3. **Generate** a default secure password server-side when no password is provided
4. **Set** `mustChangePassword: true` on generated accounts so they must change password on first login
5. **Keep** the signup route, page, and controller logic—just simplify the flow

## No Database Changes

Uses the existing `users` table. No new tables or migrations needed. Signup still creates a full `User` account with email, first/last name, institution details, and a randomly-generated password.

## Frontend Changes

**Signup Form (`inertia/pages/auth/signup.tsx`):**
- Remove the password input fields (both "Password" and "Confirm password")
- Keep all other fields: first name, last name, account type, email, institution name, location, terms checkbox
- Keep the submit button

After submission, users are redirected to complete their profile (as they do now).

## Validator Changes

**Web Signup (`storeAccountRegistrationValidator`):**
- Make `password` field optional with `.optional()`
- Password is now provided only if user enters it; if absent, controller generates one

**Programmatic API (`storeApiAccountValidator`):**
- Keep unchanged—still requires password for `/api/accounts` endpoint

## Controller Logic

**`AccountRegistrations.store()` action:**
- After validation, check if password was provided
- If not provided: `const password = string.random(16)` to generate a secure 16-character random password
- Create user with generated password
- Set `mustChangePassword: true` to force password change on first login
- User lands on complete-profile flow (unchanged)

## Success Criteria

- Signup form renders without password fields
- Form submission with no password succeeds
- Account is created with a random default password
- User is directed to complete profile
- On first login attempt, forced to change password via existing `forcePasswordChange` middleware
- Duplicate emails are rejected (existing behavior)
- Sign-in flow is unaffected
- No new database tables or migrations needed
