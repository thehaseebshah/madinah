/* Makkah — The Return to Makkah (Fath Makkah), 8 AH / 630 CE.
   A clear morning. Banners and dust stand on the heights round the valley where the army has come
   in; no person is shown. Around the Ka'bah stand thirty-six plain, weathered stones and crude
   pillars, standing for the 360 idols of the report (no faces are carved). Go round the House and
   topple each: it tips, falls and dissolves into dust with a low sung note. When the last is gone,
   near-silence, then a wordless sung call rises from the roof of the Ka'bah in a column of light,
   and the pardon of the city.
   Feeling: release, and mercy after victory. Colour script: clear morning blue over sand, with warm
   gold reserved for the next stone, the voice from the roof and the pardon. */
(function () {
  'use strict';
  if (!window.WORLD) return;
  const N = 36, KW = 11, KD = 12.5, KH = 9;
  const ACCENT = 0xffc65a;

  // a soft points system for dust with per-particle alpha and size
  const DUST_VERT = `attribute float aAlpha; attribute float aSize; varying float vA;
    void main(){ vA = aAlpha; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = aSize * (300.0 / -mv.z); gl_Position = projectionMatrix * mv; }`;
  const DUST_FRAG = `uniform sampler2D map; uniform vec3 color; varying float vA;
    void main(){ vec4 t = texture2D(map, gl_PointCoord); gl_FragColor = vec4(color, t.a * vA); }`;

  /* The kit's valley climbs without limit toward its edges; fold the high slopes down into a ring
     of mountains so that the sky stays open over the city. */
  function squashValley(w, g0) {
    const sq = y => (y <= 16 ? y : 16 + (y - 16) * 0.3);
    w.scene.traverse(m => {
      if (m.isMesh && m.geometry.attributes.color && m.geometry.attributes.position.count > 10000) {
        const p = m.geometry.attributes.position;
        for (let i = 0; i < p.count; i++) p.setY(i, sq(p.getY(i)));
        m.geometry.computeVertexNormals(); m.geometry.computeBoundingSphere();
      }
    });
    return (x, z) => sq(g0(x, z));
  }

  ENGINE.register(WORLD.stage({
    key: 'conquest',
    arabic: 'فَتْحُ مَكَّة',
    title: 'The Return to Makkah',
    era: 'Makkah · Ramadan, 8 AH · 630 CE · the conquest and the pardon',
    hint: 'WASD to walk · go round the Ka‘bah · E at each standing stone to topple it',
    hintTouch: 'Left thumb to walk · go round the Ka‘bah · tap E at each standing stone',
    sound: { reverb: 0.45 },
    story: `<p>Eight years after he left Makkah by night, the Prophet ﷺ returned with about ten thousand (Sahih al-Bukhari 4276). The city was entered with little fighting, and he declared that whoever entered the house of Abu Sufyan, laid down arms or shut his door was safe (Sahih Muslim 1780).</p>
            <p>Around the Ka‘bah stood 360 idols. He struck them with a stick in his hand, reciting:</p>
            <p class="q"><span class="ar">جَاءَ الْحَقُّ وَزَهَقَ الْبَاطِلُ ۚ إِنَّ الْبَاطِلَ كَانَ زَهُوقًا</span>“Truth has come and falsehood has vanished; falsehood is bound to vanish.” (Qur’an 17:81; Sahih al-Bukhari 4287)</p>
            <p>Here thirty-six plain stones stand for them. No figure is shown.</p>`,

    enter(env) {
      const T = THREE, self = this;
      const w = this.w = WORLD.create(env, {
        start: { x: 3, z: 31, yaw: 0.02, pitch: 0.04 }, exposure: 1.0, far: 1600,
        fog: { color: 0xe6dccb, density: 0.0018 }, bounds: [-80, -80, 80, 80],
      });
      const S = w.scene;
      const sunDir = new T.Vector3(0.62, 0.52, 0.3).normalize();
      this.skyM = w.sky({ top: '#3f78c8', mid: '#e4dccb', bot: '#c8b090', sunDir: sunDir.toArray(), sun: '#fff0d0', sunSize: 0.0014 });
      this.hemi = new T.HemisphereLight(0xdfeaff, 0x9a8060, 0.62); S.add(this.hemi);
      const sun = new T.DirectionalLight(0xfff0d8, 2.3); sun.position.copy(sunDir).multiplyScalar(80); S.add(sun);
      this.sun = sun;

      const ground = squashValley(w, KIT.makkahValley(w, { kx: 0, kz: 0, floor: 130, clear: 34, seed: 630, houses: 110 }));
      w.ground = ground; w.surface = () => 'sand';
      this.ground = ground;
      const kabah = KIT.kabah(w, { cloth: 0x0b0909 }); S.add(kabah);
      kabah.children[1].material.roughness = 0.62;
      w.addBox(-KW / 2 - 0.5, -KD / 2 - 0.5, KW / 2 + 0.5, KD / 2 + 0.5);

      /* ---------- banners and dust on the heights ---------- */
      const poleMat = KIT.std({ map: KIT.wood(w, [1, 3], '#5a4030'), color: 0xa08870 });
      const bannerCols = [[0.92, 0.9, 0.84], [0.16, 0.14, 0.13], [0.86, 0.84, 0.78], [0.55, 0.42, 0.28]];
      const clothPos = [], clothCol = [], clothIdx = [], this_b = [];
      const SEGX = 8, SEGY = 3;
      const sites = [];
      // banners stand along the ridges, where the slopes have climbed some thirty metres
      [[-0.15, 0], [Math.PI * 0.5, 1], [Math.PI, 2], [Math.PI * 1.5 - 0.3, 3]].forEach(([a0, gi]) => {
        for (let k = 0; k < 7; k++) {
          const a = a0 + (k - 3) * 0.08 + (Math.random() - 0.5) * 0.03, want = 22 + (k % 3) * 9;
          let d = 120; while (d < 400 && ground(Math.sin(a) * d, -Math.cos(a) * d) < want) d += 2;
          const x = Math.sin(a) * d, z = -Math.cos(a) * d;
          sites.push({ x, z, y: ground(x, z), gi });
        }
      });
      sites.forEach((s0, bi) => {
        const ph = 14 + Math.random() * 4;
        const p = new T.Mesh(new T.CylinderGeometry(0.2, 0.26, ph, 6), poleMat); p.position.set(s0.x, s0.y + ph / 2 - 0.3, s0.z); S.add(p);
        const col = bannerCols[(bi + s0.gi) % bannerCols.length], base = clothPos.length / 3;
        const bw = 6.5, bh = 4.2, top = s0.y + ph - 0.6, yaw = Math.atan2(s0.x, s0.z);
        for (let j = 0; j <= SEGY; j++) for (let i = 0; i <= SEGX; i++) {
          const u = i / SEGX, v = j / SEGY;
          clothPos.push(s0.x + Math.cos(yaw) * u * bw, top - v * bh, s0.z - Math.sin(yaw) * u * bw);
          clothCol.push(...col);
        }
        for (let j = 0; j < SEGY; j++) for (let i = 0; i < SEGX; i++) {
          const a = base + j * (SEGX + 1) + i, b = a + 1, c = a + SEGX + 1, d = c + 1;
          clothIdx.push(a, c, b, b, c, d);
        }
        this_b.push({ base, x: s0.x, z: s0.z, yaw, bw, ph: Math.random() * 6 });
      });
      const cg = new T.BufferGeometry();
      cg.setAttribute('position', new T.Float32BufferAttribute(clothPos, 3)); cg.setAttribute('color', new T.Float32BufferAttribute(clothCol, 3));
      cg.setIndex(clothIdx); cg.computeVertexNormals();
      this.cloth = new T.Mesh(cg, KIT.std({ vertexColors: true, side: T.DoubleSide, roughness: 1 }));
      this.cloth.userData.dynamic = true; this.cloth.frustumCulled = false; S.add(this.cloth);
      this.clothBase = cg.attributes.position.array.slice();
      this.banners = this_b; this.bannerSites = sites;
      // dust raised on the heights: soft billows that drift and breathe
      const puff = w.tex(128, (g, s) => {
        for (let i = 0; i < 9; i++) {
          const x = s * (0.3 + Math.random() * 0.4), y = s * (0.35 + Math.random() * 0.3), r = s * (0.18 + Math.random() * 0.14);
          const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(255,255,255,0.5)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
          g.fillStyle = gr; g.fillRect(0, 0, s, s);
        }
      });
      puff.wrapS = puff.wrapT = T.ClampToEdgeWrapping;
      this.plumes = [];
      for (let i = 0; i < 18; i++) {
        const s0 = sites[(i * 3) % sites.length];
        const sp = new T.Sprite(new T.SpriteMaterial({ map: puff, color: 0xd8c0a0, transparent: true, opacity: 0.5, depthWrite: false }));
        const sc = 26 + Math.random() * 24; sp.scale.set(sc * 1.6, sc, 1);
        sp.position.set(s0.x + (Math.random() - 0.5) * 30, s0.y + 6 + Math.random() * 8, s0.z + (Math.random() - 0.5) * 30);
        S.add(sp); this.plumes.push({ sp, x0: sp.position.x, ph: Math.random() * 6, sc });
      }

      /* ---------- the stones: 36 plain, weathered stelae and crude pillars ---------- */
      const weathered = w.tex(512, (g, s) => {
        g.fillStyle = '#8c8070'; g.fillRect(0, 0, s, s);
        for (let i = 0; i < 70; i++) {
          const x = Math.random() * s, y = Math.random() * s, r = 20 + Math.random() * 70;
          const gr = g.createRadialGradient(x, y, 0, x, y, r);
          gr.addColorStop(0, Math.random() < 0.5 ? 'rgba(60,52,44,0.35)' : 'rgba(190,176,150,0.3)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
          g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
        }
        for (let i = 0; i < 7000; i++) { g.fillStyle = Math.random() < 0.5 ? 'rgba(40,34,30,0.5)' : 'rgba(210,198,176,0.4)'; g.fillRect(Math.random() * s, Math.random() * s, 1 + Math.random() * 2, 1 + Math.random() * 2); }
        g.strokeStyle = 'rgba(40,32,26,0.45)'; g.lineWidth = 1.2;
        for (let i = 0; i < 26; i++) { g.beginPath(); let x = Math.random() * s, y = Math.random() * s; g.moveTo(x, y); for (let k = 0; k < 6; k++) { x += (Math.random() - 0.5) * 30; y += Math.random() * 24; g.lineTo(x, y); } g.stroke(); }
        // pale lichen and old soot streaks
        for (let i = 0; i < 40; i++) { g.fillStyle = 'rgba(180,170,120,0.25)'; g.beginPath(); g.arc(Math.random() * s, Math.random() * s, 3 + Math.random() * 9, 0, 6.283); g.fill(); }
      }, [1, 2]);
      const stoneMat = KIT.std({ map: weathered, color: 0xd8ccb8, roughness: 0.96, relief: 0.08 });
      const rough = (geo, amt, seed) => {
        const r = U.seeded(seed), p = geo.attributes.position, key = new Map();
        for (let i = 0; i < p.count; i++) {
          const k = `${p.getX(i).toFixed(3)},${p.getY(i).toFixed(3)},${p.getZ(i).toFixed(3)}`;
          if (!key.has(k)) key.set(k, [(r() - 0.5) * amt, (r() - 0.5) * amt * 0.4, (r() - 0.5) * amt]);
          const o = key.get(k), y = p.getY(i);
          const taper = 1 - y * 0.18;
          p.setXYZ(i, p.getX(i) * taper + o[0], y + (y > 0.01 ? o[1] : 0), p.getZ(i) * taper + o[2]);
        }
        geo.computeVertexNormals(); return geo;
      };
      const steleGeo = rough(new T.BoxGeometry(1, 1, 1, 2, 5, 1).translate(0, 0.5, 0), 0.07, 36);
      const pillarGeo = rough(new T.CylinderGeometry(0.5, 0.56, 1, 7, 4).translate(0, 0.5, 0), 0.09, 360);
      this.steles = new T.InstancedMesh(steleGeo, stoneMat, N / 2);
      this.pillars = new T.InstancedMesh(pillarGeo, stoneMat, N / 2);
      [this.steles, this.pillars].forEach(m => { m.userData.dynamic = true; m.castShadow = true; m.receiveShadow = true; m.instanceMatrix.setUsage(T.DynamicDrawUsage); S.add(m); });
      // where a stone stood, a pale scatter of dust remains
      this.marks = new T.InstancedMesh(new T.CircleGeometry(1, 20).rotateX(-Math.PI / 2), KIT.std({ color: 0xd8c4a0, roughness: 1, transparent: true, opacity: 0.55, polygonOffset: true, polygonOffsetFactor: -2, depthWrite: false }), N);
      this.marks.userData.dynamic = true; this.marks.receiveShadow = true; this.marks.userData.noCast = true; S.add(this.marks);
      const r = U.seeded(8630);
      this.idols = [];
      for (let i = 0; i < N; i++) {
        const a = (i / N) * Math.PI * 2 + (r() - 0.5) * 0.08, rad = 13 + (i % 3) * 2.4 + r() * 1.2;
        const x = Math.cos(a) * rad, z = Math.sin(a) * rad * 1.05;
        const kind = i % 2, h = kind ? 1.7 + r() * 1.3 : 2.0 + r() * 1.4;
        const sx = kind ? 0.6 + r() * 0.25 : 0.8 + r() * 0.35, sz = kind ? sx : 0.36 + r() * 0.14;
        const id = { i, kind, slot: Math.floor(i / 2), x, z, y: ground(x, z) - 0.05, h, sx, sz, yaw: a + Math.PI / 2 + (r() - 0.5) * 0.4, tilt: (r() - 0.5) * 0.06, state: 'stand', t: 0, ang: 0 };
        w.addCircle(x, z, Math.max(sx, sz) * 0.55 + 0.1); id.circle = w.circles[w.circles.length - 1];
        this.idols.push(id); this.place(id);
        const m4 = new T.Matrix4().makeScale(0.0001, 0.0001, 0.0001); this.marks.setMatrixAt(i, m4);
        w.interact({ key: `idol${i}`, pos: [x, id.y + 1.3, z], r: 2.7, label: 'Topple the stone', enabled: () => id.state === 'stand', onUse: () => self.topple(env, id) });
      }
      this.marks.instanceMatrix.needsUpdate = true;
      // the golden glint on the nearest standing stone
      this.glint = KIT.glow(w, 0xffa630, 2.6, 0); S.add(this.glint);
      this.glintLight = new T.PointLight(0xffc870, 0, 7, 2); S.add(this.glintLight);

      /* ---------- dust bursts ---------- */
      const DN = 420;
      const dg = new T.BufferGeometry();
      dg.setAttribute('position', new T.BufferAttribute(new Float32Array(DN * 3), 3));
      dg.setAttribute('aAlpha', new T.BufferAttribute(new Float32Array(DN), 1));
      dg.setAttribute('aSize', new T.BufferAttribute(new Float32Array(DN), 1));
      this.dustPts = new T.Points(dg, new T.ShaderMaterial({ vertexShader: DUST_VERT, fragmentShader: DUST_FRAG, transparent: true, depthWrite: false, uniforms: { map: { value: KIT.glowTex(w) }, color: { value: new T.Color(0xcbb594) } } }));
      this.dustPts.frustumCulled = false; this.dustPts.userData.dynamic = true; S.add(this.dustPts);
      this.parts = Array.from({ length: DN }, () => ({ life: 0, max: 1, x: 0, y: -50, z: 0, vx: 0, vy: 0, vz: 0, s: 1 }));
      this.pi = 0;
      this.motes = KIT.dust(w, 220, [-26, 0.2, -26, 26, 7, 26], 0xfff0d0, 0.05); S.add(this.motes);

      /* ---------- the call from the roof: a column of light ---------- */
      const colTex = w.tex(64, (g, s) => { const gr = g.createLinearGradient(0, s, 0, 0); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, s, s); });
      colTex.wrapS = colTex.wrapT = T.ClampToEdgeWrapping;
      this.callCol = new T.Mesh(new T.CylinderGeometry(0.6, 1.4, 120, 20, 1, true), new T.MeshBasicMaterial({ map: colTex, color: ACCENT, transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false, fog: false }));
      this.callCol.position.set(KW / 2 - 1.5, KH + 60, -KD / 2 + 1.5); this.callCol.userData.dynamic = true; S.add(this.callCol);
      this.callGlow = KIT.glow(w, ACCENT, 9, 0); this.callGlow.position.set(KW / 2 - 1.5, KH + 1.4, -KD / 2 + 1.5); S.add(this.callGlow);
      this.callRings = [0, 1, 2].map(() => { const m = new T.Mesh(new T.RingGeometry(0.9, 1.0, 64).rotateX(-Math.PI / 2), new T.MeshBasicMaterial({ color: ACCENT, transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide, fog: false })); m.position.copy(this.callGlow.position); m.userData.dynamic = true; S.add(m); return m; });
      // doves, small and abstract, that settle after the call
      this.doves = [];
      const doveGeo = new T.ConeGeometry(0.12, 0.42, 4).rotateX(Math.PI / 2);
      this.doveMesh = new T.InstancedMesh(doveGeo, KIT.std({ color: 0xe8e4dc, roughness: 0.8 }), 24);
      this.doveMesh.userData.dynamic = true; S.add(this.doveMesh);
      for (let i = 0; i < 24; i++) this.doves.push({ a: Math.random() * 6.28, r: 14 + Math.random() * 10, y: 16 + Math.random() * 8, sp: 0.25 + Math.random() * 0.2, ph: Math.random() * 6 });

      w.followShadow(sun, 40); w.receiveAll();
      this.marks.castShadow = false; this.dustPts.castShadow = false;
      [this.callCol, ...this.callRings, this.cloth].forEach(m => { m.castShadow = false; });
      this.cloth.castShadow = true;
      S.traverse(m => { if (m.isMesh && !m.isInstancedMesh && !Array.isArray(m.material) && m.geometry.groups.length > 1) m.geometry.clearGroups(); });
      this.baked = w.bake();

      /* ---------- the activity ---------- */
      this.n = 0; this.phase = 'clear'; this.phaseT = 0; this.sinceStart = 0;
      w.activity('Truth has come', N, 'Go round the Ka‘bah and topple each standing stone');

      const b = env.bus;
      this.wind = SND.noise(b, { color: 'pink', type: 'bandpass', freq: 520, q: 0.5, gain: 0.035 });
      SND.lfo(b, this.wind.gain && this.wind.gain.gain, 0.07, 0.015);
      this.host = SND.noise(b, { color: 'brown', type: 'lowpass', freq: 260, q: 0.5, gain: 0.03 });   // the distant army on the heights
      this.choir = [];                                    // a choir that fills out as the stones fall
      this.murmurClock = 2; this.birdClock = 3;
      this.tmpM = new T.Matrix4(); this.tmpQ = new T.Quaternion(); this.tmpV = new T.Vector3(); this.tmpS = new T.Vector3();

      // arrival: from the northern heights with the banners, down into the valley, once round the House
      const north = sites.filter(s0 => s0.gi === 0), nb = north[3];
      const above = (x, z, h) => [x, Math.max(ground(x, z) + h, h), z];
      w.cinematic([
        { p: above(nb.x - 26, nb.z - 30, 26), l: [nb.x, nb.y + 10, nb.z] },
        { p: above(nb.x - 6, nb.z + 10, 30), l: [0, 8, 0] },
        { p: above(30, -95, 46), l: [0, 6, 0] },
        { p: [52, 22, -10], l: [0, 5, 0] },
        { p: [30, 14, 42], l: [0, 5, 0] },
        { p: [-30, 9, 34], l: [0, 4, 0] },
        { p: [-14, 4, 36], l: [0, 4, 0] },
        { p: [3, 1.62, 31], l: [3, 1.8, 20] },
      ], 12);
    },

    // the instance matrix of a stone, standing, falling or dissolving
    place(id, k) {
      const T = THREE, M = this.tmpM || new T.Matrix4(), mesh = id.kind ? this.pillars : this.steles;
      const s = k == null ? 1 : k;
      const P = new T.Vector3(id.x, id.y - (1 - s) * 0.35, id.z);
      const base = new T.Matrix4().makeRotationY(id.yaw);
      base.premultiply(new T.Matrix4().makeRotationZ(id.tilt));
      base.multiply(new T.Matrix4().makeScale(id.sx * s, id.h * Math.max(0.05, s), id.sz * s));
      if (id.ang) {
        const d = id.dir, half = Math.max(id.sx, id.sz) * 0.4;
        const E = new T.Vector3(P.x + d.x * half, P.y, P.z + d.z * half);
        const axis = new T.Vector3(d.z, 0, -d.x).normalize();
        const m = new T.Matrix4().makeTranslation(E.x, E.y, E.z)
          .multiply(new T.Matrix4().makeRotationAxis(axis, id.ang))
          .multiply(new T.Matrix4().makeTranslation(P.x - E.x, P.y - E.y, P.z - E.z));
        M.copy(m).multiply(base);
      } else M.makeTranslation(P.x, P.y, P.z).multiply(base);
      if (s <= 0.001) M.makeScale(0, 0, 0);
      mesh.setMatrixAt(id.slot, M); mesh.instanceMatrix.needsUpdate = true;
    },

    topple(env, id) {
      const w = this.w;
      // the stone answers at once: it leans away from you, then falls
      const dx = id.x - w.pos.x, dz = id.z - w.pos.z, l = Math.hypot(dx, dz) || 1;
      id.dir = { x: dx / l, z: dz / l }; id.state = 'fall'; id.t = 0; id.av = 0.6; id.ang = 0.04;
      id.circle[2] = -10;
      const sp = w.spatial(id, 8);
      SND.knock(env.bus, { f: 80, gain: 0.3, click: 900, pan: sp.pan });
      SND.swell(env.bus, { f0: 180, f1: 520, dur: 0.9, gain: 0.05, pan: sp.pan });
      this.n++;
      w.progress(this.n, this.n < N ? `${N - this.n} stones remain: follow the gold glint` : 'The last has fallen');
      if (this.n === 1) setTimeout(() => this.w && this.w.say('Truth Has Come', 'Around the Ka‘bah stood 360 idols. He struck them with a stick in his hand, saying: <span class="q">“Truth has come and falsehood has vanished; falsehood is bound to vanish.”</span> (Qur’an 17:81; Sahih al-Bukhari 4287)', { ar: 'جَاءَ الْحَقُّ وَزَهَقَ الْبَاطِلُ', ms: 13000 }), 1600);
      if (this.n === 18) setTimeout(() => this.w && this.w.say('Whoever Shuts His Door Is Safe', 'He declared that whoever entered the house of Abu Sufyan was safe, whoever laid down his arms was safe, and whoever shut his door was safe. (Sahih Muslim 1780)', { ms: 12000 }), 1600);
      if (this.n === 9 || this.n === 18 || this.n === 27) {
        const tones = { 9: [146.83, 'u'], 18: [220, 'o'], 27: [293.66, 'o'] }[this.n];
        this.choir.push(SND.drone(env.bus, tones[0], { vowel: tones[1], gain: 0.006 }));
      }
      if (this.n >= N) { this.phase = 'hush'; this.phaseT = 0; }
    },

    burst(x, y, z, n, spread, up) {
      for (let k = 0; k < n; k++) {
        const p = this.parts[this.pi = (this.pi + 1) % this.parts.length];
        const a = Math.random() * 6.283, s = Math.random() * spread;
        Object.assign(p, { life: 0, max: 1.6 + Math.random() * 1.8, x: x + Math.cos(a) * s * 0.4, y: y + Math.random() * 0.4, z: z + Math.sin(a) * s * 0.4, vx: Math.cos(a) * s, vy: up * (0.4 + Math.random()), vz: Math.sin(a) * s, s: 1.2 + Math.random() * 2.2 });
      }
    },

    update(env, dt) {
      const w = this.w; if (!w) return;
      w.update(dt);
      const t = w.time, T = THREE;
      if (w.skyMesh) w.skyMesh.position.copy(w.camera.position);   // the dome travels with the eye, so high shots never clip it
      KIT.driftDust(this.motes, dt, t, [0.12, 0.04]);
      if (!w.cine) this.sinceStart += dt;
      if (this.sinceStart > 1.5 && !this.saidIntro) {
        this.saidIntro = true;
        w.say('Ten Thousand', 'In Ramadan of 8 AH the Prophet ﷺ set out for Makkah with about ten thousand, and entered the city. Their banners stand on the heights. (Sahih al-Bukhari 4276)', { ms: 11000 });
      }

      // banners stir in the morning wind
      const cp = this.cloth.geometry.attributes.position, base = this.clothBase;
      for (const bn of this.banners) {
        for (let j = 0; j <= 3; j++) for (let i = 0; i <= 8; i++) {
          const k = bn.base + j * 9 + i, u = i / 8, wave = Math.sin(t * 3.2 + u * 5 + bn.ph) * 0.35 * u;
          cp.setXYZ(k, base[k * 3] + Math.sin(bn.yaw) * wave, base[k * 3 + 1] + Math.sin(t * 2 + u * 3) * 0.06 * u, base[k * 3 + 2] + Math.cos(bn.yaw) * wave);
        }
      }
      cp.needsUpdate = true;
      this.plumes.forEach(p => { p.sp.position.x = p.x0 + Math.sin(t * 0.05 + p.ph) * 8; p.sp.material.opacity = 0.32 + 0.12 * Math.sin(t * 0.2 + p.ph); const s = p.sc * (1 + 0.08 * Math.sin(t * 0.13 + p.ph)); p.sp.scale.set(s * 1.6, s, 1); });

      // the stones: tip, fall with weight, settle, then dissolve into dust
      for (const id of this.idols) {
        if (id.state === 'fall') {
          id.t += dt;
          id.av += dt * 5.2; id.ang += id.av * dt;
          if (id.ang >= Math.PI / 2) {
            id.ang = Math.PI / 2; id.state = 'settle'; id.t = 0;
            const sp = this.w.spatial(id, 9), tip = { x: id.x + id.dir.x * id.h, z: id.z + id.dir.z * id.h };
            SND.thump(env.bus, { f: 46, gain: 0.45, dur: 0.6, pan: sp.pan });
            SND.knock(env.bus, { f: 70, gain: 0.25, click: 700, pan: sp.pan });
            SND.sing(env.bus, U.pick([98, 110, 116.54, 130.81]), { vowel: 'o', dur: 3.2, gain: 0.05, voices: 2, attack: 0.25, hold: 0.4, pan: sp.pan, breath: 0.09 });
            for (let k = 0; k <= 4; k++) this.burst(U.lerp(id.x, tip.x, k / 4), id.y, U.lerp(id.z, tip.z, k / 4), 12, 1.8, 0.8);
          }
          this.place(id);
        } else if (id.state === 'settle') {
          id.t += dt;
          id.ang = Math.PI / 2 - Math.abs(Math.sin(id.t * 9)) * 0.1 * Math.exp(-id.t * 6);
          this.place(id);
          if (id.t > 0.7) { id.state = 'dissolve'; id.t = 0; }
        } else if (id.state === 'dissolve') {
          id.t += dt;
          const k = 1 - U.smooth(0, 1.8, id.t);
          if (Math.random() < dt * 30) { const f = Math.random() * id.h; this.burst(id.x + id.dir.x * f, id.y + 0.2, id.z + id.dir.z * f, 2, 0.6, 0.5); }
          this.place(id, k);
          if (k <= 0) {
            id.state = 'gone';
            this.marks.setMatrixAt(id.i, this.tmpM.compose(this.tmpV.set(id.x + id.dir.x * id.h * 0.4, id.y + 0.04, id.z + id.dir.z * id.h * 0.4), this.tmpQ.setFromAxisAngle(this.tmpS.set(0, 1, 0), Math.atan2(id.dir.x, id.dir.z)), this.tmpS.set(1.1, 1, id.h * 0.6)));
            this.marks.instanceMatrix.needsUpdate = true;
          }
        }
      }
      // dust particles
      const dp = this.dustPts.geometry.attributes;
      for (let i = 0; i < this.parts.length; i++) {
        const p = this.parts[i];
        if (p.life < p.max) {
          p.life += dt; p.vx *= 1 - dt * 1.8; p.vz *= 1 - dt * 1.8; p.vy = p.vy * (1 - dt * 1.2) + dt * 0.15;
          p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
          const q = p.life / p.max;
          dp.aAlpha.array[i] = Math.sin(Math.min(1, q * 4) * Math.PI / 2) * (1 - q) * 0.65;
          dp.aSize.array[i] = p.s * (1 + q * 2.4);
        } else dp.aAlpha.array[i] = 0;
        dp.position.array[i * 3] = p.x; dp.position.array[i * 3 + 1] = p.y; dp.position.array[i * 3 + 2] = p.z;
      }
      dp.position.needsUpdate = true; dp.aAlpha.needsUpdate = true; dp.aSize.needsUpdate = true;

      // the next stone: the nearest standing one wears a gold glint
      let best = null, bd = 1e9;
      for (const id of this.idols) if (id.state === 'stand') { const d = Math.hypot(id.x - w.pos.x, id.z - w.pos.z); if (d < bd) { bd = d; best = id; } }
      if (best) {
        this.glint.position.set(best.x, best.y + best.h + 0.35, best.z);
        this.glint.material.opacity = 0.65 + 0.25 * Math.sin(t * 3);
        this.glint.scale.setScalar(2.2 + 0.3 * Math.sin(t * 3));
        this.glintLight.position.set(best.x, best.y + best.h * 0.6, best.z + 0.01);
        this.glintLight.intensity = 0.8;
      } else { this.glint.material.opacity = Math.max(0, this.glint.material.opacity - dt); this.glintLight.intensity = 0; }

      // voices of the host on the heights, fewer as the stones fall and a hush gathers
      this.murmurClock -= dt;
      if (this.murmurClock < 0 && this.phase === 'clear') {
        this.murmurClock = 0.9 + Math.random() * 1.8;
        const s0 = U.pick(this.bannerSites), sp = w.spatial(s0, 120);
        SND.sing(env.bus, U.rnd(110, 175), { vowel: U.pick(['a', 'o', 'u']), dur: U.rnd(0.6, 1.4), gain: 0.012 + sp.gain * 0.02, pan: sp.pan, voices: 2, breath: 0.25, attack: 0.15, hold: 0.3, vib: 0.003 });
      }
      this.birdClock -= dt;
      if (this.birdClock < 0) { this.birdClock = 3 + Math.random() * 5; SND.chirp(env.bus, { gain: 0.012 }); }

      // the hush, then the call from the roof, then the pardon
      if (this.phase === 'hush' || this.phase === 'call' || this.phase === 'after') {
        const T0 = this.phaseT, T1 = (this.phaseT += dt), cross = s => T0 < s && T1 >= s;
        if (this.phase === 'hush') {
          this.wind.set('gain', 0.008, 0.8); this.host.set('gain', 0.004, 0.8);
          this.choir.forEach(c => c.setGain(0.002, 1));
          if (T1 > 3) { this.phase = 'call'; this.phaseT = 0; this.callStart(env); }
        }
        if (this.phase === 'call') {
          const k = U.smooth(0, 3, T1);
          this.callCol.material.opacity = 0.42 * k * (0.85 + 0.15 * Math.sin(t * 2));
          this.callGlow.material.opacity = 0.9 * k;
          this.callRings.forEach((m, i) => { const q = ((T1 * 0.35 + i / 3) % 1); m.scale.setScalar(1 + q * 40); m.material.opacity = k * (1 - q) * 0.3; m.position.y = KH + 1.4 + q * 2; });
          w.renderer.toneMappingExposure = 1 + 0.12 * k;
          this.choir.forEach(c => c.setGain(0.004 + 0.006 * k, 2));
          if (cross(1)) w.say('The Call from the Roof', 'The sirah reports that Bilal climbed onto the roof of the Ka‘bah and gave the call to prayer over the city. Here it rises only as a voice and a column of light. (Ibn Ishaq / Ibn Hisham)', { ms: 13000 });
          if (cross(19)) {
            this.phase = 'after'; this.phaseT = 0;
            this.wind.set('gain', 0.03, 3); this.host.set('gain', 0.015, 3);
            w.finish('The idols have fallen; the city is pardoned');
            setTimeout(() => this.w && this.w.say('Go, You Are Free', 'The general pardon of Makkah is well established. The sirah adds that he said to the people of Quraysh: <span class="q">“Go, you are free.”</span> It is a well-known report, but its chain is weak; it is told here as tradition. (Ibn Ishaq; tradition)', { ms: 16000 }), 2500);
          }
        }
        if (this.phase === 'after') {
          this.callCol.material.opacity = 0.42 * (1 - U.smooth(0, 12, T1) * 0.6);
          this.callRings.forEach((m, i) => { const q = ((t * 0.35 + i / 3) % 1); m.scale.setScalar(1 + q * 40); m.material.opacity = (1 - q) * 0.15 * (1 - U.smooth(0, 10, T1)); });
        }
      }
      // doves circle the House once the call has risen, then keep circling
      const dv = this.phase === 'call' || this.phase === 'after' ? U.smooth(2, 10, this.phase === 'after' ? 30 : this.phaseT) : 0;
      this.doves.forEach((d, i) => {
        d.a += dt * d.sp;
        const y = U.lerp(-20, d.y, dv) + Math.sin(t * 1.3 + d.ph) * 0.6;
        this.tmpQ.setFromAxisAngle(this.tmpV.set(0, 1, 0), -d.a);
        this.tmpM.compose(this.tmpS.set(Math.cos(d.a) * d.r, y, Math.sin(d.a) * d.r), this.tmpQ, this.tmpV.set(1, 1, 1).multiplyScalar(dv > 0.01 ? 1 : 0));
        this.doveMesh.setMatrixAt(i, this.tmpM);
      });
      this.doveMesh.instanceMatrix.needsUpdate = true;
    },

    /* A wordless call, sung by one voice from the roof: long melismatic phrases, each answered
       by an echo from the hills. No words are sung. */
    callStart(env) {
      const w = this.w, src = { x: KW / 2 - 1.5, z: -KD / 2 + 1.5 };
      const sp = w.spatial(src, 30);
      const phrases = [
        [[293.66, 1.8], [329.63, 0.45], [349.23, 0.5], [329.63, 0.5], [293.66, 2.0]],
        [[349.23, 1.5], [392, 0.5], [440, 2.0], [392, 0.45], [349.23, 0.5], [329.63, 1.9]],
        [[440, 1.6], [466.16, 0.4], [440, 0.5], [392, 0.5], [349.23, 0.5], [293.66, 2.6]],
      ];
      let at = 0.4;
      phrases.forEach(ph => {
        let prev = ph[0][0];
        ph.forEach(([f, d]) => {
          SND.sing(env.bus, f, { vowel: d > 1.2 ? 'a' : 'o', dur: d + 0.35, delay: at, gain: 0.07, voices: 1, attack: 0.09, hold: 0.75, vib: 0.011, vibRate: 5.4, glide: prev / f, breath: 0.07, pan: sp.pan * 0.6 });
          SND.sing(env.bus, f, { vowel: 'o', dur: d + 0.4, delay: at + 0.55, gain: 0.014, voices: 1, attack: 0.15, hold: 0.6, vib: 0.01, pan: -sp.pan * 0.8 });   // echo from the hills
          prev = f; at += d * 0.92;
        });
        at += 1.1;
      });
      SND.glow(env.bus, 146.83, { gain: 0.05, dur: at + 4, delay: 0.5, vowel: 'o' });
    },
  }));
})();
