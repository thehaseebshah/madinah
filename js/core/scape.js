/* SCAPE — large, detailed landscapes for the walkable stations.
   Everything is procedural and instanced, so a scene can hold thousands of rocks, shrubs,
   grasses, trees, palms and houses in a handful of draw calls.

   SCAPE.terrain   a big terrain with sand/rock blending by slope and height; returns an exact ground()
   SCAPE.horizon   rings of distant mountain silhouettes in aerial perspective, for a sense of distance
   SCAPE.scatter   instanced rocks, boulders, pebbles, shrubs, grass, thorn bushes, acacias, palms, houses
   SCAPE.birds     a flock wheeling in the sky
   SCAPE.smoke / SCAPE.motes   rising hearth smoke; fireflies, embers or dust motes
   SCAPE.post      a cinematic finish: bloom, sun rays, colour grade, vignette and grain
   SCAPE.triplanar / SCAPE.sway   material patches (world-space texturing, wind)
*/
(function () {
  'use strict';
  if (!window.THREE) { window.SCAPE = null; return; }
  const T = THREE;
  const S = {};
  S.time = { value: 0 };

  /* ---------------- noise ---------------- */
  S.fbm = (x, z, oct, lac) => {
    let s = 0, a = 0.5, f = 1, n = oct || 5;
    for (let i = 0; i < n; i++) { s += a * U.noise2(x * f + i * 31.7, z * f - i * 17.1); f *= lac || 2.03; a *= 0.5; }
    return s;
  };
  S.ridge = (x, z, oct) => {
    let s = 0, a = 0.5, f = 1, n = oct || 5;
    for (let i = 0; i < n; i++) { const v = 1 - Math.abs(U.noise2(x * f + i * 13.3, z * f + i * 7.9)); s += a * v * v; f *= 2.07; a *= 0.5; }
    return s;
  };

  /* ---------------- textures ---------------- */
  function tex(w, size, draw, rep, alpha) {
    const t = w.tex(size, draw, rep);
    if (alpha) t.premultiplyAlpha = false;
    else {
      // the texture's mean colour in linear light, so shaders can use it as a detail map around 1.0
      try {
        const d = t.image.getContext('2d').getImageData(0, 0, size, size).data; let r = 0, g = 0, b = 0, n = 0;
        for (let i = 0; i < d.length; i += 64) { r += Math.pow(d[i] / 255, 2.2); g += Math.pow(d[i + 1] / 255, 2.2); b += Math.pow(d[i + 2] / 255, 2.2); n++; }
        t._avg = new T.Vector3(r / n, g / n, b / n);
      } catch (_) { t._avg = new T.Vector3(0.4, 0.4, 0.4); }
    }
    return t;
  }
  function speckle(g, s, n, cols, rmax) {
    for (let i = 0; i < n; i++) {
      g.fillStyle = cols[(Math.random() * cols.length) | 0];
      const r = Math.random() * (rmax || 1.5) + 0.3;
      g.fillRect(Math.random() * s, Math.random() * s, r, r);
    }
  }
  S.tex = {
    // weathered granite of the Makkah mountains: grey-brown, speckled, cracked
    granite(w, rep) {
      return w._granite || (w._granite = tex(w, 512, (g, s) => {
        g.fillStyle = '#8a7a6c'; g.fillRect(0, 0, s, s);
        for (let i = 0; i < 70; i++) {
          const x = Math.random() * s, y = Math.random() * s, r = 20 + Math.random() * 110;
          const gr = g.createRadialGradient(x, y, 0, x, y, r);
          const c = U.pick(['110,92,80', '150,132,116', '96,84,78', '168,146,120']);
          gr.addColorStop(0, `rgba(${c},0.45)`); gr.addColorStop(1, `rgba(${c},0)`);
          g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
        }
        speckle(g, s, 16000, ['#4a3e38', '#b8a898', '#6a5a50', '#d8cbb8', '#2e2622'], 1.4);
        g.strokeStyle = 'rgba(40,30,26,0.55)';
        for (let i = 0; i < 26; i++) {
          g.lineWidth = 0.6 + Math.random() * 1.6; g.beginPath();
          let x = Math.random() * s, y = Math.random() * s; g.moveTo(x, y);
          for (let k = 0; k < 8; k++) { x += (Math.random() - 0.5) * 60; y += Math.random() * 40; g.lineTo(x, y); }
          g.stroke();
        }
      }, rep || [1, 1]));
    },
    // the black basalt of the lava fields (harrah) around Madinah
    lava(w, rep) {
      return w._lava || (w._lava = tex(w, 512, (g, s) => {
        g.fillStyle = '#3a3330'; g.fillRect(0, 0, s, s);
        for (let i = 0; i < 60; i++) {
          const x = Math.random() * s, y = Math.random() * s, r = 16 + Math.random() * 80;
          const gr = g.createRadialGradient(x, y, 0, x, y, r);
          const c = U.pick(['70,58,52', '40,34,32', '96,74,60']);
          gr.addColorStop(0, `rgba(${c},0.5)`); gr.addColorStop(1, `rgba(${c},0)`);
          g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
        }
        speckle(g, s, 9000, ['#1c1816', '#5a4c44', '#2a2422', '#76604e'], 2.2);
        for (let i = 0; i < 900; i++) { g.fillStyle = 'rgba(10,8,8,0.7)'; g.beginPath(); g.arc(Math.random() * s, Math.random() * s, Math.random() * 2.4, 0, 6.283); g.fill(); }
      }, rep || [1, 1]));
    },
    // fine wind-rippled sand
    dune(w, rep) {
      return w._dune || (w._dune = tex(w, 512, (g, s) => {
        g.fillStyle = '#cfae80'; g.fillRect(0, 0, s, s);
        for (let y = 0; y < s; y += 3) {
          g.strokeStyle = `rgba(${Math.random() < 0.5 ? '150,116,78' : '236,212,170'},${0.12 + Math.random() * 0.12})`;
          g.lineWidth = 1 + Math.random(); g.beginPath();
          for (let x = 0; x <= s; x += 16) g.lineTo(x, y + Math.sin(x * 0.045 + y * 0.31) * 3 + Math.sin(x * 0.011) * 4);
          g.stroke();
        }
        speckle(g, s, 9000, ['#a88458', '#e4caa0', '#8c6c48', '#f3e2c0'], 1.3);
        speckle(g, s, 400, ['#5a4636', '#6e5a48'], 2.6);
      }, rep || [1, 1]));
    },
    // gravel and grit of the wadi floors
    gravel(w, rep) {
      return w._gravel || (w._gravel = tex(w, 512, (g, s) => {
        g.fillStyle = '#9c8a74'; g.fillRect(0, 0, s, s);
        for (let i = 0; i < 2600; i++) {
          const x = Math.random() * s, y = Math.random() * s, r = 1 + Math.random() * 5;
          const c = U.pick(['#7a6a5a', '#b8a68e', '#5e5048', '#cdbca2', '#8e7a66', '#4a403a']);
          g.fillStyle = c; g.beginPath(); g.ellipse(x, y, r, r * (0.6 + Math.random() * 0.4), Math.random() * 3, 0, 6.283); g.fill();
          g.fillStyle = 'rgba(30,24,20,0.35)'; g.beginPath(); g.ellipse(x + r * 0.3, y + r * 0.4, r, r * 0.5, 0, 0, 6.283); g.fill();
        }
      }, rep || [1, 1]));
    },
    // sun-baked mud plaster over brick: soft, uneven, with faint courses showing through
    mud(w, rep) {
      return w._mudT || (w._mudT = tex(w, 512, (g, s) => {
        g.fillStyle = '#b89a78'; g.fillRect(0, 0, s, s);
        for (let i = 0; i < 90; i++) {
          const x = Math.random() * s, y = Math.random() * s, r = 20 + Math.random() * 90;
          const gr = g.createRadialGradient(x, y, 0, x, y, r);
          const c = U.pick(['150,120,92', '206,184,150', '170,140,108', '124,100,80']);
          gr.addColorStop(0, `rgba(${c},0.35)`); gr.addColorStop(1, `rgba(${c},0)`);
          g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
        }
        g.strokeStyle = 'rgba(90,70,52,0.10)'; g.lineWidth = 2;
        for (let y = 0; y < s; y += 32) { g.beginPath(); g.moveTo(0, y + Math.random() * 3); g.lineTo(s, y + Math.random() * 3); g.stroke(); }
        speckle(g, s, 7000, ['#8e7458', '#d4bc98', '#a08262', '#6e5844'], 1.4);
        g.strokeStyle = 'rgba(70,52,40,0.4)';
        for (let i = 0; i < 14; i++) { g.lineWidth = 0.6; g.beginPath(); let x = Math.random() * s, y = Math.random() * s; g.moveTo(x, y); for (let k = 0; k < 5; k++) { x += (Math.random() - 0.5) * 30; y += Math.random() * 24; g.lineTo(x, y); } g.stroke(); }
      }, rep || [1, 1]));
    },
    // alpha cards for vegetation
    shrub(w) {
      return w._shrubT || (w._shrubT = tex(w, 256, (g, s) => {
        g.clearRect(0, 0, s, s);
        const twig = (x, y, a, len, wd, d) => {
          const x2 = x + Math.cos(a) * len, y2 = y + Math.sin(a) * len;
          g.strokeStyle = '#5a4630'; g.lineWidth = wd; g.beginPath(); g.moveTo(x, y); g.lineTo(x2, y2); g.stroke();
          if (d > 0) { twig(x2, y2, a - 0.4 - Math.random() * 0.3, len * 0.72, wd * 0.7, d - 1); twig(x2, y2, a + 0.4 + Math.random() * 0.3, len * 0.72, wd * 0.7, d - 1); }
          else for (let i = 0; i < 6; i++) {
            g.fillStyle = U.pick(['#7c8a52', '#93a062', '#6a7444', '#a8a870', '#8a8a58']);
            g.beginPath(); g.ellipse(x2 + (Math.random() - 0.5) * 12, y2 + (Math.random() - 0.5) * 12, 3 + Math.random() * 3, 1.6 + Math.random() * 1.6, Math.random() * 3, 0, 6.283); g.fill();
          }
        };
        for (let i = 0; i < 7; i++) twig(s / 2 + (Math.random() - 0.5) * 20, s, -Math.PI / 2 + (Math.random() - 0.5) * 1.4, s * 0.2, 3, 4);
      }, null, true));
    },
    grass(w) {
      return w._grassT || (w._grassT = tex(w, 256, (g, s) => {
        g.clearRect(0, 0, s, s);
        for (let i = 0; i < 70; i++) {
          const x = s * 0.5 + (Math.random() - 0.5) * s * 0.8, h = s * (0.35 + Math.random() * 0.6), bend = (Math.random() - 0.5) * s * 0.35;
          g.strokeStyle = U.pick(['#c8b078', '#b09a62', '#d8c48c', '#9a8656', '#e0cf9a', '#a89048']);
          g.lineWidth = 1.2 + Math.random() * 1.8; g.beginPath(); g.moveTo(x, s);
          g.quadraticCurveTo(x + bend * 0.3, s - h * 0.6, x + bend, s - h); g.stroke();
        }
      }, null, true));
    },
    thorn(w) {
      return w._thornT || (w._thornT = tex(w, 256, (g, s) => {
        g.clearRect(0, 0, s, s);
        const br = (x, y, a, len, wd, d) => {
          const x2 = x + Math.cos(a) * len, y2 = y + Math.sin(a) * len;
          g.strokeStyle = U.pick(['#6a5240', '#7c6450', '#584232']); g.lineWidth = wd; g.beginPath(); g.moveTo(x, y); g.lineTo(x2, y2); g.stroke();
          if (d > 0) for (let k = 0; k < 3; k++) br(x2, y2, a + (Math.random() - 0.5) * 1.6, len * 0.7, wd * 0.65, d - 1);
        };
        for (let i = 0; i < 6; i++) br(s / 2, s, -Math.PI / 2 + (Math.random() - 0.5) * 1.8, s * 0.22, 2.6, 4);
      }, null, true));
    },
    leaves(w) {
      return w._leafT || (w._leafT = tex(w, 256, (g, s) => {
        g.clearRect(0, 0, s, s);
        for (let i = 0; i < 900; i++) {
          const a = Math.random() * 6.283, r = Math.sqrt(Math.random()) * s * 0.47;
          const x = s / 2 + Math.cos(a) * r, y = s / 2 + Math.sin(a) * r;
          g.fillStyle = U.pick(['#5a6a34', '#6e7c40', '#4a5a2c', '#7e8a4c', '#3e4a26']);
          g.beginPath(); g.ellipse(x, y, 2 + Math.random() * 2.5, 1.2 + Math.random(), Math.random() * 3, 0, 6.283); g.fill();
        }
      }, null, true));
    },
    soft(w) {
      return w._softT || (w._softT = tex(w, 64, (g, s) => {
        const gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
        gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.4, 'rgba(255,255,255,0.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = gr; g.fillRect(0, 0, s, s);
      }, null, true));
    },
  };

  /* ---------------- material patches ---------------- */
  // World-space (triplanar) texturing: no stretched UVs on scaled rocks, houses and cliffs.
  S.triplanar = (mat, scale) => {
    const k = scale || 0.25;
    const prev = mat.onBeforeCompile;
    mat.onBeforeCompile = (sh, r) => {
      prev && prev(sh, r);
      sh.uniforms.uTriScale = { value: k };
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vTriP; varying vec3 vTriN;')
        .replace('#include <worldpos_vertex>', `#include <worldpos_vertex>
          vec4 triP = vec4(transformed, 1.0);
          #ifdef USE_INSTANCING
            triP = instanceMatrix * triP;
          #endif
          triP = modelMatrix * triP; vTriP = triP.xyz;
          vec3 triN = objectNormal;
          #ifdef USE_INSTANCING
            triN = mat3(instanceMatrix) * triN;
          #endif
          vTriN = normalize(mat3(modelMatrix) * triN);`);
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\nuniform float uTriScale; varying vec3 vTriP; varying vec3 vTriN;')
        .replace('#include <map_fragment>', `
          #ifdef USE_MAP
            vec3 bw = pow(abs(normalize(vTriN)), vec3(4.0)); bw /= (bw.x + bw.y + bw.z);
            vec4 tx = texture2D(map, vTriP.zy * uTriScale), ty = texture2D(map, vTriP.xz * uTriScale), tz = texture2D(map, vTriP.xy * uTriScale);
            vec4 texelColor = mapTexelToLinear(tx * bw.x + ty * bw.y + tz * bw.z);
            diffuseColor *= texelColor;
          #endif`);
    };
    // the bump map would still read the mesh UVs; drop it to avoid a mismatch
    mat.bumpMap = null;
    mat.customProgramCacheKey = () => 'tri' + k;
    mat.needsUpdate = true;
    return mat;
  };
  // Wind: the higher a vertex, the more it sways. Works on instanced meshes.
  S.sway = (mat, amp) => {
    const prev = mat.onBeforeCompile;
    mat.onBeforeCompile = (sh, r) => {
      prev && prev(sh, r);
      sh.uniforms.uTime = S.time; sh.uniforms.uSway = { value: amp == null ? 0.08 : amp };
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nuniform float uTime; uniform float uSway;')
        .replace('#include <begin_vertex>', `#include <begin_vertex>
          { vec3 ip = vec3(0.0);
            #ifdef USE_INSTANCING
              ip = instanceMatrix[3].xyz;
            #endif
            float hh = max(position.y, 0.0);
            float ph = ip.x * 0.37 + ip.z * 0.23;
            float gust = 0.6 + 0.4 * sin(uTime * 0.35 + ip.x * 0.02);
            transformed.x += sin(uTime * 1.6 + ph) * hh * uSway * gust;
            transformed.z += cos(uTime * 1.25 + ph * 1.3) * hh * uSway * 0.6 * gust; }`);
    };
    mat.customProgramCacheKey = () => 'sway' + amp + (mat._tri || '');
    return mat;
  };

  /* ---------------- geometry helpers ---------------- */
  // Merge several (possibly transformed) geometries into one non-indexed BufferGeometry.
  S.merge = list => {
    let n = 0;
    const gs = list.map(g => { const q = g.index ? g.toNonIndexed() : g; if (!q.attributes.normal) q.computeVertexNormals(); n += q.attributes.position.count; return q; });
    const P = new Float32Array(n * 3), N = new Float32Array(n * 3), UV = new Float32Array(n * 2);
    let o = 0;
    gs.forEach(g => {
      const c = g.attributes.position.count;
      P.set(g.attributes.position.array, o * 3); N.set(g.attributes.normal.array, o * 3);
      if (g.attributes.uv) UV.set(g.attributes.uv.array, o * 2);
      o += c;
    });
    const geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.BufferAttribute(P, 3)); geo.setAttribute('normal', new T.BufferAttribute(N, 3)); geo.setAttribute('uv', new T.BufferAttribute(UV, 2));
    geo.computeBoundingSphere();
    return geo;
  };
  // A lumpy, cracked rock: a displaced icosahedron, flattened at the base.
  function rockGeo(seed, detail, squash) {
    const g = new T.IcosahedronGeometry(1, detail || 2);
    const p = g.attributes.position, r = U.seeded(seed);
    const ox = r() * 100, oz = r() * 100, oy = r() * 100;
    const v = new T.Vector3();
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i);
      const n = S.fbm(v.x * 1.3 + ox + v.y * 0.7, v.z * 1.3 + oz + v.y * 0.9 + oy, 4);
      // a few flat facets, like split granite
      const facet = Math.max(0, Math.abs(v.x * 0.8 + v.z * 0.6) - 0.62) * 0.9;
      v.multiplyScalar(1 + n * 0.55 - facet);
      v.y *= squash || 0.7;
      if (v.y < -0.25) v.y = -0.25 + (v.y + 0.25) * 0.2;
      p.setXYZ(i, v.x, v.y, v.z);
    }
    g.computeVertexNormals();
    return g;
  }
  // Crossed vertical cards for shrubs and grass, base at y=0, height 1.
  function cardsGeo(n, w, tilt) {
    const list = [];
    for (let i = 0; i < n; i++) {
      const g = new T.PlaneGeometry(w || 1, 1, 1, 2); g.translate(0, 0.5, 0);
      if (tilt) g.rotateX((i % 2 ? 1 : -1) * tilt);
      g.rotateY((i / n) * Math.PI);
      list.push(g);
    }
    return S.merge(list);
  }
  function acaciaGeos() {
    // trunk forking into three limbs
    const parts = [];
    const tr = new T.CylinderGeometry(0.16, 0.26, 2.2, 7); tr.translate(0, 1.1, 0); parts.push(tr);
    for (let i = 0; i < 3; i++) {
      const b = new T.CylinderGeometry(0.07, 0.13, 2.2, 6); b.translate(0, 1.1, 0);
      b.rotateZ(0.55 + i * 0.08); b.rotateY(i * 2.1); b.translate(0, 2.0, 0); parts.push(b);
    }
    const trunk = S.merge(parts);
    // the flat, layered canopy of the umbrella thorn
    const cps = [];
    [[0, 3.55, 0, 2.9], [0.9, 3.25, 0.4, 2.0], [-0.8, 3.35, -0.5, 2.2], [0.2, 3.8, -0.3, 2.0]].forEach(([x, y, z, r]) => {
      const d = new T.CircleGeometry(r, 14); d.rotateX(-Math.PI / 2); d.translate(x, y, z); cps.push(d);
      const d2 = new T.CircleGeometry(r * 0.92, 14); d2.rotateX(Math.PI / 2); d2.translate(x, y - 0.06, z); cps.push(d2);
    });
    for (let i = 0; i < 6; i++) { const c = new T.PlaneGeometry(3.6, 0.9); c.rotateY(i * 0.52); c.translate(0, 3.45, 0); cps.push(c); }
    return { trunk, canopy: S.merge(cps) };
  }
  function palmGeos(w) {
    const { fg } = KIT.palmParts(w);
    const h = 1; // unit trunk, scaled per instance
    const tg = new T.CylinderGeometry(0.017, 0.025, h, 8, 6, true); tg.translate(0, h / 2, 0);
    const list = [];
    for (let i = 0; i < 16; i++) {
      const f = fg.clone(); const m = new T.Matrix4();
      const e = new T.Euler(0, 0, 0.35 + (i % 3) * 0.22, 'YXZ'); e.y = (i / 16) * Math.PI * 2;
      m.makeRotationFromEuler(e); f.applyMatrix4(m); f.scale(0.1, 0.1, 0.1); f.translate(0, h, 0); list.push(f);
    }
    return { trunk: tg, crown: S.merge(list) };
  }

  /* ---------------- terrain ---------------- */
  /* o: { size, seg, cx, cz, height(x,z), rock: [slope0, slope1], rockHeight: [h0,h1],
          colors: { low, high, rock, wet }, tex: 'sand'|'dune'|'gravel', rockTex: 'granite'|'lava', rep, rockRep }
     Returns { mesh, ground(x,z), slope(x,z) }. ground() follows the triangles exactly. */
  S.terrain = (w, o) => {
    const size = o.size || 800, seg = Math.round((o.seg || 256) * (w.quality < 1 ? 0.75 : 1));
    const cx = o.cx || 0, cz = o.cz || 0, H = o.height;
    const n1 = seg + 1, step = size / seg, x0 = cx - size / 2, z0 = cz - size / 2;
    const hs = new Float32Array(n1 * n1);
    for (let j = 0; j < n1; j++) for (let i = 0; i < n1; i++) hs[j * n1 + i] = H(x0 + i * step, z0 + j * step);
    const geo = new T.PlaneGeometry(size, size, seg, seg); geo.rotateX(-Math.PI / 2); geo.translate(cx, 0, cz);
    const p = geo.attributes.position;
    for (let k = 0; k < p.count; k++) {
      const i = Math.round((p.getX(k) - x0) / step), j = Math.round((p.getZ(k) - z0) / step);
      p.setY(k, hs[j * n1 + i]);
    }
    geo.computeVertexNormals();
    const nrm = geo.attributes.normal;
    const C = Object.assign({ low: '#d9c09a', high: '#c8a87c', rock: '#8a7466', dark: '#5e4e44' }, o.colors || {});
    const lin = h => U.hex(h).map(v => Math.pow(v / 255, 2.2));
    const cl = lin(C.low), chi = lin(C.high), cr = lin(C.rock), cd = lin(C.dark);
    const col = new Float32Array(p.count * 3), rk = new Float32Array(p.count);
    const rs = o.rock || [0.72, 0.9], rh = o.rockHeight || [1e9, 1e9];
    for (let k = 0; k < p.count; k++) {
      const x = p.getX(k), y = p.getY(k), z = p.getZ(k), ny = nrm.getY(k);
      const macro = S.fbm(x * 0.012, z * 0.012, 3) * 0.5 + 0.5;
      let rock = Math.max(1 - U.smooth(rs[0], rs[1], ny), U.smooth(rh[0], rh[1], y));
      rock = U.clamp(rock + (S.fbm(x * 0.05, z * 0.05, 3)) * 0.35 * rock);
      let c = U.mix(cl, chi, U.clamp(macro * 1.3 - 0.15));
      c = U.mix(c, U.mix(cr, cd, U.clamp(S.fbm(x * 0.03 + 9, z * 0.03, 3) + 0.4)), rock);
      // a little ambient darkening in hollows
      const hollow = U.clamp((H(x, z) - (H(x + 3, z) + H(x - 3, z) + H(x, z + 3) + H(x, z - 3)) / 4) * 0.4, -0.25, 0.15);
      const sh = 1 + hollow;
      col[k * 3] = c[0] * sh; col[k * 3 + 1] = c[1] * sh; col[k * 3 + 2] = c[2] * sh;
      rk[k] = rock;
    }
    geo.setAttribute('color', new T.BufferAttribute(col, 3));
    geo.setAttribute('rockiness', new T.BufferAttribute(rk, 1));
    const base = (S.tex[o.tex || 'dune'] || S.tex.dune)(w), rockT = (S.tex[o.rockTex || 'granite'])(w);
    const mat = new T.MeshStandardMaterial({ map: base, vertexColors: true, roughness: 0.96, metalness: 0 });
    const rep = o.rep || 0.18, rrep = o.rockRep || 0.06;
    mat.onBeforeCompile = sh => {
      const ph = mat.userData.photo;
      sh.uniforms.tRock = { value: ph && ph.rd ? ph.rd : rockT }; sh.uniforms.uRep = { value: rep }; sh.uniforms.uRRep = { value: rrep };
      sh.uniforms.uSandAvg = { value: ph ? ph.gd._avg : base._avg }; sh.uniforms.uRockAvg = { value: ph && ph.rd ? ph.rd._avg : rockT._avg };
      sh.uniforms.uPhoto = { value: ph ? 1 : 0 };
      mat.userData.shader = sh;
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nattribute float rockiness; varying float vRock; varying vec3 vWP; varying vec3 vWN;')
        .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvRock = rockiness; vWP = (modelMatrix * vec4(transformed,1.0)).xyz; vWN = normalize(mat3(modelMatrix) * objectNormal);');
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\nuniform sampler2D tRock; uniform float uRep; uniform float uRRep; uniform vec3 uSandAvg; uniform vec3 uRockAvg; varying float vRock; varying vec3 vWP; varying vec3 vWN;')
        .replace('#include <map_fragment>', `
          vec2 suv = vWP.xz * uRep;
          // two scales of the ground texture, to hide tiling at a distance
          vec4 s1 = texture2D(map, suv), s2 = texture2D(map, suv * 0.137 + 0.31);
          vec3 sandC = mapTexelToLinear(s1).rgb / uSandAvg * mix(0.85, 1.15, clamp(dot(mapTexelToLinear(s2).rgb / uSandAvg, vec3(0.333)) * 1.4 - 0.9, 0., 1.));
          vec3 bw = pow(abs(normalize(vWN)), vec3(4.0)); bw /= (bw.x + bw.y + bw.z);
          vec3 rC = mapTexelToLinear(texture2D(tRock, vWP.zy * uRRep)).rgb * bw.x + mapTexelToLinear(texture2D(tRock, vWP.xz * uRRep)).rgb * bw.y + mapTexelToLinear(texture2D(tRock, vWP.xy * uRRep)).rgb * bw.z;
          rC /= uRockAvg;
          float rk = smoothstep(0.15, 0.85, vRock);
          diffuseColor.rgb *= mix(sandC, rC, rk);`);
    };
    mat.customProgramCacheKey = () => 'scape-terrain' + (o.tex || 'dune') + (o.rockTex || 'granite') + (mat.normalMap ? 'n' : '');
    // photo-scanned ground and rock, swapped in when they load (o.photo: { ground, rock, normal })
    if (o.photo && window.PHOTO && PHOTO.enabled) {
      const ph = o.photo;
      // world-space UVs so the normal and roughness maps follow the same tiling as the colour
      const uv = geo.attributes.uv; for (let k = 0; k < p.count; k++) uv.setXY(k, p.getX(k) * rep, p.getZ(k) * rep); uv.needsUpdate = true;
      const gd = PHOTO.texture(w, ph.ground, 'diff'), gn = PHOTO.texture(w, ph.ground, 'nor'), ga = PHOTO.texture(w, ph.ground, 'arm');
      const rd = ph.rock ? PHOTO.texture(w, ph.rock, 'diff') : null;
      Promise.all([gd.ready, gn.ready, ga.ready, rd ? rd.ready : null]).then(() => {
        mat.map = gd; mat.normalMap = gn; mat.normalScale.set(ph.normal || 1, -(ph.normal || 1)); mat.roughnessMap = ga;
        base._avg = gd._avg; if (rd) { mat.userData.rock = rd; }
        mat.needsUpdate = true;
        if (mat.userData.shader) { mat.userData.shader.uniforms.uSandAvg.value = gd._avg; if (rd) { mat.userData.shader.uniforms.tRock.value = rd; mat.userData.shader.uniforms.uRockAvg.value = rd._avg; } }
        mat.userData.photo = { gd, rd };
      }).catch(() => {});
    }
    const mesh = new T.Mesh(geo, mat);
    mesh.receiveShadow = true; mesh.castShadow = !!o.castShadow;
    w.scene.add(mesh);
    const ground = (x, z) => {
      const fx = (x - x0) / step, fz = (z - z0) / step;
      if (fx < 0 || fz < 0 || fx >= seg || fz >= seg) return H(x, z);
      const i = Math.floor(fx), j = Math.floor(fz), u = fx - i, v = fz - j;
      const ha = hs[j * n1 + i], hb = hs[(j + 1) * n1 + i], hc = hs[(j + 1) * n1 + i + 1], hd = hs[j * n1 + i + 1];
      return u + v <= 1 ? ha + (hd - ha) * u + (hb - ha) * v : hc + (hb - hc) * (1 - u) + (hd - hc) * (1 - v);
    };
    const slope = (x, z) => { const e = 1; const dx = ground(x + e, z) - ground(x - e, z), dz = ground(x, z + e) - ground(x, z - e); return Math.hypot(dx, dz) / (2 * e); };
    return { mesh, ground, slope, size, cx, cz };
  };

  /* ---------------- horizon ---------------- */
  /* Rings of far mountains, each paler and bluer than the one before it (aerial perspective).
     o: { cx, cz, layers: [{ r, h, base, color, rough, seed, flat }], haze } */
  S.horizon = (w, o) => {
    const g = new T.Group(); g.name = 'horizon';
    const haze = new T.Color(o.haze || '#d8c8b0').convertSRGBToLinear();
    const layers = o.layers || [{ r: 900, h: 90, color: '#8a7466' }, { r: 1400, h: 140, color: '#a08c80' }, { r: 2100, h: 180, color: '#b8aaa0' }];
    let far = 0;
    layers.forEach((L, li) => {
      const N = 360, r = L.r, base = L.base == null ? -20 : L.base, seed = (L.seed || 11) + li * 97;
      const P = new Float32Array((N + 1) * 2 * 3), C = new Float32Array((N + 1) * 2 * 3);
      const top = new T.Color(L.color).convertSRGBToLinear(), bot = top.clone().lerp(haze, L.fade == null ? 0.75 : L.fade);
      for (let i = 0; i <= N; i++) {
        const a = (i / N) * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a);
        const nx = ca * 2.2 + seed, nz = sa * 2.2 - seed;
        let hgt = S.ridge(nx * (L.rough || 1.6), nz * (L.rough || 1.6), 5);
        hgt = Math.pow(hgt, L.sharp || 1.6) * L.h * 1.6 + (L.flat || 0);
        if (L.gap) hgt *= L.gap(a);
        const x = (o.cx || 0) + ca * r, z = (o.cz || 0) + sa * r;
        P.set([x, base, z, x, base + hgt, z], i * 6);
        C.set([bot.r, bot.g, bot.b, top.r, top.g, top.b], i * 6);
      }
      const idx = [];
      for (let i = 0; i < N; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
      const geo = new T.BufferGeometry();
      geo.setAttribute('position', new T.BufferAttribute(P, 3)); geo.setAttribute('color', new T.BufferAttribute(C, 3)); geo.setIndex(idx);
      const m = new T.Mesh(geo, new T.MeshBasicMaterial({ vertexColors: true, fog: false, side: T.DoubleSide, toneMapped: L.toneMapped !== false }));
      m.renderOrder = -5 + li * 0; m.frustumCulled = false; m.userData.dynamic = true;
      g.add(m); far = Math.max(far, r);
    });
    w.scene.add(g);
    if (w.camera.far < far * 1.2) { w.camera.far = far * 1.2; w.camera.updateProjectionMatrix(); }
    return g;
  };

  /* ---------------- scatter ---------------- */
  /* o: { kind, n, area: [x0,z0,x1,z1] | { x, z, r }, ground, avoid(x,z), density(x,z) (0..1),
          scale: [a,b], color, vary, seed, slopeMax, sink, collide, castShadow, material, tex }
     Returns { meshes, list: [{x,y,z,s,ry}] }. Kinds: rock, boulder, pebble, shrub, grass, thorn, acacia, palm, house. */
  S.scatter = (w, o) => {
    const kind = o.kind || 'rock', r = U.seeded(o.seed || 7), q = o.exact ? 1 : (w.quality || 1);
    const n = Math.max(1, Math.round((o.n || 100) * (kind === 'grass' || kind === 'pebble' ? q : Math.max(q, 0.7))));
    const ground = o.ground || w.ground;
    const pick = () => {
      if (o.points) return null;
      if (Array.isArray(o.area)) return [U.lerp(o.area[0], o.area[2], r()), U.lerp(o.area[1], o.area[3], r())];
      const a = r() * Math.PI * 2, d = Math.sqrt(r()) * o.area.r; return [o.area.x + Math.cos(a) * d, o.area.z + Math.sin(a) * d];
    };
    const list = [];
    if (o.points) o.points.forEach(([x, z, s]) => list.push({ x, z, s: s || U.lerp(...(o.scale || [1, 1]), r()), ry: r() * 6.283 }));
    else {
      let tries = 0;
      while (list.length < n && tries++ < n * 30) {
        const [x, z] = pick();
        if (o.avoid && o.avoid(x, z)) continue;
        if (o.density && r() > o.density(x, z)) continue;
        if (o.slopeMax != null) { const e = 0.8; const s = Math.hypot(ground(x + e, z) - ground(x - e, z), ground(x, z + e) - ground(x, z - e)) / (2 * e); if (s > o.slopeMax) continue; }
        const sc = o.scale || [1, 1];
        list.push({ x, z, s: U.lerp(sc[0], sc[1], Math.pow(r(), o.bias || 1.6)), ry: r() * 6.283 });
      }
    }
    if (!list.length) return { meshes: [], list };
    const result = { meshes: [], list };
    if (kind === 'model') {
      // a scanned model, instanced once it has loaded; colliders are placed now
      if (o.collide) list.forEach(it => w.addCircle(it.x, it.z, it.s * (o.collide === true ? 0.45 : o.collide)));
      const fallback = () => { if (o.fallback) { const f = S.scatter(w, Object.assign({}, o, { kind: o.fallback, points: list.map(it => [it.x, it.z, it.s * (o.fallbackScale || 1)]), collide: false })); result.meshes.push(...f.meshes); } };
      if (!window.PHOTO || !PHOTO.enabled) { fallback(); return result; }
      result.ready = PHOTO.model(w, o.model, o.lod !== false).then(({ variants }) => {
        // spread the instances across the variants of a scanned set
        const V = o.variant != null ? [variants[o.variant % variants.length]] : variants;
        V.forEach((parts, v) => {
          const sub = list.filter((_, i) => i % V.length === v); if (!sub.length) return;
          const defs = parts.map(p => Object.assign({}, p, { sink: o.sink == null ? 0.04 : o.sink, tilt: o.tilt }));
          result.meshes.push(...instance(w, defs, sub, Object.assign({}, o, { collide: false }), r, kind, ground));
        });
        w._envK != null && result.meshes.forEach(m => { m.material.envMapIntensity = w._envK; });
        return result;
      }).catch(() => { fallback(); return result; });
      return result;
    }
    result.meshes = instance(w, buildKind(w, kind, o, r), list, o, r, kind, ground);
    return result;
  };
  function instance(w, defs, list, o, r, kind, ground) {
    const meshes = defs.map(d => {
      const im = new T.InstancedMesh(d.geo, d.mat, list.length);
      im.castShadow = o.castShadow != null ? o.castShadow : d.cast; im.receiveShadow = true;
      im.userData.dynamic = true;
      return im;
    });
    const m4 = new T.Matrix4(), qn = new T.Quaternion(), e = new T.Euler(), pos = new T.Vector3(), scl = new T.Vector3(), c = new T.Color();
    const base = new T.Color(o.color || defs[0].color || '#ffffff');
    if (kind === 'model' && o.vary == null) o = Object.assign({}, o, { vary: 0.12 });
    list.forEach((it, i) => {
      // on a slope, sink deeper so the downhill side does not float
      const e1 = 0.6 * it.s, sl = Math.min(1.2, Math.hypot(ground(it.x + e1, it.z) - ground(it.x - e1, it.z), ground(it.x, it.z + e1) - ground(it.x, it.z - e1)) / (2 * e1));
      it.y = ground(it.x, it.z) - ((o.sink == null ? defs[0].sink || 0 : o.sink) + sl * 0.35) * it.s;
      defs.forEach((d, k) => {
        const sx = it.s * (d.sx ? d.sx(r) : 1), sy = it.s * (d.sy ? d.sy(r) : 1), sz = it.s * (d.sz ? d.sz(r) : 1);
        if (k === 0) { it.sx = sx; it.sy = sy; it.sz = sz; }
        e.set(d.tilt ? (r() - 0.5) * d.tilt : 0, it.ry, d.tilt ? (r() - 0.5) * d.tilt : 0);
        qn.setFromEuler(e); pos.set(it.x, it.y, it.z);
        scl.set(k === 0 ? sx : it.sx, k === 0 ? sy : it.sy, k === 0 ? sz : it.sz);
        if (d.uniform) scl.setScalar(it.s);
        m4.compose(pos, qn, scl); meshes[k].setMatrixAt(i, m4);
        const v = o.vary == null ? 0.18 : o.vary;
        c.copy(d.color ? new T.Color(d.color) : base).multiplyScalar(1 - v / 2 + r() * v);
        if (d.hue) c.offsetHSL((r() - 0.5) * d.hue, 0, 0);
        meshes[k].setColorAt(i, c);
      });
      if (o.collide) {
        if (kind === 'house') w.addBox(it.x - it.sx / 2, it.z - it.sz / 2, it.x + it.sx / 2, it.z + it.sz / 2);
        else w.addCircle(it.x, it.z, it.s * (o.collide === true ? (defs[0].radius || 0.8) : o.collide));
      }
    });
    meshes.forEach(m => { m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; m.computeBoundingSphere && m.computeBoundingSphere(); m.frustumCulled = false; w.scene.add(m); });
    return meshes;
  }
  function buildKind(w, kind, o, r) {
    const rockTex = () => (S.tex[o.tex || 'granite'])(w);
    const rockMat = () => S.triplanar(new T.MeshStandardMaterial({ map: rockTex(), roughness: 0.92, metalness: 0 }), o.texScale || 0.35);
    switch (kind) {
      case 'rock': case 'boulder': case 'pebble': {
        // three shapes, picked per scatter by seed, so neighbours differ
        const geo = rockGeo((o.seed || 7) * 13 + 1, kind === 'pebble' ? 1 : 2, kind === 'boulder' ? 0.8 : 0.62);
        return [{ geo, mat: o.material || rockMat(), cast: kind !== 'pebble', color: o.color || (o.tex === 'lava' ? '#9a8c84' : '#c8b8a8'), sink: 0.12, radius: 0.85,
          sy: rr => 0.75 + rr() * 0.5, sx: rr => 0.85 + rr() * 0.4, tilt: 0.5 }];
      }
      case 'shrub': case 'grass': case 'thorn': {
        const t = kind === 'grass' ? S.tex.grass(w) : kind === 'thorn' ? S.tex.thorn(w) : S.tex.shrub(w);
        const mat = S.sway(new T.MeshStandardMaterial({ map: t, alphaTest: 0.4, side: T.DoubleSide, roughness: 0.9 }), kind === 'grass' ? 0.12 : 0.05);
        const geo = cardsGeo(kind === 'grass' ? 3 : 4, kind === 'grass' ? 1.1 : 1.3, kind === 'grass' ? 0.12 : 0.05);
        return [{ geo, mat, cast: kind !== 'grass', color: o.color || (kind === 'grass' ? '#e8dcc0' : '#ffffff'), sink: 0.02, hue: 0.03,
          sy: rr => 0.8 + rr() * 0.5 }];
      }
      case 'acacia': {
        const { trunk, canopy } = acaciaGeos();
        const bark = S.triplanar(new T.MeshStandardMaterial({ map: KIT.bark(w), roughness: 0.95 }), 1.2);
        const leaf = S.sway(new T.MeshStandardMaterial({ map: S.tex.leaves(w), alphaTest: 0.45, side: T.DoubleSide, roughness: 0.85 }), 0.015);
        return [{ geo: trunk, mat: bark, cast: true, color: '#8a7462', radius: 0.35 }, { geo: canopy, mat: leaf, cast: true, color: o.color || '#d0d8a8', hue: 0.04 }];
      }
      case 'palm': {
        const { trunk, crown } = palmGeos(w);
        const { trunkMat, frondMat } = KIT.palmParts(w);
        const tm = S.triplanar(trunkMat.clone(), 1.6), fm = S.sway(frondMat.clone(), 0.012);
        fm.vertexColors = false;
        // trunk height 8–14 m: uniform scale via s, crown sits at the top
        return [{ geo: trunk, mat: tm, cast: true, color: '#d8c8b0', uniform: true, radius: 0.04 }, { geo: crown, mat: fm, cast: true, color: o.color || '#ffffff', uniform: true, hue: 0.04 }];
      }
      case 'house': {
        const geo = new T.BoxGeometry(1, 1, 1); geo.translate(0, 0.5, 0);
        const mat = S.triplanar(new T.MeshStandardMaterial({ map: S.tex.mud(w), roughness: 0.95 }), 0.14);
        return [{ geo, mat, cast: true, color: o.color || '#f0e6d8', vary: 0.2,
          sx: rr => 0.8 + rr() * 0.6, sy: rr => 0.45 + rr() * 0.35, sz: rr => 0.8 + rr() * 0.6 }];
      }
    }
    throw new Error('SCAPE.scatter: unknown kind ' + kind);
  }

  /* ---------------- life ---------------- */
  // A flock wheeling in the sky. o: { n, x, z, y, r, color, size, speed }
  S.birds = (w, o) => {
    o = o || {};
    const n = o.n || 14, r = U.seeded(o.seed || 3);
    const wing = new T.BufferGeometry();
    wing.setAttribute('position', new T.BufferAttribute(new Float32Array([0, 0, -0.18, 0, 0, 0.22, 0.9, 0.05, 0.05]), 3));
    wing.computeVertexNormals();
    const mat = new T.MeshBasicMaterial({ color: o.color || 0x2a2420, side: T.DoubleSide, fog: true });
    const L = new T.InstancedMesh(wing, mat, n), R = new T.InstancedMesh(wing, mat, n);
    L.frustumCulled = R.frustumCulled = false; L.userData.dynamic = R.userData.dynamic = true;
    const birds = []; for (let i = 0; i < n; i++) birds.push({ a: r() * 6.283, rr: (o.r || 60) * (0.6 + r() * 0.6), y: (o.y || 50) + (r() - 0.5) * 14, sp: (o.speed || 0.12) * (0.8 + r() * 0.4), ph: r() * 6.283, s: (o.size || 0.7) * (0.8 + r() * 0.4) });
    const m4 = new T.Matrix4(), q = new T.Quaternion(), e = new T.Euler(0, 0, 0, 'YXZ'), p = new T.Vector3(), s = new T.Vector3(), mir = new T.Matrix4().makeScale(-1, 1, 1);
    w.scene.add(L); w.scene.add(R);
    w.tick(dt => {
      birds.forEach((b, i) => {
        b.a += b.sp * dt * (o.dir || 1);
        const x = (o.x || 0) + Math.cos(b.a) * b.rr, z = (o.z || 0) + Math.sin(b.a) * b.rr;
        const flap = Math.sin(w.time * 9 + b.ph) * 0.6 * (0.6 + 0.4 * Math.sin(w.time * 0.7 + b.ph));
        p.set(x, b.y + Math.sin(w.time * 0.5 + b.ph) * 3, z); s.setScalar(b.s);
        e.set(0, -b.a + (o.dir === -1 ? Math.PI : 0), flap); q.setFromEuler(e); m4.compose(p, q, s); L.setMatrixAt(i, m4);
        e.set(0, -b.a + (o.dir === -1 ? Math.PI : 0), -flap); q.setFromEuler(e); m4.compose(p, q, s); m4.multiply(mir); R.setMatrixAt(i, m4);
      });
      L.instanceMatrix.needsUpdate = R.instanceMatrix.needsUpdate = true;
    });
    return { L, R, birds };
  };

  // Soft particles with per-particle size and alpha (smoke, dust, embers, fireflies).
  const PV = `attribute float aSize; attribute float aAlpha; varying float vA; uniform float uScale;
    void main(){ vA = aAlpha; vec4 mv = modelViewMatrix * vec4(position,1.); gl_PointSize = aSize * uScale / -mv.z; gl_Position = projectionMatrix * mv; }`;
  const PF = `uniform sampler2D tMap; uniform vec3 uColor; varying float vA;
    void main(){ vec4 t = texture2D(tMap, gl_PointCoord); gl_FragColor = vec4(uColor, t.a * vA); if (gl_FragColor.a < 0.004) discard; }`;
  function points(w, n, color, additive) {
    const geo = new T.BufferGeometry();
    const P = new Float32Array(n * 3), Sz = new Float32Array(n), A = new Float32Array(n);
    geo.setAttribute('position', new T.BufferAttribute(P, 3)); geo.setAttribute('aSize', new T.BufferAttribute(Sz, 1)); geo.setAttribute('aAlpha', new T.BufferAttribute(A, 1));
    const mat = new T.ShaderMaterial({ vertexShader: PV, fragmentShader: PF, transparent: true, depthWrite: false,
      blending: additive ? T.AdditiveBlending : T.NormalBlending,
      uniforms: { tMap: { value: S.tex.soft(w) }, uColor: { value: new T.Color(color) }, uScale: { value: w.env.h * 0.9 } } });
    const pts = new T.Points(geo, mat); pts.frustumCulled = false; pts.userData.dynamic = true;
    w.scene.add(pts);
    return { pts, P, Sz, A, geo };
  }
  // Rising smoke from hearths. o: { sources: [[x,y,z],...], color, n (per source), height, size, wind: [x,z] }
  S.smoke = (w, o) => {
    const src = o.sources, per = o.n || 26, n = src.length * per, pp = points(w, n, o.color || '#c8beb0', false);
    const life = new Float32Array(n), r = U.seeded(o.seed || 5);
    for (let i = 0; i < n; i++) life[i] = r();
    const H = o.height || 14, wind = o.wind || [0.6, 0.2], sz = o.size || 3.2, op = o.opacity || 0.22;
    w.tick(dt => {
      for (let i = 0; i < n; i++) {
        life[i] += dt / (6 + (i % 5)); if (life[i] > 1) life[i] -= 1;
        const s = src[(i / per) | 0], t = life[i];
        const sway = Math.sin(w.time * 0.6 + i) * t * 1.2;
        pp.P[i * 3] = s[0] + wind[0] * t * H * 0.6 + sway; pp.P[i * 3 + 1] = s[1] + t * H; pp.P[i * 3 + 2] = s[2] + wind[1] * t * H * 0.6 + Math.cos(i) * t;
        pp.Sz[i] = sz * (0.4 + t * 1.8); pp.A[i] = op * Math.sin(Math.PI * Math.pow(t, 0.6)) * (1 - t * 0.4);
      }
      pp.geo.attributes.position.needsUpdate = pp.geo.attributes.aSize.needsUpdate = pp.geo.attributes.aAlpha.needsUpdate = true;
    });
    return pp;
  };
  // Drifting motes: fireflies, embers, pollen, dust in light. o: { n, area:[x0,y0,z0,x1,y1,z1], color, size, additive, blink }
  S.motes = (w, o) => {
    const n = Math.round((o.n || 80) * Math.max(0.6, w.quality || 1)), pp = points(w, n, o.color || '#ffd890', o.additive !== false);
    const A = o.area, r = U.seeded(o.seed || 9), ph = new Float32Array(n), base = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { base.set([U.lerp(A[0], A[3], r()), U.lerp(A[1], A[4], r()), U.lerp(A[2], A[5], r())], i * 3); ph[i] = r() * 100; pp.Sz[i] = (o.size || 0.6) * (0.6 + r() * 0.8); }
    w.tick(() => {
      const t = w.time;
      for (let i = 0; i < n; i++) {
        const k = ph[i];
        pp.P[i * 3] = base[i * 3] + Math.sin(t * 0.3 + k) * 1.6; pp.P[i * 3 + 1] = base[i * 3 + 1] + Math.sin(t * 0.21 + k * 1.3) * 0.8 + (o.rise ? ((t * o.rise + k) % 6) : 0);
        pp.P[i * 3 + 2] = base[i * 3 + 2] + Math.cos(t * 0.27 + k) * 1.6;
        pp.A[i] = (o.opacity || 0.8) * (o.blink ? Math.pow(Math.max(0, Math.sin(t * 1.3 + k)), 3) : 0.6 + 0.4 * Math.sin(t * 2 + k));
      }
      pp.geo.attributes.position.needsUpdate = pp.geo.attributes.aAlpha.needsUpdate = true;
    });
    pp.geo.attributes.aSize.needsUpdate = true;
    return pp;
  };

  /* ---------------- post-processing ---------------- */
  const QV = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }';
  const BRIGHT = `uniform sampler2D tIn; uniform float uThr; uniform float uKnee; varying vec2 vUv;
    void main(){ vec3 c = texture2D(tIn, vUv).rgb; float l = max(c.r, max(c.g, c.b)); gl_FragColor = vec4(c * smoothstep(uThr, uThr + uKnee, l), 1.); }`;
  const BLUR = `uniform sampler2D tIn; uniform vec2 uDir; varying vec2 vUv;
    void main(){ vec3 c = texture2D(tIn, vUv).rgb * 0.227027;
      c += texture2D(tIn, vUv + uDir * 1.3846).rgb * 0.316216; c += texture2D(tIn, vUv - uDir * 1.3846).rgb * 0.316216;
      c += texture2D(tIn, vUv + uDir * 3.2308).rgb * 0.070270; c += texture2D(tIn, vUv - uDir * 3.2308).rgb * 0.070270;
      gl_FragColor = vec4(c, 1.); }`;
  const RAYS = `uniform sampler2D tIn; uniform vec2 uSun; uniform float uVis; uniform float uDensity; uniform float uDecay; varying vec2 vUv;
    void main(){ vec2 d = (vUv - uSun) * uDensity / 36.; vec2 uv = vUv; float dec = 1.; vec3 acc = vec3(0.);
      for (int i = 0; i < 36; i++) { uv -= d; acc += texture2D(tIn, clamp(uv, 0.001, 0.999)).rgb * dec; dec *= uDecay; }
      gl_FragColor = vec4(acc / 36. * uVis, 1.); }`;
  const COMP = `uniform sampler2D tScene; uniform sampler2D tB1; uniform sampler2D tB2; uniform sampler2D tRays;
    uniform vec2 uRes; uniform float uBloom; uniform float uRays; uniform float uVig; uniform float uGrain; uniform float uTime;
    uniform float uSat; uniform float uContrast; uniform vec3 uLift; uniform vec3 uGain; uniform vec3 uTint; uniform float uFade; uniform vec3 uFadeCol;
    varying vec2 vUv;
    float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    void main(){
      vec3 c = texture2D(tScene, vUv).rgb;
      vec3 b = texture2D(tB1, vUv).rgb * 0.6 + texture2D(tB2, vUv).rgb * 0.8;
      c = 1. - (1. - c) * (1. - b * uBloom);   // screen blend keeps highlights from clipping
      c += texture2D(tRays, vUv).rgb * uRays;
      c = c * uGain + uLift * (1. - c);
      float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
      c = mix(vec3(l), c, uSat);
      c = (c - 0.5) * uContrast + 0.5;
      c *= uTint;
      vec2 q = vUv - 0.5; q.x *= uRes.x / uRes.y;
      c *= 1. - uVig * smoothstep(0.3, 1.05, length(q) * 1.15);
      c += (hash(vUv * uRes + fract(uTime) * 91.7) - 0.5) * uGrain;
      c = mix(c, uFadeCol, uFade);
      gl_FragColor = vec4(clamp(c, 0., 1.), 1.);
    }`;
  /* o: { bloom: 0.55, threshold: 0.72, rays: 0 | { strength, dir:[x,y,z] | pos:[x,y,z], density, decay },
          vignette: 0.35, grain: 0.035, sat: 1.05, contrast: 1.04, lift: [r,g,b], gain: [r,g,b], tint: '#hex' }
     Every value can be changed later through the returned object's uniforms (post.set({...})). */
  S.post = (w, o) => {
    o = o || {};
    const R = w.renderer;
    if (window.NOPOST || !R.capabilities.isWebGL2 && !R.extensions.get('OES_texture_half_float')) return null;
    const size = new T.Vector2();
    const mk = (msaa) => {
      const opts = { minFilter: T.LinearFilter, magFilter: T.LinearFilter, format: T.RGBAFormat, depthBuffer: !!msaa, stencilBuffer: false };
      const rt = msaa && R.capabilities.isWebGL2 && T.WebGLMultisampleRenderTarget ? new T.WebGLMultisampleRenderTarget(1, 1, opts) : new T.WebGLRenderTarget(1, 1, opts);
      if (msaa && rt.isWebGLMultisampleRenderTarget) rt.samples = w.quality < 1 ? 2 : 4;
      return rt;
    };
    const rtS = mk(true); rtS.texture.encoding = T.sRGBEncoding; // the scene, tone-mapped and encoded exactly as on screen
    const rtBr = mk(), rtA1 = mk(), rtA2 = mk(), rtB1 = mk(), rtB2 = mk(), rtR = mk();
    const cam = new T.OrthographicCamera(-1, 1, 1, -1, 0, 1), sc = new T.Scene();
    const quad = new T.Mesh(new T.PlaneGeometry(2, 2)); quad.frustumCulled = false; sc.add(quad);
    const sm = (frag, uni) => new T.ShaderMaterial({ vertexShader: QV, fragmentShader: frag, uniforms: uni, depthTest: false, depthWrite: false });
    const mBright = sm(BRIGHT, { tIn: { value: null }, uThr: { value: o.threshold == null ? 0.72 : o.threshold }, uKnee: { value: 0.25 } });
    const mBlur = sm(BLUR, { tIn: { value: null }, uDir: { value: new T.Vector2() } });
    const ro = o.rays ? (typeof o.rays === 'object' ? o.rays : { strength: o.rays }) : null;
    const mRays = sm(RAYS, { tIn: { value: null }, uSun: { value: new T.Vector2(0.5, 0.8) }, uVis: { value: 0 }, uDensity: { value: ro && ro.density || 0.85 }, uDecay: { value: ro && ro.decay || 0.965 } });
    const tint = new T.Color(o.tint || '#ffffff');
    const mComp = sm(COMP, {
      tScene: { value: rtS.texture }, tB1: { value: rtA2.texture }, tB2: { value: rtB2.texture }, tRays: { value: rtR.texture },
      uRes: { value: new T.Vector2(1, 1) }, uBloom: { value: o.bloom == null ? 0.55 : o.bloom }, uRays: { value: ro ? (ro.strength || 0.5) : 0 },
      uVig: { value: o.vignette == null ? 0.35 : o.vignette }, uGrain: { value: o.grain == null ? 0.03 : o.grain }, uTime: { value: 0 },
      uSat: { value: o.sat == null ? 1.05 : o.sat }, uContrast: { value: o.contrast == null ? 1.04 : o.contrast },
      uLift: { value: new T.Vector3(...(o.lift || [0, 0, 0])) }, uGain: { value: new T.Vector3(...(o.gain || [1, 1, 1])) }, uTint: { value: new T.Vector3(tint.r, tint.g, tint.b) },
      uFade: { value: 0 }, uFadeCol: { value: new T.Vector3(0, 0, 0) },
    });
    function resize() {
      R.getDrawingBufferSize(size);
      const W = Math.max(1, size.x), H = Math.max(1, size.y);
      rtS.setSize(W, H); rtBr.setSize(W >> 1, H >> 1); rtA1.setSize(W >> 2, H >> 2); rtA2.setSize(W >> 2, H >> 2); rtB1.setSize(W >> 3, H >> 3); rtB2.setSize(W >> 3, H >> 3); rtR.setSize(W >> 2, H >> 2);
      mComp.uniforms.uRes.value.set(W, H);
    }
    resize();
    const pass = (mat, target) => { quad.material = mat; R.setRenderTarget(target); R.render(sc, cam); };
    const blur = (src, mid, dst) => {
      mBlur.uniforms.tIn.value = src.texture; mBlur.uniforms.uDir.value.set(1 / mid.width, 0); pass(mBlur, mid);
      mBlur.uniforms.tIn.value = mid.texture; mBlur.uniforms.uDir.value.set(0, 1 / dst.height); pass(mBlur, dst);
    };
    const sunV = new T.Vector3(), fwdV = new T.Vector3();
    const post = {
      enabled: true, uniforms: mComp.uniforms, rays: ro, resize,
      set(v) {
        const U2 = mComp.uniforms;
        if (v.bloom != null) U2.uBloom.value = v.bloom; if (v.vignette != null) U2.uVig.value = v.vignette; if (v.grain != null) U2.uGrain.value = v.grain;
        if (v.sat != null) U2.uSat.value = v.sat; if (v.contrast != null) U2.uContrast.value = v.contrast;
        if (v.lift) U2.uLift.value.set(...v.lift); if (v.gain) U2.uGain.value.set(...v.gain);
        if (v.tint) { const c = new T.Color(v.tint); U2.uTint.value.set(c.r, c.g, c.b); }
        if (v.threshold != null) mBright.uniforms.uThr.value = v.threshold;
        if (v.rays != null) U2.uRays.value = v.rays;
        if (v.fade != null) U2.uFade.value = v.fade; if (v.fadeColor) { const c = new T.Color(v.fadeColor); U2.uFadeCol.value.set(c.r, c.g, c.b); }
      },
      render() {
        R.setRenderTarget(rtS); R.render(w.scene, w.camera);
        pass(mBright, rtBr);
        blur(rtBr, rtA1, rtA2);
        blur(rtA2, rtB1, rtB2);
        if (ro) {
          if (ro.pos) sunV.set(...ro.pos); else sunV.copy(w.camera.position).addScaledVector(new T.Vector3(...(ro.dir || [0, 1, 0])).normalize(), 500);
          const ahead = sunV.clone().sub(w.camera.position).normalize().dot(w.camera.getWorldDirection(fwdV));
          sunV.project(w.camera);
          const sx = sunV.x * 0.5 + 0.5, sy = sunV.y * 0.5 + 0.5;
          mRays.uniforms.uSun.value.set(sx, sy);
          mRays.uniforms.uVis.value = U.smooth(0.15, 0.6, ahead) * (1 - U.smooth(0.7, 1.3, Math.max(Math.abs(sx - 0.5), Math.abs(sy - 0.5)) * 2 - 0.4));
          mRays.uniforms.tIn.value = rtBr.texture; pass(mRays, rtR);
        }
        mComp.uniforms.uTime.value = w.time;
        pass(mComp, null);
      },
      dispose() { [rtS, rtBr, rtA1, rtA2, rtB1, rtB2, rtR].forEach(t => t.dispose()); [mBright, mBlur, mRays, mComp].forEach(m => m.dispose()); quad.geometry.dispose(); },
    };
    mBright.uniforms.tIn.value = rtS.texture;
    w._post = post;
    return post;
  };

  window.SCAPE = S;
})();
