/** Independent clinical boundary cases and published keyed response patterns.
 * Synthetic responses only. Sources and original forms: docs/MEASURES.md.
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { createScreener, exportJSON } from '../api.js'
import { questionnaires } from '../questionnaires/registry.js'
import { practiceFields, configurePractice } from './practice.js'
import { buildReport, clinicalSummary, profilesMarkup } from '../presentation.js'
const app = createScreener({ questionnaires })
const def = (id) => questionnaires.find((q) => q.id === id)
function setup(ids, extra = {}) {
  return app.createSetup({ context: 'clinical', topics: Object.fromEntries(app.catalog.map((q) => [q.id, ids.includes(q.id)])), ...extra })
}
function result(id, answers, extra = {}) { return app.record(setup([id], extra), answers).additional[0] }
function responses(id, raw) { return Object.fromEntries(def(id).items.map((item) => [item.id, raw])) }
const tapsSetup = (form = 'female') => setup(['taps'], { forms: { taps: form }, confirmations: { 'taps:us-form': true } })
const briefs = (form = 'female', values = [4,4,4,4]) => Object.fromEntries(['tobacco', 'alcohol-'+form, 'drugs', 'prescription'].map((group, i) => ['taps-brief-'+group, values[i]]))

test('ASRS uses six item-specific endorsement keys, not a uniform raw cutoff', () => {
  const below = Object.fromEntries([1,2,3,4,5,6].map((i) => [`asrs-v1-1-${i}`, i <= 3 ? 1 : 2]))
  assert.equal(result('asrs-v1-1', below).total, 0)
  const exactlyThree = { ...below, 'asrs-v1-1-1':2, 'asrs-v1-1-2':2, 'asrs-v1-1-3':2 }
  assert.equal(result('asrs-v1-1', exactlyThree).positive, false)
  const exactlyFour = { ...exactlyThree, 'asrs-v1-1-4':3 }
  assert.equal(result('asrs-v1-1', exactlyFour).total, 4)
  assert.equal(result('asrs-v1-1', exactlyFour).positive, true)
  assert.equal(result('asrs-v1-1', exactlyFour).continuousTotal, 13) // Different published method!
  assert.equal(result('asrs-v1-1', responses('asrs-v1-1',4)).continuousTotal, 24)
  delete exactlyFour['asrs-v1-1-6']
  assert.equal(result('asrs-v1-1', exactlyFour).total, null)
  assert.equal(result('asrs-v1-1', exactlyFour).continuousTotal, null)
})

test('named forms and algorithms cannot be repurposed or thresholds modified', () => {
  for (const id of ['asrs-v1-1','taps']) for (const mutate of [q=>q.items[0].text='Altered', q=>q.items[0].options[0].score=42, q=>q.screenAt=2]) {
    const q=structuredClone(def(id));mutate(q)
    assert.throws(()=>createScreener({questionnaires:[q]}),/unchanged reviewed form/)
  }
  assert.ok(!practiceFields(app).some((f)=>f.key.startsWith('asrs')||f.key.startsWith('taps')||f.key.startsWith('dss-b')))
  assert.throws(()=>configurePractice(app, {'asrs-v1-1.screen':3}, 'test',new Date().toISOString()),/unknown field/)
  const q=structuredClone(def('asrs-v1-1'));delete q.algorithm
  assert.throws(()=>createScreener({questionnaires:[q]}),/reviewed form/)
})

test('DSS-B scores past-week frequency without inventing a clinical cutoff', () => {
  for (const [raw, total] of [[0,0],[2,16],[4,32]]) {
    const row=result('dss-b',responses('dss-b',raw));assert.equal(row.total,total);assert.equal(row.positive,null);assert.equal(row.threshold,null)
  }
  const answers=responses('dss-b',0);delete answers['dss-b-8']
  assert.equal(result('dss-b',answers).total,null)
})

test('Mini-IPIP retains neuroticism direction and its asymmetric imagination key', () => {
  const row=result('mini-ipip',responses('mini-ipip',5))
  assert.equal(row.total,null);assert.equal(row.max,null)
  assert.deepEqual(row.scales.map(s=>s.sum),[12,12,12,12,8])
  assert.deepEqual(row.scales.map(s=>s.mean),[3,3,3,3,2])
  const neutral=result('mini-ipip',responses('mini-ipip',3))
  assert.ok(neutral.scales.every(s=>s.mean===3&&s.sum===12))
  const partial=responses('mini-ipip',3);delete partial['mini-ipip-1']
  const incomplete=result('mini-ipip',partial)
  assert.equal(incomplete.status,'incomplete');assert.equal(incomplete.scales[0].mean,null)
  assert.equal(incomplete.scales[1].mean,3) // Complete scale remains explicitly separate.
})

test('IPIP-NEO-120 computes 30 four-item facets and five 24-item domains without a grand total', () => {
  const neutral=result('ipip-neo-120',responses('ipip-neo-120',3))
  assert.equal(def('ipip-neo-120').items.length,120)
  assert.equal(neutral.scales.length,35);assert.equal(neutral.total,null)
  assert.ok(neutral.scales.every(s=>s.mean===3))
  const high=result('ipip-neo-120',responses('ipip-neo-120',5))
  assert.equal(high.scales.find(s=>s.id==='a2').sum,4) // All four morality items reverse keyed.
  assert.equal(high.scales.find(s=>s.id==='c6').sum,4) // All four cautiousness items reverse keyed.
  assert.equal(high.scales.find(s=>s.id==='n1').sum,20)
  assert.ok(high.scales.filter(s=>s.level==='domain').every(s=>s.count===24))
})

test('CAT-PD selected scales retain all six items, exact keys and original 1–5 response codes', () => {
  const expected={'catpd-anger':22,'catpd-affective-lability':22,'catpd-non-planfulness':22,'catpd-mistrust':22}
  for(const id of Object.keys(expected)) {
    assert.equal(def(id).items.length,6)
    assert.equal(result(id,responses(id,3)).scales[0].sum,18)
    assert.equal(result(id,responses(id,3)).scales[0].mean,3)
    const row=result(id,responses(id,5));assert.equal(row.positive,null);assert.equal(row.total,null)
    assert.equal(row.scales[0].sum,expected[id]) // Four positive and two reversed: 22.
  }
})

test('TAPS requires an explicit official alcohol form and administration acknowledgement', () => {
  assert.ok(app.setupErrors(setup(['taps'])).length>=2)
  assert.equal(app.getSteps(setup(['taps'])).length,0)
  assert.equal(app.record(setup(['taps'])).additional[0].status,'omitted')
  for(const form of ['male','female']) {
    const s=tapsSetup(form);assert.deepEqual(app.setupErrors(s),[])
    const path=app.getSteps(s);assert.equal(path.length,4)
    assert.ok(path.some(q=>q.id==='taps-brief-alcohol-'+form));assert.ok(!path.some(q=>q.id==='taps-brief-alcohol-'+(form==='male'?'female':'male')))
  }
  assert.throws(()=>app.createSetup({forms:{taps:'automatic'}}),/Invalid questionnaire form/)
  assert.throws(()=>app.createSetup({forms:null}),/plain object/)
})

test('TAPS negative use yields explicit zeros by stop rule, not imputed missing scores', () => {
  const s=tapsSetup(),a=briefs()
  const row=app.record(s,a).additional[0]
  assert.equal(row.status,'scored');assert.equal(row.total,null);assert.equal(row.max,null)
  assert.ok(row.scales.slice(0,-1).every(s=>s.sum===0&&s.stopRule))
  assert.equal(row.scales.at(-1).sum,null)
  delete a['taps-brief-prescription']
  assert.equal(app.record(s,a).additional[0].status,'incomplete')
  assert.equal(app.record(s,a).additional[0].scales.find(s=>s.id==='opioids').sum,null)
})

test('TAPS branches by substance class, then recent use, ignoring stale inactive responses', () => {
  const s=tapsSetup(),a=briefs('female',[4,4,3,4])
  let path=app.getSteps(s,a)
  assert.ok(path.some(q=>q.id==='taps-cannabis-use'));assert.ok(path.some(q=>q.id==='taps-other-use'))
  assert.ok(!path.some(q=>q.id==='taps-opioids-use'||q.id==='taps-alcohol-use'))
  a['taps-cannabis-use']=1;a['taps-cannabis-a']=1;a['taps-cannabis-b']=0
  for(const id of ['stimulants','heroin','other']) a[`taps-${id}-use`]=0
  let row=app.record(s,a).additional[0]
  assert.equal(row.status,'scored');assert.equal(row.scales.find(s=>s.id==='cannabis').sum,2)
  a['taps-cannabis-use']=0
  assert.equal(app.record(s,a).additional[0].scales.find(s=>s.id==='cannabis').sum,0)
  assert.ok(!app.getSteps(s,a).some(q=>q.id==='taps-cannabis-a'))
  a['taps-brief-drugs']=4
  assert.equal(app.record(s,a).additional[0].scales.find(s=>s.id==='cannabis').sum,0)
  assert.equal(app.getSteps(s,a).length,4)
})

test('TAPS alcohol has four scored yes/no items; other drugs is a direct-review observation', () => {
  for(const form of ['male','female']) {
    const s=tapsSetup(form),a=briefs(form,[4,3,3,4])
    for(const id of ['alcohol-use','alcohol-'+form,'alcohol-a','alcohol-b','other-use'])a['taps-'+id]=1
    for(const id of ['cannabis','stimulants','heroin'])a[`taps-${id}-use`]=0
    let row=app.record(s,a).additional[0];assert.equal(row.status,'incomplete')
    a['taps-other-detail']='SYNTHETIC OTHER DRUG';row=app.record(s,a).additional[0]
    assert.equal(row.status,'scored');assert.equal(row.scales.find(s=>s.id==='alcohol').sum,4)
    assert.equal(row.scales.at(-1).sum,null)
    const exported=exportJSON(app.record(s,a))
    assert.ok(!exported.includes('SYNTHETIC OTHER DRUG'));assert.ok(!exported.includes('briefResponses'))
    assert.ok(exportJSON(app.record(s,a),{includeResponses:true}).includes('SYNTHETIC OTHER DRUG'))
  }
})

test('new clinical briefs precede every optional personality profile and TAPS follow-up', () => {
  const s=setup(['depression','asrs-v1-1','taps','dss-b','mini-ipip','ipip-neo-120'],{forms:{taps:'female'},confirmations:{'taps:us-form':true}})
  const a={...briefs('female',[0,0,0,0]),'phq-1':3,'phq-2':3}
  const path=app.getSteps(s,a)
  const firstStage2=path.findIndex(q=>q.stage===2)
  assert.ok(path.slice(firstStage2).every(q=>q.stage===2))
  assert.ok(path.findIndex(q=>q.id==='dss-b-8')<firstStage2)
  assert.ok(path.findIndex(q=>q.id==='asrs-v1-1-6')<firstStage2)
  assert.ok(path.find(q=>q.id==='mini-ipip-1').stage===2)
})

test('reports, summaries and structured records retain scores, rights and provenance without profile totals', () => {
  const s=setup(['mini-ipip','asrs-v1-1']),a={...responses('mini-ipip',3),...responses('asrs-v1-1',4)}
  const record=app.record(s,a),html=buildReport(record),summary=clinicalSummary(record)
  assert.match(html,/data-profile="mini-ipip"/);assert.match(html,/keyed mean/);assert.match(html,/not a percentile/i)
  assert.match(html,/New York University and the President and Fellows of Harvard College/)
  assert.match(summary,/ASRS alternative research total: 24\/24/)
  assert.match(summary,/No combined total/)
  assert.ok(!profilesMarkup(record).includes('100/100'))
  assert.equal(JSON.parse(exportJSON(record)).configuration.engineVersion,'0.5.0')
})

function sourceRows(file) {
  const html=new TextDecoder('windows-1252').decode(readFileSync(new URL('../docs/sources/'+file,import.meta.url)))
  const clean=(text)=>text.replace(/<[^>]*>/g,'').replace(/&nbsp;/g,' ').replace(/&ndash;/g,'–').replace(/&rsquo;/g,'’').replace(/&quot;/g,'"').replace(/&amp;/g,'&').replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(+n)).replace(/\s+/g,' ').trim()
  return [...html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].map((row)=>[...row[1].matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((cell)=>clean(cell[1])))
}

test('all IPIP-NEO-120 item text, facet membership and positive/reverse keys match archived primary source',()=>{
  const rows=sourceRows('ipip-neo-120-key.html');let facet,reverse=false;const source=[]
  for(const row of rows) {
    if(row.length===1&&/^[NEOAC][1-6]:/.test(row[0])){facet=row[0].slice(0,2).toLowerCase();reverse=false}
    else if(row.length===2&&row[1]){if(row[0].includes('keyed'))reverse=row[0].includes('–');source.push({facet,text:row[1],reverse})}
  }
  assert.equal(source.length,120)
  const q=def('ipip-neo-120')
  for(const entry of source) {
    const scale=q.scales.find(s=>s.id===entry.facet)
    const item=q.items.find(item=>item.text===entry.text&&scale.itemIds.includes(item.id))
    assert.ok(item,entry.text)
    assert.deepEqual(item.options.map(o=>o.score),entry.reverse?[5,4,3,2,1]:[1,2,3,4,5],entry.text)
  }
})

test('Mini-IPIP and each selected full CAT-PD trait key match archived primary sources',()=>{
  let group=-1,reverse=false;const source=[]
  for(const row of sourceRows('mini-ipip-key.html')) {
    if(row.length===1&&row[0].startsWith('Factor ')){group++;reverse=false}
    else if(row.length===2&&row[1]){if(row[0].includes('keyed'))reverse=row[0].includes('–');source.push({group,text:row[1],reverse})}
  }
  const mini=def('mini-ipip');assert.equal(source.length,20)
  for(const entry of source){const scale=mini.scales[entry.group],item=mini.items.find(i=>i.text===entry.text);assert.ok(scale.itemIds.includes(item.id));assert.deepEqual(item.options.map(o=>o.score),entry.reverse?[5,4,3,2,1]:[1,2,3,4,5])}
  const map={'Anger':'catpd-anger','Affective Lability':'catpd-affective-lability','Non-Planfulness':'catpd-non-planfulness','Mistrust':'catpd-mistrust'}
  let name;const selected=[]
  for(const row of sourceRows('catpd-ipip-key.html')) {
    if(row.length===1&&row[0].includes(' items;'))name=row[0].split(' (')[0]
    else if(row.length===3&&/^\d+$/.test(row[0])&&map[name])selected.push({id:map[name]+'-'+row[0],text:row[2].replace(' (RK)',''),reverse:row[2].includes('(RK)'),measure:map[name]})
  }
  assert.equal(selected.length,24)
  for(const entry of selected){const item=def(entry.measure).items.find(i=>i.id===entry.id);assert.equal(item.text,entry.text);assert.deepEqual(item.options.map(o=>o.score),entry.reverse?[5,4,3,2,1]:[1,2,3,4,5])}
})

test('archived original permitted forms and keys match their recorded SHA-256 hashes',()=>{
  const manifest=JSON.parse(readFileSync(new URL('../docs/sources/manifest.json',import.meta.url)))
  for(const source of manifest.files){const bytes=readFileSync(new URL('../docs/sources/'+source.file,import.meta.url));assert.equal(createHash('sha256').update(bytes).digest('hex'),source.sha256,source.file)}
})

test('Mini-IPIP uses the original Appendix item order and reverse-coded item numbers',()=>{
  const q=def('mini-ipip'),reverse=[6,7,8,9,10,15,16,17,18,19,20]
  for(let i=1;i<=20;i++)assert.equal(q.items[i-1].options[0].score,reverse.includes(i)?5:1,`Appendix item ${i}`)
  assert.equal(q.items[6].text,"Am not interested in other people's problems.")
  assert.equal(q.items[9].text,'Am not interested in abstract ideas.')
  assert.equal(q.items[14].text,'Have difficulty understanding abstract ideas.')
  assert.equal(q.items[16].text,'Am not really interested in others.')
})

test('NEO-120 follows the primary numbered English item sequence and keys',()=>{
  const rows=sourceRows('ipip-neo-120-order.html').filter(r=>r.length===8&&/^\d+$/.test(r[0]))
  assert.equal(rows.length,120)
  const q=def('ipip-neo-120'),normal=(s)=>s.replaceAll('’',"'").replace('no absolute right or wrong','no absolute right and wrong').replace(/\.$/,'').trim()
  for(const [index,row] of rows.entries()) {
    const item=q.items[index]
    assert.equal(normal(item.text),normal(row[5]),`Numbered English item ${index+1}`)
    assert.equal(item.options[0].score,row[2][0]==='-'?5:1)
    assert.ok(q.scales.find(s=>s.id===row[2].slice(1).toLowerCase()).itemIds.includes(item.id))
  }
})

test('profiles reject inconsistent membership, grand-total thresholds and constant ranges',()=>{
  for(const mutate of [
    q=>q.scales[0].itemIds.push(q.scales[0].itemIds[0]),
    q=>q.scales[0].itemIds.push('unknown-item'),
    q=>q.screenAt=10,
    q=>q.scales[0].itemIds.forEach(id=>q.items.find(i=>i.id===id).options.forEach(o=>o.score=1)),
  ]) {const q=structuredClone(def('mini-ipip'));mutate(q);assert.throws(()=>createScreener({questionnaires:[q]}),TypeError)}
})

test('bundled definitions are immutable and a shared JSON import cannot alter the fixed comparison baseline',async()=>{
  assert.ok(Object.isFrozen(questionnaires));assert.ok(Object.isFrozen(def('asrs-v1-1').items[0].options))
  assert.throws(()=>{def('asrs-v1-1').screenAt=3},TypeError)
  const imported=(await import('../questionnaires/asrs-v1-1.json',{with:{type:'json'}})).default
  const original=imported.screenAt
  try{imported.screenAt=3;assert.throws(()=>createScreener({questionnaires:[imported]}),/unchanged reviewed form/)}
  finally{imported.screenAt=original}
  assert.equal(result('asrs-v1-1',responses('asrs-v1-1',3)).positive,true)
})

test('all selected built-in and new modules complete one coherent path without repeated questions or combined trait totals',()=>{
  const s=app.createSetup({context:'forensic',topics:Object.fromEntries(app.catalog.map(q=>[q.id,true])),auditFee:'no',auditThreshold:3,definedPatientGroup:true,scoresToClinician:true,scaleNotSold:true,forms:{taps:'female'},confirmations:{'taps:us-form':true}})
  assert.deepEqual(app.setupErrors(s),[])
  const a={},seen=new Set();let step
  while((step=app.nextStep(s,a))){
    assert.ok(!seen.has(step.id),step.id);seen.add(step.id)
    a[step.id]=step.kind==='text'?'Synthetic combined-module test':step.id.startsWith('taps-brief')?0:step.options.at(-1).value
    if(step.id.startsWith('pcptsd'))a[step.id]='yes'
    // TAPS Yes is the first option; keep all its follow-ups active.
    if(step.instrument==='taps'&&step.kind!=='text'&&!step.id.startsWith('taps-brief'))a[step.id]=1
    assert.ok(seen.size<500,'The finite sitting must terminate')
  }
  assert.ok(seen.size>300)
  assert.equal(app.progress(s,a).finished,true)
  const record=app.record(s,a)
  assert.equal(record.safetyFlag,true)
  assert.equal(record.additional.length,9)
  assert.ok(record.additional.every(q=>q.status==='scored'))
  assert.ok(record.additional.filter(q=>q.scales).every(q=>q.total===null&&q.max===null))
})

test('external review offers one ASSIST slot with current TAPS/AUDIT context and a source link',()=>{
  const record=app.record(setup(['taps'],{forms:{taps:'female'},confirmations:{'taps:us-form':true}}),briefs())
  const assist=record.cards.filter(c=>c.title.includes('ASSIST'))
  assert.equal(assist.length,1);assert.equal(assist[0].id,'substances')
  assert.equal(assist[0].entry.id,'assist')
  assert.match(assist[0].body,/TAPS and AUDIT/)
  assert.match(assist[0].url,/who.int/)
  assert.ok(!assist[0].body.includes('There is no second alcohol scale'))
})
