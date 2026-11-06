# Verification record

Updated 30 October 2026. The latest adversarial correction release is recorded at the end; earlier entries describe their dated baselines. All questionnaire responses used below were synthetic.

## Automated checks

`npm run check` passes **73 JavaScript tests**, **4 real HTTP security tests**, the Python scoring-parity/invalid-code checks, configuration validation, and the TypeScript integration example. Compiled personality output is verified without being rewritten. A clean `npm ci` succeeded; `npm audit` reported zero known dependency vulnerabilities on this date. The original application had 25 JavaScript tests; the previous UI refinement had 55. Clinical and presentation checks exercise threshold boundaries and all PHQ-9/GAD-7 possible integer totals, invalid/missing answers, stale follow-up deactivation, stage ordering, shared-item carry-forward, clinician overrides, AUDIT-C threshold configuration, forensic record provenance, retained safety observations, graph/threshold agreement, escaped offline reports, optional appendices and trait-extension summaries, strict response validation, and explicit trauma exposure stop rules.

`node --check` passes for the changed browser modules and the gate engine. `python3 -m py_compile serve.py` passes. Official Australian-English source PDFs were extracted with `pdftotext` and checked against the PHQ/GAD definition text. `docs/sources/manifest.json` records the download URLs, retrieval date, and SHA-256 hashes.

## Repeatable browser tests — 26 October

`tests/e2e/` now contains actual Playwright browser tests, with an isolated HTTP server, fresh contexts, no retries, retained failure traces and strict browser diagnostics. The five-project matrix contains 133 runs: 29 Chromium, 25 Firefox, 25 WebKit, 29 Pixel 7 Chromium emulation, and 25 iPhone 13 WebKit emulation. **Final result: 133/133 passed in 2.7 minutes, with zero retries, failures or skipped tests.** Phone projects are emulation, not physical devices; WebKit is not certification of installed Safari.

The suite exercises:

- **Negative sitting:** five real responses, no full-scale totals, no scores on patient handoff, no local/session storage or cookies, and a real JSON download.
- **All four clinical branches:** 54 actual answers, 13 brief questions before follow-ups, unique shared items, PHQ-9 8/27, GAD-7 7/21, AUDIT 3/40 and PCL-5 20/80. Current notes and reference survive the downloaded structured export. These are software arithmetic checks, not diagnostic-accuracy estimates.
- **Safety and forensic workflow:** PHQ-9 item 9 pauses the flow, a clinician acknowledgment permits continuation without clearing the flag, and closing an edited gate removes the inactive full score while retaining the safety observation and raw audit trail. A below-gate clinician override still pauses at a total of 1/27.
- **Real use:** keyboard arrows, Enter exactly once, numeric shortcuts, Back retaining the selected answer, next-patient isolation, fresh AUDIT-C threshold selection, and cancelled resets preserving clinical notes.
- **Optional modules:** DASS Stress raw/doubled scores, separate response-pattern results, and four ten-item personality extensions with the original reverse-keyed marker counted once.
- **Personality:** the mixed pattern 4, 5, 1, 2, 3 yields High, Low, High, High, Middle; arrow editing changes the reverse-keyed result correctly. Clear removes results. Cancelling in-app navigation preserves answers; confirmed navigation clears them. Native Chromium tab-close/unload dialogs protect unexported answers and cancellation retains them.
- **Exports:** actual HTML/JSON downloads, explicit appendix inclusion, hostile note/reference text escaped and rendered offline, latest clinician edits, and print-media layout. Native Chromium generates an A4 PDF; `pdftotext` checks all four scales, current notes and sources and excludes interactive controls. The generated PDF and desktop/mobile review screenshots are visually inspected. This does not test physical printers or OS print dialogs.
- **Clipboard:** actual Chromium clipboard permission/write/readback, denial of both Clipboard API and fallback without uncaught errors or orphan elements, and an asynchronous-copy edit race retaining the latest record as unsaved.
- **Configuration and extensions:** a custom gate changes navigation, labels and the downloaded policy together. The invented registered questionnaire enforces its prerequisite, carries shared items once, preserves the original reverse response code and scores 4/4. Invalid policy prevents startup with a visible alert. Browser route interception supplies these synthetic assets without changing the practice registry.
- **Responsive and accessibility:** overflow checks at 320, 390, 768 and 1440 pixels, including the open export menu; long unbroken custom metadata through setup, review and offline HTML. Axe WCAG A/AA checks cover the library, patient question, four-domain review with severity legends and completed personality charts. Reduced-motion preferences are emulated throughout. This is not a formal accessibility or screen-reader audit.
- **Diagnostics:** every successful flow also rejects uncaught exceptions, console errors, failed application requests, HTTP errors and unexpected outbound HTTP requests. The invalid-startup case permits only its specific expected console error.

### Further usability and accessibility refinement

The final refinement passed the complete `npm run verify` command, including all 133 browser runs and the existing core checks. A subsequent review improved the existing visual system with larger relative typography, stronger control outlines, legible chart labels, roomier phone navigation, a simpler narrow export grid, full-size editable fields, wrapping report metadata and bounded spacing at enlarged text sizes. Published item wording, scoring and thresholds are retained. Question transitions now focus the heading and expose its timeframe/examples as accessible descriptions; selection keeps focus on the response. The export disclosure closes on Escape or leaving it. Personality results announce readiness without moving the viewport away from the selected response.

New regression cases cover expanded forensic/alcohol/DASS setup with axe and 44px targets, heading/description/skip-link behavior, 200% text at 320px through the library/sitting/review/personality/offline report, and keyboard focus visibility with the desktop sticky toolbar and at phone width. Chromium additionally checks forced-colour selection/focus styling. The expanded setup scan found a low-contrast sidebar note; the note was darkened. Firefox's enlarged-text run found a library grid/button overflow; the grid now permits its contents to shrink and wrap. WebKit's native Tab scrolling settles asynchronously, so the focus check observes the settled result without scrolling the target itself. [ACCESSIBILITY.md](ACCESSIBILITY.md) documents the behavior and remaining assistive-technology checks.

### Defects found and corrected

| Finding from browser testing or integration inspection | Correction and regression |
| --- | --- |
| More menu extended outside a 320px page | Anchor the popup to the toolbar at narrow widths; check the open menu across widths |
| Long registered names overflowed setup and offline reports | Permit wrapping and shrinking grid tracks; exercise setup consent, review and downloaded HTML at 320px |
| Denied clipboard fallback could throw and leave a temporary textarea | Catch fallback failure, always remove the element and restore focus; verify feedback and record retention |
| Conditional interview text could exceed the API's 4000-character boundary | Match the control limit to validation; type beyond the limit and export after rerender |
| Some small chart labels failed AA contrast | Darken denominator, distribution and footer labels; scan completed screens with axe |
| Printed source list lost its heading | Retain the Sources heading in print; inspect native PDF text |
| Personality navigation silently discarded responses | Add unload and hash-navigation guards; verify cancellation and confirmed clearing |
| Public report helpers omitted recorded clinician fields when their optional second argument was absent | Default to `record.clinician`; assert notes, reference, safety review and observations in all three helpers, plus explicit override behavior |

The initial Chromium run reproduced product flaws. The first complete matrix then identified the additional mobile setup overflow. Test harness issues were corrected separately, including an assertion against encoded HTML instead of rendered text and Playwright waiting for a cancelled reload. The unload test now uses Playwright's explicit `runBeforeUnload` close operation, observes the actual browser dialog and verifies retained responses. No automatic retries hide failures.

The collaborative preview was attempted first, but snapshot calls on the open tab twice returned `Preview automation snapshot timed out after 15000ms.` The repeatable suite therefore uses standalone Playwright. This host is Arch Linux ARM; the WebKit compatibility setup and reproducible commands are documented in [E2E.md](E2E.md).

## Safety action spacing fix — 26 October

The safety-screen resource link and clinician continuation button now occupy separate rows with an explicit gap. The button wraps within the available width. The focused browser run passed **15/15 tests**, without retries, across Chromium, Firefox, WebKit and both phone emulations. The new case checks separation and overflow at 1440, 1061, 768, 390 and 320px, plus 200% text at 320px, then verifies keyboard continuation and retained safety status. Existing forensic safety/edit and below-gate override regressions also passed. The 133-run full-suite result above is the preceding usability milestone; the full suite now includes five additional project runs for this regression.

## Visual screening logic page — 26 October

The subsequent complete `npm run verify` run passed **153/153 browser tests** in 2.8 minutes, without retries, plus all 73 JavaScript tests, configuration/type checks, compiled-data/Python parity checks and four HTTP tests. This full run includes the safety-spacing regression above and 15 new logic-page runs across the five browser projects.

The new page shows the actual configured gates, shared-item counts, trauma exposure stop, clinician override, independent PHQ-9 safety pause and optional measures. Browser tests follow its library link, open it from a populated forensic setup in a separate tab and verify the original setup remains intact, intercept a changed policy and registered questionnaire to confirm displayed routing values, and check reflow at 1440/768/390/320px and 200% text at 320px. Axe checks run with optional content expanded and include WCAG 2.1 A label-in-name checks. Those checks found that the shared logo's “Open Screen home” accessible name did not include its visible “openscreen” wordmark; the accessible name now matches the wordmark. Native collaborative-browser screenshots were also inspected at desktop and phone widths. Assistive-technology and clinical-validation limits described elsewhere still apply.

## Automatic question advancement — 26 October

Clinical answer selection now records the response and advances immediately. Choice questions have no Continue button; optional event text retains Continue and Ctrl/Command+Enter. A visible instruction before the choices, also included in the radio group's accessible description, explains the change. The next question heading receives focus. Back restores the previous answer for editing, and PHQ-9 item 9 still pauses immediately for clinician review. The shared radio-key handler stops restoring focus to an option after its original group has been replaced by a new question.

The complete `npm run verify` run passed **158/158 browser tests** in 2.2 minutes, without retries, plus the configuration/type checks, 73 JavaScript tests, compiled-data/Python parity checks and four HTTP tests. Existing clinical, optional-measure, extension, export and accessibility tests now answer through the real automatic-advance flow. Added regressions exercise double-clicks, held number keys, Enter/Space activation, actual touch taps in both phone projects, Back and reselecting a retained answer. Browser testing caught a double-click moving focus to an unanswered option on the next screen; repeated clicks now preserve the new heading's focus without recording a second answer. The updated timeframe assertion follows the actual instrument after the newly automatic transition.

## Editable practice preferences — 26 October

The complete `npm run verify` command passed **198/198 browser tests** in 2.7 minutes, without retries, plus all **78 JavaScript tests**, configuration/type checks, compiled-data/Python parity checks and four HTTP tests. A final keyboard-focus refinement passed another **10/10 focused browser runs** across all five projects: resetting personality extension bands now focuses the fieldset, and discarding edits focuses the saved-settings status. The final source also passes JavaScript syntax checking.

The logic page now supports live unsaved previews, explicit browser-local save with a practice rationale, default comparisons, customisation badges, field/full reset and a downloadable settings record. Additional rules include full-screen thresholds, PCL item endorsement, permitted/default AUDIT-C gates, personality extension bands, descriptive response-pattern boundaries and severity boundaries; registered questionnaire fields appear automatically. Source wording, option scores and independent safety handling are not preferences. Configuration identity, rationale, date and actual effective values remain in clinical record snapshots, reports and custom copied summaries.

New browser cases exercise persistence/reload, changed screening routes, downloaded settings and clinical records, report rationale, reset returning to the original gate, active-sitting isolation, the next patient adopting saved settings, a live setup-tab update retaining context/reference, registered thresholds, invalid values, competing editors, corrupt-data recovery without clearing unrelated storage, and a failed storage write retaining saved preferences. Expanded-editor axe checks and reflow run at 1440/768/390/320px and 200% text at 320px. Unit tests cover strict whitelist/range/cross-field rejection, immutable saved replay, default-version mismatch, registered definitions and retained safety observations.

Testing found and corrected two product flaws: reset-button accessible names omitted the visible word “field”, and rotating an entire decorative arrow container on phones let its invisible hit area cover an editable gate. Only the arrow icon now rotates, and decorative arrows ignore pointer input. The corrected focused phone matrix passed 16/16 runs before the complete suite. Native collaborative-browser interaction also confirmed that editing a gate produces a labelled unsaved preview without writing storage, and Discard restores the saved values. No arbitrary custom thresholds were left saved in the running practice browser.

These checks validate software behavior, rather than the diagnostic accuracy of custom thresholds. Browser-local preferences are not device synchronisation, authenticated administration or a signed audit log; [CONFIGURATION.md](CONFIGURATION.md) and [SECURITY.md](SECURITY.md) describe their scope and failure behavior.

## Minimal logic-page refinement — 26 October

The default logic page now uses aligned pathway rows, one shared routing explanation, a shorter heading and compact settings fields. Repeated threshold/branch explanations, nested field cards, inactive reset controls and duplicate change lists were removed. Longer administration and interpretation notes remain available in a native **Pathway notes** disclosure. The independent safety path, defaults, customisation badges, saved record and explicit save/reset/export actions remain available. No scoring or persistence logic changed.

At the same 1280px desktop width and default configuration, native-browser measurements reduced visible main-content words from **317 to 183** (42%) and document height from **2348px to 1453px** (38%). This is a measurement of the collapsed default page, not a universal claim for every custom registry or enlarged-text setting. Native desktop/editor/390px phone screenshots were inspected without saving practice overrides.

All **55 logic/preference browser regressions** passed across the five browser projects. After a final phone-toolbar adjustment, **15 focused responsive, persistence/reset and accessibility runs** also passed. The checks include open pathway notes, optional content and the expanded editor, 320px reflow and 200% text, keyboard reset/discard focus, custom questionnaire gates, failed writes, stale editors, and active-sitting isolation. `npm run check` passed all 78 JavaScript tests, configuration/type checks, compiled-data/Python parity checks and four HTTP tests. Earlier full-suite counts above describe their dated milestones; this UI-only refinement was verified with the affected browser suites.

## Architecture and integration checks (26 October)

- **Configuration isolation:** separate factories apply their own gates, full-screen classifications, trauma endorsement thresholds, personality extension rules and response-pattern settings. Graphs and report labels use the same effective rules. Mutating an input policy after registration has no effect.
- **Additional questionnaire:** the public API and an isolated browser app copy used the invented three-item example. Registry discovery, default selection, required confirmation, brief/full routing, original response codes, reverse key, review, source attribution and print output worked without changes to the UI. The score was the expected 4/4. The practice registry remains empty of examples.
- **JSON export:** an actual browser download from the hardened server retained schema and configuration provenance and omitted both the raw response map and text appendix by default. Automated tests verify full-export replay with a fixed clock and identical engine/configuration.
- **Startup failure:** an intentionally invalid threshold in the isolated copy produced a visible “Screening is unavailable” alert and no Begin control. The production configuration loaded through the new bootstrap with no failed resource responses.
- **Security:** HTTP tests verify security headers, local Host validation, prohibited writes, directory/hidden/traversal paths and symlinks. HTML tests cover escaped notes and extension metadata. Strict numeric validation covers the historical personality reader as well as the clinical boundary.
- **Packaging:** explicit public entry points and an allowlisted SDK archive exclude the development server, secrets, node_modules and patient exports. The actual packed SDK was installed in a temporary receiving project; bare package imports, pure scoring, summary, HTML, JSON and the TypeScript example passed there. The 54-question four-domain browser regression reproduced 8/27, 7/21, 3/40 and 20/80. A clinician override again paused on PHQ-9 item 9 and retained the priority flag at a total of 1/27. Nothing was published.
- **Earlier preview checks:** native preview locator/snapshot operations timed out; rendered DOM control handlers were used for the earlier integration walkthrough. The repeatable cross-engine suite above supersedes that walkthrough for browser regression coverage.

## Boundaries of these checks

These are software and source-wording checks, not clinical validation of the combined pathway. No actual patients, diagnostic interviews, forensic outcome criteria, local operating-characteristic estimates, formal screen-reader audit, physical-device/installed-Safari certification, remote portal, security penetration test, or medical-device assessment was included. The app implements a supervised local workflow. Its evidence and use limits are in [CLINICAL_SCOPE.md](CLINICAL_SCOPE.md).

## Reproduce

```bash
cd /home/peter/Work/open-screen
npm ci
npm run check
npm start
```

Open `http://127.0.0.1:8765/index.html?v=2` for the toolkit or `http://127.0.0.1:8765/interview.html` for setup. To repeat the complete automated browser checks, follow [E2E.md](E2E.md) and run `npm run verify`. Reports and artifacts are generated locally; the app server and practice registry remain independent of the test server. Copy, save, or print any real sitting before closing its tab: the app deliberately has no persistent answer storage.

## Optional measure expansion · 26 October 2026

The complete Playwright regression ran **225/225 passing**, across Chromium, Firefox, WebKit, Pixel 7 Chromium and iPhone 13 WebKit (3.8 minutes, two workers, no retries). It includes 25 new shared-measure runs and two additional actual A4 personality PDF checks. `npm run check` passed **99 JavaScript tests**, configuration validation, TypeScript contracts, compiled personality checks, Python parity and all four HTTP security tests.

Coverage added: exact ASRS item-specific endorsement boundaries and discrepant research totals; unchanged-form enforcement; immutable published definitions and an independent comparison baseline; DSS-B missingness and no fabricated cutoff; all 164 new trait item keys checked against archived primary sources; Mini-IPIP original Appendix order; NEO-120 numbered source order and its documented item-58 wording discrepancy; complete and partial scales; TAPS explicit male/female variants, locale acknowledgement, class-specific skips and zero-by-stop-rule explanations; stale-branch edits; other-drug description privacy; patient reset; all modules selected together; source-file SHA-256 checks; summaries, source attributions and offline exports.

New browser workflows complete the six optional personality modules through all 164 actual choices, verify their derived profiles, expand facets, check 320px/200% text reflow and axe, and inspect the saved offline report under print emulation. Actual Chromium A4 PDF output contains the domain/facet labels and means, including Cautiousness and Sympathy; folded screen facets are expanded in the separate print record. Existing PHQ safety, custom settings, screen/record isolation, response appendices and transport guards remain covered.

The first regression exposed ambiguous section selectors in the new external-resource disclosure; separate section classes fixed them, and the full run then passed. New result counts include profiles. A final focused Chromium rerun passed **25/25** after the registry immutability refinement, covering current measures, configuration, logic, practice preferences and native outputs. A subsequent affected-workflow run passed **25/25 across all five projects**, checking TAPS, external-resource logic, external result entry, offline exports and input limits after the final ASSIST consolidation. It verifies the consolidated existing ASSIST result slot; its obsolete AUDIT-only assumption was removed without changing the established integration field ID. T3 native browser snapshots timed out repeatedly; native navigation/DOM checks worked, and repository Playwright plus the self-contained HTML preview were used for visual verification. Desktop and phone previews of the actual profile report component were checked with synthetic data.

Detailed logs are local `/tmp/open-screen-expanded-final-verify.log`, `/tmp/open-screen-expanded-final-check.log` `/tmp/open-screen-expanded-final-focused.log` and `/tmp/open-screen-expanded-external-final.log`. Playwright's report and `test-results` describe the most recent run, not an accumulation of earlier runs. Source and permission evidence is in [MEASURES.md](MEASURES.md). These checks establish software behavior against reviewed rules, not clinical validation or forensic calibration of Open Screen.

## Practice readiness workflows · 26 October 2026

Software checks pass: **113 JavaScript tests**, TypeScript contracts/examples,
configuration validation, compiled personality parity, Python parity/invalid-code
checks and four real HTTP security tests. `npm audit --audit-level=high` reports
zero known vulnerabilities on this date; this is maintenance evidence, not a
security certification.

The full `npm run verify` browser regression passed **282/282 runs** in 4.7
minutes across desktop Chromium, Firefox, WebKit and Pixel 7/iPhone 13 emulation,
with no retries or skipped cases. After the final review-priority correction,
**40/40 targeted workflow runs** passed across all five projects in 41.7 seconds.
That final change names the unfinished full form (rather than the completed brief
form) and includes unfinished personality profiles in partial-review priorities.
At that point the repository contained five additional project runs for that
regression; the full matrix was rerun subsequently, as documented below.

Evidence logs on the development workstation:

- `/tmp/open-screen-readiness-final-verify.log`: full 282-run verification and
  accompanying 113-test software checks.
- `/tmp/open-screen-readiness-complete-focused.log`: final 40 workflow runs.
- `/tmp/open-screen-readiness-last-check.log`: repeated software checks after
  the final priority change.
- `/tmp/open-screen-readiness-full-audit.log`: dependency audit.

The generated Playwright HTML/JSON report reflects the last focused run; it is
not presented as the full regression report. All fixtures, downloaded sitting
files, screenshots and PDFs use synthetic references only. Artifacts are ignored
by Git. Repeat with the commands/prerequisites in E2E.md.

New cases cover actual encrypted download/upload, wrong passphrases/reference
confirmation, recovery at the captured question/configuration/safety pause,
absence of patient data in browser persistence, cancellation during encryption,
partial-review/resumption, attestation and correction, same-patient compatible
history, actual A4 PDF history/draft output, templates and personality-burden
warnings, 320px/200% modal reflow and axe, named inactive settings drafts,
review/activation, concurrent writers, stale open reviews, legacy migration and
failed browser writes. Pure boundary tests cover authenticated-envelope
corruption, unsupported KDF/schema/version, size limits, changed final content
or reviewer, duplicate/cross-patient history, brief/full separation and altered
policies, long revision metadata, escaped history labels and exact host receipts.

Verification found and corrected the template select's accessible label,
enlarged-text search overflow, pending encryption cancellation, reference-form
Enter handling, final attestation invalidation/preservation, duplicate revision
measurements in graphs, restored catalogues/sparse clinician fields, optional
undefined fields across JSON recovery, long settings provenance before commit,
settings write races, stale review diffs and Firefox's reporting of synchronous
Web Locks callback exceptions. Actual PDFs were rendered and visually reviewed,
including the history page and values table. The before/after chooser comparison
is in ignored local artifacts/design-review/board.html.

This establishes the tested software behaviour. Independent psychologist source
and case verification, human assistive-technology/device evaluation, protected
instrument permissions, hosted CI execution and current Praxi receiving-system
auth/storage/tenancy tests remain open. Review packs and acceptance boundaries
are in PRACTICE_READINESS.md, PRAXI_INTEGRATION.md and docs/acceptance/.


## Matrix and host-contract audit · 26 October 2026

The then-current browser matrix passed **287/287** in 4.7 minutes, with no
retries or skipped cases. This includes the last full-form/profile partial-review
correction; the generated Playwright report reflected that matrix at the time.
`/tmp/open-screen-practice-acceptance-full.log` records that run.

The subsequent host-only audit adds exact practitioner/session receipt matching,
immutable receipt capture and typed `HostSaveError` outcomes for uncertain writes
and acknowledged storage with a failed context recheck. The full software check
then passes **115 JavaScript tests** plus strict types/configuration/compiled/
Python/HTTP gates, recorded in `/tmp/open-screen-practice-acceptance-check.log`.
The host module is not loaded by the standalone browser app; no browser/runtime
UI or clinical scoring code changed during this audit.

[acceptance/EVIDENCE.md](acceptance/EVIDENCE.md) maps the original requirements to
current evidence and identifies the missing human/permission/current-Praxi/hosted
CI evidence. Connected GitHub access could not read the older checkout's remote;
no matching installed repositories were returned. This is an access limitation,
not evidence that a repository does not exist. The scoped local Praxi licensing
records also do not establish grants for the protected Open Screen candidates.

## Full verification · 28 October 2026

The uncommitted worktree passed `npm run verify`, including 116 JavaScript tests,
types, configuration, compiled-data, Python and HTTP checks, and **297/297**
browser tests across all five configured profiles. The Playwright result records
zero skipped, unexpected or flaky tests. This run includes the new reviewer-reset
and adaptive-progress regressions and the existing offline and PDF checks.
The workstation log is `/tmp/open-screen-current-verify.log`; it is ephemeral
and is not hosted CI evidence. Human reviews, permissions, hosted CI and a live
Praxi receiving integration remain outstanding.

## Practice workflow upgrade · 29 October 2026 · engine 0.4.0

The final `npm run verify` passed **125 JavaScript tests**, strict TypeScript,
configuration validation, compiled-data and Python parity/invalid-code checks,
four real HTTP security tests, and **327/327 browser runs** in 5.9 minutes.
The five profiles are desktop Chromium, Firefox, WebKit, Pixel 7 Chromium
emulation and iPhone 13 WebKit emulation. There were no retries, failures or
skipped cases. This is local verification of the uncommitted worktree, not hosted
CI, physical-device testing or independent clinical validation.

New boundary and browser cases cover independent safety review at negative
depression gates; required method/outcome, deferred/declined reasons and complete
follow-up plans; forensic context; explicit missing-answer objects that never
enter numeric scoring; active versus inactive omissions; retained safety
endorsement after a later declined answer; manual advancement; low-gate repeat
monitoring and retained final history; complete personality administration with
an incomplete trait; descriptive response counts; escaped clinical metadata;
encrypted snapshot status after edits; and expanded controls at 320px with axe.
Existing encryption, configuration concurrency, offline HTML, clipboard and
actual A4 PDF checks also pass. PDF text assertions include the new safety method
and outcome. Desktop/mobile screenshots were inspected during refinement.

The first runs exposed old expectations for three charts after an exposure stop,
synthetic final records without the newly required review, ambiguous report-note
selectors, and a double-click focus issue. Expectations and fixtures now match
the intended workflow; separate report classes, reserved save-status space and
repeat-click focus handling correct the product issues. An earlier matrix was
stopped after it loaded an obsolete save-status assertion; it is not counted as
a pass. The fresh full run above followed the final functional changes.

Reproduce using [E2E.md](E2E.md). This workstation used
`LD_LIBRARY_PATH=/home/peter/.cache/open-screen-webkit-deps/usr/lib/aarch64-linux-gnu npm run verify`.
The local log is `/tmp/os-practice-upgrade-final-verify.log`; Playwright's ignored
`test-results/results.json` and HTML report reflect this full run. These artifacts
are ephemeral and contain synthetic data only. Collaborative preview status/open
returned `Authentication required`; the documented Playwright workflow supplied
browser verification instead.

[WORKFLOWS.md](WORKFLOWS.md) documents the 0.4.0 saved-file compatibility boundary.
Human acceptance, protected-form permissions, current Praxi receiving behaviour
and hosted CI remain outstanding; follow-up fields do not schedule real tasks.

## UI, guidance and engineering review · 29 October 2026

The final combined worktree passed `npm run verify`: **125 JavaScript tests**,
strict types/configuration/compiled-data/Python checks, four HTTP security tests
and **342/342 browser runs** in 6.2 minutes across desktop Chromium, Firefox,
WebKit, Pixel 7 Chromium and iPhone 13 WebKit emulation. No retries, unexpected,
flaky or skipped tests. Log: `/tmp/os-ui-guidance-full-verify.log`; ignored
Playwright HTML/JSON reports reflect this full matrix. Evidence is local and
synthetic, not hosted CI or a physical-device/AT acceptance report.

The new 15-run guidance matrix first passed separately, then passed in the full
suite. It covers separate-tab Help preserving a sitting, the manual without
JavaScript, native disclosure/anchor navigation, expanded-guide axe WCAG 2.2 AA,
text-spacing preferences at phone/tablet/landscape/wide desktop sizes, short
landscape review focus, and cancelling recovery over a reference-only draft.
Existing finalisation tests now assert that a failed review receives focus.
Actual guide screenshots were inspected at desktop and phone widths. Existing
clinical, encryption, permission/configuration, offline HTML, native PDF,
clipboard, high-contrast, reduced-motion and enlarged-text regressions pass.

Initial new-test failures were harness issues: an already-focused field did not
scroll again after resize, then an unscoped heading locator also matched the
hidden print heading. The final case re-enters the visible field after resizing
and polls native focus scrolling without scrolling the target in the test.

The implementation adds a static manual (`help.html`/`help.css`), consistent Help
navigation, named shared design tokens, protection for reference/notes-only
replacement, and focused finalisation errors. No clinical scoring or engine
schema changes. DESIGN_SYSTEM.md documents components and change contracts;
ARCHITECTURE_REVIEW.md records the engineering review. Human screen-reader,
physical-device and other practice acceptance requirements remain open. This
record does not claim universal device compatibility or WCAG certification.

## Shorter copy and visual workflows · 29 October 2026

Setup and review now use shorter repeated explanations and labelled SVG action
icons. An ordered workflow diagram shows brief screens → indicated follow-ups →
clinician review → encrypted save; monitoring correctly shows full measures
instead. Help adds four visual anchor links. Full questionnaire wording, anchors,
timeframes, scoring, permissions and safety meaning remain unchanged. Copy
success/dirty feedback retains its icon. Desktop guide and 320px setup screenshots
were inspected. The implementation uses no new dependencies or remote images.

`npm run verify` passed all **125 JavaScript tests**, supporting strict types,
configuration, compiled/Python/HTTP checks, and **342 of 347 browser runs**. The
remaining five were the same stale overlap-warning text assertion across all
profiles, not a missing warning. Updating that test to the new complete warning
was the only subsequent change. All **5/5 affected workflow runs then passed**,
including their remaining 320px/200% text and axe assertions. Thus all 347 matrix
scenarios have passing evidence across the full run and corrected focused run;
a single fresh 347/347 full pass is not claimed.

Logs: `/tmp/os-visual-copy-full-verify.log` and
`/tmp/os-visual-copy-final-targeted.log`. The ignored Playwright report now reflects
only the five-run correction check. New visual-flow cases passed across all five
profiles in the full run, covering mode-dependent diagram labels, action names,
reflow, axe and guide navigation. Core clinical and external acceptance limits
in the preceding records still apply.

## Logo navigation · 29 October 2026

The clinical wrapper now retains the shared home link during questions, safety
pause and handoff as well as setup/review. Existing unsaved-work guards remain.
The focused logo/negative-sitting matrix passed **17/17 runs** across all five
profiles, including actual navigation from library/logic/guide/setup, link
semantics throughout a positive safety pathway, and Chromium desktop/phone
beforeunload cancellation retaining the question followed by confirmed navigation.
Log: `/tmp/os-home-logo-final-verify.log`. No scoring or storage changes. An initial
warning-test fixture had no clinical work to protect; that run was stopped and
the final run uses an entered synthetic reference. This is focused verification,
not a repeat of the whole browser matrix.

## Minimal homepage baseline · 29 October 2026

Home now has one assessment entry, a short explanation, Help and secondary logic
access. The original standalone tool remains in a closed More tools disclosure;
personality measures remain available in sitting setup. Duplicate cards, pathway
preview, badges and repeated home navigation were removed. Scoring and captured
sitting schemas were not changed. Desktop and phone renders were inspected.

The focused Chromium pass succeeded: **13/13** home/personality/usability/logic
runs, including keyboard navigation, enlarged text and axe. `npm run verify`
then passed all **125 JavaScript tests**, strict types/configuration/compiled/
Python/HTTP checks, and **321 browser runs** before the command was terminated
with exit 143. No browser failures were logged, but no completion report was
produced. Completed profiles were Chromium 77, Firefox 70, WebKit 70 and mobile
Chromium 77; mobile WebKit had completed 27. Its abandoned test server was stopped
and the entire mobile-WebKit profile was rerun: **70/70 passed**, no unexpected,
flaky or skipped cases. All **364 matrix scenarios** therefore have passing
coverage across those runs; a single completed 364/364 matrix is not claimed.

Logs: `/tmp/os-minimal-home-focused.log`,
`/tmp/os-minimal-home-full-verify.log`,
`/tmp/os-minimal-home-final-mobile-webkit.log`. The ignored Playwright report now
reflects the final 70-run profile. Homepage comparison images are in ignored
`artifacts/design-review/home-minimal/`. T3 collaborative preview and inline HTML
preview/render returned `Authentication required`; repository Playwright and local
self-contained artifacts supplied visual verification instead.

Subsequent Mobbin research covers the wider workflow and proposes future changes
in UX_RESEARCH.md. It does not change clinical rules or claim that the proposed
setup/review/export redesign has already been implemented.

The expanded research bundle includes a self-contained local reference board
with 16 selectable categories (14 reference frames and two explicit evidence
gaps). Local Chromium checks passed category selection, image rendering,
all-category reflow at 390px, console diagnostics and an axe scan of the export
reference state. An initial capture assertion used the wrong numeric option and
was corrected to select by label; the axe harness then used an explicit browser
context as required. These were research-artifact checks, not app regressions.
T3 inline preview/render again returned `Authentication required`; the checked
local board remains available from the path recorded in UX_RESEARCH.md.


## Whole-app design implementation · 29 October 2026

Implemented the workflow-wide Mobbin research priorities recorded in
UX_RESEARCH.md: compact selection/templates and administration; focused patient
screens; actionable clinical/forensic review; expandable numeric/profile results;
purpose-based exports; direct recovery and passphrase visibility; per-form
history; focused threshold editing; and contextual guidance. DESIGN_SYSTEM.md and
the JS-free help.html describe the implemented controls. No published question,
clinical score, permission condition, default threshold or record schema was
changed in this design pass.

Final application code passed configuration validation, strict TypeScript checks,
**126 JavaScript tests**, compiled-output verification, Python score parity and
**4 HTTP/server tests**. The complete browser matrix executed **404 cases** in
Chromium, Firefox, WebKit, Pixel 7 Chromium emulation and iPhone 13 WebKit
emulation. It finished with **402 passed and 2 failed**, with zero skipped/flaky
cases and no automatic retries. Both failures were the same TAPS test on phone
profiles: after downloading JSON it tried opening a result behind the still-open
export panel. The corrected test explicitly uses Close exports before opening
the result. This changed only the test sequence. Its five-profile rerun passed
**5/5**, with zero unexpected, flaky or skipped cases. Every configured scenario
therefore has passing coverage on the final application, but this is **not a
single clean 404/404 run**. The retained full report still shows its two historical
failures; the focused rerun is recorded separately rather than overwriting it.

Full run: `/tmp/os-whole-app-detached-verify.log`, exit status 1 because of the two
test-sequence failures; `test-results/results.json` and
`playwright-report/index.html`. Focused correction:
`/tmp/os-taps-final-verify.log`, `/tmp/os-taps-final-results.json`, exit status 0;
artifacts under `artifacts/design-review/app-refinement/taps-verification/`.
The full matrix took 8.2 minutes; the focused correction took 8 seconds. Earlier
exploratory runs exposed the defects below; attached test commands were also
interrupted, including an exit-143 termination. The final full matrix used a
detached process and completed. No partial run is counted as a complete matrix.

Browser verification includes the eight new design scenarios in each profile,
expanded-result axe scans, 320px and 200% text, text spacing and short landscape,
keyboard focus/dismissal, touch advancement, retained safety flags, manual mode,
forensic requirement navigation, final-to-draft corrections, actual encrypted
recovery, JSON/HTML downloads, offline reports, clipboard and native Chromium
A4 PDFs with personality facets and compatible assessment history. The full
suite also checks browser diagnostics, failed assets and unintended outbound
requests. The concurrent-writer regression runs eight pairs per profile.

Defects corrected while implementing and reviewing the design:

- Firefox could allow both competing settings writers to report success. Web
  Locks now span MessageChannel task boundaries around the checked write;
  eight pairs per profile and a separate 48-pair Firefox exercise passed. This
  is evidence about cooperating local writers, not general storage transactions.
- Phone exports were squeezed by an older width selector. The panel now fills
  the available phone width with bounded scrolling and an explicit Close action.
  Desktop placement accounts for actual viewport space and can open above its
  trigger. Text-spacing/landscape checks verify bounds and focused controls.
- Recovery dialogs restore focus to a visible trigger and clear revealed as well
  as masked passphrases. Escape in a modal is handled by that modal.
- Editing the follow-up date after finalisation now preserves focus while
  returning to draft and retaining the previous final record.
- A sticky phone Back bar could obscure the last answer. Question navigation now
  follows answers in normal flow; enlarged-text checks cover last-answer focus.
- Result-expansion tests were adjusted to use stable disclosure locators rather
  than indexing a selector whose matches shrink as results open. PDF assertions
  distinguish the on-screen copy from the complete print copy.

Actual rendered home, setup, question, collapsed/expanded review, exports, focused
rule editor and recovered-history screenshots were inspected at desktop and
phone widths. Eleven current images are retained locally under
`artifacts/design-review/app-refinement/`; all data are synthetic. T3 collaborative
preview/open and inline preview/render returned `Authentication required`, so
repository Playwright supplied the browser and visual checks. The local app was
left running at http://127.0.0.1:8765 with output in
`/tmp/os-local-app-server.log`. `git diff --check` passed.

These are local software checks on the workstation described in E2E.md. They do
not establish clinical validity, human assistive-technology acceptance, physical
hardware coverage, protected-form permission, a live Praxi receiving transaction
or hosted CI. Those acceptance dependencies remain open. No remote repository,
publication or deployment was created.


## Navigation/components and clinical evidence · 29 October 2026

The final `npm run verify` completed successfully on the final application code:
**126 JavaScript tests**, configuration/type checks, compiled-output verification,
Python score parity, **4 HTTP tests**, and a single clean **434/434 browser matrix**.
Chromium and phone Chromium each passed 91; Firefox, desktop WebKit and phone
WebKit each passed 84. There were **zero unexpected, flaky or skipped cases** and
no automatic retries. The full matrix took 7.4 minutes. This supersedes the earlier
aggregate coverage limitation for the current application; historical records
above retain their actual run boundaries.

Command: `LD_LIBRARY_PATH=/home/peter/.cache/open-screen-webkit-deps/usr/lib/aarch64-linux-gnu npm run verify`.
Final log `/tmp/os-final-design-clinical-verified.log`, exit marker
`/tmp/os-final-design-clinical-verified.exit` = 0. The current complete report is
`playwright-report/index.html`; machine-readable results are
`test-results/results.json`. All fixtures and retained downloads are synthetic.

New coverage is four component scenarios and two clinical-use scenarios in each
profile. It covers current navigation at 320px/200% text, native and business
field errors/focus/correction, preserved hints and reset, revision requirements,
controlled asynchronous encryption with available cancellation, external PHQ
results without manufactured item responses or bypassed safety review, and
expanded source-linked guidance with JavaScript disabled and axe scans. Existing
full branching, safety retention, forensic context, missingness, settings,
concurrency, encrypted recovery/history, HTML/JSON, clipboard and real A4 PDF
checks continue to pass.

The component pass first passed a complete 424-case matrix. Clinical research
then corrected legacy clinician-facing interpretation/licensing wording and
added clinical guidance/tests. An exploratory clinical test incorrectly assumed
historical optional card IDs were publicly selectable; the actual catalogue was
checked, the coverage gap was documented and the test was changed to exercise
the real external PHQ entry. The corrected two-profile check passed 4/4.

The subsequent full run exposed a real dialog cleanup race: native Escape could
hide the dialog before its queued close handler cleared a revealed passphrase.
Cancellation now clears before closing, with close-event cleanup retained for
programmatic paths. The immediate-clearing test was not weakened; 15 affected
cross-browser checks passed. Resetting a rule and matching passphrases by editing
the first entry also clear obsolete errors; the expanded component checks passed
20/20. Exploratory matrices were stopped while these fixes were applied, and one
focused start encountered the previous server while it was shutting down. None
of those attempts is represented as a complete passing run. The final 434-case
run above started after all functional changes and completed without failures.

Mobbin component research inspected 28 preview frames from 27 products across
nine searches. COMPONENT_RESEARCH.md records the adopted patterns, limits and
canonical links. Actual before/after screenshots and seven full-resolution
reference frames are under ignored `artifacts/design-review/components/`.
`comparison.html` embeds the actual validation captures; `comparison.png` is its
checked double-scale render. The after captures show nav, recovery, field error
and phone export states. T3 preview/open and inline HTML preview/render returned
`Authentication required`; the repository Playwright workflow supplied visual
checks. The local app remains running at http://127.0.0.1:8765.

CLINICAL_EVIDENCE_REVIEW.md records primary clinical/forensic guidance, population
limits, verified permission statements, inaccessible source endpoints and future
admission criteria. No new questionnaire, score, threshold or clinical schema was
added. Exact published question text remains unchanged. The corrections clarify
that a C-SSRS endorsement note is not official triage and external totals do not
import self-harm responses. The legacy research sensitivity floor is not a
clinical guarantee. Engine/rules versions are unchanged by this interpretation/
copy pass. Independent clinical verification, human assistive-technology and
physical-device acceptance, applicable permissions, live Praxi receiving behaviour
and hosted CI remain open. Passing software tests do not supply those findings.
`git diff --check` passed; no remote repository/publication was created.


## Compact visual redesign · 29 October 2026

A visual-only refinement replaces oversized serif app headings with a compact
local sans scale, uses neutral text and quieter surfaces, groups setup controls,
and puts results beside checklist/priorities on desktop. Phone layouts stack in
document flow. Begin precedes secondary sitting tools. Logic, Help, dialogs and
answer controls use the shared tokens. Published items, scoring/defaults, safety
rules, schemas and engine/rules versions are unchanged.

The focused Chromium/mobile-WebKit component, design and usability run passed
32/32. Two added cases check the desktop setup launch placement and the review's
column-to-stack transition with a functioning task link. The first full run
found a real safety-action regression: the resource link and clinician button
could share a row. That exploratory run was stopped; it is not a passing matrix.
Vertical separation was restored without weakening the existing geometry test.
All five dedicated safety checks then passed, including 320px/200% text.

Actual renders were inspected for desktop/phone home, setup, questions, review,
expanded scores, export, Help, rule editing and the safety pause. A generated A4
clinical PDF was rendered and inspected. Screens and a 2200px-wide measured
before/after board are under `artifacts/design-review/visual-refinement/`;
`comparison.html` embeds both source images. The revised design rules and Mobbin
reference decisions are in DESIGN_SYSTEM.md and COMPONENT_RESEARCH.md. T3
preview/open and HTML preview/render returned `Authentication required`; local
Playwright supplied the checks. No new font, framework or remote asset was added.

Final `npm run verify` passed: **444/444 browser cases**, with zero failures,
flaky results or skips. Chromium and mobile Chromium each passed 93; Firefox,
WebKit and mobile WebKit each passed 86. Policy validation, TypeScript, 126
JavaScript tests, compiled-output checks, Python scoring parity and four HTTP
tests passed. The final run began after all runtime changes. Log:
`/tmp/os-visual-refinement-final.log` (exit marker 0); browser evidence:
`test-results/results.json` and `playwright-report/index.html`. `git diff --check`
passed. The local app remains at http://127.0.0.1:8765; no repository was
published, no remote was created and no live Praxi integration was modified.

Human AT/physical-device acceptance and independent clinical/permission checks
remain separate. This design pass does not certify those outcomes or complete
the externally blocked practice-readiness goal.


## Patient question header · 30 October 2026

The patient question header now contains a small home-linked logo and a single
questionnaire/item-count line. The global question position and stage remain
available to assistive technology. The separate stage bar is removed. Save
progress and current encrypted-save status follow the answers; manual/text
Continue, keyboard advancement, published content and safety pauses retain their
existing behaviour. A five-profile browser case checks header height, placement
of save controls/status, overflow, axe and recovery-dialog focus return.

The cancelled local server was restarted on 8765 and checked over HTTP. Native
T3 browser tools are available after the restart. The actual PCL-5 item 13 from
the user's screenshot was reached through synthetic UI responses and inspected
at phone and desktop sizes. Phone screenshot:
`/home/peter/.t3/userdata/browser-artifacts/browser-screenshot-127-0-0-1-mvtxfpgu-b737e63f.png`.
The documented Playwright matrix runs separately on 8791.

Final `npm run verify` passed **449/449 browser cases** with no failures, skips
or flaky results: Chromium/mobile Chromium 94 each; Firefox/WebKit/mobile WebKit
87 each. All configuration, TypeScript, 126 JavaScript tests, compiled-output,
Python parity and four HTTP tests passed. Log: `/tmp/os-minimal-question-verify.log`
and exit marker 0; machine-readable evidence: `test-results/results.json`.
`git diff --check` passed. Clinical scoring, default rules and safety behaviour
were not changed. Physical-device and human AT acceptance remain separate.


## Setup responsive layout · 30 October 2026

The setup form now reflows by its actual container width, not just a 560px phone
breakpoint. Shared desktop column widths align Setting, practice templates and
measure search. Narrow/medium and enlarged-text layouts stack these fields in
reading order, with full-width inputs. Expanded templates use a full-width area.
Measure item counts move beneath instrument names when the form is narrow.

Ten focused cases passed across the five browser profiles. The new scenario
checks stacked/aligned geometry and horizontal overflow at 320, 390, 600, 700,
768, 820, 1024 and 1440px, each at 100% and 200% root text. It also checks an
expanded template area and axe. Existing default desktop launch placement still
passes. Actual 700px setup was inspected with the native T3 browser.

Final `npm run verify` passed **454/454 browser cases**, with no failures,
skips or flaky results. Chromium/mobile Chromium passed 95 each; Firefox, WebKit
and mobile WebKit passed 88 each. All configuration, TypeScript, 126 JavaScript
tests, compiled-output, Python scoring parity and four HTTP checks passed.
Log: `/tmp/os-setup-responsive-verify.log`, exit marker 0; browser evidence:
`test-results/results.json`. `git diff --check` passed. Actual medium-width setup
capture: `/home/peter/.t3/userdata/browser-artifacts/browser-screenshot-127-0-0-1-mvtxqcwm-b9e415c6.png`.
Clinical content, scoring and permissions are unchanged. Human AT and physical
device acceptance remain separate.


## Form components, terminology and focused views · 30 October 2026

Setup now uses a 720px single form column at all widths, consistent reference and
search inputs, a compact segmented setting selector with explicit selected fill,
and checked/tinted measure rows. Forty focused Chromium/mobile-WebKit checks
passed, then all 100 design/component/usability cases passed across five browser
profiles. These are focused runs, not a claim that the final full matrix passed.

User-facing sitting/sittings became assessment/assessments in app, dialogs,
setup, logic and static help. Internal classes, identifiers and encrypted format
were retained. The later user request moved administration, referral/external
context and workflow guidance into separate client-side setup views. Measures
retains all selected permissions and the guarded Start action. Icon utility
controls keep accessible names. Back to measures retains entered data.

The initial destination-focused run passed 21 cases and caught a test helper
race: it checked for setup before asynchronous startup had rendered. The helper
now waits for an actual application screen before choosing a setup destination.
The unchanged workflow assertions then passed 4/4 guide cases. Exploratory full
runs were stopped as subsequent user requests changed the implementation; none
is represented as a completed pass. The final matrix starts after all functional
changes. A new five-profile scenario checks isolated views, retained reference/
setting/context and manual advancement after returning to Measures.

The T3 browser snapshot repeatedly timed out; the documented repository browser
capture workflow supplied desktop and phone renders for each view under ignored
`artifacts/design-review/setup-destinations/`. Measures and phone Options were
visually inspected; final captures will include the Back action and revised hint.

Final `npm run verify` passed **459/459 browser cases**, with no failures,
flaky results or skips. Chromium/mobile Chromium passed 96 each; Firefox, WebKit
and mobile WebKit passed 89 each. Configuration, TypeScript, 126 JavaScript
tests, compiled outputs, Python scoring parity and four HTTP tests passed.
The final matrix followed all functional changes. Late article/history-note
wording corrections also passed a separate `npm run check`; no scoring or file
format changed. Log: `/tmp/os-assessment-views-final.log`, exit marker 0; browser
evidence: `test-results/results.json` and `playwright-report/index.html`.
All four final desktop/phone views were captured; Measures, Options, Context
and Guide renders were inspected. `git diff --check` passed. Human AT/physical
device and independent clinical acceptance remain open.


## Guided assessment and visual review · 30 October 2026

Implemented validated practice-preset shortcuts and Custom mode, grouped
additional measures with filtering/no-match feedback, quieter repeated answer
instructions with retained accessible descriptions, per-instrument raw-score
preview plots, and explicit question/review/encrypted-file workflow states.
Review tasks precede graphs on phones and sit beside them on desktop. Safety
alerts remain before the overview. The optional referral form no longer opens
automatically in review; it stays open on the dedicated setup Context view.
Final records expose Save assessment and Start new assessment without changing
existing encrypted-file semantics or confirmation. Scoring, default thresholds,
published items, schema and engine/rules versions are unchanged.

Research inspected 15 preview frames from 11 products across six Mobbin queries;
COMPONENT_RESEARCH.md records the sources, rejected matches, iOS distinctions
and transfer limits. Graphics are native SVG score plots, line icons and the
workflow diagram, not stock clinical imagery or an aggregate health/risk score.
No remote assets, fonts or runtime dependencies were added. The before/after
review board embeds actual captures with measured bounds; T3 HTML preview
reported no console messages. Desktop/phone setup, overview and finalised states
were captured and visually inspected.

An initial 22-case Chromium check passed. A subsequent 52-case exploratory run
completed 50 cases but two WebKit artifact-close operations failed when another
runner was started too soon and cleaned their trace directory. That overlapping
attempt also refused the occupied port. Neither is represented as a clean pass.
The new six-case focused run then passed in Chromium/mobile WebKit. The full
matrix below runs alone, with any follow-up using a separate output directory.

The three new cases cover fresh permissions after applying a preset while
retaining reference; search-group/no-match state and accessible quiet answering
instructions; and distinct raw-score ranges, final save and edit invalidation.
A later preset-edge refinement includes the active preset among quick choices
even when it was selected from outside the first three. A dedicated five-profile
follow-up verifies that branch after the full matrix completes. Finalisation
also now focuses the labelled final-record section instead of leaving focus on
a removed form. That focus behaviour is included in the follow-up.

Full `npm run verify` passed **474/474 browser cases**: Chromium and mobile
Chromium 99 each; Firefox, WebKit and mobile WebKit 92 each. Zero failures,
flaky results or skips. The final active-preset/finalisation-focus refinements
then passed all **15 targeted cases** across the same five profiles. These are
follow-up executions of existing scenarios, not 15 additional distinct cases.
`npm run check` was rerun after the refinements and passed configuration,
TypeScript, 126 JavaScript tests, compiled-output checks, Python scoring parity
and four HTTP tests. No assertion was weakened to obtain these results.

Full evidence: `/tmp/os-guided-assessment-verified.log` (exit marker 0),
`test-results/results.json` and `playwright-report/index.html`. Follow-up:
`/tmp/os-guided-final-followup.log`, with separate `--output` and line reporter
to preserve full-matrix evidence. Check log: `/tmp/os-guided-post-check.log`.
`git diff --check` passed. The self-contained HTML comparison was published
through T3 HTML render after preview; the downloadable PNG is 2200px wide.
Final captures were refreshed after focus handling changed. No remote repository
or live Praxi integration was modified.

Artifacts: `artifacts/design-review/guided-assessment/` (ignored), including exact
pre-edit source, screenshots, research metadata, measured bounds, comparison.html
and comparison.png. Human AT, physical devices, real psychologist task observation
and independent clinical acceptance remain separate from software verification.


## Adversarial correction release and minimal setup · 30 October 2026

Final **npm run verify exited 0**: **139 JavaScript tests**, configuration/source
hash checks, strict TypeScript, compiled-output checks, Python scoring parity,
**four real HTTP tests**, an offline installed-package runtime/type smoke test,
and **509/509 browser cases**. The browser matrix completed in **10.6 minutes**,
with zero failures, retries, flaky results or skips. Chromium and mobile Chromium
passed 106 each; Firefox, WebKit and mobile WebKit passed 99 each.

The final command used the documented Arch ARM WebKit compatibility libraries:

```sh
LD_LIBRARY_PATH=/home/peter/.cache/open-screen-webkit-deps/usr/lib/aarch64-linux-gnu npm run verify
```

Evidence: `/tmp/open-screen-implementation-final.log` (process exit 0),
`test-results/results.json`, and `playwright-report/index.html`. The JSON reporter
records expected=509, unexpected=0, flaky=0 and skipped=0. `git diff --check` also
passed after the final documentation updates. No runtime changes followed this run.

Thirteen additional core cases directly exercise current-findings safety review,
retained response/review provenance and export redaction, every-item instructions,
selected incomplete-module reporting, external integer bounds, verified final
conversion and unsigned overrides, offset/tied chronology, PCL event anchors,
foreign-registry reset, shared byte capacity and complete encrypted archive
round-trips, exposure-stop reporting and release metadata agreement. Seven new
browser scenarios run across all five projects: safety changes before/after
finalisation; invalid external values before/after finalisation; recovery with
corrupt deployment preferences; extended-registry recovery then New assessment;
archive download/cancellation/focus and separate history removal; preparation and
later-item recovery; and compact phone content/menu keyboard/outside dismissal.
Existing scoring, staged routing, missingness, final correction, actual clipboard,
offline HTML, A4 PDF, security, accessibility/reflow and diagnostics cases remain.

The nine source assets match the archived SHA-256 manifest. The package smoke test
packs the actual archive, installs it offline into a temporary consumer, exercises
every public runtime import and a verified final report, and type-checks the
minimal host payload's optional text contract. Both repository skill files passed
the skill creator's structural validator; this is not a model-behaviour evaluation.

The first full implementation run passed 505 cases and failed four phone cases
in two tests. One tried to follow a page link while its workspace menu covered
it; the other tried to toggle the export summary underneath the open phone export
panel. They now dismiss those menus with Escape and the visible Close exports
button, respectively. Validation/assertions remain intact. Both scenarios then
passed **10/10 focused runs**, followed by the clean full matrix above. Earlier
iteration also found a real enlarged-text header overflow, corrected by wrapping
when the wordmark and Menu cannot fit. No retries hid these failures. Initial
full-run failure evidence is retained in ignored
`artifacts/review-2026-10-30/implementation-first-full/`.

Native collaborative-browser inspection covered the compact phone setup and
expanded desktop menu. The default 390px layout places its heading near 84px and
first measure near 330px; enlarged text and contextual warnings change that
height. The original user screenshot and actual applied capture are compared in
`artifacts/design-review/minimal-assessment/board.html` (self-contained), with
`before.png` and `after.png`. A compact before/after view was previewed and
published through T3 HTML rendering. No mockup is presented as a running screen.

The correction mapping and original-version recovery instructions are in
[REVIEW_IMPLEMENTATION_2026-10-30.md](REVIEW_IMPLEMENTATION_2026-10-30.md).
Independent clinical acceptance, human assistive-technology and physical-device
checks, rights grants, hosted CI execution and a live receiving-system test remain
open. Mobile projects are emulation; automated checks do not establish clinical
validity, WCAG conformance or authenticated attestation. No remote deployment,
publication or real clinical write was performed.


## Copy-first product simplification · 30 October 2026

The user confirmed the everyday job as choosing measures, completing them and
copying results into existing clinical notes. The default results view now leads
with Copy summary and compact score rows. Repeated process/status cards and
preview charts were removed. Optional notes, formal attestation, empty history,
additional follow-ups and source notes share one disclosure. Existing history
remains visible with results; safety findings and interrupted administrations
open review controls automatically. Source/scoring rules and finalisation
requirements are unchanged.

Full npm run verify exited 0: **144 JavaScript tests**, source/configuration/type
checks, compiled-output checks, Python scoring parity, four HTTP tests, installed
SDK smoke tests and **524/524 browser cases** in **9.2 minutes**. Chromium and
mobile Chromium passed 109 each; Firefox, WebKit and mobile WebKit passed 102
each. Reporter totals: expected=524, unexpected=0, flaky=0, skipped=0; retries=0.
Evidence: `/tmp/open-screen-minimalism-verified.log`, `test-results/results.json`
and `playwright-report/index.html`.

After that matrix, the concise note header stopped including a generated date:
generation day is not necessarily administration day. The final source then passed
npm run check again (144 tests and all other checks), plus all **15 copy/safety/
history scenarios across five profiles**, with a line reporter and separate output
so the complete matrix evidence remains intact. Logs:
`/tmp/open-screen-minimalism-post-check.log` and
`/tmp/open-screen-minimalism-post-notes.log`. Follow-up artifacts were moved under
`artifacts/design-review/results-minimalism/post-notes-tests/`. No UI, scoring or
workflow change followed the complete matrix; the follow-up changed only that
concise-note header. `git diff --check` passed after documentation updates.

Five new core cases check concise notes for independent brief/full scores,
functional impact, unadministered/incomplete modules, custom settings, safety
amendments and plans, contextual forensic limits, and verified final versus
unsigned overrides. Three new browser scenarios cover copying with no optional
form entry, visible safety review and blocked finalisation, and an event reference
inside optional PCL history. Existing clipboard denial/edit-race, report/PDF,
final-correction, archive and recovery tests continue to run. The archived-history
removal case now also verifies focus when an empty history moves under optional
documentation.

Initial Chromium iteration passed 103 cases and found an overly strict position
expectation and old incomplete-label assertions; spacing/copy and partial-review
visibility were corrected. New tests initially matched the hidden print heading
as well as the visible Results heading, and assumed a boolean open attribute had
an empty-string value; selectors and boolean-property assertions were corrected.
An intermediate full run was stopped before completion for final visual cleanup
of duplicated unadministered labels and empty-history controls. It is not counted
as a successful matrix. All final assertions above exercised the actual controls;
no forced clicks or retries bypassed overlays or hidden fields.

Native preview capture returned `Preview automation evaluate timed out after
15000ms.` and `Preview automation snapshot timed out after 15000ms.`. The repository's
Playwright workflow therefore captured the same synthetic five-answer sitting
before and after at 390×844 CSS pixels, twice pixel density. The baseline uses
frozen pre-edit UI source; the after capture uses the applied implementation.
The self-contained before/after board is
`artifacts/design-review/results-minimalism/board.html`; its actual browser-rendered
PNG is 2200px wide. Measured rectangles, frozen source and raw panes remain beside
it. The compact comparison was checked with T3 HTML preview before publishing.
This is software/layout evidence, not observed psychologist adoption or clinical
validity. The product judgments and deferred scope are recorded in
REVIEW_IMPLEMENTATION_2026-10-30.md. Human clinical/AT/device acceptance, permissions
and real receiving-system checks remain open.

### Test-quality audit — 2026-10-30

Reviewed the test inventory and runner/CI configuration, browser helpers and error
allowance, and sampled scoring, clinical boundaries, host writes, attestation,
encrypted recovery, exports and the minimal results workflow. This was a targeted
quality audit, not a claim that every assertion has been independently validated.

Changes:

- External-total regression expectations now use an explicit independent table of
  instrument limits rather than reading their expected maxima from production code.
- Malformed-envelope tests now mutate one field of an otherwise valid encrypted
  file. They assert that rejected headers, encodings and lengths never reach key
  derivation. Separate valid-base64 salt/IV mutations exercise authentication.
- The attestation test now changes both the review date and matching updated date,
  keeping structural validation satisfied so rejection exercises digest integrity.
- Removed the machine-dependent 250 ms scoring assertion from the correctness
  suite; ordinary functional verification does not establish a performance budget.
- Collapsed-panel browser assertions now inspect the actual Boolean `open`
  property. Testing only that `open` differs from an empty string can wrongly pass
  for an open disclosure rendered with `open="true"`.

Two isolated mutation probes ran the actual regression tests against temporary
copies, leaving the working source unchanged: PHQ-9 maximum widened from 27 to 28;
KDF iteration guard removed. Both were caught (one failing test each).

`npm run check` passed: 146 JavaScript tests, compiled-output verification, Python
scoring and four HTTP-server tests, configuration/source checks, TypeScript, and
offline installed-package runtime/type checks. No application code or shared
browser helper was changed by this audit. Browser verification is recorded below.

Limits: the browser clipboard stub checks the application's copy payload, not OS
clipboard permissions. Device profiles do not establish physical-device behavior;
axe does not establish human accessibility acceptance. The single intentional
startup-console allowance is scoped to the invalid-configuration test; the shared
fixture still checks uncaught errors, failed requests and unexpected outbound
requests. Browser helpers often expand optional documentation deliberately; the
minimal-results suite separately checks the untouched collapsed view. Local tests
cannot establish hosted CI execution, clinical validity or professional adoption.

Focused browser rerun: `minimal-results.spec.mjs` passed 15/15 cases across desktop
Chromium, Firefox, WebKit, mobile Chromium and mobile WebKit (22.6 seconds; zero
retries). Logs: `/tmp/open-screen-test-quality-check.log` and
`/tmp/open-screen-test-quality-browser.log`. The earlier full 524-case browser run
was not repeated for these test-only changes.

### Minimum-click workflow and initial readout — 2026-10-30

Replaced stacked question-action disclosures with direct missing-answer, pause and
partial-review actions, plus source-help dialogs. Removed the Home one-link tools
disclosure, compacted optional multi-field form controls, and moved full-form
extension actions beside results rather than behind optional documentation.

Added a brief-to-full choice screen with initial findings, names/purposes,
remaining question counts, conditional TAPS count ranges and rough timings.
Suggested extensions are preselected; clinicians can choose subsets, available
below-threshold extensions or brief results only. Administration choices survive
attestation/recovery and do not become negative full results. Existing safety
findings remain flagged. Monitoring retains planned full forms.

Full `npm run verify` passed 154 JavaScript tests and 549 browser cases across all
five configured profiles (9.4 minutes, no retries). It also passed configuration,
source hashes, types, compiled-output checks, Python scoring, four HTTP-server
tests and the installed-package smoke test.

After that full run, final readout refinements reused the initial readout for
negative sittings, showed actual TAPS brief-domain responses, used the full range
for complete short measures without a separate gate range, and prevented an
empty chooser while reviewing already-completed answers. The affected four
browser suites then passed **135/135 cases across all five profiles**, including
three new edge-case regressions (3.3 minutes, no retries). The full 549-case run
preceded these final UI refinements; it was not represented as a fresh full run.
`npm run check` was repeated on the final source. `git diff --check` passed.

Evidence logs: `/tmp/open-screen-minimum-clicks-verify.log`,
`/tmp/open-screen-minimum-clicks-followup.log`, and
`/tmp/open-screen-minimum-clicks-final-check.log`. Focused browser artifacts are
under ignored `artifacts/minimum-clicks-final-followup/`; the full report remains
in `playwright-report/` and `test-results/results.json`.

T3 preview snapshots timed out twice with `Preview automation snapshot timed out
after 15000ms.` Browser verification followed the repository's Playwright workflow.
Synthetic data only. No clinical/human-accessibility acceptance was inferred from
these results. Timing estimates are approximate interface aids.

### Consistent button styling — 2026-10-30

Added a shared button foundation so unclassed controls receive flat styling rather
than browser-native beveled borders. Command buttons, action links, response
buttons and optional-form disclosure controls share a 10px button-radius token and existing
44px minimum target. Primary/secondary/quiet roles retain their color hierarchy;
hover, disabled and focus behavior remain explicit. Help icons and radio markers
remain circular, and measure-selection list rows retain flush edges within their
rounded container. Questionnaire options retain left alignment and normal text
weight rather than inheriting centered command-button layout.

Scoped measure-row styles to their actual selection buttons (`data-focus-key`),
so the adjacent help icon retains its own compact dimensions. No question wording,
response codes, scoring, navigation actions or required clicks were changed.
Focused Chromium layout/accessibility flows passed 22/22 cases before the full
verification below. Synthetic data only; visual inspection used the generated
question screenshot as well as layout, focus, enlarged-text and accessibility
checks. Human accessibility acceptance remains separate.

`npm run verify` passed on the final CSS: 154 JavaScript tests, configuration and
source checks, TypeScript, compiled-output verification, Python scoring, four HTTP
server tests, the installed-package smoke test, and **564/564 browser cases** across
all five profiles (9.6 minutes, no retries). `git diff --check` passed. Log:
`/tmp/open-screen-buttons-final-verify.log`; full browser evidence is in ignored
`test-results/` and `playwright-report/`.

## Guided design B · 30 October 2026

Implemented the selected Setting → Measures → Ready layout, stacked patient
answers, source actions and a concise note preview derived from the clipboard
summary function. No instrument wording, anchors, gates or calculations changed.

- `npm run check` passed against the final source: 154 JavaScript tests plus
  configuration, captured-source hashes, types, compiled/Python/HTTP checks and
  the offline installed-package smoke test.
- The full `npm run verify` browser matrix ran 569 cases with no automatic retries
  across Chromium, Firefox, WebKit, Pixel 7 Chromium and iPhone 13 WebKit. 568
  passed; the enlarged-text iPhone case completed its UI assertions but its
  full-page diagnostic screenshot exceeded WebKit's 32767 device-pixel limit.
- That diagnostic capture now uses CSS pixels, preserving the full page and all
  assertions. `npm run verify -- -- --last-failed` reran the core checks and that
  case successfully (1 passed). The 569 distinct cases are therefore covered by
  the full run and the explicit corrected-case rerun, not a claimed all-green
  single full run. The earlier exploratory/aborted runs are not passing evidence.
- Added a Ready-step round trip checking retained selection, reference and fresh
  permissions, and checked that the displayed note equals the clipboard text.
  Existing safety/finalisation, correction, encrypted recovery, history,
  cross-format export, offline HTML, actual clipboard and PDF cases ran as part
  of the matrix. `git diff --check` passed.

WebKit used the documented workstation dependency library path in E2E.md. All
fixtures and visual captures were synthetic; no clinical exports were added.
The selected layout and these automated checks do not close the outstanding
clinical, human accessibility, rights or receiving-system acceptance dependencies.

## Persistent actions and visual selection · 30 October 2026

Added one persistent action dock per assessment screen, a responsive measure-card
grid with native line icons and compact source buttons, matching Ready cards and
an expandable note preview. Existing controls are moved rather than cloned;
question and review actions retain their logical position before secondary tools
in keyboard order. The dock reserves its measured height, handles wrapping and
safe-area padding, and keeps focused content clear after viewport changes.

- Core checks passed against the final source: 154 JavaScript tests plus config,
  source hashes, types, compiled/Python/HTTP checks and installed-package smoke.
- Fifteen new cases passed across all five profiles. They exercise navigation at
  both scroll extremes, retained reference/permissions, manual advancement,
  focused answers at 200% text and short landscape sizes, export positioning,
  cancellation and focus return. The displayed-note/clipboard equality check now
  opens and closes the note preview explicitly.
- The full `npm run verify` matrix ran 584 cases: 578 passed and six failed.
  These exposed an obsolete in-flow safety-action geometry expectation, export
  dismissal/tab-order issues at the document end, and WebKit device-pixel
  rounding around the focused-control clearance. Updated checks retain the
  existing safety separation requirement; the dock now leaves extra clearance.
- Explicit corrective runs (without automatic retries) resolved the safety
  cases and export dismissal. The final
  `npm run verify -- -- --grep 'export disclosure dismisses|manual question actions remain|question actions are direct'`
  passed the core checks and all 15 selected cases across the five profiles.
  This completes coverage of the 584 distinct cases through the full matrix and
  targeted corrective runs; it is not a claimed all-green single full run.
  `git diff --check` passed.

WebKit used the documented dependency library path. All fixtures and previews
were synthetic; no clinical exports were added. Published items, scoring,
recovery formats and attestation rules were unchanged. Human accessibility,
physical-device/soft-keyboard checks, clinical and receiving-system acceptance
remain open.

## Assessment layout refactor · 30 October 2026

Replaced the accumulated assessment layout overrides with a consolidated shell,
labelled setting cards, consistent setup/result panels and a narrower question
reading panel. Setting advances directly and has no redundant disabled Continue
button. Other pages retain measured persistent actions. The source questionnaire,
scoring, recovery formats and review requirements were not changed.

- `npm run verify` passed: 154 JavaScript tests, configuration/source hashes,
  types, compiled/Python/HTTP checks, offline installed-package smoke and all
  589 browser cases across the five configured profiles (13.3 minutes).
- After the final dock styling adjustment, all 20 persistent-action cases passed
  across those profiles. Coverage includes whole Clinical/Forensic labels at
  1968–320px and 100%/200% text, no redundant Setting dock, retained choices,
  one-row Ready navigation at 390px, manual advancement, focused-answer clearance
  and review/export focus return.
- After consolidating remaining duplicate selectors, 63 additional design,
  persistent-action and minimal-result cases passed in Chromium, Firefox and
  WebKit. A live comparison of the Ready page's 90 visible elements found no
  computed-style or geometry changes from that selector consolidation.
- Inspected actual setup, Ready, question and synthetic result screens at desktop
  and phone widths in the collaborative browser. The self-contained screen
  viewer was checked with `html_preview` and shown with `html_render`.
  `git diff --check` passed.

Only synthetic fixtures were used. Human accessibility, physical-device and
soft-keyboard acceptance, clinical acceptance and receiving-system verification
remain open. Automated checks do not certify those outcomes.

## Complete PDF report · 30 October 2026

Added Export PDF beside Copy summary. It opens the browser print dialog with the
complete current report, including the response appendix regardless of the
HTML/JSON appendix preference. Browser print shortcuts use the same refreshed
report. Printing and cancellation do not acknowledge encrypted saving or finalise
a draft. Help documents choosing Save as PDF and all pages.

Export checks exposed missing-answer reasons absent from the full-text appendix.
The shared API text now retains active and inactive missing reasons with their
original codes and explicitly distinguishes inactive responses from current
scoring. Final review also found that changed safety findings needed an explicit
review-freshness notice in exports. That notice now uses the shared review issues
in summary, HTML/PDF and full text, and disappears after a current acknowledgement.
Calculations, source forms and attestation requirements were unchanged.

- The focused PDF/native-browser run passed all 24 cases across the configured
  profiles after the missing-response correction. Actual Chromium A4 output
  retained all four full clinical instruments, a long note's ending, sources,
  response codes, expanded personality facets and recovered final history.
  Inspecting a 12-page synthetic PDF found content on every page.
- `npm run verify` passed the 154 JavaScript tests, configuration/source hashes,
  types, compiled/Python/HTTP checks, offline package smoke and all 599 browser
  cases (11.6 minutes).
- After the final review-freshness addition, `npm run check` passed again and all
  54 focused PDF, native PDF and adverse review-regression cases passed across
  all five profiles (2.4 minutes). An actual PDF of a recovered final followed by
  a correction and new safety finding showed Draft and the current-review notice.
  Unit checks compare the notice across summary, HTML, JSON/full text, verify its
  removal after acknowledgement and retain prior review provenance.
- `git diff --check` passed. Synthetic examples and logs are outside the repository;
  no clinical exports were committed. No new runtime dependencies or network
  services were introduced.

The cross-browser action tests observe print invocation with a test double;
Chromium separately renders real PDF files for text assertions. OS print-dialog
destination selection, physical printers/devices, human accessibility, clinical
acceptance and receiving-system verification remain open acceptance tasks.


## Optional risk documentation · 30 October 2026

This change supersedes the mandatory safety-pause, acknowledgement, risk-review
and documentation-gate behavior described in earlier entries. Screening proceeds
to results without an interruption. Risk notes are optional and collapsed, empty
risk sections are omitted from exports, and completion/finalisation does not
require risk fields, forensic context, follow-up ownership/dates or a missing-
answer acknowledgement. Questionnaire wording, source assets and scoring were
not changed. Existing notes, observations, encrypted recovery and signed-history
integrity are preserved.

- Focused Chromium workflow, native-PDF, minimal-result and adverse recovery
  checks passed all 29 cases after correcting a setup null-context regression and
  adapting old tests to the now-collapsed optional documentation.
- The full `npm run verify` completed its configuration, source hashes, types,
  155 JavaScript tests, compiled/Python/HTTP and offline installed-package checks.
  Of 609 browser executions, 605 passed. Four Logic-page checks used assertions
  loaded before its safety-pause copy was changed during that run. The actual
  pages contained the new optional-risk copy. A separate run of the current
  Logic suite passed all 15 cases across all five profiles, including those four
  cases, accessibility and enlarged-text reflow. No automatic retries were used.
- New cases cover a synthetic legacy safety-pause recovery without a forced
  acknowledgement, optional free-text risk notes across exports/encrypted recovery,
  finalisation without risk documentation, and omission of empty risk sections.
  Actual native A4 PDF, response appendix, current notes, draft/final integrity,
  corrected observations and historical record checks ran in the full suite.
- After the final Logic-page copy change, `npm run check` passed again, including
  all 155 JavaScript tests and the offline installed-package smoke check.
  `git diff --check` passed.
- A self-contained snapshot of the actual synthetic Results and optional notes
  screens was checked with `html_preview`; it is a view of implemented UI.

All fixtures and artifacts are synthetic. Human accessibility, clinical and
receiving-system acceptance remain separate from automated regression coverage.


## Public release review · 6 November 2026

Reviewed the working tree for public source distribution, walked the actual local
UI through a synthetic below-gate clinical sitting and clinician summary, and
prepared an allowlisted public evaluation variant. The README now has portable
clone/run instructions, a first-assessment walkthrough and explicit privacy and
acceptance limits. THIRD_PARTY_NOTICES.md separates software rights from each
instrument's permissions. The owner selected MIT for original code and documentation during this review;
questionnaire rights remain separate and npm publication remains disabled.

Primary licensing pages were rechecked for PHQ/GAD, IPIP, ASRS, AUDIT, DASS,
TAPS and PCL-5. UNSW's public-facing DASS administration restriction requires a
separate demo: its catalogue entry, questions, anchors and instructions are
excluded, selected/recovered DASS setups are rejected, and the direct engine
path cannot administer or score it. The local form remains unchanged. Source
hashes and existing arithmetic/source cases pass; these checks do not supply
independent psychologist acceptance or rights-holder grants.

`npm run check` passed: 155 JavaScript tests, source/configuration checks, types,
compiled parity, Python scoring, four HTTP tests and the offline installed-package
smoke test. `npm audit` reported zero known vulnerabilities, including development
dependencies, on this date. Credential-pattern scans found no matches in tracked
source or the 856 pre-release history objects inspected; this is a scoped scan,
not proof of absence of every possible secret. No clinical exports are staged.

The 609-case local browser matrix completed with 607 passes and two WebKit trace
cleanup errors (`ENOENT`) after the first demo run reused the default artifact
folder. The demo now has its own `.demo-test-results` output. These were tooling
errors after application assertions, not app failures; the two cases were rerun
separately and both passed (2/2). The demo's first smoke pass used a button role for a native summary
control; correcting its selector resolved that test error. The corrected public
artifact passed all five browser profiles (5/5). Hosted verification and Pages
deployment status are recorded in the public repository's Actions history.

Clinical acceptance, human assistive-technology/physical-device acceptance and
receiving-system verification remain open. The public demo permits synthetic
evaluation only; do not enter patient information or clinical recovery files.
GitHub Pages does not inherit the local server's HTTP security headers and logs
visitor IP addresses. See PUBLIC_HOSTING.md for the deployment boundary.

A synthetic encrypted DASS sitting validated with the original local engine and
was rejected by the generated public engine. The actual demo Resume dialog
rejected the encrypted file; cancelling retained the existing
`SYNTHETIC-ACTIVE-DEMO` reference and selected measures. No real patient data was
used. This checks failed-recovery atomicity, not durable storage or clinical
acceptance.

The first hosted Ubuntu run at commit `30592e8` completed 604/609 browser cases.
Three failures exposed Ready actions wrapping onto separate rows with Ubuntu
Firefox/WebKit font metrics; the dock now uses responsive grid tracks while
retaining full labels and stacking at narrow/enlarged sizes. Two WebKit startup
failures showed module requests delayed in roughly 1-second retransmission steps.
Python 3.12's default listen backlog was five, unlike the newer local Python.
The loopback server now uses a bounded queue of 128 consistently; Host/path/CSP
protections and the bind address remain unchanged. No assertion timeouts or
clinical thresholds were relaxed. The affected 40 browser cases passed locally
across all five profiles after the first corrections; final full verification
was rerun for the resulting source.
