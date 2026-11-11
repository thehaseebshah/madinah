/* Station VII — The Well of Rumah.
   Looking straight down a basalt shaft at water that holds the evening sky. Touch it and it
   ripples (a live wave simulation), each drop ringing in the stone throat of the well. */
(function () {
  'use strict';
  const S = 200; // simulation grid

  ENGINE.register({
    key: 'well',
    id: 'well',
    arabic: 'بئر رومة',
    title: 'The Well of Rumah',
    era: 'An endowment of ‘Uthman ibn ‘Affan',
    hint: 'Touch the water · drag to stir it',
    sound: { reverb: 0.95 },
    story: `<p>In early Madinah, sweet water was scarce, and the best well, Rumah, belonged to a man who sold its water. The Prophet ﷺ asked who would buy it and give it freely to all. ‘Uthman ibn ‘Affan bought it and made it a <i>waqf</i>, an endowment whose water belonged to everyone.</p>
            <p class="q"><span class="ar">مَنْ يَشْتَرِي بِئْرَ رُومَةَ فَيَجْعَلَ دَلْوَهُ مَعَ دِلَاءِ الْمُسْلِمِينَ</span>“Who will buy the well of Rumah, and make his bucket one among the buckets of the Muslims?” (Jami‘ at-Tirmidhi)</p>
            <p>The well still stands in the north-west of the city, among palm groves.</p>`,

    enter(env) {
      const { ctx } = env.canvas2d();
      this.ctx = ctx;
      this.a = new Float32Array(S * S); this.b = new Float32Array(S * S);
      this.sim = document.createElement('canvas'); this.sim.width = this.sim.height = S;
      this.sctx = this.sim.getContext('2d');
      this.img = this.sctx.createImageData(S, S);
      this.refl = this.makeReflection();
      this.drops = 0; this.lastDrag = 0; this.text = 0;
      this.layout(env);
      const b = env.bus;
      // wind across the mouth of the shaft: a hollow, bottle-like resonance
      this.throat = SND.noise(b, { color: 'pink', type: 'bandpass', freq: 174, q: 9, gain: 0.25 });
      this.throat2 = SND.noise(b, { color: 'pink', type: 'bandpass', freq: 349, q: 12, gain: 0.08 });
      SND.lfo(b, this.throat.gain && this.throat.gain.gain, 0.08, 0.12);
      this.air = SND.noise(b, { color: 'brown', type: 'lowpass', freq: 260, gain: 0.05 });
      this.dripClock = 2;
    },
    resize(env) { this.layout(env); },

    layout(env) {
      this.cx = env.w / 2; this.cy = env.h * 0.54;
      this.Rout = Math.min(env.w, env.h) * 0.33;
      this.Rw = this.Rout * 0.58;
    },

    makeReflection() {
      const c = document.createElement('canvas'); c.width = c.height = S;
      const g = c.getContext('2d');
      const sky = g.createRadialGradient(S * 0.42, S * 0.4, 0, S / 2, S / 2, S * 0.62);
      sky.addColorStop(0, '#f6c98e'); sky.addColorStop(0.35, '#c77f74'); sky.addColorStop(0.7, '#3d3a6e'); sky.addColorStop(1, '#0b1028');
      g.fillStyle = sky; g.fillRect(0, 0, S, S);
      // evening star and crescent
      g.fillStyle = '#fffbe8'; g.beginPath(); g.arc(S * 0.66, S * 0.3, 1.6, 0, 6.283); g.fill();
      g.beginPath(); g.arc(S * 0.34, S * 0.62, 7, 0, 6.283); g.fill();
      g.fillStyle = '#7a5e7a'; g.beginPath(); g.arc(S * 0.34 + 3, S * 0.62 - 2, 6.4, 0, 6.283); g.fill();
      // palm fronds leaning over the well, reflected
      g.strokeStyle = 'rgba(10,8,20,0.92)'; g.lineWidth = 2;
      const r = U.seeded(4);
      for (let k = 0; k < 7; k++) {
        const a = 0.2 + k * 0.17, L = S * (0.32 + r() * 0.15);
        const x0 = S * 1.02, y0 = S * 0.05;
        const x1 = x0 - Math.cos(a) * L, y1 = y0 + Math.sin(a) * L;
        g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo((x0 + x1) / 2, (y0 + y1) / 2 - 10, x1, y1); g.stroke();
        for (let i = 2; i < 18; i++) {
          const t = i / 18, px = U.lerp(x0, x1, t), py = U.lerp(y0, y1, t) - Math.sin(t * Math.PI) * 5;
          g.lineWidth = 1; g.beginPath(); g.moveTo(px, py); g.lineTo(px - 4 - t * 4, py + 6 + t * 5); g.moveTo(px, py); g.lineTo(px + 2, py + 8 + t * 4); g.stroke();
        }
        g.lineWidth = 2;
      }
      return g.getImageData(0, 0, S, S).data;
    },

    splash(x, y, r, amp) {
      const a = this.a;
      for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) {
        const d = Math.hypot(i, j); if (d > r) continue;
        const xi = (x + i) | 0, yj = (y + j) | 0;
        if (xi < 1 || yj < 1 || xi >= S - 1 || yj >= S - 1) continue;
        a[yj * S + xi] += amp * (Math.cos((d / r) * Math.PI) + 1) * 0.5;
      }
    },
    toSim(p) {
      const sx = ((p.x - this.cx) / this.Rw * 0.5 + 0.5) * S, sy = ((p.y - this.cy) / this.Rw * 0.5 + 0.5) * S;
      return [sx, sy, Math.hypot(p.x - this.cx, p.y - this.cy) < this.Rw];
    },
    touch(env, p, strong) {
      const [sx, sy, inside] = this.toSim(p);
      if (!inside) return false;
      this.splash(sx, sy, strong ? 4 : 2.5, strong ? -380 : -160);
      const d = Math.hypot(p.x - this.cx, p.y - this.cy) / this.Rw;
      const pan = (p.x - this.cx) / this.Rw;
      SND.drop(env.bus, { f: U.lerp(1300, 520, d) * (strong ? 1 : 1.3), gain: strong ? 0.16 : 0.05, pan: pan * 0.6 });
      if (strong) SND.thump(env.bus, { f: 70, gain: 0.08, dur: 0.4 });
      return true;
    },
    down(env, p) { if (this.touch(env, p, true)) { this.drops++; } },
    move(env, p) {
      if (!p.down) return;
      if (env.time - this.lastDrag > 0.05) { this.lastDrag = env.time; this.touch(env, p, false); }
    },

    update(env, dt) {
      // two steps of the wave equation per frame
      for (let step = 0; step < 2; step++) {
        const a = this.a, b = this.b;
        for (let y = 1; y < S - 1; y++) {
          const row = y * S;
          for (let x = 1; x < S - 1; x++) {
            const i = row + x;
            b[i] = ((a[i - 1] + a[i + 1] + a[i - S] + a[i + S]) * 0.5 - b[i]) * 0.986;
          }
        }
        this.a = b; this.b = a;
      }
      // a slow drip from the rope
      this.dripClock -= dt;
      if (this.dripClock < 0) {
        this.dripClock = 2.5 + Math.random() * 5;
        const ang = Math.random() * 6.28, rr = Math.random() * 0.5;
        const p = { x: this.cx + Math.cos(ang) * this.Rw * rr, y: this.cy + Math.sin(ang) * this.Rw * rr };
        const [sx, sy] = this.toSim(p); this.splash(sx, sy, 2, -120);
        SND.drop(env.bus, { f: 900 + Math.random() * 500, gain: 0.04, pan: (Math.random() - 0.5) * 0.5 });
      }
      this.text = U.damp(this.text, this.drops >= 3 ? 1 : 0, 0.8, dt);
      if (this.drops >= 7) env.complete();
    },

    render(env) {
      const ctx = this.ctx, w = env.w, h = env.h, t = env.time, cx = this.cx, cy = this.cy;
      ctx.setTransform(env.dpr, 0, 0, env.dpr, 0, 0);

      // sand around the well, dappled by palm shadow
      const sand = ctx.createRadialGradient(cx, cy, this.Rout, cx, cy, Math.max(w, h) * 0.8);
      sand.addColorStop(0, '#9c7a56'); sand.addColorStop(1, '#3a2a20');
      ctx.fillStyle = sand; ctx.fillRect(0, 0, w, h);
      ctx.save(); ctx.globalAlpha = 0.2; ctx.strokeStyle = '#140c06'; ctx.lineCap = 'round';
      try { ctx.filter = 'blur(2.5px)'; } catch (e) {}
      const ox = w + 30, oy = -30, L = Math.min(w, h) * 0.62;
      for (let i = 0; i < 9; i++) {
        const a = Math.PI * 0.55 + (i / 8 - 0.5) * 1.3 + Math.sin(t * 0.6 + i * 1.3) * 0.025;
        const ex = ox + Math.cos(a) * L, ey = oy + Math.sin(a) * L;
        const mx = ox + Math.cos(a) * L * 0.5 - Math.sin(a) * 30, my = oy + Math.sin(a) * L * 0.5 + Math.cos(a) * 30;
        ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.quadraticCurveTo(mx, my, ex, ey); ctx.stroke();
        ctx.lineWidth = 3; ctx.beginPath();
        for (let k = 3; k < 26; k++) {
          const s = k / 26, u = 1 - s;
          const px = u * u * ox + 2 * u * s * mx + s * s * ex, py = u * u * oy + 2 * u * s * my + s * s * ey;
          const len = 34 * Math.sin(s * Math.PI) + 6;
          ctx.moveTo(px, py); ctx.lineTo(px + Math.cos(a + 0.9) * len, py + Math.sin(a + 0.9) * len);
          ctx.moveTo(px, py); ctx.lineTo(px + Math.cos(a - 0.9) * len, py + Math.sin(a - 0.9) * len);
        }
        ctx.stroke();
      }
      ctx.restore();

      // stone well-head
      const Ro = this.Rout;
      ctx.fillStyle = '#2b2522'; ctx.beginPath(); ctx.arc(cx, cy, Ro * 1.12, 0, 6.283); ctx.fill();
      const blocks = 22;
      for (let i = 0; i < blocks; i++) {
        const a0 = (i / blocks) * 6.283 + 0.01, a1 = ((i + 1) / blocks) * 6.283 - 0.012;
        ctx.beginPath(); ctx.arc(cx, cy, Ro * 1.1, a0, a1); ctx.arc(cx, cy, Ro * 0.93, a1, a0, true); ctx.closePath();
        const shade = 0.75 + 0.25 * Math.cos(a0 + 2.2) + ((i * 7) % 5) * 0.03;
        ctx.fillStyle = U.rgb(U.mix([30, 27, 28], [96, 86, 80], shade * 0.7));
        ctx.fill();
      }
      // the shaft: courses of stone receding into dark
      const rings = 9;
      for (let k = 0; k < rings; k++) {
        const r0 = U.lerp(Ro * 0.93, this.Rw * 1.02, k / rings), r1 = U.lerp(Ro * 0.93, this.Rw * 1.02, (k + 1) / rings);
        const dark = k / rings;
        const n = 18 + k * 2;
        for (let i = 0; i < n; i++) {
          const off = (k % 2) * 0.5;
          const a0 = ((i + off) / n) * 6.283, a1 = ((i + 1 + off) / n) * 6.283 - 0.02;
          ctx.beginPath(); ctx.arc(cx, cy, r0, a0, a1); ctx.arc(cx, cy, r1 + 0.6, a1, a0, true); ctx.closePath();
          const lightSide = 0.5 + 0.5 * Math.cos(a0 - 4.0);
          ctx.fillStyle = U.rgb(U.mix([70, 62, 58], [8, 7, 10], Math.pow(dark, 0.7) * 0.9 + (1 - lightSide) * 0.1));
          ctx.fill();
        }
      }

      // the water
      this.renderWater();
      ctx.save();
      ctx.beginPath(); ctx.arc(cx, cy, this.Rw, 0, 6.283); ctx.clip();
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(this.sim, cx - this.Rw, cy - this.Rw, this.Rw * 2, this.Rw * 2);
      const v = ctx.createRadialGradient(cx, cy, this.Rw * 0.6, cx, cy, this.Rw);
      v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.55)');
      ctx.fillStyle = v; ctx.fillRect(cx - this.Rw, cy - this.Rw, this.Rw * 2, this.Rw * 2);
      ctx.restore();

      // wooden beam, pulley and rope across the mouth
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(-0.42);
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(-Ro * 1.25 + 14, -Ro * 0.05 + 18, Ro * 2.5, Ro * 0.1);
      const wood = ctx.createLinearGradient(0, -Ro * 0.05, 0, Ro * 0.05);
      wood.addColorStop(0, '#8a6440'); wood.addColorStop(0.5, '#6a4a2c'); wood.addColorStop(1, '#3e2a18');
      ctx.fillStyle = wood; ctx.fillRect(-Ro * 1.25, -Ro * 0.05, Ro * 2.5, Ro * 0.1);
      ctx.strokeStyle = 'rgba(30,18,8,0.4)';
      for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(-Ro * 1.25, -Ro * 0.03 + i * Ro * 0.012); ctx.lineTo(Ro * 1.25, -Ro * 0.03 + i * Ro * 0.012 + Math.sin(i) * 2); ctx.stroke(); }
      ctx.fillStyle = '#4a3420'; ctx.beginPath(); ctx.arc(0, 0, Ro * 0.075, 0, 6.283); ctx.fill();
      ctx.strokeStyle = '#c9a66e'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, Ro * 0.05, 0, 6.283); ctx.stroke();
      ctx.restore();

      this.drawText(ctx, w, h);
    },

    renderWater() {
      const a = this.a, d = this.img.data, R = this.refl;
      for (let y = 1; y < S - 1; y++) {
        for (let x = 1; x < S - 1; x++) {
          const i = y * S + x;
          const dx = a[i - 1] - a[i + 1], dy = a[i - S] - a[i + S];
          let sx = (x + dx * 0.05) | 0, sy = (y + dy * 0.05) | 0;
          sx = sx < 0 ? 0 : sx >= S ? S - 1 : sx; sy = sy < 0 ? 0 : sy >= S ? S - 1 : sy;
          const j = (sy * S + sx) * 4, o = i * 4;
          const spec = (dx - dy) * 0.18;
          d[o] = R[j] + spec; d[o + 1] = R[j + 1] + spec; d[o + 2] = R[j + 2] + spec * 0.8; d[o + 3] = 255;
        }
      }
      this.sctx.putImageData(this.img, 0, 0);
    },

    drawText(ctx, w, h) {
      const a = this.text; if (a < 0.02) return;
      ctx.save(); ctx.globalAlpha = a; ctx.textAlign = 'center';
      const y = Math.max(84, this.cy - this.Rout * 1.12 - 34);
      ctx.font = `${Math.round(Math.min(18, w * 0.04))}px Marcellus, Georgia, serif`;
      ctx.fillStyle = 'rgba(255,240,215,0.92)';
      ctx.fillText('“Who will buy the well of Rumah…?”', w / 2, y);
      ctx.font = 'italic 300 13px Spectral, Georgia, serif'; ctx.fillStyle = 'rgba(255,240,215,0.7)';
      ctx.fillText('‘Uthman bought it, and made its water free for all.', w / 2, y + 20);
      ctx.restore();
    },
  });
})();
