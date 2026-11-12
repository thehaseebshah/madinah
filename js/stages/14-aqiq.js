/* Station X — Wadi al-'Aqiq, the Blessed Valley (walkable).
   A moonlit night after rain. The seasonal stream is running between banks of black basalt and
   acacia. Wade in it, skip stones across it (E at the water's edge), rest under the acacia, and
   follow the water north to the rise where the lights of the city appear. */
(function () {
  'use strict';
  if (!window.WORLD) return;
  const WATER_Y = -0.35, HALF = 3.2, END_Z = -168;
  const cx = z => 7 * Math.sin(z * 0.028) + 3 * Math.sin(z * 0.071 + 1.3);

  function height(x, z) {
    const d = Math.abs(x - cx(z));
    let y;
    if (d < HALF) y = -0.75 + (d / HALF) * 0.3;
    else y = -0.45 + (d - HALF) * 0.16;
    y += Math.pow(Math.max(0, d - 20), 1.45) * 0.14;           // valley walls
    y += U.noise2(x * 0.08, z * 0.08) * 0.35 * U.smooth(HALF, HALF + 4, d);
    y += U.smooth(END_Z + 25, END_Z - 6, z) * 2.4 * U.smooth(14, 0, d - HALF);  // the rise at the end
    return y;
  }

  const WATER_VERT = `varying vec3 vW; varying float vD; void main(){ vec4 wp = modelMatrix*vec4(position,1.); vW = wp.xyz; vec4 mv = viewMatrix*wp; vD = -mv.z; gl_Position = projectionMatrix*mv; }`;
  const WATER_FRAG = `
uniform float uTime; uniform vec3 uMoon; uniform vec3 uTop; uniform vec3 uHor; uniform vec3 uFog; uniform float uFogD; uniform vec4 uRip[8];
varying vec3 vW; varying float vD;
void main(){
  vec2 p = vW.xz;
  vec2 g = vec2(0.);
  // the current runs toward -z; layered ripples ride on it
  g += vec2(0.25, 1.0) * cos(dot(p, vec2(0.25, 1.0))*1.9 + uTime*2.4) * 0.07;
  g += vec2(-0.6, 0.8) * cos(dot(p, vec2(-0.6, 0.8))*3.3 + uTime*3.1) * 0.045;
  g += vec2(0.9, 0.45) * cos(dot(p, vec2(0.9, 0.45))*5.7 + uTime*4.3) * 0.03;
  g += vec2(0.1, 1.0) * cos(dot(p, vec2(0.1, 1.0))*9.1 + uTime*6.0) * 0.018;
  for (int i=0;i<8;i++){
    vec4 r = uRip[i];
    if (r.w <= 0.) continue;
    float age = uTime - r.z; if (age < 0. || age > 4.) continue;
    vec2 dv = p - r.xy; float d = length(dv) + 1e-4;
    float front = age * 2.2;
    float ring = sin((d - front) * 9.) * exp(-pow(d - front, 2.) * 3.) * exp(-age * 0.9) * r.w;
    g += dv / d * ring * 0.35;
  }
  vec3 n = normalize(vec3(-g.x, 1., -g.y));
  vec3 v = normalize(cameraPosition - vW);
  vec3 rf = reflect(-v, n);
  float fres = 0.03 + 0.97*pow(1. - max(dot(n, v), 0.), 5.);
  vec3 sky = mix(uHor, uTop, clamp(rf.y*1.6, 0., 1.));
  float m = max(dot(rf, normalize(uMoon)), 0.);
  vec3 col = mix(vec3(0.01, 0.025, 0.035), sky*1.15, fres) + vec3(1.0, 0.96, 0.86)*(pow(m, 420.)*4. + pow(m, 40.)*0.22);
  float f = 1. - exp(-pow(uFogD*vD, 2.));
  gl_FragColor = vec4(mix(col, uFog, f), 1.);
}`;

  ENGINE.register(WORLD.stage({
    key: 'aqiq',
    arabic: 'وَادي العَقِيق',
    title: 'The Blessed Valley',
    era: 'Wadi al-‘Aqiq · a night after rain · walk the stream',
    hint: 'WASD to walk · E at the water to skip a stone · follow the stream to the lights',
    sound: { reverb: 0.5 },
    story: `<p>West of the city runs Wadi al-‘Aqiq, a valley that is dry most of the year and flows after heavy rain. The people of Madinah loved its open banks and its sweet wells.</p>
            <p class="q"><span class="ar">صَلِّ فِي هَذَا الْوَادِي الْمُبَارَكِ</span>“Pray in this blessed valley.” (Sahih al-Bukhari)</p>
            <p>Wade in the water, skip a stone, rest under the acacia, and follow the stream to the rise at its end.</p>`,

    shotDur: 11,
    // low over the moonlit water upstream, rising to the bank where you stand
    shots() { return [[[cx(-46), 0.9, -46], [cx(-12), 0.2, -12]], [[cx(-16), 1.1, -16], [cx(6), 0.3, 6]], [[cx(4) + 3, 2.8, 4], [cx(10) + 7, 1.5, 10]], [[cx(10) + 7, 3, 14], [cx(10) + 7, 1.5, 4]], [[0, 0, 0], [0, 0, 0]]]; },

    enter(env) {
      const T = THREE;
      const self = this;
      const fogCol = new T.Color(0x0e1424);
      const w = this.w = WORLD.create(env, {
        start: { x: cx(10) + 7, z: 10, yaw: 0.15 }, exposure: 1.15,
        fog: { color: fogCol, density: 0.011 },
        bounds: [-60, END_Z - 4, 60, 28], ground: height,
        surface: (x, z) => { const d = Math.abs(x - cx(z)); return d < HALF ? 'water' : d < HALF + 2.5 ? 'gravel' : 'sand'; },
      });
      const S = w.scene;
      const moonDir = new T.Vector3(0.25, 0.42, -0.87).normalize();
      w.sky({ top: '#070c1e', mid: '#1c2848', bot: '#0a0e1a', sunDir: moonDir.toArray(), sun: '#c8d4ff', sunSize: 0.0009, stars: 1 });
      S.add(new T.HemisphereLight(0x6a7cb0, 0x2a2420, 0.9));
      const moon = new T.DirectionalLight(0xbfd0ff, 1.1); moon.position.copy(moonDir).multiplyScalar(100); S.add(moon);
      const halo = KIT.glow(w, 0xdde6ff, 120, 0.12); halo.position.copy(moonDir).multiplyScalar(800); halo.material.fog = false; S.add(halo);
      const disk = KIT.glow(w, 0xffffff, 26, 1); disk.position.copy(moonDir).multiplyScalar(790); disk.material.fog = false; S.add(disk);

      // terrain
      const geo = new T.PlaneGeometry(160, 230, 160, 230);
      geo.rotateX(-Math.PI / 2); geo.translate(0, 0, -70);
      const pos = geo.attributes.position, col = new Float32Array(pos.count * 3);
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i), z = pos.getZ(i), y = height(x, z);
        pos.setY(i, y);
        const d = Math.abs(x - cx(z));
        const wet = U.smooth(HALF + 3, HALF, d), cliff = U.smooth(18, 30, d);
        let c = U.mix([0.56, 0.5, 0.44], [0.3, 0.28, 0.27], wet);
        c = U.mix(c, [0.26, 0.24, 0.25], cliff);
        col.set(c, i * 3);
      }
      geo.setAttribute('color', new T.BufferAttribute(col, 3));
      geo.computeVertexNormals();
      S.add(new T.Mesh(geo, KIT.std({ map: KIT.sand(w, [50, 70]), vertexColors: true })));

      // the stream
      this.ripples = Array.from({ length: 8 }, () => new T.Vector4(0, 0, -99, 0)); this.ripI = 0;
      this.waterMat = new T.ShaderMaterial({
        vertexShader: WATER_VERT, fragmentShader: WATER_FRAG,
        uniforms: {
          uTime: { value: 0 }, uMoon: { value: moonDir }, uTop: { value: new T.Color(0x1a2850) }, uHor: { value: new T.Color(0x3a4a70) },
          uFog: { value: fogCol }, uFogD: { value: 0.011 }, uRip: { value: this.ripples },
        },
      });
      const water = new T.Mesh(new T.PlaneGeometry(60, 230, 1, 1), this.waterMat);
      water.rotation.x = -Math.PI / 2; water.position.set(0, WATER_Y, -70); S.add(water);

      // boulders of basalt
      const basalt = KIT.std({ map: KIT.basalt(w, [1, 1]), color: 0xe0dad8, flatShading: true, roughness: 0.8 });
      const r = U.seeded(17);
      for (let i = 0; i < 150; i++) {
        const z = 25 - r() * 195, side = r() < 0.5 ? -1 : 1, d = HALF + 1 + Math.pow(r(), 1.6) * 26;
        const x = cx(z) + side * d, s = 0.3 + Math.pow(r(), 2.5) * 2.6;
        const gg = new T.DodecahedronGeometry(s, 0);
        const m = new T.Mesh(gg, basalt); m.position.set(x, height(x, z) + s * 0.35, z); m.rotation.set(r() * 3, r() * 3, r() * 3); m.scale.y = 0.7;
        S.add(m);
        if (s > 0.7) w.addCircle(x, z, s * 0.85);
      }

      // acacia (talh) trees: thorny, wide, flat-crowned
      const barkM = KIT.std({ color: 0x3a2e26 });
      const leafM = KIT.std({ color: 0x3e4a2c, roughness: 1, flatShading: true });
      const acacia = (x, z, h) => {
        const g = new T.Group(); const y0 = height(x, z);
        const trunk = new T.Mesh(new T.CylinderGeometry(0.12, 0.22, h, 6), barkM); trunk.position.y = h / 2; trunk.rotation.z = (r() - 0.5) * 0.3; g.add(trunk);
        for (let k = 0; k < 3; k++) {
          const br = new T.Mesh(new T.CylinderGeometry(0.05, 0.1, h * 0.7, 5), barkM);
          br.position.set(Math.cos(k * 2.1) * 0.6, h * 0.95, Math.sin(k * 2.1) * 0.6); br.rotation.set(Math.sin(k * 2.1) * 0.7, 0, -Math.cos(k * 2.1) * 0.7); g.add(br);
        }
        for (let k = 0; k < 4; k++) {
          const cg = new T.IcosahedronGeometry(1, 1); const cp = cg.attributes.position;
          for (let i = 0; i < cp.count; i++) cp.setY(i, cp.getY(i) * 0.28 + (r() - 0.5) * 0.08);
          cg.computeVertexNormals();
          const c = new T.Mesh(cg, leafM); const R = h * (0.55 + r() * 0.3);
          c.scale.set(R, R, R); c.position.set((r() - 0.5) * h * 0.7, h * 1.3 + r() * 0.4, (r() - 0.5) * h * 0.7); g.add(c);
        }
        g.position.set(x, y0, z); S.add(g); w.addCircle(x, z, 0.3);
        return g;
      };
      this.doveTree = acacia(cx(2) + 9, 2, 3.2);
      for (let i = 0; i < 34; i++) {
        const z = 20 - r() * 185, side = r() < 0.5 ? -1 : 1, d = HALF + 4 + r() * 18;
        acacia(cx(z) + side * d, z, 2.2 + r() * 2);
      }
      // a few palms of the old gardens
      for (let i = 0; i < 12; i++) { const z = -20 - r() * 120, x = cx(z) + (r() < 0.5 ? -1 : 1) * (HALF + 8 + r() * 10); const p = KIT.palm(w, 6 + r() * 5); p.position.set(x, height(x, z), z); S.add(p); w.addCircle(x, z, 0.35); }

      // the lights of Madinah beyond the rise, and a lantern at the lookout
      const city = new T.Group();
      { const n = 600, cp = new Float32Array(n * 3), cc = new Float32Array(n * 3);
        for (let i = 0; i < n; i++) { cp.set([(r() - 0.5) * 420, -3 + r() * 6, END_Z - 120 - r() * 160], i * 3); cc.set(i % 11 ? [1, 0.78, 0.5] : [0.75, 1, 0.85], i * 3); }
        const cg = new T.BufferGeometry(); cg.setAttribute('position', new T.BufferAttribute(cp, 3)); cg.setAttribute('color', new T.BufferAttribute(cc, 3));
        const pts = new T.Points(cg, new T.PointsMaterial({ map: KIT.glowTex(w), size: 4.5, vertexColors: true, transparent: true, depthWrite: false, blending: T.AdditiveBlending, fog: false }));
        city.add(pts); }
      const cityHalo = KIT.glow(w, 0xffb070, 420, 0.22); cityHalo.position.set(0, 10, END_Z - 220); cityHalo.material.fog = false; city.add(cityHalo);
      const dome = KIT.glow(w, 0x60e0a0, 14, 0.9); dome.position.set(-10, 4, END_Z - 190); dome.material.fog = false; city.add(dome);
      S.add(city);
      const lx = cx(END_Z + 4) + 5, lz = END_Z + 4;
      const post = new T.Mesh(new T.CylinderGeometry(0.06, 0.06, 1.4, 6), barkM); post.position.set(lx, height(lx, lz) + 0.7, lz); S.add(post);
      this.lantern = KIT.glow(w, 0xffd090, 2.2, 1); this.lantern.position.set(lx, height(lx, lz) + 1.5, lz); S.add(this.lantern);
      const ll = new T.PointLight(0xffb060, 1.6, 14, 2); ll.position.copy(this.lantern.position); S.add(ll);

      // doves
      this.doves = [];
      const dg = new T.BufferGeometry(); this.dovePos = new Float32Array(12 * 3); dg.setAttribute('position', new T.BufferAttribute(this.dovePos, 3));
      this.dovePts = new T.Points(dg, new T.PointsMaterial({ color: 0xf4f0e8, size: 0.25 })); this.dovePts.frustumCulled = false; S.add(this.dovePts);
      // skipping stones
      this.stones = [];
      this.stoneGeo = new T.SphereGeometry(0.07, 8, 6); this.stoneMat = KIT.std({ color: 0x555050 });
      this.skips = 0; this.best = 0;

      w.followShadow(moon, 30); w.receiveAll();
      this.baked = w.bake();

      /* ---------- interactions ---------- */
      const nearWater = () => Math.abs(w.pos.x - cx(w.pos.z)) < HALF + 3.5;
      const skipItem = w.interact({ key: 'skip', pos: new T.Vector3(), r: 99, label: 'Skip a stone', enabled: nearWater, onUse: () => self.throwStone(env) });
      this.skipItem = skipItem;
      w.interact({
        key: 'doves', pos: [this.doveTree.position.x, this.doveTree.position.y + 3.5, this.doveTree.position.z], r: 4, once: true, label: 'Rest under the acacia',
        onUse: () => {
          const p = self.doveTree.position;
          for (let i = 0; i < 12; i++) self.doves.push({ x: p.x + U.rnd(-1, 1), y: p.y + 3.8, z: p.z + U.rnd(-1, 1), vx: U.rnd(-3, 3), vy: U.rnd(2, 4), vz: U.rnd(-5, -1), life: 7 });
          for (let k = 0; k < 16; k++) SND.swell(env.bus, { color: 'white', type: 'bandpass', f0: 900, f1: 2200, dur: 0.09, gain: 0.05 * (1 - k / 18), delay: k * 0.06, q: 1.5, pan: U.rnd(-0.6, 0.6) });
          SND.coo(env.bus, { gain: 0.05, delay: 1.2 });
          w.say('The Talh Tree', 'Acacia, <i>talh</i>, grows along the dry valleys of the Hijaz: thorny, flat-crowned, and the shade a traveller looks for. In this valley the companions kept gardens and dug wells, and it was said that its water was among the sweetest in Madinah.', { ms: 11000 });
        },
      });
      this.reached = false;
      w.activity('Stones on the water', 2, 'At the water\u2019s edge, skip a stone four times (E)');

      /* ---------- sound ---------- */
      const b = env.bus;
      this.stream = SND.noise(b, { color: 'pink', type: 'bandpass', freq: 1400, q: 0.5, gain: 0.0 });
      this.streamLo = SND.noise(b, { color: 'brown', type: 'lowpass', freq: 500, gain: 0.0 });
      this.streamHi = SND.noise(b, { color: 'white', type: 'bandpass', freq: 5200, q: 2, gain: 0.0 });
      SND.lfo(b, this.stream.filter && this.stream.filter.frequency, 0.35, 280);
      this.night = SND.noise(b, { color: 'brown', type: 'lowpass', freq: 250, gain: 0.05 });
      this.cricketClock = 0; this.frogClock = 2; this.babble = 0;
    },

    throwStone(env) {
      const w = this.w, T = THREE;
      const f = w.forward();
      const dir = new T.Vector3(f.x, 0, f.z).normalize();
      const m = new T.Mesh(this.stoneGeo, this.stoneMat); m.scale.y = 0.45;
      m.position.set(w.pos.x + dir.x * 0.4, w.y + 1.2, w.pos.z + dir.z * 0.4);
      w.scene.add(m);
      this.stones.push({ m, vx: dir.x * 13, vy: 1.6, vz: dir.z * 13, skips: 0, alive: true });
      SND.swell(env.bus, { color: 'white', type: 'highpass', f0: 1500, f1: 3500, dur: 0.25, gain: 0.04 });
    },

    ripple(x, z, amp) {
      const r = this.ripples[this.ripI++ % 8];
      r.set(x, z, this.w.time, amp);
    },

    update(env, dt) {
      const w = this.w; if (!w) return;
      w.update(dt);
      const t = w.time;
      this.waterMat.uniforms.uTime.value = t;

      // stones skipping across the current
      for (const s of this.stones) {
        if (!s.alive) continue;
        s.vy -= 9.8 * dt;
        s.m.position.x += s.vx * dt; s.m.position.y += s.vy * dt; s.m.position.z += s.vz * dt;
        s.m.rotation.y += dt * 20;
        const p = s.m.position;
        const inWater = Math.abs(p.x - cx(p.z)) < HALF + 0.4;
        const sp = w.spatial(p, 8);
        if (p.y <= WATER_Y && s.vy < 0) {
          if (!inWater) { s.alive = false; SND.knock(env.bus, { f: 300, gain: 0.08 * sp.gain + 0.02, click: 3000, pan: sp.pan }); continue; }
          const h = Math.hypot(s.vx, s.vz);
          this.ripple(p.x, p.z, 1);
          if (h > 4.5 && s.skips < 9) {
            s.skips++; s.vy = Math.abs(s.vy) * 0.5 + 0.9; s.vx *= 0.78; s.vz *= 0.78; p.y = WATER_Y + 0.01;
            SND.drop(env.bus, { f: 700 + s.skips * 90, gain: 0.09 * sp.gain + 0.03, pan: sp.pan, dur: 0.1 });
          } else {
            s.alive = false;
            SND.drop(env.bus, { f: 340, gain: 0.12 * sp.gain + 0.04, pan: sp.pan, dur: 0.25 });
            SND.thump(env.bus, { f: 90, gain: 0.06 * sp.gain });
            this.skips = s.skips; this.best = Math.max(this.best, s.skips);
            w.step(`Last throw: ${s.skips} skip${s.skips === 1 ? '' : 's'} · best ${this.best}` + (this.best >= 4 ? '. Now follow the stream to the lights' : '. Try for four'));
            if (this.best >= 4 && !this.skipped) { this.skipped = true; w.progress(1); }
            if (s.skips >= 4) SND.bell(env.bus, 392 + s.skips * 40, { gain: 0.05, glass: true });
          }
        }
        if (p.y < -3) s.alive = false;
      }
      this.stones = this.stones.filter(s => { if (!s.alive) { w.scene.remove(s.m); return false; } return true; });
      { const f = w.forward(), l = Math.hypot(f.x, f.z) || 1; this.skipItem.pos.set(w.pos.x + f.x / l * 3, w.y + 1.4, w.pos.z + f.z / l * 3); }

      // wading makes the water talk
      const dStream = Math.abs(w.pos.x - cx(w.pos.z));
      if (dStream < HALF && w.moving > 0.5 && Math.random() < dt * 4) this.ripple(w.pos.x, w.pos.z, 0.5);
      const near = Math.exp(-Math.max(0, dStream - HALF) / 7);
      this.stream.set('gain', 0.03 + 0.11 * near, 0.4);
      this.streamLo.set('gain', 0.02 + 0.05 * near, 0.4);
      this.streamHi.set('gain', 0.004 + 0.014 * near, 0.4);
      this.babble -= dt;
      if (this.babble < 0) { this.babble = 0.05 + Math.random() * 0.25; if (Math.random() < near) SND.drop(env.bus, { f: U.rnd(600, 1500), gain: 0.025 * near, pan: U.rnd(-0.7, 0.7), dur: 0.08 }); }

      // doves
      const dp = this.dovePos; let n = 0;
      for (const d of this.doves) { d.life -= dt; d.vy += 0.5 * dt; d.x += d.vx * dt; d.y += d.vy * dt; d.z += d.vz * dt; }
      this.doves = this.doves.filter(d => d.life > 0);
      for (const d of this.doves) { dp[n * 3] = d.x; dp[n * 3 + 1] = d.y + Math.sin(t * 14 + n) * 0.05; dp[n * 3 + 2] = d.z; n++; }
      for (let i = n; i < 12; i++) dp[i * 3 + 1] = -999;
      this.dovePts.geometry.attributes.position.needsUpdate = true;

      // night creatures
      this.cricketClock -= dt;
      if (this.cricketClock < 0) { this.cricketClock = 0.2 + Math.random() * 0.8; SND.cricket(env.bus, { gain: 0.006 }); }
      this.frogClock -= dt;
      if (this.frogClock < 0) {
        this.frogClock = 1 + Math.random() * 3;
        const pan = U.rnd(-0.9, 0.9), f = U.rnd(180, 260), n2 = 3 + (Math.random() * 4 | 0);
        for (let k = 0; k < n2; k++) setTimeout(() => SND.knock(env.bus, { f, gain: 0.05 * near + 0.01, click: 600, pan }), k * 90);
      }
      this.lantern.material.opacity = 0.8 + 0.2 * U.noise1(t * 5);

      // the lookout
      if (!this.reached && w.pos.z < END_Z + 12) {
        this.reached = true;
        SND.glow(env.bus, 130.81, { gain: 0.06, dur: 9 });
        SND.glow(env.bus, 196, { gain: 0.04, dur: 9, delay: 1.2 });
        w.say('The Lights of the City', 'From the rise at the end of the valley the city comes into view, gathered around the green dome of the Prophet’s Mosque, a few kilometres to the east.', { ms: 12000 });
        w.finish('The lights of the city');
      }
    },
  }));
})();
