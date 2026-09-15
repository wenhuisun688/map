// 全站悬浮菜单：点击展开覆盖式侧滑抽屉，选择功能后自动收起。
const burger=document.getElementById('drawer-burger');
const drawer=document.getElementById('site-drawer');
const backdrop=document.getElementById('drawer-backdrop');
const closeBtn=document.getElementById('drawer-close');
const items=[...drawer.querySelectorAll('.drawer-item')];
let open=false;

const routeOf=()=>{
  const h=location.hash.replace(/^#\/?/,'');
  if(!h)return 'home';
  const top=h.split('/')[0].split('?')[0];
  return ['map','utility','skins','updates','crosshair','treasure','settings'].includes(top)?top:'home';
};
const markCurrent=()=>{for(const el of items){const on=el.dataset.nav===routeOf();if(on)el.setAttribute('aria-current','page');else el.removeAttribute('aria-current');}};

function show(){
  if(open)return;open=true;
  drawer.hidden=false;backdrop.hidden=false;
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
    drawer.classList.add('is-open');backdrop.classList.add('is-open');
    burger.setAttribute('aria-expanded','true');
    document.addEventListener('keydown',onKey);
  }));
}
function hide(){
  if(!open)return;open=false;
  drawer.classList.remove('is-open');backdrop.classList.remove('is-open');
  burger.setAttribute('aria-expanded','false');
  document.removeEventListener('keydown',onKey);
  setTimeout(()=>{if(!open){drawer.hidden=true;backdrop.hidden=true;}},360);
  burger.focus();
}
function onKey(e){if(e.key==='Escape'){e.preventDefault();hide();}}

burger.onclick=()=>open?hide():show();
closeBtn.onclick=hide;
backdrop.onclick=hide;
for(const el of items)el.addEventListener('click',()=>{hide();markCurrent();});
document.getElementById('drawer-favorites').onclick=()=>{hide();const fo=document.getElementById('favorites-open');if(fo)fo.click();};
window.addEventListener('hashchange',()=>setTimeout(markCurrent,60));
markCurrent();
