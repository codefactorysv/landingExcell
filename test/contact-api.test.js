import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { buildEmail, createApp } from '../server/app.js';

const servers=[];
afterEach(async()=>Promise.all(servers.splice(0).map((server)=>new Promise((resolve)=>server.close(resolve)))));
async function startApp(sendResult={data:{id:'email_test_123'},error:null}) {
  const calls=[];
  const resend={emails:{send:async(payload)=>{calls.push(payload);if(sendResult instanceof Error)throw sendResult;return sendResult;}}};
  const app=createApp({resend,config:{contactEmail:'codefactorysvsv@gmail.com',fromEmail:'Excell Solutions <onboarding@resend.dev>',trustProxy:0,rateLimitMax:100}});
  const server=app.listen(0,'127.0.0.1');servers.push(server);await new Promise((resolve)=>server.once('listening',resolve));
  return {baseUrl:`http://127.0.0.1:${server.address().port}`,calls};
}
const validPayload={name:'Local Test Customer',phone:'(832) 582-9387',email:'customer@example.com',zip:'77002',service:'Deep Cleaning',message:'Please contact me about a free estimate.',company:''};
test('sends a valid estimate with reply-to',async()=>{const{baseUrl,calls}=await startApp();const response=await fetch(`${baseUrl}/api/send-estimate`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(validPayload)});const body=await response.json();assert.equal(response.status,200);assert.equal(body.ok,true);assert.equal(calls.length,1);assert.equal(calls[0].replyTo,validPayload.email);assert.equal(calls[0].to[0],'codefactorysvsv@gmail.com');assert.match(calls[0].html,/Local Test Customer/);});
test('returns field-specific validation errors',async()=>{const{baseUrl,calls}=await startApp();const response=await fetch(`${baseUrl}/api/send-estimate`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...validPayload,phone:'123',email:'bad-email',zip:'12'})});const body=await response.json();assert.equal(response.status,400);assert.equal(body.errors.phone,'Please enter a valid phone number.');assert.equal(body.errors.email,'Please enter a valid email address.');assert.equal(body.errors.zip,'Please enter a valid ZIP code.');assert.equal(calls.length,0);});
test('silently accepts honeypot spam',async()=>{const{baseUrl,calls}=await startApp();const response=await fetch(`${baseUrl}/api/send-estimate`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...validPayload,company:'spam bot'})});assert.equal(response.status,200);assert.equal(calls.length,0);});
test('hides provider failures',async()=>{const{baseUrl}=await startApp(new Error('Provider failure'));const response=await fetch(`${baseUrl}/api/send-estimate`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(validPayload)});const body=await response.json();assert.equal(response.status,502);assert.match(body.message,/call us at 832-582-9387/);assert.doesNotMatch(body.message,/Provider failure/);});
test('escapes visitor HTML in the email template',()=>{const email=buildEmail({...validPayload,zip:'',homeType:'',bedrooms:'',bathrooms:'',homeSize:'',frequency:'',preferredDate:'',message:'<img src=x onerror=alert(1)>'});assert.doesNotMatch(email.html,/<img src=x/);assert.match(email.html,/&lt;img src=x onerror=alert\(1\)&gt;/);});
