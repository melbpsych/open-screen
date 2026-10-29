# Navigation, controls and feedback

29 October 2026. This extends UX_RESEARCH.md's workflow research with nine Mobbin
screen searches: 28 inspected preview frames from 27 products. The targets were
navigation, action hierarchy, form controls, validation, warnings and destructive
actions. Three references are iOS screens; the remaining 25 are web screens.
These are visual precedents, not interaction testing or clinical evidence.

## Scope and baseline

The job is to move between assessment, rule review and guidance, make a deliberate
action, and correct a failed field without losing the current sitting. Baselines
were captured before changes. The green/paper palette, local fonts, spacing
tokens, routes, existing functions and dependencies remain. No questionnaire
wording, score, threshold, copyright condition or safety rule changes in this
component pass. The user explicitly requested shared component changes across
the app; the minimal homepage and patient navigation boundary remain intact.

The audit found a missing Logic destination/current-page state, a misleading Home
highlight on the standalone personality screen, inconsistent action treatments,
field failures shown only at the bottom of a form, and asynchronous encryption
with an unchanged submit label. Template actions could also be enabled before a
saved template was selected. Untouched required fields must not look erroneous
when a screen first opens.

## Research decisions

| Problem and decision | Inspected reference | Applied scope |
| --- | --- | --- |
| Show the current destination in the existing text navigation | [Bonsai](https://mobbin.com/screens/2d4fef8f-eaca-4fe7-8528-54509e33e57a) underlines the active Account tab and marks the selected settings area; [Teachable](https://mobbin.com/screens/b23496e7-950c-457d-91de-a737da80fef1) underlines the active Preferences section | Keep the existing underline/text system. Add Logic to the shared navigation and static guide; stop identifying a personality tool as Home. Route placement/labels are our product decision. |
| Distinguish the main action from secondary actions | [Skiff](https://mobbin.com/screens/932a110c-8d32-4c55-9eab-79c877ebafa4) has filled Next and white Back; [Cloudflare](https://mobbin.com/screens/aa928ac1-4a1d-4b8c-9ccb-be35211cdca8) separates Cancel from a coloured Delete action | Standard action tokens for primary/secondary/disabled buttons; a separate text colour for existing destructive actions. Preserve native New sitting confirmation. No new deletion wizard or typed confirmation. |
| Put a correction beside its field | [Square](https://mobbin.com/screens/2d04b11c-f3d4-4937-a056-1e1898bec97d), [Substack](https://mobbin.com/screens/286c847a-7843-4ff8-a13f-4fd526bd635f) and [Copy.ai](https://mobbin.com/screens/4ab58eec-6cef-4abc-b172-e8943044e1ae) show an outlined invalid field and an adjacent message; [Cal AI, iOS](https://mobbin.com/screens/c486705e-4e8b-4ca3-8420-e6cda8d122bf) shows the same on a phone | Add persistent field errors, aria-invalid and described-by association without replacing hints. Focus the first failed field on submission; clear corrected errors. Native constraints and existing domain validators remain authoritative. |
| Keep warning and error meanings separate | [Featurebase](https://mobbin.com/screens/1c514e72-6d0c-4494-88f0-257c73f1a11d) places an amber deletion warning beside its affected action; Square's field error is red | Keep existing amber safety/forensic warnings; use shared error tokens for failed operations/fields. This is one warning example, not a clinical risk taxonomy. No dismissible safety warning or red/yellow/green suicide-risk score. |
| Make pending and unavailable actions explicit | Existing asynchronous encryption code and the actual template controls; the action hierarchy above supplies the visual treatment | Encrypting/Unlocking labels and aria-busy accompany the existing disabled submit. Cancel remains available. Template Apply/Delete remain disabled until a template is selected. Pending wording and selection-dependent behaviour are engineering decisions, not observations of the reference products. |

The selected direction is text-labelled navigation, one filled main action,
quiet secondary controls and local field feedback. Sidebar workspaces, command
menus and toast-only validation were not adopted. Reference products outside
healthcare supply component structure only. Their branding, authentication,
security claims, copy and commercial features are not imported.

## Queries and gaps

The searches were settings with navigation/save; form validation; warning banners;
healthcare portal navigation; healthcare validation; destructive confirmation;
iOS validation; navigation; and primary/secondary form buttons. All returned
images were inspected. The healthcare searches returned loose matches rather
than suitable clinical components. They do not establish healthcare precedent.

The navigation pull's [Plane](https://mobbin.com/screens/4e470194-2515-466f-a4e6-f8bae56a7bda),
[hilos](https://mobbin.com/screens/e717f198-d5a6-4700-90e2-96ddadb0de73) and
[Square](https://mobbin.com/screens/d7c4a637-4734-4035-8317-71283e973e78) examples use larger sidebars or
command search. They are documented as alternatives, not adopted references for
the current small navigation. The two settings examples above support a visible
selected state; the decision to retain the current top row is ours. [inDrive's iOS example](https://mobbin.com/screens/853b177e-0f35-4bbc-aa25-b96a60431ada) uses stacked error toasts which can cover its form; we used its
adjacent-error concept only as corroboration, not its toast arrangement. [IMDb's iOS multi-rule username checklist](https://mobbin.com/screens/09c297ec-13b9-4280-a384-638e0909cb40) is unnecessary for these forms. No appropriate
clinical risk-warning precedent was established in this component search.

The private, ignored bundle is `artifacts/design-review/components/`:
`research.json` records exact queries, products and canonical links; `references/`
contains seven full-resolution source frames; `before/` and `after/` contain
actual app captures. `comparison.html` embeds its before/after images and links
to Square/Substack; `comparison.png` is the checked double-scale render. Its
outline identifies the whole captured form state, not inferred field coordinates.
No Mobbin image is a production app asset or clinical source.

## Implementation and checks

`ui.js` provides field feedback and delegated native validation so replacement
forms inherit the same behaviour. It does not contain clinical rules. Existing
instructions stay in aria-describedby; error text sits outside a wrapping label
so it does not silently change the field's name. A failed submission reveals the
first invalid field's disclosure and focuses that field. Required-field errors
are not shown on initial render. Authentication/file errors remain operation
errors when they cannot truthfully be assigned to a single field.

Shared action classes use the existing design tokens. Published answer controls
and automatic/manual advancement remain independent. Four browser scenarios
cover navigation/current states at 320px with enlarged text, native and business
field errors/recovery, threshold errors and revision requirements, and observable
encryption pending state/cancellation. Existing tests cover reset, safety,
forensic review, downloads/PDFs, touch/keyboard, text spacing and forced colours.
The initial component-only full matrix passed 424/424; subsequent clinical-copy
changes and their final verification are recorded in VERIFICATION.md.

T3 preview/open and inline HTML preview/render returned Authentication required.
The repository's Playwright workflow supplied the actual screenshots and board
capture. Human assistive-technology and physical-device acceptance remain open.


## Compact visual refinement · 29 October 2026

The audit addressed the user's concern that the interface looked improvised.
The baseline had oversized serif titles, tall filled selection rows, setup
utilities before selection, and scores below tasks on a long review page. The
authorised scope was shared visual design, preserving the green accent, minimal
homepage, full clinical content and all workflows.

Three additional searches returned eight inspected web frames from seven products:
`Linear project settings` (two Linear screens); `form with selectable rows`
(HoneyBook, 7shifts, Square); `healthcare assessment results` (Searchable, Base44,
Sprig). Two Linear screens are not independent precedents. Healthcare matches
were weak: Searchable concerns website health, Base44 concerns an app scan, and
Sprig concerns surveys. None establishes clinical presentation or validity.

The adopted structure is compact settings and a plain selectable list:

- [Linear](https://mobbin.com/screens/fea37c46-ab06-4d46-86c7-333ffb0db455)
  supplies compact sans headings, grouped settings and label/value alignment.
  A second [Linear frame](https://mobbin.com/screens/f3134ca3-b7e5-47ab-a283-92ce2db403db)
  shows the same product's treatment.
- [Square](https://mobbin.com/screens/321c446f-30d6-4275-bd0e-f404cc87d862)
  supplies plain checkbox rows and separators without whole-row pastel cards.
- [7shifts](https://mobbin.com/screens/511744ee-ff93-4b67-a1a6-f7693b3942ec)
  supports grouped selection and one primary Continue action. HoneyBook's larger
  service cards were not adopted because they increase setup height.

These references supply structure only. Setting beside the heading, results/task
columns and clinical interpretation are our product decisions, not observations
about those products. The five implementation moves are shared sans typography
and neutral text; compact setup with utilities after Begin; results beside
review tasks; bounded question/answer layouts; and matching logic/help/dialog
components. No questionnaire, scoring/defaults, licensed wording, telemetry or
framework was introduced.

`artifacts/design-review/visual-refinement/` retains pre-edit source files, actual
desktop/phone captures, browser-measured bounds and a self-contained setup
comparison. The comparison uses the skill's unmodified board template; blue
annotations sit outside the product. Full question text, selection, keyboard
targets, warnings and expanded states are checked separately. Native T3 preview
and inline HTML tools returned `Authentication required`; the documented
repository Playwright workflow supplied actual captures.


## Guided assessment and review · 30 October 2026

Six additional Mobbin queries returned ten web screens and two iOS flows. All
ten screen previews and five sampled flow frames were inspected: 15 images from
11 products. The iOS flow results contain eight screens in total; only the five
supplied preview frames are claimed as inspected. Hims/Hers are related products.
The requested scope was assessment starting points, catalogue selection, repeated
question instructions, review graphs, workflow status and final saving. Exact
pre-edit source and real before/after states were frozen under ignored
`artifacts/design-review/guided-assessment/`.

The chosen structure is labelled choices, compact overview and full detail:

- [Klaviyo](https://mobbin.com/screens/ebd53229-ed98-4828-a9dd-27e6135a20f0)
  shows labelled form-type choices before creation;
  [Basecamp](https://mobbin.com/screens/5430cba6-299b-4aba-b8c8-5570f9ba001a)
  shows deliberate template exclusions. They inform explicit configuration
  choices, not a new clinical preset or the exact card layout.
- [Hims](https://mobbin.com/screens/e44f9d72-4ecb-4c42-9211-18ed3728323c)
  and [Hers](https://mobbin.com/screens/eeab0e2f-8ace-4f94-b1ee-e1d482512238)
  use bounded question tasks and clear answer choices. The decision to reduce
  repeated visual instructions while retaining accessible descriptions is ours.
- [Bevel, iOS](https://mobbin.com/flows/bcb74637-8d36-4b58-8e62-99e88312cb98),
  sampled frames 1/4/6, separates record overview from value/range detail and
  names a questionable extracted value locally. We adopt value/range placement,
  not automated extraction or its medical interpretations.
  [Perplexity](https://mobbin.com/screens/7e1d573a-6062-4c81-b4e9-b5d6a9fe46db)
  supplies small per-metric overview charts. No chatbot, generated health advice
  or aggregate health score is imported.
- [Adaline](https://mobbin.com/screens/bb39ed29-a03c-4516-9951-420e326da441)
  and [HoneyBook](https://mobbin.com/screens/7c915d6b-2a99-4eb0-956d-e7a3a97bb265)
  explicitly distinguish complete and outstanding workflow tasks. The three
  assessment states and their validation rules remain Open Screen decisions.

The web healthcare-results pulls also returned Hers hair-treatment marketing and
Searchable technical audits. These were rejected as clinical-result references.
Sprig's survey bars are not clinical evidence. The pliability iOS flow's combined
mobility score was not adopted for psychological measures. The queries and exact
result metadata are retained in research.json and completion-research.json. These products lend interface
structure only; they do not establish clinical validity, licensing or usability
for psychologists.

Five concrete moves were implemented: validated practice shortcuts; grouped
catalogue/search; quieter repeated instructions; per-instrument preview plots
with mobile review tasks first; and explicit workflow/save states. All graphs
reuse the tested raw-score model and retain text equivalents. No questionnaire,
default threshold, score, schema or version changed. No raster image is needed
for these tasks; SVG plots/icons and the existing workflow diagram are functional
graphics. No source screenshot is a production asset.

comparison.html embeds actual review-viewport images and browser-measured bounds;
comparison.png is its double-scale capture. T3 HTML preview checked the inline
version at 1100px with no console messages. Desktop and phone captures also show
setup with a synthetic preset, full review and finalised state.
