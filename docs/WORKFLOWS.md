# Practice workflows

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


## Save and resume

Use **Save progress** during questions/safety, **Save encrypted sitting** at setup
or review (under More), or **Save encrypted final record** after attestation. Use
a unique strong passphrase of at least 12 characters, confirm it, and verify the
`.openscreen` file reached approved practice storage. Keep the passphrase
separately; it cannot be recovered. Downloads are requests to the browser, not
proof that a file was durably stored. Unsaved edits are lost on reload/close.

At setup choose **Menu → Resume**, select the file, unlock locally and re-enter
the displayed patient reference. A file with no reference requires **NO REFERENCE**;
confirm identity independently. Existing work needs explicit replacement confirmation.
Invalid passwords, damaged files, unsupported schemas/engine versions and invalid
responses fail without replacing work. Never email/upload unencrypted clinical
exports to unapproved systems. The app does not automatically synchronise, save
to localStorage or send patient information to Praxi.

The file captures the actual configuration, answers including retained responses,
notes, navigation/safety state and prior final records. Resumed sittings retain
that configuration even when current practice preferences differ. Safety
endorsement without acknowledgement resumes at a clinician pause. No generic
migration rescoring of incompatible engine versions is attempted.

## Templates and discovery

Practice templates save a name, clinical/forensic setting and selected areas only.
They deliberately omit patient reference, notes, answers, follow-up overrides,
form choices and administration confirmations. Applying one resets these setup
conditions for a new sitting. Search covers measure names, source descriptions
and purpose. Help icons show item burden, timeframe and limitations. The follow-up chooser
shows remaining question counts and rough time estimates (15 seconds per question,
rounded up to minutes); these exclude discussion, breaks and clinical review. A warning identifies overlap
between multiple Big Five approaches; it does not merge or prohibit their scores.

Templates/settings names and review identities are practice metadata in this
browser profile. Do not enter patient details there. Templates with unavailable
measure IDs fail visibly and can be explicitly reset. Changes are local to this
origin/profile, not automatically shared across a practice.

## Review and finalisation

Use **Review partial assessment** if administration is interrupted. Missing answers stay incomplete; the draft can be saved/exported and **Continue unanswered questions** resumes the remaining path. An incomplete sitting cannot be finalised. The confirmation says so only when the current path still has unanswered items. A finished path can be opened for review and finalised.

Review safety/priority findings, complete the selected questions, record direct
safety review when flagged, and agree formulation/follow-up. Enter the reviewing
clinician and attest explicitly. Outputs say **Draft** until this is done and
**Final** with the reviewer/date afterwards. Finalisation does not save a file or
send the record anywhere. Save/export it deliberately.

Changing responses, setup or clinical notes returns the current record to draft;
the preceding final snapshot is retained in memory and in the next encrypted
sitting file. Assessment history lists that kept final. One final does not draw
a change graph. Local attestation and a content digest are neither authentication
nor a legal digital signature. They cannot replace Praxi's access controls,
clinical approval policy or tamper-resistant audit.

## History

At review expand **Assessment history → Add from encrypted file**. Confirm the
patient reference. Only final records for the same nonempty exact reference may
be added. The file may include prior final records; duplicate versions are ignored.
Only the latest final revision for each sitting is graphed. Corrections are not
counted as additional longitudinal measurements. Blank-reference final revisions
remain recoverable within their original sitting but are not compared.

Graphs use assessment start dates, actual numeric ranges and an accessible values
table. The same source/scoring/form must match. PHQ-2 and PHQ-9, for example, remain
separate series. Different practice settings are disclosed. No reliable change,
clinical improvement, normative comparison or diagnostic meaning is inferred from
a difference. Timestamps are ordered by their actual instant, including timezone
offsets. PCL-5 series also require a matching clinician-entered event reference;
changed or unknown anchors stay separate. Reuse a reference only after confirming
the same event. No detailed trauma narrative is required for that comparison.

The history contract allows at most 40 final records, also subject to a 4 MB
plaintext / 8 MB encrypted-envelope size limit. Add-history and start-monitoring
check the proposed size before committing. Continued notes or revisions can reach
the byte limit: **Archive encrypted history** splits the complete bundle into
independently recoverable numbered files, keeping every current/history record.
All parts are encrypted before downloads start. Verify every part in approved
storage before choosing **Remove archived history from this tab** and explicitly
confirming. Archive alone removes nothing; cancelled/failed operations never
remove history. Save the current assessment again afterwards. A large archive may
need opening in parts; re-importing every part at once can exceed the same limit. Beginning **New sitting** clears all patient/history
state after confirmation; save first. No chart or downloaded report replaces the
practice's longitudinal clinical record.

## Integration

The [Praxi contract](PRAXI_INTEGRATION.md) is transport-free and tested with
synthetic callbacks. The standalone UI deliberately has no pretend “Connected”
state or success button pointing at an invented endpoint. Receiving integration
requires Praxi's current authenticated action, storage, permissions and test
verification. No remote deployment or hosted CI run is claimed.

## Practice review upgrade · introduced in engine 0.4.0

Every final now needs an explicit safety disposition, independently of symptom
scores. Reviewed or follow-up-required dispositions need an assessment method
and outcome. Deferred/declined assessment needs a reason plus action, owner and
due date; an endorsed PHQ item 9 cannot use those dispositions to bypass direct
review. The app records the practice-approved assessment; it does not administer
a new suicide instrument or infer risk categories. A retained item-9 endorsement
remains visible even if its answer is corrected or declined. Review the original
observation and correction directly. A follow-up plan does not schedule a reminder
or create a Praxi task: arrange that in the practice system.

Forensic finals also require referral question, purpose, recipient, conditions,
collateral and limitations. If collateral is unavailable, record that fact and
its implications. Person's account, observations and uncertainty have distinct
fields and appear in summaries, HTML/PDF and structured records. These fields
support documentation; completing them does not validate a forensic conclusion.

Choose automatic or manual advancement before starting. Manual mode requires
Continue after selection; any endorsed PHQ item 9 still pauses immediately.
“Prefer not to answer” and “Unable to answer” are recorded as missing reasons,
never zero or a response-option score. A sitting can finish administration with
those reasons, but affected measures stay incomplete and finalisation requires
review of missingness. Ordinary unanswered items still prevent finalisation.
In an adaptive screening path a missing gate does not infer a positive or
negative result. Clinician review can determine further assessment.

Repeat monitoring requests selected full measures at low brief scores, retaining
published exposure/substance stop rules and administration requirements. Do not
interpret skipped forms as measured zeros. Use the same measures, form, timeframe
and settings for comparison. Start repeat monitoring from a final to retain its
history and reference, create a fresh assessment identity, and clear responses,
review and safety state. Treatment goals carry forward for review; permissions
must be reconfirmed. Practice templates may also retain the administration mode,
but no patient notes or safety outcomes. New sitting returns to screening mode.

The save-state line compares the current clinical content, attestation and history
with the last encrypted snapshot downloaded or restored. Copying a summary does
not mark the sitting recoverable. Navigation warns when clinical work has changed.
A download request is not proof of durable storage: check the file in approved
practice storage before closing. New versions of the file do not replace old
versions automatically.

Current engine/rules snapshots are 0.5.0 / 2026-10-30. This release deliberately refuses
0.4.0 and earlier sitting files rather than silently changing their interpretation or
attestation requirements. Keep the original release available to open and export
its records; do not edit version fields in encrypted files or JSON. Cross-version
migration needs its own reviewed, explicit conversion path and is not supplied.
No questionnaire wording, response scoring key or default published threshold was
changed by this release. Response-pattern labels now describe observed response
distributions, not credibility or validity classifications.

## Refined workspace controls · 29 October 2026

Home's Resume sitting action opens the existing encrypted-file recovery directly.
Its action-only query is removed immediately; it carries no patient identifier.
New sitting still starts setup. Personality is selected with the other measures;
the original standalone research route remains secondary under More tools.

Setup uses selectable measure rows and adjacent About disclosures. The selected
count is not a promised question total. Use **Menu → Options → Administration** to change purpose or
advancement. **Menu → Context** holds referral and participation details. Measure-specific
permissions/form choices remain visible and must still be confirmed. Templates
retain practice choices only. **Menu → Guide** contains the process diagram.

Review priorities and the Review checklist lead to missing required work. A
checklist action opens any containing disclosure and focuses its field. Completed
scores and profiles expand from summary rows; incomplete results open their
explanation. Missing-answer, source and safety rules are unchanged. Completing
checklist requirements means ready for local attestation, not safety clearance
or automatic clinical approval. Editing a final still creates a draft and retains
the preceding final, including when the edited field is a follow-up date.

Export PDF beside Copy summary opens the browser print dialog. Choose Save as PDF
or the device's PDF/share option and all pages. This report always includes the
full record and recorded response appendix, including missing-answer reasons and
earlier responses outside the current scoring path. It includes results, safety
review, context, notes, available history and sources even when screen disclosures
are closed. It retains Draft/Final status and does not acknowledge encrypted saving.
Cancelling printing leaves the active assessment intact. Browser print shortcuts
use the same complete report.

Save & export groups encrypted recovery under Resume later, offline HTML under
Clinical report, and JSON/full record under Structured data. The optional appendix
checkbox applies to HTML and JSON. Close or Escape dismisses the panel;
Escape first closes a native dialog when one is open. Phone layouts provide a
wide bottom panel with independently scrollable options. Saving a file is still
an explicit download, with no automatic backup, real reminder or Praxi write.

Passphrase visibility is an explicit user choice. Closing the native recovery
or saving dialog clears revealed and masked fields. Recovery still requires
successful decryption, exact version support and patient confirmation. No reset
service or migration was added. History summaries expand per form; the report
and PDF contain the full charts and tables regardless of screen disclosure state.

Selecting a gate in the logic diagram focuses that rule. All thresholds reveals
the rest of the same draft without discarding edits. Default, active and unsaved
values remain different states; review and activation are still required. Sources
and active-rule limitations are available separately from unsaved diagram previews.


## Clinical-use and correction guidance · 29 October 2026

Help now includes Choosing measures & clinical use with source links and separate
disclosures for safety, external findings, forensic interpretation and additional
permissions. The external C-SSRS yes/no note records endorsement, not official
triage. Entering an external questionnaire total cannot supply a self-harm item
response; document actual findings and the safety plan independently. Historical
mania/eating/perinatal/cognitive definitions are not administered public-catalogue
modules. Refer to CLINICAL_EVIDENCE_REVIEW.md before selecting future additions.

Field errors identify corrections without replacing existing hints. Submitting
an incomplete form focuses its first invalid field. Correcting/resetting a value
clears obsolete feedback. Encrypted operations show a pending label and retain
Cancel; Cancel/Escape clear passphrase fields before the dialog closes. The
navigation exposes Logic while patient screens retain their reduced header.


## Adversarial review corrections · engine 0.5.0

The compact setup starts with setting and measures. **Menu** holds secondary
navigation and Save/Resume; Escape or leaving it closes it. Saved presets appear
only when available, in a disclosure. **Before you start** expands preparation;
published timeframe/instructions remain visible on every questionnaire item.
**Pause or ask for help** keeps assistance available during administration.

Changes to PHQ item 9 or recorded safety findings require review against the
current findings. A clinician may retain a justified disposition through explicit
acknowledgement. Prior reviewed dispositions and PHQ response amendments are
preserved with timestamps; a correction reason can be recorded. These are local
records, not authenticated observations or an invented risk score. Default
summaries describe retained endorsement; exact original response codes stay in
the encrypted file and opt-in appendix.

Every selected module has an administration status, answered/required count and
reason when unscorable in standard reports. Known external totals require valid
integers in the named form's range. Invalid typed totals are marked, excluded from
the record and block finalisation until corrected. No external total changes
screening scores or creates item responses.

Forensic finalisation also requires a participation/notification record describing
voluntary consent, mandated notification or assent as applicable, comprehension,
adjustments and external documentation. The field does not establish legal consent.
Starting repeat monitoring clears administration confirmations, including DASS
conditions; New assessment retains the documented reusable practice conditions.

Corrupt deployment preferences block new sittings while **Menu → Resume** remains
available for a compatible file using its captured configuration. Starting new
from a recovered extended registry constructs a fresh deployment-compatible setup
before replacing the workspace.


## Routine use: measures → answers → clinical notes · 30 October 2026

The confirmed everyday job is choosing measures, completing them and copying the
results into an existing clinical record. The Results page therefore leads with
scores and **Copy summary**. The copied note includes clinically relevant findings
and any entered notes; it omits repeated scores and default software metadata.
Draft, missing/unadministered results and safety review status remain explicit.
Copying neither finalises the record nor saves a recoverable file.

**Notes & final record** contains optional documentation and the existing formal
attestation workflow. It opens automatically for safety findings, an interrupted
path or an existing final. Finalisation requirements are unchanged. Selected
scores expand to their full chart and evidence; the repeated preview charts and
three-card workflow strip have been removed. Save status and Draft/Final remain
in the header. PCL event references live with Assessment history and appear only
when PCL was actually opened. Archive actions appear when retained history exists.

Empty history, additional follow-up controls and source notes stay under Notes &
final record; retained history appears with results when it exists. The full
report, full record, JSON, settings and encrypted recovery remain available as
secondary operations. None is a mandatory step before copying raw
results into notes. An unreviewed draft must not be represented as a completed
safety assessment or attested report.


## Brief results and optional full measures

Screening mode pauses after the selected brief questions and before any triggered
longer forms. Initial results show brief scores and areas warranting exploration,
without full-scale severity labels or diagnostic claims. The chooser names each
available extension and shows remaining questions, optional text prompts and a
rough completion estimate. Shared answers carry forward. Suggested extensions
are preselected; below-threshold extensions are optional. Continue with the chosen
forms in one action, or use brief results directly. A negative brief-only sitting
retains its clinician handoff and offers **Choose full questionnaires** directly.

Declined extensions are captured separately from response codes and threshold
policy in `setup.followUpChoices`. No full score is calculated, including from
retained earlier answers; brief scores and known safety findings remain. Summaries,
HTML, full text, JSON and encrypted recovery retain the administration choice.
Brief-only records can be finalised after the ordinary safety/context review;
choosing not to administer a full form does not establish a negative result.
Monitoring continues to administer the full measures planned at setup.

During questions, **Prefer not to answer**, **Unable to answer**, **Pause or ask
for help** and **Review partial assessment** are direct controls. The help icon
opens source information in a keyboard-dismissable dialog. Closing restores focus;
answer shortcuts are suspended while it is open. Optional documentation forms use
compact controls; sources and explanatory material do not add stacked action rows.
