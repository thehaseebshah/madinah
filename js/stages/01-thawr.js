/* Station I — The Cave of Thawr (walkable).
   A low granite cave near the top of Mount Thawr, south of Makkah, on a moonlit night. You
   crouch inside, look out over the mountains, find the web and the nest at the entrance, and
   then hear the search party arrive at the mouth of the cave, and leave. */
(function () {
  'use strict';
  if (!window.WORLD) return;
  const CAVE = { rx: 2.6, ry: 1.75, rz: 4.0, cy: 0.95 };
  const MOUTH = new THREE.Vector3(0, 0.15, -1).normalize();

  ENGINE.register(WORLD.stage({
    key: 'thawr',
    arabic: 'غَارُ ثَوْر',
    title: 'The Cave of Thawr',
    era: 'Before the Hijrah · 622 CE · three nights in hiding',
    hint: 'WASD to move · drag or click to look · E at the entrance',
    sound: { reverb: 0.75 },
    story: `<p>The Prophet ﷺ and Abu Bakr left Makkah by night, going south when the search expected them to go north, and climbed Mount Thawr. For three nights they hid in a small cave near its summit, while Abu Bakr’s son brought them news and his shepherd brought milk and covered their tracks with his flock.</p>
            <p class="q"><span class="ar">ثَانِيَ اثْنَيْنِ إِذْ هُمَا فِي الْغَارِ</span>“The second of two, when they were in the cave…” (Qur’an 9:40)</p>`,

    enter(env) {
      const T = THREE, self = this;
      const w = this.w = WORLD.create(env, {
        start: { x: 0.3, z: 2.2, yaw: 0, pitch: 0.02 }, eye: 1.22, speed: 1.5, run: 2.2, exposure: 1.3,
        fog: { color: 0x0b1020, density: 0.004 },
        bounds: [-1.7, -CAVE.rz + 0.55, 1.7, CAVE.rz - 0.8],
        surface: () => 'gravel',
      });
      const S = w.scene;
      const moonDir = new T.Vector3(-0.25, 0.5, -0.83).normalize();
      w.sky({ top: '#04060f', mid: '#141c38', bot: '#06080e', sunDir: moonDir.toArray(), sun: '#c8d4ff', sunSize: 0.0008, stars: 1.2 });
      S.add(new T.HemisphereLight(0x4a5880, 0x2a2018, 0.6));
      const moon = new T.DirectionalLight(0xb8c8ff, 1.4); moon.position.copy(moonDir).multiplyScalar(40); S.add(moon);
      const halo = KIT.glow(w, 0xdde6ff, 90, 0.14); halo.position.copy(moonDir).multiplyScalar(800); halo.material.fog = false; S.add(halo);
      const disk = KIT.glow(w, 0xffffff, 20, 1); disk.position.copy(moonDir).multiplyScalar(790); disk.material.fog = false; S.add(disk);
      // moonlight spilling in through the mouth
      const spill = new T.SpotLight(0x9fb2ff, 2.2, 14, 0.75, 0.6, 1.4);
      spill.position.set(0, 2.4, -CAVE.rz - 1.5); spill.target.position.set(0, 0, 0.5); S.add(spill, spill.target);

      // the cave: a lumpy granite chamber, open at one end
      const granite = w.tex(512, (g, s) => {
        g.fillStyle = '#5a4e48'; g.fillRect(0, 0, s, s);
        for (let i = 0; i < 40; i++) { const x = Math.random() * s, y = Math.random() * s, r = 30 + Math.random() * 90, gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, Math.random() < 0.5 ? 'rgba(120,100,86,0.5)' : 'rgba(40,32,28,0.5)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); }
        for (let i = 0; i < 6000; i++) { const c = Math.random(); g.fillStyle = c < 0.55 ? 'rgba(50,40,36,0.6)' : c < 0.92 ? 'rgba(110,96,86,0.5)' : 'rgba(170,156,140,0.35)'; g.fillRect(Math.random() * s, Math.random() * s, 1 + Math.random() * 2, 1 + Math.random() * 2); }
        g.strokeStyle = 'rgba(20,14,12,0.5)';
        for (let i = 0; i < 22; i++) { g.lineWidth = 0.5 + Math.random() * 2; g.beginPath(); let x = Math.random() * s, y = Math.random() * s; g.moveTo(x, y); for (let k = 0; k < 8; k++) { x += (Math.random() - 0.5) * 60; y += Math.random() * 40; g.lineTo(x, y); } g.stroke(); }
      }, [3, 2]);
      const rockMat = KIT.std({ map: granite, color: 0xc8beb4, side: T.BackSide, relief: 0.05 });
      let cg = new T.SphereGeometry(1, 72, 48).toNonIndexed();
      const cp = cg.attributes.position, v = new T.Vector3();
      for (let i = 0; i < cp.count; i++) {
        v.set(cp.getX(i), cp.getY(i), cp.getZ(i));
        const n = 1 + U.noise2(v.x * 2.4 + v.z * 1.3, v.y * 2.4 + 3) * 0.18 + U.noise2(v.x * 7, v.y * 7 + v.z * 5) * 0.05;
        cp.setXYZ(i, v.x * CAVE.rx * n, v.y * CAVE.ry * n * (v.y < 0 ? 0.6 : 1), v.z * CAVE.rz * n);
      }
      // cut the mouth: drop triangles that face the way out
      const keep = [];
      for (let t = 0; t < cp.count; t += 3) {
        const cx = (cp.getX(t) + cp.getX(t + 1) + cp.getX(t + 2)) / 3, cy = (cp.getY(t) + cp.getY(t + 1) + cp.getY(t + 2)) / 3, cz = (cp.getZ(t) + cp.getZ(t + 1) + cp.getZ(t + 2)) / 3;
        const d = new T.Vector3(cx / CAVE.rx, cy / CAVE.ry, cz / CAVE.rz).normalize();
        if (d.dot(MOUTH) < 0.9) for (let k = 0; k < 3; k++) keep.push(cp.getX(t + k), cp.getY(t + k), cp.getZ(t + k));
      }
      cg = new T.BufferGeometry(); cg.setAttribute('position', new T.Float32BufferAttribute(keep, 3));
      // spherical UVs from position
      const uv = []; for (let i = 0; i < keep.length; i += 3) { uv.push(Math.atan2(keep[i], keep[i + 2]) / 6.283 + 0.5, keep[i + 1] / 3 + 0.5); }
      cg.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
      cg.computeVertexNormals();
      const cave = new T.Mesh(cg, rockMat); cave.position.y = CAVE.cy; S.add(cave);
      // boulders that thicken the lip of the mouth, outside
      const rimMat = KIT.std({ map: granite, color: 0x8a8078, flatShading: true, relief: 0.06 });
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * 6.283, r = 1.3 + Math.random() * 0.4;
        const b = new T.Mesh(new T.DodecahedronGeometry(0.7 + Math.random() * 0.6, 1), rimMat);
        b.position.set(Math.cos(a) * r * 1.4, CAVE.cy + 0.3 + Math.sin(a) * r * 0.9, -CAVE.rz - 0.2 - Math.random() * 0.6);
        b.rotation.set(Math.random() * 3, Math.random() * 3, 0); S.add(b);
      }
      // floor of grit
      const floor = new T.Mesh(new T.CircleGeometry(1, 40), KIT.std({ map: KIT.sand(w, [3, 3]), color: 0x8a7a6a, relief: 0.06 }));
      floor.rotation.x = -Math.PI / 2; floor.scale.set(CAVE.rx * 1.05, CAVE.rz * 1.05, 1); S.add(floor);
      for (let i = 0; i < 30; i++) {
        const s = 0.05 + Math.random() * 0.18, st = new T.Mesh(new T.DodecahedronGeometry(s, 0), rimMat);
        st.position.set((Math.random() - 0.5) * CAVE.rx * 1.6, s * 0.4, (Math.random() - 0.5) * CAVE.rz * 1.6); S.add(st);
      }

      // the mountain falling away outside, ranges beyond, and Makkah's few fires far below
      const mg = new T.PlaneGeometry(400, 400, 120, 120); mg.rotateX(-Math.PI / 2);
      const mp = mg.attributes.position;
      for (let i = 0; i < mp.count; i++) {
        const x = mp.getX(i), z = mp.getZ(i) - 200;
        const drop = Math.max(0, -z - CAVE.rz - 2) * 0.55;
        const far = U.smooth(6, 40, -z);
        mp.setXYZ(i, x, -1.6 - drop - Math.abs(x) * 0.08 + (U.fbm1(x * 0.03 + z * 0.02, 4) * 6 + U.noise2(x * 0.1, z * 0.1) * 1.5) * far, z);
      }
      mg.computeVertexNormals();
      S.add(new T.Mesh(mg, KIT.std({ map: granite, color: 0x6a6058, relief: 0 })));
      const rangeMat = KIT.std({ color: 0x1c2030, flatShading: true });
      for (let i = 0; i < 9; i++) { const c = new T.Mesh(new T.ConeGeometry(60 + Math.random() * 60, 50 + Math.random() * 60, 6), rangeMat); c.position.set(-300 + i * 75, -150, -380 - Math.random() * 120); S.add(c); }
      const fires = new T.Group();
      for (let i = 0; i < 40; i++) { const f = KIT.glow(w, 0xffa860, 2 + Math.random() * 3, 0.7); f.position.set((Math.random() - 0.5) * 260, -130 - Math.random() * 10, -300 - Math.random() * 60); f.material.fog = false; fires.add(f); }
      S.add(fires);

      // the web across the upper mouth, and the nest on a ledge
      const webGeo = new T.BufferGeometry(), wp = [];
      const wc = new T.Vector3(0.55, CAVE.cy + 0.75, -CAVE.rz + 0.35);
      for (let k = 0; k < 14; k++) { const a = (k / 14) * 6.283; wp.push(wc.x, wc.y, wc.z, wc.x + Math.cos(a) * 0.75, wc.y + Math.sin(a) * 0.6, wc.z); }
      for (let ring = 1; ring < 9; ring++) for (let k = 0; k < 14; k++) {
        const a0 = (k / 14) * 6.283, a1 = ((k + 1) / 14) * 6.283, r = ring * 0.085;
        wp.push(wc.x + Math.cos(a0) * r, wc.y + Math.sin(a0) * r * 0.8, wc.z, wc.x + Math.cos(a1) * r, wc.y + Math.sin(a1) * r * 0.8, wc.z);
      }
      webGeo.setAttribute('position', new T.Float32BufferAttribute(wp, 3));
      this.webMat = new T.LineBasicMaterial({ color: 0xdde6ff, transparent: true, opacity: 0.22, blending: T.AdditiveBlending, depthWrite: false });
      S.add(new T.LineSegments(webGeo, this.webMat));
      const nestPos = new T.Vector3(-1.15, CAVE.cy + 0.25, -CAVE.rz + 0.55);
      const nest = new T.Mesh(new T.TorusGeometry(0.16, 0.07, 6, 14), KIT.std({ color: 0x6a5238 })); nest.rotation.x = Math.PI / 2; nest.position.copy(nestPos); S.add(nest);
      [-0.07, 0.07].forEach(dx => { const egg = new T.Mesh(new T.SphereGeometry(0.045, 10, 8), KIT.std({ color: 0xf0ece0 })); egg.scale.y = 1.3; egg.position.set(nestPos.x + dx, nestPos.y + 0.02, nestPos.z); S.add(egg); });

      // torchlight of the search party, used in the passing
      this.torch = new T.PointLight(0xff8a3a, 0, 12, 2); this.torch.position.set(4, CAVE.cy + 1, -CAVE.rz - 3); S.add(this.torch);
      this.torchGlow = KIT.glow(w, 0xff9a50, 2.4, 0); this.torchGlow.position.copy(this.torch.position); S.add(this.torchGlow);
      this.grit = KIT.dust(w, 60, [-1, 0.2, -CAVE.rz, 1, CAVE.cy + 1.2, -CAVE.rz + 0.6], 0xb8a890, 0.03); this.grit.material.blending = T.NormalBlending; this.grit.material.opacity = 0; S.add(this.grit);
      this.dust = KIT.dust(w, 160, [-2, 0.2, -CAVE.rz, 2, 2.2, CAVE.rz], 0xc8d4ff, 0.018); S.add(this.dust);

      w.followShadow(moon, 8, 1024); w.receiveAll();
      this.baked = w.bake();

      /* ---------- the moments ---------- */
      this.found = new Set(); this.pass = -1;
      const progress = () => { w.count(`${self.found.size} / 3`); if (self.found.size >= 2 && self.pass < 0) self.pass = 0; };
      w.count('0 / 3');
      w.interact({
        key: 'mouth', pos: [0, CAVE.cy + 0.4, -CAVE.rz], r: 2.4, once: true, label: 'Look out from the cave',
        onUse: () => {
          SND.glow(env.bus, 110, { gain: 0.05, dur: 9, vowel: 'o' });
          w.say('The Second of Two', 'Below lie the dark valleys around Makkah. The Qur’an remembers this night: <span class="q">“the second of two, when they were in the cave, and he said to his companion, ‘Do not grieve; God is with us.’”</span> (Qur’an 9:40)', { ar: 'ثَانِيَ اثْنَيْنِ إِذْ هُمَا فِي الْغَارِ إِذْ يَقُولُ لِصَاحِبِهِ لَا تَحْزَنْ إِنَّ اللَّهَ مَعَنَا', ms: 15000 });
          self.found.add('mouth'); progress();
        },
      });
      w.interact({
        key: 'web', pos: wc, r: 2.4, once: true, label: 'Look at the web',
        onUse: () => {
          self.webGlint = 1;
          SND.bell(env.bus, 880, { gain: 0.03, glass: true, vowel: 'u' });
          w.say('The Web', 'Later tradition tells that a spider spun its web across the mouth of the cave, so that anyone who came would think no one had entered for a long time. The thread of the story is slender, but it has been told in Madinah and Makkah for fourteen centuries.', { ms: 12000 });
          self.found.add('web'); progress();
        },
      });
      w.interact({
        key: 'nest', pos: nestPos, r: 2.2, once: true, label: 'Look at the nest',
        onUse: () => {
          SND.coo(env.bus, { gain: 0.05, pan: -0.4 }); SND.coo(env.bus, { gain: 0.04, pan: -0.3, delay: 1.8 });
          w.say('The Doves', 'The same tradition tells of a pair of wild doves that settled on a ledge at the entrance. Doves still nest on the ledges of the Prophet’s Mosque in Madinah, by the thousand.', { ms: 10000 });
          self.found.add('nest'); progress();
        },
      });

      const b = env.bus;
      this.wind = SND.noise(b, { color: 'pink', type: 'bandpass', freq: 300, q: 2.5, gain: 0.06 });
      SND.lfo(b, this.wind.gain && this.wind.gain.gain, 0.07, 0.04);
      this.hollow = SND.noise(b, { color: 'brown', type: 'bandpass', freq: 120, q: 4, gain: 0.1 });
      this.cricketClock = 1; this.passT = 0;
    },

    update(env, dt) {
      const w = this.w; if (!w) return;
      w.update(dt);
      const t = w.time;
      KIT.driftDust(this.dust, dt, t, [0.01, -0.01]);
      this.webGlint = Math.max(0, (this.webGlint || 0) - dt * 0.25);
      this.webMat.opacity = 0.18 + 0.1 * Math.sin(t * 1.3) + this.webGlint * 0.6;
      this.cricketClock -= dt;
      if (this.cricketClock < 0) { this.cricketClock = 0.4 + Math.random() * 1.5; SND.cricket(env.bus, { gain: 0.004, pan: U.rnd(-0.5, 0.5) }); }

      // the search party passes the mouth of the cave
      if (this.pass >= 0 && this.pass < 1) {
        this.passT += dt;
        const k = this.passT / 26; this.pass = k;
        const near = Math.sin(Math.min(1, k) * Math.PI);
        const x = U.lerp(9, -9, k), z = -CAVE.rz - 2.2 - (1 - near) * 4;
        this.torch.position.set(x, CAVE.cy + 1.4, z); this.torchGlow.position.copy(this.torch.position);
        const fl = 0.75 + 0.25 * U.noise1(t * 9);
        this.torch.intensity = 3.2 * near * fl; this.torchGlow.material.opacity = 0.9 * near * fl;
        const pan = U.clamp(-x / 8, -1, 1);
        if (Math.random() < dt * 2.6 * (0.2 + near)) SND.step(env.bus, { gain: 0.05 + 0.2 * near, f: U.rnd(700, 1200), pan });
        if (Math.random() < dt * 0.9 * near) SND.sing(env.bus, U.rnd(105, 150), { vowel: U.pick(['a', 'o', 'e']), dur: U.rnd(0.35, 0.8), gain: 0.02 * near, pan, voices: 1, breath: 0.25, attack: 0.05, hold: 0.2, vib: 0.002 });
        if (near > 0.85 && !this.saidIt) {
          this.saidIt = true;
          this.grit.material.opacity = 0.8;
          for (let i = 0; i < 6; i++) SND.knock(env.bus, { f: U.rnd(500, 900), gain: 0.05, click: 5000, pan: U.rnd(-0.3, 0.3) });
          w.say('Two, and God the Third', 'Abu Bakr said: <span class="q">“If one of them looked down at his feet, he would see us.”</span> The Prophet ﷺ said: <span class="q">“What do you think, Abu Bakr, of two whose third is God?”</span> (Sahih al-Bukhari)', { ar: 'مَا ظَنُّكَ يَا أَبَا بَكْرٍ بِاثْنَيْنِ اللَّهُ ثَالِثُهُمَا', ms: 16000 });
        }
        if (this.grit.material.opacity > 0) { this.grit.material.opacity = Math.max(0, this.grit.material.opacity - dt * 0.2); const a = this.grit.geometry.attributes.position; for (let i = 0; i < a.count; i++) { let y = a.getY(i) - dt * 0.6; if (y < 0.1) y = CAVE.cy + 1.2; a.setY(i, y); } a.needsUpdate = true; }
        if (this.pass >= 1) {
          this.torch.intensity = 0; this.torchGlow.material.opacity = 0;
          SND.glow(env.bus, 130.81, { gain: 0.05, dur: 9 });
          SND.coo(env.bus, { gain: 0.04, delay: 2 });
          env.complete(); this.unlockSoon();
        }
      }
    },
  }));
})();
