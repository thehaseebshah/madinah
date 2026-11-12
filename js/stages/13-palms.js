/* Station — The Palms of al-'Aliyah (walkable).
   Feeling: gratitude for provision. A dense grove at golden hour: long shafts of low sun through
   the fronds, channels of water glinting between the rows, dust turning gold in the air.
   The wind is still yours: run past the palms and their crowns bend and hiss. Shake a laden palm
   (E) and its dates fall; stand where the ring of light shows each will land and catch it in your
   basket. Seven 'ajwa, then the words about them are written in light toward the sun.
   Colour script: amber and umber, with ivory light reserved for the laden palms, the catch rings
   and the revelation. */
(function () {
  'use strict';
  if (!window.WORLD) return;
  // one material per mesh here, so geometry groups only stop the bake from merging
  const ungroup = S => S.traverse(o => { if (o.isMesh && !Array.isArray(o.material) && o.geometry.groups.length > 1) o.geometry.clearGroups(); });
  const T = THREE;
  const SUN = new T.Vector3(-0.3, 0.25, -0.92).normalize();
  const G = 7.0, CATCH_Y = 1.05, CATCH_R = 0.72;
  const SCALE = [392, 440, 493.88, 587.33, 659.25, 739.99, 783.99];
  const CHAN_X = 0;
  const CROSS_Z = [17.5, -3.5, -24.5];
  const WELL = { x: 0, z: -33 };

  /* Palms that bend: every palm material gets the same vertex displacement, driven by the breeze,
     the gusts, the walker running past, and a laden palm being shaken. The grove is baked into a
     few meshes in world space, so the displacement can be computed from world position alone. */
  const SW = {
    uTime: { value: 0 },
    uWind: { value: new T.Vector4(0.55, 0.83, 0, 0) },      // xy direction, z gust
    uPlayer: { value: new T.Vector4(0, 0, 0, 4.5) },         // x, z, strength, radius
    uShake: { value: Array.from({ length: 6 }, () => new T.Vector4(0, 0, 0, 0)) },
  };
  const SWAY_GLSL = `
uniform float uTime; uniform vec4 uWind; uniform vec4 uPlayer; uniform vec4 uShake[6];
vec3 swayOff(vec3 p){
  float h = max(p.y, 0.0); float k = h*h/64.0;
  float ph = dot(p.xz, vec2(0.071, 0.053));
  float breeze = sin(uTime*0.9 + ph*6.0)*0.10 + sin(uTime*2.3 + ph*13.0)*0.035;
  vec2 off = uWind.xy*(breeze + uWind.z*(0.75 + 0.25*sin(uTime*3.1 + ph*9.0)));
  vec2 dp = p.xz - uPlayer.xy; float dl = length(dp) + 1e-3;
  off += dp/dl * uPlayer.z * exp(-dl*dl/(uPlayer.w*uPlayer.w)) * (0.8 + 0.3*sin(uTime*6.0 + ph*20.0));
  for (int i = 0; i < 6; i++) {
    vec4 s = uShake[i];
    if (s.z <= 0.0) continue;
    vec2 d = p.xz - s.xy; float q = exp(-dot(d, d)/7.0);
    off += vec2(sin(uTime*19.0 + p.y*0.8), cos(uTime*14.0 + p.y*1.3))*s.z*q*0.32;
  }
  return vec3(off.x, -length(off)*0.18, off.y)*k;
}`;
  function swayify(mat) {
    mat.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, SW);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\n' + SWAY_GLSL)
        .replace('#include <begin_vertex>', '#include <begin_vertex>\ntransformed += swayOff(transformed);');
    };
    mat.customProgramCacheKey = () => 'palm-sway';
    return mat;
  }

  const WATER_VERT = `varying vec3 vW; varying float vD; void main(){ vec4 wp = modelMatrix*vec4(position,1.); vW = wp.xyz; vec4 mv = viewMatrix*wp; vD = -mv.z; gl_Position = projectionMatrix*mv; }`;
  const WATER_FRAG = `
uniform float uTime; uniform vec3 uSun; uniform vec3 uFog; uniform float uFogD; uniform vec3 uSky; uniform vec3 uHor;
varying vec3 vW; varying float vD;
void main(){
  vec2 p = vW.xz; vec2 g = vec2(0.);
  g += vec2(0.2, 1.0)*cos(dot(p, vec2(0.2, 1.0))*7.0 - uTime*3.0)*0.05;
  g += vec2(1.0, 0.3)*cos(dot(p, vec2(1.0, 0.3))*11.0 - uTime*4.1)*0.035;
  g += vec2(-0.7, 0.7)*cos(dot(p, vec2(-0.7, 0.7))*17.0 + uTime*5.3)*0.02;
  vec3 n = normalize(vec3(-g.x, 1., -g.y));
  vec3 v = normalize(cameraPosition - vW);
  vec3 rf = reflect(-v, n);
  float fres = 0.04 + 0.96*pow(1. - max(dot(n, v), 0.), 5.);
  vec3 sky = mix(uHor, uSky, clamp(rf.y*1.5, 0., 1.));
  float s = max(dot(rf, uSun), 0.);
  vec3 col = mix(vec3(0.05, 0.045, 0.03), sky, fres) + vec3(1.0, 0.86, 0.6)*(pow(s, 300.)*6. + pow(s, 30.)*0.35);
  float f = 1. - exp(-uFogD*vD);
  gl_FragColor = vec4(mix(col, uFog, f), 1.);
}`;

  ENGINE.register(WORLD.stage({
    key: 'palms',
    arabic: 'نخيل العالية',
    title: 'The Palm Groves',
    era: 'Ajwa dates of al-‘Aliyah',
    hint: 'WASD to walk · Shift to run through the palms · E at a laden palm · stand in the ring to catch',
    sound: { reverb: 0.3 },
    story: `<p>Madinah was an oasis long before it was a city: palm gardens fed by wells, threaded with channels of water. The groves of al-‘Aliyah, on the higher ground to the south, are still famous for <i>‘ajwa</i>, a small, soft, nearly black date.</p>
            <p class="q"><span class="ar">مَنْ تَصَبَّحَ كُلَّ يَوْمٍ سَبْعَ تَمَرَاتٍ عَجْوَةً لَمْ يَضُرَّهُ فِي ذَلِكَ الْيَوْمِ سُمٌّ وَلَا سِحْرٌ</span>“Whoever has seven ‘ajwa dates in the morning will not be harmed that day by poison or magic.” (Sahih al-Bukhari 5445; Sahih Muslim 2047)</p>
            <p>Run through the grove and the palms bend in your wind. Shake a laden palm, stand where the light shows each date will fall, and gather seven in your basket.</p>`,

    enter(env) {
      const self = this;
      const fogCol = new T.Color(0xd8a46e);
      const w = this.w = WORLD.create(env, {
        start: { x: 1.7, z: 13, yaw: -0.35, pitch: 0.05 }, exposure: 1.08, far: 1400,
        fog: { color: fogCol, density: 0.017 },
        bounds: [-42, -46, 42, 27],
        surface: (x, z) => (Math.abs(x - CHAN_X) < 0.4 || CROSS_Z.some(c => Math.abs(z - c) < 0.4) ? 'water' : 'sand'),
      });
      const S = w.scene;
      this.caught = 0; this.dates = []; this.rings = []; this.gust = 0; this.gustClock = 4; this.reveal = -1;
      SW.uTime.value = 0; SW.uWind.value.z = 0; SW.uShake.value.forEach(v => v.set(0, 0, 0, 0));

      w.sky({ top: '#5f7cab', mid: '#f0b878', bot: '#7a5236', sunDir: SUN.toArray(), sun: '#ffcf8a', sunSize: 0.004 });
      const haze = KIT.glow(w, 0xffc070, 420, 0.32); haze.position.copy(SUN).multiplyScalar(900); haze.material.fog = false; S.add(haze);
      S.add(new T.HemisphereLight(0xffd6a6, 0x5a3e28, 0.62));
      const sun = new T.DirectionalLight(0xffbf78, 2.7); sun.position.copy(SUN).multiplyScalar(80); S.add(sun);
      w.followShadow(sun, 30, 2048);
      sun.shadow.bias = -0.0012;

      // earth: dusty soil, with the shade of leaf litter
      const soil = new T.Mesh(new T.PlaneGeometry(220, 220), KIT.std({ map: KIT.sand(w, [60, 60]), color: 0xa88462, relief: 0.03 }));
      soil.rotation.x = -Math.PI / 2; soil.position.z = -10; S.add(soil);

      /* ---------- the grove ---------- */
      const parts = KIT.palmParts(w);
      swayify(parts.trunkMat); swayify(parts.frondMat);
      // light through the leaves: fronds glow a little warm, as if backlit by the low sun
      parts.frondMat.emissive = new T.Color(0x4a3a10); parts.frondMat.emissiveIntensity = 0.22;
      const r = U.seeded(1447);
      this.palms = [];
      const ladenAt = [[7.6, 9], [-6.2, 3], [7.6, -4], [-12.8, -10], [3.6, -15], [-4, -21]];
      const plant = (x, z, laden) => {
        const h = laden >= 0 ? 6.8 + r() * 0.6 : 7.5 + r() * 4.5;
        const p = KIT.palm(w, h, { lean: laden >= 0 ? 0.08 : (r() - 0.5) * 0.35, fronds: 18, frondScale: laden >= 0 ? 1.3 : 1.25 + r() * 0.3 });
        p.position.set(x, 0, z); p.rotation.y = r() * 6.28; S.add(p);
        p.updateMatrixWorld(true);
        const top = p.userData.top.clone().applyMatrix4(p.matrixWorld);
        this.palms.push({ x, z, h, top, laden, obj: p });
        w.addCircle(x, z, 0.36);
      };
      ladenAt.forEach(([x, z], k) => plant(x, z, k));
      for (let i = 0; i < 13; i++) for (let j = 0; j < 12; j++) {
        let x = -35.75 + i * 6 + (r() - 0.5) * 1.4, z = 25 - j * 6.2 + (r() - 0.5) * 1.4;
        if (Math.abs(x - CHAN_X) < 1.6) x += x < CHAN_X ? -1.2 : 1.2;
        if (CROSS_Z.some(c => Math.abs(z - c) < 1.5)) continue;
        if (Math.hypot(x - WELL.x, z - WELL.z) < 4) continue;
        if (ladenAt.some(([lx, lz]) => Math.hypot(lx - x, lz - z) < 3.6)) continue;
        if (Math.hypot(x - 1.7, z - 13) < 2) continue;
        plant(x, z, -1);
      }
      // ensure each laden spot has its palm
      this.laden = [];
      this.palms.filter(p => p.laden >= 0).forEach(p => this.laden.push(p));

      // date clusters: orange strands from the crown, heavy with dark 'ajwa
      const stalkMat = swayify(KIT.std({ color: 0xd8902e, roughness: 0.7 }));
      const dateMat = swayify(KIT.std({ color: 0x2a140c, roughness: 0.38, metalness: 0.05 }));
      const dateGeo = new T.SphereGeometry(0.05, 7, 5); dateGeo.scale(1, 1.45, 1);
      this.laden.forEach((p, li) => {
        p.clusters = [];
        for (let c = 0; c < 4; c++) {
          const a = c * 1.57 + r() * 0.6, ca = Math.cos(a), sa = Math.sin(a);
          const A = p.top.clone().add(new T.Vector3(0, -0.25, 0));
          const B = A.clone().add(new T.Vector3(ca * 0.55, 0.1, sa * 0.55));
          const C = A.clone().add(new T.Vector3(ca * 0.8, -0.9, sa * 0.8));
          const stalk = new T.Mesh(new T.TubeGeometry(new T.QuadraticBezierCurve3(A, B, C), 8, 0.04, 5, false), stalkMat); S.add(stalk);
          for (let k = 0; k < 26; k++) {
            const t = k / 26, rad = 0.06 + t * 0.2;
            const d = new T.Mesh(dateGeo, dateMat);
            const aa = k * 2.39;
            d.position.set(C.x + Math.cos(aa) * rad, C.y - t * 0.75 + (r() - 0.5) * 0.08, C.z + Math.sin(aa) * rad);
            d.rotation.set(r() * 0.6, 0, r() * 0.6);
            S.add(d);
          }
          p.clusters.push(C.clone().add(new T.Vector3(0, -0.4, 0)));
          // strands
          for (let k = 0; k < 5; k++) {
            const aa = k * 1.25;
            const s2 = new T.Mesh(new T.CylinderGeometry(0.008, 0.008, 0.8, 3), stalkMat);
            s2.position.set(C.x + Math.cos(aa) * 0.08, C.y - 0.35, C.z + Math.sin(aa) * 0.08); s2.rotation.set(Math.sin(aa) * 0.3, 0, Math.cos(aa) * 0.3); S.add(s2);
          }
        }
        // ivory light on the laden crown: the goal is the brightest thing in the grove
        p.glow = KIT.glow(w, 0xfff0d4, 3.6, 0.32); p.glow.position.copy(p.top).add(new T.Vector3(0, -0.8, 0)); S.add(p.glow);
        p.baseGlow = KIT.glow(w, 0xfff0d4, 2.2, 0.0); p.baseGlow.position.set(p.x, 0.15, p.z); S.add(p.baseGlow);
        p.cool = 0; p.shakeI = li; p.shake = 0;
      });

      // fallen fronds and a green under-crop along the water
      const dryTex = w.tex(256, (g, sz) => {
        g.clearRect(0, 0, sz, sz); const mid = sz / 2;
        g.strokeStyle = '#8a6a3c'; g.lineWidth = 3; g.beginPath(); g.moveTo(0, mid); g.lineTo(sz, mid); g.stroke();
        for (let i = 4; i < 60; i++) {
          const x = (i / 60) * sz, L = (Math.sin((i / 60) * Math.PI) * 0.85 + 0.15) * mid * 0.9, c = 150 + Math.random() * 60;
          g.strokeStyle = `rgb(${c | 0},${c * 0.78 | 0},${c * 0.5 | 0})`; g.lineWidth = 2.4;
          g.beginPath(); g.moveTo(x, mid); g.lineTo(x + L * 0.45, mid - L); g.stroke(); g.beginPath(); g.moveTo(x, mid); g.lineTo(x + L * 0.45, mid + L); g.stroke();
        }
      });
      const dryMat = KIT.std({ map: dryTex, alphaTest: 0.45, side: T.DoubleSide, roughness: 1 });
      for (let i = 0; i < 60; i++) {
        const f = new T.Mesh(parts.fg, dryMat);
        f.position.set(U.rnd(-36, 36), 0.04, U.rnd(-44, 25)); f.rotation.set(-Math.PI / 2 + U.rnd(-0.08, 0.08), 0, r() * 6.28);
        f.scale.setScalar(0.8 + r() * 0.4); S.add(f);
      }
      // each palm stands in its own basin of damp earth, ringed by a low bank
      const bankMat = KIT.std({ map: KIT.sand(w, [2, 2]), color: 0x8a6446, relief: 0.03 });
      const dampMat = KIT.std({ map: KIT.sand(w, [2, 2]), color: 0x6a4a34, roughness: 1, relief: 0 });
      const cropMat = dampMat;
      const bankGeo = new T.TorusGeometry(1.15, 0.16, 5, 18); bankGeo.rotateX(Math.PI / 2); bankGeo.scale(1, 0.45, 1);
      const dampGeo = new T.CircleGeometry(1.1, 18); dampGeo.rotateX(-Math.PI / 2);
      this.palms.forEach((p, i) => {
        const bk = new T.Mesh(bankGeo, bankMat); bk.position.set(p.x, 0.02, p.z); S.add(bk);
        const dm = new T.Mesh(dampGeo, dampMat); dm.position.set(p.x, 0.012 + (i % 4) * 0.001, p.z); S.add(dm);
      });

      /* ---------- water: the channels and the well that feeds them ---------- */
      this.waterMat = new T.ShaderMaterial({
        vertexShader: WATER_VERT, fragmentShader: WATER_FRAG,
        uniforms: { uTime: { value: 0 }, uSun: { value: SUN }, uFog: { value: fogCol }, uFogD: { value: 0.017 }, uSky: { value: new T.Color(0x7a90b8) }, uHor: { value: new T.Color(0xf6c486) } },
      });
      const mud = KIT.std({ map: KIT.mudBrick(w, [6, 0.3]), color: 0x8a6448, relief: 0.02 });
      const channel = (x0, z0, x1, z1) => {
        const lx = Math.abs(x1 - x0), lz = Math.abs(z1 - z0), along = lx > lz;
        const water = new T.Mesh(new T.PlaneGeometry(along ? lx : 0.62, along ? 0.62 : lz), this.waterMat);
        water.rotation.x = -Math.PI / 2; water.position.set((x0 + x1) / 2, 0.035, (z0 + z1) / 2); S.add(water);
        [-1, 1].forEach(s => {
          const b = new T.Mesh(new T.BoxGeometry(along ? lx : 0.26, 0.14, along ? 0.26 : lz), mud);
          b.position.set((x0 + x1) / 2 + (along ? 0 : s * 0.44), 0.06, (z0 + z1) / 2 + (along ? s * 0.44 : 0)); S.add(b);
        });
      };
      channel(CHAN_X, WELL.z + 1.2, CHAN_X, 27);
      CROSS_Z.forEach(z => { channel(-40, z, CHAN_X - 0.6, z); channel(CHAN_X + 0.6, z, 40, z); });
      // the well: a ring of basalt, a frame of palm wood, a stone trough
      const wellStone = KIT.std({ map: KIT.plaster(w, [3, 1], '#c8a882'), color: 0xd8c0a0 });
      const ring = new T.Mesh(new T.CylinderGeometry(1.1, 1.2, 0.9, 20, 1, true), wellStone); ring.position.set(WELL.x, 0.45, WELL.z); S.add(ring);
      const ringIn = new T.Mesh(new T.CylinderGeometry(0.9, 0.9, 0.9, 20, 1, true), wellStone); ringIn.position.copy(ring.position); S.add(ringIn);
      const lip = new T.Mesh(new T.TorusGeometry(1.0, 0.16, 6, 20), wellStone); lip.rotation.x = Math.PI / 2; lip.position.set(WELL.x, 0.9, WELL.z); S.add(lip);
      const deep = new T.Mesh(new T.CircleGeometry(0.9, 20), new T.MeshBasicMaterial({ color: 0x080604 })); deep.rotation.x = -Math.PI / 2; deep.position.set(WELL.x, 0.3, WELL.z); S.add(deep);
      const wood = KIT.std({ map: KIT.wood(w, [1, 2], '#6e4a2c'), color: 0xc0a080 });
      [-1.3, 1.3].forEach(dx => { const post = new T.Mesh(new T.BoxGeometry(0.18, 2.6, 0.18), wood); post.position.set(WELL.x + dx, 1.3, WELL.z); S.add(post); });
      const bar = new T.Mesh(new T.CylinderGeometry(0.08, 0.08, 2.9, 8), wood); bar.rotation.z = Math.PI / 2; bar.position.set(WELL.x, 2.5, WELL.z); S.add(bar);
      const wheel = new T.Mesh(new T.TorusGeometry(0.25, 0.05, 6, 14), wood); wheel.position.set(WELL.x, 2.5, WELL.z); wheel.rotation.y = Math.PI / 2; S.add(wheel);
      const trough = new T.Mesh(new T.BoxGeometry(1.0, 0.4, 1.4), wellStone); trough.position.set(WELL.x, 0.2, WELL.z + 1.6); S.add(trough);
      w.addCircle(WELL.x, WELL.z, 1.3);

      // the garden wall of sun-dried brick behind you, with its gate
      const brickMat = KIT.std({ map: KIT.mudBrick(w, [10, 1]), color: 0xd8b48c });
      [[-44, -3], [3, 44]].forEach(([a, b]) => { const m = new T.Mesh(new T.BoxGeometry(b - a, 2.4, 0.6), brickMat); m.position.set((a + b) / 2, 1.2, 28.5); S.add(m); });
      [-44, 44].forEach(x => { const m = new T.Mesh(new T.BoxGeometry(0.6, 2.4, 76), brickMat); m.position.set(x, 1.2, -9.5); S.add(m); });

      /* ---------- shafts of low sun between the trunks ---------- */
      const shaftTex = w.tex(128, (g, s) => {
        const gr = g.createLinearGradient(0, 0, s, 0);
        gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = gr; g.fillRect(0, 0, s, s);
        g.globalCompositeOperation = 'destination-in';
        const v = g.createLinearGradient(0, 0, 0, s);
        v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(0.25, 'rgba(0,0,0,1)'); v.addColorStop(0.7, 'rgba(0,0,0,0.8)'); v.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = v; g.fillRect(0, 0, s, s);
      });
      shaftTex.wrapS = shaftTex.wrapT = T.ClampToEdgeWrapping;
      this.shafts = [];
      const rs = U.seeded(9);
      for (let i = 0; i < 16; i++) {
        const m = new T.Mesh(new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({ map: shaftTex, color: 0xffcc88, transparent: true, opacity: 0.07 + rs() * 0.09, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide, fog: false }));
        const c = new T.Vector3(U.lerp(-24, 24, rs()), 2.5 + rs() * 5, U.lerp(-30, 20, rs()));
        m.userData = { dynamic: true, c, wdt: 0.6 + rs() * 2.2, len: 34, base: m.material.opacity, ph: rs() * 6 };
        m.matrixAutoUpdate = false; m.frustumCulled = false; S.add(m); this.shafts.push(m);
      }

      this.dust = KIT.dust(w, 800, [-22, 0.2, -30, 22, 9, 22], 0xffdcaa, 0.07); S.add(this.dust);

      // a few doves overhead, high in the light
      this.birds = [];
      const birdGeo = new T.BufferGeometry();
      birdGeo.setAttribute('position', new T.BufferAttribute(new Float32Array([-0.35, 0, 0.05, 0, 0, -0.12, 0, 0, 0.12, 0.35, 0, 0.05, 0, 0, -0.12, 0, 0, 0.12]), 3));
      birdGeo.computeVertexNormals();
      const birdMat = new T.MeshBasicMaterial({ color: 0x3a2a24, side: T.DoubleSide });
      for (let i = 0; i < 5; i++) { const b = new T.Mesh(birdGeo.clone(), birdMat); b.userData.dynamic = true; b.frustumCulled = false; S.add(b); this.birds.push({ m: b, a: Math.random() * 6, rr: 14 + Math.random() * 12, y: 15 + Math.random() * 6, sp: 0.15 + Math.random() * 0.1, ph: Math.random() * 6 }); }

      w.receiveAll();
      [this.dust].forEach(o => { o.castShadow = false; });
      ungroup(S);
      this.baked = w.bake();
      // the fronds' shadows honour the gaps between leaflets and bend with them
      const frondDepth = swayify(new T.MeshDepthMaterial({ depthPacking: T.RGBADepthPacking, map: parts.frondMat.map, alphaTest: 0.45, side: T.DoubleSide }));
      const solidDepth = swayify(new T.MeshDepthMaterial({ depthPacking: T.RGBADepthPacking }));
      S.traverse(o => {
        if (!o.isMesh) return;
        if (o.material === parts.frondMat) o.customDepthMaterial = frondDepth;
        else if (o.material === parts.trunkMat || o.material === stalkMat || o.material === dateMat) o.customDepthMaterial = solidDepth;
        else if (o.material === dryMat || o.material === cropMat) { o.castShadow = false; }
        if (o.material === this.waterMat || (o.material && o.material.blending === T.AdditiveBlending)) o.castShadow = false;
      });

      /* ---------- the basket you carry, and the dates in the air ---------- */
      S.add(w.camera);
      const weave = w.tex(128, (g, s) => {
        g.fillStyle = '#a07438'; g.fillRect(0, 0, s, s);
        for (let y = 0; y < s; y += 8) for (let x = 0; x < s; x += 16) {
          g.fillStyle = (y / 8) % 2 ? '#c89850' : '#8a5e2a'; g.fillRect(x + ((y / 8) % 2) * 8, y, 10, 7);
        }
      }, [6, 2]);
      const basket = this.basket = new T.Group();
      const prof = [[0.0, 0], [0.11, 0.0], [0.15, 0.05], [0.18, 0.11], [0.19, 0.13]].map(([x, y]) => new T.Vector2(x, y));
      const bm = new T.Mesh(new T.LatheGeometry(prof, 22), KIT.std({ map: weave, side: T.DoubleSide, roughness: 0.9, relief: 0.02 }));
      basket.add(bm);
      const rim = new T.Mesh(new T.TorusGeometry(0.19, 0.012, 6, 28), KIT.std({ color: 0x8a5a26 })); rim.rotation.x = Math.PI / 2; rim.position.y = 0.13; basket.add(rim);
      basket.position.set(0.2, -0.36, -0.6); basket.rotation.set(0.85, 0, 0.1); basket.scale.setScalar(0.72);
      basket.userData.dynamic = true; w.camera.add(basket);
      const fallGeo = new T.SphereGeometry(0.045, 8, 6); fallGeo.scale(1, 1.45, 1);
      const fallMat = KIT.std({ color: 0x1c0c06, roughness: 0.4 });
      this.inBasket = new T.InstancedMesh(fallGeo, fallMat, 7); this.inBasket.count = 0; basket.add(this.inBasket);
      const m4 = new T.Matrix4();
      for (let i = 0; i < 7; i++) { const a = i * 2.1; m4.makeRotationZ(1.3 + i * 0.4); m4.setPosition(Math.cos(a) * 0.07 * (i ? 1 : 0), 0.04 + (i > 4 ? 0.03 : 0), Math.sin(a) * 0.07 * (i ? 1 : 0)); this.inBasket.setMatrixAt(i, m4); }
      this.fall = new T.InstancedMesh(fallGeo, fallMat, 32); this.fall.count = 0; this.fall.frustumCulled = false; this.fall.userData.dynamic = true; S.add(this.fall);
      // a glint on each falling date, so it can be followed against the bright sky
      const gp = new T.BufferGeometry(); gp.setAttribute('position', new T.BufferAttribute(new Float32Array(32 * 3), 3));
      this.glints = new T.Points(gp, new T.PointsMaterial({ map: KIT.glowTex(w), color: 0xfff0d0, size: 0.45, transparent: true, opacity: 0.9, depthWrite: false, blending: T.AdditiveBlending }));
      this.glints.frustumCulled = false; S.add(this.glints);
      // catch rings: where each date will meet the basket
      const ringMat = () => new T.MeshBasicMaterial({ map: KIT.glowTex(w), color: 0xfff0d4, transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending });
      for (let i = 0; i < 6; i++) {
        const g = new T.Group();
        const halo = new T.Mesh(new T.PlaneGeometry(1.8, 1.8), ringMat()); halo.rotation.x = -Math.PI / 2; g.add(halo);
        const band = new T.Mesh(new T.RingGeometry(0.62, 0.7, 40), new T.MeshBasicMaterial({ color: 0xfff0d4, transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide }));
        band.rotation.x = -Math.PI / 2; band.position.y = 0.01; g.add(band);
        g.position.y = 0.06; g.visible = false; g.userData.dynamic = true; S.add(g);
        this.rings.push({ g, halo, band, date: null });
      }

      // the hadith written in light toward the sun, for the end
      const c = document.createElement('canvas'); c.width = 1600; c.height = 300;
      const g2 = c.getContext('2d'); g2.textAlign = 'center';
      g2.save(); g2.translate(800, 150); g2.scale(1, 0.2); const bgr = g2.createRadialGradient(0, 0, 0, 0, 0, 760); bgr.addColorStop(0, 'rgba(70,34,10,0.5)'); bgr.addColorStop(0.7, 'rgba(70,34,10,0.3)'); bgr.addColorStop(1, 'rgba(70,34,10,0)'); g2.fillStyle = bgr; g2.fillRect(-800, -760, 1600, 1520); g2.restore();
      g2.direction = 'rtl'; g2.shadowColor = 'rgba(255,230,180,0.95)'; g2.shadowBlur = 30; g2.fillStyle = '#fffaf0'; g2.font = '76px Amiri, "Geeza Pro", serif';
      g2.fillText('مَنْ تَصَبَّحَ كُلَّ يَوْمٍ سَبْعَ تَمَرَاتٍ عَجْوَةً', 800, 110);
      g2.direction = 'ltr'; g2.shadowBlur = 12; g2.fillStyle = 'rgba(255,246,228,0.95)'; g2.font = 'italic 42px Spectral, Georgia, serif';
      g2.fillText('“Whoever has seven ‘ajwa dates in the morning…”', 800, 200);
      g2.font = '28px Marcellus, Georgia, serif'; g2.fillStyle = 'rgba(255,240,215,0.8)'; g2.fillText('SAHIH AL-BUKHARI 5445 · SAHIH MUSLIM 2047', 800, 262);
      const tt = new T.CanvasTexture(c); tt.encoding = T.sRGBEncoding;
      this.words = new T.Sprite(new T.SpriteMaterial({ map: tt, transparent: true, opacity: 0, depthWrite: false, fog: false }));
      this.words.scale.set(22, 4.1, 1); S.add(this.words);

      /* ---------- interactions ---------- */
      w.activity('Seven Ajwa', 7, 'Find a palm heavy with dates (its crown glows) and shake it with E');
      this.laden.forEach(p => {
        w.interact({
          key: 'palm' + p.shakeI, pos: [p.x, 1.4, p.z], r: 3.0, label: 'Shake the palm',
          enabled: () => self.reveal < 0 && w.time > p.cool,
          onUse: () => self.shake(env, p),
        });
      });
      w.interact({
        key: 'well', pos: [WELL.x, 1.0, WELL.z], r: 3.2, once: true, label: 'Look into the well',
        onUse: () => {
          SND.drop(env.bus, { f: 420, gain: 0.08, delay: 0.9 }); SND.drop(env.bus, { f: 300, gain: 0.05, delay: 1.25 });
          w.say('Gardens Fed by Wells', 'Madinah was an oasis of palm gardens. Wells like this one, drawn by hand or by a camel walking a path, filled the channels that ran between the rows, and each palm stood in its own little basin of water.', { ms: 11000 });
        },
      });

      /* ---------- sound ---------- */
      const b = env.bus;
      this.breeze = SND.noise(b, { color: 'pink', type: 'lowpass', freq: 520, gain: 0.04 });
      this.rustle = SND.noise(b, { color: 'white', type: 'bandpass', freq: 4400, q: 0.8, gain: 0.006 });
      this.rustleLo = SND.noise(b, { color: 'pink', type: 'bandpass', freq: 1500, q: 0.6, gain: 0.006 });
      this.water = SND.noise(b, { color: 'white', type: 'bandpass', freq: 2400, q: 1.6, gain: 0 });
      SND.lfo(b, this.water.filter && this.water.filter.frequency, 3.3, 500);
      // the harmony that grows with each date: three hummed voices
      this.voices = [196, 293.66, 392].map((f, i) => SND.drone(b, f, { gain: 0, vowel: i ? 'o' : 'u', pan: [-0.4, 0.4, 0][i] }));
      this.birdClock = 1.5;

      /* ---------- arrival: from high in a sunlit crown, down through the fronds ---------- */
      const host = this.palms.reduce((best, p) => (p.laden < 0 && Math.hypot(p.x - 2, p.z - 5) < Math.hypot(best.x - 2, best.z - 5) ? p : best), this.palms[0]);
      const ht = host.top;
      const back = new T.Vector3(-SUN.x, 0, -SUN.z).normalize(), side = new T.Vector3(-back.z, 0, back.x);
      const sunFar = ht.clone().addScaledVector(SUN, 70);
      const L = this.laden[0];
      const at = (v, b2, s2, u) => ht.clone().addScaledVector(back, b2).addScaledVector(side, s2).add(new T.Vector3(0, u, 0)).toArray();
      w.cinematic([
        { p: at(0, 6.2, 0.6, 1.0), l: [sunFar.x, sunFar.y - 12, sunFar.z] },
        { p: at(0, 5.0, 1.8, -0.6), l: [sunFar.x * 0.7 + L.top.x * 0.3, ht.y + 2, sunFar.z * 0.7 + L.top.z * 0.3] },
        { p: at(0, 3.6, 2.6, -2.8), l: [L.top.x, L.top.y - 0.6, L.top.z] },
        { p: [w.pos.x + 0.6, 3.2, w.pos.z + 2.2], l: [L.x, 3.0, L.z] },
        { p: [w.pos.x, 1.62, w.pos.z], l: [w.pos.x, 1.62, w.pos.z - 10] },
      ], 10);
    },

    /* ---------- the verb: shake, and the dates come down ---------- */
    shake(env, p) {
      const w = this.w;
      p.cool = w.time + 2.6; p.shake = 1.2;
      const sp = w.spatial(p, 6);
      SND.swell(env.bus, { color: 'white', type: 'bandpass', f0: 2400, f1: 6200, dur: 1.4, gain: 0.12, pan: sp.pan });
      SND.swell(env.bus, { color: 'pink', type: 'bandpass', f0: 600, f1: 1800, dur: 1.2, gain: 0.08, pan: sp.pan });
      SND.knock(env.bus, { f: 120, gain: 0.18, click: 700, pan: sp.pan });
      if (Math.random() < 0.7) SND.chirp(env.bus, { gain: 0.03, delay: 0.3 });
      if (!this.firstShake) {
        this.firstShake = true;
        w.say('The Groves of al-‘Aliyah', 'The higher ground to the south of Madinah, al-‘Aliyah, is still known for its ‘ajwa: a small, soft, nearly black date. One narration in Sahih Muslim names the ‘ajwa of al-‘Aliyah. Watch the ring of light: it shows where each date will fall.', { ms: 11000 });
      }
      const n = this.caught >= 5 ? 2 : 3;
      for (let i = 0; i < n; i++) this.dates.push({ p, wait: 0.35 + i * 0.75, state: 'wait' });
      w.step('Stand in the ring of light to catch each date');
    },

    launch(d) {
      const w = this.w, p = d.p;
      const src = p.clusters[(Math.random() * p.clusters.length) | 0].clone();
      src.x += U.rnd(-0.15, 0.15); src.z += U.rnd(-0.15, 0.15);
      // land within easy reach of the walker, on the side of the palm where they stand
      const toward = Math.atan2(w.pos.z - p.z, w.pos.x - p.x);
      const ang = toward + U.rnd(-1.1, 1.1), rad = U.rnd(1.2, 3.0);
      const gy = w.y || 0, yb = gy + CATCH_Y;
      const tx = p.x + Math.cos(ang) * rad, tz = p.z + Math.sin(ang) * rad;
      const vy = U.rnd(0.3, 1.0), h = src.y - yb;
      const t = (vy + Math.sqrt(vy * vy + 2 * G * h)) / G;
      d.pos = src; d.vel = new T.Vector3((tx - src.x) / t, vy, (tz - src.z) / t);
      d.land = new T.Vector3(tx, 0, tz); d.tof = t; d.age = 0; d.state = 'fall';
      d.rot = new T.Euler(Math.random() * 3, Math.random() * 3, 0); d.spin = new T.Vector3(U.rnd(-6, 6), U.rnd(-6, 6), U.rnd(-6, 6));
      const ring = this.rings.find(r => !r.date);
      if (ring) { ring.date = d; d.ring = ring; ring.g.position.set(tx, 0.06, tz); ring.g.visible = true; }
      const sp = w.spatial(src, 6);
      SND.swell(this.env.bus, { color: 'white', type: 'highpass', f0: 3000, f1: 5000, dur: 0.4, gain: 0.04 * sp.gain + 0.01, pan: sp.pan });
    },

    catchDate(env, d) {
      const w = this.w;
      d.state = 'done';
      this.caught++;
      this.inBasket.count = Math.min(7, this.caught);
      this.inBasket.instanceMatrix.needsUpdate = true;
      this.basketKick = 1;
      SND.knock(env.bus, { f: 260, gain: 0.12, click: 1400 });
      SND.bell(env.bus, SCALE[Math.min(6, this.caught - 1)], { gain: 0.05, dur: 3, glass: true });
      this.voices.forEach((v, i) => v.setGain(Math.min(this.caught, 6) / 6 * [0.012, 0.009, 0.007][i] * (this.caught >= 2 * i ? 1 : 0), 1.2));
      if (this.caught === 4) w.say('You Know Better the Affairs of Your World', 'The people of Madinah pollinated their palms by hand. The Prophet ﷺ once advised them about it, and when the crop fell short he told them: <span class="q">“You know better the affairs of your world.”</span> (Sahih Muslim 2363)', { ar: 'أَنْتُمْ أَعْلَمُ بِأَمْرِ دُنْيَاكُمْ', ms: 13000 });
      if (this.caught >= 7) { w.progress(7, 'Seven gathered'); this.reveal = 0; }
      else w.progress(this.caught, this.dates.some(x => x.state !== 'done' && x.state !== 'rolled') ? 'Stand in the ring of light to catch each date' : 'Shake a laden palm again (E)');
    },

    update(env, dt) {
      const w = this.w; if (!w) return;
      this.env = env;
      w.update(dt);
      const t = w.time;
      SW.uTime.value = t;
      this.waterMat.uniforms.uTime.value = t;

      // wind: a soft breeze, gusts now and then, and your own wind as you run past
      this.gustClock -= dt;
      if (this.gustClock < 0) {
        this.gustClock = 7 + Math.random() * 8; this.gustT = 0;
        SND.swell(env.bus, { color: 'pink', type: 'bandpass', f0: 500, f1: 2600, dur: 4, gain: 0.07, pan: U.rnd(-0.6, 0.6) });
        SND.swell(env.bus, { color: 'white', type: 'bandpass', f0: 3000, f1: 6500, dur: 3.5, gain: 0.03, delay: 0.4 });
      }
      if (this.gustT != null) { this.gustT += dt; this.gust = Math.sin(U.clamp(this.gustT / 4) * Math.PI) * 0.55; }
      SW.uWind.value.z = this.gust;
      const run = U.clamp(w.moving / 5.2);
      SW.uPlayer.value.set(w.pos.x, w.pos.z, U.damp(SW.uPlayer.value.z, run * run * 0.9, 3, dt), 4.5);
      // shaking palms
      let shaking = 0;
      this.laden.forEach(p => {
        p.shake = Math.max(0, p.shake - dt * 0.9);
        SW.uShake.value[p.shakeI].set(p.top.x, p.top.z, p.shake * p.shake, 0);
        shaking += p.shake;
        const near = U.smooth(9, 2.5, Math.hypot(p.x - w.pos.x, p.z - w.pos.z));
        p.glow.material.opacity = (0.22 + 0.12 * Math.sin(t * 1.6 + p.shakeI) + near * 0.15) * (this.reveal >= 0 ? 0.4 : 1);
        p.baseGlow.material.opacity = near * 0.25 * (t > p.cool ? 1 : 0.3) * (this.reveal >= 0 ? 0 : 1);
      });
      // the nearest palm to you rustles; the sound follows how much the grove is moving
      let nearP = 1e9; for (const p of this.palms) nearP = Math.min(nearP, Math.hypot(p.x - w.pos.x, p.z - w.pos.z));
      const energy = this.gust + SW.uPlayer.value.z * U.smooth(6, 1.5, nearP) + shaking * 0.6;
      const hush = this.reveal >= 0 ? U.smooth(0, 1.2, this.reveal) * (1 - U.smooth(5, 9, this.reveal)) : 0;
      this.rustle.set('gain', (0.005 + Math.min(0.08, energy * 0.08)) * (1 - hush * 0.9), 0.15);
      this.rustleLo.set('gain', (0.005 + Math.min(0.05, energy * 0.05)) * (1 - hush * 0.9), 0.2);
      this.breeze.set('gain', (0.035 + this.gust * 0.05) * (1 - hush * 0.85), 0.4);
      const dCh = Math.min(Math.abs(w.pos.x - CHAN_X), ...CROSS_Z.map(z => Math.abs(w.pos.z - z)));
      this.water.set('gain', (0.012 * U.smooth(6, 0.5, dCh) + 0.03 * U.smooth(8, 1, Math.hypot(w.pos.x - WELL.x, w.pos.z - WELL.z))) * (1 - hush), 0.3);

      // shafts of light turn to face you about their own axis
      const cam = w.camera.position, ax = SUN.clone().negate(), v = new T.Vector3(), n = new T.Vector3(), rgt = new T.Vector3();
      const glowUp = this.reveal >= 0 ? U.smooth(3, 8, this.reveal) : 0;
      for (const m of this.shafts) {
        const u = m.userData;
        v.copy(cam).sub(u.c); n.copy(v).addScaledVector(ax, -v.dot(ax)).normalize(); rgt.crossVectors(ax, n);
        m.matrix.makeBasis(rgt.multiplyScalar(u.wdt), ax.clone().multiplyScalar(u.len), n); m.matrix.setPosition(u.c);
        m.material.opacity = u.base * (0.75 + 0.25 * Math.sin(t * 0.3 + u.ph)) * (1 + glowUp * 1.2);
      }
      KIT.driftDust(this.dust, dt, t, [0.08 + this.gust * 0.8, 0.12 + this.gust * 1.2]);

      // the dates
      const M = new T.Matrix4(), Q = new T.Quaternion(), one = new T.Vector3(1, 1, 1), gp = this.glints.geometry.attributes.position;
      let k = 0;
      for (const d of this.dates) {
        if (d.state === 'wait') { d.wait -= dt; if (d.wait <= 0) this.launch(d); else continue; }
        if (d.state === 'done' || d.state === 'gone') continue;
        d.age += dt;
        const prevY = d.pos.y;
        if (d.state === 'fall') {
          d.vel.y -= G * dt; d.pos.addScaledVector(d.vel, dt);
          d.rot.x += d.spin.x * dt; d.rot.y += d.spin.y * dt; d.rot.z += d.spin.z * dt;
          const yb = w.y + CATCH_Y;
          if (prevY >= yb && d.pos.y < yb) {
            if (Math.hypot(d.pos.x - w.pos.x, d.pos.z - w.pos.z) < CATCH_R) { this.catchDate(env, d); this.freeRing(d); continue; }
          }
          if (d.pos.y <= 0.05) {
            d.pos.y = 0.05; d.vel.y *= -0.3; d.vel.x *= 0.6; d.vel.z *= 0.6; d.bounces = (d.bounces || 0) + 1;
            const sp = w.spatial(d.pos, 5);
            SND.knock(env.bus, { f: 150 + Math.random() * 40, gain: 0.12 * sp.gain / d.bounces, click: 600, pan: sp.pan });
            if (d.bounces === 1) { this.freeRing(d); if (this.reveal < 0) w.step('It rolled away across the earth. Shake the palm again (E)'); }
            if (d.bounces >= 2) { d.state = 'roll'; d.rollT = 0; d.vel.y = 0; const a = Math.random() * 6.28; d.vel.x += Math.cos(a) * 0.8; d.vel.z += Math.sin(a) * 0.8; }
          }
        } else if (d.state === 'roll') {
          d.rollT += dt; d.pos.x += d.vel.x * dt; d.pos.z += d.vel.z * dt; d.vel.multiplyScalar(Math.exp(-dt * 1.4));
          d.rot.x += Math.hypot(d.vel.x, d.vel.z) * dt * 12;
          if (d.rollT > 5) { d.state = 'gone'; continue; }
        }
        if (k < 32) {
          Q.setFromEuler(d.rot); const s = d.state === 'roll' ? 1 - U.smooth(3.5, 5, d.rollT) : 1;
          M.compose(d.pos, Q, one.set(s, s, s)); this.fall.setMatrixAt(k, M);
          gp.setXYZ(k, d.pos.x, d.state === 'fall' ? d.pos.y : -50, d.pos.z); k++;
        }
      }
      this.fall.count = k; this.fall.instanceMatrix.needsUpdate = true;
      for (let i = k; i < 32; i++) gp.setXYZ(i, 0, -50, 0);
      gp.needsUpdate = true;
      this.dates = this.dates.filter(d => d.state !== 'gone' && d.state !== 'done');

      // rings: they close in as the date comes down, and warm when you stand inside
      for (const r of this.rings) {
        if (!r.date) { r.halo.material.opacity = U.damp(r.halo.material.opacity, 0, 6, dt); r.band.material.opacity = U.damp(r.band.material.opacity, 0, 6, dt); if (r.band.material.opacity < 0.01) r.g.visible = false; continue; }
        const d = r.date, k2 = U.clamp(d.age / d.tof);
        const inside = Math.hypot(w.pos.x - r.g.position.x, w.pos.z - r.g.position.z) < CATCH_R;
        const s = U.lerp(2.0, 1.0, U.easeOut(k2));
        r.band.scale.set(s, s, 1); r.halo.scale.set(s * 0.8, s * 0.8, 1);
        r.band.material.opacity = U.damp(r.band.material.opacity, inside ? 0.95 : 0.6, 8, dt);
        r.halo.material.opacity = U.damp(r.halo.material.opacity, inside ? 0.7 : 0.3, 8, dt);
        r.band.material.color.setHex(inside ? 0xffffff : 0xfff0d4);
              }

      // the basket dips as a date lands in it, and settles
      this.basket.visible = !w.cine;
      this.basketKick = U.damp(this.basketKick || 0, 0, 5, dt);
      const kb = this.basketKick;
      this.basket.position.y = -0.36 - Math.sin(kb * Math.PI) * 0.04;
      this.basket.rotation.z = 0.08 + Math.sin(t * 1.3) * 0.015 + kb * 0.06 * Math.sin(t * 20);

      // doves wheel slowly overhead
      for (const bd of this.birds) {
        bd.a += bd.sp * dt;
        bd.m.position.set(Math.cos(bd.a) * bd.rr + 2, bd.y + Math.sin(t + bd.ph) * 0.6, Math.sin(bd.a) * bd.rr - 8);
        bd.m.rotation.set(0, -bd.a, 0);
        const flap = Math.sin(t * 9 + bd.ph) * 0.35;
        const pa = bd.m.geometry.attributes.position; pa.setY(0, flap); pa.setY(3, flap); pa.needsUpdate = true;
      }
      this.birdClock -= dt;
      if (this.birdClock < 0 && hush < 0.2) {
        this.birdClock = 1.5 + Math.random() * 4;
        const pan = U.rnd(-0.8, 0.8);
        Math.random() < 0.45 ? SND.coo(env.bus, { gain: 0.03, pan }) : SND.chirp(env.bus, { gain: 0.016, pan });
      }

      // revelation: the grove falls quiet, then the words appear toward the sun and a choir rises
      if (this.reveal >= 0) {
        const r0 = this.reveal, r1 = (this.reveal += dt);
        const cross = s => r0 < s && r1 >= s;
        if (cross(0.01)) {
          const f = w.forward(); const l = Math.hypot(f.x, f.z) || 1;
          const dir = new T.Vector3(f.x / l * 0.4 + SUN.x * 0.6, 0, f.z / l * 0.4 + SUN.z * 0.6).normalize();
          this.words.position.set(w.pos.x + dir.x * 18, 7.4, w.pos.z + dir.z * 18);
          this.voices.forEach(v => v.setGain(0.003, 1));
        }
        if (cross(1.8)) {
          SND.glow(env.bus, 196, { gain: 0.07, dur: 12 }); SND.glow(env.bus, 293.66, { gain: 0.045, dur: 11, delay: 1.2 });
          SND.sing(env.bus, 587.33, { vowel: 'a', dur: 6, delay: 2.4, gain: 0.03, voices: 3, attack: 2 });
        }
        if (cross(2.6)) w.say('Seven ‘Ajwa', '<span class="q">“Whoever has seven ‘ajwa dates in the morning will not be harmed that day by poison or magic.”</span> (Sahih al-Bukhari 5445; Sahih Muslim 2047, whose wording names the ‘ajwa of al-‘Aliyah)', { ar: 'مَنْ تَصَبَّحَ كُلَّ يَوْمٍ سَبْعَ تَمَرَاتٍ عَجْوَةً لَمْ يَضُرَّهُ فِي ذَلِكَ الْيَوْمِ سُمٌّ وَلَا سِحْرٌ', ms: 16000 });
        if (cross(5)) { w.finish('Seven ‘ajwa gathered'); this.voices.forEach((v, i) => v.setGain([0.014, 0.01, 0.008][i], 3)); }
        this.words.material.opacity = U.smooth(1.8, 4.5, r1) * 0.95;
        this.words.position.y += Math.sin(t * 0.4) * 0.002;
        w.renderer.toneMappingExposure = 1.08 + U.smooth(1.5, 6, r1) * 0.14;
      }
    },

    freeRing(d) { if (d.ring) { d.ring.date = null; d.ring = null; } },
  }));
})();
