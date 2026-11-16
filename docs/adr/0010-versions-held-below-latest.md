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
