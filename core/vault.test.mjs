import { test } from 'node:test'
import assert from 'node:assert/strict'
import { sealFile, openFile, VAULT_LIMIT } from './vault.js'
const pass = 'synthetic testing passphrase'
test('encrypted files round-trip Unicode without plaintext metadata and use fresh salt/IV', async () => {
  const value = {
    reference: 'SYNTHETIC α',
    notes: '<sensitive>',
    answers: { a: 0 }
  }
  const a = await sealFile(value, pass),
    b = await sealFile(value, pass)
  assert.notEqual(a, b)
  assert.ok(!a.includes('SYNTHETIC'))
  assert.deepEqual(await openFile(a, pass), value)
  await assert.rejects(openFile(a, 'incorrect passphrase'), /Unable to unlock/)
  const corrupt = JSON.parse(a)
  corrupt.ciphertext = corrupt.ciphertext.replace(
    /^./,
    corrupt.ciphertext[0] === 'a' ? 'b' : 'a'
  )
  await assert.rejects(
    openFile(JSON.stringify(corrupt), pass),
    /Unable to unlock/
  )
})
test('rejects hostile envelope/KDF/size and short passwords', async () => {
  await assert.rejects(sealFile({}, 'short'), /passphrase/)
  for (const raw of [
    '{}',
    'not json',
    'x'.repeat(VAULT_LIMIT + 1),
    JSON.stringify({ format: 'OpenScreen', version: 1, iterations: 9e9 })
  ])
    await assert.rejects(openFile(raw, pass), /Unable to unlock/)
})
