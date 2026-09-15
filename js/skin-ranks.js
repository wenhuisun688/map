import {node} from './map.js';
import {ownersByGamerskyId} from './skin-metrics.js';
export const weaponLabels={vandal:'狂徒',phantom:'幻影',melee:'近战',sheriff:'正义',classic:'标配',operator:'冥驹',odin:'奥丁',judge:'判官',bucky:'雄鹿',spectre:'骇灵'};
let request=0;
const metricColumns=[['综合评分','heat'],['Elo 评分','elo'],['游民星空评分','gamersky'],['持有数量（人）','owners']];
const present=(value,options={})=>Number.isFinite(value)?value.toLocaleString('zh-CN',options):'—';
function metrics(s,ownerCounts){
 const gamersky=s.sources?.gamersky,skinranks=s.sources?.skinranks;
 return [
  {label:'综合评分',value:present(s.heat,{maximumFractionDigits:1}),className:'metric-primary'},
  {label:'Elo 评分',value:present(skinranks?.elo,{maximumFractionDigits:1})},
  {label:'游民星空评分',value:present(gamersky?.score,{minimumFractionDigits:1,maximumFractionDigits:2})},
  {label:'持有数量（人）',value:present(gamersky?.ownersCount??ownerCounts[String(gamersky?.id)])}
 ];
}
export async function showSkinRanks(weapon){
 const serial=++request,list=document.getElementById('skin-ranks-list');document.getElementById('skin-ranks-title').textContent=weaponLabels[weapon];list.replaceChildren(node('p',{class:'empty',text:'正在加载…'}));
 try{const r=await fetch('data/skins.json',{cache:'no-cache'});if(!r.ok)throw Error();const data=await r.json(),ownerCounts=ownersByGamerskyId;if(!Array.isArray(data))throw Error();if(serial!==request)return;
 const rows=data.filter(s=>s.weapon===weapon).sort((a,b)=>b.heat-a.heat||a.id.localeCompare(b.id));
 if(!rows.length){list.replaceChildren(node('p',{class:'empty',text:'这个武器的皮肤排行还没有录入。'}));return;}
 const captured=rows.map(s=>s.sources?.capturedAt).filter(Boolean).sort().at(-1),capturedLabel=document.getElementById('ranking-captured-at');
 if(capturedLabel)capturedLabel.textContent=captured?'数据快照：'+new Intl.DateTimeFormat('zh-CN',{year:'numeric',month:'long',day:'numeric',timeZone:'Asia/Shanghai'}).format(new Date(captured)):'';
 const max=(Math.max(...rows.map(s=>s.heat))||1),ol=node('ol',{class:'heat-chart','aria-label':weaponLabels[weapon]+'皮肤手感排行'});
 const head=node('div',{class:'heat-chart-head','aria-hidden':'true'},[
  node('span',{text:'皮肤'}),node('span',{text:'排名表现'}),
  ...metricColumns.map(([label,key])=>node('span',{class:'metric-'+key,text:label}))
 ]);
 rows.forEach((s,i)=>{
  const ratio=s.heat/max,values=metrics(s,ownerCounts),bar=node('div',{class:'heat-bar'});bar.style.width=(ratio*100)+'%';
  const img=node('img',{src:s.image,alt:s.name,loading:i<4?'eager':'lazy',draggable:'false'});img.onerror=()=>{img.hidden=true;};
  const tip=node('span',{class:'heat-tip'},[img]);tip.style.left=(ratio*100)+'%';
  const metricGroup=node('div',{class:'heat-metrics'},values.map(metric=>node('span',{class:'heat-value '+(metric.className||''),'data-label':metric.label,text:metric.value})));
  const spoken=values.map(metric=>metric.label+' '+metric.value).join('，');
  const row=node('li',{class:'heat-row',tabindex:'0','aria-label':(i+1)+'，'+s.name+'，'+spoken},[
   node('div',{class:'heat-label'},[node('strong',{text:s.name})]),node('div',{class:'heat-track'},[bar,tip]),metricGroup
  ]);
  let frame;row.onpointermove=e=>{if(!matchMedia('(hover:hover) and (prefers-reduced-motion:no-preference)').matches)return;cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{const b=row.querySelector('.heat-track').getBoundingClientRect();row.style.setProperty('--light-x',e.clientX-b.left+'px');row.style.setProperty('--light-y',e.clientY-b.top+'px');});};row.onpointerleave=()=>cancelAnimationFrame(frame);ol.append(row);
 });list.replaceChildren(head,ol);attachHeatWave(ol);
 }catch{if(serial===request)list.replaceChildren(node('p',{class:'empty',text:'排行暂时无法加载。'}),node('button',{text:'重试',onclick:()=>showSkinRanks(weapon)}));}
}

// A moving crest shared by neighbouring rows; motion settles instead of restarting on hover.
function attachHeatWave(chart){
 const enabled=matchMedia('(hover:hover) and (pointer:fine) and (prefers-reduced-motion:no-preference)');
 const items=[...chart.children].map(row=>({row,value:0,speed:0,target:0}));
 let frame=0,last=0,pointer=null,changed=false;
 function start(){if(!frame){last=performance.now();frame=requestAnimationFrame(tick);}}
 function tick(now){
  frame=0;const dt=Math.min((now-last)/1000,.025);last=now;
  if(!chart.isConnected||chart.closest('main').hidden||!enabled.matches){reset();return;}
  if(changed){for(const item of items){const r=item.row.getBoundingClientRect();const d=pointer?(pointer.y-r.top-r.height/2)/r.height:Infinity;item.target=Math.exp(-d*d*1.6);}changed=false;}
  let moving=false;
  for(const item of items){item.speed+=(210*(item.target-item.value)-29*item.speed)*dt;item.value+=item.speed*dt;
   if(Math.abs(item.target-item.value)<.0005&&Math.abs(item.speed)<.002){item.value=item.target;item.speed=0;}else moving=true;
   item.row.style.setProperty('--wave',item.value.toFixed(4));item.row.style.zIndex=String(Math.round(item.value*100));
  }
  if(moving)frame=requestAnimationFrame(tick);
 }
 function reset(){cancelAnimationFrame(frame);frame=0;pointer=null;for(const item of items){item.value=item.speed=item.target=0;item.row.style.removeProperty('--wave');item.row.style.removeProperty('z-index');}chart.classList.remove('wave-active');}
 chart.addEventListener('pointermove',e=>{if(!enabled.matches)return;chart.classList.add('wave-active');pointer={y:e.clientY};changed=true;start();});
 chart.addEventListener('pointerleave',()=>{pointer=null;changed=true;start();});
}
