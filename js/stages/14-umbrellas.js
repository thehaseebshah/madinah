/* Station X — The Umbrellas, and the Night of Light.
   A perspective courtyard of white marble before dawn, its giant umbrellas folded like closed
   flowers. Sweep across them and they open to the morning. Once the courtyard is shaded, the day
   passes: at sunset they fold together, the lamps come on, and the court fills with moving light. */
(function () {
  'use strict';
  const SP = 26;           // grid spacing in metres; each canopy is about 25.5 m across
  const COLS = 4, ROWS = 10;
  const H0 = 14;           // column height
  const SKY_T = [[0, '#1b2244'], [0.25, '#5d86c0'], [0.5, '#4f8fd6'], [0.75, '#3a3f78'], [0.86, '#1a1d40'], [1, '#060918']];
  const SKY_H = [[0, '#e7a789'], [0.25, '#f5dcc0'], [0.5, '#d8ecf8'], [0.75, '#f59a5f'], [0.86, '#9a4d58'], [1, '#1a2040']];

  ENGINE.register({
    key: 'umbrellas',
    arabic: 'المدينة المنوّرة',
    title: 'The City of Light',
    era: 'Madinah today',
    hint: 'Sweep across the umbrellas to open them to the dawn',
    sound: { reverb: 0.45 },
    story: `<p>Around the Prophet’s Mosque, 250 giant umbrellas stand in the marble courtyards. Each opens to roughly 25 metres across, and together they shade the worshippers through the heat of the day. At evening they fold away, and the courtyards are lit for the night.</p>
            <p>Millions come each year. The village oasis of Yathrib has become <i>al-Madinah al-Munawwarah</i>: the Illuminated City.</p>`,

    enter(env) {
      const { ctx } = env.canvas2d();
      this.ctx = ctx;
      this.tau = 0.02; this.phase = 'dawn'; this.phaseT = 0; this.doves = []; this.night = 0;
      this.cam = { x: 0, y: 6, z: -40 };
      this.umbrellas = [];
      for (let r = 0; r < ROWS; r++) for (let c = -COLS; c <= COLS; c++) {
        this.umbrellas.push({ x: c * SP, z: r * SP, open: 0, target: 0, delay: -1, lamp: 0, ph: Math.random() * 6 });
      }
      const rnd = U.seeded(250);
      this.people = Array.from({ length: 700 }, () => ({
        x: (rnd() - 0.5) * 240, z: -34 + rnd() * 300, a: rnd() * 6.283, v: 0.6 + rnd() * 0.9, ph: rnd() * 6,
      }));
      this.layout(env);
      const b = env.bus;
      this.crowd = SND.noise(b, { color: 'pink', type: 'bandpass', freq: 480, q: 1.2, gain: 0.025 });
      this.crowd2 = SND.noise(b, { color: 'brown', type: 'bandpass', freq: 260, q: 1, gain: 0.05, pan: -0.3 });
      SND.lfo(b, this.crowd.filter && this.crowd.filter.frequency, 0.21, 80);
      this.air = SND.noise(b, { color: 'pink', type: 'highpass', freq: 2000, gain: 0.006 });
      this.birdClock = 1;
    },
    resize(env) { this.layout(env); },
    layout(env) { this.f = Math.min(env.h * 0.95, env.w * 0.9); this.hz = env.h * 0.5; this.cx = env.w / 2; },

    proj(x, y, z) {
      const c = this.cam, dz = z - c.z;
      if (dz < 0.5) return null;
      const s = this.f / dz;
      return [this.cx + (x - c.x) * s, this.hz - (y - c.y) * s, s];
    },

    openAt(env, sx, sy, radius, wave) {
      let any = false;
      for (const u of this.umbrellas) {
        if (u.target) continue;
        const p = this.proj(u.x, H0 + 3, u.z); if (!p) continue;
        const d = Math.hypot(p[0] - sx, p[1] - sy);
        const reach = Math.max(radius, 12.5 * p[2] * 0.9);
        if (wave) { u.delay = d / 900; u.target = 1; any = true; }
        else if (d < reach) { u.target = 1; u.delay = 0; any = true; }
      }
      return any;
    },

    down(env, p) {
      if (this.phase === 'dawn') { this.openAt(env, p.x, p.y, 60); return; }
      // after dark: doves rise from the marble
      this.releaseDoves(env, p.x, p.y);
    },
    move(env, p) {
      if (this.phase !== 'dawn') return;
      if (p.down || Math.hypot(p.vx, p.vy) > 6) this.openAt(env, p.x, p.y, 40);
    },
    key(env, e) { if ((e.key === ' ' || e.key === 'Enter') && this.phase === 'dawn') { e.preventDefault(); this.openAt(env, env.w / 2, env.h, 0, true); } },

    releaseDoves(env, x, y) {
      for (let i = 0; i < 14; i++) {
        this.doves.push({ x: x + (Math.random() - 0.5) * 40, y: y + (Math.random() - 0.5) * 20, vx: (Math.random() - 0.5) * 160, vy: -80 - Math.random() * 160, ph: Math.random() * 6, s: 3 + Math.random() * 3, life: 0 });
      }
      const pan = (x / env.w) * 2 - 1;
      for (let k = 0; k < 14; k++) SND.swell(env.bus, { color: 'white', type: 'bandpass', f0: 900, f1: 2200, dur: 0.09, gain: 0.05 * (1 - k / 16), delay: k * 0.07 + Math.random() * 0.02, pan: pan + (Math.random() - 0.5) * 0.4, q: 1.5 });
      SND.coo(env.bus, { gain: 0.035, delay: 0.8, pan });
    },

    finale(env) { for (let i = 0; i < 4; i++) setTimeout(() => this.releaseDoves(env, env.w * (0.2 + i * 0.2), env.h * 0.8), i * 500); },

    update(env, dt) {
      const p = env.pointer;
      this.cam.x = U.damp(this.cam.x, (p.x / env.w - 0.5) * -10, 1.2, dt);
      this.cam.z = Math.min(-22, this.cam.z + dt * 0.25);
      this.phaseT += dt;

      let opened = 0;
      for (const u of this.umbrellas) {
        if (u.delay > 0) { u.delay -= dt; continue; }
        const before = u.open;
        const speed = 1 / 2.6;
        u.open += U.clamp(u.target - u.open, -speed * dt, speed * dt);
        if (before === 0 && u.open > 0) this.unfurlSound(env, u, 1);
        if (before === 1 && u.open < 1) this.unfurlSound(env, u, 0);
        opened += u.target;
        u.lamp = U.damp(u.lamp, this.night > 0.5 ? 1 : 0, 0.8 + (u.ph % 1), dt);
      }
      const frac = opened / this.umbrellas.length;

      if (this.phase === 'dawn') {
        this.tau = U.damp(this.tau, 0.05 + frac * 0.42, 1.2, dt);
        if (frac >= 0.85) {
          this.phase = 'day'; this.phaseT = 0;
          this.umbrellas.forEach(u => { if (!u.target) { u.target = 1; u.delay = Math.random() * 1.2; } });
          env.hint('');
        }
      } else if (this.phase === 'day') {
        this.tau = U.damp(this.tau, 0.52, 1, dt);
        if (this.phaseT > 3.5) { this.phase = 'evening'; this.phaseT = 0; SND.glow(env.bus, 110, { gain: 0.04, dur: 10 }); }
      } else if (this.phase === 'evening') {
        this.tau = Math.min(1, this.tau + dt / 14);
        if (this.tau > 0.78) {
          // sunset: they fold together, nearest first
          this.umbrellas.forEach(u => { if (u.target) { u.target = 0; u.delay = u.z / 160 + Math.abs(u.x) / 400; } });
        }
        if (this.tau >= 1) { this.phase = 'night'; this.phaseT = 0; env.complete(); env.hint('Tap the courtyard to raise the doves'); }
      }
      this.night = U.smooth(0.8, 0.95, this.tau);

      // the living courtyard
      for (const q of this.people) {
        q.a += (U.noise1(q.ph + env.time * 0.1) * 0.6) * dt;
        q.x += Math.cos(q.a) * q.v * dt; q.z += (Math.sin(q.a) * 0.5 + 0.35) * q.v * dt;
        if (q.z > 268) q.z = -34; if (q.x > 120) q.x = -120; if (q.x < -120) q.x = 120;
      }
      for (const d of this.doves) {
        d.life += dt; d.vy -= 20 * dt; d.vx *= 0.995; d.x += d.vx * dt; d.y += d.vy * dt;
      }
      this.doves = this.doves.filter(d => d.y > -40 && d.life < 12);

      this.crowd.set('gain', 0.02 + this.night * 0.05 + frac * 0.01, 1);
      this.crowd2.set('gain', 0.04 + this.night * 0.04, 1);
      this.birdClock -= dt;
      if (this.birdClock < 0) {
        this.birdClock = 1 + Math.random() * 3;
        if (this.night < 0.5) (Math.random() < 0.5 ? SND.coo(env.bus, { gain: 0.03 }) : SND.chirp(env.bus, { gain: 0.016 }));
        else if (Math.random() < 0.3) SND.cricket(env.bus, { gain: 0.004 });
      }
    },

    unfurlSound(env, u, opening) {
      const p = this.proj(u.x, H0, u.z); if (!p) return;
      const pan = U.clamp((p[0] / env.w) * 2 - 1, -1, 1), near = U.clamp(p[2] / (this.f / 30));
      if (Math.random() > 0.55 && near < 0.6) return; // thin the far ones so the wave stays airy
      SND.swell(env.bus, { color: 'pink', type: 'bandpass', f0: opening ? 250 : 900, f1: opening ? 1100 : 260, dur: 2.4, gain: 0.03 * (0.4 + near), pan, q: 2 });
      SND.swell(env.bus, { color: 'white', type: 'highpass', f0: 3000, f1: 5000, dur: 0.35, gain: 0.025 * near, pan, delay: opening ? 2.2 : 0.1 });
      SND.bell(env.bus, [783.99, 698.46, 587.33, 523.25, 440, 392, 349.23, 293.66, 261.63, 220][Math.min(9, Math.round(u.z / SP))], { gain: 0.012 + 0.012 * near, dur: 3.5, glass: true, pan, delay: opening ? 2.4 : 0.2 });
    },

    render(env) {
      const ctx = this.ctx, w = env.w, h = env.h, t = env.time, tau = this.tau, N = this.night;
      ctx.setTransform(env.dpr, 0, 0, env.dpr, 0, 0);
      const top = U.ramp(SKY_T, tau), hor = U.ramp(SKY_H, tau);
      const sg = ctx.createLinearGradient(0, 0, 0, this.hz);
      sg.addColorStop(0, U.rgb(top)); sg.addColorStop(1, U.rgb(hor));
      ctx.fillStyle = sg; ctx.fillRect(0, 0, w, this.hz + 1);

      // stars at night
      if (N > 0) {
        const r = U.seeded(5);
        for (let i = 0; i < 220; i++) { ctx.fillStyle = `rgba(240,235,220,${N * (0.3 + 0.5 * Math.abs(Math.sin(t * (0.3 + r()) + i)))})`; ctx.fillRect(r() * w, r() * this.hz * 0.9, 1.2, 1.2); }
      }

      this.drawMosque(ctx, w, h, hor, N, t);

      // marble floor
      const floor = U.mix(U.mix([236, 232, 222], hor, 0.25), [24, 22, 30], N * 0.85);
      const fg = ctx.createLinearGradient(0, this.hz, 0, h);
      fg.addColorStop(0, U.rgb(U.mix(floor, hor, 0.4))); fg.addColorStop(1, U.rgb(U.mix(floor, [255, 255, 255], 0.1 * (1 - N))));
      ctx.fillStyle = fg; ctx.fillRect(0, this.hz, w, h - this.hz);
      ctx.strokeStyle = N > 0.5 ? 'rgba(255,220,160,0.05)' : 'rgba(120,110,100,0.12)'; ctx.lineWidth = 1;
      const zNear = this.cam.z + 2;
      for (let x = -130; x <= 130; x += 6.5) { const a = this.proj(x, 0, zNear), b = this.proj(x, 0, 280); if (a && b) { ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); } }
      for (let z = Math.ceil(zNear / 6.5) * 6.5; z < 280; z += 6.5) { const a = this.proj(-130, 0, z), b = this.proj(130, 0, z); if (a && b) { ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); } }

      // pools of shade beneath the open canopies
      if (N < 0.9) {
        ctx.fillStyle = `rgba(90,80,70,${0.13 * (1 - N)})`;
        for (const u of this.umbrellas) {
          const o = U.ease(u.open); if (o < 0.05) continue;
          const r = 12.6 * o, c = [[-r, -r], [r, -r], [r, r], [-r, r]].map(([dx, dz]) => this.proj(u.x + dx + 2, 0, u.z + dz + 3));
          if (!c.every(Boolean)) continue;
          ctx.beginPath(); c.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); ctx.fill();
        }
      }

      // people as points of light moving across the court
      for (const q of this.people) {
        const pp = this.proj(q.x, 0.9, q.z); if (!pp || pp[1] > h + 4) continue;
        const s = Math.max(0.8, pp[2] * 0.45);
        if (N > 0.3) {
          ctx.fillStyle = `rgba(255,228,170,${0.25 + 0.6 * N})`;
          ctx.beginPath(); ctx.arc(pp[0], pp[1] - s, Math.max(0.7, s * 0.45), 0, 6.283); ctx.fill();
        } else {
          ctx.fillStyle = `rgba(250,248,240,${0.7 - N})`;
          ctx.fillRect(pp[0] - s * 0.5, pp[1] - s * 2.2, s, s * 2.2);
        }
      }

      // umbrellas, far to near
      const list = this.umbrellas.slice().sort((a, b) => b.z - a.z || Math.abs(b.x - this.cam.x) - Math.abs(a.x - this.cam.x));
      for (const u of list) this.drawUmbrella(ctx, u, hor, N, t);

      // doves
      for (const d of this.doves) {
        const flap = Math.sin(t * 16 + d.ph) * d.s;
        ctx.strokeStyle = `rgba(255,252,240,${Math.min(1, 1.2 - d.life / 10)})`; ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.moveTo(d.x - d.s * 2, d.y - flap); ctx.quadraticCurveTo(d.x - d.s, d.y - d.s * 0.4, d.x, d.y); ctx.quadraticCurveTo(d.x + d.s, d.y - d.s * 0.4, d.x + d.s * 2, d.y - flap); ctx.stroke();
      }

      // atmosphere
      if (N > 0) {
        const glow = ctx.createLinearGradient(0, this.hz - h * 0.2, 0, h);
        glow.addColorStop(0, 'rgba(255,190,110,0)'); glow.addColorStop(0.3, `rgba(255,190,110,${0.06 * N})`); glow.addColorStop(1, 'rgba(255,190,110,0)');
        ctx.fillStyle = glow; ctx.fillRect(0, 0, w, h);
      }
    },

    drawMosque(ctx, w, h, hor, N, t) {
      const Z = 330;
      const wall = U.mix(U.mix([230, 220, 205], hor, 0.35), [30, 28, 40], N * 0.8);
      const a = this.proj(-260, 26, Z), b = this.proj(260, 0, Z);
      if (!a || !b) return;
      ctx.fillStyle = U.rgb(wall); ctx.fillRect(a[0], a[1], b[0] - a[0], b[1] - a[1]);
      // arcade of lit arches
      for (let x = -250; x < 250; x += 12) {
        const p = this.proj(x + 6, 12, Z), q = this.proj(x + 6, 0, Z); if (!p || !q) continue;
        const aw = 4 * p[2];
        ctx.fillStyle = N > 0.3 ? `rgba(255,214,150,${0.5 * N + 0.2})` : U.rgb(U.mix(wall, [0, 0, 0], 0.25));
        ctx.beginPath(); ctx.moveTo(p[0] - aw, q[1]); ctx.lineTo(p[0] - aw, p[1]); ctx.arc(p[0], p[1], aw, Math.PI, 0); ctx.lineTo(p[0] + aw, q[1]); ctx.fill();
      }
      // minarets
      [-200, -110, 110, 200].forEach((mx, i) => {
        const H = i % 3 === 0 ? 96 : 104;
        const base = this.proj(mx, 0, Z + 4), topP = this.proj(mx, H, Z + 4); if (!base || !topP) return;
        const s = base[2], ww = 3.2 * s;
        ctx.fillStyle = U.rgb(U.mix(wall, [255, 255, 255], 0.1));
        ctx.fillRect(base[0] - ww, topP[1], ww * 2, base[1] - topP[1]);
        [0.45, 0.68, 0.85].forEach(k => { const y = U.lerp(base[1], topP[1], k); ctx.fillRect(base[0] - ww * 1.6, y, ww * 3.2, 1.2 * s); if (N > 0.2) { ctx.fillStyle = `rgba(255,236,190,${N})`; ctx.fillRect(base[0] - ww * 1.6, y + 1.2 * s, ww * 3.2, 0.5 * s); ctx.fillStyle = U.rgb(U.mix(wall, [255, 255, 255], 0.1)); } });
        ctx.beginPath(); ctx.moveTo(base[0] - ww, topP[1]); ctx.lineTo(base[0], topP[1] - 9 * s); ctx.lineTo(base[0] + ww, topP[1]); ctx.fill();
        ctx.fillStyle = `rgba(255,220,150,${0.4 + 0.6 * N})`; ctx.beginPath(); ctx.arc(base[0], topP[1] - 10 * s, 0.9 * s, 0, 6.283); ctx.fill();
      });
      // the Green Dome
      const dc = this.proj(-40, 30, Z - 4); if (!dc) return;
      const R = 10 * dc[2];
      const green = U.mix([62, 150, 104], [70, 190, 120], N);
      ctx.fillStyle = U.rgb(U.mix(wall, [0, 0, 0], 0.1)); ctx.fillRect(dc[0] - R * 1.05, dc[1] - R * 0.2, R * 2.1, R * 0.6);
      if (N > 0) {
        const gg = ctx.createRadialGradient(dc[0], dc[1] - R, 0, dc[0], dc[1] - R, R * 4);
        gg.addColorStop(0, `rgba(90,220,150,${0.35 * N})`); gg.addColorStop(1, 'rgba(90,220,150,0)');
        ctx.fillStyle = gg; ctx.fillRect(dc[0] - R * 4, dc[1] - R * 5, R * 8, R * 8);
      }
      const dg = ctx.createLinearGradient(dc[0] - R, 0, dc[0] + R, 0);
      dg.addColorStop(0, U.rgb(U.mix(green, [0, 0, 0], 0.3))); dg.addColorStop(0.4, U.rgb(U.mix(green, [255, 255, 255], 0.15))); dg.addColorStop(1, U.rgb(U.mix(green, [0, 0, 0], 0.4)));
      ctx.fillStyle = dg;
      ctx.beginPath(); ctx.moveTo(dc[0] - R, dc[1] - R * 0.2);
      ctx.bezierCurveTo(dc[0] - R, dc[1] - R * 1.4, dc[0] - R * 0.2, dc[1] - R * 1.6, dc[0], dc[1] - R * 1.9);
      ctx.bezierCurveTo(dc[0] + R * 0.2, dc[1] - R * 1.6, dc[0] + R, dc[1] - R * 1.4, dc[0] + R, dc[1] - R * 0.2);
      ctx.fill();
      ctx.strokeStyle = `rgba(230,200,120,${0.7 + 0.3 * N})`; ctx.lineWidth = Math.max(1, R * 0.06);
      ctx.beginPath(); ctx.moveTo(dc[0], dc[1] - R * 1.9); ctx.lineTo(dc[0], dc[1] - R * 2.4); ctx.stroke();
      ctx.beginPath(); ctx.arc(dc[0], dc[1] - R * 2.5, R * 0.12, 0.6, Math.PI * 2 - 0.6); ctx.stroke();
    },

    lampGlow(ctx, u, hub, s) {
      if (u.lamp <= 0.01) return;
      const near = U.clamp(s / 14), R = 7 * s;
      const lg = ctx.createRadialGradient(hub[0], hub[1], 0, hub[0], hub[1], R);
      lg.addColorStop(0, `rgba(255,214,150,${0.4 * u.lamp * (0.25 + 0.75 * near)})`); lg.addColorStop(1, 'rgba(255,214,150,0)');
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = lg; ctx.fillRect(hub[0] - R, hub[1] - R, R * 2, R * 2); ctx.restore();
      ctx.fillStyle = `rgba(255,240,210,${u.lamp})`; ctx.beginPath(); ctx.arc(hub[0], hub[1], Math.max(0.8, s * 0.25), 0, 6.283); ctx.fill();
    },

    drawUmbrella(ctx, u, hor, N, t) {
      const o = U.ease(u.open);
      const base = this.proj(u.x, 0, u.z), hub = this.proj(u.x, H0, u.z);
      if (!base || !hub) return;
      const s = base[2];
      const col = U.mix(U.mix([238, 232, 220], hor, 0.2), [40, 36, 46], N * 0.75);
      // reflection of the lamp on marble
      if (u.lamp > 0.01) {
        const rg = ctx.createLinearGradient(0, base[1], 0, base[1] + 40 * s);
        rg.addColorStop(0, `rgba(255,210,140,${0.14 * u.lamp})`); rg.addColorStop(1, 'rgba(255,210,140,0)');
        ctx.fillStyle = rg; ctx.fillRect(base[0] - 1.2 * s, base[1], 2.4 * s, 40 * s);
      }
      // column
      const cw = 0.75 * s;
      const cg = ctx.createLinearGradient(base[0] - cw, 0, base[0] + cw, 0);
      cg.addColorStop(0, U.rgb(U.mix(col, [0, 0, 0], 0.25))); cg.addColorStop(0.4, U.rgb(U.mix(col, [255, 255, 255], 0.2))); cg.addColorStop(1, U.rgb(U.mix(col, [0, 0, 0], 0.35)));
      ctx.fillStyle = cg; ctx.fillRect(base[0] - cw, hub[1], cw * 2, base[1] - hub[1]);
      ctx.fillStyle = U.rgb(U.mix(col, [180, 150, 90], 0.4)); ctx.fillRect(base[0] - cw * 1.4, base[1] - 1.2 * s, cw * 2.8, 1.2 * s);

      // folded: a slim furled bud standing on the column
      const bud = 1 - U.smooth(0, 0.3, o);
      if (bud > 0.01) {
        const pts2 = [[-0.9, 0], [-1.7, 4], [-1.2, 11], [0, 17.5], [1.2, 11], [1.7, 4], [0.9, 0]].map(([dx, dy]) => this.proj(u.x + dx, H0 + dy, u.z));
        if (pts2.every(Boolean)) {
          const bg = ctx.createLinearGradient(pts2[1][0], 0, pts2[5][0], 0);
          bg.addColorStop(0, U.rgb(U.mix(col, [0, 0, 0], 0.3), bud)); bg.addColorStop(0.45, U.rgb(U.mix(col, [255, 255, 255], 0.2), bud)); bg.addColorStop(1, U.rgb(U.mix(col, [0, 0, 0], 0.4), bud));
          ctx.fillStyle = bg; ctx.beginPath(); ctx.moveTo(pts2[0][0], pts2[0][1]);
          ctx.quadraticCurveTo(pts2[1][0], pts2[1][1], pts2[2][0], pts2[2][1]); ctx.lineTo(pts2[3][0], pts2[3][1]); ctx.lineTo(pts2[4][0], pts2[4][1]);
          ctx.quadraticCurveTo(pts2[5][0], pts2[5][1], pts2[6][0], pts2[6][1]); ctx.closePath(); ctx.fill();
          if (u.lamp > 0.01) {
            ctx.strokeStyle = `rgba(255,214,150,${0.5 * u.lamp * bud})`; ctx.lineWidth = Math.max(0.6, 0.15 * s);
            ctx.beginPath(); ctx.moveTo(pts2[0][0], pts2[0][1]); ctx.quadraticCurveTo(pts2[1][0], pts2[1][1], pts2[2][0], pts2[2][1]); ctx.lineTo(pts2[3][0], pts2[3][1]); ctx.stroke();
          }
        }
        if (o < 0.04) { this.lampGlow(ctx, u, hub, s); return; }
      }
      // canopy: four arms to the corners and four to the edge midpoints, white membrane between
      const thetaC = o * 1.29, thetaM = o * 1.18; // radians from vertical
      const Lc = 17.7, Lm = 12.4;
      const pts = [];
      for (let i = 0; i < 8; i++) {
        const corner = i % 2 === 0, ang = (i * Math.PI) / 4 + Math.PI / 4;
        const L = corner ? Lc : Lm, th = corner ? thetaC : thetaM;
        const hr = Math.sin(th) * L + (1 - o) * (corner ? 1.4 : 1.0), vy = Math.cos(th) * L * (corner ? 1 : 0.92) * (0.35 + 0.65 * (1 - o)) + (corner ? 5.5 : 3.6) * o;
        const p = this.proj(u.x + Math.cos(ang) * hr, H0 + vy, u.z + Math.sin(ang) * hr);
        if (!p) return;
        pts.push(p);
      }
      // panels between neighbouring arms, shaded by facing
      for (let i = 0; i < 8; i++) {
        const a = pts[i], b = pts[(i + 1) % 8];
        const facing = 0.5 + 0.5 * Math.cos((i * Math.PI) / 4 - 0.6);
        const shade = U.mix(col, [255, 253, 246], (0.2 + 0.25 * facing) * (1 - N));
        ctx.fillStyle = U.rgb(U.mix(shade, [40, 34, 30], 0.04 + 0.14 * (1 - facing)));
        ctx.beginPath(); ctx.moveTo(hub[0], hub[1]); ctx.lineTo(a[0], a[1]);
        const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
        ctx.quadraticCurveTo(mx + (hub[0] - mx) * 0.1 * o, my + (hub[1] - my) * 0.15 * o, b[0], b[1]);
        ctx.closePath(); ctx.fill();
      }
      this.lampGlow(ctx, u, hub, s);
      // ribs
      ctx.strokeStyle = U.rgb(U.mix(col, [150, 130, 100], 0.5), 0.7); ctx.lineWidth = Math.max(0.5, 0.18 * s);
      ctx.beginPath(); for (let i = 0; i < 8; i++) { ctx.moveTo(hub[0], hub[1]); ctx.lineTo(pts[i][0], pts[i][1]); } ctx.stroke();
    },
  });
})();
