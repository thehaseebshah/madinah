/* Makkah — The Call from as-Safa (walkable), c. 613 CE.
   The blue hour before sunrise on the low rock of as-Safa, the Ka'bah below in the valley. When the
   morning alarm is raised, lights come out of the houses of Quraysh and gather at the foot of the
   hill, and the exchange recorded by Ibn 'Abbas unfolds. No person is depicted: only lights and voices. */
(function () {
  'use strict';
  if (!window.WORLD) return;
  const KX = -70, KZ = -75; // the Ka'bah, north-west of as-Safa

  ENGINE.register(WORLD.stage({
    key: 'safa',
    arabic: 'الصَّفَا',
    title: 'The Call from as-Safa',
    era: 'Makkah · c. 613 CE · the first public call',
    hint: 'WASD to walk · E on the summit to raise the morning call',
    sound: { reverb: 0.55 },
    story: `<p>For about three years the message was shared quietly. Then came the verse <i>“And warn your nearest kin”</i> (Qur’an 26:214). He climbed the hill of as-Safa, beside the Ka‘bah, and gave the cry used to warn of a dawn raid, until the clans of Quraysh gathered below.</p>
            <p>This station follows the account of Ibn ‘Abbas in Sahih al-Bukhari.</p>`,

    enter(env) {
      const T = THREE, self = this;
      const w = this.w = WORLD.create(env, {
        start: { x: 0.5, z: 0.5, yaw: 0.75, pitch: -0.2 }, exposure: 1.45, far: 1600,
        fog: { color: 0x4a5078, density: 0.0028 }, bounds: [-70, -70, 40, 40],
      });
      const S = w.scene;
      const sunDir = new T.Vector3(0.85, -0.04, 0.3).normalize();
      w.sky({ top: '#121a3c', mid: '#5a5a88', bot: '#1a1a2a', sunDir: sunDir.toArray(), sun: '#ff9a6a', sunSize: 0.004, stars: 0.5 });
      S.add(new T.HemisphereLight(0x9aa6e0, 0x5a4a40, 1.0));
      const dawn = new T.DirectionalLight(0xffc0a0, 1.0); dawn.position.set(80, 20, 30); S.add(dawn);

      const vg = KIT.makkahValley(w, { kx: KX, kz: KZ, floor: 150, clear: 26, houses: 110, seed: 613, avoid: (x, z) => Math.hypot(x, z) < 22 });
      // the low rock of as-Safa
      const ground = (x, z) => vg(x, z) + 6.5 * Math.exp(-(x * x + z * z) / (2 * 7 * 7)) + U.noise2(x * 0.4, z * 0.4) * 0.2 * Math.exp(-(x * x + z * z) / 200);
      w.ground = ground; w.surface = (x, z) => (Math.hypot(x, z) < 14 ? 'gravel' : 'sand');
      const rockMat = KIT.std({ map: KIT.basalt(w, [1, 1]), color: 0xc8b8a8, flatShading: true });
      const hg = new T.PlaneGeometry(40, 40, 80, 80); hg.rotateX(-Math.PI / 2);
      const hp = hg.attributes.position; for (let i = 0; i < hp.count; i++) hp.setY(i, ground(hp.getX(i), hp.getZ(i)) + 0.03);
      hg.computeVertexNormals();
      const hillMesh = new T.Mesh(hg, KIT.std({ map: KIT.sand(w, [8, 8]), color: 0xa89888, relief: 0.06 }));
      S.add(hillMesh);
      const r = U.seeded(26214);
      for (let i = 0; i < 30; i++) { const a = r() * 6.283, d = 2 + r() * 10, s = 0.3 + r() * 1.1, x = Math.cos(a) * d, z = Math.sin(a) * d; const b = new T.Mesh(new T.DodecahedronGeometry(s, 0), rockMat); b.position.set(x, ground(x, z) + s * 0.2, z); b.rotation.set(r() * 3, r() * 3, 0); S.add(b); }

      // the Ka'bah in the valley below, draped as it was in that age
      const k = KIT.kabah(w, { built: 1, height: 9, cloth: 0x1a1a1a }); k.position.set(KX, vg(KX, KZ), KZ); k.rotation.y = 0.5; S.add(k);
      const kGlow = KIT.glow(w, 0xffd8a0, 18, 0.18); kGlow.position.set(KX, vg(KX, KZ) + 5, KZ); S.add(kGlow);
      // Abu Qubays rising behind as-Safa
      const aq = new T.Mesh(new T.ConeGeometry(70, 60, 7), KIT.std({ map: KIT.basalt(w, [6, 4]), color: 0x8a7a70, flatShading: true }));
      aq.position.set(60, vg(60, -10) + 20, -10); S.add(aq);

      // the lights of the clans, waiting in the houses
      this.walkers = [];
      const n = 160, pos = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) {
        const a = r() * 6.283, d = 40 + r() * 110, sx = KX + Math.cos(a) * d * 0.9, sz = KZ + Math.sin(a) * d;
        const ea = Math.PI * 1.1 + (r() - 0.5) * 2.2, ed = 15 + r() * 12;
        this.walkers.push({ sx, sz, ex: Math.cos(ea) * ed, ez: Math.sin(ea) * ed, delay: r() * 9, speed: 0.05 + r() * 0.04, k: 0 });
        pos.set([sx, vg(sx, sz) + 1, sz], i * 3);
      }
      const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.BufferAttribute(pos, 3));
      this.lights = new T.Points(geo, new T.PointsMaterial({ map: KIT.glowTex(w), color: 0xffb060, size: 1.1, transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending }));
      this.lights.frustumCulled = false; S.add(this.lights);

      w.receiveAll();
      this.baked = w.bake();

      /* ---------- the moment ---------- */
      this.phase = 'wait'; this.t = 0;
      w.interact({ key: 'call', pos: [0, ground(0, 0) + 1.2, 0], r: 3.6, once: true, label: 'Raise the morning call', onUse: () => {
        self.phase = 'call'; self.t = 0;
        // the old alarm of the dawn raid, sung wide over the valley and echoing from the mountains
        SND.sing(env.bus, 196, { vowel: 'a', dur: 2.6, gain: 0.09, voices: 3, attack: 0.15, hold: 0.6, breath: 0.12, glide: 0.92 });
        for (let k = 1; k <= 4; k++) SND.sing(env.bus, 196, { vowel: 'a', dur: 2.4, gain: 0.05 * Math.pow(0.55, k), delay: k * 0.7, voices: 2, attack: 0.2, hold: 0.5, pan: k % 2 ? -0.6 : 0.6 });
        w.say('Ya Sabahah!', 'He called out the cry raised at dawn when raiders were seen, and the clans of Quraysh came out to him, and anyone who could not come sent someone to find out what was happening. (Sahih al-Bukhari, from Ibn ‘Abbas)', { ar: 'يَا صَبَاحَاه', ms: 12000 });
      } });

      const b = env.bus;
      this.air = SND.noise(b, { color: 'pink', type: 'bandpass', freq: 380, q: 0.6, gain: 0.04 });
      this.crowd = SND.noise(b, { color: 'pink', type: 'bandpass', freq: 440, q: 1.3, gain: 0 });
      SND.lfo(b, this.crowd.filter && this.crowd.filter.frequency, 0.35, 90);
      this.birdClock = 3; this.voiceClock = 1;
    },

    update(env, dt) {
      const w = this.w; if (!w) return;
      w.update(dt);
      const T0 = this.t, T1 = (this.t += dt), cross = s => T0 < s && T1 >= s;
      if (this.phase === 'call' || this.phase === 'done') {
        // lights leave the houses and climb toward the foot of the hill
        const p = this.lights.geometry.attributes.position;
        let arrived = 0;
        this.walkers.forEach((q, i) => {
          if (T1 < q.delay + 1) return;
          q.k = Math.min(1, q.k + dt * q.speed);
          const k = U.ease(q.k), x = U.lerp(q.sx, q.ex, k), z = U.lerp(q.sz, q.ez, k);
          p.setXYZ(i, x, this.w.ground(x, z) + 1.1, z);
          if (q.k > 0.95) arrived++;
        });
        p.needsUpdate = true;
        this.lights.material.opacity = U.smooth(0.5, 3, T1) * 0.95;
        const gathered = arrived / this.walkers.length;
        this.crowd.set('gain', 0.02 + 0.08 * U.smooth(0, 0.4, gathered) * (this.phase === 'done' ? 0.6 : 1), 0.6);
        this.voiceClock -= dt * (0.6 + gathered * 3);
        if (this.voiceClock < 0) { this.voiceClock = 0.5 + Math.random(); SND.sing(env.bus, U.rnd(100, 160), { vowel: U.pick(['a', 'o', 'e']), dur: U.rnd(0.3, 0.7), gain: 0.02 * (0.3 + gathered), pan: U.rnd(-0.8, 0.8), voices: 1, breath: 0.3, attack: 0.04, hold: 0.25, vib: 0.002 }); }
        if (cross(20)) w.say('Would You Believe Me?', 'When they had gathered he said: <span class="q">“If I told you that horsemen were in the valley behind this hill, about to attack you, would you believe me?”</span> They said: <span class="q">“Yes. We have never known you to lie.”</span>', { ms: 13000 });
        if (cross(34)) { SND.glow(env.bus, 130.81, { gain: 0.06, dur: 9 }); w.say('A Warner', '<span class="q">“Then I am a warner to you, before a severe punishment.”</span> It was the first time the message was spoken openly to all of Quraysh.', { ms: 11000 }); }
        if (cross(46)) {
          this.phase = 'done';
          w.say('Perish the Hands of Abu Lahab', 'His uncle Abu Lahab said, <span class="q">“May you perish! Is this what you gathered us for?”</span> Then Surat al-Masad was revealed: <span class="q">“Perish the hands of Abu Lahab, and perish he.”</span> (Qur’an 111:1; Sahih al-Bukhari)', { ar: 'تَبَّتْ يَدَا أَبِي لَهَبٍ وَتَبَّ', ms: 15000 });
          env.complete(); this.unlockSoon();
        }
      }
      this.birdClock -= dt;
      if (this.birdClock < 0) { this.birdClock = 3 + Math.random() * 5; SND.chirp(env.bus, { gain: 0.012 }); }
    },
  }));
})();
