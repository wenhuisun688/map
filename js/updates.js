import {node} from './map.js';
const source=v=>'https://playvalorant.com/en-us/news/game-updates/valorant-patch-notes-'+v.replace('.','-')+'/';
const notes=[
 {type:'活动',version:'13.05',date:'2026-09-01',title:'上海冠军赛竞猜开启',body:'9 月 10 日开放小组赛预测，可在客户端或网页参与。请在 9 月 24 日小组赛开赛前提交；预测晋级与名次可得积分，参与也有奖励。'},
 {type:'系统',version:'13.05',date:'2026-09-01',title:'更清晰的对局体验',body:'修复烟雾消散后仍遮挡闪光等视线判定的问题。有声喷漆改为近距离可闻；训练场可选择 1、5、10 个机器人，默认 5 个。'},
 {type:'活动',version:'13.05',date:'2026-09-01',title:'英雄装备改版预告',body:'官方预告 13.06 将于 9 月 22 日调整英雄装备解锁。已有物品保留，未来仍使用王国币，但解锁将与对应英雄的游玩进度关联。',tag:'尚未实装 · 13.06 预告'},
 {type:'地图',version:'13.04',date:'2026-08-18',title:'地图池轮换',body:'深窟幽境（Abyss）加入竞技与死斗队列，微风岛屿（Breeze）退出。这是地图池轮换，并非地图地形重做。',changes:[['加入','深窟幽境'],['退出','微风岛屿']]},
 {type:'活动',version:'13.04',date:'2026-08-18',title:'Premier 第五幕赛程',body:'本阶段常规比赛缩短为五周，达到 450 分的队伍可晋级 9 月 20 日季后赛；Contender 与 Invite 组仍按排名晋级，季后赛安排在 9 月 19–20 日。'},
 {type:'枪械',version:'13.01',date:'2026-07-14',title:'莽侠 · 连续射击调整',body:'首发后的恢复、散布与后坐力提高，连续两枪需要更多控制。以下是 13.01 的调整，不是 13.05 的新改动。',changes:[['首发后恢复','0.1 → 0.15'],['首发后散布','0 → 2.25'],['首发后后坐力','0 → 4.0']]}
];
let built=false,timer;
function updateClock(){
 const page=document.getElementById('updates-page');if(page.hidden){clearInterval(timer);timer=null;return;}
 const seconds=Math.max(0,Math.ceil((Date.parse('2026-10-14T00:00:00Z')-Date.now())/1000)),el=document.getElementById('act-remaining');
 if(!seconds){el.textContent='本幕参考时间已结束';clearInterval(timer);timer=null;return;}
 const values=[Math.floor(seconds/86400),Math.floor(seconds%86400/3600),Math.floor(seconds%3600/60),seconds%60].map(n=>String(n).padStart(2,'0'));
 if(!el.querySelector('.clock-face')){el.replaceChildren();['天','时','分','秒'].forEach((label,i)=>{if(i>1)el.append(node('span',{class:'clock-colon',text:':','aria-hidden':'true'}));el.append(node('span',{class:'clock-unit'},[node('strong',{class:'clock-face',text:values[i],'aria-hidden':'true'}),node('span',{text:label})]));});}
 el.setAttribute('aria-label',values[0]+'天'+values[1]+'小时'+values[2]+'分'+values[3]+'秒');
 el.querySelectorAll('.clock-face').forEach((face,i)=>{
 const previous=face.dataset.value,next=values[i];if(previous===next)return;face.dataset.value=next;
 const animate=previous&&!matchMedia('(prefers-reduced-motion:reduce)').matches;
 face.replaceChildren(document.createTextNode(animate?previous:next));
 if(!animate)return;
 // Keep the old lower half until the new lower flap has landed.
 const upper=node('span',{class:'clock-flap clock-next-top'},[node('span',{text:next})]);
 const top=node('span',{class:'clock-flap clock-flap-top'},[node('span',{text:previous})]);
 const bottom=node('span',{class:'clock-flap clock-flap-bottom'},[node('span',{text:next})]);
 bottom.addEventListener('animationend',()=>{if(bottom.parentNode===face)face.replaceChildren(document.createTextNode(next));},{once:true});
 face.append(upper,top,bottom);
 });
}
export function showUpdates(){
 if(!built){built=true;const root=document.getElementById('updates-content');
 const hero=node('div',{class:'update-hero'},[node('aside',{class:'act-clock'},[node('p',{text:'V26 · 第五幕剩余时间'}),node('div',{id:'act-remaining','aria-label':'第五幕剩余时间'}),node('p',{class:'clock-note',text:'参考结束：10 月 14 日 08:00（北京时间）'}),node('a',{class:'clock-note',href:'https://valorant-api.com/v1/seasons',target:'_blank',rel:'noopener',text:'游戏赛季数据 · 非国服停排承诺'})])]);
 const list=node('div',{class:'update-list'}),tabs=node('nav',{class:'update-tabs','aria-label':'按更新类型筛选'});
 function render(type){list.replaceChildren(...notes.filter(n=>type==='全部'||n.type===type).map(n=>node('article',{class:'update-note'},[node('div',{class:'note-stamp'},[node('strong',{text:n.version}),node('time',{datetime:n.date,text:n.date.replaceAll('-','.')}),node('span',{class:'note-type',text:n.type})]),node('div',{class:'note-body'},[...(n.tag?[node('span',{class:'note-preview',text:n.tag})]:[]),node('h2',{text:n.title}),node('p',{text:n.body}),...(n.changes?[node('dl',{class:'note-changes'},n.changes.map(([a,b])=>node('div',{},[node('dt',{text:a}),node('dd',{text:b})])))]:[]),node('a',{href:source(n.version),target:'_blank',rel:'noopener',text:'查看原文 ↗'})])])));}
 for(const type of ['全部','枪械','地图','活动','系统'])tabs.append(node('button',{type:'button',text:type,'aria-pressed':String(type==='全部'),onclick:e=>{for(const b of tabs.children)b.setAttribute('aria-pressed',String(b===e.currentTarget));render(type);}}));
 root.append(node('h1',{class:'updates-heading',text:'版本动态'}),hero,node('p',{class:'update-context',text:'13.05 未列出枪械平衡或地图池调整；下方保留最近相关版本。'}),tabs,list,node('footer',{class:'update-footer',text:'核对日期：2026.09.14 · 公告为人工整理，倒计时按参考日期更新。国服版本与停排时间请以客户端公告为准。'}));render('全部');
 }clearInterval(timer);updateClock();timer=setInterval(updateClock,1000);
}
