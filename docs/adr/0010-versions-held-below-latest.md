# ADR 0010: Versions held below latest stable - TypeScript 6.0, Vitest 4.1, Android build tools

- **Status:** Proposed (accepted at Design sign-off)
- **Date:** 2026-11-16
- **Relates to:** engineering standard on dependencies (rule 4); NFR-020

## Context
The engineering standard requires the latest stable version of everything unless an ADR explains otherwise, with an entry in `.software-house/deps-allow.json`. On 2026-11-16 three parts of the chosen stack cannot be at latest together, because another chosen package declares that it does not support the latest:

| Item | Latest stable | Blocked by | Evidence |
|---|---|---|---|
| TypeScript | 7.0.2 (published 2026-07-08) | typescript-eslint 8.72.2, the latest, declares peer `typescript >=4.8.4 <6.1.0` | `npm view typescript-eslint peerDependencies` |
| Vitest | 5.1.0 | @cloudflare/vitest-pool-workers 0.23.0, the latest, declares peer `vitest ^4.1.0` | `npm view @cloudflare/vitest-pool-workers peerDependencies` |
| Android Gradle Plugin, Gradle, Kotlin | 9.5.1, 9.9.1, 2.4.21 | Capacitor 8.6.2, the latest, is built and templated with AGP 8.13.0, Gradle 8.14.3 and Kotlin 2.2.20 | `@capacitor/android@8.6.2` `build.gradle` and the `@capacitor/cli@8.6.2` Android template; Google Maven index; GitHub releases |

## Decision
Use TypeScript 6.0.3 (the newest release inside the linter's supported range), Vitest 4.1.12 with @vitest/coverage-v8 4.1.12 (the newest inside the Workers test pool's range), and the Android build tools of the Capacitor 8.6.2 template (AGP 8.13.0, Gradle 8.14.3, Kotlin 2.2.20, JDK 21). Record each in `.software-house/deps-allow.json` with this ADR as the reason. Upgrade each as soon as the blocking package supports the newer version; Renovate will raise the pull requests.

Entries the implementer adds to `.software-house/deps-allow.json` (the planner does not write configuration files):

```json
{
  "typescript": "ADR 0010: typescript-eslint 8.72.2 supports <6.1.0",
  "vitest": "ADR 0010: @cloudflare/vitest-pool-workers 0.23.0 requires ^4.1.0",
  "@vitest/coverage-v8": "ADR 0010: must match vitest 4.1.x",
  "com.android.tools.build:gradle": "ADR 0010: Capacitor 8.6.2 template",
  "gradle": "ADR 0010: Capacitor 8.6.2 template",
  "org.jetbrains.kotlin:kotlin-gradle-plugin": "ADR 0010: Capacitor 8.6.2 template"
}
```

## Alternatives considered
| Option | For | Against |
|---|---|---|
| **Hold the three items at the newest supported version (chosen)** | Every tool runs inside its maintainers' tested range; strict type-aware linting and in-runtime API tests both work | Not latest; needs allow-list entries and follow-up |
| TypeScript 7.0.2 with the linter's peer range overridden | Latest compiler | Type-aware lint rules use the compiler's programming interface; running outside the declared range risks silent wrong results in a quality gate |
| TypeScript 7.0.2 and drop typescript-eslint | Latest compiler | Loses the type-aware lint rules the quality standard expects |
| Vitest 5.1.0 without the Workers pool (mock the runtime) | Latest test runner | API tests would no longer run in the real runtime with a real local database, against the testing standard's preference for real collaborators |
| Newest AGP, Gradle and Kotlin under Capacitor 8 | Latest build tools | Outside what Capacitor 8.6.2 is built with; a major-version jump in the build plugin that the framework has not adopted; failures would be ours to debug |

## Consequences
- All three held versions are current release lines with no advisory known to the planner today; the CI dependency audit (osv-scanner, `npm audit`) still applies to them and would override this ADR if a High or Critical advisory appeared.
- The dependency hook will flag these packages until the allow-list entries exist.
- Review trigger: any new release of typescript-eslint, @cloudflare/vitest-pool-workers or Capacitor; at the latest before each release, when `/software-house:deps` is run.

## Amended 2026-11-27 (CR-07, CR-09)

This section is added by change control; the text above is the decision as accepted on 2026-11-16 and is not rewritten. Facts below are the versions installed per `package-lock.json` on 2026-11-27 and, where stated, the npm registry checked the same day (`npm view`).

**What changed since 2026-11-16**
- **CR-07 (T-001, 2026-11-17):** typescript-eslint is 8.73.0, not 8.72.2, because 8.72.2 pulled in minimatch 10.2.6 with a Moderate advisory (GHSA-g3hv-75wg-m249) that fails the osv-scanner step. 8.73.0 declares the same peer range, `typescript >=4.8.4 <6.1.0`.
- **CR-09 (T-014, 2026-11-19):** `@cloudflare/vitest-pool-workers` was replaced by `@cloudflare/vitest-plugin` 1.8.5. The registry marks the pool deprecated ("renamed to @cloudflare/vitest-plugin. This package will not receive future updates", checked 2026-11-27), and T-014 reported that it pinned dependencies with High advisories. `@vitest/coverage-istanbul` 4.1.12 was added for `apps/api`, because the Workers runtime has no V8 coverage; `@vitest/coverage-v8` 4.1.12 stays for the Node-side tests at the root.

**The reasons, re-checked on 2026-11-27**

| Item | Installed | Latest on 2026-11-27 | Held back by | Still holds? |
|---|---|---|---|---|
| TypeScript | 6.0.3 | 7.0.2 | typescript-eslint 8.73.0 (installed) and 8.74.0 (latest) both declare `typescript >=4.8.4 <6.1.0` | **Yes**, for the same reason, now with 8.73.0 as the named version |
| Vitest, @vitest/coverage-v8, @vitest/coverage-istanbul | 4.1.12 each | 5.1.2 each | Was: the Workers test pool's peer `vitest ^4.1.0`. Now: `@cloudflare/vitest-plugin` 1.8.5 (installed) and 1.10.0 (latest) declare `vitest ^4.1.0 \|\| ^5.0.0`. Vitest 5.1.2 declares `vite ^6.4.0 \|\| ^7.0.0 \|\| ^8.0.0` (Vite 8.3.8 installed) and Node `^22.12.0 \|\| ^24.0.0 \|\| >=26.0.0` (26.13.1 pinned) | **No.** No declared peer or engine range of an installed package holds Vitest at 4.1 any more. The two coverage packages require exactly their own Vitest version, so all three move together |
| Android Gradle Plugin, Gradle, Kotlin | not yet installed (no `apps/android` yet) | not re-checked today | Capacitor 8.6.2 template | Not re-checked; re-check when T-021 creates the Android project |

**Amended decision**
1. TypeScript stays at 6.0.3 for the reason above. The allow-list reason text should name typescript-eslint 8.73.0 instead of 8.72.2.
2. The hold on Vitest 4.1 is **withdrawn**. Vitest, `@vitest/coverage-v8` and `@vitest/coverage-istanbul` are upgraded together to the latest 5.x in one dependency pull request (a Renovate pull request or a `chore(deps)` pull request), with the full pipeline green, including the Workers integration tests. That pull request removes the `vitest`, `@vitest/coverage-v8` and `@vitest/coverage-istanbul` entries from `.software-house/deps-allow.json`. Until it merges, those entries stay, and their reason text should say "upgrade pending, ADR 0010 amendment of 2026-11-27" instead of citing the retired pool. No other reason for the hold is known to the planner; if the upgrade fails for a reason found in testing, that reason is recorded in a further amendment, not assumed here.
3. The Android build tools hold is unchanged.
4. Review trigger: any new release of typescript-eslint, `@cloudflare/vitest-plugin` or Capacitor (replacing `@cloudflare/vitest-pool-workers` in the trigger above).

**Configuration changes this asks of the implementer** (the planner does not edit configuration files). `.software-house/deps-allow.json` today still gives the reasons of 2026-11-16. Suggested text until the Vitest upgrade merges:

```json
{
  "typescript": "ADR 0010: typescript-eslint 8.73.0 supports <6.1.0",
  "vitest": "ADR 0010 amendment 2026-11-27: no blocking reason; upgrade to 5.x pending",
  "@vitest/coverage-v8": "ADR 0010: must match vitest; upgrade pending",
  "@vitest/coverage-istanbul": "ADR 0010: must match vitest; the Workers runtime has no V8 coverage; upgrade pending",
  "com.android.tools.build:gradle": "ADR 0010: Capacitor 8.6.2 template",
  "gradle": "ADR 0010: Capacitor 8.6.2 template",
  "org.jetbrains.kotlin:kotlin-gradle-plugin": "ADR 0010: Capacitor 8.6.2 template"
}
```
