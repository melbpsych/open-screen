# Completion goal and project audit

25 October 2026.

## Goal

Deliver a coherent local clinical and forensic screening workspace for an adult psychology practice: brief published screens first; targeted, intact follow-up questionnaires at their recognised thresholds; clinician review, overrides, safety handling, and a copyable/printable record. Refactor the library, questions, results, setup, and handoff into a polished accessible interface. Preserve the original personality measure and research history.

The user clarified the clinical two-stage requirement after the initial goal was recorded. That clarification authorises adding the PHQ/GAD clinical instruments and supersedes the initial goal's restriction to the old instrument scope. Threshold and permission decisions are recorded in [the clinical scope](docs/CLINICAL_SCOPE.md).

## What was already done

- The sibling `../conscientiousness-ceiling/` contains the original protocol, million-response IPIP-50 analysis, results JSON, seven figures, the conscientiousness/keying follow-up, aligned factor markers, and a five-item selection. The stored sample contains 1,015,341 records and 874,434 complete 50-item cases. Selection searched 51,840 eligible combinations. These are research outputs, not a clinical validation of the five-item screen.
- `open-screen/` already contained a static browser app, a general scoring engine, the selected five personality items, compiled output, Python and Swift readers, gate research, an interview engine, IPIP response-pattern scoring, and 25 passing JavaScript tests plus a passing Python parity check.
- Trauma already branched from PC-PTSD-5 to PCL-5. Depression/anxiety were only external-form references. Alcohol asked ten AUDIT items upfront. Setup gave little guidance; shared DOM, headers, and clipboard logic were duplicated. External clinical follow-up fields existed in code but were not rendered or included fully in the exported record.
- Neither folder was a Git checkout, so there was no commit history to inspect. The app's original frontend files were backed up to `/tmp/open-screen-before-frontend-20261025.tar.gz` before edits. That temporary archive is a session rollback aid, not durable version control.
- The T3 project was initially attached to the research folder. At the user's request, it was renamed **Open Screen** and its workspace changed to `/home/peter/Work/open-screen` using T3's project service.

## Acceptance criteria

- [x] Audit existing research, application, tests, and missing product behavior.
- [x] Record the goal and dated clinical scope without rewriting earlier protocols.
- [x] Refactor shared UI primitives; create a coherent library, personality screen/results, clinical setup/questions, handoff, and clinician record.
- [x] Add PHQ-2 → PHQ-9 and GAD-2 → GAD-7 using the official Australian-English forms.
- [x] Make alcohol AUDIT-C → AUDIT; retain PC-PTSD-5 → PCL-5.
- [x] Ask all brief screens before longer follow-ups; carry forward shared scale answers once.
- [x] Record gate scores, inclusive thresholds, follow-up status, full-scale scores, sources, and population limits. Never manufacture a total for an unadministered scale.
- [x] Permit clinician-requested follow-up below a gate; disregard stale answers when an edited gate closes.
- [x] Add a PHQ-9 item 9 review interruption and retain independent direct safety review in the clinician workflow.
- [x] Keep clinical results off the respondent question/handoff screens; keep answers local to the tab.
- [x] Finish browser verification of mobile/desktop, keyboard, back/edit/clear, copy/print, and diagnostics.
- [x] Record final verification results and current run instructions.

## Local implementation completed

At the 25 October UI milestone, the implementation acceptance criteria above were met, with 55 JavaScript tests and the Python parity check passing. The later architecture refinement and current check counts are recorded below. Clinical and forensic browser paths, four-domain follow-up, safety interruption/retention, clinician overrides, response editing, local export, and responsive layouts were exercised. [docs/VERIFICATION.md](docs/VERIFICATION.md) records the actual checks and what they do not establish. T3 has saved launch and test scripts and points to the application folder.

## Design and workflow refinement

The finished interface uses restrained typography, sage score charts, a responsive two-column review, and collapsed evidence and optional measures. Patient questions keep published wording intact and hide workspace navigation during the sitting. Results have explicit score ranges and threshold markers; personality histograms share a frequency scale and distinguish volunteer frequencies from clinical probabilities.

The clinician can copy a concise summary, save an offline HTML report, or print the same structured report. A full response appendix is optional. Exports use the latest notes, escape user-entered text, and contain no remote resources or scripts. Starting the next sitting removes patient information and one-off decisions while retaining practice topic preferences. Fifty-five JavaScript tests and browser verification cover the refinements; these remain software checks, not validation of the combined pathway.

## Research limitations found during audit

The research scripts and paper were reviewed, not fully re-run. They remain intact. Specific issues to resolve before treating the research report as publication-ready include item-ceiling denominators (comparing NaN to a category produces False before `nanmean`), percentile curves using upper ranks where the protocol requests mid-ranks, 41 quadrature points in code versus 61 in the protocol, and an incumbent-based tie-band search that warrants checking against the literal global maximum. The paper's broad statements about normality assumptions and measuring the high end need careful qualification. The included simulated-data helper does not fit and recover its simulated GRM parameters.

These issues do not become clinical threshold evidence. The clinical app uses the published instruments and cited threshold decisions in its own scope record. It does not use volunteer personality percentiles to open depression or anxiety modules.

## Meaning of finished

The local implementation can be complete and tested without claiming a new instrument has been clinically validated. Prospective evaluation in the practice population, forensic calibration, additional domains, authenticated remote access, persistent clinical records, and external deployment are distinct future work. This report must not call those complete or imply they were tested.

## Developer architecture refinement — 26 October 2026

The clinical app now uses a versioned public factory, a validated policy file, a declarative additive-questionnaire registry, and automatic UI/report discovery. Structured records capture configuration provenance and support explicit raw-response replay. Public TypeScript contracts and a receiving-host example accompany runtime validation. The local server now restricts published assets, Host headers, directory traversal and symlinks, with explicit security headers. Startup loading/configuration failures display an unavailable screen.

`npm run check` passes 72 JavaScript tests, four HTTP tests, Python parity, configuration validation and the typed integration example. The earlier local implementation milestone remains historical. Current architecture findings, remaining gaps, and rationale are recorded in [docs/ARCHITECTURE_REVIEW.md](docs/ARCHITECTURE_REVIEW.md). No Git repository, public package publication, remote deployment, or clinical validation was added.

## Repeatable end-to-end verification — 26 October 2026

The final clean-install `npm run verify` run passes 73 JavaScript tests, four real HTTP security tests, Python scoring parity and invalid-code checks, configuration validation, the TypeScript integration example, and **111/111 actual browser tests** in 2.5 minutes with zero retries or skipped tests. The matrix covers desktop Chromium/Firefox/WebKit and Pixel 7/iPhone 13 emulation. Tests drive real answers, clinical/forensic safety workflows, overrides, edits, next-patient resets, custom policy/registry behavior, optional modules, keyboard operation, downloads, offline reports, native Chromium clipboard/PDF output, responsive layouts and automated accessibility checks.

Browser testing and integration inspection found and fixed narrow-screen menu overflow, long custom-name layout failures, clipboard-fallback exceptions/cleanup, conditional text length disagreement with the API, insufficient chart-label contrast, a missing printed source heading, personality navigation data loss and omitted recorded clinician fields in default report-helper calls. Regression tests cover these fixes. A clean dependency installation succeeded and the dependency audit reported zero known vulnerabilities on this date.

See [docs/VERIFICATION.md](docs/VERIFICATION.md) for evidence, [docs/E2E.md](docs/E2E.md) for repeatable commands and this workstation's WebKit prerequisites, and `playwright-report/index.html` for the generated local test report. These checks establish the tested software behavior; they do not establish clinical/forensic validity, physical-device compatibility or formal accessibility certification.

## Usability and accessibility refinement — 26 October 2026

The interface now uses relative, more legible type, full-size editing fields, stronger control boundaries, roomier phone navigation and a simple responsive export grid. Phone/short-screen toolbars scroll naturally, long metadata wraps, and enlarged text retains bounded padding. Question transitions focus the heading and expose timeframe/examples as accessible descriptions. The export panel supports Escape and outside/focus dismissal. Personality results announce readiness without scrolling away from the active response. System-color focus/selection cues support forced-colour mode.

The final `npm run verify` passes **133/133 browser runs** across five projects in 2.7 minutes, with zero retries or skipped cases, plus 73 JavaScript tests, four HTTP tests, Python parity/validation and TypeScript/configuration checks. New tests cover expanded forensic/alcohol/DASS setup and targets, heading/skip/description behavior, 200% text at 320px across the main screens and offline report, native keyboard focus visibility, export dismissal and Chromium forced-colour behavior. Visual review includes actual phone/desktop screenshots and the generated PDF. The earlier 111-run result above is the previous milestone.

[docs/ACCESSIBILITY.md](docs/ACCESSIBILITY.md) records implemented behavior and remaining manual assistive-technology/device checks. Published clinical wording, rules and thresholds are unchanged. No runtime dependency or remote service was added.

## Optional questionnaire expansion · 26 October 2026

Implemented nine optional reviewed definitions: ASRS-v1.1 six-item screener; TAPS; DSS-B; Mini-IPIP; IPIP-NEO-120; and complete IPIP-hosted CAT-PD-SF v1.1 Anger, Affective Lability, Non-Planfulness and Mistrust scales. The existing default sitting remains brief. Profiles expose separate keyed means/sums and completeness without invented clinical cutoffs or aggregate personality totals. TAPS uses an explicit published algorithm and US form selection; ASRS retains its original form and separates original endorsements from the alternative research total. Source archives, keys, hashes, rights and population limits are documented in [docs/MEASURES.md](docs/MEASURES.md).

The logic page, setup, reports, summaries, offline HTML/print, structured exports and public types support the additions. Long facets stay folded in screen review and are included in printed reports. Bundled definitions are immutable; named adapters validate against independent reviewed snapshots. No new runtime dependency, remote loader, database or service was introduced.

SCI sleep, OCI OCD, WHODAS and WHO ASSIST have external links and explicitly clinician-entered result fields. Their required electronic/commercial reproduction permissions were not established; their items are not embedded, and no permission request or licence purchase was made. ASRS-18 and ASRS-5 are also outside the verified six-item permission. These are remaining rights dependencies, not functioning embedded questionnaires.

Verification: 99 JavaScript tests plus configuration/types/compiled/Python/HTTP checks passed; full browser regression 225/225 across five projects, including real A4 PDF text extraction, 320px/200% reflow and axe. See [docs/VERIFICATION.md](docs/VERIFICATION.md) for final focused verification and evidence limits.

## Practice-readiness upgrade · 26 October 2026

The authorised local implementation is complete: explicit encrypted portable
sittings with patient-reference checks and captured configuration; named practice
selection templates and measure search/details; clinician partial review and
resumption; draft/final attestation with correction history; version/form-aware
numeric history graphs and accessible tables; named settings drafts, explicit
review/activation, concurrency protection and legacy migration; and a typed,
transport-free Praxi integration boundary with exact persistence receipts.
Clinical scoring/item definitions were preserved. No runtime dependency, patient
database, second portal or automatic patient-data network transmission was added.

Local Git records the original tested baseline (`1a04672`) and this upgrade.
A pinned, least-privilege GitHub Actions workflow is ready, but no remote was
created and hosted CI has not run. The older Praxi checkout was inspected
read-only; it was not modified or represented as a verified current integration.
The practice-system architecture and receiving obligations are documented in
[docs/PRAXI_INTEGRATION.md](docs/PRAXI_INTEGRATION.md).

Verification passes 113 JavaScript tests plus types/configuration/compiled/Python/
HTTP checks, the full 282-run browser regression, and 40 final targeted workflow
runs across all five browser projects after the last priority-summary correction.
The added regression brings the available full matrix to 287 runs; see
[docs/VERIFICATION.md](docs/VERIFICATION.md) for exact run scope and evidence.
Native clipboard/offline HTML/actual PDF output, accessibility automation and
failure paths are included. Dependency audit reports zero known vulnerabilities.

The **overall practice-readiness goal remains active**. Its definition of done
is [docs/PRACTICE_READINESS.md](docs/PRACTICE_READINESS.md). Software verification
is complete for the recorded scope; independent clinical verification, human
accessibility/device testing, rights-holder permissions, the current Praxi
receiving integration and hosted CI execution still need real evidence. Concrete
clinical/accessibility task packs and permission-request drafts are prepared in
[docs/acceptance](docs/acceptance/CLINICAL_REVIEW.md); none is a completed human
review, permission grant or licence purchase. No external messages were sent.


## Full acceptance audit · 26 October 2026

The complete current **287/287 browser matrix** now passes. A host integration
audit adds matching practitioner/clinical-session receipts, immutable receipt
capture and distinct typed errors for an unconfirmed write versus acknowledged
storage whose current context cannot be revalidated. All **115 JavaScript tests**
and types/configuration/compiled/Python/HTTP checks pass after this refinement.
No standalone UI, clinical wording or scoring rule changed in that audit.

The [requirement-level evidence record](docs/acceptance/EVIDENCE.md) keeps all five
external acceptance dependencies open. The older Praxi licensing records do not
supply the missing grants, and connected GitHub access cannot read the current
Praxi source or identify an Open Screen remote. Product/access-control choice
and repository destination have been requested; no reply or external approval
is assumed. The overall practice-readiness goal remains active.


## External dependencies block overall completion · 26 October 2026

A further recheck confirms the same missing owner choices, current Praxi access,
human reviews, permissions and hosted CI evidence. The goal is blocked on external
input/evidence after three consecutive goal turns with those requirements open.
It is not marked complete or cancelled. The local implementation remains tested
and available; the full original definition of done is retained in
[docs/PRACTICE_READINESS.md](docs/PRACTICE_READINESS.md).

## Practice workflow upgrade · 29 October 2026

Engine 0.4.0 implements the subsequent review's local workflow improvements:
independent safety-review documentation and follow-up accountability, forensic
context and source-separated notes, explicit unscored omissions, planned full-form
monitoring, clearer evidence and response-pattern descriptions, manual advancement,
compact review and encrypted snapshot status. The full local verification passed
125 JavaScript tests and 327 browser runs, plus type/configuration/compiled/Python
and HTTP checks. See [docs/VERIFICATION.md](docs/VERIFICATION.md).

This release rejects older 0.3.0 sitting files; retain their original release for
opening/exporting them. [docs/WORKFLOWS.md](docs/WORKFLOWS.md) documents this limit.
The overall goal still depends on external clinical/accessibility acceptance,
permissions, current Praxi receiving integration and hosted CI. Follow-up metadata
does not create tasks or reminders, and no remote publication was performed.


## Whole-app design implementation · 29 October 2026

The Mobbin-informed local redesign now extends beyond home: compact setup with
search/templates and folded administration; focused patient screens; actionable
clinical/forensic review; expandable score/profile summaries; grouped save/export
controls; direct encrypted recovery and passphrase visibility; per-form history;
focused gate editing; and contextual guidance. The logo still returns home.
Safety, permissions, missingness, captured rules and report completeness remain
explicit. The shared review requirements drive both finalisation and its checklist.

The implemented components and maintenance rules are in
[docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md), the research decisions in
[docs/UX_RESEARCH.md](docs/UX_RESEARCH.md), and actual software results in
[docs/VERIFICATION.md](docs/VERIFICATION.md). This milestone does not close the
external clinical/human-accessibility, receiving-system, permissions or hosted-CI
acceptance dependencies. No remote repository or publication was created.


## Components and clinical evidence · 29 October 2026

Shared navigation, action roles, inline validation/correction, pending encryption
and synchronous cancellation cleanup are implemented. Mobbin evidence is recorded
in docs/COMPONENT_RESEARCH.md. Primary clinical/forensic sources and reuse terms
were reviewed in docs/CLINICAL_EVIDENCE_REVIEW.md; external safety interpretation
and obsolete clinician guidance were corrected without changing questions,
thresholds, scores or schema. Historical definitions do not count as administered
catalogue measures. Potential C-SSRS, ASQ and K6/K10 additions remain separate
exact-form work, with no new questionnaire registered in this pass.

Final local verification passed 126 JavaScript tests, supporting checks and a
single clean 434/434 browser matrix, with zero unexpected/flaky/skipped cases.
See docs/VERIFICATION.md for exact evidence and run boundaries. Independent
clinical/human-accessibility acceptance, permissions, live receiving integration
and hosted CI remain external dependencies; the overall goal is not closed.


## Adversarial correction release · 30 October 2026

The fourteen accepted findings now have code corrections, direct boundary tests
and browser sequences. Engine/rules 0.5.0 / 2026-10-30 strengthens safety review
freshness/provenance, selected-module reporting, external bounds, final-report
verification, host types, history chronology/event anchors and compatible recovery
and archival. The assessment setup now has a compact Menu and measures near the
top, with optional preparation/source detail collapsed.

The mapping, compatibility limits and remaining acceptance are in
[Review implementation](docs/REVIEW_IMPLEMENTATION_2026-10-30.md); local results
are in [Verification](docs/VERIFICATION.md). Older encrypted files require their
original application. Human clinical/AT/device acceptance, exact permissions,
hosted CI and live receiving-system verification remain open. No professional
acceptance, remote deployment or live clinical write is claimed.
