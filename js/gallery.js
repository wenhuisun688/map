// 首页活动轮播。加照片只改 PHOTOS 这一个数组，路径按顺序写进来，第一张默认先播。
// 图片放 assets/gallery/ 下：发布脚本会连整个目录一起打包，不用另外改打包逻辑。
const PHOTOS=[
  'assets/gallery/vct-2026-shanghai.webp',
];
const PERIOD=3000; // 每张停留多久，毫秒

const band=document.getElementById('photo-band');
if(band&&PHOTOS.length){
  const stage=band.querySelector('.photo-band__stage');
  const barRow=band.querySelector('.photo-band__bars');
  const slides=[],bars=[];
  let index=0,timer=null,manual=false;
  const still=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const show=i=>{index=(i+PHOTOS.length)%PHOTOS.length;
    slides.forEach((s,n)=>s.classList.toggle('is-active',n===index));
    bars.forEach((b,n)=>b.setAttribute('aria-current',n===index?'true':'false'));};
  const stop=()=>{clearInterval(timer);timer=null;};
  // 自动切换的东西必须停得下来：悬停、聚焦、点任意一条横线都暂停
  const run=()=>{stop();if(!manual&&!still)timer=setInterval(()=>show(index+1),PERIOD);};
  PHOTOS.forEach((src,i)=>{
    const slide=document.createElement('div');
    slide.className='photo-band__slide';
    // 环境光那层要拿同一个地址再虚化一遍。这里必须是绝对地址：
    // 自定义属性里的相对 url() 是按 gallery.css 的位置解析的，会变成 css/assets/...
    slide.style.setProperty('--art','url("'+new URL(src,document.baseURI).href+'")');
    const img=new Image();
    img.className='photo-band__art';img.src=src;img.alt='';img.decoding='async';
    slide.append(img);slides.push(slide);stage.append(slide);
    const bar=document.createElement('button');
    bar.type='button';bar.className='photo-band__bar';
    bar.setAttribute('aria-label','第 '+(i+1)+' 张，共 '+PHOTOS.length+' 张');
    bar.onclick=()=>{manual=true;stop();show(i);}; // 用户自己点过就不再自动走
    bars.push(bar);barRow.append(bar);
  });
  band.addEventListener('pointerenter',stop);
  band.addEventListener('pointerleave',run);
  band.addEventListener('focusin',stop);
  band.addEventListener('focusout',run);
  show(0);
  // 只有一张时横线和自动切换都是空转：藏掉，不启动计时器
  if(PHOTOS.length<2)barRow.hidden=true;else run();
}