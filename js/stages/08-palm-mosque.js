/* Station IV — The Mosque of Palm Trunks (walkable).
   The first Prophet's Mosque, about 1 AH: mud-brick walls on stone footings, a roof of palm
   fronds on palm-trunk pillars, and late sun falling through the fronds in coins of light.
   Four places to find: the weeping trunk, the minbar, the Suffah and the roof. */
(function () {
  'use strict';
  if (!window.WORLD) return;
  const HX = 15, HZ = 17.5, WALL_H = 2.6, WT = 0.6;

  ENGINE.register(WORLD.stage({
    key: 'palm-mosque',
    arabic: 'مَسْجِدُ الجُذُوع',
    title: 'The Mosque of Palm Trunks',
    era: 'The first Prophet’s Mosque · 1 AH · walk inside',
    hint: 'WASD to walk · click or drag to look · E to interact',
    sound: { reverb: 0.35 },
    story: `<p>On the ground where his camel knelt, the Prophet ﷺ and his companions built the first mosque of Madinah: walls of sun-dried brick on stone footings, palm trunks for pillars and palm fronds for a roof.</p>
            <p>Walk through it. Four places hold a story: the old palm trunk, the minbar, the Suffah and the roof. Look for the light, and press <b>E</b> when you are close.</p>`,

    shotDur: 11,
    // straight down through the gaps of the frond roof, along the hall, and out to the door
    shots() { return [[[-6, 34, -14], [-6, 0, -12.5]], [[-6, 6.5, -13], [0, 1.2, -6]], [[0, 3.2, 6], [0, 1.6, -12]], [[0, 2.4, 19], [0, 1.6, 0]], [[0, 0, 0], [0, 0, 0]]]; },

    enter(env) {
      const T = THREE;
      const w = this.w = WORLD.create(env, {
        start: { x: 0, z: 22, yaw: 0 }, shadows: true, exposure: 1.05,
        fog: { color: 0xe8c9a0, near: 30, far: 140 },
        bounds: [-60, -60, 60, 60],
        ground: (x, z) => (z > 12.2 && z < HZ - WT && Math.abs(x) < HX - WT ? 0.28 : 0),
        surface: (x, z) => (z > 12.2 && Math.abs(x) < HX ? 'stone' : 'sand'),
      });
      const S = w.scene;
      this.found = new Set(); this.rain = 0;

      w.sky({ top: '#6b8fbf', mid: '#f1cfa0', bot: '#c8a070', sunDir: [-0.55, 0.75, -0.3], sun: '#ffd9a0', sunSize: 0.0016 });
      S.add(new T.HemisphereLight(0xffe2b8, 0x8a6440, 0.55));
      const sun = new T.DirectionalLight(0xffd29a, 2.4);
      sun.position.set(-22, 30, -12); sun.target.position.set(0, 0, 0);
      sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
      Object.assign(sun.shadow.camera, { left: -26, right: 26, top: 26, bottom: -26, near: 1, far: 90 });
      sun.shadow.camera.updateProjectionMatrix();
      sun.shadow.bias = -0.0008; sun.shadow.normalBias = 0.03;
      S.add(sun, sun.target);

      // ground
      const sandTex = KIT.sand(w, [40, 40]);
      const ground = new T.Mesh(new T.PlaneGeometry(260, 260), KIT.std({ map: sandTex, color: 0xf0dcc0 }));
      ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; S.add(ground);

      // walls with three doorways (north, east, west)
      const brick = KIT.mudBrick(w, [1, 1]);
      const wallMat = KIT.std({ map: brick, color: 0xf0d8bc });
      const stoneMat = KIT.std({ map: KIT.basalt(w, [3, 1]), color: 0xe8e0d8 });
      const wall = (x0, z0, x1, z1) => {
        const lx = Math.abs(x1 - x0) || WT, lz = Math.abs(z1 - z0) || WT;
        const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
        const m = brick.clone(); m.needsUpdate = true; m.repeat.set(Math.max(lx, lz) / 4, WALL_H / 2.2);
        const mesh = new T.Mesh(new T.BoxGeometry(lx, WALL_H, lz), KIT.std({ map: m, color: 0xdcc4a4 }));
        mesh.position.set(cx, WALL_H / 2 + 0.4, cz); mesh.castShadow = mesh.receiveShadow = true; S.add(mesh);
        const foot = new T.Mesh(new T.BoxGeometry(lx + 0.12, 0.45, lz + 0.12), stoneMat);
        foot.position.set(cx, 0.22, cz); foot.receiveShadow = true; S.add(foot);
        w.addBox(cx - lx / 2, cz - lz / 2, cx + lx / 2, cz + lz / 2);
      };
      const D = 1.3; // half door width
      wall(-HX, -HZ, HX, -HZ);                                 // south (qibla) wall
      wall(-HX, HZ, -D, HZ); wall(D, HZ, HX, HZ);              // north wall with its door
      wall(-HX, -HZ, -HX, 2 - D); wall(-HX, 2 + D, -HX, HZ);  // west wall with a door
      wall(HX, -HZ, HX, -4 - D); wall(HX, -4 + D, HX, HZ);    // east wall with a door
      void wallMat;
      // lintels over doors
      [[0, HZ, 2 * D + 0.6, WT], [-HX, 2, WT, 2 * D + 0.6], [HX, -4, WT, 2 * D + 0.6]].forEach(([x, z, lx, lz]) => {
        const l = new T.Mesh(new T.BoxGeometry(lx, 0.25, lz), KIT.std({ map: KIT.wood(w), color: 0x9a7a58 }));
        l.position.set(x, WALL_H + 0.3, z); l.castShadow = true; S.add(l);
      });

      // palm-trunk pillars and the frond roofs (qibla side and the Suffah)
      const bark = KIT.bark(w);
      const trunkMat = KIT.std({ map: bark, color: 0xc8b096 });
      const roofTex = KIT.frondRoof(w, [5, 3]);
      const roofMat = KIT.std({ map: roofTex, alphaTest: 0.5, side: T.DoubleSide, color: 0xd8c8a0 });
      const roofDepth = new T.MeshDepthMaterial({ depthPacking: T.RGBADepthPacking, map: roofTex, alphaTest: 0.5, side: T.DoubleSide });
      const pillar = (x, z) => {
        const g = new T.CylinderGeometry(0.2, 0.24, WALL_H + 0.6, 10, 1, false);
        const m = new T.Mesh(g, trunkMat); m.position.set(x, (WALL_H + 0.6) / 2, z); m.castShadow = m.receiveShadow = true; S.add(m);
        w.addCircle(x, z, 0.24);
      };
      const roof = (x0, z0, x1, z1) => {
        const r = new T.Mesh(new T.PlaneGeometry(x1 - x0, z1 - z0), roofMat);
        r.rotation.x = -Math.PI / 2; r.position.set((x0 + x1) / 2, WALL_H + 0.6, (z0 + z1) / 2); r.castShadow = true; S.add(r);
        // a second, offset layer to thicken the thatch
        const r2 = r.clone(); r2.position.y += 0.12; r2.rotation.z = 0.08; S.add(r2);
        // shadows that honour the gaps between fronds, so the sun falls through in coins of light
        [r, r2].forEach(m => { m.customDepthMaterial = roofDepth; m.userData.dynamic = true; });
        // beams of split trunk
        for (let x = x0 + 2; x < x1; x += 4) {
          const b = new T.Mesh(new T.BoxGeometry(0.22, 0.2, z1 - z0), trunkMat); b.position.set(x, WALL_H + 0.5, (z0 + z1) / 2); b.castShadow = true; S.add(b);
        }
      };
      for (const z of [-15, -12.2, -9.4]) for (const x of [-12, -8, -4, 4, 8, 12]) pillar(x, z);
      roof(-HX, -HZ, HX, -8.2);
      for (const x of [-12, -8, -4, 0, 4, 8, 12]) pillar(x, 14.6);
      roof(-HX, 12.2, HX, HZ);
      // the Suffah: a low earthen platform under the northern shade
      const plat = new T.Mesh(new T.BoxGeometry(2 * HX - 2 * WT, 0.28, HZ - 12.2 - WT), KIT.std({ map: KIT.mudBrick(w, [6, 0.6]), color: 0xd8b890 }));
      plat.position.set(0, 0.14, (12.2 + HZ - WT) / 2); plat.receiveShadow = true; S.add(plat);
      // woven mats on the Suffah
      const matTex = w.tex(128, (g, s) => { g.fillStyle = '#b89a60'; g.fillRect(0, 0, s, s); for (let i = 0; i < s; i += 6) { g.fillStyle = i % 12 ? 'rgba(90,60,30,.25)' : 'rgba(255,230,180,.2)'; g.fillRect(0, i, s, 3); } }, [3, 1]);
      for (let i = 0; i < 6; i++) {
        const m = new T.Mesh(new T.PlaneGeometry(2.2, 1.2), KIT.std({ map: matTex }));
        m.rotation.x = -Math.PI / 2; m.rotation.z = (Math.random() - 0.5) * 0.2; m.position.set(-11 + i * 4.4, 0.29, 15.4); m.receiveShadow = true; S.add(m);
      }

      // the minbar of tamarisk: three steps and a seat
      const wood = KIT.std({ map: KIT.wood(w, [1, 1], '#6e4a2c'), color: 0xc09a70, roughness: 0.75 });
      const minbar = new T.Group(); minbar.position.set(2.6, 0, -15.4);
      for (let i = 0; i < 3; i++) { const st = new T.Mesh(new T.BoxGeometry(0.9, 0.32, 0.5), wood); st.position.set(0, 0.16 + i * 0.32, 0.9 - i * 0.5); st.castShadow = st.receiveShadow = true; minbar.add(st); }
      [-0.45, 0.45].forEach(x => { const r = new T.Mesh(new T.BoxGeometry(0.08, 1.5, 1.6), wood); r.position.set(x, 0.75, 0.4); r.castShadow = true; minbar.add(r); });
      const back = new T.Mesh(new T.BoxGeometry(0.9, 0.7, 0.08), wood); back.position.set(0, 1.25, -0.2); minbar.add(back);
      S.add(minbar); w.addBox(2.1, -15.8, 3.1, -14.1);

      // the palm trunk he once leaned on
      const stump = new T.Mesh(new T.CylinderGeometry(0.19, 0.23, 1.9, 10), trunkMat);
      stump.position.set(-0.9, 0.95, -15.6); stump.castShadow = true; S.add(stump); w.addCircle(-0.9, -15.6, 0.25);
      this.trunkGlow = KIT.glow(w, 0xffd9a0, 1.6, 0.0); this.trunkGlow.position.set(-0.9, 1.3, -15.6); S.add(this.trunkGlow);
      // a simple niche marking the qibla
      const niche = new T.Mesh(new T.PlaneGeometry(1.1, 2.0), KIT.std({ color: 0x5a3c26 }));
      niche.position.set(0, 1.4, -HZ + WT / 2 + 0.01); S.add(niche);

      // palms outside the walls, and the oasis beyond
      const r = U.seeded(41);
      for (let i = 0; i < 46; i++) {
        let x, z; do { x = (r() - 0.5) * 120; z = (r() - 0.5) * 120; } while (Math.abs(x) < HX + 3 && Math.abs(z) < HZ + 3);
        const p = KIT.palm(w, 6 + r() * 6); p.position.set(x, 0, z); S.add(p);
        w.addCircle(x, z, 0.35);
      }
      // low houses of the companions beyond the east wall
      const houseMat = KIT.std({ map: KIT.mudBrick(w, [2, 0.7]), color: 0xe8ccaa });
      for (let i = 0; i < 6; i++) {
        const hw = 3 + r() * 2, hd = 3 + r() * 2, hh = 2.4 + r() * 0.8, x = HX + 3 + hw / 2 + (i % 2) * 7, z = -14 + i * 5.5;
        const hm = new T.Mesh(new T.BoxGeometry(hw, hh, hd), houseMat); hm.position.set(x, hh / 2, z); hm.castShadow = hm.receiveShadow = true; S.add(hm);
        w.addBox(x - hw / 2, z - hd / 2, x + hw / 2, z + hd / 2);
      }

      // dust in the shafts of light
      this.dust = KIT.dust(w, 500, [-HX, 0.3, -HZ, HX, WALL_H + 0.4, -8], 0xffe6b0, 0.045); S.add(this.dust);
      this.dust2 = KIT.dust(w, 200, [-HX, 0.3, 12, HX, WALL_H + 0.4, HZ], 0xffe6b0, 0.045); S.add(this.dust2);

      // rain, used when you look up at the roof
      const rg = new T.BufferGeometry(), rp = new Float32Array(1600 * 3);
      for (let i = 0; i < 1600; i++) { rp[i * 3] = U.rnd(-HX, HX); rp[i * 3 + 1] = U.rnd(0, 12); rp[i * 3 + 2] = U.rnd(-HZ, HZ); }
      rg.setAttribute('position', new T.BufferAttribute(rp, 3));
      this.rainPts = new T.Points(rg, new T.PointsMaterial({ color: 0xcfd8e8, size: 0.05, transparent: true, opacity: 0, depthWrite: false }));
      this.rainPts.frustumCulled = false; S.add(this.rainPts);

      this.baked = w.bake();

      /* ---------- the four places ---------- */
      const self = this;
      const mark = key => { self.found.add(key); w.progress(self.found.size, 'Find the places that hold a story'); if (self.found.size === 4) w.finish('Four stories of the first mosque'); };
      w.activity('Four places', 4, 'Find the old palm trunk, the minbar, the Suffah, and look up at the roof');
      w.interact({
        key: 'trunk', pos: [-0.9, 1.3, -15.6], r: 2.8, once: true, label: 'Place your hand on the trunk',
        onUse: () => {
          self.soothed = 0.001;
          SND.glow(env.bus, 130.81, { gain: 0.05, dur: 8 }); SND.bell(env.bus, 523.25, { gain: 0.03, dur: 6, glass: true });
          w.say('The Weeping Trunk', 'He used to deliver the Friday sermon leaning on a palm trunk. When the minbar was made and he stood on it, the trunk cried out like a child, until he came down and held it, and it grew quiet. <span class="q">(Sahih al-Bukhari)</span>', { ar: 'فَصَاحَتِ النَّخْلَةُ صِيَاحَ الصَّبِيّ', ms: 14000 });
          mark('trunk');
        },
      });
      w.interact({
        key: 'minbar', pos: [2.6, 1.0, -15.0], r: 2.8, once: true, label: 'Look at the minbar',
        onUse: () => {
          [0, 0.35, 0.7].forEach((d, i) => setTimeout(() => SND.knock(env.bus, { f: 160 + i * 30, gain: 0.3, click: 900 }), d * 1000));
          w.say('The Minbar', 'A pulpit of tamarisk wood with three steps, made so that a growing congregation could see and hear him. The minbar of the Prophet’s Mosque still stands near this place today, rebuilt many times.', { ms: 11000 });
          mark('minbar');
        },
      });
      w.interact({
        key: 'suffah', pos: [0, 0.9, 15.2], r: 4.2, once: true, label: 'Sit in the shade of the Suffah',
        onUse: () => {
          SND.glow(env.bus, 196, { gain: 0.04, dur: 6 }); SND.coo(env.bus, { gain: 0.05, delay: 0.6 });
          w.say('The People of the Suffah', 'This shaded platform was home to companions who had no house or family in the city. They were fed by the Prophet ﷺ and the community, and spent their days learning. Abu Hurayrah, who narrated more hadith than anyone, was one of them.', { ms: 12000 });
          mark('suffah');
        },
      });
      w.interact({
        key: 'roof', pos: [-6, WALL_H + 0.6, -12], r: 7, once: true, label: 'Look up at the roof',
        enabled: () => w.pos.z < -8.6 && w.pitch > 0.35,
        onUse: () => {
          self.rain = 9;
          w.say('A Roof of Fronds', 'The roof was palm fronds laid over trunks. When it rained, water came through and the floor turned to mud; companions saw the mark of mud and water on his forehead after the prayer. <span class="q">(Sahih al-Bukhari)</span>', { ms: 12000 });
          mark('roof');
        },
      });

      /* ---------- sound ---------- */
      const b = env.bus;
      this.breeze = SND.noise(b, { color: 'pink', type: 'bandpass', freq: 500, q: 0.6, gain: 0.04 });
      this.leaves = SND.noise(b, { color: 'white', type: 'bandpass', freq: 5200, q: 0.8, gain: 0.006 });
      SND.lfo(b, this.leaves.gain && this.leaves.gain.gain, 0.13, 0.005);
      this.rainN = SND.noise(b, { color: 'white', type: 'bandpass', freq: 3000, q: 0.4, gain: 0 });
      this.birdClock = 1; this.sobClock = 2; this.soothed = 0;
    },

    // a soft, child-like sob from the trunk (a falling, wavering tone)
    sob(env, gain, pan) {
      const A = SND; if (!A.ctx) return;
      const ctx = A.ctx, t = A.now();
      const o = ctx.createOscillator(), vib = ctx.createOscillator(), vg = ctx.createGain(), lp = ctx.createBiquadFilter(), g = ctx.createGain(), p = ctx.createStereoPanner();
      o.type = 'triangle';
      const f = 300 + Math.random() * 60;
      o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * 0.62, t + 0.9);
      vib.frequency.value = 6.5; vg.gain.value = 9; vib.connect(vg); vg.connect(o.frequency);
      lp.type = 'lowpass'; lp.frequency.value = 900;
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(gain, t + 0.12); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.0);
      p.pan.value = pan;
      o.connect(lp); lp.connect(g); g.connect(p); p.connect(env.bus.input || A.master);
      o.start(t); vib.start(t); o.stop(t + 1.1); vib.stop(t + 1.1);
    },

    update(env, dt) {
      const w = this.w; if (!w) return;
      w.update(dt);
      const t = w.time;
      KIT.driftDust(this.dust, dt, t, [0.06, 0.02]);
      KIT.driftDust(this.dust2, dt, t, [0.06, 0.02]);

      // the trunk weeps until it is held
      const sp = w.spatial({ x: -0.9, z: -15.6 }, 7);
      if (this.soothed > 0) this.soothed = Math.min(1, this.soothed + dt * 0.25);
      this.sobClock -= dt;
      if (this.sobClock < 0 && this.soothed < 0.9) {
        this.sobClock = 1.6 + Math.random() * 2.2;
        this.sob(env, 0.07 * sp.gain * (1 - this.soothed), sp.pan);
      }
      this.trunkGlow.material.opacity = U.lerp(0.25 + 0.15 * Math.sin(t * 2), 0.7, this.soothed) * (sp.dist < 12 ? 1 : 0.5);

      // passing rain
      if (this.rain > 0) {
        this.rain -= dt;
        const a = this.rainPts.geometry.attributes.position;
        for (let i = 0; i < a.count; i++) { let y = a.getY(i) - dt * 9; if (y < 0) { y = 12; } a.setY(i, y); }
        a.needsUpdate = true;
        const k = U.clamp(Math.min(this.rain, 9 - this.rain) / 2);
        this.rainPts.material.opacity = 0.55 * k;
        this.rainN.set('gain', 0.07 * k, 0.3);
        if (Math.random() < dt * 14 * k) SND.drop(env.bus, { f: U.rnd(700, 1600), gain: 0.03 * k, pan: U.rnd(-0.8, 0.8) });
      } else { this.rainPts.material.opacity = 0; this.rainN.set('gain', 0, 0.5); }

      this.birdClock -= dt;
      if (this.birdClock < 0) { this.birdClock = 1.5 + Math.random() * 4; Math.random() < 0.4 ? SND.coo(env.bus, { gain: 0.035 }) : SND.chirp(env.bus, { gain: 0.018 }); }
    },
  }));
})();
