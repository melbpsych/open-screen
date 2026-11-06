/** Browser-only workflow controls. Secrets live only in password fields during
 * the explicit operation; dialogs remove them on close. No persistence here.
 */
import { h, icon, markup, setFieldError } from './ui.js'
import { sealFile, openFile, VAULT_LIMIT } from './core/vault.js'
import { verifyBundle } from './core/assessment.js'
import { archiveParts } from './core/transitions.js'
import {
  TEMPLATE_KEY,
  validateTemplates,
  templateSetup
} from './core/templates.js'
export function download(content, type, filename) {
  const url = URL.createObjectURL(new Blob([content], { type })),
    a = h('a', { href: url, download: filename, hidden: true })
  document.body.append(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
function modal(title) {
  const prior = document.activeElement,
    heading = h('h2', { id: 'workflow-dialog-title' }, title)
  const dialog = h(
    'dialog',
    { class: 'workflow-dialog', 'aria-labelledby': 'workflow-dialog-title' },
    heading
  )
  const clearSecrets = () => {
    dialog.querySelectorAll('[data-secret]').forEach((x) => {
      x.value = ''
    })
  }
  // The native close event is queued after the dialog becomes invisible. Clear
  // before Cancel/Escape closes it, as well as on programmatic close cleanup.
  const close = () => { clearSecrets(); dialog.close() }
  dialog.addEventListener('cancel', clearSecrets)
  dialog.addEventListener('close', () => {
    clearSecrets()
    dialog.remove()
    if (prior?.isConnected) {
      // Opening a modal closes the floating export disclosure. Return to its
      // summary instead of attempting to focus a now-hidden action.
      const disclosure = prior.closest('details')
      if (disclosure && !disclosure.open) disclosure.querySelector('summary')?.focus()
      else prior.focus()
    }
  })
  document.body.append(dialog)
  return { dialog, close, show: () => dialog.showModal() }
}
export function leaveAssessmentDialog({ onSave, onLeave }) {
  const { dialog, close, show } = modal('Return home?')
  let action = null
  // Wait for the old modal to be removed before opening the password dialog.
  dialog.addEventListener('close', () => action?.())
  dialog.append(
    h('p', null, 'Your progress has not been saved in a current encrypted file. Save progress before leaving to resume this assessment later.'),
    h('p', { class: 'quiet' }, 'Save progress downloads an encrypted file, then returns home. Keep the file and its passphrase to resume later.'),
    h('div', { class: 'workflow-actions' },
      h('button', { type: 'button', class: 'primary action action-primary', onClick: () => { action = onSave; close() } }, 'Save progress'),
      h('button', { type: 'button', class: 'action action-secondary', onClick: () => { action = onLeave; close() } }, 'Leave without saving'),
      h('button', { type: 'button', class: 'action action-secondary', autofocus: true, onClick: close }, 'Keep working')))
  show()
}

export function vaultDialog({ mode, snapshot, onRestore, onHistory, onSaved, archive = false }) {
  const saving = mode === 'save',
    history = mode === 'history',
    { dialog, close, show } = modal(
      saving
        ? archive ? 'Archive assessment and history' : 'Save encrypted assessment'
        : history
          ? 'Add assessment history'
          : 'Resume encrypted assessment'
    )
  const error = h('p', { role: 'alert', class: 'practice-error', tabindex: '-1' }),
    pass = h('input', {
      id: 'vault-passphrase',
      'data-secret': '',
      type: 'password',
      autocomplete: 'off',
      minlength: 12,
      maxlength: 1024,
      required: true
    })
  const confirm = saving
    ? h('input', {
        id: 'vault-confirm',
        'data-secret': '',
        type: 'password',
        autocomplete: 'off',
        minlength: 12,
        maxlength: 1024,
        required: true
      })
    : null
  const file = saving
    ? null
    : h('input', {
        id: 'vault-file',
        type: 'file',
        accept: '.openscreen',
        required: true
      })
  const submit = h(
    'button',
    { type: 'submit', class: 'primary action action-primary' },
    saving ? 'Encrypt & download' : 'Unlock file'
  )
  const cancel = h('button', { type: 'button', class: 'action action-secondary', onClick: close }, 'Cancel')
  const form = h(
    'form',
    {
      onSubmit: async (event) => {
        event.preventDefault()
        if (submit.disabled) return
        error.textContent = ''
        submit.disabled = true
        form.setAttribute('aria-busy', 'true')
        submit.textContent = saving ? 'Encrypting…' : 'Unlocking…'
        try {
          if (saving) {
            if (pass.value !== confirm.value) {
              setFieldError(confirm, 'The passphrases do not match.')
              confirm.focus()
              return
            }
            const captured = snapshot()
            const parts = archive ? await archiveParts(captured) : [await verifyBundle(captured)]
            const encrypted = []
            for (const part of parts) {
              if (!dialog.open) return
              encrypted.push(await sealFile(part, pass.value))
            }
            if (!dialog.open) return
            encrypted.forEach((content, index) => download(content, 'application/octet-stream', archive ? `open-screen-archive-${index + 1}-of-${parts.length}.openscreen` : 'open-screen-sitting.openscreen'))
            onSaved?.(captured, parts.length)
            close()
          } else {
            const selected = file.files[0]
            if (!selected || selected.size > VAULT_LIMIT)
              throw new Error('Choose an Open Screen file smaller than 8 MB.')
            const bundle = await verifyBundle(
              await openFile(await selected.text(), pass.value)
            )
            if (!dialog.open) return
            pass.value = ''
            const reference = bundle.current.clinician.reference || ''
            const check = h('input', {
              id: 'resume-reference',
              type: 'text',
              maxlength: 200,
              autocomplete: 'off',
              required: true
            })
            const confirmation = h(
              'form',
              {
                onSubmit: (event) => {
                  event.preventDefault()
                  if (check.value !== (reference || 'NO REFERENCE')) {
                    setFieldError(check, 'The reference does not match.')
                    check.focus()
                    return
                  }
                  try {
                    if (history) onHistory(bundle)
                    else onRestore(bundle)
                    close()
                  } catch (e) {
                    error.textContent = e.message
                  }
                }
              },
              h(
                'p',
                null,
                history
                  ? 'Confirm the patient before adding final assessments.'
                  : 'Confirm the patient before replacing this tab’s assessment.'
              ),
              h(
                'p',
                { class: 'reference-confirm' },
                'File reference: ',
                h('strong', null, reference || 'No reference recorded')
              ),
              h(
                'label',
                { class: 'field', for: 'resume-reference' },
                reference ? 'Re-enter this reference' : 'Type NO REFERENCE',
                check
              ),
              error,
              h(
                'div',
                { class: 'workflow-actions' },
                h(
                  'button',
                  { type: 'submit', class: 'primary action action-primary' },
                  history ? 'Add final assessments' : 'Confirm & resume'
                ),
                cancel
              )
            )
            form.replaceWith(confirmation)
            check.focus()
          }
        } catch (e) {
          error.textContent = e.message
          error.focus()
        } finally {
          form.removeAttribute('aria-busy')
          submit.disabled = false
          submit.textContent = saving ? 'Encrypt & download' : 'Unlock file'
        }
      }
    },
    h(
      'p',
      { class: 'quiet' },
      saving
        ? archive ? 'Creates independently encrypted parts containing every assessment. Allow multiple downloads and verify that every numbered part is saved before removing history. The passphrase unlocks each part; nothing is removed automatically.' : 'Contains answers, notes and any history. Keep the file in approved practice storage and the passphrase separately. Lost passphrases cannot be recovered.'
        : 'Unlock locally. Nothing is uploaded.'
    ),
    file
      ? h(
          'label',
          { class: 'field', for: 'vault-file' },
          'Encrypted assessment file',
          file
        )
      : null,
    h(
      'label',
      { class: 'field', for: 'vault-passphrase' },
      'Passphrase (12+ characters)',
      pass
    ),
    confirm
      ? h(
          'label',
          { class: 'field', for: 'vault-confirm' },
          'Confirm passphrase',
          confirm
        )
      : null,
    h('button', { type: 'button', class: 'passphrase-toggle', pressed: false, onClick: event => {
      const show = pass.type === 'password'
      for (const field of [pass, confirm].filter(Boolean)) field.type = show ? 'text' : 'password'
      event.currentTarget.setAttribute('aria-pressed', String(show))
      event.currentTarget.textContent = show ? 'Hide passphrase' : 'Show passphrase'
    } }, 'Show passphrase'),
    error,
    h('div', { class: 'workflow-actions' }, submit, cancel),
    h('a', { href: 'help.html#save', target: '_blank', rel: 'noopener noreferrer', class: 'context-help' }, 'Saving & recovery help ↗')
  )
  if (confirm) form.addEventListener('input', event => {
    if ((event.target === pass || event.target === confirm) && pass.value === confirm.value && confirm.validity.valid) setFieldError(confirm)
  })
  dialog.append(form)
  show()
}
function readPracticeTemplates(factory) {
  const raw = localStorage.getItem(TEMPLATE_KEY)
  if (raw?.length > 30000) throw new Error('Preset storage exceeds the supported size')
  return validateTemplates(raw ? JSON.parse(raw) : [], factory)
}
export function templateControls(factory, setup, { apply, status }) {
  let rows = [],
    storeError = ''
  try {
    rows = readPracticeTemplates(factory)
  } catch {
    storeError =
      'Saved presets need review. Reset presets to remove incompatible entries.'
  }
  const select = h(
    'select',
    { id: 'sitting-template', onChange: event => {
      event.target.closest('details').querySelectorAll('.template-selection-action').forEach(button => { button.disabled = event.target.value === '' })
    } },
    h('option', { value: '' }, 'Choose a preset'),
    ...rows.map((r, i) => h('option', { value: i }, r.name))
  )
  const name = h('input', {
    id: 'template-name',
    type: 'text',
    maxlength: 80,
    autocomplete: 'off'
  })
  const message = h('p', { class: 'quiet', role: 'status' }, storeError)
  const persist = (next) => {
    const checked = validateTemplates(next, factory)
    localStorage.setItem(TEMPLATE_KEY, JSON.stringify(checked))
    status('Practice presets saved.')
    return checked
  }
  return h(
    'details',
    { class: 'workspace-fold', 'data-section': 'templates' },
    h('summary', null, 'Practice presets'),
    h(
      'p',
      { class: 'quiet' },
      'Measure selections, setting and purpose. Confirm permissions each assessment.'
    ),
    h(
      'div',
      { class: 'field' },
      h('label', { for: 'sitting-template' }, 'Saved preset'),
      select
    ),
    h(
      'div',
      { class: 'workflow-actions' },
      h(
        'button',
        {
          type: 'button',
          class: 'action action-secondary template-selection-action',
          disabled: true,
          onClick: () => {
            if (select.value === '') return
            apply(templateSetup(rows[Number(select.value)], factory), rows[Number(select.value)].name)
          }
        },
        'Apply preset'
      ),
      h(
        'button',
        {
          type: 'button',
          class: 'action action-danger template-selection-action',
          disabled: true,
          onClick: () => {
            if (select.value === '') return
            try {
              persist(rows.filter((_, i) => i !== Number(select.value)))
              apply(null)
            } catch (e) {
              message.textContent = e.message
            }
          }
        },
        'Delete preset'
      )
    ),
    h(
      'label',
      { class: 'field', for: 'template-name' },
      'New preset name',
      name
    ),
    h(
      'button',
      {
        type: 'button',
        class: 'action action-secondary',
        onClick: () => {
          try {
            persist([
              ...rows,
              {
                name: name.value,
                context: setup.context,
                mode: setup.mode || "screening",
                topics: Object.keys(setup.topics).filter(
                  (id) => setup.topics[id]
                )
              }
            ])
            apply(null)
          } catch (e) {
            message.textContent = e.message
          }
        }
      },
      'Save as preset'
    ),
    storeError
      ? h(
          'button',
          {
            type: 'button',
            onClick: () => {
              localStorage.removeItem(TEMPLATE_KEY)
              apply(null)
            }
          },
          'Reset presets'
        )
      : null,
    message
  )
}
export function historySection(html, onAdd, count, { onArchive, onClear, canClear = false, comparison } = {}) {
  const content = h('div', { class: 'history-content' }, markup(html))
  // Keep the shared report markup intact; compact only the on-screen wrapper.
  content.querySelectorAll('.history-series').forEach((section, index) => {
    const label = section.querySelector('h3')?.textContent || 'Measure history'
    const latest = section.querySelector('tbody tr:last-child td:nth-child(2)')?.textContent
    const disclosure = h('details', { class: 'history-form', 'data-section': 'history-form-' + index },
      h('summary', null, h('span', null, label), latest ? h('span', { class: 'quiet' }, 'Latest ' + latest) : null))
    section.replaceWith(disclosure)
    disclosure.append(section)
  })
  return h(
    'details',
    { class: 'workspace-fold assessment-history', 'data-section': 'history', id: 'assessment-history', tabindex: '-1' },
    h(
      'summary',
      null,
      'Assessment history',
      h('span', null, `${count} previous final ${count === 1 ? "record" : "records"}`)
    ),
    content,
    comparison,
    h('button', { type: 'button', onClick: onAdd }, 'Add from encrypted file'),
    onArchive ? h('button', { type: 'button', onClick: onArchive }, 'Archive encrypted history') : null,
    onClear && count ? h('button', { type: 'button', disabled: !canClear, onClick: onClear }, 'Remove archived history from this tab') : null,
    count ? h('p', { class: 'quiet' }, 'Archive first, verify every numbered file, then explicitly remove history to free capacity. No record is removed automatically.') : null,
    h('a', { class: 'context-help', href: 'help.html#monitor', target: '_blank', rel: 'noopener noreferrer' }, 'Monitoring guidance ↗')
  )
}

/** Quick choices reuse the validated practice templates. They never store a
 * patient reference or carry permission confirmations into a new assessment. */
export function presetPicker(factory, { selected, onCustom, onApply, onManage }) {
  let rows = []
  try { rows = readPracticeTemplates(factory) } catch { /* Management exposes the existing recovery message. */ }
  const quickRows = rows.slice(0, 3)
  const active = rows.find(row => row.name === selected)
  if (active && !quickRows.includes(active)) quickRows.splice(2, 1, active)
  if (!rows.length) return null
  return h('details', { class: 'preset-picker', 'aria-label': 'Assessment starting point', 'data-section': 'preset-picker' }, h('summary', null, selected || 'Choose a preset'),
    h('div', { class: 'preset-heading' }, h('span', { class: 'quiet' }, 'Start from'),
      h('button', { type: 'button', class: 'text-button', onClick: onManage }, 'Manage presets')),
    h('div', { class: 'preset-choices' },
      h('button', { type: 'button', class: 'preset-choice', pressed: !selected, onClick: onCustom },
        icon('sliders'), h('span', null, h('strong', null, 'Custom assessment'), h('small', null, 'Choose your measures')), !selected ? icon('check') : null),
      ...quickRows.map(row => h('button', { type: 'button', class: 'preset-choice', pressed: selected === row.name, onClick: () => onApply(templateSetup(row, factory), row.name) },
        icon('book'), h('span', null, h('strong', null, row.name), h('small', null, `${row.topics.length} measures · ${row.context === 'forensic' ? 'Forensic' : 'Clinical'}`)), selected === row.name ? icon('check') : null))))
}
