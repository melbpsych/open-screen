# Open Screen repository guidance

This is a supervised local adult screening workflow with a deterministic engine.
Clinical acceptance requirements are in docs/PRACTICE_READINESS.md. Use synthetic
fixtures only; never commit clinical exports or enter real patient data in tools.

## Code review rules

- The default job is choose measures, complete them and copy results into existing
  clinical notes. Keep case documentation, formal attestation, history and technical
  exports secondary. Avoid repeated status widgets, charts and explanatory copy;
  keep actual safety findings and missing-result information visible.
- Risk and clinical documentation are optional at clinician discretion. Do not
  reinstate automatic safety pauses, mandatory risk fields, documentation
  checklists or safety-based finalisation gates. Preserve recorded findings and
  historical notes without interpreting them as clearance or requiring extra forms.
- Changes to published wording, anchors, recall periods, skips or calculations need
  exact source/version evidence and independently calculated boundary cases. Keep
  the original form intact; automated tests do not supply clinical approval or rights.
- Safety observations, review freshness and draft/final status must agree across
  UI, API, summary, HTML, JSON and full text. Verify recovered final assessments
  before synchronous reporting; unsigned edits must never inherit a Final label.
- Resume, history, reset and revision changes must preserve captured configuration,
  patient identity and a complete encrypted recovery route. Validate proposed state
  before replacing active work; never silently drop history to satisfy a size limit.

## Verification

Run npm run check for config, source hashes, types, unit/HTTP/Python checks and an
offline installed-package smoke test. Run affected browser cases during iteration;
shared UI/workflow changes need npm run verify. Workstation-specific WebKit setup
is documented in docs/E2E.md; do not count browser launch failures as app results.
Keep human clinical/accessibility acceptance and receiving-system verification open
until actual evidence is supplied. Do not change thresholds merely to satisfy a test.
