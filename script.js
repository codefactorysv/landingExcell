const header=document.querySelector('.site-header');
const menuButton=document.querySelector('.menu-toggle');
const mobileNav=document.querySelector('.mobile-nav');
const setHeader=()=>header.classList.toggle('scrolled',scrollY>28);
setHeader();addEventListener('scroll',setHeader,{passive:true});
menuButton.addEventListener('click',()=>{const open=menuButton.getAttribute('aria-expanded')==='true';menuButton.setAttribute('aria-expanded',String(!open));menuButton.setAttribute('aria-label',open?'Open menu':'Close menu');mobileNav.classList.toggle('open',!open);document.body.classList.toggle('menu-open',!open);});
mobileNav.querySelectorAll('a').forEach((link)=>link.addEventListener('click',()=>{menuButton.setAttribute('aria-expanded','false');menuButton.setAttribute('aria-label','Open menu');mobileNav.classList.remove('open');document.body.classList.remove('menu-open');}));
const observer=new IntersectionObserver((entries)=>entries.forEach((entry)=>{if(entry.isIntersecting){entry.target.classList.add('visible');observer.unobserve(entry.target);}}),{threshold:.14});
document.querySelectorAll('.reveal,.stagger').forEach((element)=>observer.observe(element));
const count=document.querySelector('.count');
const countObserver=new IntersectionObserver(([entry])=>{if(!entry.isIntersecting)return;if(matchMedia('(prefers-reduced-motion: reduce)').matches){count.textContent=count.dataset.count;return;}const target=Number(count.dataset.count);let start;const tick=(time)=>{start??=time;const value=Math.min(target,Math.floor((time-start)/55));count.textContent=value;if(value<target)requestAnimationFrame(tick);};requestAnimationFrame(tick);countObserver.disconnect();},{threshold:.7});
countObserver.observe(count);

const form=document.querySelector('#estimate-form');
const submitButton=form.querySelector('button[type="submit"]');
const submitButtonMarkup=submitButton.innerHTML;
const status=form.querySelector('.form-status');
const validators={
  name:(value)=>value.trim().length>=2?'':'Please enter your name.',
  phone:(value)=>{const digits=value.replace(/\D/g,'');return digits.length>=10&&digits.length<=15?'':'Please enter a valid phone number.';},
  email:(value)=>!value||/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)?'':'Please enter a valid email address.',
  zip:(value)=>/^\d{5}(?:-\d{4})?$/.test(value.trim())?'':'Please enter a valid ZIP code.',
  service:(value)=>value?'':'Please select a cleaning service.',
};
function setFieldError(field,message=''){const label=field?.closest('label');if(!label)return;const error=label.querySelector('small');label.classList.toggle('invalid',Boolean(message));if(error&&message)error.textContent=message;}
function validateField(field){const validator=validators[field.name];if(!validator)return true;const message=validator(field.value);setFieldError(field,message);return !message;}
form.querySelectorAll('input:not([name="company"]),select,textarea').forEach((field)=>{const eventName=field.tagName==='SELECT'?'change':'input';field.addEventListener(eventName,()=>validators[field.name]?validateField(field):setFieldError(field));});
form.addEventListener('submit',async(event)=>{
  event.preventDefault();if(submitButton.disabled)return;
  const fieldsToValidate=Object.keys(validators).map((name)=>form.elements.namedItem(name));
  const valid=fieldsToValidate.map(validateField).every(Boolean);status.className='form-status';
  if(!valid){status.textContent='Please correct the highlighted fields.';status.classList.add('is-error');form.querySelector('label.invalid input,label.invalid select')?.focus();return;}
  const payload=Object.fromEntries(new FormData(form).entries());submitButton.disabled=true;submitButton.textContent='Sending...';status.textContent='Sending your estimate request...';
  try{
    const response=await fetch('/api/send-estimate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
    const result=await response.json().catch(()=>({}));
    if(!response.ok){
      if(result.errors){Object.entries(result.errors).forEach(([name,message])=>setFieldError(form.elements.namedItem(name),message));status.textContent='Please correct the highlighted fields.';status.classList.add('is-error');return;}
      throw new Error(result.message||'Request failed');
    }
    form.reset();form.querySelectorAll('label.invalid').forEach((label)=>label.classList.remove('invalid'));status.textContent='Thank you! Your estimate request has been sent. Reina will contact you shortly.';status.classList.add('is-success');
  }catch(_error){status.textContent="We couldn't send your request. Please try again or call us at 832-582-9387.";status.classList.add('is-error');}
  finally{submitButton.disabled=false;submitButton.innerHTML=submitButtonMarkup;}
});

document.getElementById('year').textContent=new Date().getFullYear();
document.querySelector('.back-to-top').addEventListener('click',()=>window.scrollTo({top:0,behavior:'smooth'}));
const serviceMapElement=document.getElementById('service-map');
if(serviceMapElement&&window.L){
  const houston=[29.7604,-95.3698];
  const serviceMap=L.map(serviceMapElement,{center:houston,zoom:9.5,zoomSnap:.5,minZoom:8,maxZoom:16,scrollWheelZoom:true});
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'}).addTo(serviceMap);
  L.circle(houston,{radius:40000,color:'#f2b631',weight:2,opacity:.88,fillColor:'#1e5aa8',fillOpacity:.2,interactive:false}).addTo(serviceMap);
  const serviceMarker=L.divIcon({className:'excell-map-marker',html:'<span aria-hidden="true"></span>',iconSize:[30,30],iconAnchor:[15,15]});
  L.marker(houston,{icon:serviceMarker,title:'Excell Solutions — Houston, Texas',alt:'Excell Solutions service location in Houston, Texas'}).addTo(serviceMap).bindPopup('<strong>Excell Solutions</strong><br>Houston, Texas &amp; Surrounding Areas');
}
