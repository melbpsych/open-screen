# Practice acceptance evidence · 26 October 2026

The implementation baseline is commit `2730ce9`; the follow-up containing this
record strengthens host receipt/outcome handling. The overall goal is **open**.
This audit separates tested software from the external evidence required by
[PRACTICE_READINESS.md](../PRACTICE_READINESS.md). Green automated checks do not
supply independent clinical approval, human accessibility findings or licences.

## Software requirements

| Requirement | Evidence inspected | Result |
| --- | --- | --- |
| Encrypted recovery and patient matching | core/vault.js, core/assessment.js; vault/assessment boundary tests; readiness E2E wrong-passphrase/reference, captured-path/settings/safety recovery and cancellation cases | Implemented and tested |
| Templates and measure discovery | core/templates.js whitelist; workspace-ui.js; readiness E2E template privacy, search, overlap, 320px/200% and axe checks | Implemented and tested |
| Focused review and finalisation | interview.js; assessment lifecycle/digest tests; partial sitting, full-form/profile priority, finalisation/correction and safety E2E | Implemented and tested |
| Compatible history and outputs | core/history.js; brief/full, revision and changed-policy tests; actual offline HTML, clipboard, A4 PDF history and text/table checks | Implemented and tested |
| Governed settings | core/revisions.js and app-config.js; named drafts, explicit review/activation, stale-review and concurrent-writer, failed-write and legacy-migration tests | Implemented and tested locally |
| Typed host boundary | core/host.js, core/host.d.ts, examples/praxi.ts; runtime receipt/context/uncertain-write tests and strict TypeScript check | Implemented and tested with synthetic callbacks only |
| Version control and runnable CI definition | Local Git history; .github/workflows/verify.yml with pinned actions, read-only permissions and no retained credentials | Local history/workflow present; hosted execution unproved |
| Documentation, security and regression gates | docs/WORKFLOWS.md, SECURITY.md, CONFIGURATION.md, MEASURES.md; HTTP asset/Host/path restrictions; types/configuration/compiled/Python checks and full browser diagnostics | Recorded local checks pass |

Historical commands/evidence from 26 October (superseded by the later run below):

- Full five-project browser matrix: **287/287**, 4.7 minutes, no retries/skips;
  `/tmp/open-screen-practice-acceptance-full.log`. The generated Playwright report
  reflected that matrix at the time.
- After the host-contract refinement: **115 JavaScript tests**, strict types,
  configuration validation, compiled/Python parity and four real HTTP tests pass;
  `/tmp/open-screen-practice-acceptance-check.log`.
- The new host checks reject wrong practitioner/session receipts, preserve exact
  acknowledged receipts across later mutation, distinguish uncertain transport
  outcomes from acknowledged storage with failed/revoked context recheck, and
  avoid exposing transport bodies. They do not test a real Praxi transaction.

No patient data or passwords enter browser persistence or automatic network
transmission in the exercised app flows. Explicit HTML/JSON/clipboard exports are
unencrypted clinical records; encrypted recovery is a separate deliberate action.
All test fixtures/artifacts use synthetic references and are excluded from Git.
This is tested behaviour, not a claim of formal penetration testing or clinical
validation. Run the commands in [E2E.md](../E2E.md) to reproduce the browser checks.

## External acceptance requirements

| Requirement | Current authoritative evidence | What must happen next |
| --- | --- | --- |
| Independent psychologist verification | CLINICAL_REVIEW.md explicitly says not performed; no signed case/source review supplied | Independent registered psychologist executes source/worked-case and workflow review; resolve findings and retain dated approval for the tested version |
| Human accessibility/device evaluation | HUMAN_ACCESSIBILITY.md explicitly says not performed; automated emulation/axe only | AT users complete the stated NVDA/VoiceOver/TalkBack/device tasks; record and resolve findings |
| Protected-form permissions | LICENSING_REQUESTS.md contains unsent drafts, no grants; scoped older Praxi records do not establish permission | Obtain exact-form/deployment rights before embedding SCI, OCI, WHODAS or ASSIST items; independently verify source keys |
| Current Praxi integration | Older local source inspected; current remote fetch returns 404 and installed-repository searches return none; synthetic adapter only | Owner chooses app/access-control approach, supplies current accessible code, then implement and test authenticated receiving action/storage/tenancy/audit |
| Hosted CI execution | No Open Screen Git remote; no remote workflow run/receipt | Owner identifies/approves destination, then publish the reviewed source and verify the actual workflow result |

The owner deferred the repository destination and public/private choice. The
proposed direction is a reusable Open Screen engine integrated into Praxi's
assessment workflows; packaging is undecided. The local Praxi AGENTS.md requires
the founder to decide whether a genuinely separate integration receives a feature
key. No feature grant, repository publication, external message, licence purchase
or production deployment is assumed. These notes are not sign-off.

## Verification after the 28 October walkthrough

The current uncommitted worktree passed `npm run verify` using the documented
WebKit library path: 116 JavaScript tests, configuration, type, compiled-data,
Python and HTTP checks, followed by 297 browser tests across the five configured
profiles, with no failures. This includes the reviewer-reset and adaptive
question-progress regressions and the existing offline/PDF checks. The local log
is `/tmp/open-screen-current-verify.log`; it is ephemeral and is not a hosted CI
result. Human clinical and accessibility acceptance and the other external
requirements below remain open.


## Revalidated external dependency status

Across the original implementation turn and two continuations, the same external
requirements remain unsatisfied. This recheck inspected the clean worktree at
`a76fd20`, the current acceptance pack, absent Git remote, recorded browser JSON
(287 expected, zero unexpected/skipped/flaky) and successful software-check log.
The connected request for current Praxi AGENTS.md again returned 404. No owner
reply or external approval was supplied. The overall goal is blocked pending
those external changes; the implemented software and prepared packs remain
available. This status does not narrow the original definition of done.

## Practice workflow upgrade evidence · 29 October 2026

The engine 0.4.0 worktree passed the full `npm run verify`: **125 JavaScript
tests**, type/configuration/compiled/Python checks, four HTTP tests and **327
browser runs** across five profiles, with zero unexpected, skipped or flaky
results and no retries. The local log is
`/tmp/os-practice-upgrade-final-verify.log`; ignored Playwright reports reflect
this full run. [VERIFICATION.md](../VERIFICATION.md) records the exercised cases
and [WORKFLOWS.md](../WORKFLOWS.md) describes behaviour and file compatibility.

Safety-review and forensic requirements are enforced at the assessment boundary
as well as in the UI. Missing reasons stay unscored and survive exports. Monitoring
retains full forms where administration rules allow, history and treatment goals.
Evidence descriptions distinguish cited populations and published/default/local
rules; response patterns are descriptive. Follow-up action, owner and date are
captured and exported, but no authenticated task/reminder or Praxi write occurs.

The clinical and human-accessibility packs now include these workflows and a
supervised pilot protocol. Neither pack has been independently executed. The
external acceptance table above remains open, including protected-form rights,
current Praxi integration and hosted CI; more passing local tests do not close it.

## UI and guidance verification · 29 October 2026

The subsequent full local matrix passed **342/342 browser runs** and all 125
JavaScript tests plus types/configuration/compiled/Python/HTTP checks. New cases
cover Help, JavaScript-free guidance, text spacing, tablet/landscape/desktop
reflow, native review focus and reference-only recovery protection. Finalisation
error focus is also asserted. See [VERIFICATION.md](../VERIFICATION.md) for logs and scope; the static
user guide is `help.html`, with design rules in [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md). Human AT and
physical-device acceptance remain outstanding; automated emulation and axe do
not supply that evidence. No external acceptance dependency is marked complete.

## Minimal home and workflow research · 29 October 2026

The minimal homepage has passing coverage for all 364 browser matrix scenarios
across a terminated 321-pass run and a clean 70/70 mobile-WebKit rerun, plus 125
JavaScript tests and supporting checks. See [VERIFICATION.md](../VERIFICATION.md)
for the exact run boundaries. This is not represented as a single completed full
matrix. [UX_RESEARCH.md](../UX_RESEARCH.md) records broader Mobbin research,
observations, rejected references, gaps and proposed implementation priorities.
Reference imagery supplies no clinical validation, protected-form permission or
human accessibility acceptance. External dependencies remain open.


## Whole-app design verification · 29 October 2026

The local app now implements compact setup, actionable review, expandable
results, grouped saving/exports, improved recovery, per-form history and focused
rule editing. See [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md) and
[UX_RESEARCH.md](../UX_RESEARCH.md) for the implementation and its research basis.

Final software checks passed 126 JavaScript tests plus types/configuration,
compiled-output, Python parity and four HTTP tests. The full browser matrix
completed with 402/404 passing, zero skipped/flaky cases and two phone TAPS
failures caused by the test attempting to open a result behind its export panel.
After adding the ordinary Close exports action, that test passed 5/5 profiles.
No application code changed after the full run. All 404 scenarios have passing
coverage across those runs; this is not reported as a single clean full matrix.
The original report and separate correction results are retained. Exact commands,
logs, fixes, screenshot paths and limitations are in
[VERIFICATION.md](../VERIFICATION.md).

Independent clinical review, human AT/physical-device acceptance, deployment
permissions, live Praxi receiving integration and hosted CI remain open. The UI
redesign and passing browser coverage do not satisfy those external requirements.


## Component and clinical-evidence follow-up · 29 October 2026

A single complete final matrix now passes **434/434** browser executions, with
zero unexpected/flaky/skipped cases and no retries. Configuration/types,
126 JavaScript tests, compiled verification, Python parity and four HTTP tests
also pass. VERIFICATION.md records the command, logs, screenshots, exploratory
failures and subsequent fixes, including synchronous passphrase clearing and
clearing obsolete field errors after correction/reset. The current report is
complete rather than a partial/profile-only report.

COMPONENT_RESEARCH.md records the Mobbin evidence behind shared controls.
CLINICAL_EVIDENCE_REVIEW.md records the separate primary-source clinical and
licensing audit. The audit improves guidance and distinguishes actual catalogue
coverage from historical unexposed definitions. It is not an independent
clinical acceptance review; that task remains not performed. Human AT/device
acceptance, deployment permissions, current Praxi receiving integration and hosted
CI remain open. No new instrument has been registered or clinically validated.


## Adversarial review follow-up · 30 October 2026

The code-supported corrections are mapped in
[REVIEW_IMPLEMENTATION_2026-10-30.md](../REVIEW_IMPLEMENTATION_2026-10-30.md).
Engine 0.5.0 adds safety-review freshness/provenance, output parity, verified-final
reporting, external bounds, history anchors/chronology, recovery/reset/capacity
corrections and a compact assessment workspace. Source hash and installed-package
checks plus synthetic CI artifact retention extend maintenance evidence. See the
latest VERIFICATION.md entry for the completed local matrix.

The clinical and human accessibility packs include the new tasks. Their status is
still not performed; no new independent sign-off, source permission, hosted CI
execution, physical-device observation or live Praxi transaction is recorded.
