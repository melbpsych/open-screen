/** Build an allowlisted public evaluation site, never a copy of the checkout. */
import { mkdir, readFile, readdir, writeFile, copyFile, rm } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import { dassStress } from '../gates/instruments.js'

const root = fileURLToPath(new URL('../', import.meta.url))
export const demoDirectory = join(root, '.demo-site')
const roots = ['index.html', 'interview.html', 'logic.html', 'help.html',
  'styles.css', 'interview.css', 'logic.css', 'help.css', 'favicon.svg',
  'bootstrap.js', 'app.js', 'interview.js', 'logic.js', 'ui.js',
  'workspace-ui.js', 'review-ui.js', 'app-config.js', 'api.js',
  'presentation.js', 'policy.js']

// Fail closed if an upstream edit moves a reviewed exclusion boundary.
function replaceOnce(source, before, after) {
  if (source.split(before).length !== 2) throw new Error('Demo exclusion boundary changed; review the builder before publishing.')
  return source.replace(before, after)
}

export async function buildDemo() {
  await rm(demoDirectory, { recursive: true, force: true })
  await mkdir(demoDirectory)
  const assets = [...roots]
  for (const directory of ['core', 'gates', 'measures', 'questionnaires', 'config']) {
    for (const name of await readdir(join(root, directory))) {
      if (/\.(js|json)$/.test(name)) assets.push(`${directory}/${name}`)
    }
  }
  const manifest = JSON.parse(await readFile(join(root, 'docs/sources/manifest.json'), 'utf8'))
  assets.push(...manifest.files.filter(row => row.file.endsWith('.pdf')).map(row => `docs/sources/${row.file}`))
  for (const asset of assets) {
    await mkdir(join(demoDirectory, asset, '..'), { recursive: true })
    await copyFile(join(root, asset), join(demoDirectory, asset))
  }
  const apiPath = join(demoDirectory, 'api.js')
  let api = await readFile(apiPath, 'utf8')
  api = replaceOnce(api, '  { id: "irritability", name: "Tension", detail: "DASS-21 Stress", tag: "Optional · 7 items" },\n', '')
  api = replaceOnce(api, '  function validateSetup(setup) {', '  function validateSetup(setup) {\n    if (setup?.topics?.irritability) throw new TypeError("DASS is unavailable in the public demo. Use the local application for authorised administration.")')
  await writeFile(apiPath, api)
  const enginePath = join(demoDirectory, 'gates/engine.js')
  await writeFile(enginePath, replaceOnce(await readFile(enginePath, 'utf8'),
    'export function dassAllowed(setup) {', 'export function dassAllowed(setup) {\n  return false // Public demo: no DASS administration or scoring.'))
  const instrumentsPath = join(demoDirectory, 'gates/instruments.js')
  const instruments = await readFile(instrumentsPath, 'utf8')
  const start = instruments.indexOf('export const dassStress = {')
  const end = instruments.indexOf('export const ipipTraits = [', start)
  if (start < 0 || end < 0) throw new Error('DASS source boundary changed; review the builder.')
  // Retain provenance; distribute no DASS questions, anchors or instructions in the site.
  await writeFile(instrumentsPath, instruments.slice(0, start) +
    `export const dassStress = ${JSON.stringify({ ...dassStress, items: [], options: [], instructions: '' })}\n\n` + instruments.slice(end))
  const banner = '<aside class="demo-notice" aria-label="Public evaluation demo"><strong>Public evaluation demo · synthetic data only.</strong> Do not enter patient details or use this site for clinical care. DASS is unavailable here. <a href="https://github.com/melbpsych/open-screen#readme" rel="noreferrer">Local setup and limitations</a>. GitHub logs visitor IP addresses.</aside>'
  const csp = "default-src 'none'; script-src 'self'; connect-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; base-uri 'none'; form-action 'none'; object-src 'none'"
  for (const name of roots.filter(name => name.endsWith('.html'))) {
    const path = join(demoDirectory, name)
    let html = await readFile(path, 'utf8')
    html = replaceOnce(html, '<body>', `<body>\n${banner}`)
    html = replaceOnce(html, '<head>', `<head>\n  <meta http-equiv="Content-Security-Policy" content="${csp}">\n  <meta name="referrer" content="no-referrer">\n  <meta name="robots" content="noindex,nofollow">\n  <link rel="stylesheet" href="demo.css">`)
    await writeFile(path, html)
  }
  await writeFile(join(demoDirectory, 'demo.css'), '.demo-notice{padding:1rem;max-width:75rem;margin:auto;background:#fff4cf;color:#302900;font:1rem/1.5 system-ui}.demo-notice a{color:inherit;text-decoration:underline}@media print{.demo-notice{display:block}}\n')
  await writeFile(join(demoDirectory, '.nojekyll'), '')
  console.log('Built public evaluation assets in .demo-site; DASS excluded. Never deploy the repository root.')
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await buildDemo()
