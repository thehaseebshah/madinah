/* KIT — procedural materials and models for the walkable stations.
   Every texture is painted on a canvas at load time; nothing is downloaded. */
(function () {
  'use strict';
  if (!window.THREE) { window.KIT = null; return; }
  const T = THREE;
  const cache = new Map();

  function canvasTex(w, size, key, draw, rep, opts) {
    // textures are cached per renderer lifetime by key; a new world rebuilds them
    const t = w.tex(size, draw, rep);
    if (opts && opts.linear) t.encoding = T.LinearEncoding;
    return t;
  }
  function speckle(g, s, n, cols, rmax) {
    for (let i = 0; i < n; i++) {
      g.fillStyle = cols[(Math.random() * cols.length) | 0];
      const r = Math.random() * (rmax || 1.5) + 0.3;
      g.fillRect(Math.random() * s, Math.random() * s, r, r);
    }
  }

  const KIT = {
    sand(w, rep) {
      return canvasTex(w, 512, 'sand', (g, s) => {
        g.fillStyle = '#c9a678'; g.fillRect(0, 0, s, s);
        for (let i = 0; i < 40; i++) {
          const x = Math.random() * s, y = Math.random() * s, r = 30 + Math.random() * 90;
          const gr = g.createRadialGradient(x, y, 0, x, y, r);
          const c = Math.random() < 0.5 ? '180,140,96' : '214,184,140';
          gr.addColorStop(0, `rgba(${c},0.35)`); gr.addColorStop(1, `rgba(${c},0)`);
          g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
        }
        speckle(g, s, 9000, ['#a88458', '#dcc29a', '#8c6c48', '#efdcb8'], 1.6);
        speckle(g, s, 260, ['#5a4636', '#3a2e26'], 3);
      }, rep || [24, 24]);
    },
    mudBrick(w, rep) {
      return canvasTex(w, 512, 'mud', (g, s) => {
        g.fillStyle = '#8f6a45'; g.fillRect(0, 0, s, s);
        const bh = 32, bw = 84;
        for (let y = 0, row = 0; y < s; y += bh, row++) {
          for (let x = -(row % 2) * bw / 2; x < s; x += bw) {
            const t = Math.random();
            g.fillStyle = `rgb(${170 + t * 30 | 0},${128 + t * 24 | 0},${86 + t * 18 | 0})`;
            g.fillRect(x + 3, y + 3, bw - 6, bh - 6);
            g.fillStyle = 'rgba(255,240,210,0.08)'; g.fillRect(x + 3, y + 3, bw - 6, 3);
          }
        }
        // a thin, worn mud plaster over the bricks
        g.globalAlpha = 0.45;
        for (let i = 0; i < 26; i++) {
          const x = Math.random() * s, y = Math.random() * s, r = 40 + Math.random() * 120;
          const gr = g.createRadialGradient(x, y, 0, x, y, r);
          gr.addColorStop(0, 'rgba(176,138,98,0.9)'); gr.addColorStop(1, 'rgba(176,138,98,0)');
          g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
        }
        g.globalAlpha = 1;
        speckle(g, s, 5000, ['#6e5034', '#b89070', '#a07a52'], 1.4);
        g.strokeStyle = 'rgba(200,170,130,0.35)'; g.lineWidth = 1;
        for (let i = 0; i < 70; i++) { g.beginPath(); const x = Math.random() * s, y = Math.random() * s; g.moveTo(x, y); g.lineTo(x + Math.random() * 30 - 15, y + Math.random() * 6); g.stroke(); } // straw
      }, rep || [4, 1]);
    },
    basalt(w, rep) {
      return canvasTex(w, 512, 'basalt', (g, s) => {
        g.fillStyle = '#2c2828'; g.fillRect(0, 0, s, s);
        for (let i = 0; i < 60; i++) {
          const x = Math.random() * s, y = Math.random() * s, r = 20 + Math.random() * 80;
          const gr = g.createRadialGradient(x, y, 0, x, y, r);
          gr.addColorStop(0, Math.random() < 0.5 ? 'rgba(70,62,58,0.5)' : 'rgba(18,16,18,0.5)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
          g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
        }
        speckle(g, s, 7000, ['#141212', '#4a4240', '#5c524c', '#201c1c'], 2);
        // vesicles
        for (let i = 0; i < 500; i++) { g.fillStyle = 'rgba(0,0,0,0.6)'; g.beginPath(); g.arc(Math.random() * s, Math.random() * s, Math.random() * 2.2, 0, 6.283); g.fill(); }
      }, rep || [2, 2]);
    },
    plaster(w, rep, tint) {
      return canvasTex(w, 512, 'plaster', (g, s) => {
        g.fillStyle = tint || '#e6dccb'; g.fillRect(0, 0, s, s);
        for (let i = 0; i < 50; i++) {
          const x = Math.random() * s, y = Math.random() * s, r = 30 + Math.random() * 120;
          const gr = g.createRadialGradient(x, y, 0, x, y, r);
          gr.addColorStop(0, Math.random() < 0.6 ? 'rgba(160,140,110,0.18)' : 'rgba(255,255,255,0.2)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
          g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
        }
        speckle(g, s, 4000, ['#c8bca6', '#f4ecdc', '#b0a48c'], 1.2);
        // rain streaks
        g.strokeStyle = 'rgba(120,100,80,0.05)';
        for (let i = 0; i < 14; i++) { const x = Math.random() * s; g.lineWidth = 1 + Math.random() * 4; g.beginPath(); g.moveTo(x, Math.random() * s * 0.3); g.lineTo(x + Math.random() * 4, s); g.stroke(); }
      }, rep || [2, 2]);
    },
    bark(w) {
      return canvasTex(w, 256, 'bark', (g, s) => {
        g.fillStyle = '#5a4634'; g.fillRect(0, 0, s, s);
        // the diamond lattice left by old frond bases
        for (let y = 0; y < s + 32; y += 32) for (let x = -32; x < s + 32; x += 32) {
          const ox = (y / 32) % 2 ? 16 : 0;
          g.fillStyle = `rgb(${110 + Math.random() * 30 | 0},${86 + Math.random() * 20 | 0},${60 + Math.random() * 14 | 0})`;
          g.beginPath(); g.moveTo(x + ox, y - 14); g.lineTo(x + ox + 15, y); g.lineTo(x + ox, y + 14); g.lineTo(x + ox - 15, y); g.closePath(); g.fill();
          g.strokeStyle = 'rgba(30,20,12,0.7)'; g.lineWidth = 2; g.stroke();
        }
        speckle(g, s, 2000, ['#3a2c20', '#8a7058'], 1.4);
      }, [1, 4]);
    },
    wood(w, rep, base) {
      return canvasTex(w, 256, 'wood', (g, s) => {
        g.fillStyle = base || '#7a5434'; g.fillRect(0, 0, s, s);
        for (let i = 0; i < 90; i++) {
          g.strokeStyle = `rgba(${Math.random() < 0.5 ? '40,24,12' : '160,120,80'},${0.12 + Math.random() * 0.2})`;
          g.lineWidth = 0.6 + Math.random() * 2;
          const y = Math.random() * s;
          g.beginPath(); g.moveTo(0, y);
          for (let x = 0; x <= s; x += 16) g.lineTo(x, y + Math.sin(x * 0.03 + i) * 3);
          g.stroke();
        }
      }, rep || [1, 1]);
    },
    // palm frond: leaflets on a curving rachis, alpha-cut
    frond(w) {
      return canvasTex(w, 512, 'frond', (g, s) => {
        g.clearRect(0, 0, s, s);
        const mid = s / 2;
        g.strokeStyle = '#6f6a32'; g.lineWidth = 5; g.beginPath(); g.moveTo(0, mid); g.lineTo(s, mid); g.stroke();
        for (let i = 6; i < 120; i++) {
          const x = (i / 120) * s, L = (Math.sin((i / 120) * Math.PI) * 0.85 + 0.15) * mid * 0.95;
          const c = 70 + Math.random() * 40;
          g.strokeStyle = `rgb(${c * 0.75 | 0},${c + 20 | 0},${c * 0.45 | 0})`; g.lineWidth = 3.2;
          g.beginPath(); g.moveTo(x, mid); g.lineTo(x + L * 0.45, mid - L); g.stroke();
          g.beginPath(); g.moveTo(x, mid); g.lineTo(x + L * 0.45, mid + L); g.stroke();
        }
      });
    },
    // a roof of laid fronds seen from below: dense but full of gaps for the sun
    frondRoof(w, rep) {
      return canvasTex(w, 512, 'roof', (g, s) => {
        g.clearRect(0, 0, s, s);
        for (let k = 0; k < 20; k++) {
          const y0 = Math.random() * s, a = (Math.random() - 0.5) * 0.5, len = s * 1.2, x0 = -s * 0.1;
          const dx = Math.cos(a), dy = Math.sin(a);
          g.strokeStyle = '#5c4a2a'; g.lineWidth = 4; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x0 + dx * len, y0 + dy * len); g.stroke();
          for (let i = 0; i < 46; i++) {
            const t = i / 46, px = x0 + dx * len * t, py = y0 + dy * len * t, L = 26 + Math.random() * 10;
            const c = 90 + Math.random() * 50;
            g.strokeStyle = `rgb(${c | 0},${c * 0.82 | 0},${c * 0.5 | 0})`; g.lineWidth = 2.6;
            g.beginPath(); g.moveTo(px, py); g.lineTo(px + dx * L * 0.4 - dy * L, py + dy * L * 0.4 + dx * L); g.stroke();
            g.beginPath(); g.moveTo(px, py); g.lineTo(px + dx * L * 0.4 + dy * L, py + dy * L * 0.4 - dx * L); g.stroke();
          }
        }
      }, rep || [6, 6]);
    },
    // mashrabiya / roshan lattice: turned-wood grid with round bobbins, alpha-cut
    lattice(w, rep) {
      return canvasTex(w, 256, 'lattice', (g, s) => {
        g.clearRect(0, 0, s, s);
        const n = 8, c = s / n;
        g.fillStyle = '#5a3a20';
        for (let i = 0; i <= n; i++) { g.fillRect(i * c - 2.5, 0, 5, s); g.fillRect(0, i * c - 2.5, s, 5); }
        for (let i = 0; i <= n; i++) for (let j = 0; j <= n; j++) { g.beginPath(); g.arc(i * c, j * c, 6, 0, 6.283); g.fill(); }
        for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { g.beginPath(); g.ellipse(i * c + c / 2, j * c, 7, 3.5, 0, 0, 6.283); g.ellipse(i * c, j * c + c / 2, 3.5, 7, 0, 0, 6.283); g.fill(); }
      }, rep || [2, 3]);
    },

    // Standard material; textured opaque surfaces also use their own texture as a bump map,
    // so mortar joints, pits in the basalt and ripples in the sand catch the light.
    std(o) {
      o = Object.assign({ roughness: 0.95, metalness: 0 }, o);
      const relief = o.relief; delete o.relief;
      const m = new T.MeshStandardMaterial(o);
      if (o.map && !o.alphaTest && relief !== 0) { m.bumpMap = o.map; m.bumpScale = relief == null ? 0.045 : relief; }
      return m;
    },

    /* A date palm: a curved, textured trunk and a crown of drooping alpha-cut fronds. */
    palmParts(w) {
      if (w._palm) return w._palm;
      const bark = KIT.bark(w), frond = KIT.frond(w);
      const trunkMat = KIT.std({ map: bark, color: 0xb8a088 });
      const frondMat = KIT.std({ map: frond, alphaTest: 0.45, side: T.DoubleSide, color: 0xc8c090, roughness: 0.85 });
      const fg = new T.PlaneGeometry(3.4, 1.15, 10, 1);
      fg.translate(1.7, 0, 0);
      const p = fg.attributes.position;
      for (let i = 0; i < p.count; i++) { const x = p.getX(i); p.setZ(i, p.getY(i)); p.setY(i, -0.32 * x * x * 0.35 + x * 0.25); }
      fg.computeVertexNormals();
      w._palm = { trunkMat, frondMat, fg };
      return w._palm;
    },
    palm(w, h, opts) {
      opts = opts || {};
      const { trunkMat, frondMat, fg } = KIT.palmParts(w);
      const g = new T.Group();
      const lean = opts.lean == null ? (Math.random() - 0.5) * 0.5 : opts.lean, dir = Math.random() * 6.283;
      const tg = new T.CylinderGeometry(0.17, 0.25, h, 9, 10, true);
      tg.translate(0, h / 2, 0);
      const tp = tg.attributes.position;
      for (let i = 0; i < tp.count; i++) { const y = tp.getY(i) / h; tp.setX(i, tp.getX(i) + Math.cos(dir) * lean * y * y * h * 0.25); tp.setZ(i, tp.getZ(i) + Math.sin(dir) * lean * y * y * h * 0.25); }
      tg.computeVertexNormals();
      const trunk = new T.Mesh(tg, trunkMat); trunk.castShadow = true; trunk.receiveShadow = true;
      g.add(trunk);
      const top = new T.Vector3(Math.cos(dir) * lean * h * 0.25, h, Math.sin(dir) * lean * h * 0.25);
      const crown = new T.Group(); crown.position.copy(top); g.add(crown);
      const n = opts.fronds || 16;
      for (let i = 0; i < n; i++) {
        const f = new T.Mesh(fg, frondMat);
        f.rotation.y = (i / n) * Math.PI * 2 + Math.random() * 0.3;
        f.rotation.z = 0.35 + (i % 3) * 0.22 + Math.random() * 0.15;
        f.scale.setScalar((opts.frondScale || 1) * (0.85 + Math.random() * 0.3));
        f.castShadow = true;
        crown.add(f);
      }
      g.userData.crown = crown;
      g.userData.top = top;
      return g;
    },

    /* The Green Dome over the Prophet's Mosque, with its drum, finial and crescent. */
    greenDome(w, scale) {
      const g = new T.Group(), s = scale || 1;
      const green = KIT.std({ color: 0x2f8f5c, roughness: 0.45, metalness: 0.1, emissive: 0x0a2a18, emissiveIntensity: 0.6 });
      const drum = new T.Mesh(new T.CylinderGeometry(7.2 * s, 7.2 * s, 5 * s, 32), KIT.std({ color: 0x2f8f5c, roughness: 0.6 }));
      drum.position.y = 2.5 * s; g.add(drum);
      const pts = [];
      for (let i = 0; i <= 24; i++) {
        const t = i / 24, a = t * Math.PI / 2;
        // a gently pointed dome profile
        const r = Math.cos(a) * 7.2 * s * (1 - 0.12 * Math.pow(t, 3));
        const y = Math.sin(a) * 8.4 * s + Math.pow(t, 6) * 1.8 * s;
        pts.push(new T.Vector2(Math.max(0.01, r), y));
      }
      const dome = new T.Mesh(new T.LatheGeometry(pts, 48), green);
      dome.position.y = 5 * s; g.add(dome);
      const gold = KIT.std({ color: 0xd8b060, roughness: 0.3, metalness: 0.9, emissive: 0x3a2a08 });
      const rod = new T.Mesh(new T.CylinderGeometry(0.12 * s, 0.18 * s, 3 * s, 8), gold); rod.position.y = 15.7 * s; g.add(rod);
      [0.5, 0.36].forEach((r, i) => { const b = new T.Mesh(new T.SphereGeometry(r * s, 16, 12), gold); b.position.y = (14.8 + i * 1.3) * s; g.add(b); });
      const cres = new T.Mesh(new T.TorusGeometry(0.7 * s, 0.12 * s, 8, 24, Math.PI * 1.45), gold);
      cres.position.y = 17.9 * s; cres.rotation.z = Math.PI * 0.27 + Math.PI; g.add(cres);
      return g;
    },

    /* A tall minaret in stacked stages with lit balconies. */
    minaret(w, h, lit) {
      const g = new T.Group();
      const stone = KIT.std({ color: 0xe8e0d0, roughness: 0.8 });
      const glow = new T.MeshBasicMaterial({ color: 0xffd896 });
      const stages = [[0, h * 0.42, 2.6], [h * 0.42, h * 0.3, 2.0], [h * 0.72, h * 0.18, 1.5]];
      stages.forEach(([y, sh, r], i) => {
        const m = new T.Mesh(new T.CylinderGeometry(r, r * 1.05, sh, i ? 12 : 8), stone); m.position.y = y + sh / 2; g.add(m);
        const bal = new T.Mesh(new T.CylinderGeometry(r + 0.7, r + 0.4, 0.5, 16), stone); bal.position.y = y + sh; g.add(bal);
        if (lit) { const ring = new T.Mesh(new T.TorusGeometry(r + 0.55, 0.08, 6, 24), glow); ring.rotation.x = Math.PI / 2; ring.position.y = y + sh + 0.3; g.add(ring); }
      });
      const cap = new T.Mesh(new T.ConeGeometry(1.5, 4.5, 12), KIT.std({ color: 0xd8d0c0 })); cap.position.y = h + 2.2; g.add(cap);
      const fin = new T.Mesh(new T.SphereGeometry(0.35, 10, 8), KIT.std({ color: 0xd8b060, metalness: 0.9, roughness: 0.3 })); fin.position.y = h + 4.7; g.add(fin);
      return g;
    },

    /* Soft round sprite for glows, dust and lantern halos. */
    glowTex(w) {
      if (w._glow) return w._glow;
      const t = w.tex(128, (g, s) => {
        const gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
        gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,255,255,0.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = gr; g.fillRect(0, 0, s, s);
      });
      t.wrapS = t.wrapT = T.ClampToEdgeWrapping;
      w._glow = t; return t;
    },
    glow(w, color, size, opacity) {
      const m = new T.Sprite(new T.SpriteMaterial({ map: KIT.glowTex(w), color, transparent: true, opacity: opacity == null ? 1 : opacity, depthWrite: false, blending: T.AdditiveBlending }));
      m.scale.set(size, size, 1);
      return m;
    },
    /* Floating motes caught in light. */
    dust(w, n, box, color, size) {
      const geo = new T.BufferGeometry(), pos = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) { pos[i * 3] = U.rnd(box[0], box[3]); pos[i * 3 + 1] = U.rnd(box[1], box[4]); pos[i * 3 + 2] = U.rnd(box[2], box[5]); }
      geo.setAttribute('position', new T.BufferAttribute(pos, 3));
      const mat = new T.PointsMaterial({ map: KIT.glowTex(w), color, size: size || 0.05, transparent: true, opacity: 0.8, depthWrite: false, blending: T.AdditiveBlending, sizeAttenuation: true });
      const p = new T.Points(geo, mat); p.userData.box = box; p.frustumCulled = false;
      return p;
    },
    driftDust(p, dt, t, wind) {
      const a = p.geometry.attributes.position, b = p.userData.box, wx = wind ? wind[0] : 0.05, wz = wind ? wind[1] : 0.02;
      for (let i = 0; i < a.count; i++) {
        let x = a.getX(i) + (wx + Math.sin(t * 0.3 + i) * 0.04) * dt, y = a.getY(i) + Math.sin(t * 0.5 + i * 1.7) * 0.03 * dt, z = a.getZ(i) + (wz + Math.cos(t * 0.27 + i) * 0.04) * dt;
        if (x > b[3]) x = b[0]; if (x < b[0]) x = b[3]; if (z > b[5]) z = b[2]; if (z < b[2]) z = b[5];
        a.setXYZ(i, x, y, z);
      }
      a.needsUpdate = true;
    },
  };
  window.KIT = KIT;
})();
