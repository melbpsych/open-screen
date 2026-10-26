# Configuration and questionnaire extension

The reference app reads `config/policy.json` and `questionnaires/registry.js` through `app-config.js`. Integrations pass their own complete policy and definitions to `createScreener`. These are reviewed application assets. Clinicians can save local practice preferences on the logic page; integrations pass an explicit policy to the pure API. There are no query-string overrides, remote downloads or executable expressions. Patient question screens do not expose configuration controls.

## Edit practice preferences in the browser

Open **Screening logic** from the library or sitting setup. Click a gate in the diagram or expand **Edit thresholds**. Changes preview immediately and remain unsaved until **Save draft revision**. Supply a revision name and rationale. Saving does not activate the draft: open **Settings revisions → Review revision**, compare with active values, record the reviewing clinician and explicitly **Activate reviewed revision**. Every field shows its project default and supported range. Additional rules and severity boundaries stay in separate disclosures; the final severity upper bound and published labels remain fixed. Registered additive questionnaires expose their gates, existing screen thresholds and severity boundaries automatically.

The main diagram uses one shared routing explanation. **Pathway notes** contains administration details and interpretation limits. Reset controls appear when a value differs from its default; saved differences remain in **Saved customisation record**.

Provide a short practice-level rationale, without patient information. Saved settings show a customisation badge, date, version and before/after values. **Export settings** saves the current configuration, rationale and complete difference list as JSON. It is disabled while there are unsaved edits. **Reset field** changes the draft; save, review and activate to apply it. **Reset to defaults** explicitly returns to the project defaults and discards unsaved edits; valid named revision history is retained. Reviewed revisions cannot be edited: load earlier values as a new draft and review again. Defaults mean the current project's reviewed `policy.json` and questionnaire registry, rather than a claim that every bundled choice is a universal published cutoff. **Discard edits** reloads saved settings.

Preferences persist only in this browser profile and origin, including its port; they are not synchronised between devices or installed into `policy.json`. The rationale, differences and effective configuration accompany clinical records: setup/review identify custom settings; copied summaries and HTML/print reports include the rationale; structured clinical JSON includes the immutable full policy and questionnaire snapshot. The settings download is a configuration record, not a supported import format or a signed audit log. Retain each desired revision in the practice's document system. The local journal is limited to 20 entries; export/archive through the deployment administrator when full. Reset to defaults remains available at capacity. Review identities are local workflow metadata, not authenticated role enforcement.

A new empty setup picks up settings saved in another tab while preserving context, selected areas and reference. New sittings read the latest saved settings. A sitting with responses, or a resumed file even before its first response, keeps its original configuration through edits, review, overrides and exports; **New sitting** adopts the latest preferences. An AUDIT-C selection removed by a changed allowed list is cleared in empty setup. The default AUDIT-C value can be left empty to require selection for each sitting, or explicitly set to a permitted value.

Storage contains a single schema-versioned settings journal: active pointer, up to 20 named revisions, review identity/date, and each revision’s reviewed-base signature, timestamp, rationale and whitelisted overrides. No patient responses, references or notes are stored there. `core/practice.js` constructs and validates a complete effective factory; arbitrary property paths, executable rules and safety-rule changes are unavailable. The envelope must match the current project defaults and registered questionnaire revisions. Invalid, corrupt, inaccessible or stale settings block new screening instead of silently falling back. The logic page offers an explicit reset for unreadable saved data. If browser storage is unavailable, enable storage for the local app before saving or starting a sitting. A failed write leaves the existing saved settings intact; competing editors must reload instead of silently overwriting each other. A valid reset preserves the journal and clears the active custom pointer. Corrupt/stale settings can be explicitly removed without clearing other storage. Legacy preferences remain active until explicitly reviewed or reset; use **Review legacy settings** to migrate them without silently changing values.

Custom thresholds can change sensitivity, specificity and interpretation. A valid numeric range is not clinical validation. The editor labels customisation and preserves provenance; the practice remains responsible for its rationale. Item wording, response scoring, trauma exposure stop, PHQ-9 item-9 safety pause, DASS multiplication and PCL cluster membership/count requirements remain fixed. The clinical/forensic context label does not create forensic calibration.

## Change the project defaults

Edit the JSON, change its `id` or `version`, and explain the decision in `rationale`. Run `npm run check:config`, then the relevant threshold-boundary tests and `npm run check`. Use a new factory/sitting and reload the reference app before beginning. Existing immutable records keep their original settings. The engine snapshots inputs; mutating a caller's policy object after registration has no effect.

| Setting | Meaning and validation |
| --- | --- |
| `defaults.context` | `null`, `clinical`, or `forensic`. `null` requires an explicit selection. |
| `defaults.topics` | Topics selected initially; registered IDs only. |
| `defaults.primaryTopics` | Which topics appear before Additional measures in setup. Other registered topics remain available in the disclosure. |
| `thresholds.depression.gate` / `anxiety.gate` | Inclusive brief-score thresholds, integer 0–6. Defaults remain 2. |
| `thresholds.depression.screen` / `anxiety.screen` | Inclusive full-screen thresholds, bounded by the full scale. Defaults remain 10. They are separate from severity bands. |
| PHQ/GAD `bands` | Ordered `[exclusiveUpperBound, label]` pairs. Cover the entire integer range, including the maximum: PHQ-9 ends at 28 and GAD-7 at 22. |
| `thresholds.alcohol.allowed` | Distinct permitted AUDIT-C thresholds, integers 0–12. Default published-reference choices remain 3 and 4. |
| `thresholds.alcohol.default` | `null` or an allowed value. Default `null` requires clinician selection for each new patient. |
| `thresholds.trauma.gate` | Inclusive PC-PTSD-5 gate, integer 0–5. Default remains 3. Exposure “no” still applies the published stop rule. |
| `thresholds.trauma.pclItem` | Item endorsement boundary for the cluster check, integer 1–4. Default 2 is the published rule. Other values produce a configured check, not that published DSM-5 rule. |
| `personality.followUpBands` | Any subset of `low`, `middle`, `high`. Default low/high. Empty disables automatic trait extensions. |
| `responsePatterns.screenMean` | Keyed-mean mark 1–5. Default 4 is a local descriptive rule, not a validated malingering cutoff. |
| Other `responsePatterns` settings | `poleRate` and `sameRate`: 0–1; `runLength`: 1–30; `withinSD`: 0–2. These control the existing descriptive pattern checks. |

All policy fields are required. Unknown keys, numeric strings, nonfinite values, duplicate choices, invalid IDs, and incomplete band coverage fail validation. This deliberately favors an explicit complete policy over a deep-merge system with hidden fallbacks. Registry membership is checked when the factory composes definitions with the policy, allowing registered additional questionnaires to be selected by default.

Mathematical validity does not establish clinical validity. A permitted custom cutoff is not automatically a recognized or locally validated threshold. PHQ/GAD evidence notes identify changed rules; the record and report expose the actual policy rather than continuing to describe it as the original default. Update the rationale and clinical scope when the intended clinical decision changes.

Published item wording, option scoring, PHQ-9 safety handling, DASS multiplication, and PCL cluster membership/count requirements are instrument definitions, not ordinary practice preferences. Their source locations are `gates/clinical.js`, `gates/instruments.js`, and `gates/validity.js`. Change those only as a reviewed instrument/algorithm revision, update the engine/rules version and supporting tests, and recheck rights and evidence. The personality screen's category cuts, item keys, norm counts, and interpretations already live in `measures/personality-5.json`; version the measure and regenerate `dist/` when changing it. Safety review and administration-rights requirements are not removable via a general policy switch.

## Add an ordinary additive questionnaire

Use this path for one raw integer total and, optionally, a shorter first stage whose items are shared with the full questionnaire. A questionnaire may use different coded options on different items, including explicit reverse keys. It does not impute missing answers, prorate totals, estimate diagnosis probabilities, or invent clinical bands.

1. Verify the exact form, locale, source, permission, response codes, scoring key, threshold evidence, population limits, and administration conditions.
2. Copy the structure of `examples/questionnaire.json` into `questionnaires/your-id.json`. That example is invented, explicitly nonclinical, and intentionally not registered in the practice app.
3. Give it a unique lowercase/hyphen ID and version. Item IDs must begin with `your-id-` and cannot collide with built-in response IDs. Set `value` to the original response code and `score` to its keyed contribution. Contributions are nonnegative integers; ordinary additive-total items must offer a zero-scoring option. Explicit multi-scale profiles can retain 1–5 keys and their actual minimum. The current reference controls support at most 12 options, but keyboards provide numeric shortcuts only for the first nine.
4. Set `source.citation`, HTTPS `source.url`, and `source.limits`; provide a supported open `license.id`, HTTPS license URL and attribution. Add explicit `requirements` when administration depends on confirmations. The engine checks recorded confirmations; it cannot establish whether a license statement is truthful or a patient belongs to a defined group.
5. If there is a validated brief/full sequence, set `gate.itemCount`, `gate.threshold`, and `gate.title`. The first `itemCount` items form the brief score. The remaining full items appear only when indicated or clinician-requested. Do not build a novel brief scale by arbitrarily deleting published items. Omit `gate` for a one-stage questionnaire.
6. Optionally declare source-supported `bands` and `screenAt`. Omit them when no supported classification is appropriate. `max` and the brief maximum are derived from item options, not independently entered.
7. Register it:

```js
// questionnaires/registry.js
import yourQuestionnaire from "./your-id.json" with { type: "json" }
export const questionnaires = [yourQuestionnaire]
```

The setup options, administration confirmations, questions, clinician override, review panels, sources, concise summary, printable/offline HTML, and structured JSON discover the registered definition automatically. Add the ID to policy defaults or primary topics only if that is the desired practice workflow.

Add tests for missing and invalid responses; every gate/classification boundary; reverse scoring using original response codes; carried-forward items; response edits closing gates; administration requirements; and expected report/JSON output. Keep expected values independent of the production calculation. Extend the synthetic registry case in `tests/e2e/configuration.spec.mjs` for the new workflow, then run `npm run verify` with the prerequisites in [E2E.md](E2E.md). Check long labels at setup and in reports as well as ordinary metadata. Registration validates shape and collisions, not psychometric properties or publication rights.

## When an explicit adapter is appropriate

Multi-subscale measures, prerequisite exposure rules, weighted or norm-based algorithms, noninteger contributions, conditional dependencies between distinct instruments, safety-critical interruptions, and copyrighted/limited-use instrument workflows need a small explicit adapter and tests. The current generic definition format intentionally does not model them. Existing trauma, DASS, personality and response-pattern modules demonstrate this boundary. Their addition can require engine/API/UI changes; do not advertise arbitrary questionnaire algorithms as configuration-only plugins.

This is a single source-tree registry and a small factory, not a remotely extensible marketplace or an arbitrary-code sandbox. Once a second concrete complex adapter needs the same interface, extract that shared contract; do not design an elaborate plugin framework in advance.

## Multi-scale profiles and reviewed algorithms

See [MEASURES.md](MEASURES.md) for the registered forms and the extended public contract. A definition can declare `scales: [{ id, label, itemIds, level? }]` to report separate keyed sums and means. Every item must belong to at least one scale; a scale cannot contain duplicate or unknown item IDs. A profile cannot also declare a grand-total cutoff, gate or severity bands. `phase: 2` places a long optional profile after all selected brief screens. No norms are inferred from the response range.

`formChoices` declares mutually exclusive forms; the clinician supplies `setup.forms[questionnaireId]`. TAPS has explicit male/female US alcohol variants and a locale-suitability acknowledgement. These reset per patient. Its class-specific skips and ASRS's item-specific endorsement rules are explicit adapters, fixed to the reviewed definitions. Their published thresholds are not ordinary practice preferences. The specific NYU six-item permission is not added to the general open-licence list. Definitions and rights are versioned assets, not browser toggles.

Settings writes use the browser's Web Locks API to serialise cooperating tabs,
then compare the exact previously read value before the single journal write.
Simultaneous stale writers are rejected. Browsers without Web Locks cannot save
settings rather than use an unsafe fallback. Anyone with developer tools can
still edit local storage; this is coordination, not an administrator security
boundary. Real shared practice governance belongs in the authenticated host.
