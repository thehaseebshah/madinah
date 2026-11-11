/* Station VIII — The Palms of al-'Aliyah.
   A backlit grove at golden hour. The hand is the wind: sweep across the crowns and they bend and
   hiss; tap a laden palm and ripe Ajwa dates fall. Gather seven. */
(function () {
  'use strict';

  ENGINE.register({
    key: 'palms',
    arabic: 'نخيل العالية',
    title: 'The Palm Groves',
    era: 'Ajwa dates of al-‘Aliyah',
    hint: 'Sweep to stir the wind · tap a palm to gather dates',
    sound: { reverb: 0.3 },
    story: `<p>Madinah was an oasis long before it was a city: a spread of palm gardens fed by wells and seasonal valleys. The groves of al-‘Aliyah, on the higher ground to the south, are still famous for <i>Ajwa</i>, a small, soft, nearly black date.</p>
            <p class="q"><span class="ar">مَنْ تَصَبَّحَ كُلَّ يَوْمٍ سَبْعَ تَمَرَاتٍ عَجْوَةً</span>“Whoever begins each day with seven Ajwa dates…” (Sahih al-Bukhari)</p>`,

    enter(env) {
      const { ctx } = env.canvas2d();
      this.ctx = ctx;
      this.dates = []; this.gathered = 0; this.wind = 0; this.motes = [];
      this.build(env);
      const b = env.bus;
      this.rustle = SND.noise(b, { color: 'white', type: 'bandpass', freq: 4200, q: 0.8, gain: 0.01 });
      this.rustleLo = SND.noise(b, { color: 'pink', type: 'bandpass', freq: 1400, q: 0.6, gain: 0.01 });
      this.breeze = SND.noise(b, { color: 'pink', type: 'lowpass', freq: 500, gain: 0.05 });
      this.birdClock = 1; this.text = 0;
    },
    resize(env) { this.build(env); },

    build(env) {
      const w = env.w, h = env.h, r = U.seeded(77);
      this.ground = h * 0.8;
      this.palms = [];
      [0, 1, 2].forEach(row => {
        const n = row === 2 ? Math.max(3, Math.round(w / 380)) : Math.max(3, Math.round(w / (row ? 260 : 150)));
        for (let i = 0; i < n; i++) {
          const scale = [0.45, 0.7, 1.05][row];
          const x = (i + 0.2 + r() * 0.6) / n * w;
          const H = h * (0.42 + r() * 0.18) * scale;
          const nf = 15 + Math.floor(r() * 5);
          const fronds = Array.from({ length: nf }, (_, k) => ({
            a: -Math.PI / 2 + ((k / (nf - 1)) - 0.5) * 3.6 + (r() - 0.5) * 0.25,
            L: H * (0.3 + r() * 0.1), droop: 0.6 + r() * 0.5, ph: r() * 6,
          }));
          this.palms.push({
            row, x, H, base: this.ground + row * h * 0.04 - h * 0.05 * (2 - row) * 0.4, lean: (r() - 0.5) * 0.18,
            fronds, sway: 0, vel: 0, ph: r() * 6, laden: row === 2 || (row === 1 && r() < 0.5), scale, shake: 0,
          });
        }
      });
      this.palms.sort((a, b) => a.row - b.row);
      this.motes = Array.from({ length: 70 }, () => ({ x: r() * w, y: r() * h * 0.8, s: r() * 1.6 + 0.4, ph: r() * 6 }));
    },

    crown(p) {
      const tx = p.x + Math.sin(p.lean + p.sway) * p.H, ty = p.base - p.H * Math.cos(p.lean + p.sway * 0.5);
      return [tx, ty];
    },

    down(env, p) {
      // tap the nearest laden palm whose crown is under the hand
      let best = null, bd = 1e9;
      for (const palm of this.palms) {
        if (!palm.laden) continue;
        const [tx, ty] = this.crown(palm);
        const d = Math.hypot(p.x - tx, p.y - ty);
        if (d < palm.H * 0.45 && d < bd) { bd = d; best = palm; }
      }
      if (best) {
        best.vel += (p.x < this.crown(best)[0] ? 1 : -1) * 0.9;
        best.shake = 1;
        const [tx, ty] = this.crown(best);
        const n = 1 + Math.floor(Math.random() * 2);
        for (let i = 0; i < n; i++) this.dates.push({ x: tx + (Math.random() - 0.5) * 30, y: ty + best.H * 0.06, vx: (Math.random() - 0.5) * 80, vy: -40 - Math.random() * 60, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 10, landed: false, bounces: 0, s: best.scale, floor: best.base + 6 + Math.random() * 20 });
        SND.swell(env.bus, { color: 'white', type: 'bandpass', f0: 2500, f1: 6000, dur: 1.2, gain: 0.08, pan: (tx / env.w) * 2 - 1 });
      } else {
        this.wind += 0.6;
        SND.swell(env.bus, { f0: 400, f1: 1600, dur: 1.6, gain: 0.06, pan: (p.x / env.w) * 2 - 1 });
      }
    },

    update(env, dt) {
      const p = env.pointer, t = env.time;
      const speed = Math.min(1.5, Math.hypot(p.vx, p.vy) / 40);
      this.wind = U.damp(this.wind, 0, 0.8, dt) + speed * dt * 2;
      for (const palm of this.palms) {
        const [tx, ty] = this.crown(palm);
        const near = Math.exp(-Math.pow((p.x - tx) / (palm.H * 0.6), 2) - Math.pow((p.y - ty) / (palm.H * 0.7), 2));
        const breeze = Math.sin(t * 0.5 + palm.x * 0.002) * 0.03 + U.noise1(t * 0.3 + palm.ph) * 0.02;
        palm.vel += (p.vx / 600) * near * (1.2 - palm.row * 0.2);
        palm.vel += (breeze + this.wind * 0.02 - palm.sway) * 6 * dt;
        palm.vel *= Math.exp(-2.2 * dt);
        palm.sway += palm.vel * dt * 3;
        palm.sway = U.clamp(palm.sway, -0.28, 0.28);
        palm.shake = Math.max(0, palm.shake - dt * 1.5);
      }
      const energy = this.palms.reduce((s, q) => s + Math.abs(q.vel), 0) / this.palms.length;
      this.rustle.set('gain', 0.008 + Math.min(0.09, energy * 0.25 + this.wind * 0.03), 0.15);
      this.rustleLo.set('gain', 0.006 + Math.min(0.05, energy * 0.12), 0.2);

      for (const d of this.dates) {
        if (d.landed) continue;
        d.vy += 1300 * dt; d.x += d.vx * dt; d.y += d.vy * dt; d.rot += d.vr * dt;
        if (d.y > d.floor) {
          d.y = d.floor; d.bounces++;
          SND.knock(env.bus, { f: 180 + Math.random() * 60, gain: 0.14 / d.bounces, click: 900, pan: (d.x / env.w) * 2 - 1 });
          if (d.bounces > 2 || Math.abs(d.vy) < 120) {
            d.landed = true; this.gathered++;
            SND.bell(env.bus, [523.25, 587.33, 659.25, 783.99, 880, 987.77, 1046.5][Math.min(6, this.gathered - 1)], { gain: 0.03, dur: 3, glass: true });
          } else { d.vy *= -0.35; d.vx *= 0.6; d.vr *= 0.5; }
        }
      }
      if (this.gathered >= 7) env.complete();
      this.text = U.damp(this.text, this.gathered >= 7 ? 1 : 0, 0.8, dt);

      this.birdClock -= dt;
      if (this.birdClock < 0) { this.birdClock = 1.5 + Math.random() * 4; Math.random() < 0.35 ? SND.coo(env.bus, { gain: 0.03 }) : SND.chirp(env.bus, { gain: 0.02 }); }
    },

    render(env) {
      const ctx = this.ctx, w = env.w, h = env.h, t = env.time;
      ctx.setTransform(env.dpr, 0, 0, env.dpr, 0, 0);
      const sunX = w * 0.58, sunY = h * 0.5;
      const sky = ctx.createLinearGradient(0, 0, 0, this.ground);
      sky.addColorStop(0, '#6f86a8'); sky.addColorStop(0.45, '#e8b77c'); sky.addColorStop(1, '#ffcf88');
      ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
      const sg = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, h * 0.9);
      sg.addColorStop(0, 'rgba(255,246,214,1)'); sg.addColorStop(0.05, 'rgba(255,230,170,0.85)'); sg.addColorStop(0.35, 'rgba(255,190,110,0.25)'); sg.addColorStop(1, 'rgba(255,170,90,0)');
      ctx.fillStyle = sg; ctx.fillRect(0, 0, w, h);

      // light shafts
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 7; i++) {
        const a = -0.9 + i * 0.3 + Math.sin(t * 0.1 + i) * 0.02;
        ctx.fillStyle = `rgba(255,220,160,${0.035 + 0.02 * Math.sin(t * 0.3 + i * 2)})`;
        ctx.beginPath(); ctx.moveTo(sunX, sunY);
        ctx.lineTo(sunX + Math.cos(a + Math.PI / 2) * h * 2 - 40, sunY + Math.sin(a + Math.PI / 2) * h * 2);
        ctx.lineTo(sunX + Math.cos(a + Math.PI / 2) * h * 2 + 40, sunY + Math.sin(a + Math.PI / 2) * h * 2);
        ctx.fill();
      }
      ctx.restore();

      let lastRow = -1;
      for (const palm of this.palms) {
        if (palm.row !== lastRow) {
          if (palm.row === 1) this.drawGround(ctx, w, h, t, 0);
          if (palm.row === 2) this.drawGround(ctx, w, h, t, 1);
          lastRow = palm.row;
        }
        this.drawPalm(ctx, palm, t, sunX, sunY);
      }

      for (const d of this.dates) {
        ctx.save(); ctx.translate(d.x, d.y); ctx.rotate(d.rot);
        const s = 4.5 * d.s + 1.5;
        ctx.fillStyle = '#1e0f0a'; ctx.beginPath(); ctx.ellipse(0, 0, s * 1.35, s * 0.8, 0, 0, 6.283); ctx.fill();
        ctx.fillStyle = 'rgba(255,200,140,0.35)'; ctx.beginPath(); ctx.ellipse(-s * 0.4, -s * 0.3, s * 0.5, s * 0.18, 0, 0, 6.283); ctx.fill();
        ctx.restore();
      }

      // dust motes in the sun
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (const m of this.motes) {
        const x = (m.x + t * 6 + Math.sin(t * 0.4 + m.ph) * 20) % w, y = m.y + Math.sin(t * 0.3 + m.ph) * 12;
        const near = Math.exp(-Math.hypot(x - sunX, y - sunY) / (h * 0.5));
        ctx.fillStyle = `rgba(255,236,190,${0.15 + near * 0.6})`; ctx.fillRect(x, y, m.s, m.s);
      }
      ctx.restore();

      this.drawTally(ctx, w, h);
    },

    drawGround(ctx, w, h, t, front) {
      if (!front) {
        const hz = ctx.createLinearGradient(0, this.ground - h * 0.12, 0, this.ground + h * 0.05);
        hz.addColorStop(0, 'rgba(255,200,130,0)'); hz.addColorStop(1, 'rgba(190,120,70,0.55)');
        ctx.fillStyle = hz; ctx.fillRect(0, this.ground - h * 0.12, w, h);
        return;
      }
      const gg = ctx.createLinearGradient(0, this.ground, 0, h);
      gg.addColorStop(0, '#5a3a22'); gg.addColorStop(1, '#24150c');
      ctx.fillStyle = gg; ctx.fillRect(0, this.ground + 10, w, h);
      // irrigation channel catching the sun
      const cy = this.ground + h * 0.035;
      ctx.fillStyle = '#2a1a10'; ctx.fillRect(0, cy - 5, w, 12);
      const cg = ctx.createLinearGradient(0, 0, w, 0);
      cg.addColorStop(0, 'rgba(255,200,130,0.1)'); cg.addColorStop(0.58, 'rgba(255,236,190,0.85)'); cg.addColorStop(1, 'rgba(255,200,130,0.1)');
      ctx.fillStyle = cg; ctx.fillRect(0, cy - 2, w, 5);
      ctx.fillStyle = 'rgba(255,250,230,0.8)';
      for (let i = 0; i < 40; i++) { const x = ((i * 97 + t * 40) % w); ctx.fillRect(x, cy - 1 + Math.sin(t * 3 + i) * 1.5, 6 + (i % 4) * 3, 1); }
    },

    drawPalm(ctx, p, t, sunX, sunY) {
      const dark = [U.hex('#a07a6a'), U.hex('#4a3230'), U.hex('#160d0a')][p.row];
      const rim = [0.1, 0.22, 0.4][p.row];
      const [tx, ty] = this.crown(p);
      const shakeX = Math.sin(t * 40) * p.shake * 3;
      // trunk with leaf-base scars
      ctx.strokeStyle = U.rgb(dark); ctx.lineCap = 'round';
      const segs = 18;
      for (let i = 0; i < segs; i++) {
        const k0 = i / segs, k1 = (i + 1) / segs;
        const x0 = U.lerp(p.x, tx, k0) + Math.sin(k0 * Math.PI) * p.H * 0.04, y0 = U.lerp(p.base, ty, k0);
        const x1 = U.lerp(p.x, tx, k1) + Math.sin(k1 * Math.PI) * p.H * 0.04, y1 = U.lerp(p.base, ty, k1);
        ctx.lineWidth = U.lerp(p.H * 0.05, p.H * 0.032, k0);
        ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1 - 0.5); ctx.stroke();
        ctx.strokeStyle = U.rgb(U.mix(dark, [255, 200, 130], rim * 0.35)); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(x0 - p.H * 0.02, y0); ctx.lineTo(x0 + p.H * 0.02, y0 - 3); ctx.stroke();
        ctx.strokeStyle = U.rgb(dark);
      }
      // date clusters
      if (p.laden) {
        for (let k = -1; k <= 1; k += 2) {
          const cx = tx + k * p.H * 0.05 + shakeX, cy = ty + p.H * 0.07;
          ctx.fillStyle = U.rgb(U.mix([90, 40, 20], dark, 0.4 + p.row * -0.1));
          for (let i = 0; i < 14; i++) {
            const a = i * 2.4, r = (i / 14) * p.H * 0.05;
            ctx.beginPath(); ctx.arc(cx + Math.cos(a) * r * 0.6, cy + Math.sin(a) * r * 0.4 + r, p.H * 0.011 + 1, 0, 6.283); ctx.fill();
          }
        }
      }
      // fronds, each a spine with leaflets; edges catch the low sun
      for (const f of p.fronds) {
        const a = f.a + p.sway * 1.6 + Math.sin(t * 1.4 + f.ph) * 0.03 * (1 + Math.abs(p.vel) * 4);
        const L = f.L;
        const ex = tx + Math.cos(a) * L + shakeX, ey = ty + Math.sin(a) * L + L * f.droop * (0.3 + 0.7 * Math.abs(Math.cos(a)));
        const mx = tx + Math.cos(a) * L * 0.55, my = ty + Math.sin(a) * L * 0.55 - L * 0.12;
        const toward = Math.max(0, 1 - Math.hypot(ex - sunX, ey - sunY) / (ctx.canvas.height * 0.5));
        ctx.strokeStyle = U.rgb(U.mix(dark, [255, 196, 120], rim * 0.25 + toward * 0.3 * rim));
        ctx.lineWidth = 1.5 + p.row; ctx.beginPath(); ctx.moveTo(tx, ty); ctx.quadraticCurveTo(mx, my, ex, ey); ctx.stroke();
        ctx.lineWidth = 0.8 + p.row * 0.4; ctx.beginPath();
        for (let i = 2; i < 22; i++) {
          const s = i / 22, u = 1 - s;
          const px = u * u * tx + 2 * u * s * mx + s * s * ex, py = u * u * ty + 2 * u * s * my + s * s * ey;
          const dx = 2 * u * (mx - tx) + 2 * s * (ex - mx), dy = 2 * u * (my - ty) + 2 * s * (ey - my), dl = Math.hypot(dx, dy);
          const nx = -dy / dl, ny = dx / dl, len = L * 0.16 * Math.sin(s * Math.PI) + 2;
          const flutter = Math.sin(t * 6 + i + f.ph) * Math.abs(p.vel) * 3;
          ctx.moveTo(px, py); ctx.lineTo(px + nx * len + dx / dl * len * 0.6, py + ny * len + dy / dl * len * 0.6 + 3 + flutter);
          ctx.moveTo(px, py); ctx.lineTo(px - nx * len + dx / dl * len * 0.6, py - ny * len + dy / dl * len * 0.6 + 3 - flutter);
        }
        ctx.stroke();
      }
    },

    drawTally(ctx, w, h) {
      if (document.getElementById('titlecard').classList.contains('show')) return;
      const y = Math.max(92, h * 0.16), gap = 22, x0 = w / 2 - gap * 3;
      ctx.save();
      for (let i = 0; i < 7; i++) {
        const got = i < this.gathered;
        ctx.fillStyle = got ? '#2a140c' : 'rgba(40,20,12,0.25)';
        ctx.strokeStyle = got ? 'rgba(255,220,170,0.8)' : 'rgba(255,240,210,0.45)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.ellipse(x0 + i * gap, y, 6.5, 4, -0.5, 0, 6.283); ctx.fill(); ctx.stroke();
      }
      ctx.textAlign = 'center'; ctx.font = '11px Marcellus, Georgia, serif'; ctx.fillStyle = 'rgba(40,22,12,0.85)';
      ctx.fillText(`${Math.min(7, this.gathered)} OF SEVEN AJWA`, w / 2, y + 22);
      const a = this.text;
      if (a > 0.02) {
        ctx.globalAlpha = a;
        const bg = ctx.createRadialGradient(w / 2, y + 78, 0, w / 2, y + 78, Math.min(w * 0.45, 380));
        bg.addColorStop(0, 'rgba(255,224,170,0.85)'); bg.addColorStop(1, 'rgba(255,224,170,0)');
        ctx.save(); ctx.translate(w / 2, y + 78); ctx.scale(1, 0.32); ctx.translate(-w / 2, -(y + 78));
        ctx.fillStyle = bg; ctx.fillRect(0, y - 400, w, 1000); ctx.restore();
        ctx.font = `${Math.round(Math.min(34, w * 0.055))}px Amiri, serif`; ctx.direction = 'rtl'; ctx.fillStyle = '#2a140c';
        ctx.fillText('مَنْ تَصَبَّحَ كُلَّ يَوْمٍ سَبْعَ تَمَرَاتٍ عَجْوَةً', w / 2, y + 66);
        ctx.direction = 'ltr'; ctx.font = 'italic 300 14px Spectral, Georgia, serif'; ctx.fillStyle = 'rgba(40,22,12,0.85)';
        ctx.fillText('“Whoever begins the day with seven Ajwa dates…”', w / 2, y + 92);
      }
      ctx.restore();
    },
  });
})();
