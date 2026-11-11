/* Station IX — Ar-Rawdah, a Garden of Paradise.
   Inside a pointed arch, on the green of the Rawdah's carpet, a gilded arabesque grows from
   wherever the hand passes: stems curl into spirals, split, put out leaves and end in blossoms,
   each blossom a small bell. */
(function () {
  'use strict';
  const SCALE = [392, 440, 523.25, 587.33, 659.25, 783.99, 880, 1046.5];

  ENGINE.register({
    key: 'rawdah',
    id: 'rawdah',
    arabic: 'الرَّوْضَة',
    title: 'A Garden of Paradise',
    era: 'Ar-Rawdah ash-Sharifah',
    hint: 'Draw with your hand to let the garden grow',
    sound: { reverb: 0.7 },
    story: `<p>Inside the Prophet’s Mosque, between the place where his house stood and his pulpit, lies a small area marked by its own green carpet and white columns: ar-Rawdah, the Garden.</p>
            <p class="q"><span class="ar">مَا بَيْنَ بَيْتِي وَمِنْبَرِي رَوْضَةٌ مِنْ رِيَاضِ الْجَنَّةِ</span>“Between my house and my pulpit is a garden from the gardens of Paradise.” (Sahih al-Bukhari and Sahih Muslim)</p>
            <p>The endless, branching vine of Islamic ornament, the <i>arabesque</i>, was long understood as an image of that garden: growth without end.</p>`,

    enter(env) {
      const { ctx } = env.canvas2d();
      this.ctx = ctx;
      this.tips = []; this.blooms = 0; this.idle = 0; this.lastSpawn = 0; this.text = 0;
      this.layout(env, true);
      const b = env.bus;
      this.fount = SND.noise(b, { color: 'pink', type: 'bandpass', freq: 2600, q: 0.5, gain: 0.025, pan: -0.5 });
      this.fount2 = SND.noise(b, { color: 'white', type: 'highpass', freq: 5000, gain: 0.004, pan: 0.5 });
      this.room = SND.noise(b, { color: 'brown', type: 'lowpass', freq: 240, gain: 0.07 });
      this.grow = SND.noise(b, { color: 'white', type: 'bandpass', freq: 7000, q: 1.5, gain: 0 });
      this.birdClock = 3;
    },
    resize(env) { this.layout(env, false); },

    layout(env, fresh) {
      const w = env.w, h = env.h, dpr = env.dpr;
      const old = this.layer;
      this.layer = document.createElement('canvas');
      this.layer.width = w * dpr; this.layer.height = h * dpr;
      this.lctx = this.layer.getContext('2d');
      this.lctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.lctx.lineCap = 'round'; this.lctx.lineJoin = 'round';
      if (old && !fresh) this.lctx.drawImage(old, 0, 0, w, h);
      const aw = Math.min(w * 0.84, h * 0.66), top = h * 0.2, bot = h * 0.88;
      this.arch = { cx: w / 2, aw, top, bot, spring: top + aw * 0.62 };
      this.carpet = this.makeCarpet(w, h, dpr);
    },

    makeCarpet(w, h, dpr) {
      const c = document.createElement('canvas'); c.width = w * dpr; c.height = h * dpr;
      const g = c.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0);
      const base = g.createRadialGradient(w / 2, h * 0.55, 0, w / 2, h * 0.55, Math.max(w, h) * 0.7);
      base.addColorStop(0, '#1d5a43'); base.addColorStop(1, '#0a2a20');
      g.fillStyle = base; g.fillRect(0, 0, w, h);
      // pile rows of the carpet
      g.globalAlpha = 0.06; g.fillStyle = '#000';
      for (let y = 0; y < h; y += 3) g.fillRect(0, y, w, 1);
      g.globalAlpha = 1;
      // faint woven medallions
      g.strokeStyle = 'rgba(160,220,180,0.06)'; g.lineWidth = 1;
      const step = 90;
      for (let y = step / 2; y < h; y += step) for (let x = (y / step % 2) * step / 2; x < w + step; x += step) {
        U.star8(g, x, y, 18, 0.6, Math.PI / 8); g.stroke();
      }
      return c;
    },

    spawn(x, y, a, depth = 0, w = 3.2, curl) {
      if (this.tips.length > 180) return;
      this.tips.push({
        x, y, a, curl: curl == null ? (Math.random() < 0.5 ? -1 : 1) * (1.2 + Math.random() * 1.2) : curl,
        speed: 55 + Math.random() * 35, life: 0, max: (2.2 + Math.random() * 1.6) * Math.pow(0.72, depth),
        w, depth, leafClock: 0, side: 1, px: x, py: y,
      });
    },

    inside(x, y) {
      const { cx, aw, top, bot, spring } = this.arch;
      if (y > bot - 6 || Math.abs(x - cx) > aw / 2 - 8) return false;
      if (y < spring) { // within the pointed head
        const k = (spring - y) / (spring - top);
        return Math.abs(x - cx) < (aw / 2 - 8) * Math.sqrt(Math.max(0, 1 - k * k)) * (1 - k * 0.15);
      }
      return true;
    },

    down(env, p) { this.burst(env, p, 3); },
    move(env, p) {
      this.idle = 0;
      const sp = Math.hypot(p.vx, p.vy);
      if (sp > 2 && env.time - this.lastSpawn > (p.down ? 0.06 : 0.16)) {
        this.lastSpawn = env.time;
        if (this.inside(p.x, p.y)) this.spawn(p.x, p.y, Math.atan2(p.vy, p.vx) + (Math.random() - 0.5) * 1.2);
      }
    },
    burst(env, p, n) {
      if (!this.inside(p.x, p.y)) return;
      for (let i = 0; i < n; i++) this.spawn(p.x, p.y, (i / n) * 6.283 + Math.random());
      SND.bell(env.bus, 196, { gain: 0.03, dur: 4, glass: true, pan: (p.x / env.w) * 2 - 1 });
    },

    update(env, dt) {
      const L = this.lctx;
      this.idle += dt;
      if (this.idle > 5 && this.tips.length < 3) {
        this.idle = 3.5;
        const A = this.arch;
        this.spawn(A.cx + (Math.random() - 0.5) * A.aw * 0.5, A.bot - 20, -Math.PI / 2 + (Math.random() - 0.5) * 0.6);
      }
      const next = [];
      for (const t of this.tips) {
        t.life += dt;
        const k = t.life / t.max;
        t.a += t.curl * dt * (0.5 + k * k * 4.5);
        t.px = t.x; t.py = t.y;
        t.x += Math.cos(t.a) * t.speed * dt * (1 - k * 0.5);
        t.y += Math.sin(t.a) * t.speed * dt * (1 - k * 0.5);
        const wd = t.w * (1 - k * 0.75);
        // stem: a dark under-stroke and a gilded line
        L.strokeStyle = 'rgba(6,20,14,0.55)'; L.lineWidth = wd + 2;
        L.beginPath(); L.moveTo(t.px, t.py + 1); L.lineTo(t.x, t.y + 1); L.stroke();
        L.strokeStyle = `rgb(${220 + k * 20 | 0},${170 + k * 30 | 0},${80 + k * 40 | 0})`; L.lineWidth = wd;
        L.beginPath(); L.moveTo(t.px, t.py); L.lineTo(t.x, t.y); L.stroke();
        t.leafClock += dt;
        if (t.leafClock > 0.22 && k < 0.85) {
          t.leafClock = 0; t.side *= -1;
          this.leaf(L, t.x, t.y, t.a + t.side * 0.9, 7 + t.w * 2.4 * (1 - k));
        }
        if (t.depth < 3 && Math.random() < dt * 0.9 && k > 0.15 && k < 0.7) {
          this.spawn(t.x, t.y, t.a + Math.sign(t.curl) * -0.6, t.depth + 1, wd * 0.8, -t.curl * (0.8 + Math.random() * 0.6));
        }
        if (!this.inside(t.x, t.y)) continue;
        if (t.life >= t.max) { this.bloom(env, L, t); continue; }
        next.push(t);
      }
      this.tips = next;
      this.grow.set('gain', Math.min(0.02, this.tips.length * 0.0006), 0.2);
      this.text = U.damp(this.text, this.blooms >= 10 ? 1 : 0, 0.7, dt);
      if (this.blooms >= 24) env.complete();
      this.birdClock -= dt;
      if (this.birdClock < 0) { this.birdClock = 4 + Math.random() * 6; SND.chirp(env.bus, { gain: 0.01 }); }
    },

    leaf(L, x, y, a, s) {
      L.save(); L.translate(x, y); L.rotate(a);
      L.beginPath(); L.moveTo(0, 0);
      L.quadraticCurveTo(s * 0.5, -s * 0.38, s, 0); L.quadraticCurveTo(s * 0.5, s * 0.38, 0, 0);
      L.fillStyle = '#3f9b72'; L.fill();
      L.strokeStyle = 'rgba(232,190,100,0.9)'; L.lineWidth = 0.8; L.stroke();
      L.beginPath(); L.moveTo(0, 0); L.lineTo(s * 0.85, 0); L.strokeStyle = 'rgba(232,190,100,0.6)'; L.stroke();
      L.restore();
    },

    bloom(env, L, t) {
      this.blooms++;
      const s = 6 + t.w * 2.2 + Math.random() * 4, n = U.pick([5, 6, 8]);
      const palette = [['#f4ead2', '#e9b9a8'], ['#f6e3b0', '#d79a5a'], ['#e8f1e6', '#9fd3b6']][this.blooms % 3];
      L.save(); L.translate(t.x, t.y); L.rotate(t.a);
      for (let i = 0; i < n; i++) {
        L.rotate(6.283 / n);
        L.beginPath(); L.moveTo(0, 0);
        L.bezierCurveTo(s * 0.4, -s * 0.5, s * 1.1, -s * 0.25, s, 0);
        L.bezierCurveTo(s * 1.1, s * 0.25, s * 0.4, s * 0.5, 0, 0);
        const g = L.createLinearGradient(0, 0, s, 0);
        g.addColorStop(0, palette[1]); g.addColorStop(1, palette[0]);
        L.fillStyle = g; L.fill();
        L.strokeStyle = 'rgba(150,100,40,0.6)'; L.lineWidth = 0.7; L.stroke();
      }
      L.fillStyle = '#d9a441'; L.beginPath(); L.arc(0, 0, s * 0.22, 0, 6.283); L.fill();
      L.fillStyle = '#fff1c8'; for (let i = 0; i < 6; i++) { const a = i * 1.047; L.fillRect(Math.cos(a) * s * 0.13 - 0.6, Math.sin(a) * s * 0.13 - 0.6, 1.2, 1.2); }
      L.restore();
      const yk = 1 - U.clamp((t.y - this.arch.top) / (this.arch.bot - this.arch.top));
      SND.bell(env.bus, SCALE[Math.min(7, Math.floor(yk * 8))], { gain: 0.022, dur: 3, glass: true, pan: (t.x / env.w) * 2 - 1 });
    },

    render(env) {
      const ctx = this.ctx, w = env.w, h = env.h, t = env.time;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(this.carpet, 0, 0);
      ctx.setTransform(env.dpr, 0, 0, env.dpr, 0, 0);

      // the world outside the arch is dim marble
      ctx.save();
      ctx.fillStyle = 'rgba(5,10,8,0.62)'; ctx.fillRect(0, 0, w, h);
      this.archClip(ctx);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(this.carpet, 0, 0);
      ctx.drawImage(this.layer, 0, 0);
      ctx.restore();
      ctx.setTransform(env.dpr, 0, 0, env.dpr, 0, 0);

      // soft light falling from above into the garden
      const A = this.arch;
      const lg = ctx.createRadialGradient(A.cx, A.top, 0, A.cx, A.top, h * 0.9);
      lg.addColorStop(0, `rgba(255,236,190,${0.16 + 0.03 * Math.sin(t * 0.7)})`); lg.addColorStop(1, 'rgba(255,236,190,0)');
      ctx.save(); this.archClip(ctx); ctx.fillStyle = lg; ctx.globalCompositeOperation = 'lighter'; ctx.fillRect(0, 0, w, h); ctx.restore();

      // the growing tips glow
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (const tp of this.tips) {
        const g = ctx.createRadialGradient(tp.x, tp.y, 0, tp.x, tp.y, 14);
        g.addColorStop(0, 'rgba(255,220,140,0.6)'); g.addColorStop(1, 'rgba(255,220,140,0)');
        ctx.fillStyle = g; ctx.fillRect(tp.x - 14, tp.y - 14, 28, 28);
      }
      ctx.restore();

      // gilded arch frame
      ctx.save();
      this.archOutline(ctx, -6); ctx.strokeStyle = 'rgba(207,162,80,0.85)'; ctx.lineWidth = 2; ctx.stroke();
      this.archOutline(ctx, -14); ctx.strokeStyle = 'rgba(207,162,80,0.35)'; ctx.lineWidth = 1; ctx.stroke();
      this.archOutline(ctx, -20); ctx.setLineDash([1, 7]); ctx.strokeStyle = 'rgba(240,210,140,0.6)'; ctx.lineWidth = 2; ctx.stroke();
      ctx.restore();

      this.drawText(ctx, w, h);
    },

    // Pointed arch shape built from two circular arcs that meet at the apex.
    archShape(ctx, grow) {
      const { cx, aw, top, bot, spring } = this.arch;
      const half = aw / 2 + grow, apex = top - grow, sp = spring;
      const r = ((sp - apex) * (sp - apex) + half * half) / (2 * half) ; // circle through spring point & apex, centred on spring line
      const lc = cx - half + r, rc = cx + half - r;
      const aApexL = Math.atan2(apex - sp, cx - lc), aApexR = Math.atan2(apex - sp, cx - rc);
      ctx.beginPath();
      ctx.moveTo(cx - half, bot + grow);
      ctx.lineTo(cx - half, sp);
      ctx.arc(lc, sp, r, Math.PI, aApexL, false);
      ctx.arc(rc, sp, r, aApexR, 0, false);
      ctx.lineTo(cx + half, bot + grow);
      ctx.closePath();
    },
    archClip(ctx) { this.archShape(ctx, 0); ctx.clip(); },
    archOutline(ctx, inset) { this.archShape(ctx, -inset); },

    drawText(ctx, w, h) {
      const a = this.text; if (a < 0.02) return;
      ctx.save(); ctx.globalAlpha = a; ctx.textAlign = 'center';
      const fs = Math.round(Math.min(30, w * 0.05));
      const y = Math.max(90, this.arch.top - fs * 0.9);
      ctx.fillStyle = '#fff3d6'; ctx.shadowColor = 'rgba(0,0,0,0.7)'; ctx.shadowBlur = 12;
      ctx.font = `${fs}px Amiri, serif`; ctx.direction = 'rtl';
      ctx.fillText('مَا بَيْنَ بَيْتِي وَمِنْبَرِي رَوْضَةٌ مِنْ رِيَاضِ الْجَنَّةِ', w / 2, y);
      ctx.direction = 'ltr'; ctx.shadowBlur = 0;
      ctx.font = `italic 300 ${Math.round(Math.max(12, fs * 0.46))}px Spectral, Georgia, serif`; ctx.fillStyle = 'rgba(242,233,214,0.85)';
      ctx.fillText('“Between my house and my pulpit is a garden from the gardens of Paradise.”', w / 2, y + fs * 0.85, w - 32);
      ctx.restore();
    },
  });
})();
