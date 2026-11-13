/* Madinah — Wadi al-'Aqiq, the Blessed Valley. "Be the wind" (after Flower by thatgamecompany).
   You are a breeze carrying petals down the valley: glide low over the gravel and grass, brush the
   closed flowers open, and the trail of petals you carry grows. Part 1 wakes the spring of the upper
   valley; in Part 2 you bloom the flower chains along the channels of the gardens in one sweep, and
   the gardens and wells come alive; in Part 3, at dusk at Dhul-Hulayfah, you carry your petals to the
   lamps by the great acacia, and all the valley's petals rise round it. No person is shown. */
(function () {
  'use strict';
  if (!window.WORLD) return;
  const T = THREE;
  const cx = z => 34 * Math.sin(z / 150) + 10 * Math.sin(z / 47 + 1.2);   // the valley's centre line
  const chan = z => cx(z) + 5 * Math.sin(z / 31);                         // the stream bed
  const TREE = { x: 0, z: -290 };
  const SPRING = { z: 330 };

  function height(x, z) {
    const c = cx(z), d = Math.abs(x - c);
    let y = U.lerp(-2, 22, U.smooth(-380, 380, z));                       // the valley falls toward Madinah
    const wall = Math.max(0, d - 48);
    let banks = Math.pow(wall, 1.28) * 0.55 * (0.7 + 0.6 * (SCAPE.fbm(x * 0.008, z * 0.008, 3) * 0.5 + 0.5));
    banks += SCAPE.ridge(x * 0.014, z * 0.014, 4) * 26 * U.smooth(50, 110, d);
    if (banks > 75) banks = 75 + (banks - 75) * 0.3;
    // the plain of Dhul-Hulayfah opens wide at the lower end
    banks *= 1 - U.smooth(-150, -260, z) * 0.85;
    y += banks;
    // the stream bed
    const dc = Math.abs(x - chan(z));
    y -= 1.4 * (1 - U.smooth(1.5, 5.5, dc));
    y += SCAPE.fbm(x * 0.05, z * 0.05, 3) * 0.9 * U.smooth(3, 10, dc) + SCAPE.fbm(x * 0.2, z * 0.2, 2) * 0.12;
    // far hills all round
    const far = Math.hypot(x, z * 0.7);
    y += Math.max(0, far - 520) * 0.25 * (0.6 + 0.6 * SCAPE.ridge(x * 0.004, z * 0.004, 3));
    return y;
  }

  const WATER_V = 'varying vec3 vW; varying float vD; void main(){ vec4 wp = modelMatrix*vec4(position,1.); vW = wp.xyz; vec4 mv = viewMatrix*wp; vD = -mv.z; gl_Position = projectionMatrix*mv; }';
  const WATER_F = `uniform float uTime; uniform vec3 uSun; uniform vec3 uTop; uniform vec3 uHor; uniform vec3 uFog; uniform float uFogD; uniform float uFlowZ; uniform vec3 uDeep;
    varying vec3 vW; varying float vD;
    void main(){
      float front = smoothstep(uFlowZ - 6., uFlowZ + 2., vW.z);
      if (front < 0.01) discard;
      vec2 p = vW.xz; vec2 g = vec2(0.);
      g += vec2(0.25, 1.0) * cos(dot(p, vec2(0.25, 1.0)) * 1.9 + uTime * 2.6) * 0.07;
      g += vec2(-0.6, 0.8) * cos(dot(p, vec2(-0.6, 0.8)) * 3.3 + uTime * 3.4) * 0.045;
      g += vec2(0.9, 0.45) * cos(dot(p, vec2(0.9, 0.45)) * 5.7 + uTime * 4.6) * 0.03;
      g += vec2(0.1, 1.0) * cos(dot(p, vec2(0.1, 1.0)) * 9.1 + uTime * 6.3) * 0.02;
      vec3 n = normalize(vec3(-g.x, 1., -g.y)), v = normalize(cameraPosition - vW), rf = reflect(-v, n);
      float fres = 0.04 + 0.96 * pow(1. - max(dot(n, v), 0.), 5.);
      vec3 sky = mix(uHor, uTop, clamp(rf.y * 1.6, 0., 1.));
      float s = max(dot(rf, normalize(uSun)), 0.);
      vec3 col = mix(uDeep, sky, fres) + vec3(1., .9, .7) * (pow(s, 300.) * 3. + pow(s, 30.) * 0.2);
      float f = 1. - exp(-pow(uFogD * vD, 2.));
      gl_FragColor = vec4(mix(col, uFog, f), 0.92 * front);
    }`;

  // a soft petal on a canvas: white, so instance colours tint it
  function petalTex(w) {
    return w.tex(128, (g, s) => {
      g.clearRect(0, 0, s, s);
      const gr = g.createLinearGradient(0, s, 0, 0); gr.addColorStop(0, 'rgba(255,255,255,0.95)'); gr.addColorStop(0.7, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(240,240,240,1)');
      g.fillStyle = gr; g.beginPath(); g.moveTo(s / 2, s); g.bezierCurveTo(s * 0.05, s * 0.7, s * 0.12, s * 0.06, s / 2, 0); g.bezierCurveTo(s * 0.88, s * 0.06, s * 0.95, s * 0.7, s / 2, s); g.fill();
      g.strokeStyle = 'rgba(180,170,170,0.35)'; g.lineWidth = 1.2; for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(s / 2, s); g.quadraticCurveTo(s / 2 + i * 8, s * 0.5, s / 2 + i * 12, s * 0.12); g.stroke(); }
    });
  }
  const PALETTE = ['#f4d23c', '#f6f2e8', '#c88ae8', '#ee6a5a', '#f6a4c0', '#f2a03a'];

  ENGINE.register(WORLD.stage({
    key: 'aqiq',
    arabic: 'وَادِي الْعَقِيق',
    title: 'The Blessed Valley',
    era: 'Wadi al-‘Aqiq · after the winter rain · be the wind',
    hint: 'Steer the wind with the mouse or A/D and W/S · hold Space or the mouse button to gust · brush low over the closed flowers',
    hintTouch: 'Drag to steer the wind · hold GUST to rush · brush low over the closed flowers',
    sound: { reverb: 0.55 },
    story: `<p>Wadi al-‘Aqiq is a seasonal valley on the western side of Madinah, dry for most of the year and running like a river after winter rain. At Dhul-Hulayfah in the bottom of the valley, the miqat of the people of Madinah, he rested on his way to Makkah, and was told in a dream: <i>You are in a blessed valley</i> (Sahih al-Bukhari 2336, 1524).</p>
            <p class="q">“Tonight one came to me from my Lord and said: Pray in this blessed valley.” (Sahih al-Bukhari 1534, from ‘Umar)</p>`,

    enter(env) {
      const self = this;
      const w = this.w = WORLD.create(env, { start: { x: chan(SPRING.z - 20), z: SPRING.z - 20, yaw: 0, pitch: 0 }, exposure: 0.85, far: 2600, fov: 70, fog: { color: 0xd8c0a0, density: 0.0011 } });
      const S = w.scene;

      /* ---------- land, sky, light ---------- */
      const ter = SCAPE.terrain(w, { size: 1500, seg: 360, cx: 0, cz: 0, height, rock: [0.7, 0.9], rockHeight: [30, 60], colors: { low: '#c8ae88', high: '#b49a78', rock: '#6a5e58', dark: '#3e3836' }, photo: { ground: 'gravelly_sand', rock: 'dark_rock', normal: 1.2 }, rep: 0.2, rockRep: 0.05 });
      const ground = w.ground = ter.ground; this.ground = ground;
      w.sky({ top: '#5f8fc4', mid: '#f0d2a8', bot: '#d8c0a0', sunDir: [0.5, 0.25, 0.6], sun: '#ffd8a0', sunSize: 0.0016, clouds: 0.35, haze: 0.4 });
      const sun = new T.DirectionalLight(0xffe2b8, 1.8); sun.position.set(50, 25, 60); S.add(sun); this.sun = sun;
      this.hemi = new T.HemisphereLight(0xbdd4f0, 0x9a7a5a, PHOTO.enabled ? 0.08 : 0.7); S.add(this.hemi);
      w.followShadow(sun, 70, 2048);
      this.skyA = null;
      PHOTO.sky(w, 'qwantani_late_afternoon_puresky', { sun, intensity: 0.65, haze: '#e0c8a8', horizon: 0.45, rotation: 2.6, ground: '#b89a78' }).then(o => { this.skyA = o; if (o && o.sunDir) this.sunDir = o.sunDir.clone(); });
      this.sunDir = new T.Vector3(0.5, 0.25, 0.6).normalize();
      SCAPE.horizon(w, { haze: '#e0c8a8', layers: [{ r: 1250, h: 90, color: '#8a6e5e' }, { r: 1700, h: 140, color: '#a88e7e' }, { r: 2200, h: 170, color: '#c4b0a2' }] });

      /* ---------- materials ---------- */
      const granite = SCAPE.tex.granite(w);
      const brick = PHOTO.mat(w, 'clay_block_wall', { rep: [1, 1], fallback: KIT.mudBrick(w, [1, 1]), color: 0xe0ccb0 });
      const plaster = PHOTO.mat(w, 'brown_mud_dry', { rep: [1, 1], fallback: SCAPE.tex.mud(w), color: 0xe8d8c0 });
      const stoneM = PHOTO.mat(w, 'old_stone_wall', { rep: [1, 1], fallback: granite, color: 0xc8b8a8 });
      const beamM = PHOTO.mat(w, 'medieval_wood', { rep: [0.4, 1], fallback: KIT.wood(w), color: 0xa08868 });
      const linen = PHOTO.mat(w, 'rough_linen', { rep: [2, 2], fallback: KIT.plaster(w, [2, 2], '#e8dcc8'), color: 0xe8dcc6, side: T.DoubleSide });

      /* ---------- water: the stream that wakes ---------- */
      {
        const pts = []; for (let z = 360; z >= -380; z -= 4) pts.push([chan(z), z]);
        const n = pts.length, P = new Float32Array(n * 2 * 3), idx = [];
        pts.forEach(([x, z], i) => { const y = ground(x, z) + 0.55; P.set([x - 3.6, y, z, x + 3.6, y, z], i * 6); if (i < n - 1) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); } });
        // follow the bed's own height so the surface never floats
        for (let i = 0; i < n; i++) { const [x, z] = pts[i]; const b = Math.min(ground(x - 3.6, z), ground(x, z), ground(x + 3.6, z)); P[i * 6 + 1] = P[i * 6 + 4] = Math.max(ground(x, z) + 0.45, b + 0.25); }
        const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.BufferAttribute(P, 3)); geo.setIndex(idx); geo.computeVertexNormals();
        this.waterU = { uTime: { value: 0 }, uSun: { value: this.sunDir }, uTop: { value: new T.Color('#5a86c0') }, uHor: { value: new T.Color('#f0d6b0') }, uFog: { value: new T.Color(0xd8c0a0) }, uFogD: { value: 0.0011 }, uFlowZ: { value: 400 }, uDeep: { value: new T.Color('#1a2a2a') } };
        const water = new T.Mesh(geo, new T.ShaderMaterial({ vertexShader: WATER_V, fragmentShader: WATER_F, uniforms: this.waterU, transparent: true, depthWrite: false }));
        water.userData.dynamic = true; water.renderOrder = 1; S.add(water); this.water = water;
        this.flowZ = 400; this.flowTarget = 400;
      }

      /* ---------- the land's texture: basalt boulders above, gardens in the middle, the plain below ---------- */
      const inBed = (x, z) => Math.abs(x - chan(z)) < 6;
      SCAPE.scatter(w, { kind: 'model', model: 'namaqualand_boulder_02', fallback: 'boulder', n: 200, area: [-260, -160, 260, 380], scale: [1, 3.5], seed: 11, color: '#6a6260', density: (x, z) => U.smooth(30, 70, Math.abs(x - cx(z))) * U.smooth(-140, 60, z), collide: false });
      SCAPE.scatter(w, { kind: 'model', model: 'namaqualand_boulder_04', fallback: 'boulder', n: 120, area: [-200, 100, 200, 380], scale: [0.8, 2.2], seed: 12, color: '#6a6260', avoid: inBed });
      SCAPE.scatter(w, { kind: 'boulder', n: 300, area: [-600, -500, 600, 500], scale: [3, 10], seed: 13, tex: 'lava', density: (x, z) => U.smooth(60, 140, Math.abs(x - cx(z))) });
      SCAPE.scatter(w, { kind: 'model', model: 'namaqualand_rocks_01', n: 380, area: [-120, -380, 120, 380], scale: [0.8, 2], seed: 14, avoid: inBed, density: (x, z) => Math.abs(x - cx(z)) < 70 ? 1 : 0.2 });
      SCAPE.scatter(w, { kind: 'model', model: 'namaqualand_stones_01', n: 520, area: [-80, -380, 80, 380], scale: [1, 2.2], seed: 15, density: (x, z) => Math.abs(x - chan(z)) < 14 ? 1 : 0.25 });
      SCAPE.scatter(w, { kind: 'pebble', n: 2600, area: [-90, -380, 90, 380], scale: [0.06, 0.22], seed: 16, density: (x, z) => Math.abs(x - cx(z)) < 60 ? 1 : 0.1 });
      SCAPE.scatter(w, { kind: 'model', model: 'shrub_03', fallback: 'shrub', n: 200, area: [-140, -380, 140, 380], scale: [0.8, 1.8], seed: 17, avoid: inBed });
      SCAPE.scatter(w, { kind: 'model', model: 'wild_rooibos_bush', fallback: 'shrub', n: 160, area: [-100, -380, 100, 380], scale: [0.8, 1.6], seed: 18, avoid: inBed });
      SCAPE.scatter(w, { kind: 'acacia', n: 70, area: [-160, -380, 160, 380], scale: [0.9, 1.5], seed: 19, avoid: (x, z) => inBed(x, z) || Math.hypot(x - TREE.x, z - TREE.z) < 18 });
      SCAPE.scatter(w, { kind: 'thorn', n: 200, area: [-200, -380, 200, 380], scale: [0.7, 1.5], seed: 20, avoid: inBed });
      // grass in three zones; each greens when its part of the valley wakes
      const grassZone = (z0, z1, seed) => {
        const a = SCAPE.scatter(w, { kind: 'grass', n: 1400, area: [-90, z0, 90, z1], scale: [0.5, 1.1], seed, color: '#e0cc98', density: (x, z) => (Math.abs(x - cx(z)) < 55 && !inBed(x, z) ? 1 : 0.12) * (SCAPE.fbm(x * 0.03, z * 0.03, 2) > -0.15 ? 1 : 0.3) });
        const b = SCAPE.scatter(w, { kind: 'model', model: 'grass_medium_01', fallback: 'grass', n: 300, area: [-70, z0, 70, z1], scale: [0.8, 1.5], seed: seed + 1, avoid: inBed });
        const mats = () => [...a.meshes, ...b.meshes].map(m => m.material);
        return { a, b, mats, k: 0 };
      };
      this.grass = [grassZone(110, 380, 31), grassZone(-130, 110, 33), grassZone(-380, -130, 35)];
      // the bend: grass parts as the wind passes
      this.headU = { value: new T.Vector3(0, -100, 0) };
      const bend = mat => {
        if (mat._bend) return; mat._bend = true;
        const prev = mat.onBeforeCompile;
        mat.onBeforeCompile = (sh, r) => {
          prev && prev(sh, r);
          sh.uniforms.uHead = this.headU;
          sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform vec3 uHead;').replace('#include <begin_vertex>', `#include <begin_vertex>
            { vec3 ip = vec3(0.); mat3 im = mat3(1.);
              #ifdef USE_INSTANCING
                ip = instanceMatrix[3].xyz; im = mat3(instanceMatrix);
              #endif
              vec2 dv = ip.xz - uHead.xz; float d = length(dv) + 1e-3;
              float k = (1. - smoothstep(0.6, 4.2, d)) * (1. - smoothstep(1.5, 7., uHead.y - ip.y));
              vec3 ld = vec3(dv.x / d, 0., dv.y / d) * im; ld.y = 0.; ld = normalize(ld + 1e-4);
              float hh = max(position.y, 0.);
              transformed.xz += ld.xz * k * hh * 0.9; transformed.y -= k * hh * 0.35; }`);
        };
        const key = mat.customProgramCacheKey ? mat.customProgramCacheKey() : '';
        mat.customProgramCacheKey = () => key + 'aqiqbend';
        mat.needsUpdate = true;
      };
      this.bend = bend;
      this.grass.forEach(g => g.mats().forEach(bend));
      this.grassReady = Promise.all(this.grass.map(g => g.b.ready).filter(Boolean)).then(() => this.grass.forEach(g => g.mats().forEach(m => { bend(m); m.userData.c0 = m.color.clone(); })));
      this.grass.forEach(g => g.mats().forEach(m => { m.userData.c0 = m.color.clone(); }));

      /* ---------- the gardens: palms, mud-brick walls, wells, channels ---------- */
      const palms = (x, z, r, n, seed) => SCAPE.scatter(w, { kind: 'palm', n, area: { x, z, r }, scale: [7, 12], seed, avoid: inBed });
      this.gardens = [[cx(60) + 40, 60], [cx(-10) - 40, -10], [cx(-70) + 38, -70], [cx(20) - 46, 20]].map(([x, z], i) => {
        palms(x, z, 24, 26, 50 + i);
        // walls round the garden, with a gap toward the stream
        const R = 26, segsN = 14, gy = ground(x, z);
        for (let k = 0; k < segsN; k++) {
          const a0 = (k / segsN) * 6.283, a1 = ((k + 1) / segsN) * 6.283; if (k === (i % 2 ? 0 : 7)) continue;
          const x0 = x + Math.cos(a0) * R, z0 = z + Math.sin(a0) * R, x1 = x + Math.cos(a1) * R, z1 = z + Math.sin(a1) * R;
          const L = Math.hypot(x1 - x0, z1 - z0), mx = (x0 + x1) / 2, mz = (z0 + z1) / 2, h = 1.9 + (k % 3) * 0.2;
          const m = new T.Mesh(new T.BoxGeometry(L + 0.3, h, 0.6), k % 2 ? brick : plaster); m.position.set(mx, ground(mx, mz) + h / 2 - 0.25, mz); m.rotation.y = -Math.atan2(z1 - z0, x1 - x0); S.add(m);
        }
        // a well: a stone ring, a timber frame, and water that rises when the garden wakes
        const wx = x + (i % 2 ? -8 : 8), wz = z + 6, wy = ground(wx, wz);
        const ring = new T.Mesh(new T.CylinderGeometry(1.3, 1.4, 0.9, 20, 1, true), stoneM); ring.position.set(wx, wy + 0.45, wz); S.add(ring);
        const lip = new T.Mesh(new T.TorusGeometry(1.32, 0.16, 8, 24), stoneM); lip.rotation.x = Math.PI / 2; lip.position.set(wx, wy + 0.92, wz); S.add(lip);
        [-1, 1].forEach(sd => { const p = new T.Mesh(new T.CylinderGeometry(0.08, 0.1, 2.4, 6), beamM); p.position.set(wx + sd * 1.25, wy + 1.2, wz); S.add(p); });
        const bar = new T.Mesh(new T.CylinderGeometry(0.07, 0.07, 2.8, 6), beamM); bar.rotation.z = Math.PI / 2; bar.position.set(wx, wy + 2.35, wz); S.add(bar);
        const wellW = new T.Mesh(new T.CircleGeometry(1.2, 20), new T.MeshStandardMaterial({ color: 0x0a1418, roughness: 0.05 })); wellW.rotation.x = -Math.PI / 2; wellW.position.set(wx, wy - 0.6, wz); wellW.userData.dynamic = true; S.add(wellW);
        PHOTO.place(w, U.pick(['jug_01', 'ceramic_vase_01']), { pos: [wx + 1.9, wy, wz + 0.6], s: 1.2 });
        PHOTO.place(w, 'wicker_basket_01', { pos: [wx - 1.8, wy, wz - 0.4], s: 1.1 });
        return { x, z, wellW, wy, k: 0 };
      });
      palms(cx(150) - 20, 150, 30, 18, 60); palms(cx(-200) + 30, -200, 40, 30, 61); palms(cx(-110) - 30, -110, 30, 22, 62);

      /* ---------- Dhul-Hulayfah: the great acacia, tents, lamps ---------- */
      {
        const gy = ground(TREE.x, TREE.z);
        const bark = PHOTO.mat(w, 'palm_tree_bark', { rep: [1, 2], fallback: KIT.bark(w), color: 0x7a6656 });
        const trunk = new T.Mesh(new T.CylinderGeometry(0.55, 0.9, 5, 9), bark); trunk.position.set(TREE.x, gy + 2.4, TREE.z); S.add(trunk);
        this.treeLimbs = [];
        for (let i = 0; i < 5; i++) { const a = i * 1.26, g = new T.CylinderGeometry(0.18, 0.4, 6, 7); g.translate(0, 3, 0); const m = new T.Mesh(g, bark); m.position.set(TREE.x, gy + 4.4, TREE.z); m.rotation.set(Math.cos(a) * 0.9, 0, Math.sin(a) * 0.9); S.add(m); }
        const leafT = SCAPE.tex.leaves(w);
        const canopyM = new T.MeshStandardMaterial({ map: leafT, alphaTest: 0.45, side: T.DoubleSide, roughness: 0.85, color: 0xc8d0a0 });
        for (let i = 0; i < 9; i++) { const a = i * 0.7, r = i < 3 ? 2 : 6, d = new T.Mesh(new T.CircleGeometry(5 - (i % 3), 16), canopyM); d.rotation.x = -Math.PI / 2; d.position.set(TREE.x + Math.cos(a) * r, gy + 8.4 + (i % 3) * 0.5, TREE.z + Math.sin(a) * r); S.add(d); }
        w.addCircle(TREE.x, TREE.z, 1);
        const tent = (x, z, ry) => {
          const y = ground(x, z), g = new T.Group(); g.position.set(x, y, z); g.rotation.y = ry;
          const geo = new T.CylinderGeometry(0.01, 3.2, 2.3, 4, 1, true); geo.rotateY(Math.PI / 4); geo.scale(1.4, 1, 0.9); geo.translate(0, 1.15, 0);
          g.add(new T.Mesh(geo, linen));
          for (const sx of [-2.4, 2.4]) { const p = new T.Mesh(new T.CylinderGeometry(0.05, 0.05, 2.5, 5), beamM); p.position.set(sx, 1.15, 0); g.add(p); }
          S.add(g);
        };
        const tr = U.seeded(4);
        for (let i = 0; i < 12; i++) { const a = 0.6 + tr() * 2.2, d = 30 + tr() * 30; tent(TREE.x + Math.cos(a) * d, TREE.z + Math.sin(a) * d * 0.8, tr() * 3); }
        PHOTO.place(w, 'stone_fire_pit', { pos: [TREE.x + 16, undefined, TREE.z + 10], s: 1.2 });
        // the lamps to carry light to: in the tree and by the tents
        this.lamps = [];
        const lampAt = [[TREE.x + 3.5, gy + 6.2, TREE.z + 1], [TREE.x - 3.2, gy + 6.6, TREE.z - 2.4], [TREE.x + 0.5, gy + 7.2, TREE.z + 4.2]];
        for (let i = 0; i < 3; i++) { const a = 0.9 + i * 0.7, d = 34; lampAt.push([TREE.x + Math.cos(a) * d, ground(TREE.x + Math.cos(a) * d, TREE.z + Math.sin(a) * d * 0.8) + 2.6, TREE.z + Math.sin(a) * d * 0.8]); }
        lampAt.forEach(([x, y, z], i) => {
          if (i >= 3) { const p = new T.Mesh(new T.CylinderGeometry(0.06, 0.08, 2.6, 6), beamM); p.position.set(x, y - 1.3, z); S.add(p); }
          PHOTO.place(w, 'brass_diya_lantern', { pos: [x, y, z], s: 2.6 });
          const g = KIT.glow(w, 0xffc070, 1.6, 0.06); g.position.set(x, y + 0.3, z); S.add(g);
          this.lamps.push({ x, y, z, g, lit: false, k: 0 });
        });
        this.lampLights = [0, 1].map(() => { const L = new T.PointLight(0xffb060, 0, 22, 1.8); S.add(L); return L; });
      }

      /* ---------- flowers: closed buds to brush open, and the open ones that colour the valley ---------- */
      const ptex = petalTex(w);
      this.petalMat = new T.MeshStandardMaterial({ map: ptex, alphaTest: 0.3, side: T.DoubleSide, roughness: 0.7, emissive: 0x222222, transparent: false });
      const petalGeo = new T.PlaneGeometry(0.16, 0.3); petalGeo.translate(0, 0.15, 0);
      this.flowers = [];
      const r = U.seeded(77);
      const addF = (x, z, kind, group) => { const y = ground(x, z); this.flowers.push({ x, y, z, kind, group, k: kind === 'deco' ? 1 : 0, open: kind === 'deco', t: 0, col: new T.Color(PALETTE[(r() * PALETTE.length) | 0]), s: kind === 'deco' ? 0.6 + r() * 0.4 : 1.6, ry: r() * 6.28, chainI: -1 }); return this.flowers.length - 1; };
      // Part 1: three clusters in the upper valley
      this.clusters = [[cx(300) + 10, 300], [cx(240) - 14, 240], [cx(175) + 8, 175]].map(([x, z], ci) => {
        const ids = []; for (let i = 0; i < 8; i++) { const a = r() * 6.283, d = 2 + r() * 7; ids.push(addF(x + Math.cos(a) * d, z + Math.sin(a) * d, 'bud', ci)); } return { x, z, ids };
      });
      // Part 2: chains along the channels of the gardens
      this.chains = this.gardens.map((G, gi) => {
        const ids = []; const z0 = G.z + 30, dir = -1;
        for (let i = 0; i < 8; i++) { const z = z0 + dir * i * 7, x = U.lerp(chan(z), G.x, 0.35) + Math.sin(i * 0.9) * 3; const id = addF(x, z, 'chain', gi); this.flowers[id].chainI = i; this.flowers[id].col.set(gi % 2 ? '#f6f2e8' : '#f4d23c'); ids.push(id); }
        return { ids, n: 0, t: 0, done: false, G };
      });
      // Part 3: a field on the plain to gather petals
      for (let i = 0; i < 18; i++) { const a = r() * 6.283, d = 10 + r() * 50; addF(TREE.x + Math.cos(a) * d, TREE.z + 70 + Math.sin(a) * d * 0.6, 'bud', 9); }
      // decorative open flowers everywhere along the bed
      for (let i = 0; i < 420; i++) { const z = U.lerp(-370, 370, r()), x = cx(z) + (r() - 0.5) * 100; if (inBed(x, z)) continue; addF(x, z, 'deco', -1); }
      const NF = this.flowers.length;
      this.petals = new T.InstancedMesh(petalGeo, this.petalMat, NF * 6); this.petals.frustumCulled = false; this.petals.userData.dynamic = true; S.add(this.petals);
      const stemGeo = new T.CylinderGeometry(0.012, 0.018, 1, 4); stemGeo.translate(0, 0.5, 0);
      this.stems = new T.InstancedMesh(stemGeo, new T.MeshStandardMaterial({ color: 0x6a7a3a, roughness: 0.8 }), NF); this.stems.frustumCulled = false; this.stems.userData.dynamic = true; S.add(this.stems);
      const ctrGeo = new T.SphereGeometry(0.05, 8, 6);
      this.ctrs = new T.InstancedMesh(ctrGeo, new T.MeshStandardMaterial({ color: 0xe8a830, roughness: 0.6, emissive: 0x3a2000 }), NF); this.ctrs.frustumCulled = false; this.ctrs.userData.dynamic = true; S.add(this.ctrs);
      this._m4 = new T.Matrix4(); this._q = new T.Quaternion(); this._e = new T.Euler(0, 0, 0, 'YXZ'); this._p = new T.Vector3(); this._s = new T.Vector3();
      this.flowers.forEach((f, i) => { this.drawFlower(i); this._m4.compose(this._p.set(f.x, f.y, f.z), this._q.identity(), this._s.set(1, f.s * 0.45, 1)); this.stems.setMatrixAt(i, this._m4); });
      this.stems.instanceMatrix.needsUpdate = true;
      // buds glimmer so they can be found from the air
      this.budGlow = new T.Points(new T.BufferGeometry(), new T.PointsMaterial({ map: KIT.glowTex(w), color: 0xfff0c0, size: 1.4, transparent: true, opacity: 0.8, depthWrite: false, blending: T.AdditiveBlending }));
      this.budGlow.geometry.setAttribute('position', new T.BufferAttribute(new Float32Array(NF * 3), 3)); this.budGlow.frustumCulled = false; S.add(this.budGlow);

      /* ---------- the wind: a trail of petals ---------- */
      this.MAXP = 180;
      this.trail = new T.InstancedMesh(petalGeo, this.petalMat, this.MAXP); this.trail.frustumCulled = false; this.trail.userData.dynamic = true; S.add(this.trail);
      this.trailCols = []; for (let i = 0; i < this.MAXP; i++) { this.trailCols.push(new T.Color(PALETTE[i % PALETTE.length])); this.trail.setColorAt(i, this.trailCols[i]); }
      this.carry = 6; this.hist = []; this.histT = 0;
      this.pollen = KIT.dust(w, 120, [0, 0, 0, 1, 1, 1], 0xfff0b0, 0.12); this.pollen.material.opacity = 0; S.add(this.pollen); this.pollenV = new Float32Array(360); this.pollenT = 0;
      this.streak = KIT.dust(w, 220, [-30, 0, -30, 30, 14, 30], 0xfff6e0, 0.05); this.streak.material.opacity = 0.0; S.add(this.streak);
      SCAPE.birds(w, { n: 14, x: cx(0), z: 0, y: 55, r: 90 });
      SCAPE.motes(w, { n: 80, area: [-60, 0, -380, 60, 6, 380], color: '#fff2c8', size: 0.22, opacity: 0.5 });
      SCAPE.smoke(w, { sources: [[TREE.x + 16, ground(TREE.x + 16, TREE.z + 10) + 1, TREE.z + 10]], color: '#d8d0c8', height: 14, size: 3, opacity: 0.18 });

      /* ---------- discoveries: fly through the motes ---------- */
      this.discs = [];
      const disc = (x, z, dy, title, text, ar) => { const p = [x, ground(x, z) + dy, z]; const it = w.discover({ pos: p, title, text, ar, r: 0.01, size: 2.4 }); this.discs.push({ it, pos: new T.Vector3(...p) }); };
      disc(cx(280) - 30, 280, 6, 'A Seasonal Valley', 'Wadi al-‘Aqiq runs northward along the western side of Madinah. Dry most of the year, it can flood in winter, and it meets the city’s other great valleys, Buthan and Qanat, to the north-west.', 'وَادِي الْعَقِيق');
      disc(cx(40), 40, 4, 'Where He Rested', '‘Abd Allah ibn ‘Umar used to make his camel kneel at the place in the valley where the Prophet ﷺ used to rest, seeking it out. (Sahih al-Bukhari 1535)', 'يُنِيخُ بِهَا');
      disc(cx(-150) + 26, -150, 5, 'Dhul-Hulayfah', 'The Prophet ﷺ fixed Dhul-Hulayfah as the miqat of the people of Madinah: the place where pilgrims enter ihram before Makkah. (Sahih al-Bukhari 1524)', 'ذُو الْحُلَيْفَة');
      disc(TREE.x - 20, TREE.z - 10, 5, 'A Blessed Valley', 'While he passed the night at his resting place at Dhul-Hulayfah, in the bottom of the valley, he saw a dream, and it was said to him: “You are in a blessed valley.” (Sahih al-Bukhari 2336)', 'إِنَّكَ بِبَطْحَاءَ مُبَارَكَةٍ');
      disc(cx(-330), -340, 7, 'Toward the City', 'Below Dhul-Hulayfah the valley runs on north past the western side of Madinah, where it joins the city’s other wadis.', 'إِلَى الْمَدِينَة');

      w.receiveAll();
      [this.water, this.petals, this.trail, this.stems, this.ctrs].forEach(m => { m.castShadow = false; });
      S.traverse(m => { if (m.isMesh && !m.isInstancedMesh && !Array.isArray(m.material) && m.geometry.groups.length > 1) m.geometry.clearGroups(); });
      this.baked = w.bake();
      this.post = w.post({ bloom: 0.5, threshold: 0.78, rays: { strength: 0.3, dir: this.sunDir.toArray(), density: 0.85 }, vignette: 0.38, grain: 0.025, sat: 1.08, contrast: 1.04, lift: [0.015, 0.01, 0.0], gain: [1.03, 1.0, 0.95] });

      /* ---------- controls ---------- */
      this.touch = matchMedia('(pointer: coarse)').matches;
      if (this.touch) {
        const b = document.createElement('button'); b.type = 'button'; b.className = 'aqiq-gust'; b.textContent = 'GUST';
        Object.assign(b.style, { position: 'absolute', right: '22px', bottom: 'calc(22px + env(safe-area-inset-bottom, 0px))', width: '84px', height: '84px', borderRadius: '50%', border: '1.5px solid rgba(246,220,154,.7)', background: 'rgba(40,30,20,.35)', color: '#f6dc9a', font: '600 12px/1 sans-serif', letterSpacing: '.12em', pointerEvents: 'auto', zIndex: 5 });
        b.addEventListener('pointerdown', e => { e.stopPropagation(); e.preventDefault(); self.gustHeld = true; });
        b.addEventListener('pointerup', e => { e.stopPropagation(); self.gustHeld = false; });
        b.addEventListener('pointercancel', () => { self.gustHeld = false; });
        w.ui.layer.appendChild(b);
      }
      w.onPointer = (e, p, phase) => { if (e.pointerType === 'mouse' || !e.pointerType) self.mouseHeld = phase === 'down'; return false; };

      /* ---------- state ---------- */
      this.head = new T.Vector3(chan(SPRING.z - 12), ground(chan(SPRING.z - 12), SPRING.z - 12) + 2.2, SPRING.z - 12);
      this.vel = new T.Vector3(); this.speed = 6; this.part = 0; this.phaseT = 0; this.bloomed = 0; this.chainCount = 0; this.lit = 0; this.final = 0; this.lastBloom = -9; this.combo = 0;
      w.activity('Part 1 of 3 · The upper valley', 3, 'Brush low over the closed flowers to open them');
      w.mode = (dt) => this.fly(env, dt);
      this.placeCam(1);

      /* ---------- sound ---------- */
      const bus = env.bus;
      this.wind = SND.noise(bus, { color: 'pink', type: 'bandpass', freq: 500, q: 0.7, gain: 0.05 });
      this.rush = SND.noise(bus, { color: 'white', type: 'highpass', freq: 2000, q: 0.5, gain: 0 });
      this.stream = SND.noise(bus, { color: 'white', type: 'bandpass', freq: 2400, q: 0.6, gain: 0 });
      this.birdClock = 2; this.dropClock = 1;
    },

    /* ---------------- the film ---------------- */
    film(env, w) {
      const self = this, G = this.ground;
      const at = (x, dy, z) => [x, G(x, z) + dy, z];
      const sp = { x: chan(SPRING.z - 8), z: SPRING.z - 8 };
      return [
        { dur: 7, fade: 'dip', title: true, ease: 'glide', fov: [46, 40], path: [[at(cx(-420) + 40, 90, -420), at(cx(-100), 10, -100)], [at(cx(-300) + 20, 70, -300), at(cx(100), 15, 100)]],
          start: () => { SND.glow(env.bus, 146.83, { gain: 0.04, dur: 9 }); } },
        { dur: 6, fade: 'dip', line: 'Wadi al-‘Aqiq, west of Madinah. For most of the year its bed lies dry.', ar: 'وادي العقيق غربَ المدينة. يجفُّ مجراه أكثرَ العام.', ease: 'inout', fov: [52, 46],
          path: [[at(chan(150) + 3, 1.2, 150), at(chan(120), 0.4, 120)], [at(chan(138) + 2, 0.8, 138), at(chan(110), 0.5, 110)]] },
        { dur: 6, fade: 'cut', line: 'After the winter rain, it runs like a river.', ar: 'وبعد مطر الشتاء يجري كالنهر.', ease: 'glide', fov: [44, 38],
          path: [[at(chan(360) + 14, 6, 372), at(chan(330), 0.3, 330)], [at(chan(345) + 8, 3, 352), at(chan(320), 0.3, 318)]],
          start: () => { self.waterU.uFlowZ.value = 300; self.stream.set('gain', 0.03, 1); }, during: (w, k) => { self.waterU.uFlowZ.value = 330 - k * 20; } },
        { dur: 7, fade: 'dip', line: 'At Dhul-Hulayfah he was told in a dream: “You are in a blessed valley.”', ar: 'إِنَّكَ بِبَطْحَاءَ مُبَارَكَةٍ', ease: 'inout', fov: [40, 48],
          path: [[at(TREE.x + 40, 4, TREE.z + 30), [TREE.x, G(TREE.x, TREE.z) + 6, TREE.z]], [at(TREE.x + 18, 9, TREE.z - 16), [TREE.x, G(TREE.x, TREE.z) + 7, TREE.z]]],
          start: () => { self.waterU.uFlowZ.value = 400; self.stream.set('gain', 0, 1); SND.glow(env.bus, 110, { gain: 0.05, dur: 8, vowel: 'o' }); } },
        { dur: 6, fade: 'dip', line: 'A breeze stirs in the upper valley.', ar: 'تهبُّ نسمةٌ في أعلى الوادي.', ease: 'glide', fov: [50, 60],
          path: [[at(sp.x + 6, 1.4, sp.z + 8), at(sp.x, 0.6, sp.z)], [at(sp.x + 2, 3.2, sp.z + 2), at(sp.x, 2.5, sp.z - 14)]],
          start: () => { SND.swell(env.bus, { f0: 300, f1: 1400, dur: 5, gain: 0.07 }); self.flyFilm = true; },
          during: (w, k) => { self.head.set(sp.x + Math.sin(k * 3) * 0.6, G(sp.x, sp.z) + 0.8 + k * 1.6, sp.z - k * 6); self.trailOnly(); } },
        { dur: 5.5, fade: 'cut', line: 'You are the wind. Brush the closed flowers open.', ar: 'أنتَ الريح. امرر على الأزهار المغلقة فتتفتح.', ease: 'inout', fov: [60, 70],
          path: [[at(sp.x + 4, 5, sp.z + 4), at(sp.x, 2.2, sp.z - 18)]],
          during: (w, k) => { self.head.set(sp.x, G(sp.x, sp.z - 6) + 2.2, sp.z - 6 - k * 6); self.trailOnly(); } },
      ];
    },
    filmOpts: {
      end(w) {
        const s = ENGINE.cur; if (!s || !s.flowers) return;
        s.flyFilm = false; s.waterU.uFlowZ.value = 400; s.flowZ = 400; s.stream.set('gain', 0, 1);
        s.head.set(chan(SPRING.z - 12), s.ground(chan(SPRING.z - 12), SPRING.z - 12) + 2.2, SPRING.z - 12);
        w.yaw = Math.PI - 0.02 + Math.PI; w.yaw = 0; w.pitch = -0.05; s.hist = []; s.placeCam(1);
      },
    },

    /* ---------------- flowers ---------------- */
    drawFlower(i) {
      const f = this.flowers[i], m4 = this._m4, q = this._q, e = this._e, p = this._p, sc = this._s;
      const k = f.k, open = U.clamp(k), over = k > 1 ? 0 : Math.sin(open * Math.PI) * 0.15;
      const top = f.y + f.s * 0.45;
      for (let j = 0; j < 6; j++) {
        const a = f.ry + j * Math.PI / 3, tilt = U.lerp(0.18, 1.25, open) + over;
        e.set(-tilt, a, 0, 'YXZ'); q.setFromEuler(e);
        const s = f.s * U.lerp(0.55, 1, open);
        m4.compose(p.set(f.x, top, f.z), q, sc.set(s, s, s));
        this.petals.setMatrixAt(i * 6 + j, m4); this.petals.setColorAt(i * 6 + j, f.col);
      }
      m4.compose(p.set(f.x, top + 0.02, f.z), q.identity(), sc.setScalar(f.s * open));
      this.ctrs.setMatrixAt(i, m4);
      this.petals.instanceMatrix.needsUpdate = true; if (this.petals.instanceColor) this.petals.instanceColor.needsUpdate = true; this.ctrs.instanceMatrix.needsUpdate = true;
    },
    bloom(env, i) {
      const f = this.flowers[i], w = this.w; if (f.open) return;
      f.open = true; f.t = 0;
      this.carry = Math.min(this.MAXP, this.carry + 2); this.bloomed++;
      const now = w.time; this.combo = now - this.lastBloom < 2.2 ? this.combo + 1 : 0; this.lastBloom = now;
      const scale = [261.63, 293.66, 329.63, 392, 440, 523.25, 587.33, 659.25];
      SND.sing(env.bus, scale[Math.min(this.combo, 7)], { vowel: this.combo % 2 ? 'o' : 'a', dur: 1.4, gain: 0.04, attack: 0.03 });
      SND.swell(env.bus, { f0: 1200, f1: 3000, dur: 0.5, gain: 0.02, color: 'white' });
      // pollen bursts out
      const a = this.pollen.geometry.attributes.position;
      for (let j = 0; j < a.count; j++) { a.setXYZ(j, f.x, f.y + f.s * 0.45, f.z); const th = Math.random() * 6.283, sp = 0.6 + Math.random() * 2.2; this.pollenV.set([Math.cos(th) * sp, 1 + Math.random() * 2, Math.sin(th) * sp], j * 3); }
      a.needsUpdate = true; this.pollenT = 1.4;
      if (f.kind === 'bud' && f.group < 3) this.checkCluster(env);
      if (f.kind === 'chain') this.chainStep(env, f);
      if (f.group === 9) w.step(this.stepP3());
    },

    /* ---------------- the parts ---------------- */
    checkCluster(env) {
      const w = this.w;
      const done = this.clusters.filter(c => c.ids.filter(i => this.flowers[i].open).length >= 6).length;
      if (done !== this.clDone) {
        this.clDone = done; w.progress(done, done < 3 ? `Clusters woken ${done} / 3 · follow the glimmer down the valley` : '');
        this.grass[0].k = done / 3; this.flowTarget = 400 - done * 30;
        SND.glow(env.bus, [196, 220, 261.63][done - 1] || 196, { gain: 0.05, dur: 6 });
        if (done === 3) this.toPart(env, 1);
      }
    },
    chainStep(env, f) {
      const C = this.chains[f.group]; if (C.done) return;
      C.n = C.ids.filter(i => this.flowers[i].open).length; C.t = 0;
      if (C.n >= C.ids.length) {
        C.done = true; this.chainCount++; C.G.k = 1;
        SND.glow(env.bus, [220, 246.94, 293.66, 329.63][this.chainCount - 1], { gain: 0.07, dur: 8 }); SND.bell(env.bus, 659.25, { gain: 0.05, delay: 0.3 });
        this.w.say('A garden wakes', this.chainCount < 4 ? `The channel runs and the well fills. Gardens woken: ${this.chainCount} of 4.` : 'All four gardens are awake. Follow the water down to Dhul-Hulayfah.', { ms: 4200 });
        this.w.progress(this.chainCount, this.stepP2());
        this.grass[1].k = this.chainCount / 4; this.flowTarget = Math.min(this.flowTarget, 300 - this.chainCount * 120);
        if (this.chainCount === 4) this.toPart(env, 2);
      } else this.w.step(this.stepP2());
    },
    stepP2() { const C = this.chains.find(c => !c.done && c.n > 0); return C ? `Keep the sweep going: ${C.n} / 8 in this chain · gardens ${this.chainCount} / 4` : `Sweep along a line of flowers in one pass · gardens ${this.chainCount} / 4`; },
    stepP3() { return `Carry your petals to the lamps · lamps lit ${this.lit} / 6 · petals ${this.carry}`; },
    toPart(env, n) {
      const w = this.w; this.part = n;
      if (n === 1) {
        w.activity('Part 2 of 3 · The gardens', 4, ''); w.step(this.stepP2());
        w.say('The spring wakes', 'Water runs from the upper valley. Below, the gardens wait: sweep along each line of flowers in one pass, without stopping.', { ms: 6500 });
      } else {
        w.activity('Part 3 of 3 · Dhul-Hulayfah at dusk', 6, ''); w.step(this.stepP3());
        w.say('Dusk at Dhul-Hulayfah', 'The sun goes down over the plain. Carry your petals to the lamps by the great acacia and the tents; a lamp lights when you bring it enough petals.', { ms: 7000 });
        this.dusk = 0;
        const prev = this.skyA;
        PHOTO.sky(w, 'qwantani_sunset_puresky', { sun: this.sun, intensity: 0.55, haze: '#d8a888', horizon: 0.5, rotation: 2.6, ground: '#8a6a58' }).then(o => { if (prev && prev.mesh) prev.mesh.visible = false; if (o && o.sunDir) this.sunDir.copy(o.sunDir); });
      }
    },
    finale(env) {
      const w = this.w; this.final = 0.001;
      SND.glow(env.bus, 146.83, { gain: 0.08, dur: 14, vowel: 'o' }); SND.glow(env.bus, 220, { gain: 0.05, dur: 12, delay: 1.2 });
      setTimeout(() => { if (this.w) w.say('Pray in This Blessed Valley', '‘Umar heard the Prophet ﷺ say at Wadi al-‘Aqiq: <span class="q">“Tonight one came to me from my Lord and said: Pray in this blessed valley.”</span> (Sahih al-Bukhari 1534)', { ar: 'صَلِّ فِي هَذَا الْوَادِي الْمُبَارَكِ', ms: 15000 }); }, 2500);
      setTimeout(() => { if (this.w) w.finish('The blessed valley in bloom'); }, 9000);
    },

    /* ---------------- flight ---------------- */
    placeCam(snap) {
      const w = this.w, c = w.camera, h = this.head;
      const fx = -Math.sin(w.yaw), fz = -Math.cos(w.yaw);
      const want = this._cw || (this._cw = new T.Vector3());
      want.set(h.x - fx * 6.5, h.y + 2.3, h.z - fz * 6.5);
      const gy = this.ground(want.x, want.z) + 0.8; if (want.y < gy) want.y = gy;
      if (snap === 1) c.position.copy(want); else c.position.lerp(want, 1 - Math.exp(-snap * 5));
      c.up.set(0, 1, 0); c.lookAt(h.x + fx * 6, h.y + 0.4 + Math.sin(w.pitch) * 4, h.z + fz * 6);
      c.rotateZ(this.roll || 0);
      w.pos.set(c.position.x, 0, c.position.z); w.y = c.position.y - w.eye;
    },
    trailOnly() {
      const w = this.w, dt = 1 / 60;
      this.histT += dt; if (this.histT > 0.04) { this.histT = 0; this.hist.unshift(this.head.clone()); if (this.hist.length > 260) this.hist.pop(); }
      this.drawTrail();
    },
    drawTrail() {
      const w = this.w, m4 = this._m4, q = this._q, e = this._e, p = this._p, sc = this._s, H = this.hist;
      for (let i = 0; i < this.MAXP; i++) {
        if (i >= this.carry || !H.length) { m4.makeScale(0, 0, 0); this.trail.setMatrixAt(i, m4); continue; }
        const lag = Math.min(H.length - 1, 1 + i * 0.75), i0 = Math.floor(lag), u = lag - i0, A = H[i0], B = H[Math.min(H.length - 1, i0 + 1)];
        const t = w.time * (1.3 + (i % 7) * 0.13) + i * 1.7, spread = 0.25 + Math.min(1.6, i * 0.02);
        p.set(U.lerp(A.x, B.x, u) + Math.sin(t) * spread, U.lerp(A.y, B.y, u) + Math.cos(t * 1.3) * spread * 0.6, U.lerp(A.z, B.z, u) + Math.cos(t * 0.9) * spread);
        e.set(t * 1.1, t * 0.7, t * 0.5); q.setFromEuler(e); sc.setScalar(0.9 + (i % 3) * 0.15);
        m4.compose(p, q, sc); this.trail.setMatrixAt(i, m4);
      }
      this.trail.instanceMatrix.needsUpdate = true;
    },
    fly(env, dt) {
      const w = this.w; dt = Math.min(dt, 0.05);
      const k = w.keys;
      if (k.has('a') || k.has('ArrowLeft')) w.yaw += dt * 1.5; if (k.has('d') || k.has('ArrowRight')) w.yaw -= dt * 1.5;
      if (k.has('w') || k.has('ArrowUp')) w.pitch += dt * 0.9; if (k.has('s') || k.has('ArrowDown')) w.pitch -= dt * 0.9;
      if (w.joy) { w.yaw -= w.joy.dx * dt * 1.6; w.pitch -= w.joy.dy * dt * 1.0; }
      w.pitch = U.clamp(w.pitch, -0.6, 0.6);
      // the valley turns the wind gently back if it strays
      const h = this.head, off = h.x - cx(h.z);
      if (Math.abs(off) > 95 || h.z > 375 || h.z < -390) {
        const tx = cx(h.z) - h.x, tz = (h.z > 0 ? -1 : 1) * 30, want = Math.atan2(-tx, -tz);
        let d = want - w.yaw; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; w.yaw += d * dt * 1.2;
      }
      const gust = k.has(' ') || this.mouseHeld || this.gustHeld;
      this.speed = U.damp(this.speed, this.final ? 5 : gust ? 16 : 7.5, gust ? 2.2 : 1.4, dt);
      const fx = -Math.sin(w.yaw) * Math.cos(w.pitch), fy = Math.sin(w.pitch), fz = -Math.cos(w.yaw) * Math.cos(w.pitch);
      this.vel.set(fx, fy, fz).multiplyScalar(this.speed);
      h.addScaledVector(this.vel, dt);
      // skim the ground; the air thins above
      const gy = this.ground(h.x, h.z), lo = gy + 0.7, hi = gy + 20;
      if (h.y < lo) { h.y = U.damp(h.y, lo, 10, dt); if (w.pitch < -0.1) w.pitch = U.damp(w.pitch, 0, 3, dt); }
      if (h.y > hi) h.y = U.damp(h.y, hi, 1.5, dt);
      this.headU.value.copy(h);
      // the trail
      this.histT += dt; if (this.histT > 0.04) { this.histT = 0; this.hist.unshift(h.clone()); if (this.hist.length > 260) this.hist.pop(); }
      this.drawTrail();
      // brush the flowers
      const R = 2.8 + Math.min(1.2, this.carry * 0.01);
      for (let i = 0; i < this.flowers.length; i++) {
        const f = this.flowers[i];
        if (f.kind !== 'deco' && !f.open) {
          const dx = f.x - h.x, dz = f.z - h.z; if (Math.abs(dx) > R || Math.abs(dz) > R) continue;
          if (Math.hypot(dx, dz) < R && h.y - f.y < 3.4) this.bloom(env, i);
        }
      }
      // flowers animate open (or close again when a chain breaks)
      this.flowers.forEach((f, i) => {
        if (f.open && f.k < 1) { f.t += dt; f.k = Math.min(1, U.easeOut(Math.min(1, f.t / 0.7)) * 1.0); this.drawFlower(i); }
        else if (!f.open && f.k > 0 && f.kind !== 'deco') { f.k = Math.max(0, f.k - dt * 0.6); this.drawFlower(i); }
      });
      // a chain that is left half-swept slowly closes again
      if (this.part === 1) this.chains.forEach(C => {
        if (C.done || C.n === 0) return; C.t += dt;
        if (C.t > 4.5) { C.ids.forEach(i => { this.flowers[i].open = false; }); C.n = 0; C.t = 0; SND.sing(env.bus, 130.81, { vowel: 'm', dur: 1.2, gain: 0.02 }); w.step(this.stepP2()); }
      });
      // buds glimmer
      const bg = this.budGlow.geometry.attributes.position; let nb = 0;
      this.flowers.forEach(f => { if (f.kind !== 'deco' && !f.open && this.relevant(f)) { bg.setXYZ(nb++, f.x, f.y + f.s * 0.5 + 0.2 + Math.sin(w.time * 2 + f.x) * 0.08, f.z); } });
      this.budGlow.geometry.setDrawRange(0, nb); bg.needsUpdate = true; this.budGlow.material.opacity = 0.55 + 0.25 * Math.sin(w.time * 3);
      // pollen
      if (this.pollenT > 0) { this.pollenT -= dt; const a = this.pollen.geometry.attributes.position; for (let j = 0; j < a.count; j++) { this.pollenV[j * 3 + 1] -= dt * 1.2; a.setXYZ(j, a.getX(j) + this.pollenV[j * 3] * dt, a.getY(j) + this.pollenV[j * 3 + 1] * dt, a.getZ(j) + this.pollenV[j * 3 + 2] * dt); } a.needsUpdate = true; this.pollen.material.opacity = Math.max(0, this.pollenT) * 0.6; }
      // wind streaks around you when you gust
      this.streak.position.set(h.x - 0, 0, h.z); this.streak.position.y = gy;
      this.streak.material.opacity = U.damp(this.streak.material.opacity, gust ? 0.5 : 0.08, 3, dt);
      KIT.driftDust(this.streak, dt, w.time, [fx * this.speed * 0.6, fz * this.speed * 0.6]);
      // the world wakes: water, grass, wells
      this.flowZ = U.damp(this.flowZ, this.flowTarget, 0.25, dt); this.waterU.uFlowZ.value = this.flowZ; this.waterU.uTime.value = w.time;
      this.grass.forEach(g => { g.kk = U.damp(g.kk || 0, g.k, 0.8, dt); g.mats().forEach(m => { if (!m.userData.c0) m.userData.c0 = m.color.clone(); m.color.copy(m.userData.c0).lerp(this._green || (this._green = new T.Color('#9fc070')), g.kk * 0.75); }); });
      this.gardens.forEach(G => { G.kk = U.damp(G.kk || 0, G.k, 0.6, dt); G.wellW.position.y = G.wy - 0.6 + G.kk * 0.45; G.wellW.material.color.setRGB(0.04 + G.kk * 0.15, 0.08 + G.kk * 0.22, 0.1 + G.kk * 0.26); });
      // part 3: dusk and lamps
      if (this.part === 2) {
        this.dusk = Math.min(1, (this.dusk || 0) + dt / 12);
        this.sun.intensity = U.lerp(1.8, 1.1, this.dusk); w.renderer.toneMappingExposure = U.lerp(0.85, 0.9, this.dusk);
        if (this.post) this.post.set({ gain: [1.06, 0.98, 0.9], lift: [0.02, 0.01, 0.02] });
        let li = 0;
        this.lamps.forEach((L, i) => {
          if (!L.lit && h.distanceTo(this._p.set(L.x, L.y, L.z)) < 3.4) {
            if (this.carry >= 14) { L.lit = true; this.lit++; this.carry -= 6; SND.bell(env.bus, [523.25, 587.33, 659.25, 783.99, 880, 1046.5][this.lit - 1], { gain: 0.06 }); SND.glow(env.bus, [261.63, 293.66, 329.63, 392, 440, 523.25][this.lit - 1] / 2, { gain: 0.04, dur: 5 }); w.progress(this.lit, this.stepP3()); if (this.lit === 6 && !this.final) this.finale(env); }
            else if (!L.warned) { L.warned = true; w.say('More petals', 'This lamp needs more light than you carry. Brush the flowers on the plain to gather petals, then come back.', { ms: 4500 }); }
          }
          L.k = U.damp(L.k, L.lit ? 1 : 0, 2, dt); L.g.material.opacity = 0.06 + L.k * (0.8 + 0.1 * Math.sin(w.time * 9 + i)); L.g.scale.setScalar(1.6 + L.k * 1.2);
          if (L.lit && li < 2) { this.lampLights[li].position.set(L.x, L.y + 0.4, L.z); this.lampLights[li].intensity = 1.6; li++; }
        });
        w.goal(this.final ? null : (this.lamps.find(L => !L.lit) ? [this.lamps.find(L => !L.lit).x, this.lamps.find(L => !L.lit).y, this.lamps.find(L => !L.lit).z] : null));
      } else {
        // point the way to the next thing that waits
        const next = this.flowers.find(f => f.kind !== 'deco' && !f.open && this.relevant(f));
        w.goal(next && Math.hypot(next.x - h.x, next.z - h.z) > 25 ? [next.x, next.y + 1, next.z] : null);
      }
      // the finale: every petal rises round the great tree
      if (this.final) {
        this.final += dt;
        const gy2 = this.ground(TREE.x, TREE.z), a = this.final * 0.6, r = 14 + Math.sin(this.final * 0.3) * 4;
        h.lerp(this._p.set(TREE.x + Math.cos(a) * r, gy2 + 4 + Math.min(14, this.final * 0.8), TREE.z + Math.sin(a) * r), 1 - Math.exp(-dt * 1.5));
        w.yaw = Math.atan2(-(-Math.sin(a)), -(Math.cos(a)));
        this.carry = Math.min(this.MAXP, this.carry + dt * 12);
      }
      // discoveries: fly through the motes
      this.discs.forEach(D => { if (!D.it.done && h.distanceTo(D.pos) < 3.6) { D.it.done = true; D.it.onUse(w, D.it); } });
      // the camera follows the wind, banking into turns
      const dyaw = w.yaw - (this.pyaw == null ? w.yaw : this.pyaw); this.pyaw = w.yaw;
      this.roll = U.damp(this.roll || 0, U.clamp(-dyaw / Math.max(dt, 1e-3) * 0.08, -0.3, 0.3), 4, dt);
      this.placeCam(dt);
      const fov = 70 + U.clamp((this.speed - 7.5) / 8.5) * 12; if (Math.abs(w.camera.fov - fov) > 0.05) { w.camera.fov = fov; w.camera.updateProjectionMatrix(); }
      if (w._shadow) { const L = w._shadow.light, px = Math.round(h.x / 2) * 2, pz = Math.round(h.z / 2) * 2; L.target.position.set(px, gy, pz); L.position.set(px + this.sunDir.x * 140, gy + this.sunDir.y * 140, pz + this.sunDir.z * 140); }
      // sound: the wind is you
      this.wind.set('gain', 0.04 + this.speed * 0.004, 0.2); this.wind.set('freq', 380 + this.speed * 30, 0.2);
      this.rush.set('gain', U.clamp((this.speed - 8) / 8) * 0.04, 0.2);
      const dWater = Math.abs(h.x - chan(h.z)); this.stream.set('gain', h.z > this.flowZ ? 0.03 * (1 - U.smooth(4, 30, dWater)) : 0, 0.3);
    },
    relevant(f) { return this.part === 0 ? f.group < 3 && f.kind === 'bud' : this.part === 1 ? f.kind === 'chain' : f.group === 9; },

    update(env, dt) {
      const w = this.w; if (!w) return;
      w.update(dt);
      if (w.filmS) { this.waterU.uTime.value = w.time; if (!this.flyFilm) { this.hist = []; this.drawTrail(); } }
      this.birdClock -= dt;
      if (this.birdClock < 0) { this.birdClock = 2 + Math.random() * 5; SND.chirp(env.bus, { gain: 0.02 + (this.part >= 1 ? 0.015 : 0) }); }
      this.dropClock -= dt;
      if (this.dropClock < 0 && this.part >= 1) { this.dropClock = 0.4 + Math.random(); SND.drop(env.bus, { gain: 0.012, f: U.rnd(700, 1400) }); }
    },
  }));
})();
