import { contourPath } from './geometry.js';
import { accentPaths, exteriorPosition } from './accents.js';
const svgNS='http://www.w3.org/2000/svg';
const rootStyle=()=>getComputedStyle(document.documentElement);
const token=(name,el=document.documentElement)=>parseFloat(getComputedStyle(el).getPropertyValue(name))*parseFloat(rootStyle().fontSize);
// Static, non-interactive accents redraw only when their own box changes size.
function drawAccent(svg){
 const {width,height}=svg.getBoundingClientRect();if(!width||!height)return;
 svg.setAttribute('viewBox',`0 0 ${width} ${height}`);
 const paths=accentPaths(svg.dataset.accent,width,height,token('--space-8'));
 svg.replaceChildren(...paths.map(({d,emphasis})=>{const path=document.createElementNS(svgNS,'path');path.setAttribute('d',d);if(emphasis)path.classList.add('accent-emphasis');return path;}));
}
const accentObserver=new ResizeObserver(entries=>entries.forEach(({target})=>drawAccent(target)));
document.querySelectorAll('[data-accent]').forEach(svg=>{accentObserver.observe(svg);drawAccent(svg);});
function placeOrnaments(){
 const main=document.getElementById('main'),base=main.getBoundingClientRect();
 document.querySelectorAll('.ornament').forEach(svg=>{
  const target=document.getElementById(svg.dataset.anchor),next=document.getElementById(svg.dataset.next);
  if(!target)return;
  const {width,height}=svg.getBoundingClientRect();
  const point=exteriorPosition({side:svg.dataset.side,level:svg.dataset.level,width,height,base,anchor:target.getBoundingClientRect(),next:next?.getBoundingClientRect(),clear:token('--space-16'),inset:token('--space-16')});
  svg.style.visibility=point?'visible':'hidden';
  if(point){svg.style.left=`${point.left}px`;svg.style.top=`${point.top}px`;}
 });
}
const ornamentObserver=new ResizeObserver(placeOrnaments);
document.querySelectorAll('#main,.machine,.routed').forEach(el=>ornamentObserver.observe(el));
document.fonts.ready.then(placeOrnaments);
placeOrnaments();
// Token declarations are rem-based. Geometry is regenerated in actual CSS pixels.
function drawFrame(el){
  const bounds=el.getBoundingClientRect(),{width:w,height:h}=bounds;if(!w||!h)return;
  let svg=el.querySelector(':scope > .contour');
  if(!svg){svg=document.createElementNS(svgNS,'svg');svg.classList.add('contour');svg.setAttribute('aria-hidden','true');svg.append(document.createElementNS(svgNS,'path'));el.prepend(svg);}
  svg.setAttribute('viewBox',`0 0 ${w} ${h}`);
  const cut=token(el.dataset.frame==='control'?'--cut-small':'--cut');
  const label=el.dataset.frame==='capability'?el.querySelector('.panel-label h2'):null;
  const labelEnd=label?label.getBoundingClientRect().right-bounds.left+token('--clear'):undefined;
  const path=contourPath(w,h,cut,token('--stroke'),el.dataset.frame,labelEnd);
  svg.firstChild.setAttribute('d',path);
  const media=el.querySelector(':scope > img');
  if(media&&el.dataset.frame==='media')media.style.clipPath=`path('${path}')`;
}
const frameObserver=new ResizeObserver(entries=>entries.forEach(e=>drawFrame(e.target)));
function connectFrames(){document.querySelectorAll('[data-frame]').forEach(el=>{frameObserver.observe(el);drawFrame(el);});}
connectFrames();document.fonts.ready.then(()=>document.querySelectorAll('[data-frame]').forEach(drawFrame));
const toggle=document.querySelector('.menu-toggle'),nav=document.querySelector('#navigation');
toggle.addEventListener('click',()=>{const open=toggle.getAttribute('aria-expanded')!=='true';toggle.setAttribute('aria-expanded',String(open));nav.classList.toggle('is-open',open);toggle.querySelector('.menu-label').textContent=open?'Close':'Menu';});
nav.addEventListener('click',e=>{if(e.target.closest('a')){nav.classList.remove('is-open');toggle.setAttribute('aria-expanded','false');toggle.querySelector('.menu-label').textContent='Menu';}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&nav.classList.contains('is-open')){nav.classList.remove('is-open');toggle.setAttribute('aria-expanded','false');toggle.querySelector('.menu-label').textContent='Menu';toggle.focus();}});

// Peer-view controls preserve canonical Tabs keyboard behavior.
for(const group of document.querySelectorAll('[role="tablist"]')){
 const tabs=[...group.querySelectorAll('[role="tab"]')];
 const select=(tab,focus=false)=>{for(const item of tabs){const active=item===tab;item.setAttribute('aria-selected',String(active));item.tabIndex=active?0:-1;document.getElementById(item.getAttribute('aria-controls')).hidden=!active;}if(focus)tab.focus();document.querySelectorAll('[data-frame]').forEach(drawFrame);};
 tabs.forEach((tab,i)=>{tab.addEventListener('click',()=>select(tab));tab.addEventListener('keydown',e=>{let next;if(e.key==='ArrowLeft')next=(i-1+tabs.length)%tabs.length;else if(e.key==='ArrowRight')next=(i+1)%tabs.length;else if(e.key==='Home')next=0;else if(e.key==='End')next=tabs.length-1;if(next!==undefined){e.preventDefault();select(tabs[next],true);}});});
}

function svgPath(svg,d){svg.setAttribute('viewBox',`0 0 ${svg.clientWidth} ${svg.clientHeight}`);svg.replaceChildren();const p=document.createElementNS(svgNS,'path');p.setAttribute('d',d);svg.append(p);}
function drawRoutes(){
 const machine=document.querySelector('.machine'),master=document.getElementById('master-route');
 if(!machine||!master)return;
 const r=machine.getBoundingClientRect(),parts=[...machine.querySelectorAll(':scope > .routed')],cut=token('--cut'),stroke=token('--stroke');
 const boxes=parts.map(el=>el.getBoundingClientRect());let d='';
 for(let i=0;i<boxes.length-1;i++){const a=boxes[i],b=boxes[i+1];const x=a.left-r.left+cut*2,y=a.bottom-r.top-stroke/2,nx=b.left-r.left+cut*2,ny=b.top-r.top+stroke/2;const middle=(y+ny)/2;d+=`M ${x} ${y} V ${middle-cut/2} L ${x+cut} ${middle} H ${nx+cut} L ${nx} ${middle+cut/2} V ${ny} `;}
 svgPath(master,d);
 document.querySelectorAll('.bracketed').forEach(box=>{let svg=box.querySelector(':scope > .brackets');if(!svg){svg=document.createElementNS(svgNS,'svg');svg.classList.add('brackets');svg.setAttribute('aria-hidden','true');box.append(svg);}const w=svg.clientWidth,h=svg.clientHeight,s=token('--bracket-stroke',box)/2,arm=token('--bracket-arm',box);svgPath(svg,`M ${s+arm} ${s} H ${s} V ${s+arm} M ${w-s-arm} ${s} H ${w-s} V ${s+arm} M ${s} ${h-s-arm} V ${h-s} H ${s+arm} M ${w-s} ${h-s-arm} V ${h-s} H ${w-s-arm}`);});
 const stage=document.getElementById('hero-stage'),svg=document.querySelector('.hero-guides');if(stage&&svg){const w=stage.clientWidth,h=stage.clientHeight,s=token('--space-16'),c=token('--space-32');svgPath(svg,`M ${s+c} ${h*.43} H ${s} V ${h*.6} M ${w-s-c} ${h*.34} H ${w-s} V ${h*.5}`);}
 const energy=document.querySelector('.energy-route');if(energy){let svg=energy.querySelector('svg');if(!svg){svg=document.createElementNS(svgNS,'svg');svg.setAttribute('aria-hidden','true');energy.append(svg);}const base=energy.getBoundingClientRect(),items=[...energy.querySelectorAll('span')],origin=items[0].getBoundingClientRect(),clear=token('--space-8');let routes='';for(const item of items.slice(1)){const b=item.getBoundingClientRect(),x=origin.left-base.left+origin.width/2,y=origin.bottom-base.top+clear,nx=b.left-base.left+b.width/2,ny=b.top-base.top-clear;if(ny>y){const mid=(ny+y)/2;routes+=`M ${x} ${y} V ${mid} H ${nx} V ${ny} `;}}svgPath(svg,routes);}
}
const routesObserver=new ResizeObserver(drawRoutes);
for(const el of document.querySelectorAll('.machine,.routed,.bracketed,.hero-stage,.energy-route'))routesObserver.observe(el);
document.fonts.ready.then(drawRoutes);
drawRoutes();
