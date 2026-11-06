import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { join } from 'node:path'
import { buildDemo, demoDirectory } from './build-demo.mjs'
import { dassStress as originalDass } from '../gates/instruments.js'
await buildDemo()
const { createScreener } = await import(pathToFileURL(join(demoDirectory, 'api.js')))
const { dassAllowed, patientPath, scoreDass } = await import(pathToFileURL(join(demoDirectory, 'gates/engine.js')))
const { dassStress } = await import(pathToFileURL(join(demoDirectory, 'gates/instruments.js')))
const screener = createScreener()
assert.ok(!screener.catalog.some(row => row.id === 'irritability'))
const setup = screener.createSetup({ context: 'clinical' })
const answers = { 'phq-1': 0, 'phq-2': 0, 'gad-1': 0, 'gad-2': 0, 'pcptsd-exposure': 'no' }
assert.equal(screener.progress(setup, answers).finished, true)
const restricted = { ...setup, topics: { ...setup.topics, irritability: true }, definedPatientGroup: true, scoresToClinician: true, scaleNotSold: true }
assert.throws(() => screener.getSteps(restricted, {}), /DASS is unavailable/)
assert.throws(() => screener.record(restricted, {}), /DASS is unavailable/)
assert.equal(dassAllowed(restricted), false)
assert.ok(!patientPath(restricted).some(step => step.id.startsWith('dass-')))
assert.equal(scoreDass(restricted, {}).status, 'omitted')
assert.deepEqual(dassStress.items, [])
assert.equal(originalDass.items.length, 7, 'Local instrument remains intact')
for (const name of ['index.html', 'interview.html', 'logic.html', 'help.html']) {
  assert.match(await readFile(join(demoDirectory, name), 'utf8'), /synthetic data only/)
}
for (const entry of await readdir(demoDirectory, { recursive: true })) {
  assert.ok(!/(^|\/)(\.git|\.env|private|artifacts|test-results|node_modules|\.agents)(\/|$)/.test(entry))
  assert.ok(!/\.(openscreen|oscreen|tgz)$/.test(entry))
}
console.log('Demo exclusions, synthetic scoring, notices and publication asset boundaries verified.')
