import {node} from './map.js';
/* 2026 全球冠军赛主题页的数据都集中在下面这一块，改这里就够了。
   start：开赛时刻（北京时间），格式 '2026-10-01T00:00:00+08:00'；没定就留 null，
   页面会显示「日期待官宣」而不是假倒计时。teams：参赛队伍，[{name,tag}]，
   官方公布名单后往里加。皮肤和特效的跳转是站外链接，新窗口打开。 */
export const CHAMP={
  start:null,
  teams:[],
  links:[
    ['冠军皮肤与特效','https://valorant.qq.com','官网查看「2026 全球冠军赛」套装'],
    ['赛事直播与日程','https://esports.qq.com','无畏契约电竞官网'],
  ]};
let timer;
export function showChampions(){
 clearInterval(timer);
 const page=document.getElementById('champions-page');
 if(!page)return;
 const cd=page.querySelector('#champ-countdown'),note=page.querySelector('#champ-cd-note');
 const teamsEl=page.querySelector('#champ-teams'),linksEl=page.querySelector('#champ-links');
 const tick=()=>{
  if(page.hidden){clearInterval(timer);return;}
  if(!CHAMP.start){cd.replaceChildren(node('strong',{text:'日期待官宣'}));note.textContent='官方公布开赛时间后，这里会变成实时倒计时';return;}
  const left=Date.parse(CHAMP.start)-Date.now();
  if(left<=0){cd.replaceChildren(node('strong',{text:'比赛进行中'}));return;}
  const d=Math.floor(left/86400000),h=Math.floor(left%86400000/3600000),m=Math.floor(left%3600000/60000);
  cd.replaceChildren(node('strong',{text:String(d)}),node('span',{text:'天'}),node('strong',{text:String(h)}),node('span',{text:'时'}),node('strong',{text:String(m)}),node('span',{text:'分'}));
 };
 tick();timer=setInterval(tick,30000);
 if(CHAMP.teams.length)teamsEl.replaceChildren(...CHAMP.teams.map(t=>node('li',{},[node('b',{text:t.name}),t.tag?node('small',{text:t.tag}):null])));
 else teamsEl.replaceChildren(node('li',{class:'champ-pending',text:'参赛名单待官方公布'}));
 linksEl.replaceChildren(...CHAMP.links.map(([label,href,desc])=>node('li',{},[
   node('a',{href,target:'_blank',rel:'noopener noreferrer',text:label}),node('small',{text:desc})])));
}
