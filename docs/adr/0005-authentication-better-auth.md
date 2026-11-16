# ADR 0005: Authentication - Better Auth, Argon2id, Google ID tokens, database sessions

- **Status:** Proposed (accepted at Design sign-off)
- **Date:** 2026-11-16
- **Relates to:** FR-001 to FR-009, FR-019, NFR-016, NFR-017, NFR-018, NFR-019, NFR-023

## Context
Sign-in methods are email and password, and Google [FACT]. The requirements add: email verification before first sign-in with a 24-hour single-use link; responses that never reveal whether an email is registered; lockout after 5 consecutive failures for 15 minutes; 30-day sessions that sign-out ends on the server within 5 seconds and a password reset ends everywhere within 60 seconds; HttpOnly, Secure, SameSite cookies on the web; a Google sign-in whose verified email equals an existing verified account signs in to that account; the 18+ and terms confirmation shown before a Google account is created; only the email and Google's stable identifier stored. The engineering standard requires a maintained library or identity provider, no hand-written cryptography or session code, and Argon2id or bcrypt.

Checked on 2026-11-16:
- **OWASP Authentication Cheat Sheet:** passwords shorter than 8 characters are weak when multi-factor authentication is enabled; shorter than 15 are weak when it is not; maximum length at least 64; no composition rules; allow all characters including Unicode and whitespace; no silent truncation; block common and breached passwords; no periodic rotation.
- **OWASP Password Storage Cheat Sheet:** Argon2id with at least 19 MiB memory, 2 iterations, parallelism 1; bcrypt only for legacy systems, with a 72-byte input limit.
- **Better Auth 1.7.25** (published 2026-11-14; documentation at better-auth.com): email and password with `requireEmailVerification`, under which sign-up with an existing email returns the same success response; configurable verification and reset token lifetimes; `revokeSessionsOnPasswordReset`; minimum and maximum password length (defaults 8 and 128); custom `password.hash` and `password.verify`; default hashing is scrypt; database-backed sessions with configurable lifetime; a bearer-token plugin for clients that cannot use cookies; Google sign-in with an ID token, with several accepted client ids; account linking with trusted providers; a Have I Been Pwned plugin that sends only a prefix of the password's SHA-1; user deletion; database hooks. Works with Drizzle 0.45.

## Decision
Use Better Auth inside our API, with sessions stored in our database: an HttpOnly, Secure, SameSite=Strict cookie on the web and a bearer token in Keystore-encrypted storage on Android. Hash passwords with Argon2id (m=19456 KiB, t=2, p=1) through the library's custom hash option, using the audited pure-JavaScript implementation in @noble/hashes 2.4.0. Sign in with Google by obtaining an ID token on the device and verifying it on the server, on both platforms. Add the per-email lockout, the per-account email limits and the Google precheck as small pieces of our own code around the library; none of them involves cryptography or session handling.

Password minimum: 15, as one configuration value. Because the product has no multi-factor authentication, current OWASP guidance points to 15; the product owner accepted change request CR-01 on 2026-11-16, raising it from the originally signed 8.

## Alternatives considered
| Option | For | Against |
|---|---|---|
| **Better Auth in our API (chosen)** | Every required behaviour is a documented option or a hook; sessions are rows we can delete, so sign-out and reset take effect at once; data stays in our database in the chosen jurisdiction; no per-user fee; one language | We operate it: configuration mistakes are ours; version 1.x moves fast (pinned and updated by Renovate); lockout and email limits are our code; a few integration details are taken from documentation and must be proven in a spike (see the architecture document, D-09) |
| Supabase Auth | Managed; email verification and Google built in | Session tokens remain valid after sign-out until expiry and live in browser storage; lockout rules not configurable to NFR-019; ties the database choice (ADR 0004) |
| Firebase Authentication | Managed; free at this scale; mature Google sign-in on Android | Passwords hashed with Firebase's scrypt variant, not Argon2id or bcrypt; identity data held outside our database, in Google's chosen region; revocation needs extra checks on every request; limits not ours to set |
| Hosted identity services (Auth0, Clerk and similar) | Least code; hosted screens | Account data at one more processor and location to name in the privacy policy (vision R-3); hosted pages complicate full Arabic and right-to-left control; free plans can change; not priced today |
| Self-hosted identity server (for example Keycloak) | Full-featured | Needs a server to run on, against ADR 0004 and the one-maintainer constraint |
| Writing sessions and password handling ourselves | Exact fit | Forbidden by the engineering standard |
| Google sign-in by browser redirect with a client secret | The classic flow | Needs a secret, redirect handling and a Custom Tab round trip on Android; the ID-token flow is the same on both platforms and needs no user-facing redirect |
| bcrypt | Named by the standard; fast implementations | 72-byte input limit: 64 Arabic characters are 128 bytes, so long Arabic passphrases would be cut or refused, against NFR-017 |
| Argon2id through WebAssembly | Faster than JavaScript | Workers do not allow WebAssembly compiled at run time, which is how the common package ships; kept as the fallback as a statically imported module if measured CPU time is too high |

## Consequences
- Sessions: 30 days from last activity; expiry is pushed forward when a session is used and its stored value is over 60 seconds old; no cookie cache, so every request reads the session row (one indexed lookup).
- The `session` table's IP address and user-agent columns are kept empty, and the `user` table's name and image columns are never filled (data minimisation, NFR-023).
- Google: linking happens only to verified accounts; an unverified password credential for the same email is removed when the Google owner signs in, closing the pre-registration takeover described in the threat table. Account deletion for Google users requires an ID token issued within the last 5 minutes.
- Breached-password checks call an outside service with a hash prefix only. If it does not answer within 3 seconds the check is skipped and logged (fail open). This is a choice to confirm at sign-off (architecture document, D-07).
- Password hashing costs several hundred milliseconds of CPU per sign-in or sign-up; to be measured on Workers in the walking skeleton against a 1,000 ms budget.
- Rate-limit and lockout counters are keyed by a keyed hash of the IP address or email, never the raw value, and are deleted after their window.
- To watch: Better Auth releases (security fixes applied immediately); the OWASP sheets are re-read before each release, as NFR-017 asks.

## Sources (read on 2026-11-16)
- https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
- https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
- https://www.better-auth.com/docs/authentication/email-password ; /docs/authentication/google ; /docs/reference/options ; /docs/plugins/bearer ; /docs/plugins/have-i-been-pwned
- `npm view better-auth version`, `npm view better-auth peerDependencies`, `npm view @noble/hashes version`
