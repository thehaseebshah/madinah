/* Makkah — The Pledges of al-'Aqabah (walkable), 621–622 CE.
   Feeling: trust kept in secret; quiet resolve gathering in the dark.
   Colour script: deep night blue, with one accent of pale lantern gold kept for the lanterns of
   Yathrib, the meeting place and the pledge; the camp fires burn a lower, redder orange.
   Mina by night in the pilgrimage season: sleeping camps with small fires, and at the valley's end
   the rocky ravine of al-'Aqabah. Twelve lanterns wait in the shadows; gather them into a trailing
   line and lead them, unseen, into the ravine, where they form a circle. No person is depicted:
   the people of Yathrib are present only as lantern light, and the camps as tents, fires and murmurs. */
(function () {
  'use strict';
  if (!window.WORLD) return;
  const T = THREE;

  /* ---------- the valley of Mina, and the ravine at its end ---------- */
  const VCX = z => 3 * Math.sin(z * 0.02);
  const VHALF = z => 33 + 5 * Math.sin(z * 0.035 + 1);
  const RAV = z => -10 + 2.2 * Math.sin(z * 0.12 + 1);
  const MEET = { x: -11, z: -86 };
  function carve(x, z) {
    const notch = (1 - U.smooth(3.6, 8.5, Math.abs(x - RAV(z)))) * U.smooth(-57, -63, z) * (1 - U.smooth(-90, -96, z));
    const bowl = 1 - U.smooth(6.5, 11.5, Math.hypot(x - MEET.x, (z - MEET.z) * 1.1));
    return Math.max(notch, bowl);
  }
  function ground(x, z) {
    let y = U.noise2(x * 0.05, z * 0.05) * 0.55 + U.noise2(x * 0.22, z * 0.22) * 0.08;
    const d = Math.abs(x - VCX(z)) - VHALF(z);
    let m = 0;
    if (d > 0) m += Math.pow(d, 1.2) * 1.1 + U.noise2(x * 0.06 + 3, z * 0.06) * 7 * U.smooth(0, 14, d);
    const e = -62 - z;
    if (e > 0) m = Math.max(m, Math.pow(e, 1.15) * 1.6 + U.noise2(x * 0.08, z * 0.08 + 4) * 6 * U.smooth(0, 10, e));
    m += (U.noise2(x * 0.35, z * 0.35) * 0.9 + Math.abs(U.noise2(x * 0.9, z * 0.9)) * 0.5) * U.smooth(0, 3, m);
    const c = carve(x, z), floor = Math.max(0, -60 - z) * 0.06 + U.noise2(x * 0.3, z * 0.3) * 0.15;
    return U.lerp(y + m, floor, c);
  }
  const walk = (x, z) => (z > -61 && Math.abs(x - VCX(z)) < VHALF(z) - 2 && z < 48) || carve(x, z) > 0.72;

  const START = { x: -6, z: -54 };
  const R_FIRE = 6.5;
  const CAMPS = [[-18, 30], [6, 33], [22, 20], [-6, 18], [-24, 6], [12, 6], [0, -6], [-16, -16], [22, -12], [8, -24], [-10, -34], [20, -38], [-24, -44], [6, -44]];
  const WAIT = [[-28, 38], [28, 3], [-28, -15], [15, 38], [28, -32], [-5, 8], [-1, -28], [-28, 15], [-7, 31], [10, -9], [-14, -45], [12, 18]];
  const GOLD = 0xffdc9a, FIRE = 0xff6a28;

  function decal(w, r, color, opacity, x, z, lift) {
    const geo = new T.RingGeometry(0.001, r, 30, 6), p = geo.attributes.position;
    const pos = new Float32Array(p.count * 3);
    for (let i = 0; i < p.count; i++) { const px = x + p.getX(i), pz = z - p.getY(i); pos[i * 3] = px; pos[i * 3 + 1] = ground(px, pz) + (lift || 0.07); pos[i * 3 + 2] = pz; }
    geo.setAttribute('position', new T.BufferAttribute(pos, 3)); geo.computeVertexNormals(); geo.computeBoundingSphere();
    const m = new T.Mesh(geo, new T.MeshBasicMaterial({ map: KIT.glowTex(w), color, transparent: true, opacity, depthWrite: false, blending: T.AdditiveBlending, fog: false }));
    m.renderOrder = 2; return m;
  }
  // a low tent: ridge along x, closed at -x and open at +x
  function ridgeGeo(L, W, H) {
    const a = [-L / 2, H, 0], b = [L / 2, H, 0], c = [-L / 2, 0.02, -W / 2], d = [L / 2, 0.02, -W / 2], e = [-L / 2, 0.02, W / 2], f = [L / 2, 0.02, W / 2];
    const pos = [...c, ...d, ...b, ...c, ...b, ...a, ...e, ...a, ...b, ...e, ...b, ...f, ...c, ...a, ...e];
    const uv = [0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1, 0, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0, 0, 0, 0.5, 1, 1, 0];
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
    g.computeVertexNormals(); return g;
  }

  ENGINE.register(WORLD.stage({
    key: 'aqabah',
    arabic: 'بَيْعَةُ العَقَبَة',
    title: 'The Pledges of al-‘Aqabah',
    era: 'Mina · 621–622 CE · two pledges by night',
    hint: 'WASD to walk · E at a waiting lantern · lead the lanterns through shadow into the ravine',
    sound: { reverb: 0.65 },
    story: `<p>In the pilgrimage season, when the tribes camped at Mina, men from Yathrib met the Prophet ﷺ by night at al-‘Aqabah, a ravine at the valley’s end. In 621 twelve of them pledged themselves to him, and Mus‘ab ibn ‘Umayr was among the first to come to Yathrib, sent to teach the Qur’an. The next year some seventy men and two women came secretly by night and pledged to protect him as they protected their own families.</p>
            <p class="q"><span class="ar">بَايِعُونِي عَلَى أَنْ لاَ تُشْرِكُوا بِاللَّهِ شَيْئًا</span>“Pledge to me that you will not associate anything with God…” (Sahih al-Bukhari 18, from ‘Ubadah ibn as-Samit)</p>`,

    enter(env) {
      const self = this;
      const w = this.w = WORLD.create(env, {
        start: { x: START.x, z: START.z, yaw: Math.PI, pitch: 0.02 }, exposure: 1.3, far: 1600, speed: 3, run: 5.6,
        fog: { color: 0x0b1028, density: 0.0062 }, bounds: [-38, -97, 38, 48], ground,
        surface: (x, z) => (carve(x, z) > 0.5 ? 'gravel' : 'sand'),
      });
      const S = w.scene;

      /* sky: stars and a low moon over the ravine's crags */
      const moonDir = new T.Vector3(0.42, 0.34, -0.84).normalize();
      this.skyM = w.sky({ top: '#03050f', mid: '#141c3c', bot: '#06080f', sunDir: moonDir.toArray(), sun: '#303a62', sunSize: 0.00002, stars: 1.6 });
      S.add(new T.HemisphereLight(0x5060a0, 0x1a140e, 0.55));
      const moon = new T.DirectionalLight(0xa8b8f0, 0.7); moon.position.copy(moonDir).multiplyScalar(60); S.add(moon);
      const halo = KIT.glow(w, 0xc8d4ff, 120, 0.16); halo.position.copy(moonDir).multiplyScalar(900); halo.material.fog = false; S.add(halo);
      const disk = KIT.glow(w, 0xfff8e8, 26, 1); disk.position.copy(moonDir).multiplyScalar(890); disk.material.fog = false; S.add(disk);

      /* terrain: dense near the valley and the ravine, coarse beyond */
      const sandTex = w.tex(512, (g, s) => {
        g.fillStyle = '#7a6a5a'; g.fillRect(0, 0, s, s);
        for (let i = 0; i < 40; i++) { const x = Math.random() * s, y = Math.random() * s, r = 30 + Math.random() * 90, gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, Math.random() < 0.5 ? 'rgba(150,130,108,0.4)' : 'rgba(40,32,28,0.45)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); }
        for (let i = 0; i < 8000; i++) { const c = Math.random(); g.fillStyle = c < 0.5 ? 'rgba(40,32,28,0.55)' : c < 0.93 ? 'rgba(140,124,108,0.5)' : 'rgba(200,190,170,0.4)'; g.fillRect(Math.random() * s, Math.random() * s, 1 + Math.random() * 2, 1 + Math.random() * 2); }
      });
      const tg = new T.PlaneGeometry(2, 2, 180, 220); tg.rotateX(-Math.PI / 2);
      const tp = tg.attributes.position, tuv = tg.attributes.uv, tcol = new Float32Array(tp.count * 3);
      const remap = (u, inner, span, far) => { const a = Math.abs(u); return Math.sign(u) * (a < 0.6 ? a / 0.6 * inner : inner + Math.pow((a - 0.6) / 0.4, 1.7) * far); };
      for (let i = 0; i < tp.count; i++) {
        const x = remap(tp.getX(i), 46, 0, 420), z = -24 + remap(tp.getZ(i), 76, 0, 520);
        const y = ground(x, z); tp.setXYZ(i, x, y, z); tuv.setXY(i, x / 7, z / 7);
        const rock = U.smooth(1.5, 8, y - Math.max(0, -60 - z) * 0.06);
        const c = U.mix([0.86, 0.76, 0.64], [0.6, 0.55, 0.55], rock), sh = 0.85 + 0.15 * U.noise2(x * 0.3, z * 0.3);
        tcol.set([c[0] * sh, c[1] * sh, c[2] * sh], i * 3);
      }
      tg.setAttribute('color', new T.BufferAttribute(tcol, 3)); tg.computeVertexNormals();
      S.add(new T.Mesh(tg, KIT.std({ map: sandTex, vertexColors: true, relief: 0.05 })));

      // the crag of al-'Aqabah: a great broken rock framing the ravine's mouth against the sky
      const rockMat = KIT.std({ map: sandTex, color: 0x8a7e78, flatShading: true, relief: 0.06 });
      const crag = [[-20, -66, 9, 1.9], [-21, -71, 7, 2.6], [-1, -66, 7, 1.6], [0, -72, 8, 2.2], [-19, -62, 4, 1.2], [1, -62, 3.5, 1.1]];
      crag.forEach(([x, z, s, h], i) => { const m = new T.Mesh(new T.DodecahedronGeometry(s, 1), rockMat); m.position.set(x, ground(x, z) + s * h * 0.45, z); m.scale.set(1, h, 1); m.rotation.set(i * 0.7, i * 1.3, i * 0.4); S.add(m); });
      const r = U.seeded(621);
      for (let i = 0; i < 70; i++) {
        const z = -96 + r() * 36, side = r() < 0.5 ? -1 : 1, s = 0.4 + Math.pow(r(), 2) * 2;
        const x = RAV(z) + side * (4 + r() * 3);
        if (Math.hypot(x - MEET.x, z - MEET.z) < 6.5) continue;
        const m = new T.Mesh(new T.DodecahedronGeometry(s, 1), rockMat); m.position.set(x, ground(x, z) + s * 0.2, z); m.rotation.set(r() * 3, r() * 3, 0); S.add(m);
      }
      for (let i = 0; i < 70; i++) { // stones scattered on the valley floor
        const x = (r() - 0.5) * 66, z = -60 + r() * 106, s = 0.15 + r() * 0.45;
        if (CAMPS.some(([a, b]) => Math.hypot(x - a, z - b) < 5.5) || WAIT.some(([a, b]) => Math.hypot(x - a, z - b) < 2)) continue;
        const m = new T.Mesh(new T.DodecahedronGeometry(s, 0), rockMat); m.position.set(x, ground(x, z) + s * 0.3, z); m.rotation.set(r() * 3, r() * 3, 0); S.add(m);
      }
      // the far mountains of the Haram ranges
      const rangeMat = KIT.std({ color: 0x10142a, flatShading: true });
      for (let i = 0; i < 14; i++) { const a = (i / 14) * 6.283, d = 520 + (i % 3) * 110; const c = new T.Mesh(new T.ConeGeometry(110 + (i % 4) * 30, 90 + (i % 5) * 34, 7), rangeMat); c.position.set(Math.cos(a) * d, -10, Math.sin(a) * d - 20); c.rotation.y = i; S.add(c); }

      /* the sleeping camps: low tents of goat hair round small fires */
      const hair = [['#2a2420', '#4a3a2c', '#c8b898'], ['#3a2c22', '#1e1a18', '#8a5a3a'], ['#2e2a26', '#5a4632', '#b0a080']].map(([a, bb, c]) => w.tex(256, (g, s) => {
        g.fillStyle = a; g.fillRect(0, 0, s, s);
        for (let y = 0; y < s; y += 32) { g.fillStyle = (y / 32) % 3 === 2 ? c : bb; g.fillRect(0, y + 22, s, (y / 32) % 3 === 2 ? 4 : 8); }
        for (let i = 0; i < 4000; i++) { g.fillStyle = Math.random() < 0.5 ? 'rgba(0,0,0,0.25)' : 'rgba(255,240,220,0.06)'; g.fillRect(Math.random() * s, Math.random() * s, 1, 3); }
      }));
      const tentMats = hair.map(t => KIT.std({ map: t, side: T.DoubleSide, roughness: 1, relief: 0.02 }));
      const poleMat = KIT.std({ color: 0x4a3420, roughness: 0.9 });
      const sackMat = KIT.std({ color: 0x8a7458, roughness: 1 });
      const ringMat = KIT.std({ map: sandTex, color: 0x6a605a, flatShading: true });
      const sg = new T.DodecahedronGeometry(0.2, 0);
      this.fires = CAMPS.map(([fx, fz], ci) => {
        const fy = ground(fx, fz);
        for (let k = 0; k < 8; k++) { const a = k / 8 * 6.283, st = new T.Mesh(sg, ringMat); st.position.set(fx + Math.cos(a) * 0.7, fy + 0.08, fz + Math.sin(a) * 0.7); st.rotation.set(a, k, 0); S.add(st); }
        w.addCircle(fx, fz, 0.9);
        const nT = 1 + (ci * 7) % 3, a0 = ci * 1.9;
        for (let k = 0; k < nT; k++) {
          const a = a0 + k * (6.283 / nT) + 0.3, dd = 3.8 + (k % 2) * 0.7, tx = fx + Math.cos(a) * dd, tz = fz + Math.sin(a) * dd;
          const L = 3.4 + (k % 2) * 0.6, Wd = 3, H = 1.6 + ((ci + k) % 3) * 0.15;
          const g = new T.Group(); g.position.set(tx, ground(tx, tz) - 0.05, tz);
          g.rotation.y = Math.atan2(fx - tx, fz - tz) + Math.PI / 2; // the open end faces the fire
          const tent = new T.Mesh(ridgeGeo(L, Wd, H), tentMats[(ci + k) % 3]); g.add(tent);
          [-1, 1].forEach(e => { const p = new T.Mesh(new T.CylinderGeometry(0.05, 0.06, H + 0.4, 5), poleMat); p.position.set(e * L / 2, (H + 0.4) / 2, 0); g.add(p); });
          const sack = new T.Mesh(new T.SphereGeometry(0.3, 8, 6), sackMat); sack.scale.set(1.2, 0.7, 0.9); sack.position.set(-L / 2 - 0.4, 0.2, Wd * 0.3); g.add(sack);
          S.add(g); w.addCircle(tx, tz, 1.6);
        }
        S.add(decal(w, R_FIRE, FIRE, 0.2, fx, fz, 0.06));
        const flame = KIT.glow(w, 0xff7a30, 1.8, 0.9); flame.position.set(fx, fy + 0.45, fz); S.add(flame);
        const coal = KIT.glow(w, 0xff4a18, 1.2, 0.8); coal.position.set(fx, fy + 0.15, fz); S.add(coal);
        return { x: fx, z: fz, y: fy, flame, coal, ph: Math.random() * 6 };
      });
      // a few real lights travel to the fires nearest you
      this.fireLights = [0, 1, 2, 3].map(() => { const L = new T.PointLight(0xff7a34, 0, 13, 1.5); S.add(L); return L; });

      /* the meeting place: a ring of twelve low stones in the ravine */
      this.slots = [];
      const ringStone = KIT.std({ map: sandTex, color: 0x9a8e86, flatShading: true });
      for (let i = 0; i < 12; i++) {
        const a = i / 12 * 6.283 + 0.26, x = MEET.x + Math.cos(a) * 3.6, z = MEET.z + Math.sin(a) * 3.6;
        const st = new T.Mesh(new T.DodecahedronGeometry(0.28, 0), ringStone); st.position.set(x, ground(x, z) + 0.1, z); st.scale.y = 0.6; S.add(st);
        const mark = KIT.glow(w, GOLD, 1.2, 0.12); mark.position.set(x, ground(x, z) + 0.25, z); S.add(mark);
        this.slots.push({ x, z, mark });
      }
      this.meetPool = decal(w, 6, GOLD, 0.0, MEET.x, MEET.z, 0.06); this.meetPool.userData.dynamic = true; S.add(this.meetPool);
      this.beacon = KIT.glow(w, GOLD, 16, 0.0); this.beacon.position.set(MEET.x, ground(MEET.x, MEET.z) + 9, MEET.z); this.beacon.material.fog = false; S.add(this.beacon);
      this.pledgeLight = new T.PointLight(0xffe2b0, 0, 18, 1.4); this.pledgeLight.position.set(MEET.x, ground(MEET.x, MEET.z) + 1.5, MEET.z); S.add(this.pledgeLight);
      this.pledgeGlow = KIT.glow(w, 0xfff0d0, 3, 0); this.pledgeGlow.position.copy(this.pledgeLight.position); S.add(this.pledgeGlow);

      this.dust = KIT.dust(w, 200, [-30, 0.3, -60, 30, 6, 40], 0xc0c8f0, 0.04); this.dust.material.opacity = 0.35; S.add(this.dust);
      this.baked = w.bake();

      /* the twelve lanterns of the people of Yathrib */
      const bodyGeo = new T.CylinderGeometry(0.09, 0.11, 0.24, 8), capGeo = new T.ConeGeometry(0.12, 0.12, 8);
      capGeo.translate(0, 0.18, 0);
      const bodyMat = new T.MeshBasicMaterial({ color: 0xffe6b0 }), capMat = KIT.std({ color: 0x3a2c20, roughness: 0.6, metalness: 0.4 });
      this.lanterns = WAIT.map(([x, z], i) => {
        const g = new T.Group(); g.add(new T.Mesh(bodyGeo, bodyMat), new T.Mesh(capGeo, capMat));
        const home = new T.Vector3(x, ground(x, z) + 0.95, z);
        g.position.copy(home); S.add(g);
        const glow = KIT.glow(w, GOLD, 2.2, 0.75); glow.position.copy(home); S.add(glow);
        const halo = KIT.glow(w, GOLD, 6, 0.12); halo.position.copy(home); S.add(halo);
        return { i, g, glow, halo, home, pos: home.clone(), state: 'wait', ph: Math.random() * 6, flash: 0 };
      });
      this.followers = []; this.delivered = 0;
      // the line of light that binds the followers to you
      this.trailGeo = new T.BufferGeometry(); this.trailGeo.setAttribute('position', new T.BufferAttribute(new Float32Array(13 * 3), 3));
      this.trailLine = new T.Line(this.trailGeo, new T.LineBasicMaterial({ color: GOLD, transparent: true, opacity: 0.35, blending: T.AdditiveBlending, depthWrite: false }));
      this.trailLine.frustumCulled = false; S.add(this.trailLine);
      this.crumbs = [];

      /* a vignette of firelight when you linger with followers in a lit circle */
      const vig = document.createElement('div');
      vig.style.cssText = 'position:fixed;inset:0;pointer-events:none;opacity:0;mix-blend-mode:screen;background:radial-gradient(ellipse at center, rgba(255,120,40,0) 40%, rgba(255,100,36,0.3) 74%, rgba(180,50,14,0.6) 100%);';
      w.ui.layer.insertBefore(vig, w.ui.layer.firstChild); this.vig = vig;

      /* ---------- the activity ---------- */
      this.phase = 'gather'; this.heat = 0; this.inFire = false; this.endT = 0;
      w.activity('Into the ravine unseen', 12, 'Find a waiting lantern in the shadows between the camps');
      this.lanterns.forEach(L => w.interact({
        key: 'lantern' + L.i, pos: L.home, r: 2.6, label: 'Gather this lantern',
        enabled: () => L.state === 'wait', onUse: () => self.gather(env, L),
      }));

      /* ---------- sound ---------- */
      const b = env.bus;
      this.wind = SND.noise(b, { color: 'pink', type: 'bandpass', freq: 300, q: 0.5, gain: 0.04 });
      SND.lfo(b, this.wind.gain && this.wind.gain.gain, 0.04, 0.02);
      this.fireNoise = SND.noise(b, { color: 'white', type: 'bandpass', freq: 1800, q: 0.7, gain: 0 });
      this.cricketClock = 1; this.murmurClock = 2; this.humClock = 2; this.lightT = 0;

      /* ---------- arrival: over the sleeping camps toward the dark mouth of the ravine, then to you ---------- */
      const gy = ground(START.x, START.z);
      w.cinematic([
        { p: [34, 72, 84], l: [0, 0, -6] },
        { p: [12, 24, 26], l: [-4, 1, -36] },
        { p: [-1, 8, -26], l: [-9, 4, -70] },
        { p: [-9, 5, -58], l: [-11, 3, -86] },
        { p: [START.x, gy + 1.6, START.z], l: [START.x, gy + 1.6, START.z + 10] },
      ], 10.5);
      this.introSaid = false;
    },

    gather(env, L) {
      const w = this.w;
      L.state = 'follow'; L.flash = 1; this.followers.push(L);
      const n = this.followers.length, chord = [196, 246.94, 293.66, 392, 493.88, 587.33];
      SND.bell(env.bus, chord[(n - 1) % 6], { gain: 0.04, glass: true });
      SND.sing(env.bus, chord[(n - 1) % 3] * 0.5, { vowel: 'm', dur: 2.4, gain: 0.03, voices: 1, attack: 0.2 });
      SND.swell(env.bus, { f0: 600, f1: 1800, dur: 0.5, gain: 0.04 });
      if (!this.saidTwelve) {
        this.saidTwelve = true;
        w.say('Twelve from Yathrib', 'In the pilgrimage season of 621, twelve men from Yathrib met the Prophet ﷺ by night at al-‘Aqabah in Mina. One of them, ‘Ubadah ibn as-Samit, later described that night. (Ibn Ishaq; Musnad Ahmad 22754)', { ms: 11000 });
      }
      this.stepText();
    },

    stepText() {
      const n = this.followers.length, left = 12 - this.delivered - n;
      const lead = n ? `${n === 1 ? 'One lantern follows' : n + ' lanterns follow'} you · keep to the shadows` : '';
      const find = left > 0 ? `${left} still wait${left === 1 ? 's' : ''} between the camps` : 'bring them all into the ravine';
      this.w.step(n ? `${lead}; ${find}` : (left > 0 ? `Find a waiting lantern in the shadows; ${find}` : ''));
    },

    update(env, dt) {
      const w = this.w; if (!w) return;
      const px = w.pos.x, pz = w.pos.z;
      w.update(dt);
      if (!walk(w.pos.x, w.pos.z)) {
        if (walk(px, w.pos.z)) w.pos.x = px; else if (walk(w.pos.x, pz)) w.pos.z = pz; else { w.pos.x = px; w.pos.z = pz; }
      }
      const t = w.time, b = env.bus;
      KIT.driftDust(this.dust, dt, t, [0.04, 0.02]);
      if (!this.introSaid && !w.cine) {
        this.introSaid = true;
        w.say('Mina by Night', 'It is the pilgrimage season and the camps of Mina are asleep. Twelve lanterns wait in the shadows between them. Gather them, lead them past the firelight, and bring them into the ravine behind you.', { ms: 10000 });
      }

      // fires flicker; the nearest few cast real light
      for (const F of this.fires) {
        const f = 0.8 + 0.2 * Math.sin(t * 9 + F.ph) * Math.sin(t * 3.7 + F.ph * 2);
        F.flame.material.opacity = 0.85 * f; F.flame.scale.setScalar(1.6 + 0.4 * f); F.coal.material.opacity = 0.7 * f;
        F.d = Math.hypot(F.x - w.pos.x, F.z - w.pos.z);
      }
      this.lightT -= dt;
      if (this.lightT < 0) { this.lightT = 0.3; this.near = this.fires.slice().sort((a, c) => a.d - c.d).slice(0, 4); this.near.forEach((F, i) => this.fireLights[i].position.set(F.x, F.y + 1.1, F.z)); }
      this.near && this.near.forEach((F, i) => { this.fireLights[i].intensity = 1.6 * (0.85 + 0.15 * Math.sin(t * 11 + F.ph) * Math.sin(t * 4.3 + i)); });

      // which firelit circle are you in?
      let inside = null;
      for (const F of this.fires) if (F.d < R_FIRE) inside = F;
      const nearF = this.near ? this.near[0] : null;
      this.fireNoise.set('gain', nearF ? 0.03 / (1 + nearF.d * nearF.d / 16) : 0, 0.2);
      if (inside && !this.inFire && this.phase === 'gather') {
        // sleepers stir as you pass the fire
        const sp = w.spatial(inside, 8);
        SND.sing(b, U.rnd(100, 130), { vowel: 'm', dur: 1.4, gain: 0.025 * sp.gain + 0.004, pan: sp.pan, voices: 1, attack: 0.2, breath: 0.2, vib: 0.002 });
      }
      this.inFire = !!inside;
      const exposed = inside && this.followers.length > 0 && this.phase === 'gather' && !w.cine;
      this.heat = U.clamp(this.heat + (exposed ? dt / 2.0 : -dt / 1.2));
      if (exposed) {
        this.murmurClock -= dt * (1 + this.heat * 3);
        if (this.murmurClock < 0) { this.murmurClock = 0.7; const sp = w.spatial(inside, 8); SND.sing(b, U.rnd(95, 140), { vowel: U.pick(['m', 'o', 'a']), dur: U.rnd(0.5, 1), gain: 0.02 + this.heat * 0.03, pan: sp.pan, voices: 1, attack: 0.08, hold: 0.3 }); }
      }
      if (this.heat >= 1 && this.followers.length) {
        // the newest follower slips back to its waiting place
        const L = this.followers.pop(); L.state = 'back'; L.from = L.pos.clone(); L.bt = 0;
        this.heat = 0.35;
        SND.sing(b, 293.66, { vowel: 'u', dur: 1.8, gain: 0.03, glide: 1.0, attack: 0.05 });
        SND.sing(b, 220, { vowel: 'u', dur: 2, gain: 0.025, delay: 0.35, attack: 0.1 });
        w.step('A lantern slipped back to wait in the dark. Keep to the shadows, away from the fires');
        setTimeout(() => this.w && this.stepText(), 4500);
      }
      this.vig.style.opacity = (this.heat * 0.9).toFixed(3);

      // the breadcrumb trail you leave, for the followers to walk in
      const last = this.crumbs[0];
      if (!last || Math.hypot(last.x - w.pos.x, last.z - w.pos.z) > 0.25) { this.crumbs.unshift({ x: w.pos.x, z: w.pos.z }); if (this.crumbs.length > 260) this.crumbs.pop(); }
      const along = (dist) => {
        let acc = Math.hypot(this.crumbs[0].x - w.pos.x, this.crumbs[0].z - w.pos.z), prev = { x: w.pos.x, z: w.pos.z };
        if (acc >= dist) return prev;
        prev = this.crumbs[0];
        for (let i = 1; i < this.crumbs.length; i++) { const c = this.crumbs[i], s = Math.hypot(c.x - prev.x, c.z - prev.z); if (acc + s >= dist) { const k = (dist - acc) / s; return { x: U.lerp(prev.x, c.x, k), z: U.lerp(prev.z, c.z, k) }; } acc += s; prev = c; }
        return prev;
      };

      // the meeting place takes in your followers one by one
      const dMeet = Math.hypot(w.pos.x - MEET.x, w.pos.z - MEET.z);
      if (dMeet < 8 && this.followers.length && this.phase === 'gather') {
        this.handT = (this.handT || 0) - dt;
        if (this.handT <= 0) {
          this.handT = 0.45;
          const L = this.followers.shift(), slot = this.slots[this.delivered];
          L.state = 'circle'; L.slot = slot; L.from = L.pos.clone(); L.bt = 0;
          this.delivered++;
          const sp = w.spatial(slot, 6), chord = [196, 246.94, 293.66, 392];
          SND.sing(b, chord[this.delivered % 4] * (this.delivered > 6 ? 1 : 0.5), { vowel: 'o', dur: 3, gain: 0.03, pan: sp.pan, voices: 2, attack: 0.4 });
          w.progress(this.delivered); this.stepText();
          if (!this.saidPlace) {
            this.saidPlace = true;
            w.say('The Place of the Pledge', 'A small mosque, the Masjid al-Bay‘ah, marks this place today. It was built by the Abbasid caliph al-Mansur in 144 AH (761–762 CE). (history)', { ms: 10000 });
          }
          if (this.delivered === 12) { this.phase = 'still'; this.endT = 0; }
        }
      }

      // lanterns: waiting, following, slipping back, and finding their places in the circle
      const tp = this.trailGeo.attributes.position;
      const hand = new T.Vector3(w.pos.x, w.y + 1.0, w.pos.z);
      tp.setXYZ(0, hand.x, hand.y, hand.z);
      let tn = 1;
      for (const L of this.lanterns) {
        L.flash = Math.max(0, L.flash - dt * 1.5);
        if (L.state === 'wait') {
          L.pos.copy(L.home); L.pos.y += Math.sin(t * 1.2 + L.ph) * 0.04;
          const pulse = 0.6 + 0.25 * Math.sin(t * 1.6 + L.ph);
          L.glow.material.opacity = pulse; L.halo.material.opacity = 0.1 + 0.08 * pulse;
          L.glow.scale.setScalar(2.2);
        } else if (L.state === 'follow') {
          const k = this.followers.indexOf(L), p = along((k + 1) * 1.6);
          const ty = ground(p.x, p.z) + 1.0 + Math.sin(t * 2.2 + L.ph) * 0.06;
          L.pos.x = U.damp(L.pos.x, p.x, 5, dt); L.pos.z = U.damp(L.pos.z, p.z, 5, dt); L.pos.y = U.damp(L.pos.y, ty, 6, dt);
          L.glow.material.opacity = 0.9; L.halo.material.opacity = 0.16;
          L.glow.scale.setScalar(1.8 + L.flash * 3);
        } else if (L.state === 'back') {
          L.bt = Math.min(1, L.bt + dt / 2.4);
          L.pos.lerpVectors(L.from, L.home, U.ease(L.bt)); L.pos.y += Math.sin(L.bt * Math.PI) * 0.6;
          L.glow.material.opacity = 0.4 + 0.3 * L.bt; L.glow.scale.setScalar(1.6);
          if (L.bt >= 1) L.state = 'wait';
        } else if (L.state === 'circle') {
          L.bt = Math.min(1, L.bt + dt / 1.6);
          const to = new T.Vector3(L.slot.x, ground(L.slot.x, L.slot.z) + 1.0, L.slot.z);
          L.pos.lerpVectors(L.from, to, U.easeOut(L.bt)); L.pos.y += Math.sin(L.bt * Math.PI) * 0.4 + Math.sin(t * 1.3 + L.ph) * 0.03 * L.bt;
          const done = this.phase === 'reveal' ? U.smooth(6, 9, this.endT) : 0;
          L.glow.material.opacity = 0.85 + 0.15 * done; L.halo.material.opacity = 0.16 + 0.2 * done;
          L.glow.scale.setScalar(1.8 + L.flash * 2 + done * 1.2);
          if (L.bt >= 1 && !L.placed) { L.placed = true; L.flash = 0.8; L.slot.mark.material.opacity = 0.0; }
        }
        L.g.position.copy(L.pos); L.glow.position.copy(L.pos); L.halo.position.copy(L.pos);
      }
      for (const L of this.followers) { tp.setXYZ(tn++, L.pos.x, L.pos.y, L.pos.z); }
      this.trailGeo.setDrawRange(0, tn > 1 ? tn : 0); tp.needsUpdate = true;
      this.trailLine.material.opacity = 0.28 + 0.1 * Math.sin(t * 2);

      // the ravine calls when you carry lights: its empty places glow
      const want = this.followers.length ? 1 : 0.35;
      this.slots.forEach((s, i) => { if (i >= this.delivered) s.mark.material.opacity = U.damp(s.mark.material.opacity, 0.12 + 0.18 * want * (0.7 + 0.3 * Math.sin(t * 2 + i)), 3, dt); });
      this.meetPool.material.opacity = U.damp(this.meetPool.material.opacity, 0.05 * want + 0.02 * this.delivered + (this.phase === 'reveal' ? 0.25 * U.smooth(6, 10, this.endT) : 0), 2, dt);
      this.beacon.material.opacity = U.damp(this.beacon.material.opacity, this.phase === 'gather' ? 0.05 + 0.08 * want : 0.04, 2, dt);

      // a quiet hum among your followers: more voices as more lanterns walk with you
      this.humClock -= dt;
      const voices = this.followers.length + Math.min(4, this.delivered);
      if (this.humClock < 0 && this.phase === 'gather' && voices > 0) {
        this.humClock = 3.2;
        const tones = [98, 146.83, 196, 246.94, 293.66];
        for (let k = 0; k < Math.min(5, 1 + (voices >> 1)); k++) SND.sing(b, tones[k], { vowel: 'm', dur: 3.4, gain: 0.012, voices: 1, attack: 1, hold: 0.5, delay: k * 0.15, pan: (k - 2) * 0.25 });
      }
      this.cricketClock -= dt;
      if (this.cricketClock < 0 && this.phase === 'gather') { this.cricketClock = 0.5 + Math.random() * 1.4; SND.cricket(b, { gain: 0.0035, pan: U.rnd(-1, 1) }); }

      /* ---------- the twelve in a circle: stillness, then the pledge ---------- */
      if (this.phase === 'still' || this.phase === 'reveal') {
        const T0 = this.endT, T1 = (this.endT += dt), at = s => T0 < s && T1 >= s;
        if (at(1.2)) w.finish('Twelve lights in the ravine');
        this.wind.set('gain', 0.04 * (1 - U.smooth(1.5, 5, T1)) + 0.01 * U.smooth(16, 22, T1), 0.4);
        if (at(5)) this.phase = 'reveal';
        if (at(6)) { SND.glow(b, 146.83, { gain: 0.05, dur: 12, vowel: 'o' }); }
        if (at(7)) w.say('The Pledge', 'They pledged to him: <span class="q">“not to associate anything with God, not to steal, not to commit adultery, not to kill your children, not to bring slander, and not to disobey in what is good.”</span> (Sahih al-Bukhari 18, from ‘Ubadah ibn as-Samit)', { ar: 'بَايِعُونِي عَلَى أَنْ لاَ تُشْرِكُوا بِاللَّهِ شَيْئًا', ms: 13000 });
        if (at(8.5)) SND.glow(b, 196, { gain: 0.045, dur: 11 });
        if (at(11)) SND.glow(b, 293.66, { gain: 0.04, dur: 10 });
        if (at(21)) w.say('Mus‘ab ibn ‘Umayr', 'Mus‘ab ibn ‘Umayr was among the first to come to Yathrib, sent to teach the Qur’an there. (Sahih al-Bukhari 3925)', { ms: 10000 });
        if (at(32)) {
          w.say('The Second Pledge', 'The next year, in the pilgrimage season, some seventy men and two women met him here secretly at night, and pledged to protect him as they protected their own families. (Musnad Ahmad 15798, from Ka‘b ibn Malik; Ibn Ishaq)', { ms: 13000 });
          SND.sing(b, 110, { vowel: 'a', dur: 8, gain: 0.03, voices: 4, attack: 2.5, hold: 0.5 });
        }
        const k = U.smooth(6, 11, T1);
        this.pledgeLight.intensity = 2.2 * k; this.pledgeGlow.material.opacity = 0.75 * k;
        this.pledgeGlow.scale.setScalar(3 + k * 2 + Math.sin(t * 0.8) * 0.2);
        this.pledgeGlow.position.y = ground(MEET.x, MEET.z) + 1.2 + k * 1.4;
      }
    },
  }));
})();
