/* Station IV — The Sliding Domes.
   A WebGL ceiling of eight-pointed stars, lit by the hand like a lamp. Its 27 domes ride on rails:
   tap one and it rolls aside to open the mosque to the sky. Moving left and right reshapes the stars. */
(function () {
  'use strict';
  const N = 27;

  const VERT = `attribute vec2 a; void main(){ gl_Position = vec4(a,0.,1.); }`;
  const FRAG = `
precision highp float;
uniform vec2 uRes; uniform float uTime; uniform vec2 uMouse; uniform float uK; uniform float uCell;
uniform vec3 uDomes[${N}]; uniform float uR; uniform vec4 uRip; uniform float uLamp;

float seg(vec2 p, vec2 a, vec2 b){ vec2 pa=p-a, ba=b-a; float h=clamp(dot(pa,ba)/dot(ba,ba),0.,1.); return length(pa-ba*h); }
float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
float noise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x), mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x), f.y); }
float fbm(vec2 p){ float s=0., a=.5; for(int i=0;i<5;i++){ s+=a*noise(p); p*=2.03; a*=.5; } return s; }

// The star-and-cross: two interlaced squares make an eight-pointed star in every cell,
// and the space between four stars becomes a cross.
vec3 pattern(vec2 px, out float line){
  vec2 p = (px - uRes*0.5)/uCell;
  vec2 cell = floor(p+0.5); vec2 q = p - cell;
  vec2 f = abs(q); if (f.y > f.x) f = f.yx;
  float c = uK*0.70710678;
  vec2 I = vec2(c, 0.5-c);
  float dStar = min(seg(f, vec2(0.5,0.), I), seg(f, I, vec2(c,c)));
  float dInner = min(seg(f, I, vec2(0.25,0.25)), seg(f, vec2(c,0.), I));
  bool inB = f.x+f.y < 0.5; bool inA = f.x < c;
  vec3 lapis = vec3(0.05,0.10,0.24), teal = vec3(0.09,0.33,0.31), plaster = vec3(0.80,0.74,0.62);
  vec3 col = plaster;
  if (inA && inB) col = lapis; else if (inA || inB) col = teal;
  float r = length(q);
  float an = atan(q.y,q.x);
  // small rosette in the heart of each star
  float pet = 0.07 + 0.025*cos(an*8.);
  col = mix(col, vec3(0.86,0.66,0.32), smoothstep(pet+0.01, pet, r));
  // fine arabesque hatching inside the cross
  if (!inA && !inB) col *= 0.92 + 0.08*sin((f.x-f.y)*90.);
  float px1 = 1.0/uCell;
  float lw = 0.032;
  float band = smoothstep(lw+px1, lw-px1*0.5, dStar);
  float outline = smoothstep(lw+0.022, lw+0.008, dStar);
  float inner = smoothstep(0.011+px1, 0.011, dInner);
  col = mix(col, vec3(0.06,0.045,0.03), (outline-band)*0.85);
  vec3 gold = vec3(0.93,0.75,0.40);
  col = mix(col, gold, band);
  col = mix(col, gold*0.9, inner*0.55);
  line = max(band, inner*0.5);
  return col;
}

void main(){
  vec2 px = gl_FragCoord.xy;
  float lm; vec3 col = pattern(px, lm);
  float dm = length(px-uMouse);
  float lamp = exp(-dm/(uRes.y*0.33))*uLamp;
  vec3 lit = col*(0.26 + 0.95*lamp) + vec3(1.0,0.78,0.42)*lm*lamp*0.55;
  float day = 0.;
  vec3 outc = lit; bool hit = false;
  for (int i=0;i<${N};i++){
    vec3 D = uDomes[i]; vec2 dc = D.xy; float d = length(px-dc);
    day += D.z*exp(-d/(uR*2.4));
    if (!hit && d < uR*1.18){
      hit = true;
      if (d > uR){
        float k = (d-uR)/(uR*0.18);
        float a = atan(px.y-dc.y, px.x-dc.x);
        float bead = 0.5+0.5*cos(a*56.);
        vec3 ring = mix(vec3(0.97,0.80,0.45), vec3(0.40,0.27,0.10), k);
        ring *= 0.8 + 0.25*bead*step(0.35,k)*step(k,0.75);
        outc = ring*(0.42+0.8*lamp) + vec3(0.7,0.82,1.0)*D.z*0.4;
      } else {
        vec2 diskC = dc + vec2(D.z*uR*2.2, 0.);
        float dd = length(px-diskC);
        if (dd < uR){
          vec2 v = (px-diskC)/uR; float rr = length(v); float an = atan(v.y,v.x);
          vec3 dcol = mix(vec3(0.96,0.92,0.82), vec3(0.50,0.40,0.26), rr*rr);
          float a8 = mod(an+0.19635, 0.785398)-0.392699; vec2 sp = rr*vec2(cos(a8), abs(sin(a8)));
          float st = abs(sp.x*0.924 + sp.y*0.383 - 0.34);
          dcol = mix(dcol, vec3(0.13,0.42,0.34), smoothstep(0.035,0.0,st)*0.85);
          float ribs = smoothstep(0.94,1.0,cos(an*16.))*smoothstep(0.45,0.5,rr);
          dcol = mix(dcol, vec3(0.86,0.66,0.30), ribs*0.75);
          float rim = smoothstep(0.86,0.9,rr)*smoothstep(0.98,0.93,rr);
          dcol = mix(dcol, vec3(0.86,0.66,0.30), rim);
          dcol *= 0.5 + 0.7*lamp;
          // the opening's edge throws a shadow across the moving dome
          dcol *= 0.75 + 0.25*smoothstep(uR, uR*0.85, d);
          outc = dcol;
        } else {
          float h = clamp((px.y-dc.y)/uR*0.5+0.5, 0., 1.);
          vec3 sky = mix(vec3(0.33,0.60,0.90), vec3(0.66,0.84,0.99), 1.-h);
          vec2 sp = px/uRes.y;
          float cl = fbm(sp*2.6 + vec2(uTime*0.025, uTime*0.004));
          sky = mix(sky, vec3(1.0,0.99,0.96), smoothstep(0.52,0.86,cl)*0.85);
          sky += vec3(1.0,0.9,0.7)*0.25*exp(-length(px-vec2(uRes.x*0.8,uRes.y*1.1))/(uRes.y*0.5));
          sky *= 0.62 + 0.38*smoothstep(uR, uR*0.72, d);
          outc = sky;
        }
      }
    }
  }
  if (!hit) outc = lit + vec3(1.0,0.96,0.88)*col*min(day,1.6)*0.85;
  if (uRip.w > 0.){
    float rd = length(px-uRip.xy);
    float wave = exp(-pow((rd-uRip.z)/(uCell*0.5), 2.));
    outc += vec3(1.0,0.82,0.5)*wave*(lm*1.4+0.08)*uRip.w;
  }
  vec2 uv = px/uRes;
  outc *= mix(0.5, 1.0, smoothstep(1.25, 0.25, length((uv-0.5)*vec2(1.2,1.0))*1.4));
  gl_FragColor = vec4(outc, 1.);
}`;

  function compile(gl, type, src) {
    const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.error(gl.getShaderInfoLog(s)); return null; }
    return s;
  }

  ENGINE.register({
    key: 'domes',
    arabic: 'المسجد النبوي',
    title: 'The Sky Beneath the Domes',
    era: 'The Prophet’s Mosque · founded 1 AH',
    hint: 'Tap a dome to open it · move to reshape the stars',
    sound: { reverb: 0.7 },
    story: `<p>The first Prophet’s Mosque was a courtyard of mud brick, its roof palm fronds resting on palm-trunk pillars. Over fourteen centuries it has been rebuilt and enlarged many times.</p>
            <p>Today its roof holds 27 domes that roll aside on rails, opening the prayer hall to the sky in the cool of the day and closing again against the sun. The star-and-cross pattern overhead is one of the oldest in Islamic art: two squares turned against each other.</p>`,

    enter(env) {
      const scale = env.dpr > 1 ? 0.6 : 0.9;
      const { canvas, gl } = env.webgl({ scale });
      this.canvas = canvas; this.gl = gl;
      this.domes = []; this.k = 0.5; this.kTarget = 0.5; this.lastStep = 0; this.rip = null; this.opened = 0;
      if (!gl) { this.fallback(env); return; }
      const prog = gl.createProgram();
      gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
      gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(prog); gl.useProgram(prog);
      this.prog = prog;
      const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(prog, 'a'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      this.u = {};
      ['uRes', 'uTime', 'uMouse', 'uK', 'uCell', 'uDomes', 'uR', 'uRip', 'uLamp'].forEach(n => { this.u[n] = gl.getUniformLocation(prog, n); });
      this.layout(env);
      this.lamp = 0;

      const b = env.bus;
      this.room = SND.noise(b, { color: 'brown', type: 'lowpass', freq: 220, gain: 0.12 });
      this.hall = SND.noise(b, { color: 'pink', type: 'bandpass', freq: 700, q: 3, gain: 0.012 });
      this.outside = SND.noise(b, { color: 'pink', type: 'highpass', freq: 1500, gain: 0.0 });
      this.hum = SND.drone(b, 98, { gain: 0.012, cutoff: 600 });
      this.hum2 = SND.drone(b, 147.1, { gain: 0.008, cutoff: 600, pan: 0.3 });
      this.birdClock = 2;
    },

    fallback(env) {
      const ctx = this.canvas.getContext('2d');
      if (!ctx) return;
      ctx.fillStyle = '#0d1324'; ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      env.complete();
    },

    resize(env) { if (this.gl) this.layout(env); },

    layout(env) {
      const c = this.canvas, s = c.width / env.w;
      this.s = s;
      const land = env.w >= env.h;
      const cols = land ? 9 : 3, rows = land ? 3 : 9;
      const mx = env.w * (land ? 0.08 : 0.1), myTop = env.h * 0.16, myBot = env.h * (land ? 0.26 : 0.2);
      const W = env.w - mx * 2, H = env.h - myTop - myBot;
      const sx = W / cols, sy = H / rows;
      this.R = Math.min(sx, sy) * 0.34;
      const old = this.domes;
      this.domes = [];
      for (let r = 0; r < rows; r++) for (let q = 0; q < cols; q++) {
        const i = r * cols + q;
        this.domes.push({ x: mx + sx * (q + 0.5), y: myTop + sy * (r + 0.5), open: old[i] ? old[i].open : 0, target: old[i] ? old[i].target : 0 });
      }
      this.cell = Math.max(46, Math.min(env.w, env.h) / 7.5);
    },

    hitDome(p) {
      let best = -1, bd = 1e9;
      this.domes.forEach((d, i) => { const dd = Math.hypot(p.x - d.x, p.y - d.y); if (dd < bd) { bd = dd; best = i; } });
      return bd < this.R * 1.25 ? best : -1;
    },

    toggle(env, i) {
      const d = this.domes[i];
      d.target = d.target ? 0 : 1;
      const pan = (d.x / env.w) * 2 - 1;
      SND.swell(env.bus, { color: 'brown', type: 'lowpass', f0: 90, f1: 260, dur: 3.2, gain: 0.35, pan, peak: 0.3 });
      SND.swell(env.bus, { color: 'white', type: 'bandpass', f0: 2500, f1: 4200, dur: 3, gain: 0.012, q: 6, pan });
      SND.thump(env.bus, { f: 55, gain: 0.25, delay: 3, pan });
      SND.bell(env.bus, d.target ? U.pick([392, 440, 523.25, 587.33]) : 293.66, { gain: 0.03, dur: 5, delay: 3.0, pan });
      if (d.target) { this.opened++; setTimeout(() => SND.coo(env.bus, { gain: 0.03, pan }), 3600); }
    },

    down(env, p) {
      if (!this.gl) return;
      const i = this.hitDome(p);
      if (i >= 0) this.toggle(env, i);
      else {
        this.rip = { x: p.x, y: p.y, t: 0 };
        SND.bell(env.bus, 196 * (1 + this.k), { gain: 0.035, dur: 5 });
      }
    },
    key(env, e) {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        const closed = this.domes.map((d, i) => [d, i]).filter(([d]) => !d.target);
        closed.forEach(([, i], n) => setTimeout(() => this.toggle(env, i), n * 140));
      }
    },

    update(env, dt) {
      if (!this.gl) return;
      const p = env.pointer;
      this.kTarget = U.lerp(0.4, 0.66, U.clamp(p.x / env.w));
      this.k = U.damp(this.k, this.kTarget, 3, dt);
      const step = Math.round(this.k * 40);
      if (step !== this.lastStep) {
        this.lastStep = step;
        const scale = [261.6, 293.7, 329.6, 392, 440];
        SND.bell(env.bus, scale[step % 5] * (step % 10 >= 5 ? 2 : 1), { gain: 0.006, dur: 2, glass: true, pan: (p.x / env.w) * 2 - 1 });
      }
      this.lamp = U.damp(this.lamp, 1, 1.2, dt);
      let open = 0;
      for (const d of this.domes) {
        d.open += Math.sign(d.target - d.open) * Math.min(Math.abs(d.target - d.open), dt / 3.0);
        open += d.open;
      }
      if (this.rip) { this.rip.t += dt; if (this.rip.t > 3) this.rip = null; }
      const ratio = open / this.domes.length;
      this.outside.set('gain', 0.03 * Math.min(1, open / 6), 0.5);
      this.room.set('gain', 0.12 - ratio * 0.06, 0.5);
      this.birdClock -= dt * Math.min(1, open / 3);
      if (this.birdClock < 0) { this.birdClock = 1.5 + Math.random() * 3; SND.chirp(env.bus, { gain: 0.012 }); }
      if (this.domes.filter(d => d.target).length >= 5) env.complete();
    },

    render(env) {
      const gl = this.gl; if (!gl) return;
      const c = this.canvas, s = c.width / env.w, H = c.height;
      gl.viewport(0, 0, c.width, c.height);
      gl.uniform2f(this.u.uRes, c.width, c.height);
      gl.uniform1f(this.u.uTime, env.time);
      gl.uniform2f(this.u.uMouse, env.pointer.x * s, H - env.pointer.y * s);
      gl.uniform1f(this.u.uK, this.k);
      gl.uniform1f(this.u.uCell, this.cell * s);
      gl.uniform1f(this.u.uR, this.R * s);
      gl.uniform1f(this.u.uLamp, this.lamp);
      const arr = new Float32Array(N * 3);
      this.domes.forEach((d, i) => { arr[i * 3] = d.x * s; arr[i * 3 + 1] = H - d.y * s; arr[i * 3 + 2] = U.ease(d.open); });
      gl.uniform3fv(this.u.uDomes, arr);
      if (this.rip) gl.uniform4f(this.u.uRip, this.rip.x * s, H - this.rip.y * s, this.rip.t * this.cell * s * 5, Math.max(0, 1 - this.rip.t / 3));
      else gl.uniform4f(this.u.uRip, 0, 0, 0, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
  });
})();
