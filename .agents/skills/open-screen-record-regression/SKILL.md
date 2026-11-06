---
name: open-screen-record-regression
description: Review Open Screen safety, attestation, export, history or encrypted-recovery changes using synthetic adverse state sequences and cross-format checks. Use for those workflow changes or an explicit regression audit.
---

# Open Screen record regression review

Read core/workflow.js, core/assessment.js and core/transitions.js for the affected
boundary. Use synthetic data exclusively. The shared tests are in
core/review-regressions.test.mjs and tests/e2e/review-regressions.spec.mjs.

Choose a sequence that can disprove the intended invariant: answer → safety
review → new finding → finalise → correct → save → resume → start new; or merge
near-capacity history → edit → archive → explicitly remove archived history.
Vary patient reference, captured registry, practice preferences and timestamp
offsets when relevant. A failed transition must leave the previous state usable.

Compare structured data, summary, HTML, full text and printed output. Missing or
unadministered measures must not disappear or become numeric zeros. Earlier
safety observations must survive corrections. Risk documentation is optional;
changed findings must not create a compulsory review, interruption or finalisation
gate. Existing documentation must remain truthful about its relationship to the
current responses. Final reporting requires verifyAssessment() followed by assessmentRecord();
clones and changed clinician overrides must not inherit an attested Final label.

Exercise actual controls for focus, cancellation, invalid input and downloads.
An archive download request is not durable-storage proof: all parts must remain
available, and history removal requires the user's explicit confirmation.
Check source-file compatibility with the captured engine rather than silently
migrating a previous release.

Run focused affected checks first, then npm run verify for shared changes. Use
docs/E2E.md for this workstation's WebKit prerequisites. Distinguish launch/setup
errors from executed application failures. Report concrete reproductions and
unresolved objections; do not reinterpret a local attestation as authentication
or claim that automation supplies human clinical/accessibility approval.
