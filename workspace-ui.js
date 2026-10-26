/** Browser-only workflow controls. Secrets live only in password fields during
 * the explicit operation; dialogs remove them on close. No persistence here.
 */
import { h, markup } from './ui.js'
import { sealFile, openFile, VAULT_LIMIT } from './core/vault.js'
import { verifyBundle } from './core/assessment.js'
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
  const close = () => dialog.close()
  dialog.addEventListener('close', () => {
    dialog.querySelectorAll('input[type=password]').forEach((x) => {
      x.value = ''
    })
    dialog.remove()
    if (prior?.isConnected) prior.focus()
  })
  document.body.append(dialog)
  return { dialog, close, show: () => dialog.showModal() }
}
export function vaultDialog({ mode, snapshot, onRestore, onHistory, onSaved }) {
  const saving = mode === 'save',
    history = mode === 'history',
    { dialog, close, show } = modal(
      saving
        ? 'Save encrypted sitting'
        : history
          ? 'Add assessment history'
          : 'Resume encrypted sitting'
    )
  const error = h('p', { role: 'alert', class: 'practice-error' }),
    pass = h('input', {
      id: 'vault-passphrase',
      type: 'password',
      autocomplete: 'off',
      minlength: 12,
      maxlength: 1024,
      required: true
    })
  const confirm = saving
    ? h('input', {
        id: 'vault-confirm',
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
    { type: 'submit', class: 'primary' },
    saving ? 'Encrypt & download' : 'Unlock file'
  )
  const cancel = h('button', { type: 'button', onClick: close }, 'Cancel')
  const form = h(
    'form',
    {
      onSubmit: async (event) => {
        event.preventDefault()
        if (submit.disabled) return
        error.textContent = ''
        submit.disabled = true
        try {
          if (saving) {
            if (pass.value !== confirm.value)
              throw new Error('The passphrases do not match.')
            const captured = snapshot(),
              checked = await verifyBundle(captured),
              encrypted = await sealFile(checked, pass.value)
            if (!dialog.open) return
            download(
              encrypted,
              'application/octet-stream',
              'open-screen-sitting.openscreen'
            )
            onSaved?.(captured)
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
                    error.textContent = 'The reference does not match.'
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
                  : 'Confirm the patient before replacing this tab’s sitting.'
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
                  { type: 'submit', class: 'primary' },
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
          submit.disabled = false
        }
      }
    },
    h(
      'p',
      { class: 'quiet' },
      saving
        ? 'Contains answers, notes and any history. Keep the file in approved practice storage and the passphrase separately. Lost passphrases cannot be recovered.'
        : 'Unlock locally. Nothing is uploaded.'
    ),
    file
      ? h(
          'label',
          { class: 'field', for: 'vault-file' },
          'Encrypted sitting file',
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
    error,
    h('div', { class: 'workflow-actions' }, submit, cancel)
  )
  dialog.append(form)
  show()
}
export function templateControls(factory, setup, { apply, status }) {
  let rows = [],
    storeError = ''
  try {
    const raw = localStorage.getItem(TEMPLATE_KEY)
    if (raw?.length > 30000) throw new Error()
    rows = validateTemplates(raw ? JSON.parse(raw) : [], factory)
  } catch {
    storeError =
      'Saved templates need review. Reset templates to remove incompatible entries.'
  }
  const select = h(
    'select',
    { id: 'sitting-template' },
    h('option', { value: '' }, 'Choose a template'),
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
    status('Practice templates saved.')
    return checked
  }
  return h(
    'details',
    { class: 'workspace-fold', 'data-section': 'templates' },
    h('summary', null, 'Practice templates'),
    h(
      'p',
      { class: 'quiet' },
      'Area selections and setting only. Administration conditions are confirmed each sitting.'
    ),
    h(
      'div',
      { class: 'field' },
      h('label', { for: 'sitting-template' }, 'Saved template'),
      select
    ),
    h(
      'div',
      { class: 'workflow-actions' },
      h(
        'button',
        {
          type: 'button',
          disabled: !rows.length,
          onClick: () => {
            if (select.value === '') return
            apply(templateSetup(rows[Number(select.value)], factory))
          }
        },
        'Apply template'
      ),
      h(
        'button',
        {
          type: 'button',
          disabled: !rows.length,
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
        'Delete template'
      )
    ),
    h(
      'label',
      { class: 'field', for: 'template-name' },
      'New template name',
      name
    ),
    h(
      'button',
      {
        type: 'button',
        onClick: () => {
          try {
            persist([
              ...rows,
              {
                name: name.value,
                context: setup.context,
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
      'Save selection as template'
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
          'Reset templates'
        )
      : null,
    message
  )
}
export function historySection(html, onAdd, count) {
  return h(
    'details',
    { class: 'workspace-fold assessment-history', 'data-section': 'history' },
    h(
      'summary',
      null,
      'Assessment history',
      h('span', null, `${count} previous final records`)
    ),
    markup(html),
    h('button', { type: 'button', onClick: onAdd }, 'Add from encrypted file')
  )
}
