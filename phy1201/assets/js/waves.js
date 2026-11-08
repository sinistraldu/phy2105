/* PHY1201 Unit 3: waves and acoustics simulations */
(function () {
  var D = Sim.D, f = Sim.fmt, C = Sim.col, PI = Math.PI, T = Sim.T3, clamp = Sim.clamp;

  /* ---------- 2D: travelling wave ---------- */
  Sim.make('sim-travel', {
    aspect: 0.45, animate: true,
    controls: [
      { k: 'A', label: 'Amplitude A', min: 0.1, max: 1, step: 0.05, v: 0.6, unit: 'cm' },
      { k: 'lam', label: 'Wavelength &lambda;', min: 0.5, max: 4, step: 0.1, v: 2, unit: 'm' },
      { k: 'f', label: 'Frequency f', min: 0.1, max: 1.5, step: 0.05, v: 0.5, unit: 'Hz' }
    ],
    buttons: [{ label: 'Transverse', group: 't', on: true, click: function (S) { S.st.lon = false; } }, { label: 'Longitudinal', group: 't', click: function (S) { S.st.lon = true; } }, { k: 'dir', label: 'Reverse direction', click: function (S, b) { S.st.rev = !S.st.rev; b.classList.toggle('on', S.st.rev); } }],
    reads: [{ k: 'v', label: 'Wave speed v = f&lambda; = &omega;/k', big: true }, { k: 'k', label: 'k = 2&pi;/&lambda;, &omega; = 2&pi;f' }, { k: 'pv', label: 'Max particle speed A&omega;' }],
    init: function (S) { S.st.lon = false; S.st.rev = false; },
    draw: function (S, c, W, H) {
      var K = C(), p = S.p, k = 2 * PI / p.lam, w = 2 * PI * p.f, t = S.t, sg = S.st.rev ? -1 : 1, X = 10, sx = W * 0.9 / X, x0 = W * 0.05, y0 = H * 0.5, Ay = p.A * H * 0.35;
      D.clear(c, W, H);
      D.line(c, x0, y0, x0 + X * sx, y0, K.faint, 1, [4, 4]);
      if (!S.st.lon) {
        var pts = []; for (var x = 0; x <= X; x += 0.02) pts.push([x0 + x * sx, y0 - Ay * Math.sin(k * x - sg * w * t)]);
        D.poly(c, pts, K.c1, 2.5, false);
        for (var x2 = 0.25; x2 < X; x2 += 0.5) { var yy = y0 - Ay * Math.sin(k * x2 - sg * w * t); D.circle(c, x0 + x2 * sx, yy, 3.5, K.c2); }
        var xp = 5, yp = y0 - Ay * Math.sin(k * xp - sg * w * t); D.circle(c, x0 + xp * sx, yp, 7, K.pos); D.line(c, x0 + xp * sx, y0 - Ay - 8, x0 + xp * sx, y0 + Ay + 8, K.pos, 1, [3, 3]);
        D.text(c, 'this particle only moves up and down', x0 + xp * sx + 10, y0 + Ay + 14, { size: 11, color: K.pos });
      } else {
        for (var x3 = 0; x3 < X; x3 += 0.12) { var dx = 0.35 * p.A * Math.sin(k * x3 - sg * w * t), px = x0 + (x3 + dx) * sx; D.line(c, px, y0 - H * 0.25, px, y0 + H * 0.25, Math.abs(x3 - 5) < 0.06 ? K.pos : K.c1, Math.abs(x3 - 5) < 0.06 ? 3 : 1.4); }
        D.text(c, 'red layer only moves back and forth; dense lines = compression, sparse = rarefaction', x0, H * 0.92, { size: 11, color: K.muted });
      }
      var crest = ((sg * w * t / k + p.lam / 4) % p.lam + p.lam) % p.lam;
      for (var cx = crest; cx < X; cx += p.lam) D.text(c, '▼', x0 + cx * sx, H * 0.06, { size: 12, align: 'center', color: K.c3 });
      D.arrow(c, W * 0.5 - sg * 40, H * 0.1, W * 0.5 + sg * 40, H * 0.1, K.c3, 2); D.text(c, 'wave travels', W * 0.5, H * 0.16, { size: 11, align: 'center', color: K.c3 });
      S.set('v', f(p.f * p.lam, 3) + ' m/s'); S.set('k', f(k, 3) + ' rad/m, ' + f(w, 3) + ' rad/s'); S.set('pv', f(p.A * w, 3) + ' cm/s (not the wave speed!)');
    }
  });

  /* ---------- 2D: power and intensity of a wave on a string ---------- */
  Sim.make('sim-power', {
    aspect: 0.45, animate: true,
    controls: [
      { k: 'Tn', label: 'String tension F', min: 10, max: 200, step: 5, v: 80, unit: 'N' },
      { k: 'mu', label: 'Linear density &mu;', min: 1, max: 50, step: 1, v: 10, unit: 'g/m' },
      { k: 'A', label: 'Amplitude A', min: 1, max: 10, step: 0.5, v: 5, unit: 'mm' },
      { k: 'f', label: 'Frequency f', min: 10, max: 200, step: 5, v: 60, unit: 'Hz' }
    ],
    reads: [{ k: 'v', label: 'v = &radic;(F/&mu;)' }, { k: 'P', label: 'Power P = &frac12;&mu;v&omega;&sup2;A&sup2;', big: true }, { k: 'u', label: 'Energy per metre &frac12;&mu;&omega;&sup2;A&sup2;' }],
    draw: function (S, c, W, H) {
      var K = C(), p = S.p, mu = p.mu * 1e-3, v = Math.sqrt(p.Tn / mu), w = 2 * PI * p.f, A = p.A * 1e-3, P = 0.5 * mu * v * w * w * A * A, lam = v / p.f;
      D.clear(c, W, H);
      var x0 = W * 0.04, x1 = W * 0.52, y0 = H * 0.45, pts = [], show = Math.min(4, 6 / lam);
      for (var i = 0; i <= 300; i++) { var s = i / 300; pts.push([x0 + (x1 - x0) * s, y0 - p.A / 10 * H * 0.3 * Math.sin(2 * PI * (s * 4 - S.t * 0.6))]); }
      D.poly(c, pts, K.c1, 1 + p.mu / 10, false);
      D.rect(c, x0 - 14, y0 - 30, 14, 60, K.ink, null, 2); D.text(c, 'driver', x0 - 7, y0 + 44, { size: 10.5, align: 'center', color: K.muted });
      for (var j = 0; j < 6; j++) { var xx = x0 + ((S.t * 0.15 + j / 6) % 1) * (x1 - x0); D.text(c, '→', xx, H * 0.85, { size: 10 + Math.min(18, P / 2), color: K.c2, align: 'center', weight: 700 }); }
      D.text(c, 'energy flows along the string at speed v', x0, H * 0.95, { size: 11, color: K.c2 });
      var box = { x: W * 0.58, y: H * 0.07, w: W * 0.4, h: H * 0.8 }, pp = [], Pm = 0.5 * mu * v * Math.pow(2 * PI * 200, 2) * A * A;
      for (var ff = 0; ff <= 200; ff += 2) pp.push([ff, 0.5 * mu * v * Math.pow(2 * PI * ff, 2) * A * A]);
      var g = D.graph(c, box, { x0: 0, x1: 200, y0: 0, y1: Pm * 1.1, xl: 'frequency (Hz) →', yl: 'power (W): P ∝ f²' }, [{ pts: pp, color: K.c2, w: 2.5 }]);
      D.circle(c, g.px(p.f), g.py(P), 6, K.pos);
      S.set('v', f(v, 3) + ' m/s (λ = ' + f(lam, 3) + ' m)'); S.set('P', f(P, 3) + ' W'); S.set('u', f(0.5 * mu * w * w * A * A, 3) + ' J/m');
    }
  });

  /* ---------- 2D: standing waves on a string ---------- */
  Sim.make('sim-standing', {
    aspect: 0.45, animate: true,
    controls: [
      { k: 'n', label: 'Harmonic number n', min: 1, max: 6, step: 1, v: 3 },
      { k: 'L', label: 'String length L', min: 0.5, max: 2, step: 0.05, v: 1, unit: 'm' },
      { k: 'v', label: 'Wave speed v', min: 50, max: 400, step: 10, v: 200, unit: 'm/s' }
    ],
    buttons: [{ k: 'comp', label: 'Show the two travelling waves', click: function (S, b) { S.st.comp = !S.st.comp; b.classList.toggle('on', S.st.comp); } }],
    reads: [{ k: 'lam', label: '&lambda;<sub>n</sub> = 2L/n' }, { k: 'f', label: 'f<sub>n</sub> = nv/2L', big: true }, { k: 'nodes', label: 'Nodes at x = m&lambda;/2' }],
    init: function (S) { S.st.comp = false; },
    draw: function (S, c, W, H) {
      var K = C(), p = S.p, k = p.n * PI / p.L, w = 2.2, t = S.t, x0 = W * 0.06, x1 = W * 0.94, y0 = H * 0.5, Ay = H * 0.18;
      D.clear(c, W, H);
      var env1 = [], env2 = [], s1 = [], s2 = [], sum = [];
      for (var i = 0; i <= 400; i++) { var x = p.L * i / 400, px = x0 + (x1 - x0) * i / 400, a = Math.sin(k * x); env1.push([px, y0 - 2 * Ay * a]); env2.push([px, y0 + 2 * Ay * a]); s1.push([px, y0 - Ay * Math.sin(k * x - w * t)]); s2.push([px, y0 + Ay * Math.sin(k * x + w * t)]); sum.push([px, y0 - 2 * Ay * a * Math.cos(w * t)]); }
      D.poly(c, env1, K.grid, 1.5, false); D.poly(c, env2, K.grid, 1.5, false);
      if (S.st.comp) { D.poly(c, s1, K.c2, 1.5, false); D.poly(c, s2, K.c3, 1.5, false); }
      D.poly(c, sum, K.c1, 3, false);
      D.rect(c, x0 - 8, y0 - 30, 8, 60, K.ink, null, 1); D.rect(c, x1, y0 - 30, 8, 60, K.ink, null, 1);
      for (var m = 0; m <= p.n; m++) { var nx = x0 + (x1 - x0) * m / p.n; D.circle(c, nx, y0, 5, K.pos); D.text(c, 'N', nx, y0 + 20, { size: 11, align: 'center', color: K.pos, weight: 700 }); }
      for (var m2 = 0; m2 < p.n; m2++) { var ax = x0 + (x1 - x0) * (m2 + 0.5) / p.n; D.text(c, 'A', ax, y0 + 2 * Ay + 18, { size: 11, align: 'center', color: K.c3, weight: 700 }); }
      if (S.st.comp) D.text(c, 'orange → and green ← add up to the standing wave (blue)', x0, H * 0.06, { size: 11, color: K.muted });
      var lam = 2 * p.L / p.n, nodes = []; for (var m3 = 0; m3 <= p.n; m3++) nodes.push(f(m3 * lam / 2, 3));
      S.set('lam', f(lam, 3) + ' m'); S.set('f', f(p.n * p.v / (2 * p.L), 3) + ' Hz (fundamental ' + f(p.v / (2 * p.L), 3) + ' Hz)'); S.set('nodes', nodes.join(', ') + ' m');
    }
  });

  /* ---------- 2D: phase vs group velocity ---------- */
  Sim.make('sim-groupvel', {
    aspect: 0.45, animate: true,
    controls: [
      { k: 'a', label: 'Dispersion &alpha; in &omega; = ck + &alpha;k&sup2;', min: -0.3, max: 0.3, step: 0.01, v: 0.15 },
      { k: 'dk', label: 'Spread &Delta;k between the two waves', min: 0.1, max: 1.5, step: 0.05, v: 0.5 }
    ],
    reads: [{ k: 'vp', label: 'Phase velocity &omega;/k' }, { k: 'vg', label: 'Group velocity d&omega;/dk', big: true }, { k: 'len', label: 'Group length &asymp; 2&pi;/&Delta;k' }],
    draw: function (S, c, W, H) {
      var K = C(), p = S.p, cc = 1, k0 = 6, w = function (k) { return cc * k + p.a * k * k; }, k1 = k0 - p.dk / 2, k2 = k0 + p.dk / 2, t = S.t * 0.8;
      var vp = w(k0) / k0, vg = cc + 2 * p.a * k0, Lx = 40;
      D.clear(c, W, H);
      var box = { x: W * 0.04, y: H * 0.08, w: W * 0.92, h: H * 0.78 }, pts = [], env = [], p1 = [], p2 = [];
      for (var x = 0; x <= Lx; x += 0.05) {
        var y1 = Math.cos(k1 * x - w(k1) * t), y2 = Math.cos(k2 * x - w(k2) * t); pts.push([x, (y1 + y2) / 2]); p1.push([x, 1.6 + y1 * 0.25]); p2.push([x, -1.6 + y2 * 0.25]);
        env.push([x, Math.abs(Math.cos((p.dk / 2) * x - ((w(k2) - w(k1)) / 2) * t))]);
      }
      var g = D.graph(c, box, { x0: 0, x1: Lx, y0: -2, y1: 2, xl: 'x →' }, [{ pts: p1, color: K.faint, w: 1 }, { pts: p2, color: K.faint, w: 1 }, { pts: env, color: K.c3, w: 2 }, { pts: env.map(function (q) { return [q[0], -q[1]]; }), color: K.c3, w: 2 }, { pts: pts, color: K.c1, w: 2.5 }]);
      var xp = ((vp * t) % (2 * PI / k0 * 6) + 2 * PI / k0 * 6) % (2 * PI / k0 * 6) + 2, xg = ((vg * t) % Lx + Lx) % Lx;
      D.circle(c, g.px(xp), g.py(1), 6, K.pos); D.text(c, 'crest (vₚ)', g.px(xp), g.py(1) - 14, { align: 'center', size: 11, color: K.pos, weight: 700 });
      D.line(c, g.px(xg), box.y, g.px(xg), box.y + box.h, K.c3, 1.5, [4, 3]); D.text(c, 'group (v_g)', g.px(xg) + 4, box.y + box.h - 12, { size: 11, color: K.c3, weight: 700 });
      D.text(c, 'grey: the two separate waves', box.x + 6, box.y + 12, { size: 11, color: K.muted });
      S.set('vp', f(vp, 3)); S.set('vg', f(vg, 3) + (Math.abs(vg - vp) < 0.01 ? ' (= vₚ, no dispersion)' : vg > vp ? ' (> vₚ)' : ' (< vₚ)')); S.set('len', f(2 * PI / p.dk, 3));
    }
  });

  /* ---------- 2D: beats ---------- */
  Sim.make('sim-beats', {
    aspect: 0.45, animate: true,
    controls: [
      { k: 'f1', label: 'Frequency f<sub>1</sub>', min: 200, max: 260, step: 0.5, v: 256, unit: 'Hz' },
      { k: 'f2', label: 'Frequency f<sub>2</sub>', min: 200, max: 260, step: 0.5, v: 252, unit: 'Hz' }
    ],
    reads: [{ k: 'fb', label: 'Beat frequency |f<sub>1</sub> &minus; f<sub>2</sub>|', big: true }, { k: 'fa', label: 'Heard pitch (f<sub>1</sub>+f<sub>2</sub>)/2' }, { k: 'Tb', label: 'Time between loud moments' }],
    draw: function (S, c, W, H) {
      var K = C(), p = S.p, tw = 1, t0 = S.t % 1, pts = [], e1 = [], e2 = [], a = [], b = [];
      for (var i = 0; i <= 3000; i++) { var t = tw * i / 3000, y1 = Math.cos(2 * PI * p.f1 * t), y2 = Math.cos(2 * PI * p.f2 * t), en = 2 * Math.abs(Math.cos(PI * (p.f1 - p.f2) * t)); pts.push([t, y1 + y2]); e1.push([t, en]); e2.push([t, -en]); }
      for (var j = 0; j <= 300; j++) { var t2 = 0.04 * j / 300; a.push([t2, Math.cos(2 * PI * p.f1 * t2)]); b.push([t2, Math.cos(2 * PI * p.f2 * t2)]); }
      D.clear(c, W, H);
      D.graph(c, { x: W * 0.04, y: H * 0.05, w: W * 0.28, h: H * 0.38 }, { x0: 0, x1: 0.04, y0: -1.3, y1: 1.3, yl: 'f₁ (first 40 ms)' }, [{ pts: a, color: K.c2, w: 1.5 }]);
      D.graph(c, { x: W * 0.04, y: H * 0.52, w: W * 0.28, h: H * 0.38 }, { x0: 0, x1: 0.04, y0: -1.3, y1: 1.3, yl: 'f₂' }, [{ pts: b, color: K.c3, w: 1.5 }]);
      var g = D.graph(c, { x: W * 0.36, y: H * 0.05, w: W * 0.61, h: H * 0.85 }, { x0: 0, x1: tw, y0: -2.3, y1: 2.3, xl: 'time over 1 s →', yl: 'sum: loudness rises and falls' }, [{ pts: pts, color: K.c1, w: 0.8 }, { pts: e1, color: K.pos, w: 2 }, { pts: e2, color: K.pos, w: 2 }]);
      D.line(c, g.px(t0), H * 0.05, g.px(t0), H * 0.9, K.faint, 1.5, [4, 3]);
      var fb = Math.abs(p.f1 - p.f2);
      S.set('fb', f(fb, 3) + ' beats per second'); S.set('fa', f((p.f1 + p.f2) / 2, 4) + ' Hz'); S.set('Tb', fb > 0 ? f(1 / fb, 3) + ' s' : 'no beats: in tune');
    }
  });

  /* ---------- 2D: Doppler effect ---------- */
  Sim.make('sim-doppler', {
    aspect: 0.5, animate: true,
    controls: [
      { k: 'vs', label: 'Source speed v<sub>s</sub> (towards the right)', min: 0, max: 500, step: 5, v: 100, unit: 'm/s' },
      { k: 'vo', label: 'Observer speed v<sub>o</sub> (towards the source)', min: 0, max: 100, step: 5, v: 0, unit: 'm/s' },
      { k: 'f', label: 'Source frequency f', min: 200, max: 1000, step: 10, v: 500, unit: 'Hz' }
    ],
    reads: [{ k: 'fa', label: 'Observer ahead (right) hears f&prime; = f(v + v<sub>o</sub>)/(v &minus; v<sub>s</sub>)', big: true }, { k: 'fb', label: 'Observer behind (left) hears' }, { k: 'M', label: 'Mach number v<sub>s</sub>/v' }],
    init: function (S) { S.st.fr = []; S.st.last = 0; S.st.x = 0; },
    onChange: function (S) { S.st.fr = []; S.st.x = 0; },
    draw: function (S, c, W, H, dt) {
      var K = C(), st = S.st, p = S.p, v = 343, sc = W / 1600, cy = H * 0.5;
      st.x += p.vs * dt * 0.5; if (st.x > 1400) { st.x = 0; st.fr = []; }
      st.last += dt; if (st.last > 0.18) { st.last = 0; st.fr.push({ x: st.x, t: 0 }); }
      st.fr.forEach(function (q) { q.t += dt * 0.5; }); st.fr = st.fr.filter(function (q) { return q.t * v < 1600; });
      D.clear(c, W, H);
      st.fr.forEach(function (q) { D.circle(c, W * 0.06 + q.x * sc, cy, q.t * v * sc, null, K.c1, 1.4); });
      var sx = W * 0.06 + st.x * sc;
      D.circle(c, sx, cy, 8, K.pos); D.text(c, 'source', sx, cy + 20, { size: 11, align: 'center', color: K.pos, weight: 700 });
      D.text(c, '👂', W * 0.96, cy, { size: 22, align: 'center' }); D.text(c, 'ahead', W * 0.96, cy + 24, { size: 11, align: 'center', color: K.muted });
      D.text(c, '👂', W * 0.02, cy, { size: 22, align: 'center' }); D.text(c, 'behind', W * 0.03, cy + 24, { size: 11, align: 'center', color: K.muted });
      var M = p.vs / v;
      if (M >= 1) D.text(c, 'faster than sound: the wavefronts pile up into a shock cone (sonic boom)', W * 0.5, H * 0.07, { size: 12, align: 'center', color: K.pos, weight: 700 });
      S.set('fa', M >= 1 ? 'shock wave (no ordinary sound before it arrives)' : f(p.f * (v + p.vo) / (v - p.vs), 4) + ' Hz (higher)'); S.set('fb', f(p.f * (v - p.vo) / (v + p.vs), 4) + ' Hz (lower)'); S.set('M', f(M, 3) + ' (v = 343 m/s)');
    }
  });

  /* ---------- 2D: intensity and decibels ---------- */
  var refs = [[0, 'threshold of hearing'], [20, 'rustling leaves'], [40, 'quiet library'], [60, 'conversation'], [80, 'busy traffic'], [100, 'pile driver at 10 m'], [120, 'threshold of pain'], [140, 'jet engine at 30 m']];
  Sim.make('sim-db', {
    aspect: 0.45,
    controls: [
      { k: 'P', label: 'Source power P (log scale)', min: -6, max: 3, step: 0.1, v: -2, show: function (v) { return f(Math.pow(10, v), 3) + ' W'; } },
      { k: 'r', label: 'Distance r', min: 1, max: 200, step: 1, v: 10, unit: 'm' },
      { k: 'n', label: 'Number of identical sources', min: 1, max: 100, step: 1, v: 1 }
    ],
    reads: [{ k: 'I', label: 'Intensity I = nP / 4&pi;r&sup2;' }, { k: 'b', label: 'Intensity level &beta; = 10 log(I/I<sub>0</sub>)', big: true }, { k: 'rule', label: 'Rules of thumb' }],
    draw: function (S, c, W, H) {
      var K = C(), p = S.p, I = p.n * Math.pow(10, p.P) / (4 * PI * p.r * p.r), b = 10 * Math.log10(I / 1e-12);
      D.clear(c, W, H);
      var x0 = W * 0.08, x1 = W * 0.92, y0 = H * 0.55, px = function (db) { return x0 + (x1 - x0) * clamp(db, 0, 150) / 150; };
      for (var d = 0; d <= 150; d += 2) D.rect(c, px(d), y0 - 18, (x1 - x0) / 75 + 1, 36, 'hsl(' + (120 - d * 0.8) + ',55%,' + (60 - d * 0.1) + '%)', null, 0);
      refs.forEach(function (q, i) { D.line(c, px(q[0]), y0 + 18, px(q[0]), y0 + 26, K.ink, 1); D.text(c, q[0] + ' dB', px(q[0]), y0 + 36, { size: 10, align: 'center', color: K.muted }); D.text(c, q[1], px(q[0]), i % 2 ? y0 + 66 : y0 + 52, { size: 10.5, align: 'center', color: K.ink }); });
      var bx = px(b); D.text(c, '▼', bx, y0 - 30, { size: 20, align: 'center', color: K.pos }); D.text(c, f(b, 3) + ' dB', bx, y0 - 52, { size: 13, align: 'center', color: K.pos, weight: 700 });
      for (var k = 1; k <= 5; k++) D.circle(c, W * 0.1, H * 0.2, k * 9, null, K.faint, 1);
      D.circle(c, W * 0.1, H * 0.2, 5, K.c1); D.text(c, 'I spreads over 4πr²', W * 0.1 + 54, H * 0.2, { size: 11, color: K.muted });
      S.set('I', f(I, 3) + ' W/m²'); S.set('b', f(b, 3) + ' dB'); S.set('rule', 'double r → −6 dB; ×10 sources → +10 dB; ×2 sources → +3 dB');
    }
  });

  /* ---------- 3D: transverse and longitudinal waves ---------- */
  var NX = 40, NY = 6;
  Sim.make('sim-waves3d', {
    webgl: true, aspect: 0.5, camera: { th: 0.55, ph: 1.1, r: 15 },
    controls: [
      { k: 'A', label: 'Amplitude', min: 0.1, max: 0.6, step: 0.02, v: 0.35 },
      { k: 'lam', label: 'Wavelength &lambda;', min: 2, max: 10, step: 0.5, v: 5 },
      { k: 'f', label: 'Frequency f', min: 0.1, max: 1, step: 0.05, v: 0.4 }
    ],
    buttons: [{ label: 'Both', group: 'm', on: true, click: function (S) { S.st.m = 0; } }, { label: 'Transverse (string)', group: 'm', click: function (S) { S.st.m = 1; } }, { label: 'Longitudinal (sound)', group: 'm', click: function (S) { S.st.m = 2; } }],
    reads: [{ k: 'v', label: 'Wave speed v = f&lambda;', big: true }, { k: 'T', label: 'Period T = 1/f' }],
    init: function (S) {
      var st = S.st; st.m = 0; st.m4 = new THREE.Matrix4();
      st.tr = new THREE.InstancedMesh(new THREE.SphereGeometry(0.13, 8, 6), T.mat(0xffffff), NX * NY); st.lo = new THREE.InstancedMesh(new THREE.SphereGeometry(0.13, 8, 6), T.mat(0xffffff), NX * NY);
      for (var i = 0; i < NX * NY; i++) { st.tr.setColorAt(i, new THREE.Color(i % NX === 20 ? 0xc62828 : 0xb4441f)); st.lo.setColorAt(i, new THREE.Color(i % NX === 20 ? 0xc62828 : 0x2f5d78)); }
      S.scene.add(st.tr); S.scene.add(st.lo);
      st.l1 = T.label(S.scene, 'transverse', '#b4441f', 0.9); st.l2 = T.label(S.scene, 'longitudinal', '#2f5d78', 0.9);
    },
    draw: function (S, c, W, H) {
      var st = S.st, p = S.p, k = 2 * PI / p.lam, w = 2 * PI * p.f, t = S.t, dx = 0.3, ofs = st.m === 0 ? 1.8 : 0;
      st.tr.visible = st.m !== 2; st.lo.visible = st.m !== 1; st.l1.visible = st.tr.visible; st.l2.visible = st.lo.visible;
      for (var j = 0; j < NY; j++) for (var i = 0; i < NX; i++) {
        var x = (i - NX / 2) * dx, z = (j - NY / 2) * 0.3, ph = k * x - w * t, idx = j * NX + i;
        st.m4.makeTranslation(x, ofs + p.A * 2 * Math.sin(ph), z); st.tr.setMatrixAt(idx, st.m4);
        st.m4.makeTranslation(x + p.A * Math.sin(ph), -ofs, z); st.lo.setMatrixAt(idx, st.m4);
      }
      st.tr.instanceMatrix.needsUpdate = true; st.lo.instanceMatrix.needsUpdate = true;
      st.l1.position.set(-7.5, ofs + 1.3, 0); st.l2.position.set(-7.5, -ofs + 1, 0);
      S.set('v', f(p.f * p.lam, 3) + ' units/s'); S.set('T', f(1 / p.f, 3) + ' s; red particles show one point of the medium');
    }
  });

  /* ---------- 3D: standing waves in air columns ---------- */
  Sim.make('sim-pipe3d', {
    webgl: true, aspect: 0.5, camera: { th: 0.35, ph: 1.15, r: 14 },
    controls: [
      { k: 'n', label: 'Mode number', min: 1, max: 5, step: 1, v: 1 },
      { k: 'L', label: 'Pipe length L', min: 0.2, max: 2, step: 0.05, v: 0.6, unit: 'm' }
    ],
    buttons: [{ label: 'Open at both ends', group: 'p', on: true, click: function (S) { S.st.closed = false; } }, { label: 'Closed at one end', group: 'p', click: function (S) { S.st.closed = true; } }],
    reads: [{ k: 'h', label: 'Harmonic' }, { k: 'f', label: 'Frequency (v = 343 m/s)', big: true }, { k: 'lam', label: 'Wavelength' }],
    init: function (S) {
      var st = S.st; st.closed = false; st.m4 = new THREE.Matrix4(); st.N = 360;
      var tube = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 10, 32, 1, true), T.mat(0x8b9098, { opacity: 0.18, side: THREE.DoubleSide })); tube.rotation.z = PI / 2; S.scene.add(tube);
      st.cap = new THREE.Mesh(new THREE.CircleGeometry(1, 32), T.mat(0x22262b, { side: THREE.DoubleSide })); st.cap.rotation.y = PI / 2; st.cap.position.x = -5; S.scene.add(st.cap);
      st.dots = new THREE.InstancedMesh(new THREE.SphereGeometry(0.07, 6, 4), T.mat(0xffffff), st.N); st.base = [];
      for (var i = 0; i < st.N; i++) { var r = Math.sqrt(Math.random()) * 0.9, a = Math.random() * 2 * PI; st.base.push([-5 + 10 * (i + 0.5) / st.N, r * Math.cos(a), r * Math.sin(a)]); st.dots.setColorAt(i, new THREE.Color(0xb4441f)); }
      S.scene.add(st.dots);
      st.disp = T.line(S.scene, 0x2f5d78, 200); st.pres = T.line(S.scene, 0x3f7d3a, 200);
      st.lb = T.label(S.scene, 'blue: displacement   green: pressure', '#59606a', 0.9); st.lb.position.set(0, 3.4, 0);
    },
    draw: function (S, c, W, H) {
      var st = S.st, p = S.p, n = p.n, closed = st.closed, k = closed ? (2 * n - 1) * PI / 20 : n * PI / 10, ww = 2 * PI * 0.6 * (closed ? 2 * n - 1 : n) / (closed ? 1 : 1), t = S.t;
      var disp = function (x) { var u = x + 5; return closed ? Math.sin(k * u) : Math.cos(k * u); }, pres = function (x) { var u = x + 5; return closed ? Math.cos(k * u) : -Math.sin(k * u); };
      var cw = Math.cos(2 * PI * 0.5 * t);
      st.cap.visible = closed;
      for (var i = 0; i < st.N; i++) { var b = st.base[i], xx = b[0] + 0.35 * disp(b[0]) * cw; xx = clamp(xx, -5, 5); st.m4.makeTranslation(xx, b[1], b[2]); st.dots.setMatrixAt(i, st.m4); }
      st.dots.instanceMatrix.needsUpdate = true;
      var d1 = [], d2 = []; for (var j = 0; j <= 199; j++) { var x = -5 + 10 * j / 199; d1.push([x, 1.9 + 0.7 * disp(x) * cw, 0]); d2.push([x, -1.9 + 0.7 * pres(x) * cw, 0]); }
      T.setLine(st.disp, d1); T.setLine(st.pres, d2);
      var v = 343, fr = closed ? (2 * n - 1) * v / (4 * p.L) : n * v / (2 * p.L), lam = v / fr;
      S.set('h', closed ? (2 * n - 1) + (n === 1 ? 'st (fundamental): only odd harmonics exist' : 'th harmonic (odd only)') : n + (n === 1 ? 'st (fundamental): all harmonics exist' : 'th harmonic'));
      S.set('f', f(fr, 3) + ' Hz'); S.set('lam', f(lam, 3) + ' m (' + (closed ? '(2n−1)λ/4 = L' : 'nλ/2 = L') + ')');
    }
  });

  /* ---------- 3D: room acoustics and Sabine's formula ---------- */
  var wallM = [['Concrete', 0.02], ['Plaster', 0.04], ['Wood panels', 0.1], ['Curtains', 0.5], ['Acoustic tiles', 0.7]];
  var floorM = [['Marble', 0.01], ['Wood floor', 0.08], ['Carpet', 0.3]];
  function sabine(S) {
    var p = S.p, st = S.st, V = p.L * p.W * p.H, Sw = 2 * (p.L + p.W) * p.H, Sf = p.L * p.W;
    var A = Sw * wallM[st.w][1] + Sf * floorM[st.f][1] + Sf * (st.w === 4 ? 0.7 : 0.03) + p.n * 0.45;
    return { V: V, A: A, T: 0.161 * V / A, Stot: Sw + 2 * Sf };
  }
  function clap(S) { var st = S.st; st.rays = []; for (var i = 0; i < 150; i++) { var v = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize(); st.rays.push({ p: new THREE.Vector3(), v: v, e: 1, fresh: true }); } st.tc = 0; }
  Sim.make('sim-sabine3d', {
    webgl: true, aspect: 0.55, camera: { th: 0.7, ph: 1.05, r: 18 },
    controls: [
      { k: 'L', label: 'Hall length', min: 8, max: 60, step: 1, v: 30, unit: 'm' },
      { k: 'W', label: 'Hall width', min: 6, max: 40, step: 1, v: 20, unit: 'm' },
      { k: 'H', label: 'Hall height', min: 3, max: 20, step: 0.5, v: 8, unit: 'm' },
      { k: 'n', label: 'Audience (persons, 0.45 sabin each)', min: 0, max: 1000, step: 10, v: 200 }
    ],
    buttons: wallM.map(function (m, j) { return { label: 'Walls: ' + m[0], group: 'w', on: j === 1, click: function (S) { S.st.w = j; recolour(S); } }; }).concat(floorM.map(function (m, j) { return { label: 'Floor: ' + m[0], group: 'f', on: j === 1, click: function (S) { S.st.f = j; recolour(S); } }; })).concat([{ label: 'Clap!', click: clap }]),
    reads: [{ k: 'e', label: 'Sound energy left since the clap' }, { k: 'V', label: 'Volume V' }, { k: 'A', label: 'Total absorption A = &Sigma;&alpha;S (sabin)' }, { k: 'T', label: 'Reverberation time T = 0.161 V / A', big: true }, { k: 'q', label: 'Verdict' }],
    init: function (S) {
      var st = S.st; st.w = 1; st.f = 1; st.rays = []; st.m4 = new THREE.Matrix4();
      st.room = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), T.mat(0xd9d3c9, { opacity: 0.25, side: THREE.BackSide })); S.scene.add(st.room);
      st.edges = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1)), new THREE.LineBasicMaterial({ color: 0x59606a })); S.scene.add(st.edges);
      st.floor = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), T.mat(0xb7791f, { side: THREE.DoubleSide })); st.floor.rotation.x = -PI / 2; S.scene.add(st.floor);
      st.dots = new THREE.InstancedMesh(new THREE.SphereGeometry(0.09, 6, 4), T.mat(0xffffff), 150);
      for (var i = 0; i < 150; i++) st.dots.setColorAt(i, new THREE.Color(0xb4441f));
      st.dots.count = 0; S.scene.add(st.dots);
      st.src = T.sphere(0.2, 0x22262b); S.scene.add(st.src);
      recolour(S); clap(S);
    },
    draw: function (S, c, W, H, dt) {
      var st = S.st, p = S.p, sc = 10 / Math.max(p.L, p.W, p.H * 1.5), hx = p.L * sc / 2, hy = p.H * sc / 2, hz = p.W * sc / 2, r = sabine(S);
      st.room.scale.set(2 * hx, 2 * hy, 2 * hz); st.edges.scale.copy(st.room.scale); st.floor.scale.set(2 * hx, 2 * hz, 1); st.floor.position.y = -hy + 0.01;
      st.src.position.set(-hx * 0.6, -hy + 0.5, 0);
      var alphaAvg = r.A / r.Stot, sp = 343 * sc / 25;
      st.tc += dt;
      var col = new THREE.Color(), alive = 0, etot = 0;
      st.rays.forEach(function (q, i) {
        if (q.fresh) { q.fresh = false; q.p.copy(st.src.position); }
        q.p.addScaledVector(q.v, sp * dt);
        [['x', hx], ['y', hy], ['z', hz]].forEach(function (a) { var k = a[0]; if (q.p[k] > a[1]) { q.p[k] = 2 * a[1] - q.p[k]; q.v[k] *= -1; q.e *= 1 - alphaAvg; } if (q.p[k] < -a[1]) { q.p[k] = -2 * a[1] - q.p[k]; q.v[k] *= -1; q.e *= 1 - alphaAvg; } });
        st.m4.makeTranslation(q.p.x, q.p.y, q.p.z); st.dots.setMatrixAt(i, st.m4);
        col.setRGB(0.93 - 0.22 * q.e, 0.93 - 0.66 * q.e, 0.93 - 0.81 * q.e); st.dots.setColorAt(i, col); etot += q.e;
      });
      st.dots.count = st.rays.length; st.dots.instanceMatrix.needsUpdate = true; if (st.dots.instanceColor) st.dots.instanceColor.needsUpdate = true;
      var q = r.T < 0.8 ? 'good for speech (lecture room)' : r.T < 1.5 ? 'good for a mixed-use auditorium' : r.T < 2.2 ? 'good for music, too echoey for speech' : 'too reverberant: add absorbing material';
      S.set('e', st.rays.length ? f(10 * Math.log10(Math.max(etot / st.rays.length, 1e-9)), 3) + ' dB after ' + f(st.tc / 25 * 1, 3) + ' s (real time; −60 dB at T)' : '—'); S.set('V', f(r.V, 4) + ' m³'); S.set('A', f(r.A, 4) + ' sabin (average α = ' + f(alphaAvg, 2) + ')'); S.set('T', f(r.T, 3) + ' s'); S.set('q', q);
    }
  });
  function recolour(S) { var st = S.st; st.room.material.color.setHSL(0.07, 0.15 + wallM[st.w][1] * 0.8, 0.8 - wallM[st.w][1] * 0.35); st.floor.material.color.set([0xe8e4dd, 0xb7791f, 0x7a4fa0][st.f]); }
})();
