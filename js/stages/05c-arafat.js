/* Makkah — The Farewell Sermon (Hajjat al-Wada'), 10 AH / 632 CE.
   The wide plain of 'Arafat in the late afternoon: a city of tents and shade awnings, golden haze,
   the low granite hill at the plain's centre and the mountains all round. No person is shown; the
   pilgrims are present as tents, lamps and murmuring voices. In the valley bottom, where the sermon
   was given, each line is revealed in light; the player carries it across the plain to a distant
   camp and delivers it, and the camp lights up with the words over it. Five camps, five lines, the
   last at sunset.
   Feeling: a trust handed on. Colour script: amber haze and sand, with clear ivory light reserved
   for the words, the source, the camp still waiting and the revelation. */
(function () {
  'use strict';
  if (!window.WORLD) return;
  const J = { x: 8, z: -72 };                       // the hill at the plain's centre
  const wadiX = z => -8 + Math.sin(z * 0.012) * 12;  // the valley bottom, Batn 'Uranah
  const SRC = { x: wadiX(34), z: 34 };
  const CAMPS = [{ x: -84, z: 74 }, { x: 78, z: 88 }, { x: 102, z: -6 }, { x: -78, z: -52 }, { x: 52, z: -128 }];
  const IVORY = 0xfff4dc;
  const LINES = [
    { ar: 'إِنَّ دِمَاءَكُمْ وَأَمْوَالَكُمْ حَرَامٌ عَلَيْكُمْ كَحُرْمَةِ يَوْمِكُمْ هَذَا فِي شَهْرِكُمْ هَذَا فِي بَلَدِكُمْ هَذَا',
      en: '“Your blood and your property are sacred to one another, as sacred as this day of yours, in this month of yours, in this land of yours.”',
      card: '<span class="q">“Your blood and your property are sacred to one another, as sacred as this day of yours, in this month of yours, in this land of yours.”</span> (Sahih Muslim 1218)' },
    { ar: 'فَاتَّقُوا اللَّهَ فِي النِّسَاءِ', en: '“Fear God concerning women.”',
      card: '<span class="q">“Fear God concerning women.”</span> (Sahih Muslim 1218)' },
    { ar: 'وَقَدْ تَرَكْتُ فِيكُمْ مَا لَنْ تَضِلُّوا بَعْدَهُ إِنِ اعْتَصَمْتُمْ بِهِ كِتَابَ اللَّهِ',
      en: '“I have left among you that which, if you hold fast to it, you will never go astray: the Book of God.”',
      card: '<span class="q">“I have left among you that which, if you hold fast to it, you will never go astray: the Book of God.”</span> (Sahih Muslim 1218)' },
    { ar: 'اللَّهُمَّ اشْهَدْ', en: '“O God, bear witness.”',
      card: 'He said: <span class="q">“You will be asked about me; what will you say?”</span> They said: <span class="q">“We bear witness that you have conveyed, fulfilled and given sincere counsel.”</span> He raised his forefinger to the sky and said, <span class="q">“O God, bear witness,”</span> three times. (Sahih Muslim 1218)' },
    { ar: 'لِيُبَلِّغِ الشَّاهِدُ الْغَائِبَ', en: '“Let the one who is present convey to the one who is absent.”',
      card: 'In his sermons of that pilgrimage, at Mina on the Day of Sacrifice, he said: <span class="q">“Let the one who is present convey to the one who is absent.”</span> (Sahih al-Bukhari 67)' },
  ];
  const ROMAN = ['I', 'II', 'III', 'IV', 'V'];

  function ground(x, z) {
    let y = U.noise2(x * 0.008 + 7, z * 0.008) * 1.5 + U.noise2(x * 0.05, z * 0.05) * 0.22;
    const dw = Math.abs(x - wadiX(z));
    y -= 1.3 * (1 - U.smooth(3, 15, dw));
    const dj = Math.hypot(x - J.x, (z - J.z) * 1.15);
    y += 21 * Math.exp(-(dj * dj) / (2 * 13 * 13)) * (0.85 + 0.3 * U.noise2(x * 0.15, z * 0.15));
    // the ring of granite mountains round the plain: ridges and peaks, not a wall
    const d = Math.hypot(x, z * 0.9), m = U.smooth(230, 430, d);
    if (m > 0) {
      const ridge = U.noise2(x * 0.011 + 3, z * 0.011) * 0.5 + 0.5, peak = Math.pow(Math.max(0, U.noise2(x * 0.024, z * 0.024 + 9)), 1.5);
      y += m * (25 + 70 * ridge + 60 * peak) + m * U.noise2(x * 0.08, z * 0.08) * 4;
    }
    return y;
  }

  /* An Arabic line and an English line, wrapped, written in light on a transparent sprite. */
  function lightText(T, ar, en, kicker) {
    const c = document.createElement('canvas'); c.width = 1024; c.height = 512;
    const g = c.getContext('2d'); g.textAlign = 'center';
    const wrap = (text, max) => {
      const words = text.split(' '), out = []; let line = '';
      words.forEach(wd => { const tt = line ? line + ' ' + wd : wd; if (g.measureText(tt).width > max && line) { out.push(line); line = wd; } else line = tt; });
      if (line) out.push(line); return out;
    };
    let y = 50;
    if (kicker) { g.font = '28px Marcellus, Georgia, serif'; g.fillStyle = 'rgba(255,240,210,0.85)'; g.fillText(kicker, 512, y); y += 30; }
    g.direction = 'rtl'; g.font = '66px Amiri, "Geeza Pro", serif';
    const arL = wrap(ar, 900);
    g.shadowColor = 'rgba(255,214,150,0.95)'; g.shadowBlur = 26; g.fillStyle = '#fffaee';
    arL.forEach(l => { y += 80; g.fillText(l, 512, y); });
    g.direction = 'ltr'; g.shadowBlur = 8; g.shadowColor = 'rgba(80,40,0,0.6)';
    g.font = 'italic 38px Spectral, Georgia, serif'; g.fillStyle = 'rgba(255,248,232,0.97)';
    y += 22;
    wrap(en, 900).forEach(l => { y += 48; g.fillText(l, 512, y); });
    const tex = new T.CanvasTexture(c); tex.encoding = T.sRGBEncoding;
    const sp = new T.Sprite(new T.SpriteMaterial({ map: tex, transparent: true, opacity: 0, depthWrite: false, fog: false }));
    sp.scale.set(16, 8, 1); sp.renderOrder = 6;
    return sp;
  }

  // merge simple geometries into one (for the shade awnings: a cloth and four poles)
  function merge(T, geos) {
    const parts = geos.map(g => (g.index ? g.toNonIndexed() : g));
    let n = 0; parts.forEach(g => { n += g.attributes.position.count; });
    const P = new Float32Array(n * 3), N = new Float32Array(n * 3), UV = new Float32Array(n * 2);
    let o = 0;
    parts.forEach(g => { P.set(g.attributes.position.array, o * 3); N.set(g.attributes.normal.array, o * 3); UV.set(g.attributes.uv.array, o * 2); o += g.attributes.position.count; });
    const out = new T.BufferGeometry();
    out.setAttribute('position', new T.BufferAttribute(P, 3)); out.setAttribute('normal', new T.BufferAttribute(N, 3)); out.setAttribute('uv', new T.BufferAttribute(UV, 2));
    return out;
  }

  ENGINE.register(WORLD.stage({
    key: 'arafat',
    arabic: 'خُطْبَةُ الوَدَاع',
    title: 'The Farewell Sermon',
    era: '‘Arafat · 9 Dhu al-Hijjah, 10 AH · 632 CE · the Day of ‘Arafah',
    hint: 'WASD to walk, Shift to run · E at the light in the valley to receive a line · carry it to the camp with the bright lamp · E to deliver',
    hintTouch: 'Left thumb to walk · tap E at the light in the valley · carry the line to the bright lamp · tap E to deliver',
    sound: { reverb: 0.35 },
    story: `<p>In 10 AH the Prophet ﷺ made his only pilgrimage, which came to be called the Farewell Pilgrimage. On the Day of ‘Arafah he came to the valley bottom at the edge of the plain and addressed the people (Sahih Muslim 1218, from Jabir).</p>
            <p>The low granite hill at the plain’s centre is known today as Jabal ar-Rahmah, the Mount of Mercy; the name is later usage.</p>
            <p class="q"><span class="ar">الْيَوْمَ أَكْمَلْتُ لَكُمْ دِينَكُمْ</span>“This day I have perfected your religion for you.” (Qur’an 5:3)</p>`,

    enter(env) {
      const T = THREE, self = this;
      try { document.fonts && document.fonts.load('66px Amiri'); } catch (_) {}
      const w = this.w = WORLD.create(env, {
        start: { x: SRC.x + 3, z: SRC.z + 14, yaw: 0.05, pitch: 0.02 }, exposure: 1.0, far: 1500, speed: 3.4, run: 7,
        fog: { color: 0xe2bc84, density: 0.0026 }, bounds: [-140, -150, 140, 130], ground,
        surface: (x, z) => (Math.hypot(x - J.x, z - J.z) < 22 ? 'gravel' : 'sand'),
      });
      const S = w.scene;
      this.tau = 0; this.tauTarget = 0;
      this.skyM = w.sky({ top: '#5a86c0', mid: '#f0cf9c', bot: '#b89068', sunDir: [-0.9, 0.4, 0.2], sun: '#fff0c8', sunSize: 0.0016 });
      this.hemi = new T.HemisphereLight(0xffe2b8, 0x8a6a48, 0.55); S.add(this.hemi);
      this.sun = new T.DirectionalLight(0xffe0b0, 2.2); S.add(this.sun);
      this.setSun(0);

      // the plain, the hill and the mountains
      const geo = new T.PlaneGeometry(1100, 1100, 220, 220); geo.rotateX(-Math.PI / 2);
      const p = geo.attributes.position, col = new Float32Array(p.count * 3);
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i), z = p.getZ(i), y = ground(x, z); p.setY(i, y);
        const hill = U.smooth(4, 14, y) * (Math.hypot(x - J.x, z - J.z) < 40 ? 1 : 0), far = U.smooth(4, 30, y) * (1 - hill);
        const wad = 1 - U.smooth(3, 12, Math.abs(x - wadiX(z)));
        let c = U.mix([0.95, 0.84, 0.66], [0.82, 0.74, 0.62], wad * 0.7);
        c = U.mix(c, [0.66, 0.58, 0.52], hill); c = U.mix(c, [0.48, 0.4, 0.36], far);
        col.set(c, i * 3);
      }
      geo.setAttribute('color', new T.BufferAttribute(col, 3)); geo.computeVertexNormals();
      S.add(new T.Mesh(geo, KIT.std({ map: KIT.sand(w, [110, 110]), vertexColors: true, relief: 0.03 })));
      const granite = w.tex(512, (g, s) => { g.fillStyle = '#6a5a50'; g.fillRect(0, 0, s, s); for (let i = 0; i < 7000; i++) { const c = Math.random(); g.fillStyle = c < 0.55 ? 'rgba(50,40,34,0.6)' : c < 0.92 ? 'rgba(150,130,116,0.5)' : 'rgba(220,206,190,0.45)'; g.fillRect(Math.random() * s, Math.random() * s, 1 + Math.random() * 2, 1 + Math.random() * 2); } }, [2, 2]);
      const bmat = KIT.std({ map: granite, color: 0xe8d8c8, flatShading: true, relief: 0.06 });
      const r = U.seeded(632);
      for (let i = 0; i < 150; i++) {
        const a = r() * 6.283, d = Math.pow(r(), 0.6) * 24, x = J.x + Math.cos(a) * d, z = J.z + Math.sin(a) * d / 1.15, s = 1.0 + r() * 3.2 * (1 - d / 30);
        const b = new T.Mesh(new T.DodecahedronGeometry(s, 0), bmat); b.position.set(x, ground(x, z) + s * 0.25, z); b.rotation.set(r() * 3, r() * 3, r() * 3); b.scale.y = 0.7; S.add(b);
        if (s > 1.8) w.addCircle(x, z, s * 0.8);
      }

      /* ---------- the tent city ---------- */
      const tentGeo = new T.CylinderGeometry(1.2, 1.2, 3.2, 3, 1).rotateX(-Math.PI / 2).translate(0, 0.6, 0);
      const awnGeo = merge(T, [new T.BoxGeometry(3.4, 0.06, 3.4).translate(0, 2.4, 0), ...[[-1.6, -1.6], [1.6, -1.6], [-1.6, 1.6], [1.6, 1.6]].map(([x, z]) => new T.CylinderGeometry(0.05, 0.05, 2.4, 4).translate(x, 1.2, z))]);
      const clothTex = w.tex(256, (g, s) => { g.fillStyle = '#e8dcc6'; g.fillRect(0, 0, s, s); for (let i = 0; i < s; i += 6) { g.fillStyle = `rgba(120,96,70,${0.05 + Math.random() * 0.08})`; g.fillRect(0, i, s, 3); } for (let i = 0; i < 2500; i++) { g.fillStyle = 'rgba(90,70,50,0.12)'; g.fillRect(Math.random() * s, Math.random() * s, 2, 1); } }, [1, 1]);
      const tentMat = KIT.std({ map: clothTex, roughness: 1, side: T.DoubleSide, relief: 0.02 });
      const tents = [], awns = [];
      const corridors = CAMPS.map(c => [SRC, c]);
      const segD = (px, pz, a, b) => { const dx = b.x - a.x, dz = b.z - a.z, t = U.clamp(((px - a.x) * dx + (pz - a.z) * dz) / (dx * dx + dz * dz)); return Math.hypot(px - a.x - dx * t, pz - a.z - dz * t); };
      const clear = (x, z, pad) => {
        if (Math.hypot(x - SRC.x, z - SRC.z) < 22 + pad || Math.hypot(x - J.x, (z - J.z) * 1.15) < 34 + pad) return false;
        if (Math.hypot(x - w.pos.x, z - w.pos.z) < 8) return false;
        if (Math.abs(x - wadiX(z)) < 6) return false;
        for (const c of CAMPS) if (Math.hypot(x - c.x, z - c.z) < 14 + pad) return false;
        for (const [a, b] of corridors) if (segD(x, z, a, b) < 6 + pad) return false;
        return true;
      };
      for (let k = 0; tents.length + awns.length < 1900 && k < 20000; k++) {
        const x = (r() - 0.5) * 340, z = (r() - 0.5) * 340;
        const rr = Math.hypot(x, z * 1.1), edge = 120 + 45 * (U.noise2(x * 0.02 + 5, z * 0.02) * 0.5 + 0.5);
        if (rr > edge || r() < U.smooth(edge - 50, edge, rr) * 0.8) continue;
        if (U.noise2(x * 0.03 + 11, z * 0.03) < -0.25) continue;
        if (!clear(x, z, 0)) continue;
        const it = { x, z, yaw: Math.round(r() * 4) * Math.PI / 2 + (r() - 0.5) * 0.3, s: 0.8 + r() * 0.5, c: r() };
        (r() < 0.27 ? awns : tents).push(it);
      }
      // each waiting camp is a ring of tents round a lamp, open toward the valley
      this.camps = CAMPS.map((c, ci) => {
        const toSrc = Math.atan2(SRC.z - c.z, SRC.x - c.x);
        for (let i = 0; i < 16; i++) {
          const a = (i / 16) * 6.283;
          let da = Math.abs(((a - toSrc + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
          if (da < 0.55) continue;
          const rr = 9 + (i % 2) * 2.4;
          tents.push({ x: c.x + Math.cos(a) * rr, z: c.z + Math.sin(a) * rr, yaw: -a, s: 0.95 + r() * 0.3, c: r() });
        }
        return { ...c, i: ci, lit: 0, litT: 0 };
      });
      const cloths = [[0.94, 0.9, 0.82], [0.84, 0.74, 0.6], [0.42, 0.32, 0.26], [0.9, 0.86, 0.78], [0.7, 0.58, 0.44]];
      const m4 = new T.Matrix4(), q = new T.Quaternion(), v = new T.Vector3(), sc = new T.Vector3(), cc = new T.Color();
      const fill = (geo0, list, rad) => {
        const im = new T.InstancedMesh(geo0, tentMat, list.length);
        list.forEach((it, i) => {
          m4.compose(v.set(it.x, ground(it.x, it.z) - 0.05, it.z), q.setFromAxisAngle(sc.set(0, 1, 0), it.yaw), sc.set(it.s, it.s * (0.9 + it.c * 0.2), it.s));
          im.setMatrixAt(i, m4);
          const k = cloths[Math.floor(it.c * cloths.length)]; im.setColorAt(i, cc.setRGB(k[0], k[1], k[2]));
          if (Math.abs(it.x) < 145 && it.z > -155 && it.z < 135) w.addCircle(it.x, it.z, rad * it.s);
        });
        im.userData.dynamic = true; im.castShadow = true; im.receiveShadow = true; S.add(im);
        return im;
      };
      this.tentMesh = fill(tentGeo, tents, 1.5); this.awnMesh = fill(awnGeo, awns, 1.9);

      /* ---------- the source in the valley bottom ---------- */
      const slab = new T.Mesh(new T.CylinderGeometry(2.6, 3, 0.5, 9), KIT.std({ map: granite, color: 0xc8b8a8, flatShading: true }));
      slab.position.set(SRC.x, ground(SRC.x, SRC.z) + 0.1, SRC.z); S.add(slab);
      w.addCircle(SRC.x, SRC.z, 2.4);
      this.srcY = ground(SRC.x, SRC.z) + 0.4;
      this.srcGlow = KIT.glow(w, IVORY, 6, 0.9); this.srcGlow.position.set(SRC.x, this.srcY + 1.4, SRC.z); S.add(this.srcGlow);
      this.srcLight = new T.PointLight(0xfff0d8, 1.2, 18, 1.6); this.srcLight.position.set(SRC.x, this.srcY + 2.5, SRC.z); S.add(this.srcLight);
      const beamTex = w.tex(64, (g, s) => { const gr = g.createLinearGradient(0, s, 0, 0); gr.addColorStop(0, 'rgba(255,255,255,0.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, s, s); });
      beamTex.wrapS = beamTex.wrapT = T.ClampToEdgeWrapping;
      const beamMat = () => new T.MeshBasicMaterial({ map: beamTex, color: IVORY, transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false, fog: false });
      this.srcBeam = new T.Mesh(new T.CylinderGeometry(0.35, 0.9, 50, 16, 1, true), beamMat()); this.srcBeam.position.set(SRC.x, this.srcY + 25, SRC.z); this.srcBeam.userData.dynamic = true; S.add(this.srcBeam);
      this.srcMotes = KIT.dust(w, 90, [SRC.x - 2.5, this.srcY, SRC.z - 2.5, SRC.x + 2.5, this.srcY + 7, SRC.z + 2.5], IVORY, 0.12); S.add(this.srcMotes);

      /* ---------- the camps' lamps, lantern points, beams and lights ---------- */
      const poleMat = KIT.std({ map: KIT.wood(w, [1, 2], '#5a4030'), color: 0x9a8070 });
      const lampMat = KIT.std({ color: 0x3a2c20, roughness: 0.6, metalness: 0.3 });
      this.camps.forEach(c => {
        c.y = ground(c.x, c.z);
        const pole = new T.Mesh(new T.CylinderGeometry(0.08, 0.12, 4.6, 6), poleMat); pole.position.set(c.x, c.y + 2.3, c.z); S.add(pole);
        const cage = new T.Mesh(new T.CylinderGeometry(0.28, 0.22, 0.55, 6), lampMat); cage.position.set(c.x, c.y + 4.5, c.z); S.add(cage);
        w.addCircle(c.x, c.z, 0.4);
        c.flame = KIT.glow(w, 0xffc070, 1.2, 0.5); c.flame.position.set(c.x, c.y + 4.5, c.z); S.add(c.flame);
        c.beam = new T.Mesh(new T.CylinderGeometry(0.35, 1.0, 70, 12, 1, true), beamMat()); c.beam.position.set(c.x, c.y + 39, c.z); c.beam.userData.dynamic = true; S.add(c.beam);
        c.light = new T.PointLight(0xffc880, 0, 34, 1.6); c.light.position.set(c.x, c.y + 4, c.z); S.add(c.light);
        const n = 36, lp = new Float32Array(n * 3);
        for (let i = 0; i < n; i++) { const a = (i / n) * 6.283 + r() * 0.15, rr = 7 + r() * 8; lp.set([c.x + Math.cos(a) * rr, c.y + 0.6 + r() * 1.8, c.z + Math.sin(a) * rr], i * 3); }
        const lg = new T.BufferGeometry(); lg.setAttribute('position', new T.BufferAttribute(lp, 3));
        c.lanterns = new T.Points(lg, new T.PointsMaterial({ map: KIT.glowTex(w), color: 0xffbe70, size: 0.9, transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending }));
        c.lanterns.userData.dynamic = true; S.add(c.lanterns);
        w.interact({ key: `camp${c.i}`, pos: [c.x, c.y + 2, c.z], r: 4.2, label: 'Deliver the words to this camp', enabled: () => self.carrying && self.n === c.i, onUse: () => self.deliver(env, c) });
      });
      // a leading line of motes on the ground from the valley to the waiting camp
      const TRN = 44;
      this.trail = new T.Points(new T.BufferGeometry().setAttribute('position', new T.BufferAttribute(new Float32Array(TRN * 3), 3)), new T.PointsMaterial({ map: KIT.glowTex(w), color: IVORY, size: 0.45, transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending }));
      this.trail.frustumCulled = false; this.trail.userData.dynamic = true; S.add(this.trail);
      // what you carry: a small ivory light held before you
      this.held = KIT.glow(w, IVORY, 0.16, 0); this.held.material.depthTest = false; this.held.renderOrder = 20;
      S.add(w.camera); w.camera.add(this.held); this.held.position.set(0.2, -0.22, -0.75);
      this.heldCore = KIT.glow(w, 0xffffff, 0.05, 0); this.heldCore.material.depthTest = false; this.heldCore.renderOrder = 21; w.camera.add(this.heldCore); this.heldCore.position.copy(this.held.position);

      // golden dust and haze
      this.dust = KIT.dust(w, 420, [-60, 0.3, -60, 60, 14, 70], 0xffd8a0, 0.09); S.add(this.dust);
      const haze = w.tex(128, (g, s) => { const gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2); gr.addColorStop(0, 'rgba(255,255,255,0.5)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, s, s); });
      haze.wrapS = haze.wrapT = T.ClampToEdgeWrapping;
      this.hazes = [];
      for (let i = 0; i < 14; i++) {
        const sp = new T.Sprite(new T.SpriteMaterial({ map: haze, color: 0xf0c890, transparent: true, opacity: 0.22, depthWrite: false }));
        const a = r() * 6.283, d = 60 + r() * 120; sp.position.set(Math.cos(a) * d, 6 + r() * 6, Math.sin(a) * d); sp.scale.set(90, 22, 1); S.add(sp); this.hazes.push(sp);
      }

      w.followShadow(this.sun, 45); w.receiveAll();
      [this.srcBeam, this.trail, ...this.camps.map(c => c.beam)].forEach(m => { m.castShadow = false; m.receiveShadow = false; });
      S.traverse(m => { if (m.isMesh && !m.isInstancedMesh && !Array.isArray(m.material) && m.geometry.groups.length > 1) m.geometry.clearGroups(); });
      this.baked = w.bake();

      /* ---------- the activity ---------- */
      this.n = 0; this.carrying = false; this.phase = 'walk'; this.phaseT = 0; this.sinceStart = 0; this.texts = [];
      w.activity('Let those present tell those absent', 5, 'Go down to the light in the valley bottom and receive the first line');
      w.interact({ key: 'source', pos: [SRC.x, this.srcY + 1.2, SRC.z], r: 4.2, label: () => `Receive line ${ROMAN[self.n]} of the sermon`, enabled: () => !self.carrying && self.n < 5 && self.phase === 'walk', onUse: () => self.receive(env) });

      const b = env.bus;
      this.wind = SND.noise(b, { color: 'pink', type: 'bandpass', freq: 420, q: 0.5, gain: 0.04 });
      SND.lfo(b, this.wind.gain && this.wind.gain.gain, 0.06, 0.015);
      this.crowd = SND.noise(b, { color: 'pink', type: 'bandpass', freq: 330, q: 1.2, gain: 0.025 });
      SND.lfo(b, this.crowd.filter && this.crowd.filter.frequency, 0.3, 60);
      this.carryHum = SND.drone(b, 220, { vowel: 'u', gain: 0 });   // warms as you near the waiting camp
      this.campChoir = [];                                          // each lit camp keeps a voice
      this.murmurClock = 1.5;

      // arrival: high over the whole plain in golden haze, then a slow push in toward the hill
      w.cinematic([
        { p: [210, 150, 250], l: [0, 0, -40] },
        { p: [150, 105, 170], l: [J.x, 8, J.z] },
        { p: [80, 52, 80], l: [J.x, 10, J.z] },
        { p: [30, 18, 50], l: [J.x, 12, J.z] },
        { p: [SRC.x + 3, ground(SRC.x + 3, SRC.z + 14) + 1.62, SRC.z + 14], l: [SRC.x + 2, 2, SRC.z] },
      ], 12);
    },

    setSun(tau) {
      const T = THREE, e = U.lerp(0.42, -0.02, tau), az = 0.22;
      const d = new T.Vector3(-Math.cos(e) * Math.cos(az), Math.sin(e), Math.cos(e) * Math.sin(az)).normalize();
      this.sunDir = d;
      const u = this.skyM.material.uniforms;
      u.uSunDir.value.copy(d);
      u.uTop.value.set(U.rgb(U.ramp([[0, '#5a86c0'], [0.6, '#4a6aa8'], [0.9, '#34406e'], [1, '#262c50']], tau)));
      u.uMid.value.set(U.rgb(U.ramp([[0, '#f0cf9c'], [0.6, '#f4b67a'], [0.9, '#f08a50'], [1, '#c8604a']], tau)));
      u.uBot.value.set(U.rgb(U.ramp([[0, '#b89068'], [1, '#6a4a40']], tau)));
      u.uSun.value.set(U.rgb(U.ramp([[0, '#fff0c8'], [0.7, '#ffcc88'], [1, '#ff8a4a']], tau)));
      this.sun.color.set(U.rgb(U.ramp([[0, '#ffe0b0'], [0.7, '#ffc488'], [1, '#ff9a5a']], tau)));
      this.sun.intensity = U.lerp(2.2, 0.7, U.smooth(0.4, 1, tau));
      this.hemi.intensity = U.lerp(0.55, 0.35, tau);
      this.sun.position.copy(d).multiplyScalar(80);
      if (this.w && this.w._shadow) this.w._shadow.off.copy(d).multiplyScalar(45 * 2.5);
      if (this.w && this.w.scene.fog) this.w.scene.fog.color.set(U.rgb(U.ramp([[0, '#e2bc84'], [0.7, '#e8a870'], [1, '#a8705a']], tau)));
    },

    receive(env) {
      const w = this.w, L = LINES[this.n];
      this.carrying = true;
      SND.glow(env.bus, [146.83, 164.81, 196, 220, 246.94][this.n], { gain: 0.06, dur: 7, vowel: 'a' });
      SND.bell(env.bus, 587.33, { gain: 0.035, delay: 0.3, glass: true });
      w.say(`The Sermon · ${ROMAN[this.n]}`, L.card, { ar: L.ar, ms: 14000 });
      w.step(`Carry line ${ROMAN[this.n]} across the plain to the camp with the bright lamp`);
      const sp = lightText(THREE, L.ar, L.en, `THE SERMON  ·  ${ROMAN[this.n]}`);
      sp.position.set(SRC.x, this.srcY + 5.5, SRC.z); sp.scale.set(11, 5.5, 1); w.scene.add(sp);
      this.texts.push({ sp, t: 0, fade: true });
      this.layTrail();
    },

    layTrail() {
      const c = this.camps[this.n], a = this.trail.geometry.attributes.position, n = a.count;
      for (let i = 0; i < n; i++) {
        const k = (i + 1) / (n + 1), x = U.lerp(SRC.x, c.x, k), z = U.lerp(SRC.z, c.z, k);
        a.setXYZ(i, x, ground(x, z) + 0.25, z);
      }
      a.needsUpdate = true;
    },

    deliver(env, c) {
      const w = this.w, L = LINES[c.i];
      this.carrying = false; c.lit = 1; c.litT = 0; this.n++;
      const sp = w.spatial(c, 20);
      SND.glow(env.bus, [196, 220, 246.94, 261.63, 293.66][c.i], { gain: 0.07, dur: 9, vowel: 'a', pan: sp.pan });
      SND.bell(env.bus, [392, 440, 493.88, 523.25, 587.33][c.i], { gain: 0.05, delay: 0.2, pan: sp.pan });
      SND.swell(env.bus, { f0: 300, f1: 1500, dur: 2, gain: 0.05, pan: sp.pan });
      // the camp keeps a voice, so the plain's harmony grows with every line delivered
      this.campChoir.push(SND.drone(env.bus, [146.83, 220, 293.66, 369.99, 440][c.i] / 2, { vowel: c.i % 2 ? 'o' : 'u', gain: 0.005, pan: sp.pan }));
      const t = lightText(THREE, L.ar, L.en, '');
      t.position.set(c.x, c.y + 14, c.z); t.scale.set(24, 12, 1); w.scene.add(t);
      this.texts.push({ sp: t, t: 0, fade: false });
      this.tauTarget = this.n < 5 ? this.n * 0.17 : 1;
      if (this.n < 5) {
        w.progress(this.n, `Return to the light in the valley for line ${ROMAN[this.n]}`);
        if (this.n === 4) w.step('The sun is low. Return to the valley for the last line');
      } else {
        w.progress(5, 'The sun sets over ‘Arafat');
        this.phase = 'sunset'; this.phaseT = 0;
      }
    },

    update(env, dt) {
      const w = this.w; if (!w) return;
      w.update(dt);
      const t = w.time, T = THREE;
      if (w.skyMesh) w.skyMesh.position.copy(w.camera.position);   // the dome travels with the eye, so high shots never clip it
      KIT.driftDust(this.dust, dt, t, [0.25, 0.1]);
      // the dust follows the walker so the air is always golden
      this.dust.position.set(Math.round(w.pos.x / 40) * 40, 0, Math.round(w.pos.z / 40) * 40);
      if (!w.cine) this.sinceStart += dt;
      if (this.sinceStart > 1.5 && !this.saidIntro) {
        this.saidIntro = true;
        w.say('The Day of ‘Arafah', 'In 10 AH he made his only pilgrimage, the Farewell Pilgrimage. On the Day of ‘Arafah he came down to the valley bottom at the edge of the plain and addressed the people. (Sahih Muslim 1218, from Jabir)', { ms: 12000 });
      }
      // the sun lowers with every line delivered
      this.tau = U.damp(this.tau, this.tauTarget, this.phase === 'sunset' ? 0.35 : 0.8, dt);
      this.setSun(this.tau);
      const dusk = U.smooth(0.5, 1, this.tau);

      // the source: brightest while it waits for you
      const waiting = !this.carrying && this.n < 5 && this.phase === 'walk';
      const pulse = 0.5 + 0.5 * Math.sin(t * 2.2);
      this.srcGlow.material.opacity = waiting ? 0.75 + 0.25 * pulse : 0.3;
      this.srcGlow.scale.setScalar(waiting ? 3.6 + pulse * 0.8 : 2.5);
      this.srcBeam.material.opacity = waiting ? 0.13 + 0.05 * pulse : 0.03;
      this.srcLight.intensity = waiting ? 1.4 : 0.5;
      const sm = this.srcMotes.geometry.attributes.position;
      for (let i = 0; i < sm.count; i++) { let y = sm.getY(i) + dt * (0.5 + (i % 4) * 0.2); if (y > this.srcY + 7) y = this.srcY; sm.setY(i, y); }
      sm.needsUpdate = true;
      this.srcMotes.material.opacity = waiting ? 0.8 : 0.25;

      // what you carry
      const hk = this.carrying ? 1 : 0;
      this.held.material.opacity = U.damp(this.held.material.opacity, hk * (0.85 + 0.15 * Math.sin(t * 3)), 6, dt);
      this.heldCore.material.opacity = this.held.material.opacity;
      this.trail.material.opacity = U.damp(this.trail.material.opacity, hk * 0.9, 3, dt);
      if (this.carrying) {
        const tp = this.trail.geometry.attributes.position, c = this.camps[this.n], n = tp.count;
        for (let i = 0; i < n; i++) { const k = ((i + 1) / (n + 1) + t * 0.04) % 1, x = U.lerp(SRC.x, c.x, k), z = U.lerp(SRC.z, c.z, k); tp.setXYZ(i, x, ground(x, z) + 0.25 + Math.sin(t * 2 + i) * 0.05, z); }
        tp.needsUpdate = true;
        const d = Math.hypot(w.pos.x - c.x, w.pos.z - c.z);
        this.carryHum.set([220, 246.94, 261.63, 293.66, 329.63][this.n] / 2, 0.5);
        this.carryHum.setGain(0.004 + 0.016 * U.clamp(1 - d / 120), 0.4);
      } else this.carryHum.setGain(0, 0.6);

      // the camps
      this.camps.forEach(c => {
        const target = this.carrying && this.n === c.i;
        c.beam.material.opacity = U.damp(c.beam.material.opacity, target ? 0.3 + 0.06 * Math.sin(t * 2.4) : 0, 3, dt);
        if (c.lit) {
          c.litT += dt;
          const k = U.smooth(0, 2.5, c.litT);
          c.flame.material.opacity = 0.9 * k + 0.1 * Math.sin(t * 9 + c.i) * k; c.flame.scale.setScalar(1.2 + 2.2 * k);
          c.light.intensity = (0.6 + 1.6 * dusk) * k * (0.92 + 0.08 * Math.sin(t * 7 + c.i));
          c.lanterns.material.opacity = k * (0.35 + 0.65 * dusk);
        } else {
          c.flame.material.opacity = target ? 0.9 + 0.1 * Math.sin(t * 5) : 0.35;
          c.flame.scale.setScalar(target ? 2.6 + 0.4 * Math.sin(t * 2.4) : 1.0);
          c.flame.material.color.setHex(target ? IVORY : 0xffb060);
        }
      });
      this.texts.forEach(o => {
        o.t += dt;
        o.sp.material.opacity = U.smooth(0, 2, o.t) * (o.fade ? 1 - U.smooth(10, 14, o.t) : 0.95);
        if (o.fade) o.sp.position.y += dt * 0.25;
      });
      this.hazes.forEach((h, i) => { h.material.opacity = 0.18 + 0.08 * Math.sin(t * 0.15 + i); h.material.color.set(U.rgb(U.ramp([[0, '#f0c890'], [1, '#e08860']], this.tau))); });

      // the voices of the plain: murmurs from the tents, and more from the camps that have heard
      this.murmurClock -= dt;
      if (this.murmurClock < 0 && this.phase !== 'sunset') {
        this.murmurClock = 0.7 + Math.random() * 1.6;
        const lit = this.camps.filter(c => c.lit), src = lit.length && Math.random() < 0.6 ? U.pick(lit) : { x: w.pos.x + U.rnd(-60, 60), z: w.pos.z + U.rnd(-60, 60) };
        const sp = w.spatial(src, 30);
        SND.sing(env.bus, U.rnd(120, 190), { vowel: U.pick(['a', 'o', 'u', 'm']), dur: U.rnd(0.6, 1.6), gain: 0.008 + sp.gain * 0.03, pan: sp.pan, voices: 2, breath: 0.25, attack: 0.15, hold: 0.35, vib: 0.004 });
      }

      // the last line, at sunset: near-silence, then the verse revealed that day
      if (this.phase === 'sunset' || this.phase === 'still') {
        const T0 = this.phaseT, T1 = (this.phaseT += dt), cross = s => T0 < s && T1 >= s;
        if (this.phase === 'sunset') {
          this.wind.set('gain', 0.006, 1); this.crowd.set('gain', 0.003, 1);
          this.campChoir.forEach(c => c.setGain(0.0015, 1.5));
          if (cross(5)) {
            SND.glow(env.bus, 146.83, { gain: 0.09, dur: 16, vowel: 'a' });
            SND.glow(env.bus, 220, { gain: 0.05, dur: 15, vowel: 'o', delay: 1.4 });
            SND.bell(env.bus, 587.33, { gain: 0.04, delay: 2.5, glass: true });
            this.campChoir.forEach(c => c.setGain(0.008, 4));
            this.wind.set('gain', 0.025, 6);
            w.say('This Day', 'On that day, the Day of ‘Arafah, this verse was revealed: <span class="q">“This day I have perfected your religion for you, completed My favour upon you, and chosen Islam as your religion.”</span> (Qur’an 5:3; Sahih al-Bukhari 45)', { ar: 'الْيَوْمَ أَكْمَلْتُ لَكُمْ دِينَكُمْ وَأَتْمَمْتُ عَلَيْكُمْ نِعْمَتِي', ms: 16000 });
          }
          if (cross(9)) { this.phase = 'still'; w.finish('The words are carried to those who were absent'); }
        }
      }
    },
  }));
})();
