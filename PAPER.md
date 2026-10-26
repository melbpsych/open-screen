# A five-item public-domain personality screen, with one marker for each Big Five factor

**A local research report, and the scoring manual for the first measure in Open Screen.** Not peer reviewed. The items were not written for this paper. They are public-domain IPIP sentences. The choice of which five, and the percentiles attached to each answer, come from the Open-Source Psychometrics release of 8 November 2018. The earlier re-analysis of that file is in `../conscientiousness-ceiling/`.

## Abstract

Clinicians often need a personality sketch that can be finished in a minute and that does not depend on a copyrighted instrument. This paper reports a five-item screen built for that use. Each item is one sentence from the 50 IPIP Big Five factor markers. The five were not chosen because they were the most central sentences. They were chosen because, among items that still belonged to their own factor, they jointly spread people out the most: each answer varies, and the five answers barely correlate.

In the public file, the winning sentences are “I talk to a lot of different people at parties” (extraversion, pattern loading 0.76), “I get stressed out easily” (emotional stability, reverse-keyed, 0.75), “I feel little concern for others” (agreeableness, reverse-keyed, 0.57), “I often forget to put things back in their proper place” (conscientiousness, reverse-keyed, 0.65), and “I use difficult words” (intellect or imagination, 0.59). Among 992,338 people who answered all five, correlations ranged from −0.06 to 0.13. There is no total score.

Table 2 places each scored answer by its mid-rank in the public sample of about one million online volunteers (2016–2018). The accompanying app does not show that rank. Five answers cannot support a finer score, so the app reports a category, Low, Middle, or High, and the distribution of the sample. The screen is a pointer. A single sentence does not measure a trait’s facets, has no retest estimate in this file, and uses volunteer norms rather than norms from a clinic, a workplace, or a court. Interpretation in the app follows the content of the sentence first, and the broader trait literature only with that limit stated.

## 1. Introduction

The Big Five are a working taxonomy of personality: extraversion, agreeableness, conscientiousness, emotional stability (the low end of neuroticism), and intellect or imagination (Goldberg, 1992; John, Naumann, & Soto, 2008). Longer measures of those traits predict outcomes that matter outside the questionnaire, including health, relationships, and work, at a size comparable to other familiar predictors (Ozer & Benet-Martínez, 2006; Roberts, Kuncel, Shiner, Caspi, & Goldberg, 2007). In mental-health research, people with anxiety and depressive disorders score markedly higher on neuroticism and lower on conscientiousness than controls (Kotov, Gamez, Schmidt, & Watson, 2010). Those findings come from multi-item scales. They are a reason to ask about personality. They are not a warrant to treat one sentence as a diagnosis.

The practical problem is length and license. Proprietary inventories cannot be copied into a clinic’s own tool. The International Personality Item Pool was built to remove that barrier: its items are in the public domain, and no permission is required to use them (Goldberg et al., 2006; https://ipip.ori.org/). Several short public forms already exist. The Ten-Item Personality Inventory uses two items per trait and takes about a minute (Gosling, Rentfrow, & Swann, 2003). The BFI-10 is a ten-item Big Five (Rammstedt & John, 2007). Woods and Hampson (2005) showed that a bipolar single item for each trait can converge with longer scales (mean r = 0.61 in a combined N of 791) and can be stable enough on retest (mean reliability about 0.71) to be useful when time is the constraint.

This screen is not the TIPI and not the Woods and Hampson items. It keeps the IPIP marker wording and the five-point disagree-to-agree format of a large public data file, so that an answer can be placed against an empirical frequency rather than against a new and unnormed scale. The design rule was specific. Pick one item from each trait. Require that the item still measure that trait. Then pick the set of five whose answers, taken together, distinguish people rather than repeat one another.

## 2. Method

### 2.1 Data

The norms and the selection use the Open-Source Psychometrics Project file `IPIP-FFM-data-8Nov2018` (1,015,341 records). Respondents completed the 50 IPIP Big Five factor markers online between 2016 and 2018 and confirmed that their answers could be stored for research. The response scale was 1 (disagree), 3 (neutral), and 5 (agree); 2 and 4 were unmarked steps. Country was inferred from technical information. The file is not a census, a clinical sample, or a forensic sample.

Items were keyed with the IPIP 10-item marker key before any statistic in this paper. For a reverse-keyed item the scored value is `6 − raw`. Emotional stability is scored toward stability. Intellect or imagination is the fifth IPIP domain, not a NEO openness scale, and none of these sentences are NEO items.

### 2.2 What was already known from the re-analysis

A five-factor principal-axis solution with oblimin rotation, on 20,000 complete cases (seed 20261023), recovered the five traits. Polychoric pattern loadings were used so the choice did not depend on the items being normally distributed. Each factor’s strongest items, and the decision to keep reverse-keyed items in the parent scales, are reported in the companion analysis. Two facts from that work shaped this screen. Conscientiousness on the 10-item scale is not a ceilinged trait in this file. Agreeableness is. A screen that simply took the highest-loading sentence from each factor would have picked agreeableness and intellect items that a large share of people endorse.

### 2.3 Choosing five items

An item was eligible if its polychoric pattern loading on its own factor was at least 0.50 and larger than its loading on any other factor. That left 10 extraversion items, 9 emotional-stability items, 8 agreeableness items, 8 conscientiousness items, and 9 intellect items.

The search then took one eligible item from each trait and computed the determinant of the 5 × 5 covariance matrix of the keyed answers, on 874,434 people with all 50 items present. The determinant is large only when each item has a wide spread and the items are weakly correlated. It is the quantity that matches the request for items that differentiate people and that do not duplicate one another. If another set came within 1 percent of the maximum determinant, the set with the higher lowest loading would have been kept. The reported set won on the determinant.

There is no summed scale and no item response model of the five-item composite. The five constructs are different. A total would mix them.

### 2.4 Norms used in the app

The app does not use the complete-case subset. For each sentence it uses everyone who answered that sentence (about 1.006 to 1.009 million people). The bar is those five frequencies. The category is Low when the mid-rank of the answer is below the 35th percentile, High when it is above the 65th, and Middle otherwise. The mid-rank is the share of the sample below that answer, plus half of the share who gave the same answer. With only five possible answers, many people tie, so the app shows the category and the bar rather than the rank. Table 2 still lists the rank, because that is how the categories were set. The mid-rank is also why the most common answer is not treated as the top of the sample.

## 3. Results

### 3.1 The five sentences

Table 1 lists the screen. Loadings are polychoric pattern loadings from the five-factor solution. The cross-loading is the largest absolute loading of that item on any other factor.

**Table 1. The screen.**

| Trait | Sentence | Key | Loading | Largest other loading |
|---|---|---|---:|---:|
| Extraversion | I talk to a lot of different people at parties. | Forward | 0.76 | 0.08 |
| Emotional stability | I get stressed out easily. | Reverse | 0.75 | 0.14 |
| Agreeableness | I feel little concern for others. | Reverse | 0.57 | 0.06 |
| Conscientiousness | I often forget to put things back in their proper place. | Reverse | 0.65 | 0.10 |
| Intellect or imagination | I use difficult words. | Forward | 0.59 | 0.15 |

The highest-loading sentence in each trait was a different set: keeping in the background, getting upset easily, sympathizing with others’ feelings, being always prepared, and being full of ideas. That set’s covariance determinant was 3.29. The set in Table 1 had a determinant of 16.13. The famous sentences are more central and worse at separating people, because too many respondents pile up on the endorsed end. “I have frequent mood swings” was within 1 percent of the winning set and can replace the stress item if a clinic prefers it. The rest of the winning set did not move.

Agreeableness is the compromise. “I feel little concern for others” cleared the 0.50 loading rule and had the widest spread of the eligible agreeableness items. It is not the core of the factor. Sympathizing with others’ feelings loads 0.86 and does not spread the sample. Intellect shows the same trade. “I use difficult words” is a vocabulary sentence. “I am full of ideas” is closer to the center of the factor and has a smaller standard deviation.

### 3.2 How often each answer occurs

Table 2 is the norm table. Counts are for the scored answer, after the key. A reverse-keyed sentence has been flipped, so 5 always means more of the named trait.

**Table 2. Scored-answer frequencies.**

| Scored answer | Extraversion | Emotional stability | Agreeableness | Conscientiousness | Intellect |
|---|---:|---:|---:|---:|---:|
| 1 | 23.6% (12th) | 22.9% (11th) | 8.8% (4th) | 16.2% (8th) | 10.3% (5th) |
| 2 | 22.7% (35th) | 26.9% (36th) | 13.3% (16th) | 21.3% (27th) | 19.7% (20th) |
| 3 | 19.4% (56th) | 20.2% (60th) | 12.8% (29th) | 16.2% (46th) | 25.1% (43rd) |
| 4 | 19.6% (75th) | 18.2% (79th) | 25.7% (48th) | 24.2% (66th) | 28.5% (69th) |
| 5 | 14.8% (93rd) | 11.7% (94th) | 39.3% (80th) | 22.2% (89th) | 16.4% (92nd) |
| N | 1,005,379 | 1,005,759 | 1,008,601 | 1,006,906 | 1,005,532 |
| Mean (SD) | 2.79 (1.38) | 2.69 (1.32) | 3.73 (1.33) | 3.15 (1.40) | 3.21 (1.23) |

The percentile in parentheses is the mid-rank, rounded. Agreeableness is the table that is easiest to misread. A scored 4, which is only a lean toward concern, is the 48th percentile. A scored 5 is the 80th, and 39% of the sample gave it. Neutral on that sentence is already a low standing (29th). The other four items use more of the scale. Conscientiousness has the largest standard deviation of the five (1.40).

### 3.3 The five answers are not one scale

Among 992,338 people who answered all five, the correlations of scored answers were:

**Table 3. Correlations of the five scored answers.**

|  | Stability | Agreeableness | Conscientiousness | Intellect |
|---|---:|---:|---:|---:|
| Extraversion | 0.13 | 0.07 | 0.02 | 0.02 |
| Emotional stability |  | −0.04 | 0.12 | 0.01 |
| Agreeableness |  |  | 0.04 | 0.04 |
| Conscientiousness |  |  |  | −0.06 |

A person high on one of these sentences is not, in this sample, high on the others. Adding the five numbers would manufacture a total that the correlations do not support. The app therefore refuses a total.

## 4. How to read an answer

Read the sentence before the trait name. The loading says the sentence moves with its factor. The words say what was actually asked.

Extraversion here is talking to unfamiliar people at parties. It is not dominance and not positive emotion. A low answer is reserve in that setting. Introversion is not a symptom, and the sentence does not mention fear, so it is not a screen for social anxiety.

Emotional stability here is the denial of getting stressed easily. A low scored answer means the person reports stress reactivity. Kotov, Gamez, Schmidt, and Watson (2010) found that diagnosed anxiety and depressive disorders sit about 1.65 standard deviations higher on neuroticism than controls, in studies that used real diagnostic assessments and multi-item personality scales. That figure is not the effect of this sentence. It is the reason a low answer should prompt a question about current distress, and the reason the answer must not be written down as a disorder.

Agreeableness here is concern for others. It is not politeness. Because the sample crowds the concerned end, only a clearly low answer is unusual. A warm answer is ordinary.

Conscientiousness here is putting things back where they belong. Barrick and Mount (1991) reported that conscientiousness, measured properly, is the Big Five trait most consistently related to job performance. This sentence is not that measure. A person can forget where they left a coat and still be careful about the things a clinic or an employer actually needs.

Intellect here is using difficult words. The IPIP domain also covers ideas and imagination. This item does not. It is not an intelligence test.

Woods and Hampson’s single items correlated about 0.60 with longer scales. These five were selected for a high loading on the same factor as a 10-item marker set, which is related evidence, not the same evidence. Squaring a pattern loading is not a reliability. No retest was available. When a decision hangs on the trait, use a longer public scale (the 10-item IPIP markers, the IPIP-NEO, or another instrument whose items the clinic is allowed to use).

## 5. The app

Open Screen is a small browser app in this directory. It has a library page and one measure. A measure is a JSON file: items, an open license, the response scale, and either per-item norms (`scoring: "markers"`) or subscale definitions (`scoring: "subscales"`). The loader refuses a measure that does not name an open license. Public domain, CC0, CC BY 4.0, MIT, BSD, Apache 2.0, and ISC are accepted. Proprietary item text is not.

The personality screen uses marker scoring. The page waits until all five sentences have an answer, then shows one histogram and one paragraph. Each cluster of bars is one sentence. Bar height is how often the reference sample gave that scored answer, on a shared scale, and the green bar is this person. The paragraph reads the five categories together. It does not repeat the sentences, and it does not add them into a score. Reverse-keyed sentences are labeled before the person answers, so disagreement is not mistaken for a low trait. Nothing is uploaded. Closing the tab clears the answers.

A five-point answer is shared by a wide band of people, so the app does not report a percentile rank. The categories use the boundaries already implied by Table 2: Low when the middle of that answer sits below the 35th percentile, High when it sits above the 65th, and Middle between them. Those cutoffs are fields in the measure file. A later screen can name its own categories and its own cutoffs, on a percentile or on a raw score, and can draw either sample frequencies or a line of score regions. The same comparison component renders both.

Scoring lives in `core/score.js`, which has no page and no network. It builds a five-row table for each item. A tap reads the row for that raw answer. The reverse key, the category, and the bar are already in the row. `node core/compile.js` writes the same table to `dist/personality-5.json`. A web app can import the module. An iOS, Mac, or Python app can bundle that JSON and index it. Those hosts do not recalculate the category. The percentile remains in the row as a number so it can be checked against Table 2. It is not the result the person sees. There is still no combined score.

The subscale scorer is present so a later screen can report a sum or a mean, place it in categories declared on that scale, and attach frequency bins or a range with cutoffs. It does not invent a percentile from a normal curve.

## 6. Limitations

These norms describe people who chose an online personality test. A clinic, a workplace, and a correctional setting will not have the same answer frequencies, and impression management will move some of these sentences. The agreeableness sentence will move first.

The screen has no criterion study of its own. No diagnosis, no job outcome, and no risk decision should be justified by it. The trait literature cited above is about other instruments. Using it as color for a sentence is fair. Treating a percentile on this screen as if it were a Kotov effect size is not.

Each sentence is narrower than its factor. That was visible in the loadings and it is stated in the item text on the screen. A low conscientiousness category here means the person says they forget to put things back. It does not mean anything else until someone asks.

The five-point scale in the data set left 2 and 4 unlabeled. The app keeps them unlabeled apart from the number. Adding words such as “slightly” would have made a different instrument from the one the norms belong to.

## 7. Conclusion

A minute-long personality screen can be made from public-domain sentences, provided it does not pretend to be a scale those sentences do not form. These five answers each separate people, they do not duplicate one another, and each one can be placed against the frequency of that answer in a public sample of about a million. The result is five standings, each no wider than its sentence, and a prompt for the question a clinician still has to ask.

## References

Barrick, M. R., & Mount, M. K. (1991). The Big Five personality dimensions and job performance: A meta-analysis. *Personnel Psychology, 44*(1), 1–26.

Goldberg, L. R. (1992). The development of markers for the Big-Five factor structure. *Psychological Assessment, 4*(1), 26–42.

Goldberg, L. R., Johnson, J. A., Eber, H. W., Hogan, R., Ashton, M. C., Cloninger, C. R., & Gough, H. C. (2006). The international personality item pool and the future of public-domain personality measures. *Journal of Research in Personality, 40*(1), 84–96.

Gosling, S. D., Rentfrow, P. J., & Swann, W. B., Jr. (2003). A very brief measure of the Big-Five personality domains. *Journal of Research in Personality, 37*(6), 504–528.

International Personality Item Pool. Big-Five factor markers. https://ipip.ori.org/newBigFive5broadKey.htm

John, O. P., Naumann, L. P., & Soto, C. J. (2008). Paradigm shift to the integrative Big Five trait taxonomy. In O. P. John, R. W. Robins, & L. A. Pervin (Eds.), *Handbook of personality: Theory and research* (3rd ed., pp. 114–158). Guilford Press.

Kotov, R., Gamez, W., Schmidt, F., & Watson, D. (2010). Linking “big” personality traits to anxiety, depressive, and substance use disorders: A meta-analysis. *Psychological Bulletin, 136*(5), 768–821.

Open-Source Psychometrics Project. (2018). *IPIP Big-Five factor markers, data release of 8 November 2018* [Data set]. https://openpsychometrics.org/_rawdata/IPIP-FFM-data-8Nov2018.zip

Ozer, D. J., & Benet-Martínez, V. (2006). Personality and the prediction of consequential outcomes. *Annual Review of Psychology, 57*, 401–421.

Rammstedt, B., & John, O. P. (2007). Measuring personality in one minute or less: A 10-item short version of the Big Five Inventory in English and German. *Journal of Research in Personality, 41*(1), 203–212.

Roberts, B. W., Kuncel, N. R., Shiner, R., Caspi, A., & Goldberg, L. R. (2007). The power of personality: The comparative validity of personality traits, socioeconomic status, and cognitive ability for predicting important life outcomes. *Perspectives on Psychological Science, 2*(4), 313–345.

Woods, S. A., & Hampson, S. E. (2005). Measuring the Big Five with single items using a bipolar response scale. *European Journal of Personality, 19*(5), 373–390.
