# Protocol: adaptive clinical gates for Open Screen

Written before any operating characteristic was extracted and before any item-level result was inspected for this pass. The report that follows this file is the only place where published sensitivities, specificities, cuts, samples, and base rates are recorded. Departures from this protocol are listed in that report. Nothing in this pass is registered as a measure, and nothing is added to the running questionnaire.

Date locked: 2026-10-23.

## Question

A psychologist arms a set of topics. The running questionnaire should ask the minimum number of items. For each armed topic there is a gate. Only if that gate meets a threshold are the split items asked, and those split items name the specific problem. Only if the split names a problem is the intact official screener for that problem administered. The score written in the record is the official instrument’s published score. Gate items are not summed into a homemade scale.

The personality screen already picked one public-domain sentence per construct, pre-registered the rule, and interpreted each answer against empirical frequencies. This pass keeps that discipline and changes the objective. The criterion here is detection of a clinical problem. It is not a factor loading, and it is not the determinant of a personality covariance matrix.

## What this pass does not do

- It does not implement branching, edit `measures/registry.js`, retune `measures/personality-5.json`, or change percentiles.
- It does not add a value to `OPEN_LICENSES` in `core/score.js`. The whitelist stays `public-domain`, `CC0`, `CC-BY-4.0`, `MIT`, `BSD-2-Clause`, `BSD-3-Clause`, `Apache-2.0`, and `ISC`.
- It does not invent items. It does not set a clinical threshold from a volunteer percentile.
- It does not use the Open-Source Psychometrics IPIP file to choose or norm these gates. That file has no clinical criterion.
- It does not route any personality item into a symptom module. “I get stressed out easily” (EST1) is a trait marker in a volunteer sample. It is not a distress gate. Disagreeing with it is high emotional stability on that sentence. It does not clear, and does not open, depression, anxiety, panic, irritability, or trauma.
- It does not paste copyrighted wording into a file marked public domain. A draft JSON, if any is written, lives outside `measures/` and outside `dist/`, and every item in it is already on the whitelist above. Instruments that fail that test are cited, not drafted.

## Population

Australian adults, 18 years and over, seen in clinical and forensic psychology practice.

Prefer operating characteristics from Australian adults. If the study is from another country, the report names the country and states what may not transport: base rate, care setting (primary care, specialty, veteran, emergency, justice, compensation), language, and whether the criterion was a diagnosis, hazardous use, or a positive score on a longer scale.

There is no child item set, no adolescent item set, and no Aboriginal and Torres Strait Islander item set in this pass. Instruments built for those groups (including KICA, Here and Now Aboriginal Assessment, and the Growth and Empowerment Measure) are out of scope as items. They may be named only as an external-test slot.

## Topics

Default on. Each of these is armed on its own. A negative result on one does not turn another off, and a positive result on one does not stand in for another.

1. Suicide. A direct question. Any positive response opens the Columbia-Suicide Severity Rating Scale screener. The current healthcare form is followed and is not reworded. The form is cited. It is not pasted under a public-domain flag.
2. Harm to a specified person. Any positive response opens questions on target, means, recency, and intoxication. There is no validated free scale for this branch. The output is local flags, labeled unvalidated.
3. Current emergency: a weapon or stockpiled medicine; alcohol or benzodiazepine withdrawal; opioid overdose risk.
4. Non-specific distress, which may split into depression, generalised anxiety, panic, irritability or tension, and a trauma cue.
5. Alcohol, using AUDIT items. An Australian standard drink is 10 g of ethanol. The six-drink item is not rewritten to the NHMRC four-drink guideline.
6. Other substances, one class at a time, using the ASSIST structure. ASSIST wording is not pasted unless a WHO permission already held is found and quoted. The logic is specified by item number.
7. Trauma exposure, then the PC-PTSD-5, then the PCL-5 only if the PC-PTSD-5 cut is met. Both checklists are kept verbatim.

Armed only when the psychologist selects them:

- Mania.
- Psychosis.
- Eating disorders.
- Gambling.
- Sleep.
- Somatic symptoms.
- Adult ADHD, and only the ASRS v1.1 six-item screener, unmodified.
- Delirium and cognitive decline.
- Intimate-partner violence as victim, and intimate-partner violence as perpetrator. These are two branches.
- Perinatal mood.
- Personality, which remains the existing five-item screen. The only permitted extension is the public-domain IPIP 10-item markers for a trait whose single item is extreme. That extension is not a diagnosis and is not a personality-disorder screen.

Out of scope for items. The record has an external-test slot, not item text:

Competency, mental state at the offence, parenting capacity, fitness for duty, malingering, effort, psychopathy, sexual-offence risk, HCR-20, Static-99R, RSVP, MoCA, MMSE, and the Indigenous assessments named above.

A violence-risk fact list may be specified for interview follow-up. It is labeled as facts. It is not a score, and the facts are not added up.

## Selection rule

For each topic, find published single-item gates and published two-item gates. From each candidate extract:

- sensitivity
- specificity
- the cut-point, in the instrument’s own units
- the sample (N, age range, setting)
- the country
- the base rate of the criterion in that sample
- the criterion: a diagnosis, hazardous use, or a positive result on the longer scale

A gate is acceptable when sensitivity meets a floor.

- The floor is 0.90 for suicide, for harm to a specified person, and for the substance-emergency items (weapon or stockpiled medicine, alcohol or benzodiazepine withdrawal, opioid overdose risk), where a published sensitivity exists.
- The floor is 0.80 for symptom gates and for substance-use gates.

Among candidates that meet the floor, choose the one that triggers the fewest extra items. “Fewest extra items” counts the split items plus the official instrument that would then be administered, minus any official items that the rule below carries forward instead of repeating. A one-item gate that opens a 9-item scale beats a two-item gate that opens the same 9-item scale. A one-item gate that fails the floor does not beat a two-item gate that meets it.

If no single item meets the floor, the gate is the smallest published set that does. The sets named in advance as the usual minima, to be confirmed against the papers rather than assumed, are:

- PHQ-2 for depression
- GAD-2 for generalised anxiety
- AUDIT-C for alcohol
- the five PC-PTSD-5 symptom items, after the exposure item, for trauma
- all six ASRS v1.1 screener items for adult ADHD

If a paper shows that one of those sets also misses the floor, the report says so and stops at the next intact published instrument, or at a flag if no shippable instrument exists. The floor is not relaxed to make a shorter gate fit.

Specificity is reported. It does not break a tie ahead of the item-count rule. A large loss of specificity is stated, because the psychologist has to read the false positives. It does not override the sensitivity floor.

When no published sensitivity exists, the report says that no figure exists. It does not impute one. For a safety topic with no published figure, the threshold kind is any-yes, because of the loss stated below. For a non-safety topic with no published figure and no shippable instrument, the product stops at a flag.

## Thresholds

Three kinds only. The report names which one applies to each branch.

1. **any-yes.** Used for safety branches, and for low-base-rate branches such as psychosis and partner violence. Any response other than a clear no fires the next step.
2. **published-cut.** Used once the official instrument is in use. The cut is the one printed with that instrument, or the one the instrument’s own manual or primary paper specifies. Bands from a different instrument are not borrowed.
3. **sensitivity-floor cut.** A cut taken from a cited study because that cut is the one at which the gate met the floor above. The sample is described in the same sentence as the cut. A cut from a volunteer percentile is never this kind.

## Loss

Missing a safety problem costs more than asking one extra module. Safety problems in this protocol are suicide, harm to a specified person, a weapon or stockpiled medicine, alcohol or benzodiazepine withdrawal, and opioid overdose risk. That loss is why those branches use the 0.90 floor where a figure exists, and any-yes where it does not. A shorter questionnaire is not a reason to drop one of them when the distress gate is negative.

## Branch logic that is fixed before the search

These rules are design constraints. They are not results.

- Suicide stays armed even when the distress gate is negative. If the PHQ-9 is reached, item 9 still opens the suicide module, whatever the earlier suicide answer was.
- Alcohol stops at the full AUDIT. A second alcohol scale is not added.
- A negative answer on the PC-PTSD-5 exposure item scores zero on that screen and asks nothing further in the trauma branch. PCL-5 items are not the same sentences as PC-PTSD-5 items, so a PCL-5 item is not skipped as a duplicate of a PC-PTSD-5 item.
- DASS-21, if it is used at all, follows the UNSW FAQ: a defined patient group, scores to the clinician, no automated interpretation to the respondent, and the scale is not sold. The report checks whether one subscale may be given alone. The answer comes from the FAQ or the manual. It is not assumed.
- Time stems stay attached to their instruments. A “past two weeks” stem is not moved onto an item that was validated with a different window, and a lifetime stem is not shortened.
- Forensic context uses the same gates as clinical context, plus a written warning that sensitivity estimated in primary care will not match compensation, custody, or criminal samples. No self-report validity scale is added.

## What the report must contain for each branch

One row per branch, with these fields:

| Field | Content |
| --- | --- |
| Topic | The branch name |
| Default | On, or off until selected |
| Gate | The item or the minimum set, with the citation |
| Licence | The holder’s status, not a whitelist value invented for this pass |
| Fires when | The response that opens the split |
| Split | The items that name the specific problem |
| Split rule | How a split answer opens the official instrument |
| Official instrument | The intact scale whose published score is stored |
| Carried forward | Items already answered that count toward the official score and are not asked again |
| Stop | When questioning on this branch ends |
| Score shown | What the psychologist sees |
| Sentence with the score | The limit that must be printed beside that score |

The short report also states, for each topic, the gate recommended, the alternative rejected, the operating characteristics with citations, the threshold kind, and the official instrument.

## Licence procedure

For every item recommended for shipping, the report quotes the rights holder’s statement and gives the URL. Allowed whitelist values today are only those in `OPEN_LICENSES`. The following distinctions are locked now, before wording is copied anywhere:

- DASS is described by its owners as public domain. The FAQ conditions on who may receive scores still apply, and they are checked rather than waived.
- AUDIT is described as a WHO public-domain instrument for non-commercial use. The report quotes the statement that was found. The six-drink wording stays.
- PC-PTSD-5 and PCL-5 are US National Center for PTSD public-domain measures. They stay verbatim.
- PHQ-9 and GAD-7 say no permission is required to reproduce them. That statement is not public domain. They are not marked `public-domain`. If a later pass drafts them into JSON, that pass proposes a separate licence value and the exact condition, and leaves the whitelist unchanged until the proposal is accepted. This pass does not add the value.
- K10 and the Columbia screener are usable and copyrighted. They are cited. They are not pasted under a public-domain flag.
- ASSIST wording is not pasted unless WHO permission is already held and quoted.
- ASRS v1.1, if ADHD is armed, is the six-item screener only, unmodified. Its licence is quoted. It is not marked public domain on the strength of being free to use.

## Personality extension, specified so it cannot become a diagnosis

The five items already chosen stay: EXT7, EST1, AGR1, CSN6, OPN8. Categories stay Low below the 35th mid-rank, High above the 65th, Middle otherwise, on the volunteer counts already stored. This pass does not recompute them.

The only extension is: if one of those five scored answers is extreme, the public-domain IPIP 10-item marker set for that same trait may be offered. Extreme means the existing Low or High category on that one item, not a new cut. The 10-item score is reported as an IPIP marker score against the IPIP key. The sentence printed with it states that it is not a diagnosis and not a personality-disorder screen. No clinical threshold is taken from the Open-Source Psychometrics file.

## Decision procedure for the search, in order

1. This file is saved before any extraction.
2. For each topic, search for published single-item and two-item gates in adults, preferring Australian samples.
3. Extract the fields in the selection rule. Do not fill a missing sensitivity with a value from a different country, a different criterion, or a youth sample.
4. Apply the floor, then the fewest-extra-items rule.
5. Name the threshold kind.
6. Record the licence quote and URL for anything recommended to ship.
7. If the honest result is that no single item is defensible, say so and name the minimum published set.
8. If the honest result is that nothing shippable exists, the product stops at a flag. The flag is labeled unvalidated when the questions are local.

## What would count as a departure

- Choosing a gate that misses the sensitivity floor because it is shorter or more specific.
- Using a volunteer percentile, a factor loading, or the personality covariance determinant as a clinical cut.
- Treating EST1 as the distress gate.
- Inferring suicide, violence, or a substance emergency from another gate.
- Rewriting AUDIT item wording to the NHMRC four-drink guideline.
- Adding a second alcohol scale after the full AUDIT.
- Scoring a negative trauma-exposure answer as anything other than zero, or asking further trauma items after it.
- Skipping a PCL-5 item as a duplicate of a PC-PTSD-5 item.
- Giving a DASS subscale alone without the FAQ or the manual allowing it.
- Marking PHQ, GAD, K10, C-SSRS, ASRS, or ASSIST as public domain.
- Adding a licence to `OPEN_LICENSES`, or registering a measure, in this pass.
- Pasting copyrighted item text into the repository.
- Adding a self-report validity scale for forensic use.
- Writing new items.

## Data required before a cut could be estimated here

A cut is taken from a paper in this pass. It is not estimated from a local file. The report lists, after the search, the topics for which a future estimate would be needed because no published cut met the rule. Estimating one would require, at minimum: an Australian adult clinical or forensic sample, a pre-declared criterion (diagnosis, hazardous use, or the longer scale), the base rate, item-level responses on the candidate gate and on the criterion measured independently, and a pre-declared sensitivity floor of 0.90 or 0.80 as above. The Open-Source Psychometrics IPIP file does not satisfy that requirement.

## Outputs of this pass

1. This protocol.
2. A short report with the gate, the rejected alternative, the operating characteristics, the threshold kind, and the official instrument.
3. The decision table.
4. Topics where a single item is not defensible, and the minimum set instead.
5. Topics with no shippable instrument, where the product stops at a flag.
6. Data that would be needed before a cut-point could be estimated rather than taken from a paper.
