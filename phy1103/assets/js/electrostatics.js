/* PHY1103 Unit 1: electrostatics simulations (2D and 3D) */
(function () {
  var D = Sim.D, f = Sim.fmt, C = Sim.col, PI = Math.PI, T = Sim.T3, clamp = Sim.clamp, k = 8.99e9, e0 = 8.85e-12;
  function charge(c, x, y, q, r) {
    var K = C(); r = r || 14;
    D.circle(c, x, y, r, q > 0 ? K.pos : q < 0 ? K.neg : K.faint, '#00000040', 1);
    D.text(c, q > 0 ? '+' : q < 0 ? '−' : '0', x, y + 1, { align: 'center', size: r * 1.2, weight: 700, color: '#fff' });
  }

  /* ---------- 2D: superposition of Coulomb forces ---------- */
  Sim.make('sim-coulomb3', {
    aspect: 0.55,
    controls: [
      { k: 'q1', label: 'q<sub>1</sub>', min: -5, max: 5, step: 0.5, v: 3, unit: 'µC' },
      { k: 'q2', label: 'q<sub>2</sub>', min: -5, max: 5, step: 0.5, v: -2, unit: 'µC' },
      { k: 'q3', label: 'q<sub>3</sub>', min: -5, max: 5, step: 0.5, v: 1, unit: 'µC' }
    ],
    reads: [{ k: 'F', label: 'Net force on q<sub>0</sub> = +1 &micro;C', big: true }, { k: 'Fx', label: 'F<sub>x</sub>, F<sub>y</sub>' }, { k: 'ang', label: 'Direction' }],
    init: function (S) { S.st.p = [[-0.5, -0.2], [0.5, -0.25], [0, 0.35], [0.05, -0.02]]; S.st.drag = -1; },
    pointer: function (S, type, x, y) {
      var sc = Math.min(S.W / 2.2, S.H / 1.1), wx = (x - S.W / 2) / sc, wy = -(y - S.H / 2) / sc;
      if (type === 'down') { S.st.drag = -1; S.st.p.forEach(function (q, i) { if (Math.hypot(q[0] - wx, q[1] - wy) < 0.07) S.st.drag = i; }); }
      if (S.st.drag >= 0) S.st.p[S.st.drag] = [clamp(wx, -1, 1), clamp(wy, -0.48, 0.48)];
    },
    draw: function (S, c, W, H) {
      var p = S.p, K = C(), sc = Math.min(W / 2.2, H / 1.1), X = function (x) { return W / 2 + x * sc; }, Y = function (y) { return H / 2 - y * sc; };
      D.clear(c, W, H);
      for (var g = -1; g <= 1.001; g += 0.25) { D.line(c, X(g), 0, X(g), H, K.grid, 1); }
      for (g = -0.5; g <= 0.501; g += 0.25) D.line(c, 0, Y(g), W, Y(g), K.grid, 1);
      var qs = [p.q1, p.q2, p.q3], t = S.st.p[3], Fx = 0, Fy = 0, sca = function (F) { return Math.min(W * 0.3, 70 * Math.sqrt(F)); };
      qs.forEach(function (q, i) {
        var s = S.st.p[i], dx = t[0] - s[0], dy = t[1] - s[1], r = Math.max(0.03, Math.hypot(dx, dy)), F = k * q * 1e-6 * 1e-6 / (r * r);
        var fx = F * dx / r, fy = F * dy / r; Fx += fx; Fy += fy;
        if (q !== 0) { var L = sca(Math.abs(F)); D.arrow(c, X(t[0]), Y(t[1]), X(t[0]) + fx / Math.abs(F) * L, Y(t[1]) - fy / Math.abs(F) * L, [K.c2, K.c4, K.c5][i], 2, 9); }
        charge(c, X(s[0]), Y(s[1]), q, 15); D.text(c, 'q' + (i + 1), X(s[0]) + 18, Y(s[1]) - 16, { size: 12, weight: 700, color: [K.c2, K.c4, K.c5][i] });
      });
      var Fn = Math.hypot(Fx, Fy);
      if (Fn > 1e-9) { var Ln = sca(Fn); D.arrow(c, X(t[0]), Y(t[1]), X(t[0]) + Fx / Fn * Ln, Y(t[1]) - Fy / Fn * Ln, K.ink, 4.5); D.line(c, X(t[0]), Y(t[1]), X(t[0]) + Fx / Fn * Ln, Y(t[1]), K.faint, 1.2, [4, 3]); D.line(c, X(t[0]) + Fx / Fn * Ln, Y(t[1]), X(t[0]) + Fx / Fn * Ln, Y(t[1]) - Fy / Fn * Ln, K.faint, 1.2, [4, 3]); }
      D.circle(c, X(t[0]), Y(t[1]), 11, K.c3, '#00000040', 1); D.text(c, 'q₀', X(t[0]), Y(t[1]) + 1, { align: 'center', size: 11, weight: 700, color: '#fff' });
      D.text(c, 'grid: 25 cm  ·  drag any charge', 10, H - 12, { size: 11, color: K.muted });
      S.set('F', f(Fn, 3) + ' N'); S.set('Fx', f(Fx, 3) + ', ' + f(Fy, 3) + ' N'); S.set('ang', Fn > 1e-9 ? f(Math.atan2(Fy, Fx) * 180 / PI, 3) + '° from +x' : '–');
    }
  });

  /* ---------- 2D: field lines and equipotentials ---------- */
  var presets = { 'Single charge': [[0, 0, 1]], 'Dipole': [[-0.35, 0, 1], [0.35, 0, -1]], 'Two like charges': [[-0.35, 0, 1], [0.35, 0, 1]], 'Unequal pair': [[-0.35, 0, 2], [0.35, 0, -1]] };
  function Ef(qs, x, y) { var ex = 0, ey = 0; qs.forEach(function (q) { var dx = x - q[0], dy = y - q[1], r2 = dx * dx + dy * dy + 1e-6, r3 = r2 * Math.sqrt(r2); ex += q[2] * dx / r3; ey += q[2] * dy / r3; }); return [ex, ey]; }
  Sim.make('sim-fieldlines', {
    aspect: 0.52,
    controls: [{ k: 'q2', label: 'Size of charge 2 (multiplier)', min: -3, max: 3, step: 0.5, v: -1 }],
    buttons: Object.keys(presets).map(function (n, i) { return { label: n, group: 'p', on: i === 1, click: function (S) { S.st.qs = presets[n].map(function (q) { return q.slice(); }); if (S.st.qs[1]) S.setControl('q2', S.st.qs[1][2]); } }; })
      .concat([{ k: 'eqp', label: 'Equipotentials', click: function (S, b) { S.st.eqp = !S.st.eqp; b.classList.toggle('on', S.st.eqp); } }]),
    reads: [{ k: 'n', label: 'Charges' }, { k: 'tip', label: 'Tip' }],
    init: function (S) { S.st.qs = presets.Dipole.map(function (q) { return q.slice(); }); S.st.eqp = false; },
    onChange: function (S) { if (S.st.qs[1]) S.st.qs[1][2] = S.p.q2; },
    pointer: function (S, type, x, y) {
      var sc = Math.min(S.W, S.H * 2) / 2, wx = (x - S.W / 2) / sc, wy = (y - S.H / 2) / sc;
      if (type === 'down') { S.st.drag = null; S.st.qs.forEach(function (q, i) { if (Math.hypot(q[0] - wx, q[1] - wy) < 0.08) S.st.drag = i; }); }
      if (S.st.drag !== null && S.st.drag !== undefined) { var q = S.st.qs[S.st.drag]; q[0] = clamp(wx, -0.95, 0.95); q[1] = clamp(wy, -0.45, 0.45); }
    },
    draw: function (S, c, W, H) {
      var K = C(), sc = Math.min(W, H * 2) / 2, qs = S.st.qs, tx = function (x) { return W / 2 + x * sc; }, ty = function (y) { return H / 2 + y * sc; };
      D.clear(c, W, H);
      if (S.st.eqp) {
        var cell = 4;
        for (var px = 0; px < W; px += cell) for (var py = 0; py < H; py += cell) {
          var wx = (px - W / 2) / sc, wy = (py - H / 2) / sc, V = 0;
          qs.forEach(function (q) { V += q[2] / Math.max(0.02, Math.hypot(wx - q[0], wy - q[1])); });
          var lv = V * 1.6, fr = lv - Math.floor(lv);
          if (fr < 0.09 || fr > 0.91) { c.fillStyle = V > 0 ? 'rgba(198,40,40,0.75)' : 'rgba(29,78,216,0.75)'; c.fillRect(px, py, cell, cell); }
        }
      }
      var src = qs.filter(function (q) { return q[2] > 0; }), dir = 1; if (!src.length) { src = qs.filter(function (q) { return q[2] !== 0; }); dir = -1; }
      src.forEach(function (q) {
        var n = Math.round(10 + 5 * Math.abs(q[2]));
        for (var i = 0; i < n; i++) {
          var a = 2 * PI * i / n + 0.1, x = q[0] + 0.03 * Math.cos(a), y = q[1] + 0.03 * Math.sin(a), pts = [[tx(x), ty(y)]];
          for (var s = 0; s < 500; s++) {
            var e = Ef(qs, x, y), m = Math.hypot(e[0], e[1]); if (m === 0) break;
            x += dir * e[0] / m * 0.008; y += dir * e[1] / m * 0.008; pts.push([tx(x), ty(y)]);
            if (Math.abs(x) > 1.3 || Math.abs(y) > 0.8 || qs.some(function (o) { return o !== q && o[2] !== 0 && Math.hypot(o[0] - x, o[1] - y) < 0.025; })) break;
          }
          D.poly(c, pts, K.muted, 1.4);
          var mI = Math.floor(pts.length * 0.35); if (pts.length > 12 && mI > 1) { var p0 = pts[mI - 1], p1 = pts[mI], ddx = (p1[0] - p0[0]) * dir, ddy = (p1[1] - p0[1]) * dir, L = Math.hypot(ddx, ddy) || 1; D.arrow(c, p1[0] - ddx / L * 8, p1[1] - ddy / L * 8, p1[0], p1[1], K.muted, 1.4, 8); }
        }
      });
      qs.forEach(function (q) { charge(c, tx(q[0]), ty(q[1]), q[2], 10 + 3 * Math.abs(q[2])); });
      if (S.st.eqp) D.text(c, 'coloured curves = equipotentials (red: high V, blue: low V)', W / 2, H - 12, { align: 'center', size: 11.5, color: K.ink, bg: K.bg });
      S.set('n', qs.map(function (q) { return (q[2] > 0 ? '+' : '') + q[2]; }).join(', ')); S.set('tip', 'drag a charge');
    }
  });

  /* ---------- 2D: Gauss's law, E(r) ---------- */
  var shapes = ['Point charge', 'Conducting sphere', 'Insulating sphere', 'Infinite line', 'Infinite sheet'];
  Sim.make('sim-gauss', {
    aspect: 0.48,
    controls: [
      { k: 'Q', label: 'Charge Q (or &lambda; in nC/m, &sigma; in nC/m&sup2;)', min: 1, max: 10, step: 0.5, v: 5, unit: 'nC' },
      { k: 'R', label: 'Object radius R', min: 2, max: 10, step: 0.5, v: 5, unit: 'cm' },
      { k: 'r', label: 'Gaussian surface radius r', min: 0.5, max: 20, step: 0.25, v: 8, unit: 'cm' }
    ],
    buttons: shapes.map(function (n, i) { return { label: n, group: 's', on: i === 2, click: function (S) { S.st.s = i; } }; }),
    reads: [{ k: 'qe', label: 'Charge enclosed q<sub>enc</sub>' }, { k: 'E', label: 'E at r', big: true }, { k: 'phi', label: 'Flux &Phi; = q<sub>enc</sub>/&epsilon;<sub>0</sub>' }],
    init: function (S) { S.st.s = 2; },
    draw: function (S, c, W, H) {
      var p = S.p, K = C(), s = S.st.s, Q = p.Q * 1e-9, R = p.R / 100;
      var Efn = function (rc) {
        var r = rc / 100;
        if (s === 0) return k * Q / (r * r);
        if (s === 1) return r < R ? 0 : k * Q / (r * r);
        if (s === 2) return r < R ? k * Q * r / (R * R * R) : k * Q / (r * r);
        if (s === 3) return Q / (2 * PI * e0 * r);
        return Q / (2 * e0);
      };
      var qenc = s === 1 ? (p.r / 100 < R ? 0 : Q) : s === 2 ? (p.r / 100 < R ? Q * Math.pow(p.r / 100 / R, 3) : Q) : s === 3 ? Q * 1 : s === 4 ? Q * PI * Math.pow(p.r / 100, 2) : Q;
      D.clear(c, W, H);
      // left: picture
      var cx = W * 0.22, cy = H * 0.5, sc = Math.min(W * 0.2, H * 0.45) / 20;
      if (s === 4) {
        D.rect(c, cx - 6, H * 0.06, 12, H * 0.88, 'rgba(198,40,40,0.35)', K.pos, 2, 1);
        D.rect(c, cx - p.r * sc, cy - 22, 2 * p.r * sc, 44, null, K.c1, 4, 2); D.text(c, 'pillbox', cx, cy + 36, { align: 'center', size: 11, color: K.c1 });
        for (var j = -3; j <= 3; j++) { D.arrow(c, cx + 8, cy + j * 22, cx + 8 + 40, cy + j * 22, K.c3, 2, 7); D.arrow(c, cx - 8, cy + j * 22, cx - 48, cy + j * 22, K.c3, 2, 7); }
      } else {
        if (s === 3) { D.circle(c, cx, cy, 6, K.pos); D.text(c, 'line seen end-on', cx, cy + p.r * sc + 16, { align: 'center', size: 11, color: K.muted }); }
        else if (s === 0) D.circle(c, cx, cy, 6, K.pos);
        else D.circle(c, cx, cy, p.R * sc, s === 1 ? 'rgba(160,160,160,0.5)' : 'rgba(198,40,40,0.25)', K.pos, 1.5);
        c.save(); c.setLineDash([6, 4]); D.circle(c, cx, cy, p.r * sc, null, K.c1, 2.2); c.restore();
        for (var a = 0; a < 12; a++) { var ang = a * PI / 6, e = Efn(p.r), L = e > 0 ? 18 : 0; D.arrow(c, cx + p.r * sc * Math.cos(ang), cy + p.r * sc * Math.sin(ang), cx + (p.r * sc + L) * Math.cos(ang), cy + (p.r * sc + L) * Math.sin(ang), K.c3, 2, 7); }
      }
      D.text(c, shapes[s], cx, 14, { align: 'center', size: 12.5, weight: 700 });
      // right: graph
      var box = { x: W * 0.47, y: H * 0.08, w: W * 0.49, h: H * 0.76 }, pts = [], Emax = 0;
      for (var rr = 0.3; rr <= 20; rr += 0.1) Emax = Math.max(Emax, Math.min(Efn(rr), Efn(2.5) * 3));
      for (rr = 0.3; rr <= 20; rr += 0.1) pts.push([rr, Math.min(Efn(rr), Emax * 1.1)]);
      var g = D.graph(c, box, { x0: 0, x1: 20, y0: 0, y1: Emax * 1.1, xl: 'r (cm) →', yl: 'E (N/C)', vlines: s === 1 || s === 2 ? [{ x: p.R, label: 'R', color: K.faint }] : [], dots: [{ x: p.r, y: Math.min(Efn(p.r), Emax * 1.1), color: K.c2, r: 6 }] }, [{ pts: pts, color: K.c1, w: 3 }]);
      [0, 5, 10, 15, 20].forEach(function (u) { D.text(c, String(u), g.px(u), box.y + box.h + 12, { size: 10, align: 'center', color: K.faint }); });
      S.set('qe', f(qenc * 1e9, 3) + (s === 3 ? ' nC (per metre)' : ' nC')); S.set('E', f(Efn(p.r), 3) + ' N/C'); S.set('phi', f(qenc / e0, 3) + ' N·m²/C');
    }
  });

  /* ---------- 2D: V(x) and E = -dV/dx ---------- */
  var arr = { 'Point charge': [[0, 1]], 'Dipole': [[-0.5, 1], [0.5, -1]], 'Two like charges': [[-0.6, 1], [0.6, 1]], 'Ring (on its axis)': 'ring' };
  Sim.make('sim-vgraph', {
    aspect: 0.6, maxH: 500,
    controls: [{ k: 'x', label: 'Probe position x', min: -2, max: 2, step: 0.01, v: 1 }, { k: 'R', label: 'Ring radius R (ring only)', min: 0.2, max: 1.5, step: 0.05, v: 0.6 }],
    buttons: Object.keys(arr).map(function (n, i) { return { label: n, group: 'a', on: i === 1, click: function (S) { S.st.a = n; } }; }),
    reads: [{ k: 'V', label: 'V(x) (units of kq/m)' }, { k: 's', label: 'Slope dV/dx' }, { k: 'E', label: 'E<sub>x</sub> = &minus;dV/dx', big: true }],
    init: function (S) { S.st.a = 'Dipole'; },
    draw: function (S, c, W, H) {
      var K = C(), a = arr[S.st.a], R = S.p.R;
      var V = function (x) { if (a === 'ring') return 1 / Math.sqrt(x * x + R * R); var v = 0; a.forEach(function (q) { v += q[1] / Math.max(0.06, Math.abs(x - q[0])); }); return v; };
      var dV = function (x) { return (V(x + 1e-4) - V(x - 1e-4)) / 2e-4; };
      D.clear(c, W, H);
      var vmax = 6, b1 = { x: W * 0.08, y: H * 0.05, w: W * 0.88, h: H * 0.42 }, b2 = { x: W * 0.08, y: H * 0.54, w: W * 0.88, h: H * 0.38 }, p1 = [], p2 = [];
      for (var x = -2; x <= 2.0001; x += 0.005) { p1.push([x, clamp(V(x), -vmax, vmax)]); p2.push([x, clamp(-dV(x), -vmax * 3, vmax * 3)]); }
      var g1 = D.graph(c, b1, { x0: -2, x1: 2, y0: -vmax, y1: vmax, yl: 'V(x)' }, [{ pts: p1, color: K.c1, w: 3 }]);
      var g2 = D.graph(c, b2, { x0: -2, x1: 2, y0: -vmax * 3, y1: vmax * 3, xl: 'x (m) →', yl: 'Eₓ = −dV/dx' }, [{ pts: p2, color: K.c2, w: 3 }]);
      var xp = S.p.x, vp = V(xp), sl = dV(xp);
      if (Math.abs(vp) < vmax) { var dx = 0.35; D.line(c, g1.px(xp - dx), g1.py(clamp(vp - sl * dx, -vmax * 2, vmax * 2)), g1.px(xp + dx), g1.py(clamp(vp + sl * dx, -vmax * 2, vmax * 2)), K.c4, 2.5); D.circle(c, g1.px(xp), g1.py(vp), 6, K.c4); }
      if (Math.abs(sl) < vmax * 3) D.circle(c, g2.px(xp), g2.py(-sl), 6, K.c2);
      var Ex = -sl; if (Math.abs(Ex) > 0.02) D.arrow(c, g2.px(xp), b2.y + 14, g2.px(xp) + clamp(Ex * 12, -80, 80), b2.y + 14, K.c3, 3, 9);
      if (a !== 'ring') a.forEach(function (q) { D.text(c, q[1] > 0 ? '+' : '−', g1.px(q[0]), b1.y + b1.h + 9, { align: 'center', weight: 700, size: 16, color: q[1] > 0 ? K.pos : K.neg }); });
      S.set('V', f(vp, 3)); S.set('s', f(sl, 3)); S.set('E', f(Ex, 3) + (Math.abs(Ex) < 1e-3 ? ' (E = 0 here)' : Ex > 0 ? ' (points +x)' : ' (points −x)'));
    }
  });

  /* ---------- 2D: capacitor network ---------- */
  Sim.make('sim-caps', {
    aspect: 0.42,
    controls: [
      { k: 'C1', label: 'C<sub>1</sub>', min: 1, max: 10, step: 0.5, v: 2, unit: 'µF' },
      { k: 'C2', label: 'C<sub>2</sub>', min: 1, max: 10, step: 0.5, v: 3, unit: 'µF' },
      { k: 'C3', label: 'C<sub>3</sub>', min: 1, max: 10, step: 0.5, v: 6, unit: 'µF' },
      { k: 'V', label: 'Battery V', min: 1, max: 24, step: 1, v: 12, unit: 'V' }
    ],
    buttons: [{ label: 'All series', group: 'm', on: true, click: function (S) { S.st.m = 0; } }, { label: 'All parallel', group: 'm', click: function (S) { S.st.m = 1; } }, { label: '(C1 series C2) parallel C3', group: 'm', click: function (S) { S.st.m = 2; } }],
    reads: [{ k: 'Ceq', label: 'C<sub>eq</sub>', big: true }, { k: 'r1', label: 'C<sub>1</sub>: Q, V' }, { k: 'r2', label: 'C<sub>2</sub>: Q, V' }, { k: 'r3', label: 'C<sub>3</sub>: Q, V' }, { k: 'U', label: 'Total energy &frac12;C<sub>eq</sub>V&sup2;' }],
    init: function (S) { S.st.m = 0; },
    draw: function (S, c, W, H) {
      var p = S.p, K = C(), m = S.st.m, Cs = [p.C1, p.C2, p.C3], Q = [], Vv = [], Ceq;
      if (m === 0) { Ceq = 1 / (1 / p.C1 + 1 / p.C2 + 1 / p.C3); var q = Ceq * p.V; Q = [q, q, q]; Vv = Cs.map(function (x) { return q / x; }); }
      else if (m === 1) { Ceq = p.C1 + p.C2 + p.C3; Vv = [p.V, p.V, p.V]; Q = Cs.map(function (x) { return x * p.V; }); }
      else { var c12 = 1 / (1 / p.C1 + 1 / p.C2); Ceq = c12 + p.C3; var q12 = c12 * p.V; Q = [q12, q12, p.C3 * p.V]; Vv = [q12 / p.C1, q12 / p.C2, p.V]; }
      D.clear(c, W, H);
      var bx = W * 0.06, bw = W * 0.88, top = H * 0.12;
      Cs.forEach(function (cv, i) {
        var y = top + i * H * 0.28;
        D.text(c, 'C' + (i + 1) + ' = ' + cv + ' µF', bx, y, { size: 13, weight: 700, color: [K.c1, K.c2, K.c3][i] });
        D.text(c, 'Q = ' + f(Q[i], 3) + ' µC   V = ' + f(Vv[i], 3) + ' V   U = ' + f(0.5 * Q[i] * Vv[i], 3) + ' µJ', bx + 120, y, { size: 12.5, color: K.ink });
        D.rect(c, bx, y + 12, bw, 10, K.surface, null, 3); D.rect(c, bx, y + 12, bw * Math.min(1, Q[i] / (10 * 24)), 10, [K.c1, K.c2, K.c3][i], null, 3);
        D.rect(c, bx, y + 26, bw, 8, K.surface, null, 3); D.rect(c, bx, y + 26, bw * Math.min(1, Vv[i] / 24), 8, K.c4, null, 3);
      });
      D.text(c, 'upper bar: charge Q   ·   lower bar: voltage V', W / 2, H - 10, { align: 'center', size: 11, color: K.muted });
      S.set('Ceq', f(Ceq, 3) + ' µF');
      ['r1', 'r2', 'r3'].forEach(function (key, i) { S.set(key, f(Q[i], 3) + ' µC, ' + f(Vv[i], 3) + ' V'); });
      S.set('U', f(0.5 * Ceq * p.V * p.V, 3) + ' µJ');
    }
  });

  /* ---------- 2D: dielectric in a capacitor ---------- */
  Sim.make('sim-dielectric', {
    aspect: 0.45,
    controls: [{ k: 'kap', label: 'Dielectric constant &kappa;', min: 1, max: 8, step: 0.1, v: 1 }],
    buttons: [{ label: 'Battery connected (V fixed)', group: 'b', on: true, click: function (S) { S.st.fixV = true; } }, { label: 'Battery removed (Q fixed)', group: 'b', click: function (S) { S.st.fixV = false; } }],
    reads: [{ k: 'C', label: 'C = &kappa;C<sub>0</sub>' }, { k: 'Q', label: 'Free charge Q' }, { k: 'V', label: 'Voltage V' }, { k: 'E', label: 'Field E = V/d (d = 1 mm)', big: true }, { k: 'U', label: 'Energy U' }],
    init: function (S) { S.st.fixV = true; },
    draw: function (S, c, W, H) {
      var K = C(), kap = S.p.kap, C0 = 100e-12, V0 = 100, Cc = kap * C0, Q, V;
      if (S.st.fixV) { V = V0; Q = Cc * V; } else { Q = C0 * V0; V = Q / Cc; }
      var Eg = V / 1e-3, U = 0.5 * Q * V, nf = Math.round(Q / (C0 * V0) * 8), nb = Math.round(nf * (1 - 1 / kap));
      D.clear(c, W, H);
      var x1 = W * 0.28, x2 = W * 0.62, top = H * 0.1, bot = H * 0.9, h = bot - top;
      if (kap > 1.01) D.rect(c, x1 + 10, top, x2 - x1 - 20, h, 'rgba(160,110,40,' + (0.12 + 0.05 * kap) + ')', null, 4);
      D.rect(c, x1 - 8, top, 8, h, K.ink, null, 2); D.rect(c, x2, top, 8, h, K.ink, null, 2);
      for (var i = 0; i < Math.min(nf, 40); i++) { var y = top + (i + 0.5) * h / Math.min(nf, 40); D.text(c, '+', x1 - 20, y, { align: 'center', weight: 700, color: K.pos }); D.text(c, '−', x2 + 20, y, { align: 'center', weight: 700, color: K.neg }); }
      for (i = 0; i < Math.min(nb, 40); i++) { y = top + (i + 0.5) * h / Math.min(nb, 40); D.text(c, '−', x1 + 18, y, { align: 'center', weight: 700, color: 'rgba(29,78,216,0.55)', size: 12 }); D.text(c, '+', x2 - 18, y, { align: 'center', weight: 700, color: 'rgba(198,40,40,0.55)', size: 12 }); }
      var na = Math.max(1, Math.round(Eg / 1e5 * 6));
      for (i = 0; i < Math.min(na, 14); i++) { y = top + (i + 0.5) * h / Math.min(na, 14); D.arrow(c, x1 + 30, y, x2 - 30, y, K.c3, 1.6, 8); }
      D.text(c, 'free charge (dark)  ·  bound charge (pale)  ·  green: net field E', W * 0.45, H - 6, { align: 'center', size: 11, color: K.muted });
      var bx = W * 0.72;
      [['Q', Q / (C0 * V0 * 8)], ['V', V / V0], ['E', Eg / 1e5], ['U', U / (0.5 * C0 * V0 * V0 * 8)]].forEach(function (b, j) {
        var yy = H * 0.15 + j * H * 0.2; D.text(c, b[0], bx, yy + 8, { size: 13, weight: 700, color: K.c1 });
        D.rect(c, bx + 18, yy, W * 0.22, 16, K.surface, null, 3); D.rect(c, bx + 18, yy, W * 0.22 * Math.min(1, b[1]), 16, K.c1, null, 3);
      });
      S.set('C', f(Cc * 1e12, 3) + ' pF'); S.set('Q', f(Q * 1e9, 3) + ' nC'); S.set('V', f(V, 3) + ' V'); S.set('E', f(Eg, 3) + ' V/m'); S.set('U', f(U * 1e9, 3) + ' nJ');
    }
  });

  /* ---------- 3D: dipole in a uniform field ---------- */
  Sim.make('sim-dipole3d', {
    webgl: true, aspect: 0.55, camera: { th: 0.3, ph: 1.2, r: 12 },
    controls: [
      { k: 'p', label: 'Dipole moment p', min: 0.5, max: 3, step: 0.1, v: 1.5, show: function (v) { return f(v, 3) + ' (units)'; } },
      { k: 'E', label: 'Field strength E', min: 0.5, max: 3, step: 0.1, v: 1.5, show: function (v) { return f(v, 3) + ' (units)'; } },
      { k: 'th0', label: 'Starting angle &theta;<sub>0</sub>', min: 10, max: 175, step: 5, v: 120, unit: '°' },
      { k: 'b', label: 'Damping', min: 0, max: 1, step: 0.05, v: 0.05 }
    ],
    buttons: [{ label: 'Release', click: function (S) { S.st.th = S.p.th0 * PI / 180; S.st.w = 0; S.st.go = true; } }],
    reads: [{ k: 'th', label: 'Angle &theta;' }, { k: 'tau', label: 'Torque pE sin&theta;', big: true }, { k: 'U', label: 'U = &minus;pE cos&theta;' }, { k: 'K', label: 'Rotational KE' }],
    init: function (S) {
      var st = S.st; st.th = 120 * PI / 180; st.w = 0; st.go = false;
      for (var i = -2; i <= 2; i++) for (var j = -1; j <= 1; j++) { var a = T.arrow(S.scene, '#9aa0b8'); T.setArrow(a, [-5, i * 1.3, j * 2], [10, 0, 0], 0.4); }
      T.label(S.scene, 'E', '#5d5975', 1).position.set(5.4, 3, 0);
      st.g = new THREE.Group(); S.scene.add(st.g);
      var rod = T.cyl(0.08, 0x8f8aa5); rod.rotation.z = PI / 2; rod.scale.y = 3; st.g.add(rod);
      var pp = T.sphere(0.35, 0xc62828); pp.position.x = 1.5; st.g.add(pp); var nn = T.sphere(0.35, 0x1d4ed8); nn.position.x = -1.5; st.g.add(nn);
      st.tau = T.arrow(S.scene, '#9333ea'); st.tl = T.label(S.scene, 'τ', '#9333ea', 0.9);
      st.Fp = T.arrow(S.scene, '#c62828'); st.Fn = T.arrow(S.scene, '#1d4ed8');
    },
    draw: function (S, c, W, H, dt) {
      var st = S.st, p = S.p, I = 1;
      if (st.go) { var sub = 6; for (var i = 0; i < sub; i++) { var h = dt / sub, a = -p.p * p.E * Math.sin(st.th) / I - p.b * st.w; st.w += a * h; st.th += st.w * h; } }
      else st.th = p.th0 * PI / 180;
      st.g.rotation.z = st.th;
      var tau = p.p * p.E * Math.sin(st.th);
      T.setArrow(st.tau, [0, 0, 0], [0, 0, -tau * 0.9], 0.3); st.tl.position.set(0.4, 0.3, -tau * 0.9 - 0.3 * Math.sign(tau || 1));
      var px = 1.5 * Math.cos(st.th), py = 1.5 * Math.sin(st.th);
      T.setArrow(st.Fp, [px, py, 0], [p.E * 0.8, 0, 0], 0.25); T.setArrow(st.Fn, [-px, -py, 0], [-p.E * 0.8, 0, 0], 0.25);
      var deg = ((st.th * 180 / PI) % 360 + 540) % 360 - 180;
      S.set('th', f(deg, 3) + '°'); S.set('tau', f(Math.abs(tau), 3)); S.set('U', f(-p.p * p.E * Math.cos(st.th), 3)); S.set('K', f(0.5 * I * st.w * st.w, 3));
      S.msg(st.go ? '' : 'Press Release to let the field turn the dipole.');
    }
  });

  /* ---------- 3D: flux through a tilted surface ---------- */
  Sim.make('sim-flux3d', {
    webgl: true, aspect: 0.5, camera: { th: 0.9, ph: 1.15, r: 13 },
    controls: [
      { k: 'th', label: 'Angle &theta; between E and the normal', min: 0, max: 90, step: 1, v: 30, unit: '°' },
      { k: 'A', label: 'Area A', min: 1, max: 9, step: 0.5, v: 4, unit: 'm²' },
      { k: 'E', label: 'Field E', min: 100, max: 1000, step: 50, v: 500, unit: 'N/C' }
    ],
    reads: [{ k: 'phi', label: '&Phi; = EA cos&theta;', big: true }, { k: 'max', label: 'Maximum (&theta; = 0)' }],
    init: function (S) {
      var st = S.st; st.lines = [];
      for (var i = -3; i <= 3; i++) for (var j = -3; j <= 3; j++) { var a = T.arrow(S.scene, '#9aa0b8'); st.lines.push({ a: a, y: i * 0.7, z: j * 0.7 }); }
      st.surf = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), T.mat(0x4338ca, { opacity: 0.45, side: THREE.DoubleSide })); S.scene.add(st.surf);
      st.edge = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(1, 1)), new THREE.LineBasicMaterial({ color: 0x2e2a7a })); st.surf.add(st.edge);
      st.n = T.arrow(S.scene, '#9333ea'); st.nl = T.label(S.scene, 'n̂', '#9333ea', 0.9);
    },
    draw: function (S) {
      var st = S.st, p = S.p, th = p.th * PI / 180, s = Math.sqrt(p.A) * 0.9;
      st.surf.scale.set(s, s, 1); st.surf.rotation.set(0, PI / 2 - th, 0);
      var nx = Math.cos(th), nz = Math.sin(th);
      T.setArrow(st.n, [0, 0, 0], [nx * 2.2, 0, nz * 2.2], 0.35); st.nl.position.set(nx * 2.6, 0.3, nz * 2.6);
      var L = 4 + p.E / 250;
      st.lines.forEach(function (q) {
        // does this line (along x through (y,z)) hit the tilted square?
        var hit = Math.abs(q.y) <= s / 2 && Math.abs(q.z) <= s / 2 * Math.cos(th) + 1e-6 && Math.cos(th) > 0.02;
        T.setArrow(q.a, [-L, q.y, q.z], [2 * L, 0, 0], 0.3); q.a.setColor(new THREE.Color(hit ? 0xc2410c : 0xb9bdd0));
      });
      var phi = p.E * p.A * Math.cos(th);
      S.set('phi', f(phi, 3) + ' N·m²/C'); S.set('max', f(p.E * p.A, 3) + ' N·m²/C');
      S.msg('Orange lines pass through the surface. Their number is proportional to the flux.');
    }
  });

  /* ---------- 3D: Gaussian sphere ---------- */
  Sim.make('sim-gauss3d', {
    webgl: true, aspect: 0.55, camera: { th: 0.5, ph: 1.15, r: 15 },
    controls: [
      { k: 'R', label: 'Sphere radius', min: 1, max: 4, step: 0.1, v: 2.5 },
      { k: 'x1', label: 'Position of charge 1', min: -5, max: 5, step: 0.1, v: 0 },
      { k: 'q1', label: 'Charge 1', min: -3, max: 3, step: 0.5, v: 2 },
      { k: 'x2', label: 'Position of charge 2', min: -5, max: 5, step: 0.1, v: 4 },
      { k: 'q2', label: 'Charge 2', min: -3, max: 3, step: 0.5, v: -2 }
    ],
    reads: [{ k: 'qe', label: 'Charge enclosed' }, { k: 'phi', label: 'Flux counted over the sphere', big: true }, { k: 'th', label: 'Gauss: q<sub>enc</sub>/&epsilon;<sub>0</sub>' }],
    init: function (S) {
      var st = S.st;
      st.sph = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 24), T.mat(0x4338ca, { opacity: 0.15, side: THREE.DoubleSide })); S.scene.add(st.sph);
      st.c1 = T.sphere(0.25, 0xc62828); S.scene.add(st.c1); st.c2 = T.sphere(0.25, 0x1d4ed8); S.scene.add(st.c2);
      st.pts = []; var N = 120;
      for (var i = 0; i < N; i++) { var y = 1 - 2 * (i + 0.5) / N, r = Math.sqrt(1 - y * y), a = i * 2.39996; st.pts.push({ n: [r * Math.cos(a), y, r * Math.sin(a)], ar: T.arrow(S.scene, '#c2410c') }); }
    },
    draw: function (S) {
      var st = S.st, p = S.p, qs = [[p.x1, p.q1], [p.x2, p.q2]], R = p.R, flux = 0;
      st.sph.scale.setScalar(R); st.c1.position.x = p.x1; st.c2.position.x = p.x2;
      [[st.c1, p.q1], [st.c2, p.q2]].forEach(function (q) { q[0].visible = q[1] !== 0; q[0].material.color.setHex(q[1] > 0 ? 0xc62828 : 0x1d4ed8); });
      var dA = 4 * PI * R * R / st.pts.length;
      st.pts.forEach(function (o) {
        var P = [o.n[0] * R, o.n[1] * R, o.n[2] * R], E = [0, 0, 0];
        qs.forEach(function (q) { var dx = P[0] - q[0], dy = P[1], dz = P[2], r2 = dx * dx + dy * dy + dz * dz + 0.01, s = q[1] / (r2 * Math.sqrt(r2)); E[0] += s * dx; E[1] += s * dy; E[2] += s * dz; });
        var En = E[0] * o.n[0] + E[1] * o.n[1] + E[2] * o.n[2]; flux += En * dA;
        var L = clamp(En * 1.2, -1.2, 1.2);
        T.setArrow(o.ar, P, [o.n[0] * L, o.n[1] * L, o.n[2] * L], 0.18); o.ar.setColor(new THREE.Color(En >= 0 ? 0xc2410c : 0x1d4ed8));
      });
      var qe = qs.reduce(function (a, q) { return a + (Math.abs(q[0]) < R ? q[1] : 0); }, 0);
      S.set('qe', f(qe, 3)); S.set('phi', f(flux / (4 * PI), 3) + ' (× 4πk)'); S.set('th', f(qe, 3) + ' (× 4πk)');
      S.msg('Orange: flux out. Blue: flux in. A charge outside adds equal in and out.');
    }
  });

  /* ---------- 3D: potential landscape ---------- */
  Sim.make('sim-landscape3d', {
    webgl: true, aspect: 0.55, camera: { th: 0.6, ph: 0.95, r: 17 },
    controls: [
      { k: 'q1', label: 'Charge 1', min: -3, max: 3, step: 0.5, v: 2 },
      { k: 'q2', label: 'Charge 2', min: -3, max: 3, step: 0.5, v: -2 },
      { k: 'd', label: 'Separation', min: 1, max: 8, step: 0.25, v: 5 }
    ],
    buttons: [{ label: 'Roll a test charge', click: function (S) { var st = S.st; st.ball = [ (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 6 ]; if (S.p.q1 > 0) st.ball[0] += -S.p.d / 2 + (Math.random() > 0.5 ? 0.8 : -0.8); st.trail = []; } }],
    reads: [{ k: 'V', label: 'V under the ball' }, { k: 'E', label: '|E| = |&nabla;V| there', big: true }],
    init: function (S) {
      var st = S.st, geo = new THREE.PlaneGeometry(14, 10, 120, 86); geo.rotateX(-PI / 2);
      geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(geo.attributes.position.count * 3), 3));
      st.geo = geo; S.scene.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide })));
      st.bm = T.sphere(0.25, 0x15803d); S.scene.add(st.bm); st.bm.visible = false; st.tr = T.line(S.scene, 0x15803d, 600); st.trail = []; st.key = '';
    },
    draw: function (S, c, W, H, dt) {
      var st = S.st, p = S.p, qs = [[-p.d / 2, 0, p.q1], [p.d / 2, 0, p.q2]];
      var Vf = function (x, z) { var v = 0; qs.forEach(function (q) { v += q[2] / Math.sqrt((x - q[0]) * (x - q[0]) + (z - q[1]) * (z - q[1]) + 0.12); }); return v; };
      var key = [p.q1, p.q2, p.d].join();
      if (key !== st.key) {
        st.key = key; var ps = st.geo.attributes.position, cl = st.geo.attributes.color, col = new THREE.Color();
        for (var i = 0; i < ps.count; i++) {
          var x = ps.getX(i), z = ps.getZ(i), V = Vf(x, z), y = clamp(V, -3, 3) * 0.9; ps.setY(i, y);
          var lv = V * 3, fr = lv - Math.floor(lv), band = (fr < 0.06 || fr > 0.94) && Math.abs(V) < 3;
          col.setHSL(V >= 0 ? 0.0 : 0.66, 0.65, band ? 0.25 : 0.88 - 0.35 * Math.min(1, Math.abs(V) / 2)); cl.setXYZ(i, col.r, col.g, col.b);
        }
        ps.needsUpdate = true; cl.needsUpdate = true; st.ball = null;
      }
      if (st.ball) {
        for (var s = 0; s < 4; s++) {
          var h = 1e-3, gx = (Vf(st.ball[0] + h, st.ball[1]) - Vf(st.ball[0] - h, st.ball[1])) / (2 * h), gz = (Vf(st.ball[0], st.ball[1] + h) - Vf(st.ball[0], st.ball[1] - h)) / (2 * h), g = Math.hypot(gx, gz) || 1;
          var spd = Math.min(0.06, 0.01 + 0.02 * g) * dt * 60; st.ball[0] -= gx / g * spd; st.ball[1] -= gz / g * spd;
        }
        if (Math.abs(st.ball[0]) > 7 || Math.abs(st.ball[1]) > 5) st.ball = null;
      }
      st.bm.visible = !!st.ball;
      if (st.ball) {
        var Vb = Vf(st.ball[0], st.ball[1]); st.bm.position.set(st.ball[0], clamp(Vb, -3, 3) * 0.9 + 0.25, st.ball[1]);
        st.trail.push([st.ball[0], clamp(Vb, -3, 3) * 0.9 + 0.1, st.ball[1]]); if (st.trail.length > 600) st.trail.shift(); T.setLine(st.tr, st.trail);
        var hh = 1e-3, Ex = (Vf(st.ball[0] + hh, st.ball[1]) - Vf(st.ball[0] - hh, st.ball[1])) / (2 * hh), Ez = (Vf(st.ball[0], st.ball[1] + hh) - Vf(st.ball[0], st.ball[1] - hh)) / (2 * hh);
        S.set('V', f(Vb, 3)); S.set('E', f(Math.hypot(Ex, Ez), 3));
      } else { S.set('V', '–'); S.set('E', '–'); }
      st.tr.visible = !!st.ball;
    }
  });

  /* ---------- 3D: parallel-plate capacitor with a dielectric slab ---------- */
  Sim.make('sim-capacitor3d', {
    webgl: true, aspect: 0.55, camera: { th: 0.75, ph: 1.15, r: 12 },
    controls: [
      { k: 'a', label: 'Plate side', min: 2, max: 10, step: 0.5, v: 6, unit: 'cm' },
      { k: 'd', label: 'Gap d', min: 1, max: 6, step: 0.25, v: 3, unit: 'mm' },
      { k: 'V', label: 'Voltage V', min: 0, max: 100, step: 5, v: 50, unit: 'V' },
      { k: 'fr', label: 'Dielectric pushed in', min: 0, max: 100, step: 5, v: 0, unit: '%' },
      { k: 'kap', label: 'Dielectric constant &kappa;', min: 1, max: 8, step: 0.5, v: 4 }
    ],
    reads: [{ k: 'C', label: 'C = &epsilon;<sub>0</sub>A[(1&minus;f) + &kappa;f]/d', big: true }, { k: 'Q', label: 'Q = CV' }, { k: 'E', label: 'E = V/d' }, { k: 'U', label: 'U = &frac12;CV&sup2;' }],
    init: function (S) {
      var st = S.st;
      st.top = new THREE.Mesh(new THREE.BoxGeometry(1, 0.08, 1), T.mat(0xc62828)); st.bot = new THREE.Mesh(new THREE.BoxGeometry(1, 0.08, 1), T.mat(0x1d4ed8)); S.scene.add(st.top); S.scene.add(st.bot);
      st.slab = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), T.mat(0xb07a2a, { opacity: 0.55 })); S.scene.add(st.slab);
      st.ar = []; for (var i = 0; i < 25; i++) st.ar.push(T.arrow(S.scene, '#15803d'));
    },
    draw: function (S) {
      var st = S.st, p = S.p, s = p.a * 0.5, g = p.d * 0.5, fr = p.fr / 100;
      st.top.scale.set(s, 1, s); st.bot.scale.set(s, 1, s); st.top.position.y = g / 2 + 0.04; st.bot.position.y = -g / 2 - 0.04;
      st.slab.visible = fr > 0; st.slab.scale.set(s * fr, g * 0.98, s); st.slab.position.set(-s / 2 + s * fr / 2 - (1 - fr) * 2.5 * 0, 0, 0);
      var n = 0;
      for (var i = 0; i < 5; i++) for (var j = 0; j < 5; j++) { var x = -s / 2 + (i + 0.5) * s / 5, z = -s / 2 + (j + 0.5) * s / 5, a = st.ar[n++]; T.setArrow(a, [x, g / 2, z], [0, -g * 0.9, 0], 0.2); a.visible = p.V > 0; }
      var A = Math.pow(p.a / 100, 2), d = p.d / 1000, Cc = e0 * A * ((1 - fr) + p.kap * fr) / d;
      S.set('C', f(Cc * 1e12, 3) + ' pF'); S.set('Q', f(Cc * p.V * 1e9, 3) + ' nC'); S.set('E', f(p.V / d, 3) + ' V/m'); S.set('U', f(0.5 * Cc * p.V * p.V * 1e9, 3) + ' nJ');
    }
  });
})();
