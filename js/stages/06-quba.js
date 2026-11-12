/* Station — Quba, the First Stones (walkable), Rabi' al-Awwal 1 AH.
   Feeling: humble belonging, the quiet joy of building something together for God.
   The village of Quba on the southern edge of the oasis in late-afternoon light: palms, black
   basalt underfoot and on the horizon, a well, and the chalk outline of the first mosque.
   Three piles of basalt stones (small, medium, large) and twelve chalk places of matching sizes:
   carry each stone to a place of its own size. Each stone set sings a little higher. When all
   twelve are laid the walls rise, a palm-frond roof spreads over the prayer area, and doves settle.
   Colour script: amber afternoon and black basalt, with chalk-white light kept for the places
   and the stone in hand. No person is shown: the village is present in murmurs and traces. */
(function () {
  'use strict';
  if (!window.WORLD) return;

  const F = { x0: -6.5, x1: 6.5, z0: -11, z1: 3, wt: 0.8 };   // the foundation (north is -z)
  const CX = (F.x0 + F.x1) / 2, ROOF_Z = -5;                    // the roofed prayer area lies north of ROOF_Z
  const SIZES = {
    s: { name: 'small', dim: [0.5, 0.3, 0.36], ticks: 1 },
    m: { name: 'medium', dim: [0.8, 0.38, 0.5], ticks: 2 },
    l: { name: 'large', dim: [1.15, 0.46, 0.7], ticks: 3 },
  };
  const cl = F.z0 + F.wt / 2, cs = F.z1 - F.wt / 2, cw = F.x0 + F.wt / 2, ce = F.x1 - F.wt / 2;
  const SLOTS = [
    ['l', cw, cl, 0], ['l', ce, cl, 0], ['l', cw, cs, 0], ['l', ce, cs, 0],
    ['m', -2.2, cl, 0], ['m', 2.2, cl, 0], ['m', -3.3, cs, 0], ['m', 3.3, cs, 0],
    ['s', cw, -7, 1], ['s', cw, -1.5, 1], ['s', ce, -7, 1], ['s', ce, -1.5, 1],
  ].map(([size, x, z, rot]) => ({ size, x, z, rot }));
  const PILES = [{ size: 's', x: -4.2, z: 8.2 }, { size: 'm', x: -7.6, z: 7.4 }, { size: 'l', x: -11, z: 5.6 }];
  const NOTES = [146.83, 164.81, 185, 220, 246.94, 293.66, 329.63, 369.99, 440, 493.88, 587.33, 659.25];
  const WELL = { x: 10.5, z: 9.5 };

  ENGINE.register(WORLD.stage({
    key: 'quba',
    arabic: 'قُباء',
    title: 'Quba, the First Stones',
    era: 'Rabi‘ al-Awwal, 1 AH',
    hint: 'WASD to walk · E to take a stone · E again to set it in a place of the same size',
    sound: { reverb: 0.3 },
    story: `<p>Before entering the city, the Prophet ﷺ stayed in Quba, on the southern edge of the oasis, among Banu ‘Amr ibn ‘Awf for some ten nights or more. There the first mosque in Islam was founded; a report in al-Tabarani says he carried stones for it himself.</p>
            <p class="q"><span class="ar">لَمَسْجِدٌ أُسِّسَ عَلَى التَّقْوَىٰ مِنْ أَوَّلِ يَوْمٍ</span>“A mosque founded on piety from the first day…” (Qur’an 9:108)</p>
            <p>Madinah sits among fields of black volcanic rock, the <i>harrah</i>. Its early walls were built from that basalt and from sun-dried brick.</p>`,

    enter(env) {
      const T = THREE, self = this;
      const w = this.w = WORLD.create(env, {
        start: { x: -1, z: 15, yaw: 0.12, pitch: -0.12 }, exposure: 1.05, far: 1400,
        fog: { color: 0xe8b88a, density: 0.0052 }, bounds: [-40, -40, 40, 40],
        surface: (x, z) => (x > F.x0 - 1 && x < F.x1 + 1 && z > F.z0 - 1 && z < F.z1 + 1 ? 'gravel' : 'sand'),
      });
      const S = w.scene;
      this.carrying = null; this.placed = 0; this.phase = 'build'; this.flying = []; this.puffs = [];

      /* ---------- light: a low western sun ---------- */
      const sunDir = new T.Vector3(-0.8, 0.34, 0.22).normalize();
      w.sky({ top: '#6a8cc0', mid: '#f4c890', bot: '#c89868', sunDir: sunDir.toArray(), sun: '#ffc070', sunSize: 0.0018 });
      S.add(new T.HemisphereLight(0xffd8b0, 0x6a4a34, 0.55));
      const sun = new T.DirectionalLight(0xffbe80, 2.5); sun.position.copy(sunDir).multiplyScalar(60); S.add(sun);
      w.followShadow(sun, 30, 2048);

      /* ---------- ground: earth, sand and scattered harrah stone ---------- */
      const earth = KIT.std({ map: KIT.sand(w, [70, 70]), color: 0xd4b08c, relief: 0.03 });
      const gnd = new T.Mesh(new T.PlaneGeometry(500, 500), earth); gnd.rotation.x = -Math.PI / 2; S.add(gnd);
      const basaltTex = KIT.basalt(w, [1, 1]);
      const rockMat = KIT.std({ map: basaltTex, color: 0x9a9088, flatShading: true });
      const rockGeo = new T.DodecahedronGeometry(0.22, 0);
      const r = U.seeded(1);
      const rocks = new T.InstancedMesh(rockGeo, rockMat, 520); const m4 = new T.Matrix4(), q = new T.Quaternion(), v3 = new T.Vector3(), sc = new T.Vector3();
      let ri = 0;
      while (ri < 520) {
        const a = r() * 6.283, d = 4 + Math.pow(r(), 0.7) * 70, x = Math.cos(a) * d, z = Math.sin(a) * d;
        if (x > F.x0 - 2 && x < F.x1 + 2 && z > F.z0 - 2 && z < F.z1 + 2) continue;
        if (Math.hypot(x - WELL.x, z - WELL.z) < 3 || (z > 2 && z < 18 && x > -14 && x < 3)) continue;
        const s = 0.4 + r() * (x > 25 ? 3 : 1.4);
        q.setFromEuler(new T.Euler(r() * 3, r() * 3, r() * 3)); sc.set(s, s * (0.5 + r() * 0.4), s);
        m4.compose(v3.set(x, 0.02, z), q, sc); rocks.setMatrixAt(ri++, m4);
      }
      S.add(rocks);
      // the harrah on the horizon: low black lava ridges east and west
      const hillMat = KIT.std({ map: KIT.basalt(w, [6, 2]), color: 0x4a4440, flatShading: true });
      for (let i = 0; i < 22; i++) {
        const side = i % 2 ? 1 : -1, z = -260 + (i >> 1) * 48, x = side * (190 + (i % 5) * 30);
        const h = new T.Mesh(new T.ConeGeometry(70 + (i % 3) * 25, 14 + (i % 4) * 6, 7), hillMat);
        h.position.set(x, -2, z); h.scale.set(1, 1, 0.6); h.rotation.y = i; S.add(h);
      }

      /* ---------- palms, the village and the well ---------- */
      const pr = U.seeded(622);
      const palm = (x, z, h) => { const p = KIT.palm(w, h || 7 + pr() * 6); p.position.set(x, 0, z); S.add(p); w.addCircle(x, z, 0.3); };
      for (let i = 0; i < 46; i++) {
        const a = pr() * 6.283, d = 20 + pr() * 34, x = Math.cos(a) * d, z = Math.sin(a) * d - 6;
        if (Math.abs(x) < 14 && z > 10) continue;
        palm(x, z);
      }
      [[7, 19, 10], [11, 15, 8.5], [4, 23, 11.5], [-15, 14, 9], [16, -4, 9.5], [-14, -16, 10]].forEach(([x, z, h]) => palm(x, z, h));
      const mudMats = ['#cdb08c', '#bea07c', '#d8bc98'].map(c => KIT.std({ map: KIT.mudBrick(w, [2, 0.8]), color: new T.Color(c) }));
      const roofMat = KIT.std({ map: KIT.frondRoof(w, [2, 2]), alphaTest: 0.5, side: T.DoubleSide, color: 0xc8b088 });
      const doorM = KIT.std({ color: 0x2a1c12 });
      [[-24, -18, 7, 5, 3], [-27, -4, 6, 6, 2.8], [22, -20, 8, 5, 3.2], [26, -6, 6, 7, 2.6], [-22, 12, 6, 5, 2.8], [24, 22, 7, 6, 3], [-6, -30, 8, 6, 3.1], [9, -32, 6, 5, 2.7]].forEach(([x, z, hw, hd, hh], i) => {
        const hs = new T.Mesh(new T.BoxGeometry(hw, hh, hd), mudMats[i % 3]); hs.position.set(x, hh / 2, z); hs.rotation.y = (i % 3 - 1) * 0.15; S.add(hs);
        const rf = new T.Mesh(new T.PlaneGeometry(hw + 0.6, hd + 0.6), roofMat); rf.rotation.x = -Math.PI / 2; rf.position.set(0, hh / 2 + 0.05, 0); hs.add(rf);
        const dr = new T.Mesh(new T.BoxGeometry(0.9, 1.8, 0.1), doorM); dr.position.set(0, -hh / 2 + 0.9, hd / 2 + 0.03); hs.add(dr);
        w.addBox(x - hw / 2, z - hd / 2, x + hw / 2, z + hd / 2);
      });
      const wellStone = KIT.std({ map: KIT.basalt(w, [3, 0.5]), color: 0xb0a8a0 });
      const ring = new T.Mesh(new T.CylinderGeometry(1.2, 1.3, 0.8, 20, 1, true), wellStone); ring.position.set(WELL.x, 0.4, WELL.z); S.add(ring);
      const lip = new T.Mesh(new T.TorusGeometry(1.22, 0.14, 6, 20), wellStone); lip.rotation.x = Math.PI / 2; lip.position.set(WELL.x, 0.8, WELL.z); S.add(lip);
      const water = new T.Mesh(new T.CircleGeometry(1.15, 20), KIT.std({ color: 0x20302c, roughness: 0.1, metalness: 0.4 })); water.rotation.x = -Math.PI / 2; water.position.set(WELL.x, 0.1, WELL.z); S.add(water);
      const wood = KIT.std({ map: KIT.wood(w), color: 0xa08060 });
      [-1, 1].forEach(s => { const p = new T.Mesh(new T.CylinderGeometry(0.08, 0.1, 2.4, 6), wood); p.position.set(WELL.x + s * 1.25, 1.2, WELL.z); S.add(p); });
      const bar = new T.Mesh(new T.CylinderGeometry(0.06, 0.06, 2.8, 6), wood); bar.rotation.z = Math.PI / 2; bar.position.set(WELL.x, 2.3, WELL.z); S.add(bar);
      const bucket = new T.Mesh(new T.CylinderGeometry(0.2, 0.16, 0.32, 10), KIT.std({ color: 0x5a3e28 })); bucket.position.set(WELL.x + 0.9, 0.98, WELL.z + 0.4); S.add(bucket);
      w.addCircle(WELL.x, WELL.z, 1.5);

      /* ---------- the chalk foundation ---------- */
      const chalkTex = w.tex(256, (g, s) => {
        g.clearRect(0, 0, s, s); g.strokeStyle = 'rgba(255,252,240,0.95)'; g.lineCap = 'round';
        for (let k = 0; k < 3; k++) { g.lineWidth = 3 + Math.random() * 3; g.beginPath(); for (let x = 0; x <= s; x += 16) g.lineTo(x, s / 2 + (Math.random() - 0.5) * 6); g.stroke(); }
      });
      const chalk = new T.MeshBasicMaterial({ map: chalkTex, transparent: true, opacity: 0.8, depthWrite: false, color: 0xfff8e8, polygonOffset: true, polygonOffsetFactor: -2 });
      const line = (x0, z0, x1, z1) => {
        const L = Math.hypot(x1 - x0, z1 - z0), m = new T.Mesh(new T.PlaneGeometry(L, 0.14), chalk);
        m.rotation.x = -Math.PI / 2; m.rotation.z = -Math.atan2(z1 - z0, x1 - x0); m.position.set((x0 + x1) / 2, 0.012, (z0 + z1) / 2); S.add(m);
      };
      const rect = (x0, z0, x1, z1) => { line(x0, z0, x1, z0); line(x1, z0, x1, z1); line(x1, z1, x0, z1); line(x0, z1, x0, z0); };
      rect(F.x0, F.z0, F.x1, F.z1);
      line(F.x0 + F.wt, F.z0 + F.wt, F.x1 - F.wt, F.z0 + F.wt); line(F.x0 + F.wt, F.z0 + F.wt, F.x0 + F.wt, F.z1 - F.wt); line(F.x1 - F.wt, F.z0 + F.wt, F.x1 - F.wt, F.z1 - F.wt);
      line(F.x0 + F.wt, F.z1 - F.wt, -1.3, F.z1 - F.wt); line(1.3, F.z1 - F.wt, F.x1 - F.wt, F.z1 - F.wt);
      for (let x = F.x0 + 1.2; x < F.x1 - 1; x += 1.1) line(x, ROOF_Z, x + 0.55, ROOF_Z); // the edge of the roofed area, dashed
      // a stake and string at each corner
      const stake = KIT.std({ map: KIT.wood(w), color: 0x9a7a58 });
      [[F.x0, F.z0], [F.x1, F.z0], [F.x0, F.z1], [F.x1, F.z1]].forEach(([x, z]) => { const s = new T.Mesh(new T.CylinderGeometry(0.035, 0.03, 0.6, 5), stake); s.position.set(x, 0.3, z); S.add(s); });

      // the twelve places: chalk outlines with ticks for their size
      const slotTex = {};
      Object.keys(SIZES).forEach(k => {
        slotTex[k] = w.tex(256, (g, s) => {
          g.clearRect(0, 0, s, s); g.strokeStyle = 'rgba(255,252,240,1)'; g.lineWidth = 9; g.lineJoin = 'round';
          g.beginPath(); g.rect(14, 14, s - 28, s - 28); g.stroke();
          g.lineWidth = 7;
          for (let t = 0; t < SIZES[k].ticks; t++) { const x = s / 2 + (t - (SIZES[k].ticks - 1) / 2) * 34; g.beginPath(); g.moveTo(x, s * 0.36); g.lineTo(x, s * 0.64); g.stroke(); }
        });
        slotTex[k].wrapS = slotTex[k].wrapT = T.ClampToEdgeWrapping;
      });
      SLOTS.forEach((sl, i) => {
        const d = SIZES[sl.size].dim;
        sl.mat = new T.MeshBasicMaterial({ map: slotTex[sl.size], transparent: true, opacity: 0.8, depthWrite: false, color: 0xfff6e0, polygonOffset: true, polygonOffsetFactor: -3 });
        sl.mesh = new T.Mesh(new T.PlaneGeometry(d[0] + 0.12, d[2] + 0.12), sl.mat);
        sl.mesh.rotation.x = -Math.PI / 2; sl.mesh.rotation.z = sl.rot ? Math.PI / 2 : 0; sl.mesh.position.set(sl.x, 0.016, sl.z); sl.mesh.userData.dynamic = true; S.add(sl.mesh);
        sl.glow = KIT.glow(w, 0xfff4d8, 1.6, 0); sl.glow.position.set(sl.x, 0.35, sl.z); S.add(sl.glow);
        sl.flash = 0;
        w.interact({
          key: 'slot' + i, pos: [sl.x, 0.3, sl.z], r: 2.4,
          enabled: () => !!self.carrying && !sl.filled && self.phase === 'build',
          label: () => (self.carrying === sl.size ? `Set the ${SIZES[sl.size].name} stone here` : `This place is marked for a ${SIZES[sl.size].name} stone`),
          onUse: () => self.trySet(env, sl),
        });
      });

      /* ---------- the stones ---------- */
      this.stoneMat = KIT.std({ map: basaltTex, color: 0x8a827c, flatShading: true, roughness: 0.9 });
      this.geos = {};
      Object.keys(SIZES).forEach(k => {
        const [a, b, c] = SIZES[k].dim, g = new T.BoxGeometry(a, b, c, 2, 2, 2), p = g.attributes.position, rr = U.seeded(k.charCodeAt(0));
        const seen = new Map();
        for (let i = 0; i < p.count; i++) { const key = `${p.getX(i).toFixed(3)},${p.getY(i).toFixed(3)},${p.getZ(i).toFixed(3)}`; if (!seen.has(key)) seen.set(key, [(rr() - 0.5) * a * 0.12, (rr() - 0.5) * b * 0.16, (rr() - 0.5) * c * 0.12]); const o = seen.get(key); p.setXYZ(i, p.getX(i) + o[0], p.getY(i) + o[1], p.getZ(i) + o[2]); }
        g.computeVertexNormals(); this.geos[k] = g;
      });
      PILES.forEach((pl, pi) => {
        const d = SIZES[pl.size].dim, rr = U.seeded(90 + pi);
        const layout = [[-1, 0, 0], [0, 0, 0], [1, 0, 0], [-0.5, 0, 1], [0.5, 0, 1], [-0.5, 1, 0.3], [0.5, 1, 0.3], [0, 2, 0.5]];
        layout.forEach(([ix, iy, iz]) => {
          const m = new T.Mesh(this.geos[pl.size], this.stoneMat);
          m.position.set(pl.x + ix * d[0] * 1.05 + (rr() - 0.5) * 0.1, d[1] * (0.5 + iy * 0.92), pl.z + iz * d[2] * 1.1 - d[2] * 0.4);
          m.rotation.y = (rr() - 0.5) * 0.3; S.add(m);
        });
        w.addCircle(pl.x, pl.z, d[0] * 1.6);
        // a chalk mark before each pile, with the same ticks as its places
        const mk = new T.Mesh(new T.PlaneGeometry(0.7, 0.7), new T.MeshBasicMaterial({ map: slotTex[pl.size], transparent: true, opacity: 0.7, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
        mk.rotation.x = -Math.PI / 2; mk.position.set(pl.x + 0.3, 0.014, pl.z + d[0] * 1.6 + 0.6); S.add(mk);
        pl.glow = KIT.glow(w, 0xfff0d0, 2.6, 0); pl.glow.position.set(pl.x, d[1] * 2.6, pl.z); S.add(pl.glow);
        w.interact({
          key: 'pile' + pi, pos: [pl.x, 0.5, pl.z], r: 2.4 + d[0] * 1.6,
          enabled: () => self.phase === 'build',
          label: () => (!self.carrying ? `Take a ${SIZES[pl.size].name} stone` : self.carrying === pl.size ? 'Put the stone back' : `Exchange it for a ${SIZES[pl.size].name} stone`),
          onUse: () => self.take(env, pl.size),
        });
      });

      // the stone in your hands
      S.add(w.camera);
      this.held = new T.Mesh(this.geos.s, this.stoneMat); this.held.visible = false; this.held.userData.dynamic = true;
      w.camera.add(this.held); this.heldHome = new T.Vector3(0.22, -0.48, -0.95); this.held.position.copy(this.heldHome); this.held.rotation.set(0.25, 0.35, 0);
      this.shake = 0; this.lift = 0;

      /* ---------- what rises at the end: walls, pillars, the frond roof ---------- */
      const wallMat = KIT.std({ map: KIT.mudBrick(w, [3, 1]), color: 0xc8a888 });
      const footMat = KIT.std({ map: KIT.basalt(w, [4, 0.5]), color: 0x9a928c });
      this.rise = new T.Group(); this.rise.userData.dynamic = true; S.add(this.rise);
      const WH = 2.4;
      const wallSeg = (x0, z0, x1, z1) => {
        const lx = Math.max(F.wt, Math.abs(x1 - x0)), lz = Math.max(F.wt, Math.abs(z1 - z0));
        const g = new T.Group(); g.position.set((x0 + x1) / 2, 0, (z0 + z1) / 2);
        const foot = new T.Mesh(new T.BoxGeometry(lx + 0.06, 0.8, lz + 0.06), footMat); foot.position.y = 0.4; g.add(foot);
        const mud = new T.Mesh(new T.BoxGeometry(lx, WH - 0.8, lz), wallMat); mud.position.y = 0.8 + (WH - 0.8) / 2; g.add(mud);
        g.scale.y = 0.001; g.visible = false; this.rise.add(g); return g;
      };
      this.walls = [
        wallSeg(F.x0, F.z0 + F.wt / 2, F.x1, F.z0 + F.wt / 2), wallSeg(F.x0 + F.wt / 2, F.z0 + F.wt, F.x0 + F.wt / 2, F.z1 - F.wt), wallSeg(F.x1 - F.wt / 2, F.z0 + F.wt, F.x1 - F.wt / 2, F.z1 - F.wt),
        wallSeg(F.x0, F.z1 - F.wt / 2, -1.3, F.z1 - F.wt / 2), wallSeg(1.3, F.z1 - F.wt / 2, F.x1, F.z1 - F.wt / 2),
      ];
      const trunkMat = KIT.std({ map: KIT.bark(w), color: 0xc8b096 });
      this.pillars = [-3.2, 0, 3.2].map(x => { const p = new T.Mesh(new T.CylinderGeometry(0.17, 0.21, WH + 0.3, 9), trunkMat); p.position.set(x, (WH + 0.3) / 2, (F.z0 + ROOF_Z) / 2 + 0.6); p.scale.y = 0.001; p.visible = false; this.rise.add(p); return p; });
      const roofTex = KIT.frondRoof(w, [4, 2]);
      const fRoof = KIT.std({ map: roofTex, alphaTest: 0.5, side: T.DoubleSide, color: 0xd8c8a0 });
      const roofDepth = new T.MeshDepthMaterial({ depthPacking: T.RGBADepthPacking, map: roofTex, alphaTest: 0.5, side: T.DoubleSide });
      const RD = ROOF_Z - (F.z0 + 0.2), RW = F.x1 - F.x0 - 0.2;
      this.roof = new T.Group(); this.roof.position.set(CX, WH + 0.2, F.z0 + 0.1); this.rise.add(this.roof);
      [0, 0.1].forEach((dy, i) => {
        const rf = new T.Mesh(new T.PlaneGeometry(RW, RD), fRoof); rf.rotation.x = -Math.PI / 2; rf.rotation.z = i * 0.06; rf.position.set(0, dy, RD / 2); rf.customDepthMaterial = roofDepth; rf.castShadow = true; this.roof.add(rf);
      });
      for (let x = -RW / 2 + 1.2; x < RW / 2; x += 2.6) { const bm = new T.Mesh(new T.BoxGeometry(0.2, 0.18, RD), trunkMat); bm.position.set(x, -0.1, RD / 2); this.roof.add(bm); }
      this.roof.scale.z = 0.001; this.roof.visible = false;

      /* ---------- doves, waiting in the palms ---------- */
      const dg = new T.SphereGeometry(0.12, 8, 6); dg.scale(1.6, 1, 1);
      this.doveMesh = new T.InstancedMesh(dg, KIT.std({ color: 0xa8a4a8, roughness: 0.7 }), 12); this.doveMesh.userData.dynamic = true; this.doveMesh.visible = false; S.add(this.doveMesh);
      const perch = [[-5.6, -10.6], [-3, -10.6], [-0.4, -10.6], [2.4, -10.6], [5, -10.6], [-6.1, -6], [-6.1, -2], [6.1, -4.5], [6.1, -0.5], [-4, 2.6], [3, 2.6], [5.4, 2.6]];
      this.doves = perch.map(([x, z], i) => ({ from: new T.Vector3(-40 + i * 3, 18 + (i % 3) * 3, 30 - i * 2), to: new T.Vector3(x, WH + 0.12, z), t: -i * 0.35, ph: Math.random() * 6 }));

      // dust in the low sun
      this.dust = KIT.dust(w, 240, [-16, 0.2, -16, 16, 6, 18], 0xffe0b0, 0.05); S.add(this.dust);
      this.puffTex = KIT.glowTex(w);

      w.receiveAll();
      this.baked = w.bake();

      /* ---------- sound ---------- */
      const b = env.bus;
      this.palmsN = SND.noise(b, { color: 'pink', type: 'highpass', freq: 1800, gain: 0.02 });
      SND.lfo(b, this.palmsN.gain && this.palmsN.gain.gain, 0.13, 0.012);
      this.air = SND.noise(b, { color: 'brown', type: 'lowpass', freq: 400, gain: 0.04 });
      this.hum = SND.drone(b, 73.42, { vowel: 'm', gain: 0 });
      this.voiceClock = 2; this.birdClock = 1.5; this.wellClock = 4;

      w.activity('Lay the foundation', 12, 'Take a stone from a pile, then set it in a chalk place of the same size.');

      // arrival: a slow crane down from above the palm crowns onto the chalk foundation, ending at your eyes
      w.cinematic([
        { p: [14, 34, 34], l: [CX, 0, -4] },
        { p: [9, 15, 24], l: [CX, 0, -4] },
        { p: [5.5, 7, 19], l: [CX - 1, 0, -4] },
        { p: [1, 3.2, 17.5], l: [-3, 0.5, 4] },
        { p: [-1, 1.62, 15], l: [-0.2, 1.4, 5] },
      ], 10);
    },

    take(env, size) {
      const w = this.w;
      if (this.carrying === size) { this.carrying = null; this.held.visible = false; SND.knock(env.bus, { f: 120, gain: 0.18, click: 1500 }); w.speed = 3; w.step('Take a stone from a pile, then set it in a chalk place of the same size.'); return; }
      const swap = !!this.carrying;
      this.carrying = size; this.held.geometry = this.geos[size]; this.held.visible = true; this.lift = 1;
      w.speed = size === 'l' ? 2.2 : size === 'm' ? 2.6 : 3;
      SND.knock(env.bus, { f: size === 'l' ? 80 : size === 'm' ? 100 : 130, gain: 0.3, click: 1600 }); SND.step(env.bus, { gain: 0.2, f: 900 });
      w.step(`Carry the ${SIZES[size].name} stone to a chalk place of its size; those places glow.`);
      if (!this.saidCarry && !swap) { this.saidCarry = true; w.say('Stones for the Mosque', 'A report in al-Tabarani says that the Prophet ﷺ carried stones for the mosque at Quba himself, alongside his companions.', { ms: 10000 }); }
    },

    trySet(env, sl) {
      const w = this.w, T = THREE;
      if (this.carrying !== sl.size) {
        // it simply does not fit: the stone stays in your hands
        this.shake = 1; sl.flash = 1;
        SND.knock(env.bus, { f: 150, gain: 0.12, click: 900 });
        return;
      }
      sl.filled = true; this.carrying = null; this.held.visible = false; w.speed = 3;
      const m = new T.Mesh(this.geos[sl.size], this.stoneMat); m.userData.dynamic = true; m.castShadow = m.receiveShadow = true;
      const from = w.camera.localToWorld(this.heldHome.clone());
      m.position.copy(from); m.rotation.copy(this.held.rotation); w.scene.add(m);
      const d = SIZES[sl.size].dim;
      this.flying.push({ m, sl, from, to: new T.Vector3(sl.x, d[1] / 2, sl.z), rot: sl.rot ? Math.PI / 2 : 0, t: 0 });
    },

    landed(env, f) {
      const w = this.w, T = THREE;
      this.placed++;
      const i = this.placed - 1, sp = w.spatial(f.to, 8);
      SND.knock(env.bus, { f: 95, gain: 0.4, click: 1800, pan: sp.pan });
      SND.sing(env.bus, NOTES[i], { vowel: 'o', dur: 2.6, gain: 0.05, voices: 2, attack: 0.04, hold: 0.3, breath: 0.06 });
      if (i >= 4) SND.sing(env.bus, NOTES[i - 4] , { vowel: 'a', dur: 3, gain: 0.025, voices: 2, attack: 0.3, delay: 0.1 });
      const p = new T.Sprite(new T.SpriteMaterial({ map: this.puffTex, color: 0xe8d0a8, transparent: true, opacity: 0.6, depthWrite: false }));
      p.position.copy(f.to); p.position.y = 0.2; p.scale.setScalar(0.5); w.scene.add(p); this.puffs.push({ p, t: 0 });
      f.squash = 0.35;
      w.progress(this.placed, this.placed < 12 ? 'Each stone sings a little higher. Find the next stone and its place.' : 'The foundation is laid.');
      if (this.placed === 4) w.say('Among Banu ‘Amr ibn ‘Awf', 'He stayed in Quba among the clan of Banu ‘Amr ibn ‘Awf for some ten nights or more, and founded the mosque there (Sahih al-Bukhari 3906). Another report says fourteen nights (Sahih al-Bukhari 428).', { ms: 12000 });
      if (this.placed === 8) w.say('Every Saturday', 'Long after the move into the city, he kept coming back: <span class="q">“The Prophet ﷺ used to come to the Mosque of Quba every Saturday, walking or riding.”</span> (Sahih al-Bukhari 1193; Sahih Muslim 1399)', { ar: 'كَانَ النَّبِيُّ ﷺ يَأْتِي مَسْجِدَ قُبَاءٍ كُلَّ سَبْتٍ مَاشِيًا وَرَاكِبًا', ms: 12000 });
      if (this.placed === 12) { this.phase = 'hush'; this.seqT = 0; w.step('Be still a moment.'); }
    },

    update(env, dt) {
      const w = this.w; if (!w) return;
      w.update(dt);
      const t = w.time, T = THREE;
      KIT.driftDust(this.dust, dt, t, [0.08, 0.02]);

      // the stone in your hands: it lifts when taken, and shakes when it does not fit
      this.lift = Math.max(0, this.lift - dt * 3); this.shake = Math.max(0, this.shake - dt * 2.2);
      this.held.position.set(this.heldHome.x + Math.sin(t * 40) * 0.03 * this.shake, this.heldHome.y - this.lift * 0.25 + Math.sin(w.bob) * 0.01, this.heldHome.z);
      this.held.rotation.z = Math.sin(t * 34) * 0.12 * this.shake;

      // guiding light: matching places glow while you carry; piles glow when your hands are empty
      SLOTS.forEach((sl, i) => {
        sl.flash = Math.max(0, sl.flash - dt * 1.5);
        const match = !sl.filled && this.carrying === sl.size && this.phase === 'build';
        const target = match ? 0.55 + 0.25 * Math.sin(t * 3 + i) : 0;
        sl.glow.material.opacity = U.damp(sl.glow.material.opacity, target, 6, dt);
        sl.mat.opacity = sl.filled ? Math.max(0, sl.mat.opacity - dt) : 0.55 + (match ? 0.4 : 0) + sl.flash * 0.45 * (0.5 + 0.5 * Math.sin(t * 20));
        sl.mat.color.setRGB(1, 0.97 - sl.flash * 0.15, 0.88 - sl.flash * 0.3);
      });
      PILES.forEach((pl, i) => { pl.glow.material.opacity = U.damp(pl.glow.material.opacity, !this.carrying && this.phase === 'build' ? 0.32 + 0.12 * Math.sin(t * 2 + i) : 0, 4, dt); });

      // stones in flight settle with a little weight
      for (const f of this.flying) {
        if (!f.done) {
          f.t = Math.min(1, f.t + dt * 1.8);
          const k = U.easeOut(f.t);
          f.m.position.lerpVectors(f.from, f.to, k); f.m.position.y += Math.sin(f.t * Math.PI) * 0.6;
          f.m.rotation.x = U.lerp(0.25, 0, k); f.m.rotation.y = U.lerp(0.35, f.rot, k);
          if (f.t >= 1) { f.done = true; this.landed(env, f); }
        } else if (f.squash > 0) {
          f.squash = Math.max(0, f.squash - dt); const s = Math.sin(f.squash / 0.35 * Math.PI) * 0.12;
          f.m.scale.set(1 + s, 1 - s, 1 + s);
        }
      }
      for (const p of this.puffs) { p.t += dt; p.p.scale.setScalar(0.5 + p.t * 2.2); p.p.material.opacity = Math.max(0, 0.6 - p.t * 0.8); p.p.position.y += dt * 0.3; }
      this.puffs = this.puffs.filter(p => { if (p.t > 0.8) { w.scene.remove(p.p); p.p.material.dispose(); return false; } return true; });

      // the revelation: near-silence, then the walls rise, the roof spreads and the doves settle
      if (this.phase !== 'build') {
        const T0 = this.seqT, T1 = (this.seqT += dt), at = s => T0 < s && T1 >= s;
        this.palmsN.set('gain', this.phase === 'hush' ? 0.004 : 0.02, 0.8);
        if (this.phase === 'hush' && T1 > 2.5) { this.phase = 'rise'; this.seqT = 0; }
        if (this.phase === 'rise' || this.phase === 'still') {
          if (at(0.01)) { SND.swell(env.bus, { f0: 80, f1: 300, dur: 6, gain: 0.12, color: 'brown' }); SND.glow(env.bus, 146.83, { gain: 0.06, dur: 14, vowel: 'a' }); this.walls.forEach(g => { g.visible = true; }); }
          const wk = U.smooth(0, 5, T1);
          this.walls.forEach((g, i) => { g.scale.y = Math.max(0.001, U.smooth(i * 0.25, 4 + i * 0.25, T1)); });
          if (at(2.5)) this.pillars.forEach(p => { p.visible = true; });
          this.pillars.forEach((p, i) => { p.scale.y = Math.max(0.001, U.smooth(2.5 + i * 0.3, 4.5 + i * 0.3, T1)); });
          if (at(5)) { this.roof.visible = true; SND.swell(env.bus, { color: 'pink', type: 'bandpass', f0: 600, f1: 2400, dur: 4.5, gain: 0.06, q: 1.5 }); SND.glow(env.bus, 220, { gain: 0.05, dur: 12, delay: 0.3, vowel: 'o' }); }
          this.roof.scale.z = Math.max(0.001, U.easeOut(U.smooth(5, 9.5, T1)));
          if (at(7)) { this.doveMesh.visible = true; this.doveStart = true; }
          if (at(8.5)) { SND.glow(env.bus, 293.66, { gain: 0.06, dur: 12, vowel: 'a' }); w.say('Founded on Piety', 'Many scholars hold that the Mosque of Quba is the one the Qur’an describes: <span class="q">“A mosque founded on piety from the first day is more worthy for you to stand in.”</span> (Qur’an 9:108) Others say it is the Prophet’s Mosque in Madinah (Sahih Muslim 1398).', { ar: 'لَمَسْجِدٌ أُسِّسَ عَلَى التَّقْوَىٰ مِنْ أَوَّلِ يَوْمٍ أَحَقُّ أَن تَقُومَ فِيهِ', ms: 16000 }); }
          if (at(17)) w.say('Like an ‘Umrah', '<span class="q">“Prayer in the Mosque of Quba is like an ‘umrah.”</span> (Jami‘ at-Tirmidhi 324; Sunan Ibn Majah 1411)', { ar: 'الصَّلَاةُ فِي مَسْجِدِ قُبَاءٍ كَعُمْرَةٍ', ms: 12000 });
          if (at(21) && !this.done) { this.done = true; this.phase = 'still'; w.finish('The first mosque stands at Quba'); }
          void wk;
        }
      }
      // doves glide in from the palms and settle along the wall tops
      if (this.doveStart) {
        const M = new T.Matrix4(), Q = new T.Quaternion(), P = new T.Vector3(), Sv = new T.Vector3();
        this.doves.forEach((d, i) => {
          d.t += dt / 4;
          const k = U.clamp(d.t), e = U.ease(k);
          P.lerpVectors(d.from, d.to, e); P.y += Math.sin(k * Math.PI) * 3;
          if (k >= 1) { P.copy(d.to); P.y += Math.abs(Math.sin(t * 5 + d.ph)) * 0.015 * (Math.sin(t * 0.7 + d.ph) > 0.6 ? 1 : 0); }
          const dir = k < 1 ? Math.atan2(d.to.z - d.from.z, d.to.x - d.from.x) : d.ph;
          Q.setFromAxisAngle(T.Object3D.DefaultUp, -dir);
          Sv.set(1, k < 1 && k > 0 ? 0.6 + Math.abs(Math.sin(t * 20 + i)) * 0.8 : 1, 1);
          if (k <= 0) Sv.setScalar(0.0001);
          M.compose(P, Q, Sv); this.doveMesh.setMatrixAt(i, M);
          if (k >= 1 && !d.landed) { d.landed = true; if (i % 3 === 0) SND.coo(env.bus, { gain: 0.04, pan: w.spatial(d.to, 6).pan }); for (let j = 0; j < 4; j++) SND.swell(env.bus, { color: 'white', type: 'bandpass', f0: 900, f1: 2000, dur: 0.07, gain: 0.02, delay: j * 0.06, q: 1.5 }); }
        });
        this.doveMesh.instanceMatrix.needsUpdate = true;
      }

      // sound layers: palms by stillness of the air, a hum that grows with the foundation, village murmurs
      this.hum.setGain(this.placed * 0.0028, 1.5);
      this.voiceClock -= dt;
      if (this.voiceClock < 0 && this.phase !== 'hush') {
        this.voiceClock = 2.5 + Math.random() * 4;
        const src = U.pick([{ x: -24, z: -18 }, { x: 22, z: -20 }, { x: -22, z: 12 }, { x: 26, z: -6 }]), sp = w.spatial(src, 14);
        SND.sing(env.bus, U.rnd(110, 170), { vowel: U.pick(['a', 'o', 'm']), dur: U.rnd(0.4, 0.9), gain: 0.02 * sp.gain + 0.003, pan: sp.pan, breath: 0.3, attack: 0.05, hold: 0.3, vib: 0.002 });
      }
      this.birdClock -= dt;
      if (this.birdClock < 0 && this.phase !== 'hush') { this.birdClock = 1.2 + Math.random() * 3; Math.random() < 0.55 ? SND.chirp(env.bus, { gain: 0.016 }) : SND.coo(env.bus, { gain: 0.02 }); }
      this.wellClock -= dt;
      if (this.wellClock < 0) { this.wellClock = 2 + Math.random() * 3; const sp = w.spatial(WELL, 4); if (sp.gain > 0.05) SND.drop(env.bus, { f: U.rnd(400, 800), gain: 0.06 * sp.gain, pan: sp.pan }); }
    },
  }));
})();
