/* Madinah — The Hejaz Railway, 1 September 1908. A train-driving simulator (after Train Sim World)
   with gauge management. From the cab of the steam locomotive you drive the last stretch into
   Madinah: open the regulator, feed the firebox to keep the boiler's pressure, keep water in the
   glass, slow for the signals, cross the 'Aqiq bridge at walking pace, and bring the train to rest
   at the platform mark. Then the station receives it. No person is shown: the welcome is lamps,
   banners and a sung chorus. */
(function () {
  'use strict';
  if (!window.WORLD) return;
  const T = THREE;
  const CTRL = [[0, 1560], [40, 1250], [70, 900], [10, 560], [-70, 200], [-60, -120], [-40, -300], [-10, -520], [30, -860], [40, -1160], [20, -1420], [10, -1560]];
  const WADI = x => -300 + 30 * Math.sin(x / 110);       // the 'Aqiq crosses the line here
  const KMH = 3.6;

  /* ---------------- the line ---------------- */
  const C2 = new T.CatmullRomCurve3(CTRL.map(([x, z]) => new T.Vector3(x, 0, z)), false, 'centripetal');
  const NP = 700, P2 = C2.getSpacedPoints(NP), L2 = C2.getLength(), DS = L2 / NP;
  // spatial hash of the line for fast nearest-point lookup
  const grid = new Map(), cell = 60, key = (i, j) => i * 10007 + j;
  P2.forEach((p, i) => { const k = key(Math.floor(p.x / cell), Math.floor(p.z / cell)); if (!grid.has(k)) grid.set(k, []); grid.get(k).push(i); });
  function near(x, z) {
    const ci = Math.floor(x / cell), cj = Math.floor(z / cell); let best = 1e9, bi = 0;
    for (let di = -1; di <= 1; di++) for (let dj = -1; dj <= 1; dj++) { const a = grid.get(key(ci + di, cj + dj)); if (!a) continue; for (const i of a) { const d = (P2[i].x - x) ** 2 + (P2[i].z - z) ** 2; if (d < best) { best = d; bi = i; } } }
    return best < 1e8 ? { d: Math.sqrt(best), i: bi } : { d: 1e4, i: 0 };
  }
  function natural(x, z) {
    let y = 5 + SCAPE.fbm(x * 0.004, z * 0.004, 3) * 10 + SCAPE.ridge(x * 0.012 + 5, z * 0.012, 4) * 7;
    // the black hummocks of the harrah
    y += Math.pow(Math.max(0, SCAPE.fbm(x * 0.02 + 9, z * 0.02, 3)), 1.5) * 9 * (1 - U.smooth(-900, -1150, z));
    // the 'Aqiq valley
    const dw = Math.abs(z - WADI(x)); y -= 13 * (1 - U.smooth(26, 70, dw)); y += (1 - U.smooth(0, 26, dw)) * SCAPE.fbm(x * 0.05, z * 0.05, 2) * 0.6;
    // the plain of Madinah
    y = U.lerp(y, 2 + SCAPE.fbm(x * 0.01, z * 0.01, 2) * 1.5, U.smooth(-950, -1200, z));
    // hills and the far mountains
    const dx = Math.abs(x - 20); y += Math.max(0, dx - 500) * 0.22 * (0.6 + 0.8 * SCAPE.ridge(x * 0.004, z * 0.004, 3));
    y += 120 * Math.exp(-Math.pow(Math.hypot(x + 300, z + 2400) / 400, 1.4));       // a great mountain north of the city
    return y + SCAPE.fbm(x * 0.15, z * 0.15, 2) * 0.15;
  }
  // the track's own level: smoothed along its length, carried over the wadi on the bridge
  const TY = new Float32Array(NP + 1);
  (() => {
    const raw = P2.map(p => natural(p.x, p.z));
    for (let i = 0; i <= NP; i++) { let s = 0, n = 0; for (let j = -40; j <= 40; j++) { const k = U.clamp(i + j, 0, NP); const v = raw[k]; s += Math.abs(P2[k].z - WADI(P2[k].x)) < 70 ? 0 : v; n += Math.abs(P2[k].z - WADI(P2[k].x)) < 70 ? 0 : 1; } TY[i] = n ? s / n : raw[i]; }
    for (let it = 0; it < 4; it++) for (let i = 1; i < NP; i++) TY[i] = (TY[i - 1] + TY[i] * 2 + TY[i + 1]) / 4;
  })();
  const isBridge = i => Math.abs(P2[i].z - WADI(P2[i].x)) < 46;
  function height(x, z) {
    const y = natural(x, z), n = near(x, z);
    if (n.d > 60) return y;
    const bed = TY[n.i] - 0.55;
    if (isBridge(n.i)) return n.d < 7 ? Math.min(y, bed - 2) : y;
    const k = 1 - U.smooth(4.5, 26, n.d);
    return U.lerp(y, bed - Math.max(0, n.d - 4.5) * 0.04, k);
  }

  ENGINE.register(WORLD.stage({
    key: 'railway',
    arabic: 'سِكَّةُ حَدِيدِ الْحِجَاز',
    title: 'The Hejaz Railway',
    era: 'The last stretch into Madinah · 1 September 1908 · drive the train home',
    hint: 'W/S regulator · hold Space to brake · F feed the fire · hold R water · H whistle · V reverse · C outside view · E look out · mouse to look round the cab',
    hintTouch: 'Use the cab buttons: regulator + and −, BRAKE (hold), FIRE, WATER (hold), WHISTLE, VIEW · drag to look round',
    sound: { reverb: 0.35 },
    story: `<p>Ordered by Sultan Abdul Hamid II in 1900 and paid for largely by donations, the Hejaz Railway ran some 1,300 kilometres from Damascus to Madinah. It reached Madinah on 1 September 1908, and cut a journey of about forty days to about five. South of al-Ula it was built and run by Muslims alone.</p>
            <p>The line was wrecked in the First World War. The station in Madinah still stands; since 2006 it has been a museum.</p>`,

    enter(env) {
      const self = this;
      const w = this.w = WORLD.create(env, { start: { x: 0, z: 1500, yaw: 0 }, exposure: 0.85, far: 3600, fov: 62, fog: { color: 0xe0c49c, density: 0.00065 } });
      const S = w.scene;

      /* ---------- land, sky, light ---------- */
      const ter = SCAPE.terrain(w, { size: 3600, seg: 380, cx: 0, cz: 0, height, rock: [0.72, 0.9], colors: { low: '#a89070', high: '#8a7a6a', rock: '#4e4644', dark: '#2e2a2a' }, photo: { ground: 'dry_ground_rocks', rock: 'dark_rock', normal: 1.1 }, rep: 0.14, rockRep: 0.04 });
      const ground = w.ground = ter.ground; this.ground = ground;
      w.sky({ top: '#5d86c0', mid: '#f3d2a4', bot: '#c8a070', sunDir: [0.7, 0.2, 0.5], sun: '#ffd7a0', sunSize: 0.0016, clouds: 0.3, haze: 0.4 });
      const sun = new T.DirectionalLight(0xffdcb0, 1.9); sun.position.set(70, 22, 50); S.add(sun); this.sun = sun;
      S.add(new T.HemisphereLight(0xc8d8f0, 0x8a6a4a, PHOTO.enabled ? 0.08 : 0.7));
      w.followShadow(sun, 70, 2048);
      this.sunDir = new T.Vector3(0.7, 0.2, 0.5).normalize();
      PHOTO.sky(w, 'syferfontein_6d_clear_puresky', { sun, intensity: 0.7, haze: '#e8cca4', horizon: 0.45, rotation: 0.8, ground: '#a08060' }).then(o => { if (o && o.sunDir) this.sunDir.copy(o.sunDir); });
      SCAPE.horizon(w, { haze: '#e8cca4', layers: [{ r: 1900, h: 120, color: '#6e5a52' }, { r: 2500, h: 170, color: '#94807a' }, { r: 3100, h: 200, color: '#b8a89e' }] });

      /* ---------- materials ---------- */
      const granite = SCAPE.tex.granite(w), basaltT = SCAPE.tex.lava(w);
      const basalt = PHOTO.mat(w, 'dark_rock', { rep: [1, 1], fallback: basaltT, color: 0xb0aaa6 });
      const pale = PHOTO.mat(w, 'marble_01', { rep: [1, 1], fallback: KIT.plaster(w, [1, 1]), color: 0xe8e0d0 });
      const stoneM = PHOTO.mat(w, 'old_stone_wall', { rep: [1, 1], fallback: granite, color: 0xc8b8a4 });
      const plaster = PHOTO.mat(w, 'clay_plaster', { triplanar: 0.25, fallback: SCAPE.tex.mud(w), color: 0xe8dcc8 });
      const planks = PHOTO.mat(w, 'old_planks_02', { rep: [1, 1], fallback: KIT.wood(w), color: 0x9a7a5a });
      const beamM = PHOTO.mat(w, 'medieval_wood', { rep: [1, 1], fallback: KIT.wood(w), color: 0x8a7058 });
      const ballastM = PHOTO.mat(w, 'gravelly_sand', { rep: [1, 1], fallback: SCAPE.tex.gravel(w), color: 0x9a8e84 });
      const steel = new T.MeshStandardMaterial({ color: 0x6a645e, metalness: 0.85, roughness: 0.35 });
      const iron = new T.MeshStandardMaterial({ color: 0x18181a, metalness: 0.55, roughness: 0.5 });
      const brass = new T.MeshStandardMaterial({ color: 0xc8a050, metalness: 0.9, roughness: 0.3 });
      const red = new T.MeshStandardMaterial({ color: 0x6a1c14, metalness: 0.4, roughness: 0.55 });
      this.mats = { iron, brass };

      /* ---------- the track: ballast, sleepers, rails, poles, km posts ---------- */
      this.TY = TY; this.P2 = P2; this.L2 = L2;
      const frameAt = (s, o) => { const u = U.clamp(s / L2, 0, 1), f = u * NP, i = Math.min(NP - 1, Math.floor(f)), t = f - i; o = o || {}; o.x = U.lerp(P2[i].x, P2[i + 1].x, t); o.z = U.lerp(P2[i].z, P2[i + 1].z, t); o.y = U.lerp(TY[i], TY[i + 1], t); const dx = P2[i + 1].x - P2[i].x, dz = P2[i + 1].z - P2[i].z, l = Math.hypot(dx, dz); o.dx = dx / l; o.dz = dz / l; o.g = (TY[i + 1] - TY[i]) / DS; o.i = i; return o; };
      this.frameAt = frameAt;
      {
        // ballast and rails as ribbons along the line
        const ribbon = (half, dy, mat, hgt) => {
          const P = [], I = [], UV = [];
          for (let i = 0; i <= NP; i++) {
            const p = P2[i], q = P2[Math.min(NP, i + 1)], r0 = P2[Math.max(0, i - 1)], dx = q.x - r0.x, dz = q.z - r0.z, l = Math.hypot(dx, dz), nx = -dz / l, nz = dx / l, y = TY[i] + dy;
            if (hgt) { P.push(p.x + nx * half[0], y, p.z + nz * half[0], p.x + nx * half[1], y, p.z + nz * half[1], p.x + nx * half[1], y - hgt, p.z + nz * half[1], p.x + nx * half[0], y - hgt, p.z + nz * half[0]); }
            else P.push(p.x + nx * half[0], y, p.z + nz * half[0], p.x + nx * half[1], y, p.z + nz * half[1]);
            const v = i * DS / 4; if (hgt) UV.push(0, v, 1, v, 1, v, 0, v); else UV.push(0, v, (half[1] - half[0]) / 4, v);
          }
          const per = hgt ? 4 : 2;
          for (let i = 0; i < NP; i++) { const a = i * per, b = a + per; if (hgt) { I.push(a, b, a + 1, a + 1, b, b + 1, a + 1, b + 1, a + 2, a + 2, b + 1, b + 2, a + 3, b + 3, a, a, b + 3, b); } else I.push(a, b, a + 1, a + 1, b, b + 1); }
          const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(UV, 2)); g.setIndex(I); g.computeVertexNormals();
          const m = new T.Mesh(g, mat); m.receiveShadow = true; S.add(m); return m;
        };
        ribbon([-2.6, 2.6], -0.05, ballastM, 0.5);
        ribbon([-0.555, -0.49], 0.17, steel, 0.12); ribbon([0.49, 0.555], 0.17, steel, 0.12);
        // sleepers
        const n = Math.floor(L2 / 0.75), sg = new T.BoxGeometry(2.0, 0.14, 0.24), sm = new T.InstancedMesh(sg, planks, n);
        const m4 = new T.Matrix4(), q = new T.Quaternion(), e = new T.Euler(), p = new T.Vector3(), sc = new T.Vector3(1, 1, 1), f = {};
        for (let i = 0; i < n; i++) { frameAt(i * 0.75, f); e.set(0, Math.atan2(-f.dz, f.dx) + Math.PI / 2 + Math.PI / 2, 0); q.setFromEuler(e); m4.compose(p.set(f.x, f.y + 0.03, f.z), q, sc); sm.setMatrixAt(i, m4); }
        sm.receiveShadow = true; sm.userData.dynamic = true; S.add(sm);
        // telegraph poles every 50 m
        const np = Math.floor(L2 / 50), pg = new T.CylinderGeometry(0.09, 0.12, 7, 6); pg.translate(0, 3.5, 0);
        const cg = new T.BoxGeometry(1.4, 0.1, 0.1); cg.translate(0, 6.6, 0);
        const poles = new T.InstancedMesh(SCAPE.merge([pg, cg]), beamM, np);
        for (let i = 0; i < np; i++) { frameAt(i * 50 + 20, f); const ox = -f.dz * 4.2, oz = f.dx * 4.2; e.set(0, Math.atan2(-f.dz, f.dx), 0); q.setFromEuler(e); m4.compose(p.set(f.x + ox, ground(f.x + ox, f.z + oz) - 0.2, f.z + oz), q, sc); poles.setMatrixAt(i, m4); }
        poles.castShadow = true; poles.userData.dynamic = true; S.add(poles);
        // km posts
        for (let k = 1; k < 3; k++) { frameAt(k * 1000, f); const ox = f.dz * 3.4, oz = -f.dx * 3.4; const post = new T.Mesh(new T.BoxGeometry(0.25, 1.2, 0.25), pale); post.position.set(f.x + ox, ground(f.x + ox, f.z + oz) + 0.6, f.z + oz); S.add(post); }
      }
      /* ---------- the bridge over the 'Aqiq ---------- */
      {
        let i0 = -1, i1 = -1; for (let i = 0; i <= NP; i++) if (isBridge(i)) { if (i0 < 0) i0 = i; i1 = i; }
        this.bridge = [i0 * DS, i1 * DS];
        const f = {}, arches = Math.max(4, Math.round((i1 - i0) * DS / 9));
        for (let a = 0; a <= arches; a++) {
          frameAt(U.lerp(i0 * DS, i1 * DS, a / arches), f);
          const gy = Math.min(ground(f.x - 3, f.z), ground(f.x + 3, f.z)), h = f.y - gy + 1;
          const pier = new T.Mesh(new T.BoxGeometry(5.6, h, 2.2), a % 2 ? basalt : stoneM); pier.position.set(f.x, gy + h / 2 - 0.6, f.z); pier.rotation.y = Math.atan2(-f.dz, f.dx) + Math.PI / 2; S.add(pier);
        }
        // the deck and its parapets
        for (let s = i0 * DS; s < i1 * DS; s += 4) {
          frameAt(s + 2, f); const deck = new T.Mesh(new T.BoxGeometry(5.6, 1.2, 4.1), stoneM); deck.position.set(f.x, f.y - 0.85, f.z); deck.rotation.y = Math.atan2(-f.dz, f.dx) + Math.PI / 2; S.add(deck);
          [-2.7, 2.7].forEach(o => { const par = new T.Mesh(new T.BoxGeometry(0.4, 0.8, 4.1), basalt); par.position.set(f.x - f.dz * o, f.y + 0.1, f.z + f.dx * o); par.rotation.y = deck.rotation.y; S.add(par); });
        }
      }
      /* ---------- the water station at the start ---------- */
      {
        const f = frameAt(60), ox = f.dz * 9, oz = -f.dx * 9, x = f.x + ox, z = f.z + oz, gy = ground(x, z);
        const tower = new T.Mesh(new T.CylinderGeometry(3.2, 3.6, 7, 16), stoneM); tower.position.set(x, gy + 3.5, z); S.add(tower);
        const tank = new T.Mesh(new T.CylinderGeometry(3.6, 3.6, 3, 20), iron); tank.position.set(x, gy + 8.5, z); S.add(tank);
        const hut = new T.Mesh(new T.BoxGeometry(10, 4, 6), basalt); const hx = f.x - f.dz * 11 + f.dx * 30, hz = f.z + f.dx * 11 + f.dz * 30; hut.position.set(hx, ground(hx, hz) + 2, hz); hut.rotation.y = Math.atan2(-f.dz, f.dx) + Math.PI / 2; S.add(hut);
        const band = new T.Mesh(new T.BoxGeometry(10.1, 0.5, 6.1), pale); band.position.copy(hut.position).add(new T.Vector3(0, 1.5, 0)); band.rotation.y = hut.rotation.y; S.add(band);
        this.halt = { x, z };
        PHOTO.place(w, 'namaqualand_boulder_05', { pos: [x + 6, undefined, z + 4], s: 1.2 });
      }

      /* ---------- Madinah: the station, the city, the mosque on the skyline ---------- */
      const END = L2 - 30; this.END = END; this.MARK = END - 46;
      {
        const f = frameAt(this.MARK - 40), rot = Math.atan2(-f.dz, f.dx) + Math.PI / 2, side = 1;
        const nx = f.dz * side, nz = -f.dx * side;   // to the platform side
        const cxp = f.x + nx * 13, czp = f.z + nz * 13, gy = TY[f.i];
        this.station = { x: cxp, z: czp, y: gy, rot };
        const g = new T.Group(); g.position.set(cxp, gy, czp); g.rotation.y = rot; S.add(g);
        // the platform
        const plat = new T.Mesh(new T.BoxGeometry(9, 1.0, 150), pale); plat.position.set(-7.5, 0.1, 0); g.add(plat);
        // the station building: black basalt banded with pale stone, an arcade in front
        const body = new T.Mesh(new T.BoxGeometry(12, 9, 70), basalt); body.position.set(5, 4.5, 0); g.add(body);
        for (let b = 0; b < 4; b++) { const band = new T.Mesh(new T.BoxGeometry(12.1, 0.45, 70.1), pale); band.position.set(5, 1.6 + b * 2.2, 0); g.add(band); }
        const cor = new T.Mesh(new T.BoxGeometry(12.6, 0.6, 70.6), pale); cor.position.set(5, 9.2, 0); g.add(cor);
        for (let k = 0; k < 14; k++) {
          const z = -32 + k * 4.9; const col = new T.Mesh(new T.BoxGeometry(0.7, 4.6, 0.7), pale); col.position.set(-2.4, 2.9, z); g.add(col);
          const arch = new T.Mesh(new T.TorusGeometry(1.85, 0.28, 6, 16, Math.PI), pale); arch.rotation.y = Math.PI / 2; arch.position.set(-2.4, 5.2, z + 2.45); g.add(arch);
        }
        const roof = new T.Mesh(new T.BoxGeometry(3, 0.5, 70), pale); roof.position.set(-1.6, 7.3, 0); g.add(roof);
        // banners along the arcade, rising at the arrival
        this.banners = [];
        const bannerM = PHOTO.mat(w, 'rough_linen', { rep: [1, 2], fallback: KIT.plaster(w, [1, 1], '#b02018'), color: 0xb02a20, side: T.DoubleSide });
        const greenM = PHOTO.mat(w, 'rough_linen', { rep: [1, 2], fallback: KIT.plaster(w, [1, 1], '#20703a'), color: 0x2a7040, side: T.DoubleSide });
        for (let k = 0; k < 10; k++) { const bnr = new T.Mesh(new T.PlaneGeometry(1.4, 3.2), k % 2 ? greenM : bannerM); bnr.position.set(-2.6, -1, -28 + k * 6.2); bnr.rotation.y = Math.PI / 2; bnr.userData.dynamic = true; g.add(bnr); this.banners.push(bnr); }
        // lamps on the platform
        this.platLamps = [];
        for (let k = 0; k < 8; k++) {
          const z = -34 + k * 9.5; const post = new T.Mesh(new T.CylinderGeometry(0.07, 0.1, 3.6, 6), iron); post.position.set(-10.5, 2.4, z); g.add(post);
          const gl = KIT.glow(w, 0xffc070, 1.4, 0); gl.position.set(-10.5, 4.5, z); g.add(gl); this.platLamps.push(gl);
        }
        // the platform mark: a white post with a lamp, where the cab must come to rest
        const mf = frameAt(this.MARK), mx = mf.x + mf.dz * 3.2, mz = mf.z - mf.dx * 3.2;
        const mark = new T.Mesh(new T.BoxGeometry(0.3, 1.8, 0.3), pale); mark.position.set(mx, mf.y + 0.9, mz); S.add(mark);
        this.markGlow = KIT.glow(w, 0xfff0c0, 1.6, 0.8); this.markGlow.position.set(mx, mf.y + 2.1, mz); S.add(this.markGlow);
        PHOTO.place(w, 'vintage_oil_lamp', { pos: [mx, mf.y + 1.8, mz], s: 1.4 });
        // buffer stops at the end of the line
        const ef = frameAt(END + 12); const buf = new T.Mesh(new T.BoxGeometry(3, 1.4, 1.2), iron); buf.position.set(ef.x, ef.y + 0.7, ef.z); buf.rotation.y = Math.atan2(-ef.dz, ef.dx) + Math.PI / 2; S.add(buf);
        const sl = new T.PointLight(0xffc070, 0, 40, 1.6); sl.position.set(cxp, gy + 6, czp); S.add(sl); this.stationLight = sl;
        // the city beyond: houses, palms, and the Prophet's Mosque on the skyline
        const city = { x: f.x + nx * 220 - f.dx * 120, z: f.z + nz * 220 - f.dz * 120 }; this.city = city;
        const hs = SCAPE.scatter(w, { kind: 'house', n: 520, area: { x: city.x, z: city.z, r: 320 }, scale: [7, 11], seed: 51, avoid: (x, z) => near(x, z).d < 40 || Math.hypot(x - cxp, z - czp) < 50 });
        hs.meshes.forEach(m => { m.material = plaster; });
        const dome = KIT.greenDome(w, 0.9); dome.position.set(city.x, ground(city.x, city.z) + 14, city.z); S.add(dome);
        const base = new T.Mesh(new T.BoxGeometry(70, 14, 90), plaster); base.position.set(city.x, ground(city.x, city.z) + 7, city.z + 10); S.add(base);
        [[-34, -44], [34, -44], [-34, 64], [34, 64]].forEach(([dx, dz]) => { const m = KIT.minaret(w, 42, false); m.position.set(city.x + dx, ground(city.x, city.z), city.z + dz); S.add(m); });
        SCAPE.scatter(w, { kind: 'palm', n: 260, area: { x: city.x - 60, z: city.z + 160, r: 420 }, scale: [8, 13], seed: 52, avoid: (x, z) => near(x, z).d < 14 || Math.hypot(x - city.x, z - city.z) < 120 });
      }
      /* ---------- the land's texture ---------- */
      const off = (x, z) => near(x, z).d < 7;
      SCAPE.scatter(w, { kind: 'model', model: 'namaqualand_boulder_02', fallback: 'boulder', n: 260, area: [-260, -900, 300, 1560], scale: [1, 3], seed: 61, color: '#5a5452', avoid: off, density: (x, z) => U.smooth(8, 20, near(x, z).d) });
      SCAPE.scatter(w, { kind: 'model', model: 'namaqualand_rocks_01', n: 500, area: [-200, -1000, 240, 1560], scale: [0.8, 2], seed: 62, color: '#4a4442', avoid: off, density: (x, z) => near(x, z).d < 80 ? 1 : 0.1 });
      SCAPE.scatter(w, { kind: 'boulder', n: 700, area: [-900, -1000, 900, 1700], scale: [2, 7], seed: 63, tex: 'lava', avoid: (x, z) => near(x, z).d < 10 });
      SCAPE.scatter(w, { kind: 'rock', n: 1200, area: [-300, -1100, 300, 1600], scale: [0.4, 1.6], seed: 64, tex: 'lava', avoid: off });
      SCAPE.scatter(w, { kind: 'model', model: 'shrub_03', fallback: 'shrub', n: 220, area: [-200, -1100, 200, 1600], scale: [0.8, 1.6], seed: 65, avoid: off });
      SCAPE.scatter(w, { kind: 'thorn', n: 300, area: [-300, -1100, 300, 1600], scale: [0.7, 1.5], seed: 66, avoid: off });
      SCAPE.scatter(w, { kind: 'acacia', n: 80, area: [-400, -700, 400, 100], scale: [0.9, 1.5], seed: 67, avoid: (x, z) => near(x, z).d < 12, density: (x, z) => Math.abs(z - WADI(x)) < 80 ? 1 : 0.15 });
      SCAPE.scatter(w, { kind: 'palm', n: 120, area: [-500, -420, 500, -180], scale: [7, 12], seed: 68, avoid: (x, z) => near(x, z).d < 16, density: (x, z) => Math.abs(z - WADI(x)) < 60 ? 1 : 0 });
      SCAPE.scatter(w, { kind: 'grass', n: 1500, area: [-200, -420, 200, -180], scale: [0.5, 1.0], seed: 69, density: (x, z) => Math.abs(z - WADI(x)) < 40 ? 1 : 0.1 });
      SCAPE.birds(w, { n: 12, x: 0, z: -300, y: 40, r: 80 });

      /* ---------- signals ---------- */
      this.signals = [600, 1500, this.MARK - 260].map((s, k) => {
        const f = frameAt(s), ox = f.dz * 3.4, oz = -f.dx * 3.4, x = f.x + ox, z = f.z + oz, y = ground(x, z);
        const post = new T.Mesh(new T.CylinderGeometry(0.1, 0.13, 8, 6), iron); post.position.set(x, y + 4, z); S.add(post);
        const pivot = new T.Group(); pivot.position.set(x, y + 7.2, z); pivot.rotation.y = Math.atan2(-f.dz, f.dx); pivot.userData.dynamic = true; S.add(pivot);
        const arm = new T.Mesh(new T.BoxGeometry(1.7, 0.3, 0.06), red); arm.position.set(0.85, 0, 0); pivot.add(arm);
        const stripe = new T.Mesh(new T.BoxGeometry(0.2, 0.31, 0.07), pale); stripe.position.set(1.3, 0, 0); pivot.add(stripe);
        const lamp = KIT.glow(w, 0xff4030, 1.2, 0.9); lamp.position.set(x, y + 7.0, z); S.add(lamp);
        return { s, pivot, lamp, state: 'danger', a: 0, held: 0, k };
      });
      // the speed board before the bridge
      { const f = frameAt(this.bridge[0] - 120), x = f.x + f.dz * 3.3, z = f.z - f.dx * 3.3; const b = new T.Mesh(new T.BoxGeometry(0.9, 0.9, 0.08), pale); b.position.set(x, ground(x, z) + 2.4, z); b.rotation.y = Math.atan2(-f.dz, f.dx) + Math.PI / 2; S.add(b); const pst = new T.Mesh(new T.CylinderGeometry(0.05, 0.05, 2.4, 5), iron); pst.position.set(x, ground(x, z) + 1.2, z); S.add(pst); }

      /* ---------- the train: locomotive, tender, three coaches ---------- */
      this.train = this.buildTrain(w, { iron, brass, red, steel, planks, basalt, beamM, pale });

      /* ---------- smoke and steam ---------- */
      const NS = 240, sp = new Float32Array(NS * 3), sa = new Float32Array(NS), ss = new Float32Array(NS);
      const sgeo = new T.BufferGeometry(); sgeo.setAttribute('position', new T.BufferAttribute(sp, 3)); sgeo.setAttribute('aSize', new T.BufferAttribute(ss, 1)); sgeo.setAttribute('aAlpha', new T.BufferAttribute(sa, 1));
      const smat = new T.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: { tMap: { value: SCAPE.tex.soft(w) }, uColor: { value: new T.Color('#cfc8c0') }, uScale: { value: env.h * 0.9 } },
        vertexShader: 'attribute float aSize; attribute float aAlpha; varying float vA; uniform float uScale; void main(){ vA = aAlpha; vec4 mv = modelViewMatrix * vec4(position,1.); gl_PointSize = aSize * uScale / -mv.z; gl_Position = projectionMatrix * mv; }',
        fragmentShader: 'uniform sampler2D tMap; uniform vec3 uColor; varying float vA; void main(){ vec4 t = texture2D(tMap, gl_PointCoord); gl_FragColor = vec4(uColor, t.a * vA); if (gl_FragColor.a < 0.004) discard; }' });
      this.smoke = new T.Points(sgeo, smat); this.smoke.frustumCulled = false; this.smoke.userData.dynamic = true; S.add(this.smoke);
      this.puffs = Array.from({ length: NS }, () => ({ life: 1, v: new T.Vector3(), p: new T.Vector3(), steam: 0 })); this.puffI = 0;

      /* ---------- discoveries: look out as you pass ---------- */
      this.discs = [];
      const disc = (s, side, title, text, ar) => { const f = frameAt(s), x = f.x + f.dz * side * 9, z = f.z - f.dx * side * 9; const it = w.discover({ pos: [x, ground(x, z) + 2.4, z], title, text, ar, r: 0.01, size: 2.4 }); this.discs.push({ it, s, label: 'Look out: ' + title }); };
      disc(120, 1, 'Water in the Desert', 'Water, fuel and labour were hard to find in the remote reaches of the Hejaz. Camels carried water, food and materials to the builders.', 'الماءُ في الصحراء');
      disc(1000, -1, 'A Line Ordered in 1900', 'Sultan Abdul Hamid II ordered the railway in March 1900. Its rails stand 1,050 mm apart, a narrow gauge, and it was paid for largely by the donations of Muslims.', 'سنة ١٩٠٠');
      disc(1700, 1, 'Built by Muslim Hands', 'South of al-Ula, the line was built and staffed by Muslims alone.', 'جنوبَ العُلا');
      disc(this.bridge[0] + 20, -1, 'The ‘Aqiq Bridge', 'The railway crossed the valley of al-‘Aqiq near Madinah on a bridge. The old bridge was demolished in 2005 after it was damaged by rain.', 'جسر العقيق');
      disc(this.MARK - 500, 1, 'The Sultan’s Day', 'The first train reached Madinah on 1 September 1908, the anniversary of the Sultan’s accession. To meet the date, some track was laid on temporary embankments across the wadis.', '١ سبتمبر ١٩٠٨');
      disc(this.MARK - 60, 1, 'A Museum Now', 'The line ran for only about a decade before it was wrecked in the First World War. Since 2006 the station in Madinah has housed the Hejaz Railway Museum.', 'متحف سكة حديد الحجاز');

      w.receiveAll();
      S.traverse(m => { if (m.isMesh && !m.isInstancedMesh && !Array.isArray(m.material) && m.geometry.groups.length > 1) m.geometry.clearGroups(); });
      this.baked = w.bake();
      this.post = w.post({ bloom: 0.5, threshold: 0.8, rays: { strength: 0.32, dir: this.sunDir.toArray(), density: 0.85 }, vignette: 0.38, grain: 0.03, sat: 1.05, contrast: 1.05, lift: [0.015, 0.008, 0.0], gain: [1.04, 1.0, 0.94] });

      /* ---------- the cab panel ---------- */
      this.buildHUD(w);

      /* ---------- state ---------- */
      Object.assign(this, { s: 80, v: 0, reg: 0, brake: 0.6, fire: 0.55, press: 11.2, water: 0.7, dir: 1, view: 'cab', part: 0, arrived: false, chuffAcc: 0, clackAcc: 0, held: 0, msgT: 0, pass: 0, finT: 0, lookYaw: 0, lookPitch: -0.04 });
      w.activity('Part 1 of 3 · Leaving the water station', 3, 'Release the brake (it eases off by itself) and open the regulator with W');
      w.mode = (dt) => this.drive(env, dt);
      this.place(); this.camCab(1);

      /* ---------- sound ---------- */
      const b = env.bus;
      this.wind = SND.noise(b, { color: 'pink', type: 'bandpass', freq: 380, q: 0.6, gain: 0.03 });
      this.roll = SND.noise(b, { color: 'brown', type: 'lowpass', freq: 220, gain: 0 });
      this.hiss = SND.noise(b, { color: 'white', type: 'highpass', freq: 3200, gain: 0 });
      this.inj = SND.noise(b, { color: 'white', type: 'bandpass', freq: 1800, q: 1.4, gain: 0 });
      this.roar = SND.noise(b, { color: 'brown', type: 'lowpass', freq: 160, gain: 0.02 });
      this.whis = SND.noise(b, { color: 'white', type: 'bandpass', freq: 1250, q: 12, gain: 0 });
    },

    buildTrain(w, M) {
      const S = w.scene, cars = [];
      const part = (list, geo, mat, x, y, z, rx, ry, rz) => { const g = geo.clone(); if (rx || ry || rz) g.rotateX(rx || 0).rotateY(ry || 0).rotateZ(rz || 0); g.translate(x, y, z); (list[mat.uuid] || (list[mat.uuid] = { mat, geos: [] })).geos.push(g); };
      const finish = (list) => { const g = new T.Group(); Object.values(list).forEach(({ mat, geos }) => { const m = new T.Mesh(SCAPE.merge(geos), mat); m.castShadow = true; m.receiveShadow = true; g.add(m); }); g.userData.dynamic = true; S.add(g); return g; };
      const cyl = (r, l, n) => new T.CylinderGeometry(r, r, l, n || 20), box = (a, b, c) => new T.BoxGeometry(a, b, c);
      const wheels = [];
      // locomotive (z forward = -z local), length ~11 m; local origin at the front buffer beam
      { const L = {};
        part(L, cyl(0.85, 6.4), M.iron, 0, 2.15, 3.6, Math.PI / 2);                 // boiler
        part(L, cyl(0.9, 1.4), M.iron, 0, 2.15, 0.9, Math.PI / 2);                  // smokebox
        part(L, cyl(0.3, 1.3), M.iron, 0, 3.4, 1.0);                                // chimney
        part(L, cyl(0.42, 0.25), M.iron, 0, 4.05, 1.0);
        part(L, cyl(0.38, 0.7), M.brass, 0, 3.15, 3.6);                             // dome
        part(L, cyl(0.25, 0.5), M.brass, 0, 3.05, 5.4);                             // safety valves
        [1.7, 2.9, 4.1, 5.3].forEach(z => part(L, new T.TorusGeometry(0.86, 0.04, 6, 24), M.brass, 0, 2.15, z));
        part(L, box(2.6, 0.3, 10.2), M.red, 0, 1.05, 4.9);                          // running board
        part(L, box(2.7, 0.35, 0.3), M.red, 0, 1.0, -0.1);                          // buffer beam
        // the cab: walls with open windows, so the line ahead shows between the frames
        part(L, box(2.8, 1.7, 0.1), M.iron, 0, 2.05, 7.3);                          // front wall, lower
        [-1.33, 0, 1.33].forEach(x => part(L, box(x ? 0.14 : 0.36, 1.0, 0.1), M.iron, x, 3.4, 7.3));
        part(L, box(2.8, 0.2, 0.1), M.iron, 0, 3.95, 7.3);
        [-1.4, 1.4].forEach(x => { part(L, box(0.08, 1.4, 2.6), M.iron, x, 1.9, 8.6); part(L, box(0.1, 1.5, 0.12), M.iron, x, 3.3, 9.85); part(L, box(0.1, 1.5, 0.12), M.iron, x, 3.3, 7.35); });
        part(L, box(2.8, 0.1, 2.6), M.planks, 0, 1.2, 8.6);                         // footplate
        part(L, cyl(0.86, 0.12), M.iron, 0, 2.15, 7.42, Math.PI / 2);               // backhead
        part(L, cyl(0.16, 0.06), M.brass, -0.42, 2.78, 7.5, Math.PI / 2);           // gauge
        part(L, cyl(0.035, 0.5), M.brass, 0.45, 2.55, 7.52);                        // water glass
        part(L, cyl(0.05, 0.9), M.brass, 0.3, 2.9, 7.6, 0, 0, Math.PI / 2.3);       // regulator lever
        part(L, box(2.9, 0.2, 3.0), M.iron, 0, 4.0, 8.7);                           // cab roof
        part(L, box(2.0, 0.15, 0.15), M.brass, 0, 3.0, 7.28);                       // handrail
        part(L, cyl(0.12, 0.5), M.brass, 0.6, 2.6, 7.25, Math.PI / 2);              // regulator handle base
        const lc = finish(L); lc.userData.len = 10.2;
        const fireM = new T.MeshStandardMaterial({ color: 0x1a0a04, emissive: 0xff7020, emissiveIntensity: 0.6 }); this.fireM = fireM;
        const hole = new T.Mesh(new T.CircleGeometry(0.26, 18), fireM); hole.position.set(0, 1.75, 7.49); hole.rotation.y = Math.PI; lc.add(hole);
        const cabL = new T.PointLight(0xff8a40, 0.6, 4, 2); cabL.position.set(0, 1.9, 7.9); lc.add(cabL); this.cabLight = cabL;
        // the cab's front windows: dark holes so you see out
        [[-0.8], [0.8]].forEach(([x]) => { const win = new T.Mesh(new T.PlaneGeometry(0.7, 0.6), new T.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0 })); win.position.set(x, 3.3, 7.29); lc.add(win); });
        // driving wheels
        [2.6, 4.2, 5.8, 7.2].forEach(z => [-1, 1].forEach(sd => { const wh = new T.Mesh(cyl(0.68, 0.14, 18), M.red); wh.rotation.z = Math.PI / 2; wh.position.set(sd * 0.95, 0.68, z); lc.add(wh); wheels.push(wh); const hub = new T.Mesh(cyl(0.14, 0.18, 8), M.brass); hub.rotation.z = Math.PI / 2; hub.position.set(sd * 1.04, 0.68, z); lc.add(hub); }));
        [0.9].forEach(z => [-1, 1].forEach(sd => { const wh = new T.Mesh(cyl(0.42, 0.12, 14), M.red); wh.rotation.z = Math.PI / 2; wh.position.set(sd * 0.95, 0.42, z); lc.add(wh); wheels.push(wh); }));
        const rod = new T.Mesh(box(0.08, 0.14, 4.8), M.steel); rod.position.set(1.08, 0.68, 4.9); lc.add(rod); this.rod = rod;
        const lamp = KIT.glow(w, 0xfff0c0, 1.2, 0.8); lamp.position.set(0, 2.4, -0.2); lc.add(lamp);
        cars.push({ g: lc, len: 10.6, front: 0 });
      }
      // tender
      { const L = {}; part(L, box(2.6, 1.9, 5), M.iron, 0, 1.9, 2.6); part(L, box(2.3, 0.6, 3.2), M.basalt, 0, 3.0, 1.8); part(L, box(2.7, 0.3, 5.2), M.red, 0, 0.9, 2.6);
        const g = finish(L); [1, 4.2].forEach(z => [-1, 1].forEach(sd => { const wh = new T.Mesh(cyl(0.45, 0.12, 14), M.iron); wh.rotation.z = Math.PI / 2; wh.position.set(sd * 0.95, 0.45, z); g.add(wh); wheels.push(wh); }));
        cars.push({ g, len: 5.6 }); }
      // coaches of timber with lit windows
      const winM = new T.MeshStandardMaterial({ color: 0x2a1a10, emissive: 0xffb060, emissiveIntensity: 0.0, roughness: 0.6 }); this.winM = winM;
      for (let c = 0; c < 3; c++) {
        const L = {}; part(L, box(2.7, 2.5, 13), M.planks, 0, 2.2, 6.6); part(L, box(2.9, 0.25, 13.4), M.iron, 0, 3.55, 6.6); part(L, box(2.75, 0.3, 13.2), M.iron, 0, 0.85, 6.6);
        for (let k = 0; k < 6; k++) [-1, 1].forEach(sd => part(L, box(0.04, 0.7, 1.2), winM, sd * 1.37, 2.55, 1.6 + k * 2.0));
        const g = finish(L); [1.6, 2.8, 10.4, 11.6].forEach(z => [-1, 1].forEach(sd => { const wh = new T.Mesh(cyl(0.45, 0.12, 14), M.iron); wh.rotation.z = Math.PI / 2; wh.position.set(sd * 0.95, 0.45, z); g.add(wh); wheels.push(wh); }));
        cars.push({ g, len: 13.6 });
      }
      return { cars, wheels };
    },

    /* place every car on the line behind the locomotive's front at s */
    place() {
      const f = this._f || (this._f = {}), b = this._fb || (this._fb = {});
      let s = this.s;
      this.train.cars.forEach(c => {
        this.frameAt(s, f); this.frameAt(s - c.len, b);
        c.g.position.set(f.x, (f.y + b.y) / 2 + 0.17, f.z);
        const dx = f.x - b.x, dz = f.z - b.z, dy = f.y - b.y;
        c.g.rotation.set(0, Math.atan2(dx, dz) + Math.PI, 0); c.g.rotateX(Math.atan2(dy, Math.hypot(dx, dz)));
        s -= c.len + 0.6;
      });
    },
    camCab(snap) {
      const w = this.w, c = w.camera, lc = this.train.cars[0].g;
      const eye = this._eye || (this._eye = new T.Vector3());
      if (this.view === 'cab') {
        eye.set(0.7, 3.3, 8.5).applyMatrix4(lc.matrixWorld);
        c.position.copy(eye);
        c.rotation.order = 'YXZ'; c.rotation.set(0, 0, 0);
        const yaw = lc.rotation.y + Math.PI + this.lookYaw;
        c.rotation.set(this.lookPitch + Math.sin(w.time * 9) * 0.002 * U.clamp(this.v / 15), yaw - Math.PI, Math.sin(w.time * 1.7) * 0.004 * U.clamp(this.v / 15));
      } else {
        const t = w.time * 0.05, f = this.frameAt(this.s - 20);
        const want = new T.Vector3(f.x + Math.cos(t) * 26 - f.dz * 18, Math.max(this.ground(f.x - f.dz * 18, f.z + f.dx * 18) + 6, f.y + 7), f.z + Math.sin(t) * 10 + f.dx * 18);
        if (snap === 1) c.position.copy(want); else c.position.lerp(want, 1 - Math.exp(-snap * 2));
        c.lookAt(f.x, f.y + 2.5, f.z);
      }
      w.pos.set(c.position.x, 0, c.position.z); w.y = c.position.y - w.eye;
    },
    buildHUD(w) {
      const self = this, el = document.createElement('div'); el.className = 'railway-hud';
      Object.assign(el.style, { position: 'absolute', left: '50%', bottom: 'calc(14px + env(safe-area-inset-bottom, 0px))', transform: 'translateX(-50%)', width: 'min(560px, 94vw)', pointerEvents: 'none', zIndex: 4 });
      const cv = document.createElement('canvas'); cv.width = 1120; cv.height = 240; Object.assign(cv.style, { width: '100%', display: 'block', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,.6))' });
      el.appendChild(cv); w.ui.layer.appendChild(el); this.hud = { el, cv, g: cv.getContext('2d') };
      if (matchMedia('(pointer: coarse)').matches) {
        const row = document.createElement('div'); Object.assign(row.style, { display: 'flex', gap: '6px', justifyContent: 'center', marginTop: '6px', pointerEvents: 'auto' });
        const btn = (label, down, up) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'railway-btn'; b.textContent = label; Object.assign(b.style, { flex: '1', padding: '12px 4px', borderRadius: '10px', border: '1px solid rgba(246,220,154,.6)', background: 'rgba(30,22,14,.6)', color: '#f6dc9a', font: '600 11px/1 sans-serif', letterSpacing: '.08em' }); b.addEventListener('pointerdown', e => { e.stopPropagation(); e.preventDefault(); down(); }); b.addEventListener('pointerup', e => { e.stopPropagation(); up && up(); }); b.addEventListener('pointercancel', () => up && up()); row.appendChild(b); };
        btn('REG −', () => { self.tReg = -1; }, () => { self.tReg = 0; }); btn('REG +', () => { self.tReg = 1; }, () => { self.tReg = 0; });
        btn('BRAKE', () => { self.tBrake = true; }, () => { self.tBrake = false; }); btn('FIRE', () => self.shovel(ENGINE.env));
        btn('WATER', () => { self.tWater = true; }, () => { self.tWater = false; }); btn('WHISTLE', () => { self.tWhis = true; }, () => { self.tWhis = false; });
        btn('REV', () => self.reverse(ENGINE.env)); btn('VIEW', () => { self.view = self.view === 'cab' ? 'out' : 'cab'; });
        el.appendChild(row);
      }
    },
    drawHUD() {
      const { g, cv } = this.hud, W = cv.width, H = cv.height;
      g.clearRect(0, 0, W, H);
      g.fillStyle = 'rgba(24,18,12,0.72)'; g.strokeStyle = 'rgba(214,180,110,0.65)'; g.lineWidth = 2;
      const rr = (x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
      rr(4, 4, W - 8, H - 8, 22); g.fill(); g.stroke();
      const dial = (cx, cy, r, v, lo, hi, label, unit, red) => {
        g.fillStyle = '#f2e6cc'; g.beginPath(); g.arc(cx, cy, r, 0, 6.283); g.fill(); g.lineWidth = 6; g.strokeStyle = '#b8903c'; g.stroke();
        const a0 = Math.PI * 0.75, a1 = Math.PI * 2.25;
        if (red != null) { g.strokeStyle = '#b02a20'; g.lineWidth = 8; g.beginPath(); g.arc(cx, cy, r - 12, U.lerp(a0, a1, (red - lo) / (hi - lo)), a1); g.stroke(); }
        g.strokeStyle = '#3a2a1a'; g.lineWidth = 2; for (let i = 0; i <= 10; i++) { const a = U.lerp(a0, a1, i / 10); g.beginPath(); g.moveTo(cx + Math.cos(a) * (r - 6), cy + Math.sin(a) * (r - 6)); g.lineTo(cx + Math.cos(a) * (r - 18), cy + Math.sin(a) * (r - 18)); g.stroke(); }
        const a = U.lerp(a0, a1, U.clamp((v - lo) / (hi - lo))); g.strokeStyle = '#1a1208'; g.lineWidth = 4; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a) * (r - 16), cy + Math.sin(a) * (r - 16)); g.stroke();
        g.fillStyle = '#1a1208'; g.font = '600 26px Georgia, serif'; g.textAlign = 'center'; g.fillText(unit, cx, cy + r * 0.55);
        g.fillStyle = 'rgba(246,220,154,0.9)'; g.font = '600 18px sans-serif'; g.fillText(label, cx, cy + r + 26);
      };
      dial(120, 104, 74, this.v * KMH, 0, 80, 'SPEED', `${Math.round(this.v * KMH)} km/h`);
      dial(300, 104, 74, this.press, 0, 16, 'BOILER', `${this.press.toFixed(1)} bar`, 14);
      // water glass
      g.fillStyle = 'rgba(200,220,230,0.25)'; g.fillRect(420, 30, 40, 150); g.fillStyle = this.water < 0.25 ? '#c86a4a' : '#7ab8d8'; g.fillRect(420, 30 + 150 * (1 - this.water), 40, 150 * this.water); g.strokeStyle = '#b8903c'; g.lineWidth = 4; g.strokeRect(420, 30, 40, 150);
      g.fillStyle = 'rgba(246,220,154,0.9)'; g.font = '600 18px sans-serif'; g.textAlign = 'center'; g.fillText('WATER', 440, 212);
      // firebox glow
      const fg = g.createRadialGradient(530, 104, 4, 530, 104, 54); fg.addColorStop(0, `rgba(255,${180 + this.fire * 60 | 0},80,${0.3 + this.fire * 0.7})`); fg.addColorStop(1, 'rgba(120,30,10,0.1)');
      g.fillStyle = fg; g.beginPath(); g.arc(530, 104, 54, 0, 6.283); g.fill(); g.strokeStyle = '#b8903c'; g.stroke(); g.fillStyle = 'rgba(246,220,154,0.9)'; g.fillText('FIRE', 530, 212);
      // levers
      const lever = (x, v, label, col) => { g.fillStyle = 'rgba(255,255,255,0.1)'; g.fillRect(x, 30, 26, 150); g.fillStyle = col; g.fillRect(x, 30 + 150 * (1 - v), 26, 150 * v); g.strokeStyle = '#b8903c'; g.strokeRect(x, 30, 26, 150); g.fillStyle = 'rgba(246,220,154,0.9)'; g.fillText(label, x + 13, 212); };
      lever(620, this.reg, 'REG', '#d8b060'); lever(690, this.brake, 'BRAKE', '#c05a40');
      // the road ahead: next signal and the distance to the mark
      g.textAlign = 'left'; g.font = '600 20px sans-serif'; g.fillStyle = 'rgba(246,220,154,0.95)';
      const sig = this.signals.find(S => S.s > this.s - 5);
      const toMark = this.MARK - this.s;
      g.fillText(this.dir > 0 ? 'FORWARD' : 'REVERSE', 760, 52);
      if (sig) { g.fillText('SIGNAL', 760, 92); g.fillStyle = sig.state === 'danger' ? '#ff6a50' : '#8ae08a'; g.fillText(`${sig.state === 'danger' ? 'DANGER' : 'CLEAR'} · ${Math.max(0, Math.round(sig.s - this.s))} m`, 860, 92); }
      g.fillStyle = 'rgba(246,220,154,0.95)';
      const onBridge = this.s > this.bridge[0] - 120 && this.s < this.bridge[1] + 20;
      g.fillText(onBridge ? 'BRIDGE · 25 km/h' : 'LINE · 60 km/h', 760, 132);
      g.fillText(toMark < 1500 ? `MARK · ${toMark >= 0 ? Math.round(toMark) + ' m ahead' : Math.round(-toMark) + ' m past'}` : `MADINAH · ${(toMark / 1000).toFixed(1)} km`, 760, 172);
    },

    /* ---------------- controls ---------------- */
    shovel(env) {
      if (this.fireCool > 0) return; this.fireCool = 0.45;
      this.fire = Math.min(1, this.fire + 0.14);
      SND.knock(env.bus, { f: 180, gain: 0.08, click: 900 }); SND.swell(env.bus, { f0: 300, f1: 900, dur: 0.6, gain: 0.05, color: 'brown' });
      this.fireFlash = 1;
    },
    reverse(env) { if (this.v > 0.3) return; this.dir = -this.dir; SND.knock(env.bus, { f: 120, gain: 0.07, click: 1400 }); },
    onKey(env, e) {
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key, s = ENGINE.cur; if (!s || !s.w || s.w.filmS) return;
      if (k === 'f') s.shovel(env);
      if (k === 'v') s.reverse(env);
      if (k === 'c') s.view = s.view === 'cab' ? 'out' : 'cab';
    },

    /* ---------------- driving ---------------- */
    drive(env, dt) {
      const w = this.w, k = w.keys; dt = Math.min(dt, 0.05);
      this.fireCool = Math.max(0, (this.fireCool || 0) - dt);
      if (!this.arrived) {
        if (k.has('w') || k.has('ArrowUp') || this.tReg > 0) this.reg = Math.min(1, this.reg + dt * 0.5);
        if (k.has('s') || k.has('ArrowDown') || this.tReg < 0) this.reg = Math.max(0, this.reg - dt * 0.7);
        if (k.has(' ') || this.tBrake || this.held > 0) this.brake = Math.min(1, this.brake + dt * 1.1); else this.brake = Math.max(0, this.brake - dt * 0.35);
      } else { this.reg = 0; this.brake = 1; }
      // look round the cab with the mouse or a drag
      if (this.pyaw == null) { this.pyaw = w.yaw; this.ppitch = w.pitch; }
      this.lookYaw = U.clamp(this.lookYaw + (w.yaw - this.pyaw), -1.6, 1.6); this.lookPitch = U.clamp(this.lookPitch + (w.pitch - this.ppitch), -0.6, 0.5); this.pyaw = w.yaw; this.ppitch = w.pitch;
      if (k.has('a') || k.has('ArrowLeft')) this.lookYaw = Math.min(1.6, this.lookYaw + dt * 1.2);
      if (k.has('d') || k.has('ArrowRight')) this.lookYaw = Math.max(-1.6, this.lookYaw - dt * 1.2);
      // the boiler: fire makes steam, the cylinders use it, the injector feeds water and cools a little
      const injecting = k.has('r') || this.tWater;
      this.fire = Math.max(0.05, this.fire - dt * (0.012 + this.reg * 0.02));
      const use = this.reg * (0.35 + this.v * 0.03);
      this.press += dt * (this.fire * 0.75 - use * 0.7 - (injecting ? 0.25 : 0) - 0.05);
      this.water = U.clamp(this.water - dt * use * 0.012 + (injecting ? dt * 0.06 : 0), 0, 1);
      let valve = 0; if (this.press > 14) { valve = this.press - 14; this.press = 14 + valve * 0.4; }
      this.press = U.clamp(this.press, 0, 15);
      const pf = U.smooth(4, 11, this.press) * (this.water < 0.12 ? 0.5 : 1);
      // the train's motion
      const f = this.frameAt(this.s);
      const M = 260000, Ft = this.reg * pf * 118000 * (this.v < 3 ? 1 : 3 / Math.max(3, this.v) * 1.4 + 0.2);
      const res = 2400 + this.v * 260 + this.v * this.v * 24, grade = M * 9.81 * f.g;
      const Fb = this.brake * 150000;
      let a = (this.dir * Ft - grade * 1) / M;
      const opp = (Math.abs(this.v) > 0.05 ? Math.sign(this.v) : Math.sign(a)) * (res + Fb) / M;
      if (Math.abs(this.v) < 0.05 && Math.abs(this.dir * Ft - grade) < res + Fb) { this.v = 0; a = 0; } else { a -= opp; }
      this.v += a * dt;
      if (this.arrived) this.v = U.damp(this.v, 0, 3, dt);
      const s0 = this.s; this.s = U.clamp(this.s + this.v * dt, 40, this.END);
      if (this.s >= this.END - 0.01 && this.v > 0) { this.v = 0; SND.thump(env.bus, { gain: 0.1, f: 40 }); }
      // signals
      this.signals.forEach(S => {
        const d = S.s - this.s;
        if (S.state === 'danger') {
          if (d < 280 && d > -2 && Math.abs(this.v) * KMH < 22) { S.held += dt; if (S.held > 1.5) this.clearSignal(env, S); }
          if (s0 < S.s && this.s >= S.s - 4) { // passed at danger: the train is held, gently
            this.held = 3.5; this.say('Held at the signal', 'The arm was at danger: the train is brought to a stand. Slow before a red arm and it will clear for you.'); this.clearSoon = S;
          }
        }
        S.a = U.damp(S.a, S.state === 'clear' ? 0.75 : 0, 3, dt); S.pivot.rotation.z = S.a; S.lamp.material.color.set(S.state === 'clear' ? 0x60ff70 : 0xff4030);
      });
      if (this.held > 0) { this.held -= dt; this.reg = 0; if (this.held <= 0 && this.clearSoon) { this.clearSignal(env, this.clearSoon); this.clearSoon = null; } }
      // the parts
      const kmh = this.v * KMH;
      if (this.part === 0 && this.signals[0].state === 'clear' && this.s > this.signals[0].s + 20) { this.part = 1; w.activity('Part 2 of 3 · Steam across the harrah', 3, 'The line climbs: feed the fire (F) and keep water in the glass (hold R)'); w.progress(1); }
      if (this.part === 1 && this.s > this.bridge[0] - 260) { this.part = 2; w.activity('Part 3 of 3 · The ‘Aqiq bridge and Madinah', 3, 'Slow to 25 km/h for the bridge, then bring the cab to rest at the white post'); w.progress(2); }
      if (this.part === 0 && !this.tip1 && kmh > 25) { this.tip1 = true; w.step('A signal ahead is at danger: ease off and brake (Space) to below 20 km/h, and it will clear'); }
      if (this.part === 1) w.step(this.press < 8 ? 'Pressure is falling: feed the fire (F)' : this.water < 0.3 ? 'The glass is low: hold R to put in water' : 'Keep her at 40–60 km/h; mind the gauges');
      if (this.part === 2 && this.s > this.bridge[0] - 120 && this.s < this.bridge[1] && kmh > 30 && !this.bridgeWarn) { this.bridgeWarn = true; this.say('Gently over the bridge', 'The board asks for 25 km/h over the ‘Aqiq. Ease the regulator and brake a little.'); }
      // arrival: at rest within reach of the mark
      if (!this.arrived && this.part === 2 && Math.abs(this.v) < 0.25 && this.reg < 0.05) {
        const d = this.s - this.MARK;
        if (Math.abs(d) < 14) this.arrive(env, d);
        else if (d > 14 && !this.pastTip) { this.pastTip = true; w.step('Past the mark: press V to reverse, then open the regulator gently'); }
      }
      if (this.part === 2 && !this.arrived && this.MARK - this.s < 400) w.step(`The white post: ${Math.round(this.MARK - this.s)} m · brake to rest beside it`);
      if (this.arrived) this.ceremony(env, dt);
      // place the train and turn its wheels
      this.place();
      this.wheelA = (this.wheelA || 0) + this.v * dt / 0.68;
      this.train.wheels.forEach(wh => { wh.rotation.x = -this.wheelA; });
      this.rod.position.y = 0.68 + Math.sin(this.wheelA) * 0.25; this.rod.position.z = 4.9 + Math.cos(this.wheelA) * 0.25;
      this.train.cars.forEach(c => c.g.updateMatrixWorld(true));
      // look-out discoveries: E when the prompt shows
      const nd = this.discs.find(D => !D.it.done && Math.abs(D.s - this.s) < 70);
      w.focus = nd ? nd.it : null;
      if (nd) { w.ui.label.textContent = nd.label; w.ui.prompt.classList.add('show'); w.ui.ebtn.classList.add('show'); } else { w.ui.prompt.classList.remove('show'); w.ui.ebtn.classList.remove('show'); }
      // smoke and steam
      this.emit(dt, use, valve);
      // camera
      this.camCab(dt);
      if (w._shadow) { const L = w._shadow.light, c = w.camera.position; L.target.position.set(Math.round(c.x / 2) * 2, f.y, Math.round(c.z / 2) * 2); L.position.copy(L.target.position).addScaledVector(this.sunDir, 160); }
      const fov = 62 + U.clamp(kmh / 70) * 6; if (Math.abs(w.camera.fov - fov) > 0.05) { w.camera.fov = fov; w.camera.updateProjectionMatrix(); }
      // windows of the coaches glow toward evening
      this.winM.emissiveIntensity = 0.15 + (this.arrived ? 0.6 : 0);
      this.fireFlash = Math.max(0, (this.fireFlash || 0) - dt * 2);
      this.fireM.emissiveIntensity = 0.3 + this.fire * 0.9 + this.fireFlash * 0.8 + Math.sin(w.time * 17) * 0.05; this.cabLight.intensity = 0.3 + this.fire * 0.6 + this.fireFlash;
      this.drawHUD();
      // sound
      const sp = Math.abs(this.v);
      this.chuffAcc += sp * dt / (Math.PI * 2 * 0.68) * 4;
      if (this.chuffAcc >= 1) { this.chuffAcc -= 1; if (this.reg > 0.03 && this.press > 3) SND.swell(env.bus, { f0: 300, f1: 140, dur: 0.22 + 0.5 / (1 + sp), gain: 0.04 + this.reg * 0.07, color: 'white', q: 0.6, peak: 0.1 }); }
      this.clackAcc += sp * dt; if (this.clackAcc > 12) { this.clackAcc -= 12; SND.knock(env.bus, { f: 220, gain: 0.05 * U.clamp(sp / 10), click: 3000 }); SND.knock(env.bus, { f: 200, gain: 0.04 * U.clamp(sp / 10), click: 2600 }); }
      this.roll.set('gain', U.clamp(sp / 16) * 0.08, 0.2); this.wind.set('gain', 0.03 + U.clamp(sp / 16) * 0.05, 0.3);
      this.hiss.set('gain', valve > 0 ? 0.05 : 0, 0.1); this.inj.set('gain', injecting ? 0.03 : 0, 0.1); this.roar.set('gain', 0.015 + this.fire * 0.02, 0.4);
      const whis = k.has('h') || this.tWhis; this.whis.set('gain', whis ? 0.06 : 0, 0.05);
      if (this.msgT > 0) this.msgT -= dt;
    },
    say(t, x) { if (this.msgT > 0) return; this.msgT = 6; this.w.say(t, x, { ms: 5500 }); },
    clearSignal(env, S) { if (S.state === 'clear') return; S.state = 'clear'; SND.knock(env.bus, { f: 300, gain: 0.06, click: 2200 }); SND.bell(env.bus, 523.25, { gain: 0.035 }); },
    emit(dt, use, valve) {
      const lc = this.train.cars[0].g, P = this.smoke.geometry.attributes;
      const chim = this._ch || (this._ch = new T.Vector3()); chim.set(0, 4.2, 1.0).applyMatrix4(lc.matrixWorld);
      const f = this.frameAt(this.s), back = new T.Vector3(-f.dx, 0, -f.dz);
      const rate = 6 + use * 40 + valve * 30;
      this.emitAcc = (this.emitAcc || 0) + dt * rate;
      while (this.emitAcc >= 1) {
        this.emitAcc -= 1; const p = this.puffs[this.puffI = (this.puffI + 1) % this.puffs.length];
        p.life = 0; p.p.copy(chim); p.v.set((Math.random() - 0.5) * 0.6, 2.2 + use * 3, (Math.random() - 0.5) * 0.6).addScaledVector(back, this.v * 0.6);
      }
      this.puffs.forEach((p, i) => {
        if (p.life >= 1) { P.aAlpha.array[i] = 0; return; }
        p.life += dt / 4.5; p.p.addScaledVector(p.v, dt); p.v.y *= 1 - dt * 0.35; p.v.x += 0.4 * dt;
        P.position.array.set([p.p.x, p.p.y, p.p.z], i * 3); P.aSize.array[i] = 1.6 + p.life * 9; P.aAlpha.array[i] = 0.45 * Math.sin(Math.PI * Math.pow(p.life, 0.5)) * (1 - p.life);
      });
      P.position.needsUpdate = P.aSize.needsUpdate = P.aAlpha.needsUpdate = true;
    },

    /* ---------------- arrival ---------------- */
    arrive(env, d) {
      const w = this.w; this.arrived = true; this.finT = 0; this.view = 'out';
      w.progress(3, 'Madinah');
      SND.glow(env.bus, 146.83, { gain: 0.07, dur: 12, vowel: 'a' });
      [293.66, 369.99, 440, 587.33].forEach((fq, i) => SND.sing(env.bus, fq, { vowel: 'a', dur: 5, gain: 0.04, voices: 3, delay: 1 + i * 0.5 }));
      this.hiss.set('gain', 0.06, 0.1); setTimeout(() => this.hiss && this.hiss.set('gain', 0, 1.5), 2500);
      w.say('Madinah, 1 September 1908', `The first train from Damascus has reached Madinah${Math.abs(d) < 4 ? ', at rest beside the mark' : ''}. A journey of about forty days by caravan is now about five by rail. (Hejaz Railway; Encyclopaedia Britannica)`, { ms: 13000 });
      setTimeout(() => { if (this.w) w.finish('The train comes home to Madinah'); }, 9000);
    },
    ceremony(env, dt) {
      const T1 = (this.finT += dt);
      this.banners.forEach((b, i) => { b.position.y = U.lerp(-1, 5.4, U.smooth(0.5 + i * 0.25, 2.5 + i * 0.25, T1)); b.rotation.z = Math.sin(this.w.time * 1.5 + i) * 0.04; });
      this.platLamps.forEach((l, i) => { l.material.opacity = U.smooth(1 + i * 0.3, 2 + i * 0.3, T1) * 0.9; });
      this.stationLight.intensity = U.smooth(1, 4, T1) * 2.2; this.markGlow.material.opacity = 0.8 + 0.2 * Math.sin(this.w.time * 3);
      if (T1 > 4 && !this._murmur) { this._murmur = true; for (let i = 0; i < 6; i++) SND.sing(env.bus, U.pick([110, 123.47, 130.81, 146.83]), { vowel: U.pick(['m', 'o', 'a']), dur: 3 + Math.random() * 2, gain: 0.012, voices: 3, delay: i * 1.3, pan: U.rnd(-0.8, 0.8) }); }
    },

    /* ---------------- the film ---------------- */
    film(env, w) {
      const self = this, G = this.ground, F = s => this.frameAt(s);
      const at = (s, side, up, ahead) => { const f = F(s + (ahead || 0)); return [f.x + f.dz * side, Math.max(G(f.x + f.dz * side, f.z - f.dx * side), f.y) + up, f.z - f.dx * side]; };
      const on = (s, up) => { const f = F(s); return [f.x, f.y + (up || 1), f.z]; };
      const st = this.station, bm = this.bridge;
      return [
        { dur: 7, fade: 'dip', title: true, ease: 'glide', fov: [44, 40], path: [[at(-200, 160, 140), on(500, 0)], [at(200, 120, 110), on(900, 0)]],
          start: () => { SND.glow(env.bus, 110, { gain: 0.04, dur: 9 }); } },
        { dur: 6, fade: 'dip', line: '1908. A railway of some 1,300 km runs from Damascus to Madinah.', ar: '١٩٠٨. سكةٌ نحوَ ١٣٠٠ كم من دمشق إلى المدينة.', ease: 'linear', fov: [56, 56],
          path: [[on(900, 0.9), on(960, 0.6)], [on(1010, 0.9), on(1070, 0.6)]] },
        { dur: 6, fade: 'cut', line: 'It was paid for largely by the donations of Muslims.', ar: 'مُوِّلت في معظمها بتبرّعات المسلمين.', ease: 'inout', fov: [40, 36],
          path: [[at(60, -14, 3, 10), on(70, 3)], [at(80, -10, 2.4, 0), on(66, 2.6)]],
          during: (w, k) => { self.emit(1 / 30, 0.2, 0.3); } },
        { dur: 6.5, fade: 'dip', line: 'It cut a journey of about forty days to about five.', ar: 'واختصرت رحلةً من نحو أربعين يومًا إلى نحو خمسة.', ease: 'glide', fov: [48, 42],
          path: [[at((bm[0] + bm[1]) / 2, 60, 4), on((bm[0] + bm[1]) / 2, -6)], [at((bm[0] + bm[1]) / 2 + 30, 34, 10), on((bm[0] + bm[1]) / 2, -3)]] },
        { dur: 7, fade: 'dip', line: 'On 1 September 1908 the first train reached Madinah.', ar: 'في ١ سبتمبر ١٩٠٨ بلغ أوّلُ قطارٍ المدينةَ.', ease: 'inout', fov: [46, 40],
          path: [[[st.x - Math.sin(st.rot) * 40 + Math.cos(st.rot) * 50, st.y + 14, st.z - Math.cos(st.rot) * 40 - Math.sin(st.rot) * 50], [st.x, st.y + 4, st.z]], [[st.x - Math.sin(st.rot) * 26 + Math.cos(st.rot) * 30, st.y + 6, st.z - Math.cos(st.rot) * 26 - Math.sin(st.rot) * 30], [this.city.x, st.y + 20, this.city.z]]] },
        { dur: 6, fade: 'dip', line: 'Drive the last stretch home: keep the fire and water, obey the signals, stop at the mark.', ar: 'قُدِ القطار في آخر الطريق: احفظ النار والماء، واتبع الإشارات، وقِف عند العلامة.', ease: 'inout', fov: [50, 62],
          path: [[at(110, 7, 4), on(80, 2.5)], [at(78, 1.5, 3.8), on(100, 2.5)]],
          during: (w, k) => { self.emit(1 / 30, 0.25, 0); } },
      ];
    },
    filmOpts: {
      end(w) {
        const s = ENGINE.cur; if (!s || !s.train) return;
        s.view = 'cab'; s.place(); s.train.cars.forEach(c => c.g.updateMatrixWorld(true)); s.camCab(1); s.pyaw = w.yaw; s.ppitch = w.pitch;
      },
    },

    update(env, dt) {
      const w = this.w; if (!w) return;
      w.update(dt);
      if (w.filmS) { this.place(); this.train.cars.forEach(c => c.g.updateMatrixWorld(true)); const c = w.camera.position; if (w._shadow) { const L = w._shadow.light; L.target.position.set(c.x, this.ground(c.x, c.z), c.z); L.position.copy(L.target.position).addScaledVector(this.sunDir, 160); } }
    },
  }));
})();
