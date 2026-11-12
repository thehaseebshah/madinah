/* Station V — The Two Qiblas (walkable).
   A small mosque of mud brick and palm trunks at midday, its floor covered by rows of woven mats
   that face Jerusalem. Set into the floor of the open court is a brass compass ring. Stand on it,
   hold E and turn its pointer: two sung voices beat against each other while the direction is off
   and fall into one still tone when it is true to Makkah. Then the rows of mats swing round, the
   front row first, the old niche closes and a new one opens in the south wall. No person is shown. */
(function () {
  'use strict';
  if (!window.WORLD) return;
  const JERUSALEM = 332, MAKKAH = 176;          // bearings from Madinah, degrees clockwise from north
  const HX = 11, HZ = 13, WT = 0.6, WALL_H = 3.2, COURT = 6, RING = 1.7;
  const IN_Z = HZ - WT / 2;                       // inner face of the north and south walls
  // north is -z, east is +x: a bearing becomes a direction on the floor
  const dirOf = b => { const r = b * Math.PI / 180; return [Math.sin(r), -Math.cos(r)]; };
  const angDiff = (a, b) => ((a - b) % 360 + 540) % 360 - 180;
  const OLD_X = -IN_Z * Math.tan((360 - JERUSALEM) * Math.PI / 180);   // where the Jerusalem bearing meets the north wall
  const NEW_X = IN_Z * Math.tan((180 - MAKKAH) * Math.PI / 180);       // where the Makkah bearing meets the south wall

  ENGINE.register(WORLD.stage({
    key: 'qiblatayn',
    arabic: 'القِبْلَتَيْن',
    title: 'The Two Qiblas',
    era: 'Rajab or Sha‘ban, 2 AH · 624 CE',
    hint: 'WASD to walk · at the brass ring hold E and turn with A/D or the mouse',
    sound: { reverb: 0.5 },
    story: `<p>For sixteen or seventeen months after the Hijrah, the Muslims of Madinah prayed facing Jerusalem. Then the command came to turn toward the Ka‘bah in Makkah. The sahih reports tell of congregations who heard the news in the middle of a prayer and turned where they stood: in Quba at dawn, and in a mosque of Madinah that later tradition identifies with Banu Salimah.</p>
            <p class="q"><span class="ar">فَوَلِّ وَجْهَكَ شَطْرَ الْمَسْجِدِ الْحَرَامِ</span>“So turn your face toward al-Masjid al-Haram.” (Qur’an 2:144)</p>
            <p>The mosque has been called <i>Masjid al-Qiblatayn</i>, the Mosque of the Two Qiblas. From Madinah, Jerusalem lies at about 332° and Makkah at about 176°: nearly opposite directions. Stand on the brass ring in the court and turn the qibla.</p>`,

    enter(env) {
      const T = THREE, self = this;
      const w = this.w = WORLD.create(env, {
        start: { x: 4.2, z: 4.8, yaw: 0.72, pitch: -0.12 }, exposure: 0.98, far: 900,
        fog: { color: 0xead8bc, near: 40, far: 220 },
        bounds: [-40, -40, 40, 40],
        surface: (x, z) => (Math.abs(x) < HX && Math.abs(z) < HZ ? (Math.hypot(x, z) < RING + 0.4 ? 'stone' : 'sand') : 'sand'),
      });
      const S = w.scene;
      this.bearing = JERUSALEM; this.phase = 'turn'; this.lockT = 0; this.turnT = 0; this.tickB = Math.round(JERUSALEM / 5);
      this.seen = {};

      /* ---------- sky and the midday sun, high in the south ---------- */
      const sunDir = new T.Vector3(0.22, 0.9, 0.38).normalize();
      w.sky({ top: '#4f7fbf', mid: '#e9dcc4', bot: '#c8a878', sunDir: sunDir.toArray(), sun: '#fff0c8', sunSize: 0.0014 });
      // (no image-based light: the brass catches the sun and the hemisphere light)
      S.add(new T.HemisphereLight(0xfff0d8, 0x9a7650, 0.75));
      const sun = new T.DirectionalLight(0xfff0d0, 2.15); sun.position.copy(sunDir).multiplyScalar(40); S.add(sun);

      /* ---------- ground, floor and walls ---------- */
      const ground = new T.Mesh(new T.PlaneGeometry(240, 240), KIT.std({ map: KIT.sand(w, [40, 40]), color: 0xf2dfc2 }));
      ground.rotation.x = -Math.PI / 2; S.add(ground);
      const floor = new T.Mesh(new T.PlaneGeometry(2 * HX, 2 * HZ), KIT.std({ map: KIT.sand(w, [6, 7]), color: 0xd8bc98 }));
      floor.rotation.x = -Math.PI / 2; floor.position.y = 0.005; S.add(floor);

      const brick = KIT.mudBrick(w, [1, 1]);
      const footMat = KIT.std({ map: KIT.basalt(w, [3, 0.4]), color: 0xd8d0c8 });
      const brickMat = (lx, h) => { const m = brick.clone(); m.needsUpdate = true; m.repeat.set(Math.max(lx, 0.6) / 3.2, h / 2.4); return KIT.std({ map: m, color: 0xe2c8a6 }); };
      const box = (x0, z0, x1, z1, y0, y1, collide) => {
        const lx = Math.abs(x1 - x0), lz = Math.abs(z1 - z0), h = y1 - y0;
        const m = new T.Mesh(new T.BoxGeometry(lx, h, lz), brickMat(Math.max(lx, lz), h));
        m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); S.add(m);
        if (y0 < 0.1) {
          const f = new T.Mesh(new T.BoxGeometry(lx + 0.1, 0.4, lz + 0.1), footMat); f.position.set(m.position.x, 0.2, m.position.z); S.add(f);
        }
        if (collide) w.addBox(Math.min(x0, x1), Math.min(z0, z1), Math.max(x0, x1), Math.max(z0, z1));
        return m;
      };
      // east and west walls with a doorway each, open onto the court
      const DOOR = 1.0, DOOR_H = 2.4;
      for (const sx of [-1, 1]) {
        const x0 = sx * HX - WT / 2, x1 = sx * HX + WT / 2;
        box(x0, -HZ - WT / 2, x1, -DOOR, 0, WALL_H, true);
        box(x0, DOOR, x1, HZ + WT / 2, 0, WALL_H, true);
        box(x0, -DOOR - 0.1, x1, DOOR + 0.1, DOOR_H, WALL_H, false);
      }

      // the north and south walls, each with an arched niche (mihrab) cut into it
      const plaster = KIT.std({ map: KIT.plaster(w, [1, 1], '#e8d6b8'), color: 0xf0e0c8 });
      const archShape = (hw, h) => { const s = new T.Shape(); s.moveTo(-hw, 0); s.lineTo(-hw, h - hw); s.absarc(0, h - hw, hw, Math.PI, 0, true); s.lineTo(hw, 0); s.lineTo(-hw, 0); return s; };
      const NW = 0.6, NH = 2.35, PANEL = 1.2;
      const panelMat = (() => { const m = brick.clone(); m.needsUpdate = true; m.repeat.set(1 / 3.2, 1 / 2.4); return KIT.std({ map: m, color: 0xe2c8a6 }); })();
      const niche = (cx, side) => {          // side: -1 north wall (interior toward +z), +1 south wall
        const zc = side * HZ;
        box(-HX - WT / 2, zc - WT / 2, cx - PANEL, zc + WT / 2, 0, WALL_H, true);
        box(cx + PANEL, zc - WT / 2, HX + WT / 2, zc + WT / 2, 0, WALL_H, true);
        // a panel with the arch cut out of it
        const s = new T.Shape();
        s.moveTo(-PANEL, 0); s.lineTo(-NW, 0); s.lineTo(-NW, NH - NW); s.absarc(0, NH - NW, NW, Math.PI, 0, true);
        s.lineTo(NW, 0); s.lineTo(PANEL, 0); s.lineTo(PANEL, WALL_H); s.lineTo(-PANEL, WALL_H); s.lineTo(-PANEL, 0);
        const pg = new T.ExtrudeGeometry(s, { depth: WT, bevelEnabled: false });
        const p = new T.Mesh(pg, panelMat); p.position.set(cx, 0, zc - WT / 2); S.add(p);
        w.addBox(cx - PANEL, zc - WT / 2, cx - NW, zc + WT / 2); w.addBox(cx + NW, zc - WT / 2, cx + PANEL, zc + WT / 2);
        // the recess behind the arch, plastered, bulging out of the wall's outer face
        const out = side, d0 = zc + out * WT / 2, D = 0.55;
        const back = new T.Mesh(new T.BoxGeometry(NW * 2 + 0.24, NH + 0.12, 0.12), plaster); back.position.set(cx, (NH + 0.12) / 2, d0 + out * (D + 0.06)); S.add(back);
        for (const sx of [-1, 1]) { const sd = new T.Mesh(new T.BoxGeometry(0.12, NH + 0.12, D), plaster); sd.position.set(cx + sx * (NW + 0.06), (NH + 0.12) / 2, d0 + out * D / 2); S.add(sd); }
        const top = new T.Mesh(new T.BoxGeometry(NW * 2 + 0.24, 0.12, D + 0.12), plaster); top.position.set(cx, NH + 0.06, d0 + out * (D / 2)); S.add(top);
        w.addBox(cx - NW, Math.min(zc, d0 + out * D), cx + NW, Math.max(zc, d0 + out * D));
        // a sill of basalt
        const sill = new T.Mesh(new T.BoxGeometry(NW * 2, 0.14, WT + D), footMat); sill.position.set(cx, 0.07, zc + out * D / 2); S.add(sill);
        // a door of brick that can close the arch, or open it
        const fill = new T.Mesh(new T.ShapeGeometry(archShape(NW + 0.01, NH + 0.01)), new T.MeshStandardMaterial({ map: panelMat.map, color: 0xe2c8a6, roughness: 0.95, transparent: true, opacity: 1, side: T.DoubleSide }));
        fill.position.set(cx, 0, zc - side * (WT / 2 + 0.012)); fill.userData.dynamic = true; S.add(fill);
        // a little oil lamp glowing in the niche
        const glow = KIT.glow(w, 0xffc878, 1.6, 0); glow.position.set(cx, 1.15, zc + out * 0.35); S.add(glow);
        const flame = KIT.glow(w, 0xffe0a0, 0.28, 0); flame.position.set(cx, 0.32, zc + out * 0.3); S.add(flame);
        const lamp = new T.Mesh(new T.SphereGeometry(0.09, 10, 6), KIT.std({ color: 0x8a5a38 })); lamp.scale.y = 0.55; lamp.position.set(cx, 0.19, zc + out * 0.3); S.add(lamp);
        return { fill, glow, flame };
      };
      this.oldNiche = niche(OLD_X, -1);
      this.newNiche = niche(NEW_X, 1);
      this.oldNiche.fill.material.opacity = 0; this.oldNiche.fill.visible = false;
      this.oldNiche.glow.material.opacity = 0.7; this.oldNiche.flame.material.opacity = 1;
      // a coping of palm-trunk along the wall tops
      const bark = KIT.bark(w), trunkMat = KIT.std({ map: bark, color: 0xc8b096 });

      /* ---------- palm-trunk pillars and the frond roofs over north and south ---------- */
      const roofTex = KIT.frondRoof(w, [5, 2]);
      const roofMat = KIT.std({ map: roofTex, alphaTest: 0.5, side: T.DoubleSide, color: 0xd8c8a0 });
      const roofDepth = new T.MeshDepthMaterial({ depthPacking: T.RGBADepthPacking, map: roofTex, alphaTest: 0.5, side: T.DoubleSide });
      this.pillars = [];
      const pillar = (x, z) => {
        const m = new T.Mesh(new T.CylinderGeometry(0.19, 0.24, WALL_H + 0.2, 10), trunkMat); m.position.set(x, (WALL_H + 0.2) / 2, z); S.add(m);
        w.addCircle(x, z, 0.25); this.pillars.push([x, z]);
      };
      const roof = (z0, z1) => {
        const r = new T.Mesh(new T.PlaneGeometry(2 * HX + WT, Math.abs(z1 - z0)), roofMat);
        r.rotation.x = -Math.PI / 2; r.position.set(0, WALL_H + 0.25, (z0 + z1) / 2); S.add(r);
        const r2 = r.clone(); r2.position.y += 0.1; r2.rotation.z = 0.06; S.add(r2);
        [r, r2].forEach(m => { m.customDepthMaterial = roofDepth; m.userData.dynamic = true; m.userData.noCast = false; });
        for (let x = -HX + 1.4; x < HX; x += 2.4) {
          const b = new T.Mesh(new T.BoxGeometry(0.2, 0.18, Math.abs(z1 - z0)), trunkMat); b.position.set(x, WALL_H + 0.12, (z0 + z1) / 2); S.add(b);
        }
        const edge = new T.Mesh(new T.CylinderGeometry(0.17, 0.17, 2 * HX, 8), trunkMat); edge.rotation.z = Math.PI / 2; edge.position.set(0, WALL_H + 0.1, Math.sign(z0) * COURT); S.add(edge);
      };
      for (const z of [-COURT - 0.2, -COURT - 3.6, COURT + 0.2, COURT + 3.6]) for (const x of [-8.25, -2.75, 2.75, 8.25]) pillar(x, z);
      roof(-HZ - WT / 2, -COURT); roof(COURT, HZ + WT / 2);

      /* ---------- the woven mats, in rows that face Jerusalem ---------- */
      const matTex = w.tex(256, (g, s) => {
        g.fillStyle = '#c8a468'; g.fillRect(0, 0, s, s);
        for (let y = 0; y < s; y += 4) { g.fillStyle = (y / 4) % 2 ? 'rgba(120,84,40,0.22)' : 'rgba(255,236,190,0.16)'; g.fillRect(0, y, s, 2); }
        for (let x = 0; x < s; x += 8) { g.fillStyle = 'rgba(90,60,26,0.10)'; g.fillRect(x, 0, 2, s); }
        g.strokeStyle = '#7a4e26'; g.lineWidth = 10; g.strokeRect(10, 10, s - 20, s - 20);
        g.strokeStyle = '#a0682e'; g.lineWidth = 3; g.strokeRect(26, 26, s - 52, s - 52);
        // the head of the mat: a woven arch that shows which way it faces
        g.fillStyle = '#8a5a30'; g.beginPath(); g.moveTo(70, 104); g.lineTo(70, 66); g.quadraticCurveTo(70, 34, 128, 30); g.quadraticCurveTo(186, 34, 186, 66); g.lineTo(186, 104); g.closePath(); g.fill();
        g.fillStyle = '#c8a468'; g.beginPath(); g.moveTo(84, 104); g.lineTo(84, 70); g.quadraticCurveTo(84, 46, 128, 43); g.quadraticCurveTo(172, 46, 172, 70); g.lineTo(172, 104); g.closePath(); g.fill();
        for (let y = 46; y < 104; y += 4) { g.fillStyle = 'rgba(120,84,40,0.25)'; g.fillRect(84, y, 88, 2); }
        for (let i = 0; i < 9; i++) { g.fillStyle = i % 2 ? '#7a4e26' : '#2f5a48'; g.fillRect(40 + i * 20, s - 50, 12, 12); }
      });
      matTex.wrapS = matTex.wrapT = T.ClampToEdgeWrapping;
      const matGeo = new T.PlaneGeometry(0.72, 1.28); matGeo.rotateX(-Math.PI / 2);
      this.mats = [];
      for (let z = -HZ + 1.4, row = 0; z < HZ - 1; z += 1.8, row++) {
        const list = [];
        for (let x = -HX + 1.3; x < HX - 1; x += 1.36) {
          if (Math.hypot(x, z) < RING + 1.3) continue;
          if (this.pillars.some(([px, pz]) => Math.hypot(px - x, pz - z) < 0.95)) continue;
          list.push({ x, z, y: 0.015 + ((list.length + row) % 2) * 0.007 });
        }
        if (list.length) this.mats.push({ z, list, b: JERUSALEM, k: 0 });
      }
      const nMats = this.mats.reduce((a, r) => a + r.list.length, 0);
      this.matMesh = new T.InstancedMesh(matGeo, KIT.std({ map: matTex, color: 0xe6d6bc, roughness: 1, relief: 0.02 }), nMats);
      this.matMesh.userData.dynamic = true; this.matMesh.receiveShadow = true; this.matMesh.userData.noCast = true;
      S.add(this.matMesh);
      this.dummy = new T.Object3D();
      this.placeMats();

      /* ---------- the brass compass ring set into the floor of the court ---------- */
      const dial = w.tex(1024, (g, s) => {
        const c = s / 2, R = s * 0.49;
        const bg = g.createRadialGradient(c, c, 0, c, c, R);
        bg.addColorStop(0, '#3c3430'); bg.addColorStop(1, '#2a2422');
        g.fillStyle = '#2a2422'; g.fillRect(0, 0, s, s); g.fillStyle = bg; g.beginPath(); g.arc(c, c, R, 0, 6.283); g.fill();
        const P = (b, r) => [c + Math.sin(b * Math.PI / 180) * r, c - Math.cos(b * Math.PI / 180) * r];
        g.strokeStyle = '#d8b060'; g.lineWidth = 3; g.beginPath(); g.arc(c, c, R * 0.93, 0, 6.283); g.stroke();
        g.lineWidth = 2; g.beginPath(); g.arc(c, c, R * 0.6, 0, 6.283); g.stroke();
        for (let b = 0; b < 360; b += 5) {
          const L = b % 90 === 0 ? 0.16 : b % 30 === 0 ? 0.1 : b % 10 === 0 ? 0.065 : 0.035;
          const [x0, y0] = P(b, R * 0.93), [x1, y1] = P(b, R * (0.93 - L));
          g.lineWidth = b % 30 === 0 ? 4 : 2; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
        }
        // an eight-pointed star at the centre
        g.fillStyle = 'rgba(216,176,96,0.85)'; U.star8(g, c, c, R * 0.16, 0.62, Math.PI / 8); g.fill();
        g.fillStyle = '#2a2422'; g.beginPath(); g.arc(c, c, R * 0.05, 0, 6.283); g.fill();
        g.fillStyle = '#e8c878'; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.font = `bold ${s * 0.05}px Marcellus, Georgia, serif`;
        [['N', 0], ['E', 90], ['S', 180], ['W', 270]].forEach(([t, b]) => { const [x, y] = P(b, R * 0.68); g.fillText(t, x, y); });
        // the two bearings
        const label = (b, ar, en, col) => {
          const [x0, y0] = P(b, R * 0.62), [x1, y1] = P(b, R * 0.93);
          g.strokeStyle = col; g.lineWidth = 7; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
          const [lx, ly] = P(b, R * 0.43);
          g.save(); g.translate(lx, ly); let a = b * Math.PI / 180; if (b > 90 && b < 270) a += Math.PI; g.rotate(a);
          g.fillStyle = col; g.font = `${s * 0.052}px Amiri, serif`; g.fillText(ar, 0, -s * 0.022);
          g.font = `${s * 0.03}px Marcellus, Georgia, serif`; g.fillText(en, 0, s * 0.035);
          g.restore();
        };
        label(JERUSALEM, 'بيت المقدس', 'JERUSALEM · 332°', '#a8c4e0');
        label(MAKKAH, 'مكة', 'MAKKAH · 176°', '#9ee0b0');
      });
      dial.wrapS = dial.wrapT = T.ClampToEdgeWrapping;
      const disc = new T.Mesh(new T.CircleGeometry(RING, 64), KIT.std({ map: dial, roughness: 0.55, metalness: 0.2, relief: 0.01 }));
      disc.rotation.x = -Math.PI / 2; disc.position.y = 0.02; S.add(disc);
      const brass = KIT.std({ color: 0xd2a656, metalness: 0.92, roughness: 0.28 });
      const ring = new T.Mesh(new T.TorusGeometry(RING, 0.07, 10, 96), brass); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.025; S.add(ring);
      const collar = new T.Mesh(new T.RingGeometry(RING + 0.06, RING + 0.42, 64), KIT.std({ map: KIT.basalt(w, [4, 1]), color: 0xd0c8c0 }));
      collar.rotation.x = -Math.PI / 2; collar.position.y = 0.012; S.add(collar);
      // studs at the two bearings
      [[JERUSALEM, 0x9ab8d8], [MAKKAH, 0x8fd8a8]].forEach(([b, c]) => {
        const [dx, dz] = dirOf(b);
        const st = new T.Mesh(new T.SphereGeometry(0.09, 12, 8), KIT.std({ color: c, metalness: 0.5, roughness: 0.3, emissive: c, emissiveIntensity: 0.25 }));
        st.scale.y = 0.6; st.position.set(dx * (RING + 0.24), 0.04, dz * (RING + 0.24)); S.add(st);
      });
      this.makkahGlow = KIT.glow(w, 0x9ff0c0, 1.2, 0.25); this.makkahGlow.position.set(dirOf(MAKKAH)[0] * (RING + 0.24), 0.2, dirOf(MAKKAH)[1] * (RING + 0.24)); S.add(this.makkahGlow);
      // the pointer: a brass needle on a pivot
      const ns = new T.Shape();
      ns.moveTo(0, RING - 0.12); ns.lineTo(0.13, RING - 0.48); ns.lineTo(0.045, RING - 0.46); ns.lineTo(0.045, -0.42);
      ns.absarc(0, -0.55, 0.13, Math.PI / 2 - 0.35, -Math.PI * 1.5 + 0.35, true);
      ns.lineTo(-0.045, -0.42); ns.lineTo(-0.045, RING - 0.46); ns.lineTo(-0.13, RING - 0.48); ns.lineTo(0, RING - 0.12);
      const ng = new T.ExtrudeGeometry(ns, { depth: 0.035, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 1 });
      ng.rotateX(-Math.PI / 2);
      this.needleMat = KIT.std({ color: 0xe0b860, metalness: 0.9, roughness: 0.22, emissive: 0x302008, emissiveIntensity: 1 });
      const needle = new T.Mesh(ng, this.needleMat);
      this.pointer = new T.Group(); this.pointer.position.y = 0.06; this.pointer.add(needle); this.pointer.userData.dynamic = true; S.add(this.pointer);
      const hub = new T.Mesh(new T.CylinderGeometry(0.13, 0.16, 0.12, 20), brass); hub.position.y = 0.08; S.add(hub);
      this.pointer.rotation.y = -JERUSALEM * Math.PI / 180;
      // a path of light from the ring to the new niche, shown once the qibla is true
      const beamTex = w.tex(128, (g, s) => { const gr = g.createLinearGradient(0, 0, s, 0); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, s, s); });
      beamTex.wrapS = beamTex.wrapT = T.ClampToEdgeWrapping;
      const beamLen = Math.hypot(NEW_X, IN_Z) - RING - 0.5;
      const bg = new T.PlaneGeometry(0.5, beamLen); bg.rotateX(-Math.PI / 2); bg.translate(0, 0, -(RING + 0.45 + beamLen / 2));
      this.beam = new T.Mesh(bg, new T.MeshBasicMaterial({ map: beamTex, color: 0xbff0c8, transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending }));
      this.beam.rotation.y = -MAKKAH * Math.PI / 180; this.beam.position.y = 0.035; this.beam.userData.dynamic = true; S.add(this.beam);
      this.ringGlow = KIT.glow(w, 0xbff0c8, 5, 0.3); this.ringGlow.position.set(0, 0.6, 0); S.add(this.ringGlow);
      this.frontGlow = KIT.glow(w, 0xbff0c8, 3.2, 0); this.frontGlow.position.set(NEW_X * 0.86, 0.5, IN_Z * 0.86); S.add(this.frontGlow);

      /* ---------- palms beyond the walls, doves on the coping, dust in the sun ---------- */
      const r = U.seeded(624);
      for (let i = 0; i < 34; i++) {
        let x, z; do { x = (r() - 0.5) * 80; z = (r() - 0.5) * 80; } while (Math.abs(x) < HX + 4 && Math.abs(z) < HZ + 4);
        const p = KIT.palm(w, 6 + r() * 7); p.position.set(x, 0, z); S.add(p); w.addCircle(x, z, 0.35);
      }
      const doveMat = KIT.std({ color: 0xd8d0c4, roughness: 0.8 });
      this.dovePts = [];
      for (let i = 0; i < 7; i++) {
        const onEast = i % 2, x = onEast ? HX : -HX, z = -COURT + 1 + r() * (2 * COURT - 2);
        const d = new T.Group();
        const body = new T.Mesh(new T.SphereGeometry(0.11, 10, 8), doveMat); body.scale.set(0.8, 0.75, 1.5); d.add(body);
        const head = new T.Mesh(new T.SphereGeometry(0.055, 8, 6), doveMat); head.position.set(0, 0.08, -0.13); d.add(head);
        const tail = new T.Mesh(new T.BoxGeometry(0.08, 0.02, 0.16), doveMat); tail.position.set(0, 0.02, 0.2); tail.rotation.x = -0.3; d.add(tail);
        d.position.set(x, WALL_H + 0.1, z); d.rotation.y = r() * 6.28; S.add(d);
        this.dovePts.push(d.position.clone());
      }
      this.dust = KIT.dust(w, 260, [-HX, 0.3, -COURT, HX, WALL_H + 1.5, COURT], 0xfff0c8, 0.03); this.dust.material.opacity = 0.5; S.add(this.dust);

      w.followShadow(sun, 22); w.receiveAll();
      this.matMesh.castShadow = false;
      this.baked = w.bake();

      /* ---------- the activity ---------- */
      w.activity('Turn toward the Ka‘bah', 3, 'Stand on the brass ring in the court, hold E and turn the pointer with A/D or the mouse');
      this.ringItem = w.interact({
        key: 'ring', pos: new T.Vector3(), r: 99, hold: 1e9,
        label: () => (self.phase === 'turn' ? 'Hold E · turn the pointer with A/D or by turning' : ''),
        enabled: () => self.phase === 'turn' && Math.hypot(w.pos.x, w.pos.z) < RING + 0.7,
        onHold: (ww, it, k, dt) => { self.holding = true; },
      });
      w.interact({
        key: 'old-niche', pos: [OLD_X, 1.3, -IN_Z], r: 3.2, once: true, label: 'Look at the niche',
        onUse: () => {
          SND.sing(env.bus, 220, { vowel: 'o', dur: 2.4, gain: 0.03, voices: 2 });
          w.say('Two Directions', 'From Madinah, Jerusalem lies at about 332°, a little west of north, and Makkah at about 176°, almost due south. To turn from one to the other is to turn nearly all the way round.', { ms: 11000 });
        },
      });

      /* ---------- sound ---------- */
      const b = env.bus;
      this.v1 = SND.drone(b, 196, { vowel: 'o', gain: 0.0, pan: -0.35 });
      this.v2 = SND.drone(b, 196, { vowel: 'o', gain: 0.0, pan: 0.35 });
      this.v5 = SND.drone(b, 294, { vowel: 'a', gain: 0.0 });
      this.v8 = SND.drone(b, 98, { vowel: 'u', gain: 0.0 });
      this.breeze = SND.noise(b, { color: 'pink', type: 'bandpass', freq: 600, q: 0.5, gain: 0.035 });
      this.leaves = SND.noise(b, { color: 'white', type: 'bandpass', freq: 5000, q: 0.8, gain: 0.005 });
      SND.lfo(b, this.leaves.gain && this.leaves.gain.gain, 0.11, 0.004);
      this.birdClock = 2; this.cooClock = 3;

      /* ---------- entrance: from straight overhead, as the old map saw it, turning down into the court ---------- */
      const E = [w.pos.x, 1.62, w.pos.z];
      w.cinematic([
        { p: [0.2, 34, 0.9], l: [0, 0, 0] },
        { p: [0.9, 30, -0.3], l: [0, 0, -0.4] },
        { p: [-0.6, 24, -1.2], l: [0, 0, 0.2] },
        { p: [-6, 14, -5], l: [0, 0.4, 0] },
        { p: [-3, 6, 7], l: [0, 0.3, -1] },
        { p: E, l: [0, 0, 0] },
      ], 10);
    },

    placeMats() {
      const d = this.dummy; let i = 0;
      for (const row of this.mats) {
        for (const m of row.list) {
          d.position.set(m.x, m.y + Math.sin(row.k * Math.PI) * 0.06, m.z);
          d.rotation.set(0, -row.b * Math.PI / 180, 0);
          d.updateMatrix(); this.matMesh.setMatrixAt(i++, d.matrix);
        }
      }
      this.matMesh.instanceMatrix.needsUpdate = true;
    },

    update(env, dt) {
      const w = this.w; if (!w) return;
      this.holding = false;
      w.update(dt);
      const t = w.time, b = env.bus;
      KIT.driftDust(this.dust, dt, t, [0.05, 0.02]);
      const dRing = Math.hypot(w.pos.x, w.pos.z);
      { const f = w.forward(), l = Math.hypot(f.x, f.z) || 1; this.ringItem.pos.set(w.pos.x + f.x / l, w.y + 1.4, w.pos.z + f.z / l); }

      if (!this.seen.ring && dRing < RING + 1.6 && !w.cine) {
        this.seen.ring = true;
        w.say('Toward Jerusalem', 'After the Hijrah, the Prophet ﷺ and the Muslims prayed toward Jerusalem for sixteen or seventeen months. <span class="q">(Sahih al-Bukhari 40, 399)</span>', { ar: 'صَلَّى نَحْوَ بَيْتِ الْمَقْدِسِ سِتَّةَ عَشَرَ أَوْ سَبْعَةَ عَشَرَ شَهْرًا', ms: 11000 });
      }

      /* turning the pointer */
      if (!w.cine) {
        const turning = this.holding && this.phase === 'turn';
        w.enabled = !turning;
        if (turning) {
          let db = 0;
          if (w.keys.has('a') || w.keys.has('ArrowLeft')) db -= 38 * dt;
          if (w.keys.has('d') || w.keys.has('ArrowRight')) db += 38 * dt;
          if (this.lastYaw != null) db += -(w.yaw - this.lastYaw) * 180 / Math.PI;
          this.bearing = (this.bearing + db + 360) % 360;
          // a gentle pull when it is nearly true
          const off = angDiff(this.bearing, MAKKAH);
          if (Math.abs(off) < 6 && Math.abs(db) < 0.4) this.bearing = (this.bearing - off * Math.min(1, dt * 2.5) + 360) % 360;
          const tick = Math.round(this.bearing / 5);
          if (tick !== this.tickB) { this.tickB = tick; SND.knock(b, { f: 900, gain: 0.03, click: 5200 }); }
        }
        this.lastYaw = w.yaw;
      }
      this.pointer.rotation.y = -this.bearing * Math.PI / 180;

      /* the two voices: they beat while the direction is off and become one when it is true */
      const off = Math.abs(angDiff(this.bearing, MAKKAH));
      const near = Math.exp(-Math.max(0, dRing - RING) / 6);
      const locked = this.phase !== 'turn';
      const lv = locked ? 0.035 : 0.012 + 0.03 * near;
      this.v1.setGain(lv, 0.4); this.v2.setGain(lv, 0.4);
      this.v1.set(196);
      this.v2.set(locked ? 196 : 196 * (1 + (off / 180) * 0.045 + 0.0004));
      const one = locked ? 1 : U.smooth(8, 0.5, off);
      this.v5.setGain(0.022 * one * (locked ? 1 : near), 0.5); this.v8.setGain(0.03 * one * (locked ? 1 : near), 0.5);
      this.needleMat.emissive.setRGB(0.19 + one * 0.2, 0.13 + one * 0.4, 0.05 + one * 0.2);
      this.makkahGlow.material.opacity = 0.25 + one * 0.65 + 0.08 * Math.sin(t * 3);
      // the ring is the brightest thing in view until it is used; the world hushes as the qibla comes true
      this.ringGlow.material.opacity = this.phase === 'turn' ? (0.22 + 0.1 * Math.sin(t * 2)) * U.smooth(0.5, 4, dRing) : 0;
      const hush = this.phase === 'turn' ? 0.15 + 0.85 * U.smooth(3, 25, off) : U.smooth(2, 10, this.turnT || 0);
      this.breeze.set('gain', 0.035 * hush, 0.5); this.leaves.set('gain', 0.005 * hush, 0.5);

      if (this.phase === 'turn') {
        this.lockT = off < 1.5 ? this.lockT + dt : 0;
        if (this.lockT > 0.7) {
          this.phase = 'swing'; this.bearing = MAKKAH; this.turnT = 0; w.enabled = true;
          w.progress(1, 'Watch the rows turn, the front row first');
          SND.glow(b, 98, { gain: 0.06, dur: 9 }); SND.bell(b, 392, { gain: 0.05, delay: 0.3 }); SND.bell(b, 587.33, { gain: 0.04, delay: 0.6 });
          w.say('So Turn Your Face', '“We have seen the turning of your face toward the heaven, and We will surely turn you to a qibla with which you will be pleased. So turn your face toward al-Masjid al-Haram.” <span class="q">(Qur’an 2:144)</span>', { ar: 'فَوَلِّ وَجْهَكَ شَطْرَ الْمَسْجِدِ الْحَرَامِ', ms: 13000 });
        }
      }

      /* the rows swing round, the front first; the old niche closes and the new one opens */
      if (this.phase === 'swing' || this.phase === 'walk') {
        this.turnT += dt;
        let all = true;
        this.mats.forEach((row, i) => {
          const k = U.clamp((this.turnT - 1.2 - i * 0.55) / 2.4);
          if (k > 0 && row.k === 0) { const sp = w.spatial({ x: 0, z: row.z }, 9); SND.swell(b, { color: 'white', f0: 700, f1: 2400, dur: 1.4, gain: 0.03 * sp.gain + 0.008, pan: sp.pan }); }
          row.k = k;
          row.b = JERUSALEM - 156 * U.ease(k);
          if (k < 1) all = false;
        });
        this.placeMats();
        const fade = U.smooth(1, 6, this.turnT);
        const on = U.smooth(this.mats.length * 0.55, this.mats.length * 0.55 + 4, this.turnT);
        const o = this.oldNiche, n = this.newNiche;
        o.glow.material.opacity = 0.7 * (1 - fade); o.flame.material.opacity = 1 - fade;
        o.fill.visible = fade > 0.01; o.fill.material.opacity = fade; o.fill.material.depthWrite = fade > 0.98;
        n.fill.material.opacity = 1 - on; n.fill.visible = on < 0.99; n.fill.material.depthWrite = on < 0.02;
        n.glow.material.opacity = 0.8 * on; n.flame.material.opacity = on;
        this.beam.material.opacity = 0.45 * on * (0.85 + 0.15 * Math.sin(t * 2));
        if (this.phase === 'swing' && all && on >= 1) {
          this.phase = 'walk';
          w.progress(2, 'Walk to the new front of the mosque, before the niche in the south wall');
          SND.glow(b, 146.83, { gain: 0.05, dur: 8 });
          w.say('Where They Stood', 'Those who heard the news in the middle of a prayer turned where they stood: the people of Quba in the dawn prayer <span class="q">(Sahih al-Bukhari 403)</span>, and a congregation in a mosque of Madinah <span class="q">(Sahih al-Bukhari 40)</span>, which later tradition identifies with the mosque of Banu Salimah.', { ms: 14000 });
        }
      }
      if (this.phase === 'walk') {
        this.frontGlow.material.opacity = 0.5 + 0.2 * Math.sin(t * 2.5);
        if (Math.hypot(w.pos.x - NEW_X * 0.86, w.pos.z - IN_Z * 0.86) < 2.6) {
          this.phase = 'done'; this.frontGlow.material.opacity = 0;
          SND.glow(b, 196, { gain: 0.05, dur: 9, delay: 0.2 });
          w.say('The Mosque of the Two Qiblas', 'The mosque where the turning is remembered has been called <i>Masjid al-Qiblatayn</i>, the Mosque of the Two Qiblas. From that day the prayer of every Muslim has faced the Ka‘bah in Makkah.', { ms: 13000 });
          w.finish('Facing the Ka‘bah');
        }
      }

      /* life outside */
      this.birdClock -= dt;
      if (this.birdClock < 0) { this.birdClock = 2 + Math.random() * 4; if (hush > 0.5) SND.chirp(b, { gain: 0.012 }); }
      this.cooClock -= dt;
      if (this.cooClock < 0) {
        this.cooClock = 4 + Math.random() * 6;
        const d = U.pick(this.dovePts), sp = w.spatial(d, 8);
        SND.coo(b, { gain: 0.04 * sp.gain + 0.008, pan: sp.pan });
      }
    },
  }));
})();
