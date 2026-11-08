/* Unit 4 simulations: electricity */
(function () {
  var D = Sim.D, f = Sim.fmt, C = Sim.col, PI = Math.PI, k = 8.99e9;

  function charge(c, x, y, q, r) {
    var K = C(); r = r || 16;
    D.circle(c, x, y, r, q > 0 ? K.pos : q < 0 ? K.neg : K.faint, '#00000040', 1);
    D.text(c, q > 0 ? '+' : q < 0 ? '−' : '0', x, y + 1, { align: 'center', size: r * 1.2, weight: 700, color: '#fff' });
  }

  /* 1. Coulomb's law */
  Sim.make('sim-coulomb', {
    aspect: 0.38, minH: 230,
    controls: [
      { k: 'q1', label: 'Charge q<sub>1</sub>', min: -5, max: 5, step: 0.5, v: 2, unit: 'µC' },
      { k: 'q2', label: 'Charge q<sub>2</sub>', min: -5, max: 5, step: 0.5, v: -3, unit: 'µC' },
      { k: 'r', label: 'Distance r', min: 0.1, max: 1, step: 0.05, v: 0.5, unit: 'm' }
    ],
    reads: [{ k: 'F', label: 'Force F = kq<sub>1</sub>q<sub>2</sub>/r&sup2;', big: true }, { k: 'type', label: 'Type' }],
    draw: function (S, c, W, H) {
      var p = S.p, K = C(), F = k * Math.abs(p.q1 * p.q2) * 1e-12 / (p.r * p.r), att = p.q1 * p.q2 < 0;
      D.clear(c, W, H);
      var cy = H * 0.5, mid = W / 2, half = (W * 0.36) * p.r, x1 = mid - half, x2 = mid + half;
      D.line(c, x1, cy + 40, x2, cy + 40, K.muted, 1); D.text(c, 'r = ' + p.r.toFixed(2) + ' m', mid, cy + 54, { align: 'center', size: 12, color: K.muted });
      var L = Math.min(W * 0.2, 14 + 70 * Math.sqrt(F));
      if (F > 0) {
        var d = att ? 1 : -1;
        D.arrow(c, x1, cy, x1 + d * L, cy, K.ink, 4); D.arrow(c, x2, cy, x2 - d * L, cy, K.ink, 4);
      }
      charge(c, x1, cy, p.q1, 10 + Math.abs(p.q1) * 2.4); charge(c, x2, cy, p.q2, 10 + Math.abs(p.q2) * 2.4);
      D.text(c, 'q₁ = ' + p.q1 + ' µC', x1, cy - 42, { align: 'center', size: 12.5, weight: 600 });
      D.text(c, 'q₂ = ' + p.q2 + ' µC', x2, cy - 42, { align: 'center', size: 12.5, weight: 600 });
      S.set('F', f(F, 3) + ' N'); S.set('type', F === 0 ? 'no force' : att ? 'attractive (unlike)' : 'repulsive (like)');
    }
  });

  /* 2. Field lines (draggable charges) + potential */
  var presets = {
    'Single +': [[0, 0, 1]], 'Single −': [[0, 0, -1]], 'Dipole': [[-0.3, 0, 1], [0.3, 0, -1]], 'Two +': [[-0.3, 0, 1], [0.3, 0, 1]]
  };
  function fieldAt(qs, x, y) { var ex = 0, ey = 0; qs.forEach(function (q) { var dx = x - q[0], dy = y - q[1], r2 = dx * dx + dy * dy + 1e-6, r3 = r2 * Math.sqrt(r2); ex += q[2] * dx / r3; ey += q[2] * dy / r3; }); return [ex, ey]; }
  Sim.make('sim-fieldlines', {
    aspect: 0.5,
    buttons: Object.keys(presets).map(function (n, i) { return { label: n, group: 'p', on: i === 2, click: function (S) { S.st.qs = presets[n].map(function (q) { return q.slice(); }); } }; })
      .concat([{ k: 'pot', label: 'Show potential', click: function (S, b) { S.st.pot = !S.st.pot; b.classList.toggle('on', S.st.pot); } }]),
    reads: [{ k: 'n', label: 'Charges' }, { k: 'hint', label: 'Tip' }],
    init: function (S) { S.st.qs = presets.Dipole.map(function (q) { return q.slice(); }); S.st.pot = false; },
    pointer: function (S, type, x, y) {
      var sc = Math.min(S.W, S.H * 2) / 2, wx = (x - S.W / 2) / sc, wy = (y - S.H / 2) / sc;
      if (type === 'down') { S.st.drag = null; S.st.qs.forEach(function (q, i) { if (Math.hypot(q[0] - wx, q[1] - wy) < 0.08) S.st.drag = i; }); }
      if (S.st.drag !== null && S.st.drag !== undefined) { var q = S.st.qs[S.st.drag]; q[0] = Sim.clamp(wx, -0.95, 0.95); q[1] = Sim.clamp(wy, -0.45, 0.45); }
    },
    draw: function (S, c, W, H) {
      var K = C(), sc = Math.min(W, H * 2) / 2, qs = S.st.qs, tx = function (x) { return W / 2 + x * sc; }, ty = function (y) { return H / 2 + y * sc; };
      D.clear(c, W, H);
      if (S.st.pot) {
        var cell = 5;
        for (var px = 0; px < W; px += cell) for (var py = 0; py < H; py += cell) {
          var wx = (px + cell / 2 - W / 2) / sc, wy = (py + cell / 2 - H / 2) / sc, V = 0;
          qs.forEach(function (q) { V += q[2] / Math.max(0.02, Math.hypot(wx - q[0], wy - q[1])); });
          var a = Math.tanh(Math.abs(V) / 8) * 0.55, band = Math.floor(V * 1.2) % 2 === 0 ? 1 : 0.7;
          c.fillStyle = V > 0 ? 'rgba(198,40,40,' + (a * band) + ')' : 'rgba(21,101,192,' + (a * band) + ')';
          c.fillRect(px, py, cell, cell);
        }
      }
      var src = qs.filter(function (q) { return q[2] > 0; }), dir = 1;
      if (!src.length) { src = qs; dir = -1; }
      src.forEach(function (q) {
        var n = 16;
        for (var i = 0; i < n; i++) {
          var a = 2 * PI * i / n + 0.1, x = q[0] + 0.03 * Math.cos(a), y = q[1] + 0.03 * Math.sin(a), pts = [[tx(x), ty(y)]];
          for (var s = 0; s < 500; s++) {
            var e = fieldAt(qs, x, y), m = Math.hypot(e[0], e[1]); if (m === 0) break;
            x += dir * e[0] / m * 0.008; y += dir * e[1] / m * 0.008; pts.push([tx(x), ty(y)]);
            if (Math.abs(x) > 1.3 || Math.abs(y) > 0.8) break;
            var hit = qs.some(function (o) { return o !== q && Math.hypot(o[0] - x, o[1] - y) < 0.025; }); if (hit) break;
          }
          D.poly(c, pts, K.muted, 1.5);
          var mI = Math.floor(pts.length * 0.35); if (pts.length > 12 && mI > 1) { var p0 = pts[mI - 1], p1 = pts[mI]; var ddx = (p1[0] - p0[0]) * dir, ddy = (p1[1] - p0[1]) * dir, L = Math.hypot(ddx, ddy) || 1; D.arrow(c, p1[0] - ddx / L * 8, p1[1] - ddy / L * 8, p1[0], p1[1], K.muted, 1.5, 8); }
        }
      });
      qs.forEach(function (q) { charge(c, tx(q[0]), ty(q[1]), q[2], 14); });
      if (S.st.pot) D.text(c, 'red = high potential, blue = low; each colour band is an equipotential', W / 2, H - 12, { align: 'center', size: 11.5, color: K.ink, bg: K.bg });
      S.set('n', qs.map(function (q) { return q[2] > 0 ? '+' : '−'; }).join(' ')); S.set('hint', 'drag a charge');
    }
  });

  /* 4. Capacitor */
  Sim.make('sim-capacitor', {
    aspect: 0.45,
    controls: [
      { k: 'A', label: 'Plate area A', min: 10, max: 100, step: 5, v: 50, unit: 'cm²' },
      { k: 'd', label: 'Gap d', min: 1, max: 10, step: 0.5, v: 4, unit: 'mm' },
      { k: 'kap', label: 'Dielectric constant &kappa;', min: 1, max: 10, step: 0.5, v: 1 },
      { k: 'V', label: 'Battery voltage V', min: 0, max: 12, step: 0.5, v: 9, unit: 'V' }
    ],
    reads: [{ k: 'C', label: 'C = &kappa;&epsilon;<sub>0</sub>A/d', big: true }, { k: 'Q', label: 'Charge Q = CV' }, { k: 'E', label: 'Field E = V/d' }, { k: 'U', label: 'Energy &frac12;CV&sup2;' }],
    draw: function (S, c, W, H) {
      var p = S.p, K = C(), Cap = p.kap * 8.85e-12 * p.A * 1e-4 / (p.d * 1e-3), Q = Cap * p.V;
      D.clear(c, W, H);
      var cx = W * 0.45, cy = H * 0.5, ph = Math.sqrt(p.A) * H * 0.075, gap = p.d * W * 0.035, xL = cx - gap / 2, xR = cx + gap / 2;
      if (p.kap > 1) D.rect(c, xL + 2, cy - ph / 2, gap - 4, ph, 'rgba(180,120,40,' + (0.1 + p.kap * 0.04) + ')', null, 2);
      D.rect(c, xL - 8, cy - ph / 2, 8, ph, K.ink, null, 2); D.rect(c, xR, cy - ph / 2, 8, ph, K.ink, null, 2);
      var n = Q > 0 ? Math.round(2 + 22 * Math.sqrt(Q / 1.06e-8)) : 0, i;
      for (i = 0; i < n; i++) { var yy = cy - ph / 2 + (i + 0.5) * ph / n; D.text(c, '+', xL - 18, yy, { align: 'center', weight: 700, color: K.pos, size: 13 }); D.text(c, '−', xR + 18, yy, { align: 'center', weight: 700, color: K.neg, size: 13 }); }
      if (p.V > 0) for (i = 0; i < 5; i++) { var y = cy - ph / 2 + (i + 0.5) * ph / 5; D.arrow(c, xL + 4, y, xR - 4, y, K.c3, 1.5, 7); }
      D.line(c, xL - 8, cy - ph / 2, xL - 8, H * 0.06, K.ink, 1.5); D.line(c, xR + 8, cy - ph / 2, xR + 8, H * 0.06, K.ink, 1.5);
      D.line(c, xL - 8, H * 0.06, cx - 14, H * 0.06, K.ink, 1.5); D.line(c, xR + 8, H * 0.06, cx + 14, H * 0.06, K.ink, 1.5);
      D.line(c, cx - 14, H * 0.02, cx - 14, H * 0.1, K.ink, 3); D.line(c, cx + 14, H * 0.04, cx + 14, H * 0.08, K.ink, 3);
      D.text(c, p.V + ' V', cx, H * 0.15, { align: 'center', size: 12, weight: 600 });
      D.text(c, p.kap > 1 ? 'dielectric κ = ' + p.kap : 'air gap', cx, cy + ph / 2 + 16, { align: 'center', size: 12, color: K.muted });
      S.set('C', f(Cap * 1e12, 3) + ' pF'); S.set('Q', f(Q, 3) + ' C'); S.set('E', f(p.V / (p.d * 1e-3), 3) + ' V/m'); S.set('U', f(0.5 * Cap * p.V * p.V, 3) + ' J');
    }
  });

  /* loop path helper for circuits */
  function loopPt(x0, y0, w, h, s) { var P = 2 * (w + h); s = ((s % P) + P) % P; if (s < w) return [x0 + s, y0]; s -= w; if (s < h) return [x0 + w, y0 + s]; s -= h; if (s < w) return [x0 + w - s, y0 + h]; s -= w; return [x0, y0 + h - s]; }
  function battery(c, x, y, label) { var K = C(); D.rect(c, x - 16, y - 16, 32, 32, K.bg, null, 0); D.line(c, x - 14, y - 6, x + 14, y - 6, K.ink, 3); D.line(c, x - 8, y + 6, x + 8, y + 6, K.ink, 5); D.text(c, label, x - 22, y, { align: 'right', size: 12, weight: 600 }); }
  function resistor(c, x, y, vert, label, color) { var K = C(); var pts = []; for (var i = 0; i <= 8; i++) { var u = -24 + i * 6, o = i === 0 || i === 8 ? 0 : (i % 2 ? 7 : -7); pts.push(vert ? [x + o, y + u] : [x + u, y + o]); } D.rect(c, vert ? x - 10 : x - 26, vert ? y - 26 : y - 10, vert ? 20 : 52, vert ? 52 : 20, K.bg, null, 0); D.poly(c, pts, color || K.ink, 2.5); if (label) D.text(c, label, vert ? x + 14 : x, vert ? y : y - 20, { align: vert ? 'left' : 'center', size: 12, weight: 600, color: color || K.ink }); }

  /* 5. Ohm's law */
  Sim.make('sim-ohm', {
    aspect: 0.45, animate: true,
    controls: [{ k: 'V', label: 'Battery voltage V', min: 0, max: 12, step: 0.5, v: 6, unit: 'V' }, { k: 'R', label: 'Resistance R', min: 2, max: 20, step: 1, v: 6, unit: 'Ω' }],
    reads: [{ k: 'I', label: 'Current I = V/R', big: true }, { k: 'P', label: 'Power P = VI' }],
    init: function (S) { S.st.s = 0; },
    draw: function (S, c, W, H, dt) {
      var p = S.p, K = C(), I = p.V / p.R, P = p.V * I;
      S.st.s += I * dt * 40;
      D.clear(c, W, H);
      var x0 = W * 0.2, y0 = H * 0.18, w = W * 0.6, h = H * 0.64, P2 = 2 * (w + h);
      D.rect(c, x0, y0, w, h, null, K.ink, 0, 2.5);
      for (var i = 0; i < 28; i++) { var q = loopPt(x0, y0, w, h, S.st.s + i * P2 / 28); D.circle(c, q[0], q[1], 4, K.c1); }
      battery(c, x0, y0 + h / 2, p.V + ' V');
      resistor(c, x0 + w, y0 + h / 2, true, p.R + ' Ω');
      var lx = x0 + w / 2, ly = y0, glow = Math.min(1, P / 24);
      if (glow > 0) { var g = c.createRadialGradient(lx, ly, 4, lx, ly, 20 + 50 * glow); g.addColorStop(0, 'rgba(255,210,80,' + (0.4 + 0.6 * glow) + ')'); g.addColorStop(1, 'rgba(255,210,80,0)'); c.fillStyle = g; c.beginPath(); c.arc(lx, ly, 20 + 50 * glow, 0, 2 * PI); c.fill(); }
      D.circle(c, lx, ly, 14, glow > 0.02 ? '#ffd54f' : K.surface, K.ink, 2);
      D.text(c, 'lamp', lx, ly - 26, { align: 'center', size: 11.5, color: K.muted });
      D.text(c, 'dots = moving charge (speed ∝ current)', W / 2, H - 10, { align: 'center', size: 11.5, color: K.muted });
      S.set('I', f(I, 3) + ' A'); S.set('P', f(P, 3) + ' W');
    }
  });

  /* 6. Axon as a wire */
  Sim.make('sim-axon', {
    aspect: 0.32, minH: 220,
    controls: [
      { k: 'L', label: 'Length L', min: -3, max: 0, step: 0.05, v: -2, map: function (x) { return Math.pow(10, x); }, show: function (v) { return v < 0.01 ? f(v * 1000, 3) + ' mm' : f(v * 100, 3) + ' cm'; } },
      { k: 'r', label: 'Radius r', min: 0, max: 2.7, step: 0.05, v: 0.7, map: function (x) { return Math.pow(10, x); }, show: function (v) { return f(v, 3) + ' µm'; } }
    ],
    buttons: [{ label: 'Axoplasm (ρ = 2 Ω·m)', group: 'm', on: true, click: function (S) { S.st.rho = 2; } }, { label: 'Copper (ρ = 1.7×10⁻⁸)', group: 'm', click: function (S) { S.st.rho = 1.7e-8; } }],
    reads: [{ k: 'R', label: 'R = &rho;L/(&pi;r&sup2;)', big: true }, { k: 'I', label: 'Current if 70 mV is applied' }],
    init: function (S) { S.st.rho = 2; },
    draw: function (S, c, W, H) {
      var p = S.p, K = C(), R = S.st.rho * p.L / (PI * Math.pow(p.r * 1e-6, 2));
      D.clear(c, W, H);
      var len = W * (0.25 + 0.6 * (Math.log10(p.L) + 3) / 3), th = 6 + 60 * (Math.log10(p.r)) / 2.7, x0 = (W - len) / 2, cy = H * 0.45;
      D.rect(c, x0, cy - th / 2, len, th, S.st.rho > 1 ? 'rgba(240,190,120,0.7)' : 'rgba(200,110,50,0.9)', K.ink, th / 2, 1.5);
      D.text(c, 'L', x0 + len / 2, cy + th / 2 + 16, { align: 'center', italic: true, serif: true, size: 15 });
      D.text(c, S.st.rho > 1 ? 'axon filled with axoplasm' : 'copper wire', W / 2, H * 0.1, { align: 'center', size: 12.5, weight: 600, color: K.muted });
      var units = R >= 1e6 ? f(R / 1e6, 3) + ' MΩ' : R >= 1e3 ? f(R / 1e3, 3) + ' kΩ' : f(R, 3) + ' Ω';
      S.set('R', units); S.set('I', f(0.07 / R, 3) + ' A');
    }
  });

  /* 7. RC circuit */
  Sim.make('sim-rc', {
    aspect: 0.45, animate: true,
    controls: [{ k: 'R', label: 'Resistance R', min: 1, max: 10, step: 0.5, v: 4, unit: 'kΩ' }, { k: 'C', label: 'Capacitance C', min: 100, max: 500, step: 50, v: 250, unit: 'µF' }],
    buttons: [
      { label: 'Charge', click: function (S) { S.st.v0 = S.st.v; S.st.mode = 1; S.st.t0 = S.t; S.st.trace = [[0, S.st.v]]; } },
      { label: 'Discharge', click: function (S) { S.st.v0 = S.st.v; S.st.mode = -1; S.st.t0 = S.t; S.st.trace = [[0, S.st.v]]; } },
      { label: 'Reset', click: function (S) { S.st.v = 0; S.st.mode = 0; S.st.trace = []; } }
    ],
    reads: [{ k: 'tau', label: '&tau; = RC', big: true }, { k: 'v', label: 'Capacitor voltage V<sub>C</sub>' }, { k: 'i', label: 'Current I' }, { k: 'ts', label: 'Time since switch' }],
    init: function (S) { S.st.v = 0; S.st.mode = 0; S.st.trace = []; S.st.t0 = 0; },
    draw: function (S, c, W, H) {
      var p = S.p, K = C(), E = 9, tau = p.R * 1e3 * p.C * 1e-6, ts = S.t - S.st.t0, Tm = 12;
      if (S.st.mode === 1) S.st.v = E - (E - S.st.v0) * Math.exp(-ts / tau);
      if (S.st.mode === -1) S.st.v = S.st.v0 * Math.exp(-ts / tau);
      if (S.st.mode && ts <= Tm) { var tr = S.st.trace; if (!tr.length || ts - tr[tr.length - 1][0] > 0.04) tr.push([ts, S.st.v]); }
      var I = S.st.mode === 1 ? (E - S.st.v) / (p.R * 1e3) : S.st.mode === -1 ? S.st.v / (p.R * 1e3) : 0;
      D.clear(c, W, H);
      // circuit sketch
      var x0 = W * 0.05, y0 = H * 0.2, w = W * 0.26, h = H * 0.6;
      D.rect(c, x0, y0, w, h, null, K.ink, 0, 2);
      if (S.st.mode !== -1) battery(c, x0, y0 + h / 2, '9 V'); else { D.rect(c, x0 - 4, y0 + h * 0.3, 8, h * 0.4, K.bg, null, 0); D.text(c, 'battery out', x0 + 6, y0 + h / 2, { size: 11, color: K.muted }); D.line(c, x0, y0 + h * 0.3, x0, y0 + h * 0.7, K.ink, 2); }
      resistor(c, x0 + w / 2, y0, false, p.R + ' kΩ');
      D.rect(c, x0 + w - 16, y0 + h / 2 - 12, 32, 24, K.bg, null, 0); D.line(c, x0 + w - 14, y0 + h / 2 - 5, x0 + w + 14, y0 + h / 2 - 5, K.ink, 3); D.line(c, x0 + w - 14, y0 + h / 2 + 5, x0 + w + 14, y0 + h / 2 + 5, K.ink, 3);
      D.text(c, 'C', x0 + w + 18, y0 + h / 2, { size: 12, weight: 600 });
      // graph
      var box = { x: W * 0.42, y: H * 0.1, w: W * 0.54, h: H * 0.74 };
      var g = D.graph(c, box, { x0: 0, x1: Tm, y0: 0, y1: 10, xl: 'time since switch (s) →', yl: 'V_C (V)', hlines: [{ y: 9, label: 'battery 9 V', color: K.faint }, { y: S.st.mode === -1 ? S.st.v0 * 0.368 : S.st.mode === 1 ? E - (E - S.st.v0) * 0.368 : -1, label: S.st.mode === -1 ? '37%' : '63%', color: K.c2 }], vlines: [{ x: tau, label: 't = τ', color: K.c2 }] }, [{ pts: S.st.trace, color: K.c1, w: 3 }]);
      [0, 2, 4, 6, 8, 10, 12].forEach(function (u) { D.text(c, String(u), g.px(u), box.y + box.h + 12, { size: 10, align: 'center', color: K.faint }); });
      S.set('tau', f(tau, 3) + ' s'); S.set('v', f(S.st.v, 3) + ' V'); S.set('i', f(I * 1000, 3) + ' mA'); S.set('ts', S.st.mode ? f(ts, 3) + ' s' : '–');
      S.msg(S.st.mode === 0 ? 'Press Charge to close the switch.' : '');
    }
  });

  /* 8. Series and parallel */
  Sim.make('sim-circuit', {
    aspect: 0.45,
    controls: [{ k: 'R1', label: 'R<sub>1</sub>', min: 1, max: 20, step: 1, v: 4, unit: 'Ω' }, { k: 'R2', label: 'R<sub>2</sub>', min: 1, max: 20, step: 1, v: 6, unit: 'Ω' }],
    buttons: [{ label: 'Series', group: 'c', on: true, click: function (S) { S.st.par = false; } }, { label: 'Parallel', group: 'c', click: function (S) { S.st.par = true; } }],
    reads: [{ k: 'Rt', label: 'Total resistance' }, { k: 'I', label: 'Total current', big: true }, { k: 'r1', label: 'R<sub>1</sub>: V<sub>1</sub>, I<sub>1</sub>' }, { k: 'r2', label: 'R<sub>2</sub>: V<sub>2</sub>, I<sub>2</sub>' }],
    init: function (S) { S.st.par = false; },
    draw: function (S, c, W, H) {
      var p = S.p, K = C(), V = 12, par = S.st.par, Rt = par ? p.R1 * p.R2 / (p.R1 + p.R2) : p.R1 + p.R2, I = V / Rt;
      var I1 = par ? V / p.R1 : I, I2 = par ? V / p.R2 : I, V1 = I1 * p.R1, V2 = I2 * p.R2;
      D.clear(c, W, H);
      var x0 = W * 0.18, y0 = H * 0.14, w = W * 0.62, h = H * 0.7;
      if (!par) {
        D.rect(c, x0, y0, w, h, null, K.ink, 0, 2.5);
        resistor(c, x0 + w * 0.5, y0, false, 'R₁ = ' + p.R1 + ' Ω', K.c1);
        resistor(c, x0 + w, y0 + h / 2, true, 'R₂ = ' + p.R2 + ' Ω', K.c2);
        D.arrow(c, x0 + w * 0.15, y0 - 12, x0 + w * 0.3, y0 - 12, K.c3, 2.5); D.text(c, 'I = ' + f(I, 3) + ' A', x0 + w * 0.15, y0 - 26, { size: 12, weight: 700, color: K.c3 });
        D.text(c, 'V₁ = ' + f(V1, 3) + ' V', x0 + w * 0.5, y0 + 28, { align: 'center', size: 12, color: K.c1, weight: 600 });
        D.text(c, 'V₂ = ' + f(V2, 3) + ' V', x0 + w - 16, y0 + h / 2 + 40, { align: 'right', size: 12, color: K.c2, weight: 600 });
      } else {
        var xa = x0 + w * 0.55, xb = x0 + w;
        D.line(c, x0, y0, xb, y0, K.ink, 2.5); D.line(c, x0, y0 + h, xb, y0 + h, K.ink, 2.5); D.line(c, x0, y0, x0, y0 + h, K.ink, 2.5);
        D.line(c, xa, y0, xa, y0 + h, K.ink, 2.5); D.line(c, xb, y0, xb, y0 + h, K.ink, 2.5);
        resistor(c, xa, y0 + h / 2, true, 'R₁ = ' + p.R1 + ' Ω', K.c1); resistor(c, xb, y0 + h / 2, true, 'R₂ = ' + p.R2 + ' Ω', K.c2);
        D.circle(c, xa, y0, 4, K.ink); D.circle(c, xa, y0 + h, 4, K.ink);
        D.text(c, 'I₁ = ' + f(I1, 3) + ' A', xa - 12, y0 + h * 0.22, { align: 'right', size: 12, color: K.c1, weight: 700 });
        D.text(c, 'I₂ = ' + f(I2, 3) + ' A', xb - 12, y0 + h * 0.22, { align: 'right', size: 12, color: K.c2, weight: 700 });
        D.arrow(c, x0 + w * 0.15, y0 - 12, x0 + w * 0.3, y0 - 12, K.c3, 2.5); D.text(c, 'I = ' + f(I, 3) + ' A', x0 + w * 0.15, y0 - 26, { size: 12, weight: 700, color: K.c3 });
        D.text(c, 'junction', xa + 8, y0 + 14, { size: 10.5, color: K.muted });
      }
      battery(c, x0, y0 + h / 2, '12 V');
      S.set('Rt', f(Rt, 3) + ' Ω'); S.set('I', f(I, 3) + ' A');
      S.set('r1', f(V1, 3) + ' V, ' + f(I1, 3) + ' A'); S.set('r2', f(V2, 3) + ' V, ' + f(I2, 3) + ' A');
      S.msg(par ? 'Junction rule: ' + f(I1, 3) + ' + ' + f(I2, 3) + ' = ' + f(I, 3) + ' A ✓' : 'Loop rule: ' + f(V1, 3) + ' + ' + f(V2, 3) + ' = 12 V ✓');
    }
  });

  /* 9. Action potential */
  function spikeShape(u) { // u = ms after threshold crossing -> mV
    if (u < 0.5) return -55 + 85 * (u / 0.5);
    if (u < 2.0) return 30 - 110 * ((u - 0.5) / 1.5);
    if (u < 8) return -80 + 10 * (1 - Math.exp(-(u - 2) / 1.8));
    return -70;
  }
  Sim.make('sim-action', {
    aspect: 0.48, animate: true,
    controls: [{ k: 's', label: 'Stimulus strength (mV rise if held)', min: 0, max: 40, step: 1, v: 10, unit: 'mV' }],
    buttons: [{ label: 'Stimulate', click: function (S) { S.st.t = 0; S.st.on = true; S.st.trace = []; S.st.spike = null; S.st.Vp = -70; S.st.peak = -70; } }],
    reads: [{ k: 'V', label: 'Membrane voltage', big: true }, { k: 'st', label: 'What is happening' }, { k: 'pk', label: 'Peak reached' }],
    init: function (S) { S.st.t = 0; S.st.on = false; S.st.trace = []; S.st.Vp = -70; S.st.peak = -70; S.st.spike = null; },
    draw: function (S, c, W, H, dt) {
      var K = C(), st = S.st, tau = 5, pulse = 8, Tm = 30, ms = dt * 1000 / 80; // 1 ms on screen = 80 ms real
      var V = st.Vp, phase = 'resting';
      if (st.on && st.t < Tm) {
        var steps = Math.max(1, Math.ceil(ms / 0.05)), h = ms / steps;
        for (var i = 0; i < steps; i++) {
          st.t += h;
          if (st.spike !== null) { V = spikeShape(st.t - st.spike); }
          else { var I = st.t < pulse ? S.p.s : 0; V += h * (-(V + 70) + I) / tau; if (V >= -55) { st.spike = st.t; V = -55; } }
        }
        st.Vp = V; st.peak = Math.max(st.peak, V);
        st.trace.push([st.t, V]);
      }
      if (st.spike !== null) { var u = st.t - st.spike; phase = u < 0.5 ? 'Na⁺ channels open: Na⁺ rushes in' : u < 2 ? 'K⁺ channels open: K⁺ flows out' : u < 6 ? 'hyperpolarised, refractory' : 'back at rest'; }
      else if (st.on && st.t < pulse) phase = 'stimulus charging the membrane (RC)';
      else if (st.on) phase = st.t < Tm ? 'below threshold: relaxing back' : 'no spike';
      D.clear(c, W, H);
      var box = { x: W * 0.08, y: H * 0.08, w: W * 0.66, h: H * 0.8 };
      var g = D.graph(c, box, { x0: 0, x1: Tm, y0: -90, y1: 40, xl: 'time (ms) →', yl: 'membrane voltage (mV)', hlines: [{ y: -55, label: 'threshold −55 mV', color: K.c2 }, { y: -70, label: 'rest −70 mV', color: K.faint }] }, [{ pts: st.trace, color: K.c1, w: 3 }]);
      [0, 5, 10, 15, 20, 25, 30].forEach(function (u) { D.text(c, String(u), g.px(u), box.y + box.h + 12, { size: 10, align: 'center', color: K.faint }); });
      [-80, -40, 0, 40].forEach(function (u) { D.text(c, String(u), box.x - 4, g.py(u), { size: 10, align: 'right', color: K.faint }); });
      if (st.on) D.rect(c, g.px(0), box.y + box.h - 8, g.px(pulse) - g.px(0), 8, 'rgba(194,65,12,0.5)', null, 0);
      // channels panel
      var px = W * 0.79, u2 = st.spike !== null ? st.t - st.spike : -1;
      var naOpen = u2 >= 0 && u2 < 0.6, kOpen = u2 >= 0.4 && u2 < 3;
      D.text(c, 'Ion channels', px, H * 0.14, { size: 12.5, weight: 700 });
      [['Na⁺ channel', naOpen, K.c5], ['K⁺ channel', kOpen, K.c4]].forEach(function (q, j) {
        var y = H * 0.3 + j * H * 0.25;
        D.rect(c, px, y - 18, W * 0.16, 36, q[1] ? q[2] : K.surface, K.line, 8, 1);
        D.text(c, q[0] + (q[1] ? ': OPEN' : ': closed'), px + 8, y, { size: 11.5, weight: 600, color: q[1] ? '#fff' : K.muted });
      });
      D.text(c, 'orange bar = stimulus', px, H * 0.86, { size: 11, color: K.muted });
      S.set('V', f(V, 3) + ' mV'); S.set('st', phase); S.set('pk', st.on ? f(st.peak, 3) + ' mV' : '–');
    }
  });
})();
