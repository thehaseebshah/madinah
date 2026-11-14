/* Station — The City of Light. A time-management game (Diner Dash / Overcooked).
   Feeling: the joy of serving; a busy, generous day that ends in lamplight.
   One accelerated day in the courtyard of the Prophet's Mosque today, seen from high above like a
   restaurant floor in Diner Dash: click (or tap) what needs doing and your light hurries there;
   queue up to five tasks. Groups of worshippers arrive as soft clusters of light on their prayer
   rugs (no one is shown): keep them in the shade of the giant umbrellas as the sun moves, keep the
   water coolers full, open the gates when the prayer comes, and at dusk fold the umbrellas and
   light the lamps. Nothing fails: a group left in the sun simply rises and drifts to find shade.
   Colour script: white marble and canopy, sky blue by day, amber by dusk; the green of the dome. */
(function () {
  'use strict';
  if (!window.WORLD) return;
  const T = THREE;

  /* ---------------- layout: the mosque to the north (-z), the plaza south of it ---------------- */
  const FACADE_Z = -62, PLAZA = { x0: -78, x1: 78, z0: -56, z1: 58 };
  const UMB = []; for (let a = 0; a < 6; a++) for (let b = 0; b < 4; b++) UMB.push({ x: -62.5 + a * 25, z: -40 + b * 26 });
  const COOLERS = [{ x: -50, z: -8 }, { x: 0, z: -8 }, { x: 50, z: -8 }, { x: -25, z: 32 }, { x: 25, z: 32 }];
  const SUPPLY = { x: 0, z: -54 };
  const GATES = [{ x: -54, name: 'the west gate' }, { x: -18, name: 'the middle gate' }, { x: 18, name: 'the great gate' }, { x: 54, name: 'the east gate' }].map(g => Object.assign(g, { z: FACADE_Z + 1.5 }));
  const LAMPS = []; for (let a = 0; a < 6; a++) LAMPS.push({ x: -75 + a * 30, z: 56 }); for (let b = 0; b < 3; b++) { LAMPS.push({ x: -77, z: -30 + b * 34 }); LAMPS.push({ x: 77, z: -30 + b * 34 }); }
  const CANOPY_Y = 15.2, POLE_H = 14.2, HALFW = 12.6;
  const NOTES = [293.66, 329.63, 369.99, 440, 493.88, 587.33];
  // the day: clock hours for each part, and real seconds each part lasts
  const PARTS = [
    { id: 'morning', title: 'Part 1 of 3 · Morning', h0: 6.2, h1: 11, secs: 80, sky: 'qwantani_morning_puresky', step: 'Click an umbrella to open it over a group in the sun · fetch water (south of the gates) for an empty cooler' },
    { id: 'noon', title: 'Part 2 of 3 · Noon', h0: 11, h1: 15, secs: 85, sky: 'qwantani_noon_puresky', step: 'The heat rises and the coolers run dry faster · when the call to prayer comes, open the four gates' },
    { id: 'dusk', title: 'Part 3 of 3 · Dusk', h0: 15, h1: 19.4, secs: 95, sky: 'qwantani_sunset_puresky', step: 'The shade moves with the sun · at sunset fold the umbrellas, light the lamps and open the gates' },
  ];

  // the sun of a Madinah day, east at dawn, high at noon, west at dusk (x east, -z north)
  function sunAt(h) {
    const t = U.clamp((h - 6) / 12.4), az = Math.PI * t, el = Math.sin(Math.PI * t) * 1.38 + 0.02;
    return new T.Vector3(Math.cos(az) * Math.cos(el), Math.sin(el), Math.sin(az) * Math.cos(el) * 0.35).normalize();
  }
  function el(parent, css, html) { const d = document.createElement('div'); d.style.cssText = css; if (html != null) d.innerHTML = html; parent.appendChild(d); return d; }

  // the canopy opens like a flower: a vertex shader morphs between furled and open shapes, per instance
  function canopyPatch(mat) {
    mat.onBeforeCompile = sh => {
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float aOpen;')
        .replace('#include <begin_vertex>', `#include <begin_vertex>
          { float r = length(transformed.xz); vec2 d = r > 0.001 ? transformed.xz / r : vec2(0.0);
            float fr = 0.25 + r * 0.035; vec3 furled = vec3(d.x * fr, 1.2 - r * 0.62, d.y * fr);
            float k = smoothstep(0.0, 1.0, aOpen);
            transformed = mix(furled, transformed, k); }`)
        .replace('#include <beginnormal_vertex>', '#include <beginnormal_vertex>\n{ vec2 dd = normalize(position.xz + vec2(0.0001)); objectNormal = normalize(mix(vec3(dd.x, 0.15, dd.y), objectNormal, smoothstep(0.0, 1.0, aOpen))); }');
    };
    mat.customProgramCacheKey = () => 'canopy';
    return mat;
  }

  ENGINE.register(WORLD.stage({
    key: 'city',
    arabic: 'المدينة المنوّرة',
    title: 'The City of Light',
    era: 'Madinah today · one day in the courtyard',
    hint: 'Click what needs doing (up to five in a row) · wheel zooms · groups in the sun glow orange',
    hintTouch: 'Tap what needs doing (up to five in a row) · pinch the wheel button to zoom',
    sound: { reverb: 0.4 },
    story: `<p>Around the Prophet’s Mosque, about 250 giant umbrellas stand in the marble courtyards. Each opens to roughly 25 metres square, and together they shade some 143,000 square metres through the heat of the day. At evening they fold away and the courtyards are lit for the night.</p>
            <p>Spend one day in the courtyard: keep the worshippers’ circles in the shade as the sun moves, keep the water cool and flowing, open the gates when the prayer comes, and at dusk fold the umbrellas and light the lamps.</p>`,

    enter(env) {
      const self = this;
      const w = this.w = WORLD.create(env, { start: { x: 0, z: 20, yaw: 0 }, exposure: 0.78, far: 2200, fov: 30, fog: { color: 0xdcd6cc, density: 0.0007 }, bounds: [PLAZA.x0, PLAZA.z0, PLAZA.x1, PLAZA.z1] });
      const S = w.scene, R = U.seeded(2010);
      w.ground = () => 0;
      this.part = -1; this.hour = 6; this.queue = []; this.carry = 0; this.groups = []; this.zoom = 1; this.busy = 0; this.n = 0; this.flow = [];

      /* ---------- sky, sun, finish ---------- */
      w.sky({ top: '#5a8ccc', mid: '#f0dcc0', bot: '#dcd6cc', sunDir: [0.7, 0.3, 0.2], sun: '#ffe2b0', sunSize: 0.0016, clouds: 0.25, haze: 0.4 });
      const sun = this.sun = new T.DirectionalLight(0xfff0dc, 1.8); sun.position.set(60, 40, 20); S.add(sun);
      this.hemi = new T.HemisphereLight(0xd8e4f0, 0x9a8a78, PHOTO.enabled ? 0.12 : 0.6); S.add(this.hemi);
      w.followShadow(sun, 70, 2048); sun.shadow.bias = -0.0005;
      this.setSky = (id, h) => { const sd = sunAt(h); const rot = Math.atan2(sd.z, sd.x) - 0.629; return PHOTO.sky(w, id, { rotation: rot, intensity: this.envK || 0.5, haze: '#dcd6cc', horizon: 0.4, ground: '#e8e2d8', bounce: 0.6 }); };
      this.setSky('qwantani_dawn_puresky', 6.3);
      this.post = w.post({ bloom: 0.45, threshold: 0.8, rays: { strength: 0.25, dir: [0.7, 0.3, 0.2] }, vignette: 0.3, grain: 0.025, lift: [0.01, 0.01, 0.015], gain: [1.02, 1.0, 0.97] });

      /* ---------- the plaza, the city and the hills ---------- */
      SCAPE.terrain(w, { size: 2000, seg: 120, height: (x, z) => U.smooth(650, 950, Math.hypot(x, z)) * SCAPE.ridge(x * 0.0025 + 2, z * 0.0025, 4) * 160 - 0.03,
        colors: { low: '#d8d2c8', high: '#cfc8bc', rock: '#6a5040', dark: '#4a3a30' }, photo: { ground: 'marble_01', rock: 'rock_face_03', normal: 0.5 }, rep: 0.16, rockRep: 0.025 });
      SCAPE.horizon(w, { haze: '#dcd6cc', layers: [{ r: 1200, h: 80, color: '#7a5c4c', seed: 21 }, { r: 1600, h: 140, color: '#9a8478', seed: 22 }] });
      const M = {
        marble: PHOTO.mat(w, 'marble_01', { triplanar: 0.25, color: 0xf2eee8, rough: 0.4, fallback: KIT.plaster(w, [4, 4], '#eee8e0') }),
        stone: PHOTO.mat(w, 'plastered_stone_wall', { triplanar: 0.2, color: 0xf0e8dc, fallback: KIT.plaster(w, [2, 2], '#e8dcc8') }),
        brass: new T.MeshStandardMaterial({ color: 0xd2aa5c, metalness: 1, roughness: 0.3 }),
        steel: new T.MeshStandardMaterial({ color: 0xe8e8ea, metalness: 0.6, roughness: 0.35 }),
      };
      // the plaza floor: pale marble with darker bands on a 25 m grid
      const plazaT = w.tex(512, (g, s) => { g.fillStyle = '#dcd6cc'; g.fillRect(0, 0, s, s); g.strokeStyle = '#b8b0a6'; g.lineWidth = 10; g.strokeRect(0, 0, s, s); g.strokeStyle = '#d0c8be'; g.lineWidth = 3; for (let k = 1; k < 8; k++) { g.beginPath(); g.moveTo(k * s / 8, 0); g.lineTo(k * s / 8, s); g.stroke(); g.beginPath(); g.moveTo(0, k * s / 8); g.lineTo(s, k * s / 8); g.stroke(); } g.save(); g.translate(s / 2, s / 2); g.strokeStyle = '#a89c8c'; g.lineWidth = 6; U.star8(g, 0, 0, 60, 0.7); g.stroke(); g.restore(); }, [6.4, 4.6]);
      const pl = new T.Mesh(new T.PlaneGeometry(160, 116).rotateX(-Math.PI / 2), new T.MeshStandardMaterial({ map: plazaT, roughness: 0.35, metalness: 0.05 })); pl.position.set(0, 0.02, 1); pl.receiveShadow = true; S.add(pl);
      // the mosque facade: arcades of cream stone, brass gates, ten minarets, the Green Dome beyond
      const m4 = new T.Matrix4();
      const box = (a, b, c, m, x, y, z) => { const o = new T.Mesh(new T.BoxGeometry(a, b, c), m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; S.add(o); return o; };
      box(220, 14, 80, M.stone, 0, 7, FACADE_Z - 40);
      const archT = w.tex(512, (g, s) => { g.fillStyle = '#efe6d6'; g.fillRect(0, 0, s, s); g.fillStyle = '#5a4630'; g.beginPath(); g.moveTo(s * 0.18, s); g.lineTo(s * 0.18, s * 0.45); g.quadraticCurveTo(s * 0.5, s * 0.05, s * 0.82, s * 0.45); g.lineTo(s * 0.82, s); g.fill(); g.strokeStyle = '#c8a050'; g.lineWidth = 8; g.beginPath(); g.moveTo(s * 0.16, s); g.lineTo(s * 0.16, s * 0.45); g.quadraticCurveTo(s * 0.5, s * 0.02, s * 0.84, s * 0.45); g.lineTo(s * 0.84, s); g.stroke(); g.fillStyle = '#b8924a'; g.fillRect(0, s * 0.02, s, s * 0.04); g.fillStyle = 'rgba(255,236,190,0.55)'; for (let k = 0; k < 5; k++) { g.beginPath(); g.arc(s * (0.3 + k * 0.1), s * 0.6, 6, 0, 6.283); g.fill(); } }, [22, 1]);
      M.facade = new T.MeshStandardMaterial({ map: archT, roughness: 0.6, emissive: 0xffd8a0, emissiveMap: archT, emissiveIntensity: 0 });
      const fac = new T.Mesh(new T.PlaneGeometry(220, 14), M.facade); fac.position.set(0, 7, FACADE_Z + 0.03); S.add(fac);
      box(222, 1.4, 2, M.stone, 0, 14.4, FACADE_Z - 0.8);
      const gateT = w.tex(256, (g, s) => { g.fillStyle = '#8a6a32'; g.fillRect(0, 0, s, s); g.strokeStyle = '#e0bc70'; g.lineWidth = 6; g.strokeRect(8, 8, s - 16, s - 16); g.beginPath(); g.moveTo(s / 2, 8); g.lineTo(s / 2, s - 8); g.stroke(); for (let y = 30; y < s; y += 34) for (let x = 24; x < s; x += 34) { g.fillStyle = '#ecc878'; g.beginPath(); g.arc(x, y, 4, 0, 6.283); g.fill(); } g.save(); g.translate(s / 4, s / 2); g.strokeStyle = '#ecc878'; g.lineWidth = 3; U.star8(g, 0, 0, 22, 0.65); g.stroke(); g.translate(s / 2, 0); U.star8(g, 0, 0, 22, 0.65); g.stroke(); g.restore(); });
      this.gates = GATES.map(gt => {
        const fr = box(9, 11, 1.4, M.stone, gt.x, 5.5, FACADE_Z + 0.3); fr.material = M.stone;
        const piv = [-1, 1].map(s => { const p = new T.Group(); p.position.set(gt.x + s * 3, 0, FACADE_Z + 1.2); const leaf = new T.Mesh(new T.BoxGeometry(3, 8.5, 0.25), new T.MeshStandardMaterial({ map: gateT, metalness: 0.75, roughness: 0.3 })); leaf.position.set(-s * 1.5, 4.25, 0); leaf.castShadow = true; p.add(leaf); p.userData.s = s; p.userData.dynamic = true; S.add(p); return p; });
        const glow = KIT.glow(w, 0xffe0a0, 6, 0); glow.position.set(gt.x, 4, FACADE_Z + 2); S.add(glow);
        return Object.assign({}, gt, { piv, glow, open: 0, want: 0 });
      });
      const minM = PHOTO.mat(w, 'marble_01', { triplanar: 0.2, color: 0xf2ece2, fallback: KIT.plaster(w, [2, 8], '#eee6d8') });
      [[-112, FACADE_Z - 2], [112, FACADE_Z - 2], [-112, FACADE_Z - 78], [112, FACADE_Z - 78], [-60, FACADE_Z - 82], [60, FACADE_Z - 82]].forEach(([x, z]) => { const m = KIT.minaret(w, 96, true); m.position.set(x, 0, z); S.add(m); this.minarets = (this.minarets || []).concat(m); });
      const gd = KIT.greenDome(w, 0.9); gd.position.set(40, 14, FACADE_Z - 70); S.add(gd);
      for (let k = 0; k < 18; k++) { const d = new T.Mesh(new T.SphereGeometry(4.5, 18, 8, 0, Math.PI * 2, 0, Math.PI / 2), M.marble); d.scale.y = 0.6; d.position.set(-80 + (k % 6) * 32, 14, FACADE_Z - 18 - Math.floor(k / 6) * 22); S.add(d); }
      // hotels of the city, east, west and south
      const cityT = w.tex(256, (g, s) => { g.fillStyle = '#d8d0c4'; g.fillRect(0, 0, s, s); for (let y = 8; y < s; y += 16) for (let x = 6; x < s; x += 14) { g.fillStyle = '#4a5864'; g.fillRect(x, y, 8, 10); } }, [3, 6]);
      this.cityMat = new T.MeshStandardMaterial({ map: cityT, roughness: 0.8, emissive: 0xffd8a0, emissiveMap: w.tex(256, (g, s) => { g.fillStyle = '#000'; g.fillRect(0, 0, s, s); for (let y = 8; y < s; y += 16) for (let x = 6; x < s; x += 14) { g.fillStyle = Math.random() < 0.6 ? '#ffd8a0' : '#000'; g.fillRect(x, y, 8, 10); } }, [3, 6]), emissiveIntensity: 0 });
      const city = SCAPE.scatter(w, { kind: 'house', n: 90, area: { x: 0, z: 0, r: 620 }, scale: [26, 52], seed: 9, avoid: (x, z) => Math.hypot(x, z * 1.2) < 190 });
      city.meshes.forEach(m => { m.material = this.cityMat; });
      SCAPE.birds(w, { n: 24, x: 0, z: 0, y: 26, r: 50, color: 0xd8d4cc, speed: 0.12 });

      /* ---------- the umbrellas ---------- */
      const poleG = (() => { const p = []; const b = new T.CylinderGeometry(1.1, 1.3, 1.6, 12); b.translate(0, 0.8, 0); p.push(b); const c = new T.CylinderGeometry(0.42, 0.55, POLE_H, 14); c.translate(0, POLE_H / 2, 0); p.push(c); const cap = new T.CylinderGeometry(0.7, 0.45, 1.0, 14); cap.translate(0, POLE_H + 0.5, 0); p.push(cap); return SCAPE.merge(p); })();
      const poles = new T.InstancedMesh(poleG, M.steel, UMB.length), bases = new T.InstancedMesh(new T.CylinderGeometry(1.25, 1.35, 1.2, 12).translate(0, 0.6, 0), M.brass, UMB.length);
      UMB.forEach((u, k) => { m4.makeTranslation(u.x, 0, u.z); poles.setMatrixAt(k, m4); bases.setMatrixAt(k, m4); w.addCircle(u.x, u.z, 1.4); });
      poles.castShadow = poles.receiveShadow = bases.castShadow = true; S.add(poles); S.add(bases);
      // the canopy: a square membrane rising to the pole, with seams to its corners and scalloped edges
      const cg = new T.PlaneGeometry(HALFW * 2, HALFW * 2, 24, 24); cg.rotateX(-Math.PI / 2);
      const cp = cg.attributes.position;
      for (let i = 0; i < cp.count; i++) { const x = cp.getX(i), z = cp.getZ(i), r = Math.hypot(x, z), m = Math.max(Math.abs(x), Math.abs(z)) / HALFW; const seam = Math.pow(Math.abs(Math.abs(x) - Math.abs(z)) / HALFW, 0.6); cp.setY(i, 1.5 - Math.pow(m, 1.3) * 1.9 + seam * 0.35 * m - (m > 0.97 ? Math.sin(Math.atan2(z, x) * 16) * 0.0 : 0)); }
      cg.computeVertexNormals();
      const memT = w.tex(512, (g, s) => { g.fillStyle = '#f8f6f2'; g.fillRect(0, 0, s, s); g.strokeStyle = 'rgba(160,150,140,0.5)'; g.lineWidth = 3; g.beginPath(); g.moveTo(0, 0); g.lineTo(s, s); g.moveTo(s, 0); g.lineTo(0, s); g.moveTo(s / 2, 0); g.lineTo(s / 2, s); g.moveTo(0, s / 2); g.lineTo(s, s / 2); g.stroke(); g.strokeStyle = 'rgba(190,170,130,0.6)'; g.lineWidth = 6; g.strokeRect(3, 3, s - 6, s - 6); for (let k = 1; k < 4; k++) { g.strokeStyle = 'rgba(170,160,150,0.25)'; g.lineWidth = 2; g.strokeRect(k * s / 8, k * s / 8, s - k * s / 4, s - k * s / 4); } });
      const memM = canopyPatch(new T.MeshStandardMaterial({ map: memT, color: 0xe4e0da, roughness: 0.55, side: T.DoubleSide, emissive: 0xffe8c0, emissiveIntensity: 0 }));
      const aOpen = new T.InstancedBufferAttribute(new Float32Array(UMB.length), 1); cg.setAttribute('aOpen', aOpen);
      const can = this.canopy = new T.InstancedMesh(cg, memM, UMB.length);
      UMB.forEach((u, k) => { m4.makeTranslation(u.x, CANOPY_Y - 1.5, u.z); can.setMatrixAt(k, m4); });
      const depthM = canopyPatch(new T.MeshDepthMaterial({ depthPacking: T.RGBADepthPacking, side: T.DoubleSide })); can.customDepthMaterial = depthM;
      can.castShadow = true; can.receiveShadow = true; can.frustumCulled = false; S.add(can); this.memM = memM;
      this.umb = UMB.map((u, k) => Object.assign({}, u, { k, open: 0, want: 0 }));
      // lamps on the umbrella columns, lit at dusk
      const ulG = new T.InstancedMesh(new T.SphereGeometry(0.35, 8, 6), new T.MeshBasicMaterial({ color: 0xfff0d0 }), UMB.length * 4);
      UMB.forEach((u, k) => { for (let s = 0; s < 4; s++) { const a = s * Math.PI / 2; m4.makeTranslation(u.x + Math.cos(a) * 0.6, 11, u.z + Math.sin(a) * 0.6); ulG.setMatrixAt(k * 4 + s, m4); } }); ulG.visible = false; S.add(ulG); this.umbLamps = ulG;

      /* ---------- coolers, the water point, lamp posts ---------- */
      const coolG = (() => { const p = []; for (let k = 0; k < 4; k++) { const c = new T.CylinderGeometry(0.4, 0.4, 1.0, 14); c.translate((k % 2 - 0.5) * 0.95, 1.35, (Math.floor(k / 2) - 0.5) * 0.95); p.push(c); } const st = new T.BoxGeometry(2.2, 0.85, 2.2); st.translate(0, 0.42, 0); p.push(st); return SCAPE.merge(p); })();
      const coolM = new T.MeshStandardMaterial({ color: 0xf4f2ee, roughness: 0.35, metalness: 0.1 });
      this.coolers = COOLERS.map((c, k) => {
        // a full cooler serves two circles for about forty seconds
        const g = new T.Group(); g.position.set(c.x, 0, c.z); S.add(g);
        const body = new T.Mesh(coolG, coolM); body.castShadow = body.receiveShadow = true; g.add(body);
        const sign = new T.Mesh(new T.BoxGeometry(1.4, 0.5, 0.06), M.brass); sign.position.set(0, 2.25, 1.0); g.add(sign);
        const ring = new T.Mesh(new T.RingGeometry(1.7, 1.95, 40, 1, 0, Math.PI * 2).rotateX(-Math.PI / 2), new T.MeshBasicMaterial({ color: 0x7ac8ff, transparent: true, opacity: 0.8, depthWrite: false })); ring.position.y = 0.05; g.add(ring);
        const need = KIT.glow(w, 0x9fd8ff, 3, 0); need.position.y = 3; g.add(need);
        w.addCircle(c.x, c.z, 1.6);
        return Object.assign({}, c, { k, g, ring, need, level: 1, drain: 0.0095 + (k % 3) * 0.0015 });
      });
      const sup = new T.Group(); sup.position.set(SUPPLY.x, 0, SUPPLY.z); S.add(sup);
      for (let k = 0; k < 10; k++) { const c = new T.Mesh(new T.CylinderGeometry(0.38, 0.38, 1.0, 14), coolM); c.position.set((k % 5 - 2) * 0.9, 0.5 + Math.floor(k / 5) * 1.02, 0); c.castShadow = true; sup.add(c); }
      const supSign = new T.Mesh(new T.BoxGeometry(4.6, 0.6, 0.08), M.brass); supSign.position.set(0, 2.6, 0.5); sup.add(supSign); w.addBox(SUPPLY.x - 2.5, SUPPLY.z - 0.6, SUPPLY.x + 2.5, SUPPLY.z + 0.6);
      this.supGlow = KIT.glow(w, 0x9fd8ff, 5, 0); this.supGlow.position.set(SUPPLY.x, 3, SUPPLY.z); S.add(this.supGlow);
      const lampG = (() => { const p = []; const pole = new T.CylinderGeometry(0.16, 0.24, 7, 10); pole.translate(0, 3.5, 0); p.push(pole); const head = new T.CylinderGeometry(0.5, 0.35, 1.1, 8); head.translate(0, 7.6, 0); p.push(head); const top = new T.ConeGeometry(0.6, 0.8, 8); top.translate(0, 8.5, 0); p.push(top); return SCAPE.merge(p); })();
      const lampI = new T.InstancedMesh(lampG, M.brass, LAMPS.length); LAMPS.forEach((l, k) => { m4.makeTranslation(l.x, 0, l.z); lampI.setMatrixAt(k, m4); }); lampI.castShadow = true; S.add(lampI);
      this.lamps = LAMPS.map((l, k) => { const g = KIT.glow(w, 0xffd090, 4, 0); g.position.set(l.x, 7.6, l.z); S.add(g); const pl = k % 3 === 0 && k < 18 ? null : null; return Object.assign({}, l, { k, g, on: 0 }); });
      this.night = [-40, 40].map(x => { const L = new T.PointLight(0xffc880, 0, 120, 1.6); L.position.set(x, 10, 0); S.add(L); return L; });

      /* ---------- worshippers: circles of light on prayer rugs ---------- */
      const rugT = w.tex(128, (g, s) => { g.fillStyle = '#8a1c20'; g.fillRect(0, 0, s, s); g.strokeStyle = '#d8b060'; g.lineWidth = 6; g.strokeRect(8, 8, s - 16, s - 16); g.fillStyle = '#1e5a3a'; g.beginPath(); g.moveTo(s * 0.3, s * 0.8); g.lineTo(s * 0.3, s * 0.35); g.quadraticCurveTo(s / 2, s * 0.15, s * 0.7, s * 0.35); g.lineTo(s * 0.7, s * 0.8); g.fill(); });
      this.rugM = new T.MeshStandardMaterial({ map: rugT, roughness: 0.95 });
      this.rugG = new T.PlaneGeometry(1.1, 1.9).rotateX(-Math.PI / 2);
      this.spots = []; for (let a = -2; a <= 2; a++) for (let b = -1; b <= 2; b++) this.spots.push({ x: a * 25 + (b % 2 ? 6 : -6) + (R() - 0.5) * 6, z: -27 + b * 26 + (R() - 0.5) * 6 });
      const lightG = new T.SphereGeometry(0.3, 8, 6);
      this.lightM = new T.InstancedMesh(lightG, new T.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }), 400); this.lightM.count = 0; this.lightM.frustumCulled = false; S.add(this.lightM);
      this.haloM = new T.InstancedMesh(new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({ map: KIT.glowTex(w), color: 0xffffff, transparent: true, depthWrite: false, blending: T.AdditiveBlending }), 400); this.haloM.count = 0; this.haloM.frustumCulled = false; S.add(this.haloM);

      /* ---------- the player: a quick light with a ring, and markers for queued tasks ---------- */
      this.me = KIT.glow(w, 0xfff0c8, 3.2, 1); S.add(this.me); this.meCore = KIT.glow(w, 0xffffff, 1.2, 1); S.add(this.meCore);
      this.mePos = new T.Vector3(0, 0, 20);
      this.jugs = [0, 1].map(k => { const j = new T.Mesh(new T.CylinderGeometry(0.3, 0.3, 0.8, 10), coolM); j.visible = false; S.add(j); return j; });
      this.marks = [...Array(5)].map((_, k) => { const g = new T.Mesh(new T.RingGeometry(2.0, 2.4, 40).rotateX(-Math.PI / 2), new T.MeshBasicMaterial({ color: 0xfff0c8, transparent: true, opacity: 0, depthWrite: false })); g.position.y = 0.08; S.add(g); return g; });

      /* ---------- HUD: the clock, the queue, the wheel ---------- */
      const L = w.ui.layer;
      this.clockEl = el(L, 'position:absolute;left:24px;top:64px;padding:7px 12px;border-radius:4px 12px 4px 12px;background:rgba(6,9,20,.55);border:1px solid rgba(255,240,210,.18);color:#f4ead8;font:500 13px/1.4 Marcellus,Georgia,serif;letter-spacing:.06em;pointer-events:none;opacity:0;transition:opacity .5s', '');
      this.queueEl = el(L, 'position:absolute;left:50%;bottom:96px;transform:translateX(-50%);display:flex;gap:6px;pointer-events:none;opacity:0;transition:opacity .5s');
      this.carryEl = el(L, 'position:absolute;left:24px;top:124px;padding:5px 10px;border-radius:10px;background:rgba(6,9,20,.5);color:#cfe8ff;font:500 12px Marcellus,Georgia,serif;letter-spacing:.06em;pointer-events:none;opacity:0;transition:opacity .4s', '');
      this.veil = el(L, 'position:absolute;inset:0;background:#05060c;opacity:0;pointer-events:none;transition:opacity 1.1s;display:flex;align-items:center;justify-content:center;color:#f4ead8;font:400 28px/1.3 Marcellus,Georgia,serif;letter-spacing:.12em;text-align:center');

      /* ---------- discoveries (clicked like any other task) ---------- */
      this.discs = [
        { pos: [-37.5, 2, -40], title: 'The great umbrellas', text: 'About 250 giant umbrellas, set up in 2010–2011, shade the courtyards of the Prophet’s Mosque. Each opens to some 25 metres square, about 600 square metres; together they cover some 143,000 square metres.', ar: 'نحو مئتين وخمسين مظلّةً عملاقة، تغطّي كلٌّ منها قرابة ستمئة متر مربّع' },
        { pos: [62.5, 2, 38], title: 'With the weather', text: 'The umbrellas open and close automatically with the weather: open against the sun by day, folded at night.', ar: 'تُفتح المظلّات وتُغلق آليًّا بحسب الطقس' },
        { pos: [36, 2, -55], title: 'The Green Dome', text: 'The first dome over the Prophet’s ﷺ grave was built in 1279 under Sultan Qalawun. The present dome dates from 1818 and was first painted green in 1837.', ar: 'بُنيت أول قبة سنة ٦٧٨هـ، والحالية من سنة ١٨١٨م، وطُليت بالأخضر سنة ١٨٣٧م' },
        { pos: [-72, 2, -52], title: 'Ten minarets', text: 'The mosque has ten minarets. Of the oldest, only two survive in their place: the main minaret and the minaret of Bab as-Salam.', ar: 'للمسجد عشر منارات، بقي من القديمة منارتان: الرئيسية ومنارة باب السلام' },
        { pos: [0, 2, -44], title: 'Three mosques', text: '“Do not set out on a journey except for three mosques: al-Masjid al-Haram, the mosque of the Messenger ﷺ, and al-Masjid al-Aqsa.” (Sahih al-Bukhari 1189)', ar: 'لا تُشدّ الرحال إلا إلى ثلاثة مساجد: المسجد الحرام، ومسجد الرسول ﷺ، والمسجد الأقصى' },
        { pos: [70, 2, -10], title: 'The great expansion', text: 'King Fahd’s expansion, begun in 1985 and completed in the early 1990s, grew the mosque to more than 160,000 square metres.', ar: 'توسعة الملك فهد التي بدأت سنة ١٩٨٥ بلغت بالمسجد أكثر من ١٦٠ ألف متر مربع' },
        { pos: [-62, 2, 50], title: 'A thousand prayers', text: '“One prayer in this mosque of mine is better than a thousand prayers in any other mosque, except al-Masjid al-Haram.” (Sahih al-Bukhari 1190)', ar: 'صلاةٌ في مسجدي هذا خيرٌ من ألف صلاةٍ فيما سواه إلا المسجد الحرام' },
      ].map(d => w.discover(Object.assign(d, { size: 3.2, r: 6 })));

      /* ---------- sound ---------- */
      const bus = env.bus;
      this.snd = { crowd: SND.noise(bus, { color: 'pink', type: 'bandpass', freq: 500, q: 0.6, gain: 0.0 }), wind: SND.noise(bus, { color: 'pink', type: 'highpass', freq: 1800, gain: 0.015 }) };
      this.murT = 3;

      /* ---------- input: point and click ---------- */
      this.ray = new T.Raycaster(); this.plane = new T.Plane(new T.Vector3(0, 1, 0), 0);
      w.onPointer = (e, p, phase) => {
        if (w.cine || this.part < 0) return false;
        if (phase === 'down') this.click(env, e.clientX, e.clientY);
        return true;
      };
      w.mode = (dt) => this.play(env, dt);
      S.traverse(o => { if (o.isInstancedMesh) { o.userData.dynamic = true; o.frustumCulled = false; } });
      w.bake();
    },

    /* ---------------- the film ---------------- */
    film(env, w) {
      const self = this, u = this.umb[8];
      return [
        { dur: 7, fade: 'dip', title: true, fov: [46, 40], path: [[[30, 190, -220], [0, 20, 0]], [[20, 120, -150], [0, 10, 0]], [[0, 50, -40], [0, 8, 20]]], start: () => SND.glow(env.bus, 174.61, { gain: 0.05, dur: 7 }) },
        { dur: 6.5, fade: 'dip', ease: 'linear', path: [[[-70, 3, 50], [0, 9, 0]], [[-50, 4, 30], [10, 9, -20]]],
          lines: [[0.4, 'Around the Prophet’s Mosque stand some 250 giant umbrellas.', 'حول المسجد النبوي نحو مئتين وخمسين مظلّةً عملاقة'], [3.5, 'At dawn they are still furled.', 'وهي عند الفجر مطويّة']],
          start: () => self.spawn(true) },
        { dur: 7, fade: 'cut', fov: [56, 60], path: [[[u.x + 4, 1.6, u.z + 6], [u.x, CANOPY_Y, u.z]], [[u.x + 6, 1.6, u.z + 9], [u.x, CANOPY_Y + 2, u.z - 2]]],
          lines: [[0.4, 'Each opens to some 25 metres square,', 'تنفتح كلٌّ منها نحو خمسةٍ وعشرين مترًا مربعًا'], [3.6, 'and together they shade some 143,000 square metres.', 'وتظلّل معًا نحو ١٤٣ ألف متر مربع']],
          start: () => { u.want = 1; SND.swell(env.bus, { f0: 120, f1: 300, dur: 4, gain: 0.04 }); }, during: (w, k, dt) => self.animUmb(dt), skip: () => { u.want = 0; u.open = 0; self.updCanopy(); } },
        { dur: 6.5, fade: 'dip', path: [[[60, 30, 50], [40, 18, FACADE_Z - 70]], [[30, 22, 30], [40, 18, FACADE_Z - 70]]],
          line: 'They open and close with the weather; at night the courtyards are lit.', ar: 'تُفتح وتُغلق بحسب الطقس، وفي الليل تُضاء الساحات' },
        { dur: 6, fade: 'dip', path: [[[0, 120, 160], [0, 0, 0]], [[0, 80, 90], [0, 0, 10]]], line: 'One day in the courtyard, from dawn to the lamps of night.', ar: 'يومٌ في الساحة، من الفجر إلى قناديل الليل',
          start: () => { u.want = 0; u.open = 0; self.updCanopy(); } },
      ];
    },
    filmOpts: { end(w) { const st = ENGINE.cur; if (!st || !st.umb) return; st.umb.forEach(u => { u.want = 0; u.open = 0; }); st.updCanopy(); st.begin(0); } },

    /* ---------------- the day ---------------- */
    begin(k) {
      const w = this.w, P = PARTS[k]; this.part = k; this.hour = P.h0; this.partT = 0; this.n = 0;
      this.need = k === 0 ? 7 : k === 1 ? 7 : 6;
      w.activity(P.title, this.need, P.step);
      this.setSky(P.sky, (P.h0 + P.h1) / 2);
      [this.clockEl, this.queueEl, this.carryEl].forEach(e => { e.style.opacity = 1; });
      this.prayer = null; this.gates.forEach(g => { g.want = 0; });
      if (k === 0) { this.shadedOnce = new Set(); this.refills = 0; this.groups = []; this.spawnT = 0; this.coolers.forEach((c, i) => { c.level = i === 1 ? 0.0 : i === 3 ? 0.05 : 0.8; }); }
      if (k === 1) { this.refills = 0; this.coolers.forEach(c => { c.drain *= 1.6; }); }
      if (k === 2) { this.folded = 0; this.lit = 0; }
      w.goal(null);
    },
    spawn(film) {
      // a new circle of worshippers arrives at a free spot
      const free = this.spots.filter(s => !this.groups.some(g => Math.hypot(g.x - s.x, g.z - s.z) < 6));
      if (!free.length) return null;
      const s = free[(Math.random() * free.length) | 0], n = 5 + ((Math.random() * 5) | 0);
      const g = { x: s.x, z: s.z, n, heat: 0, t: 0, arrive: film ? 1 : 0, leave: 0, shaded: false, rug: [] };
      for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, r = 1.6; const rug = new T.Mesh(this.rugG, this.rugM); rug.position.set(g.x + Math.cos(a) * r, 0.04, g.z + Math.sin(a) * r); rug.rotation.y = -a + Math.PI / 2; rug.receiveShadow = true; this.w.scene.add(rug); g.rug.push(rug); }
      this.groups.push(g); return g;
    },
    shadeAt(x, z) {
      const sd = sunAt(this.hour); if (sd.y < 0.05) return true;
      const ox = -sd.x / sd.y * CANOPY_Y, oz = -sd.z / sd.y * CANOPY_Y;
      return this.umb.some(u => u.open > 0.85 && Math.abs(x - (u.x + ox)) < HALFW - 0.5 && Math.abs(z - (u.z + oz)) < HALFW - 0.5);
    },
    targets() {
      const out = [];
      this.umb.forEach(u => out.push({ x: u.x, z: u.z, r: 6, kind: 'umb', o: u, label: u.want ? 'Fold' : 'Open' }));
      this.coolers.forEach(c => out.push({ x: c.x, z: c.z, r: 4, kind: 'cool', o: c, label: 'Fill' }));
      out.push({ x: SUPPLY.x, z: SUPPLY.z, r: 5, kind: 'sup', label: 'Water' });
      this.gates.forEach(g => out.push({ x: g.x, z: g.z + 3, r: 7, kind: 'gate', o: g, label: 'Gate' }));
      if (this.part === 2) this.lamps.forEach(l => out.push({ x: l.x, z: l.z, r: 4, kind: 'lamp', o: l, label: 'Lamp' }));
      (this.discs || []).forEach(d => { if (!d.done) out.push({ x: d.pos.x, z: d.pos.z, r: 5, kind: 'disc', o: d, label: '?' }); });
      return out;
    },
    click(env, cx, cy) {
      const w = this.w; if (this.busy) return;
      const v = new T.Vector2(cx / env.w * 2 - 1, -(cy / env.h) * 2 + 1); this.ray.setFromCamera(v, w.camera);
      const hit = new T.Vector3(); if (!this.ray.ray.intersectPlane(this.plane, hit)) return;
      // also try the height of canopies and gates, so clicking the umbrella itself works
      const hit2 = new T.Vector3(); this.ray.ray.intersectPlane(new T.Plane(new T.Vector3(0, 1, 0), -CANOPY_Y), hit2);
      let best = null, bd = 1e9;
      this.targets().forEach(t => { [hit, hit2].forEach((h, hi) => { if (hi === 1 && t.kind !== 'umb') return; const d = Math.hypot(h.x - t.x, h.z - t.z); if (d < t.r * (hi ? 2 : 1) && d < bd) { bd = d; best = t; } }); });
      if (!best) { SND.step(env.bus, { gain: 0.04, f: 1200 }); return; }
      if (this.queue.length >= 5) { SND.sing(env.bus, 174.61, { vowel: 'u', dur: 0.5, gain: 0.02 }); return; }
      if (this.queue.some(q => q.o === best.o && q.kind === best.kind && best.kind !== 'sup')) return;
      this.queue.push(best); SND.knock(env.bus, { f: 600 + this.queue.length * 80, gain: 0.04, click: 4200 });
    },
    // the light arrives and does the task
    perform(env, t) {
      const w = this.w;
      if (t.kind === 'umb') { const u = t.o; u.want = u.want ? 0 : 1; SND.swell(env.bus, { f0: u.want ? 140 : 300, f1: u.want ? 320 : 140, dur: 1.8, gain: 0.04 }); if (!u.want && this.part === 2 && this.dusk) { this.folded++; this.tick(); } }
      if (t.kind === 'sup') { this.carry = 2; SND.drop(env.bus, { f: 500, gain: 0.05 }); SND.drop(env.bus, { f: 700, gain: 0.04 }); }
      if (t.kind === 'cool') { const c = t.o; if (this.carry > 0 && c.level < 0.95) { this.carry--; const was = c.level; c.level = Math.min(1, c.level + 0.6); SND.sing(env.bus, NOTES[c.k % 6], { vowel: 'o', dur: 1.2, gain: 0.035 }); SND.drop(env.bus, { f: 400, gain: 0.05 }); if (was < 0.35 && this.part < 2) { this.refills++; this.tick(); } } else SND.sing(env.bus, 174.61, { vowel: 'u', dur: 0.6, gain: 0.02 }); }
      if (t.kind === 'gate') { const g = t.o; if (this.prayer && !g.want) { g.want = 1; SND.knock(env.bus, { f: 90, gain: 0.1, click: 600 }); SND.sing(env.bus, NOTES[GATES.indexOf(GATES.find(x => x.x === g.x))] / 2, { vowel: 'a', dur: 2, gain: 0.04 }); this.tick(); } }
      if (t.kind === 'lamp') { const l = t.o; if (this.dusk && !l.on) { l.on = 1; this.lit++; SND.sing(env.bus, NOTES[l.k % 6] * (l.k > 8 ? 1.5 : 1), { vowel: 'a', dur: 1.4, gain: 0.03 }); this.tick(); } }
      if (t.kind === 'disc') { const d = t.o; d.done = true; d.onUse(w, d); }
    },
    tick() {
      const k = this.part;
      if (k === 0) this.n = Math.min(5, this.shadedOnce.size) + Math.min(2, this.refills);
      if (k === 1) this.n = Math.min(3, this.refills) + this.gates.filter(g => g.want).length;
      if (k === 2) this.n = this.dusk ? Math.min(this.foldNeed, this.folded) + this.lit + this.gates.filter(g => g.want).length : Math.min(6, this.groups.filter(g => g.shaded && g.arrive >= 1 && !g.leave).length);
      this.w.progress(this.n);
    },
    nextPart(env, k) {
      this.busy = 1; this.veil.innerHTML = `<div><div style="font-size:15px;opacity:.7;letter-spacing:.3em">${['NOON', 'AFTERNOON'][k - 1]}</div><div style="margin-top:8px">${['The heat of the day', 'The sun goes west'][k - 1]}</div></div>`;
      this.veil.style.opacity = 1;
      setTimeout(() => { if (!this.w) return; this.groups.forEach(g => { g.leave = Math.max(g.leave, 0.01); }); this.begin(k); setTimeout(() => { if (!this.w) return; this.veil.style.opacity = 0; this.busy = 0; }, 1500); }, 1300);
    },
    finish(env) {
      const w = this.w; this.part = 3; this.done = true; w.goal(null);
      SND.glow(env.bus, 146.83, { gain: 0.08, dur: 10 }); SND.glow(env.bus, 220, { gain: 0.06, dur: 10, delay: 1 }); SND.glow(env.bus, 293.66, { gain: 0.05, dur: 10, delay: 2 });
      this.setSky('qwantani_night_puresky', 20);
      setTimeout(() => { if (!this.w) return; w.say('The City of Light', 'The lamps are lit and the gates stand open. Through the night the courtyards stay bright, and in the morning the umbrellas open again.', { ms: 12000 }); w.finish('A day in the courtyard, ending in lamplight'); }, 3000);
    },
    animUmb(dt) { let d = false; this.umb.forEach(u => { const v = U.damp(u.open, u.want, 1.6, dt); if (Math.abs(v - u.open) > 1e-4) { u.open = Math.abs(v - u.want) < 0.004 ? u.want : v; d = true; } }); if (d) this.updCanopy(); },
    updCanopy() { const a = this.canopy.geometry.attributes.aOpen; this.umb.forEach((u, k) => { a.array[k] = u.open; }); a.needsUpdate = true; },
    wheel(env, dy) { this.zoom = U.clamp(this.zoom + dy * 0.001, 0.55, 1.5); },

    play(env, dt) {
      const w = this.w, cam = w.camera;
      // the light hurries to the first task in the queue
      const t = this.queue[0];
      if (t && !this.busy) {
        const dx = t.x - this.mePos.x, dz = t.z - this.mePos.z, d = Math.hypot(dx, dz), sp = 22;
        const stop = t.kind === 'umb' ? 1.6 : t.kind === 'gate' ? 0.5 : 2.2;
        if (d > stop) { this.mePos.x += dx / d * Math.min(d - stop + 0.01, sp * dt); this.mePos.z += dz / d * Math.min(d - stop + 0.01, sp * dt); if (Math.random() < dt * 9) SND.step(env.bus, { gain: 0.03, f: U.rnd(1400, 2200) }); }
        else { this.queue.shift(); this.perform(env, t); }
      }
      this.me.position.set(this.mePos.x, 1.6 + Math.sin(w.time * 3) * 0.1, this.mePos.z); this.meCore.position.copy(this.me.position);
      this.jugs.forEach((j, k) => { j.visible = this.carry > k; j.position.set(this.mePos.x + (k ? 0.7 : -0.7), 1.2, this.mePos.z); });
      w.pos.set(this.mePos.x, 0, this.mePos.z);
      // markers on the queued tasks
      this.marks.forEach((m, k) => { const q = this.queue[k]; m.material.opacity = q ? 0.75 - k * 0.1 : 0; if (q) { m.position.set(q.x, 0.08, q.z); m.scale.setScalar(q.kind === 'umb' ? 1.4 : 1); } });
      // camera: high and far, at the diagonal, like a restaurant floor seen from above
      const zx = this.mePos.x * 0.55, zz = this.mePos.z * 0.55 + 4, Z = this.zoom;
      const want = new T.Vector3(zx + 70 * Z, 95 * Z, zz + 105 * Z);
      if (!this.camInit) { cam.position.copy(want); this.camInit = true; }
      cam.position.lerp(want, 1 - Math.exp(-dt * 3)); cam.lookAt(cam.position.x - 70 * Z, 0, cam.position.z - 105 * Z);
      if (cam.fov !== 30) { cam.fov = 30; cam.updateProjectionMatrix(); }
      if (w._shadow) { const L = w._shadow.light, px = Math.round(zx / 2) * 2, pz = Math.round(zz / 2) * 2; L.target.position.set(px, 0, pz); L.position.set(px + w._shadow.off.x, w._shadow.off.y, pz + w._shadow.off.z); }
      // HUD
      const hh = Math.floor(this.hour), mm = Math.floor((this.hour - hh) * 60 / 5) * 5;
      this.clockEl.innerHTML = `${PARTS[Math.min(2, this.part)] ? PARTS[Math.min(2, this.part)].id.toUpperCase() : 'NIGHT'} · ${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}<br><span style="opacity:.75;font-size:12px">${this.prayer ? '◆ The call to prayer: open the gates' : this.dusk ? '◆ Sunset: fold, light, open' : 'The courtyard of the Prophet’s Mosque'}</span>`;
      this.queueEl.innerHTML = this.queue.map((q, k) => `<span style="padding:4px 9px;border-radius:8px;background:rgba(6,9,20,${k ? 0.5 : 0.75});border:1px solid rgba(255,240,210,${k ? 0.2 : 0.6});color:#f4ead8;font:500 12px Marcellus,Georgia,serif">${k + 1} · ${q.label}</span>`).join('') || '<span style="padding:4px 9px;border-radius:8px;background:rgba(6,9,20,.4);color:#c8c0b4;font:500 12px Marcellus,Georgia,serif">Click a task</span>';
      this.carryEl.textContent = this.carry ? `Carrying ${this.carry} water` : 'Hands free';
    },

    update(env, dt) {
      const w = this.w; if (!w) return;
      w.update(dt);
      const film = !!w.filmS, k = this.part;
      if (film) [this.clockEl, this.queueEl, this.carryEl].forEach(e => { e.style.opacity = 0; });
      this.animUmb(dt);
      // the day moves on
      if (!film && k >= 0 && k < 3 && !this.busy) {
        const P = PARTS[k]; this.partT += dt; this.hour = Math.min(P.h1, P.h0 + (P.h1 - P.h0) * this.partT / P.secs);
        if (k === 1 && !this.prayer && this.hour > 12.3 && !this.prayed) { this.prayer = 1; this.prayed = 1; SND.glow(env.bus, 220, { gain: 0.05, dur: 6 }); SND.sing(env.bus, 440, { vowel: 'a', dur: 4, gain: 0.03 }); w.goal([GATES[1].x, 4, FACADE_Z + 3]); }
        if (k === 2 && !this.dusk && this.hour > 18.1) { this.dusk = 1; this.prayer = 1; this.gates.forEach(g => { g.want = 0; }); this.foldNeed = Math.max(1, this.umb.filter(u => u.want).length); this.need = 4 + this.foldNeed + LAMPS.length; SND.glow(env.bus, 196, { gain: 0.06, dur: 6 }); w.activity('Part 3 of 3 · Sunset', this.need, 'Fold the open umbrellas, light the lamps round the courtyard, open the four gates'); this.tick(); }
        if (k === 2 && !this.dusk && Math.random() < dt * 2) this.tick();
        // spawn new arrivals
        this.spawnT -= dt; const cap = [6, 9, 10][k];
        if (this.spawnT <= 0 && this.groups.filter(g => !g.leave).length < cap && !this.dusk) { this.spawnT = [7, 6, 8][k]; this.spawn(); }
        // part ends when its work is done and its time has run
        if (k === 0 && this.n >= this.need && this.partT > 25) this.nextPart(env, 1);
        if (k === 1 && this.n >= this.need && this.hour > 12.6) { this.prayer = 0; this.nextPart(env, 2); }
        if (k === 1 && this.hour >= P.h1 && this.n < this.need) this.hour = P.h1 - 0.01;
        if (k === 0 && this.hour >= P.h1 && this.n < this.need) this.hour = P.h1 - 0.01;
        if (k === 2 && this.hour >= 18.1) this.hour = Math.min(this.hour, 19.4);
        if (k === 2 && this.dusk && this.n >= this.need) this.finish(env);
      }
      // the sun and the light follow the clock
      const sd = sunAt(this.hour), el = sd.y;
      if (w._shadow) w._shadow.off.copy(sd).multiplyScalar(150);
      if (this.post && this.post.rays) this.post.rays.dir = sd.toArray();
      const dayK = U.smooth(-0.02, 0.25, el);
      const nightK0 = this.done ? 1 : this.dusk ? U.smooth(18.1, 19.4, this.hour) : 0;
      this.sun.intensity = (0.2 + 1.2 * dayK) * (1 - nightK0 * 0.85); this.sun.color.setHSL(nightK0 > 0.5 ? 0.6 : 0.09, 0.6 - 0.45 * dayK, 0.6 + 0.3 * dayK);
      // the sky's light fades with the day (applied in steps: it walks every material)
      const envK = U.lerp(0.5, 0.08, nightK0) * (0.45 + 0.55 * dayK + nightK0 * 0.55); if (Math.abs(envK - (this.envK || 0)) > 0.04) { this.envK = envK; PHOTO.envIntensity(w, envK); }
      this.hemi.intensity = (PHOTO.enabled ? 0.12 : 0.6) * (1 - nightK0 * 0.7);
      const nightK = this.done ? 1 : this.dusk ? U.smooth(18.1, 19.4, this.hour) : 0;
      this.night.forEach(L => { L.intensity = nightK * 1.6; });
      this.cityMat.emissiveIntensity = nightK * 0.9; this.memM.emissiveIntensity = nightK * 0.0;
      this.umbLamps.visible = nightK > 0.3;
      w.renderer.toneMappingExposure = 0.78 + nightK * 0.3;
      // umbrellas glow while they wait to be opened over someone in the sun
      // groups: arrive, warm in the sun, cool in the shade, drink, and at prayer go in through the gates
      const lm = this.lightM, hm = this.haloM, m4 = new T.Matrix4(), c = new T.Color(), q = new T.Quaternion();
      let li = 0;
      this.groups.forEach(g => {
        g.t += dt; g.arrive = Math.min(1, g.arrive + dt / 2.5);
        g.shaded = this.shadeAt(g.x, g.z);
        if (!g.leave && k >= 0 && !film) {
          g.heat = U.clamp(g.heat + (g.shaded ? -0.12 : 0.03 * (0.4 + Math.max(0, sd.y))) * dt);
          if (g.shaded && this.shadedOnce && !this.shadedOnce.has(g) && k === 0 && g.arrive >= 1) { this.shadedOnce.add(g); SND.sing(env.bus, NOTES[this.shadedOnce.size % 6], { vowel: 'a', dur: 1.5, gain: 0.03 }); this.tick(); }
          // too warm: they rise and drift toward the nearest shade, unhurried
          if (g.heat >= 1) { const sp = this.spots.filter(s => this.shadeAt(s.x, s.z) && !this.groups.some(o => o !== g && Math.hypot(o.x - s.x, o.z - s.z) < 6)).sort((a, b) => Math.hypot(a.x - g.x, a.z - g.z) - Math.hypot(b.x - g.x, b.z - g.z))[0]; if (sp) { g.moveTo = sp; g.heat = 0.6; } }
          if (g.moveTo) { const dx = g.moveTo.x - g.x, dz = g.moveTo.z - g.z, d = Math.hypot(dx, dz); if (d < 0.3) g.moveTo = null; else { const st = Math.min(d, 3 * dt); g.x += dx / d * st; g.z += dz / d * st; g.rug.forEach(r => { r.position.x += dx / d * st; r.position.z += dz / d * st; }); } }
          // a drink from the nearest cooler
          const cl = this.coolers.reduce((a, b) => (Math.hypot(b.x - g.x, b.z - g.z) < Math.hypot(a.x - g.x, a.z - g.z) ? b : a));
          cl.level = Math.max(0, cl.level - cl.drain * dt * (g.shaded ? 1 : 1.5));
          // the prayer: open gates draw them in
          if (this.prayer && this.gates.some(gt => gt.want) && Math.random() < dt * 0.4) g.leave = 0.01;
        }
        if (g.leave) {
          g.leave += dt / 7;
          const gt = this.gates.filter(o => o.want).sort((a, b) => Math.abs(a.x - g.x) - Math.abs(b.x - g.x))[0] || this.gates[1];
          g.gx = gt.x; g.gz = FACADE_Z + 1;
        }
        const tint = c.setRGB(1, 1 - g.heat * 0.45, 1 - g.heat * 0.85);
        for (let i = 0; i < g.n && li < 400; i++) {
          const a = i / g.n * Math.PI * 2 + (g.moveTo ? w.time : 0) * 0.3, r = 1.6;
          let x = g.x + Math.cos(a) * r, z = g.z + Math.sin(a) * r, y = 0.75 + Math.sin(w.time * 1.3 + i) * 0.04;
          if (g.leave) { const kk = U.ease(Math.min(1, g.leave)); x = U.lerp(x, g.gx + (i - g.n / 2) * 0.5, kk); z = U.lerp(z, g.gz, kk); y += kk * 0.6; }
          const s = g.arrive * (g.leave > 0.95 ? Math.max(0, (1.05 - g.leave) * 10) : 1);
          m4.compose(new T.Vector3(x, y, z), q, new T.Vector3(s, s, s)); lm.setMatrixAt(li, m4); lm.setColorAt(li, tint);
          m4.compose(new T.Vector3(x, y, z), w.camera.quaternion, new T.Vector3(2.6 * s, 2.6 * s, 2.6 * s)); hm.setMatrixAt(li, m4); hm.setColorAt(li, c.clone().multiplyScalar(0.45));
          li++;
        }
        g.rug.forEach(r => { r.visible = !g.leave || g.leave < 0.4; });
      });
      this.groups = this.groups.filter(g => { if (g.leave >= 1) { g.rug.forEach(r => { w.scene.remove(r); }); return false; } return true; });
      lm.count = hm.count = li; lm.instanceMatrix.needsUpdate = hm.instanceMatrix.needsUpdate = true; if (lm.instanceColor) lm.instanceColor.needsUpdate = true; if (hm.instanceColor) hm.instanceColor.needsUpdate = true;
      // coolers show their level; an empty one calls softly in blue
      this.coolers.forEach(cl => { cl.ring.geometry.dispose(); cl.ring.geometry = new T.RingGeometry(1.7, 1.95, 40, 1, Math.PI / 2, Math.PI * 2 * Math.max(0.01, cl.level)).rotateX(-Math.PI / 2); cl.ring.material.color.setHSL(0.56, 0.7, 0.45 + 0.25 * cl.level); cl.need.material.opacity = U.damp(cl.need.material.opacity, cl.level < 0.3 && k >= 0 && k < 3 ? 0.55 + 0.2 * Math.sin(w.time * 4) : 0, 4, dt); });
      this.supGlow.material.opacity = U.damp(this.supGlow.material.opacity, !this.carry && this.coolers.some(c2 => c2.level < 0.3) && k >= 0 && k < 3 ? 0.5 : 0, 3, dt);
      // gates open; lamps glow
      this.gates.forEach(g => { g.open = U.damp(g.open, g.want, 1.5, dt); g.piv.forEach(p => { p.rotation.y = p.userData.s * g.open * 1.4; }); g.glow.material.opacity = U.damp(g.glow.material.opacity, (this.prayer && !g.want ? 0.6 + 0.2 * Math.sin(w.time * 3) : 0) + g.open * nightK * 0.6, 3, dt); });
      this.lamps.forEach(l => { l.g.material.opacity = U.damp(l.g.material.opacity, l.on ? 0.95 : (this.dusk && k === 2 ? 0.18 + 0.1 * Math.sin(w.time * 3 + l.k) : 0), 4, dt); });
      // sound: the crowd grows with the groups; murmurs; doves
      this.snd.crowd.set('gain', Math.min(0.05, this.groups.length * 0.004), 1);
      this.murT -= dt; if (this.murT < 0) { this.murT = U.rnd(3, 7); SND.sing(env.bus, U.pick([110, 130.81, 146.83]), { vowel: 'u', dur: 2.5, gain: 0.008, pan: U.rnd(-0.9, 0.9) }); if (Math.random() < 0.5) SND.coo(env.bus, { gain: 0.025 }); }
    },
  }));
})();
