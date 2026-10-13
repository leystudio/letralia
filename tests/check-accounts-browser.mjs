import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {fakeSupabase} from './accounts-fixture.mjs';
import {mkdir} from 'node:fs/promises';
const tmp=process.env.TEMP||process.env.TMP||'/tmp';
const base=process.env.LETRALIA_TEST_URL||'http://127.0.0.1:4182/';
await mkdir('test-results',{recursive:true});
const browser=await chromium.launch({channel:process.env.LETRALIA_CHROME_CHANNEL||undefined,headless:true});
const errors=[];
async function pageFor({configured=true,signedIn=true,empty=false,width=1100}={}){
 const context=await browser.newContext({viewport:{width,height:850}});const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 if(configured){await page.route('**/config.js*',r=>r.fulfill({contentType:'text/javascript',body:"window.LETRALIA_SUPABASE={url:'https://example.supabase.co',anonKey:'test-public-key'};"}));await page.addInitScript(fakeSupabase,{signedIn,empty})}
 await page.goto(base);return page;
}
async function gate(page){await page.locator('#parent-gate').waitFor();const q=await page.locator('#parent-gate strong').innerText();const [,a,b]=q.match(/(\d+) \+ (\d+)/);await page.locator('#gate-answer').fill(String(+a + +b));await page.locator('#gate-submit').click()}
try{
 const guest=await pageFor({configured:false,width:390});await guest.locator('#start').click();await guest.locator('.letter-slot').first().waitFor();await guest.locator('#account-nav').click();assert.match(await guest.locator('#modal-body').innerText(),/todavía no/);await guest.context().close();
 const login=await pageFor({signedIn:false});await login.locator('#account-nav').click();await login.locator('#auth-email').fill('adult@example.test');await login.locator('#auth-form button').click();await login.locator('#auth-resend').waitFor();assert(await login.locator('#auth-resend').isDisabled());await login.locator('#auth-correct').click();assert.equal(await login.locator('#auth-email').inputValue(),'adult@example.test');await login.evaluate(()=>window.fixture.signIn());await login.locator('#profile-picker').waitFor();await login.context().close();
 const p=await pageFor({width:390});await p.locator('#profile-picker').waitFor();assert.equal(await p.locator('[data-child]').count(),2);
 await p.screenshot({path:'test-results/accounts-picker-mobile.png'});
 await p.locator('[data-child]').first().click();await p.locator('.letter-slot').first().waitFor();assert(!(await p.locator('#modal').evaluate(e=>e.open)));
 await p.evaluate(()=>window.fixture.repeat());await p.waitForTimeout(100);assert(!(await p.locator('#modal').evaluate(e=>e.open)),'token events must not reopen picker');
 await p.locator('#family-nav').click();await p.locator('#gate-answer').fill('0');await p.locator('#gate-submit').click();assert(await p.locator('#parent-gate').isVisible());await gate(p);
 await p.getByRole('button',{name:'Niños',exact:true}).click();await p.locator('[data-edit]').first().click();await p.locator('#edit-nickname').fill('Lunita');await p.locator('[data-avatar="unicorn"]').click();await p.locator('#edit-form .primary').click();await p.getByText('Lunita',{exact:true}).waitFor();
 await p.locator('#close-modal').click();await p.locator('#account-nav').click();await p.locator('#picker-add').click();await gate(p);await p.locator('#child-name').fill('Nube');await p.locator('#child-next').click();await p.locator('[data-avatar="rabbit"]').click();await p.locator('#child-next').click();await p.locator('[data-age="6-7"]').click();await p.locator('#child-next').click();await p.locator('.letter-slot').first().waitFor();assert(!(await p.locator('#modal').evaluate(e=>e.open)));
 await p.locator('#account-nav').click();await p.locator('[data-child]').nth(1).click();await p.locator('.letter-slot').first().waitFor();
 await p.locator('#family-nav').click();await gate(p);await p.getByRole('button',{name:'Niños',exact:true}).click();await p.locator('[data-delete]').nth(1).click();await p.locator('#delete-nickname').fill('wrong');await p.locator('#delete-child-form button').click();assert.match(await p.locator('#account-error').innerText(),/no coincide/);await p.locator('#delete-nickname').fill('Sol');await p.locator('#delete-child-form button').click();await p.locator('#manage-add').waitFor();assert.equal(await p.locator('[data-delete]').count(),2);
 await p.getByRole('button',{name:'Cuenta',exact:true}).click();await p.locator('#manage-delete').click();await p.locator('#delete-account-next').click();await p.locator('#confirm-delete-account').fill('ELIMINAR');await p.locator('#delete-account-form button').click();await p.getByText('Cuenta eliminada',{exact:true}).waitFor();
 await p.context().close();
 const expired=await pageFor({signedIn:false});await expired.goto(base+'#error=access_denied&error_code=otp_expired');await expired.reload();await expired.getByText('Este enlace expiró',{exact:true}).waitFor();assert(!expired.url().includes('error='));await expired.context().close();
 assert.deepEqual(errors,[]);console.log('PASS browser: guest, email/cooldown/correction/expired link, one-tap profiles, stable auth events, gate, create/edit avatar/delete child, account deletion, mobile layout.');
}finally{await browser.close()}

