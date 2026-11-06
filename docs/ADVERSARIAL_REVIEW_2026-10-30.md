# Open Screen multidisciplinary adversarial review

Baseline findings are preserved below. The subsequent code corrections and remaining acceptance work are tracked in [Review implementation](REVIEW_IMPLEMENTATION_2026-10-30.md).

Reviewed 30 October 2026 against commit `61b0e339e9299d5450daaf2d86b2e9cbd62f2c72`, engine 0.4.0 and rules 2026-10-29.

Open Screen has a strong foundation for a supervised local screening workflow. Its largest remaining weaknesses are consistency across safety review, exports, recovery and integrations. This review identifies **14 actionable findings: 12 P2 and 2 P3**. No P0 or P1 defect was established. Address the clinical-record consistency findings before practice acceptance; passing software tests does not supply clinical approval.

The review used three independent delegated AI reviews, a separate skeptical challenge round, a desktop and phone browser walkthrough, source inspection, primary-source checks, and synthetic failure cases. These are disciplinary perspectives applied by AI reviewers, not reviews signed by registered psychologists or other credentialed professionals. No application code was changed.

## Review coverage

| Perspective | Main adversarial question | Findings and next work |
| --- | --- | --- |
| Clinical psychologist | Can the record imply a review or result that the current evidence does not support? | F01–F04, F06; independent clinical acceptance remains required. |
| Forensic psychologist | Can the record explain its sources, revisions, participation conditions and limits under challenge? | F01, F03, F05, F07, F14; notification and correction provenance improvements. |
| Psychometrician | Are instructions, measurement anchors, missingness and comparisons preserved? | F02, F04, F05, F08; independent source-derived cases. |
| Patient advocate and cognitive accessibility | Can an interrupted or distressed respondent understand the next task? | F02; preparation, pause/help access and advancement preferences. |
| Frontend developer and designer | Do state transitions preserve a coherent usable workspace? | F10–F13; atomic reset and recovery paths. |
| UI and UX expert | Are consequences visible before irreversible workflow commitments? | F11–F13; preparation, workload and recovery discoverability. |
| Graphic designer and information designer | Does hierarchy clarify clinical meaning without implying precision? | Keep the restrained visual system; show all selected-module statuses and comparison anchors. |
| Security specialist | Can hostile content escape, compromise encryption, or corrupt trusted record claims? | F07, F10–F12; no confirmed XSS, decryption bypass or remote disclosure. |
| Perfectionist software engineer and QA | Do boundary cases agree across implementations and formats? | F03, F06–F09, F14; broader state-sequence and contract checks. |
| Software architect | Do validation, workflow and persistence share the same invariants? | F01, F07, F10–F12; separate validated transitions from DOM rendering. |
| AI skills and tooling expert | Can agents make reproducible changes without inventing clinical evidence? | Scoped source-audit and review workflows; deterministic scoring stays authoritative. |
| Codex expert | Does repository guidance make consequential review rules discoverable and testable? | A concise repository AGENTS.md, targeted adversarial review, CI evidence retention. |

The reviews were independent in task context, but used the same Codex model. Agreement between them reduces some implementation uncertainty; it does not constitute independent human or clinical validation.

## Verification

- `npm run check` passed configuration validation, the public TypeScript integration example, 126 JavaScript tests, compiled-artifact verification, the Python scorer check and four Python HTTP-server tests.
- The initial `npm run verify` run passed 290 browser cases across desktop Chromium, Firefox and mobile Chromium. Its 184 WebKit cases failed before application execution because `libicudata.so.74` was unavailable on the ordinary library path.
- Using the compatibility library path already documented in `docs/E2E.md`, a focused rerun passed all 184 desktop/mobile WebKit cases. **Across the two runs, all 474 configured browser cases passed, with no retries.** This was not one uninterrupted green `npm run verify` invocation.
- Root synthetic assertions independently reproduced F01, F03, F04, F06, F07, F08 and F14. The browser walkthrough reproduced F01 and F13.
- The delegated reviewers reproduced the additional factory, history-capacity and payload-contract cases. F10's full browser transition was simulated with the actual functions and stubbed browser APIs, rather than observed in a live browser.

Environment: Node 26.12.1, Python 3.15.2 and npm 11.20.0 on the supplied workstation. Hosted CI execution, physical Safari/iOS devices, human assistive-technology use and clinical suitability were not established.

Synthetic evidence is retained locally under [artifacts/review-2026-10-30](../artifacts/review-2026-10-30/): initial and WebKit logs, WebKit JSON results, root probe output, independent reviews and the challenge review. That directory is intentionally ignored by Git.

P2 means a material correctness or workflow issue to schedule for correction. P3 means a lower-impact consistency or usability improvement. Clinical interpretation consequences are plausible risks, not measured adverse outcomes.

## Confirmed findings

### F01 Safety review is not bound to the findings it reviewed

**P2 · High confidence in behaviour · Clinical review and human factors**

Evidence: `interview.js:791`, `interview.js:816`, `core/workflow.js:30`, `api.js:153`.

Reproduction: Complete a below-gate sitting, select Reviewed in interview, and enter a method and outcome such as “No acute concerns at that time.” Subsequently record Yes for the external C-SSRS endorsement note, harm concern, current opioid sedation or current withdrawal symptoms. The earlier method/outcome remains, the checklist can still say Ready to attest, and finalisation succeeds. Root reproduced the C-SSRS-note sequence using the actual browser controls and confirmed the earlier outcome in the final record.

The defect is uncertainty about whether the disposition covers the newly entered information. An edit to an already-final record correctly creates a draft and requires another attestation; it does not silently preserve a final record. These flags also do not establish emergency triage. Columbia explicitly distinguishes high-risk responses from other endorsements and leaves setting-specific next steps to the applicable protocol. [Columbia FAQ](https://cssrs.columbia.edu/the-columbia-scale-c-ssrs/faq/)

Fix: Bind review acknowledgement to the relevant findings or their revision. A material change should request renewed review of those findings, allowing the clinician to retain an outcome with an explanation. Preserve the old review as provenance. Do not invent an aggregate risk score or treat every Yes as an emergency.

Acceptance: Add a finding after review and after finalisation; both paths must require acknowledgement of the current findings before the next attestation. Test a justified unchanged outcome as well as a changed disposition.

### F02 Later item pages lose their administration context

**P2 · High confidence in missing instructions · Clinical measurement and accessibility**

Evidence: `gates/engine.js:222`, `gates/engine.js:252`, `gates/engine.js:270`, `interview.js:394`.

PC-PTSD, PCL and DASS Stress supply their stem/instructions only on the first relevant item. Later pages replace the preceding screen and have a null stem. A recovered sitting on a later item therefore lacks the original visible timeframe and framing. PCL has a collapsed source disclosure containing its period, which partly mitigates discoverability.

This is consequential in a sitting mixing different recall periods, especially after interruption. Root inspected generated DASS steps: the first had a stem and the following six did not. The source forms place their instructions with the item set. [Official PC-PTSD-5 form](https://www.ptsd.va.gov/professional/assessment/documents/pc-ptsd5-screen.pdf), [official DASS-21 form](https://www2.psy.unsw.edu.au/dass/Download%20files/Dass21.pdf)

Fix: Keep the applicable source timeframe and necessary instruction visible on each item page and after recovery. Offer access to the complete instructions without changing item wording.

Acceptance: Recover directly into a later PC-PTSD, PCL and DASS item; the relevant context must be visible and included in the accessible description.

### F03 The legacy text record can omit a retained safety endorsement

**P2 · High confidence · Export consistency and forensic reconstruction**

Evidence: `interview.js:473`, `gates/engine.js:495`, `gates/engine.js:519`, `api.js:152`.

Endorse PHQ item 9 and then revise it to zero or a missing response. The API retains the safety flag through `clinician.safetyEndorsed`, but adds it after the legacy text has been generated. Root reproduced `safetyFlag === true` with no PRIORITY statement in `record.text`.

The structured record, main clinical summary and main HTML warning remain protective. The inconsistency affects the full-record copy and optional text appendix; it is not complete suppression of the safety flag.

Fix: Generate every representation from the same effective safety observation. Explicitly distinguish an earlier endorsement from the current response. A further forensic improvement is an observation/correction trail retaining the original code and revision context; the current Boolean cannot reconstruct that history.

Acceptance: Test endorsement followed by zero, missingness and a closed gate. Structured output, summary, HTML and full text must agree on the retained observation.

### F04 Reports omit some selected but unscorable modules

**P2 · High confidence · Clinical handover and information design**

Evidence: `presentation.js:182`, `presentation.js:184`, `presentation.js:185`, `presentation.js:202`.

Select DASS Stress, answer six items and decline one. Complete the missing-answer review and the other finalisation requirements. The engine correctly retains an incomplete result without substituting zero, but the ordinary summary and HTML report omit the DASS result section. Comparable conditional rendering affects incomplete response-pattern and personality-marker modules.

Root reproduced the DASS case through finalisation and report generation. Generic missing-answer notices and item identifiers provide partial evidence, and the optional legacy appendix contains more detail. They do not give recipients a clear instrument-level account of the attempted measure.

Fix: Render every selected module with its administration/scoring status, answered/required count and reason no score is available. Preserve valid partial subscale results where the instrument permits them.

Acceptance: Across all selected modules, the normal report must distinguish not selected, not administered, incomplete and scored without requiring a raw-response appendix.

### F05 PCL history does not identify a changed assessment event

**P2 · High confidence in grouping · Psychometric interpretation safeguard**

Evidence: `core/history.js:37`, `core/history.js:113`, `presentation.js:160`.

Two final PCL assessments for the same reference, using event A with total 60 and event B with total 20, produce one series `[60,20]` with `settingsChanged: false`. Compatibility and settings comparison exclude the event.

The chart already states that differences are not proof of reliable or clinically meaningful change. It does not call the decrease improvement. The narrower concern is that the event discontinuity is undisclosed. The official standard PCL form anchors responses to a selected worst event. [VA standard PCL-5 form](https://www.ptsd.va.gov/professional/assessment/documents/PCL5_Standard_form.PDF)

Fix: Capture an explicit same-event confirmation or stable non-narrative event identifier. Split or annotate changed and unknown anchors. Do not use exact narrative equality as identity, or require repeated detailed trauma disclosure merely to draw a graph.

Acceptance: Same event with different wording, a different event, and an unknown event must produce intelligible comparison states.

### F06 Impossible external totals can enter final records

**P2 · High confidence · Data validation and clinical records**

Evidence: `interview.js:798`, `gates/instruments.js:429`, `api.js:132`.

External PHQ-9 and GAD-7 controls advertise their ranges, but the number inputs have no corresponding bounds and API validation accepts bounded strings or any finite number. A delegated probe finalised PHQ-9 total 999; root independently finalised GAD-7 total 999 and found it in the clinical summary.

These are clinician-entered observations rather than automated scores. They do not import item responses or bypass the separate safety review. Nevertheless, an obvious transcription error becomes a plausible-looking final record field.

Fix: Define instrument-specific integer/range schemas once and use them in UI, API, import and finalisation validation. Retain flexible text only where the external form/version genuinely makes numeric validation inappropriate.

Acceptance: Reject negative, fractional and above-maximum totals; accept zero and the maximum. Verify that an invalid field produces an actionable error before finalisation.

### F07 Public helpers can label unsigned content with an earlier final attestation

**P2 · High confidence · SDK correctness and record integrity**

Evidence: `core/assessment.js:162`, `core/assessment.js:237`, `core/assessment.d.ts:28`, `presentation.js:167`, `presentation.js:172`, `docs/DEVELOPMENT.md:45`.

Two independently reproduced paths exist:

1. Clone a final assessment and change its clinician notes. `verifyAssessment()` rejects the digest mismatch, but `assessmentRecord()` accepts the structurally valid object and preserves the Final label.
2. Keep a verified assessment unchanged, then pass different clinician notes to `clinicalSummary()` or `buildReport()`. The unsigned notes appear under the original attestation.

The public type does not distinguish verified input, and the developer guide explicitly permits clinician overrides for current unsaved edits. A verified-input convention cannot protect an override introduced afterwards.

The supplied host bridge verifies first, and no reference-UI import bypass or cryptographic forgery was demonstrated. This is a public reporting boundary defect.

Fix: Require verified final content at conversion, or clearly downgrade unverifiable content to draft. Reject or downgrade changed clinician overrides on final records. Consider a verified-input type as an additional developer aid, not a replacement for runtime enforcement.

Acceptance: Mutated finals and unsigned overrides must never retain the earlier Final/attested presentation; unchanged verified records must still render normally.

### F08 Timestamp offsets can reverse history and the latest score

**P2 · High confidence · Integration and longitudinal correctness**

Evidence: `core/assessment.js:9`, `core/history.js:124`, `presentation.js:163`.

Valid timestamps are accepted with offsets, but history sorts their strings. Root reproduced:

- Earlier: `2026-10-25T10:00:00+11:00`, actually `2026-10-24T23:00:00Z`, score 0.
- Later: `2026-10-25T00:00:00Z`, score 1.

The series orders values `[1,0]` and displays Latest 0. The bundled browser normally creates UTC timestamps, limiting immediate exposure to imported/API-generated records.

Fix: Sort parsed instants with deterministic tie handling. Normalize new timestamps at the boundary if appropriate; never silently rewrite already-attested content.

Acceptance: Include mixed offsets, equivalent instants, reversed input order and revised finals in chronology tests.

### F09 Host payload declarations promise text that runtime omits

**P2 · High confidence · TypeScript integration contract**

Evidence: `core/host.d.ts:42`, `core/host.js:66`, `api.js:187`.

The payload type omits only `responses` from `ScreeningRecord`, leaving `text: string` required. The default runtime export removes both. A delegated persistence-callback probe observed `payload.record.text === undefined`; code following the declaration and reading its length would throw.

Fix: Define the actual exported-record shape, with `text` and `responses` optional or explicitly discriminated by export mode. Use it in the host contract and examples.

Acceptance: Check minimal/full runtime payload shapes against the public declarations and exercise a real typed callback, including absent fields.

### F10 Starting fresh after an extended-registry recovery can crash

**P2 · High confidence in reproduced exception · State transition and availability**

Evidence: `interview.js:104`, `interview.js:169`, `interview.js:173`, `interview.js:937`, `api.js:83`.

A valid captured assessment can contain the bundled registry plus `examples/questionnaire.json`. Starting a new sitting changes back to the deployment factory while retaining a topic key such as `example-checkin`. Refresh catches one validation failure, but the subsequent render validates the incompatible setup again and throws.

The independent security review and skeptical challenge both reproduced the actual function sequence with browser APIs stubbed. Live browser presentation was not separately established. Reloading provides a workaround.

Fix: Construct and validate a fresh compatible setup and replacement factory before assigning either. Carry only explicitly reusable preferences and commit the transition atomically.

Acceptance: Resume a valid extended-registry file, start a new assessment under the standard registry, and complete a question without exceptions or foreign topic/form keys.

### F11 Accepted history can grow beyond complete encrypted recoverability

**P2 · High confidence · Recovery and capacity management**

Evidence: `core/assessment.js:257`, `core/vault.js:55`, `interview.js:130`, `workspace-ui.js:113`.

A bundle containing 36 ordinary bundled-registry final assessments plus a draft, each with an allowed 20,000-character note, passes `verifyBundle()` at approximately 4.10 MB plaintext. Encryption correctly rejects plaintext above 4,000,000 bytes.

The count and byte limits are both documented; the defect is not failure to fit every set of 40 records. It is accepting history/edits until the advised export escape route cannot save the complete bundle. Reports and ordinary JSON are not a full recovery archive, and the UI lacks selective encrypted archival. Earlier saved files remain valid.

Fix: Check a shared serialized-byte budget before accepting additions and before growth becomes unsavable. Offer explicit encrypted archival/splitting. Deduplicate configuration snapshots if useful, while retaining validated provenance and the encryption size bound.

Acceptance: Near-limit history import and note edits must preserve a complete encrypted escape route. Reject additions before mutating state, or provide a verified archive operation without silently dropping history.

### F12 Invalid deployment preferences also block captured-file recovery

**P2 · High confidence from startup flow and executable validation · Recovery isolation**

Evidence: `interview.js:16`, `app-config.js:67`, `interview.js:986`.

Malformed or incompatible practice preferences cause module startup to throw before recovery controls and the resume-entry handler initialize. Independently opening and validating a compatible encrypted file succeeds using its captured configuration.

Blocking new sittings until settings are reviewed is a sound disclosed choice. Coupling that block to recovery of an independent compatible assessment is the narrower availability problem. Repairing/resetting the preferences is an existing workaround.

Fix: Initialize an independent recovery shell. Continue to block new sittings on bad deployment preferences, while permitting captured-file validation and explicit patient-confirmed recovery.

Acceptance: With corrupt practice preferences, a valid compatible file must remain recoverable without deleting the preferences first. Invalid files must still fail closed.

### F13 An optional blank reference becomes locked before its consequence is explained

**P3 · High confidence · Identity workflow and usability**

Evidence: `interview.js:236`, `core/history.js:86`, `docs/WORKFLOWS.md:64`.

Start without the optional reference and answer one item. Returning to setup shows a blank readonly reference. Final assessments with blank references are deliberately excluded from history graphs. Root reproduced the locked field in the browser.

Locking an established identity is protective, and blank-reference history exclusion is documented. No cross-patient mixing, incorrect score or loss of encrypted recovery was found. The gap is that the user can enter a workflow without seeing that they cannot add the reference later.

Fix: Explain the consequence before starting, or support a controlled and confirmed blank-to-reference assignment where history/identity constraints permit it. Keep protections against casual changes to an established patient identity.

Acceptance: A clinician can understand the future history limitation before answering, or safely assign a previously blank reference through an explicit supported workflow.

### F14 Text exports identify an older rules version

**P3 · High confidence · Provenance consistency**

Evidence: `api.js:17`, `gates/engine.js:512`.

Captured metadata identifies rules 2026-10-29; the legacy text hardcodes Application rules 2026-10-26. Root reproduced both values in one record. Full-record copying and the optional appendix inherit the stale text.

Fix: Derive all version labels from the authoritative release metadata.

Acceptance: Assert metadata agreement across structured output, summary, HTML, clipboard text and the appendix.

## Design and clinical workflow improvements

These are proposals and adoption requirements, not additional confirmed defects.

**Prepare the respondent before the first item.** Setup currently transitions directly to a question at `interview.js:301`; the fuller guide is a separate destination. Add a short handoff step covering purpose, expected flow/burden, who receives results, the ability to pause/decline and how to summon the supervising clinician. Keep published item wording intact. Make the advancement preference easy to discover there.

**Record forensic notification in a suitable form.** Support voluntary consent, mandated-examination notification or assent as appropriate, including comprehension/adjustments and a reference to external documentation. Avoid a universal “I consent” checkbox. The current forensic fields capture useful context but do not explicitly evidence this process. APA section 6 is a relevant process reference, not a determination of Australian legal requirements. The existing practice-acceptance pack already includes consent/privacy review. [APA forensic guidance](https://www.apa.org/practice/guidelines/forensic-psychology.html)

**Evaluate automatic advancement with actual users.** It is announced before input and manual mode exists, so this review does not classify automatic advancement itself as a WCAG failure. Test users who need to explore radio choices, use screen readers or have concentration difficulties. Compare correction rates, accidental advancement and task completion; choose defaults from that evidence. W3C permits a context change when users have been advised beforehand. [W3C On Input](https://www.w3.org/WAI/WCAG22/Understanding/on-input)

**Improve discoverability without adding decoration.** The restrained green/neutral palette, typography, generous response targets and compact result summaries suit the task. Keep them. Add visible labels to the setup save/resume/logic icons where space permits; hover titles alone are weak help for touch users. Show an aggregate selected-item/burden range before starting, with honest uncertainty about adaptive branches. Preserve safety and save-state text outside optional disclosures.

**Keep graphical meaning explicit.** Maintain score/range/instrument labels and text equivalents. Add event-continuity and administration-status information where F04/F05 require it. Avoid combined domain totals, invented percentiles, risk gauges or visual claims of reliable change. Graphic polish should make these distinctions easier to see.

**Run realistic human tasks.** Include interrupted trauma items, changing an answer after a safety review, a blank reference, wrong file selection, lost passphrase, near-capacity recovery, a corrected final report and the next patient. Observe where people hesitate or infer the wrong thing; ask them to explain what they believe was saved and reviewed. Existing human AT and clinical acceptance packs provide a starting point.

## Architecture and verification improvements

The central engineering pattern is duplicated or separated enforcement: UI state, pure scoring, final-review validation, export formatting and recoverable-file capacity do not always share the same invariant.

1. Introduce explicit validated transition functions for resume, start-new, add-history, revise and finalise. Validate the proposed state before committing it. Keep the DOM layer responsible for rendering and interaction.
2. Define one canonical result/status/safety-observation model for all output formats. Treat report consistency as a contract, including absence of a score.
3. Add sequence-based tests around revise → close gate → reopen → finalise → save → resume → start-new, using different captured registries and policies.
4. Add source-derived clinical fixtures reviewed independently from the implementation. A test that uses the same constant or scoring helper as its expected result cannot detect an incorrect source interpretation.
5. Use targeted property and mutation checks: missingness never becomes zero, inactive responses never create a current full score, identity never crosses a patient boundary, unsigned edits never retain attestation, and accepted growth preserves a recovery route.
6. Exercise declarations against runtime exports and test an installed package/archive in a temporary consumer. Packaging failure was not established; this is a coverage improvement.
7. Retain CI logs, traces and reports for failed synthetic cases with an explicit retention policy. The current workflow runs verification but does not upload those artifacts. Do not capture real clinical records in CI.

A framework migration or backend rewrite is not justified by this review. The pure deterministic engine, explicit specialised adapters and dependency-free local runtime are useful constraints to retain.

## AI skills and Codex workflow

No AI feature is needed in the clinical runtime to address these findings. Use AI for development assistance while keeping reviewed source definitions and deterministic algorithms authoritative.

Add a concise repository `AGENTS.md` with consequential review rules and links to the existing source/acceptance documentation. Suitable initial rules are:

- Changes to item wording, anchors, skips or scoring require exact source/version evidence and independently calculated boundary cases; automated tests cannot close human clinical approval.
- Changes to safety, finalisation or presentation must preserve observation provenance and draft/final consistency across all export formats.
- Changes to recovery, history or reset must preserve captured configuration, patient identity and a complete encrypted recovery path.

OpenAI recommends small scoped rule sets, an explicit safe path and checks against a triggering change, a safe counterexample and an unrelated change. Keep formatting enforcement in CI. [Official OpenAI review guidance](https://developers.openai.com/blog/custom-code-review-rules-for-codex), [AGENTS.md guidance](https://learn.chatgpt.com/docs/agent-configuration/agents-md)

A useful task-specific skill would perform a source-form delta audit: identify the exact asset/version, compare definitions and rendered steps, calculate independent expected cases, and produce a discrepancy list for a clinician. Another could verify report parity and encrypted-recovery sequences using synthetic fixtures. Neither should grant itself authority to change clinical thresholds, claim permissions, publish patient material or mark human acceptance complete.

For significant changes, have one agent implement and another try to disprove the intended invariant before merging. Preserve rejected findings as brief rationale rather than accumulating an unfiltered wishlist. This review's challenge round demonstrates why that matters.

## Findings narrowed or rejected

- Retaining DASS/no-fee practice conditions when starting a new sitting was initially reported as a defect. It matches README's explicit policy and was rejected as a new-assessment bug. Clarify the repeat-monitoring instruction to reconfirm permissions, which is broader than some retained practice conditions.
- The initial safety-review finding proposed P1. It was reduced to P2 because edits do reopen final records as drafts, another attestation is required, and the flags do not establish emergency triage.
- PCL graphs do not claim improvement or reliable change. F05 is limited to missing event-continuity information.
- Blank-reference locking is not an identity breach or failed recovery. F13 is limited to an inadequately signposted workflow commitment.
- The encrypted byte bound is a valid safeguard. F11 concerns accepting unsavable growth and the missing archival route.
- Same-device clinician controls, unsigned local attestations and unencrypted clinical exports are explicitly disclosed trust boundaries. They are not newly discovered vulnerabilities.
- Independent clinical approval, human accessibility acceptance, remaining instrument permissions, hosted CI evidence and receiving-system integration remain the project's already-disclosed adoption dependencies.

## Improvement sequence

| Stage | Work | Completion evidence |
| --- | --- | --- |
| Clinical-record consistency | F01–F04, F06–F07, F14 | Adversarial examples corrected in every output; independent clinician checks revised behaviour. |
| History and recovery | F05, F08, F10–F12 | Correct chronology/anchors, atomic resets, recovery with bad preferences, encrypted capacity escape route. |
| Integration and usability | F09, F13 and preparation/discoverability proposals | Typed consumer test; observed clinician/patient tasks on desktop and physical devices. |
| Acceptance and maintenance | Existing clinical/AT/rights/integration dependencies; scoped agent rules and CI evidence | Named human acceptance evidence against the exact release and configuration. |

Start with safety-review freshness and report consistency, then ensure recovery remains possible through adverse transitions. Schedule visual refinement around observed usability failures. Release acceptance should be based on resolved findings and recorded human evidence, not an increased test count alone.
