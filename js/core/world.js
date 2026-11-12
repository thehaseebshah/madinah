/* WORLD — a small first-person layer on Three.js shared by the walkable stations.
   Walk with WASD or the arrow keys, run with Shift, look with the mouse (click to capture it,
   Esc to release) or by dragging, and press E to interact. On touch screens the left thumb
   steers a joystick, the right thumb looks around, and an E button appears when something
   is in reach. */
(function () {
  'use strict';
  if (!window.THREE) { window.WORLD = null; return; }
  const T = THREE;
  const TAU = Math.PI * 2;

  const SKY_VERT = `varying vec3 vDir; void main(){ vDir = normalize((modelMatrix*vec4(position,1.)).xyz - cameraPosition); gl_Position = projectionMatrix*viewMatrix*modelMatrix*vec4(position,1.); }`;
  const SKY_FRAG = `
uniform vec3 uTop; uniform vec3 uMid; uniform vec3 uBot; uniform vec3 uSunDir; uniform vec3 uSun; uniform float uStars; uniform float uTime; uniform float uSunSize;
varying vec3 vDir;
float h(vec3 p){ p = fract(p*0.3183099+.1); p *= 17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
void main(){
  vec3 d = normalize(vDir);
  float y = d.y;
  vec3 col = y > 0. ? mix(uMid, uTop, pow(clamp(y,0.,1.), 0.55)) : mix(uMid, uBot, clamp(-y*4.,0.,1.));
  float sd = max(dot(d, normalize(uSunDir)), 0.);
  col += uSun * (pow(sd, 6.)*0.35 + pow(sd, 64.)*0.6 + smoothstep(1.-uSunSize, 1.-uSunSize*0.6, sd)*1.5);
  if (uStars > 0. && y > 0.) {
    vec3 c = floor(d*260.);
    float s = h(c);
    float tw = 0.6 + 0.4*sin(uTime*(1.+s*3.) + s*40.);
    col += vec3(1.,.96,.88) * smoothstep(0.9965, 1., s) * tw * uStars * smoothstep(0.,0.25,y);
    // a faint band of the Milky Way
    float band = exp(-pow(dot(d, normalize(vec3(0.3,0.5,-0.8)))*3.2, 2.));
    col += vec3(0.5,0.52,0.7) * band * 0.06 * uStars * (0.6 + 0.4*h(floor(d*90.)));
  }
  gl_FragColor = vec4(col, 1.);
}`;

  function create(env, o) {
    o = o || {};
    const canvas = env.canvas3d();
    const renderer = new T.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(env.dpr, o.pixelRatio || 1.5));
    renderer.setSize(env.w, env.h, false);
    renderer.outputEncoding = T.sRGBEncoding;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = o.exposure || 1.0;
    if (o.shadows) { renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap; }

    const scene = new T.Scene();
    const camera = new T.PerspectiveCamera(o.fov || 68, env.w / env.h, o.near || 0.08, o.far || 1200);
    camera.rotation.order = 'YXZ';

    const st = o.start || {};
    const w = {
      T, env, renderer, scene, camera, canvas,
      pos: new T.Vector3(st.x || 0, 0, st.z || 0),
      yaw: st.yaw || 0, pitch: st.pitch || 0,
      vel: new T.Vector3(), eye: o.eye || 1.62, speed: o.speed || 3.0, run: o.run || 5.6, radius: o.radius || 0.32,
      ground: o.ground || (() => 0), surface: o.surface || (() => 'sand'), bounds: o.bounds || null,
      boxes: [], circles: [], items: [], keys: new Set(), bob: 0, y: 0, focus: null, holdT: 0, moving: 0,
      joy: null, look: null, locked: false, onStep: null, onUse: null, ui: {}, time: 0, enabled: true,
    };
    w.y = w.ground(w.pos.x, w.pos.z);

    /* ---------- colliders ---------- */
    w.addBox = (x0, z0, x1, z1) => { w.boxes.push([Math.min(x0, x1), Math.min(z0, z1), Math.max(x0, x1), Math.max(z0, z1)]); };
    w.addCircle = (x, z, r) => { w.circles.push([x, z, r]); };
    function collide(p) {
      const r = w.radius;
      for (const [x0, z0, x1, z1] of w.boxes) {
        if (p.x > x0 - r && p.x < x1 + r && p.z > z0 - r && p.z < z1 + r) {
          const dl = p.x - (x0 - r), dr = (x1 + r) - p.x, dn = p.z - (z0 - r), df = (z1 + r) - p.z;
          const m = Math.min(dl, dr, dn, df);
          if (m === dl) p.x = x0 - r; else if (m === dr) p.x = x1 + r; else if (m === dn) p.z = z0 - r; else p.z = z1 + r;
        }
      }
      for (const [x, z, cr] of w.circles) {
        const dx = p.x - x, dz = p.z - z, d = Math.hypot(dx, dz), m = cr + r;
        if (d < m && d > 1e-5) { p.x = x + dx / d * m; p.z = z + dz / d * m; }
      }
      if (w.bounds) { p.x = U.clamp(p.x, w.bounds[0], w.bounds[2]); p.z = U.clamp(p.z, w.bounds[1], w.bounds[3]); }
    }

    /* ---------- interactables ---------- */
    w.interact = it => {
      it.pos = Array.isArray(it.pos) ? new T.Vector3(...it.pos) : it.pos;
      it.r = it.r || 2.6; it.uses = 0;
      w.items.push(it); return it;
    };

    /* ---------- DOM overlay: crosshair, prompt, card, counter, touch controls ---------- */
    const host = document.getElementById('host');
    const layer = document.createElement('div');
    layer.className = 'w-layer';
    layer.innerHTML = `
      <div class="w-cross" aria-hidden="true"></div>
      <div class="w-prompt" aria-live="polite"><span class="w-key"><i></i>E</span><span class="w-label"></span></div>
      <div class="w-card" aria-live="polite"><p class="w-card-ar" lang="ar" dir="rtl"></p><h3 class="w-card-title"></h3><p class="w-card-text"></p></div>
      <div class="w-count"></div>
      <div class="w-quest" aria-live="polite"><p class="wq-kicker">Activity</p><p class="wq-title"></p><p class="wq-step"></p><div class="wq-bar"><i></i></div></div>
      <div class="w-done" aria-live="assertive"><p class="wd-kicker">Activity complete</p><p class="wd-title"></p></div>
      <div class="w-bars" aria-hidden="true"><i></i><i></i></div>
      <p class="w-skip">Press any key to skip</p>
      <div class="w-joy" aria-hidden="true"><div class="w-joy-knob"></div></div>
      <button class="w-ebtn" type="button" aria-label="Interact">E</button>`;
    document.body.appendChild(layer);
    const $ = s => layer.querySelector(s);
    w.ui = { layer, prompt: $('.w-prompt'), label: $('.w-label'), ring: $('.w-key i'), card: $('.w-card'), cardAr: $('.w-card-ar'), cardTitle: $('.w-card-title'), cardText: $('.w-card-text'), count: $('.w-count'), joy: $('.w-joy'), knob: $('.w-joy-knob'), ebtn: $('.w-ebtn') };
    let cardTimer = 0;
    w.say = (title, text, opt) => {
      opt = opt || {};
      w.ui.cardTitle.textContent = title || '';
      w.ui.cardText.innerHTML = text || '';
      w.ui.cardAr.textContent = opt.ar || '';
      w.ui.cardAr.hidden = !opt.ar;
      w.ui.card.classList.add('show');
      clearTimeout(cardTimer);
      cardTimer = setTimeout(() => w.ui.card.classList.remove('show'), opt.ms || 9000);
    };
    w.count = text => { w.ui.count.textContent = text || ''; w.ui.count.classList.toggle('show', !!text); };

    /* ---------- the station's activity: one game-like goal, tracked on screen ---------- */
    const Q = { title: '', total: 0, n: 0, done: false };
    w.activity = (title, total, step) => {
      Object.assign(Q, { title, total: total || 0, n: 0, done: false });
      layer.querySelector('.wq-title').textContent = title;
      w.step(step || '');
      layer.querySelector('.w-quest').classList.add('show');
      w.progress(0);
    };
    w.step = text => { layer.querySelector('.wq-step').textContent = text || ''; };
    w.progress = (n, step) => {
      Q.n = n; if (step != null) w.step(step);
      const k = Q.total ? U.clamp(n / Q.total) : 0;
      layer.querySelector('.wq-bar i').style.width = `${k * 100}%`;
      if (Q.total) layer.querySelector('.wq-title').textContent = `${Q.title}  \u00b7  ${Math.min(n, Q.total)} / ${Q.total}`;
    };
    w.finish = (message) => {
      if (Q.done) return; Q.done = true;
      w.progress(Q.total || 1);
      const d = layer.querySelector('.w-done');
      layer.querySelector('.wd-title').textContent = message || Q.title;
      d.classList.add('show'); setTimeout(() => d.classList.remove('show'), 5200);
      layer.querySelector('.w-quest').classList.add('complete');
      SND.glow(env.bus, 196, { gain: 0.06, dur: 6 }); SND.bell(env.bus, 587.33, { gain: 0.05, delay: 0.3 }); SND.bell(env.bus, 783.99, { gain: 0.05, delay: 0.6 });
      env.complete();
      setTimeout(() => { try { if (document.pointerLockElement) document.exitPointerLock(); } catch (_) {} }, 3500);
    };
    w.activityDone = () => Q.done;

    /* ---------- cinematic entrance: a camera flight that ends at the walker's eyes ----------
       shots: [{ p: [x,y,z], l: [x,y,z] }, ...] in world space; the last shot is replaced by the
       player's own view so control is handed over without a jump. */
    w.cinematic = (shots, dur) => {
      const P = shots.map(s => new T.Vector3(...s.p)), L = shots.map(s => new T.Vector3(...s.l));
      w.cine = { P, L, t: 0, dur: dur || 7.5 };
      w.enabled = false; layer.classList.add('cine');
    };
    w.skipCinematic = () => { if (w.cine) w.cine.t = w.cine.dur; };
    function endCinematic() { w.cine = null; w.enabled = true; layer.classList.remove('cine'); }
    // A default flight: from high and far behind the start, swinging round and down to the eyes.
    w.autoCinematic = (o) => {
      o = o || {};
      const f = new T.Vector3(-Math.sin(w.yaw), 0, -Math.cos(w.yaw)), side = new T.Vector3(-f.z, 0, f.x);
      const eye = new T.Vector3(w.pos.x, w.ground(w.pos.x, w.pos.z) + w.eye, w.pos.z);
      const focus = o.focus ? new T.Vector3(...o.focus) : eye.clone().addScaledVector(f, 18);
      const R = o.radius || 46, H = o.height || 30;
      w.cinematic([
        { p: focus.clone().addScaledVector(f, R * 0.6).addScaledVector(side, -R).add(new T.Vector3(0, H * 1.2, 0)).toArray(), l: focus.toArray() },
        { p: focus.clone().addScaledVector(f, -R * 0.2).addScaledVector(side, -R * 0.9).add(new T.Vector3(0, H * 0.7, 0)).toArray(), l: focus.toArray() },
        { p: eye.clone().addScaledVector(f, -R * 0.55).addScaledVector(side, R * 0.25).add(new T.Vector3(0, H * 0.3, 0)).toArray(), l: focus.toArray() },
        { p: eye.toArray(), l: eye.clone().addScaledVector(f, 10).toArray() },
      ], o.dur || 7.5);
    };
    const touchy = matchMedia('(pointer: coarse)').matches;
    if (touchy) layer.classList.add('touch');
    w.ui.ebtn.addEventListener('pointerdown', e => { e.stopPropagation(); w.keys.add('e'); press(); });
    w.ui.ebtn.addEventListener('pointerup', e => { e.stopPropagation(); w.keys.delete('e'); });
    w.ui.ebtn.addEventListener('pointercancel', () => w.keys.delete('e'));

    function press() {
      const it = w.focus; if (!it) return;
      if (it.hold) return; // handled while held
      use(it);
    }
    function use(it) {
      it.uses++;
      if (it.once) it.done = true;
      it.onUse && it.onUse(w, it);
      w.onUse && w.onUse(it);
    }

    /* ---------- input (wired by the stage) ---------- */
    w.key = e => {
      if (w.cine) { w.skipCinematic(); return; }
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (k === 'e' && !w.keys.has('e')) { w.keys.add('e'); press(); return; }
      w.keys.add(k);
    };
    w.keyup = e => { const k = e.key.length === 1 ? e.key.toLowerCase() : e.key; w.keys.delete(k); };
    w.blur = () => w.keys.clear();
    w.down = (p, e) => {
      if (w.cine) { w.skipCinematic(); return; }
      if (e.pointerType === 'mouse' || !e.pointerType) {
        if (!w.locked && o.pointerLock !== false && host.requestPointerLock) {
          try { const r = host.requestPointerLock(); if (r && r.catch) r.catch(() => {}); } catch (_) {}
        }
        w.look = { id: e.pointerId, x: e.clientX, y: e.clientY };
        return;
      }
      if (e.clientX < env.w * 0.42 && !w.joy) {
        w.joy = { id: e.pointerId, x: e.clientX, y: e.clientY, dx: 0, dy: 0 };
        w.ui.joy.style.left = `${e.clientX - 55}px`; w.ui.joy.style.top = `${e.clientY - 55}px`; w.ui.joy.classList.add('on');
      } else w.look = { id: e.pointerId, x: e.clientX, y: e.clientY };
    };
    w.move = (p, e) => {
      if (w.locked) { w.yaw -= (e.movementX || 0) * 0.0022; w.pitch -= (e.movementY || 0) * 0.0022; clampPitch(); return; }
      if (w.joy && e.pointerId === w.joy.id) {
        let dx = e.clientX - w.joy.x, dy = e.clientY - w.joy.y; const d = Math.hypot(dx, dy), m = 46;
        if (d > m) { dx = dx / d * m; dy = dy / d * m; }
        w.joy.dx = dx / m; w.joy.dy = dy / m;
        w.ui.knob.style.transform = `translate(${dx}px, ${dy}px)`;
        return;
      }
      if (w.look && e.pointerId === w.look.id && (p.down || e.pointerType !== 'mouse')) {
        const k = e.pointerType === 'mouse' ? 0.004 : 0.006;
        w.yaw += (e.clientX - w.look.x) * k; w.pitch += (e.clientY - w.look.y) * k; clampPitch();
        w.look.x = e.clientX; w.look.y = e.clientY;
      }
    };
    w.up = (p, e) => {
      if (w.joy && e.pointerId === w.joy.id) { w.joy = null; w.ui.knob.style.transform = ''; w.ui.joy.classList.remove('on'); }
      if (w.look && e.pointerId === w.look.id) w.look = null;
    };
    function clampPitch() { w.pitch = U.clamp(w.pitch, -1.35, 1.35); }
    const onLock = () => { w.locked = document.pointerLockElement === host; layer.classList.toggle('locked', w.locked); };
    document.addEventListener('pointerlockchange', onLock);

    /* ---------- helpers ---------- */
    w.tex = (size, draw, rep) => {
      const c = document.createElement('canvas'); c.width = c.height = size;
      draw(c.getContext('2d'), size);
      const t = new T.CanvasTexture(c);
      t.wrapS = t.wrapT = T.RepeatWrapping; t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
      if (rep) t.repeat.set(rep[0], rep[1]);
      t.encoding = T.sRGBEncoding;
      return t;
    };
    w.sky = so => {
      const mat = new T.ShaderMaterial({
        vertexShader: SKY_VERT, fragmentShader: SKY_FRAG, side: T.BackSide, depthWrite: false, fog: false,
        uniforms: {
          uTop: { value: new T.Color(so.top) }, uMid: { value: new T.Color(so.mid) }, uBot: { value: new T.Color(so.bot || so.mid) },
          uSunDir: { value: new T.Vector3(...(so.sunDir || [0, 1, 0])).normalize() }, uSun: { value: new T.Color(so.sun || '#000000') },
          uStars: { value: so.stars || 0 }, uTime: { value: 0 }, uSunSize: { value: so.sunSize || 0.0012 },
        },
      });
      const m = new T.Mesh(new T.SphereGeometry(o.far ? o.far * 0.9 : 1000, 32, 16), mat);
      m.renderOrder = -10; m.frustumCulled = false;
      scene.add(m); w.skyMesh = m; return m;
    };
    w.spatial = (v, ref) => {
      const dx = v.x - w.pos.x, dz = v.z - w.pos.z, d = Math.hypot(dx, dz) || 1e-3;
      const rx = Math.cos(w.yaw), rz = -Math.sin(w.yaw), R = ref || 6;
      return { pan: U.clamp((dx * rx + dz * rz) / d, -1, 1) * 0.85, gain: 1 / (1 + (d * d) / (R * R)), dist: d };
    };
    /* Merge every static mesh under `root` into one mesh per material: a few draw calls
       instead of hundreds. Meshes marked userData.dynamic, shader-material meshes and
       vertex-coloured terrain are left alone. */
    w.bake = root => {
      if (window.NOBAKE) return { merged: 0, calls: 0 };
      root = root || scene;
      root.updateMatrixWorld(true);
      const groups = new Map(), victims = [];
      root.traverse(m => {
        if (!m.isMesh || m.isSkinnedMesh || Array.isArray(m.material) || m.material.isShaderMaterial) return;
        for (let p = m; p; p = p.parent) if (p.userData && p.userData.dynamic) return;
        const g0 = m.geometry;
        if (!g0.attributes.position || g0.attributes.color || g0.groups.length > 1) return;
        const g = g0.index ? g0.toNonIndexed() : g0.clone();
        g.applyMatrix4(m.matrixWorld);
        if (!g.attributes.normal) g.computeVertexNormals();
        const k = m.material.uuid + (m.castShadow ? 'c' : '') + (m.receiveShadow ? 'r' : '');
        if (!groups.has(k)) groups.set(k, { mat: m.material, cast: m.castShadow, recv: m.receiveShadow, list: [] });
        groups.get(k).list.push(g);
        victims.push(m);
      });
      victims.forEach(m => m.parent && m.parent.remove(m));
      let calls = 0;
      groups.forEach(({ mat, cast, recv, list }) => {
        let n = 0; list.forEach(g => { n += g.attributes.position.count; });
        const P = new Float32Array(n * 3), N = new Float32Array(n * 3), UV = new Float32Array(n * 2);
        let o = 0;
        list.forEach(g => {
          const c = g.attributes.position.count;
          P.set(g.attributes.position.array, o * 3); N.set(g.attributes.normal.array, o * 3);
          if (g.attributes.uv) UV.set(g.attributes.uv.array, o * 2);
          o += c; g.dispose();
        });
        const geo = new T.BufferGeometry();
        geo.setAttribute('position', new T.BufferAttribute(P, 3)); geo.setAttribute('normal', new T.BufferAttribute(N, 3)); geo.setAttribute('uv', new T.BufferAttribute(UV, 2));
        geo.computeBoundingSphere();
        const mesh = new T.Mesh(geo, mat); mesh.castShadow = cast; mesh.receiveShadow = recv;
        scene.add(mesh); calls++;
      });
      return { merged: victims.length, calls };
    };
    /* A sun or moon whose shadow camera travels with the walker: crisp shadows nearby at any scene size. */
    w.followShadow = (light, size, mapSize) => {
      light.castShadow = true; renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
      light.shadow.mapSize.set(mapSize || 2048, mapSize || 2048);
      const c = light.shadow.camera; c.left = c.bottom = -size; c.right = c.top = size; c.near = 0.5; c.far = size * 6; c.updateProjectionMatrix();
      light.shadow.bias = -0.0006; light.shadow.normalBias = 0.04;
      const off = light.position.clone().normalize().multiplyScalar(size * 2.5);
      if (!light.target.parent) scene.add(light.target);
      w._shadow = { light, off };
      return light;
    };
    /* Image-based light from the sky dome: glossy marble, brass and glass reflect the real sky. */
    w.envFromSky = () => {
      if (!w.skyMesh) return;
      const pm = w._pmrem || (w._pmrem = new T.PMREMGenerator(renderer));
      const tmp = new T.Scene(), m = new T.Mesh(new T.SphereGeometry(100, 32, 16), w.skyMesh.material);
      tmp.add(m);
      const rt = pm.fromScene(tmp, 0);
      if (w._envRT) w._envRT.dispose();
      w._envRT = rt; scene.environment = rt.texture;
      m.geometry.dispose();
    };
    w.receiveAll = () => scene.traverse(o => { if (o.isMesh && !o.material.isShaderMaterial) { o.receiveShadow = true; if (!o.userData.noCast) o.castShadow = true; } });
    w.forward = () => new T.Vector3(-Math.sin(w.yaw) * Math.cos(w.pitch), Math.sin(w.pitch), -Math.cos(w.yaw) * Math.cos(w.pitch));
    w.resize = () => { renderer.setSize(env.w, env.h, false); camera.aspect = env.w / env.h; camera.updateProjectionMatrix(); };

    /* ---------- the step ---------- */
    const fwd = new T.Vector3(), right = new T.Vector3(), want = new T.Vector3(), next = new T.Vector3();
    const cA = new T.Vector3(), cB = new T.Vector3();
    const spline = (arr, t, out) => {
      const n = arr.length - 1, x = U.clamp(t) * n, i = Math.min(n - 1, Math.floor(x)), u = x - i;
      const p0 = arr[Math.max(0, i - 1)], p1 = arr[i], p2 = arr[i + 1], p3 = arr[Math.min(n, i + 2)];
      const u2 = u * u, u3 = u2 * u;
      return out.set(
        0.5 * (2 * p1.x + (-p0.x + p2.x) * u + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * u2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * u3),
        0.5 * (2 * p1.y + (-p0.y + p2.y) * u + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * u2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * u3),
        0.5 * (2 * p1.z + (-p0.z + p2.z) * u + (2 * p0.z - 5 * p1.z + 4 * p2.z - p3.z) * u2 + (-p0.z + 3 * p1.z - 3 * p2.z + p3.z) * u3));
    };
    w.update = dt => {
      w.time += dt;
      if (w.cine) {
        const c = w.cine; c.t += dt;
        const k = U.ease(U.clamp(c.t / c.dur));
        // the last key is always the walker's present view
        c.P[c.P.length - 1].set(w.pos.x, w.y + w.eye, w.pos.z);
        c.L[c.L.length - 1].set(w.pos.x - Math.sin(w.yaw) * 10 * Math.cos(w.pitch), w.y + w.eye + Math.sin(w.pitch) * 10, w.pos.z - Math.cos(w.yaw) * 10 * Math.cos(w.pitch));
        camera.position.copy(spline(c.P, k, cA));
        camera.lookAt(spline(c.L, k, cB));
        w.y = w.ground(w.pos.x, w.pos.z);
        if (w.skyMesh) w.skyMesh.material.uniforms.uTime.value = w.time;
        w.ui.prompt.classList.remove('show');
        if (c.t >= c.dur) { endCinematic(); camera.rotation.order = 'YXZ'; }
        return;
      }
      if (w.skyMesh) w.skyMesh.material.uniforms.uTime.value = w.time;
      const k = w.keys;
      let mx = 0, mz = 0;
      if (w.enabled) {
        if (k.has('w') || k.has('ArrowUp')) mz += 1;
        if (k.has('s') || k.has('ArrowDown')) mz -= 1;
        if (k.has('a')) mx -= 1;
        if (k.has('d')) mx += 1;
        if (k.has('ArrowLeft')) w.yaw += dt * 1.9;
        if (k.has('ArrowRight')) w.yaw -= dt * 1.9;
        if (w.joy) { mx += w.joy.dx; mz -= w.joy.dy; }
      }
      const ml = Math.hypot(mx, mz); if (ml > 1) { mx /= ml; mz /= ml; }
      fwd.set(-Math.sin(w.yaw), 0, -Math.cos(w.yaw)); right.set(-fwd.z, 0, fwd.x);
      const spd = (k.has('Shift') ? w.run : w.speed);
      want.copy(fwd).multiplyScalar(mz * spd).addScaledVector(right, mx * spd);
      w.vel.lerp(want, 1 - Math.exp(-dt * 9));
      next.copy(w.pos).addScaledVector(w.vel, dt);
      collide(next);
      const moved = Math.hypot(next.x - w.pos.x, next.z - w.pos.z);
      w.pos.copy(next);
      w.moving = moved / Math.max(dt, 1e-4);
      const gy = w.ground(w.pos.x, w.pos.z);
      w.y = U.damp(w.y, gy, 14, dt);
      // head bob and footsteps
      const before = w.bob;
      w.bob += moved * 1.75;
      if (Math.floor(before / Math.PI) !== Math.floor(w.bob / Math.PI) && w.moving > 0.4) {
        const surf = w.surface(w.pos.x, w.pos.z);
        footstep(surf, w.moving / w.speed);
        w.onStep && w.onStep(surf);
      }
      const amp = U.clamp(w.moving / w.speed) * 0.045;
      if (w._shadow) {
        const L = w._shadow.light, snap = 1.5; // snap to stop shadow edges shimmering as you walk
        const px = Math.round(w.pos.x / snap) * snap, pz = Math.round(w.pos.z / snap) * snap;
        L.target.position.set(px, 0, pz); L.position.set(px + w._shadow.off.x, w._shadow.off.y, pz + w._shadow.off.z);
      }
      camera.position.set(w.pos.x, w.y + w.eye + Math.abs(Math.sin(w.bob)) * amp - amp * 0.5, w.pos.z);
      camera.rotation.set(w.pitch, w.yaw, Math.sin(w.bob) * amp * 0.12);

      // what is in reach?
      const look = w.forward();
      let best = null, bd = 1e9;
      for (const it of w.items) {
        if (it.done || (it.enabled && !it.enabled(w))) continue;
        const dx = it.pos.x - w.pos.x, dz = it.pos.z - w.pos.z, dy = it.pos.y - (w.y + w.eye);
        const d = Math.hypot(dx, dz); if (d > it.r) continue;
        const dl = Math.hypot(dx, dy, dz);
        const facing = (dx * look.x + dy * look.y + dz * look.z) / dl;
        if (facing < (d < 1.4 ? 0.2 : 0.72)) continue;
        const score = d - facing * 2;
        if (score < bd) { bd = score; best = it; }
      }
      if (best !== w.focus) { w.focus = best; w.holdT = 0; }
      if (best) {
        w.ui.label.textContent = typeof best.label === 'function' ? best.label(w) : best.label;
        w.ui.prompt.classList.add('show'); w.ui.ebtn.classList.add('show');
        if (best.hold) {
          if (k.has('e')) {
            w.holdT += dt;
            best.onHold && best.onHold(w, best, w.holdT / best.hold, dt);
            if (w.holdT >= best.hold) { w.holdT = 0; use(best); }
          } else w.holdT = Math.max(0, w.holdT - dt * 2);
          w.ui.ring.style.setProperty('--p', `${(w.holdT / best.hold) * 360}deg`);
        } else w.ui.ring.style.setProperty('--p', '0deg');
      } else { w.ui.prompt.classList.remove('show'); w.ui.ebtn.classList.remove('show'); }
    };
    w.render = () => renderer.render(scene, camera);

    function footstep(surf, intensity) {
      const g = 0.06 + 0.06 * U.clamp(intensity, 0, 1.5);
      if (surf === 'sand') SND.step(env.bus, { gain: g * 1.4, f: U.rnd(500, 800) });
      else if (surf === 'gravel') { SND.step(env.bus, { gain: g * 1.2, f: U.rnd(900, 1400) }); SND.knock(env.bus, { f: U.rnd(300, 500), gain: g * 0.12, click: 4000 }); }
      else if (surf === 'stone') SND.knock(env.bus, { f: U.rnd(90, 120), gain: g * 0.9, click: U.rnd(1800, 2600) });
      else if (surf === 'marble') SND.knock(env.bus, { f: U.rnd(140, 170), gain: g * 0.6, click: U.rnd(3500, 4500) });
      else if (surf === 'water') { SND.drop(env.bus, { f: U.rnd(300, 500), gain: g * 0.6 }); SND.step(env.bus, { gain: g, f: 1500 }); }
      else if (surf === 'wood') SND.knock(env.bus, { f: U.rnd(180, 230), gain: g * 1.1, click: 900 });
      else SND.step(env.bus, { gain: g, f: U.rnd(400, 700) });
    }

    w.dispose = () => {
      document.removeEventListener('pointerlockchange', onLock);
      try { if (document.pointerLockElement) document.exitPointerLock(); } catch (_) {}
      clearTimeout(cardTimer);
      layer.remove();
      scene.traverse(obj => {
        if (obj.geometry) obj.geometry.dispose();
        const mats = obj.material ? (Array.isArray(obj.material) ? obj.material : [obj.material]) : [];
        mats.forEach(m => { for (const key in m) { const v = m[key]; if (v && v.isTexture) v.dispose(); } m.dispose(); });
      });
      if (w._envRT) w._envRT.dispose(); if (w._pmrem) w._pmrem.dispose();
      renderer.dispose();
      try { renderer.forceContextLoss(); } catch (_) {}
    };

    if (o.fog) scene.fog = o.fog.density ? new T.FogExp2(o.fog.color, o.fog.density) : new T.Fog(o.fog.color, o.fog.near, o.fog.far);
    return w;
  }

  /* A stage built on WORLD gets the standard input wiring and lifecycle for free. */
  function stage(def) {
    const enter = def.enter;
    def.enter = function (env) {
      enter.call(this, env);
      if (this.w && !this.w.cine && this.cinematic !== false) {
        // a station may script its own entrance as a list of camera shots
        if (this.shots) this.w.cinematic(this.shots(env, this.w).map(([p, l]) => ({ p, l })), this.shotDur || 9.5);
        else this.w.autoCinematic(this.intro || {});
      }
    };
    // stations name themselves with a string `key`; here that name must not shadow the key handler
    const id = def.key; delete def.key;
    def.id = id;
    return Object.assign({
      captureKeys: true,
      hintTouch: 'Left thumb to walk \u00b7 right thumb to look \u00b7 tap E when it appears',
      key(env, e) { this.w && this.w.key(e); def.onKey && def.onKey.call(this, env, e); },
      keyup(env, e) { this.w && this.w.keyup(e); },
      blur() { this.w && this.w.blur(); },
      down(env, p, e) { this.w && this.w.down(p, e); },
      move(env, p, e) { this.w && this.w.move(p, e); },
      up(env, p, e) { this.w && this.w.up(p, e); },
      resize() { this.w && this.w.resize(); },
      render() { this.w && this.w.render(); },
      leave() { if (this.w) { this.w.dispose(); this.w = null; } def.onLeave && def.onLeave.call(this); },
      unlockSoon() { setTimeout(() => { try { if (document.pointerLockElement) document.exitPointerLock(); } catch (_) {} }, 3500); },
    }, def);
  }

  window.WORLD = { create, stage, TAU };
})();
