/* Station I — The Night Road.
   Side-scrolling desert under a living sky. Holding the pointer walks the road from the
   Cave of Thawr toward Yathrib; night turns to dawn as the distance closes. */
(function () {
  'use strict';
  const TOTAL_KM = 450;
  const WAYPOINTS = [
    [0.02, 'The Cave of Thawr', 'three nights hidden in the mountain south of Makkah'],
    [0.2, 'The coastal road', 'an unused route toward the Red Sea, led by the guide Abdullah ibn Urayqit'],
    [0.42, 'Qudayd', 'the tent of Umm Ma‘bad, where a dry ewe gave milk'],
    [0.62, 'The pursuer', 'Suraqah’s horse sank into the sand, and he turned back'],
    [0.84, 'The heights of al-‘Usbah', 'the palms of the oasis rise on the horizon'],
    [0.99, 'Quba', 'Yathrib is near'],
  ];
  const SKY = {
    zen: [[0, '#04060f'], [0.55, '#0b1030'], [0.78, '#2b2a5c'], [1, '#4a5a96']],
    mid: [[0, '#0a0f26'], [0.55, '#1c1e4a'], [0.78, '#6c4a7a'], [1, '#e2a37c']],
    hor: [[0, '#151a3a'], [0.5, '#2c2850'], [0.78, '#d0796a'], [1, '#ffd9a0']],
  };
  const DUNES = [ // far → near: parallax, base height, amplitude, frequency, night colour, dawn colour
    { p: 0.06, base: 0.62, amp: 0.05, fq: 0.0016, night: '#141a35', dawn: '#9a6a78' },
    { p: 0.14, base: 0.66, amp: 0.07, fq: 0.0022, night: '#11152c', dawn: '#a8705e' },
    { p: 0.3, base: 0.71, amp: 0.08, fq: 0.003, night: '#0d1022', dawn: '#b4744f' },
    { p: 0.58, base: 0.77, amp: 0.09, fq: 0.0036, night: '#090b18', dawn: '#9c5d3b' },
    { p: 1.0, base: 0.85, amp: 0.07, fq: 0.0044, night: '#05060e', dawn: '#5a301f' },
  ];

  function duneY(layer, x, h) {
    const n = U.noise1(x * layer.fq) * 0.6 + U.noise1(x * layer.fq * 2.3 + 40) * 0.3;
    const ridge = 1 - Math.abs(U.noise1(x * layer.fq * 0.7 + 9));
    return h * (layer.base - layer.amp * (n * 0.6 + ridge * ridge * 0.9));
  }

  ENGINE.register({
    key: 'hijrah',
    arabic: 'الهجرة',
    title: 'The Night Road',
    era: '622 CE · the year 1 of the Hijrah',
    hint: 'Press and hold to walk · tap the sky',
    sound: { reverb: 0.45 },
    story: `<p>In the year 622, the Prophet Muhammad ﷺ and his companion Abu Bakr left Makkah by night. They hid three nights in the Cave of Thawr, then took a little-used road toward the sea and north to Yathrib, a journey of some 450 kilometres.</p>
            <p>The Hijrah, the migration, became the first year of the Islamic calendar. Every date in it still counts from this road.</p>`,

    enter(env) {
      const { ctx } = env.canvas2d();
      const r = U.seeded(622);
      this.ctx = ctx;
      this.dist = 0; this.speed = 0; this.cam = 0;
      this.steps = []; this.stepClock = 0; this.foot = 0;
      this.shooting = []; this.wp = -1; this.wpAlpha = 0; this.wpText = null;
      this.stars = Array.from({ length: 900 }, () => {
        const band = r() < 0.55; // concentrate half the stars along the Milky Way band
        let x = r(), y = r() * 0.75;
        if (band) { const t = r(); x = t; y = 0.05 + t * 0.55 + (r() - 0.5) * 0.18 * (r() + 0.3); }
        return { x, y, m: Math.pow(r(), 3) * 1.6 + 0.25, tw: r() * 6.28, s: 0.5 + r() * 2, hue: r() };
      });
      this.galaxy = this.makeGalaxy(env);

      const b = env.bus;
      this.wind = SND.noise(b, { color: 'pink', type: 'bandpass', freq: 420, q: 0.6, gain: 0.12 });
      this.windHi = SND.noise(b, { color: 'white', type: 'highpass', freq: 3500, q: 0.4, gain: 0.006, pan: 0.4 });
      SND.lfo(b, this.wind.filter && this.wind.filter.frequency, 0.07, 160);
      SND.lfo(b, this.wind.gain && this.wind.gain.gain, 0.11, 0.05);
    },

    makeGalaxy(env) {
      const c = document.createElement('canvas');
      c.width = 512; c.height = 512;
      const g = c.getContext('2d'), r = U.seeded(7);
      for (let i = 0; i < 2600; i++) {
        const t = r(), off = (r() - 0.5) * (r() * 0.35);
        const x = t * 512, y = (0.05 + t * 0.55 + off) * 512 / 0.75;
        const a = 0.025 + r() * 0.05;
        g.fillStyle = `rgba(${200 + r() * 55 | 0},${190 + r() * 40 | 0},${220 + r() * 35 | 0},${a})`;
        g.beginPath(); g.arc(x, y, 3 + r() * 14, 0, 6.283); g.fill();
      }
      return c;
    },

    down(env, p) {
      this.holding = true;
      if (p.y < env.h * 0.5) {
        this.shooting.push({ x: p.x, y: p.y, vx: -(220 + Math.random() * 260), vy: 90 + Math.random() * 90, life: 1 });
        SND.swell(env.bus, { f0: 3000, f1: 6000, dur: 0.9, gain: 0.03, type: 'highpass', color: 'white', pan: (p.x / env.w) * 2 - 1 });
        SND.bell(env.bus, 1568 + Math.random() * 400, { gain: 0.012, dur: 2.5, glass: true, pan: (p.x / env.w) * 2 - 1 });
      }
    },
    up() { this.holding = false; },
    key(env, e) { if (e.key === ' ') { this.holding = !this.holding; e.preventDefault(); } },

    update(env, dt) {
      const target = this.holding ? 1 : 0;
      this.speed = U.damp(this.speed, target, this.holding ? 1.6 : 2.5, dt);
      const before = this.dist;
      this.dist = Math.min(1, this.dist + this.speed * dt / 28); // ~28 s of walking
      this.cam += this.speed * dt * 140 + dt * 4;
      if (this.dist >= 1 && before < 1) env.complete();

      // footsteps in the sand, left behind on the near dune
      if (this.speed > 0.15) {
        this.stepClock += dt * (1.2 + this.speed * 1.2);
        if (this.stepClock > 1) {
          this.stepClock = 0; this.foot ^= 1;
          const wx = this.cam + env.w * 0.36;
          this.steps.push({ x: wx + (this.foot ? 3 : -3), side: this.foot, age: 0 });
          SND.step(env.bus, { gain: 0.12 + this.speed * 0.12, pan: -0.25 + (this.foot ? 0.08 : -0.08) });
          if (Math.random() < 0.06) SND.bell(env.bus, 2100 + Math.random() * 300, { gain: 0.006, dur: 1.4, pan: -0.3, metal: true });
        }
      }
      for (const s of this.steps) s.age += dt;
      this.steps = this.steps.filter(s => s.age < 30 && s.x > this.cam - 40);

      for (const s of this.shooting) { s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt * 0.9; }
      this.shooting = this.shooting.filter(s => s.life > 0);
      if (Math.random() < dt * 0.04) this.shooting.push({ x: Math.random() * env.w, y: Math.random() * env.h * 0.3, vx: -300, vy: 120, life: 0.8 });

      // wind rises with the walk
      this.wind.set('gain', 0.1 + this.speed * 0.12, 0.5);
      this.wind.set('freq', 380 + this.speed * 260, 0.8);
      this.windHi.set('gain', 0.004 + this.speed * 0.01, 0.6);

      // dawn chorus
      if (this.dist > 0.8 && Math.random() < dt * (this.dist - 0.75) * 2.2) SND.chirp(env.bus, { gain: 0.02 });

      // waypoints
      let idx = -1;
      for (let i = 0; i < WAYPOINTS.length; i++) if (this.dist >= WAYPOINTS[i][0]) idx = i;
      if (idx !== this.wp) { this.wp = idx; this.wpAlpha = 0; this.wpText = WAYPOINTS[idx]; if (idx > 0) SND.glow(env.bus, 196, { gain: 0.02, dur: 5 }); }
      this.wpAlpha = Math.min(1, this.wpAlpha + dt * 0.6);
    },

    render(env) {
      const ctx = this.ctx, w = env.w, h = env.h, t = env.time, d = this.dist;
      const dawn = U.smooth(0.25, 1, d);
      ctx.setTransform(env.dpr, 0, 0, env.dpr, 0, 0);

      // sky
      const g = ctx.createLinearGradient(0, 0, 0, h * 0.85);
      g.addColorStop(0, U.rgb(U.ramp(SKY.zen, dawn)));
      g.addColorStop(0.55, U.rgb(U.ramp(SKY.mid, dawn)));
      g.addColorStop(1, U.rgb(U.ramp(SKY.hor, dawn)));
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);

      // sun glow building below the horizon
      if (dawn > 0.4) {
        const sx = w * 0.78, sy = h * 0.66 + (1 - dawn) * h * 0.2;
        const rg = ctx.createRadialGradient(sx, sy, 0, sx, sy, h * 0.7);
        rg.addColorStop(0, `rgba(255,214,150,${0.55 * (dawn - 0.4)})`);
        rg.addColorStop(1, 'rgba(255,214,150,0)');
        ctx.fillStyle = rg; ctx.fillRect(0, 0, w, h);
      }

      // milky way and stars
      const starA = 1 - U.smooth(0.55, 0.95, d);
      if (starA > 0.01) {
        const off = (this.cam * 0.015) % w;
        ctx.globalAlpha = 0.9 * starA;
        ctx.globalCompositeOperation = 'lighter';
        ctx.drawImage(this.galaxy, -off, 0, w * 1.05, h * 0.78);
        ctx.drawImage(this.galaxy, w - off, 0, w * 1.05, h * 0.78);
        for (const s of this.stars) {
          let x = (s.x * w - this.cam * 0.015) % w; if (x < 0) x += w;
          const tw = 0.55 + 0.45 * Math.sin(t * s.s + s.tw);
          ctx.globalAlpha = starA * tw * Math.min(1, s.m);
          ctx.fillStyle = s.hue < 0.15 ? '#ffd9b0' : s.hue > 0.9 ? '#cfe0ff' : '#f6efe0';
          ctx.fillRect(x, s.y * h, s.m, s.m);
        }
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
      }
      for (const s of this.shooting) {
        const lg = ctx.createLinearGradient(s.x, s.y, s.x - s.vx * 0.25, s.y - s.vy * 0.25);
        lg.addColorStop(0, `rgba(255,248,230,${s.life})`); lg.addColorStop(1, 'rgba(255,248,230,0)');
        ctx.strokeStyle = lg; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.x - s.vx * 0.25, s.y - s.vy * 0.25); ctx.stroke();
      }

      // the oasis on the horizon
      const oasis = U.smooth(0.78, 1, d);
      if (oasis > 0) this.drawOasis(ctx, w, h, oasis, dawn, t);

      // dunes
      DUNES.forEach((L, li) => {
        const off = this.cam * L.p;
        const col = U.mix(U.hex(L.night), U.hex(L.dawn), dawn * (0.4 + li * 0.1));
        ctx.beginPath(); ctx.moveTo(0, h);
        for (let x = 0; x <= w + 8; x += 8) ctx.lineTo(x, duneY(L, x + off, h));
        ctx.lineTo(w, h); ctx.closePath();
        const dg = ctx.createLinearGradient(0, h * (L.base - L.amp * 1.5), 0, h);
        dg.addColorStop(0, U.rgb(U.mix(col, U.hex('#ffd7a0'), 0.18 * dawn + 0.05)));
        dg.addColorStop(1, U.rgb(U.mix(col, [0, 0, 0], 0.35)));
        ctx.fillStyle = dg; ctx.fill();
        // moonlit / sunlit crest
        ctx.beginPath();
        for (let x = 0; x <= w + 8; x += 8) { const y = duneY(L, x + off, h); x ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
        ctx.strokeStyle = dawn > 0.5 ? `rgba(255,200,150,${0.08 + 0.2 * dawn})` : `rgba(190,200,255,${0.06 + li * 0.015})`;
        ctx.lineWidth = 1; ctx.stroke();
        // sand haze between layers
        ctx.fillStyle = U.rgb(U.ramp(SKY.hor, dawn), 0.06);
        ctx.fillRect(0, 0, w, h);
      });

      // footprints on the near dune
      const near = DUNES[4];
      for (const s of this.steps) {
        const sx = s.x - this.cam;
        const y = duneY(near, s.x, h) + 7 + (s.side ? 2 : -1);
        ctx.fillStyle = `rgba(0,0,0,${0.45 * (1 - s.age / 30)})`;
        ctx.beginPath(); ctx.ellipse(sx, y, 3.2, 1.4, 0, 0, 6.283); ctx.fill();
      }

      // the traveller's lantern, bobbing with each step
      const lx = w * 0.36, ly = duneY(near, this.cam + lx, h) - 26 - Math.abs(Math.sin(this.stepClock * Math.PI)) * 3 * this.speed;
      const flick = 0.85 + 0.15 * U.noise1(t * 7);
      const lg = ctx.createRadialGradient(lx, ly, 0, lx, ly, 120 * flick);
      lg.addColorStop(0, `rgba(255,214,140,${0.55 * (1 - dawn * 0.6)})`);
      lg.addColorStop(0.15, `rgba(255,170,80,${0.22 * (1 - dawn * 0.6)})`);
      lg.addColorStop(1, 'rgba(255,170,80,0)');
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = lg; ctx.fillRect(lx - 130, ly - 130, 260, 260);
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#fff1cf'; ctx.beginPath(); ctx.arc(lx, ly, 2.2, 0, 6.283); ctx.fill();

      this.drawRoute(ctx, w, h, d);
      this.drawWaypoint(ctx, w, h);
    },

    drawOasis(ctx, w, h, a, dawn, t) {
      const base = h * 0.62;
      ctx.save();
      ctx.globalAlpha = a * 0.85;
      ctx.fillStyle = U.rgb(U.mix(U.hex('#2a2244'), U.hex('#6a4258'), dawn));
      const r = U.seeded(33);
      for (let i = 0; i < 22; i++) {
        const x = w * (0.52 + r() * 0.42), th = h * (0.025 + r() * 0.04), y = base + r() * 6 - 4;
        ctx.fillRect(x - 0.8, y - th, 1.6, th);
        for (let k = 0; k < 7; k++) {
          const ang = -Math.PI / 2 + (k - 3) * 0.5 + Math.sin(t * 0.8 + i) * 0.04;
          ctx.beginPath(); ctx.moveTo(x, y - th);
          ctx.quadraticCurveTo(x + Math.cos(ang) * 8, y - th + Math.sin(ang) * 8 - 2, x + Math.cos(ang) * 13, y - th + Math.sin(ang) * 13 + 6);
          ctx.lineWidth = 1.4; ctx.strokeStyle = ctx.fillStyle; ctx.stroke();
        }
      }
      ctx.restore();
    },

    drawRoute(ctx, w, h, d) {
      const pad = Math.max(24, w * 0.22), y = Math.max(96, h * 0.13);
      const x0 = pad, x1 = w - pad;
      if (w < 720) return; // the HUD carries the story on phones; keep the scene clean
      ctx.save();
      ctx.font = '500 10px Marcellus, Georgia, serif';
      ctx.textBaseline = 'middle';
      ctx.strokeStyle = 'rgba(242,233,214,0.18)'; ctx.lineWidth = 1;
      ctx.setLineDash([2, 5]); ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke(); ctx.setLineDash([]);
      ctx.strokeStyle = 'rgba(217,187,133,0.85)';
      ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(U.lerp(x0, x1, d), y); ctx.stroke();
      WAYPOINTS.forEach(([p]) => { ctx.fillStyle = d >= p ? '#d9bb85' : 'rgba(242,233,214,0.25)'; ctx.fillRect(U.lerp(x0, x1, p) - 1.5, y - 1.5, 3, 3); });
      ctx.fillStyle = 'rgba(242,233,214,0.55)';
      ctx.textAlign = 'left'; ctx.fillText('MAKKAH', x0, y - 14);
      ctx.textAlign = 'right'; ctx.fillText('YATHRIB', x1, y - 14);
      const mx = U.lerp(x0, x1, d);
      U.star8(ctx, mx, y, 5, 0.5, d * 6); ctx.fillStyle = '#f0d48f'; ctx.fill();
      ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(242,233,214,0.75)';
      ctx.fillText(`${Math.round((1 - d) * TOTAL_KM)} KM`, mx, y + 16);
      ctx.restore();
    },

    drawWaypoint(ctx, w, h) {
      if (!this.wpText) return;
      const a = this.wpAlpha * (ENGINE.env && document.getElementById('titlecard').classList.contains('show') ? 0 : 1);
      if (a <= 0) return;
      const [, name, line] = this.wpText;
      ctx.save();
      ctx.textAlign = 'center';
      ctx.globalAlpha = a;
      ctx.fillStyle = '#f2e9d6';
      ctx.font = `${Math.round(Math.min(34, w * 0.06))}px Marcellus, Georgia, serif`;
      ctx.fillText(name, w / 2, h * 0.3);
      ctx.globalAlpha = a * 0.75;
      ctx.font = `italic 300 ${Math.round(Math.min(17, w * 0.04))}px Spectral, Georgia, serif`;
      ctx.fillText(line, w / 2, h * 0.3 + 30, w - 40);
      ctx.restore();
    },
  });
})();
