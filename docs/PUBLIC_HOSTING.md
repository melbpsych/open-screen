# Public evaluation hosting

The source repository and public demo serve different purposes. The local app is
a supervised clinical workflow. The GitHub Pages site is for synthetic evaluation
only; it is not a patient portal or an approved clinical deployment.

## Build and check

```sh
npm ci
npm run check
npm run test:e2e
npm run test:demo
```

`test:demo` builds `.demo-site`, checks its publication boundaries, and exercises
the generated app in Chromium, Firefox, WebKit and two phone emulations. Browser
prerequisites are in [E2E.md](E2E.md). For build-only use `npm run build:demo`.
Never deploy the checkout, `dist/`, clinical exports, traces or recovery files.

The builder copies explicit application assets and captured source PDFs only.
It excludes Git history, dependencies, tests, artifacts, local settings, private
files and source-review HTML. It produces a separate DASS-excluded variant:

- No DASS selection in the catalogue, no DASS questions/anchors/instructions in
  the instrument module, and no DASS administration or scoring path.
- DASS-enabled setups, including restored assessments, fail validation. Open
  these files with the compatible local release; do not alter the file to bypass
  the restriction. The demo must not be used to resume actual clinical records.
- The source application and original DASS form are unchanged. Exact build
  replacement boundaries are checked; source changes require a builder review.
- Each page carries a persistent synthetic-only notice, a no-referrer policy,
  noindex request and a restrictive meta Content Security Policy.

The hosted variant is for evaluation. Do not use its saved assessments as a
clinical recovery route. The full local release remains necessary for compatible
clinical recovery and all captured administration configurations.

## GitHub Pages

In repository **Settings → Pages**, choose **GitHub Actions**. The Pages workflow
runs only after **Verify Open Screen** succeeds for a push to this repository's
`main` branch. It checks out that exact verified commit and uploads only
`.demo-site`. Pull requests, forks and unsuccessful runs cannot deploy. To rerun
a reviewed release, rerun its original verification workflow.
The expected project URL is `https://melbpsych.github.io/open-screen/`.

Pages serves static assets over HTTPS. It does not inherit `serve.py`'s HTTP
headers, no-store response policy, localhost Host validation or frame denial.
Meta CSP cannot provide `frame-ancestors`; no equivalent header protection is
claimed. GitHub logs visitors' IP addresses for security, as described in
[GitHub's Pages documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages).
Answers remain in browser tab memory unless explicitly copied/exported, but
that does not make a public origin suitable for sensitive health information.

Practice settings/templates persist in browser storage and may survive later
visits. Use synthetic names/rationales only. Clipboard, ordinary exports,
screenshots and browser print files can expose entered information. Public
hosting provides no authentication, professional qualification check or clinical
governance. Unrestricted DASS administration must never be restored by deploying
the original root application here.
