/* Station — The Sky Beneath the Domes. A light-and-mirror puzzle (The Witness / Portal lasers).
   Feeling: awe, then the quiet satisfaction of an idea that clicks.
   The prayer hall of the Prophet's Mosque today: a forest of marble columns with brass capitals,
   arcades, a coffered ceiling and, overhead, domes that roll aside on rails. Roll a dome open and
   the sun falls through it onto a brass sun-catcher; turn brass mirrors and crystal prisms to carry
   that beam through the columns to the lamps. Three courts, each harder: one beam; a beam split in
   two around a screen of Qur'an shelves; and two domes whose light, split three times, must reach
   the great star in the floor from all four sides. Then the central dome opens over the star.
   Colour script: cream marble and red carpet; sunlight gold is the accent, kept for the beams.
   The puzzle is a game's abstraction: the mosque has no such mirrors. */
(function () {
  'use strict';
  if (!window.WORLD) return;
  const T = THREE;

  /* ---------------- the grid: 16 x 16 cells of 6 m; columns stand on the grid lines ---------------- */
  const N = 16, C = 6, HALF = 48, CEIL = 12.5, ROOF = 13.2, BEAM_Y = 1.3, SPRING = 7.0;
  const cx = i => -HALF + C / 2 + i * C, cz = j => -HALF + C / 2 + j * C;
  const DIRS = [[0, -1], [1, 0], [0, 1], [-1, 0]];         // N E S W in cells (N is -z)
  // the sun stands due north at 43 degrees, so the light of a dome falls two cells south of its centre
  const SUN = new T.Vector3(0, 0.683, -0.730).normalize();
  const SKY_ROT = -Math.PI / 2 - 0.629;                      // turns kloofendal_43d's sun to the north
  // puzzles: '#' shelves (blocks light), 'n','e' sun-catchers (fixed), 'M' mirror, 'P' prism, 'T' lamp, 'C' the star
  const PUZ = [
    { ox: 0, oy: 9, title: 'Part 1 of 3 · One beam', step: 'Roll the dome open at the brass panel, then turn the mirrors (E) to send the light to the lamp',
      rows: ['######', 'T..M.#', '.....#', '.....#', '.e.M.#', '......'], init: { '3,1': 2, '3,4': 1 } },
    { ox: 9, oy: 9, title: 'Part 2 of 3 · The prism', step: 'A crystal prism sends light two ways at once: light both lamps together',
      rows: ['#######', '.T.M.M.', '.......', '.M.P...', '##....#', '...M...', '...n.T.'], init: { '3,1': 0, '5,1': 3, '1,3': 1, '3,3': 0, '3,5': 1 } },
    { ox: 3, oy: 0, title: 'Part 3 of 3 · The star', step: 'Open both domes; the star in the floor must receive light from all four sides',
      rows: ['.........', '.M..P..M.', '..#...#..', '.........', '.M..C..P.', '.........', '..#...#..', '.M..P..M.', '.n.....n.'], init: { '1,1': 0, '4,1': 1, '7,1': 2, '1,4': 0, '7,4': 1, '1,7': 3, '4,7': 2, '7,7': 3 } },
  ];
  const NOTES = [293.66, 329.63, 369.99, 392, 440, 493.88, 554.37, 587.33];

  const SHAFT_VERT = `varying vec2 vUv; varying float vY; void main(){ vUv = uv; vec4 wp = modelMatrix*vec4(position,1.); vY = wp.y; gl_Position = projectionMatrix*viewMatrix*wp; }`;
  const SHAFT_FRAG = `uniform float uOp; uniform float uTime; varying vec2 vUv; varying float vY;
    void main(){ float e = smoothstep(0., 0.22, vUv.x) * smoothstep(1., 0.78, vUv.x);
      float a = uOp * e * (0.35 + 0.65 * smoothstep(0., 9., vY)) * (0.75 + 0.25 * sin(vUv.x * 23. + uTime * 0.3) * sin(vUv.y * 7. - uTime * 0.2));
      gl_FragColor = vec4(vec3(1.0, 0.92, 0.76) * a * 0.16, 1.0); }`;

  function el(parent, css, html) { const d = document.createElement('div'); d.style.cssText = css; if (html != null) d.innerHTML = html; parent.appendChild(d); return d; }

  ENGINE.register(WORLD.stage({
    key: 'domes',
    arabic: 'المسجد النبوي',
    title: 'The Sky Beneath the Domes',
    era: 'The Prophet’s Mosque today',
    hint: 'WASD walk · E or click turns a mirror (Q turns it back) · roll domes open at the brass panels',
    hintTouch: 'Left thumb to walk · right thumb to look · tap E to turn a mirror or roll a dome',
    sound: { reverb: 0.7 },
    story: `<p>The first mosque of Madinah was built of mud brick, with palm-trunk pillars and a roof of palm leaves (Sahih al-Bukhari 446). It has been rebuilt and enlarged many times since.</p>
            <p>The great expansion completed in the early 1990s gave its roof 27 domes that slide on rails, each about eighteen metres square, so the halls beneath can be opened to the sky.</p>
            <p>Roll a dome aside and carry its sunlight through the hall: turn brass mirrors and crystal prisms until every lamp is lit, and the star in the floor receives the light from all four sides.</p>`,

    enter(env) {
      const self = this;
      const w = this.w = WORLD.create(env, { start: { x: -24, z: 45, yaw: 0.35, pitch: 0.05 }, exposure: 0.95, far: 1600, fog: { color: 0xd8d0c4, density: 0.0011 }, bounds: [-HALF + 0.8, -HALF + 0.8, HALF - 0.8, HALF - 0.8] });
      const S = w.scene, R = U.seeded(1992); this.spinesM = null; this.solving = -1;
      w.surface = () => 'marble';
      this.phase = -1; this.lit = 0; this.done = false;

      /* ---------- sky and light ---------- */
      w.sky({ top: '#5a8ccc', mid: '#e8e4dc', bot: '#d8d0c4', sunDir: SUN.toArray(), sun: '#fff2d8', sunSize: 0.0016, clouds: 0.2, haze: 0.35 });
      const sun = this.sun = new T.DirectionalLight(0xfff2de, 2.0); sun.position.copy(SUN).multiplyScalar(90); S.add(sun);
      S.add(new T.HemisphereLight(0xfff0dc, 0x6a3a2a, PHOTO.enabled ? 0.14 : 0.45));
      w.followShadow(sun, 42, 2048); sun.shadow.bias = -0.0004;
      PHOTO.sky(w, 'kloofendal_43d_clear_puresky', { sun, rotation: SKY_ROT, intensity: 0.45, haze: '#d8d0c4', horizon: 0.4, ground: '#d8d0c4', bounce: 0.6 });
      this.post = w.post({ bloom: 0.55, threshold: 0.8, rays: { strength: 0.25, dir: SUN.toArray() }, vignette: 0.35, grain: 0.025, lift: [0.01, 0.008, 0.0], gain: [1.02, 1.0, 0.97] });
      // warm lamps near the courts
      this.lamps = [[-33, 7, 30], [27, 7, 30], [-3, 7, -21], [-3, 7, 9]].map(p => { const L = new T.PointLight(0xffd6a0, 0.9, 34, 2); L.position.set(...p); S.add(L); return L; });

      /* ---------- materials ---------- */
      const M = {
        marble: PHOTO.mat(w, 'marble_01', { triplanar: 0.33, color: 0xf4efe6, rough: 0.5, fallback: KIT.plaster(w, [2, 2], '#eee8dc') }),
        floor: PHOTO.mat(w, 'marble_01', { rep: [24, 24], color: 0xf2ede4, rough: 0.35, fallback: KIT.plaster(w, [24, 24], '#eee8dc') }),
        stone: PHOTO.mat(w, 'plastered_stone_wall', { triplanar: 0.25, color: 0xf0e6d6, fallback: KIT.plaster(w, [2, 2], '#e8dcc8') }),
        brass: new T.MeshStandardMaterial({ color: 0xd8b060, metalness: 1, roughness: 0.28 }),
        brassDark: new T.MeshStandardMaterial({ color: 0x8a6a30, metalness: 0.9, roughness: 0.45 }),
        wood: PHOTO.mat(w, 'old_planks_02', { rep: [1, 1], color: 0x7a5232, fallback: KIT.wood(w, [1, 1], '#5a3a20') }),
        mirror: new T.MeshStandardMaterial({ color: 0xf4f0e8, metalness: 1, roughness: 0.04 }),
      };
      // the carpet: deep red with a fine border and the lines of the prayer rows
      const carpetT = w.tex(512, (g, s) => {
        g.fillStyle = '#7a1418'; g.fillRect(0, 0, s, s);
        for (let i = 0; i < 9000; i++) { g.fillStyle = Math.random() < 0.5 ? 'rgba(40,4,6,0.25)' : 'rgba(170,40,40,0.18)'; g.fillRect(Math.random() * s, Math.random() * s, 2, 2); }
        g.strokeStyle = 'rgba(214,170,96,0.75)'; g.lineWidth = 6; g.strokeRect(14, 14, s - 28, s - 28);
        g.strokeStyle = 'rgba(30,60,50,0.6)'; g.lineWidth = 3; g.strokeRect(26, 26, s - 52, s - 52);
        for (let y = 0; y < 5; y++) { const yy = 40 + y * (s - 80) / 4.6; g.fillStyle = 'rgba(214,170,96,0.35)'; g.fillRect(30, yy, s - 60, 3); for (let x = 50; x < s - 40; x += 56) { g.save(); g.translate(x, yy + 24); g.fillStyle = 'rgba(214,170,96,0.22)'; U.star8(g, 0, 0, 12, 0.6); g.fill(); g.restore(); } }
      });
      M.carpet = new T.MeshStandardMaterial({ map: carpetT, roughness: 0.95 });
      // the coffered ceiling: cream panels, gilded star-and-cross, a band of turquoise
      const ceilT = w.tex(512, (g, s) => {
        g.fillStyle = '#efe6d2'; g.fillRect(0, 0, s, s);
        g.strokeStyle = '#b89048'; g.lineWidth = 10; g.strokeRect(5, 5, s - 10, s - 10);
        g.strokeStyle = '#3a7a78'; g.lineWidth = 4; g.strokeRect(22, 22, s - 44, s - 44);
        g.save(); g.translate(s / 2, s / 2);
        for (let r = 0; r < 3; r++) { g.strokeStyle = r === 1 ? '#3a7a78' : '#c8a050'; g.lineWidth = 6 - r; U.star8(g, 0, 0, 190 - r * 50, 0.72, Math.PI / 8); g.stroke(); }
        g.fillStyle = '#c8a050'; U.star8(g, 0, 0, 34, 0.6); g.fill(); g.restore();
        for (let k = 0; k < 4; k++) { g.save(); g.translate(k % 2 ? s - 62 : 62, k < 2 ? 62 : s - 62); g.fillStyle = '#c8a050'; U.star8(g, 0, 0, 22, 0.6); g.fill(); g.restore(); }
      });
      M.ceil = new T.MeshStandardMaterial({ map: ceilT, roughness: 0.7, side: T.DoubleSide });
      // the inside of a dome: rings of gilded rosettes on ivory and turquoise
      const domeT = w.tex(1024, (g, s) => {
        g.fillStyle = '#f0e8d6'; g.fillRect(0, 0, s, s);
        const bands = [[0, 0.12, '#c8a050'], [0.12, 0.2, '#2e6e6a'], [0.42, 0.47, '#c8a050'], [0.47, 0.52, '#2e6e6a'], [0.78, 0.82, '#c8a050'], [0.94, 1, '#b08a40']];
        bands.forEach(([a, b, c]) => { g.fillStyle = c; g.fillRect(0, a * s, s, (b - a) * s); });
        for (let k = 0; k < 24; k++) { const x = (k + 0.5) / 24 * s; g.save(); g.translate(x, 0.31 * s); g.strokeStyle = '#b89048'; g.lineWidth = 3; U.star8(g, 0, 0, 18, 0.6); g.stroke(); g.restore(); g.save(); g.translate(x, 0.65 * s); g.fillStyle = '#c8a050'; U.star8(g, 0, 0, 14, 0.55); g.fill(); g.restore(); }
        for (let k = 0; k < 48; k++) { const x = (k + 0.5) / 48 * s; g.strokeStyle = 'rgba(184,144,72,0.5)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x, 0.2 * s); g.lineTo(x, 0.42 * s); g.stroke(); }
      });
      M.domeIn = new T.MeshStandardMaterial({ map: domeT, roughness: 0.6, side: T.BackSide });
      M.domeOut = PHOTO.mat(w, 'marble_01', { triplanar: 0.15, color: 0xd8dade, rough: 0.45, fallback: KIT.plaster(w, [6, 6], '#d8dade') });

      /* ---------- the floor, the plaza and the city around ---------- */
      const ter = SCAPE.terrain(w, { size: 1800, seg: 120, height: (x, z) => U.smooth(600, 850, Math.hypot(x, z)) * (SCAPE.ridge(x * 0.003, z * 0.003, 4) * 120) - 0.02,
        colors: { low: '#ece6dc', high: '#e4ddd2', rock: '#8a7466', dark: '#6a5a50' }, tex: 'gravel', photo: { ground: 'marble_01', rock: 'rock_face_03', normal: 0.5 }, rep: 0.2, rockRep: 0.03 });
      w.ground = () => 0;
      SCAPE.horizon(w, { haze: '#d8d0c4', layers: [{ r: 1100, h: 70, color: '#8a6c5a', seed: 4 }, { r: 1400, h: 120, color: '#a08a7c', seed: 9 }] });
      const fl = new T.Mesh(new T.PlaneGeometry(HALF * 2, HALF * 2).rotateX(-Math.PI / 2), M.floor); fl.position.y = 0.01; fl.receiveShadow = true; S.add(fl);
      // carpets in every bay, leaving marble aisles along the columns
      const cg = new T.PlaneGeometry(C - 1.2, C - 1.2).rotateX(-Math.PI / 2);
      const carpets = new T.InstancedMesh(cg, M.carpet, N * N), m4 = new T.Matrix4();
      for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) { m4.makeTranslation(cx(i), 0.025, cz(j)); carpets.setMatrixAt(i * N + j, m4); }
      carpets.receiveShadow = true; S.add(carpets);

      /* ---------- domes: four that open, the rest closed, all on rails on the roof ---------- */
      const foot = (ci, cj) => { const a = []; for (let i = ci - 1; i <= ci + 1; i++) for (let j = cj - 1; j <= cj + 1; j++) a.push(i + ',' + j); return a; };
      // functional domes: centred two cells north of each sun-catcher; they slide by three cells onto solid roof
      this.domes = [
        { ci: 1, cj: 11, slide: [0, -1], puz: 0 }, { ci: 12, cj: 13, slide: [-1, 0], puz: 1 },
        { ci: 4, cj: 6, slide: [0, 1], puz: 2 }, { ci: 10, cj: 6, slide: [0, 1], puz: 2 }, { ci: 7, cj: 2, slide: [1, 0], puz: 3 },
      ];
      const taken = new Set();
      this.domes.forEach(d => { foot(d.ci, d.cj).forEach(k => taken.add(k)); foot(d.ci + d.slide[0] * 3, d.cj + d.slide[1] * 3).forEach(k => taken.add('s' + k)); });
      const deco = [];
      for (let a = 0; a < 5; a++) for (let b = 0; b < 5; b++) {
        const ci = 1 + a * 3, cj = 1 + b * 3, f = foot(ci, cj);
        if (f.some(k => taken.has(k) || taken.has('s' + k))) continue;
        deco.push({ ci, cj }); f.forEach(k => taken.add(k));
      }
      // ceiling and roof over every cell that has no dome
      const tiles = []; for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) if (!taken.has(i + ',' + j)) tiles.push([i, j]);
      const ceil = new T.InstancedMesh(new T.PlaneGeometry(C, C).rotateX(Math.PI / 2), M.ceil, tiles.length);
      const roof = new T.InstancedMesh(new T.BoxGeometry(C, ROOF - CEIL, C), M.marble, tiles.length);
      tiles.forEach(([i, j], k) => { m4.makeTranslation(cx(i), CEIL, cz(j)); ceil.setMatrixAt(k, m4); m4.makeTranslation(cx(i), (CEIL + ROOF) / 2 + 0.01, cz(j)); roof.setMatrixAt(k, m4); });
      ceil.receiveShadow = true; roof.castShadow = true; roof.receiveShadow = true; S.add(ceil); S.add(roof);
      // a dome: a square drum pierced with small lights, a lid, a shallow cap painted inside
      const Rd = 10.5, capH = 5.1, th = Math.asin(9 / Rd);
      const capG = new T.SphereGeometry(Rd, 40, 12, 0, Math.PI * 2, 0, th); capG.translate(0, ROOF + 1.2 + capH - Rd, 0);
      const drumG = (() => { const parts = []; [[18, 0.5, 0, 9], [18, 0.5, 0, -9], [0.5, 18, 9, 0], [0.5, 18, -9, 0]].forEach(([a, b, x, z]) => { const g = new T.BoxGeometry(a, ROOF + 1.2 - CEIL, b); g.translate(x, (ROOF + 1.2 + CEIL) / 2, z); parts.push(g); }); return SCAPE.merge(parts); })();
      const lidG = (() => { const sh = new T.Shape(); sh.moveTo(-9, -9); sh.lineTo(9, -9); sh.lineTo(9, 9); sh.lineTo(-9, 9); sh.lineTo(-9, -9); const hole = new T.Path(); hole.absarc(0, 0, 9, 0, Math.PI * 2, true); sh.holes.push(hole); const g = new T.ShapeGeometry(sh, 32); g.rotateX(-Math.PI / 2); g.translate(0, ROOF + 1.2, 0); return g; })();
      const finG = new T.CylinderGeometry(0.15, 0.35, 1.6, 8); finG.translate(0, ROOF + 1.2 + capH + 0.6, 0);
      const pierceT = w.tex(256, (g, s) => { g.fillStyle = '#e8e0d0'; g.fillRect(0, 0, s, s); g.fillStyle = '#b89048'; g.fillRect(0, s * 0.82, s, s * 0.08); for (let k = 0; k < 8; k++) { g.fillStyle = '#fff4d8'; g.beginPath(); g.arc((k + 0.5) / 8 * s, s * 0.45, 6, 0, 6.283); g.fill(); } }, [6, 1]);
      M.drum = new T.MeshStandardMaterial({ map: pierceT, emissive: 0xfff0d0, emissiveMap: pierceT, emissiveIntensity: 0.0, roughness: 0.7 });
      const decoParts = [[capG, M.domeOut], [capG, M.domeIn], [drumG, M.drum], [lidG, M.marble], [finG, M.brass]].map(([g, m]) => { const im = new T.InstancedMesh(g, m, deco.length); im.castShadow = im.receiveShadow = true; S.add(im); return im; });
      deco.forEach((d, k) => { m4.makeTranslation(cx(d.ci), 0, cz(d.cj)); decoParts.forEach(im => im.setMatrixAt(k, m4)); });
      // pierced lights in the drum of every closed dome, seen from the hall
      const pinG = new T.SphereGeometry(0.09, 6, 4), pins = [];
      deco.forEach(d => { for (let e = 0; e < 4; e++) for (let k = 0; k < 10; k++) { const t = (k + 0.5) / 10 * 18 - 9, ex = [t, 8.7, t, -8.7][e], ez = [8.7, t, -8.7, t][e]; pins.push([cx(d.ci) + (e % 2 ? ex : ex), CEIL + 0.65, cz(d.cj) + (e % 2 ? ez : ez)]); } });
      const pinM = new T.InstancedMesh(pinG, new T.MeshBasicMaterial({ color: 0xfff6e0 }), pins.length);
      pins.forEach((p, k) => { m4.makeTranslation(...p); pinM.setMatrixAt(k, m4); }); S.add(pinM);
      this.domes.forEach(d => {
        const g = new T.Group(); g.userData.dynamic = true; g.position.set(cx(d.ci), 0, cz(d.cj)); S.add(g);
        [[capG, M.domeOut], [capG, M.domeIn], [drumG, M.drum], [lidG, M.marble], [finG, M.brass]].forEach(([geo, mat]) => { const m = new T.Mesh(geo, mat); m.castShadow = m.receiveShadow = true; g.add(m); });
        d.g = g; d.t = 0; d.open = false; d.x0 = g.position.x; d.z0 = g.position.z;
        // the rails it rolls on
        for (const s of [-1, 1]) { const len = 36, rail = new T.Mesh(new T.BoxGeometry(d.slide[0] ? len : 0.25, 0.18, d.slide[0] ? 0.25 : len), M.brassDark); rail.position.set(cx(d.ci) + d.slide[0] * 9 + (d.slide[1] ? s * 7 : 0), ROOF + 0.09, cz(d.cj) + d.slide[1] * 9 + (d.slide[0] ? s * 7 : 0)); S.add(rail); }
        // the shaft of sunlight that falls through the opening
        const h = CEIL, shear = SUN.z / SUN.y;
        const sg = new T.BoxGeometry(17.4, h, 17.4, 1, 1, 1); sg.translate(0, h / 2, 0);
        const p = sg.attributes.position; for (let k = 0; k < p.count; k++) p.setZ(k, p.getZ(k) + (h - p.getY(k)) * -shear);
        const sm = new T.ShaderMaterial({ vertexShader: SHAFT_VERT, fragmentShader: SHAFT_FRAG, uniforms: { uOp: { value: 0 }, uTime: { value: 0 } }, transparent: true, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide });
        d.shaft = new T.Mesh(sg, sm); d.shaft.position.set(cx(d.ci), 0, cz(d.cj)); d.shaft.userData.dynamic = true; d.shaft.visible = false; d.shaft.renderOrder = 5; S.add(d.shaft);
      });

      /* ---------- columns with brass capitals, and the arcades between them ---------- */
      const cols = [];
      for (let a = 0; a <= N; a++) for (let b = 0; b <= N; b++) cols.push([-HALF + a * C, -HALF + b * C, a === 0 || b === 0 || a === N || b === N]);
      const inner = cols.filter(c => !c[2]);
      const baseG = new T.BoxGeometry(1.15, 1.3, 1.15); baseG.translate(0, 0.65, 0);
      const shaftG = new T.CylinderGeometry(0.4, 0.44, SPRING - 1.3 - 0.9, 18); shaftG.translate(0, 1.3 + (SPRING - 2.2) / 2, 0);
      const capG2 = new T.CylinderGeometry(0.72, 0.42, 0.9, 16); capG2.translate(0, SPRING - 0.45, 0);
      const ringG = new T.TorusGeometry(0.43, 0.06, 6, 18); ringG.rotateX(Math.PI / 2); ringG.translate(0, 1.4, 0);
      const ventT = w.tex(128, (g, s) => { g.fillStyle = '#efe8dc'; g.fillRect(0, 0, s, s); g.fillStyle = '#b8924a'; g.fillRect(14, 40, s - 28, 56); g.fillStyle = '#5a4020'; for (let x = 20; x < s - 18; x += 9) g.fillRect(x, 46, 4, 44); });
      const parts = [[baseG, new T.MeshStandardMaterial({ map: ventT, roughness: 0.4, metalness: 0.1 })], [shaftG, M.marble], [capG2, M.brass], [ringG, M.brass]];
      parts.forEach(([g, m]) => { const im = new T.InstancedMesh(g, m, inner.length); inner.forEach((c, k) => { m4.makeTranslation(c[0], 0, c[1]); im.setMatrixAt(k, m4); }); im.castShadow = im.receiveShadow = true; S.add(im); });
      inner.forEach(c => w.addCircle(c[0], c[1], 0.7));
      // arches: the spandrel of a pointed arch between two capitals, extruded
      const sh = new T.Shape(); sh.moveTo(-3, 0); sh.lineTo(-2.55, 0); sh.bezierCurveTo(-2.55, 2.0, -1.3, 3.2, 0, 3.75); sh.bezierCurveTo(1.3, 3.2, 2.55, 2.0, 2.55, 0); sh.lineTo(3, 0); sh.lineTo(3, CEIL - SPRING); sh.lineTo(-3, CEIL - SPRING); sh.lineTo(-3, 0);
      const archG = new T.ExtrudeGeometry(sh, { depth: 0.7, bevelEnabled: false, curveSegments: 10 }); archG.translate(0, SPRING, -0.35);
      const arches = [];
      for (let a = 0; a < N; a++) for (let b = 0; b <= N; b++) { arches.push([-HALF + (a + 0.5) * C, -HALF + b * C, 0]); arches.push([-HALF + b * C, -HALF + (a + 0.5) * C, Math.PI / 2]); }
      const archM = new T.InstancedMesh(archG, M.marble, arches.length), q = new T.Quaternion(), one = new T.Vector3(1, 1, 1);
      arches.forEach((a, k) => { archM.setMatrixAt(k, m4.compose(new T.Vector3(a[0], 0, a[1]), q.setFromEuler(new T.Euler(0, a[2], 0)), one)); });
      archM.castShadow = archM.receiveShadow = true; S.add(archM);
      // a gilded band along every arch
      const band = new T.Shape(); band.moveTo(-2.55, 0); band.bezierCurveTo(-2.55, 2.0, -1.3, 3.2, 0, 3.75); band.bezierCurveTo(1.3, 3.2, 2.55, 2.0, 2.55, 0); band.lineTo(2.35, 0); band.bezierCurveTo(2.35, 1.9, 1.2, 3.0, 0, 3.5); band.bezierCurveTo(-1.2, 3.0, -2.35, 1.9, -2.35, 0); band.lineTo(-2.55, 0);
      const bandG = new T.ExtrudeGeometry(band, { depth: 0.74, bevelEnabled: false, curveSegments: 10 }); bandG.translate(0, SPRING, -0.37);
      const bandM = new T.InstancedMesh(bandG, M.brass, arches.length); arches.forEach((a, k) => { archM.getMatrixAt(k, m4); bandM.setMatrixAt(k, m4); }); S.add(bandM);
      // brass lanterns hanging in the bays
      const lampG = (() => { const p = []; const body = new T.CylinderGeometry(0.35, 0.25, 0.9, 8); body.translate(0, -0.45, 0); p.push(body); const top = new T.ConeGeometry(0.42, 0.5, 8); top.translate(0, 0.2, 0); p.push(top); const ch = new T.CylinderGeometry(0.02, 0.02, 3.2, 4); ch.translate(0, 2.0, 0); p.push(ch); return SCAPE.merge(p); })();
      const lampPos = []; for (let i = 0; i < N; i += 2) for (let j = 1; j < N; j += 2) if (!taken.has(i + ',' + j)) lampPos.push([cx(i), CEIL - 3.6, cz(j)]);
      const lampM = new T.InstancedMesh(lampG, M.brass, lampPos.length); lampPos.forEach((p, k) => { m4.makeTranslation(...p); lampM.setMatrixAt(k, m4); }); S.add(lampM);
      const lampGlow = new T.InstancedMesh(new T.SphereGeometry(0.22, 8, 6), new T.MeshBasicMaterial({ color: 0xffe2a8 }), lampPos.length); lampPos.forEach((p, k) => { m4.makeTranslation(p[0], p[1] - 0.45, p[2]); lampGlow.setMatrixAt(k, m4); }); S.add(lampGlow);

      /* ---------- the outer walls, windows and doors ---------- */
      const winT = KIT.lattice(w, [3, 4]);
      const winM = new T.MeshStandardMaterial({ map: winT, alphaTest: 0.4, color: 0xc89a50, metalness: 0.6, roughness: 0.4, side: T.DoubleSide });
      const glassM = new T.MeshStandardMaterial({ color: 0xe8f0f4, emissive: 0xfff6e8, emissiveIntensity: 0.55, roughness: 0.2 });
      const box = (a, b, c, m, x, y, z) => { const o = new T.Mesh(new T.BoxGeometry(a, b, c), m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; S.add(o); return o; };
      for (const side of [0, 1, 2, 3]) {
        const along = side % 2 === 0, s = side < 2 ? -1 : 1;
        for (let k = 0; k < N; k++) {
          const t = -HALF + (k + 0.5) * C, x = along ? t : s * (HALF + 0.6), z = along ? s * (HALF + 0.6) : t;
          const door = side === 2 && (k === 3 || k === 7 || k === 8 || k === 12);
          const pier = (o) => box(along ? 1.2 : 1.2, ROOF, along ? 1.2 : 1.2, M.stone, x + (along ? o : 0), ROOF / 2, z + (along ? 0 : o));
          pier(-2.4); pier(2.4);
          box(along ? 3.6 : 1.2, ROOF - (door ? 6.5 : 8.2), along ? 1.2 : 1.2, M.stone, x, (door ? 6.5 : 8.2) + (ROOF - (door ? 6.5 : 8.2)) / 2, z);
          if (!door) {
            box(along ? 3.6 : 1.2, 1.4, along ? 1.2 : 1.2, M.stone, x, 0.7, z);
            const gl = new T.Mesh(new T.PlaneGeometry(3.6, 6.8), glassM); gl.position.set(x, 4.8, z); gl.rotation.y = along ? 0 : Math.PI / 2; S.add(gl);
            const lat = new T.Mesh(new T.PlaneGeometry(3.6, 6.8), winM); lat.position.set(x - (along ? 0 : s * 0.62), 4.8, z - (along ? s * 0.62 : 0)); lat.rotation.y = along ? 0 : Math.PI / 2; S.add(lat);
          } else {
            const dm = new T.Mesh(new T.PlaneGeometry(3.4, 6.4), M.brass); dm.position.set(x - 1.3, 3.2, z + 0.9); dm.rotation.y = -0.9; S.add(dm);
          }
        }
        // the walls are solid except at the doors, where the plaza is
        if (along) w.addBox(-HALF - 1.2, s * HALF - 0.6 + (s > 0 ? 0.6 : -0.6), HALF + 1.2, s * HALF + 0.6 + (s > 0 ? 0.6 : -0.6)); else w.addBox(s * HALF - 0.6 + (s > 0 ? 0.6 : -0.6), -HALF - 1.2, s * HALF + 0.6 + (s > 0 ? 0.6 : -0.6), HALF + 1.2);
      }
      // a parapet round the roof
      [[HALF * 2 + 2.4, 1.2, 0.6, 0, -HALF - 0.6], [HALF * 2 + 2.4, 1.2, 0.6, 0, HALF + 0.6], [0.6, 1.2, HALF * 2 + 2.4, -HALF - 0.6, 0], [0.6, 1.2, HALF * 2 + 2.4, HALF + 0.6, 0]].forEach(([a, b, c, x, z]) => box(a, b, c, M.stone, x, ROOF + 0.6, z));

      // minarets at the corners, and the older mosque to the south with the Green Dome
      const minM = PHOTO.mat(w, 'marble_01', { triplanar: 0.2, color: 0xf2ece2, fallback: KIT.plaster(w, [2, 8], '#eee6d8') });
      [[-HALF - 8, -HALF - 8], [HALF + 8, -HALF - 8], [-HALF - 8, HALF + 70], [HALF + 8, HALF + 70]].forEach(([x, z]) => { const m = KIT.minaret(w, 98, true); m.position.set(x, 0, z); m.traverse(o => { if (o.isMesh && o.material.color && o.material.color.getHex() === 0xe8e0d0) o.material = minM; }); S.add(m); });
      const old = box(110, ROOF - 1.5, 52, M.stone, 0, (ROOF - 1.5) / 2, HALF + 32);
      const gd = KIT.greenDome(w, 0.8); gd.position.set(22, ROOF - 1.5, HALF + 40); S.add(gd);
      for (let k = 0; k < 14; k++) { const d = new T.Mesh(new T.SphereGeometry(2.6, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), M.marble); d.position.set(-45 + (k % 7) * 9, ROOF - 1.5, HALF + 22 + Math.floor(k / 7) * 12); S.add(d); }
      // the city: hotels and towers ring the mosque
      const cityT = w.tex(256, (g, s) => { g.fillStyle = '#d8cfc0'; g.fillRect(0, 0, s, s); for (let y = 8; y < s; y += 16) for (let x = 6; x < s; x += 14) { g.fillStyle = Math.random() < 0.2 ? '#8a9aa8' : '#4a5864'; g.fillRect(x, y, 8, 10); } }, [3, 6]);
      const cityG = new T.BoxGeometry(1, 1, 1); cityG.translate(0, 0.5, 0);
      const city = SCAPE.scatter(w, { kind: 'house', n: 70, area: { x: 0, z: 0, r: 520 }, scale: [24, 46], seed: 7, avoid: (x, z) => Math.hypot(x, z) < 210 });
      city.meshes.forEach(m => { m.material = new T.MeshStandardMaterial({ map: cityT, roughness: 0.8 }); });
      // the plaza: umbrellas, furled at this hour
      const umbG = (() => { const p = []; const pole = new T.CylinderGeometry(0.42, 0.5, 14, 10); pole.translate(0, 7, 0); p.push(pole); const base = new T.CylinderGeometry(1.1, 1.3, 1.4, 10); base.translate(0, 0.7, 0); p.push(base);
        // a furled canopy hangs round the top of the column like a closed bud
        const prof = [[0.45, 6], [0.9, 7.5], [1.25, 10.5], [1.15, 13.5], [0.7, 15.2], [0.25, 15.8]].map(([r, y]) => new T.Vector2(r, y)); const bud = new T.LatheGeometry(prof, 12); p.push(bud);
        const cap = new T.CylinderGeometry(0.5, 0.7, 0.8, 10); cap.translate(0, 16.1, 0); p.push(cap); return SCAPE.merge(p); })();
      const umbs = []; for (let a = -9; a <= 9; a++) for (let b = -9; b <= 9; b++) { const x = a * 25, z = b * 25; if (Math.abs(x) < HALF + 14 && (Math.abs(z) < HALF + 14 || (z > 0 && z < HALF + 64))) continue; if (Math.hypot(x, z) > 210) continue; umbs.push([x, z]); }
      const umbM = new T.InstancedMesh(umbG, M.marble, umbs.length); umbs.forEach(([x, z], k) => { m4.makeTranslation(x, 0, z); umbM.setMatrixAt(k, m4); }); umbM.castShadow = true; S.add(umbM);
      SCAPE.birds(w, { n: 16, x: 0, z: 0, y: 30, r: 60, color: 0xf0ece4, speed: 0.1 });

      /* ---------- the puzzle pieces ---------- */
      this.grid = [...Array(N)].map(() => Array(N).fill(null)); this.pieces = []; this.goals = [];
      const glowM = new T.MeshBasicMaterial({ color: 0xffd890, transparent: true, opacity: 0.5, depthWrite: false });
      PUZ.forEach((pz, k) => pz.rows.forEach((row, y) => [...row].forEach((c, x) => {
        if (c === '.') return;
        const i = pz.ox + x, j = pz.oy + y, X = cx(i), Z = cz(j);
        const o = { c, i, j, x: X, z: Z, puz: k, rot: pz.init[x + ',' + y] || 0, show: 0, lit: 0 };
        this.grid[j][i] = o;
        if (c === '#') {
          // a cabinet of Qur'an shelves: the light cannot pass
          const sh = new T.Group(); sh.position.set(X, 0, Z); S.add(sh);
          const body = new T.Mesh(new T.BoxGeometry(3.4, 1.9, 3.4), M.wood); body.position.y = 0.95; body.castShadow = body.receiveShadow = true; sh.add(body);
          const top = new T.Mesh(new T.BoxGeometry(3.6, 0.12, 3.6), M.brassDark); top.position.y = 1.95; sh.add(top);
          for (let f = 0; f < 4; f++) { const sp = new T.Mesh(new T.PlaneGeometry(3.1, 1.5), this.spinesM || (this.spinesM = new T.MeshStandardMaterial({ map: w.tex(256, (g, s) => { g.fillStyle = '#2a1a10'; g.fillRect(0, 0, s, s); for (let r = 0; r < 4; r++) for (let xx = 4; xx < s; xx += 7 + Math.random() * 4) { g.fillStyle = ['#1e5a3a', '#7a1a1a', '#2a3a6a', '#6a4a1a', '#1a4a4a'][(Math.random() * 5) | 0]; g.fillRect(xx, r * 64 + 8, 6, 52); g.fillStyle = '#c8a050'; g.fillRect(xx + 1, r * 64 + 20, 4, 3); } }), roughness: 0.8 }))); const a = f * Math.PI / 2; sp.position.set(Math.sin(a) * 1.71, 1.0, Math.cos(a) * 1.71); sp.rotation.y = a; sh.add(sp); }
          w.addBox(X - 1.8, Z - 1.8, X + 1.8, Z + 1.8);
          return;
        }
        const g = new T.Group(); g.position.set(X, 0, Z); g.userData.dynamic = true; S.add(g); o.g = g;
        const plinth = new T.Mesh(new T.CylinderGeometry(0.55, 0.65, 0.3, 16), M.marble); plinth.position.y = 0.15; g.add(plinth);
        if (c === 'M' || c === 'P') {
          const post = new T.Mesh(new T.CylinderGeometry(0.05, 0.07, 1.1, 8), M.brass); post.position.y = 0.75; g.add(post);
          const head = new T.Group(); head.position.y = BEAM_Y; g.add(head); o.head = head;
          if (c === 'M') {
            const disc = new T.Mesh(new T.CylinderGeometry(0.42, 0.42, 0.04, 28), M.mirror); disc.rotation.x = Math.PI / 2; head.add(disc);
            const rim = new T.Mesh(new T.TorusGeometry(0.43, 0.04, 6, 28), M.brass); head.add(rim);
            const back = new T.Mesh(new T.CylinderGeometry(0.42, 0.42, 0.03, 28), M.brassDark); back.rotation.x = Math.PI / 2; back.position.z = -0.04; head.add(back);
          } else {
            const cr = new T.Mesh(new T.OctahedronGeometry(0.34, 0), new T.MeshStandardMaterial({ color: 0xe8f4ff, metalness: 0.2, roughness: 0.05, transparent: true, opacity: 0.75, emissive: 0x405060 })); cr.scale.y = 1.5; head.add(cr); o.crystal = cr;
            const cage = new T.Mesh(new T.TorusGeometry(0.4, 0.025, 4, 24), M.brass); cage.rotation.x = Math.PI / 2; head.add(cage);
          }
          // arrows on the floor show where the light will go
          o.arrows = [0, 1].slice(0, c === 'P' ? 2 : 1).map(k2 => { const a = new T.Mesh(new T.ConeGeometry(0.22, 0.6, 3).rotateX(Math.PI / 2), glowM.clone()); a.position.y = 0.33; g.add(a); return a; });
          this.pieces.push(o);
          o.item = w.interact({ key: 'p' + i + '_' + j, pos: [X, BEAM_Y, Z], r: 3.2, label: c === 'M' ? 'Turn the mirror' : 'Turn the prism', enabled: () => self.phase === k && !self.done, onUse: () => self.turn(o, 1) });
          w.addCircle(X, Z, 0.6);
        } else if (c === 'n' || c === 'e' || c === 'w' || c === 's') {
          o.dir = 'nesw'.indexOf(c);
          const post = new T.Mesh(new T.CylinderGeometry(0.08, 0.1, 1.0, 8), M.brass); post.position.y = 0.7; g.add(post);
          const dish = new T.Mesh(new T.SphereGeometry(0.75, 24, 8, 0, Math.PI * 2, 0, 0.75), M.mirror); dish.rotation.x = Math.PI; dish.position.y = 1.9; const tilt = new T.Group(); tilt.position.y = 0; tilt.add(dish); g.add(tilt);
          dish.rotation.set(Math.PI - 0.75, 0, 0); tilt.rotation.y = Math.PI - o.dir * Math.PI / 2;
          const core = KIT.glow(w, 0xfff0c8, 2.2, 0); core.position.y = BEAM_Y; g.add(core); o.glow = core;
          w.addCircle(X, Z, 0.7);
        } else if (c === 'T') {
          const post = new T.Mesh(new T.CylinderGeometry(0.12, 0.16, 0.9, 8), M.brass); post.position.y = 0.75; g.add(post);
          const lan = new T.Mesh(new T.CylinderGeometry(0.32, 0.26, 0.8, 8), new T.MeshStandardMaterial({ color: 0xfff0d0, emissive: 0xffc870, emissiveIntensity: 0.05, roughness: 0.3, transparent: true, opacity: 0.85 })); lan.position.y = BEAM_Y + 0.15; g.add(lan); o.lamp = lan;
          const cap = new T.Mesh(new T.ConeGeometry(0.4, 0.5, 8), M.brass); cap.position.y = BEAM_Y + 0.8; g.add(cap);
          const cage = new T.Mesh(new T.CylinderGeometry(0.34, 0.28, 0.82, 8, 1, true), new T.MeshStandardMaterial({ map: winT, alphaTest: 0.4, color: 0xc89a50, metalness: 0.8, roughness: 0.35, side: T.DoubleSide })); cage.position.y = BEAM_Y + 0.15; g.add(cage);
          o.glow = KIT.glow(w, 0xffd890, 3.5, 0); o.glow.position.y = BEAM_Y + 0.2; g.add(o.glow);
          this.goals.push(o); w.addCircle(X, Z, 0.7);
        } else if (c === 'C') {
          // the star in the floor and the brass ring that receives the light
          const starT = w.tex(512, (gg, s) => { gg.clearRect(0, 0, s, s); gg.save(); gg.translate(s / 2, s / 2); gg.fillStyle = '#e8d6a8'; U.star8(gg, 0, 0, s * 0.48, 0.72, Math.PI / 8); gg.fill(); gg.fillStyle = '#c8a050'; U.star8(gg, 0, 0, s * 0.4, 0.72, Math.PI / 8); gg.fill(); gg.fillStyle = '#2e6e6a'; U.star8(gg, 0, 0, s * 0.22, 0.6); gg.fill(); gg.restore(); });
          starT.wrapS = starT.wrapT = T.ClampToEdgeWrapping;
          const star = new T.Mesh(new T.PlaneGeometry(5.4, 5.4).rotateX(-Math.PI / 2), new T.MeshStandardMaterial({ map: starT, transparent: true, metalness: 0.5, roughness: 0.35, emissive: 0xffc860, emissiveMap: starT, emissiveIntensity: 0 })); star.position.y = 0.04; g.add(star); o.star = star;
          const ring = new T.Mesh(new T.TorusGeometry(0.75, 0.06, 8, 40), M.brass); ring.position.y = BEAM_Y; g.add(ring);
          const ring2 = ring.clone(); ring2.rotation.y = Math.PI / 2; g.add(ring2);
          const stem = new T.Mesh(new T.CylinderGeometry(0.06, 0.1, 0.6, 8), M.brass); stem.position.y = 0.6; g.add(stem);
          o.arms = [0, 1, 2, 3].map(d => { const a = KIT.glow(w, 0xffd890, 1.4, 0); a.position.set(DIRS[d][0] * -0.75, BEAM_Y, DIRS[d][1] * -0.75); g.add(a); return a; });
          o.glow = KIT.glow(w, 0xffe8b0, 6, 0); o.glow.position.y = BEAM_Y; g.add(o.glow);
          this.goals.push(o); this.star = o; w.addCircle(X, Z, 0.9);
        }
      })));
      // the brass panels that roll each dome aside, on a column beside its sun-catcher
      this.domes.forEach((d, k) => {
        if (d.puz > 2) return;
        const src = this.findSource(d);
        const px = src.x - 3, pz = src.z + 3;
        const panel = new T.Mesh(new T.BoxGeometry(0.5, 0.9, 0.12), M.brass); panel.position.set(px + 0.62, 1.2, pz); panel.rotation.y = Math.PI / 2; S.add(panel);
        const lamp = KIT.glow(w, 0x9fe0c0, 0.7, 0.9); lamp.position.set(px + 0.72, 1.45, pz); S.add(lamp); d.lampG = lamp; lamp.userData.dynamic = true;
        d.panel = [px + 0.8, pz];
        d.item = w.interact({ key: 'dome' + k, pos: [px + 0.8, 1.3, pz], r: 3, label: 'Roll the dome open', enabled: () => self.phase === d.puz && !d.open, onUse: () => self.openDome(d) });
      });

      /* ---------- beams ---------- */
      const coreM = new T.MeshBasicMaterial({ color: 0xfff4dc, transparent: true, opacity: 0.95, depthWrite: false, blending: T.AdditiveBlending });
      const haloM = new T.MeshBasicMaterial({ color: 0xffc870, transparent: true, opacity: 0.18, depthWrite: false, blending: T.AdditiveBlending });
      const bg = new T.CylinderGeometry(1, 1, 1, 8, 1, true); bg.translate(0, 0.5, 0); bg.rotateX(Math.PI / 2);
      this.beamCore = new T.InstancedMesh(bg, coreM, 64); this.beamHalo = new T.InstancedMesh(bg, haloM, 64);
      [this.beamCore, this.beamHalo].forEach(m => { m.count = 0; m.frustumCulled = false; m.userData.dynamic = true; S.add(m); });
      this.hits = [...Array(24)].map(() => { const s = KIT.glow(w, 0xffe0a0, 0.9, 0); s.userData.dynamic = true; S.add(s); return s; });
      SCAPE.motes(w, { n: 160, area: [-46, 0.5, -46, 46, 11, 46], color: '#fff0d0', size: 0.12, additive: true });

      /* ---------- discoveries ---------- */
      [
        { pos: [-6, 1.5, 44], title: 'A thousand prayers', text: '“One prayer in this mosque of mine is better than a thousand prayers in any other mosque, except al-Masjid al-Haram.” (Sahih al-Bukhari 1190)', ar: 'صلاةٌ في مسجدي هذا خيرٌ من ألف صلاةٍ فيما سواه إلا المسجد الحرام' },
        { pos: [-1, 1.5, 16], title: 'Lights in the drum', text: 'Small openings pierced in the base of each dome let light into the hall even when the dome is closed.', ar: 'فتحاتٌ صغيرة في قاعدة كل قبة تُدخل الضوء والقبةُ مغلقة' },
        { pos: [-46.2, 1.5, -6], title: 'Mud brick and palm trunks', text: 'In the Prophet’s ﷺ lifetime the mosque was built of mud brick, its roof of palm leaves and its pillars of palm trunks. (Sahih al-Bukhari 446)', ar: 'كان المسجد على عهد رسول الله ﷺ مبنيًّا باللَّبِن، وسقفُه الجريد، وعُمُده خشبُ النخل' },
        { pos: [46.2, 1.5, -6], title: '‘Umar and ‘Uthman', text: '‘Umar enlarged it with the same materials, renewing the pillars in wood. ‘Uthman rebuilt it larger, with walls of carved stone and lime, pillars of carved stone and a roof of teak. (Sahih al-Bukhari 446)', ar: 'زاد فيه عمرُ وبناه على بنيانه، ثم غيّره عثمانُ فبنى جداره بالحجارة المنقوشة والقَصّة، وسقفه بالساج' },
        { pos: [40, 1.5, -46.2], title: 'Ten minarets', text: 'The mosque has ten minarets. The six added in the great expansion of 1985–1992 each rise about 104 metres.', ar: 'للمسجد عشر منارات، ارتفاع كلٍّ من الستّ التي أُضيفت في التوسعة الكبرى نحو ١٠٤ أمتار' },
        { pos: [-40, 1.5, -46.2], title: 'The great expansion', text: 'Begun in 1985 and completed in the early 1990s, King Fahd’s expansion added 27 courts of about 324 square metres, each roofed by a sliding dome. The mosque grew to more than 160,000 square metres.', ar: 'أضافت توسعة الملك فهد سبعًا وعشرين ساحةً تغطّي كلًّا منها قبةٌ متحركة' },
        { pos: [-30, 1.5, 46.2], title: 'The Ottoman rebuilding', text: 'Sultan Abdulmejid I rebuilt the mosque in red stone over thirteen years, beginning in 1849. It is one of many rebuildings across fourteen centuries.', ar: 'أعاد السلطان عبد المجيد الأول بناء المسجد بالحجر الأحمر في ثلاث عشرة سنة، ابتداءً من سنة ١٨٤٩' },
        { pos: [26, 1.5, 22], title: 'Domes on rails', text: 'Each sliding dome is about 18 metres square and some 80 tonnes; it rolls along metal tracks on the roof in about a minute.', ar: 'كل قبة متحركة نحو ثمانية عشر مترًا مربّعًا، وتنزلق على قضبانٍ فوق السطح في نحو دقيقة' },
      ].forEach(d => w.discover(Object.assign(d, { size: 1.4 })));

      /* ---------- sound ---------- */
      const bus = env.bus;
      this.snd = { air: SND.noise(bus, { color: 'brown', type: 'lowpass', freq: 220, gain: 0.05 }), hiss: SND.noise(bus, { color: 'pink', type: 'bandpass', freq: 3000, q: 0.4, gain: 0.006 }) };
      this.hum = SND.drone(bus, 146.83, { vowel: 'u', gain: 0.0 });
      this.murT = 4;

      /* ---------- input: click turns the mirror you are looking at ---------- */
      w.onPointer = (e, p, phase) => {
        if (phase !== 'down' || !w.locked) return false;
        const f = w.focus; if (f && f.key && f.key[0] === 'p') { const o = this.pieces.find(o2 => o2.item === f); if (o && f.enabled(w)) { this.turn(o, e.button === 2 ? -1 : 1); return true; } }
        return false;
      };
      w.camera.near = 0.1; w.camera.updateProjectionMatrix();
      this.retrace();
      S.traverse(o => { if (o.isInstancedMesh) { o.userData.dynamic = true; o.frustumCulled = false; } });
      w.bake();
    },
    findSource(d) {
      // the sun-catcher two cells south of a dome's centre
      const o = this.grid[d.cj + 2] && this.grid[d.cj + 2][d.ci];
      return o || { x: 0, z: 0 };
    },

    /* ---------------- the film ---------------- */
    film(env, w) {
      const self = this, d = this.domes[4];
      return [
        { dur: 7, fade: 'dip', title: true, ease: 'glide', fov: [52, 46], path: [[[240, 150, 300], [0, 20, 0]], [[170, 110, 210], [0, 12, 0]], [[110, 70, 140], [0, 10, -10]]],
          start: () => SND.glow(env.bus, 196, { gain: 0.05, dur: 7 }) },
        { dur: 6.5, fade: 'dip', fov: [44, 40], path: [[[-60, ROOF + 4, 20], [-20, ROOF + 4, -20]], [[-40, ROOF + 3, 4], [0, ROOF + 4, -26]]],
          line: 'The roof of the Prophet’s Mosque holds 27 domes that slide on rails.', ar: 'يحمل سطحُ المسجد النبوي سبعًا وعشرين قبةً تنزلق على قضبان' },
        { dur: 7, fade: 'dip', ease: 'linear', path: [[[-3, 1.8, 44], [-3, 3.5, 20]], [[-3, 2.2, 26], [-3, 4.5, 0]]],
          lines: [[0.4, 'Its first walls were mud brick; its pillars, palm trunks.', 'كان بناؤه الأول باللَّبِن، وعُمُده جذوع النخل'], [3.6, 'It has been rebuilt and enlarged many times since.', 'ثم جُدِّد ووُسِّع مرّاتٍ كثيرة']],
          start: () => SND.sing(env.bus, 220, { vowel: 'o', dur: 5, gain: 0.025 }) },
        { dur: 7.5, fade: 'cut', fov: [50, 54], path: [[[d.x0 + 4, 1.6, d.z0 + 18], [d.x0, CEIL + 3, d.z0]], [[d.x0 + 2, 1.5, d.z0 + 15], [d.x0, CEIL + 6, d.z0 - 2]]],
          lines: [[0.4, 'Each dome, some eighteen metres square, rolls aside in about a minute.', 'كلّ قبةٍ نحو ثمانية عشر مترًا، تنزاح في نحو دقيقة'], [4, 'And the hall opens to the sky.', 'فينفتح المصلّى على السماء']],
          start: () => { d.film = true; SND.noise && self.rumble(env); },
          during: (w, k) => { const t = U.smooth(0.05, 0.85, k); d.t = t; self.placeDome(d); if (k > 0.5 && !d._sang) { d._sang = 1; SND.glow(env.bus, 262, { gain: 0.05, dur: 5 }); } },
          skip: () => { d.t = 0; self.placeDome(d); } },
        { dur: 6, fade: 'dip', path: [[[-34, 3.5, 44], [-39, 1.5, 33]], [[-28, 2.4, 46], [-36, 1.5, 36]]],
          line: 'Carry the sunlight through the hall.', ar: 'احمِلْ ضوءَ الشمس عبر المصلّى',
          start: () => { d.t = 0; d._sang = 0; self.placeDome(d); } },
      ];
    },
    filmOpts: { end(w) { const st = ENGINE.cur; if (st && st.domes) { const d = st.domes[4]; d.t = 0; d.film = false; st.placeDome(d); st.begin(0); } } },

    /* ---------------- the game ---------------- */
    begin(k) {
      const w = this.w; this.phase = k; const pz = PUZ[k];
      w.activity(pz.title, k === 2 ? 4 : this.goals.filter(o => o.puz === k).length, pz.step);
      const d = this.domes.find(dd => dd.puz === k && !dd.open);
      w.goal(d ? [d.panel[0], 1.4, d.panel[1]] : null);
      this.retrace();
    },
    placeDome(d) {
      d.g.position.set(d.x0 + d.slide[0] * 18 * d.t, 0, d.z0 + d.slide[1] * 18 * d.t);
      d.shaft.visible = d.t > 0.02; d.shaft.material.uniforms.uOp.value = U.smooth(0.15, 0.9, d.t);
    },
    rumble(env) { SND.swell(env.bus, { f0: 60, f1: 120, dur: 4, gain: 0.06 }); SND.knock(env.bus, { f: 50, gain: 0.08, click: 300 }); },
    openDome(d) {
      const env = ENGINE.env; if (d.open) return; d.open = true; d.opening = 0; this.rumble(env);
      d.lampG.material.color.set(0xffd890);
      const left = this.domes.find(dd => dd.puz === this.phase && !dd.open);
      this.w.goal(left ? [left.panel[0], 1.4, left.panel[1]] : null);
    },
    turn(o, s) {
      const env = ENGINE.env; if (this.phase !== o.puz || this.done) return;
      o.rot = (o.rot + s + 4) % 4; o.spin = s;
      SND.knock(env.bus, { f: 260 + o.i * 5, gain: 0.05, click: 3600 }); SND.sing(env.bus, NOTES[(o.i + o.j) % 8] / 2, { vowel: 'o', dur: 0.9, gain: 0.02 });
      this.retrace();
    },
    // follow every beam through the hall: mirrors send it on, prisms split it, shelves stop it
    retrace() {
      const segs = [], seen = new Set(), queue = [], lit = new Map();
      this.grid.flat().forEach(o => { if (o && o.dir != null) { const d = this.domes.find(dd => dd.puz === o.puz && Math.abs(dd.ci - o.i) < 1 && dd.cj + 2 === o.j); o.on = d && d.open && d.opening >= 1; if (o.on) queue.push([o.i, o.j, o.dir]); } });
      while (queue.length && segs.length < 60) {
        const [i0, j0, d] = queue.shift(), key = i0 + ',' + j0 + ',' + d; if (seen.has(key)) continue; seen.add(key);
        let i = i0, j = j0, end = null;
        for (;;) {
          i += DIRS[d][0]; j += DIRS[d][1];
          if (i < 0 || j < 0 || i >= N || j >= N) { end = [d === 1 ? HALF : d === 3 ? -HALF : cx(i0), d === 2 ? HALF : d === 0 ? -HALF : cz(j0)]; break; }
          const o = this.grid[j][i]; if (!o) continue;
          const back = 0.6;
          if (o.c === '#') { end = [cx(i) - DIRS[d][0] * 1.8, cz(j) - DIRS[d][1] * 1.8]; break; }
          if (o.c === 'T' || o.c === 'C') { lit.set(o, (lit.get(o) || new Set()).add(d)); end = [cx(i) - DIRS[d][0] * (o.c === 'C' ? 0.75 : 0.35), cz(j) - DIRS[d][1] * (o.c === 'C' ? 0.75 : 0.35)]; break; }
          if (o.c === 'M') { queue.push([i, j, o.rot]); end = [cx(i), cz(j)]; o.inDir = d; break; }
          if (o.c === 'P') { queue.push([i, j, o.rot]); queue.push([i, j, (o.rot + 1) % 4]); end = [cx(i), cz(j)]; break; }
          end = [cx(i) - DIRS[d][0] * back, cz(j) - DIRS[d][1] * back]; break; // a sun-catcher
        }
        segs.push([cx(i0), cz(j0), end[0], end[1]]);
      }
      this.segs = segs; this.litMap = lit;
      this.pieces.forEach(o => { o.hot = seen.has(o.i + ',' + o.j + ',' + o.rot); });
      this.drawBeams();
      // goals
      const env = ENGINE.env, w = this.w; if (!w) return;
      this.goals.forEach(o => {
        const was = o.lit; o.lit = o.c === 'C' ? (lit.get(o) || new Set()).size : (lit.has(o) ? 1 : 0);
        if (o.c === 'C') o.dirs = lit.get(o) || new Set();
        if (o.lit > was && env && this.phase >= 0) { SND.sing(env.bus, NOTES[(this.goals.indexOf(o) + o.lit) % 8], { vowel: 'a', dur: 2.4, gain: 0.04 }); SND.bell(env.bus, NOTES[o.lit % 8] * 2, { gain: 0.015 }); }
      });
      if (this.phase < 0 || this.done) return;
      const k = this.phase, mine = this.goals.filter(o => o.puz === k);
      const n = k === 2 ? this.star.lit : mine.filter(o => o.lit).length;
      w.progress(n);
      if (k < 2 ? mine.every(o => o.lit) : this.star.lit >= 4) this.solved(k);
    },
    drawBeams() {
      const m4 = new T.Matrix4(), q = new T.Quaternion(), up = new T.Vector3(0, 0, 1), dir = new T.Vector3(), pos = new T.Vector3(), sc = new T.Vector3();
      this.segs.forEach((s, k) => {
        dir.set(s[2] - s[0], 0, s[3] - s[1]); const L = dir.length() || 0.001; dir.normalize();
        q.setFromUnitVectors(up, dir); pos.set(s[0], BEAM_Y, s[1]);
        m4.compose(pos, q, sc.set(0.035, 0.035, L)); this.beamCore.setMatrixAt(k, m4);
        m4.compose(pos, q, sc.set(0.16, 0.16, L)); this.beamHalo.setMatrixAt(k, m4);
        if (this.hits[k]) { this.hits[k].position.set(s[2], BEAM_Y, s[3]); this.hits[k].material.opacity = 0.8; }
      });
      for (let k = this.segs.length; k < this.hits.length; k++) this.hits[k].material.opacity = 0;
      this.beamCore.count = this.beamHalo.count = this.segs.length;
      this.beamCore.instanceMatrix.needsUpdate = this.beamHalo.instanceMatrix.needsUpdate = true;
    },
    solved(k) {
      const w = this.w, env = ENGINE.env; if (this.solving === k) return; this.solving = k;
      SND.glow(env.bus, 196, { gain: 0.06, dur: 6 }); SND.glow(env.bus, 293.66, { gain: 0.04, dur: 6, delay: 0.8 });
      if (k === 0) setTimeout(() => { if (!this.w) return; w.say('One beam', 'The light of one dome, carried by two mirrors to the lamp. Next court: east, beyond the shelves.', { ms: 6000 }); this.begin(1); }, 2500);
      if (k === 1) setTimeout(() => { if (!this.w) return; w.say('Two lamps', 'A prism shares the light two ways. Now the great court to the north, and its star.', { ms: 6000 }); this.begin(2); }, 2500);
      if (k === 2) {
        this.done = true; w.goal(null);
        const d = this.domes[4]; d.open = true; d.opening = 0; this.rumble(env);
        setTimeout(() => { if (!this.w) return; SND.glow(env.bus, 146.83, { gain: 0.08, dur: 10 }); SND.glow(env.bus, 220, { gain: 0.06, dur: 10, delay: 1 }); SND.glow(env.bus, 293.66, { gain: 0.05, dur: 10, delay: 2 });
          for (let i = 0; i < 4; i++) SND.coo(env.bus, { gain: 0.04, delay: i * 0.9 }); }, 2500);
        setTimeout(() => { if (!this.w) return; w.finish('The star receives the light of the sky'); }, 6000);
      }
    },
    onKey(env, e) { if (!this.w || this.w.cine) return; if (e.key === 'q' || e.key === 'Q') { const f = this.w.focus, o = f && this.pieces.find(o2 => o2.item === f); if (o && f.enabled(this.w)) this.turn(o, -1); } },

    update(env, dt) {
      const w = this.w; if (!w) return;
      w.update(dt);
      const t = w.time;
      // domes roll (about a minute in life; a few seconds here), and the light follows
      this.domes.forEach(d => {
        if (d.film) return;
        if (d.open && d.opening < 1) { d.opening = Math.min(1, d.opening + dt / 5); d.t = U.ease(d.opening); this.placeDome(d); if (d.opening >= 1) { this.retrace(); SND.glow(env.bus, 329.63, { gain: 0.05, dur: 4 }); } }
        d.shaft.material.uniforms.uTime.value = t;
      });
      // mirrors and prisms turn smoothly toward where they send the light
      this.pieces.forEach(o => {
        const want = -o.rot * Math.PI / 2 + Math.PI;
        o.ang = o.ang == null ? want : o.ang + Math.atan2(Math.sin(want - o.ang), Math.cos(want - o.ang)) * Math.min(1, dt * 9);
        if (o.c === 'M') { const inA = o.inDir != null && o.hot ? (-((o.inDir + 2) % 4) * Math.PI / 2 + Math.PI) : o.ang; const mid = o.ang + Math.atan2(Math.sin(inA - o.ang), Math.cos(inA - o.ang)) / 2; o.head.rotation.y = mid; }
        else { o.head.rotation.y = t * 0.6; if (o.crystal) o.crystal.material.emissiveIntensity = o.hot ? 1.6 : 0.4; }
        o.arrows.forEach((a, k) => { const r = (o.rot + k) % 4; a.rotation.y = -r * Math.PI / 2 + Math.PI; a.position.set(DIRS[r][0] * 0.95, 0.33, DIRS[r][1] * 0.95); a.material.opacity = (o.hot ? 0.85 : 0.35) * (this.phase === o.puz ? 1 : 0.4); });
      });
      // lamps, catchers and the star answer the light
      this.grid.flat().forEach(o => {
        if (!o) return;
        if (o.dir != null) o.glow.material.opacity = U.damp(o.glow.material.opacity, o.on ? 0.9 : 0, 4, dt);
        if (o.c === 'T') { const k = o.lit ? 1 : 0; o.lamp.material.emissiveIntensity = U.damp(o.lamp.material.emissiveIntensity, k ? 2.4 : 0.05, 4, dt); o.glow.material.opacity = U.damp(o.glow.material.opacity, k * (0.8 + 0.1 * Math.sin(t * 3)), 4, dt); }
        if (o.c === 'C') {
          o.arms.forEach((a, d) => { a.material.opacity = U.damp(a.material.opacity, o.dirs && o.dirs.has(d) ? 0.95 : 0, 4, dt); });
          const full = this.done ? 1 : 0; o.star.material.emissiveIntensity = U.damp(o.star.material.emissiveIntensity, full * 1.6 + o.lit * 0.15, 2, dt);
          o.glow.material.opacity = U.damp(o.glow.material.opacity, full * (0.9 + 0.1 * Math.sin(t * 2)), 2, dt);
        }
      });
      this.hits.forEach((h, k) => { if (h.material.opacity > 0) h.scale.setScalar(0.8 + 0.15 * Math.sin(t * 7 + k)); });
      this.beamCore.material.opacity = 0.8 + 0.15 * Math.sin(t * 9);
      // sound: a low sung tone for every beam in the hall, a murmur far off, footsteps on marble
      const nb = this.segs ? this.segs.length : 0;
      this.hum.setGain(Math.min(0.05, nb * 0.006), 0.6);
      this.murT -= dt; if (this.murT < 0) { this.murT = U.rnd(6, 12); SND.sing(env.bus, U.pick([110, 123.47, 130.81]), { vowel: 'u', dur: 3, gain: 0.008, pan: U.rnd(-0.8, 0.8) }); }
      if (Math.random() < dt * 0.08) SND.coo(env.bus, { gain: 0.012 });
    },
  }));
})();
