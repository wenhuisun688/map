// 首页活动轮播。加照片只改 PHOTOS 这一个数组，每项是 [路径, 读屏说明, 点击跳转的锚点]，第一张默认先播。
// 图片放 assets/gallery/ 下：发布脚本会连整个目录一起打包，不用另外改打包逻辑。
// 说明那一项：纯装饰的图留空串；图上印着要给人读的字（联系方式等）就照实写出来。
// 第三个元素给了锚点，这张照片就能点（键盘 Enter 也行），跳去对应专题页。
const PHOTOS=[
  ['assets/gallery/vct-2026-shanghai.webp','','#champions'],
  ['assets/gallery/waxiaotan-banner.webp?v=2','瓦小探：精准、快速、清晰。如有想法、建议、bug、合作、侵权，请联系站长 2452988105@qq.com，微信 TWT66078'],
];
const PERIOD=2600; // 每张停留多久，毫秒

const band=document.getElementById('photo-band');
if(band&&PHOTOS.length){
  const stage=band.querySelector('.photo-band__stage');
  const barRow=band.querySelector('.photo-band__bars');
  const slides=[],bars=[];
  let index=0,timer=null;
  const still=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const show=i=>{index=(i+PHOTOS.length)%PHOTOS.length;
    slides.forEach((s,n)=>s.classList.toggle('is-active',n===index));
    bars.forEach((b,n)=>b.setAttribute('aria-current',n===index?'true':'false'));};
  const stop=()=>{clearInterval(timer);timer=null;};
  // 自动切换的东西必须停得下来：悬停、聚焦时暂停；点横线是跳到那张并重新计时，不是关掉轮播
  const run=()=>{stop();if(!still)timer=setInterval(()=>show(index+1),PERIOD);};
  PHOTOS.forEach(([src,alt,link],i)=>{
    const slide=document.createElement('div');
    slide.className='photo-band__slide';
    const img=new Image();
    img.className='photo-band__art';img.src=src;img.alt=alt||'';img.decoding='async';
    if(link){
      // 可点的照片包一层 <a>：href 走站内锚点，手机上的层级导航（viewer.js 里那套
      // pushState 链）会接管点击，返回键能退回首页。键盘 Tab 得到、Enter 能走。
      const anchor=document.createElement('a');
      anchor.className='photo-band__link';anchor.href=link;
      anchor.setAttribute('aria-label','打开 '+(alt||img.getAttribute('src').split('/').pop()));
      anchor.append(img);slide.append(anchor);
    }else slide.append(img);
    slides.push(slide);stage.append(slide);
    const bar=document.createElement('button');
    bar.type='button';bar.className='photo-band__bar';
    bar.setAttribute('aria-label','第 '+(i+1)+' 张，共 '+PHOTOS.length+' 张');
    bar.onclick=()=>{show(i);run();}; // 跳到那张，自动播放重新计时
    bars.push(bar);barRow.append(bar);
  });
  band.addEventListener('pointerenter',stop);
  band.addEventListener('pointerleave',run);
  band.addEventListener('focusin',stop);
  band.addEventListener('focusout',run);
  // 左右箭头：桌面手机都摆，压在照片两缘
  const step=d=>{show(index+d);run();};
  const navs=[];
  for(const [cls,dir,label,path] of [['photo-band__prev',-1,'上一张','m15 5-7 7 7 7'],['photo-band__next',1,'下一张','m9 5 7 7-7 7']]){
    const b=document.createElement('button');
    b.type='button';b.className='photo-band__nav '+cls;b.setAttribute('aria-label',label);
    b.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="'+path+'"/></svg>';
    b.onclick=()=>step(dir);
    navs.push(b);stage.append(b);
  }
  // 手机上横向滑动切换：只认明显大于纵向位移的横拖，竖着滚页面不算
  let tx=null,ty=null;
  stage.addEventListener('touchstart',event=>{if(event.touches.length!==1)return;tx=event.touches[0].clientX;ty=event.touches[0].clientY;},{passive:true});
  stage.addEventListener('touchend',event=>{
    if(tx===null)return;
    const t=event.changedTouches[0],dx=t.clientX-tx,dy=t.clientY-ty;
    tx=null;
    if(Math.abs(dx)>40&&Math.abs(dx)>Math.abs(dy)*1.5)step(dx<0?1:-1);
  },{passive:true});
  // 照片不许被拖走（拖到收藏栏、别的窗口都不行）；链接的拖拽也从这里一起拦
  stage.addEventListener('dragstart',event=>event.preventDefault());
  show(0);
  // 只有一张时横线、箭头和自动切换都是空转：藏掉，不启动计时器
  if(PHOTOS.length<2){barRow.hidden=true;for(const b of navs)b.hidden=true;}else run();
}