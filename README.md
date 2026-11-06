# Open Screen

Local screening tools for adult clinical and forensic psychology practice. The clinical sitting begins with brief screens, shows initial findings, and offers a choice of longer questionnaires before continuing. The five-item personality screen remains a separate tool, described in `PAPER.md`.

The implementation and its evidence limits are described in [docs/CLINICAL_SCOPE.md](docs/CLINICAL_SCOPE.md). The dated project audit, goal, and acceptance checklist are in [COMPLETION.md](COMPLETION.md). Reading, keyboard, focus and responsive behavior are documented in [docs/ACCESSIBILITY.md](docs/ACCESSIBILITY.md).

The default clinical sitting is PHQ-2 → PHQ-9, GAD-2 → GAD-7, and exposure → PC-PTSD-5 → PCL-5. Optional alcohol screening is AUDIT-C → AUDIT. All brief items come before follow-ups, and shared items are carried forward. IPIP personality, response-pattern items, and conditional DASS-21 Stress remain optional. These produce distinct results; there is no total across domains.

Additional optional measures now include ASRS-v1.1 ADHD screening, two-stage TAPS substance screening, DSS-B dissociation, Mini-IPIP, IPIP-NEO-120 and four complete CAT-PD trait scales from the IPIP-hosted key. Trait profiles have separate raw means and sums, with no clinical cutoffs. TAPS preserves the original US form and requires clinician selection of its alcohol variant and confirmation of locale suitability. SCI sleep, OCI OCD, WHODAS functioning and WHO ASSIST have external-resource links and clinician result fields pending electronic-use permission. Exact versions, permissions, scoring and limits are in [docs/MEASURES.md](docs/MEASURES.md).

A response is one array lookup. `prepare()` builds a five-row table for each item. The row for a tap of 1 through 5 is `item.byRaw[raw - 1]`. The reverse key, the category, and the norm graph are already in that row. Nothing is uploaded, and the five answers are not added into a total. The bundled page shows the graph only after every item has an answer.

The browser app prepares the source JSON when it loads, so an edit to `measures/` shows up on the next refresh. Other languages ship the compiled file in `dist/` and only index it. They do not recompute percentiles.

## Try it

The [public evaluation demo](https://melbpsych.github.io/open-screen/) is for **synthetic data only**. It excludes DASS administration. Do not enter patient information, upload clinical recovery files, or use the public site for clinical care. GitHub logs visitors' IP addresses; the demo is not an authenticated patient service.

For supervised local evaluation, use the instructions below. This is screening software, not a diagnostic service. Independent clinical review, human accessibility acceptance and receiving-system verification remain open in [practice readiness](docs/PRACTICE_READINESS.md). The five-item personality reference frequencies are exploratory volunteer data, not clinical norms.

## Run the browser app

```bash
git clone https://github.com/melbpsych/open-screen.git
cd open-screen
python3 serve.py
```

Open [http://127.0.0.1:8765/](http://127.0.0.1:8765/). Python 3.9+ is enough to run the app; `npm start` is an equivalent shortcut if Node is installed. Do not open `index.html` directly as a file. The homepage starts an assessment (`interview.html`), where personality and other measures are selected together. The original standalone personality screen remains under More tools. `npm start` uses Python's standard library, binds only to this machine, and disables caching during development. No dependency installation or build is required. Use Node 22 or later for the tests and a current browser supporting JavaScript modules and JSON imports.

The [screening logic page](logic.html) gives a visual overview of brief gates, follow-ups, clinician overrides and optional measures. Click a gate or open **Edit thresholds** to preview and save browser-local practice preferences, with a required rationale, visible defaults, a downloadable change record and field/full resets. Its labels come from the same validated policy and questionnaire registry as the sitting. New sittings use saved preferences; existing sittings with answers retain their original configuration. Open it from the library or from sitting setup, where it opens a separate tab to preserve the setup.

The sitting includes the publisher's Australian-English PHQ-9 and GAD-7 forms; the source PDFs are in `docs/sources/`. The publisher's instruction manual explicitly permits their reproduction. AUDIT requires confirmation that no fee is charged to complete the questionnaire. DASS-21 Stress requires its defined-group, clinician-results, and not-sold conditions. The Columbia form, K10, and ASSIST remain external instruments; their item text is not copied. The personality engine's `OPEN_LICENSES` and the personality data are unchanged. Clinical definitions are separate from the personality registry.

Questions use direct missing-answer, pause and clinician-review controls. After brief screening, initial findings and suggested extensions appear with remaining questions and rough time estimates; the clinician chooses which to continue. Completed questionnaires retain their clinician handoff and separate full results. This is a physical handoff on one device, not an authenticated patient portal. Answers remain in tab memory until an explicit export. **Menu → Save** creates a passphrase-protected file for recovery; **Menu → Resume** requires the passphrase and patient-reference confirmation. Reports/JSON/clipboard remain unencrypted clinical exports. Risk assessment and recording are optional at clinician discretion. PHQ-9 item 9 does not interrupt screening. Recorded endorsements, corrections and existing notes remain available without imposing forms or a review gate. Forensic mode records the setting and the limits of transferring thresholds; it does not claim forensic calibration or replace a forensic assessment.

Choosing an answer advances immediately to the next clinical question. Back restores the previous response for editing; free-text questions retain Continue. The next heading receives focus. Screening continues normally after any answer.

Results lead with scores and **Copy summary** for pasting into clinical notes. Charts expand from each row. **Notes & final record** holds optional notes, risk documentation and final-record controls; it stays collapsed until opened. **Save & export** groups encrypted recovery, clinical reports and structured data. It offers an offline HTML report, structured JSON, full record text and A4 print output with the same score charts. Export PDF includes the full response appendix. The appendix is optional for HTML and JSON. Sources and detailed scoring notes remain available. An optional practice reference and clinician notes appear in reports. New sitting clears answers, references, notes, safety state, and one-off follow-up overrides; selected topics and practice administration conditions remain, while the AUDIT-C threshold must be chosen again for the next patient unless an explicit practice default is configured. Patient-specific TAPS form selection and its acknowledgement are cleared.

The assessment header has one **Menu** for navigation, Save/Resume and secondary setup pages. Measures appear first; preparation, source details and saved presets expand on request. Enter a reference before answering if history is needed: it locks after the first response. Selected modules remain named in reports even when unscorable. Forensic review includes participation/notification; PCL comparisons require the same explicitly recorded event reference.

Engine **0.5.0**, rules **2026-10-30**, deliberately refuses older encrypted assessments. Open those with their original release; no silent migration is provided. [Review implementation](docs/REVIEW_IMPLEMENTATION_2026-10-30.md) maps every adversarial finding to its correction and remaining human acceptance work.

## First assessment

1. Open **New assessment**, choose Clinical or Forensic, and select the measures needed. Start with the defaults for a short evaluation.
2. For a synthetic walkthrough, use a reference such as `SYNTHETIC-001`. Confirm any measure-specific administration conditions, then select **Continue to Ready → Start assessment**.
3. Selecting an answer advances. **Back** edits a response; missing-answer controls record missingness. After brief screens, choose any offered full questionnaires.
4. Select **Review clinician record**. **Copy summary** produces text for existing notes; **Export PDF** opens the browser print flow. Optional notes and final-record controls are under **Notes & final record**.
5. To resume later, use **Menu → Save** and keep the encrypted `.openscreen` file and its passphrase securely. Use **Resume assessment** on the same engine release and confirm the reference. Closing or refreshing loses unsaved answers. Ordinary HTML, JSON, PDF and clipboard exports are unencrypted.

Use only synthetic responses while evaluating. The patient/clinician handoff on this device does not authenticate either person. Run approved clinical use locally only after completing the practice's acceptance and record-handling process.

## Licensing and public hosting

The original software's reuse rights are currently reserved pending an owner-selected licence; see [software rights](LICENSE.md). This is a public source release, not a blanket open-source grant. Questionnaire permissions are separate. See [third-party notices](THIRD_PARTY_NOTICES.md) for the instrument-by-instrument conditions and [measure evidence](docs/MEASURES.md) for exact versions. A software licence never grants additional rights over included questionnaires. ASRS requires attribution and unchanged content; AUDIT has a no-fee condition; DASS has restricted online administration conditions. SCI, OCI, WHODAS and ASSIST questions are not included.

Do not enable GitHub Pages from the repository root. Use the reviewed, allowlisted demo build and deployment workflow in [public hosting](docs/PUBLIC_HOSTING.md); the full local application includes DASS, which the publisher excludes from public-facing administration. `package.json` stays private to prevent accidental npm publication.

## User guidance

Open **Help** in the app for the [user guide](help.html): preparation, answering, optional notes, finalisation, encrypted recovery, repeat monitoring, practice settings and troubleshooting. Help from a clinical sitting opens a separate tab. The guide also works without JavaScript. [Design system](docs/DESIGN_SYSTEM.md) describes shared UI rules and [accessibility notes](docs/ACCESSIBILITY.md) record verification and human acceptance still needed.

The [workflow research](docs/UX_RESEARCH.md) compares Mobbin references across setup, answering, handoff, review, reports, recovery, history, settings and help, with proposed changes and explicit clinical-evidence gaps.

The [clinical evidence review](docs/CLINICAL_EVIDENCE_REVIEW.md) explains intended
uses, population/forensic limits, safety pathways and permission-checked candidates
for future additions. [Component research](docs/COMPONENT_RESEARCH.md) records the
Mobbin references behind navigation, action and validation refinements.

## Developer entry points

The clinical API is now versioned and configurable. Start with [the developer guide](docs/DEVELOPMENT.md), [configuration and adding questionnaires](docs/CONFIGURATION.md), [the architecture review](docs/ARCHITECTURE_REVIEW.md), and [security boundaries](docs/SECURITY.md).

```js
import { createScreener, exportJSON } from "./api.js"

const screener = createScreener()
const setup = screener.createSetup({ context: "clinical" })
const question = screener.nextStep(setup, {})
// Render the complete question, including stem/examples; store the original option.value.
const record = screener.record(setup, {}, { reference: "SYNTHETIC-001" })
const json = exportJSON(record)
```

`config/policy.json` controls practice defaults and decision thresholds. `questionnaires/registry.js` registers reviewed additive questionnaires and trait profiles; their controls, routing and reports are discovered automatically. Complex published algorithms stay explicit adapters. Pass the exported registry to `createScreener({ questionnaires })` in an integration to include the same optional measures. Bare `createScreener()` retains its existing built-ins. Configuration is validated and snapshotted per factory, with no global policy mutation. Structured JSON captures the engine, policy and questionnaire versions; original responses are an explicit export option. `examples/integration.ts` checks the package's TypeScript contracts. The runtime still has no third-party dependencies or build requirement.

## Frontend structure

`bootstrap.js` handles startup loading/configuration failures. `app-config.js` composes the validated browser policy and registry. `api.js` is the versioned, DOM-free integration boundary. `ui.js` contains shared DOM, navigation, icons, radio-group keyboard behavior, and clipboard handling. `app.js` handles the library and personality screen. `interview.js` handles the setup, questionnaire, handoff, and record. `review-ui.js` renders result, correction and export controls; `core/workflow.js` preserves optional clinical documentation and provenance. `presentation.js` supplies the shared score charts, personality histograms, concise clinical summary, and self-contained HTML report; screen and export use the same result model. Styles are shared in `styles.css`, with interview-specific layouts in `interview.css`. No framework, remote fonts, analytics, or backend is required.

## Check

```bash
npm ci
npm run check
```

That validates configuration, checks the public TypeScript integration example, and runs the personality, gate, and clinical tests, verifies `dist/` without rewriting it, exercises local HTTP security protections, and checks the Python reader against the mixed sample (raw answers 4, 5, 1, 2, 3). Clinical tests cover gate boundaries, full-screen severity bands, missing/invalid answers, shared-item carry-forward, stage ordering, clinician overrides, edits closing a gate, retained safety flags, and exported records. See [docs/VERIFICATION.md](docs/VERIFICATION.md) for browser checks.

For real browser regression tests, install the browser binaries and run:

```bash
npx playwright install --with-deps chromium firefox webkit
npm run verify
```

See [docs/E2E.md](docs/E2E.md) for system prerequisites, desktop and phone coverage, generated reports and focused test commands. Playwright and axe are development dependencies; the app runtime remains dependency-free.

## Legacy personality integrations

Raw answers are the button the person tapped: 1 is Disagree, 3 is Neutral, 5 is Agree. 2 and 4 stay unlabeled. Pass that raw number. Do not reverse it yourself.

### Web, React Native, or Electron

Copy `core/score.js` and `measures/personality-5.json`.

```js
import source from "./measures/personality-5.json" with { type: "json" }
import { prepare, score, scoreItem } from "./core/score.js"

const measure = prepare(source)
const one = scoreItem(measure.itemsById.EST1, 5)
const all = score(measure, { EXT7: 4, EST1: 5, AGR1: 1, CSN6: 2, OPN8: 3 })
```

`one.headline` is `"Low"`. Agreeing with the stress sentence is the low category, because that item is reverse keyed. `one.comparison.bins` is that item's place in the reference sample. `all.results` has one row per item. `all.total` is absent.

When every row is scored, `profile(measure, answers)` is the combined view: `groups` for one histogram on a shared `ceiling`, and `analysis` for a single paragraph. The paragraph does not add the rows into a score. The bundled page draws that view only after the last answer.

`prepare()` runs once. Each later tap is the index into `byRaw`. The row does not present a percentile. A five-point answer is too coarse for one.

### iOS or Mac

Bundle `dist/personality-5.json` and add `ports/OpenScreen.swift`.

```swift
let screen = try OpenScreen(json: data)
let row = screen.score(itemId: "EST1", raw: 5)
```

`row?["headline"]` is `"Low"`. `row?["comparison"]` is the graph. The file must be the compiled JSON. A source file, which has no `byRaw` table, is refused.

### Python or another desktop host

```python
import json
from open_screen import score

measure = json.load(open("dist/personality-5.json"))
result = score(measure, {"EXT7": 4, "EST1": 5, "AGR1": 1, "CSN6": 2, "OPN8": 3})
```

`ports/open_screen.py` is the reader. Run it with `ports/` on the path, as `ports/test_score.py` does.

## What a scored row contains

| Field | Meaning |
| --- | --- |
| `headline` | The category, such as `Low`, `Middle`, or `High` |
| `comparison` | The graph. `distribution` bins are sized by the reference sample. `scale` is a line of cutoff regions with a marker. |
| `keyed` | 1–5 after the reverse key |
| `band` | The category id |
| `common` | True when at least 25% of the reference sample gave this scored answer. A measure can set `commonAt`. |
| `detail` | The sentence under the graph, including the common-answer note |
| `text` | The reading for this scored answer |
| `glance` | Category and the share of the sample |
| `percentile` | Stored so it can be checked. Not the result to show. |
| `followUp` | One question to ask next |

## Add a measure

1. Add `measures/<id>.json`. Copy the shape of `measures/personality-5.json`.
2. Set `license` to `public-domain`, `CC0`, `CC-BY-4.0`, `MIT`, `BSD-2-Clause`, `BSD-3-Clause`, `Apache-2.0`, or `ISC`. Anything else is refused.
3. Choose a scoring mode and declare `categories`. The first matching cutoff wins. A category with no cutoff is the remainder.
   - `percentileBelow` and `percentileAtMost` place a marker answer by where it sits in the sample.
   - `scoreBelow` and `scoreAtMost` place a raw or summed score. Use these for a screener that already has cutoffs.
   - `markers`: each item is its own result. Provide five norm counts, for scored answers 1 through 5, and a `read` entry for each of those answers. The graph is a distribution.
   - `subscales`: list `subscales`, each with `itemIds`. Set `score` to `sum` or leave it as a mean. Add `range` to draw cutoff regions, or `norms.bins` (`label`, `from`, `to`, `count`) to draw a norm comparison. The core does not invent a percentile. The Python and Swift readers currently score marker measures only.
4. Import the JSON in `measures/registry.js` and add it to `incoming`.
5. Run `npm run compile` to regenerate `dist/<id>.json`, then `npm run check`. Tests verify the compiled artifact without rewriting it.

Items need a source you are allowed to ship. IPIP sentences are public domain. Do not paste copyrighted inventory items.


Practice workflows now include named selection templates, measure search and burden/timeframe details, draft/final clinician attestation, and compatible assessment-history graphs. Corrections reopen a draft while preserving the prior final version in the encrypted sitting file. Only the latest final revision of each sitting is compared; brief/full forms stay separate and changed settings are disclosed. This is local attestation, not authenticated identity or proof of clinical validity.

Settings use named draft revisions with before/after comparison, clinician review and explicit activation. Published fixed-form algorithms remain locked. See [configuration](docs/CONFIGURATION.md), [recovery and history](docs/WORKFLOWS.md), [Praxi integration](docs/PRAXI_INTEGRATION.md) and the [definition of done](docs/PRACTICE_READINESS.md). Independent clinical verification, human accessibility testing, remaining rights-holder permissions and the receiving Praxi implementation remain acceptance requirements; prepared review packs are in [docs/acceptance](docs/acceptance/CLINICAL_REVIEW.md).
