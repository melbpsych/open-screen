# Architecture review and implemented improvements

26 October 2026. Scope: the adult local practice UI, clinical routing/scoring, personality engine and readers, reports, configuration, integration contracts and development server. The research analyses were not re-run.

## Assessment

The useful foundation was already present: pure scoring modules, locally held data, explicit published item definitions, source references, strict clinical response handling, shared report presentation, and 55 passing JavaScript tests. A framework rewrite would not have addressed the principal problems. The main maintenance risks were duplicated decision rules, inadequate extension and integration contracts, and the behavior of a general-purpose static file server.

| Finding | Practical consequence | Implemented response |
| --- | --- | --- |
| PHQ/GAD, trauma, alcohol and response-pattern decision settings were scattered | Integrators could change a score rule but leave the displayed threshold or evidence wording unchanged | `config/policy.json`, strict validation, configured engine rules, policy-aware charts/reports and immutable snapshots |
| A new clinical questionnaire required parallel engine, setup and report edits | Easy to omit a source, score, shared item or output | A deliberately small additive definition format and registry; automatic discovery through the existing UI and reports |
| Clinical functions had no public versioned integration boundary | Hosts needed internal-module knowledge and could supply ambiguous values | A synchronous `createScreener` factory, explicit package exports, runtime validation, typed contracts and an executable integration example |
| Only a date described the effective rules | Custom settings and questionnaire revisions could not be reliably replayed | JSON schema/engine/rules versions, full policy and registered definitions, original-code response option, deterministic replay test |
| Some legacy personality paths accepted coerced values or malformed norm counts | A boolean/string response or invalid reference distribution could look plausible | Integer-only response checks, safe nonnegative norm counts, subscale validation, Python boolean rejection, Swift lookup-table bounds check |
| The default Python handler could serve directories, hidden files and symlink targets | A later secret or export in the checkout could become readable | Explicit public paths, no listing or symlinks, localhost Host validation, no query logs and restrictive headers |
| Startup configuration failures left an empty UI | A clinician could encounter an unexplained blank screen | A small external bootstrap with a clear unavailable state; no automatic reload of active sittings |
| Developer instructions focused on the original personality tool | Clinical integration, policy review, extension and security responsibilities were unclear | Separate development, configuration and security guides, with examples and verified commands |

## Architecture retained

The browser's `app-config.js` composes the validated policy and registry once. `api.js` provides a stable boundary around pure instrument functions. `core/questionnaire.js` handles ordinary additive definitions; specialized source algorithms remain explicit in `gates/`. `presentation.js` renders derived values, and `interview.js` controls the same-device workflow. The historical personality engine and its compiled readers remain separate rather than being forced into a new universal abstraction.

The runtime still has no third-party dependencies, application backend, database, event bus, service container, code-executing plugin system, general-purpose scoring DSL, or frontend build requirement. Pinned TypeScript, Playwright and axe development tools check public declarations, the host example and real browser workflows. Published questionnaire wording and default clinical threshold choices remain unchanged.

## Verification

The current core check passes 73 JavaScript tests, four HTTP tests, Python parity, configuration validation and the typed integration example. The automated suite covers factory isolation, custom thresholds and matching charts, strict policy validation, declarative one- and two-stage questionnaires, original-code/reverse-key separation, administration requirements, collisions, stale follow-up exclusion, exact replay, optional raw exports, retained safety responses, importing without browser globals, malformed personality values and reference counts, and the existing clinical and presentation tests. Python checks retain parity and reject booleans; four real HTTP tests exercise public assets, private paths, traversal, symlinks, Host checks, headers and methods. `npm run typecheck` validates the public integration example.

The repeatable Playwright suite drives actual controls against an isolated instance of the hardened server. It covers Chromium, Firefox and WebKit plus Chromium/WebKit phone emulation, with native Chromium PDF and clipboard checks. It also injects synthetic policies and a questionnaire registry to verify extension workflows without changing the practice assets. Browser findings led to fixes for narrow export menus, long-name setup/report layouts, clipboard failure cleanup, input/API length agreement, contrast, source headings in print, personality data-loss protection and default report clinician fields. See [VERIFICATION.md](VERIFICATION.md) for dated results and [E2E.md](E2E.md) for reproduction and system prerequisites.

## Remaining work and limits

1. **Version control and CI:** neither this folder nor its parent project is a Git checkout. The latest implementation has a session backup, a lockfile and repeatable checks, but no durable commit history or hosted CI. Add a repository and install the browser/PDF prerequisites and run `npm ci && npm run verify` in the chosen CI service before collaborative release work.
2. **Distribution license:** the application code has no declared distribution license. The package remains private; do not confuse an instrument's public-domain status with a license for all application code.
3. **Complex instruments:** additional subscales, safety-critical workflows and specialized published algorithms still require explicit adapters. This is intentional and documented rather than hidden behind an incomplete “universal questionnaire” claim.
4. **Typing and browser coverage:** public API declarations and the host example are checked; the existing browser/clinical implementation has not all been migrated to TypeScript. Some historical personality/validity result structures remain `unknown` at the new boundary. Swift was not compiled here. The suite exercises Firefox and WebKit; there is no formal screen-reader audit, physical-device/installed-Safari certification or React Native integration test.
5. **Clinical and remote deployment:** there is no new clinical/forensic calibration, authenticated portal, EHR/FHIR adapter, immutable signed audit store, remote API or deployment security assessment. Those require concrete host requirements and clinical/governance work, not speculative architecture.

The most useful next engineering work is an actual receiving-system integration and its contract tests. That will identify any further adapter needs more reliably than adding infrastructure in advance.
