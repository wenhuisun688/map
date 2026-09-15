function setupSprayMenu(home) {
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
const touchMenu = matchMedia('(hover: none), (pointer: coarse)');
for (const card of home.querySelectorAll('.menu-spray')) {
  const image = card.querySelector('.spray-art');
  let hovering = card.matches(':hover'), ready = false, loading;
  const stillSource = () => touchMenu.matches && image.dataset.mobile ? image.dataset.mobile : image.dataset.still;
  const prepare = () => loading ||= (async () => {
    const animation = new Image();
    animation.src = image.dataset.motion;
    try { await animation.decode(); ready = true; update(); } catch { /* Keep the static cover if loading fails. */ }
  })();
  const update = () => {
    const playing = !touchMenu.matches && !reduceMotion.matches && !document.hidden && !home.hidden && !document.documentElement.classList.contains('no-card-motion') && (hovering || card.matches(':focus-visible'));
    if (playing && !ready) prepare();
    const source = playing && ready ? image.dataset.motion : stillSource();
    if (image.getAttribute('src') !== source) image.src = source;
  };
  card.addEventListener('pointerenter', e => { hovering = e.pointerType !== 'touch'; update(); });
  card.addEventListener('pointerleave', () => { hovering = false; update(); });
  card.addEventListener('focus', update);
  card.addEventListener('blur', update);
  image.addEventListener('error', () => { const source=stillSource();if (image.getAttribute('src') !== source) image.src = source; });
  reduceMotion.addEventListener('change', update);
  touchMenu.addEventListener('change', update);
  document.addEventListener('visibilitychange', update);
  window.addEventListener('hashchange', () => { hovering = false; image.src = stillSource(); });
  if (!reduceMotion.matches && matchMedia('(hover: hover) and (pointer: fine)').matches) prepare();
}

// Static sprite strips let us play exactly one cycle using the source frame delays.
const cards = [...home.querySelectorAll('.menu-spray')];
let generation = 0, activeAnimation, activeCard;
const stripEntries = new Map();
const canSequence = () => touchMenu.matches && !reduceMotion.matches && !document.hidden && !home.hidden && !home.inert ;
function loadStrip(card) {
  if (!stripEntries.has(card)) stripEntries.set(card, (async () => {
    const image = card.querySelector('.spray-art'), strip = new Image();
    strip.src = image.dataset.strip;
    try { await strip.decode(); } catch { return null; }
    const delays = JSON.parse(image.dataset.delays), duration = delays.reduce((a, b) => a + b, 0);
    const layer = document.createElement('span');
    layer.className = 'spray-sequence'; layer.setAttribute('aria-hidden', 'true');
    layer.style.backgroundImage = `url("${image.dataset.strip}")`;
    layer.style.backgroundSize = `${delays.length * 100}% 100%`;
    card.append(layer);
    let elapsed = 0;
    const frames = delays.map((delay, i) => {
      const frame = {backgroundPosition: `${i * 100 / (delays.length - 1)}% 0`, offset: elapsed / duration, easing: 'steps(1, end)'};
      elapsed += delay; return frame;
    });
    frames.push({backgroundPosition: '100% 0', offset: 1});
    return {card, layer, frames, duration};
  })());
  return stripEntries.get(card);
}
async function sequence() {
  const run = ++generation;
  activeAnimation?.cancel(); activeCard?.classList.remove('sequence-playing');
  activeAnimation = activeCard = null;
  if (!canSequence()) return;
  await new Promise(resolve => setTimeout(resolve, 850));
  if (run !== generation || !canSequence()) return;
  let index = 0, misses = 0;
  while (run === generation && canSequence()) {
    const entry = await loadStrip(cards[index]);
    if (!entry) { if (++misses >= cards.length) return; index = (index + 1) % cards.length; continue; }
    misses = 0;
    activeCard = entry.card; activeCard.classList.add('sequence-playing');
    activeAnimation = entry.layer.animate(entry.frames, {duration: entry.duration, iterations: 1, fill: 'forwards'});
    const preloadTimer=setTimeout(()=>{if(run===generation&&canSequence())void loadStrip(cards[(index + 1) % cards.length]);},Math.max(250,entry.duration*.6));
    try { await activeAnimation.finished; } catch { clearTimeout(preloadTimer);return; }
    clearTimeout(preloadTimer);
    if (run !== generation) return;
    activeCard.classList.remove('sequence-playing'); activeAnimation.cancel();
    index = (index + 1) % cards.length;
  }
}
new MutationObserver(sequence).observe(home, {attributes: true, attributeFilter: ['hidden', 'inert']});
document.addEventListener('visibilitychange', sequence);
window.addEventListener('hashchange', sequence);
touchMenu.addEventListener('change', sequence);
reduceMotion.addEventListener('change', sequence);
sequence();

}
for (const id of ['home','night-page']) setupSprayMenu(document.getElementById(id));
