# Practice readiness · definition of done

Goal started 26 October 2026. This is a software delivery and practice acceptance goal, not validation of a new clinical instrument.

## Software acceptance

- Explicit encrypted portable sitting files save and restore configuration, answers, notes, safety state and compatible history. Wrong passwords, tampering, oversized or incompatible files cannot replace the current sitting. Decrypted patient reference must be confirmed before resuming. No patient data or password in browser persistence, request URLs or logs.
- Named practice templates select areas/context only. Administration permissions and patient-specific choices are confirmed each sitting. Measure discovery shows actual burden, timeframe and purpose/limitations; overlapping personality selections are visible.
- Review leads with safety, incomplete work and indicated follow-up. Reports are visibly draft until clinician attestation; edits invalidate current attestation and preserve the preceding final version. This is a local workflow attestation, not authenticated identity or a legal digital signature.
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

The goal remains open until both software acceptance and these external dependencies have evidence. Status and test evidence are maintained in COMPLETION.md and docs/VERIFICATION.md.

## Current status · 26 October 2026

Software implementation and local verification pass: 115 JavaScript tests plus
types/configuration/compiled/Python/HTTP checks, and the full current 287-run
browser matrix. The typed host boundary now requires matching practitioner and
clinical/assessment session receipts and distinguishes uncertain writes from
acknowledged storage with an unconfirmed current context. Callback tests are
synthetic; there is no live receiving-system connection.

The requirement-by-requirement audit is in
[acceptance/EVIDENCE.md](acceptance/EVIDENCE.md). All five external acceptance
dependencies remain open. The owner has been asked for the Praxi app/access
choice and repository destination. Completion is blocked on these external dependencies; no human sign-off,
protected-form grant, hosted execution or live Praxi test is assumed.


## External dependency recheck · 26 October 2026

The same external requirements remain outstanding after three goal turns. The
current worktree and recorded results still show 287 successful browser runs,
zero failed/skipped/flaky runs and 115 passing software tests/checks. No new
clinical/accessibility approval or licence grant has been supplied. Git still
has no remote and the current Praxi content request still returns 404. Owner
app/access-model and repository-destination questions remain unanswered.

The goal is blocked on external input/evidence, not achieved or cancelled. Resume
when the pending owner decisions and current repository access are supplied;
independent reviews, exact permissions and live receiving/hosted CI verification
must still be completed against the original definition of done. Do not replace
those requirements with further passing local test runs.
