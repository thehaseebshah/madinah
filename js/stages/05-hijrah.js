/* Station — The Night Road (walkable), 622 CE.
   Feeling: trust in a guide through the dark, answered by dawn.
   Moonless dunes under the Milky Way. Five low cairns, each with a small lamp, mark the guide's
   way north; only the next one glows, and it lies roughly under the Pole Star. A camel bell rings
   far ahead. Footprints stay in the sand behind you. With each cairn the east pales a little;
   after the fifth, dawn breaks and the palms of the oasis rise on the horizon.
   Colour script: night blue, with ember gold kept for the lamps (the goal) and the dawn.
   No person is shown: the travellers are implied by the bell, the lamps and the footprints. */
(function () {
  'use strict';
  if (!window.WORLD) return;

  // the guide's line: a gentle meander northward (north is -z)
  const PX = z => 9 * Math.sin(z * 0.013) + 4 * Math.sin(z * 0.034 + 1.1);
  const CAIRNS = [-40, -94, -148, -202, -256].map((z, i) => ({ x: PX(z) + [3, -4, 4, -3, 2][i], z }));
  const START = { x: PX(24), z: 24 };
  const POLE = new THREE.Vector3(0, Math.sin(0.4), -Math.cos(0.4)).normalize(); // ~23 degrees up, due north
  const SKY = {
    top: [[0, '#02040c'], [0.5, '#050a1c'], [0.8, '#13204a'], [1, '#3c64a4']],
    mid: [[0, '#0a1028'], [0.5, '#141a3c'], [0.8, '#4a3a64'], [1, '#f2b88c']],
    bot: [[0, '#03050c'], [0.8, '#1a1424'], [1, '#6a4a40']],
    fog: [[0, '#0b1128'], [0.5, '#121838'], [0.8, '#3a3254'], [1, '#d8a888']],
  };
  const col = c => new THREE.Color(c[0] / 255, c[1] / 255, c[2] / 255);

  // dunes: gentle swells along the route, great ridges further out, falling away to the oasis
  function ground(x, z) {
    const off = Math.abs(x - PX(z));
    const wild = U.smooth(12, 130, off);
    const wx = x + U.noise2(x * 0.011, z * 0.011) * 26;
    const wz = z + U.noise2(x * 0.013 + 7.3, z * 0.009 - 2.1) * 22 + wx * 0.2;
    const f = wz / 46, ph = f - Math.floor(f);
    const prof = ph < 0.72 ? U.smooth(0, 0.72, ph) : 1 - U.smooth(0.72, 1, ph); // long windward slope, short slip face
    const amp = U.lerp(2.0, 9, wild) * (0.6 + 0.5 * (U.noise2(x * 0.006 + 3, z * 0.006) * 0.5 + 0.5));
    let y = prof * amp;
    y += (U.noise2(x * 0.004 - 5, z * 0.004 + 1) * 0.5 + 0.5) * U.lerp(2.5, 22, wild);
    y += U.noise2(x * 0.05, z * 0.05) * 0.25;
    const oasis = U.smooth(290, 390, -z);
    y = y * (1 - 0.8 * oasis) - oasis * 2;
    return y;
  }

  // a terrain grid that is fine along the route and coarse toward the horizon
  function axis(lo, hi, fineLo, fineHi, step) {
    const a = [];
    for (let v = fineLo; v <= fineHi + 1e-6; v += step) a.push(v);
    let s = step, v = fineLo; while (v > lo) { s *= 1.16; v -= s; a.unshift(Math.max(lo, v)); }
    s = step; v = fineHi; while (v < hi) { s *= 1.16; v += s; a.push(Math.min(hi, v)); }
    return a;
  }

  ENGINE.register(WORLD.stage({
    key: 'hijrah',
    arabic: 'الهجرة',
    title: 'The Night Road',
    era: '622 CE · the year 1 of the Hijrah',
    hint: 'WASD to walk · Shift to hurry · look for the faint lamp under the Pole Star',
    sound: { reverb: 0.5 },
    story: `<p>In the year 622 the Prophet Muhammad ﷺ and his companion Abu Bakr left Makkah by night and hid for three nights in the Cave of Thawr. Then a hired guide brought the camels, and they took a little-used road down toward the coast and north to Yathrib: some 450 to 470 kilometres, much of it travelled by night.</p>
            <p>The Hijrah, the migration, became the first year of the Islamic calendar. Every date in it still counts from this road.</p>`,

    enter(env) {
      const T = THREE, self = this;
      const w = this.w = WORLD.create(env, {
        start: { x: START.x, z: START.z, yaw: 0, pitch: 0.16 }, exposure: 1.15, far: 1300, speed: 3.3, run: 6.2,
        fog: { color: 0x0b1128, density: 0.0062 }, bounds: [-90, -275, 90, 40], ground, surface: () => 'sand',
      });
      const S = w.scene;
      this.k = 0; this.kShown = 0; this.found = 0; this.phase = 'walk'; this.dawnT = 0;

      /* ---------- sky: night dome, stars, the Milky Way and the Pole Star ---------- */
      this.skyM = w.sky({ top: '#02040c', mid: '#0a1028', bot: '#03050c', sunDir: [0.95, -0.25, -0.2], sun: '#000000', sunSize: 0.002, stars: 0.3 });
      this.skyRoot = new T.Group(); this.skyRoot.userData.dynamic = true; S.add(this.skyRoot);
      const R = 880;
      const band = new T.Vector3(0.9, 0.22, 0.38).normalize(); // the band's pole: the Milky Way arches north–south overhead
      const rr = U.seeded(622);
      const gauss = () => (rr() + rr() + rr() - 1.5) * 0.9;
      const starSet = (n, size, bandFrac, bright) => {
        const pos = new Float32Array(n * 3), cols = new Float32Array(n * 3), v = new T.Vector3(), q = new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 1, 0), band);
        let i = 0;
        while (i < n) {
          if (rr() < bandFrac) { const a = rr() * 6.283, h = gauss() * 0.16; v.set(Math.cos(a), h, Math.sin(a)).normalize().applyQuaternion(q); }
          else v.set(rr() * 2 - 1, rr() * 2 - 1, rr() * 2 - 1).normalize();
          if (v.y < -0.04) continue;
          pos.set([v.x * R, v.y * R, v.z * R], i * 3);
          const t = rr(), b = bright * (0.45 + rr() * 0.55);
          const c = t < 0.15 ? [1, 0.82, 0.62] : t > 0.85 ? [0.75, 0.84, 1] : [1, 0.97, 0.9];
          cols.set([c[0] * b, c[1] * b, c[2] * b], i * 3); i++;
        }
        const g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(pos, 3)); g.setAttribute('color', new T.BufferAttribute(cols, 3));
        const m = new T.Points(g, new T.PointsMaterial({ map: KIT.glowTex(w), size, sizeAttenuation: false, vertexColors: true, transparent: true, depthWrite: false, blending: T.AdditiveBlending, fog: false }));
        m.frustumCulled = false; m.renderOrder = -5; this.skyRoot.add(m); return m;
      };
      this.stars = [starSet(2600, 2.2, 0.55, 0.8), starSet(500, 3.6, 0.35, 1), starSet(70, 6, 0.2, 1)];
      // the cloudy band itself, with a dark rift of dust along part of it
      const mwTex = w.tex(1024, (g, s) => {
        g.clearRect(0, 0, s, s);
        const r = U.seeded(7);
        for (let i = 0; i < 2600; i++) {
          const x = r() * s, y = s / 2 + (r() + r() + r() - 1.5) * s * 0.2 * (0.6 + 0.6 * Math.sin(x / s * 6.283 + 1) ** 2), rad = 8 + r() * 30;
          const c = r() < 0.3 ? '255,226,190' : '205,215,255';
          g.save(); g.translate(x, y); g.scale(1, 3);
          const gr = g.createRadialGradient(0, 0, 0, 0, 0, rad);
          gr.addColorStop(0, `rgba(${c},${0.04 + r() * 0.05})`); gr.addColorStop(1, `rgba(${c},0)`);
          g.fillStyle = gr; g.fillRect(-rad, -rad, rad * 2, rad * 2); g.restore();
        }
        g.globalCompositeOperation = 'destination-out';
        for (let i = 0; i < 200; i++) {
          const x = (0.15 + r() * 0.45) * s, y = s / 2 + Math.sin(x * 0.02) * 30 + (r() - 0.5) * 40, rad = 5 + r() * 14;
          g.save(); g.translate(x, y); g.scale(1, 3);
          const gr = g.createRadialGradient(0, 0, 0, 0, 0, rad); gr.addColorStop(0, 'rgba(0,0,0,0.12)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
          g.fillStyle = gr; g.fillRect(-rad, -rad, rad * 2, rad * 2); g.restore();
        }
      });
      mwTex.wrapT = T.ClampToEdgeWrapping; mwTex.repeat.set(5, 1);
      this.milky = new T.Mesh(new T.CylinderGeometry(R * 0.99, R * 0.99, 460, 64, 1, true), new T.MeshBasicMaterial({ map: mwTex, transparent: true, opacity: 0.7, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide, fog: false }));
      this.milky.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), band); this.milky.renderOrder = -6; this.milky.frustumCulled = false;
      this.skyRoot.add(this.milky);
      // the Pole Star: steady, a little brighter than everything else, due north
      this.pole = KIT.glow(w, 0xeaf0ff, 46, 0.95); this.pole.material.fog = false; this.pole.position.copy(POLE).multiplyScalar(R * 0.97); this.skyRoot.add(this.pole);
      this.poleCore = KIT.glow(w, 0xffffff, 13, 1); this.poleCore.material.fog = false; this.poleCore.position.copy(this.pole.position); this.skyRoot.add(this.poleCore);
      // the glow of dawn on the eastern horizon
      this.dawnGlow = KIT.glow(w, 0xffb070, 900, 0); this.dawnGlow.material.fog = false; this.dawnGlow.position.set(R * 0.9, -40, -R * 0.25); this.skyRoot.add(this.dawnGlow);

      /* ---------- light: starlight, skyglow and a small hand lamp ---------- */
      this.hemi = new T.HemisphereLight(0x4a5c98, 0x14100c, 0.24); S.add(this.hemi);
      this.keyL = new T.DirectionalLight(0x8a9cd0, 0.3); this.keyL.position.set(-40, 50, -60); S.add(this.keyL);
      this.lamp = new T.PointLight(0xffb868, 0.9, 11, 1.8); S.add(this.lamp);

      /* ---------- the dunes ---------- */
      const ripple = w.tex(512, (g, s) => {
        g.fillStyle = '#c8a77c'; g.fillRect(0, 0, s, s);
        const r = U.seeded(3);
        for (let y = 0; y < s + 10; y += 9) {
          const ph = r() * 6, amp = 2 + r() * 2;
          g.beginPath(); for (let x = 0; x <= s; x += 8) { const yy = y + Math.sin(x * 0.04909 + ph) * amp + Math.sin(x * 0.11045 + ph * 2) * 1.2; x ? g.lineTo(x, yy) : g.moveTo(x, yy); }
          g.strokeStyle = 'rgba(240,214,170,0.55)'; g.lineWidth = 2.2; g.stroke();
          g.translate(0, 3); g.strokeStyle = 'rgba(120,88,56,0.45)'; g.lineWidth = 2; g.stroke(); g.translate(0, -3);
        }
        for (let i = 0; i < 5000; i++) { g.fillStyle = r() < 0.5 ? 'rgba(90,64,40,0.35)' : 'rgba(250,230,200,0.3)'; g.fillRect(r() * s, r() * s, 1.2, 1.2); }
      }, [1, 1]);
      const xs = axis(-520, 520, -90, 90, 1.7), zs = axis(-700, 220, -300, 60, 1.7);
      const nx = xs.length, nz = zs.length, P = new Float32Array(nx * nz * 3), C = new Float32Array(nx * nz * 3), UV = new Float32Array(nx * nz * 2), idx = [];
      for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
        const x = xs[i], z = zs[j], y = ground(x, z), k = j * nx + i;
        P.set([x, y, z], k * 3); UV.set([x / 7, z / 7], k * 2);
        const crest = U.clamp((y - ground(x, z + 6)) * 0.12 + 0.5), shade = 0.82 + 0.25 * crest + U.noise2(x * 0.02, z * 0.02) * 0.06;
        C.set([shade, shade * 0.97, shade * 0.93], k * 3);
      }
      for (let j = 0; j < nz - 1; j++) for (let i = 0; i < nx - 1; i++) { const a = j * nx + i, b = a + 1, c = a + nx, d = c + 1; idx.push(a, c, b, b, c, d); }
      const tg = new T.BufferGeometry();
      tg.setAttribute('position', new T.BufferAttribute(P, 3)); tg.setAttribute('color', new T.BufferAttribute(C, 3)); tg.setAttribute('uv', new T.BufferAttribute(UV, 2));
      tg.setIndex(idx); tg.computeVertexNormals();
      this.sandMat = KIT.std({ map: ripple, vertexColors: true, relief: 0.05, roughness: 1, color: 0xd8c0a0 });
      S.add(new T.Mesh(tg, this.sandMat));

      /* ---------- the cairns and their lamps ---------- */
      const stoneMat = KIT.std({ map: KIT.basalt(w, [1, 1]), color: 0x8a7e74, flatShading: true });
      const clay = KIT.std({ color: 0x6a4a30, roughness: 0.9 });
      const sg = new T.DodecahedronGeometry(0.5, 0);
      CAIRNS.forEach((c, ci) => {
        const y0 = ground(c.x, c.z), r = U.seeded(40 + ci);
        let h = 0;
        [[0.9, 0.5], [0.75, 0.45], [0.6, 0.4], [0.45, 0.32]].forEach(([s, t], li) => {
          const n = li === 0 ? 3 : li === 1 ? 2 : 1;
          for (let k = 0; k < n; k++) {
            const a = (k / n) * 6.283 + r(), d = n > 1 ? s * 0.45 : 0;
            const m = new T.Mesh(sg, stoneMat); m.scale.set(s, t, s * (0.85 + r() * 0.3));
            m.position.set(c.x + Math.cos(a) * d, y0 + h + t * 0.4, c.z + Math.sin(a) * d); m.rotation.set(r() * 0.5, r() * 6, r() * 0.5); S.add(m);
          }
          h += t * 0.78;
        });
        const dish = new T.Mesh(new T.CylinderGeometry(0.16, 0.1, 0.09, 12), clay); dish.position.set(c.x, y0 + h + 0.05, c.z); S.add(dish);
        c.top = new T.Vector3(c.x, y0 + h + 0.2, c.z);
        c.glow = KIT.glow(w, 0xffb060, 3.2, 0); c.glow.material.fog = false; c.glow.position.copy(c.top); S.add(c.glow);
        c.flame = KIT.glow(w, 0xfff0c0, 0.5, 0); c.flame.position.copy(c.top); S.add(c.flame);
        w.addCircle(c.x, c.z, 0.9);
      });
      this.beacon = new T.PointLight(0xffa850, 0, 9, 1.8); S.add(this.beacon);

      /* ---------- footprints left in the sand (decals) ---------- */
      const footTex = w.tex(128, (g, s) => {
        g.clearRect(0, 0, s, s);
        const sole = (cx, cy, rx, ry, a) => { const gr = g.createRadialGradient(cx, cy, 0, cx, cy, Math.max(rx, ry)); gr.addColorStop(0, `rgba(30,20,12,${a})`); gr.addColorStop(0.7, `rgba(30,20,12,${a * 0.7})`); gr.addColorStop(1, 'rgba(30,20,12,0)'); g.fillStyle = gr; g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, 6.283); g.fill(); };
        sole(s / 2, s * 0.36, s * 0.2, s * 0.3, 0.75); sole(s / 2, s * 0.78, s * 0.15, s * 0.17, 0.7);
      });
      footTex.wrapS = footTex.wrapT = T.ClampToEdgeWrapping;
      const fg = new T.PlaneGeometry(0.15, 0.32); fg.rotateX(-Math.PI / 2);
      this.feet = new T.InstancedMesh(fg, new T.MeshStandardMaterial({ map: footTex, transparent: true, depthWrite: false, color: 0x8a7058, roughness: 1, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 }), 260);
      this.feet.userData.dynamic = true; this.feet.frustumCulled = false; this.feet.instanceMatrix.setUsage(T.DynamicDrawUsage);
      const zero = new T.Matrix4().makeScale(0, 0, 0);
      for (let i = 0; i < 260; i++) this.feet.setMatrixAt(i, zero);
      S.add(this.feet);
      this.footI = 0; this.footSide = 1;
      const m4 = new T.Matrix4(), qN = new T.Quaternion(), qY = new T.Quaternion(), up = new T.Vector3(0, 1, 0), nrm = new T.Vector3(), one = new T.Vector3(1, 1, 1), at = new T.Vector3();
      const printAt = (x, z, yaw) => {
        const e = 0.3;
        nrm.set(ground(x - e, z) - ground(x + e, z), 2 * e, ground(x, z - e) - ground(x, z + e)).normalize();
        qN.setFromUnitVectors(up, nrm); qY.setFromAxisAngle(up, yaw + (Math.random() - 0.5) * 0.12); qN.multiply(qY);
        at.set(x, ground(x, z) + 0.025, z);
        m4.compose(at, qN, one); this.feet.setMatrixAt(this.footI, m4);
        this.footI = (this.footI + 1) % 260; this.feet.instanceMatrix.needsUpdate = true;
      };
      w.onStep = () => {
        this.footSide = -this.footSide;
        const rx = Math.cos(w.yaw), rz = -Math.sin(w.yaw);
        printAt(w.pos.x + rx * 0.13 * this.footSide, w.pos.z + rz * 0.13 * this.footSide, w.yaw);
      };
      // the guide's own tracks lead out from where you stand toward the first cairn
      for (let i = 0; i < 46; i++) {
        const t = i / 46, z = START.z - 2 - t * (START.z - CAIRNS[0].z - 4), x = U.lerp(START.x, CAIRNS[0].x, t) + Math.sin(t * 9) * 0.6;
        const side = i % 2 ? 1 : -1, yaw = Math.atan2(-(CAIRNS[0].x - START.x), -(CAIRNS[0].z - START.z));
        printAt(x + Math.cos(yaw) * 0.13 * side, z - Math.sin(yaw) * 0.13 * side, yaw);
      }
      this.trackStart = this.footI;

      /* ---------- the oasis, waiting below the horizon until dawn ---------- */
      const oasisGroup = new T.Group();
      const ro = U.seeded(33);
      for (let i = 0; i < 44; i++) {
        const x = (ro() - 0.5) * 300, z = -400 - ro() * 70, p = KIT.palm(w, 9 + ro() * 6);
        p.position.set(x, ground(x, z) - 0.2, z); oasisGroup.add(p);
      }
      const before = new Set(S.children);
      S.add(oasisGroup); w.bake(oasisGroup); S.remove(oasisGroup);
      this.oasis = new T.Group(); this.oasis.userData.dynamic = true; this.oasis.visible = false; S.add(this.oasis);
      S.children.filter(c => !before.has(c) && c !== this.oasis).forEach(c => { S.remove(c); this.oasis.add(c); });
      // dark basalt heights far to the north, behind the oasis
      const hillMat = KIT.std({ color: 0x1a1820, flatShading: true });
      for (let i = 0; i < 9; i++) { const c = new T.Mesh(new T.ConeGeometry(70 + (i % 3) * 30, 30 + (i % 4) * 9, 7), hillMat); c.position.set(-320 + i * 80, 4, -600 - (i % 2) * 40); c.scale.z = 0.5; S.add(c); }

      // drifting sand
      this.dust = KIT.dust(w, 160, [-12, 0.1, -12, 12, 2.2, 12], 0xc8c0d8, 0.035); this.dust.userData.dynamic = true; S.add(this.dust);

      this.baked = w.bake();

      /* ---------- sound ---------- */
      const b = env.bus;
      this.wind = SND.noise(b, { color: 'pink', type: 'bandpass', freq: 380, q: 0.6, gain: 0.08 });
      this.hiss = SND.noise(b, { color: 'white', type: 'highpass', freq: 4200, gain: 0.004, pan: 0.3 });
      SND.lfo(b, this.wind.filter && this.wind.filter.frequency, 0.07, 140);
      this.drone = SND.drone(b, 98, { vowel: 'u', gain: 0.0 });
      this.bellClock = 3; this.gust = 4; this.birdClock = 2; this.cricketClock = 1;

      w.activity('Follow the guide’s way north', 5, 'Walk toward the Pole Star. The next cairn’s lamp glows faintly ahead.');

      // arrival: from the Milky Way, tilting down to the dunes, then low along the footprints to you
      const eyeY = ground(START.x, START.z) + 1.62;
      w.cinematic([
        { p: [START.x, eyeY + 3, START.z + 6], l: [START.x + 120, 520, START.z - 160] },
        { p: [START.x - 4, eyeY + 9, START.z - 10], l: [START.x + 30, 160, -300] },
        { p: [START.x + 8, eyeY + 6, START.z - 40], l: [CAIRNS[0].x, 2, CAIRNS[0].z - 30] },
        { p: [CAIRNS[0].x - 2, ground(CAIRNS[0].x, CAIRNS[0].z + 10) + 1.4, CAIRNS[0].z + 10], l: [START.x, eyeY - 1, START.z] },
        { p: [START.x + 1, eyeY + 0.6, START.z - 8], l: [START.x, eyeY - 0.8, START.z] },
        { p: [START.x, eyeY, START.z], l: [START.x, eyeY, START.z - 10] },
      ], 10.5);
    },

    reach(env, ci) {
      const w = this.w, c = CAIRNS[ci];
      this.found = ci + 1; c.lit = true; c.litT = 0;
      SND.knock(env.bus, { f: 160, gain: 0.12, click: 1800 });
      SND.bell(env.bus, [293.66, 329.63, 369.99, 440, 493.88][ci], { gain: 0.05, dur: 3.5 });
      for (let i = 0; i < 5; i++) SND.swell(env.bus, { color: 'white', type: 'highpass', f0: 3000, f1: 5000, dur: 0.5, gain: 0.01, delay: i * 0.05 });
      const CARDS = [
        ['Out of the Cave of Thawr', 'After three nights in the cave, the guide came with the camels. He was a man of Banu ad-Dil, an expert in the roads, who still followed the religion of Quraysh; they trusted him and gave him their two mounts. (Sahih al-Bukhari 3905) The books of sirah name him ‘Abdullah ibn Urayqit.', 'هَادِيًا خِرِّيتًا'],
        ['The Coastal Road', '‘Amir ibn Fuhayrah went with them, and the guide took them by the road along the coast (Sahih al-Bukhari 3905): a winding way of some 450 to 470 kilometres, chosen because few would look for them there.'],
        ['The Tent at Qudayd', 'A well-known report of the sirah tells of the tent of Umm Ma‘bad at Qudayd, where a dry ewe gave milk when he touched her udder. It is a beloved tradition, though its chains are of disputed strength.'],
        ['The Pursuer', 'Suraqah ibn Malik rode after them for the reward Quraysh had offered. He said: <span class="q">“The forelegs of my horse sank into the ground up to the knees.”</span> He asked for safety and turned back. (Sahih al-Bukhari 3906)', 'سَاخَتْ يَدَا فَرَسِي فِي الأَرْضِ حَتَّى بَلَغَتَا الرُّكْبَتَيْنِ'],
        ['Quba', 'They reached Quba, at the edge of the oasis of Yathrib, on a Monday in the month of Rabi‘ al-Awwal. (Sahih al-Bukhari 3906)'],
      ];
      const [title, text, ar] = CARDS[ci];
      w.say(title, text, { ar, ms: ci === 4 ? 16000 : 14000 });
      if (ci < 4) w.progress(this.found, ['Walk on toward the Pole Star. The next lamp is faint, far ahead.', 'The road bends; keep the Pole Star before you.', 'Listen for the bell ahead, and walk on.', 'The last cairn. The east is paling.'][ci]);
      else { w.progress(5, 'Dawn is breaking. Look north.'); this.phase = 'hush'; this.dawnT = 0; }
    },

    update(env, dt) {
      const w = this.w; if (!w) return;
      w.update(dt);
      const t = w.time, T = THREE;
      this.skyRoot.position.set(w.camera.position.x, 0, w.camera.position.z);
      KIT.driftDust(this.dust, dt, t, [0.5, 0.1]);
      this.dust.position.set(w.pos.x, w.y, w.pos.z);

      // hand lamp travels with you
      this.lamp.position.set(w.pos.x + Math.cos(w.yaw) * 0.3, w.y + 1.1, w.pos.z - Math.sin(w.yaw) * 0.3);
      this.lamp.intensity = (0.75 + 0.12 * U.noise1(t * 6)) * (1 - this.k * 0.7);

      // the cairns
      const next = this.found < 5 ? CAIRNS[this.found] : null;
      CAIRNS.forEach((c, i) => {
        if (c.lit) { c.litT += dt; const f = 0.85 + 0.15 * U.noise1(t * 5 + i * 9); c.glow.material.opacity = Math.min(1, c.litT * 1.5) * 0.75 * f; c.glow.scale.setScalar(1.5 + Math.max(0, 1 - c.litT) * 3); c.flame.material.opacity = Math.min(1, c.litT * 2) * f; }
        else if (c === next) { c.glow.material.opacity = 0.38 + 0.18 * Math.sin(t * 2.2); c.glow.scale.setScalar(3.4); c.flame.material.opacity = 0.5; }
        else { c.glow.material.opacity = 0; c.flame.material.opacity = 0; }
      });
      if (next) {
        this.beacon.position.copy(next.top); this.beacon.intensity = 0.8 + 0.3 * Math.sin(t * 2.2);
        const d = Math.hypot(w.pos.x - next.x, w.pos.z - next.z);
        if (d < 3.4 && this.phase === 'walk') this.reach(env, this.found);
      } else this.beacon.intensity = U.damp(this.beacon.intensity, 0, 1, dt);

      // the colour of the night: each cairn brings the dawn a little closer
      let target = this.found / 5 * 0.72;
      if (next) { const prev = this.found ? CAIRNS[this.found - 1] : START, L = Math.hypot(next.x - prev.x, next.z - prev.z), d = Math.hypot(w.pos.x - next.x, w.pos.z - next.z); target += U.clamp(1 - d / L) * 0.144; }
      if (this.phase === 'hush' || this.phase === 'dawn' || this.phase === 'still') { this.dawnT += dt; }
      if (this.phase === 'hush') {
        // near-silence: the wind drops, the bell stops, the stars hold still
        this.wind.set('gain', 0.015, 1); this.hiss.set('gain', 0.001, 1);
        if (this.dawnT > 3) { this.phase = 'dawn'; this.dawnT = 0; this.oasis.visible = true; SND.glow(env.bus, 146.83, { gain: 0.07, dur: 12, vowel: 'a' }); SND.glow(env.bus, 220, { gain: 0.05, dur: 12, delay: 1.5, vowel: 'o' }); }
      }
      if (this.phase === 'still') target = 1;
      if (this.phase === 'dawn') {
        target = 0.72 + U.smooth(0, 9, this.dawnT) * 0.28;
        this.wind.set('gain', 0.04, 2);
        if (this.dawnT > 4 && !this.saidDawn) { this.saidDawn = true; w.say('The Oasis of Yathrib', 'The dark gives way and the palms of the oasis rise out of the morning haze. The people of Yathrib had been watching this road for days.', { ms: 11000 }); SND.glow(env.bus, 293.66, { gain: 0.05, dur: 10, vowel: 'a' }); }
        if (this.dawnT > 12) { this.phase = 'still'; this.dawnT = 0; }
      }
      if (this.phase === 'still' && this.dawnT > 4 && !this.done) { this.done = true; w.finish('The road has reached the oasis'); }
      this.k = this.phase === 'walk' ? Math.max(this.k, U.damp(this.k, target, 0.8, dt)) : (this.phase === 'hush' ? this.k : U.damp(this.k, target, 1.2, dt));
      if (Math.abs(this.k - this.kShown) > 0.0015) { this.kShown = this.k; this.setSky(this.k); }

      // the oasis rises into view
      if (this.oasis.visible) this.oasis.position.y = -6 * (1 - U.smooth(0, 8, this.phase === 'dawn' ? this.dawnT : 99));

      // the Pole Star twinkles, steady in its place
      const tw = 0.9 + 0.1 * Math.sin(t * 3.1) * Math.sin(t * 1.7);
      this.pole.material.opacity = 0.95 * tw * (1 - U.smooth(0.82, 1, this.k));
      this.poleCore.material.opacity = tw * (1 - U.smooth(0.85, 1, this.k));

      // sound layers: the wind follows your pace, the bell your distance, the hum your progress
      const pace = U.clamp(w.moving / w.speed);
      if (this.phase === 'walk') { this.wind.set('gain', 0.05 + pace * 0.06, 0.6); this.hiss.set('gain', 0.002 + pace * 0.005, 0.6); }
      this.drone.setGain(0.004 + this.found * 0.004, 2);
      this.gust -= dt;
      if (this.gust < 0 && this.phase === 'walk') { this.gust = 5 + Math.random() * 7; SND.swell(env.bus, { f0: 300, f1: 1200, dur: 3.5, gain: 0.05, pan: U.rnd(-1, 1) }); SND.swell(env.bus, { color: 'white', type: 'highpass', f0: 3500, f1: 6000, dur: 2.5, gain: 0.012, delay: 0.6, pan: U.rnd(-1, 1) }); }
      this.bellClock -= dt;
      if (this.bellClock < 0 && this.phase === 'walk') {
        this.bellClock = 4 + Math.random() * 3;
        const src = next ? { x: next.x - 4, z: next.z - 30 } : { x: 0, z: -300 }, sp = w.spatial(src, 45);
        const g = 0.05 * sp.gain + 0.006;
        SND.bell(env.bus, 1240, { metal: true, gain: g, dur: 2.2, pan: sp.pan }); SND.bell(env.bus, 1240, { metal: true, gain: g * 0.7, dur: 2, pan: sp.pan, delay: 0.62 });
      }
      this.cricketClock -= dt;
      if (this.cricketClock < 0 && this.k < 0.6) { this.cricketClock = 1 + Math.random() * 3; SND.cricket(env.bus, { gain: 0.002 }); }
      this.birdClock -= dt;
      if (this.birdClock < 0 && this.k > 0.75) { this.birdClock = 0.4 + Math.random() * 2.2 * (1.2 - this.k); SND.chirp(env.bus, { gain: 0.012 + (this.k - 0.75) * 0.06, pan: U.rnd(-0.9, 0.9) }); if (this.k > 0.95 && Math.random() < 0.2) SND.coo(env.bus, { gain: 0.025 }); }
    },

    setSky(k) {
      const w = this.w, u = this.skyM.material.uniforms;
      u.uTop.value.copy(col(U.ramp(SKY.top, k))); u.uMid.value.copy(col(U.ramp(SKY.mid, k))); u.uBot.value.copy(col(U.ramp(SKY.bot, k)));
      const sy = U.lerp(-0.3, 0.025, U.smooth(0.55, 1, k));
      u.uSunDir.value.set(0.95, sy, -0.25).normalize();
      u.uSun.value.copy(col([255, 150, 90])).multiplyScalar(U.smooth(0.5, 1, k) * 0.9);
      u.uStars.value = 0.3 * (1 - U.smooth(0.7, 0.97, k));
      const sf = 1 - U.smooth(0.72, 0.98, k);
      this.stars.forEach(s => { s.material.opacity = sf; });
      this.milky.material.opacity = 0.7 * (1 - U.smooth(0.55, 0.9, k));
      this.dawnGlow.material.opacity = U.smooth(0.45, 1, k) * 0.55;
      w.scene.fog.color.copy(col(U.ramp(SKY.fog, k)));
      w.scene.fog.density = U.lerp(0.0062, 0.0021, U.smooth(0.6, 1, k));
      this.hemi.color.copy(col(U.mix([90, 108, 168], [255, 214, 180], U.smooth(0.6, 1, k))));
      this.hemi.intensity = U.lerp(0.24, 0.8, U.smooth(0.6, 1, k));
      this.keyL.color.copy(col(U.mix([138, 156, 208], [255, 180, 120], U.smooth(0.6, 1, k))));
      this.keyL.position.copy(new THREE.Vector3(-40, 50, -60).lerp(new THREE.Vector3(120, 12, -30), U.smooth(0.6, 1, k)));
      this.keyL.intensity = U.lerp(0.3, 1.5, U.smooth(0.7, 1, k));
      w.renderer.toneMappingExposure = U.lerp(1.15, 1.0, U.smooth(0.7, 1, k));
    },
  }));
})();
