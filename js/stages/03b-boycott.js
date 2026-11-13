/* Makkah — The Boycott in the Ravine, c. 616–619 CE.
   Genre: stealth (Metal Gear Solid's radar and alert states, Mark of the Ninja's visible vision
   cones, noise rings and light). Carry food by moonlight from the edge of the town, through the
   lower ravine and the narrows, to the shelters of the clan in the upper basin.
   Feeling: patience in hunger, and the quiet solidarity of those who brought food in secret.
   Colour script: moonlit indigo; one warm accent of gold for food, fed shelters and the final words;
   the watch torches burn a harsher orange.
   No person is depicted: the clan is present only as shelters, embers and hummed voices, the
   watchmen only as torches moving in the dark, and the giver only as a door that opens. */
(function () {
  'use strict';
  if (!window.WORLD) return;
  const T = THREE;
  const GOLD = 0xffcf7a, TORCH = 0xff7a32;

  /* ================= the land =================
     The ravine runs along z: the town at z > 110, the mouth (80..110), the lower ravine (10..80) with a
     raised shelf on its east side, the narrows (-70..-15) and the upper basin with the camp (-175..-80).
     The Ka'bah stands in the valley at z = 390. */
  const cx = z => 6 * Math.sin(z * 0.012 + 0.5) + 2.5 * Math.sin(z * 0.041 + 1.1);
  function hw(z) {
    let h = 15 + 2 * Math.sin(z * 0.07);
    h = U.lerp(h, 7.5, U.smooth(-6, -20, z) * (1 - U.smooth(-60, -76, z)));   // the narrows
    h = U.lerp(h, 27, U.smooth(-66, -86, z));                                 // the upper basin
    h = U.lerp(h, 5, U.smooth(-150, -182, z));                                // the head closes
    h = U.lerp(h, 26, U.smooth(72, 96, z));                                   // the mouth
    h = U.lerp(h, 150, U.smooth(108, 175, z));                                // the town valley
    return h;
  }
  const LEDGE = z => U.smooth(6, 16, z) * (1 - U.smooth(54, 66, z));        // the east shelf, 3 m up
  const ALCOVES = [[1, -30], [-1, -45], [1, -60]].map(([s, z]) => ({ s, z }));
  const floorY = z => (z > 110 ? 0 : (110 - z) * 0.055);
  function outside(x, z) {
    // distance outside the walkable floor (negative inside), with the alcoves of the narrows
    const c = cx(z), h = hw(z);
    let d = Math.abs(x - c) - h;
    for (const a of ALCOVES) { const ax = cx(a.z) + a.s * (hw(a.z) + 2.6); const da = Math.hypot(x - ax, (z - a.z) * 0.8) - 3.2; if (da < d) d = da; }
    return d;
  }
  function H(x, z) {
    const c = cx(z), east = x > c;
    const lk = east ? LEDGE(z) : 0;
    const d = outside(x, z);
    let y = floorY(z) + SCAPE.fbm(x * 0.05, z * 0.05, 3) * 0.35 + U.noise2(x * 0.7, z * 0.7) * 0.04;
    if (lk > 0) y += lk * 3.2 * U.smooth(-1.6, 2.2, d);
    const dw = d - lk * 6;
    if (dw > 0) {
      const town = U.smooth(100, 160, z);
      let wy = U.lerp(30, 40, town) * U.smooth(0, 17, dw) + dw * U.lerp(0.35, 0.3, town);
      wy += SCAPE.ridge(x * 0.028, z * 0.028, 4) * 24 * U.smooth(6, 36, dw);
      wy += SCAPE.ridge(x * 0.07 + 3, z * 0.07, 3) * 9 * U.smooth(1, 12, dw);
      wy += SCAPE.fbm(x * 0.16, z * 0.16, 3) * 3 * U.smooth(0, 5, dw);
      wy += Math.sin(wy * 0.9 + SCAPE.fbm(x * 0.05, z * 0.05, 2) * 4) * 1.1 * U.smooth(2, 8, dw);   // ledges and bands in the granite
      y += wy;
    }
    if (z < -182) y += Math.pow(-182 - z, 1.25) * 1.4;
    if (z > 470) y += Math.pow(z - 470, 1.2) * 0.9;
    return y;
  }
  function walkable(x, z) {
    if (z < -183 || z > 470 || Math.abs(x) > 400) return false;
    const lk = x > cx(z) ? LEDGE(z) * 5 : 0;
    return outside(x, z) < lk + 0.6;
  }

  /* ---------- the places of the story ---------- */
  const DOOR = { x: cx(152) + 13, z: 152 };                // the door that opens in the town
  const KAABA = { x: -34, z: 392 };
  const at = (z, side, inset) => ({ x: cx(z) + side * (hw(z) - inset), z });
  const SHELTERS = [
    Object.assign(at(60, -1, 3.4), { part: 0 }),
    Object.assign(at(0, -1, 3.2), { part: 1 }), Object.assign(at(-7, 1, 3.6), { part: 1 }),
    Object.assign(at(-100, 1, 4.5), { part: 2 }), Object.assign(at(-126, -1, 4.5), { part: 2 }),
  ];
  const BUNDLES = [
    { x: DOOR.x - 1.05, z: DOOR.z, part: 0 },
    Object.assign(at(93, -1, 2.2), { part: 1 }), Object.assign(at(99, 1, 2.6), { part: 1 }),
    Object.assign(at(12, 1, 1.4), { part: 2 }), Object.assign(at(9, -1, 1.6), { part: 2 }),
  ];
  const FIRE = { x: cx(-116) + 2, z: -116 };
  const PARTS = [
    { title: 'Part 1 of 3 · The edge of the town', start: { x: DOOR.x - 4.2, z: DOOR.z - 1.5, yaw: -Math.PI / 2 } },
    { title: 'Part 2 of 3 · The lower ravine', start: { x: cx(102), z: 104, yaw: 0 } },
    { title: 'Part 3 of 3 · The narrows', start: { x: cx(6), z: 6, yaw: 0 } },
  ];
  // the watch: walking torches (route of [x,z]) and torches standing on the rim sweeping the floor
  const p = (z, o) => [cx(z) + (o || 0), z];
  const WATCH = [
    { part: 0, route: [p(174, 0), p(150, -1.5), p(128, 1), p(110, -2)], pause: 2.2 },
    { part: 1, route: [p(76, 1), p(44, -2)], pause: 2.6 },
    { part: 1, route: [p(25, 0.5)], post: Math.PI * 0, sweep: 1.1, pause: 1e9 },
    { part: 1, rim: true, side: 1, zc: 34, A: 16, at: 26, sw: 0.33 },
    { part: 2, route: [p(-17, 0), p(-68, 0)], pause: 2.0 },
    { part: 2, rim: true, side: -1, zc: -42, A: 13, at: -40, sw: 0.29 },
  ];

  /* ================= small helpers of this station ================= */
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
  // a disc or ring of light laid over the terrain
  function decal(w, r0, r1, color, seg) {
    const geo = new T.RingGeometry(r0, r1, seg || 40, 2);
    const pp = geo.attributes.position, off = new Float32Array(pp.count * 2);
    for (let i = 0; i < pp.count; i++) { off[i * 2] = pp.getX(i); off[i * 2 + 1] = -pp.getY(i); }
    const m = new T.Mesh(geo, new T.MeshBasicMaterial({ map: r0 ? null : KIT.glowTex(w), color, transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending, fog: false }));
    m.userData = { dynamic: true, off }; m.frustumCulled = false; m.renderOrder = 3;
    w.scene.add(m); return m;
  }
  function placeDecal(m, x, z, scale, lift) {
    const pp = m.geometry.attributes.position, off = m.userData.off, s = scale || 1;
    for (let i = 0; i < pp.count; i++) { const px = x + off[i * 2] * s, pz = z + off[i * 2 + 1] * s; pp.setXYZ(i, px, H(px, pz) + (lift || 0.08), pz); }
    pp.needsUpdate = true;
  }
  function wordsTex(ar, en) {
    const c = document.createElement('canvas'); c.width = 1400; c.height = 260;
    const g = c.getContext('2d'); g.textAlign = 'center';
    g.shadowColor = 'rgba(255,210,140,0.95)'; g.shadowBlur = 34; g.fillStyle = '#fff3d8'; g.font = '120px Amiri, "Geeza Pro", serif';
    g.direction = 'rtl'; g.fillText(ar, 700, 140);
    g.direction = 'ltr'; g.shadowBlur = 10; g.fillStyle = 'rgba(244,232,210,0.92)'; g.font = 'italic 44px Spectral, Georgia, serif'; g.fillText(en, 700, 226);
    const t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; return t;
  }
  function box(mat, w, h, d, x, y, z, ry, parent) {
    const m = new T.Mesh(new T.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); if (ry) m.rotation.y = ry;
    m.castShadow = m.receiveShadow = true; (parent).add(m); return m;
  }
  function cyl(mat, r0, r1, h, x, y, z, rx, rz, parent, seg) {
    const m = new T.Mesh(new T.CylinderGeometry(r0, r1, h, seg || 7), mat); m.position.set(x, y, z); m.rotation.set(rx || 0, 0, rz || 0);
    m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
  }
  /* A flat-roofed house of mud brick and plaster: parapet, protruding roof beams, plank door,
     small windows, a step. Origin at the middle of the front (door) wall, facing +z locally. */
  function house(w, M, o) {
    const g = new T.Group(), W = o.w, D = o.d, Ht = o.h, wall = o.mat || M.plaster;
    box(wall, W, Ht, D, 0, Ht / 2 - 0.3, -D / 2, 0, g);
    // parapet with a few gaps and a raised corner
    box(wall, W + 0.1, 0.55, 0.28, 0, Ht - 0.05, 0.0, 0, g); box(wall, W + 0.1, 0.55, 0.28, 0, Ht - 0.05, -D, 0, g);
    box(wall, 0.28, 0.55, D, -W / 2, Ht - 0.05, -D / 2, 0, g); box(wall, 0.28, 0.55, D, W / 2, Ht - 0.05, -D / 2, 0, g);
    if (o.tower) box(wall, 2.2, 1.6, 2.2, W / 2 - 1.2, Ht + 0.5, -D + 1.2, 0, g);
    // the ends of the palm-trunk roof beams
    const nb = Math.max(2, Math.round(W / 1.3));
    for (let i = 0; i < nb; i++) { const x = -W / 2 + (i + 0.5) * W / nb; cyl(M.beam, 0.09, 0.1, 0.55, x, Ht - 0.55, 0.22, Math.PI / 2, 0, g, 6); }
    // door, lintel, step
    if (!o.noDoor) {
      const dx = o.doorX || 0;
      box(M.door, 1.05, 1.95, 0.12, dx, 0.68, 0.02, 0, g);
      box(M.beam, 1.5, 0.16, 0.3, dx, 1.73, 0.06, 0, g);
      box(M.stone, 1.6, 0.22, 0.6, dx, -0.2, 0.3, 0, g);
    }
    // small windows high in the wall
    const nw = o.windows == null ? 2 : o.windows;
    for (let i = 0; i < nw; i++) { const x = (i - (nw - 1) / 2) * (W / (nw + 0.5)) + 0.6; box(o.lit && i === 0 ? M.lit : M.dark, 0.5, 0.42, 0.06, x, Ht - 1.3, 0.04, 0, g); }
    g.position.set(o.x, o.y != null ? o.y : H(o.x, o.z) - 0.05, o.z); g.rotation.y = o.ry || 0;
    w.scene.add(g); g.updateMatrixWorld(true);
    return g;
  }
  /* A low tent of woven goat hair on poles: sagging roof, a back wall, guy ropes, an open front. */
  function tent(w, M, o) {
    const g = new T.Group(), L = o.L || 4.6, Wd = o.W || 3.4, hf = o.hf || 1.9, hb = o.hb || 1.25;
    const roof = new T.PlaneGeometry(L, Wd, 10, 6); roof.rotateX(-Math.PI / 2);
    const rp = roof.attributes.position;
    for (let i = 0; i < rp.count; i++) {
      const x = rp.getX(i), z = rp.getZ(i), v = (z + Wd / 2) / Wd, u = x / L;
      const sag = Math.abs(Math.sin(u * Math.PI * 2)) * 0.22 + Math.sin(v * Math.PI) * 0.08;
      rp.setY(i, U.lerp(hb, hf, v) - sag);
    }
    roof.computeVertexNormals();
    const r = new T.Mesh(roof, M.tent); r.castShadow = r.receiveShadow = true; g.add(r);
    const back = new T.PlaneGeometry(L, hb, 8, 2); back.translate(0, hb / 2, -Wd / 2 - 0.05);
    { const bp = back.attributes.position; for (let i = 0; i < bp.count; i++) bp.setZ(i, bp.getZ(i) - (1 - bp.getY(i) / hb) * 0.35); back.computeVertexNormals(); }
    const b = new T.Mesh(back, M.tent); b.castShadow = true; g.add(b);
    [-1, 1].forEach(s => {
      const side = new T.BufferGeometry();
      side.setAttribute('position', new T.Float32BufferAttribute([s * L / 2, 0, -Wd / 2 - 0.4, s * L / 2, hb, -Wd / 2, s * L / 2, 0, Wd * 0.1, s * L / 2, hb, -Wd / 2, s * L / 2, hf * 0.8, Wd * 0.1, s * L / 2, 0, Wd * 0.1], 3));
      side.setAttribute('uv', new T.Float32BufferAttribute([0, 0, 0, 1, 1, 0, 0, 1, 1, 1, 1, 0], 2)); side.computeVertexNormals();
      const sm = new T.Mesh(side, M.tent); sm.castShadow = true; g.add(sm);
    });
    for (const px of [-L / 2, 0, L / 2]) { cyl(M.pole, 0.045, 0.055, hf + 0.15, px, (hf + 0.15) / 2, Wd / 2, 0, 0, g); cyl(M.pole, 0.045, 0.055, hb + 0.1, px, (hb + 0.1) / 2, -Wd / 2, 0, 0, g); }
    // guy ropes to stakes
    for (const px of [-L / 2, L / 2]) {
      const a = new T.Vector3(px, hf, Wd / 2), s = new T.Vector3(px * 1.25, 0.05, Wd / 2 + 1.5), len = a.distanceTo(s);
      const rope = new T.Mesh(new T.CylinderGeometry(0.012, 0.012, len, 4), M.rope); rope.position.copy(a).add(s).multiplyScalar(0.5);
      rope.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), s.clone().sub(a).normalize()); g.add(rope);
      cyl(M.pole, 0.03, 0.03, 0.4, s.x, 0.1, s.z, 0.3, 0, g, 5);
    }
    // a rolled sleeping rug and a water skin
    cyl(M.leather, 0.16, 0.16, 1.4, -L / 2 + 0.9, 0.16, -Wd / 2 + 0.6, 0, Math.PI / 2, g, 8);
    const skin = new T.Mesh(new T.SphereGeometry(0.24, 10, 8), M.leather); skin.scale.set(1.3, 0.75, 0.9); skin.position.set(L / 2 - 0.5, 0.18, Wd / 2 - 0.4); g.add(skin);
    g.position.set(o.x, H(o.x, o.z) - 0.04, o.z); g.rotation.y = o.ry || 0;
    w.scene.add(g); g.updateMatrixWorld(true);
    return g;
  }
  // ravine hit test for a horizontal ray: walls, and occluders taller than `h` (grid of circles)
  function makeOcc() {
    const cell = 4, grid = new Map(), list = [];
    const key = (i, j) => i * 10007 + j;
    return {
      list,
      add(x, z, r, top) {
        const o = { x, z, r, top }; list.push(o);
        for (let i = Math.floor((x - r) / cell); i <= Math.floor((x + r) / cell); i++) for (let j = Math.floor((z - r) / cell); j <= Math.floor((z + r) / cell); j++) {
          const k = key(i, j); if (!grid.has(k)) grid.set(k, []); grid.get(k).push(o);
        }
      },
      at(x, z, h) {
        const c = grid.get(key(Math.floor(x / cell), Math.floor(z / cell))); if (!c) return null;
        for (const o of c) if (o.top > h && (x - o.x) * (x - o.x) + (z - o.z) * (z - o.z) < o.r * o.r) return o;
        return null;
      },
    };
  }

  ENGINE.register(WORLD.stage({
    key: 'boycott',
    arabic: 'شِعْبُ أَبِي طَالِب',
    title: 'The Boycott in the Ravine',
    era: 'Shi‘b Abi Talib, Makkah · c. 616–619 CE · three years of hunger and patience',
    hint: 'WASD walk · C crouch · Shift runs, but is heard · Q throws a pebble where you look · E takes or leaves food · keep to the moon-shadows, out of the torches’ cones',
    hintTouch: 'Left thumb walk · right thumb look · CROUCH and PEBBLE buttons · tap E to take or leave food · keep to the shadows',
    sound: { reverb: 0.7 },
    story: `<p>Quraysh swore an oath at Khayf Bani Kinanah against the Prophet’s kinsmen of Banu Hashim and Banu al-Muttalib: no one would marry among them, and no one would trade with them. The clan withdrew with Abu Talib into his ravine, and for about three years food reached them only in secret; Ibn Ishaq tells how Hakim ibn Hizam carried wheat to his aunt Khadijah.</p>
            <p class="q"><span class="ar">بِاسْمِكَ اللَّهُمَّ</span>“In Your name, O God”: the sirah reports that these were the only words of the boycott document that the termites left.</p>`,

    enter(env) {
      const self = this;
      const w = this.w = WORLD.create(env, {
        start: PARTS[0].start, exposure: 0.78, far: 2400, speed: 2.7, run: 5.2, eye: 1.6,
        fog: { color: 0x0c1220, density: 0.0034 }, ground: H,
        surface: (x, z) => (z > 110 ? 'sand' : outside(x, z) > -1.4 ? 'gravel' : 'sand'),
      });
      const S = w.scene;
      this.S = { part: 0, carrying: null, crouch: false, eye: 1.6, fed: 0, returnT: -1, phase: 'film', endT: 0, pebbleT: 0, sus: 0, hidden: 1, checkpoint: Object.assign({}, PARTS[0].start) };
      const occ = this.occ = makeOcc();

      /* ---------- sky and moonlight ---------- */
      const moonDir = new T.Vector3(0.16, 0.25, -0.95).normalize();
      w.sky({ top: '#050814', mid: '#1a2442', bot: '#0b0f1a', sunDir: moonDir.toArray(), sun: '#8090c0', sunSize: 0.0004, stars: 1.2, haze: 0.3 });
      const moon = this.moon = new T.DirectionalLight(0xa8bae8, PHOTO.enabled ? 0.62 : 0.6); moon.position.copy(moonDir).multiplyScalar(120); S.add(moon);
      w.followShadow(moon, 55, 2048); moon.shadow.bias = -0.0008;
      S.add(new T.HemisphereLight(0x4a5a88, 0x1a1410, PHOTO.enabled ? 0.07 : 0.35));
      this.moonDir = moonDir.clone();
      // turn the photographed moonrise so the moon stands over the head of the ravine
      PHOTO.sky(w, 'qwantani_moonrise_puresky', { sun: moon, rotation: -Math.PI / 2 + 0.16 - 0.629, intensity: 0.16, gain: 0.17, tint: '#8a9ed8', haze: '#121a30', horizon: 0.6, ground: '#2a2622', bounce: 0.2 })
        .then(o => { if (o && o.sunDir) { self.moonDir.copy(o.sunDir); if (w._post && w._post.rays) w._post.rays.dir = o.sunDir.toArray(); } });

      /* ---------- terrain, horizon ---------- */
      warpTerrain(w, { nx: 300, nz: 340, fx: u => 450 * (0.08 * u + 0.92 * u * u * u), fz: v => 60 + 450 * v, height: H, rock: [0.8, 0.93], colors: { low: '#a09482', high: '#928672', rock: '#857870', dark: '#4e443c' },
        tex: 'gravel', rockTex: 'granite', photo: { ground: 'gravelly_sand', rock: 'rock_face_03', normal: 1 }, rep: 0.22, rockRep: 0.045 });
      SCAPE.horizon(w, { cz: 60, haze: '#1c2440', layers: [{ r: 620, h: 90, color: '#2a2a36', seed: 5 }, { r: 900, h: 120, color: '#3a3c50', seed: 9 }, { r: 1400, h: 150, color: '#4c5070', seed: 13 }] });

      /* ---------- materials ---------- */
      const M = {
        plaster: PHOTO.mat(w, 'clay_plaster', { triplanar: 0.32, color: 0xcbbca4, fallback: SCAPE.tex.mud(w) }),
        mud: PHOTO.mat(w, 'brown_mud_dry', { triplanar: 0.3, color: 0xb8a690, fallback: SCAPE.tex.mud(w) }),
        brick: PHOTO.mat(w, 'clay_block_wall', { triplanar: 0.38, color: 0xc0aa90, fallback: KIT.mudBrick(w, [1, 1]) }),
        stone: PHOTO.mat(w, 'old_stone_wall', { triplanar: 0.45, color: 0xa09080, fallback: SCAPE.tex.granite(w) }),
        beam: PHOTO.mat(w, 'medieval_wood', { rep: [1, 1], color: 0x9a8270, fallback: KIT.wood(w) }),
        door: PHOTO.mat(w, 'old_planks_02', { rep: [1, 1], color: 0x9a8470, fallback: KIT.wood(w, [1, 1], '#5a3c24') }),
        tent: PHOTO.mat(w, 'rough_linen', { rep: [3, 2], color: 0x7a604c, side: T.DoubleSide, fallback: SCAPE.tex.mud(w) }),
        leather: PHOTO.mat(w, 'brown_leather', { rep: [2, 1], color: 0x9a7a60, fallback: KIT.wood(w, [1, 1], '#5a3a24') }),
        pole: PHOTO.mat(w, 'medieval_wood', { rep: [1, 2], color: 0x7a6656, fallback: KIT.wood(w) }),
        rope: new T.MeshStandardMaterial({ color: 0x8a7a62, roughness: 1 }),
        dark: new T.MeshStandardMaterial({ color: 0x0b0806, roughness: 1 }),
        lit: new T.MeshStandardMaterial({ color: 0x1a0e06, emissive: 0xff8a34, emissiveIntensity: 0.55 }),
        linen: PHOTO.mat(w, 'rough_linen', { rep: [1, 1], color: 0xd8b888, fallback: SCAPE.tex.mud(w) }),
        kaaba: PHOTO.mat(w, 'rough_linen', { rep: [4, 3], color: 0x2a2624, fallback: SCAPE.tex.granite(w) }),
      };
      M.hearth = new T.MeshStandardMaterial({ color: 0x1a1210, emissive: 0xff5a1a, emissiveIntensity: 0.0, roughness: 1 });
      this.M = M;

      /* ---------- the town: lanes of houses down to the mouth of the ravine ---------- */
      const rr = U.seeded(616), houses = [];
      const addHouse = o => { const g = house(w, M, o); houses.push(g); const c = Math.cos(o.ry || 0), s = Math.sin(o.ry || 0);
        // collider and occluder in world space (axis-aligned bounds of the rotated footprint)
        const hx = Math.abs(c) * o.w / 2 + Math.abs(s) * o.d / 2, hz = Math.abs(s) * o.w / 2 + Math.abs(c) * o.d / 2, mx = o.x - s * o.d / 2, mz = o.z - c * o.d / 2;
        w.addBox(mx - hx, mz - hz, mx + hx, mz + hz);
        for (let k = -1; k <= 1; k++) for (let j = -1; j <= 1; j++) occ.add(mx + k * hx * 0.6, mz + j * hz * 0.6, Math.min(hx, hz) * 0.75, o.h);
        return g; };
      // the door house: its door faces the lane (west)
      this.doorHouse = addHouse({ x: DOOR.x, z: DOOR.z, ry: -Math.PI / 2, w: 7, d: 8, h: 4.6, noDoor: true, lit: true, windows: 2, mat: M.brick });
      // its door is a leaf that opens on the threshold
      this.doorLeaf = new T.Group(); this.doorLeaf.position.set(DOOR.x - 0.04, H(DOOR.x, DOOR.z) + 0.02, DOOR.z + 0.5); this.doorLeaf.userData.dynamic = true; S.add(this.doorLeaf);
      { const lf = new T.Mesh(new T.BoxGeometry(0.1, 1.95, 1.0), M.door); lf.position.set(0, 0.98, -0.5); lf.castShadow = true; this.doorLeaf.add(lf); }
      { const dg = new T.Group(); dg.userData.dynamic = true; S.add(dg);
        const dgt = w.tex(64, (c, s) => { const gr = c.createLinearGradient(0, s, 0, 0); gr.addColorStop(0, '#ffb060'); gr.addColorStop(0.6, '#c86a24'); gr.addColorStop(1, '#5a2a0c'); c.fillStyle = gr; c.fillRect(0, 0, s, s); });
        const glowIn = new T.Mesh(new T.PlaneGeometry(1.0, 1.9), new T.MeshBasicMaterial({ map: dgt, transparent: true, opacity: 0.0, side: T.DoubleSide })); glowIn.rotation.y = -Math.PI / 2; glowIn.position.set(DOOR.x - 0.015, H(DOOR.x, DOOR.z) + 0.97, DOOR.z); dg.add(glowIn); this.doorGlow = glowIn;
        box(M.beam, 0.3, 0.16, 1.5, DOOR.x - 0.06, H(DOOR.x, DOOR.z) + 2.0, DOOR.z, 0, S);
        box(M.stone, 0.7, 0.2, 1.6, DOOR.x - 0.4, H(DOOR.x, DOOR.z) - 0.05, DOOR.z, 0, S); }
      // lanes: houses on both sides of a winding street from z=240 down to the mouth at z=112
      for (let z = 118; z < 250; z += 8.5 + rr() * 3) {
        for (const s of [-1, 1]) {
          if (s > 0 && Math.abs(z - DOOR.z) < 9) continue;
          const wd = 6 + rr() * 4, dp = 6 + rr() * 4, ht = 3.4 + rr() * 2.6, off = 5.5 + rr() * 2.5 + (z < 132 ? 6 : 0);
          const x = cx(z) + s * (off + 0.0);
          if (outside(x + s * dp, z) > -2 || outside(x + s * dp, z + wd / 2) > -2) continue;
          addHouse({ x, z, ry: s > 0 ? -Math.PI / 2 : Math.PI / 2, w: wd, d: dp, h: ht, lit: rr() < 0.25, windows: rr() < 0.5 ? 1 : 2, tower: rr() < 0.18, mat: [M.plaster, M.mud, M.brick][(rr() * 3) | 0] });
          // a second row behind, broken by alleys
          if (rr() < 0.75) { const off2 = off + dp + 3 + rr() * 4; if (outside(cx(z) + s * (off2 + 10), z) > -2) continue; addHouse({ x: cx(z) + s * off2, z: z + rr() * 3, ry: s > 0 ? -Math.PI / 2 : Math.PI / 2, w: 6 + rr() * 4, d: 6 + rr() * 5, h: 3.5 + rr() * 2.5, windows: 1, mat: [M.plaster, M.mud][(rr() * 2) | 0] }); }
        }
      }
      // the valley of Makkah beyond: dozens of low houses towards the Ka'bah
      const far = SCAPE.scatter(w, { kind: 'house', n: 230, area: [-170, 175, 170, 455], scale: [6, 11], seed: 619, collide: true,
        avoid: (x, z) => Math.abs(x - cx(z)) < 44 && z < 258 || Math.hypot(x - KAABA.x, z - KAABA.z) < 46 || (Math.abs(x - KAABA.x) < 7 && z < KAABA.z) });
      far.meshes.forEach(m => { m.material = PHOTO.mat(w, 'clay_plaster', { triplanar: 0.25, color: 0xb8a890, fallback: m.material.map }); });
      // windows lit here and there across the town: warm points
      { const lp = [], r2 = U.seeded(77);
        for (const it of far.list) if (r2() < 0.22) { const a = it.ry; lp.push(it.x + Math.cos(a) * it.s * 0.52, H(it.x, it.z) + it.s * 0.38, it.z + Math.sin(a) * it.s * 0.52); }
        const lg = new T.BufferGeometry(); lg.setAttribute('position', new T.Float32BufferAttribute(lp, 3));
        const pts = new T.Points(lg, new T.PointsMaterial({ map: KIT.glowTex(w), color: 0xffa858, size: 1.6, transparent: true, opacity: 0.85, depthWrite: false, blending: T.AdditiveBlending })); pts.userData.dynamic = true; S.add(pts); }

      /* ---------- the Ka'bah in the valley, where the document hung ---------- */
      { const ky = H(KAABA.x, KAABA.z), g = new T.Group();
        box(M.kaaba, 11, 9, 12.5, 0, 4.5, 0, 0, g); box(M.stone, 11.8, 0.5, 13.3, 0, 0.25, 0, 0, g);
        box(M.door, 1.6, 2.6, 0.12, 2.2, 3.4, 6.28, 0, g);
        g.position.set(KAABA.x, ky, KAABA.z); S.add(g);
        // the document: a sheet of parchment by the door, lit by a lamp
        const parch = w.tex(256, (c, s) => { c.fillStyle = '#d8c49a'; c.fillRect(0, 0, s, s); c.fillStyle = 'rgba(80,50,20,0.55)'; for (let y = 30; y < s - 20; y += 16) c.fillRect(26 + Math.random() * 10, y, s - 60 - Math.random() * 40, 3); for (let i = 0; i < 600; i++) { c.fillStyle = `rgba(90,60,30,${Math.random() * 0.2})`; c.fillRect(Math.random() * s, Math.random() * s, 3, 3); } });
        this.doc = new T.Mesh(new T.PlaneGeometry(0.8, 1.1), new T.MeshStandardMaterial({ map: parch, roughness: 0.9, emissive: 0x6a4a20, emissiveIntensity: 0.25 }));
        this.doc.position.set(-1.4, 3.1, 6.32); this.doc.userData.dynamic = true; g.add(this.doc);
        this.kaabaLamp = KIT.glow(w, 0xffb060, 3.2, 0.9); this.kaabaLamp.position.set(KAABA.x - 1.3, ky + 4.4, KAABA.z + 7.2); S.add(this.kaabaLamp);
        w.addBox(KAABA.x - 6.5, KAABA.z - 7, KAABA.x + 6.5, KAABA.z + 7); }

      /* ---------- the ravine: scanned boulders for cover, rocks, scree, thorn ---------- */
      const cover = [], r3 = U.seeded(3);
      const nearKey = (x, z, d) => SHELTERS.some(h => Math.hypot(h.x - x, h.z - z) < d + 3.5) || BUNDLES.some(b => Math.hypot(b.x - x, b.z - z) < d + 1.2) || Math.hypot(x - FIRE.x, z - FIRE.z) < d + 6;
      const onRoute = (x, z) => WATCH.some(P => P.route && P.route.some((q, i) => { const n = P.route[(i + 1) % P.route.length]; const vx = n[0] - q[0], vz = n[1] - q[1], L2 = vx * vx + vz * vz || 1; const t = U.clamp(((x - q[0]) * vx + (z - q[1]) * vz) / L2); return Math.hypot(x - q[0] - vx * t, z - q[1] - vz * t) < 2.6; }));
      // along the foot of both walls, and a field of boulders on the west side of the lower ravine
      for (let z = 104; z > -178; z -= 3.6 + r3() * 3.4) for (const s of [-1, 1]) {
        if (r3() < 0.45) continue;
        const inset = 0.5 + r3() * 3.2, x = cx(z) + s * (hw(z) - inset + (s > 0 ? LEDGE(z) * 5.5 : 0));
        const sc = 0.7 + r3() * 1.1;
        if (nearKey(x, z, sc * 1.3) || onRoute(x, z)) continue;
        cover.push([x, z, sc]);
      }
      for (let i = 0; i < 46; i++) { const z = 22 + r3() * 52, x = cx(z) - 4 - r3() * 9; const sc = 0.6 + r3() * 0.9; if (!nearKey(x, z, sc) && !onRoute(x, z)) cover.push([x, z, sc]); }
      for (let i = 0; i < 26; i++) { const z = -84 - r3() * 90, x = cx(z) + (r3() - 0.5) * hw(z) * 1.6; const sc = 0.6 + r3() * 0.8; if (!nearKey(x, z, sc * 2) && walkable(x, z)) cover.push([x, z, sc]); }
      const big = cover.filter((_, i) => i % 2 === 0), flat = cover.filter((_, i) => i % 2 === 1);
      big.forEach(([x, z, s]) => { w.addCircle(x, z, 1.05 * s); occ.add(x, z, 1.15 * s, 1.75 * s); });
      flat.forEach(([x, z, s]) => { const k = s * 1.5; w.addCircle(x, z, 0.85 * k); occ.add(x, z, 0.95 * k, 0.8 * k); });
      SCAPE.scatter(w, { kind: 'model', model: 'namaqualand_boulder_04', points: big, fallback: 'boulder', fallbackScale: 1.2, sink: 0.12, seed: 11, color: '#b4aca6' });
      SCAPE.scatter(w, { kind: 'model', model: 'namaqualand_boulder_02', points: flat.map(([x, z, s]) => [x, z, s * 1.5]), fallback: 'boulder', fallbackScale: 0.9, sink: 0.08, seed: 12, color: '#b4aca6' });
      this.cover = cover;
      // cliffs of granite standing out of the walls
      const ravine = { x: 0, z: -40, r: 175 };
      const onFloor = (x, z) => outside(x, z) < 0.5 && z < 112;
      SCAPE.scatter(w, { kind: 'model', model: 'namaqualand_boulder_05', n: 50, area: ravine, density: (x, z) => (onFloor(x, z) && !onRoute(x, z) ? 1 : 0), scale: [0.6, 1.5], seed: 14 });
      SCAPE.scatter(w, { kind: 'model', model: 'namaqualand_rocks_01', n: 200, area: ravine, density: (x, z) => (outside(x, z) < 3 && z < 115 ? 1 : 0), scale: [2, 6], seed: 15, color: '#a8a4a0' });
      SCAPE.scatter(w, { kind: 'model', model: 'namaqualand_stones_01', n: 260, area: ravine, density: (x, z) => (outside(x, z) < 1 && z < 115 ? 1 : 0), scale: [2, 5], seed: 16, color: '#a09c98' });
      SCAPE.scatter(w, { kind: 'pebble', n: 1300, area: ravine, density: (x, z) => (outside(x, z) < 2 && z < 118 ? 1 : 0.0), scale: [0.05, 0.2], seed: 17, tex: 'granite' });
      SCAPE.scatter(w, { kind: 'rock', n: 260, area: { x: 0, z: -40, r: 220 }, density: (x, z) => (outside(x, z) > 1 ? 1 : 0), scale: [0.5, 2.2], seed: 18, color: '#a09088' });
      SCAPE.scatter(w, { kind: 'boulder', n: 190, area: { x: 0, z: -40, r: 260 }, density: (x, z) => (outside(x, z) > 6 ? 1 : 0), scale: [2, 6], seed: 19, color: '#9a8a80' });
      SCAPE.scatter(w, { kind: 'model', model: 'shrub_03', n: 110, area: { x: 0, z: 0, r: 240 }, density: (x, z) => (outside(x, z) < 4 && !onRoute(x, z) && !nearKey(x, z, 0.5) ? 1 : 0), scale: [2.5, 5], seed: 20 });
      SCAPE.scatter(w, { kind: 'thorn', n: 150, area: { x: 0, z: 20, r: 260 }, density: (x, z) => (outside(x, z) < 6 && !onRoute(x, z) ? 1 : 0), scale: [0.6, 1.3], seed: 21, color: '#c0b0a0' });
      SCAPE.scatter(w, { kind: 'grass', n: 1100, area: { x: 0, z: 0, r: 260 }, density: (x, z) => (outside(x, z) < 2 && outside(x, z) > -5 && z < 110 ? (SCAPE.fbm(x * 0.03, z * 0.03, 2) > 0 ? 0.9 : 0.3) : 0), scale: [0.35, 0.8], seed: 22, color: '#b8ae98' });
      SCAPE.scatter(w, { kind: 'model', model: 'dry_branches_medium_01', n: 30, area: ravine, density: (x, z) => (onFloor(x, z) ? 1 : 0), scale: [1, 2], seed: 23 });
      SCAPE.scatter(w, { kind: 'acacia', n: 22, area: { x: 0, z: 60, r: 120 }, density: (x, z) => (outside(x, z) < -2 && outside(x, z) > -8 && !onRoute(x, z) && z > -90 ? 1 : 0), scale: [0.9, 1.3], seed: 24, collide: 0.3 });
      SCAPE.scatter(w, { kind: 'model', model: 'dead_tree_trunk', points: [[cx(84) + 9, 84, 1.3], [cx(30) - 10, 30, 1.1], [cx(-95) - 14, -95, 1.2], [cx(-140) + 12, -140, 1]], seed: 25 });

      /* ---------- shelters of the clan ---------- */
      SHELTERS.forEach((h, i) => {
        const side = Math.sign(h.x - cx(h.z)) || -1;
        h.ry = side < 0 ? Math.PI / 2 : -Math.PI / 2;  // open to the middle of the ravine
        h.g = tent(w, M, { x: h.x, z: h.z, ry: h.ry, L: 4.2 + (i % 2) * 0.8, W: 3.3, hf: 1.9, hb: 1.2 });
        h.door = new T.Vector3(0, 0, 3.0).applyMatrix4(h.g.matrixWorld); h.inner = new T.Vector3(0, 0.6, 0.2).applyMatrix4(h.g.matrixWorld);
        w.addCircle(h.x, h.z, 1.9); occ.add(h.x, h.z, 2.2, 1.8);
        h.glow = KIT.glow(w, GOLD, 2.4, 0.06); h.glow.position.set(h.inner.x, H(h.inner.x, h.inner.z) + 0.5, h.inner.z); S.add(h.glow);
        h.pool = decal(w, 0, 4.4, 0xffa850); placeDecal(h.pool, h.door.x * 0.6 + h.inner.x * 0.4, h.door.z * 0.6 + h.inner.z * 0.4);
        h.fed = false; h.lit = 0;
      });
      // the camp in the upper basin: more shelters round one fire
      this.camp = [];
      { const r4 = U.seeded(57), emb = [];
        for (let i = 0; i < 13; i++) {
          const a = i / 13 * Math.PI * 2 + r4() * 0.3, d = 12 + r4() * 9, x = FIRE.x + Math.cos(a) * d, z = FIRE.z + Math.sin(a) * d * 1.6;
          if (!walkable(x, z) || outside(x, z) > -3 || SHELTERS.some(h => Math.hypot(h.x - x, h.z - z) < 7) || this.camp.some(c => Math.hypot(c.x - x, c.z - z) < 7)) continue;
          const ry = Math.atan2(FIRE.x - x, FIRE.z - z);
          const g = tent(w, M, { x, z, ry, L: 3.6 + r4() * 1.6, W: 3 + r4() * 0.6, hf: 1.7 + r4() * 0.4, hb: 1.1 });
          w.addCircle(x, z, 1.8); occ.add(x, z, 2, 1.7);
          const ip = new T.Vector3(0, 0.4, 0.4).applyMatrix4(g.matrixWorld); emb.push(ip.x, ip.y, ip.z);
          this.camp.push({ x, z, g });
        }
        const eg = new T.BufferGeometry(); eg.setAttribute('position', new T.Float32BufferAttribute(emb, 3));
        this.embers = new T.Points(eg, new T.PointsMaterial({ map: KIT.glowTex(w), color: 0xff8a3a, size: 1.3, transparent: true, opacity: 0.2, depthWrite: false, blending: T.AdditiveBlending })); this.embers.userData.dynamic = true; S.add(this.embers); }
      // the hearths: the clan's fire, nearly out
      PHOTO.place(w, 'stone_fire_pit', { pos: [FIRE.x, undefined, FIRE.z], s: 1.3 }); w.addCircle(FIRE.x, FIRE.z, 1.1);
      this.fireGlow = KIT.glow(w, 0xff5a1a, 1.4, 0.35); this.fireGlow.position.set(FIRE.x, H(FIRE.x, FIRE.z) + 0.3, FIRE.z); S.add(this.fireGlow);
      SCAPE.smoke(w, { sources: [[FIRE.x, H(FIRE.x, FIRE.z) + 0.5, FIRE.z]], n: 20, height: 9, size: 2.4, opacity: 0.12, color: '#8a8c9c', wind: [0.2, 0.5] });
      // empty vessels by the shelters (scanned): what hunger looks like without anyone in view
      const props = [['ceramic_vase_01', 1.3], ['jug_01', 1.2], ['wooden_bowl_01', 1.2], ['wicker_basket_01', 1.6], ['brass_pot_01', 1.1]];
      SHELTERS.forEach((h, i) => { const pd = props[i % props.length], q = new T.Vector3(1.6, 0, 2.2).applyMatrix4(h.g.matrixWorld); PHOTO.place(w, pd[0], { pos: [q.x, undefined, q.z], s: pd[1], ry: i }); });
      { const q = new T.Vector3(-1.4, 0, 2.6).applyMatrix4(SHELTERS[4].g.matrixWorld); PHOTO.place(w, 'wooden_bowl_01', { pos: [q.x, undefined, q.z], s: 1.3 }); this.emptyBowl = q; }

      /* ---------- the bundles of food ---------- */
      const bg = new T.SphereGeometry(0.3, 18, 12); bg.scale(1.15, 0.62, 1);
      { const q = bg.attributes.position; for (let i = 0; i < q.count; i++) { const x = q.getX(i), y = q.getY(i), z = q.getZ(i), k = 1 + U.noise2(x * 16 + z * 11, y * 16) * 0.14; q.setXYZ(i, x * k, y * (y < 0 ? 0.7 : 1), z * k); } bg.computeVertexNormals(); }
      const kg = new T.ConeGeometry(0.09, 0.2, 7); kg.translate(0, 0.25, 0);
      const makeBundle = () => { const g = new T.Group(); const a = new T.Mesh(bg, M.linen), b = new T.Mesh(kg, M.linen); a.castShadow = b.castShadow = true; g.add(a, b); g.userData.dynamic = true; return g; };
      const bundleRocks = [];
      BUNDLES.forEach((bd, i) => {
        bd.home = new T.Vector3(bd.x, H(bd.x, bd.z) + 0.17, bd.z);
        bd.mesh = makeBundle(); bd.mesh.position.copy(bd.home); bd.mesh.rotation.y = i * 1.7; S.add(bd.mesh);
        bd.glint = KIT.glow(w, 0xfff0c8, 0.9, 0.0); bd.glint.position.copy(bd.home).add(new T.Vector3(0, 0.45, 0)); S.add(bd.glint);
        bd.ph = i * 1.9; bd.taken = false; bd.delivered = false;
        if (i > 0) { // a few stones gathered over the hiding place
          for (let k = 0; k < 3; k++) { const a = i * 1.7 + k * 2.1, x = bd.x + Math.cos(a) * 0.85, z = bd.z + Math.sin(a) * 0.85; occ.add(x, z, 0.4, 0.5); }
          [0, 1, 2].forEach(k => { const a = i * 1.7 + k * 2.1; bundleRocks.push([bd.x + Math.cos(a) * 0.85, bd.z + Math.sin(a) * 0.85, 3.5 + k]); });
        }
      });
      SCAPE.scatter(w, { kind: 'model', model: 'namaqualand_rocks_01', points: bundleRocks, fallback: 'rock', fallbackScale: 0.12, seed: 40 });
      this.makeBundle = makeBundle;
      this.carried = makeBundle(); this.carried.visible = false;
      S.add(w.camera); w.camera.add(this.carried); this.carried.position.set(0.18, -0.55, -0.85); this.carried.rotation.set(0.25, 0.4, 0); this.carried.scale.setScalar(0.62);
      // a pebble in the hand, seen for a moment as it is thrown
      const pebM = new T.MeshStandardMaterial({ color: 0x8a8078, roughness: 0.9 });
      this.handPeb = new T.Mesh(new T.DodecahedronGeometry(0.05, 0), pebM); this.handPeb.visible = false; w.camera.add(this.handPeb);
      this.peb = new T.Mesh(new T.DodecahedronGeometry(0.06, 0), pebM); this.peb.visible = false; this.peb.userData.dynamic = true; S.add(this.peb);

      /* ---------- the watch: torches, their cones and pools of light ---------- */
      const fanMat = () => new T.MeshBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, blending: T.AdditiveBlending, fog: false, side: T.DoubleSide });
      const NR = 22;
      const stickM = PHOTO.mat(w, 'medieval_wood', { rep: [1, 1], color: 0x5a4636, fallback: KIT.wood(w) });
      const beamMat = new T.ShaderMaterial({
        uniforms: { uColor: { value: new T.Color(TORCH) }, uOp: { value: 0.12 } },
        vertexShader: 'varying float vA; varying vec3 vN; varying vec3 vV; void main(){ vA = position.z; vec4 mv = modelViewMatrix*vec4(position,1.); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }',
        fragmentShader: 'uniform vec3 uColor; uniform float uOp; varying float vA; varying vec3 vN; varying vec3 vV; void main(){ float rim = abs(dot(normalize(vN), normalize(vV))); float a = uOp * pow(rim, 3.2) * (1.0 - 0.35*vA) * smoothstep(0.0, 0.05, vA); gl_FragColor = vec4(uColor * a, a); }',
        transparent: true, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide,
      });
      const coneG = new T.ConeGeometry(1, 1, 24, 1, true); coneG.translate(0, -0.5, 0); coneG.rotateX(-Math.PI / 2);
      this.watch = WATCH.map((d, k) => {
        const P = Object.assign({ i: 0, dir: 1, state: 'walk', t: 0, sus: 0, a: 0, R: 13, half: 0.5, pos: new T.Vector3(), seen: 0, heard: null, k }, d);
        if (!P.rim) {
          P.pos.set(P.route[0][0], 0, P.route[0][1]); P.a = P.post != null ? P.post : 0;
          if (P.route.length === 1) { P.state = 'post'; P.base = P.post || 0; }
          const geo = new T.BufferGeometry(), np = 1 + NR * 2;
          geo.setAttribute('position', new T.BufferAttribute(new Float32Array(np * 3), 3)); geo.setAttribute('color', new T.BufferAttribute(new Float32Array(np * 3), 3));
          const idx = []; for (let i = 0; i < NR - 1; i++) { const a = 1 + i * 2, b = a + 2; idx.push(0, a, b, a, a + 1, b + 1, a, b + 1, b); }
          geo.setIndex(idx); P.fan = new T.Mesh(geo, fanMat()); P.fan.frustumCulled = false; P.fan.userData.dynamic = true; P.fan.renderOrder = 3; S.add(P.fan);
          P.stick = new T.Mesh(new T.CylinderGeometry(0.025, 0.035, 0.7, 6), stickM); P.stick.userData.dynamic = true; S.add(P.stick);
        } else {
          const rx = cx(P.at) + P.side * (hw(P.at) + 16); P.pos.set(rx, H(rx, P.at) + 1.6, P.at); P.R = 4;
          P.beam = new T.Mesh(coneG, beamMat); P.beam.userData.dynamic = true; P.beam.frustumCulled = false; S.add(P.beam);
          P.pool = decal(w, 0, 4.2, TORCH); P.tgt = new T.Vector3();
        }
        P.flame = KIT.glow(w, 0xff8a3a, 2.2, 0.95); S.add(P.flame);
        P.core = KIT.glow(w, 0xffe2a8, 0.6, 1); S.add(P.core);
        P.crackle = SND.noise(env.bus, { color: 'white', type: 'bandpass', freq: 2300, q: 0.8, gain: 0 });
        P.stepT = Math.random();
        return P;
      });
      this.torchLights = [0, 1, 2].map(() => { const L = new T.PointLight(0xff8040, 0, 20, 1.6); S.add(L); return L; });
      this.warmLights = [0, 1, 2].map(() => { const L = new T.PointLight(0xffa452, 0, 10, 1.5); S.add(L); return L; });
      this.beamMat = beamMat;

      /* noise rings, and the words in light at the end */
      this.rings = [0, 1, 2].map(() => { const m = decal(w, 0.92, 1, 0xffe0b0, 56); m.material.map = null; return { m, t: 1, r: 1 }; });
      this.words = new T.Sprite(new T.SpriteMaterial({ map: wordsTex('بِاسْمِكَ اللَّهُمَّ', 'In Your name, O God'), transparent: true, opacity: 0, depthWrite: false, fog: false }));
      this.words.scale.set(34, 6.3, 1); S.add(this.words);

      /* life: dust in the moonlight, bats over the camp, a few birds asleep, smoke in the town */
      SCAPE.motes(w, { n: 90, area: [-20, 0.3, -170, 20, 8, 110], color: '#c8d0f0', size: 0.18, opacity: 0.35, additive: true, seed: 4 });
      SCAPE.smoke(w, { sources: [[cx(200) - 20, 6, 200], [cx(240) + 30, 6, 240], [KAABA.x + 40, 5, 330]], n: 14, height: 14, size: 3, opacity: 0.08, color: '#7a7c8c' });
      SCAPE.birds(w, { n: 7, x: FIRE.x, z: FIRE.z, y: 34, r: 40, color: 0x101018, size: 0.45, speed: 0.4 });

      this.baked = w.bake();
      P_env(w);
      function P_env(w) { w.post({ bloom: 0.8, threshold: 0.55, rays: { strength: 0.2, dir: moonDir.toArray() }, vignette: 0.55, grain: 0.045, sat: 0.78, contrast: 1.1, lift: [0.0, 0.008, 0.026], gain: [0.9, 0.97, 1.12] }); }

      /* ---------- HUD: the radar of the watch, the light of your own body, touch buttons ---------- */
      const rad = document.createElement('canvas'); rad.width = rad.height = 280;
      rad.style.cssText = 'position:absolute;left:calc(var(--gut, 16px) + 10px);top:calc(env(safe-area-inset-top, 0px) + 64px);width:140px;height:140px;border-radius:50%;pointer-events:none;opacity:0;transition:opacity .6s;box-shadow:0 0 0 1px rgba(242,233,214,.25),0 6px 30px rgba(0,0,0,.45);';
      rad.className = 'boycott-radar'; w.ui.layer.appendChild(rad); this.radar = rad; this.rctx = rad.getContext('2d');
      const gem = document.createElement('div'); gem.className = 'boycott-gem';
      gem.style.cssText = 'position:absolute;left:calc(var(--gut, 16px) + 10px);top:calc(env(safe-area-inset-top, 0px) + 212px);width:140px;text-align:center;font:600 .62rem/1.2 var(--f-display, serif);letter-spacing:.22em;text-transform:uppercase;color:rgba(242,233,214,.75);pointer-events:none;opacity:0;transition:opacity .6s;text-shadow:0 1px 4px #000';
      gem.innerHTML = '<i style="display:block;margin:0 auto 6px;width:16px;height:16px;border-radius:50%;background:#28304a;box-shadow:0 0 0 1px rgba(242,233,214,.35);transition:background .25s, box-shadow .25s"></i><span>hidden</span>';
      w.ui.layer.appendChild(gem); this.gem = gem;
      const mkBtn = (label, bottom, fn) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'boycott-btn'; b.textContent = label;
        b.style.cssText = `position:absolute;right:calc(var(--gut-r, 16px) + 92px);bottom:calc(env(safe-area-inset-bottom, 0px) + ${bottom}px);width:76px;height:52px;border-radius:26px;border:1px solid rgba(242,233,214,.4);background:rgba(6,9,20,.55);color:#f2e9d6;font:600 .62rem var(--f-display, serif);letter-spacing:.16em;pointer-events:auto;touch-action:none;display:none`;
        b.addEventListener('pointerdown', e => { e.stopPropagation(); e.preventDefault(); fn(); }); w.ui.layer.appendChild(b); return b; };
      this.btns = [mkBtn('CROUCH', 156, () => this.toggleCrouch(env)), mkBtn('PEBBLE', 222, () => this.throwPebble(env))];
      this.touch = matchMedia('(pointer: coarse)').matches;
      const fade = document.createElement('div'); fade.style.cssText = 'position:absolute;inset:0;background:#03040a;opacity:0;pointer-events:none;'; w.ui.layer.insertBefore(fade, w.ui.layer.firstChild); this.curtain = fade;
      const vig = document.createElement('div'); vig.style.cssText = 'position:absolute;inset:0;pointer-events:none;opacity:0;background:radial-gradient(ellipse at center, rgba(255,110,40,0) 40%, rgba(255,96,36,.28) 74%, rgba(170,40,10,.55) 100%);mix-blend-mode:screen;'; w.ui.layer.insertBefore(vig, w.ui.layer.firstChild); this.vig = vig;

      /* ---------- interactions ---------- */
      BUNDLES.forEach((bd, i) => w.interact({ key: 'bundle' + i, pos: [bd.x, bd.home.y + 0.3, bd.z], r: 2.3, label: 'Take up the bundle of food',
        enabled: () => self.S.phase === 'play' && !self.S.carrying && !bd.taken && bd.part === self.S.part && self.S.returnT < 0, onUse: () => self.take(env, bd) }));
      SHELTERS.forEach((h, i) => w.interact({ key: 'shelter' + i, pos: [h.door.x, H(h.door.x, h.door.z) + 0.8, h.door.z], r: 3.2, label: 'Leave the food at this shelter',
        enabled: () => !!self.S.carrying && !h.fed && h.part === self.S.part, onUse: () => self.give(env, h) }));

      /* ---------- discoveries ---------- */
      const dp = (x, z, y) => [x, H(x, z) + (y || 1.2), z];
      w.discover({ pos: dp(cx(104) - 15, 104), title: 'The Oath at Khayf', ar: 'خَيْفُ بَنِي كِنَانَة',
        text: 'Quraysh and Kinanah swore an oath at Khayf Bani Kinanah against Banu Hashim and Banu al-Muttalib: no marrying among them and no trading with them. Years later, at the Farewell Hajj, the Prophet ﷺ recalled the place. (Sahih al-Bukhari 1590; Sahih Muslim 1314)' });
      w.discover({ pos: dp(cx(186) + 2.5, 186), title: 'Wheat for Khadijah', label: 'Look at the threshold',
        text: 'Ibn Ishaq tells that Abu Jahl met Hakim ibn Hizam with wheat he was taking to his aunt Khadijah in the ravine, and that Abu al-Bakhtari came between them and let the food go through. (Ibn Ishaq, sirah)' });
      w.discover({ pos: dp(cx(36) + hw(36) + 3, 36), title: 'The Ravine of Abu Talib', ar: 'شِعْبُ أَبِي طَالِب',
        text: 'Banu Hashim and Banu al-Muttalib withdrew with Abu Talib into his ravine. Ibn Ishaq says the boycott lasted about three years; Ibn Sa‘d puts its start in the seventh year of the prophethood. (Ibn Ishaq; Ibn Sa‘d, al-Tabaqat)' });
      w.discover({ pos: [this.emptyBowl.x, H(this.emptyBowl.x, this.emptyBowl.z) + 0.8, this.emptyBowl.z], title: 'Khadijah in the Ravine', label: 'Look at the empty bowl',
        text: 'Khadijah shared the years of the ravine; Hakim ibn Hizam, her nephew, smuggled food to her (Ibn Ishaq). She died about three years before the Hijrah. (Sahih al-Bukhari 3896)' });
      w.discover({ pos: dp(cx(-160), -160), title: 'Those Who Ended It',
        text: 'Ibn Ishaq names five men of Quraysh who worked to end the boycott: Hisham ibn ‘Amr, Zuhayr ibn Abi Umayyah, al-Mut‘im ibn ‘Adi, Abu al-Bakhtari ibn Hisham and Zam‘ah ibn al-Aswad. In his account al-Mut‘im tore up the document. (Ibn Ishaq)' });
      w.discover({ pos: dp(KAABA.x + 10, KAABA.z - 14, 1.4), title: 'The Document', label: 'Look towards the House',
        text: 'The terms were written down, and the document was hung in the Ka‘bah. The sirah names its writer as Mansur ibn ‘Ikrimah. (Ibn Ishaq, Ibn Hisham)' });

      /* ---------- sound: wind in the ravine, crickets, the hum of the shelters ---------- */
      const b = env.bus;
      this.wind = SND.noise(b, { color: 'pink', type: 'bandpass', freq: 260, q: 0.6, gain: 0.045 });
      SND.lfo(b, this.wind.gain && this.wind.gain.gain, 0.05, 0.02);
      this.clocks = { heart: 0, cricket: 1, hum: 3, gust: 5, murmur: 4, dog: 9 };

      w.onStep = surf => self.footNoise(env, surf);
      this.setPart(env, 0, true);
    },

    /* ================= the entrance film ================= */
    film(env, w) {
      const ky = H(KAABA.x, KAABA.z), fy = H(FIRE.x, FIRE.z), dy = H(DOOR.x, DOOR.z), self = this;
      return [
        { dur: 7, fade: 'dip', title: true, ease: 'glide', fov: [52, 46],
          path: [[[140, 150, 560], [0, 30, 60]], [[90, 120, 430], [0, 25, 0]], [[50, 95, 330], [0, 20, -60]]],
          start: () => SND.glow(env.bus, 146.83, { gain: 0.04, dur: 8 }) },
        { dur: 7, fade: 'dip', ease: 'inout', fov: [40, 34],
          lines: [[0.5, 'Quraysh swore an oath against Banu Hashim and Banu al-Muttalib.', 'تعاهدت قريش على بني هاشم وبني المطّلب.'], [3.6, 'No one would marry among them, and no one would trade with them.', 'ألّا يناكحوهم ولا يبايعوهم.']],
          path: [[[KAABA.x + 18, ky + 4, KAABA.z + 30], [KAABA.x - 1, ky + 3.2, KAABA.z + 6]], [[KAABA.x + 6, ky + 3.4, KAABA.z + 16], [KAABA.x - 1.4, ky + 3.1, KAABA.z + 6.3]]],
          start: () => SND.sing(env.bus, 110, { vowel: 'o', dur: 6, gain: 0.03, voices: 3, attack: 1.5 }) },
        { dur: 6, fade: 'cut', ease: 'inout', line: 'The document was hung inside the Ka‘bah.', ar: 'وعُلِّقت الصحيفةُ في جوف الكعبة.', lineAt: 0.4, fov: [30, 26],
          path: [[[KAABA.x + 1.2, ky + 3.3, KAABA.z + 9.5], [KAABA.x - 1.4, ky + 3.1, KAABA.z + 6.3]], [[KAABA.x - 0.2, ky + 3.25, KAABA.z + 8.2], [KAABA.x - 1.4, ky + 3.1, KAABA.z + 6.3]]] },
        { dur: 8, fade: 'dip', ease: 'glide',
          lines: [[0.5, 'The clan withdrew with Abu Talib into his ravine.', 'وانحاز بنو هاشم وبنو المطّلب مع أبي طالب إلى شِعبه.'], [4.2, 'There they lived for about three years.', 'وأقاموا فيه نحو ثلاث سنين.']],
          path: [[[FIRE.x + 40, fy + 46, FIRE.z - 60], [FIRE.x, fy + 2, FIRE.z]], [[FIRE.x + 26, fy + 22, FIRE.z - 30], [FIRE.x, fy + 1, FIRE.z]], [[FIRE.x + 12, fy + 6, FIRE.z - 14], [FIRE.x - 2, fy + 1, FIRE.z + 2]]],
          start: () => { SND.sing(env.bus, 98, { vowel: 'm', dur: 5, gain: 0.03, voices: 2, attack: 1 }); } },
        { dur: 6, fade: 'cut', ease: 'linear', shake: 0.04,
          path: [[[cx(80) - 4, H(cx(80), 80) + 1.1, 84], [cx(60), H(cx(60), 60) + 1.4, 58]], [[cx(64) - 3, H(cx(64), 64) + 1.0, 66], [cx(40), H(cx(40), 40) + 1.4, 40]]],
          start: () => { SND.thump(env.bus, { f: 50, gain: 0.08, dur: 0.4 }); SND.thump(env.bus, { f: 50, gain: 0.07, dur: 0.4, delay: 0.5 }); } },
        { dur: 8, fade: 'dip', ease: 'glide', line: 'Kinsmen such as Hakim ibn Hizam smuggled food to them.', ar: 'وكان من أقاربهم من يحمل إليهم الطعام سرًّا، كحكيم بن حزام.', lineAt: 1.4,
          path: [[[DOOR.x - 9, dy + 3.2, DOOR.z - 7], [DOOR.x, dy + 1.0, DOOR.z]], [[DOOR.x - 5.5, dy + 2.0, DOOR.z - 3], [DOOR.x - 0.8, dy + 0.6, DOOR.z]]],
          start: () => { self.doorOpen = 0; },
          during: (ww, k) => { if (k > 0.25 && self.doorOpen === 0) { self.doorOpen = 0.001; SND.knock(env.bus, { f: 180, gain: 0.05, click: 900 }); SND.swell(env.bus, { f0: 300, f1: 900, dur: 1.2, gain: 0.03 }); } } },
      ];
    },
    filmOpts: { end(w, skipped) { const st = ENGINE.byId('boycott'); if (!st || !st.S) return; st.doorOpen = Math.max(st.doorOpen || 0, 0.001); st.S.phase = 'play'; w.goal(null); st.radar.style.opacity = 1; st.gem.style.opacity = 1; if (st.touch) st.btns.forEach(b => { b.style.display = 'block'; }); } },

    /* ================= the game ================= */
    setPart(env, n, first) {
      const w = this.w, S = this.S; S.part = n;
      const P = PARTS[n];
      S.checkpoint = Object.assign({}, P.start);
      const steps = ['Take up the bundle at the open door, then carry it down the lane to the first shelter in the ravine. Keep to the shadows of the houses',
        'Two bundles lie hidden among the rocks at the mouth. Carry each to a shelter before the narrows. Q throws a pebble to draw a torch away',
        'Two more bundles wait by the second shelters. Take them through the narrows to the camp in the upper basin'];
      w.activity(P.title, 5, steps[n]); w.progress(S.fed);
      // only this part's torches burn; the ones behind you go out
      this.watch.forEach(Pw => { Pw.active = Pw.part === n; Pw.sus = 0; });
      BUNDLES.forEach(bd => { bd.glint.visible = bd.part === n; });
    },
    toggleCrouch(env) {
      const S = this.S; S.crouch = !S.crouch;
      SND.swell(env.bus, { f0: 400, f1: 900, dur: 0.35, gain: 0.04 });
    },
    footNoise(env, surf) {
      const w = this.w, S = this.S; if (S.phase !== 'play' || S.crouch) return;
      const run = w.keys.has('Shift') && w.moving > 3.4;
      const r = run ? (surf === 'gravel' ? 13 : 9.5) : (surf === 'gravel' ? 3.6 : 2.2);
      if (r > 3) this.ring(w.pos.x, w.pos.z, r);
      this.alarm(w.pos.x, w.pos.z, r);
    },
    ring(x, z, r) { const g = this.rings.find(q => q.t >= 1) || this.rings[0]; g.t = 0; g.r = r; g.x = x; g.z = z; },
    alarm(x, z, r) {
      for (const P of this.watch) {
        if (!P.active || P.rim || P.state === 'notice') continue;
        if (Math.hypot(P.pos.x - x, P.pos.z - z) < r) { P.heard = { x, z }; P.state = 'turn'; P.t = 0.7; }
      }
    },
    throwPebble(env) {
      const w = this.w, S = this.S; if (S.phase !== 'play' || S.pebbleT > 0 || w.cine || S.returnT >= 0) return;
      S.pebbleT = 1.1;
      const f = w.forward(), v = new T.Vector3(f.x, Math.max(f.y, -0.2) + 0.35, f.z).normalize().multiplyScalar(15);
      this.pebble = { p: new T.Vector3(w.pos.x, w.y + w.eye - 0.2, w.pos.z).addScaledVector(f, 0.5), v, t: 0 };
      this.peb.visible = true; this.handPeb.visible = true; this.handT = 0;
      SND.swell(env.bus, { f0: 600, f1: 2200, dur: 0.35, gain: 0.05 });
    },
    take(env, bd) {
      const w = this.w, S = this.S;
      bd.taken = true; S.carrying = bd; bd.mesh.visible = false; bd.glint.visible = false;
      this.carried.visible = true; this.carryLift = 0;
      S.checkpoint = { x: w.pos.x, z: w.pos.z, yaw: w.yaw };
      SND.swell(env.bus, { f0: 500, f1: 1600, dur: 0.6, gain: 0.07 }); SND.step(env.bus, { gain: 0.2, f: 700 });
      SND.bell(env.bus, 392, { gain: 0.03, vowel: 'm' });
      w.step(S.part === 0 ? 'Carry it down the lane and into the ravine. C to crouch in the shadow when the lantern turns your way'
        : S.part === 1 ? 'Through the lower ravine: the floor, the boulders on the west, or the shelf along the east wall'
          : 'Through the narrows. Wait in an alcove while the torch passes');
    },
    give(env, h) {
      const w = this.w, S = this.S, bd = S.carrying;
      h.fed = true; h.lit = 0; bd.delivered = true; S.carrying = null; this.carried.visible = false; S.fed++;
      bd.mesh.position.set(h.door.x * 0.45 + h.inner.x * 0.55, H(h.inner.x, h.inner.z) + 0.17, h.door.z * 0.45 + h.inner.z * 0.55); bd.mesh.visible = true; bd.mesh.scale.setScalar(0.01); bd.grow = 0;
      const sp = w.spatial(h.door, 8), chord = [196, 246.94, 293.66, 329.63, 392];
      SND.knock(env.bus, { f: 160, gain: 0.07, click: 900 });
      SND.sing(env.bus, chord[S.fed - 1] * 0.5, { vowel: 'm', dur: 3.4, gain: 0.045, pan: sp.pan, voices: 2, attack: 0.3, hold: 0.5 });
      SND.bell(env.bus, chord[S.fed - 1], { gain: 0.035, delay: 0.25, pan: sp.pan });
      const left = SHELTERS.filter(q => q.part === S.part && !q.fed).length;
      if (S.fed === 1) w.say('Food by Night', 'Food reached the ravine only in secret. Ibn Ishaq tells of Hakim ibn Hizam carrying wheat to his aunt Khadijah. (Ibn Ishaq)', { ms: 10000 });
      if (left) { w.progress(S.fed, 'One more bundle for this part. The torches still walk'); return; }
      if (S.part < 2) {
        w.progress(S.fed);
        this.partT = 0; S.phase = 'between';
        setTimeout(() => { if (this.w) this.setPart(env, S.part + 1); if (this.w) this.S.phase = 'play'; }, 2600);
        SND.glow(env.bus, 196, { gain: 0.035, dur: 5 });
      } else { S.phase = 'still'; S.endT = 0; w.progress(5, 'Every shelter has food tonight'); w.goal(null); }
    },
    caught(env) {
      const w = this.w, S = this.S;
      S.returnT = 0; w.enabled = false;
      SND.swell(env.bus, { f0: 900, f1: 300, dur: 1.4, gain: 0.06 });
      SND.sing(env.bus, 220, { vowel: 'o', dur: 2.2, gain: 0.03, glide: 1.12, attack: 0.1 });
      SND.sing(env.bus, 164.81, { vowel: 'o', dur: 2.4, gain: 0.025, delay: 0.5, attack: 0.2 });
    },
    // is a point (at height h above the ground) out of the moonlight? terrain and boulders
    shaded(x, z, h) {
      const d = this.moonDir, y0 = H(x, z) + h, hl = Math.hypot(d.x, d.z) || 1e-3;
      for (let s = 0.6; s < 140; s *= 1.16) {
        const px = x + d.x / hl * s, pz = z + d.z / hl * s, py = y0 + d.y / hl * s;
        if (H(px, pz) > py) return true;
        if (s < 30 && this.occ.at(px, pz, py)) return true;
      }
      return false;
    },
    // walk a horizontal line from a torch; returns the free length (walls and occluders stop it)
    reach(x0, z0, dx, dz, L, hTop) {
      for (let s = 0.7; s < L; s += 0.7) {
        const x = x0 + dx * s, z = z0 + dz * s;
        if (!walkable(x, z) && outside(x, z) > 1.5) return s;
        if (this.occ.at(x, z, hTop)) return s + 0.3;
      }
      return L;
    },

    update(env, dt) {
      const w = this.w; if (!w) return;
      const S = this.S, px = w.pos.x, pz = w.pos.z, b = env.bus;
      // crouch: eye height eases down, pace slows
      const crouch = S.crouch || w.keys.has('Control');
      S.eye = U.damp(S.eye, crouch ? 1.0 : 1.6, 10, dt); w.eye = S.eye;
      w.speed = crouch ? 1.45 : S.carrying ? 2.4 : 2.7; w.run = crouch ? 2.0 : S.carrying ? 4.4 : 5.2;
      w.update(dt);
      // keep to the floor of the ravine and the town: slide along the walls
      if (!walkable(w.pos.x, w.pos.z)) {
        if (walkable(px, w.pos.z)) w.pos.x = px; else if (walkable(w.pos.x, pz)) w.pos.z = pz; else { w.pos.x = px; w.pos.z = pz; }
      }
      const t = w.time;

      // the door: once opened it stays ajar, lamplight on the threshold
      if (this.doorOpen > 0) { this.doorOpen = Math.min(1, this.doorOpen + dt * 0.5); const k = U.easeOut(this.doorOpen); this.doorLeaf.rotation.y = -k * 1.1; this.doorGlow.material.opacity = 0.85 * k; }
      this.kaabaLamp.material.opacity = 0.75 + 0.15 * Math.sin(t * 6.1) * Math.sin(t * 2.3);
      this.fireGlow.material.opacity = (0.28 + 0.1 * Math.sin(t * 7) * Math.sin(t * 3.1)) * (1 + this.S.fed * 0.25);

      /* bundles glint; the carried one rises into the arms */
      for (const bd of BUNDLES) {
        if (!bd.taken && bd.part === S.part && S.phase === 'play') { const tw = Math.pow(Math.max(0, Math.sin(t * 1.3 + bd.ph)), 10); bd.glint.material.opacity = 0.25 + 0.7 * tw; bd.glint.scale.setScalar(0.6 + tw * 0.8); }
        else bd.glint.material.opacity = 0;
        if (bd.grow != null && bd.grow < 1) { bd.grow = Math.min(1, bd.grow + dt * 3); bd.mesh.scale.setScalar(U.easeOut(bd.grow) * (1 + Math.sin(bd.grow * Math.PI) * 0.15)); }
      }
      if (S.carrying) { this.carryLift = Math.min(1, (this.carryLift || 0) + dt * 5); const k = U.easeOut(this.carryLift); this.carried.position.set(0.18, -0.72 + k * 0.17 + Math.sin(w.bob * 2) * 0.012, -0.85); }

      /* shelters: a fed shelter warms and stays warm; unfed ones of this part breathe faintly when you carry food */
      for (const h of SHELTERS) {
        if (h.fed) { h.lit = Math.min(1, h.lit + dt * 0.6); const k = U.easeOut(h.lit), f = 0.9 + 0.1 * Math.sin(t * 5 + h.z) * Math.sin(t * 2.3 + h.x);
          h.glow.material.opacity = (0.2 + 0.6 * k) * f; h.glow.scale.setScalar(2 + k * 1.6 + Math.sin(h.lit * Math.PI) * 1.4); h.pool.material.opacity = 0.32 * k * f; }
        else { const want = S.carrying && h.part === S.part ? 0.22 + 0.12 * Math.sin(t * 2 + h.z) : 0.05; h.glow.material.opacity = U.damp(h.glow.material.opacity, want, 3, dt); h.pool.material.opacity = U.damp(h.pool.material.opacity, S.carrying && h.part === S.part ? 0.08 : 0, 3, dt); }
      }
      this.embers.material.opacity = (0.16 + S.fed * 0.04 + (S.phase === 'reveal' || S.phase === 'still' ? 0.35 : 0)) * (0.88 + 0.12 * Math.sin(t * 4));
      // warm lights go to the nearest warm places
      { const spots = SHELTERS.filter(h => h.fed).map(h => h.glow.position);
        if (this.doorOpen > 0) spots.push(new T.Vector3(DOOR.x - 0.8, H(DOOR.x, DOOR.z) + 1.2, DOOR.z));
        spots.push(this.fireGlow.position);
        spots.push(this.kaabaLamp.position);
        spots.sort((a, c) => a.distanceToSquared(w.camera.position) - c.distanceToSquared(w.camera.position));
        this.warmLights.forEach((L, i) => { const s = spots[i]; if (!s) { L.intensity = 0; return; } L.position.set(s.x, s.y + 0.4, s.z); L.intensity = (s === this.fireGlow.position ? 0.6 + S.fed * 0.2 : 1.6) * (0.9 + 0.1 * Math.sin(t * 6 + i)); }); }

      /* ---------- the watch ---------- */
      const play = S.phase === 'play' && !w.cine && S.returnT < 0;
      const crouchK = crouch ? 0.5 : 1, moveK = w.moving > 3.4 ? 1.35 : w.moving < 0.3 ? 0.75 : 1;
      const bodyH = crouch ? 0.55 : 1.0;
      const meShaded = this.shaded(w.pos.x, w.pos.z, bodyH);
      let anySeen = 0, maxSus = 0, nearT = 0, lightOnMe = meShaded ? 0.15 : 0.55;
      const fadeAll = S.phase === 'reveal' || S.phase === 'still' ? Math.max(0, 1 - S.endT / 3) : 1;
      for (const P of this.watch) {
        const on = (P.active || w.filmS) && fadeAll > 0.01;
        const fk = (0.86 + 0.14 * Math.sin(t * 13 + P.k * 5) * Math.sin(t * 7 + P.k)) * fadeAll * (on ? 1 : 0);
        if (!P.rim) {
          if (on) this.walkWatch(P, dt, play);
          const gy = H(P.pos.x, P.pos.z), bob = Math.abs(Math.sin(P.walkPh || 0)) * 0.05;
          P.pos.y = gy + 1.65 + bob;
          P.stick.visible = on; P.stick.position.set(P.pos.x, P.pos.y - 0.32, P.pos.z); P.stick.rotation.set(0.15, 0, Math.sin(t * 2 + P.k) * 0.08);
          // the cone of light, stopped by walls and boulders
          const pa = P.fan.geometry.attributes.position, pc = P.fan.geometry.attributes.color, NR = (pa.count - 1) / 2;
          const sk = U.clamp(P.sus), col = new T.Color(TORCH).lerp(new T.Color(0xff3a10), sk);
          const inten = (0.42 + sk * 0.35) * fk;
          pa.setXYZ(0, P.pos.x, gy + 0.08, P.pos.z); pc.setXYZ(0, col.r * inten, col.g * inten, col.b * inten);
          for (let i = 0; i < NR; i++) {
            const a = P.a + (i / (NR - 1) - 0.5) * 2 * P.half, dx = Math.sin(a), dz = Math.cos(a);
            const L = on ? this.reach(P.pos.x, P.pos.z, dx, dz, P.R, 1.2) : 0.01;
            const m1 = L * 0.55, x1 = P.pos.x + dx * m1, z1 = P.pos.z + dz * m1, x2 = P.pos.x + dx * L, z2 = P.pos.z + dz * L;
            pa.setXYZ(1 + i * 2, x1, H(x1, z1) + 0.08, z1); pa.setXYZ(2 + i * 2, x2, H(x2, z2) + 0.08, z2);
            const e1 = inten * 0.55, e2 = inten * 0.1 * (L / P.R);
            pc.setXYZ(1 + i * 2, col.r * e1, col.g * e1, col.b * e1); pc.setXYZ(2 + i * 2, col.r * e2, col.g * e2, col.b * e2);
          }
          pa.needsUpdate = pc.needsUpdate = true; P.fan.visible = on;
          // can it see you?
          let see = 0;
          if (play && on) {
            const dx = w.pos.x - P.pos.x, dz = w.pos.z - P.pos.z, d = Math.hypot(dx, dz);
            let da = Math.atan2(dx, dz) - P.a; da = Math.atan2(Math.sin(da), Math.cos(da));
            if (d < 2.2 || (d < P.R && Math.abs(da) < P.half + 0.05 && this.reach(P.pos.x, P.pos.z, dx / d, dz / d, d, bodyH) >= d - 0.4)) {
              const lit = d < P.R * 0.55 ? 1 : meShaded ? 0.22 : 0.7;
              see = lit * crouchK * moveK * (1.25 - d / P.R * 0.6) * (d < 2.2 ? 2 : 1);
              if (d < P.R * 0.55) lightOnMe = Math.max(lightOnMe, 1 - d / (P.R * 0.55) * 0.4);
            }
          }
          this.suspect(P, see, dt, env);
        } else {
          // a torch on the rim, sweeping a pool of light along the floor below
          const z = P.zc + P.A * Math.sin(t * P.sw + P.k);
          const sx = P.side > 0 ? cx(z) + 8 + Math.sin(t * P.sw * 1.7 + P.k) * 9 : cx(z) + Math.sin(t * P.sw * 1.7 + P.k) * 5.5, sz = z;
          P.tgt.set(sx, H(sx, sz), sz);
          P.pos.y = H(P.pos.x, P.pos.z) + 1.6 + Math.sin(t * 1.4 + P.k) * 0.04;
          const dist = P.pos.distanceTo(P.tgt);
          P.beam.position.copy(P.pos); P.beam.scale.set(3.6, 3.6, dist); P.beam.lookAt(P.tgt); P.beam.visible = fk > 0.01;
          placeDecal(P.pool, sx, sz, 1); P.pool.material.opacity = (0.55 + U.clamp(P.sus) * 0.3) * fk;
          let see = 0;
          if (play && on) { const d = Math.hypot(w.pos.x - sx, w.pos.z - sz); if (d < 3.9) { see = (crouch ? 1.0 : 1.4) * (1.2 - d / 4); lightOnMe = 1; } }
          this.suspect(P, see, dt, env);
        }
        P.flame.position.copy(P.pos); P.flame.material.opacity = 0.9 * fk * (1 + U.clamp(P.sus) * 0.4); P.flame.scale.setScalar((2.1 + 0.35 * Math.sin(t * 11 + P.k)) * (1 + U.clamp(P.sus) * 0.6));
        P.core.position.copy(P.pos); P.core.material.opacity = fk;
        const sp = w.spatial(P.pos, 12); P.crackle.set('gain', 0.03 * sp.gain * fk, 0.1);
        if (on) { nearT = Math.max(nearT, sp.gain); maxSus = Math.max(maxSus, P.sus); if (P.seenNow) anySeen++; }
        // footsteps of the watch, crunching on the grit
        if (on && !P.rim && P.moving) { P.stepT -= dt * (P.state === 'search' ? 2.8 : 1.9); if (P.stepT < 0) { P.stepT = 1; const g = sp.gain; if (g > 0.03) SND.step(b, { gain: 0.12 * g, f: U.rnd(700, 1200), pan: sp.pan }); } }
      }
      this.beamMat.uniforms.uOp.value = 0.12 * fadeAll;
      // the nearest torches carry real light
      { const act = this.watch.filter(P => (P.active || w.filmS) && fadeAll > 0.01).sort((a, c) => a.pos.distanceToSquared(w.camera.position) - c.pos.distanceToSquared(w.camera.position));
        this.torchLights.forEach((L, i) => { const P = act[i]; if (!P) { L.intensity = 0; return; } L.position.copy(P.pos); L.intensity = 2.4 * fadeAll * (0.85 + 0.15 * Math.sin(t * 13 + i)); }); }

      // caught: the night takes you back
      if (play && maxSus >= 1) this.caught(env);
      S.sus = maxSus;
      this.vig.style.opacity = Math.max(U.clamp((maxSus - 0.15) * 1.2), S.returnT >= 0 ? 1 - S.returnT / 1.2 : 0).toFixed(3);
      this.clocks.heart -= dt * (1 + maxSus * 2.4);
      if (play && this.clocks.heart < 0 && (maxSus > 0.15 || nearT > 0.4)) { this.clocks.heart = 1; SND.thump(b, { f: 50, gain: 0.06 + maxSus * 0.14, dur: 0.4 }); }
      if (S.returnT >= 0) {
        S.returnT += dt; const rt = S.returnT;
        this.curtain.style.opacity = (U.smooth(0, 0.9, rt) * (1 - U.smooth(1.6, 2.6, rt))).toFixed(3);
        if (rt >= 1 && !S.returned) {
          S.returned = true;
          const bd = S.carrying;
          if (bd) { bd.taken = false; bd.mesh.visible = true; bd.mesh.position.copy(bd.home); S.carrying = null; this.carried.visible = false; }
          w.pos.set(S.checkpoint.x, 0, S.checkpoint.z); w.yaw = S.checkpoint.yaw || 0; w.pitch = 0; w.vel.set(0, 0, 0); w.y = H(w.pos.x, w.pos.z);
          this.watch.forEach(P => { P.sus = 0; if (P.rim) return; if (P.route.length === 1) { P.state = 'post'; P.pos.set(P.route[0][0], P.pos.y, P.route[0][1]); } else P.state = 'back'; });
          w.step('The torchlight found you. The night took you back, and the food waits where you found it. Watch the cones, then go again');
        }
        if (rt >= 2.6) { S.returnT = -1; S.returned = false; w.enabled = true; this.curtain.style.opacity = 0; }
      }

      /* ---------- pebble, noise rings ---------- */
      S.pebbleT = Math.max(0, S.pebbleT - dt);
      if (this.handPeb.visible) { this.handT += dt; const k = this.handT / 0.25; this.handPeb.position.set(0.3 - k * 0.1, -0.35 + k * 0.25, -0.6 - k * 0.3); if (k > 1) this.handPeb.visible = false; }
      if (this.pebble) {
        const q = this.pebble; q.t += dt; q.v.y -= 22 * dt; q.p.addScaledVector(q.v, dt); this.peb.position.copy(q.p); this.peb.rotation.x += dt * 9;
        const gy = H(q.p.x, q.p.z);
        if (q.p.y <= gy + 0.04 || this.occ.at(q.p.x, q.p.z, q.p.y) || q.t > 3) {
          this.pebble = null; this.peb.position.y = Math.max(q.p.y, gy + 0.04);
          const sp = w.spatial(q.p, 10);
          SND.knock(b, { f: U.rnd(320, 420), gain: 0.16 * sp.gain + 0.02, click: 3800, pan: sp.pan }); SND.knock(b, { f: 520, gain: 0.06 * sp.gain + 0.01, click: 4400, pan: sp.pan });
          this.ring(q.p.x, q.p.z, 11); this.alarm(q.p.x, q.p.z, 11);
          setTimeout(() => { if (this.peb) this.peb.visible = false; }, 3000);
        }
      }
      for (const r of this.rings) {
        if (r.t >= 1) { r.m.material.opacity = 0; continue; }
        r.t = Math.min(1, r.t + dt * 1.4);
        placeDecal(r.m, r.x, r.z, Math.max(0.3, r.r * U.easeOut(r.t)), 0.1); r.m.material.opacity = 0.5 * (1 - r.t);
      }

      /* ---------- HUD: the light gem and the radar ---------- */
      if (S.phase !== 'film') {
        S.hidden = U.damp(S.hidden, lightOnMe, 8, dt);
        const g = this.gem.firstChild, lab = this.gem.lastChild;
        const k = S.hidden;
        g.style.background = k > 0.8 ? '#ffb45a' : k > 0.4 ? '#9aa6d8' : '#28304a';
        g.style.boxShadow = k > 0.8 ? '0 0 18px 4px rgba(255,150,60,.75)' : k > 0.4 ? '0 0 10px 2px rgba(150,170,230,.45)' : '0 0 0 1px rgba(242,233,214,.35)';
        lab.textContent = k > 0.8 ? 'in torchlight' : k > 0.4 ? 'in moonlight' : crouch ? 'hidden · low' : 'in shadow';
        this.drawRadar();
      }

      /* ---------- the goal: the current bundle or shelter ---------- */
      if (S.phase === 'play') {
        let goal = null;
        if (S.carrying) { const hs = SHELTERS.filter(h => h.part === S.part && !h.fed).sort((a, c) => Math.hypot(a.x - w.pos.x, a.z - w.pos.z) - Math.hypot(c.x - w.pos.x, c.z - w.pos.z)); if (hs[0]) goal = [hs[0].door.x, H(hs[0].door.x, hs[0].door.z) + 1.5, hs[0].door.z]; }
        else { const bs = BUNDLES.filter(q => q.part === S.part && !q.taken).sort((a, c) => Math.hypot(a.x - w.pos.x, a.z - w.pos.z) - Math.hypot(c.x - w.pos.x, c.z - w.pos.z)); if (bs[0]) goal = [bs[0].x, bs[0].home.y + 1.2, bs[0].z]; }
        if (goal && Math.hypot(goal[0] - w.pos.x, goal[2] - w.pos.z) > 7) { if (!this.goalKey || this.goalKey !== goal.join()) { this.goalKey = goal.join(); w.goal(goal); } } else if (this.goalKey) { this.goalKey = null; w.goal(null); }
      }

      /* ---------- soundscape ---------- */
      const ck = this.clocks, live = S.phase === 'play' || S.phase === 'between' || S.phase === 'film';
      ck.hum -= dt;
      if (ck.hum < 0 && live) {
        ck.hum = 2.5 + Math.random() * 3 - S.fed * 0.25;
        const h = U.pick(SHELTERS.concat(this.camp)), sp = w.spatial(new T.Vector3(h.x, 0, h.z), 12);
        if (h.fed) SND.sing(b, U.pick([196, 246.94, 293.66]) * 0.5, { vowel: 'm', dur: U.rnd(2, 3.5), gain: 0.03 * sp.gain + 0.004, pan: sp.pan, voices: 2, attack: 0.5, hold: 0.5 });
        else SND.sing(b, U.rnd(105, 125), { vowel: U.pick(['m', 'u']), dur: U.rnd(1.5, 2.5), gain: 0.018 * sp.gain + 0.002, pan: sp.pan, voices: 1, attack: 0.4, breath: 0.15, vib: 0.002 });
      }
      ck.murmur -= dt;
      if (ck.murmur < 0 && live) { ck.murmur = 5 + Math.random() * 7; const act = this.watch.filter(P => P.active); if (act.length) { const P = U.pick(act), sp = w.spatial(P.pos, 16); SND.sing(b, U.rnd(90, 115), { vowel: U.pick(['a', 'o']), dur: U.rnd(0.4, 0.8), gain: 0.02 * sp.gain + 0.002, pan: sp.pan, attack: 0.05, hold: 0.2 }); } }
      ck.cricket -= dt; if (ck.cricket < 0 && live) { ck.cricket = 0.5 + Math.random() * 1.5; SND.cricket(b, { gain: 0.004 }); }
      ck.gust -= dt; if (ck.gust < 0 && live) { ck.gust = 6 + Math.random() * 7; SND.swell(b, { f0: 180, f1: 600, dur: 3.5, gain: 0.045, pan: U.rnd(-1, 1) }); }
      ck.dog -= dt; if (ck.dog < 0 && live && w.pos.z > 90) { ck.dog = 14 + Math.random() * 12; SND.swell(b, { f0: 500, f1: 700, dur: 0.25, gain: 0.02, pan: U.rnd(-1, 1), q: 4 }); }
      this.wind.set('freq', w.pos.z < 0 ? 340 : 240, 1);

      /* ---------- the end: stillness, then the words left on the document ---------- */
      if (S.phase === 'still' || S.phase === 'reveal') {
        const T0 = S.endT, T1 = (S.endT += dt), at = s => T0 < s && T1 >= s;
        if (at(0.6)) w.finish('Every shelter has food tonight');
        this.wind.set('gain', 0.045 * (1 - U.smooth(1, 5, T1)) + 0.012 * U.smooth(14, 20, T1), 0.4);
        if (at(1)) { this.radar.style.opacity = 0; this.gem.style.opacity = 0; this.btns.forEach(q => { q.style.display = 'none'; }); }
        if (at(6)) {
          S.phase = 'reveal';
          const f = w.forward(), l = Math.hypot(f.x, f.z) || 1;
          this.words.position.set(w.pos.x + f.x / l * 42, w.y + 20, w.pos.z + f.z / l * 42);
          SND.glow(b, 146.83, { gain: 0.05, dur: 12, vowel: 'o' });
        }
        if (at(7.5)) w.say('The Document', 'The sirah reports that the boycott document hung in the Ka‘bah was eaten by termites, all but the words <span class="q">“Bismika Allahumma”</span>, “In Your name, O God.” (Ibn Hisham; a report without a connected chain)', { ar: 'بِاسْمِكَ اللَّهُمَّ', ms: 12500 });
        if (at(9)) SND.glow(b, 220, { gain: 0.045, dur: 11 });
        if (at(12)) SND.glow(b, 293.66, { gain: 0.04, dur: 10 });
        if (at(20.5)) w.say('The Boycott Ends', 'Men of Quraysh worked to end the boycott, among them Hisham ibn ‘Amr and al-Mut‘im ibn ‘Adi, and the clan came out of the ravine. (Ibn Ishaq)', { ms: 11000 });
        if (at(33)) { w.say('The Year of Sorrow', 'Soon after, Abu Talib died, and Khadijah died about three years before the Hijrah (Sahih al-Bukhari 3896). The year of their loss was later called the Year of Sorrow.', { ms: 12000 }); SND.sing(b, 110, { vowel: 'o', dur: 7, gain: 0.03, voices: 3, attack: 2, hold: 0.5 }); }
        this.words.material.opacity = U.smooth(6.5, 10, T1) * (1 - U.smooth(30, 42, T1) * 0.5);
        this.moon.intensity = U.lerp(0.62, 0.85, U.smooth(8, 40, T1));
        if (w._post) w._post.set({ lift: [0.0 + U.smooth(8, 40, T1) * 0.03, 0.008 + U.smooth(8, 40, T1) * 0.02, 0.024] });
      }
    },

    // the watch walks its round, pauses to look, turns to sounds and searches
    walkWatch(P, dt, play) {
      const w = this.w;
      const face = (ta, rate) => { let da = ta - P.a; da = Math.atan2(Math.sin(da), Math.cos(da)); P.a += U.clamp(da, -rate * dt, rate * dt); };
      const goTo = (x, z, sp) => { const dx = x - P.pos.x, dz = z - P.pos.z, d = Math.hypot(dx, dz); if (d < 0.3) return true; const s = Math.min(d, sp * dt); P.pos.x += dx / d * s; P.pos.z += dz / d * s; face(Math.atan2(dx, dz) + Math.sin(w.time * 0.9 + P.k) * 0.25, 2.2); P.moving = true; P.walkPh = (P.walkPh || 0) + s * 3.2; return false; };
      P.moving = false;
      if (P.state === 'post') { P.a = P.base + Math.sin(w.time * 0.32 + P.k) * P.sweep; return; }
      if (P.state === 'walk') { const q = P.route[P.i]; if (goTo(q[0], q[1], 1.05)) { P.state = 'look'; P.t = P.pause; P.base = P.a; } return; }
      if (P.state === 'look') {
        P.t -= dt; P.a = P.base + Math.sin((P.pause - P.t) * 1.3) * 0.8;
        if (P.t <= 0) { if (P.loop) P.i = (P.i + 1) % P.route.length; else { if (P.i + P.dir >= P.route.length || P.i + P.dir < 0) P.dir *= -1; P.i += P.dir; } P.state = 'walk'; }
        return;
      }
      if (P.state === 'turn') { face(Math.atan2(P.heard.x - P.pos.x, P.heard.z - P.pos.z), 3); P.t -= dt; if (P.t <= 0) { P.state = 'search'; P.target = P.heard; SND.sing(this.w.env.bus, 128, { vowel: 'o', dur: 0.6, gain: 0.02, glide: 0.9, attack: 0.05 }); } return; }
      if (P.state === 'search') { const tx = P.target.x, tz = P.target.z; if (goTo(tx, tz, 1.6) || !walkable(P.pos.x, P.pos.z)) { P.state = 'scan'; P.t = 4.5; P.base = P.a; } return; }
      if (P.state === 'scan') { P.t -= dt; P.a = P.base + Math.sin((4.5 - P.t) * 1.5) * 1.3; if (P.t <= 0) { P.state = 'back'; } return; }
      if (P.state === 'back') {
        // return to the nearest point of the round, or the post
        let best = 0, bd = 1e9; P.route.forEach((q, i) => { const d = Math.hypot(q[0] - P.pos.x, q[1] - P.pos.z); if (d < bd) { bd = d; best = i; } });
        const q = P.route[best]; if (goTo(q[0], q[1], 1.2)) { P.i = best; if (P.route.length === 1) { P.state = 'post'; } else P.state = 'walk'; }
        return;
      }
      if (P.state === 'notice') { face(Math.atan2(w.pos.x - P.pos.x, w.pos.z - P.pos.z), 2.4); return; }
    },
    // suspicion: rises while the torch sees you, falls when it does not; a torch that notices stops and turns
    suspect(P, see, dt, env) {
      P.seenNow = see > 0.05;
      if (see > 0.05) { P.sus = Math.min(1.05, P.sus + see * dt * 1.2); P.lastSeen = { x: this.w.pos.x, z: this.w.pos.z }; P.lost = 0; }
      else P.sus = Math.max(0, P.sus - dt * 0.35);
      if (P.rim) return;
      if (P.sus > 0.3 && P.state !== 'notice') { P.prev = P.state; P.state = 'notice'; const sp = this.w.spatial(P.pos, 12); SND.sing(env.bus, U.rnd(140, 160), { vowel: 'a', dur: 0.7, gain: 0.03, glide: 0.85, attack: 0.04, pan: sp.pan }); }
      if (P.state === 'notice' && see <= 0.05) { P.lost = (P.lost || 0) + dt; if (P.lost > 1.2) { P.state = 'search'; P.target = P.lastSeen || { x: P.pos.x, z: P.pos.z }; } }
    },
    drawRadar() {
      const w = this.w, g = this.rctx, R = 140, s = R / 34; // 34 m to the edge
      g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, 280, 280);
      g.save(); g.beginPath(); g.arc(R, R, R - 2, 0, Math.PI * 2); g.clip();
      g.fillStyle = 'rgba(6,10,22,0.72)'; g.fillRect(0, 0, 280, 280);
      g.translate(R, R); g.rotate(w.yaw); // forward is up
      const tx = x => (x - w.pos.x) * s, tz = z => (z - w.pos.z) * s;
      // walls of the ravine
      g.strokeStyle = 'rgba(190,200,230,0.45)'; g.lineWidth = 3;
      for (const side of [-1, 1]) { g.beginPath(); for (let z = w.pos.z - 40; z <= w.pos.z + 40; z += 2) { const x = cx(z) + side * (hw(z) + (side > 0 ? LEDGE(z) * 5 : 0)); z === w.pos.z - 40 ? g.moveTo(tx(x), tz(z)) : g.lineTo(tx(x), tz(z)); } g.stroke(); }
      // houses and cover
      g.fillStyle = 'rgba(150,160,190,0.35)';
      for (const bx of w.boxes) { if (Math.abs(bx[0] - w.pos.x) > 45 || Math.abs(bx[1] - w.pos.z) > 45) continue; g.fillRect(tx(bx[0]), tz(bx[1]), (bx[2] - bx[0]) * s, (bx[3] - bx[1]) * s); }
      for (const [x, z, sc] of this.cover) { if (Math.abs(x - w.pos.x) > 40 || Math.abs(z - w.pos.z) > 40) continue; g.beginPath(); g.arc(tx(x), tz(z), sc * 1.2 * s, 0, 6.3); g.fill(); }
      // the goal
      const goal = w._goal; if (goal) { g.fillStyle = '#ffcf7a'; g.beginPath(); const gx = U.clamp(tx(goal.x), -R + 8, R - 8), gz = U.clamp(tz(goal.z), -R + 8, R - 8); g.arc(gx, gz, 6, 0, 6.3); g.fill(); }
      // the watch: cones and torches
      for (const P of this.watch) {
        if (!P.active) continue;
        const k = U.clamp(P.sus), c = k > 0.3 ? `rgba(255,${90 - k * 60 | 0},40,` : 'rgba(255,150,70,';
        if (!P.rim) { g.fillStyle = c + '0.28)'; g.beginPath(); g.moveTo(tx(P.pos.x), tz(P.pos.z)); for (let i = 0; i <= 10; i++) { const a = P.a + (i / 10 - 0.5) * 2 * P.half; g.lineTo(tx(P.pos.x + Math.sin(a) * P.R), tz(P.pos.z + Math.cos(a) * P.R)); } g.fill(); }
        else { g.fillStyle = c + '0.3)'; g.beginPath(); g.arc(tx(P.tgt.x), tz(P.tgt.z), 4 * s, 0, 6.3); g.fill(); }
        g.fillStyle = c + '1)'; g.beginPath(); g.arc(tx(P.pos.x), tz(P.pos.z), 5, 0, 6.3); g.fill();
      }
      g.restore();
      // you, at the centre
      g.fillStyle = '#f2e9d6'; g.beginPath(); g.moveTo(R, R - 9); g.lineTo(R - 6, R + 6); g.lineTo(R + 6, R + 6); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(242,233,214,0.3)'; g.lineWidth = 2; g.beginPath(); g.arc(R, R, R - 3, 0, 6.3); g.stroke();
    },
    onKey(env, e) {
      if (!this.w || !this.S) return;
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (this.w.cine) return;
      if (k === 'c' && !e.repeat) this.toggleCrouch(env);
      if (k === 'q' && !e.repeat) this.throwPebble(env);
    },
  }));
})();
