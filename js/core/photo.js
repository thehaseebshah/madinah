/* PHOTO — photoreal assets: photo-scanned PBR materials, HDRI skies and scanned models,
   all CC0 from Poly Haven (polyhaven.com), prepared by tools/assets/fetch-polyhaven.py.

   PHOTO.mat(w, id, { rep, color, normal, rough, triplanar, side, fallback })   -> MeshStandardMaterial
   PHOTO.sky(w, id, { rotation, background, env, intensity, exposure, tint, sun: DirectionalLight }) -> Promise<{ sunDir }>
   PHOTO.model(w, id) -> Promise<{ parts: [{ geo, mat }], size: Vector3 }>   (geometry rests on y = 0, centred in x/z)
   PHOTO.place(w, id, { pos, s, ry, collide })      -> Promise<Group>   one model in the scene
   SCAPE.scatter(w, { kind: 'model', model: id, ... })  instanced scanned models (see scape.js)
   PHOTO.texture(w, id, map) -> Texture             one map of a texture set ('diff' | 'nor' | 'arm')

   Everything is progressive: a material is usable at once (procedural fallback or plain colour)
   and sharpens when the photo maps arrive. Opened from file:// the browser forbids WebGL from
   using local images, so the procedural look stays. */
(function () {
  'use strict';
  if (!window.THREE) { window.PHOTO = null; return; }
  const T = THREE;
  const P = {};
  P.base = 'assets/';
  P.enabled = location.protocol !== 'file:' && !/[?&]photo=0/.test(location.search);
  P.ids = {
    tex: 'dense_sand gravelly_sand coast_sand_01 dry_ground_rocks mud_cracked_dry_03 dirt rock_face rock_face_03 rock_boulder_dry dark_rock dry_riverbed_rock quarry_wall clay_plaster brown_mud_dry clay_block_wall patterned_clay_plaster old_stone_wall plastered_stone_wall marble_01 palm_tree_bark medieval_wood old_planks_02 rough_linen brown_leather'.split(' '),
    sky: 'qwantani_dawn_puresky qwantani_sunrise_puresky qwantani_morning_puresky qwantani_noon_puresky qwantani_late_afternoon_puresky qwantani_sunset_puresky qwantani_dusk_2_puresky qwantani_moonrise_puresky qwantani_night_puresky kloofendal_43d_clear_puresky syferfontein_6d_clear_puresky'.split(' '),
    model: 'namaqualand_boulder_02 namaqualand_boulder_04 namaqualand_boulder_05 namaqualand_rocks_01 namaqualand_stones_01 namaqualand_cliff_01 rock_07 boulder_01 sand_rocks_small_01 dead_tree_trunk dry_branches_medium_01 shrub_01 shrub_03 wild_rooibos_bush grass_medium_01 stone_fire_pit wicker_basket_01 ceramic_vase_01 jug_01 brass_pot_01 brass_diya_lantern vintage_oil_lamp wooden_bowl_01 food_pomegranate_01'.split(' '),
  };

  /* ---------- images, cached for the whole session ---------- */
  const imgs = new Map();
  function image(url) {
    if (!imgs.has(url)) imgs.set(url, new Promise((res, rej) => { const im = new Image(); im.decoding = 'async'; im.onload = () => res(im); im.onerror = rej; im.src = url; }));
    return imgs.get(url);
  }
  // mean colour (linear) of an image, so a photo map can act as detail around 1.0
  const avgCache = new WeakMap();
  P.avg = im => {
    if (avgCache.has(im)) return avgCache.get(im);
    const c = document.createElement('canvas'); c.width = c.height = 32; const g = c.getContext('2d');
    g.drawImage(im, 0, 0, 32, 32); const d = g.getImageData(0, 0, 32, 32).data; let r = 0, gg = 0, b = 0;
    for (let i = 0; i < d.length; i += 4) { r += Math.pow(d[i] / 255, 2.2); gg += Math.pow(d[i + 1] / 255, 2.2); b += Math.pow(d[i + 2] / 255, 2.2); }
    const n = d.length / 4, v = new T.Vector3(r / n, gg / n, b / n); avgCache.set(im, v); return v;
  };

  P.texture = (w, id, map, opts) => {
    opts = opts || {};
    const t = new T.Texture();
    t.wrapS = t.wrapT = T.RepeatWrapping;
    t.anisotropy = Math.min(8, w.renderer.capabilities.getMaxAnisotropy());
    t.encoding = map === 'diff' ? T.sRGBEncoding : T.LinearEncoding;
    if (opts.rep) t.repeat.set(opts.rep[0], opts.rep[1]);
    t.ready = P.enabled ? image(`${P.base}tex/${id}/${map}.jpg`).then(im => { t.image = im; t.needsUpdate = true; t._avg = P.avg(im); return t; }) : Promise.reject(new Error('photo assets disabled'));
    t.ready.catch(() => {});
    return t;
  };

  /* A photo PBR material: albedo, normal and roughness from a scanned texture set. */
  P.mat = (w, id, o) => {
    o = o || {};
    const m = new T.MeshStandardMaterial({ color: o.color != null ? o.color : 0xffffff, roughness: o.rough != null ? o.rough : 1, metalness: o.metal || 0, side: o.side || T.FrontSide });
    if (o.fallback) m.map = o.fallback;
    if (!P.enabled) { if (!o.fallback && o.fallbackColor) m.color.set(o.fallbackColor); return m; }
    const rep = o.rep || [1, 1];
    const diff = P.texture(w, id, 'diff', { rep }), nor = P.texture(w, id, 'nor', { rep }), arm = P.texture(w, id, 'arm', { rep });
    diff.ready.then(() => { m.map = diff; m.needsUpdate = true; }).catch(() => {});
    if (!o.triplanar) {
      nor.ready.then(() => { m.normalMap = nor; m.normalScale.set(o.normal || 1, -(o.normal || 1)); m.needsUpdate = true; }).catch(() => {});
      arm.ready.then(() => { m.roughnessMap = arm; m.needsUpdate = true; }).catch(() => {});
    } else if (window.SCAPE) SCAPE.triplanar(m, o.triplanar);
    m.ready = Promise.all([diff.ready, nor.ready, arm.ready]).catch(() => {});
    return m;
  };

  /* ---------- HDRI skies ---------- */
  const hdrs = new Map();
  function hdr(id) {
    if (!hdrs.has(id)) hdrs.set(id, new Promise((res, rej) => {
      if (!T.RGBELoader) return rej(new Error('no RGBELoader'));
      new T.RGBELoader().setDataType(T.UnsignedByteType).load(`${P.base}sky/${id}.hdr`, (tex, data) => res({ tex, data }), undefined, rej);
    }));
    return hdrs.get(id);
  }
  // brightest region of an RGBE image → direction of the sun or moon, in three.js's equirect convention
  function sunOf(d) {
    const W = d.width, H = d.height, a = d.data;
    let best = -1, bx = 0, by = 0;
    for (let y = 0; y < H * 0.55; y++) for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4, e = a[i + 3]; if (!e) continue;
      const l = (a[i] + a[i + 1] + a[i + 2]) * Math.pow(2, e - 136);
      if (l > best) { best = l; bx = x; by = y; }
    }
    const u = (bx + 0.5) / W, v = 1 - (by + 0.5) / H, ph = (u - 0.5) * Math.PI * 2, th = (v - 0.5) * Math.PI;
    return { dir: new T.Vector3(Math.cos(th) * Math.cos(ph), Math.sin(th), Math.cos(th) * Math.sin(ph)), lum: best };
  }
  // rotate an RGBE image about the vertical axis by rolling its columns
  function rolled(d, rot) {
    const W = d.width, H = d.height, k = Math.round(((rot / (Math.PI * 2)) % 1 + 1) % 1 * W);
    if (!k) return d.data;
    const out = new Uint8Array(d.data.length);
    for (let y = 0; y < H; y++) { const row = y * W * 4; for (let x = 0; x < W; x++) { const s = row + x * 4, t = row + ((x + k) % W) * 4; out[t] = d.data[s]; out[t + 1] = d.data[s + 1]; out[t + 2] = d.data[s + 2]; out[t + 3] = d.data[s + 3]; } }
    return out;
  }
  // "puresky" panoramas are empty below the horizon; give the lighting a sunlit ground to bounce from
  function withGround(d, src, color, k) {
    const W = d.width, H = d.height, out = new Uint8Array(src);
    // average radiance of the sky just above the horizon
    let r = 0, g = 0, b = 0, n = 0; const y0 = Math.floor(H * 0.42), y1 = Math.floor(H * 0.49);
    for (let y = y0; y < y1; y++) for (let x = 0; x < W; x += 2) { const i = (y * W + x) * 4, e = src[i + 3]; if (!e) continue; const f = Math.pow(2, e - 136); r += src[i] * f; g += src[i + 1] * f; b += src[i + 2] * f; n++; }
    const c = new T.Color(color || '#b89a78').convertSRGBToLinear(), m = (k == null ? 0.55 : k) / Math.max(1, n);
    const R = r * m * c.r * 3, G = g * m * c.g * 3, B = b * m * c.b * 3;
    const v = Math.max(R, G, B); let e = 0, s = 0;
    if (v > 1e-32) { e = Math.ceil(Math.log2(v)); s = 255 / Math.pow(2, e) * 0.999; }
    const px = v > 1e-32 ? [Math.floor(R * s), Math.floor(G * s), Math.floor(B * s), e + 128] : [0, 0, 0, 0];
    const yh = Math.floor(H * 0.5);
    for (let y = yh; y < H; y++) { const fade = Math.min(1, (y - yh) / (H * 0.03)); for (let x = 0; x < W; x++) { const i = (y * W + x) * 4; if (fade >= 1 || !out[i + 3]) { out[i] = px[0]; out[i + 1] = px[1]; out[i + 2] = px[2]; out[i + 3] = px[3]; } } }
    return out;
  }
  const BG_V = 'varying vec3 vDir; void main(){ vDir = normalize((modelMatrix*vec4(position,1.)).xyz - cameraPosition); gl_Position = projectionMatrix*viewMatrix*modelMatrix*vec4(position,1.); }';
  const BG_F = `uniform sampler2D tSky; uniform float uRot; uniform float uGain; uniform vec3 uTint; uniform float uHorizon; uniform vec3 uHaze; varying vec3 vDir;
    void main(){ vec3 d = normalize(vDir); float ph = atan(d.z, d.x) - uRot; float y = d.y;
      vec2 uv = vec2(ph * 0.15915494 + 0.5, asin(clamp(max(y, 0.004), -1., 1.)) * 0.31830989 + 0.5);
      vec3 c = texture2D(tSky, uv).rgb * uGain * uTint;
      c = mix(c, uHaze, uHorizon * exp(-max(y, 0.) * 14.));
      if (y < 0.) c = uHaze;
      gl_FragColor = vec4(c, 1.); }`;
  /* o: { rotation (radians, turns the sky and its sun), background (default true), env (default true),
          intensity (environment light, default 1), gain (background brightness), tint, haze (horizon colour),
          horizon (0..1 haze strength), sun: DirectionalLight to align with the sky's sun, sunDistance } */
  P.sky = (w, id, o) => {
    o = o || {};
    const rot = o.rotation || 0;
    if (!P.enabled) return Promise.resolve(null);
    const out = {};
    if (o.background !== false) {
      const tex = new T.Texture(); tex.encoding = T.LinearEncoding; tex.wrapS = T.RepeatWrapping; tex.minFilter = T.LinearFilter; tex.generateMipmaps = false; // no mipmaps: no seam where the panorama wraps
      const mat = new T.ShaderMaterial({ vertexShader: BG_V, fragmentShader: BG_F, side: T.BackSide, depthWrite: false, fog: false,
        uniforms: { tSky: { value: tex }, uRot: { value: rot }, uGain: { value: o.gain == null ? 1 : o.gain }, uTint: { value: new T.Color(o.tint || '#ffffff') },
          uHorizon: { value: o.horizon == null ? 0.35 : o.horizon }, uHaze: { value: new T.Color(o.haze || (w.scene.fog ? w.scene.fog.color : '#d8c8b0')) } } });
      const r = (w.camera.far || 1200) * 0.9;
      const m = new T.Mesh(new T.SphereGeometry(r, 48, 24), mat); m.renderOrder = -10; m.frustumCulled = false; m.userData.dynamic = true; m.visible = false;
      w.scene.add(m); out.mesh = m; out.material = mat;
      image(`${P.base}sky/${id}.jpg`).then(im => {
        tex.image = im; tex.needsUpdate = true; m.visible = true;
        // the photo sky replaces the procedural one
        if (w.skyMesh && w.skyMesh !== m) w.skyMesh.visible = false;
        w.skyMesh = m; m.material.uniforms.uTime = { value: 0 };
      }).catch(() => {});
    }
    return hdr(id).then(({ tex, data }) => {
      const sun = sunOf(data);
      // rotate the sun direction with the sky
      const c = Math.cos(rot), s = Math.sin(rot), d = sun.dir;
      out.sunDir = new T.Vector3(d.x * c - d.z * s, d.y, d.x * s + d.z * c).normalize();
      out.sunLum = sun.lum;
      if (o.sun) { const L = o.sun, dist = o.sunDistance || L.position.length() || 100; L.position.copy(out.sunDir).multiplyScalar(dist); if (w._shadow && w._shadow.light === L) w._shadow.off.copy(out.sunDir).multiplyScalar(w._shadow.off.length()); }
      if (o.env !== false) {
        let t = tex;
        const rgbe = withGround(data, rolled(data, rot), o.ground, o.bounce);
        { t = new T.DataTexture(rgbe, data.width, data.height, T.RGBEFormat, T.UnsignedByteType); t.encoding = T.RGBEEncoding; t.flipY = true; t.minFilter = t.magFilter = T.NearestFilter; t.generateMipmaps = false; t.needsUpdate = true; }
        const pm = new T.PMREMGenerator(w.renderer);
        const rt = pm.fromEquirectangular(t);
        pm.dispose(); if (t !== tex) t.dispose();
        w.scene.environment = rt.texture; w._envRT && w._envRT.dispose(); w._envRT = rt;
        if (o.intensity != null) P.envIntensity(w, o.intensity);
      }
      return out;
    }).catch(e => { console.warn('PHOTO.sky', id, e && e.message); return out; });
  };
  // scale the image-based light on every standard material in the scene
  P.envIntensity = (w, k) => { w._envK = k; w.scene.traverse(m => { const ms = m.material ? (Array.isArray(m.material) ? m.material : [m.material]) : []; ms.forEach(x => { if (x.isMeshStandardMaterial) x.envMapIntensity = k; }); }); };

  // light versions (about 1,600–2,600 triangles, 512px maps) for scattering by the hundred
  P.lods = new Set('boulder_01 dead_tree_trunk dry_branches_medium_01 grass_medium_01 namaqualand_boulder_02 namaqualand_boulder_04 namaqualand_boulder_05 namaqualand_rocks_01 namaqualand_stones_01 rock_07 sand_rocks_small_01 shrub_01 shrub_03 wild_rooibos_bush'.split(' '));
  /* ---------- scanned models ---------- */
  const gltfs = new Map();
  function gltf(id) {
    if (!gltfs.has(id)) gltfs.set(id, new Promise((res, rej) => {
      if (!P.enabled || !T.GLTFLoader) return rej(new Error('models unavailable'));
      new T.GLTFLoader().load(`${P.base}models/${id}.glb`, res, undefined, rej);  // id may end in '.lod'
    }));
    return gltfs.get(id);
  }
  // every mesh baked into its own geometry in model space, resting on y = 0 and centred
  P.model = (w, id, lod) => gltf(lod && P.lods.has(id) ? id + '.lod' : id).then(g => {
    const root = g.scene; root.updateMatrixWorld(true);
    const box = new T.Box3().setFromObject(root), size = box.getSize(new T.Vector3()), ctr = box.getCenter(new T.Vector3());
    const parts = [];
    root.traverse(m => {
      if (!m.isMesh) return;
      const geo = m.geometry.clone();
      // dequantise (KHR_mesh_quantization stores normalised integers) so instancing, shadows and merges see real numbers
      ['position', 'normal', 'uv', 'uv2', 'tangent'].forEach(k => {
        const at = geo.attributes[k]; if (!at) return;
        const A = at.isInterleavedBufferAttribute ? at.data.array : at.array;
        if (A instanceof Float32Array && !at.isInterleavedBufferAttribute) return;
        const n = at.count, sz = at.itemSize, f = new Float32Array(n * sz);
        const div = !at.normalized ? 1 : A instanceof Int8Array ? 127 : A instanceof Uint8Array ? 255 : A instanceof Int16Array ? 32767 : A instanceof Uint16Array ? 65535 : 1;
        const signed = at.normalized && (A instanceof Int8Array || A instanceof Int16Array);
        const get = [i => at.getX(i), i => at.getY(i), i => at.getZ(i), i => at.getW(i)];
        for (let i = 0; i < n; i++) for (let j = 0; j < sz; j++) { const v = get[j](i) / div; f[i * sz + j] = signed ? Math.max(v, -1) : v; }
        geo.setAttribute(k, new T.BufferAttribute(f, at.itemSize));
      });
      geo.applyMatrix4(m.matrixWorld); geo.translate(-ctr.x, -box.min.y, -ctr.z);
      if (!geo.attributes.normal) geo.computeVertexNormals();
      geo.computeBoundingSphere();
      const mat = m.material.clone();
      if (mat.map) mat.map.anisotropy = 4;
      if (w._envK != null) mat.envMapIntensity = w._envK;
      parts.push({ geo, mat, cast: true, uniform: true });
    });
    // a "set" (several rocks or shrubs laid out side by side) becomes separate variants, each centred on its own base
    let variants = null;
    if (parts.length > 1) {
      parts.forEach(p => { p.geo.computeBoundingBox(); p.box = p.geo.boundingBox.clone(); });
      const apart = (a, b) => a.max.x < b.min.x || b.max.x < a.min.x || a.max.z < b.min.z || b.max.z < a.min.z;
      let disjoint = true;
      for (let i = 0; i < parts.length && disjoint; i++) for (let j = i + 1; j < parts.length; j++) if (!apart(parts[i].box, parts[j].box)) { disjoint = false; break; }
      if (disjoint) variants = parts.map(p => {
        const g = p.geo.clone(), b = p.box, c = b.getCenter(new T.Vector3());
        g.translate(-c.x, -b.min.y, -c.z); g.computeBoundingSphere();
        return [Object.assign({}, p, { geo: g, size: b.getSize(new T.Vector3()) })];
      });
    }
    return { parts, size, variants: variants || [parts] };
  });
  P.place = (w, id, o) => {
    o = o || {};
    const g = new T.Group(); w.scene.add(g); g.userData.dynamic = true;
    const s = o.s || 1, pos = o.pos || [0, 0, 0];
    g.position.set(pos[0], pos[1] != null ? pos[1] : w.ground(pos[0], pos[2]), pos[2]); g.rotation.y = o.ry || 0; g.scale.setScalar(s);
    return P.model(w, id).then(({ parts, size }) => {
      parts.forEach(p => { const m = new T.Mesh(p.geo, p.mat); m.castShadow = o.cast !== false; m.receiveShadow = true; g.add(m); });
      if (o.collide) w.addCircle(g.position.x, g.position.z, Math.max(size.x, size.z) * 0.45 * s);
      return g;
    }).catch(() => g);
  };

  window.PHOTO = P;
})();
