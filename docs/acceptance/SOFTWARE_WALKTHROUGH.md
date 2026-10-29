# Software walkthrough · 28 October 2026

This is an implementer pass with synthetic references only. It is not the
independent psychologist review in [CLINICAL_REVIEW.md](CLINICAL_REVIEW.md), and
it does not close any practice-acceptance dependency.

## Cases exercised in the browser

- Below-gate clinical sitting, reference `SYNTHETIC-LOW-001`: PHQ-2 0/6, GAD-2 0/6, trauma exposure no. Handoff hid scores. Review showed three below-gate or stop-rule results and stayed a draft.
- Exact PHQ-2 gate of 2, then PHQ-9 with item 9 endorsed and the other follow-up items 0. The sitting paused before the functional question. Continuing did not clear the safety flag. Review showed PHQ-9 3/27, minimal severity, screen threshold ≥10 not met, and functional impact.
- Closing the brief gate after that follow-up removed the PHQ-9 total and kept the item 9 flag and the retained-answer note.
- Interrupted review while questions remained warned that the record cannot be finalised. The same action on a finished path said the selected questions are complete.
- Final attestation, then a note edit: the screen returned to draft, kept the reviewer name across the safety-outcome re-render, and listed the previous final under Assessment history without drawing a change graph.

## Fixes from this pass

- Completed PHQ/GAD cards say whether the full-scale screen threshold was met, and name the severity band. They no longer use “Follow-up complete” for a finished low score.
- The safety pause says that continuing does not record the outcome and is not a clearance. Review states that finalising needs a recorded direct safety review.
- The reviewer name survives a re-render. A corrected final is listed immediately in Assessment history.
- Question progress shows the current position without promising a fixed total, since later answers can open follow-ups. Where applicable it also shows the item within its scale. The PHQ functional question says it refers to the depression items just answered and is not part of the total.
- The answer-advance hint stays visible on narrow screens. An unfinished path and a finished path get different review confirmations.

## Still required from people

- An independent registered psychologist still has to check forms, keys, thresholds, worked cases and workflow suitability. Use [CLINICAL_REVIEW.md](CLINICAL_REVIEW.md). Do not treat this file as that review.
- NVDA/Firefox, VoiceOver/Safari, and a physical phone or tablet are still untested by the people who will use them.
- SCI, OCI, WHODAS and ASSIST items stay out until rights holders grant electronic use.
- Praxi receiving, authentication and record matching are not connected.
- Hosted CI has not run. This checkout still has no remote.

Subsequent verification of the current worktree passed 116 JavaScript tests and
297 browser tests across the five configured profiles, including the reviewer
reset and question-progress regressions. See [EVIDENCE.md](EVIDENCE.md). These
automated results do not constitute the independent reviews above.
