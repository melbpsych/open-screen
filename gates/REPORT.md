# Adaptive clinical gates: report

The protocol in `PROTOCOL.md` was saved before any operating characteristic was extracted. Nothing in this pass was computed from a local data file. The Open-Source Psychometrics IPIP file was not used. No measure was added to `measures/registry.js`. `OPEN_LICENSES` was not changed. No branching questionnaire was built. No JSON of items was drafted.

The personality screen is untouched. “I get stressed out easily” remains a volunteer trait marker. It is not a distress gate, and a low stability category on it does not open or close any module below.

Population for every recommendation: Australian adults, 18 and over, in clinical and forensic psychology practice. Where the study is from another country, the country is named and the transport limit is stated. There is no child, adolescent, or Aboriginal and Torres Strait Islander item set here.

## Loss, and how a gate was chosen

Missing suicide, harm to a specified person, a weapon or stockpiled medicine, alcohol or benzodiazepine withdrawal, or opioid overdose costs more than asking one extra module. Those branches stay armed when the distress gate is negative.

A gate was accepted only when published sensitivity met 0.90 for the safety branches, where a figure exists, or 0.80 for symptom and substance branches. Among gates that met the floor, the one that adds the fewest later items was kept. A single item that missed the floor was not kept just because it is short. If no single item met the floor, the smallest published set that did was taken. If that set also missed the floor, the report says so. Three threshold kinds are used: any-yes, the published cut of the official instrument, and a sensitivity-floor cut from a cited study. A volunteer percentile is never a cut.

Specificity is reported. It does not override the floor.

## Licence quotes

Whitelist values today remain `public-domain`, `CC0`, `CC-BY-4.0`, `MIT`, `BSD-2-Clause`, `BSD-3-Clause`, `Apache-2.0`, and `ISC`. Nothing below was given one of those labels unless the rights holder said so.

**PHQ and GAD-7.** Pfizer’s screen site says: “All PHQ, GAD-7 screeners and translations are downloadable from this website and no permission is required to reproduce, translate, display or distribute them.” The PHQ-8 form on that site says: “No permission required to reproduce, translate, display or distribute.” URL: https://www.phqscreeners.com/select-screener and the form notice at https://www.phqscreeners.com/images/sites/g/files/g10060481/f/201412/PHQ-8_English-Canada.pdf. That is not public domain. Proposed licence value, not added to the whitelist: `no-permission-required`. Condition: the notice above is present, the wording and the response metric are not changed, and the value is only for PHQ and GAD-7 materials that carry the notice. Until that value is accepted, these instruments are cited and are not drafted into JSON.

**K10.** Materials circulated with the National Comorbidity Survey carry: “© Ronald C. Kessler, PhD. All rights reserved.” and direct reproduction requests to Professor Ronald Kessler, Department of Health Care Policy, Harvard Medical School. The K10 is usable and copyrighted. It is not pasted here. URL of a reproduction of that notice: https://www.researchgate.net/publication/379698896 (the notice is on the scale, not a grant of rights by this report).

**Columbia screener.** The Columbia Lighthouse Project says: “You do not need special permission from us to take the Columbia Protocol tools and use them in your setting, create your own unique triage next steps, or embed the Columbia Protocol in your electronic health record keeping systems (EHR).” URL: https://cssrs.columbia.edu/the-columbia-scale-c-ssrs/cssrs-for-communities-and-healthcare/. The forms remain copyrighted. Versions in circulation are marked © The Research Foundation for Mental Hygiene, Inc., or © The Columbia Lighthouse Project. The current healthcare form is followed and is not reworded. It is not pasted and it is not marked public domain.

**AUDIT.** The site maintained for the AUDIT says: “Yes. As a World Health Organization (WHO)-approved instrument, the AUDIT is in the public domain.” and “No permission is needed for the use of the AUDIT questionnaire for any non-commercial purpose. This means that someone who is completing the questionnaire should not be charged a fee. The AUDIT questionnaire can also be used and reproduced for administration and publication by any organisation … as long as it is not materially changed and that there is a note that it is a WHO-approved instrument.” URL: https://auditscreen.org/about/faqs. WHO’s general permissions page does not, by itself, put every WHO publication in the public domain (https://www.who.int/about/policies/publishing/permissions). The condition used here is the one on auditscreen.org: non-commercial, not materially changed, identified as a WHO-approved instrument. The six-drink item is not rewritten. A draft JSON was not written in this pass, so the wording cannot drift.

**ASSIST.** The 2010 WHO manual is the source for the structure (Humeniuk et al.; https://iris.who.int/handle/10665/44320). No WHO statement was found that already grants permission to paste the wording. The wording is not pasted. Logic is by item number.

**PC-PTSD-5 and PCL-5.** The National Center for PTSD says of each: “This measure was developed by staff at VA's National Center for PTSD and is in the public domain and not copyrighted. In accordance with the American Psychological Association's ethical guidelines, this instrument is intended for use by qualified health professionals and researchers.” URLs: https://www.ptsd.va.gov/professional/assessment/screens/pc-ptsd.asp and https://www.ptsd.va.gov/professional/assessment/adult-sr/ptsd-checklist.asp. Keep the current forms verbatim. Spanish PCL-5 translations on that site are not validated.

**DASS.** “The DASS questionnaire is public domain, and so permission is not needed to use it.” URL: https://www2.psy.unsw.edu.au/dass/DASSFAQ.htm (FAQ 3). FAQ 21: an app open to the public may not administer the DASS. It may, if the app is restricted to a defined group such as enrolled patients or research participants, and the results are fed back to the clinician or researcher rather than the respondents. FAQ 9: do not give respondents automated interpretation. FAQ 15: one or two of the three scales may be given alone; omitting a scale does not noticeably change the scores of the scales that remain. The short form is still preferred if the only aim is to save time. FAQ 5: severity labels are published only in the paid manual. FAQ 8: DASS-21 scale sums are multiplied by 2 before comparison with full-scale norms. The scale is not sold.

**ASRS v1.1 screener.** Harvard’s background memo says the materials are posted for unrestricted use and: “No approval is required to use the ASRS or these translations for individual-level screening so long as the user acknowledges in all print materials that the ASRS Screener v1.1 is copyrighted by the World Health Organization.” Scientific papers should cite Kessler et al. (2005). URL: https://www.hcp.med.harvard.edu/ncs/ftpdir/adhd/adhd/background_memo_rev.pdf. This is not public domain. The six items are not pasted.

**4AT.** The holders say: “The 4AT is free to use. It may be copied, shared and adapted under the Creative Commons Attribution 4.0 International licence (CC BY 4.0). No permission, payment or registration is required.” Attribution and the “no changes” notice are specified at https://www.the4at.com/attribution. CC BY 4.0 is already on the whitelist. The 4AT is a clinician bedside test. Putting it in a patient self-report flow would be a modified version, and the holders say the published accuracy then does not automatically apply. It is an external clinician slot, not a patient item set. Items are not drafted.

**IPIP 10-item markers.** The personality measure already records the IPIP statement that the items and scales are in the public domain and may be used without permission or a fee. URL: https://ipip.ori.org/. The extension below uses that key. It does not use Open-Source Psychometrics frequencies as a clinical cut.

## Topic reports

### Suicide — default on

No published single item was found with sensitivity of at least 0.90 for a later suicide attempt or suicide death. PHQ-9 item 9 predicts attempts (Simon et al., 2013, Psychiatric Services; US outpatients) and is not a risk assessment: it asks how often a thought was present over two weeks. A sensitivity at the 0.90 floor was not extracted, so none is claimed.

Rejected alternative: a homemade one-item gate with an invented cut, or treating a zero on item 9 as clearance.

Recommendation: ask the current C-SSRS healthcare screener, from the Columbia page above, without rewording. The direct questions are the ones on that form. Any yes follows that form’s own skips and triage. Threshold kind: any-yes. This is the loss rule, not a study that showed sensitivity of 0.90.

The screener stays armed when distress is negative. If the PHQ-9 is reached, item 9 scored 1 or more opens the screener again even if an earlier pass was negative. The psychologist sees the form’s own positive pattern. The sentence with it: “This is the Columbia healthcare screener, not a percentage risk of suicide. A negative screen does not clear the person.”

### Harm to a specified person — default on

No validated free scale, and no published single item with sensitivity of at least 0.90, was found. HCR-20, Static-99R, and RSVP are out of scope as items.

Recommendation: one direct question, any yes. Then four local flags: target, means, recency, intoxication. Threshold kind: any-yes. The flags are unvalidated. They are not added into a score. A violence-risk fact list for interview is facts, not a score.

### Current emergency — default on

**Weapon or stockpiled medicine.** No operating characteristics found. Any-yes. Unvalidated flag. Not a score.

**Alcohol or benzodiazepine withdrawal.** A history of delirium tremens, pooled across three studies (554 patients), had sensitivity 0.33 (95% CI 0.23–0.46) for severe alcohol withdrawal. That figure is from Wood et al. (2018), the Rational Clinical Examination review in JAMA (“Will this hospitalized patient develop severe alcohol withdrawal syndrome?”), as reprinted by Evans, Lewis, and Seupaul (2020) in Annals of Emergency Medicine. It misses 0.90. The PAWSS at 4 or more had sensitivity 0.93 (0.77–0.99) and specificity 0.99 in one US inpatient study (n = 403; Maldonado et al., 2015). That meets 0.90, but it is a 10-item clinician scale for medically ill inpatients, not a patient self-report item, and its licence was not shown to be on the whitelist. Rejected as a shipped scale. The self-report product stops at an unvalidated flag: current withdrawal symptoms, and any history of a withdrawal seizure or delirium tremens. PAWSS may be named in the external-test slot.

**Opioid overdose.** No single item with sensitivity of at least 0.90 for overdose was found. The Australian OWLS questions (healthdirect / Monash) screen for opioid-use disorder, not overdose, and were not cleared for pasting. Unvalidated flags only: prior overdose, current opioid sedation, using opioids alone. Not a score.

### Non-specific distress — default on

Mitchell and Coyne (2007) pooled single-question depression tests at sensitivity 0.32 and specificity about 0.97. That misses 0.80. The K10, in the 1997 Australian National Survey of Mental Health and Well-Being, had an area under the curve of 0.90 (95% CI 0.89–0.91) for 30-day CIDI mood and anxiety disorders (Furukawa, Kessler, Slade, and Andrews, 2003). That sample is Australian adults in households, not a clinic or a court. The paper reports likelihood ratios by band, not a single cut that was shown here to have sensitivity of at least 0.80. The K10 is also copyrighted, so it cannot be the shipped gate. Rejected: EST1; a K10 total; any volunteer percentile.

The distress branch therefore does not have one upstream item. It asks the depression gate and the anxiety gate below, and it does not infer panic, irritability, or trauma from them. Suicide, violence, and the emergency flags are not inferred from it either.

### Depression — opened from distress, default on

Single items miss the floor (Mitchell and Coyne, 2007, sensitivity 0.32).

The smallest published set is the PHQ-2, which is PHQ-9 items 1 and 2, past two weeks, each 0–3.

- Kroenke, Spitzer, and Williams (2003), US primary care and obstetrics-gynaecology, 580 interviewed of 6,000: at 3 or more, sensitivity 0.829 and specificity 0.900 for major depression; 41 of 580 had the diagnosis (about 7%). At 2 or more, sensitivity 0.927 and specificity 0.737.
- Levis et al. (2020), JAMA, individual-participant data from 100 studies, 44,318 people, 4,572 with major depression (10%), mean age 49: against a semistructured interview, 2 or more had sensitivity 0.91 (0.88–0.94) and specificity 0.67 (0.64–0.71); 3 or more had sensitivity 0.72 (0.67–0.77) and specificity 0.85 (0.83–0.87). The studies are not an Australian clinical or forensic sample. Fully structured interviews gave lower sensitivity.

The cut of 3 or more misses the floor in the larger body of evidence. It is rejected. The sensitivity-floor cut is 2 or more, from Levis et al. (2020), semistructured interviews. Whooley’s two past-month yes/no questions have pooled sensitivity 0.95 and specificity 0.65 (Bosanquet et al., 2015) but they are not the PHQ-9 sentences, so they cannot be carried forward. They were rejected because they add a full extra PHQ-9.

On a fire, ask PHQ-9 items 3–9 only. Items 1 and 2 are carried forward. The score is the PHQ-9 sum, 0–27. Published bands from Kroenke, Spitzer, and Williams (2001): 5, 10, 15, and 20. In the same Levis semistructured set, PHQ-2 at 2 or more followed by PHQ-9 at 10 or more had sensitivity 0.82 (0.76–0.86), close to PHQ-9 at 10 or more alone (0.86, 0.80–0.90). Item 9 still opens the suicide module at any score of 1 or more. The past-two-weeks stem stays.

Sentence: “PHQ-9 total, using the published bands. Not a diagnosis. The gate cut of 2 or more is from a multi-country individual-participant meta-analysis, not from an Australian forensic sample. Item 9 is a trigger for the Columbia screener, not a risk percentage.”

### Generalised anxiety — opened from distress, default on

No single item meeting 0.80 was found.

GAD-2 is GAD-7 items 1 and 2, past two weeks.

- Spitzer, Kroenke, Williams, and Löwe (2006), 15 US primary-care sites, 2,740 adults, 965 interviewed: GAD-7 at 10 or more, sensitivity 0.89 and specificity 0.82 for generalised anxiety disorder. At 8 or more, sensitivity 0.92 and specificity 0.76. At 9 or more, sensitivity 0.90 and specificity 0.79. Bands at 5, 10, and 15.
- O’Connor et al. (2023), US Preventive Services Task Force review: in three general-adult studies, GAD-2 at 2 or more had pooled sensitivity 0.94 (0.90–0.98) and specificity 0.68 (0.64–0.72); at 3 or more, sensitivity 0.81 (0.73–0.89) and specificity 0.86 (0.83–0.90).
- Cochrane review CD015455 (2025): at the recommended cut of 3 or more, GAD-2 summary sensitivity 0.68 (0.59–0.75) and specificity 0.86 (0.82–0.89) for generalised anxiety disorder. GAD-7 at 10 or more had summary sensitivity 0.64 (0.56–0.72) and specificity 0.91 (0.87–0.93). Heterogeneity was high. These are not Australian samples.

GAD-2 at 3 or more misses the floor on the Cochrane summary. It is rejected. GAD-2 at 2 or more meets the floor in the USPSTF pool of three general-adult studies. That is the sensitivity-floor cut used here, with that sample named. It is not an Australian cut. Specificity of 0.68 means many people will continue to the rest of the GAD-7. The floor does not allow the shorter false-negative rate of the cut at 3.

On a fire, ask GAD-7 items 3–7. Items 1 and 2 are carried forward. The score stored is the GAD-7 total. The published screening cut remains 10 or more, and the published bands remain 5, 10, and 15, because those belong to the official instrument. The sentence must include the conflict: “GAD-7 total. The development sample (US primary care, Spitzer 2006) had sensitivity 0.89 and specificity 0.82 at 10 or more. A 2025 Cochrane summary at that cut had sensitivity 0.64. Neither figure is Australian. This is not a diagnosis.”

### Panic — not opened by the anxiety gate

No single-item or two-item sensitivity meeting 0.80 for panic disorder was extracted. The PHQ panic module sits under the same Pfizer notice, but its operating characteristics were not extracted, so no cut is adopted. The product stops at a flag when the psychologist selects panic. GAD-2 does not stand in for it.

### Irritability or tension — selected, not inferred

No one-item or two-item gate meeting 0.80 was found. FAQ 13 says the DASS Stress scale corresponds more closely to the symptom picture of generalised anxiety than to a lay idea of environmental stress, and FAQ 14 says it is a tension and irritability syndrome. FAQ 15 allows that scale to be given alone.

When the psychologist selects this split, ask the seven DASS-21 Stress items only, past week, multiply the sum by 2, and show that number to the clinician. Do not print a severity word unless the clinic is reading the paid manual. Do not show an automated interpretation to the respondent. Do not sell the scale. The app condition in FAQ 21 applies. Threshold kind: the published score of that scale, without a diagnostic cut. Sentence: “DASS-21 Stress, doubled so it can be compared with full-scale norms. Not a diagnosis. Severity labels are in the manual, not on this screen.”

### Trauma cue

There is no separate trauma item inside the distress branch. Trauma is its own default-on branch. A negative distress result does not skip it.

### Alcohol — default on

An Australian standard drink is 10 g of ethanol. AUDIT item 3 stays “six or more” drinks on one occasion. It is not rewritten to the NHMRC four-drink guideline.

No single AUDIT item with sensitivity of at least 0.80 in Australian adults, using a 10 g drink, was found. AUDIT-C cuts of 4 or more for men and 3 or more for women come chiefly from US studies, where a standard drink is often 14 g. A Flinders summary of adult studies gives male sensitivity about 0.82–1.00 at 4 or more and female sensitivity about 0.73–0.97 at 3 or more, and it warns that AUDIT-C reflects American drink sizes (NCETA, 2021). The female range includes values under 0.80. Aboriginal-specific AUDIT-C cuts exist and are out of scope for this item set.

Rejected: AUDIT-C with a US or sex-specific cut; a second alcohol scale after the AUDIT; the NHMRC four-drink rewrite.

Because no shorter gate met the floor under an Australian 10 g definition, alcohol asks the full 10-item AUDIT. That is the official instrument, and the branch stops there. The score is the 0–40 total. The bands to confirm against the WHO manual before any later build are the usual published zones (8, 16, and 20). Threshold kind: published cut of the AUDIT, once the manual’s current wording of those zones is checked. Sentence: “AUDIT total. A standard drink in this administration is 10 g. Item 3 was not changed to a four-drink rule. The hazardous-use zones are the WHO manual’s zones, not a local estimate, and they have not been re-cut on an Australian forensic sample. This is not a diagnosis.”

### Other substances — default on, one class at a time

Wording is not shipped. Follow the current WHO ASSIST form’s skips. The structure used here, which must be checked against that form before any build:

- Q1 is lifetime use, one class at a time. Alcohol is not one of these classes. Alcohol has already stopped at the AUDIT.
- A no on Q1 for a class asks nothing further for that class and contributes nothing.
- For a class with any yes on Q1, ask the remaining class-specific items. The involvement score is the sum of Q2 through Q7 for that class. Q1 is not in the sum. Q8 (injection) is not in the sum. Tobacco does not score Q5. Those exceptions are how circulated WHO-attributed scoring guides describe the 2010 instrument; the manual wins if they differ.
- Published risk bands for non-alcohol classes, as printed on those guides: 0–3 lower risk, 4–26 moderate, 27 or more high. Threshold kind: published cut of the ASSIST, after the manual is checked. Not a homemade scale.

No single-item sensitivity of at least 0.80 for a substance-use disorder was extracted. Q1 any-yes is the instrument’s own entry rule, not a sensitivity-floor cut. Emergency withdrawal and overdose flags are still asked when Q1 is no.

Sentence: “ASSIST involvement score for this class only, using the WHO bands. Not a diagnosis. Alcohol is not scored here. The item wording is the WHO form, which this app must not rewrite, and which was not copied into this repository because permission to paste it was not found.”

### Trauma — default on

The PC-PTSD-5 exposure item is the first gate. The National Center’s instruction is: if the person says no, the screen total is 0 and the screen stops. That rule is used as written. Nothing further is asked in this branch.

If the exposure item is yes, all five past-month symptom items are asked. No single symptom item with sensitivity of at least 0.80 was found, so the minimum set is those five. Bovin et al. (2021), JAMA Network Open, US veterans in primary care at two VA centres, criterion a blinded DSM-5 PTSD interview: at 3 or more, sensitivity 0.90 and specificity 0.80; at 4 or more, sensitivity 0.78 and specificity 0.91. Area under the curve 0.927 (0.896–0.959). For women, a cut of 4 left about a third of the women with PTSD undetected in that sample. The cut of 4 is rejected because 0.78 misses the floor. The sensitivity-floor cut is 3 or more. This is a US veteran primary-care sample, mostly older men. It will not match Australian civilian, compensation, or criminal samples, where the base rate and the kinds of trauma differ.

PCL-5 is asked only if the five-item count is 3 or more. PCL-5 sentences are not the PC-PTSD-5 sentences and are not skipped. Use the past-month form unless the psychologist has chosen the past-week form; the stem stays the one on the form. The score is the 0–80 total. The National Center says initial research puts a probable-PTSD cut between 31 and 33, and that the cut should move with the sample (https://www.ptsd.va.gov/professional/assessment/adult-sr/ptsd-checklist.asp). Bovin et al. (2016) found 31–33 optimally efficient against the CAPS-5 in US veterans. Threshold kind on the PCL-5: that published range, named as US veteran data. A provisional DSM-5 algorithm (item score 2 or more, then the cluster counts) may be shown beside the total because the National Center publishes it. It is not a second scale.

Sentence: “PC-PTSD-5 count, then PCL-5 total only if the count is 3 or more. A ‘no’ on exposure is a score of 0. The cut of 3 is from US veteran primary care (Bovin 2021), where sensitivity was 0.90 and specificity was 0.80. It is not an Australian cut. The PCL-5 is not a diagnosis.”

### Mania — off until selected

No single item meeting 0.80 was found. The Mood Disorder Questionnaire is copyrighted and requires the rights holder’s permission. It is not shipped. The product stops at a flag. External-test slot: MDQ, or a clinical interview.

### Psychosis — off until selected

Low base rate. Threshold kind: any-yes on a direct question. No validated free item was found, so the question is a local flag, labeled unvalidated, and it is not a score. A positive does not generate a probability.

### Eating disorders — off until selected

No single SCOFF item with published sensitivity was extracted. The five SCOFF questions at two or more yes answers had sensitivity 1.00 and specificity 0.875 in the UK development sample (Morgan, Reid, and Lacey, 1999, BMJ: 116 cases and 96 controls, base rate 55%, which will not transport). A 25-study meta-analysis reported pooled sensitivity 0.86 (0.78–0.91) and specificity 0.83 (0.77–0.88) (Kutz et al., 2020). The floor is met by the five-item set, not by a shorter gate. No rights statement placing SCOFF on the whitelist was found. The wording is not pasted. The product stops at a flag. The external instrument to name is the SCOFF at two or more, with the case-control limit written next to it.

### Gambling — off until selected

The Lie/Bet pair (either yes): Johnson et al. (1997), 191 male Gamblers Anonymous members and 171 male VA employees in the United States, sensitivity 0.99 and specificity 0.91 against the Gamblers Anonymous 20 questions. Base rate in that study is about half. A later sample that included women had specificity 0.85 (Johnson, Hamer, and Nora, 1998). This will not transport to a low-base-rate Australian clinic. No statement placing the two sentences on the whitelist was found. They are not pasted.

The PGSI (Ferris and Wynne, 2001) is the instrument usually used in Australian population surveys, with bands 0, 1–2, 3–7, and 8 or more. A rights statement allowing it onto the whitelist was not found. The product stops at a flag. External slot: PGSI, or Lie/Bet if the clinic already holds the items.

### Sleep — off until selected

No single item meeting 0.80 for insomnia disorder was extracted. The Insomnia Severity Index is copyrighted (Morin). It is not pasted. The product stops at a flag. External slot: ISI.

### Somatic symptoms — off until selected

No one-item or two-item gate meeting 0.80 was extracted. The PHQ somatic module is in the PHQ family and may fall under the same no-permission notice, but the operating-characteristic table was not opened in this pass, so no cut is adopted. The product stops at a flag until that table is read. Do not borrow a cut from memory.

### Adult ADHD — off until selected

No single item is the gate. The user limit is the ASRS v1.1 six-item screener, unmodified.

Kessler et al. (2005), US National Comorbidity Survey Replication, community sample, blind clinical diagnoses: the six-item screener had sensitivity 68.7% and specificity 99.5%. The unweighted 18-item form had sensitivity 56.3% and specificity 98.3%. The six-item result misses 0.80. The 18-item form is worse on that scoring and is outside the user limit anyway. A 0–24 scoring with a cut of 14 is described by the Harvard scoring note (posted 28 February 2024, citing Kessler et al., 2007) as more stable for research. Sensitivity at 14 was not extracted here, so it is not adopted.

When ADHD is selected, ask all six screener items, with the form’s own stem and the copyright line. Report the published 0–6 rule (4 or more) and state that it misses the floor. Do not add items to chase sensitivity. Sentence: “ASRS v1.1 screener, WHO copyright. In the US community development sample, sensitivity was 0.687 and specificity was 0.995. That sensitivity is below the 0.80 floor. This is not a diagnosis of ADHD.”

### Delirium — off until selected

The 4AT is CC BY 4.0 and is clinician-administered. A secondary summary of 17 studies and 3,702 observations gives pooled sensitivity 0.88 (0.80–0.93) and specificity 0.88 (0.82–0.92). The point estimate meets the 0.80 symptom floor. This pass did not open the meta-analysis paper, so the interval is second-hand. The official site now cites more studies and does not print that pooled figure on the page that was read. No patient self-report item meeting 0.80 was found. MoCA and MMSE stay external slots and are not items.

The record has a 4AT slot for the clinician to enter the official score. The patient is not asked a rewritten 4AT. Sentence: “4AT score entered from the clinician’s own administration of version 1.2. Not a self-report scale. Not a dementia diagnosis.”

### Cognitive decline — off until selected

Separate from delirium. No single self-report item meeting 0.80 was extracted. GPCOG is an Australian candidate and its table was not opened, so no cut is set. MoCA and MMSE are external slots. The product stops at a flag plus that slot.

### Intimate-partner violence, victim — off until selected

Rabin, Jennings, Campbell, and Bair-Merritt (2009) found single items inconsistent, the Partner Violence Screen ranging from sensitivity 0.35 to 0.71, and HITS ranging from 0.30 to 1.00 depending on the study. Feldhaus et al. (1997), US emergency department, found the three-question PVS at sensitivity 0.65 against the Index of Spouse Abuse and 0.71 against the Conflict Tactics Scale. None of these is a stable 0.80. HITS requires permission from the author. No shippable instrument. Any-yes local flag, unvalidated, victim recorded separately from perpetrator. Not a score.

### Intimate-partner violence, perpetrator — off until selected

No shippable scale with sensitivity of at least 0.80 was found. Heyman, Baucom, and Xu (2021) reported short screens above sensitivity 0.90 in US military spouses; those items are not a public instrument and that sample will not transport to Australian criminal or family-court work. They are not copied. Any-yes local flag, unvalidated, not a score.

### Perinatal mood — off until selected

Whooley questions in perinatal women: pooled sensitivity 0.95 (0.81–0.99) and specificity 0.60 (0.44–0.74) (meta-analysis, Journal of Affective Disorders, 2022). The floor is met. The questions are not confirmed to sit under the PHQ notice, so they are not pasted.

The instrument named by Australian guidance is the EPDS. Perrykkad et al. (2025) summarise Australian postpartum studies at a cut of 13 or more as sensitivity from 0.38 to 1.00 and specificity about 0.81–0.96. That range includes values under 0.80. EPDS is copyrighted (Cox and colleagues). It is not shipped. The product stops at a flag and an external EPDS slot. PHQ-9 does not replace it. If a clinic administers the EPDS outside this app, the self-harm item still opens the Columbia module.

### Personality — the existing screen; extension only if selected by an extreme item

No change to EXT7, EST1, AGR1, CSN6, or OPN8, and no change to the 35 / 65 categories. If one of those five is Low or High, the IPIP 10-item marker set for that same trait may be offered. The score is the keyed sum on the IPIP key. There is no clinical cut and no personality-disorder score. Sentence: “IPIP 10-item marker score for this trait. Public domain. Not a diagnosis and not a personality-disorder screen. The five-item category that opened it is a volunteer frequency, not a clinical threshold.”

### Forensic administration

Same gates. Every score also carries: “Primary-care and household sensitivity will not match Australian compensation, custody, or criminal samples. No validity scale has been added to this questionnaire.”

### External-test slot, no items

Competency, mental state at the offence, parenting capacity, fitness for duty, malingering, effort, psychopathy, sexual-offence risk, HCR-20, Static-99R, RSVP, MoCA, MMSE, KICA, Here and Now, and the Growth and Empowerment Measure. The record can name the test and store a score the psychologist types. It does not contain the items. A violence-risk fact list is labeled facts, not a score.

## Decision table

| Topic | Default | Gate | Licence | Fires when | Split | Split rule | Official instrument | Carried forward | Stop | Score shown | Sentence with the score |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Suicide | On | Current C-SSRS healthcare screener, used as its own direct questions | Copyrighted; use in healthcare allowed; not public domain | Any yes on the form | The form’s own later questions | Follow the form’s skips. Do not reword | Same form | None | End of the form | The form’s positive pattern, not a percent | “Not a percentage risk. A negative screen does not clear the person.” |
| Harm to a specified person | On | One direct question. No published item met sensitivity 0.90 | Local, unvalidated | Any yes | Target, means, recency, intoxication | Any yes on the direct question | None | None | After the four flags | Four flags, not a sum | “Unvalidated flags, not a violence-risk score.” |
| Weapon or stockpiled medicine | On | One direct question. No published sensitivity found | Local, unvalidated | Any yes | None | — | None | None | At the flag | Flag | “Unvalidated safety flag. Missing this costs more than an extra module.” |
| Alcohol or benzodiazepine withdrawal | On | No self-report item met sensitivity 0.90. PAWSS ≥4 did, in one US inpatient study, and is not shipped | Local flag; PAWSS external | Any yes on the local flag | Current symptoms; history of seizure or delirium tremens | Any yes | None in the app. PAWSS is external | None | At the flags | Flags | “Not the PAWSS and not a withdrawal score.” |
| Opioid overdose | On | No item met sensitivity 0.90 | Local, unvalidated | Any yes | Prior overdose; current sedation; using alone | Any yes | None | None | At the flags | Flags | “Unvalidated flags, not an overdose probability.” |
| Distress | On | No single item met sensitivity 0.80. EST1 is not this gate | — | Does not itself fire | Depression gate and anxiety gate only | Panic, irritability, and trauma are not inferred | None as a total | None | The two gates below are the branch | No distress total | “There is no distress score. The modules below keep their own scores.” |
| Depression | On, inside distress | PHQ-2 (PHQ-9 items 1–2). Single items failed (sensitivity 0.32) | `no-permission-required` proposed; not on the whitelist yet | Sum ≥2 (Levis 2020). Sum ≥3 rejected (sensitivity 0.72) | PHQ-9 items 3–9 | PHQ-2 ≥2 | PHQ-9 | Items 1 and 2 | After item 9 | PHQ-9 total and bands 5 / 10 / 15 / 20 | “Not a diagnosis. Gate cut is from a multi-country meta-analysis. Item 9 opens the Columbia screener.” |
| Generalised anxiety | On, inside distress | GAD-2 (GAD-7 items 1–2). Cut ≥3 rejected (Cochrane sensitivity 0.68) | Same proposed PHQ/GAD value | Sum ≥2 (USPSTF general-adult pool, sensitivity 0.94). Not Australian | GAD-7 items 3–7 | GAD-2 ≥2 | GAD-7 | Items 1 and 2 | After item 7 | GAD-7 total; bands 5 / 10 / 15; screen cut 10 | “Development-sample sensitivity at 10 was 0.89; Cochrane summary was 0.64. Not Australian. Not a diagnosis.” |
| Panic | Off until selected | None met the floor | PHQ panic module not adopted | — | — | — | None shipped | — | At a flag | Flag | “No panic instrument shipped in this pass.” |
| Irritability or tension | Off until selected | No 1- or 2-item gate. Minimum set is DASS-21 Stress, which FAQ 15 allows alone | Public domain, plus FAQ 21 | Selected by the psychologist, not by another gate | The 7 stress items are the instrument | — | DASS-21 Stress | None | After the 7 items | Doubled sum, to the clinician only | “Not a diagnosis. No severity word unless the manual is being used. No interpretation to the respondent.” |
| Trauma exposure | On | PC-PTSD-5 exposure item | Public domain, NCPTSD | Yes | The five symptom items | A no scores 0 and stops | PC-PTSD-5, then PCL-5 only if the count is ≥3 | None. PCL-5 items are not duplicates | Exposure no: stop. Count <3: stop. Count ≥3: full past-month PCL-5 | PC-PTSD-5 count; PCL-5 0–80 if reached | “Exposure ‘no’ is 0. Cut 3 is US veteran primary care, sensitivity 0.90, specificity 0.80. Not Australian. PCL-5 is not a diagnosis.” |
| Alcohol | On | No single item and no AUDIT-C cut met the floor for a 10 g Australian drink | Public domain for non-commercial use; do not materially change | Alcohol is armed | None. The full AUDIT is the gate and the instrument | — | AUDIT, 10 items | — | After item 10. No second alcohol scale | AUDIT 0–40 and the WHO zones, after the manual is re-checked | “Standard drink is 10 g. Six-drink item unchanged. Not a diagnosis. Not re-cut on a forensic sample.” |
| Other substances | On | ASSIST Q1, each class except alcohol | WHO copyright; wording not pasted | Any yes on Q1 for that class | Q2–Q7 for that class; Q8 separate | Follow the form’s skips | ASSIST class score | Q1 is not in the score | End of that class | Q2–Q7 sum and the WHO band | “One class, one score. Alcohol is not scored here. Not a diagnosis.” |
| Mania | Off | None met the floor | MDQ copyrighted | — | — | — | None shipped | — | Flag | Flag | “MDQ is external. Not shipped.” |
| Psychosis | Off | Direct question, no free validated item | Local, unvalidated | Any yes | None | — | None | — | Flag | Flag | “Any-yes flag. Not a psychosis score.” |
| Eating disorders | Off | No single item. SCOFF, all 5, at ≥2 meets the floor in published data | Not shown to be on the whitelist | — | — | — | SCOFF external | — | Flag | Flag, and the name of the external test | “SCOFF was not shipped. Development base rate was 55%.” |
| Gambling | Off | Lie/Bet meets sensitivity only in a US case-control sample and is not shippable | Not on the whitelist. PGSI not cleared | — | — | — | PGSI external | — | Flag | Flag | “No gambling score in this app.” |
| Sleep | Off | None extracted | ISI copyrighted | — | — | — | ISI external | — | Flag | Flag | “No sleep score in this app.” |
| Somatic symptoms | Off | None extracted at the floor | PHQ somatic module not scored this pass | — | — | — | Not adopted | — | Flag | Flag | “No somatic cut adopted. The table was not opened.” |
| Adult ADHD | Off | All 6 ASRS v1.1 screener items. They miss sensitivity 0.80 | WHO copyright; acknowledge it | Selected | The 6 items are the instrument | Do not add the other 12 | ASRS v1.1 screener | — | After item 6 | Published 0–6 score, cut 4 | “Sensitivity in the US community sample was 0.687. Below the floor. Not a diagnosis.” |
| Delirium | Off | No self-report item. 4AT is the clinician test | CC BY 4.0; do not rewrite into self-report | Selected | — | Clinician administers official v1.2 | 4AT, external entry | — | When the clinician enters the score | The official 4AT score | “Entered from a clinician administration. Not a self-report. Not a dementia diagnosis.” |
| Cognitive decline | Off | None | MoCA and MMSE external; GPCOG not cut | — | — | — | External slot | — | Flag | Flag or a typed external score | “No cognitive item set in this pass.” |
| IPV, victim | Off | No item stably at sensitivity 0.80 | Local flag. HITS needs permission | Any yes | None beyond the flag | — | None | — | Flag | Flag | “Unvalidated. Not an IPV score. Recorded apart from perpetration.” |
| IPV, perpetrator | Off | None shippable | Local flag | Any yes | None | — | None | — | Flag | Flag | “Unvalidated. Not a score.” |
| Perinatal mood | Off | Whooley meets sensitivity 0.95 in perinatal samples and is not confirmed for the whitelist | EPDS copyrighted | — | — | PHQ-9 does not replace EPDS | EPDS external | — | Flag | Flag | “EPDS is external. If item 10 is used outside this app, it opens the Columbia screener.” |
| Personality extension | Off unless one of the five items is Low or High | The existing item’s Low or High category | IPIP public domain | That category | The 10 IPIP markers for that trait only | Not a new cut | IPIP 10-item markers | The original sentence is not re-scored as a marker item | After the 10 | Keyed sum, no clinical band | “Not a diagnosis and not a personality-disorder screen.” |

## Where a single item is not defensible

| Topic | Why one item fails | Minimum set |
| --- | --- | --- |
| Depression | Pooled single-question sensitivity 0.32 | PHQ-2, cut ≥2, then the rest of the PHQ-9 |
| Generalised anxiety | No single item located at sensitivity ≥0.80. GAD-2 at ≥3 has Cochrane sensitivity 0.68 | GAD-2 at ≥2 from the USPSTF general-adult pool, then the rest of the GAD-7 |
| Trauma symptoms | No single PC-PTSD-5 symptom located at sensitivity ≥0.80 | The exposure item, then all five symptoms; PCL-5 only if the count is ≥3 |
| Alcohol | No Australian 10 g single item, and AUDIT-C cuts do not transport cleanly | The full 10-item AUDIT |
| Other substances | No class-level single item at sensitivity ≥0.80 | ASSIST Q1, then Q2–Q7 for that class |
| Irritability or tension | No 1- or 2-item gate | The 7 DASS-21 Stress items, and only when selected |
| Adult ADHD | The published six-item screener itself has sensitivity 0.687 | Those six items, unmodified, with the miss stated. Do not add the other 12 |
| Eating disorders | No single SCOFF item extracted | All five SCOFF items at ≥2, external, not shipped |
| Delirium | No self-report item. 4AT is four clinician observations | Official 4AT, entered by the clinician |
| Withdrawal | Prior delirium tremens has sensitivity 0.33. The scale that meets 0.90 is the 10-item PAWSS | Not shipped. Local flags |

## Where the product stops at a flag

No shippable instrument, under the whitelist and the “do not paste copyrighted wording” rule:

- Harm to a specified person
- Weapon or stockpiled medicine
- Alcohol or benzodiazepine withdrawal
- Opioid overdose
- Panic
- Mania
- Psychosis
- Eating disorders (SCOFF exists and is not cleared to ship)
- Gambling (Lie/Bet and PGSI are not cleared to ship)
- Sleep (ISI is copyrighted)
- Somatic symptoms (table not opened; no cut adopted)
- Cognitive decline apart from a typed external score
- Intimate-partner violence as victim
- Intimate-partner violence as perpetrator
- Perinatal mood (EPDS is the Australian instrument and is not cleared to ship)

ADHD does not stop at a flag. The six-item screener is asked, and the score is printed with the statement that sensitivity was below 0.80.

These external tests have a slot and no items: competency, mental state at the offence, parenting capacity, fitness for duty, malingering, effort, psychopathy, sexual-offence risk, HCR-20, Static-99R, RSVP, MoCA, MMSE, KICA, Here and Now, Growth and Empowerment Measure, PAWSS, MDQ, PGSI, ISI, EPDS, and a clinician-administered 4AT.

## Data needed before a cut could be estimated here

A cut in this pass was taken from a paper or was not set. Estimating one would need, before any look at the items:

- Australian adults, 18 and over, in the setting the cut is for. A clinical series and a forensic series are different cuts. Compensation, custody, and criminal samples are not primary care.
- A pre-declared criterion: a diagnosis from an interview done blind to the gate, hazardous use defined with a 10 g drink, or a positive on the longer official scale.
- The base rate of that criterion in the sample.
- Item-level responses on the candidate gate and on the criterion, measured independently.
- The sensitivity floor declared again: 0.90 for safety, 0.80 for symptoms and substances.
- Enough people with the criterion that a sensitivity of 0.90 is not a handful of cases. Suicide attempt, assault on a named person, complicated withdrawal, and overdose are uncommon. A routine clinic file will not estimate those cuts.
- For alcohol, drinks recorded as 10 g standard drinks, with AUDIT item 3 left at six or more, so the cut is not quietly fitted to the NHMRC four-drink guideline.
- For trauma, a civilian and a veteran series separately, and women reported separately. The US veteran cut of 3 is not that dataset.
- For ADHD, a pre-declared comparison of the published 0–6 rule and the 0–24 rule against a blind clinical diagnosis, without adding items past the six.
- No use of the Open-Source Psychometrics IPIP file. It has no clinical criterion.

Until that exists, the cuts above stay the cited ones, and the flag list stays a flag list.

## Departures and limits

- GAD-2 is used at 2 or more, not at the authors’ cut of 3, because the authors’ cut misses the floor in the 2025 Cochrane summary. The 2-or-more figure is from three general-adult studies in a US review, not from Australia.
- PHQ-2 is used at 2 or more, not at 3, because the individual-participant meta-analysis puts sensitivity at 0.72 for the cut of 3.
- Alcohol asks all 10 AUDIT items. AUDIT-C was the named fallback in the protocol and was rejected because no Australian 10 g cut met the floor.
- Irritability is not asked of every person. No short gate exists, and the seven-item DASS stress scale is the instrument, so it waits until the psychologist selects it. Distress still asks the depression and anxiety gates by default.
- The Bovin 2021 PC-PTSD-5 sensitivity of 0.90 and specificity of 0.80 at a cut of 3 were read from a full-text table extract, not from the journal PDF. The Cochrane and USPSTF anxiety figures were read from the review summaries. The 4AT pooled sensitivity was read from a secondary summary, not from the meta-analysis PDF.
- WHO AUDIT zone edges were not re-read from the 2001 manual PDF in this pass. A later build has to check that PDF before hard-coding 8, 16, and 20.
- ASSIST skip rules and band edges were taken from the instrument’s published structure and from WHO-attributed scoring guides, not from a line-by-line reading of the 2010 manual in this pass. The manual wins if a guide differs. Wording was not copied.
- No JSON file was drafted. Public-domain or CC BY text that was confirmed (PC-PTSD-5, PCL-5, DASS, AUDIT, 4AT, IPIP) is still not registered as a measure. PHQ, GAD-7, K10, C-SSRS, ASRS, and ASSIST were not drafted, because they are not on the whitelist.
- After this report, a validity screen was added because it was asked for. The research pass had said no self-report validity scale. The screen that was added is the public-domain IPIP proxy for the two BIDR constructs, plus all-true, all-false, fixed-response, and inconsistency checks. It is not a PDS, MMPI-3, MCMI-IV, PAI, or Personality Assessment Screener scale, and it has no negative-impression items. The protocol file was not rewritten.
