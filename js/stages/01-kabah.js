/* Makkah — The Ka'bah Rebuilt (walkable), c. 605 CE.
   The walls of the Ka'bah rise in courses of stone and timber. You carry stones with the people of
   Makkah; then the clans quarrel over who will set the Black Stone, agree to let the next man through
   the gate of Banu Shaybah decide, and the stone is lifted on a cloak by every clan together.
   The clans appear only as banners and voices; no person is depicted. */
(function () {
  'use strict';
  if (!window.WORLD) return;
  const W = 11, D = 12.5, H = 9;
  const PILE = { x: 16, z: 9 }, DROP = { x: W / 2 + 1.6, z: 1 }, GATE = { x: 0, z: -30 }, CORNER = { x: W / 2, z: D / 2 };
  const CLOAK = { x: W / 2 + 4.5, z: D / 2 + 4.5 };

  ENGINE.register(WORLD.stage({
    key: 'kabah',
    arabic: 'بِنَاءُ الكَعْبَة',
    title: 'The Ka‘bah Rebuilt',
    era: 'Makkah · c. 605 CE · five years before the first revelation',
    hint: 'WASD to walk · E to lift and place a stone · then walk through the gate',
    sound: { reverb: 0.4 },
    story: `<p>When Muhammad was about thirty-five, Quraysh pulled down the flood-damaged Ka‘bah and rebuilt it in courses of stone and timber. He carried stones for it alongside his uncle al-‘Abbas.</p>
            <p>When the walls reached the place of the Black Stone, each clan wanted the honour of setting it, and the quarrel came close to bloodshed. They agreed that the next man to enter would judge. It was Muhammad, whom they already called <i>al-Amin</i>, the trustworthy.</p>`,

    shotDur: 10.5,
    // a high crane over the valley, spiralling down onto the scaffolding
    shots() { return [[[0, 95, 130], [0, 4, 0]], [[-90, 55, 45], [0, 4, 0]], [[-38, 22, -34], [0, 5, 0]], [[26, 9, 6], [0, 3.5, 0]], [[20, 2, 20], [0, 2, 0]]]; },

    enter(env) {
      const T = THREE, self = this;
      const w = this.w = WORLD.create(env, {
        start: { x: 20, z: 20, yaw: 0.75 }, exposure: 1.05, far: 1400,
        fog: { color: 0xe8c8a0, density: 0.004 }, bounds: [-70, -60, 70, 60],
      });
      const S = w.scene;
      const sunDir = new T.Vector3(-0.55, 0.62, 0.45).normalize();
      w.sky({ top: '#5a86c0', mid: '#f0d2a8', bot: '#c8a070', sunDir: sunDir.toArray(), sun: '#ffd8a0', sunSize: 0.0016 });
      S.add(new T.HemisphereLight(0xffe2c0, 0x8a6a4a, 0.6));
      const sun = new T.DirectionalLight(0xffd8a8, 2.2); sun.position.copy(sunDir).multiplyScalar(60); S.add(sun);

      const ground = KIT.makkahValley(w, { kx: 0, kz: 0, floor: 130, clear: 32, avoid: (x, z) => Math.abs(x - GATE.x) < 8 && z < -24 && z > -40 });
      w.ground = ground;
      w.surface = () => 'sand';

      // the Ka'bah, half-built, with scaffolding of palm trunks and planks
      this.built = 0.52;
      this.kabahGroup = new T.Group(); this.kabahGroup.userData.dynamic = true; S.add(this.kabahGroup);
      this.rebuildKabah(w);
      w.addBox(-W / 2 - 0.4, -D / 2 - 0.4, W / 2 + 0.4, D / 2 + 0.4);
      const pole = KIT.std({ map: KIT.bark(w), color: 0xb09878 }), plank = KIT.std({ map: KIT.wood(w, [3, 1], '#7a5838'), color: 0xc8a888 });
      for (const [x, z] of [[-W / 2 - 1, -D / 2 - 1], [W / 2 + 1, -D / 2 - 1], [-W / 2 - 1, D / 2 + 1], [W / 2 + 1, D / 2 + 1], [0, -D / 2 - 1], [0, D / 2 + 1], [-W / 2 - 1, 0], [W / 2 + 1, 0]]) {
        const p = new T.Mesh(new T.CylinderGeometry(0.12, 0.15, 9.5, 8), pole); p.position.set(x, 4.75, z); S.add(p);
      }
      [3.2, 6.2].forEach(y => {
        [[0, -D / 2 - 1.1, W + 2.6, 0.9], [0, D / 2 + 1.1, W + 2.6, 0.9]].forEach(([x, z, lx, lz]) => { const b = new T.Mesh(new T.BoxGeometry(lx, 0.12, lz), plank); b.position.set(x, y, z); S.add(b); });
        [[-W / 2 - 1.1, 0], [W / 2 + 1.1, 0]].forEach(([x, z]) => { const b = new T.Mesh(new T.BoxGeometry(0.9, 0.12, D + 2.6), plank); b.position.set(x, y, z); S.add(b); });
      });

      // the stone pile and the place to set stones
      const granite = KIT.std({ map: KIT.basalt(w, [1, 1]), color: 0xc0b8b0, flatShading: true });
      this.stoneGeo = new T.BoxGeometry(0.9, 0.45, 0.55);
      const r = U.seeded(605);
      for (let i = 0; i < 26; i++) { const b = new T.Mesh(this.stoneGeo, granite); b.position.set(PILE.x + (r() - 0.5) * 3.5, 0.25 + Math.floor(i / 9) * 0.42, PILE.z + (r() - 0.5) * 3); b.rotation.y = r() * 3; S.add(b); }
      w.addCircle(PILE.x, PILE.z, 2.2);
      this.granite = granite;
      this.dropMark = KIT.glow(w, 0xffd890, 2.4, 0); this.dropMark.position.set(DROP.x, 0.4, DROP.z); S.add(this.dropMark);

      // the gate of Banu Shaybah
      const gateMat = KIT.std({ map: KIT.mudBrick(w, [1, 1]), color: 0xd8c0a0 });
      [-2.4, 2.4].forEach(dx => { const p = new T.Mesh(new T.BoxGeometry(1.2, 4.6, 1.2), gateMat); p.position.set(GATE.x + dx, 2.3, GATE.z); S.add(p); w.addBox(GATE.x + dx - 0.6, GATE.z - 0.6, GATE.x + dx + 0.6, GATE.z + 0.6); });
      const lintel = new T.Mesh(new T.BoxGeometry(6, 0.9, 1.3), gateMat); lintel.position.set(GATE.x, 5, GATE.z); S.add(lintel);
      this.gateGlow = KIT.glow(w, 0xffe0a0, 7, 0); this.gateGlow.position.set(GATE.x, 2.2, GATE.z); S.add(this.gateGlow);

      // the Black Stone on its cloak, and the four clans' banners
      const cloakTex = w.tex(256, (g, s) => { g.fillStyle = '#7a1e18'; g.fillRect(0, 0, s, s); for (let i = 0; i < s; i += 22) { g.fillStyle = i % 44 ? '#d8b060' : '#2a3a5a'; g.fillRect(0, i, s, 6); } });
      this.cloak = new T.Mesh(new T.PlaneGeometry(2.6, 2.6, 8, 8), KIT.std({ map: cloakTex, side: T.DoubleSide, roughness: 1 }));
      this.cloak.rotation.x = -Math.PI / 2; this.cloak.userData.dynamic = true;
      this.cloakRig = new T.Group(); this.cloakRig.position.set(CLOAK.x, 0.06, CLOAK.z); this.cloakRig.userData.dynamic = true; this.cloakRig.add(this.cloak); S.add(this.cloakRig);
      const bsGeo = new T.SphereGeometry(0.32, 24, 16); bsGeo.scale(1.15, 0.8, 1);
      this.stone = new T.Mesh(bsGeo, KIT.std({ color: 0x1a1414, roughness: 0.35, metalness: 0.1 })); this.stone.position.y = 0.26; this.stone.userData.dynamic = true; this.cloakRig.add(this.stone);
      this.stoneGlow = KIT.glow(w, 0xfff0d0, 2, 0.15); this.stoneGlow.position.y = 0.4; this.cloakRig.add(this.stoneGlow);
      const clanCols = [0x9a2a22, 0x2a5a8a, 0x3a7a3a, 0xc89a38];
      this.banners = clanCols.map((c, i) => {
        const a = (i / 4) * 6.283 + 0.785, x = CLOAK.x + Math.cos(a) * 4.2, z = CLOAK.z + Math.sin(a) * 4.2;
        const p = new T.Mesh(new T.CylinderGeometry(0.06, 0.08, 4.5, 6), pole); p.position.set(x, 2.25, z); S.add(p);
        const cl = new T.Mesh(new T.PlaneGeometry(1.4, 0.9, 6, 2), KIT.std({ color: c, side: T.DoubleSide, roughness: 1 })); cl.position.set(x + 0.72, 3.9, z); cl.userData.dynamic = true; S.add(cl);
        w.addCircle(x, z, 0.3);
        return { x, z, cl, base: cl.geometry.attributes.position.array.slice() };
      });

      // dust in the sun
      this.dust = KIT.dust(w, 260, [-25, 0.2, -25, 25, 8, 25], 0xffe8c0, 0.05); S.add(this.dust);

      w.followShadow(sun, 34); w.receiveAll();
      this.baked = w.bake();

      // carrying
      this.carried = new T.Mesh(this.stoneGeo, granite); this.carried.visible = false; this.carried.userData.dynamic = true;
      S.add(w.camera); w.camera.add(this.carried); this.carried.position.set(0.15, -0.55, -0.9); this.carried.rotation.set(0.2, 0.3, 0);
      this.carrying = false; this.placed = 0; this.phase = 'build'; this.flying = [];

      /* ---------- the moments ---------- */
      w.activity('Rebuild the House', 5, 'Carry a stone from the pile to the glowing place by the wall');
      w.interact({ key: 'pile', pos: [PILE.x, 0.8, PILE.z], r: 3.6, label: 'Lift a stone', enabled: () => !self.carrying && self.phase === 'build', onUse: () => {
        self.carrying = true; self.carried.visible = true; w.speed = 2.2; w.run = 3;
        SND.knock(env.bus, { f: 110, gain: 0.3, click: 1600 }); SND.step(env.bus, { gain: 0.2, f: 900 });
        if (self.placed === 0) w.say('Stones for the House', 'The Prophet ﷺ carried stones for the Ka‘bah alongside his uncle al-‘Abbas, as the people of Makkah did. (Sahih al-Bukhari)', { ms: 9000 });
      } });
      w.interact({ key: 'drop', pos: [DROP.x, 1.2, DROP.z], r: 3.2, label: 'Set the stone on the wall', enabled: () => self.carrying, onUse: () => {
        self.carrying = false; self.carried.visible = false; w.speed = 3; w.run = 5.6;
        const m = new T.Mesh(self.stoneGeo, self.granite); m.userData.dynamic = true;
        const from = w.camera.localToWorld(new T.Vector3(0.15, -0.55, -0.9));
        m.position.copy(from); S.add(m);
        self.flying.push({ m, from, to: new T.Vector3(W / 2 - 0.3, H * self.built + 0.2, (self.placed - 1) * 1.6), t: 0 });
        self.placed++; w.progress(self.placed, self.placed < 3 ? 'Carry another stone to the wall' : 'The clans are quarrelling over the Black Stone');
        if (self.placed >= 3) {
          self.phase = 'dispute';
          setTimeout(() => {
            w.say('The Black Stone', 'The walls have reached the place of the Black Stone, and every clan wants the honour of setting it. Some swear on blood. At last they agree: the next man to come through the gate of Banu Shaybah will decide between them.', { ms: 12000 });
            env.hint('Walk through the gate of Banu Shaybah'); w.step('Walk through the gate of Banu Shaybah, to the north');
          }, 1600);
        }
      } });
      w.interact({ key: 'cloak', pos: [CLOAK.x, 0.6, CLOAK.z], r: 3.4, once: true, label: 'Take an edge of the cloak with the clans', enabled: () => self.phase === 'judged', onUse: () => {
        self.phase = 'lifting'; self.liftT = 0;
        SND.glow(env.bus, 146.83, { gain: 0.06, dur: 9 });
      } });

      const b = env.bus;
      this.wind = SND.noise(b, { color: 'pink', type: 'bandpass', freq: 500, q: 0.5, gain: 0.04 });
      this.crowd = SND.noise(b, { color: 'pink', type: 'bandpass', freq: 420, q: 1.3, gain: 0.02 });
      SND.lfo(b, this.crowd.filter && this.crowd.filter.frequency, 0.4, 90);
      this.voiceClock = 1; this.birdClock = 2;
    },

    rebuildKabah(w) {
      const g = this.kabahGroup; while (g.children.length) { const c = g.children.pop(); c.geometry && c.geometry.dispose(); }
      const k = KIT.kabah(w, { built: this.built, height: H });
      k.children.forEach(c => { c.castShadow = c.receiveShadow = true; });
      g.add(k);
    },

    update(env, dt) {
      const w = this.w; if (!w) return;
      w.update(dt);
      const t = w.time;
      KIT.driftDust(this.dust, dt, t, [0.1, 0.03]);
      this.dropMark.material.opacity = this.carrying ? 0.6 + 0.3 * Math.sin(t * 4) : 0;

      for (const f of this.flying) {
        f.t = Math.min(1, f.t + dt * 1.2);
        f.m.position.lerpVectors(f.from, f.to, U.easeOut(f.t)); f.m.position.y += Math.sin(f.t * Math.PI) * 1.5;
        if (f.t >= 1 && !f.done) {
          f.done = true; SND.knock(env.bus, { f: 120, gain: 0.45, click: 2000 });
          this.built = Math.min(0.72, this.built + 0.06); this.rebuildKabah(w); w.scene.remove(f.m);
        }
      }

      // banners stir; voices rise during the quarrel
      for (const bn of this.banners) {
        const a = bn.cl.geometry.attributes.position;
        for (let i = 0; i < a.count; i++) { const x0 = bn.base[i * 3]; a.setZ(i, Math.sin(t * 3 + x0 * 3 + bn.x) * 0.12 * (x0 + 0.7)); }
        a.needsUpdate = true;
      }
      const quarrel = this.phase === 'dispute' ? 1 : this.phase === 'build' ? 0.25 : 0.1;
      this.crowd.set('gain', 0.015 + 0.05 * quarrel, 0.6);
      this.voiceClock -= dt * (0.5 + quarrel * 2.5);
      if (this.voiceClock < 0) {
        this.voiceClock = 0.4 + Math.random();
        const bn = this.banners[(Math.random() * 4) | 0], sp = w.spatial(bn, 10);
        SND.sing(env.bus, U.rnd(95, 150) * (1 + quarrel * 0.3), { vowel: U.pick(['a', 'o', 'e']), dur: U.rnd(0.3, 0.7), gain: 0.025 * sp.gain + 0.004, pan: sp.pan, voices: 1, breath: 0.3, attack: 0.04, hold: 0.25, vib: 0.002 });
      }

      // the gate decides
      this.gateGlow.material.opacity = this.phase === 'dispute' ? 0.5 + 0.3 * Math.sin(t * 2) : 0;
      if (this.phase === 'dispute' && Math.hypot(w.pos.x - GATE.x, w.pos.z - GATE.z) < 2.4) {
        this.phase = 'judged';
        SND.glow(env.bus, 196, { gain: 0.06, dur: 7 });
        w.say('Al-Amin', 'The next man through the gate was Muhammad. <span class="q">“This is al-Amin; we accept him,”</span> they said. He asked for a cloak, laid the Black Stone on it, and asked each clan to take hold of an edge. (Musnad Ahmad; Ibn Ishaq)', { ms: 14000 });
        env.hint('Go to the cloak and take an edge with the clans'); w.progress(4, 'Take an edge of the cloak with the clans');
      }

      // the stone rises on the cloak, is carried to its corner, and is set in place
      if (this.phase === 'lifting') {
        this.liftT += dt / 7;
        const k = Math.min(1, this.liftT);
        const lift = U.smooth(0, 0.3, k), carry = U.smooth(0.3, 0.75, k), set = U.smooth(0.75, 0.95, k);
        const cx = U.lerp(CLOAK.x, CORNER.x + 1.6, carry), cz = U.lerp(CLOAK.z, CORNER.z + 1.6, carry);
        this.cloakRig.position.set(cx, 0.06 + lift * 1.15, cz);
        this.cloak.position.y = 0; this.cloak.material.opacity = 1;
        this.cloak.geometry.attributes.position.needsUpdate = true;
        const cp = this.cloak.geometry.attributes.position;
        for (let i = 0; i < cp.count; i++) { const x = cp.getX(i), y = cp.getY(i); cp.setZ(i, -Math.max(0, 1 - Math.hypot(x, y) / 1.8) * 0.45 * lift); }
        if (set > 0) {
          const target = new THREE.Vector3(CORNER.x + 0.05, 1.5, CORNER.z + 0.05), local = this.cloakRig.worldToLocal(target.clone());
          this.stone.position.lerpVectors(new THREE.Vector3(0, 0.26, 0), local, set);
          this.stoneGlow.position.copy(this.stone.position);
          this.stoneGlow.material.opacity = 0.15 + set * 0.8;
        }
        if (k >= 1 && !this.setDone) {
          this.setDone = true; this.phase = 'done';
          SND.knock(env.bus, { f: 90, gain: 0.5, click: 1500 }); SND.glow(env.bus, 130.81, { gain: 0.07, dur: 10 });
          this.cloakRig.position.y = 0.06;
          w.say('Set in Its Place', 'Together the clans raised the cloak, and when it reached the corner he set the Black Stone in its place with his own hand. The quarrel was over. Five years later, the man they trusted would be called to prophethood. (Musnad Ahmad; Ibn Ishaq)', { ms: 15000 });
          w.finish('The Black Stone is set in its place');
        }
      }
      this.birdClock -= dt;
      if (this.birdClock < 0) { this.birdClock = 2 + Math.random() * 4; SND.chirp(env.bus, { gain: 0.014 }); }
    },
  }));
})();
