import {node} from './map.js';
let timer;
// 下次夜市已确定 2026-09-23（北京时间零点起算）。到点之后倒计时归零，
// 卡片文案换成「已开始」，不用赶着改代码。
const NEXT=Date.parse('2026-09-23T00:00:00+08:00');
export function showNight(){
 clearInterval(timer);
 const tick=()=>{
  if(document.getElementById('night-page').hidden){clearInterval(timer);return;}
  const el=document.getElementById('night-elapsed'),left=NEXT-Date.now();
  if(left<=0){el.replaceChildren(node('strong',{text:'已开始'}));return;}
  const d=Math.floor(left/86400000),h=Math.floor(left%86400000/3600000);
  el.replaceChildren(node('strong',{text:String(d)}),node('span',{text:'天'}),node('strong',{text:String(h)}),node('span',{text:'小时'}));
 };
 tick();timer=setInterval(tick,60000);
}
