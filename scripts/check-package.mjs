/** Exercise the published archive in an isolated, offline consumer. No publishing. */
import { execFileSync } from 'node:child_process'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
const temporary = mkdtempSync(join(tmpdir(), 'open-screen-package-'))
const root = resolve(import.meta.dirname, '..')
const run = (command, args, cwd = temporary) => execFileSync(command, args, { cwd, encoding: 'utf8', stdio: ['ignore','pipe','pipe'] })
try {
  const [archive] = JSON.parse(run('npm', ['pack','--json','--pack-destination',temporary], root))
  writeFileSync(join(temporary,'package.json'), JSON.stringify({ private: true, type: 'module' }))
  run('npm', ['install','--offline','--ignore-scripts','--no-audit','--no-fund','--package-lock=false',join(temporary,archive.filename)])
  const consumer = `import assert from 'node:assert/strict';
import { createScreener } from 'open-screen';
import { questionnaires } from 'open-screen/questionnaires';
import { newAssessment, finaliseAssessment, assessmentRecord } from 'open-screen/assessment';
import { clinicalSummary } from 'open-screen/presentation';
import { createHostBridge } from 'open-screen/host';
import { DEFAULT_POLICY } from 'open-screen/policy';
import { prepare } from 'open-screen/personality';
const f=createScreener({questionnaires}),s=f.createSetup({context:'clinical',topics:Object.fromEntries(f.catalog.map(q=>[q.id,q.id==='depression']))});
const a=await finaliseAssessment(newAssessment(f.configuration,s,{'phq-1':0,'phq-2':0},{safetyReview:'Reviewed in interview',practice:{safetyMethod:'Synthetic interview',safetyOutcome:'Synthetic outcome'}},{phase:'record',cursor:null}),'Synthetic reviewer');
assert.match(clinicalSummary(assessmentRecord(a)),/Final · attested/);
assert.equal(typeof createHostBridge,'function');assert.equal(typeof prepare,'function');assert.ok(DEFAULT_POLICY);`
  writeFileSync(join(temporary,'consumer.mjs'), consumer)
  run(process.execPath, ['consumer.mjs'])
  writeFileSync(join(temporary,'contracts.mts'), `import type { HostPayload } from 'open-screen/host';
declare const payload: HostPayload;
const text: string | undefined = payload.record.text;
// @ts-expect-error Minimal exports do not promise a text appendix.
payload.record.text.length;
void text;`)
  run(process.execPath, [join(root,'node_modules/typescript/bin/tsc'),'--strict','--noEmit','--target','es2022','--module','NodeNext','contracts.mts'])
  process.stdout.write('Installed archive runtime and TypeScript contracts verified offline.\n')
} finally { rmSync(temporary, { recursive: true, force: true }) }
