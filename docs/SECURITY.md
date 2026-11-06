# Security and integration boundaries

This is a supervised local screening app, not an authenticated patient portal. The security measures below reduce concrete local and embedding risks. They do not constitute a penetration test, compliance certification, or evidence of clinical validity.

## Data and trust

Answers and notes remain in tab memory until the clinician explicitly copies, prints, or downloads them. The API has no I/O, storage, telemetry, network requests, or automatic message passing. The browser loads static local application assets. Following an external source link is an explicit navigation. Closing or reloading loses unsaved changes. An explicitly saved encrypted sitting file supports recovery; secure erasure from browser/OS memory is not claimed.

Only practice-level settings and templates persist in localStorage. `open-screen.practice-preferences.v1` now contains a schema-2 journal with an active pointer, named revisions, review metadata and validated overrides; `open-screen.templates.v1` contains context/topic selections. Do not put patient information in the rationale. The local editor is a clinician workspace convenience, not an authenticated administrator boundary. Anyone controlling this browser profile can change its preferences. Saved values pass full factory validation on every load, are bound to reviewed deployment defaults, and never change an active sitting with responses. Corrupt, stale or unavailable settings block a new sitting; explicit reset returns to defaults while retaining a valid revision journal; corrupt/legacy preferences can be explicitly removed. Unrelated keys are untouched. Settings records and clinical exports retain provenance but are not signed or tamper-proof.

The public API validates complete policies, definitions, setup fields, clinician text lengths, response codes, and known item IDs without coercing values. Prototype-related keys and unknown configuration fields are rejected. Invalid response values are not included in exception messages. Missing values do not become zeros. Original codes and keyed contributions are distinct. There are no executable scoring expressions, dynamic code evaluation, downloaded plugins, or URL-controlled thresholds.

Policies and definitions are trusted reviewed assets, not a sandbox for hostile objects or JavaScript modules. The registry is application code. A hostile host process, compromised dependency, same-origin script, browser extension, or person controlling the device can access answers. The patient/clinician handoff is a workflow transition, not authorization. Preserve those boundaries when embedding.

## HTML and downloads

DOM text uses `textContent`/text nodes. The intentionally narrow `ui.markup` helper is used only with the presentation module's escaped templates. Never pass arbitrary patient HTML into it. Reports escape user notes, references and definition text, use no scripts or remote resources, and carry their own restrictive Content Security Policy. User text is not interpolated into JavaScript, CSS, URLs, or filenames. Download filenames contain only the product name and date.

Structured JSON includes raw responses only when explicitly requested; internal safety findings bindings and exact PHQ amendment codes are also omitted by default; the default removes the legacy text appendix and patient event description. Clinician notes, recorded observations, source identifiers and derived results remain sensitive health information. An immutable configuration snapshot enables replay but is not signed or tamper-proof. Exported files and clipboard contents are outside the app's retention boundary and must enter the practice's approved record system.

The app does not implement CSV export, remote submission, shared-device access control, or browser download-folder cleanup. Do not infer those features from the presence of JSON or HTML exports. An integration should use its own tested export and record-handling flow.

## Local server

`serve.py` binds only to `127.0.0.1`. It requires a localhost Host header with the actual listening port to reduce DNS-rebinding exposure. There are no upload or mutation endpoints, CORS permissions, or query-string access logs. Directory listing, hidden/traversal paths, symlinks, server source files, unlisted root assets, and unrelated root HTML exports are blocked. Published runtime directories and bundled official PDFs are intentionally readable. Never put secrets or patient files under those public directories.

Responses include `Cache-Control: no-store`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, `Cross-Origin-Resource-Policy: same-origin`, feature restrictions, a CSP, and frame denial. CSP permits only local scripts/connections/images; it disallows inline script, eval, objects, form submissions and embedding. Styles allow inline declarations because the current renderer generates charts and self-contained reports. This is a documented presentation tradeoff, not permission to allow inline JavaScript. A host with a stricter style policy should adapt the renderer to its stylesheet/nonce system.

## Embedding and deployment

Prefer importing the pure API into a host's own authenticated views. The local UI deliberately denies iframe embedding; no `postMessage` bridge exists. If an embedding workflow later requires one, specify allowed origins, source-window checks, message validation, capabilities and data ownership before enabling framing. Do not add wildcard CORS or origin checks based on substring matches.

For a remote service, the host must supply HTTPS, authentication, authorization, session isolation, CSRF protections for writes, appropriate response headers, retention/deletion rules, encrypted storage and backup policies, audit controls, access logging that excludes health payloads, and applicable clinical/privacy governance. The supplied development server is not that service. Deploying on a different static host also requires configuring headers there; they do not follow automatically from Python source. In particular, `frame-ancestors` must be an HTTP header rather than a meta-tag assumption.

Keep runtime dependencies at zero. Pinned TypeScript, Playwright and axe development dependencies and the lockfile support repeatable checks. Dependency audit output is useful maintenance evidence, not proof of application security. Run `npm run verify` after upgrades, using the prerequisites in [E2E.md](E2E.md). Tests exercise HTTP protections, invalid values, definition collisions, exact replay, escaped HTML rendered offline, clipboard failures, copy/edit races, unintended persistence and unexpected outbound browser requests. They do not establish protection against an already compromised machine or comprehensive package supply-chain, concurrency or penetration-test coverage. Browser traces, screenshots and downloads may contain entered information: use synthetic fixtures and keep generated artifacts out of shared clinical records and public uploads.

## Reporting a problem

Report security issues privately to the project owner or the host system's established security contact. Include the affected version, a synthetic reproduction, impact and relevant headers. Do not include actual patient responses, identifying screenshots, clinical exports, credentials, or private tokens. There is no public security-reporting address or remote hosting service configured in this repository.

Implementation references: [OWASP CSP guidance](https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html), [OWASP HTTP headers guidance](https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html), [Node package entry points](https://nodejs.org/api/packages.html). These inform the engineering controls, not clinical claims.

The expanded registry contains only local reviewed assets; it introduces no remote form loader, analytics or patient transport. `setup.forms` is an explicitly validated variant map and is included in records. Free-text descriptions of other TAPS substances remain sensitive responses: they are absent from default JSON and summaries, and are included only in the opt-in response appendix. External clinician-entered results are clinical notes and remain in default clinical exports. Archived source HTML is not served; permitted source PDFs remain on the existing narrow allowlist. Instrument-specific permission handling does not grant arbitrary copyrighted definitions an open licence.

## Explicit encrypted recovery

Portable `.openscreen` files contain captured settings, raw answers, notes,
workflow state and optional final history. Encryption uses Web Crypto AES-256-GCM,
a fresh 96-bit IV and 128-bit authentication tag, with a fresh 128-bit salt and
PBKDF2-HMAC-SHA-256 at 600,000 iterations. The format header is authenticated.
The iteration count/algorithms and file/plaintext sizes are fixed and bounded;
malicious files cannot choose an unbounded KDF cost. The passphrase requires
12–1024 characters, is not normalised, and is never saved. It cannot be recovered.
This is not a FIPS certification or protection against malware reading an unlocked
device, a compromised app origin, weak passwords or unencrypted exported reports.

Only explicit file download/upload accesses a sitting file. Browser localStorage
holds practice settings/review names and templates, never patient references,
answers, notes or passwords. Do not put patient details in template/settings names
or rationales. Native downloaded reports, clipboard and JSON are unencrypted and
must be handled through approved clinical storage. Resume validates the schema,
configuration and answers and requires patient-reference confirmation before
replacing state. Derived scores are recomputed using the captured compatible
engine; incompatible versions fail visibly. The SHA-256 final attestation digest
binds content, but is not an authenticated digital signature or tamper-proof audit.

References: [MDN AES-GCM parameters](https://developer.mozilla.org/en-US/docs/Web/API/AesGcmParams),
[OWASP cryptographic storage](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html),
[OWASP password hashing guidance](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html).


## Record and recovery boundaries · 0.5.0

A Final report requires the immutable record produced from a digest-verified
assessment. After JSON parsing, call `await verifyAssessment(value)` before
`assessmentRecord()`. Final conversion rejects an unverified object; differing
clinician overrides and cloned derived records render as Draft. This prevents
accidental attestation reuse; a hostile host can still replace application code
and manufacture its own attestation. No authenticated signature is claimed.

Safety review binds to the findings it covered. Amendment/review histories are
bounded, validated and captured in the encrypted file, without claiming trusted
clocks or authenticated authorship. Standard outputs retain the warning and review
narrative; original response codes and internal bindings remain opt-in.

History additions and monitoring transitions check serialized capacity. Encrypted
archival splits a complete valid bundle without discarding records; deletion from
the tab is a separate explicit action after the current archive was requested.
The browser cannot prove durable storage: users must verify every numbered file.
Corrupt deployment preferences cannot prevent recovery using compatible captured
configuration. Files from older engine/rules releases fail closed; keep the original
application available for recovery rather than editing version fields.

CI uploads only failed synthetic test reports/traces for seven days. Do not run
those workflows with real patient data. `npm run check:package` installs the packed
SDK in a temporary offline consumer to check runtime/type agreement. Source hash
checks detect asset changes, not clinical correctness, licence grants or supplier
trust.


## Public evaluation demo · 6 November 2026

GitHub Pages serves only the generated allowlisted `.demo-site` artifact. It is
labelled for synthetic evaluation and excludes DASS administration, questions and
scoring. The original local source remains available for authorised supervised
use. Public hosting has no clinical authentication or access control and must
not receive patient details or recovery files. Pages logs visitor IP addresses
and does not inherit the Python server's security headers or no-store policy.
See [public hosting](PUBLIC_HOSTING.md) for exact exclusions and limitations.
