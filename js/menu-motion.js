const home = document.getElementById('home');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
for (const card of home.querySelectorAll('.menu-spray')) {
  const image = card.querySelector('.spray-art');
  let hovering = false;
  const update = () => {
    const playing = !reduceMotion.matches && !document.hidden && !home.hidden && (hovering || card.matches(':focus-visible'));
    const source = playing ? image.dataset.motion : image.dataset.still;
    if (image.getAttribute('src') !== source) image.src = source;
  };
  card.addEventListener('pointerenter', e => { hovering = e.pointerType !== 'touch'; update(); });
  card.addEventListener('pointerleave', () => { hovering = false; update(); });
  card.addEventListener('focus', update);
  card.addEventListener('blur', update);
  image.addEventListener('error', () => { if (image.getAttribute('src') !== image.dataset.still) image.src = image.dataset.still; });
  reduceMotion.addEventListener('change', update);
  document.addEventListener('visibilitychange', update);
  window.addEventListener('hashchange', () => { hovering = false; image.src = image.dataset.still; });
}
