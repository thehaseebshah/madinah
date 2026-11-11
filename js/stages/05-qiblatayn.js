/* Station V — The Two Qiblas.
   A congregation of light seen from above, rows facing Jerusalem. Turn the qibla by hand toward
   Makkah: the rows swing after you, the front first and the back last. Two tones beat against each
   other while the direction is off, and fall into a single still tone when it is true. */
(function () {
  'use strict';
  const JERUSALEM = 332, MAKKAH = 176; // bearings from Madinah, degrees clockwise from north
  const rad = d => (d - 90) * Math.PI / 180; // bearing -> canvas angle
  const angDiff = (a, b) => { let d = ((a - b) % 360 + 540) % 360 - 180; return d; };

  ENGINE.register({
    key: 'qiblatayn',
    arabic: 'القِبْلَتَيْن',
    title: 'The Two Qiblas',
    era: 'Rajab or Sha‘ban, 2 AH · 624 CE',
    hint: 'Drag around the circle to turn toward Makkah',
    sound: { reverb: 0.5 },
    story: `<p>For the first months in Madinah, the Muslims prayed facing Jerusalem. Then, the narrations say, during a prayer in the mosque of Banu Salimah, the command came to turn toward the Ka‘bah in Makkah, and the congregation turned where they stood.</p>
            <p>The mosque has been called <i>Masjid al-Qiblatayn</i>, the Mosque of the Two Qiblas, ever since. From Madinah, Jerusalem lies at about 332° and Makkah at about 176°: nearly opposite directions.</p>`,

    enter(env) {
      const { ctx } = env.canvas2d();
      this.ctx = ctx;
      this.target = JERUSALEM; this.aligned = 0; this.verse = 0;
      this.layout(env);
      const b = env.bus;
      this.d1 = SND.drone(b, 196, { gain: 0.035, cutoff: 1200, pan: -0.3 });
      this.d2 = SND.drone(b, 196, { gain: 0.035, cutoff: 1200, pan: 0.3 });
      this.fifth = SND.drone(b, 294, { gain: 0.0, cutoff: 1600 });
      this.octave = SND.drone(b, 98, { gain: 0.0, cutoff: 600 });
      this.air = SND.noise(b, { color: 'brown', type: 'lowpass', freq: 300, gain: 0.05 });
      this.lastTick = Math.round(JERUSALEM / 5);
    },
    resize(env) { this.layout(env); },

    layout(env) {
      const w = env.w, h = env.h;
      this.cx = w / 2; this.cy = h * 0.48;
      this.R = Math.min(w, h) * (w < 720 ? 0.3 : 0.3);
      const old = this.rows;
      this.rows = [];
      const nRows = 13, gap = this.R * 1.25 / nRows;
      for (let k = 0; k < nRows; k++) {
        const off = -this.R * 0.48 + k * gap + gap; // distance behind the front
        const half = Math.sqrt(Math.max(0, this.R * this.R * 0.62 - off * off));
        const mats = [];
        const spacing = Math.max(13, this.R * 0.07);
        for (let x = -half; x <= half; x += spacing) mats.push({ x, ph: Math.random() * 6.28 });
        this.rows.push({ off, mats, ang: old && old[k] ? old[k].ang : JERUSALEM, vel: 0 });
      }
    },

    setFromPointer(env, p) {
      const a = Math.atan2(p.y - this.cy, p.x - this.cx) * 180 / Math.PI + 90;
      this.target = (a + 360) % 360;
    },
    down(env, p) { this.setFromPointer(env, p); },
    move(env, p) { if (p.down) this.setFromPointer(env, p); },
    key(env, e) {
      if (e.key === 'ArrowUp') this.target = (this.target + 358) % 360;
      if (e.key === 'ArrowDown') this.target = (this.target + 2) % 360;
    },

    update(env, dt) {
      // rows follow like a congregation: the front turns first
      this.rows.forEach((r, k) => {
        const stiff = 9 / (1 + k * 0.32), d = angDiff(this.target, r.ang);
        r.vel += d * stiff * dt; r.vel *= Math.exp(-5 * dt);
        r.ang = (r.ang + r.vel * dt * 6 + 360) % 360;
        if (Math.abs(r.vel) > 2 && Math.random() < dt * 0.6) SND.swell(env.bus, { f0: 900, f1: 2200, dur: 0.7, gain: 0.012, color: 'white', pan: Math.random() - 0.5 });
      });
      const front = this.rows[0].ang;
      const off = Math.abs(angDiff(front, MAKKAH)) / 180; // 0 aligned .. 1 opposite
      // beating between two tones closes to unison as the qibla comes true
      this.d2.set(196 * (1 + off * 0.045 + 0.0004));
      this.d1.set(196);
      const near = U.smooth(0.06, 0.0, off);
      this.fifth.setGain(0.03 * near, 0.4);
      this.octave.setGain(0.04 * near, 0.4);
      // compass ticks
      const tick = Math.round(this.target / 5);
      if (tick !== this.lastTick) { this.lastTick = tick; SND.knock(env.bus, { f: 900, gain: 0.03, click: 5000 }); }

      const allNear = this.rows.every(r => Math.abs(angDiff(r.ang, MAKKAH)) < 3);
      this.aligned = U.damp(this.aligned, allNear ? 1 : 0, 1.6, dt);
      if (allNear && !this.verse) {
        this.verse = 1;
        SND.bell(env.bus, 392, { gain: 0.06, dur: 7 });
        SND.bell(env.bus, 587.33, { gain: 0.04, dur: 7, delay: 0.25 });
        SND.glow(env.bus, 98, { gain: 0.06, dur: 9 });
        env.complete();
      }
    },

    render(env) {
      const ctx = this.ctx, w = env.w, h = env.h, t = env.time, cx = this.cx, cy = this.cy, R = this.R;
      const al = this.aligned;
      ctx.setTransform(env.dpr, 0, 0, env.dpr, 0, 0);
      const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.75);
      bg.addColorStop(0, U.rgb(U.mix([18, 26, 52], [20, 44, 44], al)));
      bg.addColorStop(1, '#04060e');
      ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);

      // graticule
      ctx.strokeStyle = 'rgba(217,187,133,0.07)'; ctx.lineWidth = 1;
      for (let i = 1; i <= 6; i++) { ctx.beginPath(); ctx.arc(cx, cy, R * i * 0.33, 0, 6.283); ctx.stroke(); }
      for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * R * 2, cy + Math.sin(a) * R * 2); ctx.stroke(); }

      // the congregation
      this.rows.forEach((r, k) => {
        const a = rad(r.ang), fx = Math.cos(a), fy = Math.sin(a), sx = -fy, sy = fx;
        const bx = cx - fx * r.off, by = cy - fy * r.off;
        for (const m of r.mats) {
          const x = bx + sx * m.x, y = by + sy * m.x;
          const glow = 0.55 + 0.25 * Math.sin(t * 1.3 + m.ph) + al * 0.3;
          ctx.save(); ctx.translate(x, y); ctx.rotate(a);
          const L = Math.max(9, R * 0.05), Wd = L * 0.42;
          ctx.fillStyle = U.rgb(U.mix([120, 90, 60], [40, 120, 90], al), 0.35 * glow);
          ctx.fillRect(-L / 2, -Wd / 2, L, Wd);
          ctx.fillStyle = U.rgb(U.mix([255, 215, 150], [210, 255, 220], al * 0.5), 0.9 * glow);
          ctx.beginPath(); ctx.arc(L * 0.32, 0, Wd * 0.28, 0, 6.283); ctx.fill();
          ctx.restore();
        }
      });
      // the imam's place
      const fa = rad(this.rows[0].ang);
      ctx.fillStyle = 'rgba(255,230,180,0.9)';
      U.star8(ctx, cx + Math.cos(fa) * R * 0.5, cy + Math.sin(fa) * R * 0.5, 6, 0.5, t * 0.3); ctx.fill();

      this.drawCompass(ctx, cx, cy, R, t);
      this.drawVerse(ctx, w, h, cx, cy, R);
    },

    drawCompass(ctx, cx, cy, R, t) {
      const ring = R * 1.12;
      ctx.save();
      ctx.strokeStyle = 'rgba(217,187,133,0.45)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(cx, cy, ring, 0, 6.283); ctx.stroke();
      ctx.beginPath(); ctx.arc(cx, cy, ring + 16, 0, 6.283); ctx.strokeStyle = 'rgba(217,187,133,0.18)'; ctx.stroke();
      for (let d = 0; d < 360; d += 5) {
        const a = rad(d), L = d % 90 === 0 ? 14 : d % 15 === 0 ? 8 : 4;
        ctx.strokeStyle = `rgba(217,187,133,${d % 90 === 0 ? 0.8 : 0.35})`;
        ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * ring, cy + Math.sin(a) * ring); ctx.lineTo(cx + Math.cos(a) * (ring + L), cy + Math.sin(a) * (ring + L)); ctx.stroke();
      }
      ctx.font = '11px Marcellus, Georgia, serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(242,233,214,0.6)';
      [['N', 0], ['E', 90], ['S', 180], ['W', 270]].forEach(([l, d]) => { const a = rad(d); ctx.fillText(l, cx + Math.cos(a) * (ring + 30), cy + Math.sin(a) * (ring + 30)); });

      // the two mihrabs on the horizon of the circle
      this.mihrab(ctx, cx, cy, ring, JERUSALEM, 'Bayt al-Maqdis', 'بيت المقدس', '332°', 1 - this.aligned * 0.6, [217, 187, 133]);
      this.mihrab(ctx, cx, cy, ring, MAKKAH, 'The Ka‘bah', 'الكعبة', '176°', 0.6 + this.aligned * 0.4, U.mix([217, 187, 133], [120, 230, 170], this.aligned));

      // the needle in the hand
      const a = rad(this.target);
      const nx = cx + Math.cos(a) * ring, ny = cy + Math.sin(a) * ring;
      ctx.strokeStyle = 'rgba(255,225,160,0.5)'; ctx.setLineDash([3, 6]);
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(nx, ny); ctx.stroke(); ctx.setLineDash([]);
      const g = ctx.createRadialGradient(nx, ny, 0, nx, ny, 30);
      g.addColorStop(0, 'rgba(255,220,150,0.6)'); g.addColorStop(1, 'rgba(255,220,150,0)');
      ctx.fillStyle = g; ctx.fillRect(nx - 30, ny - 30, 60, 60);
      U.star8(ctx, nx, ny, 9, 0.5, -t * 0.5); ctx.fillStyle = '#f6dc9a'; ctx.fill();
      ctx.fillStyle = 'rgba(242,233,214,0.85)'; ctx.font = '12px Marcellus, Georgia, serif';
      if (Math.min(Math.abs(angDiff(this.target, MAKKAH)), Math.abs(angDiff(this.target, JERUSALEM))) < 14) ctx.fillStyle = 'rgba(0,0,0,0)';
      ctx.fillText(`${Math.round(this.target)}°`, cx + Math.cos(a) * (ring + 36), cy + Math.sin(a) * (ring + 36));
      ctx.restore();
    },

    mihrab(ctx, cx, cy, ring, bearing, en, ar, deg, alpha, col) {
      const a = rad(bearing), x = cx + Math.cos(a) * (ring - 26), y = cy + Math.sin(a) * (ring - 26);
      ctx.save(); ctx.translate(x, y); ctx.rotate(a + Math.PI / 2);
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = U.rgb(col); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(-9, 10); ctx.lineTo(-9, -2); ctx.quadraticCurveTo(-9, -14, 0, -18); ctx.quadraticCurveTo(9, -14, 9, -2); ctx.lineTo(9, 10); ctx.stroke();
      ctx.restore();
      const lx = cx + Math.cos(a) * (ring + 58), ly = cy + Math.sin(a) * (ring + 50);
      ctx.save(); ctx.globalAlpha = alpha; ctx.textAlign = 'center';
      ctx.fillStyle = U.rgb(col);
      ctx.font = '15px "Reem Kufi", Amiri, sans-serif'; ctx.fillText(ar, lx, ly - 8);
      ctx.font = '10px Marcellus, Georgia, serif'; ctx.fillText(`${en.toUpperCase()} · ${deg}`, lx, ly + 10);
      ctx.restore();
    },

    drawVerse(ctx, w, h, cx, cy, R) {
      const a = this.aligned; if (a < 0.02) return;
      ctx.save(); ctx.textAlign = 'center'; ctx.globalAlpha = a;
      const fs = Math.round(Math.min(34, R * 0.14));
      const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 0.75);
      bg.addColorStop(0, 'rgba(4,10,12,0.75)'); bg.addColorStop(1, 'rgba(4,10,12,0)');
      ctx.fillStyle = bg; ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
      ctx.fillStyle = '#eafff2'; ctx.shadowColor = 'rgba(120,230,170,0.7)'; ctx.shadowBlur = 16;
      ctx.font = `${fs}px Amiri, serif`; ctx.direction = 'rtl';
      ctx.fillText('فَوَلِّ وَجْهَكَ شَطْرَ الْمَسْجِدِ الْحَرَامِ', cx, cy - fs * 0.2);
      ctx.direction = 'ltr'; ctx.shadowBlur = 0;
      ctx.font = `italic 300 ${Math.round(fs * 0.46)}px Spectral, Georgia, serif`; ctx.fillStyle = 'rgba(242,233,214,0.85)';
      ctx.fillText('“So turn your face toward al-Masjid al-Haram.”', cx, cy + fs * 0.75);
      ctx.font = `${Math.round(fs * 0.34)}px Marcellus, Georgia, serif`; ctx.fillStyle = 'rgba(217,187,133,0.8)';
      ctx.fillText('QUR’AN 2:144', cx, cy + fs * 1.35);
      ctx.restore();
    },
  });
})();
