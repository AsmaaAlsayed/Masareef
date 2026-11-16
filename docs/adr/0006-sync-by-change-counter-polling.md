# ADR 0006: Sync - server of record, client-generated ids, change-counter polling

- **Status:** Proposed (accepted at Design sign-off)
- **Date:** 2026-11-16
- **Relates to:** FR-011, FR-012, FR-017, FR-018, NFR-006, NFR-007; vision R-6, Q-05

## Context
An expense saved, edited or deleted on one device must appear on the other within 10 seconds for 95% of saves, without the user refreshing, when both are online with the list open (NFR-006). A save interrupted by a network drop must result in exactly one expense (NFR-007). R1 is online-only: nothing is queued while offline and unsaved input is discarded when the app closes (FR-018) [FACT, vision Q-05]. Concurrent edits are resolved by "the save the server receives last wins" (FR-011 criterion 4). The vision asks that the data model allow offline sync later without a rewrite (R-6). Expected concurrency is tiny: a user's two devices.

## Decision
The server is the only store of expenses; clients keep them in memory only.
- **Change signal:** each user has a counter (`user_sync.seq`) that the server increments in the same transaction as every create, update and delete of that user's expenses. While the list or summary is visible, the app is in the foreground and online, the client requests `GET /sync` every 5 seconds, and also on focus and on resume. When the number differs from the one it last saw, it refetches the queries on screen.
- **No duplicates:** the client generates the expense's UUID before the first save attempt and reuses it for every retry. The primary key is (`user_id`, `id`); a repeated create returns the stored expense instead of making a second one. Automatic retry happens at most twice, then the user is told the save failed.
- **Conflicts:** updates overwrite; the last one received wins. Updating or deleting an expense that no longer exists returns 404, which the client shows as "no longer exists" for an edit and treats as success for a delete.
- **Prepared for offline later:** every expense row carries the counter value of its last change (`rev`) and `updated_at`, and ids are already client-generated.

## Alternatives considered
| Option | For | Against |
|---|---|---|
| **Poll a per-user change counter, refetch on change (chosen)** | Trivially simple and testable; an idle poll is one indexed read; worst-case delay is one interval plus two requests, well inside 10 seconds; works identically in browsers and the WebView; no long-lived connections; deletes need no special handling because the list is refetched | A request every 5 seconds per open client (about 360,000 a month at 500 MAU against 10 million included); up to 5 seconds of delay by design; refetching a page instead of applying a delta |
| WebSocket or server-sent events push | Near-instant; no idle polling | Needs a stateful connection holder on the platform (a further Cloudflare service), reconnection and heartbeat logic, and a fallback to polling anyway; more moving parts for a benefit the requirement does not ask for |
| Delta sync with tombstones (`changes since revision`) | Efficient for large lists; the basis of offline sync | Clients hold no persistent copy in R1, so there is nothing to apply deltas to; soft-deleted rows would keep deleted data longer; complexity without a current need. The `rev` column keeps this door open |
| Local-first replication (CRDT or a sync engine) | Offline use and merge for free | Offline is out of scope for R1; a large dependency and a new data model; conflicts with the simple "last write wins" rule that was agreed |
| A hosted realtime database | Sync built in | Rejected with the backend choice (ADR 0004) |
| Longer polling interval with manual refresh | Fewer requests | Fails "without the user refreshing" or the 10-second limit |

## Consequences
- Easier: one small endpoint and one hook in the client deliver FR-017; NFR-006 is tested by two automated clients measuring the delay.
- Harder: nothing notable at this scale. At tens of thousands of concurrent users polling would need revisiting; that is far outside NFR-013.
- Polling stops when the page or app is hidden, so background tabs cost nothing; on return the client checks at once.
- The signed-in rate limit (120 requests per account per minute) leaves room: one client polls 12 times a minute.
- If offline entry is added later, it builds on client ids, `rev` and `updated_at`, and adds tombstones and a local store through a new ADR; the API's create semantics already tolerate late, repeated submissions.
- To watch: the measured 95th percentile in NFR-006's test; if a slow network makes "one interval plus two requests" approach 10 seconds, the interval drops to 3 seconds (a configuration value).
