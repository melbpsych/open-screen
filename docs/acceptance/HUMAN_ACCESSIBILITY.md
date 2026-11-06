# Human accessibility and device evaluation

Status: **not performed**. Browser emulation, axe and keyboard automation do not
substitute for people who use assistive technology or physical device checks.
Use synthetic patient references and record findings without participant health
information. Obtain participants' agreement and use their familiar settings.

Minimum matrix: NVDA with Firefox on Windows; VoiceOver with Safari on macOS;
VoiceOver on physical iPhone; physical Android TalkBack/Chrome; tablet in portrait
and landscape; keyboard only; 200% text and 400% browser zoom where supported;
reduced motion and forced colours. Record actual OS/browser/AT versions and device,
not just a tick. A task is passed only when the participant completes it and can
explain the resulting state.

Tasks:

1. Discover a measure, understand timeframe/burden, select it and set a practice
   template. Confirm selection state and any administration requirements.
2. Begin a sitting, hear the full question and timeframe, choose an answer, and
   understand that selection advances automatically. Does focus land on the next
   heading and is the answer's confirmation clear? Can a user pause and correct
   an accidental selection with Back? Check arrows vs activation and repeated keys.
3. Enter event text without losing dictation/IME content. Continue with keyboard.
4. Reach the PHQ safety pause, understand whom to contact and the clinician-only
   acknowledgement, and follow the official resource link without losing state.
5. Save an encrypted sitting, cancel a modal, return focus, unlock with a wrong
   passphrase, recover, confirm the patient reference and resume at the correct
   question. Test file selection/downloads on physical phones.
6. Clinician handoff: locate priority findings, incomplete scales, chart values
   and their text equivalents. Read all optional facets without losing context.
7. Enter review notes, finalise with a clinician name/attestation, make a
   correction, and verify that the record is draft again. Export and read offline
   HTML and PDF; check headings, reading order and chart descriptions.
8. Add matching history, reject another patient's file, read the dates/values
   from the table and understand the limits of change interpretation.
9. Edit a settings draft, inspect the diff, save without activation, review and
   activate, reset to defaults. Errors must be announced and actions reachable.
10. Complete a new sitting; confirm previous patient details do not remain.

For each task record: participant pseudonym/access needs (voluntary), device and
versions, input method, text/zoom setting, task/result, announcements/focus order,
obstacle, severity, proposed correction, owner, tested commit and retest outcome.
Keep unresolved barriers open. Do not claim WCAG conformance from a clean scan.
See [WAI evaluation guidance](https://www.w3.org/WAI/test-evaluate/).

The 0.4.0 review must exercise both advance modes, missing-answer choices, the
independent safety fields, expandable low-priority results, forensic-context
fields, the save-state announcement and the follow-up-plan disclosure. Check
whether repeated live-region messages distract during typing. Verify that a
clinician can distinguish a downloaded snapshot from confirmed durable storage,
and that the primary review/finalise link and error messages lead to a recoverable
workflow. Automated checks do not substitute for these observations.

For the 29 October guidance pass, also verify Help is consistently discoverable,
its separate-tab behaviour is announced as expected, a finalisation error is read
when focus moves to it, and a reference-only draft survives cancelling Resume.
Try text-spacing/browser zoom preferences, tablet landscape and an on-screen
keyboard in the clinical review. Record physical device and AT/browser versions;
phone emulation does not substitute for these tasks.


For engine 0.5.0, locate the compact Menu and its Measures/Options/Context/Guide,
Save/Resume and main navigation destinations. Exercise native disclosure state,
Escape/outside dismissal, focus return from cancelled dialogs, 200% text and short
landscape. Confirm collapsed preparation and About remain discoverable without
reading repeated instructions before every task. Check the short reference-lock
notice before answering.

Review changed safety findings, acknowledge a justified disposition, correct an
invalid external total and find incomplete-module status without an appendix.
Archive a large synthetic history, identify every numbered file, cancel removal,
then explicitly remove verified history and save again. Confirm no participant
infers that a download request proves durable storage. Record barriers rather
than treating a clean automated scan as acceptance.


For the copy-first results view, complete a routine negative screen and copy its
summary without entering any optional documentation. Check that the instrument,
score/range, missingness and draft status can be understood in the pasted note.
Try an endorsed safety item: its alert and review controls must stay available.
Expand Notes & final record to enter notes, review, add history or open a further
measure. Confirm the difference between copying, local attestation and encrypted
saving. Check focus after removing archived history when its now-empty panel moves
under the optional disclosure. These remain human tasks to evaluate, not findings
already obtained from participants.
