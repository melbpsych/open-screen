# Developer guide

Open Screen has a dependency-free JavaScript runtime and a static reference UI. The new clinical integration API is `api.js` (schema version 1, engine version 0.5.0). It is separate from the historical personality API version 2 in `core/score.js`. There is no application backend, automatic transport, persistence layer, or plugin execution environment.

## Work locally

Requirements: Node 22 or later, npm, Python 3.9 or later, and a browser supporting JavaScript modules and JSON import attributes. Bundlers must support the same imports. The browser regression suite covers Chromium, Firefox and WebKit, with Chromium/WebKit phone emulation. React Native and native application bridges need their own integration checks.

```sh
npm ci
npm run check
npm start
```

Open `http://127.0.0.1:8765/index.html`. No build or dependency installation is needed to run the reference UI itself. TypeScript is a pinned development dependency used to check the public declarations against `examples/integration.ts`; it is not part of the runtime or a frontend migration.

`npm run check` validates the actual browser registry and policy, type-checks the integration example, runs JavaScript tests, checks compiled personality data without rewriting it, checks Python parity, and exercises the real local HTTP server. `npm run verify` also runs the real browser suite; [E2E.md](E2E.md) covers browser/system installation, reports and regression coverage. Playwright and axe are pinned development tools and are not loaded by the app. `npm run compile` deliberately regenerates the historical personality artifact after a reviewed measure change. Keep `package-lock.json`; use `npm ci` in automation.

The reference UI includes `logic.html`, with DOM-based diagrams in `logic.js` and responsive styling in `logic.css`. It reads configuration and symptom definitions through the shared `app-config.js` composition. `core/practice.js` defines a whitelisted preference schema, computes before/after differences, builds complete validated factories and binds saved overrides to reviewed deployment defaults. The browser adapter in `app-config.js` handles only the preference storage key and optimistic competing-editor checks; pure API users have no storage access. `interview.js` snapshots the effective factory and refreshes it only for an empty/new sitting. Configured gate values and registered questionnaires appear automatically; explanatory routing text must be reviewed alongside engine routing changes. This page does not create a sitting or read answers. Its drafts preview without applying; explicit save/reset applies to future sittings. Saved preferences, their rationale and versions remain reproducible in exported clinical configuration. Its setup link opens another tab so the clinician can consult it without discarding setup. New root assets remain explicitly allowlisted in `serve.py`.

## Embed the engine

From another local Node project, `npm install /absolute/path/to/open-screen` makes its package entry points available. `npm pack` creates a local SDK archive for another environment. The package remains private and has no runtime dependencies. It includes the engine and documentation, rather than the reference app's development server. It has not been published to a registry. The repository does not yet declare an application-code distribution license; establish that before distributing the SDK beyond the owner's authorized use. Instrument-specific rights are separate.

```js
import { createScreener, exportJSON } from "open-screen"
import { clinicalSummary, buildReport } from "open-screen/presentation"

const screener = createScreener()
const setup = screener.createSetup({ context: "clinical" })
const answers = {}
const question = screener.nextStep(setup, answers)
// Render the complete step: stem, examples, title, options and attribution.
// Store the original option.value.
// Example only: do not auto-answer in a real patient workflow.
answers[question.id] = question.options[0].value

const progress = screener.progress(setup, answers)
const record = screener.record(setup, answers, { reference: "SYNTHETIC-001" })
const summary = clinicalSummary(record, record.clinician)
const report = buildReport(record, record.clinician)
const json = exportJSON(record) // No raw-response appendix by default.
```

Presentation helpers use `record.clinician` when their second argument is omitted. Pass an explicit clinician object to render current unsaved edits instead; it replaces the recorded fields for that rendering and a differing override renders as Draft. Final labels require the immutable record returned by assessmentRecord() after finaliseAssessment() or await verifyAssessment(). A cloned/deserialized final must be verified again. Parsed derived JSON alone is not proof of attestation.

Use the returned verified snapshot; verification does not register its mutable input:

```js
const verified = await verifyAssessment(parsedAssessment)
const record = assessmentRecord(verified)
const report = buildReport(record)
```

`examples/integration.ts` is the compile-checked version, including a separate policy and an additional questionnaire. For native browser modules, import the files by relative URL instead of a bare package name, or bundle them into the host application. The API touches neither `window` nor `document` and can run in a server process or worker. The host owns its own views, request lifecycle, storage, authorization, and network actions. The library adds no global handlers or subscriptions. Create one immutable screener per approved policy/registry and a fresh setup/answer map per sitting. Never change policies halfway through a sitting.

## Public contracts

| Method/export | Behavior |
| --- | --- |
| `createScreener({ policy, questionnaires, clock })` | Validate and snapshot configuration; independent factories do not share policy or answers. `clock` is an optional trusted function returning an ISO timestamp. |
| `createSetup(overrides)` | New mutable sitting settings, using policy defaults. Nested topics are merged with known defaults; other supplied maps are copied. Unknown keys and invalid types are rejected. |
| `setupErrors(setup)` | Human-readable administration prerequisites. Check before starting. Record creation also requires an explicit clinical/forensic context. |
| `getSteps(setup, answers)` / `nextStep(...)` | Current ordered path / first unanswered step. All brief items precede follow-ups. Gates can change after edits. |
| `progress(...)` | Current answered and required counts. `finished` also requires valid administration settings. The required count can grow; do not present it as a fixed predicted questionnaire length. |
| `validateAnswers(answers)` | Item-level errors for known invalid codes and unknown IDs. Missing answers are normal. A malformed answer container throws. |
| `record(setup, answers, clinician)` | Immutable derived record, including incomplete/omitted results, configuration, clinician data, and original responses. It does not assert that an incomplete sitting is ready for clinical decisions. |
| `exportJSON(record, { includeResponses })` | Explicit serialization. By default, removes the raw response map, text appendix and patient event description. Notes and derived scores are still sensitive. |
| `isAnswered(step, answers)` | Strict response-code match. A valid zero is an answer; strings and numbers are not interchangeable. |
| `licences(...)`, `symptomDefinitions(...)`, `catalog` | Data for administration terms, configured PHQ/GAD definitions, and selectable topic controls. |

Preserve stems, exposure examples, item text, response labels, anchors and attribution in a host renderer; rendering only the question title can change the instrument. Question data returned to a host is copied, so editing a view cannot change shared definitions. Use `QuestionStep.options[].value`, not the option label, list index, or keyed contribution. The deprecated `score` alias on a question step is an original response code too; it is retained only for the older renderer. Definition options have a separate `score` contribution. Reverse scoring happens once in the engine.

Input errors throw `TypeError` at the public boundary without echoing response values. Unanswered scales return incomplete results, never zero-filled totals. Valid earlier responses outside the current route may remain in the answer map and full appendix; they do not enter current totals. Known PHQ-9 item 9 endorsement remains a safety observation even after the depression gate closes or that topic is deselected. The host must preserve the independent clinician safety workflow and must not interpret `progress.finished` or a negative gate as safety clearance.

## Reproducibility and compatibility

Structured records include `schemaVersion`, `configuration.engineVersion`, `configuration.rulesVersion`, the full policy, registered questionnaire definitions and versions, and a generation timestamp. To replay, retain an explicitly requested full export, use the same engine release, recreate the screener with its captured policy and definitions, pass the saved setup through `createSetup`, and use the captured original responses. `api.test.mjs` verifies exact deterministic replay using a fixed clock. A version identifier is provenance, not a digital signature or tamper-proof audit trail.

The JSON shape is the integration contract; `record.text` and report HTML are presentation formats and may change. API schema changes require a version change, migration notes, declarations, and contract tests. There is no automatic migration, FHIR mapping, diagnosis coding, or claims of interoperability certification. Map results explicitly in the receiving system and retain questionnaire identifiers, versions, raw score ranges, policy and source limits. Reject unknown future record schemas rather than guessing.

Low-level `gates/*` functions remain available inside the source tree for historical tests and instrument adapters. They are not the new public configuration/validation boundary. Python and Swift readers still cover only compiled personality marker tables, not the clinical pathways. Python parity is tested; a Swift compiler is not available in this environment, so Swift changes were inspected but not compiled.

## Architecture and comments

`app-config.js` is the browser composition point. `policy.js` validates decisions; `core/questionnaire.js` validates additive definitions and explicit trait profiles; `core/taps.js` implements fixed published substance-specific routing; `gates/*` holds specialized published algorithms; `api.js` binds configuration and validates integration data; `presentation.js` renders derived records without rescoring. `interview.js` owns only the reference UI's ephemeral sitting and phase transitions. `bootstrap.js` handles startup import/configuration failures with an unavailable screen and never automatically reloads an active sitting.

Keep clinical reasons, units, inclusive/exclusive boundaries, original-code/keyed-score distinctions, and privacy invariants in comments near the responsible logic. Avoid comments that merely narrate JavaScript syntax. New public behavior needs an executable example or a boundary test. Avoid introducing a generic expression language, service container, remote questionnaire loader, framework migration, or database before a concrete workflow requires one.

The reference UI's heading focus, contextual labels, keyboard behavior, text enlargement and disclosure patterns are documented in [ACCESSIBILITY.md](ACCESSIBILITY.md). Keep these checks when changing UI primitives or embedding the engine in another renderer.

Use `npm run verify` after `npm ci` and installing the documented browser/PDF prerequisites. Local Git history and a pinned GitHub Actions workflow are present; hosted execution still needs an owner-approved remote.

## Optional measure registry · engine 0.3.0

Pass `questionnaires` from `questionnaires/registry.js` to the factory to include the browser's optional measures. Hosts can register a subset. Setup gains an optional `forms` map for explicit mutually exclusive form variants; old setup inputs without this map remain accepted. Derived additional results can have `scales`, and their combined `total` and `max` are deliberately null. ASRS additionally reports a separately labelled `continuousTotal`. See [MEASURES.md](MEASURES.md) and the declarations for scoring, provenance, source archives and backwards compatibility. A named adapter accepts only its unchanged reviewed definition. Existing additive questionnaires and built-in API composition continue to work.

The optional registry also has a typed package subpath, `open-screen/questionnaires`; `examples/integration.ts` checks its immutable definitions, explicit TAPS form choice and nullable scale results.

Practice-readiness work uses local Git history. The baseline commit is `1a04672`.
Run `npm ci`, `npx playwright install --with-deps`, then `npm run verify` in CI.
The GitHub Actions workflow is runnable after an owner supplies/approves a remote;
its existence does not mean hosted checks have run. Never commit clinical exports,
encrypted sitting files, passwords, .env files, browser profiles or test artifacts.
The action dependencies are pinned to verified upstream commit SHAs and the job
has read-only repository permissions and no retained checkout credentials. Review
pins periodically against [GitHub's secure-use guidance](https://docs.github.com/en/actions/reference/security/secure-use).

Captured built-in forms are identified by engine/rules version. Any change to a
built-in item, anchor, code, reverse key, timeframe or scoring algorithm must bump
its engine/rules version and receive source/boundary review. Keep the corresponding
old release available for saved files. The recovery boundary refuses incompatible
versions; it does not silently migrate or reinterpret a clinical sitting. Custom
questionnaire snapshots also retain their actual definitions and versions.


## Record/recovery contracts · 0.5.0

`core/workflow.js` binds safety review to its current findings and validates the
retained PHQ amendment/prior-review trail. Shared external-total schemas reject
impossible fixed-form entries. Standard reports include every selected module's
administration status. Raw safety codes/bindings are removed from minimal exports
alongside responses/text; use the response appendix deliberately.

`core/transitions.js` creates fresh compatible setups and capacity-checked history
proposals before the UI commits them. `archiveParts()` verifies and splits a full
bundle at the shared vault plaintext budget, retaining every current/history record.
A standalone accepted bundle may exceed one envelope; archive it rather than
raising the cryptographic size bound or deleting records. Deletion from the tab
requires separate explicit confirmation after archive download requests.

History orders actual timestamp instants with deterministic ties. PCL comparisons
include an explicit non-identifying event reference; missing references do not
connect different sittings. Do not rewrite timestamps or content already covered
by an attestation.

`npm run check` now includes source-hash and installed-package checks. Failure
artifacts are synthetic and retained for seven days in the CI definition. Runtime
remains dependency-free; no AI inference or network service was added. See
[the implementation record](REVIEW_IMPLEMENTATION_2026-10-30.md) for compatibility,
new regressions and the human acceptance work still required.


`clinicalSummary(record, clinician, { concise: true })` supplies the reference UI's
copy-to-notes action. It removes duplicate score/status prose and default engine/
policy metadata; it retains actual scores/ranges, brief/full distinctions,
functional impact, incomplete or unadministered measures, entered observations,
notes, safety endorsements/amendments/review state and unsigned/final labels.
Custom settings and forensic limits remain when relevant. The default summary,
full-record copy, structured data and reports retain their established detail.
Copying never finalises or marks an assessment recoverable.


`Setup.followUpChoices?: Record<string, boolean>` captures explicit full-form
administration decisions, independently of automatic thresholds and clinician
`followUps` overrides. False suppresses the corresponding stage-2 path and full
score, preserving brief scores, retained response data and safety observations.
Monitoring ignores these screening choices. Omitted fields preserve the default
SDK routing. Portable drafts may use workflow phase `followups` while the browser
shows the initial readout/chooser; the decision is saved with the assessment.
