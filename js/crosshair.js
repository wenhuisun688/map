import {node} from './map.js';
let people=[],loaded=false;
const reduced=matchMedia('(prefers-reduced-motion: reduce)'),pointer=matchMedia('(hover: hover) and (pointer: fine)');
async function showCrosshairPage(){
 const grid=document.getElementById('crosshair-grid');
 if(loaded)return;
 grid.replaceChildren(node('p',{text:'正在加载人物…',role:'status'}));
 try{const r=await fetch('data/crosshairs.json');if(!r.ok)throw Error();people=await r.json();
  let status=document.getElementById('crosshair-status');if(!status){status=node('p',{id:'crosshair-status',class:'crosshair-status',role:'status'});grid.after(status);}
  const pros=people.filter(c=>c.kind==='pro'),streamers=people.filter(c=>c.kind==='streamer');
  const groups=[];
  if(pros.length) groups.push(section('职业选手',pros,status));
  if(streamers.length) groups.push(section('常用准星',streamers,status));
  grid.replaceChildren(...groups);
  if(!groups.length) grid.append(node('p',{text:'暂无人物'}));
  status.textContent='';loaded=true;
 }catch{grid.replaceChildren(node('button',{text:'加载失败，点击重试',onclick:showCrosshairPage}));}
}
function section(title,items,status){
 const sec=node('section',{class:'ch-section'}),h=node('h2',{class:'ch-section-title',text:title});
 const g=node('div',{class:items[0]&&items[0].kind==='streamer'?'crosshair-mini-grid':'crosshair-grid'});
 g.append(...items.map(c=>card(c,status)));sec.append(h,g);return sec;
}
function showToast(msg){
  let toast=document.getElementById('ch-toast');
  if(!toast){toast=node('div',{id:'ch-toast',class:'ch-toast','aria-live':'polite'});document.body.append(toast);toast.offsetHeight}
  toast.textContent=msg;toast.classList.add('ch-toast-visible');
  setTimeout(()=>toast.classList.remove('ch-toast-visible'),2300);
}
function card(ch,status){
 const ready=!!(ch.code&&ch.preview);
 const mini=ch.kind==='streamer';
 const el=node('button',{type:'button',class:'agent-card crosshair-card '+(mini?'is-streamer crosshair-mini ':'is-pro ')+(ready?'is-ready':''),'data-crosshair':ch.id,'aria-label':ready?'复制 '+ch.name+' 的准星代码':ch.name+'，准星待添加',title:ch.events||ch.name});
 if(mini){
   const preview=node('span',{class:'mini-preview'});
   if(ch.preview)preview.append(node('img',{src:ch.preview,alt:ch.name+' 准星预览',loading:'lazy',decoding:'async',draggable:'false'}));else preview.append(node('span',{class:'crosshair-unverified',text:'待添加'}));
   el.append(preview);
   el.append(node('strong',{class:'mini-name',text:ch.name}));
 }else{
   el.append(node('strong',{class:'crosshair-name',text:(ch.team?ch.team+' · ':'')+ch.name}));
   if(ch.photo){const img=node('img',{class:'player-portrait',src:ch.photo,alt:'',draggable:'false',loading:'lazy',decoding:'async'});img.onerror=()=>{img.remove();el.append(node('span',{class:'player-monogram','aria-hidden':'true',text:ch.name.slice(0,2)}));};el.append(img);}
   else el.append(node('span',{class:'player-monogram','aria-hidden':'true',text:ch.name.slice(0,2)}));
   const preview=node('span',{class:'crosshair-preview-wrap'});
   if(ch.preview)preview.append(node('img',{src:ch.preview,alt:ch.name+' 准星预览',loading:'lazy',decoding:'async',draggable:'false'}));else preview.append(node('span',{class:'crosshair-unverified',text:'待添加'}));
   el.append(preview);
 }
 let frame;
 el.onpointermove=e=>{if(reduced.matches||!pointer.matches)return;cancelAnimationFrame(frame);const x=e.clientX,y=e.clientY;frame=requestAnimationFrame(()=>{const r=el.getBoundingClientRect(),u=(x-r.left)/r.width,v=(y-r.top)/r.height;el.style.setProperty('--light-x',u*100+'%');el.style.setProperty('--light-y',v*100+'%');el.style.setProperty('--tilt-x',(0.5-v)*5+'deg');el.style.setProperty('--tilt-y',(u-0.5)*5+'deg');});};
 el.onpointerleave=()=>{cancelAnimationFrame(frame);el.style.removeProperty('--tilt-x');el.style.removeProperty('--tilt-y');el.style.removeProperty('--light-x');el.style.removeProperty('--light-y');};
 el.onclick=async()=>{if(!ready){status.textContent=ch.name+' 的准星还在整理中';return;}try{await navigator.clipboard.writeText(ch.code);showToast('复制成功！');}catch{status.textContent='复制失败，请手动复制：';const input=node('input',{class:'crosshair-code',readonly:'','aria-label':'准星代码',value:ch.code});status.append(input);input.focus();input.select();}};
 return el;
}
export {showCrosshairPage};
