/* Station II — Quba, the First Stones.
   A masonry elevation drawn in chalk. Each tap lays a basalt stone; the wall rises course by
   course, every course a little higher in pitch, until the palm-frond roof closes overhead. */
(function () {
  'use strict';

  ENGINE.register({
    key: 'quba',
    id: 'quba',
    arabic: 'قُباء',
    title: 'Quba, the First Stones',
    era: 'Rabi‘ al-Awwal, 1 AH',
    hint: 'Tap to lay a stone · hold to build',
    sound: { reverb: 0.3 },
    story: `<p>Before entering the city, the Prophet ﷺ stayed in the village of Quba, on the southern edge of the oasis. There, with his companions, he laid the foundations of the first mosque in Islam, carrying stones with his own hands.</p>
            <p class="q"><span class="ar">لَمَسْجِدٌ أُسِّسَ عَلَى التَّقْوَىٰ</span>“A mosque founded on piety from the first day…” (Qur’an 9:108)</p>
            <p>Madinah sits among fields of black volcanic rock, the <i>harrah</i>. Its early walls were built from that basalt and from sun-dried brick.</p>`,

    enter(env) {
      const { ctx } = env.canvas2d();
      this.ctx = ctx;
      this.falling = []; this.dust = []; this.placed = 0; this.dropClock = 0;
      this.roof = 0; this.after = 0; this.finished = false;
      this.layout(env);
      const b = env.bus;
      this.air = SND.noise(b, { color: 'pink', type: 'lowpass', freq: 600, gain: 0.05 });
      this.birdClock = 1;
    },

    resize(env) {
      const filled = this.stones ? this.stones.filter(s => s.filled).length / this.stones.length : 0;
      this.layout(env);
      // keep progress through a resize
      const n = Math.floor(filled * this.stones.length);
      this.stones.slice().sort((a, b) => b.y - a.y).slice(0, n).forEach(s => { s.filled = true; s.land = 1; });
    },

    layout(env) {
      const w = env.w, h = env.h, r = U.seeded(1);
      const W = Math.min(w * 0.82, 980), H = Math.min(h * 0.34, W * 0.42);
      this.ground = h * 0.78;
      this.wall = { x: (w - W) / 2, y: this.ground - H, W, H };
      const courses = 9, ch = H / courses;
      const door = { cx: w / 2, w: W * 0.13, h: H * 0.66 };
      this.door = door;
      const inDoor = (x0, x1, y0, y1) => {
        const dx0 = door.cx - door.w / 2, dx1 = door.cx + door.w / 2, top = this.ground - door.h;
        if (x1 <= dx0 || x0 >= dx1 || y1 <= top) return false;
        // arch: stones above the spring line may sit outside the semicircle
        const springY = top + door.w / 2;
        if (y1 > springY) return true;
        const cx = Math.max(x0, Math.min(door.cx, x1)), cy = Math.max(y0, Math.min(springY, y1));
        return Math.hypot(cx - door.cx, cy - springY) < door.w / 2;
      };
      this.stones = [];
      for (let c = 0; c < courses; c++) {
        let x = this.wall.x - (c % 2 ? ch * 0.6 : 0);
        const y = this.ground - (c + 1) * ch;
        while (x < this.wall.x + W) {
          const sw = ch * (1.3 + r() * 1.3);
          const x0 = Math.max(x, this.wall.x), x1 = Math.min(x + sw, this.wall.x + W);
          if (x1 - x0 > ch * 0.4 && !inDoor(x0, x1, y, y + ch)) {
            const tone = r();
            this.stones.push({
              x: x0 + 1, y: y + 1, w: x1 - x0 - 2, h: ch - 2, c, filled: false, land: 0,
              col: tone < 0.7 ? U.mix([38, 34, 36], [74, 64, 60], r()) : U.mix([120, 92, 66], [160, 128, 92], r()),
              chip: r(),
            });
          }
          x += sw;
        }
      }
      this.courses = courses;
    },

    candidates() {
      // a stone may be laid when every stone under it is in place
      return this.stones.filter(s => {
        if (s.filled || s.claimed) return false;
        if (s.c === 0) return true;
        return this.stones.every(o => o.c !== s.c - 1 || o.filled || o.x + o.w < s.x + 2 || o.x > s.x + s.w - 2);
      });
    },

    drop(env, x) {
      const cand = this.candidates();
      if (!cand.length) return;
      cand.sort((a, b) => (a.c - b.c) * 400 + Math.abs(a.x + a.w / 2 - x) - Math.abs(b.x + b.w / 2 - x));
      // prefer the lowest open course, but stay near the hand
      const low = cand[0].c;
      const pool = cand.filter(s => s.c <= low + 1).sort((a, b) => Math.abs(a.x + a.w / 2 - x) - Math.abs(b.x + b.w / 2 - x));
      const s = pool[0];
      s.claimed = true;
      this.falling.push({ s, y: Math.min(env.pointer.y, s.y - 60) - 30, vy: 0, rot: (Math.random() - 0.5) * 0.3 });
    },

    down(env, p) { this.holding = true; this.drop(env, p.x); this.dropClock = 0; },
    up() { this.holding = false; },

    update(env, dt) {
      if (this.holding && !this.finished) {
        this.dropClock += dt;
        if (this.dropClock > 0.085) { this.dropClock = 0; this.drop(env, env.pointer.x + (Math.random() - 0.5) * 60); }
      }
      for (const f of this.falling) {
        f.vy += 2600 * dt; f.y += f.vy * dt; f.rot *= 0.9;
        if (f.y >= f.s.y) {
          f.done = true; f.s.filled = true; f.s.land = 1; this.placed++;
          const pan = ((f.s.x + f.s.w / 2) / env.w) * 2 - 1;
          SND.knock(env.bus, { f: 120 + f.s.c * 14 + (60 / f.s.w) * 20, gain: 0.35, pan, click: 1800 + Math.random() * 1200 });
          for (let i = 0; i < 9; i++) this.dust.push({ x: f.s.x + Math.random() * f.s.w, y: f.s.y + f.s.h, vx: (Math.random() - 0.5) * 60, vy: -Math.random() * 40, life: 1, r: 2 + Math.random() * 6 });
        }
      }
      this.falling = this.falling.filter(f => !f.done);
      for (const s of this.stones) if (s.land > 0) s.land = Math.max(0, s.land - dt * 3);
      for (const d of this.dust) { d.x += d.vx * dt; d.y += d.vy * dt; d.vy -= 8 * dt; d.life -= dt * 0.7; d.r += dt * 6; }
      this.dust = this.dust.filter(d => d.life > 0);

      const prog = this.stones.filter(s => s.filled).length / this.stones.length;
      this.prog = prog;
      if (prog >= 1 && !this.finished) {
        this.finished = true;
        SND.glow(env.bus, 130.8, { gain: 0.05, dur: 7 });
        SND.glow(env.bus, 196, { gain: 0.03, dur: 7, delay: 0.8 });
        setTimeout(() => SND.coo(env.bus, { gain: 0.06 }), 1600);
      }
      if (this.finished) {
        this.roof = Math.min(1, this.roof + dt * 0.35);
        if (this.roof > 0.3 && Math.random() < dt * 4 && this.roof < 1) SND.swell(env.bus, { f0: 1200, f1: 3500, dur: 0.4, gain: 0.02, color: 'white' });
        this.after = Math.min(1, this.after + dt * 0.12);
        if (this.after > 0.4) env.complete();
      }

      this.birdClock -= dt;
      if (this.birdClock < 0) {
        this.birdClock = 2 + Math.random() * 5;
        if (Math.random() < 0.4) SND.coo(env.bus, { gain: 0.035 }); else SND.chirp(env.bus, { gain: 0.018 });
      }
    },

    render(env) {
      const ctx = this.ctx, w = env.w, h = env.h, t = env.time, P = this.prog || 0, A = this.after;
      ctx.setTransform(env.dpr, 0, 0, env.dpr, 0, 0);

      // late-afternoon sky, warming as the mosque completes
      const sky = ctx.createLinearGradient(0, 0, 0, this.ground);
      sky.addColorStop(0, U.rgb(U.mix([132, 172, 186], [104, 120, 170], A)));
      sky.addColorStop(0.65, U.rgb(U.mix([226, 210, 178], [238, 170, 120], A)));
      sky.addColorStop(1, U.rgb(U.mix([240, 214, 168], [250, 190, 120], A)));
      ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);

      // sun
      const sx = w * 0.18, sy = h * (0.3 + A * 0.12);
      const sg = ctx.createRadialGradient(sx, sy, 0, sx, sy, h * 0.6);
      sg.addColorStop(0, 'rgba(255,248,220,0.95)'); sg.addColorStop(0.04, 'rgba(255,236,190,0.7)'); sg.addColorStop(1, 'rgba(255,220,160,0)');
      ctx.fillStyle = sg; ctx.fillRect(0, 0, w, h);

      // the modern mosque remembered in the sky
      if (A > 0) this.drawMemory(ctx, w, h, A);

      // far harrah ridge
      ctx.fillStyle = U.rgb(U.mix([150, 130, 120], [140, 100, 100], A), 0.55);
      ctx.beginPath(); ctx.moveTo(0, this.ground);
      for (let x = 0; x <= w; x += 10) ctx.lineTo(x, this.ground - h * 0.1 - U.fbm1(x * 0.004 + 3) * h * 0.08);
      ctx.lineTo(w, this.ground); ctx.fill();

      // palm grove behind the wall
      this.drawPalms(ctx, w, h, t);

      // ground
      const gg = ctx.createLinearGradient(0, this.ground, 0, h);
      gg.addColorStop(0, '#b48a5c'); gg.addColorStop(1, '#5c4030');
      ctx.fillStyle = gg; ctx.fillRect(0, this.ground, w, h - this.ground);

      const W = this.wall;
      // chalk outline of what will be built
      ctx.save();
      ctx.setLineDash([6, 6]); ctx.lineDashOffset = -t * 8;
      ctx.strokeStyle = `rgba(255,250,236,${0.55 * (1 - P)})`; ctx.lineWidth = 1.2;
      ctx.strokeRect(W.x, W.y, W.W, W.H);
      const d = this.door, top = this.ground - d.h, spring = top + d.w / 2;
      ctx.beginPath(); ctx.moveTo(d.cx - d.w / 2, this.ground); ctx.lineTo(d.cx - d.w / 2, spring);
      ctx.arc(d.cx, spring, d.w / 2, Math.PI, 0); ctx.lineTo(d.cx + d.w / 2, this.ground); ctx.stroke();
      ctx.restore();

      // shadow cast by the wall
      ctx.fillStyle = 'rgba(40,20,10,0.22)';
      const shadowH = 40 * P;
      ctx.beginPath(); ctx.moveTo(W.x, this.ground); ctx.lineTo(W.x + W.W, this.ground); ctx.lineTo(W.x + W.W + 120 * P, this.ground + shadowH); ctx.lineTo(W.x + 120 * P, this.ground + shadowH); ctx.fill();

      // doorway glow from within
      if (P > 0.5) {
        ctx.save();
        ctx.beginPath(); ctx.moveTo(d.cx - d.w / 2, this.ground); ctx.lineTo(d.cx - d.w / 2, spring); ctx.arc(d.cx, spring, d.w / 2, Math.PI, 0); ctx.lineTo(d.cx + d.w / 2, this.ground); ctx.closePath();
        const dg = ctx.createLinearGradient(0, top, 0, this.ground);
        dg.addColorStop(0, `rgba(255,220,150,${0.4 * A})`); dg.addColorStop(1, `rgba(70,40,25,${0.75})`);
        ctx.fillStyle = dg; ctx.fill();
        ctx.restore();
      }

      // stones
      for (const s of this.stones) if (s.filled) this.drawStone(ctx, s, s.x, s.y, 0);
      for (const f of this.falling) this.drawStone(ctx, f.s, f.s.x, f.y, f.rot);

      // palm-frond roof
      if (this.roof > 0) this.drawRoof(ctx, W, this.roof, t);

      // dust
      for (const p of this.dust) {
        ctx.fillStyle = `rgba(210,180,140,${0.25 * p.life})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill();
      }

      // warm grade
      ctx.fillStyle = `rgba(255,170,90,${0.05 + 0.08 * A})`;
      ctx.globalCompositeOperation = 'overlay'; ctx.fillRect(0, 0, w, h); ctx.globalCompositeOperation = 'source-over';

      // course counter
      ctx.font = '11px Marcellus, Georgia, serif'; ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(40,24,14,0.7)';
      const placed = this.stones.filter(s => s.filled).length;
      ctx.fillText(`${placed} / ${this.stones.length} STONES`, w / 2, this.ground + 34);
    },

    drawStone(ctx, s, x, y, rot) {
      ctx.save();
      ctx.translate(x + s.w / 2, y + s.h / 2); ctx.rotate(rot);
      const r = Math.min(4, s.h * 0.2);
      ctx.beginPath(); ctx.roundRect ? ctx.roundRect(-s.w / 2, -s.h / 2, s.w, s.h, r) : ctx.rect(-s.w / 2, -s.h / 2, s.w, s.h);
      const g = ctx.createLinearGradient(-s.w / 2, -s.h / 2, s.w / 3, s.h / 2);
      const c = s.col;
      g.addColorStop(0, U.rgb(U.mix(c, [255, 220, 170], 0.32 + s.land * 0.4)));
      g.addColorStop(1, U.rgb(U.mix(c, [0, 0, 0], 0.25)));
      ctx.fillStyle = g; ctx.fill();
      ctx.strokeStyle = 'rgba(30,18,10,0.55)'; ctx.lineWidth = 1; ctx.stroke();
      // pitted surface of basalt
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      for (let i = 0; i < 4; i++) {
        const px = (((s.chip * 97.3 * (i + 1)) % 1) - 0.5) * s.w * 0.8, py = (((s.chip * 51.7 * (i + 2)) % 1) - 0.5) * s.h * 0.7;
        ctx.beginPath(); ctx.arc(px, py, 1 + (i % 2), 0, 6.283); ctx.fill();
      }
      ctx.fillStyle = 'rgba(255,230,190,0.18)'; ctx.fillRect(-s.w / 2 + r, -s.h / 2 + 1, s.w - 2 * r, 1.5);
      ctx.restore();
    },

    drawRoof(ctx, W, k, t) {
      const n = Math.floor(70 * k);
      ctx.save();
      // palm-trunk beam
      ctx.fillStyle = '#6b4a2e'; ctx.fillRect(W.x - 10, W.y - 8, (W.W + 20) * Math.min(1, k * 2), 8);
      for (let i = 0; i < n; i++) {
        const x = W.x - 10 + (i / 70) * (W.W + 20);
        const sway = Math.sin(t * 1.3 + i * 0.7) * 1.5;
        ctx.strokeStyle = i % 3 ? '#8a6a3c' : '#a3804a'; ctx.lineWidth = 1.3;
        ctx.beginPath(); ctx.moveTo(x, W.y - 6);
        ctx.quadraticCurveTo(x + 8, W.y - 18 + sway, x + 22, W.y - 12 + sway);
        ctx.stroke();
        for (let j = 1; j < 6; j++) {
          const fx = x + j * 3.6, fy = W.y - 6 - Math.sin((j / 6) * Math.PI) * 9 + sway * (j / 6);
          ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(fx + 3, fy - 5); ctx.moveTo(fx, fy); ctx.lineTo(fx + 4, fy + 3); ctx.stroke();
        }
      }
      ctx.restore();
    },

    drawPalms(ctx, w, h, t) {
      const r = U.seeded(18);
      for (let i = 0; i < 16; i++) {
        const x = r() * w, th = h * (0.16 + r() * 0.16), y = this.ground - 4, lean = (r() - 0.5) * 0.25;
        const tx = x + Math.sin(lean) * th, ty = y - th;
        ctx.strokeStyle = 'rgba(96,74,60,0.55)'; ctx.lineWidth = 3 + r() * 2;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x, y - th * 0.5, tx, ty); ctx.stroke();
        ctx.strokeStyle = 'rgba(70,92,60,0.55)'; ctx.lineWidth = 2;
        for (let k = 0; k < 9; k++) {
          const a = -Math.PI / 2 + (k - 4) * 0.42 + Math.sin(t * 0.9 + i + k) * 0.05;
          const L = th * (0.24 + r() * 0.08);
          ctx.beginPath(); ctx.moveTo(tx, ty);
          ctx.quadraticCurveTo(tx + Math.cos(a) * L * 0.6, ty + Math.sin(a) * L * 0.6 - 6, tx + Math.cos(a) * L, ty + Math.sin(a) * L + L * 0.35);
          ctx.stroke();
        }
      }
    },

    drawMemory(ctx, w, h, A) {
      // a faint white silhouette of today's Quba Mosque, as if remembered in the clouds
      const a = U.smooth(0.2, 1, A) * 0.32;
      if (a <= 0) return;
      const cx = w / 2, base = this.wall.y - 40, s = Math.min(w, 900) / 900;
      ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = '#fffaf0';
      const bw = 520 * s, bh = 70 * s;
      ctx.fillRect(cx - bw / 2, base - bh, bw, bh);
      [-1, 1].forEach(side => [0.5, 0.42].forEach((f, j) => {
        const mx = cx + side * bw * f, mh = (230 - j * 20) * s;
        ctx.fillRect(mx - 7 * s, base - mh, 14 * s, mh);
        ctx.beginPath(); ctx.moveTo(mx - 9 * s, base - mh); ctx.lineTo(mx, base - mh - 26 * s); ctx.lineTo(mx + 9 * s, base - mh); ctx.fill();
        ctx.fillRect(mx - 10 * s, base - mh * 0.7, 20 * s, 4 * s);
      }));
      ctx.beginPath(); ctx.arc(cx, base - bh, 64 * s, Math.PI, 0); ctx.fill();
      for (let i = -3; i <= 3; i++) if (i) { ctx.beginPath(); ctx.arc(cx + i * 58 * s, base - bh, 18 * s, Math.PI, 0); ctx.fill(); }
      ctx.restore();
    },
  });
})();
