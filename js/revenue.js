import {node} from './map.js';
/* 收益公示页。数据来自 data/ledger.json（管理端「收益公示」录入，发布时随包导出）。
   金额一律由后端校验过（捐出=收入-留存，零收入月固定 30），这里只做展示，不再算规则。
   凭证图点开看大图：复用站点已有的 lightbox 思路，但独立一个遮罩，不跟地图详情页抢节点。 */
let loaded=null;
export async function showRevenue(){
 const list=document.getElementById('revenue-list'),empty=document.getElementById('revenue-empty');
 if(!loaded){try{const r=await fetch('data/ledger.json');loaded=r.ok?await r.json():[];}catch{loaded=[];}}
 const rows=loaded;
 const sum=k=>rows.reduce((t,e)=>t+e[k],0);
 const money=v=>Number.isInteger(v)?String(v):v.toFixed(2);
 const total=document.getElementById('revenue-total');
 if(total)total.replaceChildren(node('strong',{text:'¥'+money(sum('donated'))}),node('span',{text:'累计捐出'}));
 const totalNote=document.getElementById('revenue-total-note');
 if(totalNote)totalNote.textContent=rows.length?rows.length+' 个月 · 网站收益合计 ¥'+money(sum('income'))+' · 站长留存合计 ¥'+money(sum('keeper')):'第一个月结束后这里会出现记录';
 empty.hidden=rows.length>0;
 list.replaceChildren(...rows.map(e=>{
   const img=e.receipt?node('img',{src:'images/'+e.receipt.replace(/^images\//,''),alt:e.month+' 捐款凭证',loading:'lazy',decoding:'async'}):null;
   const view=img?node('button',{type:'button',class:'revenue-receipt',onclick:()=>openReceipt(img.getAttribute('src'),e.month)},[img,node('small',{text:'查看凭证'})]):null;
   return node('article',{class:'revenue-row'},[
     node('div',{class:'revenue-row__head'},[node('time',{datetime:e.month,text:e.month.replace('-',' 年 ')+' 月'}),
       ...(e.note?[node('p',{class:'revenue-row__note',text:e.note})]:[])]),
     node('dl',{class:'revenue-row__figs'},[
       node('div',{},[node('dt',{text:'网站收益'}),node('dd',{text:'¥'+money(e.income)})]),
       node('div',{},[node('dt',{text:'站长留存'}),node('dd',{text:'¥'+money(e.keeper)})]),
       node('div',{},[node('dt',{text:'捐出'}),node('dd',{class:'revenue-donate',text:'¥'+money(e.donated)})])]),
     view||node('span',{class:'revenue-row__pending',text:'凭证待上传'})]);}));
}
function openReceipt(src,month){
 let overlay=document.getElementById('receipt-overlay');
 if(!overlay){overlay=node('div',{id:'receipt-overlay',class:'receipt-overlay',role:'dialog','aria-modal':'true',tabindex:'-1'});document.body.append(overlay);}
 overlay.replaceChildren(node('button',{type:'button',class:'receipt-close','aria-label':'关闭凭证',text:'×'}),node('img',{src,alt:month+' 捐款凭证'}),node('p',{text:month+' 捐款凭证'}));
 overlay.hidden=false;document.documentElement.classList.add('receipt-open');
 const close=()=>{overlay.hidden=true;document.documentElement.classList.remove('receipt-open');document.removeEventListener('keydown',onKey);};
 const onKey=event=>{if(event.key==='Escape')close();};
 overlay.querySelector('.receipt-close').onclick=close;
 overlay.onclick=event=>{if(event.target===overlay)close();};
 document.addEventListener('keydown',onKey);
 overlay.focus();
}
