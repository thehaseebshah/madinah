/* Station — The Sky Beneath the Domes (walkable).
   Feeling: awe, as a closed hall opens to the sky. The prayer hall of the Prophet's Mosque today in
   the cool of the morning: marble columns and arches, red carpet, a ceiling of the star-and-cross,
   and above it nine domes that roll aside on rails. Each open dome lets a square of sunlight onto
   the carpet. Woven into the carpet in gold is an eight-pointed star: open exactly the domes whose
   light completes it (and roll back any that do not). Then the star blazes, doves cross the
   openings and a choir rises.
   Colour script: cream marble and red carpet; sunlight gold is the accent, kept for the star, the
   rings under the domes and the shafts of light. */
(function () {
  'use strict';
  if (!window.WORLD) return;
  // a soft image-based light painted on a canvas (sky above, warm floor below) for marble and gold
  function paintedEnv(w, top, mid, bot) {
    const c = document.createElement('canvas'); c.width = 256; c.height = 128;
    const g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 128);
    gr.addColorStop(0, top); gr.addColorStop(0.47, mid); gr.addColorStop(0.53, mid); gr.addColorStop(1, bot);
    g.fillStyle = gr; g.fillRect(0, 0, 256, 128);
    const t = new THREE.CanvasTexture(c); t.mapping = THREE.EquirectangularReflectionMapping; t.encoding = THREE.sRGBEncoding;
    const pm = new THREE.PMREMGenerator(w.renderer), rt = pm.fromEquirectangular(t);
    w.scene.environment = rt.texture; w._envRT = rt; t.dispose(); pm.dispose();
  }
  // one material per mesh here, so geometry groups only stop the bake from merging
  const ungroup = S => S.traverse(o => { if (o.isMesh && !Array.isArray(o.material) && o.geometry.groups.length > 1) o.geometry.clearGroups(); });
  const T = THREE;
  const BAY = 8, HALF = 3.8, CEIL = 7.5, ROOF = 8.0, HALL = 24;
  const SUN = new T.Vector3(0.5, 0.866, 0).normalize();
  const SHIFT = SUN.x / SUN.y;            // sunlight slides west by this much per metre of height
  const OFF = 7.75 * SHIFT;               // where the light of each opening falls
  const SPRING = 5.8;
  const CHORD = [146.83, 220, 293.66, 369.99, 440];

  // merge simple geometries (with their transforms) into one, so a moving dome is one draw call
  function merge(list) {
    let n = 0; const gs = list.map(([g, m]) => { const q = (g.index ? g.toNonIndexed() : g.clone()); if (m) q.applyMatrix4(m); n += q.attributes.position.count; return q; });
    const P = new Float32Array(n * 3), N = new Float32Array(n * 3), UV = new Float32Array(n * 2); let o = 0;
    gs.forEach(g => { if (!g.attributes.normal) g.computeVertexNormals(); const c = g.attributes.position.count; P.set(g.attributes.position.array, o * 3); N.set(g.attributes.normal.array, o * 3); if (g.attributes.uv) UV.set(g.attributes.uv.array, o * 2); o += c; g.dispose(); });
    const geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.BufferAttribute(P, 3)); geo.setAttribute('normal', new T.BufferAttribute(N, 3)); geo.setAttribute('uv', new T.BufferAttribute(UV, 2));
    geo.computeBoundingSphere(); return geo;
  }
  const mtx = (x, y, z, rx, ry) => new T.Matrix4().compose(new T.Vector3(x, y, z), new T.Quaternion().setFromEuler(new T.Euler(rx || 0, ry || 0, 0)), new T.Vector3(1, 1, 1));
  // a horizontal plane whose texture is laid in world metres (so every bay matches)
  function worldPlane(x0, z0, x1, z1, y, down, scale) {
    const g = new T.PlaneGeometry(x1 - x0, z1 - z0); g.rotateX(down ? Math.PI / 2 : -Math.PI / 2); g.translate((x0 + x1) / 2, y, (z0 + z1) / 2);
    const p = g.attributes.position, uv = g.attributes.uv;
    for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / scale, p.getZ(i) / scale);
    return g;
  }

  const SHAFT_VERT = `varying vec3 vW; void main(){ vec4 wp = modelMatrix*vec4(position,1.); vW = wp.xyz; gl_Position = projectionMatrix*viewMatrix*wp; }`;
  const SHAFT_FRAG = `uniform float uOp; uniform float uTime; varying vec3 vW;
void main(){
  float a = uOp * smoothstep(0.0, 3.0, vW.y) * (1.0 - 0.45*smoothstep(5.5, 8.0, vW.y));
  a *= 0.7 + 0.3*sin(vW.x*1.3 + vW.z*2.1 + uTime*0.25) * sin(vW.z*0.7 - vW.x*0.4 + uTime*0.17);
  gl_FragColor = vec4(vec3(1.0, 0.93, 0.78) * a, 1.0);
}`;

  ENGINE.register(WORLD.stage({
    key: 'domes',
    arabic: 'المسجد النبوي',
    title: 'The Sky Beneath the Domes',
    era: 'The Prophet’s Mosque · founded 1 AH',
    hint: 'WASD to walk · stand under a dome and press E to roll it aside or back · complete the golden star with light',
    sound: { reverb: 0.75 },
    story: `<p>The first Prophet’s Mosque was a courtyard of mud brick, its roof palm fronds resting on palm-trunk pillars. Over fourteen centuries it has been rebuilt and enlarged many times.</p>
            <p>Today its roof holds 27 domes that roll aside on rails, opening the prayer hall to the sky in the cool of the day and closing again against the sun. The star-and-cross pattern overhead is one of the oldest in Islamic art: two squares turned against each other.</p>
            <p>An eight-pointed star is woven in gold into the carpet. Stand under a dome and press <b>E</b> to roll it aside: let the morning sun fall exactly on the star.</p>`,

    enter(env) {
      const self = this;
      const w = this.w = WORLD.create(env, {
        start: { x: 3, z: 15, yaw: 0.12, pitch: 0.12 }, exposure: 1.0, far: 900,
        fog: { color: 0xb8a68e, near: 45, far: 220 },
        bounds: [-HALL + 0.8, -HALL + 0.8, HALL - 0.8, HALL - 0.8],
        surface: () => 'wood',
      });
      const S = w.scene;
      this.reveal = -1; this.lookedUp = false; this.cards = {};

      w.sky({ top: '#3f78c4', mid: '#d6e6f2', bot: '#c8bca8', sunDir: SUN.toArray(), sun: '#fff0d0', sunSize: 0.002 });
      paintedEnv(w, '#9cc4ec', '#f4ead8', '#8a3a30');
      S.add(new T.HemisphereLight(0xfff0dc, 0xa07a62, 0.34));
      const sun = this.sun = new T.DirectionalLight(0xfff0d8, 3.4);
      sun.position.copy(SUN).multiplyScalar(60); sun.target.position.set(0, 0, 0); S.add(sun, sun.target);
      sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
      Object.assign(sun.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, near: 10, far: 120 });
      sun.shadow.camera.updateProjectionMatrix(); sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.03;
      w.renderer.shadowMap.enabled = true; w.renderer.shadowMap.type = T.PCFSoftShadowMap;

      /* ---------- textures ---------- */
      const carpet = w.tex(512, (g, s) => {
        g.fillStyle = '#7a1418'; g.fillRect(0, 0, s, s);
        for (let i = 0; i < 9000; i++) { g.fillStyle = Math.random() < 0.5 ? 'rgba(40,0,4,0.25)' : 'rgba(170,40,40,0.18)'; g.fillRect(Math.random() * s, Math.random() * s, 2, 1); }
        for (let row = 0; row < 2; row++) {
          const y0 = row * s / 2;
          g.fillStyle = '#d8b46a'; g.fillRect(0, y0, s, 7); g.fillStyle = '#4a0a0c'; g.fillRect(0, y0 + 7, s, 3);
          for (let k = 0; k < 2; k++) {
            const cx = k * s / 2 + s / 4, top = y0 + 30, bot = y0 + s / 2 - 14;
            g.strokeStyle = '#c89a52'; g.lineWidth = 4; g.beginPath();
            g.moveTo(cx - 90, bot); g.lineTo(cx - 90, top + 80); g.quadraticCurveTo(cx - 90, top + 20, cx, top); g.quadraticCurveTo(cx + 90, top + 20, cx + 90, top + 80); g.lineTo(cx + 90, bot); g.stroke();
            g.fillStyle = 'rgba(100,10,14,0.9)'; g.fill();
            g.fillStyle = '#d0a85c'; U.star8(g, cx, top + 90, 26, 0.6, 0.39); g.fill();
            g.fillStyle = '#6a0c10'; g.beginPath(); g.arc(cx, top + 90, 9, 0, 6.283); g.fill();
            g.strokeStyle = 'rgba(208,168,92,0.45)'; g.lineWidth = 2;
            for (let v = 0; v < 3; v++) { g.beginPath(); g.moveTo(cx - 60, top + 140 + v * 22); g.lineTo(cx + 60, top + 140 + v * 22); g.stroke(); }
          }
        }
      });
      const marbleTex = w.tex(512, (g, s) => {
        g.fillStyle = '#f1ece2'; g.fillRect(0, 0, s, s);
        g.strokeStyle = 'rgba(140,128,112,0.22)';
        for (let i = 0; i < 30; i++) { g.lineWidth = 0.5 + Math.random() * 1.6; g.beginPath(); let x = Math.random() * s, y = Math.random() * s; g.moveTo(x, y); for (let k = 0; k < 12; k++) { x += (Math.random() - 0.5) * 40; y += Math.random() * 40; g.lineTo(x, y); } g.stroke(); }
      });
      const starCross = w.tex(512, (g, s) => {
        g.fillStyle = '#244766'; g.fillRect(0, 0, s, s);
        const R = s / 2;
        for (const [x, y] of [[0, 0], [s, 0], [0, s], [s, s], [s / 2, s / 2]]) {
          if (x === s / 2) continue;
          g.fillStyle = '#efe4cc'; U.star8(g, x, y, R, 0.765, 0); g.fill();
          g.strokeStyle = '#c9a24e'; g.lineWidth = 9; g.stroke();
          g.fillStyle = '#c9a24e'; U.star8(g, x, y, R * 0.28, 0.6, 0.39); g.fill();
        }
        // a small rosette in each cross
        g.fillStyle = '#c9a24e'; g.beginPath(); g.arc(s / 2, s / 2, 16, 0, 6.283); g.fill();
        g.strokeStyle = 'rgba(201,162,78,0.6)'; g.lineWidth = 3; g.beginPath(); g.arc(s / 2, s / 2, 34, 0, 6.283); g.stroke();
      });
      const domeIn = w.tex(1024, (g, s) => {
        g.fillStyle = '#efe6d2'; g.fillRect(0, 0, s, s);
        // v runs from the rim (bottom of the canvas, flipped) to the crown
        g.fillStyle = '#234466'; g.fillRect(0, s * 0.86, s, s * 0.14);
        for (let i = 0; i < 48; i++) { g.fillStyle = '#d6b060'; g.beginPath(); g.arc((i + 0.5) * s / 48, s * 0.93, 6, 0, 6.283); g.fill(); }
        for (let i = 0; i < 16; i++) {
          const x = (i / 16) * s;
          g.fillStyle = '#c9a24e'; g.fillRect(x - 3, 0, 6, s * 0.86);
          g.fillStyle = '#244766'; U.star8(g, x + s / 32, s * 0.62, 22, 0.765, 0); g.fill();
          g.strokeStyle = '#c9a24e'; g.lineWidth = 3; g.stroke();
          g.fillStyle = 'rgba(201,162,78,0.7)'; U.star8(g, x + s / 32, s * 0.36, 12, 0.6, 0); g.fill();
        }
        const gr = g.createLinearGradient(0, 0, 0, s * 0.2); gr.addColorStop(0, '#d6b060'); gr.addColorStop(1, 'rgba(214,176,96,0)');
        g.fillStyle = gr; g.fillRect(0, 0, s, s * 0.2);
      });
      domeIn.wrapS = T.RepeatWrapping;
      const wallTex = w.tex(512, (g, s) => {
        g.fillStyle = '#ebe2d2'; g.fillRect(0, 0, s, s);
        g.fillStyle = '#d9cdb8'; g.fillRect(0, s * 0.8, s, s * 0.2);
        g.fillStyle = '#c9a24e'; g.fillRect(0, s * 0.79, s, 4); g.fillRect(0, s * 0.06, s, 4);
        const cx = s / 2;
        g.fillStyle = '#5a4a3a'; g.beginPath(); g.moveTo(cx - 70, s * 0.62); g.lineTo(cx - 70, s * 0.3); g.quadraticCurveTo(cx - 70, s * 0.18, cx, s * 0.14); g.quadraticCurveTo(cx + 70, s * 0.18, cx + 70, s * 0.3); g.lineTo(cx + 70, s * 0.62); g.fill();
        g.strokeStyle = '#c9a24e'; g.lineWidth = 6; g.stroke();
      });
      const wallGlow = w.tex(512, (g, s) => {
        g.fillStyle = '#000'; g.fillRect(0, 0, s, s);
        const cx = s / 2;
        g.fillStyle = '#fff2d8'; g.beginPath(); g.moveTo(cx - 64, s * 0.61); g.lineTo(cx - 64, s * 0.3); g.quadraticCurveTo(cx - 64, s * 0.19, cx, s * 0.155); g.quadraticCurveTo(cx + 64, s * 0.19, cx + 64, s * 0.3); g.lineTo(cx + 64, s * 0.61); g.fill();
        g.fillStyle = '#000'; for (let i = 1; i < 4; i++) g.fillRect(cx - 64 + i * 32 - 2, s * 0.15, 4, s * 0.5); g.fillRect(cx - 64, s * 0.42, 128, 4);
      });

      /* ---------- the hall ---------- */
      const floor = new T.Mesh(worldPlane(-HALL, -HALL, HALL, HALL, 0, false, 2.4), KIT.std({ map: carpet, roughness: 1, relief: 0.02 }));
      carpet.repeat.set(1, 1); S.add(floor);
      const marble = KIT.std({ map: marbleTex, roughness: 0.3, relief: 0, envMapIntensity: 0.3 });
      const gold = KIT.std({ color: 0xd6ad5c, metalness: 0.9, roughness: 0.32, envMapIntensity: 0.6 });
      const plaster = KIT.std({ map: KIT.plaster(w, [4, 4], '#e8e0d0'), roughness: 0.8 });
      const ceilMat = KIT.std({ map: starCross, roughness: 0.6, relief: 0.01 });

      // columns of white marble with gilded capitals
      const colGeo = new T.CylinderGeometry(0.34, 0.38, SPRING - 1.2, 18);
      const baseGeo = new T.BoxGeometry(0.95, 0.5, 0.95), capGeo = new T.CylinderGeometry(0.58, 0.36, 0.45, 18), abGeo = new T.BoxGeometry(1.05, 0.2, 1.05), ringGeo = new T.TorusGeometry(0.39, 0.05, 6, 18);
      const COLS = [-20, -12, -4, 4, 12, 20];
      COLS.forEach(x => COLS.forEach(z => {
        const c = new T.Mesh(colGeo, marble); c.position.set(x, 0.5 + (SPRING - 1.2) / 2, z); S.add(c);
        const b = new T.Mesh(baseGeo, marble); b.position.set(x, 0.25, z); S.add(b);
        const r = new T.Mesh(ringGeo, gold); r.rotation.x = Math.PI / 2; r.position.set(x, 0.58, z); S.add(r);
        const cp = new T.Mesh(capGeo, gold); cp.position.set(x, SPRING - 0.47, z); S.add(cp);
        const ab = new T.Mesh(abGeo, marble); ab.position.set(x, SPRING - 0.1, z); S.add(ab);
        w.addCircle(x, z, 0.55);
      }));
      // pointed arches between them, carrying the ceiling
      const sh = new T.Shape();
      sh.moveTo(-4, 0); sh.lineTo(-3.45, 0); sh.quadraticCurveTo(-3.45, 1.15, 0, 1.38); sh.quadraticCurveTo(3.45, 1.15, 3.45, 0); sh.lineTo(4, 0); sh.lineTo(4, CEIL - SPRING); sh.lineTo(-4, CEIL - SPRING); sh.closePath();
      const archGeo = new T.ExtrudeGeometry(sh, { depth: 0.5, bevelEnabled: false, curveSegments: 10 }); archGeo.translate(0, 0, -0.25);
      // the extruded faces get uvs in shape units; scale them down for the marble
      { const uv = archGeo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 0.25, uv.getY(i) * 0.25); }
      const trimSh = new T.Shape();
      trimSh.moveTo(-3.45, 0); trimSh.quadraticCurveTo(-3.45, 1.15, 0, 1.38); trimSh.quadraticCurveTo(3.45, 1.15, 3.45, 0); trimSh.lineTo(3.3, 0); trimSh.quadraticCurveTo(3.3, 1.05, 0, 1.24); trimSh.quadraticCurveTo(-3.3, 1.05, -3.3, 0); trimSh.closePath();
      const trimGeo = new T.ExtrudeGeometry(trimSh, { depth: 0.54, bevelEnabled: false, curveSegments: 10 }); trimGeo.translate(0, 0, -0.27);
      this.archMeshes = [];
      COLS.forEach(a => COLS.slice(0, -1).forEach((b, k) => {
        const mid = (b + COLS[k + 1]) / 2;
        [[mid, a, 0], [a, mid, Math.PI / 2]].forEach(([x, z, ry]) => {
          const m = new T.Mesh(archGeo, marble); m.position.set(x, SPRING, z); m.rotation.y = ry; m.userData.noCast = true; S.add(m);
          const t = new T.Mesh(trimGeo, gold); t.position.set(x, SPRING, z); t.rotation.y = ry; t.userData.noCast = true; S.add(t);
        });
      }));

      // ceiling and roof, with nine square openings for the domes
      const xs = [-HALL, -11.8, -4.2, -3.8, 3.8, 4.2, 11.8, HALL];
      const isOpen = k => k === 1 || k === 3 || k === 5;
      this.ceil = [];
      for (let a = 0; a < 7; a++) for (let b = 0; b < 7; b++) {
        if (isOpen(a) && isOpen(b)) continue;
        const x0 = xs[a], x1 = xs[a + 1], z0 = xs[b], z1 = xs[b + 1];
        const slab = new T.Mesh(new T.BoxGeometry(x1 - x0, ROOF - CEIL, z1 - z0), plaster); slab.position.set((x0 + x1) / 2, (CEIL + ROOF) / 2, (z0 + z1) / 2); S.add(slab);
        const under = new T.Mesh(worldPlane(x0, z0, x1, z1, CEIL - 0.01, true, 4), ceilMat); under.userData.noCast = true; S.add(under);
      }
      // gilded reveals round each opening
      for (const i of [-1, 0, 1]) for (const j of [-1, 0, 1]) {
        const cx = i * BAY, cz = j * BAY;
        [[0, HALF + 0.03, 7.66, 0.06], [0, -HALF - 0.03, 7.66, 0.06], [HALF + 0.03, 0, 0.06, 7.66], [-HALF - 0.03, 0, 0.06, 7.66]].forEach(([dx, dz, lx, lz]) => {
          const m = new T.Mesh(new T.BoxGeometry(lx, 0.2, lz), gold); m.position.set(cx + dx, CEIL + 0.06, cz + dz); m.userData.noCast = true; S.add(m);
        });
      }
      // walls with arched windows of soft light
      wallTex.repeat.set(6, 1); wallGlow.repeat.set(6, 1);
      const wallMat = KIT.std({ map: wallTex, emissive: 0xffe8c0, emissiveMap: wallGlow, emissiveIntensity: 0.4, roughness: 0.7, relief: 0 });
      [[0, -HALL, 0], [0, HALL, Math.PI], [-HALL, 0, Math.PI / 2], [HALL, 0, -Math.PI / 2]].forEach(([x, z, ry]) => {
        const m = new T.Mesh(new T.PlaneGeometry(HALL * 2, ROOF), wallMat); m.position.set(x, ROOF / 2, z); m.rotation.y = ry; S.add(m);
        const back = new T.Mesh(new T.BoxGeometry(HALL * 2 + 2, ROOF + 0.5, 0.6), plaster); back.position.set(x * 1.0125 + (x ? Math.sign(x) * 0.0 : 0), ROOF / 2, z * 1.0125); back.rotation.y = ry; S.add(back);
      });
      // the outer roof and its rails, seen through the openings and in the arrival
      const roofTop = KIT.std({ map: KIT.plaster(w, [10, 10], '#ddd4c4'), roughness: 0.9 });
      const parapet = new T.Mesh(new T.BoxGeometry(HALL * 2 + 4, 1.0, HALL * 2 + 4), roofTop); parapet.position.set(0, ROOF - 0.6, 0); void parapet;
      const railMat = KIT.std({ color: 0x5a5650, metalness: 0.7, roughness: 0.4 });

      /* ---------- the nine domes ---------- */
      const capPts = []; for (let i = 0; i <= 20; i++) { const a = (i / 20) * Math.PI / 2; capPts.push(new T.Vector2(Math.max(0.01, Math.cos(a) * 3.95), Math.sin(a) * 2.3)); }
      const capGeoO = new T.LatheGeometry(capPts, 40);
      const outerMat = KIT.std({ map: KIT.plaster(w, [6, 2], '#d8d2c6'), roughness: 0.7 });
      const innerMat = KIT.std({ map: domeIn, side: T.BackSide, roughness: 0.55, relief: 0, envMapIntensity: 0.5 });
      const plate = new T.Shape(); plate.moveTo(-4.2, -4.2); plate.lineTo(4.2, -4.2); plate.lineTo(4.2, 4.2); plate.lineTo(-4.2, 4.2); plate.closePath();
      const hole = new T.Path(); hole.absarc(0, 0, 3.92, 0, Math.PI * 2, true); plate.holes.push(hole);
      const plateGeo = new T.ExtrudeGeometry(plate, { depth: 0.35, bevelEnabled: false, curveSegments: 32 }); plateGeo.rotateX(-Math.PI / 2);
      const ribGeo = new T.BoxGeometry(0.12, 0.12, 4.0);
      this.domes = [];
      this.rings = [];
      const ringTex = w.tex(256, (g, s) => {
        g.clearRect(0, 0, s, s); g.strokeStyle = 'rgba(255,230,170,1)'; g.lineWidth = 6; g.beginPath(); g.arc(s / 2, s / 2, s * 0.42, 0, 6.283); g.stroke();
        g.lineWidth = 2; g.beginPath(); g.arc(s / 2, s / 2, s * 0.36, 0, 6.283); g.stroke();
        for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; g.beginPath(); g.arc(s / 2 + Math.cos(a) * s * 0.42, s / 2 + Math.sin(a) * s * 0.42, 7, 0, 6.283); g.fillStyle = 'rgba(255,230,170,1)'; g.fill(); }
      });
      ringTex.wrapS = ringTex.wrapT = T.ClampToEdgeWrapping;
      for (const i of [-1, 0, 1]) for (const j of [-1, 0, 1]) {
        const cx = i * BAY, cz = j * BAY;
        const parts = [[plateGeo, mtx(0, 0, 0)], [capGeoO, mtx(0, 0.3, 0)]];
        for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; parts.push([ribGeo, new T.Matrix4().makeRotationY(a).multiply(mtx(0, 0.36, 0, 0, 0)).multiply(new T.Matrix4().makeTranslation(0, 0, 4.0 + 0.0).multiply(new T.Matrix4().makeScale(1, 1, 0.01)))]); }
        const g = new T.Group(); g.position.set(cx, ROOF, cz); g.userData.dynamic = true;
        const body = new T.Mesh(merge(parts.slice(0, 2)), outerMat); body.castShadow = true; g.add(body);
        const inner = new T.Mesh(capGeoO, innerMat); inner.position.y = 0.3; inner.scale.setScalar(0.985); g.add(inner);
        const fin = new T.Mesh(new T.SphereGeometry(0.22, 10, 8), gold); fin.position.y = 2.75; g.add(fin);
        S.add(g);
        // rails on the roof along which it rolls
        const center = i === 0 && j === 0;
        const dir = center ? [0, 1] : i !== 0 ? [i, 0] : [0, j];
        const lift = center ? 3.0 : 0;
        [-3.2, 3.2].forEach(o => {
          const along = dir[0] !== 0;
          const r = new T.Mesh(new T.BoxGeometry(along ? 16.4 : 0.14, 0.12, along ? 0.14 : 16.4), railMat);
          r.position.set(cx + dir[0] * 4 + (along ? 0 : o), ROOF + 0.06 + lift, cz + dir[1] * 4 + (along ? o : 0)); S.add(r);
          if (center) { [-1, 1].forEach(e => { const post = new T.Mesh(new T.BoxGeometry(0.2, lift, 0.2), railMat); post.position.set(cx + o, ROOF + lift / 2, cz + 8 + e * 4.1); S.add(post); }); }
        });
        // the sunlight through it: a shaft that leans away from the morning sun
        const pos = [];
        const x0 = cx - HALF, x1 = cx + HALF, z0 = cz - HALF, z1 = cz + HALF, sx = ROOF * SHIFT;
        const top = [[x0, ROOF, z0], [x1, ROOF, z0], [x1, ROOF, z1], [x0, ROOF, z1]], bot = top.map(([x, , z]) => [x - sx, 0.02, z]);
        for (let k = 0; k < 4; k++) { const a = top[k], b = top[(k + 1) % 4], c = bot[(k + 1) % 4], d = bot[k]; pos.push(...a, ...b, ...c, ...a, ...c, ...d); }
        const sg = new T.BufferGeometry(); sg.setAttribute('position', new T.BufferAttribute(new Float32Array(pos), 3));
        const smat = new T.ShaderMaterial({ vertexShader: SHAFT_VERT, fragmentShader: SHAFT_FRAG, uniforms: { uOp: { value: 0 }, uTime: { value: 0 } }, transparent: true, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide });
        const shaft = new T.Mesh(sg, smat); shaft.frustumCulled = false; shaft.userData.noCast = true; S.add(shaft);
        // a faint ring of gold on the carpet beneath it: stand here
        const ring = new T.Mesh(new T.PlaneGeometry(3.4, 3.4), new T.MeshBasicMaterial({ map: ringTex, color: 0xffd890, transparent: true, opacity: 0.4, depthWrite: false, blending: T.AdditiveBlending }));
        ring.rotation.x = -Math.PI / 2; ring.position.set(cx, 0.03, cz); ring.userData.dynamic = true; S.add(ring);
        this.domes.push({ i, j, cx, cz, correct: i === 0 || j === 0, k: 0, target: 0, g, dir, lift, shaft: smat, ring, was: 0 });
      }

      /* ---------- the star woven in gold into the carpet, in five pieces under the five right domes ---------- */
      const SZ = 26, starTex = w.tex(1024, (g, s) => {
        g.clearRect(0, 0, s, s);
        const m = s / SZ, cx = s / 2, cy = s / 2;
        const pts = [];
        for (let k = 0; k < 16; k++) { const a = k * Math.PI / 8; const r = k % 2 ? 2.9 : (k % 4 === 0 ? 11.2 : 5.0); pts.push([cx + Math.cos(a) * r * m, cy + Math.sin(a) * r * m]); }
        const path = () => { g.beginPath(); pts.forEach(([x, y], k) => (k ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); };
        path(); g.fillStyle = '#b08436'; g.fill();
        g.save(); path(); g.clip();
        g.strokeStyle = 'rgba(255,230,160,0.35)'; g.lineWidth = 2;
        for (let i = -s; i < s * 2; i += 9) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i - s, s); g.stroke(); g.beginPath(); g.moveTo(i - s, 0); g.lineTo(i, s); g.stroke(); }
        g.fillStyle = '#e0bb6a'; U.star8(g, cx, cy, 2.4 * m, 0.765, 0); g.fill();
        g.fillStyle = '#7a1418'; U.star8(g, cx, cy, 1.5 * m, 0.765, 0.39); g.fill();
        g.fillStyle = '#e8c878'; g.beginPath(); g.arc(cx, cy, 0.55 * m, 0, 6.283); g.fill();
        for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2; for (let d = 4.2; d < 10.5; d += 1.3) { g.fillStyle = '#e8c878'; U.star8(g, cx + Math.cos(a) * d * m, cy + Math.sin(a) * d * m, (0.42 - d * 0.025) * m, 0.6, 0); g.fill(); } }
        g.restore();
        path(); g.strokeStyle = '#f2d080'; g.lineWidth = 0.32 * m; g.lineJoin = 'round'; g.stroke();
        path(); g.strokeStyle = 'rgba(40,6,8,0.85)'; g.lineWidth = 0.08 * m; g.stroke();
      });
      starTex.wrapS = starTex.wrapT = T.ClampToEdgeWrapping;
      this.tiles = [];
      this.domes.filter(d => d.correct).forEach(d => {
        const px = d.cx - OFF, pz = d.cz, half = BAY / 2;
        const g = new T.PlaneGeometry(BAY, BAY); g.rotateX(-Math.PI / 2); g.translate(px, 0.025, pz);
        const p = g.attributes.position, uv = g.attributes.uv;
        for (let k = 0; k < p.count; k++) uv.setXY(k, (p.getX(k) + OFF) / SZ + 0.5, 0.5 - p.getZ(k) / SZ);
        const mat = new T.MeshStandardMaterial({ map: starTex, alphaTest: 0.35, metalness: 0.6, roughness: 0.4, emissive: 0xffc860, emissiveMap: starTex, emissiveIntensity: 0.05, polygonOffset: true, polygonOffsetFactor: -2, envMapIntensity: 0.25 });
        const m = new T.Mesh(g, mat); m.userData.dynamic = true; m.userData.noCast = true; S.add(m);
        d.tile = mat; this.tiles.push(mat); void half;
      });

      // dust that only shows where the light falls
      this.dust = KIT.dust(w, 900, [-16, 0.3, -12, 10, 7.4, 12], 0xfff0d0, 0.05); this.dust.material.opacity = 0.35; S.add(this.dust);

      // doves, for the end: they cross the open sky above the hall
      const bg = new T.BufferGeometry();
      bg.setAttribute('position', new T.BufferAttribute(new Float32Array([-0.42, 0.14, 0.04, 0, 0, -0.14, 0, 0, 0.16, 0.42, 0.14, 0.04, 0, 0, -0.14, 0, 0, 0.16, 0, 0, -0.14, 0, 0.03, 0.34, 0, 0, 0.16]), 3));
      bg.computeVertexNormals();
      this.doveMesh = new T.InstancedMesh(bg, new T.MeshStandardMaterial({ color: 0xf2efe8, side: T.DoubleSide, roughness: 0.8 }), 16);
      this.doveMesh.frustumCulled = false; this.doveMesh.userData.dynamic = true; this.doveMesh.count = 0; S.add(this.doveMesh);
      this.doves = Array.from({ length: 16 }, (_, i) => ({ x: -40 - i * 3.2 - Math.random() * 6, y: 11 + Math.random() * 5, z: -10 + Math.random() * 20, v: 6 + Math.random() * 3, ph: Math.random() * 6, dz: (Math.random() - 0.5) * 1.2 }));

      w.receiveAll();
      S.traverse(o => { if (o.isMesh && o.userData.noCast) o.castShadow = false; });
      ungroup(S);
      this.baked = w.bake();

      /* ---------- the one interaction: the dome above you ---------- */
      this.item = w.interact({
        key: 'dome', pos: [0, 1.6, 0], r: 3,
        label: () => { const d = self.under(); return d && d.target ? 'Roll the dome back' : 'Roll the dome aside'; },
        enabled: () => { const d = self.under(); return !!d && self.reveal < 0 && Math.abs(d.k - d.target) < 0.001; },
        onUse: () => self.toggle(env, self.under()),
      });
      w.activity('Open the sky', 5, 'Stand under a dome and press E to roll it aside. Let the sunlight fill the golden star.');

      /* ---------- sound: room, rumble of the rails, the outside coming in, a growing chord ---------- */
      const b = env.bus;
      this.room = SND.noise(b, { color: 'brown', type: 'lowpass', freq: 260, gain: 0.05 });
      this.murmur = SND.noise(b, { color: 'pink', type: 'bandpass', freq: 520, q: 1.4, gain: 0.012 });
      SND.lfo(b, this.murmur.filter && this.murmur.filter.frequency, 0.17, 90);
      this.rumble = SND.noise(b, { color: 'brown', type: 'lowpass', freq: 110, q: 1.2, gain: 0 });
      this.outside = SND.noise(b, { color: 'pink', type: 'highpass', freq: 1800, gain: 0 });
      this.voices = CHORD.map((f, i) => SND.drone(b, f, { gain: 0, vowel: i < 2 ? 'u' : 'o', pan: (i - 2) * 0.3 }));
      this.hum = SND.drone(b, 155.56, { gain: 0, vowel: 'm' });
      this.birdClock = 2; this.murClock = 4;

      /* ---------- arrival: on the roof among the domes as one rolls aside, then down through it ---------- */
      const c0 = this.domes.find(d => d.i === 0 && d.j === 0);
      c0.target = 1; c0.cine = true;
      w.cinematic([
        { p: [27, 17, 30], l: [0, 8.5, 0] },
        { p: [19, 13.5, 17], l: [0, 9, 0] },
        { p: [8, 12.5, 6], l: [0, 8, 1] },
        { p: [0.6, 12.0, 1.2], l: [-2.5, 0, -0.6] },
        { p: [0.8, 6.0, 2.5], l: [-4, 1.0, -1.5] },
        { p: [2.5, 2.6, 10], l: [-2, 1.2, -2] },
        { p: [3, 1.62, 15], l: [3, 1.62, 5] },
      ], 10.5);
    },

    under() {
      const w = this.w; if (!w) return null;
      return this.domes.find(d => Math.abs(w.pos.x - d.cx) < HALF && Math.abs(w.pos.z - d.cz) < HALF) || null;
    },

    toggle(env, d) {
      if (!d) return;
      const w = this.w;
      d.target = d.target ? 0 : 1;
      // answer at once: the rail takes the weight with a low knock, the ring flares
      SND.thump(env.bus, { f: 42, gain: 0.35, dur: 1.2 });
      SND.knock(env.bus, { f: 70, gain: 0.25, click: 300 });
      d.flare = 1;
      if (!this.cards.domes && d.target) {
        this.cards.domes = true;
        w.say('Twenty-seven Domes', 'The roof of the prayer hall holds 27 domes that roll aside on rails. Each is about 18 by 18 metres and weighs some 80 tonnes. They came with the great expansion of King Fahd, begun in 1984–85 and completed in the early 1990s, and open the hall to the sky in the cool of the day.', { ms: 13000 });
      }
    },

    evaluate(env) {
      const w = this.w;
      const right = this.domes.filter(d => d.correct && d.target && d.k > 0.999).length;
      const wrong = this.domes.filter(d => !d.correct && d.target && d.k > 0.999).length;
      const moving = this.domes.some(d => Math.abs(d.k - d.target) > 0.001);
      let step;
      if (wrong) step = wrong > 1 ? `${wrong} squares of light fall on the red carpet, outside the star. Roll those domes back.` : 'One square of light falls on the red carpet, outside the star. Roll that dome back.';
      else if (right < 5) step = right ? (right === 1 ? 'Part of the star is in light. Which other domes would light its points?' : `${right} of the star’s five parts are in light. Which domes would light the rest?`) : 'Stand under a dome and press E to roll it aside.';
      else step = 'The star is complete.';
      w.progress(right, step);
      if (right === 2 && !this.cards.history) {
        this.cards.history = true;
        w.say('Mud Brick and Palm', 'The first mosque on this ground was a courtyard of mud brick with a roof of palm fronds on palm-trunk pillars. Over fourteen centuries it has been rebuilt and enlarged many times, until its roof could open to the sky.', { ms: 11000 });
      }
      if (right === 4 && !this.cards.star) this.starCard();
      if (right === 5 && !wrong && !moving && this.reveal < 0) this.reveal = 0;
    },

    starCard() {
      this.cards.star = true;
      this.w.say('The Star and the Cross', 'Look up: the ceiling is laid with eight-pointed stars, each made of two squares turned against each other, and between them the shapes of crosses. The star-and-cross is one of the oldest patterns in Islamic art.', { ms: 11000 });
    },

    update(env, dt) {
      const w = this.w; if (!w) return;
      // keep the dome prompt in front of you while you stand under a dome
      const f = w.forward();
      this.item.pos.set(w.pos.x + f.x, w.y + w.eye + f.y, w.pos.z + f.z);
      w.update(dt);
      const t = w.time;
      if (!this.cards.star && w.pitch > 0.75 && !this.under() && !w.cine) this.starCard();

      let movingN = 0, openSum = 0;
      for (const d of this.domes) {
        const before = d.k;
        const rate = d.cine ? 1 / 4 : 1 / 5;
        d.k += U.clamp(d.target - d.k, -dt * rate, dt * rate);
        if (Math.abs(d.k - before) > 1e-6) {
          movingN += U.smooth(14, 2, Math.hypot(d.cx - w.pos.x, d.cz - w.pos.z)) * 0.7 + 0.3;
          if (Math.abs(d.k - d.target) < 1e-6) this.settle(env, d);
        }
        const e = U.ease(d.k);
        if (d.lift) {
          const up = U.smooth(0, 0.3, d.k), slide = U.ease(U.clamp((d.k - 0.3) / 0.7));
          d.g.position.set(d.cx, ROOF + up * d.lift, d.cz + slide * BAY);
        } else d.g.position.set(d.cx + d.dir[0] * e * BAY, ROOF + Math.sin(e * Math.PI) * 0.05, d.cz + d.dir[1] * e * BAY);
        const light = d.lift ? U.clamp((d.k - 0.3) / 0.7) : U.clamp((d.k - 0.02) / 0.98);
        d.light = light;
        openSum += light;
        d.shaft.uniforms.uOp.value = 0.11 * U.ease(light) * (1 + (this.blaze || 0) * 0.8);
        d.shaft.uniforms.uTime.value = t;
        d.flare = Math.max(0, (d.flare || 0) - dt * 1.5);
        const under = this.under() === d;
        d.ring.material.opacity = (0.22 + 0.12 * Math.sin(t * 1.4 + d.i + d.j * 2) + (under ? 0.25 : 0) + d.flare * 0.6) * (1 - light * 0.6) * (this.reveal >= 0 ? 0.3 : 1);
        d.ring.material.color.setHex(d.target && !d.correct && d.k > 0.99 ? 0xd8d4cc : 0xffd890);
        if (d.tile) d.tile.emissiveIntensity = 0.05 + U.ease(light) * 0.3 + (this.blaze || 0) * 1.2;
      }
      // the outside comes in as the roof opens
      this.rumble.set('gain', Math.min(0.22, movingN * 0.12), 0.25);
      if (movingN > 0 && Math.random() < dt * 3) SND.knock(env.bus, { f: U.rnd(50, 80), gain: 0.05 * Math.min(1, movingN), click: 400 });
      const quiet = this.reveal >= 0 ? U.smooth(0, 1.0, this.reveal) * (1 - U.smooth(2.5, 7, this.reveal)) : 0;
      this.outside.set('gain', (0.004 + openSum * 0.003) * (1 - quiet), 0.8);
      this.room.set('gain', 0.05 * (1 - quiet * 0.8), 0.6);
      this.murmur.set('gain', 0.012 * (1 - quiet), 0.6);
      KIT.driftDust(this.dust, dt, t, [-0.05, 0.02]);
      this.dust.material.opacity = 0.12 + openSum * 0.05 + (this.blaze || 0) * 0.3;

      this.birdClock -= dt;
      if (this.birdClock < 0) { this.birdClock = 2 + Math.random() * 4 / (1 + openSum * 0.4); if (quiet < 0.2) (Math.random() < 0.6 ? SND.coo(env.bus, { gain: 0.012 + openSum * 0.006, pan: U.rnd(-0.7, 0.7) }) : SND.chirp(env.bus, { gain: 0.006 + openSum * 0.003, pan: U.rnd(-0.7, 0.7) })); }
      this.murClock -= dt;
      if (this.murClock < 0) { this.murClock = 6 + Math.random() * 8; if (quiet < 0.2) SND.sing(env.bus, U.pick([110, 123.47, 98]), { vowel: 'm', dur: 3.5, gain: 0.006, voices: 3, pan: U.rnd(-0.8, 0.8), attack: 1.2, breath: 0.12 }); }

      // revelation: hush, then the star blazes, doves cross the open sky, a choir rises
      if (this.reveal >= 0) {
        const r0 = this.reveal, r1 = (this.reveal += dt);
        const cross = s => r0 < s && r1 >= s;
        if (cross(0.01)) { this.voices.forEach(v => v.setGain(0.002, 0.8)); }
        this.blaze = U.smooth(1.4, 4.5, r1);
        if (cross(1.2)) {
          // rise into the height of the hall to see the whole star in light, then come back down
          const e = [w.pos.x, w.y + w.eye, w.pos.z];
          w.cinematic([
            { p: e, l: [-OFF, 0.5, 0] },
            { p: [w.pos.x * 0.5 + 4, 5.2, w.pos.z * 0.5 + 9], l: [-OFF, 0, 0] },
            { p: [-OFF + 5, 7.1, 7.5], l: [-OFF, 0, -0.5] },
            { p: [-OFF + 4, 7.1, 5], l: [-OFF, 0, -0.5] },
            { p: [w.pos.x * 0.6 + 2, 4, w.pos.z * 0.6 + 6], l: [-OFF, 0, 0] },
            { p: e, l: [-OFF, 1, 0] },
          ], 11);
        }
        if (cross(1.4)) {
          SND.glow(env.bus, 146.83, { gain: 0.08, dur: 12 }); SND.glow(env.bus, 220, { gain: 0.05, dur: 11, delay: 1 });
          SND.sing(env.bus, 587.33, { vowel: 'a', dur: 7, delay: 2.2, gain: 0.03, voices: 4, attack: 2.5 });
          SND.sing(env.bus, 739.99, { vowel: 'o', dur: 6, delay: 3.4, gain: 0.02, voices: 3, attack: 2 });
        }
        if (cross(2.2)) { this.doveMesh.count = this.doves.length; for (let k = 0; k < 16; k++) SND.swell(env.bus, { color: 'white', type: 'bandpass', f0: 900, f1: 2200, dur: 0.09, gain: 0.03, delay: 1.5 + k * 0.07, q: 1.5, pan: U.rnd(-0.6, 0.6) }); }
        if (cross(3.2)) w.say('Open to the Sky', 'The first mosque here was a courtyard under the open sky, shaded with palm fronds. Now, in the cool of the morning, the domes roll back and the sky returns to the prayer hall, and the light falls where you placed it.', { ms: 13000 });
        if (cross(5)) { w.finish('The sky is open'); this.voices.forEach((v, i) => v.setGain([0.014, 0.011, 0.009, 0.007, 0.006][i], 3)); }
        w.renderer.toneMappingExposure = 1.0 + this.blaze * 0.06;
      }
      if (this.doveMesh.count) {
        const M = new T.Matrix4(), Q = new T.Quaternion(), V = new T.Vector3(), Sc = new T.Vector3();
        this.doves.forEach((d, k) => {
          d.x += d.v * dt; d.z += d.dz * dt; d.y += Math.sin(t * 0.8 + d.ph) * 0.4 * dt;
          if (d.x > 60) d.x = -60 - Math.random() * 20;
          Q.setFromAxisAngle(V.set(0, 1, 0), -Math.PI / 2 + Math.atan2(d.dz, d.v));
          const fl = Math.sin(t * 16 + d.ph);
          M.compose(V.set(d.x, d.y, d.z), Q, Sc.set(1.4, fl * 1.4, 1.4)); this.doveMesh.setMatrixAt(k, M);
        });
        this.doveMesh.instanceMatrix.needsUpdate = true;
      }
    },

    // a dome comes to rest: the world answers in light and voice
    settle(env, d) {
      const w = this.w;
      SND.thump(env.bus, { f: 36, gain: 0.3, dur: 1.4 });
      if (d.cine) { d.cine = false; this.evaluate(env); this.voices[0].setGain(0.012, 2); return; }
      if (d.target) {
        if (d.correct) {
          const n = this.domes.filter(x => x.correct && x.target && (x === d || x.k > 0.999)).length;
          SND.sing(env.bus, CHORD[Math.min(4, n - 1)] * 2, { vowel: 'a', dur: 3.2, gain: 0.035, voices: 2, attack: 0.6 });
        } else {
          SND.sing(env.bus, 155.56, { vowel: 'm', dur: 2.6, gain: 0.03, voices: 1, attack: 0.4 });
        }
      } else SND.swell(env.bus, { color: 'brown', type: 'lowpass', f0: 200, f1: 90, dur: 1.4, gain: 0.08 });
      this.evaluate(env);
      // the chord grows with each point of the star in light; a stray patch adds a low hum
      const right = this.domes.filter(x => x.correct && x.target && x.k > 0.999).length;
      const wrong = this.domes.filter(x => !x.correct && x.target && x.k > 0.999).length;
      this.voices.forEach((v, i) => v.setGain(i < right ? [0.012, 0.01, 0.008, 0.007, 0.006][i] : 0, 1.5));
      this.hum.setGain(wrong * 0.006, 1.2);
      void w;
    },
  }));
})();
