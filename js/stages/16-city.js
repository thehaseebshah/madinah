/* Station XVI — The City of Light (walkable).
   The marble courtyard of the Prophet's Mosque before dawn, its giant umbrellas furled like buds.
   Open them to the morning, walk in their shade while the day passes over, and stay as they fold
   at sunset and the lamps come on beneath the Green Dome. Doves scatter as you walk. */
(function () {
  'use strict';
  if (!window.WORLD) return;
  const H0 = 14, SP = 26, WALL_Z = -140;
  const SKY = {
    top: [[0, '#141a3a'], [0.2, '#5d86c0'], [0.5, '#4a88d0'], [0.74, '#3a4a88'], [0.86, '#141838'], [1, '#05070f']],
    mid: [[0, '#e8a080'], [0.2, '#f4dcc0'], [0.5, '#cfe4f4'], [0.74, '#f69a5c'], [0.86, '#6a3a58'], [1, '#121834']],
  };
  const hex = c => new THREE.Color(U.rgb(c));

  ENGINE.register(WORLD.stage({
    key: 'city',
    arabic: 'المدينة المنوّرة',
    title: 'The City of Light',
    era: 'Madinah today · from dawn to night · walk the courtyard',
    hint: 'WASD to walk · E at a column to open the umbrellas · walk among the doves',
    sound: { reverb: 0.4 },
    story: `<p>Around the Prophet’s Mosque, 250 giant umbrellas stand in the marble courtyards. Each opens to about 25 metres across, and together they shade the worshippers through the heat of the day. At evening they fold away and the courtyards are lit for the night.</p>
            <p>Millions come each year. The village oasis of Yathrib has become <i>al-Madinah al-Munawwarah</i>: the Illuminated City.</p>`,

    enter(env) {
      const T = THREE, self = this;
      const w = this.w = WORLD.create(env, {
        start: { x: 13, z: 16, yaw: 0.05, pitch: 0.18 }, exposure: 1.0, far: 1500,
        fog: { color: 0xe8b090, density: 0.0035 },
        bounds: [-90, WALL_Z + 3, 90, 30], surface: () => 'marble',
      });
      const S = w.scene;
      this.tau = 0.03; this.phase = 'dawn'; this.phaseT = 0;
      this.skyM = w.sky({ top: '#141a3a', mid: '#e8a080', bot: '#3a3040', sunDir: [0.9, 0.05, 0.2], sun: '#ffb070', sunSize: 0.0016, stars: 0.6 });
      this.hemi = new T.HemisphereLight(0xffe0c0, 0x6a5a50, 0.5); S.add(this.hemi);
      this.sun = new T.DirectionalLight(0xffd0a0, 1.5); this.sun.position.set(60, 10, 20); S.add(this.sun);
      w.followShadow(this.sun, 45, 2048);

      // polished marble with grey veins and tile joints
      const marble = w.tex(1024, (g, s) => {
        g.fillStyle = '#f2efe8'; g.fillRect(0, 0, s, s);
        g.strokeStyle = 'rgba(120,118,112,0.22)';
        for (let i = 0; i < 40; i++) { g.lineWidth = 0.5 + Math.random() * 1.8; g.beginPath(); let x = Math.random() * s, y = Math.random() * s; g.moveTo(x, y); for (let k = 0; k < 14; k++) { x += (Math.random() - 0.3) * 50; y += (Math.random() - 0.5) * 30; g.lineTo(x, y); } g.stroke(); }
        g.strokeStyle = 'rgba(150,140,128,0.5)'; g.lineWidth = 2;
        for (let i = 0; i <= s; i += s / 4) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, s); g.stroke(); g.beginPath(); g.moveTo(0, i); g.lineTo(s, i); g.stroke(); }
        // inlaid bands of darker stone every few tiles
        g.fillStyle = 'rgba(150,120,90,0.35)'; g.fillRect(0, s / 2 - 6, s, 12); g.fillRect(s / 2 - 6, 0, 12, s);
      }, [26, 26]);
      this.floorMat = KIT.std({ map: marble, color: 0xe4e0d8, roughness: 0.3, metalness: 0.0, relief: 0 });
      const floor = new T.Mesh(new T.PlaneGeometry(208, 208), this.floorMat);
      floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, -52); S.add(floor);

      // the umbrellas
      const fabricTex = w.tex(256, (g, s) => { g.fillStyle = '#f6f2ea'; g.fillRect(0, 0, s, s); g.strokeStyle = 'rgba(180,170,150,0.25)'; for (let i = 0; i < s; i += 4) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, s); g.stroke(); } }, [4, 4]);
      this.fabric = KIT.std({ map: fabricTex, side: T.DoubleSide, roughness: 0.85, emissive: 0xffc080, emissiveIntensity: 0, relief: 0 });
      const colTex = KIT.plaster(w, [1, 4], '#ece6da');
      const colMat = KIT.std({ map: colTex, roughness: 0.4, relief: 0.01 });
      const brass = KIT.std({ color: 0xd0a85a, metalness: 0.95, roughness: 0.28 });
      this.lampMat = KIT.std({ color: 0xfff0d0, emissive: 0xffc070, emissiveIntensity: 0, roughness: 0.4 });
      this.umbrellas = [];
      for (let r = 0; r < 5; r++) for (let c = 0; c < 6; c++) {
        const x = -65 + c * SP, z = -6 - r * SP;
        const col = new T.Mesh(new T.CylinderGeometry(0.55, 0.7, H0, 20), colMat); col.position.set(x, H0 / 2, z); S.add(col);
        const base = new T.Mesh(new T.CylinderGeometry(1.05, 1.15, 0.6, 24), brass); base.position.set(x, 0.3, z); S.add(base);
        const cap = new T.Mesh(new T.CylinderGeometry(0.9, 0.6, 0.8, 24), brass); cap.position.set(x, H0 - 0.2, z); S.add(cap);
        const lamp = new T.Mesh(new T.CylinderGeometry(0.62, 0.62, 0.5, 20), this.lampMat); lamp.position.set(x, 4.2, z); S.add(lamp);
        w.addCircle(x, z, 1.2);
        const geo = new T.BufferGeometry();
        geo.setAttribute('position', new T.BufferAttribute(new Float32Array(17 * 3), 3));
        const idx = []; for (let i = 1; i <= 16; i++) idx.push(0, i, (i % 16) + 1);
        geo.setIndex(idx);
        const canopy = new T.Mesh(geo, this.fabric); canopy.position.set(x, H0, z); canopy.castShadow = true; canopy.receiveShadow = true;
        canopy.frustumCulled = false; canopy.userData.dynamic = true; S.add(canopy);
        const ribs = new T.LineSegments(new T.BufferGeometry().setAttribute('position', new T.BufferAttribute(new Float32Array(16 * 3), 3)), new T.LineBasicMaterial({ color: 0xb8ac98 }));
        ribs.position.copy(canopy.position); ribs.frustumCulled = false; ribs.userData.dynamic = true; S.add(ribs);
        const glow = KIT.glow(w, 0xffc878, 9, 0); glow.position.set(x, 4.2, z); S.add(glow);
        const u = { x, z, open: 0, target: 0, delay: -1, canopy, ribs, glow, ph: Math.random() * 6 };
        this.umbrellas.push(u); this.shape(u);
        w.interact({ key: `u${r}${c}`, pos: [x, 2, z], r: 4.5, label: 'Open the umbrellas', enabled: () => self.phase === 'dawn', onUse: () => self.openFrom(env, u) });
      }

      // the mosque: arcade wall, minarets and the Green Dome
      const arcTex = w.tex(512, (g, s) => {
        g.fillStyle = '#e6dccb'; g.fillRect(0, 0, s, s);
        for (let i = 0; i < 4; i++) {
          const x = i * 128 + 64; g.fillStyle = '#5a4630';
          g.beginPath(); g.moveTo(x - 40, s); g.lineTo(x - 40, s * 0.42); g.quadraticCurveTo(x - 40, s * 0.18, x, s * 0.12); g.quadraticCurveTo(x + 40, s * 0.18, x + 40, s * 0.42); g.lineTo(x + 40, s); g.fill();
          g.strokeStyle = '#c8a050'; g.lineWidth = 5; g.stroke();
        }
        g.fillStyle = '#c8b89a'; g.fillRect(0, 0, s, 18);
      }, [24, 1]);
      this.arcLit = KIT.std({ map: arcTex, emissive: 0xffc070, emissiveMap: arcTex, emissiveIntensity: 0, relief: 0 });
      const wall = new T.Mesh(new T.BoxGeometry(220, 22, 6), this.arcLit); wall.position.set(0, 11, WALL_Z - 3); S.add(wall);
      w.addBox(-110, WALL_Z - 6, 110, WALL_Z);
      const gd = KIT.greenDome(w, 1.5); gd.position.set(-22, 22, WALL_Z - 16); S.add(gd);
      this.domeLight = new T.PointLight(0x80ffc0, 0, 60, 2); this.domeLight.position.set(-22, 46, WALL_Z - 2); S.add(this.domeLight);
      this.minarets = [];
      [[-95, -4], [-45, -10], [30, -10], [95, -4]].forEach(([x, dz]) => { const m = KIT.minaret(w, 96, true); m.position.set(x, 0, WALL_Z - 8 + dz); S.add(m); this.minarets.push(m); });
      // the rest of the city around the courtyard
      const r0 = U.seeded(250);
      for (let i = 0; i < 30; i++) {
        const side = i % 2 ? 1 : -1, hgt = 30 + r0() * 50;
        const b = new T.Mesh(new T.BoxGeometry(24, hgt, 24), KIT.std({ color: 0xd8d0c4, roughness: 0.6 }));
        b.position.set(side * (118 + r0() * 30), hgt / 2, -170 + (i >> 1) * 22); S.add(b);
      }

      // doves walking on the marble
      this.doves = [];
      const doveGeo = new T.SphereGeometry(0.13, 10, 8); doveGeo.scale(1.6, 1, 1);
      this.doveMesh = new T.InstancedMesh(doveGeo, KIT.std({ color: 0x9a9aa4, roughness: 0.7 }), 70);
      this.doveMesh.userData.dynamic = true; this.doveMesh.castShadow = true; S.add(this.doveMesh);
      for (let i = 0; i < 70; i++) {
        const cx = U.rnd(-30, 40), cz = U.rnd(-40, 12);
        this.doves.push({ x: cx, y: 0.12, z: cz, a: Math.random() * 6.28, state: 'ground', vx: 0, vy: 0, vz: 0, t: Math.random() * 5, ph: Math.random() * 6 });
      }
      this.doveM4 = new T.Matrix4(); this.doveQ = new T.Quaternion(); this.doveS = new T.Vector3(1, 1, 1);

      // points of light that walk the courtyard at night
      const n = 900, pp = new Float32Array(n * 3);
      this.walkers = [];
      for (let i = 0; i < n; i++) { const q = { x: U.rnd(-90, 90), z: U.rnd(WALL_Z + 4, 28), a: Math.random() * 6.28, v: 0.5 + Math.random() * 0.8 }; this.walkers.push(q); pp.set([q.x, 1.1, q.z], i * 3); }
      const wg = new T.BufferGeometry(); wg.setAttribute('position', new T.BufferAttribute(pp, 3));
      this.walkPts = new T.Points(wg, new T.PointsMaterial({ map: KIT.glowTex(w), color: 0xffe0a8, size: 0.7, transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending }));
      this.walkPts.frustumCulled = false; S.add(this.walkPts);

      w.receiveAll();
      this.baked = w.bake();
      this.setSky(true);

      w.interact({
        key: 'gate', pos: [-22, 3, WALL_Z], r: 9, once: true, label: 'Stand before Bab as-Salam',
        enabled: () => self.phase === 'night',
        onUse: () => {
          SND.glow(env.bus, 130.81, { gain: 0.07, dur: 10 }); SND.glow(env.bus, 196, { gain: 0.05, dur: 10, delay: 1 });
          w.say('Bab as-Salam', 'Visitors enter the mosque by Bab as-Salam, the Gate of Peace, and walk to the place where the Prophet ﷺ is buried to send him their greeting of peace, as believers have done for fourteen centuries.', { ar: 'السَّلامُ عَلَيْكَ يَا رَسُولَ اللَّه', ms: 14000 });
        },
      });

      const b = env.bus;
      this.crowd = SND.noise(b, { color: 'pink', type: 'bandpass', freq: 480, q: 1.2, gain: 0.02 });
      this.crowd2 = SND.noise(b, { color: 'brown', type: 'bandpass', freq: 260, q: 1, gain: 0.04, pan: -0.3 });
      SND.lfo(b, this.crowd.filter && this.crowd.filter.frequency, 0.21, 80);
      this.air = SND.noise(b, { color: 'pink', type: 'highpass', freq: 2200, gain: 0.005 });
      this.birdClock = 1; this.envClock = 0;
    },

    // canopy vertices for an opening between 0 (furled) and 1 (open)
    shape(u) {
      const o = U.ease(u.open), p = u.canopy.geometry.attributes.position, rp = u.ribs.geometry.attributes.position;
      p.setXYZ(0, 0, 0.3, 0);
      const tips = [];
      for (let k = 0; k < 8; k++) {
        const corner = k % 2 === 1, a = (k * Math.PI) / 4;
        const L = corner ? 18.97 : 13.55, th = o * (corner ? 1.25 : 1.22);
        const hr = Math.sin(th) * L + (1 - o) * 0.9, vy = Math.cos(th) * L * U.lerp(0.42, 1, o);
        tips.push([Math.cos(a) * hr, vy, Math.sin(a) * hr]);
      }
      for (let k = 0; k < 8; k++) {
        const a = tips[k], b = tips[(k + 1) % 8];
        p.setXYZ(1 + k * 2, a[0], a[1], a[2]);
        p.setXYZ(2 + k * 2, (a[0] + b[0]) / 2 * 0.95, (a[1] + b[1]) / 2 - 1.1 * o, (a[2] + b[2]) / 2 * 0.95);
        rp.setXYZ(k * 2, 0, 0.3, 0); rp.setXYZ(k * 2 + 1, a[0], a[1], a[2]);
      }
      p.needsUpdate = true; rp.needsUpdate = true;
      u.canopy.geometry.computeVertexNormals();
    },

    openFrom(env, from) {
      for (const u of this.umbrellas) { u.target = 1; u.delay = Math.hypot(u.x - from.x, u.z - from.z) / 14; }
      this.phase = 'opening'; this.phaseT = 0;
      SND.glow(env.bus, 146.83, { gain: 0.05, dur: 8 });
      this.w.say('Opening to the Morning', 'Each umbrella unfolds its arms in about three minutes in life, its canopy rising like a flower. Together they shade more than 140,000 square metres of courtyard.', { ms: 10000 });
    },

    setSky(force) {
      const w = this.w, T = THREE, tau = this.tau;
      const ang = U.clamp((tau - 0.05) / 0.8) * Math.PI; // sunrise in the east (+x), sunset in the west
      const sunDir = new T.Vector3(Math.cos(ang), Math.max(-0.2, Math.sin(ang) * 0.85), 0.25).normalize();
      const u = this.skyM.material.uniforms;
      u.uTop.value.copy(hex(U.ramp(SKY.top, tau))); u.uMid.value.copy(hex(U.ramp(SKY.mid, tau))); u.uBot.value.copy(hex(U.ramp(SKY.mid, tau))).multiplyScalar(0.4);
      u.uSunDir.value.copy(sunDir);
      const warm = 1 - Math.abs(Math.sin(ang));
      u.uSun.value.copy(hex(U.mix([255, 250, 235], [255, 140, 70], warm))).multiplyScalar(sunDir.y > -0.05 ? 1 : 0);
      this.night = U.smooth(0.8, 0.95, tau);
      u.uStars.value = 0.2 + this.night;
      this.sun.position.copy(sunDir).multiplyScalar(100);
      this.sun.intensity = Math.max(0, sunDir.y) * 2.6 + 0.05;
      this.sun.color.copy(hex(U.mix([255, 240, 220], [255, 150, 90], warm)));
      this.hemi.intensity = U.lerp(0.55, 0.22, this.night);
      this.hemi.color.copy(hex(U.ramp(SKY.top, tau))).lerp(new T.Color(0xffffff), 0.4);
      w.scene.fog.color.copy(hex(U.ramp(SKY.mid, tau))).multiplyScalar(0.9);
      w._shadow.off.copy(sunDir).multiplyScalar(110);
    },

    update(env, dt) {
      const w = this.w; if (!w) return;
      w.update(dt);
      const t = w.time;
      this.phaseT += dt;
      let opened = 0, moving = false;
      for (const u of this.umbrellas) {
        if (u.delay > 0) { u.delay -= dt; continue; }
        const before = u.open;
        u.open += U.clamp(u.target - u.open, -dt / 4.5, dt / 4.5);
        if (u.open !== before) { this.shape(u); moving = true; if ((before === 0 || before === 1) && Math.random() < 0.5) { const sp = w.spatial(u, 20); SND.swell(env.bus, { color: 'pink', type: 'bandpass', f0: u.target ? 220 : 800, f1: u.target ? 900 : 220, dur: 4, gain: 0.05 * sp.gain + 0.005, pan: sp.pan, q: 2 }); } }
        opened += u.open;
        const lamp = this.night;
        u.glow.material.opacity = 0.55 * lamp * (0.9 + 0.1 * Math.sin(t * 2 + u.ph));
      }
      const frac = opened / this.umbrellas.length;
      if (this.phase === 'dawn') this.tau = U.damp(this.tau, 0.09, 0.5, dt);
      else if (this.phase === 'opening') { this.tau = U.damp(this.tau, 0.12 + frac * 0.3, 0.8, dt); if (frac > 0.99 && this.phaseT > 6) { this.phase = 'day'; this.phaseT = 0; } }
      else if (this.phase === 'day') { this.tau = Math.min(1, this.tau + dt / 40); if (this.tau > 0.77) { this.phase = 'dusk'; for (const u of this.umbrellas) { u.target = 0; u.delay = Math.hypot(u.x - w.pos.x, u.z - w.pos.z) / 18; } w.say('Evening', 'At sunset the umbrellas fold away, the lamps come on, and the courtyard fills for the evening prayers.', { ms: 9000 }); } }
      else if (this.phase === 'dusk') { this.tau = Math.min(1, this.tau + dt / 18); if (this.tau >= 1) { this.phase = 'night'; env.complete(); env.hint('Walk to the mosque and stand before Bab as-Salam'); SND.glow(env.bus, 110, { gain: 0.06, dur: 10 }); } }
      if (this.phase !== 'night' || this.tauLast !== this.tau) { this.setSky(false); this.tauLast = this.tau; }

      const N = this.night;
      this.lampMat.emissiveIntensity = 2.4 * N; this.fabric.emissiveIntensity = 0.12 * N; this.arcLit.emissiveIntensity = 0.9 * N;
      this.domeLight.intensity = 6 * N;
      this.floorMat.roughness = U.lerp(0.3, 0.12, N);
      this.walkPts.material.opacity = U.smooth(0.6, 1, N) * 0.95;
      w.renderer.toneMappingExposure = U.lerp(1.0, 1.35, N);

      // the walkers
      const wp = this.walkPts.geometry.attributes.position;
      if (N > 0.05) {
        for (let i = 0; i < this.walkers.length; i++) {
          const q = this.walkers[i];
          q.a += U.noise1(i * 0.37 + t * 0.1) * 0.5 * dt; q.x += Math.cos(q.a) * q.v * dt; q.z += (Math.sin(q.a) * 0.4 - 0.35) * q.v * dt;
          if (q.z < WALL_Z + 3) q.z = 28; if (q.x > 92) q.x = -92; if (q.x < -92) q.x = 92;
          wp.setXYZ(i, q.x, 1.0 + Math.sin(t * 2 + i) * 0.03, q.z);
        }
        wp.needsUpdate = true;
      }

      // doves: peck and wander, and burst into the air when you come close
      const M = this.doveM4, Q = this.doveQ, Sv = this.doveS;
      for (let i = 0; i < this.doves.length; i++) {
        const d = this.doves[i];
        d.t -= dt;
        const dist = Math.hypot(d.x - w.pos.x, d.z - w.pos.z);
        if (d.state === 'ground') {
          if (d.t < 0) { d.t = 0.5 + Math.random() * 2; d.a += (Math.random() - 0.5) * 2; }
          d.x += Math.cos(d.a) * 0.15 * dt; d.z += Math.sin(d.a) * 0.15 * dt;
          d.y = 0.12 + Math.abs(Math.sin(t * 6 + d.ph)) * 0.02;
          if (dist < 3.2 && w.moving > 0.3) {
            d.state = 'fly'; d.t = 3 + Math.random() * 3;
            const away = Math.atan2(d.z - w.pos.z, d.x - w.pos.x) + (Math.random() - 0.5);
            d.vx = Math.cos(away) * U.rnd(3, 6); d.vz = Math.sin(away) * U.rnd(3, 6); d.vy = U.rnd(3, 5);
            if (!this.flapCool || this.flapCool < t) {
              this.flapCool = t + 0.4;
              const sp = w.spatial(d, 4);
              for (let k = 0; k < 10; k++) SND.swell(env.bus, { color: 'white', type: 'bandpass', f0: 900, f1: 2200, dur: 0.08, gain: 0.05 * sp.gain, delay: k * 0.06, q: 1.5, pan: sp.pan });
            }
          }
        } else {
          d.vy -= (d.t > 1.2 ? -0.2 : 4) * dt; d.x += d.vx * dt; d.y += d.vy * dt; d.z += d.vz * dt;
          if (d.y <= 0.12 && d.t < 1.2) { d.y = 0.12; d.state = 'ground'; d.t = 2; }
          if (d.y > 30) d.vy = -1;
        }
        Q.setFromAxisAngle(THREE.Object3D.DefaultUp, -Math.atan2(d.state === 'fly' ? d.vz : Math.sin(d.a), d.state === 'fly' ? d.vx : Math.cos(d.a)));
        Sv.set(1, d.state === 'fly' ? 0.6 + Math.abs(Math.sin(t * 22 + i)) * 0.8 : 1, 1);
        M.compose(new THREE.Vector3(d.x, d.y, d.z), Q, Sv); this.doveMesh.setMatrixAt(i, M);
      }
      this.doveMesh.instanceMatrix.needsUpdate = true;

      this.crowd.set('gain', 0.02 + N * 0.05, 1); this.crowd2.set('gain', 0.04 + N * 0.04, 1);
      this.birdClock -= dt;
      if (this.birdClock < 0) { this.birdClock = 1 + Math.random() * 3; if (N < 0.5) (Math.random() < 0.6 ? SND.coo(env.bus, { gain: 0.035 }) : SND.chirp(env.bus, { gain: 0.016 })); else if (Math.random() < 0.3) SND.cricket(env.bus, { gain: 0.004 }); }
      void moving;
    },

    finale(env) {
      if (!this.w) return;
      for (const d of this.doves) { d.state = 'fly'; d.t = 6; d.vx = U.rnd(-3, 3); d.vz = U.rnd(-6, -2); d.vy = U.rnd(3, 6); }
      for (let k = 0; k < 24; k++) SND.swell(env.bus, { color: 'white', type: 'bandpass', f0: 900, f1: 2200, dur: 0.09, gain: 0.05, delay: k * 0.05, q: 1.5, pan: U.rnd(-0.7, 0.7) });
    },
  }));
})();
