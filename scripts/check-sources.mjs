/** Asset identity only: hashes do not establish clinical validity or permissions. */
import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
const root = new URL('../docs/sources/', import.meta.url)
const manifest = JSON.parse(await readFile(new URL('manifest.json', root), 'utf8'))
for (const row of manifest.files) {
  if (!/^[a-z0-9-]+\.(pdf|html)$/.test(row.file)) throw new Error('Invalid source manifest filename')
  const bytes = await readFile(new URL(row.file, root))
  if (createHash('sha256').update(bytes).digest('hex') !== row.sha256) throw new Error('Source asset hash mismatch: ' + row.file)
}
console.log('Verified ' + manifest.files.length + ' captured source asset hashes; clinical and rights review remains separate.')
