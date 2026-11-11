/* Station VI — Uhud, the Mountain That Loves Us.
   Layered granite ridges under a sun you carry across the sky. Tap the mountain and it answers:
   a call echoes back from ridge to ridge, each one flaring with light as the sound reaches it. */
(function () {
  'use strict';
  const SKY_TOP = [[0, '#28305e'], [0.22, '#4b7cb6'], [0.5, '#3a78c4'], [0.78, '#4a68a6'], [1, '#2a2350']];
  const SKY_HOR = [[0, '#f2a27c'], [0.22, '#f3d9b4'], [0.5, '#d4e6f2'], [0.78, '#f5c48a'], [1, '#ff7c4a']];
  const LAYERS = [ // far -> near
    { base: 0.5, amp: 0.2, fq: 0.0028, jag: 0.6, seed: 2, col: '#8c5a48' },
    { base: 0.53, amp: 0.26, fq: 0.0034, jag: 0.8, seed: 7, col: '#7a4634' },
    { base: 0.58, amp: 0.24, fq: 0.004, jag: 1, seed: 13, col: '#6c3a2a' },
    { base: 0.64, amp: 0.16, fq: 0.005, jag: 1, seed: 21, col: '#5a2f22' },
    { base: 0.76, amp: 0.035, fq: 0.003, jag: 0.3, seed: 34, col: '#9a7a58' }, // the plain
  ];

  function ridge(L, x, w, h) {
    // a massif that swells in the middle of the frame, like Uhud seen from the south
    const env = Math.pow(Math.sin(U.clamp(x / w) * Math.PI), 0.6) * 0.85 + 0.15;
    const n = U.fbm1(x * L.fq + L.seed * 10, 6);
    const sharp = Math.abs(U.noise1(x * L.fq * 3.1 + L.seed)) * 0.25 * L.jag;
    return h * (L.base - L.amp * env * (0.55 + n * 0.8 + sharp));
  }

  ENGINE.register({
    key: 'uhud',
    arabic: 'أُحُد',
    title: 'The Mountain That Loves Us',
    era: 'Jabal Uhud · 3 AH · 625 CE',
    hint: 'Drag across the sky to move the sun · tap the mountain to call',
    sound: { reverb: 0.6 },
    story: `<p>Uhud rises from the plain north of the city, a red granite massif about seven kilometres long. In 625 the Battle of Uhud was fought at its foot. Seventy companions fell there, among them Hamzah, the Prophet’s uncle; they are buried on the plain below.</p>
            <p class="q"><span class="ar">أُحُدٌ جَبَلٌ يُحِبُّنَا وَنُحِبُّهُ</span>“Uhud is a mountain that loves us, and we love it.” (Sahih al-Bukhari)</p>`,

    enter(env) {
      const { ctx } = env.canvas2d();
      this.ctx = ctx;
      this.sun = 0.18; this.sunTarget = 0.18; this.moved = 0; this.echoes = []; this.calls = 0; this.hadith = 0;
      this.birds = Array.from({ length: 9 }, (_, i) => ({ x: -100 - i * 30 - Math.random() * 40, y: 0.22 + Math.random() * 0.08 + (i % 3) * 0.015, ph: Math.random() * 6 }));
      const b = env.bus;
      this.wind = SND.noise(b, { color: 'pink', type: 'bandpass', freq: 380, q: 0.5, gain: 0.08 });
      SND.lfo(b, this.wind.gain && this.wind.gain.gain, 0.06, 0.05);
      SND.lfo(b, this.wind.filter && this.wind.filter.frequency, 0.09, 140);
      this.gustClock = 3;
    },

    inSky(env, p) { return p.y < ridge(LAYERS[1], p.x, env.w, env.h) - 10; },

    down(env, p) {
      if (this.inSky(env, p)) { this.drag = { x: p.x, s: this.sunTarget }; return; }
      this.call(env, p);
    },
    move(env, p) {
      if (!p.down || !this.drag) return;
      const ns = U.clamp(this.drag.s + (p.x - this.drag.x) / env.w);
      this.moved += Math.abs(ns - this.sunTarget);
      this.sunTarget = ns;
    },
    up() { this.drag = null; },
    wheel(env, dy) { const ns = U.clamp(this.sunTarget + dy * 0.0004); this.moved += Math.abs(ns - this.sunTarget); this.sunTarget = ns; },
    key(env, e) { if (e.key === ' ') this.call(env, { x: env.w / 2, y: env.h * 0.5 }); },

    call(env, p) {
      this.calls++;
      const pan = (p.x / env.w) * 2 - 1;
      const f = U.pick([220, 246.9, 293.7, 329.6]);
      this.echoes.push({ x: p.x, y: p.y, t: 0 });
      SND.glow(env.bus, f, { gain: 0.07, dur: 1.4, pan });
      for (let k = 1; k <= 6; k++) {
        const side = k % 2 ? -pan * 0.8 - 0.2 * Math.sign(pan || 1) : pan * 0.6;
        SND.glow(env.bus, f, { gain: 0.06 * Math.pow(0.58, k), dur: 1.4 + k * 0.15, delay: k * 0.48, pan: side });
      }
      SND.thump(env.bus, { f: 45, gain: 0.12, pan });
    },

    update(env, dt) {
      this.sun = U.damp(this.sun, this.sunTarget, 2, dt);
      for (const e of this.echoes) e.t += dt;
      this.echoes = this.echoes.filter(e => e.t < 4);
      for (const b of this.birds) { b.x += dt * 42; if (b.x > env.w + 60) b.x = -60 - Math.random() * 200; }
      this.gustClock -= dt;
      if (this.gustClock < 0) { this.gustClock = 4 + Math.random() * 6; SND.swell(env.bus, { f0: 200, f1: 900, dur: 3 + Math.random() * 2, gain: 0.07, pan: Math.random() * 2 - 1 }); }
      const want = this.calls >= 1 ? 1 : 0;
      this.hadith = U.damp(this.hadith, want, 0.8, dt);
      if (this.calls >= 2 && this.moved > 0.25) env.complete();
      // night falls when the sun is set; wind cools
      this.wind.set('freq', 300 + (1 - Math.abs(this.sun - 0.5) * 2) * 200, 0.6);
    },

    render(env) {
      const ctx = this.ctx, w = env.w, h = env.h, t = env.time, s = this.sun;
      ctx.setTransform(env.dpr, 0, 0, env.dpr, 0, 0);

      const top = U.ramp(SKY_TOP, s), hor = U.ramp(SKY_HOR, s);
      const g = ctx.createLinearGradient(0, 0, 0, h * 0.62);
      g.addColorStop(0, U.rgb(top)); g.addColorStop(1, U.rgb(hor));
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);

      // sun arc
      const sx = U.lerp(-w * 0.05, w * 1.05, s), sy = h * 0.58 - Math.sin(s * Math.PI) * h * 0.46;
      const warm = 1 - Math.sin(s * Math.PI) * 0.8;
      const sunCol = U.mix([255, 250, 235], [255, 150, 80], warm);
      const sg = ctx.createRadialGradient(sx, sy, 0, sx, sy, h * 0.55);
      sg.addColorStop(0, U.rgb(sunCol, 0.9)); sg.addColorStop(0.035, U.rgb(sunCol, 0.75)); sg.addColorStop(0.2, U.rgb(sunCol, 0.15)); sg.addColorStop(1, U.rgb(sunCol, 0));
      ctx.fillStyle = sg; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = U.rgb(U.mix(sunCol, [255, 255, 255], 0.5));
      ctx.beginPath(); ctx.arc(sx, sy, Math.min(w, h) * 0.022, 0, 6.283); ctx.fill();

      // birds
      ctx.strokeStyle = 'rgba(30,20,30,0.55)'; ctx.lineWidth = 1.2;
      for (const b of this.birds) {
        const by = b.y * h + Math.sin(t * 0.6 + b.ph) * 6, flap = Math.sin(t * 6 + b.ph) * 3;
        ctx.beginPath(); ctx.moveTo(b.x - 6, by - flap); ctx.quadraticCurveTo(b.x - 2, by - 2, b.x, by); ctx.quadraticCurveTo(b.x + 2, by - 2, b.x + 6, by - flap); ctx.stroke();
      }

      const sunDir = [sx - w / 2, sy - h * 0.5];
      const sl = Math.hypot(sunDir[0], sunDir[1]); sunDir[0] /= sl; sunDir[1] /= sl;

      LAYERS.forEach((L, li) => {
        const depth = 1 - li / (LAYERS.length - 1);
        const base = U.hex(L.col);
        const col = U.mix(U.mix(base, top, 0.08), hor, depth * 0.55);
        const pts = [];
        for (let x = -8; x <= w + 8; x += 6) pts.push([x, ridge(L, x, w, h)]);
        ctx.beginPath(); ctx.moveTo(-8, h);
        pts.forEach(([x, y]) => ctx.lineTo(x, y));
        ctx.lineTo(w + 8, h); ctx.closePath();
        const fg = ctx.createLinearGradient(0, h * (L.base - L.amp), 0, h);
        fg.addColorStop(0, U.rgb(col)); fg.addColorStop(1, U.rgb(U.mix(col, [10, 8, 12], 0.5)));
        ctx.fillStyle = fg; ctx.fill();

        // faces turned to the sun catch its light; faces turned away fall into shadow
        if (li < 4) {
          const lits = [];
          for (let i = 0; i < pts.length - 1; i++) {
            const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
            const nx = -(y1 - y0), ny = x1 - x0, nl = Math.hypot(nx, ny);
            lits.push(-(nx * sunDir[0] + ny * sunDir[1]) / nl);
          }
          // one seamless band of light and shadow along the ridge, coloured by a horizontal gradient
          const dep = 50 + li * 24, span = w + 16;
          const grad = ctx.createLinearGradient(-8, 0, w + 8, 0);
          for (let i = 0; i < lits.length; i += 2) {
            let lit = 0, n = 0;
            for (let k = -3; k <= 3; k++) { const v = lits[i + k]; if (v != null) { lit += v; n++; } }
            lit /= n;
            const a = (lit > 0 ? lit * 0.3 : -lit * 0.26) * 0.9;
            grad.addColorStop(U.clamp((pts[i][0] + 8) / span), lit > 0 ? U.rgb(sunCol, a * (1 - depth * 0.5)) : `rgba(20,10,30,${a})`);
          }
          ctx.fillStyle = grad;
          ctx.beginPath();
          pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
          for (let i = pts.length - 1; i >= 0; i--) ctx.lineTo(pts[i][0], pts[i][1] + dep);
          ctx.closePath(); ctx.fill();
        }

        // the echo reaches this ridge
        for (const e of this.echoes) {
          const k = e.t - (LAYERS.length - 1 - li) * 0.24 - 0.1;
          const f = k > 0 ? Math.exp(-k * 2.2) * Math.min(1, k * 10) : 0;
          if (f > 0.01) {
            ctx.save(); ctx.globalCompositeOperation = 'lighter';
            ctx.strokeStyle = `rgba(255,214,150,${0.7 * f})`; ctx.lineWidth = 2;
            ctx.shadowColor = 'rgba(255,200,120,0.9)'; ctx.shadowBlur = 14;
            ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke();
            ctx.restore();
          }
        }
        // haze
        ctx.fillStyle = U.rgb(hor, 0.08 * depth); ctx.fillRect(0, 0, w, h);
      });

      // Jabal ar-Rumat, the archers' hill, rising from the plain
      const hx = w * 0.3, hy = ridge(LAYERS[4], hx, w, h);
      ctx.fillStyle = U.rgb(U.mix([120, 86, 60], hor, 0.12));
      ctx.beginPath(); ctx.moveTo(hx - w * 0.09, hy + 4);
      ctx.bezierCurveTo(hx - w * 0.05, hy - h * 0.05, hx + w * 0.03, hy - h * 0.06, hx + w * 0.08, hy + 4); ctx.fill();
      const hg = ctx.createLinearGradient(hx - w * 0.09, 0, hx + w * 0.08, 0);
      const toSun = sx < hx ? 1 : 0;
      hg.addColorStop(toSun ? 0 : 1, U.rgb(sunCol, 0.22)); hg.addColorStop(toSun ? 1 : 0, 'rgba(20,10,20,0.18)');
      ctx.fillStyle = hg; ctx.beginPath(); ctx.moveTo(hx - w * 0.09, hy + 4);
      ctx.bezierCurveTo(hx - w * 0.05, hy - h * 0.05, hx + w * 0.03, hy - h * 0.06, hx + w * 0.08, hy + 4); ctx.fill();
      this.label(ctx, hx, hy - h * 0.055, 'JABAL AR-RUMAT', 'the archers’ hill', w);

      // the low wall of the martyrs' resting place
      const mx = w * 0.62, my = ridge(LAYERS[4], mx, w, h) + h * 0.06;
      ctx.fillStyle = U.rgb(U.mix([200, 180, 150], hor, 0.2), 0.85);
      ctx.fillRect(mx - w * 0.08, my - 5, w * 0.16, 5);
      ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(mx - w * 0.08, my, w * 0.16, 3);
      this.label(ctx, mx, my - 8, 'THE MARTYRS OF UHUD', 'Hamzah and his companions rest here', w);

      // peak label
      const px = w * 0.5, py = Math.min(...Array.from({ length: 30 }, (_, i) => ridge(LAYERS[1], w * 0.35 + i * w * 0.01, w, h)));
      this.label(ctx, px, py - 10, 'JABAL UHUD', '1,077 m', w);

      // ground warmth / night grade
      const night = Math.max(0, Math.abs(s - 0.5) * 2 - 0.75) * 2.2;
      if (night > 0) { ctx.fillStyle = `rgba(10,8,30,${night * 0.35})`; ctx.fillRect(0, 0, w, h); }

      this.drawHadith(ctx, w, h);
    },

    label(ctx, x, y, a, b, w) {
      if (w < 640) return;
      ctx.save(); ctx.textAlign = 'center';
      ctx.strokeStyle = 'rgba(255,245,225,0.45)'; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - 26); ctx.stroke();
      ctx.font = '10px Marcellus, Georgia, serif'; ctx.fillStyle = 'rgba(255,248,235,0.9)'; ctx.fillText(a, x, y - 42);
      ctx.font = 'italic 300 12px Spectral, Georgia, serif'; ctx.fillStyle = 'rgba(255,248,235,0.72)'; ctx.fillText(b, x, y - 30);
      ctx.restore();
    },

    drawHadith(ctx, w, h) {
      const a = this.hadith; if (a < 0.02) return;
      ctx.save(); ctx.textAlign = 'center'; ctx.globalAlpha = a;
      const fs = Math.round(Math.min(44, w * 0.06));
      ctx.fillStyle = '#fffaf0'; ctx.shadowColor = 'rgba(80,30,10,0.6)'; ctx.shadowBlur = 20;
      ctx.font = `${fs}px Amiri, serif`; ctx.direction = 'rtl';
      ctx.fillText('أُحُدٌ جَبَلٌ يُحِبُّنَا وَنُحِبُّهُ', w / 2, h * 0.17 + 16);
      ctx.direction = 'ltr';
      ctx.font = `italic 300 ${Math.round(fs * 0.42)}px Spectral, Georgia, serif`;
      ctx.fillText('“Uhud is a mountain that loves us, and we love it.”', w / 2, h * 0.17 + 16 + fs * 0.9);
      ctx.restore();
    },
  });
})();
