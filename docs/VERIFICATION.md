# Verification record

Updated 26 October 2026; original UI checks ran on 25 October. All questionnaire responses used below were synthetic.

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
The repository now contains five additional project runs for that regression;
the full 287-run matrix was not rerun after this small, targeted correction.

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
