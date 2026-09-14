import {node,lightbox} from './map.js';
let catalogPromise,serial=0;
const tiers={
 premium:{label:'紫色品质',light:'#9468d5',top:'#3b2854',bottom:'#17131f',border:'#b58be57a'},
 ultra:{label:'金色品质',light:'#c69a51',top:'#44321f',bottom:'#1c1711',border:'#d6b36c7a'},
 exclusive:{label:'限定品质',light:'#d9686f',top:'#46232b',bottom:'#1e1418',border:'#e681877a'},
 default:{label:'精选品质',light:'#537da4',top:'#243546',bottom:'#121820',border:'#7199bd66'}
};
export async function showNightWeapons(weapon='vandal'){
 const request=++serial,root=document.getElementById('night-weapons-content');
 root.setAttribute('aria-busy','true');
 try{
  catalogPromise??=fetch('assets/night-catalog.json').then(r=>{if(!r.ok)throw Error();return r.json();}).catch(e=>{catalogPromise=null;throw e;});
  const data=await catalogPromise;if(request!==serial)return;
  const selected=data.groups.find(g=>g.id===weapon)||data.groups[0];
  let nav=root.querySelector('.night-weapon-tabs'),heading=root.querySelector('.night-weapon-heading'),grid=root.querySelector('.night-weapon-grid');
  if(!nav){
   nav=node('nav',{class:'night-weapon-tabs','aria-label':'武器类型'},data.groups.map(g=>node('a',{href:'#skins/night/weapons/'+g.id,text:g.name,'data-weapon-id':g.id})));
   heading=node('div',{class:'night-weapon-heading'},[node('h2'),node('span')]);
   grid=node('div',{class:'night-weapon-grid'});
   root.replaceChildren(nav,heading,grid);
  }
  for(const link of nav.querySelectorAll('a')){
   if(link.dataset.weaponId===selected.id)link.setAttribute('aria-current','page');
   else link.removeAttribute('aria-current');
  }
  heading.querySelector('h2').textContent=selected.name;
  heading.querySelector('span').textContent=selected.items.length+' 款';
  const cards=document.createDocumentFragment();
  selected.items.forEach((s,i)=>{
   const tier=tiers[s.tier]||tiers.default;
   const card=node('button',{type:'button',class:'agent-card skin-card night-weapon-card','data-tier':s.tier||'default','aria-label':'查看 '+s.name+'，'+tier.label,onclick:()=>lightbox(s.image,s.name)},[
    node('span',{class:'skin-orbit','aria-hidden':'true'}),
    node('img',{src:s.image,alt:s.name,loading:i<6?'eager':'lazy',decoding:'async',draggable:'false',width:'560',height:'240'}),
    node('span',{class:'agent-card-bottom'},[node('strong',{text:s.name})])
   ]);
   card.style.setProperty('--tier-light',tier.light);
   card.style.setProperty('--tier-top',tier.top);
   card.style.setProperty('--tier-bottom',tier.bottom);
   card.style.setProperty('--tier-border',tier.border);
   cards.append(card);
  });
  if(!selected.items.length)cards.append(node('p',{class:'empty',text:'这个武器暂未收录可入池皮肤。'}));
  grid.replaceChildren(cards);
 }catch{if(request===serial)root.replaceChildren(node('p',{class:'empty',text:'皮肤图鉴加载失败。'}),node('button',{text:'重新加载',onclick:()=>showNightWeapons(weapon)}));}
 finally{if(request===serial)root.removeAttribute('aria-busy');}
}
// One delegated pointer handler also covers cards created when changing categories.
const root=document.getElementById('night-weapons-content');let frame=0,active;
root.addEventListener('pointermove',e=>{
 if(!matchMedia('(hover:hover) and (pointer:fine) and (prefers-reduced-motion:no-preference)').matches)return;
 const card=e.target.closest('.night-weapon-card');if(!card)return;
 if(active&&active!==card)reset();active=card;cancelAnimationFrame(frame);
 const x=e.clientX,y=e.clientY;
 frame=requestAnimationFrame(()=>{const r=card.getBoundingClientRect(),u=(x-r.left)/r.width,v=(y-r.top)/r.height;card.style.setProperty('--light-x',u*100+'%');card.style.setProperty('--light-y',v*100+'%');card.style.setProperty('--tilt-x',(0.5-v)*4+'deg');card.style.setProperty('--tilt-y',(u-0.5)*4+'deg');});
});
function reset(){cancelAnimationFrame(frame);if(active){active.style.removeProperty('--tilt-x');active.style.removeProperty('--tilt-y');active=null;}}
root.addEventListener('pointerout',e=>{if(active&&!active.contains(e.relatedTarget))reset();});
