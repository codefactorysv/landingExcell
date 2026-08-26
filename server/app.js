import express from 'express';
import { rateLimit } from 'express-rate-limit';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const allowedFields = new Set(['name','phone','email','service','message','company','zip','homeType','bedrooms','bathrooms','homeSize','frequency','preferredDate']);
const fieldLimits = {name:80,phone:40,email:254,service:100,message:2000,company:200,zip:10,homeType:80,bedrooms:20,bathrooms:20,homeSize:40,frequency:80,preferredDate:20};
const allowedServices = new Set(['Residential Cleaning','Deep Cleaning','Detail Cleaning','Regular Cleaning','Kitchen Cleaning','Bathroom Cleaning','Move-In / Move-Out Cleaning','Other']);
const suspiciousPattern = /(?:<script|javascript:|data:text\/html|\u0000)/i;

const cleanString = (value) => typeof value === 'string' ? value.trim() : '';

export function escapeHtml(value) {
  return String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
}

export function validateSubmission(body) {
  const errors = {};
  const values = {};
  if (!body || typeof body !== 'object' || Array.isArray(body)) return {values,errors:{form:'Please review the form and try again.'}};
  if (Object.keys(body).some((key) => !allowedFields.has(key))) errors.form = 'Please review the form and try again.';

  for (const [field,limit] of Object.entries(fieldLimits)) {
    if (body[field] != null && typeof body[field] !== 'string') {
      errors[field] = 'Please enter a valid value.';
      values[field] = '';
      continue;
    }
    values[field] = cleanString(body[field]);
    if (values[field].length > limit) errors[field] = `Please keep this field under ${limit} characters.`;
    if (suspiciousPattern.test(values[field])) errors[field] = 'Please enter a valid value.';
  }

  if (values.company) return {values,errors:{},isSpam:true};
  if (values.name.length < 2 || /[<>{}]/.test(values.name)) errors.name = 'Please enter your name.';
  const phoneDigits = values.phone.replace(/\D/g,'');
  if (phoneDigits.length < 10 || phoneDigits.length > 15) errors.phone = 'Please enter a valid phone number.';
  if (!allowedServices.has(values.service)) errors.service = 'Please select a cleaning service.';
  if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(values.email)) errors.email = 'Please enter a valid email address.';
  if (!/^\d{5}(?:-\d{4})?$/.test(values.zip)) errors.zip = 'Please enter a valid ZIP code.';
  if ((values.message.match(/(?:https?:\/\/|www\.)/gi)?.length ?? 0) > 3) errors.message = 'Please remove extra links and try again.';
  return {values,errors,isSpam:false};
}

const displayValue = (value) => value ? escapeHtml(value) : '<span style="color:#7a8799">Not provided</span>';
const row = (label,value,highlight=false) => `<tr><td style="padding:11px 14px;border-bottom:1px solid #e8ebef;color:#68758a;font-size:11px;text-transform:uppercase;letter-spacing:.08em;width:38%;${highlight?'background:#fff8e8;':''}">${escapeHtml(label)}</td><td style="padding:11px 14px;border-bottom:1px solid #e8ebef;color:#13223a;font-size:14px;font-weight:${highlight?'700':'600'};${highlight?'background:#fff8e8;':''}">${displayValue(value)}</td></tr>`;

export function buildEmail(values) {
  const optionalHomeRows = [['Home Type',values.homeType],['Bedrooms',values.bedrooms],['Bathrooms',values.bathrooms],['Approximate Size',values.homeSize],['Cleaning Frequency',values.frequency],['Preferred Cleaning Date',values.preferredDate]].filter(([,value]) => value);
  const homeSection = optionalHomeRows.length ? `<h2 style="margin:30px 0 10px;color:#04172f;font-size:15px;text-transform:uppercase;letter-spacing:.1em">Home Information</h2><table role="presentation" style="width:100%;border-collapse:collapse;border:1px solid #e8ebef">${optionalHomeRows.map(([label,value]) => row(label,value)).join('')}</table>` : '';
  const safeMessage = values.message ? escapeHtml(values.message).replaceAll('\n','<br>') : '<span style="color:#7a8799">Not provided</span>';
  const html = `<!doctype html><html><body style="margin:0;padding:0;background:#f1f3f6;font-family:Arial,sans-serif;color:#13223a"><table role="presentation" style="width:100%;border-collapse:collapse"><tr><td style="padding:28px 12px"><table role="presentation" style="width:100%;max-width:640px;margin:0 auto;border-collapse:collapse;background:#fff;border-top:5px solid #f2b631"><tr><td style="padding:28px 30px;background:#04172f"><div style="color:#f2b631;font-size:12px;font-weight:700;letter-spacing:.18em;text-transform:uppercase">Excell Solutions, LLC</div><h1 style="margin:10px 0 0;color:#fff;font-size:24px;line-height:1.25">New Free Estimate Request</h1></td></tr><tr><td style="padding:28px 30px"><h2 style="margin:0 0 10px;color:#04172f;font-size:15px;text-transform:uppercase;letter-spacing:.1em">Customer Information</h2><table role="presentation" style="width:100%;border-collapse:collapse;border:1px solid #e8ebef">${row('Name',values.name)}${row('Phone',values.phone,true)}${row('Email',values.email)}${row('ZIP Code',values.zip)}${row('Cleaning Service',values.service)}</table>${homeSection}<h2 style="margin:30px 0 10px;color:#04172f;font-size:15px;text-transform:uppercase;letter-spacing:.1em">Additional Details</h2><div style="padding:16px;background:#f7f8fa;border-left:3px solid #f2b631;color:#34445a;font-size:14px;line-height:1.65">${safeMessage}</div></td></tr><tr><td style="padding:18px 30px;background:#f7f8fa;color:#788599;font-size:11px;line-height:1.5">Submitted through the Excell Solutions website estimate form.</td></tr></table></td></tr></table></body></html>`;
  const textLines = ['NEW FREE ESTIMATE REQUEST','','CUSTOMER INFORMATION',`Name: ${values.name}`,`Phone: ${values.phone}`,`Email: ${values.email||'Not provided'}`,`ZIP Code: ${values.zip||'Not provided'}`,`Cleaning Service: ${values.service}`];
  if (optionalHomeRows.length) { textLines.push('','HOME INFORMATION'); optionalHomeRows.forEach(([label,value]) => textLines.push(`${label}: ${value}`)); }
  textLines.push('','ADDITIONAL DETAILS',values.message||'Not provided');
  return {html,text:textLines.join('\n')};
}

function isAllowedOrigin(req,allowedOrigins) {
  const origin = req.get('origin');
  if (!origin) return true;
  const protocol = req.get('x-forwarded-proto')?.split(',')[0].trim() || req.protocol;
  return origin === `${protocol}://${req.get('host')}` || allowedOrigins.has(origin);
}

export function createApp({resend,config={}}={}) {
  const app = express();
  const allowedOrigins = new Set(String(config.allowedOrigins||'').split(',').map((origin) => origin.trim()).filter(Boolean));
  app.disable('x-powered-by');
  app.set('trust proxy',Number(config.trustProxy??1));
  app.use(express.json({limit:'20kb',type:'application/json'}));
  const estimateLimiter = rateLimit({windowMs:15*60*1000,limit:Number(config.rateLimitMax??5),standardHeaders:'draft-8',legacyHeaders:false,handler:(_req,res) => res.status(429).json({ok:false,message:"We couldn't send your request. Please try again later or call us at 832-582-9387."})});

  app.post('/api/send-estimate',estimateLimiter,async (req,res) => {
    if (!isAllowedOrigin(req,allowedOrigins)) return res.status(403).json({ok:false,message:'Request not allowed.'});
    const {values,errors,isSpam} = validateSubmission(req.body);
    if (isSpam) return res.status(200).json({ok:true});
    if (Object.keys(errors).length) return res.status(400).json({ok:false,errors,message:'Please review the highlighted fields.'});
    if (!resend || !config.contactEmail || !config.fromEmail) {
      console.error('Estimate email configuration is incomplete.');
      return res.status(503).json({ok:false,message:"We couldn't send your request. Please try again or call us at 832-582-9387."});
    }
    const email = buildEmail(values);
    try {
      const payload = {from:config.fromEmail,to:[config.contactEmail],subject:'New Free Estimate Request — Excell Solutions',html:email.html,text:email.text};
      if (values.email) payload.replyTo = values.email;
      const {data,error} = await resend.emails.send(payload);
      if (error) throw new Error(error.message||'Resend rejected the email.');
      return res.status(200).json({ok:true,id:data?.id});
    } catch (error) {
      console.error('Failed to send estimate email:',error instanceof Error?error.message:'Unknown error');
      return res.status(502).json({ok:false,message:"We couldn't send your request. Please try again or call us at 832-582-9387."});
    }
  });

  app.get('/',(_req,res) => res.sendFile(path.join(projectRoot,'index.html')));
  app.get('/styles.css',(_req,res) => res.sendFile(path.join(projectRoot,'styles.css')));
  app.get('/script.js',(_req,res) => res.sendFile(path.join(projectRoot,'script.js')));
  app.use('/img',express.static(path.join(projectRoot,'img'),{dotfiles:'deny'}));
  app.use((error,_req,res,next) => error instanceof SyntaxError && 'body' in error ? res.status(400).json({ok:false,message:'Invalid request.'}) : next(error));
  return app;
}
