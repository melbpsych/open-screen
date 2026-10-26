# Independent clinical verification

Status: **not performed**. Automated scoring tests are development evidence only.
The reviewer should be a registered psychologist independent of implementation,
with experience in the intended adult clinical/forensic population. Use synthetic
cases, never identifiable clinical material in this repository.

Record release commit, engine/rules versions, default or customised policy,
questionnaire versions and source hashes from docs/sources/manifest.json. A
second reviewer should check discrepancies before the practice adopts the tool.

## Source/form audit

For every enabled instrument, compare the rendered screen and report with the
original source in docs/MEASURES.md and the source manifest. Check item order,
wording, timeframe, anchors, response codes, reverse keys, shared brief items,
skips, missingness, functional-impact question, sums/means and interpretation.
Verify that licence attribution and administration restrictions are visible in
both app and exported reports. Confirm that a gate is supported for the intended
population; a recognised instrument does not validate the combined pathway.

Cover PHQ-2/9, GAD-2/7, PC-PTSD-5/PCL-5, AUDIT-C/AUDIT, original IPIP markers and
extensions, IPIP response patterns, DASS Stress, ASRS-v1.1 six-item form, both US
TAPS forms, DSS-B, Mini-IPIP, IPIP-NEO-120 domains/facets and all four CAT-PD
scales. Optional measures remain optional. No profile total or clinical IPIP
cutoff should appear. No ASRS-18/5 or permission-pending items should appear.

## Worked cases

Give the reviewer the cases below without the implementation's outputs. Ask them
to calculate the expected result from the official sources, then enter the cases
through the UI and compare structured, summary, HTML and printed results. Include
all boundary and adverse paths, not only minimum/maximum totals.

1. PHQ-2 [1,0] then [1,1]: below default gate, then exact gate. The brief answers
   must carry once into PHQ-9. Repeat with a practice gate of 3 and verify the
   saved configuration documents the deviation and reviewer.
2. GAD-2 [1,0] then [1,1], remaining items all 0; verify full total and original
   anchors. Check every published severity boundary and threshold-1/threshold.
3. PHQ item 9 = 1 with all other items 0, opened via clinician override. Pause
   immediately. Acknowledge, edit a brief answer below gate, then resume from an
   encrypted file: the safety flag persists; finalisation requires recorded
   direct safety review. Acknowledgement must not be described as clearance.
4. Trauma exposure no: no symptom questions and no PCL score. Exposure yes with
   2 then 3 PC endorsements: exact default gate. PCL item-endorsement boundary
   and each cluster rule; missing item; exposure changed after a full response
   set. Retained answers must not create a current full score on a closed path.
5. AUDIT-C gate 3 vs 4 chosen explicitly; score 2/3/4; original final harm-item
   0/2/4 codes; no-fee restriction; no identity-inferred threshold. Verify the
   Australian drink explanation and that TAPS uses its original US drink form.
6. ASRS original six-item endorsement count 3 then 4, testing each item's own
   anchor boundary. Verify a case where count 4 coexists with research total
   13/24. Original endorsement count and alternative research total are distinct.
7. TAPS both forms: never-use class skips, tobacco/alcohol follow-up, each drug
   class, single/no frequent-use branches, missing follow-up, edited brief
   responses and retained stale answers. Verify each class's published rules;
   other drugs and the overall instrument must not gain invented numeric totals.
8. DSS-B all 0, all 4 and one missing: 0/32, 32/32, incomplete respectively; no
   unsupported diagnostic threshold. Confirm the exact source timeframe.
9. Mini-IPIP all lowest responses then a mixed reverse-key pattern; each of five
   4-item traits separately. Repeat for all 120 NEO items and every 4-item facet;
   independently check official key/order and item 58 wording decision. No
   population percentiles or personality disorder diagnoses are implied.
10. CAT-PD each complete six-item scale and mixed key patterns; original true
    anchors; separate raw traits. DASS Stress raw vs doubled; original IPIP
    marker included once in its extension; response patterns remain descriptive.
11. Invalid numeric/string codes, missing answers, unexpected fields and
    incompatible saved engine/configuration. Each must fail visibly rather than
    produce a plausible score or silently use defaults.
12. Finalise, edit notes/responses, inspect previous final version in encrypted
    history, compare brief/full and changed-policy cases. Verify dates, source
    versions, clinician attestation and draft labels in every output.

Review source-specific limits and thresholds in gates/PROTOCOL.md and
questionnaire definitions. The app's customisable options are not a recommendation
to alter a validated rule. Locked algorithms must remain locked.

## Practice scenario review

Walk through in-session tablet handoff; interrupted sitting with clinician present;
wrong patient file; passphrase failure/loss; patient changing an answer; clinician
opening a below-gate follow-up; finalising and correcting a report; next patient;
Praxi client/session switch and uncertain save receipt. Assess workload, wording,
consent, privacy, escalation and whether remote unsupervised administration would
be inappropriate. The standalone app has no remote monitoring or alert service.

## Evidence record

Copy this form into approved practice governance storage, not a public repository:
reviewer name/registration; role/independence; date; commit/engine/rules/config;
source versions/hashes; cases and expected/observed results; discrepancies and
clinical severity; correction/retest; population/setting limits; acceptance
conditions; signature and approval authority. A blank form is not approval.
