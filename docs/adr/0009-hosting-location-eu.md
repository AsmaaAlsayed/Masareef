# ADR 0009: Hosting location - EU jurisdiction, with a documented path to move

- **Status:** Proposed (accepted at Design sign-off). To be revisited when legal advice on Egypt's Law 151/2020 is received (vision Q-01, requirements OQ-04).
- **Date:** 2026-11-16
- **Relates to:** NFR-010, NFR-011, NFR-014, NFR-023, FR-039; vision R-3, Q-01; requirements OQ-02, OQ-04

## Context
The product stores personal data of people in Egypt: email addresses and spending records. The product owner decided on 2026-11-16 to treat Egypt's Personal Data Protection Law 151/2020 as an open risk: build with data minimisation, keep the hosting location flexible, and obtain legal advice before public launch rather than before building [FACT]. The vision records, from secondary sources only, that the Executive Regulations reportedly require a licence from the Personal Data Protection Centre and a separate licence for transferring personal data outside Egypt. Whether and how that applies to this product is not established, and the planner does not assert what the law requires. Sign-up is worldwide, so other regimes such as the EU's GDPR may also matter (OQ-02).

A location has to be chosen now to build anything. Facts checked on 2026-11-16:
- Cloudflare D1 offers location hints for North America, Europe, Asia-Pacific and Oceania, and jurisdictions `eu` and `us` that guarantee where data is stored. Its documentation states that D1 databases do not run in the Middle East or Africa. A jurisdiction cannot be changed after the database is created.
- R2 offers the same `eu` jurisdiction, also fixed at creation.
- The chosen platform (ADR 0004) therefore cannot host in Egypt. No provider with an Egyptian region was identified or priced today.

## Decision
Create the production and staging D1 databases and the backups bucket with jurisdiction `eu`. Keep the amount of personal data to the minimum already specified, keep audio and transcripts off the server entirely, and keep the stack portable (ADR 0004) so that the data and API can be moved to another location, including a server in Egypt, without redesign. State the hosting location and each processor in the privacy policy. Do not launch publicly until the legal advice has been received and this ADR has been confirmed or superseded.

Processors and where personal data goes under this decision:

| Processor | Data | Location |
|---|---|---|
| Cloudflare D1 and R2 backups | All account and expense data; encrypted dumps | Stored in the EU (guaranteed by jurisdiction) |
| Cloudflare Workers and network | Requests in transit, processed in memory at the data centre nearest the user or the database | Worldwide network; nothing stored |
| Resend | Recipient email address and message for verification and reset emails; sending logs kept 30 days | Sending region to be set to the EU if the account offers it; storage location to be read from Resend's terms when the account is created |
| Google | Sign-in with Google, for users who choose it | Google's infrastructure |
| Have I Been Pwned | Five characters of a password hash; not personal data | - |
| GitHub | Source code and CI; no user data. The nightly backup job handles the dump in memory and uploads it encrypted | - |

## Alternatives considered
| Option | For | Against |
|---|---|---|
| **EU jurisdiction on the chosen platform, portable stack (chosen)** | A guaranteed, named location; the closest available to Egypt, which helps latency; the EU's data-protection regime is the most widely recognised baseline and helps with OQ-02; costs nothing extra | Data is outside Egypt, which may need a licence or may not be allowed, pending advice; the jurisdiction is fixed, so moving means creating a new database and migrating |
| No jurisdiction, location hint only | Slightly more placement freedom | A hint is best effort; "where is the data" has no firm answer for the privacy policy |
| US jurisdiction | Available | Farther from users; a weaker story for both Egyptian and European rules |
| Host in Egypt now on a local provider's virtual server | Would avoid the cross-border question if it applies | No managed option on the platform; no provider verified or priced; brings the single-server operating burden rejected in ADR 0004; may be unnecessary. Kept as the documented fallback |
| Wait for legal advice before choosing | No rework risk | Blocks all building, against the product owner's decision to proceed and seek advice before launch |
| Keep all data on the device, no server | No hosting question at all | Contradicts the confirmed scope: accounts and sync between web and Android |

## Consequences
- **If advice says the data must be in Egypt, or elsewhere:** the move is the exit path of ADR 0004 with a chosen destination: stand up the API on Node with SQLite (or create a new database in the required jurisdiction if the platform gains one), announce a short maintenance window, export, import, verify counts, switch DNS, delete the old database and wait out its 30-day history. Estimated effort: days, not a redesign. A rehearsal on staging is part of that work, not of R1.
- **If advice says a licence is needed for transfer abroad:** cost and lead time are unknown and could exceed the budget or block launch (vision R-3). This is the product owner's decision at the Release gate.
- Data minimisation carries most of the risk reduction regardless of location: no audio, no transcripts, no names, phone numbers, IP addresses or device identifiers are stored.
- Latency: each database query from Egypt crosses to Europe; measured by the load test (NFR-011).
- The privacy policy text (FR-039 criterion 3, "where the data is hosted") takes its facts from the table above.
- To watch: the legal advice (prerequisite P-13); Resend's data location; any new Cloudflare region or jurisdiction.

## Sources (read on 2026-11-16)
- https://developers.cloudflare.com/d1/configuration/data-location/
- https://developers.cloudflare.com/r2/reference/data-location/
- https://resend.com/pricing
- Law 151/2020 commentary: as listed in docs/01-vision.md (secondary sources; not re-read today)
