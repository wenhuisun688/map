// 全站悬浮菜单：只使用 transform/opacity 动画，避免移动端打开时触发布局重排。
const burger=document.getElementById('drawer-burger');
const drawer=document.getElementById('site-drawer');
const backdrop=document.getElementById('drawer-backdrop');
const closeBtn=document.getElementById('drawer-close');
const items=[...drawer.querySelectorAll('.drawer-item')];
let open=false,closeTimer=0,lastFocus=null;

const routeOf=()=>{
  const h=location.hash.replace(/^#\/?/,'');
  if(!h)return 'home';
  const top=h.split('/')[0].split('?')[0];
  return ['map','utility','skins','updates','crosshair','treasure','settings'].includes(top)?top:'home';
};
const markCurrent=()=>{for(const el of items){const on=el.dataset.nav===routeOf();if(on)el.setAttribute('aria-current','page');else el.removeAttribute('aria-current');}};

function focusable(){return [...drawer.querySelectorAll('a[href],button:not([disabled])')].filter(el=>!el.hidden&&el.getClientRects().length);}
function show(){
  if(open)return;
  open=true;clearTimeout(closeTimer);lastFocus=document.activeElement;
  drawer.hidden=false;drawer.inert=false;backdrop.hidden=false;
  document.documentElement.classList.add('drawer-open');
  burger.setAttribute('aria-expanded','true');
  requestAnimationFrame(()=>{
    drawer.classList.add('is-open');backdrop.classList.add('is-open');
    (drawer.querySelector('[aria-current="page"]')||closeBtn).focus({preventScroll:true});
  });
  document.addEventListener('keydown',onKey);
}
function hide(restoreFocus=true){
  if(!open)return;
  open=false;clearTimeout(closeTimer);
  drawer.classList.remove('is-open');backdrop.classList.remove('is-open');
  burger.setAttribute('aria-expanded','false');
  document.removeEventListener('keydown',onKey);
  document.documentElement.classList.remove('drawer-open');
  closeTimer=setTimeout(()=>{if(!open){drawer.hidden=true;drawer.inert=true;backdrop.hidden=true;}},230);
  if(restoreFocus)(lastFocus?.isConnected?lastFocus:burger).focus({preventScroll:true});
}
function onKey(e){
  if(e.key==='Escape'){e.preventDefault();hide();return;}
  if(e.key!=='Tab')return;
  const controls=focusable(),first=controls[0],last=controls.at(-1);
  if(!first)return;
  if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
  else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
}

drawer.inert=true;
burger.onclick=()=>open?hide():show();
if(closeBtn)closeBtn.onclick=hide;
backdrop.onclick=hide;

for(const el of items)el.addEventListener('click',()=>{hide(false);markCurrent();});
document.getElementById('drawer-favorites').onclick=()=>{hide(false);document.dispatchEvent(new Event('site-drawer:favorites'));};
window.addEventListener('hashchange',()=>{markCurrent();if(open)hide(false);});
markCurrent();
