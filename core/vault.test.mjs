import { test, mock } from 'node:test'
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

// Start from a valid encrypted file so each rejection tests exactly one defect.
// No hostile envelope may start password derivation, even if decryption would fail.
test('invalid envelope fields are rejected before expensive key derivation', async () => {
  const valid = JSON.parse(await sealFile({ reference: 'SYNTHETIC' }, pass))
  const derive = mock.method(crypto.subtle, 'deriveKey', () => {
    throw new Error('Key derivation must not run for an invalid envelope')
  })
  try {
    for (const [field, values] of Object.entries({
      format: ['Other'], version: [2], kdf: ['PBKDF2-SHA1'],
      iterations: [0, 599999, 600001, 9e9, '600000'], cipher: ['AES-CBC'],
      salt: ['', 'AA==', '*'.repeat(24)], iv: ['', 'AA=='],
      ciphertext: ['', 'AA==', '*'.repeat(24)], unexpected: [true]
    })) {
      for (const value of values) {
        await assert.rejects(openFile(JSON.stringify({ ...valid, [field]: value }), pass), /Unable to unlock/, `${field}: ${value}`)
      }
    }
    assert.equal(derive.mock.callCount(), 0, 'Invalid files must not reach the KDF')
  } finally {
    derive.mock.restore()
  }
})

test('well-formed salt and IV tampering fails authentication', async () => {
  const valid = JSON.parse(await sealFile({ reference: 'SYNTHETIC' }, pass))
  for (const field of ['salt', 'iv']) {
    const changed = Buffer.from(valid[field], 'base64')
    changed[0] ^= 1
    await assert.rejects(openFile(JSON.stringify({ ...valid, [field]: changed.toString('base64') }), pass), /Unable to unlock/, field)
  }
  assert.deepEqual(await openFile(JSON.stringify(valid), pass), { reference: 'SYNTHETIC' })
})
