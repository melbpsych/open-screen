# Practice workflows

## Save and resume

Use **Save progress** during questions/safety, **Save encrypted sitting** at setup
or review (under More), or **Save encrypted final record** after attestation. Use
a unique strong passphrase of at least 12 characters, confirm it, and verify the
`.openscreen` file reached approved practice storage. Keep the passphrase
separately; it cannot be recovered. Downloads are requests to the browser, not
proof that a file was durably stored. Unsaved edits are lost on reload/close.

At setup choose **Resume sitting**, select the file, unlock locally and re-enter
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
and purpose. About disclosures show actual item burden, timeframe and limitations;
no unsupported completion-time estimate is invented. A warning identifies overlap
between multiple Big Five approaches; it does not merge or prohibit their scores.

Templates/settings names and review identities are practice metadata in this
browser profile. Do not enter patient details there. Templates with unavailable
measure IDs fail visibly and can be explicitly reset. Changes are local to this
origin/profile, not automatically shared across a practice.

## Review and finalisation

Use **Clinician options → Review partial sitting** if administration is interrupted. Missing answers stay incomplete; the draft can be saved/exported and **Continue unanswered questions** resumes the remaining path. An incomplete sitting cannot be finalised. The confirmation says so only when the current path still has unanswered items. A finished path can be opened for review and finalised.

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
a difference. Up to 40 final records fit the history contract, also subject to a
4 MB plaintext / 8 MB encrypted-envelope size limit. Export the sitting and begin
a new one when at capacity. Beginning **New sitting** clears all patient/history
state after confirmation; save first. No chart or downloaded report replaces the
practice's longitudinal clinical record.

## Integration

The [Praxi contract](PRAXI_INTEGRATION.md) is transport-free and tested with
synthetic callbacks. The standalone UI deliberately has no pretend “Connected”
state or success button pointing at an invented endpoint. Receiving integration
requires Praxi's current authenticated action, storage, permissions and test
verification. No remote deployment or hosted CI run is claimed.

## Practice review upgrade · engine 0.4.0

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

Engine/rules snapshots are now 0.4.0 / 2026-10-29. This release deliberately refuses
0.3.0 sitting files rather than silently changing their interpretation or
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
count is not a promised question total. Open Administration to change purpose or
advancement; the closed summary shows the current choices. Measure-specific
permissions/form choices remain visible and must still be confirmed. Templates
retain practice choices only. How the sitting works contains the process diagram.

Review priorities and the Review checklist lead to missing required work. A
checklist action opens any containing disclosure and focuses its field. Completed
scores and profiles expand from summary rows; incomplete results open their
explanation. Missing-answer, source and safety rules are unchanged. Completing
checklist requirements means ready for local attestation, not safety clearance
or automatic clinical approval. Editing a final still creates a draft and retains
the preceding final, including when the edited field is a follow-up date.

Save & export groups encrypted recovery under Resume later, unencrypted reports/
print/summary under Clinical report, and JSON/full record under Structured data.
The response appendix remains explicit. Close or Escape dismisses the panel;
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
