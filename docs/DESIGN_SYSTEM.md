# Open Screen design system

## Current screening workflow · 30 October 2026

Risk and clinical documentation are optional at clinician discretion. Screening
continues after PHQ-9 item 9 without an interruption. Results provide Copy summary
and Export PDF immediately. Notes & final record stays collapsed; Risk notes
(optional) offers one text field, with legacy structured details available only
on request. Empty risk fields do not generate banners, checklist tasks or report
placeholders. Documentation does not block finalisation, including forensic
context, missing-answer acknowledgements or partial follow-up plans. A named
reviewer and completed questions are still needed when choosing a final record;
explicit omissions remain unscored. Existing observations, amendments, historical
notes and encrypted files remain intact. The sections below include historical
implementation descriptions superseded by this workflow.


Reference implementation: `styles.css`, shared DOM primitives in `ui.js`, clinical
components in `interview.css`, logic in `logic.css`, and guidance in `help.css`.
Offline clinical output has its own self-contained styles in `presentation.js`:
changes affecting clinical meaning must be checked in both screen and report.

## Visual language

Use neutral paper and white surfaces, dark neutral text and the existing green
action accent. The local sans stack carries headings, questions, controls and
numbers. Serif typography is reserved for existing self-contained report output.
No remote fonts, decorative illustrations, gradients or animation are required.
Keep one clear primary action per task. Fold secondary explanation into native
`details`, but keep safety findings, incomplete work and save state visible.

| Token | Purpose |
| --- | --- |
| `--paper`, `--card`, `--soft` | Page, surface and quiet emphasis |
| `--ink`, `--muted`, `--faint` | Main and supporting text; faint still needs readable contrast |
| `--accent`, `--accent-ink`, `--accent-hover` | Selected state, primary action and hover |
| `--warn`, `--warn-soft` | Safety and caution with explicit text |
| `--line`, `--control-border` | Decorative separators versus visible control boundaries |
| `--focus`, `--selection` | Keyboard outline and selected text |
| `--serif`, `--sans` | Local font stacks; never depend on a downloaded font |
| `--space-1/2/3/4/6/8` | .25/.5/.75/1/1.5/2rem spacing steps |
| `--radius-control`, `--target` | Standard 6px control radius and 44px target height |

Shared tokens are defined once at `:root`. Component-specific sizes may differ
where an existing clinical layout requires them. Introduce a new semantic token
only for a repeated purpose; avoid aliases for every CSS value. The historic
profile preview and chart palettes have additional domain-specific shades.

## Components and states

- **Navigation:** shared `header()` identifies the current page; Help occupies the
  same position. Clinical Help opens a separate tab with a visible arrow. The logo always links home; patient
  question/safety screens omit the other workspace navigation. Unsaved-work
  protection remains active when leaving a clinical sitting. Every page has a skip link.
- **Actions:** primary actions use accent fill and readable text; secondary actions
  have a clear boundary or underlined link. Preserve visible focus and disabled
  semantics. Never make a disabled control the only explanation of a requirement.
- **Questions:** retain complete published wording, timeframe, examples and anchors.
  Custom radios use one tab stop with arrows/Home/End and explicit selected state.
  Announce automatic advancement before responses; offer manual mode at setup.
- **Fields:** visible labels, inherited font, bounded lengths, full-width controls
  within shrinking grid tracks. Explain errors in text and move focus to a failed
  finalisation message. Do not encode meaning through colour alone.
- **Disclosures/dialogs:** native `details` and `dialog`; Escape closes modals and
  the floating export menu. Restore focus when a dialog closes. Never hide a safety
  interruption in a disclosure.
- **Scores:** number, range, instrument/form, interpretation and limitations stay
  together. Graphs have text equivalents; history has tables. Incomplete and
  unadministered forms cannot appear as numeric zeros.
- **Saving:** separate recoverable encrypted files from unencrypted outputs. A
  download request is not proof of durable storage. Changes invalidate the current
  snapshot indicator and final edits return to draft with prior final retained.

## Responsive and accessible implementation

Use relative typography, `minmax(0, 1fr)`, wrapping and content-driven height.
Default layouts use 320px as the narrow regression boundary. Desktop columns
collapse when content no longer fits; do not lock orientation. Short viewports
must not lose space to sticky controls. Hover is supplementary; every task must
work with touch and keyboard. Honour reduced motion and forced colours.

Target WCAG 2.2 AA and retain useful enhanced provisions such as 44px primary
control targets. Verify contrast for each actual foreground/background state,
text spacing, enlarged text, focus visibility, errors and complete workflows.
Automated axe checks are necessary but cannot certify conformance. Human AT and
physical-device acceptance tasks are in `docs/acceptance/HUMAN_ACCESSIBILITY.md`.

## Changing the UI

Reuse tokens and primitives before adding a component. Keep scoring, workflow
validation and permissions in the pure engine, not in CSS or duplicated UI rules.
Use `h()` text nodes for external/user text; only pass trusted escaped presentation
markup to `markup()`. Add public assets explicitly to `serve.py` and its HTTP tests.
Run `npm run check` and the affected browser cases; changes to shared navigation,
styles, focus or workflow require the full `npm run verify` matrix. Inspect actual
rendered desktop/mobile output and retain accurate evidence in VERIFICATION.md.

## Visual language refinement · 29 October 2026

Use short verb labels with familiar line icons for save, resume, copy, print and
download. Icons are decorative (`aria-hidden`) when text already names an action;
retain the visible label for touch, voice and screen-reader use. Copy feedback
keeps its icon and changes to a check only after success. The setup sequence is an
ordered, text-labelled diagram; monitoring shows full forms rather than the
staged route. The guide's four icon links provide quick access to detailed tasks.

Reduce repeated introductory and explanatory prose before removing any clinically
necessary information. Preserve published items/anchors/timeframes, consent and
permission conditions, source/evidence limitations, safety meaning and encrypted
save warnings. Use functional diagrams and SVG icons instead of decorative stock
photography in this clinical workspace. Long instructions remain in Help.

## Minimal homepage · 29 October 2026

Home has one primary assessment entry, a one-line explanation and secondary logic
and Help access. Measure selection, including personality, belongs in sitting
setup. Do not reintroduce parallel clinical/personality cards, instrument previews,
marketing badges or repeated navigation on this page. The original standalone
research route remains under a closed More tools disclosure, rather than being a
competing product category. The home header is a local variant; the workspace
navigation on other screens retains its existing behaviour.

## Whole-app implementation · 29 October 2026

The workflow research is now applied to the local interface:

- **Setup:** a narrow single-page workspace, compact selectable measure rows,
  count of selected measures, adjacent About disclosures and practice templates.
  Administration is a native disclosure whose closed summary states screening/
  monitoring and automatic/manual mode. Required measure permissions remain
  visible. The longer process explanation is under How the sitting works.
- **Patient flow:** a bounded reading column, complete published content, visible
  automatic-advance instruction, one response task, Back and explicit missing
  reasons. Safety remains a dedicated interruption. The logo always links home;
  existing unsaved-work protection applies.
- **Review:** complete scores start in an expandable index; incomplete results
  open their explanation. Numeric score/range, severity where supplied and screen
  status remain distinct. Trait profiles show separate score counts, never an
  aggregate score. Safety and review priorities stay outside disclosures.
- **Required review:** review-ui.js renders a checklist from the shared workflow
  validator. Selecting a task reveals its containing disclosure and focuses the
  actual field. Date and text fields retain focus when edits invalidate a final.
- **Outputs:** Save & export groups encrypted recovery, clinical report and
  structured data by purpose. Desktop popovers fit the available viewport and can
  open upward. Phone/short-window layouts use a wider non-modal bottom panel with
  an explicit Close action. Escape, outside dismissal and leaving by keyboard
  return to the ordinary page flow. A nested native recovery dialog returns focus
  to the export summary.
- **History:** one expandable summary per compatible form, with latest reading,
  date endpoints, range guides and the existing values/policy table. Screen
  disclosure state does not remove content from reports or PDFs.
- **Rules:** selecting a gate focuses its rule; All thresholds reveals the full
  unchanged draft. Default and active values are named separately. Source detail
  is available under Evidence & limits. Draft/review/activation remains explicit.
- **Help/recovery:** task-specific guide links open separately, direct Resume on
  home opens local recovery, and a labelled passphrase-visibility control clears
  both masked and revealed fields when the dialog closes.

Reuse these components before adding another panel, icon or navigation level.
`review-ui.js` owns review presentation and callbacks; scoring stays in the
engine. The record and shared report renderer remain authoritative for outputs.
All clinical text/keys, permission conditions and default scoring rules remain
unchanged. These implemented UI changes do not establish clinical or AT approval.

Phone question navigation follows the answers in normal document flow. Do not
make Back/Continue sticky: long prompts and enlarged text must not put the last
answer behind a floating action bar. Existing question focus and automatic
advancement remain unchanged.


## Navigation, controls and feedback · 29 October 2026

Workspace navigation is Home / Assessment / Logic / Help, with one current-page
marker on those destinations. It wraps at narrow/enlarged sizes. The standalone
personality tool does not identify itself as Home. Home itself retains its single
assessment action and quiet Help; patient screens retain the reduced header.

`action action-primary` identifies a task's main commit; `action-secondary` is
its secondary button. `action-danger` identifies an existing discard/delete
operation. Native New sitting confirmation remains. Use the common radius,
target, font and colour tokens. Published questionnaire answer buttons keep their
separate selection semantics. Disabled actions remain legible; a saved-template
selection is required before Apply/Delete becomes available.

Errors use `--error`/`--error-soft`; cautions and clinical safety use the existing
amber warning tokens. An error is a failed input/operation, not a clinical score
category. `setFieldError` adds text beside a field and preserves existing
instructions in aria-describedby. `wireFormValidation` delegates native invalid/
input events across replaced forms. It focuses/reveals the first invalid field
on submission, leaves untouched fields unmarked and clears corrected errors.
Keep operation errors separate when a failure cannot be assigned to a field.
Encryption/unlocking exposes pending labels and aria-busy; Cancel stays enabled.
Reference decisions and limits are in COMPONENT_RESEARCH.md. Human AT acceptance
is still required.

Resetting a rule clears its obsolete field error alongside restoring the value.
Passphrase comparison feedback clears when either entry is corrected to match;
it is not tied only to editing the confirmation field.


## Compact workspace refinement · 29 October 2026

The app uses a compact sans scale: 30px workspace titles, 18px section headings,
16px input/answer text and 13–15px supporting labels, all expressed in rem. Home
uses a larger 32–44px title with New sitting and Resume together. Reduce
surrounding furniture before shrinking published reading content. Reserve green
fill for the current task and explicit selections. No font dependency is used.

Setup places Setting beside New sitting on desktop, then reference/templates,
Measures/count/search and one white selectable list. Selection uses a checkbox
and aria-pressed. Required permissions and locale conditions remain visible.
Begin precedes recovery/logic/help utilities. Setting and fields stack on phones.

Review places results and compatible history in the main column; the checklist
and priorities form a narrower adjacent column above 760px. On smaller screens
tasks follow results in document flow. Urgent safety banners stay above both.
The review jump is a text action; Finalise record is the filled commit. Do not
make the task rail sticky or hide required safety documentation.

Logic, Help, templates and native dialogs use the same type and control tokens.
Editable gates have white surfaces; safety keeps amber meaning. Export geometry,
keyboard focus, disclosure behaviour, recovery warnings and complete printable
outputs remain unchanged. Obsolete marketing CSS is removed from the shared
stylesheet; do not restore competing homepage cards. COMPONENT_RESEARCH.md names
the structural references and distinguishes those from clinical evidence.


## Question screen chrome · 30 October 2026

Patient questions use one compact header: a smaller home-linked logo and the
current questionnaire/item count. Do not restore a separate save-status block,
Save progress button, global question counter, stage label or stage bar above
the item. Global question position and stage remain available to assistive
technology; avoid inventing a fixed overall total for adaptive screening.

Save progress sits with Back below the answers, with current encrypted-save
status underneath. Manual/text Continue retains its primary action. Published
timeframes, examples, question wording and answer anchors remain complete.
Safety interruptions retain their separate prominent layout.


## Setup form components · 30 October 2026

Setup uses a single column at every width, bounded to 720px. Heading, setting,
reference, templates, measure heading and search follow one reading edge. The
previous split desktop columns are retired. Preserve complete content and allow
the form to scroll rather than compressing it to a viewport-height target.

Clinical/Forensic uses a compact segmented radio group with a filled selected
state, not a full-width switch. It retains existing arrow-key and radio semantics;
no setting is preselected. Reference and search share 48px minimum height, 9px
corners and consistent padding/borders. Visible reference wording matches its
accessible name. Search has a persistent accessible label and a visual placeholder.
Selected measure rows have both a check and a light surface treatment. Maintain
focus outlines, native validation, readable input text and high-contrast support.

Existing native controls provide these components without a UI framework. The
form remains a shrinking inline-size container. Instrument metadata sits beside
the measure name while the setup column is wider than 40rem. It wraps below the
name when the column is narrower, or when enlarged text makes 40rem wider than
the 720px column. Templates expand within the same column.


## Focused setup views · 30 October 2026

Measures, Options, Context and Guide are distinct client-side views within the
assessment document. Navigation uses labelled line icons and aria-current; one
view is exposed at a time. Switching views retains in-memory input values and
focuses the new heading. Secondary views include Back to measures. No backend
routes or new framework were added. These views share the existing unsaved-work
and encrypted recovery model, not independent persisted documents.

Measures contains setting, reference/templates, the searchable catalogue, all
selected-form permission requirements and Start assessment. Options contains
administration settings; Context contains referral fields and external-measure
guidance. Guide contains the visual workflow and source detail. Saving, resume
and screening logic use 44px icon controls with accessible names and tooltips.
Patient question screens do not show this setup navigation. The initial missing
setting instruction belongs beside its selector, not in an amber full-width bar.

Use assessment in clinician/patient-facing language. Keep legacy technical IDs,
CSS classes and the saved format stable; terminology does not change scoring or
make this application a substitute for comprehensive psychological assessment.


## Guided assessment and visual results · 30 October 2026

Practice presets are configuration shortcuts, not recommended clinical batteries.
Quick choices reuse the validated template store (up to three entries, always
including the active preset; all remain available in Options). With no presets, show a compact Custom assessment row
rather than a one-choice card. Presets never include patient data or completed
permissions. Manual changes to setting, purpose or selection return to Custom.
Manage presets stays in Options. Keep its legacy store key and format stable.

The catalogue groups additional screening, traits and response patterns. Search
hides empty groups and reports no matches without clearing selected measures.
Instructions remain visible at the first item of a questionnaire; subsequent
items retain them in the accessible description without repeating visual copy.
Published questions, examples, timeframes and anchors are unchanged.

Each result card previews the existing score-chart model with its own raw range.
Do not invent percentages, percentiles, combined totals or clinical risk gauges.
Opening a card reveals the full chart/legend and evidence. Review tasks come
first in DOM order and on phones, and sit to the right of results on desktop.
Urgent safety banners precede the workflow strip; optional referral detail starts
collapsed in review. Never hide safety findings or manufacture a negative result
for an unfinished form.

Questions / Clinical review / Encrypted file is a workflow strip. Finalised and
snapshot-current states use the existing validation/signature, not colour or
score thresholds. Snapshot current means the requested/restored version matches;
the clinician still verifies the saved file. Final records expose Save assessment
and Start new assessment. Later edits invalidate the final and saved state.
Functional SVG plots, line icons and workflow diagrams supply graphics without
remote assets, decorative patient imagery, raster dependencies or new fonts.

## Selected alternative B · 30 October 2026

The selected design uses Setting, Measures and Ready as in-memory setup views.
Initial entry starts at Setting with neither context selected. Start new and
repeat monitoring keep their existing validated setup defaults and open Measures. Choosing a
setting opens Measures; Change setting and the progress navigation return to
earlier choices without clearing selections, reference or administration
permissions. Ready recaps the current measure selection, actual response-task
range and answering mode before Start assessment. Existing setup validation
still controls launch. Options, Context, Guide, presets and encrypted recovery
remain in Menu. Restored setup files open Measures with their captured values;
the visual step does not add a saved-format field.

Setup, patient questions and review use a white reading surface and the existing
green tokens. Measure rows have separate selection and labelled source actions;
the latter retains the existing evidence dialog. Patient answers stack in one
column with complete published wording and anchors. Automatic/manual advancement
retains the sitting's selected mode; recovery and missing-answer actions remain
below the question.

Review puts the actual safety findings and outstanding safety documentation
before measure results. The safety documentation notice uses the shared review
issues, including stale findings. A draft/final note preview follows results,
using the same concise summary function as Copy summary. Edits update the preview
and invalidate finalisation through the existing workflow. Detailed clinical
records, history, formal attestation and exports retain their existing controls.
This layout selection does not supply clinical or human accessibility acceptance.

## Persistent page actions and visual selection · 30 October 2026

Page-level assessment actions share a bottom dock across setup, questions,
follow-up selection, handoff, safety interruption and review. Existing controls
are moved into one dock; they are never cloned. Form-specific controls and
attestation remain with their subjects. A ResizeObserver reserves the dock's
actual height, including wrapped text and the device safe area. Keyboard focus
and viewport changes keep the active page control above it. Dialogs and export
menus retain their existing handlers; the dock is omitted from print output.

Measure selection uses a responsive card grid, the existing line icons, an
explicit selection check and compact labelled information buttons. Source,
burden and permission content remains in the existing dialogs and controls.
Ready uses matching selected-measure cards and an answering-mode graphic.
Review starts with safety and missing results; the unchanged concise note text
is available under Preview draft summary instead of repeating the results on
arrival. Copy summary remains directly available in the dock. No risk gauges,
combined scores or clinical classifications were introduced.

## Assessment layout refactor · 30 October 2026

The workspace uses a 1040px setup/review column on the neutral paper background,
with white panels and consistent spacing. Patient questions use a narrower 768px
reading column. Setting choices are full labelled cards with an icon, description
and arrow; their labels stay whole as text grows. Choosing a card opens Measures,
so Setting has no redundant Continue action or empty action dock. Leaving a dock
resets its reserved height. Other assessment screens retain persistent actions.

Measure selection and the Ready recap share a responsive card grid. Short titles
and one selection count replace repeated headings. The reading panel groups the
published stem, question and complete answer anchors; secondary actions follow it.
Results retain explicit safety and missing-result notices above the score rows.
The stylesheet defines these layouts together instead of stacking refinements.
Ready navigation fits one row at 390px with normal text and wraps when necessary
at narrower widths or enlarged text. All controls retain their accessible names,
focus indicators and minimum target size.

## Complete PDF export · 30 October 2026

Export PDF is a secondary action beside Copy summary in the persistent review
bar. It opens the native browser print dialog; destination selection and file
saving remain browser actions. Feedback says to choose Save as PDF and does not
claim a successful download. Both this action and browser print shortcuts refresh
the complete report from the current verified record, including its response
appendix. The HTML/JSON appendix preference is independent. Printing and
cancellation never acknowledge an encrypted save or finalise a draft.
