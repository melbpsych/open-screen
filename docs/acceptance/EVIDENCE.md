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

Commands/evidence:

- Full five-project browser matrix: **287/287**, 4.7 minutes, no retries/skips;
  `/tmp/open-screen-practice-acceptance-full.log`. The generated Playwright report
  now reflects this complete matrix.
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

The app/access-control choice and repository destination were requested from the
owner asynchronously. The local Praxi AGENTS.md requires the founder to decide
whether a separate integration receives a feature-access key. No reply, feature
grant, repository publication, external message, licence purchase or production
deployment is assumed. Do not count this blank acceptance trail as sign-off.
