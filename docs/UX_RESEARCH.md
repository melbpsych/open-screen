# Open Screen workflow research · 29 October 2026

The design direction is one assessment workspace with a minimal starting page.
Personality belongs among selectable measures, rather than being a competing
product category. The original standalone research tool can remain secondary.
The homepage baseline now implements that direction; the wider recommendations
below are proposed changes, not claims that they have already been implemented.

## Research scope and method

This pass made **23 targeted Mobbin searches**, producing **31 distinct flow
results** and **15 standalone screen results** across **39 products**. I inspected
108 distinct preview screenshots and one additional template-choice screen at
full resolution: **109 distinct screenshots**, including rejected matches.
These counts exclude the earlier two-screen homepage search. A flow result does
not mean every screen in that flow was inspected: the tool supplies sampled
keyframes, and selected frames were downloaded for closer examination. This was
visual research, not interactive testing of those products.

Web examples inform the desktop workflow. iOS examples are explicitly identified
and inform mobile presentation only. The transferable details are structure,
action placement, disclosure and status, not the reference product's brand,
medical interpretation or backend capabilities. Hims and Hers are related
products and are not independent confirmations of a pattern. Recommendations
are design judgments grounded in the pictured states, not usability-study results,
clinical evidence, security certifications or proof of accessibility conformance.

The private, ignored reference bundle is
`artifacts/design-review/mobbin-research/`: `searches.json` records queries,
results and preview positions; `selected.json` identifies 14 downloaded frames;
`research.html` is the browsable, self-contained reference board. Mobbin links
below remain the source attribution. Source images are not application assets.

## Coverage of the actual workflows

| Open Screen flow | Inspected reference and visible pattern | Recommendation and limits |
| --- | --- | --- |
| Home and new assessment | [Hims health history](https://mobbin.com/flows/09571b15-d39a-4736-921e-777a925a432a): narrow question column and one Next action; [Hers](https://mobbin.com/flows/52562384-b19e-4c09-8d42-f6ba4a040515): an explicit introduction to the next steps | Retain the minimal homepage. Avoid instrument cards, a second assessment category and a large process preview. The current layout is our choice, not a copy of either product. |
| Returning and resuming | [Uxcel continuing a lesson](https://mobbin.com/flows/caa90d5a-27ae-40c2-9fde-8ddbae7e0801): Continue leads to the current task; [Proton recovery](https://mobbin.com/flows/fe01a2cd-d7d4-4af1-b1f3-7e2f80f16ee9): a separate unlocking dialog | A quiet Resume action could open the existing encrypted-file workflow directly. Do not imply there is a server-side recent-patient list or autosaved sitting. Both examples are structural analogies outside clinical practice. |
| Templates and measure selection | [HoneyBook questionnaire creation](https://mobbin.com/flows/a672e60b-2c22-415b-8947-bf181ad5940f), frame 3: template, recent-file and blank choices; [Fresha form creation](https://mobbin.com/flows/11540a63-10b5-4fbf-ac49-a40148894cfa): step-specific fields and preview | Make the existing template chooser useful before manual selection. Replace tall measure cards with compact selectable rows and About disclosures. Do not add a questionnaire authoring environment or reuse previous patient answers. |
| Administration and clinician-to-patient handoff | [Fresha](https://mobbin.com/flows/11540a63-10b5-4fbf-ac49-a40148894cfa), frame 12: configuration is separate from a form preview; [Hims](https://mobbin.com/flows/09571b15-d39a-4736-921e-777a925a432a), frame 9: an explicit transition names the next phase | Keep permissions, form choice and forensic context on the clinician side. Begin should open a focused patient screen. A brief handover instruction can sit there without a compulsory extra welcome page. These screenshots do not establish authenticated separation. |
| Answering, moving back and missing answers | [Typeform respondent screen](https://mobbin.com/screens/f723d9fd-d12e-4a1b-8673-afb1a1af0cec): one prompt, answer and keyboard hint; [Laravel Cloud survey](https://mobbin.com/flows/50d44602-9183-47a6-8e5f-91782acd2840): narrow option list and clear continuation | Retain complete wording/timeframe/anchors, Back, the manual alternative and explicit missing reasons. Keep the advance warning before the answers. Do not copy fixed-total progress into an adaptive path, or introduce Typeform's generic free-form authoring. |
| Safety interruption | Targeted mental-health/crisis and urgent-symptom searches returned consumer support, symptom tracking and medical chat, not a suitable clinician safety-pause sequence | No direct precedent was established. Retain the clinician-supervised interruption, immediate human assessment, retained endorsement and separate review outcome. Reduce only nonessential repetition; do not derive safety decisions from a consumer app. |
| Completion and return of device | [15Five survey completion](https://mobbin.com/flows/42d0e148-da16-4bd3-9900-2c043ac4032f), frame 7: explicit next steps; [Calendly completion](https://mobbin.com/screens/96e17b8d-3c28-4482-b185-acb42546641e): a short confirmation and what happens next | Keep a neutral completion state and one instruction to return the device. Do not show scores, celebrate a clinical result, add recommendations or imply clinician sign-off. The current handoff is already close to this. |
| Clinician scores and response review | [Calendly response review](https://mobbin.com/flows/6fef5da1-aedb-4111-9a0f-846379611273), frames 3–4: a selected response opens its details; [Bevel iOS record detail](https://mobbin.com/flows/bcb74637-8d36-4b58-8e62-99e88312cb98), frames 4 and 6: summary, values and a warning beside the affected value | Show a concise result index with detail on demand. Put missingness and source/configuration qualifications beside the score they affect. Keep safety visible above any disclosure. Bevel's extracted medical values are not equivalent to validated questionnaire scores. |
| Forensic context, follow-up and finalisation | [Copy.ai action editing](https://mobbin.com/flows/88fd4b3d-f97e-4b40-b398-eca8db2bafa5), frame 5: a warning identifies the step needing attention and its editor is adjacent; [Mintlify publishing](https://mobbin.com/flows/f5e8d40a-3312-44ee-a4ad-b52ce82b412d): changes are listed before publish | Use a short review checklist with links to unmet requirements. Group safety outcome, context and attestation rather than leaving a long undirected form. No direct clinical/forensic finalisation reference was found; the required fields and local-attestation boundary remain Open Screen's own obligations. |
| Report, clipboard and structured export | [Zendesk export](https://mobbin.com/flows/8ef6fe25-8d81-47ff-9c52-4180de1f0b7e), frame 3: format options appear after Export; frame 4: export status is separate | Replace the crowded action row with one organised Save & export entry. Group by purpose: resume later, clinical report, structured data. Keep clipboard/appendix secondary and explain encryption explicitly. A download request cannot prove durable storage. |
| Encrypted saving, unlock and recovery errors | [Proton](https://mobbin.com/flows/fe01a2cd-d7d4-4af1-b1f3-7e2f80f16ee9), frame 3: named recovery method and password field; [Square import error](https://mobbin.com/screens/a5bd7016-7437-4c36-af4a-6449d1911371): a specific problem and retry action; [Browserbase replacement warning](https://mobbin.com/screens/430d4569-2ed0-4452-a943-b5bae631e6a9): what will be lost, Cancel and the replacement action | Retain unlock followed by patient confirmation. Consider a labelled show-passphrase control. Explain unsupported versions after successful decryption; keep authentication failures appropriately generic. Cancellation must retain the current sitting and pending-operation cancellation must suppress a later download. Open Screen has no account password reset or recovery service. |
| Repeat monitoring and history graphs | [Oura iOS trends](https://mobbin.com/flows/f8d12457-bbde-4038-a6a6-9c9a85a66412), frames 3–4: one metric per chart and an adjacent numeric reading; [Noom iOS trends](https://mobbin.com/flows/20f1b299-d45c-4a98-9549-81f2229cff3e): compact charts link to fuller detail | Retain separate same-form histories with dates, values and accessible tables. Consider a compact overview before expanding a series. Add range controls only when enough visits justify them. Do not copy rewards, composite health scores, automatic trend claims or smooth lines that imply unobserved measurements. |
| Threshold editing, revisions and reset | [Copy.ai](https://mobbin.com/flows/88fd4b3d-f97e-4b40-b398-eca8db2bafa5): a selected flow step exposes its settings; [Mintlify](https://mobbin.com/flows/f5e8d40a-3312-44ee-a4ad-b52ce82b412d): change list before publishing | Keep the diagram as the entry to the relevant rule. Prefer a focused native dialog or detail region to a large global form; show published reference, project default and current value. Preserve rationale, review/activation, reset, immutable rules and captured settings. Do not add a draggable workflow canvas or arbitrary scoring language. |
| Guidance, troubleshooting and help | [Graphite help](https://mobbin.com/flows/b83d88c2-fae5-4aeb-9f9d-bc8e571d6361), frame 2: task resources appear without replacing the work; [Gemini help](https://mobbin.com/flows/27e613d0-9251-4f8f-b22a-1dd7e86aaa88): separate detailed help pages | Keep the full guide, and link directly to the relevant section from save/recovery/settings contexts. A short local disclosure may answer a common question; avoid a new support sidebar, chatbot or community portal. Preserve keyboard focus and active work. |
| Next patient and future Praxi embedding | [Browserbase warning](https://mobbin.com/screens/430d4569-2ed0-4452-a943-b5bae631e6a9) shows explicit replacement consequences. None of the reviewed products demonstrates Open Screen's required Praxi transaction | Keep the existing New sitting confirmation and patient isolation. In Praxi, enter from its client assessment context and use its authenticated identity/storage. Do not build another client directory or portal. This is an architecture recommendation, not a verified receiving integration. |

## Recommended implementation order

1. **Make setup compact.** Keep one page initially: reference/context, template or
   measure selection, and Begin. Use smaller selectable measure rows, search and
   a selected-count/burden summary. Administration details stay folded until
   relevant; required permissions remain visible. This addresses the longest
   routine screen without adding a mandatory multi-page wizard. Test whether the
   order and burden summary actually help clinicians before adding more steps.
2. **Guide clinician review.** Lead with safety and a short checklist of unmet
   requirements. Each issue links to the actual field. Summarise each instrument
   in one row; expand graphs, item details and evidence when needed. Keep
   source-separated account/observation/limitations and required forensic fields.
   Use the current pure review validator as the source of requirements, avoiding
   a second set of UI-only rules.
3. **Organise saving and exports.** One entry opens explicit purposes, with the
   recoverable encrypted sitting first. Report/print, clipboard and JSON are
   different outputs, not interchangeable save methods. Preserve draft/final
   labels and appendix choices. Show operation feedback without claiming the
   downloaded file is safely stored or a real reminder has been scheduled.
4. **Improve recovery and contextual guidance.** Make Resume directly reachable
   without another primary action on home. Retain patient confirmation; improve
   passphrase visibility and task-specific help. Keep failed/cancelled operations
   reversible. Do not introduce account recovery or browser patient persistence.
5. **Refine history and rule editing.** Keep numeric integrity and existing
   provenance. Prefer compact per-form summaries with expandable charts and
   focused editors. Reuse native controls rather than adding a charting framework,
   canvas editor, general workflow builder or permanent side navigation.

The question screen and neutral handoff need smaller changes than setup and
review. A rewrite of their working navigation, published content and safety
lifecycle is not justified by these screenshots.

## What the research rules out

- Image-heavy template galleries such as [Recraft](https://mobbin.com/screens/d8e7ecc7-d868-4000-ae52-ae3e665b0a30)
  would add visual competition without helping identify a clinical measure.
- The [Perplexity health overview](https://mobbin.com/flows/76bf5ff7-5b55-48ea-a968-6c827194fb3f)
  adds feeds, chat and multiple content blocks. Its dashboard structure is not a
  suitable home for this local assessment task. Its pictured zero/missing-data
  interpretations are not scoring rules for Open Screen.
- [Visible's symptom grid](https://mobbin.com/screens/f3ae98a2-0de0-402b-9021-c67d4df2641d)
  exposes a previous-answers switch. Do not prefill a new clinical administration
  from the previous visit or change a published form into that grid.
- Noom coins, lesson rewards, confetti, countdowns and upselling do not belong in
  clinical or forensic completion states. More icons do not, by themselves,
  reduce the number of decisions on a page.
- Consumer crisis hotlines, dating-safety resources and medical chat did not
  establish a psychologist-supervised safety-interruption design. Preserve that
  explicit gap and obtain independent clinical review of any safety redesign.

## Checks for the implementation

Preserve questionnaire text/order/anchors, branching and shared-item rules;
explicit missingness; immediate and retained safety endorsement; final-review
requirements and correction history; recoverable-file integrity and patient
matching; and per-form/version history. Add E2E checks that cover the entire task,
not just the new component's existence. Exercise keyboard focus, 320px/200% text,
text spacing, short landscape, touch, reduced motion, forced colours, offline
reports and real PDFs. Human AT and physical-device acceptance remain necessary.
The visual references do not supply those checks or clinical validity evidence.

## Delivery status

The homepage and the five implementation priorities above are implemented in the
local app. Setup uses compact searchable rows, templates and a folded
Administration section. Clinician review uses actionable requirements and an
expandable result index. Saving is grouped by purpose. Recovery has a direct home
entry and a passphrase-visibility control. History expands per form; selecting a
diagram gate focuses its editor without discarding other draft edits. Contextual
guide links preserve the active sitting. Questionnaire wording, clinical rules,
permissions, patient matching and attestation requirements remain authoritative.

Actual app screenshots are in `artifacts/design-review/app-refinement/`; the
previous homepage comparison remains in `artifacts/design-review/home-minimal/`.
See DESIGN_SYSTEM.md for component conventions, E2E.md for regression coverage
and VERIFICATION.md for the actual results. The recommendations involving live
Praxi entry/storage, human usability acceptance and clinical validation remain
future work. Reference products were not copied into clinical protocols.


## Component follow-up · 29 October 2026

[COMPONENT_RESEARCH.md](COMPONENT_RESEARCH.md) records nine additional searches,
28 inspected frames from 27 products, the selected references and the shared
navigation/action/field-feedback changes. Healthcare matches were insufficient
for a direct clinical component precedent. Nonclinical references supply visual
structure; [CLINICAL_EVIDENCE_REVIEW.md](CLINICAL_EVIDENCE_REVIEW.md) separately
records the primary clinical sources, licensing findings and clinical-use gaps.
