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
function pointLink(item){return node('button',{class:'saved-point',onclick:()=>{location.hash=routeFor(item.map.id,item.point);}},[node('strong',{text:item.point.name}),node('span',{text:item.map.name+' · '+(item.point.side==='attack'?'进攻':'防守')})]);}
function renderPersonal(){
  if(!data)return;
  const items=allPoints().filter(item=>personal.favorites.includes(item.key));
  $('favorites-list').replaceChildren(...items.map(item=>{const button=pointLink(item);button.addEventListener('click',()=>closeDialog($('favorites-dialog')));return button;}));
  if(!items.length)$('favorites-list').append(node('p',{class:'empty',text:'在点位详情中点击收藏，就能在这里找到。'}));
}
const map=new MapSurface($('viewer-map'),{onPoint:points=>points.length===1?openPoint(points[0]):pick(points)});

async function motion(el,frames,duration=300,delay=0){
  if(!el||reduced.matches||!settings.anim)return;
  const animation=el.animate(frames,{duration,delay,easing:ease,fill:'backwards'});
  try{await animation.finished;}catch{}finally{animation.cancel();}
}
const enter=(el,duration=350,delay=0)=>motion(el,[{opacity:0,transform:'translateY(12px)'},{opacity:1,transform:'translateY(0)'}],duration,delay);
function goMap(id){location.hash=(currentAgent?'utility/'+currentAgent+'/'+id:'map/'+id)+'?side='+currentSide;}
function openPoint(p){lastFocus=document.activeElement;location.hash=routeFor(currentMap,p);}
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
  if(p.detail.crouch)$('detail-badges').append(node('span',{class:'badge crouch',text:'需要蹲下'}));
  const key=pointKey(currentMap,p.id),favorite=node('button',{class:'favorite-button'});
  const updateFavorite=()=>{const active=personal.favorites.includes(key);favorite.textContent=active?'★ 已收藏':'☆ 收藏';favorite.setAttribute('aria-pressed',String(active));};
  favorite.onclick=()=>{personal.favorites=personal.favorites.includes(key)?personal.favorites.filter(v=>v!==key):[key,...personal.favorites].slice(0,200);savePersonal();updateFavorite();};updateFavorite();$('detail-badges').append(favorite);
  if(p.kind==='utility'){$('detail-badges').append(node('span',{class:'badge',text:abilityNames[p.ability]}));if(p.detail.jump)$('detail-badges').append(node('span',{class:'badge crouch',text:'需要跳投'}));}
  const items=p.detail.images.map((src,i)=>({src,thumbnail:p.detail.thumbnails?.[i]||src,caption:p.detail.captions?.[i]||'截图 '+(i+1)}));
  $('detail-images').replaceChildren(...items.map((item,i)=>{
    const img=node('img',{src:item.thumbnail,alt:item.caption,loading:i===0?'eager':'lazy',decoding:'async'});
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
    detailId=p.id;renderDetail(p);$('overview').hidden=true;$('detail').hidden=false;document.body.classList.add('detail-open');syncModal();
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
  try{
   await motion(old,currentPage==='map-page'?[{opacity:1},{opacity:0}]:[{opacity:1,transform:'translateY(0)'},{opacity:0,transform:'translateY(-10px)'}],170);
   old.hidden=true;el.hidden=false;currentPage=next;
   if(prepare)await prepare();
   if(!viewing)window.scrollTo({top:0,behavior:'instant'});
   await motion(el,viewing?[{opacity:0},{opacity:1}]:[{opacity:0,transform:'translateY(14px)'},{opacity:1,transform:'translateY(0)'}],360);
  }finally{old.inert=false;el.inert=false;}
}
async function renderRoute(hash){
  let parts;try{parts=decodeURIComponent(hash.slice(1).split('?')[0]).split('/');}catch{parts=[];}
  if(parts[0]==='updates'){await setDetail(null);currentMap=null;await page(false,null,'updates-page');showUpdates();document.title='版本最新改动 · VALORANT';return;}
  const oldAgent=currentAgent,oldSide=currentSide;
  currentAgent=parts[0]==='utility'&&agentNames[parts[1]]?parts[1]:null;
  if(parts[0]==='skins'&&parts[1]==='ranking'&&weaponLabels[parts[2]]){await setDetail(null);currentMap=null;await page(false,null,'skin-ranks-page');await showSkinRanks(parts[2]);document.title=weaponLabels[parts[2]]+' · 手感排行';return;}
  if(parts[0]==='skins'&&parts[1]==='ranking'){await setDetail(null);currentMap=null;await page(false,null,'ranking-page');document.title='手感排行 · VALORANT';return;}
  if(parts[0]==='skins'&&parts[1]==='night'&&parts[2]==='weapons'){await setDetail(null);currentMap=null;await page(false,null,'night-weapons-page');await showNightWeapons(parts[3]);document.title='夜市全部武器 · VALORANT';return;}
  if(parts[0]==='skins'&&parts[1]==='night'){await setDetail(null);currentMap=null;await page(false,null,'night-page');showNight();document.title='夜市专题 · VALORANT';return;}
  if(parts[0]==='skins'){await setDetail(null);currentMap=null;await page(false,null,'skins-page');document.title='皮肤专题 · VALORANT';return;}
  // 准星页面路由
  if(parts[0]==='crosshair'){await setDetail(null);currentMap=null;currentAgent=null;await page(false,showCrosshairPage,'crosshair-page');document.title='主播职业准星方案';return;}
  if(parts[0]==='settings'){await setDetail(null);currentMap=null;currentAgent=null;await page(false,renderSettings,'settings-page');document.title='设置&关于网站 · VALORANT';return;}
  if(parts[0]==='treasure'){await setDetail(null);currentMap=null;currentAgent=null;await page(false,()=>{const fr=$('treasure-frame');if(fr&&fr.src==='about:blank')fr.src=fr.dataset.src;},'treasure-page');document.title='百宝箱 · 音乐地形';return;}
  if(parts[0]==='utility'&&!currentAgent){await setDetail(null);await page(false,null,'agents');currentMap=null;document.title='选择英雄 · 道具点位';return;}
  if(currentAgent)parts=['map',parts[2],parts[3]];
  const viewing=parts[0]==='map';
  document.querySelector('.viewer-nav h1').textContent=currentAgent?agentNames[currentAgent]+' · 道具点位':'穿墙点位';
  document.querySelector('.viewer-nav .back-link').href=currentAgent?'#utility':'#';document.querySelector('.viewer-nav .back-link').setAttribute('aria-label',currentAgent?'返回英雄选择':'返回首页');
  if(!viewing){await setDetail(null);await page(false);currentMap=null;document.title='VALORANT · 点位手册';return;}
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
  await setDetail(pts.find(p=>p.id===parts[2])||null);document.title=(data.maps.find(m=>m.id===id).name)+' · '+(currentAgent?agentNames[currentAgent]+'道具点位':'穿墙指南');
}
async function route(){
  if(!data||routing)return;routing=true;
  try{while(renderedHash!==location.hash){const hash=location.hash;renderedHash=hash;await renderRoute(hash);}}
  catch(e){console.error(e);map.message.textContent='页面暂时无法切换，请刷新重试。';}
  finally{$('map-page').classList.remove('map-switching');$(currentPage).inert=false;routing=false;}
}

for(const button of $('side-switch').querySelectorAll('button'))button.onclick=()=>{if(!currentMap)return;location.hash=(currentAgent?'utility/'+currentAgent+'/'+currentMap:'map/'+currentMap)+'?side='+button.dataset.side;};
$('enter-utility').onclick=()=>{location.hash='utility';};$('enter-crosshair').onclick=()=>{location.hash='crosshair';};const enterSettings=$('enter-settings');if(enterSettings)enterSettings.onclick=()=>{location.hash='settings';};const treasureOpen=$('treasure-open');if(treasureOpen)treasureOpen.onclick=()=>{location.hash='treasure';};
function renderSettings(){
  const motionBtn=$('setting-motion'),animBtn=$('setting-anim');
  const sync=(btn,on)=>{btn.setAttribute('aria-checked',String(on));btn.classList.toggle('on',on);};
  sync(motionBtn,settings.motion);sync(animBtn,settings.anim);
  motionBtn.onclick=()=>{settings.motion=!settings.motion;applySettings();sync(motionBtn,settings.motion);};
  animBtn.onclick=()=>{settings.anim=!settings.anim;applySettings();sync(animBtn,settings.anim);};
  const favCount=personal.favorites.length,recCount=personal.recent.length;
  $('settings-personal-count').textContent=`当前设备已收藏 ${favCount} 个点位，最近浏览 ${recCount} 个。数据仅保存在本机浏览器中。`;
  $('settings-clear-personal').onclick=()=>{personal.favorites=[];personal.recent=[];savePersonal();$('settings-personal-count').textContent='收藏与浏览记录已清空。';};
}for(const button of document.querySelectorAll('[data-agent]'))button.onclick=()=>{location.hash='utility/'+button.dataset.agent+'/'+(data.maps.find(m=>(data.points[m.id]||[]).some(p=>p.kind==='utility'&&p.agent===button.dataset.agent))||data.maps[0]).id;};
$('detail-close').onclick=closeDetail;$('detail-backdrop').onclick=closeDetail;
$('picker-close').onclick=closePicker;$('list-toggle').onclick=()=>$('point-picker').matches(':popover-open')?closePicker():pick(pointsFor(currentMap));
for(const button of document.querySelectorAll('[data-upcoming]'))button.onclick=()=>{$('upcoming-title').textContent=button.dataset.upcoming;$('upcoming-description').textContent='这个功能还未开放。';openDialog($('upcoming-dialog'));};
const ideas={'英雄速查':'选择英雄后，集中查看技能说明、适用地图和相关点位。这个功能目前是提案。','战术画板':'在地图上标出队友站位、进攻路线和技能范围，再导出图片分享。这个功能目前是提案。','训练清单':'选择点位加入练习计划，记录哪些已经掌握。这个功能目前是提案。'};
for(const button of document.querySelectorAll('[data-idea]'))button.onclick=()=>{$('upcoming-title').textContent=button.dataset.idea;$('upcoming-description').textContent=ideas[button.dataset.idea];openDialog($('upcoming-dialog'));};
$('favorites-open').onclick=()=>{renderPersonal();openDialog($('favorites-dialog'));};
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

try{
  const response=await fetch('data/points.json');if(!response.ok)throw Error('无法读取点位数据');data=await response.json();if(!data.maps?.length)throw Error('没有地图数据');
  for(const m of data.maps){
    const count=data.points[m.id]?.length||0;
    $('map-tabs').append(node('button',{'data-map':m.id,'aria-pressed':'false',onclick:()=>goMap(m.id)},[document.createTextNode(m.name),node('small',{text:count})]));
  }
  const featured=data.maps.find(m=>data.points[m.id]?.length)||data.maps[0];
  $('enter-map').disabled=false;$('enter-map').onclick=()=>goMap(featured.id);
  renderPersonal();
  await route();if(currentPage==='home'){enter($('hub-title'),450);[...document.querySelectorAll('.menu-section')].forEach((el,i)=>enter(el,500,60+i*65));}
}catch(e){$('load-error').hidden=false;$('load-error').textContent='点位内容暂时无法加载，请重新加载。';$('reload-data').hidden=false;$('enter-map').disabled=true;}

const finePointer=matchMedia('(hover:hover) and (pointer:fine)');
for(const card of document.querySelectorAll('.agent-card')){
 let frame=0;
 card.addEventListener('pointermove',event=>{if(reduced.matches||!finePointer.matches)return;cancelAnimationFrame(frame);const x=event.clientX,y=event.clientY;frame=requestAnimationFrame(()=>{const r=card.getBoundingClientRect(),u=(x-r.left)/r.width,v=(y-r.top)/r.height;card.style.setProperty('--light-x',u*100+'%');card.style.setProperty('--light-y',v*100+'%');card.style.setProperty('--tilt-x',(0.5-v)*5+'deg');card.style.setProperty('--tilt-y',(u-0.5)*5+'deg');});});
 card.addEventListener('pointerleave',()=>{cancelAnimationFrame(frame);card.style.removeProperty('--tilt-x');card.style.removeProperty('--tilt-y');});
}

$('enter-skins').onclick=()=>{location.hash='skins';};
for(const button of document.querySelectorAll('[data-skin-topic]'))button.onclick=()=>{if(button.dataset.skinTopic==='夜市专题'){location.hash='skins/night';return;}if(button.dataset.skinTopic==='手感排行'){location.hash='skins/ranking';return;}$('upcoming-title').textContent=button.dataset.skinTopic;$('upcoming-description').textContent='专题内容正在准备中。';openDialog($('upcoming-dialog'));};

for(const button of document.querySelectorAll('[data-weapon]'))button.onclick=()=>{const id=Object.keys(weaponLabels).find(k=>weaponLabels[k]===button.dataset.weapon);location.hash='skins/ranking/'+id;};

$('enter-updates').onclick=()=>{location.hash='updates';};

for(const button of document.querySelectorAll('[data-night-topic]'))button.onclick=()=>{if(button.dataset.nightTopic==='夜市全部武器'){location.hash='skins/night/weapons';return;}$('upcoming-title').textContent=button.dataset.nightTopic;$('upcoming-description').textContent='内容正在准备中。';openDialog($('upcoming-dialog'));};
