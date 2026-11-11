/* Opening sky and the first step of the journey. */
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
    // a slow ring of eight-pointed stars, like a lamp's pierced brass
    ctx.save(); ctx.translate(w / 2, h / 2);
    const R = Math.min(w, h) * 0.42;
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

  const m = /station-(\d+)/.exec(location.hash);
  const startAt = m ? Math.max(0, Math.min(ENGINE.stages.length - 1, parseInt(m[1], 10) - 1)) : 0;

  document.getElementById('begin').addEventListener('click', () => {
    SND.init();
    intro.classList.add('gone');
    setTimeout(() => { running = false; intro.remove(); }, 1700);
    ENGINE.start(startAt);
  });
})();
