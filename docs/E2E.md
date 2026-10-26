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
npm run test:e2e -- --project=chromium --grep 'safety interruption'
npx playwright show-report
```

The HTML report is `playwright-report/index.html`; machine-readable results are `test-results/results.json`. Downloaded synthetic HTML, the native PDF and review screenshot are retained in the relevant test output directories. Failure traces can be opened with `npx playwright show-trace path/to/trace.zip`. These directories are ignored by version control. Do not upload real clinical records as test fixtures or diagnostic artifacts.

## Coverage

- Negative five-question sitting and all four clinical branches: 54 actual answers, brief stages first, no duplicate shared items, independent expected totals and structured download assertions.
- PHQ-9 safety interruption, below-gate clinician override, forensic context, gate edits, retained safety flag and inactive-answer appendix.
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
