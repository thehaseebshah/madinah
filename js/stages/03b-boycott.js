/* Makkah — The Boycott in the Ravine (walkable), c. 616–619 CE.
   Feeling: patience in hunger, and the quiet solidarity of those who brought food by night.
   Colour script: night indigo, with one accent of warm gold kept for food, fed shelters and the
   final words; the patrol torches burn a harsher red-orange.
   A narrow rocky ravine below the mountains east of the Ka'bah. Six bundles of food have been left
   secretly at the ravine's mouth and among the rocks; carry each to a shelter of hide and cloth
   while torchlight from the rim sweeps the lower ravine. No person is depicted: the clan is present
   only as shelters, embers and hummed voices, and the patrols only as moving light. */
(function () {
  'use strict';
  if (!window.WORLD) return;
  const T = THREE;

  /* ---------- the shape of the ravine ---------- */
  const cx = z => 2.5 * Math.sin(z * 0.05 + 0.6);                                   // centre line
  const hw = z => 7.5 + 1.4 * Math.sin(z * 0.09) + 9 * U.smooth(-32, -62, z);        // half-width of the floor
  function ground(x, z) {
    const base = Math.max(-6, z > -40 ? (z + 40) * 0.05 : (z + 40) * 0.07);          // the floor climbs gently to the back
    const d = Math.abs(x - cx(z)) - hw(z);
    let y = base + U.noise2(x * 0.18, z * 0.18) * 0.22 + U.noise2(x * 0.7, z * 0.7) * 0.05;
    const H = 21 * (1 - U.smooth(-40, -72, z));
    if (d > 0) {
      y += H * U.smooth(0, 11, d) + d * 0.25;
      y += (U.noise2(x * 0.12 + 5, z * 0.12) * 2.4 + U.noise2(x * 0.4, z * 0.4) * 0.8) * U.smooth(0, 4, d);
      y += (U.noise2(x * 1.1, z * 1.1) * 0.35 + Math.abs(U.noise2(x * 0.25 + 9, z * 0.6)) * 1.2) * U.smooth(0, 2, d);
    }
    if (z > 46) y += Math.pow(z - 46, 1.3) * 2.0 + U.noise2(x * 0.2, z * 0.2) * 1.5 * U.smooth(46, 52, z);
    return y;
  }
  const inFloor = (x, z) => Math.abs(x - cx(z)) < hw(z) + 0.6 && z < 45.5 && z > -47;

  const START = { x: cx(6), z: 6 };
  // the six shelters, deep in the ravine (side: -1 west wall, +1 east wall)
  const SHELTERS = [[-1, 12], [1, 17.5], [-1, 24], [1, 30.5], [-1, 36.5], [1, 42]].map(([s, z]) => {
    const x = cx(z) + s * (hw(z) - 2.6);
    return { x, z, side: s, fed: false, k: 0 };
  });
  // six bundles: two at the mouth, four hidden among the rocks of the lower ravine
  const BUNDLES = [[-1, -41, 5.2], [1, -37, 6.4], [1, -26, 0.9], [-1, -21, 0.8], [1, -12, 0.9], [-1, -4, 0.9]].map(([s, z, inset]) => {
    const x = cx(z) + s * (hw(z) - inset);
    return { x, z, home: new T.Vector3(x, 0, z), taken: false, delivered: false };
  });
  // patrol torches walking the rim: side, centre z, reach, pace, sweep pace, phase
  const PATROLS = [
    { side: 1, zc: -32, A: 7, w: 0.16, sw: 0.42, ph: 0.0 },
    { side: -1, zc: -18, A: 8, w: 0.12, sw: 0.36, ph: 2.1 },
    { side: 1, zc: -5, A: 5, w: 0.14, sw: 0.31, ph: 4.0 },
  ];
  const POOL_R = 3.6;
  const GOLD = 0xffcf7a, TORCH = 0xff6a2a;

  /* ---------- small helpers of this station ---------- */
  // a pool of light laid on the ground; follows the terrain
  function decal(w, r, color, opacity) {
    const geo = new T.RingGeometry(0.001, r, 28, 5);
    const p = geo.attributes.position, off = new Float32Array(p.count * 2);
    for (let i = 0; i < p.count; i++) { off[i * 2] = p.getX(i); off[i * 2 + 1] = -p.getY(i); }
    const m = new T.Mesh(geo, new T.MeshBasicMaterial({ map: KIT.glowTex(w), color, transparent: true, opacity, depthWrite: false, blending: T.AdditiveBlending, fog: false }));
    m.userData = { dynamic: true, off }; m.frustumCulled = false; m.renderOrder = 2;
    return m;
  }
  function placeDecal(m, x, z, lift) {
    const p = m.geometry.attributes.position, off = m.userData.off;
    for (let i = 0; i < p.count; i++) { const px = x + off[i * 2], pz = z + off[i * 2 + 1]; p.setXYZ(i, px, ground(px, pz) + (lift || 0.07), pz); }
    p.needsUpdate = true;
  }
  // an A-frame shelter: ridge along x, closed at -x and open at +x
  function ridgeGeo(L, W, H) {
    const a = [-L / 2, H, 0], b = [L / 2, H, 0], c = [-L / 2, 0.02, -W / 2], d = [L / 2, 0.02, -W / 2], e = [-L / 2, 0.02, W / 2], f = [L / 2, 0.02, W / 2];
    const pos = [...c, ...d, ...b, ...c, ...b, ...a, ...e, ...a, ...b, ...e, ...b, ...f, ...c, ...a, ...e];
    const uv = [0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1, 0, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0, 0, 0, 0.5, 1, 1, 0];
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
    g.computeVertexNormals(); return g;
  }
  function wordsTex(ar, en) {
    const c = document.createElement('canvas'); c.width = 1400; c.height = 260;
    const g = c.getContext('2d'); g.textAlign = 'center';
    g.shadowColor = 'rgba(255,210,140,0.95)'; g.shadowBlur = 34; g.fillStyle = '#fff3d8'; g.font = '120px Amiri, "Geeza Pro", serif';
    g.direction = 'rtl'; g.fillText(ar, 700, 140);
    g.direction = 'ltr'; g.shadowBlur = 10; g.fillStyle = 'rgba(244,232,210,0.92)'; g.font = 'italic 44px Spectral, Georgia, serif'; g.fillText(en, 700, 226);
    const t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; return t;
  }

  ENGINE.register(WORLD.stage({
    key: 'boycott',
    arabic: 'شِعْبُ أَبِي طَالِب',
    title: 'The Boycott in the Ravine',
    era: 'Shi‘b Abi Talib, Makkah · c. 616–619 CE · three years of hunger and patience',
    hint: 'WASD to walk · E to take up a bundle and to leave it at a shelter · keep out of the torchlight',
    sound: { reverb: 0.7 },
    story: `<p>Quraysh swore an oath at Khayf Bani Kinanah to boycott the Prophet’s kinsmen of Banu Hashim and Banu al-Muttalib: no one would marry among them, and no one would trade with them. The clan withdrew into the ravine of Abu Talib, and for about three years food reached them only in secret, carried in by night by relatives such as Hakim ibn Hizam.</p>
            <p class="q"><span class="ar">بِاسْمِكَ اللَّهُمَّ</span>“In Your name, O God”: the sirah reports that these were the only words of the boycott document that the termites left.</p>`,

    enter(env) {
      const self = this;
      const w = this.w = WORLD.create(env, {
        start: { x: START.x, z: START.z, yaw: 0, pitch: 0.02 }, exposure: 1.35, far: 1600, speed: 2.8, run: 5,
        fog: { color: 0x0a0f22, density: 0.0085 }, bounds: [-30, -47, 30, 45.5], ground,
        surface: (x, z) => (Math.abs(x - cx(z)) > hw(z) - 1.2 ? 'gravel' : 'sand'),
      });
      const S = w.scene;

      /* sky: deep indigo, stars, a thin crescent framed in the ravine's mouth */
      const moonDir = new T.Vector3(-0.22, 0.3, -0.93).normalize();
      this.skyM = w.sky({ top: '#03040c', mid: '#121a36', bot: '#05070e', sunDir: moonDir.toArray(), sun: '#2c3458', sunSize: 0.00002, stars: 1.5 });
      this.hemi = new T.HemisphereLight(0x5464a0, 0x1c140e, 0.62); S.add(this.hemi);
      const moon = new T.DirectionalLight(0x9fb0ee, 0.75); moon.position.copy(moonDir).multiplyScalar(60); S.add(moon);
      const cres = w.tex(256, (g, s) => {
        const gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2); gr.addColorStop(0, 'rgba(255,244,220,0.22)'); gr.addColorStop(1, 'rgba(255,244,220,0)');
        g.fillStyle = gr; g.fillRect(0, 0, s, s);
        g.fillStyle = '#fff4dc'; g.beginPath(); g.arc(s / 2, s / 2, s * 0.17, 0, 6.283); g.fill();
        g.globalCompositeOperation = 'destination-out'; g.beginPath(); g.arc(s / 2 + s * 0.075, s / 2 - s * 0.035, s * 0.165, 0, 6.283); g.fill();
      });
      cres.wrapS = cres.wrapT = T.ClampToEdgeWrapping;
      const moonSp = new T.Sprite(new T.SpriteMaterial({ map: cres, transparent: true, depthWrite: false, fog: false })); moonSp.scale.set(64, 64, 1); moonSp.position.copy(moonDir).multiplyScalar(900); S.add(moonSp);

      /* the ravine: granite walls over a floor of dust and grit */
      const granite = w.tex(512, (g, s) => {
        g.fillStyle = '#4a3f39'; g.fillRect(0, 0, s, s);
        for (let i = 0; i < 40; i++) { const x = Math.random() * s, y = Math.random() * s, r = 30 + Math.random() * 90, gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, Math.random() < 0.5 ? 'rgba(120,102,90,0.45)' : 'rgba(30,24,22,0.5)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); }
        for (let i = 0; i < 7000; i++) { const c = Math.random(); g.fillStyle = c < 0.55 ? 'rgba(36,30,26,0.6)' : c < 0.92 ? 'rgba(112,98,88,0.5)' : 'rgba(180,166,150,0.35)'; g.fillRect(Math.random() * s, Math.random() * s, 1 + Math.random() * 2, 1 + Math.random() * 2); }
        g.strokeStyle = 'rgba(16,12,10,0.45)';
        for (let i = 0; i < 18; i++) { g.lineWidth = 0.5 + Math.random() * 2; g.beginPath(); let x = Math.random() * s, y = Math.random() * s; g.moveTo(x, y); for (let k = 0; k < 8; k++) { x += (Math.random() - 0.5) * 60; y += Math.random() * 40; g.lineTo(x, y); } g.stroke(); }
      });
      const tg = new T.PlaneGeometry(2, 1, 200, 260); tg.rotateX(-Math.PI / 2);
      const tp = tg.attributes.position, tuv = tg.attributes.uv, tcol = new Float32Array(tp.count * 3);
      for (let i = 0; i < tp.count; i++) {
        const u = tp.getX(i), v = 0.5 - tp.getZ(i);
        const x = 160 * Math.sign(u) * Math.pow(Math.abs(u), 2.1);
        const z = v < 0.72 ? 60 - (v / 0.72) * 112 : -52 - Math.pow((v - 0.72) / 0.28, 1.8) * 360;
        const y = ground(x, z); tp.setXYZ(i, x, y, z); tuv.setXY(i, x / 7, z / 7);
        const d = Math.abs(x - cx(z)) - hw(z), rock = U.smooth(-0.5, 3, d);
        const c = U.mix([0.86, 0.74, 0.6], [0.62, 0.56, 0.54], rock);
        const sh = 0.85 + 0.15 * U.noise2(x * 0.3, z * 0.3);
        tcol.set([c[0] * sh, c[1] * sh, c[2] * sh], i * 3);
      }
      tg.setAttribute('color', new T.BufferAttribute(tcol, 3)); tg.computeVertexNormals();
      S.add(new T.Mesh(tg, KIT.std({ map: granite, vertexColors: true, relief: 0.05 })));

      // boulders fallen along the foot of the walls; the bundles hide among them
      const bmat = KIT.std({ map: granite, color: 0xa69a90, flatShading: true, relief: 0.06 });
      const r = U.seeded(616);
      for (let i = 0; i < 90; i++) {
        const z = -46 + r() * 92, side = r() < 0.5 ? -1 : 1, s = 0.35 + Math.pow(r(), 2) * 2.2;
        const x = cx(z) + side * (hw(z) + 0.2 - r() * 1.6 + s * 0.4);
        if (SHELTERS.some(h => Math.hypot(h.x - x, h.z - z) < 3.4) || BUNDLES.some(b => Math.hypot(b.x - x, b.z - z) < 1.1 + s)) continue;
        const b = new T.Mesh(new T.DodecahedronGeometry(s, 1), bmat); b.position.set(x, ground(x, z) + s * 0.25, z); b.rotation.set(r() * 3, r() * 3, r() * 3); b.scale.y = 0.7 + r() * 0.4; S.add(b);
        if (s > 0.8 && Math.abs(x - cx(z)) < hw(z)) w.addCircle(x, z, s * 0.85);
      }
      // rocks cradling each bundle's hiding place
      BUNDLES.forEach((bd, i) => {
        for (let k = 0; k < 3; k++) {
          const a = i * 1.7 + k * 2.1, s = 0.5 + k * 0.25, x = bd.x + Math.cos(a) * (0.95 + s * 0.5), z = bd.z + Math.sin(a) * (0.95 + s * 0.5);
          const b = new T.Mesh(new T.DodecahedronGeometry(s, 1), bmat); b.position.set(x, ground(x, z) + s * 0.3, z); b.rotation.set(a, k, a * 0.5); S.add(b);
        }
      });

      /* the shelters of hide and cloth */
      const hideTex = w.tex(512, (g, s) => {
        g.fillStyle = '#6a4a32'; g.fillRect(0, 0, s, s);
        const cols = ['#7a5638', '#5a3e2a', '#86684a', '#6e5a48', '#8a7a62'];
        for (let i = 0; i < 16; i++) { const x = Math.random() * s, y = Math.random() * s, pw = 80 + Math.random() * 160, ph = 70 + Math.random() * 140; g.fillStyle = cols[i % cols.length]; g.fillRect(x, y, pw, ph); g.strokeStyle = 'rgba(30,20,12,0.65)'; g.setLineDash([5, 6]); g.lineWidth = 2; g.strokeRect(x + 3, y + 3, pw - 6, ph - 6); }
        g.setLineDash([]);
        for (let i = 0; i < 5000; i++) { g.fillStyle = Math.random() < 0.5 ? 'rgba(30,20,12,0.25)' : 'rgba(200,170,130,0.12)'; g.fillRect(Math.random() * s, Math.random() * s, 2, 2); }
      }, [1, 1]);
      const clothTex = w.tex(256, (g, s) => {
        g.fillStyle = '#b8a888'; g.fillRect(0, 0, s, s);
        for (let y = 0; y < s; y += 3) { g.fillStyle = `rgba(80,60,40,${0.05 + Math.random() * 0.08})`; g.fillRect(0, y, s, 1); }
        for (let i = 0; i < s; i += 64) { g.fillStyle = 'rgba(90,40,30,0.5)'; g.fillRect(0, i + 20, s, 6); }
      }, [1, 1]);
      const poleMat = KIT.std({ map: KIT.wood(w, [1, 2], '#4a3420'), color: 0x9a8070 });
      const clothMat = KIT.std({ map: clothTex, side: T.DoubleSide, color: 0x9a8c78, roughness: 1, relief: 0 });
      const potMat = KIT.std({ color: 0x6a4a34, roughness: 0.9 });
      this.shelterGlows = [];
      SHELTERS.forEach((h, i) => {
        const g = new T.Group(); g.position.set(h.x, ground(h.x, h.z) - 0.05, h.z);
        g.rotation.y = h.side < 0 ? Math.PI / 2 + (i % 2 ? 0.2 : -0.15) : -Math.PI / 2 + (i % 2 ? 0.15 : -0.2); // open towards the ravine's centre
        const L = 2.8 + (i % 3) * 0.4, Wd = 2.6, Hh = 1.75 + (i % 2) * 0.2;
        h.mat = KIT.std({ map: hideTex, side: T.DoubleSide, roughness: 1, emissive: 0xff9a48, emissiveMap: hideTex, emissiveIntensity: 0.02, relief: 0.02 });
        const tent = new T.Mesh(ridgeGeo(L, Wd, Hh), h.mat); tent.rotation.y = -Math.PI / 2; tent.userData.dynamic = true; g.add(tent);
        [-1, 1].forEach(e => { const p = new T.Mesh(new T.CylinderGeometry(0.05, 0.06, Hh + 0.5, 6), poleMat); p.position.set(0, (Hh + 0.5) / 2, e * L / 2); g.add(p); });
        const ridge = new T.Mesh(new T.CylinderGeometry(0.04, 0.04, L + 0.4, 6), poleMat); ridge.rotation.x = Math.PI / 2; ridge.position.y = Hh + 0.02; g.add(ridge);
        // a cloth flap thrown back from the doorway
        const flap = new T.Mesh(new T.PlaneGeometry(1.2, 1.5, 3, 3), clothMat); flap.position.set(Wd * 0.28 + 0.15, 0.85, L / 2 + 0.05); flap.rotation.set(0, 0.5, 0.15); g.add(flap);
        // an empty pot by the door
        const pot = new T.Mesh(new T.SphereGeometry(0.22, 12, 8), potMat); pot.scale.y = 0.85; pot.position.set(-Wd * 0.45, 0.2, L / 2 + 0.5); g.add(pot);
        S.add(g);
        g.updateMatrixWorld(true);
        const door = new T.Vector3(0, 0, L / 2 + 1.3).applyMatrix4(g.matrixWorld);
        h.door = door; h.inner = new T.Vector3(0, 0.75, L * 0.1).applyMatrix4(g.matrixWorld);
        // a hint of ember inside; becomes warm light once food arrives
        h.glow = KIT.glow(w, GOLD, 2.2, 0.08); h.glow.position.copy(h.inner); S.add(h.glow);
        h.pool = decal(w, 4.2, GOLD, 0); placeDecal(h.pool, door.x, door.z, 0.06); S.add(h.pool);
        const cWorld = new T.Vector3(0, 0, 0).applyMatrix4(g.matrixWorld);
        w.addCircle(cWorld.x, cWorld.z, 1.25);
      });

      // the clan's one fire of embers, in the middle of the shelters
      const FIRE = { x: cx(27), z: 27 };
      const stoneRing = KIT.std({ map: granite, color: 0x7a6e66, flatShading: true });
      for (let k = 0; k < 9; k++) { const a = k / 9 * 6.283, x = FIRE.x + Math.cos(a) * 0.75, z = FIRE.z + Math.sin(a) * 0.75; const st = new T.Mesh(new T.DodecahedronGeometry(0.22, 0), stoneRing); st.position.set(x, ground(x, z) + 0.1, z); S.add(st); }
      w.addCircle(FIRE.x, FIRE.z, 0.9);
      this.ember = new T.PointLight(0xff7a30, 1.6, 16, 1.6); this.ember.position.set(FIRE.x, ground(FIRE.x, FIRE.z) + 0.6, FIRE.z); S.add(this.ember);
      this.emberGlow = KIT.glow(w, 0xff5a20, 1.6, 0.7); this.emberGlow.position.set(FIRE.x, ground(FIRE.x, FIRE.z) + 0.25, FIRE.z); S.add(this.emberGlow);
      this.FIRE = FIRE;

      /* Makkah beyond the mouth: a scatter of house lights, and the city's faint glow */
      const lp = [], rr = U.seeded(619);
      for (let i = 0; i < 260; i++) {
        const x = (rr() - 0.5) * 300, z = -95 - Math.pow(rr(), 0.8) * 300;
        if (Math.abs(x - cx(z)) < hw(z) - 4 && z > -110) continue;
        lp.push(x, ground(x, z) + 1.2, z);
      }
      const lgeo = new T.BufferGeometry(); lgeo.setAttribute('position', new T.Float32BufferAttribute(lp, 3));
      const lights = new T.Points(lgeo, new T.PointsMaterial({ map: KIT.glowTex(w), color: 0xffb468, size: 3.4, transparent: true, opacity: 0.85, depthWrite: false, blending: T.AdditiveBlending, fog: false }));
      S.add(lights);
      const cityGlow = KIT.glow(w, 0xff9a50, 420, 0.1); cityGlow.position.set(0, 10, -420); cityGlow.material.fog = false; S.add(cityGlow);
      const rangeMat = KIT.std({ color: 0x10131f, flatShading: true });
      for (let i = 0; i < 12; i++) { const a = -2.4 + i * 0.4, d = 420 + (i % 3) * 90; const c = new T.Mesh(new T.ConeGeometry(80 + (i % 4) * 30, 60 + (i % 5) * 26, 6), rangeMat); c.position.set(Math.sin(a) * d, -10, -Math.cos(a) * d - 120); S.add(c); }

      /* the bundles: cloth bundles knotted at the top, each marked by a faint glint */
      const linen = w.tex(128, (g, s) => { g.fillStyle = '#d8c8a4'; g.fillRect(0, 0, s, s); for (let i = 0; i < s; i += 2) { g.fillStyle = `rgba(90,70,40,${0.08 + Math.random() * 0.1})`; g.fillRect(i, 0, 1, s); g.fillRect(0, i, s, 1); } g.fillStyle = 'rgba(120,60,30,0.45)'; g.fillRect(0, s * 0.42, s, s * 0.08); }, [2, 1]);
      this.bundleMat = KIT.std({ map: linen, color: 0xcdbb98, roughness: 1, relief: 0.02 });
      const bg = new T.SphereGeometry(0.32, 16, 10); bg.scale(1.1, 0.72, 0.95);
      const kg = new T.SphereGeometry(0.11, 10, 8); kg.translate(0, 0.24, 0); kg.scale(1, 1.2, 1);
      this.bundleGeo = bg; this.knotGeo = kg;
      const makeBundle = () => { const g = new T.Group(); g.add(new T.Mesh(bg, this.bundleMat), new T.Mesh(kg, this.bundleMat)); g.userData.dynamic = true; return g; };
      BUNDLES.forEach(bd => {
        bd.home.y = ground(bd.x, bd.z) + 0.2;
        bd.mesh = makeBundle(); bd.mesh.position.copy(bd.home); bd.mesh.rotation.y = Math.random() * 3; S.add(bd.mesh);
        bd.glint = KIT.glow(w, 0xfff0c8, 0.9, 0.5); bd.glint.position.copy(bd.home).add(new T.Vector3(0, 0.45, 0)); S.add(bd.glint);
        bd.halo = KIT.glow(w, GOLD, 3.2, 0.12); bd.halo.position.copy(bd.home).add(new T.Vector3(0, 0.3, 0)); S.add(bd.halo);
        bd.ph = Math.random() * 6;
      });

      /* the patrol torches on the rim: a flame, a cone of light and the pool it throws */
      const beamMat = new T.ShaderMaterial({
        uniforms: { uColor: { value: new T.Color(TORCH) }, uOp: { value: 0.2 } },
        vertexShader: 'varying float vA; varying vec3 vN; varying vec3 vV; void main(){ vA = position.z; vec4 mv = modelViewMatrix*vec4(position,1.); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }',
        fragmentShader: 'uniform vec3 uColor; uniform float uOp; varying float vA; varying vec3 vN; varying vec3 vV; void main(){ float rim = abs(dot(normalize(vN), normalize(vV))); float a = uOp * pow(rim, 1.8) * (1.0 - 0.55*vA) * smoothstep(0.0, 0.06, vA); gl_FragColor = vec4(uColor, a); }',
        transparent: true, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide,
      });
      this.beamMat = beamMat;
      const cone = new T.ConeGeometry(1, 1, 24, 1, true); cone.translate(0, -0.5, 0); cone.rotateX(-Math.PI / 2);
      this.patrols = PATROLS.map(p => {
        const P = Object.assign({}, p);
        P.beam = new T.Mesh(cone, beamMat); P.beam.userData.dynamic = true; P.beam.frustumCulled = false; S.add(P.beam);
        P.flame = KIT.glow(w, 0xff8a3a, 2.4, 0.95); S.add(P.flame);
        P.core = KIT.glow(w, 0xffe0a0, 0.7, 1); S.add(P.core);
        P.spot = new T.SpotLight(0xff7a38, 2.6, 60, 0.2, 0.6, 1); S.add(P.spot, P.spot.target);
        P.pool = decal(w, POOL_R * 1.25, TORCH, 0.3); S.add(P.pool);
        P.pos = new T.Vector3(); P.tgt = new T.Vector3();
        P.crackle = SND.noise(env.bus, { color: 'white', type: 'bandpass', freq: 2400, q: 0.8, gain: 0 });
        return P;
      });

      // the words left on the document, written in light above the ravine at the end
      this.words = new T.Sprite(new T.SpriteMaterial({ map: wordsTex('بِاسْمِكَ اللَّهُمَّ', 'In Your name, O God'), transparent: true, opacity: 0, depthWrite: false, fog: false }));
      this.words.scale.set(30, 5.6, 1); S.add(this.words);

      this.dust = KIT.dust(w, 220, [-10, 0.2, -40, 12, 7, 44], 0xc8c0e0, 0.035); this.dust.material.opacity = 0.45; S.add(this.dust);

      this.baked = w.bake();

      /* carrying: the bundle is held low in front of you */
      this.carried = makeBundle(); this.carried.visible = false;
      S.add(w.camera); w.camera.add(this.carried); this.carried.position.set(0.12, -0.5, -0.85); this.carried.rotation.set(0.25, 0.4, 0);
      this.carryGlow = KIT.glow(w, GOLD, 0.8, 0.0); this.carryGlow.material.depthTest = false; w.camera.add(this.carryGlow); this.carryGlow.position.set(0.12, -0.42, -0.84);

      /* a vignette of torchlight when you are seen, and a curtain for the gentle return */
      const mk = css => { const d = document.createElement('div'); d.style.cssText = 'position:fixed;inset:0;pointer-events:none;opacity:0;' + css; w.ui.layer.insertBefore(d, w.ui.layer.firstChild); return d; };
      this.vig = mk('background:radial-gradient(ellipse at center, rgba(255,110,40,0) 38%, rgba(255,96,36,0.32) 72%, rgba(170,40,10,0.62) 100%);mix-blend-mode:screen;');
      this.curtain = mk('background:#03040a;');

      /* ---------- the activity ---------- */
      this.carrying = null; this.fed = 0; this.seen = 0; this.lastShelter = null; this.returnT = -1; this.phase = 'carry'; this.endT = 0;
      w.activity('Food by night', 6, 'Find a bundle by its faint glint near the ravine’s mouth');
      BUNDLES.forEach((bd, i) => w.interact({
        key: 'bundle' + i, pos: [bd.x, bd.home.y + 0.3, bd.z], r: 2.4, label: 'Take up the bundle of food',
        enabled: () => !self.carrying && !bd.taken && self.returnT < 0,
        onUse: () => self.take(env, bd),
      }));
      SHELTERS.forEach((h, i) => w.interact({
        key: 'shelter' + i, pos: [h.door.x, ground(h.door.x, h.door.z) + 0.9, h.door.z], r: 3.0, label: 'Leave the food at this shelter',
        enabled: () => !!self.carrying && !h.fed,
        onUse: () => self.give(env, h),
      }));

      /* ---------- sound: wind in the ravine, crickets, the hum of the shelters ---------- */
      const b = env.bus;
      this.wind = SND.noise(b, { color: 'pink', type: 'bandpass', freq: 260, q: 0.6, gain: 0.05 });
      SND.lfo(b, this.wind.gain && this.wind.gain.gain, 0.05, 0.025);
      this.heart = 0; this.cricketClock = 1; this.humClock = 3; this.rimClock = 4; this.gust = 5;

      /* ---------- arrival: high on the rim, tilting down past the torches into the dark ---------- */
      const gy = ground(START.x, START.z);
      w.cinematic([
        { p: [24, 40, 40], l: [2, 10, -30] },
        { p: [19, 30, 18], l: [0, 3, -16] },
        { p: [10, 15, 10], l: [-1, 2, -8] },
        { p: [START.x + 1.5, gy + 4, START.z + 6], l: [START.x, gy + 1.4, START.z - 10] },
        { p: [START.x, gy + 1.6, START.z], l: [START.x, gy + 1.6, START.z - 10] },
      ], 10);
      this.introSaid = false;
    },

    take(env, bd) {
      const w = this.w;
      bd.taken = true; this.carrying = bd;
      bd.mesh.visible = false; bd.glint.visible = false; bd.halo.visible = false;
      this.carried.visible = true; this.carryLift = 0;
      w.speed = 2.4; w.run = 4.4;
      SND.swell(env.bus, { f0: 500, f1: 1600, dur: 0.6, gain: 0.08 });
      SND.step(env.bus, { gain: 0.2, f: 700 });
      SND.bell(env.bus, 392, { gain: 0.03, vowel: 'm' });
      w.step('Carry it up the ravine to a shelter in darkness, out of the torchlight');
      if (!this.saidFood) {
        this.saidFood = true;
        w.say('Food by Night', 'Food reached the ravine only in secret. Some relatives carried it in by night; among them was Hakim ibn Hizam. (Ibn Ishaq)', { ms: 11000 });
      }
    },

    give(env, h) {
      const w = this.w, bd = this.carrying;
      h.fed = true; h.lit = 0; bd.delivered = true; this.carrying = null; this.lastShelter = h;
      this.carried.visible = false; w.speed = 2.8; w.run = 5;
      // the bundle is set down inside the doorway and stays there
      bd.mesh.position.set(h.door.x * 0.55 + h.inner.x * 0.45, ground(h.door.x, h.door.z) + 0.18, h.door.z * 0.55 + h.inner.z * 0.45);
      bd.mesh.visible = true; bd.mesh.scale.setScalar(0.01); bd.grow = 0;
      this.fed++;
      const sp = w.spatial(h.door, 8), chord = [196, 246.94, 293.66, 392, 329.63, 440];
      SND.knock(env.bus, { f: 160, gain: 0.08, click: 900 });
      SND.sing(env.bus, chord[this.fed - 1] * 0.5, { vowel: 'm', dur: 3.2, gain: 0.045, pan: sp.pan, voices: 2, attack: 0.3, hold: 0.5 });
      SND.bell(env.bus, chord[this.fed - 1], { gain: 0.035, delay: 0.25, pan: sp.pan });
      const left = 6 - this.fed;
      w.progress(this.fed, left ? `${left === 1 ? 'One bundle remains' : left + ' bundles remain'} by the mouth and among the rocks` : 'Every shelter has food tonight');
      if (this.fed === 3) setTimeout(() => this.w && this.w.say('Three Years', 'The boycott lasted about three years. In the ravine, each bundle carried in by night was a small mercy against hunger. (Ibn Ishaq)', { ms: 10000 }), 1800);
      if (this.fed === 6) { this.phase = 'still'; this.endT = 0; }
    },

    caught(env) {
      const w = this.w, bd = this.carrying;
      this.returnT = 0; w.enabled = false;
      SND.swell(env.bus, { f0: 900, f1: 300, dur: 1.4, gain: 0.07 });
      SND.sing(env.bus, 220, { vowel: 'o', dur: 2.2, gain: 0.03, glide: 1.12, attack: 0.1 });
      SND.sing(env.bus, 164.81, { vowel: 'o', dur: 2.4, gain: 0.025, delay: 0.5, attack: 0.2 });
      this.returning = bd;
    },

    update(env, dt) {
      const w = this.w; if (!w) return;
      const px = w.pos.x, pz = w.pos.z;
      w.update(dt);
      // keep to the floor of the ravine: slide along the walls
      if (!inFloor(w.pos.x, w.pos.z)) {
        if (inFloor(px, w.pos.z)) w.pos.x = px; else if (inFloor(w.pos.x, pz)) w.pos.z = pz; else { w.pos.x = px; w.pos.z = pz; }
      }
      const t = w.time, b = env.bus;
      KIT.driftDust(this.dust, dt, t, [0.05, -0.03]);
      if (!this.introSaid && !w.cine) {
        this.introSaid = true;
        w.say('The Oath at Khayf', 'Quraysh swore an oath at Khayf Bani Kinanah against Banu Hashim and Banu al-Muttalib: no one would marry among them, and no one would trade with them. The clan withdrew into this ravine, the ravine of Abu Talib. (Sahih al-Bukhari 1590; Ibn Ishaq)', { ms: 12000 });
      }

      // the ember fire breathes
      const fl = 0.8 + 0.2 * Math.sin(t * 7.3) * Math.sin(t * 3.1 + 1);
      this.ember.intensity = 1.5 * fl; this.emberGlow.material.opacity = 0.55 * fl;

      // bundles glint; the carried one sways with your step
      for (const bd of BUNDLES) {
        if (!bd.taken) {
          const tw = Math.pow(Math.max(0, Math.sin(t * 1.3 + bd.ph)), 12);
          bd.glint.material.opacity = 0.25 + 0.75 * tw; bd.glint.scale.setScalar(0.6 + tw * 0.8);
          bd.halo.material.opacity = 0.1 + 0.05 * Math.sin(t * 1.3 + bd.ph);
        }
        if (bd.grow != null && bd.grow < 1) { bd.grow = Math.min(1, bd.grow + dt * 3); const k = U.easeOut(bd.grow); bd.mesh.scale.setScalar(k * (1 + Math.sin(bd.grow * Math.PI) * 0.15)); }
      }
      if (this.carrying) {
        this.carryLift = Math.min(1, (this.carryLift || 0) + dt * 5);
        const k = U.easeOut(this.carryLift);
        this.carried.position.set(0.12, -0.7 + k * 0.2 + Math.sin(w.bob * 2) * 0.012, -0.85);
        this.carryGlow.material.opacity = 0.1 * k;
      } else this.carryGlow.material.opacity = 0;

      // the shelters: a fed shelter brightens and stays warm; the next goal is the warmest thing in view
      for (const h of SHELTERS) {
        if (h.fed) {
          h.lit = Math.min(1, h.lit + dt * 0.6);
          const k = U.easeOut(h.lit), f = 0.9 + 0.1 * Math.sin(t * 5 + h.z) * Math.sin(t * 2.3 + h.x);
          h.mat.emissiveIntensity = (0.04 + 0.5 * k) * f;
          h.glow.material.opacity = (0.15 + 0.6 * k) * f; h.glow.scale.setScalar(2.2 + k * 2.6 + Math.sin(h.lit * Math.PI) * 1.5);
          h.pool.material.opacity = 0.32 * k * f;
        } else {
          const want = this.carrying ? 0.12 + 0.08 * Math.sin(t * 2 + h.z) : 0.05;
          h.mat.emissiveIntensity = U.damp(h.mat.emissiveIntensity, want * 0.5, 3, dt);
          h.glow.material.opacity = U.damp(h.glow.material.opacity, want, 3, dt);
          h.pool.material.opacity = U.damp(h.pool.material.opacity, this.carrying ? 0.06 : 0, 3, dt);
        }
      }

      // the patrols walk the rim, sweeping the lower ravine
      const fade = this.phase === 'carry' ? 1 : Math.max(0, 1 - this.endT / 3);
      let lit = false, near = 0;
      for (const P of this.patrols) {
        const z = P.zc + P.A * Math.sin(t * P.w + P.ph);
        const rx = cx(z) + P.side * (hw(z) + 10.5);
        P.pos.set(rx, ground(rx, z) + 1.6, z);
        const sx = cx(z + 2) + Math.sin(t * P.sw + P.ph * 1.7) * 6.4 + Math.sin(t * 0.9 + P.ph) * 0.4;
        const sz = z + 2 + Math.sin(t * P.sw * 0.7 + P.ph) * 3;
        P.tgt.set(sx, ground(sx, sz), sz);
        const fk = (0.86 + 0.14 * Math.sin(t * 13 + P.ph * 5) * Math.sin(t * 7 + P.ph)) * fade;
        P.flame.position.copy(P.pos); P.flame.material.opacity = 0.9 * fk; P.flame.scale.setScalar(2.2 + 0.4 * Math.sin(t * 11 + P.ph));
        P.core.position.copy(P.pos); P.core.material.opacity = fk;
        const dist = P.pos.distanceTo(P.tgt);
        P.beam.position.copy(P.pos); P.beam.scale.set(POOL_R, POOL_R, dist); P.beam.lookAt(P.tgt); P.beam.visible = fade > 0.01;
        P.spot.position.copy(P.pos); P.spot.target.position.copy(P.tgt); P.spot.angle = Math.atan(POOL_R * 1.25 / dist); P.spot.intensity = 2.6 * fk;
        placeDecal(P.pool, sx, sz, 0.08); P.pool.material.opacity = 0.32 * fk;
        const d = Math.hypot(w.pos.x - sx, w.pos.z - sz);
        if (d < POOL_R * 0.92 && fade > 0.5) lit = true;
        const sp = w.spatial(P.pos, 14); near = Math.max(near, sp.gain);
        P.crackle.set('gain', 0.035 * sp.gain * fade, 0.1);
      }
      this.beamMat.uniforms.uOp.value = 0.2 * fade;

      // being seen while carrying: a warm vignette fills, the heart quickens, and then the night takes you back
      if (this.returnT < 0) {
        const exposed = lit && this.carrying && !w.cine;
        this.seen = U.clamp(this.seen + (exposed ? dt / 0.75 : -dt / 0.9));
        if (exposed && !this.wasLit) SND.sing(b, U.rnd(100, 120), { vowel: 'a', dur: 0.6, gain: 0.03, voices: 1, attack: 0.05, hold: 0.3, glide: 1.1, pan: U.rnd(-0.6, 0.6) });
        this.wasLit = exposed;
        if (this.seen >= 1 && this.carrying) this.caught(env);
      }
      this.vig.style.opacity = (Math.max(this.seen, this.returnT >= 0 ? 1 - this.returnT / 1.2 : 0)).toFixed(3);
      this.heart -= dt * (1 + this.seen * 2.2);
      if (this.carrying && this.heart < 0 && (this.seen > 0.05 || near > 0.35)) { this.heart = 1; SND.thump(b, { f: 50, gain: 0.08 + this.seen * 0.15, dur: 0.4 }); }

      if (this.returnT >= 0) {
        this.returnT += dt;
        const rt = this.returnT;
        this.curtain.style.opacity = (U.smooth(0, 0.9, rt) * (1 - U.smooth(1.6, 2.6, rt))).toFixed(3);
        if (rt >= 1.0 && this.returning) {
          // the bundle goes back to its hiding place; you are back by the last shelter
          const bd = this.returning; this.returning = null;
          bd.taken = false; bd.mesh.visible = true; bd.glint.visible = true; bd.halo.visible = true;
          this.carrying = null; this.carried.visible = false; this.seen = 0; w.speed = 2.8; w.run = 5;
          const h = this.lastShelter;
          if (h) { w.pos.set(h.door.x * 1.0 + (cx(h.z) - h.door.x) * 0.35, 0, h.door.z); w.yaw = 0; }
          else { w.pos.set(START.x, 0, START.z); w.yaw = 0; }
          w.y = ground(w.pos.x, w.pos.z); w.vel.set(0, 0, 0); w.pitch = 0;
          w.step('The torchlight found you; the bundle is back among the rocks. Wait for the light to pass, then go again');
        }
        if (rt >= 2.6) { this.returnT = -1; w.enabled = true; this.curtain.style.opacity = 0; }
      }

      // the hum of the shelters: a few voices, more of them and fuller as food arrives
      this.humClock -= dt;
      if (this.humClock < 0 && this.phase === 'carry') {
        this.humClock = 2.5 + Math.random() * 3 - this.fed * 0.25;
        const h = U.pick(SHELTERS), sp = w.spatial(h.door, 9);
        if (h.fed) SND.sing(b, U.pick([196, 246.94, 293.66]) * 0.5, { vowel: 'm', dur: U.rnd(2, 3.5), gain: 0.03 * sp.gain + 0.004, pan: sp.pan, voices: 2, attack: 0.5, hold: 0.5 });
        else SND.sing(b, U.rnd(105, 125), { vowel: U.pick(['m', 'u']), dur: U.rnd(1.5, 2.5), gain: 0.018 * sp.gain + 0.002, pan: sp.pan, voices: 1, attack: 0.4, breath: 0.15, vib: 0.002 });
      }
      // voices of the watch on the rim, low and far
      this.rimClock -= dt;
      if (this.rimClock < 0 && this.phase === 'carry') {
        this.rimClock = 5 + Math.random() * 7;
        const P = U.pick(this.patrols), sp = w.spatial(P.pos, 18);
        SND.sing(b, U.rnd(90, 115), { vowel: U.pick(['a', 'o']), dur: U.rnd(0.4, 0.8), gain: 0.02 * sp.gain + 0.002, pan: sp.pan, voices: 1, attack: 0.05, hold: 0.2 });
      }
      this.cricketClock -= dt;
      if (this.cricketClock < 0 && this.phase === 'carry') { this.cricketClock = 0.6 + Math.random() * 1.6; SND.cricket(b, { gain: 0.003 }); }
      this.gust -= dt;
      if (this.gust < 0 && this.phase === 'carry') { this.gust = 6 + Math.random() * 7; SND.swell(b, { f0: 180, f1: 600, dur: 3.5, gain: 0.05, pan: U.rnd(-1, 1) }); }

      /* ---------- the end: stillness, then the words left on the document ---------- */
      if (this.phase === 'still' || this.phase === 'reveal') {
        const T0 = this.endT, T1 = (this.endT += dt), at = s => T0 < s && T1 >= s;
        if (at(0.5)) w.finish('Six shelters have food tonight');
        // near-silence: the wind drops away before the words appear
        this.wind.set('gain', 0.05 * (1 - U.smooth(1, 5, T1)) + 0.012 * U.smooth(14, 20, T1), 0.4);
        if (at(6)) {
          this.phase = 'reveal';
          const f = w.forward(), l = Math.hypot(f.x, f.z) || 1;
          this.words.position.set(w.pos.x + f.x / l * 40, w.y + 17, w.pos.z + f.z / l * 40);
          SND.glow(b, 146.83, { gain: 0.05, dur: 12, vowel: 'o' });
        }
        if (at(7.5)) w.say('The Document', 'The sirah reports that the boycott document hung in the Ka‘bah was eaten by termites, all but the words <span class="q">“Bismika Allahumma”</span>, “In Your name, O God.” (sirah report, without a connected chain of narrators)', { ar: 'بِاسْمِكَ اللَّهُمَّ', ms: 12500 });
        if (at(9)) SND.glow(b, 220, { gain: 0.045, dur: 11 });
        if (at(12)) SND.glow(b, 293.66, { gain: 0.04, dur: 10 });
        if (at(20.5)) w.say('The Boycott Ends', 'The boycott was brought to an end through the efforts of several men of Quraysh, among them Hisham ibn ‘Amr and al-Mut‘im ibn ‘Adi. The clan came out of the ravine. (Ibn Ishaq)', { ms: 12000 });
        if (at(33)) {
          w.say('The Year of Sorrow', 'Soon after, Abu Talib died, and Khadijah died three years before the Hijrah (Sahih al-Bukhari 3896). The year of their loss was later called the Year of Sorrow. (sirah)', { ms: 12000 });
          SND.sing(b, 110, { vowel: 'o', dur: 7, gain: 0.03, voices: 3, attack: 2, hold: 0.5 });
        }
        const wk = U.smooth(6.5, 10, T1) * (1 - U.smooth(30, 40, T1) * 0.5);
        this.words.material.opacity = wk; this.words.position.y += Math.sin(t * 0.4) * 0.003;
        // the sky lightens towards dawn
        const dawn = U.smooth(8, 40, T1);
        const u = this.skyM.material.uniforms;
        u.uMid.value.setRGB(0.07 + dawn * 0.2, 0.1 + dawn * 0.1, 0.21 + dawn * 0.02); u.uStars.value = 1.5 * (1 - dawn * 0.6);
        this.hemi.intensity = 0.62 + dawn * 0.25;
      }
    },
  }));
})();
