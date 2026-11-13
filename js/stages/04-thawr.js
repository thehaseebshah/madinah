/* Station — The Cave of Thawr, 622 CE.
   Genre: survival-horror hiding (Alien: Isolation) with breath control. Inside a small cave near the
   top of Mount Thawr, south of Makkah. Three times the search comes up the mountain: first torches on
   the far switchbacks, then lights on the ridge sweeping the mouth, then footsteps at the mouth itself.
   Stay deep, keep the view still, hold your breath when they are near, and breathe between.
   Feeling: fear turned to calm — "Do not grieve; God is with us."
   Colour script: starlit indigo and cold granite; the searchers' torches a harsh orange; one accent of
   pale silver-gold kept for the milk, the web and the final light.
   No person is depicted: the two in the cave are never shown (the player is a witness, a breath in the
   dark); the searchers are only torchlight, footsteps and murmurs. */
(function () {
  'use strict';
  if (!window.WORLD) return;
  const T = THREE;

  /* ================= the land =================
     The cave runs into the summit rocks along +z; its mouth (z = 0) looks north (-z) over the plateau,
     the switchback path down the north face, the valleys, and far off the lights of Makkah (z ≈ -1050). */
  const CL = 8.2;                                              // cave length
  const CA = z => (2.25 + 0.35 * Math.sin(z * 0.9 + 1) + 0.35 * (1 - U.smooth(0, 1.2, z)));   // half width
  const CB = z => (1.8 + 0.22 * Math.sin(z * 1.3 + 0.4) - 0.3 * (1 - U.smooth(0, 1.4, z)));  // height
  const CK = z => Math.sqrt(Math.max(0, 1 - U.smooth(CL - 2.0, CL, z)));                      // the back closes
  const inCave = (x, z) => z > -0.2 && z < CL - 0.6 && Math.abs(x) < CA(z) * CK(z) * 0.9;
  const MAKKAH = { x: 40, z: -1060 };
  const PATH = [[1, -24], [34, -66], [-30, -118], [38, -172], [-28, -232], [36, -296], [-20, -372], [14, -470], [0, -560]];
  // arc length along the path
  const PL = [0]; for (let i = 1; i < PATH.length; i++) PL.push(PL[i - 1] + Math.hypot(PATH[i][0] - PATH[i - 1][0], PATH[i][1] - PATH[i - 1][1]));
  function pathAt(s) {
    s = U.clamp(s, 0, PL[PL.length - 1]);
    let i = 1; while (i < PL.length - 1 && PL[i] < s) i++;
    const k = (s - PL[i - 1]) / (PL[i] - PL[i - 1]);
    return [U.lerp(PATH[i - 1][0], PATH[i][0], k), U.lerp(PATH[i - 1][1], PATH[i][1], k)];
  }
  function pathDist(x, z) {
    let best = 1e9;
    for (let i = 1; i < PATH.length; i++) {
      const [ax, az] = PATH[i - 1], [bx, bz] = PATH[i], vx = bx - ax, vz = bz - az, L2 = vx * vx + vz * vz;
      const t = U.clamp(((x - ax) * vx + (z - az) * vz) / L2); best = Math.min(best, Math.hypot(x - ax - vx * t, z - az - vz * t));
    }
    return best;
  }
  function Hraw(x, z) {
    const r = Math.hypot(x, (z - 40) * 0.85);
    let y = -440 + 482 * Math.exp(-Math.pow(r / 300, 1.2));
    y += SCAPE.ridge(x * 0.0055 + 3, z * 0.0055, 5) * 120 * U.smooth(40, 320, r);
    y += SCAPE.fbm(x * 0.02, z * 0.02, 4) * 10 * U.smooth(20, 120, r);
    // the hills that ring the valley, lower toward Makkah in the north
    const rv = Math.hypot(x - 20, (z + 500) * 0.7);
    y += SCAPE.ridge(x * 0.003, z * 0.003 + 9, 4) * 210 * U.smooth(520, 900, rv) * (1 - 0.6 * U.smooth(-600, -1000, z));
    y = Math.max(y, -452 + SCAPE.fbm(x * 0.01, z * 0.01, 3) * 6);
    return y;
  }
  function Hbase(x, z) {
    let y = Hraw(x, z);
    // the summit plateau before the mouth, flattened, with the rocks of the summit rising behind
    const dp = Math.hypot(x * 0.9, z + 9);
    const plateau = -0.32 + 0.22 * SCAPE.fbm(x * 0.15, z * 0.15, 2) + U.smooth(10, 20, dp) * 0.5;
    let kp = U.smooth(20, 38, dp); if (z > 4) kp = Math.max(kp, U.smooth(4, 16, z));
    y = U.lerp(plateau, y, kp);
    y = Math.max(y, plateau + (U.smooth(6, 18, z) * 16 + U.smooth(12, 30, Math.abs(x)) * 6) * U.smooth(2, 7, z));
    return y;
  }
  function H(x, z) {
    let y = Hbase(x, z);
    // the path: a shelf cut along the slope
    const pd = pathDist(x, z);
    if (pd < 3.5 && z < -18) { const s = U.smooth(3.5, 1.4, pd); y = U.lerp(y, pathY(x, z), s); }
    // under the cave the ground sinks a little, so the cave's own floor shows
    if (Math.abs(x) < 4.2 && z > -0.5 && z < CL + 1) y = Math.min(y, -0.45);
    return y;
  }
  // the path follows the slope but smoothly
  function pathY(x, z) { let a = 0; for (const [dx, dz] of [[0, 0], [2, 0], [-2, 0], [0, 2], [0, -2]]) a += Hbase(x + dx, z + dz); return a / 5 + 0.05; }
  function ground(x, z) { return inCave(x, z) ? 0.02 * Math.sin(x * 3 + z * 2) : H(x, z); }

  const PASSES = [
    { title: 'Part 1 of 3 · Torches on the slopes', from: 330, to: 140, linger: 9, back: 300, n: 3, speed: 3.2, hold: 13 },
    { title: 'Part 2 of 3 · Lights on the ridge', from: 150, to: 6, linger: 20, back: 150, n: 3, speed: 2.6, hold: 10, sweeps: 3 },
    { title: 'Part 3 of 3 · At the mouth of the cave', from: 20, to: -1, linger: 26, back: 120, n: 3, speed: 1.3, hold: 9, mouth: true },
  ];

  /* ================= helpers ================= */
  /* A terrain on a warped grid: fine (under a metre) where the play is, coarse toward the horizon.
     It borrows SCAPE.terrain's material (photo ground and rock, blended by slope).
     o: { nx, nz, fx(u), fz(v) (u, v in -1..1 → world x, z), height(x,z), rock, colors, photo, tex, rockTex, rep, rockRep } */
  function warpTerrain(w, o) {
    const base = SCAPE.terrain(w, { size: 4, seg: 2, height: () => -9999, colors: o.colors, tex: o.tex, rockTex: o.rockTex, photo: o.photo, rep: o.rep, rockRep: o.rockRep });
    w.scene.remove(base.mesh); base.mesh.geometry.dispose();
    const NX = Math.round(o.nx * (w.quality < 1 ? 0.8 : 1)), NZ = Math.round(o.nz * (w.quality < 1 ? 0.8 : 1)), n = (NX + 1) * (NZ + 1);
    const P = new Float32Array(n * 3), UV = new Float32Array(n * 2), I = [];
    const rep = o.rep || 0.18;
    for (let j = 0; j <= NZ; j++) for (let i = 0; i <= NX; i++) {
      const k = j * (NX + 1) + i, x = o.fx(i / NX * 2 - 1), z = o.fz(j / NZ * 2 - 1);
      P[k * 3] = x; P[k * 3 + 1] = o.height(x, z); P[k * 3 + 2] = z; UV[k * 2] = x * rep; UV[k * 2 + 1] = z * rep;
    }
    for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) { const a = j * (NX + 1) + i, b = a + NX + 1; I.push(a, b, a + 1, b, b + 1, a + 1); }
    const geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.BufferAttribute(P, 3)); geo.setAttribute('uv', new T.BufferAttribute(UV, 2));
    geo.setIndex(n > 65535 ? new T.Uint32BufferAttribute(I, 1) : new T.Uint16BufferAttribute(I, 1));
    geo.computeVertexNormals();
    const nrm = geo.attributes.normal, C = Object.assign({ low: '#d9c09a', high: '#c8a87c', rock: '#8a7466', dark: '#5e4e44' }, o.colors || {});
    const lin = h => U.hex(h).map(v => Math.pow(v / 255, 2.2));
    const cl = lin(C.low), chi = lin(C.high), cr = lin(C.rock), cd = lin(C.dark), rs = o.rock || [0.72, 0.9];
    const col = new Float32Array(n * 3), rk = new Float32Array(n);
    for (let k = 0; k < n; k++) {
      const x = P[k * 3], z = P[k * 3 + 2], ny = nrm.getY(k);
      let rock = 1 - U.smooth(rs[0], rs[1], ny); rock = U.clamp(rock + SCAPE.fbm(x * 0.05, z * 0.05, 3) * 0.35 * rock);
      if (o.rockAt) rock = Math.max(rock, o.rockAt(x, z));
      const macro = SCAPE.fbm(x * 0.012, z * 0.012, 3) * 0.5 + 0.5;
      let c = U.mix(cl, chi, U.clamp(macro * 1.3 - 0.15));
      c = U.mix(c, U.mix(cr, cd, U.clamp(SCAPE.fbm(x * 0.03 + 9, z * 0.03, 3) + 0.4)), rock);
      col.set(c, k * 3); rk[k] = rock;
    }
    geo.setAttribute('color', new T.BufferAttribute(col, 3)); geo.setAttribute('rockiness', new T.BufferAttribute(rk, 1));
    geo.computeBoundingSphere();
    const mesh = new T.Mesh(geo, base.mesh.material); mesh.receiveShadow = true; mesh.frustumCulled = false;
    w.scene.add(mesh);
    return mesh;
  }
  function webTex(w) {
    return w.tex(512, (g, s) => {
      g.clearRect(0, 0, s, s); const cxp = s * 0.46, cyp = s * 0.5;
      g.strokeStyle = 'rgba(235,240,255,0.85)'; g.lineWidth = 1.1;
      const spokes = 22, ang = []; for (let i = 0; i < spokes; i++) ang.push(i / spokes * Math.PI * 2 + (Math.random() - 0.5) * 0.12);
      ang.forEach(a => { g.beginPath(); g.moveTo(cxp, cyp); g.lineTo(cxp + Math.cos(a) * s * 0.52, cyp + Math.sin(a) * s * 0.52); g.stroke(); });
      for (let r = 10; r < s * 0.48; r += 7 + r * 0.03) { g.beginPath(); ang.forEach((a, i) => { const rr = r * (0.94 + Math.random() * 0.1), x = cxp + Math.cos(a) * rr, y = cyp + Math.sin(a) * rr; i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.closePath(); g.globalAlpha = 0.55 + Math.random() * 0.3; g.stroke(); }
      g.globalAlpha = 1;
    }, null);
  }
  function dove(w, mat) {
    const g = new T.Group();
    const body = new T.Mesh(new T.SphereGeometry(0.09, 12, 8), mat); body.scale.set(1, 0.8, 1.55); g.add(body);
    const head = new T.Mesh(new T.SphereGeometry(0.045, 10, 8), mat); head.position.set(0, 0.07, 0.12); g.add(head);
    const beak = new T.Mesh(new T.ConeGeometry(0.008, 0.03, 5), new T.MeshStandardMaterial({ color: 0x2a2220 })); beak.rotation.x = Math.PI / 2; beak.position.set(0, 0.065, 0.17); g.add(beak);
    const tail = new T.Mesh(new T.BoxGeometry(0.07, 0.012, 0.13), mat); tail.position.set(0, 0.0, -0.17); tail.rotation.x = -0.25; g.add(tail);
    [-1, 1].forEach(s => { const wg = new T.Mesh(new T.SphereGeometry(0.07, 8, 6), mat); wg.scale.set(0.35, 0.6, 1.5); wg.position.set(s * 0.07, 0.01, -0.01); g.add(wg); });
    g.traverse(m => { if (m.isMesh) m.castShadow = true; });
    g.userData.dynamic = true; return g;
  }

  ENGINE.register(WORLD.stage({
    key: 'thawr',
    arabic: 'غَارُ ثَوْر',
    title: 'The Cave of Thawr',
    era: 'Before the Hijrah · 622 CE · three nights in hiding',
    hint: 'WASD move · mouse look · hold SPACE to hold your breath · keep the view still and stay deep when the torches come near',
    hintTouch: 'Left thumb move · right thumb look · hold the BREATH button when the torches come near · keep still',
    sound: { reverb: 0.8 },
    story: `<p>The Prophet ﷺ and Abu Bakr left Makkah by its lower side and went south, though Madinah lies to the north, and hid for three nights in a cave on Mount Thawr. Abu Bakr’s son ‘Abdullah brought them news by night, and his shepherd ‘Amir ibn Fuhayrah grazed sheep nearby and brought them milk (Sahih al-Bukhari 3905). Their pursuers came as far as the cave.</p>
            <p class="q"><span class="ar">ثَانِيَ اثْنَيْنِ إِذْ هُمَا فِي الْغَارِ</span>“The second of two, when they were in the cave…” (Qur’an 9:40)</p>`,

    enter(env) {
      const self = this;
      const w = this.w = WORLD.create(env, {
        start: { x: 0.2, z: 5.6, yaw: 0, pitch: 0.02 }, eye: 1.05, speed: 1.6, run: 2.6, exposure: 0.85, far: 4200,
        fog: { color: 0x1a2236, density: 0.0006 }, ground,
        surface: (x, z) => (inCave(x, z) ? 'gravel' : 'gravel'),
      });
      const S = w.scene;
      this.S = { phase: 'film', pass: -1, A: 0, lungs: 1, holding: false, gasp: 0, noise: 0, prox: 0, t: 0, rewind: -1, stage: 'idle', lastYaw: 0, lastPitch: 0, look: 0, settle: 0 };

      /* ---------- the starry sky and the moon ---------- */
      const moonDir = new T.Vector3(-0.55, 0.42, -0.72).normalize();
      w.sky({ top: '#03050c', mid: '#121a30', bot: '#070a12', sunDir: moonDir.toArray(), sun: '#9aa8d0', sunSize: 0.0005, stars: 1.6, haze: 0.25 });
      const moon = this.moon = new T.DirectionalLight(0xaabce8, 0.5); moon.position.copy(moonDir).multiplyScalar(80); S.add(moon);
      w.followShadow(moon, 40, 2048); moon.shadow.bias = -0.0006;
      S.add(new T.HemisphereLight(0x4a5a88, 0x1a1410, PHOTO.enabled ? 0.07 : 0.32));
      PHOTO.sky(w, 'qwantani_night_puresky', { intensity: 0.22, gain: 0.32, tint: '#9fb0e0', haze: '#121a2e', horizon: 0.5, ground: '#2a2622', bounce: 0.2 });
      // the moon itself: a soft disc and halo low in the north-west
      const halo = KIT.glow(w, 0xdde6ff, 220, 0.12); halo.position.copy(moonDir).multiplyScalar(2600); halo.material.fog = false; S.add(halo);
      const disk = KIT.glow(w, 0xffffff, 46, 0.95); disk.position.copy(moonDir).multiplyScalar(2590); disk.material.fog = false; S.add(disk);

      /* ---------- the mountain and the valleys ---------- */
      const wz = v => -6 + (v < 0 ? 1360 : 800) * (0.1 * v + 0.9 * v * v * v);
      warpTerrain(w, { nx: 300, nz: 320, fx: u => 1300 * (0.05 * u + 0.95 * u * u * u), fz: wz, height: H, rock: [0.78, 0.92], colors: { low: '#a49884', high: '#968a76', rock: '#8a7e74', dark: '#4e443c' },
        tex: 'gravel', rockTex: 'granite', photo: { ground: 'dry_ground_rocks', rock: 'rock_face', normal: 1 }, rep: 0.2, rockRep: 0.03 });
      SCAPE.horizon(w, { cz: -380, haze: '#141a2c', layers: [{ r: 1500, h: 180, color: '#232634', seed: 3 }, { r: 2100, h: 230, color: '#30344a', seed: 7 }, { r: 3000, h: 260, color: '#414864', seed: 11 }] });
      // the path down the north face: a ribbon of trodden grit
      { const pts = []; for (let s = 0; s <= PL[PL.length - 1]; s += 2) pts.push(pathAt(s));
        const P = [], UV = [], I = []; let acc = 0;
        pts.forEach(([x, z], i) => {
          const n = pts[Math.min(i + 1, pts.length - 1)], pv = pts[Math.max(i - 1, 0)], dx = n[0] - pv[0], dz = n[1] - pv[1], l = Math.hypot(dx, dz) || 1, nx = -dz / l, nz = dx / l;
          if (i) acc += Math.hypot(x - pts[i - 1][0], z - pts[i - 1][1]);
          for (const sd of [-1, 1]) { const px = x + nx * 1.2 * sd, pz = z + nz * 1.2 * sd; P.push(px, H(px, pz) + 0.06, pz); UV.push(sd > 0 ? 1 : 0, acc / 2.4); }
          if (i) { const a = (i - 1) * 2; I.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
        });
        const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(UV, 2)); g.setIndex(I); g.computeVertexNormals();
        const m = new T.Mesh(g, PHOTO.mat(w, 'gravelly_sand', { rep: [1, 1], color: 0xd0c4b0, fallback: SCAPE.tex.gravel(w), side: T.DoubleSide })); m.receiveShadow = true; Object.assign(m.material, { polygonOffset: true, polygonOffsetFactor: -2, transparent: true, opacity: 0.5, depthWrite: false }); m.userData.dynamic = true; S.add(m); }

      /* ---------- the cave: a low tunnel of granite under piled boulders ---------- */
      const rockM = PHOTO.mat(w, 'rock_face', { triplanar: 0.55, color: 0x9a8e86, side: T.DoubleSide, fallback: SCAPE.tex.granite(w) });
      { const NZ = 44, NT = 40, P = [], I = [];
        for (let j = 0; j <= NZ; j++) {
          const z = j / NZ * CL, a = CA(z), b = CB(z), k = CK(z) * (j === NZ ? 0 : 1) + (j === NZ ? 0.02 : 0);
          for (let i = 0; i <= NT; i++) {
            const th = i / NT * Math.PI * 2, s = Math.sin(th), c = Math.cos(th);
            let x = a * c, y = s >= 0 ? b * s : 0.12 * s;
            const n = U.noise2(x * 1.6 + z * 0.7, y * 1.6 + z * 1.1 + 3) * 0.2 + U.noise2(x * 5 + z * 3, y * 5) * 0.05;
            if (s > -0.1) { x *= 1 + n; y = y * (1 + n * 0.8); } else { x *= 1 + n * 0.5; }
            P.push(x * k, (y - 0.06) * (s >= 0 ? k : 1) + (1 - k) * 0.5 * (s >= 0 ? 1 : 0), z + (j === NZ ? 0.35 : 0));
          }
        }
        for (let j = 0; j < NZ; j++) for (let i = 0; i < NT; i++) { const a = j * (NT + 1) + i, b = a + NT + 1; I.push(a, b, a + 1, b, b + 1, a + 1); }
        const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(P, 3)); g.setIndex(I); g.computeVertexNormals();
        const uv = []; for (let j = 0; j <= NZ; j++) for (let i = 0; i <= NT; i++) uv.push(i / NT * 4, j / NZ * 3); g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
        const m = new T.Mesh(g, rockM); m.castShadow = true; m.receiveShadow = true; S.add(m); }
      // the floor of dust and grit inside
      { const g = new T.PlaneGeometry(6, CL, 24, 30); g.rotateX(-Math.PI / 2); g.translate(0, 0, CL / 2);
        const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), a = CA(z) * CK(z) * 0.94; p.setX(i, U.clamp(x, -a, a)); p.setY(i, 0.02 * Math.sin(x * 3 + z * 2) + 0.01); }
        g.computeVertexNormals();
        const m = new T.Mesh(g, PHOTO.mat(w, 'dry_ground_rocks', { rep: [2, 3], color: 0xa89a88, fallback: SCAPE.tex.gravel(w) })); m.receiveShadow = true; S.add(m); }
      // the summit boulders piled over and around it (scanned)
      const pile = [
        ['namaqualand_boulder_04', [0, 1.55, 4.6], 2.4, 0.5], ['namaqualand_boulder_04', [-4.4, -0.3, 2.6], 2.2, 1.9], ['namaqualand_boulder_04', [4.5, -0.3, 3.2], 2.3, 2.6],
        ['namaqualand_boulder_04', [-3.8, -0.2, 7.2], 2.6, 0.9], ['namaqualand_boulder_04', [3.9, -0.2, 7.6], 2.5, 3.9], ['namaqualand_boulder_04', [0.4, 0.6, 10.6], 3.4, 1.2],
        ['namaqualand_cliff_01', [-6.6, -0.6, -0.4], 1.1, 0.25], ['namaqualand_cliff_01', [6.8, -0.6, 0.2], 1.0, Math.PI - 0.2], ['namaqualand_boulder_02', [-2.9, 1.9, 1.6], 1.5, 0.4], ['namaqualand_boulder_02', [2.9, 1.9, 1.8], 1.4, 2.2],
        ['namaqualand_boulder_04', [-9, -0.4, 9], 3.2, 0.3], ['namaqualand_boulder_04', [9.5, -0.4, 10], 3.0, 2.0], ['namaqualand_cliff_01', [0, 1.0, 14], 1.6, 0],
      ];
      pile.forEach(([id, pos, s, ry]) => PHOTO.place(w, id, { pos, s, ry, cast: true }).then(g => g.traverse(m => { if (m.isMesh) { m.material = m.material.clone(); m.material.color.set(0xa8a6a8); } })));
      if (!PHOTO.enabled) pile.forEach(([id, pos, s]) => { const m = new T.Mesh(new T.DodecahedronGeometry(1.2 * s, 1), rockM); m.position.set(pos[0], pos[1] + s * 0.6, pos[2]); m.scale.y = 0.75; S.add(m); });
      [[-4.4, 2.6, 3.6], [4.5, 3.2, 3.6], [-3.8, 7.2, 3.8], [3.9, 7.6, 3.8], [-6.6, -0.4, 3], [6.8, 0.2, 3]].forEach(([x, z, r]) => w.addCircle(x, z, r));
      // small rocks and stones on the cave floor, along its walls
      { const pts = [], r = U.seeded(9); for (let i = 0; i < 26; i++) { const z = 0.6 + r() * (CL - 2), a = CA(z) * CK(z) * 0.85, s = r() < 0.5 ? -1 : 1; pts.push([s * a * (0.75 + r() * 0.2), z, 3 + r() * 4]); }
        SCAPE.scatter(w, { kind: 'model', model: 'namaqualand_rocks_01', points: pts, fallback: 'rock', fallbackScale: 0.12, seed: 31, color: '#a8a09a' });
        const st = []; for (let i = 0; i < 40; i++) { const z = 0.3 + r() * (CL - 1.6), a = CA(z) * CK(z) * 0.8; st.push([(r() - 0.5) * 2 * a, z, 2 + r() * 3]); }
        SCAPE.scatter(w, { kind: 'model', model: 'namaqualand_stones_01', points: st, fallback: 'pebble', fallbackScale: 0.06, seed: 32, color: '#a8a09a' }); }
      // a water skin and a rolled cloak set down in the dark: traces of the two who wait here
      const leather = PHOTO.mat(w, 'brown_leather', { rep: [1, 1], color: 0x9a7a60, fallback: KIT.wood(w, [1, 1], '#5a3a24') });
      { const sk = new T.Mesh(new T.SphereGeometry(0.22, 12, 10), leather); sk.scale.set(1.4, 0.7, 0.9); sk.position.set(-1.2, 0.14, 6.2); sk.castShadow = true; S.add(sk);
        const cl = new T.Mesh(new T.CylinderGeometry(0.14, 0.14, 1.1, 10), PHOTO.mat(w, 'rough_linen', { rep: [2, 1], color: 0x8a7a68, fallback: SCAPE.tex.mud(w) })); cl.rotation.set(0, 0.3, Math.PI / 2); cl.position.set(1.1, 0.14, 6.6); cl.castShadow = true; S.add(cl); }
      // the milk, left at the mouth after the first search (wooden bowl, scanned)
      this.milk = new T.Group(); this.milk.position.set(0.7, 0.02, 0.9); this.milk.visible = false; this.milk.userData.dynamic = true; S.add(this.milk);
      PHOTO.model(w, 'wooden_bowl_01').then(({ parts }) => parts.forEach(p => { const m = new T.Mesh(p.geo, p.mat); m.scale.setScalar(1.4); m.castShadow = true; this.milk.add(m); })).catch(() => { this.milk.add(new T.Mesh(new T.CylinderGeometry(0.2, 0.12, 0.1, 14), leather)); });
      { const top = new T.Mesh(new T.CircleGeometry(0.16, 20), new T.MeshStandardMaterial({ color: 0xf2eee4, roughness: 0.4, emissive: 0x403c34 })); top.rotation.x = -Math.PI / 2; top.position.y = 0.1; this.milk.add(top); }

      /* ---------- the summit and the slopes: scanned boulders, shrubs, grass ---------- */
      SCAPE.scatter(w, { kind: 'model', model: 'namaqualand_boulder_04', n: 70, area: { x: 0, z: -20, r: 120 }, density: (x, z) => (Math.hypot(x, z + 9) > 16 && pathDist(x, z) > 4 && !(Math.abs(x) < 12 && z > -6 && z < 16) ? 1 : 0), scale: [1, 2.8], seed: 41, collide: 1.0, fallback: 'boulder', fallbackScale: 1.2, color: '#b4aca6' });
      SCAPE.scatter(w, { kind: 'model', model: 'namaqualand_boulder_02', n: 60, area: { x: 0, z: -10, r: 60 }, density: (x, z) => (Math.hypot(x, z + 9) > 9 && pathDist(x, z) > 3 && !(Math.abs(x) < 9 && z > -4 && z < 14) ? 1 : 0), scale: [1, 2.2], seed: 42, collide: 0.9, fallback: 'boulder', color: '#b4aca6' });
      SCAPE.scatter(w, { kind: 'model', model: 'namaqualand_boulder_05', n: 120, area: { x: 0, z: -60, r: 160 }, density: (x, z) => (pathDist(x, z) > 2 && !inCave(x, z) && Math.hypot(x, z + 4) > 4 ? 1 : 0), scale: [0.7, 1.8], seed: 43, color: '#b0a8a2' });
      SCAPE.scatter(w, { kind: 'model', model: 'namaqualand_rocks_01', n: 360, area: { x: 0, z: -40, r: 140 }, density: (x, z) => (!inCave(x, z) ? 1 : 0), scale: [2, 6], seed: 44, color: '#a8a4a0' });
      SCAPE.scatter(w, { kind: 'model', model: 'namaqualand_stones_01', n: 500, area: { x: 0, z: -20, r: 70 }, density: (x, z) => (!inCave(x, z) ? 1 : 0), scale: [2, 5], seed: 45, color: '#a09c98' });
      SCAPE.scatter(w, { kind: 'model', model: 'shrub_03', n: 160, area: { x: 0, z: -60, r: 160 }, density: (x, z) => (pathDist(x, z) > 2 && !inCave(x, z) && Math.hypot(x, z + 4) > 5 ? 1 : 0), scale: [2.5, 5], seed: 46 });
      SCAPE.scatter(w, { kind: 'model', model: 'grass_medium_01', n: 300, area: { x: 0, z: -30, r: 110 }, density: (x, z) => (pathDist(x, z) > 1.5 && !inCave(x, z) && Math.hypot(x, z + 2) > 3 ? 1 : 0), scale: [2, 4], seed: 47 });
      SCAPE.scatter(w, { kind: 'model', model: 'dry_branches_medium_01', n: 40, area: { x: 0, z: -20, r: 80 }, density: (x, z) => (!inCave(x, z) && Math.hypot(x, z) > 4 ? 1 : 0), scale: [1, 2], seed: 48 });
      SCAPE.scatter(w, { kind: 'boulder', n: 360, area: { x: 0, z: -300, r: 600 }, density: (x, z) => (Math.hypot(x, z + 9) > 60 && pathDist(x, z) > 5 ? 1 : 0), scale: [2, 7], seed: 49, color: '#9a9088' });
      SCAPE.scatter(w, { kind: 'rock', n: 900, area: { x: 0, z: -200, r: 420 }, density: (x, z) => (Math.hypot(x, z + 9) > 30 && pathDist(x, z) > 2.5 ? 1 : 0), scale: [0.4, 2], seed: 50, color: '#a09088' });
      SCAPE.scatter(w, { kind: 'pebble', n: 2200, area: { x: 0, z: -30, r: 90 }, density: (x, z) => (!inCave(x, z) ? 1 : 0), scale: [0.05, 0.18], seed: 51 });
      SCAPE.scatter(w, { kind: 'thorn', n: 220, area: { x: 0, z: -260, r: 500 }, density: (x, z) => (pathDist(x, z) > 3 && Math.hypot(x, z) > 20 ? 1 : 0), scale: [0.7, 1.4], seed: 52, color: '#b0a090' });
      SCAPE.scatter(w, { kind: 'acacia', n: 40, area: { x: 0, z: -600, r: 420 }, density: (x, z) => (Hraw(x, z) < -300 ? 1 : 0), scale: [0.9, 1.4], seed: 53 });
      SCAPE.scatter(w, { kind: 'grass', n: 900, area: { x: 0, z: -200, r: 300 }, density: (x, z) => (pathDist(x, z) > 2 && Math.hypot(x, z) > 25 ? 0.7 : 0), scale: [0.4, 0.8], seed: 54, color: '#b8ae98' });
      // a fold of piled stones on a shelf below, where a shepherd's flock might rest
      const FOLD = this.FOLD = { x: 22, z: -84 };
      { const st = PHOTO.mat(w, 'old_stone_wall', { triplanar: 0.6, color: 0xa09080, fallback: SCAPE.tex.granite(w) }), g = new T.Group();
        for (let i = 0; i < 26; i++) { const a = i / 26 * Math.PI * 2; if (i > 22) continue; const x = FOLD.x + Math.cos(a) * 5, z = FOLD.z + Math.sin(a) * 4; const m = new T.Mesh(new T.BoxGeometry(1.3, 0.8 + (i % 3) * 0.15, 0.6), st); m.position.set(x, H(x, z) + 0.3, z); m.rotation.y = -a; m.castShadow = m.receiveShadow = true; g.add(m); }
        S.add(g); }

      /* ---------- Makkah far to the north: its houses and lamps ---------- */
      const town = SCAPE.scatter(w, { kind: 'house', n: 260, area: { x: MAKKAH.x, z: MAKKAH.z, r: 200 }, scale: [7, 12], seed: 61 });
      town.meshes.forEach(m => { m.material = PHOTO.mat(w, 'clay_plaster', { triplanar: 0.25, color: 0xa89884, fallback: m.material.map }); });
      { const lp = [], r = U.seeded(62); for (const it of town.list) if (r() < 0.45) lp.push(it.x + (r() - 0.5) * it.s, H(it.x, it.z) + it.s * 0.4, it.z + (r() - 0.5) * it.s);
        const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(lp, 3));
        const pts = new T.Points(g, new T.PointsMaterial({ map: KIT.glowTex(w), color: 0xffa860, size: 7, transparent: true, opacity: 0.9, depthWrite: false, blending: T.AdditiveBlending, fog: false })); pts.userData.dynamic = true; S.add(pts); }
      // the door at the southern edge of the town, ajar, for the film
      const DOOR = this.DOOR = { x: MAKKAH.x + 10, z: MAKKAH.z + 210 };
      { const dy = H(DOOR.x, DOOR.z), g = new T.Group(), wall = PHOTO.mat(w, 'clay_block_wall', { triplanar: 0.4, color: 0xb8a48e, fallback: KIT.mudBrick(w) });
        const body = new T.Mesh(new T.BoxGeometry(8, 4.4, 7), wall); body.position.set(0, 2.0, -3.5); g.add(body);
        const lint = new T.Mesh(new T.BoxGeometry(1.6, 0.16, 0.3), PHOTO.mat(w, 'medieval_wood', { color: 0x8a7462, fallback: KIT.wood(w) })); lint.position.set(0, 1.85, 0.08); g.add(lint);
        const dgt = w.tex(64, (c, s) => { const gr = c.createLinearGradient(0, s, 0, 0); gr.addColorStop(0, '#ffb060'); gr.addColorStop(0.6, '#c86a24'); gr.addColorStop(1, '#5a2a0c'); c.fillStyle = gr; c.fillRect(0, 0, s, s); });
        const open = new T.Mesh(new T.PlaneGeometry(1.0, 1.9), new T.MeshBasicMaterial({ map: dgt })); open.position.set(0, 0.95, 0.01); g.add(open);
        const leaf = new T.Mesh(new T.BoxGeometry(1.0, 1.9, 0.08), PHOTO.mat(w, 'old_planks_02', { color: 0x9a8470, fallback: KIT.wood(w) })); leaf.position.set(0.85, 0.95, 0.45); leaf.rotation.y = -1.1; g.add(leaf);
        g.traverse(m => { if (m.isMesh) { m.castShadow = m.receiveShadow = true; } });
        g.position.set(DOOR.x, dy - 0.1, DOOR.z); S.add(g);
        this.doorLamp = KIT.glow(w, 0xffa050, 4, 0.7); this.doorLamp.position.set(DOOR.x, dy + 1.2, DOOR.z + 1.2); S.add(this.doorLamp); }
      // footprints in the sand of the valley, leading south toward the mountain
      { const fpT = w.tex(64, (c, s) => { c.clearRect(0, 0, s, s); c.fillStyle = 'rgba(40,30,22,0.75)'; c.beginPath(); c.ellipse(s / 2, s * 0.38, s * 0.16, s * 0.24, 0, 0, 6.3); c.fill(); c.beginPath(); c.ellipse(s / 2, s * 0.8, s * 0.12, s * 0.13, 0, 0, 6.3); c.fill(); }, null);
        const mat = new T.MeshBasicMaterial({ map: fpT, transparent: true, depthWrite: false, opacity: 0.7, polygonOffset: true, polygonOffsetFactor: -4 });
        const geos = [], a0 = new T.Vector2(DOOR.x, DOOR.z + 3), a1 = new T.Vector2(PATH[PATH.length - 1][0], PATH[PATH.length - 1][1] - 70);
        const n = Math.floor(a0.distanceTo(a1) / 0.75), dir = a1.clone().sub(a0).normalize(), ry = Math.atan2(dir.x, dir.y);
        for (let i = 0; i < Math.min(n, 700); i++) {
          for (const lane of [-0.45, 0.45]) {
            const k = i / n, side = (i % 2 ? 0.13 : -0.13), x = U.lerp(a0.x, a1.x, k) + Math.cos(ry) * (side + lane) + Math.sin(i * 0.05) * 3, z = U.lerp(a0.y, a1.y, k) - Math.sin(ry) * (side + lane);
            const g = new T.PlaneGeometry(0.16, 0.3); g.rotateX(-Math.PI / 2); g.rotateY(ry + Math.PI); g.translate(x, H(x, z) + 0.03, z); geos.push(g);
          }
        }
        const m = new T.Mesh(SCAPE.merge(geos), mat); m.userData.dynamic = true; S.add(m); }

      /* ---------- the search: torches, their light, and the light that can fall into the cave ---------- */
      const stickM = PHOTO.mat(w, 'medieval_wood', { rep: [1, 1], color: 0x5a4636, fallback: KIT.wood(w) });
      this.torches = [0, 1, 2].map(i => {
        const t = { i, flame: KIT.glow(w, 0xff8a3a, 2.4, 0), core: KIT.glow(w, 0xffe2a8, 0.7, 0), stick: new T.Mesh(new T.CylinderGeometry(0.025, 0.035, 0.7, 6), stickM), pos: new T.Vector3(0, -999, 0), on: 0, lag: i * 3.2 + (i === 2 ? 1.5 : 0), side: (i - 1) * 0.9 };
        t.stick.userData.dynamic = true; S.add(t.flame, t.core, t.stick); return t;
      });
      this.torchLights = [0, 1].map(() => { const L = new T.PointLight(0xff8040, 0, 26, 1.6); S.add(L); return L; });
      // torchlight thrown into the mouth: what the searchers would see by
      this.mouthLight = new T.SpotLight(0xff8a44, 0, 16, 0.7, 0.6, 1.4); this.mouthLight.position.set(0, 1.4, -3.5); this.mouthLight.target.position.set(0, 0.4, 4); S.add(this.mouthLight, this.mouthLight.target);
      // a faint cold fill inside, so the cave is not black
      this.fill = new T.PointLight(0x7a8cc0, 0.8, 10, 1.6); this.fill.position.set(0, 1.2, 2.6); S.add(this.fill);
      // the web and the doves (shown when tradition places them: at the third search)
      this.web = new T.Mesh(new T.PlaneGeometry(1.7, 1.5), new T.MeshBasicMaterial({ map: webTex(w), transparent: true, opacity: 0, depthWrite: false, side: T.DoubleSide, blending: T.AdditiveBlending }));
      this.web.position.set(-0.9, 1.0, -0.15); this.web.rotation.set(0, 0.12, 0.05); this.web.userData.dynamic = true; S.add(this.web);
      const doveM = new T.MeshStandardMaterial({ color: 0x9a9088, roughness: 0.85 });
      this.doves = new T.Group(); this.doves.userData.dynamic = true; this.doves.visible = false; S.add(this.doves);
      const nest = new T.Mesh(new T.TorusGeometry(0.16, 0.06, 6, 14), PHOTO.mat(w, 'medieval_wood', { color: 0x7a6650, fallback: KIT.wood(w) })); nest.rotation.x = Math.PI / 2; this.doves.add(nest);
      this.doveA = dove(w, doveM); this.doveA.position.set(-0.08, 0.08, 0); this.doveA.rotation.y = 2.4; this.doves.add(this.doveA);
      this.doveB = dove(w, doveM); this.doveB.position.set(0.12, 0.06, 0.05); this.doveB.rotation.y = -1.9; this.doveB.scale.setScalar(0.92); this.doves.add(this.doveB);
      this.doves.position.set(1.95, 1.55, -0.55);

      /* ---------- life: dust in the mouth, smoke from the town, owl, wind ---------- */
      SCAPE.motes(w, { n: 50, area: [-2, 0.2, -1, 2, 1.8, 6], color: '#c8d4ff', size: 0.06, opacity: 0.4, additive: true, seed: 5 });
      SCAPE.smoke(w, { sources: [[MAKKAH.x, H(MAKKAH.x, MAKKAH.z) + 8, MAKKAH.z], [MAKKAH.x - 90, H(MAKKAH.x - 90, MAKKAH.z) + 8, MAKKAH.z + 50]], n: 12, height: 40, size: 14, opacity: 0.06, color: '#6a6c7c' });

      this.baked = w.bake();
      w.post({ bloom: 0.85, threshold: 0.55, vignette: 0.6, grain: 0.05, sat: 0.8, contrast: 1.1, lift: [0.0, 0.008, 0.028], gain: [0.92, 0.98, 1.12], rays: { strength: 0.18, dir: moonDir.toArray() } });

      /* ---------- HUD: breath and sound ---------- */
      const hud = document.createElement('canvas'); hud.width = 520; hud.height = 120; hud.className = 'thawr-hud';
      hud.style.cssText = 'position:absolute;left:50%;bottom:calc(env(safe-area-inset-bottom, 0px) + 112px);width:260px;height:60px;margin-left:-130px;pointer-events:none;opacity:0;transition:opacity .8s';
      w.ui.layer.appendChild(hud); this.hud = hud; this.hctx = hud.getContext('2d'); this.wave = new Float32Array(60);
      const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'thawr-btn'; btn.textContent = 'HOLD BREATH';
      btn.style.cssText = 'position:absolute;right:calc(var(--gut-r, 16px) + 14px);bottom:calc(env(safe-area-inset-bottom, 0px) + 230px);width:96px;height:96px;border-radius:50%;border:1px solid rgba(242,233,214,.45);background:rgba(6,9,20,.55);color:#f2e9d6;font:600 .6rem var(--f-display, serif);letter-spacing:.14em;pointer-events:auto;touch-action:none;display:none';
      btn.addEventListener('pointerdown', e => { e.stopPropagation(); e.preventDefault(); this.touchHold = true; });
      const up = e => { e.stopPropagation(); this.touchHold = false; }; btn.addEventListener('pointerup', up); btn.addEventListener('pointercancel', up); btn.addEventListener('pointerleave', up);
      w.ui.layer.appendChild(btn); this.btn = btn; this.touch = matchMedia('(pointer: coarse)').matches;
      const mk = css => { const d = document.createElement('div'); d.style.cssText = 'position:absolute;inset:0;pointer-events:none;opacity:0;' + css; w.ui.layer.insertBefore(d, w.ui.layer.firstChild); return d; };
      this.tunnel = mk('background:radial-gradient(ellipse at center, rgba(0,0,0,0) 30%, rgba(2,3,8,.85) 100%);transition:opacity .25s');
      this.warm = mk('background:radial-gradient(ellipse at 50% 0%, rgba(255,140,60,.35), rgba(255,120,40,0) 70%);mix-blend-mode:screen;');
      this.curtain = mk('background:#02030a;');

      /* ---------- interactions and discoveries ---------- */
      w.interact({ key: 'settle', pos: [0, 0.6, 6.8], r: 2.6, label: 'Settle in the dark and wait', enabled: () => self.S.phase === 'explore', onUse: () => self.startPass(env, 0) });
      const dpos = (x, z, y) => [x, H(x, z) + (y || 1.2), z];
      w.discover({ pos: dpos(-6, -30), title: 'South, Not North', ar: 'مِنْ أَسْفَلِ مَكَّة',
        text: 'Far to the north lie the lamps of Makkah, and beyond them, the road to Madinah. They left by the lower side of Makkah and went south to Thawr, the opposite way, to throw off the search. (Ibn Ishaq; Sahih al-Bukhari 3905)' });
      w.discover({ pos: dpos(-24, -14), title: 'A Guide Hired in Advance', label: 'Look west',
        text: 'They had hired a guide from Banu al-Dil, a man who still followed the religion of Quraysh, and trusted him with their two camels; he was to bring them to the cave after three nights. The sirah names him ‘Abdullah ibn Urayqit. (Sahih al-Bukhari 2263, 3905; Ibn Hisham)' });
      w.discover({ pos: [0, 0.9, 7.3], title: 'Three Nights', label: 'Rest a hand on the rock',
        text: 'They stayed in the cave of Thawr for three nights. ‘Abdullah, Abu Bakr’s son, spent the nights with them and left before dawn, so that in Makkah he seemed never to have been away, and brought them whatever news he heard. (Sahih al-Bukhari 3905)' });
      w.discover({ pos: dpos(FOLD.x, FOLD.z), title: 'Milk After Nightfall', label: 'Look at the fold',
        text: '‘Amir ibn Fuhayrah, a freedman of Abu Bakr, grazed a flock of sheep nearby and brought it to them after nightfall, so they had milk. (Sahih al-Bukhari 3905) Ibn Ishaq adds that the flock was driven over the tracks.' });
      w.discover({ pos: dpos(30, -150), title: 'The Path Down', label: 'Look down the mountain',
        text: 'From Thawr the way north to Madinah first runs back past Makkah. Their guide led them by unfrequented ways along the coast. (Sahih al-Bukhari 3905)' });

      /* ---------- sound ---------- */
      const b = env.bus;
      this.windOut = SND.noise(b, { color: 'pink', type: 'bandpass', freq: 320, q: 0.5, gain: 0.04 });
      this.caveHum = SND.noise(b, { color: 'brown', type: 'lowpass', freq: 160, q: 0.5, gain: 0.03 });
      this.clocks = { breath: 1.5, cricket: 1, owl: 7, step: 0, murmur: 3, heart: 0, pebble: 6 };
      w.goal(null);
    },

    /* ================= the entrance film ================= */
    film(env, w) {
      const D = this.DOOR, dy = H(D.x, D.z), my = H(MAKKAH.x, MAKKAH.z), self = this;
      const foot = PATH[PATH.length - 1], fy = H(foot[0], foot[1]);
      return [
        { dur: 7, fade: 'dip', title: true, ease: 'glide', fov: [50, 44],
          path: [[[MAKKAH.x - 260, my + 170, MAKKAH.z - 220], [MAKKAH.x, my, MAKKAH.z + 60]], [[MAKKAH.x - 160, my + 120, MAKKAH.z - 60], [MAKKAH.x + 10, my + 40, MAKKAH.z + 600]]],
          start: () => SND.glow(env.bus, 130.81, { gain: 0.035, dur: 8 }) },
        { dur: 6, fade: 'dip', ease: 'inout', line: 'They left Makkah by its lower side.', ar: 'خرجا من أسفل مكة.', lineAt: 0.8,
          path: [[[D.x - 7, dy + 2.2, D.z + 10], [D.x, dy + 1, D.z]], [[D.x - 2, dy + 1.4, D.z + 6], [D.x + 1, dy + 0.6, D.z + 40]]],
          start: () => { SND.swell(env.bus, { f0: 300, f1: 900, dur: 1.2, gain: 0.03 }); } },
        { dur: 7, fade: 'cut', ease: 'linear', lines: [[0.6, 'Madinah lies to the north.', 'والمدينة إلى الشمال.'], [3.4, 'They went south, to Mount Thawr.', 'فاتّجها جنوبًا إلى جبل ثور.']],
          path: [[[foot[0] + 10, fy + 14, foot[1] - 90], [foot[0], fy + 30, foot[1] + 200]], [[foot[0] + 6, fy + 12, foot[1] - 30], [0, 0, 0]]],
          start: () => { let n = 0; const f = () => { if (n++ < 9 && self.w && self.w.filmS) { SND.step(env.bus, { gain: 0.07, f: 600 }); setTimeout(f, 620); } }; f(); } },
        { dur: 7, fade: 'dip', ease: 'glide', line: 'Near its summit they hid in a cave, three nights.', ar: 'واختبآ في غارٍ قرب قمّته ثلاث ليال.', lineAt: 1.2, fov: [44, 38],
          path: [[[40, H(40, -110) + 30, -110], [0, 0, 2]], [[22, H(22, -50) + 12, -50], [0, 0.6, 2]], [[5, 2.2, -14], [0, 0.8, 3]]],
          start: () => SND.sing(env.bus, 110, { vowel: 'm', dur: 6, gain: 0.03, voices: 2, attack: 1.5 }) },
        { dur: 7, fade: 'cut', ease: 'inout', line: 'The pursuers came as far as the cave.', ar: 'وبلغ الطالبون الغار.', lineAt: 1.4, fov: [34, 30],
          path: [[[-6, 9, -12], [18, H(18, -190), -190]], [[-3, 6, -20], [24, H(24, -205), -205]]],
          start: () => { self.filmTorches = true; SND.thump(env.bus, { f: 46, gain: 0.08, dur: 0.5 }); },
          during: () => { self.filmTorches = true; } },
        { dur: 6, fade: 'dip', ease: 'glide',
          path: [[[0, 1.4, -5.5], [0, 1.0, 2]], [[0.1, 1.15, 1.5], [0, 0.9, 8]], [[0.3, 1.1, 6.6], [0.1, 1.2, 0]]],
          start: () => { self.filmTorches = false; SND.swell(env.bus, { f0: 200, f1: 500, dur: 3, gain: 0.04 }); } },
      ];
    },
    filmOpts: { end(w) { const st = ENGINE.byId('thawr'); if (!st || !st.S) return; st.filmTorches = false; st.S.phase = 'explore'; st.S.t = 0;
      w.activity('Three nights in the cave', 3, 'The night is quiet. Look out over the mountains, or walk the summit. When you are ready, settle in the dark at the back of the cave (E)');
      st.hud.style.opacity = 1; if (st.touch) st.btn.style.display = 'block'; } },

    /* ================= the game ================= */
    startPass(env, n) {
      const w = this.w, S = this.S, P = PASSES[n];
      S.pass = n; S.phase = 'pass'; S.t = 0; S.A = 0; S.lungs = 1; S.gasp = 0; S.stage = 'climb';
      w.activity(P.title, 3, n === 0 ? 'Torches are climbing the far slopes. When their footsteps come near, hold your breath and keep still'
        : n === 1 ? 'Lights on the ridge. Stay deep in the dark; hold your breath while the light sweeps the mouth, and breathe between'
          : 'Footsteps at the mouth. Take short breaths, hold, and do not move');
      w.progress(n);
      w.goal(null);
      if (Math.hypot(w.pos.x, w.pos.z - 5) > 3 || !inCave(w.pos.x, w.pos.z)) { w.pos.set(0.2, 0, 5.8); w.yaw = 0; w.pitch = 0; w.vel.set(0, 0, 0); }
      this.torches.forEach(t => { t.on = 0; });
      if (n === 2) { this.webT = 0; this.doves.visible = true; this.doveT = 0; }
      SND.thump(env.bus, { f: 44, gain: 0.07, dur: 0.6 });
    },
    // where the searchers are at time t of the current pass, for torch k
    searchPos(P, t, k) {
      const total = P.from - P.to, upT = total / P.speed;
      const tt = t - k * 2.2;
      let s, stage;
      if (tt < upT) { s = P.from - tt * P.speed; stage = 'climb'; }
      else if (tt < upT + P.linger) { s = P.to; stage = 'linger'; }
      else { s = P.to + (tt - upT - P.linger) * P.speed * 1.2; stage = 'leave'; }
      let x, z;
      if (s >= 0) { [x, z] = pathAt(s); } else { // onto the plateau toward the mouth
        const k2 = U.clamp(-s / 1, 0, 1); x = U.lerp(PATH[0][0], 0, k2); z = U.lerp(PATH[0][1], -2.6, k2);
      }
      if (P.mouth && stage === 'linger') { x = [-1.6, 0.6, 2.4][k] + Math.sin(t * 0.4 + k) * 0.5; z = -3.2 - k * 0.8 + Math.cos(t * 0.3 + k) * 0.3; }
      if (P.mouth && stage !== 'linger' && s < 6) { const q = U.smooth(6, -1, s); x = U.lerp(x, [-1.6, 0.6, 2.4][k], q); z = U.lerp(z, -3.2 - k * 0.8, q); }
      const side = (k - 1) * 1.1;
      return { x: x + side * 0.6, z: z + side * 0.4, stage, done: tt > upT + P.linger + (P.back / (P.speed * 1.2)) };
    },
    rewind(env) {
      const S = this.S; S.rewind = 0;
      SND.swell(env.bus, { f0: 900, f1: 260, dur: 1.6, gain: 0.05 });
      SND.sing(env.bus, 196, { vowel: 'o', dur: 2.4, gain: 0.025, glide: 1.1, attack: 0.2 });
    },
    finishPass(env) {
      const w = this.w, S = this.S;
      if (S.pass < 2) {
        S.phase = 'between'; S.t = 0;
        w.progress(S.pass + 1, S.pass === 0 ? 'The torches go back down. The night is quiet again' : 'The lights have gone. A soft knock of stone on stone at the mouth');
        if (S.pass === 0) { this.milk.visible = true; this.milkT = 0; this.sheepT = 0; }
        if (S.pass === 1) this.newsT = 0;
        SND.glow(env.bus, 146.83, { gain: 0.035, dur: 6 });
      } else { S.phase = 'still'; S.t = 0; w.progress(3, 'They have gone down the mountain'); }
    },

    update(env, dt) {
      const w = this.w; if (!w) return;
      const S = this.S, b = env.bus, px = w.pos.x, pz = w.pos.z;
      const holdNow = (w.keys.has(' ') || this.touchHold) && S.gasp <= 0 && S.phase !== 'film';
      w.speed = holdNow ? 0.9 : 1.6; w.run = holdNow ? 1.1 : 2.6;
      // inside the cave you stay low; out on the summit you may stand
      const want = inCave(w.pos.x, w.pos.z) && w.pos.z > 0.6 ? 1.05 : 1.6;
      w.eye = U.damp(w.eye, want, 4, dt);
      w.update(dt);
      // keep to the cave, the summit and the path
      const ok = (x, z) => inCave(x, z) && Math.abs(x) < CA(z) * CK(z) * 0.78 - 0.15 && z > 0.05 && z < CL - 1.1 || (z < 0.05 && (Math.hypot(x * 0.9, z + 9) < 21 || (pathDist(x, z) < 2.2 && z < -15)) && (S.phase !== 'pass' || z > -4));
      if (!ok(w.pos.x, w.pos.z)) { if (ok(px, w.pos.z)) w.pos.x = px; else if (ok(w.pos.x, pz)) w.pos.z = pz; else { w.pos.x = px; w.pos.z = pz; } }
      const t = w.time;
      // how fast is the view turning?
      let dy = w.yaw - S.lastYaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy));
      const ang = (Math.abs(dy) + Math.abs(w.pitch - S.lastPitch)) / Math.max(dt, 1e-3);
      S.lastYaw = w.yaw; S.lastPitch = w.pitch; S.look = U.damp(S.look, Math.min(2, ang), 6, dt);

      /* ---------- breath ---------- */
      const P = S.pass >= 0 ? PASSES[S.pass] : PASSES[0];
      if (S.gasp > 0) S.gasp -= dt;
      if (holdNow) {
        if (!S.holding) { S.holding = true; S.heldFor = 0; SND.swell(b, { f0: 600, f1: 1200, dur: 0.35, gain: 0.04, type: 'highpass' }); }
        S.heldFor += dt; S.lungs -= dt / P.hold;
        if (S.lungs <= 0) { S.lungs = 0; S.holding = false; S.gasp = 2.2; S.gaspNoise = 1; SND.swell(b, { f0: 400, f1: 1800, dur: 0.9, gain: 0.12 }); SND.swell(b, { f0: 300, f1: 900, dur: 1.4, gain: 0.07, delay: 0.9 }); }
      } else {
        if (S.holding) { S.holding = false; SND.swell(b, { f0: 500, f1: 1100, dur: 0.8, gain: 0.03 + (1 - S.lungs) * 0.05 }); if (S.heldFor < 0.8) S.sip = 0.5; }
        S.lungs = Math.min(1, S.lungs + dt / 4.2 * (S.sip > 0 ? 1.6 : 1));
      }
      S.sip = Math.max(0, (S.sip || 0) - dt); S.gaspNoise = Math.max(0, (S.gaspNoise || 0) - dt * 0.8);
      // breathing you can hear
      this.clocks.breath -= dt;
      if (!S.holding && this.clocks.breath < 0 && S.phase !== 'film') { const fast = 1 - S.lungs; this.clocks.breath = 3.4 - fast * 1.8; SND.swell(b, { f0: 350, f1: 900, dur: 1.2, gain: 0.012 + fast * 0.03, type: 'bandpass' }); SND.swell(b, { f0: 300, f1: 700, dur: 1.4, gain: 0.01 + fast * 0.025, delay: 1.3 }); }
      this.tunnel.style.opacity = (S.holding ? 0.35 + (1 - S.lungs) * 0.55 : S.gasp > 0 ? 0.5 : 0).toFixed(3);

      /* ---------- the search ---------- */
      let prox = 0, seen = 0, nearPos = null, nd = 1e9;
      const pass = S.phase === 'pass' && S.rewind < 0;
      if (pass) S.t += dt;
      this.torches.forEach((tr, k) => {
        let x, z, on = 0;
        if (pass || (S.phase === 'pass' && S.rewind >= 0)) {
          const q = this.searchPos(P, S.t, k); x = q.x; z = q.z; on = q.done ? 0 : 1; tr.stage = q.stage;
          if (k === 0 && q.done && pass) this.finishPass(env);
        } else if (this.filmTorches) { const q = pathAt(240 + k * 7 - (w.filmS ? w.filmS.t : 0) * 2.4); x = q[0]; z = q[1]; on = 1; }
        tr.on = U.damp(tr.on, on, 3, dt);
        if (x != null) { tr.pos.set(x, H(x, z) + 1.65 + Math.abs(Math.sin(t * 3 + k)) * 0.05, z); }
        const fk = tr.on * (0.86 + 0.14 * Math.sin(t * 13 + k * 5) * Math.sin(t * 7 + k));
        const far = Math.max(1, tr.pos.distanceTo(w.camera.position) / 50);
        tr.flame.position.copy(tr.pos); tr.flame.material.opacity = 0.9 * fk; tr.flame.scale.setScalar((2.3 + 0.4 * Math.sin(t * 11 + k)) * far); tr.core.scale.setScalar(0.7 * far);
        tr.core.position.copy(tr.pos); tr.core.material.opacity = fk;
        tr.stick.position.set(tr.pos.x, tr.pos.y - 0.32, tr.pos.z); tr.stick.visible = tr.on > 0.05;
        if (tr.on > 0.3) { const d = Math.hypot(tr.pos.x, tr.pos.z + 1); prox = Math.max(prox, U.smooth(150, 4, d)); if (d < nd) { nd = d; nearPos = tr.pos; } }
      });
      S.prox = U.damp(S.prox, prox, 3, dt);
      // the sweep of the light across the mouth (pass 2), the light at the mouth (pass 3)
      let mouthK = 0;
      if (pass && P.sweeps && this.torches[0].stage === 'linger') { const lt = S.t - (P.from - P.to) / P.speed; const sw = Math.max(0, Math.sin(lt / P.linger * Math.PI * P.sweeps)); mouthK = Math.pow(sw, 2); }
      if (pass && P.mouth) mouthK = Math.max(mouthK, U.smooth(60, 3, nd) * 0.75);
      this.mouthLight.intensity = U.damp(this.mouthLight.intensity, (mouthK * 2.6 + S.A * 1.5) * (S.phase === 'pass' ? 1 : 0), 4, dt);
      this.mouthLight.target.position.set(Math.sin(t * 0.7) * 0.8, 0.3, 4 + Math.sin(t * 0.5) * 1.2);
      this.warm.style.opacity = (mouthK * 0.5 + S.A * 0.4).toFixed(3);
      // are you in that light? (near the mouth when it sweeps)
      if (pass && mouthK > 0.15 && w.pos.z < 3.2) seen = mouthK * U.smooth(3.2, 0.5, w.pos.z) * 2.5;
      if (pass && w.pos.z < 0 && S.prox > 0.2) seen = Math.max(seen, 1.5 * S.prox);
      // your sound
      const zDeep = U.smooth(1, 6, w.pos.z);
      const breathN = S.holding ? 0 : (S.gasp > 0 ? 0.28 : 0.2) * (1 - 0.5 * zDeep);
      const moveN = Math.min(1, w.moving / 1.4) * 0.6;
      const lookN = U.clamp((S.look - 0.25) / 1.2) * 0.5;
      S.noise = Math.min(1.2, breathN + moveN + lookN + S.gaspNoise);
      const thr = 0.06 + 0.5 * (1 - S.prox);
      if (pass) {
        const over = Math.max(0, S.noise - thr);
        S.A = U.clamp(S.A + (over * S.prox * 1.6 + seen) * dt - (over > 0 || seen > 0 ? 0 : dt * 0.22));
        if (S.A >= 1) this.rewind(env);
      }
      this.thr = thr;
      // the searchers' sounds: footsteps, murmurs, a stone kicked loose
      if (S.phase === 'pass' && nearPos) {
        const sp = w.spatial(nearPos, 14), walking = this.torches[0].stage !== 'linger';
        this.clocks.step -= dt * (walking ? 2.1 : 0.4);
        if (this.clocks.step < 0) { this.clocks.step = 1; const g = sp.gain * 0.9 + 0.003; SND.step(b, { gain: 0.16 * g, f: U.rnd(800, 1300), pan: sp.pan }); if (Math.random() < 0.3) SND.knock(b, { f: U.rnd(300, 500), gain: 0.02 * g, click: 4000, pan: sp.pan }); }
        this.clocks.murmur -= dt * (0.6 + S.A);
        if (this.clocks.murmur < 0) { this.clocks.murmur = 3 + Math.random() * 4; const g = sp.gain * 0.8 + 0.002; SND.sing(b, U.rnd(95, 125), { vowel: U.pick(['a', 'o', 'e']), dur: U.rnd(0.4, 0.9), gain: 0.035 * g, pan: sp.pan, attack: 0.05, hold: 0.2, glide: U.rnd(0.9, 1.1) }); }
        this.clocks.pebble -= dt; if (this.clocks.pebble < 0) { this.clocks.pebble = 4 + Math.random() * 6; SND.knock(b, { f: U.rnd(380, 600), gain: 0.03 * sp.gain + 0.002, click: 4200, pan: sp.pan }); SND.knock(b, { f: U.rnd(380, 600), gain: 0.02 * sp.gain + 0.001, click: 4200, pan: sp.pan, }); }
      }
      // the heart
      this.clocks.heart -= dt * (0.9 + S.prox * 1.4 + S.A * 1.6);
      if (this.clocks.heart < 0 && S.phase === 'pass') { this.clocks.heart = 1; SND.thump(b, { f: 48, gain: 0.03 + S.prox * 0.06 + (S.holding ? 0.04 : 0), dur: 0.35 }); }
      // torchlight on the land
      { const act = this.torches.filter(q => q.on > 0.05).sort((a, c) => a.pos.distanceToSquared(w.camera.position) - c.pos.distanceToSquared(w.camera.position));
        this.torchLights.forEach((L, i) => { const q = act[i]; if (!q) { L.intensity = 0; return; } L.position.copy(q.pos); L.intensity = 2.2 * q.on * (0.85 + 0.15 * Math.sin(t * 13 + i)); }); }

      /* ---------- gentle return when they would have found you ---------- */
      if (S.rewind >= 0) {
        S.rewind += dt; const r = S.rewind;
        this.curtain.style.opacity = (U.smooth(0.6, 1.6, r) * (1 - U.smooth(2.2, 3.4, r))).toFixed(3);
        if (r > 1.7 && !S.rewound) {
          S.rewound = true; S.t = 0; S.A = 0; S.lungs = 1; S.gasp = 0; w.pos.set(0.2, 0, 5.8); w.yaw = 0; w.pitch = 0; w.vel.set(0, 0, 0);
          w.step('The light lingered at the mouth, then moved on. The search comes again: stay deeper, breathe between, keep still');
        }
        if (r > 3.4) { S.rewind = -1; S.rewound = false; this.curtain.style.opacity = 0; }
      }

      /* ---------- between the searches: milk, news ---------- */
      if (S.phase === 'between') {
        S.t += dt;
        if (this.milkT != null) { this.milkT += dt; if (this.milkT > 1 && this.sheepT != null) { this.sheepT += dt;
          if (this.sheepT < 9 && Math.random() < dt * 1.5) { const sp = w.spatial(new T.Vector3(8, 0, -30), 20); SND.sing(b, U.rnd(330, 420), { vowel: 'e', dur: 0.5, gain: 0.012 * sp.gain + 0.003, pan: sp.pan, vib: 0.03, attack: 0.03, hold: 0.2 }); }
          if (this.sheepT > 1 && !this.milkSaid) { this.milkSaid = true; w.say('Milk After Nightfall', '‘Amir ibn Fuhayrah grazed a flock of sheep nearby and brought it to them after nightfall, so they had milk. (Sahih al-Bukhari 3905)', { ms: 10000 }); SND.bell(b, 392, { gain: 0.03 }); }
        } }
        if (this.newsT != null) { this.newsT += dt; if (this.newsT > 1.5 && !this.newsSaid) { this.newsSaid = true; SND.knock(b, { f: 170, gain: 0.05, click: 900 }); SND.knock(b, { f: 170, gain: 0.04, click: 900, }); w.say('News by Night', '‘Abdullah, the son of Abu Bakr, spent the nights with them and brought whatever news of the search he had heard in Makkah, leaving before dawn. (Sahih al-Bukhari 3905)', { ms: 10000 }); } }
        if (S.t > 11) this.startPass(env, S.pass + 1);
      }
      if (this.milk.visible && this.milkT != null && this.milkT < 2) { const k = U.easeOut(U.clamp(this.milkT / 1.2)); this.milk.scale.setScalar(0.01 + k); }

      /* ---------- the web and the doves of tradition ---------- */
      if (this.webT != null) { this.webT += dt; this.web.material.opacity = U.smooth(0, 14, this.webT) * (0.35 + mouthK * 0.6 + (S.phase === 'still' ? 0.25 : 0)); }
      if (this.doves.visible) {
        this.doveT += dt; this.doveA.position.y = 0.08 + Math.abs(Math.sin(t * 1.1)) * 0.004; this.doveA.rotation.y = 2.4 + Math.sin(t * 0.6) * 0.25; this.doveB.rotation.y = -1.9 + Math.sin(t * 0.5 + 1) * 0.3;
        this.clocks.coo = (this.clocks.coo || 4) - dt; if (this.clocks.coo < 0) { this.clocks.coo = 7 + Math.random() * 8; const sp = w.spatial(this.doves.position, 6); SND.coo(b, { gain: 0.035 * sp.gain + 0.004, pan: sp.pan }); }
        if (this.doveT > 3 && !this.saidWeb && S.phase === 'pass') { this.saidWeb = true; w.say('The Web and the Doves', 'Tradition tells that a spider spun its web across the mouth of the cave, and that a pair of doves settled at its entrance, so that the searchers thought no one had gone in. (Musnad Ahmad 3251, a disputed report; the doves are weaker still)', { ms: 11000 }); }
      }

      /* ---------- the quiet ---------- */
      if (S.phase === 'explore') { S.t += dt; if (S.t > 150 && inCave(w.pos.x, w.pos.z)) this.startPass(env, 0); w.goal(S.t > 40 && !inCave(w.pos.x, w.pos.z) ? [0, 1, 6] : null); }
      this.windOut.set('gain', inCave(w.pos.x, w.pos.z) && w.pos.z > 1.5 ? 0.018 : 0.045, 0.5);
      this.clocks.cricket -= dt; if (this.clocks.cricket < 0) { this.clocks.cricket = 0.6 + Math.random() * 1.8; SND.cricket(b, { gain: 0.003 * (1 - S.prox) + 0.0005 }); }
      this.clocks.owl -= dt; if (this.clocks.owl < 0 && S.prox < 0.3) { this.clocks.owl = 16 + Math.random() * 14; SND.sing(b, 330, { vowel: 'u', dur: 0.5, gain: 0.012, glide: 1.08, pan: U.rnd(-0.8, 0.8) }); SND.sing(b, 300, { vowel: 'u', dur: 0.9, gain: 0.012, delay: 0.7, pan: U.rnd(-0.8, 0.8) }); }

      /* ---------- the end: they leave; the words; the light ---------- */
      if (S.phase === 'still') {
        const T0 = S.t, T1 = (S.t += dt), at = s => T0 < s && T1 >= s;
        if (at(1.5)) { w.say('If One of Them Looked Down', 'Abu Bakr said: <span class="q">“If one of them looked down at his feet, he would see us.”</span> He said: <span class="q">“What do you think, Abu Bakr, of two whose third is God?”</span> (Sahih al-Bukhari 3653; Sahih Muslim 2381)', { ar: 'مَا ظَنُّكَ يَا أَبَا بَكْرٍ بِاثْنَيْنِ اللَّهُ ثَالِثُهُمَا', ms: 14000 }); SND.glow(b, 146.83, { gain: 0.045, dur: 10 }); }
        if (at(5)) SND.glow(b, 220, { gain: 0.04, dur: 10 });
        if (at(9)) { w.finish('The search has passed'); this.hud.style.opacity = 0; this.btn.style.display = 'none'; }
        if (at(16)) { w.say('The Second of Two', '<span class="q">“If you do not help him, God has already helped him, when those who disbelieved drove him out, the second of two, when they were in the cave, when he said to his companion, ‘Do not grieve; indeed God is with us.’”</span> (Qur’an 9:40)', { ar: 'ثَانِيَ اثْنَيْنِ إِذْ هُمَا فِي الْغَارِ إِذْ يَقُولُ لِصَاحِبِهِ لَا تَحْزَنْ إِنَّ اللَّهَ مَعَنَا', ms: 16000 }); SND.glow(b, 293.66, { gain: 0.04, dur: 12 }); SND.sing(b, 196, { vowel: 'a', dur: 9, gain: 0.03, voices: 3, attack: 3 }); }
        if (at(33)) w.say('After Three Nights', 'After three nights the guide came to the cave with their two camels, and the journey north to Madinah began. (Sahih al-Bukhari 3905)', { ms: 11000 });
        if (at(10) && !this.discAdded) { this.discAdded = true;
          w.discover({ pos: [-0.9, 1.0, -0.4], title: 'The Web', label: 'Look at the web', text: 'Musnad Ahmad (3251) reports from Ibn ‘Abbas that the pursuers saw a spider’s web over the mouth and said that had anyone gone in, the web would not be there. Scholars dispute the report; al-Albani judged that no sound hadith mentions the spider or the doves.' });
          w.discover({ pos: [1.95, 1.7, -0.55], title: 'The Doves', label: 'Look at the nest', text: 'Later reports add a pair of wild doves nesting at the entrance. They are weaker still than the report of the web, and are told as tradition. (al-Bazzar; Ibn ‘Asakir)' }); }
        // the light: moonlight brightens through the mouth, the cold lifts
        this.moon.intensity = U.lerp(0.5, 0.8, U.smooth(12, 30, T1)); this.fill.color.lerp(new T.Color(0xc8c0a8), dt * 0.05); this.fill.intensity = 0.8 + U.smooth(12, 30, T1) * 0.5;
      }

      /* ---------- HUD ---------- */
      if (S.phase !== 'film') this.drawHud();
    },
    drawHud() {
      const S = this.S, g = this.hctx; g.clearRect(0, 0, 520, 120);
      // lungs: an arc that empties as you hold
      const cx0 = 60, cy0 = 60;
      g.lineWidth = 9; g.strokeStyle = 'rgba(242,233,214,0.15)'; g.beginPath(); g.arc(cx0, cy0, 40, 0, Math.PI * 2); g.stroke();
      g.strokeStyle = S.gasp > 0 ? '#ff8a5a' : S.lungs < 0.25 ? '#ffb06a' : '#e8d8b0'; g.beginPath(); g.arc(cx0, cy0, 40, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * S.lungs); g.stroke();
      g.fillStyle = 'rgba(242,233,214,0.8)'; g.font = '600 15px serif'; g.textAlign = 'center'; g.fillText(S.holding ? 'held' : S.gasp > 0 ? 'gasp' : 'breath', cx0, cy0 + 5);
      // your sound: a trace, with the line the searchers would hear above
      this.wave.copyWithin(0, 1); this.wave[59] = S.noise;
      const x0 = 130, w0 = 370, y0 = 104, h0 = 84;
      g.fillStyle = 'rgba(6,9,20,0.45)'; g.fillRect(x0, y0 - h0, w0, h0);
      g.strokeStyle = 'rgba(200,215,255,0.85)'; g.lineWidth = 3; g.beginPath();
      for (let i = 0; i < 60; i++) { const x = x0 + i / 59 * w0, y = y0 - Math.min(1, this.wave[i]) * h0 * (0.85 + 0.15 * Math.sin(i * 1.7 + performance.now() * 0.01)); i ? g.lineTo(x, y) : g.moveTo(x, y); }
      g.stroke();
      const ty = y0 - Math.min(1, this.thr || 1) * h0;
      g.strokeStyle = S.prox > 0.15 ? 'rgba(255,140,70,0.9)' : 'rgba(255,140,70,0.25)'; g.setLineDash([8, 6]); g.beginPath(); g.moveTo(x0, ty); g.lineTo(x0 + w0, ty); g.stroke(); g.setLineDash([]);
      // how close the light has come to finding you
      if (S.A > 0.01) { g.fillStyle = `rgba(255,120,50,${0.25 + S.A * 0.6})`; g.fillRect(x0, y0 + 6, w0 * S.A, 6); }
    },
  }));
})();
