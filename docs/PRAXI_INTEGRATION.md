# Praxi integration

Inspected read-only: `/home/peter/Work/praxi`, local commit `c9da1d9440`, 26 October 2026. The owner says this checkout is older than the current product. No Praxi files, feature grants, deployments, client records or database tables were changed.

## Fit

An Open Screen app in Praxi should reuse its existing assessment and client workflows. Keep Open Screen's staged routing/scoring/configuration snapshot as a library behind that surface. Praxi retains authenticated practitioner/client identity, organisation isolation, scheduling, portal delivery, emails/messages, clinical result review, record storage, retention and audit. Do not introduce a second portal, duplicate native questionnaire records, or rescore an Open Screen instrument through a generic total scorer.

The inspected `packages/assessments/src/core/assessment-engine.ts` already separates algorithmic scorers from generic totals and says production risk flags belong to the API's `detectRiskFlags()`. Open Screen's PHQ item-9 pause must be reconciled with that canonical safety policy, rather than creating a second conflicting risk classification. Source flags and acknowledgement must remain visible; neither system's checkbox constitutes a safety assessment.

Relevant source contracts:

- `packages/api-types/src/wire/assessment-delivery.wire.ts`: EMAIL, SMS, QR_CODE, DIRECT_LINK, IN_SESSION, KIOSK, PORTAL, CHAT. Reuse these lanes and their existing permissions/feature gates.
- `apps/api/src/modules/assessments/dto/assessment.dto.ts`: session responses, completion, staff review and risk-review notes; risk notes are PHI and encrypted at rest. A public completion does not automatically mean clinician approval.
- `apps/api/src/modules/app-registry/services/app-registry.service.ts`: marketplace catalogue and tenant-scoped installations. A catalogue entry is not an assessment-write permission.
- `packages/apps-framework/src/auth/jwt.strategy.base.ts`: authenticated app context. No copied token handling belongs in this static app.
- `packages/apps-framework/src/events/event-types.ts`: assessment.completed is a notification event, not an ingestion API or proof of persistence.
- Praxi AGENTS.md: canonical action mutations, RLS, PHI audit, governed feature-access decisions and reuse of scoped/full app state.

## Implemented contract

`open-screen/host` exposes a transport-free `createHostBridge`. `examples/praxi.ts` compiles against its typed callbacks. The host provides an authorised organisation/client/practitioner/session context, an exact patient reference and a persistence callback. Explicit `save`:

1. Verifies the assessment, complete final status and attestation digest; checks the patient reference against the confirmed host context.
2. Fetches fresh context before dispatch and refuses context changes/revoked writes.
3. Supplies a frozen payload containing configuration/source provenance and a stable idempotency key for this exact final version. Raw responses are excluded unless explicitly requested.
4. Requires a `stored` receipt matching organisation, client, assessment, digest and idempotency key. A queue acknowledgement is insufficient. Fetches context again to avoid presenting success in another client's workspace.

The receiving transaction must independently authorise the current user, tenant, client/caseload and session, compare the expected context, validate/scoring-version-check the payload, encrypt sensitive fields, persist provenance, enforce the idempotency key and audit. Browser flags and SHA-256 are not authentication. Retries reuse the same key; a mismatched/uncertain receipt requires checking the host before retrying. No network or host write occurs merely by importing the SDK.

## Remaining receiving implementation

Verify the current checkout first. Decide with Praxi's owner whether this is a separately installed app or a native assessment extension and whether a feature key is required (the inspected repository explicitly requires that product decision). Implement the receiving action in the current Praxi codebase, register the correct typed hooks/permissions, and use its existing clinical storage/report facilities. Bind the current scoped client/session and avoid passing patient identifiers in navigation URLs. Native SDK composition is preferred over an iframe; the standalone server intentionally forbids framing.

Test in Praxi's test environment: cross-tenant/client denial, revoked access, stale session/context, duplicate dispatch, lost response after commit, partial storage failure, risk escalation, draft vs final, instrument version mismatch, portal hiding of clinician findings, source attribution in reports and PHI audit. Nothing here claims those receiving-system tests ran. A generic FHIR export is deliberately not invented: only add QuestionnaireResponse mapping when the actual receiver requires and validates it.
