/* The journey engine: owns the stations, the frame loop, input, transitions and the HUD. */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

  const E = {
    stages: [], index: -1, cur: null, env: null,
    w: innerWidth, h: innerHeight, dpr: Math.min(devicePixelRatio || 1, 2),
    pointer: { x: innerWidth / 2, y: innerHeight / 2, down: false, vx: 0, vy: 0, inside: false },
    completed: new Set(), busy: false, t: 0,
  };

  E.register = s => E.stages.push(s);

  /* ---------- environment handed to each station ---------- */
  function makeEnv(stage) {
    const canvases = [];
    const env = {
      stage, w: E.w, h: E.h, dpr: E.dpr, pointer: E.pointer, time: 0, done: false,
      bus: SND.bus(stage.sound || {}),
      canvas2d(opts) {
        opts = opts || {};
        const c = document.createElement('canvas');
        c.dataset.scale = opts.scale || 1;
        $('host').appendChild(c);
        const ctx = c.getContext('2d', { alpha: !!opts.alpha });
        canvases.push(c); sizeCanvas(c);
        return { canvas: c, ctx };
      },
      webgl(opts) {
        const c = document.createElement('canvas');
        c.dataset.scale = (opts && opts.scale) || 1;
        $('host').appendChild(c);
        const gl = c.getContext('webgl', { antialias: true, premultipliedAlpha: false }) || c.getContext('experimental-webgl');
        canvases.push(c); sizeCanvas(c);
        return { canvas: c, gl };
      },
      complete() {
        if (env.done) return;
        env.done = true; E.completed.add(E.index);
        $('btn-next').classList.add('ready');
        updateProgress();
        SND.bell(env.bus, 523.25, { gain: 0.03, dur: 4, glass: true });
      },
      hint(text) {
        const el = $('hint');
        if (!text) { el.classList.add('off'); return; }
        el.textContent = text; el.classList.remove('off');
      },
      canvases,
    };
    return env;
  }

  function sizeCanvas(c) {
    const s = parseFloat(c.dataset.scale) || 1;
    c.width = Math.max(1, Math.round(E.w * E.dpr * s));
    c.height = Math.max(1, Math.round(E.h * E.dpr * s));
  }

  /* ---------- stations ---------- */
  E.go = function (i, instant) {
    if (E.busy || i < 0 || i >= E.stages.length || i === E.index) return;
    E.busy = true;
    $('finale').hidden = true;
    const swap = () => {
      if (E.cur) {
        try { E.cur.leave && E.cur.leave(E.env); } catch (e) { console.error(e); }
        E.env.bus.dispose();
        E.env.canvases.forEach(c => c.remove());
      }
      E.index = i; E.cur = E.stages[i];
      E.env = makeEnv(E.cur);
      E.env.bus.fadeIn(3);
      try { E.cur.enter(E.env); } catch (e) { console.error(e); }
      populateHud(E.cur, i);
      if (E.completed.has(i)) { E.env.done = true; $('btn-next').classList.add('ready'); }
    };
    if (instant) { swap(); E.busy = false; veil.open(); return; }
    veil.close(() => { swap(); veil.open(() => { E.busy = false; }); });
    setTimeout(() => { E.busy = false; }, 4000); // safety
  };
  E.next = function () {
    if (E.busy) return;
    if (E.index === E.stages.length - 1) { showFinale(); return; }
    E.go(E.index + 1);
  };
  E.prev = () => E.go(E.index - 1);

  function showFinale() {
    $('finale').hidden = false;
    SND.bell(E.env.bus, 392, { gain: 0.05, dur: 6 });
    SND.bell(E.env.bus, 587.33, { gain: 0.035, dur: 6, delay: 0.6 });
    E.cur.finale && E.cur.finale(E.env);
  }

  /* ---------- HUD ---------- */
  let tcTimer = 0, hintTimer = 0, storyTimer = 0, storyPinned = false;
  function populateHud(s, i) {
    $('sid-num').textContent = `Station ${ROMAN[i]} / X`;
    $('sid-ar').textContent = s.arabic;
    $('tc-num').textContent = `Station ${ROMAN[i]}`;
    $('tc-ar').textContent = s.arabic;
    $('tc-title').textContent = s.title;
    $('tc-era').textContent = s.era;
    $('story-title').textContent = s.title;
    $('story-era').textContent = s.era;
    $('story-body').innerHTML = s.story;
    $('story').style.opacity = 0;
    $('btn-next').classList.remove('ready');
    $('btn-prev').disabled = i === 0;
    $('btn-next').querySelector('.next-label').textContent = i === E.stages.length - 1 ? 'Finish' : 'Continue';
    $('hint').classList.add('off');
    updateProgress();
    const tc = $('titlecard');
    tc.classList.remove('show'); void tc.offsetWidth; tc.classList.add('show');
    clearTimeout(tcTimer); clearTimeout(hintTimer);
    tcTimer = setTimeout(() => { tc.classList.remove('show'); $('story').style.opacity = 1; }, 4200);
    clearTimeout(storyTimer);
    if (!storyPinned) { $('story').classList.remove('collapsed'); $('story-toggle').setAttribute('aria-expanded', 'true'); }
    if (E.h < 640 || E.w < 520) { $('story').classList.add('collapsed'); $('story-toggle').setAttribute('aria-expanded', 'false'); }
    storyTimer = setTimeout(() => { if (!storyPinned) { $('story').classList.add('collapsed'); $('story-toggle').setAttribute('aria-expanded', 'false'); } }, 22000);
    hintTimer = setTimeout(() => { if (E.env && E.env.stage === s) E.env.hint(s.hint); }, 4800);
  }

  function updateProgress() {
    const ol = $('progress');
    if (!ol.children.length) {
      E.stages.forEach((s, k) => {
        const li = document.createElement('li');
        const b = document.createElement('button');
        b.type = 'button'; b.setAttribute('aria-label', `Station ${ROMAN[k]}: ${s.title}`); b.title = `${ROMAN[k]} · ${s.title}`;
        b.addEventListener('click', () => E.go(k));
        li.appendChild(b); ol.appendChild(li);
      });
    }
    [...ol.children].forEach((li, k) => {
      li.className = (k === E.index ? 'now ' : '') + (E.completed.has(k) ? 'done' : '');
      if (k === E.index) li.firstChild.setAttribute('aria-current', 'step'); else li.firstChild.removeAttribute('aria-current');
    });
  }

  /* ---------- the veil: an eight-pointed iris that closes and opens between stations ---------- */
  const veil = (function () {
    const c = $('veil'), ctx = c.getContext('2d');
    let state = 'idle', t0 = 0, cb = null, dur = 1;
    function size() { c.width = E.w * E.dpr; c.height = E.h * E.dpr; }
    size(); addEventListener('resize', size);
    function draw(k) { // k = 1 fully covered, 0 fully open
      ctx.setTransform(E.dpr, 0, 0, E.dpr, 0, 0);
      ctx.clearRect(0, 0, E.w, E.h);
      if (k <= 0.001) return;
      const R = Math.hypot(E.w, E.h) * 0.75;
      const r = (1 - U.ease(k)) * R, rot = k * 1.4;
      ctx.fillStyle = '#060914';
      ctx.fillRect(0, 0, E.w, E.h);
      if (r > 0.5) {
        ctx.globalCompositeOperation = 'destination-out';
        U.star8(ctx, E.w / 2, E.h / 2, r, 0.78, rot); ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
        U.star8(ctx, E.w / 2, E.h / 2, r, 0.78, rot);
        ctx.strokeStyle = `rgba(207,162,80,${0.8 * Math.sin(k * Math.PI)})`; ctx.lineWidth = 1.5; ctx.stroke();
        U.star8(ctx, E.w / 2, E.h / 2, r + 10, 0.78, rot);
        ctx.strokeStyle = `rgba(207,162,80,${0.3 * Math.sin(k * Math.PI)})`; ctx.lineWidth = 1; ctx.stroke();
      }
    }
    function tick(now) {
      if (state === 'idle') return;
      const k = Math.min(1, (now - t0) / (dur * 1000));
      draw(state === 'closing' ? k : 1 - k);
      if (k >= 1) { const s = state; state = 'idle'; if (s === 'closing') draw(1); const f = cb; cb = null; f && f(); return; }
      requestAnimationFrame(tick);
    }
    return {
      close(f) { state = 'closing'; dur = 1.0; t0 = performance.now(); cb = f; if (E.env) SND.swell(E.env.bus, { f0: 200, f1: 900, dur: 1.4, gain: 0.05 }); requestAnimationFrame(tick); },
      open(f) { state = 'opening'; dur = 1.6; t0 = performance.now(); cb = f; requestAnimationFrame(tick); },
    };
  })();

  /* ---------- frame loop ---------- */
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    E.t += dt;
    if (E.cur && E.env) {
      E.env.time += dt;
      try { E.cur.update && E.cur.update(E.env, dt); E.cur.render && E.cur.render(E.env); } catch (e) { console.error(e); }
    }
    E.pointer.vx *= 0.85; E.pointer.vy *= 0.85;
    requestAnimationFrame(frame);
  }

  /* ---------- input ---------- */
  function bindInput() {
    const host = $('host'), p = E.pointer;
    const pos = e => { const nx = e.clientX, ny = e.clientY; p.vx = nx - p.x; p.vy = ny - p.y; p.x = nx; p.y = ny; };
    host.addEventListener('pointerdown', e => {
      SND.init(); pos(e); p.down = true; p.inside = true;
      try { host.setPointerCapture(e.pointerId); } catch (_) {}
      E.cur && E.cur.down && E.cur.down(E.env, p, e);
    });
    host.addEventListener('pointermove', e => { pos(e); p.inside = true; E.cur && E.cur.move && E.cur.move(E.env, p, e); });
    const up = e => { if (!p.down) return; pos(e); p.down = false; E.cur && E.cur.up && E.cur.up(E.env, p, e); };
    host.addEventListener('pointerup', up);
    host.addEventListener('pointercancel', up);
    host.addEventListener('pointerleave', () => { p.inside = false; });
    host.addEventListener('wheel', e => { E.cur && E.cur.wheel && E.cur.wheel(E.env, e.deltaY, e); }, { passive: true });

    addEventListener('keydown', e => {
      if ($('hud').hidden) return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown') E.next();
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp') E.prev();
      else if (e.key === 'm' || e.key === 'M') toggleSound();
      else if (e.key === 'f' || e.key === 'F') toggleFull();
      else if (E.cur && E.cur.key) E.cur.key(E.env, e);
    });

    addEventListener('resize', () => {
      E.w = innerWidth; E.h = innerHeight; E.dpr = Math.min(devicePixelRatio || 1, 2);
      if (E.env) {
        E.env.w = E.w; E.env.h = E.h; E.env.dpr = E.dpr;
        E.env.canvases.forEach(sizeCanvas);
        E.cur.resize && E.cur.resize(E.env);
      }
    });

    document.addEventListener('visibilitychange', () => {
      if (!SND.ctx) return;
      if (document.hidden) SND.ctx.suspend(); else SND.ctx.resume();
    });

    $('btn-next').addEventListener('click', () => { SND.init(); E.next(); });
    $('btn-prev').addEventListener('click', () => E.prev());
    $('btn-sound').addEventListener('click', toggleSound);
    $('btn-full').addEventListener('click', toggleFull);
    $('story-toggle').addEventListener('click', () => {
      const s = $('story'); const c = s.classList.toggle('collapsed'); storyPinned = !c; clearTimeout(storyTimer);
      $('story-toggle').setAttribute('aria-expanded', String(!c));
    });
    $('btn-again').addEventListener('click', () => { E.completed.clear(); $('finale').hidden = true; E.go(0); });
    $('btn-stay').addEventListener('click', () => { $('finale').hidden = true; });
  }

  function toggleSound() {
    SND.init();
    const m = !SND.muted; SND.setMuted(m);
    $('btn-sound').setAttribute('aria-pressed', String(!m));
    $('btn-sound').setAttribute('aria-label', m ? 'Unmute sound' : 'Mute sound');
  }
  function toggleFull() {
    try {
      if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
      else document.exitFullscreen().catch(() => {});
    } catch (e) {}
  }

  E.start = function (startAt) {
    bindInput();
    $('hud').hidden = false;
    // compact the story panel by default on short screens
    if (E.h < 640 || E.w < 520) { $('story').classList.add('collapsed'); $('story-toggle').setAttribute('aria-expanded', 'false'); }
    E.go(startAt || 0, true);
    requestAnimationFrame(t => { last = t; requestAnimationFrame(frame); });
  };

  window.ENGINE = E;
})();
