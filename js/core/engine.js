/* The journey engine: owns the stations, the frame loop, input, transitions and the HUD. */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX'];

  const E = {
    stages: [], index: -1, cur: null, env: null,
    w: innerWidth, h: innerHeight, dpr: Math.min(devicePixelRatio || 1, 2),
    pointer: { x: innerWidth / 2, y: innerHeight / 2, down: false, vx: 0, vy: 0, inside: false },
    completed: new Set(), busy: false, t: 0, tilt: { x: 0, y: 0 },
  };

  E.register = s => E.stages.push(s);

  /* ---------- stations by id, grouped into worlds (see js/data/stations.js) ---------- */
  E.idOf = s => (s ? s.id || (typeof s.key === 'string' ? s.key : '') : '');
  E.byId = id => E.stages.find(s => E.idOf(s) === id);
  E.indexOf = id => E.stages.findIndex(s => E.idOf(s) === id);
  E.meta = i => (window.SIRAH ? SIRAH.stations.find(x => x.id === E.idOf(E.stages[i])) : null);
  E.worldOf = i => { const m = E.meta(i); return m ? m.world : 'madinah'; };
  E.worldIdx = w => E.stages.map((s, i) => i).filter(i => E.worldOf(i) === w);
  E.world = 'makkah';
  try { JSON.parse(localStorage.getItem('sirah.visited') || '[]').forEach(id => E.completed.add(id)); } catch (e) {}
  function saveVisited() { try { localStorage.setItem('sirah.visited', JSON.stringify([...E.completed])); } catch (e) {} }

  /* ---------- environment handed to each station ---------- */
  function makeEnv(stage) {
    const canvases = [];
    const env = {
      stage, w: E.w, h: E.h, dpr: E.dpr, pointer: E.pointer, tilt: E.tilt, time: 0, done: false,
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
      // a bare canvas for a renderer that makes its own context (Three.js)
      canvas3d() {
        const c = document.createElement('canvas');
        c.dataset.scale = 1;
        $('host').appendChild(c);
        canvases.push(c); sizeCanvas(c);
        return c;
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
        env.done = true; E.completed.add(E.idOf(E.cur)); saveVisited();
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
      leaveCurrent();
      if (window.ATLAS && ATLAS.open) ATLAS.hide();
      $('hud').hidden = false;
      E.index = i; E.cur = E.stages[i]; E.world = E.worldOf(i);
      E.env = makeEnv(E.cur);
      E.env.bus.fadeIn(3);
      try { E.cur.enter(E.env); } catch (e) { console.error(e); }
      populateHud(E.cur, i);
      if (E.completed.has(E.idOf(E.cur))) { E.env.done = true; $('btn-next').classList.add('ready'); }
    };
    if (instant) { swap(); E.busy = false; veil.open(); return; }
    veil.close(() => { swap(); veil.open(() => { E.busy = false; }); });
    setTimeout(() => { E.busy = false; }, 4000); // safety
  };
  function leaveCurrent() {
    if (!E.cur) return;
    try { E.cur.leave && E.cur.leave(E.env); } catch (e) { console.error(e); }
    try { if (document.pointerLockElement) document.exitPointerLock(); } catch (e) {}
    if (window.NARRATOR) NARRATOR.stop();
    E.env.bus.dispose();
    E.env.canvases.forEach(c => c.remove());
    E.cur = null; E.env = null; E.index = -1;
  }
  E.next = function () {
    if (E.busy || !E.cur) return;
    const list = E.worldIdx(E.world), k = list.indexOf(E.index);
    if (k === list.length - 1) { showFinale(); return; }
    E.go(list[k + 1]);
  };
  E.prev = function () {
    if (E.busy || !E.cur) return;
    const list = E.worldIdx(E.world), k = list.indexOf(E.index);
    if (k <= 0) { E.showMap(E.world, E.idOf(E.cur)); return; }
    E.go(list[k - 1]);
  };

  /* Leave the current station and open the 3D map of a world. */
  E.showMap = function (world, focus) {
    if (E.busy || !window.ATLAS) return;
    E.busy = true; world = world || E.world; E.world = world;
    $('finale').hidden = true;
    const swap = () => {
      leaveCurrent();
      $('hud').hidden = true;
      ATLAS.show(world, {
        completed: E.completed, focus,
        onEnter: id => { const i = E.indexOf(id); if (i >= 0) ATLAS.dive(id, () => E.go(i)); },
        onSwitch: w => { E.busy = false; E.showMap(w); },
        onHome: () => { if (E.onHome) E.onHome(); },
      });
    };
    if (!E.started) { swap(); E.busy = false; veil.open(); return; }
    veil.close(() => { swap(); veil.open(() => { E.busy = false; }); });
    setTimeout(() => { E.busy = false; }, 4000);
  };

  function showFinale() {
    const mk = E.world === 'makkah';
    $('finale-eyebrow').textContent = mk ? 'The Makkan years are complete' : 'The journey is complete';
    $('finale-ar').textContent = mk ? '\u0625\u0650\u0644\u064e\u0649 \u0627\u0644\u0645\u064e\u062f\u0650\u064a\u0646\u0629' : '\u0627\u0644\u0633\u0651\u064e\u0644\u0627\u0645\u064f \u0639\u064e\u0644\u064e\u064a\u0652\u0643\u064f\u0645';
    $('finale-en').textContent = mk ? 'On to Madinah' : 'Peace be upon you';
    $('finale-sub').textContent = mk
      ? 'Thirteen years of revelation in Makkah end on a night road north. Ahead lie Quba, the welcome of Yathrib, and the founding of a community.'
      : 'From a night road in the desert to a city of light that welcomes millions each year, Madinah has been a place of arrival for fourteen centuries.';
    $('btn-again').querySelector('span:last-child').textContent = mk ? 'Continue to Madinah' : 'Return to the map';
    $('finale').hidden = false;
    SND.bell(E.env.bus, 392, { gain: 0.05, dur: 6 });
    SND.bell(E.env.bus, 587.33, { gain: 0.035, dur: 6, delay: 0.6 });
    E.cur.finale && E.cur.finale(E.env);
  }

  /* ---------- HUD ---------- */
  let tcTimer = 0, hintTimer = 0, storyTimer = 0, storyPinned = false, voiceTimer = 0;
  function populateHud(s, i) {
    const list = E.worldIdx(E.world), n = list.indexOf(i), wname = E.world === 'makkah' ? 'Makkah' : 'Madinah';
    $('sid-num').textContent = `${wname} \u00b7 ${ROMAN[n]} / ${ROMAN[list.length - 1]}`;
    $('sid-ar').textContent = s.arabic;
    $('tc-num').textContent = `${wname} \u00b7 Station ${ROMAN[n]}`;
    $('tc-ar').textContent = s.arabic;
    $('tc-title').textContent = s.title;
    $('tc-era').textContent = s.era;
    $('story-title').textContent = s.title;
    $('story-era').textContent = s.era;
    $('story-body').innerHTML = s.story;
    $('story').style.opacity = 0;
    $('btn-next').classList.remove('ready');
    $('btn-prev').disabled = false;
    $('btn-next').querySelector('.next-label').textContent = n === list.length - 1 ? (E.world === 'makkah' ? 'To Madinah' : 'Finish') : 'Continue';
    $('hint').classList.add('off');
    updateProgress();
    const tc = $('titlecard');
    tc.classList.remove('show'); void tc.offsetWidth; tc.classList.add('show');
    clearTimeout(tcTimer); clearTimeout(hintTimer);
    tcTimer = setTimeout(() => { tc.classList.remove('show'); $('story').style.opacity = 1; }, 4200);
    if (window.NARRATOR) { NARRATOR.stop(); clearTimeout(voiceTimer); voiceTimer = setTimeout(() => { if (E.cur !== s) return; NARRATOR.play(s.id || s.key); if (NARRATOR.lang !== 'off' && !storyPinned) { $('story').classList.add('collapsed'); $('story-toggle').setAttribute('aria-expanded', 'false'); } }, 3600); }
    clearTimeout(storyTimer);
    if (!storyPinned) { $('story').classList.remove('collapsed'); $('story-toggle').setAttribute('aria-expanded', 'true'); }
    if (E.h < 640 || E.w < 520) { $('story').classList.add('collapsed'); $('story-toggle').setAttribute('aria-expanded', 'false'); }
    storyTimer = setTimeout(() => { if (!storyPinned) { $('story').classList.add('collapsed'); $('story-toggle').setAttribute('aria-expanded', 'false'); } }, 22000);
    const coarse = matchMedia('(pointer: coarse)').matches;
    hintTimer = setTimeout(() => { if (E.env && E.env.stage === s) E.env.hint((coarse && s.hintTouch) || s.hint); }, 4800);
  }

  function updateProgress() {
    const ol = $('progress');
      const list = E.worldIdx(E.world);
    if (ol.dataset.world !== E.world) {
      ol.innerHTML = ''; ol.dataset.world = E.world;
      list.forEach((k, n) => {
        const s = E.stages[k];
        const li = document.createElement('li'); li.dataset.k = k;
        const b = document.createElement('button');
        b.type = 'button'; b.setAttribute('aria-label', `Station ${ROMAN[n]}: ${s.title}`); b.title = `${ROMAN[n]} · ${s.title}`;
        b.addEventListener('click', () => E.go(k));
        li.appendChild(b); ol.appendChild(li);
      });
    }
    [...ol.children].forEach(li => {
      const k = +li.dataset.k;
      li.className = (k === E.index ? 'now ' : '') + (E.completed.has(E.idOf(E.stages[k])) ? 'done' : '');
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
    // a gently lagging pointer offset in [-1, 1]: 2D stations use it for depth parallax
    const tx = E.pointer.inside ? (E.pointer.x / E.w - 0.5) * 2 : 0, ty = E.pointer.inside ? (E.pointer.y / E.h - 0.5) * 2 : 0;
    E.tilt.x = U.damp(E.tilt.x, tx, 2.2, dt); E.tilt.y = U.damp(E.tilt.y, ty, 2.2, dt);
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
      if ($('hud').hidden || (window.SOURCES && SOURCES.isOpen)) return;
      const cap = E.cur && E.cur.captureKeys;
      if (cap && /^(Arrow|w$|a$|s$|d$|W$|A$|S$|D$| $|Shift)/.test(e.key)) { e.preventDefault(); E.cur.key && E.cur.key(E.env, e); return; }
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ']') E.next();
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp' || e.key === '[') E.prev();
      else if (e.key === 'm' || e.key === 'M') toggleSound();
      else if (e.key === 'n' || e.key === 'N') cycleVoice();
      else if (e.key === 'f' || e.key === 'F') toggleFull();
      else if (E.cur && E.cur.key) E.cur.key(E.env, e);
    });

    addEventListener('keyup', e => { if (E.cur && E.cur.keyup) E.cur.keyup(E.env, e); });
    addEventListener('blur', () => { if (E.cur && E.cur.blur) E.cur.blur(E.env); });

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
    $('btn-voice').addEventListener('click', cycleVoice);
    showVoice();
    $('btn-full').addEventListener('click', toggleFull);
    $('story-toggle').addEventListener('click', () => {
      const s = $('story'); const c = s.classList.toggle('collapsed'); storyPinned = !c; clearTimeout(storyTimer);
      $('story-toggle').setAttribute('aria-expanded', String(!c));
    });
    $('btn-again').addEventListener('click', () => {
      $('finale').hidden = true;
      if (E.world === 'makkah') E.go(E.worldIdx('madinah')[0]); else E.showMap('madinah');
    });
    $('btn-stay').addEventListener('click', () => { $('finale').hidden = true; });
    $('btn-map').addEventListener('click', () => E.showMap(E.world, E.idOf(E.cur)));
    $('btn-sources').addEventListener('click', () => { if (window.SOURCES && E.cur) SOURCES.open(E.idOf(E.cur), E.cur.title); });
  }

  function showVoice() {
    if (!window.NARRATOR) { $('btn-voice').hidden = true; return; }
    const l = NARRATOR.lang;
    $('voice-label').textContent = l === 'en' ? 'EN' : l === 'ar' ? '\u0639' : '\u2014';
    $('btn-voice').setAttribute('aria-label', `Narration: ${l === 'en' ? 'English' : l === 'ar' ? 'Arabic' : 'off'}`);
    $('btn-voice').classList.toggle('off', l === 'off');
  }
  function cycleVoice() {
    if (!window.NARRATOR) return;
    SND.init();
    NARRATOR.cycle(); showVoice();
    if (NARRATOR.lang === 'off') NARRATOR.stop(); else if (E.cur) NARRATOR.play(E.cur.id || E.cur.key);
  }

  function toggleSound() {
    SND.init();
    const m = !SND.muted; SND.setMuted(m);
    if (m && window.NARRATOR) NARRATOR.stop();
    $('btn-sound').setAttribute('aria-pressed', String(!m));
    $('btn-sound').setAttribute('aria-label', m ? 'Unmute sound' : 'Mute sound');
  }
  function toggleFull() {
    try {
      if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
      else document.exitFullscreen().catch(() => {});
    } catch (e) {}
  }

  /* Start the machinery once: order the stations chronologically, bind input, run the frame loop. */
  E.boot = function () {
    if (E.booted) return; E.booted = true;
    if (window.SIRAH) { const order = SIRAH.stations.map(x => x.id); E.stages.sort((a, b) => order.indexOf(E.idOf(a)) - order.indexOf(E.idOf(b))); }
    bindInput();
    if (window.ATLAS) ATLAS.bind();
    if (E.h < 640 || E.w < 520) { $('story').classList.add('collapsed'); $('story-toggle').setAttribute('aria-expanded', 'false'); }
    requestAnimationFrame(t => { last = t; requestAnimationFrame(frame); });
  };
  E.start = function (startAt) {
    E.boot();
    E.go(startAt || 0, true);
    E.started = true;
  };
  E.openMap = function (world, focus) { E.boot(); E.showMap(world, focus); E.started = true; };

  window.ENGINE = E;
})();
