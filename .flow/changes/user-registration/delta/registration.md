---
capability: registration
change: user-registration
---

# Delta — registration

## ADDED

### Sign up or sign in with Google

- Given a visitor on the signup screen, when they continue with Google and authenticate with an identity that has no account, then an account is created and they proceed into the app.
- Given a visitor on the signup screen, when they continue with Google and authenticate with an identity that already has an account, then they are signed in and proceed into the app.
- Given a visitor at the Google prompt, when they cancel or deny it, then they are offered to receive a magic link instead.

### Sign up or sign in with a magic link

- Given a visitor on the signup screen, when they enter their email and request a link, then they are told to check their email for a sign-in link.
- Given a visitor who requested a link, when they open a valid link tied to an identity with no account, then an account is created and they proceed into the app.
- Given a visitor who requested a link, when they open a valid link tied to an identity that already has an account, then they are signed in and proceed into the app.
- Given a visitor with an expired link, when they open it, then they are prompted to request a new link and are not signed in.
- Given a visitor with an already-used link, when they open it, then they are signed in.

## MODIFIED

_None._

## REMOVED

_None._
