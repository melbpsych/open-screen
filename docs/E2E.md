# Browser regression tests

The Playwright suite runs actual controls against `serve.py` over HTTP. Every response, note, reference and event description is synthetic. Tests use fresh browser contexts, start a separate server on port 8791 and refuse to reuse a running server. They do not touch a clinician's sitting on port 8765. No retries are enabled; failures retain a trace and screenshot.

## Run

Use Node 22+, Python 3.9+, and a Playwright-supported operating system. Native PDF assertions also need Poppler's `pdftotext` on PATH (`poppler-utils` on Ubuntu).

```sh
npm ci
npx playwright install --with-deps chromium firefox webkit
npm run verify
```

`verify` runs configuration validation, public TypeScript contract checks, JavaScript/HTTP/Python checks, then the browser suite. `npm run test:e2e` runs only browsers. Chromium, Firefox, WebKit, Pixel 7 Chromium emulation and iPhone 13 WebKit emulation are configured in `playwright.config.mjs`. Two workers limit resource contention. Clipboard permission/readback, native PDF generation, unload-dialog and forced-colour tests use Chromium projects because those automation facilities vary by engine; the remaining workflows run in all five projects.

For a focused regression:

```sh
npm run test:e2e -- --project=chromium --grep 'optional|endorsement|legacy safety'
npx playwright show-report
```

The HTML report is `playwright-report/index.html`; machine-readable results are `test-results/results.json`. Downloaded synthetic HTML, the native PDF and review screenshot are retained in the relevant test output directories. Failure traces can be opened with `npx playwright show-trace path/to/trace.zip`. These directories are ignored by version control. Do not upload real clinical records as test fixtures or diagnostic artifacts.

## Coverage

- Negative five-question sitting and all four clinical branches: 54 actual answers, brief stages first, no duplicate shared items, independent expected totals and structured download assertions.
- Uninterrupted PHQ-9 progression after an endorsement, optional risk notes/finalisation, legacy safety-pause recovery, below-gate clinician override, forensic context, gate edits, retained findings and inactive-answer appendix.
- Setup requirements, keyboard operation, Back, next-patient reset and cancelled reset; personality reverse scoring, live graphs, Clear and navigation/unload protection.
- Optional DASS Stress, response-pattern screening and trait extensions.
- Modified policy and a dynamically registered invented questionnaire through the same application modules; prerequisite enforcement, original response codes, reverse key, review and reports. Route interception supplies test-only configuration; the practice registry is unchanged.
- Actual HTML/JSON downloads, explicit response appendix, escaped malicious text, offline HTML rendering, native Chromium PDF text, current notes and source headings, real clipboard readback, denied clipboard fallback and an asynchronous-copy edit race.
- Horizontal overflow at 320, 390, 768 and 1440 pixels, including an open export menu and long custom metadata. Automated axe WCAG A/AA checks cover the library, patient question, clinical review and completed personality screen.
- Invalid configuration blocks startup. Each flow also checks uncaught exceptions, console errors, failed application requests, HTTP errors and unexpected outbound HTTP requests. The intentionally invalid startup test allows only its expected error message.
- Usability regressions verify automatic advancement on clinical answer selection, double-click/held-key protection, keyboard activation and Home/End selection, retained answers on Back, heading focus and question timeframe descriptions, skip links, expanded administration-setting scans and targets, 200% text at 320px through the main screens and offline export, and export-panel Escape/focus/outside dismissal. A keyboard walk checks review focus visibility with desktop sticky controls and at phone width. Chromium projects also verify forced-colour selection/focus styling. Enlarged-text screenshots are retained as artifacts. See [ACCESSIBILITY.md](ACCESSIBILITY.md) for implemented behavior and limits.

Tests compare published-scale arithmetic with independent known totals; they do not validate clinical sensitivity or specificity. Axe checks are useful automated coverage, not a formal accessibility audit. WebKit is the browser engine, not certification of installed Safari. Phone projects emulate viewport, touch and browser behavior; they are not physical-device tests. Native printer dialogs, OS print drivers and other software receiving exported records need separate acceptance checks.

## This workstation

The 26 October 2026 run used Arch Linux ARM, outside Playwright's supported Linux distributions. Chromium and Firefox ran directly. WebKit used Playwright's Ubuntu ARM binary with verified official Ubuntu Noble `libicu74`, `libxml2` and `libflite1` packages extracted into the user's cache, without changing system packages. The cached MiniBrowser launch wrappers were adjusted to preserve inherited `LD_LIBRARY_PATH`. The run command was:

```sh
LD_LIBRARY_PATH=/home/peter/.cache/open-screen-webkit-deps/usr/lib/aarch64-linux-gnu npm run verify
```

These compatibility files and wrapper adjustments are local browser-tooling setup, not application dependencies or repository patches. A clean supported Ubuntu runner should use the normal installation command above; a fresh Arch workstation needs its own browser dependency setup. Results and product fixes are recorded in [VERIFICATION.md](VERIFICATION.md).

Practice-preference regressions cover actual browser-local persistence and reload, rationale/default differences, settings JSON downloads, changed routing and report provenance, full/field reset, active-sitting isolation, the next patient adopting saved settings, live updates from the setup link, registered questionnaires, invalid drafts, conflicting editors, corrupt-data recovery without clearing unrelated storage, failed writes retaining saved values, keyboard focus after reset/discard, and expanded editor axe/reflow checks at 320px with 200% text. The new pure preference tests check whitelist/range validation, review after deployment changes, immutable replay and retained safety observations.

Practice-readiness tests additionally exercise actual encrypted file download and
upload, wrong passphrases/reference matching, exact question/settings/safety
recovery, partial administration, clinician attestation and draft correction,
compatible history in actual PDF output, templates without patient data,
enlarged dialogs, encryption cancellation, concurrent settings writers, stale
review rejection and explicit legacy-settings migration. Encryption files and
PDFs use synthetic fixtures only. CI installs poppler-utils for real PDF text
extraction; no untested visual approximation substitutes for the PDF checks.

## Guidance and access regressions

`tests/e2e/guidance.spec.mjs` checks that Help preserves an active sitting, works
without JavaScript, and passes axe WCAG 2.2 AA rules with disclosures expanded.
It applies text-spacing preferences and checks 320px, 768px tablet portrait,
1024px tablet landscape, 844×390 short landscape and 1920px desktop reflow, plus
native focus scrolling in clinical review. A real encrypted file verifies that
cancelling replacement preserves a reference-only draft. Run this file across
all five configured projects with `npx playwright test tests/e2e/guidance.spec.mjs`
(using the WebKit prerequisite above where necessary). These viewport checks do
not substitute for actual on-screen keyboards, physical devices or human AT use.

The visual-flow case in guidance.spec.mjs additionally checks that monitoring uses
full measures rather than brief-to-follow-up labels, icon actions retain their
accessible names, and visual guide links navigate to the intended section.


## Whole-app design regressions · 29 October 2026

`design.spec.mjs` adds eight scenarios in each of the five browser profiles:
direct home recovery and revealed-passphrase clearing; compact selection and
administration; actionable review and date-field correction focus; forensic
field navigation; purpose-based export/dialog dismissal; focused threshold
editing without draft loss; export bounds and keyboard visibility with text
spacing and short landscape; and collapsed scores expanding to real graphs and
evidence. Existing questionnaire/profile accessibility checks explicitly open the
new result disclosures before scanning. Offline report and native PDF assertions
check complete content even when the screen is collapsed.

The concurrent-settings regression now runs eight competing writer pairs per
profile, requiring one successful writer and one conflict for each pair, and both
tabs converging to the retained revision. It caught a Firefox localStorage
snapshot/task-boundary race; the lock now spans explicit task boundaries. See
ARCHITECTURE_REVIEW.md for the scope and source. This verifies cooperating local
browser writers, not a transactional external clinical-record system.

The configured matrix contains 404 executions, including Chromium-specific
facilities on the two Chromium profiles. VERIFICATION.md records the latest
completed run and any limits. No automatic retries hide a failed attempt.


## Complete PDF export · 30 October 2026

`pdf-export.spec.mjs` checks the direct Export PDF control across all five
profiles: full appendix with HTML/JSON appendix disabled, current notes after
editing, unchanged encrypted-save state, cancellation/focus, 320px and enlarged
text, and partial reports retaining missing reasons and incomplete results.
Native print-dialog invocation is observed with a test double in these cases;
OS destination selection is a human acceptance task. Chromium's native PDF
cases generate actual A4 files and extract their text with Poppler, including
long-note pagination, full responses, sources, personality facets, recovered
final history and a subsequent correction labelled Draft. Only synthetic reports
are used. Shared workflow tests also retain active and inactive missing-answer
reasons in HTML, structured/full text and the response appendix without imputing
numeric scores. See VERIFICATION.md for completed runs and limits.

## Component and clinical-use follow-up · 29 October 2026

`components.spec.mjs` adds four cases per profile: current-page navigation at
320px with enlarged text; native/business field feedback, focus and correction;
threshold hints/errors and revision requirements; and genuine encryption pending
state with cancellation available. The crypto observation uses a controlled
completion barrier, not a timed sleep. `clinical-use.spec.mjs` adds two cases per
profile: an externally entered total does not supply missing item answers or
force risk documentation; and source-linked clinical guidance works with
JavaScript disabled and expanded disclosures pass axe. The matrix now has 434
executions. Final counts and interrupted/exploratory runs are in VERIFICATION.md.


## Optional risk documentation · 30 October 2026

The screening flow has no automatic safety pause, risk-documentation checklist,
missing-answer acknowledgement or risk-based finalisation gate. Risk notes are
optional inside the collapsed Notes & final record section. Additional legacy
structured fields remain available behind another disclosure; existing captured
notes and observations are preserved. Empty risk metadata is absent from reports.

Current cases verify uninterrupted administration, finalisation with an endorsed
item or an explicitly missing response, one optional risk note across copies/PDF
and encrypted recovery, corrected-answer provenance, and resuming a synthetic
legacy safety-pause file at the next question. Completion, valid input and final
signature checks remain covered independently. See VERIFICATION.md for run counts.


## Hosted CI environment · 6 November 2026

GitHub verification uses Microsoft's official Playwright `v1.64.1-noble` image,
pinned by the multi-platform digest in `.github/workflows/verify.yml`. This must
match the Playwright version in the lockfile when updating dependencies. The
image supplies browser binaries and OS dependencies; `npm ci` still installs the
locked test packages. Python and Poppler support the HTTP/scoring/PDF checks.
The full `npm run verify` and separate public-demo matrix both run, with no
retries or relaxed assertions. CI's 30-minute job budget includes image setup;
it does not change per-test timeouts or clinical thresholds.

This replaces an in-job browser installer that stalled before application tests.
The local workstation instructions above remain applicable. Image documentation:
https://playwright.dev/docs/docker

GitHub mounts the container's ephemeral home directory with a different owner.
The workflow aligns that directory's owner with the current container user before
browser launch. Firefox otherwise refuses to start. HOME and browser sandbox
flags are not overridden. This is CI-only setup, not an application change.
