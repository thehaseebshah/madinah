/* Station III — The Full Moon Rises.
   Drag the moon up out of the hills of Thaniyyat al-Wada'. As it climbs, lamps are lit across the
   rooftops of Yathrib, lanterns drift upward, and the song of welcome is written into the sky. */
(function () {
  'use strict';
  const VERSES = [
    ['طَلَعَ الْبَدْرُ عَلَيْنَا', 'The full moon has risen over us'],
    ['مِنْ ثَنِيَّاتِ الْوَدَاعْ', 'from the hills of al-Wada‘'],
    ['وَجَبَ الشُّكْرُ عَلَيْنَا', 'Gratitude is owed by us'],
    ['مَا دَعَا لِلهِ دَاعْ', 'for as long as anyone calls to God'],
  ];

  ENGINE.register({
    key: 'badr',
    id: 'badr',
    arabic: 'طَلَعَ البَدْر',
    title: 'The Full Moon Rises',
    era: 'Arrival in Yathrib, 1 AH',
    hint: 'Drag upward to raise the moon',
    sound: { reverb: 0.55 },
    story: `<p>The people of Yathrib had waited on the lava fields every morning, watching the southern road. When the Prophet ﷺ finally arrived, the city came out to meet him. Tradition remembers the welcome in a song still sung today.</p>
            <p>From that day the oasis took a new name: <i>Madinat an-Nabi</i>, the City of the Prophet, and later <i>al-Madinah al-Munawwarah</i>, the Illuminated City.</p>`,

    enter(env) {
      const { ctx } = env.canvas2d();
      this.ctx = ctx;
      this.m = 0; this.mTarget = 0; this.lanterns = []; this.verse = -1; this.verseT = [0, 0, 0, 0];
      this.build(env);
      this.moonTex = this.makeMoon();
      const b = env.bus;
      this.night = SND.noise(b, { color: 'brown', type: 'lowpass', freq: 380, gain: 0.08 });
      this.crowd = SND.noise(b, { color: 'pink', type: 'bandpass', freq: 520, q: 1.4, gain: 0.0 });
      this.crowd2 = SND.noise(b, { color: 'pink', type: 'bandpass', freq: 900, q: 2, gain: 0.0, pan: 0.3 });
      SND.lfo(b, this.crowd.filter && this.crowd.filter.frequency, 0.3, 90);
      SND.lfo(b, this.crowd2.filter && this.crowd2.filter.frequency, 0.47, 140);
      this.cricketClock = 0;
    },
    resize(env) { this.build(env); },

    build(env) {
      const w = env.w, h = env.h, r = U.seeded(3);
      this.horizon = h * 0.74;
      this.rows = [0, 1, 2].map(row => {
        const houses = [], base = this.horizon + row * h * 0.07 + h * 0.02;
        let x = -110;
        while (x < w + 110) {
          const hw = (40 + r() * 70) * (1 + row * 0.35), hh = (26 + r() * 46) * (1 + row * 0.3);
          const windows = [];
          const nwin = Math.floor(r() * 3);
          for (let i = 0; i < nwin; i++) windows.push({ x: x + 8 + r() * (hw - 20), y: base - hh + 10 + r() * (hh - 24), at: 0.08 + r() * 0.85, lit: 0, s: 3 + row * 1.5 });
          houses.push({ x, w: hw, h: hh, base, parapet: r() < 0.6, windows, step: r() < 0.3 ? r() * 0.5 : 0 });
          x += hw + r() * 6;
        }
        const palms = Array.from({ length: 4 + row * 2 }, () => ({ x: r() * w, h: (90 + r() * 90) * (1 + row * 0.4), lean: (r() - 0.5) * 0.3, ph: r() * 6 }));
        return { houses, base, palms, row };
      });
    },

    makeMoon() {
      const c = document.createElement('canvas'), S = 256; c.width = c.height = S;
      const g = c.getContext('2d');
      const grad = g.createRadialGradient(S * 0.45, S * 0.42, 0, S / 2, S / 2, S / 2);
      grad.addColorStop(0, '#fffaf0'); grad.addColorStop(0.85, '#f1e6cc'); grad.addColorStop(1, '#d6c6a4');
      g.fillStyle = grad; g.beginPath(); g.arc(S / 2, S / 2, S / 2, 0, 6.283); g.fill();
      g.save(); g.beginPath(); g.arc(S / 2, S / 2, S / 2, 0, 6.283); g.clip();
      const r = U.seeded(14);
      // maria: the dark "seas" of the moon
      for (let i = 0; i < 14; i++) {
        const x = S * (0.25 + r() * 0.5), y = S * (0.2 + r() * 0.55), rr = S * (0.05 + r() * 0.13);
        const mg = g.createRadialGradient(x, y, 0, x, y, rr);
        mg.addColorStop(0, 'rgba(140,128,112,0.35)'); mg.addColorStop(1, 'rgba(140,128,112,0)');
        g.fillStyle = mg; g.beginPath(); g.arc(x, y, rr, 0, 6.283); g.fill();
      }
      for (let i = 0; i < 60; i++) {
        const x = r() * S, y = r() * S, rr = 1 + r() * 4;
        g.strokeStyle = 'rgba(120,110,95,0.18)'; g.beginPath(); g.arc(x, y, rr, 0, 6.283); g.stroke();
      }
      g.restore();
      return c;
    },

    down(env, p) { this.drag = { y: p.y, m: this.mTarget }; },
    move(env, p) {
      if (!p.down || !this.drag) return;
      this.mTarget = U.clamp(this.drag.m + (this.drag.y - p.y) / (env.h * 0.55));
    },
    up() { this.drag = null; },
    wheel(env, dy) { this.mTarget = U.clamp(this.mTarget - dy * 0.0006); },
    key(env, e) { if (e.key === 'ArrowUp') this.mTarget = U.clamp(this.mTarget + 0.06); if (e.key === 'ArrowDown') this.mTarget = U.clamp(this.mTarget - 0.06); },

    update(env, dt) {
      this.m = U.damp(this.m, this.mTarget, 2.2, dt);
      const m = this.m;
      // windows light as the moon climbs
      for (const row of this.rows) for (const hs of row.houses) for (const wd of hs.windows) {
        if (m > wd.at && wd.lit === 0) {
          wd.lit = 0.01;
          SND.bell(env.bus, U.pick([784, 880, 1046.5, 1174.7, 1318.5, 1568]), { gain: 0.012, dur: 2.2, glass: true, pan: (wd.x / env.w) * 2 - 1 });
        }
        if (wd.lit > 0) wd.lit = Math.min(1, wd.lit + dt * 1.5);
        if (m < wd.at - 0.05) wd.lit = 0;
      }
      // lanterns rise from the rooftops
      if (m > 0.2 && Math.random() < dt * m * 5 && this.lanterns.length < 140) {
        const row = this.rows[Math.floor(Math.random() * 3)], hs = U.pick(row.houses);
        this.lanterns.push({ x: hs.x + Math.random() * hs.w, y: hs.base - hs.h, vy: -(14 + Math.random() * 18) * (1 + row.row * 0.3), ph: Math.random() * 6, s: 2 + row.row * 1.4 + Math.random(), life: 0 });
      }
      for (const l of this.lanterns) { l.life += dt; l.y += l.vy * dt; l.x += Math.sin(l.life * 0.8 + l.ph) * 8 * dt + 4 * dt; }
      this.lanterns = this.lanterns.filter(l => l.y > -30);

      // the song
      const v = Math.min(3, Math.floor((m - 0.12) / 0.2));
      if (v > this.verse) {
        for (let k = this.verse + 1; k <= v; k++) {
          SND.glow(env.bus, [146.8, 164.8, 196, 220][k], { gain: 0.035, dur: 6 });
          SND.bell(env.bus, [587.3, 659.3, 784, 880][k], { gain: 0.02, dur: 4, delay: 0.3 });
        }
        this.verse = v;
      }
      for (let k = 0; k < 4; k++) this.verseT[k] = U.damp(this.verseT[k], k <= this.verse ? 1 : 0, 0.9, dt);
      if (m > 0.93) env.complete();

      this.crowd.set('gain', 0.06 * U.smooth(0.1, 0.9, m), 0.5);
      this.crowd2.set('gain', 0.03 * U.smooth(0.3, 1, m), 0.5);
      this.cricketClock -= dt;
      if (this.cricketClock < 0) { this.cricketClock = 0.3 + Math.random() * 1.2; SND.cricket(env.bus, { gain: 0.006 * (1 - m * 0.5) }); }
    },

    render(env) {
      const ctx = this.ctx, w = env.w, h = env.h, t = env.time, m = this.m;
      ctx.setTransform(env.dpr, 0, 0, env.dpr, 0, 0);

      const sky = ctx.createLinearGradient(0, 0, 0, this.horizon);
      sky.addColorStop(0, U.rgb(U.mix([5, 8, 22], [10, 18, 48], m)));
      sky.addColorStop(0.7, U.rgb(U.mix([14, 20, 48], [30, 46, 92], m)));
      sky.addColorStop(1, U.rgb(U.mix([40, 34, 58], [62, 70, 110], m)));
      ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);

      // faint stars, drowned as the moon brightens
      const r = U.seeded(9);
      for (let i = 0; i < 260; i++) {
        const x = r() * w, y = r() * this.horizon, s = r() * 1.3 + 0.2;
        ctx.fillStyle = `rgba(240,235,220,${(0.25 + 0.55 * (0.5 + 0.5 * Math.sin(t * (0.5 + r() * 2) + i))) * (1 - m * 0.7)})`;
        ctx.fillRect(x, y, s, s);
      }

      // the moon
      const R = Math.min(w, h) * U.lerp(0.11, 0.075, m);
      const mx = w * 0.64, my = U.lerp(this.horizon + R * 0.6, h * 0.2, U.easeOut(m));
      const tint = U.mix([255, 170, 90], [255, 248, 230], U.smooth(0, 0.6, m));
      const halo = ctx.createRadialGradient(mx, my, R * 0.8, mx, my, R * 7);
      halo.addColorStop(0, U.rgb(tint, 0.35)); halo.addColorStop(0.3, U.rgb(tint, 0.08)); halo.addColorStop(1, U.rgb(tint, 0));
      ctx.fillStyle = halo; ctx.fillRect(0, 0, w, h);
      ctx.save();
      ctx.drawImage(this.moonTex, mx - R, my - R, R * 2, R * 2);
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = U.rgb(tint); ctx.beginPath(); ctx.arc(mx, my, R, 0, 6.283); ctx.fill();
      ctx.restore();

      // thin drifting cloud bands
      for (let i = 0; i < 3; i++) {
        const cy = h * (0.25 + i * 0.12), cx = ((t * (6 + i * 3) + i * 400) % (w + 600)) - 300;
        const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, 260);
        cg.addColorStop(0, `rgba(180,190,220,${0.05 + 0.05 * m})`); cg.addColorStop(1, 'rgba(180,190,220,0)');
        ctx.save(); ctx.translate(cx, cy); ctx.scale(2.6, 0.3); ctx.translate(-cx, -cy);
        ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(cx, cy, 260, 0, 6.283); ctx.fill(); ctx.restore();
      }

      // the hills of farewell
      ctx.fillStyle = U.rgb(U.mix([14, 14, 30], [26, 30, 58], m));
      ctx.beginPath(); ctx.moveTo(0, this.horizon + 10);
      for (let x = 0; x <= w; x += 8) ctx.lineTo(x, this.horizon - 10 - Math.max(0, U.fbm1(x * 0.003 + 11)) * h * 0.18 - h * 0.02);
      ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.fill();

      // lanterns behind the nearest row
      this.drawLanterns(ctx, t, 0);
      this.rows.forEach((row, ri) => { ctx.save(); ctx.translate(-env.tilt.x * (12 + ri * 26), -env.tilt.y * (3 + ri * 7)); this.drawRow(ctx, env, row, ri, m, t, mx); ctx.restore(); });
      this.drawLanterns(ctx, t, 1);

      this.drawSong(ctx, w, h);
    },

    drawRow(ctx, env, row, ri, m, t, mx) {
      const h = env.h;
      const shade = U.mix([10 + ri * 2, 10 + ri * 2, 20 + ri * 3], [32 - ri * 7, 34 - ri * 7, 56 - ri * 10], m);
      // palms
      for (const p of row.palms) {
        const sway = Math.sin(t * 0.7 + p.ph) * 0.03;
        const tx = p.x + Math.sin(p.lean + sway) * p.h, ty = row.base - p.h;
        ctx.strokeStyle = U.rgb(U.mix(shade, [0, 0, 0], 0.2)); ctx.lineWidth = 2 + ri * 1.5;
        ctx.beginPath(); ctx.moveTo(p.x, row.base); ctx.quadraticCurveTo(p.x, row.base - p.h * 0.5, tx, ty); ctx.stroke();
        ctx.lineWidth = 1.4 + ri * 0.6;
        for (let k = 0; k < 11; k++) {
          const a = -Math.PI / 2 + (k - 5) * 0.36 + Math.sin(t + k + p.ph) * 0.04;
          const L = p.h * 0.3;
          ctx.beginPath(); ctx.moveTo(tx, ty);
          ctx.quadraticCurveTo(tx + Math.cos(a) * L * 0.6, ty + Math.sin(a) * L * 0.6 - 8, tx + Math.cos(a) * L, ty + Math.sin(a) * L + L * 0.45);
          ctx.stroke();
        }
      }
      // houses with a moonlit edge
      for (const hs of row.houses) {
        ctx.fillStyle = U.rgb(shade);
        ctx.fillRect(hs.x, hs.base - hs.h, hs.w, hs.h + h);
        if (hs.step) ctx.fillRect(hs.x + hs.w * 0.2, hs.base - hs.h - hs.h * hs.step * 0.4, hs.w * 0.45, hs.h * hs.step * 0.4 + 2);
        if (hs.parapet) for (let x = hs.x + 2; x < hs.x + hs.w - 4; x += 9) ctx.fillRect(x, hs.base - hs.h - 4, 5, 4);
        const lit = m * (hs.x + hs.w / 2 < mx ? 0.35 : 0.6);
        ctx.fillStyle = `rgba(210,210,255,${0.05 + lit * 0.18})`;
        ctx.fillRect(hs.x, hs.base - hs.h, hs.w, 1.2);
        ctx.fillStyle = `rgba(0,0,0,${0.25 + ri * 0.05})`;
        ctx.fillRect(hs.x + hs.w - 3, hs.base - hs.h, 3, hs.h);
        for (const wd of hs.windows) {
          if (wd.lit <= 0) { ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(wd.x, wd.y, wd.s, wd.s * 1.4); continue; }
          const f = wd.lit * (0.85 + 0.15 * U.noise1(t * 4 + wd.x));
          const g = ctx.createRadialGradient(wd.x + wd.s / 2, wd.y + wd.s * 0.7, 0, wd.x + wd.s / 2, wd.y + wd.s * 0.7, wd.s * 7);
          g.addColorStop(0, `rgba(255,190,100,${0.35 * f})`); g.addColorStop(1, 'rgba(255,190,100,0)');
          ctx.fillStyle = g; ctx.fillRect(wd.x - wd.s * 7, wd.y - wd.s * 7, wd.s * 15, wd.s * 15);
          ctx.fillStyle = `rgba(255,215,140,${f})`; ctx.fillRect(wd.x, wd.y, wd.s, wd.s * 1.4);
        }
      }
    },

    drawLanterns(ctx, t, front) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (const l of this.lanterns) {
        if ((l.s > 3.6) !== !!front) continue;
        const fade = Math.min(1, l.life * 0.8) * U.clamp(l.y / 200);
        const fl = 0.8 + 0.2 * Math.sin(t * 9 + l.ph * 3);
        const g = ctx.createRadialGradient(l.x, l.y, 0, l.x, l.y, l.s * 6);
        g.addColorStop(0, `rgba(255,200,120,${0.5 * fade * fl})`); g.addColorStop(1, 'rgba(255,160,80,0)');
        ctx.fillStyle = g; ctx.fillRect(l.x - l.s * 6, l.y - l.s * 6, l.s * 12, l.s * 12);
        ctx.fillStyle = `rgba(255,236,190,${fade})`;
        ctx.fillRect(l.x - l.s * 0.4, l.y - l.s * 0.6, l.s * 0.8, l.s * 1.2);
      }
      ctx.restore();
    },

    drawSong(ctx, w, h) {
      if (document.getElementById('titlecard').classList.contains('show')) return;
      const narrow = w < 720;
      const x = narrow ? w / 2 : w * 0.27, y0 = narrow ? h * 0.2 : h * 0.24;
      const fs = Math.round(Math.min(46, w * (narrow ? 0.075 : 0.034)));
      ctx.save(); ctx.textAlign = 'center';
      VERSES.forEach(([ar, en], k) => {
        const a = this.verseT[k]; if (a < 0.01) return;
        const y = y0 + k * fs * 1.95;
        ctx.globalAlpha = a;
        ctx.font = `${fs}px Amiri, "Geeza Pro", serif`;
        ctx.shadowColor = 'rgba(255,210,140,0.8)'; ctx.shadowBlur = 18 * a;
        ctx.fillStyle = '#fff1d0';
        ctx.direction = 'rtl'; ctx.fillText(ar, x, y + (1 - a) * 10);
        ctx.direction = 'ltr'; ctx.shadowBlur = 0;
        ctx.globalAlpha = a * 0.7;
        ctx.font = `italic 300 ${Math.round(fs * 0.36)}px Spectral, Georgia, serif`;
        ctx.fillStyle = '#e9dcc0';
        ctx.fillText(en, x, y + fs * 0.62);
      });
      ctx.restore();
    },
  });
})();
