import {mkdir} from 'node:fs/promises';
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {fakeSupabase} from './accounts-fixture.mjs';
const tmp=process.env.TEMP||process.env.TMP||'/tmp';
const base=process.env.LETRALIA_TEST_URL||'http://127.0.0.1:4182/';
await mkdir('test-results',{recursive:true});
const browser=await chromium.launch({channel:process.env.LETRALIA_CHROME_CHANNEL||undefined,headless:true});
try{
 const c=await browser.newContext();const p=await c.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.route('**/config.js*',r=>r.fulfill({contentType:'text/javascript',body:"window.LETRALIA_SUPABASE={url:'https://example.supabase.co',anonKey:'public-test'}"}));
 const requests=[];await p.route('https://example.supabase.co/**',async r=>{requests.push(r.request().url());await r.fulfill({status:200,contentType:'application/json',body:'{}',headers:{'access-control-allow-origin':'*'}})});
 await p.goto(base);await p.locator('#account-nav').click();await p.locator('#auth-email').fill('test@example.test');await p.locator('#auth-form button').click();await p.locator('#auth-resend').waitFor();assert(requests.some(u=>u.includes('/auth/v1/otp')));assert.deepEqual(errors,[]);await c.close();
 const offline=await browser.newContext({viewport:{width:1100,height:850}});const page=await offline.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/config.js*',r=>r.fulfill({contentType:'text/javascript',body:"window.LETRALIA_SUPABASE={url:'https://example.supabase.co',anonKey:'public-test'}"}));await page.addInitScript(fakeSupabase,{});
 await page.goto(base);await page.locator('[data-child]').first().click();await page.locator('.letter-slot').first().waitFor();
 await offline.setOffline(true);
 await page.waitForTimeout(750);const expected=await page.locator('#prompt').innerText();await page.keyboard.press(expected.trim().toLowerCase());
 const snapshot=await page.evaluate(()=>JSON.parse(localStorage.getItem('letralia-account:11111111-1111-4111-8111-111111111111:progress:aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')));
 assert(snapshot.pending_sync);assert(Object.keys(snapshot.data.memory).length>0);
 await page.locator('#account-nav').click();await page.locator('[data-child]').first().click();await page.locator('.letter-slot').first().waitFor();
 await offline.setOffline(false);await page.waitForFunction(()=>!JSON.parse(localStorage.getItem('letralia-account:11111111-1111-4111-8111-111111111111:progress:aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')).pending_sync);
 await page.reload();await page.locator('#profile-picker').waitFor();await page.screenshot({path:'test-results/accounts-picker-desktop.png'});
 await page.locator('[data-child]').nth(1).click();await page.locator('.letter-slot').first().waitFor();assert.equal(await page.evaluate(()=>Object.keys(window.fixture.db.progress['bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'].memory||{}).length),0);
 await page.locator('#account-nav').click();await page.locator('#picker-signout').click();
 const question=await page.locator('#parent-gate strong').innerText();const [,a,b]=question.match(/(\d+) \+ (\d+)/);await page.locator('#gate-answer').fill(String(+a + +b));await page.locator('#gate-submit').click();await page.locator('#logout-confirm').click();await page.getByText('Sesión cerrada',{exact:true}).waitFor();await page.locator('#close-modal').click();await page.locator('#start').click();await page.locator('.letter-slot').first().waitFor();assert.equal(await page.locator('#account-nav').innerText(),'👤 Entrar');
 assert.deepEqual(errors,[]);await offline.close();console.log('PASS: real pinned SDK OTP request, offline play and reconnect upload, selector on reload, isolated second profile.');
}finally{await browser.close()}

