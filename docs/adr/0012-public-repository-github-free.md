# ADR 0012: Source hosting - a public repository on GitHub Free

- **Status:** Accepted (the product owner's decision of 2026-11-16 on plan question PQ-01; recorded on 2026-11-27 through change request CR-05; design gate re-sign pending)
- **Date:** 2026-11-27
- **Relates to:** NFR-010, NFR-014, NFR-020; architecture "Secrets", "From commit to production", P-04, "Cost model"; ADR 0007 decision 2

Numbering: ADR 0011 is reserved for the voice proof-of-concept decision (plan task T-012), so this record is 0012.

## Context
The signed architecture (v0.1) assumed a **private** GitHub repository on GitHub Free with a protected `main`, environment secrets for the Cloudflare token and the Android release key, and a required manual approval on the `production` and `release` environments. The plan (PQ-01, 2026-11-16) found that GitHub's documentation does not offer those features on that combination. Re-checked on 2026-11-27 at docs.github.com, Actions, "Deployments and environments":

- "If you are using GitHub Free, environment secrets are only available in public repositories."
- "If you are on a GitHub Free, GitHub Pro, or GitHub Team plan, required reviewers are only available for public repositories."
- "Deployment branches and tags are available for all public repositories"; for private repositories only on Pro or Team.
- An option, "prevent self-review", stops the person who started a deployment from approving it.

And at docs.github.com, billing, GitHub Actions: "The use of standard GitHub-hosted runners is free: In public repositories."

The service is run by one operator, so the person who merges or tags is also the only possible approver. The repository holds no secrets by rule (security standard; architecture "Secrets"; gitleaks on every pull request).

## Decision
Host the source in a **public** repository on GitHub Free (decided by the product owner on 2026-11-16). Use the environments `staging` (`main` only, no reviewer), `production` (`main` only, the operator as required reviewer) and `release` (`v*` tags only, the operator as required reviewer), each holding its own secrets. "Prevent self-review" stays off. No workflow uses `pull_request_target`, and jobs that run for pull requests name no environment.

## Alternatives considered
| Option | For | Against |
|---|---|---|
| **Public repository on GitHub Free (chosen)** | Every feature the design uses is available at no cost: environment secrets, required reviewers, deployment branch rules; Actions minutes are free | Source code, lexicons, voice test-set sentences and pull-request discussions are public; a workflow mistake could expose secrets to fork pull requests, so the workflow rules above become part of the security model |
| Private repository on GitHub Pro | Source stays private; environment secrets and branch protection available | A recurring fee counted against NFR-010's USD 10 ceiling, which had about USD 4 of headroom (the Pro price was not checked); still no required reviewers on Pro, so production approval becomes "the operator starts the production workflow by hand" |
| Private repository on GitHub Free | No fee; source private | Repository-level secrets only, readable by any workflow run, including the release key; no required reviewers; branch protection doubtful. The planner did not recommend it (PQ-01) |

## Consequences
- NFR-010: GitHub adds no cost; the cost model is unchanged at about USD 5.95 per month.
- Security: two new threats are recorded in the architecture: T-22 (CI secrets taken through workflows) and T-23 (public source read by attackers). No control may depend on the code being secret.
- Privacy: nothing personal may enter the repository; test audio stays outside it (plan PQ-04). Real speakers' recordings must never be committed.
- The approval on `production` and `release` is a deliberate step by the operator, not a second person's review. It is the release sign-off, as the delivery standard requires; it does not add independent review.
- To watch: GitHub plan changes to the features quoted above (re-check before each release); that branch protection on `main` and the environment rules are actually configured when P-04 is completed. Branch protection on a public repository on GitHub Free was not re-checked on 2026-11-27: the page read that day ("About protected branches") does not state plan availability.
