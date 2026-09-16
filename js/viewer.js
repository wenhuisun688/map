import {showNightWeapons} from './night-weapons.js';
import {showNight} from './night.js';
import {showUpdates} from './updates.js';
import {MapSurface,node} from './map.js';
import {showSkinRanks,weaponLabels} from './skin-ranks.js';
import {showCrosshairPage} from './crosshair.js';

const $=id=>document.getElementById(id);
const reduced=matchMedia('(prefers-reduced-motion: reduce)'),mobile=matchMedia('(max-width: 640px)');
const ease='cubic-bezier(.22,1,.36,1)';
let data,currentMap=null,detailId=null,currentPage='home',routing=false,renderedHash=null,lastFocus;
let currentAgent=null,currentSide='attack';
const navStateKey='valorantHierarchyIndex';
let navIndex=Number(history.state?.[navStateKey])||0,activeHistoryHash=location.hash||'#',handlingHistoryPop=false;
function navigate(hash){
 const target=hash.startsWith('#')?hash:'#'+hash;
 if((location.hash||'#')===target)return;
 if(!mobile.matches){location.hash=target;return;}
 const chain=hierarchyTo(target),current=location.hash||'#',common=chain.lastIndexOf(current);
 for(const step of chain.slice(common+1)){
  navIndex++;
  history.pushState({...history.state,[navStateKey]:navIndex},'',step);
 }
 activeHistoryHash=target;
 route();
}
const hashPath=hash=>(hash||'#').replace(/^#/,'').split('?')[0].replace(/\/+$/,'');
function parentHash(hash){
 const path=hashPath(hash),parts=path.split('/').filter(Boolean),query=(hash||'').includes('?')?'?'+(hash||'').split('?').slice(1).join('?'):'';
 if(!parts.length)return null;
 if(parts[0]==='map')return parts.length>=3?'#map/'+parts[1]+query:'#';
 if(parts[0]==='utility')return parts.length>=4?'#utility/'+parts[1]+'/'+parts[2]+query:parts.length>=3?'#utility':'#';
 if(parts[0]==='skins'){
  if(parts[1]==='ranking'&&parts.length>=3)return '#skins/ranking';
  if(parts[1]==='ranking')return '#skins';
  if(parts[1]==='night'&&parts[2]==='weapons')return parts.length>=4?'#skins/night/weapons':'#skins/night';
  if(parts[1]==='night')return '#skins';
  return '#';
 }
 return '#';
}
function hierarchyTo(hash){const chain=[];for(let cursor=hash;cursor;cursor=parentHash(cursor))chain.unshift(cursor);return chain;}
if(mobile.matches){
 const initial=location.hash||'#',chain=hierarchyTo(initial);
 history.replaceState({...history.state,[navStateKey]:navIndex},'',chain[0]);
 for(const step of chain.slice(1)){navIndex++;history.pushState({...history.state,[navStateKey]:navIndex},'',step);}
 activeHistoryHash=initial;
}
window.addEventListener('popstate',event=>{
 if(!mobile.matches)return;
 handlingHistoryPop=true;
 const next=Number(event.state?.[navStateKey]),backward=!Number.isFinite(next)||next<navIndex,expected=backward?parentHash(activeHistoryHash):null;
 if(expected&&hashPath(location.hash)!==hashPath(expected))history.replaceState({...history.state,[navStateKey]:Number.isFinite(next)?next:navIndex-1},'',expected);
 navIndex=Number.isFinite(next)?next:navIndex-1;activeHistoryHash=location.hash||'#';
 setTimeout(()=>{handlingHistoryPop=false;},0);
});
window.addEventListener('hashchange',()=>{
 if(!mobile.matches){activeHistoryHash=location.hash||'#';return;}
 if(!handlingHistoryPop){navIndex++;history.replaceState({...history.state,[navStateKey]:navIndex},'');}
 activeHistoryHash=location.hash||'#';
});
document.addEventListener('click',event=>{
 if(!mobile.matches||event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
 const link=event.target.closest?.('a[href^="#"]');
 if(!link)return;
 event.preventDefault();
 navigate(link.getAttribute('href')||'#');
},true);
const agentNames={sova:'猎枭',fade:'黑梦'},abilityNames={recon:'探测箭',shock:'震击箭',haunt:'鬼眼'};
const categoryPoints=id=>(data.points[id]||[]).filter(p=>currentAgent?p.kind==='utility'&&p.agent===currentAgent:(p.kind||'wallbang')==='wallbang');
const pointsFor=id=>categoryPoints(id).filter(p=>p.side===currentSide);
const routeFor=(mapId,p)=>p.kind==='utility'?('utility/'+p.agent+'/'+mapId+'/'+encodeURIComponent(p.id)+'?side='+p.side):('map/'+mapId+'/'+encodeURIComponent(p.id)+'?side='+p.side);
const storageKey='valorant-guide-personal-v1';
const settingsKey='valorant-guide-settings-v1';
let settings={motion:true,anim:true};
try{const saved=JSON.parse(localStorage.getItem(settingsKey));if(saved&&typeof saved==='object'){settings.motion=saved.motion!==false;settings.anim=saved.anim!==false;}}catch{}
function applySettings(){
  document.documentElement.classList.toggle('no-card-motion',!settings.motion);
  document.documentElement.classList.toggle('no-page-anim',!settings.anim);
  localStorage.setItem(settingsKey,JSON.stringify(settings));
}
applySettings();
let personal={favorites:[],recent:[]},personalTab='recent';
try{const saved=JSON.parse(localStorage.getItem(storageKey));if(saved)for(const key of ['favorites','recent'])if(Array.isArray(saved[key]))personal[key]=saved[key].filter(v=>typeof v==='string').slice(0,200);}catch{}
const pointKey=(mapId,id)=>JSON.stringify([mapId,id]);
const allPoints=()=>data.maps.flatMap(m=>(data.points[m.id]||[]).map(p=>({map:m,point:p,key:pointKey(m.id,p.id)})));
function savePersonal(){try{localStorage.setItem(storageKey,JSON.stringify(personal));}catch{}renderPersonal();}
function pointLink(item){return node('button',{class:'saved-point',onclick:()=>navigate(routeFor(item.map.id,item.point))},[node('strong',{text:item.point.name}),node('span',{text:item.map.name+' · '+(item.point.side==='attack'?'进攻':'防守')})]);}
function renderPersonal(){
  if(!data)return;
  const items=allPoints().filter(item=>personal.favorites.includes(item.key));
  $('favorites-list').replaceChildren(...items.map(item=>{const button=pointLink(item);button.addEventListener('click',()=>closeDialog($('favorites-dialog')));return button;}));
  if(!items.length)$('favorites-list').append(node('p',{class:'empty',text:'在点位详情中点击收藏，就能在这里找到。'}));
  renderRecentNote();
}
// 浏览记录只存 key，渲染时再拿当前点位表对一次账：点位被删掉，旧 key 自然落空，不会留下点不开的死链
const pointsByKeys=keys=>{const byKey=new Map(allPoints().map(item=>[item.key,item]));return keys.map(key=>byKey.get(key)).filter(Boolean);};
function renderRecentNote(){
  const note=$('hub-history-note');if(!note)return;
  const count=pointsByKeys(personal.recent).length;
  note.textContent=count?'最近 '+count+' 个点位':'暂无记录';
}
function recordRecent(key){
  personal.recent=[key,...personal.recent.filter(v=>v!==key)].slice(0,60);
  savePersonal();
}
const map=new MapSurface($('viewer-map'),{onPoint:points=>points.length===1?openPoint(points[0]):pick(points)});
// 手机端详情弹层手势：下拉滑出关闭、上滑全屏；桌面端不受影响。
(function(){
  const panel=document.querySelector('.guide-panel');
  if(!panel)return;
  const backdrop=$('detail-backdrop');
  const isMobile=()=>matchMedia('(max-width: 640px)').matches;
  let startY=null,dragging=false,lastY=0,lastT=0,velocity=0,pendingY=null,raf=0;
  const bodyEl=()=>document.querySelector('.detail-body');
  const paint=y=>{raf=0;panel.style.transform=`translate3d(0,${y}px,0)`;
    if(backdrop&&!backdrop.hidden){const k=Math.min(1,Math.max(0,y)/Math.max(1,panel.offsetHeight));backdrop.style.opacity=String(1-k*.8);}};
  panel.addEventListener('touchstart',e=>{
    if(!isMobile()||!document.body.classList.contains('detail-open')||e.touches.length!==1)return;
    const t=e.touches[0],head=panel.querySelector('.detail-head'),b=bodyEl();
    const fromHead=!!(head&&head.contains(t.target));
    if(!fromHead&&b&&b.scrollTop>0)return;
    startY=lastY=t.clientY;lastT=performance.now();velocity=0;dragging=true;panel.classList.add('dragging');
  },{passive:true});
  panel.addEventListener('touchmove',e=>{
    if(!dragging)return;
    const y=e.touches[0].clientY,dy=y-startY;
    if(Math.abs(dy)>6)e.preventDefault();
    const now=performance.now(),dt=now-lastT;
    if(dt>0){velocity=velocity*.7+(y-lastY)/dt*.3;lastY=y;lastT=now;}
    let offset=dy;
    if(offset<0)offset*=panel.classList.contains('sheet-full')?.22:.6;
    pendingY=offset;
    if(!raf)raf=requestAnimationFrame(()=>paint(pendingY));
  },{passive:false});
  const endDrag=e=>{
    if(!dragging)return false;
    dragging=false;
    if(raf){cancelAnimationFrame(raf);raf=0;}
    if(pendingY!==null){paint(pendingY);pendingY=null;}
    const dy=e.changedTouches[0].clientY-startY;
    startY=null;
    return dy;
  };
  const clearStyles=()=>{panel.style.transition='';panel.style.transform='';if(backdrop){backdrop.style.transition='';backdrop.style.opacity='';}};
  panel.addEventListener('touchend',e=>{
    const dy=endDrag(e);
    if(dy===false)return;
    panel.classList.remove('dragging');
    const h=panel.offsetHeight||1;
    if(dy>Math.min(110,h*.26)||velocity>.5){
      const dur=Math.round(Math.max(180,Math.min(360,(h-Math.max(0,dy))/Math.max(Math.abs(velocity),.35))));
      const anim=panel.animate([{transform:getComputedStyle(panel).transform},{transform:`translate3d(0,${h}px,0)`}],{duration:dur,easing:'cubic-bezier(.32,.72,.28,1)',fill:'forwards'});
      let bdAnim=null;
      if(backdrop&&!backdrop.hidden)bdAnim=backdrop.animate([{opacity:getComputedStyle(backdrop).opacity},{opacity:0}],{duration:dur,easing:'linear',fill:'forwards'});
      anim.finished.then(()=>{
        panel.style.display='none';
        closeDetail();
        const done=()=>{
          if(document.body.classList.contains('detail-open')){requestAnimationFrame(done);return;}
          anim.cancel();if(bdAnim)bdAnim.cancel();clearStyles();panel.style.display='';
        };
        requestAnimationFrame(done);
      }).catch(()=>{});
    } else if((dy<-Math.min(70,h*.12)||velocity<-.55)&&!panel.classList.contains('sheet-full')){
      panel.classList.add('sheet-full');
      panel.style.transition='transform .34s cubic-bezier(.22,1,.36,1),height .34s cubic-bezier(.22,1,.36,1),border-radius .34s cubic-bezier(.22,1,.36,1),max-height .34s cubic-bezier(.22,1,.36,1)';
      requestAnimationFrame(()=>{panel.style.transform='translate3d(0,0,0)';});
      setTimeout(()=>{panel.style.transition='';},380);
    } else {
      panel.style.transition='transform .3s cubic-bezier(.22,1,.36,1)';
      requestAnimationFrame(()=>{panel.style.transform='translate3d(0,0,0)';if(backdrop)backdrop.style.opacity='';});
      setTimeout(()=>{panel.style.transition='';},340);
    }
  });
  panel.addEventListener('touchcancel',()=>{if(dragging){dragging=false;if(raf){cancelAnimationFrame(raf);raf=0;}startY=null;pendingY=null;panel.classList.remove('dragging');panel.style.transition='transform .3s cubic-bezier(.22,1,.36,1)';requestAnimationFrame(()=>{panel.style.transform='translate3d(0,0,0)';if(backdrop)backdrop.style.opacity='';});setTimeout(()=>{panel.style.transition='';},340);}});
})();


async function motion(el,frames,duration=300,delay=0){
  if(!el||reduced.matches||!settings.anim)return;
  const animation=el.animate(frames,{duration,delay,easing:ease,fill:'backwards'});
  try{await animation.finished;}catch{}finally{animation.cancel();}
}
const enter=(el,duration=350,delay=0)=>motion(el,[{opacity:0,transform:'translateY(12px)'},{opacity:1,transform:'translateY(0)'}],duration,delay);
function goMap(id){navigate((currentAgent?'utility/'+currentAgent+'/'+id:'map/'+id)+'?side='+currentSide);}
function openPoint(p){lastFocus=document.activeElement;navigate(routeFor(currentMap,p));}
function closeDetail(){if(currentMap)goMap(currentMap);}
function formatCount(count){return count?`${count} 个点位`:'待收录';}

async function closeDialog(dialog){
  if(!dialog.open||dialog.dataset.closing)return;
  dialog.dataset.closing='true';
  await motion(dialog,[{opacity:1,transform:'translateY(0) scale(1)'},{opacity:0,transform:'translateY(8px) scale(.99)'}],160);
  dialog.close();delete dialog.dataset.closing;
}
function openDialog(dialog){if(dialog.open)return;dialog.showModal();motion(dialog,[{opacity:0,transform:'translateY(18px) scale(.98)'},{opacity:1,transform:'translateY(0) scale(1)'}],350);}
async function closePicker(){const picker=$('point-picker');if(!picker.matches(':popover-open')||picker.dataset.closing)return;picker.dataset.closing='true';await motion(picker,[{opacity:1,transform:'translateY(0) scale(1)'},{opacity:0,transform:'translateY(-7px) scale(.985)'}],140);picker.hidePopover();delete picker.dataset.closing;}
function openPicker(){const picker=$('point-picker'),button=$('list-toggle'),rect=button.getBoundingClientRect();picker.style.setProperty('--picker-top',rect.bottom+8+'px');picker.style.setProperty('--picker-right',Math.max(12,innerWidth-rect.right)+'px');if(!picker.matches(':popover-open')){picker.showPopover();motion(picker,[{opacity:0,transform:'translateY(-9px) scale(.98)'},{opacity:1,transform:'translateY(0) scale(1)'}],260);}}
function pick(points){
  const list=$('picker-list'),mapName=data.maps.find(m=>m.id===currentMap)?.name||'';$('picker-context').textContent=mapName+' · '+(currentSide==='attack'?'进攻方':'防守方');list.replaceChildren(...points.map((p,i)=>node('button',{class:'picker-item',onclick:async()=>{await closePicker();openPoint(p);}},[
    node('span',{class:'guide-index',text:String(i+1).padStart(2,'0')}),node('strong',{text:p.name})
  ])));
  if(!points.length)list.append(node('p',{class:'empty',text:'当前地图暂无'+(currentSide==='attack'?'进攻方':'防守方')+'点位，试试另一阵营或地图。'}));
  openPicker();
}
$('point-picker').addEventListener('beforetoggle',e=>{if(e.newState==='closed')delete $('point-picker').dataset.closing;});
document.addEventListener('pointerdown',e=>{const picker=$('point-picker');if(picker.matches(':popover-open')&&!picker.contains(e.target)&&!$('list-toggle').contains(e.target)&&!$('side-switch').contains(e.target))closePicker();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('point-picker').matches(':popover-open')){e.preventDefault();closePicker();}});

function gallery(items,index){
  const dialog=node('dialog',{class:'lightbox','aria-label':'攻略截图预览'}),img=node('img',{alt:''});
  const close=node('button',{class:'lightbox-close',text:'关闭 ×',onclick:()=>closeDialog(dialog)}),label=node('span',{'aria-live':'polite'});
  const previous=node('button',{text:'←','aria-label':'上一张截图',onclick:()=>change(-1)}),next=node('button',{text:'→','aria-label':'下一张截图',onclick:()=>change(1)});
  let switching=false;
  const update=()=>{img.src=items[index].src;img.alt=items[index].caption;label.textContent=`${items[index].caption}  ·  ${index+1} / ${items.length}`;previous.disabled=index===0;next.disabled=index===items.length-1;};
  async function change(delta){if(switching||index+delta<0||index+delta>=items.length)return;switching=true;await motion(img,[{opacity:1,transform:'translateX(0)'},{opacity:0,transform:`translateX(${-delta*12}px)`}],100);index+=delta;update();await motion(img,[{opacity:0,transform:`translateX(${delta*12}px)`},{opacity:1,transform:'translateX(0)'}],220);switching=false;}
  dialog.append(close,img,node('div',{class:'gallery-toolbar'},[label,node('div',{class:'gallery-buttons'},[previous,next])]));
  dialog.addEventListener('cancel',e=>{e.preventDefault();closeDialog(dialog);});dialog.addEventListener('click',e=>{if(e.target===dialog)closeDialog(dialog);});
  dialog.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'){e.preventDefault();change(-1);}if(e.key==='ArrowRight'){e.preventDefault();change(1);}});
  dialog.addEventListener('close',()=>dialog.remove(),{once:true});document.body.append(dialog);update();openDialog(dialog);
}

function syncModal(){
  const active=!!detailId&&mobile.matches;
  $('detail-backdrop').hidden=!active;
  for(const el of document.querySelectorAll('.viewer-nav,.tabs-wrap,.viewer-map-column'))el.inert=active;
  if(active){$('guide-panel').setAttribute('role','dialog');$('guide-panel').setAttribute('aria-modal','true');}
  else{$('guide-panel').removeAttribute('role');$('guide-panel').removeAttribute('aria-modal');}
}
function renderDetail(p){
  $('detail-title').textContent=p.name;$('list-toggle-label').textContent=p.name;$('list-toggle').title='点位列表 · '+p.name;$('detail-description').textContent=p.detail.description||'暂无操作说明。';
  $('detail-badges').replaceChildren(node('span',{class:'badge '+p.side,text:p.side==='attack'?'进攻方':'防守方'}));
  {const src=$('detail-source');if(p.kind!=='utility'){src.hidden=false;src.textContent=p.source==='player'?'玩家投稿':'站长实录';src.className='badge '+(p.source==='player'?'source-player':'source-admin');}else src.hidden=true;}
  if(p.detail.crouch)$('detail-badges').append(node('span',{class:'badge crouch',text:'需要蹲下'}));
  const key=pointKey(currentMap,p.id),favorite=node('button',{class:'favorite-button detail-fav'});
  recordRecent(key);
  const updateFavorite=()=>{const active=personal.favorites.includes(key);favorite.textContent=active?'★ 已收藏':'☆ 收藏';favorite.setAttribute('aria-pressed',String(active));};
  favorite.onclick=()=>{personal.favorites=personal.favorites.includes(key)?personal.favorites.filter(v=>v!==key):[key,...personal.favorites].slice(0,200);savePersonal();updateFavorite();};updateFavorite();$('detail-badges').append(favorite);
  if(p.kind==='utility'){$('detail-badges').append(node('span',{class:'badge',text:abilityNames[p.ability]}));if(p.detail.jump)$('detail-badges').append(node('span',{class:'badge crouch',text:'需要跳投'}));}
  const items=p.detail.images.map((src,i)=>({src,thumbnail:p.detail.thumbnails?.[i]||src,caption:p.detail.captions?.[i]||'截图 '+(i+1)}));
  $('detail-images').replaceChildren(...items.map((item,i)=>{
    const img=node('img',{src:item.thumbnail,alt:item.caption,loading:i===0?'eager':'lazy',decoding:'async',fetchpriority:i===0?'high':'low'});
    const figure=node('figure',{},[node('button',{'aria-label':'放大'+item.caption,onclick:()=>gallery(items,i)},[img]),node('figcaption',{},[node('span',{text:item.caption}),node('span',{text:String(i+1).padStart(2,'0')})])]);
    img.addEventListener('error',()=>{if(!figure.querySelector('.image-failure'))figure.append(node('p',{class:'image-failure',text:'图片暂时无法加载，请刷新重试。'}));});return figure;
  }));
  if(!items.length)$('detail-images').append(node('p',{class:'empty',text:'这个点位暂时没有截图。'}));
  $('detail').querySelector('.detail-body').scrollTop=0;
}
async function setDetail(p){
  if(p?.id===detailId||!p&&!detailId)return;
  const wasOpen=!!detailId;
  if(p){
    if(wasOpen)await motion($('detail'),[{opacity:1},{opacity:0}],100);
    detailId=p.id;renderDetail(p);$('overview').hidden=true;$('detail').hidden=false;document.body.classList.add('detail-open');
    {const gp=$('guide-panel');gp.classList.remove('sheet-full');gp.style.transform='';gp.style.display='';const db=gp.querySelector('.detail-body');if(db)db.scrollTop=0;}
    syncModal();
    const target=mobile.matches&&!wasOpen?$('guide-panel'):$('detail');
    await motion(target,[{opacity:0,transform:mobile.matches&&!wasOpen?'translateY(45px)':'translateX(12px)'},{opacity:1,transform:'translate(0,0)'}],360);
    $('detail-close').focus({preventScroll:true});
  }else{
    await motion(mobile.matches?$('guide-panel'):$('detail'),[{opacity:1,transform:'translate(0,0)'},{opacity:0,transform:mobile.matches?'translateY(35px)':'translateX(8px)'}],200);
    detailId=null;$('detail').hidden=true;$('overview').hidden=true;$('list-toggle-label').textContent='点位列表';$('list-toggle').removeAttribute('title');document.body.classList.remove('detail-open');syncModal();
    
    if(lastFocus?.isConnected)lastFocus.focus({preventScroll:true});else $('list-toggle').focus({preventScroll:true});
  }
  highlightPoint();
}
function highlightPoint(){const p=(pointsFor(currentMap)).find(p=>p.id===detailId);for(const dot of map.layer.children)dot.classList.toggle('is-current',!!p&&dot.title.split(' / ').includes(p.name));}

function updateTabs(){
  const tabs=$('map-tabs');
  for(const b of tabs.querySelectorAll('button')){const active=b.dataset.map===currentMap;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));b.querySelector('small').textContent=pointsFor(b.dataset.map).length;}
  const active=tabs.querySelector('button.active');if(!active)return;
  $('tab-indicator').style.width=active.offsetWidth+'px';$('tab-indicator').style.transform=`translateX(${active.offsetLeft}px)`;
  const left=active.offsetLeft-tabs.scrollLeft,right=left+active.offsetWidth;
  if(left<5||right>tabs.clientWidth-5)tabs.scrollTo({left:active.offsetLeft-(tabs.clientWidth-active.offsetWidth)/2,behavior:reduced.matches?'instant':'smooth'});
}
function overview(id){
  const pts=pointsFor(id),m=data.maps.find(m=>m.id===id);
  $('map-name').textContent=m.name;$('map-en').textContent=m.nameEn.toUpperCase();$('map-count').textContent=formatCount(pts.length);
  $('overview-list').replaceChildren(...pts.map((p,i)=>node('button',{class:'guide-item',onclick:()=>openPoint(p)},[
    node('span',{class:'guide-index',text:String(i+1).padStart(2,'0')}),node('span',{},[node('strong',{text:p.name}),node('small',{text:(p.side==='attack'?'进攻方':'防守方')+' · '+p.detail.description})]),node('span',{'aria-hidden':'true',text:'›'})
  ])));
  if(!pts.length)$('overview-list').append(node('p',{class:'empty',text:'当前地图暂无'+(currentSide==='attack'?'进攻方':'防守方')+'点位，试试另一阵营或地图。'}));
}
async function page(viewing,prepare,override){
  const next=override||(viewing?'map-page':'home'),el=$(next);
  if(currentPage===next){el.inert=false;return;}
  const old=$(currentPage);old.inert=true;
  if(document.documentElement.classList.contains('initial-deep-route')){old.hidden=true;el.hidden=false;currentPage=next;if(prepare)await prepare();old.inert=false;el.inert=false;return;}
  try{
   await motion(old,currentPage==='map-page'?[{opacity:1},{opacity:0}]:[{opacity:1,transform:'translateY(0)'},{opacity:0,transform:'translateY(-10px)'}],170);
   old.hidden=true;el.hidden=false;currentPage=next;
   if(prepare)await prepare();
   if(!viewing)window.scrollTo({top:0,behavior:'instant'});
   await motion(el,viewing?[{opacity:0},{opacity:1}]:[{opacity:0,transform:'translateY(14px)'},{opacity:1,transform:'translateY(0)'}],360);
  }finally{old.inert=false;el.inert=false;}
}
async function prepareAgents(){
  const images=[...document.querySelectorAll('#agents .agent-card>img')];
  for(const image of images)image.loading='eager';
  await Promise.all(images.map(image=>image.complete&&image.naturalWidth?null:image.decode().catch(()=>null)));
}
async function renderRoute(hash){
  let parts;try{parts=decodeURIComponent(hash.slice(1).split('?')[0]).split('/');}catch{parts=[];}
  if(parts[0]==='updates'){await setDetail(null);currentMap=null;await page(false,null,'updates-page');showUpdates();document.title='版本最新改动 · 瓦小探';return;}
  const oldAgent=currentAgent,oldSide=currentSide;
  currentAgent=parts[0]==='utility'&&agentNames[parts[1]]?parts[1]:null;
  if(parts[0]==='skins'&&parts[1]==='ranking'&&weaponLabels[parts[2]]){await setDetail(null);currentMap=null;await page(false,null,'skin-ranks-page');await showSkinRanks(parts[2]);document.title=weaponLabels[parts[2]]+' · 手感排行';return;}
  if(parts[0]==='skins'&&parts[1]==='ranking'){await setDetail(null);currentMap=null;await page(false,null,'ranking-page');document.title='手感排行 · 瓦小探';return;}
  if(parts[0]==='skins'&&parts[1]==='night'&&parts[2]==='weapons'){await setDetail(null);currentMap=null;await page(false,null,'night-weapons-page');await showNightWeapons(parts[3]);document.title='夜市全部武器 · 瓦小探';return;}
  if(parts[0]==='skins'&&parts[1]==='night'){await setDetail(null);currentMap=null;await page(false,null,'night-page');showNight();document.title='夜市专题 · 瓦小探';return;}
  if(parts[0]==='skins'){await setDetail(null);currentMap=null;await page(false,null,'skins-page');document.title='皮肤专题 · 瓦小探';return;}
  // 准星页面路由
  if(parts[0]==='crosshair'){await setDetail(null);currentMap=null;currentAgent=null;await page(false,showCrosshairPage,'crosshair-page');document.title='准星方案 · 瓦小探';return;}
  if(parts[0]==='settings'){await setDetail(null);currentMap=null;currentAgent=null;await page(false,renderSettings,'settings-page');document.title='设置&关于网站 · 瓦小探';return;}
  if(parts[0]==='treasure'){await setDetail(null);currentMap=null;currentAgent=null;await page(false,()=>{const fr=$('treasure-frame');if(fr&&fr.src==='about:blank')fr.src=fr.dataset.src;},'treasure-page');document.title='百宝箱 · 音乐地形 · 瓦小探';return;}
  if(parts[0]==='utility'&&!currentAgent){await setDetail(null);await page(false,prepareAgents,'agents');currentMap=null;document.title='选择英雄 · 道具点位 · 瓦小探';return;}
  if(currentAgent)parts=['map',parts[2],parts[3]];
  const viewing=parts[0]==='map';
  document.querySelector('.viewer-nav h1').textContent=currentAgent?agentNames[currentAgent]+' · 道具点位':'穿墙点位';
  document.querySelector('.viewer-nav .back-link').href='#';document.querySelector('.viewer-nav .back-link').setAttribute('aria-label','返回首页');{const up=document.querySelector('.viewer-nav .nav-up-btn');if(up)up.hidden=!currentAgent;}
  if(!viewing){await setDetail(null);await page(false);currentMap=null;document.title='瓦小探 · VALORANT 点位手册';return;}
  const id=data.maps.some(m=>m.id===parts[1])?parts[1]:data.maps.find(m=>data.points[m.id]?.length)?.id||data.maps[0].id;
  const linked=categoryPoints(id).find(p=>p.id===parts[2]);const sideParam=new URLSearchParams(hash.split('?')[1]||'').get('side');currentSide=linked?.side||(['attack','defense'].includes(sideParam)?sideParam:currentSide);
  $('side-switch').dataset.side=currentSide;for(const button of $('side-switch').querySelectorAll('button'))button.setAttribute('aria-pressed',String(button.dataset.side===currentSide));
  const pts=pointsFor(id),mapChanged=currentMap!==id||oldAgent!==currentAgent||oldSide!==currentSide;
  if(currentPage!=='map-page'){
    await page(true,async()=>{currentMap=id;overview(id);await map.load(id,pts);updateTabs();});motion(map.world,[{opacity:0},{opacity:1}],400);
  }else if(mapChanged){
    $('map-page').classList.add('map-switching');const keepView=currentMap===id&&oldAgent===currentAgent;await setDetail(null);currentMap=id;updateTabs();await motion(map.world,[{opacity:1},{opacity:0}],150);
    overview(id);if(keepView)map.setPoints(pts);else await map.load(id,pts);await motion(map.world,[{opacity:0},{opacity:1}],300);if(location.hash===hash)$('map-page').classList.remove('map-switching');
  }
  if(location.hash!==hash)return;
  if($('point-picker').matches(':popover-open'))pick(pointsFor(id));
  await setDetail(pts.find(p=>p.id===parts[2])||null);document.title=(data.maps.find(m=>m.id===id).name)+' · '+(currentAgent?agentNames[currentAgent]+'道具点位':'穿墙指南')+' · 瓦小探';
}
async function route(){
  if(!data||routing)return;routing=true;
  try{while(renderedHash!==location.hash){const hash=location.hash;renderedHash=hash;await renderRoute(hash);}}
  catch(e){console.error(e);map.message.textContent='页面暂时无法切换，请刷新重试。';}
  finally{$('map-page').classList.remove('map-switching');$(currentPage).inert=false;routing=false;}
}

for(const button of $('side-switch').querySelectorAll('button'))button.onclick=()=>{if(!currentMap)return;navigate((currentAgent?'utility/'+currentAgent+'/'+currentMap:'map/'+currentMap)+'?side='+button.dataset.side);};
$('enter-utility').onclick=()=>navigate('utility');$('enter-crosshair').onclick=()=>navigate('crosshair');const enterSettings=$('enter-settings');if(enterSettings)enterSettings.onclick=()=>navigate('settings');
const treasureWrap=document.querySelector('.treasure-menu-wrap'),treasureOpen=$('treasure-open'),treasureMenu=$('treasure-menu');
function toggleTreasureMenu(open){if(!treasureOpen||!treasureMenu)return;treasureOpen.setAttribute('aria-expanded',String(open));treasureMenu.hidden=!open;if(open)$('treasure-music').focus({preventScroll:true});}
if(treasureOpen){
 const confirmDialog=$('treasure-confirm'),confirmStep=$('treasure-confirm-step'),confirmTitle=$('treasure-confirm-title'),confirmText=$('treasure-confirm-text'),confirmNext=$('treasure-confirm-next');
 const confirmStages=[
  {title:'你确定要打开吗？',text:'这个按钮会带你离开当前页面。',next:'我确定'},
  {title:'真的确定？',text:'现在退出还来得及，继续后还需要最后一次确认。',next:'继续'},
  {title:'最后一次确认',text:'确认后将随机打开一个危险频道。',next:'打开危险频道'}
 ];
 let stage=0;
 const renderConfirm=()=>{const item=confirmStages[stage];confirmDialog.dataset.step=String(stage+1);confirmStep.textContent=`危险确认 ${stage+1} / 3`;confirmTitle.textContent=item.title;confirmText.textContent=item.text;confirmNext.textContent=item.next;};
 const closeConfirm=()=>{confirmDialog.close();stage=0;};
 treasureOpen.onclick=()=>toggleTreasureMenu(treasureMenu.hidden);
 $('treasure-music').onclick=()=>{toggleTreasureMenu(false);navigate('treasure');};
 $('treasure-danger').onclick=()=>{toggleTreasureMenu(false);stage=0;renderConfirm();confirmDialog.showModal();confirmNext.focus();};
 $('treasure-confirm-cancel').onclick=closeConfirm;
 confirmNext.onclick=()=>{if(stage<2){stage++;renderConfirm();return;}const videos=['https://www.bilibili.com/video/BV151fQBSERC/?spm_id_from=333.337.search-card.all.click','https://www.bilibili.com/video/BV1VyNwzfEQG/?spm_id_from=333.337.search-card.all.click'];confirmDialog.close();window.open(videos[Math.floor(Math.random()*videos.length)],'_blank','noopener');stage=0;};
 confirmDialog.addEventListener('cancel',event=>{event.preventDefault();closeConfirm();});
 confirmDialog.addEventListener('pointerdown',event=>{if(event.target===confirmDialog)closeConfirm();});
 document.addEventListener('pointerdown',event=>{if(!treasureMenu.hidden&&!treasureWrap.contains(event.target))toggleTreasureMenu(false);});
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!treasureMenu.hidden){toggleTreasureMenu(false);treasureOpen.focus();}});
 window.addEventListener('hashchange',()=>{toggleTreasureMenu(false);if(confirmDialog.open)closeConfirm();});
}
function renderSettings(){
  const motionBtn=$('setting-motion'),animBtn=$('setting-anim');
  const sync=(btn,on)=>{btn.setAttribute('aria-checked',String(on));btn.classList.toggle('on',on);};
  sync(motionBtn,settings.motion);sync(animBtn,settings.anim);
  motionBtn.onclick=()=>{settings.motion=!settings.motion;applySettings();sync(motionBtn,settings.motion);};
  animBtn.onclick=()=>{settings.anim=!settings.anim;applySettings();sync(animBtn,settings.anim);};
  const favCount=personal.favorites.length,recCount=personal.recent.length;
  $('settings-personal-count').textContent=`当前设备已收藏 ${favCount} 个点位，最近浏览 ${recCount} 个。数据仅保存在本机浏览器中。`;
  $('settings-clear-personal').onclick=()=>{personal.favorites=[];personal.recent=[];savePersonal();$('settings-personal-count').textContent='收藏与浏览记录已清空。';};
}for(const button of document.querySelectorAll('[data-agent]'))button.onclick=()=>navigate('utility/'+button.dataset.agent+'/'+(data.maps.find(m=>(data.points[m.id]||[]).some(p=>p.kind==='utility'&&p.agent===button.dataset.agent))||data.maps[0]).id);
$('detail-close').onclick=closeDetail;$('detail-backdrop').onclick=closeDetail;
if($('picker-close'))$('picker-close').onclick=closePicker;$('list-toggle').onclick=()=>$('point-picker').matches(':popover-open')?closePicker():pick(pointsFor(currentMap));
for(const button of document.querySelectorAll('[data-upcoming]'))button.onclick=()=>{$('upcoming-title').textContent=button.dataset.upcoming;$('upcoming-description').textContent='这个功能还未开放。';openDialog($('upcoming-dialog'));};
const ideas={'英雄速查':'选择英雄后，集中查看技能说明、适用地图和相关点位。这个功能目前是提案。','战术画板':'在地图上标出队友站位、进攻路线和技能范围，再导出图片分享。这个功能目前是提案。','训练清单':'选择点位加入练习计划，记录哪些已经掌握。这个功能目前是提案。'};
for(const button of document.querySelectorAll('[data-idea]'))button.onclick=()=>{$('upcoming-title').textContent=button.dataset.idea;$('upcoming-description').textContent=ideas[button.dataset.idea];openDialog($('upcoming-dialog'));};
const openFavoritesDialog=()=>{renderPersonal();openDialog($('favorites-dialog'));};
if($('favorites-open'))$('favorites-open').onclick=openFavoritesDialog;
document.addEventListener('site-drawer:favorites',openFavoritesDialog);
$('favorites-close').onclick=()=>closeDialog($('favorites-dialog'));
$('favorites-dialog').addEventListener('cancel',e=>{e.preventDefault();closeDialog($('favorites-dialog'));});
$('favorites-dialog').addEventListener('click',e=>{if(e.target===$('favorites-dialog'))closeDialog($('favorites-dialog'));});
$('upcoming-close').onclick=()=>closeDialog($('upcoming-dialog'));
$('upcoming-dialog').addEventListener('cancel',e=>{e.preventDefault();closeDialog($('upcoming-dialog'));});
$('upcoming-dialog').addEventListener('click',e=>{if(e.target===$('upcoming-dialog'))closeDialog($('upcoming-dialog'));});
window.addEventListener('hashchange',route);
window.addEventListener('keydown',e=>{
  if(document.querySelector('dialog[open]'))return;
  if(e.key==='Escape'&&detailId){e.preventDefault();closeDetail();}
  if(e.key==='Tab'&&detailId&&mobile.matches){const els=[...$('detail').querySelectorAll('button,a[href]')].filter(el=>!el.disabled);const first=els[0],last=els.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}
});
new ResizeObserver(()=>{if(currentMap)updateTabs();}).observe($('map-tabs'));
mobile.addEventListener('change',syncModal);$('reload-data').onclick=()=>location.reload();

/* ---- 首页工具栏：快速检索 / Amari / 浏览历史 ----
   三个入口共用一块从右侧滑出的面板，换的只是标题和内容。匹配逻辑仍然只有一份（hubMatch）：
   检索是边打边看，Amari 是把同一批结果配一句话，浏览历史读的是 personal.recent。 */
const HUB_SIDES=[['defense',/(防守|守方|defen|ct\b)/],['attack',/(进攻|攻方|attack)/]];
function hubMatch(query){
  const text=String(query||'').trim().toLowerCase();
  if(!text)return{items:[],map:null,side:null};
  const terms=text.split(/[\s,，、+/]+/).filter(Boolean);
  let map=null,side=null;
  for(const m of data.maps)if(text.includes(m.name.toLowerCase())||text.includes(m.id)){map=m;break;}
  for(const [value,re] of HUB_SIDES)if(re.test(text)){side=value;break;}
  // 地图名和阵营词是筛选条件，不能再当关键词打一次分：否则「隐世修所 进攻」会因为「进攻」命中描述而把结果筛歪
  const filters=new Set(['防守','进攻','守方','攻方','防守方','进攻方','defen','attack','ct','t']);
  if(map){filters.add(map.name.toLowerCase());filters.add(map.id);}
  const scored=[];
  for(const item of allPoints()){
    if(map&&item.map.id!==map.id)continue;
    if(side&&item.point.side!==side)continue;
    const name=item.point.name.toLowerCase(),description=(item.point.detail?.description||'').toLowerCase(),mapName=item.map.name.toLowerCase();
    let score=0;
    for(const term of terms){
      if(filters.has(term))continue;
      if(name.includes(term))score+=6;
      else if(description.includes(term))score+=3;
      else if(mapName.includes(term))score+=2;
    }
    scored.push({item,score});
  }
  // 只说了地图或阵营（「隐世修所 进攻」）就该把符合条件的全给出来，不能因为一个关键词都没命中而清空；
  // 但一个关键词都没命中、又没有任何筛选条件时（手滑打了 zzz），「全部点位」不是答案，空才是
  const hit=scored.filter(entry=>entry.score>0);
  const items=(!hit.length&&(map||side)?scored:hit).sort((a,b)=>b.score-a.score).map(entry=>entry.item);
  return{items,map,side};
}
function hubScope(map,side){return(map?map.name:'全部地图')+(side?' · '+(side==='attack'?'进攻方':'防守方'):'');}
function hubAnswer(query){
  const {items,map,side}=hubMatch(query);
  if(items.length)return'在 '+hubScope(map,side)+' 里找到 '+items.length+' 个点位。';
  const live=data.maps.filter(m=>(data.points[m.id]||[]).length).map(m=>m.name+' '+data.points[m.id].length+' 个');
  return'在 '+hubScope(map,side)+' 里没找到。目前公开的点位只有'+(live.length?live.join('、'):'（暂无）')+'。';
}
/* 面板的开合照 js/site-drawer.js 那套写法：只动 transform/opacity，Tab 圈在面板内，
   Escape 和点遮罩都能收，收起来把焦点还给当初点开它的那颗按钮。 */
let hubOpen=false,hubCloseTimer=0,hubTrigger=null;
const hubPanel=()=>$('hub-panel');
const hubControls=()=>{const panel=hubPanel();return [...panel.querySelectorAll('a[href],button:not([disabled]),input')].filter(el=>!el.hidden&&el.getClientRects().length);};
// 打开时把焦点交到输入框上（检索和提问都是为了打字），浏览历史没输入框才退回第一个控件。
// 不能直接用 hubControls()[0] —— DOM 里第一个是关闭键，「点开就想搜」的人得多按一次 Tab。
const hubFirst=()=>{const controls=hubControls();return controls.find(el=>el.tagName==='INPUT')||controls[0];};
// 三颗按钮是同一块面板的三个入口，同一时刻只能有一颗是展开态
function setHubTrigger(button){for(const el of document.querySelectorAll('[aria-controls="hub-panel"]'))el.setAttribute('aria-expanded',String(el===button));}
function closeHubPanel(restore=true){
  if(!hubOpen)return;
  hubOpen=false;clearTimeout(hubCloseTimer);
  const panel=hubPanel(),backdrop=$('hub-panel-backdrop');
  panel.classList.remove('is-open');backdrop.classList.remove('is-open');
  document.removeEventListener('keydown',onHubKey);
  document.documentElement.classList.remove('hub-panel-open');
  // 等滑出动画走完再 hidden，否则面板会当场消失、没有退场过程（和站点抽屉同一个 330ms）
  hubCloseTimer=setTimeout(()=>{if(!hubOpen){panel.hidden=true;panel.inert=true;backdrop.hidden=true;}},330);
  setHubTrigger(null);
  if(restore&&hubTrigger?.isConnected)hubTrigger.focus({preventScroll:true});
}
function onHubKey(event){
  if(event.key==='Escape'){event.preventDefault();closeHubPanel();return;}
  if(event.key!=='Tab')return;
  const controls=hubControls(),first=controls[0],last=controls.at(-1);
  if(!first)return;
  if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
  else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
}
function openHubPanel(button,title,render){
  const panel=hubPanel(),backdrop=$('hub-panel-backdrop');
  clearTimeout(hubCloseTimer);
  $('hub-panel-title').textContent=title;
  // body 三个视图共用同一个节点，布局修饰类得先清掉：Amari 的对话布局不能让检索也跟着 flex:1
  const body=$('hub-panel-body');
  body.className='hub-panel__body';
  render(body);
  if(hubOpen){hubFirst()?.focus({preventScroll:true});return;} // 已经开着，只是换了一格内容
  hubOpen=true;hubTrigger=button;
  panel.hidden=false;panel.inert=false;backdrop.hidden=false;
  document.documentElement.classList.add('hub-panel-open');
  setHubTrigger(button);
  requestAnimationFrame(()=>{panel.classList.add('is-open');backdrop.classList.add('is-open');hubFirst()?.focus({preventScroll:true});});
  document.addEventListener('keydown',onHubKey);
}
// 面板里的点位卡片：点完马上要跳走，所以不还原焦点（restore=false），让 hashchange 那一路收尾
const panelPoint=item=>{const button=pointLink(item);button.addEventListener('click',()=>closeHubPanel(false));return button;};

function renderHubSearch(body){
  const input=node('input',{type:'search',placeholder:'点位或地图',autocomplete:'off',spellcheck:'false','aria-label':'检索点位'});
  const list=node('div',{class:'hub-points'});
  const note=node('p',{class:'home-hub__note'});
  const update=()=>{
    const text=input.value.trim();
    if(!text){note.textContent='输入点位名、地图名，或者「进攻」「防守」。';list.replaceChildren();return;}
    const {items}=hubMatch(text);
    note.textContent=items.length?'找到 '+items.length+' 个点位':'没有匹配的点位';
    list.replaceChildren(...items.slice(0,40).map(panelPoint));
  };
  input.addEventListener('input',update);
  update();
  // 单个输入框的 form，回车会触发隐式提交（等于刷新页面），拦下来
  body.replaceChildren(node('form',{class:'hub-panel__form',onsubmit:event=>event.preventDefault()},[input]),note,list);
}
/* Amari 的窗口照豆包那类对话 app 摆：中间一条消息流自己滚，输入行和快捷提问压在最底下。
   回答仍然只是 hubMatch 的那批结果加一句话，没有第二个匹配器 —— 这里换的只是摆法。 */
const amariAvatar=()=>node('img',{class:'amari-avatar',src:'assets/brand/hub-amari.webp',alt:'',width:'160',height:'160',draggable:'false','aria-hidden':'true'});
// 箭头是描出来的矢量，不是「↑」那个字符：字模的箭头粗细跟着字重走、边缘还带字体的
// hinting 毛刺，缩到 20px 就是个糊三角，跟旁边那圈干净的圆一比就露怯。
const amariSend=()=>{const button=node('button',{type:'submit',class:'amari-send','aria-label':'发送'});
  button.innerHTML='<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 16V4M5 9l5-5 5 5"/></svg>';
  return button;};
function renderHubAmari(body){
  body.classList.add('hub-panel__body--chat');
  const log=node('div',{class:'amari-log',role:'log','aria-live':'polite'});
  const input=node('input',{type:'text',placeholder:'问 Amari：隐世修所 进攻 车库',autocomplete:'off','aria-label':'向 Amari 提问'});
  const form=node('form',{class:'amari-composer'},[input,amariSend()]);
  const chips=node('div',{class:'amari-chips'},['隐世修所 进攻','车库穿中门','A厅 直架'].map(text=>node('button',{type:'button',class:'amari-chip',text,onclick:()=>ask(text)})));
  const bubble=(kind,text)=>node('p',{class:'amari-msg amari-msg--'+kind,text});
  // extra 是跟在气泡下面的点位卡片，挂在同一列里，跟头像对齐
  const bot=(children,extra)=>{const stack=node('div',{class:'amari-stack'},children);if(extra)stack.append(extra);return node('div',{class:'amari-row'},[amariAvatar(),stack]);};
  const toBottom=()=>{log.scrollTop=log.scrollHeight;};
  function ask(query){
    query=query.trim();if(!query)return;
    const {items}=hubMatch(query);
    // 先给一句话的答案，想看得细再往下点卡片
    const cards=items.length?node('div',{class:'hub-points'},items.slice(0,12).map(panelPoint)):null;
    log.append(node('div',{class:'amari-row amari-row--user'},[bubble('user',query)]),bot([bubble('bot',hubAnswer(query))],cards));
    input.value='';chips.hidden=true;toBottom();
  }
  form.addEventListener('submit',event=>{event.preventDefault();ask(input.value);});
  // 开场白当成对话里的第一条消息，而不是面板顶上的一行说明 —— 底下永远是输入框
  log.append(bot([bubble('bot','我是 Amari。问我点位在哪：带上地图名，或者「进攻」「防守」，再加点位名里的关键词。')]));
  body.replaceChildren(log,chips,form);
}
function renderHubHistory(body){
  const items=pointsByKeys(personal.recent);
  if(!items.length){body.replaceChildren(node('p',{class:'home-hub__note',text:'还没有浏览记录。打开任意点位后，这里会记下来。'}));return;}
  body.replaceChildren(node('div',{class:'hub-points'},items.map(panelPoint)));
}
function initHomeHub(){
  const views=[['hub-find-open','快速检索',renderHubSearch],['hub-amari','Amari · AI 助手',renderHubAmari],['hub-history','浏览历史',renderHubHistory]];
  for(const [id,title,render] of views){const button=$(id);if(button)button.onclick=()=>openHubPanel(button,title,render);}
  const panel=hubPanel();if(!panel)return;
  panel.inert=true;
  $('hub-panel-close').onclick=()=>closeHubPanel();
  $('hub-panel-backdrop').onclick=()=>closeHubPanel();
  // 面板和它的遮罩都挂在 main 之外，路由走了不会自己跟着藏，得手动收
  window.addEventListener('hashchange',()=>closeHubPanel(false));
  // 鼠标那团跟着走的光：CSS 拿不到指针位置，只能由这里把行内坐标写进 --mx/--my。
  // 只挂指针设备（触摸没有 hover，写了也没人看），三行各挂一个，没有共享状态
  if(matchMedia('(hover:hover) and (pointer:fine)').matches)for(const row of document.querySelectorAll('.home-hub__row')){
    row.addEventListener('pointermove',event=>{
      const rect=row.getBoundingClientRect();
      row.style.setProperty('--mx',(event.clientX-rect.left)+'px');
      row.style.setProperty('--my',(event.clientY-rect.top)+'px');
    });
  }
}

try{
  const response=await fetch('data/points.json');if(!response.ok)throw Error('无法读取点位数据');data=await response.json();if(!data.maps?.length)throw Error('没有地图数据');
  for(const m of data.maps){
    const count=data.points[m.id]?.length||0;
    $('map-tabs').append(node('button',{'data-map':m.id,'aria-pressed':'false',onclick:()=>goMap(m.id)},[document.createTextNode(m.name),node('small',{text:count})]));
  }
  const featured=data.maps.find(m=>data.points[m.id]?.length)||data.maps[0];
  $('enter-map').disabled=false;$('enter-map').onclick=()=>goMap(featured.id);
  renderPersonal();
  initHomeHub();
  await route();if(currentPage==='home'){[...document.querySelectorAll('.menu-section')].forEach((el,i)=>enter(el,500,60+i*65));}
}catch(e){$('load-error').hidden=false;$('load-error').textContent='点位内容暂时无法加载，请重新加载。';$('reload-data').hidden=false;$('enter-map').disabled=true;}
document.documentElement.classList.remove('initial-deep-route');

const finePointer=matchMedia('(hover:hover) and (pointer:fine)');
for(const card of document.querySelectorAll('.agent-card')){
 let frame=0;
 card.addEventListener('pointermove',event=>{if(reduced.matches||!finePointer.matches)return;cancelAnimationFrame(frame);const x=event.clientX,y=event.clientY;frame=requestAnimationFrame(()=>{const r=card.getBoundingClientRect(),u=(x-r.left)/r.width,v=(y-r.top)/r.height;card.style.setProperty('--light-x',u*100+'%');card.style.setProperty('--light-y',v*100+'%');card.style.setProperty('--tilt-x',(0.5-v)*5+'deg');card.style.setProperty('--tilt-y',(u-0.5)*5+'deg');});});
 card.addEventListener('pointerleave',()=>{cancelAnimationFrame(frame);card.style.removeProperty('--tilt-x');card.style.removeProperty('--tilt-y');});
}

$('enter-skins').onclick=()=>navigate('skins');
for(const button of document.querySelectorAll('[data-skin-topic]'))button.onclick=()=>{if(button.dataset.skinTopic==='夜市专题'){navigate('skins/night');return;}if(button.dataset.skinTopic==='手感排行'){navigate('skins/ranking');return;}$('upcoming-title').textContent=button.dataset.skinTopic;$('upcoming-description').textContent='专题内容正在准备中。';openDialog($('upcoming-dialog'));};

for(const button of document.querySelectorAll('[data-weapon]'))button.onclick=()=>{const id=Object.keys(weaponLabels).find(k=>weaponLabels[k]===button.dataset.weapon);navigate('skins/ranking/'+id);};

$('enter-updates').onclick=()=>navigate('updates');

for(const button of document.querySelectorAll('[data-night-topic]'))button.onclick=()=>{if(button.dataset.nightTopic==='夜市全部武器'){navigate('skins/night/weapons');return;}$('upcoming-title').textContent=button.dataset.nightTopic;$('upcoming-description').textContent='内容正在准备中。';openDialog($('upcoming-dialog'));};
