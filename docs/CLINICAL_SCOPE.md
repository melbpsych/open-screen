# Clinical and forensic screening scope

Implementation decision record, 25 October 2026. This extends the earlier research-only gate report at the user's request for a two-stage practice screener. It is not a preregistration or a validation study. Earlier protocols remain historical documents.

## Intended workflow

Australian adults, aged 18 and over, in a supervised psychology-practice sitting. The clinician chooses clinical or forensic context and the relevant domains. All selected brief screens run first. Recognised published thresholds open the corresponding longer screening questionnaire. Earlier answers from the same scale are carried forward once, with their original scores. The patient sees questions and a handoff; the clinician sees results and can request further screening below a gate when clinically indicated.

The default sitting covers depression, generalised anxiety, and trauma. Without trauma exposure and with negative mood/anxiety gates, this takes five questions. Exposure adds five PC-PTSD-5 symptoms. Alcohol is optional and requires the clinician to confirm its administration condition and choose the applicable threshold. Personality, response-pattern questions, and DASS-21 Stress are optional additions. They are not brief symptom gates, and their length is shown before beginning. Selecting forensic context does not automatically add the 30-item response-pattern module; that remains an explicit choice.

## Published rules implemented

| Domain | Stage 1 | Gate used here | Stage 2 | Clinician result |
| --- | --- | --- | --- | --- |
| Depression | PHQ-2, first two PHQ-9 items | Sum ≥2/6 | Remaining seven PHQ-9 items | PHQ-9 total 0–27; symptom bands at 5, 10, 15, 20; screen threshold ≥10. Functional difficulty is separate. |
| Generalised anxiety | GAD-2, first two GAD-7 items | Sum ≥2/6 | Remaining five GAD-7 items | GAD-7 total 0–21; symptom bands at 5, 10, 15; screen threshold ≥10. |
| Alcohol | AUDIT-C, AUDIT items 1–3 | Clinician-selected ≥3 or ≥4/12 | AUDIT items 4–10 | Full AUDIT total 0–40, brief score and chosen threshold. Source interpretation differences remain explicit. |
| Trauma | Exposure, then PC-PTSD-5 if exposure endorsed | ≥3 yes responses/5 | PCL-5, all 20 items | PC-PTSD-5 count; PCL-5 total 0–80 and source's provisional symptom-cluster rule. No invented severity bands. |

The PHQ/GAD publisher's manual recommends brief thresholds of ≥3. This application deliberately uses the later sensitivity-first ≥2 option, consistent with the project's earlier gate report. These are evidence-supported choices, not universal optimal cuts. The report distinguishes the brief gate threshold from the full-screen threshold and from a diagnosis.

- **PHQ-2 ≥2:** Levis et al. (2020), international individual-participant meta-analysis. In studies using semistructured diagnostic interviews, the brief screen's sensitivity was 0.91 and specificity 0.67. These figures do not describe this app's full two-stage pathway. [Original study](https://doi.org/10.1001/jama.2020.6504), [USPSTF evidence summary](https://www.uspreventiveservicestaskforce.org/uspstf/document/final-evidence-summary/depression-suicide-risk-adults-screening).
- **GAD-2 ≥2:** USPSTF 2023 adult evidence review reports pooled sensitivity 0.94 and specificity 0.68 in general-adult studies. The measure chiefly concerns generalised anxiety. [Primary guideline](https://www.uspreventiveservicestaskforce.org/uspstf/recommendation/anxiety-adults-screening).
- **AUDIT-C ≥3/≥4:** AIHW METEOR gives ≥3 for females and ≥4 for males. The clinician selects the rule, rather than the app inferring it from identity. That metadata is a threshold reference, not validation of this application or a forensic sample. Original response scores remain 0–4; the metadata page's sentence saying 0–5 is not used to alter the instrument. [AIHW](https://meteor.aihw.gov.au/content/741480/Print).
- **PC-PTSD-5 ≥3:** sensitivity-first decision supported by Prins et al. (2016) and Bovin et al. (2021), US veteran samples. Current VA guidance notes that ≥4 balanced errors overall and for men; ≥3 may detect more cases while adding false positives. The report keeps these population limits visible. [Original validation](https://pmc.ncbi.nlm.nih.gov/articles/PMC5023594/), [later validation](https://pmc.ncbi.nlm.nih.gov/articles/PMC7862990/), [VA scoring guidance](https://www.ptsd.va.gov/professional/assessment/screens/pc-ptsd.asp).
- **PCL-5:** VA describes a provisional total threshold in the 31–33 range and the DSM-5 symptom-cluster rule. No single local total cutoff is silently chosen, and the app does not diagnose PTSD. [VA guidance](https://www.ptsd.va.gov/professional/assessment/adult-sr/ptsd-checklist.asp).

## Wording and permissions

The Australian-English PHQ-9 and GAD-7 forms were downloaded from the publisher's selector and checked against the implementation. Their wording differs slightly from US English. Both source PDFs are included under `docs/sources/`; they are not modified. The instruction manual p. 8 states that the listed measures are public domain and permits reproduction, translation, display, and distribution. The acknowledgments remain in the questionnaire. The personality engine's `OPEN_LICENSES` list is unchanged; clinical definitions live in a separate module.

- [Publisher's instruction manual](https://www.phqscreeners.com/images/sites/g/files/g10016261/f/201412/instructions.pdf)
- [Australian-English PHQ-9 source](https://www.phqscreeners.com/images/sites/g/files/g10060481/f/201412/PHQ9_English%20for%20Australia_0.pdf)
- [Australian-English GAD-7 source](https://www.phqscreeners.com/images/sites/g/files/g10060481/f/201412/GAD7_English%20for%20Australia.pdf)
- [AUDIT administration terms](https://auditscreen.org/about/faqs): no fee for completing the questionnaire, unchanged wording, WHO attribution. The UI requires confirmation rather than silently assuming this condition.
- DASS-21 Stress remains conditional on a defined patient/research group, clinician-only scores, and not selling the scale. Its score is doubled and has no automated severity word.

## Safety and forensic use

Risk assessment and recording are optional at clinician discretion and separate from the screening workflow. An endorsed PHQ-9 item 9 is retained as a questionnaire finding; it does not pause questions or require risk documentation before finalisation. Existing observations and corrections remain in the record. Optional notes can include links to the official C-SSRS resources; the app does not administer those forms or convert interview flags into a risk score.

Clinical and forensic are context labels. This software has no Australian forensic calibration, criterion-validity study, test–retest study, or locally established likelihood estimates. It must not determine diagnosis, malingering, credibility, criminal responsibility, capacity, or offending risk. The optional IPIP response-pattern module is not a validated symptom-validity or performance-validity test. Personality frequencies come from online volunteers, not clinical norms.

## Data and handoff

Answers and clinician notes exist in JavaScript memory in the current tab. They are not sent to a backend, analytics provider, localStorage, IndexedDB, or cookies. Closing/reloading loses the sitting; copy, save, or print the record into the practice's established record system. Print output is regenerated from current notes and includes shared score charts, sources, and interpretation limits. The offline HTML report contains no scripts or remote resources. The full response appendix is included in PDF and optional in HTML/JSON; the concise summary preserves scores, overrides, recorded observations, safety status, and clinician notes. A zero PC-PTSD-5 score after no exposure explicitly records the stop rule and skipped symptom questions.

Editing a gate deactivates the full-scale score and its inactive follow-up answers. An already endorsed PHQ-9 item 9 remains a priority observation even if the depression gate closes or the domain is deselected. The full exported response appendix lists the current path's raw response codes and labels, plus any retained safety observation. It includes a generation timestamp and the rules date.

New sitting clears answers, patient reference, clinical notes, external entries, safety state, and one-off follow-up overrides. Selected topics and practice administration conditions remain; the clinician must choose the AUDIT-C threshold again for the new patient.

The patient-to-clinician transition is a physical handoff on the same device, not an authenticated access-control boundary. This is a local, supervised workflow, not a remote patient portal. Remote administration, authentication, record-system integration, cross-device handoff, and deployment are separate work. The application is implemented and technically checked; that does not establish clinical or forensic validity for the combined workflow.

## Versioned configuration (26 October 2026)

The default clinical decisions above remain unchanged. They now live in `config/policy.json`; the public factory validates and snapshots the policy and registered questionnaire definitions. Custom decisions must carry an updated version and rationale and be clinically reviewed; mathematical input validation does not establish recognized thresholds or practice-specific operating characteristics. A modified PCL item threshold is labeled as a configured pattern check rather than the published DSM-5 rule. Structured JSON preserves actual configuration and can explicitly include original responses for replay. See [CONFIGURATION.md](CONFIGURATION.md) and [SECURITY.md](SECURITY.md).

## Optional expansion · 26 October 2026

Nine additional optional measures are available: ASRS-v1.1 six-item adult ADHD, TAPS, DSS-B, Mini-IPIP, IPIP-NEO-120, and four separate complete CAT-PD-SF v1.1 trait scales (Anger, Affective Lability, Non-Planfulness and Mistrust) from the IPIP-hosted key. [MEASURES.md](MEASURES.md) is the detailed version, rights, scoring and administration record. ASRS remains an unchanged electronic form, with the original endorsement count distinguished from the alternative research sum. Its 18-item checklist is not embedded. TAPS retains US drink sizes and an explicitly selected official alcohol variant. DSS-B has no invented cutoff. Personality traits remain independent descriptive profiles, with no clinical gates, diagnosis, forensic norms or combined personality total. Missing items are not imputed.

SCI-02/SCI-8, OCI-4/OCI-R, WHODAS and WHO ASSIST remain external because the required electronic/commercial reuse permissions were not established. Official-resource links and clinician-entered results are available; the app does not administer or score these forms. Current WHO guidance directs electronic WHODAS use to licensing. No author permission request was sent or licence purchased.

## Workflow release · 29 October 2026

Engine 0.4.0 adds an independent safety disposition and recorded assessment method
and outcome before finalisation, including below-gate sittings. Deferred/declined
assessment must carry a reason and an assigned follow-up plan; it cannot bypass
review of an endorsed safety item. Forensic finals require referral, purpose,
recipient, administration conditions, collateral and limitations. These are
workflow safeguards, not evidence of clinical or forensic validity.

Administration can use manual or automatic advance. Missing answers carry explicit
reasons and remain unscored. A missing gate is not treated as a negative gate.
Monitoring collects selected full forms despite low brief scores, while retaining
published exposure and substance skip rules. Incomplete personality markers do
not prevent reporting independently complete monitoring trait forms. No mixed
instrument total, invented clinical percentile or reliable-change estimate is
introduced. Skipped trauma questions are shown as not administered rather than a
large zero-score graph; structured stop-rule metadata remains available.

Response-pattern results describe frequent agreement/disagreement, repeated
selections or variable responses, with actual counts and local rule provenance.
The term “variable” describes dispersion, not a validated inconsistency index.
Neither these flags nor IPIP scale means establish credibility or malingering.
See WORKFLOWS.md for encrypted saving, repeat monitoring and version compatibility.


## Clinical utility review · 29 October 2026

[CLINICAL_EVIDENCE_REVIEW.md](CLINICAL_EVIDENCE_REVIEW.md) separates included
measures from clinical interview/support gaps and records current primary-source
findings. Clinician-facing external-form guidance now distinguishes endorsement
from official C-SSRS triage, corrects the implication that external self-harm items
automatically transfer into this app, and removes historical research-floor
claims from clinical instructions. No item wording, score, default threshold,
record schema or engine/rules version changed in this copy/guidance correction.

C-SSRS healthcare/EHR permission and K6/K10 author permission make them candidates
for exact-form future work; neither is newly administered here. WHODAS electronic
use still requires its deployment licence. Historical mania/eating/perinatal/
cognitive card definitions are not selectable instruments in the public catalogue
and must not be described as administered screens. Forensic context remains a
documentation workflow, not predictive-risk or symptom-validity certification.


### Choice of full forms after initial screening

The browser presents initial findings and a choice before entering suggested full
forms. Clinicians may select fewer forms or request an available extension below
its automatic gate. These decisions are administration metadata, not changed
thresholds or negative full-scale findings. Brief-only results do not establish a
full questionnaire score or inherit evidence for a completed two-stage pathway.
The application records the choice and preserves known safety observations;
clinical follow-up remains an independent assessment decision. Rough on-screen
time estimates are an interface aid, not validated administration-time data.
