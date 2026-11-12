/* Opening sky, the choice of city, and the first step of the journey. */
(function () {
  'use strict';
  const intro = document.getElementById('intro');
  const c = document.getElementById('intro-sky'), ctx = c.getContext('2d');
  let w, h, dpr, stars = [], running = true;

  function size() {
    dpr = Math.min(devicePixelRatio || 1, 2); w = innerWidth; h = innerHeight;
    c.width = w * dpr; c.height = h * dpr;
    stars = Array.from({ length: Math.round(w * h / 2600) }, () => ({
      x: Math.random() * w, y: Math.random() * h, r: Math.random() * 1.2 + 0.2, p: Math.random() * 6.28, s: Math.random() * 1.5 + 0.3,
    }));
  }
  size(); addEventListener('resize', size);

  function draw(t) {
    if (!running) return;
    t /= 1000;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    for (const s of stars) {
      const a = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * s.s + s.p));
      ctx.fillStyle = `rgba(242,233,214,${a * (1 - s.y / h * 0.7)})`;
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.283); ctx.fill();
    }
    ctx.save(); ctx.translate(w / 2, h / 2);
    const R = Math.min(w, h) * 0.46;
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * 6.283 + t * 0.02;
      ctx.globalAlpha = 0.08 + 0.06 * Math.sin(t * 0.6 + i);
      ctx.strokeStyle = '#cfa250'; ctx.lineWidth = 1;
      U.star8(ctx, Math.cos(a) * R, Math.sin(a) * R, 7, 0.55, a); ctx.stroke();
    }
    ctx.restore(); ctx.globalAlpha = 1;
    requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);

  function leaveIntro() {
    SND.init();
    intro.classList.add('gone');
    setTimeout(() => { running = false; }, 1700);
  }
  ENGINE.onHome = () => {
    if (window.ATLAS) ATLAS.hide();
    document.getElementById('hud').hidden = true;
    intro.classList.remove('gone');
    if (!running) { running = true; requestAnimationFrame(draw); }
  };

  const ids = () => SIRAH.stations.map(s => s.id);
  const startAtId = id => { leaveIntro(); const go = () => ENGINE.start(ENGINE.indexOf(id)); ENGINE.boot(); go(); };

  document.getElementById('go-makkah').addEventListener('click', () => { leaveIntro(); ENGINE.openMap('makkah'); });
  document.getElementById('go-madinah').addEventListener('click', () => { leaveIntro(); ENGINE.openMap('madinah'); });
  document.getElementById('begin').addEventListener('click', () => startAtId(ids()[0]));

  // Deep links: #makkah, #madinah, #<station id>, or #station-N (Nth station in order)
  const hash = location.hash.slice(1);
  const m = /^station-(\d+)$/.exec(hash);
  const target = m ? ids()[Math.max(0, Math.min(ids().length - 1, parseInt(m[1], 10) - 1))] : ids().includes(hash) ? hash : null;
  if (target || hash === 'makkah' || hash === 'madinah') {
    const btn = document.getElementById('begin');
    btn.textContent = target ? `Continue to ${(ENGINE.byId(target) || {}).title || target}` : `Open the map of ${hash === 'makkah' ? 'Makkah' : 'Madinah'}`;
    btn.classList.add('linked');
    btn.addEventListener('click', e => {
      e.stopImmediatePropagation();
      if (target) startAtId(target); else { leaveIntro(); ENGINE.openMap(hash); }
    }, true);
  }
})();
