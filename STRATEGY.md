# How the next screens get built

This is the rule for adding a domain to Open Screen. The five-factor personality screen stays as it is: five separate categories, no total. Symptom screens are a different job. They answer whether a domain needs a longer look, and what a published scale says if that look is taken.

The patient form starts at about 20 to 30 items. A domain opens further items only when its own gate is crossed. The psychologist sees the result. The patient does not get a diagnosis, a risk percentage, or a single combined score.

No topic list was written down before this note. The slate at the end is the one to start from. Cut it or add to it before any items are scored in.

## What a result is allowed to say

Three kinds of statement are allowed.

1. The gate opened or it did not, by the rule stored for that domain.
2. If a full published scale was then given, the score and the band that scale's own paper uses (mild, moderate, and so on).
3. Where a paper reports sensitivity and specificity for that exact scale and cutoff, those figures can be quoted as facts about the test. They are not the person's chance of having the disorder.

A new item, or a shortened scale without its own study, can only say "ask the rest of the questions." It cannot say how likely a disorder is.

Suicidal thinking is a flag, not a probability. Any non-zero answer on a suicide gate opens the rest of the safety questions and is marked for the clinician. It is not turned into a risk score. Offence-specific risk tools are out of scope. Instruments such as the Static-99R are not open, and a homemade item set would pretend to estimate a risk it cannot estimate.

## Two stages

**Stage 1, the gate.** The clinician chooses the domains. The default is every domain that has a shippable instrument. The patient answers only those gates. Most domains contribute one or two items. The form should land around 20 to 30 questions.

**Stage 2, the module.** When a gate crosses its stored rule, that domain's follow-up scale is added before the form ends. The patient still sees no score.

The handoff stays on the devices. The current app stores nothing. A later version can hide results on the patient route and let the clinician rescore the same answers locally. No upload.

A gate rule is not "3 or higher on a 1-to-5 scale" for every topic. Each instrument keeps the response scale and the cutoff it was validated with. A PHQ item is 0 to 3. An IPIP sentence is 1 to 5. Changing the scale to make the app look uniform would throw away the cutoff.

Where the validated follow-up is longer than five items, the module is that full scale. Cutting the PTSD Checklist down to four sentences so it matches a preferred length would leave the published cutoff behind.

## Evidence, before any wording is added

Every domain is graded before items are chosen. The grade is stored on the measure.

| Grade | What we have | What we may claim |
| --- | --- | --- |
| A | Wording we can ship, plus item-level response data we can reanalyze | A gate chosen by a protocol written in advance, and categories computed from that file. Clinical bands only if the file is the right population. A volunteer web sample does not become a clinic norm. |
| B | A published scale we can ship, with a published cutoff, and no item file of our own | The scale, unchanged, scored by its manual. We do not pick a "better" cutoff from a different sample. |
| C | Free for a clinician to use with patients, but not cleared for an open app that redistributes the wording | Not shipped. Named as the follow-up test the psychologist might give outside the app. |
| D | Nothing we can ship | Provisional sentences, written for this app, labeled unvalidated on every screen. The only threshold is "ask more." No likelihood. |

The personality screen was Grade A. Most symptom scales will be Grade B. Grade D is allowed, and it has to look different in the result so a clinician cannot mistake it for a validated scale.

## The pass for one domain

Do these in order. Stop when a step fails.

1. Write the decision the screen may support. Usually: open the module, or not, and if it opens, report that scale's band.
2. Find the instrument clinicians already use for that decision, and read its licence. Public domain and "no permission required to reproduce, translate, display, or distribute" can go in the app. "May not be modified" means the wording and the scoring key stay intact. "Not for an app the public can open" means the patient route must hide the result, or the scale stays out.
3. Look for item-level data large enough to repeat the five-factor method. If it exists, write the selection rules before looking at which item wins. Own-factor discrimination, base rate, and a gate that is not so common that almost everyone passes it.
4. If the data do not exist, adopt the published ultra-brief as the gate and the published scale as the module. Examples already designed this way: the PHQ-2 before the PHQ-9, the GAD-2 before the GAD-7, the AUDIT-C before the full AUDIT, the PC-PTSD-5 before the PCL-5.
5. Record, in the measure file, the licence, the cutoff, the paper, the sample that paper used, and the sentence the result must not say.
6. If nothing can be shipped, write provisional items only after the above is documented, and mark the domain Grade D.

A published cutoff belongs to the scale it was published for. A four-item extract does not inherit the PHQ-9 bands, the PCL-5 total, or the DASS severity labels.

## Licences that change the build

Checked against the holders' own pages, not against blog summaries.

- **IPIP**, including the IPIP-NEO facets and the IPIP representation of the CAT-PD personality-disorder traits. Public domain. The Eugene-Springfield community sample of IPIP items is CC0. This is the other file that can support a five-factor-style analysis. Those items measure traits. A high anger score is not a diagnosis of an anger disorder.
- **PHQ-2, PHQ-9, GAD-2, GAD-7.** The screeners' own terms exempt them from Pfizer's usual copyright and say no permission is required to reproduce, translate, display, or distribute. Ship them with the citation. Do not rewrite the items. Do not invent new bands. The PHQ-9 total uses 5, 10, 15, and 20. Item 9, on self-harm, is a flag at any score above zero.
- **PC-PTSD-5 and PCL-5.** Public domain, National Center for PTSD, intended for qualified professionals. The PC-PTSD-5 is the gate. The PCL-5 is 20 items. That length stands. Cutoffs differ by sample (3 versus 4 on the PC-PTSD-5; a provisional total around 31 to 33 on the PCL-5). The measure file names the paper whose population is closest to the clinic. The numbers are not averaged.
- **DASS and DASS-21.** Public domain. Forms may be copied without restriction. They may not be modified or sold. An app may administer them only to a defined group of patients or research participants, and only if the result goes to the clinician rather than the respondent. So the DASS is allowed in this handoff, whole, with the patient route hiding the score. It is not a source of homemade shorter items. Open-Source Psychometrics has released a DASS response file of about 39,775 people. That file can be used to study the items. It cannot replace the published severity labels, and it is not a clinic norm.
- **AUDIT.** World Health Organization instrument, widely used without a fee. Confirm the current WHO terms before the wording is copied into the app. Sex-specific AUDIT-C cutoffs disagree across papers. Store the paper, do not pretend there is one universal number.
- **DAST-10.** Copyrighted. Non-commercial use with attribution, items unchanged. It can be a module under those limits. It is not raw material for new sentences.
- **PROMIS.** Copyrighted. Free for a single clinical or research use. Not cleared for redistribution inside an open app. Grade C.
- **DSM-5-TR Level 1 cross-cutting measure.** The closest published picture of this product: 23 items, 13 domains, past two weeks, and a threshold that opens a longer measure. Mild or greater for most domains. Slight or greater for substance use, psychosis, and suicidal ideation. Copyright the American Psychiatric Association. Clinicians may reproduce it for use with their patients. That grant is not the same as putting the wording in a public code repository. Use the structure. Do not copy the items in until the software case is confirmed. Several of its recommended follow-up tests (Columbia suicide screen, Altman mania scale, and others) are not open.
- **ASRS, MDQ, Static-99R, and similar.** Not shipped.

The app's licence list has to grow by one explicit class, `free-to-reproduce`, for the PHQ and GAD family, with attribution required. Proprietary wording stays refused.

## What the psychologist sees

One row per selected domain, not a stack of repeated questions.

- Gate closed: the category is "not opened," and there is no module score.
- Gate opened, module finished: the scale's own band, the raw total if the manual uses one, and one sentence on what that band means in the cited paper.
- Grade D: the word "provisional" on the row, and no band that sounds clinical.
- Suicide gate: a flag, listed first, with no percentage.

There is still no total across domains. Depression being high does not move the alcohol row.

The chart can be the same histogram idea as the personality screen only when every domain shares a scale. These will not. A row with a band and a "module given / not given" mark is the honest picture. Personality remains the five-cluster histogram it already is.

## Order of work

1. Confirm or edit the slate below.
2. Extend the measure file so a domain has gates, a rule, and a module. Do not build that until the slate is agreed.
3. Add the Grade B scales that are already gates-plus-modules: depression (PHQ-2 then PHQ-9), anxiety (GAD-2 then GAD-7), trauma (PC-PTSD-5 then PCL-5). Scoring follows the papers. No new item analysis.
4. Check WHO terms, then alcohol (AUDIT-C then AUDIT) the same way. DAST-10 after that, items unchanged.
5. The first analysis in the five-factor style is the IPIP anger, depression, and anxiety facets in the Eugene-Springfield file, and a documented pass over the open DASS file that does not rewrite the DASS. Those gates, if they earn a place, are trait or symptom standings from that file. They do not replace the PHQ, GAD, or DASS bands.
6. Grade D domains last, each with a short memo in the measure file.

## Slate to confirm

| Domain | Gate | Module | Grade | Note |
| --- | --- | --- | --- | --- |
| Depression | PHQ-2 | Rest of the PHQ-9 | B | Item 9 flags self-harm at any score above zero |
| Anxiety | GAD-2 | Rest of the GAD-7 | B | |
| Trauma | PC-PTSD-5 | PCL-5, all 20 items | B | Module is long on purpose |
| Alcohol | AUDIT-C | Rest of the AUDIT | B, after the WHO check | Record which sex-specific cutoff |
| Other drugs | A single published DAST opening, if the terms allow one item first | DAST-10, unchanged | B, with the Skinner terms | Otherwise the whole DAST-10 is optional, not gated |
| Anger | One IPIP anger sentence, chosen in advance of seeing the winner | Three or four other IPIP anger sentences | A, once the Eugene-Springfield pass is done | A trait standing, not a disorder |
| Low mood and worry as traits | IPIP depression and anxiety facets, same method | Short IPIP sets | A, same file | Does not replace the PHQ-9 or GAD-7 |
| Stress, depression, anxiety as the DASS | None until the whole scale is wanted | DASS-21, unmodified | B, clinician sees the result, patient does not | Do not carve a new short form out of it |
| Personality | The five-factor screen already built | IPIP facets only if a later analysis earns them | A, done | Not a symptom screen |
| Suicidal ideation | The self-harm item inside the PHQ-9 | No homemade risk scale | B as a flag | Not a likelihood |
| Mania, psychosis, attention, offence risk | — | — | C or out of scope | Name the outside test. Do not write a substitute and call it validated |

Sleep, somatic symptoms, dissociation, and memory can be added later on the same pass. They are not in the first default form, or the gate would grow past the 20-to-30 target before the main domains are in.
