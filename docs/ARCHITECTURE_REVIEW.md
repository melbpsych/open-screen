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

## Practice workflow extension · 26 October 2026

The runtime remains dependency-free. `core/assessment.js` validates versioned raw
assessment snapshots, recomputes derived scores and binds a local attestation to
content/reviewer/date with SHA-256. `core/vault.js` owns only bounded authenticated
file encryption/decryption; it has no storage or network. `workspace-ui.js` owns
file/password/reference-confirmation dialogs and template controls. The interview
keeps sitting state in memory and uses the captured factory when resuming.

`core/history.js` projects compatible final raw scores; only the latest final
revision per assessment ID is compared. It never invents a combined score,
reliable-change criterion or baseline full score from a brief form. Presentation
shares graph/table/attestation output between screen, offline HTML and print.
`core/templates.js` strictly excludes patient and administration-confirmation
fields. `core/revisions.js` validates a bounded local journal; app-config serialises
cooperating writers with Web Locks and compares the exact old value inside the
lock. Open review dialogs are bound to the compared settings value. One journal
write holds active pointer and review together; quota failures preserve old data.
These are local workflow conveniences, not authenticated audit/role controls.

`core/host.js` is a small transport-free boundary with typed callbacks, fresh
context checks, final-version/idempotency identity and an exact persistence
receipt. The Praxi source inspection and receiving responsibilities are in
[PRAXI_INTEGRATION.md](PRAXI_INTEGRATION.md). It does not add a backend, event bus,
generic plugin loader, iframe bridge or second patient portal. Current Praxi
integration/auth/storage tests remain external acceptance work.

Local Git now records the tested baseline and this upgrade; a pinned GitHub
Actions workflow is ready for an approved remote. Independent clinical review,
human accessibility evaluation, protected-form permissions and hosted execution
are explicit open requirements in [PRACTICE_READINESS.md](PRACTICE_READINESS.md).

## UI and engineering review · 29 October 2026

The current architecture remains proportionate: pure scoring and assessment
validation, explicit browser adapters and a shared presentation layer. This pass
retains those boundaries and avoids a framework migration. Shared focus, control
boundary, action and sizing tokens now replace repeated values in the base and
clinical styles; DESIGN_SYSTEM.md documents component contracts and change rules.
The small static guide intentionally works without a build or JavaScript and is
allowlisted explicitly rather than exposing arbitrary documentation files.

Two workflow defects were addressed: replacing a draft previously checked only
answers and could discard reference/notes-only work; failed finalisation announced
an error without moving keyboard focus to its location. Browser regressions cover
both. Existing uncommitted clinical work was retained. No scoring keys, item
wording, threshold rules, SDK schemas or runtime dependencies changed in this pass.

`interview.js` remains a large workflow controller. A future extraction should
follow a concrete change boundary (for example review rendering) with lifecycle
regressions preserved, rather than splitting it mechanically during a visual
review. API/assessment validation remains authoritative; comments explain intent
at security, focus and data-lifecycle boundaries rather than restating every line.

## Implemented workflow design · 29 October 2026

The new browser-only `review-ui.js` renders score/profile indexes, the required
review checklist, focus navigation and purpose-based exports. Actions are passed
in; it does not add persistence, networking or scoring. It is explicitly allowlisted
by the local server and covered by real HTTP tests. The existing assessment
boundary remains authoritative: `reviewIssues()` provides identifiers, messages
and navigation hints, and `reviewErrors()` derives the finalisation/import errors
from those same issues. No UI-only copy of clinical requirements is introduced.

History screen wrappers fold the unchanged report markup; reports/PDFs still
include all scores and tables. History graphics now include a latest reading,
range guides and readable date endpoints. UI state such as open disclosures is
not part of the clinical record or a new scoring definition. No new package,
framework, database or clinical schema was introduced.

Browser testing reproduced a competing-writer defect in Firefox: both tabs could
report a successful preferences save. The browser composition now keeps the Web
Lock held across task boundaries before its read/compare/write and after the
write, allowing localStorage snapshots to commit before the next cooperative
writer proceeds. A MessageChannel provides task turns without an arbitrary sleep;
ports are closed after each turn. This addresses the observed snapshot timing,
not hostile writers that bypass the protocol. The relevant implementation
behaviour is described in [WHATWG's storage discussion](https://github.com/whatwg/html/issues/403),
and asynchronous lock lifetime in [MDN's Web Locks guide](https://developer.mozilla.org/en-US/docs/Web/API/Web_Locks_API).
The regression performs eight competing writer pairs per browser profile; a
separate Firefox exercise passed 48 pairs. This is local coordination evidence,
not proof of a transactional receiving system or durable storage receipt.

The rendering pass also corrected focus return after nested recovery dialogs,
clearing of revealed passphrases, narrow phone export geometry and desktop
popover clipping with text spacing. These behaviours are exercised through real
controls in the design and existing regression suites. Current evidence and
limits are recorded in VERIFICATION.md.


## Shared feedback and clinical guidance · 29 October 2026

The browser-only `setFieldError` and delegated `wireFormValidation` in ui.js
provide persistent native-constraint feedback, preserve existing descriptions,
reveal/focus the first invalid field and support dynamically replaced forms.
Business rules still come from their existing validators. Authentication failures
stay operation errors when their cause cannot be assigned to a single field.
No dependencies, clinical scoring rules or storage systems were introduced.

Encrypted saving/unlocking now names its pending state and sets aria-busy while
retaining Cancel. Browser verification exposed a native-dialog event race:
visibility changed before the queued close handler cleared a revealed secret.
Cancel now clears secrets synchronously before close; Escape clears them in the
native cancel event. The close handler also clears for programmatic cleanup.
The original immediate-clearing regression remains unchanged. This is DOM value
cleanup, not a claim that JavaScript memory can be securely erased.

CLINICAL_EVIDENCE_REVIEW.md records the separate primary-source clinical audit.
The clinical changes clarify external-form interpretation and remove obsolete
research-floor wording; they introduce no new administered questionnaire,
algorithm, schema or default threshold. Historical optional card definitions
remain outside the public catalogue; their existence is not clinical coverage.
