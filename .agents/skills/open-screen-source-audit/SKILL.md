---
name: open-screen-source-audit
description: Audit a proposed Open Screen questionnaire or administration change against exact source assets, rights evidence and independently worked scoring cases. Use for instrument changes or explicit source audits, not ordinary UI edits.
---

# Open Screen source audit

Work from the Open Screen repository root. Read docs/MEASURES.md and the affected
definition/adapter. Use docs/sources/manifest.json to identify the captured asset,
date and hash; npm run check:sources verifies identity, not permission or validity.

Compare the exact version with rendered getSteps() output: item order, complete
stem/recall period, examples, anchors, original codes, reverse keys, skips, shared
items and missingness. Keep necessary context on every separate item page and
after recovery. Consult the primary source for an unresolved clinical rule; do
not substitute a similarly named form or infer permission from download access.

Calculate synthetic expected boundary cases without calling the implementation's
scoring helper to produce the expected result. Include missing responses, edited
gates and stopped branches. Existing arithmetic fixtures are in gates/clinical.test.mjs
and core/measures.test.mjs; workflow failure cases are in core/review-regressions.test.mjs.

Report the exact source/version, discrepancy, affected path, expected/observed
case, evidence limits and proposed correction. A reviewed hash or passing test
cannot close registered-psychologist acceptance, rights-holder permission or
population-validation requirements in docs/PRACTICE_READINESS.md. Apply code
changes only within the user's requested scope; preserve protected-text limits.
