import {node} from './map.js';
let timer;
export function showNight(){
 clearInterval(timer);
 const tick=()=>{
  if(document.getElementById('night-page').hidden){clearInterval(timer);return;}
  const days=Math.max(0,Math.floor((Date.now()-Date.parse('2026-07-29T00:00:00+08:00'))/86400000));
  document.getElementById('night-elapsed').replaceChildren(node('strong',{text:String(days)}),node('span',{text:'天'}));
 };
 tick();timer=setInterval(tick,60000);
}
