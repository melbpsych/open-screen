# Practice readiness · definition of done

Goal started 26 October 2026. This is a software delivery and practice acceptance goal, not validation of a new clinical instrument.

## Current workflow · 30 October 2026

The clinician requested a screening-first workflow with optional risk and clinical
recording. There are no automatic safety interruptions, mandatory risk fields,
missing-answer acknowledgements or documentation-based finalisation gates.
Results and explicit missingness remain visible. Earlier observations, existing
notes, captured configuration and encrypted recovery are preserved. Finalisation
still requires completed questions, a named reviewer and an honest review
attestation; copying and exporting do not require finalisation. Historical release
notes below describe earlier behaviour, not current documentation requirements.

## Software acceptance

- Explicit encrypted portable sitting files save and restore configuration, answers, notes, safety state and compatible history. Wrong passwords, tampering, oversized or incompatible files cannot replace the current sitting. Decrypted patient reference must be confirmed before resuming. No patient data or password in browser persistence, request URLs or logs.
- Named practice templates select areas, context and administration mode only. Administration permissions and patient-specific choices are confirmed each sitting. Measure discovery shows actual burden, timeframe and purpose/limitations; overlapping personality selections are visible.
- Review leads with scores and incomplete results; recorded item observations remain visible. Reports are visibly draft until clinician attestation; edits invalidate current attestation and preserve the preceding final version. This is a local workflow attestation, not authenticated identity or a legal digital signature.
- Explicit history supports the same patient reference only. Graphs compare the same instrument/form/scoring definition, keep brief/full instruments separate and disclose policy differences. No invented reliable-change or treatment-response claims.
- Practice settings have named, reviewable revisions, recorded reviewer/rationale, activation and reset. Published locked rules stay fixed. Active sittings keep their captured configuration.
- A minimal typed host boundary validates identity and persistence acknowledgements, preserves source provenance and makes no automatic network calls. A real practice-system adapter remains subject to the receiving system's authentication, identifiers and API.
- Local Git history and runnable CI cover configuration/types, scoring/security checks and the browser matrix. No clinical exports are committed. Hosted CI is complete only after an approved remote runs it.
- Tests cover failure paths as well as happy paths; actual browser, offline HTML and PDF checks pass. Documentation describes recovery, administration, privacy and implementation limits.

## Practice acceptance dependencies

These cannot be substituted by an agent or automated tests. Evidence must identify reviewer, date, version, cases/tasks, findings and resolution.

- An independent registered psychologist verifies official forms, item order, anchors, reverse keys, skips, threshold boundaries, worked cases, source rights and clinical workflow suitability in the intended population.
- People using NVDA/Firefox and VoiceOver/Safari complete the human accessibility tasks, including automatic advance, recovery, review and exports; physical phone/tablet testing is recorded.
- Rights holders provide the necessary electronic/commercial permissions before SCI, OCI, WHODAS or ASSIST items are embedded. External links and recorded results remain available pending permission.
- The practice identifies its receiving software, approves the data contract, and verifies authentication, record matching, storage/retention and failure recovery in its test environment.
- A repository owner approves a remote and enables/runs hosted CI. Software distribution licensing is an owner decision, separate from instrument permissions.

The goal remains open until both software acceptance and these external dependencies have evidence. Status and test evidence are maintained in ../COMPLETION.md and docs/VERIFICATION.md.

## Current status · 26 October 2026

At that date, software implementation and local verification passed: 115 JavaScript tests plus
types/configuration/compiled/Python/HTTP checks, and the then-current 287-run
browser matrix. The typed host boundary requires matching practitioner and
clinical/assessment session receipts and distinguishes uncertain writes from
acknowledged storage with an unconfirmed current context. Callback tests are
synthetic; there is no live receiving-system connection.

The requirement-by-requirement audit is in
[acceptance/EVIDENCE.md](acceptance/EVIDENCE.md). All five external acceptance
dependencies remain open. The repository destination has since been deferred;
Praxi packaging and access remain undecided. Completion depends on these external dependencies; no human sign-off,
protected-form grant, hosted execution or live Praxi test is assumed.


## External dependency recheck · 26 October 2026

The same external requirements remain outstanding after three goal turns. The
then-current worktree and recorded results showed 287 successful browser runs,
zero failed/skipped/flaky runs and 115 passing software tests/checks. No new
clinical/accessibility approval or licence grant has been supplied. Git still
had no remote and the Praxi content request returned 404. The owner subsequently
deferred repository hosting and the public/private decision.

The goal is not achieved or cancelled. Current Praxi access and decisions remain
needed for the receiving integration;
independent reviews, exact permissions and live receiving/hosted CI verification
must still be completed against the original definition of done. Do not replace
those requirements with further passing local test runs.

## Software walkthrough · 28 October 2026

A synthetic clinician pass exercised a below-gate sitting, an exact PHQ-2 gate
with PHQ-9 item 9, an interrupted review, answer edits that close the gate, and
finalisation followed by a note correction. Fixes from that pass are in the
working tree. The record of what the software did, and what still needs a person,
is [acceptance/SOFTWARE_WALKTHROUGH.md](acceptance/SOFTWARE_WALKTHROUGH.md).
It is not independent clinical verification, an accessibility sign-off, or
completion of the external dependencies above.

## Practice workflow implementation · 29 October 2026

Engine 0.4.0 adds independent safety-review documentation, accountable follow-up
plans, required forensic context, explicit missing-answer reasons, full-form
monitoring, source-separated clinical notes and clearer evidence descriptions.
Review and exports distinguish unscored missing answers and unadministered forms
from measured results. Manual advancement is available alongside automatic
advancement; encrypted snapshot status and navigation warnings explain recovery.
See [WORKFLOWS.md](WORKFLOWS.md) for the behaviour and version compatibility limit.

Follow-up fields are records, not scheduled reminders or authenticated Praxi
tasks. The local host contract carries the data but the receiving implementation
and all external acceptance requirements remain outstanding. The supervised pilot
and human accessibility packs include the new workflows; they have not been
executed by independent reviewers. The latest software evidence is recorded in
[VERIFICATION.md](VERIFICATION.md).


## Adversarial corrections · 30 October 2026

Engine 0.5.0 adds current-findings safety acknowledgement, retained amendment and
review provenance, full item instructions, selected-module status reporting,
external total bounds, verified final-report conversion, event-aware/instant-sorted
history, corrected host types, atomic reset/recovery and complete encrypted
archival. The setup has one compact Menu and collapsed preparation. See
[implementation and evidence](REVIEW_IMPLEMENTATION_2026-10-30.md).

These code changes do not close the five external dependencies above. The clinical
and human-accessibility packs now include the new state changes and menu tasks.
No real patient study, professional sign-off, rights grant, hosted CI execution or
receiving-system transaction is claimed. Earlier encrypted files require their
original application; this release has no reviewed migration path.


## Public evaluation release · 6 November 2026

The owner authorised the public `melbpsych/open-screen` repository and selected
MIT for original code/documentation. Questionnaire permissions remain separate
in THIRD_PARTY_NOTICES.md. The evaluation site is built from an allowlist and
excludes DASS administration; it is for synthetic data only. Hosted verification
and deployment evidence is in GitHub Actions, with local evidence in
VERIFICATION.md. Publication does not close independent clinical acceptance,
human accessibility acceptance, outstanding protected-form permissions or
receiving-system verification.
