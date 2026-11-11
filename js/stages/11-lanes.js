/* Station XI — The Lanes of Old Madinah (walkable).
   Night in a narrow lane of tall Hijazi houses, their wooden roshan windows glowing from within.
   Light the lanterns, knock at a door, drink at the sabil in the little square, and walk on until
   the lane opens and the Green Dome stands before you. */
(function () {
  'use strict';
  if (!window.WORLD) return;
  const LANE_END = -104, SQ = { z0: -46, z1: -60 }, HALF = 1.9, SQ_HALF = 6;

  const laneHalf = z => (z < SQ.z0 && z > SQ.z1 ? SQ_HALF : HALF);

  ENGINE.register(WORLD.stage({
    key: 'lanes',
    arabic: 'أَزِقّة المَدِينة',
    title: 'The Lanes of Old Madinah',
    era: 'Hijazi houses · around 1900 · walk the lane',
    hint: 'WASD to walk · E to light lanterns, knock and drink · walk to the end of the lane',
    sound: { reverb: 0.55 },
    story: `<p>For centuries the Prophet’s Mosque stood at the heart of a dense old city: narrow lanes shaded by houses of four and five storeys, built of stone and coral-white plaster, with projecting wooden windows called <i>roshan</i> that let the breeze in and kept the family out of view.</p>
            <p>Most of these quarters were cleared in the great expansions of the twentieth century. Walk one of them as it was, by lamplight.</p>`,

    enter(env) {
      const T = THREE;
      const self = this;
      const w = this.w = WORLD.create(env, {
        start: { x: 0, z: 6, yaw: 0 }, exposure: 1.2,
        fog: { color: 0x141a2c, density: 0.016 },
        bounds: [-30, -160, 30, 9],
        surface: () => 'stone',
      });
      const S = w.scene;
      w.sky({ top: '#050814', mid: '#182240', bot: '#0a0c16', sunDir: [0.3, 0.6, -0.7], sun: '#9aa8d8', sunSize: 0.0008, stars: 1 });
      S.add(new T.HemisphereLight(0x5868a8, 0x6a4a30, 0.7));
      const moon = new T.DirectionalLight(0xaab8ff, 0.5); moon.position.set(20, 60, -30); S.add(moon);

      // paving of worn basalt setts
      const sett = w.tex(512, (g, s) => {
        g.fillStyle = '#2a2624'; g.fillRect(0, 0, s, s);
        const n = 8, c = s / n;
        for (let j = 0; j < n; j++) for (let i = 0; i < n + 1; i++) {
          const x = i * c - (j % 2) * c / 2, y = j * c, t = Math.random();
          g.fillStyle = `rgb(${70 + t * 40 | 0},${64 + t * 34 | 0},${60 + t * 30 | 0})`;
          g.beginPath(); g.roundRect ? g.roundRect(x + 3, y + 3, c - 6, c - 6, 10) : g.rect(x + 3, y + 3, c - 6, c - 6); g.fill();
          g.fillStyle = 'rgba(255,240,220,0.06)'; g.fillRect(x + 6, y + 5, c - 14, 4);
        }
      }, [3, 40]);
      const floor = new T.Mesh(new T.PlaneGeometry(14, 170), KIT.std({ map: sett, roughness: 0.75 }));
      floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, -72); S.add(floor);

      // houses
      const r = U.seeded(1907);
      const tints = ['#e8e0d0', '#dccfb8', '#e4d6bc', '#d0c8bc', '#ead9c0'];
      const plasterMats = tints.map(t => KIT.std({ map: KIT.plaster(w, [2, 3], t) }));
      const baseMat = KIT.std({ map: KIT.basalt(w, [3, 0.5]), color: 0x8a8480 });
      const woodMat = KIT.std({ map: KIT.wood(w, [1, 1], '#5a3a22'), color: 0xb08a60, roughness: 0.8 });
      const latticeTex = KIT.lattice(w, [3, 4]);
      const latticeMat = KIT.std({ map: latticeTex, alphaTest: 0.5, side: T.DoubleSide, color: 0xc89a68 });
      const glowMat = new T.MeshBasicMaterial({ color: 0xffb860 });
      const darkMat = new T.MeshBasicMaterial({ color: 0x120c0a });
      const innerGlow = new T.MeshBasicMaterial({ color: 0xe08a3a, side: T.BackSide });
      const winMat = KIT.std({ color: 0x1a1412 });
      this.doors = [];
      const house = (side, z0, len) => {
        const hz = laneHalf(z0 - len / 2), x0 = side * hz;
        const H = 9 + r() * 7, D = 8;
        const mat = plasterMats[(r() * plasterMats.length) | 0];
        const m = new T.Mesh(new T.BoxGeometry(D, H, len - 0.05), mat);
        m.position.set(x0 + side * D / 2, H / 2, z0 - len / 2); S.add(m);
        const base = new T.Mesh(new T.BoxGeometry(0.25, 1.1, len - 0.05), baseMat); base.position.set(x0 + side * 0.05, 0.55, z0 - len / 2); S.add(base);
        // parapet with crenellation
        for (let z = z0 - 0.4; z > z0 - len + 0.3; z -= 0.9) { const c = new T.Mesh(new T.BoxGeometry(0.3, 0.5, 0.45), mat); c.position.set(x0 + side * 0.2, H + 0.25, z); S.add(c); }
        // string courses
        [3.4, 6.6].forEach(y => { if (y < H - 1) { const s = new T.Mesh(new T.BoxGeometry(0.18, 0.18, len - 0.05), mat); s.position.set(x0 - side * 0.05, y, z0 - len / 2); S.add(s); } });
        // a wooden door with a little lit transom
        const dz = z0 - len * (0.25 + r() * 0.5);
        const door = new T.Mesh(new T.BoxGeometry(0.12, 2.3, 1.3), woodMat); door.position.set(x0 + side * 0.02, 1.15, dz); S.add(door);
        const frame = new T.Mesh(new T.BoxGeometry(0.1, 2.6, 1.6), baseMat); frame.position.set(x0 + side * 0.08, 1.3, dz); S.add(frame);
        this.doors.push({ side, x: x0, z: dz, mesh: door, H });
        // roshan windows on the upper storeys
        for (let fl = 1; fl * 3.2 + 3 < H; fl++) {
          for (let k = 0; k < Math.max(1, Math.floor(len / 5)); k++) {
            if (r() < 0.35) continue;
            const rz = z0 - (k + 0.5) * (len / Math.max(1, Math.floor(len / 5))), ry = fl * 3.2 + 1.2;
            if (r() < 0.25) { const win = new T.Mesh(new T.PlaneGeometry(0.8, 1.2), winMat); win.position.set(x0 - side * 0.01, ry, rz); win.rotation.y = side * -Math.PI / 2; S.add(win); continue; }
            const ro = new T.Group(); ro.position.set(x0 - side * 0.45, ry, rz);
            const W = 1.9 + r() * 0.8, Hh = 2.3 + r() * 0.5, Dp = 0.85;
            const lit = r() < 0.6;
            const back = new T.Mesh(new T.PlaneGeometry(W, Hh), lit ? glowMat : darkMat); back.rotation.y = side * -Math.PI / 2; back.position.x = side * 0.35; ro.add(back);
            const front = new T.Mesh(new T.PlaneGeometry(W, Hh), latticeMat); front.rotation.y = side * -Math.PI / 2; front.position.x = -side * Dp / 2; ro.add(front);
            [-1, 1].forEach(e => { const sp = new T.Mesh(new T.PlaneGeometry(Dp, Hh), latticeMat); sp.position.set(0, 0, e * W / 2); ro.add(sp); });
            const top = new T.Mesh(new T.BoxGeometry(Dp + 0.3, 0.22, W + 0.3), woodMat); top.position.y = Hh / 2 + 0.11; ro.add(top);
            const crown = new T.Mesh(new T.BoxGeometry(Dp + 0.1, 0.35, W + 0.1), woodMat); crown.position.y = Hh / 2 + 0.4; crown.scale.x = 0.8; ro.add(crown);
            const sill = new T.Mesh(new T.BoxGeometry(Dp + 0.3, 0.3, W + 0.3), woodMat); sill.position.y = -Hh / 2 - 0.15; ro.add(sill);
            if (lit) {
              const inner = new T.Mesh(new T.BoxGeometry(Dp * 0.8, Hh * 0.92, W * 0.94), innerGlow); inner.position.x = -side * 0.02; ro.add(inner);
              const g = KIT.glow(w, 0xffa850, 3.6, 0.5); g.position.set(-side * 0.7, -0.2, 0); ro.add(g);
            }
            S.add(ro);
          }
        }
        return H;
      };
      for (const side of [-1, 1]) {
        let z = 8;
        while (z > LANE_END) {
          // leave the square open on both sides
          if (z > SQ.z0 && z - 6 < SQ.z0) { const len = z - SQ.z0; if (len > 1.5) house(side, z, len); z = SQ.z0; }
          if (z <= SQ.z0 && z > SQ.z1) {
            // the square's back walls
            const back = new T.Mesh(new T.BoxGeometry(6, 11, SQ.z0 - SQ.z1), plasterMats[2]); back.position.set(side * (SQ_HALF + 3), 5.5, (SQ.z0 + SQ.z1) / 2); S.add(back);
            z = SQ.z1; continue;
          }
          const len = Math.min(z - LANE_END, 5 + r() * 6);
          house(side, z, len);
          z -= len;
        }
      }
      // colliders: lane walls
      w.addBox(-20, SQ.z0, -HALF, 9); w.addBox(HALF, SQ.z0, 20, 9);
      w.addBox(-20, LANE_END, -HALF, SQ.z1); w.addBox(HALF, LANE_END, 20, SQ.z1);
      w.addBox(-20, 8.5, 20, 12);
      w.addBox(-20, SQ.z1, -SQ_HALF, SQ.z0); w.addBox(SQ_HALF, SQ.z1, 20, SQ.z0);
      w.addBox(-HALF - 1.2, LANE_END - 1.1, -HALF, LANE_END + 0.1); w.addBox(HALF, LANE_END - 1.1, HALF + 1.2, LANE_END + 0.1);

      // the sabil: a public fountain in the square
      const sab = new T.Group(); sab.position.set(-SQ_HALF + 0.9, 0, (SQ.z0 + SQ.z1) / 2);
      const sabBody = new T.Mesh(new T.BoxGeometry(1.6, 2.6, 3.2), KIT.std({ map: KIT.plaster(w, [1, 1], '#efe6d6') })); sabBody.position.y = 1.3; sab.add(sabBody);
      const tile = w.tex(256, (g, s) => {
        g.fillStyle = '#1f5a50'; g.fillRect(0, 0, s, s);
        g.strokeStyle = '#d8c48a'; g.lineWidth = 3;
        for (let y = 16; y < s; y += 32) for (let x = 16; x < s; x += 32) { U.star8(g, x + ((y / 32) % 2) * 16, y, 12, 0.55, Math.PI / 8); g.stroke(); }
        g.fillStyle = '#efe6d6'; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, s * 0.42); g.quadraticCurveTo(0, 0, s / 2, 0); g.fill(); g.beginPath(); g.moveTo(s, 0); g.lineTo(s, s * 0.42); g.quadraticCurveTo(s, 0, s / 2, 0); g.fill();
      });
      const arch = new T.Mesh(new T.PlaneGeometry(1.6, 1.3), KIT.std({ map: tile, roughness: 0.35 })); arch.rotation.y = Math.PI / 2; arch.position.set(0.81, 1.75, 0); sab.add(arch);
      const basin = new T.Mesh(new T.BoxGeometry(0.7, 0.5, 2.2), baseMat); basin.position.set(1.0, 0.45, 0); sab.add(basin);
      const wat = new T.Mesh(new T.PlaneGeometry(0.55, 2.0), KIT.std({ color: 0x1a3a48, roughness: 0.1, metalness: 0.3 })); wat.rotation.x = -Math.PI / 2; wat.position.set(1.0, 0.71, 0); sab.add(wat);
      const brass = KIT.std({ color: 0xc89a48, metalness: 0.9, roughness: 0.3 });
      [-0.6, 0.6].forEach(z => { const tap = new T.Mesh(new T.CylinderGeometry(0.04, 0.04, 0.3, 8), brass); tap.rotation.z = Math.PI / 2; tap.position.set(0.95, 1.1, z); sab.add(tap); });
      S.add(sab); w.addBox(-SQ_HALF, SQ.z1 + 5.5, -SQ_HALF + 1.7, SQ.z0 - 5.5);
      // a palm in the square
      const sqPalm = KIT.palm(w, 8, { lean: 0.15 }); sqPalm.position.set(SQ_HALF - 1.4, 0, SQ.z1 + 3); S.add(sqPalm); w.addCircle(SQ_HALF - 1.4, SQ.z1 + 3, 0.35);

      // lanterns on wall brackets, unlit until you light them
      this.lanterns = [];
      const iron = KIT.std({ color: 0x2a2420, metalness: 0.6, roughness: 0.5 });
      const lampGlass = () => KIT.std({ color: 0x4a3a20, emissive: 0xffa040, emissiveIntensity: 0 });
      const LZ = [-4, -14, -24, -36, -66, -76, -86, -96];
      LZ.forEach((z, i) => {
        const side = i % 2 ? 1 : -1, hx = laneHalf(z) * side;
        const g = new T.Group(); g.position.set(hx - side * 0.45, 3.3, z);
        const arm = new T.Mesh(new T.BoxGeometry(0.9, 0.05, 0.05), iron); arm.position.x = side * 0.25; g.add(arm);
        const glassM = lampGlass();
        const body = new T.Mesh(new T.CylinderGeometry(0.16, 0.12, 0.42, 6), glassM); body.position.y = -0.3; g.add(body);
        const cap = new T.Mesh(new T.ConeGeometry(0.2, 0.2, 6), iron); cap.position.y = -0.02; g.add(cap);
        const halo = KIT.glow(w, 0xffb060, 2.6, 0); halo.position.y = -0.3; g.add(halo);
        const light = new T.PointLight(0xffa850, 0, 11, 2); light.position.y = -0.4; g.add(light);
        S.add(g);
        const L = { g, glassM, halo, light, lit: false, z, ph: Math.random() * 10 };
        this.lanterns.push(L);
        w.interact({
          key: 'lamp' + i, pos: [g.position.x, 2.6, z], r: 3.4, once: true, label: 'Light the lantern',
          onUse: () => {
            L.lit = true; L.t = 0;
            SND.swell(env.bus, { color: 'white', type: 'bandpass', f0: 1800, f1: 600, dur: 0.6, gain: 0.05 });
            SND.bell(env.bus, [392, 440, 493.88, 523.25, 587.33, 659.25, 739.99, 783.99][self.lit], { gain: 0.06, glass: true, pan: side * 0.4 });
            self.lit++;
            w.count(`Lanterns lit ${self.lit} / 8`);
            if (self.lit === 1) w.say('Lamps of the Lane', 'Before electricity, the lanes around the mosque were lit by oil lamps that the lamplighters tended at dusk. Light the rest as you walk.', { ms: 8000 });
          },
        });
      });
      this.lit = 0; w.count('Lanterns lit 0 / 8');

      // one door that answers a knock
      const kd = this.doors.find(d => d.z < -16 && d.z > -40) || this.doors[2];
      const doorLight = new T.PointLight(0xffb060, 0, 9, 2); doorLight.position.set(kd.x + kd.side * 1.2, 1.4, kd.z); S.add(doorLight);
      const doorGlow = KIT.glow(w, 0xffb060, 3, 0); doorGlow.position.set(kd.x + kd.side * 0.4, 1.2, kd.z); S.add(doorGlow);
      // the door hinges at its edge
      const pivot = new T.Group(); pivot.userData.dynamic = true; pivot.position.set(kd.x + kd.side * 0.02, 1.15, kd.z - 0.65); S.add(pivot);
      kd.mesh.position.set(0, 0, 0.65); pivot.add(kd.mesh);
      this.knockDoor = { pivot, light: doorLight, glow: doorGlow, open: 0, target: 0, side: kd.side };
      w.interact({
        key: 'door', pos: [kd.x, 1.6, kd.z], r: 2.8, once: true, label: 'Knock at the door',
        onUse: () => {
          [0, 0.28, 0.56].forEach(d => setTimeout(() => SND.knock(env.bus, { f: 120, gain: 0.45, click: 700, pan: kd.side * 0.5 }), d * 1000));
          setTimeout(() => { self.knockDoor.target = 1; SND.swell(env.bus, { color: 'brown', type: 'lowpass', f0: 200, f1: 500, dur: 1.4, gain: 0.08 }); SND.bell(env.bus, 293.66, { gain: 0.07, vowel: 'm' }); }, 1600);
          setTimeout(() => w.say('Hospitality', 'A knock was answered with a welcome. Visitors to the Prophet’s city were guests of its people: a seat on the cushions of the <i>majlis</i>, bitter coffee scented with cardamom, and Madinah’s dates. The roshan above let the evening breeze into the house.', { ms: 12000 }), 2200);
        },
      });

      w.interact({
        key: 'sabil', pos: [-SQ_HALF + 1.9, 1.1, (SQ.z0 + SQ.z1) / 2], r: 2.8, once: false, label: 'Drink from the sabil',
        onUse: (ww, it) => {
          for (let k = 0; k < 8; k++) SND.drop(env.bus, { f: U.rnd(500, 1200), gain: 0.06, delay: k * 0.07 });
          if (it.uses === 1) w.say('The Sabil', 'Public fountains like this one were endowed as charity, often in the name of someone who had died, so that anyone passing, pilgrim or porter, could drink. The giving of water is among the most loved of good works.', { ms: 11000 });
        },
      });

      // the end of the lane: a gateway, and the Prophet's Mosque beyond
      const gateM = KIT.std({ map: KIT.plaster(w, [1, 1], '#e6dccb') });
      const gate = new T.Group(); gate.position.set(0, 0, LANE_END - 0.5);
      [-1, 1].forEach(s => { const p = new T.Mesh(new T.BoxGeometry(1.2, 6, 1.2), gateM); p.position.set(s * (HALF + 0.6), 3, 0); gate.add(p); });
      const lintel = new T.Mesh(new T.BoxGeometry(2 * HALF + 2.4, 1.6, 1.2), gateM); lintel.position.y = 6.6; gate.add(lintel);
      S.add(gate);
      const plaza = new T.Mesh(new T.PlaneGeometry(160, 80), KIT.std({ color: 0x8c8880, roughness: 0.35, metalness: 0.05 }));
      plaza.rotation.x = -Math.PI / 2; plaza.position.set(0, 0.01, LANE_END - 40); S.add(plaza);
      const mosque = new T.Group(); mosque.position.set(0, 0, LANE_END - 64);
      const arcadeTex = w.tex(512, (g, s) => {
        g.fillStyle = '#d8d0c2'; g.fillRect(0, 0, s, s);
        for (let i = 0; i < 8; i++) { const x = i * 64 + 32; g.fillStyle = '#ffc070'; g.beginPath(); g.moveTo(x - 20, s * 0.95); g.lineTo(x - 20, s * 0.45); g.arc(x, s * 0.45, 20, Math.PI, 0); g.lineTo(x + 20, s * 0.95); g.fill(); }
      }, [7, 1]);
      const wallM = new T.Mesh(new T.BoxGeometry(160, 16, 4), KIT.std({ map: arcadeTex, emissive: 0xffffff, emissiveMap: arcadeTex, emissiveIntensity: 0.55 }));
      wallM.position.set(0, 8, 0); mosque.add(wallM);
      const gd = KIT.greenDome(w, 1.1); gd.position.set(-8, 16, -8); mosque.add(gd);
      const domeLight = new T.PointLight(0x80ffc0, 0, 40, 2); domeLight.position.set(-8, 30, 6); mosque.add(domeLight);
      [[18, -2], [-36, -2]].forEach(([x, z]) => { const m = KIT.minaret(w, 62, true); m.position.set(x, 0, z); mosque.add(m); });
      S.add(mosque);
      this.domeLight = domeLight;
      w.addBox(-80, LANE_END - 70, 80, LANE_END - 61);

      this.baked = w.bake();

      /* ---------- sound ---------- */
      const b = env.bus;
      this.draft = SND.noise(b, { color: 'pink', type: 'bandpass', freq: 700, q: 2.5, gain: 0.03 });
      SND.lfo(b, this.draft.filter && this.draft.filter.frequency, 0.05, 220);
      this.room = SND.noise(b, { color: 'brown', type: 'lowpass', freq: 200, gain: 0.06 });
      this.crowd = SND.noise(b, { color: 'pink', type: 'bandpass', freq: 450, q: 1.2, gain: 0.0 });
      this.water = SND.noise(b, { color: 'white', type: 'bandpass', freq: 2600, q: 1, gain: 0 });
      this.cooClock = 3; this.reached = false;
    },

    update(env, dt) {
      const w = this.w; if (!w) return;
      w.update(dt);
      const t = w.time;
      for (const L of this.lanterns) {
        if (!L.lit) continue;
        L.t = Math.min(1, (L.t || 0) + dt * 1.5);
        const fl = 0.85 + 0.15 * U.noise1(t * 7 + L.ph);
        L.light.intensity = 2.4 * L.t * fl; L.glassM.emissiveIntensity = 2.2 * L.t * fl; L.halo.material.opacity = 0.75 * L.t * fl;
      }
      const d = this.knockDoor;
      d.open = U.damp(d.open, d.target, 1.6, dt);
      d.pivot.rotation.y = d.side * d.open * 1.4;
      d.light.intensity = d.open * 3; d.glow.material.opacity = d.open * 0.8;

      // spatial ambience: fountain in the square, the crowd near the mosque
      const sab = w.spatial({ x: -SQ_HALF + 1, z: (SQ.z0 + SQ.z1) / 2 }, 5);
      this.water.set('gain', 0.04 * sab.gain, 0.2);
      const toEnd = U.smooth(-30, LANE_END, w.pos.z);
      this.crowd.set('gain', 0.06 * toEnd, 0.5);
      this.cooClock -= dt;
      if (this.cooClock < 0) { this.cooClock = 4 + Math.random() * 6; SND.coo(env.bus, { gain: 0.03 }); }

      if (!this.reached && w.pos.z < LANE_END + 2) {
        this.reached = true;
        SND.glow(env.bus, 146.83, { gain: 0.07, dur: 10 });
        SND.glow(env.bus, 220, { gain: 0.05, dur: 10, delay: 0.8 });
        w.say('The Green Dome', 'At the end of the lane the city opens onto the mosque. The dome over the resting place of the Prophet ﷺ was first built in 1279 and has been painted green since the nineteenth century.', { ms: 13000 });
        env.complete(); this.unlockSoon();
      }
      if (this.reached) this.domeLight.intensity = U.damp(this.domeLight.intensity, 4, 0.8, dt);
    },
  }));
})();
