/** Presentation-only review controls. Assessment requirements remain in the
 * shared workflow validator; exports use the existing assessment/report actions. */
import { reviewIssues } from './core/workflow.js'
import { panelHtml, profilesMarkup, scoreChart } from './presentation.js'
import { h, icon, markup, positionExportPanel } from './ui.js'

export function revealReviewTarget(id) {
  const target = document.getElementById(id)
  if (!target) return
  for (let parent = target.parentElement; parent; parent = parent.parentElement) {
    if (parent.tagName === 'DETAILS') parent.open = true
  }
  if (!target.matches('input, textarea, select, button, a[href], [tabindex]')) target.tabIndex = -1
  target.focus()
}

export function reviewChecklist(record, { finished, finalised, onContinue }) {
  const issues = reviewIssues(record)
  return h('section', { class: 'review-checklist', id: 'review-checklist', tabindex: '-1', 'aria-labelledby': 'checklist-title' },
    h('div', { class: 'review-section-heading' }, h('h2', { id: 'checklist-title' }, 'Review checklist'),
      h('span', { class: 'quiet' }, finalised ? 'Final record' : finished && !issues.length ? 'Ready to attest' : `${issues.length + (finished ? 0 : 1)} to complete`)),
    h('ul', { class: 'review-tasks' },
      !finished ? h('li', null, h('button', { type: 'button', onClick: onContinue }, icon('list'), 'Continue unanswered questions', icon('arrow'))) : null,
      ...issues.map(issue => h('li', null, h('button', { type: 'button', onClick: () => revealReviewTarget(issue.target), 'aria-describedby': 'issue-' + issue.id }, icon('clock'), issue.label, icon('arrow')), h('span', { class: 'sr-only', id: 'issue-' + issue.id }, issue.message)))),
    finished && !issues.length ? h('a', { href: '#review-signoff', onClick: event => { event.preventDefault(); revealReviewTarget('review-signoff') } }, icon('check'), finalised ? 'View final record' : 'Review and attest', icon('arrow')) : null)
}

export function exportTools(actions) {
  const appendix = h('input', { type: 'checkbox', onChange: event => actions.onAppendix(event.target.checked) })
  appendix.checked = actions.includeAppendix
  const button = (id, label, action, symbol) => h('button', { type: 'button', id, class: id === 'new-sitting' ? 'action-danger' : null, onClick: action }, symbol ? icon(symbol) : null, label)
  return h('details', { class: 'export-menu', 'data-section': 'export-menu', onToggle: event => positionExportPanel(event.currentTarget) },
    h('summary', null, icon('save'), 'Save & export'),
    h('div', { class: 'export-options', role: 'region', 'aria-labelledby': 'export-title' },
      h('div', { class: 'export-panel-heading' }, h('h2', { id: 'export-title' }, 'Save & export'),
        h('button', { type: 'button', class: 'export-close', 'aria-label': 'Close exports', onClick: event => {
          const menu = event.currentTarget.closest('details')
          menu.open = false; menu.querySelector('summary').focus()
        } }, 'Close')),
      h('section', { class: 'export-group', 'aria-labelledby': 'export-recovery' },
        h('h3', { id: 'export-recovery' }, 'Resume later'),
        h('p', { class: 'quiet' }, 'Encrypted assessment · passphrase required'),
        button('save-sitting', 'Save encrypted assessment', actions.saveSitting, 'lock')),
      h('section', { class: 'export-group', 'aria-labelledby': 'export-report' },
        h('h3', { id: 'export-report' }, 'Clinical report'),
        h('p', { class: 'quiet' }, 'Unencrypted · use approved clinical storage'),
        button('download-report', 'Save report', actions.downloadReport, 'download'),
        button('print-report', 'Print report', actions.printReport, 'print'),
        button('copy-record', 'Copy summary', actions.copySummary, 'copy')),
      h('section', { class: 'export-group', 'aria-labelledby': 'export-data' },
        h('h3', { id: 'export-data' }, 'Structured data'),
        button('save-json', 'Save structured JSON', actions.downloadJSON),
        button('copy-full-record', 'Copy full record', actions.copyFull),
        h('label', { class: 'export-appendix' }, appendix, 'Include response appendix')),
      h('section', { class: 'export-group export-management', 'aria-label': 'Assessment actions' },
        button('review-responses', 'Review responses', actions.reviewAnswers),
        button('new-sitting', 'New assessment', actions.clearSitting)),
      h('a', { class: 'export-help', href: 'help.html#save', target: '_blank', rel: 'noopener noreferrer' }, 'Saving & recovery help ↗')))
}

/** Preview the same raw-score model used in the report; never combine scales. */
function resultPlot(panel) {
  if (!Number.isInteger(panel.value) || panel.notAdministered) return null
  const rendered = document.createElement('div')
  rendered.append(markup(scoreChart({ label: panel.instrument, value: panel.value, max: panel.max, threshold: panel.threshold, bands: panel.bands })))
  const chart = rendered.querySelector('figure')
  if (!chart) return null
  return h('span', { class: 'result-plot', role: 'img', 'aria-label': chart.getAttribute('aria-label') },
    chart.querySelector('svg'), h('span', { class: 'result-scale', 'aria-hidden': 'true' }, h('span', null, '0'), h('span', null, panel.threshold == null ? 'Raw score' : `Follow-up ≥${panel.threshold}`), h('span', null, String(panel.max))))
}
export function resultIndex(panels) {
  return h('section', { class: 'clinical-results', 'aria-label': 'Two-stage screening results' }, ...panels.map(panel =>
    h('details', { class: 'compact-result result-detail', 'data-section': 'result-' + panel.id, open: panel.value == null && !panel.notAdministered },
      h('summary', null, h('span', { class: 'result-name' }, panel.title, h('span', { class: 'quiet' }, panel.instrument)),
        h('span', { class: 'result-reading' }, panel.notAdministered ? 'Not administered' : panel.value == null ? 'Incomplete' : `${panel.value}/${panel.max}`,
          h('span', { class: 'quiet' }, [panel.band, panel.badge].filter(Boolean).join(' · '))), resultPlot(panel)), markup(panelHtml(panel)))))
}

/** Completion is workflow state, not a patient health/risk score. A current
 * snapshot still requires the clinician to verify their downloaded file. */
export function assessmentLifecycle({ finished, finalised, saved }) {
  return h('ol', { class: 'assessment-lifecycle', id: 'assessment-lifecycle', 'aria-label': 'Assessment status' },
    ...[['Questions', finished ? 'Finished' : 'In progress', finished, 'list'], ['Clinical review', finalised ? 'Finalised' : 'Draft', finalised, 'shield'], ['Encrypted file', saved ? 'Snapshot current' : 'Not saved', saved, 'lock']].map(([label, state, done, symbol]) =>
      h('li', { class: done ? 'done' : '' }, h('span', { class: 'lifecycle-icon' }, icon(done ? 'check' : symbol)), h('span', null, h('strong', null, label), h('small', null, state)))))
}

export function profileIndex(record) {
  const content = h('div', { class: 'profile-results' }, markup(profilesMarkup(record)))
  content.querySelectorAll('.profile-panel').forEach(panel => {
    const row = record.additional.find(row => row.id === panel.dataset.profile)
    const count = row.scales.filter(scale => scale.level !== 'facet').length
    const disclosure = h('details', { class: 'profile-result result-detail', 'data-section': 'profile-' + row.id, open: row.status !== 'scored' && row.status !== 'omitted' },
      h('summary', null, h('span', { class: 'result-name' }, row.label, h('span', { class: 'quiet' }, `${count} separate ${row.algorithm === 'taps' ? 'substance' : 'trait'} scores`)),
        h('span', { class: 'result-reading' }, row.status === 'scored' ? 'Complete' : row.status === 'omitted' ? 'Not administered' : 'Incomplete')))
    panel.replaceWith(disclosure); disclosure.append(panel)
  })
  return content
}
