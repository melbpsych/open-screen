import AxeBuilder from '@axe-core/playwright'
import { test, expect, setupSitting, setupView, startAssessment, complete, openReview, noOverflow } from './helpers.mjs'

async function dockVisible(page, label) {
 const dock=page.getByRole('region',{name:'Page actions',exact:true})
 await expect(dock).toBeVisible()
 const button=dock.getByRole('button',{name:label,exact:true})
 await expect(button).toBeInViewport()
 const bounds=await dock.boundingBox()
 expect(bounds.y).toBeGreaterThan(44)
 expect(bounds.y+bounds.height).toBeLessThanOrEqual((await page.evaluate(()=>innerHeight))+1)
 return button
}

test('setup navigation stays available at both ends of a long page and retains entered choices',async({page})=>{
 await page.setViewportSize({width:390,height:640})
 await page.goto('/interview.html')
 await expect(page.getByRole('region',{name:'Page actions',exact:true})).toHaveCount(0)
 await page.getByRole('radio',{name:'Clinical',exact:true}).click()
 const next=await dockVisible(page,'Continue to Ready')
 await expect(next).toBeEnabled()
 await page.getByLabel('Reference (optional)',{exact:true}).fill('SYNTHETIC-STICKY')
 for(const y of [0,100000]) {
  await page.evaluate(y=>scrollTo(0,y),y)
  await dockVisible(page,'Continue to Ready')
 }
 await next.click()
 await expect(page.getByRole('heading',{name:'Ready to begin',exact:true})).toBeFocused()
 const start=await dockVisible(page,'Start assessment')
 const back=page.getByRole('region',{name:'Page actions',exact:true}).getByRole('button',{name:'Back to measures',exact:true})
 expect(Math.abs((await start.boundingBox()).y-(await back.boundingBox()).y)).toBeLessThan(1)
 await page.getByRole('region',{name:'Page actions',exact:true}).getByRole('button',{name:'Back to measures',exact:true}).click()
 await expect(page.getByLabel('Reference (optional)',{exact:true})).toHaveValue('SYNTHETIC-STICKY')
 await page.evaluate(()=>document.documentElement.style.fontSize='200%')
 await page.setViewportSize({width:320,height:700})
 await noOverflow(page)
 await dockVisible(page,'Continue to Ready')
 expect((await new AxeBuilder({page}).analyze()).violations).toEqual([])
})

test('manual question actions remain visible without covering a focused answer at enlarged and short sizes',async({page})=>{
 await page.goto('/interview.html')
 await page.getByRole('radio',{name:'Clinical',exact:true}).click()
 await setupView(page,'Options')
 await page.locator('#advance-mode').selectOption('manual')
 await setupView(page,'Measures')
 await startAssessment(page)
 for(const size of [{width:390,height:640},{width:320,height:700},{width:844,height:390}]) {
  await page.setViewportSize(size)
  await page.evaluate(()=>document.documentElement.style.fontSize='200%')
  await noOverflow(page)
  await page.evaluate(()=>scrollTo(0,0))
  await dockVisible(page,'Continue')
  const last=page.getByRole('radiogroup').getByRole('radio').last()
  await page.locator('#question-title').focus()
  await last.focus()
  await expect.poll(()=>last.evaluate(node=>{
   const rect=node.getBoundingClientRect(),dock=document.querySelector('.action-dock').getBoundingClientRect()
   const top=Math.max(0,rect.top),bottom=Math.min(dock.top,rect.bottom)
   return bottom>top&&node.contains(document.elementFromPoint((rect.left+rect.right)/2,(top+bottom)/2))
  })).toBe(true)
 }
 await page.getByRole('radiogroup').getByRole('radio').first().click()
 await expect(page.locator('#main')).toHaveAttribute('data-step','phq-1')
 await page.getByRole('region',{name:'Page actions',exact:true}).getByRole('button',{name:'Continue',exact:true}).click()
 await expect(page.locator('#main')).toHaveAttribute('data-step','phq-2')
 await expect(page.locator('#question-title')).toBeFocused()
})

test('review copy and exports stay available with the note preview collapsed',async({page})=>{
 await setupSitting(page,{topics:['depression']})
 await complete(page);await openReview(page,{documentation:false})
 await expect(page.locator('.summary-preview')).not.toHaveAttribute('open','')
 for(const width of [1440,390,320]) {
  await page.setViewportSize({width,height:700})
  await page.evaluate(()=>scrollTo(0,0))
  await dockVisible(page,'Copy summary')
  await noOverflow(page)
 }
 await page.locator('.export-menu > summary').click()
 const save=page.getByRole('button',{name:'Save encrypted assessment',exact:true})
 await expect(save).toBeInViewport()
 await save.click()
 await expect(page.getByRole('dialog',{name:'Save encrypted assessment'})).toBeVisible()
 await page.keyboard.press('Escape')
 await expect(page.locator('.export-menu > summary')).toBeFocused()
})


test('setting cards keep whole labels and need no separate Continue action',async({page})=>{
 await page.goto('/interview.html')
 for(const width of [1968,1440,768,390,320]) {
  await page.setViewportSize({width,height:1000})
  for(const font of ['100%','200%']) {
   await page.evaluate(font=>document.documentElement.style.fontSize=font,font)
   await noOverflow(page)
   for(const name of ['Clinical','Forensic']) {
    const card=page.getByRole('radio',{name,exact:true})
    await expect(card).toBeVisible()
    expect(await card.locator('.setting-label').evaluate(node=>{
     const range=document.createRange();range.selectNodeContents(node)
     const lines=[...range.getClientRects()],parent=node.closest('button').getBoundingClientRect()
     return lines.length===1&&lines[0].right<=parent.right&&lines[0].left>=parent.left
    })).toBe(true)
   }
   await expect(page.getByRole('region',{name:'Page actions',exact:true})).toHaveCount(0)
  }
 }
 await page.getByRole('radio',{name:'Forensic',exact:true}).click()
 await expect(page.getByRole('heading',{name:'Choose measures',exact:true})).toBeFocused()
 await expect(page.locator('.setting-note')).toContainText('Thresholds are not calibrated for forensic decisions')
})
