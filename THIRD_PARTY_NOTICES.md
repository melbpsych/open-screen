# Third-party material and instrument conditions

Reviewed against the linked primary sources on 6 November 2026. This register
records the distribution basis and remaining limits; it does not grant rights on
behalf of questionnaire owners or establish clinical acceptance. Original
questionnaire rights are separate from the licence for Open Screen's own code.
Retain source notices when redistributing, including in generated reports.

| Material | Source and distribution basis | Conditions retained |
| --- | --- | --- |
| PHQ-2/PHQ-9 and GAD-2/GAD-7, Australian-English forms | [Publisher manual, p. 8](https://www.phqscreeners.com/images/sites/g/files/g10016261/f/201412/instructions.pdf) permits reproduction, translation, display and distribution. | Retain developer credit: Drs. Robert L. Spitzer, Janet B.W. Williams, Kurt Kroenke and colleagues, with an educational grant from Pfizer Inc. Bundled forms remain unchanged. |
| PC-PTSD-5 | [VA source](https://www.ptsd.va.gov/professional/assessment/screens/pc-ptsd.asp), public domain, not copyrighted. | Intended for qualified health professionals and researchers; preserve source/version and interpretation limits. |
| PCL-5 | [VA source](https://www.ptsd.va.gov/professional/assessment/adult-sr/ptsd-checklist.asp), public domain, not copyrighted. | Same professional-use limits; do not claim VA endorsement of this app. |
| ASRS-v1.1 six-question screener only | [NYU licensing page](https://license.tov.med.nyu.edu/product/asrs6Qscreener) permits clinical/nonclinical and commercial use, including electronic versions, with attribution. | Copyright remains with New York University and the President and Fellows of Harvard College. Created by Dr. Lenard Adler and Dr. Ronald Kessler. No modifications other than electronic presentation. Not covered by the software licence. ASRS-18 and ASRS-5 are excluded. |
| TAPS, CTN Web v2.0, 19 September 2017 | [CTN instrument page](https://ctnlibrary.org/instrument/nida-clinical-trials-network-taps-tool/) declares public-domain availability. | Retain original US form, drink examples, form choice, source and scoring provenance; do not claim Australian validation. |
| DSS-B, 2024 VA form | [VA form/scoring](https://www.ptsd.va.gov/professional/assessment/adult-sr/dss.asp) and [development article](https://pmc.ncbi.nlm.nih.gov/articles/PMC10478338/), public-domain instrument. | Retain instrument attribution/version; no invented cutoff. The journal article itself is separate from the instrument. |
| IPIP items, Mini-IPIP, IPIP-NEO-120, selected IPIP-hosted CAT-PD scales, response-pattern items | [IPIP permission](https://ipip.ori.org/newPermission.htm) permits any commercial/noncommercial purpose without permission. | Preserve scientific attribution and exact source identification. This does not cover proprietary NEO inventories or every CAT-PD product. |
| Five-item personality reference counts | Aggregated counts derived from the [Open-Source Psychometrics IPIP-FFM data release](https://openpsychometrics.org/_rawdata/), linked in the measure definition. | IPIP item permission does not itself license third-party datasets. This repo distributes aggregate frequencies, not respondent-level data; the dataset page does not state an explicit blanket software licence. Do not relicense the raw dataset or represent these frequencies as clinical norms. Review separate dataset terms before redistributing raw data. |
| AUDIT-C/AUDIT | [AUDIT publisher FAQ](https://auditscreen.org/about/faqs) permits noncommercial administration/publication without materially changing the questionnaire and with WHO-approved attribution. | A respondent must not be charged to complete it. Retain WHO-approved instrument attribution. No blanket commercial-product grant is inferred from the general WHO copyright policy. Recheck scope before a paid deployment. |
| DASS-21 Stress subscale | [UNSW FAQ](https://www2.psy.unsw.edu.au/dass/DASSFAQ.htm), especially questions 3, 9, 15, 21 and 22. Copying the public-domain questionnaire is permitted. | Online administration is restricted to a defined patient/research group, with scores returned to clinician/researcher rather than respondents. Do not sell the scales or offer public-facing administration. The public demo omits its questions and rejects DASS-enabled setups; the local form remains intact. |

SCI, OCI, WHODAS and WHO ASSIST remain external links and clinician-entered
results. No permission has been obtained to embed their questions in this
deployment. Do not enable them by changing a metadata flag. Proprietary forms
mentioned in documentation are not licensed by their mention.

## Development tools

There are no third-party runtime packages, remote fonts or analytics. Development
dependencies are installed separately from npm, pinned in `package-lock.json`:
TypeScript and Playwright are Apache-2.0; `@axe-core/playwright` and `axe-core` are
MPL-2.0. Their packages carry their own licence files. They are not bundled in
the public demo. Modified or redistributed copies retain their applicable
notices and source obligations. GitHub Actions also retain their own licences.

## Evidence limits

Source hashes in `docs/sources/manifest.json` establish captured file identity,
not permission, clinical validation or permission for future adaptations.
Unresolved written permissions and independent acceptance remain recorded in
`docs/PRACTICE_READINESS.md`. No request to a rights holder was sent during this
review. A public source release and a synthetic demo do not close practice
acceptance or permit arbitrary commercial redistribution of every instrument.
