/* Madinah — live sound engine.
   Every sound in the journey is synthesised in the browser with the Web Audio API:
   no recordings, no sample files. Wind is sculpted noise, birds are swept sines,
   water drops are pitch-chirps, the stone of Quba is a filtered impulse. */
(function () {
  'use strict';
  const A = { ctx: null, master: null, muted: false, ready: false };
  const rnd = (a, b) => a + Math.random() * (b - a);

  A.init = function () {
    if (A.ctx) { if (A.ctx.state === 'suspended') A.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    A.ctx = ctx;

    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16; comp.knee.value = 12; comp.ratio.value = 3.5;
    comp.attack.value = 0.01; comp.release.value = 0.3;

    A.master = ctx.createGain();
    A.master.gain.value = 0;
    A.master.connect(comp);
    comp.connect(ctx.destination);
    A.master.gain.setTargetAtTime(0.9, ctx.currentTime, 0.8);

    A.reverb = ctx.createConvolver();
    A.reverb.buffer = A.impulse(5.5, 2.6);
    A.revIn = ctx.createGain();
    A.revIn.connect(A.reverb);
    A.reverb.connect(A.master);

    A.buf = {
      white: A.makeNoise('white'),
      pink: A.makeNoise('pink'),
      brown: A.makeNoise('brown'),
    };
    A.ready = true;
  };

  A.now = () => (A.ctx ? A.ctx.currentTime : 0);

  A.setMuted = function (m) {
    A.muted = m;
    if (!A.ctx) return;
    A.master.gain.cancelScheduledValues(A.now());
    A.master.gain.setTargetAtTime(m ? 0 : 0.9, A.now(), 0.25);
  };

  A.impulse = function (dur, decay) {
    const ctx = A.ctx, len = Math.floor(ctx.sampleRate * dur);
    const b = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = b.getChannelData(c);
      for (let i = 0; i < len; i++) {
        const t = i / len;
        // early reflections thin out, late tail is smooth and dark
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, decay) * (i < 400 ? i / 400 : 1);
      }
    }
    return b;
  };

  A.makeNoise = function (type) {
    const ctx = A.ctx, len = ctx.sampleRate * 6;
    const b = ctx.createBuffer(1, len, ctx.sampleRate), d = b.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0, last = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      if (type === 'white') d[i] = w * 0.5;
      else if (type === 'pink') {
        b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759;
        b2 = 0.969 * b2 + w * 0.153852; b3 = 0.8665 * b3 + w * 0.3104856;
        b4 = 0.55 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.016898;
        d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11; b6 = w * 0.115926;
      } else { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; }
    }
    // crossfade the loop seam
    const f = 2048;
    for (let i = 0; i < f; i++) { const k = i / f; d[len - f + i] = d[len - f + i] * (1 - k) + d[i] * k; }
    return b;
  };

  /* A bus is a stage's private mixer channel: everything a stage plays goes through it,
     so the stage can be faded out and torn down in one move. */
  A.bus = function (opts) {
    opts = opts || {};
    if (!A.ready) return A.nullBus();
    const ctx = A.ctx;
    const input = ctx.createGain();
    const out = ctx.createGain();
    const send = ctx.createGain();
    out.gain.value = 0;
    send.gain.value = opts.reverb == null ? 0.35 : opts.reverb;
    input.connect(out); out.connect(A.master); out.connect(send); send.connect(A.revIn);
    const bus = {
      input, out, send, live: [],
      fadeIn(t = 2.5, v = 1) { out.gain.cancelScheduledValues(A.now()); out.gain.setTargetAtTime(v, A.now(), t / 3); },
      fadeOut(t = 1.5) { out.gain.cancelScheduledValues(A.now()); out.gain.setTargetAtTime(0, A.now(), t / 4); },
      keep(node) { bus.live.push(node); return node; },
      dispose(after = 2000) {
        bus.fadeOut(1.2);
        setTimeout(() => {
          bus.live.forEach(n => { try { n.stop && n.stop(); } catch (e) {} try { n.disconnect(); } catch (e) {} });
          bus.live = [];
          try { out.disconnect(); send.disconnect(); input.disconnect(); } catch (e) {}
        }, after);
      },
    };
    return bus;
  };
  A.nullBus = () => ({ input: null, live: [], fadeIn() {}, fadeOut() {}, keep(n) { return n; }, dispose() {} });

  function panNode(dest, pan) {
    if (pan == null || !A.ctx.createStereoPanner) return dest;
    const p = A.ctx.createStereoPanner(); p.pan.value = Math.max(-1, Math.min(1, pan)); p.connect(dest); return p;
  }

  /* Sustained filtered noise: wind, surf, crowd, fountains. */
  A.noise = function (bus, o) {
    if (!bus.input) return A.nullNoise();
    o = o || {};
    const ctx = A.ctx;
    const src = ctx.createBufferSource();
    src.buffer = A.buf[o.color || 'pink']; src.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = o.type || 'lowpass';
    filter.frequency.value = o.freq || 800;
    filter.Q.value = o.q == null ? 0.7 : o.q;
    const g = ctx.createGain(); g.gain.value = o.gain == null ? 0.2 : o.gain;
    src.connect(filter); filter.connect(g); g.connect(panNode(bus.input, o.pan));
    src.start(0, rnd(0, 5));
    bus.keep(src);
    return {
      src, filter, gain: g,
      set(param, v, tc = 0.2) { const p = param === 'gain' ? g.gain : param === 'q' ? filter.Q : filter.frequency; p.setTargetAtTime(v, A.now(), tc); },
    };
  };
  A.nullNoise = () => ({ set() {}, filter: null, gain: null });

  /* Slow modulation of any AudioParam. */
  A.lfo = function (bus, param, rate, depth) {
    if (!bus.input || !param) return null;
    const o = A.ctx.createOscillator(), g = A.ctx.createGain();
    o.frequency.value = rate; g.gain.value = depth; o.connect(g); g.connect(param); o.start();
    bus.keep(o); return { osc: o, gain: g };
  };

  /* A continuous tone (for drones that respond to the hand). */
  A.drone = function (bus, freq, o) {
    if (!bus.input) return { set() {}, setGain() {} };
    o = o || {};
    const ctx = A.ctx;
    const osc = ctx.createOscillator(); osc.type = o.type || 'sine'; osc.frequency.value = freq;
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = o.cutoff || 1800;
    const g = ctx.createGain(); g.gain.value = 0;
    osc.connect(f); f.connect(g); g.connect(panNode(bus.input, o.pan));
    osc.start(); bus.keep(osc);
    g.gain.setTargetAtTime(o.gain == null ? 0.05 : o.gain, A.now(), 1.2);
    return {
      osc, gain: g, filter: f,
      set(fr, tc = 0.1) { osc.frequency.setTargetAtTime(fr, A.now(), tc); },
      setGain(v, tc = 0.3) { g.gain.setTargetAtTime(v, A.now(), tc); },
    };
  };

  function env(g, t, a, peak, d) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
  }

  /* Struck metal / glass: inharmonic partials with long decay. */
  A.bell = function (bus, f, o) {
    if (!bus.input) return;
    o = o || {};
    const ctx = A.ctx, t = A.now() + (o.delay || 0), dest = panNode(bus.input, o.pan);
    const parts = o.glass ? [1, 2.32, 4.25, 6.63] : [1, 2.76, 5.4, 8.93, 0.5];
    const amps = o.glass ? [1, 0.4, 0.18, 0.08] : [1, 0.5, 0.25, 0.12, 0.3];
    const dur = o.dur || 3.5, peak = o.gain == null ? 0.08 : o.gain;
    parts.forEach((p, i) => {
      const osc = ctx.createOscillator(); osc.type = 'sine'; osc.frequency.value = f * p * (1 + rnd(-0.002, 0.002));
      const g = ctx.createGain(); env(g, t, 0.004, peak * amps[i], dur / (1 + i * 0.6));
      osc.connect(g); g.connect(dest); osc.start(t); osc.stop(t + dur + 0.1);
    });
  };

  /* Stone on stone. */
  A.knock = function (bus, o) {
    if (!bus.input) return;
    o = o || {};
    const ctx = A.ctx, t = A.now(), dest = panNode(bus.input, o.pan), f = o.f || 140, peak = o.gain || 0.5;
    const osc = ctx.createOscillator(); osc.type = 'sine';
    osc.frequency.setValueAtTime(f * 2.2, t); osc.frequency.exponentialRampToValueAtTime(f, t + 0.04);
    const g = ctx.createGain(); env(g, t, 0.002, peak, 0.18);
    osc.connect(g); g.connect(dest); osc.start(t); osc.stop(t + 0.3);
    const n = ctx.createBufferSource(); n.buffer = A.buf.white;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = o.click || 2400; bp.Q.value = 1.2;
    const ng = ctx.createGain(); env(ng, t, 0.001, peak * 0.6, 0.06);
    n.connect(bp); bp.connect(ng); ng.connect(dest); n.start(t, rnd(0, 5)); n.stop(t + 0.12);
  };

  /* A soft footstep in sand. */
  A.step = function (bus, o) {
    if (!bus.input) return;
    o = o || {};
    const ctx = A.ctx, t = A.now();
    const n = ctx.createBufferSource(); n.buffer = A.buf.pink;
    const lp = ctx.createBiquadFilter(); lp.type = 'bandpass'; lp.frequency.value = o.f || rnd(500, 900); lp.Q.value = 0.8;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(o.gain || 0.25, t + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
    n.connect(lp); lp.connect(g); g.connect(panNode(bus.input, o.pan)); n.start(t, rnd(0, 5)); n.stop(t + 0.3);
  };

  /* Songbird: a burst of rapid sine sweeps. */
  A.chirp = function (bus, o) {
    if (!bus.input) return;
    o = o || {};
    const ctx = A.ctx, dest = panNode(bus.input, o.pan == null ? rnd(-0.8, 0.8) : o.pan);
    const base = o.f || rnd(2600, 4200), n = o.n || Math.floor(rnd(2, 6));
    let t = A.now() + (o.delay || 0);
    for (let i = 0; i < n; i++) {
      const osc = ctx.createOscillator(); osc.type = 'sine';
      const f0 = base * rnd(0.85, 1.15), len = rnd(0.04, 0.11);
      osc.frequency.setValueAtTime(f0, t);
      osc.frequency.exponentialRampToValueAtTime(f0 * rnd(1.2, 1.7), t + len * 0.6);
      osc.frequency.exponentialRampToValueAtTime(f0 * rnd(0.8, 1.1), t + len);
      const g = ctx.createGain(); env(g, t, 0.008, o.gain || 0.035, len);
      osc.connect(g); g.connect(dest); osc.start(t); osc.stop(t + len + 0.05);
      t += len + rnd(0.02, 0.09);
    }
  };

  /* Laughing dove: a soft, breathy five-note coo. */
  A.coo = function (bus, o) {
    if (!bus.input) return;
    o = o || {};
    const ctx = A.ctx, dest = panNode(bus.input, o.pan == null ? rnd(-0.7, 0.7) : o.pan);
    const base = o.f || rnd(430, 520);
    const pattern = [[1, 0.18], [1.12, 0.32], [1.06, 0.16], [0.96, 0.16], [0.9, 0.3]];
    let t = A.now() + (o.delay || 0);
    pattern.forEach(([m, len]) => {
      const osc = ctx.createOscillator(); osc.type = 'sine';
      osc.frequency.setValueAtTime(base * m * 0.94, t);
      osc.frequency.linearRampToValueAtTime(base * m, t + len * 0.4);
      osc.frequency.linearRampToValueAtTime(base * m * 0.97, t + len);
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(o.gain || 0.05, t + len * 0.35);
      g.gain.exponentialRampToValueAtTime(0.0001, t + len);
      osc.connect(lp); lp.connect(g); g.connect(dest); osc.start(t); osc.stop(t + len + 0.05);
      t += len + 0.06;
    });
  };

  /* Water drop: the "plip" of a falling bead hitting a surface. */
  A.drop = function (bus, o) {
    if (!bus.input) return;
    o = o || {};
    const ctx = A.ctx, t = A.now() + (o.delay || 0), dest = panNode(bus.input, o.pan);
    const f = o.f || rnd(500, 1100);
    const osc = ctx.createOscillator(); osc.type = 'sine';
    osc.frequency.setValueAtTime(f, t);
    osc.frequency.exponentialRampToValueAtTime(f * 2.6, t + 0.07);
    const g = ctx.createGain(); env(g, t, 0.003, o.gain || 0.12, o.dur || 0.16);
    osc.connect(g); g.connect(dest); osc.start(t); osc.stop(t + 0.3);
  };

  /* Cricket: a fast-amplitude-modulated high sine. */
  A.cricket = function (bus, o) {
    if (!bus.input) return;
    o = o || {};
    const ctx = A.ctx, t = A.now(), dest = panNode(bus.input, o.pan == null ? rnd(-1, 1) : o.pan);
    const osc = ctx.createOscillator(); osc.frequency.value = o.f || rnd(4200, 5200);
    const am = ctx.createGain(); am.gain.value = 0;
    const mod = ctx.createOscillator(); mod.frequency.value = rnd(28, 45);
    const modG = ctx.createGain(); modG.gain.value = 0.5;
    mod.connect(modG); modG.connect(am.gain);
    const g = ctx.createGain(); const len = rnd(0.15, 0.4);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(o.gain || 0.012, t + 0.02);
    g.gain.setValueAtTime(o.gain || 0.012, t + len); g.gain.exponentialRampToValueAtTime(0.0001, t + len + 0.05);
    osc.connect(am); am.connect(g); g.connect(dest);
    osc.start(t); mod.start(t); osc.stop(t + len + 0.1); mod.stop(t + len + 0.1);
  };

  /* A breath of filtered noise that swells and recedes (gusts, whooshes, cloth). */
  A.swell = function (bus, o) {
    if (!bus.input) return;
    o = o || {};
    const ctx = A.ctx, t = A.now() + (o.delay || 0), dest = panNode(bus.input, o.pan);
    const n = ctx.createBufferSource(); n.buffer = A.buf[o.color || 'pink'];
    const f = ctx.createBiquadFilter(); f.type = o.type || 'bandpass'; f.Q.value = o.q || 0.9;
    const f0 = o.f0 || 300, f1 = o.f1 || 1400, dur = o.dur || 1.5;
    f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + dur * 0.5); f.frequency.exponentialRampToValueAtTime(f0, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(o.gain || 0.15, t + dur * (o.peak || 0.45)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    n.connect(f); f.connect(g); g.connect(dest); n.start(t, rnd(0, 4)); n.stop(t + dur + 0.1);
  };

  /* A warm low pulse (heartbeat of the earth, a gate closing, a dome settling). */
  A.thump = function (bus, o) {
    if (!bus.input) return;
    o = o || {};
    const ctx = A.ctx, t = A.now() + (o.delay || 0);
    const osc = ctx.createOscillator(); osc.type = 'sine';
    osc.frequency.setValueAtTime(o.f ? o.f * 1.8 : 110, t); osc.frequency.exponentialRampToValueAtTime(o.f || 48, t + 0.12);
    const g = ctx.createGain(); env(g, t, 0.005, o.gain || 0.4, o.dur || 0.7);
    osc.connect(g); g.connect(panNode(bus.input, o.pan)); osc.start(t); osc.stop(t + (o.dur || 0.7) + 0.1);
  };

  /* A soft, slowly blooming sine pad tone (used sparingly as light, not melody). */
  A.glow = function (bus, f, o) {
    if (!bus.input) return;
    o = o || {};
    const ctx = A.ctx, t = A.now() + (o.delay || 0), dest = panNode(bus.input, o.pan);
    const dur = o.dur || 4;
    [1, 2.0013, 3.0021].forEach((m, i) => {
      const osc = ctx.createOscillator(); osc.type = 'sine'; osc.frequency.value = f * m;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime((o.gain || 0.04) / (1 + i * 1.8), t + dur * 0.35);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(g); g.connect(dest); osc.start(t); osc.stop(t + dur + 0.1);
    });
  };

  window.SND = A;
})();
