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

Use **Clinician options → Review partial sitting** if administration is interrupted. Missing answers stay incomplete; the draft can be saved/exported and **Continue unanswered questions** resumes the remaining path. An incomplete sitting cannot be finalised.

Review safety/priority findings, complete the selected questions, record direct
safety review when flagged, and agree formulation/follow-up. Enter the reviewing
clinician and attest explicitly. Outputs say **Draft** until this is done and
**Final** with the reviewer/date afterwards. Finalisation does not save a file or
send the record anywhere. Save/export it deliberately.

Changing responses, setup or clinical notes returns the current record to draft;
the preceding final snapshot is retained in memory and in the next encrypted
sitting file. Local attestation and a content digest are neither authentication
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
