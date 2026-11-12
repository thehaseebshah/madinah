/* ATLAS — a 3D relief map for each world of the Sirah, with the stations pinned where they
   happened. Drag to turn it, scroll or pinch to zoom, hover or tab through the stations, and
   choose one to enter. The terrain is modelled on the real landmarks of each city. */
(function () {
  'use strict';
  if (!window.THREE) { window.ATLAS = null; return; }
  const T = THREE;
  const $ = id => document.getElementById(id);
  const KM_LAT = 110.95;
  const A = { open: false, world: null };

  /* ---------- geography ---------- */
  function frame(world) {
    const W = SIRAH.worlds[world], [s, w, n, e] = W.extent;
    const lat0 = (s + n) / 2, kmX = (e - w) * KM_LAT * Math.cos(lat0 * Math.PI / 180), kmZ = (n - s) * KM_LAT;
    const unit = 100 / Math.max(kmX, kmZ); // scene units per km
    return {
      W, kmX, kmZ, unit, sx: kmX * unit, sz: kmZ * unit,
      // latitude/longitude to scene x/z, and to kilometres
      xz(lat, lon) { return [((lon - w) / (e - w) - 0.5) * kmX * unit, (0.5 - (lat - s) / (n - s)) * kmZ * unit]; },
      km(lat, lon) { return [(lon - w) / (e - w) * kmX, (lat - s) / (n - s) * kmZ]; },
    };
  }
  function distSeg(px, py, ax, ay, bx, by) {
    const dx = bx - ax, dy = by - ay, l = dx * dx + dy * dy, t = l ? U.clamp(((px - ax) * dx + (py - ay) * dy) / l) : 0;
    return Math.hypot(px - ax - dx * t, py - ay - dy * t);
  }
  function distPoly(px, py, pts) { let d = 1e9; for (let i = 0; i < pts.length - 1; i++) d = Math.min(d, distSeg(px, py, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1])); return d; }
  const ridged = (x, y) => { let s = 0, a = 0.5, f = 1; for (let i = 0; i < 5; i++) { s += a * (1 - Math.abs(U.noise2(x * f + i * 7.1, y * f - i * 3.3))); f *= 2.1; a *= 0.5; } return s; };
  const gauss = (x, y, cx, cy, rx, ry) => Math.exp(-((x - cx) ** 2) / (2 * rx * rx) - ((y - cy) ** 2) / (2 * ry * ry));

  // Height (in km, before exaggeration) and ground colour at a point given in km from the south-west corner.
  function makkahGround(F) {
    const K = (lat, lon) => F.km(lat, lon);
    const valleys = [
      [K(21.3549, 39.9841), K(21.3833, 39.9361), K(21.4133, 39.8933), K(21.4180, 39.8600), K(21.4225, 39.8262), K(21.4050, 39.8000), K(21.3800, 39.7600)],
      [K(21.4225, 39.8262), K(21.4400, 39.8200), K(21.4700, 39.8150), K(21.4950, 39.8050)],
      [K(21.4225, 39.8262), K(21.4350, 39.7950), K(21.4600, 39.7600), K(21.4900, 39.7400)],
      [K(21.4180, 39.8600), K(21.4450, 39.8500), K(21.4800, 39.8700)],
    ];
    const arafat = K(21.3549, 39.9841), hira = K(21.4576, 39.8617), thawr = K(21.3772, 39.8497), qubays = K(21.4215, 39.8305);
    return (x, y) => {
      let dv = 1e9; for (const v of valleys) dv = Math.min(dv, distPoly(x, y, v));
      const plain = gauss(x, y, arafat[0], arafat[1], 3.2, 2.4);
      let h = (ridged(x * 0.42, y * 0.42) * 0.42 + 0.06) * U.smooth(0.25, 1.6, dv) * (1 - plain * 0.95);
      h += gauss(x, y, hira[0], hira[1], 0.45, 0.45) * 0.38 + gauss(x, y, thawr[0], thawr[1], 0.6, 0.55) * 0.48 + gauss(x, y, qubays[0], qubays[1], 0.25, 0.25) * 0.12;
      const sand = U.smooth(0.9, 0.1, dv) + plain * 0.8;
      let col = U.mix([0.55, 0.44, 0.37], [0.36, 0.3, 0.28], U.clamp(h * 1.6));
      col = U.mix(col, [0.86, 0.76, 0.6], U.clamp(sand));
      const urban = gauss(x, y, ...K(21.4225, 39.8262), 2.2, 1.6) * U.smooth(0.8, 0.1, dv);
      col = U.mix(col, [0.93, 0.9, 0.84], urban * 0.6);
      return [h, col];
    };
  }
  function madinahGround(F) {
    const K = (lat, lon) => F.km(lat, lon);
    const uhud = K(24.5150, 39.6100), sal = K(24.4810, 39.5970), ayr = K(24.4120, 39.5900), rumat = K(24.5026, 39.6155);
    const aqiq = [K(24.405, 39.585), K(24.440, 39.570), K(24.470, 39.566), K(24.500, 39.572), K(24.535, 39.590)];
    const groves = [K(24.4393, 39.6173), K(24.4330, 39.6330), K(24.4600, 39.6250), K(24.4900, 39.6050), K(24.4500, 39.5950)];
    const mosque = K(24.4672, 39.6111);
    return (x, y) => {
      let h = 0.004 + U.noise2(x * 0.6, y * 0.6) * 0.004;
      h += gauss(x, y, uhud[0], uhud[1], 3.2, 0.75) * 0.42 * (0.85 + ridged(x * 1.2, y * 1.2) * 0.4);
      h += gauss(x, y, sal[0], sal[1], 0.35, 0.3) * 0.09 + gauss(x, y, ayr[0], ayr[1], 1.6, 0.5) * 0.26 + gauss(x, y, rumat[0], rumat[1], 0.12, 0.1) * 0.03;
      // lava fields to west and east
      const west = U.smooth(4.6, 2.0, x), east = U.smooth(F.kmX - 3.6, F.kmX - 1.4, x);
      const lava = Math.max(west, east) * (0.7 + 0.3 * U.noise2(x * 0.5, y * 0.5));
      h += lava * (0.03 + ridged(x * 2.5, y * 2.5) * 0.025);
      const dA = distPoly(x, y, aqiq);
      h -= U.smooth(0.5, 0, dA) * 0.015;
      let col = [0.82, 0.72, 0.58];
      col = U.mix(col, [0.62, 0.45, 0.36], U.clamp(h * 3));
      col = U.mix(col, [0.2, 0.19, 0.2], U.clamp(lava));
      let g = 0; for (const c of groves) g = Math.max(g, gauss(x, y, c[0], c[1], 1.1, 1.1));
      g *= 0.55 + 0.45 * (U.noise2(x * 3, y * 3) > 0 ? 1 : 0.3);
      col = U.mix(col, [0.32, 0.42, 0.24], U.clamp(g * 0.8));
      col = U.mix(col, [0.45, 0.5, 0.36], U.smooth(0.6, 0, dA) * 0.6);
      col = U.mix(col, [0.94, 0.91, 0.86], gauss(x, y, mosque[0], mosque[1], 1.3, 1.2) * 0.75);
      return [h, col];
    };
  }

  /* ---------- scene ---------- */
  function build(world) {
    const F = frame(world), ground = world === 'makkah' ? makkahGround(F) : madinahGround(F);
    const EX = world === 'makkah' ? 12 : 22; // vertical exaggeration, in scene units per km
    // a fresh canvas each time: the last map's WebGL context was released with its renderer
    const old = $('atlas-canvas'), canvas = old.cloneNode(false); old.replaceWith(canvas);
    const renderer = new T.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    renderer.setSize(innerWidth, innerHeight, false);
    renderer.outputEncoding = T.sRGBEncoding; renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
    const scene = new T.Scene();
    scene.background = new T.Color(0x0a0d18);
    scene.fog = new T.Fog(0x0a0d18, 160, 320);
    const camera = new T.PerspectiveCamera(38, innerWidth / innerHeight, 0.5, 900);

    // relief
    const segX = 220, segZ = Math.round(220 * F.sz / F.sx);
    const geo = new T.PlaneGeometry(F.sx, F.sz, segX, segZ); geo.rotateX(-Math.PI / 2);
    const p = geo.attributes.position, col = new Float32Array(p.count * 3);
    const hAt = (sx, sz) => { const kx = (sx / F.sx + 0.5) * F.kmX, ky = (0.5 - sz / F.sz) * F.kmZ; return ground(kx, ky); };
    for (let i = 0; i < p.count; i++) {
      const [h, c] = hAt(p.getX(i), p.getZ(i));
      p.setY(i, h * EX); col.set([c[0] ** 2.2, c[1] ** 2.2, c[2] ** 2.2], i * 3); // colours authored in sRGB
    }
    geo.setAttribute('color', new T.BufferAttribute(col, 3)); geo.computeVertexNormals();
    const relief = new T.Mesh(geo, new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.92, metalness: 0 }));
    relief.receiveShadow = relief.castShadow = true; scene.add(relief);
    // the plinth of the model
    const plinth = new T.Mesh(new T.BoxGeometry(F.sx + 0.2, 4, F.sz + 0.2), new T.MeshStandardMaterial({ color: 0x2a1f18, roughness: 0.6 }));
    plinth.position.y = -2.6; scene.add(plinth);
    const gold = new T.MeshStandardMaterial({ color: 0xc8a050, metalness: 0.8, roughness: 0.35 });
    [[0, -F.sz / 2 - 0.5, F.sx + 2, 1], [0, F.sz / 2 + 0.5, F.sx + 2, 1], [-F.sx / 2 - 0.5, 0, 1, F.sz], [F.sx / 2 + 0.5, 0, 1, F.sz]].forEach(([x, z, lx, lz]) => {
      const r = new T.Mesh(new T.BoxGeometry(lx, 4.6, lz), gold); r.position.set(x, -2.2, z); scene.add(r);
    });

    scene.add(new T.HemisphereLight(0xdfe6ff, 0x3a2a20, 0.55));
    const sun = new T.DirectionalLight(0xffe0b0, 2.2); sun.position.set(-60, 70, 40); sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -80, right: 80, top: 80, bottom: -80, near: 1, far: 260 }); sun.shadow.camera.updateProjectionMatrix();
    scene.add(sun);

    const ys = (lat, lon) => { const [x, z] = F.xz(lat, lon); return new T.Vector3(x, hAt(x, z)[0] * EX, z); };
    // routes, as glowing dashed lines that drift along the ground
    const routes = (F.W.routes || []).map(r => {
      const pts = [];
      for (let i = 0; i < r.pts.length - 1; i++) for (let k = 0; k < 20; k++) {
        const t = k / 20, la = U.lerp(r.pts[i][0], r.pts[i + 1][0], t), lo = U.lerp(r.pts[i][1], r.pts[i + 1][1], t);
        const v = ys(la, lo); v.y += 0.35; pts.push(v);
      }
      const last = r.pts[r.pts.length - 1]; const v = ys(last[0], last[1]); v.y += 0.35; pts.push(v);
      const g = new T.BufferGeometry().setFromPoints(pts);
      const line = new T.Line(g, new T.LineDashedMaterial({ color: 0xf0cc80, dashSize: 1.2, gapSize: 0.8, transparent: true, opacity: 0.9 }));
      line.computeLineDistances(); scene.add(line);
      return line;
    });

    // pins: a light on the ground and a slender gold mast; the badge is an HTML button
    const stations = SIRAH.stations.filter(s => s.world === world);
    const glowTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.3, 'rgba(255,255,255,.4)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return new T.CanvasTexture(c); })();
    const pins = stations.map(s => {
      const base = ys(s.geo[0], s.geo[1]);
      const mast = new T.Mesh(new T.CylinderGeometry(0.06, 0.06, 4, 6), new T.MeshBasicMaterial({ color: 0xe8c068 }));
      mast.position.copy(base).add(new T.Vector3(0, 2, 0)); scene.add(mast);
      const glow = new T.Sprite(new T.SpriteMaterial({ map: glowTex, color: 0xffd890, transparent: true, depthWrite: false, blending: T.AdditiveBlending }));
      glow.position.copy(base).add(new T.Vector3(0, 0.3, 0)); glow.scale.set(3, 3, 1); scene.add(glow);
      return { s, base, top: base.clone().add(new T.Vector3(0, 4.1, 0)), mast, glow };
    });
    return { F, renderer, scene, camera, relief, routes, pins, glowTex, hAt, EX };
  }

  /* ---------- camera ---------- */
  const cam = { az: -0.35, pol: 0.95, dist: 150, tx: 0, tz: 0, taz: -0.35, tpol: 0.95, tdist: 150, ttx: 0, ttz: 0, idle: 0 };
  function placeCamera(S) {
    const c = S.camera, ty = 0;
    c.position.set(cam.tx + Math.sin(cam.az) * Math.sin(cam.pol) * cam.dist, ty + Math.cos(cam.pol) * cam.dist, cam.tz + Math.cos(cam.az) * Math.sin(cam.pol) * cam.dist);
    c.lookAt(cam.tx, ty, cam.tz);
  }

  /* ---------- DOM ---------- */
  let S = null, raf = 0, opts = {}, sel = null, hover = null, bus = null;
  function listHtml(world) {
    return SIRAH.stations.filter(s => s.world === world).map((s, i) => {
      const st = ENGINE.byId(s.id); if (!st) return '';
      const done = opts.completed && opts.completed.has(s.id);
      return `<li><button type="button" class="atlas-item${done ? ' done' : ''}" data-id="${s.id}">
        <span class="ai-num">${i + 1}</span><span class="ai-text"><span class="ai-title">${st.title}</span><span class="ai-year">${s.year} · ${s.kind}</span></span>${done ? '<span class="ai-done" aria-label="visited">✓</span>' : ''}</button></li>`;
    }).join('');
  }
  function select(id, fly) {
    sel = id;
    const s = SIRAH.stations.find(x => x.id === id), st = ENGINE.byId(id); if (!s || !st) return;
    const idx = SIRAH.stations.filter(x => x.world === A.world).indexOf(s) + 1;
    $('ac-num').textContent = `Station ${idx} · ${s.year} · ${s.kind === '3D' ? 'walkable 3D' : 'interactive scene'}`;
    $('ac-ar').textContent = st.arabic; $('ac-title').textContent = st.title; $('ac-blurb').textContent = s.blurb;
    const src = window.SOURCES && SOURCES.summary(id);
    $('ac-src').innerHTML = src || '';
    $('atlas-card').hidden = false;
    document.querySelectorAll('.atlas-item').forEach(b => b.classList.toggle('sel', b.dataset.id === id));
    document.querySelectorAll('.atlas-pin').forEach(b => b.classList.toggle('sel', b.dataset.id === id));
    if (fly && S) { const pin = S.pins.find(p => p.s.id === id); cam.ttx = pin.base.x; cam.ttz = pin.base.z; cam.tdist = Math.min(cam.tdist, 95); }
    if (bus) SND.bell(bus, 523.25 + idx * 30, { gain: 0.03, glass: true });
  }

  A.show = function (world, o) {
    A.hide(true);
    opts = o || {}; A.world = world; A.open = true; sel = null;
    const W = SIRAH.worlds[world], other = world === 'makkah' ? 'madinah' : 'makkah';
    $('atlas').hidden = false;
    $('atlas-ar').textContent = W.ar; $('atlas-name').textContent = W.name; $('atlas-span').textContent = W.span; $('atlas-blurb').textContent = W.blurb;
    $('atlas-switch-label').textContent = SIRAH.worlds[other].name.replace(/^al-/, '');
    $('atlas-list').innerHTML = listHtml(world);
    $('atlas-card').hidden = true;
    S = build(world);
    Object.assign(cam, { az: -0.35, pol: 1.05, dist: 175, taz: -0.25, tpol: 0.92, tdist: world === 'makkah' ? 150 : 135, tx: 0, tz: 0, ttx: 0, ttz: 0, idle: 0 });
    // pin badges and landmark labels
    const layer = $('atlas-pins'); layer.innerHTML = '';
    S.pins.forEach((pin, i) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'atlas-pin' + (opts.completed && opts.completed.has(pin.s.id) ? ' done' : ''); b.dataset.id = pin.s.id;
      const st = ENGINE.byId(pin.s.id);
      b.innerHTML = `<span class="ap-star">${i + 1}</span><span class="ap-label">${st ? st.title : pin.s.id}<i>${pin.s.year}</i></span>`;
      b.setAttribute('aria-label', `${i + 1}. ${st ? st.title : pin.s.id}, ${pin.s.year}`);
      b.addEventListener('click', () => select(pin.s.id, true));
      b.addEventListener('dblclick', () => opts.onEnter && opts.onEnter(pin.s.id));
      b.addEventListener('pointerenter', () => { hover = pin.s.id; });
      b.addEventListener('pointerleave', () => { hover = null; });
      pin.el = b; layer.appendChild(b);
    });
    S.labels = (W.landmarks || []).map(([name, lat, lon]) => {
      const el = document.createElement('span'); el.className = 'atlas-landmark'; el.textContent = name; layer.appendChild(el);
      const [x, z] = S.F.xz(lat, lon); return { el, pos: new T.Vector3(x, S.hAt(x, z)[0] * S.EX + 1.2, z) };
    });
    $('atlas-list').querySelectorAll('.atlas-item').forEach(b => {
      b.addEventListener('click', () => select(b.dataset.id, true));
      b.addEventListener('dblclick', () => opts.onEnter && opts.onEnter(b.dataset.id));
      b.addEventListener('pointerenter', () => { hover = b.dataset.id; });
      b.addEventListener('pointerleave', () => { hover = null; });
    });
    if (opts.focus) select(opts.focus, true);
    if (window.SND && SND.ready) {
      bus = SND.bus({ reverb: 0.6 }); bus.fadeIn(3);
      SND.noise(bus, { color: 'pink', type: 'bandpass', freq: 420, q: 0.5, gain: 0.05 });
      SND.glow(bus, world === 'makkah' ? 146.83 : 130.81, { gain: 0.04, dur: 9 });
    }
    let last = performance.now();
    const loop = now => {
      if (!A.open) return;
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      tick(dt, now / 1000);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
  };

  function tick(dt, t) {
    cam.idle += dt;
    if (cam.idle > 6) cam.taz += dt * 0.025;
    for (const k of ['az', 'pol', 'dist', 'tx', 'tz']) cam[k] = U.damp(cam[k], cam['t' + k], 4, dt);
    placeCamera(S);
    S.routes.forEach(r => { r.material.dashOffset = -t * 1.5; });
    const w = innerWidth, h = innerHeight, v = new T.Vector3();
    // project pins, then nudge apart any that crowd each other on screen
    const pts = S.pins.map(pin => { v.copy(pin.top).project(S.camera); return { pin, x: (v.x + 1) / 2 * w, y: (1 - v.y) / 2 * h, ox: 0, oy: 0, vis: v.z < 1 }; });
    for (let it = 0; it < 4; it++) for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
      const a = pts[i], b = pts[j], dx = (b.x + b.ox) - (a.x + a.ox), dy = (b.y + b.oy) - (a.y + a.oy), d = Math.hypot(dx, dy) || 0.01;
      if (d < 30) { const push = (30 - d) / 2, ux = dx / d, uy = dy / d; a.ox -= ux * push; a.oy -= uy * push; b.ox += ux * push; b.oy += uy * push; }
    }
    for (const q of pts) {
      const el = q.pin.el, on = q.pin.s.id === hover || q.pin.s.id === sel;
      el.style.transform = `translate(${q.x + q.ox}px, ${q.y + q.oy}px)`;
      el.style.visibility = q.vis ? 'visible' : 'hidden';
      el.classList.toggle('hot', on);
      q.pin.glow.material.opacity = on ? 1 : 0.55 + 0.25 * Math.sin(t * 2 + q.x);
      q.pin.glow.scale.setScalar(on ? 4.5 : 3);
    }
    for (const l of S.labels) { v.copy(l.pos).project(S.camera); l.el.style.transform = `translate(${(v.x + 1) / 2 * w}px, ${(1 - v.y) / 2 * h}px)`; l.el.style.visibility = v.z < 1 ? 'visible' : 'hidden'; }
    S.renderer.render(S.scene, S.camera);
  }

  /* The camera dives toward a station's pin before the scene opens. */
  A.dive = function (id, done) {
    if (!S) { done(); return; }
    const pin = S.pins.find(p => p.s.id === id);
    if (!pin) { done(); return; }
    cam.ttx = pin.base.x; cam.ttz = pin.base.z; cam.tdist = 16; cam.tpol = 0.62; cam.taz += 0.5; cam.idle = 0;
    if (bus) SND.swell(bus, { f0: 300, f1: 1400, dur: 1.6, gain: 0.06 });
    document.getElementById('atlas').classList.add('diving');
    setTimeout(() => { document.getElementById('atlas').classList.remove('diving'); done(); }, 1250);
  };

  A.hide = function (instant) {
    A.open = false; cancelAnimationFrame(raf);
    if (bus) { bus.dispose(); bus = null; }
    if (S) {
      S.scene.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); } });
      S.glowTex.dispose(); S.renderer.dispose(); try { S.renderer.forceContextLoss(); } catch (e) {}
      S = null;
    }
    const el = $('atlas'); if (el) el.hidden = true;
    void instant;
  };

  /* ---------- input on the map ---------- */
  function bind() {
    const c = $('atlas'); let drag = null; const touches = new Map();
    const onMap = e => e.target && e.target.id === 'atlas-canvas';
    c.addEventListener('pointerdown', e => { if (!onMap(e)) return; try { e.target.setPointerCapture(e.pointerId); } catch (_) {} touches.set(e.pointerId, [e.clientX, e.clientY]); drag = { x: e.clientX, y: e.clientY, pan: e.button === 2 || e.shiftKey }; cam.idle = 0; });
    c.addEventListener('pointermove', e => {
      if (!drag || !touches.has(e.pointerId)) return;
      const prev = touches.get(e.pointerId); touches.set(e.pointerId, [e.clientX, e.clientY]);
      if (touches.size === 2) { // pinch to zoom
        const [a, b] = [...touches.values()], [pa] = [prev];
        const d = Math.hypot(a[0] - b[0], a[1] - b[1]);
        if (drag.pd) cam.tdist = U.clamp(cam.tdist * drag.pd / d, 40, 220);
        drag.pd = d; void pa; return;
      }
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag.x = e.clientX; drag.y = e.clientY;
      if (drag.pan) { const s = cam.dist / 600; cam.ttx -= (Math.cos(cam.az) * dx - Math.sin(cam.az) * dy) * s; cam.ttz -= (-Math.sin(cam.az) * dx - Math.cos(cam.az) * dy) * s; }
      else { cam.taz -= dx * 0.005; cam.tpol = U.clamp(cam.tpol - dy * 0.004, 0.35, 1.32); }
      cam.idle = 0;
    });
    const end = e => { touches.delete(e.pointerId); if (!touches.size) drag = null; else if (drag) drag.pd = 0; };
    c.addEventListener('pointerup', end); c.addEventListener('pointercancel', end);
    c.addEventListener('contextmenu', e => e.preventDefault());
    c.addEventListener('wheel', e => { if (!onMap(e)) return; e.preventDefault(); cam.tdist = U.clamp(cam.tdist * (1 + e.deltaY * 0.0012), 40, 220); cam.idle = 0; }, { passive: false });
    addEventListener('resize', () => { if (S) { S.renderer.setSize(innerWidth, innerHeight, false); S.camera.aspect = innerWidth / innerHeight; S.camera.updateProjectionMatrix(); } });
    addEventListener('keydown', e => {
      if (!A.open) return;
      const list = SIRAH.stations.filter(s => s.world === A.world), i = list.findIndex(s => s.id === sel);
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { select(list[(i + 1) % list.length].id, true); e.preventDefault(); }
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { select(list[(i - 1 + list.length) % list.length].id, true); e.preventDefault(); }
      else if (e.key === 'Enter' && sel && document.activeElement && !document.activeElement.closest('#atlas-card')) { opts.onEnter && opts.onEnter(sel); }
    });
    $('ac-enter').addEventListener('click', () => sel && opts.onEnter && opts.onEnter(sel));
    $('ac-close').addEventListener('click', () => { $('atlas-card').hidden = true; sel = null; document.querySelectorAll('.sel').forEach(b => b.classList.remove('sel')); });
    $('atlas-switch').addEventListener('click', () => opts.onSwitch && opts.onSwitch(A.world === 'makkah' ? 'madinah' : 'makkah'));
    $('atlas-begin').addEventListener('click', () => { const first = SIRAH.stations.find(s => s.world === A.world); opts.onEnter && opts.onEnter(first.id); });
    $('atlas-home').addEventListener('click', () => opts.onHome && opts.onHome());
  }
  A.bind = bind;
  window.ATLAS = A;
})();
