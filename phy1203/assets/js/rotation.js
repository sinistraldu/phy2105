/* Unit 1 simulations: rotation, momentum and energy */
(function () {
  var D = Sim.D, f = Sim.fmt, C = Sim.col, PI = Math.PI;

  /* curved arrow around a point, used to show the sense of rotation or a torque */
  function turnArrow(c, x, y, r, a0, a1, color, w) {
    c.save(); c.strokeStyle = color; c.lineWidth = w || 3; c.beginPath(); c.arc(x, y, r, a0, a1, a1 < a0); c.stroke(); c.restore();
    var dir = a1 > a0 ? 1 : -1, ex = x + r * Math.cos(a1), ey = y + r * Math.sin(a1);
    var tx = -Math.sin(a1) * dir, ty = Math.cos(a1) * dir;
    D.arrow(c, ex - tx * 2, ey - ty * 2, ex + tx * 6, ey + ty * 6, color, w || 3, 11);
  }
  function bug(c, x, y, s, color) {
    D.circle(c, x, y, s, color, '#00000033', 1);
    D.line(c, x, y - s, x, y + s, '#0000004d', 1.2);
    D.circle(c, x - s * 0.4, y - s * 0.3, s * 0.18, '#111');
    D.circle(c, x + s * 0.4, y + s * 0.3, s * 0.18, '#111');
  }

  /* 1. Turntable: same omega, different v */
  Sim.make('sim-turntable', {
    aspect: 0.5, animate: true,
    controls: [
      { k: 'w', label: 'Spin rate &omega;', min: 0, max: 3, step: 0.1, v: 1, unit: 'rad/s' },
      { k: 'rB', label: 'Ladybug B distance r<sub>B</sub>', min: 0.2, max: 1, step: 0.05, v: 0.8, unit: 'm' }
    ],
    reads: [
      { k: 'wA', label: '&omega; of A and of B' },
      { k: 'vA', label: 'Speed of A (r = 0.40 m)' },
      { k: 'vB', label: 'Speed of B', big: true },
      { k: 'ratio', label: 'v<sub>B</sub> / v<sub>A</sub>' }
    ],
    init: function (S) { S.st.th = 0; },
    draw: function (S, c, W, H, dt) {
      var p = S.p, K = C(); S.st.th += p.w * dt;
      D.clear(c, W, H);
      var R = Math.min(H * 0.42, W * 0.27), cx = W * 0.32, cy = H * 0.5, sc = R / 1.0;
      D.circle(c, cx, cy, R, K.surface, K.line, 2);
      for (var i = 0; i < 12; i++) { var a = S.st.th + i * PI / 6; D.line(c, cx, cy, cx + R * Math.cos(a), cy + R * Math.sin(a), K.grid, 1); }
      D.circle(c, cx, cy, 5, K.ink);
      var rA = 0.4, rs = [[rA, K.c1, 'A'], [p.rB, K.c2, 'B']], vk = R * 0.6;
      rs.forEach(function (b, j) {
        var a = S.st.th + (j ? 0 : PI), x = cx + b[0] * sc * Math.cos(a), y = cy + b[0] * sc * Math.sin(a);
        D.line(c, cx, cy, x, y, b[1], 1.5, [4, 3]);
        var v = b[0] * p.w, tx = -Math.sin(a), ty = Math.cos(a);
        D.arrow(c, x, y, x + tx * v * vk, y + ty * v * vk, b[1], 3);
        bug(c, x, y, Math.max(7, R * 0.07), b[1]);
        D.text(c, b[2], x + 12, y - 14, { weight: 700, color: b[1], size: 14 });
      });
      // bar chart on the right
      var bx = W * 0.62, bw = W * 0.24, top = H * 0.16, bh = H * 0.3;
      D.text(c, 'Angular speed ω', bx, top - 4, { color: K.muted, size: 12, weight: 600 });
      D.text(c, 'Linear speed v = rω', bx, top + bh + 30, { color: K.muted, size: 12, weight: 600 });
      var wmax = 3, vmax = 3;
      [[p.w, K.c1], [p.w, K.c2]].forEach(function (q, j) { var bl = Math.max(2, bw * q[0] / wmax); D.rect(c, bx, top + 10 + j * 26, bl, 18, q[1], null, 4); D.text(c, (j ? 'B ' : 'A ') + f(q[0], 2) + ' rad/s', bx + bl + 6, top + 19 + j * 26, { size: 11.5, color: q[1], weight: 600 }); });
      [[rA * p.w, K.c1], [p.rB * p.w, K.c2]].forEach(function (q, j) { var y = top + bh + 44 + j * 26; var bl = Math.max(2, bw * q[0] / vmax); D.rect(c, bx, y, bl, 18, q[1], null, 4); D.text(c, (j ? 'B ' : 'A ') + f(q[0], 2) + ' m/s', bx + bl + 6, y + 9, { size: 11.5, color: q[1], weight: 600 }); });
      S.set('wA', f(p.w, 2) + ' rad/s (same)');
      S.set('vA', f(rA * p.w, 2) + ' m/s');
      S.set('vB', f(p.rB * p.w, 2) + ' m/s');
      S.set('ratio', p.w ? f(p.rB / rA, 3) + ' (= r_B / r_A)' : '–');
    }
  });

  /* 2. Spin-up with constant alpha */
  var spin = Sim.make('sim-spinup', {
    aspect: 0.48, animate: true, autoplay: false,
    controls: [
      { k: 'w0', label: 'Starting speed &omega;<sub>0</sub>', min: 0, max: 10, step: 0.5, v: 0, unit: 'rad/s' },
      { k: 'a', label: 'Angular acceleration &alpha;', min: -3, max: 5, step: 0.5, v: 2, unit: 'rad/s²' }
    ],
    buttons: [
      { k: 'start', label: 'Start', click: function (S, b) { if (S.st.done) { S.t = 0; S.st.done = false; } S.running = !S.running; b.textContent = S.running ? 'Pause' : 'Start'; } },
      { label: 'Reset', click: function (S) { S.t = 0; S.running = false; S.st.done = false; S.btn('start').textContent = 'Start'; } }
    ],
    reads: [
      { k: 't', label: 'Time t' }, { k: 'w', label: 'Angular speed &omega;', big: true },
      { k: 'th', label: 'Angle turned &theta;' }, { k: 'rev', label: 'Revolutions' }
    ],
    onChange: function (S) { S.t = 0; S.running = false; S.st.done = false; S.btn('start').textContent = 'Start'; },
    draw: function (S, c, W, H) {
      var p = S.p, K = C(), Tm = 10;
      var tStop = p.a < 0 ? p.w0 / -p.a : Infinity, tEnd = Math.min(Tm, tStop);
      if (S.t >= tEnd) { S.t = tEnd; if (S.running) { S.running = false; S.st.done = true; S.btn('start').textContent = 'Start'; } }
      var t = S.t, w = p.w0 + p.a * t, th = p.w0 * t + 0.5 * p.a * t * t;
      D.clear(c, W, H);
      var R = Math.min(H * 0.38, W * 0.2), cx = W * 0.2, cy = H * 0.52;
      D.circle(c, cx, cy, R, K.surface, K.ink, 2.5);
      for (var i = 0; i < 4; i++) { var a = -th + i * PI / 2; D.rect(c, cx + R * 0.62 * Math.cos(a) - 7, cy + R * 0.62 * Math.sin(a) - 7, 14, 14, K.c1, null, 3); }
      var a0 = -th; D.line(c, cx, cy, cx + R * Math.cos(a0), cy + R * Math.sin(a0), K.c2, 3);
      D.circle(c, cx, cy, 6, K.ink);
      D.text(c, 'rotor (top view)', cx, cy + R + 16, { align: 'center', size: 12, color: K.muted });
      var box = { x: W * 0.44, y: H * 0.1, w: W * 0.52, h: H * 0.74 };
      var pts = []; for (var s = 0; s <= tEnd + 1e-9; s += tEnd / 80) pts.push([s, p.w0 + p.a * s]);
      var past = []; for (s = 0; s <= t + 1e-9; s += Math.max(t, 0.01) / 60) past.push([s, p.w0 + p.a * s]);
      D.graph(c, box, { x0: 0, x1: Tm, y0: 0, y1: 60, xl: 'time t (s) →', yl: 'ω (rad/s)', dots: [{ x: t, y: w, color: K.c2 }] },
        [{ pts: pts, color: K.faint, w: 1.5 }, { pts: past, color: K.c2, w: 3 }]);
      for (var k = 0; k <= 10; k += 2) D.text(c, String(k), box.x + box.w * k / 10, box.y + box.h + 12, { size: 10.5, align: 'center', color: K.faint });
      [0, 20, 40, 60].forEach(function (v) { D.text(c, String(v), box.x - 5, box.y + box.h * (1 - v / 60), { size: 10.5, align: 'right', color: K.faint }); });
      S.set('t', f(t, 3) + ' s'); S.set('w', f(Math.max(0, w), 3) + ' rad/s');
      S.set('th', f(th, 3) + ' rad'); S.set('rev', f(th / (2 * PI), 3));
      S.msg(S.st.done ? (tStop <= Tm ? 'Stopped: &omega; reached zero.' : 'Reached 10 s. Press Start to run again.') : '');
    }
  });

  /* 3. Door torque */
  Sim.make('sim-door', {
    aspect: 0.5,
    controls: [
      { k: 'F', label: 'Force F', min: 0, max: 50, step: 1, v: 20, unit: 'N' },
      { k: 'r', label: 'Distance from hinge r', min: 0.05, max: 1, step: 0.05, v: 0.8, unit: 'm' },
      { k: 'ang', label: 'Angle &theta; between F and door', min: 0, max: 90, step: 5, v: 90, unit: '°' }
    ],
    reads: [{ k: 'perp', label: 'Turning part F sin&theta;' }, { k: 'tau', label: 'Torque &tau; = rF sin&theta;', big: true }],
    draw: function (S, c, W, H) {
      var p = S.p, K = C(); D.clear(c, W, H);
      var hx = W * 0.1, hy = H * 0.66, L = W * 0.72, th = p.ang * PI / 180, tau = p.r * p.F * Math.sin(th);
      D.text(c, 'top view of a door', W * 0.5, 18, { align: 'center', color: K.muted, size: 12 });
      D.rect(c, hx - 6, hy - 60, 6, 120, K.faint, null, 2);
      D.rect(c, hx, hy - 7, L, 14, K.surface, K.ink, 3, 1.5);
      D.circle(c, hx, hy, 8, K.ink); D.text(c, 'hinge', hx, hy + 26, { align: 'center', size: 12, color: K.muted });
      for (var i = 2; i <= 10; i += 2) D.text(c, (i / 10).toFixed(1) + ' m', hx + L * i / 10, hy - 18, { size: 10, align: 'center', color: K.faint });
      var px = hx + L * p.r, py = hy + 7, k = Math.min(H * 0.5, 160) / 50;
      var fx = Math.cos(th) * p.F * k, fy = -Math.sin(th) * p.F * k, fp = Math.sin(th) * p.F * k;
      if (p.F > 0) {
        D.arrow(c, px - fx, py - fy, px, py, K.ink, 3);
        D.text(c, 'F', px - fx - 12, py - fy, { weight: 700, size: 14 });
        if (fp > 2) { if (p.ang < 90) D.line(c, px - fx, py - fy, px, py - fy, K.faint, 1.2, [4, 3]); D.arrow(c, px + 14, py + fp, px + 14, py, K.c2, 3.5); D.text(c, 'F sin\u03B8', px + 22, py + fp * 0.6, { color: K.c2, weight: 700, size: 13 }); }
      }
      if (tau > 0.05) turnArrow(c, hx, hy, 30 + tau * 1.2, PI * 0.15, -PI * 0.15 - Math.min(PI * 0.9, tau / 50 * PI * 0.9), K.c1, 2 + tau / 10);
      D.text(c, tau < 0.05 ? 'no turning' : 'turns this way', hx + 20, hy - 46 - tau * 1.2, { color: K.c1, size: 12, weight: 600, bg: K.bg });
      S.set('perp', f(p.F * Math.sin(th), 3) + ' N');
      S.set('tau', f(tau, 3) + ' N·m');
    }
  });

  /* 4. Biceps lever */
  Sim.make('sim-biceps', {
    aspect: 0.52,
    controls: [
      { k: 'm', label: 'Dumbbell mass m', min: 0.5, max: 10, step: 0.5, v: 2, unit: 'kg' },
      { k: 'd', label: 'Tendon distance from elbow d', min: 2, max: 8, step: 0.5, v: 4, unit: 'cm' },
      { k: 'x', label: 'Hand distance from elbow x', min: 20, max: 35, step: 1, v: 32, unit: 'cm' }
    ],
    reads: [{ k: 'W', label: 'Weight W = mg' }, { k: 'tw', label: 'Load torque W &times; x' }, { k: 'Fb', label: 'Biceps force F = Wx/d', big: true }, { k: 'r', label: 'F / W' }],
    draw: function (S, c, W, H) {
      var p = S.p, K = C(); D.clear(c, W, H);
      var w = p.m * 9.8, Fb = w * p.x / p.d;
      var ex = W * 0.16, ey = H * 0.62, sc = (W * 0.72) / 36; // px per cm
      // upper arm and forearm
      D.rect(c, ex - 14, H * 0.08, 28, ey - H * 0.08, K.surface, K.faint, 12, 1.2);
      D.rect(c, ex, ey - 11, 36 * sc * 0.97, 22, K.surface, K.ink, 10, 1.5);
      D.circle(c, ex, ey, 10, K.ink); D.text(c, 'elbow (pivot)', ex, ey + 30, { align: 'center', size: 12, color: K.muted });
      // dumbbell
      var hx = ex + p.x * sc, dy = ey + 11 + 34, s = 10 + p.m * 1.6;
      D.line(c, hx, ey + 11, hx, dy - s / 2, K.faint, 2);
      D.rect(c, hx - s * 1.4, dy - s / 2, s * 2.8, s, K.muted, null, 4);
      // biceps muscle line
      var tx = ex + p.d * sc;
      c.save(); c.fillStyle = 'rgba(200,70,70,0.35)'; c.beginPath(); c.moveTo(ex - 6, H * 0.12); c.quadraticCurveTo(ex + 34, (H * 0.12 + ey) / 2, tx, ey - 11); c.lineTo(tx - 6, ey - 11); c.quadraticCurveTo(ex + 14, (H * 0.12 + ey) / 2, ex - 10, H * 0.14); c.fill(); c.restore();
      // force arrows (same scale for both, capped)
      var k = (H * 0.5) / Math.max(400, Fb), lenB = Fb * k, lenW = w * k;
      D.arrow(c, tx, ey - 11, tx, ey - 11 - Math.max(lenB, 6), K.pos, 4);
      D.text(c, 'F = ' + f(Fb, 3) + ' N', tx + 10, ey - 30 - Math.min(lenB, H * 0.35) * 0.6, { color: K.pos, weight: 700, size: 13, bg: K.bg });
      D.arrow(c, hx + s * 1.6, dy, hx + s * 1.6, dy + Math.max(lenW, 8), K.c1, 4);
      D.text(c, 'W = ' + f(w, 3) + ' N', hx, dy + s / 2 + Math.max(lenW, 8) + 16, { color: K.c1, weight: 700, size: 13, bg: K.bg, align: 'center' });
      // distance labels
      D.line(c, ex, ey - 30, tx, ey - 30, K.muted, 1); D.text(c, 'd', (ex + tx) / 2, ey - 40, { align: 'center', italic: true, serif: true, size: 15 });
      D.line(c, ex, ey + 50, hx, ey + 50, K.muted, 1, [3, 3]); D.text(c, 'x = ' + p.x + ' cm', (ex + hx) / 2, ey + 62, { align: 'center', size: 12, color: K.muted });
      S.set('W', f(w, 3) + ' N'); S.set('tw', f(w * p.x / 100, 3) + ' N·m');
      S.set('Fb', f(Fb, 3) + ' N'); S.set('r', f(p.x / p.d, 3) + ' times');
    }
  });

  /* 5. Same torque, different moment of inertia */
  Sim.make('sim-inertia', {
    aspect: 0.48, animate: true,
    controls: [{ k: 'rB', label: 'Rotor B: mass distance r<sub>B</sub>', min: 0.1, max: 0.3, step: 0.02, v: 0.2, unit: 'm' }],
    buttons: [{ label: 'Restart', click: function (S) { S.t = 0; S.running = true; } }],
    reads: [{ k: 'IA', label: 'I<sub>A</sub> (r = 0.10 m)' }, { k: 'IB', label: 'I<sub>B</sub>' }, { k: 'aA', label: '&alpha;<sub>A</sub> = &tau;/I<sub>A</sub>' }, { k: 'aB', label: '&alpha;<sub>B</sub> = &tau;/I<sub>B</sub>', big: true }, { k: 'w', label: '&omega; now (A, B)' }],
    onChange: function (S) { S.t = 0; S.running = true; },
    draw: function (S, c, W, H) {
      var p = S.p, K = C(), m = 0.5, tau = 0.02, Tm = 6;
      if (S.t > Tm) S.t = Tm;
      var rs = [0.1, p.rB], Is = rs.map(function (r) { return 2 * m * r * r; });
      D.clear(c, W, H);
      var sc = Math.min(W * 0.2, H * 0.4) / 0.3;
      rs.forEach(function (r, j) {
        var cx = W * (j ? 0.72 : 0.28), cy = H * 0.5, al = tau / Is[j], th = 0.5 * al * S.t * S.t;
        D.circle(c, cx, cy, 0.3 * sc, null, K.grid, 1);
        var dx = Math.cos(th) * r * sc, dy = Math.sin(th) * r * sc;
        D.line(c, cx - dx, cy - dy, cx + dx, cy + dy, K.ink, 3);
        D.circle(c, cx + dx, cy + dy, 11, j ? K.c2 : K.c1); D.circle(c, cx - dx, cy - dy, 11, j ? K.c2 : K.c1);
        D.circle(c, cx, cy, 6, K.ink);
        turnArrow(c, cx, cy, 20, PI * 0.6, PI * 1.4, K.muted, 2);
        D.text(c, (j ? 'Rotor B' : 'Rotor A') + '  ·  same torque', cx, H * 0.08, { align: 'center', weight: 600, size: 13, color: j ? K.c2 : K.c1 });
      });
      S.set('IA', f(Is[0], 3) + ' kg·m²'); S.set('IB', f(Is[1], 3) + ' kg·m²');
      S.set('aA', f(tau / Is[0], 3) + ' rad/s²'); S.set('aB', f(tau / Is[1], 3) + ' rad/s²');
      S.set('w', f(tau / Is[0] * S.t, 2) + ', ' + f(tau / Is[1] * S.t, 2) + ' rad/s');
      S.msg('I<sub>B</sub>/I<sub>A</sub> = ' + f(Is[1] / Is[0], 3) + ', so B speeds up ' + f(Is[1] / Is[0], 3) + '&times; more slowly.');
    }
  });

  /* 6. Parallel-axis theorem */
  Sim.make('sim-parallel', {
    aspect: 0.46, animate: true,
    controls: [{ k: 'd', label: 'Axis distance from centre d', min: 0, max: 0.5, step: 0.01, v: 0, unit: 'm' }],
    reads: [{ k: 'Icm', label: 'I<sub>cm</sub> = ML&sup2;/12' }, { k: 'Md2', label: 'Md&sup2;' }, { k: 'I', label: 'I = I<sub>cm</sub> + Md&sup2;', big: true }],
    draw: function (S, c, W, H) {
      var p = S.p, K = C(), M = 1, L = 1; D.clear(c, W, H);
      var sc = Math.min(W * 0.2, H * 0.42), cx = W * 0.25, cy = H * 0.5, th = S.t * 0.8;
      D.text(c, 'rod: M = 1 kg, L = 1 m', cx, 16, { align: 'center', size: 12, color: K.muted });
      D.circle(c, cx, cy, (L / 2 + p.d) * sc, null, K.grid, 1);
      var ux = Math.cos(th), uy = Math.sin(th), mx = cx - ux * p.d * sc, my = cy - uy * p.d * sc;
      D.line(c, mx - ux * sc / 2, my - uy * sc / 2, mx + ux * sc / 2, my + uy * sc / 2, K.c1, 9);
      D.circle(c, mx, my, 5, K.c2); D.circle(c, cx, cy, 7, K.ink, K.bg, 2);
      D.text(c, '\u25CF black = axis   \u25CF orange = centre of mass', cx, 34, { size: 11, color: K.muted, align: 'center' });
      var box = { x: W * 0.55, y: H * 0.1, w: W * 0.41, h: H * 0.72 }, pts = [];
      for (var d = 0; d <= 0.5001; d += 0.01) pts.push([d, M * L * L / 12 + M * d * d]);
      var I = M * L * L / 12 + M * p.d * p.d;
      D.graph(c, box, { x0: 0, x1: 0.5, y0: 0, y1: 0.36, xl: 'd (m) →', yl: 'I (kg·m²)', dots: [{ x: p.d, y: I, color: K.c2, r: 6 }], hlines: [{ y: 1 / 12, label: 'I_cm = 0.083', color: K.c1 }, { y: 1 / 3, label: 'end: ML²/3', color: K.faint }] }, [{ pts: pts, color: K.c4 }]);
      S.set('Icm', '0.0833 kg·m²'); S.set('Md2', f(M * p.d * p.d, 3) + ' kg·m²'); S.set('I', f(I, 3) + ' kg·m²');
    }
  });

  /* 7. Landing: impulse */
  Sim.make('sim-landing', {
    aspect: 0.5,
    controls: [
      { k: 'm', label: 'Body mass m', min: 40, max: 100, step: 5, v: 60, unit: 'kg' },
      { k: 'v', label: 'Landing speed v', min: 1, max: 6, step: 0.5, v: 3, unit: 'm/s' },
      { k: 'dt', label: 'Stopping time &Delta;t', min: 0.05, max: 0.5, step: 0.01, v: 0.05, unit: 's' }
    ],
    reads: [{ k: 'dp', label: 'Change in momentum &Delta;p = mv' }, { k: 'F', label: 'Average force F = &Delta;p/&Delta;t', big: true }, { k: 'bw', label: 'Force &divide; body weight' }],
    draw: function (S, c, W, H) {
      var p = S.p, K = C(); D.clear(c, W, H);
      var dp = p.m * p.v, F = dp / p.dt, bend = (p.dt - 0.05) / 0.45;
      // stick legs
      var hx = W * 0.14, gy = H * 0.86, Lg = Math.min(H * 0.34, 110), kneeA = (175 - bend * 85) * PI / 180;
      var half = kneeA / 2, hipY = gy - 2 * Lg * Math.sin(half), kneeX = hx + Lg * Math.cos(half);
      D.line(c, hx - 40, gy, hx + 60, gy, K.faint, 2);
      D.line(c, hx, gy, kneeX, (gy + hipY) / 2, K.ink, 5); D.line(c, kneeX, (gy + hipY) / 2, hx, hipY, K.ink, 5);
      D.line(c, hx, hipY, hx, hipY - Lg * 0.9, K.ink, 5); D.circle(c, hx, hipY - Lg * 0.9 - 16, 14, K.surface, K.ink, 3);
      D.text(c, bend < 0.2 ? 'stiff legs' : bend < 0.6 ? 'some knee bend' : 'deep knee bend', hx + 10, gy + 16, { align: 'center', size: 12, color: K.muted });
      // force-time graph with fixed axes
      var box = { x: W * 0.36, y: H * 0.08, w: W * 0.6, h: H * 0.76 }, Fmax = 6000, Fc = Math.min(F, Fmax);
      var g = D.graph(c, box, { x0: 0, x1: 0.55, y0: 0, y1: Fmax, xl: 'time (s) →', yl: 'force (N)', hlines: [{ y: p.m * 9.8, label: 'body weight', color: K.c3 }] }, []);
      D.rect(c, g.px(0.02), g.py(Fc), g.px(0.02 + p.dt) - g.px(0.02), g.py(0) - g.py(Fc), 'rgba(194,65,12,0.28)', K.c2, 0, 2);
      D.text(c, 'area = FΔt = ' + f(dp, 3) + ' N·s', g.px(0.02) + 6, Math.max(box.y + 30, g.py(Fc) - 12), { size: 12, color: K.c2, weight: 700 });
      if (F > Fmax) D.text(c, '↑ off the scale (' + f(F, 3) + ' N)', g.px(0.02) + 6, box.y + 12, { size: 12, color: K.pos, weight: 700 });
      [0, 2000, 4000, 6000].forEach(function (v) { D.text(c, String(v), box.x - 5, g.py(v), { size: 10, align: 'right', color: K.faint }); });
      [0, 0.1, 0.2, 0.3, 0.4, 0.5].forEach(function (v) { D.text(c, String(v), g.px(v), box.y + box.h + 12, { size: 10, align: 'center', color: K.faint }); });
      S.set('dp', f(dp, 3) + ' kg·m/s'); S.set('F', f(F, 3) + ' N'); S.set('bw', f(F / (p.m * 9.8), 3) + ' ×');
    }
  });

  /* 8. Spinning diver: conservation of angular momentum */
  Sim.make('sim-skater', {
    aspect: 0.5, animate: true,
    controls: [{ k: 's', label: 'Arms: in &larr; &rarr; out', min: 0, max: 1, step: 0.01, v: 1, show: function (v) { return Math.round(v * 100) + '% out'; } }],
    reads: [{ k: 'I', label: 'Moment of inertia I' }, { k: 'w', label: 'Spin rate &omega;', big: true }, { k: 'L', label: 'Angular momentum L = I&omega;' }, { k: 'K', label: 'Kinetic energy &frac12;I&omega;&sup2;' }],
    init: function (S) { S.st.th = 0; S.st.trail = []; },
    draw: function (S, c, W, H, dt) {
      var p = S.p, K = C(), I = 1.6 + 2.4 * p.s, L = 4.0 * 1.5, f1 = L / I; // rev/s
      S.st.th += 2 * PI * f1 * dt * 0.25; // shown 4x slower
      D.clear(c, W, H);
      var cx = W * 0.3, cy = H * 0.52, R = Math.min(H * 0.42, W * 0.25), ra = R * (0.35 + 0.65 * p.s);
      D.circle(c, cx, cy, R, null, K.grid, 1);
      var hands = [0, PI].map(function (o) { return [cx + ra * Math.cos(S.st.th + o), cy + ra * Math.sin(S.st.th + o)]; });
      S.st.trail.push(hands); if (S.st.trail.length > 16) S.st.trail.shift();
      S.st.trail.forEach(function (h, i) { h.forEach(function (q) { D.circle(c, q[0], q[1], 3, 'rgba(47,102,144,' + (i / 40) + ')'); }); });
      hands.forEach(function (q) { D.line(c, cx, cy, q[0], q[1], K.ink, 7); D.circle(c, q[0], q[1], 9, K.c2); });
      D.circle(c, cx, cy, R * 0.22, K.c1); D.circle(c, cx + R * 0.1 * Math.cos(S.st.th + PI / 2), cy + R * 0.1 * Math.sin(S.st.th + PI / 2), 5, '#fff');
      D.text(c, 'top view (shown 4× slower)', cx, H - 12, { align: 'center', size: 11.5, color: K.muted });
      // bars
      var bx = W * 0.62, bw = W * 0.33;
      [['I', I / 4.0, K.c1, f(I, 3) + ' kg·m²'], ['ω', f1 / 3.75, K.c2, f(f1, 3) + ' rev/s'], ['L = Iω', 1, K.c3, 'constant']].forEach(function (b, j) {
        var y = H * 0.14 + j * H * 0.24;
        D.text(c, b[0], bx, y, { size: 13, weight: 700, color: b[2] });
        D.rect(c, bx, y + 10, bw, 18, K.surface, null, 4);
        D.rect(c, bx, y + 10, bw * b[1], 18, b[2], null, 4);
        D.text(c, b[3], bx + bw, y, { size: 12, align: 'right', color: K.muted });
      });
      var w = 2 * PI * f1;
      S.set('I', f(I, 3) + ' kg·m²'); S.set('w', f(f1, 3) + ' rev/s'); S.set('L', f(I * w, 3) + ' kg·m²/s'); S.set('K', f(0.5 * I * w * w, 3) + ' J');
    }
  });

  /* 9. Centrifuge */
  function freshTube(S) {
    var n = 140, arr = [];
    for (var i = 0; i < n; i++) arr.push({ y: Math.random(), x: Math.random() });
    arr.sort(function (a, b) { return b.y - a.y; });
    arr.forEach(function (q, i) { q.target = 1 - (i + 0.5) / n * 0.45; q.y0 = q.y; q.y = q.y * 0.97; }); // y: 0 top .. 1 bottom
    S.st.cells = arr; S.st.time = 0;
  }
  Sim.make('sim-centrifuge', {
    aspect: 0.5, animate: true,
    controls: [
      { k: 'rpm', label: 'Speed', min: 0, max: 15000, step: 250, v: 3000, unit: 'rpm', show: function (v) { return Math.round(v).toLocaleString('en-US') + ' rpm'; } },
      { k: 'r', label: 'Tube distance from axis r', min: 5, max: 15, step: 0.5, v: 10, unit: 'cm' }
    ],
    buttons: [{ label: 'Fresh sample', click: function (S) { freshTube(S); } }],
    reads: [{ k: 'w', label: '&omega; = rpm &times; 2&pi;/60' }, { k: 'a', label: 'Acceleration &omega;&sup2;r' }, { k: 'rcf', label: 'RCF = &omega;&sup2;r/g', big: true }, { k: 'tm', label: 'Time spinning' }],
    init: freshTube,
    draw: function (S, c, W, H, dt) {
      var p = S.p, K = C(), w = p.rpm * 2 * PI / 60, acc = w * w * p.r / 100, rcf = acc / 9.8;
      S.st.th = (S.st.th || 0) + Math.min(w, 40) * dt * 0.5;
      if (p.rpm > 0) S.st.time += dt;
      D.clear(c, W, H);
      var cx = W * 0.25, cy = H * 0.5, R = Math.min(H * 0.42, W * 0.22);
      D.circle(c, cx, cy, R, K.surface, K.ink, 2);
      for (var i = 0; i < 6; i++) { var a = S.st.th + i * PI / 3, rr = R * (0.35 + 0.6 * (p.r - 5) / 10); D.rect(c, cx + rr * Math.cos(a) - 7, cy + rr * Math.sin(a) - 7, 14, 14, i ? K.faint : K.pos, null, 7); }
      D.circle(c, cx, cy, 6, K.ink);
      D.text(c, 'rotor (top view)', cx, cy + R + 14, { align: 'center', size: 12, color: K.muted });
      // tube, bottom = far from axis
      var tx = W * 0.62, tw = W * 0.12, ty = H * 0.1, th = H * 0.76;
      D.rect(c, tx, ty, tw, th, 'rgba(240,200,90,0.35)', K.ink, 14, 2);
      var speed = 0.0009 * rcf; // fraction of tube per second
      S.st.cells.forEach(function (q) {
        if (q.y < q.target) q.y = Math.min(q.target, q.y + speed * dt * (0.8 + 0.4 * q.x));
        D.circle(c, tx + 7 + q.x * (tw - 14), ty + 6 + q.y * (th - 12), 3.2, K.pos);
      });
      D.text(c, 'outer end of tube', tx + tw + 8, ty + th - 8, { size: 11.5, color: K.muted });
      D.text(c, 'plasma', tx + tw + 8, ty + 18, { size: 11.5, color: K.c5, weight: 600 });
      D.text(c, 'red cells', tx + tw + 8, ty + th * 0.78, { size: 11.5, color: K.pos, weight: 600 });
      S.set('w', f(w, 3) + ' rad/s'); S.set('a', f(acc, 3) + ' m/s²'); S.set('rcf', f(rcf, 3) + ' × g'); S.set('tm', S.st.time.toFixed(1) + ' s');
      S.msg(p.rpm === 0 ? 'At rest only gravity (1 g) acts: cells take hours to settle.' : '');
    }
  });
})();

/* 3D: spinning wheel and its angular momentum vector */
(function () {
  var T = Sim.T3, f = Sim.fmt;
  Sim.make('sim-wheel3d', {
    webgl: true, aspect: 0.55, animate: true, camera: { th: 0.7, ph: 1.15, r: 6, target: [0, 0.6, 0] },
    controls: [{ k: 'w', label: 'Spin rate &omega; (sign = direction)', min: -10, max: 10, step: 0.5, v: 4, unit: 'rad/s' }],
    buttons: [
      { label: 'Solid disc', group: 's', on: true, click: function (S) { S.st.ring = false; } },
      { label: 'Ring (same mass)', group: 's', click: function (S) { S.st.ring = true; } }
    ],
    reads: [{ k: 'I', label: 'I (M = 2 kg, R = 0.3 m)' }, { k: 'L', label: 'L = I&omega;', big: true }, { k: 'K', label: 'K = &frac12;I&omega;&sup2;' }, { k: 'dir', label: 'L points' }],
    init: function (S) {
      var sc = S.scene, g = new THREE.Group(); sc.add(g); S.st.g = g; S.st.ring = false; S.st.th = 0;
      S.st.disc = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 0.18, 48), T.mat(0x2d6a3e));
      S.st.torus = new THREE.Mesh(new THREE.TorusGeometry(1.42, 0.12, 16, 60), T.mat(0x2d6a3e)); S.st.torus.rotation.x = Math.PI / 2;
      for (var i = 0; i < 6; i++) { var sp = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.05, 0.05), T.mat(0xc2410c)); sp.position.set(0.7 * Math.cos(i * Math.PI / 3), 0, 0.7 * Math.sin(i * Math.PI / 3)); sp.rotation.y = -i * Math.PI / 3; S.st.torus.add(sp); sp.rotation.x = -Math.PI / 2; }
      var mark = T.sphere(0.12, 0xc2410c); mark.position.set(1.25, 0.12, 0); S.st.mark = mark;
      g.add(S.st.disc); g.add(S.st.torus); g.add(mark);
      var axle = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.2, 12), T.mat(0x888888)); sc.add(axle);
      S.st.Larrow = T.arrow(sc, '#7c3aed'); S.st.lab = T.label(sc, 'L', '#7c3aed', 0.9);
      T.grid(sc, 6, -0.8);
    },
    draw: function (S, c, W, H, dt) {
      var p = S.p, ring = S.st.ring, I = ring ? 2 * 0.09 : 0.5 * 2 * 0.09, L = I * p.w;
      S.st.disc.visible = !ring; S.st.torus.visible = ring;
      S.st.th += p.w * dt * 0.4; S.st.g.rotation.y = S.st.th;
      T.setArrow(S.st.Larrow, [0, 0.1, 0], [0, L * 2.2, 0], 0.35);
      S.st.lab.position.set(0.35, 0.1 + L * 2.2 + (L >= 0 ? 0.3 : -0.3), 0); S.st.lab.visible = Math.abs(L) > 0.01;
      S.set('I', f(I, 3) + ' kg·m²'); S.set('L', f(L, 3) + ' kg·m²/s'); S.set('K', f(0.5 * I * p.w * p.w, 3) + ' J');
      S.set('dir', p.w > 0 ? 'up (anticlockwise seen from above)' : p.w < 0 ? 'down (clockwise from above)' : 'nowhere (L = 0)');
    }
  });
})();
