/* Station XIII — The Hejaz Railway (walkable).
   Madinah station, 1908: a long building of black basalt banded with pale stone, an arcade of
   pointed arches on the platform, the minarets of the Prophet's Mosque on the skyline.
   Ring the station bell and the train from Damascus comes in, under steam. */
(function () {
  'use strict';
  if (!window.WORLD) return;
  const PLAT_Y = 0, RAIL_Y = -0.95, FACE_Z = -11, STOP_X = 6;

  ENGINE.register(WORLD.stage({
    key: 'railway',
    arabic: 'سِكّةُ حَدِيدِ الحِجَاز',
    title: 'The Hejaz Railway',
    era: 'Madinah station · 1908 · walk the platform',
    hint: 'WASD to walk · E to ring the bell, read the board and meet the train',
    sound: { reverb: 0.35 },
    story: `<p>Between 1900 and 1908 the Ottoman state built a railway of some 1,300 kilometres from Damascus to Madinah, paid for largely by donations from Muslims across the world. A pilgrimage that took forty days by caravan now took a few days by train.</p>
            <p>The line ran for only about a decade before it was wrecked in the First World War. The station in Madinah still stands, now a museum. Ring the bell and wait for the train.</p>`,

    enter(env) {
      const T = THREE, self = this;
      const w = this.w = WORLD.create(env, {
        start: { x: -14, z: -4.5, yaw: -Math.PI / 2 + 0.25 }, exposure: 1.0,
        fog: { color: 0xe8c8a0, density: 0.0065 },
        bounds: [-48, FACE_Z + 0.4, 48, -1.9],
        surface: (x, z) => (z < -8.2 ? 'marble' : 'stone'),
      });
      const S = w.scene;
      const sunDir = new T.Vector3(0.7, 0.42, 0.55).normalize();
      w.sky({ top: '#5d86c0', mid: '#f3d2a4', bot: '#c8a070', sunDir: sunDir.toArray(), sun: '#ffd7a0', sunSize: 0.0016 });
      S.add(new T.HemisphereLight(0xffe0b8, 0x7a5a40, 0.6));
      const sun = new T.DirectionalLight(0xffd29a, 2.3); sun.position.copy(sunDir).multiplyScalar(50); S.add(sun);

      // materials
      const basaltTex = KIT.basalt(w, [6, 2]);
      const basalt = KIT.std({ map: basaltTex, color: 0xa09894, relief: 0.06 });
      const paleTex = KIT.plaster(w, [4, 1], '#e8dcc6');
      const pale = KIT.std({ map: paleTex, color: 0xffffff, relief: 0.03 });
      const woodGreen = KIT.std({ map: KIT.wood(w, [2, 1], '#2f4a38'), color: 0xa8c0a8, roughness: 0.7 });
      const iron = KIT.std({ color: 0x1a1a1c, metalness: 0.6, roughness: 0.45 });
      const brass = KIT.std({ color: 0xc89a48, metalness: 0.9, roughness: 0.3 });

      // ground, ballast and the platform
      const ground = new T.Mesh(new T.PlaneGeometry(600, 300), KIT.std({ map: KIT.sand(w, [90, 45]), color: 0xe0c8a8 }));
      ground.rotation.x = -Math.PI / 2; ground.position.y = RAIL_Y - 0.05; S.add(ground);
      const ballast = new T.Mesh(new T.BoxGeometry(600, 0.3, 5), KIT.std({ map: KIT.basalt(w, [120, 1]), color: 0x8a8480 }));
      ballast.position.set(0, RAIL_Y - 0.12, 1.2); S.add(ballast);
      const sleeperMat = KIT.std({ map: KIT.wood(w, [1, 1], '#4a3626'), color: 0x9a8070 });
      const sleepers = new T.InstancedMesh(new T.BoxGeometry(0.25, 0.14, 2.6), sleeperMat, 700);
      const mtx = new T.Matrix4();
      for (let i = 0; i < 700; i++) { mtx.makeTranslation(-300 + i * 0.86, RAIL_Y + 0.05, 1.2); sleepers.setMatrixAt(i, mtx); }
      sleepers.userData.dynamic = true; S.add(sleepers);
      [0.48, 1.92].forEach(z => { const r = new T.Mesh(new T.BoxGeometry(600, 0.13, 0.08), KIT.std({ color: 0x8a8a90, metalness: 0.85, roughness: 0.35 })); r.position.set(0, RAIL_Y + 0.18, z); S.add(r); });
      const plat = new T.Mesh(new T.BoxGeometry(100, 1.0, 9.6), KIT.std({ map: KIT.plaster(w, [20, 2], '#cfc2aa'), relief: 0.02 }));
      plat.position.set(0, PLAT_Y - 0.5, -6.6); S.add(plat);
      const edge = new T.Mesh(new T.BoxGeometry(100, 0.12, 0.5), pale); edge.position.set(0, PLAT_Y - 0.05, -1.95); S.add(edge);
      // platform flagstones
      const flags = w.tex(512, (g, s) => { g.fillStyle = '#cdbfa6'; g.fillRect(0, 0, s, s); for (let y = 0; y < s; y += 64) for (let x = 0; x < s; x += 128) { const t = Math.random() * 30; g.fillStyle = `rgb(${200 + t | 0},${186 + t | 0},${160 + t | 0})`; g.fillRect(x + (y / 64 % 2) * 64 + 2, y + 2, 124, 60); } }, [40, 4]);
      const top = new T.Mesh(new T.PlaneGeometry(100, 9.2), KIT.std({ map: flags, roughness: 0.8, relief: 0.03 })); top.rotation.x = -Math.PI / 2; top.position.set(0, PLAT_Y + 0.003, -6.6); S.add(top);

      // the station building: banded basalt, pointed-arch windows, a taller central pavilion
      const archShape = (wd, h) => { const s = new T.Path(); const r = wd * 0.62; s.moveTo(-wd / 2, 0); s.lineTo(-wd / 2, h - wd * 0.55); s.quadraticCurveTo(-wd / 2, h, 0, h + wd * 0.12); s.quadraticCurveTo(wd / 2, h, wd / 2, h - wd * 0.55); s.lineTo(wd / 2, 0); s.lineTo(-wd / 2, 0); void r; return s; };
      const facade = (x0, x1, h, z, winH) => {
        const shape = new T.Shape(); shape.moveTo(x0, 0); shape.lineTo(x1, 0); shape.lineTo(x1, h); shape.lineTo(x0, h); shape.lineTo(x0, 0);
        const holes = [];
        for (let x = x0 + 2.5; x < x1 - 1.5; x += 3.6) {
          [[1.0, 2.2, winH], [5.2, 1.6, winH * 0.8]].forEach(([y, wd, wh]) => {
            if (y + wh + 0.6 > h) return;
            const p = archShape(wd, wh); const pts = p.getPoints(10).map(v => new T.Vector2(v.x + x, v.y + y));
            holes.push(new T.Path(pts));
          });
        }
        shape.holes = holes;
        const g = new T.ExtrudeGeometry(shape, { depth: 0.7, bevelEnabled: false });
        const m = new T.Mesh(g, basalt); m.position.z = z - 0.7; S.add(m);
        // window glass recessed behind
        const back = new T.Mesh(new T.PlaneGeometry(x1 - x0, h), KIT.std({ color: 0x1a1612, roughness: 0.4 })); back.position.set((x0 + x1) / 2, h / 2, z - 0.72); S.add(back);
        // pale stone string courses and cornice
        [0.6, 4.6, h - 0.3].forEach(y => { const b = new T.Mesh(new T.BoxGeometry(x1 - x0 + 0.4, 0.35, 0.95), pale); b.position.set((x0 + x1) / 2, y, z - 0.35); S.add(b); });
        for (let x = x0 + 0.4; x < x1; x += 0.9) { const c = new T.Mesh(new T.BoxGeometry(0.45, 0.5, 0.75), basalt); c.position.set(x, h + 0.25, z - 0.4); S.add(c); }
        // the roof mass behind the wall
        const body = new T.Mesh(new T.BoxGeometry(x1 - x0, h - 0.1, 12), basalt); body.position.set((x0 + x1) / 2, (h - 0.1) / 2, z - 6.7); S.add(body);
      };
      facade(-42, -6, 8.4, FACE_Z, 2.6);
      facade(6, 42, 8.4, FACE_Z, 2.6);
      facade(-6, 6, 11.5, FACE_Z + 0.6, 3.2);
      w.addBox(-60, FACE_Z - 14, 60, FACE_Z); w.addBox(-6, FACE_Z, 6, FACE_Z + 0.6);
      // clock on the pavilion
      const clock = new T.Group(); clock.position.set(0, 9.2, FACE_Z + 0.65);
      const faceTex = w.tex(256, (g, s) => {
        g.fillStyle = '#f4ecd8'; g.beginPath(); g.arc(s / 2, s / 2, s / 2 - 4, 0, 6.283); g.fill();
        g.strokeStyle = '#2a2018'; g.lineWidth = 6; g.stroke(); g.fillStyle = '#2a2018'; g.font = 'bold 28px Amiri, serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
        const nums = ['١٢', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩', '١٠', '١١'];
        nums.forEach((n, i) => { const a = (i / 12) * 6.283 - Math.PI / 2; g.fillText(n, s / 2 + Math.cos(a) * 92, s / 2 + Math.sin(a) * 92); });
      });
      faceTex.wrapS = faceTex.wrapT = T.ClampToEdgeWrapping;
      const face = new T.Mesh(new T.CircleGeometry(0.95, 40), KIT.std({ map: faceTex, roughness: 0.6, relief: 0 })); clock.add(face);
      const rim = new T.Mesh(new T.TorusGeometry(0.98, 0.07, 8, 40), brass); clock.add(rim);
      this.hHand = new T.Mesh(new T.BoxGeometry(0.06, 0.5, 0.02), iron); this.hHand.geometry.translate(0, 0.22, 0.03); clock.add(this.hHand);
      this.mHand = new T.Mesh(new T.BoxGeometry(0.04, 0.78, 0.02), iron); this.mHand.geometry.translate(0, 0.36, 0.04); clock.add(this.mHand);
      clock.userData.dynamic = true; S.add(clock);

      // the arcade along the platform
      const colGeo = new T.CylinderGeometry(0.28, 0.32, 4.2, 14);
      for (let x = -40; x <= 40; x += 4) {
        if (Math.abs(x) < 3) continue;
        const c = new T.Mesh(colGeo, pale); c.position.set(x, 2.1, -8.6); S.add(c); w.addCircle(x, -8.6, 0.34);
        const cap = new T.Mesh(new T.BoxGeometry(0.85, 0.3, 0.85), pale); cap.position.set(x, 4.3, -8.6); S.add(cap);
      }
      // arched beam: one long wall with pointed openings carried on the columns
      const ab = new T.Shape(); ab.moveTo(-42, 0); ab.lineTo(42, 0); ab.lineTo(42, 2.0); ab.lineTo(-42, 2.0); ab.lineTo(-42, 0);
      for (let x = -40; x < 40; x += 4) { const p = archShape(3.3, 1.0); ab.holes.push(new T.Path(p.getPoints(10).map(v => new T.Vector2(v.x + x + 2, v.y)))); }
      const arc = new T.Mesh(new T.ExtrudeGeometry(ab, { depth: 0.6, bevelEnabled: false }), basalt); arc.position.set(0, 4.45, -8.9); S.add(arc);
      const roof = new T.Mesh(new T.BoxGeometry(84, 0.35, 3), pale); roof.position.set(0, 6.6, -9.8); S.add(roof);
      // benches, lamps, a timetable board and the bell
      for (let x = -34; x <= 34; x += 12) {
        const bench = new T.Group(); bench.position.set(x + 2, 0, -9.9);
        const seat = new T.Mesh(new T.BoxGeometry(2.2, 0.08, 0.5), woodGreen); seat.position.y = 0.48; bench.add(seat);
        const backr = new T.Mesh(new T.BoxGeometry(2.2, 0.5, 0.06), woodGreen); backr.position.set(0, 0.8, -0.22); bench.add(backr);
        [-0.95, 0.95].forEach(dx => { const l = new T.Mesh(new T.BoxGeometry(0.06, 0.48, 0.5), iron); l.position.set(dx, 0.24, 0); bench.add(l); });
        S.add(bench); w.addBox(x + 0.9, -10.2, x + 3.1, -9.6);
      }
      for (let x = -30; x <= 30; x += 15) {
        const post = new T.Mesh(new T.CylinderGeometry(0.06, 0.09, 3.6, 8), iron); post.position.set(x, 1.8, -3.2); S.add(post); w.addCircle(x, -3.2, 0.12);
        const lamp = new T.Mesh(new T.CylinderGeometry(0.22, 0.14, 0.45, 6), KIT.std({ color: 0x3a3020, emissive: 0xffc070, emissiveIntensity: 0.25 })); lamp.position.set(x, 3.8, -3.2); S.add(lamp);
      }
      const board = new T.Group(); board.position.set(-8.6, 2.2, FACE_Z + 0.02);
      const boardTex = w.tex(512, (g, s) => {
        g.fillStyle = '#1e2a22'; g.fillRect(0, 0, s, s * 0.6); g.strokeStyle = '#c8a050'; g.lineWidth = 8; g.strokeRect(6, 6, s - 12, s * 0.6 - 12);
        g.fillStyle = '#f0e6c8'; g.textAlign = 'center'; g.font = '34px Amiri, serif'; g.fillText('المدينة — الشام', s / 2, 58);
        g.font = '22px Georgia, serif';
        ['Damascus', 'Dara‘a', 'Amman', 'Ma‘an', 'Tabuk', 'Mada’in Salih', 'al-‘Ula'].forEach((n, k) => {
          g.textAlign = k % 2 ? 'right' : 'left'; g.fillText(n, k % 2 ? s - 40 : 40, 110 + Math.floor(k / 2) * 40);
        });
      });
      boardTex.wrapS = boardTex.wrapT = T.ClampToEdgeWrapping; boardTex.repeat.set(1, 1);
      const bmesh = new T.Mesh(new T.PlaneGeometry(2.4, 1.44), KIT.std({ map: boardTex, relief: 0 })); boardTex.offset.set(0, 0.4); boardTex.repeat.set(1, 0.6); board.add(bmesh); S.add(board);
      const bellG = new T.Group(); bellG.position.set(4.2, 2.6, FACE_Z + 0.75);
      const bracket = new T.Mesh(new T.BoxGeometry(0.06, 0.06, 0.6), iron); bracket.position.z = -0.3; bellG.add(bracket);
      const bell = new T.Mesh(new T.CylinderGeometry(0.08, 0.2, 0.3, 16, 1, true), brass); bell.position.set(0, -0.2, 0); bellG.add(bell);
      bellG.userData.dynamic = true; S.add(bellG); this.bell = bell;

      // palms and the skyline of the city, with the minarets of the mosque
      const r = U.seeded(1908);
      for (let i = 0; i < 26; i++) { const x = -150 + r() * 300, z = 20 + r() * 60; const p = KIT.palm(w, 7 + r() * 6); p.position.set(x, RAIL_Y, z); S.add(p); }
      for (let i = 0; i < 18; i++) { const hgt = 8 + r() * 10; const b = new T.Mesh(new T.BoxGeometry(10 + r() * 14, hgt, 10), KIT.std({ map: paleTex, color: 0xe8dcc8 })); b.position.set(-180 + i * 22, RAIL_Y + hgt / 2, 110 + r() * 30); S.add(b); }
      [-30, 20, 60].forEach(x => { const m = KIT.minaret(w, 60, false); m.position.set(x, RAIL_Y, 170); S.add(m); });
      const gd = KIT.greenDome(w, 1.2); gd.position.set(5, RAIL_Y + 14, 175); S.add(gd);

      // the train
      this.train = this.buildTrain(w);
      this.train.group.position.set(320, RAIL_Y + 0.25, 1.2);
      this.train.group.userData.dynamic = true; S.add(this.train.group);
      this.trainX = 320; this.trainV = 0; this.phase = 'waiting';
      // steam
      this.steam = [];
      this.steamMat = new T.SpriteMaterial({ map: KIT.glowTex(w), color: 0xf2eee8, transparent: true, opacity: 0.6, depthWrite: false });
      this.steamPool = Array.from({ length: 90 }, () => { const s = new T.Sprite(this.steamMat.clone()); s.visible = false; S.add(s); return s; });

      w.followShadow(sun, 30); w.receiveAll();
      this.baked = w.bake();

      /* ---------- interactions ---------- */
      w.count('');
      w.interact({
        key: 'bell', pos: [4.2, 2.4, FACE_Z + 0.75], r: 3, label: () => (self.phase === 'waiting' ? 'Ring the station bell' : 'Ring the bell'),
        onUse: () => {
          self.bellSwing = 1;
          [0, 0.35, 0.7].forEach(d => SND.bell(env.bus, 1320, { gain: 0.08, dur: 2.2, metal: true, delay: d, pan: 0.3 }));
          if (self.phase === 'waiting') { self.phase = 'arriving'; self.trainV = 15; self.whistleSoon = 1.5; w.say('Here She Comes', 'From the north, over the lava fields, the daily train from Damascus. Stand back from the edge.', { ms: 7000 }); }
        },
      });
      w.interact({
        key: 'board', pos: [-8.6, 2.2, FACE_Z], r: 3, once: true, label: 'Read the board',
        onUse: () => w.say('Damascus — Madinah', 'The line ran some 1,300 kilometres south from Damascus, through Dara‘a, Amman, Ma‘an, Tabuk and Mada’in Salih. It was built in eight years, much of it by soldiers and engineers of the Ottoman army, and paid for by gifts from Muslims from Morocco to India.', { ms: 12000 }),
      });
      w.interact({
        key: 'door', pos: new T.Vector3(0, 1.2, -1.2), r: 3.2, once: true, label: 'Greet the pilgrims stepping down',
        enabled: () => self.phase === 'stopped',
        onUse: () => {
          self.doorOpen = 1;
          SND.knock(env.bus, { f: 200, gain: 0.3, click: 900 });
          SND.glow(env.bus, 146.83, { gain: 0.06, dur: 9 });
          w.say('Forty Days into Four', 'For a pilgrim from Damascus the journey had taken some forty days by caravan, through heat and danger. By train it took about four. In its few years the railway carried many thousands of pilgrims to the Prophet’s city.', { ms: 13000 });
          env.complete(); self.unlockSoon();
        },
      });
      this.doorItem = w.items[w.items.length - 1];

      const b = env.bus;
      this.air = SND.noise(b, { color: 'pink', type: 'bandpass', freq: 600, q: 0.5, gain: 0.035 });
      this.city = SND.noise(b, { color: 'brown', type: 'bandpass', freq: 380, q: 1, gain: 0.03 });
      this.chuffN = SND.noise(b, { color: 'white', type: 'bandpass', freq: 900, q: 0.8, gain: 0 });
      this.rumble = SND.noise(b, { color: 'brown', type: 'lowpass', freq: 120, gain: 0 });
      this.chuffT = 0; this.birdClock = 2;
    },

    buildTrain(w) {
      const T = THREE, g = new T.Group();
      const black = KIT.std({ color: 0x141416, metalness: 0.5, roughness: 0.45 });
      const red = KIT.std({ color: 0x8a1c14, metalness: 0.3, roughness: 0.5 });
      const brass = KIT.std({ color: 0xc89a48, metalness: 0.9, roughness: 0.3 });
      const carMat = KIT.std({ map: KIT.wood(w, [3, 1], '#3a2416'), color: 0x9a7a60, roughness: 0.7 });
      const greenCar = KIT.std({ color: 0x2a4434, roughness: 0.6 });
      const glass = KIT.std({ color: 0x302820, emissive: 0xffc070, emissiveIntensity: 0.15, roughness: 0.3 });
      const wheels = [];
      const wheel = (x, z, r) => { const m = new T.Mesh(new T.CylinderGeometry(r, r, 0.12, 20), red); m.rotation.x = Math.PI / 2; m.position.set(x, r, z); g.add(m); wheels.push(m); const hub = new T.Mesh(new T.CylinderGeometry(r * 0.25, r * 0.25, 0.14, 10), black); hub.rotation.x = Math.PI / 2; hub.position.copy(m.position); g.add(hub); };
      // locomotive, facing -x (toward the station)
      const boiler = new T.Mesh(new T.CylinderGeometry(0.75, 0.75, 5.2, 24), black); boiler.rotation.z = Math.PI / 2; boiler.position.set(1.0, 2.0, 0); g.add(boiler);
      const smokebox = new T.Mesh(new T.CylinderGeometry(0.8, 0.8, 1.0, 24), black); smokebox.rotation.z = Math.PI / 2; smokebox.position.set(-2.0, 2.0, 0); g.add(smokebox);
      const doorF = new T.Mesh(new T.CylinderGeometry(0.6, 0.6, 0.08, 24), KIT.std({ color: 0x222224, metalness: 0.6 })); doorF.rotation.z = Math.PI / 2; doorF.position.set(-2.54, 2.0, 0); g.add(doorF);
      const chimney = new T.Mesh(new T.CylinderGeometry(0.28, 0.2, 1.1, 14), black); chimney.position.set(-1.9, 3.2, 0); g.add(chimney);
      const dome = new T.Mesh(new T.SphereGeometry(0.4, 16, 10, 0, 6.283, 0, Math.PI / 2), brass); dome.position.set(0.6, 2.7, 0); g.add(dome);
      [-0.45, 0.45].forEach(z => { const fr = new T.Mesh(new T.BoxGeometry(5.6, 0.12, 0.5), red); fr.position.set(0.6, 1.2, z * 2.4); g.add(fr); });
      const cab = new T.Mesh(new T.BoxGeometry(2.0, 2.2, 2.4), black); cab.position.set(4.3, 2.4, 0); g.add(cab);
      const cabRoof = new T.Mesh(new T.BoxGeometry(2.4, 0.15, 2.8), black); cabRoof.position.set(4.3, 3.55, 0); g.add(cabRoof);
      const lampF = new T.Mesh(new T.SphereGeometry(0.18, 12, 8), KIT.std({ color: 0xfff0c0, emissive: 0xffd080, emissiveIntensity: 1.2 })); lampF.position.set(-2.6, 2.95, 0); g.add(lampF);
      const catcher = new T.Mesh(new T.ConeGeometry(0.9, 1.1, 4), red); catcher.rotation.z = Math.PI / 2; catcher.rotation.x = Math.PI / 4; catcher.position.set(-2.9, 0.6, 0); g.add(catcher);
      [-1.4, 0.2, 1.8, 3.4].forEach((x, i) => [-0.75, 0.75].forEach(z => wheel(x, z, i ? 0.72 : 0.45)));
      const rod = new T.Mesh(new T.BoxGeometry(3.4, 0.1, 0.05), KIT.std({ color: 0xaaaaaa, metalness: 0.9, roughness: 0.3 })); rod.position.set(1.0, 0.72, 0.86); g.add(rod);
      // tender
      const tender = new T.Mesh(new T.BoxGeometry(3.2, 1.8, 2.4), black); tender.position.set(7.2, 1.9, 0); g.add(tender);
      [6.2, 8.2].forEach(x => [-0.75, 0.75].forEach(z => wheel(x, z, 0.5)));
      // carriages
      for (let c = 0; c < 3; c++) {
        const x0 = 10.6 + c * 12.4;
        const body = new T.Mesh(new T.BoxGeometry(12, 2.5, 2.7), c === 1 ? greenCar : carMat); body.position.set(x0 + 6, 2.35, 0); g.add(body);
        const rf = new T.Mesh(new T.CylinderGeometry(1.5, 1.5, 12.2, 16, 1, false, Math.PI / 2 - 0.9, 1.8), KIT.std({ color: 0x3a3430 })); rf.rotation.z = Math.PI / 2; rf.position.set(x0 + 6, 2.6, 0); g.add(rf);
        for (let k = 0; k < 7; k++) { const win = new T.Mesh(new T.PlaneGeometry(0.9, 0.8), glass); win.position.set(x0 + 1 + k * 1.6, 2.6, -1.36); win.rotation.y = Math.PI; g.add(win); }
        [x0 + 1.6, x0 + 10.4].forEach(x => [-0.75, 0.75].forEach(z => wheel(x, z, 0.45)));
        if (c === 0) { const door = new T.Mesh(new T.BoxGeometry(0.9, 1.9, 0.06), KIT.std({ color: 0x2a1a10 })); door.position.set(x0 + 11.2, 2.0, -1.37); g.add(door); this.carDoor = door; }
      }
      g.scale.set(1, 1, 1);
      return { group: g, wheels, chimneyTop: new T.Vector3(-1.9, 3.8, 0) };
    },

    whistle(env, gain, pan) {
      const A = SND; if (!A.ctx) return;
      const ctx = A.ctx, t = A.now(), dest = env.bus.input; if (!dest) return;
      const p = ctx.createStereoPanner(); p.pan.value = pan; p.connect(dest);
      [466, 554, 698].forEach((f, i) => {
        const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(f * 0.94, t); o.frequency.linearRampToValueAtTime(f, t + 0.25);
        const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f * 2; bp.Q.value = 3;
        const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(gain / 3, t + 0.2); g.gain.setValueAtTime(gain / 3, t + 1.6); g.gain.exponentialRampToValueAtTime(0.0001, t + 2.3);
        o.connect(bp); bp.connect(g); g.connect(p); o.start(t); o.stop(t + 2.4);
      });
      SND.swell(env.bus, { color: 'white', type: 'bandpass', f0: 2000, f1: 3000, dur: 2.3, gain: gain * 0.3, pan, q: 2 });
    },

    puff(pos, big) {
      const s = this.steamPool.find(x => !x.visible); if (!s) return;
      s.visible = true; s.position.copy(pos); s.userData = { life: 0, max: big ? 4 : 2.4, vy: big ? 1.6 : 2.4, vx: U.rnd(-0.4, 0.4) + 1.2, s0: big ? 1.5 : 0.7 };
      s.scale.setScalar(s.userData.s0); s.material.opacity = 0.65;
    },

    update(env, dt) {
      const w = this.w; if (!w) return;
      w.update(dt);
      const t = w.time;
      // clock hands show late afternoon, ticking on
      const minutes = 16 * 60 + 42 + t / 60;
      this.mHand.rotation.z = -((minutes % 60) / 60) * 6.283; this.hHand.rotation.z = -(((minutes / 60) % 12) / 12) * 6.283;
      this.bellSwing = Math.max(0, (this.bellSwing || 0) - dt * 0.8);
      this.bell.rotation.x = Math.sin(t * 14) * 0.4 * this.bellSwing;

      // the train comes in, braking to a stop at the platform
      const tr = this.train;
      if (this.phase === 'arriving') {
        const remain = this.trainX - STOP_X;
        const vWant = Math.sqrt(Math.max(0, 2 * 0.55 * remain));
        this.trainV = Math.min(this.trainV, vWant + 0.05);
        this.trainX -= this.trainV * dt;
        if (this.whistleSoon > 0) { this.whistleSoon -= dt; if (this.whistleSoon <= 0) this.whistle(env, 0.06, 0.8); }
        if (remain < 70 && !this.whistled2) { this.whistled2 = true; this.whistle(env, 0.12, 0.5); }
        if (remain < 25 && !this.braking) { this.braking = true; SND.swell(env.bus, { color: 'white', type: 'highpass', f0: 3000, f1: 6000, dur: 5, gain: 0.04, pan: 0.2 }); }
        if (remain <= 0.05) {
          this.trainX = STOP_X; this.trainV = 0; this.phase = 'stopped';
          for (let i = 0; i < 18; i++) this.puff(new THREE.Vector3(STOP_X + U.rnd(-2, 6), RAIL_Y + 0.6, U.rnd(-0.5, 2)), true);
          SND.swell(env.bus, { color: 'white', type: 'bandpass', f0: 1800, f1: 4200, dur: 3.5, gain: 0.12, q: 0.8 });
          SND.thump(env.bus, { f: 50, gain: 0.25 });
          w.say('Madinah', 'The train from Damascus is in. Walk along the platform to the first carriage.', { ms: 7000 });
        }
      }
      tr.group.position.x = this.trainX;
      for (const wh of tr.wheels) wh.rotation.y -= (this.trainV * dt) / (wh.geometry.parameters.radiusTop || 0.6);
      const sp = w.spatial({ x: this.trainX, z: 1.2 }, 25);
      const moving = this.phase === 'arriving';
      this.rumble.set('gain', moving ? 0.25 * sp.gain : 0.0, 0.3);
      this.chuffN.set('gain', 0, 0.1);
      // chuffs at the rhythm of the wheels, and steam from the chimney
      if (moving || this.phase === 'stopped') {
        const rate = moving ? Math.max(0.6, this.trainV * 0.55) : 0.35;
        this.chuffT += dt * rate;
        if (this.chuffT > 1) {
          this.chuffT = 0;
          const top = tr.chimneyTop.clone().add(tr.group.position);
          this.puff(top, false);
          if (moving) SND.swell(env.bus, { color: 'white', type: 'bandpass', f0: 500, f1: 1400, dur: 0.32, gain: 0.12 * sp.gain + 0.01, pan: sp.pan, q: 0.7, peak: 0.12 });
          else SND.swell(env.bus, { color: 'white', type: 'highpass', f0: 3500, f1: 5000, dur: 1.2, gain: 0.015, pan: sp.pan });
        }
      }
      for (const s of this.steamPool) {
        if (!s.visible) continue;
        const u = s.userData; u.life += dt;
        s.position.y += u.vy * dt; s.position.x += u.vx * dt; u.vy *= 0.985;
        const k = u.life / u.max; s.scale.setScalar(u.s0 + k * 4.5); s.material.opacity = 0.6 * (1 - k);
        if (k >= 1) s.visible = false;
      }
      this.doorItem.pos.set(this.trainX + 21.8, 1.5, -0.2);

      this.birdClock -= dt;
      if (this.birdClock < 0) { this.birdClock = 2 + Math.random() * 4; Math.random() < 0.4 ? SND.coo(env.bus, { gain: 0.03 }) : SND.chirp(env.bus, { gain: 0.016 }); }
    },
  }));
})();
