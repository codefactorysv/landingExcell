const header=document.querySelector('.site-header');
const menuButton=document.querySelector('.menu-toggle');
const mobileNav=document.querySelector('.mobile-nav');
const setHeader=()=>header.classList.toggle('scrolled',scrollY>28);
setHeader();addEventListener('scroll',setHeader,{passive:true});
menuButton.addEventListener('click',()=>{const open=menuButton.getAttribute('aria-expanded')==='true';menuButton.setAttribute('aria-expanded',String(!open));menuButton.setAttribute('aria-label',open?'Open menu':'Close menu');mobileNav.classList.toggle('open',!open);document.body.classList.toggle('menu-open',!open)});
mobileNav.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>{menuButton.setAttribute('aria-expanded','false');menuButton.setAttribute('aria-label','Open menu');mobileNav.classList.remove('open');document.body.classList.remove('menu-open')}));
const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');observer.unobserve(entry.target)}}),{threshold:.14});
document.querySelectorAll('.reveal,.stagger').forEach(el=>observer.observe(el));
const count=document.querySelector('.count');
const countObserver=new IntersectionObserver(([entry])=>{if(!entry.isIntersecting)return;if(matchMedia('(prefers-reduced-motion: reduce)').matches){count.textContent=count.dataset.count;return}const target=Number(count.dataset.count);let start;const tick=t=>{start??=t;const value=Math.min(target,Math.floor((t-start)/55));count.textContent=value;if(value<target)requestAnimationFrame(tick)};requestAnimationFrame(tick);countObserver.disconnect()},{threshold:.7});countObserver.observe(count);
const form=document.querySelector('.estimate-form');
form.addEventListener('submit',event=>{event.preventDefault();let valid=true;form.querySelectorAll('[required],input[type=email]').forEach(field=>{const isEmail=field.type==='email'&&field.value;const invalid=(field.required&&!field.value.trim())||(isEmail&&!field.validity.valid);field.closest('label').classList.toggle('invalid',invalid);if(invalid)valid=false});const status=form.querySelector('.form-status');if(valid){status.textContent='Thank you. Your form is ready to be connected to your preferred email or backend service.';form.reset()}else{status.textContent='Please review the highlighted fields.'}});
form.querySelectorAll('input,select').forEach(field=>field.addEventListener('input',()=>field.closest('label').classList.remove('invalid')));
document.getElementById('year').textContent=new Date().getFullYear();
document.querySelector('.back-to-top').addEventListener('click',()=>window.scrollTo({top:0,behavior:'smooth'}));

const serviceMapElement=document.getElementById('service-map');
if(serviceMapElement&&window.L){
  const houston=[29.7604,-95.3698];
  const serviceMap=L.map(serviceMapElement,{center:houston,zoom:9.5,zoomSnap:.5,minZoom:8,maxZoom:16,scrollWheelZoom:true});
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{
    maxZoom:19,
    attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(serviceMap);
  L.circle(houston,{
    radius:40000,
    color:'#f2b631',
    weight:2,
    opacity:.88,
    fillColor:'#1e5aa8',
    fillOpacity:.2,
    interactive:false
  }).addTo(serviceMap);
  const serviceMarker=L.divIcon({
    className:'excell-map-marker',
    html:'<span aria-hidden="true"></span>',
    iconSize:[30,30],
    iconAnchor:[15,15]
  });
  L.marker(houston,{icon:serviceMarker,title:'Excell Solutions — Houston, Texas',alt:'Excell Solutions service location in Houston, Texas'})
    .addTo(serviceMap)
    .bindPopup('<strong>Excell Solutions</strong><br>Houston, Texas &amp; Surrounding Areas');
}
