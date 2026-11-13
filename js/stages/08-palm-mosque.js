/* Madinah — The Mosque of Palm Trunks, 1 AH / 622 CE.
   Genre: construction builder (Townscaper, Minecraft creative). The date-drying yard where the camel
   knelt, among the palm gardens and mud-brick houses of Madinah, with the black lava of the harrah
   and the long red ridge of Uhud on the horizon. A chalk plan lies on the ground; from a crane's view
   you set palm trunks in a row and as pillars, raise mud-brick walls course by course, paint a roof
   of fronds over the trunks (it only holds where it is carried), lay the Suffah and set the minbar's
   three steps. Then you stand inside what you built, and the old trunk weeps until it is held.
   Feeling: belonging, many hands. Colour script: morning sand and mud brick; palm green; gold only
   for the plan and the piece in hand. */
(function () {
  'use strict';
  if (!window.WORLD) return;
  const T = THREE;

  /* ---------------- the plan (metres; north is -z, the qibla wall to the south is +z) ---------------- */
  const G = 3, X0 = -16.5, Z0 = -18, NI = 11, NJ = 12;           // vertices i 0..11, j 0..12
  const vx = i => X0 + i * G, vz = j => Z0 + j * G;
  const WALL_H = 2.7;
  const DOORS = { west: 6, east: 4, north: 5 };                   // edge index of each doorway
  const PLAN = { palisade: [], pillar: [], wall: [], roof: [], suffah: [], minbar: [] };
  for (let i = 0; i < NI; i++) PLAN.palisade.push(`p:${i}`);
  for (let j = 10; j <= 11; j++) for (let i = 1; i < NI; i++) PLAN.pillar.push(`c:${i}:${j}`);
  for (let j = 0; j < NJ; j++) { if (j !== DOORS.west) PLAN.wall.push(`w:0:${j}:z`); if (j !== DOORS.east) PLAN.wall.push(`w:${NI}:${j}:z`); }
  for (let i = 0; i < NI; i++) if (i !== DOORS.north) PLAN.wall.push(`w:${i}:0:x`);
  for (let j = 10; j <= 11; j++) for (let i = 0; i < NI; i++) PLAN.roof.push(`r:${i}:${j}`);
  for (let i = 0; i < NI; i++) PLAN.suffah.push(`s:${i}`);
  const MINBAR = { x: 3, z: 16.4 }, TRUNK = { i: 6, j: 11 };       // the trunk he leaned on stands beside the minbar
  const PARTS = [
    { title: 'Part 1 of 4 · The trunks', step: 'Drag along the gold line to set the trunks in a row, then set the pillars on the gold points', need: ['palisade', 'pillar'], tool: 'trunk' },
    { title: 'Part 2 of 4 · The walls', step: 'Drag along the three gold lines to raise mud-brick walls; leave the doorways open', need: ['wall'], tool: 'wall' },
    { title: 'Part 3 of 4 · The roof of fronds', step: 'Paint fronds over the hall; they hold only where trunks or walls carry every corner', need: ['roof'], tool: 'roof' },
    { title: 'Part 4 of 4 · The Suffah and the minbar', step: 'In later years: paint the Suffah along the north wall, and set the minbar’s three steps', need: ['suffah', 'minbar'], tool: 'suffah' },
  ];
  const TOOLS = [
    { id: 'trunk', label: 'Palm trunk', key: '1', glyph: '❘' },
    { id: 'wall', label: 'Mud brick', key: '2', glyph: '▤' },
    { id: 'roof', label: 'Fronds', key: '3', glyph: '≋' },
    { id: 'suffah', label: 'Suffah', key: '4', glyph: '▭' },
    { id: 'minbar', label: 'Minbar', key: '5', glyph: '⊓' },
  ];

  /* ---------------- ground ---------------- */
  function H(x, z) {
    const d = Math.max(Math.abs(x) - 26, Math.abs(z) - 26, 0);
    let y = (SCAPE.fbm(x * 0.008, z * 0.008 + 4, 3) * 2.2 + SCAPE.fbm(x * 0.05, z * 0.05, 2) * 0.3) * U.smooth(0, 30, d);
    y += U.smooth(0, 6, d) * 0.15 * SCAPE.fbm(x * 0.3, z * 0.3, 2);
    // the black lava of the harrah, east and west
    const hw = U.smooth(230, 330, Math.abs(x)); y += hw * (6 + 10 * SCAPE.ridge(x * 0.02, z * 0.02, 3));
    // Uhud: a long red granite ridge to the north
    const u = Math.exp(-Math.pow((z + 680) / 70, 2)) * U.smooth(520, 260, Math.abs(x + 40));
    y += u * (150 + 90 * SCAPE.ridge(x * 0.006 + 2, z * 0.01, 4));
    const r = Math.hypot(x, z); y += U.smooth(500, 760, r) * (40 + 80 * SCAPE.ridge(x * 0.004, z * 0.004 + 3, 4));
    return y;
  }

  /* ---------------- geometry ---------------- */
  function trunkGeo(h, r0) {
    const g = new T.CylinderGeometry(r0 * 0.85, r0, h, 10, 6, false); g.translate(0, h / 2, 0);
    const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i) / h, a = Math.atan2(p.getZ(i), p.getX(i)); const k = 1 + 0.06 * Math.sin(y * 40 + a * 2) * (y < 0.98 ? 1 : 0); p.setX(i, p.getX(i) * k); p.setZ(i, p.getZ(i) * k); }
    g.computeVertexNormals(); return g;
  }
  function wallGeo() {
    // one 3 m length of wall: a slightly battered mud-brick body; uneven top
    const g = new T.BoxGeometry(G + 0.02, WALL_H, 0.7, 6, 6, 1); g.translate(0, WALL_H / 2, 0);
    const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i); const k = 1 - (y / WALL_H) * 0.12; p.setZ(i, p.getZ(i) * k); if (y > WALL_H - 0.01) p.setY(i, y + Math.sin(p.getX(i) * 3.1) * 0.04); }
    g.computeVertexNormals(); return g;
  }
  function frondPanelGeo() {
    // three layers of fronds laid across, each a little offset; base at y = 0
    const list = [];
    for (let k = 0; k < 3; k++) { const pl = new T.PlaneGeometry(G + 0.5, G + 0.5, 3, 3); pl.rotateX(-Math.PI / 2); pl.rotateY(k * 0.5 - 0.5); pl.translate(0, 0.08 + k * 0.07, 0); const p = pl.attributes.position; for (let i = 0; i < p.count; i++) p.setY(i, p.getY(i) - 0.04 * Math.cos(p.getX(i)) * Math.cos(p.getZ(i))); list.push(pl); }
    return SCAPE.merge(list);
  }
  function beamGeo() { const g = new T.CylinderGeometry(0.11, 0.13, G + 0.4, 7); g.rotateZ(Math.PI / 2); g.translate(0, 0, 0); return g; }
  function houseGeo() {
    // a mud-brick house: body, a parapet round the flat roof, a raised stair-house at one corner
    const body = new T.BoxGeometry(1, 1, 1, 2, 2, 2); body.translate(0, 0.5, 0);
    const par = [[0, 1.04, 0.48, 1, 0.08, 0.04], [0, 1.04, -0.48, 1, 0.08, 0.04], [0.48, 1.04, 0, 0.04, 0.08, 1], [-0.48, 1.04, 0, 0.04, 0.08, 1]].map(([x, y, z, a, b, c]) => new T.BoxGeometry(a, b, c).translate(x, y, z));
    const stair = new T.BoxGeometry(0.28, 0.28, 0.28).translate(0.3, 1.14, -0.3);
    return SCAPE.merge([body, ...par, stair]);
  }
  function beamsGeo() { return SCAPE.merge([-0.36, -0.18, 0, 0.18, 0.36].map(x => new T.CylinderGeometry(0.018, 0.02, 0.12, 5).rotateX(Math.PI / 2).translate(x, 0.93, 0.53))); }
  function doorGeo() { return new T.BoxGeometry(0.16, 0.42, 0.03).translate(-0.18, 0.21, 0.505); }

  function instancer(w, geo, mat, cap, o) {
    o = o || {};
    const im = new T.InstancedMesh(geo, mat, cap); im.count = 0;
    im.castShadow = o.cast !== false; im.receiveShadow = true; im.frustumCulled = false; im.userData.dynamic = true;
    if (o.depth) im.customDepthMaterial = o.depth;
    w.scene.add(im);
    return im;
  }

  ENGINE.register(WORLD.stage({
    key: 'palm-mosque',
    arabic: 'مَسْجِدُ الجُذُوع',
    title: 'The Mosque of Palm Trunks',
    era: 'Madinah · 1 AH · 622 CE · the first Prophet’s Mosque',
    hint: 'Click or drag on the gold plan to build · 1–5 tools · Q / E or ◀ ▶ turn · wheel zoom · WASD pan · right-click removes · V to walk',
    hintTouch: 'Tap or drag on the gold plan to build · ⟲ ⟳ to turn · ✕ to remove · 🚶 to walk',
    sound: { reverb: 0.35 },
    story: `<p>When the Prophet ﷺ reached Madinah, his camel knelt in a yard for drying dates that belonged to two orphan boys, Sahl and Suhayl. He bought it, and there the first mosque of Madinah was built (Sahih al-Bukhari 3906).</p>
            <p>Its palm trees were cut down and the trunks set in a row on the side of the qibla; its door-posts were stone. The walls were mud brick, the pillars palm trunks, the roof palm fronds (Sahih al-Bukhari 428, 446). The Companions carried the stones chanting, and the Prophet ﷺ carried bricks with them.</p>`,

    enter(env) {
      const self = this;
      const w = this.w = WORLD.create(env, {
        start: { x: 0, z: 30, yaw: 0, pitch: -0.05 }, exposure: 0.82, far: 2600, speed: 3.2, run: 6.4,
        fog: { color: 0xd8c8b0, density: 0.0012 }, bounds: [-150, -150, 150, 150], ground: H,
        surface: (x, z) => (Math.abs(x) < 16.5 && Math.abs(z) < 18 ? 'stone' : 'sand'),
      });
      const S = w.scene, Q = w.quality, r = U.seeded(622);
      this.built = new Map(); this.part = -1; this.tool = 'trunk'; this.removing = false; this.mode = 'build'; this.done = false;
      this.camYaw = 0.6; this.camYawT = 0.6; this.camDist = 46; this.camDistT = 46; this.camTgt = new T.Vector3(0, 0, 2); this.camPitch = 0.86;
      this.queue = []; this.dipV = 0; this.dipGoal = 0; this.chant = 0;

      /* ---------- sky and light: morning ---------- */
      w.sky({ top: '#6f96c4', mid: '#efdcbc', bot: '#d8c8b0', sunDir: [0.88, 0.35, 0.4], sun: '#ffe6c0', sunSize: 0.0016, clouds: 0.3, haze: 0.4 });
      this.sun = new T.DirectionalLight(0xffe8c8, 1.9); this.sun.position.set(88, 35, 40); S.add(this.sun);
      S.add(new T.HemisphereLight(0xc8d8f0, 0x9a7a5a, PHOTO.enabled ? 0.08 : 0.6));
      w.followShadow(this.sun, 48, 2048);
      PHOTO.sky(w, 'qwantani_morning_puresky', { sun: this.sun, intensity: 0.75, rotation: 0.42 - 0.629, haze: '#d8c8b0', horizon: 0.45, ground: '#b89a78', bounce: 0.5 });

      /* ---------- terrain, harrah and Uhud ---------- */
      SCAPE.terrain(w, { size: 1700, seg: 320, height: H, rock: [0.82, 0.94], rockHeight: [7, 20], colors: { low: '#c8ac86', high: '#b49470', rock: '#5a4a44', dark: '#2e2624' },
        tex: 'gravel', rockTex: 'lava', photo: { ground: 'dry_ground_rocks', rock: 'dark_rock', normal: 1 }, rep: 0.22, rockRep: 0.05 });
      SCAPE.horizon(w, { haze: '#d8c8b0', layers: [{ r: 1000, h: 90, color: '#7a6458', seed: 5 }, { r: 1500, h: 130, color: '#9a8a80', seed: 9 }, { r: 2100, h: 160, color: '#b8aca4', seed: 13 }] });
      // the yard: packed earth, swept
      const yard = new T.Mesh(new T.PlaneGeometry(40, 44).rotateX(-Math.PI / 2), PHOTO.mat(w, 'dirt', { rep: [8, 9], color: 0xf0e4d4, fallback: SCAPE.tex.gravel(w, [6, 6]) }));
      yard.position.y = 0.015; yard.receiveShadow = true; S.add(yard);

      /* ---------- the plan, in chalk, on the ground ---------- */
      const pc = document.createElement('canvas'); pc.width = pc.height = 1024; this.planCtx = pc.getContext('2d');
      this.planTex = new T.CanvasTexture(pc); this.planTex.encoding = T.sRGBEncoding; this.planTex.anisotropy = 4;
      const plan = new T.Mesh(new T.PlaneGeometry(40, 40).rotateX(-Math.PI / 2), new T.MeshBasicMaterial({ map: this.planTex, transparent: true, depthWrite: false, toneMapped: false }));
      plan.position.y = 0.04; plan.renderOrder = 2; plan.material.opacity = 0; plan.userData.dynamic = true; S.add(plan); this.planMesh = plan;

      /* ---------- materials ---------- */
      const bark = PHOTO.mat(w, 'palm_tree_bark', { triplanar: 1.4, color: 0xb8a48c, fallback: KIT.bark(w) });
      const brick = PHOTO.mat(w, 'clay_block_wall', { triplanar: 0.6, color: 0xf0dcc4, fallback: KIT.mudBrick(w, [1, 1]) });
      const plaster = PHOTO.mat(w, 'clay_plaster', { triplanar: 0.35, color: 0xffeedd, fallback: SCAPE.tex.mud(w) });
      const stone = PHOTO.mat(w, 'old_stone_wall', { triplanar: 0.7, fallback: SCAPE.tex.granite(w) });
      const wood = PHOTO.mat(w, 'old_planks_02', { rep: [1, 1], fallback: KIT.wood(w, [1, 1], '#6e4a2c') });
      const beamWood = PHOTO.mat(w, 'medieval_wood', { triplanar: 1.2, color: 0xc8b4a0, fallback: KIT.wood(w) });
      const frondT = KIT.frondRoof(w, [1, 1]);
      const frond = new T.MeshStandardMaterial({ map: frondT, alphaTest: 0.5, side: T.DoubleSide, color: 0xd8c8a0, roughness: 0.9 });
      const frondDepth = new T.MeshDepthMaterial({ depthPacking: T.RGBADepthPacking, map: frondT, alphaTest: 0.5, side: T.DoubleSide });
      this.mats = { bark, brick, plaster, stone, wood, frond };

      /* ---------- the pieces you build (instanced, so a whole mosque costs a few draw calls) ---------- */
      this.inst = {
        trunk: instancer(w, trunkGeo(3.4, 0.22), bark, 140),
        wall: instancer(w, wallGeo(), brick, 60),
        foot: instancer(w, new T.BoxGeometry(G + 0.14, 0.5, 0.84).translate(0, 0.2, 0), stone, 60),
        jamb: instancer(w, new T.BoxGeometry(0.55, WALL_H + 0.3, 0.86).translate(0, (WALL_H + 0.3) / 2, 0), stone, 8),
        lintel: instancer(w, new T.BoxGeometry(G + 0.4, 0.22, 0.8), beamWood, 8),
        roof: instancer(w, frondPanelGeo(), frond, 70, { depth: frondDepth }),
        beam: instancer(w, beamGeo(), beamWood, 70),
        plat: instancer(w, new T.BoxGeometry(G, 0.42, G).translate(0, 0.21, 0), plaster, 16),
        post: instancer(w, trunkGeo(2.6, 0.13), bark, 32),
        shade: instancer(w, frondPanelGeo(), frond, 16, { depth: frondDepth }),
      };
      Object.values(this.inst).forEach(im => { im.userData.items = []; });
      // the minbar: three steps of tamarisk, raised one by one
      this.minbar = new T.Group(); this.minbar.position.set(MINBAR.x, 0, MINBAR.z); this.minbar.rotation.y = Math.PI; this.minbar.userData.dynamic = true; S.add(this.minbar);
      this.steps = [0, 1, 2].map(i => { const m = new T.Mesh(new T.BoxGeometry(0.95, 0.3, 0.55), wood); m.position.set(0, 0.15 + i * 0.3, 0.55 - i * 0.5); m.castShadow = true; m.receiveShadow = true; m.scale.setScalar(0.001); this.minbar.add(m); return m; });
      this.rails = [-0.5, 0.5].map(x => { const m = new T.Mesh(new T.BoxGeometry(0.07, 1.4, 1.7), wood); m.position.set(x, 0.7, 0.05); m.castShadow = true; m.scale.setScalar(0.001); this.minbar.add(m); return m; });
      this.minbarSteps = 0;

      // the ghost: what is in your hand, shown where it will go
      this.ghostMat = new T.MeshBasicMaterial({ color: 0xffd98a, transparent: true, opacity: 0.4, depthWrite: false });
      this.ghosts = {
        trunk: new T.Mesh(trunkGeo(3.4, 0.24), this.ghostMat), wall: new T.Mesh(wallGeo(), this.ghostMat), roof: new T.Mesh(new T.BoxGeometry(G, 0.2, G), this.ghostMat),
        suffah: new T.Mesh(new T.BoxGeometry(G, 0.5, G).translate(0, 0.25, 0), this.ghostMat), minbar: new T.Mesh(new T.BoxGeometry(1, 1.4, 1.6).translate(0, 0.7, 0), this.ghostMat),
        remove: new T.Mesh(new T.CylinderGeometry(0.7, 0.7, 0.1, 24), new T.MeshBasicMaterial({ color: 0xff9a7a, transparent: true, opacity: 0.45, depthWrite: false })),
      };
      Object.values(this.ghosts).forEach(m => { m.visible = false; m.userData.dynamic = true; m.renderOrder = 4; S.add(m); });
      this.dragLine = [];

      /* ---------- the world around: palm gardens, houses, wells, the harrah ---------- */
      const inPlot = (x, z, pad) => Math.abs(x) < 22 + (pad || 0) && Math.abs(z) < 24 + (pad || 0);
      const LANE = (x, z) => Math.abs(z - 34 - Math.sin(x * 0.03) * 4) < 4 || Math.abs(x - 34 - Math.sin(z * 0.04) * 3) < 4;
      const houses = [];
      for (let k = 0; houses.length < 64 && k < 4000; k++) {
        const a = r() * 6.283, d = 30 + Math.pow(r(), 0.7) * 110, x = Math.cos(a) * d * 1.1, z = Math.sin(a) * d;
        if (inPlot(x, z, 6) || LANE(x, z)) continue;
        const east = x > 25 && z > -60 && z < 80;  // the lane of houses to the east is densest
        if (!east && r() < 0.55) continue;
        const sx = 5 + r() * 5, sz = 5 + r() * 5, sy = 2.8 + r() * (r() < 0.25 ? 3.2 : 1.2);
        if (houses.some(h => Math.abs(h.x - x) < (h.sx + sx) / 2 + 1.5 && Math.abs(h.z - z) < (h.sz + sz) / 2 + 1.5)) continue;
        houses.push({ x, z, sx, sy, sz, ry: Math.round(r() * 4) * Math.PI / 2 + (r() - 0.5) * 0.1, s: 1, col: U.pick(['#ffffff', '#f4e4d0', '#e8d4bc', '#dcc4a8']) });
      }
      const hInst = (geo, mat) => {
        const im = new T.InstancedMesh(geo, mat, houses.length), m4 = new T.Matrix4(), q = new T.Quaternion(), c = new T.Color();
        houses.forEach((h, i) => { m4.compose(new T.Vector3(h.x, H(h.x, h.z) - 0.15, h.z), q.setFromAxisAngle(new T.Vector3(0, 1, 0), h.ry), new T.Vector3(h.sx, h.sy, h.sz)); im.setMatrixAt(i, m4); im.setColorAt(i, c.set(h.col)); });
        im.castShadow = true; im.receiveShadow = true; im.frustumCulled = false; im.userData.dynamic = true; S.add(im); return im;
      };
      hInst(houseGeo(), plaster); hInst(beamsGeo(), beamWood); hInst(doorGeo(), wood);
      houses.forEach(h => { const c = Math.abs(Math.cos(h.ry)) > 0.5; const hx = (c ? h.sx : h.sz) / 2, hz = (c ? h.sz : h.sx) / 2; w.addBox(h.x - hx, h.z - hz, h.x + hx, h.z + hz); });
      this.houses = houses;
      // Abu Ayyub's house: two storeys, by the yard
      const ab = new T.Group(); ab.position.set(30, 0, -8); S.add(ab);
      const abBody = new T.Mesh(new T.BoxGeometry(8, 6, 7).translate(0, 3, 0), plaster); abBody.castShadow = abBody.receiveShadow = true; ab.add(abBody);
      const abDoor = new T.Mesh(new T.BoxGeometry(1.1, 2.1, 0.1).translate(0, 1.05, -3.52), wood); ab.add(abDoor);
      for (let k = 0; k < 6; k++) { const bm = new T.Mesh(new T.CylinderGeometry(0.1, 0.11, 0.6, 6).rotateZ(Math.PI / 2).translate(4.1, 3.0, -3 + k * 1.2), beamWood); ab.add(bm); }
      w.addBox(26, -11.5, 34, -4.5);

      // palms: the gardens of Banu al-Najjar
      const palmArea = (x, z) => !inPlot(x, z, 4) && !LANE(x, z) && !houses.some(h => Math.abs(h.x - x) < h.sx / 2 + 2 && Math.abs(h.z - z) < h.sz / 2 + 2) && Math.hypot(x - 30, z + 8) > 8;
      const palms = SCAPE.scatter(w, { kind: 'palm', n: 340, area: [-220, -220, 220, 220], scale: [7, 13], density: (x, z) => (x < 20 ? 0.95 : 0.4) * U.smooth(-0.3, 0.2, SCAPE.fbm(x * 0.012 + 3, z * 0.012, 2)) * (1 - U.smooth(200, 230, Math.abs(x))), avoid: (x, z) => !palmArea(x, z), seed: 41, collide: 0.03 });
      if (palms.meshes[0]) palms.meshes[0].material = PHOTO.mat(w, 'palm_tree_bark', { triplanar: 1.6, color: 0xa89480, fallback: KIT.bark(w) });
      SCAPE.scatter(w, { kind: 'palm', n: 260, area: [-700, -700, 700, 700], scale: [8, 13], density: (x, z) => U.smooth(220, 260, Math.hypot(x, z)) * (1 - U.smooth(420, 500, Math.hypot(x, z))) * U.smooth(-0.2, 0.2, SCAPE.fbm(x * 0.01, z * 0.01, 2)), seed: 42, castShadow: false });
      // stumps where the yard's palms were cut
      SCAPE.scatter(w, { kind: 'model', model: 'dead_tree_trunk', n: 8, area: [-40, -30, -24, 10], scale: [0.9, 1.3], seed: 43 });
      SCAPE.scatter(w, { kind: 'model', model: 'namaqualand_stones_01', variant: 2, fallback: 'pebble', n: 1300, area: [-150, -150, 150, 150], avoid: (x, z) => inPlot(x, z, -2), scale: [0.8, 1.6], seed: 44 });
      SCAPE.scatter(w, { kind: 'model', model: 'grass_medium_01', variant: 0, fallback: 'grass', n: 700, area: [-150, -150, 150, 150], avoid: (x, z) => inPlot(x, z, 0) || LANE(x, z), scale: [0.8, 1.5], seed: 45 });
      SCAPE.scatter(w, { kind: 'grass', n: 1400, area: [-150, -150, 150, 150], avoid: (x, z) => inPlot(x, z, 0) || LANE(x, z), scale: [0.4, 0.9], color: '#d8d0a0', seed: 46, castShadow: false });
      SCAPE.scatter(w, { kind: 'model', model: 'shrub_01', variant: 0, fallback: 'shrub', n: 140, area: [-150, -150, 150, 150], avoid: (x, z) => inPlot(x, z, 2) || LANE(x, z), scale: [0.7, 1.3], seed: 47 });
      SCAPE.scatter(w, { kind: 'boulder', tex: 'lava', n: 300, area: [-700, -500, 700, 500], density: (x, z) => U.smooth(200, 260, Math.abs(x)), scale: [1.5, 6], seed: 48 });
      SCAPE.scatter(w, { kind: 'rock', tex: 'lava', n: 400, area: [-150, -150, 150, 150], avoid: (x, z) => inPlot(x, z, 0), scale: [0.2, 0.7], seed: 49 });
      SCAPE.birds(w, { n: 10, x: -40, z: 10, y: 45, r: 70 });
      this.dust = SCAPE.motes(w, { n: 120, area: [-16, 0.3, -18, 16, 3.2, 18], color: '#fff0c8', size: 0.22, opacity: 0.4 });
      const hearths = [[48, 30], [-60, 40], [60, -40]];
      SCAPE.smoke(w, { sources: hearths.map(([x, z]) => [x, H(x, z) + 3, z]), height: 16, opacity: 0.14 });

      // set dressing in the yard: bricks drying in rows, moulds, baskets of mud, water jars, the cut trunks waiting
      const brickYard = { x: -30, z: 26 };
      const brickG = new T.BoxGeometry(0.4, 0.12, 0.26);
      const brickList = []; for (let a = 0; a < 8; a++) for (let b = 0; b < 14; b++) brickList.push({ x: brickYard.x - 3.5 + b * 0.5, z: brickYard.z - 2 + a * 0.5, ry: (r() - 0.5) * 0.08, s: 1, col: U.pick(['#ffffff', '#e8dccc', '#d8c8b4']) });
      const bi = new T.InstancedMesh(brickG, brick, brickList.length); brickList.forEach((b, i) => { bi.setMatrixAt(i, new T.Matrix4().compose(new T.Vector3(b.x, H(b.x, b.z) + 0.06, b.z), new T.Quaternion().setFromAxisAngle(new T.Vector3(0, 1, 0), b.ry), new T.Vector3(1, 1, 1))); bi.setColorAt(i, new T.Color(b.col)); });
      bi.castShadow = bi.receiveShadow = true; bi.frustumCulled = false; bi.userData.dynamic = true; S.add(bi);
      [['wicker_basket_01', -26, 23, 1.3], ['jug_01', -25, 27.5, 1.5], ['ceramic_vase_01', -24.4, 28, 1.6], ['wooden_bowl_01', -25.6, 22, 1.4], ['wicker_basket_01', 21, -20, 1.2], ['jug_01', 20, 21, 1.4], ['brass_pot_01', 22, 21.6, 1.2]].forEach(([id, x, z, s]) => PHOTO.place(w, id, { pos: [x, undefined, z], s, ry: r() * 6 }));
      // the cut trunks, lying ready by the yard
      const pile = trunkGeo(5.5, 0.22); pile.rotateZ(Math.PI / 2);
      for (let k = 0; k < 7; k++) { const m = new T.Mesh(pile, bark); m.position.set(-23 + (k % 4) * 0.02, 0.22 + Math.floor(k / 4) * 0.4, -6 + (k % 4) * 0.46 + Math.floor(k / 4) * 0.23); m.castShadow = m.receiveShadow = true; S.add(m); }
      w.addBox(-26, -6.5, -20, -3.5);
      // drying dates on mats where the camel knelt (the yard's old use)
      const matTex = w.tex(128, (g, s) => { g.fillStyle = '#b89a60'; g.fillRect(0, 0, s, s); for (let i = 0; i < s; i += 6) { g.fillStyle = i % 12 ? 'rgba(90,60,30,.25)' : 'rgba(255,230,180,.2)'; g.fillRect(0, i, s, 3); } for (let i = 0; i < 260; i++) { g.fillStyle = U.pick(['#6a2a14', '#7a3a1a', '#5a2410', '#8a4a20']); g.beginPath(); g.ellipse(Math.random() * s, Math.random() * s, 3, 2, Math.random() * 3, 0, 6.3); g.fill(); } }, [1, 1]);
      [[24, 10], [26.6, 12], [24.2, 13.4]].forEach(([x, z], k) => { const m = new T.Mesh(new T.PlaneGeometry(2.2, 1.4).rotateX(-Math.PI / 2), KIT.std({ map: matTex })); m.position.set(x, 0.05, z); m.rotation.y = k * 0.3; m.receiveShadow = true; S.add(m); });
      // a well with a low curb by the gardens
      const well = new T.Mesh(new T.CylinderGeometry(1.4, 1.5, 0.8, 16, 1, true), stone); well.position.set(-46, H(-46, -24) + 0.4, -24); well.castShadow = true; S.add(well); w.addCircle(-46, -24, 1.6);
      const wellIn = new T.Mesh(new T.CircleGeometry(1.35, 16).rotateX(-Math.PI / 2), new T.MeshBasicMaterial({ color: 0x0a0806 })); wellIn.position.set(-46, H(-46, -24) + 0.3, -24); S.add(wellIn);

      this.post = w.post({ bloom: 0.45, threshold: 0.75, rays: { strength: 0.28, dir: [0.88, 0.35, 0.4] }, vignette: 0.34, grain: 0.03, sat: 1.05, contrast: 1.06, lift: [0.01, 0.008, 0], gain: [1.03, 1.0, 0.96] });
      w.bake();

      /* ---------- discoveries ---------- */
      const D = (x, z, h, o) => w.discover(Object.assign({ pos: [x, H(x, z) + (h || 1.3), z] }, o));
      D(25.4, 14.6, 1.1, { title: 'A yard for drying dates', label: 'Look at the dates', text: 'His camel knelt here, in a yard for drying dates that belonged to two orphan boys, Suhayl and Sahl, under the care of As‘ad ibn Zurarah. They offered it as a gift; he bought it from them, to make it a mosque. (Sahih al-Bukhari 3906)' });
      D(30, -12.6, 1.6, { title: 'The house of Abu Ayyub', label: 'Stand at the door', text: 'Arriving among Banu al-Najjar, he alighted in the courtyard of Abu Ayyub al-Ansari, and the building of the mosque began nearby. (Sahih al-Bukhari 428)' });
      D(brickYard.x + 1, brickYard.z - 3.4, 1.0, { title: 'Bricks in the sun', label: 'Look at the bricks', text: 'The Prophet ﷺ carried bricks with them for the building, saying: <span class="q">“This load is not the load of Khaybar; this is more dutiful, our Lord, and purer.”</span> (Sahih al-Bukhari 3906)', ar: 'هَذَا الْحِمَالُ لَا حِمَالَ خَيْبَرْ، هَذَا أَبَرُّ رَبَّنَا وَأَطْهَرْ' });
      D(-32, -14, 1.3, { title: 'The palms of the yard', label: 'Look at the stumps', text: 'He had the date palms on the site cut down; their trunks were set in a row on the side of the qibla, and the door-posts were made of stone. (Sahih al-Bukhari 428)' });
      D(-23, -3, 1.4, { title: 'A chant while working', label: 'Listen', text: 'They carried the stones chanting, and he was with them, saying: <span class="q">“O God, there is no good but the good of the Hereafter; so forgive the Ansar and the Emigrants.”</span> (Sahih al-Bukhari 428)', ar: 'اللَّهُمَّ لَا خَيْرَ إِلَّا خَيْرُ الْآخِرَهْ، فَاغْفِرْ لِلْأَنْصَارِ وَالْمُهَاجِرَهْ' });
      this.discRoof = { title: 'Rain through the fronds', text: 'The roof was palm fronds. On a night of rain in Ramadan water came through, and after the dawn prayer the traces of mud and water were on his forehead. (Sahih al-Bukhari 2027)' };
      this.discSuffah = { title: 'The people of the Suffah', text: 'The Suffah was home to poor Companions, “the guests of Islam”, who had no family or wealth; Abu Hurayrah was closely tied to them. (Sahih al-Bukhari 6452)' };

      /* ---------- the builder's tool bar ---------- */
      const L = w.ui.layer, touchy = matchMedia('(pointer: coarse)').matches;
      const bar = this.bar = document.createElement('div');
      bar.style.cssText = 'position:absolute;left:50%;bottom:calc(env(safe-area-inset-bottom,0px) + 96px);transform:translateX(-50%);display:flex;gap:8px;align-items:center;padding:6px 10px;border-radius:999px;background:rgba(6,9,20,.5);border:1px solid rgba(242,233,214,.18);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);opacity:0;transition:opacity .4s;pointer-events:auto;';
      const mkBtn = (html, title, fn, extra) => { const b = document.createElement('button'); b.type = 'button'; b.title = title; b.setAttribute('aria-label', title); b.innerHTML = html;
        b.style.cssText = `min-width:${touchy ? 50 : 42}px;height:${touchy ? 50 : 42}px;border-radius:21px;border:1px solid rgba(242,233,214,.25);background:rgba(255,255,255,.04);color:#f6efe2;font-family:var(--f-display),serif;font-size:.62rem;letter-spacing:.06em;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;cursor:pointer;padding:0 6px;touch-action:none;${extra || ''}`;
        b.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); SND.init(); fn(); }); bar.appendChild(b); return b; };
      this.toolBtns = {};
      TOOLS.forEach(t => { this.toolBtns[t.id] = mkBtn(`<span style="font-size:1rem;line-height:1">${t.glyph}</span><span>${t.key} ${t.label}</span>`, t.label, () => this.setTool(t.id)); });
      const sep = document.createElement('i'); sep.style.cssText = 'width:1px;height:28px;background:rgba(242,233,214,.2)'; bar.appendChild(sep);
      this.rmBtn = mkBtn('<span style="font-size:1rem">✕</span><span>remove</span>', 'Remove', () => { this.removing = !this.removing; this.syncTools(); });
      mkBtn('<span style="font-size:1rem">⟲</span>', 'Turn left', () => { this.camYawT += Math.PI / 4; SND.swell(env.bus, { f0: 300, f1: 700, dur: 0.5, gain: 0.02 }); });
      mkBtn('<span style="font-size:1rem">⟳</span>', 'Turn right', () => { this.camYawT -= Math.PI / 4; SND.swell(env.bus, { f0: 700, f1: 300, dur: 0.5, gain: 0.02 }); });
      this.walkBtn = mkBtn('<span style="font-size:1rem">🚶</span><span>V walk</span>', 'Walk the site', () => this.toggleWalk());
      L.appendChild(bar);
      this.fadeEl = L.querySelector('.w-fade');

      /* ---------- input ---------- */
      const host = document.getElementById('host');
      this.noMenu = e => { if (this.mode === 'build') e.preventDefault(); };
      host.addEventListener('contextmenu', this.noMenu);
      w.onPointer = (e, p, phase) => {
        if (this.mode !== 'build' || w.filmS) return false;
        if (phase === 'down') {
          const hit = this.pick(e.clientX, e.clientY); if (!hit) return true;
          this.drag = { start: hit, cur: hit, remove: this.removing || e.button === 2 };
          this.updateDrag();
        } else if (phase === 'up' && this.drag) { this.commitDrag(); this.drag = null; }
        return true;
      };
      // a tick keeps the shadow camera over the yard while the builder's camera is up
      w.tick(() => {
        if (!w._shadow || !(w.mode || w.filmS)) return;
        const L2 = w._shadow.light; L2.target.position.set(this.camTgt.x, 0, this.camTgt.z); L2.position.copy(L2.target.position).add(w._shadow.off);
      });

      /* ---------- sound ---------- */
      const b = env.bus;
      this.breeze = SND.noise(b, { color: 'pink', type: 'bandpass', freq: 520, q: 0.6, gain: 0.035 });
      this.leaves = SND.noise(b, { color: 'white', type: 'bandpass', freq: 5200, q: 0.8, gain: 0.005 });
      SND.lfo(b, this.leaves.gain && this.leaves.gain.gain, 0.13, 0.004);
      this.choir = SND.drone(b, 146.83, { vowel: 'a', gain: 0 });
      this.birdClock = 1; this.sobClock = 2; this.soothed = 0;

      this.drawPlan();
      w.activity(PARTS[0].title, 1, PARTS[0].step);
    },

    film(env, w) {
      return [
        { dur: 7, fade: 'dip', title: true, fov: [46, 40], path: [[[-160, 70, 150], [0, 0, 0]], [[-110, 52, 120], [0, 0, -10]], [[-70, 40, 95], [0, 0, -20]]] },
        { dur: 6.5, fade: 'dip', line: 'His camel knelt here, in a yard for drying dates.', ar: 'بَرَكَتْ نَاقَتُهُ عِنْدَ مِرْبَدٍ لِلتَّمْرِ', lineAt: 0.6, fov: [42, 36],
          path: [[[34, 2.2, 22], [25, 0.4, 12]], [[30, 1.6, 18], [25, 0.3, 12]]] },
        { dur: 6.5, fade: 'cut', line: 'It belonged to two orphan boys, Sahl and Suhayl. He bought it.', ar: 'كَانَ لِغُلَامَيْنِ يَتِيمَيْنِ سَهْلٍ وَسُهَيْلٍ، فَابْتَاعَهُ مِنْهُمَا', lineAt: 0.5,
          path: [[[-36, 9, 36], [0, 0, 0]], [[-27, 5, 30], [2, 0, -2]]] },
        { dur: 6.5, fade: 'dip', line: 'The palms were cut, and the trunks laid ready.', ar: 'فَأَمَرَ بِالنَّخْلِ فَقُطِعَ', lineAt: 0.5,
          path: [[[-14, 2, -10], [-23, 0.6, -4.6]], [[-17, 1.4, -1], [-23, 0.5, -4.8]]] },
        { dur: 6.5, fade: 'cut', lines: [[0.4, 'Bricks of mud dried in the sun.', ''], [2.8, '“This load is not the load of Khaybar…” (Sahih al-Bukhari 3906)', 'هَذَا الْحِمَالُ لَا حِمَالَ خَيْبَرْ']],
          path: [[[-36, 1.3, 30], [-30, 0.2, 26]], [[-26, 1.8, 31], [-31, 0.2, 25]]] },
        { dur: 7, fade: 'white', line: 'Many hands built it. Build it from the plan.', ar: 'بَنَتْهُ أَيْدٍ كَثِيرَةٌ؛ ابْنِهِ عَلَى الْمُخَطَّط', lineAt: 0.8,
          path: [[[0, 70, 8], [0, 0, 0]], [[14, 42, 32], [0, 0, 2]]], fov: [40, 50],
          during: (w, k) => { this.planMesh.material.opacity = U.smooth(0.2, 0.8, k); } },
      ];
    },
    filmOpts: {
      end(w) { const st = ENGINE.cur; if (!st || !st.inst) return; st.planMesh.material.opacity = 1; st.startPart(0); },
    },

    /* ---------------- building ---------------- */
    startPart(n) {
      const w = this.w; this.part = n; const P = PARTS[n];
      const total = P.need.reduce((a, k) => a + PLAN[k].length, 0);
      w.activity(P.title, total, P.step);
      if (n === 0) this.camFromFilm = true;
      this.setTool(P.tool);
      this.enterBuild();
      this.drawPlan(); this.updateProgress();
    },
    enterBuild() {
      const w = this.w; this.mode = 'build';
      if (!this.camFn) this.camFn = dt => this.buildCam(dt);
      w.mode = this.camFn; this.bar.style.opacity = 1; w.goal(null);
      this.walkBtn.innerHTML = '<span style="font-size:1rem">🚶</span><span>V walk</span>';
    },
    toggleWalk() {
      const w = this.w; if (this.part < 0 || this.done) return;
      if (this.mode === 'build') {
        this.mode = 'walk'; w.mode = null; Object.values(this.ghosts).forEach(g => { g.visible = false; });
        const c = w.camera.position; w.pos.set(U.clamp(c.x * 0.4, -30, 30), 0, U.clamp(c.z * 0.4 + 20, -30, 40)); w.yaw = Math.atan2(w.pos.x, w.pos.z); w.pitch = -0.05;
        this.walkBtn.innerHTML = '<span style="font-size:1rem">⌂</span><span>V build</span>';
        Array.from(this.bar.children).forEach(ch => { if (ch !== this.walkBtn) ch.style.visibility = 'hidden'; });
        w.step('Walking the site · press V (or ⌂) to return to the plan');
      } else {
        Array.from(this.bar.children).forEach(ch => { ch.style.visibility = ''; });
        this.enterBuild(); w.step(PARTS[this.part].step);
      }
    },
    setTool(id) {
      if (this.part < 0) return;
      const P = PARTS[this.part];
      // tools unlock part by part
      const allowed = TOOLS.slice(0, Math.min(5, this.part === 3 ? 5 : this.part + 1)).map(t => t.id);
      if (!allowed.includes(id)) return;
      this.tool = id; this.removing = false; this.syncTools();
      if (ENGINE.env) SND.bell(ENGINE.env.bus, 660, { gain: 0.015, glass: true });
      void P;
    },
    syncTools() {
      const allowed = TOOLS.slice(0, this.part === 3 ? 5 : this.part + 1).map(t => t.id);
      TOOLS.forEach(t => { const b = this.toolBtns[t.id]; const on = t.id === this.tool && !this.removing; b.style.background = on ? 'linear-gradient(180deg,#f0d48f,#cfa250)' : 'rgba(255,255,255,.04)'; b.style.color = on ? '#1a1206' : '#f6efe2'; b.style.opacity = allowed.includes(t.id) ? 1 : 0.3; });
      this.rmBtn.style.background = this.removing ? 'rgba(255,140,110,.5)' : 'rgba(255,255,255,.04)';
    },
    // where the pointer meets the ground, snapped to the plan's grid
    pick(cx, cy) {
      const w = this.w, env = ENGINE.env;
      const nd = new T.Vector2(cx / env.w * 2 - 1, -(cy / env.h) * 2 + 1);
      const ray = this._ray || (this._ray = new T.Raycaster()); ray.setFromCamera(nd, w.camera);
      const o = ray.ray.origin, d = ray.ray.direction; if (d.y > -0.01) return null;
      const t = -o.y / d.y, x = o.x + d.x * t, z = o.z + d.z * t;
      if (Math.abs(x) > 24 || Math.abs(z) > 26) return null;
      return { x, z, fi: (x - X0) / G, fj: (z - Z0) / G };
    },
    // the plan key under a point for the current tool, or a free spot for creative placement
    target(h, tool) {
      const vi = Math.round(h.fi), vj = Math.round(h.fj), ci = Math.floor(h.fi), cj = Math.floor(h.fj);
      if (tool === 'trunk') {
        if (vj === 12 || (Math.abs(h.fj - 12) < 0.35 && h.fi >= 0 && h.fi <= NI)) { const i = U.clamp(Math.floor(h.fi), 0, NI - 1); return { key: `p:${i}`, kind: 'palisade' }; }
        if (Math.hypot(h.fi - vi, h.fj - vj) < 0.35 && vi > 0 && vi < NI && vj > 0 && vj < NJ) return { key: `c:${vi}:${vj}`, kind: 'pillar' };
        return { key: `f:${(h.x * 2 | 0)}:${(h.z * 2 | 0)}`, kind: 'free', x: Math.round(h.x * 2) / 2, z: Math.round(h.z * 2) / 2 };
      }
      if (tool === 'wall') {
        // nearest grid line
        const dI = Math.abs(h.fi - vi), dJ = Math.abs(h.fj - vj);
        if (dI < dJ) { const j = U.clamp(Math.floor(h.fj), 0, NJ - 1); if (vi < 0 || vi > NI) return null; return { key: `w:${vi}:${j}:z`, kind: 'wall' }; }
        const i = U.clamp(Math.floor(h.fi), 0, NI - 1); if (vj < 0 || vj > NJ) return null; return { key: `w:${i}:${vj}:x`, kind: 'wall' };
      }
      if (tool === 'roof') { if (ci < 0 || ci >= NI || cj < 0 || cj >= NJ) return null; return { key: `r:${ci}:${cj}`, kind: 'roof' }; }
      if (tool === 'suffah' || tool === 'minbar') { if (this.part === 3 && Math.hypot(h.x - MINBAR.x, h.z - MINBAR.z) < 1.6) return { key: 'minbar', kind: 'minbar' }; }
      if (tool === 'suffah') { if (ci < 0 || ci >= NI || cj < 0 || cj >= NJ) return null; return { key: `s:${ci}:${cj}`, kind: 'suffah', ci, cj }; }
      if (tool === 'minbar') return { key: 'minbar', kind: 'minbar' };
      return null;
    },
    // every key a drag covers: a line of trunks or walls, a rectangle of fronds or Suffah
    dragKeys() {
      const d = this.drag; if (!d) return [];
      if (d.remove) { const t = this.nearestBuilt(d.cur); return t ? [t] : []; }
      const tool = this.tool, a = d.start, b = d.cur, out = new Map();
      const add = h => { const t = this.target(h, tool); if (t) out.set(t.key, t); };
      if (tool === 'roof' || tool === 'suffah') {
        const i0 = Math.floor(Math.min(a.fi, b.fi)), i1 = Math.floor(Math.max(a.fi, b.fi)), j0 = Math.floor(Math.min(a.fj, b.fj)), j1 = Math.floor(Math.max(a.fj, b.fj));
        for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) add({ x: vx(i + 0.5), z: vz(j + 0.5), fi: i + 0.5, fj: j + 0.5 });
      } else if (tool === 'minbar') add(b);
      else {
        const n = Math.max(1, Math.ceil(Math.hypot(b.fi - a.fi, b.fj - a.fj) * 4));
        const t0 = this.target(a, tool);
        for (let k = 0; k <= n; k++) {
          const u = k / n; const h = { x: U.lerp(a.x, b.x, u), z: U.lerp(a.z, b.z, u), fi: U.lerp(a.fi, b.fi, u), fj: U.lerp(a.fj, b.fj, u) };
          // a line keeps to the kind it started with (a row of pillars stays pillars)
          const t = this.target(h, tool); if (t && (!t0 || t.kind === t0.kind || n < 2)) { if (t.kind !== 'free' || k === 0 || k === n) out.set(t.key, t); }
        }
      }
      return [...out.values()];
    },
    nearestBuilt(h) {
      let best = null, bd = 1.6;
      this.built.forEach((b, key) => { if (key === 'minbar') return; const d = Math.hypot(b.x - h.x, b.z - h.z); if (d < bd) { bd = d; best = { key, kind: b.kind }; } });
      return best;
    },
    updateDrag() {
      const keys = this.dragKeys();
      this.dragLine = keys;
    },
    commitDrag() {
      const keys = this.dragKeys(), env = ENGINE.env;
      if (this.drag.remove) { keys.forEach(t => this.remove(t.key)); return; }
      let n = 0;
      keys.forEach((t, k) => { if (!this.built.has(t.key)) { this.later(k * 0.06, () => this.place(t)); n++; } else if (t.kind === 'minbar') this.place(t); });
      if (!n && !keys.some(t => t.kind === 'minbar')) SND.knock(env.bus, { f: 200, gain: 0.05, click: 900 });
    },
    later(dt, fn) { this.queue.push([this.w.time + dt, fn]); },

    /* ---------- placing and removing pieces ---------- */
    pieceAt(key) {
      const [k, a, b, c] = key.split(':');
      if (k === 'p') return { x: vx(+a + 0.5), z: vz(12), ry: 0 };
      if (k === 'c') return { x: vx(+a), z: vz(+b), ry: 0 };
      if (k === 'w') return c === 'z' ? { x: vx(+a), z: vz(+b + 0.5), ry: Math.PI / 2 } : { x: vx(+a + 0.5), z: vz(+b), ry: 0 };
      if (k === 'r') return { x: vx(+a + 0.5), z: vz(+b + 0.5), ry: 0 };
      if (k === 's') return { x: vx(+a + 0.5), z: vz((b == null ? 0 : +b) + 0.5), ry: 0 };
      if (k === 'f') return { x: +a / 2, z: +b / 2, ry: 0 };
      return { x: MINBAR.x, z: MINBAR.z, ry: 0 };
    },
    supported(i, j) {
      // a vertex carries the roof when a trunk stands on it or a wall or the row of trunks runs through it
      const B = this.built;
      if (B.has(`c:${i}:${j}`)) return true;
      if (j === 12) return B.has(`p:${Math.min(i, NI - 1)}`) || B.has(`p:${Math.max(0, i - 1)}`);
      if (i === 0 || i === NI) return B.has(`w:${i}:${Math.min(j, NJ - 1)}:z`) || B.has(`w:${i}:${Math.max(0, j - 1)}:z`) || (j >= 11 && (B.has(`p:0`) || B.has(`p:${NI - 1}`)));
      if (j === 0) return B.has(`w:${Math.min(i, NI - 1)}:0:x`) || B.has(`w:${Math.max(0, i - 1)}:0:x`);
      return false;
    },
    place(t) {
      const w = this.w, env = ENGINE.env, now = w.time;
      if (t.kind === 'minbar') {
        if (this.part < 3) return;
        if (this.minbarSteps >= 3) return;
        const k = this.minbarSteps++;
        this.anim(this.steps[k], now); if (k === 2) this.rails.forEach(m => this.anim(m, now + 0.15));
        SND.knock(env.bus, { f: 160 + k * 30, gain: 0.35, click: 900 }); SND.sing(env.bus, [293.66, 329.63, 392][k], { vowel: 'o', dur: 1.4, gain: 0.05, voices: 2 });
        this.puff(MINBAR.x, MINBAR.z, 1.2);
        if (k === 2) { this.built.set('minbar', { kind: 'minbar', x: MINBAR.x, z: MINBAR.z }); w.say('The minbar', 'A pulpit of tamarisk wood from al-Ghabah, with three steps. (Sahih al-Bukhari 917; Sahih Muslim 544)', { ms: 9000 }); }
        this.afterChange(); return;
      }
      const p = this.pieceAt(t.key);
      if (t.kind === 'roof') {
        const [, a, b] = t.key.split(':').map(Number);
        const ok = this.supported(a, b) && this.supported(a + 1, b) && this.supported(a, b + 1) && this.supported(a + 1, b + 1);
        if (!ok) { this.fall(p); return; }
      }
      if (t.kind === 'suffah') {
        const [, a, b] = t.key.split(':').map(Number);
        if (b !== 0) { this.puff(p.x, p.z, 1.5); SND.knock(env.bus, { f: 120, gain: 0.05, click: 600 }); this.hintOnce('suffah', 'The Suffah runs along the north wall, the far side from the qibla.'); return; }
        t.key = `s:${a}`;
        if (this.built.has(t.key)) return;
      }
      const item = { key: t.key, kind: t.kind, x: p.x, z: p.z, ry: p.ry, born: now, idx: {} };
      this.built.set(t.key, item);
      if (t.kind === 'pillar' || t.kind === 'free') { item.col = [p.x, p.z, 0.26]; w.circles.push(item.col); }
      else if (t.kind === 'wall' || t.kind === 'palisade') { const a = p.ry ? 0.4 : G / 2, b = p.ry ? G / 2 : 0.4; item.box = [p.x - a, p.z - b, p.x + a, p.z + b]; w.boxes.push(item.box); }
      const add = (name, m4fn) => { const im = this.inst[name]; im.userData.items.push({ item, m4fn }); };
      if (t.kind === 'palisade') {
        for (let k = 0; k < 6; k++) add('trunk', (s, m) => m.compose(V(p.x - G / 2 + 0.25 + k * 0.5, 0, p.z), Qy(k * 1.3), S3(1, U.clamp(s * (1.04 + 0.05 * Math.sin(k * 2.1))), 1)));
        SND.knock(env.bus, { f: 110, gain: 0.4, click: 700 }); this.later(0.12, () => SND.knock(env.bus, { f: 130, gain: 0.25, click: 900 }));
      } else if (t.kind === 'pillar' || t.kind === 'free') {
        add('trunk', (s, m) => m.compose(V(p.x, 0, p.z), Qy(p.x * 3), S3(1 + 0.25 * (1 - s) * Math.sin(s * 9), U.clamp(s * 1.06, 0, 1.06), 1 + 0.25 * (1 - s) * Math.sin(s * 9))));
        SND.knock(env.bus, { f: 120 + Math.random() * 20, gain: 0.45, click: 800 });
      } else if (t.kind === 'wall') {
        // course by course, like bricks laid by hand
        add('foot', (s, m) => m.compose(V(p.x, 0, p.z), Qy(p.ry), S3(1, U.clamp(s * 4), 1)));
        add('wall', (s, m) => m.compose(V(p.x, 0.32, p.z), Qy(p.ry), S3(1, Math.max(0.001, Math.floor(U.clamp(s * 1.25) * 9) / 9), 1)));
        for (let k = 0; k < 4; k++) this.later(0.12 * k, () => SND.knock(env.bus, { f: 90 + Math.random() * 30, gain: 0.18, click: 400 }));
        this.chant = Math.min(1, this.chant + 0.25);
        this.hintOnce('rajaz', null, () => this.w.say('A chant while building', 'The Companions carried the stones chanting, and the Prophet ﷺ was with them, saying: <span class="q">“O God, there is no good but the good of the Hereafter; so forgive the Ansar and the Emigrants.”</span> (Sahih al-Bukhari 428)', { ar: 'اللَّهُمَّ لَا خَيْرَ إِلَّا خَيْرُ الْآخِرَهْ، فَاغْفِرْ لِلْأَنْصَارِ وَالْمُهَاجِرَهْ', ms: 12000 }));
      } else if (t.kind === 'roof') {
        add('beam', (s, m) => m.compose(V(p.x, WALL_H + 0.5 + (1 - U.clamp(s * 2)) * 2, p.z - G / 2 + 0.05), Qy(0), S3(1, 1, 1)));
        add('roof', (s, m) => { const k = U.easeOut(U.clamp(s)); m.compose(V(p.x, WALL_H + 0.62 + (1 - k) * 4, p.z), Qy((1 - k) * 0.6), S3(1, 1, 1)); });
        SND.swell(env.bus, { f0: 2400, f1: 900, dur: 0.6, gain: 0.03 });
      } else if (t.kind === 'suffah') {
        add('plat', (s, m) => m.compose(V(p.x, 0, p.z), Qy(0), S3(1, U.clamp(s * 2), 1)));
        [[-1, -1], [1, -1]].forEach(([a]) => add('post', (s, m) => m.compose(V(p.x + a * 1.3, 0.4, p.z + 1.3), Qy(0), S3(1, U.clamp(s * 1.5 - 0.5), 1))));
        add('shade', (s, m) => { const k = U.clamp(s * 1.6 - 0.6); m.compose(V(p.x, 2.95 + (1 - k) * 2.5, p.z), Qy(0), S3(Math.max(0.001, k), 1, Math.max(0.001, k))); });
        SND.knock(env.bus, { f: 80, gain: 0.25, click: 300 }); SND.coo(env.bus, { gain: 0.03, delay: 0.5 });
      }
      this.puff(p.x, p.z, t.kind === 'roof' ? 0 : 1);
      SND.sing(env.bus, [196, 220, 246.94, 293.66, 329.63][(this.built.size * 3) % 5], { vowel: 'a', dur: 1.2, gain: 0.018 + 0.01 * this.chant, voices: 2, delay: 0.05 });
      this.afterChange();
    },
    remove(key) {
      const w = this.w, env = ENGINE.env, item = this.built.get(key); if (!item) return;
      this.built.delete(key);
      if (item.col) w.circles.splice(w.circles.indexOf(item.col), 1);
      if (item.box) w.boxes.splice(w.boxes.indexOf(item.box), 1);
      Object.values(this.inst).forEach(im => { im.userData.items = im.userData.items.filter(e => e.item !== item); });
      this.puff(item.x, item.z, 1); SND.swell(env.bus, { f0: 800, f1: 200, dur: 0.5, gain: 0.03 });
      // what is no longer carried comes down gently
      if (item.kind !== 'roof') [...this.built.values()].filter(b => b.kind === 'roof').forEach(b => { const [, a, c] = b.key.split(':').map(Number); if (!(this.supported(a, c) && this.supported(a + 1, c) && this.supported(a, c + 1) && this.supported(a + 1, c + 1))) { this.remove(b.key); this.fall(b); } });
      this.afterChange();
    },
    fall(p) {
      // fronds with nothing under a corner slip and drift to the ground, and are gathered away
      const env = ENGINE.env;
      this.falling = this.falling || [];
      const g = new T.Mesh(this.inst.roof.geometry, this.mats.frond); g.position.set(p.x, WALL_H + 2, p.z); g.userData.dynamic = true; this.w.scene.add(g);
      this.falling.push({ g, t: 0, spin: (Math.random() - 0.5) * 2 });
      SND.swell(env.bus, { f0: 1600, f1: 300, dur: 1.4, gain: 0.03 });
      this.hintOnce('roof', 'The fronds need trunks or walls under every corner; set the pillars and walls first.');
    },
    hintOnce(id, text, fn) { this._hints = this._hints || {}; if (this._hints[id]) return; this._hints[id] = 1; if (fn) fn(); else this.w.say('The plan', text, { ms: 6000 }); },
    puff(x, z, k) {
      if (!k) return;
      this.puffs = this.puffs || [];
      const s = KIT.glow(this.w, 0xe8d8c0, 1, 0.5); s.material.blending = T.NormalBlending; s.position.set(x, 0.6, z); this.w.scene.add(s);
      this.puffs.push({ s, t: 0, k });
    },
    anim(m, t0) { this.anims = this.anims || []; this.anims.push({ m, t0 }); },
    afterChange() {
      this.updateProgress(); this.drawPlan();
    },
    count(kind) { return PLAN[kind].filter(k => this.built.has(k)).length + (kind === 'minbar' && this.minbarSteps >= 3 ? 1 : 0); },
    updateProgress() {
      const w = this.w; if (this.part < 0) return;
      const P = PARTS[this.part];
      let n = 0, total = 0; P.need.forEach(k => { total += k === 'minbar' ? 1 : PLAN[k].length; n += k === 'minbar' ? (this.minbarSteps >= 3 ? 1 : 0) : PLAN[k].filter(x => this.built.has(x)).length; });
      w.progress(n);
      if (n >= total && !this.partDone) {
        this.partDone = true;
        const env = ENGINE.env;
        SND.glow(env.bus, [146.83, 164.81, 196, 220][this.part], { gain: 0.06, dur: 6 }); SND.bell(env.bus, 587.33, { gain: 0.035, delay: 0.4, glass: true });
        this.later(1.6, () => {
          this.partDone = false;
          if (this.part === 2) w.discover(Object.assign({ pos: [-6, 1.8, 14] }, this.discRoof, { label: 'Look up at the fronds' }));
          if (this.part < 3) this.startPart(this.part + 1); else this.standInside();
        });
      }
    },
    /* ---------- the plan in chalk ---------- */
    drawPlan() {
      const g = this.planCtx, S = 1024, k = S / 40, X = x => (x + 20) * k, Z = z => (z + 20) * k;
      g.clearRect(0, 0, S, S);
      const cur = this.part >= 0 ? PARTS[this.part].need : [];
      const col = (kind, key) => this.built.has(key) ? null : cur.includes(kind) ? 'rgba(255,214,120,0.95)' : 'rgba(255,250,235,0.32)';
      g.lineCap = 'round';
      const line = (x0, z0, x1, z1, c, wd) => { g.strokeStyle = c; g.lineWidth = wd; g.beginPath(); g.moveTo(X(x0), Z(z0)); g.lineTo(X(x1), Z(z1)); g.stroke(); };
      // faint grid
      g.setLineDash([4, 10]);
      for (let i = 0; i <= NI; i++) line(vx(i), vz(0), vx(i), vz(NJ), 'rgba(255,250,235,0.12)', 2);
      for (let j = 0; j <= NJ; j++) line(vx(0), vz(j), vx(NI), vz(j), 'rgba(255,250,235,0.12)', 2);
      g.setLineDash([]);
      PLAN.palisade.forEach(key => { const c = col('palisade', key); if (c) { const i = +key.split(':')[1]; line(vx(i) + 0.2, vz(12), vx(i + 1) - 0.2, vz(12), c, 9); } });
      PLAN.wall.forEach(key => { const c = col('wall', key); if (!c) return; const [, a, b, d] = key.split(':'); if (d === 'z') line(vx(+a), vz(+b) + 0.2, vx(+a), vz(+b + 1) - 0.2, c, 9); else line(vx(+a) + 0.2, vz(+b), vx(+a + 1) - 0.2, vz(+b), c, 9); });
      PLAN.roof.forEach(key => { const c = col('roof', key); if (!c) return; const [, a, b] = key.split(':').map(Number); g.strokeStyle = c; g.lineWidth = 2; g.setLineDash([6, 6]); g.strokeRect(X(vx(a)) + 6, Z(vz(b)) + 6, G * k - 12, G * k - 12); g.setLineDash([]); });
      PLAN.suffah.forEach(key => { const c = col('suffah', key); if (!c) return; const a = +key.split(':')[1]; g.fillStyle = c.replace(/[\d.]+\)$/, '0.16)'); g.fillRect(X(vx(a)) + 5, Z(vz(0)) + 5, G * k - 10, G * k - 10); g.strokeStyle = c; g.lineWidth = 2; g.strokeRect(X(vx(a)) + 5, Z(vz(0)) + 5, G * k - 10, G * k - 10); });
      PLAN.pillar.forEach(key => { const c = col('pillar', key); if (!c) return; const [, a, b] = key.split(':').map(Number); g.fillStyle = c; g.beginPath(); g.arc(X(vx(a)), Z(vz(b)), 9, 0, 6.3); g.fill(); g.strokeStyle = c; g.lineWidth = 2; g.beginPath(); g.arc(X(vx(a)), Z(vz(b)), 15, 0, 6.3); g.stroke(); });
      if (this.minbarSteps < 3) { const c = cur.includes('minbar') ? 'rgba(255,214,120,0.95)' : 'rgba(255,250,235,0.3)'; g.strokeStyle = c; g.lineWidth = 3; g.strokeRect(X(MINBAR.x - 0.6), Z(MINBAR.z - 0.9), 1.2 * k, 1.8 * k); for (let s = 0; s < 3; s++) line(MINBAR.x - 0.5, MINBAR.z - 0.6 + s * 0.5, MINBAR.x + 0.5, MINBAR.z - 0.6 + s * 0.5, c, 2); }
      // doorways, marked with two small stones
      [[vx(0), vz(DOORS.west + 0.5), 1], [vx(NI), vz(DOORS.east + 0.5), 1], [vx(DOORS.north + 0.5), vz(0), 0]].forEach(([x, z, v]) => { g.fillStyle = 'rgba(255,250,235,0.5)'; for (const s of [-1, 1]) { g.beginPath(); g.arc(X(x + (v ? 0 : s * 1.5)), Z(z + (v ? s * 1.5 : 0)), 6, 0, 6.3); g.fill(); } });
      this.planTex.needsUpdate = true;
    },
    /* ---------- the builder's camera ---------- */
    buildCam(dt) {
      const w = this.w, k = w.keys, cam = w.camera;
      this.camYaw = U.damp(this.camYaw, this.camYawT, 6, dt); this.camDist = U.damp(this.camDist, this.camDistT, 6, dt);
      const fx = -Math.sin(this.camYaw), fz = -Math.cos(this.camYaw), rx = -fz, rz = fx;
      let mx = 0, mz = 0;
      if (k.has('w') || k.has('ArrowUp')) mz += 1; if (k.has('s') || k.has('ArrowDown')) mz -= 1; if (k.has('a')) mx -= 1; if (k.has('d')) mx += 1;
      if (k.has('ArrowLeft') && !this._al) { this.camYawT += Math.PI / 4; } this._al = k.has('ArrowLeft');
      if (k.has('ArrowRight') && !this._ar) { this.camYawT -= Math.PI / 4; } this._ar = k.has('ArrowRight');
      this.camTgt.x = U.clamp(this.camTgt.x + (fx * mz + rx * mx) * dt * 14, -22, 22); this.camTgt.z = U.clamp(this.camTgt.z + (fz * mz + rz * mx) * dt * 14, -24, 24);
      const ch = Math.cos(this.camPitch) * this.camDist, cy = Math.sin(this.camPitch) * this.camDist;
      const want = new T.Vector3(this.camTgt.x - fx * ch, cy, this.camTgt.z - fz * ch);
      if (this.camFromFilm) { cam.position.lerp(want, 1 - Math.exp(-dt * 3)); if (cam.position.distanceTo(want) < 0.5) this.camFromFilm = false; } else cam.position.copy(want);
      cam.lookAt(this.camTgt.x, 0, this.camTgt.z);
      w.pos.set(this.camTgt.x, 0, this.camTgt.z);
      // the ghost under the pointer
      Object.values(this.ghosts).forEach(g => { g.visible = false; });
      if (this._pool) Object.values(this._pool).forEach(a => a.forEach(g => { g.visible = false; }));
      this._gi = {};
      const p = ENGINE.pointer, h = (p.inside || this.drag) ? this.pick(p.x, p.y) : null;
      if (this.drag && h) { this.drag.cur = h; this.updateDrag(); }
      const list = this.drag ? this.dragLine : h ? (this.removing ? [this.nearestBuilt(h)].filter(Boolean) : [this.target(h, this.tool)].filter(Boolean)) : [];
      list.slice(0, 40).forEach(t => this.showGhost(t));
    },
    showGhost(t) {
      // a few ghosts are enough: reuse clones as needed
      const kind = this.removing || (this.drag && this.drag.remove) ? 'remove' : t.kind === 'palisade' || t.kind === 'pillar' || t.kind === 'free' ? 'trunk' : t.kind;
      this._pool = this._pool || {};
      const pool = this._pool[kind] || (this._pool[kind] = [this.ghosts[kind]]);
      const n = this._gi[kind] = (this._gi[kind] || 0) + 1; let g = pool[n - 1];
      if (!g) { g = this.ghosts[kind].clone(); g.userData.dynamic = true; this.w.scene.add(g); pool.push(g); }
      const p = t.kind === 'minbar' ? { x: MINBAR.x, z: MINBAR.z, ry: 0 } : (this.built.get(t.key) || this.pieceAt(t.key));
      g.position.set(p.x, t.kind === 'roof' ? WALL_H + 0.6 : 0.02, p.z); g.rotation.y = p.ry || 0; g.visible = true;
      g.scale.set(t.kind === 'palisade' ? 12 : 1, 1, 1);
      const onPlan = PLAN[t.kind] && PLAN[t.kind].includes(t.key) || t.kind === 'minbar' || (t.kind === 'suffah' && t.cj === 0);
      g.material = kind === 'remove' ? this.ghosts.remove.material : this.ghostMat;
      this.ghostMat.color.set(onPlan ? 0xffd98a : 0xf0f0f0);
    },
    standInside() {
      // the moment of standing inside what you built
      const w = this.w, env = ENGINE.env;
      this.done = true; this.bar.style.opacity = 0; this.bar.style.pointerEvents = 'none';
      w.discover(Object.assign({ pos: [0, 1.2, -15] }, this.discSuffah, { label: 'Sit in the shade of the Suffah' }));
      this.dip('#f6efe2', 0.5, () => {
        w.mode = null; this.mode = 'walk'; Object.values(this.ghosts).forEach(g => { g.visible = false; }); if (this._pool) Object.values(this._pool).forEach(a => a.forEach(g => { g.visible = false; }));
        w.pos.set(-4, 0, 6); w.yaw = Math.atan2(4 - MINBAR.x, 6 - MINBAR.z) * 0 + Math.PI; w.pitch = 0.05;
        w.yaw = Math.atan2(-(vx(TRUNK.i) - -4), -(vz(TRUNK.j) - 6));
        this.weeping = true;
        w.activity('Inside what you built', 1, 'Listen: something weeps near the minbar. Go to it and hold it (E)');
        w.goal([vx(TRUNK.i), 1.6, vz(TRUNK.j)]);
        SND.glow(env.bus, 130.81, { gain: 0.06, dur: 9 });
      });
      w.interact({ key: 'trunk', pos: [vx(TRUNK.i), 1.3, vz(TRUNK.j)], r: 2.8, once: true, label: 'Place your hand on the trunk', enabled: () => this.weeping,
        onUse: () => {
          this.soothed = 0.001; w.goal(null);
          SND.glow(env.bus, 130.81, { gain: 0.05, dur: 8 }); SND.bell(env.bus, 523.25, { gain: 0.03, dur: 6, glass: true });
          w.say('The weeping trunk', 'He used to lean on a palm trunk to give the sermon. When the minbar was made and he stood on it, the trunk cried out like a child, until he came down and held it, and it grew quiet. (Sahih al-Bukhari 3584)', { ar: 'فَصَاحَتِ النَّخْلَةُ صِيَاحَ الصَّبِيِّ', ms: 15000 });
          this.later(5, () => { w.finish('The mosque of palm trunks stands'); w.step('Walk through it, or look up at the fronds'); });
        } });
    },
    dip(color, hold, fn) { this.fadeEl.style.background = color; this.dipGoal = 1; this.later(0.6, () => { fn && fn(); this.later(hold || 0.2, () => { this.dipGoal = 0; }); }); },

    onKey(env, e) {
      if (e.repeat || !this.w || this.w.filmS) return;
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (k === 'v') { this.toggleWalk(); return; }
      if (this.mode !== 'build') return;
      const t = TOOLS.find(t => t.key === k); if (t) { this.setTool(t.id); return; }
      if (k === 'q') this.camYawT += Math.PI / 4;
      if (k === 'e') this.camYawT -= Math.PI / 4;
      if (k === 'x' || k === 'Delete' || k === 'Backspace') { this.removing = !this.removing; this.syncTools(); }
    },
    wheel(env, dy) { if (this.mode === 'build') this.camDistT = U.clamp(this.camDistT + dy * 0.03, 18, 80); },
    move(env, p, e) { if (this.w && this.mode !== 'build') this.w.move(p, e); },

    update(env, dt) {
      const w = this.w; if (!w) return;
      if (this.queue.length) { const due = this.queue.filter(q => w.time >= q[0]); this.queue = this.queue.filter(q => w.time < q[0]); due.forEach(q => q[1]()); }
      if (!w.filmS) { this.dipV = U.damp(this.dipV, this.dipGoal, 9, dt); this.fadeEl.style.opacity = this.dipV < 0.004 ? 0 : this.dipV.toFixed(3); }
      w.update(dt);
      const t = w.time;
      // the instanced pieces: pop in with a little overshoot and settle
      const m4 = M4;
      Object.values(this.inst).forEach(im => {
        const L = im.userData.items; im.count = L.length;
        L.forEach((e, i) => { const s = U.clamp((t - e.item.born) / 0.7, 0, 1); const bounce = s < 1 ? U.easeOut(s) + Math.sin(s * Math.PI) * 0.12 : 1; e.m4fn(bounce, m4); im.setMatrixAt(i, m4); });
        im.instanceMatrix.needsUpdate = true;
      });
      (this.anims || []).forEach(a => { const s = U.clamp((t - a.t0) / 0.6); a.m.scale.setScalar(Math.max(0.001, U.easeOut(s) + Math.sin(s * Math.PI) * 0.1)); });
      (this.puffs || []).forEach(p => { p.t += dt; p.s.material.opacity = 0.45 * (1 - p.t / 1.4) * p.k; p.s.scale.setScalar(1.5 + p.t * 3); p.s.position.y += dt * 0.6; });
      if (this.puffs) this.puffs = this.puffs.filter(p => { if (p.t > 1.4) { w.scene.remove(p.s); p.s.material.dispose(); return false; } return true; });
      (this.falling || []).forEach(f => { f.t += dt; f.g.position.y = Math.max(0.1, f.g.position.y - dt * (1 + f.t * 3)); f.g.rotation.z = Math.min(1.2, f.t * f.spin); f.g.rotation.x = Math.min(0.4, f.t * 0.3); if (f.t > 2.2) f.g.scale.multiplyScalar(1 - dt * 2); });
      if (this.falling) this.falling = this.falling.filter(f => { if (f.t > 3.2) { w.scene.remove(f.g); return false; } return true; });
      this.planMesh.material.opacity = this.done ? U.damp(this.planMesh.material.opacity, 0.15, 1, dt) : this.planMesh.material.opacity;
      // the chant of many hands: grows as the walls rise, settles when they stop
      this.chant = Math.max(0, this.chant - dt * 0.04);
      const built = this.built.size / (PLAN.palisade.length + PLAN.pillar.length + PLAN.wall.length + PLAN.roof.length + PLAN.suffah.length);
      this.choir.setGain(0.003 + 0.012 * built + 0.012 * this.chant, 0.6);
      if (this.chant > 0.2 && Math.random() < dt * 1.4 * this.chant) SND.sing(env.bus, U.pick([146.83, 164.81, 196, 220]), { vowel: U.pick(['a', 'o']), dur: U.rnd(0.5, 0.9), gain: 0.012 * this.chant, voices: 4, detune: 14, spread: 1.4, attack: 0.08, hold: 0.4 });

      // the trunk weeps until it is held
      if (this.weeping) {
        const sp = w.spatial({ x: vx(TRUNK.i), z: vz(TRUNK.j) }, 7);
        if (this.soothed > 0) this.soothed = Math.min(1, this.soothed + dt * 0.25);
        this.sobClock -= dt;
        if (this.sobClock < 0 && this.soothed < 0.9) { this.sobClock = 1.6 + Math.random() * 2.2; SND.sing(env.bus, 330 + Math.random() * 50, { vowel: 'u', dur: 1.0, gain: 0.05 * sp.gain * (1 - this.soothed) + 0.004, pan: sp.pan, attack: 0.08, hold: 0.2, vib: 0.02 }); }
      }
      this.birdClock -= dt;
      if (this.birdClock < 0) { this.birdClock = 1.5 + Math.random() * 4; Math.random() < 0.4 ? SND.coo(env.bus, { gain: 0.03 }) : SND.chirp(env.bus, { gain: 0.016 }); }
    },
    onLeave() { const host = document.getElementById('host'); if (this.noMenu) host.removeEventListener('contextmenu', this.noMenu); },
  }));

  const M4 = new T.Matrix4(), _v = new T.Vector3(), _q = new T.Quaternion(), _s = new T.Vector3(), _up = new T.Vector3(0, 1, 0);
  function V(x, y, z) { return _v.set(x, y, z); }
  function Qy(a) { return _q.setFromAxisAngle(_up, a); }
  function S3(x, y, z) { return _s.set(x, Math.max(0.001, y), z); }
})();
