/* Makkah — The Cave of Hira (walkable), 610 CE.
   A night in Ramadan near the summit of Jabal an-Nur. Climb the last of the path to the cleft in
   the granite where he used to retreat, look out over the far valley of Makkah, and at the cave the
   first five verses of Surat al-'Alaq are written in light across the sky. No person is shown. */
(function () {
  'use strict';
  if (!window.WORLD) return;
  const CAVE = { x: -0.6, z: -16 };
  const VERSES = [
    ['اقْرَأْ بِاسْمِ رَبِّكَ الَّذِي خَلَقَ', 'Read, in the name of your Lord who created,'],
    ['خَلَقَ الْإِنسَانَ مِنْ عَلَقٍ', 'created man from a clinging clot.'],
    ['اقْرَأْ وَرَبُّكَ الْأَكْرَمُ', 'Read, and your Lord is the Most Generous,'],
    ['الَّذِي عَلَّمَ بِالْقَلَمِ', 'who taught by the pen,'],
    ['عَلَّمَ الْإِنسَانَ مَا لَمْ يَعْلَمْ', 'taught man what he did not know.'],
  ];

  // the path climbs north (toward -z); the mountain falls away steeply to the east
  function ground(x, z) {
    const along = U.clamp((14 - z) / 30);
    let y = along * 9 + U.noise2(x * 0.3, z * 0.3) * 0.25;
    if (x > 3) y -= Math.pow(x - 3, 1.5) * 1.1;
    if (x < -3.5) y += Math.pow(-x - 3.5, 1.3) * 1.4;
    y += U.noise2(x * 0.07 + 4, z * 0.07) * 1.2 * U.smooth(4, 12, Math.abs(x));
    return y;
  }

  ENGINE.register(WORLD.stage({
    key: 'hira',
    arabic: 'غَارُ حِرَاء',
    title: 'The Cave of Hira',
    era: 'Jabal an-Nur · Ramadan, 610 CE · the first revelation',
    hint: 'WASD to climb · E to look out · E at the cave',
    sound: { reverb: 0.8 },
    story: `<p>In the years before revelation he would leave Makkah for nights at a time to worship alone in a small cave on a mountain north-east of the city, taking provisions with him. There, in the month of Ramadan, when he was about forty, the angel came to him and said: <i>Read.</i></p>
            <p class="q"><span class="ar">اقْرَأْ بِاسْمِ رَبِّكَ الَّذِي خَلَقَ</span>“Read, in the name of your Lord who created.” (Qur’an 96:1)</p>`,

    shotDur: 11,
    // rising from the night valley up the mountain face to the cleft, then down the path to you
    shots() { return [[[70, -70, 30], [0, 0, -10]], [[30, -20, 0], [0, 6, -14]], [[9, 9, -12], [-0.6, 7.5, -16]], [[3, 9, 6], [0, 5, -4]], [[0, 0, 0], [0, 0, 0]]]; },

    enter(env) {
      const T = THREE, self = this;
      const w = this.w = WORLD.create(env, {
        start: { x: 0.5, z: 12, yaw: 0, pitch: 0.12 }, exposure: 1.25, far: 2000, speed: 2.4, run: 4,
        fog: { color: 0x0c1226, density: 0.0028 }, bounds: [-3.2, CAVE.z + 1.8, 3.4, 14], ground,
        surface: () => 'gravel',
      });
      const S = w.scene;
      const moonDir = new T.Vector3(0.6, 0.35, -0.5).normalize();
      w.sky({ top: '#03050d', mid: '#121a34', bot: '#05070d', sunDir: moonDir.toArray(), sun: '#9aa8d0', sunSize: 0.0005, stars: 1.3 });
      S.add(new T.HemisphereLight(0x4a5888, 0x1a1410, 0.55));
      const moon = new T.DirectionalLight(0xaab8ff, 1.0); moon.position.copy(moonDir).multiplyScalar(40); S.add(moon);
      // a thin crescent: a disc with a darker disc offset over it
      const crescent = w.tex(256, (g, s) => {
        const gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2); gr.addColorStop(0, 'rgba(255,244,220,0.25)'); gr.addColorStop(1, 'rgba(255,244,220,0)');
        g.fillStyle = gr; g.fillRect(0, 0, s, s);
        g.fillStyle = '#fff6e0'; g.beginPath(); g.arc(s / 2, s / 2, s * 0.18, 0, 6.283); g.fill();
        g.globalCompositeOperation = 'destination-out'; g.beginPath(); g.arc(s / 2 + s * 0.07, s / 2 - s * 0.04, s * 0.17, 0, 6.283); g.fill();
      });
      crescent.wrapS = crescent.wrapT = T.ClampToEdgeWrapping;
      const cres = new T.Sprite(new T.SpriteMaterial({ map: crescent, transparent: true, depthWrite: false, fog: false })); cres.scale.set(70, 70, 1); cres.position.copy(moonDir).multiplyScalar(900); S.add(cres);

      // the mountain: near terrain from the path function, and the far ranges and valley below
      const granite = w.tex(512, (g, s) => { g.fillStyle = '#4a3e38'; g.fillRect(0, 0, s, s); for (let i = 0; i < 6000; i++) { const c = Math.random(); g.fillStyle = c < 0.6 ? 'rgba(40,32,28,0.6)' : c < 0.93 ? 'rgba(110,94,84,0.5)' : 'rgba(180,164,150,0.35)'; g.fillRect(Math.random() * s, Math.random() * s, 1 + Math.random() * 2, 1 + Math.random() * 2); } }, [12, 12]);
      const rockMat = KIT.std({ map: granite, color: 0xb0a49a, relief: 0.05 });
      const geo = new T.PlaneGeometry(120, 120, 140, 140); geo.rotateX(-Math.PI / 2);
      const p = geo.attributes.position; for (let i = 0; i < p.count; i++) p.setY(i, ground(p.getX(i), p.getZ(i)));
      geo.computeVertexNormals(); S.add(new T.Mesh(geo, rockMat));
      // steps cut into the path
      const stepMat = KIT.std({ map: granite, color: 0xc8bcb0 });
      for (let z = 10; z > CAVE.z + 3; z -= 1.6) { const st = new T.Mesh(new T.BoxGeometry(2.2, 0.25, 0.5), stepMat); st.position.set(0.3, ground(0.3, z) + 0.06, z); st.rotation.y = (Math.random() - 0.5) * 0.15; S.add(st); }
      // boulders along the path
      const bmat = KIT.std({ map: granite, color: 0xa89c92, flatShading: true });
      const r = U.seeded(610);
      for (let i = 0; i < 40; i++) {
        const side = r() < 0.5 ? -1 : 1, z = 12 - r() * 32, x = side * (3 + r() * 3.5), s = 0.5 + r() * 1.6;
        const b = new T.Mesh(new T.DodecahedronGeometry(s, 1), bmat); b.position.set(x, ground(x, z) + s * 0.3, z); b.rotation.set(r() * 3, r() * 3, 0); S.add(b);
      }
      // the cave: two great slabs leaning together over a narrow floor
      const slabMat = KIT.std({ map: granite, color: 0x9a8e86, flatShading: true });
      const cy = ground(CAVE.x, CAVE.z);
      const s1 = new T.Mesh(new T.BoxGeometry(4.5, 6, 2.5), slabMat); s1.position.set(CAVE.x - 2.2, cy + 2.2, CAVE.z - 1); s1.rotation.set(0.1, 0.2, -0.32); S.add(s1);
      const s2 = new T.Mesh(new T.BoxGeometry(4, 5.5, 2.8), slabMat); s2.position.set(CAVE.x + 2.1, cy + 2.0, CAVE.z - 1.4); s2.rotation.set(-0.08, -0.25, 0.36); S.add(s2);
      const back = new T.Mesh(new T.DodecahedronGeometry(3.4, 1), slabMat); back.position.set(CAVE.x, cy + 1.5, CAVE.z - 4.2); S.add(back);
      const cap = new T.Mesh(new T.DodecahedronGeometry(2.6, 1), slabMat); cap.position.set(CAVE.x, cy + 5.1, CAVE.z - 1.8); cap.scale.set(1.4, 0.6, 1.2); S.add(cap);
      this.caveLight = new T.PointLight(0xfff0d0, 0, 26, 1.6); this.caveLight.position.set(CAVE.x, cy + 1.4, CAVE.z - 1.6); S.add(this.caveLight);
      this.caveGlow = KIT.glow(w, 0xfff2d8, 6, 0); this.caveGlow.position.copy(this.caveLight.position); S.add(this.caveGlow);

      // far below: the valley of Makkah and a scatter of fires; ranges all round
      const rangeMat = KIT.std({ color: 0x141826, flatShading: true });
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * 6.283, d = 380 + (i % 3) * 120;
        const c = new T.Mesh(new T.ConeGeometry(90 + (i % 4) * 30, 70 + (i % 5) * 30, 6), rangeMat); c.position.set(Math.cos(a) * d, -160, Math.sin(a) * d); S.add(c);
      }
      const valley = new T.Mesh(new T.PlaneGeometry(1600, 1600), KIT.std({ color: 0x1c1a20 })); valley.rotation.x = -Math.PI / 2; valley.position.y = -190; S.add(valley);
      for (let i = 0; i < 70; i++) { const f = KIT.glow(w, 0xffa860, 3 + Math.random() * 4, 0.6); f.position.set(260 + Math.random() * 300, -186, 120 + Math.random() * 360); f.material.fog = false; S.add(f); }
      const kabahGlow = KIT.glow(w, 0xffe0b0, 10, 0.5); kabahGlow.position.set(420, -184, 330); kabahGlow.material.fog = false; S.add(kabahGlow);

      // the verses, written in light over the valley
      this.verseSprites = VERSES.map(([ar, en], i) => {
        const c = document.createElement('canvas'); c.width = 1400; c.height = 220;
        const g = c.getContext('2d'); g.textAlign = 'center'; g.direction = 'rtl';
        g.shadowColor = 'rgba(255,220,150,0.9)'; g.shadowBlur = 28; g.fillStyle = '#fff6dc'; g.font = '92px Amiri, "Geeza Pro", serif';
        g.fillText(ar, 700, 110); g.direction = 'ltr'; g.shadowBlur = 0; g.fillStyle = 'rgba(242,233,214,0.9)'; g.font = 'italic 40px Spectral, Georgia, serif'; g.fillText(en, 700, 190);
        const tex = new T.CanvasTexture(c); tex.encoding = T.sRGBEncoding;
        const sp = new T.Sprite(new T.SpriteMaterial({ map: tex, transparent: true, opacity: 0, depthWrite: false, fog: false }));
        sp.scale.set(30, 4.7, 1);
        S.add(sp); return sp;
      });
      this.dust = KIT.dust(w, 120, [-3, 0, CAVE.z - 2, 3, 8, 14], 0xc8d4ff, 0.03); S.add(this.dust);

      w.followShadow(moon, 22, 1024); w.receiveAll();
      this.baked = w.bake();

      /* ---------- the moments ---------- */
      this.phase = 'climb'; this.revT = 0;
      w.interact({ key: 'outlook', pos: [3.2, ground(3, -2) + 1, -2], r: 3.2, once: true, label: 'Look out over Makkah', onUse: () => {
        SND.glow(env.bus, 110, { gain: 0.04, dur: 8, vowel: 'o' });
        w.say('Far from the City', 'Hira lies on Jabal an-Nur, a steep peak about five kilometres north-east of the Ka‘bah. He would retreat here for nights at a time, then return to Khadijah for provisions and come back. (Sahih al-Bukhari)', { ms: 11000 });
      } });
      // provisions left along the path: he would take provisions for his nights of worship (Sahih al-Bukhari)
      this.supplies = 0;
      const supplyMat = KIT.std({ color: 0x8a6440, roughness: 0.9 });
      [[1.4, 7, 'A waterskin'], [-1.2, -1, 'A bundle of dates'], [1.6, -9, 'A folded cloak']].forEach(([x, z, name], i) => {
        const y = ground(x, z);
        const m = new T.Mesh(i === 0 ? new T.SphereGeometry(0.22, 12, 8) : new T.BoxGeometry(0.42, 0.22, 0.32), supplyMat); m.position.set(x, y + 0.2, z); m.userData.dynamic = true; S.add(m);
        const g = KIT.glow(w, 0xffe0a0, 1.2, 0.5); g.position.set(x, y + 0.4, z); S.add(g);
        w.interact({ key: 'sup' + i, pos: [x, y + 0.3, z], r: 2.2, once: true, label: `Take up ${name.toLowerCase()}`, onUse: () => {
          m.visible = false; g.visible = false; self.supplies++;
          SND.step(env.bus, { gain: 0.15, f: 1200 }); SND.bell(env.bus, 440 + i * 60, { gain: 0.04, glass: true });
          w.progress(self.supplies, self.supplies < 3 ? 'Gather the provisions on the path' : 'Climb to the mouth of the cave');
        } });
      });
      w.activity('Provisions for the night', 4, 'Gather the provisions on the path up the mountain');
      w.interact({ key: 'cave', pos: [CAVE.x, cy + 1.2, CAVE.z], r: 3.4, once: true, label: 'Come to the mouth of the cave', enabled: () => self.supplies >= 3, onUse: () => { self.phase = 'revelation'; self.revT = 0; w.progress(3, 'Listen'); } });

      const b = env.bus;
      this.wind = SND.noise(b, { color: 'pink', type: 'bandpass', freq: 320, q: 0.6, gain: 0.09 });
      SND.lfo(b, this.wind.gain && this.wind.gain.gain, 0.06, 0.05);
      this.gust = 3; this.cricketClock = 1;
    },

    update(env, dt) {
      const w = this.w; if (!w) return;
      w.update(dt);
      const t = w.time;
      KIT.driftDust(this.dust, dt, t, [0.04, -0.02]);
      this.gust -= dt;
      if (this.gust < 0) { this.gust = 4 + Math.random() * 6; SND.swell(env.bus, { f0: 200, f1: 800, dur: 3 + Math.random() * 2, gain: 0.08, pan: U.rnd(-1, 1) }); }
      this.cricketClock -= dt;
      if (this.cricketClock < 0 && this.phase === 'climb') { this.cricketClock = 0.5 + Math.random() * 1.5; SND.cricket(env.bus, { gain: 0.003 }); }

      if (this.phase === 'revelation') {
        if (!this.placedVerses) {
          // the verses appear out over the valley, in the direction you are facing
          this.placedVerses = true;
          const f = w.forward(), l = Math.hypot(f.x, f.z) || 1, fx = f.x / l, fz = f.z / l;
          this.verseSprites.forEach((sp, i) => sp.position.set(w.pos.x + fx * 48, w.y + 20 - i * 5.6, w.pos.z + fz * 48));
        }
        const T0 = this.revT, T1 = (this.revT += dt);
        const cross = s => T0 < s && T1 >= s;
        // the wind falls silent, light gathers in the cave, and the verses appear one by one
        this.wind.set('gain', 0.09 * (1 - U.smooth(0, 3, T1)), 0.3);
        const glow = U.smooth(1, 5, T1);
        this.caveLight.intensity = glow * 4; this.caveGlow.material.opacity = glow * 0.9;
        w.renderer.toneMappingExposure = 1.25 + glow * 0.25;
        if (cross(1.5)) SND.glow(env.bus, 98, { gain: 0.07, dur: 14, vowel: 'o' });
        if (cross(2.2)) w.say('Read', 'The angel came to him and said, <span class="q">“Read.”</span> He answered, <span class="q">“I am not one who reads.”</span> The angel took hold of him and pressed him until he could bear no more, three times, and then said: <span class="q">“Read, in the name of your Lord who created…”</span> (Sahih al-Bukhari, from ‘A’ishah)', { ms: 16000 });
        this.verseSprites.forEach((sp, i) => {
          const at = 5 + i * 4;
          if (cross(at)) { SND.glow(env.bus, [146.83, 164.81, 174.61, 196, 220][i], { gain: 0.06, dur: 9 }); }
          sp.material.opacity = U.smooth(at, at + 2.2, T1) * (1 - U.smooth(44, 50, T1) * 0.6);
          sp.position.y += Math.sin(t * 0.4 + i) * 0.003;
        });
        if (cross(25)) w.say('Cover Me', 'He returned to Khadijah with his heart trembling and said, <span class="q">“Cover me, cover me.”</span> She said: <span class="q">“Never. By God, God will never disgrace you. You keep the ties of kinship, you bear the burden of the weak, you give to those who have nothing, you honour your guest, and you help those struck by misfortune.”</span> (Sahih al-Bukhari)', { ar: 'كَلَّا وَاللَّهِ مَا يُخْزِيكَ اللَّهُ أَبَدًا', ms: 17000 });
        if (cross(42)) {
          w.say('Waraqah', 'Khadijah took him to her cousin Waraqah ibn Nawfal, an old man who knew the earlier scriptures. When he heard what had happened, he said: <span class="q">“This is the same keeper of secrets whom God sent to Moses.”</span> (Sahih al-Bukhari)', { ms: 14000 });
          w.finish('The first revelation');
        }
      }
    },
  }));
})();
