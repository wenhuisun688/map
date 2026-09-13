const home = document.getElementById('home');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
const touchMenu = matchMedia('(hover: none), (pointer: coarse)');
for (const card of home.querySelectorAll('.menu-spray')) {
  const image = card.querySelector('.spray-art');
  let hovering = card.matches(':hover'), ready = false, loading;
  const prepare = () => loading ||= (async () => {
    const animation = new Image();
    animation.src = image.dataset.motion;
    try { await animation.decode(); ready = true; update(); } catch { /* Keep the static cover if loading fails. */ }
  })();
  const update = () => {
    const playing = !touchMenu.matches && !reduceMotion.matches && !document.hidden && !home.hidden && (hovering || card.matches(':focus-visible'));
    if (playing && !ready) prepare();
    const source = playing && ready ? image.dataset.motion : image.dataset.still;
    if (image.getAttribute('src') !== source) image.src = source;
  };
  card.addEventListener('pointerenter', e => { hovering = e.pointerType !== 'touch'; update(); });
  card.addEventListener('pointerleave', () => { hovering = false; update(); });
  card.addEventListener('focus', update);
  card.addEventListener('blur', update);
  image.addEventListener('error', () => { if (image.getAttribute('src') !== image.dataset.still) image.src = image.dataset.still; });
  reduceMotion.addEventListener('change', update);
  touchMenu.addEventListener('change', update);
  document.addEventListener('visibilitychange', update);
  window.addEventListener('hashchange', () => { hovering = false; image.src = image.dataset.still; });
  if (!reduceMotion.matches && matchMedia('(hover: hover) and (pointer: fine)').matches) prepare();
}

// Static sprite strips let us play exactly one cycle using the source frame delays.
const cards = [...home.querySelectorAll('.menu-spray')];
let strips, generation = 0, activeAnimation, activeCard;
const canSequence = () => touchMenu.matches && !reduceMotion.matches && !document.hidden && !home.hidden && !home.inert && (!location.hash || location.hash === '#');
function loadStrips() {
  return strips ||= Promise.all(cards.map(async card => {
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
  }));
}
async function sequence() {
  const run = ++generation;
  activeAnimation?.cancel(); activeCard?.classList.remove('sequence-playing');
  activeAnimation = activeCard = null;
  if (!canSequence()) return;
  const entries = (await loadStrips()).filter(Boolean);
  if (!entries.length) return;
  let index = 0;
  while (run === generation && canSequence()) {
    const entry = entries[index];
    activeCard = entry.card; activeCard.classList.add('sequence-playing');
    activeAnimation = entry.layer.animate(entry.frames, {duration: entry.duration, iterations: 1, fill: 'forwards'});
    try { await activeAnimation.finished; } catch { return; }
    if (run !== generation) return;
    activeCard.classList.remove('sequence-playing'); activeAnimation.cancel();
    index = (index + 1) % entries.length;
  }
}
new MutationObserver(sequence).observe(home, {attributes: true, attributeFilter: ['hidden', 'inert']});
document.addEventListener('visibilitychange', sequence);
window.addEventListener('hashchange', sequence);
touchMenu.addEventListener('change', sequence);
reduceMotion.addEventListener('change', sequence);
sequence();
