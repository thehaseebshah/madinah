/* Station — The Palm Groves of al-'Aliyah. A farming sim (Stardew Valley / Harvest Moon).
   Feeling: gratitude for provision, earned by patient work.
   A compressed season in one garden of the oasis, seen from above like a farm sim: the gardener is
   never shown, only a warm light and the footprints it leaves in the soil.
   Spring: carry strands of male flowers and pollinate eight palms (Sahih Muslim 2363).
   Summer: open and close the earthen gates so the well's water fills every basin.
   High summer: bag the green bunches before the birds find them (they only flutter away).
   Autumn: harvest each bunch at the right ripeness and spread it on the drying floor.
   Dawn: set out seven 'ajwa for the morning (Sahih al-Bukhari 5445).
   Colour script: palm green and sun-warm earth; amber light reserved for what needs your hands. */
(function () {
  'use strict';
  if (!window.WORLD) return;
  const T = THREE;

  /* ---------------- layout (metres; the plot is at the origin, north is -z) ---------------- */
  const PALMS = [];
  [-10.5, -3.5, 3.5, 10.5].forEach(x => [-4.6, 4.6].forEach(z => PALMS.push({ x, z })));
  const MALE = { x: 18, z: -8.5 };
  const WELL = { x: -38, z: 0 }, CIST = { x: -29.5, z: 0 };
  const HOUSE = { x: -36, z: 17 }, STORE = { x: -31.5, z: 12.6 }, MIRBAD = { x: -36, z: -17 }, PLATE = { x: -33.2, z: 12.4 };
  const START = { x: -20, z: 6 };
  const CAM = { H: 13.5, D: 11.5 };
  const SCALE = [392, 440, 493.88, 523.25, 587.33, 659.25, 739.99, 783.99];
  const SKIES = { p1: 'qwantani_morning_puresky', p2: 'qwantani_noon_puresky', p3: 'kloofendal_43d_clear_puresky', p4: 'qwantani_late_afternoon_puresky', final: 'qwantani_sunrise_puresky' };
  const SEASONS = { p1: 'Spring', p2: 'Summer', p3: 'High summer', p4: 'Autumn', final: 'Autumn' };

  const H = (x, z) => {
    const d = Math.hypot(x, z);
    let y = SCAPE.fbm(x * 0.012, z * 0.012, 3) * 1.4 * U.smooth(34, 70, Math.hypot(x + 10, z));
    // the two lava tracts, east and west: black basalt rising out of the gardens
    const hx = Math.abs(x) - 150 + SCAPE.fbm(z * 0.006 + (x > 0 ? 3 : 9), 1.7, 3) * 70;
    y += U.smooth(-10, 70, hx) * (5 + SCAPE.ridge(x * 0.025, z * 0.025, 4) * 12);
    y += U.smooth(330, 650, d) * SCAPE.ridge(x * 0.003 + 4, z * 0.003, 4) * 150;
    y += SCAPE.fbm(x * 0.2, z * 0.2, 2) * 0.06;
    return y;
  };

  /* ---------------- shaders ---------------- */
  const WATER_VERT = `varying vec3 vW; varying float vD; void main(){ vec4 wp = modelMatrix*vec4(position,1.);
  #ifdef USE_INSTANCING
    wp = modelMatrix*instanceMatrix*vec4(position,1.);
  #endif
  vW = wp.xyz; vec4 mv = viewMatrix*wp; vD = -mv.z; gl_Position = projectionMatrix*mv; }`;
  const WATER_FRAG = `uniform float uTime; uniform vec3 uSun; uniform vec3 uFog; uniform float uFogD; uniform vec3 uSky; uniform vec3 uHor; uniform vec3 uDeep;
  varying vec3 vW; varying float vD;
  void main(){ vec2 p = vW.xz; vec2 g = vec2(0.);
    g += vec2(0.2,1.)*cos(dot(p,vec2(0.2,1.))*7. - uTime*3.)*0.05; g += vec2(1.,0.3)*cos(dot(p,vec2(1.,0.3))*11. - uTime*4.1)*0.035;
    g += vec2(-0.7,0.7)*cos(dot(p,vec2(-0.7,0.7))*17. + uTime*5.3)*0.02;
    vec3 n = normalize(vec3(-g.x,1.,-g.y)); vec3 v = normalize(cameraPosition - vW); vec3 rf = reflect(-v,n);
    float fres = 0.05 + 0.95*pow(1. - max(dot(n,v),0.), 5.);
    vec3 sky = mix(uHor, uSky, clamp(rf.y*1.5,0.,1.)); float s = max(dot(rf,uSun),0.);
    vec3 col = mix(uDeep, sky, fres*0.9 + 0.1) + vec3(1.,0.9,0.7)*(pow(s,260.)*5. + pow(s,24.)*0.25);
    gl_FragColor = vec4(mix(col, uFog, 1. - exp(-uFogD*vD)), 1.); }`;

  // fronds between the camera and the light fade out in a dither, so the overhead view is never blocked
  const CUT = { uCutA: { value: new T.Vector3() }, uCutB: { value: new T.Vector3() }, uCutR: { value: 0 } };
  function cutout(mat) {
    const prev = mat.onBeforeCompile, key = mat.customProgramCacheKey ? mat.customProgramCacheKey() : '';
    mat.onBeforeCompile = (sh, r) => {
      prev && prev(sh, r);
      Object.assign(sh.uniforms, CUT);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vCutW;')
        .replace('#include <project_vertex>', `#include <project_vertex>
          { vec4 cw = vec4(transformed, 1.0);
            #ifdef USE_INSTANCING
              cw = instanceMatrix * cw;
            #endif
            vCutW = (modelMatrix * cw).xyz; }`);
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vCutW; uniform vec3 uCutA; uniform vec3 uCutB; uniform float uCutR;')
        .replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>
          if (uCutR > 0.0) { vec3 ab = uCutB - uCutA; float tt = clamp(dot(vCutW - uCutA, ab) / dot(ab, ab), 0., 1.);
            float dd = length(vCutW - (uCutA + ab * tt)); float kk = smoothstep(uCutR * 0.45, uCutR, dd);
            float hh = fract(sin(dot(floor(gl_FragCoord.xy), vec2(12.9898, 78.233))) * 43758.5453);
            if (vCutW.y > uCutB.y + 1.4 && tt < 0.985 && hh > kk) discard; }`);
    };
    mat.customProgramCacheKey = () => key + 'cut';
    mat.needsUpdate = true;
    return mat;
  }

  /* ---------------- small helpers ---------------- */
  function collide(w, p) {
    const r = 0.35;
    for (const [x0, z0, x1, z1] of w.boxes) if (p.x > x0 - r && p.x < x1 + r && p.z > z0 - r && p.z < z1 + r) {
      const dl = p.x - (x0 - r), dr = (x1 + r) - p.x, dn = p.z - (z0 - r), df = (z1 + r) - p.z, m = Math.min(dl, dr, dn, df);
      if (m === dl) p.x = x0 - r; else if (m === dr) p.x = x1 + r; else if (m === dn) p.z = z0 - r; else p.z = z1 + r;
    }
    for (const [x, z, cr] of w.circles) { const dx = p.x - x, dz = p.z - z, d = Math.hypot(dx, dz), m = cr + r; if (d < m && d > 1e-5) { p.x = x + dx / d * m; p.z = z + dz / d * m; } }
    if (w.bounds) { p.x = U.clamp(p.x, w.bounds[0], w.bounds[2]); p.z = U.clamp(p.z, w.bounds[1], w.bounds[3]); }
  }
  function el(parent, css, html) { const d = document.createElement('div'); d.style.cssText = css; if (html != null) d.innerHTML = html; parent.appendChild(d); return d; }
  // a pool of soft sparks for every action (pollen, splashes, chaff)
  function sparks(w, n) {
    const pool = [];
    for (let i = 0; i < n; i++) { const s = KIT.glow(w, 0xffe0a0, 0.3, 0); s.visible = false; s.userData.dynamic = true; w.scene.add(s); pool.push({ s, t: 1, v: new T.Vector3() }); }
    let k = 0;
    const api = {
      emit(x, y, z, o) {
        o = o || {};
        for (let i = 0; i < (o.n || 14); i++) {
          const p = pool[k++ % n]; p.t = 0; p.life = (o.life || 1.2) * (0.6 + Math.random() * 0.6);
          p.s.position.set(x + (Math.random() - 0.5) * (o.spread || 0.6), y, z + (Math.random() - 0.5) * (o.spread || 0.6));
          p.v.set((Math.random() - 0.5) * (o.vx || 1.6), (o.up || 1.4) * (0.4 + Math.random()), (Math.random() - 0.5) * (o.vx || 1.6));
          p.g = o.g == null ? -1.2 : o.g; p.size = (o.size || 0.35) * (0.6 + Math.random() * 0.7);
          p.s.material.color.set(o.color || 0xffe0a0); p.s.visible = true;
        }
      },
      step(dt) {
        for (const p of pool) {
          if (!p.s.visible) continue;
          p.t += dt / p.life; if (p.t >= 1) { p.s.visible = false; continue; }
          p.v.y += p.g * dt; p.s.position.addScaledVector(p.v, dt);
          p.s.material.opacity = Math.sin(Math.PI * Math.min(1, p.t * 1.4)) * 0.9; p.s.scale.setScalar(p.size * (1 + p.t));
        }
      },
    };
    return api;
  }

  /* ---------------- the station ---------------- */
  ENGINE.register(WORLD.stage({
    key: 'palms',
    arabic: 'نخيل العالية',
    title: 'The Palm Groves',
    era: 'Ajwa dates of al-‘Aliyah',
    hint: 'WASD to walk · Shift to hurry · E, Space or click to work · 1–4 choose a tool · wheel to zoom',
    hintTouch: 'Left thumb to walk · tap the right side to work · tap a tool to choose it',
    sound: { reverb: 0.25 },
    story: `<p>Madinah was an oasis long before it was a city: palm gardens fed by wells, between two tracts of black lava. The gardens of al-‘Aliyah, on the higher ground, are still famous for <i>‘ajwa</i>, a small, soft, nearly black date: “In the ‘ajwa of al-‘Aliyah there is healing.” (Sahih Muslim 2048)</p>
            <p>The Prophet ﷺ once passed people pollinating their palms and suggested they might leave it. They did, and the dates came out poor. He said: “You know better the affairs of your world.” (Sahih Muslim 2363)</p>
            <p>Live one season in the grove: pollinate, water, protect and harvest, and set aside seven ‘ajwa for the morning.</p>`,

    enter(env) {
      const self = this;
      const w = this.w = WORLD.create(env, { start: { x: START.x, z: START.z, yaw: 0 }, exposure: 0.86, far: 1700, fov: 42, fog: { color: 0xdccbb0, density: 0.0019 }, bounds: [-125, -125, 125, 125] });
      const S = w.scene, R = U.seeded(2363);
      this.phase = 'film'; this.inv = { pollen: 0, bags: 0, basket: 0 }; this.tool = 0; this.facing = Math.PI; this.zoom = 1; this.busy = 0;
      this.clock = 6.5; this.day = 1; this.done = 0; this.lastStep = new T.Vector3(START.x, 0, START.z); this.stepSide = 1; this.camInit = false;

      /* ---------- terrain, sky and light ---------- */
      const ter = SCAPE.terrain(w, { size: 1500, seg: 300, height: H, rock: [0.8, 0.93], rockHeight: [2.5, 7],
        colors: { low: '#8a6c50', high: '#a48a6c', rock: '#45403c', dark: '#2c2826' }, tex: 'gravel', rockTex: 'lava',
        photo: { ground: 'dirt', rock: 'dark_rock', normal: 1 }, rep: 0.32, rockRep: 0.08 });
      w.ground = ter.ground; w.y = w.ground(START.x, START.z);
      w.surface = (x, z) => (Math.abs(z) < 0.5 && x > -28 && x < 15 ? 'water' : 'sand');
      w.sky({ top: '#6d95c8', mid: '#f0dcc0', bot: '#cdb894', sunDir: [-0.5, 0.45, -0.6], sun: '#ffe6b8', sunSize: 0.0016, clouds: 0.25, haze: 0.45 });
      const sun = this.sun = new T.DirectionalLight(0xfff0d8, 1.75); sun.position.set(-50, 45, -60); S.add(sun);
      S.add(new T.HemisphereLight(0xcfe0f0, 0x8a6a4a, PHOTO.enabled ? 0.1 : 0.7));
      w.followShadow(sun, 34, 2048);
      SCAPE.horizon(w, { haze: '#dccbb0', layers: [{ r: 760, h: 60, color: '#6a5a50', seed: 3 }, { r: 1050, h: 110, color: '#8a7a70', seed: 8 }, { r: 1450, h: 140, color: '#b4a69a', seed: 13 }] });
      this.post = w.post({ bloom: 0.45, threshold: 0.78, rays: { strength: 0.3, dir: [-0.5, 0.45, -0.6] }, vignette: 0.38, grain: 0.03, lift: [0.015, 0.01, 0.0], gain: [1.03, 1.0, 0.95], sat: 1.06 });
      this.setSky = id => PHOTO.sky(w, id, { sun, intensity: 0.75, haze: '#dccbb0', horizon: 0.45, ground: '#a08060', bounce: 0.5 }).then(o => { if (o && o.sunDir && this.post && this.post.rays) this.post.rays.dir = o.sunDir.toArray(); if (o && o.sunDir) this.sunBase = o.sunDir.clone(); });
      this.setSky(SKIES.p1);

      /* ---------- the oasis: palm gardens in rows to the lava, houses among them ---------- */
      const inPlot = (x, z, m) => x > -50 - (m || 0) && x < 26 + (m || 0) && z > -26 - (m || 0) && z < 26 + (m || 0);
      const grove = [];
      for (let gx = -130; gx <= 130; gx += 26) for (let gz = -130; gz <= 130; gz += 26) {
        if (R() < 0.12) continue; // a fallow plot or a house yard
        const ox = gx + (R() - 0.5) * 4, oz = gz + (R() - 0.5) * 4, rot = (R() - 0.5) * 0.3, sp = 6.2 + R() * 1.2;
        for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) {
          const lx = i * sp, lz = j * sp, x = ox + lx * Math.cos(rot) - lz * Math.sin(rot) + (R() - 0.5), z = oz + lx * Math.sin(rot) + lz * Math.cos(rot) + (R() - 0.5);
          if (inPlot(x, z, 4) || Math.abs(H(x, z) - H(x + 2, z)) > 0.8 || H(x, z) > 3) continue;
          if (Math.abs(x) < 3 || Math.abs(z - 40) < 3) continue; // lanes
          grove.push([x, z, 7 + R() * 8]);
        }
      }
      const palmsNear = SCAPE.scatter(w, { kind: 'palm', points: grove, seed: 31, color: '#c8c8a4' });
      const palmsFar = SCAPE.scatter(w, { kind: 'palm', n: 520, area: { x: 0, z: 0, r: 520 }, scale: [8, 15], seed: 32, castShadow: false, color: '#c0c09c',
        avoid: (x, z) => Math.hypot(x, z) < 150 || H(x, z) > 4 || Math.abs(x) > 200 && Math.hypot(x, z) < 400 });
      const barkMat = PHOTO.mat(w, 'palm_tree_bark', { triplanar: 1.4, color: 0xd8c8b4, fallback: KIT.bark(w) });
      [palmsNear, palmsFar].forEach(r => { if (r.meshes[0]) r.meshes[0].material = barkMat; if (r.meshes[1]) cutout(r.meshes[1].material); });
      this.grovePalms = grove;

      /* ---------- photo materials for what is built ---------- */
      const M = {
        brick: PHOTO.mat(w, 'clay_block_wall', { triplanar: 0.6, color: 0xe0c8a8, fallback: KIT.mudBrick(w) }),
        plaster: PHOTO.mat(w, 'clay_plaster', { triplanar: 0.4, color: 0xead8bc, fallback: KIT.plaster(w, [2, 2], '#d8c0a0') }),
        mud: PHOTO.mat(w, 'brown_mud_dry', { triplanar: 0.5, color: 0xc0a080, fallback: SCAPE.tex.mud(w) }),
        stone: PHOTO.mat(w, 'old_stone_wall', { triplanar: 0.6, color: 0xd8c8b0, fallback: SCAPE.tex.granite(w) }),
        beam: PHOTO.mat(w, 'medieval_wood', { rep: [1, 3], color: 0xb09070, fallback: KIT.wood(w, [1, 3]) }),
        plank: PHOTO.mat(w, 'old_planks_02', { rep: [1, 1], color: 0xc0a080, fallback: KIT.wood(w, [1, 1], '#6a4a2a') }),
        linen: PHOTO.mat(w, 'rough_linen', { rep: [3, 3], color: 0xc8a878, side: T.DoubleSide, fallbackColor: '#c8a878' }),
        leather: PHOTO.mat(w, 'brown_leather', { rep: [2, 2], color: 0xa07850, fallbackColor: '#7a5434' }),
        bark: barkMat,
      };
      M.dark = new T.MeshStandardMaterial({ color: 0x140e0a, roughness: 1 });
      // farmhouses of mud brick among the gardens: parapets, roof beams through the walls, plank doors
      const houseAt = (x, z, wd, dp, ht, ry, two) => {
        const g = new T.Group(); g.position.set(x, w.ground(x, z) - 0.15, z); g.rotation.y = ry; S.add(g);
        const add = (geo, mat, px, py, pz, rx, rz) => { const m = new T.Mesh(geo, mat); m.position.set(px, py, pz); if (rx) m.rotation.x = rx; if (rz) m.rotation.z = rz; m.castShadow = m.receiveShadow = true; g.add(m); return m; };
        const storey = (W, D, h, y0) => {
          add(new T.BoxGeometry(W, h, D), M.plaster, 0, y0 + h / 2, 0);
          add(new T.BoxGeometry(W + 0.12, 0.28, D + 0.12), M.mud, 0, y0 + h, 0);
          [[W + 0.1, 0.25, 0, D / 2], [W + 0.1, 0.25, 0, -D / 2]].forEach(([a, b, px, pz]) => add(new T.BoxGeometry(a, 0.55, b), M.plaster, px, y0 + h + 0.3, pz));
          [[0.25, D, W / 2, 0], [0.25, D, -W / 2, 0]].forEach(([a, b, px, pz]) => add(new T.BoxGeometry(a, 0.55, b), M.plaster, px, y0 + h + 0.3, pz));
          for (let bx = -W / 2 + 0.6; bx < W / 2 - 0.3; bx += 1.15) add(new T.CylinderGeometry(0.08, 0.09, D + 0.7, 5), M.beam, bx, y0 + h - 0.32, 0, Math.PI / 2);
        };
        storey(wd, dp, ht, 0);
        if (two) storey(wd * 0.55, dp * 0.6, ht * 0.75, ht + 0.28);
        add(new T.BoxGeometry(1.0, 1.95, 0.1), M.plank, (R() - 0.5) * (wd - 2), 0.97, dp / 2 + 0.02);
        for (let k = 0; k < 2; k++) add(new T.BoxGeometry(0.5, 0.45, 0.08), M.dark, (k ? 1 : -1) * wd * 0.3, ht * 0.68, dp / 2 + 0.02);
        add(new T.BoxGeometry(0.4, 0.45, 0.08), M.dark, wd * 0.2, ht * 0.68, -dp / 2 - 0.02);
        const ex = Math.abs(Math.cos(ry)) * wd / 2 + Math.abs(Math.sin(ry)) * dp / 2, ez = Math.abs(Math.sin(ry)) * wd / 2 + Math.abs(Math.cos(ry)) * dp / 2;
        w.addBox(x - ex, z - ez, x + ex, z + ez);
      };
      const hs = [];
      for (let k = 0; k < 400 && hs.length < 38; k++) {
        const x = (R() - 0.5) * 250, z = (R() - 0.5) * 250;
        if (inPlot(x, z, 10) || H(x, z) > 1.8 || Math.abs(x) < 5 || Math.abs(z - 40) < 5) continue;
        if (grove.some(g => Math.hypot(g[0] - x, g[1] - z) < 5.2) || hs.some(h => Math.hypot(h[0] - x, h[1] - z) < 14)) continue;
        if (Math.hypot(x - 44, z - 34) < 8 || Math.hypot(x - 74, z + 52) < 8 || Math.hypot(x + 64, z - 58) < 8 || Math.hypot(x - 58, z + 12) < 12 || Math.hypot(x + 72, z + 44) < 9 || Math.hypot(x - 22, z + 72) < 8) continue;
        hs.push([x, z]); houseAt(x, z, 6 + R() * 4, 5 + R() * 3, 3 + R() * 1.2, Math.round(R() * 2) * Math.PI / 2 + (R() - 0.5) * 0.12, R() < 0.3);
      }
      // ground cover: grass under the palms, shrubs, fallen fronds, stones
      SCAPE.scatter(w, { kind: 'grass', n: 2200, area: { x: 0, z: 0, r: 135 }, scale: [0.4, 0.9], seed: 51, color: '#b8c088', avoid: (x, z) => inPlot(x, z, -6) || H(x, z) > 2.5 });
      SCAPE.scatter(w, { kind: 'shrub', n: 220, area: { x: 0, z: 0, r: 140 }, scale: [0.5, 1.3], seed: 52, avoid: (x, z) => inPlot(x, z) || H(x, z) > 3 });
      SCAPE.scatter(w, { kind: 'model', model: 'grass_medium_01', fallback: 'grass', n: 120, area: [-55, -32, 32, 32], scale: [0.8, 1.4], seed: 53, avoid: (x, z) => Math.abs(z) < 1.2 || PALMS.some(p => Math.hypot(p.x - x, p.z - z) < 2.2) });
      SCAPE.scatter(w, { kind: 'model', model: 'shrub_01', fallback: 'shrub', n: 40, area: { x: 0, z: 0, r: 110 }, scale: [0.6, 1.2], seed: 54, avoid: (x, z) => inPlot(x, z, 2) });
      SCAPE.scatter(w, { kind: 'model', model: 'dry_branches_medium_01', fallback: 'thorn', n: 40, area: { x: 0, z: 0, r: 100 }, scale: [0.8, 1.3], seed: 55, avoid: (x, z) => inPlot(x, z, -4) });
      SCAPE.scatter(w, { kind: 'pebble', n: 1100, area: { x: 0, z: 0, r: 120 }, scale: [0.05, 0.18], seed: 56, color: '#a09080' });
      SCAPE.scatter(w, { kind: 'model', model: 'namaqualand_stones_01', fallback: 'pebble', n: 80, area: [-60, -40, 40, 40], scale: [0.8, 1.6], seed: 57, avoid: (x, z) => Math.abs(z) < 1 });
      // the basalt: boulders and rubble over the lava tracts
      const lava = (x, z) => U.smooth(1.5, 4, H(x, z));
      SCAPE.scatter(w, { kind: 'model', model: 'namaqualand_boulder_02', fallback: 'boulder', n: 70, area: { x: 0, z: 0, r: 300 }, density: lava, scale: [0.8, 2.6], seed: 61, color: '#4a4440', collide: true });
      SCAPE.scatter(w, { kind: 'model', model: 'namaqualand_rocks_01', fallback: 'rock', n: 140, area: { x: 0, z: 0, r: 260 }, density: lava, scale: [1, 2.5], seed: 62, color: '#4a4440' });
      SCAPE.scatter(w, { kind: 'boulder', tex: 'lava', n: 260, area: { x: 0, z: 0, r: 420 }, density: lava, scale: [1.5, 5], seed: 63, color: '#5a524c', castShadow: false });
      SCAPE.scatter(w, { kind: 'rock', tex: 'lava', n: 320, area: { x: 0, z: 0, r: 300 }, density: lava, scale: [0.3, 1.2], seed: 64, color: '#6a605a' });
      SCAPE.birds(w, { n: 10, x: 30, z: -40, y: 38, r: 70, color: 0x3a3028 });
      SCAPE.motes(w, { n: 70, area: [-30, 0.5, -16, 25, 7, 16], color: '#fff0c8', size: 0.22, additive: true });

      const box = (wd, ht, dp, mat, x, y, z, ry) => { const m = new T.Mesh(new T.BoxGeometry(wd, ht, dp), mat); m.position.set(x, y, z); m.rotation.y = ry || 0; m.castShadow = m.receiveShadow = true; S.add(m); return m; };
      const cyl = (r0, r1, h, mat, x, y, z, seg) => { const m = new T.Mesh(new T.CylinderGeometry(r0, r1, h, seg || 10), mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; S.add(m); return m; };

      // a low garden wall of sun-dried brick around the plot, with gaps for the paths
      const wall = (x0, z0, x1, z1) => {
        const len = Math.hypot(x1 - x0, z1 - z0), a = Math.atan2(z1 - z0, x1 - x0);
        const m = box(len, 1.5, 0.55, M.brick, (x0 + x1) / 2, w.ground((x0 + x1) / 2, (z0 + z1) / 2) + 0.65, (z0 + z1) / 2, -a);
        const cap = box(len, 0.12, 0.7, M.mud, m.position.x, m.position.y + 0.8, m.position.z, -a);
        if (Math.abs(a) < 0.1 || Math.abs(Math.abs(a) - Math.PI) < 0.1) w.addBox(Math.min(x0, x1), m.position.z - 0.3, Math.max(x0, x1), m.position.z + 0.3);
        else w.addBox(m.position.x - 0.3, Math.min(z0, z1), m.position.x + 0.3, Math.max(z0, z1));
        return cap;
      };
      wall(-24, -13, -3, -13); wall(3, -13, 24, -13); wall(-24, 13, -3, 13); wall(3, 13, 24, 13);
      wall(24, -13, 24, -2.5); wall(24, 2.5, 24, 13); wall(-24, -13, -24, -2.5); wall(-24, 2.5, -24, 13);
      // garden walls of the neighbours, lining the lanes
      [[-60, 30, -6, 30], [6, 30, 60, 30], [-60, -30, -6, -30], [6, -30, 70, -30], [30, -30, 30, -80], [-62, -30, -62, -90], [-62, 30, -62, 90], [36, 30, 36, 100]].forEach(a => wall(...a));

      // the farmhouse: mud brick, a parapet, roof beams through the wall, a door of old planks
      const hy = w.ground(HOUSE.x, HOUSE.z);
      box(9, 3.6, 6.5, M.plaster, HOUSE.x, hy + 1.7, HOUSE.z);
      box(9.3, 0.5, 6.8, M.mud, HOUSE.x, hy + 3.7, HOUSE.z);
      [-1, 1].forEach(s => box(9.3, 0.6, 0.25, M.plaster, HOUSE.x, hy + 4.2, HOUSE.z + s * 3.3));
      [-1, 1].forEach(s => box(0.25, 0.6, 6.8, M.plaster, HOUSE.x + s * 4.55, hy + 4.2, HOUSE.z));
      for (let i = 0; i < 7; i++) { const b = cyl(0.09, 0.1, 7.6, M.beam, HOUSE.x - 3.9 + i * 1.3, hy + 3.3, HOUSE.z, 6); b.rotation.x = Math.PI / 2; }
      box(1.2, 2.1, 0.12, M.plank, HOUSE.x + 1.6, hy + 1.05, HOUSE.z - 3.27);
      box(1.5, 0.22, 0.25, M.beam, HOUSE.x + 1.6, hy + 2.2, HOUSE.z - 3.3);
      [-2.4, 3.4].forEach(dx => box(0.6, 0.5, 0.1, M.dark, HOUSE.x + dx, hy + 2.4, HOUSE.z - 3.27));
      box(1.6, 0.18, 0.7, M.stone, HOUSE.x + 1.6, hy + 0.09, HOUSE.z - 3.65);
      w.addBox(HOUSE.x - 4.6, HOUSE.z - 3.3, HOUSE.x + 4.6, HOUSE.z + 3.3);
      // a shade of palm fronds on palm-trunk posts in front of the door (the store of bags is under it)
      const roofT = KIT.frondRoof(w, [2, 2]);
      [[-3.6, -4.2], [3.6, -4.2], [-3.6, -7.2], [3.6, -7.2]].forEach(([dx, dz]) => { cyl(0.16, 0.2, 2.8, M.bark, HOUSE.x + dx, hy + 1.4, HOUSE.z + dz, 8); w.addCircle(HOUSE.x + dx, HOUSE.z + dz, 0.25); });
      [-4.2, -7.2].forEach(dz => { const b = cyl(0.12, 0.12, 7.8, M.beam, HOUSE.x, hy + 2.85, HOUSE.z + dz, 6); b.rotation.z = Math.PI / 2; });
      const shade = new T.Mesh(new T.PlaneGeometry(8, 3.6), new T.MeshStandardMaterial({ map: roofT, alphaTest: 0.4, side: T.DoubleSide, color: 0xd8c098, roughness: 1 }));
      shade.rotation.x = -Math.PI / 2; shade.position.set(HOUSE.x, hy + 3.0, HOUSE.z - 5.7); shade.castShadow = true; S.add(shade);
      SCAPE.smoke(w, { sources: [[HOUSE.x - 3, hy + 4.4, HOUSE.z + 1.5]], n: 18, height: 10, size: 2, opacity: 0.16 });
      // stacked baskets and jars of the store
      [[-2.6, -5.2, 'wicker_basket_01', 1.3], [-1.8, -6.1, 'wicker_basket_01', 1.1], [-3.0, -6.4, 'ceramic_vase_01', 1.6], [-0.9, -5.0, 'jug_01', 1.4], [2.6, -5.0, 'brass_pot_01', 1.5], [3.0, -6.6, 'wooden_bowl_01', 1.6]]
        .forEach(([dx, dz, id, s]) => PHOTO.place(w, id, { pos: [HOUSE.x + dx, undefined, HOUSE.z + dz], s, ry: R() * 6 }));
      const bagPile = new T.Group(); bagPile.position.set(STORE.x, w.ground(STORE.x, STORE.z), STORE.z); S.add(bagPile); bagPile.userData.dynamic = true;
      for (let i = 0; i < 6; i++) { const b = new T.Mesh(new T.SphereGeometry(0.32, 10, 8), M.linen); b.scale.set(1.2, 0.45, 0.9); b.position.set((i % 3) * 0.5 - 0.5, 0.15 + Math.floor(i / 3) * 0.25, (i % 2) * 0.3); b.rotation.y = i; b.castShadow = true; bagPile.add(b); }

      // the drying floor (mirbad): a level floor ringed with stones, dates spread on mats
      const my = w.ground(MIRBAD.x, MIRBAD.z);
      const floor = new T.Mesh(new T.PlaneGeometry(10, 7), M.mud); floor.rotation.x = -Math.PI / 2; floor.position.set(MIRBAD.x, my + 0.04, MIRBAD.z); floor.receiveShadow = true; S.add(floor);
      for (let i = 0; i < 34; i++) { const a = i / 34 * Math.PI * 2; const st = new T.Mesh(new T.DodecahedronGeometry(0.22, 0), M.stone); st.position.set(MIRBAD.x + Math.cos(a) * 5.6 * Math.sign(Math.cos(a)) * Math.min(1, Math.abs(Math.cos(a)) * 3), my + 0.1, MIRBAD.z + Math.sin(a) * 4 * Math.min(1, Math.abs(Math.sin(a)) * 3) * Math.sign(Math.sin(a))); st.scale.y = 0.6; S.add(st); }
      const matT = w.tex(128, (g, s) => { g.fillStyle = '#b8945a'; g.fillRect(0, 0, s, s); for (let y = 0; y < s; y += 6) { g.fillStyle = (y / 6) % 2 ? '#a07c44' : '#c8a46a'; g.fillRect(0, y, s, 4); } }, [3, 3]);
      const mats = new T.MeshStandardMaterial({ map: matT, roughness: 1 });
      [[-2.4, -1.4], [2.2, -1.2], [-2.2, 1.6], [2.4, 1.5]].forEach(([dx, dz]) => { const m = new T.Mesh(new T.PlaneGeometry(3.6, 2.4), mats); m.rotation.x = -Math.PI / 2; m.rotation.z = R() * 0.2; m.position.set(MIRBAD.x + dx, my + 0.06, MIRBAD.z + dz); m.receiveShadow = true; S.add(m); });
      const dGeo = new T.SphereGeometry(0.05, 6, 4); dGeo.scale(1, 0.7, 1.5);
      const dMat = new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
      const spread = this.spread = new T.InstancedMesh(dGeo, dMat, 1600); spread.userData.dynamic = true; spread.count = 0; S.add(spread);
      const m4 = new T.Matrix4(), q4 = new T.Quaternion(), v4 = new T.Vector3(), s4 = new T.Vector3(1, 1, 1), c4 = new T.Color();
      this.addSpread = (n, ripe) => {
        for (let i = 0; i < n && spread.count < 1600; i++) {
          const mi = (spread.count / 200 | 0) % 4, mm = [[-2.4, -1.4], [2.2, -1.2], [-2.2, 1.6], [2.4, 1.5]][mi];
          v4.set(MIRBAD.x + mm[0] + (Math.random() - 0.5) * 3.2, my + 0.1, MIRBAD.z + mm[1] + (Math.random() - 0.5) * 2.1);
          q4.setFromEuler(new T.Euler(0, Math.random() * 6, 0)); m4.compose(v4, q4, s4); spread.setMatrixAt(spread.count, m4);
          spread.setColorAt(spread.count, c4.set(ripe ? 0x2a1208 : 0x6a3010).multiplyScalar(0.7 + Math.random() * 0.6)); spread.count++;
        }
        spread.instanceMatrix.needsUpdate = true; if (spread.instanceColor) spread.instanceColor.needsUpdate = true;
      };
      this.addSpread(400, true);

      /* ---------- the well: a camel-drawn draw-well, a cistern and the channel ---------- */
      const wy = w.ground(WELL.x, WELL.z);
      const ring = cyl(1.5, 1.6, 1.1, M.stone, WELL.x, wy + 0.5, WELL.z, 20); w.addCircle(WELL.x, WELL.z, 1.7);
      const hole = new T.Mesh(new T.CircleGeometry(1.15, 20), new T.MeshBasicMaterial({ color: 0x050403 })); hole.rotation.x = -Math.PI / 2; hole.position.set(WELL.x, wy + 1.06, WELL.z); S.add(hole);
      [-1.9, 1.9].forEach(dz => cyl(0.18, 0.22, 3.6, M.bark, WELL.x, wy + 1.8, WELL.z + dz, 8));
      const axle = cyl(0.1, 0.1, 4.2, M.beam, WELL.x, wy + 3.4, WELL.z, 6); axle.rotation.x = Math.PI / 2;
      const pulley = new T.Mesh(new T.TorusGeometry(0.42, 0.08, 6, 16), M.beam); pulley.position.set(WELL.x, wy + 3.4, WELL.z); pulley.userData.dynamic = true; S.add(pulley); this.pulley = pulley;
      // the camel walks a ramp to the west and back, drawing the leather bucket up
      const rampY = x => w.ground(x, WELL.z);
      const camel = this.camel = new T.Group(); camel.userData.dynamic = true; S.add(camel);
      const hair = new T.MeshStandardMaterial({ color: 0xb08a5c, roughness: 0.95 });
      const body = new T.Mesh(new T.SphereGeometry(1, 16, 10), hair); body.scale.set(1.25, 0.62, 0.55); body.position.y = 1.75; camel.add(body);
      const hump = new T.Mesh(new T.SphereGeometry(0.6, 12, 8), hair); hump.scale.set(1, 0.85, 0.75); hump.position.set(-0.1, 2.25, 0); camel.add(hump);
      const neck = new T.Mesh(new T.CylinderGeometry(0.17, 0.26, 1.5, 8), hair); neck.position.set(1.35, 2.15, 0); neck.rotation.z = -0.75; camel.add(neck);
      const head = new T.Mesh(new T.SphereGeometry(0.26, 10, 8), hair); head.scale.set(1.5, 0.75, 0.75); head.position.set(1.95, 2.72, 0); camel.add(head);
      const blanket = new T.Mesh(new T.CylinderGeometry(0.62, 0.62, 1.0, 12, 1, true, -Math.PI / 2 - 1.2, 2.4), M.linen); blanket.rotation.x = Math.PI / 2; blanket.rotation.z = Math.PI / 2; blanket.position.set(-0.1, 1.95, 0); camel.add(blanket);
      blanket.material = M.linen.clone(); blanket.material.color.set(0x8a3a24);
      this.legs = [[0.75, 0.3], [0.75, -0.3], [-0.75, 0.3], [-0.75, -0.3]].map(([x, z], i) => {
        const pivot = new T.Group(); pivot.position.set(x, 1.45, z); camel.add(pivot);
        const leg = new T.Mesh(new T.CylinderGeometry(0.08, 0.1, 1.45, 6), hair); leg.position.y = -0.72; pivot.add(leg); pivot.userData.ph = i % 2 ? 0 : Math.PI; return pivot;
      });
      camel.traverse(o => { if (o.isMesh) o.castShadow = true; });
      const rope = this.rope = new T.Mesh(new T.CylinderGeometry(0.025, 0.025, 1, 4), M.beam); rope.userData.dynamic = true; S.add(rope);
      const bucket = this.bucket = new T.Mesh(new T.CylinderGeometry(0.35, 0.25, 0.5, 10), M.leather); bucket.userData.dynamic = true; bucket.castShadow = true; S.add(bucket);
      this.rampY = rampY;
      // cistern and the stone trough that feeds the garden channel
      const cy0 = w.ground(CIST.x, CIST.z);
      box(4.2, 0.9, 3.2, M.stone, CIST.x, cy0 + 0.3, CIST.z); w.addBox(CIST.x - 2.1, CIST.z - 1.6, CIST.x + 2.1, CIST.z + 1.6);
      box(3.6, 0.3, 0.5, M.stone, (WELL.x + CIST.x) / 2 + 0.6, cy0 + 1.1, WELL.z);

      /* ---------- water: channels, gates and basins ---------- */
      const waterMat = this.waterMat = new T.ShaderMaterial({ vertexShader: WATER_VERT, fragmentShader: WATER_FRAG,
        uniforms: { uTime: { value: 0 }, uSun: { value: new T.Vector3(-0.5, 0.6, -0.6).normalize() }, uFog: { value: new T.Color(0xdccbb0) }, uFogD: { value: 0.0019 }, uSky: { value: new T.Color(0x86a6cc) }, uHor: { value: new T.Color(0xeadcc4) }, uDeep: { value: new T.Color(0x2a2418) } } });
      const chanLen = 14 - (CIST.x + 2.1);
      const chanW = new T.Mesh(new T.PlaneGeometry(chanLen, 0.6), waterMat); chanW.rotation.x = -Math.PI / 2; chanW.position.set((CIST.x + 2.1 + 14) / 2, 0.03, 0); chanW.userData.dynamic = true; S.add(chanW);
      const cisW = new T.Mesh(new T.PlaneGeometry(3.6, 2.6), waterMat); cisW.rotation.x = -Math.PI / 2; cisW.position.set(CIST.x, cy0 + 0.72, CIST.z); cisW.userData.dynamic = true; S.add(cisW);
      [-1, 1].forEach(s => box(chanLen, 0.2, 0.3, M.mud, chanW.position.x, 0.06, s * 0.45));
      this.feedW = []; this.gates = [];
      const gateGeo = new T.BoxGeometry(0.9, 0.35, 0.4);
      const gates = this.gateMesh = new T.InstancedMesh(gateGeo, M.mud, 8); gates.userData.dynamic = true; gates.castShadow = true; gates.receiveShadow = true; S.add(gates);
      const basinSoil = this.basinSoil = new T.InstancedMesh(new T.CircleGeometry(1.55, 24).rotateX(-Math.PI / 2), new T.MeshStandardMaterial({ color: 0xffffff, roughness: 1 }), 8);
      basinSoil.userData.dynamic = true; basinSoil.receiveShadow = true; S.add(basinSoil);
      const basinW = this.basinW = new T.InstancedMesh(new T.CircleGeometry(1.4, 24).rotateX(-Math.PI / 2), waterMat, 8); basinW.userData.dynamic = true; basinW.frustumCulled = false; S.add(basinW);
      const bankGeo = new T.TorusGeometry(1.6, 0.2, 5, 24); bankGeo.rotateX(Math.PI / 2); bankGeo.scale(1, 0.5, 1);
      PALMS.forEach((p, i) => {
        const s = Math.sign(p.z), fl = Math.abs(p.z) - 1.55 - 0.3;
        const fw = new T.Mesh(new T.PlaneGeometry(0.45, fl), waterMat); fw.rotation.x = -Math.PI / 2; fw.position.set(p.x, 0.028, s * (0.3 + fl / 2)); fw.userData.dynamic = true; fw.scale.y = 0.001; S.add(fw); this.feedW.push(fw);
        [-1, 1].forEach(k => box(0.22, 0.16, fl, M.mud, p.x + k * 0.34, 0.05, s * (0.3 + fl / 2)));
        const bk = new T.Mesh(bankGeo, M.mud); bk.position.set(p.x, 0.04, p.z); bk.receiveShadow = true; S.add(bk);
      });
      this.updGates = () => {
        PALMS.forEach((p, i) => {
          const g = p.gate || 0; v4.set(p.x, U.lerp(0.16, -0.14, g), Math.sign(p.z) * 0.62); q4.identity(); s4.set(1, 1, 1);
          m4.compose(v4, q4, s4); gates.setMatrixAt(i, m4);
          const wl = U.clamp(p.water); v4.set(p.x, U.lerp(-0.12, 0.05, Math.min(1, p.water)), p.z); s4.setScalar(0.4 + 0.6 * wl); m4.compose(v4, q4, s4); basinW.setMatrixAt(i, m4);
          v4.set(p.x, 0.015, p.z); s4.setScalar(1); m4.compose(v4, q4, s4); basinSoil.setMatrixAt(i, m4);
          basinSoil.setColorAt(i, c4.set(0xc9ae8a).lerp(new T.Color(0x5a4232), U.clamp(p.water * 1.2)));
        });
        gates.instanceMatrix.needsUpdate = basinW.instanceMatrix.needsUpdate = basinSoil.instanceMatrix.needsUpdate = true; basinSoil.instanceColor.needsUpdate = true;
      };

      /* ---------- the garden's own palms: young enough to reach the bunches ---------- */
      const parts = KIT.palmParts(w);
      const frondMat = cutout(parts.frondMat.clone()); frondMat.color.set(0xd8d0a0);
      const pals = [...PALMS.map((p, i) => Object.assign(p, { i, h: 4.2 + R() * 1.3 })), Object.assign(MALE, { i: 8, h: 6.2 })];
      pals.forEach(p => {
        const g = KIT.palm(w, p.h, { lean: 0.06, fronds: 18, frondScale: 1.05 });
        g.position.set(p.x, w.ground(p.x, p.z) - 0.05, p.z); g.rotation.y = R() * 6.28; S.add(g);
        g.traverse(o => { if (o.isMesh) { o.material = o.material === parts.trunkMat ? M.bark : frondMat; o.castShadow = o.receiveShadow = true; } });
        g.updateMatrixWorld(true); p.top = g.userData.top.clone().applyMatrix4(g.matrixWorld);
        w.addCircle(p.x, p.z, 0.4);
        Object.assign(p, { pollinated: false, water: 0.15 + R() * 0.2, gate: 0, bagged: false, ripe: 0, rate: 0.05 + R() * 0.03, harvested: false, lost: 0, fallen: 0, bounce: 0 });
      });
      this.male = MALE;

      // bunches, spathes, bags: instanced across the eight palms (3 per palm)
      const NB = 24, ND = 34;
      const stalkCurve = new T.QuadraticBezierCurve3(new T.Vector3(0, 0, 0), new T.Vector3(0.5, 0.18, 0), new T.Vector3(0.85, -0.85, 0));
      const stalkGeo = new T.TubeGeometry(stalkCurve, 8, 0.045, 5, false);
      const stalks = this.stalks = new T.InstancedMesh(stalkGeo, new T.MeshStandardMaterial({ color: 0xd8902e, roughness: 0.7 }), NB); stalks.userData.dynamic = true; stalks.castShadow = true; S.add(stalks);
      const spGeo = new T.SphereGeometry(0.16, 10, 6); spGeo.scale(1, 3.2, 1); spGeo.translate(0, 0.45, 0); spGeo.rotateZ(-0.55);
      const spathes = this.spathes = new T.InstancedMesh(spGeo, new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6, emissive: 0x3a3018, emissiveIntensity: 0.6 }), NB); spathes.userData.dynamic = true; S.add(spathes);
      const dateGeo = new T.SphereGeometry(0.055, 7, 5); dateGeo.scale(1, 1.5, 1);
      const dates = this.dates = new T.InstancedMesh(dateGeo, new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.38, metalness: 0.05 }), NB * ND); dates.userData.dynamic = true; dates.castShadow = true; S.add(dates);
      const netT = w.tex(128, (g, s) => { g.clearRect(0, 0, s, s); g.strokeStyle = 'rgba(200,170,120,1)'; g.lineWidth = 3; for (let i = -s; i < s * 2; i += 16) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + s, s); g.stroke(); g.beginPath(); g.moveTo(i, s); g.lineTo(i + s, 0); g.stroke(); } }, [3, 2]);
      const bagProf = [[0.02, -0.55], [0.2, -0.45], [0.3, -0.2], [0.32, 0.15], [0.22, 0.42], [0.06, 0.55]].map(([x, y]) => new T.Vector2(x, y));
      const bags = this.bags = new T.InstancedMesh(new T.LatheGeometry(bagProf, 12), new T.MeshStandardMaterial({ map: netT, alphaTest: 0.35, side: T.DoubleSide, color: 0xd8b888, roughness: 0.9 }), NB);
      bags.userData.dynamic = true; bags.castShadow = true; S.add(bags);
      this.bunch = [];
      PALMS.forEach((p, i) => {
        for (let k = 0; k < 3; k++) {
          const a = k * 2.09 + i * 0.7, M4 = new T.Matrix4().makeTranslation(p.top.x + Math.cos(a) * 0.3, p.top.y - 0.35, p.top.z + Math.sin(a) * 0.3).multiply(new T.Matrix4().makeRotationY(-a));
          const local = [];
          for (let d = 0; d < ND; d++) { const t = d / ND, aa = d * 2.39, rr = 0.08 + Math.sin(t * Math.PI) * 0.17; local.push(new T.Vector3(0.85 + Math.cos(aa) * rr, -0.95 - t * 0.62, Math.sin(aa) * rr)); }
          this.bunch.push({ p, M4, local, k });
        }
      });
      this.updBunches = () => {
        const z0 = new T.Matrix4().makeScale(0, 0, 0), mm = new T.Matrix4(), sc = new T.Matrix4();
        this.bunch.forEach((b, bi) => {
          const p = b.p, ph = this.phase, grown = ph === 'p2' ? 0.55 : (ph === 'p3' || ph === 'p4' || ph === 'final' || ph === 'done') ? 1 : 0;
          const bounce = 1 + Math.sin(p.bounce * 18) * p.bounce * 0.25;
          // spathes in spring, golden once pollinated; gone once the bunches hang
          if (grown === 0 && (ph === 'p1' || ph === 'film')) { sc.makeScale(bounce, bounce * (p.pollinated ? 1.15 : 1), bounce); mm.copy(b.M4).multiply(sc); spathes.setMatrixAt(bi, mm); spathes.setColorAt(bi, c4.set(p.pollinated ? 0xf0c060 : 0xf4ecd8)); }
          else spathes.setMatrixAt(bi, z0);
          const show = grown > 0 && !p.harvested;
          stalks.setMatrixAt(bi, show ? mm.copy(b.M4).multiply(sc.makeScale(grown, grown, grown)) : z0);
          bags.setMatrixAt(bi, show && p.bagged ? mm.copy(b.M4).multiply(sc.makeTranslation(0.85 * grown, -1.25 * grown, 0)).multiply(new T.Matrix4().makeScale(bounce * grown * 1.05, grown * 1.05, bounce * grown * 1.05)) : z0);
          const col = this.ripeColor(p.ripe);
          b.local.forEach((v, d) => {
            const idx = bi * ND + d, gone = !show || (d % 5 === 0 && d / 5 < p.lost);
            if (gone) { dates.setMatrixAt(idx, z0); return; }
            v4.set(v.x * grown, v.y * grown, v.z); q4.identity(); s4.setScalar((0.6 + 0.4 * grown) * bounce); m4.compose(v4, q4, s4);
            mm.copy(b.M4).multiply(m4); dates.setMatrixAt(idx, mm); dates.setColorAt(idx, c4.copy(col).multiplyScalar(0.8 + ((d * 37) % 10) / 25));
          });
        });
        [stalks, spathes, dates, bags].forEach(m => { m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; });
      };
      this.ripeColor = r => {
        const st = [[0, '#7c9a34'], [0.35, '#d8b030'], [0.62, '#c0602a'], [0.85, '#3a1a0c'], [1.3, '#24100a']];
        const c = U.ramp(st, r / 1.3); return new T.Color(c[0] / 255, c[1] / 255, c[2] / 255).convertSRGBToLinear();
      };
      // the fallen dates of an overripe bunch, on the soil around its palm
      this.fallenM = new T.InstancedMesh(dateGeo, new T.MeshStandardMaterial({ color: 0x2a140a, roughness: 0.4 }), 8 * 10); this.fallenM.count = 0; this.fallenM.userData.dynamic = true; S.add(this.fallenM);

      // a "needs" light over each palm: the goal is always the warmest thing in view
      this.needs = pals.map(p => { const g = KIT.glow(w, 0xffd890, 2.4, 0); g.position.set(p.x, p.top.y + 0.6, p.z); g.userData.dynamic = true; S.add(g); return g; });
      this.needRing = PALMS.map(p => { const g = new T.Mesh(new T.RingGeometry(1.75, 1.95, 40).rotateX(-Math.PI / 2), new T.MeshBasicMaterial({ color: 0x9fd0ff, transparent: true, opacity: 0, depthWrite: false })); g.position.set(p.x, 0.09, p.z); g.userData.dynamic = true; S.add(g); return g; });

      /* ---------- the gardener: a warm light, and footprints in the soil ---------- */
      this.me = KIT.glow(w, 0xffd89a, 1.5, 0.95); this.me.userData.dynamic = true; S.add(this.me);
      this.meCore = KIT.glow(w, 0xfff6e0, 0.45, 1); this.meCore.userData.dynamic = true; S.add(this.meCore);
      this.sel = new T.Mesh(new T.RingGeometry(0.9, 1.05, 40).rotateX(-Math.PI / 2), new T.MeshBasicMaterial({ color: 0xfff0c8, transparent: true, opacity: 0.0, depthWrite: false })); this.sel.userData.dynamic = true; S.add(this.sel);
      const fpT = w.tex(64, (g, s) => { g.clearRect(0, 0, s, s); g.fillStyle = 'rgba(50,34,22,0.9)'; g.beginPath(); g.ellipse(s / 2, s * 0.36, s * 0.16, s * 0.24, 0, 0, 6.283); g.fill(); g.beginPath(); g.ellipse(s / 2, s * 0.78, s * 0.12, s * 0.13, 0, 0, 6.283); g.fill(); });
      fpT.wrapS = fpT.wrapT = T.ClampToEdgeWrapping;
      const fp = this.fp = new T.InstancedMesh(new T.PlaneGeometry(0.16, 0.3).rotateX(-Math.PI / 2), new T.MeshBasicMaterial({ map: fpT, transparent: true, opacity: 0.4, depthWrite: false }), 120);
      fp.userData.dynamic = true; fp.count = 0; fp.frustumCulled = false; S.add(fp); this.fpI = 0;
      // what the light carries
      const carry = this.carry = new T.Group(); carry.userData.dynamic = true; S.add(carry);
      const strand = new T.Mesh(new T.CylinderGeometry(0.02, 0.1, 0.7, 6), new T.MeshStandardMaterial({ color: 0xf4e8c8, emissive: 0x4a3818, roughness: 0.6 })); strand.position.x = 0.45; strand.rotation.z = 0.4; carry.add(strand);
      const bagC = new T.Mesh(new T.SphereGeometry(0.22, 8, 6), M.linen); bagC.scale.set(1.2, 0.5, 0.9); bagC.position.set(-0.4, -0.1, 0); carry.add(bagC);
      const bask = new T.Mesh(new T.CylinderGeometry(0.3, 0.2, 0.28, 12, 1, true), new T.MeshStandardMaterial({ color: 0xa07438, roughness: 0.9, side: T.DoubleSide })); bask.position.set(0, -0.35, 0.35); carry.add(bask);
      const baskD = new T.Mesh(new T.SphereGeometry(0.26, 10, 6), new T.MeshStandardMaterial({ color: 0x2a140a, roughness: 0.4 })); baskD.scale.y = 0.4; baskD.position.set(0, -0.26, 0.35); carry.add(baskD);
      this.carryParts = { strand, bagC, bask, baskD };
      this.fx = sparks(w, 48);

      // birds of the garden for high summer: they land on unbagged bunches and flutter off when you come near
      const bodyG = new T.SphereGeometry(0.09, 8, 6); bodyG.scale(1.6, 0.9, 0.9);
      const wingG = new T.BufferGeometry(); wingG.setAttribute('position', new T.BufferAttribute(new Float32Array([-0.06, 0, -0.05, 0.06, 0, -0.05, 0, 0, -0.28]), 3)); wingG.computeVertexNormals();
      const bMat = new T.MeshStandardMaterial({ color: 0x5a4a3a, roughness: 0.9, side: T.DoubleSide });
      this.birdM = [new T.InstancedMesh(bodyG, bMat, 6), new T.InstancedMesh(wingG, bMat, 6), new T.InstancedMesh(wingG, bMat, 6)];
      this.birdM.forEach(m => { m.userData.dynamic = true; m.frustumCulled = false; S.add(m); });
      this.perches = [[-24, 1.5, -9], [24, 1.5, 9], [-15, 1.5, 13], [15, 1.5, -13], [8, 1.5, 13], [-8, 1.5, -13]];
      this.flock = this.perches.map((pp, i) => ({ p: new T.Vector3(...pp), home: new T.Vector3(...pp), state: 'away', t: 2 + i * 2.2, tgt: null, ph: i }));

      // the plate of seven: woven palm leaf on the step of the house
      const plate = this.plate = new T.Group(); plate.position.set(PLATE.x, w.ground(PLATE.x, PLATE.z) + 0.05, PLATE.z); plate.userData.dynamic = true; plate.visible = false; S.add(plate);
      const pl = new T.Mesh(new T.CylinderGeometry(0.42, 0.36, 0.06, 20), new T.MeshStandardMaterial({ map: matT, roughness: 1 })); plate.add(pl);
      this.seven = [];
      for (let i = 0; i < 7; i++) { const d = new T.Mesh(dateGeo, new T.MeshStandardMaterial({ color: 0x1e0c06, roughness: 0.3 })); const a = i ? (i - 1) / 6 * Math.PI * 2 : 0, rr = i ? 0.19 : 0; d.position.set(Math.cos(a) * rr, 0.08, Math.sin(a) * rr); d.rotation.z = Math.PI / 2; d.rotation.y = a; d.scale.setScalar(1.3); d.visible = false; plate.add(d); this.seven.push(d); }

      /* ---------- discoveries across the oasis ---------- */
      const gy = (x, z) => w.ground(x, z) + 1.3;
      [
        { pos: [44, 0, 34], title: 'Leaves that do not fall', text: 'He ﷺ said that among the trees is one whose leaves do not fall, and it is like the believer. It is the date palm. (Sahih al-Bukhari 61)', ar: 'إنّ من الشجر شجرةً لا يسقط ورقها، وإنّها مثلُ المسلم' },
        { pos: [74, 0, -52], title: 'Towering palms', text: '“And towering palm trees, loaded with clustered fruit.” (Qur’an 50:10)', ar: 'وَٱلنَّخۡلَ بَاسِقَٰتٖ لَّهَا طَلۡعٞ نَّضِيدٞ' },
        { pos: [-64, 0, 58], title: 'Within reach', text: '“And from palm trees come clusters of dates hanging within reach.” (Qur’an 6:99)', ar: 'وَمِنَ ٱلنَّخۡلِ مِن طَلۡعِهَا قِنۡوَانٞ دَانِيَةٞ' },
        { pos: [HOUSE.x + 4.8, 0, HOUSE.z + 3], title: 'A house with dates', text: 'He ﷺ said to ‘A’ishah, more than once: “A house without dates, its people are hungry.” (Sahih Muslim 2046)', ar: 'يا عائشة، بيتٌ لا تمر فيه جياعٌ أهلُه' },
        { pos: [58, 0, -12], title: 'Salman’s palms', text: 'Salman al-Farisi bought his freedom by planting three hundred palm shoots. The Prophet ﷺ set them in the ground with his own hand, and not one of them died. (Musnad Ahmad 23737)', ar: 'غرس النبي ﷺ فسائل سلمان بيده، فما ماتت منها واحدة' },
        { pos: [-72, 0, -44], title: 'A shoot in the hand', text: 'He ﷺ said: if the Hour comes while one of you holds a palm shoot, and he can plant it before it comes, let him plant it. (al-Adab al-Mufrad 479)', ar: 'إن قامت الساعة وفي يد أحدكم فسيلة فليغرسها' },
        { pos: [22, 0, -72], title: 'The garden of Bayruha', text: 'Abu Talhah owned more palm gardens than anyone of the Ansar in Madinah. Dearest to him was Bayruha, facing the mosque; the Prophet ﷺ would go in and drink its good water. Abu Talhah gave it away in charity. (Sahih al-Bukhari 1461)', ar: 'وكانت أحبّ أمواله إليه بيرحاء، وكانت مستقبلةَ المسجد' },
        { pos: [116, 0, 6], title: 'Between the two lava tracts', text: 'One wording of the hadith of the seven ‘ajwa speaks of dates “from between its two lava tracts”, the black basalt on either side of Madinah. (Sahih Muslim 2047)', ar: 'مَن أكل سبعَ تمراتٍ ممّا بين لابتيها' },
      ].forEach(d => { d.pos[1] = gy(d.pos[0], d.pos[2]); d.label = 'Look closer'; d.size = 2.2; this.discs = this.discs || []; this.discs.push(w.discover(d)); });
      // a nursery of shoots by the seedling discovery, and young shoots for Salman's palms
      SCAPE.scatter(w, { kind: 'palm', points: [[-70, -40, 1.6], [-73, -41, 1.3], [-69, -46, 1.8], [-75, -45, 1.4], [-71, -48, 1.2]], seed: 71 });
      const sal = []; for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) sal.push([52 + i * 3.4, -18 + j * 3.4, 2.6 + R() * 0.8]); SCAPE.scatter(w, { kind: 'palm', points: sal, seed: 72 });

      /* ---------- sound: wind in the fronds, water, birds ---------- */
      const bus = env.bus;
      this.snd = {
        wind: SND.noise(bus, { color: 'pink', type: 'bandpass', freq: 2200, q: 0.5, gain: 0.035 }),
        low: SND.noise(bus, { color: 'brown', type: 'lowpass', freq: 300, gain: 0.05 }),
        water: SND.noise(bus, { color: 'white', type: 'bandpass', freq: 1400, q: 1.4, gain: 0 }),
      };
      this.birdT = 2; this.cooT = 6;

      /* ---------- HUD: calendar and tool bar, Stardew-style ---------- */
      const L = w.ui.layer;
      this.hud = el(L, 'position:absolute;left:24px;top:64px;padding:6px 12px 7px;border-radius:4px 12px 4px 12px;background:rgba(6,9,20,.55);border:1px solid rgba(255,240,210,.18);color:#f4ead8;font:500 13px/1.35 Marcellus,Georgia,serif;letter-spacing:.06em;pointer-events:none;transition:opacity .5s;opacity:0', '');
      this.bar = el(L, 'position:absolute;left:50%;bottom:74px;transform:translateX(-50%);display:flex;gap:6px;transition:opacity .5s;opacity:0');
      this.tools = [['Pollen', 'pollen'], ['Hoe', 'hoe'], ['Bags', 'bags'], ['Basket', 'basket']].map(([n, id], i) => {
        const b = el(this.bar, 'min-width:68px;padding:5px 8px 6px;border-radius:6px;background:rgba(6,9,20,.6);border:1px solid rgba(255,240,210,.2);color:#e8dcc4;font:500 12px/1.2 Marcellus,Georgia,serif;text-align:center;cursor:pointer;pointer-events:auto;user-select:none', `<span style="opacity:.6;font-size:10px">${i + 1}</span> ${n}<br><b style="font-weight:400;color:#ffd890" data-c></b>`);
        b.addEventListener('pointerdown', e => { e.stopPropagation(); this.tool = i; SND.knock(env.bus, { f: 300, gain: 0.03, click: 3000 }); });
        return { b, id };
      });
      this.prompt = el(L, 'position:absolute;left:0;top:0;padding:4px 10px;border-radius:10px;background:rgba(6,9,20,.62);color:#fff3dc;font:500 13px/1.3 Marcellus,Georgia,serif;letter-spacing:.04em;white-space:nowrap;pointer-events:none;opacity:0;transition:opacity .2s');
      this.veil = el(L, 'position:absolute;inset:0;background:#05060c;opacity:0;pointer-events:none;transition:opacity 1.1s;display:flex;align-items:center;justify-content:center;color:#f4ead8;font:400 28px/1.3 Marcellus,Georgia,serif;letter-spacing:.12em;text-align:center');
      this.touchBtn = el(L, 'position:absolute;right:28px;bottom:120px;width:76px;height:76px;border-radius:50%;background:rgba(255,224,160,.18);border:1px solid rgba(255,240,210,.5);color:#fff3dc;font:500 14px Marcellus,Georgia,serif;display:none;align-items:center;justify-content:center;pointer-events:auto', 'Work');
      if (matchMedia('(pointer: coarse)').matches) this.touchBtn.style.display = 'flex';
      this.touchBtn.addEventListener('pointerdown', e => { e.stopPropagation(); this.act(env); });

      /* ---------- play: the overhead farm camera ---------- */
      w.onPointer = (e, p, phase) => {
        if (w.cine || this.phase === 'film') return false;
        if (phase !== 'down') return true;
        if (e.pointerType === 'mouse' || !e.pointerType) { this.act(env); return true; }
        if (e.clientX > env.w * 0.45) { this.act(env); return true; }
        return false; // the left thumb steers
      };
      w.mode = (dt) => this.play(env, dt);
      PALMS.forEach(p => { p.water = 0.15 + R() * 0.2; });
      this.updGates(); this.updBunches();
      this.birdM.forEach(m => { m.count = 0; });
      floor.receiveShadow = true;
      S.traverse(o => { if (o.isInstancedMesh) o.frustumCulled = false; });
      w.bake();
    },

    /* ---------------- the entrance film ---------------- */
    film(env, w) {
      const self = this, g = (x, z) => w.ground(x, z);
      const top = PALMS[2].top;
      return [
        { dur: 7, fade: 'dip', title: true, ease: 'glide', fov: [50, 44], path: [[[-210, 95, 230], [0, 6, 0]], [[-150, 70, 170], [0, 4, 0]], [[-100, 52, 120], [0, 3, 0]]],
          start: () => { SND.glow(env.bus, 196, { gain: 0.05, dur: 7 }); } },
        { dur: 6.5, fade: 'dip', path: [[[132, g(132, 30) + 6, 34], [40, 6, -6]], [[120, g(120, 14) + 4.5, 16], [30, 8, -4]]], fov: [48, 40],
          lines: [[0.4, 'Between Madinah’s two lava tracts lie the palm gardens of al-‘Aliyah.', 'بين لابتَي المدينة بساتين نخيل العالية'], [3.4, '“In the ‘ajwa of al-‘Aliyah there is healing.” (Sahih Muslim 2048)', '«إنّ في عجوةِ العاليةِ شفاءً»']] },
        { dur: 6.5, fade: 'cut', path: [[[top.x + 3.2, top.y + 0.6, top.z - 2.8], [top.x, top.y - 0.2, top.z]], [[top.x + 2.2, top.y + 1.1, top.z - 1.6], [top.x, top.y - 0.3, top.z]]], fov: [40, 34],
          lines: [[0.4, 'The Prophet ﷺ passed people pollinating their palms.', 'مرّ النبيّ ﷺ بقومٍ يلقّحون النخل'], [3.4, 'He said: “If you did not do it, it would be fine.”', 'فقال: «لو لم تفعلوا لصلح»']],
          during: (w, k, dt) => { if (Math.random() < dt * 8) self.fx.emit(top.x + (Math.random() - 0.5), top.y - 0.2, top.z + (Math.random() - 0.5), { n: 2, color: 0xffe8a0, up: 0.4, g: -0.2, size: 0.25 }); } },
        { dur: 6.5, fade: 'dip', ease: 'linear', path: [[[WELL.x - 7, g(WELL.x, 0) + 3.2, 7], [WELL.x, 2, 0]], [[CIST.x - 1, 2.2, 3.5], [CIST.x + 6, 0.5, 0]], [[-20, 1.4, 1.6], [-8, 0.6, 0]]],
          lines: [[0.4, 'They left it, and the dates came out poor.', 'فتركوه، فخرج شِيصًا'], [3.3, '“You know better the affairs of your world.” (Sahih Muslim 2363)', '«أنتم أعلمُ بأمرِ دنياكم»']],
          start: () => { SND.sing(env.bus, 220, { vowel: 'o', dur: 5, gain: 0.03 }); } },
        { dur: 6, fade: 'dip', fov: [44, 42], path: [[[6, 16, 26], [-6, 1, 0]], [[-12, 15, 20], [START.x, 0.5, START.z]]],
          line: 'A season in the grove: pollinate, water, protect, harvest.', ar: 'موسمٌ في البستان: تلقيحٌ وسقيٌ وحمايةٌ وجَنْي',
          start: (w) => {
            // the film hands over at the farm camera: borrow the walker's eye for it, then give it back
            const y = w.ground(START.x, START.z);
            w.pos.set(START.x, 0, START.z + CAM.D); w.eye = y + CAM.H - w.ground(START.x, START.z + CAM.D) + 0.6; w.yaw = 0; w.pitch = -Math.atan2(CAM.H, CAM.D);
            SND.glow(env.bus, 262, { gain: 0.04, dur: 6 });
          } },
      ];
    },
    filmOpts: {
      end(w) {
        const st = ENGINE.cur; w.pos.set(START.x, 0, START.z); w.eye = 1.62; w.yaw = 0; w.pitch = 0; w.y = w.ground(START.x, START.z);
        if (st && st.startPlay) st.startPlay(st.env || ENGINE.env);
      },
    },

    /* ---------------- phases ---------------- */
    startPlay(env) {
      if (this.phase !== 'film') return;
      this.env = env; this.camInit = false;
      this.hud.style.opacity = 1; this.bar.style.opacity = 1;
      this.begin(env, 'p1');
    },
    begin(env, ph) {
      const w = this.w; this.phase = ph; this.done = 0; this.clock = 6.5;
      const N = { p1: 8, p2: 8, p3: 8, p4: 8, final: 7 }[ph];
      const T1 = { p1: 'Part 1 of 4 · Spring: pollination', p2: 'Part 2 of 4 · Summer: water', p3: 'Part 3 of 4 · High summer: guard the fruit', p4: 'Part 4 of 4 · Autumn: harvest', final: 'Seven for the morning' }[ph];
      const step = { p1: 'Cut male flowers at the tall palm, then pollinate each glowing palm', p2: 'Open each basin’s gate with the hoe; close it when full so the water reaches the rest', p3: 'Fetch bags from the store by the house and bag every palm’s bunches', p4: 'Harvest each bunch when it is dark and soft; spread it on the drying floor', final: 'Set seven ‘ajwa on the plate by the door' }[ph];
      w.activity(T1, N, step);
      if (ph === 'p1') { this.inv.pollen = 0; this.tool = 0; w.goal([MALE.x, MALE.top.y, MALE.z]); }
      if (ph === 'p2') { this.tool = 1; w.goal(null); }
      if (ph === 'p3') { this.tool = 2; this.inv.bags = 0; w.goal([STORE.x, 1.2, STORE.z]); }
      if (ph === 'p4') { this.tool = 3; this.inv.basket = 0; w.goal(null); PALMS.forEach((p, i) => { p.ripe = 0.05 + (i % 3) * 0.12; }); }
      if (ph === 'final') { this.plate.visible = true; w.goal([PLATE.x, 1, PLATE.z]); }
      this.updBunches();
    },
    // the end of a day: dusk, night, a dove at dawn, and the grove has grown
    sleep(env, next, card) {
      const w = this.w; this.busy = 1;
      this.veil.innerHTML = `<div><div style="font-size:15px;opacity:.7;letter-spacing:.3em">${card[0]}</div><div style="margin-top:8px">${card[1]}</div></div>`;
      this.veil.style.opacity = 1;
      SND.glow(env.bus, 147, { gain: 0.05, dur: 5 });
      setTimeout(() => {
        if (!this.w) return;
        this.setSky(SKIES[next]); this.day = 1; this.begin(env, next);
        setTimeout(() => { if (!this.w) return; this.veil.style.opacity = 0; this.busy = 0; SND.coo(env.bus, { gain: 0.05 }); SND.chirp(env.bus, {}); }, 1800);
      }, 1500);
    },
    // all the targets in reach this moment, with what the tools would do
    targets() {
      const ph = this.phase, out = [], inv = this.inv;
      if (ph === 'p1') {
        out.push({ x: MALE.x, z: MALE.z, r: 2.6, tool: 0, label: inv.pollen >= 4 ? 'Your hands are full of flowers' : 'Cut strands of male flowers', ok: inv.pollen < 4, act: () => this.cutPollen() });
        PALMS.forEach(p => { if (!p.pollinated) out.push({ x: p.x, z: p.z, r: 2.4, tool: 0, p, label: inv.pollen ? 'Pollinate the palm' : 'Needs pollen from the tall palm', ok: inv.pollen > 0, act: () => this.pollinate(p) }); });
      }
      if (ph === 'p2') PALMS.forEach(p => out.push({ x: p.x, z: Math.sign(p.z) * 0.9, r: 1.8, tool: 1, p, label: p.gate ? (p.water >= 1 ? 'Full — close the gate' : 'Close the gate') : (p.water >= 0.8 ? 'Watered (open again?)' : 'Open the gate'), ok: true, act: () => this.toggleGate(p) }));
      if (ph === 'p3') {
        out.push({ x: STORE.x, z: STORE.z, r: 2.6, tool: 2, label: inv.bags >= 4 ? 'You carry four bags' : 'Take bags of palm fibre', ok: inv.bags < 4, act: () => this.takeBags() });
        PALMS.forEach(p => { if (!p.bagged) out.push({ x: p.x, z: p.z, r: 2.4, tool: 2, p, label: inv.bags ? 'Bag the bunches' : 'Fetch bags from the store', ok: inv.bags > 0, act: () => this.bag(p) }); });
      }
      if (ph === 'p4') {
        PALMS.forEach(p => { if (!p.harvested) out.push({ x: p.x, z: p.z, r: 2.4, tool: 3, p, label: this.ripeLabel(p), ok: p.ripe >= 0.85 && inv.basket < 3, act: () => this.harvest(p) }); });
        if (inv.basket) out.push({ x: MIRBAD.x, z: MIRBAD.z, r: 5.5, tool: 3, label: 'Spread the dates to dry', ok: true, act: () => this.spreadDates() });
      }
      if (ph === 'final' && this.done < 7) out.push({ x: PLATE.x, z: PLATE.z, r: 2.4, tool: 3, label: `Set out an ‘ajwa (${this.done + 1} of 7)`, ok: true, act: () => this.placeSeven() });
      (this.discs || []).forEach(it => { if (!it.done) out.push({ x: it.pos.x, z: it.pos.z, r: 3, tool: -1, label: 'Look closer', ok: true, act: () => { it.done = true; it.onUse(this.w, it); } }); });
      return out;
    },
    ripeLabel(p) {
      if (this.inv.basket >= 3) return 'Basket full — spread it on the drying floor';
      if (p.ripe < 0.35) return 'Green and hard — not yet';
      if (p.ripe < 0.62) return 'Turning yellow — not yet';
      if (p.ripe < 0.85) return 'Softening — almost';
      if (p.ripe < 1.25) return 'Dark and soft — harvest';
      return 'Overripe — gather what is left';
    },
    cutPollen() {
      const env = this.env; this.inv.pollen = 4; this.w.goal(null);
      this.fx.emit(MALE.x, MALE.top.y - 0.4, MALE.z, { n: 20, color: 0xfff0b0, up: 0.6, g: -0.6 });
      SND.step(env.bus, { gain: 0.12, f: 2400 }); SND.sing(env.bus, 293.66, { vowel: 'a', dur: 1.4, gain: 0.035 });
      this.w.say('Male flowers', 'You cut four strands of the male palm’s flowers. Tie one into the opened spathe of each palm.', { ms: 5000 });
    },
    pollinate(p) {
      const env = this.env; this.inv.pollen--; p.pollinated = true; p.bounce = 1; this.done++;
      this.fx.emit(p.x, p.top.y - 0.3, p.z, { n: 22, color: 0xffe08a, up: 1.2, g: -0.5, spread: 1.2 });
      SND.sing(env.bus, SCALE[this.done - 1], { vowel: 'a', dur: 1.6, gain: 0.04 }); SND.step(env.bus, { gain: 0.08, f: 2800 });
      this.w.progress(this.done);
      if (!this.inv.pollen && this.done < 8) this.w.goal([MALE.x, MALE.top.y, MALE.z]);
      this.updBunches();
      if (this.done >= 8) { SND.glow(env.bus, 196, { gain: 0.05, dur: 5 }); setTimeout(() => this.w && this.sleep(env, 'p2', ['SUMMER', 'The bunches set; the soil dries']), 2600); }
    },
    toggleGate(p) {
      const env = this.env; p.gate = p.gate ? 0 : 1;
      SND.thump(env.bus, { gain: 0.08 }); SND.step(env.bus, { gain: 0.1, f: 600 });
      if (p.gate) SND.drop(env.bus, { f: 600, gain: 0.05 });
      this.fx.emit(p.x, 0.3, Math.sign(p.z) * 0.62, { n: 10, color: 0xb89a70, up: 1.2, g: -4, size: 0.25 });
      this.updGates();
    },
    takeBags() { this.inv.bags = 4; this.w.goal(null); SND.step(this.env.bus, { gain: 0.15, f: 900 }); SND.sing(this.env.bus, 329.63, { vowel: 'o', dur: 1.2, gain: 0.03 }); },
    bag(p) {
      const env = this.env; this.inv.bags--; p.bagged = true; p.bounce = 1; this.done++;
      this.fx.emit(p.x, p.top.y - 1, p.z, { n: 12, color: 0xe0c898, up: 0.6, g: -2, size: 0.2 });
      SND.step(env.bus, { gain: 0.12, f: 1800 }); SND.sing(env.bus, SCALE[this.done - 1], { vowel: 'o', dur: 1.4, gain: 0.04 });
      this.flock.forEach(b => { if (b.tgt === p && b.state !== 'away') { b.state = 'flee'; b.t = 0; } });
      this.w.progress(this.done);
      if (!this.inv.bags && this.done < 8) this.w.goal([STORE.x, 1.2, STORE.z]);
      this.updBunches();
      if (this.done >= 8) { SND.glow(env.bus, 220, { gain: 0.05, dur: 5 }); setTimeout(() => this.w && this.sleep(env, 'p4', ['AUTUMN', 'The bunches colour in the heat']), 2600); }
    },
    harvest(p) {
      const env = this.env;
      p.harvested = true; this.inv.basket++; p.bounce = 1;
      this.fx.emit(p.x, p.top.y - 1.2, p.z, { n: 16, color: 0xffc080, up: 0.4, g: -3, size: 0.22 });
      SND.knock(env.bus, { f: 160, gain: 0.12, click: 1200 }); SND.sing(env.bus, 261.63 * (1 + this.inv.basket * 0.125), { vowel: 'a', dur: 1.3, gain: 0.035 });
      this.updBunches();
      if (this.inv.basket >= 3 || PALMS.every(q => q.harvested)) this.w.goal([MIRBAD.x, 1, MIRBAD.z]);
    },
    spreadDates() {
      const env = this.env, n = this.inv.basket; this.inv.basket = 0; this.done += n; this.w.goal(null);
      this.addSpread(n * 70, true);
      this.fx.emit(MIRBAD.x, 0.5, MIRBAD.z, { n: 18, color: 0xffd8a0, up: 0.8, g: -2, spread: 4 });
      SND.step(env.bus, { gain: 0.15, f: 700 }); SND.sing(env.bus, SCALE[Math.min(7, this.done - 1)], { vowel: 'a', dur: 1.8, gain: 0.045 });
      this.w.progress(this.done);
      if (this.done >= 8) setTimeout(() => this.w && this.sleep(env, 'final', ['DAWN', 'Seven for the morning']), 2200);
    },
    placeSeven() {
      const env = this.env, i = this.done; this.seven[i].visible = true; this.seven[i].scale.setScalar(1.8); this.done++;
      SND.sing(env.bus, SCALE[i], { vowel: i % 2 ? 'o' : 'a', dur: 2.2, gain: 0.045 });
      this.fx.emit(PLATE.x, 0.4, PLATE.z, { n: 8, color: 0xfff0d0, up: 0.6, g: -0.3, size: 0.18 });
      this.w.progress(this.done);
      if (this.done >= 7) {
        this.phase = 'done'; this.w.goal(null);
        SND.glow(env.bus, 196, { gain: 0.07, dur: 9 }); SND.glow(env.bus, 293.66, { gain: 0.05, dur: 9, delay: 1.2 });
        setTimeout(() => { if (!this.w) return;
          this.w.say('Seven ‘ajwa', '“Whoever has seven ‘ajwa dates in the morning will not be harmed that day by poison or magic.” (Sahih al-Bukhari 5445; Sahih Muslim 2047)', { ar: 'مَن تصبّح كلَّ يومٍ سبعَ تمراتٍ عجوةً لم يضرّه في ذلك اليوم سمٌّ ولا سحر', ms: 16000 });
          this.w.finish('A season in the grove, and seven for the morning');
        }, 2600);
      }
    },
    act(env) {
      if (!this.w || this.busy || this.w.cine || this.phase === 'film') return;
      const t = this.target;
      if (!t) { SND.step(env.bus, { gain: 0.05, f: 500 }); return; }
      if (t.tool >= 0 && t.tool !== this.tool) this.tool = t.tool; // the right tool comes to hand
      if (!t.ok) { if (t.p) t.p.bounce = 0.4; SND.sing(env.bus, 174.61, { vowel: 'u', dur: 0.8, gain: 0.025 }); return; }
      t.act();
    },
    onKey(env, e) {
      if (!this.w || this.w.cine) return;
      const k = e.key;
      if (k === 'e' || k === 'E' || k === ' ' || k === 'Enter') this.act(env);
      if (k >= '1' && k <= '4') { this.tool = +k - 1; SND.knock(env.bus, { f: 300, gain: 0.03, click: 3000 }); }
    },
    wheel(env, dy) { this.zoom = U.clamp(this.zoom + dy * 0.001, 0.6, 1.6); },

    /* ---------------- the farm camera, movement and the living garden ---------------- */
    play(env, dt) {
      const w = this.w, k = w.keys;
      let mx = 0, mz = 0;
      if (!this.busy) {
        if (k.has('w') || k.has('ArrowUp')) mz -= 1; if (k.has('s') || k.has('ArrowDown')) mz += 1;
        if (k.has('a') || k.has('ArrowLeft')) mx -= 1; if (k.has('d') || k.has('ArrowRight')) mx += 1;
        if (w.joy) { mx += w.joy.dx; mz += w.joy.dy; }
      }
      const ml = Math.hypot(mx, mz); if (ml > 1) { mx /= ml; mz /= ml; }
      const spd = k.has('Shift') ? 7 : 4.4;
      w.vel.x = U.damp(w.vel.x, mx * spd, 10, dt); w.vel.z = U.damp(w.vel.z, mz * spd, 10, dt);
      const nx = new T.Vector3(w.pos.x + w.vel.x * dt, 0, w.pos.z + w.vel.z * dt); collide(w, nx);
      w.pos.x = nx.x; w.pos.z = nx.z; w.y = w.ground(w.pos.x, w.pos.z);
      if (ml > 0.15) this.facing = Math.atan2(mx, mz);
      // footprints, left and right
      if (Math.hypot(w.pos.x - this.lastStep.x, w.pos.z - this.lastStep.z) > 0.75) {
        const f = this.facing, sx = Math.cos(f) * 0.13 * this.stepSide, sz = -Math.sin(f) * 0.13 * this.stepSide; this.stepSide *= -1;
        const m = new T.Matrix4().compose(new T.Vector3(w.pos.x + sx, w.y + 0.03, w.pos.z + sz), new T.Quaternion().setFromEuler(new T.Euler(0, f + Math.PI, 0)), new T.Vector3(1, 1, 1));
        this.fp.setMatrixAt(this.fpI % 120, m); this.fpI++; this.fp.count = Math.min(120, this.fpI); this.fp.instanceMatrix.needsUpdate = true;
        this.lastStep.set(w.pos.x, 0, w.pos.z);
        const s = w.surface(w.pos.x, w.pos.z); if (s === 'water') SND.drop(env.bus, { f: 400, gain: 0.03 }); else SND.step(env.bus, { gain: 0.06 * (k.has('Shift') ? 1.4 : 1), f: U.rnd(450, 750) });
      }
      // the light and what it carries
      const ly = w.y + 1.1 + Math.sin(w.time * 2.2) * 0.06;
      this.me.position.set(w.pos.x, ly, w.pos.z); this.meCore.position.copy(this.me.position);
      this.me.material.opacity = 0.8 + Math.sin(w.time * 3.1) * 0.1;
      this.carry.position.set(w.pos.x, ly - 0.1, w.pos.z); this.carry.rotation.y = this.facing;
      const cp = this.carryParts; cp.strand.visible = this.inv.pollen > 0; cp.bagC.visible = this.inv.bags > 0; cp.bask.visible = this.phase === 'p4' || this.phase === 'final'; cp.baskD.visible = this.inv.basket > 0;
      // the camera: high, three-quarter, a little behind
      const tx = w.pos.x, ty = w.y + 0.6, tz = w.pos.z, Hh = CAM.H * this.zoom, Dd = CAM.D * this.zoom;
      const cam = w.camera;
      if (!this.camInit) { cam.position.set(tx, ty + Hh, tz + Dd); this.camInit = true; }
      cam.position.x = U.damp(cam.position.x, tx, 6, dt); cam.position.y = U.damp(cam.position.y, ty + Hh, 6, dt); cam.position.z = U.damp(cam.position.z, tz + Dd, 6, dt);
      cam.lookAt(cam.position.x, cam.position.y - Hh, cam.position.z - Dd);
      if (cam.fov !== 42) { cam.fov = 42; cam.updateProjectionMatrix(); }
      CUT.uCutA.value.copy(cam.position); CUT.uCutB.value.set(tx, w.y, tz); CUT.uCutR.value = 3.4;
      if (w._shadow) { const L = w._shadow.light, px = Math.round(tx / 1.5) * 1.5, pz = Math.round(tz / 1.5) * 1.5; L.target.position.set(px, 0, pz); L.position.set(px + w._shadow.off.x, w._shadow.off.y, pz + w._shadow.off.z); }
      // the nearest thing to work on, a little ahead of the light
      const ax = w.pos.x + Math.sin(this.facing) * 0.9, az = w.pos.z + Math.cos(this.facing) * 0.9;
      let best = null, bd = 1e9;
      for (const t of this.targets()) { const d = Math.hypot(t.x - ax, t.z - az), d0 = Math.hypot(t.x - w.pos.x, t.z - w.pos.z); if (d0 > t.r + 0.8) continue; if (d < bd) { bd = d; best = t; } }
      this.target = best;
      if (best && !this.busy) {
        this.sel.position.set(best.x, w.ground(best.x, best.z) + 0.08, best.z); this.sel.material.opacity = 0.55 + Math.sin(w.time * 5) * 0.15;
        this.sel.material.color.set(best.ok ? 0xfff0c8 : 0x9aa4b8); this.sel.scale.setScalar(best.r > 4 ? 3 : best.tool === 1 ? 0.6 : 1.4);
        const v = new T.Vector3(best.x, w.ground(best.x, best.z) + 2.2, best.z).project(cam);
        this.prompt.textContent = (matchMedia('(pointer: coarse)').matches ? '' : 'E · ') + best.label;
        this.prompt.style.transform = `translate(${(v.x * 0.5 + 0.5) * env.w}px, ${(-v.y * 0.5 + 0.5) * env.h}px) translate(-50%, -100%)`;
        this.prompt.style.opacity = 1; this.prompt.style.color = best.ok ? '#fff3dc' : '#b8c0d0';
      } else { this.sel.material.opacity = 0; this.prompt.style.opacity = 0; }
      this.hudStep();
    },
    hudStep() {
      const ph = this.phase, inv = this.inv;
      const hh = Math.floor(this.clock), mm = Math.floor((this.clock - hh) * 6) * 10;
      this.hud.innerHTML = `${SEASONS[ph] || ''} · Day ${this.day}<br><span style="opacity:.75;font-size:12px">${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')} · al-‘Aliyah</span>`;
      const counts = [inv.pollen ? `×${inv.pollen}` : '', '', inv.bags ? `×${inv.bags}` : '', ph === 'p4' ? `${inv.basket}/3` : ''];
      const unlocked = { p1: 1, p2: 2, p3: 3, p4: 4, final: 4, done: 4 }[ph] || 1;
      this.tools.forEach((t, i) => {
        t.b.style.borderColor = i === this.tool ? 'rgba(255,216,144,.9)' : 'rgba(255,240,210,.2)';
        t.b.style.background = i === this.tool ? 'rgba(80,56,20,.7)' : 'rgba(6,9,20,.6)';
        t.b.style.opacity = i < unlocked ? 1 : 0.35;
        t.b.querySelector('[data-c]').textContent = counts[i] || ' ';
      });
    },

    update(env, dt) {
      const w = this.w; if (!w) return;
      w.update(dt);
      const film = !!w.filmS, ph = this.phase;
      this.waterMat.uniforms.uTime.value = w.time;
      this.fx.step(dt);
      if (film) { CUT.uCutR.value = 0; this.hud.style.opacity = 0; this.bar.style.opacity = 0; this.prompt.style.opacity = 0; }
      else if (ph !== 'film') { this.hud.style.opacity = 1; this.bar.style.opacity = 1; }
      // the well never rests: the camel walks the ramp and the bucket rises
      const cyc = (w.time % 14) / 14, out = cyc < 0.5 ? U.ease(cyc * 2) : 1 - U.ease((cyc - 0.5) * 2);
      const cx = WELL.x - 4 - out * 14, moving = Math.abs(Math.sin(cyc * Math.PI * 2)) > 0.05;
      this.camel.position.set(cx, this.rampY(cx), WELL.z + 0.4); this.camel.rotation.y = cyc < 0.5 ? Math.PI : 0;
      this.legs.forEach(l => { l.rotation.z = moving ? Math.sin(w.time * 6 + l.userData.ph) * 0.35 : 0; });
      const by = this.rampY(WELL.x) + 0.2 + out * 2.8;
      this.bucket.position.set(WELL.x, by, WELL.z); this.pulley.rotation.z = -out * 9;
      const r0 = new T.Vector3(WELL.x, this.rampY(WELL.x) + 3.4, WELL.z + 0.4), r1 = new T.Vector3(cx + (cyc < 0.5 ? 1.6 : -1.6) * 0, this.camel.position.y + 2.0, WELL.z + 0.4);
      this.rope.position.copy(r0).add(r1).multiplyScalar(0.5); this.rope.scale.y = r0.distanceTo(r1); this.rope.lookAt(r1); this.rope.rotateX(Math.PI / 2);
      if (this._lastOut < 0.97 && out >= 0.97) { SND.noise && this.fx.emit(CIST.x - 1.5, 1.4, 0, { n: 16, color: 0xcfe4ff, up: 0.5, g: -5, size: 0.2 }); const sp = w.spatial(new T.Vector3(WELL.x, 0, 0), 14); SND.drop(env.bus, { f: 300, gain: 0.08 * sp.gain + 0.01 }); }
      this._lastOut = out;
      // ambience
      const near = Math.max(0, 1 - Math.abs(w.pos.z) / 6) * (w.pos.x > -30 && w.pos.x < 15 ? 1 : 0);
      this.snd.water.set('gain', 0.012 + near * 0.035 + (ph === 'p2' ? PALMS.filter(p => p.gate).length * 0.006 : 0), 0.5);
      this.snd.wind.set('gain', 0.03 + 0.02 * Math.sin(w.time * 0.23) ** 2, 1);
      this.birdT -= dt; if (this.birdT < 0) { this.birdT = U.rnd(2, 6); SND.chirp(env.bus, { gain: 0.02 }); }
      this.cooT -= dt; if (this.cooT < 0) { this.cooT = U.rnd(8, 16); SND.coo(env.bus, { gain: 0.03 }); }
      if (film || ph === 'film') { PALMS.forEach(p => { p.bounce = 0; }); return; }

      // the day passes (faster in the autumn, when the fruit colours from day to day)
      this.clock += dt * (ph === 'p4' ? 0.45 : 0.08);
      if (this.clock >= 18.5) { this.clock = 6.5; this.day++; }
      if (this.sunBase && w._shadow) {
        const a = (this.clock - 12) * 0.03, c = Math.cos(a), s = Math.sin(a), d = this.sunBase;
        w._shadow.off.set(d.x * c - d.z * s, d.y, d.x * s + d.z * c).normalize().multiplyScalar(85);
      }
      let dirty = false;
      PALMS.forEach(p => { if (p.bounce > 0) { p.bounce = Math.max(0, p.bounce - dt * 1.6); dirty = true; } });
      // needs: a soft warm light over every palm still waiting for your hands
      PALMS.forEach((p, i) => {
        let need = 0;
        if (ph === 'p1') need = p.pollinated ? 0 : 1;
        if (ph === 'p3') need = p.bagged ? 0 : 0.7;
        if (ph === 'p4') need = p.harvested ? 0 : p.ripe >= 0.85 ? 1 : 0.15;
        const g = this.needs[i]; g.material.opacity = U.damp(g.material.opacity, need * (0.55 + 0.15 * Math.sin(w.time * 2.5 + i)), 5, dt);
        g.material.color.set(ph === 'p4' && p.ripe >= 1.25 ? 0xffa060 : 0xffd890);
        const rg = this.needRing[i]; rg.material.opacity = U.damp(rg.material.opacity, ph === 'p2' ? (p.water < 0.8 ? 0.55 : 0) : 0, 5, dt);
      });
      this.needs[8].material.opacity = U.damp(this.needs[8].material.opacity, ph === 'p1' && this.inv.pollen === 0 ? 0.7 : 0, 5, dt);

      if (ph === 'p2') {
        // the well's flow shares itself among the open gates; a full basin left open wastes it
        const open = PALMS.filter(p => p.gate), q = 0.3 * (0.85 + 0.15 * Math.sin(w.time * 0.45));
        PALMS.forEach((p, i) => {
          if (p.gate) { p.water = Math.min(1.25, p.water + q / open.length * dt); if (p.water >= 1.2) { p.spill = (p.spill || 0) + dt; if (Math.random() < dt * 3) this.fx.emit(p.x, 0.1, p.z + Math.sign(p.z) * 1.5, { n: 2, color: 0xcfe4ff, up: 0.6, g: -3, size: 0.15 }); } }
          else p.water = Math.max(0, p.water - 0.004 * dt);
          this.feedW[i].scale.y = U.damp(this.feedW[i].scale.y, p.gate ? 1 : 0.001, 4, dt);
        });
        const n = PALMS.filter(p => p.water >= 0.8).length;
        if (n !== this.done) { if (n > this.done) SND.sing(env.bus, SCALE[n - 1], { vowel: 'a', dur: 1.4, gain: 0.035 }); this.done = n; w.progress(n); }
        this.updGates();
        if (n >= 8 && !this.busy) {
          PALMS.forEach(p => { p.gate = 0; }); this.updGates();
          SND.glow(env.bus, 196, { gain: 0.05, dur: 5 });
          this.busy = 1; setTimeout(() => this.w && this.sleep(env, 'p3', ['HIGH SUMMER', 'The bunches swell; the birds have noticed']), 2400);
        }
      }
      if (ph === 'p3') this.birds(env, dt);
      else this.birdM.forEach(m => { m.count = 0; });
      if (ph === 'p4') {
        PALMS.forEach((p, i) => {
          if (p.harvested) return;
          const before = p.ripe; p.ripe += p.rate * dt * 0.5; dirty = true;
          if (before < 0.85 && p.ripe >= 0.85) SND.bell(env.bus, 659.25, { gain: 0.015 });
          if (p.ripe > 1.25 && p.fallen < 6 && Math.random() < dt * 0.4) { // overripe: a date drops to the soil, still good to gather
            p.fallen++; p.lost = Math.min(7, p.lost + 1);
            const fm = this.fallenM, a = Math.random() * 6.28, r = 0.6 + Math.random() * 1.2;
            fm.setMatrixAt(fm.count, new T.Matrix4().makeTranslation(p.x + Math.cos(a) * r, w.ground(p.x, p.z) + 0.05, p.z + Math.sin(a) * r)); fm.count++; fm.instanceMatrix.needsUpdate = true;
            SND.knock(env.bus, { f: 220, gain: 0.03, click: 1500 });
          }
        });
      }
      if (dirty) this.updBunches();
    },
    birds(env, dt) {
      const w = this.w, [body, wl, wr] = this.birdM, m4 = new T.Matrix4(), q = new T.Quaternion(), e = new T.Euler(), s = new T.Vector3(1, 1, 1);
      const free = PALMS.filter(p => !p.bagged);
      this.flock.forEach((b, i) => {
        b.t -= dt;
        if (b.state === 'away' && b.t <= 0 && free.length) { b.state = 'fly'; b.tgt = free[(Math.random() * free.length) | 0]; b.p.copy(b.home).add(new T.Vector3(0, 6, 0)); }
        if (b.state === 'fly' || b.state === 'flee' || b.state === 'peck') {
          if (b.state === 'fly') {
            if (!b.tgt || b.tgt.bagged) { b.state = 'flee'; }
            else { const tp = new T.Vector3(b.tgt.top.x + 0.9, b.tgt.top.y - 0.9, b.tgt.top.z); const d = tp.clone().sub(b.p); const L = d.length(); if (L < 0.2) { b.state = 'peck'; b.t = 2.2; } else b.p.addScaledVector(d, Math.min(1, 5 * dt / L)); }
          } else if (b.state === 'peck') {
            if (b.t <= 0) { b.t = 2.2; if (b.tgt.lost < 5) { b.tgt.lost++; this.updBunches(); } }
            if (b.tgt.bagged) b.state = 'flee';
          } else { b.p.y += 6 * dt; b.p.x += Math.cos(i * 1.7) * 6 * dt; b.p.z += Math.sin(i * 1.7) * 6 * dt; if (b.p.y > b.home.y + 14) { b.state = 'away'; b.t = 4 + Math.random() * 5; } }
          // the light comes near: they lift away, unharmed
          if (b.state !== 'flee' && Math.hypot(b.p.x - w.pos.x, b.p.z - w.pos.z) < 3.4) { b.state = 'flee'; SND.chirp(env.bus, { gain: 0.035, n: 4 }); }
        }
        const vis = b.state !== 'away', flap = b.state === 'peck' ? 0.15 * Math.sin(w.time * 4 + i) : Math.sin(w.time * 22 + i) * 0.9;
        const yaw = b.state === 'fly' && b.tgt ? Math.atan2(b.tgt.top.x - b.p.x, b.tgt.top.z - b.p.z) : i;
        s.setScalar(vis ? 1.5 : 0);
        e.set(0, yaw + Math.PI / 2, 0); q.setFromEuler(e); m4.compose(b.p, q, s); body.setMatrixAt(i, m4);
        e.set(flap, yaw, 0, 'YXZ'); q.setFromEuler(e); m4.compose(b.p, q, s); wl.setMatrixAt(i, m4);
        e.set(-flap, yaw + Math.PI, 0, 'YXZ'); q.setFromEuler(e); m4.compose(b.p, q, s); wr.setMatrixAt(i, m4);
      });
      [body, wl, wr].forEach(m => { m.count = 6; m.instanceMatrix.needsUpdate = true; });
    },
    onLeave() { if (this.hud) { this.hud = null; } },
  }));
})();
