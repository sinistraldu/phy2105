/* PHY1201 Unit 2: oscillation simulations */
(function () {
  var D = Sim.D, f = Sim.fmt, C = Sim.col, PI = Math.PI, T = Sim.T3, clamp = Sim.clamp;

  /* ---------- 2D: SHM with phasor ---------- */
  Sim.make('sim-shm', {
    aspect: 0.55, animate: true,
    controls: [
      { k: 'A', label: 'Amplitude A', min: 0.2, max: 1, step: 0.01, v: 0.8, unit: 'm' },
      { k: 'f', label: 'Frequency f', min: 0.1, max: 1, step: 0.01, v: 0.3, unit: 'Hz' },
      { k: 'ph', label: 'Initial phase &phi;', min: 0, max: 360, step: 5, v: 0, unit: '°' }
    ],
    reads: [{ k: 'now', label: 'Now: x, v, a' }, { k: 'max', label: 'v<sub>max</sub> = A&omega;, a<sub>max</sub> = A&omega;&sup2;', big: true }, { k: 'T', label: '&omega; = 2&pi;f, T = 1/f' }],
    draw: function (S, c, W, H) {
      var K = C(), p = S.p, w = 2 * PI * p.f, ph = p.ph * PI / 180, t = S.t, A = p.A;
      var x = A * Math.cos(w * t + ph), v = -A * w * Math.sin(w * t + ph), a = -w * w * x;
      D.clear(c, W, H);
      var R = Math.min(W * 0.15, H * 0.3), cx = W * 0.18, cy = H * 0.45, sc = R / 1;
      D.circle(c, cx, cy, R * A, null, K.line, 1.5);
      var px = cx + sc * x, py = cy - sc * A * Math.sin(w * t + ph);
      D.line(c, cx - R * 1.1, cy, cx + R * 1.1, cy, K.faint, 1); D.line(c, cx, cy - R * 1.1, cx, cy + R * 1.1, K.faint, 1);
      D.arrow(c, cx, cy, px, py, K.c2, 2.5); D.line(c, px, py, px, cy, K.faint, 1, [4, 3]);
      D.circle(c, px, cy, 7, K.pos);
      D.text(c, 'rotating phasor (ωt + φ)', cx, cy + R * 1.25, { size: 11, align: 'center', color: K.muted });
      D.text(c, 'the red ball is its shadow: SHM', cx, cy + R * 1.25 + 16, { size: 11, align: 'center', color: K.pos });
      var Tp = 1 / p.f, t0 = Math.max(0, t - 2 * Tp), gx = W * 0.38, gw = W * 0.6, gh = H * 0.27;
      [['x (m)', function (tt) { return A * Math.cos(w * tt + ph); }, A, K.c1, x], ['v (m/s)', function (tt) { return -A * w * Math.sin(w * tt + ph); }, A * w, K.c3, v], ['a (m/s²)', function (tt) { return -A * w * w * Math.cos(w * tt + ph); }, A * w * w, K.c4, a]].forEach(function (q, i) {
        var pts = []; for (var k = 0; k <= 200; k++) { var tt = t0 + 2 * Tp * k / 200; pts.push([tt, q[1](tt)]); }
        var box = { x: gx, y: H * 0.04 + i * (gh + H * 0.05), w: gw, h: gh };
        var g = D.graph(c, box, { x0: t0, x1: t0 + 2 * Tp, y0: -1.15 * q[2], y1: 1.15 * q[2], yl: q[0] }, [{ pts: pts, color: q[3], w: 2.2 }]);
        D.circle(c, g.px(t), g.py(q[4]), 5, q[3]);
      });
      D.text(c, 'time →  (v leads x by 90°, a is opposite to x)', gx + gw, H - 6, { size: 11, align: 'right', color: K.muted });
      S.set('now', f(x, 2) + ' m, ' + f(v, 2) + ' m/s, ' + f(a, 2) + ' m/s²'); S.set('max', f(A * w, 3) + ' m/s, ' + f(A * w * w, 3) + ' m/s²'); S.set('T', f(w, 3) + ' rad/s, ' + f(1 / p.f, 3) + ' s');
    }
  });

  /* ---------- 2D: energy in SHM ---------- */
  Sim.make('sim-energy', {
    aspect: 0.5, animate: true,
    controls: [
      { k: 'm', label: 'Mass m', min: 0.2, max: 4, step: 0.1, v: 1, unit: 'kg' },
      { k: 'k', label: 'Spring constant k', min: 5, max: 100, step: 1, v: 20, unit: 'N/m' },
      { k: 'A', label: 'Amplitude A', min: 0.05, max: 0.3, step: 0.01, v: 0.2, unit: 'm' }
    ],
    reads: [{ k: 'E', label: 'Total E = &frac12;kA&sup2;', big: true }, { k: 'now', label: 'Now: KE, PE' }, { k: 'avg', label: 'Time averages &lang;KE&rang; = &lang;PE&rang; = E/2' }],
    draw: function (S, c, W, H) {
      var K = C(), p = S.p, w = Math.sqrt(p.k / p.m), t = S.t, x = p.A * Math.cos(w * t), E = 0.5 * p.k * p.A * p.A, PE = 0.5 * p.k * x * x, KE = E - PE;
      D.clear(c, W, H);
      var b1 = { x: W * 0.05, y: H * 0.07, w: W * 0.4, h: H * 0.55 }, pu = [];
      for (var xx = -0.3; xx <= 0.3; xx += 0.005) pu.push([xx, 0.5 * p.k * xx * xx]);
      var Em = 0.5 * 100 * 0.09;
      var g = D.graph(c, b1, { x0: -0.32, x1: 0.32, y0: 0, y1: Math.max(E * 1.3, 0.05), xl: 'x (m)', yl: 'energy (J)', hlines: [{ y: E, label: 'E', color: K.c2 }] }, [{ pts: pu, color: K.c1, w: 2.5 }]);
      D.line(c, g.px(x), g.py(PE), g.px(x), g.py(E), K.c3, 4); D.line(c, g.px(x), g.py(0), g.px(x), g.py(PE), K.c1, 4);
      D.circle(c, g.px(x), g.py(PE), 5, K.pos);
      D.text(c, 'green: KE   blue line: PE', b1.x + 6, b1.y + 28, { size: 11, color: K.muted });
      // spring-mass picture
      var y0 = H * 0.82, wx = W * 0.05, mx = W * 0.25 + x / 0.3 * W * 0.15;
      D.line(c, wx, y0 - 22, wx, y0 + 22, K.ink, 3); D.spring(c, wx, y0, mx - 18, y0, 10, 9, K.muted, 1.6); D.rect(c, mx - 18, y0 - 18, 36, 36, K.c2, null, 4);
      D.line(c, W * 0.25, y0 + 26, W * 0.25, y0 + 34, K.faint, 1); D.text(c, 'x = 0', W * 0.25, y0 + 42, { size: 10, align: 'center', color: K.faint });
      var Tp = 2 * PI / w, b2 = { x: W * 0.52, y: H * 0.07, w: W * 0.45, h: H * 0.8 }, pk = [], pp = [], t0 = Math.max(0, t - 2 * Tp);
      for (var k = 0; k <= 200; k++) { var tt = t0 + 2 * Tp * k / 200, xt = p.A * Math.cos(w * tt); pp.push([tt, 0.5 * p.k * xt * xt]); pk.push([tt, E - 0.5 * p.k * xt * xt]); }
      var g2 = D.graph(c, b2, { x0: t0, x1: t0 + 2 * Tp, y0: 0, y1: E * 1.25, xl: 'time →', yl: 'KE (green), PE (blue)', hlines: [{ y: E, label: 'E', color: K.c2 }, { y: E / 2, label: 'average = E/2', color: K.faint }] }, [{ pts: pk, color: K.c3, w: 2.2 }, { pts: pp, color: K.c1, w: 2.2 }]);
      D.circle(c, g2.px(t), g2.py(KE), 5, K.c3); D.circle(c, g2.px(t), g2.py(PE), 5, K.c1);
      S.set('E', f(E, 3) + ' J'); S.set('now', f(KE, 3) + ' J, ' + f(PE, 3) + ' J'); S.set('avg', f(E / 2, 3) + ' J each; energies oscillate at 2f = ' + f(w / PI, 3) + ' Hz');
    }
  });

  /* ---------- 2D: Lissajous figures ---------- */
  Sim.make('sim-lissajous', {
    aspect: 0.5, animate: true,
    controls: [
      { k: 'fx', label: 'Frequency along x (f<sub>x</sub>)', min: 1, max: 5, step: 1, v: 1 },
      { k: 'fy', label: 'Frequency along y (f<sub>y</sub>)', min: 1, max: 5, step: 1, v: 2 },
      { k: 'd', label: 'Phase difference &delta;', min: 0, max: 360, step: 5, v: 90, unit: '°' },
      { k: 'ay', label: 'Amplitude ratio A<sub>y</sub>/A<sub>x</sub>', min: 0.2, max: 1, step: 0.05, v: 1 }
    ],
    buttons: [{ k: 'drift', label: 'Let the phase drift', click: function (S, b) { S.st.drift = !S.st.drift; b.classList.toggle('on', S.st.drift); } }],
    reads: [{ k: 'r', label: 'Frequency ratio f<sub>x</sub> : f<sub>y</sub>', big: true }, { k: 'sh', label: 'Shape' }, { k: 'rule', label: 'Rule: f<sub>y</sub>/f<sub>x</sub> = touches on vertical side / touches on top' }],
    init: function (S) { S.st.drift = false; S.st.ex = 0; },
    draw: function (S, c, W, H, dt) {
      var K = C(), p = S.p; if (S.st.drift) S.st.ex += dt * 0.6;
      var d = p.d * PI / 180 + S.st.ex, R = Math.min(W * 0.3, H * 0.4), cx = W * 0.5, cy = H * 0.5, pts = [];
      for (var k = 0; k <= 1200; k++) { var s = 2 * PI * k / 1200; pts.push([cx + R * Math.sin(p.fx * s + d), cy - R * p.ay * Math.sin(p.fy * s)]); }
      D.clear(c, W, H);
      D.rect(c, cx - R, cy - R * p.ay, 2 * R, 2 * R * p.ay, null, K.line, 2, 1);
      D.poly(c, pts, K.c1, 2.5, false);
      var s0 = S.t * 0.5; D.circle(c, cx + R * Math.sin(p.fx * s0 + d), cy - R * p.ay * Math.sin(p.fy * s0), 6, K.pos);
      var bx = []; for (var k2 = 0; k2 <= 200; k2++) { var s2 = 4 * PI * k2 / 200; bx.push([cx - R + 2 * R * k2 / 200, H * 0.06 + 10 * Math.sin(p.fx * s2 + d)]); }
      D.poly(c, bx, K.c2, 1.5, false); D.text(c, 'x: A sin(f_x t + δ)', cx + R + 8, H * 0.06, { size: 11, color: K.c2 });
      var by = []; for (var k3 = 0; k3 <= 200; k3++) { var s3 = 4 * PI * k3 / 200; by.push([W * 0.12 + 10 * Math.sin(p.fy * s3), cy + R * p.ay - 2 * R * p.ay * k3 / 200]); }
      D.poly(c, by, K.c3, 1.5, false); D.text(c, 'y: B sin(f_y t)', W * 0.12, cy + R * p.ay + 16, { size: 11, color: K.c3, align: 'center' });
      var g = function (a, b) { return b ? g(b, a % b) : a; }, gg = g(p.fx, p.fy), dd = ((p.d % 360) + 360) % 360;
      var sh = p.fx === p.fy ? (dd === 0 || dd === 180 ? 'straight line' : dd === 90 || dd === 270 ? (p.ay === 1 ? 'circle' : 'ellipse (axes along x and y)') : 'tilted ellipse') : 'Lissajous figure with ' + p.fy / gg + ' and ' + p.fx / gg + ' lobes';
      S.set('r', p.fx / gg + ' : ' + p.fy / gg); S.set('sh', S.st.drift ? 'rotating (phase drifting, like slightly unequal frequencies)' : sh); S.set('rule', 'touches top edge ' + p.fx / gg + ' times, side edge ' + p.fy / gg + ' times');
    }
  });

  /* ---------- 2D: damped oscillation (mechanical or RLC) ---------- */
  function dampSolve(m, k, b, x0, tmax, n) { var x = x0, v = 0, h = tmax / n, out = [[0, x0]]; for (var i = 0; i < n; i++) { for (var j = 0; j < 8; j++) { var hh = h / 8, a1 = (-k * x - b * v) / m, v1 = v + a1 * hh / 2, x1 = x + v * hh / 2, a2 = (-k * x1 - b * v1) / m; x += v1 * hh; v += a2 * hh; } out.push([(i + 1) * h, x]); } return out; }
  Sim.make('sim-damped', {
    aspect: 0.5, animate: true,
    controls: [
      { k: 'm', label: 'Mass m (or inductance L)', min: 0.2, max: 3, step: 0.05, v: 1 },
      { k: 'k', label: 'Spring constant k (or 1/C)', min: 4, max: 60, step: 1, v: 20 },
      { k: 'b', label: 'Damping b (or resistance R)', min: 0, max: 25, step: 0.1, v: 1.5 }
    ],
    buttons: [{ label: 'Mechanical', group: 'v', on: true, click: function (S) { S.st.el = false; } }, { label: 'RLC circuit', group: 'v', click: function (S) { S.st.el = true; } }, { label: 'Critical damping', click: function (S) { S.setControl('b', Math.min(25, 2 * Math.sqrt(S.p.k * S.p.m))); } }],
    reads: [{ k: 'reg', label: 'Regime', big: true }, { k: 'g', label: '&gamma; = b/2m, &omega;<sub>0</sub> = &radic;(k/m)' }, { k: 'w', label: 'Damped &omega;&prime; = &radic;(&omega;<sub>0</sub>&sup2; &minus; &gamma;&sup2;)' }, { k: 'tau', label: 'Amplitude time 1/&gamma;, energy lifetime 1/2&gamma;' }, { k: 'Q', label: 'Quality factor Q = &omega;<sub>0</sub>/2&gamma;' }],
    init: function (S) { S.st.el = false; },
    draw: function (S, c, W, H) {
      var K = C(), p = S.p, w0 = Math.sqrt(p.k / p.m), g = p.b / (2 * p.m), tmax = 4 * 2 * PI / w0, pts = dampSolve(p.m, p.k, p.b, 1, tmax, 400), env = [], envn = [];
      for (var i = 0; i <= 100; i++) { var tt = tmax * i / 100; env.push([tt, Math.exp(-g * tt)]); envn.push([tt, -Math.exp(-g * tt)]); }
      var tc = (S.t % tmax), xc = pts[Math.min(400, Math.round(tc / tmax * 400))][1];
      D.clear(c, W, H);
      var box = { x: W * 0.2, y: H * 0.07, w: W * 0.78, h: H * 0.8 };
      var gr = D.graph(c, box, { x0: 0, x1: tmax, y0: -1.1, y1: 1.1, xl: 'time (s) →', yl: S.st.el ? 'charge q / q₀' : 'displacement x / x₀' }, [{ pts: env, color: K.faint, w: 1.5 }, { pts: envn, color: K.faint, w: 1.5 }, { pts: pts, color: K.c1, w: 2.5 }]);
      D.circle(c, gr.px(tc), gr.py(xc), 5, K.pos);
      var cx = W * 0.1;
      if (!S.st.el) {
        var top = H * 0.08, y = H * 0.45 + xc * H * 0.25;
        D.line(c, cx - 30, top, cx + 30, top, K.ink, 3); D.spring(c, cx, top, cx, y - 16, 10, 9, K.muted, 1.6); D.rect(c, cx - 18, y - 16, 36, 32, K.c2, null, 4);
        D.rect(c, cx - 26, H * 0.62, 52, H * 0.3, 'rgba(47,93,120,0.18)', K.line, 4); D.line(c, cx, y + 16, cx, H * 0.75, K.ink, 2); D.rect(c, cx - 20, H * 0.75, 40, 6, K.ink, null, 1);
        D.text(c, 'dashpot (b)', cx, H * 0.96, { size: 10.5, align: 'center', color: K.muted });
      } else {
        var y0 = H * 0.15, y1 = H * 0.85, xl = cx - 30, xr = cx + 30;
        D.line(c, xl, y0, xr, y0, K.ink, 1.5); D.line(c, xl, y1, xr, y1, K.ink, 1.5); D.line(c, xl, y0, xl, y1, K.ink, 1.5);
        D.rect(c, xl - 7, H * 0.3, 14, H * 0.14, K.surface, K.ink, 2, 1.5); D.text(c, 'R', xl - 14, H * 0.37, { size: 12, align: 'right', weight: 700 });
        D.spring(c, xl, H * 0.55, xl, H * 0.75, 6, 7, K.ink, 1.5); D.text(c, 'L', xl - 14, H * 0.65, { size: 12, align: 'right', weight: 700 });
        D.line(c, xr, y0, xr, H * 0.47, K.ink, 1.5); D.line(c, xr, H * 0.53, xr, y1, K.ink, 1.5); D.line(c, xr - 14, H * 0.47, xr + 14, H * 0.47, K.ink, 2.5); D.line(c, xr - 14, H * 0.53, xr + 14, H * 0.53, K.ink, 2.5);
        D.text(c, 'C', xr + 18, H * 0.5, { size: 12, weight: 700 });
        var qq = Math.abs(xc); D.text(c, xc >= 0 ? '+' : '−', xr, H * 0.43, { size: 10 + 8 * qq, align: 'center', color: K.pos, weight: 700 }); D.text(c, xc >= 0 ? '−' : '+', xr, H * 0.58, { size: 10 + 8 * qq, align: 'center', color: K.neg, weight: 700 });
      }
      var reg = g < w0 * 0.999 ? (p.b === 0 ? 'undamped: SHM forever' : 'underdamped: oscillates with decaying amplitude') : g < w0 * 1.001 ? 'critically damped: fastest return, no oscillation' : 'overdamped: slow creep back, no oscillation';
      S.set('reg', reg); S.set('g', f(g, 3) + ' s⁻¹, ' + f(w0, 3) + ' rad/s'); S.set('w', g < w0 ? f(Math.sqrt(w0 * w0 - g * g), 3) + ' rad/s (period ' + f(2 * PI / Math.sqrt(w0 * w0 - g * g), 3) + ' s)' : 'imaginary: no oscillation');
      S.set('tau', g > 0 ? f(1 / g, 3) + ' s, ' + f(1 / (2 * g), 3) + ' s' : 'infinite'); S.set('Q', g > 0 ? f(w0 / (2 * g), 3) : '∞');
    }
  });

  /* ---------- 2D: RC charging and discharging ---------- */
  Sim.make('sim-rc', {
    aspect: 0.5, animate: true,
    controls: [
      { k: 'R', label: 'Resistance R', min: 1, max: 100, step: 1, v: 20, unit: 'kΩ' },
      { k: 'C', label: 'Capacitance C', min: 10, max: 200, step: 5, v: 50, unit: 'µF' },
      { k: 'V', label: 'Battery emf &epsilon;', min: 1, max: 12, step: 0.5, v: 9, unit: 'V' }
    ],
    buttons: [{ label: 'Charge', group: 'm', on: true, click: function (S) { S.st.dis = false; S.st.t0 = S.t; } }, { label: 'Discharge', group: 'm', click: function (S) { S.st.dis = true; S.st.t0 = S.t; } }],
    reads: [{ k: 'tau', label: 'Time constant &tau; = RC', big: true }, { k: 'q', label: 'Now: V<sub>C</sub> and current i' }, { k: 'pct', label: 'After one &tau;' }],
    init: function (S) { S.st.dis = false; S.st.t0 = 0; },
    onChange: function (S) { S.st.t0 = S.t; },
    draw: function (S, c, W, H) {
      var K = C(), p = S.p, tau = p.R * 1e3 * p.C * 1e-6, tmax = 5 * tau, t = Math.min(tmax, (S.t - S.st.t0) * Math.max(1, tau / 2)), dis = S.st.dis;
      var Vc = function (tt) { return dis ? p.V * Math.exp(-tt / tau) : p.V * (1 - Math.exp(-tt / tau)); }, I = function (tt) { return (dis ? -1 : 1) * p.V / (p.R * 1e3) * Math.exp(-tt / tau) * 1e3; };
      var pv = [], pi = []; for (var k = 0; k <= 200; k++) { var tt = tmax * k / 200; pv.push([tt, Vc(tt)]); pi.push([tt, I(tt)]); }
      D.clear(c, W, H);
      var b1 = { x: W * 0.32, y: H * 0.05, w: W * 0.65, h: H * 0.42 }, b2 = { x: W * 0.32, y: H * 0.53, w: W * 0.65, h: H * 0.4 }, Im = p.V / (p.R * 1e3) * 1e3;
      var g1 = D.graph(c, b1, { x0: 0, x1: tmax, y0: 0, y1: p.V * 1.1, yl: 'capacitor voltage (V)', vlines: [{ x: tau, label: 'τ', color: K.c2 }], hlines: [{ y: p.V * (dis ? 0.368 : 0.632), label: dis ? '37%' : '63%', color: K.faint }] }, [{ pts: pv, color: K.c1, w: 2.5 }]);
      D.circle(c, g1.px(t), g1.py(Vc(t)), 5, K.pos);
      var g2 = D.graph(c, b2, { x0: 0, x1: tmax, y0: dis ? -Im * 1.1 : 0, y1: dis ? 0.1 * Im : Im * 1.1, xl: 'time (s) →', yl: 'current (mA)', vlines: [{ x: tau, color: K.c2 }] }, [{ pts: pi, color: K.c3, w: 2.5 }]);
      D.circle(c, g2.px(t), g2.py(I(t)), 5, K.pos);
      var x0 = W * 0.04, x1 = W * 0.26, y0 = H * 0.2, y1 = H * 0.8;
      D.line(c, x0, y0, x1, y0, K.ink, 1.5); D.line(c, x1, y0, x1, H * 0.46, K.ink, 1.5); D.line(c, x1, H * 0.54, x1, y1, K.ink, 1.5); D.line(c, x1, y1, x0, y1, K.ink, 1.5);
      D.line(c, x1 - 16, H * 0.46, x1 + 16, H * 0.46, K.ink, 3); D.line(c, x1 - 16, H * 0.54, x1 + 16, H * 0.54, K.ink, 3); D.text(c, 'C', x1 + 22, H * 0.5, { size: 12, weight: 700 });
      D.rect(c, (x0 + x1) / 2 - 18, y0 - 7, 36, 14, K.surface, K.ink, 2, 1.5); D.text(c, 'R', (x0 + x1) / 2, y0 - 18, { size: 12, align: 'center', weight: 700 });
      if (!dis) { D.line(c, x0, y0, x0, H * 0.46, K.ink, 1.5); D.line(c, x0, H * 0.54, x0, y1, K.ink, 1.5); D.line(c, x0 - 14, H * 0.46, x0 + 14, H * 0.46, K.ink, 3); D.line(c, x0 - 8, H * 0.54, x0 + 8, H * 0.54, K.ink, 3); D.text(c, 'ε', x0 - 20, H * 0.5, { size: 13, weight: 700 }); }
      else D.line(c, x0, y0, x0, y1, K.ink, 1.5);
      var fill = Vc(t) / p.V; D.rect(c, x1 - 16, H * 0.46 - 4 - 18 * fill, 32, 18 * fill, 'rgba(198,40,40,0.35)', null, 2);
      S.set('tau', f(tau, 3) + ' s'); S.set('q', f(Vc(t), 3) + ' V, ' + f(I(t), 3) + ' mA'); S.set('pct', dis ? 'falls to 37% (1/e)' : 'reaches 63% (1 − 1/e); 99% after 5τ');
    }
  });

  /* ---------- 2D: series RLC impedance ---------- */
  Sim.make('sim-impedance', {
    aspect: 0.5,
    controls: [
      { k: 'R', label: 'Resistance R', min: 5, max: 200, step: 1, v: 40, unit: 'Ω' },
      { k: 'L', label: 'Inductance L', min: 10, max: 500, step: 5, v: 100, unit: 'mH' },
      { k: 'C', label: 'Capacitance C', min: 1, max: 100, step: 1, v: 10, unit: 'µF' },
      { k: 'f', label: 'Supply frequency f', min: 10, max: 500, step: 1, v: 120, unit: 'Hz' }
    ],
    reads: [{ k: 'X', label: 'X<sub>L</sub> = &omega;L, X<sub>C</sub> = 1/&omega;C' }, { k: 'Z', label: 'Z = &radic;(R&sup2; + (X<sub>L</sub> &minus; X<sub>C</sub>)&sup2;)', big: true }, { k: 'ph', label: 'Phase tan&phi; = (X<sub>L</sub> &minus; X<sub>C</sub>)/R' }, { k: 'f0', label: 'Resonance f<sub>0</sub> = 1/2&pi;&radic;(LC), Q = (1/R)&radic;(L/C)' }],
    draw: function (S, c, W, H) {
      var K = C(), p = S.p, L = p.L * 1e-3, Cc = p.C * 1e-6, w = 2 * PI * p.f, XL = w * L, XC = 1 / (w * Cc), Z = Math.hypot(p.R, XL - XC), phi = Math.atan2(XL - XC, p.R), f0 = 1 / (2 * PI * Math.sqrt(L * Cc)), V = 10;
      D.clear(c, W, H);
      var ox = W * 0.08, oy = H * 0.5, sc = Math.min(W * 0.3, H * 0.4) / Math.max(p.R, XL, XC, Z, 1);
      D.line(c, ox - 10, oy, ox + W * 0.34, oy, K.faint, 1); D.line(c, ox, oy - H * 0.45, ox, oy + H * 0.45, K.faint, 1);
      D.arrow(c, ox, oy, ox + p.R * sc, oy, K.c1, 3); D.text(c, 'R', ox + p.R * sc / 2, oy + 14, { size: 12, color: K.c1, weight: 700, align: 'center' });
      D.arrow(c, ox, oy, ox, oy - XL * sc, K.c3, 3); D.text(c, 'X_L', ox + 6, oy - XL * sc + 8, { size: 12, color: K.c3, weight: 700 });
      D.arrow(c, ox, oy, ox, oy + XC * sc, K.c4, 3); D.text(c, 'X_C', ox + 6, oy + XC * sc - 8, { size: 12, color: K.c4, weight: 700 });
      D.arrow(c, ox, oy, ox + p.R * sc, oy - (XL - XC) * sc, K.c2, 3.5); D.text(c, 'Z', ox + p.R * sc + 6, oy - (XL - XC) * sc, { size: 13, color: K.c2, weight: 700 });
      D.line(c, ox + p.R * sc, oy, ox + p.R * sc, oy - (XL - XC) * sc, K.faint, 1, [4, 3]);
      D.text(c, 'impedance triangle', ox, H * 0.04, { size: 11, color: K.muted });
      var box = { x: W * 0.47, y: H * 0.07, w: W * 0.5, h: H * 0.8 }, pts = [], fmax = 500;
      for (var ff = 5; ff <= fmax; ff += 1) { var ww = 2 * PI * ff, zz = Math.hypot(p.R, ww * L - 1 / (ww * Cc)); pts.push([ff, V / zz * 1000]); }
      var g = D.graph(c, box, { x0: 0, x1: fmax, y0: 0, y1: V / p.R * 1000 * 1.15, xl: 'frequency (Hz) →', yl: 'current amplitude (mA) for 10 V', vlines: [{ x: f0, label: 'f₀', color: K.c2 }] }, [{ pts: pts, color: K.c1, w: 2.5 }]);
      D.circle(c, g.px(p.f), g.py(V / Z * 1000), 6, K.pos);
      S.set('X', f(XL, 3) + ' Ω, ' + f(XC, 3) + ' Ω'); S.set('Z', f(Z, 3) + ' Ω → I = ' + f(V / Z * 1000, 3) + ' mA');
      S.set('ph', f(phi * 180 / PI, 3) + '° (' + (Math.abs(XL - XC) < 0.5 ? 'resonance: purely resistive' : XL > XC ? 'inductive, current lags' : 'capacitive, current leads') + ')');
      S.set('f0', f(f0, 3) + ' Hz, Q = ' + f(Math.sqrt(L / Cc) / p.R, 3));
    }
  });

  /* ---------- 2D: forced oscillation and resonance ---------- */
  Sim.make('sim-forced', {
    aspect: 0.5, animate: true,
    controls: [
      { k: 'r', label: 'Driving frequency &omega; / &omega;<sub>0</sub>', min: 0.1, max: 2.5, step: 0.01, v: 0.9 },
      { k: 'g', label: 'Damping &gamma; / &omega;<sub>0</sub>', min: 0.02, max: 0.8, step: 0.01, v: 0.1 }
    ],
    reads: [{ k: 'A', label: 'Steady amplitude A / (F<sub>0</sub>/k)', big: true }, { k: 'ph', label: 'Phase lag &theta; of x behind the force' }, { k: 'Q', label: 'Q = &omega;<sub>0</sub>/2&gamma;; bandwidth &Delta;&omega; = 2&gamma;' }, { k: 'pk', label: 'Amplitude resonance at &omega; = &radic;(&omega;<sub>0</sub>&sup2; &minus; 2&gamma;&sup2;)' }],
    draw: function (S, c, W, H) {
      var K = C(), p = S.p, Af = function (r, g) { return 1 / Math.sqrt(Math.pow(1 - r * r, 2) + 4 * g * g * r * r); }, th = Math.atan2(2 * p.g * p.r, 1 - p.r * p.r);
      D.clear(c, W, H);
      var box = { x: W * 0.06, y: H * 0.07, w: W * 0.5, h: H * 0.8 }, ser = [], ymax = Math.min(14, Af(Math.sqrt(Math.max(0, 1 - 2 * p.g * p.g)), p.g) * 1.15);
      [0.05, 0.1, 0.2, 0.4].forEach(function (gg) { var pts = []; for (var r = 0.05; r <= 2.5; r += 0.005) pts.push([r, Math.min(Af(r, gg), 30)]); ser.push({ pts: pts, color: K.grid, w: 1.5 }); });
      var cur = []; for (var r2 = 0.05; r2 <= 2.5; r2 += 0.005) cur.push([r2, Math.min(Af(r2, p.g), 30)]);
      ser.push({ pts: cur, color: K.c1, w: 2.8 });
      var g = D.graph(c, box, { x0: 0, x1: 2.5, y0: 0, y1: Math.max(ymax, 3), xl: 'ω / ω₀ →', yl: 'amplitude', vlines: [{ x: 1, label: 'ω₀', color: K.faint }] }, ser);
      D.circle(c, g.px(p.r), g.py(Af(p.r, p.g)), 6, K.pos);
      var bx = { x: W * 0.6, y: H * 0.07, w: W * 0.37, h: H * 0.8 }, w = p.r * 2.5, t = S.t, pf = [], px = [], A = Af(p.r, p.g), sc = 1 / Math.max(A, 1);
      for (var k = 0; k <= 200; k++) { var tt = t - 6 + 6 * k / 200; pf.push([tt, Math.cos(w * tt) * 1]); px.push([tt, A * sc * Math.cos(w * tt - th)]); }
      D.graph(c, bx, { x0: t - 6, x1: t, y0: -1.3, y1: 1.3, xl: 'time →', yl: 'force (grey) and x (red)' }, [{ pts: pf, color: K.faint, w: 2 }, { pts: px, color: K.c1, w: 2.5 }]);
      D.text(c, A > 1 ? 'x scaled ÷' + f(A, 2) : '', bx.x + bx.w - 6, bx.y + bx.h - 26, { size: 11, align: 'right', color: K.muted });
      S.set('A', f(A, 3)); S.set('ph', f(th * 180 / PI, 3) + '° (' + (p.r < 0.9 ? 'nearly in step' : p.r < 1.1 ? '≈ 90° at resonance' : 'nearly opposite') + ')');
      S.set('Q', f(1 / (2 * p.g), 3) + '; ' + f(2 * p.g, 3) + ' ω₀'); S.set('pk', 1 - 2 * p.g * p.g > 0 ? f(Math.sqrt(1 - 2 * p.g * p.g), 3) + ' ω₀' : 'none (too much damping)');
    }
  });

  /* ---------- 3D helper: helix spring ---------- */
  function helix(a, b, n, r, coils) { var pts = [], A = new THREE.Vector3().fromArray(a), B = new THREE.Vector3().fromArray(b), d = B.clone().sub(A), L = d.length(); d.normalize(); var u = new THREE.Vector3(1, 0, 0); if (Math.abs(d.x) > 0.9) u.set(0, 0, 1); var v1 = u.clone().cross(d).normalize(), v2 = d.clone().cross(v1); for (var i = 0; i <= n; i++) { var s = i / n, ang = s * coils * 2 * PI, rr = (i < 4 || i > n - 4) ? 0 : r; pts.push([A.x + d.x * L * s + rr * (Math.cos(ang) * v1.x + Math.sin(ang) * v2.x), A.y + d.y * L * s + rr * (Math.cos(ang) * v1.y + Math.sin(ang) * v2.y), A.z + d.z * L * s + rr * (Math.cos(ang) * v1.z + Math.sin(ang) * v2.z)]); } return pts; }

  /* ---------- 3D: spring-mass with chart recorder ---------- */
  Sim.make('sim-spring3d', {
    webgl: true, aspect: 0.55, camera: { th: 0.35, ph: 1.35, r: 15 },
    controls: [
      { k: 'm', label: 'Mass m', min: 0.2, max: 3, step: 0.05, v: 1, unit: 'kg' },
      { k: 'k', label: 'Spring constant k', min: 5, max: 80, step: 1, v: 20, unit: 'N/m' },
      { k: 'b', label: 'Damping b', min: 0, max: 4, step: 0.05, v: 0, unit: 'kg/s' }
    ],
    buttons: [{ label: 'Pull down and release', click: function (S) { S.st.x = -0.25; S.st.v = 0; } }],
    reads: [{ k: 'T', label: 'T = 2&pi;&radic;(m/k)', big: true }, { k: 'x', label: 'Displacement, velocity' }, { k: 'E', label: 'Energy &frac12;mv&sup2; + &frac12;kx&sup2;' }],
    init: function (S) {
      var st = S.st; st.x = -0.25; st.v = 0; st.hist = [];
      var bar = new THREE.Mesh(new THREE.BoxGeometry(3, 0.2, 1.5), T.mat(0x59606a)); bar.position.set(-2, 4, 0); S.scene.add(bar);
      st.spr = T.line(S.scene, 0x22262b, 400); st.mass = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), T.mat(0xb4441f)); S.scene.add(st.mass);
      st.pen = T.line(S.scene, 0xb4441f, 2); st.chart = T.line(S.scene, 0xb4441f, 600);
      var paper = new THREE.Mesh(new THREE.PlaneGeometry(7, 5), T.mat(0xfbfaf8, { side: THREE.DoubleSide })); paper.position.set(3.5, 0, -0.6); S.scene.add(paper);
      var ax = T.line(S.scene, 0x8b9098, 2); T.setLine(ax, [[0, 0, -0.55], [7, 0, -0.55]]);
      st.lb = T.label(S.scene, 'chart: x against time', '#59606a', 0.8); st.lb.position.set(3.5, 2.8, -0.5);
    },
    draw: function (S, c, W, H, dt) {
      var st = S.st, p = S.p, n = 10;
      for (var i = 0; i < n; i++) { var h = dt / n, a = (-p.k * st.x - p.b * st.v) / p.m; st.v += a * h; st.x += st.v * h; }
      var sc = 6, y = st.x * sc, my = -0.5 + y;
      st.mass.position.set(-2, my, 0); T.setLine(st.spr, helix([-2, 3.9, 0], [-2, my + 0.5, 0], 300, 0.35, 14));
      if (dt > 0) { st.hist.push(y); if (st.hist.length > 560) st.hist.shift(); }
      var pts = st.hist.map(function (yy, j) { return [(st.hist.length - 1 - j) * 0.0125, yy - 0.5 + 0.0, -0.5]; });
      T.setLine(st.chart, pts); T.setLine(st.pen, [[-1.5, my, 0], [0, my, -0.5]]);
      var w = Math.sqrt(p.k / p.m);
      S.set('T', f(2 * PI / w, 3) + ' s (f = ' + f(w / (2 * PI), 3) + ' Hz)'); S.set('x', f(st.x * 100, 3) + ' cm, ' + f(st.v, 3) + ' m/s'); S.set('E', f(0.5 * p.m * st.v * st.v + 0.5 * p.k * st.x * st.x, 3) + ' J');
    }
  });

  /* ---------- 3D: physical (compound) pendulum ---------- */
  Sim.make('sim-pendulum3d', {
    webgl: true, aspect: 0.55, camera: { th: 0.5, ph: 1.3, r: 12 },
    controls: [
      { k: 'L', label: 'Rod length L', min: 0.5, max: 2, step: 0.05, v: 1.2, unit: 'm' },
      { k: 'd', label: 'Pivot distance from centre of mass d', min: 0.02, max: 1, step: 0.01, v: 0.3, unit: 'm' },
      { k: 'A', label: 'Amplitude', min: 5, max: 30, step: 1, v: 15, unit: '°' }
    ],
    buttons: [{ label: 'Pivot for shortest period', click: function (S) { S.setControl('d', S.p.L / Math.sqrt(12)); } }],
    reads: [{ k: 'T', label: 'T = 2&pi;&radic;((K&sup2; + d&sup2;) / gd)', big: true }, { k: 'l', label: 'Equivalent simple pendulum l = (K&sup2;+d&sup2;)/d' }, { k: 'K', label: 'Radius of gyration K = L/&radic;12' }],
    init: function (S) {
      var st = S.st; st.rod = new THREE.Mesh(new THREE.BoxGeometry(0.25, 1, 0.08), T.mat(0xb7791f)); S.scene.add(st.rod);
      st.piv = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.8, 12), T.mat(0x22262b)); st.piv.rotation.x = PI / 2; st.piv.position.set(0, 3, 0); S.scene.add(st.piv);
      st.cm = T.sphere(0.1, 0xb4441f); S.scene.add(st.cm);
      st.sim = T.line(S.scene, 0x2f5d78, 2); st.bob = T.sphere(0.18, 0x2f5d78); S.scene.add(st.bob);
      st.lb = T.label(S.scene, 'blue: equivalent simple pendulum', '#2f5d78', 0.8); st.lb.position.set(2.6, 3.5, 0);
    },
    draw: function (S, c, W, H) {
      var st = S.st, p = S.p, d = Math.min(p.d, p.L / 2), K2 = p.L * p.L / 12, Tp = 2 * PI * Math.sqrt((K2 + d * d) / (9.81 * d)), l = (K2 + d * d) / d, sc = 2.6;
      var th = p.A * PI / 180 * Math.cos(2 * PI * S.t / Tp), cx = Math.sin(th), cy = -Math.cos(th);
      st.rod.scale.set(1, p.L * sc, 1); st.rod.rotation.z = th; st.rod.position.set(d * sc * cx, 3 + d * sc * cy, 0);
      st.cm.position.set(d * sc * cx, 3 + d * sc * cy, 0.08);
      var bx = 2.2 + l * sc * Math.sin(th), by = 3 - l * sc * Math.cos(th); T.setLine(st.sim, [[2.2, 3, 0], [bx, by, 0]]); st.bob.position.set(bx, by, 0);
      S.set('T', f(Tp, 3) + ' s'); S.set('l', f(l, 3) + ' m (same period)'); S.set('K', f(Math.sqrt(K2), 3) + ' m; shortest T when d = K');
    }
  });

  /* ---------- 3D: torsional pendulum ---------- */
  Sim.make('sim-torsion3d', {
    webgl: true, aspect: 0.55, camera: { th: 0.5, ph: 1.2, r: 12 },
    controls: [
      { k: 'l', label: 'Wire length l', min: 0.2, max: 1.5, step: 0.05, v: 0.8, unit: 'm' },
      { k: 'r', label: 'Wire radius r', min: 0.2, max: 1, step: 0.02, v: 0.5, unit: 'mm' },
      { k: 'n', label: 'Rigidity modulus &eta;', min: 20, max: 90, step: 1, v: 80, unit: 'GPa' },
      { k: 'R', label: 'Disc radius R (mass 2 kg)', min: 0.05, max: 0.2, step: 0.005, v: 0.1, unit: 'm' }
    ],
    reads: [{ k: 'C', label: 'Torsional constant C = &pi;&eta;r&#8308;/2l' }, { k: 'I', label: 'Moment of inertia I = &frac12;MR&sup2;' }, { k: 'T', label: 'T = 2&pi;&radic;(I/C)', big: true }],
    init: function (S) {
      var st = S.st; st.disc = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.25, 40), T.mat(0x2f5d78)); S.scene.add(st.disc);
      st.mark = new THREE.Mesh(new THREE.BoxGeometry(1, 0.27, 0.08), T.mat(0xb4441f)); S.scene.add(st.mark);
      st.wire = T.line(S.scene, 0x22262b, 2); st.stripe = T.line(S.scene, 0xb4441f, 120);
      var top = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.25, 1), T.mat(0x59606a)); top.position.set(0, 4, 0); S.scene.add(top);
      st.ref = T.line(S.scene, 0x8b9098, 2);
    },
    draw: function (S, c, W, H) {
      var st = S.st, p = S.p, Cc = PI * p.n * 1e9 * Math.pow(p.r * 1e-3, 4) / (2 * p.l), I = 0.5 * 2 * p.R * p.R, Tp = 2 * PI * Math.sqrt(I / Cc);
      var y = 3.9 - p.l * 4, th = 1.0 * Math.cos(2 * PI * S.t / Math.max(Tp, 0.3));
      var Rd = p.R * 14; st.disc.scale.set(Rd, 1, Rd); st.disc.position.set(0, y - 0.12, 0); st.disc.rotation.y = th;
      st.mark.scale.set(Rd, 1, 1); st.mark.position.set(Rd / 2 * Math.cos(-th), y - 0.12, Rd / 2 * Math.sin(-th)); st.mark.rotation.y = th;
      T.setLine(st.ref, [[0, y - 0.25, 0], [Rd * 1.3, y - 0.25, 0]]);
      T.setLine(st.wire, [[0, 3.9, 0], [0, y, 0]]);
      var pts = []; for (var i = 0; i <= 100; i++) { var s = i / 100, a = th * s; pts.push([0.05 * Math.cos(-a), 3.9 - (3.9 - y) * s, 0.05 * Math.sin(-a)]); }
      T.setLine(st.stripe, pts);
      S.set('C', f(Cc, 3) + ' N m/rad'); S.set('I', f(I, 3) + ' kg m²'); S.set('T', f(Tp, 3) + ' s' + (Tp < 0.3 ? ' (animation slowed)' : ''));
    }
  });

  /* ---------- 3D: Barton's pendulums (resonance) ---------- */
  var BL = [0.6, 0.9, 1.2, 1.5, 1.8, 2.1];
  Sim.make('sim-barton3d', {
    webgl: true, aspect: 0.55, camera: { th: 0.9, ph: 1.25, r: 13 },
    controls: [
      { k: 'Ld', label: 'Driver length (sets the driving frequency)', min: 0.6, max: 2.1, step: 0.05, v: 1.2, unit: 'm' },
      { k: 'g', label: 'Damping of the small pendulums', min: 0.05, max: 0.6, step: 0.01, v: 0.18, unit: 's⁻¹' }
    ],
    reads: [{ k: 'fd', label: 'Driving frequency' }, { k: 'win', label: 'Largest swing', big: true }],
    init: function (S) {
      var st = S.st; st.th = BL.map(function () { return 0; }); st.om = BL.map(function () { return 0; });
      var bar = T.line(S.scene, 0x22262b, 2); T.setLine(bar, [[-4, 3, 0], [4, 3, 0]]);
      st.str = BL.map(function () { return T.line(S.scene, 0x59606a, 2); }); st.bob = BL.map(function () { var b = T.sphere(0.16, 0x2f5d78); S.scene.add(b); return b; });
      st.dstr = T.line(S.scene, 0x22262b, 2); st.dbob = T.sphere(0.35, 0xb4441f); S.scene.add(st.dbob);
      onRe(S);
    },
    onChange: function (S) { onRe(S); },
    draw: function (S, c, W, H, dt) {
      var st = S.st, p = S.p, wd = Math.sqrt(9.81 / p.Ld), sc = 1.6, n = 10, best = 0, bi = 0;
      for (var s = 0; s < n; s++) { var h = dt / n; st.t2 += h; var F = 0.025 * Math.cos(wd * st.t2) * wd * wd; BL.forEach(function (L, i) { var w0 = Math.sqrt(9.81 / L), a = -w0 * w0 * st.th[i] - 2 * p.g * st.om[i] + F; st.om[i] += a * h; st.th[i] += st.om[i] * h; }); }
      BL.forEach(function (L, i) { var x = -3.5 + i * 1.4, th = st.th[i], bx = x, by = 3 - L * sc * Math.cos(th), bz = L * sc * Math.sin(th); T.setLine(st.str[i], [[x, 3, 0], [bx, by, bz]]); st.bob[i].position.set(bx, by, bz); if (Math.abs(th) > best) { best = Math.abs(th); bi = i; } st.amp[i] = Math.max(st.amp[i] * (1 - dt * 0.4), Math.abs(th)); });
      var dth = 0.25 * Math.cos(wd * st.t2), dx = 0, dy = 3 - p.Ld * sc * Math.cos(dth), dz = p.Ld * sc * Math.sin(dth);
      T.setLine(st.dstr, [[dx, 3, 0.6], [dx, dy, dz + 0.6]]); st.dbob.position.set(dx, dy, dz + 0.6);
      var mx = 0, mi = 0; st.amp.forEach(function (a, i) { if (a > mx) { mx = a; mi = i; } });
      S.set('fd', f(wd / (2 * PI), 3) + ' Hz'); S.set('win', 'pendulum of length ' + BL[mi] + ' m (driver ' + f(p.Ld, 3) + ' m)');
    }
  });
  function onRe(S) { var st = S.st; st.t2 = st.t2 || 0; st.amp = BL.map(function () { return 0; }); }

  /* ---------- 3D: two-body oscillation, reduced mass ---------- */
  Sim.make('sim-twobody3d', {
    webgl: true, aspect: 0.5, camera: { th: 0.3, ph: 1.2, r: 12 },
    controls: [
      { k: 'm1', label: 'Mass m<sub>1</sub>', min: 0.5, max: 10, step: 0.1, v: 1, unit: 'kg' },
      { k: 'm2', label: 'Mass m<sub>2</sub>', min: 0.5, max: 10, step: 0.1, v: 4, unit: 'kg' },
      { k: 'k', label: 'Spring constant k', min: 10, max: 200, step: 5, v: 50, unit: 'N/m' }
    ],
    reads: [{ k: 'mu', label: 'Reduced mass &mu; = m<sub>1</sub>m<sub>2</sub>/(m<sub>1</sub>+m<sub>2</sub>)' }, { k: 'T', label: 'T = 2&pi;&radic;(&mu;/k)', big: true }, { k: 'amp', label: 'Amplitudes m<sub>1</sub> : m<sub>2</sub> = m<sub>2</sub> : m<sub>1</sub>' }],
    init: function (S) {
      var st = S.st; st.a = T.sphere(1, 0xb4441f); st.b = T.sphere(1, 0x2f5d78); S.scene.add(st.a); S.scene.add(st.b);
      st.spr = T.line(S.scene, 0x22262b, 400); st.cm = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.4, 12), T.mat(0x3f7d3a)); st.cm.rotation.x = PI; st.cm.position.y = 1.5; S.scene.add(st.cm);
      st.lb = T.label(S.scene, 'centre of mass stays still', '#3f7d3a', 0.8); st.lb.position.y = 2.1;
      T.grid(S.scene, 12, -1.2);
    },
    draw: function (S, c, W, H) {
      var st = S.st, p = S.p, M = p.m1 + p.m2, mu = p.m1 * p.m2 / M, w = Math.sqrt(p.k / mu), r = 4 + 1.2 * Math.cos(w * S.t * 0.6), x1 = -p.m2 / M * r, x2 = p.m1 / M * r;
      var r1 = 0.25 * Math.cbrt(p.m1), r2 = 0.25 * Math.cbrt(p.m2);
      st.a.scale.setScalar(r1); st.b.scale.setScalar(r2); st.a.position.x = x1; st.b.position.x = x2;
      T.setLine(st.spr, helix([x1 + r1, 0, 0], [x2 - r2, 0, 0], 300, 0.18, 12));
      S.set('mu', f(mu, 3) + ' kg'); S.set('T', f(2 * PI / w, 3) + ' s (animation slowed)'); S.set('amp', f(p.m2 / M * 1.2, 2) + ' : ' + f(p.m1 / M * 1.2, 2) + ' (lighter mass moves more)');
    }
  });
})();
