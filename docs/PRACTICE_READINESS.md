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

Software implementation and recorded verification are complete: 113 JavaScript
checks plus types/configuration/compiled/Python/HTTP checks, full 282-run browser
regression and final 40-run workflow regression after the last priority-summary
correction. See VERIFICATION.md for the precise scope; the now-available 287-run
full matrix was not rerun after that final small correction. Local Git and CI
configuration are in place. Praxi adapter callbacks are tested with synthetic
receipts; there is no live receiving-system connection.

All five practice-acceptance dependencies above remain open. The overall goal is
active, not claimed achieved. No independent human sign-off, protected-form
licence grant, hosted execution or current Praxi deployment test is fabricated.
