/* Station VI — Uhud, the Mountain That Loves Us (walkable).
   The plain north of Madinah in afternoon light. The long red-granite massif of Uhud fills the
   north; in front of it stands the small hill now called Jabal ar-Rumat, the Archers' Hill, and the
   low wall of the martyrs' resting place. Hold the hill for a minute while glints of spoils and
   murmurs call from the plain; then call to the mountain and the echo rolls from ridge to ridge,
   each flaring with light. Nobody is shown: presence is only light, cloth and wordless voices. */
(function () {
  'use strict';
  if (!window.WORLD) return;
  const HILL = { x: 0, z: 0, h: 8, top: 3.8, r: 21 };
  const CEM = { x0: 26, z0: -50, x1: 60, z1: -26, gateZ: -38 };
  const HOLD = 60;
  const M_FOOT = 175;                       // the mountain rises from z = -M_FOOT northward

  function plain(x, z) {
    const edge = 1 - U.smooth(80, 100, Math.max(Math.abs(x), Math.abs(z)));
    return (U.noise2(x * 0.018, z * 0.018) * 0.7 + U.noise2(x * 0.09, z * 0.09) * 0.16) * edge;
  }
  function hill(x, z) {
    const d = Math.hypot(x - HILL.x, (z - HILL.z) * 1.12);
    const body = HILL.h * (1 - U.smooth(HILL.top, HILL.r, d));
    const rough = (U.noise2(x * 0.35, z * 0.35) * 0.35 + U.noise2(x * 0.12 + 7, z * 0.12) * 0.6) * U.smooth(2.5, 8, d) * (1 - U.smooth(HILL.r - 3, HILL.r + 4, d));
    return body + rough;
  }
  const ground = (x, z) => plain(x, z) + hill(x, z);

  // Uhud: a ridged granite massif, swelling in its middle, cut by gullies
  function mountain(x, z) {
    const u = (-z - M_FOOT) / 260;
    if (u < -0.05) return -2;
    const along = 1 - U.smooth(380, 640, Math.abs(x + 40));
    const rise = U.smooth(-0.02, 0.32, u) * (1 - 0.35 * U.smooth(0.75, 1.3, u));
    let r = 0, a = 1, f = 0.007, n = 0;
    for (let i = 0; i < 5; i++) {
      const v = 1 - Math.abs(U.noise2(x * f + i * 13.1, z * f * 1.3 + i * 7.7));
      r += a * Math.pow(v, 1.8); n += a; a *= 0.48; f *= 2.1;
    }
    r /= n;
    // great rounded domes of granite, creased by ridges and gullies
    const domes = 0.55 + 0.45 * U.noise2(x * 0.0045 + 3.3, z * 0.006 + 1.1);
    const swell = 0.62 + 0.38 * Math.cos(U.clamp((x + 40) / 520, -1, 1) * Math.PI * 0.5);
    return 200 * rise * along * swell * (0.08 + 0.4 * domes + 0.72 * r) - 2 + U.noise2(x * 0.08, z * 0.08) * 1.2 * rise;
  }

  ENGINE.register(WORLD.stage({
    key: 'uhud',
    arabic: 'أُحُد',
    title: 'The Mountain That Loves Us',
    era: 'Jabal Uhud · 3 AH · 625 CE',
    hint: 'WASD to walk · climb the Archers’ Hill and stay on its top · then E to call to the mountain',
    sound: { reverb: 0.7 },
    story: `<p>Uhud rises from the plain north of the city, a red granite massif about seven kilometres long. In Shawwal of the year 3 AH (625 CE) a battle was fought at its foot. The Prophet ﷺ placed about fifty archers on a small hill under ‘Abdullah ibn Jubayr and told them not to leave their place whatever they saw. When most of them left, thinking the battle won, it turned. Some seventy Muslims were killed, among them Hamzah, the Prophet’s uncle.</p>
            <p class="q"><span class="ar">أُحُدٌ جَبَلٌ يُحِبُّنَا وَنُحِبُّهُ</span>“Uhud is a mountain that loves us, and we love it.” (Sahih al-Bukhari 4422; Sahih Muslim 1393)</p>
            <p>Climb the small hill, now called Jabal ar-Rumat, the Archers’ Hill, and hold it.</p>`,

    enter(env) {
      const T = THREE, self = this;
      const fogCol = new T.Color(0xe6c4a0);
      const w = this.w = WORLD.create(env, {
        start: { x: 3, z: 30, yaw: 0.05, pitch: 0.06 }, exposure: 1.0, far: 2000,
        fog: { color: fogCol, density: 0.0008 }, bounds: [-95, -95, 95, 95], ground,
        surface: (x, z) => (Math.hypot(x - HILL.x, z - HILL.z) < HILL.r - 4 ? 'gravel' : 'sand'),
      });
      const S = w.scene;
      this.phase = 'climb'; this.held = 0; this.awayT = 0; this.warned = 0; this.echoes = []; this.seen = {};

      /* ---------- the afternoon sky; the sun sinks a little while you hold ---------- */
      this.sunA = new T.Vector3(-0.66, 0.5, 0.42).normalize();
      this.sunB = new T.Vector3(-0.78, 0.26, 0.45).normalize();
      this.skyM = w.sky({ top: '#5784bd', mid: '#f0cfa4', bot: '#c89a72', sunDir: this.sunA.toArray(), sun: '#ffd6a0', sunSize: 0.0016 });
      this.hemi = new T.HemisphereLight(0xffe2c4, 0x8a5a40, 0.62); S.add(this.hemi);
      this.sun = new T.DirectionalLight(0xffd2a0, 2.3); this.sun.position.copy(this.sunA).multiplyScalar(60); S.add(this.sun);

      /* ---------- textures ---------- */
      const granite = w.tex(512, (g, s) => {
        g.fillStyle = '#b0a098'; g.fillRect(0, 0, s, s);
        for (let i = 0; i < 9000; i++) { const c = Math.random(); g.fillStyle = c < 0.5 ? 'rgba(70,60,58,0.45)' : c < 0.85 ? 'rgba(150,130,124,0.4)' : 'rgba(240,232,226,0.4)'; g.fillRect(Math.random() * s, Math.random() * s, 1 + Math.random() * 2.5, 1 + Math.random() * 2.5); }
        g.strokeStyle = 'rgba(40,20,16,0.35)';
        for (let i = 0; i < 40; i++) { g.lineWidth = 0.6 + Math.random() * 1.5; g.beginPath(); let x = Math.random() * s, y = Math.random() * s; g.moveTo(x, y); for (let k = 0; k < 6; k++) { x += (Math.random() - 0.5) * 40; y += Math.random() * 30; g.lineTo(x, y); } g.stroke(); }
      }, [60, 20]);

      /* ---------- Uhud ---------- */
      const mg = new T.PlaneGeometry(1500, 460, 300, 110); mg.rotateX(-Math.PI / 2); mg.translate(-40, 0, -M_FOOT - 215);
      const mp = mg.attributes.position, mc = new Float32Array(mp.count * 3);
      const STRATA = [[0.62, 0.25, 0.17], [0.4, 0.17, 0.15], [0.7, 0.4, 0.3], [0.32, 0.15, 0.15], [0.66, 0.31, 0.2], [0.5, 0.26, 0.24]];
      for (let i = 0; i < mp.count; i++) {
        const x = mp.getX(i), z = mp.getZ(i), y = mountain(x, z); mp.setY(i, y);
        // tilted bands of colour in the granite, with dark varnish in the gullies and pale sand at the foot
        const band = y * 0.075 + x * 0.006 + U.noise2(x * 0.012, z * 0.012) * 1.4;
        const bi = Math.floor(((band % STRATA.length) + STRATA.length) % STRATA.length), bf = band - Math.floor(band);
        let c = U.mix(STRATA[bi], STRATA[(bi + 1) % STRATA.length], U.smooth(0.45, 1, bf));
        c = U.mix(c, [0.3, 0.18, 0.15], U.clamp(0.5 - U.noise2(x * 0.03, z * 0.03)) * 0.5);
        c = U.mix([0.78, 0.64, 0.5], c, U.smooth(1, 14, y));
        mc.set(c, i * 3);
      }
      mg.setAttribute('color', new T.BufferAttribute(mc, 3)); mg.computeVertexNormals();
      this.mountainMat = KIT.std({ map: granite, vertexColors: true, relief: 0.04, color: 0xffffff });
      const mtn = new T.Mesh(mg, this.mountainMat); mtn.userData.noCast = true; S.add(mtn);

      /* ---------- the plain and the Archers' Hill ---------- */
      const far = new T.Mesh(new T.PlaneGeometry(2400, 2400, 2, 2), KIT.std({ map: KIT.sand(w, [300, 300]), color: 0xd8b892 }));
      far.rotation.x = -Math.PI / 2; far.position.y = -0.3; S.add(far);
      const ng = new T.PlaneGeometry(200, 200, 170, 170); ng.rotateX(-Math.PI / 2);
      const np = ng.attributes.position, nc = new Float32Array(np.count * 3);
      for (let i = 0; i < np.count; i++) {
        const x = np.getX(i), z = np.getZ(i), y = ground(x, z); np.setY(i, y);
        const rock = U.smooth(0.15, 1.6, hill(x, z)) * (0.6 + 0.4 * (U.noise2(x * 0.2, z * 0.2) * 0.5 + 0.5));
        nc.set(U.mix([0.92, 0.8, 0.64], [0.4, 0.21, 0.17], rock), i * 3);
      }
      ng.setAttribute('color', new T.BufferAttribute(nc, 3)); ng.computeVertexNormals();
      S.add(new T.Mesh(ng, KIT.std({ map: KIT.sand(w, [26, 26]), vertexColors: true, relief: 0.03 })));

      const rockMat = KIT.std({ map: granite, color: 0x9a5a48, flatShading: true, relief: 0.03 });
      const r = U.seeded(625);
      for (let i = 0; i < 120; i++) {
        const a = r() * 6.283, d = 4.5 + r() * (HILL.r - 3);
        if (Math.abs(Math.atan2(Math.sin(a), Math.cos(a)) - Math.PI / 2) < 0.35 && d > 4) continue;   // keep the south path clear
        const x = HILL.x + Math.cos(a) * d, z = HILL.z + Math.sin(a) * d / 1.12, s = 0.3 + Math.pow(r(), 2.5) * 1.2;
        const m = new T.Mesh(new T.DodecahedronGeometry(s, 0), rockMat); m.position.set(x, ground(x, z) + s * 0.25, z); m.rotation.set(r() * 3, r() * 3, r() * 3); m.scale.y = 0.7; S.add(m);
        if (s > 0.8) w.addCircle(x, z, s * 0.8);
      }
      for (let i = 0; i < 60; i++) {
        const x = (r() - 0.5) * 180, z = (r() - 0.5) * 180; if (Math.hypot(x, z) < HILL.r + 4) continue;
        const s = 0.2 + r() * 0.6; const m = new T.Mesh(new T.DodecahedronGeometry(s, 0), rockMat); m.position.set(x, ground(x, z), z); m.rotation.set(r() * 3, r() * 3, 0); S.add(m);
      }
      // acacias scattered on the plain
      const barkM = KIT.std({ color: 0x3e3028 }), leafM = KIT.std({ color: 0x34401f, roughness: 1, flatShading: true });
      const acacia = (x, z, h) => {
        const g = new T.Group();
        const tr = new T.Mesh(new T.CylinderGeometry(0.1, 0.18, h, 6), barkM); tr.position.y = h / 2; g.add(tr);
        for (let k = 0; k < 5; k++) {
          const cg = new T.IcosahedronGeometry(1, 1); const cp = cg.attributes.position;
          for (let j = 0; j < cp.count; j++) cp.setY(j, cp.getY(j) * 0.42 + (r() - 0.5) * 0.12);
          cg.computeVertexNormals();
          const c = new T.Mesh(cg, leafM), R = h * (0.32 + r() * 0.22); c.scale.setScalar(R); c.position.set((r() - 0.5) * h * 0.6, h + r() * 0.3, (r() - 0.5) * h * 0.6); g.add(c);
        }
        g.position.set(x, ground(x, z), z); S.add(g); w.addCircle(x, z, 0.3);
      };
      for (let i = 0; i < 22; i++) { const x = (r() - 0.5) * 180, z = (r() - 0.5) * 170; if (Math.hypot(x, z) < HILL.r + 6 || (x > CEM.x0 - 4 && x < CEM.x1 + 4 && z > CEM.z0 - 4 && z < CEM.z1 + 4)) continue; acacia(x, z, 2 + r() * 2.2); }

      /* ---------- the archers' place on the hilltop: a ring of stones and a pale pennant ---------- */
      const topY = ground(HILL.x, HILL.z);
      for (let i = 0; i < 16; i++) {
        const a = i / 16 * 6.283, x = HILL.x + Math.cos(a) * 3.3, z = HILL.z + Math.sin(a) * 3.3;
        const m = new T.Mesh(new T.DodecahedronGeometry(0.22 + (i % 3) * 0.06, 0), rockMat); m.position.set(x, ground(x, z) + 0.08, z); S.add(m);
      }
      const pole = new T.Mesh(new T.CylinderGeometry(0.04, 0.05, 3.6, 6), KIT.std({ map: KIT.wood(w), color: 0xa08060 })); pole.position.set(HILL.x - 1.6, topY + 1.8, HILL.z - 1.4); S.add(pole);
      w.addCircle(HILL.x - 1.6, HILL.z - 1.4, 0.15);
      this.pennant = new T.Mesh(new T.PlaneGeometry(1.3, 0.55, 10, 2), KIT.std({ color: 0xece0c8, side: T.DoubleSide, roughness: 1 }));
      this.pennant.position.set(HILL.x - 1.6 + 0.66, topY + 3.25, HILL.z - 1.4); this.pennant.userData.dynamic = true; S.add(this.pennant);
      this.pennantBase = this.pennant.geometry.attributes.position.array.slice();
      // the goal light on the hilltop (the one accent: pale gold)
      this.topGlow = KIT.glow(w, 0xffe2a0, 7, 0.5); this.topGlow.position.set(HILL.x, topY + 0.9, HILL.z); S.add(this.topGlow);
      const ringG = new T.RingGeometry(3.0, 3.6, 48); ringG.rotateX(-Math.PI / 2);
      this.topRing = new T.Mesh(ringG, new T.MeshBasicMaterial({ color: 0xffe2a0, transparent: true, opacity: 0.0, depthWrite: false, blending: T.AdditiveBlending }));
      this.topRing.position.set(HILL.x, topY + 0.12, HILL.z); this.topRing.userData.dynamic = true; S.add(this.topRing);

      /* ---------- the martyrs' resting place: a low wall, unmarked stones ---------- */
      const wallMat = KIT.std({ map: KIT.mudBrick(w, [3, 0.4]), color: 0xe8d0b4 });
      const wseg = (x0, z0, x1, z1) => {
        const lx = Math.abs(x1 - x0) || 0.6, lz = Math.abs(z1 - z0) || 0.6, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
        const m = new T.Mesh(new T.BoxGeometry(lx, 0.9, lz), wallMat); m.position.set(cx, ground(cx, cz) + 0.35, cz); S.add(m);
        w.addBox(cx - lx / 2, cz - lz / 2, cx + lx / 2, cz + lz / 2);
      };
      wseg(CEM.x0, CEM.z0, CEM.x1, CEM.z0); wseg(CEM.x0, CEM.z1, CEM.x1, CEM.z1); wseg(CEM.x1, CEM.z0, CEM.x1, CEM.z1);
      wseg(CEM.x0, CEM.z0, CEM.x0, CEM.gateZ - 1.6); wseg(CEM.x0, CEM.gateZ + 1.6, CEM.x0, CEM.z1);
      const graveMat = KIT.std({ map: granite, color: 0xa08478, flatShading: true });
      for (let gx = CEM.x0 + 3; gx < CEM.x1 - 2; gx += 2.6) for (let gz = CEM.z0 + 3; gz < CEM.z1 - 2; gz += 3.2) {
        if (r() < 0.25) continue;
        const m = new T.Mesh(new T.DodecahedronGeometry(0.18 + r() * 0.1, 0), graveMat); m.position.set(gx + (r() - 0.5) * 0.6, ground(gx, gz) + 0.06, gz); m.scale.set(1, 0.6, 1); S.add(m);
        const m2 = m.clone(); m2.position.z += 1.6; S.add(m2);
      }
      this.cemGlow = KIT.glow(w, 0xffe2a0, 14, 0); this.cemGlow.position.set((CEM.x0 + CEM.x1) / 2, ground((CEM.x0 + CEM.x1) / 2, (CEM.z0 + CEM.z1) / 2) + 1.6, (CEM.z0 + CEM.z1) / 2); S.add(this.cemGlow);
      this.gateGlow = KIT.glow(w, 0xffe2a0, 4, 0); this.gateGlow.position.set(CEM.x0 - 0.5, ground(CEM.x0, CEM.gateZ) + 1, CEM.gateZ); S.add(this.gateGlow);

      /* ---------- glints of spoils on the plain (three flickering sets) ---------- */
      this.glints = [];
      this.glintSpots = [];
      const spark = w.tex(128, (g, s) => {
        const c = s / 2;
        const gr = g.createRadialGradient(c, c, 0, c, c, c * 0.5); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = gr; g.fillRect(0, 0, s, s);
        g.fillStyle = 'rgba(255,255,255,0.9)';
        g.beginPath(); g.moveTo(c, 0); g.lineTo(c + 3, c - 3); g.lineTo(s, c); g.lineTo(c + 3, c + 3); g.lineTo(c, s); g.lineTo(c - 3, c + 3); g.lineTo(0, c); g.lineTo(c - 3, c - 3); g.closePath(); g.fill();
      });
      spark.wrapS = spark.wrapT = T.ClampToEdgeWrapping;
      for (let k = 0; k < 3; k++) {
        const n = 14, pos = new Float32Array(n * 3);
        for (let i = 0; i < n; i++) {
          const a = U.lerp(-0.6, 2.3, r()), d = 30 + r() * 55;          // east, south-east and south of the hill
          const x = Math.cos(a) * d, z = Math.sin(a) * d * 0.9 + 6;
          pos.set([x, ground(x, z) + 0.25, z], i * 3); this.glintSpots.push({ x, z });
        }
        const gg = new T.BufferGeometry(); gg.setAttribute('position', new T.BufferAttribute(pos, 3));
        const pts = new T.Points(gg, new T.PointsMaterial({ map: spark, color: 0xfff0b0, size: 2.4, transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending }));
        pts.frustumCulled = false; S.add(pts); this.glints.push(pts);
      }

      /* ---------- the ridges that will answer the call ---------- */
      this.ridges = [];
      for (let x = -420; x <= 340; x += 95) {
        let best = -1e9, bz = 0;
        for (let z = -M_FOOT - 20; z > -M_FOOT - 330; z -= 6) { const y = mountain(x, z); if (y > best) { best = y; bz = z; } }
        const g = KIT.glow(w, 0xffc878, 120, 0); g.position.set(x, best + 10, bz); g.material.fog = false; S.add(g);
        const p = KIT.glow(w, 0xffd8a0, 1, 0); p.scale.set(26, 220, 1); p.position.set(x, best + 30, bz); p.material.fog = false; S.add(p);
        const d = Math.hypot(x - HILL.x, bz - HILL.z);
        this.ridges.push({ x, y: best, z: bz, g, p, d, t: -1 });
      }
      this.ridges.sort((a, b) => a.d - b.d);

      this.dust = KIT.dust(w, 300, [-30, 0.3, -20, 30, 12, 40], 0xffe8c8, 0.05); this.dust.material.opacity = 0.5; S.add(this.dust);

      w.followShadow(this.sun, 40); w.receiveAll();
      mtn.castShadow = false;
      this.baked = w.bake();

      /* ---------- the activity ---------- */
      this.bar = w.ui.layer.querySelector('.wq-bar i');
      w.activity('Hold the hill', 3, 'Climb Jabal ar-Rumat, the Archers’ Hill, and take your place inside the ring of stones');
      w.interact({
        key: 'call', pos: new T.Vector3(), r: 99, once: true, label: 'Call to the mountain',
        enabled: () => self.phase === 'call',
        onUse: () => self.call(env),
      });
      this.callItem = w.items[w.items.length - 1];

      /* ---------- sound ---------- */
      const b = env.bus;
      this.wind = SND.noise(b, { color: 'pink', type: 'bandpass', freq: 380, q: 0.5, gain: 0.04 });
      this.gust = SND.noise(b, { color: 'white', type: 'bandpass', freq: 1800, q: 0.7, gain: 0.0 });
      SND.lfo(b, this.wind.filter && this.wind.filter.frequency, 0.07, 120);
      this.hum = SND.drone(b, 110, { vowel: 'u', gain: 0.0 });
      this.hum2 = SND.drone(b, 164.81, { vowel: 'o', gain: 0.0 });
      this.murmurClock = 2; this.birdClock = 3;

      /* ---------- entrance: a long lateral track along the red ridges from the east, swinging to the hill ---------- */
      const E = [w.pos.x, ground(w.pos.x, w.pos.z) + 1.62, w.pos.z];
      w.cinematic([
        { p: [470, 80, -40], l: [340, 110, -300] },
        { p: [300, 72, -50], l: [180, 115, -300] },
        { p: [130, 64, -55], l: [20, 115, -300] },
        { p: [-30, 50, -50], l: [-100, 85, -300] },
        { p: [-58, 26, -30], l: [0, 6, 0] },
        { p: [-26, 12, 26], l: [0, 6, -6] },
        { p: E, l: [0, 6, 0] },
      ], 11);
    },

    call(env) {
      const w = this.w, b = env.bus;
      this.phase = 'echo'; this.echoT = 0;
      SND.sing(b, 220, { vowel: 'a', dur: 1.8, gain: 0.09, voices: 1, glide: 0.82, attack: 0.08, hold: 0.5, breath: 0.12 });
      SND.swell(b, { color: 'pink', f0: 400, f1: 900, dur: 1.4, gain: 0.04 });
      this.ridges.forEach((rg, i) => {
        rg.t = 1.1 + rg.d / 260 + i * 0.32;
        const sp = w.spatial(rg, 200);
        SND.sing(b, 220 * (i % 2 ? 1 : 0.998), { vowel: i < 3 ? 'a' : 'o', dur: 1.7, gain: 0.06 * Math.pow(0.8, i), delay: rg.t, glide: 0.85, pan: sp.pan, attack: 0.12, hold: 0.4, breath: 0.15 });
      });
      w.progress(2, 'Listen to the mountain answer');
    },

    update(env, dt) {
      const w = this.w; if (!w) return;
      w.update(dt);
      const t = w.time, b = env.bus;
      KIT.driftDust(this.dust, dt, t, [0.25, 0.05]);
      { const f = w.forward(), l = Math.hypot(f.x, f.z) || 1; this.callItem.pos.set(w.pos.x + f.x / l * 2, w.y + 1.6, w.pos.z + f.z / l * 2); }
      const dTop = Math.hypot(w.pos.x - HILL.x, w.pos.z - HILL.z);
      const onTop = dTop < HILL.top + 0.4 && w.y > HILL.h - 1.2;

      // the pennant stirs
      { const a = this.pennant.geometry.attributes.position, base = this.pennantBase;
        for (let i = 0; i < a.count; i++) { const x0 = base[i * 3] + 0.65; a.setZ(i, Math.sin(t * 4 + x0 * 4) * 0.1 * x0); }
        a.needsUpdate = true; }

      if (!this.seen.hill && dTop < HILL.r - 6 && !w.cine) {
        this.seen.hill = true;
        w.say('The Archers’ Hill', 'Before the battle, the Prophet ﷺ placed about fifty archers on a small hill under ‘Abdullah ibn Jubayr, to guard the army’s back. <span class="q">(Sahih al-Bukhari 3039)</span> The hill is known today as Jabal ar-Rumat, the Archers’ Hill.', { ms: 12000 });
      }

      /* climbing, then holding */
      const hk = this.held / HOLD;
      if (this.phase === 'climb') {
        this.topGlow.material.opacity = 0.35 + 0.15 * Math.sin(t * 2);
        this.topRing.material.opacity = 0.18 + 0.08 * Math.sin(t * 2);
        if (onTop) {
          this.phase = 'hold';
          w.progress(1, 'Hold your place on the hill');
          SND.bell(b, 293.66, { gain: 0.04 });
        }
      } else if (this.phase === 'hold') {
        if (onTop) {
          this.held = Math.min(HOLD, this.held + dt);
          if (this.awayT > 0.5) w.step('Hold your place on the hill');
          this.awayT = 0;
        } else {
          this.awayT += dt;
          if (this.awayT > 0.5 && this.awayT - dt <= 0.5) {
            w.step('Return to the ring of stones on the hilltop; the hold waits for you');
            if (!this.warned) {
              this.warned = 1;
              w.say('Do Not Leave Your Place', '“Even if you see birds snatching us, do not leave this place of yours until I send for you.” <span class="q">(Sahih al-Bukhari 3039)</span>', { ar: 'إِنْ رَأَيْتُمُونَا تَخْطَفُنَا الطَّيْرُ فَلاَ تَبْرَحُوا مَكَانَكُمْ هَذَا حَتَّى أُرْسِلَ إِلَيْكُمْ', ms: 12000 });
            }
          }
        }
        this.bar.style.width = `${(1 + this.held / HOLD) / 3 * 100}%`;
        this.topGlow.material.opacity = onTop ? 0.12 : 0.45 + 0.15 * Math.sin(t * 3);
        this.topRing.material.opacity = (onTop ? 0.1 : 0.3) + 0.05 * Math.sin(t * 2);
        if (this.held >= HOLD) {
          this.phase = 'quiet'; this.quietT = 0;
          w.progress(2, 'Stay a moment');
        }
      } else if (this.phase === 'quiet') {
        this.quietT += dt;
        if (this.quietT > 3.2) {
          this.phase = 'call';
          w.progress(2, 'Press E and call to the mountain');
          w.say('The Hill Held', 'At Uhud most of the archers left their place when they thought the battle was won, and the battle turned. <span class="q">(Sahih al-Bukhari 3039)</span> The hill is quiet now. Face the mountain, and call.', { ms: 11000 });
        }
      }

      // glints and murmurs grow while you hold, and fade when the hold is done
      const lure = this.phase === 'hold' ? 0.25 + 0.75 * U.smooth(0, 0.8, hk) : this.phase === 'climb' ? 0.0 : 0;
      this.lure = U.damp(this.lure || 0, lure, 1.5, dt);
      this.glints.forEach((g, i) => { g.material.opacity = this.lure * U.clamp(0.4 + 0.6 * U.noise1(t * 2.2 + i * 11)); g.material.size = 1.8 + 1.6 * this.lure; });
      this.murmurClock -= dt * (0.4 + this.lure * 2.2);
      if (this.lure > 0.05 && this.murmurClock < 0) {
        this.murmurClock = 0.5 + Math.random() * 1.2;
        const s = U.pick(this.glintSpots), sp = w.spatial(s, 30);
        SND.sing(b, U.rnd(105, 165), { vowel: U.pick(['a', 'e', 'o']), dur: U.rnd(0.35, 0.8), gain: (0.03 * sp.gain + 0.01) * this.lure * (this.awayT > 0.5 ? 1.5 : 1), pan: sp.pan, attack: 0.05, hold: 0.3, breath: 0.35, vib: 0.003, glide: U.rnd(0.9, 1.15) });
      }
      // the sun lowers with the hold; the afternoon turns golden and stays so
      const sk = U.smooth(0, 1, Math.max(hk, this.phase === 'climb' || this.phase === 'hold' ? 0 : 1));
      const sd = this.sunA.clone().lerp(this.sunB, sk).normalize();
      this.sun.position.copy(sd).multiplyScalar(60); w._shadow.off.copy(sd).multiplyScalar(100);
      this.skyM.material.uniforms.uSunDir.value.copy(sd);
      this.sun.color.setRGB(1, U.lerp(0.82, 0.72, sk), U.lerp(0.63, 0.48, sk));
      this.skyM.material.uniforms.uMid.value.setRGB(U.lerp(0.94, 0.98, sk), U.lerp(0.81, 0.72, sk), U.lerp(0.64, 0.52, sk));

      // wind: stronger on the hilltop; it drops to near-silence before the call
      const height = U.clamp(w.y / HILL.h);
      const hush = this.phase === 'quiet' || this.phase === 'call' ? 0.2 : 1;
      this.wind.set('gain', (0.03 + 0.04 * height) * hush, 0.6);
      this.gust.set('gain', (0.004 + 0.01 * height * (0.5 + 0.5 * U.noise1(t * 0.4))) * hush, 0.4);
      // a low hum of steadfastness grows the longer you hold
      this.hum.setGain(this.phase === 'hold' && onTop ? 0.012 + 0.025 * hk : 0.0, 0.8);
      this.hum2.setGain(this.phase === 'hold' && onTop ? 0.018 * U.smooth(0.4, 1, hk) : 0.0, 0.8);

      /* the echo: ridge after ridge flares as the call reaches it */
      if (this.phase === 'echo' || this.phase === 'martyrs' || this.phase === 'done') {
        this.echoT += dt;
        let last = 0;
        for (const rg of this.ridges) {
          const a = this.echoT - rg.t;
          rg.g.material.opacity = a > 0 ? Math.min(1, a * 4) * Math.exp(-a * 0.9) * 0.55 + 0.06 * Math.min(1, a) : 0;   // each ridge keeps a little of its light
          rg.g.scale.setScalar(90 + Math.min(a, 3) * 25);
          rg.p.material.opacity = a > 0 ? Math.min(1, a * 3) * Math.exp(-a * 0.7) * 0.5 : 0;
          if (a > 0 && !rg.lit) { rg.lit = true; SND.swell(b, { color: 'pink', f0: 200, f1: 600, dur: 2.2, gain: 0.02, pan: w.spatial(rg, 200).pan }); }
          last = Math.max(last, rg.t);
        }
        if (this.phase === 'echo' && this.echoT > last + 2.2) {
          this.phase = 'martyrs';
          SND.glow(b, 110, { gain: 0.07, dur: 12 }); SND.glow(b, 164.81, { gain: 0.05, dur: 12, delay: 1.2 }); SND.bell(b, 440, { gain: 0.04, delay: 2.2 });
          w.say('A Mountain That Loves Us', '“Uhud is a mountain that loves us, and we love it.” <span class="q">(Sahih al-Bukhari 4422; Sahih Muslim 1393)</span>', { ar: 'أُحُدٌ جَبَلٌ يُحِبُّنَا وَنُحِبُّهُ', ms: 12000 });
          setTimeout(() => { if (this.w) w.step('Walk down to the low wall of the martyrs’ resting place'); }, 5000);
        }
      }
      if (this.phase === 'martyrs') {
        this.cemGlow.material.opacity = U.damp(this.cemGlow.material.opacity, 0.35, 0.5, dt);
        this.gateGlow.material.opacity = 0.45 + 0.15 * Math.sin(t * 2);
        this.topGlow.material.opacity = U.damp(this.topGlow.material.opacity, 0, 1, dt);
        const nearCem = Math.hypot(w.pos.x - CEM.x0, w.pos.z - CEM.gateZ) < 6 || (w.pos.x > CEM.x0 && w.pos.x < CEM.x1 && w.pos.z > CEM.z0 && w.pos.z < CEM.z1);
        if (nearCem) {
          this.phase = 'done';
          this.gateGlow.material.opacity = 0;
          SND.glow(b, 98, { gain: 0.06, dur: 10 });
          w.say('The Martyrs of Uhud', 'The battle was fought in Shawwal of the year 3 AH (625 CE). Some seventy Muslims were killed <span class="q">(Sahih al-Bukhari 3039, 4043)</span>, among them Hamzah, the Prophet’s uncle, killed by Wahshi <span class="q">(Sahih al-Bukhari 4072)</span>. They are remembered here, at the foot of the mountain that loves us.', { ms: 15000 });
          w.finish('The hill held');
        }
      }
      if (this.phase === 'done') this.cemGlow.material.opacity = U.damp(this.cemGlow.material.opacity, 0.25, 0.4, dt);
      this.topRing.material.opacity *= this.phase === 'climb' || this.phase === 'hold' ? 1 : 0.95;

      this.birdClock -= dt;
      if (this.birdClock < 0) { this.birdClock = 3 + Math.random() * 5; if (hush > 0.5) SND.chirp(b, { gain: 0.01, f: U.rnd(2200, 3200) }); }
    },
  }));
})();
