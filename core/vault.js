/** Portable encrypted files only: no storage, network, password recovery or keys
 * retained here. The fixed KDF bounds prevent hostile files choosing costly work.
 * AES-GCM authenticates ciphertext and the versioned envelope header together.
 */
import { object } from './validation.js'
export const VAULT_LIMIT = 8_000_000
export const VAULT_PLAINTEXT_LIMIT = VAULT_LIMIT / 2
export const plaintextBytes = value => new TextEncoder().encode(JSON.stringify(value)).length
export function assertVaultCapacity(value) {
  if (plaintextBytes(value) > VAULT_PLAINTEXT_LIMIT) throw new TypeError('This sitting exceeds the encrypted file limit. Archive it into encrypted parts before continuing.')
}
const HEADER = 'OpenScreen|1|PBKDF2-SHA256|600000|AES-256-GCM'
const encoder = new TextEncoder()
const failure = () =>
  new Error(
    'Unable to unlock this file. Check the passphrase and use an intact Open Screen file.'
  )
function password(value) {
  if (typeof value !== 'string' || value.length < 12 || value.length > 1024)
    throw new TypeError('Use a passphrase of 12–1024 characters.')
}
function b64(bytes) {
  let out = ''
  for (let i = 0; i < bytes.length; i += 8192)
    out += String.fromCharCode(...bytes.subarray(i, i + 8192))
  return btoa(out)
}
function bytes(value, length) {
  if (
    typeof value !== 'string' ||
    !/^[A-Za-z0-9+/]*={0,2}$/.test(value) ||
    value.length % 4
  )
    throw failure()
  const raw = atob(value)
  const out = Uint8Array.from(raw, (c) => c.charCodeAt(0))
  if (b64(out) !== value || (length != null && out.length !== length))
    throw failure()
  return out
}
async function key(passphrase, salt, usage) {
  const material = await crypto.subtle.importKey(
    'raw',
    encoder.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey']
  )
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 600000 },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    [usage]
  )
}
export async function sealFile(value, passphrase) {
  password(passphrase)
  const encoded = encoder.encode(JSON.stringify(value))
  assertVaultCapacity(value)
  const salt = crypto.getRandomValues(new Uint8Array(16)),
    iv = crypto.getRandomValues(new Uint8Array(12))
  const ciphertext = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
      additionalData: encoder.encode(HEADER),
      tagLength: 128
    },
    await key(passphrase, salt, 'encrypt'),
    encoded
  )
  return JSON.stringify({
    format: 'OpenScreen',
    version: 1,
    kdf: 'PBKDF2-SHA256',
    iterations: 600000,
    cipher: 'AES-256-GCM',
    salt: b64(salt),
    iv: b64(iv),
    ciphertext: b64(new Uint8Array(ciphertext))
  })
}
export async function openFile(raw, passphrase) {
  password(passphrase)
  try {
    if (typeof raw !== 'string' || raw.length > VAULT_LIMIT) throw failure()
    const v = JSON.parse(raw)
    object(v, 'Encrypted file', [
      'format',
      'version',
      'kdf',
      'iterations',
      'cipher',
      'salt',
      'iv',
      'ciphertext'
    ])
    if (
      v.format !== 'OpenScreen' ||
      v.version !== 1 ||
      v.kdf !== 'PBKDF2-SHA256' ||
      v.iterations !== 600000 ||
      v.cipher !== 'AES-256-GCM'
    )
      throw failure()
    const salt = bytes(v.salt, 16),
      iv = bytes(v.iv, 12),
      ciphertext = bytes(v.ciphertext)
    if (ciphertext.length < 16 || ciphertext.length > VAULT_LIMIT / 2 + 16)
      throw failure()
    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv,
        additionalData: encoder.encode(HEADER),
        tagLength: 128
      },
      await key(passphrase, salt, 'decrypt'),
      ciphertext
    )
    return JSON.parse(
      new TextDecoder('utf-8', { fatal: true }).decode(decrypted)
    )
  } catch {
    throw failure()
  }
}
