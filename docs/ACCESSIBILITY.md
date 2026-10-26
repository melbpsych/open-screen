# Accessibility and interaction notes

Reviewed 26 October 2026. This describes implemented behavior and repeatable checks, not a formal conformance certificate or a completed assistive-technology audit.

## Reading and visual design

The interface uses relative type sizes so browser font preferences and text enlargement affect supporting text as well as headings. Question instructions, answers and editable fields use 16px at the default 16px browser size; chart captions are at least 12px. Form boundaries have stronger contrast, selection includes a radio/check mark or weight/outline, and graph readings are available as text. The restrained green palette, serif headings and shared score charts remain consistent across the screen and offline report.

At phone widths, workspace navigation gets its own row, questionnaire choices use the available width, and export actions form a simple grid. At the narrowest sizes the grid becomes one column. Phone/short-viewport review toolbars scroll with the document, rather than occupying the reading area. Long names, category badges, report metadata and personality labels wrap. Padding stays bounded when text enlarges.

The layout is checked at 320, 390, 768 and 1440 CSS pixels, and with 200% root text size at 320px through the library, clinical questions, review, personality results and downloaded offline report. These are browser layout/font-emulation checks; they do not imply manual testing of every operating system's zoom implementation. The design follows the intent of [W3C reflow guidance](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html).

The screening logic page uses an ordered list and named sections with real text; its arrow icons are decorative. Pathways stack vertically on phones without panning or zoom controls. Optional measures and longer pathway notes use native disclosures. Compact rows share one routing explanation; the safety pause stays visible. Editable gates are named buttons that open the preference editor and focus their labelled field. Numeric fields expose ranges, units/defaults and validation feedback; native disclosures group additional rules. Live text distinguishes unsaved previews from saved practice settings. Each reset button includes its visible label in its accessible name. Browser checks cover these diagrams at the same widths and enlarged text size, including an axe scan with the disclosure open. The brand link's accessible name includes its visible “openscreen” wordmark for speech-input matching.

## Keyboard and announcements

- A skip link moves focus to the main content. Clinical question transitions focus the new heading. The standalone personality form keeps focus on its selected response.
- Question radio groups refer to the visible question heading and describe its published instructions/timeframe and exposure examples where present. Text questions receive the same context. Instrument wording is retained.
- Radio groups have one tab stop. In the clinical sitting, selecting an answer advances immediately, including arrows, Home/End, numeric shortcuts and Enter/Space activation. A visible instruction before the choices and the group's accessible description explain this behavior. Back restores the previous answer; selecting it again or changing it advances. Double-clicks and held numeric keys do not answer a second question. Free-text questions retain Continue and Ctrl/Command+Enter. Setup controls and the standalone personality form keep their usual selection behavior.
- Native details/summary controls retain Enter/Space behavior. The floating export disclosure additionally closes on Escape, restores its summary's focus, and closes when focus or a pointer moves outside. Its contents scroll if the viewport is short.
- Personality results have a named region and a concise live announcement when ready. Results appear below the questions without automatically scrolling away from the selected answer.
- Keyboard focus has a visible outline. Layout checks walk focusable review controls on desktop and at 320px, including the desktop sticky toolbar. High-contrast/forced-colour mode uses system focus colors and an additional selected outline and weight; Chromium emulation verifies it.

These decisions follow [W3C focus visibility guidance](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html) and the [disclosure pattern](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/). Important controls, navigation links, summaries and checkbox labels have targets at least 44px tall at the default size. This exceeds the baseline target size for those controls in [W3C target-size guidance](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html); it is not a claim that every inline source link is a 44px target.

## Verification and remaining checks

Automated axe WCAG A/AA scans cover the library, question, completed four-domain review, personality results and expanded forensic/alcohol/DASS setup. The expanded setup scan found a low-contrast note on the tinted sidebar; the note was darkened. Behavioral tests independently check focus, keyboard operation, larger text, targets and disclosure dismissal because an axe pass alone does not establish usability.

See [VERIFICATION.md](VERIFICATION.md) for the dated full run and [E2E.md](E2E.md) to reproduce it. All test content is synthetic. Actual speech output with screen readers, switch/voice-control use and physical-device testing remain separate checks. A host integrating the engine must retain the complete question wording/context and provide equivalent keyboard, focus and labeling behavior in its own renderer.

## Optional profile expansion · 26 October 2026

New IPIP profiles use labelled raw means and sums with accessible SVG descriptions including each score range. No meaning depends on colour alone. NEO facets are a native disclosure in the screen review; the separate print/offline report expands them so all 30 facets are retained. TAPS has labelled, keyboard-operable form selection and keeps zero-by-stop-rule explanations visible. External resources use explicit link text and a separate section from embedded measures. Browser checks cover all six optional trait profiles at 320px and 200% root text, expanded facets, axe scans, and actual A4 PDF text extraction. Automated results do not replace an assistive-technology user audit.

Recovery uses native modal dialogs with labelled file/password/reference fields,
Escape cancellation and focus return. Reference confirmation supports Enter;
cancelling while encryption is pending suppresses the eventual download. Measure
search has an accessible label, optional details remain native disclosures, and
history graphs have adjacent date/score/policy tables. Settings review similarly
uses a labelled modal with explicit acknowledgement. These paths have automated
reflow/axe/keyboard coverage. The actual human/device evaluation remains open;
use [the prepared task pack](acceptance/HUMAN_ACCESSIBILITY.md) to record it.
