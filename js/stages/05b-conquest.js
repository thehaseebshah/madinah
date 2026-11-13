/* Station — The Return to Makkah (Fath Makkah), Ramadan 8 AH / 630 CE.
   Genre: first-person aiming, on rails (shooting gallery / Duck Hunt / Doom feel).
   A clear morning in the valley of Makkah. Banners and dust stand on the heights; doors are shut
   in the lanes. Around the Ka'bah, on the roofs and across the valley stand idols: plain, weathered
   standing stones on low plinths (no carved faces, no figures). The rail carries you round the House,
   up onto the ring of roofs, and onto the slope of Abu Qubays. Aim, and strike: the staff in view
   sends a line of light, the stone rocks, topples and falls to dust with a low sung note.
   Part 1: around the House (still stones, learn to aim). Part 2: the roofs (stones behind cloth
   awnings that the wind lifts — strike while they show, and high ledges). Part 3: the valley seen
   from the slope (stones revealed as the dust clears, a few at a time, far and small).
   Then near-silence, "Truth has come and falsehood has vanished" (Qur'an 17:81; Sahih al-Bukhari
   4287), a sung call from the roof of the House in a column of light. No person is ever shown.
   Feeling: release, and mercy after victory. Colour script: clear morning blue and sand; gold kept
   for the light of the staff, the next stone and the column on the roof. */
(function () {
  'use strict';
  if (!window.WORLD) return;
  const T = THREE;
  const KW = 11, KD = 12.5, KH = 9;

  /* ---------------- the valley ---------------- */
  function H(x, z) {
    const r = Math.hypot(x, z), de = Math.hypot(x * 0.92, z * 0.6);
    let y = 0.3 + SCAPE.fbm(x * 0.02, z * 0.02, 3) * 0.7;
    y += Math.max(0, -z - 140) * 0.05;                     // the valley climbs gently north, toward upper Makkah
    const a = Math.atan2(x, -z);                            // 0 = north
    const gap = 1 - 0.8 * Math.exp(-Math.pow(a / 0.32, 2)) - 0.65 * Math.exp(-Math.pow((Math.abs(a) - Math.PI) / 0.38, 2));
    y += U.smooth(140, 430, de) * (60 + SCAPE.ridge(x * 0.0055, z * 0.0055, 5) * 170) * gap;
    y += 128 * Math.exp(-((x - 270) * (x - 270) / (2 * 105 * 105) + (z + 20) * (z + 20) / (2 * 150 * 150)));   // Abu Qubays, east
    y += 112 * Math.exp(-((x + 300) * (x + 300) / (2 * 115 * 115) + (z + 60) * (z + 60) / (2 * 210 * 210)));  // Qu'ayqi'an, west
    y += SCAPE.ridge(x * 0.03, z * 0.03, 3) * 6 * U.smooth(60, 160, r);
    return U.lerp(0.3 + SCAPE.fbm(x * 0.05, z * 0.05, 2) * 0.12, y, U.smooth(28, 70, r));
  }

  /* ---------------- helpers ---------------- */
  const PV = `attribute float aSize; attribute float aAlpha; varying float vA; uniform float uScale;
    void main(){ vA = aAlpha; vec4 mv = modelViewMatrix * vec4(position,1.); gl_PointSize = aSize * uScale / -mv.z; gl_Position = projectionMatrix * mv; }`;
  const PF = `uniform sampler2D tMap; uniform vec3 uColor; varying float vA;
    void main(){ vec4 t = texture2D(tMap, gl_PointCoord); gl_FragColor = vec4(uColor, t.a * vA); if (gl_FragColor.a < 0.004) discard; }`;
  function sprites(w, n, color, additive) {
    const geo = new T.BufferGeometry(), P = new Float32Array(n * 3), S = new Float32Array(n), A = new Float32Array(n);
    geo.setAttribute('position', new T.BufferAttribute(P, 3)); geo.setAttribute('aSize', new T.BufferAttribute(S, 1)); geo.setAttribute('aAlpha', new T.BufferAttribute(A, 1));
    const mat = new T.ShaderMaterial({ vertexShader: PV, fragmentShader: PF, transparent: true, depthWrite: false, blending: additive ? T.AdditiveBlending : T.NormalBlending,
      uniforms: { tMap: { value: SCAPE.tex.soft(w) }, uColor: { value: new T.Color(color) }, uScale: { value: w.env.h * 0.9 } } });
    const pts = new T.Points(geo, mat); pts.frustumCulled = false; pts.userData.dynamic = true; w.scene.add(pts);
    return { pts, P, S, A, geo, n, upd() { geo.attributes.position.needsUpdate = geo.attributes.aSize.needsUpdate = geo.attributes.aAlpha.needsUpdate = true; } };
  }
  function burstPool(w, n, color, additive) {
    const sp = sprites(w, n, color, additive), V = new Float32Array(n * 3), L = new Float32Array(n), L0 = new Float32Array(n), S0 = new Float32Array(n), A0 = new Float32Array(n);
    let k = 0;
    return {
      emit(x, y, z, vx, vy, vz, life, size, alpha) { const i = k++ % n; sp.P.set([x, y, z], i * 3); V.set([vx, vy, vz], i * 3); L[i] = L0[i] = life; S0[i] = size; A0[i] = alpha; },
      step(dt, drag, grav) {
        for (let i = 0; i < n; i++) {
          if (L[i] <= 0) { sp.A[i] = 0; continue; }
          L[i] -= dt; const t = 1 - Math.max(0, L[i]) / L0[i], f = 1 - drag * dt;
          V[i * 3] *= f; V[i * 3 + 1] = V[i * 3 + 1] * f - grav * dt; V[i * 3 + 2] *= f;
          sp.P[i * 3] += V[i * 3] * dt; sp.P[i * 3 + 1] += V[i * 3 + 1] * dt; sp.P[i * 3 + 2] += V[i * 3 + 2] * dt;
          sp.S[i] = S0[i] * (0.5 + t * 1.5); sp.A[i] = A0[i] * Math.sin(Math.PI * Math.pow(t, 0.45));
        }
        sp.upd();
      },
    };
  }
  // instanced scatters get a real bounding sphere, so the camera can skip the ones out of view
  function cullable(w, res, list) {
    const fix = () => res.meshes.forEach(m => {
      if (!m.isInstancedMesh || !m.count) return;
      const m4 = new T.Matrix4(), p = new T.Vector3(), c = new T.Vector3(); let n = m.count, sMax = 0;
      for (let i = 0; i < n; i++) { m.getMatrixAt(i, m4); c.add(p.setFromMatrixPosition(m4)); }
      c.divideScalar(n); let r = 0;
      for (let i = 0; i < n; i++) { m.getMatrixAt(i, m4); r = Math.max(r, p.setFromMatrixPosition(m4).distanceTo(c)); sMax = Math.max(sMax, m4.getMaxScaleOnAxis()); }
      if (!m.geometry.boundingSphere) m.geometry.computeBoundingSphere();
      m.geometry = m.geometry.clone(); m.geometry.boundingSphere = new T.Sphere(c, r + (m.geometry.boundingSphere ? m.geometry.boundingSphere.radius : 2) * sMax + 2);
      m.frustumCulled = true; list.push(m);
    });
    if (res.ready) res.ready.then(fix); else fix();
  }
  const rot = (g, q) => g.applyMatrix4(new T.Matrix4().makeRotationFromQuaternion(q));
  function cylBetween(a, b, r0, r1, seg) {
    const d = new T.Vector3().subVectors(b, a), len = d.length();
    const g = new T.CylinderGeometry(r1, r0, len, seg || 7, 1); g.translate(0, len / 2, 0);
    rot(g, new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 1, 0), d.normalize())); g.translate(a.x, a.y, a.z);
    return g;
  }
  // a weathered stone: a box with many segments, pushed about by noise
  function stoneGeo(wd, ht, dp, seed, round) {
    const g = new T.BoxGeometry(wd, ht, dp, 4, 8, 3), p = g.attributes.position, v = new T.Vector3();
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i); const yn = (v.y + ht / 2) / ht;
      const n = SCAPE.fbm(v.x * 1.7 + seed, v.y * 1.3 + v.z * 1.7 - seed, 3);
      const taper = 1 - yn * (round || 0.25);
      v.x *= taper * (1 + n * 0.25); v.z *= taper * (1 + n * 0.25);
      if (yn > 0.85) { const k = (yn - 0.85) / 0.15; v.x *= 1 - k * 0.35; v.z *= 1 - k * 0.35; }
      v.y += n * 0.05 * ht; p.setXYZ(i, v.x, v.y + ht / 2, v.z);
    }
    g.computeVertexNormals(); return g;
  }

  ENGINE.register(WORLD.stage({
    key: 'conquest',
    arabic: 'فَتْحُ مَكَّة',
    title: 'The Return to Makkah',
    era: 'Makkah · Ramadan, 8 AH · 630 CE · the conquest and the pardon',
    hint: 'Move the mouse to aim · click to strike the standing stones · the way goes on when the near stones have fallen',
    hintTouch: 'Drag to aim · tap a standing stone to strike it',
    sound: { reverb: 0.45 },
    story: `<p>Eight years after he left Makkah by night, the Prophet ﷺ set out for it in Ramadan with about ten thousand (Sahih al-Bukhari 4276), and entered it from its upper part, by Kada’ (Sahih al-Bukhari 4290). He declared that whoever entered the house of Abu Sufyan, laid down his arms or shut his door was safe (Sahih Muslim 1780).</p>
            <p>Around the Ka‘bah stood 360 idols. He struck them with a stick in his hand, reciting:</p>
            <p class="q"><span class="ar">جَاءَ الْحَقُّ وَزَهَقَ الْبَاطِلُ ۚ إِنَّ الْبَاطِلَ كَانَ زَهُوقًا</span>“Truth has come and falsehood has vanished; falsehood is bound to vanish.” (Qur’an 17:81; Sahih al-Bukhari 4287)</p>
            <p>Here sixty plain stones stand for them. No figure is shown.</p>`,

    enter(env) {
      const w = this.w = WORLD.create(env, { start: { x: 16, z: 0, yaw: 0 }, exposure: 0.72, far: 4200, near: 0.12, fov: 66,
        fog: { color: 0xd8cbb6, density: 0.0009 } });
      const S = w.scene, Q = w.quality, rnd = U.seeded(630);
      w.renderer.setClearColor(0xc8d4e4);
      S.add(w.camera);

      /* ---------- land ---------- */
      const ter = SCAPE.terrain(w, { size: 2600, seg: Q < 1 ? 280 : 340, height: H, rock: [0.8, 0.93], rockHeight: [40, 110],
        colors: { low: '#ae9878', high: '#a48c6c', rock: '#7a6c62', dark: '#4e443e' }, tex: 'gravel', rockTex: 'granite',
        photo: { ground: 'gravelly_sand', rock: 'rock_face', normal: 1 }, rep: 0.22, rockRep: 0.035 });
      w.ground = ter.ground;
      SCAPE.horizon(w, { haze: '#d8cbb6', layers: [{ r: 1500, h: 120, color: '#8c7c72', seed: 3 }, { r: 2000, h: 170, color: '#a4968c', seed: 8 }, { r: 2700, h: 200, color: '#bcb2a8', seed: 13 }] });

      /* ---------- sky and light: a clear morning ---------- */
      this.sun = new T.DirectionalLight(0xfff0dc, 1.6); this.sun.position.set(60, 50, 30); S.add(this.sun);
      S.add(new T.HemisphereLight(0xcfe0ff, 0xa08868, PHOTO.enabled ? 0.08 : 0.6));
      w.followShadow(this.sun, 55, Q < 1 ? 1024 : 2048);
      if (PHOTO.enabled) PHOTO.sky(w, 'qwantani_morning_puresky', { sun: this.sun, rotation: Math.PI * 0.5, intensity: 0.62, haze: '#d8cbb6', horizon: 0.45, ground: '#b89a78' }).then(o => { this.sunDir = o && o.sunDir; });
      else w.sky({ top: '#3f78c8', mid: '#e4dccb', bot: '#c8b090', sunDir: [0.6, 0.45, 0.2], sun: '#fff0d0', sunSize: 0.0014, clouds: 0.25 });

      /* ---------- materials ---------- */
      const M = this.M = {
        plaster: PHOTO.mat(w, 'clay_plaster', { triplanar: 0.32, color: '#e6d8c2', fallback: KIT.plaster(w, [1, 1], '#d8c8b0') }),
        brick: PHOTO.mat(w, 'clay_block_wall', { triplanar: 0.3, color: '#d8c4a8', fallback: KIT.mudBrick(w, [1, 1]) }),
        stone: PHOTO.mat(w, 'old_stone_wall', { triplanar: 0.3, color: '#cbbcaa', fallback: SCAPE.tex.granite(w) }),
        mud: PHOTO.mat(w, 'brown_mud_dry', { triplanar: 0.35, color: '#d0b896', fallback: SCAPE.tex.mud(w) }),
        wood: PHOTO.mat(w, 'medieval_wood', { triplanar: 0.9, color: '#a08870', fallback: KIT.wood(w, [1, 1]) }),
        door: PHOTO.mat(w, 'old_planks_02', { rep: [1, 1], color: '#9a8068', fallback: KIT.wood(w, [1, 2], '#5a4030') }),
        kstone: PHOTO.mat(w, 'dark_rock', { triplanar: 0.4, color: '#9a9896', fallback: SCAPE.tex.granite(w) }),
        dark: new T.MeshStandardMaterial({ color: 0x1a1410, roughness: 1 }),
        idol: PHOTO.mat(w, 'rock_boulder_dry', { triplanar: 0.6, color: '#c8b8a6', fallback: SCAPE.tex.granite(w) }),
        plinth: PHOTO.mat(w, 'quarry_wall', { triplanar: 0.5, color: '#bcae9c', fallback: SCAPE.tex.granite(w) }),
        cloth: PHOTO.mat(w, 'rough_linen', { rep: [2, 2], color: '#c89a6a', side: T.DoubleSide }),
      };

      /* ---------- the Ka'bah: courses of stone and timber, the raised door on the east ---------- */
      const kab = new T.Group(); S.add(kab);
      let y0 = 0;
      const box = (wd, ht, dp, mat, x, y, z, ry) => { const m = new T.Mesh(new T.BoxGeometry(wd, ht, dp), mat); m.position.set(x, y, z); if (ry) m.rotation.y = ry; m.castShadow = m.receiveShadow = true; return m; };
      kab.add(box(KW + 1.0, 0.5, KD + 1.0, M.plinth, 0, 0.25, 0)); y0 = 0.5;
      while (y0 < KH - 0.2) { const h = Math.min(1.15, KH - y0); kab.add(box(KW, h, KD, M.kstone, 0, y0 + h / 2, 0)); y0 += h; if (y0 < KH - 0.5) { kab.add(box(KW + 0.06, 0.24, KD + 0.06, M.wood, 0, y0 + 0.12, 0)); y0 += 0.24; } }
      kab.add(box(KW + 0.2, 0.35, KD + 0.2, M.kstone, 0, KH + 0.17, 0));
      kab.add(box(0.12, 2.6, 1.7, M.door, KW / 2 + 0.03, 2.1 + 1.3, -1.6)); kab.add(box(0.2, 0.2, 2.0, M.wood, KW / 2 + 0.06, 4.8, -1.6));
      this.kabMesh = kab;
      // the Hijr: a low curved wall on the north side
      const hijr = []; for (let i = 0; i <= 16; i++) { const a = Math.PI * (i / 16); hijr.push([Math.cos(a) * 5.4, -KD / 2 - Math.sin(a) * 8]); }
      for (let i = 0; i < hijr.length - 1; i++) { const [x1, z1] = hijr[i], [x2, z2] = hijr[i + 1]; const m = box(Math.hypot(x2 - x1, z2 - z1) + 0.05, 1.3, 0.9, M.stone, (x1 + x2) / 2, 0.65, (z1 + z2) / 2, -Math.atan2(z2 - z1, x2 - x1)); S.add(m); }
      // Zamzam: a stone well-head with its bucket and jugs
      PHOTO.place(w, 'stone_fire_pit', { pos: [21, 0.3, 9], s: 1.25 });
      const well = new T.Mesh(new T.CircleGeometry(0.75, 20), M.dark); well.rotation.x = -Math.PI / 2; well.position.set(21, 0.42, 9); S.add(well);
      PHOTO.place(w, 'wooden_bowl_01', { pos: [22.6, 0.3, 8.2], s: 1.4 }); PHOTO.place(w, 'jug_01', { pos: [19.8, 0.3, 10.4], s: 1.5 }); PHOTO.place(w, 'ceramic_vase_01', { pos: [20.4, 0.3, 10.9], s: 1.2 });

      /* ---------- houses: a close ring round the courtyard (its roofs are the way in part 2), and the town ---------- */
      const occluders = [kab];
      const houses = new T.Group(); S.add(houses);
      const house = (x, z, ry, wd, dp, ht, kind) => {
        const g = new T.Group(); g.position.set(x, H(x, z) - 0.25, z); g.rotation.y = ry; houses.add(g);
        const wm = kind === 0 ? M.plaster : kind === 1 ? M.brick : kind === 2 ? M.stone : M.mud;
        g.add(box(wd, ht, dp, wm, 0, ht / 2, 0));
        // parapet with gaps, roof beams through the wall, a door, small windows, a step
        const ph = 0.55, pt = 0.22;
        g.add(box(wd, ph, pt, wm, 0, ht + ph / 2, dp / 2 - pt / 2)); g.add(box(wd, ph, pt, wm, 0, ht + ph / 2, -dp / 2 + pt / 2));
        g.add(box(pt, ph, dp, wm, wd / 2 - pt / 2, ht + ph / 2, 0)); g.add(box(pt, ph, dp, wm, -wd / 2 + pt / 2, ht + ph / 2, 0));
        for (let bx = -wd / 2 + 0.6; bx < wd / 2 - 0.3; bx += 0.75 + rnd() * 0.3) { const b = new T.Mesh(new T.CylinderGeometry(0.075, 0.09, dp + 0.7, 6), M.wood); b.rotation.x = Math.PI / 2; b.position.set(bx, ht - 0.3, 0); b.castShadow = true; g.add(b); }
        g.add(box(1.0, 1.95, 0.12, M.door, (rnd() - 0.5) * (wd - 2.4), 0.98 + 0.25, dp / 2 + 0.03));
        g.add(box(1.3, 0.14, 0.18, M.wood, 0, 2.3, dp / 2 + 0.06));
        for (let k = 0; k < 2; k++) g.add(box(0.5, 0.6, 0.06, M.dark, (k ? 1 : -1) * wd * 0.3, ht * 0.68, dp / 2 + 0.01));
        g.add(box(1.6, 0.25, 0.6, M.stone, 0, 0.12, dp / 2 + 0.3));
        if (rnd() < 0.35) g.add(box(wd * 0.45, 2.2, dp * 0.4, wm, wd * 0.2, ht + 1.1, -dp * 0.2));   // an upper room
        return g;
      };
      // the ring, broken by lanes
      this.ring = [];
      const lanes = [0.1, 1.25, 2.4, 3.55, 4.7, 5.6];
      for (let a = 0; a < Math.PI * 2; ) {
        const len = 8 + rnd() * 3, da = len / 44;
        const inLane = lanes.some(l => Math.abs(((a + da / 2 - l + Math.PI * 3) % (Math.PI * 2)) - Math.PI) < 0.07);
        if (!inLane) {
          const am = a + da / 2, x = Math.cos(am) * 44, z = -Math.sin(am) * 44, ht = 5.6 + rnd() * 0.9;
          house(x, z, am + Math.PI / 2, len - 0.2, 9, ht, (rnd() * 4) | 0); this.ring.push({ a0: a, a1: a + da, top: H(x, z) - 0.25 + ht });
        }
        a += da + (inLane ? 0.08 : 0);
      }
      // life on the roofs of the ring: baskets, jars, bowls, mats of palm fibre
      const roofPts = k => this.ring.flatMap((R, i) => { const out = []; for (let j = 0; j < k; j++) { const a = U.lerp(R.a0, R.a1, rnd()), r = rnd() < 0.5 ? 40.6 + rnd() * 2 : 45.4 + rnd() * 2.4; out.push([Math.cos(a) * r, -Math.sin(a) * r, 0.9 + rnd() * 0.5, R.top]); } return out; });
      [['wicker_basket_01', 1, 1.2], ['ceramic_vase_01', 1, 1.3], ['jug_01', 1, 1.5], ['wooden_bowl_01', 1, 1.6]].forEach(([id, k, s0], q) => {
        const pts = roofPts(k).filter((_, i) => (i + q) % 2 === 0);
        const r0 = SCAPE.scatter(w, { kind: 'model', model: id, points: pts.map(p => [p[0], p[1], p[2] * s0]), seed: 80 + q, ground: (x, z) => { let best = 0, bd = 1e9; pts.forEach(p => { const d = Math.hypot(p[0] - x, p[1] - z); if (d < bd) { bd = d; best = p[3]; } }); return best; } });
      });
      // a few houses closer in, and an outer town, with lanes between
      this.idolSites = [];
      for (let i = 0; i < 70; i++) {
        const a = rnd() * Math.PI * 2, d = 58 + rnd() * 70, x = Math.cos(a) * d, z = -Math.sin(a) * d;
        if (lanes.some(l => Math.abs(((a - l + Math.PI * 3) % (Math.PI * 2)) - Math.PI) < 0.05)) continue;
        const wd = 7 + rnd() * 4, dp = 7 + rnd() * 4, ht = 4.5 + rnd() * 3.5, ry = a + Math.PI / 2 + (rnd() - 0.5) * 0.3;
        house(x, z, ry, wd, dp, ht, (rnd() * 4) | 0);
        this.idolSites.push({ x, z, y: H(x, z) - 0.25 + ht, d });
      }
      // a lane of shut doors on the way in from the north (the film passes through it)
      this.doors = [];
      for (let i = 0; i < 12; i++) {
        const side = i % 2 ? 1 : -1, z = -146 - Math.floor(i / 2) * 9.2, x = side * 6.4;
        house(x + side * 3.5, z, side > 0 ? -Math.PI / 2 : Math.PI / 2, 8.5, 7, 5.5 + (i % 3) * 0.6, i % 4);
        const pivot = new T.Group(); pivot.position.set(x - side * 0.52, H(x, z) + 0.25, z - 0.55); pivot.userData.dynamic = true; S.add(pivot);
        const d = box(1.05, 1.95, 0.1, M.door, 0, 0.98, 0.52); d.rotation.y = 0; pivot.add(d); d.position.set(0, 0.98, 0.52);
        pivot.rotation.y = side > 0 ? 0 : Math.PI; pivot.userData.open = side > 0 ? -1.3 : Math.PI + 1.3; pivot.userData.shut = pivot.rotation.y; pivot.rotation.y = pivot.userData.open;
        this.doors.push(pivot);
      }
      occluders.push(houses);
      this.occluders = occluders;
      // the town beyond, in instanced mud and plaster
      const town = SCAPE.scatter(w, { kind: 'house', n: 260, area: { x: 0, z: -40, r: 420 }, scale: [7, 11], seed: 61, density: (x, z) => H(x, z) < 16 ? 1 : H(x, z) < 30 ? 0.12 : 0,
        avoid: (x, z) => { const r = Math.hypot(x, z); return r < 135 || (Math.abs(x) < 12 && z < -100); } });
      town.meshes.forEach(m => { m.material = PHOTO.mat(w, 'clay_plaster', { triplanar: 0.22, fallback: m.material.map, color: '#dccab2' }); });
      this.town = town.list;

      /* ---------- the scattered life of the valley ---------- */
      // scatters are laid in tiles, so tiles out of view or far away are skipped
      this.cullList = [];
      const sc = o => {
        const A = o.area, R = A.r, tiles = R > 300 ? 4 : 2, sz = R * 2 / tiles;
        for (let a = 0; a < tiles; a++) for (let c = 0; c < tiles; c++) {
          const x0 = A.x - R + a * sz, z0 = A.z - R + c * sz, d0 = o.density;
          const r = SCAPE.scatter(w, Object.assign({}, o, { area: [x0, z0, x0 + sz, z0 + sz], n: Math.max(1, Math.round(o.n / (tiles * tiles) * 1.27)), seed: o.seed * 17 + a * 5 + c,
            density: (x, z) => (Math.hypot(x - A.x, z - A.z) > R ? 0 : 1) * (d0 ? d0(x, z) : 1) }));
          cullable(w, r, this.cullList);
        }
      };
      const notTown = (x, z) => Math.hypot(x, z) < 52;
      sc({ kind: 'model', model: 'namaqualand_boulder_02', fallback: 'boulder', n: 150, area: { x: 0, z: 0, r: 700 }, scale: [1, 3], seed: 62, density: (x, z) => U.smooth(18, 50, H(x, z)) });
      sc({ kind: 'model', model: 'namaqualand_boulder_04', fallback: 'boulder', n: 110, area: { x: 0, z: 0, r: 700 }, scale: [1, 2.6], seed: 63, density: (x, z) => U.smooth(12, 40, H(x, z)) });
      sc({ kind: 'model', model: 'rock_07', fallback: 'rock', n: 150, area: { x: 0, z: 0, r: 500 }, scale: [0.6, 1.8], seed: 64, avoid: notTown });
      sc({ kind: 'model', model: 'namaqualand_rocks_01', fallback: 'rock', fallbackScale: 0.4, n: 420, area: { x: 0, z: 0, r: 400 }, scale: [0.6, 1.4], seed: 65, avoid: notTown });
      sc({ kind: 'model', model: 'namaqualand_stones_01', fallback: 'pebble', fallbackScale: 0.6, n: 1100, area: { x: 0, z: 0, r: 160 }, scale: [0.6, 1.4], seed: 66, castShadow: false, avoid: (x, z) => Math.hypot(x, z) < 9.5 });
      sc({ kind: 'model', model: 'shrub_03', fallback: 'shrub', n: 200, area: { x: 0, z: 0, r: 520 }, scale: [0.6, 1.3], seed: 67, avoid: notTown });
      sc({ kind: 'model', model: 'dry_branches_medium_01', fallback: 'thorn', n: 70, area: { x: 0, z: 0, r: 500 }, scale: [0.8, 1.3], seed: 68, avoid: notTown });
      sc({ kind: 'boulder', n: 380, area: { x: 0, z: 0, r: 1200 }, scale: [3, 14], seed: 70, tex: 'granite', color: '#b0a294', density: (x, z) => U.smooth(25, 80, H(x, z)) });
      sc({ kind: 'rock', n: 600, area: { x: 0, z: 0, r: 700 }, scale: [0.3, 1.3], seed: 71, avoid: notTown });
      sc({ kind: 'thorn', n: 260, area: { x: 0, z: 0, r: 650 }, scale: [0.7, 1.3], seed: 72, avoid: notTown });
      sc({ kind: 'grass', n: 1200, area: { x: 0, z: 0, r: 500 }, scale: [0.4, 0.8], seed: 73, avoid: notTown });
      sc({ kind: 'acacia', n: 60, area: { x: 0, z: 0, r: 700 }, scale: [0.9, 1.4], seed: 74, avoid: (x, z) => Math.hypot(x, z) < 140 });
      sc({ kind: 'palm', n: 30, area: [-200, 120, 200, 380], scale: [7, 12], seed: 75 });
      SCAPE.birds(w, { n: 14, x: 0, z: 0, y: 70, r: 90, color: 0x3a3430 });
      SCAPE.smoke(w, { sources: [[80, H(80, 60) + 6, 60], [-90, H(-90, -40) + 6, -40], [40, H(40, -110) + 6, -110], [-60, H(-60, 100) + 6, 100]], n: 18, height: 18, size: 3, opacity: 0.14 });
      SCAPE.motes(w, { n: 50, area: [-30, 0.5, -30, 30, 6, 30], color: '#fff2d8', size: 0.18, additive: true, opacity: 0.5 });

      /* ---------- banners and dust on the heights: the army that has come in ---------- */
      this.banners = []; const clothPos = [], clothCol = [], clothIdx = [], SX = 8, SY = 3, poleList = [];
      const cols = [[0.92, 0.9, 0.84], [0.18, 0.16, 0.15], [0.88, 0.86, 0.8], [0.6, 0.46, 0.3]];
      const bsites = [];
      [[-0.3, 0], [Math.PI * 0.5, 1], [Math.PI, 2], [Math.PI * 1.5 - 0.35, 3], [0.15, 0]].forEach(([a0, gi], ri) => {
        for (let k = 0; k < 6; k++) {
          const a = a0 + (k - 2.5) * 0.07, want = 22 + (k % 3) * 9;
          let d = 130; while (d < 520 && H(Math.sin(a) * d, -Math.cos(a) * d) < want) d += 3;
          if (ri === 4) d = 520 + k * 40;
          const x = Math.sin(a) * d, z = -Math.cos(a) * d; bsites.push({ x, z, y: H(x, z), gi });
        }
      });
      bsites.forEach((s0, bi) => {
        const ph = 13 + rnd() * 4; poleList.push(new T.Vector3(s0.x, s0.y, s0.z));
        const pole = new T.Mesh(new T.CylinderGeometry(0.16, 0.22, ph, 6), M.wood); pole.position.set(s0.x, s0.y + ph / 2 - 0.3, s0.z); pole.castShadow = true; S.add(pole);
        const col = cols[(bi + s0.gi) % cols.length], base = clothPos.length / 3, bw = 6, bh = 3.8, top = s0.y + ph - 0.6, yaw = Math.atan2(s0.x, s0.z);
        for (let j = 0; j <= SY; j++) for (let i = 0; i <= SX; i++) { clothPos.push(s0.x + Math.cos(yaw) * i / SX * bw, top - j / SY * bh, s0.z - Math.sin(yaw) * i / SX * bw); clothCol.push(...col); }
        for (let j = 0; j < SY; j++) for (let i = 0; i < SX; i++) { const a = base + j * (SX + 1) + i, b = a + 1, c = a + SX + 1, d = c + 1; clothIdx.push(a, c, b, b, c, d); }
        this.banners.push({ base, yaw, bw, ph: rnd() * 6 });
      });
      const cg = new T.BufferGeometry(); cg.setAttribute('position', new T.Float32BufferAttribute(clothPos, 3)); cg.setAttribute('color', new T.Float32BufferAttribute(clothCol, 3)); cg.setIndex(clothIdx); cg.computeVertexNormals();
      this.cloth = new T.Mesh(cg, new T.MeshStandardMaterial({ vertexColors: true, side: T.DoubleSide, roughness: 1 })); this.cloth.userData.dynamic = true; this.cloth.frustumCulled = false; this.cloth.castShadow = true; S.add(this.cloth);
      this.clothBase = cg.attributes.position.array.slice();
      this.plumes = sprites(w, 40, '#d6c2a4', false);
      for (let i = 0; i < 40; i++) { const s0 = bsites[i % bsites.length]; this.plumes.P.set([s0.x + (rnd() - 0.5) * 40, s0.y + 4 + rnd() * 14, s0.z + (rnd() - 0.5) * 40], i * 3); this.plumes.S[i] = 30 + rnd() * 30; this.plumes.A[i] = 0.25; }
      this.plumes.upd(); this.plumeBase = this.plumes.P.slice();

      /* ---------- the idols: plain standing stones on low plinths ---------- */
      const shapes = [stoneGeo(0.55, 2.3, 0.5, 1, 0.3), stoneGeo(0.9, 1.4, 0.8, 7, 0.45), stoneGeo(1.0, 1.9, 0.32, 13, 0.15)];
      const plinthG = stoneGeo(1.25, 0.4, 1.25, 4, 0.05);
      const ID = this.idols = [];
      const addIdol = (x, z, y, phase, o) => ID.push(Object.assign({ x, z, y: y == null ? H(x, z) : y, phase, shape: ID.length % 3, ry: rnd() * 6.28, s: 0.9 + rnd() * 0.3, alive: true, t: 0, reveal: 1 }, o || {}));
      // part 1: round the House, in the courtyard (the rail runs at radius 16)
      [[0.25, 23], [0.55, 10.5], [0.9, 24], [1.25, 21], [1.55, 9.8], [1.9, 25], [2.3, 20], [2.65, 11], [3.0, 24], [3.4, 21], [3.75, 10.2], [4.15, 25], [4.55, 20.5], [4.9, 11.5], [5.3, 23.5], [5.75, 21]]
        .forEach(([a, r]) => { const x = Math.cos(a) * r, z = -Math.sin(a) * r; addIdol(x, z, null, 0, { a }); });
      // part 2: on roofs out in the town, on high ledges, and behind cloth awnings the wind lifts
      const roofIdx = this.idolSites.map((s0, i) => i).filter(i => this.idolSites[i].d < 110).slice(0, 11);
      roofIdx.forEach((i, k) => { const s0 = this.idolSites[i]; addIdol(s0.x, s0.z, s0.y + 0.55, 1, { awning: k % 2 === 0 }); });
      [[180, -60], [200, 30], [-230, -10], [-210, -110], [150, 110]].forEach(([x, z]) => addIdol(x, z, null, 1, { s: 1.5 }));
      // part 3: across the valley, revealed a few at a time as the dust clears
      const far = this.town.filter(it => { const a = Math.atan2(it.z + 10, it.x - 112), da = Math.abs(((a - Math.PI) + Math.PI * 3) % (Math.PI * 2) - Math.PI); return it.x < 70 && da < 0.95 && Math.hypot(it.x - 112, it.z + 10) > 90 && Math.hypot(it.x - 112, it.z + 10) < 330; }).sort((a, b) => Math.atan2(a.z + 10, a.x - 112) - Math.atan2(b.z + 10, b.x - 112));
      for (let k = 0; k < 28; k++) { const it = far[Math.floor((k + 0.5) / 28 * far.length)]; if (!it) break; addIdol(it.x, it.z, it.y + it.sy - 0.05, 2, { group: Math.floor(k / 4), reveal: 0, s: 2.0 }); }
      this.count = [0, 1, 2].map(p => ID.filter(o => o.phase === p).length);
      this.idolMesh = shapes.map((g, k) => { const m = new T.InstancedMesh(g, M.idol, ID.length); m.castShadow = m.receiveShadow = true; m.frustumCulled = false; m.userData.dynamic = true; m.instanceMatrix.setUsage(T.DynamicDrawUsage); S.add(m); return m; });
      this.plinth = new T.InstancedMesh(plinthG, M.plinth, ID.length); this.plinth.castShadow = this.plinth.receiveShadow = true; this.plinth.frustumCulled = false; this.plinth.userData.dynamic = true; S.add(this.plinth);
      const m4 = new T.Matrix4(), q = new T.Quaternion(), e = new T.Euler(), zero = new T.Matrix4().makeScale(0, 0, 0);
      ID.forEach((o, i) => {
        o.h = [2.3, 1.4, 1.9][o.shape] * o.s; o.r = [0.4, 0.55, 0.55][o.shape] * o.s;
        m4.compose(new T.Vector3(o.x, o.y, o.z), q.setFromEuler(e.set(0, o.ry, 0)), new T.Vector3(o.s, o.s, o.s)); this.plinth.setMatrixAt(i, m4);
        o.y += 0.38 * o.s;
        this.idolMesh.forEach((m, k) => m.setMatrixAt(i, k === o.shape ? m4.compose(new T.Vector3(o.x, o.y, o.z), q, new T.Vector3(o.s, o.s, o.s)) : zero));
      });
      this.idolMesh.forEach(m => { m.instanceMatrix.needsUpdate = true; });
      // awnings: a cloth on two poles in front of a roof idol, lifted by the wind now and then
      this.awnings = [];
      ID.filter(o => o.awning).forEach((o, k) => {
        const toK = Math.atan2(-o.x, -o.z), g = new T.Group(); g.position.set(o.x - Math.sin(toK) * -1.1, o.y - 0.38 * o.s, o.z - Math.cos(toK) * -1.1); g.rotation.y = toK; g.userData.dynamic = true; S.add(g);
        [-1.3, 1.3].forEach(px => { const p = new T.Mesh(new T.CylinderGeometry(0.04, 0.05, 3.0, 5), M.wood); p.position.set(px, 1.5, 0); g.add(p); });
        const hinge = new T.Group(); hinge.position.set(0, 2.9, 0); g.add(hinge);
        const c = new T.Mesh(new T.PlaneGeometry(2.8, 2.7, 4, 4), M.cloth); c.position.set(0, -1.35, 0); c.castShadow = true; hinge.add(c);
        o.hinge = hinge; o.ph = k * 2.1; o.reveal = 0; this.awnings.push(o);
      });
      this.dustClouds = sprites(w, 7 * 10, '#d8c6aa', false);
      ID.filter(o => o.phase === 2).forEach((o, k) => { for (let j = 0; j < 2; j++) { const i = (k * 2 + j) % 70; this.dustClouds.P.set([o.x + (j - 0.5) * 6, o.y + 1.5, o.z + (j - 0.5) * 4], i * 3); this.dustClouds.S[i] = 22; this.dustClouds.A[i] = 0; } });
      this.dustClouds.upd();
      // a soft gold glint marks stones that are ready to fall
      this.glints = sprites(w, ID.length, '#ffd27a', true);

      /* ---------- the staff in view, and the line of light it sends ---------- */
      const staff = this.staff = new T.Group(); staff.userData.dynamic = true; w.camera.add(staff);
      const sg = cylBetween(new T.Vector3(0, -0.9, 0), new T.Vector3(0, 0.75, 0), 0.026, 0.018, 8);
      const sm = new T.Mesh(sg, M.wood); staff.add(sm);
      const tip = KIT.glow(w, 0xffd890, 0.22, 0.7); tip.position.y = 0.77; staff.add(tip); this.tip = tip;
      staff.position.set(0.34, -0.42, -0.62); staff.rotation.set(-0.95, 0.12, -0.32); staff.visible = false;
      this.staffBase = { p: staff.position.clone(), r: staff.rotation.clone() };
      const beamG = new T.CylinderGeometry(1, 1, 1, 6, 1, true); beamG.translate(0, 0.5, 0); beamG.rotateX(Math.PI / 2);
      this.beam = new T.Mesh(beamG, new T.MeshBasicMaterial({ color: 0xffd890, transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false, fog: false }));
      this.beam.userData.dynamic = true; this.beam.frustumCulled = false; S.add(this.beam);
      this.dust = burstPool(w, 220, '#cdb898', false); this.sparks = burstPool(w, 90, '#ffe2a0', true);
      // the column of light on the roof of the House, at the end
      const colG = new T.CylinderGeometry(2.2, 3.4, 140, 24, 1, true); colG.translate(0, 70 + KH, 0);
      this.column = new T.Mesh(colG, new T.MeshBasicMaterial({ color: 0xffe2a8, transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide, fog: false }));
      this.column.userData.dynamic = true; S.add(this.column);
      this.roofGlow = KIT.glow(w, 0xfff0c8, 16, 0); this.roofGlow.position.set(0, KH + 1, 0); S.add(this.roofGlow);

      /* ---------- the rails: round the House, up onto the roofs, and onto the slope ---------- */
      const A0 = -0.35, circ = []; for (let i = 0; i <= 48; i++) { const a = A0 + i / 48 * Math.PI * 2; circ.push(new T.Vector3(Math.cos(a) * 16, 1.62 + 0.3, -Math.sin(a) * 16)); }
      this.rail = [new T.CatmullRomCurve3(circ)];
      const ae = A0 + 0.12, roofT = this.ring.length ? this.ring.reduce((a, r) => a + r.top, 0) / this.ring.length : 6.2;
      this.roofY = roofT;
      const p2 = [new T.Vector3(Math.cos(ae) * 16, 1.92, -Math.sin(ae) * 16)];
      const laneA = lanes[0];
      [[24, 1.92], [32, 1.92], [36, 3.2], [39, roofT - 1.2], [42, roofT + 1.62]].forEach(([r, y]) => p2.push(new T.Vector3(Math.cos(laneA) * r, y, -Math.sin(laneA) * r)));
      for (let i = 1; i <= 26; i++) { const a = laneA + 0.12 + i / 26 * 3.3; p2.push(new T.Vector3(Math.cos(a) * 44, roofT + 1.62, -Math.sin(a) * 44)); }
      this.rail.push(new T.CatmullRomCurve3(p2));
      const p3 = []; for (let i = 0; i <= 8; i++) { const z = -70 + i * 15, x = 112 + Math.sin(i * 0.7) * 4; p3.push(new T.Vector3(x, H(x, z) + 1.62, z)); }
      this.rail.push(new T.CatmullRomCurve3(p3));
      this.railLen = this.rail.map(c => c.getLength());
      // gates: each stone of parts 1 and 2 holds the rail before it slips out of view
      ID.forEach(o => {
        if (o.phase === 0) { let da = o.a - A0; da = ((da % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2); o.gate = Math.min(this.railLen[0] - 0.5, (da + 0.6) * 16); }
        if (o.phase === 1) { let best = 0, bd = 1e9; for (let k = 0; k <= 60; k++) { const p = this.rail[1].getPointAt(k / 60); const d = Math.hypot(p.x - o.x, p.z - o.z); if (d < bd) { bd = d; best = k / 60; } } o.gate = Math.min(this.railLen[1] - 0.5, (best + 0.08) * this.railLen[1]); }
      });

      /* ---------- discoveries: aim at the gold light and strike ---------- */
      this.disc = [];
      const D = (pos, phase, d) => { const it = w.discover(Object.assign({ pos, size: 2.8, color: 0xffd36a }, d)); this.disc.push({ it, pos: new T.Vector3(...pos), phase }); };
      D([KW / 2 + 0.7, 5.2, -1.6], 0, { title: 'Into the House', text: 'He would not enter the Ka‘bah while there were idols in it, and ordered them brought out. Then he went in and said “Allahu akbar” in each of its corners. (Sahih al-Bukhari 4288)', ar: 'أَبَى أَنْ يَدْخُلَ الْبَيْتَ وَفِيهِ الآلِهَةُ' });
      D([-KW / 2 - 0.6, 6.5, KD / 2 + 0.6], 0, { title: 'Truth Has Come', text: 'With each stroke he recited: <span class="q">“Truth has come and falsehood has vanished”</span> (Qur’an 17:81), and: <span class="q">“Truth has come, and falsehood neither begins nor returns”</span> (Qur’an 34:49). (Sahih al-Bukhari 4287)', ar: 'جَاءَ الْحَقُّ وَمَا يُبْدِئُ الْبَاطِلُ وَمَا يُعِيدُ' });
      const dq = this.doors[2].position; D([dq.x + 0.4, dq.y + 2.6, dq.z], 1, { title: 'Behind Shut Doors', text: 'He declared: whoever enters the house of Abu Sufyan is safe; whoever lays down his arms is safe; whoever locks his door is safe. (Sahih Muslim 1780)', ar: 'وَمَنْ أَغْلَقَ بَابَهُ فَهُوَ آمِنٌ' });
      D([KW / 2 + 0.6, 3.4, -3.2], 1, { title: 'The Key of the House', text: '‘Uthman ibn Talha, who kept the key of the Ka‘bah, was told to bring it; the door was opened and they went in and stayed long inside. (Sahih al-Bukhari 4289)', ar: 'مِفْتَاحُ الْبَيْتِ' });
      const k0 = new T.Vector3(0, H(0, -460) + 14, -460); D(k0.toArray(), 2, { title: 'By Kada’', text: 'In the year of the conquest he entered Makkah from its upper part, by the pass of Kada’. (Sahih al-Bukhari 4290)', ar: 'دَخَلَ مِنْ كَدَاءٍ مِنْ أَعْلَى مَكَّةَ' });
      const bp = poleList[13] || poleList[0]; D([bp.x, bp.y + 16, bp.z], 2, { title: 'Ten Thousand', text: 'He set out in Ramadan with about ten thousand, eight and a half years after his coming to Madinah. (Sahih al-Bukhari 4276)', ar: 'عَشَرَةُ آلاَفٍ' });

      /* ---------- the state of play ---------- */
      this.G = { on: false, phase: 0, u: 0, recoil: 0, swing: 0, beamT: 0, n: [0, 0, 0], wave: 0, waveT: 0, end: 0, endT: 0 };
      // the film hands over to the start of the rail
      const p0 = this.rail[0].getPointAt(0), p1 = this.rail[0].getPointAt(0.01);
      w.pos.set(p0.x, 0, p0.z); w.eye = p0.y - w.ground(p0.x, p0.z); w.yaw = Math.atan2(-(p1.x - p0.x), -(p1.z - p0.z)) + 0.9; w.pitch = 0.02;

      /* ---------- bake the static town into a few draw calls ---------- */
      w.bake();

      /* ---------- sound ---------- */
      const b = env.bus;
      this.wind = SND.noise(b, { color: 'pink', type: 'bandpass', freq: 520, q: 0.5, gain: 0.04 });
      this.crowd = SND.noise(b, { color: 'pink', type: 'bandpass', freq: 300, q: 1.2, gain: 0.018 });
      SND.lfo(b, this.crowd.gain && this.crowd.gain.gain, 0.09, 0.008);
      this.clk = { bird: 1, flap: 2, hum: 4 };
      this.post = w.post({ bloom: 0.45, threshold: 0.78, vignette: 0.32, grain: 0.025, sat: 1.04, contrast: 1.05, lift: [0.01, 0.008, 0.0], gain: [1.03, 1.0, 0.95], rays: { strength: 0.25, dir: [0.6, 0.4, 0.2] } });
      w.tick(dt => this.world(env, dt));
    },

    film(env, w) {
      const self = this, P = (x, z, h) => [x, H(x, z) + h, z];
      return [
        { dur: 7, fade: 'dip', title: true, fov: [46, 40], path: [[[-420, 260, 520], [0, 20, 0]], [[-300, 190, 380], [0, 10, 0]]],
          start: () => { self.doors.forEach(d => { d.rotation.y = d.userData.open; }); } },
        { dur: 7, fade: 'dip', fov: [50, 46], line: 'Ramadan, 8 AH: he sets out for Makkah with about ten thousand (Sahih al-Bukhari 4276).', ar: 'خرج في رمضان في عشرة آلاف',
          path: [[P(-14, -560, 6), P(0, -380, 8)], [P(-8, -470, 4), P(0, -250, 6)]], during: (w, k, dt) => { self.flap(dt * 2); } },
        { dur: 6, fade: 'cut', fov: [44, 42], line: 'Whoever locks his door is safe (Sahih Muslim 1780).', ar: 'وَمَنْ أَغْلَقَ بَابَهُ فَهُوَ آمِنٌ',
          path: [[P(0, -205, 1.7), P(0, -150, 1.8)], [P(0, -178, 1.7), P(0, -130, 1.8)]],
          during: (w, k) => { self.doors.forEach((d, i) => { const kk = U.smooth(0.05 + i * 0.06, 0.2 + i * 0.06, k); if (kk > 0.98 && !d.userData.thud) { d.userData.thud = true; SND.knock(env.bus, { f: 150, gain: 0.12, click: 900 }); } d.rotation.y = U.lerp(d.userData.open, d.userData.shut, kk); }); } },
        { dur: 7, fade: 'dip', fov: [40, 36], line: 'Around the House stand three hundred and sixty idols (Sahih al-Bukhari 4287).', ar: 'وحول البيت ثلاثمئة وستون نُصُبًا',
          path: [[[30, 2.2, 22], [0, 2, 0]], [[22, 1.4, 28], [-4, 1.8, 6]], [[8, 1.2, 30], [-8, 1.6, 8]]],
          start: () => { self.doors.forEach(d => { d.rotation.y = d.userData.shut; }); SND.glow(env.bus, 130.81, { gain: 0.04, dur: 7 }); } },
        { dur: 7, fade: 'dip', fov: [50, 66], line: 'He strikes them with a stick in his hand (Sahih al-Bukhari 4287).', ar: 'فجعل يطعنها بعودٍ في يده',
          path: [[[24, 9, 20], [0, 4, 0]], [[20, 4, 6], [6, 2, -10]]],
          start: () => { SND.sing(env.bus, 196, { vowel: 'o', dur: 4, gain: 0.03, voices: 2 }); } },
      ];
    },
    filmOpts: {
      end(w) {
        const self = ENGINE.cur && ENGINE.cur.w === w ? ENGINE.cur : null; if (!self) return;
        self.doors.forEach(d => { d.rotation.y = d.userData.shut; });
        self.start();
      },
    },

    start() {
      const w = this.w, G = this.G;
      G.on = true; G.phase = 0; G.u = 0; this.staff.visible = true;
      w.mode = dt => this.play(dt);
      w.onPointer = (e, p, ph) => this.pointer(e, ph);
      w.activity('The Return to Makkah', 3, '');
      this.setPhase(0);
    },
    setPhase(i) {
      const G = this.G, w = this.w; G.phase = i; G.u = 0;
      const T3 = ['Part 1 of 3 · Around the House', 'Part 2 of 3 · The roofs', 'Part 3 of 3 · The valley'];
      const ST = ['Aim at a standing stone and strike (click). The way goes on as the near stones fall.', 'Strike the stones on the roofs. Some stand behind cloth: wait for the wind to lift it.', 'The dust is clearing over the valley. Strike each stone as it shows.'];
      this.phaseTitle = T3[i]; w.step(ST[i]); this.tally();
      if (i > 0) SND.glow(w.env.bus, [0, 146.83, 164.81][i], { gain: 0.05, dur: 6 });
      if (i === 2) { G.wave = 0; G.waveT = 0; }
    },
    tally() {
      const G = this.G, w = this.w, i = Math.min(G.phase, 2);
      w.progress(i + G.n[i] / this.count[i]);
      const el = w.ui.layer.querySelector('.wq-title'); if (el) el.textContent = `${this.phaseTitle}  ·  ${G.n[i]} / ${this.count[i]}`;
    },

    /* ---------- aiming and striking ---------- */
    pointer(e, phase) {
      const w = this.w; if (!this.G.on || this.G.end) return false;
      const touch = e.pointerType && e.pointerType !== 'mouse';
      if (phase === 'down') {
        if (touch) { w.look = { id: e.pointerId, x: e.clientX, y: e.clientY }; this.tap = { x: e.clientX, y: e.clientY, t: performance.now() }; return true; }
        if (!w.locked) { try { const host = document.getElementById('host'); const r = host.requestPointerLock && host.requestPointerLock(); if (r && r.catch) r.catch(() => {}); } catch (_) {} }
        this.strike(w.locked ? null : { x: e.clientX, y: e.clientY });
        return true;
      }
      if (phase === 'up' && touch && this.tap) {
        w.look = null;
        if (Math.hypot(e.clientX - this.tap.x, e.clientY - this.tap.y) < 14 && performance.now() - this.tap.t < 400) this.strike({ x: e.clientX, y: e.clientY });
        this.tap = null;
      }
      return true;
    },
    onKey(env, e) { const w = this.w; if (!w || !this.G || !this.G.on || w.filmS || e.repeat) return; if (e.key === ' ' || e.key === 'Enter') this.strike(null); },
    strike(at) {
      const w = this.w, G = this.G, b = w.env.bus, cam = w.camera;
      if (G.cool > 0) return; G.cool = 0.28;
      const ray = new T.Raycaster(); const ndc = new T.Vector2(at ? (at.x / w.env.w) * 2 - 1 : 0, at ? -(at.y / w.env.h) * 2 + 1 : 0);
      ray.setFromCamera(ndc, cam);
      const o = ray.ray.origin, d = ray.ray.direction;
      // what stands in the way?
      const hits = ray.intersectObjects(this.occluders, true); const block = hits.length ? hits[0].distance : 1e9;
      // the nearest stone the line passes close to (a little help for far, small stones)
      let best = null, bt = 1e9;
      this.idols.forEach(I => {
        if (!I.alive || I.phase !== G.phase || I.reveal < 0.55) return;
        for (let k = 0.25; k <= 0.95; k += 0.35) {
          const px = I.x - o.x, py = I.y + I.h * k - o.y, pz = I.z - o.z, t = px * d.x + py * d.y + pz * d.z; if (t < 0) continue;
          const dd = Math.hypot(px - d.x * t, py - d.y * t, pz - d.z * t), tol = I.r * 1.5 + t * 0.016;
          if (dd < tol && t < bt && t < block + I.r * 2) { bt = t; best = I; }
        }
      });
      // a discovery light?
      let disc = null;
      this.disc.forEach(D => { if (D.it.done || D.phase > G.phase) return; const px = D.pos.x - o.x, py = D.pos.y - o.y, pz = D.pos.z - o.z, t = px * d.x + py * d.y + pz * d.z; if (t < 0) return; const dd = Math.hypot(px - d.x * t, py - d.y * t, pz - d.z * t); if (dd < 1.4 + t * 0.02 && (!best || t < bt)) { disc = D; bt = t; } });
      const end = best || disc ? o.clone().addScaledVector(d, bt) : o.clone().addScaledVector(d, Math.min(block, 160));
      // the staff answers at once: thrust, recoil, light
      G.swing = 1; G.recoil = 1; G.beamT = 1;
      const tipW = this.tip.getWorldPosition(new T.Vector3());
      this.beam.position.copy(tipW); this.beam.lookAt(end); this.beam.scale.set(0.035, 0.035, tipW.distanceTo(end)); this.beam.material.opacity = 0.9;
      SND.swell(b, { color: 'white', type: 'bandpass', f0: 2600, f1: 900, dur: 0.35, gain: 0.04 });
      if (disc) { disc.it.done = true; disc.it.onUse(w, disc.it); for (let k = 0; k < 14; k++) this.sparks.emit(end.x, end.y, end.z, (Math.random() - 0.5) * 4, Math.random() * 3, (Math.random() - 0.5) * 4, 1.1, 0.6, 1); return; }
      if (!best) { for (let k = 0; k < 5; k++) this.dust.emit(end.x, end.y, end.z, (Math.random() - 0.5), Math.random(), (Math.random() - 0.5), 0.9, 0.6, 0.35); return; }
      this.fell(best, o);
    },
    fell(I, from) {
      const G = this.G, b = this.w.env.bus;
      I.alive = false; I.t = 0; I.state = 'tip';
      const dx = I.x - from.x, dz = I.z - from.z, l = Math.hypot(dx, dz) || 1; I.fx = dx / l; I.fz = dz / l;
      G.n[I.phase]++; this.tally();
      const notes = [146.83, 164.81, 196, 220, 246.94, 293.66];
      SND.knock(b, { f: 120, gain: 0.25, click: 2200 });
      SND.sing(b, notes[(G.n[I.phase] - 1) % notes.length], { vowel: 'o', dur: 1.8, gain: 0.03, voices: 2 });
      for (let k = 0; k < 10; k++) this.sparks.emit(I.x, I.y + I.h * 0.6, I.z, (Math.random() - 0.5) * 3, Math.random() * 2.5, (Math.random() - 0.5) * 3, 0.7, 0.4, 1);
      for (let k = 0; k < 8; k++) this.dust.emit(I.x, I.y + I.h * 0.5, I.z, (Math.random() - 0.5) * 2, Math.random() * 1.5, (Math.random() - 0.5) * 2, 1.4, 1.4 * I.s, 0.45);
      if (G.n[I.phase] === this.count[I.phase]) setTimeout(() => this.next(I.phase), 1400);
    },
    next(p) {
      const G = this.G, w = this.w; if (G.phase !== p || G.end) return;
      if (p === 0) { w.say('Around the House', 'The stones round the House have fallen. The way leads up onto the roofs.', { ms: 5000 }); this.setPhase(1); }
      else if (p === 1) { this.trans = 0; G.transit = 1; }
      else this.climax();
    },
    climax() {
      const G = this.G, w = this.w, b = w.env.bus; G.end = 1; G.endT = 0;
      this.wind.set('gain', 0.012, 1.5); this.crowd.set('gain', 0.0, 1.5);
      w.step('…');
    },

    /* ---------- the rail and the view ---------- */
    play(dt) {
      const w = this.w, G = this.G, cam = w.camera, b = w.env.bus;
      dt = Math.min(dt, 0.06); G.cool = Math.max(0, (G.cool || 0) - dt);
      // move along the rail unless a near stone still stands at its gate
      const ph = Math.min(G.phase, 2), rail = this.rail[ph], L = this.railLen[ph];
      let gate = L;
      if (ph < 2) this.idols.forEach(I => { if (I.alive && I.phase === ph && I.gate < gate) gate = I.gate; });
      const sp = [1.35, 2.1, 0.7][ph];
      if (G.transit) {
        // a dip to the slope of Abu Qubays for the last part
        this.trans += dt; const k = this.trans;
        this.fade(U.smooth(0, 1.2, k) * (1 - U.smooth(1.6, 2.8, k)));
        if (k > 1.4 && G.phase === 1) { this.setPhase(2); w.yaw = Math.PI * 0.5 + 0.1; w.pitch = -0.12; }
        if (k > 2.8) G.transit = 0;
      } else if (!G.end) {
        const want = Math.min(gate, L);
        G.u = Math.min(want, G.u + sp * dt * U.smooth(0, 3, want - G.u + 0.5));
      }
      const pos = rail.getPointAt(U.clamp(G.u / L));
      // the view: the mouse (or drag) aims; the strike kicks the view and the staff
      G.recoil = U.damp(G.recoil, 0, 9, dt); G.swing = U.damp(G.swing, 0, 7, dt);
      const bob = Math.sin(G.u * 3.1) * 0.025;
      cam.position.set(pos.x, pos.y + bob, pos.z);
      cam.rotation.set(w.pitch + G.recoil * 0.035, w.yaw, Math.sin(G.u * 1.55) * 0.004);
      w.pos.set(pos.x, 0, pos.z); w.y = pos.y - 1.62;
      if (w._shadow) { const S2 = w._shadow, f = cam.getWorldDirection(new T.Vector3()); const px = Math.round((pos.x + f.x * 25) / 2) * 2, pz = Math.round((pos.z + f.z * 25) / 2) * 2; S2.light.target.position.set(px, 0, pz); S2.light.position.set(px + S2.off.x, S2.off.y, pz + S2.off.z); }
      const s = this.staff, s0 = this.staffBase;
      s.position.set(s0.p.x - G.swing * 0.06, s0.p.y + G.swing * 0.06 + Math.sin(G.u * 3.1) * 0.01, s0.p.z - G.swing * 0.28);
      s.rotation.set(s0.r.x - G.swing * 0.35, s0.r.y, s0.r.z + G.swing * 0.12);
      this.tip.material.opacity = 0.45 + G.swing * 0.55;
      // phase 3: the dust clears from a few stones at a time
      if (G.phase === 2 && !G.end && !G.transit) {
        G.waveT += dt;
        const groupLeft = this.idols.some(I => I.phase === 2 && I.group === G.wave && I.alive);
        if ((!groupLeft || G.waveT > 14) && G.wave < 6 && G.waveT > 1.5) { G.wave++; G.waveT = 0; SND.swell(b, { f0: 200, f1: 900, dur: 2.5, gain: 0.05 }); }
        this.idols.forEach(I => { if (I.phase === 2 && I.group <= G.wave) I.reveal = Math.min(1, I.reveal + dt * 0.6); });
      }
      // the end: near-silence, then the verse, a call from the roof, and light
      if (G.end) {
        G.endT += dt; const t = G.endT;
        if (t > 2.2 && !this._v) { this._v = 1; this.flash = 1; SND.glow(b, 146.83, { gain: 0.08, dur: 10, vowel: 'a' }); w.say('Truth Has Come', '<span class="q">“Truth has come and falsehood has vanished; falsehood is bound to vanish.”</span> (Qur’an 17:81; Sahih al-Bukhari 4287)', { ar: 'جَاءَ الْحَقُّ وَزَهَقَ الْبَاطِلُ ۚ إِنَّ الْبَاطِلَ كَانَ زَهُوقًا', ms: 10000 }); }
        if (t > 9 && !this._c) { this._c = 1; this.call(); w.say('A Call from the Roof', 'The sirah reports that Bilal gave the call to prayer from the roof of the Ka‘bah that day (Ibn Ishaq; the chains are incomplete).', { ms: 10000 }); }
        if (t > 20 && !this._f) { this._f = 1; this.wrap(); }
        this.column.material.opacity = U.smooth(9, 13, t) * 0.32 * (0.85 + 0.15 * Math.sin(w.time * 1.3));
        this.roofGlow.material.opacity = U.smooth(9, 12, t) * 0.9;
      }
      // point the way to the stone that holds the rail, or the nearest one showing
      if (!G.end && !G.transit) {
        let tgt = null, bd = 1e9;
        this.idols.forEach(I => { if (!I.alive || I.phase !== G.phase || I.reveal < 0.55) return; const d = G.phase < 2 ? I.gate : Math.hypot(I.x - pos.x, I.z - pos.z); if (d < bd) { bd = d; tgt = I; } });
        const f = cam.getWorldDirection(new T.Vector3());
        if (tgt) { const dx = tgt.x - pos.x, dz = tgt.z - pos.z, l = Math.hypot(dx, dz); const off = (dx * f.x + dz * f.z) / l < 0.82; w.goal(off ? [tgt.x, tgt.y + tgt.h, tgt.z] : null); } else w.goal(null);
      } else w.goal(null);
      if (this.flash) { this.flash = Math.max(0, this.flash - dt * 0.6); this.fade(this.flash * 0.85, '#fff6e6'); }
    },
    fade(k, col) { if (this.post) this.post.set({ fade: k, fadeColor: col || '#000000' }); else { const f = this.w.ui.layer.querySelector('.w-fade'); f.style.background = col || '#000'; f.style.opacity = k; } },
    call() {
      const b = this.w.env.bus;
      // a long sung call, wordless, rising and falling
      const line = [[293.66, 1.6], [329.63, 0.8], [293.66, 0.9], [261.63, 1.4], [293.66, 2.6], [392, 1.8], [349.23, 0.9], [329.63, 1.0], [293.66, 3.0]];
      let t = 0; line.forEach(([f, d]) => { SND.sing(b, f, { vowel: 'a', dur: d + 0.4, gain: 0.05, delay: t, attack: 0.15, hold: 0.7, glide: 0.97 }); t += d; });
    },
    wrap() {
      const w = this.w, G = this.G;
      w.finish('The House is cleared');
      setTimeout(() => {
        if (this.w !== w) return;
        G.on = false; w.mode = null; w.onPointer = null; this.staff.visible = false;
        const p = this.rail[2].getPointAt(U.clamp(G.u / this.railLen[2])); w.pos.set(p.x, 0, p.z); w.y = w.ground(p.x, p.z); w.eye = 1.62;
        w.env.hint('WASD to walk on the slope · look down on the valley');
      }, 6000);
    },

    flap(dt) {
      const p = this.cloth.geometry.attributes.position, B = this.clothBase, t = this.w.time;
      this.banners.forEach(bn => {
        for (let j = 0; j <= 3; j++) for (let i = 0; i <= 8; i++) {
          const k = (bn.base + j * 9 + i) * 3, u = i / 8, wave = Math.sin(t * 3.2 - u * 5 + bn.ph) * u * 0.5 + Math.sin(t * 5.1 - u * 8 + j) * u * 0.15;
          p.array[k] = B[k] + Math.sin(bn.yaw) * wave; p.array[k + 1] = B[k + 1] - u * u * 0.25; p.array[k + 2] = B[k + 2] + Math.cos(bn.yaw) * wave;
        }
      });
      p.needsUpdate = true; this.cloth.geometry.computeVertexNormals();
    },

    /* ---------- the world around the play ---------- */
    world(env, dt) {
      const w = this.w, G = this.G, t = w.time, b = env.bus;
      this.flap(dt);
      if (this.cullList) for (const m of this.cullList) { const S0 = m.geometry.boundingSphere; m.visible = S0.center.distanceTo(w.camera.position) - S0.radius < 900; }
      for (let i = 0; i < this.plumes.n; i++) { this.plumes.P[i * 3] = this.plumeBase[i * 3] + Math.sin(t * 0.05 + i) * 6; this.plumes.P[i * 3 + 1] = this.plumeBase[i * 3 + 1] + Math.sin(t * 0.08 + i * 2) * 2; this.plumes.A[i] = 0.18 + 0.08 * Math.sin(t * 0.1 + i); }
      this.plumes.upd();
      // the stones: falling ones tip about their base edge, rock, and go down to dust
      const m4 = new T.Matrix4(), mR = new T.Matrix4(), mT = new T.Matrix4(), q = new T.Quaternion(), e = new T.Euler(), ax = new T.Vector3(), sc = new T.Vector3(), zero = new T.Matrix4().makeScale(0, 0, 0);
      let changed = false; const gl = this.glints;
      this.idols.forEach((I, i) => {
        gl.A[i] = 0;
        if (I.alive) {
          // awnings swing up in the wind and fall back
          if (I.hinge) { const lift = Math.pow(Math.max(0, Math.sin(t * 0.55 + I.ph)), 2); I.hinge.rotation.x = -lift * 1.25 - Math.sin(t * 2.3 + I.ph) * 0.04; I.reveal = lift; }
          const ready = I.phase === G.phase && I.reveal > 0.55 && G.on;
          if (ready) { gl.P.set([I.x, I.y + I.h + 0.5, I.z], i * 3); gl.S[i] = 1.4 + Math.hypot(I.x - w.camera.position.x, I.z - w.camera.position.z) * 0.02; gl.A[i] = 0.55 + 0.25 * Math.sin(t * 3 + i); }
          return;
        }
        if (I.state === 'gone') return;
        I.t += dt; changed = true;
        const th = Math.min(Math.PI / 2 * 0.98, 3.2 * I.t * I.t), bounce = I.t > 0.75 ? Math.exp(-(I.t - 0.75) * 6) * Math.sin((I.t - 0.75) * 20) * 0.08 : 0;
        if (I.t > 0.74 && !I.thud) { I.thud = true; SND.thump(b, { gain: 0.12, f: 55, dur: 0.6 }); for (let k = 0; k < 14; k++) this.dust.emit(I.x + I.fx * I.h * 0.6, I.y + 0.2, I.z + I.fz * I.h * 0.6, (Math.random() - 0.5) * 3, Math.random() * 1.2, (Math.random() - 0.5) * 3, 1.8, 1.8 * I.s, 0.5); }
        const sink = U.smooth(1.4, 2.6, I.t);
        if (I.t > 1.6 && !I.crumb) { I.crumb = true; SND.swell(b, { f0: 400, f1: 150, dur: 1.4, gain: 0.04 }); for (let k = 0; k < 12; k++) this.dust.emit(I.x + I.fx * I.h * 0.5 + (Math.random() - 0.5) * I.h, I.y + 0.2, I.z + I.fz * I.h * 0.5, (Math.random() - 0.5), 0.5 + Math.random(), (Math.random() - 0.5), 2.2, 2.2 * I.s, 0.5); }
        if (I.t > 2.7) { I.state = 'gone'; this.idolMesh[I.shape].setMatrixAt(i, zero); return; }
        ax.set(I.fz, 0, -I.fx);
        const ex = I.x + I.fx * I.r, ez = I.z + I.fz * I.r;
        mT.makeTranslation(ex, I.y - sink * 0.5, ez); mR.makeRotationAxis(ax, th - bounce); m4.multiplyMatrices(mT, mR);
        mT.makeTranslation(I.x - ex, 0, I.z - ez); m4.multiply(mT);
        q.setFromEuler(e.set(0, I.ry, 0)); sc.setScalar(I.s * (1 - sink * 0.6)); mT.compose(new T.Vector3(0, 0, 0), q, sc); m4.multiply(mT);
        this.idolMesh[I.shape].setMatrixAt(i, m4);
      });
      if (changed) this.idolMesh.forEach(m => { m.instanceMatrix.needsUpdate = true; });
      gl.upd();
      // the dust over the valley clears from each group in turn
      const dc = this.dustClouds; let k2 = 0;
      this.idols.forEach(I => { if (I.phase !== 2) return; for (let j = 0; j < 2; j++) { const i = (k2 * 2 + j) % 70; dc.A[i] = G.phase === 2 ? 0.45 * (1 - I.reveal) : 0.3; dc.P[i * 3 + 1] += Math.sin(t * 0.3 + i) * 0.01; } k2++; });
      dc.upd();
      // the line of light fades
      if (G.beamT > 0) { G.beamT = Math.max(0, G.beamT - dt * 4); this.beam.material.opacity = G.beamT * 0.85; this.beam.scale.x = this.beam.scale.y = 0.02 + G.beamT * 0.03; }
      this.beam.visible = G.beamT > 0.01;
      this.dust.step(dt, 1.4, 0.3); this.sparks.step(dt, 2.2, -0.4);
      // sound
      this.clk.bird -= dt; if (this.clk.bird < 0) { this.clk.bird = 1 + Math.random() * 3; if (Math.random() < 0.6) SND.chirp(b, { gain: 0.012 }); else SND.coo(b, { gain: 0.02 }); }
      this.clk.flap -= dt; if (this.clk.flap < 0) { this.clk.flap = 2 + Math.random() * 3; SND.swell(b, { color: 'white', type: 'bandpass', f0: 700, f1: 1600, dur: 0.9, gain: 0.012, pan: U.rnd(-1, 1) }); }
      this.clk.hum -= dt; if (this.clk.hum < 0 && !G.end) { this.clk.hum = 6 + Math.random() * 6; SND.sing(b, U.pick([110, 123.47, 98]), { vowel: 'm', dur: 3, gain: 0.006, voices: 3, pan: U.rnd(-0.8, 0.8) }); }
    },

    update(env, dt) { const w = this.w; if (!w) return; w.update(Math.min(dt, 0.1)); },
  }));
})();
