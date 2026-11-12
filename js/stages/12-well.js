/* Station VIII — The Well of Rumah (walkable).
   Dusk in a palm garden west of the city. A basalt well-head with a wooden frame and pulley, a stone
   channel, and the evening sky lying in a small circle at the bottom of the shaft. Haul the bucket up
   hand over hand, then carry it to five places in the garden: the flock's trough, a traveller's
   waterskin, a palm's channel, a house's jar and a mosque's ablution basin. Each fills and glows,
   and with each one the evening choir gains a voice. No person is shown. */
(function () {
  'use strict';
  if (!window.WORLD) return;
  const MOUTH_R = 0.82, MOUTH_Y = 0.92, WATER_Y = -3.4, BUCKET_TOP = 1.25, BUCKET_LOW = WATER_Y + 0.12;
  const PULLS = 12, SLIP = 0.035;
  const HAUL = { x: 0, z: 1.9 };

  const WATER_VERT = `varying vec3 vW; void main(){ vec4 wp = modelMatrix*vec4(position,1.); vW = wp.xyz; gl_Position = projectionMatrix*viewMatrix*wp; }`;
  const WATER_FRAG = `
uniform float uTime; uniform vec3 uTop; uniform vec3 uHor; uniform vec3 uSunDir; uniform vec3 uSun; uniform vec4 uRip[8];
uniform float uShaft; uniform float uMouthY; uniform float uMouthR; uniform float uGlow; uniform vec3 uGlowCol; uniform float uFill;
varying vec3 vW;
void main(){
  vec2 p = vW.xz;
  vec2 g = vec2(0.);
  g += vec2(0.7, 0.7) * cos(dot(p, vec2(0.7, 0.7))*7.0 + uTime*1.3) * 0.012;
  g += vec2(-0.8, 0.6) * cos(dot(p, vec2(-0.8, 0.6))*11.0 + uTime*1.9) * 0.008;
  for (int i=0;i<8;i++){
    vec4 r = uRip[i];
    if (r.w <= 0.) continue;
    float age = uTime - r.z; if (age < 0. || age > 3.5) continue;
    vec2 dv = p - r.xy; float d = length(dv) + 1e-4;
    float front = age * 0.9;
    float ring = sin((d - front) * 34.) * exp(-pow(d - front, 2.) * 40.) * exp(-age * 1.2) * r.w;
    g += dv / d * ring * 0.5;
  }
  vec3 n = normalize(vec3(-g.x, 1., -g.y));
  vec3 v = normalize(cameraPosition - vW);
  vec3 rf = reflect(-v, n);
  vec3 sky = mix(uHor, uTop, clamp(rf.y*1.3, 0., 1.));
  float s = max(dot(rf, normalize(uSunDir)), 0.);
  sky += uSun * (pow(s, 12.)*0.5 + pow(s, 200.)*2.);
  float fres = 0.04 + 0.96*pow(1. - max(dot(n, v), 0.), 5.);
  vec3 deep = vec3(0.012, 0.02, 0.03);
  vec3 col;
  if (uShaft > 0.5) {
    // down in the shaft only the small circle of sky at the mouth can be seen in the water
    float t = (uMouthY - vW.y) / max(rf.y, 0.02);
    vec2 hit = vW.xz + rf.xz * t;
    float inMouth = smoothstep(uMouthR, uMouthR - 0.07, length(hit));
    col = mix(deep + sky * 0.16, sky * 1.15, inMouth * 0.92);
    col += vec3(0.05, 0.04, 0.03) * (1. - inMouth) * pow(1. - max(dot(n, v), 0.), 2.);
  } else {
    col = mix(deep * 2., sky, 0.25 + fres * 0.7);
  }
  col += uGlowCol * uGlow * (0.35 + 0.25 * sin(uTime * 2. + p.x * 3.));
  gl_FragColor = vec4(col, uFill);
}`;

  ENGINE.register(WORLD.stage({
    key: 'well',
    arabic: 'بئر رومة',
    title: 'The Well of Rumah',
    era: 'An endowment of ‘Uthman ibn ‘Affan',
    hint: 'WASD to walk · E at the pulley, then A and D in turn to haul · E to pour',
    sound: { reverb: 0.45 },
    story: `<p>In early Madinah, sweet water was scarce, and the best well, Rumah, belonged to a man who sold its water. The Prophet ﷺ asked who would buy it and give it freely to all. ‘Uthman ibn ‘Affan bought it and made it a <i>waqf</i>, an endowment whose water belonged to everyone.</p>
            <p class="q"><span class="ar">مَنْ يَشْتَرِي بِئْرَ رُومَةَ فَيَجْعَلَ دَلْوَهُ مَعَ دِلَاءِ الْمُسْلِمِينَ</span>“Whoever buys the well of Rumah and makes his bucket one among the buckets of the Muslims…” (Jami‘ at-Tirmidhi 3703, graded hasan)</p>
            <p>The well still stands in the north-west of the city, among palm groves. Draw its water, and carry it to whoever needs it.</p>`,

    enter(env) {
      const T = THREE, self = this;
      const fogCol = new T.Color(0x4a4058);
      const w = this.w = WORLD.create(env, {
        start: { x: 0.6, z: 7.5, yaw: 0.05, pitch: -0.08 }, exposure: 1.0, far: 900,
        fog: { color: fogCol, density: 0.018 }, bounds: [-27, -27, 27, 27],
        surface: (x, z) => (Math.abs(x + 12) < 1.1 ? 'gravel' : Math.hypot(x, z) < 2.2 ? 'stone' : 'sand'),
      });
      const S = w.scene;
      this.carrying = false; this.hauling = false; this.depth = 0; this.lastHand = null; this.idle = 0; this.given = 0;
      this.pours = []; this.seen = {};

      /* ---------- dusk ---------- */
      const sunDir = new T.Vector3(-0.95, 0.035, 0.3).normalize();
      this.skyM = w.sky({ top: '#1b2452', mid: '#e8946c', bot: '#2a2230', sunDir: sunDir.toArray(), sun: '#ff9858', sunSize: 0.0011, stars: 0.35 });
      S.add(new T.HemisphereLight(0x7080c0, 0x2e2428, 0.6));
      const sun = new T.DirectionalLight(0xff9a68, 0.6); sun.position.copy(new T.Vector3(-0.9, 0.22, 0.3).normalize()).multiplyScalar(40); S.add(sun);

      /* ---------- the garden floor, with a hole for the shaft ---------- */
      const gs = new T.Shape(); gs.moveTo(-80, -80); gs.lineTo(80, -80); gs.lineTo(80, 80); gs.lineTo(-80, 80); gs.lineTo(-80, -80);
      const hole = new T.Path(); hole.absarc(0, 0, MOUTH_R + 0.05, 0, Math.PI * 2, true); gs.holes.push(hole);
      const gg = new T.ShapeGeometry(gs, 48); gg.rotateX(-Math.PI / 2);
      const ground = new T.Mesh(gg, KIT.std({ map: KIT.sand(w, [0.14, 0.14]), color: 0xa48a74 }));
      S.add(ground);
      const path = new T.Mesh(new T.PlaneGeometry(2.2, 56), KIT.std({ map: KIT.sand(w, [0.6, 14]), color: 0xd8c0a0 }));
      path.rotation.x = -Math.PI / 2; path.position.set(-12, 0.01, 0); S.add(path);

      /* ---------- the well-head: basalt, a wooden frame, a pulley ---------- */
      const basalt = KIT.basalt(w, [3, 0.6]);
      const basaltM = KIT.std({ map: KIT.mudBrick(w, [3, 0.55]), color: 0x8a8284, relief: 0.07 });
      const head = new T.Mesh(new T.CylinderGeometry(MOUTH_R + 0.5, MOUTH_R + 0.6, MOUTH_Y, 28, 1, true), basaltM); head.position.y = MOUTH_Y / 2; S.add(head);
      const capG = new T.RingGeometry(MOUTH_R, MOUTH_R + 0.5, 28, 1); capG.rotateX(-Math.PI / 2);
      const cap = new T.Mesh(capG, KIT.std({ map: basalt, color: 0xe8e0dc })); cap.position.y = MOUTH_Y; S.add(cap);
      const shaftTex = KIT.basalt(w, [4, 5]);
      const shaft = new T.Mesh(new T.CylinderGeometry(MOUTH_R, MOUTH_R, MOUTH_Y - WATER_Y + 0.3, 28, 1, true), KIT.std({ map: shaftTex, color: 0x9a928e, side: T.BackSide, relief: 0.08 }));
      shaft.position.y = (MOUTH_Y + WATER_Y - 0.3) / 2; shaft.userData.noCast = true; S.add(shaft);
      w.addCircle(0, 0, MOUTH_R + 0.6);
      const woodM = KIT.std({ map: KIT.wood(w, [1, 3], '#6a4a2e'), color: 0xc0a080, roughness: 0.85 });
      for (const sx of [-1, 1]) { const post = new T.Mesh(new T.BoxGeometry(0.16, 2.9, 0.16), woodM); post.position.set(sx * (MOUTH_R + 0.4), 1.45, 0); S.add(post); }
      const beam = new T.Mesh(new T.CylinderGeometry(0.07, 0.07, 2 * MOUTH_R + 1.1, 8), woodM); beam.rotation.z = Math.PI / 2; beam.position.set(0, 2.8, 0); S.add(beam);
      // the pulley: a wooden wheel turning on the beam
      this.wheel = new T.Group(); this.wheel.position.set(0, 2.55, 0); this.wheel.userData.dynamic = true; S.add(this.wheel);
      const wh = new T.Mesh(new T.CylinderGeometry(0.22, 0.22, 0.08, 18), woodM); wh.rotation.z = Math.PI / 2; this.wheel.add(wh);
      for (let i = 0; i < 4; i++) { const sp = new T.Mesh(new T.BoxGeometry(0.1, 0.05, 0.44), KIT.std({ color: 0x4a3220 })); sp.rotation.x = i * Math.PI / 4; this.wheel.add(sp); }
      const hang = new T.Mesh(new T.BoxGeometry(0.04, 0.26, 0.04), woodM); hang.position.set(0, 2.68, 0); S.add(hang);
      // the rope and the bucket
      const ropeM = KIT.std({ color: 0x6a5038, roughness: 1 });
      this.rope = new T.Mesh(new T.CylinderGeometry(0.01, 0.01, 1, 5), ropeM); this.rope.userData.dynamic = true; S.add(this.rope);
      this.ropeH = new T.Mesh(new T.CylinderGeometry(0.01, 0.01, 1, 5), ropeM); this.ropeH.userData.dynamic = true; S.add(this.ropeH);
      const leather = KIT.std({ color: 0x5a3a22, roughness: 0.75 });
      const makeBucket = () => {
        const g = new T.Group();
        const body = new T.Mesh(new T.CylinderGeometry(0.17, 0.13, 0.28, 14, 1, true), new T.MeshStandardMaterial({ color: 0x5a3a22, roughness: 0.75, side: T.DoubleSide })); g.add(body);
        const bot = new T.Mesh(new T.CircleGeometry(0.13, 14), leather); bot.rotation.x = -Math.PI / 2; bot.position.y = -0.14; g.add(bot);
        const bar = new T.Mesh(new T.BoxGeometry(0.36, 0.025, 0.025), woodM); bar.position.y = 0.16; g.add(bar);
        const water = new T.Mesh(new T.CircleGeometry(0.155, 14), new T.MeshBasicMaterial({ color: 0x3e5478 })); water.rotation.x = -Math.PI / 2; water.position.y = 0.08; water.visible = false; g.add(water);
        g.userData.water = water;
        return g;
      };
      this.bucket = makeBucket(); this.bucket.userData.dynamic = true; S.add(this.bucket);
      this.wellLight = new T.PointLight(0xffb060, 1.4, 9, 2); this.wellLight.position.set(1.2, 2.2, 0.8); S.add(this.wellLight);
      const lpost = new T.Mesh(new T.CylinderGeometry(0.035, 0.04, 2.2, 6), woodM); lpost.position.set(1.35, 1.1, 0.9); S.add(lpost);
      this.wellLamp = KIT.glow(w, 0xffc070, 1.0, 0.9); this.wellLamp.position.set(1.35, 2.25, 0.9); S.add(this.wellLamp);
      this.pulleyGlow = KIT.glow(w, 0xffc070, 2.2, 0); this.pulleyGlow.position.set(0, 1.3, 1.2); S.add(this.pulleyGlow);

      /* ---------- water surfaces: the shaft, and the five places that will fill ---------- */
      this.ripples = Array.from({ length: 8 }, () => new T.Vector4(0, 0, -99, 0)); this.ripI = 0;
      const top = new T.Color(0x1b2452), hor = new T.Color(0xe8946c);
      const waterMat = (shaft, fill) => new T.ShaderMaterial({
        vertexShader: WATER_VERT, fragmentShader: WATER_FRAG, transparent: !shaft,
        uniforms: {
          uTime: { value: 0 }, uTop: { value: top }, uHor: { value: hor }, uSunDir: { value: sunDir }, uSun: { value: new T.Color(0xff9858) },
          uRip: { value: this.ripples }, uShaft: { value: shaft ? 1 : 0 }, uMouthY: { value: MOUTH_Y }, uMouthR: { value: MOUTH_R },
          uGlow: { value: 0 }, uGlowCol: { value: new T.Color(0xffb060) }, uFill: { value: fill == null ? 1 : fill },
        },
      });
      this.waterMats = [];
      const wm = waterMat(true); this.waterMats.push(wm);
      const wd = new T.Mesh(new T.CircleGeometry(MOUTH_R, 32), wm); wd.rotation.x = -Math.PI / 2; wd.position.y = WATER_Y; S.add(wd);

      const stoneM = KIT.std({ map: KIT.mudBrick(w, [1.5, 0.3]), color: 0x9a9294 });
      const mud = KIT.std({ map: KIT.mudBrick(w, [2, 0.6]), color: 0xd8b898 });
      const clay = KIT.std({ color: 0xa8603a, roughness: 0.8 });
      this.places = [];
      const place = (o) => {
        const m = waterMat(false, 0); this.waterMats.push(m);
        const surf = new T.Mesh(o.geo, m); surf.rotation.x = -Math.PI / 2; surf.position.copy(o.water); surf.userData.dynamic = true; surf.visible = false; S.add(surf);
        const glow = KIT.glow(w, 0xffb868, o.glowSize || 3, 0.0); glow.position.set(o.at[0], o.at[1] + 0.6, o.at[2]); S.add(glow);
        const p = Object.assign({ surf, mat: m, glow, k: 0, done: false, pouring: 0 }, o);
        p.item = w.interact({
          key: o.key, pos: o.at, r: o.r || 2.6, label: o.label,
          enabled: () => self.carrying && !p.done,
          onUse: () => self.pour(env, p),
        });
        this.places.push(p);
        return p;
      };

      // 1. the stone channel from the well-head to the trough of a small flock
      const chanLen = 5.4;
      for (const sz of [-1, 1]) { const side = new T.Mesh(new T.BoxGeometry(chanLen, 0.28, 0.12), stoneM); side.position.set(1.45 + chanLen / 2, 0.14, sz * 0.2); S.add(side); }
      const cbot = new T.Mesh(new T.BoxGeometry(chanLen, 0.06, 0.4), stoneM); cbot.position.set(1.45 + chanLen / 2, 0.03, 0); S.add(cbot);
      const trough = new T.Group();
      [[2.6, 0.12, 0.9, 0, 0.06, 0], [2.6, 0.5, 0.12, 0, 0.25, 0.39], [2.6, 0.5, 0.12, 0, 0.25, -0.39], [0.12, 0.5, 0.9, 1.24, 0.25, 0], [0.12, 0.5, 0.9, -1.24, 0.25, 0]].forEach(([a, b, c, x, y, z]) => { const m = new T.Mesh(new T.BoxGeometry(a, b, c), stoneM); m.position.set(x, y, z); trough.add(m); });
      trough.position.set(8.2, 0, 0); trough.rotation.y = Math.PI / 2; S.add(trough); w.addBox(7.7, -1.35, 8.7, 1.35);
      this.chanWater = new T.Mesh(new T.PlaneGeometry(1, 0.28), waterMat(false, 0.92)); this.waterMats.push(this.chanWater.material);
      this.chanWater.rotation.x = -Math.PI / 2; this.chanWater.position.set(1.45, 0.08, 0); this.chanWater.scale.x = 0.001; this.chanWater.userData.dynamic = true; S.add(this.chanWater);
      const wool = KIT.std({ color: 0xe8dcc8, roughness: 1 }), dark = KIT.std({ color: 0x3a2e28 });
      [[9.8, 1.4, -2.2], [10.2, -0.6, -1.7], [9.6, -2.0, -1.2], [10.6, 0.6, -1.9]].forEach(([x, z, ry]) => {
        const g = new T.Group();
        const body = new T.Mesh(new T.SphereGeometry(0.34, 12, 8), wool); body.scale.set(1.35, 0.85, 0.85); body.position.y = 0.55; g.add(body);
        const hd = new T.Mesh(new T.SphereGeometry(0.13, 10, 8), dark); hd.scale.set(1.4, 1, 0.9); hd.position.set(-0.52, 0.5, 0); g.add(hd);
        for (const [lx, lz] of [[-0.25, -0.13], [-0.25, 0.13], [0.25, -0.13], [0.25, 0.13]]) { const l = new T.Mesh(new T.CylinderGeometry(0.035, 0.03, 0.34, 5), dark); l.position.set(lx, 0.17, lz); g.add(l); }
        g.position.set(x, 0, z); g.rotation.y = ry + Math.PI; S.add(g); w.addCircle(x, z, 0.4);
      });
      place({ key: 'flock', name: 'the flock', label: 'Pour into the channel for the flock', at: [2.4, 0.5, 0.9], target: [1.7, 0.15, 0], r: 2.4,
        geo: new T.PlaneGeometry(2.4, 0.66), water: new T.Vector3(8.2, 0.42, 0), glowSize: 3.5, chord: 130.81,
        doneText: 'The water runs down the channel to the trough, and the flock comes to drink.' });
      this.places[0].surf.rotation.z = Math.PI / 2;

      // 2. a traveller's waterskin hanging by the path
      const tp = new T.Mesh(new T.CylinderGeometry(0.05, 0.06, 1.9, 6), woodM); tp.position.set(-13.4, 0.95, 3); S.add(tp); w.addCircle(-13.4, 3, 0.12);
      const tb = new T.Mesh(new T.BoxGeometry(0.7, 0.06, 0.06), woodM); tb.position.set(-13.1, 1.75, 3); S.add(tb);
      const staff = new T.Mesh(new T.CylinderGeometry(0.025, 0.03, 1.7, 5), woodM); staff.position.set(-13.6, 0.82, 3.35); staff.rotation.z = 0.18; S.add(staff);
      this.skin = new T.Mesh(new T.SphereGeometry(0.25, 14, 10), KIT.std({ color: 0x5a3820, roughness: 0.55 }));
      this.skin.position.set(-12.85, 1.38, 3); this.skin.scale.set(0.7, 0.55, 0.45); this.skin.userData.dynamic = true; S.add(this.skin);
      const fp = new T.MeshBasicMaterial({ color: 0x5a4434, transparent: true, opacity: 0.35, depthWrite: false });
      for (let i = 0; i < 18; i++) { const f = new T.Mesh(new T.CircleGeometry(0.07, 8), fp); f.rotation.x = -Math.PI / 2; f.scale.y = 1.8; f.position.set(-12 + (i % 2 ? 0.18 : -0.18), 0.02, 26 - i * 1.4); S.add(f); }
      place({ key: 'skin', name: 'the traveller', label: 'Fill the traveller’s waterskin', at: [-12.85, 1.3, 3], target: [-12.85, 1.5, 3], r: 2.4,
        geo: new T.CircleGeometry(0.01, 4), water: new T.Vector3(-12.85, -5, 3), glowSize: 2.2, chord: 196,
        doneText: 'The waterskin is full for the road.' });

      // 3. a young palm in its basin, at the end of a dry channel
      const yp = KIT.palm(w, 3.2, { lean: 0.1, fronds: 12, frondScale: 0.7 }); yp.position.set(-6, 0, -8); S.add(yp); w.addCircle(-6, -8, 0.3);
      const rim = new T.Mesh(new T.TorusGeometry(1.3, 0.16, 6, 28), KIT.std({ map: KIT.sand(w, [2, 1]), color: 0x8a6a50 })); rim.rotation.x = -Math.PI / 2; rim.scale.z = 0.6; rim.position.set(-6, 0.04, -8); S.add(rim);
      const basin = new T.Mesh(new T.CircleGeometry(1.25, 28), KIT.std({ color: 0x5a4434 })); basin.rotation.x = -Math.PI / 2; basin.position.set(-6, 0.012, -8); S.add(basin);
      place({ key: 'palm', name: 'the palm', label: 'Water the young palm', at: [-5.2, 0.5, -7.2], target: [-6, 0.1, -8], r: 2.6,
        geo: new T.RingGeometry(0.22, 1.24, 28), water: new T.Vector3(-6, 0.06, -8), glowSize: 3.2, chord: 261.63,
        doneText: 'The basin drinks the water down to the roots.' });

      // 4. a house with a clay jar by its door
      const house = new T.Mesh(new T.BoxGeometry(6, 3.2, 5), mud); house.position.set(12, 1.6, -14); S.add(house); w.addBox(9, -16.5, 15, -11.5);
      const door = new T.Mesh(new T.BoxGeometry(1.0, 1.9, 0.08), KIT.std({ map: KIT.wood(w, [1, 2], '#4a3020'), color: 0xa08068 })); door.position.set(11, 0.95, -11.46); S.add(door);
      const win = new T.Mesh(new T.PlaneGeometry(0.6, 0.5), new T.MeshBasicMaterial({ color: 0xffb060 })); win.position.set(13.4, 1.9, -11.44); S.add(win);
      const roofEdge = new T.Mesh(new T.BoxGeometry(6.3, 0.2, 5.3), KIT.std({ map: KIT.wood(w), color: 0x8a6a4a })); roofEdge.position.set(12, 3.25, -14); S.add(roofEdge);
      const jarPts = []; for (let i = 0; i <= 12; i++) { const t = i / 12; jarPts.push(new T.Vector2(0.05 + Math.sin(t * Math.PI) * 0.3 + (t > 0.85 ? (t - 0.85) * 1.2 : 0), t * 0.85)); }
      const jar = new T.Mesh(new T.LatheGeometry(jarPts, 18), clay); jar.position.set(9.6, 0, -10.8); S.add(jar); w.addCircle(9.6, -10.8, 0.35);
      this.houseLight = new T.PointLight(0xffa850, 1.1, 8, 2); this.houseLight.position.set(11, 2.4, -10.6); S.add(this.houseLight);
      const hl = KIT.glow(w, 0xffb060, 1.4, 0.7); hl.position.set(13.4, 1.9, -11.3); S.add(hl);
      place({ key: 'jar', name: 'the house', label: 'Fill the jar by the door', at: [9.6, 0.9, -10.8], target: [9.6, 0.9, -10.8], r: 2.4,
        geo: new T.CircleGeometry(0.16, 16), water: new T.Vector3(9.6, 0.82, -10.8), glowSize: 2.2, chord: 329.63,
        doneText: 'The household’s jar is full for the night.' });

      // 5. a small mosque of mud brick with a stone basin for ablution at its door
      const mw = (x0, z0, x1, z1, h) => { const lx = Math.abs(x1 - x0) || 0.5, lz = Math.abs(z1 - z0) || 0.5; const m = new T.Mesh(new T.BoxGeometry(lx, h, lz), mud); m.position.set((x0 + x1) / 2, h / 2, (z0 + z1) / 2); S.add(m); w.addBox(Math.min(x0, x1), Math.min(z0, z1), Math.max(x0, x1), Math.max(z0, z1)); };
      mw(-8, -26, 4, -26, 2.8); mw(-8, -26, -8, -19, 2.8); mw(4, -26, 4, -19, 2.8); mw(-8, -19, -3.1, -19, 2.8); mw(-0.9, -19, 4, -19, 2.8);
      const lint = new T.Mesh(new T.BoxGeometry(2.6, 0.5, 0.5), mud); lint.position.set(-2, 2.55, -19); S.add(lint);
      const roofTex = KIT.frondRoof(w, [3, 2]);
      const mroof = new T.Mesh(new T.PlaneGeometry(12.4, 7.4), KIT.std({ map: roofTex, alphaTest: 0.5, side: T.DoubleSide, color: 0xb8a888 })); mroof.rotation.x = -Math.PI / 2; mroof.position.set(-2, 2.9, -22.5); S.add(mroof);
      const inner = new T.PointLight(0xffb060, 1.0, 9, 2); inner.position.set(-2, 1.8, -21.5); S.add(inner);
      const doorGlow = KIT.glow(w, 0xffb868, 2.4, 0.55); doorGlow.position.set(-2, 1.3, -19.6); S.add(doorGlow);
      const bas = new T.Group();
      [[1.6, 0.14, 0.9, 0, 0.07, 0], [1.6, 0.6, 0.12, 0, 0.3, 0.39], [1.6, 0.6, 0.12, 0, 0.3, -0.39], [0.12, 0.6, 0.9, 0.74, 0.3, 0], [0.12, 0.6, 0.9, -0.74, 0.3, 0]].forEach(([a, b, c, x, y, z]) => { const m = new T.Mesh(new T.BoxGeometry(a, b, c), stoneM); m.position.set(x, y, z); bas.add(m); });
      bas.position.set(1.2, 0, -17.4); S.add(bas); w.addBox(0.35, -17.9, 2.05, -16.9);
      place({ key: 'basin', name: 'the mosque', label: 'Fill the basin for ablution', at: [1.2, 0.8, -17.4], target: [1.2, 0.5, -17.4], r: 2.6,
        geo: new T.PlaneGeometry(1.4, 0.66), water: new T.Vector3(1.2, 0.52, -17.4), glowSize: 3, chord: 392,
        doneText: 'The basin by the mosque door is full for the prayer of the night.' });

      // the garden: palms in loose rows, a low wall round it
      const r = U.seeded(3703);
      const clear = [[0, 0, 4.5], [8.5, 0, 3.2], [-12, 0, 2.5], [-6, -8, 2.6], [12, -13, 5], [-2, -22, 7], [1.2, -17, 2.4], [0, 6, 3]];
      for (let gx = -24; gx <= 24; gx += 5.5) for (let gz = -24; gz <= 24; gz += 5.5) {
        const x = gx + (r() - 0.5) * 2.4, z = gz + (r() - 0.5) * 2.4;
        if (Math.abs(x + 12) < 2 || clear.some(([cx, cz, cr]) => Math.hypot(x - cx, z - cz) < cr)) continue;
        if (r() < 0.2) continue;
        const p = KIT.palm(w, 5 + r() * 6); p.position.set(x, 0, z); S.add(p); w.addCircle(x, z, 0.32);
      }
      const gw = KIT.std({ map: KIT.mudBrick(w, [6, 0.4]), color: 0xc8a888 });
      [[0, -28, 56, 0.6], [0, 28, 56, 0.6], [-28, 0, 0.6, 56], [28, 0, 0.6, 56]].forEach(([x, z, lx, lz]) => { const m = new T.Mesh(new T.BoxGeometry(lx, 1.3, lz), gw); m.position.set(x, 0.65, z); S.add(m); });
      // the city's lights to the east, beyond the garden wall
      const cg = new T.BufferGeometry(), cp = new Float32Array(160 * 3);
      for (let i = 0; i < 160; i++) cp.set([60 + r() * 200, 0.5 + r() * 5, (r() - 0.5) * 300], i * 3);
      cg.setAttribute('position', new T.BufferAttribute(cp, 3));
      const cpts = new T.Points(cg, new T.PointsMaterial({ map: KIT.glowTex(w), color: 0xffb070, size: 2.2, transparent: true, depthWrite: false, blending: T.AdditiveBlending, opacity: 0.8 }));
      S.add(cpts);

      // fireflies of dust in the lamp light, and the arc of poured water
      this.dust = KIT.dust(w, 220, [-18, 0.3, -24, 18, 4, 14], 0xffd8a0, 0.04); this.dust.material.opacity = 0.6; S.add(this.dust);
      const pg = new T.BufferGeometry(); this.pourPos = new Float32Array(60 * 3); pg.setAttribute('position', new T.BufferAttribute(this.pourPos, 3));
      this.pourPts = new T.Points(pg, new T.PointsMaterial({ map: KIT.glowTex(w), color: 0xb8d0f0, size: 0.09, transparent: true, depthWrite: false, opacity: 0.9 }));
      this.pourPts.frustumCulled = false; S.add(this.pourPts);
      this.drops = [];

      w.followShadow(sun, 26); w.receiveAll();
      this.baked = w.bake();

      // the bucket you carry
      this.carried = makeBucket(); this.carried.userData.water.visible = true; this.carried.visible = false; this.carried.userData.dynamic = true;
      S.add(w.camera); w.camera.add(this.carried); this.carried.position.set(0.38, -0.62, -1.05); this.carried.rotation.set(0.3, 0, 0.05); this.carried.scale.setScalar(0.8);

      /* ---------- the haul gauge (2D overlay) ---------- */
      const ov = document.createElement('div');
      ov.setAttribute('aria-hidden', 'true');
      ov.style.cssText = 'position:absolute;inset:0;pointer-events:none;opacity:0;transition:opacity .4s;';
      ov.innerHTML = `
        <div style="position:absolute;right:max(18px,4vw);top:50%;transform:translateY(-50%);width:46px;height:min(46vh,320px);">
          <div style="position:absolute;left:50%;top:0;bottom:0;width:22px;margin-left:-11px;border-radius:11px;background:linear-gradient(#2a2430,#0d0c12);box-shadow:inset 0 0 0 1px rgba(217,187,133,.35);"></div>
          <div class="wg-rope" style="position:absolute;left:50%;top:0;width:2px;margin-left:-1px;background:#c8a878;"></div>
          <div class="wg-bucket" style="position:absolute;left:50%;width:22px;height:18px;margin-left:-11px;border-radius:2px 2px 7px 7px;background:#8a5a34;box-shadow:0 0 10px rgba(255,190,110,.6);"></div>
          <div style="position:absolute;left:50%;bottom:4px;width:16px;height:6px;margin-left:-8px;border-radius:50%;background:#6a88b8;opacity:.8"></div>
          <div style="position:absolute;top:-24px;left:-20px;right:-20px;text-align:center;font:11px Marcellus,Georgia,serif;letter-spacing:.14em;color:#d9bb85;">MOUTH</div>
        </div>
        <div style="position:absolute;left:50%;bottom:calc(env(safe-area-inset-bottom) + 96px);transform:translateX(-50%);display:flex;gap:18px;">
          <button type="button" class="wg-L" style="pointer-events:auto;width:88px;height:64px;border-radius:14px;border:1px solid rgba(217,187,133,.5);background:rgba(20,16,24,.6);color:#f2e9d6;font:15px Marcellus,Georgia,serif;transition:transform .08s,background .2s;">A · left</button>
          <button type="button" class="wg-R" style="pointer-events:auto;width:88px;height:64px;border-radius:14px;border:1px solid rgba(217,187,133,.5);background:rgba(20,16,24,.6);color:#f2e9d6;font:15px Marcellus,Georgia,serif;transition:transform .08s,background .2s;">right · D</button>
        </div>`;
      w.ui.layer.appendChild(ov);
      this.gauge = { ov, rope: ov.querySelector('.wg-rope'), bucket: ov.querySelector('.wg-bucket'), L: ov.querySelector('.wg-L'), R: ov.querySelector('.wg-R') };
      const btn = (el, hand) => { el.addEventListener('pointerdown', e => { e.stopPropagation(); e.preventDefault(); self.pull(env, hand); }); el.addEventListener('contextmenu', e => e.preventDefault()); };
      btn(this.gauge.L, 'L'); btn(this.gauge.R, 'R');
      this.noMenu = e => { if (self.hauling) e.preventDefault(); };
      document.addEventListener('contextmenu', this.noMenu);

      /* ---------- the activity ---------- */
      w.activity('Water for everyone', 5, 'Go to the pulley at the well and press E to take the rope');
      w.interact({
        key: 'pulley', pos: [HAUL.x, 1.3, 1.2], r: 2.6, label: 'Take the rope',
        enabled: () => !self.carrying && !self.hauling && self.given < 5,
        onUse: () => self.startHaul(env),
      });

      /* ---------- sound ---------- */
      const b = env.bus;
      this.breeze = SND.noise(b, { color: 'pink', type: 'bandpass', freq: 450, q: 0.5, gain: 0.03 });
      this.fronds = SND.noise(b, { color: 'white', type: 'bandpass', freq: 4200, q: 0.7, gain: 0.006 });
      SND.lfo(b, this.fronds.gain && this.fronds.gain.gain, 0.09, 0.005);
      this.choir = this.places.map(p => SND.drone(b, p.chord, { vowel: 'o', gain: 0 }));
      this.cricketClock = 0.5; this.dripClock = 1; this.cooClock = 4;

      /* ---------- entrance: from the water up the shaft into the garden ---------- */
      const E = [w.pos.x, 1.62, w.pos.z];
      w.cinematic([
        { p: [0, WATER_Y + 0.6, 0.02], l: [0, 20, 0.12] },
        { p: [0.05, WATER_Y + 2.4, -0.02], l: [0, 20, 0.3] },
        { p: [0, MOUTH_Y - 0.4, 0.05], l: [0.2, 18, 1.2] },
        { p: [0.3, 3.4, 0.5], l: [-3, 2.5, -8] },
        { p: [3.5, 3.2, 6.5], l: [0, 0.8, 0] },
        { p: E, l: [0, 1, 0] },
      ], 10);
    },

    startHaul(env) {
      const w = this.w;
      this.hauling = true; this.haulAt = w.time; this.lastHand = null; this.idle = 0; w.enabled = false;
      this.gauge.ov.style.opacity = '1';
      w.step('Pull hand over hand: press A and D in turn (or click left and right, or tap the two buttons)');
      if (!this.seen.sweet) {
        this.seen.sweet = true;
        w.say('Sweet Water', 'In early Madinah sweet water was scarce. The best well, Rumah, belonged to a man who sold its water.', { ms: 10000 });
      }
      SND.knock(env.bus, { f: 160, gain: 0.15, click: 800 });
    },
    stopHaul() {
      this.hauling = false; if (this.w) { this.w.enabled = true; this.gauge.ov.style.opacity = '0'; }
    },
    pull(env, hand) {
      if (!this.hauling) return;
      const b = env.bus, g = this.gauge;
      const el = hand === 'L' ? g.L : g.R;
      el.style.transform = 'scale(.93)'; setTimeout(() => { el.style.transform = ''; }, 110);
      if (hand === this.lastHand) {
        // the same hand twice: the rope only shifts in your grip
        SND.swell(b, { color: 'white', type: 'highpass', f0: 2500, f1: 3500, dur: 0.18, gain: 0.02 });
        this.sway = 0.6;
        return;
      }
      this.lastHand = hand; this.idle = 0;
      this.depthV = 1 / PULLS;
      SND.knock(b, { f: U.rnd(150, 200), gain: 0.16, click: U.rnd(600, 900) });
      SND.swell(b, { color: 'pink', type: 'bandpass', f0: 900, f1: 1800, dur: 0.32, gain: 0.04 });
      this.sway = 1;
      if (this.depth > 0.02) SND.drop(b, { f: U.rnd(700, 1300), gain: 0.04, delay: U.rnd(0.3, 0.9) });
    },

    pour(env, p) {
      const w = this.w, b = env.bus;
      this.carrying = false; this.carried.visible = false; w.speed = 3; w.run = 5.6;
      p.done = true; p.pouring = 0.001;
      const f = w.forward();
      const from = new THREE.Vector3(w.pos.x + f.x * 0.6, w.y + 1.2, w.pos.z + f.z * 0.6);
      const to = new THREE.Vector3(...p.target);
      this.pours.push({ from, to, t: 0, p });
      SND.swell(b, { color: 'pink', type: 'bandpass', f0: 1600, f1: 700, dur: 1.8, gain: 0.08 });
      for (let i = 0; i < 6; i++) SND.drop(b, { f: U.rnd(500, 1200), gain: 0.05, delay: 0.3 + i * 0.18 });
    },

    ripple(x, z, amp) { const r = this.ripples[this.ripI++ % 8]; r.set(x, z, this.w.time, amp); },

    down(env, p, e) {
      if (this.hauling && (e.pointerType === 'mouse' || !e.pointerType) && (e.button === 0 || e.button === 2)) { this.pull(env, e.button === 0 ? 'L' : 'R'); return; }
      this.w && this.w.down(p, e);
    },
    onKey(env, e) {
      if (!this.hauling || e.repeat) return;
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (k === 'a' || k === 'ArrowLeft') this.pull(env, 'L');
      else if (k === 'd' || k === 'ArrowRight') this.pull(env, 'R');
      else if ((k === 'e' && this.haulAt !== this.w.time) || k === 'Escape') { this.stopHaul(); this.w.step('The bucket slips back down; press E at the pulley to take the rope again'); }
    },
    onLeave() { if (this.noMenu) document.removeEventListener('contextmenu', this.noMenu); },

    update(env, dt) {
      const w = this.w; if (!w) return;
      w.update(dt);
      const t = w.time, b = env.bus;
      this.waterMats.forEach(m => { m.uniforms.uTime.value = t; });
      KIT.driftDust(this.dust, dt, t, [0.04, 0.01]);

      /* hauling: the bucket rises with each alternation and slips back if you stop */
      if (this.depthV) { const s = Math.min(this.depthV, dt * 0.9); this.depth += s; this.depthV -= s; this.spin = (this.spin || 0) + s; if (this.depthV < 1e-4) this.depthV = 0; }
      if (this.hauling) {
        this.idle += dt;
        if (this.idle > 1.2 && this.depth > 0) { this.depth = Math.max(0, this.depth - SLIP * dt); this.spin -= SLIP * dt; if (Math.random() < dt * 3) SND.knock(b, { f: 240, gain: 0.03, click: 1200 }); }
      } else if (!this.carrying && this.depth > 0 && !this.depthV) {
        this.depth = Math.max(0, this.depth - dt * 0.4); this.spin -= dt * 0.4;
        if (this.depth === 0) { this.ripple(0, 0, 1); SND.drop(b, { f: 300, gain: 0.08, dur: 0.3 }); }
      }
      if (this.hauling && this.depth >= 1) {
        this.depth = 1; this.stopHaul();
        this.carrying = true; this.carried.visible = true; w.speed = 2.4; w.run = 3.4;
        SND.knock(b, { f: 120, gain: 0.2, click: 1000 }); SND.drop(b, { f: 600, gain: 0.06 }); SND.bell(b, 392, { gain: 0.03 });
        const left = this.places.filter(p => !p.done).map(p => p.name);
        w.step(`Carry the bucket to ${left.length === 5 ? 'one of the five places that wait for water (follow the warm lights)' : left.join(', ')}`);
        if (!this.seen.hadith) {
          this.seen.hadith = true;
          w.say('A Bucket Among the Buckets', 'The Prophet ﷺ said: “Whoever buys the well of Rumah and makes his bucket one among the buckets of the Muslims…” <span class="q">(Jami‘ at-Tirmidhi 3703, graded hasan; also reported by al-Bukhari without a full chain, 2778)</span>', { ar: 'مَنْ يَشْتَرِي بِئْرَ رُومَةَ فَيَجْعَلَ دَلْوَهُ مَعَ دِلَاءِ الْمُسْلِمِينَ', ms: 14000 });
        }
      }
      const atTop = this.carrying || this.depth >= 1;
      const by = atTop && this.carrying ? BUCKET_TOP + 5 : U.lerp(BUCKET_LOW, BUCKET_TOP, this.depth);
      this.sway = U.damp(this.sway || 0, 0, 3, dt);
      this.bucket.visible = !this.carrying;
      this.bucket.position.set(Math.sin(t * 7) * 0.025 * this.sway, by, -0.2 + Math.cos(t * 5) * 0.02 * this.sway);
      this.bucket.rotation.z = Math.sin(t * 6) * 0.08 * this.sway;
      this.bucket.userData.water.visible = this.depth > 0.03;
      this.wheel.rotation.x = -(this.spin || 0) * 22;
      // rope from the wheel down to the bucket, and from the wheel to the hands
      const ry0 = 2.33, ry1 = this.carrying ? 2.0 : by + 0.17;
      this.rope.scale.y = Math.max(0.05, ry0 - ry1); this.rope.position.set(this.bucket.position.x * 0.5, (ry0 + ry1) / 2, -0.2);
      const hx = this.hauling ? w.pos.x + 0.25 : HAUL.x, hz = this.hauling ? w.pos.z - 0.35 : 0.75, hy = this.hauling ? w.y + 0.85 : 0.95;
      const a = new THREE.Vector3(0, 2.55, 0.2), c = new THREE.Vector3(hx, hy, hz);
      this.ropeH.position.copy(a).add(c).multiplyScalar(0.5); this.ropeH.scale.y = a.distanceTo(c);
      this.ropeH.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), c.clone().sub(a).normalize());
      // the gauge
      const gh = this.gauge.ov.firstElementChild.clientHeight || 300, bpos = (1 - this.depth) * (gh - 26);
      this.gauge.bucket.style.top = `${bpos}px`; this.gauge.rope.style.height = `${bpos}px`;
      const next = this.lastHand === 'L' ? 'R' : this.lastHand === 'R' ? 'L' : null;
      this.gauge.L.style.background = next === 'L' || !next ? 'rgba(160,110,50,.55)' : 'rgba(20,16,24,.6)';
      this.gauge.R.style.background = next === 'R' || !next ? 'rgba(160,110,50,.55)' : 'rgba(20,16,24,.6)';
      // drips from the rising bucket ring in the stone throat
      this.dripClock -= dt;
      if (this.dripClock < 0) {
        this.dripClock = this.depth > 0.05 && !this.carrying ? U.rnd(0.15, 0.5) : U.rnd(2, 5);
        const sp = w.spatial({ x: 0, z: 0 }, 5);
        SND.drop(b, { f: U.rnd(800, 1500), gain: (this.depth > 0.05 ? 0.05 : 0.025) * sp.gain + 0.004, pan: sp.pan, dur: 0.12 });
        SND.drop(b, { f: U.rnd(800, 1500), gain: 0.012 * sp.gain, pan: -sp.pan, delay: 0.14, dur: 0.2 });
        this.ripple(U.rnd(-0.3, 0.3), U.rnd(-0.3, 0.3), 0.6);
      }

      /* pouring: an arc of water, then the place fills and glows */
      const dp = this.pourPos; let n = 0;
      for (const po of this.pours) {
        po.t += dt;
        if (po.t < 1.4) for (let i = 0; i < 12 && n < 60; i++, n++) {
          const k = U.clamp(po.t * 1.4 - i * 0.05); const x = U.lerp(po.from.x, po.to.x, k), z = U.lerp(po.from.z, po.to.z, k);
          const y = U.lerp(po.from.y, po.to.y, k) + Math.sin(k * Math.PI) * 0.35;
          dp[n * 3] = x + U.rnd(-0.03, 0.03); dp[n * 3 + 1] = y; dp[n * 3 + 2] = z + U.rnd(-0.03, 0.03);
        }
        if (po.t > 0.6) po.p.pouring = Math.min(1, po.p.pouring + dt * 0.45);
      }
      for (let i = n; i < 60; i++) dp[i * 3 + 1] = -99;
      this.pourPts.geometry.attributes.position.needsUpdate = true;
      this.pours = this.pours.filter(po => po.t < 4);
      let filled = 0, anyCarry = this.carrying;
      this.places.forEach((p, i) => {
        if (p.pouring > 0) {
          const k = U.easeOut(p.pouring);
          p.surf.visible = true; p.mat.uniforms.uFill.value = Math.min(1, k * 2) * 0.92; p.mat.uniforms.uGlow.value = 0.25 * k;
          if (p.key === 'flock') {
            this.chanWater.scale.x = Math.min(1, k * 1.6) * 5.4; this.chanWater.position.x = 1.45 + this.chanWater.scale.x / 2;
            p.surf.position.y = 0.2 + 0.24 * k;
          } else if (p.key === 'skin') this.skin.scale.set(0.7 + 0.45 * k, 0.55 + 0.6 * k, 0.45 + 0.45 * k);
          else if (p.key === 'palm') p.surf.position.y = 0.02 + 0.05 * k;
          else if (p.key === 'jar') p.surf.position.y = 0.5 + 0.32 * k;
          else if (p.key === 'basin') p.surf.position.y = 0.2 + 0.32 * k;
          p.glow.material.opacity = 0.2 + 0.25 * k;
          this.choir[i].setGain(0.016 * k, 1.5);
          if (p.pouring >= 1 && !p.counted) {
            p.counted = true; this.given++;
            SND.bell(b, p.chord * 2, { gain: 0.04 }); SND.glow(b, p.chord, { gain: 0.03, dur: 5 });
            w.progress(this.given, this.given < 5 ? `${p.doneText} Return to the well and draw again (${5 - this.given} still waiting).` : p.doneText);
            if (this.given === 3) w.say('A Waqf', '‘Uthman ibn ‘Affan bought the well and made it a <i>waqf</i>, an endowment: its water was free to all, and no one could sell it again.', { ms: 11000 });
            if (this.given === 5) this.endT = 0;
          }
          if (p.pouring >= 1) filled++;
        } else {
          // places still waiting are the warm lights of the garden, brighter while you carry water
          p.glow.material.opacity = (anyCarry ? 0.55 + 0.2 * Math.sin(t * 2.4 + i) : 0.18);
        }
      });
      // the pulley is the brightest thing when the bucket is waiting
      this.pulleyGlow.material.opacity = !this.carrying && !this.hauling && this.given < 5 ? 0.35 + 0.15 * Math.sin(t * 2.5) : 0;

      /* the revelation: a hush, then the choir and the endowment */
      if (this.endT != null && !this.finished) {
        this.endT += dt;
        if (this.endT > 3) {
          this.finished = true;
          SND.glow(b, 130.81, { gain: 0.06, dur: 12 }); SND.glow(b, 196, { gain: 0.04, dur: 12, delay: 0.8 }); SND.bell(b, 523.25, { gain: 0.04, delay: 1.6 });
          this.places.forEach(p => { p.mat.uniforms.uGlow.value = 0.45; });
          w.say('Still Flowing', 'The water that one man once sold became water for everyone: the flock, the traveller, the palms, the households and the mosque. The Well of Rumah still exists in the north-west of Madinah.', { ar: 'بِئْرُ رُومَة', ms: 15000 });
          w.finish('Water for everyone');
        }
      }
      const hush = this.endT != null && !this.finished ? 0.15 : 1;
      this.breeze.set('gain', 0.03 * hush, 0.6); this.fronds.set('gain', 0.006 * hush, 0.6);
      this.wellLamp.material.opacity = 0.8 + 0.15 * U.noise1(t * 6);
      this.wellLight.intensity = 1.25 + 0.2 * U.noise1(t * 5 + 3);

      this.cricketClock -= dt;
      if (this.cricketClock < 0) { this.cricketClock = U.rnd(0.3, 1.2) / (0.6 + this.given * 0.15); if (hush > 0.5) SND.cricket(b, { gain: 0.005 }); }
      this.cooClock -= dt;
      if (this.cooClock < 0) { this.cooClock = U.rnd(6, 12); if (hush > 0.5) SND.coo(b, { gain: 0.025 }); }
    },
  }));
})();
