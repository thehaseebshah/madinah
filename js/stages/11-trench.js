/* Station VII — The Trench (walkable).
   Winter dusk, 5 AH. A ditch cut across the open northern plain, Mount Sal' at your back,
   campfires along the line and the wind coming hard off the plain. Dig out the three
   unfinished sections, then strike the great rock in the trench three times. */
(function () {
  'use strict';
  if (!window.WORLD) return;
  const DEPTH = 3.0, INNER = 1.3, OUTER = 2.7;
  const PLUGS = [-8, 6, 20];
  const ROCK = { x: 34, z: 0 };

  function trenchY(x, z) {
    const d = Math.abs(z);
    if (d < INNER) return -DEPTH;
    if (d < OUTER) return -DEPTH * (OUTER - d) / (OUTER - INNER);
    // spoil heaped on the far (north) bank
    if (z < -OUTER && z > -OUTER - 4) return Math.sin(((-z - OUTER) / 4) * Math.PI) * 0.9;
    return 0;
  }

  ENGINE.register(WORLD.stage({
    key: 'trench',
    arabic: 'الخَنْدَق',
    title: 'The Trench',
    era: 'The Battle of al-Ahzab · 5 AH · 627 CE · walk the line',
    hint: 'WASD to walk · Shift to run · hold E to dig · E to strike',
    sound: { reverb: 0.3 },
    story: `<p>In the winter of 627 an alliance of tribes, some ten thousand strong, marched on Madinah. Salman al-Farisi, who knew the warfare of Persia, advised a trench across the open northern approach. The whole community dug it, the Prophet ﷺ among them, carrying earth in the cold.</p>
            <p>Three sections are still unfinished. Hold <b>E</b> to dig them out, then find the great rock in the trench that no pick could break.</p>`,

    enter(env) {
      const T = THREE;
      const self = this;
      this.plugs = PLUGS.map(x => ({ x, fill: 1 }));
      this.strikes = 0; this.sparks = []; this.flash = 0;
      const ground = (x, z) => {
        let y = trenchY(x, z);
        for (const p of self.plugs) if (Math.abs(x - p.x) < 2.2 && Math.abs(z) < OUTER) y = Math.max(y, -DEPTH + DEPTH * p.fill * 0.92);
        return y + U.noise2(x * 0.05, z * 0.05) * 0.25 * U.smooth(OUTER, OUTER + 6, Math.abs(z));
      };
      const w = this.w = WORLD.create(env, {
        start: { x: -16, z: 9, yaw: -0.25 }, exposure: 0.95, shadows: false,
        fog: { color: 0x51566a, density: 0.012 },
        bounds: [-110, -40, 110, 60], ground,
        surface: (x, z) => (Math.abs(z) < OUTER ? 'gravel' : 'sand'),
      });
      this.ground = ground;
      const S = w.scene;

      w.sky({ top: '#1e2440', mid: '#9a6a5a', bot: '#2a2a34', sunDir: [-0.95, 0.04, 0.2], sun: '#ff9a5a', sunSize: 0.003 });
      S.add(new T.HemisphereLight(0x8090b8, 0x3a2a20, 0.75));
      const sunL = new T.DirectionalLight(0xffa070, 0.9); sunL.position.set(-60, 8, 15); S.add(sunL);

      // terrain with the trench cut into it
      const geo = new T.PlaneGeometry(240, 120, 240, 240);
      geo.rotateX(-Math.PI / 2);
      geo.translate(0, 0, 10);
      const pos = geo.attributes.position, col = new Float32Array(pos.count * 3);
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i), z = pos.getZ(i);
        const y = trenchY(x, z) + U.noise2(x * 0.05, z * 0.05) * 0.25 * U.smooth(OUTER, OUTER + 6, Math.abs(z));
        pos.setY(i, y);
        const dug = U.smooth(OUTER + 4.5, INNER, Math.abs(z) + (z < 0 ? -1.5 : 0));
        const c = U.mix([1, 0.93, 0.82], [0.62, 0.42, 0.3], dug);
        col.set(c, i * 3);
      }
      geo.setAttribute('color', new T.BufferAttribute(col, 3));
      geo.computeVertexNormals();
      this.terrain = new T.Mesh(geo, KIT.std({ map: KIT.sand(w, [60, 30]), vertexColors: true, color: 0xd8c0a0 }));
      S.add(this.terrain);

      // the unfinished plugs of earth
      const earth = KIT.std({ map: KIT.sand(w, [2, 2]), color: 0x9a6a48 });
      this.plugMeshes = this.plugs.map(p => {
        const m = new T.Mesh(new T.BoxGeometry(4.4, DEPTH, 2 * OUTER - 0.4, 1, 1, 1), earth);
        m.position.set(p.x, -DEPTH / 2, 0); m.userData.dynamic = true; S.add(m); return m;
      });

      // Mount Sal' behind the camp
      const mg = new T.IcosahedronGeometry(1, 5), mp = mg.attributes.position;
      for (let i = 0; i < mp.count; i++) {
        const v = new T.Vector3(mp.getX(i), mp.getY(i), mp.getZ(i));
        const n = 1 + U.noise2(v.x * 3 + 5, v.z * 3) * 0.22 + U.noise2(v.x * 9, v.y * 9) * 0.06;
        v.multiplyScalar(n); mp.setXYZ(i, v.x * 60, Math.max(-0.2, v.y) * 42, v.z * 34);
      }
      mg.computeVertexNormals();
      const sal = new T.Mesh(mg, KIT.std({ map: KIT.basalt(w, [8, 4]), color: 0x8a7a76, flatShading: true }));
      sal.position.set(-10, -2, 92); S.add(sal);
      // far ranges to the north
      for (let i = 0; i < 6; i++) {
        const r = new T.Mesh(new T.ConeGeometry(30 + i * 6, 14 + (i % 3) * 6, 7), KIT.std({ color: 0x4a4656, flatShading: true }));
        r.position.set(-140 + i * 55, 0, -170 - (i % 2) * 30); S.add(r);
      }

      // the camp: tents and campfires on the city side
      const cloth = KIT.std({ color: 0x8a7458, roughness: 1, side: T.DoubleSide });
      this.fires = [];
      const r = U.seeded(5);
      for (let i = 0; i < 14; i++) {
        const x = -60 + i * 9 + r() * 4, z = 16 + r() * 12;
        const tent = new T.Mesh(new T.ConeGeometry(1.6 + r() * 0.6, 2.2, 4, 1, true), cloth);
        tent.position.set(x, 1.1 + ground(x, z), z); tent.rotation.y = r() * 3; S.add(tent);
        w.addCircle(x, z, 1.5);
      }
      const fireAt = [[-24, 7], [-2, 8], [18, 7.5], [40, 8]];
      fireAt.forEach(([x, z], i) => {
        const y = ground(x, z);
        const ring = new T.Mesh(new T.TorusGeometry(0.55, 0.14, 6, 12), KIT.std({ map: KIT.basalt(w), color: 0x666060 }));
        ring.rotation.x = Math.PI / 2; ring.position.set(x, y + 0.08, z); S.add(ring);
        const flame = KIT.glow(w, 0xff8a30, 1.6, 0.9); flame.position.set(x, y + 0.55, z); S.add(flame);
        const core = KIT.glow(w, 0xffe0a0, 0.7, 1); core.position.set(x, y + 0.4, z); S.add(core);
        const light = i < 3 ? new T.PointLight(0xff8a40, 2.2, 16, 2) : null;
        if (light) { light.position.set(x, y + 1, z); S.add(light); }
        w.addCircle(x, z, 0.7);
        this.fires.push({ x, z, flame, core, light, ph: r() * 10 });
      });
      // distant fires of the besieging army across the plain
      for (let i = 0; i < 40; i++) {
        const f = KIT.glow(w, 0xff9a50, 1.4 + r() * 1.2, 0.8); f.position.set(-120 + r() * 240, 0.6, -60 - r() * 60); S.add(f);
      }

      // the great rock
      const rg = new T.DodecahedronGeometry(1.3, 1), rpp = rg.attributes.position;
      for (let i = 0; i < rpp.count; i++) { const k = 1 + U.noise2(rpp.getX(i) * 2, rpp.getY(i) * 2 + rpp.getZ(i)) * 0.18; rpp.setXYZ(i, rpp.getX(i) * k * 1.3, rpp.getY(i) * k, rpp.getZ(i) * k); }
      rg.computeVertexNormals();
      this.rock = new T.Mesh(rg, KIT.std({ color: 0xd8d0c4, roughness: 0.7, flatShading: true }));
      this.rock.position.set(ROCK.x, -DEPTH + 0.9, ROCK.z); this.rock.userData.dynamic = true; S.add(this.rock);
      w.addCircle(ROCK.x, ROCK.z, 1.5);
      this.rockLight = new T.PointLight(0xfff0c0, 0, 30, 2); this.rockLight.position.set(ROCK.x, -1, 0); S.add(this.rockLight);
      // sparks
      const sg = new T.BufferGeometry(); this.sparkPos = new Float32Array(400 * 3);
      sg.setAttribute('position', new T.BufferAttribute(this.sparkPos, 3));
      this.sparkPts = new T.Points(sg, new T.PointsMaterial({ map: KIT.glowTex(w), color: 0xffd080, size: 0.07, transparent: true, depthWrite: false, blending: T.AdditiveBlending }));
      this.sparkPts.frustumCulled = false; S.add(this.sparkPts);
      // flying earth while digging
      const dg = new T.BufferGeometry(); this.dirtPos = new Float32Array(200 * 3);
      dg.setAttribute('position', new T.BufferAttribute(this.dirtPos, 3));
      this.dirtPts = new T.Points(dg, new T.PointsMaterial({ color: 0x6a4a34, size: 0.08 }));
      this.dirtPts.frustumCulled = false; S.add(this.dirtPts); this.dirt = [];
      // blowing dust
      this.dust = KIT.dust(w, 900, [-60, 0.1, -20, 60, 3, 25], 0xc8b8a0, 0.06); this.dust.material.blending = T.NormalBlending; this.dust.material.opacity = 0.35; S.add(this.dust);

      w.followShadow(sunL, 28); w.receiveAll();
      this.baked = w.bake();

      /* ---------- interactions ---------- */
      const counter = () => {
        const dug = self.plugs.filter(p => p.fill <= 0).length;
        w.count(`Dug ${dug} / 3 · Rock ${self.strikes} / 3`);
        if (dug === 3 && self.strikes >= 3) { env.complete(); self.unlockSoon(); }
      };
      counter();
      this.plugs.forEach((p, i) => {
        w.interact({
          key: 'plug' + i, pos: [p.x, 0.3, 2.6], r: 3.6, hold: 2.6, once: true, label: 'Hold E to dig',
          enabled: () => p.fill > 0,
          onHold: (ww, it, k, dt) => {
            p.fill = Math.max(0.02, 1 - k);
            self.digClock = (self.digClock || 0) - dt;
            if (self.digClock < 0) {
              self.digClock = 0.42;
              SND.step(env.bus, { gain: 0.3, f: U.rnd(700, 1200) });
              SND.knock(env.bus, { f: U.rnd(70, 110), gain: 0.18, click: 1400 });
              for (let k2 = 0; k2 < 14; k2++) self.dirt.push({ x: p.x + U.rnd(-1, 1), y: -1 + p.fill * 2, z: U.rnd(-1, 1), vx: U.rnd(-1, 1), vy: U.rnd(3, 5), vz: U.rnd(-4, -2), life: 1.2 });
            }
          },
          onUse: () => {
            p.fill = 0;
            SND.glow(env.bus, 146.83, { gain: 0.04, dur: 5 });
            w.say('A Section Cut', 'The whole community dug, the Prophet ﷺ among them, carrying earth until the dust covered his skin (Sahih al-Bukhari). A report with a weak chain says each ten men were given forty cubits to dig. They worked through cold days with little food, singing as they carried the earth.', { ms: 9000 });
            counter();
          },
        });
      });
      const LINES = [
        ['The First Blow', 'The narrations say a rock appeared in the trench that no pick could break. The Prophet ﷺ came down, said <i>Bismillah</i> and struck it, and a third of it broke away in a flash of light. <span class="q">“Allahu akbar. I have been given the keys of ash-Sham.”</span>'],
        ['The Second Blow', 'He struck again, and another third fell, with light. <span class="q">“Allahu akbar. I have been given the keys of Persia.”</span>'],
        ['The Third Blow', 'At the third blow the rest of the rock gave way. <span class="q">“Allahu akbar. I have been given the keys of Yemen.”</span> At the height of the siege, with an army at the trench, this was a promise of what lay ahead. <span class="q">(Musnad Ahmad, a chain Ibn Hajar called hasan and others weak. The rock itself is in Sahih al-Bukhari; an-Nasa’i’s version names Persia, Byzantium and Ethiopia.)</span>'],
      ];
      w.interact({
        key: 'rock', pos: [ROCK.x, -DEPTH + 1.2, ROCK.z], r: 4.2, label: () => `Strike the rock (${self.strikes + 1} of 3)`,
        enabled: () => self.strikes < 3,
        onUse: () => {
          self.strikes++;
          const s = self.strikes;
          self.flash = 1;
          for (let i = 0; i < 90; i++) {
            const a = Math.random() * 6.283, e = Math.random() * 1.2, v = 3 + Math.random() * 7;
            self.sparks.push({ x: ROCK.x, y: -DEPTH + 1.4, z: 0, vx: Math.cos(a) * Math.cos(e) * v, vy: Math.sin(e) * v + 2, vz: Math.sin(a) * Math.cos(e) * v, life: 0.8 + Math.random() * 0.9 });
          }
          SND.knock(env.bus, { f: 70, gain: 0.7, click: 2600 });
          SND.thump(env.bus, { f: 40, gain: 0.5, dur: 1.4 });
          SND.bell(env.bus, 1760, { gain: 0.03, dur: 2, metal: true });
          for (let k = 1; k < 5; k++) SND.knock(env.bus, { f: 70, gain: 0.25 * Math.pow(0.5, k), click: 1800, pan: k % 2 ? -0.6 : 0.6 });
          // the takbir, sung by many voices
          SND.glow(env.bus, [146.83, 164.81, 196][s - 1], { gain: 0.07, dur: 6, delay: 0.2 });
          self.rock.scale.multiplyScalar(0.72);
          self.rock.position.y -= 0.22;
          if (s === 3) { self.rock.visible = false; }
          w.say(LINES[s - 1][0], LINES[s - 1][1], { ar: 'اللهُ أكْبَر', ms: s === 3 ? 15000 : 10000 });
          counter();
        },
      });

      /* ---------- sound ---------- */
      const b = env.bus;
      this.wind = SND.noise(b, { color: 'pink', type: 'bandpass', freq: 420, q: 0.5, gain: 0.14 });
      this.windHi = SND.noise(b, { color: 'white', type: 'bandpass', freq: 2400, q: 1.2, gain: 0.015, pan: -0.4 });
      SND.lfo(b, this.wind.gain && this.wind.gain.gain, 0.09, 0.07);
      SND.lfo(b, this.wind.filter && this.wind.filter.frequency, 0.13, 180);
      this.fireN = SND.noise(b, { color: 'brown', type: 'lowpass', freq: 600, gain: 0 });
      this.gust = 3;
    },

    update(env, dt) {
      const w = this.w; if (!w) return;
      w.update(dt);
      const t = w.time;
      KIT.driftDust(this.dust, dt, t, [1.6, 0.6]);
      // plugs sink as they are dug
      this.plugs.forEach((p, i) => { const m = this.plugMeshes[i]; m.position.y = U.damp(m.position.y, -DEPTH / 2 - DEPTH * (1 - p.fill) * 0.97, 8, dt); m.visible = p.fill > 0.01; });
      // fires
      let nearFire = 0;
      for (const f of this.fires) {
        const k = 0.75 + 0.25 * U.noise1(t * 6 + f.ph) + 0.1 * Math.sin(t * 17 + f.ph);
        f.flame.scale.set(1.6 * k, 2.1 * k, 1); f.core.material.opacity = 0.7 + 0.3 * k;
        if (f.light) f.light.intensity = 1.8 * k;
        const sp = w.spatial(f, 4);
        nearFire = Math.max(nearFire, sp.gain);
        if (Math.random() < dt * 6 * sp.gain) SND.knock(env.bus, { f: U.rnd(800, 1600), gain: 0.04 * sp.gain, click: U.rnd(3000, 6000), pan: sp.pan });
      }
      this.fireN.set('gain', 0.06 * nearFire, 0.3);
      // sparks and the flash of the rock
      this.flash = Math.max(0, this.flash - dt * 1.6);
      this.rockLight.intensity = this.flash * 5;
      w.renderer.toneMappingExposure = 0.95 + this.flash * 0.25;
      const sp = this.sparkPos; let n = 0;
      for (const s of this.sparks) { s.life -= dt; s.vy -= 9 * dt; s.x += s.vx * dt; s.y += s.vy * dt; s.z += s.vz * dt; if (s.y < -DEPTH) { s.y = -DEPTH; s.vy *= -0.3; } }
      this.sparks = this.sparks.filter(s => s.life > 0);
      for (const s of this.sparks) { if (n >= 400) break; sp[n * 3] = s.x; sp[n * 3 + 1] = s.y; sp[n * 3 + 2] = s.z; n++; }
      for (let i = n; i < 400; i++) sp[i * 3 + 1] = -999;
      this.sparkPts.geometry.attributes.position.needsUpdate = true;
      // earth thrown from the trench
      const dp = this.dirtPos; let m = 0;
      for (const d of this.dirt) { d.life -= dt; d.vy -= 12 * dt; d.x += d.vx * dt; d.y += d.vy * dt; d.z += d.vz * dt; }
      this.dirt = this.dirt.filter(d => d.life > 0 && d.y > -DEPTH);
      for (const d of this.dirt) { if (m >= 200) break; dp[m * 3] = d.x; dp[m * 3 + 1] = d.y; dp[m * 3 + 2] = d.z; m++; }
      for (let i = m; i < 200; i++) dp[i * 3 + 1] = -999;
      this.dirtPts.geometry.attributes.position.needsUpdate = true;
      // gusts
      this.gust -= dt;
      if (this.gust < 0) { this.gust = 3 + Math.random() * 5; SND.swell(env.bus, { f0: 250, f1: 1300, dur: 2.5 + Math.random() * 2, gain: 0.1, pan: U.rnd(-1, 1) }); }
    },
  }));
})();
