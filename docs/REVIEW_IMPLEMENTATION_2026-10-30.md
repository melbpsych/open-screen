# Adversarial review implementation · 30 October 2026

Engine **0.5.0**, rules **2026-10-30**. This records code corrections to the
[baseline review](ADVERSARIAL_REVIEW_2026-10-30.md), plus the requested minimal
assessment layout. It is software evidence, not professional clinical acceptance.
All fixtures and screenshots use synthetic data. No remote deployment, publication,
live patient record or receiving-system transaction is involved.

## Findings addressed

| Finding | Implemented behaviour | Direct regression evidence |
| --- | --- | --- |
| F01 · stale safety review | Review binds to current PHQ/safety findings. Changed findings require renewed acknowledgement; a justified disposition can remain. Earlier reviewed findings, method and outcome are preserved separately. No invented triage category. | Core safety-change tests; browser changes before and after finalisation. |
| F02 · lost instructions | PC-PTSD, PCL and DASS instructions/timeframe accompany every item, including recovered later items. | Generated-step checks and encrypted later-trauma recovery. |
| F03 · retained safety evidence | Effective safety includes earlier endorsement and validated amendment history. Summary, HTML, JSON and legacy text agree. PHQ changes retain original/current codes, time and available correction reason; earlier outcomes remain separate. | Cross-format assertions, edited-gate and missing-answer browser workflows. |
| F04 · invisible incomplete modules | Standard reports name every selected module with administration status, answered/required count and reason when no score exists. Exposure stops are omissions, not zeros. Independent partial results remain available. | DASS, response-pattern and personality missingness tests; trauma stop case. |
| F05 · PCL event continuity | A non-identifying clinician-entered event reference separates comparisons. Unknown anchors stay separate; guidance requires same-event confirmation before reusing a reference. Narrative wording is not used as event identity. | Same/different/unknown event fixtures and rendered history notes. |
| F06 · impossible external totals | Shared API/UI integer bounds for PHQ-9, GAD-7, SCOFF, ISI, 4AT and EPDS fixed-form totals. Invalid typed values stay outside the valid record and block finalisation. Unspecified instruments retain free text. | API boundary cases and invalid external total before/after finalisation. |
| F07 · attestation reuse | Final conversion requires an immutable verified assessment. Deserialized finals must be verified again. Differing clinician overrides or cloned derived records render Draft. | Mutated final, cloned record, unchanged and differing override tests; actual PDF correction. |
| F08 · offset chronology | History sorts parsed instants, then deterministic identity/digest ties. Already-attested timestamps are never rewritten. | Reversed-offset and equivalent-instant fixtures. |
| F09 · host payload types | ExportedRecord makes both text and responses optional; redacted prior-review bindings have an accurate exported type. | Runtime minimal/full host payload checks and an installed-package TypeScript consumer. |
| F10 · incompatible reset | A fresh deployment-compatible setup is validated before replacement; foreign registry keys cannot leak into the new assessment. | Extended-registry recovery → New assessment browser sequence. |
| F11 · recovery capacity | History addition, monitoring and finalisation check proposed byte capacity. Complete encrypted archival splits oversized history into independently valid parts. No deletion occurs until a separate confirmation after the current archive was requested. | A >4 MB accepted bundle is split, encrypted, decrypted and checked for every identity/digest; browser archive, cancellation, focus and explicit removal. |
| F12 · settings block recovery | Invalid practice preferences block new work while compatible captured-file recovery remains usable. | Browser starts with corrupt local preferences and recovers an encrypted assessment. |
| F13 · reference commitment | A short notice next to the optional reference explains history use and locking before the first response. Existing identity remains protected. | Setup notice and reference-preserving navigation/resume cases. |
| F14 · contradictory provenance | All representations use one engine/rules metadata module. | Structured, summary, report and text version agreement. |

The direct new core cases are in `core/review-regressions.test.mjs`; browser
sequences are in `tests/e2e/review-regressions.spec.mjs`. Existing scoring,
security, clinical-use, outputs, correction and PDF cases remain part of the gate.

## Minimal assessment layout

The header contains the existing wordmark and one **Menu** disclosure. It holds
main navigation, Measures/Options/Context/Guide and Save/Resume. The selected
Assessment link has no line/shadow treatment. Escape, outside pointer input and
focus leaving the menu dismiss it. Native disclosure semantics and 44px targets
remain; enlarged text may wrap the header to keep actions reachable.

The default setup begins with setting and measures. Empty presets no longer add
a row; saved presets expand on request. Measure rows show name and instrument,
with item burden/source detail under About. Preparation is collapsed before Start;
short reference and encrypted-save notices remain beside the relevant actions.
Current safety warnings and published question instructions stay visible.
Completed safety review details also fold away until findings require renewed review.

At a 390px phone viewport the heading begins about 84px from the top and the first
measure about 330px down. This is a bounded default-layout observation; custom
registries, warnings and text enlargement change the height. Browser regressions
check content position, menu dismissal, narrow reflow and automated accessibility.

Reference structure was informed by [Typeform](https://mobbin.com/screens/f21a13f3-a40e-43e7-9789-3c81bed4123c),
[Copilot](https://mobbin.com/screens/b686d316-5686-4293-aff5-f08ac6e99ae0) and
[Jobber](https://mobbin.com/screens/98b871e1-55fb-4d68-abd6-c0ced06c91f1).
These are navigation/form examples, not evidence about clinical usability. The
specific menu arrangement is an implementation decision within Open Screen's
existing colours, type, routes and controls. No new framework, font or remote asset.

## Additional code-supported recommendations

- Forensic finalisation now includes a clinician-recorded participation and
  notification account, suitable for voluntary, mandated or assent circumstances.
  It does not use a universal consent checkbox or claim to establish legal consent.
- Preparation covers purpose, recipients, confidentiality, pause/help, missing
  answers, advancement and saving. A response-task range describes adaptive
  workload without inventing a completion-time estimate.
- `core/transitions.js` separates validated proposals from state replacement.
  `core/workflow.js` supplies shared finalisation and safety-freshness requirements.
- `npm run check:sources` verifies the nine archived source asset hashes.
  `npm run check:package` packs and installs an offline temporary consumer and
  checks public runtime imports and declaration behaviour.
- Failed synthetic browser evidence is retained by the pinned CI artifact action
  for seven days. The workflow's presence does not establish hosted execution.
- `AGENTS.md` and two scoped repository skills describe source review and record/
  recovery regressions. Deterministic source definitions remain authoritative.

External numeric bounds follow the named fixed forms: PHQ/GAD sources already
archived in `docs/sources`, [SCOFF](https://www.bmj.com/content/319/7223/1467),
[ISI](https://www.med.upenn.edu/cbti/assets/user-content/documents/Insomnia%20Severity%20Index%20(ISI).pdf),
[4AT user guide](https://www.the4at.com/userguide) and
[EPDS professional guidance](https://www.nj.gov/health/fhs/maternalchild/mentalhealth/professionals/).
No new instrument item text or scoring threshold was introduced.

## Compatibility and remaining acceptance

The stronger review/content contract is versioned. Engine 0.5.0 refuses 0.4.0 and
earlier encrypted assessments; open/export them with their original application.
Do not edit version fields. An explicit migration needs a separately reviewed path.
Derived clinical JSON remains an export, not a complete recovery file.

The reviewed 0.4.0 / 2026-10-29 source remains in local Git at
`61b0e339e9299d5450daaf2d86b2e9cbd62f2c72`. A separate checkout preserves the
current working tree when an older file needs its original application:

```sh
git worktree add --detach ../open-screen-0.4.0 61b0e339e9299d5450daaf2d86b2e9cbd62f2c72
python3 ../open-screen-0.4.0/serve.py --port 8768
```

Open that local port for 0.4.0 files. Keep clinical files outside both public
application directories. Earlier releases likewise need their own original source.

The documented New assessment behaviour retains reusable practice administration
conditions; the rejected review finding was not implemented as a new requirement.
Repeat monitoring explicitly resets all administration confirmations, including
DASS, matching the permission-reconfirmation guidance.

Independent clinician/source acceptance, observed patient/clinician tasks, human
assistive-technology and physical-device checks, exact permission grants, repository
hosting and a real receiving-system test remain open. Acceptance tasks have been
extended for this release; automated checks cannot complete them. Local attestation,
timestamps and digests are not authenticated identity or a legal digital signature.

Final local verification is recorded in [VERIFICATION.md](VERIFICATION.md).


## Product audit: remove work outside the everyday job

The user confirmed the main task: choose measures → complete them → copy results
into clinical notes. The findings below are product judgments based on that job
and the observed implementation, not claims from a study of psychologists' use.

| Excess in the source | Action |
| --- | --- |
| Copy summary inside an export menu while formal sign-off led the page | Copy summary is the primary visible results action. |
| Draft status, a three-card process strip, repeated review prompts and a sidebar before results on phones | Keep one Draft/Final label and the encrypted-save status; remove the process strip and the sidebar. |
| A preview graph repeated the full chart available in each result | Closed rows show the instrument, score/range and interpretation; the full chart expands on request. |
| Referral/notification, formulation and attestation compete with viewing scores | Group documentation under Notes & final record. Safety findings and interrupted administration open it automatically. |
| The copied note repeats scores, response counts and software metadata, with a forensic warning even in clinical context | A concise copy format retains relevant clinical content, safety and review status. Detailed exports remain available. |
| PCL comparison fields appear even without PCL administration; empty history offers an archive operation | Keep empty history with optional documentation, put event references there when PCL exists, and show archival when history exists. |

Keep in the routine path: instrument selection, exact source questions and
instructions, missing-answer choices, safety alerts, distinct scores and copying.
Optional notes are useful when they add information; they should not require
rewriting a case formulation already held elsewhere.

Keep secondary: formal report attestation, multi-visit history, encrypted recovery,
external result entry, detailed source evidence and configuration. These have
specific uses, but none should be the price of obtaining a score summary.

Do not promote the original five-marker reference distributions or IPIP response
patterns as routine clinical decision tools. The repository already discloses
online-volunteer comparisons and the lack of validated credibility/malingering
inference. They remain optional research/supplementary choices. Removing an
instrument entirely needs a specific practice decision; no usage analytics or
observed psychologist tasks establish that it is never useful. Similarly,
custom threshold editing belongs outside routine administration, with its existing
explicit review and provenance.

Layout references were [Semrush](https://mobbin.com/screens/a0e328b3-9f03-40cd-820a-542b78d36e85)
and [Elicit](https://mobbin.com/screens/cbb8f804-3f26-46d6-adc0-55049357021a)
for report actions; [Profound](https://mobbin.com/screens/f745335b-5517-4cbf-a0e3-f21cb23645a2)
and [Origin](https://mobbin.com/screens/bed7d0fb-8552-46b4-b21d-c930160b72a3)
for result-first summaries; and [Sprig](https://mobbin.com/screens/30b20df2-0890-4201-ac89-dcf608170b86)
and [Base44](https://mobbin.com/screens/89946769-4d5e-4396-8667-e4523690e0ce)
for expandable secondary detail. Searches produced no suitable clinical screen;
these other domains lend structure only. What belongs in the clinical note is
judgment grounded in this app's data and the user's stated workflow.


## Direct actions and a brief-to-full decision point

The question footer now exposes missing-answer reasons, pause/help and partial
review directly. The four stacked accordions and the one-link Home tools menu
have been removed. Source explanations use compact help dialogs with native
Escape/focus behavior; optional multi-field forms use compact controls. Full-form
extension buttons remain directly available beside the results, outside optional
record documentation. No clinical wording, response anchor or scoring threshold
was changed for this redesign.

Screening now shows initial brief scores before entering triggered longer forms.
The chooser names each measure, shows remaining questions and approximate time,
preselects suggested forms, and permits other available below-threshold extensions.
TAPS shows a question-count range because subsequent answers affect its length.
Selecting forms starts them together; shared items are retained. Choosing brief
results records unadministered full forms separately, never as negative full scores.
A brief-only negative sitting also offers a direct route to choose extensions.
Planned monitoring retains full administration.

`followUpChoices` is captured with setup and the `followups` draft phase survives
recovery. UI/API/JSON/summary/HTML/full text preserve omitted full-form status,
brief scores and retained safety findings. Known item-9 endorsements remain
flagged even if a later full-form choice changes. Default SDK routing remains
unchanged when no administration choices are supplied.

Eight independent unit regressions cover default/shared-item routing, brief-only
finalisation and encrypted recovery, stale full responses, retained safety,
monitoring, invalid choices, portable decision drafts, alcohol/trauma, independently
completed TAPS branches and omitted supplemental measures. Eight new browser flows
cover direct actions, help/focus/keyboard isolation, initial findings, remaining
counts, selecting subsets, below-threshold extensions and a single brief-results
action when all full forms are deselected, complete-short-measure score ranges,
negative exposure readouts and reviewing already-completed responses. Existing manual-routing tests now
exercise the explicit decision point. Full verification results are logged in
`docs/VERIFICATION.md`.

Completion times use an explicitly rough 15-second-per-question estimate,
rounded up; they are not validated clinical administration times. Licensed source
forms, clinical acceptance, actual assistive technology/device acceptance and
receiving-system controls retain their separately documented requirements.
