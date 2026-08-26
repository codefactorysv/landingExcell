import 'dotenv/config';
import { Resend } from 'resend';
import { createApp } from './app.js';

const port = Number(process.env.PORT || 8000);
const apiKey = process.env.RESEND_API_KEY?.trim();
const config = {contactEmail:process.env.CONTACT_EMAIL?.trim(),fromEmail:process.env.FROM_EMAIL?.trim(),allowedOrigins:process.env.ALLOWED_ORIGINS,trustProxy:process.env.TRUST_PROXY||1};
const missing = [['RESEND_API_KEY',apiKey],['CONTACT_EMAIL',config.contactEmail],['FROM_EMAIL',config.fromEmail]].filter(([,value]) => !value).map(([name]) => name);
if (missing.length) console.warn(`Email sending is disabled until these environment variables are configured: ${missing.join(', ')}`);
const app = createApp({resend:apiKey?new Resend(apiKey):null,config});
app.listen(port,'0.0.0.0',() => console.log(`Excell Solutions server running at http://localhost:${port}`));
